interface DisplaySettingsProps {
  settings: {
    language: 'ja' | 'en';
    timezone: string;
    dateFormat: 'japanese' | 'iso' | 'us';
    itemsPerPage: number;
  };
  onSettingsChange: (settings: any) => void;
}

export default function DisplaySettings({
  settings,
  onSettingsChange
}: DisplaySettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">表示設定</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          言語
        </label>
        <select
          value={settings.language}
          onChange={(e) => updateSetting('language', e.target.value)}
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
          value={settings.timezone}
          onChange={(e) => updateSetting('timezone', e.target.value)}
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
          value={settings.dateFormat}
          onChange={(e) => updateSetting('dateFormat', e.target.value)}
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
          value={settings.itemsPerPage}
          onChange={(e) => updateSetting('itemsPerPage', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={10}>10件</option>
          <option value={20}>20件</option>
          <option value={50}>50件</option>
          <option value={100}>100件</option>
        </select>
      </div>
    </div>
  );
}