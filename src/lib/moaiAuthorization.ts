/**
 * ============================================
 * MOAI AUTHORIZATION — 8 papéis customizados
 * ============================================
 * Resolve papel + escopo do usuário logado (ou via public_token).
 * Provê helpers pra:
 *   - canViewDashboard(role, dashboardId) → boolean
 *   - scopedFor(role) → filtro a aplicar nos dados (ex: { mentor: 'Vilker' })
 *
 * Lê das tabelas:
 *   - moai_user_access (user_id, role, scope_filter)
 *   - moai_dashboard_visibility (role, dashboard_id, visibility_mode)
 * ============================================
 */

import supabase, { isSupabaseConfigured } from './supabase'

export type MoaiRole =
  | 'super_admin'
  | 'agency_admin'
  | 'moai_owner'
  | 'moai_leadership'
  | 'moai_mentor'
  | 'moai_finance'
  | 'moai_marketing'
  | 'public_snapshot'

export type DashboardId =
  | 'moai_executive_pulse'
  | 'moai_membros_carteiras'
  | 'moai_sales_crm'
  | 'moai_cx_nps'
  | 'moai_conteudo_mkt'
  | 'moai_financeiro'
  | 'moai_conselhos'
  | 'moai_operacoes'
  | 'moai_time'
  | 'moai_estrategia'
  | 'moai_parcerias'
  | 'moai_turn_lab'
  | 'moai_ia'
  | 'moai_admin'

export type VisibilityMode = 'full' | 'scoped' | 'forbidden'

export interface MoaiAccess {
  role: MoaiRole
  scopeFilter: Record<string, unknown>
  displayName?: string
  isActive: boolean
}

export interface DashboardVisibilityMap {
  [dashboardId: string]: VisibilityMode
}

// Cache em memória — invalidado quando user muda
let cachedAccess: { uid: string; access: MoaiAccess | null } | null = null
let cachedVisibility: { role: string; map: DashboardVisibilityMap } | null = null

// =============================================================
// RESOLVE ACCESS (via user logado)
// =============================================================

export async function resolveMoaiAccess(userId: string): Promise<MoaiAccess | null> {
  if (cachedAccess && cachedAccess.uid === userId) return cachedAccess.access
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .rpc('resolve_moai_access', { p_user_id: userId })
    .single<{
      role: MoaiRole
      scope_filter: Record<string, unknown>
      is_active: boolean
      display_name: string | null
    }>()

  if (error || !data) {
    cachedAccess = { uid: userId, access: null }
    return null
  }

  const access: MoaiAccess = {
    role: data.role,
    scopeFilter: data.scope_filter ?? {},
    displayName: data.display_name ?? undefined,
    isActive: data.is_active,
  }
  cachedAccess = { uid: userId, access }
  return access
}

export async function resolveMoaiAccessByToken(token: string): Promise<MoaiAccess | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .rpc('resolve_moai_access_by_token', { p_token: token })
    .single<{
      role: MoaiRole
      scope_filter: Record<string, unknown>
      is_active: boolean
      display_name: string | null
    }>()
  if (error || !data) return null
  return {
    role: data.role,
    scopeFilter: data.scope_filter ?? {},
    displayName: data.display_name ?? undefined,
    isActive: data.is_active,
  }
}

export function invalidateAccessCache() {
  cachedAccess = null
  cachedVisibility = null
}

// =============================================================
// DASHBOARD VISIBILITY
// =============================================================

export async function loadDashboardVisibility(role: MoaiRole): Promise<DashboardVisibilityMap> {
  if (cachedVisibility && cachedVisibility.role === role) return cachedVisibility.map
  const fallback = DEFAULT_VISIBILITY_BY_ROLE[role] ?? {}

  // Admins precisam enxergar a plataforma mesmo se a tabela auxiliar estiver
  // fora do ar/RLS quebrado. A protecao sensivel fica no login + moai_user_access.
  if (role === 'super_admin' || role === 'agency_admin' || role === 'moai_owner') {
    cachedVisibility = { role, map: fallback }
    return fallback
  }

  if (!isSupabaseConfigured) return fallback

  const { data, error } = await supabase
    .from('moai_dashboard_visibility')
    .select('dashboard_id, visibility_mode')
    .eq('role', role)

  if (error || !data) return fallback
  const map: DashboardVisibilityMap = { ...fallback }
  for (const r of data) {
    map[r.dashboard_id] = r.visibility_mode as VisibilityMode
  }
  cachedVisibility = { role, map }
  return map
}

export function canViewDashboard(
  visibilityMap: DashboardVisibilityMap,
  dashboardId: DashboardId,
): VisibilityMode {
  return visibilityMap[dashboardId] ?? 'forbidden'
}

// =============================================================
// SCOPE FILTER APPLICATION
// =============================================================

