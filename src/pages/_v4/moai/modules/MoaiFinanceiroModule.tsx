import { useMoaiSnapshot } from '@/hooks/useMoaiSnapshot'
import { WidgetRenderer } from '@/components/canonical/widgets'
import { MOAI_TEMPLATES } from '@/data/moaiTemplates'
import { MoaiModuleShell, StubBadge } from './MoaiModuleShell'

export default function MoaiFinanceiroModule() {
  const { snapshot } = useMoaiSnapshot()
  return (
    <MoaiModuleShell
      title="Financeiro"
      description="Inadimplência 2.804 · Pagamentos 641 · Churn 161"
      rightActions={<StubBadge status="ready" />}
      tabs={[
        { to: '', label: 'Visão geral', end: true },
        { to: 'inadimplencia', label: 'Inadimplência', badge: 2804 },
        { to: 'churn', label: 'Churn', badge: 161 },
        { to: 'pagamentos', label: 'Pagamentos', badge: 641 },
        { to: 'ofensores', label: 'Ofensores' },
        { to: 'projecao', label: 'Projeção' },
      ]}
    >
      <WidgetRenderer template={MOAI_TEMPLATES.financeiro} snapshot={snapshot} />
    </MoaiModuleShell>
  )
}
