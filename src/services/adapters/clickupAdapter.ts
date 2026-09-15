/**
 * ============================================
 * CLICKUP ADAPTER — normalization logic
 * ============================================
 * Converts raw ClickUp MCP responses into normalized shapes
 * consumed by the AdFlow UI.
 *
 * Two entry points:
 *  1. `loadSnapshot()` — reads the bundled JSON snapshot
 *     (refreshed by cron or manual MCP runs)
 *  2. `normalizeRawTask()` — public helper for future
 *     real-time fetches
 *
 * Status mapping (from ClickUp's free-form statuses):
 *  - "tarefas", "para fazer", "em andamento"     → in_progress
 *  - "em revisão", "aguardando", "review"         → review
 *  - "subir", "solicitação", "upcoming"           → upcoming
 *  - "backlog"                                    → backlog
 *  - "concluído", "done", "finalizado", "fechado" → done
 *  - urgent priority OR overdue                   → urgent
 * ============================================
 */

import type {
  ClickUpTask,
  ClickUpTaskStatus,
  ClickUpPriority,
  ClickUpAssignee,
  AgencyClient,
  AgencySnapshot,
} from './clickupTypes'

// =============================================================
// STATUS NORMALIZATION
// =============================================================

/** Map ClickUp raw status (often Portuguese) to normalized enum. */
function normalizeStatus(raw: string | null | undefined): ClickUpTaskStatus {
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

/** ClickUp priority codes → enum. */
function normalizePriority(p: unknown): ClickUpPriority {
  if (!p) return 'none'
  const str = String(p).toLowerCase()
  if (/urgent|^1$/.test(str)) return 'urgent'
  if (/high|^2$/.test(str)) return 'high'
  if (/medium|normal|^3$/.test(str)) return 'medium'
  if (/low|^4$/.test(str)) return 'low'
  return 'none'
}

// =============================================================
// DUE DATE FORMATTING
// =============================================================

function formatDueDate(dueMs: number | null): {
  iso: string | null
  label: string | null
  daysLate: number | null
} {
  if (!dueMs) return { iso: null, label: null, daysLate: null }

  const due = new Date(dueMs)
  const iso = due.toISOString().slice(0, 10)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)

  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let daysLate: number | null = null

  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    label = n === 1 ? 'Atrasada 1 dia' : `Atrasada ${n} dias`
    daysLate = n
  } else if (diffDays === 0) {
    label = 'Vence hoje'
  } else if (diffDays === 1) {
    label = 'Amanhã'
  } else if (diffDays < 7) {
    label = `Em ${diffDays} dias`
  } else if (diffDays < 14) {
    label = 'Em 1 semana'
  } else if (diffDays < 30) {
    label = `Em ${Math.ceil(diffDays / 7)} semanas`
  } else {
    label = due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return { iso, label, daysLate }
}

// =============================================================
// ASSIGNEE NORMALIZATION
// =============================================================

const ASSIGNEE_PALETTE = [
  '#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#A855F7',
]

function normalizeAssignees(raw: Array<{ id: number | string; username: string; profilePicture?: string | null }> | undefined): ClickUpAssignee[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((a, i) => ({
    id: String(a.id),
    username: a.username || 'Unknown',
    initial: (a.username || 'U').charAt(0).toUpperCase(),
    color: ASSIGNEE_PALETTE[i % ASSIGNEE_PALETTE.length],
    avatar_url: a.profilePicture || null,
  }))
}

// =============================================================
// RAW TASK → NORMALIZED
// =============================================================

interface RawClickUpTask {
  id: string
  name: string
  status?: string
  priority?: string | number | null
  assignees?: Array<{ id: number | string; username: string; profilePicture?: string | null }>
  tags?: Array<{ name: string }>
  due_date?: string | number | null
  url?: string
  list?: { id: string; name: string }
}

const LIST_COLORS: Record<string, string> = {
  'Gestão de Campanhas': '#4285F4',
  'Criação e Social Media': '#EC4899',
  'Criação de Mídia': '#EC4899',
  'Web/Dev': '#10B981',
  Resultados: '#8B5CF6',
  'Sucesso do Cliente': '#F59E0B',
  Onboarding: '#06B6D4',
  'Acessos & Info': '#94A3B8',
  'Escola=PA': '#14B8A6',
  'Kommo/IA': '#F97316',
  'Pagamentos Campanhas': '#84CC16',
  'Pagametnos Campanhas': '#84CC16',
  Financeiro: '#84CC16',
  'Landing Page / Site': '#10B981',
}

