"use client";

import { useEffect, useState } from "react";
import { fetchIpRanking, type IpData } from "@/app/api/stats/route";
import IpStatsHeader from "@/components/stats/ip/ip-stats-header";
import IpRankingChart from "@/components/stats/ip/ip-ranking-chart";
import IpStatsSummary from "@/components/stats/ip/ip-stats-summary";

export default function IpStatsPage() {
  const [ipData, setIpData] = useState<IpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadIpData();
  }, [currentPage]);

  const loadIpData = async () => {
    try {
      setLoading(true);
      const result = await fetchIpRanking(currentPage, itemsPerPage);
      setIpData(result.data);
      setTotalCount(result.totalCount);
      
      // 全アカウント数を取得（cumulative_create_count_per_dayビューの最大累計値）
      const totalAccountsResponse = await fetch('/api/total-accounts');
      const totalAccountsData = await totalAccountsResponse.json();
      setTotalAccounts(totalAccountsData.totalAccounts || 0);
    } catch (error) {
      console.error("Failed to fetch IP data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpStatsHeader onRefresh={loadIpData} />
      <IpRankingChart
        ipData={ipData}
        loading={loading}
        onRefresh={loadIpData}
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        totalAccounts={totalAccounts}
      />
      <IpStatsSummary ipData={ipData} />
    </div>
  );
}
