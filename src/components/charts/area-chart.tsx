import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AreaChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
  title?: string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: any) => string;
}

export default function AreaChart({
  data,
  xAxisKey,
  yAxisKey,
  color = '#3B82F6',
  height = 400,
  title,
  tooltipFormatter,
  labelFormatter
}: AreaChartProps) {
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          <defs>
            <linearGradient id={`colorGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip 
            labelFormatter={labelFormatter}
            formatter={tooltipFormatter}
          />
          <Area 
            type="monotone" 
            dataKey={yAxisKey} 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#colorGradient-${color.replace('#', '')})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}