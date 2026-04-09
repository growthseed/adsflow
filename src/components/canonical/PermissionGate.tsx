/**
 * ============================================
 * PERMISSION GATE — conditional render by RBAC permission
 * ============================================
 * Wraps children with a `can(module, action)` check from AuthContext.
 * If the current user is allowed, renders the children. Otherwise
 * renders the fallback (null by default — so this is a silent gate,
 * unlike TierGate which shows an upsell).
 *
 * Staff (global admin / super admin) always pass through via the
 * bypass already implemented in `can()`.
 * ============================================
 */

import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { PermissionAction, PermissionModule } from '@/types/permissions'

interface PermissionGateProps {
  module: PermissionModule
  action: PermissionAction
  /**
   * Optional fallback when the user lacks the permission. Default is
   * `null`, which is the right choice for most UI elements (hide a
   * button rather than show a locked state). For full pages, consider
   * passing an EmptyState or UpgradePrompt here.
   */
  fallback?: ReactNode
  children: ReactNode
}

export default function PermissionGate({
  module,
  action,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can } = useAuth()
  if (can(module, action)) return <>{children}</>
  return <>{fallback}</>
}
