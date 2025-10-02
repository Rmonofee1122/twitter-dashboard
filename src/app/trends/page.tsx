"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import TrendStatsCards from "@/components/trends/trend-stats-cards";
import TrendChart from "@/components/trends/trend-chart";
import CumulativeChart from "@/components/trends/cumulative-chart";
import HourlyChart from "@/components/trends/hourly-chart";
import GrowthChart from "@/components/trends/growth-chart";
import TrendInsights from "@/components/trends/trend-insights";
import PerformanceMetrics from "@/components/trends/performance-metrics";
import DateFilter from "@/components/accounts/date-filter";
import {
  fetchPerformanceMetrics,
  type PerformanceMetrics as PerformanceMetricsType,
} from "@/app/api/stats/route";

interface TrendData {
  daily: Array<{ date: string; count: number; cumulative: number }>;
  weekly: Array<{ week: string; count: number; average: number }>;
  monthly: Array<{ month: string; count: number; growth: number }>;
  hourly: Array<{ hour: string; count: number }>;
}

const TrendsPage = () => {
  const [trendData, setTrendData] = useState<TrendData>({
    daily: [],
    weekly: [],
    monthly: [],
    hourly: [],
  });
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetricsType>({
      activeRate: 0,
      dailyAverage: 0,
      monthlyTotal: 0,
    });
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // データ生成関数をメモ化
  const generateDailyData = useCallback(() => {
    const data = [];
    let cumulative = 2200;
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 30) + 5;
      cumulative += count;
      data.push({
        date: date.toISOString().split("T")[0],
        count,
        cumulative,
      });
    }
    return data;
  }, []);

  const generateWeeklyData = useCallback(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const count = Math.floor(Math.random() * 150) + 80;
      data.push({
        week: `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`,
        count,
        average: Math.floor(count / 7),
      });
    }
    return data;
  }, []);

  const generateMonthlyData = useCallback(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const count = Math.floor(Math.random() * 600) + 300;
      const prevCount =
        i === 11 ? count : Math.floor(Math.random() * 600) + 300;
      const growth = ((count - prevCount) / prevCount) * 100;
      data.push({
        month: date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
        }),
        count,
        growth: Number(growth.toFixed(1)),
      });
    }
    return data;
  }, []);

  const generateHourlyData = useCallback(() => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        hour: `${i.toString().padStart(2, "0")}:00`,
        count: Math.floor(Math.random() * 20) + 1,
      });
    }
    return data;
  }, []);

  const loadPerformanceMetrics = useCallback(async () => {
    const metrics = await fetchPerformanceMetrics();
    setPerformanceMetrics(metrics);
  }, []);

  useEffect(() => {
    loadPerformanceMetrics();

    // TODO: Supabaseからデータを取得
    // 仮のデータを設定
    setTrendData({
      daily: generateDailyData(),
      weekly: generateWeeklyData(),
      monthly: generateMonthlyData(),
      hourly: generateHourlyData(),
    });
  }, [
    loadPerformanceMetrics,
    generateDailyData,
    generateWeeklyData,
    generateMonthlyData,
    generateHourlyData,
  ]);

  const stats = useMemo(() => {
    const dailyData = trendData.daily;
    if (dailyData.length === 0)
      return {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        lastWeek: 0,
        cumulative: 0,
      };

    const today = dailyData[dailyData.length - 1]?.count || 0;
    const yesterday = dailyData[dailyData.length - 2]?.count || 0;
    const cumulative = dailyData[dailyData.length - 1]?.cumulative || 0;

    const thisWeek = dailyData
      .slice(-7)
      .reduce((sum, item) => sum + item.count, 0);
    const lastWeek = dailyData
      .slice(-14, -7)
      .reduce((sum, item) => sum + item.count, 0);

    return { today, yesterday, thisWeek, lastWeek, cumulative };
  }, [trendData.daily]);

  const dailyAverage = useMemo(
    () => (stats.thisWeek > 0 ? Math.round(stats.thisWeek / 7) : 0),
    [stats.thisWeek]
  );

  // インサイトデータ
  const insights = useMemo(
    () => ({
      peakHour: "14:00-16:00",
      growthTrend: "過去30日間で安定した成長を維持",
      averageEfficiency: dailyAverage,
    }),
    [dailyAverage]
  );

  // パフォーマンス指標は既にstateで管理

  const handleDateFilterClear = useCallback(() => {
    setStartDate("");
    setEndDate("");
  }, []);

  const handleQuickSelect = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          アカウント作成推移
        </h1>
        <p className="text-gray-600">
          時系列でのTwitterアカウント作成数の推移とトレンド分析
        </p>
      </div>

      {/* 統計カード */}
      <TrendStatsCards />

      {/* パフォーマンス指標 */}
      {/* <PerformanceMetrics metrics={performanceMetrics} /> */}

      {/* 日付フィルター */}
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
        onClear={handleDateFilterClear}
      />

      {/* メイン推移チャート */}
      <TrendChart
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        startDate={startDate}
        endDate={endDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 累計推移 */}
        {/* <CumulativeChart /> */}

        {/* 時間別分布 */}
        <HourlyChart />
      </div>

      {/* 成長率分析 */}
      <GrowthChart data={trendData.monthly} selectedPeriod={selectedPeriod} />

      {/* インサイト */}
      {/* <TrendInsights insights={insights} /> */}
    </div>
  );
};

export default TrendsPage;
