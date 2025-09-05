"use client";

import { useState, useCallback } from "react";
import ShadowbanLogHeader from "@/components/shadowban/shadowban-log-header";
import ShadowbanLogFilters from "@/components/shadowban/shadowban-log-filters";
import ShadowbanLogDateFilters from "@/components/shadowban/shadowban-log-date-filters";
import ShadowbanLogTable from "@/components/shadowban/shadowban-log-table";
import Pagination from "@/components/ui/pagination";
import { useShadowbanLogs } from "@/hooks/use-shadowban-logs";

export default function ShadowbanLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // フィルター状態
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // カスタムフックでデータ管理
  const { logs, loading, error, totalPages, totalLogs, refetch } =
    useShadowbanLogs({
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

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
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

  return (
    <div className="space-y-6">
      <ShadowbanLogHeader onRefresh={refetch} loading={loading} />

      <ShadowbanLogDateFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClearDates={handleDateClear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ShadowbanLogFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearch}
          onStatusFilterChange={handleStatusFilter}
        />
      </div>

      <ShadowbanLogTable
        logs={logs}
        loading={loading}
        error={error}
        onRetry={refetch}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        currentPage={currentPage}
        totalLogs={totalLogs}
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
