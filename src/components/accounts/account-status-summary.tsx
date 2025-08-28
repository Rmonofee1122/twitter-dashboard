"use client";

import { Clock, CheckCircle, XCircle, Minus, LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";

interface StatusCounts {
  pending: number;
  active: number;
  suspended: number;
  excluded: number;
}

interface AccountStatusSummaryProps {
  totalAccounts: number;
  statusCounts: StatusCounts;
}

interface StatusItem {
  label: string;
  count: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const AccountStatusSummary = memo(function AccountStatusSummary({
  totalAccounts,
  statusCounts,
}: AccountStatusSummaryProps) {
  const statusItems: StatusItem[] = useMemo(
    () => [
      {
        label: "保留中",
        count: statusCounts.pending,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        label: "アクティブ",
        count: statusCounts.active,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        label: "BAN",
        count: statusCounts.suspended,
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        label: "除外",
        count: statusCounts.excluded,
        icon: Minus,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      },
    ],
    [statusCounts]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          アカウント一覧
        </h1>
        <p className="text-gray-600">
          登録済みのTwitterアカウント {totalAccounts.toLocaleString()} 件
        </p>
      </div>

      {/* ステータス別件数表示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-lg p-4 border border-gray-200`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {item.count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {totalAccounts > 0
                    ? `${((item.count / totalAccounts) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AccountStatusSummary;
