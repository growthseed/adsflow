/**
 * NOTIFICATION PANEL (Bell dropdown)
 * Efeito Digital - Ads Flow
 *
 * Painel de notificações do header. Futuro: conectar com Supabase.
 * Por enquanto usa dados locais para demonstrar a UI funcional.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  Zap,
  X,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface Notification {
  id: string
  type: 'sync_success' | 'sync_error' | 'invite' | 'report' | 'campaign_alert'
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

const TYPE_CONFIG = {
  sync_success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  sync_error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  invite: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  report: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  campaign_alert: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
}

// =====================================================
// DEMO DATA (substituir por Supabase real)
// =====================================================

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'sync_success',
    title: 'Sync Concluído',
    message: 'Meta Ads sincronizado com sucesso.',
    time: '5 min atrás',
    read: false,
    link: '/integrations',
  },
  {
    id: '2',
    type: 'campaign_alert',
    title: 'Campanha Pausada',
    message: 'Orçamento diário atingido em "Leads Fev".',
    time: '1h atrás',
    read: false,
    link: '/pacing',
  },
  {
    id: '3',
    type: 'invite',
    title: 'Novo Membro',
    message: 'Maria aceitou o convite para Acme Corp.',
    time: '3h atrás',
    read: true,
    link: '/team',
  },
  {
    id: '4',
    type: 'report',
    title: 'Relatório Pronto',
    message: 'Relatório semanal de performance gerado.',
    time: 'Ontem',
    read: true,
    link: '/reports',
  },
  {
    id: '5',
    type: 'sync_error',
    title: 'Erro de Sync',
    message: 'Falha ao sincronizar Google Ads. Tente novamente.',
    time: '2 dias atrás',
    read: true,
    link: '/integrations',
  },
]

// =====================================================
// COMPONENT
// =====================================================

export default function NotificationPanel() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClick = (notif: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )
    if (notif.link) {
      navigate(notif.link)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-[scaleIn_100ms_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type]
                const Icon = config.icon
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                      !notif.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{notif.time}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id) }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-300 hover:text-slate-500 shrink-0"
                      aria-label="Dispensar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => { setIsOpen(false); navigate('/settings') }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium w-full text-center"
              >
                Configurar notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
