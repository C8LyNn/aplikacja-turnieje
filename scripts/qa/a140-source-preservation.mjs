#!/usr/bin/env node
// WEB-005 / A140: compare caller-exported Git tree inventories, without invoking git or mutating a tree.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHA = /^[0-9a-f]{40}$/;
const OPTIONS = new Set([
  '--release-tree', '--workspace-tree', '--published-tree',
  '--release-commit', '--workspace-commit', '--published-commit', '--help',
]);

export function parseTree(buffer, label = 'tree') {
  if (!Buffer.isBuffer(buffer)) throw new TypeError(`${label}: expected a raw Buffer`);
  if (!buffer.length || buffer.at(-1) !== 0) {
    throw new Error(`${label}: expected nonempty NUL-terminated git ls-tree -rz bytes`);
  }
  const items = new Map();
  for (const record of buffer.subarray(0, -1).toString('utf8').split('\0')) {
    const match = /^([0-7]{6}) (blob|commit) ([0-9a-f]{40})\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error(`${label}: malformed ls-tree record`);
    const [, mode, type, oid, path] = match;
    if (!((type === 'blob' && ['100644', '100755', '120000'].includes(mode)) ||
      (type === 'commit' && mode === '160000'))) {
      throw new Error(`${label}: unsupported entry mode/type at ${JSON.stringify(path)}`);
    }
    if (path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..') ||
        path.includes('\ufffd') || path.includes('\\')) {
      throw new Error(`${label}: unsafe/invalid path ${JSON.stringify(path)}`);
    }
    if (items.has(path)) throw new Error(`${label}: duplicate path ${JSON.stringify(path)}`);
    items.set(path, { oid, mode, type });
  }
  return items;
}

function sameEntry(a, b) {
  return Boolean(a && b && a.oid === b.oid && a.mode === b.mode && a.type === b.type);
}

export function ownership(path) {
  if (/(?:^|\/)(?:minigames|games|prototypes|randomizers?|core[-_]?clash|evolution[-_]?runner|unity)(?:\/|$)/i.test(path) ||
      /(?:\.wasm|\.unityweb|WebGL\.(?:data|framework|loader))/i.test(path)) {
    return { owner: 'GAME_OWNER_HQ', protection: 'GAME_LOCK_NO_CHANGE' };
  }
  if (/(?:^|\/)(?:migrations|drizzle)(?:\/|$)|^lib\/db\//i.test(path)) {
    return { owner: 'A20_A22', protection: 'PG16_SQL_HOLD' };
  }
  if (/(?:steam|auth|security|oauth|credential|token|catalog)/i.test(path)) {
    return { owner: 'A30', protection: 'SECURITY_MANUAL_REVIEW' };
  }
  if (/(?:^|\/)(?:App\.tsx|vite\.config\.ts|_redirects|_headers|index\.html|\.replit|replit\.toml|vercel\.json|netlify\.toml)$/.test(path) ||
      /(?:^|\/)portfolio(?:\/|\.|-)/i.test(path)) {
    return { owner: 'A120_A140', protection: 'REPLIT_ROUTING_PRESERVE' };
  }
  if (/^(?:pnpm-lock\.yaml|pnpm-workspace\.yaml|package\.json)$|(?:^|\/)package\.json$/.test(path)) {
    return { owner: 'A140_A40', protection: 'DEPENDENCY_LOCK_MANUAL_REVIEW' };
  }
  return { owner: 'A40_A140', protection: 'UNKNOWN_OWNER_MANUAL_REVIEW' };
}

