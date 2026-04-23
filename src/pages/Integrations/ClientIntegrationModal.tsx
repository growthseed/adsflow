import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Link2, Loader2, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type ProviderKey =
  | 'linkedin'
  | 'shopify'
  | 'woocommerce'
  | 'mailchimp'
  | 'brevo'
  | 'hotmart'
  | 'tiktok_ads'
  | 'meta_ads_manual'
  | 'google_ads_manual'

interface FieldDef {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  type?: 'text' | 'password' | 'url'
  hint?: string
}

interface ProviderConfig {
  name: string
  brandColor: string
  brandInitial: string
  helpUrl?: string
  /** Campos específicos, em ordem */
  fields: FieldDef[]
  /** Mapeia form values → columns da tabela client_integrations */
  buildPayload: (values: Record<string, string>) => {
    external_account_id: string
    external_account_name: string | null
    external_workspace_id?: string | null
    access_token?: string | null
    refresh_token?: string | null
    metadata?: Record<string, unknown>
  }
}

const CONFIGS: Record<ProviderKey, ProviderConfig> = {
  linkedin: {
    name: 'LinkedIn',
    brandColor: '#0a66c2',
    brandInitial: 'in',
    helpUrl: 'https://www.linkedin.com/developers/apps',
    fields: [
      { key: 'org_urn', label: 'Organization URN', placeholder: 'urn:li:organization:12345', required: true, hint: 'Obtido em linkedin.com/company/<slug>/admin → URL' },
      { key: 'org_name', label: 'Nome da página', placeholder: 'Ex: Efeito Digital', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'Bearer token do LinkedIn Marketing API', required: true, type: 'password' },
    ],
    buildPayload: (v) => ({
      external_account_id: v.org_urn,
      external_account_name: v.org_name,
      access_token: v.access_token,
    }),
  },
  shopify: {
    name: 'Shopify',
    brandColor: '#95bf47',
    brandInitial: 'S',
    helpUrl: 'https://admin.shopify.com/',
    fields: [
      { key: 'shop_domain', label: 'Shop domain', placeholder: 'minhaloja.myshopify.com', required: true },
      { key: 'shop_name', label: 'Nome da loja', placeholder: 'Minha Loja', required: true },
      { key: 'admin_token', label: 'Admin API access token', placeholder: 'shpat_...', required: true, type: 'password', hint: 'Admin → Apps → Develop apps → Admin API access token' },
    ],
    buildPayload: (v) => ({
      external_account_id: v.shop_domain,
      external_account_name: v.shop_name,
      access_token: v.admin_token,
    }),
  },
  woocommerce: {
    name: 'WooCommerce',
    brandColor: '#7f54b3',
    brandInitial: 'W',
    helpUrl: 'https://woocommerce.com/document/woocommerce-rest-api/',
    fields: [
      { key: 'store_url', label: 'URL da loja', placeholder: 'https://minhaloja.com.br', required: true, type: 'url' },
      { key: 'store_name', label: 'Nome da loja', placeholder: 'Minha Loja', required: true },
      { key: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_...', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_...', required: true, type: 'password' },
    ],
    buildPayload: (v) => ({
      external_account_id: v.store_url,
      external_account_name: v.store_name,
      access_token: v.consumer_key,
      refresh_token: v.consumer_secret,
      metadata: { consumer_key: v.consumer_key, store_url: v.store_url },
    }),
  },
  mailchimp: {
    name: 'Mailchimp',
    brandColor: '#ffe01b',
    brandInitial: 'M',
    helpUrl: 'https://us1.admin.mailchimp.com/account/api/',
    fields: [
      { key: 'api_key', label: 'API key', placeholder: 'xxxxx-us14', required: true, type: 'password', hint: 'Formato: <chave>-<datacenter> (ex: us14). O datacenter vem no sufixo.' },
      { key: 'account_name', label: 'Nome da conta', placeholder: 'Ex: Efeito Digital Newsletter', required: true },
    ],
    buildPayload: (v) => {
      const dcMatch = /-([a-z0-9]+)$/.exec(v.api_key)
      const datacenter = dcMatch ? dcMatch[1] : null
      return {
        external_account_id: v.api_key.slice(0, 8) + '…',
        external_account_name: v.account_name,
        external_workspace_id: datacenter,
        access_token: v.api_key,
        metadata: { datacenter },
      }
    },
  },
  brevo: {
    name: 'Brevo',
    brandColor: '#0b996e',
    brandInitial: 'B',
    helpUrl: 'https://app.brevo.com/settings/keys/api',
    fields: [
      { key: 'api_key', label: 'API key', placeholder: 'xkeysib-...', required: true, type: 'password' },
      { key: 'account_name', label: 'Nome da conta', placeholder: 'Ex: Efeito Digital', required: true },
    ],
    buildPayload: (v) => ({
      external_account_id: v.api_key.slice(0, 10) + '…',
      external_account_name: v.account_name,
      access_token: v.api_key,
    }),
  },
  hotmart: {
    name: 'Hotmart',
    brandColor: '#ef4e23',
    brandInitial: 'H',
    helpUrl: 'https://developers.hotmart.com/docs/',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'hotmart client_id', required: true },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'hotmart client_secret', required: true, type: 'password' },
      { key: 'basic_token', label: 'Basic Token (Base64)', placeholder: 'Basic xxxxx', required: true, type: 'password' },
      { key: 'account_name', label: 'Nome da conta', placeholder: 'Ex: Produtor XYZ', required: true },
    ],
    buildPayload: (v) => ({
      external_account_id: v.client_id,
      external_account_name: v.account_name,
      access_token: v.client_secret,
      refresh_token: v.basic_token,
    }),
  },
  tiktok_ads: {
    name: 'TikTok Ads',
    brandColor: '#000000',
    brandInitial: 'T',
    helpUrl: 'https://ads.tiktok.com/marketing_api/',
    fields: [
      { key: 'advertiser_id', label: 'Advertiser ID', placeholder: '7290...', required: true },
      { key: 'account_name', label: 'Nome da conta', placeholder: 'Ex: Efeito Digital TikTok', required: true },
      { key: 'access_token', label: 'Long-term access token', placeholder: 'token...', required: true, type: 'password' },
    ],
    buildPayload: (v) => ({
      external_account_id: v.advertiser_id,
      external_account_name: v.account_name,
      access_token: v.access_token,
    }),
  },
  meta_ads_manual: {
    name: 'Meta Ads (manual)',
    brandColor: '#1877f2',
    brandInitial: 'M',
    helpUrl: 'https://business.facebook.com/',
    fields: [
      { key: 'account_id', label: 'ID da conta', placeholder: 'act_123456789', required: true, hint: 'Deve começar com act_' },
      { key: 'account_name', label: 'Nome', placeholder: 'Ex: Cliente XYZ Meta', required: true },
      { key: 'access_token', label: 'Access Token (long-lived)', placeholder: '...', type: 'password' },
    ],
    buildPayload: (v) => ({
      external_account_id: v.account_id,
      external_account_name: v.account_name,
      access_token: v.access_token || null,
    }),
  },
  google_ads_manual: {
    name: 'Google Ads (manual)',
    brandColor: '#ea4335',
    brandInitial: 'G',
    helpUrl: 'https://ads.google.com/',
    fields: [
      { key: 'customer_id', label: 'Customer ID', placeholder: '123-456-7890', required: true },
      { key: 'account_name', label: 'Nome', placeholder: 'Ex: Cliente XYZ Google', required: true },
    ],
    buildPayload: (v) => ({
      external_account_id: v.customer_id.replace(/-/g, ''),
      external_account_name: v.account_name,
    }),
  },
}

