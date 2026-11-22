import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import request from "supertest";
import { CreateTournamentBody } from "@workspace/api-zod";
import {
  MAX_ECHOED_VALIDATION_ISSUES,
  MAX_JSON_ARRAY_ELEMENTS,
  countJsonArrayElements,
  validationErrorText,
} from "../src/http/body-guards";
import { createHttpAppWithoutDatabase } from "./helpers/http-app-without-db";

// RC-6 security: oversized arrays never reach zod, zod issues are echoed in bounded form, compressed bodies are refused.

test("countJsonArrayElements counts nested arrays and stops past the limit", () => {
  assert.equal(countJsonArrayElements({ a: [1, 2, [3, 4]], b: { c: [{ d: [5] }] } }), 3 + 2 + 1 + 1);
  assert.equal(countJsonArrayElements({ name: "x", nested: { deep: true } }), 0);
  assert.equal(countJsonArrayElements(new Array(50).fill([1, 2]), 60) > 60, true);
});

test("validationErrorText is unchanged for real mistakes and bounded for floods", () => {
  const few = CreateTournamentBody.safeParse({ name: 5 });
  assert.equal(few.success, false);
  if (few.success) return;
  assert.ok(few.error.issues.length <= MAX_ECHOED_VALIDATION_ISSUES);
  assert.equal(validationErrorText(few.error), few.error.message);

  const flood = CreateTournamentBody.safeParse({ name: "x", stagePlan: { stages: new Array(5_000).fill(0) } });
  assert.equal(flood.success, false);
  if (flood.success) return;
  assert.ok(flood.error.issues.length > 5_000);
  const text = validationErrorText(flood.error);
  assert.match(text, /\(\+\d+ more validation issues\)$/);
  assert.ok(text.length < 10_000, `echo stays small (${text.length} chars)`);
  assert.ok(flood.error.message.length > 500_000, "the unbounded zod message would have been huge");
});

test("HTTP: bodies over the array-element cap get 413 before any route runs", async () => {
  const app = await createHttpAppWithoutDatabase();
  const big = await request(app).post("/api/tournaments")
    .set("content-type", "application/json")
    .send(JSON.stringify({ name: "x", stagePlan: { stages: new Array(MAX_JSON_ARRAY_ELEMENTS + 1).fill(0) } }));
  assert.equal(big.status, 413);
  assert.equal(big.body.code, "REQUEST_TOO_COMPLEX");

  const normal = await request(app).post("/api/tournaments").send({ name: "x", stagePlan: { stages: new Array(1_000).fill(0) } });
  assert.equal(normal.status, 404, "below the cap the body passes to routing (fixture has no POST route)");
  assert.equal(normal.body.code, "API_NOT_FOUND");
});

test("HTTP: Core Clash paths are exempt from the array-element cap", async () => {
  const app = await createHttpAppWithoutDatabase();
  const response = await request(app).post("/api/core-clash/rooms/x/snapshot")
    .set("content-type", "application/json")
    .send(JSON.stringify({ snapshot: { cells: new Array(MAX_JSON_ARRAY_ELEMENTS + 1).fill(0) } }));
  assert.equal(response.status, 404);
  assert.equal(response.body.code, "API_NOT_FOUND");
});

test("HTTP: compressed request bodies are refused with 415 and the server keeps serving", async () => {
  const app = await createHttpAppWithoutDatabase();
  const crashes: unknown[] = [];
  const onCrash = (error: unknown) => crashes.push(error);
  process.on("uncaughtException", onCrash);
  try {
    for (const type of ["application/json", "application/x-www-form-urlencoded"]) {
      const body = Buffer.concat([gzipSync(Buffer.from(type === "application/json" ? '{"a":1}' : "a=1")), Buffer.from("TRAILING")]);
      const response = await request(app).post("/api/tournaments")
        .set("content-type", type).set("content-encoding", "gzip").send(body);
      assert.equal(response.status, 415, type);
      assert.equal(response.body.code, "UNSUPPORTED_CONTENT_ENCODING");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    const after = await request(app).get("/api/a30-existing");
    assert.equal(after.status, 200);
    assert.deepEqual(crashes, []);
  } finally {
    process.off("uncaughtException", onCrash);
  }
});

test("HTTP: oversized and invalid JSON keep clear 4xx answers", async () => {
  const app = await createHttpAppWithoutDatabase();
  const tooLarge = await request(app).post("/api/tournaments")
    .set("content-type", "application/json").send(JSON.stringify({ blob: "x".repeat(4 * 1024 * 1024 + 10) }));
  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.body.code, "REQUEST_TOO_LARGE");

  const invalid = await request(app).post("/api/tournaments").set("content-type", "application/json").send("{oops");
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, "INVALID_JSON");
});
