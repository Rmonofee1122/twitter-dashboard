"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDomainRanking, type DomainData } from "@/app/api/stats/route";
import DomainCreationTrendsChart from "@/components/stats/domain-creation-trends-chart";
import DomainPageHeader from "@/components/stats/domain/domain-page-header";
import DomainSummaryCards from "@/components/stats/domain/domain-summary-cards";
import DomainFiltersSection from "@/components/stats/domain/domain-filters-section";
import DomainRankingChart from "@/components/stats/domain/domain-ranking-chart";
import DomainStatusTable from "@/components/stats/domain/domain-status-table";

interface DomainStatsData {
  domainRanking: DomainData[];
  trendData: Array<{ date: string; [domain: string]: any }>;
  allDomains: string[];
  summary: {
    totalAccounts: number;
    uniqueDomains: number;
    topDomain: DomainData | null;
    dateRange: { startDate: string; endDate: string };
    selectedDomains: string[];
  };
}

export default function DomainStatsPage() {
  const [domainStatsData, setDomainStatsData] =
    useState<DomainStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const fetchDomainStats = useCallback(
    async (start?: string, end?: string, domains?: string[]) => {
      try {
        setLoading(true);

        let apiStartDate = start || startDate;
        let apiEndDate = end || endDate;
        let apiDomains = domains || selectedDomains;

        // 日付が指定されていない場合はデフォルトで過去30日間
        if (!apiStartDate || !apiEndDate) {
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);

          apiEndDate = today.toISOString().split("T")[0];
          apiStartDate = thirtyDaysAgo.toISOString().split("T")[0];
        }

        const domainParams =
          apiDomains.length > 0 ? `&domains=${apiDomains.join(",")}` : "";
        const response = await fetch(
          `/api/domain-stats?startDate=${apiStartDate}&endDate=${apiEndDate}${domainParams}`
        );
        const data = await response.json();
        setDomainStatsData(data);
      } catch (error) {
        console.error("Failed to fetch domain data:", error);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, selectedDomains]
  );

  useEffect(() => {
    fetchDomainStats();
  }, [fetchDomainStats]);

  const handleStartDateChange = useCallback(
    (date: string) => {
      setStartDate(date);
      fetchDomainStats(date, endDate, selectedDomains);
    },
    [endDate, selectedDomains, fetchDomainStats]
  );

  const handleEndDateChange = useCallback(
    (date: string) => {
      setEndDate(date);
      fetchDomainStats(startDate, date, selectedDomains);
    },
    [startDate, selectedDomains, fetchDomainStats]
  );

  const handleQuickSelect = useCallback(
    (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      fetchDomainStats(start, end, selectedDomains);
    },
    [selectedDomains, fetchDomainStats]
  );

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchDomainStats("", "", selectedDomains);
  }, [selectedDomains, fetchDomainStats]);

  const handleDomainChange = useCallback(
    (domains: string[]) => {
      setSelectedDomains(domains);
      fetchDomainStats(startDate, endDate, domains);
    },
    [startDate, endDate, fetchDomainStats]
  );

  const handleClearDomainFilter = useCallback(() => {
    setSelectedDomains([]);
    fetchDomainStats(startDate, endDate, []);
  }, [startDate, endDate, fetchDomainStats]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DomainPageHeader />

      <DomainFiltersSection
        startDate={startDate}
        endDate={endDate}
        selectedDomains={selectedDomains}
        availableDomains={domainStatsData?.allDomains || []}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClearDateFilter={handleClearFilter}
        onDomainChange={handleDomainChange}
        onClearDomainFilter={handleClearDomainFilter}
      />

      {domainStatsData?.summary && (
        <DomainSummaryCards summary={domainStatsData.summary} />
      )}

      {domainStatsData?.trendData && (
        <DomainCreationTrendsChart trendData={domainStatsData.trendData} />
      )}

      <DomainRankingChart 
        domainRanking={domainStatsData?.domainRanking || []} 
      />

      <DomainStatusTable />
    </div>
  );
}
