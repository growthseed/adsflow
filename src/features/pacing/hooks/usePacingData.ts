import { useMemo } from 'react'

import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import { loadPerformanceSnapshot } from '@/services/adapters/performanceAdapter'

export type PacingStatus = 'on_pace' | 'behind' | 'ahead' | 'will_overspend'

export interface PacingRow {
  clientSlug: string
  clientName: string
  budget: number | null
  spend: number | null
  spendPct: number | null
  idealPct: number
  deviationPct: number | null // negativo = atrasado, positivo = adiantado
  projectedSpend: number | null
  status: PacingStatus
  platformsLabel: string
  campaignCount: number
}

export interface PacingAggregate {
  totalBudget: number
  totalSpend: number
  totalProjected: number
  offPaceCount: number
  aheadCount: number
  behindCount: number
  onPaceCount: number
  monthDayNum: number
  monthDaysTotal: number
}

export interface PacingData {
  rows: PacingRow[]
  aggregate: PacingAggregate
  dailySeries: { day: number; spend: number; ideal: number }[]
}

function statusFrom(dev: number | null, hasBudget: boolean): PacingStatus {
  if (!hasBudget || dev == null) return 'on_pace'
  if (dev > 15) return 'will_overspend'
  if (dev > 5) return 'ahead'
  if (dev < -10) return 'behind'
  return 'on_pace'
}

/**
 * Deriva pacing por cliente e agregado da carteira a partir do
 * performance snapshot. Quando a tabela client_budgets ainda não
 * está populada, calcula com base no spend * 1.1 como teto implícito
 * (placeholder até o gestor configurar).
 */
export function usePacingData(): PacingData {
  const agency = loadSnapshot()
  const perf = loadPerformanceSnapshot()

  return useMemo(() => {
    const now = new Date()
    const monthDaysTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthDayNum = now.getDate()
    const idealPct = Math.round((monthDayNum / monthDaysTotal) * 100)

    const rows: PacingRow[] = agency.clients.map((c) => {
      const p = perf.clients?.[c.slug]
      const spend = p?.blended.total_spend ?? null
      // Budget implícito ainda não plugado — marca como null
      const budget: number | null = null
      const spendPct = budget && budget > 0 && spend != null ? (spend / budget) * 100 : null
      const dev = spendPct != null ? spendPct - idealPct : null
      const projectedSpend =
        spend != null && monthDayNum > 0 ? (spend / monthDayNum) * monthDaysTotal : null

      const platforms: string[] = []
      if (p?.platforms.meta_ads) platforms.push('Meta')
      if (p?.platforms.google_ads) platforms.push('Google')
      const campaignCount =
        (p?.platforms.meta_ads?.summary.active_campaigns ?? 0) +
        (p?.platforms.google_ads?.summary.active_campaigns ?? 0)

      return {
        clientSlug: c.slug,
        clientName: c.name,
        budget,
        spend,
        spendPct,
        idealPct,
        deviationPct: dev,
        projectedSpend,
        status: statusFrom(dev, budget != null),
        platformsLabel: platforms.length > 0 ? platforms.join(' + ') : 'Sem integração',
        campaignCount,
      }
    })

    const totalBudget = rows.reduce((a, r) => a + (r.budget ?? 0), 0)
    const totalSpend = rows.reduce((a, r) => a + (r.spend ?? 0), 0)
    const totalProjected = rows.reduce((a, r) => a + (r.projectedSpend ?? 0), 0)

    const offPaceCount = rows.filter((r) => r.status !== 'on_pace').length
    const aheadCount = rows.filter((r) => r.status === 'ahead' || r.status === 'will_overspend')
      .length
    const behindCount = rows.filter((r) => r.status === 'behind').length
    const onPaceCount = rows.filter((r) => r.status === 'on_pace').length

    /* ─────────── série diária derivada quando disponível ─────────── */
    const dailySeries: { day: number; spend: number; ideal: number }[] = []
    for (let d = 1; d <= monthDaysTotal; d++) {
      dailySeries.push({
        day: d,
        spend: 0,
        ideal: (d / monthDaysTotal) * totalBudget,
      })
    }
    Object.values(perf.clients || {}).forEach((cp) => {
      const meta = cp.platforms.meta_ads?.daily ?? []
      const google = cp.platforms.google_ads?.daily ?? []
      ;[...meta, ...google].forEach((dm) => {
        const d = new Date(dm.date).getDate()
        const entry = dailySeries.find((x) => x.day === d)
        if (entry) entry.spend += dm.spend ?? 0
      })
    })
    // acumulado
    let acc = 0
    for (const p of dailySeries) {
      acc += p.spend
      p.spend = acc
    }

    return {
      rows,
      aggregate: {
        totalBudget,
        totalSpend,
        totalProjected,
        offPaceCount,
        aheadCount,
        behindCount,
        onPaceCount,
        monthDayNum,
        monthDaysTotal,
      },
      dailySeries,
    }
  }, [agency, perf])
}