export function compareTrees(release, workspace, published = null, metadata = {}) {
  const allPaths = [...new Set([...release.keys(), ...workspace.keys(), ...(published?.keys() ?? [])])].sort();
  const diff = [];
  const counts = { same: 0, modified: 0, workspace_only: 0, release_only: 0, mode_or_type_changed: 0, published_only: 0 };
  for (const path of allPaths) {
    const r = release.get(path) ?? null;
    const w = workspace.get(path) ?? null;
    const p = published?.get(path) ?? null;
    let status;
    if (!r && !w && p) status = 'published_only';
    else if (!r && w) status = 'workspace_only';
    else if (r && !w) status = 'release_only';
    else if (sameEntry(r, w)) status = 'same';
    else if (r && w && r.oid === w.oid) status = 'mode_or_type_changed';
    else status = 'modified';
    counts[status]++;
    if (status === 'same' && (!published || sameEntry(r, p))) continue;
    diff.push({
      path,
      status,
      ...ownership(path),
      release: r,
      workspace: w,
      ...(published ? { published: p, published_vs_workspace: sameEntry(p, w) ? 'same' : 'different' } : {}),
      disposition: 'HOLD_NO_AUTOMATIC_COPY',
    });
  }
  const blockers = ['OPERATOR_EXPORTED_TREES_NOT_INDEPENDENTLY_ATTESTED'];
  if (!published) blockers.push('PUBLISHED_ARTIFACT_TREE_NOT_AVAILABLE');
  if (['modified', 'workspace_only', 'release_only', 'mode_or_type_changed'].some(k => counts[k] > 0)) blockers.push('RELEASE_WORKSPACE_SOURCE_DRIFT');
  if (published && diff.some(row => row.published_vs_workspace === 'different')) blockers.push('PUBLISHED_WORKSPACE_SOURCE_DRIFT');
  return {
    schema: 'WEB-005-A140-SOURCE-PRESERVATION-V1',
    generated_by: 'offline-read-only-git-tree-comparator',
    input_attestation: 'OPERATOR_EXPORTED_UNVERIFIED',
    refs: metadata,
    published_tree_supplied: Boolean(published),
    decision: 'HOLD',
    no_sync: true,
    no_deploy: true,
    no_sql: true,
    counts,
    changed_path_count: diff.length,
    blockers,
    diff,
    caveat: 'A Git tree inventory is not an independently verified deployed build or migration ledger; no diff count proves the historic 140-path claim.',
  };
}

function argsOf(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i];
    if (!OPTIONS.has(name) || Object.hasOwn(result, name)) throw new Error(`Unknown/repeated option ${name}`);
    if (name === '--help') { result[name] = true; continue; }
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${name}`);
    result[name] = argv[++i];
  }
  return result;
}

export function execute(argv) {
  const args = argsOf(argv);
  if (args['--help']) {
    return 'Usage: node scripts/qa/a140-source-preservation.mjs --release-tree RELEASE.lsz --release-commit SHA --workspace-tree REPLIT.lsz --workspace-commit SHA [--published-tree PUBLISHED.lsz --published-commit SHA]\nInputs: raw git ls-tree -rz exports; output: JSON to stdout; exit 2 means HOLD. Never deploys, synchronizes or writes.\n';
  }
  for (const name of ['--release-tree', '--release-commit', '--workspace-tree', '--workspace-commit']) {
    if (!args[name]) throw new Error(`Missing required ${name}`);
  }
  if (Boolean(args['--published-tree']) !== Boolean(args['--published-commit'])) {
    throw new Error('Published tree and published commit must be supplied together');
  }
  for (const name of ['--release-commit', '--workspace-commit', '--published-commit']) {
    if (args[name] && !SHA.test(args[name])) throw new Error(`Invalid full SHA for ${name}`);
  }
  const release = parseTree(readFileSync(args['--release-tree']), 'release');
  const workspace = parseTree(readFileSync(args['--workspace-tree']), 'workspace');
  const published = args['--published-tree'] ? parseTree(readFileSync(args['--published-tree']), 'published') : null;
  return compareTrees(release, workspace, published, {
    github_release_claimed_commit: args['--release-commit'],
    replit_workspace_claimed_commit: args['--workspace-commit'],
    ...(args['--published-commit'] ? { published_claimed_commit: args['--published-commit'] } : {}),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const report = execute(process.argv.slice(2));
    if (typeof report === 'string') process.stdout.write(report);
    else {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = 2; // explicit HOLD; not a negative test result
    }
  } catch (error) {
    process.stderr.write(`A140_INPUT_ERROR: ${error.message}\n`);
    process.exitCode = 64;
  }
}
