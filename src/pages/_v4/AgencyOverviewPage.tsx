/**
 * ============================================
 * Agency Overview Page — AdFlow v4 (Sprint 2)
 * ============================================
 * Nível 1 do mental model: a visão da AGÊNCIA.
 * Lista TODOS os clientes de Operações com status, atividade
 * e evolução, puxados do ClickUp via snapshot JSON.
 *
 * Rota: /_v4/operations
 * ============================================
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/canonical'
import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import type { AgencyClient } from '@/services/adapters/clickupTypes'
import { formatMetric } from '@/lib/formatMetric'

type SortKey = 'activity' | 'urgency' | 'name' | 'overdue'

export default function AgencyOverviewPage() {
  const navigate = useNavigate()
  const snapshot = loadSnapshot()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('urgency')

  const clients = useMemo(() => {
    const filtered = snapshot.clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    )
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return b.stats.urgent - a.stats.urgent
        case 'overdue':
          return b.stats.overdue - a.stats.overdue
        case 'name':
          return a.name.localeCompare(b.name)
        case 'activity':
        default:
          return b.stats.total_active - a.stats.total_active
      }
    })
    return sorted
  }, [snapshot.clients, search, sortBy])

  const capturedAt = new Date(snapshot.captured_at)
  const capturedLabel = capturedAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Operações — Visão Geral"
        subtitle={`${snapshot.clients.length} clientes · dados do ClickUp (snapshot ${capturedLabel})`}
        breadcrumbs={[{ label: 'Efeito Digital' }, { label: 'Operações' }]}
        leading={
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
            ED
          </div>
        }
        actions={
          <button
            onClick={() => navigate('/_v4/design-system')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Design system →
          </button>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ──────────────────────────────────────────────────
            AGGREGATE STATS — 4 stat pills no topo
            ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AggregatePill
            label="Clientes ativos"
            value={snapshot.aggregate.total_clients}
            color="brand"
            icon={<IconBuilding />}
          />
          <AggregatePill
            label="Tarefas ativas"
            value={snapshot.aggregate.total_active_tasks}
            color="neutral"
            icon={<IconList />}
          />
          <AggregatePill
            label="Atrasadas"
            value={snapshot.aggregate.total_overdue}
            color="error"
            icon={<IconWarning />}
          />
          <AggregatePill
            label="Entregues (7d)"
            value={snapshot.aggregate.total_done_week}
            subtitle={`${formatMetric(snapshot.aggregate.on_time_rate, 'percent')} no prazo`}
            color="success"
            icon={<IconCheck />}
          />
        </section>

        {/* ──────────────────────────────────────────────────
            FILTER + SEARCH bar
            ────────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-10 pr-3 py-2 text-sm
                bg-[var(--surface-card)]
                border border-[var(--border-default)]
                rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
                focus:border-brand-400
                transition-all duration-fast
                placeholder:text-neutral-400
              "
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <SortPill label="Mais urgentes" active={sortBy === 'urgency'} onClick={() => setSortBy('urgency')} />
            <SortPill label="Mais atrasados" active={sortBy === 'overdue'} onClick={() => setSortBy('overdue')} />
            <SortPill label="Mais ativos" active={sortBy === 'activity'} onClick={() => setSortBy('activity')} />
            <SortPill label="A-Z" active={sortBy === 'name'} onClick={() => setSortBy('name')} />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            CLIENT GRID — cards com stats + upcoming tasks
            ────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <ClientCard
                key={client.slug}
                client={client}
                onClick={() => navigate(`/c/${client.slug}/overview`)}
                onProjectClick={() => navigate(`/c/${client.slug}/projeto`)}
              />
            ))}
          </div>
        </section>

        {/* Dev note */}
        <div className="p-3 rounded-lg bg-brand-50 border border-brand-100 text-xs text-brand-700 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Dados reais do ClickUp.</strong> Snapshot capturado via MCP em {capturedLabel}.
            Um cron vai refrescar automaticamente quando plugado em produção.
          </span>
        </div>
      </main>
    </div>
  )
}

// =============================================================
// CLIENT CARD
// =============================================================

interface ClientCardProps {
  client: AgencyClient
  onClick: () => void
  onProjectClick: () => void
}

