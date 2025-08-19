import { AlertTriangle, Trash2 } from 'lucide-react';

interface SecuritySettingsProps {
  settings: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLog: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function SecuritySettings({
  settings,
  onSettingsChange
}: SecuritySettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateIpWhitelist = (index: number, value: string) => {
    const newList = [...settings.ipWhitelist];
    newList[index] = value;
    updateSetting('ipWhitelist', newList);
  };

  const removeIpFromWhitelist = (index: number) => {
    const newList = settings.ipWhitelist.filter((_, i) => i !== index);
    updateSetting('ipWhitelist', newList);
  };

  const addIpToWhitelist = () => {
    updateSetting('ipWhitelist', [...settings.ipWhitelist, '']);
  };

  return (
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
            checked={settings.enableTwoFactor}
            onChange={(e) => updateSetting('enableTwoFactor', e.target.checked)}
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
          value={settings.sessionTimeout}
          onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
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
          {settings.ipWhitelist.map((ip, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={ip}
                onChange={(e) => updateIpWhitelist(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="192.168.1.0/24"
              />
              <button
                onClick={() => removeIpFromWhitelist(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addIpToWhitelist}
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
            checked={settings.auditLog}
            onChange={(e) => updateSetting('auditLog', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
}