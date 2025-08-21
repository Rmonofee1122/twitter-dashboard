"use client";

import { memo, useMemo } from "react";
import { CheckCircle, XCircle, Clock, Minus, Users } from "lucide-react";

interface StatusStatsProps {
  totalStats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
    excluded: number;
  };
}

const StatusStats = memo(function StatusStats({ totalStats }: StatusStatsProps) {
  const stats = useMemo(() => {
    const { total, active, suspended, pending, excluded } = totalStats;
    
    return {
      total,
      active,
      suspended,
      pending,
      excluded,
      activeRate: total > 0 ? ((active / total) * 100).toFixed(1) : "0.0",
      suspendedRate: total > 0 ? ((suspended / total) * 100).toFixed(1) : "0.0",
      pendingRate: total > 0 ? ((pending / total) * 100).toFixed(1) : "0.0",
      excludedRate: total > 0 ? ((excluded / total) * 100).toFixed(1) : "0.0",
    };
  }, [totalStats]);

  const statusCards = [
    {
      title: "総アカウント数",
      value: stats.total.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "全アカウント数",
    },
    {
      title: "アクティブ",
      value: stats.active.toLocaleString(),
      percentage: `${stats.activeRate}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "正常に動作しているアカウント",
    },
    {
      title: "BAN・凍結",
      value: stats.suspended.toLocaleString(),
      percentage: `${stats.suspendedRate}%`,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "停止またはBANされたアカウント",
    },
    {
      title: "保留中",
      value: stats.pending.toLocaleString(),
      percentage: `${stats.pendingRate}%`,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "処理待ちのアカウント",
    },
    {
      title: "除外",
      value: stats.excluded.toLocaleString(),
      percentage: `${stats.excludedRate}%`,
      icon: Minus,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      description: "除外設定されたアカウント",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statusCards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
                {card.percentage && (
                  <p className={`ml-2 text-sm ${card.color}`}>
                    {card.percentage}
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
});

export default StatusStats;