import { useMemo } from 'react'

import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import {
  getClientPerformance,
  loadPerformanceSnapshot,
} from '@/services/adapters/performanceAdapter'

export interface ComparadorRow {
  slug: string
  name: string
  shortName: string
  /** Todas as métricas podem ser null — UI renderiza "—" conforme handoff V2 */
  spend: number | null
  leads: number | null
  cpl: number | null
  roas: number | null
  /** 7d sparkline de spend — opcional */
  trend: number[] | null
  /** Saúde 0-100 derivada de urgência + overdue + ROAS + CPL delta */
  health: number
  /** Pill de saúde */
  healthTone: 'success' | 'warning' | 'error'
  /** Flag "novo" quando cliente tem < 30d */
  isNew: boolean
  urgency: number
  overdue: number
}

export interface ComparadorAggregate {
  totalSpend: number
  totalLeads: number
  avgCpl: number | null
  avgRoas: number | null
  spendDelta: number | null
  leadsDelta: number | null
  cplDelta: number | null
  roasDelta: number | null
  clientCount: number
  lastSyncLabel: string
}

export interface ComparadorInsight {
  tone: 'error' | 'success' | 'brand'
  badge: string
  title: string
  body: string
  ctaLabel?: string
  ctaTo?: string
}

export interface ComparadorData {
  rows: ComparadorRow[]
  aggregate: ComparadorAggregate
  insights: ComparadorInsight[]
}

function computeHealth(row: {
  overdue: number
  urgency: number
  roas: number | null
  cpl: number | null
}): { score: number; tone: 'success' | 'warning' | 'error' } {
  let score = 100
  score -= Math.min(30, row.overdue * 10)
  score -= Math.min(20, row.urgency * 3)
  if (row.roas != null && row.roas < 2) score -= 20
  if (row.roas != null && row.roas >= 3) score += 5
  score = Math.max(0, Math.min(100, score))
  const tone: 'success' | 'warning' | 'error' =
    score >= 75 ? 'success' : score >= 55 ? 'warning' : 'error'
  return { score, tone }
}

function relativeTimeBR(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diffMin < 60) return `há ${diffMin}min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `há ${diffD}d`
}

/**
 * Compõe dados do Comparador a partir dos dois snapshots disponíveis:
 * ClickUp (urgência, overdue, saúde operacional) + Performance (spend,
 * leads, CPL, ROAS). Se um cliente não tem entry em Performance, todas
 * as métricas de mídia retornam null — a UI mostra "—".
 */
export function useComparadorData(): ComparadorData {
  const agencySnapshot = loadSnapshot()
  const perfSnapshot = loadPerformanceSnapshot()

  return useMemo(() => {
    const rows: ComparadorRow[] = agencySnapshot.clients.map((c) => {
      const perf = getClientPerformance(c.slug)
      const spend = perf?.blended.total_spend ?? null
      const leads = perf?.blended.total_conversions ?? null
      const cpl = perf?.blended.cost_per_conversion ?? null
      const roas = perf?.blended.roas ?? null

      const { score, tone } = computeHealth({
        overdue: c.stats.overdue,
        urgency: c.stats.urgent,
        roas,
        cpl,
      })

      return {
        slug: c.slug,
        name: c.name,
        shortName: c.short_name,
        spend,
        leads,
        cpl,
        roas,
        trend: null,
        health: score,
        healthTone: tone,
        isNew: false,
        urgency: c.stats.urgent,
        overdue: c.stats.overdue,
      }
    })

    const withSpend = rows.filter((r) => r.spend != null)
    const totalSpend = withSpend.reduce((a, r) => a + (r.spend ?? 0), 0)
    const totalLeads = rows.reduce((a, r) => a + (r.leads ?? 0), 0)
    const avgCpl =
      totalLeads > 0 && totalSpend > 0 ? totalSpend / totalLeads : null
    const roasRows = rows.filter((r) => r.roas != null) as Array<ComparadorRow & { roas: number }>
    const avgRoas =
      roasRows.length > 0
        ? roasRows.reduce((a, r) => a + r.roas, 0) / roasRows.length
        : null

    const aggregate: ComparadorAggregate = {
      totalSpend,
      totalLeads,
      avgCpl,
      avgRoas,
      spendDelta: null,
      leadsDelta: null,
      cplDelta: null,
      roasDelta: null,
      clientCount: rows.length,
      lastSyncLabel: relativeTimeBR(perfSnapshot.captured_at || agencySnapshot.captured_at),
    }

    /* ─────────── Insights derivados ─────────── */
    const insights: ComparadorInsight[] = []

    const atRisk = rows.filter((r) => r.healthTone === 'error')
    if (atRisk.length > 0) {
      insights.push({
        tone: 'error',
        badge: `${atRisk.length} ${atRisk.length === 1 ? 'cliente' : 'clientes'} em risco`,
        title: 'Atenção necessária',
        body: atRisk
          .slice(0, 2)
          .map((r) => `${r.name} — saúde ${r.health}`)
          .join(' · '),
        ctaLabel: 'Criar plano de ação',
        ctaTo: '/alerts',
      })
    }

    const top = [...rows].sort((a, b) => b.health - a.health)[0]
    if (top && top.healthTone === 'success') {
      const bodyParts: string[] = []
      if (top.roas != null) bodyParts.push(`ROAS ${top.roas.toFixed(1)}×`)
      if (top.leads != null) bodyParts.push(`${top.leads.toLocaleString('pt-BR')} leads`)
      insights.push({
        tone: 'success',
        badge: 'Top performance',
        title: `${top.name} · saúde ${top.health}`,
        body:
          bodyParts.length > 0
            ? bodyParts.join(' · ')
            : `Maior saúde da carteira neste período.`,
        ctaLabel: 'Ver playbook',
        ctaTo: `/c/${top.slug}/overview`,
      })
    }

    insights.push({
      tone: 'brand',
      badge: 'Insight da IA',
      title: 'Sugestões de otimização',
      body:
        'Quando os tokens de provedor estiverem configurados, a IA analisa a carteira e sugere rebalanceamentos de budget.',
      ctaLabel: 'Configurar',
      ctaTo: '/ai',
    })

    return { rows, aggregate, insights }
  }, [agencySnapshot, perfSnapshot])
}
