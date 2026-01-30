/**
 * DATA INTEGRATION SERVICE
 * Efeito Digital - Ads Flow
 *
 * Este serviço gerencia a integração de dados externos
 * para alimentar os nós Funnelytics com métricas reais.
 *
 * FONTES DE DADOS SUPORTADAS:
 * 1. Meta Ads API (via MCP)
 * 2. Google Analytics 4 (via API)
 * 3. Webhooks/Pixel (eventos em tempo real)
 * 4. CSV Import (dados históricos)
 * 5. Manual Input (edição direta)
 */

import { supabase } from '@/lib/supabase';
import type { Node } from 'reactflow';
import type { SourceNodeData, PageNodeData, ActionNodeData } from '@/types/funnelytics';

// =====================================================
// TIPOS DE INTEGRAÇÃO
// =====================================================

export type IntegrationSource =
  | 'meta_ads'
  | 'google_analytics'
  | 'google_ads'
  | 'webhook'
  | 'csv_import'
  | 'manual';

export interface IntegrationConfig {
  source: IntegrationSource;
  credentials?: {
    accessToken?: string;
    accountId?: string;
    propertyId?: string; // GA4
    measurementId?: string;
  };
  webhookUrl?: string;
  refreshInterval?: number; // em minutos
  lastSync?: Date;
}

export interface SyncResult {
  success: boolean;
  source: IntegrationSource;
  nodesUpdated: number;
  data?: Record<string, unknown>;
  error?: string;
  syncedAt: Date;
}

// =====================================================
// META ADS INTEGRATION
// =====================================================

export interface MetaAdsData {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  costPerConversion?: number;
}

/**
 * Busca dados do Meta Ads para um SourceNode
 */
export async function fetchMetaAdsData(
  accountId: string,
  campaignId?: string,
  dateRange?: { start: string; end: string }
): Promise<MetaAdsData | null> {
  try {
    // Usar MCP meta-ads para buscar dados reais
    // Por enquanto, estrutura preparada para integração

    console.log('📊 Buscando dados Meta Ads:', { accountId, campaignId, dateRange });

    // TODO: Integrar com MCP meta-ads__get_insights
    // const insights = await mcp.metaAds.getInsights({
    //   accountId,
    //   campaignId,
    //   datePreset: 'last_30d',
    //   fields: ['impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpm', 'conversions']
    // });

    // Placeholder - será substituído pela integração real
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados Meta Ads:', error);
    return null;
  }
}

// =====================================================
// GOOGLE ANALYTICS 4 INTEGRATION
// =====================================================

export interface GA4PageData {
  pageTitle: string;
  pagePath: string;
  screenPageViews: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  engagementRate: number;
}

export interface GA4EventData {
  eventName: string;
  eventCount: number;
  totalUsers: number;
  eventValue?: number;
}

export interface GA4UTMData {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  users: number;
  conversions: number;
  revenue: number;
}

/**
 * Busca dados do GA4 para PageNodes
 */
export async function fetchGA4PageData(
  propertyId: string,
  pagePath?: string,
  dateRange?: { start: string; end: string }
): Promise<GA4PageData[] | null> {
  try {
    console.log('📊 Buscando dados GA4 Pages:', { propertyId, pagePath, dateRange });

    // TODO: Integrar com Google Analytics Data API
    // https://developers.google.com/analytics/devguides/reporting/data/v1

    return null;
  } catch (error) {
    console.error('Erro ao buscar dados GA4:', error);
    return null;
  }
}

/**
 * Busca dados de eventos do GA4 para ActionNodes
 */
export async function fetchGA4EventData(
  propertyId: string,
  eventName?: string,
  dateRange?: { start: string; end: string }
): Promise<GA4EventData[] | null> {
  try {
    console.log('📊 Buscando eventos GA4:', { propertyId, eventName, dateRange });

    // TODO: Integrar com Google Analytics Data API

    return null;
  } catch (error) {
    console.error('Erro ao buscar eventos GA4:', error);
    return null;
  }
}

/**
 * Busca dados de UTM do GA4
 */
export async function fetchGA4UTMData(
  propertyId: string,
  dateRange?: { start: string; end: string }
): Promise<GA4UTMData[] | null> {
  try {
    console.log('📊 Buscando UTMs GA4:', { propertyId, dateRange });

    // TODO: Integrar com Google Analytics Data API

    return null;
  } catch (error) {
    console.error('Erro ao buscar UTMs GA4:', error);
    return null;
  }
}

