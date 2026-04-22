-- =============================================================
-- 026 · Report builder (Sprint 5c)
-- =============================================================
-- Tabelas:
--   · report_documents   — rascunhos e finais (com blocks jsonb)
--   · report_templates   — templates reutilizáveis (oficiais + pessoais)
--   · report_document_schedules   — agendamentos recorrentes (estende 006 se existir)
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.report_documents (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.clients(id) on delete cascade,
  name          text not null,
  status        text not null default 'draft'
                check (status in ('draft', 'final', 'scheduled', 'archived')),
  /** Array de blocos — ordem importa */
  blocks        jsonb not null default '[]'::jsonb,
  /** Configuração global do doc (cores, logo override, etc.) */
  config        jsonb not null default '{}'::jsonb,
  template_id   uuid,
  created_by    uuid references auth.users(id),
  last_edited_by uuid references auth.users(id),
  /** URL assinada do PDF gerado mais recente */
  last_pdf_url  text,
  last_pdf_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists report_documents_client_idx
  on public.report_documents(client_id, updated_at desc);
create index if not exists report_documents_status_idx
  on public.report_documents(status);

alter table public.report_documents enable row level security;

drop policy if exists report_documents_read on public.report_documents;
create policy report_documents_read on public.report_documents
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = report_documents.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin','admin')
    )
  );

drop policy if exists report_documents_write on public.report_documents;
create policy report_documents_write on public.report_documents
  for all
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.client_members cm
      where cm.client_id = report_documents.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin','admin')
    )
  )
  with check (true);

create table if not exists public.report_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subtitle      text,
  /** Oficial (Efeito Digital) vs pessoal do usuário */
  source        text not null default 'official' check (source in ('official','personal')),
  /** Categoria visível no header do thumb */
  category      text,
  /** Cor do thumb (gradient) */
  thumb_style   text default 'g1',
  blocks        jsonb not null default '[]'::jsonb,
  config        jsonb not null default '{}'::jsonb,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.report_templates enable row level security;

drop policy if exists report_templates_read on public.report_templates;
create policy report_templates_read on public.report_templates
  for select using (
    source = 'official'
    or created_by = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin','admin'))
  );

drop policy if exists report_templates_write on public.report_templates;
create policy report_templates_write on public.report_templates
  for all
  using (
    created_by = auth.uid()
    or (source = 'official' and exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin','admin')
    ))
  )
  with check (true);

-- report_document_schedules — agendamentos do report builder V2
-- (legacy: public.report_schedules é do saved_reports — não mexer)
create table if not exists public.report_document_schedules (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references public.report_documents(id) on delete cascade,
  frequency       text not null check (frequency in ('daily','weekly','monthly','quarterly')),
  day_of_week     int check (day_of_week between 0 and 6),
  day_of_month    int check (day_of_month between 1 and 31),
  hour_local      int not null default 8 check (hour_local between 0 and 23),
  timezone        text not null default 'America/Sao_Paulo',
  recipients      text[] not null default array[]::text[],
  active          boolean not null default true,
  last_run_at     timestamptz,
  next_run_at     timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists report_document_schedules_next_run_idx
  on public.report_document_schedules(next_run_at) where active = true;

alter table public.report_document_schedules enable row level security;

drop policy if exists report_document_schedules_all on public.report_document_schedules;
create policy report_document_schedules_all on public.report_document_schedules
  for all
  using (
    exists (
      select 1 from public.report_documents d
      left join public.client_members cm
        on cm.client_id = d.client_id and cm.user_id = auth.uid()
      where d.id = report_document_schedules.report_id
        and (cm.role in ('owner','manager','admin') or d.created_by = auth.uid())
    )
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin','admin')
    )
  )
  with check (true);

drop trigger if exists report_documents_touch on public.report_documents;
create trigger report_documents_touch
  before update on public.report_documents
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists report_templates_touch on public.report_templates;
create trigger report_templates_touch
  before update on public.report_templates
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists report_document_schedules_touch on public.report_document_schedules;
create trigger report_document_schedules_touch
  before update on public.report_document_schedules
  for each row execute function public.tg_touch_updated_at();

-- -------------------------------------------------------------
-- Seeds dos 5 templates oficiais
-- -------------------------------------------------------------
insert into public.report_templates (name, subtitle, source, category, thumb_style, blocks)
values
  ('Relatório executivo', '1 página · 3 seções · 6 KPIs', 'official', 'Mensal', 'g1',
   '[{"id":"h","type":"header","props":{"title":"Relatório executivo"}},{"id":"k","type":"kpi-strip","props":{"kpis":["leads","cpl","roas","spend"]}},{"id":"c","type":"line-chart","props":{"metric":"leads"}},{"id":"p","type":"paragraph-ai","props":{}}]'::jsonb),
  ('Pulso semanal', '5 KPIs · wins da semana', 'official', 'Semanal', 'g2',
   '[{"id":"h","type":"header","props":{"title":"Pulso da semana"}},{"id":"k","type":"kpi-strip","props":{"kpis":["leads","cpl","roas","ctr","spend"]}},{"id":"w","type":"wins-list","props":{}},{"id":"c","type":"line-chart","props":{"metric":"leads","period":"7d"}}]'::jsonb),
  ('QBR · trimestral', '20+ páginas · YoY · Cohort', 'official', 'Trimestre', 'g3',
   '[{"id":"h","type":"header","props":{"title":"Quarterly Business Review"}},{"id":"k","type":"kpi-strip","props":{"kpis":["leads","cpl","roas"]}},{"id":"y","type":"yoy","props":{}},{"id":"co","type":"cohort","props":{}},{"id":"lt","type":"ltv-cac","props":{}}]'::jsonb),
  ('Deep-dive por canal', 'Criativos · públicos · funil', 'official', 'Performance', 'g4',
   '[{"id":"h","type":"header","props":{"title":"Deep-dive Meta Ads"}},{"id":"f","type":"funnel","props":{}},{"id":"hm","type":"heatmap","props":{}},{"id":"c","type":"bar-chart","props":{}}]'::jsonb),
  ('Pacing e budget', 'Ritmo de gasto + projeção', 'official', 'Operacional', 'g5',
   '[{"id":"h","type":"header","props":{"title":"Budget pacing"}},{"id":"p","type":"pacing-chart","props":{}},{"id":"t","type":"paragraph-ai","props":{}}]'::jsonb)
on conflict do nothing;
