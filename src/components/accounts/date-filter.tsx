'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onQuickSelect: (start: string, end: string) => void;
  onClear: () => void;
}

interface QuickSelectOption {
  label: string;
  onClick: () => void;
}

const DateFilter = memo(function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
  onClear
}: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);

  const { today, yesterday, thisWeekStart, thisMonthStart } = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return { today, yesterday, thisWeekStart, thisMonthStart };
  }, []);

  const quickSelectOptions: QuickSelectOption[] = useMemo(() => [
    {
      label: '今日',
      onClick: () => {
        const todayStr = formatDate(today);
        onQuickSelect(todayStr, todayStr);
      }
    },
    {
      label: '昨日',
      onClick: () => {
        const yesterdayStr = formatDate(yesterday);
        onQuickSelect(yesterdayStr, yesterdayStr);
      }
    },
    {
      label: '今週',
      onClick: () => {
        const weekStartStr = formatDate(thisWeekStart);
        const todayStr = formatDate(today);
        onQuickSelect(weekStartStr, todayStr);
      }
    },
    {
      label: '今月',
      onClick: () => {
        const monthStartStr = formatDate(thisMonthStart);
        const todayStr = formatDate(today);
        onQuickSelect(monthStartStr, todayStr);
      }
    }
  ], [today, yesterday, thisWeekStart, thisMonthStart, formatDate, onQuickSelect]);

  const hasDateFilter = useMemo(() => startDate || endDate, [startDate, endDate]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStartDateChange(e.target.value);
  }, [onStartDateChange]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onEndDateChange(e.target.value);
  }, [onEndDateChange]);

  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">日付フィルター</h3>
          {hasDateFilter && (
            <button
              onClick={onClear}
              className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              クリア
            </button>
          )}
        </div>
        <button
          onClick={toggleOpen}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          {isOpen ? '閉じる' : '開く'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* 日付範囲選択 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* クイック選択ボタン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              クイック選択
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickSelectOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.onClick}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 現在のフィルター表示 */}
          {hasDateFilter && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">フィルター期間:</span>{' '}
                {startDate && (
                  <span>
                    {new Date(startDate).toLocaleDateString('ja-JP')}
                  </span>
                )}
                {startDate && endDate && <span> 〜 </span>}
                {endDate && (
                  <span>
                    {new Date(endDate).toLocaleDateString('ja-JP')}
                  </span>
                )}
                {!startDate && endDate && (
                  <span>
                    {new Date(endDate).toLocaleDateString('ja-JP')} 以前
                  </span>
                )}
                {startDate && !endDate && (
                  <span>
                    {new Date(startDate).toLocaleDateString('ja-JP')} 以降
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DateFilter;