import { useState, useEffect } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import supabase from '@/lib/supabase'
import { type GoogleAccount, googleAccountsService } from '@/services/googleAuthService'

interface Asset {
  account_id: string
  account_name: string
  description?: string
  thumbnailUrl?: string
}

interface GoogleAssetPickerModalProps {
  open: boolean
  pendingAccounts: GoogleAccount[]
  onClose: () => void
  onSaved: () => void
}

export function GoogleAssetPickerModal({
  open,
  pendingAccounts,
  onClose,
  onSaved,
}: GoogleAssetPickerModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assetsByPlatform, setAssetsByPlatform] = useState<Record<string, Asset[]>>({})
  const [selectedAssets, setSelectedAssets] = useState<Record<string, Set<string>>>({})
  const [activePlatform, setActivePlatform] = useState<string>('')

  useEffect(() => {
    if (!open || pendingAccounts.length === 0) return

    const loadAssets = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const jwt = sessionData.session?.access_token
        if (!jwt) throw new Error('Sessão ausente')

        const apiUrl = `${window.location.origin}/api/google-ads`
        const newAssets: Record<string, Asset[]> = {}
        const newSelected: Record<string, Set<string>> = {}

        for (const account of pendingAccounts) {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          }

          if (account.platform === 'ga4') {
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ action: 'ga4-properties', access_token: account.access_token }),
            })
            if (!resp.ok) throw new Error('Erro ao buscar GA4: ' + (await resp.text()))
            const data = await resp.json()
            newAssets['ga4'] = (data.properties || []).map((p: any) => ({
              account_id: p.property_id,
              account_name: p.display_name,
            }))
            newSelected['ga4'] = new Set()
          }

          if (account.platform === 'search_console') {
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ action: 'gsc-sites', access_token: account.access_token }),
            })
            if (!resp.ok) throw new Error('Erro ao buscar GSC: ' + (await resp.text()))
            const data = await resp.json()
            newAssets['search_console'] = (data.sites || []).map((s: any) => ({
              account_id: s.site_url,
              account_name: s.site_url,
              description: `Permissão: ${s.permission_level}`,
            }))
            newSelected['search_console'] = new Set()
          }

          if (account.platform === 'youtube') {
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ action: 'youtube-channel', access_token: account.access_token }),
            })
            if (!resp.ok) throw new Error('Erro ao buscar YouTube: ' + (await resp.text()))
            const data = await resp.json()
            newAssets['youtube'] = (data.items || []).map((i: any) => ({
              account_id: i.id,
              account_name: i.snippet?.title || i.id,
              thumbnailUrl: i.snippet?.thumbnails?.default?.url,
            }))
            newSelected['youtube'] = new Set()
          }

          if (account.platform === 'gmb') {
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ action: 'gmb-locations', access_token: account.access_token }),
            })
            if (!resp.ok) throw new Error('Erro ao buscar GMB: ' + (await resp.text()))
            const data = await resp.json()
            newAssets['gmb'] = (data.locations || []).map((l: any) => ({
              account_id: l.name,
              account_name: l.title,
            }))
            newSelected['gmb'] = new Set()
          }
        }

        setAssetsByPlatform(newAssets)
        setSelectedAssets(newSelected)
        if (Object.keys(newAssets).length > 0) {
          setActivePlatform(Object.keys(newAssets)[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar contas')
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [open, pendingAccounts])

  if (!open) return null

  const toggleSelection = (platform: string, id: string) => {
    setSelectedAssets((prev) => {
      const nextSet = new Set(prev[platform])
      if (nextSet.has(id)) nextSet.delete(id)
      else nextSet.add(id)
      return { ...prev, [platform]: nextSet }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      for (const account of pendingAccounts) {
        const platform = account.platform
        const selectedIds = selectedAssets[platform]
        if (!selectedIds || selectedIds.size === 0) {
          // Excluir pendente se não selecionou nada para ele (opcional) ou mantemos ignorado?
          // Neste caso vamos simplesmente excluir o pending se a pessoa salvou sem escolher nada,
          // ou ignorar? O melhor é excluir.
          await googleAccountsService.deleteAccount(account.id)
          continue
        }

        const assetsToSave = Array.from(selectedIds).map((id) => {
          const asset = assetsByPlatform[platform].find((a) => a.account_id === id)
          return {
            account_id: id,
            account_name: asset?.account_name || id,
          }
        })

        await googleAccountsService.saveSelectedAssets(account.id, assetsToSave)
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar seleções')
    } finally {
      setSaving(false)
    }
  }

  const platformNames: Record<string, string> = {
    ga4: 'Analytics 4',
    search_console: 'Search Console',
    youtube: 'YouTube',
    gmb: 'Meu Negócio',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Configurar Ferramentas do Google</h2>
          <p className="text-sm text-slate-500">
            Selecione as propriedades que você deseja vincular a este projeto.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-[var(--color-brand-600)] animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Buscando contas no Google...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Erro</p>
              <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {Object.keys(assetsByPlatform).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setActivePlatform(platform)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activePlatform === platform
                        ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {platformNames[platform] || platform}
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/50 text-xs">
                      {assetsByPlatform[platform].length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 mt-4">
                {assetsByPlatform[activePlatform]?.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">
                    Nenhuma propriedade encontrada para este serviço.
                  </p>
                ) : (
                  assetsByPlatform[activePlatform]?.map((asset) => {
                    const isSelected = selectedAssets[activePlatform]?.has(asset.account_id)
                    return (
                      <button
                        key={asset.account_id}
                        onClick={() => toggleSelection(activePlatform, asset.account_id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-[var(--color-brand-50)]/50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[var(--color-brand-600)] border-[var(--color-brand-600)]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {asset.thumbnailUrl && (
                          <img src={asset.thumbnailUrl} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {asset.account_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {asset.description || asset.account_id}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Pular e Fechar
          </button>

          {!loading && !error && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-[var(--color-brand-600)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-brand-700)] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar Contas
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
