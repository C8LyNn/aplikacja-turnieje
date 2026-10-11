import assert from "node:assert/strict";
import test from "node:test";
import { filterTaxonomyTerms, nextPendingGameId, pendingCatalogGames, type CatalogWorkItem } from "./game-catalog-workflow";

const items: CatalogWorkItem[] = [
  { id: 3, name: "Zulu", status: "ready" },
  { id: 1, name: "Alpha", status: "unclassified" },
  { id: 4, name: "Delta", status: "review" },
  { id: 2, name: "Beta", status: "unclassified" },
];

test("classification queue excludes ready games and orders outstanding work stably", () => {
  const ordered = pendingCatalogGames(items);
  assert.deepEqual(ordered.map((game) => game.name), ["Alpha", "Beta", "Delta"]);
  assert.deepEqual(items.map((game) => game.name), ["Zulu", "Alpha", "Delta", "Beta"]);
});

test("next pending record advances, wraps and skips the active game", () => {
  assert.equal(nextPendingGameId(items, 1), 2);
  assert.equal(nextPendingGameId(items, 2), 4);
  assert.equal(nextPendingGameId(items, 4), 1);
  assert.equal(nextPendingGameId(items, 3), 1);
});

test("queue handles empty and single-item sets without cycling into itself", () => {
  assert.equal(nextPendingGameId([], 5), null);
  assert.equal(nextPendingGameId([{ id: 7, name: "Only", status: "ready" }], 7), null);
  assert.equal(nextPendingGameId([{ id: 7, name: "Only", status: "review" }], 7), null);
  assert.equal(nextPendingGameId([{ id: 7, name: "Only", status: "review" }], 8), 7);
});

test("taxonomy search handles Polish accents and keeps selected terms ahead of others", () => {
  const terms = [
    { id: 1, label: "Żywioły", slug: "zywioly" },
    { id: 2, label: "Akcja", slug: "akcja" },
    { id: 3, label: "Łowienie", slug: "lowienie" },
  ];
  assert.deepEqual(filterTaxonomyTerms(terms, "LOW", new Set()).map((t) => t.id), [3]);
  assert.deepEqual(filterTaxonomyTerms(terms, "zyw", new Set()).map((t) => t.id), [1]);
  assert.deepEqual(filterTaxonomyTerms(terms, "", new Set([1])).map((t) => t.id), [1, 2, 3]);
  assert.deepEqual(terms.map((t) => t.id), [1, 2, 3]);
});
