/**
 * ============================================
 * Performance Fetcher — Meta Ads + Google Ads REST
 * ============================================
 * Server-side fetch from both ad platforms, normalized
 * into the same shape as `performance-snapshot.json`.
 * ============================================
 */

import { ENV, AGENCY_CLIENTS } from './config.js'

// =============================================================
// Types — matching /src/services/adapters/performanceTypes.ts
// =============================================================

interface CampaignMetrics {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  conversion_value: number
  ctr: number
  cpc: number
  cpm: number
  cost_per_conversion: number
  roas: number
}

interface Campaign {
  id: string
  name: string
  status: 'enabled' | 'paused' | 'removed' | 'learning' | 'limited'
  status_raw: string
  platform: 'meta_ads' | 'google_ads'
  campaign_type?: string
  metrics: CampaignMetrics
}

interface PlatformAccount {
  platform: 'meta_ads' | 'google_ads'
  account_id: string
  account_name: string
  currency: string
  timezone?: string
  connected: boolean
  last_synced_at: string
  summary: CampaignMetrics & {
    reach?: number
    frequency?: number
    active_campaigns: number
    total_campaigns: number
  }
  campaigns: Campaign[]
  daily: Array<{
    date: string
    impressions: number
    clicks: number
    spend: number
    conversions: number
    reach?: number
    ctr: number
    cpc: number
    cpm: number
  }>
}

interface ClientPerformance {
  client_slug: string
  client_name: string
  period: { from: string; to: string; label: string }
  platforms: { meta_ads?: PlatformAccount; google_ads?: PlatformAccount }
  blended: {
    total_spend: number
    total_impressions: number
    total_clicks: number
    total_conversions: number
    total_reach: number
    avg_ctr: number
    avg_cpc: number
    avg_cpm: number
    cost_per_conversion: number
    roas: number
  }
  last_synced_at: string
}

export interface PerformanceSnapshotResult {
  captured_at: string
  period: { from: string; to: string; label: string }
  clients: Record<string, ClientPerformance>
}

// =============================================================
// HELPERS
// =============================================================

function computeRates(
  imp: number,
  clicks: number,
  spend: number,
  conv: number,
  convValue: number,
): Pick<CampaignMetrics, 'ctr' | 'cpc' | 'cpm' | 'cost_per_conversion' | 'roas'> {
  return {
    ctr: imp > 0 ? clicks / imp : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: imp > 0 ? (spend / imp) * 1000 : 0,
    cost_per_conversion: conv > 0 ? spend / conv : 0,
    roas: spend > 0 ? convValue / spend : 0,
  }
}

function zeroSummary(): PlatformAccount['summary'] {
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
    active_campaigns: 0,
    total_campaigns: 0,
  }
}

function getLastMonthRange(): { from: string; to: string; label: string } {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 86_400_000)
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const label = lastMonthStart.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return { from: fmt(lastMonthStart), to: fmt(lastMonthEnd), label }
}

// =============================================================
// META ADS FETCHER
// =============================================================

interface MetaCampaignRow {
  campaign_id: string
  campaign_name: string
  status?: string
  objective?: string
  impressions?: string
  clicks?: string
  spend?: string
  reach?: string
  frequency?: string
  ctr?: string
  cpc?: string
  cpm?: string
  actions?: Array<{ action_type: string; value: string }>
}

