import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
  title?: string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: any) => string;
}

export default function BarChart({
  data,
  xAxisKey,
  yAxisKey,
  color = '#3B82F6',
  height = 300,
  title,
  tooltipFormatter,
  labelFormatter
}: BarChartProps) {
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip 
            labelFormatter={labelFormatter}
            formatter={tooltipFormatter}
          />
          <Bar dataKey={yAxisKey} fill={color} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}