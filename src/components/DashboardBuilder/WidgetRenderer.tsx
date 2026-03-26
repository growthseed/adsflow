/**
 * WidgetRenderer — Renders the correct widget component based on widget_type
 */

import type { DashboardWidget } from '@/types/dashboard';
import {
  KPICardWidget,
  LineChartWidget,
  AreaChartWidget,
  BarChartWidget,
  PieChartWidget,
  DonutChartWidget,
  FunnelChartWidget,
  WaterfallChartWidget,
  TreemapWidget,
  ScatterPlotWidget,
  HeatmapWidget,
  ComparisonWidget,
  TableWidget,
  GaugeWidget,
  TextWidget,
  ImageWidget,
} from '@/components/DashboardWidgets';

interface Props {
  widget: DashboardWidget;
  data: unknown;
  loading?: boolean;
}

export default function WidgetRenderer({ widget, data, loading }: Props) {
  const { config } = widget;

  switch (config.type) {
    case 'kpi_card':
      return (
        <KPICardWidget
          config={config.kpi}
          data={data as { value: number; previousValue?: number } | null}
          loading={loading}
        />
      );

    case 'line_chart':
      return (
        <LineChartWidget
          config={config.chart}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
          variant="line"
        />
      );

    case 'area_chart':
      return (
        <AreaChartWidget
          config={config.chart}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
        />
      );

    case 'bar_chart':
      return (
        <BarChartWidget
          config={config.chart}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
        />
      );

    case 'pie_chart':
      return (
        <PieChartWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
          variant="pie"
        />
      );

    case 'donut_chart':
      return (
        <DonutChartWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
        />
      );

    case 'funnel_chart':
      return (
        <FunnelChartWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
        />
      );

    case 'waterfall_chart':
      return (
        <WaterfallChartWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
        />
      );

    case 'treemap':
      return (
        <TreemapWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
        />
      );

    case 'scatter_plot':
      return (
        <ScatterPlotWidget
          config={config.chart}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
        />
      );

    case 'heatmap':
      return (
        <HeatmapWidget
          config={config.chart}
          data={(data as Array<{ row: string; col: string; value: number }>) || []}
          loading={loading}
        />
      );

    case 'table':
      return (
        <TableWidget
          config={config.table}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
        />
      );

    case 'gauge':
      return (
        <GaugeWidget
          config={config.gauge}
          data={data as { value: number } | null}
          loading={loading}
        />
      );

    case 'comparison':
      return (
        <ComparisonWidget
          config={config.comparison}
          data={(data as Array<{ metric: string; label: string; period1Value: number; period2Value: number; format?: 'number' | 'currency' | 'percentage' }>) || []}
          loading={loading}
        />
      );

    case 'text':
      return <TextWidget config={config.text} />;

    case 'image':
      return <ImageWidget config={config.image} />;

    default:
      return (
        <div className="h-full flex items-center justify-center text-sm text-red-400">
          Widget desconhecido: {widget.widget_type}
        </div>
      );
  }
}
