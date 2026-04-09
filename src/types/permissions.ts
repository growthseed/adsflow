/**
 * ============================================
 * PERMISSIONS — Sprint 1 RBAC
 * ============================================
 * Granular permission model: every (module, action) tuple is
 * a permission. ClientRole → Set<PermissionKey> is the template.
 * Per-client overrides live in `client_role_overrides` and are
 * applied on top at lookup time.
 * ============================================
 */

export type PermissionModule =
  | 'overview'
  | 'planner'
  | 'performance'
  | 'project'
  | 'settings'
  | 'insights'
  | 'reports'

export type PermissionAction =
  | 'read'
  | 'write'
  | 'delete'
  | 'comment'
  | 'approve'
  | 'export'
  | 'drill_down'
  | 'generate'
  | 'schedule'

/**
 * Compact string key used for fast set lookups. Format: `module:action`.
 * Canonicalized via `permKey()` below so callers never construct it manually.
 */
export type PermissionKey = `${PermissionModule}:${PermissionAction}`

export function permKey(module: PermissionModule, action: PermissionAction): PermissionKey {
  return `${module}:${action}` as PermissionKey
}

export interface PermissionRow {
  id: string
  module: PermissionModule
  action: PermissionAction
  description: string | null
}

export interface RolePermissionRow {
  role_name: string
  permission_id: string
}

/** Resolved template: role → set of permission keys */
export type RolePermissionsMap = Partial<Record<string, Set<PermissionKey>>>

/**
 * Resolved per-client override map for the active client.
 *   clientOverrides[role][permKey] = true  → explicitly granted
 *   clientOverrides[role][permKey] = false → explicitly revoked
 * Missing entry = fall back to the role template.
 */
export type ClientOverridesMap = Partial<
  Record<string, Partial<Record<PermissionKey, boolean>>>
>
