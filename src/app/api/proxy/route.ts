import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export interface ProxyInfo {
  id: number;
  ip: string;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortField = searchParams.get("sortField") || "used_count";
    const sortDirection = searchParams.get("sortDirection") || "asc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    console.log(`📊 プロキシ一覧を取得中: page=${page}, limit=${limit}, sort=${sortField}(${sortDirection})`);

    // クエリを構築
    let query = supabase
      .from("dc_proxy_list")
      .select("*", { count: "exact" });

    // ソート処理
    const ascending = sortDirection === "asc";
    switch (sortField) {
      case "id":
        query = query.order("id", { ascending });
        break;
      case "ip":
        query = query.order("ip", { ascending });
        break;
      case "used_count":
        query = query.order("used_count", { ascending });
        break;
      case "last_used_at":
        query = query.order("last_used_at", { ascending });
        break;
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      default:
        query = query.order("used_count", { ascending: true }); // デフォルト: used_count昇順
        break;
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ プロキシデータ取得エラー:", error);
      return NextResponse.json(
        { error: "プロキシデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ プロキシデータ取得成功: ${data?.length || 0}件 / 合計${count || 0}件`);

    return NextResponse.json({
      proxies: data || [],
      total: count || 0,
      page,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 プロキシAPI エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロキシの使用回数を更新するPOSTエンドポイント
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "プロキシIDが必要です" },
        { status: 400 }
      );
    }

    console.log(`🔄 プロキシ使用状況を更新中: ID=${id}`);

    // used_countを+1、last_used_atを現在時刻に更新
    const { data, error } = await supabase
      .from("dc_proxy_list")
      .update({
        used_count: supabase.rpc("increment_used_count", { id }),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロキシ更新エラー:", error);
      return NextResponse.json(
        { error: "プロキシ情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ プロキシ更新成功: ID=${id}, new_used_count=${data.used_count}`);

    return NextResponse.json({
      success: true,
      proxy: data,
      message: "プロキシの使用状況を更新しました",
    });
  } catch (error) {
    console.error("💥 プロキシ更新エラー:", error);
    return NextResponse.json(
      { error: "プロキシ更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}