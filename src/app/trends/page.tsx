'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

interface TrendData {
  daily: Array<{ date: string; count: number; cumulative: number; }>;
  weekly: Array<{ week: string; count: number; average: number; }>;
  monthly: Array<{ month: string; count: number; growth: number; }>;
  hourly: Array<{ hour: string; count: number; }>;
}

export default function TrendsPage() {
  const [trendData, setTrendData] = useState<TrendData>({
    daily: [],
    weekly: [],
    monthly: [],
    hourly: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

  useEffect(() => {
    // TODO: Supabaseからデータを取得
    // 仮のデータを設定
    const generateDailyData = () => {
      const data = [];
      let cumulative = 2200;
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const count = Math.floor(Math.random() * 30) + 5;
        cumulative += count;
        data.push({
          date: date.toISOString().split('T')[0],
          count,
          cumulative
        });
      }
      return data;
    };

    const generateWeeklyData = () => {
      const data = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        const count = Math.floor(Math.random() * 150) + 80;
        data.push({
          week: `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`,
          count,
          average: Math.floor(count / 7)
        });
      }
      return data;
    };

    const generateMonthlyData = () => {
      const data = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const count = Math.floor(Math.random() * 600) + 300;
        const prevCount = i === 11 ? count : Math.floor(Math.random() * 600) + 300;
        const growth = ((count - prevCount) / prevCount) * 100;
        data.push({
          month: date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }),
          count,
          growth: Number(growth.toFixed(1))
        });
      }
      return data;
    };

    const generateHourlyData = () => {
      const data = [];
      for (let i = 0; i < 24; i++) {
        data.push({
          hour: `${i.toString().padStart(2, '0')}:00`,
          count: Math.floor(Math.random() * 20) + 1
        });
      }
      return data;
    };

    setTrendData({
      daily: generateDailyData(),
      weekly: generateWeeklyData(),
      monthly: generateMonthlyData(),
      hourly: generateHourlyData()
    });
  }, []);

  const getChartData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return trendData.weekly;
      case 'monthly':
        return trendData.monthly;
      default:
        return trendData.daily;
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

  const getCurrentStats = () => {
    const dailyData = trendData.daily;
    if (dailyData.length === 0) return { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0 };

    const today = dailyData[dailyData.length - 1]?.count || 0;
    const yesterday = dailyData[dailyData.length - 2]?.count || 0;
    
    const thisWeek = dailyData.slice(-7).reduce((sum, item) => sum + item.count, 0);
    const lastWeek = dailyData.slice(-14, -7).reduce((sum, item) => sum + item.count, 0);

    return { today, yesterday, thisWeek, lastWeek };
  };

  const stats = getCurrentStats();

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">アカウント作成推移</h1>
        <p className="text-gray-600">
          時系列でのTwitterアカウント作成数の推移とトレンド分析
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">今日の作成数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.today > stats.yesterday ? '+' : ''}{stats.today - stats.yesterday} (前日比)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">今週の作成数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.thisWeek > stats.lastWeek ? '+' : ''}{stats.thisWeek - stats.lastWeek} (前週比)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">日平均作成数</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(stats.thisWeek / 7)}
              </p>
              <div className="text-sm text-gray-500 mt-1">
                (今週平均)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">累計アカウント数</p>
              <p className="text-3xl font-bold text-gray-900">
                {trendData.daily.length > 0 
                  ? trendData.daily[trendData.daily.length - 1].cumulative.toLocaleString()
                  : '0'
                }
              </p>
              <div className="text-sm text-gray-500 mt-1">
                全期間累計
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* メイン推移チャート */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            アカウント作成推移
          </h3>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
            {/* 期間選択 */}
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
            {/* 範囲選択 */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">7日間</option>
              <option value="30days">30日間</option>
              <option value="90days">90日間</option>
              <option value="1year">1年間</option>
            </select>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={getChartData()}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisKey()} />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `${getXAxisKey() === 'date' ? '日付' : getXAxisKey() === 'week' ? '週' : '月'}: ${label}`}
              formatter={(value, name) => [
                `${value}件`, 
                name === 'count' ? '作成数' : name === 'average' ? '平均' : '成長率'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 累計推移 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            累計アカウント数推移
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `日付: ${label}`}
                formatter={(value) => [`${value}件`, '累計アカウント数']}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 時間別分布 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            時間別作成数分布 (24時間)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData.hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `時間: ${label}`}
                formatter={(value) => [`${value}件`, '作成数']}
              />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 成長率分析 */}
      {selectedPeriod === 'monthly' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            月次成長率分析
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `月: ${label}`}
                formatter={(value) => [`${value}%`, '成長率']}
              />
              <Bar 
                dataKey="growth" 
                fill={(entry: any) => entry?.growth >= 0 ? '#10B981' : '#EF4444'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* インサイト */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          トレンドインサイト
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">ピーク時間</span>
            </div>
            <p className="text-sm text-blue-700">
              最も活発な作成時間は14:00-16:00です
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">成長傾向</span>
            </div>
            <p className="text-sm text-green-700">
              過去30日間で安定した成長を維持
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900">平均効率</span>
            </div>
            <p className="text-sm text-purple-700">
              1日平均{Math.round(stats.thisWeek / 7)}件のアカウント作成
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}