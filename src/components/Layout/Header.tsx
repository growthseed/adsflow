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
import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  Building2,
} from 'lucide-react'

// ========== BREADCRUMB MAP ==========

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/editor': 'Flow Editor',
  '/bi': 'B.I. & Analytics',
  '/campaigns': 'Campanhas',
  '/funnels': 'Funis',
  '/integrations': 'Integrações',
  '/reports': 'Relatórios',
  '/clients': 'Clientes',
  '/team': 'Equipe',
  '/billing': 'Faturamento',
  '/settings': 'Configurações',
  '/admin': 'Admin Global',
}

// ========== COMPONENT ==========

interface HeaderProps {
  collapsed: boolean
}

export default function Header({ collapsed }: HeaderProps) {
  const { user, activeClient, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

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
      className={`fixed top-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        collapsed ? 'left-[72px]' : 'left-64'
      }`}
    >
      {/* ---- Left: Page Title + Client Badge ---- */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {getPageTitle()}
        </h1>
        {activeClient && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            <Building2 className="w-3 h-3" />
            {activeClient.client.name}
          </span>
        )}
      </div>

      {/* ---- Right: Search + Notifications + User ---- */}
      <div className="flex items-center gap-2">
        {/* Search Toggle */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Buscar..."
                className="w-48 sm:w-64 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {/* Dot indicator — future: bind to real notifications */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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
