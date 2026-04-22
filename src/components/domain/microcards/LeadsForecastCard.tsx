import { Gift } from 'lucide-react'

import { Card, CardBody, CardHead, Pill } from '@/components/primitives'

interface Props {
  /** Projeção de fim do mês */
  projected: number
  /** Meta configurada */
  goal: number | null
  /** Banda de erro da projeção (±) */
  errorBand?: number
  /** Pontos históricos (ex.: últimos 14 dias de leads/dia) */
  history: number[]
  /** Pontos projetados (ex.: próximos 8 dias) */
  projection: number[]
  className?: string
}

/**
 * Micro-card "Previsão de leads" — KPI grande + SVG area chart com
 * histórico sólido e projeção tracejada a partir do "hoje".
 */
export function LeadsForecastCard({
  projected,
  goal,
  errorBand,
  history,
  projection,
  className = '',
}: Props) {
  const deltaPct =
    goal != null && goal > 0 ? Math.round(((projected - goal) / goal) * 100) : null
  const pillTone: 'success' | 'warning' | 'error' | 'neutral' =
    deltaPct == null
      ? 'neutral'
      : deltaPct >= 5
      ? 'success'
      : deltaPct <= -5
      ? 'error'
      : 'warning'
  const pillLabel =
    deltaPct == null
      ? 'sem meta'
      : `${deltaPct > 0 ? 'acima' : deltaPct < 0 ? 'abaixo' : 'na meta'} · ${Math.abs(
          deltaPct,
        )}%`

  const combined = [...history, ...projection]
  if (combined.length < 2) {
    return (
      <Card className={className}>
        <CardHead
          title={
            <span className="inline-flex items-center gap-2">
              <Gift size={16} className="text-brand-600" /> Previsão de leads
            </span>
          }
          subtitle="IA projeta fim do mês baseado no ritmo"
        />
        <CardBody>
          <p className="py-4 text-center text-xs text-neutral-500">
            Dados históricos insuficientes para projeção.
          </p>
        </CardBody>
      </Card>
    )
  }

  const width = 320
  const height = 90
  const min = Math.min(...combined)
  const max = Math.max(...combined)
  const range = max - min || 1
  const stepX = width / (combined.length - 1)
  const toY = (v: number) => height - ((v - min) / range) * (height - 10) - 5
  const historyPath = combined
    .slice(0, history.length)
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(2)} ${toY(v).toFixed(2)}`)
    .join(' ')
  const projPath = combined
    .slice(history.length - 1)
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'} ${((history.length - 1 + i) * stepX).toFixed(2)} ${toY(v).toFixed(2)}`,
    )
    .join(' ')
  const area = `${historyPath} L ${((history.length - 1) * stepX).toFixed(2)} ${height} L 0 ${height} Z`
  const todayX = ((history.length - 1) * stepX).toFixed(2)

  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Gift size={16} className="text-brand-600" /> Previsão de leads
          </span>
        }
        subtitle="IA projeta fim do mês baseado no ritmo"
        actions={<Pill tone={pillTone}>{pillLabel}</Pill>}
      />
      <CardBody>
        <div className="flex items-baseline gap-3">
          <div className="text-[42px] font-bold text-brand-600 tabular tracking-[-0.02em] leading-none">
            {projected.toLocaleString('pt-BR')}
          </div>
          <div className="text-[13px] text-neutral-600">
            {errorBand != null && <>± {errorBand.toLocaleString('pt-BR')} leads</>}
            {goal != null && (
              <>
                {errorBand != null && ' · '}meta <b>{goal.toLocaleString('pt-BR')}</b>
              </>
            )}
          </div>
        </div>
        <svg
          role="img"
          aria-label={`projeção ${projected} leads, meta ${goal ?? '—'}`}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[80px] mt-3"
        >
          <defs>
            <linearGradient id="forecast-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#forecast-grad)" />
          <path d={historyPath} stroke="var(--color-brand-600)" strokeWidth={2} fill="none" />
          <path
            d={projPath}
            stroke="var(--color-brand-600)"
            strokeWidth={2}
            strokeDasharray="4 3"
            fill="none"
          />
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={height}
            stroke="var(--color-neutral-300)"
            strokeDasharray="3 3"
          />
          <circle
            cx={todayX}
            cy={toY(combined[history.length - 1])}
            r={3.5}
            fill="var(--color-brand-600)"
          />
        </svg>
        <div className="text-[11px] text-neutral-500 mt-2">
          Histórico ({history.length}d) → projeção ({projection.length}d)
        </div>
      </CardBody>
    </Card>
  )
}
