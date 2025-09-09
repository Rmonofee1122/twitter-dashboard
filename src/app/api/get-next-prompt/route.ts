import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 次のプロンプトを取得中...");

    // used_countが最小かつlast_used_atが最も古いプロンプトを取得
    // 同一条件の場合はランダムに選択
    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .select("*")
      .order("used_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(5); // 上位5件を取得してからランダム選択

    if (error) {
      console.error("❌ プロンプト取得エラー:", error);
      return NextResponse.json(
        { error: "プロンプトの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log("❌ 利用可能なプロンプトが見つかりません");
      return NextResponse.json(
        { error: "利用可能なプロンプトがありません" },
        { status: 404 }
      );
    }

    // 同一条件の場合はランダムに選択
    const selectedPrompt = data[Math.floor(Math.random() * data.length)];
    
    console.log(`✅ プロンプト選択: ID=${selectedPrompt.id}, used_count=${selectedPrompt.used_count}, last_used_at=${selectedPrompt.last_used_at}`);
    console.log(`📝 プロンプト内容: "${selectedPrompt.prompt}"`);

    return NextResponse.json({
      success: true,
      prompt: selectedPrompt.prompt,
      id: selectedPrompt.id,
      used_count: selectedPrompt.used_count,
      last_used_at: selectedPrompt.last_used_at,
      tags: selectedPrompt.tags,
    });
  } catch (error) {
    console.error("💥 プロンプト取得処理エラー:", error);
    return NextResponse.json(
      { error: "プロンプト取得処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}