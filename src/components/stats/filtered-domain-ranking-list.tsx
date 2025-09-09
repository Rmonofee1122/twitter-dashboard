import { useState, useMemo } from "react";
import type { FilteredDomainData } from "@/app/api/stats/route";

// ツールチップコンポーネント
// カスタムツールチップ
const ProgressBarTooltip = ({ 
  item, 
  isVisible 
}: { 
  item: FilteredDomainData; 
  isVisible: boolean; 
}) => {
  if (!isVisible) return null;
  
  const otherCount = item.total_count - item.active_count - item.suspended_count - item.temp_locked_count;
  
  return (
    <div className="absolute z-30 bg-white p-3 border border-gray-200 rounded-lg shadow-lg -top-28 -left-20 min-w-max">
      <p className="font-medium text-gray-900 mb-2">{item.domain}</p>
      <p className="text-sm" style={{ color: "#10B981" }}>
        アクティブ: {item.active_count.toLocaleString()}件
      </p>
      <p className="text-sm" style={{ color: "#EF4444" }}>
        凍結: {item.suspended_count.toLocaleString()}件
      </p>
      <p className="text-sm" style={{ color: "#F59E0B" }}>
        一時制限: {item.temp_locked_count.toLocaleString()}件
      </p>
      <p className="text-sm" style={{ color: "#6B7280" }}>
        その他: {otherCount.toLocaleString()}件
      </p>
      <hr className="my-1" />
      <p className="text-sm font-medium text-gray-900">
        合計: {item.total_count.toLocaleString()}件
      </p>
    </div>
  );
};

interface FilteredDomainRankingListProps {
  domainData: FilteredDomainData[];
  itemsPerPage?: number;
  isLoading?: boolean;
}

export default function FilteredDomainRankingList({
  domainData,
  itemsPerPage = 10,
  isLoading = false,
}: FilteredDomainRankingListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ページネーション計算
  const { paginatedData, totalPages, startIndex, endIndex } = useMemo(() => {
    const totalItems = domainData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = domainData.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [domainData, currentPage, itemsPerPage]);

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
  }, [domainData.length, totalPages, currentPage]);

  // ページ表示ロジック
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage <= 4) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          if (i > 1) {
            pages.push(i);
          }
        }
      } else {
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

  const maxCount = Math.max(...domainData.map((d) => d.total_count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ドメイン別作成数（期間フィルター適用）
            {isLoading && (
              <span className="ml-2 text-sm text-gray-500">データ読み込み中...</span>
            )}
          </h3>
          {domainData.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {startIndex + 1} - {endIndex} / {domainData.length}件
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

      {/* プログレスバーの凡例 */}
      {domainData.length > 0 && !isLoading && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">ステータス割合の凡例</h4>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-700">アクティブ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-700">凍結</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-700">一時制限</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-gray-500 rounded"></div>
              <span className="text-gray-700">その他</span>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4 relative">
          {paginatedData.map((item, index) => (
            <div
              key={`${item.domain}-${index}`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900 mr-4">
                  #{startIndex + index + 1}
                </span>
                <span className="text-gray-700 font-mono text-sm md:text-base">
                  {item.domain}
                </span>
              </div>
              <div className="flex items-center space-x-3 relative">
                <div 
                  className="w-32 bg-gray-200 rounded-full h-3 relative overflow-hidden cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(startIndex + index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* アクティブの割合 */}
                  <div
                    className="bg-green-500 h-3 absolute left-0 top-0 transition-all duration-200 hover:brightness-110"
                    style={{
                      width: `${item.total_count > 0 ? (item.active_count / item.total_count) * 100 : 0}%`,
                    }}
                  ></div>
                  {/* 凍結の割合 */}
                  <div
                    className="bg-red-500 h-3 absolute top-0 transition-all duration-200 hover:brightness-110"
                    style={{
                      left: `${item.total_count > 0 ? (item.active_count / item.total_count) * 100 : 0}%`,
                      width: `${item.total_count > 0 ? (item.suspended_count / item.total_count) * 100 : 0}%`,
                    }}
                  ></div>
                  {/* 一時制限の割合 */}
                  <div
                    className="bg-yellow-500 h-3 absolute top-0 transition-all duration-200 hover:brightness-110"
                    style={{
                      left: `${item.total_count > 0 ? ((item.active_count + item.suspended_count) / item.total_count) * 100 : 0}%`,
                      width: `${item.total_count > 0 ? (item.temp_locked_count / item.total_count) * 100 : 0}%`,
                    }}
                  ></div>
                  {/* その他の割合 */}
                  <div
                    className="bg-gray-500 h-3 absolute top-0 transition-all duration-200 hover:brightness-110"
                    style={{
                      left: `${item.total_count > 0 ? ((item.active_count + item.suspended_count + item.temp_locked_count) / item.total_count) * 100 : 0}%`,
                      width: `${item.total_count > 0 ? ((item.total_count - item.active_count - item.suspended_count - item.temp_locked_count) / item.total_count) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                
                {/* ツールチップ */}
                {hoveredIndex === startIndex + index && (
                  <ProgressBarTooltip 
                    item={item} 
                    isVisible={true} 
                  />
                )}
                <span className="font-semibold text-gray-900 w-16 text-right">
                  {item.total_count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {domainData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              選択した期間にはドメインデータがありません
            </div>
          )}
        </div>
      )}

      <div>
        
      </div>

      {/* ページネーション */}
      {totalPages > 1 && !isLoading && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-6">
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
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
                  <span className="font-medium">{startIndex + 1}</span>
                  -
                  <span className="font-medium">{endIndex}</span>
                  件目 / 全
                  <span className="font-medium">{domainData.length}</span>
                  件
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
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  
                  {/* ページ番号 */}
                  {getVisiblePages().map((pageNum, index) => (
                    pageNum === '...' ? (
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
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                  
                  {/* 次へボタン */}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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