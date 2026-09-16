import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight, CircleAlert, CircleDollarSign, Clock3, ExternalLink, ListChecks, RefreshCw, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLiveClickUpSnapshot } from '@/hooks/useLiveClickUpSnapshot'
import { useAuth } from '@/contexts/AuthContext'
import { fetchLatestPerformanceSnapshot, getClientPerformance } from '@/services/adapters/performanceAdapter'
import type { ClientPerformance, AdPlatform } from '@/services/adapters/performanceTypes'
import type { ClickUpAssignee, ClickUpTask } from '@/services/adapters/clickupTypes'
import { TASK_STATES, dateKey, filterReportTasks, isOverdue, summarizeMedia, weekDays, type TaskFilters } from '../reportModel'
import './executive-report.css'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const shortDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const initialFilters: TaskFilters = { status: 'all', assignee: 'all', window: 'all', search: '' }
const PAGE_SIZE = 10
const EMPTY_TASKS: ClickUpTask[] = []

function Person({ person }: { person: ClickUpAssignee }) {
  const [failed, setFailed] = useState(false)
  return <span className="bi-avatar" title={person.username} style={{ backgroundColor: person.color }}>
    {person.avatar_url && !failed ? <img src={person.avatar_url} alt={person.username} onError={() => setFailed(true)} /> : person.initial}
  </span>
}

function Metric({ label, value, detail, icon: Icon, tone = '' }: {
  label: string; value: string; detail: string; icon: typeof Users; tone?: string
}) {
  return <div className={`bi-metric ${tone}`}><div className="bi-metric-label"><span>{label}</span><Icon size={17} /></div>
    <strong>{value}</strong><span className="bi-muted">{detail}</span></div>
}

