"use client";

import { useState, useEffect } from "react";
import { TwitterAccountInfo } from "@/types/database";
import { fetchShadowbanAccounts } from "@/app/api/stats/route";
import AccountPageHeader from "@/components/accounts/account-page-header";
import AccountDataTable from "@/components/accounts/account-data-table";

export default function ActiveAccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    loadShadowbanAccounts();
  }, [currentPage, startDate, endDate, searchTerm]);

  const loadShadowbanAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchShadowbanAccounts(
        currentPage,
        itemsPerPage,
        startDate,
        endDate,
        searchTerm
      );
      setAccounts(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching Shadowban accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCountStr = totalCount.toLocaleString();

  const handleDateFilterClear = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title={`シャドBANアカウント`}
        description={`検索制限や検索サジェスト制限があるTwitterアカウント一覧 ${totalCountStr}件`}
        onRefresh={loadShadowbanAccounts}
        refreshButtonColor="bg-orange-100 text-orange-700 hover:bg-orange-200"
      />
      <AccountDataTable
        accounts={accounts}
        loading={loading}
        onRefresh={loadShadowbanAccounts}
        title="シャドBANアカウント"
        emptyMessage="シャドBANアカウントがありません"
        refreshButtonColor="bg-orange-100 text-orange-700 hover:bg-orange-200"
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDateFilterClear={handleDateFilterClear}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
      />
    </div>
  );
}
