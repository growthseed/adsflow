import { Card } from '@/components/primitives'
import type { OnboardingBasic } from '../types'

interface Props {
  value: OnboardingBasic
  onChange: (patch: Partial<OnboardingBasic>) => void
}

const industryOptions = [
  'Educação',
  'Saúde',
  'E-commerce',
  'Serviços',
  'Imobiliária',
  'B2B/SaaS',
  'Outros',
]

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function BasicStep({ value, onChange }: Props) {
  const handleName = (name: string) => {
    const slug = value.clientSlug ? value.clientSlug : slugify(name)
    onChange({ name, clientSlug: slug })
  }

  return (
    <Card className="p-5">
      <h2 className="text-[18px] font-bold text-neutral-900">Informações básicas</h2>
      <p className="text-[13px] text-neutral-500 mt-1 mb-5">
        Dados mínimos pro AdsFlow organizar o cliente. Você pode editar tudo depois.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome do cliente">
          <input
            value={value.name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="Isaac Newton"
            className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Slug (URL)">
          <div className="flex items-center border border-neutral-200 rounded-lg h-10 px-3 gap-1">
            <span className="text-[12px] text-neutral-400 tabular">/c/</span>
            <input
              value={value.clientSlug}
              onChange={(e) => onChange({ clientSlug: slugify(e.target.value) })}
              placeholder="isaac-newton"
              className="flex-1 text-[13px] focus:outline-none bg-transparent"
            />
          </div>
        </Field>
        <Field label="Nicho / vertical">
          <select
            value={value.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">Selecionar…</option>
            {industryOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Budget mensal (R$)">
          <input
            type="number"
            min={0}
            value={value.monthlyBudget ?? ''}
            onChange={(e) => onChange({ monthlyBudget: e.target.value ? Number(e.target.value) : null })}
            placeholder="22000"
            className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] tabular focus:outline-none focus:border-brand-500"
          />
        </Field>
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] eyebrow text-neutral-600">{label}</span>
      {children}
    </label>
  )
}
