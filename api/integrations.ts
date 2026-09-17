/**
 * GET/POST /api/integrations?op=<operation>
 *
 * Roteador único dos endpoints V2 de integrações. Consolidado para caber
 * no limite de 12 serverless functions do plano Hobby do Vercel.
 *
 * Operações:
 *   clickup-create-folder  (POST) — cria folder no ClickUp Operações
 *   kommo-funnel           (GET)  — pipeline + MQL/SQL do cliente
 *   meta-preview           (GET)  — preview real de criativo via Graph
 *   meta-oauth-*           — troca/custódia do token Meta por cliente
 *
 * Os handlers reais vivem em src/server/integrations/*.ts como named
 * exports — este arquivo só faz o roteamento.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runAgencyCatalog } from '../src/server/integrations/agency-catalog.js'
import { runPlannerAssets } from '../src/server/integrations/planner-assets.js'
import { runPlannerScreenshot } from '../src/server/integrations/planner-screenshot.js'
import { runEnsurePortalToken, runPublicPortal } from '../src/server/integrations/public-portal.js'

import { runClickUpCreateFolder } from '../src/server/integrations/clickup-create-folder.js'
import { runKommoFunnel }         from '../src/server/integrations/kommo-funnel.js'
import { runMetaPreview }         from '../src/server/integrations/meta-preview.js'
import { runMetaAdsDetail }       from '../src/server/integrations/meta-ads-detail.js'
import { runMetaAdsCompare }      from '../src/server/integrations/meta-ads-compare.js'
import { runMetaAdInspect }       from '../src/server/integrations/meta-ad-inspect.js'
import { runGoogleAdsDetail }     from '../src/server/integrations/google-ads-detail.js'
import { runClintFunnel }         from '../src/server/integrations/clint-funnel.js'
import {
  runMetaOAuthExchange,
  runMetaOAuthAccounts,
  runMetaOAuthSelect,
} from '../src/server/integrations/meta-oauth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const op = String(req.query.op || '').trim()
  switch (op) {
    case 'planner-assets':
      return runPlannerAssets(req, res)
    case 'planner-screenshot':
      return runPlannerScreenshot(req, res)
    case 'public-portal':
      return runPublicPortal(req, res)
    case 'ensure-portal-token':
      return runEnsurePortalToken(req, res)
    case 'agency-catalog':
      return runAgencyCatalog(req, res)
    case 'clickup-create-folder':
      return runClickUpCreateFolder(req, res)
    case 'kommo-funnel':
      return runKommoFunnel(req, res)
    case 'meta-preview':
      return runMetaPreview(req, res)
    case 'meta-ads-detail':
      return runMetaAdsDetail(req, res)
    case 'meta-ads-compare':
      return runMetaAdsCompare(req, res)
    case 'meta-ad-inspect':
      return runMetaAdInspect(req, res)
    case 'google-ads-detail':
      return runGoogleAdsDetail(req, res)
    case 'clint-funnel':
      return runClintFunnel(req, res)
    case 'meta-oauth-exchange':
      return runMetaOAuthExchange(req, res)
    case 'meta-oauth-accounts':
      return runMetaOAuthAccounts(req, res)
    case 'meta-oauth-select':
      return runMetaOAuthSelect(req, res)
    default:
      return res.status(400).json({
        error: `unknown op "${op}"`,
        valid: [
          'agency-catalog', 'public-portal', 'ensure-portal-token',
          'planner-assets', 'planner-screenshot',
          'clickup-create-folder', 'kommo-funnel', 'meta-preview',
          'meta-ads-detail', 'meta-ads-compare', 'meta-ad-inspect',
          'google-ads-detail', 'clint-funnel',
          'meta-oauth-exchange', 'meta-oauth-accounts', 'meta-oauth-select',
        ],
      })
  }
}
