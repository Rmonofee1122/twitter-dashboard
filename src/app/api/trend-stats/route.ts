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
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 昨日の開始時刻
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // 14日前の開始時刻（2週間分のデータを一度に取得）
    const twoWeeksAgo = new Date(todayStart);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 日別データ（過去30日間）
    const { data: dailyData, error: dailyError } = await supabase
      .from("status_count_per_day03")
      .select("created_date, total_count")
      .order("created_date", { ascending: true });

    if (dailyError) {
      console.error("日別データ取得エラー:", dailyError);
      throw dailyError;
    }

    // 過去14日間のデータを一度に取得（created_atのみ）
    const { data: recentData, error: recentError } = await supabase
      .from("twitter_create_logs")
      .select("created_at")
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", todayEnd.toISOString());

    if (recentError) {
      console.error("過去2週間データ取得エラー:", recentError);
      throw recentError;
    }

    // 累計アカウント数（別クエリで効率的に取得）
    const totalCount = dailyData?.reduce(
      (acc, item) => acc + item.total_count,
      0
    );

    // 今日の作成数
    const todayCount = dailyData?.reduce(
      (acc, item) =>
        item.created_date === todayStart ? acc + item.total_count : acc,
      0
    );

    // 昨日の作成数
    const yesterdayCount = dailyData?.reduce(
      (acc, item) =>
        item.created_date === yesterdayStart ? acc + item.total_count : acc,
      0
    );

    // 今週の作成数（過去7日間）
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split("T")[0];
    const thisWeekCount = dailyData?.reduce(
      (acc, item) =>
        item.created_date >= weekAgoString ? acc + item.total_count : acc,
      0
    );

    // 前週の作成数（過去7日間）
    const lastWeekCount = dailyData?.reduce(
      (acc, item) =>
        item.created_date >= twoWeeksAgo ? acc + item.total_count : acc,
      0
    );

    const trendStats = {
      today: todayCount,
      yesterday: yesterdayCount,
      thisWeek: thisWeekCount,
      lastWeek: lastWeekCount,
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
