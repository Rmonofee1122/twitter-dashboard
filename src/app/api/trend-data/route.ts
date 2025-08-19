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
  today.setHours(0, 0, 0, 0);

  // 今日から過去〇日間の開始日を計算（今日を含む）
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));

  console.log(`=== Daily Data Processing ===`);
  console.log(`Range: ${range}, Days: ${days}`);
  console.log(`Start Date: ${startDate.toISOString()}`);
  console.log(`Today: ${today.toISOString()}`);

  // 日付ごとにグループ化（効率的な方法）
  const dailyData = [];
  let cumulative = await getCumulativeCount(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    
    // その日の開始と終了時刻を設定
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // その日のアカウント作成数を直接カウント
    const { count, error } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart.toISOString())
      .lte("created_at", dayEnd.toISOString());

    if (error) {
      console.error(`Error counting for ${dateStr}:`, error);
      continue;
    }

    const dayCount = count || 0;
    cumulative += dayCount;
    
    console.log(`Date: ${dateStr}, Count: ${dayCount}, Cumulative: ${cumulative}`);

    dailyData.push({
      date: dateStr,
      count: dayCount,
      cumulative,
    });
  }

  return NextResponse.json(dailyData);
}

async function getWeeklyData(range: string) {
  const totalDays = getRangeDays(range);
  const weeks = Math.ceil(totalDays / 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 今日から過去〇日間の開始日を計算
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  const { data, error } = await supabase
    .from("twitter_create_logs")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("週別データ取得エラー:", error);
    return NextResponse.json(
      { error: "週別データの取得に失敗しました" },
      { status: 500 }
    );
  }

  const weeklyData = [];

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const count =
      data?.filter((item) => {
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthlyData = [];

  // 今日から過去の月データを取得
  for (let i = months - 1; i >= 0; i--) {
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