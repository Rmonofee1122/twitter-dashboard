import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const range = searchParams.get("range") || "30days";

    switch (period) {
      case "daily":
        return await getDailyData(range);
      case "weekly":
        return await getWeeklyData(range);
      case "monthly":
        return await getMonthlyData(range);
      default:
        return await getDailyData(range);
    }
  } catch (error) {
    console.error("トレンドデータの取得に失敗しました:", error);
    return NextResponse.json(
      { error: "トレンドデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}

async function getDailyData(range: string) {
  const days = getRangeDays(range);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 今日から過去〇日間の開始日を計算（今日を含む）
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startDateStr = startDate.toISOString().split("T")[0];

  // create_count_per_dayビューから期間内のデータを取得
  const { data, error } = await supabase
    .from("create_count_per_day")
    .select("created_date, total_count")
    .gte("created_date", startDateStr)
    .lte("created_date", todayStr)
    .order("created_date", { ascending: true });

  if (error) {
    console.error("データ取得エラー:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }

  // 累計の初期値を取得
  let cumulative = await getCumulativeCount(startDate);

  // 日付別データをマップに変換
  const dateCountMap = new Map<string, number>();
  data?.forEach((item) => {
    dateCountMap.set(item.created_date, item.total_count);
  });

  // 日付範囲の配列を生成
  const dailyData = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const count = dateCountMap.get(dateStr) || 0;
    cumulative += count;

    dailyData.push({
      date: dateStr,
      count,
      cumulative,
    });
  }

  return NextResponse.json(dailyData);
}

async function getWeeklyData(range: string) {
  const totalDays = getRangeDays(range);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 今日から過去〇日間の開始日を計算
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));
  const startDateStr = startDate.toISOString().split("T")[0];

  // create_count_per_dayビューから期間内のデータを取得
  const { data, error } = await supabase
    .from("create_count_per_day")
    .select("created_date, total_count")
    .gte("created_date", startDateStr)
    .lte("created_date", todayStr)
    .order("created_date", { ascending: true });

  if (error) {
    console.error("週別データ取得エラー:", error);
    return NextResponse.json(
      { error: "週別データの取得に失敗しました" },
      { status: 500 }
    );
  }

  // 日付別データをマップに変換
  const dateCountMap = new Map<string, number>();
  data?.forEach((item) => {
    dateCountMap.set(item.created_date, item.total_count);
  });

  const weeks = Math.ceil(totalDays / 7);
  const weeklyData = [];

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let count = 0;
    for (let j = 0; j < 7; j++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + j);
      const dateStr = currentDate.toISOString().split("T")[0];
      count += dateCountMap.get(dateStr) || 0;
    }

    const weekNumber = getWeekNumber(weekStart);

    weeklyData.push({
      week: `${weekStart.getFullYear()}-W${weekNumber}`,
      count,
      average: Math.round((count / 7) * 10) / 10,
    });
  }

  return NextResponse.json(weeklyData);
}

async function getMonthlyData(range: string) {
  const totalDays = getRangeDays(range);
  const months = Math.ceil(totalDays / 30);
  const monthlyData = [];

  for (let i = months - 1; i >= 0; i--) {
    const today = new Date();
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() - i);

    const monthStart = new Date(monthEnd);
    monthStart.setDate(1);

    // 月末を設定
    const actualMonthEnd = new Date(monthStart);
    actualMonthEnd.setMonth(actualMonthEnd.getMonth() + 1);
    actualMonthEnd.setDate(0);

    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthEndStr = actualMonthEnd.toISOString().split("T")[0];

    // create_count_per_dayビューから月別データを取得
    const { data, error } = await supabase
      .from("create_count_per_day")
      .select("created_date, total_count")
      .gte("created_date", monthStartStr)
      .lte("created_date", monthEndStr);

    if (error) {
      console.error("月別データ取得エラー:", error);
      continue;
    }

    const count = data?.reduce((sum, item) => sum + item.total_count, 0) || 0;

    // 前月のデータを取得して成長率を計算
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(prevMonthStart);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() + 1);
    prevMonthEnd.setDate(0);

    const prevMonthStartStr = prevMonthStart.toISOString().split("T")[0];
    const prevMonthEndStr = prevMonthEnd.toISOString().split("T")[0];

    const { data: prevData } = await supabase
      .from("create_count_per_day")
      .select("created_date, total_count")
      .gte("created_date", prevMonthStartStr)
      .lte("created_date", prevMonthEndStr);

    const prevCount = prevData?.reduce((sum, item) => sum + item.total_count, 0) || 0;

    const growth =
      prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 0;

    monthlyData.push({
      month: monthStart.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
      }),
      count: count,
      growth: Number(growth.toFixed(1)),
    });
  }

  return NextResponse.json(monthlyData);
}

async function getCumulativeCount(beforeDate: Date): Promise<number> {
  const { count, error } = await supabase
    .from("twitter_create_logs")
    .select("*", { count: "exact", head: true })
    .lt("created_at", beforeDate.toISOString());

  if (error) {
    console.error("累計数取得エラー:", error);
    return 0;
  }

  return count || 0;
}

function getRangeDays(range: string): number {
  switch (range) {
    case "7days":
      return 7;
    case "30days":
      return 30;
    case "90days":
      return 90;
    case "1year":
      return 365;
    default:
      return 30;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
