import type { ReactNode } from 'react'
import { MessageSquarePlus } from 'lucide-react'

interface Props {
  title: string
  children: ReactNode
  anchor?: string
  onComment?: (anchor: string) => void
  commentCount?: number
}

/**
 * Wrapper de seção do Portal — título + card container.
 * Quando anchor é passado, renderiza CTA de comentário (thread por anchor).
 */
export function PortalSection({
  title,
  children,
  anchor,
  onComment,
  commentCount = 0,
}: Props) {
  return (
    <section className="mb-4">
      <header className="flex items-center justify-between mb-1.5 px-1">
        <h3 className="text-[11px] eyebrow text-neutral-600">{title}</h3>
        {anchor && onComment && (
          <button
            onClick={() => onComment(anchor)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-brand-700"
            aria-label="comentar nesta seção"
          >
            <MessageSquarePlus size={12} />
            {commentCount > 0 ? commentCount : 'comentar'}
          </button>
        )}
      </header>
      <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-[var(--shadow-soft)]">
        {children}
      </div>
    </section>
  )
}
