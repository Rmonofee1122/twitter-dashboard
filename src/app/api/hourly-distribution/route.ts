import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate: string;
    
    if (dateParam) {
      targetDate = dateParam;
    } else {
      // デフォルトで昨日の日付を使用
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split("T")[0];
    }

    // 指定された日付の開始と終了時刻を計算
    const startDateTime = new Date(`${targetDate}T00:00:00`);
    const endDateTime = new Date(`${targetDate}T23:59:59.999`);

    // 時間別のデータを取得
    const { data, error } = await supabase
      .from("twitter_create_logs")
      .select("created_at")
      .gte("created_at", startDateTime.toISOString())
      .lte("created_at", endDateTime.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("時間別データ取得エラー:", error);
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 時間別にグループ化
    const hourlyCounts: Record<number, number> = {};
    
    // 0-23の全ての時間を初期化
    for (let hour = 0; hour < 24; hour++) {
      hourlyCounts[hour] = 0;
    }

    // データを時間別に集計
    data.forEach((record) => {
      const hour = new Date(record.created_at).getHours();
      hourlyCounts[hour]++;
    });

    // 総数を計算
    const totalCount = data.length;

    // チャートデータを構築
    const chartData = Object.entries(hourlyCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }));

    // サマリー統計を計算
    const peakHour = chartData.reduce((max, current) => 
      current.count > max.count ? current : max
    );

    const summary = {
      totalAccounts: totalCount,
      peakHour: peakHour.hour,
      peakCount: peakHour.count,
      averageHourly: Math.round(totalCount / 24),
      date: targetDate,
    };

    return NextResponse.json({
      chartData,
      summary,
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}