"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function StatusStatsPage() {
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

  const fetchStatusData = useCallback(
    async (start?: string, end?: string, statuses?: string[]) => {
      try {
        setIsLoading(true);

        let apiStartDate = start || startDate;
        let apiEndDate = end || endDate;
        let apiStatuses = statuses || selectedStatuses;

        // 日付が指定されていない場合はデフォルトで過去30日間
        if (!apiStartDate || !apiEndDate) {
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);

          apiEndDate = today.toISOString().split("T")[0];
          apiStartDate = thirtyDaysAgo.toISOString().split("T")[0];
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
    [startDate, endDate, selectedStatuses]
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

  const handleStatusChange = useCallback(
    (statuses: string[]) => {
      setSelectedStatuses(statuses);
      fetchStatusData(startDate, endDate, statuses);
    },
    [startDate, endDate, fetchStatusData]
  );

  const handleClearStatusFilter = useCallback(() => {
    const allStatuses = [
      "active",
      "shadowban",
      "stopped",
      "examination",
      "suspended",
    ];
    setSelectedStatuses(allStatuses);
    fetchStatusData(startDate, endDate, allStatuses);
  }, [startDate, endDate, fetchStatusData]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          データの取得に失敗しました
        </div>
      </div>
    );
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
        <StatusTrendChart
          chartData={statusData.chartData.map(
            ({ date, active, shadowban, stopped, examination, suspended }) => ({
              date,
              active,
              suspended,
              pending: shadowban,
              excluded: stopped + examination,
            })
          )}
        />
      </div>

      <StatusStats totalStats={statusData.totalStats} />
    </div>
  );
}
