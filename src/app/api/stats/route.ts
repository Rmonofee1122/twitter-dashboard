import { supabase } from "../../../lib/supabase";

export interface TotalStats {
  totalAccounts: number;
  activeAccounts: number;
  suspendedAccounts: number;
  tempLockedAccounts: number;
  shadowbanAccounts: number;
  todayCreated: number;
  weekCreated: number;
  monthCreated: number;
}

export interface PerformanceMetrics {
  activeRate: number;
  dailyAverage: number;
  monthlyTotal: number;
}

export interface DomainData {
  domain: string;
  count: number;
}

export interface FilteredDomainData {
  domain: string;
  active_count: number;
  suspended_count: number;
  temp_locked_count: number;
  total_count: number;
}

export interface IpData {
  ip: string;
  count: number;
}

export interface ChartData {
  dailyCreations: Array<{
    date: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>;
  weeklyCreations: Array<{
    week: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>;
  monthlyCreations: Array<{
    month: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>;
}

export async function fetchStatsData(): Promise<TotalStats> {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const currentMonth =
    today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");

  try {
    // 総アカウント数
    const { count: totalAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true });

    // アクティブアカウント数（status = active）
    const { count: activeAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 凍結アカウント数（status = suspended）
    const { count: suspendedAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended");

    // シャドBANアカウント数（status = shadowban）
    const { count: shadowbanAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true })
      .or(
        "status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"
      );

    // 一時制限アカウント数（status = temp_locked）
    const { count: tempLockedAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true })
      .eq("status", "temp_locked");

    // 今日の作成数
    const { count: todayCreated } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayString + "T00:00:00")
      .lt("created_at", todayString + "T23:59:59");

    // 今月の作成数
    const { count: monthCreated } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentMonth + "-01T00:00:00")
      .lt("created_at", getNextMonth(currentMonth) + "-01T00:00:00");

    // 今週の作成数（過去7日間）
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split("T")[0];

    const { count: weekCreated } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoString + "T00:00:00")
      .lt("created_at", todayString + "T23:59:59");

    return {
      totalAccounts: totalAccounts || 0,
      activeAccounts: activeAccounts || 0,
      suspendedAccounts: suspendedAccounts || 0,
      tempLockedAccounts: tempLockedAccounts || 0,
      shadowbanAccounts: shadowbanAccounts || 0,
      todayCreated: todayCreated || 0,
      weekCreated: weekCreated || 0,
      monthCreated: monthCreated || 0,
    };
  } catch (error) {
    console.error("Stats data fetch error:", error);
    return {
      totalAccounts: 0,
      activeAccounts: 0,
      suspendedAccounts: 0,
      tempLockedAccounts: 0,
      shadowbanAccounts: 0,
      todayCreated: 0,
      weekCreated: 0,
      monthCreated: 0,
    };
  }
}

