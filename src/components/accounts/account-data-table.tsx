import { TwitterAccountInfo } from "@/types/database";
import AccountTable from "./account-table";
import Pagination from "@/components/ui/pagination";
import DateFilter from "./date-filter";
import AccountFilters from "./account-filter";

interface AccountDataTableProps {
  accounts: TwitterAccountInfo[];
  loading: boolean;
  onRefresh: () => void;
  title: string;
  emptyMessage: string;
  refreshButtonColor?: string;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDateFilterClear: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sortField?: string;
  sortDirection?: string;
  onSort?: (field: string) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export default function AccountDataTable({
  accounts,
  loading,
  onRefresh,
  title,
  emptyMessage,
  refreshButtonColor = "bg-blue-100 text-blue-700 hover:bg-blue-200",
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDateFilterClear,
  searchTerm,
  onSearchTermChange,
  sortField = "",
  sortDirection = "",
  onSort,
  onItemsPerPageChange,
}: AccountDataTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleQuickSelect = (start: string, end: string) => {
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="space-y-6">
      <AccountFilters
        searchTerm={searchTerm}
        setSearchTerm={onSearchTermChange}
      />

      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onQuickSelect={handleQuickSelect}
        onClear={onDateFilterClear}
      />

      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center py-12 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {title} ({totalCount.toLocaleString()}件)
              </h3>
              <button
                onClick={onRefresh}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${refreshButtonColor}`}
              >
                更新
              </button>
            </div>
            <AccountTable
              accounts={accounts}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={onItemsPerPageChange}
              currentPage={currentPage}
              totalAccounts={totalCount}
            />

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
