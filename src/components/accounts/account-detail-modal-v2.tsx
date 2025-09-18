import {
  X,
  Copy,
  Check,
  Save,
  Shield,
  User,
  BarChart3,
  Settings,
  Lock,
  Search,
} from "lucide-react";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { TwitterAccountInfo } from "@/types/database";
import {
  getAccountStatus,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";
import { updateAccountStatus } from "@/lib/account-actions";
import { fetchAccountDetails } from "@/app/api/stats/route";

interface AccountDetailModalProps {
  account: TwitterAccountInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdate?: () => void;
  onAccountRefresh?: (twitterId: string) => Promise<TwitterAccountInfo | null>;
}

const AccountDetailModal = React.memo(function AccountDetailModal({
  account,
  isOpen,
  onClose,
  onAccountUpdate,
  onAccountRefresh,
}: AccountDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [shadowbanData, setShadowbanData] = useState<any>(null);
  const [isCheckingShadowban, setIsCheckingShadowban] = useState(false);
  const [showShadowbanResult, setShowShadowbanResult] = useState(false);
  const [shadowbanLogs, setShadowbanLogs] = useState<any[]>([]);
  const [isLoadingShadowbanLogs, setIsLoadingShadowbanLogs] = useState(false);
  const [currentAccount, setCurrentAccount] =
    useState<TwitterAccountInfo | null>(account);
  // アカウントが変更されたときにステータスを初期化
  useEffect(() => {
    if (account) {
      setCurrentAccount(account);
      if (account.status) {
        setSelectedStatus(account.status);
      }
    }
  }, [account]);

  const handleStatusChange = useCallback((newStatus: string) => {
    setSelectedStatus(newStatus);
  }, []);

  const handleSaveStatus = useCallback(async () => {
    if (!account || !selectedStatus) return;

    setIsSaving(true);
    try {
      if (!currentAccount) {
        throw new Error("アカウント情報が見つかりません");
      }
      const success = await updateAccountStatus(
        currentAccount.id,
        selectedStatus
      );
      if (success) {
        onAccountUpdate?.();
        onClose();
      } else {
        alert("ステータスの更新に失敗しました");
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("ステータスの更新中にエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  }, [currentAccount, selectedStatus, onAccountUpdate, onClose]);

  const handleShadowbanCheck = useCallback(async () => {
    if (!account?.twitter_id) {
      toast.error("Twitter IDが設定されていません");
      return;
    }

    // @マークを除去したTwitter ID
    const screenName = account.twitter_id.replace(/^@/, "");

    setIsCheckingShadowban(true);
    try {
      const response = await fetch(
        `/api/shadowban?screen_name=${encodeURIComponent(screenName)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setShadowbanData(data);
      setShowShadowbanResult(true);
      toast.success("シャドバン判定に成功しました");

      // モーダル内のアカウントデータを最新に更新（モーダルは閉じない）
      if (onAccountRefresh && account.twitter_id) {
        try {
          const updatedAccount = await onAccountRefresh(account.twitter_id);
          if (updatedAccount) {
            setCurrentAccount(updatedAccount);
          }
        } catch (refreshError) {
          console.error("アカウント情報の再取得エラー:", refreshError);
        }
      }

      // 背景のアカウント一覧も更新（モーダルは開いたまま）
      // onAccountUpdate?.();
    } catch (error) {
      console.error("シャドバン判定エラー:", error);
      toast.error("シャドバン判定に失敗しました");
    } finally {
      setIsCheckingShadowban(false);
    }
  }, [account, onAccountRefresh]);

  const fetchShadowbanLogs = useCallback(async () => {
    if (!account?.twitter_id) return;

    setIsLoadingShadowbanLogs(true);
    try {
      const response = await fetch(
        `/api/shadowban-logs?twitter_id=${encodeURIComponent(
          account.twitter_id
        )}&limit=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setShadowbanLogs(result.logs || []);
    } catch (error) {
      console.error("シャドバンログ取得エラー:", error);
      setShadowbanLogs([]);
    } finally {
      setIsLoadingShadowbanLogs(false);
    }
  }, [account?.twitter_id]);

  // モーダルが開かれた時にログを取得
  useEffect(() => {
    if (isOpen && account?.twitter_id) {
      fetchShadowbanLogs();
    }
  }, [isOpen, account?.twitter_id, fetchShadowbanLogs]);

  const copyToClipboard = useCallback(
    async (text: string, fieldName: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    },
    []
  );

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const status = useMemo(
    () => (currentAccount ? getAccountStatus(currentAccount.status) : null),
    [currentAccount?.status]
  );

  if (!isOpen || !currentAccount) return null;

  const CopyButton = React.memo(
    ({ value, fieldName }: { value: string; fieldName: string }) => {
      const isCopied = copiedField === fieldName;
      const hasValue = value && value !== "未設定";

      if (!hasValue) return null;

      return (
        <button
          onClick={() => copyToClipboard(value, fieldName)}
          className="ml-2 p-1 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded border border-gray-200 hover:border-blue-300 transition-colors"
          title="コピー"
        >
          {isCopied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      );
    }
  );

  // 基本情報セクション
  const renderBasicInfo = useMemo(
    () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pb-4">
          <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-blue-800">
                フォロワー
              </label>
              <CopyButton
                value={currentAccount.follower_count?.toString() || ""}
                fieldName="follower_count"
              />
            </div>
            <p className="text-lg font-bold text-blue-900">
              {currentAccount.follower_count !== null
                ? currentAccount.follower_count.toLocaleString()
                : "未設定"}
            </p>
          </div>
          <div className="bg-green-50 rounded-md p-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-green-800">
                フォロー
              </label>
              <CopyButton
                value={currentAccount.following_count?.toString() || ""}
                fieldName="following_count"
              />
            </div>
            <p className="text-lg font-bold text-green-900">
              {currentAccount.following_count !== null
                ? currentAccount.following_count.toLocaleString()
                : "未設定"}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-yellow-800">投稿</label>
              <CopyButton
                value={currentAccount.media_count?.toString() || ""}
                fieldName="posts_count"
              />
            </div>
            <p className="text-lg font-bold text-yellow-900">
              {currentAccount.posts_count !== null
                ? currentAccount.posts_count.toLocaleString()
                : 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-md p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-purple-800">
                メディア
              </label>
              <CopyButton
                value={currentAccount.media_count?.toString() || ""}
                fieldName="media_count"
              />
            </div>
            <p className="text-lg font-bold text-purple-900">
              {currentAccount.media_count !== null
                ? currentAccount.media_count.toLocaleString()
                : "未設定"}
            </p>
          </div>
          <div className="bg-pink-50 rounded-md p-3 border border-pink-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-pink-800">いいね</label>
              <CopyButton
                value={currentAccount.favourites_count?.toString() || ""}
                fieldName="favourites_count"
              />
            </div>
            <p className="text-lg font-bold text-pink-900">
              {currentAccount.favourites_count !== null
                ? currentAccount.favourites_count.toLocaleString()
                : 0}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              Twitter ID
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 flex-1 font-mono truncate">
                {currentAccount.twitter_id || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.twitter_id || ""}
                fieldName="twitter_id"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              名前
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 flex-1 truncate">
                {currentAccount.name || "未設定"}
              </p>
              <CopyButton value={currentAccount.name || ""} fieldName="name" />
            </div>
          </div>
          {/* <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-600">
            紹介文
          </label>
          <div className="flex items-center bg-gray-50 rounded-md border p-2">
            <p className="text-sm text-gray-800 flex-1 truncate">
              {currentAccount.description_text || "未設定"}
            </p>
            <CopyButton
              value={currentAccount.description_text || ""}
              fieldName="description_text"
            />
          </div>
        </div> */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              メールアドレス
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 flex-1 font-mono truncate">
                {currentAccount.email || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.email || ""}
                fieldName="email"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              作成IP
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                {currentAccount.create_ip || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.create_ip || ""}
                fieldName="create_ip"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              Email ID
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 flex-1 truncate">
                {currentAccount.email_id || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.email_id || ""}
                fieldName="email_id"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              作成日時
            </label>
            <div className="flex items-center bg-gray-50 rounded-md border p-2">
              <p className="text-sm text-gray-800 flex-1 font-mono">
                {formatDate(currentAccount.created_at)}
              </p>
              <CopyButton
                value={formatDate(currentAccount.created_at)}
                fieldName="created_at"
              />
            </div>
          </div>
        </div>
      </div>
    ),
    [currentAccount, copiedField, copyToClipboard, formatDate, CopyButton]
  );

  // 統計情報セクション
  // const renderStatsInfo = () => (
  //   <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
  //     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  //       <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
  //         <div className="flex items-center justify-between mb-1">
  //           <label className="text-xs font-bold text-blue-800">
  //             フォロワー
  //           </label>
  //           <CopyButton
  //             value={currentAccount.follower_count?.toString() || ""}
  //             fieldName="follower_count"
  //           />
  //         </div>
  //         <p className="text-lg font-bold text-blue-900">
  //           {currentAccount.follower_count !== null
  //             ? currentAccount.follower_count.toLocaleString()
  //             : "未設定"}
  //         </p>
  //       </div>
  //       <div className="bg-green-50 rounded-md p-3 border border-green-200">
  //         <div className="flex items-center justify-between mb-1">
  //           <label className="text-xs font-bold text-green-800">フォロー</label>
  //           <CopyButton
  //             value={currentAccount.following_count?.toString() || ""}
  //             fieldName="following_count"
  //           />
  //         </div>
  //         <p className="text-lg font-bold text-green-900">
  //           {currentAccount.following_count !== null
  //             ? currentAccount.following_count.toLocaleString()
  //             : "未設定"}
  //         </p>
  //       </div>
  //       <div className="bg-purple-50 rounded-md p-3 border border-purple-200">
  //         <div className="flex items-center justify-between mb-1">
  //           <label className="text-xs font-bold text-purple-800">
  //             メディア
  //           </label>
  //           <CopyButton
  //             value={currentAccount.media_count?.toString() || ""}
  //             fieldName="media_count"
  //           />
  //         </div>
  //         <p className="text-lg font-bold text-purple-900">
  //           {currentAccount.media_count !== null
  //             ? currentAccount.media_count.toLocaleString()
  //             : "未設定"}
  //         </p>
  //       </div>
  //       <div className="bg-pink-50 rounded-md p-3 border border-pink-200">
  //         <div className="flex items-center justify-between mb-1">
  //           <label className="text-xs font-bold text-pink-800">いいね</label>
  //           <CopyButton
  //             value={currentAccount.favourites_count?.toString() || ""}
  //             fieldName="favourites_count"
  //           />
  //         </div>
  //         <p className="text-lg font-bold text-pink-900">
  //           {currentAccount.favourites_count !== null
  //             ? currentAccount.favourites_count.toLocaleString()
  //             : "未設定"}
  //         </p>
  //       </div>
  //     </div>
  //   </div>
  // );

  // モード設定セクション
  const renderTechnicalInfo = useMemo(
    () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              ステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="true">アクティブ</option>
              <option value="false">除外</option>
              <option value="suspend">BAN・凍結</option>
              <option value="email_ban">Email BAN</option>
              <option value="FarmUp">保留中（FarmUp）</option>
              <option value="farmup">保留中（farmup）</option>
            </select>
          </div>
        </div>
      </div>
    ),
    [selectedStatus, handleStatusChange]
  );

  // 認証情報セクション
  const renderSecurityInfo = useMemo(
    () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              パスワード
            </label>
            <div className="flex items-center bg-red-50 rounded-md border border-red-200 p-2">
              <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                {currentAccount.twitter_pass || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.twitter_pass || ""}
                fieldName="twitter_pass"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              2FAコード
            </label>
            <div className="flex items-center bg-red-50 rounded-md border border-red-200 p-2">
              <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                {currentAccount.twitter_2fa_code || "未設定"}
              </p>
              <CopyButton
                value={currentAccount.twitter_2fa_code || "未設定"}
                fieldName="twitter_2fa_code"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              CT0トークン
            </label>
            <div className="flex items-center bg-red-50 rounded-md border border-red-200 p-2">
              <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                {currentAccount.ct0
                  ? `${currentAccount.ct0.substring(0, 15)}...`
                  : "未設定"}
              </p>
              <CopyButton
                value={currentAccount.ct0 || "未設定"}
                fieldName="ct0"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              デバイス情報
            </label>
            <div className="flex items-center bg-red-50 rounded-md border border-red-200 p-2">
              <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                {currentAccount.device_base64
                  ? `${currentAccount.device_base64.substring(0, 15)}...`
                  : "デバイス情報なし"}
              </p>
              <CopyButton
                value={currentAccount.device_base64 || ""}
                fieldName="device_base64"
              />
            </div>
          </div>
        </div>
      </div>
    ),
    [currentAccount, copiedField, copyToClipboard, CopyButton]
  );

  // シャドバン判定セクション
  const renderShadowbanInfo = useMemo(
    () => (
      <div className="rounded-lg p-4">
        <div className="space-y-4">
          <button
            onClick={handleShadowbanCheck}
            disabled={isCheckingShadowban || !currentAccount.twitter_id}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isCheckingShadowban ? "判定中..." : "シャドバン判定"}
          </button>
        </div>
      </div>
    ),
    [isCheckingShadowban, currentAccount?.twitter_id, handleShadowbanCheck]
  );

  // シャドバン判定ログセクション
  const renderShadowbanLogs = useMemo(
    () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800">
            ステータス変更履歴
          </h4>
          <button
            onClick={fetchShadowbanLogs}
            disabled={isLoadingShadowbanLogs}
            className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Shield className="h-3 w-3 mr-1" />
            {isLoadingShadowbanLogs ? "読み込み中..." : "更新"}
          </button>
        </div>

        {isLoadingShadowbanLogs ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-1">ログを読み込み中...</p>
          </div>
        ) : shadowbanLogs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">ログがありません</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="bg-gray-50 grid grid-cols-3 gap-4 p-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-700">日時</div>
              <div className="text-xs font-semibold text-gray-700">
                判定結果
              </div>
              <div className="text-xs font-semibold text-gray-700">詳細</div>
            </div>

            {/* ログデータ */}
            <div className="max-h-48 overflow-y-auto">
              {shadowbanLogs.map((log, index) => (
                <div
                  key={log.log_id}
                  className={`grid grid-cols-3 gap-4 p-3 border-b border-gray-100 text-xs ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors`}
                >
                  {/* 日時 */}
                  <div className="font-medium text-gray-700">
                    {new Date(log.updated_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* 判定結果 */}
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === "suspended" || log.suspend
                          ? "bg-red-100 text-red-800"
                          : log.search_ban ||
                            log.search_suggestion_ban ||
                            log.ghost_ban
                          ? "bg-orange-100 text-orange-800"
                          : log.not_found
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {log.status || "確認済み"}
                    </span>
                  </div>

                  {/* 詳細（シャドバン詳細フラグ） */}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    [shadowbanLogs, isLoadingShadowbanLogs, fetchShadowbanLogs]
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="relative bg-gray-800 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            {/* プロフ画像 */}
            <div className="flex-shrink-0 h-20 w-20 mr-2">
              {currentAccount.profile_image_url_https ? (
                <img
                  className="h-20 w-20 rounded-full object-cover border-3 border-white shadow-lg"
                  src={currentAccount.profile_image_url_https}
                  alt={`${currentAccount.twitter_id || "User"} profile`}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentAccount.twitter_id || "User"
                    )}&background=6366f1&color=fff&size=80`;
                  }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-3 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {currentAccount.twitter_id
                      ? currentAccount.twitter_id.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>
              )}
            </div>
            {/* アカウント詳細・twitter_id */}
            <div className="flex-2 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-white mb-1">
                <a
                  href={`https://x.com/${currentAccount.twitter_id}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentAccount.twitter_id || "Twitter Account"}
                </a>
              </h2>
              <p className="text-blue-100 text-sm">アカウント詳細</p>
            </div>
            {renderShadowbanInfo}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200"
              aria-label="モーダルを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-4 bg-gray-50">
          <div className="space-y-4">
            {/* 基本情報セクション */}
            <div>
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">基本情報</h3>
              </div>
              {renderBasicInfo}
            </div>

            {/* 統計情報セクション */}
            {/* <div>
              <div className="flex items-center mb-2">
                <BarChart3 className="h-4 w-4 text-green-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">統計情報</h3>
              </div>
              {renderStatsInfo()}
            </div> */}

            {/* 認証情報セクション */}
            <div>
              <div className="flex items-center mb-2">
                <Lock className="h-4 w-4 text-red-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">認証情報</h3>
              </div>
              {renderSecurityInfo}
            </div>

            {/* モード設定セクション */}
            <div>
              <div className="flex items-center mb-2">
                <Settings className="h-4 w-4 text-purple-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">モード設定</h3>
              </div>
              {renderTechnicalInfo}
            </div>

            {/* シャドバン判定ログセクション */}
            <div>
              <div className="flex items-center mb-2">
                <Search className="h-4 w-4 text-orange-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">
                  シャドバン判定ログ
                </h3>
              </div>
              {renderShadowbanLogs}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600 font-mono">
              更新：{formatDate(currentAccount.updated_at)}
            </p>
            {selectedStatus !== (currentAccount.status || "") && (
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mt-1">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
                <span>ステータス変更あり</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {selectedStatus !== (currentAccount.status || "") && (
              <button
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "保存中..." : "保存"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AccountDetailModal;