// 日付フィルター付きのCreationTrendsData取得関数
export async function fetchCreationTrendsDataFiltered(
  startDate?: string,
  endDate?: string
): Promise<ChartData> {
  try {
    let query = supabase
      .from("status_count_per_day03")
      .select(
        "created_date, active_count, suspended_count, temp_locked_count, other_count, total_count"
      )
      .order("created_date", { ascending: true });

    // 日付フィルター適用
    if (startDate) {
      query = query.gte("created_date", startDate);
    }
    if (endDate) {
      query = query.lte("created_date", endDate);
    }

    const { data: dailyData } = await query;

    // デフォルトの期間設定（フィルターがない場合）
    const today = new Date();
    const defaultStartDate = new Date(today);
    defaultStartDate.setDate(defaultStartDate.getDate() - 29);
    defaultStartDate.setHours(0, 0, 0, 0);

    const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const actualEndDate = endDate ? new Date(endDate) : today;

    // 日付範囲の日数を計算
    const daysDiff =
      Math.ceil(
        (actualEndDate.getTime() - actualStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    // 日別データ
    const dailyCreations = [];
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(actualStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dataItem = dailyData?.find((item) => item.created_date === dateStr);

      dailyCreations.push({
        date: dateStr,
        active_count: dataItem?.active_count || 0,
        suspended_count: dataItem?.suspended_count || 0,
        temp_locked_count: dataItem?.temp_locked_count || 0,
        other_count: dataItem?.other_count || 0,
        total_count: dataItem?.total_count || 0,
      });
    }

    // 週別・月別データも期間に応じて生成
    const weeklyCreations = await generateWeeklyDataV2Filtered(
      dailyData || [],
      actualStartDate,
      actualEndDate
    );
    const monthlyCreations = await generateMonthlyDataV2Filtered(
      dailyData || [],
      actualStartDate,
      actualEndDate
    );

    return {
      dailyCreations,
      weeklyCreations,
      monthlyCreations,
    };
  } catch (error) {
    console.error("Filtered creation trends data fetch error:", error);
    return {
      dailyCreations: [],
      weeklyCreations: [],
      monthlyCreations: [],
    };
  }
}

export async function fetchCreationTrendsData(): Promise<ChartData> {
  try {
    // 日別データ（過去30日間）
    const { data: dailyData } = await supabase
      .from("status_count_per_day03")
      .select(
        "created_date, active_count, suspended_count, temp_locked_count, other_count, total_count"
      )
      .order("created_date", { ascending: true });

    // 今日から過去30日間の開始日を計算（今日を含む）
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    // 日別データ（過去30日間）
    const dailyCreations = [];

    // 日付範囲の配列を生成
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dataItem = dailyData?.find((item) => item.created_date === dateStr);

      dailyCreations.push({
        date: dateStr,
        active_count: dataItem?.active_count || 0,
        suspended_count: dataItem?.suspended_count || 0,
        temp_locked_count: dataItem?.temp_locked_count || 0,
        other_count: dataItem?.other_count || 0,
        total_count: dataItem?.total_count || 0,
      });
    }

    // 週別データ（過去12週間）
    const weeklyCreations = await generateWeeklyDataV2(dailyData || []);

    // 月別データ（過去12ヶ月）
    const monthlyCreations = await generateMonthlyDataV2(dailyData || []);

    return {
      dailyCreations,
      weeklyCreations,
      monthlyCreations,
    };
  } catch (error) {
    console.error("Creation trends data fetch error:", error);
    return {
      dailyCreations: [],
      weeklyCreations: [],
      monthlyCreations: [],
    };
  }
}

async function generateWeeklyData(
  dailyData: any[]
): Promise<Array<{ week: string; count: number }>> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 今月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // 今月のデータのみをフィルタリング
  const currentMonthData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date >= firstDayOfMonth && date <= lastDayOfMonth;
  });

  // 今月の各週のデータを生成
  const weeklyData: Array<{ week: string; count: number }> = [];

  // 今月の第1週から第4週（または第5週）まで
  let currentWeekStart = new Date(firstDayOfMonth);

  // 月の最初の日が何曜日かを確認し、その週の月曜日を取得
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysToMonday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // 日曜日の場合は6日戻る
  currentWeekStart.setDate(currentWeekStart.getDate() - daysToMonday);

  let weekNumber = 1;

  while (currentWeekStart <= lastDayOfMonth && weekNumber <= 4) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // 日曜日まで

    // この週に含まれる今月のデータを集計
    const weekData = currentMonthData.filter((item) => {
      const date = new Date(item.created_date);
      return date >= currentWeekStart && date <= weekEnd;
    });

    const weekCount = weekData.reduce((sum, item) => sum + item.total_count, 0);

    weeklyData.push({
      week: `第${weekNumber}週`,
      count: weekCount,
    });

    // 次の週の開始日を設定
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }

  // 4週に満たない場合は0で埋める
  while (weeklyData.length < 4) {
    weeklyData.push({
      week: `第${weeklyData.length + 1}週`,
      count: 0,
    });
  }

  return weeklyData;
}

async function generateMonthlyData(
  dailyData: any[]
): Promise<Array<{ month: string; count: number }>> {
  const today = new Date();
  const currentYear = today.getFullYear();

  // 今年のデータのみをフィルタリング
  const currentYearData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date.getFullYear() === currentYear;
  });

  // 月別データをカウント
  const monthlyMap = new Map<string, number>();
  currentYearData.forEach((item) => {
    const date = new Date(item.created_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    monthlyMap.set(
      monthKey,
      (monthlyMap.get(monthKey) || 0) + item.total_count
    );
  });

  // 今年の1月から12月まで全てのデータを生成（データがない月は0で埋める）
  const monthlyData: Array<{ month: string; count: number }> = [];

  for (let month = 1; month <= 12; month++) {
    const monthKey = `${currentYear}-${String(month).padStart(2, "0")}`;
    const count = monthlyMap.get(monthKey) || 0;

    monthlyData.push({
      month: `${month}月`,
      count: count,
    });
  }

  return monthlyData;
}

