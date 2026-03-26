import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface Props {
  config: ChartConfig;
  data: Array<{ name: string; value: number }>;
  loading?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function DonutChartWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const formattedTotal = total >= 1_000_000
    ? `${(total / 1_000_000).toFixed(1)}M`
    : total >= 1_000
      ? `${(total / 1_000).toFixed(1)}K`
      : total.toLocaleString('pt-BR');

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          label={config.showLabels ? ((entry: { name?: string; percent?: number }) => `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`) as unknown as boolean : false}
          labelLine={config.showLabels}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        {/* Center label */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-900"
          style={{ fontSize: '20px', fontWeight: 700 }}
        >
          {formattedTotal}
        </text>
        <text
          x="50%"
          y="56%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-400"
          style={{ fontSize: '11px' }}
        >
          Total
        </text>
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
