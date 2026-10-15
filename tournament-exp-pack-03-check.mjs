import { execFileSync } from 'node:child_process';
import { checkCompatibility, TARGETS } from './tournament-exp-pack-03-installer-core.mjs';
import { resolveRepoRoot } from './tournament-exp-pack-03-lib.mjs';

const BASELINE = 'b7b8bec';
const root = resolveRepoRoot();

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

try {
  const head = git(['rev-parse', '--short', 'HEAD']);
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: root, stdio: 'ignore' });
  } catch {
    throw new Error(`Baseline ${BASELINE} nie jest przodkiem aktualnego HEAD (${head}).`);
  }

  const targetPaths = TARGETS.map((target) => target.path);

  const dirty = git(['status', '--porcelain', '--', ...targetPaths]);
  if (dirty) {
    throw new Error(`Targetowane pliki mają lokalne zmiany. Najpierw je zatwierdź albo odłóż:\n${dirty}`);
  }

  const compatibility = checkCompatibility(root);
  if (!compatibility.ok) throw new Error(compatibility.errors.join('\n'));

  console.log(`[Pack 03] CHECK PASS — HEAD ${head}, baseline ${BASELINE} jest obecny.`);
  console.log(`[Pack 03] ${compatibility.targets.length} targetów zgodnych z Pack 02/03.`);
} catch (error) {
  console.error(`[Pack 03] CHECK FAIL — ${error?.message ?? error}`);
  process.exitCode = 1;
}
