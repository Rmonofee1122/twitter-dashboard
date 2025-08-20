import { Clock, TrendingUp, Users } from 'lucide-react';
import { memo, useMemo } from 'react';

interface TrendInsightsProps {
  insights: {
    peakHour: string;
    growthTrend: string;
    averageEfficiency: number;
  };
}

const TrendInsights = memo(function TrendInsights({ insights }: TrendInsightsProps) {
  const insightCards = useMemo(() => [
    {
      icon: Clock,
      title: 'ピーク時間',
      description: `最も活発な作成時間は${insights.peakHour}です`,
      color: 'blue',
      value: insights.peakHour
    },
    {
      icon: TrendingUp,
      title: '成長傾向',
      description: insights.growthTrend,
      color: 'green',
      value: '安定成長'
    },
    {
      icon: Users,
      title: '1日平均作成数',
      description: `直近7日間の平均値`,
      color: 'purple',
      value: `${insights.averageEfficiency}件`
    }
  ], [insights]);

  const getColorClasses = useMemo(() => {
    return (color: string) => {
      switch (color) {
        case 'blue':
          return {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            title: 'text-blue-900',
            text: 'text-blue-700',
            value: 'text-blue-800'
          };
        case 'green':
          return {
            bg: 'bg-green-50',
            icon: 'text-green-600',
            title: 'text-green-900',
            text: 'text-green-700',
            value: 'text-green-800'
          };
        case 'purple':
          return {
            bg: 'bg-purple-50',
            icon: 'text-purple-600',
            title: 'text-purple-900',
            text: 'text-purple-700',
            value: 'text-purple-800'
          };
        default:
          return {
            bg: 'bg-gray-50',
            icon: 'text-gray-600',
            title: 'text-gray-900',
            text: 'text-gray-700',
            value: 'text-gray-800'
          };
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        トレンドインサイト
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightCards.map((card, index) => {
          const colors = getColorClasses(card.color);
          return (
            <div key={index} className={`p-4 ${colors.bg} rounded-lg border border-gray-200`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <card.icon className={`h-5 w-5 ${colors.icon} mr-2`} />
                  <span className={`font-medium ${colors.title} text-sm`}>{card.title}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className={`text-2xl font-bold ${colors.value}`}>
                  {card.value}
                </div>
              </div>
              <p className={`text-xs ${colors.text} leading-relaxed`}>
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default TrendInsights;