// =====================================================
// WEBHOOK / PIXEL TRACKING
// =====================================================

export interface WebhookEvent {
  eventType: 'pageview' | 'click' | 'conversion' | 'custom';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  data: {
    pagePath?: string;
    pageTitle?: string;
    eventName?: string;
    eventValue?: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

/**
 * Processa evento recebido via webhook
 */
export async function processWebhookEvent(
  flowId: string,
  event: WebhookEvent
): Promise<boolean> {
  try {
    console.log('📥 Processando webhook event:', event);

    // Salvar evento no Supabase
    const { error } = await supabase.from('flow_events').insert({
      flow_id: flowId,
      event_type: event.eventType,
      session_id: event.sessionId,
      user_id: event.userId,
      data: event.data,
      created_at: event.timestamp,
    });

    if (error) throw error;

    // Atualizar estatísticas dos nós relacionados
    await updateNodeStatsFromEvent(flowId, event);

    return true;
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return false;
  }
}

/**
 * Atualiza estatísticas dos nós baseado em eventos
 */
async function updateNodeStatsFromEvent(
  flowId: string,
  event: WebhookEvent
): Promise<void> {
  // Esta função seria chamada para atualizar os nós em tempo real
  // Incrementar contadores de visits, conversions, etc.

  // TODO: Implementar lógica de atualização
  console.log('📈 Atualizando stats do nó:', { flowId, event });
}

// =====================================================
// CSV IMPORT
// =====================================================

export interface CSVImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsSkipped: number;
  errors: string[];
}

/**
 * Importa dados de um CSV para atualizar nós
 */
export async function importCSVData(
  flowId: string,
  csvContent: string,
  mapping: Record<string, string>
): Promise<CSVImportResult> {
  try {
    console.log('📄 Importando CSV para flow:', flowId);

    // Parse CSV
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    let rowsProcessed = 0;
    let rowsSkipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      if (values.length !== headers.length) {
        rowsSkipped++;
        errors.push(`Linha ${i + 1}: número de colunas inválido`);
        continue;
      }

      // Criar objeto com dados mapeados
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        const mappedField = mapping[header];
        if (mappedField) {
          rowData[mappedField] = values[index];
        }
      });

      // TODO: Processar e atualizar nós com dados do CSV
      rowsProcessed++;
    }

    return {
      success: true,
      rowsProcessed,
      rowsSkipped,
      errors,
    };
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return {
      success: false,
      rowsProcessed: 0,
      rowsSkipped: 0,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
    };
  }
}

// =====================================================
// SINCRONIZAÇÃO DE NÓS
// =====================================================

/**
 * Sincroniza um SourceNode com dados reais
 */
export async function syncSourceNode(
  node: Node<SourceNodeData>,
  config: IntegrationConfig
): Promise<Node<SourceNodeData>> {
  const updatedNode = { ...node };

  switch (config.source) {
    case 'meta_ads':
      if (config.credentials?.accountId) {
        const metaData = await fetchMetaAdsData(config.credentials.accountId);
        if (metaData) {
          updatedNode.data = {
            ...updatedNode.data,
            visits: metaData.clicks,
            cost: metaData.spend,
            cpc: metaData.cpc,
            cpm: metaData.cpm,
          };
        }
      }
      break;

    case 'google_analytics':
      if (config.credentials?.propertyId) {
        const utmData = await fetchGA4UTMData(config.credentials.propertyId);
        if (utmData && utmData.length > 0) {
          const matchingUtm = utmData.find(
            u => u.source === updatedNode.data.utm_source
          );
          if (matchingUtm) {
            updatedNode.data = {
              ...updatedNode.data,
              visits: matchingUtm.sessions,
              uniqueVisitors: matchingUtm.users,
            };
          }
        }
      }
      break;

    // Outros casos...
  }

  return updatedNode;
}

/**
 * Sincroniza um PageNode com dados reais
 */
