-- Exact stage participant flow and qualifying single-elimination stages.
-- This migration changes no existing rows and adds no new columns or tables.

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_qualification_configuration,
  DROP CONSTRAINT IF EXISTS tournament_stages_elimination_advancing_boundary;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_qualification_configuration CHECK (
    (qualification_mode = 'none' AND advancing_count IS NULL)
    OR (qualification_mode = 'top_n'
      AND format IN ('swiss', 'round_robin')
      AND advancing_count IS NOT NULL
      AND advancing_count <= participant_count)
    OR (qualification_mode = 'top_n'
      AND format = 'single_elimination'
      AND advancing_count IS NOT NULL)
    OR (qualification_mode = 'top_n_per_group'
      AND format = 'group_stage'
      AND advancing_count IS NULL)
  ),
  ADD CONSTRAINT tournament_stages_elimination_advancing_boundary CHECK (
    format <> 'single_elimination'
    OR qualification_mode = 'none'
    OR (qualification_mode = 'top_n'
      AND advancing_count < participant_count
      AND (advancing_count & (advancing_count - 1)) = 0)
  );

CREATE OR REPLACE FUNCTION public.validate_tournament_stage_participant_flow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  affected_tournament_id INTEGER := COALESCE(NEW.tournament_id, OLD.tournament_id);
  stage_count INTEGER;
  stage_row RECORD;
  next_participant_count INTEGER;
  expected_output INTEGER;
  smaller_group_size INTEGER;
  larger_group_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.tournament_id IS DISTINCT FROM NEW.tournament_id THEN
    RAISE EXCEPTION 'a tournament stage cannot move between tournaments';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tournaments WHERE id = affected_tournament_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT count(*)::INTEGER
  INTO stage_count
  FROM public.tournament_stages
  WHERE tournament_id = affected_tournament_id;

  -- Legacy and ordinary one-stage tournaments retain their compatibility model.
  IF stage_count <= 1 THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM generate_series(1, stage_count) AS expected(position)
    LEFT JOIN public.tournament_stages stage
      ON stage.tournament_id = affected_tournament_id
     AND stage.position = expected.position
    WHERE stage.id IS NULL
  ) THEN
    RAISE EXCEPTION 'tournament % stage positions must be contiguous from 1', affected_tournament_id;
  END IF;

  FOR stage_row IN
    SELECT *
    FROM public.tournament_stages
    WHERE tournament_id = affected_tournament_id
    ORDER BY position
  LOOP
    IF stage_row.position = stage_count THEN
      IF stage_row.qualification_mode <> 'none' OR stage_row.advancing_count IS NOT NULL THEN
        RAISE EXCEPTION 'terminal stage % cannot feed another stage', stage_row.id;
      END IF;
      CONTINUE;
    END IF;

    SELECT participant_count
    INTO next_participant_count
    FROM public.tournament_stages
    WHERE tournament_id = affected_tournament_id
      AND position = stage_row.position + 1;

    IF stage_row.format IN ('swiss', 'round_robin', 'single_elimination') THEN
      IF stage_row.qualification_mode <> 'top_n' OR stage_row.advancing_count IS NULL THEN
        RAISE EXCEPTION 'stage % requires top_n qualification', stage_row.id;
      END IF;
      expected_output := stage_row.advancing_count;
    ELSIF stage_row.format = 'group_stage' THEN
      IF stage_row.qualification_mode <> 'top_n_per_group'
        OR stage_row.group_count IS NULL
        OR stage_row.qualifiers_per_group IS NULL
      THEN
        RAISE EXCEPTION 'group stage % has invalid qualification settings', stage_row.id;
      END IF;
      smaller_group_size := stage_row.participant_count / stage_row.group_count;
      larger_group_count := stage_row.participant_count % stage_row.group_count;
      expected_output :=
        larger_group_count * LEAST(stage_row.qualifiers_per_group, smaller_group_size + 1)
        + (stage_row.group_count - larger_group_count)
          * LEAST(stage_row.qualifiers_per_group, smaller_group_size);
    ELSE
      RAISE EXCEPTION 'stage % has unsupported format', stage_row.id;
    END IF;

    IF next_participant_count IS DISTINCT FROM expected_output THEN
      RAISE EXCEPTION
        'stage participant flow mismatch: stage % outputs %, next stage expects %',
        stage_row.id,
        expected_output,
        next_participant_count;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tournament_stages_validate_participant_flow
  ON public.tournament_stages;

CREATE CONSTRAINT TRIGGER tournament_stages_validate_participant_flow
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_stages
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.validate_tournament_stage_participant_flow();
