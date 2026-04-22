import { Card, CardBody, CardHead } from '@/components/primitives'
import type { AlertEvent } from '../types'

interface Props {
  events: AlertEvent[]
}

const severityMap = {
  critical: { bg: 'bg-error-50 border-error-100',      fg: 'text-error-600',   label: 'CRÍTICO' },
  warning:  { bg: 'bg-warning-50 border-warning-100',  fg: 'text-warning-600', label: 'ATENÇÃO' },
  info:     { bg: 'bg-info-50 border-info-100',        fg: 'text-info-600',    label: 'INFO' },
} as const

function relativeTime(iso: string): string {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diff < 1) return 'agora'
  if (diff < 60) return `há ${diff}min`
  if (diff < 60 * 24) return `há ${Math.round(diff / 60)}h`
  return `há ${Math.round(diff / (60 * 24))}d`
}

export function AlertsFeed({ events }: Props) {
  return (
    <Card className="col-span-12 lg:col-span-4">
      <CardHead
        title="Últimos alertas"
        subtitle="Feed · últimas 48h"
      />
      <CardBody className="space-y-2.5 pt-0">
        {events.length === 0 ? (
          <p className="text-center text-sm text-neutral-500 py-6">
            Nenhum alerta recente. Regras ativas vão aparecer aqui quando dispararem.
          </p>
        ) : (
          events.map((e) => {
            const sv = severityMap[e.severity]
            return (
              <div key={e.id} className={`rounded-lg border ${sv.bg} p-3`}>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.05em]">
                  <span className={sv.fg}>
                    {sv.label} · {relativeTime(e.createdAt)}
                  </span>
                </div>
                <div className="text-[12.5px] mt-1 text-neutral-900">
                  {e.clientName && <b>{e.clientName}</b>} {e.title}
                </div>
                {e.body && <div className="text-[11px] text-neutral-600 mt-1">{e.body}</div>}
              </div>
            )
          })
        )}
      </CardBody>
    </Card>
  )
}
