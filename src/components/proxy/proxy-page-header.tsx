"use client";

import { RefreshCw } from "lucide-react";

interface ProxyPageHeaderProps {
  totalProxies: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function ProxyPageHeader({ 
  totalProxies, 
  loading, 
  onRefresh 
}: ProxyPageHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            プロキシ管理
          </h1>
          <p className="text-gray-600">
            登録済みのプロキシサーバー {totalProxies.toLocaleString()} 件
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>
    </div>
  );
}