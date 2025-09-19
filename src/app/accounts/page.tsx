"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Download, Shield } from "lucide-react";
import { TwitterAccountInfo } from "@/types/database";
import AccountTable from "@/components/accounts/account-table";
import AccountFilters from "@/components/accounts/account-filters";
import DateFilter from "@/components/accounts/date-filter";
import AccountStatusSummary from "@/components/accounts/account-status-summary";
import Pagination from "@/components/ui/pagination";

interface AccountsResponse {
  accounts: TwitterAccountInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: {
    active: number;
    shadowban: number;
    stopped: number;
    examination: number;
    suspended: number;
    temp_locked: number;
    notShadowban: number;
  };
}

const DEBOUNCE_DELAY = 500;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccountInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "shadowban" | "stopped" | "examination" | "suspended"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    shadowban: 0,
    stopped: 0,
    examination: 0,
    suspended: 0,
    temp_locked: 0,
    notShadowban: 0,
  });
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("");
  const [isBulkShadowbanCheck, setIsBulkShadowbanCheck] = useState(false);
  const [bulkShadowbanProgress, setBulkShadowbanProgress] = useState({
    current: 0,
    total: 0,
  });

  useEffect(() => {
    fetchAccounts();
    // 初回ロード時とフィルターなしの場合に統計を取得
    if (currentPage === 1 && !debouncedSearchTerm && !startDate && !endDate) {
      fetchAccountStats();
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
    itemsPerPage,
  ]);

  const fetchAccountStats = useCallback(async () => {
    try {
      console.log("📊 専用APIでアカウント統計を取得中...");
      const statsResponse = await fetch("/api/account-stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("✅ アカウント統計取得成功:", statsData);
        setStatusCounts(statsData);
      } else {
        console.error("❌ アカウント統計取得失敗:", statsResponse.status);
      }
    } catch (error) {
      console.error("💥 アカウント統計取得エラー:", error);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchTerm,
        status: statusFilter,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(sortField && { sortField }),
        ...(sortDirection && { sortDirection }),
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
  }, [
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
    itemsPerPage,
  ]);

  const handleExport = useCallback(() => {
    // TODO: CSVエクスポート機能の実装
    console.log("Exporting accounts...");
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback(
    (
      status:
        | "all"
        | "active"
        | "shadowban"
        | "stopped"
        | "examination"
        | "suspended"
    ) => {
      setStatusFilter(status);
      setCurrentPage(1);
    },
    []
  );

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    setCurrentPage(1);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    setCurrentPage(1);
  }, []);

  const handleQuickSelect = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  }, []);

  const handleDateClear = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // ページを1に戻す
  }, []);

  const handleSort = useCallback(
    (field: string) => {
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
    },
    [sortField, sortDirection]
  );

  const handleBulkShadowbanCheck = useCallback(async () => {
    if (isBulkShadowbanCheck) return;

    // フィルター条件に合致するアカウントを全て取得（ページネーションなし）
    setIsBulkShadowbanCheck(true);
    try {
      const params = new URLSearchParams({
        limit: "10000", // 大きな値で全件取得
        search: debouncedSearchTerm,
        status: statusFilter,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/accounts?${params}`);
      if (!response.ok) {
        throw new Error("フィルター対象アカウント取得に失敗しました");
      }

      const data: AccountsResponse = await response.json();
      const allAccounts = data.accounts;
      const validAccounts = allAccounts.filter(
        (account) => account.twitter_id && account.twitter_id.trim()
      );

      setBulkShadowbanProgress({ current: 0, total: validAccounts.length });

      // バッチ処理の最適化
      const batchSize = 5;
      for (let i = 0; i < validAccounts.length; i += batchSize) {
        const batch = validAccounts.slice(
          i,
          Math.min(i + batchSize, validAccounts.length)
        );
        const batchPromises = batch.map(async (account, idx) => {
          const screenName = account.twitter_id
            ? account.twitter_id.replace(/^@/, "")
            : "";

          try {
            const shadowbanResponse = await fetch(
              `/api/shadowban?screen_name=${encodeURIComponent(screenName)}`
            );

            if (shadowbanResponse.ok) {
              console.log(`シャドバン判定完了: ${screenName}`);
            } else {
              console.error(`シャドバン判定失敗: ${screenName}`);
            }
          } catch (error) {
            console.error(`シャドバン判定エラー: ${screenName}`, error);
          }
        });

        await Promise.all(batchPromises);

        setBulkShadowbanProgress({
          current: Math.min(i + batchSize, validAccounts.length),
          total: validAccounts.length,
        });

        // API制限対策で少し待機（最後のバッチは除く）
        if (i + batchSize < validAccounts.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      alert(
        `フィルター対象の${validAccounts.length}件のアカウントのシャドバン判定が完了しました`
      );
    } catch (error) {
      console.error("一斉シャドバン判定エラー:", error);
      alert("一斉シャドバン判定に失敗しました");
    } finally {
      setIsBulkShadowbanCheck(false);
      setBulkShadowbanProgress({ current: 0, total: 0 });
      // データを再取得して最新状態を反映
      fetchAccounts();
    }
  }, [
    isBulkShadowbanCheck,
    debouncedSearchTerm,
    statusFilter,
    startDate,
    endDate,
    fetchAccounts,
  ]);

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
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={handleBulkShadowbanCheck}
              disabled={isBulkShadowbanCheck}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isBulkShadowbanCheck ? "実行中..." : "一斉シャドバン判定"}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </button>
          </div>
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

      {/* 一斉シャドバン判定の進行状況 */}
      {isBulkShadowbanCheck && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-600 animate-pulse mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                一斉シャドバン判定実行中... ({bulkShadowbanProgress.current}/
                {bulkShadowbanProgress.total})
              </p>
              <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      bulkShadowbanProgress.total > 0
                        ? Math.round(
                            (bulkShadowbanProgress.current /
                              bulkShadowbanProgress.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アカウントテーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <AccountTable
            accounts={accounts}
            onAccountUpdate={fetchAccounts}
            sortField={sortField}
            sortDirection={sortDirection}
            onItemsPerPageChange={handleItemsPerPageChange}
            onSort={handleSort}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalAccounts={totalAccounts}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
