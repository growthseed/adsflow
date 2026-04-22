import { Check, ExternalLink, Info, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/primitives'
import type { OnboardingIntegration } from '../types'

interface Props {
  integrations: OnboardingIntegration[]
  onConnect: (key: OnboardingIntegration['key']) => void
}

export function IntegrationsStep({ integrations, onConnect }: Props) {
  return (
    <Card className="p-5">
      <h2 className="text-[18px] font-bold text-neutral-900">Conectar integrações</h2>
      <p className="text-[13px] text-neutral-500 mt-1 mb-5">
        Conecte as contas de mídia do cliente. A sincronização inicial (90 dias) roda em
        background — você pode avançar o onboarding enquanto ela acontece.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {integrations.map((it) => (
          <IntegrationCard key={it.key} integration={it} onConnect={() => onConnect(it.key)} />
        ))}
      </div>
      <div className="mt-4 bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 flex gap-2 text-[12px] text-brand-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        <div>
          <p>
            A sincronização inicial leva ~5 min. Avance os próximos passos — os dados aparecem
            quando terminar.
          </p>
          <p className="mt-1.5">
            Para OAuth completo (Meta Business + Google Ads), use{' '}
            <Link
              to="/integrations"
              target="_blank"
              className="font-semibold underline inline-flex items-center gap-1"
            >
              Configurações → Integrações
              <ExternalLink size={10} />
            </Link>
            {' '}após finalizar o cadastro.
          </p>
        </div>
      </div>
    </Card>
  )
}

function IntegrationCard({
  integration,
  onConnect,
}: {
  integration: OnboardingIntegration
  onConnect: () => void
}) {
  const { status } = integration
  const borderTone =
    status === 'connected'
      ? 'border-success-500'
      : status === 'connecting'
      ? 'border-brand-500 animate-pulse'
      : status === 'error'
      ? 'border-error-500'
      : status === 'token_expired'
      ? 'border-warning-500'
      : 'border-neutral-200'

  return (
    <div
      className={`relative bg-white rounded-xl border ${borderTone} p-3 flex flex-col gap-2 transition`}
    >
      {status === 'connected' && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-success-500 text-white grid place-items-center">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      {!integration.required && status === 'not_connected' && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5">
          Opcional
        </span>
      )}
      <div
        className="w-10 h-10 rounded-lg text-white grid place-items-center text-base font-bold"
        style={{ background: integration.logoBg }}
      >
        {integration.logoInitial}
      </div>
      <div>
        <div className="text-[13px] font-semibold text-neutral-900">{integration.label}</div>
        <div className="text-[11px] text-neutral-500">
          {status === 'connected' && integration.accountsConnected > 0
            ? `${integration.accountsConnected} ${integration.accountsConnected === 1 ? 'conta' : 'contas'} · ${integration.syncProgressLabel ?? 'sincronizada'}`
            : integration.description}
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={status === 'connecting' || status === 'connected'}
        className={`mt-auto text-[11px] font-semibold rounded-md px-2.5 py-1.5 transition-colors ${
          status === 'connected'
            ? 'bg-success-50 text-success-700 cursor-default'
            : status === 'connecting'
            ? 'bg-brand-50 text-brand-700 cursor-wait inline-flex items-center justify-center gap-1.5'
            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        {status === 'connected' ? (
          'Conectado'
        ) : status === 'connecting' ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Conectando
          </>
        ) : status === 'error' ? (
          'Tentar de novo'
        ) : status === 'token_expired' ? (
          'Reconectar'
        ) : (
          'Conectar'
        )}
      </button>
    </div>
  )
}
