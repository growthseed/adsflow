import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiParceriasModule() {
  return (
    <MoaiModuleShell
      title="Parcerias & Patrocínios"
      description="23 parceiros, 45 projetos, 17 atas e 5 cases"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'Status parceiros', end: true, badge: 23 },
        { to: 'projetos', label: 'Projetos', badge: 45 },
        { to: 'atas', label: 'Atas', badge: 17 },
        { to: 'cases', label: 'Cases', badge: 5 },
        { to: 'manuais', label: 'Manuais' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Partnership cockpit"
        title="Parceiros, projetos e patrocinadores com status de ação."
        narrative="Parcerias precisa mostrar rapidamente quem está quente, quem esfriou e quais projetos precisam de próxima ação comercial ou institucional."
        metrics={[
          { label: 'Parceiros', value: 23, detail: 'base ativa', tone: 'green' },
          { label: 'Projetos', value: 45, detail: 'pipeline' },
          { label: 'Atas', value: 17, detail: 'histórico' },
          { label: 'Cases', value: 5, detail: 'provas', tone: 'green' },
        ]}
        signals={[
          { label: 'Foco', value: 'Relacionamento' },
          { label: 'Ritmo', value: 'Pipeline' },
          { label: 'Fonte', value: 'Monday' },
        ]}
        actions={[
          { title: 'Semáforo de parceiros', description: 'Vermelho, amarelo e verde para priorizar contato e manutenção.', status: 'saude' },
          { title: 'Projetos abertos', description: 'Pipeline de projetos com próxima ação, dono e prazo.', status: 'pipeline' },
          { title: 'Cases e ativos', description: 'Biblioteca de cases e manuais para acelerar propostas.', status: 'comercial' },
        ]}
      />
    </MoaiModuleShell>
  )
}
