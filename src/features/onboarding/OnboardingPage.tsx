import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Image, Link2, Loader2, Rocket, Sparkles, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/primitives'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/UI/Toast'
import { indexOfStep, nextStep, prevStep, useOnboardingState } from './state'
import { ONBOARDING_STEPS, type OnboardingIntegration } from './types'
import { StepIndicator } from './components/StepIndicator'
import { BasicStep } from './components/BasicStep'
import { IntegrationsStep } from './components/IntegrationsStep'
import { GoalsStep } from './components/GoalsStep'
import { TeamStep } from './components/TeamStep'
import { ReviewStep } from './components/ReviewStep'

export default function OnboardingPage() {
  const [state, dispatch] = useOnboardingState()
  const [finished, setFinished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToastSafe()

  const { currentStep, basic, integrations, goals, team, completedSteps } = state
  const idx = indexOfStep(currentStep)

  const goNext = () => {
    const n = nextStep(currentStep)
    dispatch({ type: 'completeStep', step: currentStep })
    if (n) dispatch({ type: 'goStep', step: n })
  }
  const goBack = () => {
    const p = prevStep(currentStep)
    if (p) dispatch({ type: 'goStep', step: p })
  }

  const handleConnect = (key: OnboardingIntegration['key']) => {
    dispatch({ type: 'setIntegrationStatus', key, status: 'connecting' })
    // Simula OAuth completion — no app real abre popup OAuth
    setTimeout(() => {
      dispatch({
        type: 'setIntegrationStatus',
        key,
        status: 'connected',
        accountsConnected: 1,
        syncProgressLabel: 'sincronizando 90 dias',
      })
    }, 1500)
  }

  const handleFinish = async () => {
    if (!basic.name || !basic.clientSlug) {
      toast?.error('Preencha nome e slug no passo Básico')
      dispatch({ type: 'goStep', step: 'basic' })
      return
    }
    setSubmitting(true)
    try {
      const goalsPayload = goals.map((g) => ({
        metric: g.metric,
        label: g.label,
        target_value: g.targetValue,
        direction: g.metric === 'cpl' || g.metric === 'spend' ? 'cap' : 'maximize',
        unit:
          g.metric === 'cpl' || g.metric === 'spend'
            ? 'currency'
            : g.metric === 'roas'
            ? 'ratio'
            : g.metric === 'ctr'
            ? 'percent'
            : 'count',
        horizon: 'quarterly',
      }))
      const viewerEmails = team.filter((t) => t.role === 'viewer').map((t) => t.email)
      const { data, error } = await supabase.rpc('onboarding_finalize', {
        p_name: basic.name,
        p_slug: basic.clientSlug,
        p_industry: basic.industry,
        p_monthly_budget: basic.monthlyBudget,
        p_manager_user_ids: [],
        p_viewer_emails: viewerEmails,
        p_goals: goalsPayload,
      })
      if (error) throw error
      const createdClientId = String(data)
      toast?.success(`Cliente ${basic.name} criado · id ${createdClientId.slice(0, 8)}`)

      // Cria folder no ClickUp (space Operações) e vincula em client_integrations
      // Silent failure — onboarding sucede mesmo se ClickUp falhar, gestor pluga depois
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        const cuResp = await fetch('/api/clickup/create-folder', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            client_id: createdClientId,
            folder_name: basic.name,
            include_default_lists: true,
          }),
        })
        if (cuResp.ok) {
          const body = (await cuResp.json()) as { folder_name: string; lists: { name: string }[] }
          toast?.success(
            `ClickUp: folder "${body.folder_name}" + ${body.lists.length} listas criadas`,
          )
        } else if (cuResp.status === 501) {
          toast?.info('ClickUp não configurado — vincule manualmente em Integrações')
        } else {
          toast?.warning(`ClickUp: criação de folder falhou (HTTP ${cuResp.status}) — vincule manualmente`)
        }
      } catch (cuErr) {
        console.warn('[Onboarding] ClickUp folder creation failed', cuErr)
      }

      setFinished(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao finalizar onboarding'
      toast?.error(msg)
      console.error('[Onboarding] finalize failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (finished) {
    return <FinishedScreen slug={basic.clientSlug || 'novo-cliente'} />
  }

  return (
    <div className="max-w-layout mx-auto">
      <Card className="p-4 mb-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <div className="eyebrow text-brand-600">
            Novo cliente · passo {idx + 1} de {ONBOARDING_STEPS.length}
          </div>
          <h2 className="text-[18px] font-bold mt-1">
            {basic.name ? basic.name : 'Sem nome · configure no passo 1'}
          </h2>
        </div>
        <StepIndicator current={currentStep} completed={completedSteps} />
      </Card>

      {currentStep === 'basic' && (
        <BasicStep
          value={basic}
          onChange={(patch) => dispatch({ type: 'setBasic', patch })}
        />
      )}
      {currentStep === 'integrations' && (
        <IntegrationsStep integrations={integrations} onConnect={handleConnect} />
      )}
      {currentStep === 'goals' && (
        <GoalsStep
          goals={goals}
          clientName={basic.name}
          onAdd={() => dispatch({ type: 'addGoal' })}
          onPatch={(id, patch) => dispatch({ type: 'patchGoal', id, patch })}
          onRemove={(id) => dispatch({ type: 'removeGoal', id })}
        />
      )}
      {currentStep === 'team' && (
        <TeamStep
          invites={team}
          onAdd={(invite) => dispatch({ type: 'addTeamInvite', invite })}
          onRemove={(email) => dispatch({ type: 'removeTeamInvite', email })}
        />
      )}
      {currentStep === 'review' && (
        <ReviewStep
          state={state}
          onJumpTo={(step) => dispatch({ type: 'goStep', step })}
        />
      )}

      <nav className="flex items-center justify-between mt-4">
        <button
          onClick={goBack}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 text-sm font-medium text-neutral-700"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={goNext}
            className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900 px-2"
          >
            Pular
          </button>
          {currentStep === 'review' ? (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-success-600 hover:bg-success-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Criando…
                </>
              ) : (
                <>
                  Finalizar <CheckCircle2 size={14} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
            >
              Continuar <ArrowRight size={14} />
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}

function FinishedScreen({ slug }: { slug: string }) {
  return (
    <div className="max-w-layout mx-auto">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-success-100 text-success-600 grid place-items-center">
          <CheckCircle2 size={30} strokeWidth={2} />
        </div>
        <h1 className="text-[24px] font-bold tracking-[-0.02em] mb-2">
          Tudo pronto!
        </h1>
        <p className="text-[13px] text-neutral-600 max-w-lg mx-auto">
          O cliente já está no AdsFlow. As campanhas sincronizam nos próximos minutos e o
          convite do portal vai ser enviado quando o setup terminar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mt-6 text-left">
          <NextCard
            icon={<Link2 size={16} strokeWidth={2} />}
            title="Conectar integrações"
            description="Meta Ads, Google Ads, WhatsApp — OAuth completo"
            to="/integrations"
          />
          <NextCard
            icon={<Image size={16} strokeWidth={2} />}
            title="Gerar criativos iniciais"
            description="AdsFlow AI sugere 3 variações pro nicho"
            to="/ai"
          />
          <NextCard
            icon={<Bell size={16} strokeWidth={2} />}
            title="Configurar alertas"
            description="Avisar no WhatsApp se CPL estourar"
            to="/alerts"
          />
          <NextCard
            icon={<FileText size={16} strokeWidth={2} />}
            title="Agendar relatório mensal"
            description="Envio automático todo dia 1º"
            to="/reports"
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            to={`/c/${slug}/overview`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
          >
            <Rocket size={14} /> Abrir {slug}
          </Link>
          <Link
            to="/_v4/operations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700"
          >
            Voltar pra Home
          </Link>
        </div>
      </Card>
    </div>
  )
}

function useToastSafe(): ReturnType<typeof useToast> | null {
  try {
    return useToast()
  } catch {
    return null
  }
}

function NextCard({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="bg-white border border-neutral-200 rounded-xl p-3 hover:border-brand-500 hover:shadow-[var(--shadow-soft)] transition"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center mb-2">
        {icon}
      </div>
      <h5 className="text-[13px] font-semibold text-neutral-900">{title}</h5>
      <p className="text-[11px] text-neutral-500 mt-1">{description}</p>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
        Abrir <Sparkles size={11} />
      </div>
    </Link>
  )
}
