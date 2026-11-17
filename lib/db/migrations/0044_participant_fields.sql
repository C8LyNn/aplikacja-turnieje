-- V5.4 — participant fields: organiser-defined fields (library or custom) and their values.
-- Additive and backward compatible:
--   * tournaments.participant_fields = NULL means "no extra fields" (the pre-V5.4 form: name, rank,
--     team, country, seed). The value is a versioned JSON object validated by the API
--     ({ "version": 1, "fields": [...] }); the database only guarantees it is an object of bounded size.
--   * players.custom_fields = NULL means "no values". Values never feed the ranking, results or seeding.
--   * No existing row is rewritten.
-- Rollback (values of extra fields are lost; export a Backup V3 first if any tournament uses them —
-- SELECT count(*) FROM public.tournaments WHERE participant_fields IS NOT NULL):
--   ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_custom_fields_shape;
--   ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_participant_fields_shape;
--   ALTER TABLE public.players DROP COLUMN IF EXISTS custom_fields;
--   ALTER TABLE public.tournaments DROP COLUMN IF EXISTS participant_fields;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS participant_fields jsonb;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS custom_fields jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournaments'::regclass AND conname = 'tournaments_participant_fields_shape') THEN
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_participant_fields_shape
      CHECK (participant_fields IS NULL OR (jsonb_typeof(participant_fields) = 'object' AND pg_column_size(participant_fields) <= 65536));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.players'::regclass AND conname = 'players_custom_fields_shape') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_custom_fields_shape
      CHECK (custom_fields IS NULL OR (jsonb_typeof(custom_fields) = 'object' AND pg_column_size(custom_fields) <= 32768));
  END IF;
END $$;
