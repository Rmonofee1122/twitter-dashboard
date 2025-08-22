import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    // デフォルトで過去30日間を設定
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      endDate = today.toISOString().split('T')[0];
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    // 時間別作成数を取得
    const { data, error } = await supabase
      .from("twitter_create_logs")
      .select("created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate + " 23:59:59");

    if (error) {
      console.error("時間別統計データの取得エラー:", error);
      return NextResponse.json(
        { error: "時間別統計データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 時間別に集計
    const hourlyCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyCounts[i] = 0;
    }

    data?.forEach((record) => {
      const hour = new Date(record.created_at).getHours();
      hourlyCounts[hour]++;
    });

    const totalAccounts = data?.length || 0;

    // チャートデータを作成
    const chartData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyCounts[hour],
      percentage: totalAccounts > 0 ? (hourlyCounts[hour] / totalAccounts) * 100 : 0
    }));

    // 統計サマリーを計算
    const peakHourData = chartData.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    
    const averageHourly = totalAccounts / 24;

    return NextResponse.json({
      chartData,
      summary: {
        totalAccounts,
        peakHour: peakHourData.hour,
        peakCount: peakHourData.count,
        averageHourly: Math.round(averageHourly * 10) / 10,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}