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
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("");

  useEffect(() => {
    loadShadowbanAccounts();
  }, [
    currentPage,
    searchTerm,
    startDate,
    endDate,
    sortField,
    sortDirection,
    itemsPerPage,
  ]);

  const loadShadowbanAccounts = async () => {
    try {
      setLoading(true);
      const result = await fetchShadowbanAccounts(
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
      console.error("Error fetching Shadowban accounts:", error);
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

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // ページを1に戻す
  };

  const totalCountStr = totalCount.toLocaleString();

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
        title={`シャドBANアカウント`}
        description={`検索制限や検索サジェスト制限があるTwitterアカウント ${totalCountStr}件`}
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
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
