import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "domain";
    const sortDirection = searchParams.get("sortDirection") || "asc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // domain_view02から必要なデータを取得
    let query = supabase
      .from("domain_view02")
      .select("*", { count: "exact" });

    // 検索フィルター
    if (search) {
      query = query.ilike("domain", `%${search}%`);
    }

    // ソート処理
    if (sortField && sortDirection && (sortDirection === "asc" || sortDirection === "desc")) {
      const ascending = sortDirection === "asc";
      
      switch (sortField) {
        case "domain":
          query = query.order("domain", { ascending });
          break;
        case "active_count":
          query = query.order("active_count", { ascending, nullsFirst: false });
          break;
        case "suspended_count":
          query = query.order("suspended_count", { ascending, nullsFirst: false });
          break;
        case "temp_locked_count":
          query = query.order("temp_locked_count", { ascending, nullsFirst: false });
          break;
        case "total_count":
          // 総数でソート（計算フィールド）
          query = query.order("active_count", { ascending, nullsFirst: false });
          break;
        default:
          query = query.order("domain", { ascending });
          break;
      }
    } else {
      query = query.order("domain", { ascending: true });
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("ドメイン・ステータス別データの取得エラー:", error);
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 総数計算を追加
    const enrichedData = data?.map(item => ({
      ...item,
      total_count: (item.active_count || 0) + (item.suspended_count || 0) + (item.temp_locked_count || 0)
    })) || [];

    // レスポンスにキャッシュヘッダーを追加
    const response = NextResponse.json({
      domains: enrichedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
    
    response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=120');
    
    return response;
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}