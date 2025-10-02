import { useState, useEffect, useCallback } from "react";
import { TweetLogEntry } from "@/components/tweet-log/tweet-log-table";

interface TweetLogResponse {
  logs: TweetLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseTweetLogsProps {
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
}

export function useTweetLogs({
  currentPage,
  itemsPerPage,
  searchTerm,
  statusFilter,
  startDate,
  endDate,
}: UseTweetLogsProps) {
  const [logs, setLogs] = useState<TweetLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchTweetLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/other-tweet-log?${params}`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "max-age=60",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ログデータの取得に失敗しました`
        );
      }

      const data: TweetLogResponse = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (error) {
      console.error("他社ツイート履歴の取得に失敗:", error);
      setError(
        error instanceof Error ? error.message : "データの取得に失敗しました"
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTweetLogs();
  }, [fetchTweetLogs]);

  return {
    logs,
    loading,
    error,
    totalPages,
    totalLogs,
    refetch: fetchTweetLogs,
  };
}
