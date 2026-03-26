import React, { useState, useCallback, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
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
  Package,
} from 'lucide-react';

// Auth
import { useAuth } from '@/contexts/AuthContext';

// Components
import { KPICard, FunnelChart, LeadsLineChart, ResponsavelTable, PerdasChart } from '@/components/BI';
import DateRangeSelector from '@/components/UI/DateRangeSelector';
import { useToast } from '@/components/UI/Toast';
import { KPIRowSkeleton, ChartSkeleton, TableSkeleton } from '@/components/UI/Skeleton';

// E-commerce service
import {
  getRevenueSummary,
  getProductABC,
  getGeographicDistribution,
  getCustomerRFM,
  getRecentOrders,
  getEcommerceTotals,
} from '@/services/ecommerceService';
import type {
  RevenueSummary,
  ProductABC,
  GeoDistribution,
  RFMDistribution,
  RecentOrder,
  EcommerceTotals,
} from '@/services/ecommerceService';

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
// E-COMMERCE VIEW (real data from Supabase)
// =====================================================

const ABC_COLORS: Record<string, string> = { A: '#10b981', B: '#f59e0b', C: '#ef4444' };
const RFM_COLORS: Record<string, string> = {
  champions: '#10b981',
  loyal: '#3b82f6',
  potential: '#8b5cf6',
  new: '#06b6d4',
  at_risk: '#f59e0b',
  lost: '#ef4444',
};
const RFM_LABELS: Record<string, string> = {
  champions: 'Campeões',
  loyal: 'Fiéis',
  potential: 'Potenciais',
  new: 'Novos',
  at_risk: 'Em risco',
  lost: 'Perdidos',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

function EcommerceView() {
  const { activeClient } = useAuth();
  const clientId = activeClient?.client_id;

  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<EcommerceTotals | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueSummary[]>([]);
  const [products, setProducts] = useState<ProductABC[]>([]);
  const [rfmData, setRfmData] = useState<RFMDistribution[]>([]);
  const [geoData, setGeoData] = useState<GeoDistribution[]>([]);
  const [recentOrdersList, setRecentOrdersList] = useState<RecentOrder[]>([]);

  const hasData = totals != null && totals.orders > 0;

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [t, rev, abc, rfm, geo, orders] = await Promise.all([
          getEcommerceTotals(clientId!),
          getRevenueSummary(clientId!),
          getProductABC(clientId!),
          getCustomerRFM(clientId!),
          getGeographicDistribution(clientId!),
          getRecentOrders(clientId!, 15),
        ]);
        if (cancelled) return;
        setTotals(t);
        setRevenueTrend(rev);
        setProducts(abc);
        setRfmData(rfm);
        setGeoData(geo);
        setRecentOrdersList(orders);
      } catch (err) {
        console.error('[EcommerceView] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const fmtBRL = (v: number | undefined) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fmtMonth = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } catch { return iso; }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <KPIRowSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={280} />
          <ChartSkeleton height={280} />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum dado de e-commerce</h3>
        <p className="text-slate-500 text-center max-w-md mb-6">
          Conecte sua plataforma de e-commerce (Shopify, VTEX, WooCommerce, Tray) ou importe pedidos manualmente para ver analytics completos.
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Conecte sua plataforma de e-commerce
        </button>
      </div>
    );
  }

  // Chart data
  const revenueChartData = revenueTrend.map((r) => ({
    month: fmtMonth(r.month),
    receita: r.revenue,
    pedidos: r.approved_orders,
  }));

  const abcChartData = products.slice(0, 15).map((p) => ({
    name: p.product_name.length > 25 ? p.product_name.slice(0, 22) + '...' : p.product_name,
    receita: p.total_revenue,
    abc_class: p.abc_class,
  }));

  const rfmChartData = rfmData.map((r) => ({
    name: RFM_LABELS[r.segment] || r.segment,
    value: r.count,
    segment: r.segment,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard data={{ title: 'Faturamento', value: totals!.revenue, format: 'currency', color: 'green' }} />
        <KPICard data={{ title: 'Pedidos', value: totals!.orders, format: 'number', color: 'blue' }} />
        <KPICard data={{ title: 'Ticket Médio', value: totals!.avg_ticket, format: 'currency', color: 'purple' }} />
        <KPICard data={{ title: 'Novos Clientes', value: totals!.new_customers, format: 'number', color: 'blue' }} />
        <KPICard data={{ title: 'CAC', value: totals!.cac, format: 'currency', color: 'yellow' }} />
        <KPICard data={{ title: 'LTV', value: totals!.ltv, format: 'currency', color: 'green' }} />
      </div>

      {/* Revenue Trend + ABC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={(v) => fmtBRL(v as number)} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Sem dados de receita</p>
          )}
        </div>

        {/* ABC curve */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Curva ABC de Produtos</h3>
          {abcChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={abcChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtBRL(v as number)} />
                <Bar dataKey="receita" name="Receita" radius={[0, 4, 4, 0]}>
                  {abcChartData.map((item, i) => (
                    <Cell key={i} fill={ABC_COLORS[item.abc_class] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Sem dados de produtos</p>
          )}
          {abcChartData.length > 0 && (
            <div className="flex items-center gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> A (80%)</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> B (15%)</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> C (5%)</span>
            </div>
          )}
        </div>
      </div>

      {/* RFM Distribution + Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM donut */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentação RFM de Clientes</h3>
          {rfmChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rfmChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {rfmChartData.map((entry, i) => (
                    <Cell key={i} fill={RFM_COLORS[entry.segment] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Sem dados RFM (execute o cálculo primeiro)</p>
          )}
        </div>

        {/* Geographic table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição Geográfica</h3>
          </div>
          {geoData.length > 0 ? (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Pedidos</th>
                    <th className="px-6 py-3 text-right">Receita</th>
                    <th className="px-6 py-3 text-right">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {geoData.map((g) => (
                    <tr key={g.shipping_state} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{g.shipping_state}</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">{g.orders}</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">{fmtBRL(g.revenue)}</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">{fmtBRL(g.avg_ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">Sem dados geográficos</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
        </div>
        {recentOrdersList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">UF</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrdersList.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">#{o.order_id}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{o.customer_name || o.customer_email || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {new Date(o.order_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{o.shipping_state || '—'}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{fmtBRL(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">Nenhum pedido encontrado</p>
        )}
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
      toast.warning('Use os relatórios do e-commerce para exportar dados.');
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
