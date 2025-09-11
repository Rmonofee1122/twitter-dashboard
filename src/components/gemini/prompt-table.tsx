"use client";

import { useState, useCallback, useMemo } from "react";
import { formatDateLocal } from "@/utils/date-helpers";
import { Edit, Trash2, Plus, Star, StarOff, Copy, Eye, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { GeminiPrompt } from "@/types/database";
import PromptPagination from "@/components/gemini/prompt-pagination";

interface PromptTableProps {
  prompts: GeminiPrompt[];
  loading: boolean;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  itemsPerPage: number;
  currentPage: number;
  totalPrompts: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onDataChange: () => void;
  onCreatePrompt: () => void;
  onEditPrompt: (prompt: GeminiPrompt) => void;
}

export default function PromptTable({
  prompts,
  loading,
  sortField,
  sortDirection,
  onSort,
  itemsPerPage,
  currentPage,
  totalPrompts,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  onDataChange,
  onCreatePrompt,
  onEditPrompt,
}: PromptTableProps) {
  const [csvImporting, setCsvImporting] = useState(false);
  
  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  }, [sortField, sortDirection]);

  const handleDelete = useCallback(async (prompt: GeminiPrompt) => {
    if (!confirm(`プロンプト "${prompt.prompt.substring(0, 50)}..." を削除しますか？`)) {
      return;
    }

    try {
      console.log(`🗑️ プロンプトを削除: ${prompt.id}`);
      const response = await fetch(`/api/gemini-prompts?id=${prompt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`削除失敗: ${errorData}`);
      }

      const result = await response.json();
      console.log("✅ プロンプト削除成功:", result);
      toast.success("プロンプトを削除しました", {
        duration: 3000,
      });
      onDataChange();
    } catch (error) {
      console.error("❌ プロンプト削除エラー:", error);
      toast.error("プロンプトの削除に失敗しました", {
        duration: 3000,
      });
    }
  }, [onDataChange]);

  const handleToggleFavorite = useCallback(async (prompt: GeminiPrompt) => {
    try {
      const response = await fetch("/api/gemini-prompts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: prompt.id,
          action: "toggle_favorite"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "お気に入り更新に失敗しました");
      }

      const result = await response.json();
      toast.success(result.prompt.favorite ? "お気に入りに追加しました" : "お気に入りから削除しました", {
        duration: 2000,
      });
      onDataChange();
    } catch (error) {
      console.error("❌ お気に入り更新エラー:", error);
      toast.error("お気に入りの更新に失敗しました", {
        duration: 3000,
      });
    }
  }, [onDataChange]);

  const handleUsePrompt = useCallback(async (prompt: GeminiPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      toast.success("プロンプトをクリップボードにコピーしました", {
        duration: 2000,
      });

      const response = await fetch("/api/gemini-prompts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: prompt.id,
          action: "use"
        }),
      });

      if (response.ok) {
        onDataChange();
      }
    } catch (error) {
      console.error("❌ プロンプトコピーエラー:", error);
      toast.error("プロンプトのコピーに失敗しました", {
        duration: 3000,
      });
    }
  }, [onDataChange]);

  const handleCsvImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('CSVファイルを選択してください', { duration: 3000 });
      return;
    }

    setCsvImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const prompts: { prompt: string; tags: string[] }[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const columns = trimmedLine.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (columns.length >= 1 && columns[0]) {
            const promptText = columns[0];
            const tags = columns.length > 1 && columns[1] 
              ? columns[1].split('|').map(tag => tag.trim()).filter(tag => tag)
              : ['インポート'];
            
            prompts.push({
              prompt: promptText,
              tags: tags.length > 0 ? tags : ['インポート']
            });
          }
        }
      }

      if (prompts.length === 0) {
        toast.error('CSVファイルからプロンプトが見つかりませんでした', { duration: 3000 });
        return;
      }

      console.log(`📊 CSVから${prompts.length}個のプロンプトを検出`);

      const response = await fetch('/api/gemini-prompts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompts }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'バルクインサートに失敗しました');
      }

      const result = await response.json();
      console.log('✅ プロンプトバルクインサート成功:', result);
      
      toast.success(`${prompts.length}個のプロンプトを一括登録しました`, {
        duration: 5000,
      });
      
      onDataChange();
    } catch (error) {
      console.error('❌ CSVインポートエラー:', error);
      toast.error(error instanceof Error ? error.message : 'CSVインポートに失敗しました', {
        duration: 3000,
      });
    } finally {
      setCsvImporting(false);
      event.target.value = '';
    }
  }, [onDataChange]);

  const paginationInfo = useMemo(() => {
    if (totalPrompts) {
      const startIndex = (currentPage - 1) * itemsPerPage + 1;
      const endIndex = Math.min(currentPage * itemsPerPage, totalPrompts);
      return `${startIndex}-${endIndex}件目 / 全${totalPrompts.toLocaleString()}件`;
    }
    return `全${prompts.length}件`;
  }, [currentPage, itemsPerPage, totalPrompts, prompts.length]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Geminiプロンプトを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div>
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
              onClick={onCreatePrompt}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </button>
            <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50">
              <Upload className="h-4 w-4 mr-1" />
              {csvImporting ? 'インポート中...' : 'CSVインポート'}
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                disabled={csvImporting || loading}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {paginationInfo}
            </div>
          </div>
        </div>
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
                onClick={() => onSort("prompt")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>プロンプト</span>
                  <span className="text-blue-600">{getSortIcon("prompt")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タグ
              </th>
              <th
                onClick={() => onSort("favorite")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>お気に入り</span>
                  <span className="text-blue-600">{getSortIcon("favorite")}</span>
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
                  <span>作成日時</span>
                  <span className="text-blue-600">{getSortIcon("created_at")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">{prompt.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs">
                    <div className="truncate" title={prompt.prompt}>
                      {prompt.prompt.length > 100 
                        ? `${prompt.prompt.substring(0, 100)}...` 
                        : prompt.prompt
                      }
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {prompt.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        +{prompt.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleFavorite(prompt)}
                    className={`p-1 rounded transition-colors ${
                      prompt.favorite
                        ? "text-yellow-500 hover:bg-yellow-50"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                    title={prompt.favorite ? "お気に入りから削除" : "お気に入りに追加"}
                  >
                    {prompt.favorite ? (
                      <Star className="h-5 w-5 fill-current" />
                    ) : (
                      <StarOff className="h-5 w-5" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${
                      prompt.used_count === 0 
                        ? "text-gray-400" 
                        : prompt.used_count < 10 
                        ? "text-green-600"
                        : prompt.used_count < 50
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}>
                      {prompt.used_count.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">回</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`${
                    prompt.last_used_at 
                      ? "text-gray-900" 
                      : "text-gray-400 italic"
                  }`}>
                    {formatDateLocal(prompt.last_used_at)}
                  </div>
                  {prompt.last_used_at && (
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const lastUsed = new Date(prompt.last_used_at);
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
                  <div>{formatDateLocal(prompt.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleUsePrompt(prompt)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="プロンプトを使用（コピー）"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditPrompt(prompt)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="編集"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {prompts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Geminiプロンプトがありません
                  <div className="mt-2">
                    <button
                      onClick={onCreatePrompt}
                      className="text-green-600 hover:text-green-700 text-sm underline"
                    >
                      最初のプロンプトを追加
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
      <PromptPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalPrompts={totalPrompts}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
      </div>
    </div>
  );
}