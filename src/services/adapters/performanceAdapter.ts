/**
 * ============================================
 * PERFORMANCE ADAPTER — Google Ads + Meta Ads
 * ============================================
 * Loads the performance snapshot JSON (populated from MCP fetches)
 * and exposes lookup helpers consumed by the UI.
 *
 * Flow:
 *   1. MCP fetch (offline, via Claude script) → JSON snapshot
 *   2. loadPerformanceSnapshot() → AgencySnapshot
 *   3. getClientPerformance(slug) → ClientPerformance
 *
 * When a real-time backend endpoint is added, swap loadSnapshot()
 * for fetchFromAPI() — every downstream component stays identical.
 * ============================================
 */

import type {
  ClientPerformance,
  PerformanceSnapshot,
  Campaign,
  CampaignMetrics,
  AdPlatform,
  CampaignStatus,
} from './performanceTypes'

import snapshotData from '@/data/snapshots/performance-snapshot.json'
import supabase from '@/lib/supabase'

/** Bundled fallback — always available */
export const BUNDLED_PERFORMANCE_SNAPSHOT = snapshotData as unknown as PerformanceSnapshot

/** Session cache */
let livePerformanceSnapshot: PerformanceSnapshot | null = null

// =============================================================
// LOADERS
// =============================================================

export function loadPerformanceSnapshot(): PerformanceSnapshot {
  return livePerformanceSnapshot || BUNDLED_PERFORMANCE_SNAPSHOT
}

/**
 * Async loader — prefers live data from Supabase, falls back to bundled.
 * Written by /api/sync/performance cron.
 */
export async function fetchLatestPerformanceSnapshot(): Promise<PerformanceSnapshot> {
  try {
    const { data, error } = await supabase.rpc('latest_agency_snapshot', {
      snapshot_kind: 'performance',
    })

    if (error) {
      console.warn('[performanceAdapter] Supabase fetch failed, using bundled:', error.message)
      return BUNDLED_PERFORMANCE_SNAPSHOT
    }

    if (!data) return BUNDLED_PERFORMANCE_SNAPSHOT

    const snapshot = data as unknown as PerformanceSnapshot
    livePerformanceSnapshot = snapshot
    return snapshot
  } catch (err) {
    console.warn('[performanceAdapter] Unexpected error, using bundled:', err)
    return BUNDLED_PERFORMANCE_SNAPSHOT
  }
}

export function getClientPerformance(slug: string): ClientPerformance | undefined {
  return loadPerformanceSnapshot().clients[slug]
}

export function getAllClientPerformance(): ClientPerformance[] {
  return Object.values(loadPerformanceSnapshot().clients)
}

/** Same as getClientPerformance but accepts an external snapshot */
export function findPerformanceInSnapshot(
  snapshot: PerformanceSnapshot,
  slug: string,
): ClientPerformance | undefined {
  return snapshot.clients[slug]
}

// =============================================================
// HELPERS — platform normalization
// =============================================================

/** Empty metrics — used when a platform isn't connected yet */
export function zeroMetrics(): CampaignMetrics {
  return {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversions: 0,
    conversion_value: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    cost_per_conversion: 0,
    roas: 0,
  }
}

/** Compute CTR / CPC / CPM safely from raw values */
export function computeRates(
  impressions: number,
  clicks: number,
  spend: number,
  conversions: number,
  conversionValue: number,
): Pick<CampaignMetrics, 'ctr' | 'cpc' | 'cpm' | 'cost_per_conversion' | 'roas'> {
  return {
    ctr: impressions > 0 ? clicks / impressions : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cost_per_conversion: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? conversionValue / spend : 0,
  }
}

// =============================================================
// STATUS NORMALIZATION
// =============================================================

export function normalizeGoogleStatus(raw: string): CampaignStatus {
  const s = raw.toUpperCase()
  if (s === 'ENABLED') return 'enabled'
  if (s === 'PAUSED') return 'paused'
  if (s === 'REMOVED') return 'removed'
  return 'paused'
}

export function normalizeMetaStatus(raw: string | number): CampaignStatus {
  // Meta uses numeric codes: 1=active, 2=disabled, 3=unsettled, 101=deleted
  const code = typeof raw === 'string' ? parseInt(raw, 10) : raw
  if (code === 1) return 'enabled'
  if (code === 101 || code === 3) return 'removed'
  return 'paused'
}

