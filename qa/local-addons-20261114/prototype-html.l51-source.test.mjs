import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const source = readFileSync(new URL("../../artifacts/tournament-manager/src/components/prototype-html.tsx", import.meta.url), "utf8");

test("L51: embedded preview has a shorter mobile min-height", () => {
  assert.match(source, /min-h-\[400px\]/);
  assert.match(source, /sm:min-h-\[720px\]/);
  assert.match(source, /sm:h-\[calc\(100vh-190px\)\]/);
});
test("L51: link is accessible to touch and keyboard", () => {
  assert.match(source, /min-h-11/);
  assert.match(source, /focus-visible:ring-2/);
});
test("L51: link retains safe new-tab behavior", () => {
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer"/);
});
test("L51: iframe still has a title and the original embedding permissions", () => {
  assert.match(source, /title=\{title\}/);
  assert.match(source, /allow="fullscreen; autoplay; clipboard-read; clipboard-write"/);
});
test("L51: direct Node tests use root base but preserve Vite BASE_URL", () => {
  assert.match(source, /import\.meta\.env\?\.BASE_URL \|\| "\/"/);
  assert.match(source, /configuredBase\.endsWith\("\/"\)/);
});
