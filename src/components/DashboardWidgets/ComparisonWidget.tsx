import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ComparisonConfig } from '@/types/dashboard';

interface MetricComparison {
  metric: string;
  label: string;
  period1Value: number;
  period2Value: number;
  format?: 'number' | 'currency' | 'percentage';
}

interface Props {
  config: ComparisonConfig;
  data: MetricComparison[];
  loading?: boolean;
}

function formatValue(value: number, format?: string): string {
  switch (format) {
    case 'currency':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${(value / 1_000).toFixed(1)}K`
          : value.toLocaleString('pt-BR');
  }
}

export default function ComparisonWidget({ config, data, loading }: Props) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Sem dados
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 overflow-auto">
      {/* Period labels */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3 px-1">
        <span className="w-1/3" />
        <span className="w-1/4 text-center">{config.period1.label}</span>
        <span className="w-1/4 text-center">{config.period2.label}</span>
        <span className="w-1/6 text-center">Delta</span>
      </div>
      {/* Metric rows */}
      <div className="flex flex-col gap-2">
        {data.map((item) => {
          const delta = item.period1Value !== 0
            ? ((item.period2Value - item.period1Value) / item.period1Value) * 100
            : 0;
          const isPositive = delta > 0;
          const isNegative = delta < 0;

          return (
            <div
              key={item.metric}
              className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
            >
              {/* Label */}
              <span className="w-1/3 text-xs font-medium text-slate-700 truncate">
                {item.label || item.metric.replace(/_/g, ' ')}
              </span>
              {/* Period 1 */}
              <span className="w-1/4 text-center text-sm font-semibold text-slate-900">
                {formatValue(item.period1Value, item.format)}
              </span>
              {/* Period 2 */}
              <span className="w-1/4 text-center text-sm font-semibold text-slate-900">
                {formatValue(item.period2Value, item.format)}
              </span>
              {/* Delta */}
              <span className="w-1/6 flex items-center justify-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                ) : isNegative ? (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {isPositive ? '+' : ''}{delta.toFixed(1)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
