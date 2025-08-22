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

      endDate = today.toISOString().split("T")[0];
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
    }

    // cumulative_create_count_per_dayビューから累計データを取得
    const { data, error } = await supabase
      .from("cumulative_create_count_per_day")
      .select("created_date, cumulative_count")
      .gte("created_date", startDate)
      .lte("created_date", endDate)
      .order("created_date", { ascending: true });

    if (error) {
      console.error("累計統計データの取得エラー:", error);
      return NextResponse.json(
        { error: "累計統計データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 指定期間の全日付を生成
    const generateDateRange = (start: string, end: string) => {
      const dates = [];
      const startDate = new Date(start);
      const endDate = new Date(end);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const allDates = generateDateRange(startDate, endDate);

    // ビューからのデータをマップに変換
    const cumulativeDataMap = new Map<string, number>();
    data?.forEach((record) => {
      cumulativeDataMap.set(record.created_date, record.cumulative_count);
    });

    // 日別データと累計データを生成
    interface ChartDataItem {
      date: string;
      count: number;
      cumulative: number;
    }

    const chartData: ChartDataItem[] = [];
    let previousCumulative = 0;

    // 期間開始前の累計数を取得（最初の日の累計数から逆算）
    if (data && data.length > 0) {
      const firstRecord = data[0];
      // 最初の日の前日の累計数を計算するため、create_count_per_dayビューから取得
      const { data: beforeData } = await supabase
        .from("create_count_per_day")
        .select("total_count")
        .eq("created_date", firstRecord.created_date);

      if (beforeData && beforeData.length > 0) {
        previousCumulative =
          firstRecord.cumulative_count - beforeData[0].total_count;
      }
    }

    allDates.forEach((date) => {
      const currentCumulative =
        cumulativeDataMap.get(date) || previousCumulative;
      const dailyCount = currentCumulative - previousCumulative;

      chartData.push({
        date,
        count: Math.max(0, dailyCount), // 負の値を防ぐ
        cumulative: currentCumulative,
      });

      previousCumulative = currentCumulative;
    });

    // 統計サマリーを計算
    const totalAccounts = chartData.reduce((sum, item) => sum + item.count, 0);
    const averageDaily = totalAccounts / allDates.length;
    const maxDaily = Math.max(...chartData.map((item) => item.count), 0);

    return NextResponse.json({
      chartData,
      summary: {
        totalAccounts,
        averageDaily: Math.round(averageDaily * 10) / 10,
        maxDaily,
        dateRange: { startDate, endDate },
      },
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
