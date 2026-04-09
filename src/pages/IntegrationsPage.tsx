/**
 * ============================================
 * INTEGRATIONS PAGE
 * ============================================
 * Data: 2026-02-17
 * Gerencia integrações com Meta Ads, Pages, Instagram.
 * OAuth flow: Connect → Facebook popup → picker de assets → save
 * Similar ao Reportei/Funnelytics.
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/UI/Toast'
import {
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Unplug,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  XCircle,
  Facebook,
  Instagram,
  FileText,
  Globe,
  Check,
  BarChart3,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  adAccountsService,
  syncService,
  syncLogsService,
  getDateRange,
} from '@/services/metaAdsService'
import type { SyncProgress } from '@/services/metaAdsService'
import type { AdAccount, SyncLog } from '@/types/database'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import {
  loadFacebookSDK,
  facebookLogin,
  isFacebookConfigured,
  fetchAllMetaAssets,
  exchangeForLongLivedToken,
  getAccountStatusInfo,
  type MetaAdAccount,
  type MetaPage,
  type MetaInstagramAccount,
  type MetaConnectedAssets,
} from '@/lib/facebook-sdk'
import {
  googleAuthService,
  googleAccountsService,
  type GoogleAccount,
  type GooglePlatform,
} from '@/services/googleAuthService'
import { BrandLogo } from '@/components/canonical/BrandLogo'

// =====================================================
// META OAUTH CONNECT MODAL
// =====================================================

type OAuthStep = 'idle' | 'connecting' | 'loading_assets' | 'pick_assets' | 'saving' | 'done' | 'error'

interface MetaOAuthModalProps {
  open: boolean
  onClose: () => void
  onSave: (assets: {
    adAccounts: MetaAdAccount[]
    pages: MetaPage[]
    instagramAccounts: MetaInstagramAccount[]
    accessToken: string
    fbUserId: string
    fbUserName: string
  }) => Promise<void>
}

function MetaOAuthModal({ open, onClose, onSave }: MetaOAuthModalProps) {
  const [step, setStep] = useState<OAuthStep>('idle')
  const [assets, setAssets] = useState<MetaConnectedAssets | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [error, setError] = useState('')

  // Seleções do usuário
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<Set<string>>(new Set())
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [selectedInstagram, setSelectedInstagram] = useState<Set<string>>(new Set())

  // Active tab in picker
  const [activeTab, setActiveTab] = useState<'ads' | 'pages' | 'instagram'>('ads')

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setStep('idle')
      setAssets(null)
      setError('')
      setSelectedAdAccounts(new Set())
      setSelectedPages(new Set())
      setSelectedInstagram(new Set())
      setActiveTab('ads')
      return
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // Inicia o fluxo OAuth
  const handleConnectFacebook = async () => {
    setError('')
    setStep('connecting')

    try {
      await loadFacebookSDK()
      const loginResponse = await facebookLogin()

      if (!loginResponse.authResponse) {
        throw new Error('Autorização cancelada.')
      }

      const shortToken = loginResponse.authResponse.accessToken
      setStep('loading_assets')

      // Trocar por long-lived token
      const { accessToken: longToken } =
        await exchangeForLongLivedToken(shortToken)
      setAccessToken(longToken)

      // Buscar todos os assets
      const allAssets = await fetchAllMetaAssets()
      setAssets(allAssets)

      // Selecionar tudo por padrão
      setSelectedAdAccounts(new Set(allAssets.adAccounts.map((a) => a.id)))
      setSelectedPages(new Set(allAssets.pages.map((p) => p.id)))
      setSelectedInstagram(new Set(allAssets.instagramAccounts.map((i) => i.id)))

      setStep('pick_assets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com Facebook.')
      setStep('error')
    }
  }

  // Toggle selection
  const toggleAdAccount = (id: string) => {
    setSelectedAdAccounts((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const togglePage = (id: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleInstagram = (id: string) => {
    setSelectedInstagram((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Salvar seleções
  const handleSave = async () => {
    if (!assets) return
    setStep('saving')
    try {
      await onSave({
        adAccounts: assets.adAccounts.filter((a) => selectedAdAccounts.has(a.id)),
        pages: assets.pages.filter((p) => selectedPages.has(p.id)),
        instagramAccounts: assets.instagramAccounts.filter((i) =>
          selectedInstagram.has(i.id)
        ),
        accessToken,
        fbUserId: assets.fbUser.id,
        fbUserName: assets.fbUser.name,
      })
      setStep('done')
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      setStep('error')
    }
  }

  const totalSelected =
    selectedAdAccounts.size + selectedPages.size + selectedInstagram.size

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Conectar Meta</h2>
              <p className="text-sm text-slate-500">
                {step === 'idle' && 'Autorize o acesso às suas contas de anúncio, páginas e Instagram.'}
                {step === 'connecting' && 'Aguardando autorização no Facebook...'}
                {step === 'loading_assets' && 'Buscando seus assets...'}
                {step === 'pick_assets' && `Selecione os assets para conectar (${totalSelected} selecionados)`}
                {step === 'saving' && 'Salvando configuração...'}
                {step === 'done' && 'Conectado com sucesso!'}
                {step === 'error' && 'Ocorreu um erro.'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* IDLE — Botão Connect */}
          {step === 'idle' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Facebook className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Conectar com Facebook
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
                Ao conectar, você autoriza o Ads Flow a acessar suas contas de anúncio,
                páginas e perfis do Instagram vinculados.
                Você escolhe quais deseja conectar.
              </p>

              {/* Permissões que serão solicitadas */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8 text-left">
                {[
                  { icon: BarChart3, label: 'Contas de Anúncio', desc: 'Campanhas, conjuntos, anúncios' },
                  { icon: Globe, label: 'Páginas do Facebook', desc: 'Insights e engajamento' },
                  { icon: Instagram, label: 'Instagram Business', desc: 'Métricas e perfis' },
                  { icon: FileText, label: 'Relatórios & Insights', desc: 'Dados de performance' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{label}</p>
                      <p className="text-[10px] text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConnectFacebook}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white text-sm font-semibold rounded-xl hover:bg-[#166FE5] transition-colors shadow-lg shadow-blue-600/20"
              >
                <Facebook className="w-5 h-5" />
                Continuar com Facebook
              </button>

              <p className="text-xs text-slate-400 mt-4">
                <Shield className="w-3 h-3 inline mr-1" />
                Seus dados ficam seguros. Você pode desconectar a qualquer momento.
              </p>
            </div>
          )}

          {/* CONNECTING / LOADING */}
          {(step === 'connecting' || step === 'loading_assets') && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">
                {step === 'connecting'
                  ? 'Aguardando autorização no Facebook...'
                  : 'Buscando contas de anúncio, páginas e Instagram...'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {step === 'connecting'
                  ? 'Complete o login na janela do Facebook.'
                  : 'Isso pode levar alguns segundos.'}
              </p>
            </div>
          )}

          {/* PICK ASSETS */}
          {step === 'pick_assets' && assets && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Conectado como {assets.fbUser.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {assets.fbUser.email || `ID: ${assets.fbUser.id}`}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {([
                  { key: 'ads', label: 'Contas de Anúncio', count: assets.adAccounts.length, icon: BarChart3 },
                  { key: 'pages', label: 'Páginas', count: assets.pages.length, icon: Globe },
                  { key: 'instagram', label: 'Instagram', count: assets.instagramAccounts.length, icon: Instagram },
                ] as const).map(({ key, label, count, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      activeTab === key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ad Accounts List */}
              {activeTab === 'ads' && (
                <div className="space-y-2">
                  {assets.adAccounts.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      Nenhuma conta de anúncio encontrada.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>{selectedAdAccounts.size} de {assets.adAccounts.length} selecionadas</span>
                        <button
                          onClick={() => {
                            if (selectedAdAccounts.size === assets.adAccounts.length) {
                              setSelectedAdAccounts(new Set())
                            } else {
                              setSelectedAdAccounts(new Set(assets.adAccounts.map(a => a.id)))
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedAdAccounts.size === assets.adAccounts.length ? 'Desmarcar todas' : 'Selecionar todas'}
                        </button>
                      </div>
                      {assets.adAccounts.map((account) => {
                        const status = getAccountStatusInfo(account.account_status)
                        const selected = selectedAdAccounts.has(account.id)
                        return (
                          <button
                            key={account.id}
                            onClick={() => toggleAdAccount(account.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              selected
                                ? 'border-blue-500 bg-blue-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-white font-bold text-xs">M</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {account.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {account.id} · {account.currency}
                                {account.business_name && ` · ${account.business_name}`}
                              </p>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                              {status.label}
                            </span>
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Pages List */}
              {activeTab === 'pages' && (
                <div className="space-y-2">
                  {assets.pages.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      Nenhuma página encontrada.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>{selectedPages.size} de {assets.pages.length} selecionadas</span>
                        <button
                          onClick={() => {
                            if (selectedPages.size === assets.pages.length) {
                              setSelectedPages(new Set())
                            } else {
                              setSelectedPages(new Set(assets.pages.map(p => p.id)))
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedPages.size === assets.pages.length ? 'Desmarcar todas' : 'Selecionar todas'}
                        </button>
                      </div>
                      {assets.pages.map((page) => {
                        const selected = selectedPages.has(page.id)
                        return (
                          <button
                            key={page.id}
                            onClick={() => togglePage(page.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              selected
                                ? 'border-blue-500 bg-blue-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {page.picture?.data?.url ? (
                              <img
                                src={page.picture.data.url}
                                alt={page.name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <Globe className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {page.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {page.category}
                                {page.fan_count != null && ` · ${page.fan_count.toLocaleString('pt-BR')} curtidas`}
                              </p>
                            </div>
                            {page.instagram_business_account && (
                              <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                                IG vinculado
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Instagram List */}
              {activeTab === 'instagram' && (
                <div className="space-y-2">
                  {assets.instagramAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <Instagram className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Nenhum Instagram Business encontrado.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Vincule um perfil business a uma das suas páginas.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>{selectedInstagram.size} de {assets.instagramAccounts.length} selecionados</span>
                        <button
                          onClick={() => {
                            if (selectedInstagram.size === assets.instagramAccounts.length) {
                              setSelectedInstagram(new Set())
                            } else {
                              setSelectedInstagram(new Set(assets.instagramAccounts.map(i => i.id)))
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedInstagram.size === assets.instagramAccounts.length ? 'Desmarcar todos' : 'Selecionar todos'}
                        </button>
                      </div>
                      {assets.instagramAccounts.map((ig) => {
                        const selected = selectedInstagram.has(ig.id)
                        return (
                          <button
                            key={ig.id}
                            onClick={() => toggleInstagram(ig.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              selected
                                ? 'border-pink-500 bg-pink-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected ? 'bg-pink-600 border-pink-600' : 'border-slate-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {ig.profile_picture_url ? (
                              <img
                                src={ig.profile_picture_url}
                                alt={ig.username}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shrink-0">
                                <Instagram className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                @{ig.username}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ig.name}
                                {ig.followers_count != null &&
                                  ` · ${ig.followers_count.toLocaleString('pt-BR')} seguidores`}
                                {ig.media_count != null &&
                                  ` · ${ig.media_count.toLocaleString('pt-BR')} posts`}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SAVING */}
          {step === 'saving' && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Salvando assets selecionados...</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900">
                Conectado com sucesso!
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {totalSelected} asset{totalSelected > 1 ? 's' : ''} conectado{totalSelected > 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Erro na conexão</p>
              <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => setStep('idle')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            {step === 'done' ? 'Fechar' : 'Cancelar'}
          </button>

          {step === 'pick_assets' && (
            <button
              onClick={handleSave}
              disabled={totalSelected === 0}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Conectar {totalSelected} Asset{totalSelected > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MANUAL CONNECT MODAL (fallback sem FB App ID)
// =====================================================

interface ManualConnectModalProps {
  open: boolean
  onClose: () => void
  onConnect: (data: {
    platform: 'meta_ads' | 'google_ads'
    account_id: string
    account_name: string
    access_token?: string
    currency?: string
    timezone?: string
  }) => Promise<void>
}

function ManualConnectModal({ open, onClose, onConnect }: ManualConnectModalProps) {
  const [platform, setPlatform] = useState<'meta_ads' | 'google_ads'>('meta_ads')
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!accountId.trim() || !accountName.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (platform === 'meta_ads' && !accountId.startsWith('act_')) {
      setError('ID da conta Meta Ads deve começar com "act_"')
      return
    }

    setLoading(true)
    try {
      await onConnect({
        platform,
        account_id: accountId.trim(),
        account_name: accountName.trim(),
        access_token: accessToken.trim() || undefined,
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
      })
      setAccountId('')
      setAccountName('')
      setAccessToken('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Conectar Conta (Manual)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Adicione uma conta informando o ID manualmente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plataforma</label>
            <div className="grid grid-cols-2 gap-3">
              {(['meta_ads', 'google_ads'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    platform === p
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      p === 'meta_ads' ? 'bg-blue-600' : 'bg-red-500'
                    }`}>
                      <span className="text-white font-bold text-sm">
                        {p === 'meta_ads' ? 'M' : 'G'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {p === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p === 'meta_ads' ? 'Facebook & Instagram' : 'Search & Display'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID da Conta {platform === 'meta_ads' ? '(ex: act_123456789)' : ''}
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={platform === 'meta_ads' ? 'act_433655990500782' : '123-456-7890'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Conta</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Efeito Digital - Meta Ads"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Access Token <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Token será gerenciado pelo N8N"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Conectar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// SYNC HISTORY PANEL
// =====================================================

function SyncHistoryPanel({ accountId }: { accountId: string }) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    syncLogsService
      .list(accountId, 10)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [accountId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando histórico...
      </div>
    )
  }

  if (logs.length === 0) {
    return <p className="text-sm text-slate-400 py-4">Nenhuma sincronização realizada ainda.</p>
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            {log.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
            {log.status === 'started' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            <span className="text-slate-700 capitalize">{log.sync_type}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {log.status === 'completed' && (
              <span>
                {log.campaigns_synced}c / {log.adsets_synced}as / {log.ads_synced}a
              </span>
            )}
            {log.status === 'failed' && (
              <span className="text-red-500 truncate max-w-48" title={log.error_message || ''}>
                {log.error_message}
              </span>
            )}
            {log.duration_ms && <span>{(log.duration_ms / 1000).toFixed(1)}s</span>}
            <span>{new Date(log.started_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
// ACCOUNT CARD
// =====================================================

interface AccountCardProps {
  account: AdAccount
  onSync: (id: string) => void
  onDisconnect: (id: string) => void
  onDelete: (id: string) => void
  syncing: boolean
  syncProgress?: SyncProgress
}

function AccountCard({
  account,
  onSync,
  onDisconnect,
  onDelete,
  syncing,
  syncProgress,
}: AccountCardProps) {
  const [showHistory, setShowHistory] = useState(false)

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Ativa' },
    paused: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pausada' },
    disconnected: { color: 'bg-slate-100 text-slate-500', icon: Unplug, label: 'Desconectada' },
    error: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Erro' },
  }

  const status = statusConfig[account.status]
  const StatusIcon = status.icon

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                account.platform === 'meta_ads' ? 'bg-blue-600' : 'bg-red-500'
              }`}
            >
              <span className="text-white font-bold">
                {account.platform === 'meta_ads' ? 'M' : 'G'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{account.account_name}</h3>
              <p className="text-xs text-slate-500 font-mono">{account.account_id}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {account.sync_error && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 text-red-700 text-xs p-2.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{account.sync_error}</span>
          </div>
        )}

        {syncing && syncProgress && (
          <div className="mt-3 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sincronizando...
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-blue-600">
              <div>Campanhas: {syncProgress.campaignsSynced}</div>
              <div>Ad Sets: {syncProgress.adsetsSynced}</div>
              <div>Ads: {syncProgress.adsSynced}</div>
              <div>Insights: {syncProgress.insightsSynced}</div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span>{account.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}</span>
          <span>{account.currency}</span>
          {account.last_sync_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Sync:{' '}
              {new Date(account.last_sync_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => onSync(account.id)}
            disabled={syncing || account.status === 'disconnected'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Sincronizar
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Histórico
            {showHistory ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <div className="flex-1" />
          {account.status !== 'disconnected' && (
            <button
              onClick={() => onDisconnect(account.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-orange-600 text-xs rounded-lg hover:bg-orange-50 transition-colors"
              title="Desconectar"
            >
              <Unplug className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(account.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 text-xs rounded-lg hover:bg-red-50 transition-colors"
            title="Remover permanentemente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <SyncHistoryPanel accountId={account.id} />
        </div>
      )}
    </div>
  )
}

// =====================================================
// INTEGRATIONS PAGE
// =====================================================

export default function IntegrationsPage() {
  const { user, activeClient } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set())
  const [syncProgressMap, setSyncProgressMap] = useState<Record<string, SyncProgress>>({})

  const hasFbApp = isFacebookConfigured()

  // Google accounts state
  const [googleConnectedAccounts, setGoogleConnectedAccounts] = useState<GoogleAccount[]>([])
  const googleAdsConnected = googleConnectedAccounts.filter((a) => a.platform === 'google_ads').length
  const ga4Connected = googleConnectedAccounts.filter((a) => a.platform === 'ga4').length
  const scConnected = googleConnectedAccounts.filter((a) => a.platform === 'search_console').length
  const ytConnected = googleConnectedAccounts.filter((a) => a.platform === 'youtube').length
  const gmbConnected = googleConnectedAccounts.filter((a) => a.platform === 'gmb').length

  // Google OAuth connect handler
  const handleGoogleConnect = (platforms: GooglePlatform[]) => {
    const authUrl = googleAuthService.getAuthUrl(platforms, activeClient?.client_id || undefined)
    window.location.href = authUrl
  }

  // Fetch Google accounts
  const fetchGoogleAccounts = useCallback(async () => {
    if (!user) return
    try {
      const data = activeClient?.client_id
        ? await googleAccountsService.getConnectedAccounts(activeClient.client_id)
        : await googleAccountsService.listByUser(user.id)
      setGoogleConnectedAccounts(data)
    } catch (err) {
      console.error('Error fetching Google accounts:', err)
    }
  }, [user, activeClient?.client_id])

  useEffect(() => {
    fetchGoogleAccounts()
  }, [fetchGoogleAccounts])

  // Handle Google OAuth callback (check URL for code param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const stateParam = params.get('state')

    if (!code || !stateParam || !user) return

    // Clear the URL params
    window.history.replaceState({}, '', window.location.pathname)

    const handleCallback = async () => {
      try {
        const state = JSON.parse(atob(stateParam))
        const tokens = await googleAuthService.exchangeCodeForTokens(code)

        // For each platform in state, we need to discover accounts
        // For now, create a placeholder account that will be populated on first sync
        const platformNames: Record<string, string> = {
          google_ads: 'Google Ads',
          ga4: 'Google Analytics 4',
          search_console: 'Search Console',
          youtube: 'YouTube',
          gmb: 'Google Meu Negócio',
        }

        for (const platform of (state.platforms as GooglePlatform[])) {
          const accountName = platformNames[platform] || platform

          await googleAccountsService.connectAccount(
            user.id,
            state.clientId || activeClient?.client_id || null,
            platform,
            `pending_${platform}_${Date.now()}`,
            `${accountName} (${user.email || 'conta conectada'})`,
            tokens,
          )
        }

        toast.success('Google conectado com sucesso! Configure a conta na seção abaixo.')
        await fetchGoogleAccounts()
      } catch (err) {
        console.error('Google OAuth callback error:', err)
        toast.error('Erro ao conectar com Google. Tente novamente.')
      }
    }

    handleCallback()
  }, [user])

  // Fetch accounts (filtered by active client when available)
  const fetchAccounts = useCallback(async () => {
    if (!user) return
    try {
      const data = activeClient?.client_id
        ? await adAccountsService.listByClient(activeClient.client_id)
        : await adAccountsService.list(user.id)
      setAccounts(data)
    } catch (err) {
      console.error('Error fetching accounts:', err)
      toast.error('Erro ao carregar contas de anúncio.')
    } finally {
      setLoading(false)
    }
  }, [user, activeClient?.client_id])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Save from OAuth flow
  const handleOAuthSave = async (data: {
    adAccounts: MetaAdAccount[]
    pages: MetaPage[]
    instagramAccounts: MetaInstagramAccount[]
    accessToken: string
    fbUserId: string
    fbUserName: string
  }) => {
    if (!user) return

    // Salvar ad accounts no Supabase
    for (const account of data.adAccounts) {
      await adAccountsService.connect({
        user_id: user.id,
        client_id: activeClient?.client_id || undefined,
        platform: 'meta_ads',
        account_id: account.id,
        account_name: account.name,
        access_token: data.accessToken,
        currency: account.currency || 'BRL',
        timezone: account.timezone_name || null,
        status: account.account_status === 1 ? 'active' : 'paused',
        metadata: {
          business_name: account.business_name,
          fb_user_id: data.fbUserId,
          fb_user_name: data.fbUserName,
          connected_pages: data.pages.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
          })),
          connected_instagram: data.instagramAccounts.map((i) => ({
            id: i.id,
            username: i.username,
            name: i.name,
          })),
          oauth_connected_at: new Date().toISOString(),
        },
      })
    }

    await fetchAccounts()
  }

  // Manual connect
  const handleManualConnect = async (data: {
    platform: 'meta_ads' | 'google_ads'
    account_id: string
    account_name: string
    access_token?: string
    currency?: string
    timezone?: string
  }) => {
    if (!user) return
    await adAccountsService.connect({
      user_id: user.id,
      client_id: activeClient?.client_id || undefined,
      platform: data.platform,
      account_id: data.account_id,
      account_name: data.account_name,
      access_token: data.access_token || null,
      currency: data.currency || 'BRL',
      timezone: data.timezone || null,
      status: 'active',
    })
    await fetchAccounts()
  }

  // Sync account
  const handleSync = async (accountId: string) => {
    setSyncingAccounts((prev) => new Set(prev).add(accountId))
    try {
      const range = getDateRange(30)
      await syncService.fullSync(accountId, range, (progress) => {
        setSyncProgressMap((prev) => ({ ...prev, [accountId]: progress }))
      })
    } catch (err) {
      console.error('Sync error:', err)
      toast.error('Erro ao sincronizar conta. Verifique a conexão e tente novamente.')
    } finally {
      setSyncingAccounts((prev) => {
        const next = new Set(prev)
        next.delete(accountId)
        return next
      })
      setSyncProgressMap((prev) => {
        const next = { ...prev }
        delete next[accountId]
        return next
      })
      await fetchAccounts()
    }
  }

  // Disconnect
  const handleDisconnect = async (accountId: string) => {
    const ok = await confirm({
      title: 'Desconectar conta',
      message: 'Deseja desconectar esta conta? Os dados sincronizados serão mantidos.',
      confirmLabel: 'Desconectar',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await adAccountsService.disconnect(accountId)
      await fetchAccounts()
    } catch (err) {
      console.error('Disconnect error:', err)
      toast.error('Erro ao desconectar conta.')
    }
  }

  // Delete
  const handleDelete = async (accountId: string) => {
    const ok = await confirm({
      title: 'Excluir conta',
      message: 'Tem certeza? Todos os dados dessa conta serão removidos permanentemente.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await adAccountsService.delete(accountId)
      await fetchAccounts()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Erro ao excluir conta.')
    }
  }

  const metaAccounts = accounts.filter((a) => a.platform === 'meta_ads')
  const googleAccounts = accounts.filter((a) => a.platform === 'google_ads')
  const tiktokAccounts = accounts.filter((a) => (a.platform as string) === 'tiktok_ads')

  // Plataformas disponíveis — brand é usado pelo <BrandLogo> canônico (logos oficiais)
  const platforms: Array<{
    key: string
    brand: import('@/types/metrics').KPISource
    name: string
    desc: string
    bgLight: string
    connected: number
    available: boolean
    onConnect: () => void
    features: string[]
    note?: string
  }> = [
    {
      key: 'meta_ads',
      brand: 'meta_ads',
      name: 'Meta Ads',
      desc: 'Facebook & Instagram Ads',
      bgLight: 'bg-blue-50',
      connected: metaAccounts.length,
      available: true,
      onConnect: hasFbApp ? () => setShowOAuthModal(true) : () => setShowManualModal(true),
      features: ['Campanhas', 'Conjuntos', 'Anúncios', 'Insights'],
    },
    {
      key: 'instagram',
      brand: 'instagram',
      name: 'Instagram',
      desc: 'Perfis Business & Insights',
      bgLight: 'bg-pink-50',
      connected: metaAccounts.filter((a) => (a.metadata as any)?.connected_instagram?.length > 0).length,
      available: true,
      onConnect: hasFbApp ? () => setShowOAuthModal(true) : () => setShowManualModal(true),
      features: ['Perfis', 'Seguidores', 'Posts', 'Stories'],
      note: 'Conectado via Meta OAuth',
    },
    {
      key: 'google_ads',
      brand: 'google_ads',
      name: 'Google Ads',
      desc: 'Search, Display & YouTube',
      bgLight: 'bg-blue-50',
      connected: googleAccounts.length + googleAdsConnected,
      available: true,
      onConnect: () => handleGoogleConnect(['google_ads']),
      features: ['Campanhas', 'Keywords', 'Display', 'YouTube'],
    },
    {
      key: 'google_analytics',
      brand: 'ga4',
      name: 'Google Analytics 4',
      desc: 'GA4 — Tráfego & Conversões',
      bgLight: 'bg-orange-50',
      connected: ga4Connected,
      available: true,
      onConnect: () => handleGoogleConnect(['ga4']),
      features: ['Sessões', 'Conversões', 'Origens', 'Eventos'],
    },
    {
      key: 'search_console',
      brand: 'gsc',
      name: 'Search Console',
      desc: 'SEO — Queries & Rankings',
      bgLight: 'bg-indigo-50',
      connected: scConnected,
      available: true,
      onConnect: () => handleGoogleConnect(['search_console']),
      features: ['Queries', 'Páginas', 'CTR', 'Posição'],
    },
    {
      key: 'youtube',
      brand: 'youtube',
      name: 'YouTube',
      desc: 'Canal, Vídeos & Analytics',
      bgLight: 'bg-red-50',
      connected: ytConnected,
      available: true,
      onConnect: () => handleGoogleConnect(['youtube']),
      features: ['Canal', 'Vídeos', 'Watch Time', 'Inscritos'],
    },
    {
      key: 'gmb',
      brand: 'gmb',
      name: 'Google Meu Negócio',
      desc: 'Reviews, Buscas & Ações',
      bgLight: 'bg-blue-50',
      connected: gmbConnected,
      available: true,
      onConnect: () => handleGoogleConnect(['gmb']),
      features: ['Reviews', 'Rating', 'Buscas', 'Chamadas'],
    },
    {
      key: 'kommo',
      brand: 'kommo',
      name: 'Kommo CRM',
      desc: 'Leads, Pipeline & Vendas',
      bgLight: 'bg-sky-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Leads', 'Pipeline', 'Conversão', 'Vendedores'],
    },
    {
      key: 'linkedin',
      brand: 'linkedin_ads',
      name: 'LinkedIn',
      desc: 'Página, Posts & Seguidores',
      bgLight: 'bg-blue-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Página', 'Seguidores', 'Posts', 'Engajamento'],
    },
    {
      key: 'clickup',
      brand: 'clickup',
      name: 'ClickUp',
      desc: 'Projetos, Tarefas & Tempo',
      bgLight: 'bg-violet-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Tarefas', 'Sprints', 'Goals', 'Time Tracking'],
    },
    {
      key: 'shopify',
      brand: 'shopify',
      name: 'Shopify',
      desc: 'Loja, Pedidos & Produtos',
      bgLight: 'bg-green-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Pedidos', 'Receita', 'Produtos', 'Clientes'],
    },
    {
      key: 'woocommerce',
      brand: 'woocommerce',
      name: 'WooCommerce',
      desc: 'E-commerce WordPress',
      bgLight: 'bg-purple-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Pedidos', 'Receita', 'Produtos', 'Cupons'],
    },
    {
      key: 'mailchimp',
      brand: 'mailchimp',
      name: 'Mailchimp',
      desc: 'Email Marketing & Automação',
      bgLight: 'bg-yellow-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Listas', 'Campanhas', 'Aberturas', 'Cliques'],
    },
    {
      key: 'brevo',
      brand: 'brevo',
      name: 'Brevo',
      desc: 'Email, SMS & CRM',
      bgLight: 'bg-emerald-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Campanhas', 'Contatos', 'Automações', 'SMS'],
    },
    {
      key: 'hotmart',
      brand: 'hotmart',
      name: 'Hotmart',
      desc: 'Infoprodutos & Vendas',
      bgLight: 'bg-orange-50',
      connected: 0,
      available: true,
      onConnect: () => setShowManualModal(true),
      features: ['Vendas', 'Afiliados', 'Comissões', 'Produtos'],
    },
    {
      key: 'tiktok_ads',
      brand: 'tiktok_ads',
      name: 'TikTok Ads',
      desc: 'TikTok Business Center',
      bgLight: 'bg-gray-50',
      connected: tiktokAccounts.length,
      available: false,
      onConnect: () => {},
      features: ['Campanhas', 'Criativos', 'Audiências', 'Pixel'],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrações</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">
            Conecte seus canais de marketing, CRM e projetos para centralizar dados e relatórios.
          </p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4" />
          Conexão Manual
        </button>
      </div>

      {/* ========== PLATAFORMAS GRID ========== */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Canais Disponíveis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {platforms.map((p) => {
            const isConnected = p.connected > 0
            return (
              <div
                key={p.key}
                className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 ${
                  isConnected
                    ? 'border-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
                    : 'border-slate-200 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.06)]'
                } hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5`}
              >
                {/* Connected indicator bar */}
                {isConnected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                )}

                <div className="p-6">
                  {/* Header: Official brand logo + Name + Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                        <BrandLogo brand={p.brand} size={32} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight">{p.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {p.connected}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {p.features.map((f) => (
                      <span
                        key={f}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${p.bgLight} text-slate-600 border border-transparent`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Note */}
                  {p.note && (
                    <p className="text-[10px] text-slate-400 mb-3 italic">{p.note}</p>
                  )}

                  {/* Connect button */}
                  {p.available ? (
                    <button
                      onClick={p.onConnect}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isConnected
                          ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar Conta
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Conectar
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-50/80 text-slate-400 border border-dashed border-slate-200">
                      <Clock className="w-4 h-4" />
                      Em breve
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========== CONTAS CONECTADAS ========== */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando contas...
        </div>
      )}

      {!loading && accounts.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Contas Conectadas ({accounts.length})
          </h2>

          {metaAccounts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo brand="meta_ads" size={24} />
                <h3 className="text-base font-semibold text-slate-900">Meta Ads</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {metaAccounts.length}
                </span>
              </div>
              <div className="grid gap-4">
                {metaAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                    onDelete={handleDelete}
                    syncing={syncingAccounts.has(account.id)}
                    syncProgress={syncProgressMap[account.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {googleAccounts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo brand="google_ads" size={24} />
                <h3 className="text-base font-semibold text-slate-900">Google Ads</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {googleAccounts.length}
                </span>
              </div>
              <div className="grid gap-4">
                {googleAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                    onDelete={handleDelete}
                    syncing={syncingAccounts.has(account.id)}
                    syncProgress={syncProgressMap[account.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* N8N Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-slate-700 text-sm">Pipeline de Sincronização</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dados sincronizados via N8N → Meta Graph API → Supabase.
                Workflow: <code className="bg-slate-200 px-1 rounded text-xs">/adsflow/meta-sync</code>
              </p>
              <a
                href="https://ia-kommo-n8n.xl78rn.easypanel.host"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                Abrir N8N <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MetaOAuthModal
        open={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
        onSave={handleOAuthSave}
      />
      <ManualConnectModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConnect={handleManualConnect}
      />
    </div>
  )
}
