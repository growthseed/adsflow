/**
 * ============================================
 * Client Flows Adapter — AdFlow v4 Sprint 5
 * ============================================
 * CRUD for the Planner module's flows, scoped per client.
 * Data lives in public.client_flows (Supabase).
 *
 * All writes go through supabase-js (RLS checks apply — user
 * must be authenticated). The public share endpoint uses a
 * SECURITY DEFINER RPC so read-only clients don't need accounts.
 * ============================================
 */

import type { Node, Edge, Viewport } from 'reactflow'
import supabase from '@/lib/supabase'

// =============================================================
// TYPES
// =============================================================

export interface ClientFlow {
  id: string
  client_slug: string
  user_id: string | null
  name: string
  description: string | null
  template_id: string | null
  version: number
  is_active: boolean
  share_token: string | null
  share_enabled: boolean
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport | null
  created_at: string
  updated_at: string
}

export interface CreateFlowInput {
  client_slug: string
  name: string
  description?: string
  template_id?: string
  nodes: Node[]
  edges: Edge[]
  viewport?: Viewport
}

export interface UpdateFlowInput {
  id: string
  name?: string
  description?: string
  nodes?: Node[]
  edges?: Edge[]
  viewport?: Viewport
  share_enabled?: boolean
}

// =============================================================
// CRUD
// =============================================================

/** List all active flows for a client */
export async function listClientFlows(clientSlug: string): Promise<ClientFlow[]> {
  const { data, error } = await supabase
    .from('client_flows')
    .select('*')
    .eq('client_slug', clientSlug)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[clientFlows] list failed:', error.message)
    return []
  }
  return (data || []) as ClientFlow[]
}

/** Get a single flow by id */
export async function getFlowById(id: string): Promise<ClientFlow | null> {
  const { data, error } = await supabase
    .from('client_flows')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[clientFlows] get failed:', error.message)
    return null
  }
  return data as ClientFlow | null
}

/** Create a new flow (optionally from a template) */
export async function createFlow(input: CreateFlowInput): Promise<ClientFlow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('client_flows')
    .insert({
      client_slug: input.client_slug,
      user_id: user?.id || null,
      name: input.name,
      description: input.description || null,
      template_id: input.template_id || null,
      version: 1,
      is_active: true,
      nodes: input.nodes,
      edges: input.edges,
      viewport: input.viewport || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[clientFlows] create failed:', error.message)
    return null
  }
  return data as ClientFlow
}

/** Update an existing flow (bumps version + updated_at) */
export async function updateFlow(input: UpdateFlowInput): Promise<ClientFlow | null> {
  // Fetch current version first
  const current = await getFlowById(input.id)
  if (!current) return null

  const patch: Record<string, unknown> = {
    version: current.version + 1,
    updated_at: new Date().toISOString(),
  }
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.nodes !== undefined) patch.nodes = input.nodes
  if (input.edges !== undefined) patch.edges = input.edges
  if (input.viewport !== undefined) patch.viewport = input.viewport
  if (input.share_enabled !== undefined) patch.share_enabled = input.share_enabled

  const { data, error } = await supabase
    .from('client_flows')
    .update(patch)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    console.error('[clientFlows] update failed:', error.message, error.details, error.hint, error.code)
    return null
  }
  if (!data) {
    console.error('[clientFlows] update returned no data — likely RLS denied the write')
    return null
  }
  return data as ClientFlow
}

/** Soft-delete a flow (is_active = false) */
export async function deleteFlow(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('client_flows')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[clientFlows] delete failed:', error.message)
    return false
  }
  return true
}

// =============================================================
// PUBLIC SHARING
// =============================================================

/** Generate a random share token (base36) */
function generateShareToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}

/** Enable sharing on a flow, generating a token if missing */
export async function enableShare(id: string): Promise<string | null> {
  const current = await getFlowById(id)
  if (!current) return null

  const token = current.share_token || generateShareToken()

  const { data, error } = await supabase
    .from('client_flows')
    .update({
      share_token: token,
      share_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[clientFlows] enableShare failed:', error.message)
    return null
  }
  return (data as ClientFlow).share_token
}

/** Disable sharing (keeps token but closes access) */
export async function disableShare(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('client_flows')
    .update({ share_enabled: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

// =============================================================
// VERSIONING
// =============================================================

export interface FlowVersion {
  id: string
  flow_id: string
  version: number
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport | null
  name: string | null
  description: string | null
  snapshot_reason: string
  created_by: string | null
  created_at: string
}

/** List all historical versions of a flow (most recent first) */
export async function listFlowVersions(flowId: string): Promise<FlowVersion[]> {
  const { data, error } = await supabase
    .from('client_flow_versions')
    .select('*')
    .eq('flow_id', flowId)
    .order('version', { ascending: false })

  if (error) {
    console.error('[clientFlows] listFlowVersions failed:', error.message)
    return []
  }
  return (data || []) as FlowVersion[]
}

/** Rollback a flow to a specific historical version.
 *  Keeps version numbering monotonic: current becomes new version,
 *  rolled-back data is inserted as the new "live" state. */
export async function rollbackToVersion(
  flowId: string,
  versionId: string,
): Promise<ClientFlow | null> {
  // Load the target version
  const { data: target, error: targetErr } = await supabase
    .from('client_flow_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (targetErr || !target) {
    console.error('[clientFlows] rollback target not found:', targetErr?.message)
    return null
  }

  const v = target as FlowVersion

  // Update the live flow — the trigger will auto-snapshot the current state
  // into client_flow_versions before this update takes effect.
  return updateFlow({
    id: flowId,
    name: v.name || undefined,
    description: v.description || undefined,
    nodes: v.nodes,
    edges: v.edges,
    viewport: v.viewport || undefined,
  })
}

/** Fetch a shared flow via public RPC (no auth required) */
export async function getSharedFlow(token: string): Promise<{
  id: string
  client_slug: string
  name: string
  description: string | null
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport | null
  updated_at: string
} | null> {
  const { data, error } = await supabase.rpc('get_flow_by_share_token', { token })

  if (error) {
    console.error('[clientFlows] getSharedFlow failed:', error.message)
    return null
  }

  // RPC returns array of rows; take first
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return row as {
    id: string
    client_slug: string
    name: string
    description: string | null
    nodes: Node[]
    edges: Edge[]
    viewport: Viewport | null
    updated_at: string
  }
}