export async function syncPageNode(
  node: Node<PageNodeData>,
  config: IntegrationConfig
): Promise<Node<PageNodeData>> {
  const updatedNode = { ...node };

  if (config.source === 'google_analytics' && config.credentials?.propertyId) {
    const pageData = await fetchGA4PageData(
      config.credentials.propertyId,
      updatedNode.data.url
    );

    if (pageData && pageData.length > 0) {
      const matchingPage = pageData.find(
        p => p.pagePath === updatedNode.data.url
      );
      if (matchingPage) {
        updatedNode.data = {
          ...updatedNode.data,
          visitors: matchingPage.screenPageViews,
          uniqueVisitors: matchingPage.users,
          bounceRate: matchingPage.bounceRate,
          avgTimeOnPage: matchingPage.avgSessionDuration,
        };
      }
    }
  }

  return updatedNode;
}

/**
 * Sincroniza um ActionNode com dados reais
 */
export async function syncActionNode(
  node: Node<ActionNodeData>,
  config: IntegrationConfig
): Promise<Node<ActionNodeData>> {
  const updatedNode = { ...node };

  if (config.source === 'google_analytics' && config.credentials?.propertyId) {
    const eventData = await fetchGA4EventData(
      config.credentials.propertyId,
      updatedNode.data.label
    );

    if (eventData && eventData.length > 0) {
      const matchingEvent = eventData.find(
        e => e.eventName === updatedNode.data.label
      );
      if (matchingEvent) {
        updatedNode.data = {
          ...updatedNode.data,
          conversions: matchingEvent.eventCount,
          value: matchingEvent.eventValue,
        };
      }
    }
  }

  return updatedNode;
}

/**
 * Sincroniza todos os nós de um flow
 */
export async function syncAllNodes(
  nodes: Node[],
  config: IntegrationConfig
): Promise<{ nodes: Node[]; result: SyncResult }> {
  const updatedNodes: Node[] = [];
  let nodesUpdated = 0;

  for (const node of nodes) {
    let updatedNode = node;

    try {
      switch (node.type) {
        case 'funnelSource':
          updatedNode = await syncSourceNode(node as Node<SourceNodeData>, config);
          break;
        case 'funnelPage':
          updatedNode = await syncPageNode(node as Node<PageNodeData>, config);
          break;
        case 'funnelAction':
          updatedNode = await syncActionNode(node as Node<ActionNodeData>, config);
          break;
      }

      if (updatedNode !== node) {
        nodesUpdated++;
      }
    } catch (error) {
      console.error(`Erro ao sincronizar nó ${node.id}:`, error);
    }

    updatedNodes.push(updatedNode);
  }

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      source: config.source,
      nodesUpdated,
      syncedAt: new Date(),
    },
  };
}

// =====================================================
// GERADOR DE CÓDIGO DE PIXEL
// =====================================================

/**
 * Gera código do pixel para instalação no site do cliente
 */
export function generatePixelCode(flowId: string, webhookUrl: string): string {
  return `
<!-- Efeito Digital - Ads Flow Tracking Pixel -->
<script>
(function() {
  var FLOW_ID = '${flowId}';
  var WEBHOOK_URL = '${webhookUrl}';

  // Gerar Session ID
  var sessionId = sessionStorage.getItem('ef_session') ||
    'ef_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('ef_session', sessionId);

  // Extrair UTMs da URL
  var params = new URLSearchParams(window.location.search);
  var utmData = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term')
  };

  // Função para enviar evento
  window.efTrack = function(eventType, eventData) {
    var payload = {
      flowId: FLOW_ID,
      eventType: eventType,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      data: Object.assign({
        pagePath: window.location.pathname,
        pageTitle: document.title
      }, utmData, eventData || {})
    };

    // Enviar via Beacon API (não bloqueia)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEBHOOK_URL, JSON.stringify(payload));
    } else {
      // Fallback para fetch
      fetch(WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
  };

  // Rastrear pageview automaticamente
  efTrack('pageview');

  // Rastrear cliques em links com data-ef-track
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-ef-track]');
    if (el) {
      efTrack('click', {
        eventName: el.getAttribute('data-ef-track'),
        eventValue: el.getAttribute('data-ef-value')
      });
    }
  });

  console.log('✅ Efeito Digital Pixel inicializado - Flow:', FLOW_ID);
})();
</script>
<!-- Fim do Pixel -->
`.trim();
}

/**
 * Gera código para rastrear evento de conversão
 */
export function generateConversionCode(eventName: string, eventValue?: number): string {
  return `
<!-- Rastrear conversão: ${eventName} -->
<script>
  if (window.efTrack) {
    efTrack('conversion', {
      eventName: '${eventName}'${eventValue ? `,
      eventValue: ${eventValue}` : ''}
    });
  }
</script>
`.trim();
}
