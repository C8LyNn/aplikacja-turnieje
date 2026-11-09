-- Optimistic concurrency token for human-authored classification only.
-- Steam re-import changes metadata but must not invalidate an editor's draft.
ALTER TABLE steam_catalog_games
  ADD COLUMN IF NOT EXISTS classification_revision integer NOT NULL DEFAULT 1;

-- Default upgrades existing records without changing their existing taxonomy.
-- Atomic UPDATE ... WHERE id = ? AND classification_revision = ? prevents
-- lost updates from two different editors using the same base revision.
