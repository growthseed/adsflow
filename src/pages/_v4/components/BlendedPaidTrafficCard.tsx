import { Link } from 'react-router-dom'
import { ArrowRight, Facebook, Chrome } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import { getMetaAdsSnapshot } from '@/services/adapters/metaAdsAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'

interface Props {
  clientSlug: string
}

/**
 * Card "Tráfego Pago · consolidado" — mostra Meta + Google lado a lado
 * na ClientOverview. Handoff V2: overview é a vitrine do cliente, precisa
 * ver a carteira de mídia inteira, não só 1 canal.
 */
export function BlendedPaidTrafficCard({ clientSlug }: Props) {
  const meta = getMetaAdsSnapshot(clientSlug)
  const perf = getClientPerformance(clientSlug)
  const google = perf?.platforms.google_ads

  const hasMeta = !!meta
  const hasGoogle = !!google

  if (!hasMeta && !hasGoogle) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-neutral-600 font-semibold mb-1">
          Sem integrações de mídia conectadas
        </p>
        <p className="text-xs text-neutral-500 mb-3">
          Conecte Meta Ads e/ou Google Ads para ver performance consolidada aqui.
        </p>
        <Link
          to="/integrations"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
        >
          Conectar agora <ArrowRight size={12} />
        </Link>
      </Card>
    )
  }

  const metaSpend = meta?.summary.spend ?? 0
  const googleSpend = google?.summary.spend ?? 0
  const totalSpend = metaSpend + googleSpend

  const metaLeads = meta?.summary.messaging_conversations ?? meta?.summary.link_clicks ?? 0
  const googleLeads = google?.summary.conversions ?? 0
  const totalLeads = metaLeads + googleLeads

  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : null

  const metaShare = totalSpend > 0 ? (metaSpend / totalSpend) * 100 : 0
  const googleShare = totalSpend > 0 ? (googleSpend / totalSpend) * 100 : 0

  return (
    <Card>
      <CardHead
        title="Tráfego Pago · consolidado"
        subtitle="Meta + Google agregados no período"
        actions={
          <Link
            to={`/c/${clientSlug}/performance`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
          >
            Detalhes <ArrowRight size={12} />
          </Link>
        }
      />
      <CardBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <HeroKpi label="Investido (total)" value={formatMetric(totalSpend, 'currency', { compact: totalSpend >= 10000 })} primary />
          <HeroKpi label="Leads (blended)" value={totalLeads.toLocaleString('pt-BR')} />
          <HeroKpi
            label="CPL médio"
            value={avgCpl != null ? formatMetric(avgCpl, 'currency') : '—'}
          />
          <HeroKpi
            label="Canais conectados"
            value={[hasMeta ? 'Meta' : null, hasGoogle ? 'Google' : null]
              .filter(Boolean)
              .join(' · ') || '—'}
          />
        </div>

        {/* Share bar */}
        {totalSpend > 0 && (
          <>
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Distribuição de investimento</span>
              <span className="tabular">
                Meta {metaShare.toFixed(0)}% · Google {googleShare.toFixed(0)}%
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-neutral-100 mb-5">
              {hasMeta && (
                <div
                  className="bg-[#1877f2]"
                  style={{ width: `${metaShare}%` }}
                  aria-label={`Meta ${metaShare.toFixed(0)}%`}
                />
              )}
              {hasGoogle && (
                <div
                  className="bg-[#34a853]"
                  style={{ width: `${googleShare}%` }}
                  aria-label={`Google ${googleShare.toFixed(0)}%`}
                />
              )}
            </div>
          </>
        )}

        {/* Per-platform rows */}
        <div className="space-y-2">
          {hasMeta && (
            <PlatformRow
              icon={<Facebook size={14} />}
              brandColor="#1877f2"
              name="Meta Ads"
              sub={meta!.account_name}
              spend={metaSpend}
              leads={metaLeads}
              ctr={meta!.summary.ctr}
              linkTo={`/c/${clientSlug}/meta-ads`}
            />
          )}
          {hasGoogle && (
            <PlatformRow
              icon={<Chrome size={14} />}
              brandColor="#34a853"
              name="Google Ads"
              sub={google!.account_name}
              spend={googleSpend}
              leads={googleLeads}
              ctr={google!.summary.ctr}
              linkTo={`/c/${clientSlug}/performance`}
            />
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function HeroKpi({
  label,
  value,
  primary = false,
}: {
  label: string
  value: string
  primary?: boolean
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        primary
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div
        className={`eyebrow ${primary ? 'text-white/80' : 'text-neutral-500'}`}
      >
        {label}
      </div>
      <div
        className={`text-[20px] font-bold tabular mt-1 ${primary ? 'text-white' : 'text-neutral-900'}`}
      >
        {value}
      </div>
    </div>
  )
}

function PlatformRow({
  icon,
  brandColor,
  name,
  sub,
  spend,
  leads,
  ctr,
  linkTo,
}: {
  icon: React.ReactNode
  brandColor: string
  name: string
  sub: string
  spend: number
  leads: number
  ctr: number
  linkTo: string
}) {
  return (
    <Link
      to={linkTo}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-neutral-200 hover:border-brand-500 hover:shadow-[var(--shadow-soft)] transition"
    >
      <div
        className="w-8 h-8 rounded-lg grid place-items-center text-white shrink-0"
        style={{ background: brandColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-neutral-900">{name}</div>
        <div className="text-[11px] text-neutral-500 truncate">{sub}</div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-[12px] text-neutral-700 tabular">
        <span>
          <span className="text-neutral-500 mr-1">Invest.</span>
          <b>{formatMetric(spend, 'currency', { compact: spend >= 10000 })}</b>
        </span>
        <span>
          <span className="text-neutral-500 mr-1">Leads</span>
          <b>{leads.toLocaleString('pt-BR')}</b>
        </span>
        <span>
          <span className="text-neutral-500 mr-1">CTR</span>
          <b>{(ctr * 100).toFixed(2)}%</b>
        </span>
      </div>
      <ArrowRight size={14} className="text-neutral-400 shrink-0" />
    </Link>
  )
}
