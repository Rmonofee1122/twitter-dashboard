import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { TwitterCreateLog } from "@/types/database";
import {
  getAccountStatus,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";

interface AccountDetailModalProps {
  account: TwitterCreateLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountDetailModal({
  account,
  isOpen,
  onClose,
}: AccountDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                    status
                  )}`}
                >
                  {getStatusText(status)}
                </span>
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
                      ? `${account.device_base64.substring(0, 30)}...`
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
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
