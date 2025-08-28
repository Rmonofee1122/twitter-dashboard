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
import { useState, useCallback, useEffect } from "react";
import { TwitterAccountInfo } from "@/types/database";
import {
  getAccountStatus,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";
import { updateAccountStatus } from "@/lib/account-actions";

interface AccountDetailModalProps {
  account: TwitterAccountInfo | null;
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
  const [activeTab, setActiveTab] = useState<string>("basic");

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

  // タブの定義
  const tabs = [
    { id: "basic", label: "基本情報", icon: User },
    { id: "stats", label: "統計情報", icon: BarChart3 },
    { id: "technical", label: "技術情報", icon: Settings },
    { id: "security", label: "セキュリティ", icon: Lock },
    { id: "shadowban", label: "シャドバン判定", icon: Search },
  ];

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
        className="ml-3 p-2 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
        title="コピー"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  // タブコンテンツをレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return renderBasicInfo();
      case "stats":
        return renderStatsInfo();
      case "technical":
        return renderTechnicalInfo();
      case "security":
        return renderSecurityInfo();
      case "shadowban":
        return renderShadowbanInfo();
      default:
        return renderBasicInfo();
    }
  };

  // 基本情報タブ
  const renderBasicInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Twitter ID
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1 font-mono">
              {account.twitter_id || "未設定"}
            </p>
            <CopyButton
              value={account.twitter_id || ""}
              fieldName="twitter_id"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            名前
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1">
              {account.name || "未設定"}
            </p>
            <CopyButton value={account.name || ""} fieldName="name" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            紹介文
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1 break-words">
              {account.description_text || "未設定"}
            </p>
            <CopyButton
              value={account.description_text || ""}
              fieldName="description_text"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            メールアドレス
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1 font-mono">
              {account.email || "未設定"}
            </p>
            <CopyButton value={account.email || ""} fieldName="email" />
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            ステータス
          </label>
          <div className="space-y-3">
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 font-medium"
            >
              <option value="true">アクティブ</option>
              <option value="false">除外</option>
              <option value="suspend">BAN・凍結</option>
              <option value="email_ban">Email BAN</option>
              <option value="FarmUp">保留中（FarmUp）</option>
              <option value="farmup">保留中（farmup）</option>
            </select>
            <div className="flex justify-center">
              <span
                className={`inline-flex px-4 py-2 text-sm font-bold rounded-full shadow-sm ${getStatusBadgeColor(
                  getAccountStatus(selectedStatus)
                )}`}
              >
                {getStatusText(getAccountStatus(selectedStatus))}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            作成日時
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1 font-mono">
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
  );

  // 統計情報タブ
  const renderStatsInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-blue-800">
              フォロワー数
            </label>
            <CopyButton
              value={account.follower_count?.toString() || ""}
              fieldName="follower_count"
            />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {account.follower_count !== null
              ? account.follower_count.toLocaleString()
              : "未設定"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-green-800">
              フォロー数
            </label>
            <CopyButton
              value={account.following_count?.toString() || ""}
              fieldName="following_count"
            />
          </div>
          <p className="text-2xl font-bold text-green-900">
            {account.following_count !== null
              ? account.following_count.toLocaleString()
              : "未設定"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-purple-800">
              メディア数
            </label>
            <CopyButton
              value={account.media_count?.toString() || ""}
              fieldName="media_count"
            />
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {account.media_count !== null
              ? account.media_count.toLocaleString()
              : "未設定"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border border-pink-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-pink-800">いいね数</label>
            <CopyButton
              value={account.favourites_count?.toString() || ""}
              fieldName="favourites_count"
            />
          </div>
          <p className="text-2xl font-bold text-pink-900">
            {account.favourites_count !== null
              ? account.favourites_count.toLocaleString()
              : "未設定"}
          </p>
        </div>
      </div>
    </div>
  );

  // 技術情報タブ
  const renderTechnicalInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            作成IP
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 font-mono flex-1">
              {account.create_ip || "未設定"}
            </p>
            <CopyButton value={account.create_ip || ""} fieldName="create_ip" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Email ID
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 flex-1">
              {account.email_id || "未設定"}
            </p>
            <CopyButton value={account.email_id || ""} fieldName="email_id" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            CT0トークン
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 font-mono flex-1 truncate">
              {account.ct0 ? `${account.ct0.substring(0, 20)}...` : "未設定"}
            </p>
            <CopyButton value={account.ct0 || ""} fieldName="ct0" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            2FAコード
          </label>
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 font-mono flex-1">
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
  );

  // セキュリティ情報タブ
  const renderSecurityInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            パスワード
          </label>
          <div className="flex items-center bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 font-mono flex-1">
              {account.twitter_pass || "未設定"}
            </p>
            <CopyButton
              value={account.twitter_pass || ""}
              fieldName="twitter_pass"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            デバイス情報
          </label>
          <div className="flex items-center bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200 p-4 hover:shadow-sm transition-all duration-200">
            <p className="text-sm font-medium text-gray-800 font-mono flex-1 truncate">
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
  );

  // シャドバン判定タブ
  const renderShadowbanInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="space-y-4">
        <button
          onClick={handleShadowbanCheck}
          disabled={isCheckingShadowban || !account.twitter_id}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
        >
          <Shield className="h-5 w-5 mr-3" />
          {isCheckingShadowban ? "判定中..." : "シャドバン判定"}
        </button>

        {showShadowbanResult && shadowbanData && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5 shadow-inner">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              判定結果
            </h4>
            <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(shadowbanData, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => setShowShadowbanResult(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              結果を閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            {/* プロフ画像 */}
            <div className="flex-shrink-0 h-20 w-20 mr-2">
              {account.profile_image_url_https ? (
                <img
                  className="h-20 w-20 rounded-full object-cover border-3 border-white shadow-lg"
                  src={account.profile_image_url_https}
                  alt={`${account.twitter_id || "User"} profile`}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      account.twitter_id || "User"
                    )}&background=6366f1&color=fff&size=80`;
                  }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-3 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {account.twitter_id
                      ? account.twitter_id.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>
              )}
            </div>
            {/* アカウント詳細・twitter_id */}
            <div className="flex-2 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-white mb-1">
                アカウント詳細
              </h2>
              <p className="text-blue-100 text-sm">
                {account.twitter_id || "Twitter Account"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200"
              aria-label="モーダルを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-gray-100 border-b border-gray-200 px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-300
                    ${
                      isActive
                        ? "text-blue-600 border-b-3 border-blue-600 bg-white rounded-t-lg shadow-sm"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-t-lg"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 mr-2 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-8 bg-gray-50">
          <div className="transition-all duration-300 ease-in-out">
            {renderTabContent()}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-100 to-gray-200 border-t border-gray-300">
          <div className="text-sm">
            {selectedStatus !== (account.app_login || "") && (
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">
                  ステータスが変更されています
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            {selectedStatus !== (account.app_login || "") && (
              <button
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "保存"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
