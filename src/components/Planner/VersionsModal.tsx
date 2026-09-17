import { X } from 'lucide-react'
import type { FlowVersion } from '@/services/adapters/clientFlowsAdapter'

interface VersionsModalProps {
  versions: FlowVersion[]
  loading: boolean
  currentVersion: number
  onClose: () => void
  onRollback: (versionId: string, versionNumber: number) => void
}

/** Histórico de versões do flow com restauração por clique. */
export default function VersionsModal({ versions, loading, currentVersion, onClose, onRollback }: VersionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[var(--surface-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={event => event.stopPropagation()} role="dialog" aria-label="Histórico de versões">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Histórico de versões</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Versão atual: <strong>v{currentVersion}</strong> · Clique em qualquer snapshot pra restaurar</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">Nenhuma versão anterior salva.<br /><span className="text-2xs text-neutral-400">O histórico começa a gravar a partir da próxima edição.</span></div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {versions.map(version => {
                const date = new Date(version.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                return (
                  <button key={version.id} onClick={() => onRollback(version.id, version.version)} className="w-full flex items-center justify-between gap-4 px-5 py-3 text-left hover:bg-neutral-50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-2xs font-semibold border border-brand-100">v{version.version}</span>
                        <span className="text-2xs uppercase tracking-wider text-neutral-400 font-medium">{version.snapshot_reason}</span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 truncate">{version.name || 'Sem nome'}</p>
                      <p className="text-2xs text-neutral-500 mt-0.5">{date} · {version.nodes.length} nós · {version.edges.length} conexões</p>
                    </div>
                    <span className="text-xs font-medium text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Restaurar</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
