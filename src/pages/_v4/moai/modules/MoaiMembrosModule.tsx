/**
 * MoaiMembrosModule — CRM de Membros (1.408 distribuídos por mentor).
 * Páginas filhas:
 *   /moai/membros                       overview (cards por mentor)
 *   /moai/membros/carteiras             tabela completa filtrável
 *   /moai/membros/carteiras/:mentor     drill por mentor
 *   /moai/membros/:membro_id            detalhe de um membro
 */

import { Routes, Route, useParams, NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { Search, ExternalLink, Mail, Building2, User, TrendingUp, TrendingDown } from 'lucide-react'
import { MoaiModuleShell, StubBadge } from './MoaiModuleShell'

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
import {
  useMoaiMembrosResumo,
  useMoaiMembrosLista,
  useMoaiMembroDetalhe,
  type MoaiMembroResumo,
  type MoaiMembroRow,
} from '@/hooks/useMoaiMembros'

const MENTOR_COLORS: Record<string, string> = {
  Vilker: '#E66C37',
  Vini: '#6B007B',
  Ale: '#E044A7',
  Luma: '#744EC2',
  Yas: '#D9B300',
  Marcos: '#3599B8',
  'High End': '#1A1F36',
  Alavanca: '#00C896',
  '(Sem match)': '#9CA3AF',
}

// =============================================================
// SHELL com tabs
// =============================================================

export default function MoaiMembrosModule() {
  return (
    <MoaiModuleShell
      title="Membros & Carteiras"
      description="1.408 membros distribuídos · 6 mentores · 35 conselheiros · 600 membros mapeados com email"
      rightActions={<StubBadge status="ready" />}
      tabs={[
        { to: '', label: 'Visão geral', end: true },
        { to: 'carteiras', label: 'Lista completa' },
        { to: 'jornada', label: 'Jornada' },
        { to: 'matchmaking', label: 'Matchmaking' },
        { to: 'carometros', label: 'Carômetros' },
      ]}
    >
      <Routes>
        <Route index element={<MembrosOverview />} />
        <Route path="carteiras" element={<MembrosCarteirasList />} />
        <Route path="carteiras/:mentor" element={<MembrosPorMentor />} />
        <Route path="jornada" element={<JornadaPlaceholder />} />
        <Route path="matchmaking" element={<MatchmakingPlaceholder />} />
        <Route path="carometros" element={<CarometrosPlaceholder />} />
        <Route path=":membro_id" element={<MembroDetalhe />} />
      </Routes>
    </MoaiModuleShell>
  )
}

// =============================================================
// OVERVIEW — cards por mentor
// =============================================================

function MembrosOverview() {
  const { data, loading, error, refetch } = useMoaiMembrosResumo()

  if (loading) return <Skeleton />
  if (error) return <ErrorBox error={error} />
  if (data.length === 0) return <EmptyBox />

  const total = data.reduce((sum, m) => sum + Number(m.total_membros), 0)
  const totalComDeal = data.reduce((sum, m) => sum + Number(m.com_deal ?? 0), 0)
  const totalWon = data.reduce((sum, m) => sum + Number(m.com_won ?? 0), 0)
  const receitaTotal = data.reduce((sum, m) => sum + Number(m.receita_total ?? 0), 0)
  const totalCritico = data.reduce((sum, m) => sum + Number(m.critico ?? 0), 0)
  const totalAlto = data.reduce((sum, m) => sum + Number(m.alto_engaj ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Fonte e sync */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 bg-gray-50 border border-[#E5E7EB] rounded px-3 py-2">
        <span>Fonte: <strong className="text-gray-600">Monday (Carteiras) + Clint (deals)</strong> — dados sincronizados via Supabase cache</span>
        <button
          type="button"
          onClick={refetch}
          className="text-[10px] text-[#1A1F36] underline hover:no-underline"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* KPIs topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total membros" value={total} />
        <Kpi label="Com deal Clint" value={`${totalComDeal} (${Math.round((totalComDeal / total) * 100)}%)`} tone="success" />
        <Kpi label="Com venda confirmada" value={totalWon} tone="success" />
        <Kpi label="Receita atribuída" value={fmtBRL(receitaTotal)} tone="success" />
        <Kpi label="Alto engajamento" value={totalAlto} tone="success" />
        <Kpi label="Críticos" value={totalCritico} tone="critical" />
      </div>

      {/* Cards mentor */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Por mentor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((m) => (
            <MentorCard key={m.mentor} m={m} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MentorCard({ m }: { m: MoaiMembroResumo }) {
  const color = MENTOR_COLORS[m.mentor] ?? '#6B7280'
  const conselheiroSample = (m.conselheiros ?? []).slice(0, 5)
  const ticketMedio = m.com_won > 0 ? Number(m.receita_total) / Number(m.com_won) : 0
  const conversionRate = m.com_deal > 0 ? (Number(m.com_won) / Number(m.com_deal)) * 100 : 0

  return (
    <Link
      to={`/moai/membros/carteiras/${encodeURIComponent(m.mentor)}`}
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1A1F36] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <h4 className="font-bold text-[#1A1F36]">{m.mentor}</h4>
          </div>
          <div className="text-2xl font-bold text-[#1A1F36]">
            {m.total_membros}
            <span className="text-xs font-normal text-gray-400 ml-1">membros</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 text-right">
          {m.com_deal}/{m.total_membros}<br />com deal
        </span>
      </div>

      {/* Receita destacada */}
      {Number(m.receita_total) > 0 && (
        <div className="mb-3 p-2 bg-emerald-50 border border-emerald-100 rounded">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700">Receita</span>
            <span className="text-xs font-mono text-emerald-700">
              {m.com_won} {m.com_won === 1 ? 'venda' : 'vendas'}
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-700">{fmtBRL(Number(m.receita_total))}</div>
          {ticketMedio > 0 && (
            <div className="text-[10px] text-emerald-600 mt-0.5">
              Ticket médio {fmtBRL(ticketMedio)} · Conv {conversionRate.toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {/* Engajamento bar */}
      <div className="space-y-1 mb-3">
        <StatusBar label="Alto"    value={Number(m.alto_engaj)}  total={Number(m.total_membros)} color="#00C896" />
        <StatusBar label="Médio"   value={Number(m.medio_engaj)} total={Number(m.total_membros)} color="#FFB800" />
        <StatusBar label="Baixo"   value={Number(m.baixo_engaj)} total={Number(m.total_membros)} color="#F97316" />
        <StatusBar label="Crítico" value={Number(m.critico)}     total={Number(m.total_membros)} color="#FF4D4D" />
      </div>

      {/* Conselheiros sample */}
      {conselheiroSample.length > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
            Conselheiros
          </div>
          <div className="text-[11px] text-gray-600">
            {conselheiroSample.join(' · ')}
            {(m.conselheiros?.length ?? 0) > 5 && (
              <span className="text-gray-400"> +{(m.conselheiros?.length ?? 0) - 5}</span>
            )}
          </div>
        </div>
      )}
    </Link>
  )
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  if (!total || !value) return null
  const pct = (value / total) * 100
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-12 text-gray-500">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-gray-600 font-mono">{value}</span>
    </div>
  )
}

// =============================================================
// CARTEIRAS LIST — tabela filtrável
// =============================================================

function MembrosCarteirasList() {
  const [search, setSearch] = useState('')
  const [mentor, setMentor] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const { data, loading } = useMoaiMembrosLista({ search, mentor, status, limit: 500 })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nome, empresa, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A1F36]"
          />
        </div>
        <select
          value={mentor}
          onChange={(e) => setMentor(e.target.value)}
          className="text-xs border border-[#E5E7EB] rounded-md px-3 py-1.5"
        >
          <option value="">Todos mentores</option>
          {Object.keys(MENTOR_COLORS).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs border border-[#E5E7EB] rounded-md px-3 py-1.5"
        >
          <option value="">Todos status</option>
          <option value="alto">Alto Engajamento</option>
          <option value="medio">Médio Engajamento</option>
          <option value="baixo">Baixo Engajamento</option>
          <option value="crit">Crítico</option>
        </select>
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-500">
        {loading ? 'Carregando...' : `${data.length} membros`}
      </div>

      {/* Tabela */}
      <MembrosTable rows={data} />
    </div>
  )
}

// =============================================================
// DRILL POR MENTOR
// =============================================================

function MembrosPorMentor() {
  const params = useParams<{ mentor: string }>()
  const mentor = decodeURIComponent(params.mentor ?? '')
  const { data, loading } = useMoaiMembrosLista({ mentor, limit: 500 })

  const color = MENTOR_COLORS[mentor] ?? '#6B7280'
  const counts = {
    total: data.length,
    alto: data.filter((d) => d.status_carteira?.toLowerCase().startsWith('alto')).length,
    medio: data.filter((d) => d.status_carteira?.toLowerCase().startsWith('m')).length,
    baixo: data.filter((d) => d.status_carteira?.toLowerCase().startsWith('baixo')).length,
    critico: data.filter((d) => d.status_carteira?.toLowerCase().startsWith('cr')).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-[#E5E7EB]">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <h2 className="text-lg font-bold text-[#1A1F36]">Carteira {mentor}</h2>
        <NavLink to="/moai/membros/carteiras" className="ml-auto text-xs text-gray-500 hover:text-[#1A1F36]">
          ← Voltar
        </NavLink>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Kpi label="Total" value={counts.total} />
        <Kpi label="🟢 Alto" value={counts.alto} tone="success" />
        <Kpi label="🟡 Médio" value={counts.medio} tone="warning" />
        <Kpi label="🟠 Baixo" value={counts.baixo} tone="warning" />
        <Kpi label="🔴 Crítico" value={counts.critico} tone="critical" />
      </div>

      {loading ? <Skeleton /> : <MembrosTable rows={data} />}
    </div>
  )
}

// =============================================================
// TABELA reutilizada
// =============================================================

function MembrosTable({ rows }: { rows: MoaiMembroRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center text-sm text-gray-500">
        Nenhum membro encontrado com esses filtros.
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-[#E5E7EB]">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Membro</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Empresa</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Mentor</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Conselheiro</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Receita Clint</th>
            <th className="text-center px-3 py-2 font-semibold text-gray-600">Deals</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.membro_monday_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 text-[#1A1F36] font-medium">
                <Link to={`/moai/membros/${r.membro_monday_id}`} className="hover:underline">
                  {r.nome_curto ?? r.membro_nome}
                </Link>
                {r.email && (
                  <div className="text-[9px] text-gray-400 font-mono">{r.email}</div>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600">{r.empresa ?? '—'}</td>
              <td className="px-3 py-2">
                {r.mentor_carteira ? (
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] rounded font-medium"
                    style={{
                      background: `${MENTOR_COLORS[r.mentor_carteira] ?? '#9CA3AF'}20`,
                      color: MENTOR_COLORS[r.mentor_carteira] ?? '#6B7280',
                    }}
                  >
                    {r.mentor_carteira}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600">{r.conselheiro ?? '—'}</td>
              <td className="px-3 py-2 text-right">
                {r.receita_total && Number(r.receita_total) > 0 ? (
                  <span className="font-mono text-emerald-700 font-semibold">
                    {fmtBRL(Number(r.receita_total))}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-center">
                <DealsBadge won={Number(r.qtd_won)} lost={Number(r.qtd_lost)} open={Number(r.qtd_open)} />
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status_carteira} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DealsBadge({ won, lost, open }: { won: number; lost: number; open: number }) {
  if (won === 0 && lost === 0 && open === 0) return <span className="text-gray-400">—</span>
  return (
    <div className="inline-flex items-center gap-0.5 text-[10px] font-mono">
      {won > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-0.5">
          <TrendingUp size={9} />{won}
        </span>
      )}
      {open > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{open}</span>}
      {lost > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 inline-flex items-center gap-0.5">
          <TrendingDown size={9} />{lost}
        </span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400">—</span>
  const s = status.toLowerCase()
  let cls = 'bg-gray-100 text-gray-600'
  if (s.startsWith('alto')) cls = 'bg-emerald-50 text-emerald-700'
  else if (s.startsWith('m')) cls = 'bg-amber-50 text-amber-700'
  else if (s.startsWith('baixo')) cls = 'bg-orange-50 text-orange-700'
  else if (s.startsWith('cr')) cls = 'bg-red-50 text-red-700'
  return <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-medium ${cls}`}>{status}</span>
}

// =============================================================
// MEMBRO DETALHE
// =============================================================

function MembroDetalhe() {
  const params = useParams<{ membro_id: string }>()
  const { data, loading } = useMoaiMembroDetalhe(params.membro_id)

  if (loading) return <Skeleton />
  if (!data) return <ErrorBox error="Membro não encontrado" />

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{ background: MENTOR_COLORS[data.mentor_carteira ?? ''] ?? '#6B7280' }}
        >
          <User size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[#1A1F36]">{data.nome_curto ?? data.membro_nome}</h2>
          {data.empresa && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Building2 size={12} /> {data.empresa}
            </p>
          )}
        </div>
        <a
          href={`https://moai-global.monday.com/boards/18403211175/pulses/${data.membro_monday_id}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-500 hover:text-[#1A1F36] flex items-center gap-1 underline"
        >
          Abrir no Monday <ExternalLink size={11} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailRow label="Email" value={data.email ?? '—'} icon={<Mail size={12} />} />
        <DetailRow label="Mentor" value={data.mentor_carteira ?? '—'} />
        <DetailRow label="Conselheiro" value={data.conselheiro ?? '—'} />
        <DetailRow label="Status engajamento" value={<StatusBadge status={data.status_carteira} />} />
        <DetailRow label="Tem case de sucesso?" value={data.tem_case_sucesso ?? '—'} />
        <DetailRow label="Health Score" value={data.health_score != null ? String(data.health_score) : '—'} />
      </div>

      {/* Card Clint */}
      {data.tem_deal_clint && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-emerald-900 mb-3">💼 Histórico Clint</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700">Receita</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                {fmtBRL(Number(data.receita_total ?? 0))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700">Vendas (WON)</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{data.qtd_won}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-700">Em aberto</div>
              <div className="text-lg font-bold text-amber-700 mt-0.5">{data.qtd_open}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-red-700">Perdas</div>
              <div className="text-lg font-bold text-red-700 mt-0.5">{data.qtd_lost}</div>
            </div>
          </div>
          {data.ultima_venda_at && (
            <div className="text-[10px] text-emerald-600 mt-3">
              Última venda: {new Date(data.ultima_venda_at).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[#E5E7EB] pt-3 text-xs text-gray-500">
        ID Monday: <span className="font-mono">{data.membro_monday_id}</span>
      </div>
    </div>
  )
}

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm text-[#1A1F36]">{value}</div>
    </div>
  )
}

// =============================================================
// UTIL
// =============================================================

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: 'success' | 'warning' | 'critical' }) {
  const colors = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  } as const
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tone ? colors[tone] : 'text-[#1A1F36]'}`}>{value}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

function getErrorText(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const text = candidate.message ?? candidate.details ?? candidate.hint
    if (typeof text === 'string' && text.trim()) return text
    if (candidate.code) return `Erro ${String(candidate.code)}`
  }
  return 'Nao foi possivel carregar esta tela agora.'
}

function ErrorBox({ error }: { error: unknown }) {
  const message = getErrorText(error)
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      ⚠️ {message}
    </div>
  )
}

function EmptyBox() {
  return (
    <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center text-sm text-gray-500">
      Nenhum dado ainda. Rode a sincronização Monday primeiro.
    </div>
  )
}

function JornadaPlaceholder() {
  const stages = [
    { key: 'lead',       label: 'Lead',       desc: 'Interesse inicial capturado', color: '#6B7280', count: null },
    { key: 'onboarding', label: 'Onboarding', desc: 'Primeiro acesso e orientação', color: '#3B82F6', count: null },
    { key: 'ativo',      label: 'Ativo',      desc: 'Participação em conselhos e eventos', color: '#00C896', count: null },
    { key: 'advocate',   label: 'Advocate',   desc: 'Indica membros e produz cases', color: '#E66C37', count: null },
  ]
  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-[#1A1F36]">Funil de Jornada do Membro</h3>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Em construção</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex-1">
              <div className="relative">
                {i < stages.length - 1 && (
                  <div className="hidden sm:block absolute right-[-8px] top-1/2 -translate-y-1/2 z-10 text-gray-300 text-xs font-bold">›</div>
                )}
                <div
                  className="rounded-lg p-4 border-2 border-dashed opacity-60"
                  style={{ borderColor: stage.color }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="text-xl font-bold text-gray-300">—</div>
                  <div className="text-[10px] text-gray-400 mt-1">{stage.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
          Fonte planejada: Monday board de jornada + Clint deals por etapa. View <code className="font-mono bg-gray-100 px-1 rounded">vw_moai_jornada</code> a criar.
        </p>
      </div>
    </div>
  )
}

function MatchmakingPlaceholder() {
  return (
    <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
      <h3 className="text-base font-semibold text-[#1A1F36] mb-1">Matchmaking</h3>
      <p className="text-xs text-gray-500">Sugere conexões entre membros baseado em CNAE/objetivos. Em construção.</p>
    </div>
  )
}
function CarometrosPlaceholder() {
  return (
    <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
      <h3 className="text-base font-semibold text-[#1A1F36] mb-1">Carômetros</h3>
      <p className="text-xs text-gray-500">375 carômetros do CM e CS. View <code className="font-mono bg-gray-100 px-1 rounded">vw_moai_carometros</code> a criar.</p>
    </div>
  )
}
