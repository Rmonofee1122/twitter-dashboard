import { X, Copy, Check, Save, Shield } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { TwitterCreateLog } from "@/types/database";
import {
  getAccountStatus,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";
import { updateAccountStatus } from "@/lib/account-actions";

interface AccountDetailModalProps {
  account: TwitterCreateLog | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdate?: () => void;
}

export default function AccountDetailModal({
  account,
  isOpen,
  onClose,
  onAccountUpdate,
}: AccountDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [shadowbanData, setShadowbanData] = useState<any>(null);
  const [isCheckingShadowban, setIsCheckingShadowban] = useState(false);
  const [showShadowbanResult, setShowShadowbanResult] = useState(false);

  // アカウントが変更されたときにステータスを初期化
  useEffect(() => {
    if (account?.app_login) {
      setSelectedStatus(account.app_login);
    }
  }, [account]);

  const handleStatusChange = useCallback((newStatus: string) => {
    setSelectedStatus(newStatus);
  }, []);

  const handleSaveStatus = useCallback(async () => {
    if (!account || !selectedStatus) return;

    setIsSaving(true);
    try {
      const success = await updateAccountStatus(account.id, selectedStatus);
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
  }, [account, selectedStatus, onAccountUpdate, onClose]);

  const handleShadowbanCheck = useCallback(async () => {
    if (!account?.twitter_id) {
      alert("Twitter IDが設定されていません");
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
    } catch (error) {
      console.error("シャドバン判定エラー:", error);
      alert("シャドバン判定の取得に失敗しました");
    } finally {
      setIsCheckingShadowban(false);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const status = getAccountStatus(account.app_login);

  const CopyButton = ({
    value,
    fieldName,
  }: {
    value: string;
    fieldName: string;
  }) => {
    const isCopied = copiedField === fieldName;
    const hasValue = value && value !== "未設定";

    if (!hasValue) return null;

    return (
      <button
        onClick={() => copyToClipboard(value, fieldName)}
        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="コピー"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            アカウント詳細
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="モーダルを閉じる"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter ID
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.twitter_id || "未設定"}
                  </p>
                  <CopyButton
                    value={account.twitter_id || ""}
                    fieldName="twitter_id"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.email || "未設定"}
                  </p>
                  <CopyButton value={account.email || ""} fieldName="email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">アクティブ</option>
                  <option value="false">除外</option>
                  <option value="suspend">BAN・凍結</option>
                  <option value="email_ban">Email BAN</option>
                  <option value="FarmUp">保留中（FarmUp）</option>
                  <option value="farmup">保留中（farmup）</option>
                </select>
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                      getAccountStatus(selectedStatus)
                    )}`}
                  >
                    {getStatusText(getAccountStatus(selectedStatus))}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作成日時
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {formatDate(account.created_at)}
                  </p>
                  <CopyButton
                    value={formatDate(account.created_at)}
                    fieldName="created_at"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 技術情報 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">技術情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作成IP
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono flex-1">
                    {account.create_ip || "未設定"}
                  </p>
                  <CopyButton
                    value={account.create_ip || ""}
                    fieldName="create_ip"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email ID
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.email_id || "未設定"}
                  </p>
                  <CopyButton
                    value={account.email_id || ""}
                    fieldName="email_id"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CT0トークン
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono flex-1">
                    {account.ct0
                      ? `${account.ct0.substring(0, 20)}...`
                      : "未設定"}
                  </p>
                  <CopyButton value={account.ct0 || ""} fieldName="ct0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2FAコード
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.twitter_2fa_code || "未設定"}
                  </p>
                  <CopyButton
                    value={account.twitter_2fa_code || ""}
                    fieldName="twitter_2fa_code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* セキュリティ情報 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              セキュリティ情報
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.twitter_pass || "未設定"}
                  </p>
                  <CopyButton
                    value={account.twitter_pass || ""}
                    fieldName="twitter_pass"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  デバイス情報
                </label>
                <div className="flex items-center">
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1">
                    {account.device_base64
                      ? `${account.device_base64.substring(0, 20)}...`
                      : "デバイス情報なし"}
                  </p>
                  <CopyButton
                    value={account.device_base64 || ""}
                    fieldName="device_base64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* シャドバン判定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              シャドバン判定
            </h3>
            <div className="space-y-4">
              <button
                onClick={handleShadowbanCheck}
                disabled={isCheckingShadowban || !account.twitter_id}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isCheckingShadowban ? "判定中..." : "シャドバン判定"}
              </button>

              {showShadowbanResult && shadowbanData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    判定結果
                  </h4>
                  <div className="bg-white rounded border p-3">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(shadowbanData, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => setShowShadowbanResult(false)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    結果を閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedStatus !== (account.app_login || "") && (
              <span className="text-yellow-600">
                ※ ステータスが変更されています
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            {selectedStatus !== (account.app_login || "") && (
              <button
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "保存"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
