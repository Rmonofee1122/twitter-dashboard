import { Calendar, Users, TrendingUp, Activity } from 'lucide-react';
import type { TotalStats } from '@/lib/stats-api';

interface SummaryCardsProps {
  totalStats: TotalStats;
}

export default function SummaryCards({ totalStats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">総アカウント数</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalStats.totalAccounts.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">アクティブアカウント</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalStats.activeAccounts.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">今日の作成数</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalStats.todayCreated.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">今月の作成数</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalStats.monthCreated.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
}