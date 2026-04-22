import { BarChart3 } from 'lucide-react'

import { Card, CardBody, CardHead, Delta, ProgressBar } from '@/components/primitives'

export interface SovCompetitor {
  id: string
  name: string
  share: number // 0-100
  isYou?: boolean
}

interface Props {
  yourShare: number | null
  ranking: { position: number; total: number } | null
  deltaPts: number | null
  category?: string
  competitors: SovCompetitor[]
  className?: string
}

/**
 * Micro-card "Share of voice" — sua % + barra por concorrente.
 * Fonte: integrações externas (ex: Semrush, SimilarWeb). Sem elas,
 * show empty state com CTA de conectar.
 */
export function ShareOfVoiceCard({
  yourShare,
  ranking,
  deltaPts,
  category,
  competitors,
  className = '',
}: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <BarChart3 size={16} className="text-neutral-600" /> Share of voice
          </span>
        }
        subtitle={category ? `vs concorrência · categoria ${category}` : 'vs concorrência'}
      />
      <CardBody>
        {yourShare == null ? (
          <div className="text-center py-6">
            <p className="text-xs text-neutral-500 mb-2">
              Conecte uma fonte de inteligência de mercado para ver share of voice.
            </p>
            <button className="text-xs font-semibold text-brand-700 hover:text-brand-900">
              Configurar integração →
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[36px] font-bold text-brand-600 tabular tracking-[-0.02em] leading-none">
                {yourShare}%
              </div>
              <div>
                {ranking && (
                  <div className="text-xs text-neutral-600">
                    <b>{toOrdinal(ranking.position)} colocado</b> · {ranking.total} concorrentes
                  </div>
                )}
                {deltaPts != null && (
                  <div className="mt-0.5">
                    <Delta value={deltaPts} suffix="pts" />
                    <span className="ml-1 text-[11px] text-neutral-500">· 30d</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {competitors.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className={c.isYou ? 'font-semibold text-brand-700' : 'text-neutral-600'}>
                      {c.name}
                    </span>
                    <span
                      className={`tabular ${c.isYou ? 'font-semibold text-brand-700' : 'text-neutral-700'}`}
                    >
                      {c.share}%
                    </span>
                  </div>
                  <ProgressBar
                    value={c.share}
                    tone={c.isYou ? 'brand' : 'info'}
                    className={c.isYou ? '' : 'opacity-60'}
                    ariaLabel={`${c.name} ${c.share}%`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

function toOrdinal(n: number): string {
  return `${n}º`
}
