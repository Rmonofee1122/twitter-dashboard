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
    const { count: totalCount, error: totalError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("累計アカウント数取得エラー:", totalError);
    }

    // データを効率的に分類
    let todayCount = 0;
    let yesterdayCount = 0;
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    recentData?.forEach(item => {
      const itemDate = new Date(item.created_at);
      
      // 今日
      if (itemDate >= todayStart && itemDate < todayEnd) {
        todayCount++;
      }
      
      // 昨日
      if (itemDate >= yesterdayStart && itemDate < todayStart) {
        yesterdayCount++;
      }
      
      // 今週（過去7日間）
      if (itemDate >= weekAgo) {
        thisWeekCount++;
      }
      
      // 前週（7-14日前）
      if (itemDate >= twoWeeksAgo && itemDate < weekAgo) {
        lastWeekCount++;
      }
    });

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
