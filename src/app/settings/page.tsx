'use client';

import { useState } from 'react';
import { 
  Save, 
  Database, 
  Bell, 
  Shield, 
  Globe, 
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Settings {
  database: {
    supabaseUrl: string;
    supabaseKey: string;
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
  notifications: {
    emailAlerts: boolean;
    emailAddress: string;
    alertThreshold: number;
    dailyReports: boolean;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLog: boolean;
  };
  display: {
    language: 'ja' | 'en';
    timezone: string;
    dateFormat: 'japanese' | 'iso' | 'us';
    itemsPerPage: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    database: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      autoBackup: true,
      backupFrequency: 'daily'
    },
    notifications: {
      emailAlerts: true,
      emailAddress: 'admin@example.com',
      alertThreshold: 100,
      dailyReports: true
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 60,
      ipWhitelist: ['192.168.1.0/24'],
      auditLog: true
    },
    display: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      dateFormat: 'japanese',
      itemsPerPage: 20
    }
  });

  const [activeTab, setActiveTab] = useState<'database' | 'notifications' | 'security' | 'display'>('database');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    // TODO: 設定をバックエンドに保存
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleTestConnection = async () => {
    // TODO: Supabase接続テスト
    alert('接続テストを実行します');
  };

  const handleClearCache = () => {
    // TODO: キャッシュクリア
    alert('キャッシュをクリアしました');
  };

  const tabs = [
    { id: 'database', name: 'データベース', icon: Database },
    { id: 'notifications', name: '通知設定', icon: Bell },
    { id: 'security', name: 'セキュリティ', icon: Shield },
    { id: 'display', name: '表示設定', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
            <p className="text-gray-600">
              システムの動作を調整し、環境を設定します
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '保存完了' : '設定を保存'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* タブナビゲーション */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 設定パネル */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">データベース設定</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase URL
                </label>
                <input
                  type="text"
                  value={settings.database.supabaseUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    database: { ...settings.database, supabaseUrl: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={settings.database.supabaseKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    database: { ...settings.database, supabaseKey: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-anon-key"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">自動バックアップ</p>
                  <p className="text-sm text-gray-600">定期的にデータをバックアップします</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.database.autoBackup}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, autoBackup: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.database.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    バックアップ頻度
                  </label>
                  <select
                    value={settings.database.backupFrequency}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, backupFrequency: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleTestConnection}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Database className="h-4 w-4 mr-2" />
                  接続テスト
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  キャッシュクリア
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">メールアラート</p>
                  <p className="text-sm text-gray-600">重要なイベント時にメールで通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.notifications.emailAlerts && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      通知メールアドレス
                    </label>
                    <input
                      type="email"
                      value={settings.notifications.emailAddress}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailAddress: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アラート閾値 (1日のアカウント作成数)
                    </label>
                    <input
                      type="number"
                      value={settings.notifications.alertThreshold}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, alertThreshold: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      この数値を超えた場合にアラートメールを送信
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">日次レポート</p>
                  <p className="text-sm text-gray-600">毎日の活動サマリーをメール送信</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyReports}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, dailyReports: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">セキュリティ設定</h2>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">二要素認証</p>
                  <p className="text-sm text-gray-600">追加のセキュリティレイヤーを有効化</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, enableTwoFactor: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セッションタイムアウト (分)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeout: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IPホワイトリスト
                </label>
                <div className="space-y-2">
                  {settings.security.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => {
                          const newList = [...settings.security.ipWhitelist];
                          newList[index] = e.target.value;
                          setSettings({
                            ...settings,
                            security: { ...settings.security, ipWhitelist: newList }
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="192.168.1.0/24"
                      />
                      <button
                        onClick={() => {
                          const newList = settings.security.ipWhitelist.filter((_, i) => i !== index);
                          setSettings({
                            ...settings,
                            security: { ...settings.security, ipWhitelist: newList }
                          });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      security: { 
                        ...settings.security, 
                        ipWhitelist: [...settings.security.ipWhitelist, ''] 
                      }
                    })}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + IPアドレスを追加
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-yellow-900">監査ログ</p>
                    <p className="text-sm text-yellow-700">すべての操作を記録</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.auditLog}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, auditLog: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">表示設定</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言語
                </label>
                <select
                  value={settings.display.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, language: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイムゾーン
                </label>
                <select
                  value={settings.display.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, timezone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付形式
                </label>
                <select
                  value={settings.display.dateFormat}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, dateFormat: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="japanese">日本形式 (2025/01/19)</option>
                  <option value="iso">ISO形式 (2025-01-19)</option>
                  <option value="us">US形式 (01/19/2025)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1ページあたりの表示件数
                </label>
                <select
                  value={settings.display.itemsPerPage}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, itemsPerPage: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}