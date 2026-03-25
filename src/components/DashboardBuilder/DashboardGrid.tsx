/**
 * DashboardGrid — react-grid-layout v2 wrapper with live data
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { GridLayout, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

import type { DashboardWidget, DashboardGlobalFilters } from '@/types/dashboard';
import LiveWidgetWrapper from './LiveWidgetWrapper';

interface Props {
  widgets: DashboardWidget[];
  layouts: Record<string, unknown>;
  globalFilters: DashboardGlobalFilters;
  editing: boolean;
  onLayoutChange: (allLayouts: Record<string, unknown>) => void;
  onEditWidget?: (widgetId: string) => void;
  onDeleteWidget?: (widgetId: string) => void;
  onDuplicateWidget?: (widgetId: string) => void;
}

export default function DashboardGrid({
  widgets,
  layouts,
  globalFilters,
  editing,
  onLayoutChange,
  onEditWidget,
  onDeleteWidget,
  onDuplicateWidget,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const effectiveLayout = useMemo((): Layout => {
    if (layouts && Array.isArray((layouts as Record<string, unknown[]>).lg)) {
      return (layouts as Record<string, Layout>).lg;
    }

    return widgets.map((w) => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: w.position.minW ?? 2,
      minH: w.position.minH ?? 2,
    })) as unknown as Layout;
  }, [layouts, widgets]);

  const handleLayoutChange = useCallback((layout: unknown) => {
    onLayoutChange({ lg: layout });
  }, [onLayoutChange]);

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
        <GridLayout
          width={width}
          layout={effectiveLayout}
          onLayoutChange={handleLayoutChange}
          compactor={verticalCompactor}
          autoSize
          gridConfig={{
            cols: 12,
            rowHeight: 60,
            margin: [12, 12] as const,
            containerPadding: null,
            maxRows: Infinity,
          }}
          dragConfig={{
            enabled: editing,
            handle: '.drag-handle',
          }}
          resizeConfig={{
            enabled: editing,
          }}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <LiveWidgetWrapper
                widget={widget}
                globalFilters={globalFilters}
                editing={editing}
                onEdit={() => onEditWidget?.(widget.id)}
                onDelete={() => onDeleteWidget?.(widget.id)}
                onDuplicate={() => onDuplicateWidget?.(widget.id)}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
