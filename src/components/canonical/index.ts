/**
 * AdFlow v4 canonical components — single import point.
 *
 * These 5 components are the building blocks of every new page.
 * If you find yourself needing a layout primitive that's NOT in
 * here, add it here — never hand-roll in page components.
 */

export { BrandLogo, SUPPORTED_BRANDS } from './BrandLogo'
export type { BrandLogoProps, BrandLogoSize } from './BrandLogo'

export { KPICard } from './KPICard'
export type { KPICardProps } from './KPICard'

export { ChartCard } from './ChartCard'
export type { ChartCardProps } from './ChartCard'

export { PageHeader } from './PageHeader'
export type { PageHeaderProps, Breadcrumb } from './PageHeader'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { ScopeSelector } from './ScopeSelector'
export type { ScopeSelectorProps } from './ScopeSelector'

export { default as TierGate, tierGte } from './TierGate'
export { default as PermissionGate } from './PermissionGate'
export { default as UpgradePrompt } from './UpgradePrompt'
