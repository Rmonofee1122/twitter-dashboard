import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "";
    const sortDirection = searchParams.get("sortDirection") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("other_twitter_account").select("*", {
      count: "exact",
    });

    // 検索フィルター
    if (search) {
      query = query.or(
        `twitter_id.ilike.%${search}%,name.ilike.%${search}%,screen_name.ilike.%${search}%`
      );
    }

    // ソート処理
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";
      query = query.order(sortField, { ascending, nullsFirst: false });
    } else {
      // デフォルトソート
      query = query.order("created_at", { ascending: false });
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("他社アカウントデータの取得エラー:", error);
      return NextResponse.json(
        { error: "他社アカウントデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accounts: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
