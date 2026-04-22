-- =============================================================
-- 027 · AdsFlow AI (Sprint 5d)
-- =============================================================
-- Tabelas:
--   · ai_conversations — uma conversa (contexto: client, view, period)
--   · ai_messages      — mensagens da conversa (user + assistant)
--
-- Roteamento de provedor: definido em tempo de request pelo backend
-- com base em `clients.service_tier` (enterprise → Claude, standard
-- → OpenAI). A escolha fica registrada em ai_messages.provider.
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  /** Contexto inicial (view, periodo, escopo) registrado no 1º send */
  context     jsonb not null default '{}'::jsonb,
  title       text,
  /** Summary curto gerado pela IA pra aparecer no sidebar */
  summary     text,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ai_conversations_user_idx
  on public.ai_conversations(user_id, updated_at desc);

alter table public.ai_conversations enable row level security;

drop policy if exists ai_conversations_self on public.ai_conversations;
create policy ai_conversations_self on public.ai_conversations
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content         text not null,
  /** Provedor usado — 'claude' ou 'openai' (null em mensagens de user) */
  provider        text check (provider in ('claude', 'openai')),
  model           text,
  /** Token usage pra telemetria */
  prompt_tokens      int,
  completion_tokens  int,
  /** Anexos estruturados (citações, dados, cards sugeridos) */
  attachments     jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists ai_messages_conv_idx
  on public.ai_messages(conversation_id, created_at);

alter table public.ai_messages enable row level security;

drop policy if exists ai_messages_self on public.ai_messages;
create policy ai_messages_self on public.ai_messages
  for all
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop trigger if exists ai_conversations_touch on public.ai_conversations;
create trigger ai_conversations_touch
  before update on public.ai_conversations
  for each row execute function public.tg_touch_updated_at();
