"use client";

import { memo } from "react";
import { Search } from "lucide-react";

interface TweetLogFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const TweetLogFilters = memo(function TweetLogFilters({
  searchTerm,
  onSearchChange,
}: TweetLogFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        {/* ツイート検索とステータスフィルター */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 検索（3列分） */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ツイート検索
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Twitter ID, テキストで検索..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* ステータスフィルター（1列分） */}
          {/* <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">全て</option>
              <option value="normal">正常</option>
              <option value="Tweet">シャドBAN</option>
              <option value="suspended">凍結</option>
              <option value="not_found">アカウント未発見</option>
            </select>
          </div> */}
        </div>
      </div>
    </div>
  );
});

export default TweetLogFilters;
