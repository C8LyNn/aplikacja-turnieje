import assert from "node:assert/strict";
import test from "node:test";
import { steamCatalogReadiness } from "@workspace/game-catalog";

const classified = [
  { facet: "genre", role: "default" },
  { facet: "mechanic", role: "main" },
  { facet: "mechanic", role: "secondary" },
  { facet: "mode", role: "default" },
  { facet: "structure", role: "default" },
  { facet: "world", role: "default" },
  { facet: "visual", role: "default" },
];

test("a full Steam classification satisfies the six readiness checks", () => {
  const result = steamCatalogReadiness(classified);
  assert.equal(result.complete, true);
  assert.equal(result.checks.length, 6);
  assert.deepEqual(result.missing, []);
});

test("readiness rejects an empty or partial classification with readable gaps", () => {
  const empty = steamCatalogReadiness([]);
  assert.equal(empty.complete, false);
  assert.equal(empty.missing.length, 6);

  const partial = steamCatalogReadiness([
    { facet: "genre", role: "default" },
    { facet: "mechanic", role: "secondary" },
    { facet: "world", role: "default" },
  ]);
  assert.equal(partial.complete, false);
  assert.ok(partial.missing.includes("Główna mechanika"));
  assert.ok(partial.missing.includes("Tryb"));
  assert.ok(!partial.missing.includes("Gatunek główny"));
});

test("multiple main genres do not accidentally pass completeness validation", () => {
  const result = steamCatalogReadiness([...classified, { facet: "genre", role: "default" }]);
  assert.equal(result.complete, false);
  assert.ok(result.missing.includes("Gatunek główny"));
});

test("a concrete or abstract setting must be explicitly classified", () => {
  const withoutWorld = steamCatalogReadiness(classified.filter((a) => a.facet !== "world"));
  assert.equal(withoutWorld.complete, false);
  assert.deepEqual(withoutWorld.missing, ["Świat lub konwencja"]);
});
