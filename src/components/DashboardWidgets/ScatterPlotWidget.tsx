import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis,
} from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface Props {
  config: ChartConfig;
  data: Record<string, unknown>[];
  loading?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function ScatterPlotWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const xField = config.xAxis || 'x';
  const yFields = config.yAxis || ['y'];
  // Third metric used for dot size (z-axis)
  const zField = yFields.length > 1 ? yFields[1] : undefined;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey={xField}
          name={xField}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          type="number"
        />
        <YAxis
          dataKey={yFields[0]}
          name={yFields[0]}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          type="number"
        />
        {zField && (
          <ZAxis
            dataKey={zField}
            name={zField}
            range={[40, 400]}
            type="number"
          />
        )}
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
        />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        <Scatter
          name={yFields[0]}
          data={data}
          fill={colors[0]}
          fillOpacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
