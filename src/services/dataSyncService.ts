/**
 * ============================================
 * DATA SYNC SERVICE — Orquestrador de sincronização
 * ============================================
 * Coordena sync de múltiplas plataformas via N8N.
 * Suporta: Meta Ads, Google Ads, CRM (Kommo), E-commerce.
 *
 * Fluxo: Frontend → N8N Webhook → API Externa → N8N → Supabase
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import { syncService } from './metaAdsService';

// =====================================================
// CONFIG
// =====================================================

const N8N_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook';

// =====================================================
// TYPES
// =====================================================

export type SyncPlatform = 'meta_ads' | 'google_ads' | 'kommo_crm' | 'ecommerce';

export interface SyncJob {
  id: string;
  platform: SyncPlatform;
  accountId: string;
  accountName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress?: { step: string; percentage: number };
  error?: string;
  startedAt?: string;
  completedAt?: string;
  stats?: {
    campaignsSync: number;
    insightsSync: number;
    leadsSync: number;
    duration: number;
  };
}

export interface SyncConfig {
  dateRange: { since: string; until: string };
  platforms: SyncPlatform[];
  clientId?: string;
}

// =====================================================
// N8N WEBHOOK ENDPOINTS
// =====================================================

const N8N_ENDPOINTS: Record<SyncPlatform, string> = {
  meta_ads: '/adsflow/meta-sync',
  google_ads: '/adsflow/google-sync',
  kommo_crm: '/adsflow/kommo-sync',
  ecommerce: '/adsflow/ecommerce-sync',
};

// =====================================================
// MAIN SYNC SERVICE
// =====================================================

export const dataSyncService = {
  /**
   * Sync a single platform/account
   */
  async syncAccount(
    platform: SyncPlatform,
    accountId: string,
    dateRange: { since: string; until: string },
    onProgress?: (progress: { step: string; percentage: number }) => void,
  ): Promise<SyncJob> {
    const job: SyncJob = {
      id: crypto.randomUUID(),
      platform,
      accountId,
      accountName: '',
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    try {
      onProgress?.({ step: 'Iniciando sync...', percentage: 0 });

      // For Meta Ads, use existing sync service
      if (platform === 'meta_ads') {
        await syncService.fullSync(accountId, dateRange, (progress) => {
          onProgress?.({
            step: progress.status === 'syncing' ? 'Sincronizando...' : progress.status,
            percentage: progress.status === 'completed' ? 100 : 50,
          });
        });
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        return job;
      }

      // For other platforms, call N8N webhook
      const endpoint = N8N_ENDPOINTS[platform];
      onProgress?.({ step: `Chamando N8N (${platform})...`, percentage: 20 });

      const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          date_range: dateRange,
          action: 'full_sync',
        }),
      });

      if (!response.ok) {
        throw new Error(`N8N sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      onProgress?.({ step: 'Processando dados...', percentage: 80 });

      // Store results if N8N returns data directly
      if (result.data) {
        await this.processN8NResult(platform, accountId, result.data);
      }

      onProgress?.({ step: 'Concluído!', percentage: 100 });
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.stats = result.stats;
      return job;
    } catch (err) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Unknown error';
      job.completedAt = new Date().toISOString();
      return job;
    }
  },

  /**
   * Sync ALL accounts for a client across all platforms
   */
  async syncAllForClient(
    clientId: string,
    dateRange: { since: string; until: string },
    onProgress?: (accountId: string, progress: { step: string; percentage: number }) => void,
  ): Promise<SyncJob[]> {
    if (!isSupabaseConfigured) return [];

    // Get all active accounts for this client
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id, platform, account_name, status')
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (!accounts || accounts.length === 0) return [];

    const jobs: SyncJob[] = [];

    // Sync sequentially to avoid rate limits
    for (const account of accounts) {
      const job = await this.syncAccount(
        account.platform as SyncPlatform,
        account.id,
        dateRange,
        (progress) => onProgress?.(account.id, progress),
      );
      job.accountName = account.account_name;
      jobs.push(job);
    }

    return jobs;
  },

  /**
   * Process N8N webhook result and store in Supabase
   */
  async processN8NResult(
    platform: SyncPlatform,
    accountId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    switch (platform) {
      case 'google_ads':
        // Google Ads follows same structure as Meta Ads
        if (Array.isArray(data.campaigns)) {
          for (const campaign of data.campaigns) {
            await supabase.from('campaigns_cache').upsert({
              ad_account_id: accountId,
              platform_campaign_id: campaign.id,
              name: campaign.name,
              objective: campaign.type || null,
              status: campaign.status,
            }, { onConflict: 'ad_account_id,platform_campaign_id' });
          }
        }
        if (Array.isArray(data.insights)) {
          for (const insight of data.insights) {
            await supabase.from('campaign_insights').upsert({
              ad_account_id: accountId,
              platform_campaign_id: insight.campaign_id,
              date: insight.date,
              impressions: insight.impressions || 0,
              reach: insight.reach || 0,
              clicks: insight.clicks || 0,
              spend: insight.cost || insight.spend || 0,
              conversions: insight.conversions || 0,
              conversion_value: insight.conversion_value || 0,
              ctr: insight.ctr || 0,
              cpc: insight.cpc || 0,
              cpm: insight.cpm || 0,
              roas: insight.roas || 0,
              leads: insight.leads || 0,
              cost_per_lead: insight.cost_per_lead || 0,
            }, { onConflict: 'ad_account_id,platform_campaign_id,date' });
          }
        }
        break;

      case 'kommo_crm':
        // Kommo leads → leads table
        if (Array.isArray(data.leads)) {
          for (const lead of data.leads) {
            await supabase.from('leads').upsert({
              id: lead.id,
              user_id: lead.user_id,
              client_id: lead.client_id,
              titulo: lead.name || lead.titulo,
              contato_nome: lead.contact_name,
              contato_email: lead.contact_email,
              contato_telefone: lead.contact_phone,
              fonte: mapKommoSource(lead.source),
              status_funil: mapKommoStatus(lead.status_id),
              resultado: mapKommoResult(lead.status_id),
              valor_estimado: lead.price || 0,
              created_at: lead.created_at,
            }, { onConflict: 'id' });
          }
        }
        break;

      case 'ecommerce':
        // E-commerce orders → future ecommerce tables
        // For now, data goes into a generic JSON field or dedicated table
        break;
    }
  },

  /**
   * Get sync status for all accounts of a client
   */
  async getSyncStatus(clientId: string): Promise<Array<{
    accountId: string;
    accountName: string;
    platform: string;
    lastSync: string | null;
    status: string;
    error: string | null;
  }>> {
    if (!isSupabaseConfigured) return [];

    const { data } = await supabase
      .from('ad_accounts')
      .select('id, account_name, platform, last_sync_at, status, sync_error')
      .eq('client_id', clientId)
      .order('platform');

    return (data || []).map((a) => ({
      accountId: a.id,
      accountName: a.account_name,
      platform: a.platform,
      lastSync: a.last_sync_at,
      status: a.status,
      error: a.sync_error,
    }));
  },
};

// =====================================================
// KOMMO CRM MAPPING HELPERS
// =====================================================

function mapKommoSource(source: string | number | null): string {
  const sourceMap: Record<string, string> = {
    'web': 'Inbound',
    'instagram': 'SMM Organic',
    'facebook': 'Busca Paga/Facebook',
    'google': 'Busca Paga/Google',
    'whatsapp': 'Inbound',
    'referral': 'Indicação',
    'organic': 'SMM Organic',
  };
  return sourceMap[String(source).toLowerCase()] || 'Outro';
}

function mapKommoStatus(statusId: number | string | null): string {
  // These need to be configured per Kommo pipeline
  // Default mapping based on common Kommo statuses
  const statusMap: Record<string, string> = {
    '142': 'Sem contato',        // Incoming leads
    '143': 'Contato feito',      // Qualified
    '144': 'Identificação do interesse', // Negotiation
    '145': 'Aguardando documento', // Decision
    '146': 'Contrato fechado',   // Won
  };
  return statusMap[String(statusId)] || 'Sem contato';
}

function mapKommoResult(statusId: number | string | null): string {
  const sid = String(statusId);
  if (sid === '146' || sid === '142') return 'vendido'; // Won statuses
  if (sid === '143') return 'perdido'; // Lost statuses
  return 'aberto';
}

// =====================================================
// N8N WORKFLOW DEFINITIONS (JSON configs)
// =====================================================

/**
 * Returns the N8N workflow JSON configuration for a given platform.
 * These are meant to be imported into N8N via the UI.
 */
export function getN8NWorkflowConfig(platform: SyncPlatform): Record<string, unknown> {
  const configs: Record<SyncPlatform, Record<string, unknown>> = {
    meta_ads: {
      name: 'Ads Flow — Meta Ads Sync',
      description: 'Sincroniza campanhas, adsets, ads e insights do Meta Ads para Supabase',
      trigger: 'webhook',
      webhookPath: '/adsflow/meta-sync',
      steps: [
        { type: 'webhook', path: '/adsflow/meta-sync' },
        { type: 'meta_ads_api', action: 'get_campaigns', fields: 'id,name,status,objective,daily_budget' },
        { type: 'meta_ads_api', action: 'get_insights', fields: 'impressions,reach,clicks,spend,actions,video_views' },
        { type: 'transform', map: 'normalize_insights' },
        { type: 'supabase', action: 'upsert', table: 'campaigns_cache' },
        { type: 'supabase', action: 'upsert', table: 'campaign_insights' },
        { type: 'supabase', action: 'update', table: 'ad_accounts', field: 'last_sync_at' },
        { type: 'respond', status: 200 },
      ],
    },
    google_ads: {
      name: 'Ads Flow — Google Ads Sync',
      description: 'Sincroniza campanhas e métricas do Google Ads para Supabase',
      trigger: 'webhook',
      webhookPath: '/adsflow/google-sync',
      steps: [
        { type: 'webhook', path: '/adsflow/google-sync' },
        { type: 'google_ads_api', action: 'get_campaigns' },
        { type: 'google_ads_api', action: 'get_metrics', dateRange: 'from_payload' },
        { type: 'transform', map: 'normalize_google_insights' },
        { type: 'supabase', action: 'upsert', table: 'campaigns_cache' },
        { type: 'supabase', action: 'upsert', table: 'campaign_insights' },
        { type: 'respond', status: 200 },
      ],
    },
    kommo_crm: {
      name: 'Ads Flow — Kommo CRM Sync',
      description: 'Sincroniza leads do Kommo CRM para tabela leads no Supabase',
      trigger: 'webhook',
      webhookPath: '/adsflow/kommo-sync',
      steps: [
        { type: 'webhook', path: '/adsflow/kommo-sync' },
        { type: 'kommo_api', action: 'get_leads', filters: 'from_payload' },
        { type: 'kommo_api', action: 'get_contacts', linkedTo: 'leads' },
        { type: 'transform', map: 'normalize_kommo_leads' },
        { type: 'supabase', action: 'upsert', table: 'leads' },
        { type: 'respond', status: 200 },
      ],
    },
    ecommerce: {
      name: 'Ads Flow — E-commerce Sync',
      description: 'Sincroniza pedidos de VTEX/Tray/Shopify para Supabase',
      trigger: 'webhook',
      webhookPath: '/adsflow/ecommerce-sync',
      steps: [
        { type: 'webhook', path: '/adsflow/ecommerce-sync' },
        { type: 'ecommerce_api', action: 'get_orders', dateRange: 'from_payload' },
        { type: 'transform', map: 'normalize_orders' },
        { type: 'supabase', action: 'upsert', table: 'ecommerce_orders' },
        { type: 'respond', status: 200 },
      ],
    },
  };

  return configs[platform];
}
