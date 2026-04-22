/**
 * ============================================
 * <KommoConnectModal> — Kommo CRM OAuth + token flow
 * ============================================
 * Kommo's OAuth flow is subdomain-scoped — the token endpoint lives on the
 * user's account domain (https://{subdomain}.kommo.com). So we *always* need
 * the subdomain first, whether OAuth or manual token.
 *
 * Paths:
 *   • OAuth: button goes to app.kommo.com/oauth. After approval Kommo redirects
 *     back with ?code=X&referer=SUB.kommo.com. Parent detects that, exchanges
 *     via /api/kommo/oauth-callback, then opens this modal with prefill.
 *   • Long-lived token: user pastes subdomain + access token from their Kommo
 *     integration settings; we validate via /api/v4/account.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Key,
  Link2,
  Loader2,
  Shield,
  X,
} from 'lucide-react'
import {
  isKommoOAuthConfigured,
  kommoAuthService,
  normalizeSubdomain,
  type KommoAccount,
  type KommoPipeline,
} from '@/services/kommoAuthService'
import { BrandLogo } from '@/components/canonical/BrandLogo'

type Mode =
  | 'choose'
  | 'oauth_subdomain'
  | 'token'
  | 'pick_pipelines'
  | 'saving'
  | 'done'
  | 'error'

export interface KommoPrefill {
  subdomain: string
  accessToken: string
  account: KommoAccount | null
  pipelines: KommoPipeline[]
  /** For OAuth flow — stored so we can refresh later */
  refreshToken?: string
  expiresIn?: number
}

interface Props {
  open: boolean
  onClose: () => void
  prefill?: KommoPrefill | null
  onSave: (data: {
    apiToken: string
    subdomain: string
    pipelineIds: string[]
    via: 'oauth' | 'token'
    refreshToken?: string
  }) => Promise<void>
}

