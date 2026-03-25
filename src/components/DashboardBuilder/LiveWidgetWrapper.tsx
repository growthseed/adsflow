/**
 * LiveWidgetWrapper — Wraps a single widget with real data fetching
 * Uses useWidgetData hook per widget for independent loading states.
 */

import { useWidgetData } from '@/hooks/useWidgetData';
import type { DashboardWidget, DashboardGlobalFilters } from '@/types/dashboard';
import WidgetWrapper from './WidgetWrapper';
import WidgetRenderer from './WidgetRenderer';

interface Props {
  widget: DashboardWidget;
  globalFilters: DashboardGlobalFilters;
  editing: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function LiveWidgetWrapper({
  widget,
  globalFilters,
  editing,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const { data: result, isLoading, error } = useWidgetData(widget, globalFilters);

  // Transform data for the renderer based on widget type
  let widgetData: unknown = null;
  if (result) {
    if (widget.widget_type === 'kpi_card') {
      widgetData = { value: result.value ?? 0, previousValue: result.previousValue };
    } else if (widget.widget_type === 'gauge') {
      widgetData = { value: result.value ?? 0 };
    } else if (widget.widget_type === 'pie_chart' || widget.widget_type === 'donut_chart') {
      widgetData = result.rows.map((r) => ({
        name: (r.name || r.campaign_name || r.source || r.status || 'Item') as string,
        value: (r.value || r.spend || r.receita || r.count || 0) as number,
      }));
    } else {
      widgetData = result.rows;
    }
  }

  return (
    <WidgetWrapper
      title={widget.title}
      editing={editing}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      {error ? (
        <div className="h-full flex items-center justify-center text-xs text-red-400 p-2 text-center">
          Erro ao carregar dados
        </div>
      ) : (
        <WidgetRenderer
          widget={widget}
          data={widgetData}
          loading={isLoading}
        />
      )}
    </WidgetWrapper>
  );
}
