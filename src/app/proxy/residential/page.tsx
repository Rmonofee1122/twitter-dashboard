"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import ProxyPageHeader from "@/components/proxy/proxy-page-header";
import ProxyStatsCards from "@/components/proxy/proxy-stats-cards";
import ProxyTable from "@/components/proxy/proxy-table";
import ProxyPagination from "@/components/proxy/proxy-pagination";
import type { ProxyInfo } from "@/types/database";

interface ProxyResponse {
  proxies: ProxyInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ProxyPage = () => {
  const [proxies, setProxies] = useState<ProxyInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProxies, setTotalProxies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("used_count");
  const [sortDirection, setSortDirection] = useState("asc");

  const fetchProxies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortField,
        sortDirection,
      });

      const response = await fetch(`/api/residential-proxy?${params}`);
      if (!response.ok) {
        throw new Error("プロキシデータの取得に失敗しました");
      }

      const data: ProxyResponse = await response.json();
      setProxies(data.proxies);
      setTotalProxies(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("プロキシデータの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection]);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortField]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <ProxyPageHeader
        totalProxies={totalProxies}
        loading={loading}
        onRefresh={fetchProxies}
        title="レジデンシャル"
      />

      {/* 統計カード */}
      {/* <ProxyStatsCards
        proxies={proxies}
        totalProxies={totalProxies}
      /> */}

      {/* プロキシテーブル */}
      <ProxyTable
        proxies={proxies}
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalProxies={totalProxies}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onDataChange={fetchProxies}
        apiEndpoint="/api/residential-proxy"
      />
    </div>
  );
};

export default ProxyPage;
