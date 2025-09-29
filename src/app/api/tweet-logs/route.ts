import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const twitterId = searchParams.get("twitter_id");
    const limit = searchParams.get("limit") || "20";

    if (!twitterId) {
      return NextResponse.json(
        { error: "twitter_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // twitter_tweet_logテーブルからデータを取得
    const { data: logs, error } = await supabase
      .from("twitter_tweet_log")
      .select("*")
      .eq("twitter_id", twitterId)
      .order("tweet_created_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error("Error fetching tweet logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch tweet logs", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0,
    });
  } catch (error) {
    console.error("Tweet logs API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}