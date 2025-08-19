import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();

    // 今日の開始時刻 (00:00:00)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 昨日の開始時刻
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // 7日前の開始時刻
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 14日前の開始時刻（前週比較用）
    const twoWeeksAgo = new Date(todayStart);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 1. 今日作成されたアカウント数
    const { count: todayCount, error: todayError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .lt(
        "created_at",
        new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString()
      );

    if (todayError) {
      console.error("今日のアカウント作成数取得エラー:", todayError);
    }

    // 2. 昨日作成されたアカウント数
    const { count: yesterdayCount, error: yesterdayError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString());

    if (yesterdayError) {
      console.error("昨日のアカウント作成数取得エラー:", yesterdayError);
    }

    // 3. 今週（過去7日間）作成されたアカウント数
    const { count: thisWeekCount, error: thisWeekError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    if (thisWeekError) {
      console.error("今週のアカウント作成数取得エラー:", thisWeekError);
    }

    // 4. 前週（7-14日前）作成されたアカウント数
    const { count: lastWeekCount, error: lastWeekError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString());

    if (lastWeekError) {
      console.error("前週のアカウント作成数取得エラー:", lastWeekError);
    }

    // 5. 累計アカウント数
    const { count: totalCount, error: totalError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("累計アカウント数取得エラー:", totalError);
    }

    const trendStats = {
      today: todayCount || 0,
      yesterday: yesterdayCount || 0,
      thisWeek: thisWeekCount || 0,
      lastWeek: lastWeekCount || 0,
      cumulative: totalCount || 0,
    };

    return NextResponse.json(trendStats);
  } catch (error) {
    console.error("トレンド統計データの取得に失敗しました:", error);
    return NextResponse.json(
      { error: "トレンド統計データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
