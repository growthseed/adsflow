import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Gauge,
  ListChecks,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useLiveClickUpSnapshot } from '@/hooks/useLiveClickUpSnapshot'
import {
  fetchLatestPerformanceSnapshot,
  getClientPerformance,
  getDailySeries,
} from '@/services/adapters/performanceAdapter'
import type { ClientPerformance } from '@/services/adapters/performanceTypes'
import type { AgencyClient } from '@/services/adapters/clickupTypes'

const STATUS_COLORS = ['#2563eb', '#f59e0b', '#ef4444', '#10b981', '#94a3b8']

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

const INT = (value: number) => value.toLocaleString('pt-BR')

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string
  detail: string
  icon: typeof Activity
  tone?: 'blue' | 'green' | 'amber' | 'slate'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 truncate text-[22px] font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 truncate text-xs text-slate-500">{detail}</div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Avatar({ username, initial, color, avatarUrl }: {
  username: string
  initial: string
  color: string
  avatarUrl?: string | null
}) {
  return (
    <span
      title={username}
      className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
    </span>
  )
}

export function ClientExecutiveReport({ clientSlug, clientName }: { clientSlug: string; clientName: string }) {
  const { snapshot, capturedAt, loading: clickupLoading } = useLiveClickUpSnapshot()
  const [performance, setPerformance] = useState<ClientPerformance | null>(() => getClientPerformance(clientSlug) ?? null)

  useEffect(() => {
    let cancelled = false
    fetchLatestPerformanceSnapshot().then((fresh) => {
      if (!cancelled) setPerformance(fresh.clients[clientSlug] ?? null)
    })
    return () => { cancelled = true }
  }, [clientSlug])

  const project = useMemo<AgencyClient | null>(
    () => snapshot.clients.find((item) => item.slug === clientSlug) ?? null,
    [clientSlug, snapshot.clients],
  )
  const daily = useMemo(
    () => (performance ? getDailySeries(performance).map((item) => ({
      ...item,
      label: `${item.date.slice(8, 10)}/${item.date.slice(5, 7)}`,
    })) : []),
    [performance],
  )
  const platformData = useMemo(() => {
    if (!performance) return []
    return Object.values(performance.platforms)
      .filter((account) => account.connected || account.summary.spend > 0)
      .map((account) => ({
        label: account.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads',
        value: account.summary.spend,
      }))
  }, [performance])
  const statusData = useMemo(() => {
    if (!project) return []
    return [
      { label: 'Em andamento', value: project.stats.in_progress },
      { label: 'Em revisão', value: project.stats.review },
      { label: 'Atrasadas', value: project.stats.overdue },
      { label: 'Concluídas', value: project.stats.done },
      { label: 'Backlog', value: project.stats.backlog },
    ].filter((item) => item.value > 0)
  }, [project])

  const metrics = performance?.blended
  const tasks = project?.upcoming_tasks.slice(0, 6) ?? []
  const period = performance?.period.label ?? 'Período de mídia ainda não sincronizado'

  return (
    <div className="mb-8 space-y-5">
      <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            <BarChart3 className="h-3.5 w-3.5" /> Relatório executivo
          </div>
          <h2 className="text-[25px] font-bold tracking-tight text-slate-950">{clientName}</h2>
          <p className="mt-1 text-sm text-slate-500">Performance de mídia, operação ClickUp e pontos de atenção em uma única leitura.</p>
        </div>
        <div className="text-left text-xs text-slate-500 sm:text-right">
          <div>{period}</div>
          <div className="mt-1">ClickUp atualizado em {clickupLoading ? 'consultando...' : capturedAt.toLocaleString('pt-BR')}</div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric label="Investimento" value={metrics ? BRL(metrics.total_spend) : '—'} detail={metrics ? 'Meta + Google' : 'Sem Ads conectado'} icon={CircleDollarSign} tone="blue" />
        <Metric label="Leads" value={metrics ? INT(metrics.total_conversions) : '—'} detail={metrics ? 'Conversões atribuídas' : 'Aguardando sincronização'} icon={Users} tone="green" />
        <Metric label="CPL" value={metrics ? BRL(metrics.cost_per_conversion) : '—'} detail="Custo por conversão" icon={Gauge} tone="amber" />
        <Metric label="ROAS" value={metrics ? `${metrics.roas.toFixed(2).replace('.', ',')}x` : '—'} detail="Retorno sobre mídia" icon={Activity} tone="blue" />
        <Metric label="Tarefas ativas" value={INT(project?.stats.total_active ?? 0)} detail="Operação no ClickUp" icon={ListChecks} tone="slate" />
        <Metric label="Atrasadas" value={INT(project?.stats.overdue ?? 0)} detail="Prioridade operacional" icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <Panel title="Evolução diária" subtitle="Investimento e conversões do período sincronizado.">
          {daily.length > 0 ? (
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis yAxisId="spend" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value, name) => [name === 'spend' ? BRL(Number(value)) : INT(Number(value)), name === 'spend' ? 'Investimento' : 'Conversões']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="spend" type="monotone" dataKey="spend" name="spend" stroke="#2563eb" fill="url(#reportSpend)" strokeWidth={2} />
                  <Area yAxisId="leads" type="monotone" dataKey="conversions" name="conversions" stroke="#10b981" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Clock3} text="Ainda não há série diária de mídia para este cliente." />
          )}
        </Panel>

        <Panel title="Distribuição do investimento" subtitle="Participação por canal pago.">
          {platformData.length > 0 ? (
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformData} dataKey="value" nameKey="label" cx="50%" cy="44%" innerRadius="52%" outerRadius="76%" paddingAngle={3}>
                    {platformData.map((entry, index) => <Cell key={entry.label} fill={index === 0 ? '#2563eb' : '#10b981'} />)}
                  </Pie>
                  <Tooltip formatter={(value) => BRL(Number(value))} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={CircleDollarSign} text="Nenhum canal de Ads conectado no período." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Saúde da operação" subtitle="Distribuição das demandas atuais no ClickUp.">
          {statusData.length > 0 ? (
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ left: 18, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Demandas" radius={[0, 4, 4, 0]}>
                    {statusData.map((item, index) => <Cell key={item.label} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={ListChecks} text="O ClickUp ainda não retornou demandas para este cliente." />
          )}
        </Panel>

        <Panel title="Próximas demandas" subtitle="Itens prioritários com acesso direto ao ClickUp.">
          {tasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${task.status === 'urgent' ? 'bg-red-500' : task.status === 'review' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="min-w-0 flex-1">
                    {task.url ? (
                      <a href={task.url} target="_blank" rel="noreferrer" className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-slate-800 hover:text-blue-600">
                        <span className="truncate">{task.title}</span><ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                      </a>
                    ) : <span className="block truncate text-sm font-medium text-slate-800">{task.title}</span>}
                    <div className="mt-0.5 flex gap-2 text-[11px] text-slate-500"><span>{task.list_name}</span><span>{task.due_date_label ?? 'Sem prazo'}</span></div>
                  </div>
                  <div className="flex shrink-0 -space-x-2">
                    {task.assignees.slice(0, 3).map((assignee) => <Avatar key={assignee.id} username={assignee.username} initial={assignee.initial} color={assignee.color} avatarUrl={assignee.avatar_url} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} text="Nenhuma demanda prioritária no momento." />
          )}
        </Panel>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return <div className="grid h-[210px] place-items-center text-center text-xs text-slate-500"><div><Icon className="mx-auto mb-2 h-6 w-6 text-slate-300" /><p>{text}</p></div></div>
}
