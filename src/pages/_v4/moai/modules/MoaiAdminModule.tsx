import { MoaiModuleShell, MoaiPreviewCockpit, StubBadge } from './MoaiModuleShell'

export default function MoaiAdminModule() {
  return (
    <MoaiModuleShell
      title="Administracao"
      description="Usuarios, integracoes, papeis, snapshots e configuracoes"
      rightActions={<StubBadge status="wip" />}
      tabs={[
        { to: '', label: 'Usuarios', end: true },
        { to: 'integracoes', label: 'Integracoes' },
        { to: 'boards', label: 'Boards Monday', badge: 23 },
        { to: 'papeis', label: 'Papeis & permissoes', badge: 11 },
        { to: 'snapshots', label: 'Snapshots' },
        { to: 'settings', label: 'Settings' },
      ]}
    >
      <MoaiPreviewCockpit
        eyebrow="Admin cockpit"
        title="Controle de acesso, conectores e saude dos snapshots."
        narrative="Admin e a sala tecnica do portal: quem acessa, com qual papel, quais integracoes estao saudaveis e quando o ultimo snapshot atualizou."
        metrics={[
          { label: 'Papeis', value: 11, detail: 'RBAC' },
          { label: 'Modulos', value: 14, detail: 'visibilidade' },
          { label: 'Regras', value: 154, detail: 'entries', tone: 'green' },
          { label: 'Boards', value: 23, detail: 'Monday' },
        ]}
        signals={[
          { label: 'Foco', value: 'Governanca' },
          { label: 'Ritmo', value: 'Sync' },
          { label: 'Fonte', value: 'Supabase' },
        ]}
        actions={[
          { title: 'Usuarios e papeis', description: 'Lista por papel, escopo e modulo autorizado.', status: 'rbac' },
          { title: 'Integracoes', description: 'Status de Monday, Clint, Meta e Google sem expor tokens.', status: 'health' },
          { title: 'Snapshots', description: 'Historico de sync, duracao, erro e ultima atualizacao.', status: 'sync' },
        ]}
      />
    </MoaiModuleShell>
  )
}
