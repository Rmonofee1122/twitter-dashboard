import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartData } from '@/lib/stats-api';

interface CreationTrendsChartProps {
  chartData: ChartData;
  selectedPeriod: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export default function CreationTrendsChart({ 
  chartData, 
  selectedPeriod, 
  onPeriodChange 
}: CreationTrendsChartProps) {
  const getChartData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return chartData.weeklyCreations;
      case 'monthly':
        return chartData.monthlyCreations;
      default:
        return chartData.dailyCreations;
    }
  };

  const getXAxisKey = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      default:
        return 'date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          アカウント作成推移
        </h3>
        <div className="flex space-x-2">
          {['daily', 'weekly', 'monthly'].map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period === 'daily' ? '日別' : period === 'weekly' ? '週別' : '月別'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={getChartData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={getXAxisKey()} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}