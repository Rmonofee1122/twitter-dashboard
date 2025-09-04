import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 必要な列のみを取得してパフォーマンス向上
    let query = supabase
      .from("shadowban_account_log")
      .select(`
        log_id,
        logged_at,
        id,
        twitter_id,
        name,
        screen_name,
        status,
        not_found,
        suspend,
        protect,
        no_tweet,
        search_ban,
        search_suggestion_ban,
        no_reply,
        ghost_ban,
        reply_deboosting,
        follower_count,
        following_count,
        posts_count
      `, { count: "exact" });

    // 検索フィルター
    if (search) {
      query = query.or(
        `twitter_id.ilike.%${search}%,name.ilike.%${search}%,screen_name.ilike.%${search}%`
      );
    }

    // ステータスフィルター
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "normal":
          query = query
            .is("suspend", false)
            .is("search_ban", false)
            .is("search_suggestion_ban", false)
            .is("ghost_ban", false)
            .is("not_found", false);
          break;
        case "shadowban":
          query = query.or(
            "search_ban.eq.true,search_suggestion_ban.eq.true,ghost_ban.eq.true"
          );
          break;
        case "suspended":
          query = query.or("suspend.eq.true,status.eq.suspended");
          break;
        case "not_found":
          query = query.eq("not_found", true);
          break;
      }
    }

    // 日付フィルター
    if (startDate) {
      query = query.gte("logged_at", startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("logged_at", endDateTime.toISOString());
    }

    // ソートとページネーション
    query = query
      .order("logged_at", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("シャドBANログの取得エラー:", error);
      return NextResponse.json(
        { error: "ログデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    // レスポンスにキャッシュヘッダーを追加
    const response = NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
    
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return response;
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}