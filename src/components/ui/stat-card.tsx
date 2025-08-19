import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
  trend
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className={`flex items-center text-sm mt-1 ${
              trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="mr-1">
                {trend.value > 0 ? '+' : ''}{trend.value}
              </span>
              <span className="text-gray-500">({trend.label})</span>
            </div>
          )}
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">
              {subtitle}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}