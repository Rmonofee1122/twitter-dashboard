"use client";

import { useEffect, useState } from "react";
import BarChart from "@/components/charts/bar-chart";

interface HourlyData {
  hour: string;
  count: number;
}

export default function HourlyChart() {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchHourlyData();
  }, [selectedDate]);

  const fetchHourlyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hourly-data?date=${selectedDate}`);
      if (!response.ok) {
        throw new Error("時間別データの取得に失敗しました");
      }
      const hourlyData = await response.json();
      setData(hourlyData);
    } catch (error) {
      console.error("時間別データの取得に失敗しました:", error);
      // エラーの場合は空配列を設定
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const tooltipFormatter = (value: any) =>
    [`${value}件`, "作成数"] as [string, string];
  const labelFormatter = (label: any) => `時間: ${label}`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {loading ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              時間別作成数分布
            </h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                日付:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="h-72 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <p className="text-gray-500">データを読み込み中...</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              時間別作成数分布
            </h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                日付:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={fetchHourlyData}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
          <BarChart
            data={data}
            xAxisKey="hour"
            yAxisKey="count"
            color="#8B5CF6"
            height={300}
            tooltipFormatter={tooltipFormatter}
            labelFormatter={labelFormatter}
          />
        </div>
      )}
    </div>
  );
}
