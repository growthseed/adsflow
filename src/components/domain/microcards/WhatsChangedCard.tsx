import type { ReactNode } from 'react'
import { Compass, Check, Minus, Plus, FileText, AlertCircle } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'

export type WhatsChangedKind = 'add' | 'check' | 'alert' | 'file' | 'remove'

export interface WhatsChangedItem {
  id: string
  kind: WhatsChangedKind
  headline: ReactNode
  sub?: string
}

interface Props {
  sinceLabel: string
  items: WhatsChangedItem[]
  className?: string
}

const kindIcon = {
  add:    { Icon: Plus,         bg: 'bg-success-50', fg: 'text-success-600' },
  check:  { Icon: Check,        bg: 'bg-info-50',    fg: 'text-info-600'    },
  alert:  { Icon: AlertCircle,  bg: 'bg-error-50',   fg: 'text-error-600'   },
  file:   { Icon: FileText,     bg: 'bg-neutral-100',fg: 'text-neutral-600' },
  remove: { Icon: Minus,        bg: 'bg-warning-50', fg: 'text-warning-600' },
}

/**
 * Micro-card "O que mudou" — timeline compacta de eventos desde o
 * último login. Plugável em Client Overview, Performance e Portal.
 */
export function WhatsChangedCard({ sinceLabel, items, className = '' }: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Compass size={16} className="text-neutral-600" /> O que mudou
          </span>
        }
        subtitle={`Desde ${sinceLabel}`}
      />
      <CardBody className="pt-0">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-500">Nenhuma atividade recente.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((it) => {
              const { Icon, bg, fg } = kindIcon[it.kind]
              return (
                <li key={it.id} className="flex items-center gap-3 py-2">
                  <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${bg} ${fg}`}>
                    <Icon size={12} strokeWidth={2.5} />
                  </span>
                  <div className="flex-1 min-w-0 text-[13px]">
                    <div className="text-neutral-900 truncate">{it.headline}</div>
                    {it.sub && <div className="text-[11px] text-neutral-500 truncate">{it.sub}</div>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
