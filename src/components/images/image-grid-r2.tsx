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
  onBulkDelete?: (images: ImageFile[]) => void;
}

const ImageGrid = memo(function ImageGrid({
  images,
  onImageClick,
  onDownload,
  onUploadSuccess,
  onBulkDelete,
}: ImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages(new Set());
  }, [isSelectionMode]);

  const handleImageSelect = useCallback((imageName: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const currentPageImages = paginationData.currentImages.map(
      (img) => img.name
    );
    setSelectedImages(new Set(currentPageImages));
  }, [paginationData.currentImages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const handleBulkDownload = useCallback(async () => {
    const selectedImageObjects = images.filter((img) =>
      selectedImages.has(img.name)
    );
    
    alert(`${selectedImages.size}件の画像をダウンロードしています...`);
    
    // 順次ダウンロード（間隔を置いて実行）
    for (let i = 0; i < selectedImageObjects.length; i++) {
      const image = selectedImageObjects[i];
      try {
        await new Promise(resolve => setTimeout(resolve, 500 * i)); // 0.5秒間隔
        onDownload(image);
      } catch (error) {
        console.error(`${image.name}のダウンロードに失敗:`, error);
      }
    }
  }, [selectedImages, images, onDownload]);

  const handleBulkDelete = useCallback(() => {
    const selectedImageObjects = images.filter((img) =>
      selectedImages.has(img.name)
    );
    if (
      window.confirm(
        `選択した${selectedImages.size}件の画像を削除しますか？この操作は元に戻せません。`
      )
    ) {
      onBulkDelete?.(selectedImageObjects);
      setSelectedImages(new Set());
      setIsSelectionMode(false);
    }
  }, [selectedImages, images, onBulkDelete]);

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
            {paginationData.totalItems}件中 {paginationData.startIndex + 1}-
            {Math.min(paginationData.endIndex, paginationData.totalItems)}
            件を表示
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

          {/* 選択モード切り替え */}
          <button
            onClick={handleToggleSelectionMode}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isSelectionMode
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isSelectionMode ? "選択モード終了" : "選択モード"}
          </button>

          {/* 一括操作ボタン */}
          {isSelectionMode && selectedImages.size > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                すべて選択
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                選択解除
              </button>
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                一括DL ({selectedImages.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                一括削除 ({selectedImages.size})
              </button>
            </>
          )}

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
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.name)}
                    onChange={() => handleImageSelect(image.name)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                </div>
              )}
              <img
                src={image.url}
                alt={image.name}
                className={`w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform ${
                  selectedImages.has(image.name) ? "ring-4 ring-blue-500" : ""
                }`}
                onClick={() =>
                  isSelectionMode
                    ? handleImageSelect(image.name)
                    : onImageClick(image)
                }
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