// 新しいステータス別週別データ生成関数
async function generateWeeklyDataV2(dailyData: any[]): Promise<
  Array<{
    week: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>
> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 今月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // 今月のデータのみをフィルタリング
  const currentMonthData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date >= firstDayOfMonth && date <= lastDayOfMonth;
  });

  // 今月の各週のデータを生成
  const weeklyData: Array<{
    week: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }> = [];

  // 今月の第1週から第4週（または第5週）まで
  let currentWeekStart = new Date(firstDayOfMonth);

  // 月の最初の日が何曜日かを確認し、その週の月曜日を取得
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysToMonday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  currentWeekStart.setDate(currentWeekStart.getDate() - daysToMonday);

  let weekNumber = 1;

  while (currentWeekStart <= lastDayOfMonth && weekNumber <= 4) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // この週に含まれる今月のデータを集計
    const weekData = currentMonthData.filter((item) => {
      const date = new Date(item.created_date);
      return date >= currentWeekStart && date <= weekEnd;
    });

    const weekCounts = weekData.reduce(
      (acc, item) => ({
        active_count: acc.active_count + (item.active_count || 0),
        suspended_count: acc.suspended_count + (item.suspended_count || 0),
        temp_locked_count:
          acc.temp_locked_count + (item.temp_locked_count || 0),
        other_count: acc.other_count + (item.other_count || 0),
        total_count: acc.total_count + (item.total_count || 0),
      }),
      {
        active_count: 0,
        suspended_count: 0,
        temp_locked_count: 0,
        other_count: 0,
        total_count: 0,
      }
    );

    weeklyData.push({
      week: `第${weekNumber}週`,
      ...weekCounts,
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }

  // 4週に満たない場合は0で埋める
  while (weeklyData.length < 4) {
    weeklyData.push({
      week: `第${weeklyData.length + 1}週`,
      active_count: 0,
      suspended_count: 0,
      temp_locked_count: 0,
      other_count: 0,
      total_count: 0,
    });
  }

  return weeklyData;
}

// 新しいステータス別月別データ生成関数
async function generateMonthlyDataV2(dailyData: any[]): Promise<
  Array<{
    month: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>
> {
  const today = new Date();
  const currentYear = today.getFullYear();

  // 今年のデータのみをフィルタリング
  const currentYearData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date.getFullYear() === currentYear;
  });

  // 月別データをカウント
  const monthlyMap = new Map<
    string,
    {
      active_count: number;
      suspended_count: number;
      temp_locked_count: number;
      other_count: number;
      total_count: number;
    }
  >();

  currentYearData.forEach((item) => {
    const date = new Date(item.created_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const existing = monthlyMap.get(monthKey) || {
      active_count: 0,
      suspended_count: 0,
      temp_locked_count: 0,
      other_count: 0,
      total_count: 0,
    };

    monthlyMap.set(monthKey, {
      active_count: existing.active_count + (item.active_count || 0),
      suspended_count: existing.suspended_count + (item.suspended_count || 0),
      temp_locked_count:
        existing.temp_locked_count + (item.temp_locked_count || 0),
      other_count: existing.other_count + (item.other_count || 0),
      total_count: existing.total_count + (item.total_count || 0),
    });
  });

  // 今年の1月から12月まで全てのデータを生成（データがない月は0で埋める）
  const monthlyData: Array<{
    month: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }> = [];

  for (let month = 1; month <= 12; month++) {
    const monthKey = `${currentYear}-${String(month).padStart(2, "0")}`;
    const counts = monthlyMap.get(monthKey) || {
      active_count: 0,
      suspended_count: 0,
      temp_locked_count: 0,
      other_count: 0,
      total_count: 0,
    };

    monthlyData.push({
      month: `${month}月`,
      ...counts,
    });
  }

  return monthlyData;
}

