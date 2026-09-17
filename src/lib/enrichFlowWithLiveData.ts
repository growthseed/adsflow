/**
 * ============================================
 * enrichFlowWithLiveData — Planner + Performance overlay
 * ============================================
 * Augments a ReactFlow graph with real metrics from the
 * performance snapshot of a given client. The matching rule
 * is label/type based and intentionally permissive:
 *
 *   - Nodes whose label contains "meta", "facebook", "instagram"
 *     or whose type is 'funnelSource' with channel='meta' get
 *     the Meta Ads account-level KPIs.
 *   - Nodes mentioning "google" / "search" / "pmax" / "display"
 *     get Google Ads KPIs.
 *   - `landingPage` nodes and `funnelPage` nodes get the blended
 *     impression/click count as a visit proxy.
 *   - `result` nodes get blended conversions.
 *
 * The enriched nodes receive `data.liveMetrics = { ... }` which
 * the node components can render. If the node component doesn't
 * know about liveMetrics, nothing is rendered — backwards safe.
 * ============================================
 */

import type { Node } from '@xyflow/react'
import type { ClientPerformance } from '@/services/adapters/performanceTypes'

export interface LiveMetrics {
  label: string // e.g., "Meta Ads · mar/2026"
  spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
  ctr?: number
  cpc?: number
  cpa?: number
  currency?: string
}

/**
 * Return a new array of nodes with live metrics attached to
 * relevant nodes. Original nodes are not mutated.
 */
export function enrichNodesWithLiveData(
  nodes: Node[],
  performance: ClientPerformance | undefined,
): Node[] {
  if (!performance) return nodes

  const meta = performance.platforms.meta_ads
  const google = performance.platforms.google_ads
  const blended = performance.blended
  const periodLabel = performance.period.label

  return nodes.map((node) => {
    const label = String(node.data?.label || node.data?.text || '').toLowerCase()
    const type = node.type || ''
    const channel = String(node.data?.channel || '').toLowerCase()

    let liveMetrics: LiveMetrics | undefined

    // Meta Ads match
    if (
      meta &&
      (label.includes('meta') ||
        label.includes('facebook') ||
        label.includes('instagram') ||
        channel === 'meta')
    ) {
      liveMetrics = {
        label: `Meta Ads · ${periodLabel}`,
        spend: meta.summary.spend,
        impressions: meta.summary.impressions,
        clicks: meta.summary.clicks,
        conversions: meta.summary.conversions,
        ctr: meta.summary.ctr,
        cpc: meta.summary.cpc,
        cpa: meta.summary.cost_per_conversion,
        currency: meta.currency,
      }
    }
    // Google Ads match
    else if (
      google &&
      (label.includes('google') ||
        label.includes('search') ||
        label.includes('pmax') ||
        label.includes('display') ||
        channel === 'google')
    ) {
      liveMetrics = {
        label: `Google Ads · ${periodLabel}`,
        spend: google.summary.spend,
        impressions: google.summary.impressions,
        clicks: google.summary.clicks,
        conversions: google.summary.conversions,
        ctr: google.summary.ctr,
        cpc: google.summary.cpc,
        cpa: google.summary.cost_per_conversion,
        currency: google.currency,
      }
    }
    // Landing page / funnel page — show total clicks as visits proxy
    else if (type === 'landingPage' || type === 'funnelPage') {
      liveMetrics = {
        label: `Visitas · ${periodLabel}`,
        impressions: blended.total_clicks,
      }
    }
    // Result node — show blended conversions
    else if (type === 'result') {
      liveMetrics = {
        label: `Conversões · ${periodLabel}`,
        conversions: blended.total_conversions,
        spend: blended.total_spend,
        cpa: blended.cost_per_conversion,
        currency: 'BRL',
      }
    }
    // Funnel action (form submit, whatsapp click, purchase) — blended conversions
    else if (type === 'funnelAction') {
      liveMetrics = {
        label: `Eventos · ${periodLabel}`,
        conversions: blended.total_conversions,
      }
    }

    if (!liveMetrics) return node

    return {
      ...node,
      data: {
        ...node.data,
        liveMetrics,
      },
    }
  })
}
