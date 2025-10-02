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
      .from("other_tweet_log")
      .select(
        `
        id,
        twitter_id,
        name,
        screen_name,
        tweet_id,
        tweet_created_at,
        tweet_text,
        favorite_count,
        retweet_count,
        reply_count,
        quote_count,
        view_count,
        is_retweet,
        is_quote,
        media_type,
        media_url,
        created_at,
        updated_at
      `,
        { count: "exact" }
      )
      .order("id", { ascending: false });

    // 検索フィルター
    if (search) {
      query = query.or(
        `twitter_id.ilike.%${search}%,tweet_text.ilike.%${search}%,screen_name.ilike.%${search}%`
      );
    }

    // 日付フィルター
    if (startDate) {
      query = query.gte("tweet_created_at", startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("tweet_created_at", endDateTime.toISOString());
    }

    // ソートとページネーション
    query = query
      .order("tweet_created_at", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("他社ツイート履歴の取得エラー:", error);
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

    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");

    return response;
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
