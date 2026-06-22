import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiIAModule() {
  return (
    <MoaiModuleShell
      title="IA & Insights"
      description="Chat com contexto MOAI 360, alertas automáticos, briefing diário e reports"
      rightActions={<StubBadge status="planned" />}
      tabs={[
        { to: '', label: 'Chat', end: true },
        { to: 'insights', label: 'Insights' },
        { to: 'alertas', label: 'Alertas' },
        { to: 'relatorios', label: 'Relatórios' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="AI cockpit"
        title="Briefing diario, alertas e perguntas com contexto MOAI."
        narrative="A IA sera a camada de interpretacao: ler os modulos, resumir o dia, destacar anomalias e responder perguntas sem o time precisar garimpar cada dashboard."
        metrics={[
          { label: 'Modulos alvo', value: 13, detail: 'contexto 360' },
          { label: 'Briefing', value: 'diario', detail: 'planejado', tone: 'amber' },
          { label: 'Alertas', value: 'auto', detail: 'regras + IA' },
          { label: 'Reports', value: 'PDF', detail: 'futuro' },
        ]}
        signals={[
          { label: 'Foco', value: 'Decisao' },
          { label: 'Ritmo', value: 'Diario' },
          { label: 'Fonte', value: 'Views' },
        ]}
        actions={[
          { title: 'Chat contextual', description: 'Perguntas usando a página atual, role e dados do módulo.', status: 'chat' },
          { title: 'Alertas automáticos', description: 'Sinais de churn, vendas, inadimplência e operação fora do padrão.', status: 'alerta' },
          { title: 'Briefing executivo', description: 'Resumo diario para Vinicius/Duda com prioridades e decisoes.', status: 'briefing' },
        ]}
      />
    </MoaiModuleShell>
  )
}
