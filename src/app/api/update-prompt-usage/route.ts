import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "プロンプトIDが必要です" },
        { status: 400 }
      );
    }

    // 1日の生成制限チェック（100個制限）
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    console.log(`🕒 今日の生成制限チェック中... (${todayStart.toISOString()} ～ ${todayEnd.toISOString()})`);

    const { count: todayGeneratedCount, error: countError } = await supabase
      .from("gemini_image_prompts")
      .select("*", { count: "exact", head: true })
      .gte("last_used_at", todayStart.toISOString())
      .lt("last_used_at", todayEnd.toISOString());

    if (countError) {
      console.error("❌ 今日の生成数確認エラー:", countError);
      return NextResponse.json(
        { error: "今日の生成数確認に失敗しました" },
        { status: 500 }
      );
    }

    const dailyGenerated = todayGeneratedCount || 0;
    console.log(`📊 今日の生成済み数: ${dailyGenerated}/100`);

    if (dailyGenerated >= 100) {
      console.log("🚫 1日の生成制限に達しました (100個/日)");
      return NextResponse.json(
        { 
          error: "1日の画像生成制限に達しました",
          daily_limit_reached: true,
          today_generated: dailyGenerated,
          limit: 100
        },
        { status: 429 } // Too Many Requests
      );
    }

    console.log(`🔄 プロンプト使用状況を更新中: ID=${id} (今日: ${dailyGenerated + 1}/100)`);

    // used_countを+1、last_used_atを現在時刻に更新
    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .update({
        used_count: supabase.rpc("increment_used_count", { prompt_id: id }),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロンプト更新エラー:", error);
      
      // フォールバック: 直接的な更新を試行
      try {
        const { data: currentData, error: fetchError } = await supabase
          .from("gemini_image_prompts")
          .select("used_count")
          .eq("id", id)
          .single();

        if (!fetchError && currentData) {
          const { error: updateError } = await supabase
            .from("gemini_image_prompts")
            .update({
              used_count: currentData.used_count + 1,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            console.error("❌ フォールバック更新も失敗:", updateError);
            return NextResponse.json(
              { error: "プロンプトの更新に失敗しました" },
              { status: 500 }
            );
          }
          
          console.log(`✅ フォールバックでプロンプト更新成功: ID=${id}, new_used_count=${currentData.used_count + 1}`);
        }
      } catch (fallbackError) {
        console.error("❌ フォールバック処理エラー:", fallbackError);
        return NextResponse.json(
          { error: "プロンプトの更新に失敗しました" },
          { status: 500 }
        );
      }
    } else {
      console.log(`✅ プロンプト更新成功: ID=${id}, new_used_count=${data.used_count}`);
    }

    return NextResponse.json({
      success: true,
      message: "プロンプトの使用状況を更新しました",
      id,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 プロンプト更新処理エラー:", error);
    return NextResponse.json(
      { error: "プロンプト更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}