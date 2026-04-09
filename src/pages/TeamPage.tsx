/**
 * TEAM PAGE
 * Efeito Digital - Ads Flow
 *
 * Gestão de equipe do cliente ativo.
 * Lista membros, convites pendentes, alterar roles, convidar novos.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { TableSkeleton } from '@/components/UI/Skeleton'
import { membersService, invitesService } from '@/services/clientsService'
import type { ClientMember, TeamInvite } from '@/services/clientsService'
import type { ClientRole } from '@/contexts/AuthContext'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  BarChart3,
  Eye,
  Trash2,
  Clock,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from 'lucide-react'

// =====================================================
// CONSTANTS
// =====================================================

const ROLE_LABELS: Record<ClientRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  analyst: 'Analista',
  viewer: 'Visualizador',
}

const ROLE_DESCRIPTIONS: Record<ClientRole, string> = {
  owner: 'Acesso total, faturamento e exclusão',
  admin: 'Gerenciar equipe, clientes e integrações',
  manager: 'Gerenciar campanhas e relatórios',
  analyst: 'Visualizar e criar campanhas/relatórios',
  viewer: 'Apenas visualização',
}

const ROLE_COLORS: Record<ClientRole, string> = {
  owner: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  analyst: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
}

const ROLE_ICONS: Record<ClientRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  manager: Users,
  analyst: BarChart3,
  viewer: Eye,
}

const ASSIGNABLE_ROLES: ClientRole[] = ['admin', 'manager', 'analyst', 'viewer']

// =====================================================
// INVITE MODAL
// =====================================================

function InviteModal({
  clientId,
  invitedBy,
  onClose,
  onInvited,
}: {
  clientId: string
  invitedBy: string
  onClose: () => void
  onInvited: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ClientRole>('analyst')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  const validateEmail = (val: string) => {
    if (!val) { setEmailError(''); return true }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Email inválido')
      return false
    }
    setEmailError('')
    return true
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !validateEmail(email)) return
    setError('')
    setSending(true)

    try {
      await invitesService.create({
        client_id: clientId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: invitedBy,
      })
      setSuccess(true)
      setTimeout(() => {
        onInvited()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Erro ao enviar convite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Convidar Membro</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-slate-900">Convite Enviado!</p>
            <p className="text-sm text-slate-500 mt-1">
              Um email será enviado para <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value) }}
                  onBlur={() => validateEmail(email)}
                  placeholder="nome@empresa.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    emailError ? 'border-red-400' : 'border-slate-300'
                  }`}
                  required
                  autoFocus
                />
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Permissão</label>
              <div className="space-y-2">
                {ASSIGNABLE_ROLES.map((r) => {
                  const Icon = ROLE_ICONS[r]
                  return (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        role === r
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="sr-only"
                      />
                      <Icon className={`w-4 h-4 ${role === r ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{ROLE_LABELS[r]}</p>
                        <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[r]}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          role === r ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {role === r && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Enviando...' : 'Enviar Convite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// =====================================================
// MEMBER ROW
// =====================================================

function MemberRow({
  member,
  isMe,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: ClientMember
  isMe: boolean
  canManage: boolean
  onChangeRole: (role: ClientRole) => void
  onRemove: () => void
}) {
  const RoleIcon = ROLE_ICONS[member.role]

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {member.user?.name || 'Usuário'}
            {isMe && (
              <span className="ml-2 text-xs text-slate-400 font-normal">(você)</span>
            )}
          </p>
          <p className="text-xs text-slate-500">{member.user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canManage && !isMe && member.role !== 'owner' ? (
          <>
            <select
              value={member.role}
              onChange={(e) => onChangeRole(e.target.value as ClientRole)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              onClick={onRemove}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remover membro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[member.role]}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            {ROLE_LABELS[member.role]}
          </span>
        )}
      </div>
    </div>
  )
}

// =====================================================
// INVITE ROW
// =====================================================

function InviteRow({
  invite,
  onCancel,
}: {
  invite: TeamInvite
  onCancel: () => void
}) {
  const isExpired = new Date(invite.expires_at) < new Date()

  return (
    <div className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{invite.email}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[invite.role]}`}>
              {ROLE_LABELS[invite.role]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Expirado' : `Expira ${new Date(invite.expires_at).toLocaleDateString('pt-BR')}`}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function TeamPage() {
  const { user, activeClient, hasClientRole } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [members, setMembers] = useState<ClientMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  const clientId = activeClient?.client_id
  const canManage = hasClientRole('admin')

  const loadData = useCallback(async () => {
    if (!clientId) {
      setLoading(false)
      return
    }
    try {
      const [membersData, invitesData] = await Promise.all([
        membersService.list(clientId),
        canManage ? invitesService.list(clientId) : Promise.resolve([]),
      ])
      setMembers(membersData)
      setInvites(invitesData)
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId, canManage])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleChangeRole = async (memberId: string, newRole: ClientRole) => {
    try {
      await membersService.updateRole(memberId, newRole)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
      toast.success('Permissão atualizada!')
    } catch (err) {
      console.error('Erro ao alterar role:', err)
      toast.error('Erro ao alterar permissão.')
    }
  }

  const handleRemove = async (memberId: string, memberName: string) => {
    const ok = await confirm({
      title: 'Remover membro',
      message: `Remover "${memberName}" da equipe?`,
      confirmLabel: 'Remover',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await membersService.remove(memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success(`"${memberName}" removido da equipe.`)
    } catch (err) {
      console.error('Erro ao remover membro:', err)
      toast.error('Erro ao remover membro.')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    const ok = await confirm({
      title: 'Cancelar convite',
      message: 'Tem certeza que deseja cancelar este convite?',
      confirmLabel: 'Cancelar Convite',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await invitesService.cancel(inviteId)
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      toast.info('Convite cancelado.')
    } catch (err) {
      console.error('Erro ao cancelar convite:', err)
      toast.error('Erro ao cancelar convite.')
    }
  }

  // No active client
  if (!clientId) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum cliente selecionado</h3>
        <p className="text-sm text-slate-500">Selecione um cliente no menu lateral para gerenciar a equipe.</p>
      </div>
    )
  }

  const owners = members.filter((m) => m.role === 'owner')
  const otherMembers = members.filter((m) => m.role !== 'owner')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeClient?.client.name} — {members.length} membro{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Convidar Membro
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {(['owner', 'admin', 'manager', 'analyst', 'viewer'] as ClientRole[]).map((r) => {
          const Icon = ROLE_ICONS[r]
          const count = members.filter((m) => m.role === r).length
          if (count === 0) return null
          return (
            <span
              key={r}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[r]}`}
            >
              <Icon className="w-3 h-3" />
              {count} {ROLE_LABELS[r]}{count > 1 ? 's' : ''}
            </span>
          )
        })}
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="space-y-6">
          {/* Owners */}
          {owners.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Proprietários
              </h2>
              <div className="space-y-2">
                {owners.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isMe={m.user_id === user?.id}
                    canManage={false}
                    onChangeRole={() => {}}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other members */}
          {otherMembers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Membros
              </h2>
              <div className="space-y-2">
                {otherMembers.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isMe={m.user_id === user?.id}
                    canManage={canManage}
                    onChangeRole={(role) => handleChangeRole(m.id, role)}
                    onRemove={() => handleRemove(m.id, m.user?.name || 'membro')}
                  />
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhum membro na equipe.</p>
            </div>
          )}

          {/* Pending invites */}
          {canManage && invites.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                Convites Pendentes ({invites.length})
              </h2>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <InviteRow
                    key={inv.id}
                    invite={inv}
                    onCancel={() => handleCancelInvite(inv.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && clientId && user && (
        <InviteModal
          clientId={clientId}
          invitedBy={user.id}
          onClose={() => setShowInvite(false)}
          onInvited={loadData}
        />
      )}
    </div>
  )
}
