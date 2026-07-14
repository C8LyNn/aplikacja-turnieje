const RESET_CONFIRMATION = "DROP_TM_TEST_SCHEMA";
const SAFE_SCHEMA_PATTERN = /^tm_test_[a-z0-9_]+$/;

function assertSafeTestSchema(schema: string): void {
  if (!SAFE_SCHEMA_PATTERN.test(schema)) {
    throw new Error("Refusing to modify an unsafe test schema name.");
  }
}

export interface TestDatabaseConfig {
  connectionString: string;
  schema: string;
}

export interface TestPool {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>;
  end: () => Promise<void>;
}

export function getSafeTestDatabaseConfig(env: NodeJS.ProcessEnv = process.env): TestDatabaseConfig {
  if (!env.NODE_TEST_CONTEXT) {
    throw new Error("Integration database setup may run only under the Node test runner.");
  }

  const rawUrl = env.TEST_DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required. It must point to a dedicated PostgreSQL database whose name contains 'test'.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const targetFingerprint = `${parsed.hostname}/${databaseName}`.toLowerCase();
  if (!databaseName.toLowerCase().includes("test") || targetFingerprint.includes("prod")) {
    throw new Error(
      "Refusing integration tests: the PostgreSQL database name must contain 'test' and the target must not contain 'prod'.",
    );
  }

  const schema = env.TEST_DATABASE_SCHEMA ?? "tm_test_access";
  if (!SAFE_SCHEMA_PATTERN.test(schema)) {
    throw new Error("TEST_DATABASE_SCHEMA must match ^tm_test_[a-z0-9_]+$ and cannot be public.");
  }

  if (env.TEST_DATABASE_RESET !== RESET_CONFIRMATION) {
    throw new Error(`TEST_DATABASE_RESET must equal ${RESET_CONFIRMATION}.`);
  }

  parsed.searchParams.set("options", `-c search_path=${schema}`);
  return { connectionString: parsed.toString(), schema };
}

export async function resetTestSchema(pool: TestPool, schema: string): Promise<void> {
  assertSafeTestSchema(schema);
  let schemaCreated = false;
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await pool.query(`SET search_path TO "${schema}"`);
    await pool.query(`
    CREATE TYPE tournament_format AS ENUM (
      'single_elimination', 'double_elimination', 'round_robin', 'swiss'
    );
    CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'completed');
    CREATE TYPE player_status AS ENUM ('active', 'eliminated', 'winner');
    CREATE TYPE match_status AS ENUM (
      'pending', 'ready', 'in_progress', 'completed', 'bye', 'walkover', 'postponed', 'cancelled'
    );

    CREATE TABLE tournaments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      format tournament_format NOT NULL,
      status tournament_status NOT NULL DEFAULT 'draft',
      max_players INTEGER,
      swiss_rounds INTEGER,
      allow_draws BOOLEAN DEFAULT FALSE,
      default_best_of INTEGER DEFAULT 1,
      current_round INTEGER,
      total_rounds INTEGER,
      winner_id INTEGER,
      featured_match_id INTEGER,
      host_code TEXT,
      organizer_password_hash TEXT,
      support_password_hash TEXT,
      support_password_version INTEGER NOT NULL DEFAULT 1,
      viewer_password_hash TEXT,
      viewer_password_version INTEGER NOT NULL DEFAULT 1,
      visibility TEXT NOT NULL DEFAULT 'public_online',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE players (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      rank TEXT,
      country TEXT,
      team_name TEXT,
      seed INTEGER,
      status player_status NOT NULL DEFAULT 'active',
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE matches (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      player1_id INTEGER REFERENCES players(id),
      player2_id INTEGER REFERENCES players(id),
      score1 INTEGER,
      score2 INTEGER,
      winner_id INTEGER REFERENCES players(id),
      is_draw BOOLEAN DEFAULT FALSE,
      best_of INTEGER DEFAULT 1,
      note TEXT,
      status match_status NOT NULL DEFAULT 'pending',
      next_match_id INTEGER,
      sort_order INTEGER,
      scheduled_at TIMESTAMP,
      completed_at TIMESTAMP
    );

    CREATE TABLE result_history (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,
      score1 INTEGER,
      score2 INTEGER,
      winner_id INTEGER,
      is_draw BOOLEAN DEFAULT FALSE,
      status TEXT NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE action_log (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      match_id INTEGER,
      undo_payload TEXT,
      is_undone BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE support_sessions (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      nick TEXT NOT NULL,
      session_token TEXT NOT NULL,
      password_version INTEGER NOT NULL DEFAULT 1,
      last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE auth_audit_log (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      actor_type TEXT NOT NULL,
      actor_nick TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    `);
  } catch (error) {
    if (schemaCreated) {
      try {
        await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } catch {
        // Preserve the original setup error; cleanup will be retried on the next run.
      }
    }
    throw error;
  }
}

export async function dropTestSchema(pool: TestPool, schema: string): Promise<void> {
  assertSafeTestSchema(schema);
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
