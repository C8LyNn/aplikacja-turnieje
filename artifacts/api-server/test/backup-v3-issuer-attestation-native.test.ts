import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * W6H A90 native Node22 suite bridge.
 * Existing API test-discovery picks .test.ts, not standalone .test.mjs.
 * No DB, keys on disk, packages, network or importer; child uses ephemeral keys.
 */
test("W6H A90 attestation Ed25519 source-only security matrix (native Node)", () => {
  const suite = fileURLToPath(new URL("./backup-v3-issuer-attestation.test.mjs", import.meta.url));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // Nested Node --test must emit its own TAP to stdout.
  const run = spawnSync(process.execPath,
    ["--test", "--test-reporter=tap", suite],
    { encoding: "utf8", timeout: 20_000, maxBuffer: 4 * 1024 * 1024, env });
  assert.equal(run.error, undefined, "native Node runner failed");
  assert.equal(run.signal, null, "security suite timed out or terminated by signal");
  assert.equal(run.status, 0, (run.stdout ?? "") + "\n" + (run.stderr ?? ""));
  assert.match(run.stdout, /# tests 16(?:\r?\n|$)/);
  assert.match(run.stdout, /# pass 16(?:\r?\n|$)/);
  assert.match(run.stdout, /# fail 0(?:\r?\n|$)/);
  assert.match(run.stdout, /# skipped 0(?:\r?\n|$)/);
});
