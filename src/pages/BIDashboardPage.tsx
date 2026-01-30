import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  XCircle,
  Home,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';

// Components
import { KPICard, FunnelChart, LeadsLineChart, ResponsavelTable, PerdasChart } from '@/components/BI';
import DateRangeSelector from '@/components/UI/DateRangeSelector';

// Hooks
import {
  useLeads,
  useVendedores,
  useKPIs,
  useFunnelData,
  useTimeSeriesData,
  useResponsavelStats,
  usePerdasAnalysis,
  useBIFilters,
} from '@/hooks/useBI';

// Types
import type { BIPageType } from '@/types/bi';

const BIDashboardPage: React.FC = () => {
  const [activePage, setActivePage] = useState<BIPageType>('funil');

  // Filters
  const { filters, updateDateRange, updateVendedor, resetFilters } = useBIFilters();

  // Data hooks
  const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeads(filters);
  const { vendedores } = useVendedores();
  const { kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useKPIs(filters.dateRange);

  // Derived data
  const funnelData = useFunnelData(leads);
  const timeSeriesData = useTimeSeriesData(leads);
  const responsavelStats = useResponsavelStats(leads, vendedores);
  const { totalPerdas, perdasPorFonte, perdasPorEtapa } = usePerdasAnalysis(leads);

  const isLoading = leadsLoading || kpisLoading;

  const handleRefresh = () => {
    refetchLeads();
    refetchKPIs();
  };

  // Navigation items
  const navItems = [
    { id: 'funil' as BIPageType, label: 'Análise de Funil', icon: BarChart3 },
    { id: 'variacoes' as BIPageType, label: 'Variações', icon: TrendingUp },
    { id: 'tempo' as BIPageType, label: 'Tempo de Fechamento', icon: Clock },
    { id: 'perdas' as BIPageType, label: 'Análise de Perdas', icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Ads Flow</span>
              </Link>

              <div className="h-6 w-px bg-gray-300" />

              <h1 className="text-xl font-bold text-gray-900">
                Dashboard B.I.
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <DateRangeSelector
                value={filters.dateRange}
                onChange={updateDateRange}
              />

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.vendedorId || ''}
                onChange={(e) => updateVendedor(e.target.value || undefined)}
              >
                <option value="">Todos os vendedores</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpar filtros"
              >
                <Filter className="w-5 h-5" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                           disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex gap-1 -mb-px">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activePage === item.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Carregando dados...</span>
            </div>
          </div>
        )}

        {/* Page 1: Análise de Funil */}
        {!isLoading && activePage === 'funil' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {kpis.map((kpi, index) => (
                <KPICard key={index} data={kpi} />
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsLineChart
                data={timeSeriesData}
                title="Leads por Mês/Ano"
              />
              <FunnelChart
                data={funnelData}
                title="Funil de Vendas"
              />
            </div>

            {/* Responsável Table */}
            <ResponsavelTable
              data={responsavelStats}
              title="Performance por Responsável"
            />
          </div>
        )}

        {/* Page 2: Variações */}
        {!isLoading && activePage === 'variacoes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Análise de Variações
              </h3>
              <p className="text-gray-500">
                Compare diferentes períodos e segmentos. Use os filtros acima para
                analisar variações específicas.
              </p>
            </div>

            {/* Same KPIs but with different filter context */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {kpis.map((kpi, index) => (
                <KPICard key={index} data={kpi} />
              ))}
            </div>

            <LeadsLineChart
              data={timeSeriesData}
              title="Evolução Temporal"
              height={400}
            />
          </div>
        )}

        {/* Page 3: Tempo de Fechamento */}
        {!isLoading && activePage === 'tempo' && (
          <div className="space-y-6">
            {/* Time KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                data={{
                  title: 'Tempo Médio de Vendas',
                  value: leads.filter(l => l.resultado === 'vendido').length > 0
                    ? Math.round(
                        leads
                          .filter(l => l.resultado === 'vendido' && l.dias_ciclo)
                          .reduce((sum, l) => sum + (l.dias_ciclo || 0), 0) /
                        leads.filter(l => l.resultado === 'vendido' && l.dias_ciclo).length
                      )
                    : 0,
                  format: 'days',
                  color: 'blue',
                }}
              />
              <KPICard
                data={{
                  title: 'Taxa Opt > Vendas',
                  value: leads.length > 0
                    ? (leads.filter(l => l.resultado === 'vendido').length / leads.length) * 100
                    : 0,
                  format: 'percentage',
                  color: 'green',
                }}
              />
              <KPICard
                data={{
                  title: 'Leads em Aberto',
                  value: leads.filter(l => l.resultado === 'aberto').length,
                  format: 'number',
                  color: 'yellow',
                }}
              />
            </div>

            {/* Conversion Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Análise de Conversão por Data
              </h3>
              <LeadsLineChart
                data={timeSeriesData}
                title=""
                height={350}
              />
            </div>

            {/* Responsável Stats with conversion focus */}
            <ResponsavelTable
              data={responsavelStats}
              title="Opt > Vendas por Responsável"
            />
          </div>
        )}

        {/* Page 4: Análise de Perdas */}
        {!isLoading && activePage === 'perdas' && (
          <div className="space-y-6">
            {/* Perdas KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <KPICard
                data={{
                  title: 'Perdas',
                  value: totalPerdas,
                  format: 'number',
                  color: 'red',
                }}
              />
              <KPICard
                data={{
                  title: 'Opt Perdidas',
                  value: leads.filter(l => l.resultado === 'perdido').length,
                  format: 'number',
                  color: 'red',
                }}
              />
              <KPICard
                data={{
                  title: '% Perdas',
                  value: leads.length > 0
                    ? (totalPerdas / leads.length) * 100
                    : 0,
                  format: 'percentage',
                  color: 'red',
                }}
              />
              <KPICard
                data={{
                  title: '% Opt Perdidas',
                  value: leads.length > 0
                    ? (leads.filter(l => l.resultado === 'perdido').length / leads.length) * 100
                    : 0,
                  format: 'percentage',
                  color: 'red',
                }}
              />
              <KPICard
                data={{
                  title: 'Tempo M. Perdas',
                  value: leads.filter(l => l.resultado === 'perdido').length > 0
                    ? Math.round(
                        leads
                          .filter(l => l.resultado === 'perdido' && l.dias_ciclo)
                          .reduce((sum, l) => sum + (l.dias_ciclo || 0), 0) /
                        leads.filter(l => l.resultado === 'perdido' && l.dias_ciclo).length
                      )
                    : 0,
                  format: 'days',
                  color: 'yellow',
                }}
              />
            </div>

            {/* Perdas Charts */}
            <PerdasChart
              perdasPorFonte={perdasPorFonte}
              perdasPorEtapa={perdasPorEtapa}
              totalPerdas={totalPerdas}
            />

            {/* Responsável with loss focus */}
            <ResponsavelTable
              data={responsavelStats}
              title="Perdas por Responsável"
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Efeito Digital - Ads Flow B.I. Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BIDashboardPage;
