import { MapPin } from 'lucide-react'

import { Card, CardBody, CardHead, ProgressBar } from '@/components/primitives'
import type { ProgressTone } from '@/components/primitives'

export interface QuarterProgressItem {
  label: string
  currentDisplay: string
  targetDisplay?: string
  pct: number
  tone: ProgressTone
  status: string
}

interface Props {
  quarterLabel: string
  items: QuarterProgressItem[]
  className?: string
}

/**
 * Micro-card "Onde estamos" — progresso de metas do trimestre.
 * Item aceita valores pré-formatados pra UI não precisar parsear.
 */
export function QuarterProgressCard({ quarterLabel, items, className = '' }: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-brand-600" /> Onde estamos
          </span>
        }
        subtitle={`Progresso do trimestre · ${quarterLabel}`}
      />
      <CardBody className="space-y-4">
        {items.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 py-4">
            Configure metas trimestrais pra acompanhar o ritmo.
          </p>
        ) : (
          items.map((it) => (
            <div key={it.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-600">{it.label}</span>
                <span className="tabular">
                  <b className="text-neutral-900">{it.currentDisplay}</b>
                  {it.targetDisplay && <span className="text-neutral-500"> / {it.targetDisplay}</span>}
                </span>
              </div>
              <ProgressBar value={it.pct} tone={it.tone} ariaLabel={`${it.label}: ${it.pct}%`} />
              <div className={`text-[11px] mt-1 ${toneText(it.tone)}`}>{it.status}</div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}

function toneText(tone: ProgressTone): string {
  switch (tone) {
    case 'success': return 'text-success-700'
    case 'warning': return 'text-warning-600'
    case 'error':   return 'text-error-600'
    case 'info':    return 'text-info-600'
    default:        return 'text-neutral-500'
  }
}
