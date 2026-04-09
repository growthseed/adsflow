/**
 * SETTINGS PAGE
 * Efeito Digital - Ads Flow
 *
 * Perfil do usuário, alteração de senha, preferências.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import { profileService } from '@/services/clientsService'
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Globe,
} from 'lucide-react'

// =====================================================
// SECTION WRAPPER
// =====================================================

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// =====================================================
// PROFILE SECTION
// =====================================================

function ProfileSection({ userId }: { userId: string }) {
  const { user, refreshSession } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const profile = await profileService.get(userId)
      if (profile) {
        setName(profile.name)
        setPhone(profile.phone || '')
      }
    }
    load()
  }, [userId])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome não pode ficar vazio')
      return
    }
    setSaving(true)
    try {
      await profileService.update(userId, {
        name: name.trim(),
        phone: phone.trim() || null,
      })
      // Refresh session to update user name in context
      try {
        await refreshSession()
      } catch {
        // Session refresh may fail but profile was saved
      }
      toast.success('Perfil atualizado!')
    } catch (err: unknown) {
      console.error('Erro ao salvar perfil:', err)
      toast.error((err instanceof Error ? err.message : null) || 'Erro ao salvar perfil. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection icon={User} title="Perfil" description="Informações básicas da sua conta">
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{name || 'Usuário'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Para alterar o email, entre em contato com o suporte.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </SettingsSection>
  )
}

// =====================================================
// PASSWORD SECTION
// =====================================================

function PasswordSection() {
  const toast = useToast()
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState({ newPass: false, confirm: false })

  const passError = touched.newPass && newPass.length > 0 && newPass.length < 8
    ? 'Mínimo 8 caracteres'
    : ''
  const confirmError = touched.confirm && confirmPass.length > 0 && newPass !== confirmPass
    ? 'As senhas não coincidem'
    : ''
  const strength = newPass.length === 0
    ? null
    : newPass.length < 8 ? 'fraca' : newPass.length < 12 ? 'média' : 'forte'

  const handleChange = async () => {
    setTouched({ newPass: true, confirm: true })
    if (newPass.length < 8 || newPass !== confirmPass) return

    setSaving(true)
    try {
      await profileService.changePassword(newPass)
      toast.success('Senha alterada com sucesso!')
      setNewPass('')
      setConfirmPass('')
      setTouched({ newPass: false, confirm: false })
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleChange()
  }

  return (
    <SettingsSection icon={Lock} title="Senha" description="Altere sua senha de acesso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              name="new-password"
              autoComplete="new-password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, newPass: true }))}
              placeholder="Mínimo 8 caracteres"
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passError ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passError && <p className="text-xs text-red-500 mt-1">{passError}</p>}
          {strength && !passError && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex gap-1 flex-1 max-w-32">
                <div className={`h-1 flex-1 rounded-full ${strength === 'fraca' ? 'bg-red-400' : strength === 'média' ? 'bg-amber-400' : 'bg-green-500'}`} />
                <div className={`h-1 flex-1 rounded-full ${strength === 'média' ? 'bg-amber-400' : strength === 'forte' ? 'bg-green-500' : 'bg-slate-200'}`} />
                <div className={`h-1 flex-1 rounded-full ${strength === 'forte' ? 'bg-green-500' : 'bg-slate-200'}`} />
              </div>
              <span className={`text-xs font-medium ${strength === 'fraca' ? 'text-red-500' : strength === 'média' ? 'text-amber-600' : 'text-green-600'}`}>
                {strength === 'fraca' ? 'Fraca' : strength === 'média' ? 'Média' : 'Forte'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Repita a nova senha"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                confirmError ? 'border-red-400' : 'border-slate-300'
              }`}
            />
          </div>
          {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
        </div>

        <button
          type="submit"
          disabled={saving || !newPass || !confirmPass}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <Lock className="w-4 h-4" />
          {saving ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </SettingsSection>
  )
}

// =====================================================
// PREFERENCES SECTION
// =====================================================

function PreferencesSection() {
  const [notifications, setNotifications] = useState(true)
  const [syncAlerts, setSyncAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [language, setLanguage] = useState('pt-BR')

  return (
    <SettingsSection icon={Bell} title="Preferências" description="Notificações e configurações de idioma">
      <div className="space-y-4">
        <ToggleRow
          label="Notificações por email"
          description="Receber alertas importantes por email"
          checked={notifications}
          onChange={setNotifications}
        />
        <ToggleRow
          label="Alertas de sincronização"
          description="Notificar quando syncs falharem"
          checked={syncAlerts}
          onChange={setSyncAlerts}
        />
        <ToggleRow
          label="Relatório semanal"
          description="Resumo semanal de performance por email"
          checked={weeklyReport}
          onChange={setWeeklyReport}
        />

        <div className="pt-2 border-t">
          <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
          <div className="relative max-w-xs">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Espanol</option>
            </select>
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

// =====================================================
// ACCOUNT INFO
// =====================================================

function AccountInfoSection() {
  const { user, profile, activeClient, isSuperAdmin } = useAuth()

  return (
    <SettingsSection icon={Shield} title="Informações da Conta" description="Status da sua conta e permissões">
      <div className="space-y-3">
        <InfoRow label="ID do Usuário" value={user?.id?.slice(0, 8) + '...'} />
        <InfoRow
          label="Papel Global"
          value={
            isSuperAdmin
              ? 'Super Administrador'
              : profile?.role === 'admin'
                ? 'Administrador'
                : 'Usuário'
          }
        />
        {activeClient && (
          <>
            <InfoRow label="Cliente Ativo" value={activeClient.client.name} />
            <InfoRow label="Papel no Cliente" value={activeClient.role} />
          </>
        )}
        <InfoRow
          label="Último Login"
          value={
            profile?.last_login_at
              ? new Date(profile.last_login_at).toLocaleString('pt-BR')
              : 'N/A'
          }
        />
        <InfoRow
          label="Conta Criada"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('pt-BR')
              : 'N/A'
          }
        />
      </div>
    </SettingsSection>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie seu perfil, senha e preferências da conta.
        </p>
      </div>

      <ProfileSection userId={user.id} />
      <PasswordSection />
      <PreferencesSection />
      <AccountInfoSection />
    </div>
  )
}
