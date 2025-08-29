import {
  CheckCircle,
  XCircle,
  Clock,
  Minus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { TwitterAccountInfo } from "@/types/database";
import {
  getAccountStatus02,
  getStatusText,
  getStatusBadgeColor,
} from "@/utils/status-helpers";
import { fetchAccountDetails } from "@/app/api/stats/route";
import { updateAccountStatus } from "@/lib/account-actions";
import AccountDetailModal02 from "./account-detail-modal-v2";
import AccountEditModal from "./account-edit-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface AccountTableProps {
  accounts: TwitterAccountInfo[];
  onAccountUpdate?: () => void;
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
      className={`${color} p-1 rounded transition-colors`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

const AccountTable = memo(function AccountTable({
  accounts,
  onAccountUpdate,
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
      const response = await fetch(`/api/accounts?id=${deleteAccount.id}`, {
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
      case "excluded":
      case "false":
      case "not_found":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              アカウント情報
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ステータス
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              作成日時
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              作成IP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 mr-4">
                    {account.profile_image_url_https ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                        src={account.profile_image_url_https}
                        alt={`${account.twitter_id || "User"} profile`}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            account.twitter_id || "User"
                          )}&background=6366f1&color=fff&size=40`;
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-white text-sm font-semibold">
                          {account.twitter_id
                            ? account.twitter_id.charAt(0).toUpperCase()
                            : "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {account.twitter_id}
                    </div>
                    <div className="text-sm text-gray-500">{account.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(account.status)}
                  <span
                    className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                      account.status
                    )}`}
                  >
                    {getStatusText(account.status)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(account.log_created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                {account.create_ip}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <ActionButton
                    icon={Eye}
                    color="text-blue-600 hover:text-blue-900"
                    onClick={() => handleViewDetails(account.twitter_id)}
                    aria-label="アカウント詳細を表示"
                  />
                  <ActionButton
                    icon={Edit}
                    color="text-green-600 hover:text-green-900"
                    onClick={() => handleEditAccount(account)}
                    aria-label="アカウントを編集"
                  />
                  <ActionButton
                    icon={Trash2}
                    color="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteAccount(account)}
                    aria-label="アカウントを削除"
                  />
                  <ActionButton
                    icon={MoreHorizontal}
                    color="text-gray-600 hover:text-gray-900"
                    aria-label="その他のオプション"
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
