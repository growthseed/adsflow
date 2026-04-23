#!/usr/bin/env node
/**
 * Rebuilda performance-snapshot.json blended a partir do meta-ads-snapshot.json.
 * Google Ads será adicionado em próximo sync (GAQL por cliente).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const META = resolve(ROOT, 'src/data/snapshots/meta-ads-snapshot.json')
const PERF = resolve(ROOT, 'src/data/snapshots/performance-snapshot.json')

const meta = JSON.parse(readFileSync(META, 'utf-8'))
const perf = {
  captured_at: meta.captured_at,
  period: meta.period,
  clients: {},
}

for (const [slug, m] of Object.entries(meta.clients)) {
  const leadish = m.summary.messaging_conversations ?? m.summary.link_clicks ?? 0
  perf.clients[slug] = {
    client_slug: slug,
    client_name: m.client_name,
    period: meta.period,
    platforms: {
      meta_ads: {
        platform: 'meta_ads',
        account_id: m.account_id,
        account_name: m.account_name,
        currency: m.currency,
        timezone: m.timezone,
        connected: true,
        last_synced_at: m.last_synced_at,
        summary: {
          impressions: m.summary.impressions,
          clicks: m.summary.clicks,
          spend: m.summary.spend,
          conversions: leadish,
          conversion_value: 0,
          ctr: m.summary.ctr / 100, // 0-1 scale conforme performanceTypes.ts
          cpc: m.summary.cpc,
          cpm: m.summary.cpm,
          cost_per_conversion: leadish > 0 ? m.summary.spend / leadish : 0,
          roas: 0,
          reach: m.summary.reach,
          frequency: m.summary.frequency,
          active_campaigns: m.summary.active_campaigns,
          total_campaigns: m.summary.active_campaigns,
        },
        campaigns: [],
        daily: [],
      },
    },
    blended: {
      total_spend: m.summary.spend,
      total_impressions: m.summary.impressions,
      total_clicks: m.summary.clicks,
      total_conversions: leadish,
      total_reach: m.summary.reach,
      avg_ctr: m.summary.ctr / 100,
      avg_cpc: m.summary.cpc,
      avg_cpm: m.summary.cpm,
      cost_per_conversion: leadish > 0 ? m.summary.spend / leadish : 0,
      roas: 0,
    },
    last_synced_at: m.last_synced_at,
  }
}

writeFileSync(PERF, JSON.stringify(perf, null, 2), 'utf-8')
console.log(`✓ performance-snapshot.json gerado com ${Object.keys(perf.clients).length} clientes (blended)`)
