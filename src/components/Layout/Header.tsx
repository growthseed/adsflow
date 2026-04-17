/**
 * ============================================
 * HEADER - Top Bar com User Menu
 * ============================================
 * Data: 2026-02-13
 * Header responsivo com breadcrumb, busca,
 * notificações e user dropdown.
 */

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCommandPalette } from '@/components/UI/CommandPalette'
import {
  Search,
  Menu,
  Check,
  Copy,
  ArrowLeft,
} from 'lucide-react'
import NotificationPanel from '@/components/UI/NotificationPanel'
import { ClientBrand } from '@/components/canonical'

// ========== BREADCRUMB MAP ==========

// Only includes routes that actually exist in App.tsx after the v4 cleanup.
// Legacy entries (/dashboard, /editor, /bi, /campaigns, /funnels, /reports,
// /conversion-truth, /insights, /goals, /google-ads, /dashboard-builder,
// /report-builder, /overview) were removed when the pages were deleted.
const PAGE_TITLES: Record<string, string> = {
  '/clients': 'Clientes',
  '/playbook': 'Playbook',
  '/integrations': 'Integrações',
  '/team': 'Equipe',
  '/billing': 'Faturamento',
  '/settings': 'Configurações',
  '/admin': 'Admin Global',
  '/_v4/operations': 'Operações',
}

// ========== COMPONENT ==========

interface HeaderProps {
  collapsed: boolean
  onMobileMenuToggle?: () => void
}

export default function Header({ collapsed, onMobileMenuToggle }: HeaderProps) {
  const { user, activeClient, isGlobalAdmin } = useAuth()
  const { open: openSearch } = useCommandPalette()
  const location = useLocation()
  const navigate = useNavigate()
  const [linkCopied, setLinkCopied] = useState(false)

  // Are we inside a specific client's context?
  const inClientContext = /^\/c\/[^/]+\//.test(location.pathname)

  const copyClientLink = async () => {
    if (!activeClient) return
    // Prefer the public portal token link (no login required).
    // Fall back to the slug-based link (requires login).
    const portalToken = activeClient.client.portal_token
    const url = portalToken
      ? `${window.location.origin}/portal/${portalToken}`
      : `${window.location.origin}/c/${activeClient.client.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      window.prompt('Copie o link do cliente:', url)
    }
  }

  // Get page title from path
  const getPageTitle = (): string => {
    const path = location.pathname
    // Exact match
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    // Prefix match (e.g. /editor/123)
    const prefix = Object.keys(PAGE_TITLES).find((k) => path.startsWith(k))
    return prefix ? PAGE_TITLES[prefix] : 'Ads Flow'
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 h-16 bg-[var(--surface-header)] glass border-b border-[var(--border-subtle)] flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300 ${
        collapsed ? 'md:left-[68px]' : 'md:left-60'
      }`}
    >
      {/* ---- Left: Hamburger + Client identity (when in client context)
                    OR page title (when in staff context) ---- */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 -ml-1 text-[var(--text-secondary)] hover:bg-[var(--color-neutral-100)] rounded-lg md:hidden flex-shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {inClientContext && activeClient ? (
          <div className="flex items-center gap-2 min-w-0">
            {/* Back to operations (staff only) */}
            {isGlobalAdmin && (
              <button
                onClick={() => navigate('/_v4/operations')}
                className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-md hover:bg-[var(--color-neutral-100)] transition-colors flex-shrink-0"
                title="Voltar à visão da agência"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Operações
              </button>
            )}

            <div className="hidden md:block w-px h-5 bg-[var(--border-subtle)]" />

            {/* Client identity */}
            <ClientBrand
              name={activeClient.client.name}
              slug={activeClient.client.slug}
              logoUrl={activeClient.client.logo_url}
              size="sm"
              subtitle="Ads Flow"
            />
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {getPageTitle()}
          </h1>
        )}
      </div>

      {/* ---- Right: Share + Search + Notifications + User ---- */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Copy client share link — staff only, client context only */}
        {inClientContext && isGlobalAdmin && activeClient && (
          <button
            onClick={copyClientLink}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              linkCopied
                ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border border-[var(--color-success-500)]/30'
                : 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] hover:bg-[var(--color-brand-100)]'
            }`}
            title="Copiar link de acesso do cliente"
          >
            {linkCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Link copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Link do cliente
              </>
            )}
          </button>
        )}

        {/* Search (opens command palette) */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] border border-[var(--border-subtle)] rounded-lg transition-colors"
          aria-label="Buscar (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs text-[var(--text-tertiary)]">Buscar...</span>
          <kbd className="hidden sm:inline text-[10px] text-[var(--color-neutral-300)] bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationPanel />
      </div>
    </header>
  )
}
