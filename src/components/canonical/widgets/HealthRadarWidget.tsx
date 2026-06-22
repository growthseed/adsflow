/**
 * <HealthRadarWidget> — Spider chart de saúde multi-dimensional.
 * Anima desenho com easing.
 */

import { useEffect, useState } from 'react'
import { ChartCard } from '../ChartCard'

export interface HealthRadarDim {
  label: string
  /** Valor normalizado 0-100 */
  value: number
  /** Opcional: valor real (pra mostrar no tooltip) */
  rawValue?: string | number
  /** Opcional: comparativo */
  compareValue?: number
}

export interface HealthRadarWidgetProps {
  title: string
  subtitle?: string
  dimensions: HealthRadarDim[]
  /** Mostra spike comparativo se compareValue existir */
  showCompare?: boolean
  height?: number
  /** Cor principal do polígono */
  color?: string
  /** Cor do comparativo */
  compareColor?: string
}

export default function HealthRadarWidget({
  title, subtitle, dimensions, showCompare = false, height = 360,
  color = '#1A1F36', compareColor = '#9CA3AF',
}: HealthRadarWidgetProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const dur = 1000
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const e = Math.min(1, (t - start) / dur)
      setProgress(1 - Math.pow(1 - e, 3))
      if (e < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [dimensions])

  const cx = 180
  const cy = 180
  const maxR = 130
  const levels = 4 // 25%, 50%, 75%, 100%
  const n = dimensions.length

  // Calcula ponto polar pra cada eixo
  function point(i: number, value: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  function axisEnd(i: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return {
      x: cx + maxR * Math.cos(angle),
      y: cy + maxR * Math.sin(angle),
    }
  }

  function labelPos(i: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const r = maxR + 20
    const cos = Math.cos(angle)
    return {
      x: cx + r * cos,
      y: cy + r * Math.sin(angle),
      anchor: cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle',
    }
  }

  // Polígono principal (animado)
  const polyPoints = dimensions.map((d, i) => point(i, d.value * progress)).map((p) => `${p.x},${p.y}`).join(' ')

  // Polígono comparativo
  const compPolyPoints = showCompare
    ? dimensions.map((d, i) => point(i, (d.compareValue ?? 0) * progress)).map((p) => `${p.x},${p.y}`).join(' ')
    : ''

  return (
    <ChartCard title={title} subtitle={subtitle} height={height}>
      <div className="h-full flex items-center justify-center">
        <svg viewBox="0 0 360 360" className="w-full max-w-[360px]" style={{ overflow: 'visible' }}>
          {/* Concentric levels */}
          {[1, 2, 3, 4].map((lvl) => {
            const r = (maxR * lvl) / levels
            return (
              <circle
                key={lvl}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="#E5E7EB"
                strokeDasharray={lvl === levels ? '0' : '2 2'}
                strokeWidth={lvl === levels ? 1.5 : 1}
              />
            )
          })}

          {/* Axes */}
          {dimensions.map((_, i) => {
            const end = axisEnd(i)
            return (
              <line
                key={i}
                x1={cx} y1={cy} x2={end.x} y2={end.y}
                stroke="#E5E7EB" strokeWidth={1}
              />
            )
          })}

          {/* Comparativo (atrás) */}
          {showCompare && compPolyPoints && (
            <polygon
              points={compPolyPoints}
              fill={compareColor + '20'}
              stroke={compareColor}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* Polígono principal */}
          <polygon
            points={polyPoints}
            fill={color + '30'}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Pontos vértices */}
          {dimensions.map((d, i) => {
            const p = point(i, d.value * progress)
            return (
              <circle
                key={i}
                cx={p.x} cy={p.y} r={4}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
              />
            )
          })}

          {/* Labels eixos */}
          {dimensions.map((d, i) => {
            const lp = labelPos(i)
            return (
              <g key={i}>
                <text
                  x={lp.x} y={lp.y}
                  fontSize="10"
                  fill="#374151"
                  textAnchor={lp.anchor}
                  dominantBaseline="middle"
                  fontWeight="500"
                >
                  {d.label}
                </text>
                <text
                  x={lp.x} y={lp.y + 12}
                  fontSize="9"
                  fill="#9CA3AF"
                  textAnchor={lp.anchor}
                  dominantBaseline="middle"
                >
                  {d.rawValue != null ? String(d.rawValue) : `${Math.round(d.value)}%`}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </ChartCard>
  )
}
