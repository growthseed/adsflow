/**
 * ============================================
 * REPORTS PAGE
 * ============================================
 * Sistema de relatórios de tráfego pago.
 * Templates, criação, preview e compartilhamento.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toPng } from 'html-to-image'
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  Eye,
  Share2,
  RefreshCw,
  Check,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  Users,
  Play,
  X,
  ArrowLeft,
  Image,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdAccounts } from '@/hooks/useMetaAdsData'
import { reportsService } from '@/services/reportsService'
import type { SavedReport } from '@/services/reportsService'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { useToast } from '@/components/UI/Toast'
import { TableSkeleton } from '@/components/UI/Skeleton'
import { exportReportToPDF, downloadPDF } from '@/services/pdfExportService'
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPE_DESCRIPTIONS,
  DEFAULT_METRICS_BY_REPORT_TYPE,
  METRIC_DEFINITIONS,
  DATE_PRESET_LABELS,
  getMetricDefinition,
  formatMetricValue,
} from '@/types/reports'
import type {
  ReportType,
  MetricKey,
  DatePreset,
  ReportFilters,
} from '@/types/reports'

// =====================================================
// REPORT TEMPLATE CARDS
// =====================================================

const TEMPLATE_ICONS: Record<ReportType, React.ElementType> = {
  campaign_overview: BarChart3,
  adset_performance: Target,
  ad_creative: Play,
  audience_insights: Users,
  conversion_funnel: TrendingUp,
  budget_analysis: DollarSign,
  roi_analysis: TrendingUp,
  comparative: BarChart3,
  custom: Zap,
}

const TEMPLATE_COLORS: Record<ReportType, string> = {
  campaign_overview: 'bg-blue-600',
  adset_performance: 'bg-purple-600',
  ad_creative: 'bg-pink-600',
  audience_insights: 'bg-indigo-600',
  conversion_funnel: 'bg-green-600',
  budget_analysis: 'bg-amber-600',
  roi_analysis: 'bg-emerald-600',
  comparative: 'bg-cyan-600',
  custom: 'bg-slate-600',
}

// =====================================================
// CREATE REPORT MODAL
// =====================================================

interface CreateReportModalProps {
  open: boolean
  onClose: () => void
  onCreate: (report: {
    name: string
    description: string
    report_type: ReportType
    ad_account_id: string
    metrics: MetricKey[]
    filters: ReportFilters
  }) => Promise<void>
  accounts: Array<{ id: string; account_name: string }>
}

function CreateReportModal({ open, onClose, onCreate, accounts }: CreateReportModalProps) {
  const [step, setStep] = useState<'type' | 'config'>('type')
  const [reportType, setReportType] = useState<ReportType>('campaign_overview')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [datePreset, setDatePreset] = useState<DatePreset>('last_30d')
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([])
  const [loading, setLoading] = useState(false)

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Auto-fill metrics when type changes
  useEffect(() => {
    setSelectedMetrics(DEFAULT_METRICS_BY_REPORT_TYPE[reportType] || [])
    setName(REPORT_TYPE_LABELS[reportType])
  }, [reportType])

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep('type')
      setReportType('campaign_overview')
      setAccountId(accounts[0]?.id || '')
    }
  }, [open, accounts])

  if (!open) return null

  const handleCreate = async () => {
    setLoading(true)
    try {
      await onCreate({
        name,
        description,
        report_type: reportType,
        ad_account_id: accountId,
        metrics: selectedMetrics,
        filters: {
          datePreset,
          platforms: ['meta_ads'],
          accountIds: [accountId],
          granularity: 'day',
          breakdown: 'campaign',
        },
      })
      onClose()
    } catch (err) {
      console.error('Error creating report:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 'config' && (
              <button onClick={() => setStep('type')} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'type' ? 'Escolha o Tipo de Relatório' : 'Configurar Relatório'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'type' ? 'Selecione um template para começar' : 'Ajuste as configurações'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => {
                const Icon = TEMPLATE_ICONS[type]
                const color = TEMPLATE_COLORS[type]
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type)
                      setStep('config')
                    }}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <h3 className="font-medium text-sm text-slate-900 group-hover:text-blue-700">
                        {REPORT_TYPE_LABELS[type]}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {REPORT_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Relatório</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Relatório mensal para o cliente..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta de Anúncios</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Preset */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {Object.entries(DATE_PRESET_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metrics */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Métricas ({selectedMetrics.length} selecionadas)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  {METRIC_DEFINITIONS.map((metric) => (
                    <button
                      key={metric.key}
                      onClick={() => toggleMetric(metric.key)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                        selectedMetrics.includes(metric.key)
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {selectedMetrics.includes(metric.key) && <Check className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{metric.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name || !accountId || selectedMetrics.length === 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar Relatório
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// REPORT PREVIEW
// =====================================================

function ReportPreview({
  report,
  onClose,
  onGenerate,
  onShare,
  generating,
}: {
  report: SavedReport
  onClose: () => void
  onGenerate: () => void
  onShare: () => void
  generating: boolean
}) {
  const data = report.data
  const metrics = report.metrics
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleExportPNG = async () => {
    if (!exportRef.current || !data) return
    setExporting(true)
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Erro ao exportar imagem:', err)
      alert('Erro ao exportar imagem. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!data) return
    setExportingPDF(true)
    try {
      const blob = await exportReportToPDF(report, {
        agencyName: 'Efeito Digital — Ads Flow',
        accentColor: '#1e40af',
      })
      const filename = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`
      downloadPDF(blob, filename)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao exportar PDF. Gere o relatório primeiro.')
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{report.name}</h2>
            {report.description && (
              <p className="text-xs text-slate-500 mt-0.5">{report.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Gerar
            </button>
            {data && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {exportingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  PDF
                </button>
                <button
                  onClick={handleExportPNG}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {exporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Image className="w-3.5 h-3.5" />
                  )}
                  PNG
                </button>
              </>
            )}
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!data && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-700 mb-1">Relatório não gerado</h3>
              <p className="text-sm text-slate-400 mb-4">
                Clique em "Gerar" para produzir os dados do relatório.
              </p>
            </div>
          )}

          {data && (
            <div ref={exportRef} className="space-y-6 bg-white p-2">
              {/* Report Title (visible in export) */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{report.name}</h3>
                  <p className="text-sm text-slate-500">
                    Período: {data.period.start} a {data.period.end}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Gerado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
                  <p className="font-semibold text-blue-600">Ads Flow — Efeito Digital</p>
                </div>
              </div>

              {/* Totals KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.slice(0, 8).map((key) => {
                  const def = getMetricDefinition(key)
                  const value = data.totals[key]
                  if (!def || value === undefined) return null
                  return (
                    <div key={key} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">{def.label}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatMetricValue(value, def.format)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Data Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">
                          Campanha
                        </th>
                        {metrics.map((key) => {
                          const def = getMetricDefinition(key)
                          if (!def) return null
                          return (
                            <th
                              key={key}
                              className="px-3 py-2.5 text-right text-xs font-medium text-slate-500 uppercase"
                            >
                              {def.label}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm text-slate-900 font-medium max-w-xs truncate">
                            {row.campaign_name || row.adset_name || row.ad_name || '-'}
                          </td>
                          {metrics.map((key) => {
                            const def = getMetricDefinition(key)
                            const value = row.metrics[key]
                            if (!def) return null
                            return (
                              <td key={key} className="px-3 py-2.5 text-sm text-slate-700 text-right">
                                {value !== undefined ? formatMetricValue(value, def.format) : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-4 py-2.5 text-sm text-slate-900">Total</td>
                        {metrics.map((key) => {
                          const def = getMetricDefinition(key)
                          const value = data.totals[key]
                          if (!def) return null
                          return (
                            <td key={key} className="px-3 py-2.5 text-sm text-slate-900 text-right">
                              {value !== undefined ? formatMetricValue(value, def.format) : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function ReportsPage() {
  const { user, activeClient } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const { activeAccounts } = useAdAccounts()
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [previewReport, setPreviewReport] = useState<SavedReport | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!user) return
    try {
      const data = await reportsService.list(user.id, activeClient?.client_id)
      setReports(data)
    } catch (err) {
      console.error('Error fetching reports:', err)
      toast.error('Erro ao carregar relatórios.')
    } finally {
      setLoading(false)
    }
  }, [user, activeClient?.client_id])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Create report
  const handleCreate = async (data: {
    name: string
    description: string
    report_type: ReportType
    ad_account_id: string
    metrics: MetricKey[]
    filters: ReportFilters
  }) => {
    if (!user) return
    await reportsService.create({
      user_id: user.id,
      client_id: activeClient?.client_id,
      ad_account_id: data.ad_account_id,
      name: data.name,
      description: data.description || undefined,
      report_type: data.report_type,
      metrics: data.metrics,
      filters: data.filters,
    })
    await fetchReports()
  }

  // Generate report data
  const handleGenerate = async (report: SavedReport) => {
    setGenerating(true)
    try {
      const data = await reportsService.generate(report)
      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, data, status: 'ready', last_generated_at: new Date().toISOString() } : r
        )
      )
      if (previewReport?.id === report.id) {
        setPreviewReport({ ...report, data, status: 'ready' })
      }
    } catch (err) {
      console.error('Error generating report:', err)
      toast.error('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // Share report
  const handleShare = async (report: SavedReport) => {
    try {
      const link = await reportsService.createShareLink(report.id)
      await navigator.clipboard.writeText(link)
      setCopiedLink(report.id)
      setTimeout(() => setCopiedLink(null), 3000)
      await fetchReports()
    } catch (err) {
      console.error('Error sharing report:', err)
      toast.error('Erro ao compartilhar relatório.')
    }
  }

  // Delete report
  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Excluir relatório',
      message: 'Deseja excluir este relatório?',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await reportsService.delete(id)
      await fetchReports()
    } catch (err) {
      console.error('Error deleting report:', err)
      toast.error('Erro ao excluir relatório.')
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
    generating: { label: 'Gerando...', color: 'bg-blue-100 text-blue-600' },
    ready: { label: 'Pronto', color: 'bg-green-100 text-green-600' },
    error: { label: 'Erro', color: 'bg-red-100 text-red-600' },
    archived: { label: 'Arquivado', color: 'bg-slate-100 text-slate-500' },
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 mt-1">
            Gere e compartilhe relatórios de performance com seus clientes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={activeAccounts.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Relatório
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <TableSkeleton rows={4} cols={5} />
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum relatório criado</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Crie relatórios de performance para compartilhar com seus clientes.
            {activeAccounts.length === 0 && (
              <span className="block mt-2 text-amber-600">
                Conecte uma conta de anúncios primeiro em Integrações.
              </span>
            )}
          </p>
          {activeAccounts.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Relatório
            </button>
          )}
        </div>
      )}

      {/* Reports Grid */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = TEMPLATE_ICONS[report.report_type as ReportType] || FileText
            const color = TEMPLATE_COLORS[report.report_type as ReportType] || 'bg-slate-600'
            const status = statusConfig[report.status] || statusConfig.draft

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{report.name}</h3>
                        <p className="text-xs text-slate-500">
                          {REPORT_TYPE_LABELS[report.report_type as ReportType] || report.report_type}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.description}</p>
                  )}

                  {/* Metrics count */}
                  <div className="text-xs text-slate-400 mb-3">
                    {report.metrics.length} métricas |{' '}
                    {report.last_generated_at
                      ? `Gerado ${new Date(report.last_generated_at).toLocaleDateString('pt-BR')}`
                      : 'Não gerado'}
                  </div>

                  {/* Share link */}
                  {report.share_token && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3">
                      <ExternalLink className="w-3 h-3" />
                      <span>Link compartilhável ativo</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewReport(report)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleGenerate(report)}
                      disabled={generating}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gerar
                    </button>
                    <button
                      onClick={() => handleShare(report)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {copiedLink === report.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-600">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          Link
                        </>
                      )}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center gap-1 px-2 py-1.5 text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateReportModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        accounts={activeAccounts.map((a) => ({ id: a.id, account_name: a.account_name }))}
      />

      {/* Preview Modal */}
      {previewReport && (
        <ReportPreview
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onGenerate={() => handleGenerate(previewReport)}
          onShare={() => handleShare(previewReport)}
          generating={generating}
        />
      )}
    </div>
  )
}
