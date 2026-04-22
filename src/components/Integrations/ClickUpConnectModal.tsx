/**
 * ============================================
 * <ClickUpConnectModal> — OAuth-first ClickUp connect flow
 * ============================================
 * Two paths:
 *   • OAuth: button redirects to ClickUp authorize → our callback on /integrations
 *     populates step `pick_workspace` via `prefill`.
 *   • API key: paste a personal token → verify via ClickUp /team → workspace picker.
 *
 * Parent wires:
 *   - `prefill` when returning from the OAuth redirect (provides access_token + teams)
 *   - `onSave` persists the config via clickupConfigsService
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
  Users,
  X,
} from 'lucide-react'
import {
  clickupAuthService,
  isClickUpOAuthConfigured,
  type ClickUpTeam,
  type ClickUpUser,
} from '@/services/clickupAuthService'
import { BrandLogo } from '@/components/canonical/BrandLogo'

type Mode = 'choose' | 'oauth' | 'apiKey' | 'pick_workspace' | 'saving' | 'done' | 'error'

export interface ClickUpPrefill {
  access_token: string
  teams: ClickUpTeam[]
  user: ClickUpUser | null
}

interface Props {
  open: boolean
  onClose: () => void
  /** Fresh OAuth result injected by parent when callback lands on /integrations */
  prefill?: ClickUpPrefill | null
  onSave: (data: {
    apiToken: string
    teamId: string
    teamName: string
    via: 'oauth' | 'api_key'
  }) => Promise<void>
}

export default function ClickUpConnectModal({
  open,
  onClose,
  prefill,
  onSave,
}: Props) {
  const [mode, setMode] = useState<Mode>('choose')
  const [apiToken, setApiToken] = useState('')
  const [token, setToken] = useState('') // final token (oauth or apiKey)
  const [teams, setTeams] = useState<ClickUpTeam[]>([])
  const [user, setUser] = useState<ClickUpUser | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset when closed
  useEffect(() => {
    if (open) return
    setMode('choose')
    setApiToken('')
    setToken('')
    setTeams([])
    setUser(null)
    setSelectedTeamId(null)
    setError('')
  }, [open])

  // Apply OAuth callback prefill
  useEffect(() => {
    if (!open || !prefill) return
    setToken(prefill.access_token)
    setTeams(prefill.teams)
    setUser(prefill.user)
    setSelectedTeamId(prefill.teams[0]?.id ?? null)
    setMode('pick_workspace')
  }, [open, prefill])

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  )

  if (!open) return null

  // =======================
  // Handlers
  // =======================
  const startOAuth = () => {
    try {
      const url = clickupAuthService.getAuthUrl()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar OAuth.')
      setMode('error')
    }
  }

  const handleVerifyApiKey = async () => {
    if (!apiToken.trim()) {
      setError('Cole seu token de API do ClickUp.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { teams: ts, user: u } = await clickupAuthService.verifyApiToken(apiToken)
      if (ts.length === 0) {
        setError('Nenhum workspace encontrado para esse token.')
        setLoading(false)
        return
      }
      setToken(apiToken.trim())
      setTeams(ts)
      setUser(u)
      setSelectedTeamId(ts[0]?.id ?? null)
      setMode('pick_workspace')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao validar o token.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTeam || !token) return
    setMode('saving')
    setError('')
    try {
      await onSave({
        apiToken: token,
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        via: prefill ? 'oauth' : 'api_key',
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
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start gap-3 shrink-0">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
            <BrandLogo brand="clickup" size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">Conectar ClickUp</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {mode === 'choose' && 'Escolha como conectar sua conta ClickUp.'}
              {mode === 'apiKey' && 'Cole seu token de API pessoal.'}
              {mode === 'pick_workspace' && 'Escolha o workspace que o Ad Flow vai usar.'}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={startOAuth}
                disabled={!isClickUpOAuthConfigured}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50 hover:bg-violet-50 hover:border-violet-300 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      Conectar via OAuth
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-violet-500 text-white px-1.5 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Autorize o Ad Flow diretamente no ClickUp. Mais seguro, nada de colar tokens.
                  </p>
                  {!isClickUpOAuthConfigured && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      OAuth app não configurado (VITE_CLICKUP_CLIENT_ID ausente).
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-violet-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setMode('apiKey')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900">Usar token pessoal de API</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gere em ClickUp → Settings → Apps → API Token e cole aqui.
                  </p>
                </div>
              </button>

              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  Tokens e credenciais ficam criptografados no banco. Você pode desconectar
                  a qualquer momento em Integrações.
                </p>
              </div>
            </div>
          )}

          {mode === 'apiKey' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('choose')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Token pessoal (Personal API Token)
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="pk_1234567_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Em ClickUp, clique no seu avatar (canto inferior esquerdo) → <b>Settings</b> →{' '}
                  <b>Apps</b> → <b>API Token</b> → <b>Generate</b>.{' '}
                  <a
                    href="https://app.clickup.com/settings/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 hover:text-violet-700 inline-flex items-center gap-0.5"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyApiKey}
                disabled={loading || !apiToken.trim()}
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

          {mode === 'pick_workspace' && (
            <div className="space-y-4">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">
                      Conectado como {user.username}
                    </p>
                    <p className="text-xs text-emerald-600 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Workspace ({teams.length} {teams.length === 1 ? 'disponível' : 'disponíveis'})
                </label>
                <div className="space-y-2">
                  {teams.map((team) => {
                    const selected = team.id === selectedTeamId
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selected
                            ? 'border-violet-500 bg-violet-50/70'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {team.avatar ? (
                          <img
                            src={team.avatar}
                            alt={team.name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm"
                            style={{ backgroundColor: team.color || '#7b68ee' }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {team.name}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-mono">ID: {team.id}</span>
                            {team.members != null && (
                              <span className="inline-flex items-center gap-0.5">
                                <Users className="w-3 h-3" />
                                {team.members}
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
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
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Salvando configuração...</p>
            </div>
          )}

          {mode === 'done' && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900">ClickUp conectado!</p>
              {selectedTeam && (
                <p className="text-sm text-slate-500 mt-1">{selectedTeam.name}</p>
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

        {/* Footer */}
        {mode === 'pick_workspace' && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedTeam}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Conectar workspace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
