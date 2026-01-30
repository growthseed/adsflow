import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPICardData } from '@/types/bi';
import { formatNumber, formatCurrencyBRL, formatPercentageBI } from '@/types/bi';

interface KPICardProps {
  data: KPICardData;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ data, className = '' }) => {
  const { title, value, format, lastMonth, lastYear, color = 'blue' } = data;

  // Format value based on type
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return formatCurrencyBRL(val);
      case 'percentage':
        return formatPercentageBI(val);
      case 'days':
        return `${val} dias`;
      default:
        return formatNumber(val);
    }
  };

  // Get trend icon and color
  const getTrend = (change: number) => {
    if (change > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    } else if (change < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    }
    return {
      icon: Minus,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
    };
  };

  // Color variants
  const colorClasses: Record<string, { border: string; icon: string; bg: string }> = {
    blue: { border: 'border-l-blue-500', icon: 'text-blue-500', bg: 'bg-blue-50' },
    green: { border: 'border-l-green-500', icon: 'text-green-500', bg: 'bg-green-50' },
    red: { border: 'border-l-red-500', icon: 'text-red-500', bg: 'bg-red-50' },
    yellow: { border: 'border-l-yellow-500', icon: 'text-yellow-500', bg: 'bg-yellow-50' },
    purple: { border: 'border-l-purple-500', icon: 'text-purple-500', bg: 'bg-purple-50' },
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        border-l-4 ${colorClass.border}
        p-4 hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {/* Title */}
      <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>

      {/* Main Value */}
      <div className="text-3xl font-bold text-gray-900 mb-3">
        {formatValue(value)}
      </div>

      {/* Comparisons */}
      <div className="space-y-2">
        {/* Last Month */}
        {lastMonth && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Mês anterior:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                {formatValue(lastMonth.value)}
              </span>
              <div
                className={`
                  flex items-center gap-1 px-1.5 py-0.5 rounded
                  ${getTrend(lastMonth.percentageChange).bgColor}
                `}
              >
                {React.createElement(getTrend(lastMonth.percentageChange).icon, {
                  className: `w-3 h-3 ${getTrend(lastMonth.percentageChange).color}`,
                })}
                <span className={`text-xs font-medium ${getTrend(lastMonth.percentageChange).color}`}>
                  {formatPercentageBI(Math.abs(lastMonth.percentageChange))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Last Year */}
        {lastYear && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Ano anterior:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                {formatValue(lastYear.value)}
              </span>
              <div
                className={`
                  flex items-center gap-1 px-1.5 py-0.5 rounded
                  ${getTrend(lastYear.percentageChange).bgColor}
                `}
              >
                {React.createElement(getTrend(lastYear.percentageChange).icon, {
                  className: `w-3 h-3 ${getTrend(lastYear.percentageChange).color}`,
                })}
                <span className={`text-xs font-medium ${getTrend(lastYear.percentageChange).color}`}>
                  {formatPercentageBI(Math.abs(lastYear.percentageChange))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
