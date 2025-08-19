import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface LineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
  title?: string;
  strokeWidth?: number;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: any) => string;
}

export default function LineChart({
  data,
  xAxisKey,
  yAxisKey,
  color = '#10B981',
  height = 300,
  title,
  strokeWidth = 3,
  tooltipFormatter,
  labelFormatter
}: LineChartProps) {
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip 
            labelFormatter={labelFormatter}
            formatter={tooltipFormatter}
          />
          <Line 
            type="monotone" 
            dataKey={yAxisKey} 
            stroke={color} 
            strokeWidth={strokeWidth}
            dot={{ fill: color, r: 4 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}