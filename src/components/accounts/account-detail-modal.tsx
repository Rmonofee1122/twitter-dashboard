import { X } from "lucide-react";
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
  if (!isOpen || !account) return null;

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
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.twitter_id || "未設定"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.email || "未設定"}
                </p>
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
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatDate(account.created_at)}
                </p>
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
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {account.create_ip || "未設定"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email ID
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.email_id || "未設定"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CT0トークン
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {account.ct0
                    ? `${account.ct0.substring(0, 20)}...`
                    : "未設定"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2FAコード
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.twitter_2fa_code ? "設定済み" : "未設定"}
                </p>
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
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.twitter_pass
                    ? "設定済み (セキュリティ上非表示)"
                    : "未設定"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  デバイス情報
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {account.device_base64
                    ? "デバイス情報あり"
                    : "デバイス情報なし"}
                </p>
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
