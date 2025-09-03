"use client";

import { useEffect, useState, useCallback } from "react";
import DateFilter from "@/components/accounts/date-filter";
import HourlyPageHeader from "@/components/trends/hourly/hourly-page-header";
import HourlySummaryCards from "@/components/trends/hourly/hourly-summary";
import HourlyDistributionChart from "@/components/trends/hourly/hourly-distribution-chart";

interface HourlyData {
  hour: number;
  count: number;
  percentage: number;
}

interface HourlyStatsData {
  chartData: HourlyData[];
  summary: {
    totalAccounts: number;
    peakHour: number;
    peakCount: number;
    averageHourly: number;
    dateRange: { startDate: string; endDate: string };
  };
}

export default function HourlyTrendsPage() {
  const [hourlyData, setHourlyData] = useState<HourlyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHourlyData = useCallback(
    async (start?: string, end?: string) => {
      try {
        setLoading(true);

        let apiStartDate = start || startDate;
        let apiEndDate = end || endDate;

        // 日付が指定されていない場合はデフォルトで過去30日間
        if (!apiStartDate || !apiEndDate) {
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);

          apiEndDate = today.toISOString().split("T")[0];
          apiStartDate = thirtyDaysAgo.toISOString().split("T")[0];
        }

        const response = await fetch(
          `/api/hourly-stats?startDate=${apiStartDate}&endDate=${apiEndDate}`
        );
        const data = await response.json();
        setHourlyData(data);
      } catch (error) {
        console.error("時間別データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    fetchHourlyData();
  }, [fetchHourlyData]);

  const handleStartDateChange = useCallback(
    (date: string) => {
      setStartDate(date);
      fetchHourlyData(date, endDate);
    },
    [endDate, fetchHourlyData]
  );

  const handleEndDateChange = useCallback(
    (date: string) => {
      setEndDate(date);
      fetchHourlyData(startDate, date);
    },
    [startDate, fetchHourlyData]
  );

  const handleQuickSelect = useCallback(
    (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      fetchHourlyData(start, end);
    },
    [fetchHourlyData]
  );

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchHourlyData("", "");
  }, [fetchHourlyData]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <HourlyPageHeader />

      {/* 日付フィルター */}
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClear={handleClearFilter}
      />

      {/* サマリー */}
      {hourlyData?.summary && (
        <HourlySummaryCards summary={hourlyData.summary} />
      )}

      {/* 時間別分布 */}
      <HourlyDistributionChart 
        chartData={hourlyData?.chartData} 
        selectedDate={startDate || endDate ? undefined : undefined}
      />
    </div>
  );
}
