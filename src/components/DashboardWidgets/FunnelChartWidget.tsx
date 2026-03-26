import { ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface FunnelItem {
  name: string;
  value: number;
}

interface Props {
  config: ChartConfig;
  data: FunnelItem[];
  loading?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function FunnelChartWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* ResponsiveContainer expects a Recharts child; we wrap in a custom SVG-free container */}
      <FunnelInner data={data} colors={colors} maxValue={maxValue} />
    </ResponsiveContainer>
  );
}

interface FunnelInnerProps {
  data: FunnelItem[];
  colors: string[];
  maxValue: number;
  width?: number;
  height?: number;
}

function FunnelInner({ data, colors, maxValue, width = 400, height = 300 }: FunnelInnerProps) {
  const barHeight = Math.max(16, Math.min(40, (height - 16) / data.length - 8));
  const totalHeight = data.length * (barHeight + 8);
  const startY = Math.max(0, (height - totalHeight) / 2);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((item, i) => {
        const widthPct = item.value / maxValue;
        const barWidth = Math.max(32, widthPct * (width - 120));
        const x = (width - 120 - barWidth) / 2;
        const y = startY + i * (barHeight + 8);
        const dropOff = i > 0 ? (((data[i - 1].value - item.value) / data[i - 1].value) * 100) : 0;
        const convRate = ((item.value / data[0].value) * 100);

        return (
          <g key={item.name}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={colors[i % colors.length]}
              opacity={0.85}
            />
            {/* Stage label (left) */}
            <text
              x={x + 8}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill="#fff"
              fontSize={Math.min(12, barHeight * 0.55)}
              fontWeight={600}
            >
              {item.name}
            </text>
            {/* Value + rate (right side) */}
            <text
              x={width - 8}
              y={y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="central"
              fill="#64748b"
              fontSize={11}
            >
              {item.value.toLocaleString('pt-BR')} ({convRate.toFixed(1)}%)
            </text>
            {/* Drop-off between bars */}
            {i > 0 && dropOff > 0 && (
              <text
                x={x + barWidth + 6}
                y={y - 2}
                fill="#ef4444"
                fontSize={9}
                fontWeight={500}
              >
                -{dropOff.toFixed(1)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
