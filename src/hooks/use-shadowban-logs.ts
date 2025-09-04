import { useState, useEffect, useCallback } from "react";
import { ShadowbanLogEntry } from "@/components/shadowban/shadowban-log-table";

interface ShadowbanLogResponse {
  logs: ShadowbanLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseShadowbanLogsProps {
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
}

export function useShadowbanLogs({
  currentPage,
  itemsPerPage,
  searchTerm,
  statusFilter,
  startDate,
  endDate,
}: UseShadowbanLogsProps) {
  const [logs, setLogs] = useState<ShadowbanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchShadowbanLogs = useCallback(async () => {
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

      const response = await fetch(`/api/shadowban-logs-list?${params}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=60',
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ログデータの取得に失敗しました`);
      }

      const data: ShadowbanLogResponse = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (error) {
      console.error("シャドBAN履歴の取得に失敗:", error);
      setError(error instanceof Error ? error.message : "データの取得に失敗しました");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchShadowbanLogs();
  }, [fetchShadowbanLogs]);

  return {
    logs,
    loading,
    error,
    totalPages,
    totalLogs,
    refetch: fetchShadowbanLogs,
  };
}