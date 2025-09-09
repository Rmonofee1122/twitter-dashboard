"use client";

import { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function DateFilter({
  startDate,
  endDate,
  onDateChange,
  onReset,
  isLoading = false,
}: DateFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [selectedPreset, setSelectedPreset] = useState("last30Days"); // デフォルトは過去30日

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setLocalStartDate(newStartDate);
    setSelectedPreset(""); // 手動変更時にプリセット選択をクリア
    onDateChange(newStartDate, localEndDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setLocalEndDate(newEndDate);
    setSelectedPreset(""); // 手動変更時にプリセット選択をクリア
    onDateChange(localStartDate, newEndDate);
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const newStartDate = thirtyDaysAgo.toISOString().split("T")[0];
    const newEndDate = today.toISOString().split("T")[0];
    
    setLocalStartDate(newStartDate);
    setLocalEndDate(newEndDate);
    setSelectedPreset("last30Days"); // リセット時は過去30日を選択状態にする
    onReset();
  };

  // 日付計算ヘルパー関数
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // 日曜日を週の開始とする
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getYearStart = (date: Date) => {
    return new Date(date.getFullYear(), 0, 1);
  };

  const getYearEnd = (date: Date) => {
    return new Date(date.getFullYear(), 11, 31);
  };

  // クイック選択用のプリセット
  const presets = [
    {
      label: "今日",
      value: "today",
    },
    {
      label: "昨日",
      value: "yesterday",
    },
    {
      label: "今週",
      value: "thisWeek",
    },
    {
      label: "今月",
      value: "thisMonth",
    },
    {
      label: "先月",
      value: "lastMonth",
    },
    {
      label: "今年",
      value: "thisYear",
    },
    {
      label: "過去7日",
      value: "last7Days",
    },
    {
      label: "過去30日",
      value: "last30Days",
    },
    {
      label: "過去90日",
      value: "last90Days",
    },
  ];

  const handlePresetChange = (presetValue: string) => {
    if (!presetValue) return;
    
    const today = new Date();
    let newStartDate: Date;
    let newEndDate: Date;

    switch (presetValue) {
      case "today":
        newStartDate = new Date(today);
        newEndDate = new Date(today);
        break;
      case "yesterday":
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 1);
        newEndDate = new Date(newStartDate);
        break;
      case "thisWeek":
        newStartDate = getWeekStart(today);
        newEndDate = getWeekEnd(today);
        break;
      case "thisMonth":
        newStartDate = getMonthStart(today);
        newEndDate = getMonthEnd(today);
        break;
      case "lastMonth":
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        newStartDate = getMonthStart(lastMonth);
        newEndDate = getMonthEnd(lastMonth);
        break;
      case "thisYear":
        newStartDate = getYearStart(today);
        newEndDate = getYearEnd(today);
        break;
      case "last7Days":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 6); // 今日を含む7日間
        break;
      case "last30Days":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 29); // 今日を含む30日間
        break;
      case "last90Days":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 89); // 今日を含む90日間
        break;
      default:
        return;
    }

    const startDateStr = newStartDate.toISOString().split("T")[0];
    const endDateStr = newEndDate.toISOString().split("T")[0];
    
    setLocalStartDate(startDateStr);
    setLocalEndDate(endDateStr);
    setSelectedPreset(presetValue);
    onDateChange(startDateStr, endDateStr);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">期間フィルター</h3>
        </div>
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          リセット
        </button>
      </div>

      <div className="space-y-4">
        {/* 日付入力 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={localStartDate}
              onChange={handleStartDateChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={localEndDate}
              onChange={handleEndDateChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          {/* プリセット選択 */}
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            クイック選択
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white"
          >
            <option value="" disabled>
              期間を選択してください
            </option>
            <optgroup label="特定の期間">
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="thisWeek">今週</option>
              <option value="thisMonth">今月</option>
              <option value="lastMonth">先月</option>
              <option value="thisYear">今年</option>
            </optgroup>
            <optgroup label="過去の期間">
              <option value="last7Days">過去7日</option>
              <option value="last30Days">過去30日</option>
              <option value="last90Days">過去90日</option>
            </optgroup>
          </select>
          </div>
          
        </div>

        {/* 期間表示 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <span className="font-medium">選択期間:</span> {localStartDate} ～ {localEndDate}
          {(() => {
            const start = new Date(localStartDate);
            const end = new Date(localEndDate);
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return ` (${daysDiff + 1}日間)`;
          })()}
        </div>
      </div>
    </div>
  );
}