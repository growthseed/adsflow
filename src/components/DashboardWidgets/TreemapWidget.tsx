import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface TreemapItem {
  name: string;
  value: number;
  children?: TreemapItem[];
  [key: string]: unknown;
}

interface Props {
  config: ChartConfig;
  data: TreemapItem[];
  loading?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
  colors?: string[];
}

function CustomTreemapContent({ x = 0, y = 0, width = 0, height = 0, name, value, index = 0, colors = DEFAULT_COLORS }: CustomContentProps) {
  if (width < 4 || height < 4) return null;

  const fill = colors[index % colors.length];
  const showLabel = width > 40 && height > 24;
  const showValue = width > 60 && height > 36;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        opacity={0.85}
        stroke="#fff"
        strokeWidth={2}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={Math.min(13, width / 8)}
          fontWeight={600}
        >
          {name && name.length > width / 8 ? `${name.slice(0, Math.floor(width / 8))}...` : name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.8)"
          fontSize={Math.min(11, width / 9)}
        >
          {(value ?? 0).toLocaleString('pt-BR')}
        </text>
      )}
    </g>
  );
}

export default function TreemapWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;

  // Treemap expects a root with children
  const treeData = data[0]?.children ? data : [{ name: 'root', children: data }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={treeData}
        dataKey="value"
        nameKey="name"
        aspectRatio={4 / 3}
        stroke="#fff"
        content={<CustomTreemapContent colors={colors} />}
      >
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
          formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('pt-BR')]}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
