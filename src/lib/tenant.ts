/**
 * ============================================
 * MULTI-TENANT — single build, multiple domains
 * ============================================
 * Permite que o mesmo build sirva múltiplos domínios com branding
 * diferente. O tenant vem da env var VITE_TENANT (build-time), usada em
 * deploy de subdomínio dedicado; sem ela, cai no tenant padrão 'adflow'.
 *
 * Hoje só existe o tenant 'adflow' — a estrutura fica para o próximo
 * portal white-label que precisar de domínio próprio.
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

export type TenantId = 'adflow'

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
  /** Mostra footer "powered by Ad Flow" em portais dedicados */
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
}

/** Resolve o tenant atual (build-time env var > default). */
export function getCurrentTenant(): TenantConfig {
  const envTenant = (import.meta.env.VITE_TENANT as string | undefined)?.toLowerCase()
  if (envTenant && envTenant in TENANTS) {
    return TENANTS[envTenant as TenantId]
  }
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
