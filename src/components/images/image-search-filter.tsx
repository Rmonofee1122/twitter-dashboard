"use client";

import { memo, useCallback, useMemo, useEffect, useState } from "react";
import { Search, Filter, X, Calendar, Folder } from "lucide-react";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

interface ImageSearchFilterProps {
  images: ImageFile[];
  onFilteredImages: (filteredImages: ImageFile[]) => void;
  fileNameFilter: string;
  fileTypeFilter: string;
  folderFilter: string;
  startDate: string;
  endDate: string;
  onFileNameFilterChange: (value: string) => void;
  onFileTypeFilterChange: (value: string) => void;
  onFolderFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onQuickDateSelect?: (start: string, end: string) => void;
}

const ImageSearchFilter = memo(function ImageSearchFilter({
  images,
  onFilteredImages,
  fileNameFilter,
  fileTypeFilter,
  folderFilter,
  startDate,
  endDate,
  onFileNameFilterChange,
  onFileTypeFilterChange,
  onFolderFilterChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onQuickDateSelect,
}: ImageSearchFilterProps) {
  // R2フォルダ一覧の状態管理
  const [folders, setFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // R2フォルダ一覧を取得
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoadingFolders(true);
        const response = await fetch("/api/r2-folders");
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
        } else {
          console.error("フォルダ取得エラー:", response.statusText);
        }
      } catch (error) {
        console.error("フォルダ取得エラー:", error);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchFolders();
  }, []);

  // 利用可能なファイル形式を取得
  const availableFileTypes = useMemo(() => {
    const types = new Set<string>();
    images.forEach((image) => {
      const extension = image.name.toLowerCase().split(".").pop();
      if (extension) {
        types.add(extension.toUpperCase());
      }
    });
    return Array.from(types).sort();
  }, [images]);

  // フィルタリング処理
  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      // ファイル名フィルター
      if (
        fileNameFilter &&
        !image.name.toLowerCase().includes(fileNameFilter.toLowerCase())
      ) {
        return false;
      }

      // ファイル形式フィルター
      if (fileTypeFilter && fileTypeFilter !== "all") {
        const extension = image.name.toLowerCase().split(".").pop();
        if (!extension || extension.toUpperCase() !== fileTypeFilter) {
          return false;
        }
      }

      // フォルダフィルター
      if (folderFilter && folderFilter !== "all") {
        // twitterdashboard/フォルダ名/ の形式でフィルタリング
        const expectedPrefix = `twitterdashboard/${folderFilter}/`;
        if (!image.name.startsWith(expectedPrefix)) {
          return false;
        }
      }

      // 日付フィルター
      const imageDate = new Date(image.lastModified)
        .toISOString()
        .split("T")[0];
      if (startDate && imageDate < startDate) {
        return false;
      }
      if (endDate && imageDate > endDate) {
        return false;
      }

      return true;
    });
  }, [
    images,
    fileNameFilter,
    fileTypeFilter,
    folderFilter,
    startDate,
    endDate,
  ]);

  // フィルター結果を親に通知（useEffectで副作用として実行）
  useEffect(() => {
    onFilteredImages(filteredImages);
  }, [filteredImages, onFilteredImages]);

  const hasActiveFilters = useMemo(() => {
    return (
      fileNameFilter ||
      (fileTypeFilter && fileTypeFilter !== "all") ||
      (folderFilter && folderFilter !== "all") ||
      startDate ||
      endDate
    );
  }, [fileNameFilter, fileTypeFilter, folderFilter, startDate, endDate]);

  // クイック日付選択のオプション
  const quickDateOptions = useMemo(() => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    return [
      {
        label: "今日",
        start: formatDate(today),
        end: formatDate(today),
      },
      {
        label: "昨日",
        start: (() => {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return formatDate(yesterday);
        })(),
        end: (() => {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return formatDate(yesterday);
        })(),
      },
      {
        label: "過去3日間",
        start: (() => {
          const threeDaysAgo = new Date(today);
          threeDaysAgo.setDate(today.getDate() - 2);
          return formatDate(threeDaysAgo);
        })(),
        end: formatDate(today),
      },
      {
        label: "過去7日間",
        start: (() => {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 6);
          return formatDate(sevenDaysAgo);
        })(),
        end: formatDate(today),
      },
      {
        label: "過去30日間",
        start: (() => {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 29);
          return formatDate(thirtyDaysAgo);
        })(),
        end: formatDate(today),
      },
      {
        label: "今月",
        start: (() => {
          const thisMonthStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          return formatDate(thisMonthStart);
        })(),
        end: formatDate(today),
      },
    ];
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            画像検索フィルター
          </h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              クリア
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {filteredImages.length} / {images.length} 件
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* ファイル名検索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ファイル名
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={fileNameFilter}
              onChange={(e) => onFileNameFilterChange(e.target.value)}
              placeholder="ファイル名で検索..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ファイル形式フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ファイル形式
          </label>
          <select
            value={fileTypeFilter}
            onChange={(e) => onFileTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべての形式</option>
            {availableFileTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* フォルダフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            フォルダ
          </label>
          <div className="relative">
            <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={folderFilter}
              onChange={(e) => onFolderFilterChange(e.target.value)}
              disabled={loadingFolders}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">すべてのフォルダ</option>
              {loadingFolders ? (
                <option disabled>読み込み中...</option>
              ) : (
                folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 日付フィルター */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-4">
        {/* 開始日フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            開始日
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 終了日フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            終了日
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* クイック日付選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            クイック日付選択
          </label>
          <select
            onChange={(e) => {
              const selectedOption = quickDateOptions.find(opt => opt.label === e.target.value);
              if (selectedOption && onQuickDateSelect) {
                onQuickDateSelect(selectedOption.start, selectedOption.end);
              }
            }}
            defaultValue=""
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="" disabled>期間を選択...</option>
            {quickDateOptions.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {fileNameFilter && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                ファイル名: "{fileNameFilter}"
                <button
                  onClick={() => onFileNameFilterChange("")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {fileTypeFilter && fileTypeFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                形式: {fileTypeFilter}
                <button
                  onClick={() => onFileTypeFilterChange("all")}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {folderFilter && folderFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                フォルダ: {folderFilter}
                <button
                  onClick={() => onFolderFilterChange("all")}
                  className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-md">
                開始: {new Date(startDate).toLocaleDateString("ja-JP")}
                <button
                  onClick={() => onStartDateChange("")}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-md">
                終了: {new Date(endDate).toLocaleDateString("ja-JP")}
                <button
                  onClick={() => onEndDateChange("")}
                  className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageSearchFilter;
