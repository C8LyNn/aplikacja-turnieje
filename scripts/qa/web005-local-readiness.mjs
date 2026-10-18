// WEB-005 / A20 WAVE4 — read-only, zero-dependency DB-free source preflight.
// NEVER starts the app, probes a database, writes files or installs dependencies.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = {
  root: 'package.json',
  api: 'artifacts/api-server/package.json',
  frontend: 'artifacts/tournament-manager/package.json',
  db: 'lib/db/package.json',
  workspace: 'pnpm-workspace.yaml',
  lock: 'pnpm-lock.yaml',
  vite: 'artifacts/tournament-manager/vite.config.ts',
};
const NAMES = new Set([
  'DATABASE_URL','TEST_DATABASE_URL','NEON_DATABASE_URL','DIRECT_URL',
  'DEPLOYMENT_TASK','API_PROXY_TARGET',
  'DEVELOPMENT_DATABASE_URL','PRODUCTION_DATABASE_URL',
  'NODE_OPTIONS','NODE_PATH','REPL_ID',
]);
const PREFIXES = ['PG','SCHEMA_COMPARE_','DOTENV_CONFIG_','REPLIT_'];
const DIRS = ['', 'artifacts/api-server', 'artifacts/tournament-manager', 'lib/db'];
const SECRET_FILES = ['.env','.env.local','.env.development','.env.production','.pgpass','.pg_service.conf'];
const DB_FREE_CANDIDATES = [
  'pnpm --filter @workspace/api-server run test:deadlock-game-catalog',
  'pnpm --filter @workspace/api-server run test:marvel',
  'pnpm --filter @workspace/db run test:schema-catalog-comparison',
  'node --test lib/db/test/development-reset-config.test.mjs',
  'pnpm run typecheck',
];

function readSource(root, relative) {
  const full = join(root, relative);
  if (!existsSync(full)) return { error: 'MISSING' };
  try {
    if (!lstatSync(full).isFile()) return { error: 'NOT_REGULAR_FILE' };
    return { content: readFileSync(full, 'utf8') };
  } catch { return { error: 'UNREADABLE' }; }
}

