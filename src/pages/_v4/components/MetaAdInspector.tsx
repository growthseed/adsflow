/**
 * Meta Ad Inspector — modal full-screen com previews nativos do Facebook
 * embedded em iframe (vídeo autoplay + UI real do placement), painel de
 * métricas e detalhes do criativo. Sem precisar abrir Ad Library.
 */

import { useEffect, useState } from 'react'
import { AlertCircle, ExternalLink, Loader2, X } from 'lucide-react'

import supabase from '@/lib/supabase'

interface InspectPayload {
  ad_id: string
  name: string
  status: string
  effective_status: string
  creative: {
    id: string | null
    name: string | null
    image_url: string | null
    thumbnail_url: string | null
    video_id: string | null
    title: string | null
    body: string | null
    cta: string | null
    object_type: string | null
    page_id: string | null
    instagram_user_id: string | null
    instagram_permalink_url: string | null
    effective_object_story_id: string | null
  }
  previews: Array<{
    format: string
    label: string
    iframe_src: string
    width: number
    height: number
  }>
  metrics: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    cpm: number
    reach: number
    frequency: number
    link_clicks: number
    leads: number
    landing_page_views: number
    cost_per_lead: number
  }
  fetched_at: string
  cached?: boolean
}

interface Props {
  clientSlug: string
  adId: string | null
  accountId: string
  onClose: () => void
}

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const INT = (v: number) => v.toLocaleString('pt-BR')
const PCT = (v: number, d = 2) => `${(v * 100).toFixed(d)}%`

