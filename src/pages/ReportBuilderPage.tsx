/**
 * ============================================
 * REPORT BUILDER PAGE
 * ============================================
 * Visual drag-and-drop report builder inspired by Reportei.
 * Users can compose reports from block types with editable
 * text analysis sections between KPI/chart blocks.
 */

import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  FileDown,
  Share2,
  Plus,
  LayoutTemplate,
  Type,
  BarChart3,
  Table2,
  Target,
  GitCompareArrows,
  Minus,
  ImageIcon,
  Megaphone,
  Grip,
  FileText,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react'
import ReportBlockRenderer from '@/components/Reports/ReportBlockRenderer'
import { REPORT_BUILDER_TEMPLATES } from '@/data/reportTemplates'
import type { ReportBlock, ReportBlockType, BuilderReportTemplate } from '@/types/reportBuilder'
import { METRIC_DEFINITIONS } from '@/types/reports'

// =====================================================
// BLOCK PALETTE DEFINITIONS
// =====================================================

interface PaletteItem {
  type: ReportBlockType
  label: string
  description: string
  icon: React.ElementType
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'cover', label: 'Capa', description: 'Logo, título e período', icon: LayoutTemplate },
  { type: 'kpi_row', label: 'KPIs', description: 'Linha de métricas', icon: BarChart3 },
  { type: 'chart', label: 'Gráfico', description: 'Line, bar, pie, area', icon: BarChart3 },
  { type: 'table', label: 'Tabela', description: 'Campanhas com métricas', icon: Table2 },
  { type: 'text', label: 'Texto', description: 'Análise e comentários', icon: Type },
  { type: 'campaign_detail', label: 'Campanhas', description: 'Detalhe por campanha', icon: Megaphone },
  { type: 'comparison', label: 'Comparativo', description: 'Atual vs anterior', icon: GitCompareArrows },
  { type: 'spacer', label: 'Espaçador', description: 'Espaço entre blocos', icon: Minus },
  { type: 'image', label: 'Imagem', description: 'Upload ou URL', icon: ImageIcon },
]

// =====================================================
// HELPERS
// =====================================================

function createBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createDefaultBlock(type: ReportBlockType, order: number): ReportBlock {
  const base: ReportBlock = { id: createBlockId(), type, order, config: {} }

  switch (type) {
    case 'cover':
      base.config = { title: 'Novo Relatório', subtitle: 'Análise de desempenho' }
      break
    case 'kpi_row':
      base.metrics = ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions']
      break
    case 'chart':
      base.chartType = 'line'
      base.dataSource = 'meta_ads'
      break
    case 'text':
      base.content = ''
      break
    case 'comparison':
      base.compareWith = 'previous_period'
      break
    case 'spacer':
      base.config = { height: 40 }
      break
    default:
      break
  }

  return base
}

function deepCloneBlocks(blocks: ReportBlock[]): ReportBlock[] {
  return blocks.map((b) => ({
    ...b,
    id: createBlockId(),
    config: { ...b.config },
    metrics: b.metrics ? [...b.metrics] : undefined,
    campaignIds: b.campaignIds ? [...b.campaignIds] : undefined,
  }))
}

// =====================================================
// AVAILABLE METRICS for settings panel
// =====================================================

