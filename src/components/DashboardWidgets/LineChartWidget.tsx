import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface Props {
  config: ChartConfig;
  data: Record<string, unknown>[];
  loading?: boolean;
  variant?: 'line' | 'area';
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function LineChartWidget({ config, data, loading, variant = 'line' }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const yFields = config.yAxis || ['value'];
  const xField = config.xAxis || 'date';

  const Chart = variant === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey={xField}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
        />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {yFields.map((field, i) =>
          variant === 'area' ? (
            <Area
              key={field}
              type={config.curveType || 'monotone'}
              dataKey={field}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ) : (
            <Line
              key={field}
              type={config.curveType || 'monotone'}
              dataKey={field}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
