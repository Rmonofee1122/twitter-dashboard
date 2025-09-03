import { useState, useMemo } from "react";
import type { IpData } from "@/app/api/stats/route";

interface IpRankingListProps {
  ipDistribution: IpData[];
  itemsPerPage?: number;
}

export default function IpRankingList({
  ipDistribution,
  itemsPerPage = 10,
}: IpRankingListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // ページネーション計算
  const { paginatedData, totalPages, startIndex, endIndex } = useMemo(() => {
    const totalItems = ipDistribution.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = ipDistribution.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [ipDistribution, currentPage, itemsPerPage]);

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 最初のページに戻す（データが変更された時）
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [ipDistribution.length, totalPages, currentPage]);

  // 既存のPaginationコンポーネントと同じページ表示ロジック
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // 総ページ数が7以下の場合は全て表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページは常に表示
      pages.push(1);

      if (currentPage <= 4) {
        // 現在ページが前半の場合
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 現在ページが後半の場合
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          if (i > 1) {
            pages.push(i);
          }
        }
      } else {
        // 現在ページが中央の場合
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const maxCount = Math.max(...ipDistribution.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            IP別アカウント作成数
          </h3>
          {ipDistribution.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {startIndex + 1} - {endIndex} / {ipDistribution.length}件
            </p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentPage} / {totalPages}ページ
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900 mr-4">
                #{startIndex + index + 1}
              </span>
              <span className="text-gray-700 font-mono">{item.ip}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="font-semibold text-gray-900 w-16 text-right">
                {item.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {ipDistribution.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            IPデータがありません
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            {/* モバイル用ナビゲーション */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>

            {/* デスクトップ用ナビゲーション */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>-
                  <span className="font-medium">{endIndex}</span>
                  件目 / 全
                  <span className="font-medium">{ipDistribution.length}</span>件
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {/* 最初ボタン */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    最初
                  </button>

                  {/* 前へボタン */}
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>

                  {/* ページ番号 */}
                  {getVisiblePages().map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum as number)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  {/* 次へボタン */}
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>

                  {/* 最後ボタン */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    最後
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
