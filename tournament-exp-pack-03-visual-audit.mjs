import { auditVisualContract } from './tournament-exp-pack-03-audit-core.mjs';
import { resolveRepoRoot } from './tournament-exp-pack-03-lib.mjs';

try {
  const root = resolveRepoRoot();
  const result = auditVisualContract(root);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  console.log('[Pack 03] VISUAL AUDIT PASS — semantyczny system kolorów i hooki Experimental są obecne.');
} catch (error) {
  console.error(`[Pack 03] VISUAL AUDIT FAIL — ${error?.message ?? error}`);
  process.exitCode = 1;
}
