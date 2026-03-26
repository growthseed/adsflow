/**
 * ============================================
 * REPORT BLOCK RENDERER
 * ============================================
 * Renders individual blocks inside the Report Builder.
 * Each block type has its own visual representation.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings2,
  Type,
  Bold,
  Italic,
  List,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ReportBlock } from '@/types/reportBuilder'
import { getMetricDefinition, formatMetricValue } from '@/types/reports'
import type { MetricKey } from '@/types/reports'

// =====================================================
// PROPS
// =====================================================

interface BlockRendererProps {
  block: ReportBlock
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ReportBlock>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

// =====================================================
// SAMPLE DATA for previews
// =====================================================

const SAMPLE_CHART_DATA = [
  { name: 'Seg', spend: 120, clicks: 340, impressions: 5400 },
  { name: 'Ter', spend: 145, clicks: 380, impressions: 6100 },
  { name: 'Qua', spend: 132, clicks: 320, impressions: 5800 },
  { name: 'Qui', spend: 168, clicks: 420, impressions: 7200 },
  { name: 'Sex', spend: 155, clicks: 400, impressions: 6500 },
  { name: 'Sáb', spend: 98, clicks: 280, impressions: 4200 },
  { name: 'Dom', spend: 82, clicks: 230, impressions: 3800 },
]

const SAMPLE_KPI_VALUES: Record<string, number> = {
  spend: 4520.50,
  impressions: 128450,
  clicks: 3840,
  ctr: 2.99,
  cpc: 1.18,
  conversions: 156,
  reach: 89200,
  cpm: 35.20,
  roas: 4.2,
  leads: 89,
  cost_per_lead: 50.79,
  engagement: 2340,
  cost_per_conversion: 28.98,
  conversion_rate: 4.06,
  cost_per_result: 28.98,
  frequency: 1.44,
}

const SAMPLE_TABLE_DATA = [
  { name: 'Campanha — Conversão Leads', spend: 1850, clicks: 1240, impressions: 42000, ctr: 2.95, conversions: 68 },
  { name: 'Campanha — Tráfego Blog', spend: 920, clicks: 1580, impressions: 38000, ctr: 4.16, conversions: 32 },
  { name: 'Campanha — Remarketing', spend: 680, clicks: 520, impressions: 18000, ctr: 2.89, conversions: 41 },
  { name: 'Campanha — Awareness', spend: 1070, clicks: 500, impressions: 30450, ctr: 1.64, conversions: 15 },
]

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ReportBlockRenderer({
  block,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockRendererProps) {
  return (
    <div
      className={`group relative rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/10'
          : 'border-transparent hover:border-slate-200'
      }`}
      onClick={onSelect}
    >
      {/* Block toolbar */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-400"
          title="Mover para cima"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <div className="p-1 text-slate-300 cursor-grab">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-400"
          title="Mover para baixo"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top-right actions */}
      <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="p-1.5 bg-white rounded-lg shadow border border-slate-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600"
          title="Configurações"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 bg-white rounded-lg shadow border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600"
          title="Remover bloco"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block content */}
      <div className="relative">
        {block.type === 'cover' && <CoverBlock block={block} onUpdate={onUpdate} />}
        {block.type === 'kpi_row' && <KPIRowBlock block={block} />}
        {block.type === 'chart' && <ChartBlock block={block} />}
        {block.type === 'table' && <TableBlock />}
        {block.type === 'text' && <TextBlock block={block} onUpdate={onUpdate} />}
        {block.type === 'campaign_detail' && <CampaignDetailBlock />}
        {block.type === 'comparison' && <ComparisonBlock block={block} />}
        {block.type === 'spacer' && <SpacerBlock block={block} />}
        {block.type === 'image' && <ImageBlock block={block} onUpdate={onUpdate} />}
      </div>
    </div>
  )
}

// =====================================================
// COVER BLOCK
// =====================================================

function CoverBlock({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const title = (block.config?.title as string) || 'Título do Relatório'
  const subtitle = (block.config?.subtitle as string) || 'Análise de desempenho'

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-8 text-white">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-lg font-bold">
          AF
        </div>
        <span className="text-sm text-blue-200">Ads Flow — Efeito Digital</span>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) =>
          onUpdate({ config: { ...block.config, title: e.target.value } })
        }
        className="mt-4 bg-transparent text-3xl font-bold w-full outline-none placeholder-white/50 border-b border-transparent focus:border-white/30 pb-1"
        placeholder="Título do Relatório"
      />
      <input
        type="text"
        value={subtitle}
        onChange={(e) =>
          onUpdate({ config: { ...block.config, subtitle: e.target.value } })
        }
        className="mt-2 bg-transparent text-lg text-blue-100 w-full outline-none placeholder-white/40 border-b border-transparent focus:border-white/30 pb-1"
        placeholder="Subtítulo / descrição"
      />
      <div className="mt-6 flex items-center gap-4 text-sm text-blue-200">
        <span>Período: Últimos 30 dias</span>
        <span>•</span>
        <span>Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}

