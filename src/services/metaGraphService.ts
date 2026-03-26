/**
 * ============================================
 * META GRAPH API SERVICE — Integração Nativa
 * ============================================
 * Acessa a Meta Graph API diretamente sem N8N.
 * Suporta: campanhas, insights, criativos, audiences.
 * Token refresh automático via long-lived token exchange.
 *
 * Para funcionar em produção precisa:
 * 1. App Review aprovado (ads_read, ads_management, business_management)
 * 2. System User token (não expira) ou refresh automático
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

// =====================================================
// CONFIG
// =====================================================

const META_API_VERSION = import.meta.env.VITE_META_API_VERSION || 'v23.0';
const META_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// SECURITY: META_APP_SECRET was removed from frontend.
// Token exchange and debug_token are now proxied through N8N server-side.

// =====================================================
// TYPES
// =====================================================

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  frequency: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  video_play_actions?: Array<{ action_type: string; value: string }>;
  video_thruplay_watched_actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
}

export interface MetaAdInsight {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  adset_id: string;
  date_start: string;
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
  video_play_actions?: Array<{ action_type: string; value: string }>;
  video_thruplay_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p50_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p75_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p100_watched_actions?: Array<{ action_type: string; value: string }>;
}

interface GraphResponse<T> {
  data: T[];
  paging?: {
    cursors?: { after?: string; before?: string };
    next?: string;
  };
}

// =====================================================
// CORE API CALLER
// =====================================================

async function graphFetch<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<GraphResponse<T>> {
  const url = new URL(`${GRAPH_BASE}${endpoint}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const metaError = error.error as MetaApiError;
    throw new Error(`Meta API Error [${metaError?.code || response.status}]: ${metaError?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all pages of a paginated endpoint
 */
async function graphFetchAll<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const allItems: T[] = [];
  let nextUrl: string | null = null;

  // First request
  const firstResult = await graphFetch<T>(endpoint, accessToken, params);
  allItems.push(...firstResult.data);
  nextUrl = firstResult.paging?.next || null;

  // Pagination
  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) break;
    const result: GraphResponse<T> = await response.json();
    allItems.push(...result.data);
    nextUrl = result.paging?.next || null;
  }

  return allItems;
}

// =====================================================
// TOKEN MANAGEMENT
// =====================================================

