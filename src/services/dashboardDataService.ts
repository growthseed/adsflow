/**
 * ============================================
 * DASHBOARD DATA SERVICE
 * ============================================
 * Central dispatcher that fetches data for each widget
 * based on its DataSourceConfig and the dashboard's global filters.
 *
 * Reuses existing services:
 * - insightsService for Meta/Google Ads data
 * - Supabase queries for BI (leads, vendedores, oportunidades)
 * - Demo data for ecommerce (until real integration)
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import { insightsService } from './metaAdsService';
import type { DataSourceConfig, DashboardGlobalFilters, WidgetType, WidgetConfig } from '@/types/dashboard';
import type { DatePreset } from '@/types/reports';

// =====================================================
// TYPES
// =====================================================

export interface WidgetDataResult {
  rows: Record<string, unknown>[];
  totals: Record<string, number>;
  value?: number;           // for KPI cards
  previousValue?: number;   // for KPI trend
}

// =====================================================
// DATE RESOLUTION
// =====================================================

function resolveDate(preset: DatePreset, custom?: { startDate: string; endDate: string }): { from: string; to: string } {
  if (preset === 'custom' && custom) {
    return { from: custom.startDate, to: custom.endDate };
  }

  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let daysBack = 30;

  switch (preset) {
    case 'today': daysBack = 0; break;
    case 'yesterday': daysBack = 1; break;
    case 'last_7d': daysBack = 7; break;
    case 'last_14d': daysBack = 14; break;
    case 'last_30d': daysBack = 30; break;
    case 'last_90d': daysBack = 90; break;
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { from, to };
    }
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: lastMonth.toISOString().split('T')[0], to: endOfLastMonth.toISOString().split('T')[0] };
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return { from: new Date(now.getFullYear(), q, 1).toISOString().split('T')[0], to };
    }
    case 'this_year': {
      return { from: `${now.getFullYear()}-01-01`, to };
    }
    case 'last_year': {
      return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
    }
    default: daysBack = 30;
  }

  const from = new Date(now);
  from.setDate(from.getDate() - daysBack);
  return { from: from.toISOString().split('T')[0], to };
}

function getPreviousPeriodDates(from: string, to: string): { from: string; to: string } {
  const start = new Date(from);
  const end = new Date(to);
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return { from: prevStart.toISOString().split('T')[0], to: prevEnd.toISOString().split('T')[0] };
}

// =====================================================
// MAIN DISPATCHER
// =====================================================

export async function fetchWidgetData(
  widgetType: WidgetType,
  dataSource: DataSourceConfig,
  config: WidgetConfig,
  globalFilters: DashboardGlobalFilters,
): Promise<WidgetDataResult> {
  // Resolve date range (per-widget override or global)
  const dateConfig = dataSource.dateOverride ?? { preset: globalFilters.datePreset, customRange: globalFilters.customRange };
  const { from, to } = resolveDate(dateConfig.preset, dateConfig.customRange);

  switch (dataSource.type) {
    case 'meta_ads':
    case 'google_ads':
      return fetchAdsData(widgetType, dataSource, config, from, to, globalFilters);

    case 'bi_leads':
      return fetchBILeadsData(widgetType, dataSource, config, from, to, globalFilters.clientId);

    case 'bi_vendedores':
      return fetchBIVendedoresData(dataSource, from, to, globalFilters.clientId);

    case 'bi_oportunidades':
      return fetchBIOportunidadesData(widgetType, from, to, globalFilters.clientId);

    case 'ecommerce':
      return fetchEcommerceData(widgetType, dataSource, config, from, to, globalFilters.clientId);

    case 'manual':
      return { rows: [], totals: {} };

    default:
      return { rows: [], totals: {} };
  }
}

// =====================================================
// ADS DATA (Meta + Google — same table structure)
// =====================================================

async function fetchAdsData(
  widgetType: WidgetType,
  dataSource: DataSourceConfig,
  config: WidgetConfig,
  dateFrom: string,
  dateTo: string,
  globalFilters: DashboardGlobalFilters,
): Promise<WidgetDataResult> {
  const accountId = dataSource.accountId || globalFilters.accountIds?.[0];
  if (!accountId) return { rows: [], totals: {} };

  const filters = {
    adAccountId: accountId,
    dateFrom,
    dateTo,
    campaignIds: dataSource.campaignIds,
  };

  // KPI Card: return single aggregated value
  if (widgetType === 'kpi_card' && config.type === 'kpi_card') {
    const agg = await insightsService.getAggregatedMetrics(filters);
    const metric = config.kpi.metric;
    const value = (agg as unknown as Record<string, number>)[metric] ?? 0;

    // Get previous period for trend
    let previousValue: number | undefined;
    if (config.kpi.showTrend) {
      const prev = getPreviousPeriodDates(dateFrom, dateTo);
      const prevAgg = await insightsService.getAggregatedMetrics({
        ...filters,
        dateFrom: prev.from,
        dateTo: prev.to,
      });
      previousValue = (prevAgg as unknown as Record<string, number>)[metric] ?? 0;
    }

    return { rows: [], totals: { [metric]: value }, value, previousValue };
  }

  // Gauge: same as KPI but single value
  if (widgetType === 'gauge' && config.type === 'gauge') {
    const agg = await insightsService.getAggregatedMetrics(filters);
    const value = (agg as unknown as Record<string, number>)[config.gauge.metric] ?? 0;
    return { rows: [], totals: {}, value };
  }

  // Time-series charts (line, area): daily metrics
  if ((widgetType === 'line_chart' || widgetType === 'area_chart') && dataSource.groupBy === 'day') {
    const daily = await insightsService.getDailyMetrics(filters);
    return { rows: daily, totals: {} };
  }

  // Bar/Pie/Donut grouped by campaign: top campaigns
  if (dataSource.groupBy === 'campaign') {
    const top = await insightsService.getTopCampaigns(filters, 'spend', 20);
    return {
      rows: top,
      totals: top.reduce((acc, r) => {
        for (const key of Object.keys(r)) {
          if (typeof (r as unknown as Record<string, unknown>)[key] === 'number') {
            acc[key] = (acc[key] || 0) + ((r as unknown as Record<string, number>)[key] || 0);
          }
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Creative data
  if (dataSource.groupBy === 'creative') {
    const creatives = await insightsService.getTopCreatives(filters, 20);
    return { rows: creatives, totals: {} };
  }

  // Table: campaign breakdown
  if (widgetType === 'table') {
    const top = await insightsService.getTopCampaigns(filters, 'spend', 50);
    return { rows: top, totals: {} };
  }

  // Fallback: aggregated
  const agg = await insightsService.getAggregatedMetrics(filters);
  return { rows: [agg as unknown as Record<string, unknown>], totals: agg as unknown as Record<string, number> };
}

// =====================================================
// BI LEADS
// =====================================================

async function fetchBILeadsData(
  widgetType: WidgetType,
  dataSource: DataSourceConfig,
  config: WidgetConfig,
  dateFrom: string,
  dateTo: string,
  clientId?: string,
): Promise<WidgetDataResult> {
  if (!isSupabaseConfigured) return { rows: [], totals: {} };

  let query = supabase
    .from('leads')
    .select('*, vendedor:vendedores(nome)')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59');

  if (clientId) query = query.eq('client_id', clientId);

  const { data: leads } = await query;
  if (!leads || leads.length === 0) return { rows: [], totals: {}, value: 0 };

  const total = leads.length;
  const vendas = leads.filter((l: any) => l.resultado === 'vendido');
  const perdas = leads.filter((l: any) => l.resultado === 'perdido');
  const abertos = leads.filter((l: any) => l.resultado === 'aberto');

  const totals: Record<string, number> = {
    total_leads: total,
    vendas: vendas.length,
    perdas: perdas.length,
    abertos: abertos.length,
    taxa_conversao: total > 0 ? (vendas.length / total) * 100 : 0,
    ticket_medio: vendas.length > 0
      ? vendas.reduce((s: number, l: any) => s + (l.valor_fechado || l.valor_estimado || 0), 0) / vendas.length
      : 0,
    valor_pipeline: abertos.reduce((s: number, l: any) => s + (l.valor_estimado || 0), 0),
    tempo_medio_fechamento: vendas.length > 0
      ? Math.round(vendas.reduce((s: number, l: any) => s + (l.dias_ciclo || 0), 0) / vendas.length)
      : 0,
  };

  // KPI card
  if (widgetType === 'kpi_card' && config.type === 'kpi_card') {
    const value = totals[config.kpi.metric] ?? 0;

    // Get previous period
    let previousValue: number | undefined;
    if (config.kpi.showTrend) {
      const prev = getPreviousPeriodDates(dateFrom, dateTo);
      const prevResult = await fetchBILeadsData(widgetType, dataSource, config, prev.from, prev.to, clientId);
      previousValue = prevResult.value;
    }

    return { rows: [], totals, value, previousValue };
  }

  // Group by status_funil (for funnel charts)
  if (dataSource.groupBy === 'status_funil') {
    const stages = ['Sem contato', 'Contato feito', 'Identificação do interesse', 'Aguardando documento', 'Contrato fechado'];
    const rows = stages.map((status) => ({
      status,
      name: status,
      count: leads.filter((l: any) => l.status_funil === status).length,
      value: leads.filter((l: any) => l.status_funil === status).length,
    }));
    return { rows, totals };
  }

  // Group by fonte
  if (dataSource.groupBy === 'fonte') {
    const fonteMap = new Map<string, number>();
    leads.forEach((l: any) => {
      const fonte = l.fonte || 'Não informado';
      fonteMap.set(fonte, (fonteMap.get(fonte) || 0) + 1);
    });
    const rows = Array.from(fonteMap.entries()).map(([name, value]) => ({ name, value, count: value }));
    return { rows: rows.sort((a, b) => b.value - a.value), totals };
  }

  // Group by motivo_perda
  if (dataSource.groupBy === 'motivo_perda') {
    const motivoMap = new Map<string, number>();
    perdas.forEach((l: any) => {
      const motivo = l.motivo_perda || 'Não informado';
      motivoMap.set(motivo, (motivoMap.get(motivo) || 0) + 1);
    });
    const rows = Array.from(motivoMap.entries()).map(([name, value]) => ({ name, value }));
    return { rows: rows.sort((a, b) => b.value - a.value), totals };
  }

  // Group by month (time series)
  if (dataSource.groupBy === 'month') {
    const monthMap = new Map<string, { leads: number; vendas: number }>();
    leads.forEach((l: any) => {
      const month = l.created_at?.slice(0, 7) || 'unknown';
      const existing = monthMap.get(month) || { leads: 0, vendas: 0 };
      existing.leads++;
      if (l.resultado === 'vendido') existing.vendas++;
      monthMap.set(month, existing);
    });
    const rows = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, date: month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
    return { rows, totals };
  }

  // Group by cohort (month of entry → conversion rate)
  if (dataSource.groupBy === 'cohort') {
    const cohortMap = new Map<string, { leads: number; vendas: number }>();
    leads.forEach((l: any) => {
      const cohort = l.created_at?.slice(0, 7) || 'unknown';
      const existing = cohortMap.get(cohort) || { leads: 0, vendas: 0 };
      existing.leads++;
      if (l.resultado === 'vendido') existing.vendas++;
      cohortMap.set(cohort, existing);
    });
    const rows = Array.from(cohortMap.entries())
      .map(([cohort, data]) => ({
        cohort,
        name: cohort,
        leads: data.leads,
        vendas: data.vendas,
        taxa_conversao: data.leads > 0 ? (data.vendas / data.leads) * 100 : 0,
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort));
    return { rows, totals };
  }

  // Default: return raw leads for table
  const rows = leads.map((l: any) => ({
    ...l,
    vendedor_nome: l.vendedor?.nome || 'Sem vendedor',
  }));
  return { rows, totals };
}

// =====================================================
// BI VENDEDORES
// =====================================================

async function fetchBIVendedoresData(
  _dataSource: DataSourceConfig,
  dateFrom: string,
  dateTo: string,
  clientId?: string,
): Promise<WidgetDataResult> {
  if (!isSupabaseConfigured) return { rows: [], totals: {} };

  // Fetch leads with vendedor
  let query = supabase
    .from('leads')
    .select('vendedor_id, resultado, valor_fechado, valor_estimado, dias_ciclo, vendedor:vendedores(id, nome)')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59');

  if (clientId) query = query.eq('client_id', clientId);

  const { data: leads } = await query;
  if (!leads) return { rows: [], totals: {} };

  // Aggregate by vendedor
  const vendedorMap = new Map<string, {
    vendedor_nome: string;
    leads: number; oportunidades: number; vendas: number; perdas: number; abertos: number;
    taxa_conversao: number; valor_total: number; tempo_medio: number;
    _dias_total: number; _vendas_count: number;
  }>();

  leads.forEach((l: any) => {
    const vid = l.vendedor_id || 'sem_vendedor';
    const vname = l.vendedor?.nome || 'Sem vendedor';
    const existing = vendedorMap.get(vid) || {
      vendedor_nome: vname, leads: 0, oportunidades: 0, vendas: 0, perdas: 0, abertos: 0,
      taxa_conversao: 0, valor_total: 0, tempo_medio: 0, _dias_total: 0, _vendas_count: 0,
    };
    existing.leads++;
    if (l.resultado === 'vendido') {
      existing.vendas++;
      existing.valor_total += l.valor_fechado || l.valor_estimado || 0;
      existing._vendas_count++;
      existing._dias_total += l.dias_ciclo || 0;
    }
    if (l.resultado === 'perdido') existing.perdas++;
    if (l.resultado === 'aberto') existing.abertos++;
    vendedorMap.set(vid, existing);
  });

  const rows = Array.from(vendedorMap.values()).map((v) => ({
    ...v,
    taxa_conversao: v.leads > 0 ? (v.vendas / v.leads) * 100 : 0,
    tempo_medio: v._vendas_count > 0 ? Math.round(v._dias_total / v._vendas_count) : 0,
  }));

  return { rows: rows.sort((a, b) => b.vendas - a.vendas), totals: {} };
}

// =====================================================
// BI OPORTUNIDADES
// =====================================================

async function fetchBIOportunidadesData(
  widgetType: WidgetType,
  dateFrom: string,
  dateTo: string,
  clientId?: string,
): Promise<WidgetDataResult> {
  if (!isSupabaseConfigured) return { rows: [], totals: {}, value: 0 };

  let query = supabase
    .from('oportunidades')
    .select('*')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59');

  if (clientId) query = query.eq('client_id', clientId);

  const { data: opps } = await query;
  if (!opps) return { rows: [], totals: {}, value: 0 };

  const total = opps.length;
  const abertas = opps.filter((o: any) => o.resultado === 'aberta');
  const ganhas = opps.filter((o: any) => o.resultado === 'ganha');

  const totals: Record<string, number> = {
    oportunidades: total,
    abertas: abertas.length,
    ganhas: ganhas.length,
    valor_pipeline: abertas.reduce((s: number, o: any) => s + (o.valor || 0) * ((o.probabilidade || 50) / 100), 0),
  };

  if (widgetType === 'kpi_card') {
    return { rows: [], totals, value: total };
  }

  return { rows: opps, totals };
}

// =====================================================
// E-COMMERCE (real data from Supabase)
// =====================================================

async function fetchEcommerceData(
  widgetType: WidgetType,
  dataSource: DataSourceConfig,
  config: WidgetConfig,
  dateFrom?: string,
  dateTo?: string,
  clientId?: string,
): Promise<WidgetDataResult> {
  if (!isSupabaseConfigured || !clientId) return { rows: [], totals: {} };

  const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;

  // Fetch revenue summary
  const { getRevenueSummary, getProductABC, getGeographicDistribution, getEcommerceTotals } = await import('./ecommerceService');

  const [revenueSummary, ecommTotals] = await Promise.all([
    getRevenueSummary(clientId, dateRange),
    getEcommerceTotals(clientId, dateRange),
  ]);

  const totals: Record<string, number> = {
    receita: ecommTotals.revenue,
    pedidos: ecommTotals.orders,
    ticket_medio: ecommTotals.avg_ticket,
    novos_clientes: ecommTotals.new_customers,
    cac: ecommTotals.cac,
    ltv: ecommTotals.ltv,
  };

  // KPI
  if (widgetType === 'kpi_card' && config.type === 'kpi_card') {
    const value = totals[config.kpi.metric] ?? 0;
    return { rows: [], totals, value };
  }

  // Gauge
  if (widgetType === 'gauge') {
    return { rows: [], totals, value: totals.receita };
  }

  // By month
  if (dataSource.groupBy === 'month') {
    const rows = revenueSummary.map((r) => ({
      month: r.month,
      date: r.month,
      receita: r.revenue,
      pedidos: r.approved_orders,
    }));
    return { rows, totals };
  }

  // By product
  if (dataSource.groupBy === 'product') {
    const products = await getProductABC(clientId);
    const rows = products.map((p) => ({
      product_name: p.product_name,
      name: p.product_name,
      vendas: p.total_units,
      receita: p.total_revenue,
      curva: p.abc_class,
    }));
    return { rows, totals };
  }

  // By estado
  if (dataSource.groupBy === 'estado') {
    const geo = await getGeographicDistribution(clientId);
    const rows = geo.map((g) => ({
      estado: g.shipping_state,
      name: g.shipping_state,
      pedidos: g.orders,
      receita: g.revenue,
      value: g.revenue,
    }));
    return { rows, totals };
  }

  // Default: revenue summary
  const rows = revenueSummary.map((r) => ({
    month: r.month,
    date: r.month,
    receita: r.revenue,
    pedidos: r.approved_orders,
  }));
  return { rows, totals };
}
