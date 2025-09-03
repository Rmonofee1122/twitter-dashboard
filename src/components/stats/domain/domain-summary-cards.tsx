"use client";

import { memo } from "react";
import { type DomainData } from "@/app/api/stats/route";

interface DomainSummary {
  totalAccounts: number;
  uniqueDomains: number;
  topDomain: DomainData | null;
  dateRange: { startDate: string; endDate: string };
  selectedDomains: string[];
}

interface DomainSummaryCardsProps {
  summary: DomainSummary;
}

const DomainSummaryCards = memo(function DomainSummaryCards({
  summary,
}: DomainSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {summary.uniqueDomains}
        </div>
        <div className="text-gray-600">登録ドメイン数</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {summary.totalAccounts.toLocaleString()}
        </div>
        <div className="text-gray-600">総アカウント数</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {summary.topDomain?.domain || "-"}
        </div>
        <div className="text-gray-600">最多ドメイン</div>
      </div>
    </div>
  );
});

export default DomainSummaryCards;