import { Card } from '@/components/primitives'
import type { OnboardingState } from '../types'
import { formatMetric } from '@/lib/formatMetric'

interface Props {
  state: OnboardingState
  onJumpTo: (step: OnboardingState['currentStep']) => void
}

export function ReviewStep({ state, onJumpTo }: Props) {
  const connectedCount = state.integrations.filter((it) => it.status === 'connected').length

  return (
    <Card className="p-5">
      <h2 className="text-[18px] font-bold text-neutral-900">Revisão & convite ao cliente</h2>
      <p className="text-[13px] text-neutral-500 mt-1 mb-5">
        Confira tudo antes de finalizar. Um link de portal será gerado e o cliente receberá o
        convite por e-mail (ou você copia no WhatsApp do grupo).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryCard title="Básico" editStep="basic" onEdit={onJumpTo}>
          <KV k="Nome" v={state.basic.name || '—'} />
          <KV k="Slug" v={state.basic.clientSlug || '—'} />
          <KV k="Nicho" v={state.basic.industry || '—'} />
          <KV
            k="Budget mensal"
            v={state.basic.monthlyBudget != null ? formatMetric(state.basic.monthlyBudget, 'currency') : '—'}
          />
        </SummaryCard>
        <SummaryCard title="Integrações" editStep="integrations" onEdit={onJumpTo}>
          <KV k="Conectadas" v={`${connectedCount} / ${state.integrations.length}`} />
          <div className="flex flex-wrap gap-1.5">
            {state.integrations
              .filter((it) => it.status === 'connected')
              .map((it) => (
                <span
                  key={it.key}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-700 bg-neutral-100 rounded-full px-2 py-0.5"
                >
                  {it.label}
                </span>
              ))}
          </div>
        </SummaryCard>
        <SummaryCard title="Metas" editStep="goals" onEdit={onJumpTo}>
          {state.goals.length === 0 ? (
            <p className="text-[12px] text-neutral-500">Nenhuma meta configurada.</p>
          ) : (
            <ul className="text-[12px] text-neutral-700 space-y-1">
              {state.goals.map((g) => (
                <li key={g.id}>
                  · {g.metric.toUpperCase()} alvo {' '}
                  <b className="tabular">{g.targetValue.toLocaleString('pt-BR')}</b>
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>
        <SummaryCard title="Equipe" editStep="team" onEdit={onJumpTo}>
          <KV k="Convites" v={`${state.team.length}`} />
          {state.team.length > 0 && (
            <ul className="text-[12px] text-neutral-700 space-y-0.5 mt-1.5">
              {state.team.map((t) => (
                <li key={t.email} className="truncate">· {t.email} · {t.role}</li>
              ))}
            </ul>
          )}
        </SummaryCard>
      </div>
    </Card>
  )
}

function SummaryCard({
  title,
  editStep,
  onEdit,
  children,
}: {
  title: string
  editStep: OnboardingState['currentStep']
  onEdit: (s: OnboardingState['currentStep']) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-neutral-900">{title}</h3>
        <button
          onClick={() => onEdit(editStep)}
          className="text-[11px] font-medium text-brand-700 hover:text-brand-900"
        >
          editar
        </button>
      </header>
      <div className="space-y-1 text-[12.5px]">{children}</div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 text-[12.5px]">
      <span className="text-neutral-500">{k}</span>
      <span className="text-neutral-900 font-medium text-right">{v}</span>
    </div>
  )
}
