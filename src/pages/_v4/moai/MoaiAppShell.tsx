import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, TrendingUp, Heart, Building2, Megaphone, DollarSign,
  Settings2, UsersRound, Target, Handshake, TestTube2, Sparkles, Shield, Search,
  Bell, ChevronLeft, Menu, X, BarChart3, Workflow,
} from 'lucide-react'
import { CURRENT_TENANT } from '@/lib/tenant'
import { useAuth } from '@/contexts/AuthContext'
import { MoaiPeriodProvider } from '@/contexts/MoaiPeriodContext'
import { MoaiPeriodPicker } from './MoaiPeriodPicker'
import {
  resolveMoaiAccess, loadDashboardVisibility, SUPER_ADMIN_ACCESS,
  type MoaiAccess, type DashboardVisibilityMap,
} from '@/lib/moaiAuthorization'

type ModuleGroup = 'Decisão' | 'Growth' | 'Relacionamento' | 'Gestão'

export interface MoaiModule {
  id: string
  slug: string
  label: string
  shortLabel: string
  icon: typeof LayoutDashboard
  description: string
  group: ModuleGroup
}

export const MOAI_MODULES: MoaiModule[] = [
  { id: 'moai_executive_pulse', slug: 'cockpit', label: 'Cockpit', shortLabel: 'Cock', icon: LayoutDashboard, description: 'Visão 360 executiva', group: 'Decisão' },
  { id: 'moai_estrategia', slug: 'estrategia', label: 'Estratégia', shortLabel: 'Est', icon: Target, description: 'PE 2026 + OKRs', group: 'Decisão' },
  { id: 'moai_estrategia', slug: 'planner', label: 'Planner', shortLabel: 'Plan', icon: Workflow, description: 'Mapas de growth e jornadas', group: 'Decisão' },
  { id: 'moai_conteudo_mkt', slug: 'midia', label: 'Mídia & Ads', shortLabel: 'Ads', icon: BarChart3, description: 'Meta, Google e conversão', group: 'Growth' },
  { id: 'moai_sales_crm', slug: 'sales', label: 'Sales + CRM', shortLabel: 'Sales', icon: TrendingUp, description: 'Pipeline Clint', group: 'Growth' },
  { id: 'moai_conteudo_mkt', slug: 'conteudo', label: 'Conteúdo', shortLabel: 'Cont', icon: Megaphone, description: 'Cronograma e social', group: 'Growth' },
  { id: 'moai_parcerias', slug: 'parcerias', label: 'Parcerias', shortLabel: 'Parc', icon: Handshake, description: 'Patrocínios + Atas', group: 'Growth' },
  { id: 'moai_membros_carteiras', slug: 'membros', label: 'Membros', shortLabel: 'Mem', icon: Users, description: 'Carteiras e jornadas', group: 'Relacionamento' },
  { id: 'moai_cx_nps', slug: 'cx', label: 'CX & NPS', shortLabel: 'CX', icon: Heart, description: 'Saúde dos membros', group: 'Relacionamento' },
  { id: 'moai_conselhos', slug: 'conselhos', label: 'Conselhos', shortLabel: 'Cons', icon: Building2, description: 'Conselhos estratégicos', group: 'Relacionamento' },
  { id: 'moai_financeiro', slug: 'financeiro', label: 'Financeiro', shortLabel: 'Fin', icon: DollarSign, description: 'Inadimplência + churn', group: 'Gestão' },
  { id: 'moai_operacoes', slug: 'operacoes', label: 'Operações', shortLabel: 'Ops', icon: Settings2, description: 'Eventos + compras', group: 'Gestão' },
  { id: 'moai_time', slug: 'time', label: 'Time & RH', shortLabel: 'Time', icon: UsersRound, description: 'Colaboradores + GTDs', group: 'Gestão' },
  { id: 'moai_turn_lab', slug: 'turn-lab', label: 'Turn Lab', shortLabel: 'TL', icon: TestTube2, description: 'Experimentos + NPS', group: 'Gestão' },
  { id: 'moai_ia', slug: 'ia', label: 'IA & Insights', shortLabel: 'IA', icon: Sparkles, description: 'Chat + alertas + reports', group: 'Gestão' },
  { id: 'moai_admin', slug: 'admin', label: 'Admin', shortLabel: 'Adm', icon: Shield, description: 'Usuários + integrações', group: 'Gestão' },
]
const GROUPS: ModuleGroup[] = ['Decisão', 'Growth', 'Relacionamento', 'Gestão']

