/**
 * ============================================
 * <MoaiDashboardPage> — Portal MOAI 360° (PoC)
 * ============================================
 * Visão proof-of-concept dos 6 dashboards MOAI rodando no Ad Flow.
 *
 *   /moai                          → redirect pra /moai/executive
 *   /moai/executive                → Executive Pulse
 *   /moai/sales                    → Sales + CRM
 *   /moai/cx-nps                   → CX & NPS
 *   /moai/membros                  → Membros & Carteiras por mentor
 *   /moai/conteudo                 → Conteúdo & Marketing
 *   /moai/financeiro               → Financeiro
 *
 * Atualmente usa MOAI_MOCK_SNAPSHOT (dados estáticos). Substituir pelo
 * fetch da Edge Function `snapshot-builder-moai` quando estiver pronta.
 * ============================================
 */

import { useEffect, useState } from 'react'
import { useParams, NavLink, Navigate } from 'react-router-dom'
import { WidgetRenderer } from '@/components/canonical/widgets'
import { MOAI_TEMPLATES, type MoaiTemplateId } from '@/data/moaiTemplates'
import { CURRENT_TENANT } from '@/lib/tenant'
import { useMoaiSnapshot } from '@/hooks/useMoaiSnapshot'
import {
  resolveMoaiAccess,
  loadDashboardVisibility,
  SUPER_ADMIN_ACCESS,
  DEFAULT_VISIBILITY_MAP_SUPER_ADMIN,
  type MoaiAccess,
  type DashboardId,
  type DashboardVisibilityMap,
} from '@/lib/moaiAuthorization'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  slug: string
  tid: MoaiTemplateId
  dashboardId: DashboardId
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { slug: 'executive',  tid: 'executive_pulse',   dashboardId: 'moai_executive_pulse',   label: 'Executive Pulse',     icon: '🎯' },
  { slug: 'sales',      tid: 'sales_crm',         dashboardId: 'moai_sales_crm',         label: 'Sales + CRM',         icon: '🔵' },
  { slug: 'cx-nps',     tid: 'cx_nps',            dashboardId: 'moai_cx_nps',            label: 'CX & NPS',            icon: '🟢' },
  { slug: 'membros',    tid: 'membros_carteiras', dashboardId: 'moai_membros_carteiras', label: 'Membros & Carteiras', icon: '🟢' },
  { slug: 'conteudo',   tid: 'conteudo_mkt',      dashboardId: 'moai_conteudo_mkt',      label: 'Conteúdo & Mídia',    icon: '🟡' },
  { slug: 'financeiro', tid: 'financeiro',        dashboardId: 'moai_financeiro',        label: 'Financeiro',          icon: '🔴' },
]

