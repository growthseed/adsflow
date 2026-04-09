import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Lead,
  Oportunidade,
  Vendedor,
  KPICardData,
  FunnelData,
  TimeSeriesData,
  ResponsavelStats,
  PerdasPorFonte,
  PerdasPorEtapa,
  DateRange,
  BIFilterState,
  LeadStatusFunil,
} from '@/types/bi';
import {
  calculatePercentageChange,
  getFunnelStatusColor,
} from '@/types/bi';
import { startOfMonth, endOfMonth, subMonths, subYears, format, parseISO } from 'date-fns';

// =====================================================
// HOOK: useLeads
// =====================================================
export function useLeads(filters?: BIFilterState) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    // Se Supabase não está configurado, retorna vazio
    if (!isSupabaseConfigured) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('leads')
        .select('*, vendedor:vendedores(*)')
        .order('created_at', { ascending: false });

      // Multi-tenant: filter by active client
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.startDate.toISOString())
          .lte('created_at', filters.dateRange.endDate.toISOString());
      }

      if (filters?.vendedorId) {
        query = query.eq('vendedor_id', filters.vendedorId);
      }

      if (filters?.statusFunil && filters.statusFunil.length > 0) {
        query = query.in('status_funil', filters.statusFunil);
      }

      if (filters?.fonte && filters.fonte.length > 0) {
        query = query.in('fonte', filters.fonte);
      }

      if (filters?.resultado && filters.resultado.length > 0) {
        query = query.in('resultado', filters.resultado);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, isLoading, error, refetch: fetchLeads };
}

// =====================================================
// HOOK: useOportunidades
// =====================================================
export function useOportunidades(filters?: BIFilterState) {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOportunidades = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setOportunidades([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('oportunidades')
        .select('*, vendedor:vendedores(*), lead:leads(*)')
        .order('created_at', { ascending: false });

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.startDate.toISOString())
          .lte('created_at', filters.dateRange.endDate.toISOString());
      }

      if (filters?.vendedorId) {
        query = query.eq('vendedor_id', filters.vendedorId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setOportunidades(data || []);
    } catch (err) {
      console.error('Error fetching oportunidades:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar oportunidades');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOportunidades();
  }, [fetchOportunidades]);

  return { oportunidades, isLoading, error, refetch: fetchOportunidades };
}

