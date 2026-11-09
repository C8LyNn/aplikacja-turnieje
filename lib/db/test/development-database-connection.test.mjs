import assert from "node:assert/strict";
import test from "node:test";
import { DEVELOPMENT_DATABASE_NAME, isTournamentDevelopmentDatabase, resolveDatabaseConnectionString } from "../src/development-database-connection.mjs";

const base = { DATABASE_URL: "postgresql://fixture@localhost/heliumdb", NODE_ENV: "development" };
const selected = { ...base, TOURNAMENT_DEV_DATABASE_NAME: DEVELOPMENT_DATABASE_NAME };
test("only approved development runtime selects the separate database", () => {
  assert.equal(new URL(resolveDatabaseConnectionString(selected)).pathname, "/" + DEVELOPMENT_DATABASE_NAME);
  assert.ok(isTournamentDevelopmentDatabase(selected));
});
test("production without development selector is unchanged", () => {
  const production = { ...base, NODE_ENV: "production", DATABASE_URL: "postgresql://fixture@example.invalid/production" };
  assert.equal(resolveDatabaseConnectionString(production), production.DATABASE_URL);
});
test("development selector refuses production, deployment, unknown names and external connections", () => {
  for (const overrides of [
    { NODE_ENV: "production" }, { REPLIT_DEPLOYMENT: "1" },
    { TOURNAMENT_DEV_DATABASE_NAME: "production" },
    { DATABASE_URL: "postgresql://fixture@example.invalid/neondb" },
  ]) assert.throws(() => resolveDatabaseConnectionString({ ...selected, ...overrides }));
});
test("isolated test databases are not redirected into persistent development data", () => {
  const env = { ...selected, NODE_ENV: "test", DATABASE_URL: "postgresql://fixture@localhost/isolated_test" };
  assert.equal(resolveDatabaseConnectionString(env), env.DATABASE_URL);
  assert.equal(isTournamentDevelopmentDatabase(env), false);
});
