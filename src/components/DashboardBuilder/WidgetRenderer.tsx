/**
 * WidgetRenderer — Renders the correct widget component based on widget_type
 */

import type { DashboardWidget } from '@/types/dashboard';
import {
  KPICardWidget,
  LineChartWidget,
  BarChartWidget,
  PieChartWidget,
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
        <LineChartWidget
          config={config.chart}
          data={(data as Record<string, unknown>[]) || []}
          loading={loading}
          variant="area"
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
        <PieChartWidget
          config={config.chart}
          data={(data as Array<{ name: string; value: number }>) || []}
          loading={loading}
          variant="donut"
        />
      );

    case 'funnel_chart':
    case 'waterfall_chart':
    case 'treemap':
    case 'scatter_plot':
    case 'heatmap':
      // These will be implemented in Phase 4 (advanced visualizations)
      return (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">
          <div className="text-center">
            <p className="font-medium">{widget.title || widget.widget_type}</p>
            <p className="text-xs mt-1">Widget avançado — em breve</p>
          </div>
        </div>
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
      // Phase 4
      return (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">
          Comparativo — em breve
        </div>
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
