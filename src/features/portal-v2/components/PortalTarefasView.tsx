/**
 * Portal V2 — painel "Tarefas"
 *
 * Substitui o placeholder "em breve". Mostra o cliente o que está
 * sendo entregue: stats agregadas no topo + lista de tasks agrupadas
 * por status (do mais urgente pro concluído).
 */

import { CheckCircle2, Circle, Clock, AlertCircle, Eye } from 'lucide-react'
import type { PortalTaskRow, PortalV2Data } from '../types'

interface Props {
  tasks: PortalTaskRow[]
  stats: PortalV2Data['taskStats']
}

const STATUS_ORDER: Array<PortalTaskRow['status']> = [
  'blocked',
  'in_progress',
  'review',
  'todo',
  'done',
]

const STATUS_ICON = {
  todo: Circle,
  in_progress: Clock,
  review: Eye,
  done: CheckCircle2,
  blocked: AlertCircle,
}

export function PortalTarefasView({ tasks, stats }: Props) {
  // Agrupa tasks por status, respeitando ordem definida acima
  const groups = STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <div className="bg-white border border-neutral-100 rounded-xl p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500">
            Progresso do projeto
          </div>
          <div className="text-[20px] font-bold tabular text-neutral-900">
            {progress}%
          </div>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1 text-center">
          <Stat label="Concluído" value={stats.done} color="text-emerald-600" />
          <Stat label="Em andamento" value={stats.in_progress} color="text-blue-600" />
          <Stat label="Em revisão" value={stats.review} color="text-amber-600" />
          <Stat label="A fazer" value={stats.todo} color="text-neutral-600" />
          <Stat label="Bloqueado" value={stats.blocked} color="text-rose-600" />
        </div>
      </div>

      {/* Tasks por status */}
      {groups.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-xl p-6 text-center">
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Sem tasks no período
          </div>
          <p className="text-xs text-neutral-500">
            As atividades do projeto aparecerão aqui conforme forem registradas.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <TaskGroup key={group.status} group={group} />
        ))
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`text-[15px] font-bold tabular ${color}`}>{value}</div>
      <div className="text-[9px] text-neutral-500 leading-tight">{label}</div>
    </div>
  )
}

function TaskGroup({
  group,
}: {
  group: { status: PortalTaskRow['status']; items: PortalTaskRow[] }
}) {
  const Icon = STATUS_ICON[group.status]
  const label = group.items[0].status_label
  const color = group.items[0].status_color

  return (
    <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
          {label}
        </span>
        <span className="ml-auto text-[10px] text-neutral-500 tabular">
          {group.items.length}
        </span>
      </div>
      <div className="divide-y divide-neutral-100">
        {group.items.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: PortalTaskRow }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[13px] text-neutral-900 leading-snug">{task.title}</div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
        <span className="px-1.5 py-0.5 rounded bg-neutral-100">{task.list_name}</span>
        {task.due_date_label && <span>· {task.due_date_label}</span>}
        {task.assignees.length > 0 && (
          <div className="ml-auto flex -space-x-1">
            {task.assignees.slice(0, 3).map((a, i) => (
              <div
                key={i}
                title={a.username}
                className="w-5 h-5 rounded-full border border-white grid place-items-center text-[9px] font-bold text-white"
                style={{ backgroundColor: a.color || '#64748b' }}
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
