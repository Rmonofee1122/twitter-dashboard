"use client";

import { useState, useEffect } from "react";
import { X, Plus, Save } from "lucide-react";
import type { ProxyInfo } from "@/app/api/proxy/route";

interface ProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proxy: Partial<ProxyInfo>) => void;
  editingProxy?: ProxyInfo | null;
  loading?: boolean;
}

export default function ProxyModal({
  isOpen,
  onClose,
  onSave,
  editingProxy,
  loading = false,
}: ProxyModalProps) {
  const [ip, setIp] = useState("");
  const [errors, setErrors] = useState<{ ip?: string }>({});

  const isEditing = !!editingProxy;

  // 編集モード時の初期値設定
  useEffect(() => {
    if (isEditing && editingProxy) {
      setIp(editingProxy.ip);
    } else {
      setIp("");
    }
    setErrors({});
  }, [isEditing, editingProxy, isOpen]);

  // Proxy IPのバリデーション
  const validateIP = (ip: string): boolean => {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedIp = ip.trim();
    const newErrors: { ip?: string } = {};

    // バリデーション
    if (!trimmedIp) {
      newErrors.ip = "Proxy IPを入力してください";
    } else if (!validateIP(trimmedIp)) {
      newErrors.ip = "有効なProxy IPを入力してください（例: 192.168.1.1）";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const proxyData: Partial<ProxyInfo> = {
        ip: trimmedIp,
        ...(isEditing && { id: editingProxy!.id }),
      };
      onSave(proxyData);
    }
  };

  const handleClose = () => {
    setIp("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Save className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "プロキシ編集" : "新規プロキシ追加"}
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proxy IP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.1"
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  errors.ip ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.ip && (
                <p className="mt-1 text-sm text-red-600">{errors.ip}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                IPv4アドレス形式で入力してください
              </p>
            </div>

            {/* 編集時の追加情報 */}
            {isEditing && editingProxy && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">現在の情報</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>使用回数: {editingProxy.used_count.toLocaleString()}回</p>
                  <p>登録日: {new Date(editingProxy.created_at).toLocaleDateString('ja-JP')}</p>
                  {editingProxy.last_used_at && (
                    <p>最終使用: {new Date(editingProxy.last_used_at).toLocaleString('ja-JP')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex items-center justify-end space-x-3 mt-6">
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