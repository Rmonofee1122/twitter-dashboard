"use client";

import { useState, useEffect } from "react";
import { X, Plus, Save, Star } from "lucide-react";
import { GeminiPrompt } from "@/types/database";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: Partial<GeminiPrompt>) => void;
  editingPrompt?: GeminiPrompt | null;
  loading?: boolean;
}

export default function PromptModal({
  isOpen,
  onClose,
  onSave,
  editingPrompt,
  loading = false,
}: PromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [errors, setErrors] = useState<{ prompt?: string; tags?: string }>({});

  const isEditing = !!editingPrompt;

  useEffect(() => {
    if (isEditing && editingPrompt) {
      setPrompt(editingPrompt.prompt);
      setTags(editingPrompt.tags || []);
      setFavorite(editingPrompt.favorite);
    } else {
      setPrompt("");
      setTags([]);
      setTagInput("");
      setFavorite(false);
    }
    setErrors({});
  }, [isEditing, editingPrompt, isOpen]);

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedPrompt = prompt.trim();
    const newErrors: { prompt?: string; tags?: string } = {};

    if (!trimmedPrompt) {
      newErrors.prompt = "プロンプトを入力してください";
    } else if (trimmedPrompt.length < 10) {
      newErrors.prompt = "プロンプトは10文字以上入力してください";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const promptData: Partial<GeminiPrompt> = {
        prompt: trimmedPrompt,
        tags,
        favorite,
        ...(isEditing && { id: editingPrompt!.id }),
      };
      onSave(promptData);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setTags([]);
    setTagInput("");
    setFavorite(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Save className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "プロンプト編集" : "新規プロンプト追加"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプト <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="画像生成用のプロンプトを入力してください..."
                disabled={loading}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none ${
                  errors.prompt ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                効果的な画像生成プロンプトを入力してください（最低10文字）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タグ
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="タグを入力してEnterで追加"
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={loading || !tagInput.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  追加
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={loading}
                        className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                プロンプトの分類や検索に使用するタグを追加してください
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFavorite(!favorite)}
                  disabled={loading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    favorite
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                  <span>{favorite ? "お気に入り" : "通常"}</span>
                </button>
                <span className="text-sm text-gray-500">
                  お気に入りに設定すると優先表示されます
                </span>
              </div>
            </div>

            {isEditing && editingPrompt && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">現在の情報</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>使用回数: {editingPrompt.used_count.toLocaleString()}回</p>
                  <p>作成日: {new Date(editingPrompt.created_at).toLocaleDateString('ja-JP')}</p>
                  {editingPrompt.last_used_at && (
                    <p>最終使用: {new Date(editingPrompt.last_used_at).toLocaleString('ja-JP')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                isEditing 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {isEditing ? "更新中..." : "追加中..."}
                </div>
              ) : (
                <div className="flex items-center">
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      更新
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      追加
                    </>
                  )}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}