function listColorFor(name: string): string {
  for (const key in LIST_COLORS) {
    if (name.toLowerCase().includes(key.toLowerCase())) return LIST_COLORS[key]
  }
  return '#6B7280'
}

export function normalizeRawTask(raw: RawClickUpTask): ClickUpTask {
  const dueMs = raw.due_date ? Number(raw.due_date) : null
  const { iso, label, daysLate } = formatDueDate(dueMs)
  const status = normalizeStatus(raw.status)

  return {
    id: raw.id,
    title: raw.name,
    status_raw: raw.status || '',
    status: daysLate && daysLate > 0 && status !== 'done' ? 'urgent' : status,
    priority: normalizePriority(raw.priority),
    due_date: iso,
    due_date_label: label,
    days_late: daysLate,
    assignees: normalizeAssignees(raw.assignees),
    list_id: raw.list?.id || '',
    list_name: raw.list?.name?.trim() || 'Sem lista',
    list_color: listColorFor(raw.list?.name || ''),
    tags: (raw.tags || []).map((t) => t.name),
    url: raw.url || '',
  }
}

// =============================================================
// AGGREGATE STATS
// =============================================================

export function computeStats(tasks: ClickUpTask[]): AgencyClient['stats'] {
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
    if (t.status === 'done') {
      stats.done++
    } else {
      stats[t.status]++
      stats.total_active++
      if (t.days_late && t.days_late > 0) stats.overdue++
    }
  }

  return stats
}

// =============================================================
// SNAPSHOT LOADER
// =============================================================

import snapshotData from '@/data/snapshots/clickup-snapshot.json'
import supabase from '@/lib/supabase'

/** Bundled JSON (static fallback, always available) */
export const BUNDLED_CLICKUP_SNAPSHOT = snapshotData as unknown as AgencySnapshot

/** Session cache — once Supabase returns live data, we prefer it */
let liveSnapshot: AgencySnapshot | null = null

/**
 * Sync loader — returns live snapshot if it's been fetched this session,
 * else the bundled JSON. Used by helpers that can't easily be made async.
 */
export function loadSnapshot(): AgencySnapshot {
  return liveSnapshot || BUNDLED_CLICKUP_SNAPSHOT
}

/**
 * Async loader — queries the Supabase `agency_snapshots` table for the
 * latest ClickUp snapshot (written by /api/sync/clickup cron). Caches
 * the result in memory so subsequent calls (from other pages) are instant.
 *
 * Returns the bundled JSON if Supabase has no data or errors.
 */
export async function fetchLatestClickUpSnapshot(): Promise<AgencySnapshot> {
  try {
    const { data, error } = await supabase.rpc('latest_agency_snapshot', {
      snapshot_kind: 'clickup',
    })

    if (error) {
      console.warn('[clickupAdapter] Supabase fetch failed, using bundled:', error.message)
      return BUNDLED_CLICKUP_SNAPSHOT
    }

    if (!data) return BUNDLED_CLICKUP_SNAPSHOT

    const snapshot = data as unknown as AgencySnapshot
    liveSnapshot = snapshot // cache for sync callers
    return snapshot
  } catch (err) {
    console.warn('[clickupAdapter] Unexpected error, using bundled:', err)
    return BUNDLED_CLICKUP_SNAPSHOT
  }
}

export function getAgencyClients(): AgencyClient[] {
  return loadSnapshot().clients
}

/**
 * Cliente fictício de demonstração comercial — não existe pasta real no
 * ClickUp pra ele, então precisa desse fallback sintético pra rota
 * `/c/clinica-modelo/...` não ser barrada pelo ClientContextGuard como
 * "slug desconhecido". Ver `isDemo` em `clientDashboardSnapshots.ts`.
 */
const DEMO_CLIENT: AgencyClient = {
  slug: 'clinica-modelo',
  name: 'Clínica Modelo (Demo)',
  short_name: 'CM',
  clickup_folder_id: '',
  clickup_folder_name: '',
  avatar_gradient: 'from-teal-500 to-cyan-600',
  industry: 'Demonstração comercial',
  city: '',
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
  last_synced_at: new Date(0).toISOString(),
  clickup_url: '',
}

export function getClientBySlug(slug: string): AgencyClient | undefined {
  if (slug === DEMO_CLIENT.slug) return DEMO_CLIENT
  return getAgencyClients().find((c) => c.slug === slug)
}

/** Same as getClientBySlug but accepts an external snapshot (used with useQuery) */
export function findClientInSnapshot(
  snapshot: AgencySnapshot,
  slug: string,
): AgencyClient | undefined {
  return snapshot.clients.find((c) => c.slug === slug)
}
