import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTree, compareTrees, ownership, execute } from './a140-source-preservation.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sha = char => char.repeat(40);
const exportTree = rows => Buffer.from(rows.map(([path, oid, mode = '100644', type = 'blob']) => `${mode} ${type} ${oid}\t${path}\0`).join(''));
const rowsRelease = [
  ['artifacts/tournament-manager/src/App.tsx', sha('a')],
  ['lib/db/migrations/0030_test.sql', sha('b')],
  ['shared/same.js', sha('c')],
  ['pnpm-lock.yaml', sha('d')],
];
const rowsWorkspace = [
  ['artifacts/tournament-manager/src/App.tsx', sha('e')],
  ['lib/db/migrations/0030_test.sql', sha('b')],
  ['shared/same.js', sha('c')],
  ['prototypes/minigames/core-clash/index.html', sha('f')],
];

test('parses valid, unsorted -rz entries with mode and gitlink', () => {
  const map = parseTree(exportTree([['z', sha('0')], ['a', sha('1'), '160000', 'commit']]));
  assert.equal(map.size, 2);
  assert.deepEqual(map.get('a'), { oid: sha('1'), mode: '160000', type: 'commit' });
});

test('rejects truncation, duplicates, path traversal, malformed OID and mode', () => {
  const valid = exportTree([['a', sha('0')]]);
  assert.throws(() => parseTree(valid.subarray(0, -1)), /NUL-terminated/);
  assert.throws(() => parseTree(exportTree([['a', sha('0')], ['a', sha('1')]])), /duplicate/);
  assert.throws(() => parseTree(exportTree([['..\/secret', sha('0')]])), /unsafe/);
  assert.throws(() => parseTree(exportTree([['x', 'z'.repeat(40)]])), /malformed/);
  assert.throws(() => parseTree(exportTree([['x', sha('0'), '160000', 'blob']])), /unsupported/);
});

test('classifies assets, migrations, security, routing and lockfiles before generic paths', () => {
  assert.equal(ownership('prototypes/minigames/core-clash/index.html').protection, 'GAME_LOCK_NO_CHANGE');
  assert.equal(ownership('lib/db/migrations/0040_test.sql').owner, 'A20_A22');
  assert.equal(ownership('artifacts/api-server/src/auth/check.ts').owner, 'A30');
  assert.equal(ownership('artifacts/tournament-manager/src/App.tsx').owner, 'A120_A140');
  assert.equal(ownership('pnpm-lock.yaml').protection, 'DEPENDENCY_LOCK_MANUAL_REVIEW');
  assert.equal(ownership('random/file.ts').protection, 'UNKNOWN_OWNER_MANUAL_REVIEW');
});

test('distinguishes source drift from unchanged paths; never declares sync GO', () => {
  const report = compareTrees(parseTree(exportTree(rowsRelease)), parseTree(exportTree(rowsWorkspace)));
  assert.equal(report.decision, 'HOLD');
  assert.equal(report.no_deploy, true);
  assert.equal(report.published_tree_supplied, false);
  assert.deepEqual(report.counts, { same: 2, modified: 1, workspace_only: 1, release_only: 1, mode_or_type_changed: 0, published_only: 0 });
  assert.deepEqual(report.diff.map(x => x.path), [
    'artifacts/tournament-manager/src/App.tsx',
    'pnpm-lock.yaml',
    'prototypes/minigames/core-clash/index.html',
  ]);
  assert.ok(report.diff.every(x => x.disposition === 'HOLD_NO_AUTOMATIC_COPY'));
  assert.ok(report.blockers.includes('PUBLISHED_ARTIFACT_TREE_NOT_AVAILABLE'));
});

test('published source is a separate third inventory and not inferred from workspace', () => {
  const report = compareTrees(parseTree(exportTree(rowsRelease)), parseTree(exportTree(rowsRelease)), parseTree(exportTree(rowsWorkspace)));
  assert.equal(report.counts.same, 4);
  assert.equal(report.published_tree_supplied, true);
  assert.ok(report.diff.some(x => x.published_vs_workspace === 'different'));
  assert.ok(report.blockers.includes('PUBLISHED_WORKSPACE_SOURCE_DRIFT'));
  assert.equal(report.decision, 'HOLD');
});

test('identifies published-only entries without inventing release-workspace drift', () => {
  const a = parseTree(exportTree([['same.ts', sha('0')]]));
  const published = parseTree(exportTree([['same.ts', sha('0')], ['gone.ts', sha('1')]]));
  const report = compareTrees(a, a, published);
  assert.equal(report.counts.published_only, 1);
  assert.equal(report.counts.modified, 0);
  assert.ok(!report.blockers.includes('RELEASE_WORKSPACE_SOURCE_DRIFT'));
  assert.ok(report.blockers.includes('PUBLISHED_WORKSPACE_SOURCE_DRIFT'));
});

test('records mode change even with identical Git blob SHA', () => {
  const a = parseTree(exportTree([['script.sh', sha('1')]]));
  const b = parseTree(exportTree([['script.sh', sha('1'), '100755']]));
  assert.equal(compareTrees(a, b).counts.mode_or_type_changed, 1);
});

test('CLI reads only explicitly provided local inventory files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'a140-fixture-'));
  try {
    const a = join(dir, 'release.lsz');
    const b = join(dir, 'workspace.lsz');
    writeFileSync(a, exportTree(rowsRelease));
    writeFileSync(b, exportTree(rowsWorkspace));
    const args = ['--release-tree', a, '--release-commit', sha('1'), '--workspace-tree', b, '--workspace-commit', sha('2')];
    const report = execute(args);
    assert.equal(report.refs.github_release_claimed_commit, sha('1'));
    assert.equal(report.changed_path_count, 3);
    assert.throws(() => execute([...args, '--published-commit', sha('3')]), /supplied together/);
    assert.throws(() => execute([...args, '--release-tree', a]), /repeated/);
    assert.throws(() => execute(args.map(x => x === sha('1') ? 'invalid' : x)), /Invalid full SHA/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
