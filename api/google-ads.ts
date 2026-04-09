/**
 * ============================================
 * GOOGLE ADS API — Vercel Serverless Proxy
 * ============================================
 * Direct Google Ads REST API proxy.
 * Keeps developer_token + client_secret server-side.
 *
 * Endpoints (via ?action=...):
 *   - campaigns:  List campaigns for an account
 *   - insights:   Campaign performance metrics
 *   - keywords:   Keyword data with quality scores
 *   - refresh:    Refresh OAuth access token
 *
 * Env vars required:
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// =====================================================
// CONFIG
// =====================================================

const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || ''
const GOOGLE_ADS_API_VERSION = 'v21'
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

// =====================================================
// HANDLER
// =====================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!DEVELOPER_TOKEN) {
    return res.status(500).json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured' })
  }

  const { action, ...body } = req.body || {}

  try {
    switch (action) {
      case 'campaigns':
        return res.json(await fetchCampaigns(body))
      case 'insights':
        return res.json(await fetchInsights(body))
      case 'keywords':
        return res.json(await fetchKeywords(body))
      case 'refresh':
        return res.json(await refreshToken(body))
      case 'exchange':
        return res.json(await exchangeCode(body))

      // YouTube
      case 'youtube-channel':
        return res.json(await youtubeChannel(body))
      case 'youtube-analytics':
        return res.json(await youtubeAnalytics(body))
      case 'youtube-videos':
        return res.json(await youtubeVideos(body))

      // Google My Business
      case 'gmb-locations':
        return res.json(await gmbLocations(body))
      case 'gmb-reviews':
        return res.json(await gmbReviews(body))
      case 'gmb-metrics':
        return res.json(await gmbMetrics(body))

      // Google Analytics 4
      case 'ga4-properties':
        return res.json(await ga4Properties(body))
      case 'ga4-traffic':
        return res.json(await ga4Traffic(body))
      case 'ga4-conversions':
        return res.json(await ga4Conversions(body))

      // Search Console
      case 'gsc-sites':
        return res.json(await gscSites(body))
      case 'gsc-analytics':
        return res.json(await gscAnalytics(body))

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[google-proxy] ${action} error:`, message)
    return res.status(500).json({ error: message })
  }
}

// =====================================================
// GAQL QUERY HELPER
// =====================================================

async function gaqlQuery(
  customerId: string,
  accessToken: string,
  query: string,
  loginCustomerId?: string,
): Promise<unknown[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  }

  // For MCC (manager) accounts
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId.replace(/-/g, '')
  }

  const cleanCid = customerId.replace(/-/g, '')

  const response = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${cleanCid}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown')
    throw new Error(`Google Ads API (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  // searchStream returns array of result batches
  const results: unknown[] = []
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) results.push(...batch.results)
    }
  }

  return results
}

// =====================================================
// CAMPAIGNS
// =====================================================

async function fetchCampaigns(body: {
  account_id: string
  access_token: string
  login_customer_id?: string
}) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign.start_date,
      campaign.end_date,
      campaign_budget.amount_micros,
      campaign_budget.type
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `

  const results = await gaqlQuery(
    body.account_id,
    body.access_token,
    query,
    body.login_customer_id,
  )

  const campaigns = results.map((r: any) => ({
    campaign_id: r.campaign.id,
    campaign_name: r.campaign.name,
    campaign_type: r.campaign.advertisingChannelType,
    status: r.campaign.status,
    budget_amount: r.campaignBudget?.amountMicros
      ? Number(r.campaignBudget.amountMicros) / 1_000_000
      : null,
    budget_type: r.campaignBudget?.type || null,
    bidding_strategy: r.campaign.biddingStrategyType || null,
    start_date: r.campaign.startDate || null,
    end_date: r.campaign.endDate || null,
  }))

  return { campaigns }
}

// =====================================================
// INSIGHTS (daily metrics)
// =====================================================

async function fetchInsights(body: {
  account_id: string
  access_token: string
  date_from: string
  date_to: string
  login_customer_id?: string
}) {
  const query = `
    SELECT
      campaign.id,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.search_impression_share,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      metrics.all_conversions,
      metrics.view_through_conversions,
      metrics.interaction_rate,
      metrics.video_views,
      metrics.video_view_rate,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${body.date_from}' AND '${body.date_to}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date, campaign.id
  `

  const results = await gaqlQuery(
    body.account_id,
    body.access_token,
    query,
    body.login_customer_id,
  )

  const insights = results.map((r: any) => {
    const costMicros = Number(r.metrics.costMicros || 0)
    const cost = costMicros / 1_000_000
    const conversions = Number(r.metrics.conversions || 0)
    const conversionValue = Number(r.metrics.conversionsValue || 0)

    return {
      campaign_id: r.campaign.id,
      date: r.segments.date,
      impressions: Number(r.metrics.impressions || 0),
      clicks: Number(r.metrics.clicks || 0),
      cost,
      conversions,
      conversion_value: conversionValue,
      ctr: Number(r.metrics.ctr || 0) * 100,
      avg_cpc: Number(r.metrics.averageCpc || 0) / 1_000_000,
      avg_cpm: Number(r.metrics.averageCpm || 0) / 1_000_000,
      impression_share: r.metrics.searchImpressionShare ?? null,
      search_impression_share: r.metrics.searchImpressionShare ?? null,
      search_budget_lost_is: r.metrics.searchBudgetLostImpressionShare ?? null,
      search_rank_lost_is: r.metrics.searchRankLostImpressionShare ?? null,
      all_conversions: Number(r.metrics.allConversions || 0),
      view_through_conversions: Number(r.metrics.viewThroughConversions || 0),
      interaction_rate: Number(r.metrics.interactionRate || 0),
      video_views: Number(r.metrics.videoViews || 0),
      video_view_rate: Number(r.metrics.videoViewRate || 0),
      cost_per_conversion: conversions > 0 ? cost / conversions : 0,
      roas: cost > 0 ? conversionValue / cost : 0,
    }
  })

  return { insights }
}

// =====================================================
// KEYWORDS
// =====================================================

async function fetchKeywords(body: {
  account_id: string
  access_token: string
  campaign_id?: string
  date_from: string
  date_to: string
  login_customer_id?: string
}) {
  const campaignFilter = body.campaign_id
    ? `AND campaign.id = ${body.campaign_id}`
    : ''

  const query = `
    SELECT
      campaign.id,
      ad_group.id,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      segments.date
    FROM keyword_view
    WHERE segments.date BETWEEN '${body.date_from}' AND '${body.date_to}'
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT 1000
  `

  const results = await gaqlQuery(
    body.account_id,
    body.access_token,
    query,
    body.login_customer_id,
  )

  const keywords = results.map((r: any) => ({
    campaign_id: r.campaign.id,
    ad_group_id: r.adGroup.id,
    ad_group_name: r.adGroup.name,
    keyword_text: r.adGroupCriterion.keyword.text,
    match_type: r.adGroupCriterion.keyword.matchType,
    quality_score: r.adGroupCriterion.qualityInfo?.qualityScore ?? null,
    expected_ctr_score: r.adGroupCriterion.qualityInfo?.searchPredictedCtr ?? null,
    ad_relevance_score: r.adGroupCriterion.qualityInfo?.creativeQualityScore ?? null,
    landing_page_score: r.adGroupCriterion.qualityInfo?.postClickQualityScore ?? null,
    impressions: Number(r.metrics.impressions || 0),
    clicks: Number(r.metrics.clicks || 0),
    cost: Number(r.metrics.costMicros || 0) / 1_000_000,
    conversions: Number(r.metrics.conversions || 0),
    ctr: Number(r.metrics.ctr || 0) * 100,
    avg_cpc: Number(r.metrics.averageCpc || 0) / 1_000_000,
    avg_position: null,
    date: r.segments.date,
  }))

  return { keywords }
}

// =====================================================
// TOKEN REFRESH
// =====================================================

async function refreshToken(body: { refresh_token: string }) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: body.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Token refresh failed: ${error.error_description || error.error || response.statusText}`)
  }

  return response.json()
}

// =====================================================
// CODE EXCHANGE
// =====================================================

async function exchangeCode(body: { code: string; redirect_uri: string }) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: body.code,
      redirect_uri: body.redirect_uri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Code exchange failed: ${error.error_description || error.error || response.statusText}`)
  }

  return response.json()
}

// =====================================================
// YOUTUBE — Channel, Analytics, Videos
// =====================================================

async function youtubeChannel(body: { access_token: string; channel_id?: string }) {
  const idParam = body.channel_id ? `id=${body.channel_id}` : 'mine=true'
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${idParam}&part=snippet,statistics,contentDetails`,
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function youtubeAnalytics(body: {
  access_token: string
  date_from: string
  date_to: string
  dimensions?: string
}) {
  const dims = body.dimensions || 'day'
  const metrics = 'views,estimatedMinutesWatched,averageViewDuration,likes,dislikes,comments,shares,subscribersGained,subscribersLost,estimatedRevenue'
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${body.date_from}&endDate=${body.date_to}&metrics=${metrics}&dimensions=${dims}&sort=${dims === 'day' ? 'day' : '-views'}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${body.access_token}` },
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function youtubeVideos(body: {
  access_token: string
  channel_id?: string
  max_results?: number
}) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    maxResults: String(body.max_results || 20),
    order: 'date',
    type: 'video',
    ...(body.channel_id ? { channelId: body.channel_id } : {}),
  })

  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}&mine=true`,
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!searchResponse.ok) throw new Error(await searchResponse.text())
  const searchData = await searchResponse.json()

  const videoIds = (searchData.items || [])
    .map((item: any) => item.id?.videoId)
    .filter(Boolean)
    .join(',')

  if (!videoIds) return { items: [] }

  const detailResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!detailResponse.ok) throw new Error(await detailResponse.text())
  return detailResponse.json()
}

// =====================================================
// GOOGLE MY BUSINESS — Locations, Reviews, Metrics
// =====================================================

async function gmbLocations(body: { access_token: string; account_name?: string }) {
  if (!body.account_name) {
    const accResp = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${body.access_token}` } },
    )
    if (!accResp.ok) throw new Error(await accResp.text())
    const accounts = await accResp.json()
    const accountName = accounts.accounts?.[0]?.name
    if (!accountName) return { locations: [] }

    const locResp = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
      { headers: { Authorization: `Bearer ${body.access_token}` } },
    )
    if (!locResp.ok) throw new Error(await locResp.text())
    return locResp.json()
  }

  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${body.account_name}/locations?readMask=name,title,storefrontAddress`,
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function gmbReviews(body: { access_token: string; location_name: string; page_size?: number }) {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${body.location_name}/reviews?pageSize=${body.page_size || 50}`,
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

// =====================================================
// GOOGLE ANALYTICS 4 — Admin API (properties) + Data API (runReport)
// =====================================================

/** List GA4 properties accessible via accountSummaries (Admin API v1beta). */
async function ga4Properties(body: { access_token: string }) {
  const response = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
    { headers: { Authorization: `Bearer ${body.access_token}` } },
  )
  if (!response.ok) throw new Error(`GA4 Admin API: ${await response.text()}`)
  const data = await response.json()

  const properties: Array<{
    property_id: string
    display_name: string
    timezone: string
    currency: string
    industry_category: string | null
    create_time: string
  }> = []

  for (const account of data.accountSummaries || []) {
    for (const propSummary of account.propertySummaries || []) {
      // propSummary.property = "properties/123456789"
      const propertyId = (propSummary.property || '').replace('properties/', '')
      properties.push({
        property_id: propertyId,
        display_name:
          `${account.displayName || ''} — ${propSummary.displayName || ''}`.trim(),
        timezone: '',
        currency: '',
        industry_category: null,
        create_time: '',
      })
    }
  }

  return { properties }
}

