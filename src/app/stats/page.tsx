"use client";

import { useEffect, useState } from "react";
import StatsHeader from "@/components/stats/stats-header";
import SummaryCards from "@/components/stats/summary-cards";
import CreationTrendsChart from "@/components/stats/creation-trends-chart";
import StatusDistributionChart from "@/components/stats/status-distribution-chart";
import DomainRankingList from "@/components/stats/domain-ranking-list";
import IpRankingList from "@/components/stats/ip-ranking-list";
import PerformanceMetrics from "@/components/stats/performance-metrics";
import {
  fetchStatsData,
  fetchCreationTrendsData,
  fetchDomainRanking,
  fetchIpRankingTop5,
  type TotalStats,
  type ChartData,
  type DomainData,
  type IpData,
} from "@/app/api/stats/route";

interface StatsData {
  chartData: ChartData;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  domainData: DomainData[];
  ipDistribution: IpData[];
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
    domainData: [],
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
      const [realStats, trendsData, domainData, ipData] = await Promise.all([
        fetchStatsData(),
        fetchCreationTrendsData(),
        fetchDomainRanking(),
        fetchIpRankingTop5(),
      ]);

      setStatsData({
        chartData: trendsData,
        statusDistribution: [
          {
            name: "アクティブ",
            value: realStats.activeAccounts,
            color: "#10B981",
          },
          {
            name: "非アクティブ",
            value: realStats.totalAccounts - realStats.activeAccounts,
            color: "#F59E0B",
          },
          { name: "停止中", value: 0, color: "#EF4444" },
        ],
        domainData: domainData,
        ipDistribution: ipData,
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

      <DomainRankingList domainData={statsData.domainData} />
      <IpRankingList ipDistribution={statsData.ipDistribution} />
      <PerformanceMetrics totalStats={statsData.totalStats} />
    </div>
  );
}
