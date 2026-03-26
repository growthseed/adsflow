import https from 'https';

function query(sql) {
  const body = JSON.stringify({ query: sql });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/sdtyynzyfvxigwfmzayk/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sbp_088dada81187534fb347c5ae585e03eb519cad3e',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(data));
    });
    req.write(body);
    req.end();
  });
}

async function main() {
  // Drop and recreate policies
  console.log('Fixing RLS policies...');

  await query('DROP POLICY IF EXISTS "ad_accounts_policy" ON public.ad_accounts;');
  let r = await query(`CREATE POLICY "ad_accounts_policy" ON public.ad_accounts FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);`);
  console.log('Policy ad_accounts:', r);

  await query('DROP POLICY IF EXISTS "campaigns_cache_policy" ON public.campaigns_cache;');
  r = await query(`CREATE POLICY "campaigns_cache_policy" ON public.campaigns_cache FOR ALL USING (ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()::text));`);
  console.log('Policy campaigns_cache:', r);

  await query('DROP POLICY IF EXISTS "adset_insights_policy" ON public.adset_insights;');
  r = await query(`CREATE POLICY "adset_insights_policy" ON public.adset_insights FOR ALL USING (ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()::text));`);
  console.log('Policy adset_insights:', r);

  // Add missing columns to sync_logs
  console.log('\nAdding columns to sync_logs...');
  const alters = [
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS ad_account_id UUID;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS campaigns_synced INTEGER DEFAULT 0;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS adsets_synced INTEGER DEFAULT 0;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS ads_synced INTEGER DEFAULT 0;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS insights_synced INTEGER DEFAULT 0;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;',
    'ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;',
  ];
  for (const sql of alters) {
    r = await query(sql);
    console.log(sql.match(/IF NOT EXISTS (\w+)/)?.[1] || 'ALTER:', r);
  }

  // Verify
  console.log('\nVerifying tables...');
  const tables = ['ad_accounts', 'campaigns_cache', 'adset_insights'];
  for (const t of tables) {
    r = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${t}' ORDER BY ordinal_position;`);
    const cols = JSON.parse(r);
    console.log(`\n${t} (${cols.length} columns):`);
    cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  }

  console.log('\nDone!');
}

main().catch(console.error);
