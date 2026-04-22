import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Funnel, Loader2, Workflow } from 'lucide-react'

import { Card, CardBody, CardHead, ProgressBar } from '@/components/primitives'
import { supabase } from '@/lib/supabase'

interface Props {
  clientSlug: string
}

type StageKind = 'top' | 'mql' | 'sql' | 'won' | 'lost' | 'other'

interface FunnelResponse {
  pipelineName: string
  totalLeads: number
  mqlCount: number
  sqlCount: number
  wonCount: number
  conversionRatePct: number | null
  avgDaysToWin: number | null
  stages: Array<{ id: number; name: string; color?: string; kind: StageKind; count: number }>
  syncedAt: string
  note?: string
}

const kindLabel: Record<StageKind, string> = {
  top:   'Topo',
  mql:   'MQL',
  sql:   'SQL',
  won:   'Ganho',
  lost:  'Perdido',
  other: 'Outro',
}

const kindClass: Record<StageKind, string> = {
  top:   'bg-info-100 text-info-700',
  mql:   'bg-brand-100 text-brand-700',
  sql:   'bg-warning-100 text-warning-700',
  won:   'bg-success-100 text-success-700',
  lost:  'bg-error-100 text-error-700',
  other: 'bg-neutral-100 text-neutral-700',
}

/**
 * Card "CRM Kommo" — pipeline + MQL/SQL + conversão (últimos 30d).
 * Chama /api/kommo/funnel que valida auth + integração. Enquanto
 * integração não configurada, mostra empty state com CTA.
 */
export function KommoCrmCard({ clientSlug }: Props) {
  const [data, setData] = useState<FunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setNote(null)
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        if (!token) {
          setNote('Sessão expirada.')
          return
        }
        const resp = await fetch(`/api/kommo/funnel?client_slug=${encodeURIComponent(clientSlug)}`, {
          headers: { authorization: `Bearer ${token}` },
        })
        if (resp.status === 501) {
          const j = (await resp.json()) as { note?: string }
          if (!cancelled) setNote(j.note ?? 'Integração Kommo não configurada.')
          return
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const body = (await resp.json()) as FunnelResponse
        if (!cancelled) setData(body)
      } catch (e) {
        if (!cancelled) setNote(e instanceof Error ? e.message : 'Erro ao carregar funil')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientSlug])

  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 size={14} className="animate-spin" /> Carregando funil Kommo…
      </Card>
    )
  }

  if (note || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
            <Workflow size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-neutral-900">CRM Kommo — não conectado</div>
            <p className="text-xs text-neutral-500 mt-1">
              {note ??
                'Conecte o Kommo para ver o funil do cliente com MQL/SQL, conversão e tempo médio até venda.'}
            </p>
            <Link
              to="/integrations"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              Conectar Kommo <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  const maxCount = Math.max(...data.stages.map((s) => s.count), 1)
  const mqlRate = data.totalLeads > 0 ? (data.mqlCount / data.totalLeads) * 100 : 0
  const sqlRate = data.totalLeads > 0 ? (data.sqlCount / data.totalLeads) * 100 : 0

  return (
    <Card>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Funnel size={16} className="text-brand-600" />
            CRM · {data.pipelineName}
          </span>
        }
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} /> sincronizado {relativeTimeBR(data.syncedAt)} · últimos 30 dias
          </span>
        }
        actions={
          <Link
            to={`/c/${clientSlug}/crm/funil`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
          >
            Funil completo <ArrowRight size={12} />
          </Link>
        }
      />
      <CardBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricBlock label="Leads" value={data.totalLeads.toLocaleString('pt-BR')} sub="recebidos · 30d" />
          <MetricBlock
            label="MQL"
            value={data.mqlCount.toLocaleString('pt-BR')}
            sub={`${mqlRate.toFixed(0)}% dos leads`}
            tone="brand"
          />
          <MetricBlock
            label="SQL"
            value={data.sqlCount.toLocaleString('pt-BR')}
            sub={`${sqlRate.toFixed(0)}% dos leads`}
            tone="warning"
          />
          <MetricBlock
            label="Fechados (ganho)"
            value={data.wonCount.toLocaleString('pt-BR')}
            sub={
              data.conversionRatePct != null
                ? `${data.conversionRatePct.toFixed(1)}% conversão`
                : '—'
            }
            tone="success"
          />
        </div>

        {/* Mini funil por stage */}
        <div className="space-y-1.5">
          {data.stages.map((s) => (
            <div key={s.id} className="flex items-center gap-3 text-[12px]">
              <div className="w-28 shrink-0 flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kindClass[s.kind]}`}
                >
                  {kindLabel[s.kind]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5">
                  <span className="text-neutral-700 truncate">{s.name}</span>
                  <span className="tabular text-neutral-900 font-semibold">
                    {s.count.toLocaleString('pt-BR')}
                  </span>
                </div>
                <ProgressBar
                  value={(s.count / maxCount) * 100}
                  tone={
                    s.kind === 'won'
                      ? 'success'
                      : s.kind === 'sql'
                      ? 'warning'
                      : s.kind === 'lost'
                      ? 'error'
                      : 'brand'
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {data.avgDaysToWin != null && (
          <div className="mt-4 text-[11px] text-neutral-500 text-center">
            Tempo médio até fechamento: <b className="text-neutral-900 tabular">{data.avgDaysToWin.toFixed(1)} dias</b>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function MetricBlock({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'neutral' | 'brand' | 'warning' | 'success'
}) {
  const colorClass = {
    neutral: 'text-neutral-900',
    brand: 'text-brand-700',
    warning: 'text-warning-700',
    success: 'text-success-700',
  }[tone]
  return (
    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className={`text-[22px] font-bold tabular mt-0.5 ${colorClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function relativeTimeBR(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin}min`
  const h = Math.round(diffMin / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.round(h / 24)}d`
}