/**
 * Aplica o scopeFilter aos dados antes de passar ao WidgetRenderer.
 * Hoje suporta filtros chave-valor simples (`mentor: 'Vilker'`).
 * Pode evoluir pra OR/AND complexos no futuro.
 *
 * Ex: scopedDataFilter({ mentor: 'Vilker' })(items) =>
 *     items.filter(i => i.mentor === 'Vilker')
 */
export function scopedDataFilter(
  scopeFilter: Record<string, unknown>,
): <T extends Record<string, unknown>>(items: T[]) => T[] {
  return <T extends Record<string, unknown>>(items: T[]) => {
    if (!items || items.length === 0) return items
    const keys = Object.keys(scopeFilter)
    if (keys.length === 0) return items
    return items.filter((it) => keys.every((k) => it[k] === scopeFilter[k]))
  }
}

// =============================================================
// DEFAULT FALLBACK (dev / sem auth)
// =============================================================

export const SUPER_ADMIN_ACCESS: MoaiAccess = {
  role: 'super_admin',
  scopeFilter: {},
  displayName: 'Super Admin (dev)',
  isActive: true,
}

export const DEFAULT_VISIBILITY_MAP_SUPER_ADMIN: DashboardVisibilityMap = {
  moai_executive_pulse: 'full',
  moai_membros_carteiras: 'full',
  moai_sales_crm: 'full',
  moai_cx_nps: 'full',
  moai_conselhos: 'full',
  moai_conteudo_mkt: 'full',
  moai_financeiro: 'full',
  moai_operacoes: 'full',
  moai_time: 'full',
  moai_estrategia: 'full',
  moai_parcerias: 'full',
  moai_turn_lab: 'full',
  moai_ia: 'full',
  moai_admin: 'full',
}

export const DEFAULT_VISIBILITY_BY_ROLE: Record<MoaiRole, DashboardVisibilityMap> = {
  super_admin: DEFAULT_VISIBILITY_MAP_SUPER_ADMIN,
  agency_admin: DEFAULT_VISIBILITY_MAP_SUPER_ADMIN,
  moai_owner: DEFAULT_VISIBILITY_MAP_SUPER_ADMIN,
  moai_leadership: {
    ...DEFAULT_VISIBILITY_MAP_SUPER_ADMIN,
    moai_financeiro: 'scoped',
    moai_admin: 'forbidden',
  },
  moai_mentor: {
    moai_executive_pulse: 'forbidden',
    moai_membros_carteiras: 'scoped',
    moai_sales_crm: 'forbidden',
    moai_cx_nps: 'scoped',
    moai_conselhos: 'scoped',
    moai_conteudo_mkt: 'forbidden',
    moai_financeiro: 'forbidden',
    moai_operacoes: 'forbidden',
    moai_time: 'forbidden',
    moai_estrategia: 'forbidden',
    moai_parcerias: 'forbidden',
    moai_turn_lab: 'forbidden',
    moai_ia: 'forbidden',
    moai_admin: 'forbidden',
  },
  moai_finance: {
    moai_executive_pulse: 'scoped',
    moai_membros_carteiras: 'forbidden',
    moai_sales_crm: 'forbidden',
    moai_cx_nps: 'forbidden',
    moai_conselhos: 'forbidden',
    moai_conteudo_mkt: 'forbidden',
    moai_financeiro: 'full',
    moai_operacoes: 'forbidden',
    moai_time: 'forbidden',
    moai_estrategia: 'forbidden',
    moai_parcerias: 'forbidden',
    moai_turn_lab: 'forbidden',
    moai_ia: 'forbidden',
    moai_admin: 'forbidden',
  },
  moai_marketing: {
    moai_executive_pulse: 'scoped',
    moai_membros_carteiras: 'forbidden',
    moai_sales_crm: 'forbidden',
    moai_cx_nps: 'forbidden',
    moai_conselhos: 'forbidden',
    moai_conteudo_mkt: 'full',
    moai_financeiro: 'forbidden',
    moai_operacoes: 'forbidden',
    moai_time: 'forbidden',
    moai_estrategia: 'forbidden',
    moai_parcerias: 'forbidden',
    moai_turn_lab: 'forbidden',
    moai_ia: 'scoped',
    moai_admin: 'forbidden',
  },
  public_snapshot: {
    moai_executive_pulse: 'scoped',
    moai_membros_carteiras: 'forbidden',
    moai_sales_crm: 'forbidden',
    moai_cx_nps: 'forbidden',
    moai_conselhos: 'forbidden',
    moai_conteudo_mkt: 'forbidden',
    moai_financeiro: 'forbidden',
    moai_operacoes: 'forbidden',
    moai_time: 'forbidden',
    moai_estrategia: 'forbidden',
    moai_parcerias: 'forbidden',
    moai_turn_lab: 'forbidden',
    moai_ia: 'forbidden',
    moai_admin: 'forbidden',
  },
}
