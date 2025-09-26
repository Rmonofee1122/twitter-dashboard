"use client";

import { memo } from "react";
import { Calendar } from "lucide-react";

interface TweetLogDateFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onQuickSelect?: (start: string, end: string) => void;
  onClearDates?: () => void;
}

const TweetLogDateFilters = memo(function TweetLogFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
  onClearDates,
}: TweetLogDateFiltersProps) {
  // クイック選択用の日付計算
  const getQuickSelectOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const past7Days = new Date(today);
    past7Days.setDate(today.getDate() - 7);

    const past30Days = new Date(today);
    past30Days.setDate(today.getDate() - 30);

    const past90Days = new Date(today);
    past90Days.setDate(today.getDate() - 90);

    // 今月の開始日
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 先月の開始日と終了日
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    return [
      {
        label: "今日",
        start: formatDate(today),
        end: formatDate(today),
      },
      {
        label: "昨日",
        start: formatDate(yesterday),
        end: formatDate(yesterday),
      },
      {
        label: "過去7日間",
        start: formatDate(past7Days),
        end: formatDate(today),
      },
      {
        label: "今週",
        start: formatDate(startOfWeek),
        end: formatDate(today),
      },
      {
        label: "過去30日間",
        start: formatDate(past30Days),
        end: formatDate(today),
      },
      {
        label: "今月",
        start: formatDate(startOfMonth),
        end: formatDate(today),
      },
      {
        label: "先月",
        start: formatDate(startOfLastMonth),
        end: formatDate(endOfLastMonth),
      },
      {
        label: "過去90日間",
        start: formatDate(past90Days),
        end: formatDate(today),
      },
    ];
  };

  const quickOptions = getQuickSelectOptions();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            日付フィルター
          </h3>
        </div>
      </div>
      <div className="space-y-4">
        {/* 開始日、終了日、期間クイック選択 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 開始日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 終了日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 期間クイック選択 */}
          {onQuickSelect && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期間クイック選択
              </label>
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => {
                    const selectedOption = quickOptions.find(
                      (opt) => opt.label === e.target.value
                    );
                    if (selectedOption) {
                      onQuickSelect(selectedOption.start, selectedOption.end);
                    }
                  }}
                  defaultValue=""
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="" disabled>
                    期間を選択...
                  </option>
                  {quickOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {onClearDates && (
                  <button
                    onClick={onClearDates}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TweetLogDateFilters;
