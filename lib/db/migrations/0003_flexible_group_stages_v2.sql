-- Flexible group stages v2
-- Allows any sensible number of balanced groups, uneven group sizes that differ
-- by at most one, and qualification limits from one participant through everyone.

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_format_configuration;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_format_configuration CHECK (
    (format = 'swiss' AND ranking_policy = 'swiss_v1' AND planned_rounds IS NOT NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'round_robin' AND ranking_policy = 'round_robin_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'single_elimination' AND ranking_policy = 'elimination_bracket_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'group_stage' AND ranking_policy = 'group_v1' AND planned_rounds IS NULL
      AND group_count >= 1 AND group_count * 2 <= participant_count
      AND participants_per_group >= 2
      AND participant_count <= group_count * participants_per_group
      AND participant_count > group_count * (participants_per_group - 1)
      AND qualifiers_per_group BETWEEN 1 AND participants_per_group)
  );

ALTER TABLE public.stage_groups
  DROP CONSTRAINT IF EXISTS stage_groups_key_supported,
  DROP CONSTRAINT IF EXISTS stage_groups_position_range,
  DROP CONSTRAINT IF EXISTS stage_groups_participant_count_range,
  DROP CONSTRAINT IF EXISTS stage_groups_qualifiers_count_supported;

ALTER TABLE public.stage_groups
  ADD CONSTRAINT stage_groups_key_nonempty CHECK (length(group_key) > 0),
  ADD CONSTRAINT stage_groups_position_positive CHECK (position > 0),
  ADD CONSTRAINT stage_groups_participant_count_minimum CHECK (participant_count >= 2),
  ADD CONSTRAINT stage_groups_qualifiers_count_range
    CHECK (qualifiers_count BETWEEN 1 AND participant_count);

CREATE OR REPLACE FUNCTION public.validate_stage_group_configuration() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  stage_format public.tournament_stage_format;
  expected_group_count INTEGER;
  total_participant_count INTEGER;
  expected_qualifiers_limit INTEGER;
  smaller_group_size INTEGER;
  larger_group_count INTEGER;
  expected_participant_count INTEGER;
  expected_qualifiers_count INTEGER;
BEGIN
  SELECT
    format,
    group_count,
    participant_count,
    qualifiers_per_group
  INTO
    stage_format,
    expected_group_count,
    total_participant_count,
    expected_qualifiers_limit
  FROM public.tournament_stages
  WHERE id = NEW.stage_id;

  IF stage_format IS DISTINCT FROM 'group_stage'::public.tournament_stage_format THEN
    RAISE EXCEPTION 'stage_groups may belong only to group_stage';
  END IF;
  IF NEW.position < 1 OR NEW.position > expected_group_count THEN
    RAISE EXCEPTION 'stage group position must fit its tournament stage';
  END IF;

  smaller_group_size := total_participant_count / expected_group_count;
  larger_group_count := total_participant_count % expected_group_count;
  expected_participant_count := smaller_group_size
    + CASE WHEN NEW.position <= larger_group_count THEN 1 ELSE 0 END;
  expected_qualifiers_count := LEAST(
    expected_participant_count,
    expected_qualifiers_limit
  );

  IF NEW.participant_count <> expected_participant_count
     OR NEW.qualifiers_count <> expected_qualifiers_count THEN
    RAISE EXCEPTION 'stage group configuration must match its balanced tournament stage';
  END IF;
  RETURN NEW;
END;
$$;
