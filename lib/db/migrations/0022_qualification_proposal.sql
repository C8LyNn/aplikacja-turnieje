-- Migration 0022: qualification proposals and materialized output basket contents (Phase 2).
--
-- Adds three tables that implement the Qualification Proposal flow:
--
--   qualification_proposals        — one-per-stage proposal header (pending → approved).
--                                    Pending proposals can be superseded by re-generation;
--                                    approved proposals are locked until a future Phase 3
--                                    correction flow is implemented.
--
--   qualification_proposal_entries — per-player ranked entries belonging to a proposal.
--                                    Each player appears at most once per proposal.
--
--   stage_basket_output_players    — approved runtime snapshot: materialized output basket
--                                    membership written atomically at approval time.
--                                    Semantically distinct from stage_basket_participants
--                                    (which covers input-basket draw assignments).
--
-- Phase 2 is additive only:
--   • stageParticipants is NOT modified.
--   • completeStage is NOT modified.
--   • No basket routes are executed.
--   • Legacy tournaments without explicit basket configurations are unaffected.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730038);
-- migration-runner-strip-end

DO $prerequisites$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_baskets'::regclass
      AND conname = 'stage_baskets_pkey'
      AND contype = 'p'
      AND convalidated
  ) THEN
    RAISE EXCEPTION '0022 prerequisite failed: stage_baskets_pkey must exist (migration 0021 must precede 0022)';
  END IF;
END;
$prerequisites$;

-- ─── qualification_proposals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.qualification_proposals (
  id                       serial    NOT NULL,
  tournament_id            integer   NOT NULL,
  stage_id                 integer   NOT NULL,
  revision                 integer   NOT NULL DEFAULT 1,
  status                   text      NOT NULL DEFAULT 'pending',
  ranking_fingerprint      text      NOT NULL,
  created_at               timestamp NOT NULL DEFAULT now(),
  approved_at              timestamp,
  approved_by_actor_type   text,
  approved_by_actor_nick   text,

  CONSTRAINT qualification_proposals_pkey
    PRIMARY KEY (id),

  -- One active proposal per (tournament, stage) at any time.
  CONSTRAINT qualification_proposals_tournament_stage_unique
    UNIQUE (tournament_id, stage_id),

  CONSTRAINT qualification_proposals_revision_positive
    CHECK (revision > 0),

  CONSTRAINT qualification_proposals_status_values
    CHECK (status IN ('pending', 'approved')),

  CONSTRAINT qualification_proposals_fingerprint_nonempty
    CHECK (length(ranking_fingerprint) > 0),

  -- Approval metadata must be fully present or fully absent.
  CONSTRAINT qualification_proposals_approval_consistency
    CHECK (
      (status = 'approved'
        AND approved_at IS NOT NULL
        AND approved_by_actor_type IS NOT NULL
        AND approved_by_actor_nick IS NOT NULL)
      OR
      (status = 'pending'
        AND approved_at IS NULL
        AND approved_by_actor_type IS NULL
        AND approved_by_actor_nick IS NULL)
    ),

  CONSTRAINT qualification_proposals_stage_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages (tournament_id, id)
    ON DELETE CASCADE
);

-- ─── qualification_proposal_entries ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.qualification_proposal_entries (
  id               serial  NOT NULL,
  proposal_id      integer NOT NULL,
  tournament_id    integer NOT NULL,
  stage_id         integer NOT NULL,
  basket_id        text    NOT NULL,
  player_id        integer NOT NULL,
  placement_rank   integer NOT NULL,   -- global stage rank (1 = best)
  basket_position  integer NOT NULL,   -- 1-based position within the target basket

  CONSTRAINT qualification_proposal_entries_pkey
    PRIMARY KEY (id),

  -- Each player may appear in at most one basket per proposal.
  CONSTRAINT qualification_proposal_entries_proposal_player_unique
    UNIQUE (proposal_id, player_id),

  CONSTRAINT qualification_proposal_entries_placement_rank_positive
    CHECK (placement_rank > 0),

  CONSTRAINT qualification_proposal_entries_basket_position_positive
    CHECK (basket_position > 0),

  CONSTRAINT qualification_proposal_entries_proposal_fk
    FOREIGN KEY (proposal_id)
    REFERENCES public.qualification_proposals (id)
    ON DELETE CASCADE,

  CONSTRAINT qualification_proposal_entries_tournament_stage_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages (tournament_id, id)
    ON DELETE CASCADE,

  CONSTRAINT qualification_proposal_entries_player_fk
    FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players (tournament_id, id)
    ON DELETE CASCADE
);

-- ─── stage_basket_output_players ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stage_basket_output_players (
  id               serial    NOT NULL,
  tournament_id    integer   NOT NULL,
  stage_id         integer   NOT NULL,
  basket_id        text      NOT NULL,
  player_id        integer   NOT NULL,
  proposal_id      integer   NOT NULL,
  final_rank       integer   NOT NULL,
  materialized_at  timestamp NOT NULL DEFAULT now(),

  CONSTRAINT stage_basket_output_players_pkey
    PRIMARY KEY (id),

  -- Each player may be assigned to at most one output basket per stage.
  CONSTRAINT stage_basket_output_players_stage_player_unique
    UNIQUE (tournament_id, stage_id, player_id),

  CONSTRAINT stage_basket_output_players_final_rank_positive
    CHECK (final_rank > 0),

  -- RESTRICT prevents deleting the proposal that backs live output rows.
  CONSTRAINT stage_basket_output_players_proposal_fk
    FOREIGN KEY (proposal_id)
    REFERENCES public.qualification_proposals (id)
    ON DELETE RESTRICT,

  CONSTRAINT stage_basket_output_players_tournament_stage_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages (tournament_id, id)
    ON DELETE CASCADE,

  CONSTRAINT stage_basket_output_players_player_fk
    FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players (tournament_id, id)
    ON DELETE CASCADE
);

-- ─── Postcondition ──────────────────────────────────────────────────────────

DO $postcondition$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qualification_proposals'
  ) THEN
    RAISE EXCEPTION '0022 postcondition failed: qualification_proposals not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qualification_proposal_entries'
  ) THEN
    RAISE EXCEPTION '0022 postcondition failed: qualification_proposal_entries not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stage_basket_output_players'
  ) THEN
    RAISE EXCEPTION '0022 postcondition failed: stage_basket_output_players not created';
  END IF;
END;
$postcondition$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
