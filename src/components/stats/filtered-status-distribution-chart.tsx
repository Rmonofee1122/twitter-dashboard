import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface FilteredStatusDistributionChartProps {
  statusDistribution: StatusDistribution[];
  isLoading?: boolean;
}

export default function FilteredStatusDistributionChart({
  statusDistribution,
  isLoading = false,
}: FilteredStatusDistributionChartProps) {
  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = statusDistribution.reduce(
        (sum, item) => sum + item.value,
        0
      );
      const percentage =
        total > 0 ? ((data.value / total) * 100).toFixed(1) : "0.0";

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()}件 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // カスタムラベル
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // 5%未満は表示しない

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const total = statusDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          アカウント状態分布
          {isLoading && (
            <span className="ml-2 text-sm text-gray-500">
              データ読み込み中...
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-600">
          合計: {total.toLocaleString()}件
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : total > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 詳細統計 */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {statusDistribution.map((item, index) => {
              const percentage =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    borderColor: item.color + "40",
                    backgroundColor: item.color + "10",
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">データがありません</p>
            <p className="text-sm">
              選択した期間にはアカウントデータが存在しません
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
