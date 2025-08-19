interface ActivityItem {
  action: string;
  count: number;
  time: string;
}

interface ActivityCardProps {
  title: string;
  activities: ActivityItem[];
  onRefresh?: () => void;
  loading?: boolean;
}

export default function ActivityCard({ 
  title, 
  activities, 
  onRefresh,
  loading = false 
}: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {loading ? '更新中...' : '更新'}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: activities.length || 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
            >
              <div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-12"></div>
            </div>
          ))
        ) : (
          activities.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{item.action}</p>
                <p className="text-sm text-gray-600">{item.time}</p>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}