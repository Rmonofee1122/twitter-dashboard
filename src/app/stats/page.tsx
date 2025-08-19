'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Calendar, Users, TrendingUp, Activity } from 'lucide-react';

interface StatsData {
  dailyCreations: Array<{ date: string; count: number; }>;
  weeklyCreations: Array<{ week: string; count: number; }>;
  monthlyCreations: Array<{ month: string; count: number; }>;
  statusDistribution: Array<{ name: string; value: number; color: string; }>;
  ipDistribution: Array<{ ip: string; count: number; }>;
  totalStats: {
    totalAccounts: number;
    activeAccounts: number;
    todayCreated: number;
    weekCreated: number;
    monthCreated: number;
  };
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData>({
    dailyCreations: [],
    weeklyCreations: [],
    monthlyCreations: [],
    statusDistribution: [],
    ipDistribution: [],
    totalStats: {
      totalAccounts: 0,
      activeAccounts: 0,
      todayCreated: 0,
      weekCreated: 0,
      monthCreated: 0,
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    // TODO: Supabaseからデータを取得
    // 仮のデータを設定
    setStatsData({
      dailyCreations: [
        { date: '2025-01-13', count: 8 },
        { date: '2025-01-14', count: 12 },
        { date: '2025-01-15', count: 15 },
        { date: '2025-01-16', count: 23 },
        { date: '2025-01-17', count: 18 },
        { date: '2025-01-18', count: 27 },
        { date: '2025-01-19', count: 12 },
      ],
      weeklyCreations: [
        { week: '2025-W1', count: 145 },
        { week: '2025-W2', count: 178 },
        { week: '2025-W3', count: 234 },
        { week: '2025-W4', count: 189 },
      ],
      monthlyCreations: [
        { month: '2024-10', count: 567 },
        { month: '2024-11', count: 623 },
        { month: '2024-12', count: 789 },
        { month: '2025-01', count: 347 },
      ],
      statusDistribution: [
        { name: 'アクティブ', value: 2341, color: '#10B981' },
        { name: '非アクティブ', value: 156, color: '#F59E0B' },
        { name: '停止中', value: 50, color: '#EF4444' },
      ],
      ipDistribution: [
        { ip: '192.168.1.100', count: 234 },
        { ip: '192.168.1.101', count: 189 },
        { ip: '192.168.1.102', count: 167 },
        { ip: '192.168.1.103', count: 145 },
        { ip: '192.168.1.104', count: 123 },
      ],
      totalStats: {
        totalAccounts: 2547,
        activeAccounts: 2341,
        todayCreated: 12,
        weekCreated: 89,
        monthCreated: 347,
      }
    });
  }, []);

  const getChartData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return statsData.weeklyCreations;
      case 'monthly':
        return statsData.monthlyCreations;
      default:
        return statsData.dailyCreations;
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
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">統計情報</h1>
        <p className="text-gray-600">
          Twitterアカウントの作成状況と詳細な統計データ
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">総アカウント数</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsData.totalStats.totalAccounts.toLocaleString()}
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
                {statsData.totalStats.activeAccounts.toLocaleString()}
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
                {statsData.totalStats.todayCreated.toLocaleString()}
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
                {statsData.totalStats.monthCreated.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* アカウント作成推移 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              アカウント作成推移
            </h3>
            <div className="flex space-x-2">
              {['daily', 'weekly', 'monthly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
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

        {/* アカウント状態分布 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            アカウント状態分布
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statsData.statusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statsData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {statsData.statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IP別作成数 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          IP別アカウント作成数 (上位5位)
        </h3>
        <div className="space-y-4">
          {statsData.ipDistribution.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900 mr-4">
                  #{index + 1}
                </span>
                <span className="text-gray-700 font-mono">{item.ip}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(item.count / Math.max(...statsData.ipDistribution.map(d => d.count))) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900 w-16 text-right">
                  {item.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* パフォーマンス指標 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          パフォーマンス指標
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {((statsData.totalStats.activeAccounts / statsData.totalStats.totalAccounts) * 100).toFixed(1)}%
            </div>
            <div className="text-gray-600">アクティブ率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {(statsData.totalStats.weekCreated / 7).toFixed(1)}
            </div>
            <div className="text-gray-600">日平均作成数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {statsData.totalStats.monthCreated}
            </div>
            <div className="text-gray-600">月間作成数</div>
          </div>
        </div>
      </div>
    </div>
  );
}