export function inspectLocalReadiness({
  root = process.cwd(), env = process.env, nodeVersion = process.versions.node,
} = {}) {
  const projectRoot = resolve(root);
  const checks = [];
  const add = (id, status, detail) => checks.push({ id, status, detail });
  const raw = {}, manifests = {};
  for (const [id, rel] of Object.entries(FILES)) {
    const item = readSource(projectRoot, rel);
    if (item.error) { add('source.' + id, 'FAIL', rel + ': ' + item.error); continue; }
    raw[id] = item.content;
    if (['root','api','frontend','db'].includes(id)) {
      try { manifests[id] = JSON.parse(item.content); }
      catch { add('source.' + id, 'FAIL', rel + ': INVALID_JSON'); }
    }
  }
  const expected = {
    root: 'workspace', api: '@workspace/api-server',
    frontend: '@workspace/tournament-manager', db: '@workspace/db',
  };
  for (const [id, name] of Object.entries(expected)) {
    if (!manifests[id]) continue;
    add('package.' + id, manifests[id].name === name ? 'PASS' : 'FAIL',
      FILES[id] + ': ' + (manifests[id].name === name ? 'EXPECTED_NAME' : 'PACKAGE_NAME_DRIFT'));
  }
  if (raw.workspace) {
    add('workspace', /minimumReleaseAge:\s*1440\b/.test(raw.workspace)
      && /autoInstallPeers:\s*false\b/.test(raw.workspace) ? 'PASS' : 'WARN',
      'Workspace supply-chain constraints; lock is the source of resolved dependencies');
  }
  let lockSha256 = null;
  if (raw.lock) {
    lockSha256 = createHash('sha256').update(raw.lock, 'utf8').digest('hex');
    add('lock', /^lockfileVersion:\s*['"]?9\.0['"]?/m.test(raw.lock) ? 'PASS' : 'FAIL',
      'Expected pnpm lockfile v9; raw SHA256 supplied separately');
  }
  if (Object.keys(expected).every(id => manifests[id])) {
    const scripts = manifests.root.scripts?.test?.includes('@workspace/api-server')
      && manifests.api.scripts?.test?.includes('test:integration')
      && manifests.api.scripts?.['test:unit']
      && manifests.api.scripts?.['test:integration'];
    add('scripts', scripts ? 'PASS' : 'FAIL',
      scripts ? 'Root pnpm test includes DB integration: use targeted DB-free tests'
        : 'Source scripts changed; review commands before executing anything');
  }
  const major = Number(String(nodeVersion).split('.')[0]);
  add('node', major === 22 ? 'PASS' : 'WARN',
    'Observed Node major ' + (Number.isFinite(major) ? major : 'UNKNOWN') + '; expected 22');
  const tainted = Object.keys(env).filter(k =>
    NAMES.has(k) || PREFIXES.some(prefix => k.startsWith(prefix))).sort();
  add('environment', tainted.length ? 'FAIL' : 'PASS',
    tainted.length ? 'Unsafe variable NAMES: ' + tainted.join(', ') + ' (values NEVER inspected)'
      : 'No inherited database/cloud/loader override variable names');
  const secretPaths = [];
  for (const dir of DIRS) for (const name of SECRET_FILES) {
    const relative = dir ? dir + '/' + name : name;
    if (existsSync(join(projectRoot, relative))) secretPaths.push(relative);
  }
  add('secret_files', secretPaths.length ? 'FAIL' : 'PASS',
    secretPaths.length ? 'Local secret paths: ' + secretPaths.join(', ') + ' (contents NOT read)'
      : 'No local .env/.pgpass at inspected paths');
  if (raw.vite) {
    const exposed = /host:\s*['"]0\.0\.0\.0['"]/.test(raw.vite)
      || /allowedHosts:\s*true\b/.test(raw.vite);
    add('frontend_bind', exposed ? 'WARN' : 'PASS',
      exposed ? 'Vite source may expose dev server on LAN; require reviewed loopback-only override'
        : 'No known broad Vite bind pattern');
  }
  const installMarker = existsSync(join(projectRoot, 'node_modules', '.modules.yaml'));
  add('dependencies', 'WARN', installMarker
    ? 'pnpm installation marker exists; actual dependency/lock parity NOT TESTED'
    : 'No pnpm installation marker; dependencies must be prepared under separate approval');
  const failures = checks.filter(item => item.status === 'FAIL');
  return {
    project: 'WEB-005', mode: 'READ_ONLY_DB_FREE',
    status: failures.length ? 'BLOCKED' : 'SOURCE_PREFLIGHT_OK_DB_FREE_ONLY',
    pg16IntegrationAuthorized: false,
    root: projectRoot, lockSha256, checks,
    dbFreeCandidatesNotExecuted: DB_FREE_CANDIDATES,
    notice: 'This preflight performs no network, SQL, Docker, install, build, tests or app launch.',
  };
}
function parseArgs(args) {
  let root = process.cwd(), json = false;
  for (const arg of args) {
    if (arg === '--json') json = true;
    else if (arg.startsWith('--root=')) root = arg.slice('--root='.length);
    else throw Error('Usage: node scripts/qa/web005-local-readiness.mjs [--root=PATH] [--json]');
  }
  return { root, json };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = inspectLocalReadiness({ root: args.root });
    if (args.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    else {
      process.stdout.write('WEB-005 readiness: ' + report.status + '\n');
      for (const row of report.checks)
        process.stdout.write(row.status + ': ' + row.id + ' — ' + row.detail + '\n');
      if (report.lockSha256) process.stdout.write('pnpm-lock SHA256: ' + report.lockSha256 + '\n');
      process.stdout.write('PG16 integration: NOT AUTHORIZED by this preflight\n');
    }
    if (report.status === 'BLOCKED') process.exitCode = 2;
  } catch (error) {
    process.stderr.write(String(error?.message || error) + '\n');
    process.exitCode = 2;
  }
}
