-- =============================================================
-- 023 · Portal cliente V2 (Leva 2)
-- =============================================================
-- Tabelas:
--   · portal_config    — toggles por cliente (quais seções o gestor
--                        mostra/esconde no Portal do cliente)
--   · portal_comments  — thread de comentários por card no Portal
--
-- Segurança:
--   · RLS habilitado em ambas
--   · portal_config: admin da agência pode CRUD; viewer só SELECT
--   · portal_comments: qualquer membro do cliente pode INSERT/SELECT;
--     UPDATE/DELETE restritos ao autor ou admin
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- portal_config
-- -------------------------------------------------------------
create table if not exists public.portal_config (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  -- Seções do Portal V2 — toggle por seção. Default: tudo visível
  -- exceto detalhes técnicos (CPM/CTR nunca ligam — decisão de produto)
  show_summary      boolean not null default true,  -- Resumo IA em 1 frase
  show_kpis         boolean not null default true,  -- Strip KPIs fixa (Leads/CPL/ROAS)
  show_goals        boolean not null default true,  -- Rings de metas do mês
  show_timeline     boolean not null default true,  -- "Últimas 48h"
  show_next_call    boolean not null default true,  -- Próxima reunião
  show_files        boolean not null default false, -- Arquivos do cliente
  show_creatives    boolean not null default true,  -- Criativo destaque
  show_chat         boolean not null default true,  -- Bottom tab Chat
  -- Texto opcional de boas-vindas/contato (markdown simples)
  welcome_message   text,
  whatsapp_url      text,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id),
  unique (client_id)
);

create index if not exists portal_config_client_idx on public.portal_config(client_id);

alter table public.portal_config enable row level security;

drop policy if exists portal_config_read on public.portal_config;
create policy portal_config_read on public.portal_config
  for select
  using (
    -- Membros do cliente podem ler
    exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_config.client_id
        and cm.user_id = auth.uid()
    )
    -- Super admins também
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists portal_config_write on public.portal_config;
create policy portal_config_write on public.portal_config
  for all
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_config.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_config.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'admin')
    )
  );


-- -------------------------------------------------------------
-- portal_comments
-- -------------------------------------------------------------
create table if not exists public.portal_comments (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  -- Âncora: qual bloco/card do Portal o comentário referencia.
  -- Ex: 'goals', 'summary', 'timeline', 'next_call', 'creative:<id>'
  anchor       text not null,
  author_id    uuid references auth.users(id) on delete set null,
  author_name  text,    -- snapshot do nome (caso auth.users suma)
  body         text not null check (char_length(body) between 1 and 2000),
  -- Thread parent (para respostas). Null = comentário raiz
  parent_id    uuid references public.portal_comments(id) on delete cascade,
  -- Resolved/arquivado — gestor pode fechar thread
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists portal_comments_client_anchor_idx
  on public.portal_comments(client_id, anchor, created_at desc);
create index if not exists portal_comments_parent_idx
  on public.portal_comments(parent_id);

alter table public.portal_comments enable row level security;

drop policy if exists portal_comments_read on public.portal_comments;
create policy portal_comments_read on public.portal_comments
  for select
  using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_comments.client_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists portal_comments_insert on public.portal_comments;
create policy portal_comments_insert on public.portal_comments
  for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_comments.client_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists portal_comments_update on public.portal_comments;
create policy portal_comments_update on public.portal_comments
  for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_comments.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
  );

drop policy if exists portal_comments_delete on public.portal_comments;
create policy portal_comments_delete on public.portal_comments
  for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.client_members cm
      where cm.client_id = portal_comments.client_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'manager', 'admin')
    )
  );

-- Trigger utilitário: updated_at automático
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists portal_config_touch on public.portal_config;
create trigger portal_config_touch
  before update on public.portal_config
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists portal_comments_touch on public.portal_comments;
create trigger portal_comments_touch
  before update on public.portal_comments
  for each row execute function public.tg_touch_updated_at();

-- =============================================================
-- Realtime: habilitar replicação para portal_comments (threads em
-- tempo real conforme handoff V2). portal_config não precisa.
-- =============================================================
alter publication supabase_realtime add table public.portal_comments;
