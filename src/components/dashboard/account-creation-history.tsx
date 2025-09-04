import { memo, useCallback, useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { TwitterAccountInfo } from "@/types/database";
import { fetchRecentAccounts } from "@/app/api/stats/route";
import {
  getAccountStatus,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";

export default function AccountCreationHistory() {
  const [accounts, setAccounts] = useState<TwitterAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentAccounts();
  }, []);

  const loadRecentAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchRecentAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch recent accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = useCallback((status: string | null) => {
    switch (status) {
      case "active":
      case "true":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "suspended":
      case "suspend":
      case "email_ban":
      case "Email_BAN":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      case "FarmUp":
      case "farmup":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "search_ban":
      case "search_suggestion_ban":
      case "ghost_ban":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "excluded":
      case "false":
      case "not_found":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          アカウントの追加履歴
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        アカウントの追加履歴
      </h3>

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          最近の履歴がありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アカウント情報
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終チェック
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  フォロー数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  フォロワー数
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => {
                const status = getAccountStatus(account.status);
                return (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(account.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <a
                            href={`https://x.com/${account.twitter_id}`}
                            className="hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {account.twitter_id || "未設定"}
                          </a>
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.email || "未設定"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(account.status)}
                        <span
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            status
                          )}`}
                        >
                          {getStatusText(status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(account.updated_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.posts_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.following_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.follower_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
