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

    // 大量のプロキシを処理するため、チャンク分割して既存チェック
    const CHUNK_SIZE = 100;
    const existingIps = new Set<string>();

    for (let i = 0; i < validProxies.length; i += CHUNK_SIZE) {
      const chunk = validProxies.slice(i, i + CHUNK_SIZE);
      const { data: existingProxies, error: checkError } = await supabase
        .from("residential_proxy_list")
        .select("ip")
        .in("ip", chunk);

      if (checkError) {
        console.error("❌ 既存プロキシチェックエラー:", checkError);
        return NextResponse.json(
          { error: "既存プロキシのチェックに失敗しました" },
          { status: 500 }
        );
      }

      existingProxies?.forEach((p) => existingIps.add(p.ip));
    }
    const newProxies = validProxies.filter((ip) => !existingIps.has(ip));

    if (newProxies.length === 0) {
      return NextResponse.json(
        { error: "すべてのプロキシIPが既に登録されています" },
        { status: 409 }
      );
    }

    const insertData = newProxies.map((ip) => ({
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

    const skipperesidentialount = validProxies.length - newProxies.length;

    console.log(
      `✅ プロキシバルクインサート成功: 新規登録=${newProxies.length}個, スキップ=${skipperesidentialount}個`
    );

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      skipped: skipperesidentialount,
      total: validProxies.length,
      message: `${newProxies.length}個のプロキシを新規登録しました${
        skipperesidentialount > 0
          ? ` (${skipperesidentialount}個は既に登録済みのためスキップ)`
          : ""
      }`,
    });
  } catch (error) {
    console.error("💥 プロキシバルクインサートエラー:", error);
    return NextResponse.json(
      { error: "プロキシ一括登録処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
