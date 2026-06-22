import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiEstrategiaModule() {
  return (
    <MoaiModuleShell
      title="Estrategia & Liderancas"
      description="PE MOAI 2026, indicadores, report 2026 e projetos comerciais"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'PE 2026', end: true, badge: 85 },
        { to: 'okrs', label: 'OKRs' },
        { to: 'indicadores', label: 'Indicadores', badge: 7 },
        { to: 'report-2026', label: 'Report 2026' },
        { to: 'projeto-alavanca', label: 'Proj. Alavanca' },
        { to: 'projeto-virada', label: 'Virada Comercial', badge: 62 },
        { to: 'ongoing-cs', label: 'Ongoing CS' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Strategy cockpit"
        title="Plano 2026, indicadores e projetos em modo lideranca."
        narrative="A tela de Estrategia precisa mostrar onde o plano anual avanca, onde travou e quais indicadores estao pedindo decisao. E menos relatorio e mais sala de comando."
        metrics={[
          { label: 'PE 2026', value: 85, detail: 'itens estrategicos', tone: 'green' },
          { label: 'Indicadores', value: 7, detail: 'painel geral' },
          { label: 'Virada comercial', value: 62, detail: 'acoes', tone: 'amber' },
          { label: 'OKRs', value: 'base', detail: 'em estruturacao' },
        ]}
        signals={[
          { label: 'Foco', value: 'Prioridade' },
          { label: 'Ritmo', value: 'Mensal' },
          { label: 'Fonte', value: 'PE 2026' },
        ]}
        actions={[
          { title: 'Pilares estrategicos', description: 'Progresso por frente, dono e bloqueios para a lideranca agir.', status: 'plano' },
          { title: 'Indicadores semanais', description: 'Leitura de tendencia com sinal claro para manter, acelerar ou corrigir.', status: 'kpi' },
          { title: 'Projetos comerciais', description: 'Alavanca, Virada Comercial e Ongoing CS com status executivo.', status: 'projetos' },
        ]}
      />
    </MoaiModuleShell>
  )
}
