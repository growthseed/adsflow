import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiTimeModule() {
  return (
    <MoaiModuleShell
      title="Time & RH"
      description="24 colaboradores, solicitacoes de ausencia, GTDs e 1:1 semanal"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'Visao geral', end: true },
        { to: 'colaboradores', label: 'Colaboradores', badge: 24 },
        { to: 'solicitacoes', label: 'Solicitacoes', badge: 42 },
        { to: 'onboarding', label: 'Onboarding', badge: 14 },
        { to: 'gtds', label: 'GTDs' },
        { to: '1-1-semanal', label: '1:1 semanal' },
        { to: 'processos', label: 'Processos' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="People cockpit"
        title="Capacidade do time, rituais e solicitacoes no mesmo radar."
        narrative="O modulo de Time organiza a operacao interna: colaborador ativo, onboarding, ausencias, GTDs e cadencia de 1:1 para lideranca enxergar capacidade e gargalos."
        metrics={[
          { label: 'Colaboradores', value: 24, detail: 'time ativo', tone: 'green' },
          { label: 'Solicitacoes', value: 42, detail: 'ausencias e ajustes', tone: 'amber' },
          { label: 'Onboarding', value: 14, detail: 'em acompanhamento' },
          { label: 'Boards RH', value: 33, detail: 'workspace' },
        ]}
        signals={[
          { label: 'Foco', value: 'Capacidade' },
          { label: 'Ritmo', value: 'Semanal' },
          { label: 'Fonte', value: 'RH' },
        ]}
        actions={[
          { title: 'Mapa do time', description: 'Quem esta ativo, em onboarding, afastado ou com pendencia de gestao.', status: 'pessoas' },
          { title: 'Solicitacoes abertas', description: 'Fila de ausencias e pedidos que precisam de aprovacao ou retorno.', status: 'rh' },
          { title: 'GTDs e 1:1', description: 'Ritual semanal com pendencias por lider e colaborador.', status: 'ritual' },
        ]}
      />
    </MoaiModuleShell>
  )
}
