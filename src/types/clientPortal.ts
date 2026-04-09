/**
 * ============================================
 * CLIENT PORTAL — Sprint 1 (read-only, mobile-first)
 * ============================================
 * Narrow types for the `/c/:clientSlug/portal` surface. This is NOT
 * the same as the internal operations/planner/projeto views — the
 * portal is what the end client sees, so it intentionally omits
 * operational fields (internal comments, watchers, budgets, internal
 * assignees, etc).
 *
 * The UI never imports raw ClickUp shapes — only the types here.
 * The mapping lives in services/clientPortalService.ts.
 * ============================================
 */

/** Normalized task status category (5 buckets). */
export type TaskStatusCategory =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked'

export interface ClientPortalTaskStatus {
  /** Raw status label as it appears in ClickUp (free-form) */
  status: string
  /** Hex color for the status border-left accent */
  color: string
  /** Category bucket used for grouping in the UI */
  type: TaskStatusCategory
}

export interface ClientPortalAssignee {
  username: string
  /** Color swatch used for the avatar placeholder */
  color: string
  /** First letter for the avatar placeholder */
  initial: string
}

export interface ClientPortalTask {
  id: string
  name: string
  description?: string
  status: ClientPortalTaskStatus
  date_due: string | null
  /** Friendly label for the due date ("Hoje", "Atrasada 2 dias", null) */
  due_date_label: string | null
  assignees: ClientPortalAssignee[]
  /** Deep link into ClickUp — optional, only shown to internal users */
  url: string
}

export interface ClientPortalRoadmap {
  client_id: string
  client_name: string
  tasks: ClientPortalTask[]
  /** Computed in the data layer: (done / total) * 100, clamped 0–100 */
  progress_percentage: number
}

export interface ClientPortalKPI {
  /** Total spend for the period, in BRL */
  totalSpend: number
  /** Total leads attributed to the period */
  leads: number
  /** Cost per lead (null if leads == 0 — UI renders "—" instead of breaking math) */
  cpa: number | null
  /** ISO 4217 — currently always BRL */
  currency: string
  /** Human label for the period ("Últimos 30 dias", etc) */
  period_label: string
}

export interface ClientPortalBundle {
  roadmap: ClientPortalRoadmap | null
  kpis: ClientPortalKPI | null
  /** Whether the data came from the cached snapshot (true) or a live fetch (false) */
  stale: boolean
  /** ISO timestamp of the last snapshot refresh */
  last_synced_at: string | null
  source: 'cache' | 'live'
}
