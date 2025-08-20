import { Save, RefreshCw, CheckCircle } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingsHeaderProps {
  onSave: () => void;
  saveStatus: SaveStatus;
}

export default function SettingsHeader({ onSave, saveStatus }: SettingsHeaderProps) {
  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            保存中...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            保存完了
          </>
        );
      default:
        return (
          <>
            <Save className="h-4 w-4 mr-2" />
            設定を保存
          </>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
          <p className="text-gray-600">
            システムの動作を調整し、環境を設定します
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {getSaveButtonContent()}
        </button>
      </div>
    </div>
  );
}