export const metaTokenService = {
  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (!N8N_WEBHOOK_URL) {
      throw new Error('N8N_WEBHOOK_URL required for secure token exchange');
    }

    // SECURITY: Token exchange uses client_secret which MUST stay server-side.
    // We proxy this through N8N which has the secret stored securely.
    const response = await fetch(`${N8N_WEBHOOK_URL}/adsflow/meta-token-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_lived_token: shortLivedToken,
        app_id: META_APP_ID,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // 60 days default
    };
  },

  /**
   * Get token info (debug token)
   */
  async debugToken(token: string): Promise<{
    isValid: boolean;
    expiresAt: number;
    scopes: string[];
    userId: string;
    appId: string;
  }> {
    // SECURITY: Use the user's own token to debug itself (self-inspection).
    // This avoids needing app_id|app_secret in the frontend.
    const url = new URL(`${GRAPH_BASE}/debug_token`);
    url.searchParams.set('input_token', token);
    url.searchParams.set('access_token', token);

    const response = await fetch(url.toString());
    const data = await response.json();
    const tokenData = data.data;

    return {
      isValid: tokenData?.is_valid ?? false,
      expiresAt: tokenData?.expires_at ?? 0,
      scopes: tokenData?.scopes ?? [],
      userId: tokenData?.user_id ?? '',
      appId: tokenData?.app_id ?? '',
    };
  },

  /**
   * Auto-refresh token if it's about to expire (within 7 days)
   * Stores updated token in Supabase ad_accounts table
   */
  async refreshIfNeeded(accountId: string): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('access_token, token_expires_at')
      .eq('id', accountId)
      .single();

    if (!account?.access_token) throw new Error('No access token found');

    // Check if token expires within 7 days
    const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

    if (expiresAt > sevenDaysFromNow) {
      return account.access_token; // Token still valid
    }

    // Refresh token
    try {
      const { accessToken, expiresIn } = await this.exchangeForLongLivedToken(account.access_token);
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      await supabase
        .from('ad_accounts')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt,
        })
        .eq('id', accountId);

      return accessToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Mark account as having error
      await supabase
        .from('ad_accounts')
        .update({ sync_error: 'Token refresh failed', status: 'error' })
        .eq('id', accountId);
      throw err;
    }
  },
};

// =====================================================
// CAMPAIGNS
// =====================================================

export const metaCampaignService = {
  async list(adAccountId: string, accessToken: string): Promise<MetaCampaign[]> {
    return graphFetchAll<MetaCampaign>(
      `/act_${adAccountId}/campaigns`,
      accessToken,
      {
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
        limit: '100',
      },
    );
  },
};

// =====================================================
// INSIGHTS (Campaign Level)
// =====================================================

export const metaInsightsService = {
  /**
   * Get campaign-level insights with daily breakdown
   */
  async getCampaignInsights(
    adAccountId: string,
    accessToken: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<MetaInsight[]> {
    return graphFetchAll<MetaInsight>(
      `/act_${adAccountId}/insights`,
      accessToken,
      {
        fields: [
          'campaign_id', 'campaign_name',
          'impressions', 'reach', 'clicks', 'spend',
          'ctr', 'cpc', 'cpm', 'frequency',
          'actions', 'action_values', 'cost_per_action_type',
          'video_play_actions', 'video_thruplay_watched_actions',
        ].join(','),
        time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
        level: 'campaign',
        time_increment: '1',
        limit: '500',
      },
    );
  },

  /**
   * Get ad-level insights (for creative analysis)
   */
  async getAdInsights(
    adAccountId: string,
    accessToken: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<MetaAdInsight[]> {
    return graphFetchAll<MetaAdInsight>(
      `/act_${adAccountId}/insights`,
      accessToken,
      {
        fields: [
          'ad_id', 'ad_name', 'campaign_id', 'adset_id',
          'impressions', 'clicks', 'spend', 'ctr',
          'actions', 'video_play_actions',
          'video_thruplay_watched_actions',
          'video_p25_watched_actions', 'video_p50_watched_actions',
          'video_p75_watched_actions', 'video_p100_watched_actions',
        ].join(','),
        time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
        level: 'ad',
        time_increment: 'all_days',
        limit: '200',
      },
    );
  },

  /**
   * Normalize raw Meta insights to our DB format
   */
  normalizeInsight(raw: MetaInsight): Record<string, unknown> {
    const actions = raw.actions || [];
    const actionValues = raw.action_values || [];

    const findAction = (type: string) =>
      parseInt(actions.find((a) => a.action_type === type)?.value || '0');
    const findActionValue = (type: string) =>
      parseFloat(actionValues.find((a) => a.action_type === type)?.value || '0');

    const conversions = findAction('offsite_conversion.fb_pixel_purchase')
      || findAction('purchase')
      || findAction('onsite_conversion.messaging_conversation_started_7d');
    const conversionValue = findActionValue('offsite_conversion.fb_pixel_purchase')
      || findActionValue('purchase');
    const leads = findAction('lead')
      || findAction('onsite_conversion.lead_grouped');
    const engagement = findAction('post_engagement')
      || findAction('page_engagement');
    const videoViews = findAction('video_view');

    const spend = parseFloat(raw.spend) || 0;
    const impressions = parseInt(raw.impressions) || 0;

    return {
      campaign_id: raw.campaign_id,
      campaign_name: raw.campaign_name,
      date: raw.date_start,
      impressions,
      reach: parseInt(raw.reach) || 0,
      clicks: parseInt(raw.clicks) || 0,
      spend,
      ctr: parseFloat(raw.ctr) || 0,
      cpc: parseFloat(raw.cpc) || 0,
      cpm: parseFloat(raw.cpm) || 0,
      conversions,
      conversion_value: conversionValue,
      cost_per_conversion: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? conversionValue / spend : 0,
      frequency: parseFloat(raw.frequency) || 0,
      leads,
      cost_per_lead: leads > 0 ? spend / leads : 0,
      engagement,
      video_views: videoViews,
    };
  },
};

// =====================================================
// FULL SYNC — Direct to Supabase (bypass N8N)
// =====================================================

export const metaDirectSync = {
  /**
   * Full sync: campaigns + insights directly from Meta API to Supabase
   */
  async fullSync(
    supabaseAccountId: string,
    dateFrom: string,
    dateTo: string,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ campaigns: number; insights: number; duration: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const startTime = Date.now();
    onProgress?.('Carregando credenciais...', 5);

    // 1. Get account from Supabase
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('account_id, access_token')
      .eq('id', supabaseAccountId)
      .single();

    if (!account?.access_token || !account?.account_id) {
      throw new Error('Account not found or missing credentials');
    }

    // 2. Auto-refresh token if needed
    let token = account.access_token;
    try {
      token = await metaTokenService.refreshIfNeeded(supabaseAccountId);
    } catch {
      // Continue with existing token
    }

    const metaAccountId = account.account_id.replace('act_', '');

    // 3. Fetch campaigns
    onProgress?.('Buscando campanhas...', 15);
    const campaigns = await metaCampaignService.list(metaAccountId, token);

    // 4. Upsert campaigns to cache
    onProgress?.('Salvando campanhas...', 30);
    for (const campaign of campaigns) {
      await supabase.from('campaigns_cache').upsert({
        ad_account_id: supabaseAccountId,
        platform_campaign_id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        start_date: campaign.start_time || null,
        end_date: campaign.stop_time || null,
      }, { onConflict: 'ad_account_id,platform_campaign_id' });
    }

    // 5. Fetch insights
    onProgress?.('Buscando insights...', 45);
    const rawInsights = await metaInsightsService.getCampaignInsights(
      metaAccountId, token, dateFrom, dateTo,
    );

    // 6. Normalize and upsert insights
    onProgress?.('Salvando insights...', 70);
    const normalized = rawInsights.map((i) => metaInsightsService.normalizeInsight(i));

    // Get campaign ID map
    const { data: cachedCampaigns } = await supabase
      .from('campaigns_cache')
      .select('id, platform_campaign_id')
      .eq('ad_account_id', supabaseAccountId);

    const campaignIdMap = new Map(
      (cachedCampaigns || []).map((c) => [c.platform_campaign_id, c.id]),
    );

    for (const insight of normalized) {
      const campaignDbId = campaignIdMap.get(insight.campaign_id as string);
      if (!campaignDbId) continue;

      await supabase.from('campaign_insights').upsert({
        ad_account_id: supabaseAccountId,
        campaign_id: campaignDbId,
        platform_campaign_id: insight.campaign_id,
        date: insight.date,
        impressions: insight.impressions,
        reach: insight.reach,
        clicks: insight.clicks,
        spend: insight.spend,
        ctr: insight.ctr,
        cpc: insight.cpc,
        cpm: insight.cpm,
        conversions: insight.conversions,
        conversion_value: insight.conversion_value,
        cost_per_conversion: insight.cost_per_conversion,
        roas: insight.roas,
        frequency: insight.frequency,
        leads: insight.leads,
        cost_per_lead: insight.cost_per_lead,
        engagement: insight.engagement,
        video_views: insight.video_views,
      }, { onConflict: 'ad_account_id,platform_campaign_id,date' });
    }

    // 7. Update account last_sync
    onProgress?.('Finalizando...', 95);
    await supabase
      .from('ad_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        status: 'active',
      })
      .eq('id', supabaseAccountId);

    // 8. Log sync
    const duration = Date.now() - startTime;
    await supabase.from('sync_logs').insert({
      ad_account_id: supabaseAccountId,
      sync_type: 'full',
      status: 'completed',
      campaigns_synced: campaigns.length,
      insights_synced: normalized.length,
      date_range_start: dateFrom,
      date_range_end: dateTo,
      duration_ms: duration,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    onProgress?.('Concluído!', 100);

    return {
      campaigns: campaigns.length,
      insights: normalized.length,
      duration,
    };
  },
};
