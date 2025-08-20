import { AlertTriangle, Trash2 } from 'lucide-react';
import ToggleSwitch from '@/components/ui/toggle-switch';

interface SecurityConfig {
  enableTwoFactor: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  auditLog: boolean;
}

interface SecuritySettingsProps {
  config: SecurityConfig;
  onChange: (config: SecurityConfig) => void;
}

export default function SecuritySettings({ config, onChange }: SecuritySettingsProps) {
  const addIpAddress = () => {
    onChange({
      ...config,
      ipWhitelist: [...config.ipWhitelist, '']
    });
  };

  const removeIpAddress = (index: number) => {
    const newList = config.ipWhitelist.filter((_, i) => i !== index);
    onChange({
      ...config,
      ipWhitelist: newList
    });
  };

  const updateIpAddress = (index: number, value: string) => {
    const newList = [...config.ipWhitelist];
    newList[index] = value;
    onChange({
      ...config,
      ipWhitelist: newList
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">セキュリティ設定</h2>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">二要素認証</p>
          <p className="text-sm text-gray-600">追加のセキュリティレイヤーを有効化</p>
        </div>
        <ToggleSwitch
          checked={config.enableTwoFactor}
          onChange={(checked) => onChange({
            ...config,
            enableTwoFactor: checked
          })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          セッションタイムアウト (分)
        </label>
        <input
          type="number"
          value={config.sessionTimeout}
          onChange={(e) => onChange({
            ...config,
            sessionTimeout: Number(e.target.value)
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
          {config.ipWhitelist.map((ip, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={ip}
                onChange={(e) => updateIpAddress(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="192.168.1.0/24"
              />
              <button
                onClick={() => removeIpAddress(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addIpAddress}
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
        <ToggleSwitch
          checked={config.auditLog}
          onChange={(checked) => onChange({
            ...config,
            auditLog: checked
          })}
        />
      </div>
    </div>
  );
}