// フィルター対応の週別データ生成関数
async function generateWeeklyDataV2Filtered(
  dailyData: any[],
  startDate: Date,
  endDate: Date
): Promise<
  Array<{
    week: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>
> {
  const filteredData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date >= startDate && date <= endDate;
  });

  // 期間内の週を計算
  const weeklyMap = new Map<
    string,
    {
      active_count: number;
      suspended_count: number;
      temp_locked_count: number;
      other_count: number;
      total_count: number;
    }
  >();

  filteredData.forEach((item) => {
    const date = new Date(item.created_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 週の始まり（日曜日）
    const weekKey = weekStart.toISOString().split("T")[0];

    const existing = weeklyMap.get(weekKey) || {
      active_count: 0,
      suspended_count: 0,
      temp_locked_count: 0,
      other_count: 0,
      total_count: 0,
    };

    weeklyMap.set(weekKey, {
      active_count: existing.active_count + (item.active_count || 0),
      suspended_count: existing.suspended_count + (item.suspended_count || 0),
      temp_locked_count:
        existing.temp_locked_count + (item.temp_locked_count || 0),
      other_count: existing.other_count + (item.other_count || 0),
      total_count: existing.total_count + (item.total_count || 0),
    });
  });

  // ソートして返す
  const sortedWeeks = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, counts], index) => ({
      week: `第${index + 1}週`,
      ...counts,
    }));

  return sortedWeeks;
}

// フィルター対応の月別データ生成関数
async function generateMonthlyDataV2Filtered(
  dailyData: any[],
  startDate: Date,
  endDate: Date
): Promise<
  Array<{
    month: string;
    active_count: number;
    suspended_count: number;
    temp_locked_count: number;
    other_count: number;
    total_count: number;
  }>
> {
  const filteredData = dailyData.filter((item) => {
    const date = new Date(item.created_date);
    return date >= startDate && date <= endDate;
  });

  // 月別データをカウント
  const monthlyMap = new Map<
    string,
    {
      active_count: number;
      suspended_count: number;
      temp_locked_count: number;
      other_count: number;
      total_count: number;
    }
  >();

  filteredData.forEach((item) => {
    const date = new Date(item.created_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const existing = monthlyMap.get(monthKey) || {
      active_count: 0,
      suspended_count: 0,
      temp_locked_count: 0,
      other_count: 0,
      total_count: 0,
    };

    monthlyMap.set(monthKey, {
      active_count: existing.active_count + (item.active_count || 0),
      suspended_count: existing.suspended_count + (item.suspended_count || 0),
      temp_locked_count:
        existing.temp_locked_count + (item.temp_locked_count || 0),
      other_count: existing.other_count + (item.other_count || 0),
      total_count: existing.total_count + (item.total_count || 0),
    });
  });

  // ソートして月名に変換
  const sortedMonths = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, counts]) => {
      const [year, month] = monthKey.split("-");
      return {
        month: `${year}年${parseInt(month)}月`,
        ...counts,
      };
    });

  return sortedMonths;
}

function getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const today = new Date();
  const currentMonth =
    today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");

  try {
    // 総アカウント数
    const { count: totalAccounts } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true });

    // アクティブアカウント数（status = active）
    const { count: activeAccounts } = await supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 今月の作成数
    const { count: monthlyTotal } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentMonth + "-01T00:00:00")
      .lt("created_at", getNextMonth(currentMonth) + "-01T00:00:00");

    // アクティブ率を計算
    const safeTotalAccounts = totalAccounts || 0;
    const safeActiveAccounts = activeAccounts || 0;
    const activeRate =
      safeTotalAccounts > 0
        ? (safeActiveAccounts / safeTotalAccounts) * 100
        : 0;

    // 日平均作成数を計算（月間作成数 / 30）
    const dailyAverage = (monthlyTotal || 0) / 30;

    return {
      activeRate: Number(activeRate.toFixed(1)),
      dailyAverage: Number(dailyAverage.toFixed(1)),
      monthlyTotal: monthlyTotal || 0,
    };
  } catch (error) {
    console.error("Performance metrics fetch error:", error);
    return {
      activeRate: 0,
      dailyAverage: 0,
      monthlyTotal: 0,
    };
  }
}

