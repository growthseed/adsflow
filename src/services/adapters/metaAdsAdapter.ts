/**
 * Meta Ads adapter — lê snapshot JSON puxado via MCP.
 *
 * Fonte: src/data/snapshots/meta-ads-snapshot.json
 * Atualização: hoje é manual (puxar via MCP meta-ads + regravar JSON).
 * Próximo passo: /api/sync/meta-ads.ts com Vercel Cron.
 */

import snapshot from '@/data/snapshots/meta-ads-snapshot.json'

export interface MetaCampaign {
  id: string
  name: string
  short_name: string
  objective: string
  status: 'Ativa' | 'Pausada' | string
  daily_budget: number
  metrics: {
    spend: number
    impressions: number
    clicks: number
    reach: number
    ctr: number
    cpc: number
    cpm: number
    conversions?: number
    cost_per_conversion?: number
    video_views?: number
    link_clicks?: number
  }
}

export interface MetaPlacement {
  name: string
  spend: number
  impressions: number
  pct_spend: number
}

export interface MetaCreative {
  id: string
  ad_name: string
  format: string
  campaign: string
  creative_id: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions?: number
  cost_per_conversion?: number
  video_views?: number
  thumb_gradient: string
}

export interface MetaAdsClientSnapshot {
  client_slug: string
  client_name: string
  account_id: string
  account_name: string
  currency: string
  timezone: string
  connected: boolean
  last_synced_at: string
  summary: {
    spend: number
    impressions: number
    clicks: number
    reach: number
    frequency: number
    ctr: number
    cpc: number
    cpm: number
    messaging_conversations?: number
    video_views?: number
    link_clicks?: number
    active_campaigns: number
  }
  campaigns: MetaCampaign[]
  placements: MetaPlacement[]
  creatives: MetaCreative[]
}

interface MetaAdsSnapshot {
  captured_at: string
  period: { from: string; to: string; label: string }
  source: string
  clients: Record<string, MetaAdsClientSnapshot>
}

const typed = snapshot as unknown as MetaAdsSnapshot

export function getMetaAdsSnapshot(clientSlug: string): MetaAdsClientSnapshot | null {
  return typed.clients[clientSlug] ?? null
}

export function getMetaAdsPeriod() {
  return typed.period
}

export function getMetaAdsLastSynced(clientSlug: string): string | null {
  return getMetaAdsSnapshot(clientSlug)?.last_synced_at ?? null
}

export function hasMetaAdsData(clientSlug: string): boolean {
  return Boolean(typed.clients[clientSlug])
}