// =====================================================
// HOOK: useVendedores
// =====================================================
export function useVendedores(clientId?: string) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendedores = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setVendedores([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let query = supabase
        .from('vendedores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setVendedores(data || []);
    } catch (err) {
      console.error('Error fetching vendedores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedores');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  return { vendedores, isLoading, error, refetch: fetchVendedores };
}

// =====================================================
// HOOK: useKPIs
// =====================================================
export function useKPIs(dateRange: DateRange, clientId?: string) {
  const [kpis, setKPIs] = useState<KPICardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate comparison periods
  const lastMonthRange = useMemo(() => ({
    startDate: startOfMonth(subMonths(dateRange.startDate, 1)),
    endDate: endOfMonth(subMonths(dateRange.startDate, 1)),
  }), [dateRange]);

  const lastYearRange = useMemo(() => ({
    startDate: subYears(dateRange.startDate, 1),
    endDate: subYears(dateRange.endDate, 1),
  }), [dateRange]);

  const fetchKPIs = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setKPIs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Helper: build leads query with optional client filter
      const leadsQuery = (start: Date, end: Date) => {
        let q = supabase.from('leads').select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        if (clientId) q = q.eq('client_id', clientId);
        return q;
      };

      // Fetch current period leads
      const { data: currentLeads } = await leadsQuery(dateRange.startDate, dateRange.endDate);

      // Fetch last month leads
      const { data: lastMonthLeads } = await leadsQuery(lastMonthRange.startDate, lastMonthRange.endDate);

      // Fetch last year leads
      const { data: lastYearLeads } = await leadsQuery(lastYearRange.startDate, lastYearRange.endDate);

      // Fetch current period opportunities
      let oppsQuery = supabase.from('oportunidades').select('*')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
      if (clientId) oppsQuery = oppsQuery.eq('client_id', clientId);
      const { data: currentOpps } = await oppsQuery;

      // Calculate metrics
      const current = {
        leads: currentLeads?.length || 0,
        vendas: currentLeads?.filter(l => l.resultado === 'vendido').length || 0,
        perdas: currentLeads?.filter(l => l.resultado === 'perdido').length || 0,
        abertos: currentLeads?.filter(l => l.resultado === 'aberto').length || 0,
        oportunidades: currentOpps?.length || 0,
      };

      const lastMonth = {
        leads: lastMonthLeads?.length || 0,
        vendas: lastMonthLeads?.filter(l => l.resultado === 'vendido').length || 0,
        perdas: lastMonthLeads?.filter(l => l.resultado === 'perdido').length || 0,
        oportunidades: 0,
      };

      const lastYear = {
        leads: lastYearLeads?.length || 0,
        vendas: lastYearLeads?.filter(l => l.resultado === 'vendido').length || 0,
        perdas: lastYearLeads?.filter(l => l.resultado === 'perdido').length || 0,
        oportunidades: 0,
      };

      setKPIs([
        {
          title: 'Leads',
          value: current.leads,
          format: 'number',
          color: 'blue',
          lastMonth: {
            value: lastMonth.leads,
            percentageChange: calculatePercentageChange(current.leads, lastMonth.leads),
          },
          lastYear: {
            value: lastYear.leads,
            percentageChange: calculatePercentageChange(current.leads, lastYear.leads),
          },
        },
        {
          title: 'Oportunidades',
          value: current.oportunidades,
          format: 'number',
          color: 'purple',
          lastMonth: {
            value: lastMonth.oportunidades,
            percentageChange: calculatePercentageChange(current.oportunidades, lastMonth.oportunidades),
          },
          lastYear: {
            value: lastYear.oportunidades,
            percentageChange: calculatePercentageChange(current.oportunidades, lastYear.oportunidades),
          },
        },
        {
          title: 'Vendas',
          value: current.vendas,
          format: 'number',
          color: 'green',
          lastMonth: {
            value: lastMonth.vendas,
            percentageChange: calculatePercentageChange(current.vendas, lastMonth.vendas),
          },
          lastYear: {
            value: lastYear.vendas,
            percentageChange: calculatePercentageChange(current.vendas, lastYear.vendas),
          },
        },
        {
          title: 'Perdas',
          value: current.perdas,
          format: 'number',
          color: 'red',
          lastMonth: {
            value: lastMonth.perdas,
            percentageChange: calculatePercentageChange(current.perdas, lastMonth.perdas),
          },
          lastYear: {
            value: lastYear.perdas,
            percentageChange: calculatePercentageChange(current.perdas, lastYear.perdas),
          },
        },
        {
          title: 'Abertos',
          value: current.abertos,
          format: 'number',
          color: 'yellow',
        },
      ]);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, lastMonthRange, lastYearRange, clientId]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return { kpis, isLoading, refetch: fetchKPIs };
}

// =====================================================
// HOOK: useFunnelData
// =====================================================
export function useFunnelData(leads: Lead[]): FunnelData {
  return useMemo(() => {
    const statusOrder: LeadStatusFunil[] = [
      'Sem contato',
      'Contato feito',
      'Identificação do interesse',
      'Aguardando documento',
      'Contrato fechado',
    ];

    const total = leads.length;
    const stages = statusOrder.map(status => {
      const count = leads.filter(l => l.status_funil === status).length;
      return {
        name: status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: getFunnelStatusColor(status),
      };
    });

    const finalConversions = leads.filter(l => l.resultado === 'vendido').length;

    return {
      stages,
      totalEntries: total,
      finalConversions,
      overallConversionRate: total > 0 ? (finalConversions / total) * 100 : 0,
    };
  }, [leads]);
}

// =====================================================
// HOOK: useTimeSeriesData
// =====================================================
export function useTimeSeriesData(leads: Lead[]): TimeSeriesData[] {
  return useMemo(() => {
    // Group leads by month
    const monthlyData: Record<string, number> = {};

    leads.forEach(lead => {
      const date = parseISO(lead.created_at);
      const monthKey = format(date, 'yyyy-MM');
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Sort and convert to array
    const sortedMonths = Object.keys(monthlyData).sort();
    const data = sortedMonths.map(month => ({
      date: month,
      value: monthlyData[month],
      label: format(parseISO(`${month}-01`), 'MMM/yy'),
    }));

    return [
      {
        name: 'Leads por Mês',
        data,
        color: '#3B82F6',
      },
    ];
  }, [leads]);
}

// =====================================================
// HOOK: useResponsavelStats
// =====================================================
export function useResponsavelStats(leads: Lead[], vendedores: Vendedor[]): ResponsavelStats[] {
  return useMemo(() => {
    const statsMap: Record<string, ResponsavelStats> = {};

    // Initialize stats for all vendedores
    vendedores.forEach(v => {
      statsMap[v.id] = {
        vendedor_id: v.id,
        vendedor_nome: v.nome,
        leads: 0,
        oportunidades: 0,
        vendas: 0,
        perdas: 0,
        abertos: 0,
        valor_total: 0,
        taxa_conversao: 0,
      };
    });

    // Count leads by vendedor
    leads.forEach(lead => {
      if (lead.vendedor_id && statsMap[lead.vendedor_id]) {
        const stats = statsMap[lead.vendedor_id];
        stats.leads++;

        switch (lead.resultado) {
          case 'vendido':
            stats.vendas++;
            stats.valor_total += lead.valor_fechado || lead.valor_estimado || 0;
            break;
          case 'perdido':
            stats.perdas++;
            break;
          case 'aberto':
            stats.abertos++;
            break;
        }
      }
    });

    // Calculate conversion rates
    Object.values(statsMap).forEach(stats => {
      stats.taxa_conversao = stats.leads > 0
        ? (stats.vendas / stats.leads) * 100
        : 0;
    });

    return Object.values(statsMap).filter(s => s.leads > 0);
  }, [leads, vendedores]);
}

// =====================================================
// HOOK: usePerdasAnalysis
// =====================================================
export function usePerdasAnalysis(leads: Lead[]) {
  return useMemo(() => {
    const perdasLeads = leads.filter(l => l.resultado === 'perdido');
    const totalPerdas = perdasLeads.length;

    // Por Fonte
    const porFonte: Record<string, number> = {};
    perdasLeads.forEach(lead => {
      const fonte = lead.fonte || 'Não informado';
      porFonte[fonte] = (porFonte[fonte] || 0) + 1;
    });

    const perdasPorFonte: PerdasPorFonte[] = Object.entries(porFonte)
      .map(([fonte, count]) => ({
        fonte,
        count,
        percentage: totalPerdas > 0 ? (count / totalPerdas) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Por Etapa
    const porEtapa: Record<string, number> = {};
    perdasLeads.forEach(lead => {
      const etapa = lead.status_funil || 'Não informado';
      porEtapa[etapa] = (porEtapa[etapa] || 0) + 1;
    });

    const perdasPorEtapa: PerdasPorEtapa[] = Object.entries(porEtapa)
      .map(([etapa, count]) => ({
        etapa,
        count,
        percentage: totalPerdas > 0 ? (count / totalPerdas) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalPerdas,
      perdasPorFonte,
      perdasPorEtapa,
    };
  }, [leads]);
}

// =====================================================
// HOOK: useBIFilters
// =====================================================
export function useBIFilters(clientId?: string) {
  const [filters, setFilters] = useState<BIFilterState>({
    dateRange: {
      startDate: startOfMonth(new Date()),
      endDate: new Date(),
    },
    clientId,
  });

  // Keep clientId in sync with the active client. The rest of the filter
  // object (dateRange, vendedorId, statusFunil) must be preserved on client
  // switch, so we can't simply derive the whole object.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(prev => ({ ...prev, clientId }));
  }, [clientId]);

  const updateDateRange = useCallback((range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);

  const updateVendedor = useCallback((vendedorId?: string) => {
    setFilters(prev => ({ ...prev, vendedorId }));
  }, []);

  const updateStatusFunil = useCallback((status?: LeadStatusFunil[]) => {
    setFilters(prev => ({ ...prev, statusFunil: status }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        startDate: startOfMonth(new Date()),
        endDate: new Date(),
      },
    });
  }, []);

  return {
    filters,
    updateDateRange,
    updateVendedor,
    updateStatusFunil,
    resetFilters,
  };
}
