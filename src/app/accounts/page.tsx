"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { TwitterCreateLog } from "@/types/database";
import AccountTable from "@/components/accounts/account-table";
import AccountFilters from "@/components/accounts/account-filters";
import DateFilter from "@/components/accounts/date-filter";
import AccountStatusSummary from "@/components/accounts/account-status-summary";
import Pagination from "@/components/ui/pagination";

interface AccountsResponse {
  accounts: TwitterCreateLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: {
    pending: number;
    active: number;
    suspended: number;
    excluded: number;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TwitterCreateLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "active" | "suspended" | "excluded"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    active: 0,
    suspended: 0,
    excluded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAccounts();
  }, [currentPage, searchTerm, statusFilter, startDate, endDate]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/accounts?${params}`);
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const data: AccountsResponse = await response.json();
      setAccounts(data.accounts);
      setTotalAccounts(data.total);
      setTotalPages(data.totalPages);
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (error) {
      console.error("アカウントデータの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: CSVエクスポート機能の実装
    console.log("Exporting accounts...");
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilter = (
    status: "all" | "pending" | "active" | "suspended" | "excluded"
  ) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setCurrentPage(1);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    setCurrentPage(1);
  };

  const handleQuickSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const handleDateClear = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
          <div className="flex-1">
            <AccountStatusSummary
              totalAccounts={totalAccounts}
              statusCounts={statusCounts}
            />
          </div>
          <button
            onClick={handleExport}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            CSVエクスポート
          </button>
        </div>
      </div>

      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClear={handleDateClear}
      />

      <AccountFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearch}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilter}
      />

      {/* アカウントテーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <AccountTable accounts={accounts} />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalAccounts}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
