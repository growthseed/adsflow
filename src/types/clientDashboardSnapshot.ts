/**
 * ============================================
 * CLIENT DASHBOARD SNAPSHOT — consumed by WidgetRenderer
 * ============================================
 * This is the shape the WidgetRenderer reads from. Each client has
 * one of these generated nightly (or manually pushed via MCP) and
 * stored either in Supabase `agency_snapshots` or as a bundled JSON
 * fallback under src/data/snapshots/clients/{slug}.json.
 *
 * The template declares `dataPath` strings that resolve against
 * this shape (e.g. 'timeseries.daily' → snapshot.timeseries.daily).
 *
 * NOTHING in this file is tied to a specific nicho — it's a
 * superset of what any template might need. Missing fields are
 * handled as empty states in the widgets.
 * ============================================
 */

import type { ProjectScopeId } from '@/types/metrics'

export interface SnapshotKPI {
  key: string
  label: string
  value: number
  previous_value?: number
  delta_percent?: number
  unit: 'currency' | 'number' | 'percent' | 'ratio'
  currency?: string
  trend?: 'up' | 'down' | 'flat'
  /** Higher means goal achieved. Some KPIs (CPL, CAC) are reversed. */
  goal?: number
  improvement_direction?: 'higher_better' | 'lower_better'
  sparkline?: number[]
  description?: string
  source?: string
}

export interface ClientDashboardSnapshot {
  /** Client slug (matches clients.slug) */
  slug: string
  /** Client display name */
  name: string
  /** The nicho — determines which template to load */
  scope: ProjectScopeId
  /** Period the data covers */
  period: {
    from: string
    to: string
    label: string
    days: number
  }
  /** Last time the data was refreshed */
  last_synced_at: string

  /** KPIs keyed by snapshot key (matches template.kpi_strip.kpiKeys) */
  kpis: Record<string, SnapshotKPI>

  /** Time series for line/area charts */
  timeseries: {
    daily: Array<Record<string, number | string>>
    monthly?: Array<Record<string, number | string>>
  }

  /** Channel distribution (for donut chart) */
  channels: Array<{ label: string; value: number; color: string }>

  /** Blended metrics across all channels */
  blended: {
    spend: number
    spend_formatted?: string
    revenue?: number
    revenue_formatted?: string
    conversions: number
    roas?: number
  }

  /** Funnel stages (leads_b2b, sales_inside) */
  funnel?: {
    stages: Array<{ label: string; value: number; color?: string }>
  }

  /** Top campaigns for the table widget */
  campaigns?: {
    top: Array<{
      name: string
      channel: string
      spend: number
      impressions: number
      clicks: number
      leads?: number
      cpl?: number
      revenue?: number
      roas?: number
    }>
  }

  /** E-commerce products */
  products?: {
    top: Array<{
      name: string
      revenue: number
      quantity: number
      aov: number
    }>
  }

  /** GMB data for pdv_local */
  gmb?: {
    actions: Array<{ action: string; count: number }>
    avg_rating: number
    avg_rating_formatted: string
    rating_distribution: Array<{ label: string; value: number; color: string }>
    latest_reviews: Array<{
      author: string
      rating: number
      date: string
      comment: string
    }>
  }

  /** Sales team performance for sales_inside */
  sellers?: Array<{
    name: string
    won: number
    open: number
    lost: number
  }>

  /** Loss reasons for sales_inside */
  loss_reasons?: Array<{ reason: string; count: number }>
}
