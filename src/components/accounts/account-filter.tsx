import { Search, Filter } from "lucide-react";
import { memo, useCallback } from "react";

interface AccountFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const AccountFilters = memo(function AccountFilters({
  searchTerm,
  setSearchTerm,
}: AccountFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
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
      </div>
    </div>
  );
});

export default AccountFilters;
