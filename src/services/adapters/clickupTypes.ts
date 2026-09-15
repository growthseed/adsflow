/**
 * ============================================
 * CLICKUP ADAPTER — types
 * ============================================
 * Shapes that the AdFlow UI consumes — normalized from raw
 * ClickUp MCP responses. The raw data is stored in a snapshot
 * JSON under /src/data/snapshots/ and refreshed by a cron
 * (or manually by re-running the MCP fetch script).
 *
 * The UI NEVER sees raw ClickUp payloads — only these normalized
 * shapes. When a real-time API endpoint replaces the snapshot,
 * the adapter stays identical.
 * ============================================
 */

export type ClickUpTaskStatus =
  /** Normalized statuses mapped from ClickUp's free-form statuses. */
  | 'urgent'
  | 'in_progress'
  | 'review'
  | 'upcoming'
  | 'backlog'
  | 'done'

export type ClickUpPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface ClickUpAssignee {
  id: string
  username: string
  initial: string
  color: string
  /** ClickUp profile photo, when the workspace exposes one. */
  avatar_url?: string | null
}

export interface ClickUpTask {
  id: string
  title: string
  status_raw: string
  status: ClickUpTaskStatus
  priority: ClickUpPriority
  due_date: string | null // ISO YYYY-MM-DD or null
  due_date_label: string | null // "Atrasada 2 dias", "Hoje", "Em 3 dias"
  days_late: number | null
  assignees: ClickUpAssignee[]
  list_id: string
  list_name: string
  list_color: string
  tags: string[]
  url: string
}

export interface AgencyClient {
  /** Slug lowercase, no accents, for URLs */
  slug: string
  /** Full display name */
  name: string
  /** Short label for avatar circle */
  short_name: string
  /** ClickUp folder ID in the Operações space */
  clickup_folder_id: string
  /** ClickUp folder display name (often "CLxx - Nome") */
  clickup_folder_name: string
  /** Avatar gradient (tailwind classes) */
  avatar_gradient: string
  /** Industry/vertical for display */
  industry?: string
  /** City for display */
  city?: string
  /** Total task count across all lists */
  task_count: number
  /** Tasks by status */
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
  /** Representative tasks for preview (sorted by due date, next 5) */
  upcoming_tasks: ClickUpTask[]
  /** All tasks for deep-dive (full project page) */
  all_tasks: ClickUpTask[]
  /** Timestamp when this snapshot was captured */
  last_synced_at: string
  /** Link to open the folder in ClickUp */
  clickup_url: string
}

export interface AgencySnapshot {
  captured_at: string
  workspace_id: string
  operations_space_id: string
  clients: AgencyClient[]
  /** Global aggregate across all clients */
  aggregate: {
    total_clients: number
    total_active_tasks: number
    total_overdue: number
    total_done_week: number
    on_time_rate: number
  }
}
