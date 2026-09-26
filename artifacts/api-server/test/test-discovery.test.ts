import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { discoverTests } from "./test-discovery";

test("discovers new and nested regressions without mixing database tests into units", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "tm-test-discovery-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, "nested"));
  for (const file of ["new.test.ts", "new.integration.test.ts", "helper.ts", "nested/regression.test.ts"]) {
    await writeFile(path.join(directory, file), "");
  }
  const groups = await discoverTests(directory);
  assert.deepEqual(groups.unit, [path.join(directory, "nested/regression.test.ts"), path.join(directory, "new.test.ts")].sort());
  assert.deepEqual(groups.integration, [path.join(directory, "new.integration.test.ts")]);
});

test("includes previously omitted lifecycle, seeding and DE regressions", async () => {
  const groups = await discoverTests(fileURLToPath(new URL("./", import.meta.url)));
  for (const name of [
    "single-stage-seeding.integration.test.ts",
    "legacy-de-routing-plan.integration.test.ts",
    "tournament-stages-full-flow.integration.test.ts",
    "tournament-stages-lifecycle.integration.test.ts",
    "double-elimination-api.integration.test.ts",
  ]) {
    assert.ok(groups.integration.some((file) => path.basename(file) === name), name);
    assert.ok(!groups.unit.some((file) => path.basename(file) === name), name);
  }
  assert.ok(groups.unit.some((file) => path.basename(file) === "marvel-backup-v3.test.ts"));
});