export default function MoaiAppShell() {
  const { user } = useAuth()
  const location = useLocation()
  const tenant = CURRENT_TENANT
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [access, setAccess] = useState<MoaiAccess | null>(null)
  const [visibility, setVisibility] = useState<DashboardVisibilityMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => {
    let alive = true
    async function run() {
      if (!user) {
        if (alive) {
          setAccess(SUPER_ADMIN_ACCESS)
          const allFull: DashboardVisibilityMap = {}
          MOAI_MODULES.forEach((module) => { allFull[module.id] = 'full' })
          setVisibility(allFull)
          setLoaded(true)
        }
        return
      }
      const resolved = await resolveMoaiAccess(user.id)
      if (!alive) return
      if (!resolved) { setAccess(null); setLoaded(true); return }
      const map = await loadDashboardVisibility(resolved.role)
      if (!alive) return
      setAccess(resolved)
      setVisibility(map)
      setLoaded(true)
    }
    void run()
    return () => { alive = false }
  }, [user])

  const visibleModules = MOAI_MODULES.filter((module) => {
    const mode = visibility[module.id]
    return mode === 'full' || mode === 'scoped'
  })

  if (loaded && !access) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F4F7F9] p-6"><div className="max-w-md text-center"><Shield className="mx-auto mb-3 text-gray-400" size={40} /><h1 className="text-xl font-bold text-[#152033]">Acesso restrito</h1><p className="mt-2 text-sm text-gray-500">Seu usuário não tem permissão para acessar a plataforma MOAI.</p></div></div>
  }

  const sidebarWidth = collapsed ? 'lg:w-16' : 'lg:w-60'
  const mainOffset = collapsed ? 'lg:ml-16' : 'lg:ml-60'

  return (
    <MoaiPeriodProvider>
      <div className="min-h-screen bg-[#F4F7F9] text-[#152033]">
        {mobileOpen && <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/45 lg:hidden" />}
        <aside className={`${sidebarWidth} fixed inset-y-0 left-0 z-40 flex w-[min(86vw,280px)] flex-col border-r border-[#DDE3EA] bg-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-14 items-center border-b border-white/10 px-3 text-white" style={{ background: tenant.brand.primary }}>
            <div className="flex-1">{!collapsed && <><div className="text-[9px] font-semibold uppercase text-white/55">Intelligence OS</div><div className="text-sm font-bold">MOAI</div></>}</div>
            <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
            <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 lg:flex" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>{collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}</button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {GROUPS.map((group) => {
              const modules = visibleModules.filter((module) => module.group === group)
              if (!modules.length) return null
              return <div key={group} className="mb-3">
                {!collapsed && <div className="px-2 pb-1 pt-2 text-[9px] font-bold uppercase text-gray-400">{group}</div>}
                <div className="space-y-0.5">{modules.map((module) => {
                  const Icon = module.icon
                  return <NavLink key={module.slug} to={`/moai/${module.slug}`} title={collapsed ? module.label : undefined} className={({ isActive }) => `group flex min-h-10 items-center gap-2.5 rounded-md px-2 text-xs font-semibold transition-colors ${isActive ? 'bg-[#152033] text-white' : 'text-gray-600 hover:bg-[#EEF3F6] hover:text-[#152033]'}`}>
                    <Icon size={16} className="shrink-0" />{!collapsed && <><span className="flex-1 truncate">{module.label}</span>{visibility[module.id] === 'scoped' && <span className="text-[9px] text-gray-400">escopo</span>}</>}
                  </NavLink>
                })}</div>
              </div>
            })}
          </nav>

          {!collapsed && access && <div className="border-t border-[#DDE3EA] p-3"><div className="truncate text-xs font-bold text-[#152033]">{access.displayName ?? 'Usuário'}</div><div className="mt-0.5 text-[9px] font-semibold uppercase text-gray-400">{access.role}</div></div>}
        </aside>

        <main className={`${mainOffset} min-w-0 transition-[margin] duration-200`}>
          <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-[#DDE3EA] bg-white px-3 sm:gap-4 sm:px-5">
            <button type="button" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#DDE3EA] lg:hidden" aria-label="Abrir menu"><Menu size={18} /></button>
            <Breadcrumb pathname={location.pathname} />
            <div className="hidden max-w-sm flex-1 md:block"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="search" aria-label="Busca global" placeholder="Buscar membro, deal, campanha..." className="h-9 w-full rounded-md border border-[#DDE3EA] pl-9 pr-3 text-xs focus:border-[#152033] focus:outline-none" /></div></div>
            <div className="ml-auto min-w-0"><MoaiPeriodPicker /></div>
            <button type="button" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" aria-label="Alertas"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" /></button>
          </header>
          <div className="min-w-0 px-3 py-4 sm:px-5 sm:py-5"><Outlet /></div>
        </main>
      </div>
    </MoaiPeriodProvider>
  )
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean)
  const current = parts[parts.length - 1]?.replace(/-/g, ' ') ?? 'cockpit'
  return <div className="min-w-0 shrink"><div className="text-[9px] font-semibold uppercase text-gray-400">MOAI</div><div className="truncate text-xs font-bold capitalize text-[#152033]">{current}</div></div>
}
