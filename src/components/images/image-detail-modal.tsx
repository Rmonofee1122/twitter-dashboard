"use client";

import { memo, useCallback, useState } from "react";
import { Download, Trash2, Edit, Save, X } from "lucide-react";
import Image from "next/image";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

interface ImageDetailModalProps {
  image: ImageFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (image: ImageFile) => void;
  onDelete?: (image: ImageFile) => void;
  onRename?: (oldName: string, newName: string) => void;
}

const ImageDetailModal = memo(function ImageDetailModal({
  image,
  isOpen,
  onClose,
  onDownload,
  onDelete,
  onRename,
}: ImageDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!image) return;
    onDelete?.(image);
    setShowDeleteConfirm(false);
    onClose();
  }, [image, onDelete, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // ファイル名からフォルダパスを除いて表示名を取得
  const getDisplayFileName = useCallback((fullPath: string) => {
    return fullPath.split("/").pop() || fullPath;
  }, []);

  // フォルダパスとファイル名を分離
  const getPathAndFileName = useCallback((fullPath: string) => {
    const parts = fullPath.split("/");
    if (parts.length <= 1) {
      return { path: "", fileName: fullPath };
    }
    const fileName = parts.pop() || "";
    const path = parts.join("/");
    return { path, fileName };
  }, []);

  const getFileNameAndExtension = useCallback((fullName: string) => {
    // まずフォルダパスを除去
    const displayName = fullName.split("/").pop() || fullName;

    const lastDotIndex = displayName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return { name: displayName, extension: "" };
    }
    return {
      name: displayName.substring(0, lastDotIndex),
      extension: displayName.substring(lastDotIndex),
    };
  }, []);

  const handleEditClick = useCallback(() => {
    if (!image) return;
    const { name } = getFileNameAndExtension(image.name);
    setEditedName(name);
    setIsEditing(true);
  }, [image, getFileNameAndExtension]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditedName("");
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!image || !editedName.trim()) {
      setIsEditing(false);
      return;
    }

    const { name: currentName, extension } = getFileNameAndExtension(
      image.name
    );
    if (editedName.trim() === currentName) {
      setIsEditing(false);
      return;
    }

    // 元のフォルダパスを取得して新しいファイル名と結合
    const { path } = getPathAndFileName(image.name);
    const newFileName = editedName.trim() + extension;
    const newFullPath = path ? `${path}/${newFileName}` : newFileName;

    setIsSaving(true);
    try {
      onRename?.(image.name, newFullPath);
      setIsEditing(false);
      onClose(); // 保存完了後にモーダルを閉じる
    } catch (error) {
      console.error("名前変更エラー:", error);
      alert("名前の変更に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [
    image,
    editedName,
    onRename,
    getFileNameAndExtension,
    getPathAndFileName,
  ]);

  if (!isOpen || !image) return null;

  const { name: baseFileName, extension: fileExtension } =
    getFileNameAndExtension(image.name);

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">画像詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative min-h-[400px]">
              <Image
                src={image.url}
                alt={getDisplayFileName(image.name)}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <div className="md:w-80 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ファイル名
                  {onRename && (
                    <button
                      onClick={isEditing ? handleEditCancel : handleEditClick}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      {isEditing ? "キャンセル" : "編集"}
                    </button>
                  )}
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="新しいファイル名を入力（拡張子なし）"
                      />
                      <span className="text-sm text-gray-500 py-2">
                        {fileExtension}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleEditSave}
                        disabled={
                          isSaving ||
                          !editedName.trim() ||
                          editedName === baseFileName
                        }
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "保存中..." : "保存"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                    {baseFileName
                      ? `${baseFileName.substring(0, 25)}...`
                      : "未設定"}
                    <span className="text-gray-500">{fileExtension}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ファイル形式
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {fileExtension
                    ? fileExtension.substring(1).toUpperCase()
                    : "不明"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ファイルサイズ
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatFileSize(image.size)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  更新日時
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatDate(image.lastModified)}
                </p>
              </div>
              <button
                onClick={() => onDownload(image)}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </button>

              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                画像削除の確認
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                この画像「{image.name}
                」をR2バケットから削除しますか？この操作は元に戻せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ImageDetailModal;
