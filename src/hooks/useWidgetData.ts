/**
 * ============================================
 * USE WIDGET DATA — Per-widget data fetching
 * ============================================
 * Uses React Query for caching and parallel fetching.
 * Each widget fetches independently with its own loading state.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchWidgetData, type WidgetDataResult } from '@/services/dashboardDataService';
import type { DashboardWidget, DashboardGlobalFilters } from '@/types/dashboard';

export function useWidgetData(
  widget: DashboardWidget,
  globalFilters: DashboardGlobalFilters,
  enabled = true,
) {
  return useQuery<WidgetDataResult>({
    queryKey: [
      'widget-data',
      widget.id,
      widget.data_source.type,
      widget.data_source.accountId,
      widget.data_source.groupBy,
      widget.data_source.metrics.join(','),
      globalFilters.datePreset,
      globalFilters.customRange?.startDate,
      globalFilters.customRange?.endDate,
      globalFilters.clientId,
      globalFilters.accountIds?.join(','),
    ],
    queryFn: () => fetchWidgetData(
      widget.widget_type,
      widget.data_source,
      widget.config,
      globalFilters,
    ),
    enabled: enabled && !!widget.data_source.type,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

