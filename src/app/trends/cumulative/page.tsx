"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import DateFilter from "@/components/accounts/date-filter";
import CumulativeChart from "@/components/trends/cumulative-chart";

interface CumulativeData {
  date: string;
  count: number;
  cumulative: number;
}

interface CumulativeStatsData {
  chartData: CumulativeData[];
  summary: {
    totalAccounts: number;
    averageDaily: number;
    maxDaily: number;
    dateRange: { startDate: string; endDate: string };
  };
}

export default function CumulativeTrendsPage() {
  const [cumulativeData, setCumulativeData] =
    useState<CumulativeStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCumulativeData = useCallback(
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
          `/api/cumulative-stats?startDate=${apiStartDate}&endDate=${apiEndDate}`
        );
        const data = await response.json();
        setCumulativeData(data);
      } catch (error) {
        console.error("累計データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    fetchCumulativeData();
  }, [fetchCumulativeData]);

  const handleStartDateChange = useCallback(
    (date: string) => {
      setStartDate(date);
      fetchCumulativeData(date, endDate);
    },
    [endDate, fetchCumulativeData]
  );

  const handleEndDateChange = useCallback(
    (date: string) => {
      setEndDate(date);
      fetchCumulativeData(startDate, date);
    },
    [startDate, fetchCumulativeData]
  );

  const handleQuickSelect = useCallback(
    (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      fetchCumulativeData(start, end);
    },
    [fetchCumulativeData]
  );

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchCumulativeData("", "");
  }, [fetchCumulativeData]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            累計アカウント数推移
          </h1>
        </div>
      </div>

      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClear={handleClearFilter}
      />

      {/* 統計サマリー */}
      {cumulativeData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  総アカウント数
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cumulativeData.summary.totalAccounts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-50 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  1日平均作成数
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cumulativeData.summary.averageDaily.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-50 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  最大日作成数
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cumulativeData.summary.maxDaily.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 累計推移チャート */}
      <CumulativeChart 
        chartData={cumulativeData?.chartData}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
