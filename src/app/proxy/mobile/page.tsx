"use client";

import { useEffect, useState } from "react";
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

export default function ProxyPage() {
  const [proxies, setProxies] = useState<ProxyInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProxies, setTotalProxies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("used_count");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchProxies();
  }, [currentPage, itemsPerPage, sortField, sortDirection]);

  const fetchProxies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortField,
        sortDirection,
      });

      const response = await fetch(`/api/mobile-proxy?${params}`);
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
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <ProxyPageHeader
        totalProxies={totalProxies}
        loading={loading}
        onRefresh={fetchProxies}
        title="モバイル"
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
        apiEndpoint="/api/mobile-proxy"
      />
    </div>
  );
}