"use client";

import { memo } from "react";
import { FileText, RefreshCw } from "lucide-react";

interface TweetLogHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

const TweetLogHeader = memo(function TweetLogHeader({
  onRefresh,
  loading,
}: TweetLogHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ツイート履歴</h1>
            <p className="text-gray-600">
              アカウントのツイート履歴を確認できます
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          更新
        </button>
      </div>
    </div>
  );
});

export default TweetLogHeader;
