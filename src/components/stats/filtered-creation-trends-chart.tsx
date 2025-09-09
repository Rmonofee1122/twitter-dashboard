import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartData } from "@/app/api/stats/route";

interface FilteredCreationTrendsChartProps {
  chartData: ChartData;
  selectedPeriod: "daily" | "weekly" | "monthly";
  onPeriodChange: (period: "daily" | "weekly" | "monthly") => void;
  isLoading?: boolean;
}

export default function FilteredCreationTrendsChart({
  chartData,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}: FilteredCreationTrendsChartProps) {
  const getChartData = () => {
    switch (selectedPeriod) {
      case "weekly":
        return chartData.weeklyCreations;
      case "monthly":
        return chartData.monthlyCreations;
      default:
        return chartData.dailyCreations;
    }
  };

  const getXAxisKey = () => {
    switch (selectedPeriod) {
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return "date";
    }
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}件
            </p>
          ))}
          <hr className="my-1" />
          <p className="text-sm font-medium text-gray-900">
            合計: {total.toLocaleString()}件
          </p>
        </div>
      );
    }
    return null;
  };

  // データの最大値を計算してY軸の上限を設定
  const getMaxValue = () => {
    const data = getChartData();
    return Math.max(
      ...data.map(item => 
        (item.active_count || 0) + 
        (item.suspended_count || 0) + 
        (item.temp_locked_count || 0) + 
        (item.other_count || 0)
      )
    );
  };

  const maxValue = getMaxValue();
  const yAxisDomain = maxValue > 0 ? [0, Math.ceil(maxValue * 1.1)] : [0, 100];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          アカウント作成推移（ステータス別）
          {isLoading && (
            <span className="ml-2 text-sm text-gray-500">データ読み込み中...</span>
          )}
        </h3>
        <div className="flex space-x-2">
          {["daily", "weekly", "monthly"].map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period as any)}
              disabled={isLoading}
              className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                selectedPeriod === period
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {period === "daily"
                ? "日別"
                : period === "weekly"
                ? "週別"
                : "月別"}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={getChartData()} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={getXAxisKey()}
              tick={{ fontSize: 12 }}
              angle={selectedPeriod === "daily" ? -45 : 0}
              textAnchor={selectedPeriod === "daily" ? "end" : "middle"}
              height={selectedPeriod === "daily" ? 80 : 60}
            />
            <YAxis 
              domain={yAxisDomain}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="active_count" 
              stackId="status" 
              name="アクティブ" 
              fill="#10B981" 
            />
            <Bar 
              dataKey="suspended_count" 
              stackId="status" 
              name="凍結" 
              fill="#EF4444" 
            />
            <Bar 
              dataKey="temp_locked_count" 
              stackId="status" 
              name="一時制限" 
              fill="#F59E0B" 
            />
            <Bar 
              dataKey="other_count" 
              stackId="status" 
              name="その他" 
              fill="#6B7280" 
            />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {/* 統計サマリー */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {(() => {
          const data = getChartData();
          const totals = data.reduce((acc, item) => ({
            active: acc.active + (item.active_count || 0),
            suspended: acc.suspended + (item.suspended_count || 0),
            tempLocked: acc.tempLocked + (item.temp_locked_count || 0),
            other: acc.other + (item.other_count || 0),
          }), { active: 0, suspended: 0, tempLocked: 0, other: 0 });

          return (
            <>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600 font-medium">アクティブ</p>
                <p className="text-xl font-bold text-green-700">
                  {totals.active.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600 font-medium">凍結</p>
                <p className="text-xl font-bold text-red-700">
                  {totals.suspended.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">一時制限</p>
                <p className="text-xl font-bold text-yellow-700">
                  {totals.tempLocked.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">その他</p>
                <p className="text-xl font-bold text-gray-700">
                  {totals.other.toLocaleString()}
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}