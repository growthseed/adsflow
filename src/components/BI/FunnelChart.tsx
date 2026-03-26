import React from 'react';
import type { FunnelData } from '@/types/bi';
import { formatNumber, formatPercentageBI } from '@/types/bi';

interface FunnelChartProps {
  data: FunnelData;
  title?: string;
  showDropoffs?: boolean;
  className?: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  title = 'Funil de Vendas',
  showDropoffs = true,
  className = '',
}) => {
  const { stages, totalEntries, overallConversionRate } = data;
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="text-sm text-slate-500">
          Total: <span className="font-medium text-slate-900">{formatNumber(totalEntries)}</span>
          {' | '}
          Conversão: <span className="font-medium text-green-600">{formatPercentageBI(overallConversionRate)}</span>
        </div>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          const dropoff = index > 0
            ? stages[index - 1].count - stage.count
            : 0;
          const dropoffPercentage = index > 0 && stages[index - 1].count > 0
            ? (dropoff / stages[index - 1].count) * 100
            : 0;

          return (
            <div key={stage.name}>
              {/* Stage Bar */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  {/* Label */}
                  <div className="w-40 text-sm text-slate-700 truncate" title={stage.name}>
                    {stage.name}
                  </div>

                  {/* Bar Container */}
                  <div className="flex-1 relative">
                    {/* Background */}
                    <div className="h-10 bg-slate-100 rounded-lg overflow-hidden">
                      {/* Filled Bar */}
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{
                          width: `${Math.max(widthPercentage, 5)}%`,
                          backgroundColor: stage.color || '#3B82F6',
                        }}
                      >
                        <span className="text-white text-sm font-medium drop-shadow">
                          {formatNumber(stage.count)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="w-16 text-right text-sm font-medium text-slate-600">
                    {formatPercentageBI(stage.percentage, 1)}
                  </div>
                </div>

                {/* Dropoff Indicator */}
                {showDropoffs && dropoff > 0 && (
                  <div className="flex items-center gap-3 mt-1 ml-40 pl-3">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="text-red-500 text-xs">
                        ↓ -{formatNumber(dropoff)} ({formatPercentageBI(dropoffPercentage, 1)} drop)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
        <div className="text-sm text-slate-500">
          De <span className="font-medium text-slate-900">{formatNumber(totalEntries)}</span> leads,{' '}
          <span className="font-medium text-green-600">
            {formatNumber(stages.find(s => s.name === 'Contrato fechado')?.count || 0)}
          </span>{' '}
          fecharam contrato
        </div>
        <div className="text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {formatPercentageBI(overallConversionRate)} conversão geral
          </span>
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
