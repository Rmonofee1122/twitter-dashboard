"use client";

import { useEffect, useState } from "react";
import LineChart from "@/components/charts/line-chart";
import { apiCache } from "@/utils/cache";

interface CumulativeData {
  date: string;
  count: number;
  cumulative: number;
}

interface CumulativeChartProps {
  dateRange?: string;
  chartData?: CumulativeData[];
  startDate?: string;
  endDate?: string;
}

export default function CumulativeChart({
  dateRange = "30days",
  chartData,
  startDate,
  endDate,
}: CumulativeChartProps) {
  const [data, setData] = useState<CumulativeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setData(chartData);
      setLoading(false);
    } else {
      fetchCumulativeData();
    }
  }, [dateRange, chartData, startDate, endDate]);

  const fetchCumulativeData = async () => {
    try {
      setLoading(true);

      let apiUrl = `/api/cumulative-data?range=${dateRange}`;
      let cacheKey = `cumulative-data-${dateRange}`;

      // 日付指定がある場合は日付フィルター用のAPIを使用
      if (startDate && endDate) {
        apiUrl = `/api/cumulative-stats?startDate=${startDate}&endDate=${endDate}`;
        cacheKey = `cumulative-data-${startDate}-${endDate}`;
      }

      // キャッシュから取得を試行
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached cumulative data for ${cacheKey}`);
        setData(cachedData);
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("累計データの取得に失敗しました");
      }
      
      let cumulativeData;
      if (startDate && endDate) {
        // /api/cumulative-statsからのデータ構造に対応
        const responseData = await response.json();
        cumulativeData = responseData.chartData || responseData;
      } else {
        // /api/cumulative-dataからのデータ
        cumulativeData = await response.json();
      }

      // データをキャッシュに保存（5分間）
      apiCache.set(cacheKey, cumulativeData, 5);

      setData(cumulativeData);
    } catch (error) {
      console.error("累計データの取得に失敗しました:", error);
      // エラーの場合は空配列を設定
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const tooltipFormatter = (value: any) =>
    [`${value}件`, "累計アカウント数"] as [string, string];
  const labelFormatter = (label: any) => `日付: ${label}`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {loading ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            累計アカウント数推移
          </h3>
          <div className="h-72 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <p className="text-gray-500">データを読み込み中...</p>
          </div>
        </div>
      ) : (
        <LineChart
          data={data}
          xAxisKey="date"
          yAxisKey="cumulative"
          color="#10B981"
          height={300}
          title="累計アカウント数推移"
          strokeWidth={3}
          tooltipFormatter={tooltipFormatter}
          labelFormatter={labelFormatter}
        />
      )}
    </div>
  );
}
