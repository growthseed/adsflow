import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'

import { Avatar, Card, CardBody, CardHead } from '@/components/primitives'

export interface RecentDecisionItem {
  id: string
  authorName: string
  headline: ReactNode
  meta?: string
}

interface Props {
  items: RecentDecisionItem[]
  onViewAll?: () => void
  className?: string
}

/**
 * Micro-card "Últimas decisões" — log público agência ↔ cliente.
 * Ordem cronológica decrescente; show first 3.
 */
export function RecentDecisionsCard({ items, onViewAll, className = '' }: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <MessageCircle size={16} className="text-neutral-600" /> Últimas decisões
          </span>
        }
        subtitle="Log público · agência ↔ cliente"
        actions={
          onViewAll ? (
            <button
              onClick={onViewAll}
              className="text-xs font-medium text-brand-700 hover:text-brand-900"
            >
              ver tudo
            </button>
          ) : undefined
        }
      />
      <CardBody>
        {items.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 py-4">Nenhuma decisão registrada.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.slice(0, 3).map((d) => (
              <li key={d.id} className="flex gap-3 py-2.5">
                <Avatar name={d.authorName} size="md" />
                <div className="flex-1 min-w-0 text-[13px]">
                  <div className="text-neutral-900">{d.headline}</div>
                  {d.meta && <div className="text-[11px] text-neutral-500 mt-0.5">{d.meta}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
