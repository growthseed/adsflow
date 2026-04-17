/**
 * ============================================
 * Meta Ads Page — G4 Scale / Lovable pattern
 * ============================================
 * Campanhas, criativos, placement breakdown, investimento diário.
 * Rota: /c/:clientSlug/meta-ads
 */

import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from 'recharts'
import { Eye, Play, MoreHorizontal } from 'lucide-react'
import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'

// Mock campaigns — substituir por dados reais da Meta Ads API
const CAMPAIGNS = [
  { id: 'cmp1', name: 'Conversão — Lead Gen Principal', objective: 'Vendas', spend: 18420, impressions: 842300, clicks: 28741, conversions: 412, cpa: 44.7, roas: 6.8, status: 'Ativa' as const },
  { id: 'cmp2', name: 'Awareness Marca Q4', objective: 'Reconhecimento', spend: 9210, impressions: 1240500, clicks: 15820, conversions: 98, cpa: 93.9, roas: 3.1, status: 'Ativa' as const },
  { id: 'cmp3', name: 'Retargeting Carrinho', objective: 'Vendas', spend: 6840, impressions: 312800, clicks: 11240, conversions: 287, cpa: 23.8, roas: 9.4, status: 'Ativa' as const },
  { id: 'cmp4', name: 'Lookalike Top Clientes', objective: 'Conversão', spend: 12380, impressions: 612400, clicks: 19420, conversions: 218, cpa: 56.7, roas: 5.9, status: 'Ativa' as const },
  { id: 'cmp5', name: 'Reels — Tráfego', objective: 'Tráfego', spend: 4120, impressions: 928100, clicks: 24180, conversions: 64, cpa: 64.3, roas: 2.4, status: 'Pausada' as const },
]

const SPEND_DAILY = [
  { day: '01', spend: 1820 }, { day: '03', spend: 2110 }, { day: '05', spend: 2540 },
  { day: '07', spend: 2380 }, { day: '09', spend: 2890 }, { day: '11', spend: 3120 },
  { day: '13', spend: 2980 }, { day: '15', spend: 3340 }, { day: '17', spend: 3580 },
  { day: '19', spend: 3410 }, { day: '21', spend: 3720 }, { day: '23', spend: 3950 },
  { day: '25', spend: 4180 }, { day: '27', spend: 4020 }, { day: '29', spend: 4360 },
]

const PLACEMENTS = [
  { name: 'Feed', value: 42 },
  { name: 'Reels', value: 28 },
  { name: 'Stories', value: 18 },
  { name: 'Audience Network', value: 12 },
]

const CREATIVES = [
  { id: 'cr1', name: 'Hero_3x4_v2', thumb: 'linear-gradient(135deg,#476382,#9ba5aa)', format: 'Imagem', campaign: 'Conversão — Lead Gen', spend: 6240, impressions: 312400, ctr: 3.99, cpa: 32.1, roas: 7.8, status: 'Ativo' },
  { id: 'cr2', name: 'Depoimento_Ana', thumb: 'linear-gradient(135deg,#5d7a98,#bcc7cd)', format: 'Reels', campaign: 'Conversão — Lead Gen', spend: 4180, impressions: 624800, ctr: 3.03, cpa: 41.2, roas: 5.9, status: 'Ativo' },
  { id: 'cr3', name: 'Beneficios_4cards', thumb: 'linear-gradient(135deg,#9ba5aa,#e1ebf0)', format: 'Carrossel', campaign: 'Lookalike', spend: 3920, impressions: 218400, ctr: 3.76, cpa: 38.4, roas: 6.4, status: 'Ativo' },
  { id: 'cr4', name: 'Unboxing_15s', thumb: 'linear-gradient(135deg,#476382,#5d7a98)', format: 'Vídeo', campaign: 'Awareness Q4', spend: 2840, impressions: 412800, ctr: 1.75, cpa: 78.9, roas: 2.8, status: 'Ativo' },
  { id: 'cr5', name: 'Promo_50OFF', thumb: 'linear-gradient(135deg,#7d8e9c,#9ba5aa)', format: 'Imagem', campaign: 'Retargeting', spend: 2110, impressions: 142100, ctr: 4.10, cpa: 18.2, roas: 11.2, status: 'Ativo' },
  { id: 'cr6', name: 'DuoTrend_v3', thumb: 'linear-gradient(135deg,#bcc7cd,#eff2f9)', format: 'Reels', campaign: 'Reels — Tráfego', spend: 1840, impressions: 528100, ctr: 2.69, cpa: 92.0, roas: 1.9, status: 'Pausado' },
]

const COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)']

