import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  ShoppingCart,
} from 'lucide-react';

// Auth
import { useAuth } from '@/contexts/AuthContext';

// Components
import { KPICard, FunnelChart, LeadsLineChart, ResponsavelTable, PerdasChart } from '@/components/BI';
import DateRangeSelector from '@/components/UI/DateRangeSelector';
import { useToast } from '@/components/UI/Toast';
import { KPIRowSkeleton, ChartSkeleton, TableSkeleton } from '@/components/UI/Skeleton';

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
import { downloadCSV } from '@/lib/csv';

// =====================================================
// E-COMMERCE VIEW (demo data — conectar com API real)
// =====================================================

const ECOMMERCE_REVENUE = [
  { month: 'Set', receita: 18400, pedidos: 124 },
  { month: 'Out', receita: 22800, pedidos: 156 },
  { month: 'Nov', receita: 31200, pedidos: 203 },
  { month: 'Dez', receita: 45600, pedidos: 312 },
  { month: 'Jan', receita: 28900, pedidos: 188 },
  { month: 'Fev', receita: 34100, pedidos: 221 },
];

const ECOMMERCE_SOURCES = [
  { source: 'Meta Ads', receita: 48200, pedidos: 312, roas: 4.2 },
  { source: 'Google Ads', receita: 32100, pedidos: 198, roas: 3.1 },
  { source: 'Orgânico', receita: 24600, pedidos: 167, roas: 0 },
  { source: 'Email Mkt', receita: 18300, pedidos: 124, roas: 8.7 },
  { source: 'Direto', receita: 12800, pedidos: 89, roas: 0 },
];

const ECOMMERCE_PRODUCTS = [
  { name: 'Curso Completo Marketing', vendas: 189, receita: 56700, ticket: 300 },
  { name: 'Mentoria Individual', vendas: 42, receita: 41580, ticket: 990 },
  { name: 'Pack Templates', vendas: 312, receita: 15288, ticket: 49 },
  { name: 'Assinatura Premium', vendas: 156, receita: 14040, ticket: 90 },
  { name: 'E-book Estratégias', vendas: 421, receita: 8420, ticket: 20 },
];

const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];