// ドメインランキングを取得する関数
export async function fetchDomainRanking(): Promise<DomainData[]> {
  try {
    const { data, error } = await supabase
      .from("domain_view")
      .select("domain, count")
      .order("count", { ascending: false });

    if (error) {
      console.error("Domain ranking fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Domain ranking fetch error:", error);
    return [];
  }
}

// 日付フィルター付きのドメインランキングを取得する関数
export async function fetchFilteredDomainRanking(
  startDate?: string,
  endDate?: string
): Promise<FilteredDomainData[]> {
  try {
    let query = supabase
      .from("domain_per_day_view02")
      .select(
        "created_date, domain, active_count, suspended_count, temp_locked_count, total_count"
      );

    // 日付フィルター適用
    if (startDate) {
      query = query.gte("created_date", startDate);
    }
    if (endDate) {
      query = query.lte("created_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Filtered domain ranking fetch error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // ドメインごとに集計
    const domainMap = new Map<
      string,
      {
        active_count: number;
        suspended_count: number;
        temp_locked_count: number;
        total_count: number;
      }
    >();

    data.forEach((item) => {
      const existing = domainMap.get(item.domain) || {
        active_count: 0,
        suspended_count: 0,
        temp_locked_count: 0,
        total_count: 0,
      };

      domainMap.set(item.domain, {
        active_count: existing.active_count + (item.active_count || 0),
        suspended_count: existing.suspended_count + (item.suspended_count || 0),
        temp_locked_count:
          existing.temp_locked_count + (item.temp_locked_count || 0),
        total_count: existing.total_count + (item.total_count || 0),
      });
    });

    // 配列に変換してソート（total_count順）
    const result = Array.from(domainMap.entries())
      .map(([domain, counts]) => ({
        domain,
        ...counts,
      }))
      .sort((a, b) => b.total_count - a.total_count);

    return result;
  } catch (error) {
    console.error("Filtered domain ranking fetch error:", error);
    return [];
  }
}

// IPランキングを取得する関数（ページネーション対応）
export async function fetchIpRanking(
  page: number = 1,
  limit: number = 10
): Promise<{ data: IpData[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("ip_view")
      .select("ip, count", { count: "exact" })
      .order("count", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("IP ranking fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("IP ranking fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

// IPランキング（上位5つ）を取得する関数
export async function fetchIpRankingTop5(): Promise<IpData[]> {
  try {
    const { data, error } = await supabase
      .from("ip_view")
      .select("ip, count")
      .order("count", { ascending: false })
      .limit(5);

    if (error) {
      console.error("IP ranking fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("IP ranking fetch error:", error);
    return [];
  }
}

// アカウントの詳細モーダル用データを取得する関数
export async function fetchAccountDetails(twitterId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("twitter_account_v3")
      .select("*")
      .eq("twitter_id", twitterId)
      .single();

    if (error) {
      console.error("Account details fetch error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Account details fetch error:", error);
    return null;
  }
}

export async function fetchRecentAccounts(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("twitter_create_with_account_v1")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Recent accounts fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Recent accounts fetch error:", error);
    return [];
  }
}

export async function fetchActiveAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .or('status.eq.active,status.eq."active"');

    if (startDate) {
      query = query.gte("created_at", startDate + "T00:00:00");
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,create_ip.ilike.%${searchTerm}%`
      );
    }

    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Active accounts fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Active accounts fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

export async function fetchPendingAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .or('status.eq.examination,status.eq."examination"');

    if (startDate) {
      query = query.gte("created_at", startDate + "T00:00:00");
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,create_ip.ilike.%${searchTerm}%`
      );
    }

    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Pending accounts fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Pending accounts fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

export async function fetchBannedAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .or("status.eq.suspend,status.eq.suspended");

    if (startDate) {
      query = query.gte("created_at", startDate + "T00:00:00");
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,create_ip.ilike.%${searchTerm}%`
      );
    }
    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Banned accounts fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Banned accounts fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

export async function fetchShadowbanAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .or(
        "status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"
      );

    if (startDate) {
      query = query.gte("created_at", startDate + "T00:00:00");
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,create_ip.ilike.%${searchTerm}%`
      );
    }

    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Shadowbanned accounts fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Shadowbanned accounts fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

export async function fetchNotfoundAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .or("status.eq.not_found");

    if (startDate) {
      query = query.gte("created_at", startDate + "T00:00:00");
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,create_ip.ilike.%${searchTerm}%`
      );
    }

    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Excluded accounts fetch error:", error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Excluded accounts fetch error:", error);
    return { data: [], totalCount: 0 };
  }
}

// 一時制限アカウントを取得
export async function fetchTempLockedAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string,
  sortField?: string,
  sortDirection?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_account_v3")
      .select("*", { count: "exact" })
      .eq("status", "temp_locked");

    // 検索フィルター
    if (searchTerm) {
      query = query.or(
        `twitter_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    }

    // 日付フィルター
    if (startDate) {
      query = query.gte("log_created_at", startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("log_created_at", endDateTime.toISOString());
    }

    // ソート処理
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          query = query.order("log_created_at", { ascending: false });
          break;
      }
    } else {
      query = query.order("log_created_at", { ascending: false });
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching temp locked accounts:", error);
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Error in fetchTempLockedAccounts:", error);
    return { data: [], totalCount: 0 };
  }
}

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
