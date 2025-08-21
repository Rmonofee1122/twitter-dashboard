"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDomainRanking, type DomainData } from "@/app/api/stats/route";
import DomainCreationTrendsChart from "@/components/stats/domain-creation-trends-chart";
import DateFilter from "@/components/accounts/date-filter";
import DomainFilter from "@/components/stats/domain/domain-filter";

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
  const [domainStatsData, setDomainStatsData] = useState<DomainStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const fetchDomainStats = useCallback(async (start?: string, end?: string, domains?: string[]) => {
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
        
        apiEndDate = today.toISOString().split('T')[0];
        apiStartDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      
      const domainParams = apiDomains.length > 0 ? `&domains=${apiDomains.join(',')}` : '';
      const response = await fetch(`/api/domain-stats?startDate=${apiStartDate}&endDate=${apiEndDate}${domainParams}`);
      const data = await response.json();
      setDomainStatsData(data);
    } catch (error) {
      console.error("Failed to fetch domain data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDomains]);

  useEffect(() => {
    fetchDomainStats();
  }, [fetchDomainStats]);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    fetchDomainStats(date, endDate, selectedDomains);
  }, [endDate, selectedDomains, fetchDomainStats]);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    fetchDomainStats(startDate, date, selectedDomains);
  }, [startDate, selectedDomains, fetchDomainStats]);

  const handleQuickSelect = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchDomainStats(start, end, selectedDomains);
  }, [selectedDomains, fetchDomainStats]);

  const handleClearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    fetchDomainStats("", "", selectedDomains);
  }, [selectedDomains, fetchDomainStats]);

  const handleDomainChange = useCallback((domains: string[]) => {
    setSelectedDomains(domains);
    fetchDomainStats(startDate, endDate, domains);
  }, [startDate, endDate, fetchDomainStats]);

  const handleClearDomainFilter = useCallback(() => {
    setSelectedDomains([]);
    fetchDomainStats(startDate, endDate, []);
  }, [startDate, endDate, fetchDomainStats]);

  const maxCount = domainStatsData?.domainRanking 
    ? Math.max(...domainStatsData.domainRanking.map((d) => d.count), 1) 
    : 1;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ドメイン別統計
        </h1>
        <p className="text-gray-600">
          メールドメインごとのアカウント作成数の詳細統計
        </p>
      </div>

      {/* フィルター */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onQuickSelect={handleQuickSelect}
          onClear={handleClearFilter}
        />
        
        {domainStatsData?.allDomains && (
          <DomainFilter
            availableDomains={domainStatsData.allDomains}
            selectedDomains={selectedDomains}
            onDomainChange={handleDomainChange}
            onClear={handleClearDomainFilter}
          />
        )}
      </div>

      {/* 統計サマリー */}
      {domainStatsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {domainStatsData.summary.uniqueDomains}
            </div>
            <div className="text-gray-600">登録ドメイン数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {domainStatsData.summary.totalAccounts.toLocaleString()}
            </div>
            <div className="text-gray-600">総アカウント数</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {domainStatsData.summary.topDomain?.domain || "-"}
            </div>
            <div className="text-gray-600">最多ドメイン</div>
          </div>
        </div>
      )}

      {/* ドメイン別アカウント作成推移 */}
      {domainStatsData?.trendData && (
        <DomainCreationTrendsChart trendData={domainStatsData.trendData} />
      )}

      {/* ドメイン別統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            ドメイン別作成数ランキング
          </h3>
        </div>

        {!domainStatsData?.domainRanking || domainStatsData.domainRanking.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            ドメインデータがありません
          </div>
        ) : (
          <div className="space-y-4">
            {domainStatsData.domainRanking.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900 mr-4 w-8">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="text-gray-700 font-mono text-base">
                      {item.domain}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      全体の{" "}
                      {(
                        (item.count /
                          domainStatsData.domainRanking.reduce((sum, d) => sum + d.count, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 w-20 text-right text-lg">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
