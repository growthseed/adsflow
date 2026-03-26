import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface WaterfallItem {
  name: string;
  value: number;
}

interface Props {
  config: ChartConfig;
  data: WaterfallItem[];
  loading?: boolean;
}

interface WaterfallEntry {
  name: string;
  value: number;
  base: number;
  delta: number;
  isTotal: boolean;
}

export default function WaterfallChartWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  // Transform data for waterfall: each bar has a transparent base + colored delta
  const waterfallData: WaterfallEntry[] = [];
  let running = 0;

  for (const item of data) {
    const isTotal = item.name.toLowerCase() === 'total';
    if (isTotal) {
      waterfallData.push({ name: item.name, value: item.value, base: 0, delta: item.value, isTotal: true });
    } else {
      const base = item.value >= 0 ? running : running + item.value;
      waterfallData.push({ name: item.name, value: item.value, base, delta: Math.abs(item.value), isTotal: false });
      running += item.value;
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={waterfallData}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey="name"
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
          formatter={(_val: unknown, name: string | undefined, props: { payload?: WaterfallEntry }) => {
            if (name === 'base') return [null, null];
            const entry = props.payload;
            if (!entry) return [null, null];
            const sign = entry.value >= 0 ? '+' : '';
            return [
              entry.isTotal
                ? entry.value.toLocaleString('pt-BR')
                : `${sign}${entry.value.toLocaleString('pt-BR')}`,
              entry.name,
            ];
          }}
        />
        <ReferenceLine y={0} stroke="#94a3b8" />
        {/* Invisible base bar */}
        <Bar dataKey="base" stackId="waterfall" fill="transparent" />
        {/* Visible delta bar */}
        <Bar dataKey="delta" stackId="waterfall" radius={[4, 4, 0, 0]}>
          {waterfallData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isTotal ? '#3b82f6' : entry.value >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
