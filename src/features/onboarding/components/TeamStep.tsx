import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Avatar, Card, Pill } from '@/components/primitives'
import type { OnboardingTeamInvite } from '../types'

interface Props {
  invites: OnboardingTeamInvite[]
  onAdd: (invite: OnboardingTeamInvite) => void
  onRemove: (email: string) => void
}

const roleOptions: Array<{ value: OnboardingTeamInvite['role']; label: string }> = [
  { value: 'owner',   label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin',   label: 'Admin' },
  { value: 'analyst', label: 'Analista' },
  { value: 'viewer',  label: 'Viewer (portal)' },
]

export function TeamStep({ invites, onAdd, onRemove }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OnboardingTeamInvite['role']>('manager')

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    onAdd({ email: email.trim().toLowerCase(), role })
    setEmail('')
  }

  return (
    <Card className="p-5">
      <h2 className="text-[18px] font-bold text-neutral-900">Equipe & permissões</h2>
      <p className="text-[13px] text-neutral-500 mt-1 mb-5">
        Convide quem do time precisa ver esse cliente. Role “Viewer” recebe apenas o Portal.
      </p>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@empresa.com"
          className="flex-1 h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as OnboardingTeamInvite['role'])}
          className="h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white"
        >
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={submit}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {invites.length === 0 ? (
        <p className="text-[12px] text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-4 text-center">
          Nenhum convite ainda — você pode adicionar depois em “Equipe”.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
          {invites.map((inv) => (
            <li key={inv.email} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={inv.email} size="sm" />
              <div className="flex-1 min-w-0 text-[13px] text-neutral-800 truncate">
                {inv.email}
              </div>
              <Pill tone="brand">{roleOptions.find((o) => o.value === inv.role)?.label ?? inv.role}</Pill>
              <button
                onClick={() => onRemove(inv.email)}
                aria-label="remover"
                className="w-7 h-7 grid place-items-center rounded-md text-neutral-500 hover:bg-error-50 hover:text-error-600"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
