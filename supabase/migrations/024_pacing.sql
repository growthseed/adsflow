-- =============================================================
-- 024 · Pacing · orçamento mensal + regras de auto-pause (Sprint 5a)
-- =============================================================
-- Tabelas novas:
--   · client_budgets       — orçamento mensal configurado por cliente
--   · pacing_rules         — config de auto-pause (opt-in, thresholds)
--   · pacing_audit_log     — toda ação de pausa/retomada (auditável)
--
-- IMPORTANT: o cron que dispara o auto-pause é uma Edge Function
-- chamada por pg_cron de hora em hora. Essa migration cria apenas
-- o schema; o scheduling vive em supabase/functions/pacing-tick/.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- client_budgets — teto mensal por cliente (multi-platform)
-- -------------------------------------------------------------
create table if not exists public.client_budgets (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  -- Período de referência (month-first): 2026-04-01
  period_start date not null,
  -- Valor em centavos pra evitar float; sempre BRL por ora
  amount_cents bigint not null check (amount_cents >= 0),
  currency     char(3) not null default 'BRL',
  notes        text,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (client_id, period_start)
);

create index if not exists client_budgets_client_idx
  on public.client_budgets(client_id, period_start desc);

alter table public.client_budgets enable row level security;

drop policy if exists client_budgets_read on public.client_budgets;
create policy client_budgets_read on public.client_budgets
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = client_budgets.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists client_budgets_write on public.client_budgets;
create policy client_budgets_write on public.client_budgets
  for all
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = client_budgets.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (true);

-- -------------------------------------------------------------
-- pacing_rules — config de auto-pause (opt-in por cliente)
-- -------------------------------------------------------------
create table if not exists public.pacing_rules (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.clients(id) on delete cascade,
  active               boolean not null default false,
  -- Threshold do overshoot projetado que dispara pausa (em percentual)
  -- Default 5 == se projeção linear exceder teto em mais de 5%, pausa
  threshold_pct        numeric(5,2) not null default 5.00,
  -- Janela de grace em minutos: notifica X min antes de pausar de fato
  grace_window_minutes int not null default 15,
  -- Critério de retomada: 'next_cycle' ou 'manual'
  resume_policy        text not null default 'next_cycle'
                       check (resume_policy in ('next_cycle', 'manual')),
  -- Períodos suspensos (ex.: cliente em férias). Array de tstzranges.
  suspended_ranges     tstzrange[] not null default array[]::tstzrange[],
  -- Canais de notificação antes de pausar
  notify_whatsapp      boolean not null default true,
  notify_email         boolean not null default true,
  notify_inapp         boolean not null default true,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references auth.users(id),
  unique (client_id)
);

alter table public.pacing_rules enable row level security;

drop policy if exists pacing_rules_read on public.pacing_rules;
create policy pacing_rules_read on public.pacing_rules
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = pacing_rules.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists pacing_rules_write on public.pacing_rules;
create policy pacing_rules_write on public.pacing_rules
  for all
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = pacing_rules.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (true);

-- -------------------------------------------------------------
-- pacing_audit_log — append-only log de toda ação de pausa/retomada
-- -------------------------------------------------------------
create table if not exists public.pacing_audit_log (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  -- Campaign IDs afetadas (platform-specific ids como string)
  campaign_ids          text[] not null default array[]::text[],
  platform              text not null check (platform in ('meta_ads', 'google_ads', 'mixed')),
  -- 'paused' · 'resumed' · 'skipped' (regra disparou mas cancelada)
  action                text not null check (action in ('paused', 'resumed', 'skipped', 'notified')),
  reason                text,
  -- Estado no momento da ação (snapshot para auditoria)
  budget_cents          bigint,
  spend_cents           bigint,
  projected_cents       bigint,
  projected_overspend_pct numeric(5,2),
  -- 'auto' (cron) ou 'user' (manual do gestor)
  triggered_by          text not null check (triggered_by in ('auto', 'user')),
  triggered_by_user_id  uuid references auth.users(id),
  -- Se pausa foi reversível manualmente até X data
  reversible_until      timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists pacing_audit_client_idx
  on public.pacing_audit_log(client_id, created_at desc);
create index if not exists pacing_audit_action_idx
  on public.pacing_audit_log(action, created_at desc);

alter table public.pacing_audit_log enable row level security;

drop policy if exists pacing_audit_read on public.pacing_audit_log;
create policy pacing_audit_read on public.pacing_audit_log
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = pacing_audit_log.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

-- Insert via service role apenas (cron + API endpoint) — nenhum
-- policy de INSERT via usuário comum pra manter o log append-only.

-- -------------------------------------------------------------
-- triggers
-- -------------------------------------------------------------
drop trigger if exists client_budgets_touch on public.client_budgets;
create trigger client_budgets_touch
  before update on public.client_budgets
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists pacing_rules_touch on public.pacing_rules;
create trigger pacing_rules_touch
  before update on public.pacing_rules
  for each row execute function public.tg_touch_updated_at();
