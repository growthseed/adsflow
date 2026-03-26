/**
 * ============================================
 * CRM ENHANCED SERVICE
 * ============================================
 * Win rate analysis, pipeline forecast, loss reasons, deal velocity.
 * Uses Supabase views created in migration 014.
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface WinRateBySource {
  fonte: string;
  total_leads: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_days_to_close: number | null;
  total_revenue: number;
}

export interface PipelineForecast {
  etapa: string;
  deals: number;
  face_value: number;
  avg_probability: number;
  weighted_value: number;
  avg_days_in_stage: number | null;
}

export interface LossReason {
  categoria: string;
  count: number;
  percentage: number;
  label: string;
}

export interface DealVelocity {
  etapa: string;
  avg_days: number;
  transitions: number;
}

// Label map for motivo_perda_categoria
const LOSS_LABELS: Record<string, string> = {
  preco: 'Preço alto',
  concorrencia: 'Concorrência',
  timing: 'Timing inadequado',
  produto_inadequado: 'Produto inadequado',
  sem_resposta: 'Sem resposta',
  sem_orcamento: 'Sem orçamento',
  decisor_ausente: 'Decisor ausente',
  escolheu_outro: 'Escolheu outro',
  desistiu: 'Desistiu',
  outro: 'Outro',
};

// =====================================================
// SERVICE FUNCTIONS
// =====================================================

/**
 * Win rate analysis grouped by fonte (lead source).
 */
export async function getWinRateBySource(clientId: string): Promise<WinRateBySource[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('vw_win_rate_by_source')
    .select('*')
    .eq('client_id', clientId)
    .order('win_rate', { ascending: false });

  if (error) {
    console.error('[crmEnhanced] getWinRateBySource error:', error.message);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    fonte: String(r.fonte ?? 'Não informado'),
    total_leads: Number(r.total_leads ?? 0),
    wins: Number(r.wins ?? 0),
    losses: Number(r.losses ?? 0),
    win_rate: Number(r.win_rate ?? 0),
    avg_days_to_close: r.avg_days_to_close != null ? Number(r.avg_days_to_close) : null,
    total_revenue: Number(r.total_revenue ?? 0),
  }));
}

/**
 * Weighted pipeline forecast by stage.
 */
export async function getPipelineForecast(clientId: string): Promise<PipelineForecast[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('vw_pipeline_forecast')
    .select('*')
    .eq('client_id', clientId);

  if (error) {
    console.error('[crmEnhanced] getPipelineForecast error:', error.message);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    etapa: String(r.etapa ?? ''),
    deals: Number(r.deals ?? 0),
    face_value: Number(r.face_value ?? 0),
    avg_probability: Number(r.avg_probability ?? 0),
    weighted_value: Number(r.weighted_value ?? 0),
    avg_days_in_stage: r.avg_days_in_stage != null ? Number(r.avg_days_in_stage) : null,
  }));
}

/**
 * Loss reason breakdown using motivo_perda_categoria.
 */
export async function getLossReasonBreakdown(
  clientId: string,
  dateRange?: { from: string; to: string },
): Promise<LossReason[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('leads')
    .select('motivo_perda_categoria')
    .eq('client_id', clientId)
    .eq('resultado', 'perdido')
    .not('motivo_perda_categoria', 'is', null);

  if (dateRange) {
    query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to + 'T23:59:59');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[crmEnhanced] getLossReasonBreakdown error:', error.message);
    return [];
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  // Group by categoria
  const catMap = new Map<string, number>();
  rows.forEach((r: Record<string, unknown>) => {
    const cat = String(r.motivo_perda_categoria ?? 'outro');
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  });

  const total = rows.length;

  return Array.from(catMap.entries())
    .map(([categoria, count]) => ({
      categoria,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      label: LOSS_LABELS[categoria] || categoria,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Deal velocity: average days per funnel stage using historico_funil.
 */
export async function getDealVelocityByStage(clientId: string): Promise<DealVelocity[]> {
  if (!isSupabaseConfigured) return [];

  // Fetch historico_funil entries for leads belonging to this client
  const { data, error } = await supabase
    .from('historico_funil')
    .select(`
      etapa_anterior,
      etapa_nova,
      data_transicao,
      lead_id,
      leads!inner(client_id)
    `)
    .eq('leads.client_id', clientId)
    .order('data_transicao', { ascending: true });

  if (error) {
    console.error('[crmEnhanced] getDealVelocityByStage error:', error.message);
    return [];
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  // Group transitions by lead, calculate time per stage
  const leadTransitions = new Map<string, Array<{ etapa: string; date: Date }>>();
  for (const r of rows as Record<string, unknown>[]) {
    const leadId = String(r.lead_id ?? '');
    const arr = leadTransitions.get(leadId) || [];
    arr.push({
      etapa: String(r.etapa_nova ?? ''),
      date: new Date(String(r.data_transicao)),
    });
    leadTransitions.set(leadId, arr);
  }

  // Calculate average time per stage
  const stageTime = new Map<string, { totalDays: number; count: number }>();

  for (const [, transitions] of leadTransitions) {
    for (let i = 0; i < transitions.length - 1; i++) {
      const stage = transitions[i].etapa;
      const days = (transitions[i + 1].date.getTime() - transitions[i].date.getTime()) / 86400000;
      const existing = stageTime.get(stage) || { totalDays: 0, count: 0 };
      existing.totalDays += days;
      existing.count++;
      stageTime.set(stage, existing);
    }
  }

  return Array.from(stageTime.entries()).map(([etapa, d]) => ({
    etapa,
    avg_days: d.count > 0 ? Math.round((d.totalDays / d.count) * 10) / 10 : 0,
    transitions: d.count,
  }));
}
