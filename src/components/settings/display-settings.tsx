interface DisplayConfig {
  language: 'ja' | 'en';
  timezone: string;
  dateFormat: 'japanese' | 'iso' | 'us';
  itemsPerPage: number;
  colorScheme: 'default' | 'dark' | 'blue' | 'green' | 'purple';
}

interface DisplaySettingsProps {
  config: DisplayConfig;
  onChange: (config: DisplayConfig) => void;
}

export default function DisplaySettings({ config, onChange }: DisplaySettingsProps) {

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">表示設定</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          言語
        </label>
        <select
          value={config.language}
          onChange={(e) => onChange({
            ...config,
            language: e.target.value as 'ja' | 'en'
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
          value={config.timezone}
          onChange={(e) => onChange({
            ...config,
            timezone: e.target.value
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
          value={config.dateFormat}
          onChange={(e) => onChange({
            ...config,
            dateFormat: e.target.value as 'japanese' | 'iso' | 'us'
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
          value={config.itemsPerPage}
          onChange={(e) => onChange({
            ...config,
            itemsPerPage: Number(e.target.value)
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={10}>10件</option>
          <option value={20}>20件</option>
          <option value={50}>50件</option>
          <option value={100}>100件</option>
        </select>
      </div>

      {/* カラースキーム選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          画面モード（カラースキーム）
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { value: 'default', label: 'デフォルト', color: 'bg-gray-100', preview: 'border-gray-400' },
            { value: 'dark', label: 'ダーク', color: 'bg-gray-800', preview: 'border-gray-600' },
            { value: 'blue', label: 'ブルー', color: 'bg-blue-100', preview: 'border-blue-400' },
            { value: 'green', label: 'グリーン', color: 'bg-green-100', preview: 'border-green-400' },
            { value: 'purple', label: 'パープル', color: 'bg-purple-100', preview: 'border-purple-400' },
          ].map((scheme) => (
            <button
              key={scheme.value}
              onClick={() => onChange({
                ...config,
                colorScheme: scheme.value as DisplayConfig['colorScheme']
              })}
              className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                config.colorScheme === scheme.value
                  ? `${scheme.preview} bg-blue-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full ${scheme.color} border border-gray-300`}></div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{scheme.label}</p>
                  {config.colorScheme === scheme.value && (
                    <p className="text-xs text-blue-600">現在選択中</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          カラースキームの変更は次回ページ読み込み時に適用されます
        </p>
      </div>
    </div>
  );
}