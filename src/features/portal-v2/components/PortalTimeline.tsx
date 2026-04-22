import type { PortalTimelineItem } from '../types'

interface Props {
  items: PortalTimelineItem[]
}

const toneBar: Record<PortalTimelineItem['tone'], string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error:   'bg-error-500',
  brand:   'bg-brand-600',
}

/**
 * Timeline "Últimas 48h" — só barra lateral colorida + texto.
 * Versão condensada do WhatsChangedCard para mobile portal.
 */
export function PortalTimeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-[11px] text-neutral-500 text-center py-3">
        Sem atualizações nas últimas 48h.
      </div>
    )
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((it) => (
        <li key={it.id} className="flex gap-3 py-2">
          <div className={`w-1.5 rounded-full shrink-0 ${toneBar[it.tone]}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-neutral-900 truncate">{it.title}</div>
            {it.subtitle && (
              <div className="text-[11px] text-neutral-500 truncate">{it.subtitle}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
