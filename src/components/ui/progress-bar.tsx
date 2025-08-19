interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: string;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  percentage,
  color = 'bg-green-600',
  height = 'h-2',
  label,
  showPercentage = false
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-green-600">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
      </div>
    </div>
  );
}