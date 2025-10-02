"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";
import { OtherTwitterAccount } from "@/types/database";
import OtherAccountTable from "@/components/other-accounts/other-account-table";
import Pagination from "@/components/ui/pagination";

interface AccountsResponse {
  accounts: OtherTwitterAccount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default function OtherAccountsPage() {
  const [accounts, setAccounts] = useState<OtherTwitterAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("");

  useEffect(() => {
    fetchAccounts();
  }, [
    currentPage,
    debouncedSearchTerm,
    sortField,
    sortDirection,
    itemsPerPage,
  ]);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchTerm,
        ...(sortField && { sortField }),
        ...(sortDirection && { sortDirection }),
      });

      const response = await fetch(`/api/other-accounts?${params}`);
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const data: AccountsResponse = await response.json();
      setAccounts(data.accounts);
      setTotalAccounts(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("他社アカウントデータの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
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

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              他社アカウント管理
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              合計 {totalAccounts.toLocaleString()} アカウント
            </p>
          </div>
          <div className="mt-4 md:mt-0">
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

      {/* 検索フィルター */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="アカウント名、スクリーン名、Twitter IDで検索..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* アカウントテーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <OtherAccountTable
            accounts={accounts}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
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
