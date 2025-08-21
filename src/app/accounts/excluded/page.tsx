"use client";

import { useState, useEffect } from "react";
import { TwitterCreateLog } from "@/types/database";
import { fetchExcludedAccounts } from "@/app/api/stats/route";
import AccountPageHeader from "@/components/accounts/account-page-header";
import AccountDataTable from "@/components/accounts/account-data-table";

export default function ExcludedAccountsPage() {
  const [accounts, setAccounts] = useState<TwitterCreateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    loadExcludedAccounts();
  }, [currentPage, startDate, endDate, searchTerm]);

  const loadExcludedAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchExcludedAccounts(
        currentPage,
        itemsPerPage,
        startDate,
        endDate,
        searchTerm
      );
      setAccounts(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching excluded accounts:", error);
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
        title="除外アカウント"
        description="システムから除外されたアカウント一覧"
        onRefresh={loadExcludedAccounts}
        refreshButtonColor="bg-gray-100 text-gray-700 hover:bg-gray-200"
      />
      <AccountDataTable
        accounts={accounts}
        loading={loading}
        onRefresh={loadExcludedAccounts}
        title="除外アカウント"
        emptyMessage="除外アカウントがありません"
        refreshButtonColor="bg-gray-100 text-gray-700 hover:bg-gray-200"
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
