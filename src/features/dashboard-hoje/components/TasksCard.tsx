import { CheckCircle2, ListChecks, Plus } from 'lucide-react'

import { Card, CardBody, CardHead, Pill, ProgressBar } from '@/components/primitives'
import type { ClickUpTask } from '@/services/adapters/clickupTypes'

interface Props {
  tasks: ClickUpTask[]
  doneCount: number
  total: number
  onAdd?: () => void
}

export function TasksCard({ tasks, doneCount, total, onAdd }: Props) {
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <Card className="col-span-12 lg:col-span-4 min-h-[280px] flex flex-col">
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <ListChecks size={16} className="text-brand-600" />
            Minhas tarefas
          </span>
        }
        subtitle={`Sincronizado com ClickUp · ${doneCount}/${total} concluídas`}
        actions={
          onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
            >
              <Plus size={12} /> nova
            </button>
          ) : undefined
        }
      />
      <CardBody className="flex-1">
        <ProgressBar value={pct} tone="brand" ariaLabel={`${pct}% de tarefas concluídas`} />
        <ul className="mt-3 space-y-1">
          {tasks.length === 0 ? (
            <EmptyTasks />
          ) : (
            tasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </ul>
      </CardBody>
    </Card>
  )
}

function TaskRow({ task }: { task: ClickUpTask }) {
  const done = task.status === 'done'
  const label = task.due_date_label ?? task.list_name
  const tone =
    task.priority === 'urgent' ? 'error' : task.days_late != null && task.days_late > 0 ? 'warning' : 'neutral'

  return (
    <li>
      <a
        href={task.url}
        target="_blank"
        rel="noreferrer"
        className={[
          'flex items-center gap-2 px-2 py-2 rounded-md -mx-2 text-[13px] hover:bg-neutral-50 transition-colors',
          done ? 'opacity-60' : '',
        ].join(' ')}
      >
        <span
          aria-hidden
          className={[
            'h-4 w-4 rounded-[4px] border grid place-items-center shrink-0',
            done ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300',
          ].join(' ')}
        >
          {done && <CheckCircle2 size={12} strokeWidth={3} />}
        </span>
        <span
          className={[
            'flex-1 min-w-0 truncate',
            done ? 'line-through text-neutral-500' : 'text-neutral-800',
          ].join(' ')}
        >
          {task.title}
        </span>
        {label && <Pill tone={tone}>{label}</Pill>}
      </a>
    </li>
  )
}

function EmptyTasks() {
  return (
    <li className="py-10 text-center text-xs text-neutral-500">Nenhuma tarefa ativa.</li>
  )
}
