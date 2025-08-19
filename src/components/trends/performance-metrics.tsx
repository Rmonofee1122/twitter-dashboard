interface PerformanceMetricsProps {
  metrics: {
    activeRate: number;
    dailyAverage: number;
    monthlyTotal: number;
  };
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const performanceItems = [
    {
      value: `${metrics.activeRate.toFixed(1)}%`,
      label: 'アクティブ率',
      color: 'text-blue-600'
    },
    {
      value: metrics.dailyAverage.toFixed(1),
      label: '日平均作成数',
      color: 'text-green-600'
    },
    {
      value: metrics.monthlyTotal.toString(),
      label: '月間作成数',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        パフォーマンス指標
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {performanceItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`text-3xl font-bold ${item.color} mb-2`}>
              {item.value}
            </div>
            <div className="text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}