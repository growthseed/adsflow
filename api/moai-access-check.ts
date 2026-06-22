import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body ?? {}
  if (!userId || typeof userId !== 'string') return res.json({ role: null })

  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  )

  const { data } = await supabase
    .from('moai_user_access')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  return res.json({ role: data?.role ?? null })
}
