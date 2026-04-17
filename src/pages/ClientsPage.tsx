/**
 * CLIENTS PAGE
 * Efeito Digital - Ads Flow
 *
 * Gestão de clientes da agência.
 * CRUD completo com logo, indústria, membros e contas vinculadas.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { ClientCardSkeleton } from '@/components/UI/Skeleton'
import { clientsService, membersService } from '@/services/clientsService'
import type { Client, ClientMember } from '@/services/clientsService'
import type { ClientRole } from '@/contexts/AuthContext'
import { uploadAndUpdateClientLogo } from '@/lib/supabaseStorage'
import {
  Plus,
  Search,
  Building2,
  Users,
  BarChart3,
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  Phone,
  X,
  ChevronRight,
  Shield,
  Crown,
  Eye,
  Upload,
  ImageIcon,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

type ClientWithMeta = Client & { member_count: number; my_role: ClientRole; ad_account_count?: number }

// =====================================================
// INDUSTRY OPTIONS
// =====================================================

const INDUSTRIES = [
  'Saúde & Clínicas',
  'E-commerce',
  'Educação',
  'Gastronomia',
  'Imobiliário',
  'Jurídico',
  'Tecnologia',
  'Varejo',
  'Beleza & Estética',
  'Automotivo',
  'Fitness & Esportes',
  'Turismo & Hotelaria',
  'Financeiro',
  'Agronegócio',
  'Outro',
]

const ROLE_LABELS: Record<ClientRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  analyst: 'Analista',
  viewer: 'Visualizador',
}

const ROLE_COLORS: Record<ClientRole, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]',
  analyst: 'bg-green-100 text-green-700',
  viewer: 'bg-slate-100 text-slate-700',
}

const ROLE_ICONS: Record<ClientRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  manager: Users,
  analyst: BarChart3,
  viewer: Eye,
}

// =====================================================
// CREATE/EDIT CLIENT MODAL
// =====================================================

function ClientFormModal({
  client,
  onSave,
  onClose,
}: {
  client?: ClientWithMeta | null
  onSave: (data: { name: string; industry?: string; website?: string; phone?: string }) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(client?.name || '')
  const [industry, setIndustry] = useState(client?.industry || '')
  const [website, setWebsite] = useState(client?.website || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [saving, setSaving] = useState(false)
  const [websiteError, setWebsiteError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(client?.logo_url || null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const validateWebsite = (url: string) => {
    if (!url) { setWebsiteError(''); return }
    try { new URL(url); setWebsiteError('') }
    catch { setWebsiteError('URL inválida (ex: https://exemplo.com)') }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 2MB.')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (websiteError) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        industry: industry || undefined,
        website: website || undefined,
        phone: phone || undefined,
      })

      // Upload logo AFTER the client record is saved (need the client.id)
      if (logoFile && client?.id) {
        setUploadingLogo(true)
        try {
          await uploadAndUpdateClientLogo(client.id, logoFile, client.logo_url)
        } catch (err) {
          console.error('Logo upload failed:', err)
        } finally {
          setUploadingLogo(false)
        }
      }

      onClose()
    } catch (err) {
      console.error('Erro ao salvar cliente:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-slate-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo do cliente
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              {/* Upload button */}
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-lg cursor-pointer hover:bg-[var(--color-brand-100)] transition-colors">
                  <Upload className="w-4 h-4" />
                  {logoFile ? 'Trocar logo' : 'Enviar logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  PNG, JPG, SVG ou WebP. Máximo 2MB.
                </p>
                {uploadingLogo && (
                  <p className="text-xs text-[var(--color-brand-600)] mt-1 animate-pulse">Enviando logo...</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clínica Saúde Total"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Segmento</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecionar segmento...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={() => validateWebsite(website)}
              placeholder="https://www.exemplo.com.br"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                websiteError ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {websiteError && <p className="text-xs text-red-500 mt-1">{websiteError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-lg hover:bg-[var(--color-brand-700)] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : client ? 'Salvar' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// CLIENT DETAIL PANEL
// =====================================================

function ClientDetailPanel({
  client,
  onClose,
  onEdit,
  onDelete,
}: {
  client: ClientWithMeta
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { user } = useAuth()
  const confirm = useConfirm()
  const [members, setMembers] = useState<ClientMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const canManage = client.my_role === 'owner' || client.my_role === 'admin'

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await membersService.list(client.id)
        setMembers(data)
      } catch (err) {
        console.error('Erro ao carregar membros:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    loadMembers()
  }, [client.id])

  const handleRemoveMember = async (memberId: string) => {
    const ok = await confirm({
      title: 'Remover membro',
      message: 'Remover este membro do cliente?',
      confirmLabel: 'Remover',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await membersService.remove(memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err) {
      console.error('Erro ao remover membro:', err)
    }
  }

  const handleChangeRole = async (memberId: string, newRole: ClientRole) => {
    try {
      await membersService.updateRole(memberId, newRole)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
    } catch (err) {
      console.error('Erro ao alterar role:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-100)] flex items-center justify-center">
              {client.logo_url ? (
                <img src={client.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-[var(--color-brand-600)]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{client.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {client.industry && <span>{client.industry}</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[client.my_role]}`}>
                  {ROLE_LABELS[client.my_role]}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4">
            {client.website && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="w-4 h-4 text-slate-400" />
                <a href={client.website} target="_blank" rel="noreferrer" className="hover:text-[var(--color-brand-600)] underline">
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {client.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              {client.member_count} membro{client.member_count !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              {client.ad_account_count ?? 0} conta{(client.ad_account_count ?? 0) !== 1 ? 's' : ''} de anúncio
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Membros da Equipe</h3>
            {loadingMembers ? (
              <div className="text-center py-4 text-sm text-slate-500">Carregando...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">Nenhum membro encontrado</div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role]
                  const isMe = member.user_id === user?.id
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.user?.name || 'Usuário'}
                            {isMe && <span className="text-slate-400 ml-1">(você)</span>}
                          </p>
                          <p className="text-xs text-slate-500">{member.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && !isMe && member.role !== 'owner' ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value as ClientRole)}
                            className="text-xs border border-slate-200 rounded-md px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Gerente</option>
                            <option value="analyst">Analista</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                            <RoleIcon className="w-3 h-3" />
                            {ROLE_LABELS[member.role]}
                          </span>
                        )}
                        {canManage && !isMe && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remover membro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex gap-3 p-6 border-t">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            {client.my_role === 'owner' && (
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// CLIENT CARD
// =====================================================

function ClientCard({
  client,
  onSelect,
  onEdit,
  onDelete,
}: {
  client: ClientWithMeta
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canManage = client.my_role === 'owner' || client.my_role === 'admin'

  return (
    <div className="bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onSelect}>
            <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center flex-shrink-0">
              {client.logo_url ? (
                <img src={client.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-[var(--color-brand-600)]" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
              {client.industry && (
                <p className="text-xs text-slate-500 truncate">{client.industry}</p>
              )}
            </div>
          </div>

          {canManage && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => { setMenuOpen(false); onEdit() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    {client.my_role === 'owner' && (
                      <button
                        onClick={() => { setMenuOpen(false); onDelete() }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {client.member_count}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {client.ad_account_count ?? 0} contas
          </span>
        </div>

        {/* Role badge + arrow */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[client.my_role]}`}>
            {ROLE_LABELS[client.my_role]}
          </span>
          <button
            onClick={onSelect}
            className="flex items-center gap-1 text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-medium"
          >
            Detalhes <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function ClientsPage() {
  const { user, isSuperAdmin, hasClientRole } = useAuth()
  const toast = useToast()
  const confirmDialog = useConfirm()
  const [clients, setClients] = useState<ClientWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientWithMeta | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientWithMeta | null>(null)

  const canCreate = isSuperAdmin || hasClientRole('admin')

  const loadClients = useCallback(async () => {
    if (!user) return
    try {
      const data = await clientsService.list(user.id)

      // Buscar ad_account counts em paralelo
      const withCounts = await Promise.all(
        data.map(async (c) => {
          const ad_account_count = await clientsService.getAdAccountCount(c.id)
          return { ...c, ad_account_count }
        })
      )

      setClients(withCounts)
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const handleCreate = async (data: { name: string; industry?: string; website?: string; phone?: string }) => {
    if (!user) return
    await clientsService.create(user.id, data)
    await loadClients()
    toast.success(`Cliente "${data.name}" criado com sucesso!`)
  }

  const handleUpdate = async (data: { name: string; industry?: string; website?: string; phone?: string }) => {
    if (!editingClient) return
    await clientsService.update(editingClient.id, data)
    await loadClients()
    setEditingClient(null)
    setSelectedClient(null)
    toast.success('Cliente atualizado!')
  }

  const handleDelete = async (client: ClientWithMeta) => {
    const ok = await confirmDialog({
      title: 'Excluir cliente',
      message: `Excluir o cliente "${client.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await clientsService.delete(client.id)
      await loadClients()
      setSelectedClient(null)
      toast.success(`Cliente "${client.name}" excluído.`)
    } catch (err) {
      console.error('Erro ao excluir cliente:', err)
      toast.error('Erro ao excluir cliente.')
    }
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie os clientes da sua agência e suas contas de anúncio.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-lg hover:bg-[var(--color-brand-700)] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou segmento..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ClientCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search
              ? 'Tente buscar com outros termos.'
              : 'Crie seu primeiro cliente para começar a gerenciar campanhas.'}
          </p>
          {!search && canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-lg hover:bg-[var(--color-brand-700)] text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={() => setSelectedClient(client)}
              onEdit={() => setEditingClient(client)}
              onDelete={() => handleDelete(client)}
            />
          ))}
        </div>
      )}

      {/* Summary bar */}
      {clients.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t">
          <span>
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} no total
          </span>
          <span>
            {clients.reduce((sum, c) => sum + c.member_count, 0)} membros |{' '}
            {clients.reduce((sum, c) => sum + (c.ad_account_count || 0), 0)} contas de anúncio
          </span>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ClientFormModal
          onSave={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingClient && (
        <ClientFormModal
          client={editingClient}
          onSave={handleUpdate}
          onClose={() => setEditingClient(null)}
        />
      )}

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => {
            setEditingClient(selectedClient)
            setSelectedClient(null)
          }}
          onDelete={() => handleDelete(selectedClient)}
        />
      )}
    </div>
  )
}
