import type { PortalNextCall as NextCall } from '../types'

interface Props {
  next: NextCall
  onJoin?: () => void
}

const dayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function PortalNextCallCard({ next, onJoin }: Props) {
  const startTime = next.when.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
        <div className="text-center">
          <div className="text-[9px] font-semibold uppercase tracking-[0.08em]">
            {dayLabels[next.when.getDay()]}
          </div>
          <div className="text-[15px] font-bold leading-none tabular">{next.when.getDate()}</div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-neutral-900 truncate">{next.title}</div>
        <div className="text-[11px] text-neutral-500 mt-0.5 tabular">
          {startTime} · pauta gerada pela IA
        </div>
      </div>
      {(next.meetUrl || onJoin) && (
        <button
          onClick={onJoin ?? (() => next.meetUrl && window.open(next.meetUrl, '_blank'))}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold"
        >
          entrar
        </button>
      )}
    </div>
  )
}
