/**
 * ============================================
 * SIDEBAR - Multi-tenant Navigation
 * ============================================
 * Data: 2026-02-13
 * Sidebar colapsável com client switcher,
 * navegação role-based e indicador de plano.
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ClientRole } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Shield,
  CreditCard,
  FolderKanban,
  Target,
  Megaphone,
  Link2,
  FileText,
} from 'lucide-react'

// ========== NAV CONFIG ==========

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  minRole?: ClientRole
  superAdminOnly?: boolean
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/editor', label: 'Flows', icon: GitBranch },
      { path: '/bi', label: 'B.I. & Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { path: '/campaigns', label: 'Campanhas', icon: Megaphone, minRole: 'analyst' },
      { path: '/funnels', label: 'Funis', icon: Target, minRole: 'analyst' },
      { path: '/integrations', label: 'Integrações', icon: Link2, minRole: 'manager' },
      { path: '/reports', label: 'Relatórios', icon: FileText, minRole: 'analyst' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { path: '/clients', label: 'Clientes', icon: FolderKanban, minRole: 'admin' },
      { path: '/team', label: 'Equipe', icon: Users, minRole: 'admin' },
      { path: '/billing', label: 'Faturamento', icon: CreditCard, minRole: 'owner' },
      { path: '/settings', label: 'Configurações', icon: Settings, minRole: 'manager' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { path: '/admin', label: 'Admin Global', icon: Shield, superAdminOnly: true },
    ],
  },
]

// ========== COMPONENT ==========

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, clients, activeClient, setActiveClient, hasClientRole, isSuperAdmin } = useAuth()
  const location = useLocation()
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path: string) => {
    if (path === '/editor') {
      return location.pathname.startsWith('/editor')
    }
    return location.pathname === path
  }

  const canSeeItem = (item: NavItem): boolean => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.minRole) return hasClientRole(item.minRole)
    return true
  }

  const handleClientSwitch = (clientId: string) => {
    setActiveClient(clientId)
    setClientDropdownOpen(false)
  }

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900 text-white flex flex-col z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* ---- Logo ---- */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-bold tracking-tight whitespace-nowrap">
            Ads Flow
          </span>
        )}
      </div>

      {/* ---- Client Switcher ---- */}
      {clients.length > 0 && (
        <div className="px-3 py-3 border-b border-slate-800 shrink-0" ref={dropdownRef}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title={activeClient?.client.name || 'Selecionar cliente'}
            >
              <Building2 className="w-5 h-5 text-slate-400" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
              >
                {activeClient?.client.logo_url ? (
                  <img
                    src={activeClient.client.logo_url}
                    alt=""
                    className="w-6 h-6 rounded object-cover shrink-0"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {activeClient?.client.name || 'Selecionar'}
                  </p>
                  {activeClient?.role && (
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {activeClient.role}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    clientDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {clientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                  {clients.map((membership) => (
                    <button
                      key={membership.client_id}
                      onClick={() => handleClientSwitch(membership.client_id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        activeClient?.client_id === membership.client_id
                          ? 'bg-blue-600/20 border-l-2 border-blue-500'
                          : ''
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{membership.client.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{membership.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- Navigation ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(canSeeItem)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : ''}`} />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ---- User mini card ---- */}
      <div className="border-t border-slate-800 px-3 py-3 shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* ---- Collapse Toggle (desktop only) ---- */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full hidden md:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  )
}
