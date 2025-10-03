"use client";

import { Eye, AlertTriangle, Download, type LucideIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import TweetLogDetailModal from "./tweet-log-detail-modal";
import { TwitterAccountInfo } from "@/types/database";
import { fetchAccountDetails } from "@/app/api/stats/route";
import PaginationHeader from "@/components/ui/pagination-header";

export interface TweetLogEntry {
  id: number;
  twitter_id: string;
  name: string;
  screen_name: string;
  tweet_id: string;
  tweet_created_at: string;
  tweet_text: string;
  tweet_link?: string;
  favorite_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  view_count: number;
  is_retweet: boolean;
  is_quote: boolean;
  media_type: string;
  media_url: string;
  created_at: string;
  updated_at: string;
}

interface TweetLogTableProps {
  logs: TweetLogEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  currentPage?: number;
  totalLogs?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

interface ActionButtonProps {
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
  "aria-label"?: string;
}

const ActionButton = memo(function ActionButton({
  icon: Icon,
  color,
  onClick,
  "aria-label": ariaLabel,
}: ActionButtonProps) {
  return (
    <button
      className={`${color} p-2 rounded-lg hover:bg-gray-100 transition-colors`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

const TweetLogTable = memo(function TweetLogTable({
  logs,
  loading,
  error,
  onRetry,
  itemsPerPage = 20,
  onItemsPerPageChange,
  currentPage = 1,
  totalLogs,
  totalPages,
  onPageChange,
}: TweetLogTableProps) {
  const [selectedAccount, setSelectedAccount] =
    useState<TwitterAccountInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [tweetLogsData, setTweetLogsData] = useState<TweetLogEntry[]>([]);
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }, []);

  const handleViewAccountDetails = useCallback(async (twitterId: string) => {
    setIsLoadingAccount(true);
    try {
      // アカウント詳細を取得
      const accountDetails = await fetchAccountDetails(twitterId);
      if (accountDetails) {
        setSelectedAccount(accountDetails);

        // ツイート履歴を取得
        try {
          const response = await fetch(
            `/api/tweet-logs?twitter_id=${encodeURIComponent(
              twitterId
            )}&limit=20`
          );
          if (response.ok) {
            const result = await response.json();
            setTweetLogsData(result.logs || []);
          } else {
            setTweetLogsData([]);
          }
        } catch (error) {
          console.error("ツイート履歴取得エラー:", error);
          setTweetLogsData([]);
        }

        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("アカウント詳細取得失敗:", error);
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  }, []);

  const handleExportCSV = useCallback(() => {
    // CSVヘッダー
    const headers = [
      "No",
      "ツイート日時",
      "アカウントID",
      "名前",
      "スクリーン名",
      "ツイートID",
      "テキスト",
      "いいね数",
      "リツイート数",
      "リプライ数",
      "引用数",
      "閲覧数",
      "リツイート",
      "引用",
      "メディアタイプ",
      "メディアURL",
      "更新日時"
    ];

    // CSVデータ行
    const rows = logs.map((log) => [
      log.id,
      formatDate(log.tweet_created_at),
      log.twitter_id,
      log.name,
      log.screen_name,
      log.tweet_id,
      `"${log.tweet_text.replace(/"/g, '""')}"`, // ダブルクォートをエスケープ
      log.favorite_count,
      log.retweet_count,
      log.reply_count,
      log.quote_count,
      log.view_count,
      log.is_retweet ? "はい" : "いいえ",
      log.is_quote ? "はい" : "いいえ",
      log.media_type,
      log.media_url,
      formatDate(log.updated_at)
    ]);

    // CSV文字列生成
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    // BOM付きUTF-8でエンコード（Excel対応）
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

    // ダウンロード
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tweet_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [logs, formatDate]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">エラーが発生しました</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={onRetry}
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 表示件数セレクター */}
      {onItemsPerPageChange && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">表示件数:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
          </div>
          <PaginationHeader
            currentPage={currentPage}
            totalPages={totalPages || 0}
            totalItems={totalLogs || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange || (() => {})}
          />
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              aria-label="CSVエクスポート"
            >
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </button>
            <div className="text-sm text-gray-500">
              {totalLogs
                ? (() => {
                    const startIndex = (currentPage - 1) * itemsPerPage + 1;
                    const endIndex = Math.min(
                      currentPage * itemsPerPage,
                      totalLogs
                    );
                    return `${startIndex}-${endIndex}件目 / 全${totalLogs.toLocaleString()}件`;
                  })()
                : `全${logs.length}件`}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ツイート日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アカウントID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                テキスト
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                いいね数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                リツイート数
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                リプライ数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                引用数
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                閲覧数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.id || "0"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.tweet_created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://x.com/${log.twitter_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {log.twitter_id}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-md">
                    <p className="truncate">{log.tweet_text}</p>
                    {(log.tweet_link ||
                      `https://x.com/${log.screen_name}/status/${log.tweet_id}`) && (
                      <a
                        href={
                          log.tweet_link ||
                          `https://x.com/${log.screen_name}/status/${log.tweet_id}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
                      >
                        ツイートを見る →
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.favorite_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.retweet_count}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.reply_count}</td> */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.quote_count}</td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.view_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-1">
                    <ActionButton
                      icon={Eye}
                      color="text-blue-600 hover:text-blue-700"
                      onClick={() => handleViewAccountDetails(log.twitter_id)}
                      aria-label="アカウント詳細を表示"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TweetLogDetailModal
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAccountUpdate={() => {}} // ログページでは更新不要
        onAccountRefresh={fetchAccountDetails}
      />
    </div>
  );
});

export default TweetLogTable;
