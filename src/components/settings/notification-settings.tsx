import ToggleSwitch from '@/components/ui/toggle-switch';

interface NotificationConfig {
  emailAlerts: boolean;
  emailAddress: string;
  alertThreshold: number;
  dailyReports: boolean;
}

interface NotificationSettingsProps {
  config: NotificationConfig;
  onChange: (config: NotificationConfig) => void;
}

export default function NotificationSettings({ config, onChange }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">メールアラート</p>
          <p className="text-sm text-gray-600">重要なイベント時にメールで通知</p>
        </div>
        <ToggleSwitch
          checked={config.emailAlerts}
          onChange={(checked) => onChange({
            ...config,
            emailAlerts: checked
          })}
        />
      </div>

      {config.emailAlerts && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通知メールアドレス
            </label>
            <input
              type="email"
              value={config.emailAddress}
              onChange={(e) => onChange({
                ...config,
                emailAddress: e.target.value
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
              value={config.alertThreshold}
              onChange={(e) => onChange({
                ...config,
                alertThreshold: Number(e.target.value)
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
        <ToggleSwitch
          checked={config.dailyReports}
          onChange={(checked) => onChange({
            ...config,
            dailyReports: checked
          })}
        />
      </div>
    </div>
  );
}