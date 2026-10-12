import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  PINNED_NEON_STAGING_HOST, stagingReadOnlyDatabaseUrl,
} from "../src/scripts/neon-staging-target";

const secret = "example-test-password-not-a-real-secret";
const valid = "postgresql://tournament_manager_owner:" + secret +
  "@" + PINNED_NEON_STAGING_HOST +
  "/tournament_manager?sslmode=require&channel_binding=require";

describe("private Neon staging target", () => {
  test("pins the isolated QA branch and forces read-only SQL at session startup", () => {
    const result = new URL(stagingReadOnlyDatabaseUrl(valid));
    assert.equal(result.hostname, PINNED_NEON_STAGING_HOST);
    assert.equal(result.pathname, "/tournament_manager");
    assert.equal(result.searchParams.get("options"), "-c default_transaction_read_only=on");
    assert.equal(result.searchParams.get("sslmode"), "require");
    assert.equal(result.searchParams.get("channel_binding"), "require");
  });

  test("refuses production, pooled, malformed, unauthenticated and unsafe targets", () => {
    for (const candidate of [
      undefined, "",
      "not a database URL",
      valid.replace("postgresql:", "https:"),
      valid.replace(PINNED_NEON_STAGING_HOST, "production.replit.app"),
      valid.replace(PINNED_NEON_STAGING_HOST, "ep-flat-union-b9pcn5qb.c-7.eu-central-1.aws.neon.tech"),
      valid.replace(PINNED_NEON_STAGING_HOST, PINNED_NEON_STAGING_HOST.replace(".", "-pooler.")),
      valid.replace("/tournament_manager", "/postgres"),
      valid.replace("tournament_manager_owner:", "postgres:"),
      valid.replace(":" + secret + "@", "@"),
      valid.replace("sslmode=require", "sslmode=disable"),
      valid + "&options=-c%20default_transaction_read_only=off",
      valid + "&host=production.example.invalid",
      valid + "&hostaddr=127.0.0.1",
      valid + "&user=postgres",
      valid + "&dbname=production",
      valid + "&service=production",
      valid + "&sslrootcert=/tmp/sneaky.pem",
      valid + "&sslmode=disable",
      valid + "&channel_binding=disable",
      valid + "#secret-fragment",
      valid.replace("postgresql://", "postgresql://user@"),
    ]) {
      assert.throws(() => stagingReadOnlyDatabaseUrl(candidate));
    }
  });

  test("allows verified TLS while retaining no production authority", () => {
    const verify = stagingReadOnlyDatabaseUrl(valid.replace("sslmode=require", "sslmode=verify-full"));
    assert.equal(new URL(verify).searchParams.get("sslmode"), "verify-full");
  });
});
