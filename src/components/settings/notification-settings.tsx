interface NotificationSettingsProps {
  settings: {
    emailAlerts: boolean;
    emailAddress: string;
    alertThreshold: number;
    dailyReports: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function NotificationSettings({
  settings,
  onSettingsChange
}: NotificationSettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
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
            checked={settings.emailAlerts}
            onChange={(e) => updateSetting('emailAlerts', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {settings.emailAlerts && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通知メールアドレス
            </label>
            <input
              type="email"
              value={settings.emailAddress}
              onChange={(e) => updateSetting('emailAddress', e.target.value)}
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
              value={settings.alertThreshold}
              onChange={(e) => updateSetting('alertThreshold', Number(e.target.value))}
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
            checked={settings.dailyReports}
            onChange={(e) => updateSetting('dailyReports', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
}