"use client";

import { useState, useEffect } from "react";
import { TwitterAccountInfo } from "@/types/database";
import { fetchBannedAccounts } from "@/app/api/stats/route";
import AccountPageHeader from "@/components/accounts/account-page-header";
import AccountDataTable from "@/components/accounts/account-data-table";

export default function BannedAccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("");

  useEffect(() => {
    loadBannedAccounts();
  }, [currentPage, searchTerm, startDate, endDate, sortField, sortDirection]);

  const loadBannedAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchBannedAccounts(
        currentPage,
        itemsPerPage,
        startDate,
        endDate,
        searchTerm,
        sortField,
        sortDirection
      );
      setAccounts(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error fetching banned accounts:", error);
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合：null → asc → desc → null のサイクル
      if (sortDirection === "") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField("");
        setSortDirection("");
      }
    } else {
      // 異なるフィールドをクリックした場合：昇順でソート開始
      setSortField(field);
      setSortDirection("asc");
    }
    // ソートが変わったら1ページ目に戻る
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="凍結アカウント"
        description="凍結されたアカウント一覧"
        onRefresh={loadBannedAccounts}
        refreshButtonColor="bg-red-100 text-red-700 hover:bg-red-200"
      />
      <AccountDataTable
        accounts={accounts}
        loading={loading}
        onRefresh={loadBannedAccounts}
        title="凍結アカウント"
        emptyMessage="凍結アカウントがありません"
        refreshButtonColor="bg-red-100 text-red-700 hover:bg-red-200"
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
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
