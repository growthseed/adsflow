import { useState } from 'react'
import { Check, Send, X } from 'lucide-react'

import { Avatar } from '@/components/primitives'
import { usePortalComments } from '../hooks/usePortalComments'

interface Props {
  clientId: string
  anchor: string | null
  anchorLabel?: string
  onClose: () => void
  canResolve?: boolean
}

function relative(iso: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diff < 1) return 'agora'
  if (diff < 60) return `há ${diff}m`
  if (diff < 60 * 24) return `há ${Math.round(diff / 60)}h`
  return `há ${Math.round(diff / (60 * 24))}d`
}

/**
 * Sheet mobile de comentários por âncora. Thread em tempo real via
 * Supabase Realtime. Compose simples (1 textarea + send).
 */
export function PortalCommentsSheet({
  clientId,
  anchor,
  anchorLabel,
  onClose,
  canResolve = false,
}: Props) {
  const open = !!anchor
  const { comments, post, resolve } = usePortalComments(clientId, anchor ?? '__none__')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const text = body.trim()
    if (!text || !anchor) return
    setSending(true)
    await post(text)
    setBody('')
    setSending(false)
  }

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-40 transition-opacity ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-[var(--shadow-overlay)] max-h-[80vh] flex flex-col transition-transform ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-neutral-900">
              Comentários {anchorLabel && <span className="text-neutral-500">· {anchorLabel}</span>}
            </div>
            <div className="text-[11px] text-neutral-500">
              {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="fechar"
            className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-8">
              Ainda sem comentários. Seja o primeiro!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className={`flex gap-2.5 ${c.resolvedAt ? 'opacity-60' : ''}`}
              >
                <Avatar name={c.authorName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 text-[11px]">
                    <span className="font-semibold text-neutral-900">{c.authorName}</span>
                    <span className="text-neutral-500">{relative(c.createdAt)}</span>
                    {c.resolvedAt && (
                      <span className="text-success-600 inline-flex items-center gap-0.5">
                        <Check size={10} /> resolvido
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-neutral-800 mt-0.5 whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                  {canResolve && !c.resolvedAt && (
                    <button
                      onClick={() => resolve(c.id)}
                      className="text-[11px] font-medium text-brand-700 mt-1"
                    >
                      marcar resolvido
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="flex gap-2 items-end p-3 border-t border-neutral-100">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Escreva um comentário…"
            className="flex-1 resize-none border border-neutral-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || body.trim().length === 0}
            className="shrink-0 w-10 h-10 grid place-items-center rounded-lg bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700"
            aria-label="enviar"
          >
            <Send size={16} />
          </button>
        </footer>
      </div>
    </div>
  )
}
