"use client";

import { useState } from "react";
import { formatDateLocal } from "@/utils/date-helpers";
import { Edit, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { ProxyInfo } from "@/app/api/proxy/route";
import ProxyPagination from "@/components/proxy/proxy-pagination";
import ProxyModal from "./proxy-modal";

interface ProxyTableProps {
  proxies: ProxyInfo[];
  loading: boolean;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  itemsPerPage: number;
  currentPage: number;
  totalProxies: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onDataChange: () => void;
}

export default function ProxyTable({
  proxies,
  loading,
  sortField,
  sortDirection,
  onSort,
  itemsPerPage,
  currentPage,
  totalProxies,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  onDataChange,
}: ProxyTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyInfo | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleCreate = () => {
    setEditingProxy(null);
    setShowModal(true);
  };

  const handleEdit = (proxy: ProxyInfo) => {
    setEditingProxy(proxy);
    setShowModal(true);
  };

  const handleDelete = async (proxy: ProxyInfo) => {
    if (!confirm(`プロキシ "${proxy.ip}" を削除しますか？`)) {
      return;
    }

    try {
      console.log(`🗑️ プロキシを削除: ${proxy.ip}`);
      const response = await fetch(`/api/proxy?id=${proxy.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`削除失敗: ${errorData}`);
      }

      const result = await response.json();
      console.log("✅ プロキシ削除成功:", result);
      toast.success(`プロキシ "${proxy.ip}" を削除しました`, {
        duration: 3000,
      });
      onDataChange(); // データを再取得
    } catch (error) {
      console.error("❌ プロキシ削除エラー:", error);
      toast.error("プロキシの削除に失敗しました", {
        duration: 3000,
      });
    }
  };

  const handleSave = async (proxyData: Partial<ProxyInfo>) => {
    setModalLoading(true);
    
    try {
      const isEditing = !!editingProxy;
      const method = isEditing ? "PUT" : "POST";
      const url = "/api/proxy";

      console.log(`💾 プロキシを${isEditing ? "更新" : "作成"}: ${proxyData.ip}`);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proxyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "操作に失敗しました");
      }

      const result = await response.json();
      console.log(`✅ プロキシ${isEditing ? "更新" : "作成"}成功:`, result);
      
      toast.success(result.message, {
        duration: 3000,
      });
      setShowModal(false);
      setEditingProxy(null);
      onDataChange(); // データを再取得
    } catch (error) {
      console.error(`❌ プロキシ${editingProxy ? "更新" : "作成"}エラー:`, error);
      toast.error(error instanceof Error ? error.message : "操作に失敗しました", {
        duration: 3000,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProxy(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">プロキシデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div>
        {/* 表示件数セレクター */}
        {onItemsPerPageChange && (
          <div className="flex items-center justify-between my-4 ml-2 px-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">表示件数:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                新規作成
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {totalProxies
                  ? (() => {
                      const startIndex = (currentPage - 1) * itemsPerPage + 1;
                      const endIndex = Math.min(currentPage * itemsPerPage, totalProxies);
                      return `${startIndex}-${endIndex}件目 / 全${totalProxies.toLocaleString()}件`;
                    })()
                    : `全${proxies.length}件`}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => onSort("id")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <span className="text-blue-600">{getSortIcon("id")}</span>
                </div>
              </th>
              <th
                onClick={() => onSort("ip")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>IPアドレス</span>
                  <span className="text-blue-600">{getSortIcon("ip")}</span>
                </div>
              </th>
              <th
                onClick={() => onSort("used_count")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>使用回数</span>
                  <span className="text-blue-600">{getSortIcon("used_count")}</span>
                </div>
              </th>
              <th
                onClick={() => onSort("last_used_at")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>最終使用日時</span>
                  <span className="text-blue-600">{getSortIcon("last_used_at")}</span>
                </div>
              </th>
              <th
                onClick={() => onSort("created_at")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>登録日時</span>
                  <span className="text-blue-600">{getSortIcon("created_at")}</span>
                </div>
              </th>
              <th
                onClick={() => onSort("updated_at")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>更新日時</span>
                  <span className="text-blue-600">{getSortIcon("updated_at")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proxies.map((proxy) => (
              <tr key={proxy.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">{proxy.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {proxy.ip}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${
                      proxy.used_count === 0 
                        ? "text-gray-400" 
                        : proxy.used_count < 10 
                        ? "text-green-600"
                        : proxy.used_count < 50
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}>
                      {proxy.used_count.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">回</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`${
                    proxy.last_used_at 
                      ? "text-gray-900" 
                      : "text-gray-400 italic"
                  }`}>
                    {formatDateLocal(proxy.last_used_at)}
                  </div>
                  {proxy.last_used_at && (
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const lastUsed = new Date(proxy.last_used_at);
                        const now = new Date();
                        const diffHours = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60));
                        if (diffHours < 1) return "1時間以内";
                        if (diffHours < 24) return `${diffHours}時間前`;
                        const diffDays = Math.floor(diffHours / 24);
                        return `${diffDays}日前`;
                      })()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{formatDateLocal(proxy.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{formatDateLocal(proxy.updated_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleEdit(proxy)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="編集"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(proxy)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {proxies.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  プロキシデータがありません
                  <div className="mt-2">
                    <button
                      onClick={handleCreate}
                      className="text-green-600 hover:text-green-700 text-sm underline"
                    >
                      最初のプロキシを追加
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        {/* ページネーション */}
      <ProxyPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalProxies={totalProxies}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
      </div>

      {/* プロキシ追加・編集モーダル */}
      <ProxyModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleSave}
        editingProxy={editingProxy}
        loading={modalLoading}
      />
    </div>
  );
}