/**
 * MoaiConteudoModule — Conteúdo & Marketing.
 * Dados reais:
 *   - 1.316 itens (508 publicados, 697 planejados, 92 aprovados, 19 pausados)
 *   - 3 canais (Comunidade 406 + IG 277 + Redes Sociais 633)
 *   - 30 editorias · 67 responsáveis
 *   - 72 mês atual · 103 mês anterior
 *
 * Quando Meta token liberar, adiciona aba /campanhas e /criativos com dados Meta Ads.
 */

import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { MoaiModuleShell, StubBadge } from './MoaiModuleShell'
import {
  useMoaiConteudoResumo,
  useMoaiConteudoPorCanal,
  useMoaiConteudoPorEditoria,
  useMoaiConteudoPorResponsavel,
  useMoaiConteudoCalendar,
  useMoaiConteudoLista,
  type ConteudoItem,
} from '@/hooks/useMoaiConteudo'

const CANAL_COLORS: Record<string, string> = {
  'Cronograma Comunidade': '#744EC2',
  'Cronograma Instagram': '#E044A7',
  'Redes Sociais MOAI': '#E66C37',
}

const STATUS_COLORS: Record<string, string> = {
  publicado: 'bg-emerald-50 text-emerald-700',
  aprovado: 'bg-blue-50 text-blue-700',
  em_producao: 'bg-amber-50 text-amber-700',
  planejado: 'bg-gray-50 text-gray-600',
  pausado: 'bg-red-50 text-red-700',
}

export default function MoaiConteudoModule() {
  return (
    <MoaiModuleShell
      title="Conteúdo & Marketing"
      description="1.316 itens · 3 canais (Comunidade + IG + Redes Sociais) · 30 editorias · 67 responsáveis · Meta Ads (aguarda 2-step BM)"
      rightActions={<StubBadge status="ready" />}
      tabs={[
        { to: '', label: 'Visão geral', end: true },
        { to: 'cronograma', label: 'Cronograma' },
        { to: 'canais', label: 'Canais' },
        { to: 'editorias', label: 'Editorias' },
        { to: 'time', label: 'Time' },
        { to: 'meta-ads', label: 'Meta Ads' },
      ]}
    >
      <Routes>
        <Route index element={<ConteudoOverview />} />
        <Route path="cronograma" element={<CronogramaTab />} />
        <Route path="canais" element={<CanaisTab />} />
        <Route path="editorias" element={<EditoriasTab />} />
        <Route path="time" element={<TimeTab />} />
        <Route path="meta-ads" element={<MetaAdsPlaceholder />} />
      </Routes>
    </MoaiModuleShell>
  )
}

// =============================================================
// OVERVIEW
// =============================================================

