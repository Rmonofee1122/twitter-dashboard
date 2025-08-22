"use client";

import { memo, useCallback } from "react";
import { Download } from "lucide-react";

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
}

const ImageDetailModal = memo(function ImageDetailModal({
  image,
  isOpen,
  onClose,
  onDownload,
}: ImageDetailModalProps) {
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (!isOpen || !image) return null;

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
            <div className="flex-1">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="md:w-80 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ファイル名</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {image.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ファイルサイズ</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatFileSize(image.size)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">更新日時</label>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ImageDetailModal;