import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPICardConfig } from '@/types/dashboard';
import { METRIC_DEFINITIONS } from '@/types/reports';

interface Props {
  config: KPICardConfig;
  data: { value: number; previousValue?: number } | null;
  loading?: boolean;
}

const COLOR_MAP: Record<string, { border: string; bg: string; accent: string }> = {
  blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50/50',   accent: 'text-blue-600' },
  green:  { border: 'border-l-green-500',  bg: 'bg-green-50/50',  accent: 'text-green-600' },
  red:    { border: 'border-l-red-500',    bg: 'bg-red-50/50',    accent: 'text-red-600' },
  yellow: { border: 'border-l-yellow-500', bg: 'bg-yellow-50/50', accent: 'text-yellow-600' },
  purple: { border: 'border-l-purple-500', bg: 'bg-purple-50/50', accent: 'text-purple-600' },
  indigo: { border: 'border-l-indigo-500', bg: 'bg-indigo-50/50', accent: 'text-indigo-600' },
};

/** Build a lookup map from metric key -> Portuguese label */
const METRIC_LABEL_MAP: Record<string, string> = {};
for (const m of METRIC_DEFINITIONS) {
  METRIC_LABEL_MAP[m.key] = m.label;
}

function getMetricLabel(metric: string): string {
  return METRIC_LABEL_MAP[metric] || metric.replace(/_/g, ' ');
}

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
  const colorEntry = COLOR_MAP[config.color || 'blue'] || COLOR_MAP.blue;

  // Conditional formatting: determine value color based on change direction
  const valueColorClass =
    change != null && change > 0
      ? 'text-emerald-700'
      : change != null && change < 0
      ? 'text-red-700'
      : 'text-slate-900';

  return (
    <div className={`h-full flex flex-col justify-center p-5 border-l-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${colorEntry.border} ${colorEntry.bg}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {getMetricLabel(config.metric)}
      </p>
      <p className={`text-3xl font-bold ${valueColorClass}`}>{formatValue(value, config.format)}</p>
      {config.showTrend && change != null && (
        <div className="flex items-center gap-1.5 mt-2">
          {change > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3 h-3" />
              +{change.toFixed(1)}%
            </span>
          ) : change < 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-700">
              <TrendingDown className="w-3 h-3" />
              {change.toFixed(1)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              <Minus className="w-3 h-3" />
              0.0%
            </span>
          )}
          <span className="text-xs text-slate-400">vs anterior</span>
        </div>
      )}
    </div>
  );
}
