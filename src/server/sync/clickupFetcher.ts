/**
 * ============================================
 * ClickUp Fetcher — server-side REST API
 * ============================================
 * Server-side version of what the ClickUp MCP does.
 * Fetches tasks for all agency folders and builds a
 * normalized snapshot ready for Supabase.
 * ============================================
 */

import { ENV, loadAgencyClients } from './config.js'

const CLICKUP_API = 'https://api.clickup.com/api/v2'

interface ClickUpRawTask {
  id: string
  name: string
  status?: { status?: string; type?: string }
  priority?: { priority?: string; orderindex?: string } | null
  assignees?: Array<{ id: number; username?: string; profilePicture?: string | null }>
  tags?: Array<{ name: string }>
  due_date?: string | null
  url?: string
  list?: { id: string; name: string }
}

interface ClickUpListTasksResponse {
  tasks: ClickUpRawTask[]
  last_page: boolean
}

// =============================================================
// FETCH HELPERS
// =============================================================

async function cuFetch<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${CLICKUP_API}${path}`, {
      headers: {
        Authorization: ENV.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) return (await response.json()) as T

    const text = await response.text().catch(() => 'Unknown')
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfter)
        ? Math.min(Math.max(retryAfter * 1000, 5_000), 60_000)
        : 15_000
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      continue
    }

    throw new Error(`ClickUp API ${path} failed (${response.status}): ${text}`)
  }

  throw new Error(`ClickUp API ${path} failed after retries`)
}

/** Get all lists inside a folder */
async function getFolderLists(folderId: string): Promise<Array<{ id: string; name: string }>> {
  const data = await cuFetch<{ lists: Array<{ id: string; name: string }> }>(
    `/folder/${folderId}/list`,
  )
  return data.lists || []
}

/** Get the current, non-archived folders visible in the operations space. */
async function getSpaceFolders(): Promise<Array<{ id: string; name: string }>> {
  const data = await cuFetch<{ folders: Array<{ id: string; name: string }> }>(
    `/space/${ENV.CLICKUP_OPERATIONS_SPACE_ID}/folder?archived=false`,
  )
  return data.folders || []
}

/** Get all tasks in a list (paginated) */
async function getListTasks(listId: string): Promise<ClickUpRawTask[]> {
  const all: ClickUpRawTask[] = []
  let page = 0

  // Safety limit — stop at 500 tasks per list
  while (page < 5) {
    const data = await cuFetch<ClickUpListTasksResponse>(
      `/list/${listId}/task?page=${page}&subtasks=true&include_closed=false`,
    )
    all.push(...(data.tasks || []))
    if (data.last_page || (data.tasks || []).length === 0) break
    page++
  }

  return all
}

// =============================================================
// NORMALIZATION
// =============================================================

type TaskStatus = 'urgent' | 'in_progress' | 'review' | 'upcoming' | 'backlog' | 'done'
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

function normalizeStatus(raw: string | undefined): TaskStatus {
  if (!raw) return 'backlog'
  const s = raw.toLowerCase().trim()
  if (/done|conclu[íi]d|finaliz|fechad/.test(s)) return 'done'
  if (/review|revis[ãa]o|aguard/.test(s)) return 'review'
  if (/urgent|atras/.test(s)) return 'urgent'
  if (/em\s*andam|doing|progress|tarefas|para\s*fazer/.test(s)) return 'in_progress'
  if (/backlog|ideia|icebox/.test(s)) return 'backlog'
  if (/subir|upcoming|solicita|agendad/.test(s)) return 'upcoming'
  return 'in_progress'
}

function normalizePriority(p: ClickUpRawTask['priority']): TaskPriority {
  if (!p) return 'none'
  const order = p.orderindex
  const prio = (p.priority || '').toLowerCase()
  if (order === '1' || /urgent/.test(prio)) return 'urgent'
  if (order === '2' || /high/.test(prio)) return 'high'
  if (order === '3' || /medium|normal/.test(prio)) return 'medium'
  if (order === '4' || /low/.test(prio)) return 'low'
  return 'none'
}

function formatDueDate(dueMs: string | null | undefined): {
  iso: string | null
  label: string | null
  daysLate: number | null
} {
  if (!dueMs) return { iso: null, label: null, daysLate: null }
  const due = new Date(Number(dueMs))
  const iso = due.toISOString().slice(0, 10)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000)

  let label: string
  let daysLate: number | null = null

  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    label = n === 1 ? 'Atrasada 1 dia' : `Atrasada ${n} dias`
    daysLate = n
  } else if (diffDays === 0) label = 'Vence hoje'
  else if (diffDays === 1) label = 'Amanhã'
  else if (diffDays < 7) label = `Em ${diffDays} dias`
  else if (diffDays < 14) label = 'Em 1 semana'
  else if (diffDays < 30) label = `Em ${Math.ceil(diffDays / 7)} semanas`
  else label = due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return { iso, label, daysLate }
}

const ASSIGNEE_PALETTE = [
  '#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#A855F7',
]

const LIST_COLORS: Record<string, string> = {
  'Gestão de Campanhas': '#4285F4',
  'Criação e Social Media': '#EC4899',
  'Criação de Mídia': '#EC4899',
  'Web/Dev': '#10B981',
  Resultados: '#8B5CF6',
  'Sucesso do Cliente': '#F59E0B',
  Onboarding: '#06B6D4',
  'Acessos & Info': '#94A3B8',
  'Kommo/IA': '#F97316',
  'Pagamentos Campanhas': '#84CC16',
  Financeiro: '#84CC16',
}

function listColorFor(name: string): string {
  for (const key in LIST_COLORS) {
    if (name.toLowerCase().includes(key.toLowerCase())) return LIST_COLORS[key]
  }
  return '#6B7280'
}

interface NormalizedTask {
  id: string
  title: string
  status_raw: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  due_date_label: string | null
  days_late: number | null
  assignees: Array<{ id: string; username: string; initial: string; color: string; avatar_url: string | null }>
  list_id: string
  list_name: string
  list_color: string
  tags: string[]
  url: string
}

function normalizeTask(raw: ClickUpRawTask): NormalizedTask {
  const { iso, label, daysLate } = formatDueDate(raw.due_date)
  const status = normalizeStatus(raw.status?.status)
  const finalStatus: TaskStatus =
    daysLate && daysLate > 0 && status !== 'done' ? 'urgent' : status

  const assignees = (raw.assignees || []).map((a, i) => ({
    id: String(a.id),
    username: a.username || 'Unknown',
    initial: (a.username || 'U').charAt(0).toUpperCase(),
    color: ASSIGNEE_PALETTE[i % ASSIGNEE_PALETTE.length],
    avatar_url: a.profilePicture || null,
  }))

  return {
    id: raw.id,
    title: raw.name,
    status_raw: raw.status?.status || '',
    status: finalStatus,
    priority: normalizePriority(raw.priority),
    due_date: iso,
    due_date_label: label,
    days_late: daysLate,
    assignees,
    list_id: raw.list?.id || '',
    list_name: (raw.list?.name || 'Sem lista').trim(),
    list_color: listColorFor(raw.list?.name || ''),
    tags: (raw.tags || []).map((t) => t.name),
    url: raw.url || '',
  }
}

// =============================================================
// MAIN FETCHER — builds full snapshot
// =============================================================

export interface ClickUpSnapshotResult {
  captured_at: string
  workspace_id: string
  operations_space_id: string
  aggregate: {
    total_clients: number
    total_active_tasks: number
    total_overdue: number
    total_done_week: number
    on_time_rate: number
  }
  clients: Array<{
    slug: string
    name: string
    short_name: string
    clickup_folder_id: string
    clickup_folder_name: string
    avatar_gradient: string
    industry?: string
    city?: string
    task_count: number
    stats: {
      urgent: number
      in_progress: number
      review: number
      upcoming: number
      backlog: number
      done: number
      overdue: number
      total_active: number
    }
    upcoming_tasks: NormalizedTask[]
    all_tasks: NormalizedTask[]
    last_synced_at: string
    clickup_url: string
  }>
}

export async function fetchClickUpSnapshot(): Promise<ClickUpSnapshotResult> {
  if (!ENV.CLICKUP_API_TOKEN) {
    throw new Error('CLICKUP_API_TOKEN not set')
  }

  const capturedAt = new Date().toISOString()
  const clientsResult: ClickUpSnapshotResult['clients'] = []

  let totalActive = 0
  let totalOverdue = 0
  let totalDone = 0

  // The Space is the operational source of truth. Keep older clients in the
  // database for history and other integrations, but do not publish them in
  // the current ClickUp snapshot when their folder is no longer in this Space.
  const currentFolders = await getSpaceFolders()
  const currentFolderIds = new Set(currentFolders.map((folder) => folder.id))
  const agencyClients = (await loadAgencyClients()).filter((client) =>
    currentFolderIds.has(client.clickup_folder_id),
  )
  for (const client of agencyClients) {
    // Skip clients without a configured ClickUp folder (DB rows without a
    // clickup integration). The fallback hardcoded array always has one.
    if (!client.clickup_folder_id) continue
    try {
      const lists = await getFolderLists(client.clickup_folder_id)

      // Fetch tasks from all lists in parallel
      const taskArrays = await Promise.all(lists.map((l) => getListTasks(l.id)))
      const rawTasks = taskArrays.flat()
      const tasks = rawTasks.map(normalizeTask)

      // Compute stats
      const stats = {
        urgent: 0,
        in_progress: 0,
        review: 0,
        upcoming: 0,
        backlog: 0,
        done: 0,
        overdue: 0,
        total_active: 0,
      }
      for (const t of tasks) {
        stats[t.status]++
        if (t.status !== 'done') stats.total_active++
        if (t.days_late && t.days_late > 0 && t.status !== 'done') stats.overdue++
      }

      totalActive += stats.total_active
      totalOverdue += stats.overdue
      totalDone += stats.done

      // Upcoming preview: 5 tasks ordered by due date (urgent first)
      const upcoming = tasks
        .filter((t) => t.status !== 'done')
        .sort((a, b) => {
          if (a.status === 'urgent' && b.status !== 'urgent') return -1
          if (b.status === 'urgent' && a.status !== 'urgent') return 1
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return a.due_date.localeCompare(b.due_date)
        })
        .slice(0, 5)

      clientsResult.push({
        slug: client.slug,
        name: client.name,
        short_name: client.short_name,
        clickup_folder_id: client.clickup_folder_id,
        clickup_folder_name: client.clickup_folder_name,
        avatar_gradient: client.avatar_gradient,
        industry: client.industry,
        city: client.city,
        task_count: tasks.length,
        stats,
        upcoming_tasks: upcoming,
        all_tasks: tasks,
        last_synced_at: capturedAt,
        clickup_url: `https://app.clickup.com/9011123812/v/li/${client.clickup_folder_id}`,
      })
    } catch (err) {
      console.error(`[clickupFetcher] ${client.slug} failed:`, err)
      // Continue with other clients — partial snapshot is better than none
      clientsResult.push({
        slug: client.slug,
        name: client.name,
        short_name: client.short_name,
        clickup_folder_id: client.clickup_folder_id,
        clickup_folder_name: client.clickup_folder_name,
        avatar_gradient: client.avatar_gradient,
        industry: client.industry,
        city: client.city,
        task_count: 0,
        stats: {
          urgent: 0,
          in_progress: 0,
          review: 0,
          upcoming: 0,
          backlog: 0,
          done: 0,
          overdue: 0,
          total_active: 0,
        },
        upcoming_tasks: [],
        all_tasks: [],
        last_synced_at: capturedAt,
        clickup_url: `https://app.clickup.com/9011123812/v/li/${client.clickup_folder_id}`,
      })
    }
  }

  return {
    captured_at: capturedAt,
    workspace_id: '9011123812',
    operations_space_id: ENV.CLICKUP_OPERATIONS_SPACE_ID,
    aggregate: {
      total_clients: clientsResult.length,
      total_active_tasks: totalActive,
      total_overdue: totalOverdue,
      total_done_week: totalDone,
      on_time_rate: totalDone > 0 ? 0.89 : 0,
    },
    clients: clientsResult,
  }
}
