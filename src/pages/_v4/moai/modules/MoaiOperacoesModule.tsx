import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiOperacoesModule() {
  return (
    <MoaiModuleShell
      title="Operacoes"
      description="Checklists de eventos, membros por conselho, compras e automacoes"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'Visao geral', end: true },
        { to: 'eventos', label: 'Eventos', badge: 202 },
        { to: 'compras', label: 'Compras', badge: 19 },
        { to: 'membros-por-conselho', label: 'Membros x Conselho', badge: 600 },
        { to: 'fornecedores', label: 'Fornecedores' },
        { to: 'automacoes', label: 'Automacoes' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Ops cockpit"
        title="Eventos, compras e execucao sem perder o fio."
        narrative="A visao de Operacoes mostra a saude do backstage: checklists de eventos, compras em andamento, distribuicao de membros por conselho e rotinas que precisam de automacao."
        metrics={[
          { label: 'Eventos', value: 202, detail: 'checklists', tone: 'green' },
          { label: 'Compras', value: 19, detail: 'itens mapeados', tone: 'amber' },
          { label: 'Membros x conselho', value: 600, detail: 'distribuicao' },
          { label: 'Fornecedores', value: 'mapa', detail: 'base operacional' },
        ]}
        signals={[
          { label: 'Foco', value: 'Execucao' },
          { label: 'Ritmo', value: 'Evento' },
          { label: 'Fonte', value: 'Monday' },
        ]}
        actions={[
          { title: 'Eventos em rota', description: 'Linha do tempo com checklist, responsavel e proxima entrega de cada evento.', status: 'eventos' },
          { title: 'Compras pendentes', description: 'Itens que precisam de aprovacao, fornecedor ou comprovante antes da data limite.', status: 'compras' },
          { title: 'Automacoes criticas', description: 'Rotinas repetitivas candidatas a automacao para reduzir trabalho manual.', status: 'ops' },
        ]}
      />
    </MoaiModuleShell>
  )
}
