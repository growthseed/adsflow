import { LineChart } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'

interface Props {
  /** Série acumulada: dia 1..N com {spend, ideal} */
  series: { day: number; spend: number; ideal: number }[]
  todayDay: number
  totalDays: number
  /** Projeção acumulada fim do mês (opcional) */
  projectedTotal?: number
}

export function PacingChart({ series, todayDay, totalDays, projectedTotal }: Props) {
  const width = 800
  const height = 220
  const padT = 20
  const padB = 28
  const padL = 0
  const padR = 0
  if (series.length < 2) {
    return (
      <Card>
        <CardHead
          title={
            <span className="inline-flex items-center gap-2">
              <LineChart size={16} className="text-brand-600" /> Ritmo de gasto
            </span>
          }
          subtitle="Real (sólido) vs ideal linear (tracejado) · R$/dia"
        />
        <CardBody>
          <p className="py-8 text-center text-xs text-neutral-500">
            Sem série diária — sincronize as contas de mídia no onboarding para ver o pacing.
          </p>
        </CardBody>
      </Card>
    )
  }

  const maxY =
    Math.max(
      ...series.map((s) => Math.max(s.spend, s.ideal)),
      projectedTotal ?? 0,
    ) || 1
  const stepX = (width - padL - padR) / (totalDays - 1)
  const toY = (v: number) => height - padB - (v / maxY) * (height - padT - padB)
  const toX = (d: number) => padL + (d - 1) * stepX

  // Corta séries em duas: até hoje (sólido) e depois de hoje (dashed projection)
  const historyPts = series.filter((p) => p.day <= todayDay)
  const idealLine = series
  const realLine = historyPts
  const futureIdx = series.findIndex((p) => p.day === todayDay)
  const currentSpend = series[futureIdx]?.spend ?? 0

  const pathFrom = (pts: { day: number; spend: number }[]) =>
    pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.day).toFixed(1)} ${toY(p.spend).toFixed(1)}`)
      .join(' ')
  const idealPath = idealLine
    .map(
      (p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.day).toFixed(1)} ${toY(p.ideal).toFixed(1)}`,
    )
    .join(' ')
  const realPath = pathFrom(realLine)
  const area = `${realPath} L ${toX(todayDay).toFixed(1)} ${height - padB} L 0 ${height - padB} Z`

  const projEnd = projectedTotal ?? currentSpend
  const projectionPath = `M ${toX(todayDay).toFixed(1)} ${toY(currentSpend).toFixed(1)} L ${toX(totalDays).toFixed(1)} ${toY(projEnd).toFixed(1)}`

  return (
    <Card>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <LineChart size={16} className="text-brand-600" /> Ritmo de gasto · carteira
          </span>
        }
        subtitle="Real (sólido) vs ideal linear (tracejado) · R$/dia"
      />
      <CardBody>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-label={`pacing carteira dia ${todayDay} de ${totalDays}`}
        >
          <defs>
            <linearGradient id="pacing-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={width}
              y1={height - padB - f * (height - padT - padB)}
              y2={height - padB - f * (height - padT - padB)}
              stroke="var(--color-neutral-100)"
              strokeDasharray="3 3"
            />
          ))}
          {/* today marker */}
          <line
            x1={toX(todayDay)}
            y1="0"
            x2={toX(todayDay)}
            y2={height - padB}
            stroke="var(--color-brand-600)"
            strokeDasharray="4 4"
          />
          <text
            x={toX(todayDay) + 4}
            y="14"
            fontSize="10"
            fill="var(--color-brand-700)"
            fontWeight="600"
          >
            hoje · dia {todayDay}
          </text>
          {/* ideal */}
          <path d={idealPath} stroke="var(--color-neutral-500)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
          {/* real area + line */}
          <path d={area} fill="url(#pacing-grad)" />
          <path d={realPath} stroke="var(--color-brand-600)" strokeWidth="2.5" fill="none" />
          {/* projection */}
          <path d={projectionPath} stroke="var(--color-success-600)" strokeWidth="2" strokeDasharray="5 3" fill="none" />
          {/* axis labels */}
          <text x="0" y={height - 6} fontSize="10" fill="var(--color-neutral-500)">01</text>
          <text x={width / 2} y={height - 6} fontSize="10" fill="var(--color-neutral-500)" textAnchor="middle">
            dia {Math.round(totalDays / 2)}
          </text>
          <text x={width - 4} y={height - 6} fontSize="10" fill="var(--color-neutral-500)" textAnchor="end">
            dia {totalDays}
          </text>
        </svg>
        <div className="flex flex-wrap gap-4 text-[11px] text-neutral-500 mt-2">
          <LegendDot color="var(--color-brand-600)" label="Gasto real" />
          <LegendDot color="var(--color-neutral-500)" label="Ideal linear" dashed />
          <LegendDot color="var(--color-success-600)" label="Projeção" dashed />
        </div>
      </CardBody>
    </Card>
  )
}

function LegendDot({
  color,
  label,
  dashed = false,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`inline-block w-3 h-[2px] ${dashed ? 'border-t-2 border-dashed' : ''}`}
        style={{ backgroundColor: dashed ? 'transparent' : color, borderColor: color }}
      />
      {label}
    </span>
  )
}
