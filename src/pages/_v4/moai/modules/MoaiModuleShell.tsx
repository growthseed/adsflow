/**
 * <MoaiModuleShell> — wrapper visual reusado pelos 13 módulos.
 * Renderiza: title + description + sub-nav (abas filhas) + content.
 *
 * Usado por TODOS os módulos pra padronizar o layout interno.
 */

import { NavLink, useLocation, type To } from 'react-router-dom'
import { Activity, ArrowUpRight, CheckCircle2, Radar, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ModuleTab {
  to: To
  label: string
  end?: boolean
  badge?: string | number
}

interface Props {
  title: string
  description?: string
  tabs?: ModuleTab[]
  rightActions?: ReactNode
  children: ReactNode
}

export function MoaiModuleShell({ title, description, tabs, rightActions, children }: Props) {
  const { pathname } = useLocation()
  // Base absoluta do módulo: /moai/{slug} — sempre os 3 primeiros segmentos.
  // Resolve o bug de NavLink relativo acumular segmentos ao navegar entre sub-rotas.
  const moduleBase = '/' + pathname.split('/').filter(Boolean).slice(0, 2).join('/')

  function toAbsolute(to: To): string {
    const s = String(to)
    if (s === '' || s === '.') return moduleBase
    if (s.startsWith('/')) return s
    return `${moduleBase}/${s}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A1F36] leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
      </div>

      {/* Sub-tabs */}
      {tabs && tabs.length > 0 && (
        <nav className="border-b border-[#E5E7EB]">
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t, i) => (
              <NavLink
                key={i}
                to={toAbsolute(t.to)}
                end={t.end}
                className={({ isActive }) =>
                  `px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#1A1F36] text-[#1A1F36]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {t.label}
                {t.badge != null && (
                  <span className="ml-1.5 text-[10px] text-gray-400">{t.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  message?: string
  hint?: string
}

export function MoaiEmptyState({ title, message, hint }: EmptyStateProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <div className="grid min-h-[300px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex flex-col justify-between gap-8 bg-[#101524] p-6 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              <Sparkles size={12} />
              Proximo modulo MOAI
            </div>
            <h2 className="max-w-xl text-2xl font-bold leading-tight">{title}</h2>
            {message && <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">{message}</p>}
          </div>

          <div className="relative grid grid-cols-3 gap-2">
            {['Dados', 'Fluxo', 'Decisao'].map((label, index) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/45">Camada {index + 1}</div>
                <div className="mt-1 text-sm font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 p-6">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#E5E7EB]" />
            <div className="absolute inset-5 rounded-full border border-dashed border-[#CBD5E1]" />
            <div className="absolute inset-10 rounded-full bg-[#F8FAFC]" />
            <Radar className="relative text-[#1A1F36]" size={34} />
            <span className="absolute right-4 top-7 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="absolute bottom-8 left-6 h-2 w-2 rounded-full bg-amber-500" />
            <span className="absolute bottom-5 right-10 h-1.5 w-1.5 rounded-full bg-[#1A1F36]" />
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Estado atual</div>
            <div className="mt-2 text-sm font-semibold text-[#1A1F36]">Base preparada para interface dedicada</div>
            {hint && <p className="mt-2 text-xs leading-5 text-gray-500">{hint}</p>}
          </div>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-xs font-medium text-gray-500">Aguardando view operacional</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1F36]">
              Abrir quando pronto
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StubBadgeProps {
  status: 'wip' | 'ready' | 'planned'
}

export function StubBadge({ status }: StubBadgeProps) {
  const config = {
    wip:     { label: 'Em construção', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    ready:   { label: 'Disponível',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    planned: { label: 'Planejado',     cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  }[status]
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${config.cls}`}
    >
      {config.label}
    </span>
  )
}

interface PreviewMetric {
  label: string
  value: string | number
  detail?: string
  tone?: 'dark' | 'green' | 'amber' | 'red'
}

interface PreviewAction {
  title: string
  description: string
  status?: string
}

interface PreviewSignal {
  label: string
  value: string
}

interface MoaiPreviewCockpitProps {
  eyebrow: string
  title: string
  narrative: string
  metrics: PreviewMetric[]
  actions: PreviewAction[]
  signals: PreviewSignal[]
  footer?: string
}

export function MoaiPreviewCockpit({
  eyebrow,
  title,
  narrative,
  metrics,
  actions,
  signals,
  footer = 'Interface operacional pronta para receber a view dedicada.',
}: MoaiPreviewCockpitProps) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-[#DDE3EA] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[280px] bg-[#111827] p-6 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  <Sparkles size={12} />
                  {eyebrow}
                </div>
                <h2 className="max-w-2xl text-2xl font-bold leading-tight">{title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">{narrative}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {signals.map((signal) => (
                  <div key={signal.label} className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/45">{signal.label}</div>
                    <div className="mt-1 truncate text-sm font-semibold">{signal.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-[#DDE3EA]">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-white p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{metric.label}</div>
                <div className={`mt-2 text-2xl font-bold ${previewTone(metric.tone)}`}>{metric.value}</div>
                {metric.detail && <div className="mt-1 text-xs text-gray-500">{metric.detail}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {actions.map((action, index) => (
          <div key={action.title} className="group rounded-lg border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#1A1F36]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F3F4F6] text-[#1A1F36]">
                {index === 0 ? <Activity size={16} /> : <CheckCircle2 size={16} />}
              </div>
              {action.status && (
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {action.status}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[#1A1F36]">{action.title}</h3>
            <p className="mt-2 text-xs leading-5 text-gray-500">{action.description}</p>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
        <span className="text-xs font-medium text-gray-500">{footer}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1F36]">
          Cockpit preview
          <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  )
}

function previewTone(tone: PreviewMetric['tone']) {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'amber') return 'text-amber-600'
  if (tone === 'red') return 'text-red-600'
  return 'text-[#1A1F36]'
}
