-- =============================================================
-- 039_fix_client_members_user_fkey.sql
-- =============================================================
-- Corrige bug real de produção: membersService.list() (src/services/
-- clientsService.ts) embute o join `user:users!client_members_user_id_fkey`,
-- mas essa constraint aponta para auth.users, não para public.users — o
-- schema PostgREST exposto ao client. Resultado: 400 em toda tela que abre
-- o painel de membros de um cliente (ClientsPage.tsx > ClientDetailPanel).
--
-- Nenhuma migration deste repo criou client_members/users originalmente
-- (schema base foi montado direto no Studio antes da adoção de migrations
-- versionadas), daí a constraint ter ficado presa em auth.users.
--
-- Verificado em produção em 2026-08-17: as 31 linhas de client_members têm
-- user_id com correspondência em public.users — sem órfãos, FK segura de
-- adicionar.
--
-- Idempotente (IF NOT EXISTS via DO block).
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_members_user_id_public_fkey'
      AND conrelid = 'public.client_members'::regclass
  ) THEN
    ALTER TABLE public.client_members
      ADD CONSTRAINT client_members_user_id_public_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id);
  END IF;
END $$;
