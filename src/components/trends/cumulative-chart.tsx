"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
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

const CumulativeChart = memo(function CumulativeChart({
  dateRange = "30days",
  chartData,
  startDate,
  endDate,
}: CumulativeChartProps) {
  const [data, setData] = useState<CumulativeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API URLとキャッシュキーをメモ化
  const { apiUrl, cacheKey } = useMemo(() => {
    if (startDate && endDate) {
      return {
        apiUrl: `/api/cumulative-stats?startDate=${startDate}&endDate=${endDate}`,
        cacheKey: `cumulative-data-${startDate}-${endDate}`,
      };
    }
    return {
      apiUrl: `/api/cumulative-data?range=${dateRange}`,
      cacheKey: `cumulative-data-${dateRange}`,
    };
  }, [dateRange, startDate, endDate]);

  const fetchCumulativeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // キャッシュから取得を試行
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached cumulative data for ${cacheKey}`);
        setData(cachedData);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      try {
        const response = await fetch(apiUrl, { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=300', // 5分間キャッシュ
          }
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: 累計データの取得に失敗しました`);
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

        // データ検証
        if (!Array.isArray(cumulativeData)) {
          throw new Error("不正なデータ形式です");
        }

        // データをキャッシュに保存（5分間）
        apiCache.set(cacheKey, cumulativeData, 5);
        setData(cumulativeData);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error("累計データの取得に失敗しました:", error);
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, cacheKey]);

  // useEffectの最適化
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setData(chartData);
      setLoading(false);
      setError(null);
    } else {
      fetchCumulativeData();
    }
  }, [chartData, fetchCumulativeData]);

  // ツールチップ関数をメモ化
  const tooltipFormatter = useCallback(
    (value: any) => [`${value?.toLocaleString() || 0}件`, "累計アカウント数"] as [string, string],
    []
  );
  
  const labelFormatter = useCallback(
    (label: any) => `日付: ${label}`,
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {loading ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            累計アカウント数推移
          </h3>
          <div className="h-72 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-500">データを読み込み中...</p>
          </div>
        </div>
      ) : error ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            累計アカウント数推移
          </h3>
          <div className="h-72 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
            <div className="text-center">
              <p className="text-red-600 font-medium">エラーが発生しました</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
              <button
                onClick={fetchCumulativeData}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                再読み込み
              </button>
            </div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            累計アカウント数推移
          </h3>
          <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">表示するデータがありません</p>
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
});

export default CumulativeChart;