export default function KommoConnectModal({
  open,
  onClose,
  prefill,
  onSave,
}: Props) {
  const [mode, setMode] = useState<Mode>('choose')

  // Inputs
  const [subdomain, setSubdomain] = useState('')
  const [apiToken, setApiToken] = useState('')

  // Verified state
  const [verifiedSubdomain, setVerifiedSubdomain] = useState('')
  const [verifiedToken, setVerifiedToken] = useState('')
  const [verifiedRefresh, setVerifiedRefresh] = useState<string | undefined>()
  const [account, setAccount] = useState<KommoAccount | null>(null)
  const [pipelines, setPipelines] = useState<KommoPipeline[]>([])
  const [selectedPipelineIds, setSelectedPipelineIds] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) return
    setMode('choose')
    setSubdomain('')
    setApiToken('')
    setVerifiedSubdomain('')
    setVerifiedToken('')
    setVerifiedRefresh(undefined)
    setAccount(null)
    setPipelines([])
    setSelectedPipelineIds(new Set())
    setError('')
  }, [open])

  // Apply OAuth callback prefill
  useEffect(() => {
    if (!open || !prefill) return
    setVerifiedSubdomain(prefill.subdomain)
    setVerifiedToken(prefill.accessToken)
    setVerifiedRefresh(prefill.refreshToken)
    setAccount(prefill.account)
    setPipelines(prefill.pipelines)
    setSelectedPipelineIds(
      new Set(prefill.pipelines.map((p) => String(p.id))),
    )
    setMode('pick_pipelines')
  }, [open, prefill])

  const hasRefresh = useMemo(() => Boolean(verifiedRefresh), [verifiedRefresh])

  if (!open) return null

  // =======================
  // Handlers
  // =======================
  const startOAuth = () => {
    try {
      const url = kommoAuthService.getAuthUrl()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar OAuth.')
      setMode('error')
    }
  }

  const handleVerifyToken = async () => {
    const cleanSub = normalizeSubdomain(subdomain)
    if (!cleanSub) {
      setError('Informe o subdomínio da sua conta Kommo.')
      return
    }
    if (!apiToken.trim()) {
      setError('Cole o token de API.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { account: acc, pipelines: ps } = await kommoAuthService.verifyToken({
        subdomain: cleanSub,
        token: apiToken,
      })
      setVerifiedSubdomain(cleanSub)
      setVerifiedToken(apiToken.trim())
      setVerifiedRefresh(undefined)
      setAccount(acc)
      setPipelines(ps)
      setSelectedPipelineIds(new Set(ps.map((p) => String(p.id))))
      setMode('pick_pipelines')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao validar.')
    } finally {
      setLoading(false)
    }
  }

  const togglePipeline = (id: string) => {
    setSelectedPipelineIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!verifiedToken || !verifiedSubdomain) return
    setMode('saving')
    setError('')
    try {
      await onSave({
        apiToken: verifiedToken,
        subdomain: verifiedSubdomain,
        pipelineIds: Array.from(selectedPipelineIds),
        via: hasRefresh ? 'oauth' : 'token',
        refreshToken: verifiedRefresh,
      })
      setMode('done')
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
      setMode('error')
    }
  }

  // =======================
  // Render
  // =======================
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[88vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-start gap-3 shrink-0">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
            <BrandLogo brand="kommo" size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">Conectar Kommo CRM</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {mode === 'choose' && 'Escolha como conectar sua conta Kommo.'}
              {mode === 'token' && 'Cole o subdomínio e o token de longa duração.'}
              {mode === 'pick_pipelines' &&
                'Selecione os pipelines que o Ad Flow vai monitorar.'}
              {mode === 'saving' && 'Salvando configuração...'}
              {mode === 'done' && 'Conectado com sucesso!'}
              {mode === 'error' && 'Ocorreu um erro.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={startOAuth}
                disabled={!isKommoOAuthConfigured}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-sky-200 bg-sky-50/60 hover:bg-sky-50 hover:border-sky-300 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Instalar integração OAuth</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-500 text-white px-1.5 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Autorize o Ad Flow dentro do Kommo. Tokens renovam sozinhos.
                  </p>
                  {!isKommoOAuthConfigured && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      OAuth app não configurado (VITE_KOMMO_CLIENT_ID ausente).
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-sky-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setMode('token')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900">
                    Usar token de longa duração
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gere em Kommo → Settings → Integrations → Ad Flow → Long-term token.
                  </p>
                </div>
              </button>

              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  Credenciais ficam criptografadas no banco com RLS ativo por usuário.
                  Desconecte quando quiser.
                </p>
              </div>
            </div>
          )}

          {mode === 'token' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('choose')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subdomínio da conta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="efeitodigital"
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    autoFocus
                  />
                  <span className="text-sm text-slate-400 font-mono">.kommo.com</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Ex: se sua URL é <code>efeitodigital.kommo.com</code>, informe apenas{' '}
                  <code>efeitodigital</code>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Long-term access token
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Em Kommo → <b>Configurações</b> → <b>Integrações</b> → crie/abra uma
                  integração privada → copie o <b>token de longa duração</b>.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyToken}
                disabled={loading || !apiToken.trim() || !subdomain.trim()}
                className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Validar e continuar
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'pick_pipelines' && (
            <div className="space-y-4">
              {account && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">
                      {account.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {verifiedSubdomain}.kommo.com
                      {account.currency && ` · ${account.currency}`}
                      {hasRefresh && ' · OAuth (auto-refresh)'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Pipelines ({pipelines.length})
                  </label>
                  {pipelines.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedPipelineIds.size === pipelines.length) {
                          setSelectedPipelineIds(new Set())
                        } else {
                          setSelectedPipelineIds(
                            new Set(pipelines.map((p) => String(p.id))),
                          )
                        }
                      }}
                      className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                    >
                      {selectedPipelineIds.size === pipelines.length
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'}
                    </button>
                  )}
                </div>
                {pipelines.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center bg-slate-50 rounded-lg">
                    Nenhum pipeline encontrado nesta conta.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pipelines.map((p) => {
                      const idStr = String(p.id)
                      const selected = selectedPipelineIds.has(idStr)
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePipeline(idStr)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            selected
                              ? 'border-sky-500 bg-sky-50/70'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {p.name}
                              {p.is_main && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  Principal
                                </span>
                              )}
                              {p.is_archive && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                                  Arquivado
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">ID: {p.id}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {mode === 'saving' && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Salvando configuração...</p>
            </div>
          )}

          {mode === 'done' && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900">Kommo conectado!</p>
              {account && (
                <p className="text-sm text-slate-500 mt-1">
                  {account.name} · {selectedPipelineIds.size} pipeline(s)
                </p>
              )}
            </div>
          )}

          {mode === 'error' && (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Erro na conexão</p>
              <p className="text-sm text-red-600 mb-5 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => {
                  setError('')
                  setMode('choose')
                }}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {mode === 'pick_pipelines' && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={selectedPipelineIds.size === 0 && pipelines.length > 0}
              className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Conectar Kommo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
