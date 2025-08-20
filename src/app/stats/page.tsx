"use client";

import { useEffect, useState } from "react";
import StatsHeader from "@/components/stats/stats-header";
import SummaryCards from "@/components/stats/summary-cards";
import CreationTrendsChart from "@/components/stats/creation-trends-chart";
import StatusDistributionChart from "@/components/stats/status-distribution-chart";
import IpRankingList from "@/components/stats/ip-ranking-list";
import PerformanceMetrics from "@/components/stats/performance-metrics";
import { fetchStatsData, fetchCreationTrendsData, type TotalStats, type ChartData } from "@/lib/stats-api";

interface StatsData {
  chartData: ChartData;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  ipDistribution: Array<{ ip: string; count: number }>;
  totalStats: TotalStats;
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData>({
    chartData: {
      dailyCreations: [],
      weeklyCreations: [],
      monthlyCreations: [],
    },
    statusDistribution: [],
    ipDistribution: [],
    totalStats: {
      totalAccounts: 0,
      activeAccounts: 0,
      todayCreated: 0,
      weekCreated: 0,
      monthCreated: 0,
    },
  });

  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  useEffect(() => {
    async function loadStatsData() {
      const [realStats, trendsData] = await Promise.all([
        fetchStatsData(),
        fetchCreationTrendsData()
      ]);
      
      setStatsData({
        chartData: trendsData,
        statusDistribution: [
          { name: "アクティブ", value: realStats.activeAccounts, color: "#10B981" },
          { name: "非アクティブ", value: realStats.totalAccounts - realStats.activeAccounts, color: "#F59E0B" },
          { name: "停止中", value: 0, color: "#EF4444" },
        ],
        ipDistribution: [
          { ip: "192.168.1.100", count: 234 },
          { ip: "192.168.1.101", count: 189 },
          { ip: "192.168.1.102", count: 167 },
          { ip: "192.168.1.103", count: 145 },
          { ip: "192.168.1.104", count: 123 },
        ],
        totalStats: realStats,
      });
    }

    loadStatsData();
  }, []);

  const handlePeriodChange = (period: "daily" | "weekly" | "monthly") => {
    setSelectedPeriod(period);
  };

  return (
    <div className="space-y-6">
      <StatsHeader />
      {/* 統計カード */}
      <SummaryCards totalStats={statsData.totalStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* アカウント作成推移 */}
        <CreationTrendsChart
          chartData={statsData.chartData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
        {/* アカウント状態分布 */}
        <StatusDistributionChart
          statusDistribution={statsData.statusDistribution}
        />
      </div>

      <IpRankingList ipDistribution={statsData.ipDistribution} />
      <PerformanceMetrics totalStats={statsData.totalStats} />
    </div>
  );
}
