import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { auditVisualContract } from './tournament-exp-pack-03-audit-core.mjs';
import { resolveRepoRoot } from './tournament-exp-pack-03-lib.mjs';

const root = resolveRepoRoot();
const generatedAe = 'artifacts/tournament-manager/public/stream/animated-effects/index.html';

function run(label, command, args) {
  console.log(`\n[Pack 03] ${label}`);
  const resolved = process.platform === 'win32' && command === 'pnpm' ? 'pnpm.cmd' : command;
  execFileSync(resolved, args, { cwd: root, stdio: 'inherit' });
}

let aeWasClean = false;
try {
  if (fs.existsSync(path.join(root, '.git'))) {
    try {
      const status = execFileSync('git', ['status', '--porcelain', '--', generatedAe], { cwd: root, encoding: 'utf8' }).trim();
      aeWasClean = status.length === 0;
    } catch {
      aeWasClean = false;
    }
  }

  const audit = auditVisualContract(root);
  if (!audit.ok) throw new Error(`Visual audit:\n${audit.errors.join('\n')}`);
  console.log('[Pack 03] Visual audit PASS');

  run('TYPECHECK', 'pnpm', ['--filter', '@workspace/tournament-manager', 'run', 'typecheck']);
  run('TESTS', 'pnpm', ['--filter', '@workspace/tournament-manager', 'run', 'test']);
  run('BUILD', 'pnpm', ['--filter', '@workspace/tournament-manager', 'run', 'build']);

  console.log('\n[Pack 03] VERIFY PASS');
} catch (error) {
  console.error(`\n[Pack 03] VERIFY FAIL — ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  const generatedPath = path.join(root, generatedAe);
  if (aeWasClean && fs.existsSync(path.join(root, '.git')) && fs.existsSync(generatedPath)) {
    try {
      execFileSync('git', ['restore', '--', generatedAe], { cwd: root, stdio: 'ignore' });
      console.log(`[Pack 03] Przywrócono generowany plik ${generatedAe}`);
    } catch {
      console.log(`[Pack 03] Uwaga: nie udało się automatycznie przywrócić ${generatedAe}.`);
    }
  }
}
