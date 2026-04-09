/**
 * ============================================
 * Client Project Page — AdFlow v4 (Sprint 2)
 * ============================================
 * Módulo "Projeto" — 1 dos 3 pillars.
 * Mostra demandas do cliente (sync com ClickUp) agrupadas por
 * urgência. Layout Linear-inspired: linhas compactas, seções
 * colapsáveis, cores dessaturadas, ações on hover.
 *
 * Rota: /c/:clientSlug/projeto
 * ============================================
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'

import { PageHeader, EmptyState } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import type {
  ClickUpTask,
  ClickUpPriority,
  ClickUpAssignee,
} from '@/services/adapters/clickupTypes'

type FilterKey = 'all' | 'mine' | 'urgent' | 'high'

export default function ClientProjectPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()

  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  const [filter, setFilter] = useState<FilterKey>('all')
  const [showDone, setShowDone] = useState(false)

  if (!client) return <Navigate to="/_v4/operations" replace />

  // Prefer all_tasks if populated, otherwise upcoming_tasks (snapshot fallback)
  const allTasks: ClickUpTask[] =
    client.all_tasks.length > 0 ? client.all_tasks : client.upcoming_tasks

  const filtered = useMemo(() => {
    switch (filter) {
      case 'urgent':
        return allTasks.filter((t) => t.priority === 'urgent' || t.status === 'urgent')
      case 'high':
        return allTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent')
      case 'mine':
        return allTasks
      default:
        return allTasks
    }
  }, [allTasks, filter])

  const stats = client.stats

  const urgentTasks = filtered.filter((t) => t.status === 'urgent')
  const inProgressTasks = filtered.filter((t) => t.status === 'in_progress')
  const reviewTasks = filtered.filter((t) => t.status === 'review')
  const upcomingTasks = filtered.filter((t) => t.status === 'upcoming' || t.status === 'backlog')
  const doneTasks = filtered.filter((t) => t.status === 'done')

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Projeto"
        subtitle={`${client.name} · ${stats.total_active} tarefas ativas`}
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Projeto' },
        ]}
        leading={<ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />}
        actions={
          <button
            onClick={() => navigate(`/c/${client.slug}/overview`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar à visão geral
          </button>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ──────────────────────────────────────────────────
            STATS STRIP — métricas rápidas do projeto
            Mobile: 4-col horizontal scroll with snap; sm+: regular grid
            ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatPill
            label="Urgentes"
            value={stats.urgent}
            color="error"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />
          <StatPill
            label="Em andamento"
            value={stats.in_progress}
            color="brand"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatPill
            label="Em revisão"
            value={stats.review}
            color="warning"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
          <StatPill
            label="Concluídas"
            value={stats.done}
            color="success"
            subtitle="últimos 7 dias"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </section>

        {/* ──────────────────────────────────────────────────
            FILTER PILLS — sticky on mobile for quick access
            ────────────────────────────────────────────────── */}
        <section className="sticky top-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 sm:py-0 bg-[var(--surface-page)]/95 backdrop-blur sm:backdrop-blur-none sm:bg-transparent flex items-center gap-2 overflow-x-auto no-scrollbar">
          <FilterPill
            label="Todas"
            count={allTasks.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterPill
            label="Urgentes"
            count={allTasks.filter((t) => t.status === 'urgent').length}
            active={filter === 'urgent'}
            onClick={() => setFilter('urgent')}
            variant="error"
          />
          <FilterPill
            label="Alta prioridade"
            count={allTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent').length}
            active={filter === 'high'}
            onClick={() => setFilter('high')}
          />
        </section>

        {/* ──────────────────────────────────────────────────
            SECTIONS (ordered by urgency)
            ────────────────────────────────────────────────── */}
        {urgentTasks.length === 0 &&
          inProgressTasks.length === 0 &&
          reviewTasks.length === 0 &&
          upcomingTasks.length === 0 && (
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
              <EmptyState
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
                title="Nenhuma tarefa pendente"
                description="Tudo em dia nesse cliente 🎉 Volte à Visão Geral para explorar outros módulos."
              />
            </div>
          )}

        {urgentTasks.length > 0 && (
          <TaskSection
            label="Urgente"
            icon="🔥"
            tasks={urgentTasks}
            defaultOpen
            accent="error"
          />
        )}

        {inProgressTasks.length > 0 && (
          <TaskSection
            label="Em andamento"
            icon="🏃"
            tasks={inProgressTasks}
            defaultOpen
            accent="brand"
          />
        )}

        {reviewTasks.length > 0 && (
          <TaskSection
            label="Aguardando revisão"
            icon="👀"
            tasks={reviewTasks}
            defaultOpen
            accent="warning"
          />
        )}

        {upcomingTasks.length > 0 && (
          <TaskSection
            label="Próximos prazos"
            icon="📅"
            tasks={upcomingTasks}
            defaultOpen
            accent="neutral"
          />
        )}

        {doneTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowDone((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">✅</span>
                <span className="font-semibold">
                  Concluídas na semana
                </span>
                <span className="text-2xs text-neutral-400 tabular-nums bg-neutral-100 group-hover:bg-neutral-200 px-1.5 py-0.5 rounded-full transition-colors">
                  {doneTasks.length}
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
                className={`transition-transform duration-fast ${showDone ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showDone && (
              <div className="mt-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                {doneTasks.map((t, i) => (
                  <TaskRow key={t.id} task={t} isLast={i === doneTasks.length - 1} dimmed />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dev note */}
        <div className="p-3 rounded-lg bg-warning-50 border border-warning-100 text-xs text-warning-700 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Dados de demonstração.</strong> Tarefas virão do ClickUp MCP em tempo real
            quando o adapter for conectado. O layout e as interações já são finais.
          </span>
        </div>
      </main>
    </div>
  )
}

// =============================================================
// STAT PILL — mini card no topo
// =============================================================

interface StatPillProps {
  label: string
  value: number
  subtitle?: string
  color: 'error' | 'warning' | 'success' | 'brand' | 'neutral'
  icon: React.ReactNode
}

function StatPill({ label, value, subtitle, color, icon }: StatPillProps) {
  const colors = {
    error: {
      bg: 'bg-error-50',
      border: 'border-error-100',
      text: 'text-error-700',
      iconBg: 'bg-error-100 text-error-600',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-100',
      text: 'text-warning-700',
      iconBg: 'bg-warning-100 text-warning-600',
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-100',
      text: 'text-success-700',
      iconBg: 'bg-success-100 text-success-600',
    },
    brand: {
      bg: 'bg-brand-50',
      border: 'border-brand-100',
      text: 'text-brand-700',
      iconBg: 'bg-brand-100 text-brand-600',
    },
    neutral: {
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      text: 'text-neutral-700',
      iconBg: 'bg-neutral-100 text-neutral-600',
    },
  } as const

  const c = colors[color]

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3 sm:p-4 flex items-center gap-3`}>
      <div className={`${c.iconBg} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-xl sm:text-2xl font-bold ${c.text} tabular-nums leading-none`}>
          {value}
        </div>
        <div className="text-2xs text-neutral-500 mt-1 truncate">
          {label}
          {subtitle && <span className="hidden sm:inline"> · {subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

// =============================================================
// FILTER PILL
// =============================================================

interface FilterPillProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
  variant?: 'default' | 'error'
}

function FilterPill({ label, count, active, onClick, variant = 'default' }: FilterPillProps) {
  const activeStyles =
    variant === 'error'
      ? 'bg-error-600 border-error-600 text-white'
      : 'bg-neutral-900 border-neutral-900 text-white'

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium
        border transition-all duration-fast flex-shrink-0
        ${active
          ? activeStyles
          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
        }
      `}
    >
      <span>{label}</span>
      <span
        className={`
          text-2xs tabular-nums px-1.5 py-0.5 rounded-full
          ${active ? 'bg-white/20' : 'bg-neutral-100'}
        `}
      >
        {count}
      </span>
    </button>
  )
}

// =============================================================
// TASK SECTION — collapsible group of tasks
// =============================================================

interface TaskSectionProps {
  label: string
  icon: string
  tasks: ClickUpTask[]
  defaultOpen?: boolean
  accent: 'error' | 'warning' | 'success' | 'brand' | 'neutral'
}

function TaskSection({ label, icon, tasks, defaultOpen = true, accent }: TaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const accentBadge = {
    error: 'bg-error-50 text-error-700 border-error-100',
    warning: 'bg-warning-50 text-warning-700 border-warning-100',
    success: 'bg-success-50 text-success-700 border-success-100',
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  }[accent]

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-2 mb-2 rounded-lg hover:bg-neutral-100 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base" aria-hidden="true">{icon}</span>
          <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
          <span className={`text-2xs font-medium tabular-nums px-1.5 py-0.5 rounded-full border ${accentBadge}`}>
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
          className={`text-neutral-400 transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          {tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} isLast={i === tasks.length - 1} />
          ))}
        </div>
      )}
    </section>
  )
}