function ConteudoOverview() {
  const { data: resumo, loading } = useMoaiConteudoResumo()
  const { data: porCanal } = useMoaiConteudoPorCanal()
  const { data: calendar } = useMoaiConteudoCalendar(3)

  if (loading || !resumo) return <Skeleton />
  const a = resumo.atual
  const c = resumo.comparativo

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Total itens" value={a.total} delta={c?.delta_total_pct} />
        <Kpi label="Publicados" value={a.publicados} tone="success" delta={c?.delta_publicados_pct} />
        <Kpi label="Planejados" value={a.planejados} tone="warning" />
        <Kpi label="Em produção" value={a.em_producao} />
        <Kpi label="Aprovados" value={a.aprovados} />
        <Kpi label="Pausados" value={a.pausados} tone="critical" />
        <Kpi label="Editorias" value={a.editorias_distintas} sub="distintas" />
        <Kpi label="Responsáveis" value={a.responsaveis_distintos} sub="distintos" />
      </div>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribuição por canal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {porCanal.map((c) => (
            <CanalCard key={c.canal} c={c} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Densidade temporal (últimos 3 meses)</h3>
          <span className="text-[10px] text-gray-400">
            {calendar.reduce((s, d) => s + Number(d.count), 0)} itens publicados
          </span>
        </div>
        <CalendarHeat data={calendar} />
      </section>
    </div>
  )
}

function CanalCard({ c }: { c: { canal: string; total: number; publicados: number; planejados: number; em_producao: number; aprovados: number } }) {
  const color = CANAL_COLORS[c.canal] ?? '#6B7280'
  const pctPublicado = c.total > 0 ? Math.round((Number(c.publicados) / Number(c.total)) * 100) : 0
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <h4 className="font-bold text-[#1A1F36] text-sm">{c.canal}</h4>
      </div>
      <div className="text-2xl font-bold text-[#1A1F36] mb-2">
        {c.total}
        <span className="text-xs font-normal text-gray-400 ml-1">itens</span>
      </div>
      <div className="space-y-1.5">
        <Bar label="Publicado" value={Number(c.publicados)} total={Number(c.total)} color="#00C896" />
        <Bar label="Planejado" value={Number(c.planejados)} total={Number(c.total)} color="#9CA3AF" />
        <Bar label="Aprovado" value={Number(c.aprovados)} total={Number(c.total)} color="#3599B8" />
        <Bar label="Em produção" value={Number(c.em_producao)} total={Number(c.total)} color="#FFB800" />
      </div>
      <div className="text-[10px] text-gray-400 mt-2">{pctPublicado}% publicado</div>
    </div>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  if (!value) return null
  const pct = (value / total) * 100
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-16 text-gray-500">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-7 text-right text-gray-600 font-mono">{value}</span>
    </div>
  )
}

// =============================================================
// CRONOGRAMA (Lista filtrável)
// =============================================================

function CronogramaTab() {
  const [search, setSearch] = useState('')
  const [canal, setCanal] = useState('')
  const [status, setStatus] = useState('')
  const { data, loading } = useMoaiConteudoLista({ search, canal, status, limit: 500 })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Buscar título ou editoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A1F36]"
          />
        </div>
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className="text-xs border border-[#E5E7EB] rounded-md px-3 py-1.5">
          <option value="">Todos canais</option>
          <option>Cronograma Comunidade</option>
          <option>Cronograma Instagram</option>
          <option>Redes Sociais MOAI</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs border border-[#E5E7EB] rounded-md px-3 py-1.5">
          <option value="">Todos status</option>
          <option value="publicado">Publicado</option>
          <option value="aprovado">Aprovado</option>
          <option value="em_producao">Em produção</option>
          <option value="planejado">Planejado</option>
          <option value="pausado">Pausado</option>
        </select>
      </div>
      <div className="text-xs text-gray-500">{loading ? 'Carregando...' : `${data.length} itens`}</div>
      <ConteudoTable rows={data} />
    </div>
  )
}

