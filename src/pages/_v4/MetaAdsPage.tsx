/**
 * Meta Ads Page — dados reais via snapshot Meta Graph API.
 *
 * Rota: /c/:clientSlug/meta-ads
 * Fonte: src/data/snapshots/meta-ads-snapshot.json (via metaAdsAdapter)
 * Clientes ativos com dados: isaac-newton, homero-reis, dr-euvaldo-tomaz, escola-pequeno-aprendiz
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from 'recharts'
import { Eye, Play, MoreHorizontal, AlertCircle, Clock, ExternalLink, Settings, Facebook } from 'lucide-react'
import { PageHeader } from '@/components/canonical'
import { getMetaAdsSnapshot, getMetaAdsPeriod } from '@/services/adapters/metaAdsAdapter'
import { useResolvedAgencyClient } from '@/hooks/useResolvedAgencyClient'
import { MetaCreativeModal } from './components/MetaCreativeModal'

/** Builders de URLs da Meta — abrem em nova aba. */
const metaLinks = {
  /** Ad Library: pública, sem login, mostra o anúncio como apareceu no feed. */
  adLibrary: (adId: string) => `https://www.facebook.com/ads/library/?id=${adId}`,
  /** Gerenciador de Anúncios: abre ad específico. Precisa login. */
  adsManager: (accountId: string, adId: string) =>
    `https://business.facebook.com/adsmanager/manage/ads?act=${accountId.replace(/^act_/, '')}&selected_ad_ids=${adId}`,
  /** Página do anunciante no Facebook. */
  fbPage: (pageId: string) => `https://www.facebook.com/${pageId}`,
}

const COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)']

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const INT = (v: number) => v.toLocaleString('pt-BR')

