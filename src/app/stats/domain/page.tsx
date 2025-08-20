'use client';

import { useEffect, useState } from 'react';
import { fetchDomainRanking, type DomainData } from '@/lib/stats-api';

export default function DomainStatsPage() {
  const [domainData, setDomainData] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomainData();
  }, []);

  const loadDomainData = async () => {
    try {
      setLoading(true);
      const data = await fetchDomainRanking();
      setDomainData(data);
    } catch (error) {
      console.error('Failed to fetch domain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...domainData.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ドメイン別統計</h1>
        <p className="text-gray-600">
          メールドメインごとのアカウント作成数の詳細統計
        </p>
      </div>

      {/* ドメイン別統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            ドメイン別作成数ランキング
          </h3>
          <button
            onClick={loadDomainData}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            更新
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-4 bg-gray-300 rounded"></div>
                    <div className="w-32 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : domainData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            ドメインデータがありません
          </div>
        ) : (
          <div className="space-y-4">
            {domainData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900 mr-4 w-8">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="text-gray-700 font-mono text-base">{item.domain}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      全体の {((item.count / domainData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 w-20 text-right text-lg">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 統計サマリー */}
        {!loading && domainData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {domainData.length}
              </div>
              <div className="text-gray-600">登録ドメイン数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {domainData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </div>
              <div className="text-gray-600">総アカウント数</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {domainData[0]?.domain || '-'}
              </div>
              <div className="text-gray-600">最多ドメイン</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}