/** GA4 Data API runReport for traffic dimensions & metrics. */
async function ga4Traffic(body: {
  access_token: string
  property_id: string
  date_from: string
  date_to: string
}) {
  const propertyId = body.property_id.replace('properties/', '')
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: body.date_from, endDate: body.date_to }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'eventCount' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
        limit: '10000',
      }),
    },
  )
  if (!response.ok) throw new Error(`GA4 Data API: ${await response.text()}`)
  const data = await response.json()

  const rows = (data.rows || []).map((r: any) => {
    const d = r.dimensionValues || []
    const m = r.metricValues || []
    const rawDate = d[0]?.value || '' // YYYYMMDD
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate

    return {
      date,
      session_source: d[1]?.value || null,
      session_medium: d[2]?.value || null,
      session_campaign: null,
      device_category: d[3]?.value || null,
      country: null,
      city: null,
      sessions: Number(m[0]?.value || 0),
      users: Number(m[1]?.value || 0),
      new_users: Number(m[2]?.value || 0),
      active_users: Number(m[3]?.value || 0),
      pageviews: Number(m[4]?.value || 0),
      screen_page_views: Number(m[4]?.value || 0),
      events_count: Number(m[5]?.value || 0),
      engaged_sessions: Number(m[6]?.value || 0),
      engagement_rate: Number(m[7]?.value || 0),
      avg_session_duration: Number(m[8]?.value || 0),
      bounce_rate: Number(m[9]?.value || 0),
      conversions: Number(m[10]?.value || 0),
      total_revenue: Number(m[11]?.value || 0),
    }
  })

  return { rows }
}