const METRIC_CATEGORIES = [
  { key: 'reach', label: 'Alcance' },
  { key: 'traffic', label: 'Tráfego' },
  { key: 'cost', label: 'Custos' },
  { key: 'conversion', label: 'Conversões' },
  { key: 'engagement', label: 'Engajamento' },
  { key: 'roi', label: 'ROI' },
  { key: 'leads', label: 'Leads' },
] as const

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ReportBuilderPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // State
  const [reportName, setReportName] = useState('Novo Relatório')
  const [blocks, setBlocks] = useState<ReportBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<'meta_ads' | 'google_ads' | 'both'>('meta_ads')
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [isDirty, setIsDirty] = useState(false)

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null

  // Load template or existing report
  useEffect(() => {
    if (id) {
      // Could load from Supabase here
      setShowTemplates(false)
    }
  }, [id])

  // ── Block CRUD ───────────────────────────────

  const addBlock = useCallback((type: ReportBlockType) => {
    setBlocks((prev) => {
      const order = prev.length
      const newBlock = createDefaultBlock(type, order)
      return [...prev, newBlock]
    })
    setIsDirty(true)
  }, [])

  const updateBlock = useCallback((blockId: string, updates: Partial<ReportBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    )
    setIsDirty(true)
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId)
      return filtered.map((b, i) => ({ ...b, order: i }))
    })
    setSelectedBlockId((prev) => (prev === blockId ? null : prev))
    setIsDirty(true)
  }, [])

  const moveBlockUp = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((b, i) => ({ ...b, order: i }))
    })
    setIsDirty(true)
  }, [])

  const moveBlockDown = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((b, i) => ({ ...b, order: i }))
    })
    setIsDirty(true)
  }, [])

  // ── Template selection ───────────────────────

  const loadTemplate = useCallback((template: BuilderReportTemplate) => {
    const cloned = deepCloneBlocks(template.blocks)
    setBlocks(cloned)
    setReportName(template.name)
    setShowTemplates(false)
    setIsDirty(true)
  }, [])

  const startBlank = useCallback(() => {
    setBlocks([createDefaultBlock('cover', 0)])
    setShowTemplates(false)
    setIsDirty(true)
  }, [])

  // ── Save handler ─────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // Simulate save — in production, call reportsService
    await new Promise((r) => setTimeout(r, 800))
    setIsSaving(false)
    setIsDirty(false)
  }, [])

  // ── TEMPLATE SELECTION SCREEN ────────────────

  if (showTemplates) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Relatórios
          </button>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Report Builder</h1>
            <p className="text-slate-500 mt-2">Escolha um template ou comece do zero</p>
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {REPORT_BUILDER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => loadTemplate(tpl)}
                className="text-left bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{tpl.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{tpl.description}</p>
                <div className="flex gap-1.5 mt-4">
                  {tpl.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                    >
                      {p === 'meta_ads' ? 'Meta' : p === 'google_ads' ? 'Google' : p.toUpperCase()}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-blue-600 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Usar template <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Start blank */}
          <div className="text-center">
            <button
              onClick={startBlank}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Começar do zero
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── BUILDER LAYOUT ───────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* ── TOP BAR ─────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/reports')}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* Report name */}
        <input
          type="text"
          value={reportName}
          onChange={(e) => { setReportName(e.target.value); setIsDirty(true); }}
          className="text-lg font-semibold text-slate-900 outline-none bg-transparent border-b border-transparent focus:border-blue-400 px-1 min-w-[200px]"
        />

        {isDirty && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            Não salvo
          </span>
        )}

        <div className="flex-1" />

        {/* Platform selector */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {(['meta_ads', 'google_ads', 'both'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                platform === p
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p === 'meta_ads' ? 'Meta Ads' : p === 'google_ads' ? 'Google Ads' : 'Ambos'}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Exportar PDF">
          <FileDown className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Compartilhar">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── MAIN CONTENT ────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR: Block Palette ───── */}
        <div className="w-56 bg-white border-r border-slate-200 p-3 overflow-y-auto shrink-0">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Blocos
          </h2>
          <div className="space-y-1">
            {PALETTE_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors group"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-400 truncate group-hover:text-blue-400">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── CENTER: Report Preview ────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-[820px] mx-auto">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <Grip className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Nenhum bloco ainda
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">
                  Clique nos blocos à esquerda para montar seu relatório ou adicione abaixo.
                </p>
                <button
                  onClick={() => addBlock('cover')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Capa
                </button>
              </div>
            ) : (
              <div className="space-y-3 pl-10">
                {blocks
                  .sort((a, b) => a.order - b.order)
                  .map((block, index) => (
                    <ReportBlockRenderer
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      isFirst={index === 0}
                      isLast={index === blocks.length - 1}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                      onDelete={() => deleteBlock(block.id)}
                      onMoveUp={() => moveBlockUp(block.id)}
                      onMoveDown={() => moveBlockDown(block.id)}
                    />
                  ))}

                {/* Add block button at bottom */}
                <div className="flex justify-center py-6">
                  <button
                    onClick={() => addBlock('text')}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar bloco
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Block Settings ──── */}
        <div className="w-72 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
          {selectedBlock ? (
            <BlockSettings
              block={selectedBlock}
              onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
              onClose={() => setSelectedBlockId(null)}
            />
          ) : (
            <div className="p-4 text-center py-16">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Selecione um bloco</p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em um bloco para editar suas configurações
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// BLOCK SETTINGS PANEL
// =====================================================

interface BlockSettingsProps {
  block: ReportBlock
  onUpdate: (updates: Partial<ReportBlock>) => void
  onClose: () => void
}

function BlockSettings({ block, onUpdate, onClose }: BlockSettingsProps) {
  const blockTypeLabel: Record<ReportBlockType, string> = {
    cover: 'Capa',
    kpi_row: 'KPIs',
    chart: 'Gráfico',
    table: 'Tabela',
    text: 'Texto',
    campaign_detail: 'Campanhas',
    comparison: 'Comparativo',
    spacer: 'Espaçador',
    image: 'Imagem',
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">
            {blockTypeLabel[block.type]}
          </h3>
          <p className="text-xs text-slate-400">Configurações do bloco</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings by type */}
      {block.type === 'kpi_row' && (
        <KPISettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'chart' && (
        <ChartSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'comparison' && (
        <ComparisonSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'spacer' && (
        <SpacerSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'cover' && (
        <CoverSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'text' && (
        <div className="text-sm text-slate-500">
          <p>Clique no bloco de texto para editar o conteúdo diretamente.</p>
          <p className="mt-2 text-xs text-slate-400">Suporta Markdown: **negrito**, *itálico*, ## títulos, - listas</p>
        </div>
      )}
      {(block.type === 'table' || block.type === 'campaign_detail') && (
        <div className="text-sm text-slate-500">
          <p>Os dados das campanhas serão preenchidos automaticamente com base no período e plataforma selecionados.</p>
        </div>
      )}
      {block.type === 'image' && (
        <div className="text-sm text-slate-500">
          <p>Clique no bloco para inserir a URL da imagem.</p>
        </div>
      )}
    </div>
  )
}

// ── KPI Settings ────────────────────────────────

function KPISettings({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const currentMetrics = block.metrics || []

  const toggleMetric = (key: string) => {
    const next = currentMetrics.includes(key)
      ? currentMetrics.filter((m) => m !== key)
      : [...currentMetrics, key]
    onUpdate({ metrics: next })
  }

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Label (opcional)</label>
        <input
          type="text"
          value={(block.config?.label as string) || ''}
          onChange={(e) => onUpdate({ config: { ...block.config, label: e.target.value } })}
          placeholder="Ex: Meta Ads"
          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
        />
      </div>

      {/* Metrics selector */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-2 block">
          Métricas ({currentMetrics.length} selecionadas)
        </label>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {METRIC_CATEGORIES.map((cat) => {
            const metricsInCat = METRIC_DEFINITIONS.filter((m) => m.category === cat.key)
            if (metricsInCat.length === 0) return null
            return (
              <div key={cat.key}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {cat.label}
                </p>
                <div className="space-y-0.5">
                  {metricsInCat.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={currentMetrics.includes(m.key)}
                        onChange={() => toggleMetric(m.key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-slate-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Chart Settings ──────────────────────────────

function ChartSettings({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const chartTypes = [
    { value: 'line', label: 'Linha' },
    { value: 'bar', label: 'Barras' },
    { value: 'area', label: 'Área' },
    { value: 'pie', label: 'Pizza' },
    { value: 'donut', label: 'Donut' },
    { value: 'funnel', label: 'Funil' },
  ] as const

  const dataSources = [
    { value: 'meta_ads', label: 'Meta Ads' },
    { value: 'google_ads', label: 'Google Ads' },
    { value: 'ga4', label: 'Google Analytics 4' },
  ]

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Título</label>
        <input
          type="text"
          value={(block.config?.label as string) || ''}
          onChange={(e) => onUpdate({ config: { ...block.config, label: e.target.value } })}
          placeholder="Evolução no período"
          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
        />
      </div>

      {/* Chart type */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-2 block">Tipo de gráfico</label>
        <div className="grid grid-cols-3 gap-1.5">
          {chartTypes.map((ct) => (
            <button
              key={ct.value}
              onClick={() => onUpdate({ chartType: ct.value })}
              className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                block.chartType === ct.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data source */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-2 block">Fonte de dados</label>
        <div className="space-y-1.5">
          {dataSources.map((ds) => (
            <label
              key={ds.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="radio"
                name="chart-data-source"
                checked={block.dataSource === ds.value}
                onChange={() => onUpdate({ dataSource: ds.value })}
                className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-700">{ds.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Comparison Settings ─────────────────────────

function ComparisonSettings({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-2 block">Comparar com</label>
      <div className="space-y-1.5">
        {[
          { value: 'previous_period', label: 'Período anterior' },
          { value: 'previous_year', label: 'Mesmo período, ano anterior' },
        ].map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="radio"
              name="compare-with"
              checked={block.compareWith === opt.value}
              onChange={() => onUpdate({ compareWith: opt.value as ReportBlock['compareWith'] })}
              className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span className="text-xs text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Spacer Settings ─────────────────────────────

function SpacerSettings({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const height = (block.config?.height as number) || 40

  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-2 block">Altura ({height}px)</label>
      <input
        type="range"
        min={16}
        max={120}
        step={8}
        value={height}
        onChange={(e) => onUpdate({ config: { ...block.config, height: Number(e.target.value) } })}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>16px</span>
        <span>120px</span>
      </div>
    </div>
  )
}

// ── Cover Settings ──────────────────────────────

function CoverSettings({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Título</label>
        <input
          type="text"
          value={(block.config?.title as string) || ''}
          onChange={(e) => onUpdate({ config: { ...block.config, title: e.target.value } })}
          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Subtítulo</label>
        <input
          type="text"
          value={(block.config?.subtitle as string) || ''}
          onChange={(e) => onUpdate({ config: { ...block.config, subtitle: e.target.value } })}
          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
        />
      </div>
    </div>
  )
}
