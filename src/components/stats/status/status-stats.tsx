"use client";

import { memo, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Users,
} from "lucide-react";

interface StatusStatsProps {
  totalStats: {
    total: number;
    active: number;
    shadowban: number;
    stopped: number;
    examination: number;
    suspended: number;
  };
}

const StatusStats = memo(function StatusStats({
  totalStats,
}: StatusStatsProps) {
  const stats = useMemo(() => {
    const { total, active, shadowban, stopped, examination, suspended } =
      totalStats;

    return {
      total,
      active,
      shadowban,
      stopped,
      examination,
      suspended,
      activeRate: total > 0 ? ((active / total) * 100).toFixed(1) : "0.0",
      shadowbanRate: total > 0 ? ((shadowban / total) * 100).toFixed(1) : "0.0",
      stoppedRate: total > 0 ? ((stopped / total) * 100).toFixed(1) : "0.0",
      examinationRate:
        total > 0 ? ((examination / total) * 100).toFixed(1) : "0.0",
      suspendedRate: total > 0 ? ((suspended / total) * 100).toFixed(1) : "0.0",
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
      title: "シャドBAN",
      value: stats.shadowban?.toLocaleString(),
      percentage: `${stats.shadowbanRate}%`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "シャドバン判定されたアカウント",
    },
    {
      title: "一時停止",
      value: stats.stopped?.toLocaleString(),
      percentage: `${stats.stoppedRate}%`,
      icon: Pause,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "一時的に停止されたアカウント",
    },
    {
      title: "審査中",
      value: stats.examination?.toLocaleString(),
      percentage: `${stats.examinationRate}%`,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "審査プロセス中のアカウント",
    },
    {
      title: "凍結",
      value: stats.suspended.toLocaleString(),
      percentage: `${stats.suspendedRate}%`,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "凍結されたアカウント",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
