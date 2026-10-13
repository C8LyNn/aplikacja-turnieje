-- Pack 14: forward-only persistence for two-step organizer approval.
-- Apply to a NONPRODUCTION database first, after migrations 0001-0029.
CREATE TABLE IF NOT EXISTS public.tournament_correction_operations (
  id text PRIMARY KEY,
  tournament_id integer NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  expected_revision integer NOT NULL,
  expected_completion_action_id integer NOT NULL,
  expected_stage_version_vector text NOT NULL,
  proposed_score1 integer NOT NULL,
  proposed_score2 integer NOT NULL,
  request_fingerprint text NOT NULL,
  approved_by text NOT NULL DEFAULT 'organizer',
  approved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  completed_at timestamptz,
  revert_action_id integer,
  reverted_match_revision integer,
  CONSTRAINT tournament_correction_operations_status_check
    CHECK (status IN ('approved', 'reverted_requires_resubmission')),
  CONSTRAINT tournament_correction_operations_receipt_consistency_check
    CHECK ((status = 'approved' AND completed_at IS NULL AND revert_action_id IS NULL AND reverted_match_revision IS NULL)
      OR (status = 'reverted_requires_resubmission' AND completed_at IS NOT NULL
        AND revert_action_id IS NOT NULL AND reverted_match_revision IS NOT NULL)),
  CONSTRAINT tournament_correction_operations_scores_check
    CHECK (proposed_score1 >= 0 AND proposed_score2 >= 0),
  CONSTRAINT tournament_correction_operations_revision_check
    CHECK (expected_revision > 0 AND expected_completion_action_id > 0),
  CONSTRAINT tournament_correction_operations_id_format_check
    CHECK (id ~* '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'),
  CONSTRAINT tournament_correction_operations_approval_actor_check
    CHECK (approved_by = 'organizer')
);
CREATE INDEX IF NOT EXISTS tournament_correction_operations_tournament_idx
  ON public.tournament_correction_operations(tournament_id, match_id);
