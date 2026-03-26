/**
 * ============================================
 * AUTOMATION PANEL — Report Schedules
 * ============================================
 * Painel de relatórios automatizados.
 * Mostra agendamentos, toggle ativar/desativar,
 * countdown até próximo envio.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Play,
  Pause,
  Settings,
  Loader2,
  Mail,
  CalendarClock,
} from 'lucide-react'
import supabase from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'

// =====================================================
// TYPES
// =====================================================

interface ReportSchedule {
  id: string
  report_id: string
  client_id: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  day_of_week: number | null
  day_of_month: number | null
  time_of_day: string
  timezone: string
  recipients: Array<{ email: string; name: string }>
  is_active: boolean
  last_sent_at: string | null
  next_send_at: string | null
  send_count: number
  created_at: string
  report_name?: string
}

// =====================================================
// HELPERS
// =====================================================

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCountdown(iso: string | null): string {
  if (!iso) return '-'
  const target = new Date(iso).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return 'Em breve'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}min`
}

// =====================================================
// COMPONENT
// =====================================================

interface AutomationPanelProps {
  onEditSchedule?: (scheduleId: string, reportId: string) => void
}

export default function AutomationPanel({ onEditSchedule }: AutomationPanelProps) {
  const { activeClient } = useAuth()
  const toast = useToast()
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const clientId = activeClient?.client_id

  const fetchSchedules = useCallback(async () => {
    if (!clientId) return
    try {
      // Join with reports to get name
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*, reports(name)')
        .eq('client_id', clientId)
        .order('next_send_at', { ascending: true })

      if (error) throw error

      const mapped = (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        report_name: (s.reports as Record<string, string> | null)?.name || 'Relatório',
      })) as ReportSchedule[]

      setSchedules(mapped)
    } catch (err) {
      console.error('Error fetching schedules:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleToggle = async (schedule: ReportSchedule) => {
    setTogglingId(schedule.id)
    try {
      const { error } = await supabase
        .from('report_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id)

      if (error) throw error

      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, is_active: !s.is_active } : s))
      )
      toast.success(schedule.is_active ? 'Agendamento pausado.' : 'Agendamento ativado.')
    } catch {
      toast.error('Erro ao alterar agendamento.')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Carregando agendamentos...</p>
      </div>
    )
  }

  // ── Empty State ──
  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarClock className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Nenhum relatório automatizado</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Configure o envio automático no botão "Agendar" de cada relatório.
        </p>
      </div>
    )
  }

  // ── Table ──
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Relatórios Automatizados</h3>
          <span className="text-xs text-slate-400 ml-1">({schedules.length})</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Relatório</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Frequência</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Próximo Envio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Último Envio</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Dest.</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{schedule.report_name}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">
                      {FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {schedule.is_active && schedule.next_send_at ? (
                    <div>
                      <p className="text-sm text-slate-700">{formatDateTime(schedule.next_send_at)}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        em {getCountdown(schedule.next_send_at)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">{formatDateTime(schedule.last_sent_at)}</span>
                  {schedule.send_count > 0 && (
                    <span className="text-xs text-slate-400 ml-1">({schedule.send_count}x)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      schedule.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {schedule.is_active ? (
                      <>
                        <Play className="w-3 h-3" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" />
                        Pausado
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">{schedule.recipients?.length || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleToggle(schedule)}
                      disabled={togglingId === schedule.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        schedule.is_active
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={schedule.is_active ? 'Pausar' : 'Ativar'}
                    >
                      {togglingId === schedule.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : schedule.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    {onEditSchedule && (
                      <button
                        onClick={() => onEditSchedule(schedule.id, schedule.report_id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar agendamento"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