function EcommerceView() {
  const totals = useMemo(() => {
    const receita = ECOMMERCE_REVENUE.reduce((s, r) => s + r.receita, 0);
    const pedidos = ECOMMERCE_REVENUE.reduce((s, r) => s + r.pedidos, 0);
    return {
      receita,
      pedidos,
      ticketMedio: pedidos > 0 ? receita / pedidos : 0,
      taxaConversao: 3.2,
    };
  }, []);

  const fmtBRL = (v: number | undefined) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Demo data banner */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <ShoppingCart className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-700">
          <span className="font-medium">Dados demonstrativos.</span> Conecte sua plataforma de e-commerce nas Integrações para ver dados reais.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard data={{ title: 'Receita Total', value: totals.receita, format: 'currency', color: 'green' }} />
        <KPICard data={{ title: 'Pedidos', value: totals.pedidos, format: 'number', color: 'blue' }} />
        <KPICard data={{ title: 'Ticket Médio', value: totals.ticketMedio, format: 'currency', color: 'purple' }} />
        <KPICard data={{ title: 'Taxa de Conversão', value: totals.taxaConversao, format: 'percentage', color: 'yellow' }} />
      </div>

      {/* Revenue Chart + Source ROAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ECOMMERCE_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip formatter={(v) => fmtBRL(v as number)} />
              <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by source */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Fonte</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ECOMMERCE_SOURCES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis type="category" dataKey="source" width={90} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip formatter={(v) => fmtBRL(v as number)} />
              <Bar dataKey="receita" radius={[0, 4, 4, 0]}>
                {ECOMMERCE_SOURCES.map((_, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source ROAS Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">ROAS por Canal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Fonte</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Pedidos</th>
                <th className="px-6 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ECOMMERCE_SOURCES.map((s, i) => (
                <tr key={s.source} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i] }} />
                      <span className="text-sm font-medium text-gray-900">{s.source}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700">{fmtBRL(s.receita)}</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700">{s.pedidos}</td>
                  <td className="px-6 py-3 text-right">
                    {s.roas > 0 ? (
                      <span className={`text-sm font-semibold ${s.roas >= 3 ? 'text-green-600' : s.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.roas.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Produtos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3 text-right">Vendas</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ECOMMERCE_PRODUCTS.map((p, i) => (
                <tr key={p.name} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700">{p.vendas}</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700">{fmtBRL(p.receita)}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{fmtBRL(p.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const BIDashboardPage: React.FC = () => {
  const { activeClient } = useAuth();
  const toast = useToast();
  const clientId = activeClient?.client_id;
  const [activePage, setActivePage] = useState<BIPageType>('funil');

  // Filters (scoped to active client)
  const { filters, updateDateRange, updateVendedor, resetFilters } = useBIFilters(clientId);

  // Data hooks
  const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeads(filters);
  const { vendedores } = useVendedores(clientId);
  const { kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useKPIs(filters.dateRange, clientId);

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

  const handleExport = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);

    if (activePage === 'ecommerce') {
      downloadCSV(
        ECOMMERCE_SOURCES.map((s) => ({ ...s })),
        [
          { key: 'source', label: 'Fonte' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'roas', label: 'ROAS' },
        ],
        `ecommerce-roas-${today}`
      );
      return;
    }

    if (leads.length === 0) {
      toast.warning('Nenhum dado para exportar neste período.');
      return;
    }

    downloadCSV(
      leads.map((l) => ({
        titulo: l.titulo,
        contato_nome: l.contato_nome || '',
        contato_email: l.contato_email || '',
        contato_telefone: l.contato_telefone || '',
        fonte: l.fonte || '',
        status_funil: l.status_funil || '',
        resultado: l.resultado || '',
        valor_estimado: l.valor_estimado || 0,
        dias_ciclo: l.dias_ciclo || 0,
        responsavel: l.vendedor?.nome || '',
      })),
      [
        { key: 'titulo', label: 'Título' },
        { key: 'contato_nome', label: 'Nome' },
        { key: 'contato_email', label: 'Email' },
        { key: 'contato_telefone', label: 'Telefone' },
        { key: 'fonte', label: 'Fonte' },
        { key: 'status_funil', label: 'Etapa' },
        { key: 'resultado', label: 'Resultado' },
        { key: 'valor_estimado', label: 'Valor' },
        { key: 'dias_ciclo', label: 'Dias no Ciclo' },
        { key: 'responsavel', label: 'Responsável' },
      ],
      `bi-leads-${activePage}-${today}`
    );
  }, [activePage, leads]);

  // Navigation items
  const navItems = [
    { id: 'funil' as BIPageType, label: 'Análise de Funil', icon: BarChart3 },
    { id: 'variacoes' as BIPageType, label: 'Variações', icon: TrendingUp },
    { id: 'tempo' as BIPageType, label: 'Tempo de Fechamento', icon: Clock },
    { id: 'perdas' as BIPageType, label: 'Análise de Perdas', icon: XCircle },
    { id: 'ecommerce' as BIPageType, label: 'E-commerce', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header — inline with app shell, no duplicate header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard B.I.</h1>
          <p className="text-sm text-slate-500 mt-1">Análise comercial e performance de vendas</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeSelector
            value={filters.dateRange}
            onChange={updateDateRange}
          />

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm
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
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Limpar filtros"
          >
            <Filter className="w-5 h-5" />
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors
                       disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tab Navigation — consistent with app design */}
      <div className="border-b border-slate-200">
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
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Page 1: Análise de Funil */}
        {activePage === 'funil' && isLoading && (
          <div className="space-y-6">
            <KPIRowSkeleton count={5} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton height={300} />
              <ChartSkeleton height={300} />
            </div>
            <TableSkeleton rows={5} cols={6} />
          </div>
        )}
        {activePage === 'funil' && !isLoading && (
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
        {activePage === 'variacoes' && isLoading && (
          <div className="space-y-6">
            <KPIRowSkeleton count={5} />
            <ChartSkeleton height={400} />
          </div>
        )}
        {activePage === 'variacoes' && !isLoading && (
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
        {activePage === 'tempo' && isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPIRowSkeleton count={3} />
            </div>
            <ChartSkeleton height={350} />
            <TableSkeleton rows={5} cols={6} />
          </div>
        )}
        {activePage === 'tempo' && !isLoading && (
          <div className="space-y-6">
            {/* Time KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                data={{
                  title: 'Tempo Médio de Vendas',
                  value: (() => {
                    const vendidos = leads.filter(l => l.resultado === 'vendido' && l.dias_ciclo);
                    return vendidos.length > 0
                      ? Math.round(vendidos.reduce((sum, l) => sum + (l.dias_ciclo || 0), 0) / vendidos.length)
                      : 0;
                  })(),
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
        {activePage === 'perdas' && isLoading && (
          <div className="space-y-6">
            <KPIRowSkeleton count={5} />
            <ChartSkeleton height={300} />
            <TableSkeleton rows={5} cols={6} />
          </div>
        )}
        {activePage === 'perdas' && !isLoading && (
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
                  value: (() => {
                    const perdidos = leads.filter(l => l.resultado === 'perdido' && l.dias_ciclo);
                    return perdidos.length > 0
                      ? Math.round(perdidos.reduce((sum, l) => sum + (l.dias_ciclo || 0), 0) / perdidos.length)
                      : 0;
                  })(),
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

        {/* Page 5: E-commerce — uses demo data, no loading needed */}
        {activePage === 'ecommerce' && (
          <EcommerceView />
        )}
      </div>
    </div>
  );
};

export default BIDashboardPage;
