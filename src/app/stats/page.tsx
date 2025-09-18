"use client";

import { useEffect, useState } from "react";
import StatsHeader from "@/components/stats/stats-header";
import SummaryCards from "@/components/stats/summary-cards";
import CreationTrendsChart from "@/components/stats/creation-trends-chart";
import StatusDistributionChart from "@/components/stats/status-distribution-chart";
import DateFilter from "@/components/stats/date-filter";
import FilteredCreationTrendsChart from "@/components/stats/filtered-creation-trends-chart";
import FilteredStatusDistributionChart from "@/components/stats/filtered-status-distribution-chart";
import FilteredDomainRankingList from "@/components/stats/filtered-domain-ranking-list";

import DomainRankingList from "@/components/stats/domain-ranking-list";
import IpRankingList from "@/components/stats/ip-ranking-list";
import PerformanceMetrics from "@/components/stats/performance-metrics";
import {
  fetchStatsData,
  fetchCreationTrendsData,
  fetchCreationTrendsDataFiltered,
  fetchDomainRanking,
  fetchFilteredDomainRanking,
  fetchIpRanking,
  type TotalStats,
  type ChartData,
  type DomainData,
  type FilteredDomainData,
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
      suspendedAccounts: 0,
      tempLockedAccounts: 0,
      shadowbanAccounts: 0,
      notShadowbanAccounts: 0,
      todayCreated: 0,
      weekCreated: 0,
      monthCreated: 0,
    },
  });

  // フィルター付きデータの状態
  const [filteredChartData, setFilteredChartData] = useState<ChartData>({
    dailyCreations: [],
    weeklyCreations: [],
    monthlyCreations: [],
  });

  const [filteredStatusDistribution, setFilteredStatusDistribution] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);

  const [filteredDomainData, setFilteredDomainData] = useState<
    FilteredDomainData[]
  >([]);

  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  // 日付フィルターの状態
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  });

  const [isFilteredDataLoading, setIsFilteredDataLoading] = useState(false);

  // フィルタリングされた期間の統計データを計算
  const filteredTotalStats = {
    // フィルタリンゲされない総アカウント数
    totalAccounts: filteredChartData.dailyCreations.reduce(
      (acc, day) =>
        acc +
        day.active_count +
        day.suspended_count +
        day.temp_locked_count +
        day.shadowban_count +
        day.other_count,
      0
    ),
    activeAccounts: filteredChartData.dailyCreations.reduce(
      (acc, day) => acc + day.active_count,
      0
    ),
    suspendedAccounts: filteredChartData.dailyCreations.reduce(
      (acc, day) => acc + day.suspended_count,
      0
    ),
    tempLockedAccounts: filteredChartData.dailyCreations.reduce(
      (acc, day) => acc + day.temp_locked_count,
      0
    ),
    shadowbanAccounts: filteredChartData.dailyCreations.reduce(
      (acc, day) => acc + day.shadowban_count,
      0
    ),
    notShadowbanAccounts: 0,
    todayCreated: 0, // フィルタリングされた期間では意味がないため0とする
    weekCreated: 0, // フィルタリングされた期間では意味がないため0とする
    monthCreated: 0, // フィルタリングされた期間では意味がないため0とする
  };

  // 基本統計データの読み込み
  useEffect(() => {
    async function loadStatsData() {
      const [realStats, trendsData, domainData, ipData] = await Promise.all([
        fetchStatsData(),
        fetchCreationTrendsData(),
        fetchDomainRanking(),
        fetchIpRanking(),
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
            name: "シャドBAN",
            value: realStats.shadowbanAccounts,
            color: "#EF4444",
          },
          {
            name: "凍結",
            value: realStats.suspendedAccounts,
            color: "#EF4444",
          },
          {
            name: "一時制限",
            value: realStats.tempLockedAccounts,
            color: "#F59E0B",
          },
          {
            name: "その他",
            value:
              realStats.totalAccounts -
              realStats.activeAccounts -
              realStats.shadowbanAccounts -
              realStats.suspendedAccounts -
              realStats.tempLockedAccounts,
            color: "#6B7280",
          },
        ],
        domainData: domainData,
        ipDistribution: ipData.data,
        totalStats: realStats,
      });
    }

    loadStatsData();
  }, []);

  // フィルター付きデータの読み込み
  useEffect(() => {
    async function loadFilteredData() {
      setIsFilteredDataLoading(true);
      try {
        const [filteredData, filteredDomainData] = await Promise.all([
          fetchCreationTrendsDataFiltered(
            dateFilter.startDate,
            dateFilter.endDate
          ),
          fetchFilteredDomainRanking(dateFilter.startDate, dateFilter.endDate),
        ]);

        setFilteredChartData(filteredData);
        setFilteredDomainData(filteredDomainData);

        // 期間内のステータス分布を計算
        const periodTotals = filteredData.dailyCreations.reduce(
          (acc, day) => ({
            active: acc.active + day.active_count,
            suspended: acc.suspended + day.suspended_count,
            tempLocked: acc.tempLocked + day.temp_locked_count,
            shadowban: acc.shadowban + day.shadowban_count,
            other: acc.other + day.other_count,
          }),
          { active: 0, suspended: 0, tempLocked: 0, shadowban: 0, other: 0 }
        );

        setFilteredStatusDistribution([
          {
            name: "アクティブ",
            value: periodTotals.active,
            color: "#10B981",
          },
          {
            name: "凍結",
            value: periodTotals.suspended,
            color: "#EF4444",
          },
          {
            name: "一時制限",
            value: periodTotals.tempLocked,
            color: "#F59E0B",
          },
          {
            name: "シャドBAN",
            value: periodTotals.shadowban,
            color: "#F97316",
          },
          {
            name: "その他",
            value: periodTotals.other,
            color: "#6B7280",
          },
        ]);
      } catch (error) {
        console.error("Failed to load filtered data:", error);
      } finally {
        setIsFilteredDataLoading(false);
      }
    }

    loadFilteredData();
  }, [dateFilter]);

  const handlePeriodChange = (period: "daily" | "weekly" | "monthly") => {
    setSelectedPeriod(period);
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate });
  };

  const handleDateReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateFilter({
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-6">
      <StatsHeader />
      {/* 統計カード */}
      <SummaryCards totalStats={filteredTotalStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* アカウント作成推移 */}
        {/* <CreationTrendsChart
          chartData={statsData.chartData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        /> */}
        {/* アカウント状態分布 */}
        {/* <StatusDistributionChart
          statusDistribution={statsData.statusDistribution}
        /> */}
      </div>

      {/* 日付フィルター付きの分析セクション */}
      <div>
        {/* 日付フィルター */}
        <DateFilter
          startDate={dateFilter.startDate}
          endDate={dateFilter.endDate}
          onDateChange={handleDateChange}
          onReset={handleDateReset}
          isLoading={isFilteredDataLoading}
        />
      </div>

      {/* フィルター付きグラフ */}
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 期間別アカウント作成推移 */}
          <FilteredCreationTrendsChart
            chartData={filteredChartData}
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            isLoading={isFilteredDataLoading}
          />
          {/* 期間別アカウント状態分布 */}
          <FilteredStatusDistributionChart
            statusDistribution={filteredStatusDistribution}
            isLoading={isFilteredDataLoading}
          />
        </div>

        {/* 期間別ドメインランキング */}
        <FilteredDomainRankingList
          domainData={filteredDomainData}
          isLoading={isFilteredDataLoading}
        />
      </div>

      {/* 従来のランキング（参考用） */}
      {/* <div className="bg-gray-50 p-6 rounded-lg border border-gray-200"> */}
      {/* <h2 className="text-xl font-bold text-gray-900 mb-4">
          📈 全期間統計（参考）
        </h2> */}
      {/* <p className="text-gray-700 mb-6">
          全期間でのドメイン別・IP別作成数ランキングです
        </p> */}

      {/* ドメイン別作成数ランキング */}
      {/* <DomainRankingList domainData={statsData.domainData} /> */}
      {/* IP別作成数ランキング */}
      {/* <IpRankingList ipDistribution={statsData.ipDistribution} /> */}
      {/* </div> */}
    </div>
  );
}
