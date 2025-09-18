"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type DomainData } from "@/app/api/stats/route";
import DomainPageHeader from "@/components/stats/domain/domain-page-header";
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

const DomainStatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // デフォルト日付の計算をメモ化
  const defaultDates = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      endDate: today.toISOString().split("T")[0],
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
    };
  }, []);

  const fetchDomainStats = useCallback(
    async (start?: string, end?: string, domains?: string[]) => {
      try {
        setLoading(true);

        const apiStartDate = start || startDate || defaultDates.startDate;
        const apiEndDate = end || endDate || defaultDates.endDate;
        const apiDomains = domains || selectedDomains;

        const domainParams =
          apiDomains.length > 0 ? `&domains=${apiDomains.join(",")}` : "";
        const response = await fetch(
          `/api/domain-stats?startDate=${apiStartDate}&endDate=${apiEndDate}${domainParams}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        // データ処理ロジックをここに追加可能
      } catch (error) {
        console.error("Failed to fetch domain data:", error);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, selectedDomains, defaultDates]
  );

  useEffect(() => {
    fetchDomainStats();
  }, [fetchDomainStats]);

  // ローディング表示をメモ化
  const loadingContent = useMemo(
    () => (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    ),
    []
  );

  if (loading) {
    return loadingContent;
  }

  return (
    <div className="space-y-6">
      {/* ドメインページヘッダー */}
      <DomainPageHeader
        title="ドメイン・ステータス別作成数一覧"
        description="ステータス別のアカウント作成数の詳細統計"
      />

      {/* ドメインステータステーブル */}
      <DomainStatusTable />
    </div>
  );
};

export default DomainStatsPage;
