BEGIN;
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS presentation_settings JSONB;
COMMENT ON COLUMN public.tournaments.presentation_settings IS
  'Organizer presentation preferences (theme, display options). Not competitive rules — editable at any tournament status.';
COMMIT;
