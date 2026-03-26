import { ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/types/dashboard';

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

interface Props {
  config: ChartConfig;
  data: HeatmapCell[];
  loading?: boolean;
}

function getColor(value: number, min: number, max: number): string {
  if (max === min) return '#3b82f6';
  const t = (value - min) / (max - min);
  // Slate-100 → Blue-500 gradient
  const r = Math.round(241 - t * (241 - 59));
  const g = Math.round(245 - t * (245 - 130));
  const b = Math.round(249 - t * (249 - 246));
  return `rgb(${r},${g},${b})`;
}

interface HeatmapInnerProps {
  data: HeatmapCell[];
  config: ChartConfig;
  width?: number;
  height?: number;
}

function HeatmapInner({ data, config: _config, width = 400, height = 300 }: HeatmapInnerProps) {
  const rows = [...new Set(data.map(d => d.row))];
  const cols = [...new Set(data.map(d => d.col))];

  if (rows.length === 0 || cols.length === 0) {
    return (
      <text x={width / 2} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        Sem dados
      </text>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const labelWidth = 80;
  const headerHeight = 28;
  const cellW = Math.max(20, (width - labelWidth - 8) / cols.length);
  const cellH = Math.max(16, (height - headerHeight - 8) / rows.length);

  const cellMap = new Map<string, number>();
  for (const d of data) {
    cellMap.set(`${d.row}|${d.col}`, d.value);
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Column headers */}
      {cols.map((col, ci) => (
        <text
          key={`h-${col}`}
          x={labelWidth + ci * cellW + cellW / 2}
          y={headerHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#64748b"
          fontSize={Math.min(10, cellW / 3)}
        >
          {col.length > cellW / 7 ? `${col.slice(0, Math.floor(cellW / 7))}...` : col}
        </text>
      ))}
      {/* Rows */}
      {rows.map((row, ri) => (
        <g key={`r-${row}`}>
          {/* Row label */}
          <text
            x={labelWidth - 6}
            y={headerHeight + ri * cellH + cellH / 2}
            textAnchor="end"
            dominantBaseline="central"
            fill="#64748b"
            fontSize={Math.min(10, cellH * 0.55)}
          >
            {row.length > 10 ? `${row.slice(0, 10)}...` : row}
          </text>
          {/* Cells */}
          {cols.map((col, ci) => {
            const val = cellMap.get(`${row}|${col}`) ?? 0;
            const cx = labelWidth + ci * cellW;
            const cy = headerHeight + ri * cellH;
            return (
              <g key={`c-${row}-${col}`}>
                <rect
                  x={cx + 1}
                  y={cy + 1}
                  width={cellW - 2}
                  height={cellH - 2}
                  rx={3}
                  fill={getColor(val, min, max)}
                />
                {cellW > 30 && cellH > 18 && (
                  <text
                    x={cx + cellW / 2}
                    y={cy + cellH / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={val > (min + max) / 2 ? '#fff' : '#334155'}
                    fontSize={Math.min(10, cellW / 4)}
                    fontWeight={500}
                  >
                    {val.toLocaleString('pt-BR')}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export default function HeatmapWidget({ config, data, loading }: Props) {
  if (loading || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        {loading ? 'Carregando...' : 'Sem dados'}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <HeatmapInner data={data} config={config} />
    </ResponsiveContainer>
  );
}
