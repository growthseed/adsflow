import { useMemo } from 'react'

import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import { loadPerformanceSnapshot } from '@/services/adapters/performanceAdapter'
import type { AgencyClient, ClickUpTask } from '@/services/adapters/clickupTypes'
import { useAuth } from '@/contexts/AuthContext'

export type AnomalySeverity = 'critical' | 'warning'

export interface DerivedAnomaly {
  id: string
  clientSlug: string
  clientName: string
  title: string
  detail: string
  severity: AnomalySeverity
  relativeTime: string
}

export interface DerivedWeekDay {
  /** 0 = domingo — usando date-fns padrão */
  date: Date
  label: string // "Seg", "Ter"...
  dayNumber: number
  isToday: boolean
  events: Array<{
    id: string
    time?: string
    title: string
    subtitle?: string
    tone: 'default' | 'urgent' | 'ok'
  }>
}

export interface HojeData {
  greeting: { salute: string; userName: string }
  dateLabel: string
  activeClientsCount: number
  monthInvested: number | null
  anomalies: DerivedAnomaly[]
  myTasks: ClickUpTask[]
  myTasksDoneCount: number
  myTasksTotal: number
  goals: Array<{
    key: 'budget' | 'leads' | 'reports'
    label: string
    current: number
    target: number | null
    unit: 'currency' | 'count'
    tone: 'success' | 'warning' | 'error' | 'brand'
    status: string
  }>
  week: DerivedWeekDay[]
  snapshotAt: Date
}

function salutationFor(now: Date): string {
  const h = now.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function relativeTimeBR(iso: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMin = Math.max(0, Math.round((now - then) / 60000))
  if (diffMin < 60) return `há ${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `há ${diffD}d`
}

function tasksWithDueInRange(tasks: ClickUpTask[], start: Date, end: Date) {
  return tasks.filter((t) => {
    if (!t.due_date) return false
    const d = new Date(`${t.due_date}T00:00:00`)
    return d >= start && d <= end
  })
}

/**
 * Deriva as 4 áreas da view "Hoje" a partir do snapshot do ClickUp
 * e do auth user. Sem mock: se não houver fonte, a UI mostra
 * EmptyState via ausência de itens (anomalies.length === 0).
 */
export function useHojeData(): HojeData {
  const { user } = useAuth()
  const snapshot = loadSnapshot()
  const perfSnapshot = loadPerformanceSnapshot()

  return useMemo(() => {
    const now = new Date()
    const snapshotAt = new Date(snapshot.captured_at)
    const userName = (user?.name || 'Agência').split(' ')[0]

    /* ─────────── agregado cross-cliente da Performance (mês corrente) ─────────── */
    const perfClients = Object.values(perfSnapshot.clients ?? {})
    const monthSpend = perfClients.reduce((a, c) => a + (c.blended?.total_spend ?? 0), 0)
    const monthLeads = perfClients.reduce((a, c) => a + (c.blended?.total_conversions ?? 0), 0)

    /* ─────────── anomalias derivadas do snapshot ─────────── */
    const anomalies: DerivedAnomaly[] = []
    for (const c of snapshot.clients) {
      // Critério V2 provisório: 2+ tarefas atrasadas vira "crítica";
      // 3+ urgentes em backlog vira "warning". Substituível quando
      // chegar a API real de anomalias de pacing/CPL/ROAS.
      if (c.stats.overdue >= 2) {
        anomalies.push({
          id: `${c.slug}-overdue`,
          clientSlug: c.slug,
          clientName: c.name,
          severity: 'critical',
          title: `${c.stats.overdue} tarefas atrasadas`,
          detail: `${c.stats.urgent} urgentes · ${c.stats.total_active} ativas`,
          relativeTime: relativeTimeBR(snapshot.captured_at),
        })
      } else if (c.stats.urgent >= 3) {
        anomalies.push({
          id: `${c.slug}-urgent`,
          clientSlug: c.slug,
          clientName: c.name,
          severity: 'warning',
          title: `${c.stats.urgent} tarefas urgentes`,
          detail: `sem atraso ainda · ${c.stats.total_active} ativas`,
          relativeTime: relativeTimeBR(snapshot.captured_at),
        })
      }
    }
    anomalies.sort((a) => (a.severity === 'critical' ? -1 : 1))

    /* ─────────── minhas tarefas (assigned ao user) ─────────── */
    const userEmail = user?.email?.toLowerCase() ?? ''
    const userHandle = userEmail.split('@')[0]
    const allTasks: ClickUpTask[] = snapshot.clients.flatMap((c: AgencyClient) => c.all_tasks)
    const mine = allTasks.filter((t) =>
      t.assignees.some(
        (a) => a.username?.toLowerCase().includes(userHandle) || a.username?.toLowerCase() === userEmail,
      ),
    )
    // Se o mapping falhou (nenhum match), cai pro agregado da carteira
    const myTasks = mine.length > 0 ? mine : allTasks.filter((t) => t.status !== 'done').slice(0, 8)
    const myTasksDoneCount = mine.filter((t) => t.status === 'done').length
    const myTasksTotal = mine.length > 0 ? mine.length : myTasks.length

    /* ─────────── metas do mês — budget/leads reais do Performance snapshot.
     * Target ainda depende de configuração por cliente (agency_goals, a
     * plugar na Sprint 5). Até lá mostramos valor atual + status "sem meta". */
    const goals: HojeData['goals'] = [
      {
        key: 'budget',
        label: 'Budget investido',
        current: monthSpend,
        target: null,
        unit: 'currency',
        tone: 'brand',
        status: monthSpend > 0 ? 'total da carteira neste período' : 'sem gasto registrado',
      },
      {
        key: 'leads',
        label: 'Leads entregues',
        current: monthLeads,
        target: null,
        unit: 'count',
        tone: monthLeads > 0 ? 'success' : 'brand',
        status: monthLeads > 0 ? 'conversões agregadas blended' : 'sem leads registrados',
      },
      {
        key: 'reports',
        label: 'Relatórios mensais enviados',
        current: 0,
        target: snapshot.clients.length || null,
        unit: 'count',
        tone: 'warning',
        status: `0 de ${snapshot.clients.length || 0}`,
      },
    ]

    /* ─────────── agenda da semana (task due_date ∈ [seg, sex]) ─────────── */
    const dayOfWeek = now.getDay() // 0 = domingo
    const monday = new Date(now)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    friday.setHours(23, 59, 59, 999)

    const weekTasks = tasksWithDueInRange(allTasks, monday, friday)
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
    const week: DerivedWeekDay[] = labels.map((label, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const sameDay = (t: ClickUpTask) =>
        t.due_date && new Date(`${t.due_date}T00:00:00`).toDateString() === d.toDateString()
      const events = weekTasks
        .filter(sameDay)
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.list_name,
          tone: (t.priority === 'urgent'
            ? 'urgent'
            : t.status === 'done'
            ? 'ok'
            : 'default') as 'default' | 'urgent' | 'ok',
        }))
      return {
        date: d,
        label,
        dayNumber: d.getDate(),
        isToday: d.toDateString() === now.toDateString(),
        events,
      }
    })

    const dateLabel = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })

    return {
      greeting: { salute: salutationFor(now), userName },
      dateLabel,
      activeClientsCount: snapshot.clients.length,
      monthInvested: monthSpend > 0 ? monthSpend : null,
      anomalies,
      myTasks: myTasks.slice(0, 7),
      myTasksDoneCount,
      myTasksTotal,
      goals,
      week,
      snapshotAt,
    }
  }, [snapshot, user])
}
