/**
 * ============================================
 * FUNNELS PAGE
 * ============================================
 * Templates de funil de conversão.
 * Criar funil a partir de template ou do zero,
 * abrir no editor de flows.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFlows } from '@/hooks/useFlows'
import { useToast } from '@/components/UI/Toast'
import {
  Target,
  Plus,
  Search,
  ArrowRight,
  Megaphone,
  ShoppingCart,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  TrendingUp,
  Zap,
  Globe,
  Loader2,
} from 'lucide-react'

// =====================================================
// FUNNEL TEMPLATES
// =====================================================

interface FunnelTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  stages: string[]
  category: 'lead_gen' | 'ecommerce' | 'engagement' | 'whatsapp'
}

const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: 'lead-whatsapp',
    name: 'Lead → WhatsApp',
    description: 'Funil de captação de leads via Meta Ads direto para WhatsApp. Ideal para clínicas e escritórios.',
    icon: MessageCircle,
    color: 'bg-green-600',
    stages: ['Anúncio Meta', 'Landing Page', 'Botão WhatsApp', 'Conversa', 'Agendamento', 'Conversão'],
    category: 'whatsapp',
  },
  {
    id: 'lead-form',
    name: 'Lead → Formulário',
    description: 'Funil com formulário de captura e follow-up por email/WhatsApp.',
    icon: Mail,
    color: 'bg-blue-600',
    stages: ['Anúncio', 'Landing Page', 'Formulário', 'Obrigado', 'Follow-up', 'Conversão'],
    category: 'lead_gen',
  },
  {
    id: 'ecommerce-standard',
    name: 'E-commerce Padrão',
    description: 'Funil completo de e-commerce: descoberta → produto → carrinho → checkout.',
    icon: ShoppingCart,
    color: 'bg-purple-600',
    stages: ['Descoberta', 'Produto', 'Carrinho', 'Checkout', 'Compra', 'Recompra'],
    category: 'ecommerce',
  },
  {
    id: 'engagement-instagram',
    name: 'Engajamento Instagram',
    description: 'Funil focado em engajamento e crescimento de seguidores no Instagram.',
    icon: Megaphone,
    color: 'bg-pink-600',
    stages: ['Post/Reel', 'Perfil', 'Seguir', 'Engajamento', 'DM', 'Conversão'],
    category: 'engagement',
  },
  {
    id: 'lead-agendamento',
    name: 'Lead → Agendamento',
    description: 'Funil de agendamento online para clínicas e serviços profissionais.',
    icon: Calendar,
    color: 'bg-indigo-600',
    stages: ['Anúncio', 'Landing Page', 'Calendário', 'Confirmação', 'Lembrete', 'Atendimento'],
    category: 'lead_gen',
  },
  {
    id: 'lead-telefone',
    name: 'Lead → Ligação',
    description: 'Funil com CTA de ligação telefônica direta. Ideal para emergências e urgências.',
    icon: Phone,
    color: 'bg-amber-600',
    stages: ['Anúncio', 'Landing Page', 'Click-to-Call', 'Atendimento', 'Conversão'],
    category: 'lead_gen',
  },
  {
    id: 'retargeting',
    name: 'Retargeting Multi-canal',
    description: 'Funil de retargeting com múltiplos touchpoints para recuperar leads perdidos.',
    icon: TrendingUp,
    color: 'bg-cyan-600',
    stages: ['Visita Inicial', 'Pixel/Tag', 'Retargeting 1', 'Retargeting 2', 'Oferta Final', 'Conversão'],
    category: 'engagement',
  },
  {
    id: 'webinar',
    name: 'Webinar / Evento',
    description: 'Funil de captação para webinar ou evento online com funil de vendas no final.',
    icon: Globe,
    color: 'bg-rose-600',
    stages: ['Anúncio', 'Landing Page', 'Inscrição', 'Lembrete', 'Evento', 'Oferta', 'Compra'],
    category: 'lead_gen',
  },
]

const CATEGORY_LABELS = {
  lead_gen: 'Geração de Leads',
  ecommerce: 'E-commerce',
  engagement: 'Engajamento',
  whatsapp: 'WhatsApp',
}

const CATEGORY_COLORS = {
  lead_gen: 'bg-blue-100 text-blue-700',
  ecommerce: 'bg-purple-100 text-purple-700',
  engagement: 'bg-pink-100 text-pink-700',
  whatsapp: 'bg-green-100 text-green-700',
}

// =====================================================
// TEMPLATE CARD
// =====================================================

function TemplateCard({
  template,
  onUse,
}: {
  template: FunnelTemplate
  onUse: () => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
            <template.icon className="w-5 h-5 text-white" />
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category]}`}>
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{template.description}</p>

        {/* Stages preview */}
        <div className="flex items-center gap-1 mb-4 overflow-hidden">
          {template.stages.slice(0, 4).map((stage, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 whitespace-nowrap">
                {stage}
              </span>
              {i < 3 && i < template.stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
              )}
            </div>
          ))}
          {template.stages.length > 4 && (
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              +{template.stages.length - 4}
            </span>
          )}
        </div>

        <button
          onClick={onUse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Plus className="w-4 h-4" />
          Usar Template
        </button>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function FunnelsPage() {
  const navigate = useNavigate()
  const { flows, createNewFlow } = useFlows()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [creating, setCreating] = useState(false)

  // Filter existing funnel flows
  const funnelFlows = flows.filter(
    (f) => f.tags?.includes('funnel') || f.name.toLowerCase().includes('funil')
  )

  // Filter templates
  const filteredTemplates = FUNNEL_TEMPLATES.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchSearch && matchCategory
  })

  const handleUseTemplate = async (template: FunnelTemplate) => {
    setCreating(true)
    try {
      // Create flow with template nodes pre-configured
      const flow = await createNewFlow({
        name: `Funil: ${template.name}`,
        description: template.description,
        tags: ['funnel', template.category],
        nodes: template.stages.map((stage, i) => ({
          id: `stage-${i}`,
          type: 'funnelyticsPage',
          position: { x: 250 * i, y: 200 },
          data: {
            label: stage,
            url: '',
            visitors: 0,
            conversions: 0,
          },
        })),
        edges: template.stages.slice(0, -1).map((_, i) => ({
          id: `edge-${i}`,
          source: `stage-${i}`,
          target: `stage-${i + 1}`,
          type: 'conversion',
        })),
      })

      if (flow) {
        navigate(`/editor/${flow.id}`)
      }
    } catch (err) {
      console.error('Erro ao criar funil:', err)
      toast.error('Erro ao criar funil a partir do template.')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateBlank = async () => {
    setCreating(true)
    try {
      const flow = await createNewFlow({
        name: 'Novo Funil',
        description: 'Funil de conversão personalizado',
        tags: ['funnel'],
        nodes: [],
        edges: [],
      })
      if (flow) {
        navigate(`/editor/${flow.id}`)
      }
    } catch (err) {
      console.error('Erro ao criar funil:', err)
      toast.error('Erro ao criar funil em branco.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Funis de Conversão</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie e visualize funis de conversão para suas campanhas.
          </p>
        </div>
        <button
          onClick={handleCreateBlank}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Funil em Branco
        </button>
      </div>

      {/* Existing funnels */}
      {funnelFlows.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Meus Funis ({funnelFlows.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {funnelFlows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => navigate(`/editor/${flow.id}`)}
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{flow.name}</p>
                  <p className="text-xs text-slate-500">
                    {flow.nodes?.length || 0} etapas •{' '}
                    {new Date(flow.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Templates de Funil</h2>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar templates..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'lead_gen', 'ecommerce', 'engagement', 'whatsapp'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => handleUseTemplate(template)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum template encontrado para esta busca.</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Como funcionam os funis?</h3>
            <p className="text-xs text-blue-700">
              Os templates criam um flow pré-configurado com as etapas do funil. Depois de criar,
              você pode editar livremente no editor visual — adicionar nodes, conectar com dados de
              campanhas, e rastrear métricas em cada etapa. Conecte suas contas Meta Ads em Integrações
              para vincular dados reais às etapas do funil.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