export function MetaAdInspector({ clientSlug, adId, accountId, onClose }: Props) {
  const [data, setData] = useState<InspectPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFormat, setActiveFormat] = useState<string | null>(null)

  useEffect(() => {
    if (!adId) return
    let cancelled = false
    setData(null)
    setError(null)
    setActiveFormat(null)
    setLoading(true)
    ;(async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        if (!token) {
          if (!cancelled) { setError('Sessão expirada.'); setLoading(false) }
          return
        }
        const resp = await fetch(
          `/api/integrations?op=meta-ad-inspect&client_slug=${encodeURIComponent(clientSlug)}&ad_id=${encodeURIComponent(adId)}`,
          { headers: { authorization: `Bearer ${token}` } },
        )
        if (!resp.ok) {
          const j = (await resp.json().catch(() => ({}))) as { detail?: string; error?: string; note?: string }
          throw new Error(j.note || j.detail || j.error || `HTTP ${resp.status}`)
        }
        const body = (await resp.json()) as InspectPayload
        if (!cancelled) {
          setData(body)
          setActiveFormat(body.previews[0]?.format ?? null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [clientSlug, adId])

  useEffect(() => {
    if (!adId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [adId, onClose])

  if (!adId) return null

  const activePreview = data?.previews.find((p) => p.format === activeFormat)

  const adLibraryUrl = `https://www.facebook.com/ads/library/?id=${adId}`
  const adsManagerUrl = `https://business.facebook.com/adsmanager/manage/ads?act=${accountId.replace(/^act_/, '')}&selected_ad_ids=${adId}`

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-[var(--surface-card)] rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">
              Meta Ad · {data?.effective_status ?? 'carregando'}
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)] truncate">{data?.name ?? adId}</h2>
            {data?.creative.title && (
              <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{data.creative.title}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--color-neutral-100)] shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Loading / Error */}
        {loading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando preview oficial via Meta Graph API...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex items-center justify-center px-5 py-10">
            <div className="flex items-start gap-3 max-w-md">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">Não consegui inspecionar</div>
                <p className="text-xs text-[var(--text-tertiary)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        {!loading && !error && data && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
            {/* Preview column */}
            <div className="bg-[var(--color-neutral-50)] flex flex-col overflow-hidden">
              {/* Format tabs */}
              {data.previews.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-3 pb-3 border-b border-[var(--border-subtle)] overflow-x-auto bg-[var(--surface-card)]">
                  {data.previews.map((p) => (
                    <button
                      key={p.format}
                      onClick={() => setActiveFormat(p.format)}
                      className={`text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                        activeFormat === p.format
                          ? 'bg-[var(--color-brand-600)] text-white font-semibold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--color-neutral-100)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Iframe */}
              <div className="flex-1 grid place-items-center overflow-auto py-6 px-4">
                {activePreview ? (
                  <iframe
                    key={activePreview.format}
                    src={activePreview.iframe_src}
                    width={activePreview.width}
                    height={activePreview.height}
                    style={{ border: 'none', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    title={`Preview ${activePreview.label}`}
                  />
                ) : (
                  <div className="text-center text-sm text-[var(--text-tertiary)]">
                    <p>Sem previews disponíveis pra este ad.</p>
                    {data.creative.image_url && (
                      <img src={data.creative.image_url} alt="" className="mt-4 max-w-full rounded-lg shadow-lg" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics + details sidebar */}
            <div className="bg-[var(--surface-card)] border-l border-[var(--border-subtle)] overflow-y-auto p-5 space-y-5">
              {/* Métricas — last 30d */}
              <section>
                <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-tertiary)] mb-3">
                  Performance · 30 dias
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Investido" value={BRL(data.metrics.spend)} primary />
                  <Metric label="Leads" value={INT(data.metrics.leads)} />
                  <Metric label="CPL" value={data.metrics.leads > 0 ? BRL(data.metrics.cost_per_lead) : '—'} primary />
                  <Metric label="CTR" value={data.metrics.impressions > 0 ? PCT(data.metrics.ctr) : '—'} />
                  <Metric label="Impressões" value={INT(data.metrics.impressions)} />
                  <Metric label="Cliques" value={INT(data.metrics.link_clicks || data.metrics.clicks)} />
                  <Metric label="CPC" value={data.metrics.clicks > 0 ? BRL(data.metrics.cpc) : '—'} />
                  <Metric label="CPM" value={data.metrics.impressions > 0 ? BRL(data.metrics.cpm) : '—'} />
                  <Metric label="Alcance" value={INT(data.metrics.reach)} />
                  <Metric label="Frequência" value={data.metrics.frequency.toFixed(2)} />
                </div>
              </section>

              {/* Body do ad */}
              {(data.creative.title || data.creative.body) && (
                <section className="border-t border-[var(--border-subtle)] pt-4">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-tertiary)] mb-2">
                    Copy
                  </div>
                  {data.creative.title && (
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{data.creative.title}</p>
                  )}
                  {data.creative.body && (
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{data.creative.body}</p>
                  )}
                  {data.creative.cta && (
                    <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-semibold uppercase">
                      CTA: {data.creative.cta.replace(/_/g, ' ')}
                    </span>
                  )}
                </section>
              )}

              {/* IDs */}
              <section className="border-t border-[var(--border-subtle)] pt-4 text-[10px] text-[var(--text-tertiary)] space-y-1 font-mono">
                <div>ad_id: {data.ad_id}</div>
                {data.creative.id && <div>creative_id: {data.creative.id}</div>}
                {data.creative.video_id && <div>video_id: {data.creative.video_id}</div>}
                {data.creative.effective_object_story_id && <div>post_id: {data.creative.effective_object_story_id}</div>}
              </section>

              {/* Links externos */}
              <section className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
                {data.creative.instagram_permalink_url && (
                  <a
                    href={data.creative.instagram_permalink_url}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--color-brand-600)] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver post no Instagram
                  </a>
                )}
                <a
                  href={adLibraryUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-[var(--color-brand-600)] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Meta Ad Library
                </a>
                <a
                  href={adsManagerUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ExternalLink className="w-3 h-3" /> Abrir no Gerenciador de Anúncios
                </a>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="bg-[var(--color-neutral-50)] rounded-lg p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${primary ? 'text-[var(--color-brand-600)]' : 'text-[var(--text-primary)]'}`}>{value}</div>
    </div>
  )
}
