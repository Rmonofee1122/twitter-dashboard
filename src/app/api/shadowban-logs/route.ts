import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const twitterId = searchParams.get("twitter_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!twitterId) {
      return NextResponse.json(
        { error: "twitter_id is required" },
        { status: 400 }
      );
    }

    // 指定されたtwitter_idのシャドバンログを取得（最新順）
    const { data, error } = await supabase
      .from("shadowban_account_log")
      .select(`
        log_id,
        logged_at,
        status,
        not_found,
        suspend,
        protect,
        no_tweet,
        search_ban,
        search_suggestion_ban,
        no_reply,
        ghost_ban,
        reply_deboosting
      `)
      .eq("twitter_id", twitterId)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Shadowban logs取得エラー:", error);
      return NextResponse.json(
        { error: "ログデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    // レスポンスにキャッシュヘッダーを追加
    const response = NextResponse.json({
      logs: data || [],
      total: data?.length || 0,
    });
    
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60'); // 1分間キャッシュ
    
    return response;
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}