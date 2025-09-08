"use client";

import { memo, useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock3,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import Pagination from "@/components/ui/pagination";

interface DomainStatusData {
  domain: string;
  active_count: number;
  suspended_count: number;
  temp_locked_count: number;
  total_count: number;
}

interface DomainStatusResponse {
  domains: DomainStatusData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SortableHeader = memo(function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: string;
  sortField: string;
  sortDirection: string;
  onSort?: (field: string) => void;
}) {
  const getSortIcon = () => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }

    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    } else if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    }

    return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  };

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center justify-between">
        {label}
        {getSortIcon()}
      </div>
    </th>
  );
});

const DomainStatusTable = memo(function DomainStatusTable() {
  const [data, setData] = useState<DomainStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalDomains, setTotalDomains] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("domain");
  const [sortDirection, setSortDirection] = useState<string>("asc");

  const fetchDomainStatusData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(sortField && { sortField }),
        ...(sortDirection && { sortDirection }),
      });

      const response = await fetch(`/api/domain-status?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: データの取得に失敗しました`);
      }

      const result: DomainStatusResponse = await response.json();
      setData(result.domains);
      setTotalPages(result.totalPages);
      setTotalDomains(result.total);
    } catch (error) {
      console.error("ドメイン・ステータス別データ取得エラー:", error);
      setError(
        error instanceof Error ? error.message : "データの取得に失敗しました"
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchDomainStatusData();
  }, [fetchDomainStatusData]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortField("");
          setSortDirection("");
        } else {
          setSortDirection("asc");
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortField, sortDirection]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ドメイン・ステータス別作成数一覧
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ドメイン・ステータス別作成数一覧
        </h3>
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">エラーが発生しました</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={fetchDomainStatusData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ドメイン・ステータス別作成数一覧
        </h3>
        <button
          onClick={fetchDomainStatusData}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          更新
        </button>
      </div>

      {/* 検索とページサイズ選択 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="ドメインで検索..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">表示件数:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10件</option>
            <option value={20}>20件</option>
            <option value={50}>50件</option>
            <option value={100}>100件</option>
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                label="ドメイン"
                field="domain"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="アクティブ"
                field="active_count"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="一時制限"
                field="temp_locked_count"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="凍結"
                field="suspended_count"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="合計"
                field="total_count"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分布
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.domain} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 font-mono">
                    {item.domain}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {item.active_count?.toLocaleString() || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock3 className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {item.temp_locked_count?.toLocaleString() || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {item.suspended_count?.toLocaleString() || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {item.total_count?.toLocaleString() || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{
                        width:
                          item.total_count > 0
                            ? `${(item.active_count / item.total_count) * 100}%`
                            : "0%",
                        minWidth: "2px",
                      }}
                    />
                    <div
                      className="h-2 bg-yellow-500 rounded"
                      style={{
                        width:
                          item.total_count > 0
                            ? `${
                                (item.temp_locked_count / item.total_count) *
                                100
                              }%`
                            : "0%",
                        minWidth: "2px",
                      }}
                    />
                    <div
                      className="h-2 bg-red-500 rounded"
                      style={{
                        width:
                          item.total_count > 0
                            ? `${
                                (item.suspended_count / item.total_count) * 100
                              }%`
                            : "0%",
                        minWidth: "2px",
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalDomains}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
});

export default DomainStatusTable;
