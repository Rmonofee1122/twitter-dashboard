interface ActivityItem {
  action: string;
  count: number;
  time: string;
}

interface ActivityCardProps {
  title: string;
  activities: ActivityItem[];
}

export default function ActivityCard({ title, activities }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {activities.map((item, index) => (
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
        ))}
      </div>
    </div>
  );
}