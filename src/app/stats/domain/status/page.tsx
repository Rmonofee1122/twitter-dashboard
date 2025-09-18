"use client";

import React, { memo } from "react";
import DomainPageHeader from "@/components/stats/domain/domain-page-header";
import DomainStatusTable from "@/components/stats/domain/domain-status-table";

const DomainStatsPage = memo(function DomainStatsPage() {
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
});

export default DomainStatsPage;
