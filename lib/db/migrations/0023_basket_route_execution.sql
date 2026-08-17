-- Migration 0023: basket route executions and routed arrival entries (Phase 3).
--
-- Adds two tables that implement the Route Execution flow:
--
--   stage_basket_route_executions  — one immutable execution snapshot per route.
--                                    Created when an organizer materialises the route.
--                                    At most one execution per route (UNIQUE route_id).
--
--   stage_basket_route_entries     — per-player routed arrival records.
--                                    Each player may arrive in a target stage at most once
--                                    across all routes (UNIQUE target_stage + player).
--
-- Phase 3 is additive only:
--   • stage_participants is NOT modified.
--   • completeStage is NOT modified.
--   • stage_basket_participants (direct assignments) is NOT modified.
--   • qualification_proposals are NOT modified.
--   • Legacy tournaments without explicit basket configurations are unaffected.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730039);
-- migration-runner-strip-end

DO $prerequisites$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stage_basket_output_players'
  ) THEN
    RAISE EXCEPTION '0023 prerequisite failed: stage_basket_output_players must exist (migration 0022 must precede 0023)';
  END IF;
END;
$prerequisites$;

-- ─── stage_basket_route_executions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stage_basket_route_executions (
  id                       serial    NOT NULL,
  tournament_id            integer   NOT NULL,
  route_id                 text      NOT NULL,
  source_stage_id          integer   NOT NULL,
  source_basket_id         text      NOT NULL,
  target_stage_id          integer   NOT NULL,
  target_basket_id         text      NOT NULL,
  source_proposal_id       integer   NOT NULL,
  source_proposal_revision integer   NOT NULL,
  executed_at              timestamp NOT NULL DEFAULT now(),
  actor_type               text      NOT NULL,
  actor_nick               text      NOT NULL,

  CONSTRAINT stage_basket_route_executions_pkey
    PRIMARY KEY (id),

  -- At most one execution per route.
  CONSTRAINT stage_basket_route_executions_route_unique
    UNIQUE (tournament_id, route_id),

  CONSTRAINT stage_basket_route_executions_proposal_revision_positive
    CHECK (source_proposal_revision > 0),

  -- Route must exist.
  CONSTRAINT stage_basket_route_executions_route_fk
    FOREIGN KEY (tournament_id, route_id)
    REFERENCES public.stage_basket_routes (tournament_id, id)
    ON DELETE RESTRICT,

  -- Source basket must exist (and belong to this tournament).
  CONSTRAINT stage_basket_route_executions_source_basket_fk
    FOREIGN KEY (tournament_id, source_basket_id)
    REFERENCES public.stage_baskets (tournament_id, id)
    ON DELETE RESTRICT,

  -- Target basket must exist (and belong to this tournament).
  CONSTRAINT stage_basket_route_executions_target_basket_fk
    FOREIGN KEY (tournament_id, target_basket_id)
    REFERENCES public.stage_baskets (tournament_id, id)
    ON DELETE RESTRICT,

  -- Proposal must still exist (prevents deleting the backing proposal).
  CONSTRAINT stage_basket_route_executions_proposal_fk
    FOREIGN KEY (source_proposal_id)
    REFERENCES public.qualification_proposals (id)
    ON DELETE RESTRICT
);

-- ─── stage_basket_route_entries ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stage_basket_route_entries (
  id                        serial    NOT NULL,
  execution_id              integer   NOT NULL,
  tournament_id             integer   NOT NULL,
  route_id                  text      NOT NULL,
  source_stage_id           integer   NOT NULL,
  source_basket_id          text      NOT NULL,
  source_output_player_id   integer   NOT NULL,
  target_stage_id           integer   NOT NULL,
  target_basket_id          text      NOT NULL,
  player_id                 integer   NOT NULL,
  source_final_rank         integer   NOT NULL,
  source_basket_position    integer,
  arrived_at                timestamp NOT NULL DEFAULT now(),

  CONSTRAINT stage_basket_route_entries_pkey
    PRIMARY KEY (id),

  -- One player may arrive in a target stage from at most one route.
  CONSTRAINT stage_basket_route_entries_target_stage_player_unique
    UNIQUE (tournament_id, target_stage_id, player_id),

  CONSTRAINT stage_basket_route_entries_final_rank_positive
    CHECK (source_final_rank > 0),

  CONSTRAINT stage_basket_route_entries_basket_position_positive
    CHECK (source_basket_position IS NULL OR source_basket_position > 0),

  CONSTRAINT stage_basket_route_entries_execution_fk
    FOREIGN KEY (execution_id)
    REFERENCES public.stage_basket_route_executions (id)
    ON DELETE RESTRICT,

  -- Player provenance: links back to the approved output row.
  CONSTRAINT stage_basket_route_entries_output_player_fk
    FOREIGN KEY (source_output_player_id)
    REFERENCES public.stage_basket_output_players (id)
    ON DELETE RESTRICT,

  CONSTRAINT stage_basket_route_entries_player_fk
    FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players (tournament_id, id)
    ON DELETE CASCADE
);

-- ─── Postcondition ──────────────────────────────────────────────────────────

DO $postcondition$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stage_basket_route_executions'
  ) THEN
    RAISE EXCEPTION '0023 postcondition failed: stage_basket_route_executions not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stage_basket_route_entries'
  ) THEN
    RAISE EXCEPTION '0023 postcondition failed: stage_basket_route_entries not created';
  END IF;
END;
$postcondition$;
