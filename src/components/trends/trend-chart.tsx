"use client";

import { useState, useEffect } from "react";
import AreaChart from "@/components/charts/area-chart";

interface TrendChartData {
  daily: Array<{ date: string; count: number; cumulative: number }>;
  weekly: Array<{ week: string; count: number; average: number }>;
  monthly: Array<{ month: string; count: number; growth: number }>;
}

interface TrendChartProps {
  selectedPeriod: "daily" | "weekly" | "monthly";
  dateRange: "7days" | "30days" | "90days" | "1year";
  onPeriodChange: (period: "daily" | "weekly" | "monthly") => void;
  onRangeChange: (range: "7days" | "30days" | "90days" | "1year") => void;
}

export default function TrendChart({
  selectedPeriod,
  dateRange,
  onPeriodChange,
  onRangeChange,
}: TrendChartProps) {
  const [data, setData] = useState<TrendChartData>({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, dateRange]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/trend-data?period=${selectedPeriod}&range=${dateRange}`
      );
      if (!response.ok) {
        throw new Error("トレンドデータの取得に失敗しました");
      }
      const chartData = await response.json();

      // 選択された期間のデータを更新
      setData((prev) => ({
        ...prev,
        [selectedPeriod]: chartData,
      }));
    } catch (error) {
      console.error("トレンドデータの取得に失敗しました:", error);
      // エラーの場合は空配列を設定
      setData((prev) => ({
        ...prev,
        [selectedPeriod]: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    switch (selectedPeriod) {
      case "weekly":
        return data.weekly;
      case "monthly":
        return data.monthly;
      default:
        return data.daily;
    }
  };

  const getXAxisKey = () => {
    switch (selectedPeriod) {
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return "date";
    }
  };

  const getTooltipFormatter = () => {
    return (value: any, name: string) =>
      [
        `${value}件`,
        name === "count" ? "作成数" : name === "average" ? "平均" : "成長率",
      ] as [string, string];
  };

  const getLabelFormatter = () => {
    return (label: any) =>
      `${
        getXAxisKey() === "date"
          ? "日付"
          : getXAxisKey() === "week"
          ? "週"
          : "月"
      }: ${label}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          アカウント作成推移
        </h3>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
          {/* 期間選択 */}
          <div className="flex space-x-2">
            {["daily", "weekly", "monthly"].map((period) => (
              <button
                key={period}
                onClick={() => onPeriodChange(period as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPeriod === period
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {period === "daily"
                  ? "日別"
                  : period === "weekly"
                  ? "週別"
                  : "月別"}
              </button>
            ))}
          </div>
          {/* 範囲選択 */}
          <select
            value={dateRange}
            onChange={(e) => onRangeChange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">過去7日間</option>
            <option value="30days">過去30日間</option>
            <option value="90days">過去90日間</option>
            <option value="1year">過去1年間</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <p className="text-gray-500">チャートを読み込み中...</p>
        </div>
      ) : (
        <AreaChart
          data={getChartData()}
          xAxisKey={getXAxisKey()}
          yAxisKey="count"
          height={400}
          tooltipFormatter={getTooltipFormatter()}
          labelFormatter={getLabelFormatter()}
        />
      )}
    </div>
  );
}
