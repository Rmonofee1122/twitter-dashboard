"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Plus,
  TrendingUp,
  Twitter,
  Activity,
  Hash,
  MessageCircle,
} from "lucide-react";
import { DashboardStats } from "@/types/database";
import StatCard from "@/components/ui/stat-card";
import ActivityCard from "@/components/dashboard/activity-card";
import QuickLinks from "@/components/dashboard/quick-links";
import ProgressBar from "@/components/ui/progress-bar";
import AccountManagement from "@/components/dashboard/account-management";
import AccountCreationHistory from "@/components/dashboard/account-creation-history";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    accountsCreatedToday: 0,
    accountsCreatedThisWeek: 0,
    accountsCreatedThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState({
    todayCreated: 0,
    weekCreated: 0,
    monthCreated: 0,
    activeAccounts: 0,
    totalAccounts: 0,
  });
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Supabaseからダッシュボードデータを取得
      // 仮のデータを設定
      setStats({
        totalAccounts: 2547,
        activeAccounts: 2341,
        accountsCreatedToday: 12,
        accountsCreatedThisWeek: 89,
        accountsCreatedThisMonth: 347,
      });
    } catch (error) {
      console.error("ダッシュボードデータの取得に失敗しました:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await fetch("/api/recent-activity");
      if (!response.ok) {
        throw new Error("最近の活動データの取得に失敗しました");
      }
      const data = await response.json();
      setRecentActivity(data);
    } catch (error) {
      console.error("最近の活動データの取得に失敗しました:", error);
      // エラーの場合は仮のデータを設定
      setRecentActivity({
        todayCreated: 12,
        weekCreated: 89,
        monthCreated: 347,
        activeAccounts: 2341,
        totalAccounts: 5000,
      });
    } finally {
      setActivityLoading(false);
    }
  };

  const statCards = [
    {
      title: "総アカウント数",
      value: stats.totalAccounts,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "アクティブアカウント",
      value: stats.activeAccounts,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "今日の作成数",
      value: stats.accountsCreatedToday,
      icon: Plus,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "今月の作成数",
      value: stats.accountsCreatedThisMonth,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      action: "新規アカウント作成",
      count: recentActivity.todayCreated,
      time: "今日",
    },
    {
      action: "今週のアカウント作成",
      count: recentActivity.weekCreated,
      time: "7日間",
    },
    {
      action: "今月のアカウント作成",
      count: recentActivity.monthCreated,
      time: "今月",
    },
    {
      action: "総アクティブアカウント",
      count: recentActivity.activeAccounts,
      time: "現在",
    },
  ];

  const quickLinks = [
    {
      href: "/accounts",
      icon: Users,
      label: "アカウント一覧を見る",
      hoverColor: "hover:border-blue-500 hover:bg-blue-50",
    },
    {
      href: "/stats",
      icon: BarChart3,
      label: "詳細統計を見る",
      hoverColor: "hover:border-green-500 hover:bg-green-50",
    },
    {
      href: "/trends",
      icon: TrendingUp,
      label: "作成推移を見る",
      hoverColor: "hover:border-purple-500 hover:bg-purple-50",
    },
  ];

  const activeRate =
    (recentActivity.activeAccounts / recentActivity.totalAccounts) * 100;

  return (
    <div className="space-y-6">
      {/* ダッシュボードヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ダッシュボード概要
        </h2>
        <p className="text-gray-600">
          Twitterアカウントの管理状況とパフォーマンスを確認できます
        </p>
      </div>

      {/* アカウント管理 */}
      <AccountManagement />

      {/* クイックアクション */}
      <QuickLinks links={quickLinks} />

      {/* 統計カード */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </div> */}

      {/* クイックアクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <ActivityCard
          title="最近の活動"
          activities={recentActivities}
          onRefresh={fetchRecentActivity}
          loading={activityLoading}
        /> */}

        {/* アカウント状況 */}
        {/* <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            アカウント状況
          </h3>
          <div className="space-y-4">
            <ProgressBar
              percentage={activeRate}
              label="アクティブ率"
              showPercentage={true}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {recentActivity.weekCreated}
                </p>
                <p className="text-sm text-gray-600">今週作成</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {recentActivity.monthCreated}
                </p>
                <p className="text-sm text-gray-600">今月作成</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* アカウントの追加履歴 */}
      <AccountCreationHistory />
    </div>
  );
}
