/**
 * ============================================
 * BILLING PAGE
 * ============================================
 * Gerenciamento de plano, faturas e métodos
 * de pagamento da agência / cliente.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Rocket,
  Receipt,
  Download,
  Plus,
  ArrowUpRight,
  BarChart3,
  Users,
  GitBranch,
  FileText,
  Loader2,
} from 'lucide-react'

// =====================================================
// PLAN DEFINITIONS
// =====================================================

interface Plan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  icon: React.ElementType
  color: string
  popular?: boolean
  features: string[]
  limits: {
    adAccounts: number | 'unlimited'
    flows: number | 'unlimited'
    reports: number | 'unlimited'
    teamMembers: number | 'unlimited'
  }
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    interval: 'month',
    icon: Zap,
    color: 'blue',
    features: [
      '3 contas de anúncio',
      '10 flows',
      '20 relatórios/mês',
      '2 membros na equipe',
      'Suporte por email',
      'Integrações básicas',
    ],
    limits: { adAccounts: 3, flows: 10, reports: 20, teamMembers: 2 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 247,
    interval: 'month',
    icon: Crown,
    color: 'indigo',
    popular: true,
    features: [
      '15 contas de anúncio',
      'Flows ilimitados',
      'Relatórios ilimitados',
      '10 membros na equipe',
      'Suporte prioritário',
      'Todas as integrações',
      'Exportação PNG/PDF',
      'Links compartilháveis',
    ],
    limits: { adAccounts: 15, flows: 'unlimited', reports: 'unlimited', teamMembers: 10 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 497,
    interval: 'month',
    icon: Rocket,
    color: 'purple',
    features: [
      'Contas ilimitadas',
      'Tudo ilimitado',
      'Membros ilimitados',
      'Suporte dedicado (WhatsApp)',
      'Onboarding personalizado',
      'API access',
      'White-label (em breve)',
      'SLA 99.9%',
    ],
    limits: { adAccounts: 'unlimited', flows: 'unlimited', reports: 'unlimited', teamMembers: 'unlimited' },
  },
]

// Mock invoices
const MOCK_INVOICES = [
  { id: 'INV-2026-001', date: '2026-02-01', amount: 247, status: 'paid' as const, plan: 'Pro' },
  { id: 'INV-2026-002', date: '2026-01-01', amount: 247, status: 'paid' as const, plan: 'Pro' },
  { id: 'INV-2025-012', date: '2025-12-01', amount: 97, status: 'paid' as const, plan: 'Starter' },
  { id: 'INV-2025-011', date: '2025-11-01', amount: 97, status: 'paid' as const, plan: 'Starter' },
]

// =====================================================
// SUB-COMPONENTS
// =====================================================

function PlanCard({
  plan,
  isCurrentPlan,
  annual,
  onSelect,
}: {
  plan: Plan
  isCurrentPlan: boolean
  annual: boolean
  onSelect: () => void
}) {
  const Icon = plan.icon
  const price = annual ? Math.round(plan.price * 10) : plan.price
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    indigo: 'from-indigo-500 to-indigo-700',
    purple: 'from-purple-500 to-purple-700',
  }
  const borderMap: Record<string, string> = {
    blue: 'border-blue-200 hover:border-blue-400',
    indigo: 'border-indigo-300 hover:border-indigo-500 ring-2 ring-indigo-100',
    purple: 'border-purple-200 hover:border-purple-400',
  }

  return (
    <div
      className={`relative bg-white rounded-2xl border p-6 transition-all ${borderMap[plan.color]} ${
        isCurrentPlan ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
          Mais Popular
        </span>
      )}
      {isCurrentPlan && (
        <span className="absolute -top-3 right-4 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
          Plano Atual
        </span>
      )}

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[plan.color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
      <div className="mt-2 mb-5">
        <span className="text-3xl font-extrabold text-slate-900">
          R$ {price.toLocaleString('pt-BR')}
        </span>
        <span className="text-slate-500 text-sm ml-1">
          /{annual ? 'ano' : 'mês'}
        </span>
        {annual && (
          <p className="text-xs text-green-600 font-medium mt-1">
            Economia de 2 meses (R$ {(plan.price * 2).toLocaleString('pt-BR')})
          </p>
        )}
      </div>

      <ul className="space-y-2.5 mb-6">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            {feat}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isCurrentPlan
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : plan.popular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {isCurrentPlan ? 'Plano Atual' : 'Escolher Plano'}
      </button>
    </div>
  )
}

function UsageMeter({
  label,
  icon: Icon,
  current,
  limit,
}: {
  label: string
  icon: React.ElementType
  current: number
  limit: number | 'unlimited'
}) {
  const pct = limit === 'unlimited' ? 10 : Math.min((current / limit) * 100, 100)
  const isNearLimit = limit !== 'unlimited' && pct >= 80

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">
            {current} / {limit === 'unlimited' ? '∞' : limit}
          </p>
        </div>
        {isNearLimit && (
          <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
            Quase no limite
          </span>
        )}
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function BillingPage() {
  const { hasClientRole } = useAuth()
  const toast = useToast()
  const [annual, setAnnual] = useState(false)
  const [currentPlanId] = useState('pro')
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'plans' | 'invoices' | 'payment'>('plans')

  // Check owner role
  if (!hasClientRole('owner')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CreditCard className="w-12 h-12 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
        <p className="text-sm text-slate-500">Apenas owners podem acessar o faturamento.</p>
      </div>
    )
  }

  // Mock usage data
  const usage = {
    adAccounts: 8,
    flows: 24,
    reports: 47,
    teamMembers: 5,
  }

  const currentPlan = PLANS.find((p) => p.id === currentPlanId) || PLANS[1]

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === currentPlanId) return
    setProcessing(true)

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setProcessing(false)

    const isUpgrade = PLANS.indexOf(plan) > PLANS.indexOf(currentPlan)
    toast.success(
      isUpgrade
        ? `Upgrade para ${plan.name} iniciado! Redirecionando para pagamento...`
        : `Downgrade para ${plan.name} será aplicado no próximo ciclo.`
    )
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info(`Baixando fatura ${invoiceId}...`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faturamento</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie seu plano, uso e faturas.
        </p>
      </div>

      {/* Current Plan Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">Plano atual</p>
            <h2 className="text-2xl font-bold mt-1">{currentPlan.name}</h2>
            <p className="text-blue-200 text-sm mt-1">
              R$ {currentPlan.price}/mês • Próxima cobrança em 01/03/2026
            </p>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Alterar Plano
          </button>
        </div>
      </div>

      {/* Usage Meters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Uso Atual</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UsageMeter
            label="Contas de Anúncio"
            icon={BarChart3}
            current={usage.adAccounts}
            limit={currentPlan.limits.adAccounts}
          />
          <UsageMeter
            label="Flows"
            icon={GitBranch}
            current={usage.flows}
            limit={currentPlan.limits.flows}
          />
          <UsageMeter
            label="Relatórios (mês)"
            icon={FileText}
            current={usage.reports}
            limit={currentPlan.limits.reports}
          />
          <UsageMeter
            label="Membros"
            icon={Users}
            current={usage.teamMembers}
            limit={currentPlan.limits.teamMembers}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { id: 'plans' as const, label: 'Planos' },
          { id: 'invoices' as const, label: 'Faturas' },
          { id: 'payment' as const, label: 'Pagamento' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-sm ${!annual ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Mensal
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                annual ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  annual ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Anual
            </span>
            {annual && (
              <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                -17%
              </span>
            )}
          </div>

          {processing && (
            <div className="flex items-center justify-center gap-2 py-4 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Processando alteração...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={plan.id === currentPlanId}
                annual={annual}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Histórico de Faturas</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {MOCK_INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{inv.id}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(inv.date).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    • {inv.plan}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {inv.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(inv.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Baixar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          {/* Current card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Método de Pagamento</h3>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-700 to-blue-900 rounded-md flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">•••• •••• •••• 4242</p>
                <p className="text-xs text-slate-500">Expira em 12/2028 • Visa</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Alterar
              </button>
            </div>
          </div>

          {/* Add new */}
          <button className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar novo método de pagamento</span>
          </button>

          {/* Billing info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Dados de Faturamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Razão Social / Nome</label>
                <input
                  type="text"
                  defaultValue="Efeito Digital LTDA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">CNPJ / CPF</label>
                <input
                  type="text"
                  defaultValue="12.345.678/0001-90"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 block mb-1">Email para notas fiscais</label>
                <input
                  type="email"
                  defaultValue="financeiro@efeitodigital.com.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => toast.success('Dados de faturamento salvos!')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
