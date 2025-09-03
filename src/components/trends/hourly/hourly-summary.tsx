"use client";

import { memo } from "react";
import { BarChart3, Activity, Clock8 } from "lucide-react";

interface HourlySummary {
  totalAccounts: number;
  peakHour: number;
  peakCount: number;
  averageHourly: number;
  dateRange: { startDate: string; endDate: string };
}

interface HourlySummaryProps {
  summary: HourlySummary;
}

const HourlySummaryCards = memo(function HourlySummaryCards({
  summary,
}: HourlySummaryProps) {
  const getTimeLabel = (hour: number) => {
    if (hour === 0) return "0:00";
    if (hour < 10) return `${hour}:00`;
    return `${hour}:00`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-50 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">総アカウント数</p>
            <p className="text-2xl font-semibold text-gray-900">
              {summary.totalAccounts.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-green-50 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">ピーク時間</p>
            <p className="text-2xl font-semibold text-gray-900">
              {getTimeLabel(summary.peakHour)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-purple-50 p-2 rounded-lg">
            <Clock8 className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">ピーク時作成数</p>
            <p className="text-2xl font-semibold text-gray-900">
              {summary.peakCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-orange-50 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">平均時間作成数</p>
            <p className="text-2xl font-semibold text-gray-900">
              {summary.averageHourly.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HourlySummaryCards;