// =============================================================
// TASK ROW — Linear-style compact row
// =============================================================

interface TaskRowProps {
  task: ClickUpTask
  isLast?: boolean
  dimmed?: boolean
}

function TaskRow({ task, isLast = false, dimmed = false }: TaskRowProps) {
  return (
    <div
      className={`
        group flex items-start sm:items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 min-h-[52px]
        ${isLast ? '' : 'border-b border-[var(--border-subtle)]'}
        hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer
        ${dimmed ? 'opacity-60' : ''}
      `}
    >
      {/* Priority dot */}
      <div className="mt-1 sm:mt-0">
        <PriorityDot priority={task.priority} />
      </div>

      {/* Title + meta block */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-sm font-medium text-neutral-900 truncate leading-snug
              ${task.status === 'done' ? 'line-through text-neutral-500' : ''}
            `}
          >
            {task.title}
          </span>
        </div>

        {/* Mobile meta row — due date + list + tags packed tight below title */}
        <div className="flex sm:hidden items-center gap-1.5 mt-1.5 flex-wrap">
          <DueDateBadge task={task} />
          {task.list_name && (
            <span className="inline-flex items-center gap-1 text-2xs text-neutral-500">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: task.list_color }}
              />
              <span className="truncate max-w-[100px]">{task.list_name}</span>
            </span>
          )}
          {task.tags.slice(0, 1).map((tag) => (
            <span key={tag} className="text-2xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Desktop tag row */}
        {task.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 mt-0.5">
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-2xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* List badge (desktop only — mobile shows it inline above) */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: task.list_color }}
        />
        <span className="text-2xs text-neutral-500 truncate max-w-[120px]">{task.list_name}</span>
      </div>

      {/* Due date (desktop only — mobile shows it inline above) */}
      <div className="flex-shrink-0 hidden sm:block">
        <DueDateBadge task={task} />
      </div>

      {/* Assignees */}
      <div className="flex-shrink-0 flex items-center -space-x-1.5 mt-0.5 sm:mt-0">
        {task.assignees.slice(0, 3).map((a) => (
          <AssigneeAvatar key={a.id} assignee={a} />
        ))}
      </div>
    </div>
  )
}

// =============================================================
// SMALL PIECES
// =============================================================

function PriorityDot({ priority }: { priority: ClickUpPriority }) {
  const colors: Record<ClickUpPriority, string> = {
    urgent: 'bg-error-500 ring-error-200',
    high: 'bg-warning-500 ring-warning-200',
    medium: 'bg-brand-500 ring-brand-200',
    low: 'bg-neutral-400 ring-neutral-200',
    none: 'bg-transparent border border-neutral-300',
  }
  const labels: Record<ClickUpPriority, string> = {
    urgent: 'Prioridade urgente',
    high: 'Prioridade alta',
    medium: 'Prioridade média',
    low: 'Prioridade baixa',
    none: 'Sem prioridade',
  }
  return (
    <div
      className={`w-2.5 h-2.5 rounded-full ring-4 flex-shrink-0 ${colors[priority]}`}
      aria-label={labels[priority]}
      title={labels[priority]}
    />
  )
}

function AssigneeAvatar({ assignee }: { assignee: ClickUpAssignee }) {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-2xs font-semibold text-white flex-shrink-0 shadow-sm"
      style={{ backgroundColor: assignee.color }}
      title={assignee.username}
      aria-label={assignee.username}
    >
      {assignee.initial}
    </div>
  )
}

function DueDateBadge({ task }: { task: ClickUpTask }) {
  if (!task.due_date_label) return null

  let style = 'bg-neutral-100 text-neutral-600'
  if (task.status === 'urgent' && task.days_late && task.days_late > 0) {
    style = 'bg-error-100 text-error-700 font-medium'
  } else if (task.due_date_label.toLowerCase().includes('hoje')) {
    style = 'bg-warning-100 text-warning-700 font-medium'
  } else if (task.due_date_label.toLowerCase().includes('amanhã')) {
    style = 'bg-brand-100 text-brand-700'
  } else if (task.status === 'done') {
    style = 'bg-success-50 text-success-700'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs ${style}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {task.due_date_label}
    </span>
  )
}

function ClientAvatar({ gradient, name }: { gradient: string; name: string }) {
  return (
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0`}
      aria-hidden="true"
    >
      {name}
    </div>
  )
}
