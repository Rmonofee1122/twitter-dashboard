import type { TotalStats } from "@/lib/stats-api";

interface PerformanceMetricsProps {
  totalStats: TotalStats;
}

export default function PerformanceMetrics({
  totalStats,
}: PerformanceMetricsProps) {
  const activeRate =
    totalStats.totalAccounts > 0
      ? ((totalStats.activeAccounts / totalStats.totalAccounts) * 100).toFixed(
          1
        )
      : "0.0";

  const dailyAverage = (totalStats.weekCreated / 7).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        パフォーマンス指標
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {activeRate}%
          </div>
          <div className="text-gray-600">アクティブ率</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {dailyAverage}
          </div>
          <div className="text-gray-600">今月の日平均作成数</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {totalStats.monthCreated}
          </div>
          <div className="text-gray-600">月間作成数</div>
        </div>
      </div>
    </div>
  );
}
