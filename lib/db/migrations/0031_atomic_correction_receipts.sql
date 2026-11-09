-- Pack 15: receipt fields for atomic result replacement, forward-only after 0030.
-- Apply only on an isolated TEST database after reviewing backups.
BEGIN;
ALTER TABLE public.tournament_correction_operations
  ADD COLUMN IF NOT EXISTS completion_action_id integer,
  ADD COLUMN IF NOT EXISTS corrected_match_revision integer;
ALTER TABLE public.tournament_correction_operations
  DROP CONSTRAINT IF EXISTS tournament_correction_operations_status_check,
  DROP CONSTRAINT IF EXISTS tournament_correction_operations_receipt_consistency_check;
ALTER TABLE public.tournament_correction_operations
  ADD CONSTRAINT tournament_correction_operations_status_check
    CHECK(status IN ('approved','reverted_requires_resubmission','corrected')),
  ADD CONSTRAINT tournament_correction_operations_receipt_consistency_check
    CHECK((status='approved' AND completed_at IS NULL AND revert_action_id IS NULL
      AND reverted_match_revision IS NULL AND completion_action_id IS NULL AND corrected_match_revision IS NULL)
    OR (status='reverted_requires_resubmission' AND completed_at IS NOT NULL
      AND revert_action_id IS NOT NULL AND reverted_match_revision IS NOT NULL
      AND completion_action_id IS NULL AND corrected_match_revision IS NULL)
    OR (status='corrected' AND completed_at IS NOT NULL AND revert_action_id IS NOT NULL
      AND reverted_match_revision IS NOT NULL AND completion_action_id IS NOT NULL
      AND corrected_match_revision IS NOT NULL));
COMMIT;
