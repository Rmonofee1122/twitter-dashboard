import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "プロンプトのリストが必要です" },
        { status: 400 }
      );
    }

    console.log(
      `📦 バルクインサート開始: ${prompts.length}個のプロンプトを処理中`
    );

    const validPrompts = prompts.filter(
      (item) => item.prompt && item.prompt.trim().length > 0
    );

    if (validPrompts.length === 0) {
      return NextResponse.json(
        { error: "有効なプロンプトが見つかりませんでした" },
        { status: 400 }
      );
    }

    const insertData = validPrompts.map((item) => ({
      prompt: item.prompt.trim(),
      tags: Array.isArray(item.tags) ? item.tags : ["インポート"],
      favorite: false,
      used_count: 0,
      last_used_at: null,
    }));

    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .insert(insertData)
      .select("*");

    if (error) {
      console.error("❌ プロンプトバルクインサートエラー:", error);
      return NextResponse.json(
        { error: "プロンプトの一括登録に失敗しました" },
        { status: 500 }
      );
    }

    console.log(
      `✅ プロンプトバルクインサート成功: 新規登録=${data?.length || 0}個`
    );

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      total: validPrompts.length,
      message: `${data?.length || 0}個のプロンプトを新規登録しました`,
    });
  } catch (error) {
    console.error("💥 プロンプトバルクインサートエラー:", error);
    return NextResponse.json(
      { error: "プロンプト一括登録処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}