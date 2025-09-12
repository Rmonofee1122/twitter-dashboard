"use client";

import { useState, useEffect } from "react";
import AreaChart from "@/components/charts/area-chart";
import { apiCache } from "@/utils/cache";

interface TrendChartData {
  daily: Array<{ date: string; count: number; cumulative: number }>;
  weekly: Array<{ week: string; count: number; average: number }>;
  monthly: Array<{ month: string; count: number; growth: number }>;
  hourly: Array<{ hour: string; count: number }>;
}

interface TrendChartProps {
  selectedPeriod: "daily" | "weekly" | "monthly";
  onPeriodChange: (period: "daily" | "weekly" | "monthly") => void;
  startDate?: string;
  endDate?: string;
}

export default function TrendChart({
  selectedPeriod,
  onPeriodChange,
  startDate,
  endDate,
}: TrendChartProps) {
  const [data, setData] = useState<TrendChartData>({
    daily: [],
    weekly: [],
    monthly: [],
    hourly: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, startDate, endDate]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      // 単一日のフィルターかどうかを判定
      const isSingleDay = startDate && endDate && startDate === endDate;

      if (isSingleDay) {
        // 時間別データを取得
        const response = await fetch(`/api/hourly-data?date=${startDate}`);
        if (!response.ok) {
          throw new Error("時間別データの取得に失敗しました");
        }
        const hourlyData = await response.json();
        setData((prev) => ({
          ...prev,
          hourly: hourlyData,
        }));
      } else {
        // 通常の期間別データを取得
        let apiUrl = `/api/trend-data?period=${selectedPeriod}`;
        if (startDate) {
          apiUrl += `&startDate=${startDate}`;
        }
        if (endDate) {
          apiUrl += `&endDate=${endDate}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("トレンドデータの取得に失敗しました");
        }
        const chartData = await response.json();

        // 選択された期間のデータを更新
        setData((prev) => ({
          ...prev,
          [selectedPeriod]: chartData,
        }));
      }
    } catch (error) {
      console.error("トレンドデータの取得に失敗しました:", error);
      // エラーの場合は空配列を設定
      if (startDate && endDate && startDate === endDate) {
        setData((prev) => ({
          ...prev,
          hourly: [],
        }));
      } else {
        setData((prev) => ({
          ...prev,
          [selectedPeriod]: [],
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    // 単一日のフィルターの場合は時間別データを表示
    const isSingleDay = startDate && endDate && startDate === endDate;
    if (isSingleDay) {
      return data.hourly;
    }

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
    // 単一日のフィルターの場合は時間軸を表示
    const isSingleDay = startDate && endDate && startDate === endDate;
    if (isSingleDay) {
      return "hour";
    }

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
    return (label: any) => {
      const xAxisKey = getXAxisKey();
      switch (xAxisKey) {
        case "hour":
          return `時間: ${label}`;
        case "date":
          return `日付: ${label}`;
        case "week":
          return `週: ${label}`;
        case "month":
          return `月: ${label}`;
        default:
          return `${label}`;
      }
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          アカウント作成推移
          {startDate && endDate && startDate === endDate && (
            <span className="text-sm text-gray-600 ml-2">(時間別表示)</span>
          )}
        </h3>
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
