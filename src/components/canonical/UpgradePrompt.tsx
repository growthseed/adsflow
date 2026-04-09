/**
 * ============================================
 * UPGRADE PROMPT — tier upsell empty state
 * ============================================
 * Rendered by TierGate/PermissionGate when a feature requires a
 * higher tier. Intentionally friendly and not a "403" — it explains
 * what the feature is, which tier unlocks it, and gives a CTA.
 *
 * Staff (super_admin/admin) should never see this; they bypass gates
 * entirely in the parent Gate component.
 * ============================================
 */

import type { ClientServiceTier } from '@/types/metrics'
import { SERVICE_TIERS } from '@/data/serviceTiers'

interface UpgradePromptProps {
  /** Display name of the blocked feature ("Drill-down por anúncio") */
  feature: string
  /** Minimum tier required to unlock the feature */
  requiredTier: ClientServiceTier
  /** Optional short description for context */
  description?: string
  /** Optional CTA override. Default opens a mailto to the agency. */
  onCtaClick?: () => void
}

const TIER_COPY: Record<ClientServiceTier, { label: string; accent: string }> = {
  basic: { label: 'Basic', accent: 'from-slate-500 to-slate-700' },
  pro: { label: 'Pro', accent: 'from-blue-500 to-indigo-600' },
  black: { label: 'Black', accent: 'from-neutral-800 to-black' },
  enterprise: { label: 'Enterprise', accent: 'from-amber-500 to-orange-600' },
}

export default function UpgradePrompt({
  feature,
  requiredTier,
  description,
  onCtaClick,
}: UpgradePromptProps) {
  const copy = TIER_COPY[requiredTier]
  const tierConfig = SERVICE_TIERS[requiredTier]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-xl mx-auto">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${copy.accent} flex items-center justify-center shadow-lg mb-5`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
        Disponível no plano {copy.label}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        {feature}
      </h2>

      <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md">
        {description ||
          `Esta funcionalidade faz parte do plano ${copy.label}. Fale com a Efeito Digital para entender como ativar.`}
      </p>

      {tierConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left w-full max-w-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            O que o plano {copy.label} desbloqueia
          </div>
          <ul className="text-sm text-slate-700 space-y-1.5">
            <li>
              • Até{' '}
              {tierConfig.max_channels === -1 ? 'ilimitados' : tierConfig.max_channels} canais de mídia
            </li>
            <li>• Histórico de {tierConfig.history_days ?? 'dados ilimitados'} dias</li>
            {tierConfig.ai.insights_frequency !== 'never' && (
              <li>• Insights de IA ({tierConfig.ai.insights_frequency})</li>
            )}
            {tierConfig.reports.white_label && <li>• Relatórios white-label</li>}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={
          onCtaClick ??
          (() => {
            window.location.href = `mailto:jw@efeito.digital?subject=Upgrade%20para%20${copy.label}`
          })
        }
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${copy.accent} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow`}
      >
        Falar com o gestor
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}
