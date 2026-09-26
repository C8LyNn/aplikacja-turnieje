import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

for (const module of [
  "stages/stage-start-readiness",
  "stages/seeding-ceremony",
  "backups/backup-v3",
]) {
  test(`pure helpers in ${module} import without database configuration`, () => {
    const env = { ...process.env };
    delete env.DATABASE_URL;
    delete env.TEST_DATABASE_URL;
    const result = spawnSync(process.execPath, [
      "--import", "tsx", "--input-type=module", "-e",
      `await import('./src/application/${module}.ts');
       if (process.env.DATABASE_URL !== undefined) throw new Error('Unexpected database configuration');`,
    ], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || String(result.error ?? "Import failed"));
  });
}
