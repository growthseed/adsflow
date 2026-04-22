import { useCallback, useState } from 'react'
import { Plus, Settings2, Target } from 'lucide-react'

import { useAlertsData } from './hooks/useAlertsData'
import { AlertsSummary } from './components/AlertsSummary'
import { GoalsList } from './components/GoalsList'
import { AlertRulesCard } from './components/AlertRulesCard'
import { AlertsFeed } from './components/AlertsFeed'
import { GoalFormModal } from './components/GoalFormModal'
import { RuleFormModal } from './components/RuleFormModal'
import { supabase } from '@/lib/supabase'
import type { AgencyGoal, AlertRule } from './types'

export default function AlertsPage() {
  const { rules, setRules, events, goals, summary, loading, reload } = useAlertsData()

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalEditing, setGoalEditing] = useState<AgencyGoal | null>(null)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [ruleEditing, setRuleEditing] = useState<AlertRule | null>(null)

  const handleToggleRule = useCallback(
    async (ruleId: string, active: boolean) => {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, active } : r)))
      await supabase.from('alert_rules').update({ active }).eq('id', ruleId)
    },
    [setRules],
  )

  const openNewGoal = () => {
    setGoalEditing(null)
    setGoalModalOpen(true)
  }
  const openNewRule = () => {
    setRuleEditing(null)
    setRuleModalOpen(true)
  }

  return (
    <div className="max-w-layout mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-neutral-900">
            Metas & Alertas
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Metas por cliente + regras proativas (WhatsApp, e-mail, in-app)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNewGoal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700"
          >
            <Target size={14} /> Nova meta
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700">
            <Settings2 size={14} /> Canais
          </button>
          <button
            onClick={openNewRule}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
          >
            <Plus size={14} /> Nova regra
          </button>
        </div>
      </header>

      <AlertsSummary
        azul={summary.azul}
        risco={summary.risco}
        criticas={summary.criticas}
        rulesActive={summary.rulesActive}
        totalClients={summary.totalClients}
      />

      <section className="mb-6">
        <h2 className="eyebrow text-neutral-600 mb-2 flex items-center gap-2">
          <span>Metas ativas</span>
          <span className="flex-1 h-px bg-neutral-200" />
          {goals.length === 0 && !loading && (
            <button
              onClick={openNewGoal}
              className="text-[11px] font-semibold text-brand-700 hover:text-brand-900"
            >
              + criar primeira meta
            </button>
          )}
        </h2>
        {loading ? (
          <div className="text-xs text-neutral-500 py-6 text-center">Carregando…</div>
        ) : (
          <GoalsList
            goals={goals}
            onEdit={(g) => {
              setGoalEditing(g)
              setGoalModalOpen(true)
            }}
          />
        )}
      </section>

      <div className="grid grid-cols-12 gap-4">
        <AlertRulesCard
          rules={rules}
          onToggle={handleToggleRule}
          onNew={openNewRule}
          onEdit={(r) => {
            setRuleEditing(r)
            setRuleModalOpen(true)
          }}
        />
        <AlertsFeed events={events} />
      </div>

      <GoalFormModal
        open={goalModalOpen}
        initial={goalEditing}
        onClose={() => setGoalModalOpen(false)}
        onSaved={reload}
      />
      <RuleFormModal
        open={ruleModalOpen}
        initial={ruleEditing}
        onClose={() => setRuleModalOpen(false)}
        onSaved={reload}
      />
    </div>
  )
}
