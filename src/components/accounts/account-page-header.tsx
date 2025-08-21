interface AccountPageHeaderProps {
  title: string;
  description: string;
  onRefresh?: () => void;
  refreshButtonColor?: string;
}

export default function AccountPageHeader({ 
  title, 
  description, 
  onRefresh,
  refreshButtonColor = "bg-blue-100 text-blue-700 hover:bg-blue-200"
}: AccountPageHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`px-4 py-2 rounded-lg transition-colors ${refreshButtonColor}`}
          >
            データを更新
          </button>
        )}
      </div>
    </div>
  );
}