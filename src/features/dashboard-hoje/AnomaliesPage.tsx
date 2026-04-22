import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowLeft, Clock, Filter, ShieldCheck } from 'lucide-react'

import { Avatar, Card, CardBody, CardHead, Chip, Pill } from '@/components/primitives'
import { useHojeData } from './hooks/useHojeData'
import type { AnomalySeverity, DerivedAnomaly } from './hooks/useHojeData'

type FilterKey = 'all' | 'critical' | 'warning'

/**
 * Página dedicada de anomalias — destino do "Ver todas" no AnomaliesCard.
 * Handoff V2: dados derivados do snapshot real (ClickUp + Performance),
 * nunca mock. Rota: /anomalies (nova) OU via state no botão.
 */
export default function AnomaliesPage() {
  const { anomalies, snapshotAt } = useHojeData()
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return anomalies
    return anomalies.filter((a) => a.severity === (filter as AnomalySeverity))
  }, [anomalies, filter])

  const critical = anomalies.filter((a) => a.severity === 'critical').length
  const warning = anomalies.filter((a) => a.severity === 'warning').length

  return (
    <div className="max-w-layout mx-auto">
      <header className="mb-5">
        <Link
          to="/_v4/operations?view=hoje"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 mb-2"
        >
          <ArrowLeft size={12} /> Voltar para Hoje
        </Link>
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-neutral-900">
          Anomalias detectadas
        </h1>
        <p className="text-sm text-neutral-500 mt-1 inline-flex items-center gap-1.5">
          <Clock size={12} /> Dados do snapshot capturado em{' '}
          <b className="tabular">
            {snapshotAt.toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </b>
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <StatCard tone="error" label="Críticas" value={critical} sub="tarefas atrasadas ≥ 2" />
        <StatCard tone="warning" label="Avisos" value={warning} sub="urgentes em backlog ≥ 3" />
        <StatCard tone="success" label="Monitoradas" value={anomalies.length} sub="clientes ativos" />
      </section>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-neutral-500" />
        <span className="text-xs text-neutral-500">Filtrar</span>
        <Chip tone={filter === 'all' ? 'active' : 'default'} onClick={() => setFilter('all')}>
          Todas ({anomalies.length})
        </Chip>
        <Chip tone={filter === 'critical' ? 'active' : 'default'} onClick={() => setFilter('critical')}>
          Críticas ({critical})
        </Chip>
        <Chip tone={filter === 'warning' ? 'active' : 'default'} onClick={() => setFilter('warning')}>
          Avisos ({warning})
        </Chip>
      </div>

      <Card>
        <CardHead
          title={
            <span className="inline-flex items-center gap-2">
              <AlertOctagon size={16} className="text-error-600" />
              {filtered.length} anomali{filtered.length === 1 ? 'a' : 'as'}
            </span>
          }
          subtitle="Ordenado por severidade"
        />
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyAnomalies />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filtered.map((a) => (
                <AnomalyRow key={a.id} anomaly={a} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function AnomalyRow({ anomaly }: { anomaly: DerivedAnomaly }) {
  const isCritical = anomaly.severity === 'critical'
  return (
    <li className="relative">
      <Link
        to={`/c/${anomaly.clientSlug}/projeto`}
        className="flex gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
      >
        <span
          aria-hidden
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${
            isCritical ? 'bg-error-500' : 'bg-warning-500'
          }`}
        />
        <div className="pl-1 flex gap-3 flex-1 min-w-0">
          <Avatar name={anomaly.clientName} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold text-neutral-900">{anomaly.clientName}</span>
              <Pill tone={isCritical ? 'error' : 'warning'}>
                {isCritical ? 'crítica' : 'aviso'}
              </Pill>
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-1">{anomaly.title}</div>
            <div className="text-xs text-neutral-500 mt-1">
              {anomaly.detail} · capturado {anomaly.relativeTime}
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}

function EmptyAnomalies() {
  return (
    <div className="min-h-[220px] grid place-items-center px-6 py-10 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-success-100 grid place-items-center text-success-600">
          <ShieldCheck size={22} strokeWidth={2} />
        </div>
        <div className="text-sm font-semibold text-neutral-900">
          Nenhuma anomalia com esse filtro
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          As regras são reavaliadas a cada hora (cron `alerts-evaluate`).
        </div>
      </div>
    </div>
  )
}

function StatCard({
  tone,
  label,
  value,
  sub,
}: {
  tone: 'error' | 'warning' | 'success'
  label: string
  value: number
  sub: string
}) {
  const cls = {
    error: 'border-l-error-500 text-error-600',
    warning: 'border-l-warning-500 text-warning-600',
    success: 'border-l-success-500 text-success-600',
  }[tone]
  return (
    <Card className={`p-4 border-l-[4px] ${cls.split(' ')[0]}`}>
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className={`text-[28px] font-bold tabular mt-1 ${cls.split(' ')[1]}`}>{value}</div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>
    </Card>
  )
}
