"use client";

import { useEffect, useState } from "react";
import { fetchIpRanking, type IpData } from "@/lib/stats-api";
import IpStatsHeader from "@/components/stats/ip-stats-header";
import IpRankingChart from "@/components/stats/ip-ranking-chart";
import IpStatsSummary from "@/components/stats/ip-stats-summary";

export default function IpStatsPage() {
  const [ipData, setIpData] = useState<IpData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIpData();
  }, []);

  const loadIpData = async () => {
    try {
      setLoading(true);
      const data = await fetchIpRanking();
      setIpData(data);
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
      />
      <IpStatsSummary ipData={ipData} />
    </div>
  );
}
