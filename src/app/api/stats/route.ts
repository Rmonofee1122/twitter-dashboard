import { supabase } from "../../../lib/supabase";

export interface TotalStats {
  totalAccounts: number;
  activeAccounts: number;
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

export interface IpData {
  ip: string;
  count: number;
}

export interface ChartData {
  dailyCreations: Array<{ date: string; count: number }>;
  weeklyCreations: Array<{ week: string; count: number }>;
  monthlyCreations: Array<{ month: string; count: number }>;
}

export async function fetchStatsData(): Promise<TotalStats> {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const currentMonth =
    today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");

  try {
    // 総アカウント数
    const { count: totalAccounts } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true });

    // アクティブアカウント数（login_app = true）
    const { count: activeAccounts } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .eq("app_login", true);

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
      todayCreated: todayCreated || 0,
      weekCreated: weekCreated || 0,
      monthCreated: monthCreated || 0,
    };
  } catch (error) {
    console.error("Stats data fetch error:", error);
    return {
      totalAccounts: 0,
      activeAccounts: 0,
      todayCreated: 0,
      weekCreated: 0,
      monthCreated: 0,
    };
  }
}

export async function fetchCreationTrendsData(): Promise<ChartData> {
  try {
    // 日別データ（過去30日間）
    const { data: dailyData } = await supabase
      .from("create_count_per_day")
      .select("created_date, total_count")
      .order("created_date", { ascending: true });

    // 今日から過去30日間の開始日を計算（今日を含む）
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // 日付ごとにグルーピング（1回のループで効率的に処理）
    const dateCountMap = new Map<string, number>();

    // データを日付別にカウント
    dailyData?.forEach((item) => {
      const dateStr = new Date(item.created_date).toISOString().split("T")[0];
      dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
    });

    // 日別データ（過去30日間）
    const dailyCreations = [];

    // 日付範囲の配列を生成
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const count =
        dailyData?.find((item) => item.created_date === dateStr)?.total_count ||
        0;

      dailyCreations.push({
        date: dateStr,
        count,
      });
    }

    // 週別データ（過去12週間）
    const weeklyCreations = await generateWeeklyData(dailyData || []);

    // 月別データ（過去12ヶ月）
    const monthlyCreations = await generateMonthlyData(dailyData || []);

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

    // アクティブアカウント数（app_login = true）
    const { count: activeAccounts } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .eq("app_login", true);

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
      .from("twitter_create_logs")
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
      .from("twitter_create_logs")
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
  searchTerm?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact" })
      .or('app_login.eq.true,app_login.eq."true"');

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
  searchTerm?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact" })
      .or("app_login.eq.FarmUP,app_login.eq.farmup");

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
  searchTerm?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact" })
      .or("app_login.eq.suspend,app_login.eq.email_ban,app_login.eq.Email_BAN");

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

export async function fetchExcludedAccounts(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  searchTerm?: string
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact" })
      .or('app_login.eq.false,app_login.eq."false"');

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

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
