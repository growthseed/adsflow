/**
 * ============================================
 * TIER GATE — conditional render by client tier
 * ============================================
 * Wraps children with a tier check. If the active client's tier
 * meets the required tier, renders the children. Otherwise
 * renders an UpgradePrompt (or a custom fallback).
 *
 * Staff (super_admin / global admin) always pass through — they
 * need to preview every tier for QA and onboarding.
 * ============================================
 */

import type { ReactNode } from 'react'
import type { ClientServiceTier } from '@/types/metrics'
import { useAuth } from '@/contexts/AuthContext'
import UpgradePrompt from './UpgradePrompt'

const TIER_ORDER: ClientServiceTier[] = ['basic', 'pro', 'black', 'enterprise']

interface TierGateProps {
  /** Minimum tier required to render the children */
  minTier: ClientServiceTier
  /** Human-readable label for the gated feature (shown on upgrade prompt) */
  feature: string
  /** Optional description for the upgrade prompt */
  description?: string
  /**
   * If provided, renders this instead of the default UpgradePrompt when
   * the tier check fails. Useful for inline widgets that need a compact
   * locked state instead of a full-page upsell.
   */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Compare two tiers. Returns true iff `current` is at or above `required`.
 */
export function tierGte(
  current: ClientServiceTier | null | undefined,
  required: ClientServiceTier,
): boolean {
  if (!current) return false
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required)
}

export default function TierGate({
  minTier,
  feature,
  description,
  fallback,
  children,
}: TierGateProps) {
  const { activeClientTier, isGlobalAdmin } = useAuth()

  // Staff bypass — always render children
  if (isGlobalAdmin) return <>{children}</>

  if (tierGte(activeClientTier, minTier)) {
    return <>{children}</>
  }

  if (fallback !== undefined) return <>{fallback}</>

  return (
    <UpgradePrompt
      feature={feature}
      requiredTier={minTier}
      description={description}
    />
  )
}
