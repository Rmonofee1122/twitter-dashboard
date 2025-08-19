'use client';

import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左側: タイトル */}
        <div className="ml-16 lg:ml-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Twitterアカウント管理
          </h1>
          <p className="text-sm text-gray-600">
            アカウントの作成状況と統計を管理
          </p>
        </div>

        {/* 右側: アクション */}
        <div className="flex items-center space-x-4">
          {/* 検索 */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="アカウントを検索..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 通知 */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* ユーザーメニュー */}
          <button className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium">管理者</span>
          </button>
        </div>
      </div>
    </header>
  );
}