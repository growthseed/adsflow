/**
 * ============================================
 * MULTI-TENANT — single build, multiple domains
 * ============================================
 * Permite que o mesmo build sirva múltiplos domínios com branding
 * diferente. O tenant é detectado em prioridade:
 *
 *   1. VITE_TENANT env var (build-time) — usado em deploy de subdomínio
 *      dedicado (ex: moai.efeito.digital tem VITE_TENANT=moai).
 *   2. hostname (runtime) — fallback se a env não foi setada (dev local).
 *
 * Cada tenant tem:
 *   - id (slug interno)
 *   - displayName (header)
 *   - brand colors
 *   - landingRedirect (rota inicial pós-login ou root)
 *   - allowedRoutePrefixes (lista de prefixes permitidos; null = todos)
 *   - showAdFlowFooter (mostra/esconde "powered by Ad Flow")
 * ============================================
 */

export type TenantId = 'adflow' | 'moai'

export interface TenantConfig {
  id: TenantId
  displayName: string
  shortName: string
  brand: {
    primary: string
    primaryFg: string
    accent: string
  }
  /** Pra onde mandar quando entra em / */
  landingRedirect: string
  /** Rotas permitidas (prefix match). null = todas. */
  allowedRoutePrefixes: string[] | null
  /** Mostra footer "powered by Ad Flow" no MoaiDashboardPage */
  showAdFlowFooter: boolean
  /** Mostra a Landing page comercial do Ad Flow (false em tenants dedicados) */
  showCommercialLanding: boolean
  /** Permite o roteador acessar /c/:clientSlug (false em tenants dedicados) */
  allowMultiClientRoutes: boolean
}

const TENANTS: Record<TenantId, TenantConfig> = {
  adflow: {
    id: 'adflow',
    displayName: 'Ad Flow',
    shortName: 'Ad Flow',
    brand: {
      primary: '#0F172A',
      primaryFg: '#FFFFFF',
      accent: '#3B82F6',
    },
    landingRedirect: '/',
    allowedRoutePrefixes: null,
    showAdFlowFooter: true,
    showCommercialLanding: true,
    allowMultiClientRoutes: true,
  },
  moai: {
    id: 'moai',
    displayName: 'MOAI · Clube de Líderes',
    shortName: 'MOAI',
    brand: {
      primary: '#1A1F36',
      primaryFg: '#FFFFFF',
      accent: '#E66C37',
    },
    landingRedirect: '/moai/cockpit',
    allowedRoutePrefixes: [
      '/moai',
      '/login',
      '/auth/google/callback',
      '/privacy',
      '/terms',
      '/portal-v3', // libera caso queira compartilhar snapshot publico
    ],
    showAdFlowFooter: false,
    showCommercialLanding: false,
    allowMultiClientRoutes: false,
  },
}

/** Tenta detectar via hostname (runtime fallback) */
function detectFromHostname(): TenantId | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hostname.toLowerCase()
  if (h.startsWith('moai.') || h === 'moai.efeito.digital') return 'moai'
  return null
}

/** Resolve o tenant atual (build-time env var > hostname > default). */
export function getCurrentTenant(): TenantConfig {
  const envTenant = (import.meta.env.VITE_TENANT as string | undefined)?.toLowerCase()
  if (envTenant && envTenant in TENANTS) {
    return TENANTS[envTenant as TenantId]
  }
  const detected = detectFromHostname()
  if (detected) return TENANTS[detected]
  return TENANTS.adflow
}

/** Helper conveniente — devolve a config singleton */
export const CURRENT_TENANT = getCurrentTenant()

/** True se a rota é permitida no tenant atual */
export function isRouteAllowed(pathname: string): boolean {
  const t = CURRENT_TENANT
  if (!t.allowedRoutePrefixes) return true
  return t.allowedRoutePrefixes.some((prefix) => pathname.startsWith(prefix) || pathname === '/')
}
