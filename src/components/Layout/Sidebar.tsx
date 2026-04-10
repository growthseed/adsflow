/**
 * ============================================
 * SIDEBAR — Modern Navigation
 * ============================================
 * Redesign: hierarquia clara, agrupamento intuitivo,
 * ícones consistentes, visual profissional.
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ClientRole } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Link2,
  GitBranch,
  BarChart3,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Shield,
  CreditCard,
  FolderKanban,
  LogOut,
  Sparkles,
  BookOpen,
} from 'lucide-react'

// ========== NAV CONFIG ==========
// v4 — Estrutura dos 3 pilares (Planner / Performance / Projeto)
// Nível 1 (Agency) sempre visível. Nível 2-4 (Client modules) só aparecem
// quando o usuário está dentro de um cliente específico (/c/:slug/*).

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  minRole?: ClientRole
  superAdminOnly?: boolean
  badge?: string
  isNew?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

/** Nível 1 — navegação da agência (sempre visível) */
const AGENCY_SECTIONS: NavSection[] = [
  {
    title: '',
    items: [
      { path: '/_v4/operations', label: 'Visão Geral', icon: LayoutDashboard },
      { path: '/clients', label: 'Clientes', icon: FolderKanban, minRole: 'admin' },
      { path: '/playbook', label: 'Playbook', icon: BookOpen, isNew: true },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { path: '/integrations', label: 'Integrações', icon: Link2, minRole: 'manager' },
      { path: '/team', label: 'Equipe', icon: Users, minRole: 'admin' },
      { path: '/billing', label: 'Planos & Billing', icon: CreditCard, minRole: 'owner' },
      { path: '/settings', label: 'Marca & Ajustes', icon: Settings, minRole: 'manager' },
      { path: '/admin', label: 'Admin', icon: Shield, superAdminOnly: true },
    ],
  },
]

/** Nível 2-4 — pilares do cliente (renderizados quando dentro de /c/:slug/*) */
function getClientSections(clientSlug: string): NavSection[] {
  return [
    {
      title: 'Cliente',
      items: [
        {
          path: `/c/${clientSlug}/overview`,
          label: 'Visão Geral',
          icon: LayoutDashboard,
        },
        {
          path: `/c/${clientSlug}/planner`,
          label: 'Planner',
          icon: GitBranch,
        },
        {
          path: `/c/${clientSlug}/performance`,
          label: 'Performance',
          icon: BarChart3,
        },
        {
          path: `/c/${clientSlug}/projeto`,
          label: 'Projeto',
          icon: CheckSquare,
        },
      ],
    },
  ]
}

// ========== COMPONENT ==========

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, clients, activeClient, setActiveClient, hasClientRole, isSuperAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    // Exact match for agency-level routes
    if (path.startsWith('/_v4/') || path === '/clients' || path === '/integrations' ||
        path === '/team' || path === '/billing' || path === '/settings' || path === '/admin' ||
        path === '/playbook') {
      return location.pathname === path
    }
    // Client-scoped routes match their own segment
    return location.pathname === path
  }

  // Detect if we're inside a client context: /c/:slug/<module>
  const clientMatch = location.pathname.match(/^\/c\/([^/]+)/)
  const currentClientSlug = clientMatch?.[1]
  const clientSections = currentClientSlug ? getClientSections(currentClientSlug) : []

  // Compose nav sections: client sections first (when inside a client), then agency
  const NAV_SECTIONS: NavSection[] = currentClientSlug
    ? [...clientSections, ...AGENCY_SECTIONS]
    : AGENCY_SECTIONS

  const canSeeItem = (item: NavItem): boolean => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.minRole) return hasClientRole(item.minRole)
    return true
  }

  const handleClientSwitch = (clientId: string) => {
    setActiveClient(clientId)
    setClientDropdownOpen(false)
    // Navigate to the client's overview — find the slug from the membership
    const membership = clients.find((c) => c.client_id === clientId)
    if (membership) {
      navigate(`/c/${membership.client.slug}/overview`)
    }
  }

  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col z-40 transition-all duration-300 border-r border-slate-200 bg-white ${
        collapsed ? 'w-[68px]' : 'w-60'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* ── Logo ── */}
      <div className="flex items-center h-14 px-4 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-2.5">
            <span className="text-base font-bold text-slate-900 tracking-tight">AdsFlow</span>
            <span className="text-[10px] ml-1 text-slate-400 font-medium">Efeito Digital</span>
          </div>
        )}
      </div>

      {/* ── Client Switcher ── */}
      {clients.length > 0 && (
        <div className="px-3 py-2.5 border-b border-slate-100 shrink-0" ref={dropdownRef}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title={activeClient?.client.name || 'Selecionar cliente'}
            >
              {activeClient?.client.logo_url ? (
                <img src={activeClient.client.logo_url} alt="" className="w-7 h-7 rounded-md object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
              >
                {activeClient?.client.logo_url ? (
                  <img src={activeClient.client.logo_url} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activeClient?.client.name || 'Selecionar'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {clientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                  {clients.map((membership) => (
                    <button
                      key={membership.client_id}
                      onClick={() => handleClientSwitch(membership.client_id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        activeClient?.client_id === membership.client_id
                          ? 'bg-blue-50 border-l-2 border-blue-600'
                          : ''
                      }`}
                    >
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{membership.client.name}</p>
                        <p className="text-[10px] text-slate-400">{membership.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(canSeeItem)
          if (visibleItems.length === 0) return null

          return (
            <div key={sIdx}>
              {section.title && !collapsed && (
                <p className="px-2.5 pt-4 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              {!section.title && sIdx > 0 && (
                <div className="my-2 mx-2 border-t border-slate-100" />
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
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group relative ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] font-medium truncate">{item.label}</span>
                          {item.isNew && (
                            <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              Novo
                            </span>
                          )}
                          {item.badge && (
                            <span className="ml-auto text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && item.isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User Card ── */}
      <div className="border-t border-slate-100 px-2.5 py-2.5 shrink-0">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configurações
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-white border border-slate-200 rounded-full hidden md:flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors z-50 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
