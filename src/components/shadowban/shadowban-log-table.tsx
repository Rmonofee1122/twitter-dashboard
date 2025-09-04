"use client";

import { Eye, AlertTriangle, type LucideIcon } from "lucide-react";
import { memo, useCallback } from "react";

export interface ShadowbanLogEntry {
  log_id: number;
  logged_at: string;
  id: number;
  twitter_id: string;
  name: string;
  screen_name: string;
  status: string | null;
  not_found: boolean | null;
  suspend: boolean | null;
  protect: boolean | null;
  no_tweet: boolean | null;
  search_ban: boolean | null;
  search_suggestion_ban: boolean | null;
  no_reply: boolean | null;
  ghost_ban: boolean | null;
  reply_deboosting: boolean | null;
  follower_count: number | null;
  following_count: number | null;
  posts_count: number | null;
}

interface ShadowbanLogTableProps {
  logs: ShadowbanLogEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
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

const ShadowbanLogTable = memo(function ShadowbanLogTable({
  logs,
  loading,
  error,
  onRetry,
}: ShadowbanLogTableProps) {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusBadge = useCallback((log: ShadowbanLogEntry) => {
    if (log.suspend || log.status === "suspended") {
      return "bg-red-100 text-red-800";
    } else if (log.search_ban || log.search_suggestion_ban || log.ghost_ban) {
      return "bg-orange-100 text-orange-800";
    } else if (log.not_found) {
      return "bg-gray-100 text-gray-800";
    }
    return "bg-green-100 text-green-800";
  }, []);

  const getStatusText = useCallback((log: ShadowbanLogEntry) => {
    if (log.suspend || log.status === "suspended") {
      return "凍結";
    } else if (log.search_ban || log.search_suggestion_ban || log.ghost_ban) {
      return "シャドBAN";
    } else if (log.not_found) {
      return "アカウント未発見";
    }
    return "正常";
  }, []);

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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                実行日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アカウント情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                判定結果
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                詳細
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.log_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.log_id || "0"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.logged_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">
                        <a
                          href={`https://x.com/${log.twitter_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {log.twitter_id}
                        </a>
                      </div>
                      <div className="text-gray-500">{log.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                      log
                    )}`}
                  >
                    {getStatusText(log)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {log.search_ban && (
                      <span className="px-1 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                        検索制限
                      </span>
                    )}
                    {log.search_suggestion_ban && (
                      <span className="px-1 py-0.5 bg-orange-200 text-orange-800 rounded text-xs">
                        検索サジェスト制限
                      </span>
                    )}
                    {log.no_reply && (
                      <span className="px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                        リプライ制限
                      </span>
                    )}
                    {log.ghost_ban && (
                      <span className="px-1 py-0.5 bg-purple-200 text-purple-800 rounded text-xs">
                        ゴーストBAN
                      </span>
                    )}
                    {log.reply_deboosting && (
                      <span className="px-1 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                        リプライ制限
                      </span>
                    )}
                    {log.suspend && (
                      <span className="px-1 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                        凍結
                      </span>
                    )}
                    {log.not_found && (
                      <span className="px-1 py-0.5 bg-gray-200 text-gray-800 rounded text-xs">
                        アカウント未発見
                      </span>
                    )}
                    {!log.search_ban &&
                      !log.search_suggestion_ban &&
                      !log.no_reply &&
                      !log.ghost_ban &&
                      !log.reply_deboosting &&
                      !log.suspend &&
                      !log.not_found && (
                        <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                          制限なし
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <ActionButton
                      icon={Eye}
                      color="text-blue-600 hover:text-blue-700"
                      // onClick={}
                      aria-label="アカウント詳細を表示"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ShadowbanLogTable;
