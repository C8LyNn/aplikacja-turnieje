/**
 * WAVE 4 Pack17 failure-output and STOP contract — DB-FREE.
 * Runs --static in synthetic isolated workspace only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function fixture(sourceFailure, secondFailure = false) {
  const root = mkdtempSync(join(tmpdir(), 'web005-c01-pack17-static-'));
  mkdirSync(join(root, 'qa', 'pack17'), { recursive:true });
  mkdirSync(join(root, 'artifacts', 'api-server'), { recursive:true });
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
  writeFileSync(join(root, 'artifacts', 'api-server', 'package.json'), '{"name":"synthetic-no-db"}\n');
  for (const name of ['run-gates.mjs','gate-contract.mjs','failure-evidence.mjs']) {
    copyFileSync(join(here, name), join(root,'qa','pack17',name));
  }
  const first = sourceFailure
    ? "import {test} from 'node:test';\ntest('synthetic last-case fault',()=>{console.log('x'.repeat(2097152));throw new Error('SYNTHETIC_ONLY');});\n"
    : "import {test} from 'node:test';test('synthetic pass',()=>{});\n";
  const second = secondFailure
    ? "import {test} from 'node:test';test('second gate synthetic fail',()=>{throw new Error('SYNTHETIC_ONLY');});\n"
    : "import {test} from 'node:test';test('second gate synthetic pass',()=>{});\n";
  writeFileSync(join(root,'qa','pack17','source-contract.test.mjs'),first);
  writeFileSync(join(root,'qa','pack17','gate-contract.test.mjs'),second);
  return root;
}
function launch(root) {
  // No API/DB: fake workspace and --static. No TEST_DATABASE_URL passed.
  return spawnSync(process.execPath,
    ['qa/pack17/run-gates.mjs', '--static'], {
      cwd:root, encoding:'utf8', maxBuffer:8*1024*1024,
      env:{ PATH:process.env.PATH ?? '/usr/bin:/bin', HOME:root, NODE_ENV:'test', CI:'true' },
    });
}

test('failed first gate keeps first TAP and stops before second gate', () => {
  const root = fixture(true);
  try {
    const r=launch(root);
    assert.equal(r.status,1);
    assert.match(r.stderr,/FIRST_FAILING_TAP:\s*not ok 1 - synthetic last-case fault/);
    assert.match(r.stderr,/BLOCKED: source contracts execution failed/);
    assert.doesNotMatch(r.stdout,/>>> GATE gate fail-closed contracts/);
    assert.ok(r.stdout.length < 3000,'must not echo multi-megabyte TAP');
  } finally { rmSync(root,{recursive:true,force:true}); }
});
test('second failing gate does not mark static PASS', () => {
  const root = fixture(false,true);
  try {
    const r=launch(root);
    assert.equal(r.status,1);
    assert.match(r.stdout,/PASS source contracts/);
    assert.match(r.stderr,/FIRST_FAILING_TAP:\s*not ok 1 - second gate synthetic fail/);
    assert.doesNotMatch(r.stdout,/STATIC-ONLY PASS/);
  } finally { rmSync(root,{recursive:true,force:true}); }
});
test('passing static gates exit zero without a database', () => {
  const root = fixture(false,false);
  try {
    const r=launch(root);
    assert.equal(r.status,0);
    assert.match(r.stdout,/STATIC-ONLY PASS/);
    assert.match(r.stdout,/VERIFIED TAP:/);
    assert.doesNotMatch(r.stdout,/PostgreSQL atomic correction/);
  } finally { rmSync(root,{recursive:true,force:true}); }
});
