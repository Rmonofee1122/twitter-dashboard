"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock8, BarChart3, Activity, Sunrise, Sun, Moon } from "lucide-react";
import DateFilter from "@/components/accounts/date-filter";

interface HourlyData {
  hour: number;
  count: number;
  percentage: number;
}

interface HourlyStatsData {
  chartData: HourlyData[];
  summary: {
    totalAccounts: number;
    peakHour: number;
    peakCount: number;
    averageHourly: number;
    dateRange: { startDate: string; endDate: string };
  };
}

export default function HourlyTrendsPage() {
  const [hourlyData, setHourlyData] = useState<HourlyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHourlyData = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true);
      
      let apiStartDate = start || startDate;
      let apiEndDate = end || endDate;
      
      // 日付が指定されていない場合はデフォルトで過去30日間
      if (!apiStartDate || !apiEndDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        apiEndDate = today.toISOString().split('T')[0];
        apiStartDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      
      const response = await fetch(`/api/hourly-stats?startDate=${apiStartDate}&endDate=${apiEndDate}`);
      const data = await response.json();
      setHourlyData(data);
    } catch (error) {
      console.error("時間別データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchHourlyData();
  }, [fetchHourlyData]);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    fetchHourlyData(date, endDate);
  }, [endDate, fetchHourlyData]);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    fetchHourlyData(startDate, date);
  }, [startDate, fetchHourlyData]);

  const handleQuickSelect = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchHourlyData(start, end);
  }, [fetchHourlyData]);

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchHourlyData("", "");
  }, [fetchHourlyData]);

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
    if (hour >= 6 && hour < 12) return { label: "朝", color: "bg-yellow-100 text-yellow-800" };
    if (hour >= 12 && hour < 18) return { label: "昼", color: "bg-orange-100 text-orange-800" };
    if (hour >= 18 && hour < 22) return { label: "夜", color: "bg-purple-100 text-purple-800" };
    return { label: "深夜", color: "bg-blue-100 text-blue-800" };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock8 className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">時間別作成数分布</h1>
        </div>
      </div>

      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClear={handleClearFilter}
      />

      {/* 統計サマリー */}
      {hourlyData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総アカウント数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hourlyData.summary.totalAccounts.toLocaleString()}
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
                  {getTimeLabel(hourlyData.summary.peakHour)}
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
                  {hourlyData.summary.peakCount.toLocaleString()}
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
                  {hourlyData.summary.averageHourly.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 時間別分布表 */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          時間別作成数分布
        </h3>
        
        {hourlyData?.chartData ? (
          <div className="space-y-2">
            {hourlyData.chartData.map((item, index) => {
              const category = getTimeCategory(item.hour);
              const maxCount = Math.max(...hourlyData.chartData.map(d => d.count));
              const barWidth = (item.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 w-20">
                    {getTimeIcon(item.hour)}
                    <span className="font-mono text-sm font-medium">
                      {getTimeLabel(item.hour)}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.color} w-12 text-center`}>
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
        ) : (
          <div className="text-center py-12 text-gray-500">
            データがありません
          </div>
        )}
      </div>
    </div>
  );
}