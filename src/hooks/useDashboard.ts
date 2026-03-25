/**
 * ============================================
 * DASHBOARD HOOKS
 * ============================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, widgetService } from '@/services/dashboardService';
import type {
  Dashboard,
  DashboardWidget,
  DashboardUpdate,
  WidgetType,
  DataSourceConfig,
  WidgetConfig,
  WidgetPosition,
} from '@/types/dashboard';

// =====================================================
// useDashboardList — List dashboards for user/client
// =====================================================

export function useDashboardList() {
  const { user, activeClient } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dashboardService.list(user.id, activeClient?.client_id);
      setDashboards(data);
    } catch (err) {
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeClient?.client_id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { dashboards, loading, refetch: fetch };
}

// =====================================================
// useDashboard — Load/save a single dashboard
// =====================================================

export function useDashboard(dashboardId: string | null) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const layoutSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load dashboard
  useEffect(() => {
    if (!dashboardId) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    dashboardService.get(dashboardId)
      .then((data) => setDashboard(data))
      .catch((err) => console.error('Error loading dashboard:', err))
      .finally(() => setLoading(false));
  }, [dashboardId]);

  // Save layout with debounce (500ms)
  const saveLayout = useCallback((newLayout: Record<string, unknown>) => {
    if (!dashboardId) return;

    // Update local state immediately
    setDashboard((prev) => prev ? { ...prev, layout: newLayout as Dashboard['layout'] } : prev);

    // Debounce save to Supabase
    if (layoutSaveTimer.current) clearTimeout(layoutSaveTimer.current);
    layoutSaveTimer.current = setTimeout(async () => {
      try {
        await dashboardService.updateLayout(dashboardId, newLayout);
      } catch (err) {
        console.error('Error saving layout:', err);
      }
    }, 500);
  }, [dashboardId]);

  // Update dashboard properties
  const updateDashboard = useCallback(async (updates: DashboardUpdate) => {
    if (!dashboardId) return;
    setSaving(true);
    try {
      await dashboardService.update(dashboardId, updates);
      setDashboard((prev) => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      console.error('Error updating dashboard:', err);
    } finally {
      setSaving(false);
    }
  }, [dashboardId]);

  // Add widget
  const addWidget = useCallback(async (
    widgetType: WidgetType,
    title: string,
    dataSource: DataSourceConfig,
    config: WidgetConfig,
    position: WidgetPosition,
  ) => {
    if (!dashboardId) return;

    try {
      const widget = await widgetService.create({
        dashboard_id: dashboardId,
        widget_type: widgetType,
        title,
        data_source: dataSource,
        config,
        position,
      });

      setDashboard((prev) => {
        if (!prev) return prev;
        return { ...prev, widgets: [...prev.widgets, widget] };
      });

      return widget;
    } catch (err) {
      console.error('Error adding widget:', err);
    }
  }, [dashboardId]);

  // Update widget
  const updateWidget = useCallback(async (widgetId: string, updates: Partial<DashboardWidget>) => {
    try {
      await widgetService.update(widgetId, updates);
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          widgets: prev.widgets.map((w) =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        };
      });
    } catch (err) {
      console.error('Error updating widget:', err);
    }
  }, []);

  // Remove widget
  const removeWidget = useCallback(async (widgetId: string) => {
    try {
      await widgetService.delete(widgetId);
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          widgets: prev.widgets.filter((w) => w.id !== widgetId),
        };
      });
    } catch (err) {
      console.error('Error removing widget:', err);
    }
  }, []);

  return {
    dashboard,
    loading,
    saving,
    saveLayout,
    updateDashboard,
    addWidget,
    updateWidget,
    removeWidget,
  };
}