function ConteudoTable({ rows }: { rows: ConteudoItem[] }) {
  if (rows.length === 0) return (
    <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center text-sm text-gray-500">
      Nenhum item encontrado.
    </div>
  )
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Título</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Canal</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Editoria</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Formato</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Responsável</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Data</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.item_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 text-[#1A1F36] font-medium max-w-[280px] truncate" title={r.titulo}>{r.titulo}</td>
              <td className="px-3 py-2"><CanalBadge canal={r.canal} /></td>
              <td className="px-3 py-2 text-gray-600">{r.editoria ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600">{r.formato ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600">{r.responsavel ?? '—'}</td>
              <td className="px-3 py-2 text-right text-gray-500 font-mono text-[10px]">
                {r.data_post ? new Date(r.data_post).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td className="px-3 py-2"><StatusBadge status={r.status_norm} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CanalBadge({ canal }: { canal: string }) {
  const color = CANAL_COLORS[canal] ?? '#6B7280'
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] rounded font-medium"
      style={{ background: `${color}20`, color }}>
      {canal.replace('Cronograma ', '').replace(' MOAI', '')}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400">—</span>
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  return <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-medium ${cls}`}>{status}</span>
}

// =============================================================
// TABS auxiliares
// =============================================================

function CanaisTab() {
  const { data, loading } = useMoaiConteudoPorCanal()
  if (loading) return <Skeleton />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {data.map((c) => <CanalCard key={c.canal} c={c} />)}
    </div>
  )
}

function EditoriasTab() {
  const { data, loading } = useMoaiConteudoPorEditoria()
  if (loading) return <Skeleton />
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Editoria</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Total</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Publicados</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Planejados</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">% publicado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => {
            const pct = e.total > 0 ? Math.round((Number(e.publicados) / Number(e.total)) * 100) : 0
            return (
              <tr key={e.editoria} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-[#1A1F36] font-medium">{e.editoria}</td>
                <td className="px-3 py-2 text-right font-mono">{e.total}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-700">{e.publicados}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-500">{e.planejados}</td>
                <td className="px-3 py-2 text-right font-mono">{pct}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TimeTab() {
  const { data, loading } = useMoaiConteudoPorResponsavel()
  if (loading) return <Skeleton />
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Responsável</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Total</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Publicados</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Em andamento</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">% concluído</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const pct = p.total > 0 ? Math.round((Number(p.publicados) / Number(p.total)) * 100) : 0
            return (
              <tr key={p.responsavel} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-[#1A1F36] font-medium">{p.responsavel}</td>
                <td className="px-3 py-2 text-right font-mono">{p.total}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-700">{p.publicados}</td>
                <td className="px-3 py-2 text-right font-mono text-amber-700">{p.em_andamento}</td>
                <td className="px-3 py-2 text-right font-mono">{pct}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MetaAdsPlaceholder() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-sm">
      <h3 className="font-semibold text-amber-900 mb-2">📊 Meta Ads — aguardando aprovação BM</h3>
      <p className="text-amber-800 mb-3">
        Token MOAI <code className="bg-amber-100 px-1 rounded text-[10px]">act_394842817764673</code> existe mas
        ainda não foi atribuído ao System User "Claude" via 2-step do BM MOAI.
      </p>
      <p className="text-xs text-amber-700">
        Após Vinicius liberar: campanhas, conjuntos, anúncios e criativos serão sincronizados via N8N → Supabase
        e aparecerão aqui com paridade Reportei (CPL × CTR scatter, Pivot hierárquica, etc).
      </p>
    </div>
  )
}

// =============================================================
// CALENDAR HEAT (mini)
// =============================================================

function CalendarHeat({ data }: { data: Array<{ data: string; count: number }> }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => Number(d.count)))
  const byKey = new Map(data.map((d) => [d.data, Number(d.count)]))

  // Gera grid últimos 90 dias
  const days: string[] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  // Organiza em colunas de 7 (semanas)
  const weeks: string[][] = []
  let week: string[] = Array((new Date(days[0])).getDay()).fill('')
  for (const d of days) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) { while (week.length < 7) week.push(''); weeks.push(week) }

  function colorFor(c: number): string {
    if (c === 0) return '#F3F4F6'
    const norm = c / max
    if (norm < 0.25) return '#FED7AA'
    if (norm < 0.5) return '#FDBA74'
    if (norm < 0.75) return '#FB923C'
    return '#EA580C'
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((wk, i) => (
          <div key={i} className="flex flex-col gap-1">
            {wk.map((d, j) => {
              if (!d) return <div key={j} className="w-3 h-3" />
              const c = byKey.get(d) ?? 0
              return (
                <div key={j}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: colorFor(c) }}
                  title={`${d}: ${c} ${c === 1 ? 'item' : 'itens'}`} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-400">
        <span>Menos</span>
        {['#F3F4F6', '#FED7AA', '#FDBA74', '#FB923C', '#EA580C'].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}

// =============================================================
// UTILS
// =============================================================

function Kpi({ label, value, tone, sub, delta }: { label: string; value: number; tone?: 'success' | 'warning' | 'critical'; sub?: string; delta?: number | null }) {
  const tc = tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : tone === 'critical' ? 'text-red-600' : 'text-[#1A1F36]'
  const showDelta = delta != null && !Number.isNaN(delta)
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tc}`}>{value}</div>
      {showDelta ? (
        <div className={`text-[10px] mt-0.5 ${(delta as number) > 0 ? 'text-emerald-600' : (delta as number) < 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {(delta as number) > 0 ? '↑' : (delta as number) < 0 ? '↓' : '→'} {Math.abs(delta as number).toFixed(1)}% vs ant.
        </div>
      ) : sub ? (
        <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
      ) : null}
    </div>
  )
}

function Skeleton() {
  return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
}
