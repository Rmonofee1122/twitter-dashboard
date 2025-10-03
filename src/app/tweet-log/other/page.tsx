"use client";

import { useState, useCallback } from "react";
import TweetLogHeader from "@/components/tweet-log/tweet-log-header";
import TweetLogFilters from "@/components/tweet-log/tweet-log-filters";
import TweetLogDateFilters from "@/components/tweet-log/tweet-log-date-filters";
import TweetLogTable from "@/components/tweet-log/tweet-log-table";
import TweetFetcher from "@/components/tweet-log/other-tweet-fetcher";
import Pagination from "@/components/ui/pagination";
import { useTweetLogs } from "@/hooks/use-other-tweet-logs";

export default function ShadowbanLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // フィルター状態
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // カスタムフックでデータ管理
  const { logs, loading, error, totalPages, totalLogs, refetch } = useTweetLogs(
    {
      currentPage,
      itemsPerPage,
      searchTerm,
      statusFilter,
      startDate,
      endDate,
    }
  );

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
      <TweetLogHeader title="他社" onRefresh={refetch} loading={loading} />

      <TweetFetcher onFetchComplete={refetch} />

      <TweetLogDateFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClearDates={handleDateClear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <TweetLogFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
        />
      </div>

      <TweetLogTable
        logs={logs}
        loading={loading}
        error={error}
        onRetry={refetch}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        currentPage={currentPage}
        totalLogs={totalLogs}
        totalPages={totalPages}
        onPageChange={handlePageChange}
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