function KpiSimple({ label, value, delta, primary }: {
  label: string; value: string; delta: string; primary?: boolean
}) {
  const positive = delta.startsWith('+')
  return (
    <div
      className={`rounded-xl p-5 ${primary ? 'text-white' : 'bg-[var(--surface-card)] border border-[var(--border-subtle)]'}`}
      style={primary ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-elegant)' } : { boxShadow: 'var(--shadow-soft)' }}
    >
      <div className={`text-[11px] uppercase tracking-widest font-medium ${primary ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>{label}</div>
      <div className={`mt-2 text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${primary ? 'text-white' : 'text-[var(--text-primary)]'}`}>{value}</div>
      <div className={`mt-2 text-xs font-medium ${primary ? 'text-white/90' : positive ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}>
        {delta} <span className={`ml-1 ${primary ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>vs. período anterior</span>
      </div>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className={`tabular-nums font-semibold ${highlight ? 'text-[var(--color-brand-600)]' : ''}`}>{value}</div>
    </div>
  )
}

export default function MetaAdsPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useMemo(() => clientSlug ? getClientBySlug(clientSlug) : undefined, [clientSlug])

  const totalSpend = CAMPAIGNS.reduce((s, c) => s + c.spend, 0)
  const totalConv = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tráfego Pago · Meta Ads"
        subtitle="Campanhas, criativos e performance por placement."
        breadcrumbs={[{ label: client?.name || '' }, { label: 'Tráfego Pago' }, { label: 'Meta Ads' }]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiSimple label="Investimento" value={`R$ ${(totalSpend / 1000).toFixed(1)}k`} delta="+5,1%" primary />
        <KpiSimple label="Conversões" value={totalConv.toLocaleString('pt-BR')} delta="+14,3%" />
        <KpiSimple label="CPA médio" value={`R$ ${(totalSpend / totalConv).toFixed(2)}`} delta="-9,2%" />
        <KpiSimple label="ROAS" value="5.4x" delta="+0,7x" />
      </div>

      {/* Chart investimento + Placement donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Investimento diário por campanha</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEND_DAILY} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
                <Bar dataKey="spend" fill="var(--color-brand-600)" radius={[6, 6, 0, 0]} name="Investimento" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Distribuição por placement</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PLACEMENTS} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {PLACEMENTS.map((_, i) => <Cell key={i} fill={COLORS[i]} stroke="var(--surface-card)" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PLACEMENTS.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                <span className="text-[var(--text-tertiary)]">{p.name}</span>
                <span className="ml-auto tabular-nums font-medium text-[var(--text-primary)]">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de campanhas */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Campanhas ativas</h3>
          <span className="text-xs border border-[var(--border-subtle)] px-2 py-1 rounded text-[var(--text-secondary)]">{CAMPAIGNS.length} campanhas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[var(--border-subtle)] bg-[var(--color-neutral-50)]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)]">Campanha</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Objetivo</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Investido</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Impressões</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Conversões</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">CPA</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">ROAS</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map(c => (
                <tr key={c.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--color-neutral-50)] transition-colors">
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                  <td className="px-3 py-3 text-[var(--text-tertiary)]">{c.objective}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">R$ {c.spend.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">{c.impressions.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">{c.conversions}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">R$ {c.cpa.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-[var(--color-brand-600)]">{c.roas.toFixed(1)}x</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.status === 'Ativa'
                        ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)]'
                        : 'bg-[var(--color-neutral-100)] text-[var(--text-tertiary)]'
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Criativos */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Top criativos</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Pré-visualização dos criativos sincronizados via Meta Ads Graph API.</p>
          </div>
          <button className="text-xs border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CREATIVES.map(cr => (
            <div key={cr.id} className="rounded-lg border border-[var(--border-subtle)] overflow-hidden group">
              <div className="aspect-[4/5] relative" style={{ background: cr.thumb }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur">{cr.format}</span>
                  {(cr.format === 'Vídeo' || cr.format === 'Reels') && (
                    <span className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-3 w-3 text-black ml-0.5" fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <button className="h-6 w-6 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[11px] opacity-80 truncate">{cr.campaign}</div>
                  <div className="font-semibold text-sm truncate">{cr.name}</div>
                </div>
              </div>
              <div className="p-3 grid grid-cols-4 gap-2 text-xs">
                <Metric label="Invest." value={`R$${(cr.spend / 1000).toFixed(1)}k`} />
                <Metric label="CTR" value={`${cr.ctr.toFixed(2)}%`} />
                <Metric label="CPA" value={`R$${cr.cpa.toFixed(0)}`} />
                <Metric label="ROAS" value={`${cr.roas.toFixed(1)}x`} highlight />
              </div>
              <div className="px-3 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <Eye className="h-3 w-3" />
                  {cr.impressions.toLocaleString('pt-BR')} impressões
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border ${
                  cr.status === 'Ativo'
                    ? 'text-[var(--color-success-600)] border-[var(--color-success-600)]/40'
                    : 'text-[var(--text-tertiary)] border-[var(--border-subtle)]'
                }`}>{cr.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
