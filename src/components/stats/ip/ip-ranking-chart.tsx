import type { IpData } from "@/app/api/stats/route";
import Pagination from "@/components/ui/pagination";

interface IpRankingChartProps {
  ipData: IpData[];
  loading: boolean;
  onRefresh: () => void;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  totalAccounts: number;
}

export default function IpRankingChart({
  ipData,
  loading,
  onRefresh,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  totalAccounts,
}: IpRankingChartProps) {
  const maxCount = totalAccounts || 1;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          IP別作成数ランキング
        </h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          更新
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-4 bg-gray-300 rounded"></div>
                  <div className="w-40 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ipData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          IPデータがありません
        </div>
      ) : (
        <div className="space-y-4">
          {ipData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900 mr-4 w-8">
                  #{(currentPage - 1) * itemsPerPage + index + 1}
                </span>
                <div>
                  <span className="text-gray-700 font-mono text-base">
                    {item.ip}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    全体の{" "}
                    {(
                      (item.count / totalAccounts) * 100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900 w-20 text-right text-lg">
                  {item.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {!loading && totalCount > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={onPageChange}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
