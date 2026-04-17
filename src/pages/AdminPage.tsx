/**
 * ============================================
 * ADMIN PAGE - Super Admin Panel
 * ============================================
 * Painel administrativo do sistema.
 * Apenas super_admin pode acessar.
 * Lista usuários, clientes, stats globais.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import supabase from '@/lib/supabase'
import {
  Shield,
  Users,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Database,
  Megaphone,
  FileText,
  Link2,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalClients: number
  totalAdAccounts: number
  totalReports: number
  totalSyncs: number
  totalFlows: number
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface AdminClient {
  id: string
  name: string
  slug: string
  status: string
  industry: string | null
  created_at: string
}

// =====================================================
// STAT CARD
// =====================================================

function AdminStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function AdminPage() {
  const { isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [clients, setClients] = useState<AdminClient[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'users' | 'clients'>('overview')
  const [searchUsers, setSearchUsers] = useState('')
  const [searchClients, setSearchClients] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        { count: usersCount },
        { count: activeUsersCount },
        { count: clientsCount },
        { count: adAccountsCount },
        { count: reportsCount },
        { count: syncsCount },
        { count: flowsCount },
        { data: usersData },
        { data: clientsData },
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('ad_accounts').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('sync_logs').select('id', { count: 'exact', head: true }),
        supabase.from('flows').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id, email, name, role, is_active, last_login_at, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('clients').select('id, name, slug, status, industry, created_at').order('created_at', { ascending: false }).limit(100),
      ])

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: activeUsersCount || 0,
        totalClients: clientsCount || 0,
        totalAdAccounts: adAccountsCount || 0,
        totalReports: reportsCount || 0,
        totalSyncs: syncsCount || 0,
        totalFlows: flowsCount || 0,
      })
      setUsers((usersData || []) as AdminUser[])
      setClients((clientsData || []) as AdminClient[])
    } catch (err) {
      console.error('Erro ao carregar dados admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await supabase.from('users').update({ is_active: !currentActive }).eq('id', userId)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      )
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('users').update({ role: newRole }).eq('id', userId)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error('Erro ao alterar role:', err)
    }
  }

  // Access check
  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Acesso Restrito</h3>
        <p className="text-sm text-slate-500">
          Esta página é exclusiva para Super Administradores.
        </p>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchClients.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchClients.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Administração
          </h1>
          <p className="text-sm text-slate-500 mt-1">Painel global do sistema Ads Flow</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['overview', 'users', 'clients'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'overview' ? 'Visão Geral' : t === 'users' ? 'Usuários' : 'Clientes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-[var(--color-brand-600)] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando dados do sistema...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard icon={Users} label="Usuários Totais" value={stats.totalUsers} color="bg-[var(--color-brand-600)]" />
                <AdminStatCard icon={Activity} label="Usuários Ativos" value={stats.activeUsers} color="bg-green-600" />
                <AdminStatCard icon={Building2} label="Clientes" value={stats.totalClients} color="bg-purple-600" />
                <AdminStatCard icon={Link2} label="Contas de Anúncio" value={stats.totalAdAccounts} color="bg-amber-600" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <AdminStatCard icon={Database} label="Flows" value={stats.totalFlows} color="bg-indigo-600" />
                <AdminStatCard icon={FileText} label="Relatórios" value={stats.totalReports} color="bg-emerald-600" />
                <AdminStatCard icon={Megaphone} label="Syncs Realizados" value={stats.totalSyncs} color="bg-cyan-600" />
              </div>

              {/* Recent users */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Últimos Usuários Cadastrados</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-xs font-bold text-[var(--color-brand-700)]">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                        {u.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Último Login</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.name || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-md px-2 py-1"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {u.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleDateString('pt-BR')
                              : 'Nunca'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.is_active)}
                              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                                u.is_active
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {u.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-sm text-slate-500">Nenhum usuário encontrado</div>
                )}
              </div>
              <p className="text-xs text-slate-400">{users.length} usuários no total</p>
            </div>
          )}

          {/* CLIENTS TAB */}
          {tab === 'clients' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchClients}
                  onChange={(e) => setSearchClients(e.target.value)}
                  placeholder="Buscar por nome ou segmento..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Segmento</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500">{c.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{c.industry || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.status === 'active' ? 'Ativo' : c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(c.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-sm text-slate-500">Nenhum cliente encontrado</div>
                )}
              </div>
              <p className="text-xs text-slate-400">{clients.length} clientes no total</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
