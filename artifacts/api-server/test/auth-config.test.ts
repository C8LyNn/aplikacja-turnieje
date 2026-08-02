import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEVELOPMENT_SESSION_SECRET,
  resolveSessionSecret,
} from "../src/auth";

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
