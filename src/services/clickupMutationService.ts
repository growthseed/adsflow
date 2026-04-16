/**
 * ============================================
 * ClickUp Mutation Service — Sprint C
 * ============================================
 * Frontend service for ClickUp write operations.
 * All calls go through /api/clickup/mutate (server-side proxy)
 * so the API token is never exposed to the browser.
 */

import supabase from '@/lib/supabase'

const ENDPOINT = '/api/clickup/mutate'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function mutate(action: string, task_id: string, payload?: Record<string, unknown>) {
  const headers = await getAuthHeaders()
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, task_id, payload }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.err ?? data.error ?? 'ClickUp mutation failed')
  return data
}

export async function updateTaskStatus(taskId: string, status: string) {
  return mutate('set_status', taskId, { status })
}

export async function updateTask(taskId: string, updates: {
  name?: string
  description?: string
  status?: string
  priority?: number
  due_date?: number
  assignees?: { add?: number[]; rem?: number[] }
}) {
  return mutate('update_task', taskId, updates)
}

export async function addTaskComment(taskId: string, commentText: string, options?: {
  assignee?: number
  notifyAll?: boolean
}) {
  return mutate('add_comment', taskId, {
    comment_text: commentText,
    assignee: options?.assignee,
    notify_all: options?.notifyAll ?? false,
  })
}
