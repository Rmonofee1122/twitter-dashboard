'use client';

import { useEffect, useState } from 'react';
import LineChart from '@/components/charts/line-chart';

interface CumulativeData {
  date: string;
  count: number;
  cumulative: number;
}

interface CumulativeChartProps {
  dateRange?: string;
}

export default function CumulativeChart({ dateRange = '30days' }: CumulativeChartProps) {
  const [data, setData] = useState<CumulativeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCumulativeData();
  }, [dateRange]);

  const fetchCumulativeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cumulative-data?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('累計データの取得に失敗しました');
      }
      const cumulativeData = await response.json();
      setData(cumulativeData);
    } catch (error) {
      console.error('累計データの取得に失敗しました:', error);
      // エラーの場合は空配列を設定
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const tooltipFormatter = (value: any) => [`${value}件`, '累計アカウント数'] as [string, string];
  const labelFormatter = (label: any) => `日付: ${label}`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {loading ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">累計アカウント数推移</h3>
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