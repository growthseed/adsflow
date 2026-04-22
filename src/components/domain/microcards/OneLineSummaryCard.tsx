import type { ReactNode } from 'react'
import { Copy, RotateCw, Send, Tag } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'

interface Props {
  summary: ReactNode
  onRegenerate?: () => void
  onCopy?: () => void
  onShareWhatsApp?: () => void
  onPasteIntoReport?: () => void
  sourceLabel?: string
  className?: string
}

/**
 * Micro-card "Resumo em 1 frase" — texto gerado pela AdsFlow AI,
 * copy-friendly pra relatório ou mensagem pro cliente.
 * Quando a IA não estiver configurada, passe um summary estático
 * (derivado de deltas reais) — o card continua funcional.
 */
export function OneLineSummaryCard({
  summary,
  onRegenerate,
  onCopy,
  onShareWhatsApp,
  onPasteIntoReport,
  sourceLabel = 'Gerado por AdsFlow AI · reutilizável no WhatsApp',
  className = '',
}: Props) {
  return (
    <Card
      className={`bg-gradient-to-br from-brand-50 to-white border-brand-100 ${className}`}
    >
      <CardHead
        title={
          <span className="inline-flex items-center gap-2 text-brand-700">
            <Tag size={16} className="text-brand-700" /> Resumo em 1 frase
          </span>
        }
        subtitle={sourceLabel}
        actions={
          onRegenerate ? (
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 hover:bg-white text-[11px] font-medium text-neutral-700"
            >
              <RotateCw size={11} /> regenerar
            </button>
          ) : undefined
        }
      />
      <CardBody>
        <p className="text-[22px] leading-[1.3] font-medium text-neutral-800 tracking-[-0.01em]">
          {summary}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {onCopy && (
            <ActionBtn icon={<Copy size={12} />} onClick={onCopy}>
              Copiar
            </ActionBtn>
          )}
          {onShareWhatsApp && (
            <ActionBtn icon={<Send size={12} />} onClick={onShareWhatsApp}>
              WhatsApp
            </ActionBtn>
          )}
          {onPasteIntoReport && (
            <ActionBtn onClick={onPasteIntoReport}>Colar em relatório</ActionBtn>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function ActionBtn({
  children,
  icon,
  onClick,
}: {
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700"
    >
      {icon}
      {children}
    </button>
  )
}