export default function MoaiDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [access, setAccess] = useState<MoaiAccess | null>(null)
  const [visibility, setVisibility] = useState<DashboardVisibilityMap>(DEFAULT_VISIBILITY_MAP_SUPER_ADMIN)
  const [loaded, setLoaded] = useState(false)

  // Resolve access do user logado (ou fallback super_admin em dev)
  useEffect(() => {
    let alive = true
    async function run() {
      if (!user) {
        // Dev/sem auth: default pra super_admin
        if (alive) {
          setAccess(SUPER_ADMIN_ACCESS)
          setVisibility(DEFAULT_VISIBILITY_MAP_SUPER_ADMIN)
          setLoaded(true)
        }
        return
      }
      const a = await resolveMoaiAccess(user.id)
      if (!alive) return
      if (!a) {
        setAccess(null)
        setLoaded(true)
        return
      }
      const v = await loadDashboardVisibility(a.role)
      if (!alive) return
      setAccess(a)
      setVisibility(v)
      setLoaded(true)
    }
    run()
    return () => { alive = false }
  }, [user])

  const { snapshot, status: snapshotStatus, error: snapshotError, refetch } = useMoaiSnapshot()
  const item = NAV.find((n) => n.slug === slug)

  if (!slug) return <Navigate to="/moai/executive" replace />
  if (!item) return <Navigate to="/moai/executive" replace />

  // Filtra nav pelos dashboards permitidos
  const visibleNav = NAV.filter((n) => {
    const mode = visibility[n.dashboardId]
    return mode === 'full' || mode === 'scoped'
  })

  const itemVisibility = visibility[item.dashboardId] ?? 'forbidden'
  const template = MOAI_TEMPLATES[item.tid]
  const tenant = CURRENT_TENANT
  const isMoaiTenant = tenant.id === 'moai'

  // Bloqueia se sem acesso (após carregar)
  if (loaded && !access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="max-w-md text-center p-8">
          <h1 className="text-xl font-bold text-[#1A1F36] mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500">
            Seu usuário não tem permissão pra acessar o portal MOAI. Solicite acesso ao admin (Vinicius ou Efeito Digital).
          </p>
        </div>
      </div>
    )
  }

  // Bloqueia se dashboard especifico forbidden
  if (loaded && itemVisibility === 'forbidden') {
    const fallback = visibleNav[0]
    if (fallback) return <Navigate to={`/moai/${fallback.slug}`} replace />
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="max-w-md text-center p-8">
          <h1 className="text-xl font-bold text-[#1A1F36] mb-2">Sem dashboards disponíveis</h1>
          <p className="text-sm text-gray-500">
            Seu papel ({access?.role}) não tem dashboards visíveis configurados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header MOAI */}
      <header
        className="border-b border-[#E5E7EB]"
        style={{ background: tenant.brand.primary, color: tenant.brand.primaryFg }}
      >
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            {!isMoaiTenant && (
              <div className="text-[10px] uppercase tracking-widest opacity-60">
                powered by Ad Flow · Efeito Digital
              </div>
            )}
            <h1 className={`text-lg font-bold ${!isMoaiTenant ? 'mt-1' : ''}`}>
              MOAI · Clube de Líderes
            </h1>
          </div>
          <div className="text-xs opacity-80 flex items-center gap-2">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                snapshotStatus === 'live'
                  ? 'bg-emerald-400'
                  : snapshotStatus === 'loading'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-gray-400'
              }`}
            />
            <span>
              {snapshotStatus === 'live' && 'Dados ao vivo'}
              {snapshotStatus === 'loading' && 'Sincronizando...'}
              {snapshotStatus === 'mock' && 'Mock (Edge Function ainda não rodou)'}
            </span>
            <span>· {new Date(snapshot.last_synced_at).toLocaleString('pt-BR')}</span>
            <button
              type="button"
              onClick={refetch}
              className="ml-2 text-[10px] underline opacity-70 hover:opacity-100"
              title={snapshotError ?? ''}
            >
              ↻
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation - filtrada por permissão */}
      <nav className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {visibleNav.map((n) => (
              <NavLink
                key={n.slug}
                to={`/moai/${n.slug}`}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#1A1F36] text-[#1A1F36]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <span className="mr-1.5">{n.icon}</span>
                {n.label}
                {visibility[n.dashboardId] === 'scoped' && (
                  <span className="ml-1 text-[10px] text-gray-400">⊙</span>
                )}
              </NavLink>
            ))}
            {access?.role && access.role !== 'super_admin' && (
              <div className="ml-auto px-3 py-3 text-[10px] uppercase tracking-wider text-gray-400">
                Logado como: <span className="font-semibold text-gray-600">{access.role}</span>
                {Object.keys(access.scopeFilter).length > 0 && (
                  <span className="ml-2">· escopo: {JSON.stringify(access.scopeFilter)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Page title */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1A1F36]">{template.name}</h2>
          <p className="text-sm text-gray-500">{template.description}</p>
        </div>

        {/* Dashboard widgets */}
        <WidgetRenderer template={template} snapshot={snapshot} />

        {/* Footer disclosure */}
        <div className="mt-12 pt-6 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          MOAI Portal v2.1 · {tenant.showAdFlowFooter ? 'Plataforma: Ad Flow by Efeito Digital' : '© MOAI Clube de Líderes'}
        </div>
      </main>
    </div>
  )
}
