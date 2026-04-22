import { useState } from 'react'
import { Download } from 'lucide-react'

import { usePacingData } from './hooks/usePacingData'
import { PacingSummary } from './components/PacingSummary'
import { PacingChart } from './components/PacingChart'
import { PacingTable } from './components/PacingTable'
import { AutoPauseModal } from './components/AutoPauseModal'

export default function PacingPage() {
  const { rows, aggregate, dailySeries } = usePacingData()
  const [modalOpen, setModalOpen] = useState(false)

  const clientsAffected = rows
    .filter((r) => r.status === 'ahead' || r.status === 'will_overspend')
    .map((r) => r.clientName)

  return (
    <div className="max-w-layout mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-neutral-900">
            Budget Pacing
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gasto real vs ideal · projeção de fim de mês · pause automático opcional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700">
            Abril 2026
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
            <Download size={14} />
            Exportar
          </button>
        </div>
      </header>

      <PacingSummary aggregate={aggregate} />

      <div className="mb-5">
        <PacingChart
          series={dailySeries}
          todayDay={aggregate.monthDayNum}
          totalDays={aggregate.monthDaysTotal}
          projectedTotal={aggregate.totalProjected}
        />
      </div>

      <PacingTable rows={rows} onConfigureAutoPause={() => setModalOpen(true)} />

      <AutoPauseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async (threshold) => {
          // TODO Sprint 5 follow-up: gravar em pacing_rules via API
          console.info('auto-pause activated', { threshold })
        }}
        clientsAffected={clientsAffected}
      />
    </div>
  )
}
