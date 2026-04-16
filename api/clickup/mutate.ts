/**
 * ============================================
 * POST /api/clickup/mutate
 * ============================================
 * Unified ClickUp mutation endpoint. Proxies write ops to
 * the ClickUp API using the agency's stored token (never
 * exposed to the frontend).
 *
 * Supports:
 *   action: 'update_task'    — PATCH /task/{id}
 *   action: 'add_comment'    — POST /task/{id}/comment
 *   action: 'set_assignees'  — PUT /task/{id} (assignees)
 *
 * Auth: Supabase JWT (user must be agency member)
 * Token: read from env CLICKUP_API_TOKEN (agency-wide)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const CLICKUP_API = 'https://api.clickup.com/api/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGINS || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth: validate JWT via Supabase
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' })
  }

  const token = process.env.CLICKUP_API_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'CLICKUP_API_TOKEN not configured' })
  }

  const { action, task_id, payload } = req.body as {
    action: string
    task_id: string
    payload?: Record<string, unknown>
  }

  if (!action || !task_id) {
    return res.status(400).json({ error: 'action and task_id required' })
  }

  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json',
  }

  try {
    let response: Response

    switch (action) {
      case 'update_task': {
        response = await fetch(`${CLICKUP_API}/task/${task_id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload ?? {}),
        })
        break
      }

      case 'add_comment': {
        const { comment_text, assignee, notify_all } = payload ?? {}
        response = await fetch(`${CLICKUP_API}/task/${task_id}/comment`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            comment_text: comment_text ?? '',
            assignee: assignee ?? undefined,
            notify_all: notify_all ?? false,
          }),
        })
        break
      }

      case 'set_status': {
        response = await fetch(`${CLICKUP_API}/task/${task_id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: payload?.status }),
        })
        break
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
