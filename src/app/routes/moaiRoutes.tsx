import { Navigate, Route } from 'react-router-dom'

import { ProtectedRoute } from './guards'
import {
  MoaiAppShell,
  MoaiCockpitModule,
  MoaiEstrategiaModule,
  MoaiPlannerModule,
  MoaiMediaModule,
  MoaiSalesModule,
  MoaiConteudoModule,
  MoaiParceriasModule,
  MoaiMembrosModule,
  MoaiCxModule,
  MoaiConselhosModule,
  MoaiFinanceiroModule,
  MoaiOperacoesModule,
  MoaiTimeModule,
  MoaiTurnLabModule,
  MoaiIAModule,
  MoaiAdminModule,
} from './lazy'

/**
 * MOAI Intelligence OS — portal autenticado em /moai.
 * O MoaiAppShell renderiza a sidebar + topbar e um <Outlet/> para os
 * 16 módulos. A autorização fina (RBAC por role) é resolvida dentro do
 * próprio shell via resolveMoaiAccess; aqui só exigimos login.
 *
 * Sub-rotas usam `slug/*` porque vários módulos têm <Routes> internos.
 */
export const moaiRoutes = (
  <Route path="/moai" element={<ProtectedRoute><MoaiAppShell /></ProtectedRoute>}>
    <Route index element={<Navigate to="cockpit" replace />} />
    <Route path="cockpit" element={<MoaiCockpitModule />} />
    <Route path="estrategia/*" element={<MoaiEstrategiaModule />} />
    <Route path="planner/*" element={<MoaiPlannerModule />} />
    <Route path="midia/*" element={<MoaiMediaModule />} />
    <Route path="sales/*" element={<MoaiSalesModule />} />
    <Route path="conteudo/*" element={<MoaiConteudoModule />} />
    <Route path="parcerias/*" element={<MoaiParceriasModule />} />
    <Route path="membros/*" element={<MoaiMembrosModule />} />
    <Route path="cx/*" element={<MoaiCxModule />} />
    <Route path="conselhos/*" element={<MoaiConselhosModule />} />
    <Route path="financeiro/*" element={<MoaiFinanceiroModule />} />
    <Route path="operacoes/*" element={<MoaiOperacoesModule />} />
    <Route path="time/*" element={<MoaiTimeModule />} />
    <Route path="turn-lab/*" element={<MoaiTurnLabModule />} />
    <Route path="ia/*" element={<MoaiIAModule />} />
    <Route path="admin/*" element={<MoaiAdminModule />} />
    <Route path="*" element={<Navigate to="cockpit" replace />} />
  </Route>
)
