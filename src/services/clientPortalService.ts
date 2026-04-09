/**
 * ============================================
 * CLIENT PORTAL SERVICE
 * ============================================
 * Single entry point for the /c/:clientSlug/portal page. Wraps the
 * existing ClickUp and Performance adapters, narrows/sanitizes their
 * output into portal-specific shapes, and returns a ClientPortalBundle
 * that the UI can consume without ever touching raw snapshots.
 *
 * IMPORTANT: the portal is READ-ONLY and CLIENT-FACING. This service
 * is the place where operational fields (budgets, internal comments,
 * watchers, internal assignees) get stripped. Nothing downstream of
 * this file should reintroduce them.
 * ============================================
 */

import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import type {
  ClientPortalBundle,
  ClientPortalKPI,
  ClientPortalRoadmap,
  ClientPortalTask,
  ClientPortalTaskStatus,
  TaskStatusCategory,
} from '@/types/clientPortal'
import type { ClickUpTask, ClickUpTaskStatus } from '@/services/adapters/clickupTypes'

// =============================================================
// STATUS NORMALIZATION (agency-side → portal-side)
// =============================================================
// The agency snapshot already normalizes raw ClickUp statuses into
// 6 internal buckets. We collapse those into the 5-bucket category
// the portal exposes (see src/types/clientPortal.ts).

const STATUS_MAP: Record<ClickUpTaskStatus, TaskStatusCategory> = {
  urgent: 'blocked',
  in_progress: 'in_progress',
  review: 'review',
  upcoming: 'todo',
  backlog: 'todo',
  done: 'done',
}

const STATUS_COLORS: Record<TaskStatusCategory, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
}

const STATUS_LABELS: Record<TaskStatusCategory, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  done: 'Concluído',
  blocked: 'Bloqueado',
}

export function getStatusLabel(type: TaskStatusCategory): string {
  return STATUS_LABELS[type]
}

// =============================================================
// TASK SANITIZATION
// =============================================================

function toPortalTask(task: ClickUpTask): ClientPortalTask {
  const category = STATUS_MAP[task.status] ?? 'todo'
  const portalStatus: ClientPortalTaskStatus = {
    status: task.status_raw,
    color: STATUS_COLORS[category],
    type: category,
  }
  return {
    id: task.id,
    name: task.title,
    // description intentionally omitted — ClickUp snapshot doesn't carry
    // sanitized public descriptions yet. Add once the cron is extended.
    status: portalStatus,
    date_due: task.due_date,
    due_date_label: task.due_date_label,
    assignees: task.assignees.map((a) => ({
      username: a.username,
      color: a.color,
      initial: a.initial,
    })),
    url: task.url,
  }
}

function computeProgressPercentage(tasks: ClientPortalTask[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status.type === 'done').length
  return Math.round((done / tasks.length) * 100)
}

// =============================================================
// KPI COMPOSITION
// =============================================================

function toPortalKPI(
  performance: ReturnType<typeof getClientPerformance>,
): ClientPortalKPI | null {
  if (!performance) return null
  const { blended, period } = performance
  const leads = blended.total_conversions
  const totalSpend = blended.total_spend
  // `cpa` is defined only when we can divide safely.
  const cpa = leads > 0 ? totalSpend / leads : null

  return {
    totalSpend,
    leads,
    cpa,
    currency: 'BRL',
    period_label: period.label,
  }
}

// =============================================================
// PUBLIC API
// =============================================================

/**
 * Resolve the full portal bundle (KPIs + roadmap) for a given client
 * slug. Reads from the cached snapshots on disk — no ClickUp / Meta /
 * Google calls happen here. When the cached data is missing a piece,
 * that piece is returned as `null` rather than throwing, so the UI
 * can render gracefully.
 */
export function getClientPortalBundle(clientSlug: string): ClientPortalBundle {
  const client = getClientBySlug(clientSlug)
  const performance = getClientPerformance(clientSlug)

  let roadmap: ClientPortalRoadmap | null = null
  if (client) {
    // Prefer the full list when it's populated (when the cron scraped
    // everything). Fall back to the sample upcoming_tasks for clients
    // that only have a preview captured.
    const source = client.all_tasks.length > 0 ? client.all_tasks : client.upcoming_tasks
    const tasks = source.map(toPortalTask)
    roadmap = {
      client_id: client.slug,
      client_name: client.name,
      tasks,
      progress_percentage: computeProgressPercentage(tasks),
    }
  }

  const kpis = toPortalKPI(performance)

  // `last_synced_at` prefers ClickUp because tasks are the primary
  // surface; performance is a secondary KPI strip.
  const last_synced_at =
    client?.last_synced_at ?? performance?.last_synced_at ?? null

  return {
    roadmap,
    kpis,
    stale: true,
    last_synced_at,
    source: 'cache',
  }
}