async function fetchMetaAccount(
  accountId: string,
  from: string,
  to: string,
): Promise<PlatformAccount | null> {
  if (!ENV.META_ACCESS_TOKEN) return null

  const base = `https://graph.facebook.com/${ENV.META_API_VERSION}`
  const fields = [
    'campaign_id',
    'campaign_name',
    'objective',
    'impressions',
    'clicks',
    'spend',
    'reach',
    'frequency',
    'ctr',
    'cpc',
    'cpm',
    'actions',
  ].join(',')

  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }))
  const url = `${base}/${accountId}/insights?level=campaign&fields=${fields}&time_range=${timeRange}&limit=100&access_token=${ENV.META_ACCESS_TOKEN}`

  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown')
    throw new Error(`Meta ${accountId} insights failed (${response.status}): ${text.slice(0, 200)}`)
  }

  const data = (await response.json()) as { data: MetaCampaignRow[] }
  const rows = data.data || []

  // Meta action types that count as conversions in marketing dashboards.
  // Includes: form leads, purchases, registrations, Facebook Pixel lead events,
  // standard conversions, CAPI custom conversions, and WhatsApp click-to-chat.
  const CONVERSION_ACTION_TYPES = new Set([
    'lead',
    'purchase',
    'complete_registration',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
    'offsite_conversion.fb_pixel_purchase',
    'offsite_conversion.fb_pixel_complete_registration',
    'offsite_conversion.fb_pixel_custom',
    'onsite_conversion.messaging_conversation_started_7d',
    'onsite_conversion.messaging_first_reply',
    'link_click', // fallback for awareness campaigns — counted at account level
  ])

  // Aggregate into campaigns
  const campaigns: Campaign[] = rows.map((r) => {
    const impressions = Number(r.impressions || 0)
    const clicks = Number(r.clicks || 0)
    const spend = Number(r.spend || 0)

    // Count conversions but exclude link_click when other conversions exist
    // (link_click is a fallback so we don't show "0 conversions" on awareness)
    const actions = r.actions || []
    const hasRealConversions = actions.some(
      (a) => CONVERSION_ACTION_TYPES.has(a.action_type) && a.action_type !== 'link_click',
    )
    const conversions = actions
      .filter((a) => {
        if (!CONVERSION_ACTION_TYPES.has(a.action_type)) return false
        if (a.action_type === 'link_click' && hasRealConversions) return false
        return true
      })
      .reduce((sum, a) => sum + Number(a.value || 0), 0)

    return {
      id: r.campaign_id,
      name: r.campaign_name,
      status: 'enabled',
      status_raw: r.status || 'ACTIVE',
      platform: 'meta_ads',
      campaign_type: r.objective,
      metrics: {
        impressions,
        clicks,
        spend,
        conversions,
        conversion_value: 0,
        ...computeRates(impressions, clicks, spend, conversions, 0),
      },
    }
  })

  // Account-level summary
  const totalImpressions = campaigns.reduce((s, c) => s + c.metrics.impressions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0)
  const totalSpend = campaigns.reduce((s, c) => s + c.metrics.spend, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0)
  const totalReach = rows.reduce((s, r) => s + Number(r.reach || 0), 0)

  return {
    platform: 'meta_ads',
    account_id: accountId,
    account_name: accountId,
    currency: 'BRL',
    connected: true,
    last_synced_at: new Date().toISOString(),
    summary: {
      impressions: totalImpressions,
      clicks: totalClicks,
      spend: totalSpend,
      conversions: totalConversions,
      conversion_value: 0,
      ...computeRates(totalImpressions, totalClicks, totalSpend, totalConversions, 0),
      reach: totalReach,
      frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      active_campaigns: campaigns.length,
      total_campaigns: campaigns.length,
    },
    campaigns,
    daily: [],
  }
}

// =============================================================
// GOOGLE ADS FETCHER
// =============================================================

