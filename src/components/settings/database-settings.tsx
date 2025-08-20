import { Database, RefreshCw } from 'lucide-react';
import ToggleSwitch from '@/components/ui/toggle-switch';

interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

interface DatabaseSettingsProps {
  config: DatabaseConfig;
  onChange: (config: DatabaseConfig) => void;
  onTestConnection: () => void;
  onClearCache: () => void;
}

export default function DatabaseSettings({ 
  config, 
  onChange, 
  onTestConnection, 
  onClearCache 
}: DatabaseSettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">データベース設定</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supabase URL
        </label>
        <input
          type="text"
          value={config.supabaseUrl}
          onChange={(e) => onChange({
            ...config,
            supabaseUrl: e.target.value
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
          value={config.supabaseKey}
          onChange={(e) => onChange({
            ...config,
            supabaseKey: e.target.value
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
        <ToggleSwitch
          checked={config.autoBackup}
          onChange={(checked) => onChange({
            ...config,
            autoBackup: checked
          })}
        />
      </div>

      {config.autoBackup && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            バックアップ頻度
          </label>
          <select
            value={config.backupFrequency}
            onChange={(e) => onChange({
              ...config,
              backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'
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
          onClick={onTestConnection}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Database className="h-4 w-4 mr-2" />
          接続テスト
        </button>
        <button
          onClick={onClearCache}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          キャッシュクリア
        </button>
      </div>
    </div>
  );
}