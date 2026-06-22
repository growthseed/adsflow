import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiTurnLabModule() {
  return (
    <MoaiModuleShell
      title="Turn Lab"
      description="Laboratorio de experimentos, NPS por etapa e feedback de eventos"
      rightActions={<StubBadge status="planned" />}
      tabs={[
        { to: '', label: 'Visao geral', end: true },
        { to: 'nps-etapas', label: 'NPS etapas', badge: 15 },
        { to: 'eventos', label: 'Eventos' },
        { to: 'gestao-membros', label: 'Gestao membros' },
        { to: 'plano-comunicacao', label: 'Plano Comm' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Experiment cockpit"
        title="Laboratorio pronto para rodadas, feedbacks e aprendizados."
        narrative="Turn Lab fica como camada de experimentacao: medir etapas, capturar feedback de evento e transformar aprendizado em proxima acao para produto, CS e comunidade."
        metrics={[
          { label: 'Boards', value: 9, detail: 'workspace' },
          { label: 'Itens', value: 28, detail: 'backlog' },
          { label: 'NPS etapas', value: 15, detail: 'respostas', tone: 'green' },
          { label: 'Status', value: 'standby', detail: 'planejado', tone: 'amber' },
        ]}
        signals={[
          { label: 'Foco', value: 'Experimento' },
          { label: 'Ritmo', value: 'Rodadas' },
          { label: 'Fonte', value: 'Feedback' },
        ]}
        actions={[
          { title: 'NPS por etapa', description: 'Leitura de satisfacao por fase do experimento ou jornada.', status: 'nps' },
          { title: 'Feedback de eventos', description: 'Sinais qualitativos para decidir se repete, altera ou cancela.', status: 'evento' },
          { title: 'Plano de comunicacao', description: 'Proxima campanha de aprendizagem e ativacao de membros.', status: 'comm' },
        ]}
      />
    </MoaiModuleShell>
  )
}
