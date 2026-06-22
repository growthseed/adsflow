import ClientPlannerPage from '@/pages/_v4/ClientPlannerPage'
import { MoaiModuleShell } from './MoaiModuleShell'

export default function MoaiPlannerModule() {
  return (
    <MoaiModuleShell
      title="Planner de Growth"
      description="Mapas de campanha, jornadas, públicos, criativos e conversão com dados vivos."
    >
      <ClientPlannerPage clientSlugOverride="moai" embedded />
    </MoaiModuleShell>
  )
}