// =============================================================
// NORMALIZE RAW MCP PAYLOADS
// =============================================================

interface RawGoogleCampaign {
  id: string
  name: string
  status: string
  impressions?: number
  clicks?: number
  cost_micros?: number
  conversions?: number
  conversions_value?: number
}

/** Convert a Google Ads MCP row into our Campaign shape */
export function normalizeGoogleCampaign(raw: RawGoogleCampaign): Campaign {
  const spend = (raw.cost_micros || 0) / 1_000_000
  const impressions = Number(raw.impressions || 0)
  const clicks = Number(raw.clicks || 0)
  const conversions = Number(raw.conversions || 0)
  const conversionValue = Number(raw.conversions_value || 0)

  const rates = computeRates(impressions, clicks, spend, conversions, conversionValue)

  return {
    id: raw.id,
    name: raw.name,
    status: normalizeGoogleStatus(raw.status),
    status_raw: raw.status,
    platform: 'google_ads',
    metrics: {
      impressions,
      clicks,
      spend,
      conversions,
      conversion_value: conversionValue,
      ...rates,
    },
  }
}

interface RawMetaCampaign {
  id: string
  name: string
  status?: string | number
  impressions?: number | string
  clicks?: number | string
  spend?: number | string
  actions?: Array<{ action_type: string; value: string }>
}

export function normalizeMetaCampaign(raw: RawMetaCampaign): Campaign {
  const impressions = Number(raw.impressions || 0)
  const clicks = Number(raw.clicks || 0)
  const spend = Number(raw.spend || 0)

  // Meta counts conversions via actions[] — filter purchase/lead types
  const conversions = (raw.actions || [])
    .filter((a) =>
      ['purchase', 'lead', 'complete_registration', 'onsite_conversion.lead_grouped'].includes(
        a.action_type,
      ),
    )
    .reduce((sum, a) => sum + Number(a.value || 0), 0)

  const rates = computeRates(impressions, clicks, spend, conversions, 0)

  return {
    id: raw.id,
    name: raw.name,
    status: normalizeMetaStatus(raw.status || 0),
    status_raw: String(raw.status || ''),
    platform: 'meta_ads',
    metrics: {
      impressions,
      clicks,
      spend,
      conversions,
      conversion_value: 0,
      ...rates,
    },
  }
}

// =============================================================
// QUERY HELPERS
// =============================================================

/** Get the most spending campaigns across platforms for a client */
export function getTopCampaigns(
  performance: ClientPerformance,
  limit = 10,
): Campaign[] {
  const all: Campaign[] = []
  if (performance.platforms.meta_ads) {
    all.push(...performance.platforms.meta_ads.campaigns)
  }
  if (performance.platforms.google_ads) {
    all.push(...performance.platforms.google_ads.campaigns)
  }
  return all
    .filter((c) => c.status === 'enabled' || c.metrics.spend > 0)
    .sort((a, b) => b.metrics.spend - a.metrics.spend)
    .slice(0, limit)
}

/** Get daily series, optionally filtered to a single platform */
export function getDailySeries(
  performance: ClientPerformance,
  platform?: AdPlatform,
) {
  if (platform === 'meta_ads') return performance.platforms.meta_ads?.daily || []
  if (platform === 'google_ads') return performance.platforms.google_ads?.daily || []

  // Blended: merge by date, sum metrics
  const metaDaily = performance.platforms.meta_ads?.daily || []
  const gadsDaily = performance.platforms.google_ads?.daily || []

  const byDate = new Map<string, { date: string; impressions: number; clicks: number; spend: number; conversions: number }>()

  for (const d of [...metaDaily, ...gadsDaily]) {
    const existing = byDate.get(d.date) || {
      date: d.date,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    }
    existing.impressions += d.impressions
    existing.clicks += d.clicks
    existing.spend += d.spend
    existing.conversions += d.conversions
    byDate.set(d.date, existing)
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/** Which platforms are connected for this client */
export function getConnectedPlatforms(performance: ClientPerformance): AdPlatform[] {
  const platforms: AdPlatform[] = []
  if (performance.platforms.meta_ads?.connected) platforms.push('meta_ads')
  if (performance.platforms.google_ads?.connected) platforms.push('google_ads')
  return platforms
}
