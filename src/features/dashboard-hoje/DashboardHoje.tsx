import { useMemo } from 'react'

import { formatMetric } from '@/lib/formatMetric'
import { HeroGreeting } from './components/HeroGreeting'
import { AnomaliesCard } from './components/AnomaliesCard'
import { TasksCard } from './components/TasksCard'
import { GoalsCard } from './components/GoalsCard'
import { WeekAgendaCard } from './components/WeekAgendaCard'
import { useHojeData } from './hooks/useHojeData'

/**
 * Home > view "Hoje" — hub diário da agência.
 * Handoff V2: 4 cards em grid-12 (3× col-4 + 1× col-12), sem emojis,
 * sem mock. Dados derivados do snapshot ClickUp; áreas sem fonte
 * mostram empty state.
 */
export function DashboardHoje() {
  const data = useHojeData()

  const weekRangeLabel = useMemo(() => {
    const first = data.week[0]?.date
    const last = data.week[data.week.length - 1]?.date
    if (!first || !last) return ''
    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}`
    const month = last.toLocaleDateString('pt-BR', { month: 'long' })
    return `${fmt(first)} — ${fmt(last)} de ${month}`
  }, [data.week])

  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = Math.max(0, lastDay - now.getDate())
  const periodLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const tasksDueToday = data.myTasks.filter(
    (t) =>
      t.due_date && new Date(`${t.due_date}T00:00:00`).toDateString() === now.toDateString(),
  ).length

  const meetingsThisWeek = data.week.reduce((acc, d) => acc + d.events.length, 0)

  return (
    <div className="max-w-layout mx-auto">
      <HeroGreeting
        salute={data.greeting.salute}
        userName={data.greeting.userName}
        dateLabel={data.dateLabel}
        activeClientsCount={data.activeClientsCount}
        monthInvestedLabel={
          data.monthInvested != null
            ? formatMetric(data.monthInvested, 'currency', { compact: true })
            : undefined
        }
        anomaliesCount={data.anomalies.filter((a) => a.severity === 'critical').length}
        tasksTodayCount={tasksDueToday}
        meetingsCount={meetingsThisWeek}
      />

      <div className="grid grid-cols-12 gap-4">
        <AnomaliesCard anomalies={data.anomalies} monitoredCount={data.activeClientsCount} />
        <TasksCard
          tasks={data.myTasks}
          doneCount={data.myTasksDoneCount}
          total={data.myTasksTotal}
        />
        <GoalsCard
          goals={data.goals}
          periodLabel={periodLabel}
          daysLeft={daysLeft}
        />
        <WeekAgendaCard week={data.week} rangeLabel={weekRangeLabel} />
      </div>
    </div>
  )
}
