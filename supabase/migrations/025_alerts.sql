-- =============================================================
-- 025 · Metas & Alertas (Sprint 5b)
-- =============================================================
-- Tabelas:
--   · agency_goals       — metas por cliente (leads, ROAS, CPL, etc.)
--   · alert_rules        — regras configuráveis (when · what · how)
--   · alert_events       — disparos históricos (feed de "Últimos alertas")
--   · user_notif_prefs   — quiet hours e canais preferidos por user
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- agency_goals
-- -------------------------------------------------------------
create table if not exists public.agency_goals (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  metric         text not null check (metric in (
    'leads', 'cpl', 'roas', 'ctr', 'spend', 'cpm', 'conversions',
    'appointments', 'sales', 'custom'
  )),
  custom_metric_key text,   -- quando metric='custom', aponta pro metric_definitions
  label          text not null,
  target_value   numeric(20,4) not null,
  /** Direção: 'maximize' (bater pra cima) ou 'cap' (teto, bater pra baixo) */
  direction      text not null default 'maximize' check (direction in ('maximize', 'cap')),
  unit           text not null default 'count' check (unit in ('count', 'currency', 'percent', 'ratio')),
  /** Horizonte: 'weekly' · 'monthly' · 'quarterly' · 'yearly' · 'custom' */
  horizon        text not null default 'monthly',
  period_start   date not null,
  period_end     date not null,
  active         boolean not null default true,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists agency_goals_client_active_idx
  on public.agency_goals(client_id, active, period_end desc);

alter table public.agency_goals enable row level security;

drop policy if exists agency_goals_read on public.agency_goals;
create policy agency_goals_read on public.agency_goals
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = agency_goals.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists agency_goals_write on public.agency_goals;
create policy agency_goals_write on public.agency_goals
  for all
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = agency_goals.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (true);

-- -------------------------------------------------------------
-- alert_rules
-- -------------------------------------------------------------
create table if not exists public.alert_rules (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  /** Escopo: 'global' (agência), 'client' (1 cliente) ou 'segment' (lista) */
  scope_type     text not null default 'global'
                 check (scope_type in ('global', 'client', 'segment')),
  /** Ids específicos quando scope_type != 'global' */
  target_ids     uuid[] not null default array[]::uuid[],
  /** Métrica observada */
  metric         text not null check (metric in (
    'cpl','roas','ctr','leads','spend','cpm','conversions','freeze'
  )),
  /** Operador: gt / lt / change_gt / change_lt */
  operator       text not null check (operator in ('gt','lt','change_gt','change_lt')),
  /** Valor de threshold (significado depende da unit) */
  value          numeric(20,4) not null,
  /** Unidade: 'percent_of_goal' · 'absolute' · 'percent_change' */
  unit           text not null default 'percent_change'
                 check (unit in ('percent_of_goal','absolute','percent_change')),
  /** Janela de persistência: '1d' · '3d' · '7d' — por quanto tempo a
   *  condição precisa se manter para disparar */
  window         text not null default '1d' check (window in ('1d','3d','7d')),
  /** Canais: subset de {inapp, whatsapp, email, slack} */
  channels       text[] not null default array['inapp']::text[],
  /** User IDs destinatários (se vazio, dispara para todos os admins do escopo) */
  recipients     uuid[] not null default array[]::uuid[],
  /** Cooldown entre disparos da mesma regra+cliente */
  cooldown       text not null default '24h',
  active         boolean not null default true,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists alert_rules_active_idx on public.alert_rules(active);
create index if not exists alert_rules_scope_idx on public.alert_rules(scope_type);

alter table public.alert_rules enable row level security;

drop policy if exists alert_rules_read on public.alert_rules;
create policy alert_rules_read on public.alert_rules
  for select
  using (
    exists (
      select 1 from public.users u where u.id = auth.uid()
    )
  );

drop policy if exists alert_rules_write on public.alert_rules;
create policy alert_rules_write on public.alert_rules
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (true);

-- -------------------------------------------------------------
-- alert_events — histórico de disparos (feed "Últimos alertas")
-- -------------------------------------------------------------
create table if not exists public.alert_events (
  id             uuid primary key default gen_random_uuid(),
  rule_id        uuid references public.alert_rules(id) on delete set null,
  client_id      uuid references public.clients(id) on delete cascade,
  severity       text not null default 'info' check (severity in ('critical','warning','info')),
  title          text not null,
  body           text,
  /** Snapshot do contexto que disparou (valor observado, delta, etc.) */
  observed_value numeric(20,4),
  observed_meta  jsonb,
  /** Canais em que foi de fato enviado */
  delivered_to   text[] not null default array[]::text[],
  /** Agrupamento anti-spam: se 5+ eventos para mesmo client_id em 10min,
   *  ganham o mesmo batch_id e disparam 1 notificação */
  batch_id       uuid,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists alert_events_client_idx
  on public.alert_events(client_id, created_at desc);
create index if not exists alert_events_severity_idx
  on public.alert_events(severity, created_at desc);

alter table public.alert_events enable row level security;

drop policy if exists alert_events_read on public.alert_events;
create policy alert_events_read on public.alert_events
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = alert_events.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- user_notif_prefs — quiet hours + canais por usuário
-- -------------------------------------------------------------
create table if not exists public.user_notif_prefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  whatsapp_enabled boolean not null default false,
  whatsapp_number  text,
  email_enabled    boolean not null default true,
  slack_user_id    text,
  slack_enabled    boolean not null default false,
  quiet_from       time default '22:00',
  quiet_to         time default '08:00',
  quiet_tz         text default 'America/Sao_Paulo',
  updated_at       timestamptz not null default now()
);

alter table public.user_notif_prefs enable row level security;

drop policy if exists user_notif_prefs_self on public.user_notif_prefs;
create policy user_notif_prefs_self on public.user_notif_prefs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -------------------------------------------------------------
-- triggers
-- -------------------------------------------------------------
drop trigger if exists agency_goals_touch on public.agency_goals;
create trigger agency_goals_touch
  before update on public.agency_goals
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists alert_rules_touch on public.alert_rules;
create trigger alert_rules_touch
  before update on public.alert_rules
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists user_notif_prefs_touch on public.user_notif_prefs;
create trigger user_notif_prefs_touch
  before update on public.user_notif_prefs
  for each row execute function public.tg_touch_updated_at();

-- Realtime pra feed in-app
alter publication supabase_realtime add table public.alert_events;
