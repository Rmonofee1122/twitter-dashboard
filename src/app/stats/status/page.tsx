"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import StatusStats from "@/components/stats/status/status-stats";
import StatusTrendChart from "@/components/stats/status/status-trend-chart";
import DateFilter from "@/components/accounts/date-filter";
import StatusFilter from "@/components/stats/status/status-filter";

interface StatusStatsData {
  chartData: Array<{
    date: string;
    active: number;
    shadowban: number;
    stopped: number;
    examination: number;
    suspended: number;
  }>;
  totalStats: {
    total: number;
    active: number;
    shadowban: number;
    stopped: number;
    examination: number;
    suspended: number;
  };
}

const StatusStatsPage = memo(function StatusStatsPage() {
  const [statusData, setStatusData] = useState<StatusStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "active",
    "shadowban",
    "stopped",
    "examination",
    "suspended",
  ]);

  // デフォルト日付を事前計算
  const defaultDates = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      end: today.toISOString().split("T")[0],
      start: thirtyDaysAgo.toISOString().split("T")[0],
    };
  }, []);

  const fetchStatusData = useCallback(
    async (start?: string, end?: string, statuses?: string[]) => {
      try {
        setIsLoading(true);

        let apiStartDate = start || startDate;
        let apiEndDate = end || endDate;
        let apiStatuses = statuses || selectedStatuses;

        // 日付が指定されていない場合はデフォルトで過去30日間
        if (!apiStartDate || !apiEndDate) {
          apiEndDate = defaultDates.end;
          apiStartDate = defaultDates.start;
        }

        const statusParams =
          apiStatuses.length > 0 ? `&statuses=${apiStatuses.join(",")}` : "";
        const response = await fetch(
          `/api/status-stats?startDate=${apiStartDate}&endDate=${apiEndDate}${statusParams}`
        );
        const data = await response.json();
        setStatusData(data);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, selectedStatuses, defaultDates]
  );

  useEffect(() => {
    fetchStatusData();
  }, [fetchStatusData]);

  const handleStartDateChange = useCallback(
    (date: string) => {
      setStartDate(date);
      fetchStatusData(date, endDate);
    },
    [endDate, fetchStatusData]
  );

  const handleEndDateChange = useCallback(
    (date: string) => {
      setEndDate(date);
      fetchStatusData(startDate, date);
    },
    [startDate, fetchStatusData]
  );

  const handleQuickSelect = useCallback(
    (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      fetchStatusData(start, end);
    },
    [fetchStatusData]
  );

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchStatusData("", "");
  }, [fetchStatusData]);

  const allStatusesArray = useMemo(
    () => ["active", "shadowban", "stopped", "examination", "suspended"],
    []
  );

  const handleStatusChange = useCallback(
    (statuses: string[]) => {
      setSelectedStatuses(statuses);
      fetchStatusData(startDate, endDate, statuses);
    },
    [startDate, endDate, fetchStatusData]
  );

  const handleClearStatusFilter = useCallback(() => {
    setSelectedStatuses(allStatusesArray);
    fetchStatusData(startDate, endDate, allStatusesArray);
  }, [startDate, endDate, fetchStatusData, allStatusesArray]);

  // ローディング状態をメモ化
  const loadingContent = useMemo(
    () => (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    ),
    []
  );

  // エラー状態をメモ化
  const errorContent = useMemo(
    () => (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 font-medium">
              データの取得に失敗しました
            </p>
            <button
              onClick={() => fetchStatusData()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    ),
    [fetchStatusData]
  );

  // チャートデータの変換をメモ化
  const transformedChartData = useMemo(() => {
    if (!statusData) return [];
    return statusData.chartData.map(
      ({ date, active, shadowban, stopped, examination, suspended }) => ({
        date,
        active,
        suspended,
        shadowban,
        stopped,
        examination,
        pending: shadowban,
        excluded: stopped + examination,
      })
    );
  }, [statusData]);

  if (isLoading) {
    return loadingContent;
  }

  if (!statusData) {
    return errorContent;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ステータス別統計</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onQuickSelect={handleQuickSelect}
          onClear={handleClearFilter}
        />

        <StatusFilter
          selectedStatuses={selectedStatuses}
          onStatusChange={handleStatusChange}
          onClear={handleClearStatusFilter}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatusTrendChart chartData={transformedChartData} />
      </div>

      <StatusStats totalStats={statusData.totalStats} />
    </div>
  );
});

export default StatusStatsPage;
