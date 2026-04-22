import { useEffect, useState } from 'react'
import { AlertCircle, ExternalLink, Loader2, Settings, X } from 'lucide-react'

import type { MetaCreative } from '@/services/adapters/metaAdsAdapter'

interface Props {
  creative: MetaCreative | null
  accountId: string
  onClose: () => void
}

interface LivePreview {
  previewUrl?: string
  imageUrl?: string
  title?: string
  body?: string
  note?: string
}

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const INT = (v: number) => v.toLocaleString('pt-BR')

/**
 * Modal de detalhes do criativo Meta. Substitui o redirect direto para
 * Ad Library (que frequentemente 404 com ad_ids internos). Mostra
 * métricas locais + tenta puxar preview via Graph API em /api/meta-ads/preview.
 * Links pra Ad Library e Gerenciador ficam como CTAs secundários.
 */
export function MetaCreativeModal({ creative, accountId, onClose }: Props) {
  const [live, setLive] = useState<LivePreview | null>(null)
  const [livelyLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  useEffect(() => {
    if (!creative) return
    setLive(null)
    setLiveError(null)
    setLiveLoading(true)
    fetch(`/api/meta-ads/preview?ad_id=${encodeURIComponent(creative.id)}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 501) {
          const j = await r.json().catch(() => ({}))
          setLive(null)
          setLiveError(j?.note || 'Integração Meta Graph não configurada para este cliente.')
          return
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const body = (await r.json()) as LivePreview
        setLive(body)
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar preview'
        setLiveError(msg)
      })
      .finally(() => setLiveLoading(false))
  }, [creative])

  if (!creative) return null

  const adLibraryUrl = `https://www.facebook.com/ads/library/?id=${creative.id}`
  const adsManagerUrl = `https://business.facebook.com/adsmanager/manage/ads?act=${accountId.replace(/^act_/, '')}&selected_ad_ids=${creative.id}`

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[var(--shadow-overlay)] max-h-[90vh] flex flex-col overflow-hidden">
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <div className="eyebrow text-neutral-500">{creative.format} · {creative.status}</div>
            <h2 className="text-[16px] font-bold text-neutral-900 truncate">{creative.ad_name}</h2>
            <div className="text-[11px] text-neutral-500 truncate mt-0.5">{creative.campaign}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="fechar"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto">
          {/* Preview real (quando Graph API configurada) */}
          <div
            className="aspect-video relative w-full"
            style={{ background: creative.thumb_gradient }}
          >
            {livelyLoading && (
              <div className="absolute inset-0 grid place-items-center text-white">
                <Loader2 size={20} className="animate-spin opacity-80" />
              </div>
            )}
            {live?.imageUrl && (
              <img
                src={live.imageUrl}
                alt={creative.ad_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
              <div className="text-xs opacity-80">{creative.campaign}</div>
              <div className="font-semibold text-sm">{creative.ad_name}</div>
            </div>
          </div>

          {liveError && (
            <div className="mx-5 mt-4 flex items-start gap-2 text-[12px] text-warning-700 bg-warning-50 border border-warning-100 rounded-lg p-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                <b>Preview real indisponível.</b> {liveError}{' '}
                <span className="text-neutral-600">
                  As métricas abaixo vêm do último snapshot sincronizado.
                </span>
              </div>
            </div>
          )}

          {/* Métricas reais do snapshot */}
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kv label="Investido" value={`R$ ${BRL(creative.spend)}`} />
            <Kv label="Impressões" value={INT(creative.impressions)} />
            <Kv label="CTR" value={`${creative.ctr.toFixed(2)}%`} />
            <Kv label="CPC" value={`R$ ${BRL(creative.cpc)}`} />
            {creative.conversions !== undefined && creative.conversions > 0 && (
              <Kv label="Conversões" value={INT(creative.conversions)} />
            )}
            {creative.cost_per_conversion !== undefined && (
              <Kv label="CPA" value={`R$ ${BRL(creative.cost_per_conversion)}`} />
            )}
            {creative.video_views !== undefined && (
              <Kv label="Video views" value={INT(creative.video_views)} />
            )}
            {creative.clicks !== undefined && (
              <Kv label="Cliques" value={INT(creative.clicks)} />
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 px-5 py-3 bg-neutral-50 border-t border-neutral-100">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(creative.id)
            }}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
          >
            Copiar ID · {creative.id.slice(-8)}
          </button>
          <div className="flex items-center gap-2">
            <a
              href={adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-white text-xs font-medium text-neutral-700"
            >
              <ExternalLink size={12} /> Ad Library
            </a>
            <a
              href={adsManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              <Settings size={12} /> Gerenciador
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className="text-[18px] font-bold tabular text-neutral-900 mt-0.5">{value}</div>
    </div>
  )
}
