/**
 * Public Client Portal — rota pública `/portal/:token`
 *
 * Layout single-scroll dedicado pro link compartilhado com o cliente.
 * Sem tabs, sem placeholders "em breve", sem chamadas a APIs internas
 * (Kommo, comments, etc). Renderiza a partir do snapshot mais recente
 * autorizado pelo token público do cliente.
 *
 * Estrutura:
 *   1. Sticky header (logo + nome cliente)
 *   2. Hero (período + investimento + leads)
 *   3. KPIs cards (4 métricas)
 *   4. Atividade diária (area chart)
 *   5. Distribuição por canal
 *   6. Campanhas (ativa/pausada com métricas)
 *   7. Histórico mensal (bar chart)
 *   8. Status do projeto (% + lista de tasks)
 *   9. Observações (notas operacionais)
 *  10. Footer (última atualização + branding)
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Info,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Avatar } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'

interface ResolvedClient {
  slug: string
  name: string
  logo_url: string | null
  industry: string | null
}

const STATUS_ICON = {
  todo: Circle,
  in_progress: Clock,
  review: Eye,
  done: CheckCircle2,
  blocked: AlertCircle,
}
const STATUS_LABEL = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  review: 'Em revisão',
  done: 'Concluído',
  blocked: 'Bloqueado',
}
const STATUS_COLOR = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
}

export default function PublicClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [client, setClient] = useState<ResolvedClient | null>(null)
  const [portalData, setPortalData] = useState<PortalContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Link inválido.')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`/api/integrations?op=public-portal&token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Link indisponível.')
        if (cancelled) return
        setClient(payload.client as ResolvedClient)
        setPortalData(payload.data as PortalContentData)
      } catch (err) {
        console.error('[PublicPortal] resolve_portal_token failed:', err)
        setError('Erro ao carregar o painel. Tente novamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50">
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando painel…
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 px-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-rose-50 text-rose-600 grid place-items-center">
            <AlertCircle size={18} />
          </div>
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Link indisponível
          </div>
          <p className="text-xs text-neutral-500">
            {error ?? 'Tente novamente em instantes.'}
          </p>
        </div>
      </div>
    )
  }

  return <PortalContent clientName={client.name} data={portalData} />
}

function PortalContent({ clientName, data }: { clientName: string; data: PortalContentData | null }) {

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 p-6 text-center">
        <div>
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Painel indisponível
          </div>
          <p className="text-xs text-neutral-500">
            Não encontramos dados deste cliente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Avatar name={clientName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-neutral-900 truncate">
              {clientName}
            </div>
            <div className="text-[11px] text-neutral-500">Painel do cliente</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* HERO */}
        <Hero
          periodLabel={data.periodLabel}
          spend={data.spend}
          leads={data.leads}
          cpl={data.cpl}
          lastSyncedAt={data.lastSyncedAt}
        />

        {/* KPIs */}
        <KpiGrid
          spend={data.spend}
          leads={data.leads}
          clicks={data.clicks}
          impressions={data.impressions}
          cpl={data.cpl}
        />

        {/* Atividade diária */}
        {data.daily.length > 0 && data.daily.some((d) => d.spend > 0 || d.leads > 0) && (
          <Section title="Atividade diária" subtitle="Investimento e leads ao longo do período">
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-spend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4285f4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4285f4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 11,
                    }}
                    formatter={((v: number | undefined, name: string | undefined) => {
                      if (v == null) return ['—', '']
                      return name === 'spend'
                        ? [formatMetric(v, 'currency'), 'Investimento']
                        : [v.toString(), 'Leads']
                    }) as never}
                    labelFormatter={(l) => String(l)}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#4285f4"
                    strokeWidth={2}
                    fill="url(#grad-spend)"
                    name="spend"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {/* Distribuição por canal */}
        {data.channels.length > 0 && (
          <Section title="Investimento por canal">
            <div className="space-y-3">
              {data.channels.map((c) => {
                const total = data.channels.reduce((acc, x) => acc + x.spend, 0)
                const pct = total > 0 ? (c.spend / total) * 100 : 0
                return (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-neutral-800">{c.label}</span>
                      <span className="tabular text-neutral-900 font-semibold">
                        {formatMetric(c.spend, 'currency')}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      {pct.toFixed(0)}% do investimento · {c.conversions} conversões
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Campanhas */}
        {data.campaigns.length > 0 && (
          <Section
            title="Campanhas"
            subtitle={`${data.campaigns.filter((c) => c.isActive).length} ativa(s) de ${data.campaigns.length}`}
          >
            <div className="space-y-2.5">
              {data.campaigns.map((c, i) => (
                <CampaignCard key={`${c.name}-${i}`} c={c} />
              ))}
            </div>
          </Section>
        )}

        {/* Histórico mensal */}
        {data.monthly.length > 1 && (
          <Section title="Histórico mensal" subtitle="Comparativo dos últimos meses">
            <div className="h-44 -mx-2 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 11,
                    }}
                    formatter={((v: number | undefined, name: string | undefined) => {
                      if (v == null) return ['—', '']
                      return name === 'spend'
                        ? [formatMetric(v, 'currency'), 'Investimento']
                        : [v.toString(), 'Leads']
                    }) as never}
                  />
                  <Bar dataKey="spend" fill="#4285f4" radius={[4, 4, 0, 0]} name="spend" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {data.monthly.slice(-4).map((m) => (
                <div
                  key={m.month}
                  className="flex items-baseline justify-between border-b border-neutral-100 pb-1"
                >
                  <span className="text-neutral-600">
                    {m.label}
                    {m.partial && (
                      <span className="ml-1 text-[9px] text-neutral-400">parc.</span>
                    )}
                  </span>
                  <span className="font-semibold tabular text-neutral-900">
                    {m.conversions} conv
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Status do projeto */}
        <Section
          title="Status do projeto"
          subtitle={`${data.taskStats.total} tarefas no roadmap`}
        >
          <ProjectStatus
            stats={data.taskStats}
            tasks={data.tasks}
          />
        </Section>

        {/* Observações */}
        {data.notes.length > 0 && (
          <Section title="Observações">
            <ul className="space-y-2.5">
              {data.notes.map((n, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-neutral-700 leading-snug">
                  <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-8 text-center text-[11px] text-neutral-400">
          {data.lastSyncedAt && (
            <div>Atualizado em {formatDateTime(data.lastSyncedAt)}</div>
          )}
          <div className="mt-1">
            <span className="text-neutral-500 font-medium">Ads Flow</span> · Efeito Digital
          </div>
        </footer>
      </main>
    </div>
  )
}

// =============================================================
// SECTIONS
// =============================================================

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-neutral-900 leading-none">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-[12px] text-neutral-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Hero({
  periodLabel,
  spend,
  leads,
  cpl,
  lastSyncedAt,
}: {
  periodLabel: string | null
  spend: number | null
  leads: number
  cpl: number | null
  lastSyncedAt: string | null
}) {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-blue-100 font-medium">
        <TrendingUp size={12} />
        <span>{periodLabel ?? 'Período atual'}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[40px] font-bold tabular tracking-tight leading-none">
          {spend != null ? formatMetric(spend, 'currency', { decimals: 2 }) : '—'}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] text-blue-100">
        Investidos no período
      </div>
      <div className="mt-5 flex items-center gap-4 text-[13px]">
        <div>
          <div className="text-[20px] font-bold tabular leading-none">
            {leads.toLocaleString('pt-BR')}
          </div>
          <div className="mt-0.5 text-[11px] text-blue-100">
            {leads === 1 ? 'lead gerado' : 'leads gerados'}
          </div>
        </div>
        {cpl != null && (
          <>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <div className="text-[20px] font-bold tabular leading-none">
                {formatMetric(cpl, 'currency', { decimals: 0 })}
              </div>
              <div className="mt-0.5 text-[11px] text-blue-100">por lead</div>
            </div>
          </>
        )}
      </div>
      {lastSyncedAt && (
        <div className="mt-4 text-[10px] text-blue-100/80">
          Atualizado em {formatDateTime(lastSyncedAt)}
        </div>
      )}
    </section>
  )
}

function KpiGrid({
  spend,
  leads,
  clicks,
  impressions,
  cpl,
}: {
  spend: number | null
  leads: number
  clicks: number
  impressions: number
  cpl: number | null
}) {
  const cells: Array<{ label: string; value: string }> = [
    { label: 'Investimento', value: spend != null ? formatMetric(spend, 'currency') : '—' },
    { label: 'Cliques', value: clicks.toLocaleString('pt-BR') },
    { label: 'Leads', value: leads.toLocaleString('pt-BR') },
    { label: 'Impressões', value: impressions.toLocaleString('pt-BR') },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-neutral-100 shadow-sm px-4 py-3"
        >
          <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 font-medium">
            {c.label}
          </div>
          <div className="mt-1 text-[20px] font-bold tabular text-neutral-900 leading-none">
            {c.value}
          </div>
        </div>
      ))}
      {cpl != null && (
        <div className="col-span-2 sm:col-span-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-emerald-700 font-medium">
            CPL — Custo por lead
          </div>
          <div className="mt-1 text-[20px] font-bold tabular text-emerald-800 leading-none">
            {formatMetric(cpl, 'currency')}
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignCard({
  c,
}: {
  c: {
    name: string
    channel: string
    spend: number
    impressions: number
    clicks: number
    conversions: number
    cpl: number | null
    isActive: boolean
  }
}) {
  return (
    <div className="border border-neutral-100 rounded-xl p-3.5">
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
            c.isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {c.isActive ? 'Ativa' : 'Pausada'}
        </span>
        <div className="text-[10px] text-neutral-500">{c.channel}</div>
      </div>
      <div className="text-[14px] font-semibold text-neutral-900 leading-snug">
        {c.name}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <KpiMini label="Investimento" value={formatMetric(c.spend, 'currency')} />
        <KpiMini label="Conversões" value={c.conversions.toString()} />
        <KpiMini
          label="CPL"
          value={c.cpl != null ? formatMetric(c.cpl, 'currency', { decimals: 0 }) : '—'}
        />
      </div>
    </div>
  )
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-50 rounded-lg py-1.5 px-2">
      <div className="text-[9px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-0.5 text-[12px] font-bold tabular text-neutral-900">{value}</div>
    </div>
  )
}

function ProjectStatus({
  stats,
  tasks,
}: {
  stats: {
    total: number
    done: number
    in_progress: number
    review: number
    todo: number
    blocked: number
  }
  tasks: Array<{
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    list_name: string
    url: string
  }>
}) {
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  const recent = tasks.filter((t) => t.status === 'done').slice(0, 5)
  const upcoming = tasks.filter((t) => t.status !== 'done').slice(0, 5)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[11px] text-neutral-500">Progresso</div>
        <div className="text-[20px] font-bold tabular text-emerald-700">{progress}%</div>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 text-center">
        <Stat label="Concluído" value={stats.done} color="text-emerald-600" />
        <Stat label="Em andamento" value={stats.in_progress} color="text-blue-600" />
        <Stat label="Em revisão" value={stats.review} color="text-amber-600" />
        <Stat label="A fazer" value={stats.todo} color="text-neutral-600" />
        <Stat label="Bloqueado" value={stats.blocked} color="text-rose-600" />
      </div>

      {upcoming.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 font-medium mb-2">
            Próximas atividades
          </div>
          <ul className="space-y-1.5">
            {upcoming.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 font-medium mb-2">
            Últimas entregas
          </div>
          <ul className="space-y-1.5">
            {recent.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`text-[16px] font-bold tabular ${color}`}>{value}</div>
      <div className="text-[9px] text-neutral-500 leading-tight">{label}</div>
    </div>
  )
}

function TaskItem({
  task,
}: {
  task: {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    list_name: string
  }
}) {
  const Icon = STATUS_ICON[task.status]
  const color = STATUS_COLOR[task.status]
  return (
    <li className="flex items-start gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <Icon size={14} style={{ color }} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-neutral-900 leading-snug">{task.title}</div>
        <div className="text-[10px] text-neutral-500 mt-0.5">
          {task.list_name} · {STATUS_LABEL[task.status]}
        </div>
      </div>
    </li>
  )
}

// =============================================================
// DATA — extrai snapshot real do bundle
// =============================================================

interface PortalContentData {
  periodLabel: string | null
  spend: number | null
  leads: number
  clicks: number
  impressions: number
  cpl: number | null
  daily: Array<{ date: string; dateLabel: string; spend: number; leads: number }>
  channels: Array<{ label: string; spend: number; conversions: number; color: string }>
  campaigns: Array<{
    name: string
    channel: string
    spend: number
    impressions: number
    clicks: number
    conversions: number
    cpl: number | null
    isActive: boolean
  }>
  monthly: Array<{
    month: string
    label: string
    spend: number
    clicks: number
    impressions: number
    conversions: number
    partial?: boolean
  }>
  notes: string[]
  tasks: Array<{
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    list_name: string
    url: string
  }>
  taskStats: {
    total: number
    done: number
    in_progress: number
    review: number
    todo: number
    blocked: number
  }
  lastSyncedAt: string | null
}

function formatDateTime(iso: string): string {
  try {
    const dt = new Date(iso)
    return dt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
