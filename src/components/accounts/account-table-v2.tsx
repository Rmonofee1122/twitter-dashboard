import {
  CheckCircle,
  XCircle,
  Clock,
  Minus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertTriangle,
  Search,
  MessageCircle,
  Ghost,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, useState, useEffect } from "react";
import { TwitterAccountInfo } from "@/types/database";
import { getStatusText, getStatusBadgeColor } from "@/utils/status-helpers";
import { fetchAccountDetails } from "@/app/api/stats/route";
import { updateAccountStatus } from "@/lib/account-actions";
import AccountDetailModal02 from "./account-detail-modal-v2";
import AccountEditModal from "./account-edit-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface AccountTableProps {
  accounts: TwitterAccountInfo[];
  onAccountUpdate?: () => void;
  sortField?: string;
  sortDirection?: string;
  onSort?: (field: string) => void;
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

const SortableHeader = memo(function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: string;
  sortField: string;
  sortDirection: string;
  onSort?: (field: string) => void;
}) {
  const getSortIcon = () => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }

    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    } else if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    }

    return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  };

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center justify-between">
        {label}
        {getSortIcon()}
      </div>
    </th>
  );
});

const AccountTable = memo(function AccountTable({
  accounts,
  onAccountUpdate,
  sortField = "",
  sortDirection = "",
  onSort,
}: AccountTableProps) {
  const [selectedAccount, setSelectedAccount] =
    useState<TwitterAccountInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editAccount, setEditAccount] = useState<TwitterAccountInfo | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState<TwitterAccountInfo | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [suspendDates, setSuspendDates] = useState<Record<string, string>>({});

  const handleViewDetails = useCallback(async (twitterId: string | null) => {
    if (!twitterId) return;

    setIsLoading(true);
    try {
      const accountDetails = await fetchAccountDetails(twitterId);
      if (accountDetails) {
        setSelectedAccount(accountDetails);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch account details:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  }, []);

  const handleEditAccount = useCallback((account: TwitterAccountInfo) => {
    setEditAccount(account);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditAccount(null);
  }, []);

  const handleSaveStatus = useCallback(
    async (id: number, status: string) => {
      const success = await updateAccountStatus(id, status);
      if (success) {
        onAccountUpdate?.();
      } else {
        throw new Error("ステータスの更新に失敗しました");
      }
    },
    [onAccountUpdate]
  );

  const handleDeleteAccount = useCallback((account: TwitterAccountInfo) => {
    setDeleteAccount(account);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteAccount) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/accounts-v2?id=${deleteAccount.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      onAccountUpdate?.();
      setIsDeleteDialogOpen(false);
      setDeleteAccount(null);
    } catch (error) {
      console.error("アカウント削除エラー:", error);
      alert("アカウントの削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAccount, onAccountUpdate]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeleteAccount(null);
  }, []);

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

  const getShadowbanDetails = useCallback((account: TwitterAccountInfo) => {
    const details = [];

    // search_ban
    if (account.search_ban) {
      details.push({
        icon: <Search className="h-3 w-3" />,
        label: "検索制限",
        color: "text-red-500",
      });
    }

    // search_suggestion_ban
    if (account.search_suggestion_ban) {
      details.push({
        icon: <Ban className="h-3 w-3" />,
        label: "検索提案制限",
        color: "text-orange-500",
      });
    }

    // no_reply
    if (account.no_reply) {
      details.push({
        icon: <MessageCircle className="h-3 w-3" />,
        label: "リプライ制限",
        color: "text-yellow-500",
      });
    }

    // ghost_ban
    if (account.ghost_ban) {
      details.push({
        icon: <Ghost className="h-3 w-3" />,
        label: "返信一覧からの除外",
        color: "text-purple-500",
      });
    }

    return details;
  }, []);

  const isShadeowBanned = useCallback((status: string | null) => {
    return (
      status === "search_ban" ||
      status === "search_suggestion_ban" ||
      status === "ghost_ban"
    );
  }, []);

  const isSuspended = useCallback((status: string | null) => {
    return status === "suspend" || status === "suspended";
  }, []);

  const fetchSuspendDate = useCallback(async (twitterId: string) => {
    try {
      const response = await fetch(
        `/api/shadowban-log?twitter_id=${encodeURIComponent(twitterId)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.data && result.data.updated_at) {
        setSuspendDates((prev) => ({
          ...prev,
          [twitterId]: result.data.updated_at,
        }));
      }
    } catch (error) {
      console.error(`凍結判定日取得エラー (${twitterId}):`, error);
    }
  }, []);

  // 凍結ステータスのアカウントの凍結判定日を取得
  const fetchSuspendDatesForAccounts = useCallback(async () => {
    const suspendedAccounts = accounts.filter(
      (account) => isSuspended(account.status) && account.twitter_id
    );

    for (const account of suspendedAccounts) {
      if (account.twitter_id && !suspendDates[account.twitter_id]) {
        await fetchSuspendDate(account.twitter_id);
      }
    }
  }, [accounts, isSuspended, suspendDates, fetchSuspendDate]);

  // アカウントリストが変更されたときに凍結判定日を取得
  useEffect(() => {
    fetchSuspendDatesForAccounts();
  }, [accounts]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <SortableHeader
              label="No"
              field="id"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="作成日時"
              field="created_at"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="アカウント情報"
              field="twitter_id"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="ステータス"
              field="status"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />

            <SortableHeader
              label="最終チェック"
              field="updated_at"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="投稿数"
              field="posts_count"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="フォロー数"
              field="following_count"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="フォロワー数"
              field="follower_count"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />

            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              作成IP
            </th> */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {account.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(account.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 mr-4">
                    <img
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      src={
                        account.profile_image_url_https ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          account.twitter_id || "User"
                        )}&background=6366f1&color=fff&size=40`
                      }
                      alt={`${account.twitter_id || "User"} profile`}
                      onError={(e) => {
                        const fallbackDiv = document.createElement("div");
                        fallbackDiv.className =
                          "h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-200 shadow-sm";
                        fallbackDiv.innerHTML = `<span class="text-white text-sm font-semibold">${
                          account.twitter_id
                            ? account.twitter_id.charAt(0).toUpperCase()
                            : "U"
                        }</span>`;
                        e.currentTarget.parentNode?.replaceChild(
                          fallbackDiv,
                          e.currentTarget
                        );
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-500">
                      <a
                        href={`https://x.com/${account.twitter_id}`}
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {account.twitter_id}
                      </a>
                    </div>
                    <div className="text-sm text-gray-500">{account.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    {getStatusIcon(account.status)}
                    <span
                      className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        account.status
                      )}`}
                    >
                      {getStatusText(account.status)}
                    </span>
                    {isShadeowBanned(account.status) && (
                      <div className="ml-2 flex items-center space-x-1">
                        {getShadowbanDetails(account).map((detail, index) => (
                          <div
                            key={index}
                            className={`p-1 rounded ${detail.color}`}
                            title={detail.label}
                          >
                            {detail.icon}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isSuspended(account.status) &&
                    account.twitter_id &&
                    suspendDates[account.twitter_id] && (
                      <div className="text-xs text-gray-500 mt-1 ml-6">
                        凍結判定: {formatDate(suspendDates[account.twitter_id])}
                      </div>
                    )}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(account.updated_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="text-sm font-medium text-gray-900">
                  {account.posts_count?.toLocaleString() || 0}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="text-sm font-medium text-gray-900">
                  {account.following_count?.toLocaleString() || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="text-sm font-medium text-gray-900">
                  {account.follower_count?.toLocaleString() || 0}
                </div>
              </td>

              {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                {account.create_ip}
              </td> */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  <ActionButton
                    icon={Eye}
                    color="text-blue-600 hover:text-blue-700"
                    onClick={() => handleViewDetails(account.twitter_id)}
                    aria-label="アカウント詳細を表示"
                  />
                  {/* <ActionButton
                    icon={Edit}
                    color="text-green-600 hover:text-green-700"
                    onClick={() => handleEditAccount(account)}
                    aria-label="アカウントを編集"
                  /> */}
                  <ActionButton
                    icon={Trash2}
                    color="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteAccount(account)}
                    aria-label="アカウントを削除"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AccountDetailModal02
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAccountUpdate={onAccountUpdate}
        onAccountRefresh={fetchAccountDetails}
      />

      <AccountEditModal
        account={editAccount}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveStatus}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="アカウント削除の確認"
        message="このアカウントを削除しますか？"
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
});

export default AccountTable;
