CREATE TABLE IF NOT EXISTS steam_catalog_games (
  id serial PRIMARY KEY,
  steam_app_id integer NOT NULL,
  name text NOT NULL,
  steam_url text NOT NULL,
  header_image_url text,
  developer text,
  publisher text,
  release_date text,
  short_description text,
  status text NOT NULL DEFAULT 'unclassified',
  steam_raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS steam_catalog_games_app_id_uidx
  ON steam_catalog_games (steam_app_id);

CREATE TABLE IF NOT EXISTS steam_catalog_terms (
  id serial PRIMARY KEY,
  facet text NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS steam_catalog_terms_facet_slug_uidx
  ON steam_catalog_terms (facet, slug);

CREATE TABLE IF NOT EXISTS steam_catalog_game_terms (
  game_id integer NOT NULL REFERENCES steam_catalog_games(id) ON DELETE CASCADE,
  term_id integer NOT NULL REFERENCES steam_catalog_terms(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'default',
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, term_id)
);

CREATE INDEX IF NOT EXISTS steam_catalog_game_terms_game_idx
  ON steam_catalog_game_terms (game_id);
CREATE INDEX IF NOT EXISTS steam_catalog_game_terms_term_idx
  ON steam_catalog_game_terms (term_id);

ALTER TABLE steam_catalog_games
  DROP CONSTRAINT IF EXISTS steam_catalog_games_status_check;
ALTER TABLE steam_catalog_games
  ADD CONSTRAINT steam_catalog_games_status_check
  CHECK (status IN ('unclassified', 'review', 'ready'));

ALTER TABLE steam_catalog_terms
  DROP CONSTRAINT IF EXISTS steam_catalog_terms_facet_check;
ALTER TABLE steam_catalog_terms
  ADD CONSTRAINT steam_catalog_terms_facet_check
  CHECK (facet IN ('genre', 'subgenre', 'mechanic', 'mode', 'structure', 'world', 'visual', 'detail'));

ALTER TABLE steam_catalog_game_terms
  DROP CONSTRAINT IF EXISTS steam_catalog_game_terms_role_check;
ALTER TABLE steam_catalog_game_terms
  ADD CONSTRAINT steam_catalog_game_terms_role_check
  CHECK (role IN ('default', 'main', 'secondary'));

INSERT INTO steam_catalog_terms (facet, slug, label) VALUES
  ('genre','action','Action'),
  ('genre','adventure','Adventure'),
  ('genre','rpg','RPG'),
  ('genre','shooter','Shooter'),
  ('genre','strategy','Strategy'),
  ('genre','simulation','Simulation'),
  ('genre','puzzle','Puzzle'),
  ('genre','platformer','Platformer'),
  ('genre','fighting','Fighting'),
  ('genre','racing','Racing'),
  ('genre','sports','Sports'),
  ('genre','horror','Horror'),
  ('genre','visual-novel','Visual Novel'),
  ('subgenre','action-rpg','Action RPG'),
  ('subgenre','crpg','CRPG'),
  ('subgenre','jrpg','JRPG'),
  ('subgenre','tactical-rpg','Tactical RPG'),
  ('subgenre','looter-shooter','Looter Shooter'),
  ('subgenre','tactical-shooter','Tactical Shooter'),
  ('subgenre','extraction-shooter','Extraction Shooter'),
  ('subgenre','arena-shooter','Arena Shooter'),
  ('subgenre','roguelike','Roguelike'),
  ('subgenre','roguelite','Roguelite'),
  ('subgenre','metroidvania','Metroidvania'),
  ('subgenre','city-builder','City Builder'),
  ('subgenre','life-sim','Life Sim'),
  ('subgenre','farming-sim','Farming Sim'),
  ('subgenre','survival-craft','Survival Craft'),
  ('subgenre','deckbuilder','Deckbuilder'),
  ('subgenre','auto-battler','Auto Battler'),
  ('subgenre','immersive-sim','Immersive Sim'),
  ('subgenre','grand-strategy','Grand Strategy'),
  ('subgenre','rts','RTS'),
  ('subgenre','turn-based-strategy','Turn-Based Strategy'),
  ('subgenre','moba','MOBA'),
  ('mechanic','shooting','Shooting'),
  ('mechanic','melee-combat','Melee Combat'),
  ('mechanic','loot','Loot'),
  ('mechanic','buildcrafting','Buildcrafting'),
  ('mechanic','crafting','Crafting'),
  ('mechanic','exploration','Exploration'),
  ('mechanic','resource-gathering','Resource Gathering'),
  ('mechanic','base-building','Base Building'),
  ('mechanic','stealth','Stealth'),
  ('mechanic','dialogue-choices','Dialogue / Choices'),
  ('mechanic','puzzle-solving','Puzzle Solving'),
  ('mechanic','deck-building','Deck Building'),
  ('mechanic','turn-based-combat','Turn-Based Combat'),
  ('mechanic','real-time-combat','Real-Time Combat'),
  ('mechanic','platforming','Platforming'),
  ('mechanic','management','Management'),
  ('mechanic','trading','Trading'),
  ('mechanic','fishing','Fishing'),
  ('mechanic','mining','Mining'),
  ('mechanic','decorating','Decorating'),
  ('mechanic','traversal','Traversal'),
  ('mechanic','parkour','Parkour'),
  ('mechanic','driving','Driving'),
  ('mode','singleplayer','Singleplayer'),
  ('mode','coop-pve','Co-op PvE'),
  ('mode','pvp','PvP'),
  ('mode','team-pvp','Team PvP'),
  ('mode','pvpve','PvPvE'),
  ('mode','mmo','MMO'),
  ('mode','local-coop','Local Co-op'),
  ('mode','online-coop','Online Co-op'),
  ('structure','open-world','Open World'),
  ('structure','linear','Linear'),
  ('structure','mission-based','Mission-Based'),
  ('structure','match-based','Match-Based'),
  ('structure','sandbox','Sandbox'),
  ('structure','hub-based','Hub-Based'),
  ('structure','run-based','Run-Based'),
  ('structure','level-based','Level-Based'),
  ('structure','persistent-world','Persistent World'),
  ('structure','procedural','Procedural'),
  ('world','fantasy','Fantasy'),
  ('world','dark-fantasy','Dark Fantasy'),
  ('world','sci-fi','Science Fiction'),
  ('world','space-fantasy','Space Fantasy'),
  ('world','cyberpunk','Cyberpunk'),
  ('world','steampunk','Steampunk'),
  ('world','post-apocalyptic','Post-Apocalyptic'),
  ('world','historical','Historical'),
  ('world','contemporary','Contemporary'),
  ('world','western','Western'),
  ('world','dystopian','Dystopian'),
  ('world','superhero','Superhero'),
  ('world','mythological','Mythological'),
  ('visual','realistic','Realistic'),
  ('visual','stylized','Stylized'),
  ('visual','anime','Anime'),
  ('visual','cartoon','Cartoon'),
  ('visual','pixel-art','Pixel Art'),
  ('visual','low-poly','Low Poly'),
  ('visual','voxel','Voxel'),
  ('visual','hand-drawn','Hand-Drawn'),
  ('visual','cel-shaded','Cel-Shaded'),
  ('visual','2d','2D'),
  ('visual','2-5d','2.5D'),
  ('visual','3d','3D'),
  ('detail','companions','Companions'),
  ('detail','clans','Clans / Guilds'),
  ('detail','housing','Player Housing'),
  ('detail','vehicles','Vehicles'),
  ('detail','romance','Romance'),
  ('detail','character-creation','Character Creation'),
  ('detail','permadeath','Permadeath')
ON CONFLICT (facet, slug) DO NOTHING;
