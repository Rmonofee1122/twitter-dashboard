"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DomainTrendData {
  created_date: string;
  domain: string;
  count: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

interface DomainCreationTrendsChartProps {
  trendData?: ChartDataPoint[];
  startDate?: string;
  endDate?: string;
}

const DOMAIN_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export default function DomainCreationTrendsChart({
  trendData,
  startDate,
  endDate,
}: DomainCreationTrendsChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trendData && trendData.length > 0) {
      setChartData(trendData);

      // ドメイン名を抽出（date以外のキー）
      const domainKeys = Object.keys(trendData[0]).filter(
        (key) => key !== "date"
      );
      setDomains(domainKeys);
      setLoading(false);
    } else {
      fetchDomainTrendsData();
    }
  }, [trendData]);

  const fetchDomainTrendsData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/domain-trends");
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const data: DomainTrendData[] = await response.json();

      // 過去30日分のデータを処理
      const processedData = processChartData(data);
      setChartData(processedData.chartData);
      setDomains(processedData.domains);
    } catch (error) {
      console.error("ドメイン別推移データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: DomainTrendData[]) => {
    // 過去30日の日付を生成
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    // ドメインの一覧を取得
    const uniqueDomains = [...new Set(data.map((item) => item.domain))];

    // 日付ごとのデータを構築
    const chartData: ChartDataPoint[] = dates.map((date) => {
      const dayData: ChartDataPoint = { date };

      uniqueDomains.forEach((domain) => {
        const found = data.find(
          (item) => item.created_date === date && item.domain === domain
        );
        dayData[domain] = found ? found.count : 0;
      });

      return dayData;
    });

    return {
      chartData,
      domains: uniqueDomains,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ドメイン別アカウント作成推移
        </h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          ドメイン別アカウント作成推移
        </h3>
        <span className="text-sm text-gray-500">
          {startDate ? startDate : "過去30日前"} ～ {endDate ? endDate : "今日"}
        </span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              labelFormatter={(value) => `日付: ${formatDate(value as string)}`}
              formatter={(value: number, name: string) => [`${value}件`, name]}
            />
            <Legend />
            {domains.map((domain, index) => (
              <Line
                key={domain}
                type="monotone"
                dataKey={domain}
                stroke={DOMAIN_COLORS[index % DOMAIN_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={domain}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>各メールドメイン別の日次アカウント作成数の推移を表示しています。</p>
      </div>
    </div>
  );
}
