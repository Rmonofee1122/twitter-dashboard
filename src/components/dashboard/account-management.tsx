"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  LucideIcon,
} from "lucide-react";
import StatCard from "@/components/ui/stat-card";

interface AccountManagementStats {
  active: number; // app_login = 'FarmUp'
  shadowban: number; // app_login = 'true' または true
  stopped: number; // app_login = 'false' または false
  examination: number; // app_login = 'false' または false
  suspended: number; // app_login = 'suspend' または 'email_ban'
}

export default function AccountManagement() {
  const [stats, setStats] = useState<AccountManagementStats>({
    active: 0,
    shadowban: 0,
    stopped: 0,
    examination: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountStats();
  }, []);

  const fetchAccountStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/account-stats");

      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("アカウント統計の取得に失敗しました:", error);
      // エラーの場合は仮のデータを設定
      setStats({
        active: 0,
        shadowban: 0,
        stopped: 0,
        examination: 0,
        suspended: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "アクティブ",
      subtitle: "",
      value: stats.active,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "シャドBAN",
      subtitle: "",
      value: stats.shadowban,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "一時停止",
      subtitle: "",
      value: stats.stopped,
      icon: Pause,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "審査中",
      subtitle: "",
      value: stats.examination,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "凍結",
      subtitle: "",
      value: stats.suspended,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          アカウント管理
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalAccounts =
    stats.active +
    stats.shadowban +
    stats.stopped +
    stats.examination +
    stats.suspended;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            アカウント管理
          </h3>
          <p className="text-sm text-gray-600">
            ステータス別のアカウント数 (総計: {totalAccounts.toLocaleString()}
            件)
          </p>
        </div>
        <button
          onClick={fetchAccountStats}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          更新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            subtitle={stat.subtitle}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </div>

      {/* ステータス分布の視覚的表示 */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          ステータス分布
        </h4>
        <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-green-500"
            style={{ width: `${(stats.active / totalAccounts) * 100}%` }}
            title={`アクティブ: ${stats.active}件`}
          />
          <div
            className="bg-orange-500"
            style={{ width: `${(stats.shadowban / totalAccounts) * 100}%` }}
            title={`シャドBAN: ${stats.shadowban}件`}
          />
          <div
            className="bg-blue-500"
            style={{ width: `${(stats.examination / totalAccounts) * 100}%` }}
            title={`一時停止: ${stats.examination}件`}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${(stats.examination / totalAccounts) * 100}%` }}
            title={`審査中: ${stats.examination}件`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${(stats.suspended / totalAccounts) * 100}%` }}
            title={`凍結: ${stats.suspended}件`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            アクティブ ({((stats.active / totalAccounts) * 100).toFixed(1)}%)
          </span>
          <span>
            シャドバン ({((stats.shadowban / totalAccounts) * 100).toFixed(1)}%)
          </span>
          <span>
            一時停止 ({((stats.stopped / totalAccounts) * 100).toFixed(1)}%)
          </span>
          <span>
            審査中 ({((stats.examination / totalAccounts) * 100).toFixed(1)}%)
          </span>
          <span>
            凍結 ({((stats.suspended / totalAccounts) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
