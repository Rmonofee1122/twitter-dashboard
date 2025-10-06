import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { proxies } = await request.json();

    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) {
      return NextResponse.json(
        { error: "プロキシのリストが必要です" },
        { status: 400 }
      );
    }

    console.log(
      `📦 バルクインサート開始: ${proxies.length}個のプロキシを処理中`
    );

    const validProxies = proxies
      .map((ip: string) => ip?.trim())
      .filter((ip: string) => ip && ip.length > 0);

    if (validProxies.length === 0) {
      return NextResponse.json(
        { error: "有効なプロキシIPが見つかりませんでした" },
        { status: 400 }
      );
    }

    // 既存のテーブルデータを全て削除
    console.log("🗑️ 既存のプロキシデータを削除中...");
    const { error: deleteError } = await supabase
      .from("residential_proxy_list")
      .delete()
      .neq("id", 0); // 全件削除

    if (deleteError) {
      console.error("❌ 既存データ削除エラー:", deleteError);
      return NextResponse.json(
        { error: "既存データの削除に失敗しました" },
        { status: 500 }
      );
    }

    console.log("✅ 既存データの削除完了");

    const insertData = validProxies.map((ip) => ({
      ip,
      used_count: 0,
      last_used_at: null,
    }));

    const { data, error } = await supabase
      .from("residential_proxy_list")
      .insert(insertData)
      .select("*");

    if (error) {
      console.error("❌ プロキシバルクインサートエラー:", error);
      return NextResponse.json(
        { error: "プロキシの一括登録に失敗しました" },
        { status: 500 }
      );
    }

    console.log(
      `✅ プロキシバルクインサート成功: ${validProxies.length}個のプロキシを登録`
    );

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      total: validProxies.length,
      message: `${validProxies.length}個のプロキシを登録しました`,
    });
  } catch (error) {
    console.error("💥 プロキシバルクインサートエラー:", error);
    return NextResponse.json(
      { error: "プロキシ一括登録処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
