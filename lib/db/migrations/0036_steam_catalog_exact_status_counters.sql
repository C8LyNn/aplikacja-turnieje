-- Transactionally maintained exact global status counts.
-- A single statement-level trigger per operation updates the counter row
-- once per bulk INSERT/UPDATE/DELETE, instead of once per game.
--
-- The DO block is atomic. Lock writes during the initial snapshot so a
-- deployment cannot miss a game inserted between counting and trigger setup.
DO $catalog_counts_migration$
BEGIN
  LOCK TABLE steam_catalog_games IN SHARE ROW EXCLUSIVE MODE;

  CREATE TABLE IF NOT EXISTS steam_catalog_status_counts (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    unclassified bigint NOT NULL DEFAULT 0 CHECK (unclassified >= 0),
    review bigint NOT NULL DEFAULT 0 CHECK (review >= 0),
    ready bigint NOT NULL DEFAULT 0 CHECK (ready >= 0)
  );

  INSERT INTO steam_catalog_status_counts (id, unclassified, review, ready)
  SELECT 1,
    count(*) FILTER (WHERE status = 'unclassified'),
    count(*) FILTER (WHERE status = 'review'),
    count(*) FILTER (WHERE status = 'ready')
  FROM steam_catalog_games
  ON CONFLICT (id) DO NOTHING;

  EXECUTE $function$
    CREATE OR REPLACE FUNCTION steam_catalog_maintain_status_counts()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $trigger$
    DECLARE
      new_u bigint := 0;
      new_r bigint := 0;
      new_y bigint := 0;
      old_u bigint := 0;
      old_r bigint := 0;
      old_y bigint := 0;
    BEGIN
      IF TG_OP IN ('INSERT', 'UPDATE') THEN
        SELECT
          count(*) FILTER (WHERE status = 'unclassified'),
          count(*) FILTER (WHERE status = 'review'),
          count(*) FILTER (WHERE status = 'ready')
        INTO new_u, new_r, new_y
        FROM catalog_new_rows;
      END IF;

      IF TG_OP IN ('DELETE', 'UPDATE') THEN
        SELECT
          count(*) FILTER (WHERE status = 'unclassified'),
          count(*) FILTER (WHERE status = 'review'),
          count(*) FILTER (WHERE status = 'ready')
        INTO old_u, old_r, old_y
        FROM catalog_old_rows;
      END IF;

      IF new_u <> old_u OR new_r <> old_r OR new_y <> old_y THEN
        UPDATE steam_catalog_status_counts SET
          unclassified = unclassified + new_u - old_u,
          review = review + new_r - old_r,
          ready = ready + new_y - old_y
        WHERE id = 1;
      END IF;

      RETURN NULL;
    END
    $trigger$;
  $function$;

  DROP TRIGGER IF EXISTS steam_catalog_count_insert ON steam_catalog_games;
  CREATE TRIGGER steam_catalog_count_insert
    AFTER INSERT ON steam_catalog_games
    REFERENCING NEW TABLE AS catalog_new_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION steam_catalog_maintain_status_counts();

  DROP TRIGGER IF EXISTS steam_catalog_count_update ON steam_catalog_games;
  CREATE TRIGGER steam_catalog_count_update
    AFTER UPDATE ON steam_catalog_games
    REFERENCING OLD TABLE AS catalog_old_rows NEW TABLE AS catalog_new_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION steam_catalog_maintain_status_counts();

  DROP TRIGGER IF EXISTS steam_catalog_count_delete ON steam_catalog_games;
  CREATE TRIGGER steam_catalog_count_delete
    AFTER DELETE ON steam_catalog_games
    REFERENCING OLD TABLE AS catalog_old_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION steam_catalog_maintain_status_counts();
END
$catalog_counts_migration$;
