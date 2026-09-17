/**
 * ============================================
 * API SECURITY HELPERS — shared by all serverless routes
 * ============================================
 * Purpose: close three holes the external audit flagged:
 *   1. CORS `*` on proxies (any origin could hit them)
 *   2. No JWT auth on proxies (anyone with URL could invoke)
 *   3. No tenant scoping (authenticated user A could act on tenant B)
 *
 * Usage:
 *   export default async function handler(req, res) {
 *     if (!applyCors(req, res)) return
 *     if (req.method === 'OPTIONS') return res.status(204).end()
 *     const auth = await requireUserAuth(req, res)
 *     if (!auth) return
 *     const client = await requireClientMembership(auth, req.body.client_slug, res)
 *     if (!client) return
 *     // ...proceed
 *   }
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

// =============================================================
// ENV
// =============================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Comma-separated list of allowed origins. Required in production — if unset
 * we fall back to a safe default that matches the live deploy.
 *
 * Example: CORS_ALLOWED_ORIGINS="https://adsflow.efeito.digital,http://localhost:5173"
 */
const CORS_ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS ||
  'https://adsflow.efeito.digital,http://localhost:5173,http://localhost:5174,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// =============================================================
// CORS
// =============================================================

/**
 * Apply locked CORS headers. Returns `false` and sends a 403 if the Origin
 * isn't in the allowlist (except for same-origin / no-Origin requests, which
 * are legitimate and pass through). Always handles preflight.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string | undefined) || ''

  // Same-origin or server-to-server calls have no Origin header — allow.
  if (!origin) {
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return true
  }

  if (!CORS_ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed' })
    return false
  }

  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return true
}

// =============================================================
// AUTH
// =============================================================

export interface AuthContext {
  user: User
  /** Supabase client authenticated AS the end user (RLS applies). */
  userClient: SupabaseClient
  /** Supabase client using the service role (bypasses RLS — use with care). */
  serviceClient: SupabaseClient
  /** Global role from public.users. */
  globalRole: 'super_admin' | 'admin' | 'user' | null
}

/**
 * Verify the `Authorization: Bearer <supabase_jwt>` header and return an
 * AuthContext. Sends 401 if missing/invalid and returns null.
 */
export async function requireUserAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthContext | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Supabase not configured on the server' })
    return null
  }

  const header = (req.headers.authorization || '') as string
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization bearer token' })
    return null
  }

  // Client authenticated AS the user (respects RLS). Used for all reads
  // that should be scoped to what the user can actually see.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userErr } = await userClient.auth.getUser(token)
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }

  // Service role client for admin operations (membership checks bypass RLS
  // so a user can't hide their own membership row from themselves).
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Pull global role (for super_admin escape hatch)
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  return {
    user: userData.user,
    userClient,
    serviceClient,
    globalRole: (profile?.role as AuthContext['globalRole']) ?? 'user',
  }
}

// =============================================================
// TENANT SCOPE
// =============================================================

export interface ResolvedClient {
  id: string
  slug: string
  name: string
  role: 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer' | 'super_admin'
}

/**
 * Given an authenticated user and a `client_slug` from the request body,
 * verify the user is a member of that client. Sends 400/403 on failure and
 * returns null.
 *
 * super_admin users bypass the membership check (agency operators).
 */
export async function requireClientMembership(
  auth: AuthContext,
  clientSlug: string | undefined,
  res: VercelResponse,
): Promise<ResolvedClient | null> {
  if (!clientSlug || typeof clientSlug !== 'string') {
    res.status(400).json({ error: 'Missing client_slug in request body' })
    return null
  }

  const { data: client, error: clientErr } = await auth.serviceClient
    .from('clients')
    .select('id, slug, name')
    .eq('slug', clientSlug)
    .maybeSingle()

  if (clientErr || !client) {
    res.status(404).json({ error: `Unknown client: ${clientSlug}` })
    return null
  }

  // Super admins skip membership
  if (auth.globalRole === 'super_admin') {
    return { ...client, role: 'super_admin' }
  }

  const { data: membership, error: memberErr } = await auth.serviceClient
    .from('client_members')
    .select('role')
    .eq('user_id', auth.user.id)
    .eq('client_id', client.id)
    .maybeSingle()

  if (memberErr || !membership) {
    res.status(403).json({ error: 'Not a member of this client' })
    return null
  }

  return { ...client, role: membership.role as ResolvedClient['role'] }
}

// =============================================================
// METHOD GUARD
// =============================================================

export function allowMethods(
  req: VercelRequest,
  res: VercelResponse,
  methods: ReadonlyArray<'GET' | 'POST' | 'PUT' | 'DELETE'>,
): boolean {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return false
  }
  if (!methods.includes(req.method as 'GET' | 'POST' | 'PUT' | 'DELETE')) {
    res.setHeader('Allow', methods.join(', '))
    res.status(405).json({ error: 'Method not allowed' })
    return false
  }
  return true
}