// =====================================================
// KPI ROW BLOCK
// =====================================================

function KPIRowBlock({ block }: { block: ReportBlock }) {
  const metrics = block.metrics || ['spend', 'impressions', 'clicks', 'ctr']
  const label = (block.config?.label as string) || ''

  return (
    <div className="p-4">
      {label && (
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {label}
        </h3>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 6)}, 1fr)` }}>
        {metrics.map((metricKey) => {
          const def = getMetricDefinition(metricKey as MetricKey)
          const value = SAMPLE_KPI_VALUES[metricKey] ?? 0
          return (
            <div
              key={metricKey}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100"
            >
              <p className="text-xs text-slate-500 font-medium truncate">
                {def?.label || metricKey}
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {def ? formatMetricValue(value, def.format) : String(value)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-emerald-600 font-medium">+12.4%</span>
                <span className="text-xs text-slate-400">vs anterior</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
// CHART BLOCK
// =====================================================

function ChartBlock({ block }: { block: ReportBlock }) {
  const chartType = block.chartType || 'line'
  const label = (block.config?.label as string) || 'Evolução no período'

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{label}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={SAMPLE_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={SAMPLE_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'area' ? (
            <AreaChart data={SAMPLE_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey="spend" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.10} strokeWidth={2} />
            </AreaChart>
          ) : chartType === 'pie' || chartType === 'donut' ? (
            <PieChart>
              <Tooltip />
              <Pie
                data={SAMPLE_TABLE_DATA.map((d) => ({ name: d.name, value: d.spend }))}
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 50 : 0}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {SAMPLE_TABLE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            /* funnel fallback — rendered as horizontal bar */
            <BarChart data={[
              { name: 'Impressões', value: 128450 },
              { name: 'Cliques', value: 3840 },
              { name: 'Leads', value: 89 },
              { name: 'Conversões', value: 56 },
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// =====================================================
// TABLE BLOCK
// =====================================================

function TableBlock() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Campanhas</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-slate-600">Campanha</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">Investimento</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">Cliques</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">Impressões</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">CTR</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">Conversões</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TABLE_DATA.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {formatMetricValue(row.spend, 'currency')}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {formatMetricValue(row.clicks, 'number')}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {formatMetricValue(row.impressions, 'number')}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{row.ctr.toFixed(2)}%</td>
                <td className="px-4 py-2.5 text-right text-slate-600">
                  {formatMetricValue(row.conversions, 'number')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50/60 font-semibold">
              <td className="px-4 py-2.5 text-slate-800">Total</td>
              <td className="px-4 py-2.5 text-right text-slate-800">
                {formatMetricValue(SAMPLE_TABLE_DATA.reduce((s, r) => s + r.spend, 0), 'currency')}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-800">
                {formatMetricValue(SAMPLE_TABLE_DATA.reduce((s, r) => s + r.clicks, 0), 'number')}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-800">
                {formatMetricValue(SAMPLE_TABLE_DATA.reduce((s, r) => s + r.impressions, 0), 'number')}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-800">—</td>
              <td className="px-4 py-2.5 text-right text-slate-800">
                {formatMetricValue(SAMPLE_TABLE_DATA.reduce((s, r) => s + r.conversions, 0), 'number')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// =====================================================
// TEXT BLOCK — editable rich text area
// =====================================================

function TextBlock({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const content = block.content || ''

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Auto-resize
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ content: e.target.value })
      // Auto-resize
      e.target.style.height = 'auto'
      e.target.style.height = e.target.scrollHeight + 'px'
    },
    [onUpdate]
  )

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string) => {
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const text = content
      const selected = text.substring(start, end)
      const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end)
      onUpdate({ content: newText })
    },
    [content, onUpdate]
  )

  // Simple markdown preview
  const renderMarkdown = (text: string) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      let rendered = line
      // Headers
      if (rendered.startsWith('### ')) return <h4 key={i} className="text-base font-semibold text-slate-800 mt-3 mb-1">{rendered.slice(4)}</h4>
      if (rendered.startsWith('## ')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-1">{rendered.slice(3)}</h3>
      if (rendered.startsWith('# ')) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-4 mb-2">{rendered.slice(2)}</h2>
      // Bullet
      if (rendered.startsWith('- ')) return <li key={i} className="text-slate-700 ml-4 list-disc">{rendered.slice(2)}</li>
      // Bold/italic inline
      rendered = rendered.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      rendered = rendered.replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Empty line
      if (!rendered.trim()) return <br key={i} />
      return <p key={i} className="text-slate-700" dangerouslySetInnerHTML={{ __html: rendered }} />
    })
  }

  if (isEditing) {
    return (
      <div className="p-4">
        {/* Mini toolbar */}
        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-slate-200">
          <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Negrito">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Itálico">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('\n- ', '')} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Lista">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('## ', '')} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Título">
            <Type className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
          >
            Concluir
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          className="w-full min-h-[80px] resize-none outline-none text-slate-700 leading-relaxed font-mono text-sm bg-transparent"
          placeholder="Escreva sua análise aqui... (suporta Markdown)"
        />
      </div>
    )
  }

  return (
    <div
      className="p-4 cursor-text min-h-[60px]"
      onClick={() => setIsEditing(true)}
    >
      {content ? (
        <div className="prose prose-sm prose-slate max-w-none">{renderMarkdown(content)}</div>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 italic py-2">
          <Type className="w-4 h-4" />
          Clique para adicionar sua análise...
        </div>
      )}
    </div>
  )
}

// =====================================================
// CAMPAIGN DETAIL BLOCK
// =====================================================

function CampaignDetailBlock() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Detalhamento de Campanhas</h3>
      <div className="space-y-3">
        {SAMPLE_TABLE_DATA.slice(0, 3).map((campaign, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800">{campaign.name}</h4>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Ativo</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Investimento', value: formatMetricValue(campaign.spend, 'currency') },
                { label: 'Cliques', value: formatMetricValue(campaign.clicks, 'number') },
                { label: 'Impressões', value: formatMetricValue(campaign.impressions, 'number') },
                { label: 'CTR', value: `${campaign.ctr.toFixed(2)}%` },
                { label: 'Conversões', value: String(campaign.conversions) },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-slate-500">{m.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// COMPARISON BLOCK
// =====================================================

function ComparisonBlock({ block }: { block: ReportBlock }) {
  const compareLabel = block.compareWith === 'previous_year' ? 'vs Ano anterior' : 'vs Período anterior'

  const comparisonMetrics = [
    { label: 'Investimento', current: 4520, previous: 3980, format: 'currency' as const },
    { label: 'Cliques', current: 3840, previous: 3120, format: 'number' as const },
    { label: 'CTR', current: 2.99, previous: 2.54, format: 'percentage' as const },
    { label: 'Conversões', current: 156, previous: 128, format: 'number' as const },
    { label: 'CPC', current: 1.18, previous: 1.28, format: 'currency' as const },
    { label: 'ROAS', current: 4.2, previous: 3.8, format: 'decimal' as const },
  ]

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Comparativo {compareLabel}</h3>
      <div className="grid grid-cols-3 gap-3">
        {comparisonMetrics.map((m) => {
          const change = m.previous > 0 ? ((m.current - m.previous) / m.previous) * 100 : 0
          const isPositive = change > 0
          // For CPC, lower is better
          const isGood = m.label === 'CPC' ? !isPositive : isPositive

          return (
            <div key={m.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">{m.label}</p>
              <div className="flex items-end gap-3 mt-1">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {formatMetricValue(m.current, m.format)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatMetricValue(m.previous, m.format)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
// SPACER BLOCK
// =====================================================

function SpacerBlock({ block }: { block: ReportBlock }) {
  const height = (block.config?.height as number) || 40

  return (
    <div
      className="flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400"
      style={{ height }}
    >
      Espaçamento ({height}px)
    </div>
  )
}

// =====================================================
// IMAGE BLOCK
// =====================================================

function ImageBlock({ block, onUpdate }: { block: ReportBlock; onUpdate: (u: Partial<ReportBlock>) => void }) {
  const imageUrl = (block.config?.imageUrl as string) || ''

  return (
    <div className="p-4">
      {imageUrl ? (
        <img src={imageUrl} alt="Imagem do relatório" className="w-full rounded-lg object-cover max-h-80" />
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 text-slate-400">
          <p className="text-sm font-medium mb-2">Inserir imagem</p>
          <input
            type="text"
            placeholder="Cole a URL da imagem..."
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-80 outline-none focus:border-blue-400"
            onChange={(e) => onUpdate({ config: { ...block.config, imageUrl: e.target.value } })}
          />
        </div>
      )}
    </div>
  )
}
