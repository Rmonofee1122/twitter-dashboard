"use client";

import { memo, useCallback, useMemo } from "react";
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, Pause, X } from "lucide-react";

interface StatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  onClear: () => void;
}

const StatusFilter = memo(function StatusFilter({
  selectedStatuses,
  onStatusChange,
  onClear,
}: StatusFilterProps) {
  const statusOptions = useMemo(() => [
    {
      value: "active",
      label: "アクティブ",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      value: "shadowban",
      label: "シャドBAN",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      value: "stopped",
      label: "一時停止",
      icon: Pause,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      value: "examination",
      label: "審査中",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      value: "suspended",
      label: "凍結",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ], []);

  const handleStatusToggle = useCallback((statusValue: string) => {
    const newStatuses = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter(s => s !== statusValue)
      : [...selectedStatuses, statusValue];
    onStatusChange(newStatuses);
  }, [selectedStatuses, onStatusChange]);

  const handleSelectAll = useCallback(() => {
    onStatusChange(statusOptions.map(option => option.value));
  }, [onStatusChange, statusOptions]);

  const handleDeselectAll = useCallback(() => {
    onStatusChange([]);
  }, [onStatusChange]);

  const hasFilter = useMemo(() => 
    selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length,
    [selectedStatuses.length, statusOptions.length]
  );

  const isAllSelected = useMemo(() => 
    selectedStatuses.length === statusOptions.length,
    [selectedStatuses.length, statusOptions.length]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            ステータスフィルター
          </h3>
          {hasFilter && (
            <button
              onClick={onClear}
              className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              クリア
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            すべて選択
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={selectedStatuses.length === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            すべて解除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusOptions.map((option) => {
          const isSelected = selectedStatuses.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleStatusToggle(option.value)}
              className={`
                flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? `${option.bgColor} ${option.borderColor} ${option.color}`
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <option.icon className="h-5 w-5 mr-2" />
              <span className="font-medium text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>

      {hasFilter && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">選択中のステータス:</span>{" "}
            {selectedStatuses.map(status => {
              const option = statusOptions.find(opt => opt.value === status);
              return option?.label;
            }).join("、")}
          </p>
        </div>
      )}
    </div>
  );
});

export default StatusFilter;