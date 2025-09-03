"use client";

import { memo, useState, useEffect } from "react";
import { Sunrise, Sun, Moon, Calendar, RefreshCw } from "lucide-react";

interface HourlyData {
  hour: number;
  count: number;
  percentage: number;
}

interface HourlyDistributionData {
  chartData: HourlyData[];
  summary: {
    totalAccounts: number;
    peakHour: number;
    peakCount: number;
    averageHourly: number;
    date: string;
  };
}

interface HourlyDistributionChartProps {
  chartData?: HourlyData[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

const HourlyDistributionChart = memo(function HourlyDistributionChart({
  chartData: propChartData,
  selectedDate,
  onDateChange,
}: HourlyDistributionChartProps) {
  const [data, setData] = useState<HourlyDistributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>(() => {
    if (selectedDate) return selectedDate;
    // デフォルトで昨日の日付
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });

  const fetchHourlyData = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/hourly-distribution?date=${encodeURIComponent(date)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("時間別データ取得エラー:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // propsでchartDataが渡されている場合は、そちらを優先
    if (!propChartData) {
      fetchHourlyData(currentDate);
    }
  }, [currentDate, propChartData]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
    if (!propChartData) {
      fetchHourlyData(newDate);
    }
  };

  const handleRefresh = () => {
    if (!propChartData) {
      fetchHourlyData(currentDate);
    }
  };

  // propsのchartDataがある場合はそれを使用、ない場合は独自取得データを使用
  const displayData = propChartData || data?.chartData || [];
  const getTimeLabel = (hour: number) => {
    if (hour === 0) return "0:00";
    if (hour < 10) return `${hour}:00`;
    return `${hour}:00`;
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return <Sunrise className="h-4 w-4" />;
    if (hour >= 12 && hour < 18) return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  const getTimeCategory = (hour: number) => {
    if (hour >= 6 && hour < 12)
      return { label: "朝", color: "bg-yellow-100 text-yellow-800" };
    if (hour >= 12 && hour < 18)
      return { label: "昼", color: "bg-orange-100 text-orange-800" };
    if (hour >= 18 && hour < 22)
      return { label: "夜", color: "bg-purple-100 text-purple-800" };
    return { label: "深夜", color: "bg-blue-100 text-blue-800" };
  };

  const maxCount =
    displayData.length > 0 ? Math.max(...displayData.map((d) => d.count)) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          時間別作成数分布
          {data?.summary && (
            <span className="ml-2 text-sm text-gray-500">
              ({data.summary.date})
            </span>
          )}
        </h3>

        <div className="flex items-center space-x-2">
          {!propChartData && (
            <>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="更新"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          データを読み込み中...
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          データがありません
        </div>
      ) : (
        <>
          {data?.summary && !propChartData && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">総作成数:</span>
                  <span className="ml-1 font-semibold">
                    {data.summary.totalAccounts.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ピーク時間:</span>
                  <span className="ml-1 font-semibold">
                    {getTimeLabel(data.summary.peakHour)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ピーク時:</span>
                  <span className="ml-1 font-semibold">
                    {data.summary.peakCount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">平均/時:</span>
                  <span className="ml-1 font-semibold">
                    {data.summary.averageHourly.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {displayData.map((item, index) => {
              const category = getTimeCategory(item.hour);
              const barWidth = (item.count / maxCount) * 100;

              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 w-20">
                    {getTimeIcon(item.hour)}
                    <span className="font-mono text-sm font-medium">
                      {getTimeLabel(item.hour)}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${category.color} w-12 text-center`}
                  >
                    {category.label}
                  </span>

                  <div className="flex-1 flex items-center space-x-3">
                    <div className="w-64 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 w-16 text-right">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

export default HourlyDistributionChart;
