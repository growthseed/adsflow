import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPICardConfig } from '@/types/dashboard';

interface Props {
  config: KPICardConfig;
  data: { value: number; previousValue?: number } | null;
  loading?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  blue: 'border-l-blue-500 bg-blue-50/50',
  green: 'border-l-green-500 bg-green-50/50',
  red: 'border-l-red-500 bg-red-50/50',
  yellow: 'border-l-yellow-500 bg-yellow-50/50',
  purple: 'border-l-purple-500 bg-purple-50/50',
  indigo: 'border-l-indigo-500 bg-indigo-50/50',
};

function formatValue(value: number, format: KPICardConfig['format']): string {
  switch (format) {
    case 'currency':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString('pt-BR');
  }
}

export default function KPICardWidget({ config, data, loading }: Props) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const value = data?.value ?? 0;
  const prev = data?.previousValue;
  const change = prev != null && prev > 0 ? ((value - prev) / prev) * 100 : null;
  const colorClass = COLOR_MAP[config.color || 'blue'] || COLOR_MAP.blue;

  return (
    <div className={`h-full flex flex-col justify-center p-4 border-l-4 rounded-lg ${colorClass}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
        {config.metric.replace(/_/g, ' ')}
      </p>
      <p className="text-2xl font-bold text-slate-900">{formatValue(value, config.format)}</p>
      {config.showTrend && change != null && (
        <div className="flex items-center gap-1 mt-1">
          {change > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          ) : change < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className={`text-xs font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
