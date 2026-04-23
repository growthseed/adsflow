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
 *
 * Os handlers reais vivem em src/server/integrations/*.ts como named
 * exports — este arquivo só faz o roteamento.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { runClickUpCreateFolder } from '../src/server/integrations/clickup-create-folder.js'
import { runKommoFunnel }         from '../src/server/integrations/kommo-funnel.js'
import { runMetaPreview }         from '../src/server/integrations/meta-preview.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const op = String(req.query.op || '').trim()
  switch (op) {
    case 'clickup-create-folder':
      return runClickUpCreateFolder(req, res)
    case 'kommo-funnel':
      return runKommoFunnel(req, res)
    case 'meta-preview':
      return runMetaPreview(req, res)
    default:
      return res.status(400).json({
        error: `unknown op "${op}"`,
        valid: ['clickup-create-folder', 'kommo-funnel', 'meta-preview'],
      })
  }
}
