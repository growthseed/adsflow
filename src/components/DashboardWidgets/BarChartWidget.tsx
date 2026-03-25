import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface Props {
  config: ChartConfig;
  data: Record<string, unknown>[];
  loading?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function BarChartWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const yFields = config.yAxis || ['value'];
  const xField = config.xAxis || 'name';
  const isHorizontal = config.chartType === 'horizontal_bar';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={isHorizontal ? 'vertical' : 'horizontal'}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey={xField} width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={xField} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {yFields.map((field, i) => (
          <Bar
            key={field}
            dataKey={field}
            fill={colors[i % colors.length]}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stackId={config.stacked ? 'stack' : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
