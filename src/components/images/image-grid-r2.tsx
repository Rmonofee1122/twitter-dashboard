"use client";

import { memo, useCallback, useRef, useState, useMemo } from "react";
import { Download, Eye, Upload, Plus } from "lucide-react";
import Pagination from "@/components/ui/pagination";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

interface ImageGridProps {
  images: ImageFile[];
  onImageClick: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
  onUploadSuccess?: () => void;
}

const ImageGrid = memo(function ImageGrid({
  images,
  onImageClick,
  onDownload,
  onUploadSuccess,
}: ImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 18;

  // ページネーション用の計算
  const paginationData = useMemo(() => {
    const totalItems = images.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentImages = images.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentImages,
      startIndex,
      endIndex,
    };
  }, [images, currentPage]);
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

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 画像ファイルかチェック
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-image-r2", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("アップロードに失敗しました");
        }

        const result = await response.json();
        console.log("Upload success:", result);

        onUploadSuccess?.();
        alert("画像のアップロードが完了しました");
      } catch (error) {
        console.error("Upload error:", error);
        alert("画像のアップロードに失敗しました");
      } finally {
        setIsUploading(false);
        // ファイル入力をリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onUploadSuccess]
  );

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          プロフィール画像一覧
        </h3>
        <div className="text-center py-12 text-gray-500">
          画像データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            プロフィール画像一覧
          </h3>
          <p className="text-sm text-gray-500">
            {paginationData.totalItems}件中 {paginationData.startIndex + 1}-{Math.min(paginationData.endIndex, paginationData.totalItems)}件を表示
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                新規画像のアップロード
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {paginationData.currentImages.map((image, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onImageClick(image)}
              />
            </div>
            <div className="space-y-1">
              <p
                className="text-xs font-mono text-gray-700 truncate"
                title={image.name}
              >
                {image.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(image.size)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(image.lastModified)}
              </p>
              <div className="flex space-x-1 mt-2">
                <button
                  onClick={() => onImageClick(image)}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  title="詳細表示"
                >
                  <Eye className="h-3 w-3 mx-auto" />
                </button>
                <button
                  onClick={() => onDownload(image)}
                  className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="ダウンロード"
                >
                  <Download className="h-3 w-3 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ページネーション */}
      {paginationData.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            onPageChange={setCurrentPage}
            totalItems={paginationData.totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
});

export default ImageGrid;
