import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  DEVELOPMENT_SESSION_SECRET,
  resolveSessionSecret,
  signVersionedOrganizerToken,
  signViewerToken,
  verifyPassword,
  verifyOrganizerToken,
  verifyViewerToken,
} from "../src/auth";
import { classifyLegacyCredentials } from "../src/application/auth/legacy-organizer-credential-state";
import {
  configureLocalLegacyCredentialsDatabase,
  readIntegerArgument,
} from "../src/scripts/legacy-credentials-script-config";

describe("SESSION_SECRET production guard", () => {
  test("rejects production startup without SESSION_SECRET", () => {
    assert.throws(
      () => resolveSessionSecret({ NODE_ENV: "production" }),
      /SESSION_SECRET is required/,
    );
  });

  test("rejects the known development fallback in production", () => {
    assert.throws(
      () => resolveSessionSecret({
        NODE_ENV: "production",
        SESSION_SECRET: DEVELOPMENT_SESSION_SECRET,
      }),
      /development SESSION_SECRET cannot be used/,
    );
  });

  test("rejects a production secret shorter than 32 characters", () => {
    assert.throws(
      () => resolveSessionSecret({ NODE_ENV: "production", SESSION_SECRET: "too-short" }),
      /at least 32 characters/,
    );
  });

  test("accepts a sufficiently long production secret", () => {
    const secret = "production-test-secret-32-chars-minimum";
    assert.equal(
      resolveSessionSecret({ NODE_ENV: "production", SESSION_SECRET: secret }),
      secret,
    );
  });

  test("keeps the local fallback in development", () => {
    assert.equal(
      resolveSessionSecret({ NODE_ENV: "development" }),
      DEVELOPMENT_SESSION_SECRET,
    );
  });
});

describe("signed tournament tokens", () => {
  test("frontend client has no legacy host-code authorization channel", () => {
    const customFetchSource = readFileSync(
      new URL("../../../lib/api-client-react/src/custom-fetch.ts", import.meta.url),
      "utf8",
    );
    assert.equal(/x-host-code/i.test(customFetchSource), false);
    assert.equal(/setActiveHostCode/.test(customFetchSource), false);
  });

  test("malformed persisted password hashes are rejected without throwing", async () => {
    for (const stored of [
      "",
      "missing-separator",
      "salt:short",
      `${"z".repeat(32)}:${"0".repeat(128)}`,
      `${"0".repeat(32)}:${"z".repeat(128)}`,
    ]) {
      assert.equal(await verifyPassword("password", stored), false);
    }
  });

  test("malformed tokens are rejected without throwing", () => {
    for (const token of ["", "a.b", "%%%.$$$", "payload.short", "no-dot"]) {
      assert.doesNotThrow(() => verifyOrganizerToken(token, 1));
      assert.doesNotThrow(() => verifyViewerToken(token, 1, 1));
      assert.equal(verifyOrganizerToken(token, 1), false);
      assert.equal(verifyViewerToken(token, 1, 1), false);
    }
  });

  test("tokens are scoped to one tournament", () => {
    const hash = "test-organizer-hash";
    const token = signVersionedOrganizerToken(11, hash);
    assert.equal(verifyOrganizerToken(token, 11, hash), true);
    assert.equal(verifyOrganizerToken(token, 12, hash), false);
    assert.equal(verifyViewerToken(signViewerToken(11, 3), 11, 3), true);
    assert.equal(verifyViewerToken(signViewerToken(11, 3), 12, 3), false);
  });

  test("unversioned organizer tokens never authorize persisted tournaments", () => {
    const legacyPayload = Buffer.from(JSON.stringify({ t: 11, r: "organizer" })).toString("base64url");
    const token = `${legacyPayload}.intentionally-invalid-legacy-signature`;
    assert.equal(verifyOrganizerToken(token, 11, null), false);
    assert.equal(verifyOrganizerToken(token, 11, "current-hash"), false);
  });

  test("changing the organizer password hash invalidates older tokens", () => {
    const token = signVersionedOrganizerToken(11, "old-hash");
    assert.equal(verifyOrganizerToken(token, 11, "old-hash"), true);
    assert.equal(verifyOrganizerToken(token, 11, "new-hash"), false);
  });

  test("viewer password version invalidates older tokens", () => {
    const token = signViewerToken(21, 4);
    assert.equal(verifyViewerToken(token, 21, 4), true);
    assert.equal(verifyViewerToken(token, 21, 5), false);
  });
});

describe("legacy credential administration safety", () => {
  test("classifies all four persisted credential states without exposing values", () => {
    assert.equal(classifyLegacyCredentials({ hostCode: null, organizerPasswordHash: null }), "no_credentials");
    assert.equal(classifyLegacyCredentials({ hostCode: "legacy", organizerPasswordHash: null }), "host_code_only");
    assert.equal(classifyLegacyCredentials({ hostCode: null, organizerPasswordHash: "hash" }), "organizer_password_only");
    assert.equal(classifyLegacyCredentials({ hostCode: "legacy", organizerPasswordHash: "hash" }), "both_credentials");
  });

  test("administrative scripts accept only explicit local PostgreSQL URLs", () => {
    const localEnv = {
      LEGACY_CREDENTIALS_DATABASE_URL: "postgresql://user:password@127.0.0.1:55432/local_test",
    } as NodeJS.ProcessEnv;
    configureLocalLegacyCredentialsDatabase(localEnv);
    assert.equal(localEnv.DATABASE_URL, localEnv.LEGACY_CREDENTIALS_DATABASE_URL);

    for (const url of [
      "postgresql://user:password@example.com/database",
      "https://127.0.0.1/database",
      "not-a-url",
    ]) {
      assert.throws(
        () => configureLocalLegacyCredentialsDatabase({
          LEGACY_CREDENTIALS_DATABASE_URL: url,
        } as NodeJS.ProcessEnv),
      );
    }
  });

  test("administrative recovery requires an explicit positive tournament id", () => {
    assert.equal(readIntegerArgument("tournament-id", ["--tournament-id=17"]), 17);
    assert.throws(() => readIntegerArgument("tournament-id", []));
    assert.throws(() => readIntegerArgument("tournament-id", ["--tournament-id=0"]));
  });
});
