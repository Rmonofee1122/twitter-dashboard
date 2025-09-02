import { Search, Filter } from "lucide-react";
import { memo, useCallback } from "react";

type StatusFilter =
  | "all"
  | "active"
  | "shadowban"
  | "stopped"
  | "examination"
  | "suspended";

interface AccountFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
}

const AccountFilters = memo(function AccountFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: AccountFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as StatusFilter);
    },
    [setStatusFilter]
  );
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        {/* 検索 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="アカウントID、メールアドレス、IPアドレスで検索..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ステータスフィルター */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全てのステータス</option>
            <option value="active">アクティブ</option>
            <option value="shadowban">シャドBAN</option>
            <option value="stopped">一時停止</option>
            <option value="examination">審査中</option>
            <option value="suspended">凍結</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export default AccountFilters;
