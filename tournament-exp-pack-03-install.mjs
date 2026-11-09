import { installPack03 } from './tournament-exp-pack-03-installer-core.mjs';
import { resolveRepoRoot } from './tournament-exp-pack-03-lib.mjs';

try {
  const root = resolveRepoRoot();
  const result = installPack03(root);
  if (result.alreadyInstalled) {
    console.log('[Pack 03] INSTALL PASS — paczka była już zainstalowana; brak zmian.');
  } else {
    console.log(`[Pack 03] INSTALL PASS — zmieniono ${result.changed.length} plików.`);
    console.log(`[Pack 03] Backup: ${result.backupDir}`);
    for (const file of result.changed) console.log(`  M ${file}`);
  }
} catch (error) {
  console.error(`[Pack 03] INSTALL FAIL — ${error?.stack ?? error}`);
  process.exitCode = 1;
}
