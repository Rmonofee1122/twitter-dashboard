import BarChart from '@/components/charts/bar-chart';

interface GrowthChartProps {
  data: Array<{ month: string; count: number; growth: number; }>;
  selectedPeriod: string;
}

export default function GrowthChart({ data, selectedPeriod }: GrowthChartProps) {
  if (selectedPeriod !== 'monthly') {
    return null;
  }

  const tooltipFormatter = (value: any) => [`${value}%`, '成長率'] as [string, string];
  const labelFormatter = (label: any) => `月: ${label}`;

  // 成長率に応じて色を動的に設定
  const dataWithColors = data.map(item => ({
    ...item,
    fillColor: item.growth >= 0 ? '#10B981' : '#EF4444'
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <BarChart
        data={dataWithColors}
        xAxisKey="month"
        yAxisKey="growth"
        color="#10B981"
        height={300}
        title="月次成長率分析"
        tooltipFormatter={tooltipFormatter}
        labelFormatter={labelFormatter}
      />
    </div>
  );
}