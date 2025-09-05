"use client";

import { useState, useEffect } from "react";
import { TwitterAccountInfo } from "@/types/database";
import { fetchActiveAccounts } from "@/app/api/stats/route";
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
    loadActiveAccounts();
  }, [currentPage, startDate, endDate, searchTerm]);

  const loadActiveAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchActiveAccounts(
        currentPage,
        itemsPerPage,
        startDate,
        endDate,
        searchTerm
      );
      setAccounts(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching active accounts:", error);
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
        title={`アクティブアカウント`}
        description={`ログイン済みのアクティブなTwitterアカウント一覧 ${totalCountStr}件`}
        onRefresh={loadActiveAccounts}
        refreshButtonColor="bg-green-100 text-green-700 hover:bg-green-200"
      />
      <AccountDataTable
        accounts={accounts}
        loading={loading}
        onRefresh={loadActiveAccounts}
        title="アクティブアカウント"
        emptyMessage="アクティブアカウントがありません"
        refreshButtonColor="bg-green-100 text-green-700 hover:bg-green-200"
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
