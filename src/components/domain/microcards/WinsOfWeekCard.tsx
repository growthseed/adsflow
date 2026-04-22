import { Flag, Copy } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'

export type WinTone = 'success' | 'info' | 'warning' | 'brand'

export interface WinItem {
  id: string
  tone: WinTone
  value: string
  label: string
}

interface Props {
  items: WinItem[]
  onCopy?: () => void
  className?: string
}

const toneBg: Record<WinTone, string> = {
  success: 'from-success-50 to-success-100 border-success-100 text-success-700',
  info:    'from-info-50 to-info-100 border-info-100 text-info-600',
  warning: 'from-warning-50 to-warning-100 border-warning-100 text-warning-600',
  brand:   'from-brand-50 to-brand-100 border-brand-100 text-brand-700',
}

/**
 * Micro-card "Wins da semana" — highlights gradient, share-ready.
 * Botão de copiar permite exportar o conteúdo para WhatsApp/e-mail.
 */
export function WinsOfWeekCard({ items, onCopy, className = '' }: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Flag size={16} className="text-success-600" /> Wins da semana
          </span>
        }
        subtitle="Highlights · share-ready"
        actions={
          onCopy ? (
            <button
              onClick={onCopy}
              aria-label="copiar wins"
              className="w-7 h-7 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Copy size={14} />
            </button>
          ) : undefined
        }
      />
      <CardBody className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 py-4">Sem wins registrados nesta semana.</p>
        ) : (
          items.map((w) => (
            <div
              key={w.id}
              className={`bg-gradient-to-br ${toneBg[w.tone]} rounded-xl border px-3 py-2.5`}
            >
              <div className="text-[20px] font-bold tabular leading-none">{w.value}</div>
              <div className="text-xs mt-1">{w.label}</div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}
