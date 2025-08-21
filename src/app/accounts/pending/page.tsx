"use client";

import { useState, useEffect } from "react";
import { TwitterCreateLog } from "@/types/database";
import { fetchPendingAccounts } from "@/app/api/stats/route";
import AccountPageHeader from "@/components/accounts/account-page-header";
import AccountDataTable from "@/components/accounts/account-data-table";

export default function PendingAccountsPage() {
  const [accounts, setAccounts] = useState<TwitterCreateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    loadPendingAccounts();
  }, [currentPage, startDate, endDate, searchTerm]);

  const loadPendingAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchPendingAccounts(
        currentPage,
        itemsPerPage,
        startDate,
        endDate,
        searchTerm
      );
      setAccounts(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching pending accounts:", error);
    } finally {
      setLoading(false);
    }
  };

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
        title="保留中アカウント"
        description="まだログインが完了していない保留中のアカウント一覧"
        onRefresh={loadPendingAccounts}
        refreshButtonColor="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      />
      <AccountDataTable
        accounts={accounts}
        loading={loading}
        onRefresh={loadPendingAccounts}
        title="保留中アカウント"
        emptyMessage="保留中アカウントがありません"
        refreshButtonColor="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
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
