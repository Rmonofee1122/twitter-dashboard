"use client";

import { Network, Activity, Clock } from "lucide-react";
import type { ProxyInfo } from "@/app/api/dc-proxy/route";

interface ProxyStatsCardsProps {
  proxies: ProxyInfo[];
  totalProxies: number;
}

export default function ProxyStatsCards({ proxies, totalProxies }: ProxyStatsCardsProps) {
  // 統計データの計算
  const stats = {
    totalProxies: totalProxies,
    averageUsage: proxies.length > 0 
      ? Math.round(proxies.reduce((sum, proxy) => sum + proxy.used_count, 0) / proxies.length)
      : 0,
    recentlyUsed: proxies.filter(proxy => {
      if (!proxy.last_used_at) return false;
      const lastUsed = new Date(proxy.last_used_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastUsed > oneDayAgo;
    }).length,
    neverUsed: proxies.filter(proxy => !proxy.last_used_at || proxy.used_count === 0).length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Network className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">総プロキシ数</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalProxies.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">平均使用回数</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.averageUsage.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">24時間以内</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recentlyUsed.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Clock className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">未使用</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.neverUsed.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}