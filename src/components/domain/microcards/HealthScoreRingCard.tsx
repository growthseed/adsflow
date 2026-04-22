import { Heart } from 'lucide-react'

import { Card, CardBody, CardHead, ProgressBar } from '@/components/primitives'
import type { ProgressTone } from '@/components/primitives'

export interface HealthSubMetric {
  label: string
  score: number // 0-100
  tone: ProgressTone
}

interface Props {
  overallScore: number // 0-100
  label?: string
  subLabel?: string
  subMetrics: HealthSubMetric[]
  className?: string
}

/**
 * Micro-card "Health score" — ring gauge 0-100 + subscores.
 * Risco de churn deriva do score overall (>75 saudável, 55-75 atenção, <55 crítico).
 */
export function HealthScoreRingCard({
  overallScore,
  label,
  subLabel,
  subMetrics,
  className = '',
}: Props) {
  const status =
    overallScore >= 75
      ? { text: 'Saudável', tone: 'text-success-700' }
      : overallScore >= 55
      ? { text: 'Atenção', tone: 'text-warning-600' }
      : { text: 'Crítico', tone: 'text-error-600' }

  const C = 2 * Math.PI * 15 // circ of r=15
  const offset = C * (1 - overallScore / 100)
  const stroke =
    overallScore >= 75
      ? 'var(--color-success-500)'
      : overallScore >= 55
      ? 'var(--color-warning-500)'
      : 'var(--color-error-500)'

  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Heart size={16} className="text-success-600" /> Health score
          </span>
        }
        subtitle={subLabel}
      />
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--color-neutral-100)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-[20px] font-bold tabular text-neutral-900">
              {overallScore}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${status.tone}`}>{status.text}</div>
            {label && <div className="text-[11px] text-neutral-500">{label}</div>}
          </div>
        </div>
        {subMetrics.length > 0 && (
          <div className="mt-3 space-y-2">
            {subMetrics.map((sm) => (
              <div key={sm.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-600">{sm.label}</span>
                  <span className="tabular text-neutral-900">{sm.score}</span>
                </div>
                <ProgressBar value={sm.score} tone={sm.tone} ariaLabel={`${sm.label}: ${sm.score}`} />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