function Section({ title, detail, children, action }: { title: string; detail?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="bi-section"><header><div><h3>{title}</h3>{detail && <p>{detail}</p>}</div>{action}</header>{children}</section>
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="bi-empty"><ChartNoAxesCombined size={25} /><p>{children}</p></div>
}

function exportTasks(tasks: ClickUpTask[], slug: string) {
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`
  const rows = [['Demanda', 'Status', 'Prazo', 'Responsáveis', 'Lista', 'ClickUp'], ...tasks.map((task) =>
    [task.title, task.status_raw, task.due_date ?? '', task.assignees.map((person) => person.username).join(', '), task.list_name, task.url],
  )]
  const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map((row) => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = `${slug}-demandas.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ClientExecutiveReport(props: { clientSlug: string; clientName: string }) {
  // A client switch resets filters and data immediately, before async reads finish.
  return <ExecutiveReport key={props.clientSlug} {...props} />
}

function ExecutiveReport({ clientSlug, clientName }: { clientSlug: string; clientName: string }) {
  const { isGlobalAdmin } = useAuth()
  const { snapshot, capturedAt, loading, refreshing, forceResync } = useLiveClickUpSnapshot()
  const [performance, setPerformance] = useState<ClientPerformance | null>(() => getClientPerformance(clientSlug) ?? null)
  const [params, setParams] = useSearchParams()
  const view = params.get('reportView') === 'media' ? 'media' : 'project'
  const [filters, setFilters] = useState<TaskFilters>(initialFilters)
  const [channel, setChannel] = useState<'all' | AdPlatform>('all')
  const [page, setPage] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [reference] = useState(() => new Date())
  const today = dateKey(reference)
  const week = weekDays(reference)
  const project = snapshot.clients.find((item) => item.slug === clientSlug)
  const allTasks = project?.all_tasks ?? EMPTY_TASKS
  const people = useMemo(() => [...new Map(allTasks.flatMap((task) => task.assignees).map((person) => [person.id, person])).values()]
    .sort((a, b) => a.username.localeCompare(b.username)), [allTasks])
  const tasks = useMemo(() => filterReportTasks(allTasks, filters, reference), [allTasks, filters, reference])
  const active = tasks.filter((task) => task.status !== 'done')
  const overdue = tasks.filter((task) => isOverdue(task, today))
  const undated = active.filter((task) => !task.due_date)
  const dueWeek = active.filter((task) => task.due_date && task.due_date >= week[0].date && task.due_date <= week[6].date)
  const statuses = TASK_STATES.map((state) => ({ ...state, value: tasks.filter((task) => task.status === state.key).length })).filter((state) => state.value > 0)
  const workload = people.map((person) => ({ ...person, value: active.filter((task) => task.assignees.some((assignee) => assignee.id === person.id)).length })).filter((person) => person.value > 0).sort((a, b) => b.value - a.value)
  const agenda = week.map((day) => ({ ...day, value: active.filter((task) => task.due_date === day.date).length }))
  const pages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const media = useMemo(() => summarizeMedia(performance, channel), [performance, channel])
  const filtered = Object.keys(initialFilters).some((key) => filters[key as keyof TaskFilters] !== initialFilters[key as keyof TaskFilters])

  useEffect(() => {
    let cancelled = false
    void fetchLatestPerformanceSnapshot().then((fresh) => {
      if (!cancelled) setPerformance(fresh.clients[clientSlug] ?? null)
    })
    return () => { cancelled = true }
  }, [clientSlug])

  function filter(patch: Partial<TaskFilters>) { setFilters((current) => ({ ...current, ...patch })); setPage(0) }
  function changeView(next: string) { const copy = new URLSearchParams(params); copy.set('reportView', next); setParams(copy, { replace: true }) }
  async function sync() {
    setSyncing(true); setSyncMessage('')
    try {
      const result = await forceResync()
      setSyncMessage(result.ok ? 'Demandas atualizadas.' : 'Não foi possível sincronizar. Tente novamente em instantes.')
    } finally { setSyncing(false) }
  }

  return <div className="bi-report" aria-label={`Dashboard de ${clientName}`}>
    <div className="bi-toolbar">
      <div className="bi-tabs" role="group" aria-label="Visão do relatório">
        <button aria-pressed={view === 'project'} onClick={() => changeView('project')}><ListChecks size={16} />Operação</button>
        <button aria-pressed={view === 'media'} onClick={() => changeView('media')}><ChartNoAxesCombined size={16} />Mídia</button>
      </div>
      <div className="bi-actions">
        <span className="bi-source"><span className="bi-source-dot" />{view === 'project' ? 'ClickUp' : 'Meta + Google'}</span>
        {view === 'project' && isGlobalAdmin && <button className="bi-icon-button" onClick={sync} disabled={syncing || refreshing} title="Sincronizar ClickUp" aria-label="Sincronizar ClickUp"><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /></button>}
        {view === 'project' && <button className="bi-icon-button" onClick={() => exportTasks(tasks, clientSlug)} disabled={!tasks.length} title="Exportar demandas CSV" aria-label="Exportar demandas CSV"><ArrowDownToLine size={16} /></button>}
      </div>
    </div>
    {syncMessage && <p className="bi-notice" role="status">{syncMessage}</p>}
    {view === 'project' ? <>
      <div className="bi-filterbar">
        <SlidersHorizontal size={16} aria-hidden="true" />
        <label><span>Prazo</span><select aria-label="Filtrar prazo" value={filters.window} onChange={(event) => filter({ window: event.target.value as TaskFilters['window'] })}><option value="all">Todos os prazos</option><option value="week">Esta semana</option><option value="overdue">Atrasadas</option><option value="undated">Sem prazo</option></select></label>
        <label><span>Responsável</span><select aria-label="Filtrar responsável" value={filters.assignee} onChange={(event) => filter({ assignee: event.target.value })}><option value="all">Toda a equipe</option><option value="unassigned">Sem responsável</option>{people.map((person) => <option key={person.id} value={person.id}>{person.username}</option>)}</select></label>
        <label><span>Status</span><select aria-label="Filtrar status" value={filters.status} onChange={(event) => filter({ status: event.target.value })}><option value="all">Todos os status</option>{TASK_STATES.map((state) => <option key={state.key} value={state.key}>{state.label}</option>)}</select></label>
        {filtered && <button className="bi-icon-button" title="Limpar filtros" aria-label="Limpar filtros" onClick={() => { setFilters(initialFilters); setPage(0) }}><X size={16} /></button>}
      </div>
      <div className="bi-metrics">
        <Metric label="Demandas ativas" value={project ? number(active.length) : '—'} detail={`${tasks.length} demandas no recorte`} icon={ListChecks} tone="bi-primary" />
        <Metric label="Precisam de atenção" value={project ? number(overdue.length) : '—'} detail="Prazo vencido e ainda abertas" icon={CircleAlert} tone="bi-danger" />
        <Metric label="Entregas da semana" value={project ? number(dueWeek.length) : '—'} detail={`${shortDate(week[0].date)} a ${shortDate(week[6].date)}`} icon={CalendarDays} />
        <Metric label="Sem prazo definido" value={project ? number(undated.length) : '—'} detail="Demandas abertas a planejar" icon={Clock3} />
      </div>
      <div className="bi-analysis-grid">
        <Section title="Panorama das demandas" detail={`${number(tasks.length)} demandas no recorte atual`}>
          {statuses.length ? <div className="bi-donut-row"><div className="bi-donut">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statuses} dataKey="value" nameKey="label" innerRadius={64} outerRadius={88} paddingAngle={2} stroke="none" isAnimationActive={false}>{statuses.map((state) => <Cell key={state.key} fill={state.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="bi-donut-center"><strong>{number(tasks.length)}</strong><span>demandas</span></div>
          </div><div className="bi-legend">{statuses.map((state) => <button key={state.key} onClick={() => filter({ status: filters.status === state.key ? 'all' : state.key })} title={`Filtrar ${state.label}`}><i style={{ background: state.color }} /><span>{state.label}</span><strong>{state.value}</strong><small>{Math.round(state.value / tasks.length * 100)}%</small></button>)}</div></div> : <Empty>{project ? 'Nenhuma demanda para estes filtros.' : 'ClickUp ainda não sincronizado para este cliente.'}</Empty>}
        </Section>
        <Section title="Carga por responsável" detail="Demandas abertas atribuídas a cada pessoa">
          {workload.length ? <div className="bi-workload">{workload.map((person) => <button key={person.id} className="bi-person-row" onClick={() => filter({ assignee: person.id })} title={`Ver demandas de ${person.username}`}><Person person={person} /><span className="bi-person-name">{person.username}</span><span className="bi-workload-track"><span style={{ width: `${person.value / workload[0].value * 100}%` }} /></span><strong>{person.value}</strong><ArrowUpRight size={13} /></button>)}</div> : <Empty>Nenhuma demanda aberta atribuída neste recorte.</Empty>}
          {active.some((task) => !task.assignees.length) && <button className="bi-text-button" onClick={() => filter({ assignee: 'unassigned' })}>{active.filter((task) => !task.assignees.length).length} demandas sem responsável <ArrowUpRight size={13} /></button>}
        </Section>
      </div>
      <div className="bi-week-band">
        <div><h3>Agenda da semana</h3><p>{shortDate(week[0].date)} a {shortDate(week[6].date)}</p></div>
        <div className="bi-week-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={agenda} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#687378', fontSize: 11 }} /><YAxis hide allowDecimals={false} /><Tooltip formatter={(value) => [value, 'Demandas com prazo']} labelFormatter={(label) => `${label} · ${shortDate(agenda.find((day) => day.label === label)?.date ?? week[0].date)}`} cursor={{ fill: '#f1f4f3' }} /><Bar dataKey="value" fill="#257a72" radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
        <button className="bi-text-button" onClick={() => filter({ window: 'week' })}>Ver entregas <ArrowUpRight size={15} /></button>
      </div>
      <Section title="Demandas e prioridades" detail={`${tasks.length} resultados${filtered ? ' filtrados' : ''}`} action={<label className="bi-search"><Search size={15} /><input aria-label="Buscar demanda" placeholder="Buscar demanda" value={filters.search} onChange={(event) => filter({ search: event.target.value })} /></label>}>
        {tasks.length ? <><div className="bi-table-scroll"><table className="bi-table bi-tasks"><thead><tr><th>Demanda</th><th>Status</th><th>Responsáveis</th><th>Prazo</th><th><span className="sr-only">Abrir no ClickUp</span></th></tr></thead><tbody>{tasks.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((task) => {
          const status = TASK_STATES.find((state) => state.key === task.status)!
          return <tr key={task.id}><td><span className="bi-task-title">{task.title}</span><small>{task.list_name}</small></td><td><span className="bi-status"><i style={{ background: status.color }} />{status.label}</span></td><td><div className="bi-assignees">{task.assignees.map((person) => <Person key={person.id} person={person} />)}{!task.assignees.length && <span className="bi-muted">Não atribuído</span>}</div></td><td className={isOverdue(task, today) ? 'bi-late' : ''}>{task.due_date ? shortDate(task.due_date) : 'Sem prazo'}{isOverdue(task, today) && <small>Atrasada</small>}</td><td>{task.url && <a href={task.url} target="_blank" rel="noreferrer" className="bi-icon-button" title={`Abrir ${task.title} no ClickUp`} aria-label={`Abrir ${task.title} no ClickUp`}><ExternalLink size={15} /></a>}</td></tr>
        })}</tbody></table></div><div className="bi-pagination"><span>{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, tasks.length)} de {tasks.length}</span><div><button aria-label="Página anterior" title="Página anterior" className="bi-icon-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage + 1} / {pages}</span><button aria-label="Próxima página" title="Próxima página" className="bi-icon-button" disabled={currentPage + 1 === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div></> : <Empty>Nenhuma demanda encontrada.</Empty>}
      </Section>
      <footer className="bi-footer"><span>Captura do ClickUp: {loading ? 'consultando…' : capturedAt.toLocaleString('pt-BR')}</span><span>Demandas abertas · não inclui histórico de concluídas</span></footer>
    </> : <>
      <div className="bi-filterbar"><label><span>Canal</span><select value={channel} aria-label="Filtrar canal" onChange={(event) => setChannel(event.target.value as typeof channel)}><option value="all">Todos os canais</option><option value="meta_ads">Meta Ads</option><option value="google_ads">Google Ads</option></select></label><span className="bi-period"><CalendarDays size={15} />{performance ? `${shortDate(performance.period.from)} a ${shortDate(performance.period.to)} · ${performance.period.to.slice(0, 4)}` : 'Sem período sincronizado'}</span></div>
      {media.accounts.length ? <>
        <div className="bi-metrics"><Metric label="Investimento" value={money(media.spend)} detail="Total do período sincronizado" icon={CircleDollarSign} tone="bi-primary" /><Metric label="Conversões" value={number(media.conversions)} detail="Eventos atribuídos pelas plataformas" icon={Check} /><Metric label="Custo por conversão" value={media.cpa === null ? '—' : money(media.cpa)} detail="Investimento / conversões" icon={ChartNoAxesCombined} /><Metric label="Taxa de cliques" value={media.ctr === null ? '—' : `${number(media.ctr)}%`} detail={`${number(media.clicks)} cliques`} icon={ArrowUpRight} /></div>
        <div className="bi-media-grid"><Section title="Evolução da performance" detail="Investimento e conversões por dia">{media.daily.length ? <div className="bi-media-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={media.daily} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}><CartesianGrid stroke="#e6eae8" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={26} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis yAxisId="spend" tick={{ fontSize: 11 }} tickFormatter={(value) => `R$${number(value)}`} width={65} tickLine={false} axisLine={false} /><YAxis yAxisId="conversions" orientation="right" tick={{ fontSize: 11 }} width={35} tickLine={false} axisLine={false} /><Tooltip labelFormatter={(value) => shortDate(String(value))} formatter={(value, name) => [name === 'Investimento' ? money(Number(value)) : number(Number(value)), name]} /><Area yAxisId="spend" dataKey="spend" name="Investimento" fill="#deeeeb" stroke="#257a72" strokeWidth={2} isAnimationActive={false} /><Line yAxisId="conversions" dataKey="conversions" name="Conversões" stroke="#c38432" strokeWidth={2} dot={false} isAnimationActive={false} /></ComposedChart></ResponsiveContainer><div className="bi-chart-key"><span><i style={{ background: '#257a72' }} />Investimento</span><span><i style={{ background: '#c38432' }} />Conversões</span></div></div> : <Empty>A série diária ainda não foi sincronizada.</Empty>}</Section>
          <Section title="Participação por canal" detail="Distribuição do investimento">{media.spend > 0 ? <div className="bi-channel-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={media.accounts.map((account) => ({ name: account.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads', value: account.summary.spend, platform: account.platform }))} dataKey="value" nameKey="name" innerRadius={65} outerRadius={90} stroke="none" paddingAngle={3} isAnimationActive={false}>{media.accounts.map((account) => <Cell key={account.platform} fill={account.platform === 'meta_ads' ? '#548bc5' : '#257a72'} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer></div> : <Empty>Sem investimento no período.</Empty>}{media.accounts.map((account) => <div key={account.platform} className="bi-channel-row"><span>{account.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}</span><strong>{money(account.summary.spend)}</strong></div>)}</Section></div>
        <Section title="Campanhas" detail="Resultados do período sincronizado">{media.campaigns.length ? <div className="bi-table-scroll"><table className="bi-table"><thead><tr><th>Campanha</th><th>Canal</th><th>Investimento</th><th>Conversões</th><th>Custo / conversão</th></tr></thead><tbody>{media.campaigns.map((campaign) => <tr key={`${campaign.platform}-${campaign.id}`}><td><span className="bi-task-title">{campaign.name}</span><small>{campaign.status_raw}</small></td><td>{campaign.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}</td><td>{money(campaign.metrics.spend)}</td><td>{number(campaign.metrics.conversions)}</td><td>{campaign.metrics.conversions > 0 ? money(campaign.metrics.spend / campaign.metrics.conversions) : '—'}</td></tr>)}</tbody></table></div> : <Empty>As campanhas ainda não foram sincronizadas.</Empty>}</Section>
      </> : <div className="bi-media-empty"><CircleDollarSign size={32} /><h3>{channel === 'all' ? 'Sem dados de mídia sincronizados' : 'Canal sem dados sincronizados'}</h3><p>{clientName} ainda não tem resultados disponíveis neste recorte.</p>{isGlobalAdmin && <Link to="/integrations" className="bi-text-button">Ver integrações <ArrowUpRight size={15} /></Link>}</div>}
      <footer className="bi-footer"><span>{performance ? `Captura de mídia: ${new Date(performance.last_synced_at).toLocaleString('pt-BR')}` : 'Nenhuma captura de mídia disponível'}</span><span>Conversões de plataformas não representam necessariamente leads únicos.</span></footer>
    </>}
  </div>
}
