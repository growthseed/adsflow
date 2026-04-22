import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (thresholdPct: number) => Promise<void> | void
  clientsAffected: string[]
}

/**
 * Modal de ativação do auto-pause — padrão GitHub: usuário precisa
 * digitar "pausar" para confirmar. Handoff V2 spec #4.
 */
export function AutoPauseModal({ open, onClose, onConfirm, clientsAffected }: Props) {
  const [text, setText] = useState('')
  const [threshold, setThreshold] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const canConfirm = text.trim().toLowerCase() === 'pausar'

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSubmitting(true)
    try {
      await onConfirm(threshold)
      onClose()
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[var(--shadow-overlay)] w-full max-w-lg">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 text-warning-600 grid place-items-center shrink-0">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900">Ativar auto-pause</h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Campanhas que projetam estourar o teto vão pausar automaticamente 1×/h.
              </p>
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

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-neutral-700 mb-1.5">
              Margem de tolerância
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-[13px] font-bold tabular w-14 text-right">{threshold}%</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Pausa apenas se a projeção linear exceder o teto em mais de {threshold}%.
            </p>
          </div>

          <div>
            <div className="text-[12px] font-semibold text-neutral-700 mb-1.5">
              Clientes afetados hoje
            </div>
            {clientsAffected.length === 0 ? (
              <p className="text-[12px] text-neutral-500">
                Nenhum cliente atingiu a projeção no momento.
              </p>
            ) : (
              <ul className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1 text-[12px] text-neutral-800 max-h-32 overflow-y-auto">
                {clientsAffected.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-neutral-700 mb-1.5">
              Para confirmar, digite <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">pausar</code>
            </label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="pausar"
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 rounded-b-2xl border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="px-4 py-1.5 rounded-md bg-warning-600 hover:bg-warning-700 disabled:opacity-40 text-white text-xs font-semibold"
          >
            {submitting ? 'Ativando…' : 'Ativar auto-pause'}
          </button>
        </footer>
      </div>
    </div>
  )
}
