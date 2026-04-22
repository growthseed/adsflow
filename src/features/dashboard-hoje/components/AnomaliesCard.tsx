import { AlertOctagon, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar, Card, CardBody, CardHead, Pill } from '@/components/primitives'
import type { DerivedAnomaly } from '../hooks/useHojeData'

interface Props {
  anomalies: DerivedAnomaly[]
  monitoredCount: number
}

export function AnomaliesCard({ anomalies, monitoredCount }: Props) {
  return (
    <Card className="col-span-12 lg:col-span-4 min-h-[280px] flex flex-col">
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <AlertOctagon size={16} className="text-error-600" />
            Anomalias detectadas
          </span>
        }
        subtitle={`Últimas 48h · IA monitorando ${monitoredCount} ${monitoredCount === 1 ? 'cliente' : 'clientes'}`}
        actions={
          <Link
            to="/anomalies"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
          >
            Ver todas <ArrowRight size={12} />
          </Link>
        }
      />
      <CardBody className="p-0 flex-1">
        {anomalies.length === 0 ? (
          <EmptyAnomalies />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {anomalies.slice(0, 3).map((a) => (
              <AnomalyRow key={a.id} anomaly={a} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function AnomalyRow({ anomaly }: { anomaly: DerivedAnomaly }) {
  const isCritical = anomaly.severity === 'critical'
  return (
    <li className="relative">
      <Link
        to={`/c/${anomaly.clientSlug}/overview`}
        className="flex gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
      >
        <span
          aria-hidden
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${
            isCritical ? 'bg-error-500' : 'bg-warning-500'
          }`}
        />
        <div className="pl-1 flex gap-3 flex-1 min-w-0">
          <Avatar name={anomaly.clientName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold text-neutral-900 truncate">{anomaly.clientName}</span>
              <Pill tone={isCritical ? 'error' : 'warning'}>{isCritical ? 'crítica' : 'aviso'}</Pill>
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-1.5 leading-snug">
              {anomaly.title}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {anomaly.detail} · {anomaly.relativeTime}
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}

function EmptyAnomalies() {
  return (
    <div className="h-full min-h-[200px] grid place-items-center px-6 py-8 text-center">
      <div className="max-w-[260px]">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-success-100 grid place-items-center text-success-600">
          <ShieldCheck size={18} strokeWidth={2} />
        </div>
        <div className="text-sm font-semibold text-neutral-900">Nenhuma anomalia crítica</div>
        <div className="text-xs text-neutral-500 mt-1">
          Carteira no ritmo. Regras ativas rodam de hora em hora.
        </div>
      </div>
    </div>
  )
}
