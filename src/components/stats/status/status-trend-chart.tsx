"use client";

import { memo } from "react";
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

interface StatusTrendChartProps {
  chartData: Array<{
    date: string;
    active: number;
    suspended: number;
    pending: number;
    excluded: number;
  }>;
}

const StatusTrendChart = memo(function StatusTrendChart({
  chartData,
}: StatusTrendChartProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTooltipDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        日別ステータス推移
      </h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => formatTooltipDate(value as string)}
              formatter={(value, name) => [
                value,
                name === "active"
                  ? "アクティブ"
                  : name === "suspended"
                  ? "BAN・凍結"
                  : name === "pending"
                  ? "保留中"
                  : "除外",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "active"
                  ? "アクティブ"
                  : value === "suspended"
                  ? "BAN・凍結"
                  : value === "pending"
                  ? "保留中"
                  : "除外"
              }
            />
            {chartData.length > 0 && chartData[0].hasOwnProperty('active') && (
              <Line
                type="monotone"
                dataKey="active"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            )}
            {chartData.length > 0 && chartData[0].hasOwnProperty('suspended') && (
              <Line
                type="monotone"
                dataKey="suspended"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              />
            )}
            {chartData.length > 0 && chartData[0].hasOwnProperty('pending') && (
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
              />
            )}
            {chartData.length > 0 && chartData[0].hasOwnProperty('excluded') && (
              <Line
                type="monotone"
                dataKey="excluded"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ fill: "#6b7280", strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default StatusTrendChart;