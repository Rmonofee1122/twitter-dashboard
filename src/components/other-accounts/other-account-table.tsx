import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle,
  XCircle,
  Search,
  Ban,
  MessageCircle,
  Ghost,
  Eye,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { OtherTwitterAccount } from "@/types/database";
import { formatDate01 } from "@/utils/date-helpers";
import OtherAccountDetailModal from "./other-account-detail-modal";

interface OtherAccountTableProps {
  accounts: OtherTwitterAccount[];
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
  const getSortIcon = useCallback(() => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }

    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    } else if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    }

    return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  }, [field, sortField, sortDirection]);

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

const OtherAccountTable = memo(function OtherAccountTable({
  accounts,
  sortField = "",
  sortDirection = "",
  onSort,
}: OtherAccountTableProps) {
  const [selectedAccount, setSelectedAccount] =
    useState<OtherTwitterAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getBooleanBadge = useCallback((value: boolean | null) => {
    if (value === null) return <span className="text-gray-400">-</span>;
    if (value) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          あり
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        なし
      </span>
    );
  }, []);

  // シャドウバン詳細のメモ化
  const shadowbanDetailsCache = useMemo(() => {
    const cache = new Map<
      number,
      Array<{ icon: React.ReactElement; label: string; color: string }>
    >();

    accounts.forEach((account) => {
      const details = [];

      if (account.search_ban) {
        details.push({
          icon: <Search className="h-3 w-3" />,
          label: "検索制限",
          color: "text-red-500",
        });
      }

      if (account.search_suggestion_ban) {
        details.push({
          icon: <Ban className="h-3 w-3" />,
          label: "検索提案制限",
          color: "text-orange-500",
        });
      }

      if (account.no_reply) {
        details.push({
          icon: <MessageCircle className="h-3 w-3" />,
          label: "リプライ制限",
          color: "text-yellow-500",
        });
      }

      if (account.ghost_ban) {
        details.push({
          icon: <Ghost className="h-3 w-3" />,
          label: "返信一覧からの除外",
          color: "text-purple-500",
        });
      }

      if (details.length > 0) {
        cache.set(account.id, details);
      }
    });

    return cache;
  }, [accounts]);

  const getShadowbanDetails = useCallback(
    (account: OtherTwitterAccount) => {
      return shadowbanDetailsCache.get(account.id) || [];
    },
    [shadowbanDetailsCache]
  );

  const hasAnyShadowban = useCallback((account: OtherTwitterAccount) => {
    return !!(
      account.search_ban ||
      account.search_suggestion_ban ||
      account.no_reply ||
      account.ghost_ban ||
      account.reply_deboosting
    );
  }, []);

  // テーブル行コンポーネントをメモ化
  const TableRow = memo(function TableRow({
    account,
    shadowbanDetails,
    hasAnyShadowbanFlag,
  }: {
    account: OtherTwitterAccount;
    shadowbanDetails: Array<{
      icon: React.ReactElement;
      label: string;
      color: string;
    }>;
    hasAnyShadowbanFlag: boolean;
  }) {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {account.id}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {account.account_created_at
            ? formatDate01(account.account_created_at)
            : "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 mr-4">
              {account.profile_image_url_https ? (
                <img
                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  src={account.profile_image_url_https}
                  alt={`${account.name} profile`}
                  loading="lazy"
                  onError={(e) => {
                    const fallbackDiv = document.createElement("div");
                    fallbackDiv.className =
                      "h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-200 shadow-sm";
                    fallbackDiv.innerHTML = `<span class="text-white text-sm font-semibold">${
                      account.name ? account.name.charAt(0).toUpperCase() : "U"
                    }</span>`;
                    e.currentTarget.parentNode?.replaceChild(
                      fallbackDiv,
                      e.currentTarget
                    );
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                  <span className="text-white text-sm font-semibold">
                    {account.name ? account.name.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {account.name}
              </div>
              <div className="text-sm text-blue-500">
                <a
                  href={`https://x.com/${account.screen_name}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{account.screen_name}
                </a>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <div className="flex items-center">
              {account.suspend && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  凍結
                </span>
              )}
              {!account.suspend && hasAnyShadowbanFlag && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  シャドウバン
                </span>
              )}
              {!account.suspend && !hasAnyShadowbanFlag && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  アクティブ
                </span>
              )}
              {hasAnyShadowbanFlag && (
                <div className="ml-2 flex items-center space-x-1">
                  {shadowbanDetails.map((detail, index) => (
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
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {account.updated_at ? formatDate01(account.updated_at) : "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="text-sm font-medium text-gray-900">
            {account.posts_count?.toLocaleString() || "0"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="text-sm font-medium text-gray-900">
            {account.following_count?.toLocaleString() || "0"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="text-sm font-medium text-gray-900">
            {account.follower_count?.toLocaleString() || "0"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-1">
            <ActionButton
              icon={Eye}
              color="text-blue-600 hover:text-blue-700"
              onClick={() => {
                setSelectedAccount(account);
                setIsModalOpen(true);
              }}
              aria-label="アカウント詳細を表示"
            />
          </div>
        </td>
      </tr>
    );
  });

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
              field="name"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="ステータス"
              field="suspend"
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accounts.map((account) => (
            <TableRow
              key={account.id}
              account={account}
              shadowbanDetails={getShadowbanDetails(account)}
              hasAnyShadowbanFlag={hasAnyShadowban(account)}
            />
          ))}
        </tbody>
      </table>
      <OtherAccountDetailModal
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountUpdate={() => {}}
        onAccountRefresh={() => {
          return Promise.resolve(selectedAccount);
        }}
      />
    </div>
  );
});

export default OtherAccountTable;
