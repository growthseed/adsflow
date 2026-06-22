import { Routes, Route } from 'react-router-dom'
import { FileText, Handshake, Trophy, BookOpen, AlertCircle } from 'lucide-react'
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
      <Routes>
        <Route index element={<ParceriasOverview />} />
        <Route path="projetos" element={<ProjetosPlaceholder />} />
        <Route path="atas" element={<AtasPlaceholder />} />
        <Route path="cases" element={<CasesPlaceholder />} />
        <Route path="manuais" element={<ManuaisPlaceholder />} />
      </Routes>
    </MoaiModuleShell>
  )
}

function ParceriasOverview() {
  return (
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
  )
}

function ComingSoonCard({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: typeof Handshake
  title: string
  description: string
  items: string[]
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
            <Icon size={20} className="text-[#1A1F36]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[#1A1F36] mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-4">{description}</p>
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Fonte de dados: Monday.com — integração em construção. Os dados serão puxados do board de parcerias assim que a view no Supabase for criada.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item} className="bg-white border border-[#E5E7EB] rounded-lg p-4 opacity-50">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
            <div className="text-[10px] text-gray-400 mt-3">{item}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjetosPlaceholder() {
  return (
    <ComingSoonCard
      icon={FileText}
      title="Projetos & Pipeline"
      description="45 projetos ativos com dono, prazo e próxima ação. Integração com Monday board de Parcerias."
      items={['Projeto A — Parceiro X', 'Projeto B — Patrocinador Y', 'Projeto C — Institucional Z', 'Evento anual — Em negociação', 'Masterclass patrocinada', 'Co-marketing — Em revisão']}
    />
  )
}

function AtasPlaceholder() {
  return (
    <ComingSoonCard
      icon={BookOpen}
      title="Atas de Reunião"
      description="17 atas registradas com decisões, responsáveis e deadlines. Fonte: Google Drive / Notion."
      items={['Ata 17 — Jun 2025', 'Ata 16 — Mai 2025', 'Ata 15 — Abr 2025', 'Ata 14 — Mar 2025', 'Ata 13 — Fev 2025', 'Ata 12 — Jan 2025']}
    />
  )
}

function CasesPlaceholder() {
  return (
    <ComingSoonCard
      icon={Trophy}
      title="Cases de Sucesso"
      description="5 cases documentados prontos para proposta comercial e apresentação institucional."
      items={['Case 1 — Resultado X', 'Case 2 — Resultado Y', 'Case 3 — Resultado Z', 'Case 4 — Em aprovação', 'Case 5 — Rascunho']}
    />
  )
}

function ManuaisPlaceholder() {
  return (
    <ComingSoonCard
      icon={BookOpen}
      title="Manuais & Ativos"
      description="Biblioteca de manuais operacionais, kits de parceria e materiais institucionais."
      items={['Manual de parceria', 'Kit de patrocínio 2025', 'Apresentação institucional', 'Proposta padrão']}
    />
  )
}
