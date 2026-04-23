/**
 * POST /api/clickup/create-folder
 * Body: { client_id: uuid, folder_name?: string, include_default_lists?: boolean }
 *
 * Cria um folder na Space "Operações" do ClickUp (id em ENV
 * CLICKUP_OPERATIONS_SPACE_ID) e vincula no `client_integrations`
 * do cliente passado. Chamado pelo finalize do onboarding.
 *
 * Retorna { folder_id, folder_name, lists: [{id, name}] }
 *
 * Auth: JWT Supabase + role admin/super_admin. Requer CLICKUP_API_TOKEN
 * no servidor. Sem token, retorna 501.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CLICKUP_TOKEN = process.env.CLICKUP_API_KEY || process.env.CLICKUP_API_TOKEN || ''
const CLICKUP_SPACE_ID = process.env.CLICKUP_OPERATIONS_SPACE_ID || '90113696605'

const DEFAULT_LISTS = [
  'Briefing · Inputs do cliente',
  'Operação · Semanal',
  'Criativos · Em produção',
  'Aprovações',
  'Relatórios enviados',
]

export async function runClickUpCreateFolder(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return
  if (auth.globalRole !== 'super_admin' && auth.globalRole !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }

  if (!CLICKUP_TOKEN) {
    return res.status(501).json({
      note:
        'CLICKUP_API_KEY não configurada no servidor. Folder não criado automaticamente — vincule manualmente em Integrações → ClickUp.',
    })
  }

  const body = req.body as {
    client_id?: string
    folder_name?: string
    include_default_lists?: boolean
  } | undefined

  if (!body?.client_id) {
    return res.status(400).json({ error: 'client_id required' })
  }

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolve nome do cliente
  const { data: client } = await svc
    .from('clients')
    .select('id, name, slug')
    .eq('id', body.client_id)
    .maybeSingle()
  if (!client) return res.status(404).json({ error: 'client not found' })

  const typedClient = client as { id: string; name: string; slug: string }
  const folderName = body.folder_name?.trim() || typedClient.name

  try {
    // 1. Cria o folder
    const folderResp = await fetch(
      `https://api.clickup.com/api/v2/space/${CLICKUP_SPACE_ID}/folder`,
      {
        method: 'POST',
        headers: {
          authorization: CLICKUP_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: folderName }),
      },
    )
    if (!folderResp.ok) {
      const detail = await folderResp.text().catch(() => '')
      return res.status(502).json({
        error: `ClickUp create folder ${folderResp.status}`,
        detail: detail.slice(0, 400),
      })
    }
    const folderJson = (await folderResp.json()) as { id: string; name: string }
    const folderId = folderJson.id

    // 2. Cria listas default (se solicitado)
    const createdLists: Array<{ id: string; name: string }> = []
    if (body.include_default_lists !== false) {
      for (const listName of DEFAULT_LISTS) {
        const listResp = await fetch(
          `https://api.clickup.com/api/v2/folder/${folderId}/list`,
          {
            method: 'POST',
            headers: {
              authorization: CLICKUP_TOKEN,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ name: listName }),
          },
        )
        if (listResp.ok) {
          const listJson = (await listResp.json()) as { id: string; name: string }
          createdLists.push({ id: listJson.id, name: listJson.name })
        }
      }
    }

    // 3. Vincula em client_integrations
    await svc
      .from('client_integrations')
      .upsert(
        {
          client_id: typedClient.id,
          provider: 'clickup',
          external_account_id: folderId,
          external_workspace_id: CLICKUP_SPACE_ID,
          external_account_name: folderName,
          status: 'active',
          metadata: {
            folder_id: folderId,
            folder_name: folderName,
            default_lists: createdLists,
            auto_created_at: new Date().toISOString(),
          },
        },
        { onConflict: 'client_id,provider,external_account_id' },
      )

    return res.status(200).json({
      folder_id: folderId,
      folder_name: folderName,
      lists: createdLists,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(500).json({ error: 'create folder failed', detail: msg })
  }
}
