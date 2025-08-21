interface IpStatsHeaderProps {
  onRefresh: () => void;
}

export default function IpStatsHeader({ onRefresh }: IpStatsHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IP別統計</h1>
          <p className="text-gray-600">
            IPアドレスごとのアカウント作成数の詳細統計
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          データを更新
        </button>
      </div>
    </div>
  );
}