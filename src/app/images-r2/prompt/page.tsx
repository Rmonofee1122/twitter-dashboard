"use client";

import { useEffect, useState } from "react";
import { Search, Star, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import type { GeminiPrompt } from "@/types/database";
import PromptTable from "@/components/gemini/prompt-table";
import PromptModal from "@/components/gemini/prompt-modal";

interface PromptResponse {
  prompts: GeminiPrompt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function GeminiPromptPage() {
  const [prompts, setPrompts] = useState<GeminiPrompt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<GeminiPrompt | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchQuery, favoriteOnly]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortField,
        sortDirection,
        ...(searchQuery && { search: searchQuery }),
        ...(favoriteOnly && { favorite: "true" }),
      });

      const response = await fetch(`/api/gemini-prompts?${params}`);
      if (!response.ok) {
        throw new Error("Gemini��������n֗k1WW~W_");
      }

      const data: PromptResponse = await response.json();
      setPrompts(data.prompts);
      setTotalPrompts(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Gemini��������n֗k1WW~W_:", error);
      toast.error("���n֗k1WW~W_", {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setShowModal(true);
  };

  const handleEditPrompt = (prompt: GeminiPrompt) => {
    setEditingPrompt(prompt);
    setShowModal(true);
  };

  const handleSavePrompt = async (promptData: Partial<GeminiPrompt>) => {
    setModalLoading(true);
    
    try {
      const isEditing = !!editingPrompt;
      const method = isEditing ? "PUT" : "POST";
      const url = "/api/gemini-prompts";

      console.log(`=� ����Ȓ${isEditing ? "��" : "\"}: ${promptData.prompt?.substring(0, 50)}...`);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "�\k1WW~W_");
      }

      const result = await response.json();
      console.log(` �����${isEditing ? "��" : "\"}�:`, result);
      
      toast.success(result.message, {
        duration: 3000,
      });
      setShowModal(false);
      setEditingPrompt(null);
      fetchPrompts();
    } catch (error) {
      console.error(`L �����${editingPrompt ? "��" : "\"}���:`, error);
      toast.error(error instanceof Error ? error.message : "�\k1WW~W_", {
        duration: 3000,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingPrompt(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">プロンプト一覧</h1>
              <p className="text-gray-600">プロンプト一覧</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              プロンプト数: <span className="font-semibold text-gray-900">{totalPrompts.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="プロンプトを検索..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                favoriteOnly
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Star className={`h-4 w-4 mr-2 ${favoriteOnly ? "fill-current" : ""}`} />
              お気に入り
            </button>
            <button
              onClick={fetchPrompts}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      <PromptTable
        prompts={prompts}
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPrompts={totalPrompts}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onDataChange={fetchPrompts}
        onCreatePrompt={handleCreatePrompt}
        onEditPrompt={handleEditPrompt}
      />

      <PromptModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleSavePrompt}
        editingPrompt={editingPrompt}
        loading={modalLoading}
      />
    </div>
  );
}