interface Props {
  open: boolean
  provider: ProviderKey | null
  clientId?: string | null
  onClose: () => void
  onSaved?: () => void
}

export function ClientIntegrationModal({ open, provider, clientId, onClose, onSaved }: Props) {
  const { activeClient } = useAuth()
  const resolvedClientId = clientId ?? activeClient?.client_id ?? null
  const cfg = useMemo(() => (provider ? CONFIGS[provider] : null), [provider])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues({})
      setError(null)
    }
  }, [open, provider])

  if (!open || !cfg || !provider) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!resolvedClientId) {
      setError('Selecione um cliente ativo antes de conectar.')
      return
    }

    for (const f of cfg.fields) {
      if (f.required && !(values[f.key] ?? '').trim()) {
        setError(`Preencha "${f.label}".`)
        return
      }
    }

    setLoading(true)
    try {
      const supabaseProvider =
        provider === 'meta_ads_manual' ? 'meta_ads'
          : provider === 'google_ads_manual' ? 'google_ads'
          : provider

      const payload = cfg.buildPayload(values)
      const { error: err } = await supabase.from('client_integrations').insert({
        client_id: resolvedClientId,
        provider: supabaseProvider,
        status: 'active',
        ...payload,
        metadata: {
          ...(payload.metadata ?? {}),
          connected_at: new Date().toISOString(),
          connection_method: 'manual',
        },
      })
      if (err) throw err
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao conectar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-overlay)] w-full max-w-lg max-h-[92vh] flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white grid place-items-center font-bold shrink-0"
              style={{ background: cfg.brandColor }}
            >
              {cfg.brandInitial}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-neutral-900">Conectar {cfg.name}</h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Informe as credenciais. Serão salvas em <code className="bg-neutral-100 px-1 rounded text-[10px]">client_integrations</code>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="fechar"
            className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto">
          {!resolvedClientId && (
            <div className="flex items-start gap-2 text-[12px] text-warning-700 bg-warning-50 border border-warning-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>Nenhum cliente selecionado. Troque o cliente ativo na sidebar primeiro.</span>
            </div>
          )}

          {cfg.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-700 eyebrow">
                {f.label} {f.required && <span className="text-error-600">*</span>}
              </span>
              <input
                type={f.type ?? 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
              />
              {f.hint && <span className="text-[10px] text-neutral-500">{f.hint}</span>}
            </label>
          ))}

          {cfg.helpUrl && (
            <p className="text-[11px] text-neutral-500">
              Precisa gerar credenciais?{' '}
              <a
                href={cfg.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 underline font-semibold"
              >
                Abrir painel do {cfg.name}
              </a>
            </p>
          )}

          {error && (
            <div className="text-[12px] text-error-600 bg-error-50 border border-error-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <footer className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !resolvedClientId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
              Conectar {cfg.name}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export type { ProviderKey }
