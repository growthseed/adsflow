import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import type { GaugeConfig } from '@/types/dashboard';

interface Props {
  config: GaugeConfig;
  data: { value: number } | null;
  loading?: boolean;
}

function formatValue(value: number, format: GaugeConfig['format']): string {
  switch (format) {
    case 'currency':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString('pt-BR');
  }
}

export default function GaugeWidget({ config, data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const value = data.value;
  const percentage = Math.min(((value - config.min) / (config.max - config.min)) * 100, 100);

  // Determine color from thresholds
  let color = '#3b82f6';
  if (config.thresholds) {
    for (const t of [...config.thresholds].sort((a, b) => b.value - a.value)) {
      if (value >= t.value) {
        color = t.color;
        break;
      }
    }
  }

  const chartData = [{ name: 'value', value: percentage, fill: color }];

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="80%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          barSize={12}
          data={chartData}
          startAngle={210}
          endAngle={-30}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: '#e2e8f0' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-slate-900">{formatValue(value, config.format)}</p>
        <p className="text-xs text-slate-500">{config.metric.replace(/_/g, ' ')}</p>
      </div>
    </div>
  );
}
