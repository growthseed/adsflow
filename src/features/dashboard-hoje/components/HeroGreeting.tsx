import { AlertTriangle, CalendarCheck2, ListTodo } from 'lucide-react'
import { Chip } from '@/components/primitives'

interface HeroGreetingProps {
  salute: string
  userName: string
  dateLabel: string
  activeClientsCount: number
  monthInvestedLabel?: string
  anomaliesCount: number
  tasksTodayCount: number
  meetingsCount: number
}

/**
 * Hero de greeting da Home V2. Handoff V2: sem emojis — substituídos
 * por ícones lucide em tons semânticos.
 */
export function HeroGreeting({
  salute,
  userName,
  dateLabel,
  activeClientsCount,
  monthInvestedLabel,
  anomaliesCount,
  tasksTodayCount,
  meetingsCount,
}: HeroGreetingProps) {
  return (
    <section className="mb-6">
      <h2 className="text-[26px] font-bold tracking-[-0.02em] text-neutral-900">
        {salute}, {userName}
      </h2>
      <p className="text-sm text-neutral-600 mt-1 capitalize">
        {dateLabel} ·{' '}
        <b className="text-neutral-900">
          {activeClientsCount} {activeClientsCount === 1 ? 'cliente' : 'clientes'}
        </b>{' '}
        com atividade
        {monthInvestedLabel && (
          <>
            {' · '}
            <b className="text-neutral-900 tabular">{monthInvestedLabel}</b> investido este mês
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {anomaliesCount > 0 && (
          <Chip tone="urgent" leading={<AlertTriangle size={14} />}>
            {anomaliesCount}{' '}
            {anomaliesCount === 1 ? 'anomalia crítica' : 'anomalias críticas'}
          </Chip>
        )}
        {tasksTodayCount > 0 && (
          <Chip leading={<ListTodo size={14} />}>
            {tasksTodayCount} {tasksTodayCount === 1 ? 'tarefa para hoje' : 'tarefas para hoje'}
          </Chip>
        )}
        {meetingsCount > 0 && (
          <Chip leading={<CalendarCheck2 size={14} />}>
            {meetingsCount}{' '}
            {meetingsCount === 1 ? 'reunião agendada' : 'reuniões agendadas'}
          </Chip>
        )}
      </div>
    </section>
  )
}
