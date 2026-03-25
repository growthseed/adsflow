/**
 * ============================================
 * DASHBOARD SERVICE — CRUD Supabase
 * ============================================
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type {
  Dashboard,
  DashboardWidget,
  DashboardUpdate,
  DashboardTheme,
  DashboardGlobalFilters,
} from '@/types/dashboard';

// =====================================================
// DASHBOARDS
// =====================================================

export const dashboardService = {
  async list(userId: string, clientId?: string): Promise<Dashboard[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('dashboards')
      .select('*, widgets:dashboard_widgets(*)')
      .eq('user_id', userId)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Dashboard[];
  },

  async get(id: string): Promise<Dashboard | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('dashboards')
      .select('*, widgets:dashboard_widgets(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Dashboard;
  },

  async create(dashboard: {
    user_id: string;
    client_id?: string;
    name: string;
    description?: string;
    template_id?: string;
    layout?: Record<string, unknown>;
    theme?: DashboardTheme;
    global_filters?: DashboardGlobalFilters;
  }): Promise<Dashboard> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        user_id: dashboard.user_id,
        client_id: dashboard.client_id || null,
        name: dashboard.name,
        description: dashboard.description || null,
        template_id: dashboard.template_id || null,
        layout: dashboard.layout || {},
        theme: dashboard.theme || { colorScheme: 'light', accentColor: '#1e40af' },
        global_filters: dashboard.global_filters || { datePreset: 'last_30d' },
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, widgets: [] } as Dashboard;
  },

  async update(id: string, updates: DashboardUpdate): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('dashboards')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async updateLayout(id: string, layout: Record<string, unknown>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('dashboards')
      .update({ layout })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async duplicate(id: string, userId: string, newName: string): Promise<Dashboard> {
    const original = await this.get(id);
    if (!original) throw new Error('Dashboard not found');

    const newDashboard = await this.create({
      user_id: userId,
      client_id: original.client_id || undefined,
      name: newName,
      description: original.description || undefined,
      layout: original.layout,
      theme: original.theme,
      global_filters: original.global_filters,
    });

    // Duplicate widgets
    if (original.widgets.length > 0) {
      await widgetService.bulkCreate(
        newDashboard.id,
        original.widgets.map((w) => ({
          widget_type: w.widget_type,
          title: w.title,
          data_source: w.data_source,
          config: w.config,
          position: w.position,
        }))
      );
    }

    return this.get(newDashboard.id) as Promise<Dashboard>;
  },
};

// =====================================================
// WIDGETS
// =====================================================

export const widgetService = {
  async create(widget: {
    dashboard_id: string;
    widget_type: string;
    title: string;
    data_source: unknown;
    config: unknown;
    position: unknown;
  }): Promise<DashboardWidget> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(widget)
      .select()
      .single();

    if (error) throw error;
    return data as DashboardWidget;
  },

  async bulkCreate(
    dashboardId: string,
    widgets: Array<{
      widget_type: string;
      title: string;
      data_source: unknown;
      config: unknown;
      position: unknown;
    }>
  ): Promise<DashboardWidget[]> {
    if (!isSupabaseConfigured) return [];

    const rows = widgets.map((w) => ({
      dashboard_id: dashboardId,
      ...w,
    }));

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(rows)
      .select();

    if (error) throw error;
    return (data || []) as DashboardWidget[];
  },

  async update(id: string, updates: Partial<DashboardWidget>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('dashboard_widgets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