const fmtKBRL = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${BRL(v)}`

function KpiSimple({
  label, value, sub, primary,
}: {
  label: string; value: string; sub?: string; primary?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-5 ${primary ? 'text-white' : 'bg-[var(--surface-card)] border border-[var(--border-subtle)]'}`}
      style={primary ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-elegant)' } : { boxShadow: 'var(--shadow-soft)' }}
    >
      <div className={`text-[11px] uppercase tracking-widest font-medium ${primary ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>{label}</div>
      <div className={`mt-2 text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${primary ? 'text-white' : 'text-[var(--text-primary)]'}`}>{value}</div>
      {sub && (
        <div className={`mt-2 text-xs font-medium ${primary ? 'text-white/90' : 'text-[var(--text-tertiary)]'}`}>
          {sub}
        </div>
      )}
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

function CreativeCard({ cr, accountId, onOpen }: {
  cr: import('@/services/adapters/metaAdsAdapter').MetaCreative
  accountId: string
  onOpen: (cr: import('@/services/adapters/metaAdsAdapter').MetaCreative) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden group bg-[var(--surface-card)]">
      {/* Thumbnail — clicável → abre modal de detalhes local (não redireciona Ad Library) */}
      <button
        type="button"
        onClick={() => onOpen(cr)}
        className="aspect-[4/5] relative w-full block cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]"
        style={{ background: cr.thumb_gradient }}
        aria-label={`Abrir detalhes de ${cr.ad_name}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/95 text-black text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            <Eye className="h-3 w-3" />
            Ver detalhes
          </span>
        </div>
        <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur">{cr.format}</span>
          {(cr.format === 'Vídeo' || cr.format === 'Reels') && (
            <span className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-3 w-3 text-black ml-0.5" fill="currentColor" />
            </span>
          )}
        </div>

        {/* Dropdown do botão ... */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="h-7 w-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Mais ações"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-1 min-w-[200px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xl py-1 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={metaLinks.adLibrary(cr.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLink className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
                Ver na Meta Ad Library
              </a>
              <a
                href={metaLinks.adsManager(accountId, cr.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
                Editar no Gerenciador
              </a>
              <a
                href={`https://www.facebook.com/search/posts/?q=${encodeURIComponent(cr.ad_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => setMenuOpen(false)}
              >
                <Facebook className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
                Buscar post no Facebook
              </a>
              <div className="border-t border-[var(--border-subtle)] my-1" />
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => { navigator.clipboard.writeText(cr.id); setMenuOpen(false) }}
              >
                Copiar ID do ad ({cr.id.slice(-6)})
              </button>
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
          <div className="text-[11px] opacity-80 truncate">{cr.campaign}</div>
          <div className="font-semibold text-sm truncate">{cr.ad_name}</div>
        </div>
      </button>

      <div className="p-3 grid grid-cols-4 gap-2 text-xs">
        <Metric label="Invest." value={fmtKBRL(cr.spend)} />
        <Metric label="CTR" value={`${cr.ctr.toFixed(2)}%`} />
        <Metric label="CPC" value={`R$${BRL(cr.cpc)}`} />
        <Metric
          label={cr.conversions !== undefined && cr.conversions > 0 ? 'CPA' : cr.video_views !== undefined ? 'Views' : 'Cliques'}
          value={
            cr.conversions !== undefined && cr.conversions > 0
              ? `R$${cr.cost_per_conversion?.toFixed(0) ?? '0'}`
              : cr.video_views !== undefined
                ? INT(cr.video_views)
                : INT(cr.clicks)
          }
          highlight
        />
      </div>
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
          <Eye className="h-3 w-3" />
          {INT(cr.impressions)} impressões
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded border ${
          cr.status === 'Ativo'
            ? 'text-[var(--color-success-600)] border-[var(--color-success-600)]/40'
            : 'text-[var(--text-tertiary)] border-[var(--border-subtle)]'
        }`}>{cr.status}</span>
      </div>
    </div>
  )
}

function EmptyState({ clientName }: { clientName: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-10 text-center" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Nenhum dado Meta Ads para {clientName}</h3>
      <p className="text-sm text-[var(--text-tertiary)] mt-1 max-w-md mx-auto">
        Este cliente ainda não tem conta Meta conectada ou não há dados sincronizados no período atual.
        Conecte a conta em{' '}
        <Link to="/integrations" className="text-[var(--color-brand-600)] underline">Integrações</Link>
        {' '}para sincronizar.
      </p>
    </div>
  )
}

interface MetaAdsPageProps {
  clientSlugOverride?: string
  embedded?: boolean
}

export default function MetaAdsPage({ clientSlugOverride, embedded = false }: MetaAdsPageProps = {}) {
  const params = useParams<{ clientSlug: string }>()
  const clientSlug = clientSlugOverride ?? params.clientSlug
  void embedded
  const client = useResolvedAgencyClient(clientSlug)
  const data = useMemo(() => clientSlug ? getMetaAdsSnapshot(clientSlug) : null, [clientSlug])
  const period = getMetaAdsPeriod()
  const [selectedCreative, setSelectedCreative] =
    useState<import('@/services/adapters/metaAdsAdapter').MetaCreative | null>(null)

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tráfego Pago · Meta Ads"
          subtitle="Campanhas, criativos e performance por placement."
          breadcrumbs={[{ label: client?.name || clientSlug || '' }, { label: 'Tráfego Pago' }, { label: 'Meta Ads' }]}
        />
        <EmptyState clientName={client?.name || clientSlug || 'este cliente'} />
      </div>
    )
  }

  const s = data.summary
  const syncedAt = new Date(data.last_synced_at)
  const syncedLabel = syncedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  const placementChartData = data.placements.map(p => ({ name: p.name, value: p.pct_spend }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tráfego Pago · Meta Ads"
        subtitle={`${data.account_name} · ${period.label}`}
        breadcrumbs={[{ label: client?.name || data.client_name }, { label: 'Tráfego Pago' }, { label: 'Meta Ads' }]}
      />

      {/* Sync status */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Clock className="w-3.5 h-3.5" />
        <span>Sincronizado via Meta Graph API em {syncedLabel}</span>
        <span className="text-[var(--color-success-600)] font-medium">● Conectado</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiSimple
          label="Investimento"
          value={fmtKBRL(s.spend)}
          sub={`${s.active_campaigns} campanha${s.active_campaigns !== 1 ? 's' : ''} ativa${s.active_campaigns !== 1 ? 's' : ''}`}
          primary
        />
        <KpiSimple
          label="Impressões"
          value={INT(s.impressions)}
          sub={`Alcance ${INT(s.reach)} · freq ${s.frequency.toFixed(2)}`}
        />
        <KpiSimple
          label="Cliques"
          value={INT(s.clicks)}
          sub={`CTR ${s.ctr.toFixed(2)}% · CPC R$ ${BRL(s.cpc)}`}
        />
        <KpiSimple
          label={s.messaging_conversations !== undefined ? 'Conv. WhatsApp' : s.video_views !== undefined ? 'Video views' : 'Engajamento'}
          value={INT(s.messaging_conversations ?? s.video_views ?? s.link_clicks ?? 0)}
          sub={`CPM R$ ${BRL(s.cpm)}`}
        />
      </div>

      {/* Campanhas bar chart + Placement donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Investimento por campanha</h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Período: {period.label}</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.campaigns.map(c => ({ name: c.short_name, spend: c.metrics.spend }))} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                  formatter={(v) => `R$ ${BRL(Number(v))}`}
                />
                <Bar dataKey="spend" fill="var(--color-brand-600)" radius={[6, 6, 0, 0]} name="Investimento" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Distribuição por placement</h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-2">% do investimento total</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={placementChartData} dataKey="value" innerRadius={55} outerRadius={88} paddingAngle={2}>
                  {placementChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface-card)" strokeWidth={2} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                  formatter={(v) => `${Number(v).toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {data.placements.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[var(--text-tertiary)] truncate">{p.name}</span>
                <span className="ml-auto tabular-nums font-medium text-[var(--text-primary)]">{p.pct_spend.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de campanhas */}
      <div
        className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Campanhas</h3>
          <span className="text-xs border border-[var(--border-subtle)] px-2 py-1 rounded text-[var(--text-secondary)]">
            {data.campaigns.length} campanha{data.campaigns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[var(--border-subtle)] bg-[var(--color-neutral-50)]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)]">Campanha</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Objetivo</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Investido</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Impressões</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Cliques</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">CTR</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">CPC</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map(c => (
                <tr key={c.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--color-neutral-50)] transition-colors">
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                  <td className="px-3 py-3 text-[var(--text-tertiary)]">{c.objective}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">R$ {BRL(c.metrics.spend)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">{INT(c.metrics.impressions)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">{INT(c.metrics.clicks)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--text-primary)]">{c.metrics.ctr.toFixed(2)}%</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-[var(--color-brand-600)]">R$ {BRL(c.metrics.cpc)}</td>
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
      <div
        className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Criativos ativos</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {data.creatives.length} criativo{data.creatives.length !== 1 ? 's' : ''} · ordenado por investimento
            </p>
          </div>
          <button className="text-xs border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.creatives.map(cr => (
            <CreativeCard key={cr.id} cr={cr} accountId={data.account_id} onOpen={setSelectedCreative} />
          ))}
        </div>
      </div>

      <MetaCreativeModal
        creative={selectedCreative}
        accountId={data.account_id}
        onClose={() => setSelectedCreative(null)}
      />
    </div>
  )
}
