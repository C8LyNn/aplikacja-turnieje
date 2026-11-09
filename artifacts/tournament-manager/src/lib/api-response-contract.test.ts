import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { customFetch, listTournaments } from "@workspace/api-client-react";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("generated list client rejects HTML instead of returning a typed string", async () => {
  globalThis.fetch = async (_input, init) => {
    assert.match(new Headers(init?.headers).get("accept") ?? "", /application\/json/);
    return new Response("<!DOCTYPE html><html></html>", { headers: { "content-type": "text/html" } });
  };
  await assert.rejects(listTournaments(), { name: "ResponseParseError" });
});

test("API transport preserves no-content deletes and explicit text responses", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await customFetch("/api/tournaments/1", { method: "DELETE" }), null);
  globalThis.fetch = async () => new Response("export text", { headers: { "content-type": "text/plain" } });
  assert.equal(await customFetch("/export", { responseType: "text" }), "export text");
  assert.equal(await customFetch("/export", { responseType: "auto" }), "export text");
});
