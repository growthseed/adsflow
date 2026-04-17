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
  Target,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
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
      { path: '/_v4/operations', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/clients', label: 'Clientes', icon: FolderKanban, minRole: 'admin' },
      { path: '/playbook', label: 'Playbook', icon: BookOpen, isNew: true },
    ],
  },
]

/** Client sections — Performance / CRM / Projeto */
function getClientSections(clientSlug: string): NavSection[] {
  return [
    {
      title: 'Performance',
      items: [
        { path: `/c/${clientSlug}/overview`, label: 'Dashboard', icon: LayoutDashboard },
        { path: `/c/${clientSlug}/meta-ads`, label: 'Meta Ads', icon: Target },
        { path: `/c/${clientSlug}/performance`, label: 'Google Ads', icon: BarChart3 },
      ],
    },
    {
      title: 'CRM',
      items: [
        { path: `/c/${clientSlug}/crm/funil`, label: 'Funil de vendas', icon: TrendingUp },
        { path: `/c/${clientSlug}/crm/perdas`, label: 'Perdas', icon: TrendingDown },
      ],
    },
    {
      title: 'Projeto',
      items: [
        { path: `/c/${clientSlug}/planner`, label: 'Planner', icon: GitBranch },
        { path: `/c/${clientSlug}/projeto`, label: 'Demandas', icon: CheckSquare },
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
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('adsflow-theme', next ? 'dark' : 'light')
  }

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
      className={`fixed top-0 left-0 h-screen flex flex-col z-40 transition-all duration-300 border-r border-[var(--border-subtle)] bg-[var(--surface-sidebar)] ${
        collapsed ? 'w-[68px]' : 'w-60'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* ── Logo ── */}
      <div className="flex items-center h-14 px-4 border-b border-[var(--color-neutral-100)] shrink-0">
        <div className="w-8 h-8 bg-[var(--color-brand-600)] rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-2.5">
            <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">Ads Flow</span>
            <span className="block text-[10px] text-[var(--text-tertiary)] font-medium -mt-0.5">by Efeito Digital</span>
          </div>
        )}
      </div>

      {/* ── Client Switcher ── */}
      {clients.length > 0 && (
        <div className="px-3 py-2.5 border-b border-[var(--color-neutral-100)] shrink-0" ref={dropdownRef}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-[var(--color-neutral-50)] transition-colors"
              title={activeClient?.client.name || 'Selecionar cliente'}
            >
              {activeClient?.client.logo_url ? (
                <img src={activeClient.client.logo_url} alt="" className="w-7 h-7 rounded-md object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-[var(--color-neutral-400)]" />
              )}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors text-left group"
              >
                {activeClient?.client.logo_url ? (
                  <img src={activeClient.client.logo_url} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 bg-[var(--color-brand-50)] rounded-md flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[var(--color-brand-600)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {activeClient?.client.name || 'Selecionar'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-neutral-400)] shrink-0 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {clientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                  {clients.map((membership) => (
                    <button
                      key={membership.client_id}
                      onClick={() => handleClientSwitch(membership.client_id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--color-neutral-50)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        activeClient?.client_id === membership.client_id
                          ? 'bg-[var(--color-brand-50)] border-l-2 border-[var(--color-brand-600)]'
                          : ''
                      }`}
                    >
                      <div className="w-6 h-6 bg-[var(--color-neutral-100)] rounded flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{membership.client.name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{membership.role}</p>
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
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(canSeeItem)
          if (visibleItems.length === 0) return null

          return (
            <div key={sIdx}>
              {section.title && !collapsed && (
                <p className="px-2 pt-5 pb-2 text-[10px] font-semibold text-[var(--color-neutral-400)] uppercase tracking-[0.08em]">
                  {section.title}
                </p>
              )}
              {!section.title && sIdx > 0 && (
                <div className="my-3 mx-2 border-t border-[var(--color-neutral-100)]" />
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
                      className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-all group relative ${
                        active
                          ? 'bg-[var(--color-neutral-50)] text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--text-primary)]'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {/* Active dot indicator (Lovable style) */}
                      {active && !collapsed && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-brand-600)]" />
                      )}
                      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-neutral-400)] group-hover:text-[var(--color-neutral-600)]'}`} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] truncate">{item.label}</span>
                          {item.isNew && (
                            <span className="ml-auto text-[9px] bg-[var(--color-success-50)] text-[var(--color-success-700)] px-1.5 py-0.5 rounded-full font-bold uppercase">
                              Novo
                            </span>
                          )}
                          {item.badge && (
                            <span className="ml-auto text-[9px] bg-[var(--color-brand-50)] text-[var(--color-brand-700)] px-1.5 py-0.5 rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && active && (
                        <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-brand-600)]" />
                      )}
                      {collapsed && item.isNew && !active && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-success-500)] rounded-full" />
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
      <div className="border-t border-[var(--color-neutral-100)] px-3 py-2.5 shrink-0">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center"
          >
            <div className="w-8 h-8 bg-[var(--color-brand-600)] rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-neutral-50)] transition-colors text-left"
            >
              <div className="w-8 h-8 bg-[var(--color-brand-600)] rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">{user?.email || ''}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-neutral-300)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl z-20 py-1">
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
                  >
                    <Settings className="w-4 h-4 text-[var(--color-neutral-400)]" />
                    Configurações
                  </Link>
                  <Link
                    to="/integrations"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
                  >
                    <Link2 className="w-4 h-4 text-[var(--color-neutral-400)]" />
                    Integrações
                  </Link>
                  <Link
                    to="/team"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
                  >
                    <Users className="w-4 h-4 text-[var(--color-neutral-400)]" />
                    Equipe
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
                    >
                      <Shield className="w-4 h-4 text-[var(--color-neutral-400)]" />
                      Admin
                    </Link>
                  )}
                  <div className="border-t border-[var(--border-subtle)] my-1" />
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-[var(--color-neutral-400)]" /> : <Moon className="w-4 h-4 text-[var(--color-neutral-400)]" />}
                    {isDark ? 'Modo claro' : 'Modo escuro'}
                  </button>
                  <div className="border-t border-[var(--border-subtle)] my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-error-600)] hover:bg-[var(--color-error-50)]"
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
        className="absolute -right-3 top-[72px] w-6 h-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-full hidden md:flex items-center justify-center text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] hover:border-[var(--border-default)] transition-colors z-50 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
