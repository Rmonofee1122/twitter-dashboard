"use client";

import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  LucideIcon,
  Clock3,
} from "lucide-react";
import React, { memo, useMemo } from "react";

interface StatusCounts {
  active: number;
  shadowban: number;
  stopped: number;
  examination: number;
  suspended: number;
  temp_locked: number;
  notShadowban: number;
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
        label: "アクティブ",
        count: statusCounts.active || 0,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        label: "シャドBAN",
        count: statusCounts.shadowban || 0,
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        label: "一時制限",
        count: (statusCounts.stopped || 0) + (statusCounts.temp_locked || 0),
        icon: Clock3,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        label: "審査中",
        count: statusCounts.examination || 0,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        label: "凍結",
        count: statusCounts.suspended || 0,
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
    ],
    [
      statusCounts.active,
      statusCounts.shadowban,
      statusCounts.stopped,
      statusCounts.temp_locked,
      statusCounts.examination,
      statusCounts.suspended,
    ]
  );

  // パーセンテージ計算をメモ化
  const percentages = useMemo(
    () =>
      statusItems.map((item) =>
        totalAccounts > 0
          ? ((item.count / totalAccounts) * 100).toFixed(1)
          : "0"
      ),
    [statusItems, totalAccounts]
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
        <p className="text-gray-600">
          シャドBANされていないアカウント{" "}
          {statusCounts.notShadowban?.toLocaleString() || 0} 件
        </p>
      </div>

      {/* ステータス別件数表示 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusItems.map((item, index) => (
          <StatusCard
            key={`${item.label}-${item.count}`}
            item={item}
            percentage={percentages[index]}
          />
        ))}
      </div>
    </div>
  );
});

// 個別のステータスカードコンポーネントをメモ化
const StatusCard = memo(
  ({ item, percentage }: { item: StatusItem; percentage: string }) => {
    const Icon = item.icon;

    return (
      <div
        className={`${item.bgColor} rounded-lg p-4 border border-gray-200`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {item.count.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{percentage}%</p>
          </div>
        </div>
      </div>
    );
  }
);

StatusCard.displayName = "StatusCard";

export default AccountStatusSummary;
