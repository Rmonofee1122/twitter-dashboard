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
  today.setHours(23, 59, 59, 999); // 今日の終わりまで含める

  // 今日から過去〇日間の開始日を計算（今日を含む）
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);


  // 期間内のすべてのデータを一度に取得（日付のみ）
  const { data, error } = await supabase
    .from("twitter_create_logs")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", today.toISOString());

  if (error) {
    console.error("データ取得エラー:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }


  // 累計の初期値を取得
  let cumulative = await getCumulativeCount(startDate);

  // 日付ごとにグルーピング（1回のループで効率的に処理）
  const dateCountMap = new Map<string, number>();
  
  // データを日付別にカウント
  data?.forEach(item => {
    const dateStr = new Date(item.created_at).toISOString().split("T")[0];
    dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
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
  today.setHours(23, 59, 59, 999);

  // 今日から過去〇日間の開始日を計算
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));
  startDate.setHours(0, 0, 0, 0);

  // 期間内のデータを一度に取得
  const { data, error } = await supabase
    .from("twitter_create_logs")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", today.toISOString());

  if (error) {
    console.error("週別データ取得エラー:", error);
    return NextResponse.json(
      { error: "週別データの取得に失敗しました" },
      { status: 500 }
    );
  }

  const weeks = Math.ceil(totalDays / 7);
  const weeklyData = [];

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const count = data?.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= weekStart && itemDate <= weekEnd;
    }).length || 0;

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

  // 月別データは効率化のため既存の個別クエリを維持
  // （月数が少ないため、個別クエリでも影響は軽微）
  for (let i = months - 1; i >= 0; i--) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() - i);

    const monthStart = new Date(monthEnd);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 月末を設定
    const actualMonthEnd = new Date(monthStart);
    actualMonthEnd.setMonth(actualMonthEnd.getMonth() + 1);
    actualMonthEnd.setDate(0);
    actualMonthEnd.setHours(23, 59, 59, 999);

    const { count, error } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", actualMonthEnd.toISOString());

    if (error) {
      console.error("月別データ取得エラー:", error);
      continue;
    }

    // 前月のデータを取得して成長率を計算
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(prevMonthStart);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() + 1);
    prevMonthEnd.setDate(0);
    prevMonthEnd.setHours(23, 59, 59, 999);

    const { count: prevCount } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevMonthStart.toISOString())
      .lte("created_at", prevMonthEnd.toISOString());

    const growth =
      prevCount && prevCount > 0
        ? (((count || 0) - prevCount) / prevCount) * 100
        : 0;

    monthlyData.push({
      month: monthStart.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
      }),
      count: count || 0,
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