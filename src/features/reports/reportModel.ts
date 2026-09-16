import type { ClickUpTask, ClickUpTaskStatus } from '../../services/adapters/clickupTypes'
import type { AdPlatform, ClientPerformance } from '../../services/adapters/performanceTypes'

export const TASK_STATES: { key: ClickUpTaskStatus; label: string; color: string }[] = [
  { key: 'in_progress', label: 'Em andamento', color: '#257a72' },
  { key: 'upcoming', label: 'Agendadas', color: '#548bc5' },
  { key: 'review', label: 'Em revisão', color: '#bd8a2d' },
  { key: 'urgent', label: 'Urgentes', color: '#d65b57' },
  { key: 'backlog', label: 'Backlog', color: '#a1a9b1' },
  { key: 'done', label: 'Concluídas', color: '#72a65a' },
]

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function weekDays(reference: Date) {
  const start = new Date(reference)
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { date: dateKey(date), label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }
  })
}

export function isOverdue(task: ClickUpTask, today: string) {
  return task.status !== 'done' && !!task.due_date && task.due_date < today
}

export interface TaskFilters {
  status: string
  assignee: string
  window: 'all' | 'week' | 'overdue' | 'undated'
  search: string
}

export function filterReportTasks(tasks: ClickUpTask[], filters: TaskFilters, reference: Date) {
  const today = dateKey(reference)
  const days = weekDays(reference)
  const search = filters.search.trim().toLocaleLowerCase('pt-BR')
  return tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.assignee === 'unassigned' && task.assignees.length > 0) return false
    if (!['all', 'unassigned'].includes(filters.assignee) && !task.assignees.some((person) => person.id === filters.assignee)) return false
    if (filters.window === 'week' && (!task.due_date || task.due_date < days[0].date || task.due_date > days[6].date)) return false
    if (filters.window === 'overdue' && !isOverdue(task, today)) return false
    if (filters.window === 'undated' && task.due_date) return false
    return !search || `${task.title} ${task.list_name}`.toLocaleLowerCase('pt-BR').includes(search)
  }).sort((a, b) => {
    const late = Number(isOverdue(b, today)) - Number(isOverdue(a, today))
    return late || (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.title.localeCompare(b.title)
  })
}

export function summarizeMedia(performance: ClientPerformance | null, channel: 'all' | AdPlatform) {
  const accounts = performance ? Object.values(performance.platforms).filter((account) =>
    (channel === 'all' || account.platform === channel) && account.connected,
  ) : []
  const sum = (field: 'spend' | 'conversions' | 'clicks' | 'impressions') =>
    accounts.reduce((total, account) => total + account.summary[field], 0)
  const spend = sum('spend'), conversions = sum('conversions'), clicks = sum('clicks'), impressions = sum('impressions')
  const days = new Map<string, { date: string; spend: number; conversions: number }>()
  for (const account of accounts) for (const day of account.daily) {
    const row = days.get(day.date) ?? { date: day.date, spend: 0, conversions: 0 }
    row.spend += day.spend
    row.conversions += day.conversions
    days.set(day.date, row)
  }
  return {
    accounts, spend, conversions, clicks, impressions,
    cpa: conversions > 0 ? spend / conversions : null,
    ctr: impressions > 0 ? clicks / impressions * 100 : null,
    daily: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    campaigns: accounts.flatMap((account) => account.campaigns).sort((a, b) => b.metrics.spend - a.metrics.spend),
  }
}