/** GA4 Data API runReport filtered by conversion events. */
async function ga4Conversions(body: {
  access_token: string
  property_id: string
  date_from: string
  date_to: string
}) {
  const propertyId = body.property_id.replace('properties/', '')
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: body.date_from, endDate: body.date_to }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalUsers' },
          { name: 'totalRevenue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'isConversionEvent',
            stringFilter: { value: 'true' },
          },
        },
        limit: '200',
      }),
    },
  )
  if (!response.ok) throw new Error(`GA4 Data API (conversions): ${await response.text()}`)
  const data = await response.json()

  const events = (data.rows || []).map((r: any) => ({
    event_name: r.dimensionValues?.[0]?.value || '',
    event_count: Number(r.metricValues?.[0]?.value || 0),
    total_users: Number(r.metricValues?.[1]?.value || 0),
    total_revenue: Number(r.metricValues?.[2]?.value || 0),
  }))

  return { events }
}

// =====================================================
// SEARCH CONSOLE — Webmasters API v3
// =====================================================

/** List verified sites accessible by the user. */
async function gscSites(body: { access_token: string }) {
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${body.access_token}` },
  })
  if (!response.ok) throw new Error(`Search Console sites: ${await response.text()}`)
  const data = await response.json()

  const sites = (data.siteEntry || []).map((s: any) => ({
    site_url: s.siteUrl,
    permission_level: s.permissionLevel,
  }))

  return { sites }
}

/** Search Console searchAnalytics.query — queries/pages/devices performance. */
async function gscAnalytics(body: {
  access_token: string
  site_url: string
  date_from: string
  date_to: string
}) {
  const encodedSite = encodeURIComponent(body.site_url)
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: body.date_from,
        endDate: body.date_to,
        dimensions: ['date', 'query', 'page', 'device', 'country'],
        rowLimit: 5000,
      }),
    },
  )
  if (!response.ok) throw new Error(`Search Console analytics: ${await response.text()}`)
  const data = await response.json()

  const rows = (data.rows || []).map((r: any) => {
    const [date, query, page, device, country] = r.keys || []
    return {
      date: date || '',
      query: query || null,
      page: page || null,
      device: device || null,
      country: country || null,
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(r.ctr || 0),
      position: Number(r.position || 0),
    }
  })

  return { rows }
}

async function gmbMetrics(body: {
  access_token: string
  location_name: string
  date_from: string
  date_to: string
}) {
  const reportBody = {
    locationNames: [body.location_name],
    basicRequest: {
      metricRequests: [
        { metric: 'QUERIES_DIRECT' },
        { metric: 'QUERIES_INDIRECT' },
        { metric: 'VIEWS_MAPS' },
        { metric: 'VIEWS_SEARCH' },
        { metric: 'ACTIONS_WEBSITE' },
        { metric: 'ACTIONS_PHONE' },
        { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
      ],
      timeRange: {
        startTime: `${body.date_from}T00:00:00Z`,
        endTime: `${body.date_to}T23:59:59Z`,
      },
    },
  }

  const response = await fetch(
    'https://mybusiness.googleapis.com/v4/accounts/locations:reportInsights',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${body.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportBody),
    },
  )
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}
