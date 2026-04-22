import { Phone, Video } from 'lucide-react'

import { Card, CardBody, CardHead, Pill } from '@/components/primitives'
import type { PillTone } from '@/components/primitives'

interface Props {
  title: string
  when: Date
  endTime?: Date
  location: 'google_meet' | 'zoom' | 'whatsapp' | 'in_person' | string
  agenda: string[]
  relativeLabel: string
  relativeTone?: PillTone
  onOpenAgenda?: () => void
  onJoin?: () => void
  className?: string
}

const dayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/**
 * Micro-card "Próxima reunião" — auto-pauta gerada pela IA + CTA.
 * Fallback: se IA indisponível, agenda é a lista bruta do calendar.
 */
export function NextMeetingCard({
  title,
  when,
  endTime,
  location,
  agenda,
  relativeLabel,
  relativeTone = 'warning',
  onOpenAgenda,
  onJoin,
  className = '',
}: Props) {
  const startTime = when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const stopTime = endTime
    ? endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null
  const locLabel = formatLocation(location)

  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Phone size={16} className="text-brand-600" /> Próxima reunião
          </span>
        }
        subtitle="Auto-pauta gerada · pronta para enviar"
        actions={<Pill tone={relativeTone}>{relativeLabel}</Pill>}
      />
      <CardBody>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.08em]">
                {dayLabels[when.getDay()]}
              </div>
              <div className="text-lg font-bold leading-none tabular">{when.getDate()}</div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-neutral-900 truncate">{title}</div>
            <div className="text-xs text-neutral-600 inline-flex items-center gap-1.5">
              <span className="tabular">
                {startTime}
                {stopTime ? ` — ${stopTime}` : ''}
              </span>
              <span>·</span>
              <span>{locLabel}</span>
            </div>
          </div>
        </div>
        {agenda.length > 0 && (
          <>
            <div className="text-xs font-semibold text-neutral-700 mb-1.5">Pauta sugerida:</div>
            <ol className="space-y-1 text-[13px] text-neutral-700">
              {agenda.slice(0, 4).map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-neutral-400 tabular w-4 shrink-0">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="flex gap-1.5 mt-3">
          {onOpenAgenda && (
            <button
              onClick={onOpenAgenda}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
            >
              Abrir pauta completa
            </button>
          )}
          {onJoin && (
            <button
              onClick={onJoin}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700"
            >
              <Video size={12} /> Entrar na call
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function formatLocation(loc: string): string {
  switch (loc) {
    case 'google_meet': return 'Google Meet'
    case 'zoom':        return 'Zoom'
    case 'whatsapp':    return 'WhatsApp'
    case 'in_person':   return 'Presencial'
    default:            return loc
  }
}
