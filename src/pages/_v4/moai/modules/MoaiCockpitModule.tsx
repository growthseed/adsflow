/**
 * MoaiCockpitModule — Visão executiva 360° (5s glance pra Vinicius/Duda).
 * Reaproveita o template moai_executive_pulse v2.1 + adiciona briefing diário (futuro IA).
 */

import { useMoaiSnapshot } from '@/hooks/useMoaiSnapshot'
import { WidgetRenderer } from '@/components/canonical/widgets'
import { MOAI_TEMPLATES } from '@/data/moaiTemplates'
import { MoaiModuleShell } from './MoaiModuleShell'

export default function MoaiCockpitModule() {
  const { snapshot, status, refetch } = useMoaiSnapshot()

  return (
    <MoaiModuleShell
      title="Cockpit Executivo"
      description="Visão 360° MOAI · sales + ops + financeiro num glance"
      rightActions={
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              status === 'live' ? 'bg-emerald-500' : status === 'loading' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span className="text-gray-500">
            {status === 'live' ? 'Ao vivo' : status === 'loading' ? 'Sincronizando' : 'Mock'}
          </span>
          <button
            type="button"
            onClick={refetch}
            className="px-2 py-1 text-[10px] text-gray-500 hover:text-[#1A1F36] underline"
          >
            ↻ Atualizar
          </button>
        </div>
      }
    >
      <WidgetRenderer template={MOAI_TEMPLATES.executive_pulse} snapshot={snapshot} />
    </MoaiModuleShell>
  )
}
