-- Remove the discontinued MOAI tenant and its legacy-only database objects.
-- This migration is intentionally idempotent and preserves migration history.

DO $$
DECLARE
  target_ids uuid[];
  pass_no integer;
  row_rec record;
BEGIN
  SELECT COALESCE(array_agg(id), '{}')
    INTO target_ids
    FROM public.clients
   WHERE slug = 'moai' OR lower(name) = 'moai';

  IF cardinality(target_ids) > 0 THEN
    -- Remove rows from every physical public relation that references clients.
    -- Multiple passes allow child relations to be cleared before their parents.
    FOR pass_no IN 1..6 LOOP
      FOR row_rec IN
        SELECT n.nspname AS schema_name, c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid
                              AND a.attname = 'client_id'
                              AND a.attnum > 0
                              AND NOT a.attisdropped
         WHERE n.nspname = 'public'
           AND c.relkind IN ('r', 'p')
           AND c.relname <> 'clients'
      LOOP
        BEGIN
          EXECUTE format(
            'DELETE FROM %I.%I WHERE client_id = ANY ($1)',
            row_rec.schema_name,
            row_rec.table_name
          ) USING target_ids;
        EXCEPTION WHEN undefined_column OR undefined_table THEN
          NULL;
        END;
      END LOOP;
    END LOOP;

    -- Clear legacy integrations that used client_slug instead of client_id.
    FOR row_rec IN
      SELECT n.nspname AS schema_name, c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
                            AND a.attname = 'client_slug'
                            AND a.attnum > 0
                            AND NOT a.attisdropped
       WHERE n.nspname = 'public'
         AND c.relkind IN ('r', 'p')
    LOOP
      BEGIN
        EXECUTE format(
          'DELETE FROM %I.%I WHERE client_slug = %L',
          row_rec.schema_name,
          row_rec.table_name,
          'moai'
        );
      EXCEPTION WHEN undefined_column OR undefined_table THEN
        NULL;
      END;
    END LOOP;

    UPDATE public.user_preferences
       SET default_client_id = NULL
     WHERE default_client_id = ANY (target_ids);

    DELETE FROM public.client_flows WHERE client_slug = 'moai';
    DELETE FROM public.clients WHERE id = ANY (target_ids);
  END IF;
END $$;

DO $$
DECLARE
  row_rec record;
BEGIN
  -- Drop legacy tables and views whose names belong exclusively to the old portal.
  FOR row_rec IN
    SELECT n.nspname AS schema_name, c.relname AS object_name, c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND ((c.relkind IN ('r', 'p') AND c.relname LIKE 'moai\_%')
         OR (c.relkind IN ('v', 'm') AND (c.relname LIKE 'moai\_%' OR c.relname LIKE 'vw\_moai\_%')))
  LOOP
    IF row_rec.relkind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', row_rec.schema_name, row_rec.object_name);
    ELSIF row_rec.relkind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', row_rec.schema_name, row_rec.object_name);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', row_rec.schema_name, row_rec.object_name);
    END IF;
  END LOOP;

  FOR row_rec IN
    SELECT p.oid::regprocedure AS object_name
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND (p.proname LIKE '%\_moai\_%' OR p.proname LIKE 'moai\_%' OR p.proname LIKE '\_moai\_%')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', row_rec.object_name);
  END LOOP;
END $$;
