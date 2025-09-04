"use client";

import { useState, useCallback } from "react";
import ShadowbanLogHeader from "@/components/shadowban/shadowban-log-header";
import ShadowbanLogFilters from "@/components/shadowban/shadowban-log-filters";
import ShadowbanLogTable from "@/components/shadowban/shadowban-log-table";
import Pagination from "@/components/ui/pagination";
import { useShadowbanLogs } from "@/hooks/use-shadowban-logs";

export default function ShadowbanLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // フィルター状態
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // カスタムフックでデータ管理
  const {
    logs,
    loading,
    error,
    totalPages,
    totalLogs,
    refetch
  } = useShadowbanLogs({
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    startDate,
    endDate,
  });

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    setCurrentPage(1);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <ShadowbanLogHeader 
        onRefresh={refetch}
        loading={loading}
      />

      <ShadowbanLogFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={handleSearch}
        onStatusFilterChange={handleStatusFilter}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <ShadowbanLogTable
        logs={logs}
        loading={loading}
        error={error}
        onRetry={refetch}
      />

      {!loading && !error && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalLogs}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}