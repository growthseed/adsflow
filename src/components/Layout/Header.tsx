/**
 * ============================================
 * HEADER - Top Bar com User Menu
 * ============================================
 * Data: 2026-02-13
 * Header responsivo com breadcrumb, busca,
 * notificações e user dropdown.
 */

import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCommandPalette } from '@/components/UI/CommandPalette'
import {
  Search,
  LogOut,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
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
  const { user, activeClient, signOut, isGlobalAdmin } = useAuth()
  const { open: openSearch } = useCommandPalette()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Are we inside a specific client's context?
  const inClientContext = /^\/c\/[^/]+\//.test(location.pathname)

  const copyClientLink = async () => {
    if (!activeClient) return
    const url = `${window.location.origin}/c/${activeClient.client.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Fallback: select in a hidden input
      window.prompt('Copie o link do cliente:', url)
    }
  }

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Get page title from path
  const getPageTitle = (): string => {
    const path = location.pathname
    // Exact match
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    // Prefix match (e.g. /editor/123)
    const prefix = Object.keys(PAGE_TITLES).find((k) => path.startsWith(k))
    return prefix ? PAGE_TITLES[prefix] : 'Ads Flow'
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await signOut()
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300 ${
        collapsed ? 'md:left-[68px]' : 'md:left-60'
      }`}
    >
      {/* ---- Left: Hamburger + Client identity (when in client context)
                    OR page title (when in staff context) ---- */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden flex-shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {inClientContext && activeClient ? (
          <>
            {/* Back to operations (staff only) */}
            {isGlobalAdmin && (
              <button
                onClick={() => navigate('/_v4/operations')}
                className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Voltar à visão da agência"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Operações
              </button>
            )}

            {/* Client identity (prominent) */}
            <ClientBrand
              name={activeClient.client.name}
              slug={activeClient.client.slug}
              logoUrl={activeClient.client.logo_url}
              size="sm"
              subtitle={getPageTitle()}
            />
          </>
        ) : (
          <h1 className="text-lg font-semibold text-slate-900 truncate">
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
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
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
          className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          aria-label="Buscar (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs text-slate-400">Buscar...</span>
          <kbd className="hidden sm:inline text-[10px] text-slate-300 bg-white border border-slate-200 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationPanel />

        {/* Separator */}
        <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Menu do usuário"
            aria-expanded={userMenuOpen}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {user?.globalRole === 'super_admin'
                  ? 'Super Admin'
                  : user?.globalRole === 'admin'
                    ? 'Administrador'
                    : 'Usuário'}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>

              {/* Links */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Meu Perfil
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Configurações
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Ajuda & Suporte
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
