/**
 * Client Portal — Task Timeline
 *
 * Groups tasks by status category and renders each group as a
 * collapsible section of cards. Each card has a status-colored
 * left border (border-l-4 using the hex from the status) and shows
 * title, due-date label, and up to 3 assignee avatars.
 *
 * Mobile-first: single column, tall tappable cards. Desktop just
 * gets wider cards — no kanban, no drag, no edit. Read-only by
 * product design.
 */

import { useMemo, useState } from 'react'
import type { ClientPortalTask, TaskStatusCategory } from '@/types/clientPortal'
import { getStatusLabel } from '@/services/clientPortalService'

interface TaskTimelineProps {
  tasks: ClientPortalTask[]
}

const DISPLAY_ORDER: TaskStatusCategory[] = [
  'blocked',
  'in_progress',
  'review',
  'todo',
  'done',
]

export default function TaskTimeline({ tasks }: TaskTimelineProps) {
  const grouped = useMemo(() => {
    const map: Record<TaskStatusCategory, ClientPortalTask[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    }
    for (const t of tasks) {
      map[t.status.type].push(t)
    }
    return map
  }, [tasks])

  return (
    <div className="space-y-5 px-3 sm:px-6 py-4">
      {DISPLAY_ORDER.map((category) => {
        const list = grouped[category]
        if (list.length === 0) return null
        return <TaskGroup key={category} category={category} tasks={list} />
      })}
    </div>
  )
}

// =============================================================
// GROUP
// =============================================================

interface TaskGroupProps {
  category: TaskStatusCategory
  tasks: ClientPortalTask[]
}

function TaskGroup({ category, tasks }: TaskGroupProps) {
  const [open, setOpen] = useState(category !== 'done')

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2 px-1"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {getStatusLabel(category)}
          </h3>
          <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {tasks.length}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  )
}

// =============================================================
// CARD
// =============================================================

interface TaskCardProps {
  task: ClientPortalTask
}

function TaskCard({ task }: TaskCardProps) {
  const dimmed = task.status.type === 'done'
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 p-3 sm:p-4 transition-colors ${
        dimmed ? 'opacity-70' : ''
      }`}
      style={{ borderLeftColor: task.status.color }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold leading-snug ${
                dimmed ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}
            >
              {task.name}
            </h4>
            <StatusPill status={task.status} />
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            {task.due_date_label && (
              <span className="inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {task.due_date_label}
              </span>
            )}
          </div>
        </div>

        {/* Avatares à direita */}
        {task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 flex-shrink-0">
            {task.assignees.slice(0, 3).map((a) => (
              <div
                key={a.username}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: a.color }}
                title={a.username}
              >
                {a.initial}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: ClientPortalTask['status'] }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: `${status.color}15`,
        color: status.color,
      }}
    >
      {status.status}
    </span>
  )
}
