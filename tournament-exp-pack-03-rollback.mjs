import { findLatestBackup, rollbackPack03 } from './tournament-exp-pack-03-installer-core.mjs';
import { resolveRepoRoot } from './tournament-exp-pack-03-lib.mjs';

try {
  const root = resolveRepoRoot();
  const requested = process.argv[2];
  const backupDir = requested || findLatestBackup(root);
  if (!backupDir) throw new Error('Nie znaleziono backupu Pack 03.');
  const result = rollbackPack03(root, backupDir);
  console.log(`[Pack 03] ROLLBACK PASS — przywrócono ${result.restored.length} plików.`);
  console.log(`[Pack 03] Źródło: ${backupDir}`);
} catch (error) {
  console.error(`[Pack 03] ROLLBACK FAIL — ${error?.stack ?? error}`);
  process.exitCode = 1;
}