/** Refresh Google Ads OAuth access token using stored refresh token */
async function getGoogleAccessToken(): Promise<string> {
  if (
    !ENV.GOOGLE_ADS_SYNC_CLIENT_ID ||
    !ENV.GOOGLE_ADS_SYNC_CLIENT_SECRET ||
    !ENV.GOOGLE_ADS_SYNC_REFRESH_TOKEN
  ) {
    throw new Error('GOOGLE_ADS_SYNC_* env vars not set')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ENV.GOOGLE_ADS_SYNC_CLIENT_ID,
      client_secret: ENV.GOOGLE_ADS_SYNC_CLIENT_SECRET,
      refresh_token: ENV.GOOGLE_ADS_SYNC_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown')
    throw new Error(`Google OAuth refresh failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

async function fetchGoogleAdsAccount(
  customerId: string,
  accessToken: string,
  from: string,
  to: string,
): Promise<PlatformAccount | null> {
  const cleanCid = customerId.replace(/-/g, '')

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `

  const response = await fetch(
    `https://googleads.googleapis.com/${ENV.GOOGLE_ADS_API_VERSION}/customers/${cleanCid}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': ENV.GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': ENV.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  )

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown')
    throw new Error(`Google Ads ${customerId} query failed (${response.status}): ${text.slice(0, 300)}`)
  }

  const batches = (await response.json()) as Array<{
    results?: Array<{
      campaign: { id: string; name: string; status: string; advertisingChannelType?: string }
      metrics: {
        impressions?: string
        clicks?: string
        costMicros?: string
        conversions?: number
        conversionsValue?: number
      }
    }>
  }>

  const rows = batches.flatMap((b) => b.results || [])

  // Aggregate by campaign
  const byCampaignId = new Map<string, Campaign>()
  for (const row of rows) {
    const id = row.campaign.id
    const impressions = Number(row.metrics.impressions || 0)
    const clicks = Number(row.metrics.clicks || 0)
    const spend = Number(row.metrics.costMicros || 0) / 1_000_000
    const conversions = Number(row.metrics.conversions || 0)
    const conversionValue = Number(row.metrics.conversionsValue || 0)

    const existing = byCampaignId.get(id)
    if (existing) {
      existing.metrics.impressions += impressions
      existing.metrics.clicks += clicks
      existing.metrics.spend += spend
      existing.metrics.conversions += conversions
      existing.metrics.conversion_value += conversionValue
    } else {
      byCampaignId.set(id, {
        id,
        name: row.campaign.name,
        status: row.campaign.status.toLowerCase() === 'enabled' ? 'enabled' : 'paused',
        status_raw: row.campaign.status,
        platform: 'google_ads',
        campaign_type: row.campaign.advertisingChannelType,
        metrics: {
          impressions,
          clicks,
          spend,
          conversions,
          conversion_value: conversionValue,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          cost_per_conversion: 0,
          roas: 0,
        },
      })
    }
  }

  // Compute rates after aggregation
  const campaigns = Array.from(byCampaignId.values()).map((c) => ({
    ...c,
    metrics: {
      ...c.metrics,
      ...computeRates(
        c.metrics.impressions,
        c.metrics.clicks,
        c.metrics.spend,
        c.metrics.conversions,
        c.metrics.conversion_value,
      ),
    },
  }))

  const totalImpressions = campaigns.reduce((s, c) => s + c.metrics.impressions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0)
  const totalSpend = campaigns.reduce((s, c) => s + c.metrics.spend, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0)
  const totalConversionValue = campaigns.reduce((s, c) => s + c.metrics.conversion_value, 0)

  return {
    platform: 'google_ads',
    account_id: customerId,
    account_name: customerId,
    currency: 'BRL',
    connected: true,
    last_synced_at: new Date().toISOString(),
    summary: {
      impressions: totalImpressions,
      clicks: totalClicks,
      spend: totalSpend,
      conversions: totalConversions,
      conversion_value: totalConversionValue,
      ...computeRates(
        totalImpressions,
        totalClicks,
        totalSpend,
        totalConversions,
        totalConversionValue,
      ),
      active_campaigns: campaigns.filter((c) => c.status === 'enabled').length,
      total_campaigns: campaigns.length,
    },
    campaigns,
    daily: [],
  }
}

// =============================================================
// MAIN
// =============================================================

export async function fetchPerformanceSnapshot(): Promise<PerformanceSnapshotResult> {
  const period = getLastMonthRange()
  const capturedAt = new Date().toISOString()
  const clients: Record<string, ClientPerformance> = {}

  // Pre-fetch Google Ads access token once
  let googleToken: string | null = null
  try {
    googleToken = await getGoogleAccessToken()
  } catch (err) {
    console.error('[performanceFetcher] Google OAuth failed:', err)
  }

  for (const client of AGENCY_CLIENTS) {
    const platforms: ClientPerformance['platforms'] = {}

    // Meta Ads
    if (client.meta_account_id) {
      try {
        const account = await fetchMetaAccount(
          client.meta_account_id,
          period.from,
          period.to,
        )
        if (account) {
          account.account_name = `Meta — ${client.name}`
          platforms.meta_ads = account
        }
      } catch (err) {
        console.error(`[performanceFetcher] Meta ${client.slug} failed:`, err)
      }
    }

    // Google Ads
    if (client.google_ads_customer_id && googleToken) {
      try {
        const account = await fetchGoogleAdsAccount(
          client.google_ads_customer_id,
          googleToken,
          period.from,
          period.to,
        )
        if (account) {
          account.account_name = `Google Ads — ${client.name}`
          platforms.google_ads = account
        }
      } catch (err) {
        console.error(`[performanceFetcher] Google ${client.slug} failed:`, err)
      }
    }

    // Blended
    const meta = platforms.meta_ads?.summary || zeroSummary()
    const google = platforms.google_ads?.summary || zeroSummary()
    const totalSpend = meta.spend + google.spend
    const totalImpressions = meta.impressions + google.impressions
    const totalClicks = meta.clicks + google.clicks
    const totalConversions = meta.conversions + google.conversions
    const totalReach = (meta.reach || 0) + (google.reach || 0)

    clients[client.slug] = {
      client_slug: client.slug,
      client_name: client.name,
      period,
      platforms,
      blended: {
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_reach: totalReach,
        avg_ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        avg_cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        cost_per_conversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
        roas: 0,
      },
      last_synced_at: capturedAt,
    }
  }

  return { captured_at: capturedAt, period, clients }
}
