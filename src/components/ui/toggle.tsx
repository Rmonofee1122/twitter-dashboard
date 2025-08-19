interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  size = 'md'
}: ToggleProps) {
  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'h-3 w-3 after:h-3 after:w-3'
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'h-5 w-5 after:h-5 after:w-5'
    },
    lg: {
      switch: 'w-14 h-8',
      thumb: 'h-7 w-7 after:h-7 after:w-7'
    }
  };

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div>
          {label && <p className="font-medium text-gray-900">{label}</p>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`
          ${sizeClasses[size].switch}
          bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
          rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
          after:border-gray-300 after:border after:rounded-full ${sizeClasses[size].thumb} 
          after:transition-all peer-checked:bg-blue-600
        `} />
      </label>
    </div>
  );
}