import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface Props {
  config: ChartConfig;
  data: Array<{ name: string; value: number }>;
  loading?: boolean;
  variant?: 'pie' | 'donut';
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function PieChartWidget({ config, data, loading, variant = 'pie' }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const isDonut = variant === 'donut';
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={isDonut ? '55%' : 0}
          outerRadius="80%"
          paddingAngle={2}
          label={config.showLabels ? ((entry: { name?: string; percent?: number }) => `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`) as unknown as boolean : false}
          labelLine={config.showLabels}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [
            `${(value ?? 0).toLocaleString('pt-BR')} (${(((value ?? 0) / total) * 100).toFixed(1)}%)`,
          ]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
        />
        {config.showLegend !== false && <Legend wrapperStyle={{ fontSize: '11px' }} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
