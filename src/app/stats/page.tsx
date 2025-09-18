"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import StatsHeader from "@/components/stats/stats-header";
import SummaryCards from "@/components/stats/summary-cards";
import DateFilter from "@/components/stats/date-filter";
import FilteredCreationTrendsChart from "@/components/stats/filtered-creation-trends-chart";
import FilteredStatusDistributionChart from "@/components/stats/filtered-status-distribution-chart";
import FilteredDomainRankingList from "@/components/stats/filtered-domain-ranking-list";
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

const StatsPage = () => {
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

  // 初期日付の計算をメモ化
  const initialDateFilter = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  }, []);

  // 日付フィルターの状態
  const [dateFilter, setDateFilter] = useState(initialDateFilter);

  const [isFilteredDataLoading, setIsFilteredDataLoading] = useState(false);

  // フィルタリングされた期間の統計データを計算
  const filteredTotalStats = useMemo(() => {
    const dailyData = filteredChartData.dailyCreations;
    if (!dailyData || dailyData.length === 0) {
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        suspendedAccounts: 0,
        tempLockedAccounts: 0,
        shadowbanAccounts: 0,
        notShadowbanAccounts: 0,
        todayCreated: 0,
        weekCreated: 0,
        monthCreated: 0,
      };
    }

    return {
      // フィルタリンゲされない総アカウント数
      totalAccounts: dailyData.reduce(
        (acc, day) =>
          acc +
          day.active_count +
          day.suspended_count +
          day.temp_locked_count +
          day.shadowban_count +
          day.other_count,
        0
      ),
      activeAccounts: dailyData.reduce((acc, day) => acc + day.active_count, 0),
      suspendedAccounts: dailyData.reduce(
        (acc, day) => acc + day.suspended_count,
        0
      ),
      tempLockedAccounts: dailyData.reduce(
        (acc, day) => acc + day.temp_locked_count,
        0
      ),
      shadowbanAccounts: dailyData.reduce(
        (acc, day) => acc + day.shadowban_count,
        0
      ),
      notShadowbanAccounts: 0,
      todayCreated: 0, // フィルタリングされた期間では意味がないため0とする
      weekCreated: 0, // フィルタリングされた期間では意味がないため0とする
      monthCreated: 0, // フィルタリングされた期間では意味がないため0とする
    };
  }, [filteredChartData.dailyCreations]);

  // 基本統計データの読み込み
  const loadStatsData = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Failed to load stats data:", error);
    }
  }, []);

  useEffect(() => {
    loadStatsData();
  }, [loadStatsData]);

  // フィルター付きデータの読み込み
  const loadFilteredData = useCallback(async () => {
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
  }, [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  const handlePeriodChange = useCallback(
    (period: "daily" | "weekly" | "monthly") => {
      setSelectedPeriod(period);
    },
    []
  );

  const handleDateChange = useCallback((startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate });
  }, []);

  const handleDateReset = useCallback(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateFilter({
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  }, []);

  return (
    <div className="space-y-6">
      <StatsHeader />
      {/* 統計カード */}
      <SummaryCards totalStats={filteredTotalStats} />

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
    </div>
  );
};

export default StatsPage;
