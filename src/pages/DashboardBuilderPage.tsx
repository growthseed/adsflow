/**
 * ============================================
 * DASHBOARD BUILDER PAGE
 * ============================================
 * Full-screen builder with:
 * - Template picker (initial state)
 * - Widget palette (left sidebar)
 * - Grid with drag-and-drop widgets (center)
 * - Toolbar (top)
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { dashboardService, widgetService } from '@/services/dashboardService';
import { getTemplateById } from '@/data/dashboardTemplates';
import {
  DashboardGrid,
  WidgetPalette,
  BuilderToolbar,
  TemplatePicker,
} from '@/components/DashboardBuilder';
import { WIDGET_DEFAULT_SIZES } from '@/types/dashboard';
import type { WidgetType, WidgetConfig, DataSourceConfig } from '@/types/dashboard';
import { Loader2, BarChart3 } from 'lucide-react';

// Default config factories per widget type
function getDefaultConfig(widgetType: WidgetType): WidgetConfig {
  switch (widgetType) {
    case 'kpi_card':
      return { type: 'kpi_card', kpi: { metric: 'spend', format: 'currency', showTrend: true, color: 'blue' } };
    case 'line_chart':
      return { type: 'line_chart', chart: { chartType: 'line', xAxis: 'date', yAxis: ['value'], showGrid: true, showLegend: false, curveType: 'monotone' } };
    case 'area_chart':
      return { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['value'], showGrid: true, showLegend: false, curveType: 'monotone' } };
    case 'bar_chart':
      return { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'name', yAxis: ['value'], showGrid: true, showLegend: false } };
    case 'pie_chart':
      return { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, showLabels: false } };
    case 'donut_chart':
      return { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, showLabels: false } };
    case 'funnel_chart':
      return { type: 'funnel_chart', chart: { chartType: 'funnel', showLabels: true } };
    case 'table':
      return { type: 'table', table: { columns: [{ key: 'name', label: 'Nome', sortable: true }, { key: 'value', label: 'Valor', format: 'number', sortable: true }], pageSize: 10 } };
    case 'gauge':
      return { type: 'gauge', gauge: { metric: 'roas', min: 0, max: 10, format: 'number', thresholds: [{ value: 3, color: '#10b981' }, { value: 1, color: '#f59e0b' }, { value: 0, color: '#ef4444' }] } };
    case 'comparison':
      return { type: 'comparison', comparison: { metrics: ['spend', 'conversions'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } };
    case 'text':
      return { type: 'text', text: { content: 'Clique para editar...', fontSize: 'base', alignment: 'left' } };
    case 'image':
      return { type: 'image', image: { url: '', fit: 'contain' } };
    default:
      return { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'name', yAxis: ['value'], showGrid: true } };
  }
}

function getDefaultDataSource(widgetType: WidgetType): DataSourceConfig {
  const isBI = ['funnel_chart'].includes(widgetType);
  return {
    type: isBI ? 'bi_leads' : 'meta_ads',
    metrics: ['spend'],
    groupBy: 'day',
  };
}

const WIDGET_LABELS: Record<string, string> = {
  kpi_card: 'KPI Card', line_chart: 'Gráfico de Linha', area_chart: 'Gráfico de Área',
  bar_chart: 'Gráfico de Barras', pie_chart: 'Pizza', donut_chart: 'Donut',
  funnel_chart: 'Funil', table: 'Tabela', gauge: 'Gauge',
  comparison: 'Comparativo', waterfall_chart: 'Waterfall', treemap: 'Treemap',
  scatter_plot: 'Dispersão', heatmap: 'Mapa de Calor', text: 'Texto', image: 'Imagem',
};

export default function DashboardBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, activeClient } = useAuth();

  const {
    dashboard,
    loading,
    saving,
    saveLayout,
    updateDashboard,
    addWidget,
    removeWidget,
  } = useDashboard(id || null);

  const [editing, setEditing] = useState(true);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);

  // Create blank dashboard
  const handleCreateBlank = useCallback(async () => {
    if (!user) return;
    try {
      const newDashboard = await dashboardService.create({
        user_id: user.id,
        client_id: activeClient?.client_id,
        name: 'Novo Dashboard',
      });
      navigate(`/dashboard-builder/${newDashboard.id}`, { replace: true });
    } catch (err) {
      console.error('Error creating dashboard:', err);
    }
  }, [user, activeClient, navigate]);

  // Create from template
  const handleSelectTemplate = useCallback(async (templateId: string) => {
    if (!user) return;
    setCreatingFromTemplate(true);
    try {
      const templateNames: Record<string, string> = {
        meta_ads_inside_sales: 'Meta Ads — Inside Sales',
        meta_ads_ecommerce: 'Meta Ads — E-commerce',
        google_ads_inside_sales: 'Google Ads — Inside Sales',
        google_ads_ecommerce: 'Google Ads — E-commerce',
        crm_vendas_funil: 'CRM/Vendas — Funil',
        ecommerce_faturamento: 'E-commerce — Faturamento',
      };

      const template = getTemplateById(templateId);
      const newDashboard = await dashboardService.create({
        user_id: user.id,
        client_id: activeClient?.client_id,
        name: template?.name || templateNames[templateId] || 'Dashboard',
        template_id: templateId,
        theme: template?.theme,
        global_filters: template?.defaultFilters,
      });

      // Insert template widgets
      if (template && template.widgets.length > 0) {
        await widgetService.bulkCreate(
          newDashboard.id,
          template.widgets.map((w) => ({
            widget_type: w.widget_type,
            title: w.title,
            data_source: w.data_source,
            config: w.config,
            position: w.position,
          }))
        );
      }

      navigate(`/dashboard-builder/${newDashboard.id}`, { replace: true });
    } catch (err) {
      console.error('Error creating from template:', err);
    } finally {
      setCreatingFromTemplate(false);
    }
  }, [user, activeClient, navigate]);

  // Add widget from palette
  const handleAddWidget = useCallback(async (widgetType: WidgetType) => {
    const config = getDefaultConfig(widgetType);
    const dataSource = getDefaultDataSource(widgetType);
    const position = { ...WIDGET_DEFAULT_SIZES[widgetType] };

    await addWidget(widgetType, WIDGET_LABELS[widgetType] || widgetType, dataSource, config, position);
  }, [addWidget]);

  // No dashboard loaded: show template picker
  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50">
        {creatingFromTemplate ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <TemplatePicker
            onSelectTemplate={handleSelectTemplate}
            onCreateBlank={handleCreateBlank}
          />
        )}
      </div>
    );
  }

  // Loading dashboard
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Dashboard não encontrado.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <BuilderToolbar
        name={dashboard.name}
        saving={saving}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        onNameChange={(name) => updateDashboard({ name })}
        onSave={() => updateDashboard({ updated_at: new Date().toISOString() })}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Widget Palette (only in edit mode) */}
        {editing && (
          <WidgetPalette onAddWidget={handleAddWidget} />
        )}

        {/* Center: Grid */}
        <div className="flex-1 overflow-auto p-4">
          {dashboard.widgets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Dashboard vazio</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  {editing
                    ? 'Arraste widgets da barra lateral para começar a montar seu dashboard.'
                    : 'Ative o modo de edição para adicionar widgets.'}
                </p>
              </div>
            </div>
          ) : (
            <DashboardGrid
              widgets={dashboard.widgets}
              layouts={dashboard.layout}
              globalFilters={dashboard.global_filters}
              editing={editing}
              onLayoutChange={(layouts) => saveLayout(layouts)}
              onEditWidget={(_widgetId) => { /* TODO: open config panel */ }}
              onDeleteWidget={(widgetId) => removeWidget(widgetId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

