-- A match revision identifies the state on which a result form was based.
-- Existing results are preserved; existing rows receive baseline revision 1.
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass AND conname = 'matches_revision_positive') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_revision_positive CHECK (revision > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_match_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.stage_id, NEW.stage_group_id, NEW.player1_id, NEW.player2_id,
         NEW.best_of, NEW.status, NEW.score1, NEW.score2, NEW.winner_id,
         NEW.result_type, NEW.result_reason, NEW.completed_at, NEW.next_match_id, NEW.routing_match_key)
    IS DISTINCT FROM
     ROW(OLD.stage_id, OLD.stage_group_id, OLD.player1_id, OLD.player2_id,
         OLD.best_of, OLD.status, OLD.score1, OLD.score2, OLD.winner_id,
         OLD.result_type, OLD.result_reason, OLD.completed_at, OLD.next_match_id, OLD.routing_match_key) THEN
    NEW.revision := OLD.revision + 1;
  ELSE
    -- Revision is server-owned: metadata-only writes cannot reset or bump it.
    NEW.revision := OLD.revision;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS matches_increment_revision ON public.matches;
CREATE TRIGGER matches_increment_revision BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.increment_match_revision();
