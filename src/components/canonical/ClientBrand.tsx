/**
 * ============================================
 * <ClientBrand> — AdFlow v4 canonical component
 * ============================================
 * Renders a client's identity (logo + name). Used everywhere the
 * client context matters — sidebar, header, overview hero, portal
 * shell, etc.
 *
 * Resolution order:
 *   1. `logoUrl` prop if explicitly passed (e.g. Supabase Storage URL)
 *   2. Generated fallback: gradient circle with the client's initials
 *
 * The fallback gradient is derived deterministically from the slug
 * so the same client always gets the same colors across screens.
 * ============================================
 */

import { useState } from 'react'

export type ClientBrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface ClientBrandProps {
  /** Display name (used for initials + alt text) */
  name: string
  /** Slug used for deterministic gradient selection */
  slug: string
  /** Public URL of the client's logo, or null/undefined */
  logoUrl?: string | null
  /** Size preset */
  size?: ClientBrandSize
  /** Show name next to logo */
  showName?: boolean
  /** Optional subtitle below the name */
  subtitle?: string
  /** Extra className for the outer container */
  className?: string
}

// Tailwind class maps — keep static so the JIT can pick them up
const SIZE_CLASSES: Record<ClientBrandSize, {
  wrapper: string
  logo: string
  name: string
  subtitle: string
  initials: string
  gap: string
}> = {
  xs: {
    wrapper: 'gap-1.5',
    logo: 'w-6 h-6 rounded-md',
    name: 'text-xs font-semibold',
    subtitle: 'text-[10px]',
    initials: 'text-[9px]',
    gap: 'gap-0',
  },
  sm: {
    wrapper: 'gap-2',
    logo: 'w-8 h-8 rounded-lg',
    name: 'text-sm font-semibold',
    subtitle: 'text-xs',
    initials: 'text-[10px]',
    gap: 'gap-0',
  },
  md: {
    wrapper: 'gap-2.5',
    logo: 'w-10 h-10 rounded-xl',
    name: 'text-sm font-semibold',
    subtitle: 'text-xs',
    initials: 'text-xs',
    gap: 'gap-0.5',
  },
  lg: {
    wrapper: 'gap-3',
    logo: 'w-12 h-12 rounded-xl',
    name: 'text-base font-bold',
    subtitle: 'text-xs',
    initials: 'text-sm',
    gap: 'gap-0.5',
  },
  xl: {
    wrapper: 'gap-4',
    logo: 'w-16 h-16 rounded-2xl',
    name: 'text-lg font-bold',
    subtitle: 'text-sm',
    initials: 'text-lg',
    gap: 'gap-1',
  },
  '2xl': {
    wrapper: 'gap-5',
    logo: 'w-20 h-20 rounded-2xl',
    name: 'text-2xl font-bold',
    subtitle: 'text-sm',
    initials: 'text-2xl',
    gap: 'gap-1',
  },
}

// Deterministic gradient palette — index picked from slug hash.
// Kept to 12 tasteful combos so clients feel distinct but cohesive.
const GRADIENTS = [
  'from-blue-500 to-cyan-600',
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-red-500 to-orange-600',
  'from-slate-600 to-gray-800',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-amber-600',
]

function gradientFor(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function getInitials(name: string): string {
  const parts = name
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ClientBrand({
  name,
  slug,
  logoUrl,
  size = 'md',
  showName = true,
  subtitle,
  className = '',
}: ClientBrandProps) {
  const classes = SIZE_CLASSES[size]
  const [imgFailed, setImgFailed] = useState(false)
  const hasLogo = !!logoUrl && !imgFailed

  return (
    <div className={`flex items-center ${classes.wrapper} ${className}`}>
      {hasLogo ? (
        <img
          src={logoUrl!}
          alt={name}
          onError={() => setImgFailed(true)}
          className={`${classes.logo} object-cover bg-[var(--surface-card)] border border-[var(--border-subtle)] flex-shrink-0`}
        />
      ) : (
        <div
          className={`${classes.logo} bg-gradient-to-br ${gradientFor(slug)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
          aria-label={name}
        >
          <span className={classes.initials}>{getInitials(name)}</span>
        </div>
      )}

      {showName && (
        <div className={`flex flex-col ${classes.gap} min-w-0`}>
          <div className={`${classes.name} text-[var(--text-primary)] truncate`}>{name}</div>
          {subtitle && (
            <div className={`${classes.subtitle} text-[var(--text-tertiary)] truncate`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { getInitials as getClientInitials, gradientFor as getClientGradient }
