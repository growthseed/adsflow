import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeSeriesData } from '@/types/bi';

interface LeadsLineChartProps {
  data: TimeSeriesData[];
  title?: string;
  height?: number;
  className?: string;
}

const LeadsLineChart: React.FC<LeadsLineChartProps> = ({
  data,
  title = 'Leads por Mês/Ano',
  height = 300,
  className = '',
}) => {
  // Transform data for Recharts
  const chartData = data[0]?.data.map(point => ({
    name: point.label || point.date,
    value: point.value,
    date: point.date,
  })) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-blue-600">
            <span className="font-bold">{payload[0].value}</span> leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => <span className="text-sm text-slate-600">Leads</span>}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#2563EB' }}
              name="Leads"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-slate-500">
          Nenhum dado disponível para o período selecionado
        </div>
      )}
    </div>
  );
};

export default LeadsLineChart;
