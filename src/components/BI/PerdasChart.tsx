import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PerdasPorFonte, PerdasPorEtapa } from '@/types/bi';
import { formatNumber, formatPercentageBI } from '@/types/bi';

interface PerdasChartProps {
  perdasPorFonte: PerdasPorFonte[];
  perdasPorEtapa: PerdasPorEtapa[];
  totalPerdas: number;
  className?: string;
}

// Color palette
const COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#F59E0B', // amber-500
  '#84CC16', // lime-500
  '#22C55E', // green-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
];

const PerdasChart: React.FC<PerdasChartProps> = ({
  perdasPorFonte,
  perdasPorEtapa,
  totalPerdas,
  className = '',
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-red-600">
            <span className="font-bold">{payload[0].value}</span> perdas
            {' '}({formatPercentageBI(payload[0].payload.percentage, 1)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Perdas por Fonte */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Perdas por Fonte</h3>
          <span className="text-sm text-slate-500">
            Total: <span className="font-medium text-red-600">{formatNumber(totalPerdas)}</span>
          </span>
        </div>

        {perdasPorFonte.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={perdasPorFonte}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                dataKey="fonte"
                type="category"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {perdasPorFonte.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-slate-500">
            Nenhuma perda registrada
          </div>
        )}
      </div>

      {/* Perdas por Etapa */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Perdas por Etapa</h3>

        {perdasPorEtapa.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={perdasPorEtapa}
              layout="vertical"
              margin={{ left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                dataKey="etapa"
                type="category"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-slate-500">
            Nenhuma perda registrada
          </div>
        )}
      </div>

      {/* Motivos de Perda - Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {perdasPorFonte.slice(0, 4).map((item, index) => (
          <div
            key={item.fonte}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
          >
            <div className="text-xs text-slate-500 mb-1">{item.fonte}</div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(item.count)}</div>
            <div
              className="text-sm font-medium"
              style={{ color: COLORS[index % COLORS.length] }}
            >
              {formatPercentageBI(item.percentage, 1)} do total
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerdasChart;
