import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiConselhosModule() {
  return (
    <MoaiModuleShell
      title="Conselhos Estratégicos"
      description="427 atas, 266 conselhos 2026, calendário, onboardings e rounds"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'Calendario', end: true },
        { to: 'atas', label: 'Atas', badge: 427 },
        { to: 'conselhos-2026', label: '2026', badge: 266 },
        { to: 'onboardings', label: 'Onboardings' },
        { to: 'rounds', label: 'Rounds' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Conselhos cockpit"
        title="Agenda, atas e rounds em uma leitura de comando."
        narrative="A tela concentra o pulso dos Conselhos: o que aconteceu, o que precisa de ata, quais onboardings estão em andamento e onde o time precisa decidir antes do próximo encontro."
        metrics={[
          { label: 'Atas', value: 427, detail: 'histórico Monday', tone: 'dark' },
          { label: 'Conselhos 2026', value: 266, detail: 'agenda mapeada', tone: 'green' },
          { label: 'Mentores', value: 6, detail: 'carteiras base' },
          { label: 'Rounds', value: 'ativo', detail: 'fila operacional', tone: 'amber' },
        ]}
        signals={[
          { label: 'Foco', value: 'Calendario' },
          { label: 'Ritmo', value: 'Semanal' },
          { label: 'Fonte', value: 'Monday' },
        ]}
        actions={[
          {
            title: 'Próximos encontros',
            description: 'Lista priorizada dos conselhos mais próximos, com mentor, conselho e pendências da rodada.',
            status: 'agenda',
          },
          {
            title: 'Atas em aberto',
            description: 'Fila de atas pendentes para manter histórico e decisões sempre rastreáveis.',
            status: 'operacao',
          },
          {
            title: 'Onboarding e rounds',
            description: 'Acompanhamento dos novos conselhos e rounds que precisam de acompanhamento executivo.',
            status: 'cs',
          },
        ]}
      />
    </MoaiModuleShell>
  )
}