function ClientCard({ client, onClick, onProjectClick }: ClientCardProps) {
  const { stats } = client
  const completionRate =
    stats.total_active + stats.done > 0
      ? stats.done / (stats.total_active + stats.done)
      : 0

  // Health color based on overdue ratio
  let healthColor = 'bg-success-500'
  if (stats.overdue >= 5) healthColor = 'bg-error-500'
  else if (stats.overdue >= 2) healthColor = 'bg-warning-500'

  return (
    <div
      className="
        group bg-[var(--surface-card)] border border-[var(--border-subtle)]
        rounded-xl overflow-hidden
        transition-all duration-normal
        hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-200
      "
    >
      {/* Top strip — health indicator */}
      <div className={`h-1 ${healthColor}`} />

      <div className="p-4">
        {/* Header: avatar + name + industry + urgent badge */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`
              w-12 h-12 rounded-xl bg-gradient-to-br ${client.avatar_gradient}
              flex items-center justify-center text-white font-bold text-base
              shadow-sm flex-shrink-0
            `}
          >
            {client.short_name}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 truncate">
              {client.name}
            </h3>
            <p className="text-2xs text-neutral-500 truncate">
              {client.industry}
              {client.city && ` · ${client.city}`}
            </p>
          </div>
          {stats.urgent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error-50 text-error-700 text-2xs font-semibold rounded-full border border-error-100 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-error-500 animate-pulse" />
              {stats.urgent} urgente{stats.urgent > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Stats grid — 4 small metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <MiniStat label="Ativas" value={stats.total_active} color="neutral" />
          <MiniStat label="Em dia" value={stats.in_progress} color="brand" />
          <MiniStat label="Review" value={stats.review} color="warning" />
          <MiniStat label="Atras." value={stats.overdue} color={stats.overdue > 0 ? 'error' : 'neutral'} />
        </div>

        {/* Completion progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs text-neutral-500">Progresso da semana</span>
            <span className="text-2xs text-neutral-700 font-semibold tabular-nums">
              {formatMetric(completionRate, 'percent')}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-slow"
              style={{ width: `${completionRate * 100}%` }}
            />
          </div>
        </div>

        {/* Upcoming tasks preview */}
        {client.upcoming_tasks.length > 0 ? (
          <div className="space-y-1.5 mb-4">
            <p className="text-2xs uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
              Próximas
            </p>
            {client.upcoming_tasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 py-1 px-2 rounded-md bg-neutral-50 text-2xs"
              >
                <span
                  className={`
                    w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${
                      task.priority === 'urgent'
                        ? 'bg-error-500'
                        : task.priority === 'high'
                          ? 'bg-warning-500'
                          : 'bg-brand-500'
                    }
                  `}
                />
                <span className="flex-1 text-neutral-700 truncate">{task.title}</span>
                {task.days_late && task.days_late > 0 && (
                  <span className="text-2xs text-error-600 font-semibold flex-shrink-0">
                    −{task.days_late}d
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-2xs text-neutral-400 italic py-2 mb-4">
            Sem tarefas próximas agendadas
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClick}
            className="flex-1 px-3 py-1.5 text-2xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
          >
            Abrir cliente
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onProjectClick()
            }}
            className="px-3 py-1.5 text-2xs font-medium text-neutral-700 hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors"
          >
            Projeto
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================
// SMALL PIECES
// =============================================================

function MiniStat({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'neutral' | 'brand' | 'warning' | 'error'
}) {
  const colors = {
    neutral: 'text-neutral-700 bg-neutral-50',
    brand: 'text-brand-700 bg-brand-50',
    warning: 'text-warning-700 bg-warning-50',
    error: 'text-error-700 bg-error-50',
  } as const
  const c = colors[color]

  return (
    <div className={`${c} rounded-lg p-2 text-center`}>
      <div className="text-sm font-bold tabular-nums leading-none">{value}</div>
      <div className="text-2xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function SortPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-2xs font-medium
        border transition-all duration-fast flex-shrink-0
        ${
          active
            ? 'bg-neutral-900 border-neutral-900 text-white'
            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
        }
      `}
    >
      {label}
    </button>
  )
}

function AggregatePill({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string
  value: number
  subtitle?: string
  color: 'brand' | 'neutral' | 'warning' | 'error' | 'success'
  icon: React.ReactNode
}) {
  const colors = {
    brand: { bg: 'bg-brand-50', border: 'border-brand-100', text: 'text-brand-700', iconBg: 'bg-brand-100 text-brand-600' },
    neutral: { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-700', iconBg: 'bg-neutral-100 text-neutral-600' },
    warning: { bg: 'bg-warning-50', border: 'border-warning-100', text: 'text-warning-700', iconBg: 'bg-warning-100 text-warning-600' },
    error: { bg: 'bg-error-50', border: 'border-error-100', text: 'text-error-700', iconBg: 'bg-error-100 text-error-600' },
    success: { bg: 'bg-success-50', border: 'border-success-100', text: 'text-success-700', iconBg: 'bg-success-100 text-success-600' },
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

// Icons
function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
      <line x1="9" y1="15" x2="9.01" y2="15" />
      <line x1="15" y1="15" x2="15.01" y2="15" />
    </svg>
  )
}
function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function IconWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
