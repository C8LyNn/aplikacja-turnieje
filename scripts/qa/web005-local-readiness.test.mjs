// A20 WAVE4 — all tests use synthetic local fixtures; no Docker, PG16 or network.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { inspectLocalReadiness } from './web005-local-readiness.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'web005-a20-wave4-'));
  const jsons = {
    'package.json': {name:'workspace', scripts:{test:'pnpm --filter @workspace/api-server run test'}},
    'artifacts/api-server/package.json': {name:'@workspace/api-server', scripts:{
      test:'pnpm run test:unit && pnpm run test:integration',
      'test:unit':'node unit', 'test:integration':'node integration',
    }},
    'artifacts/tournament-manager/package.json': {name:'@workspace/tournament-manager'},
    'lib/db/package.json': {name:'@workspace/db'},
  };
  for (const [rel,data] of Object.entries(jsons)) {
    const path = join(root,rel);
    mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,JSON.stringify(data));
  }
  writeFileSync(join(root,'pnpm-workspace.yaml'),'minimumReleaseAge: 1440\nautoInstallPeers: false\n');
  writeFileSync(join(root,'pnpm-lock.yaml'),"lockfileVersion: '9.0'\n");
  const vite = join(root,'artifacts/tournament-manager/vite.config.ts');
  writeFileSync(vite,"server: { host: '0.0.0.0', allowedHosts: true }");
  try { return run({root,vite}); }
  finally { rmSync(root,{recursive:true,force:true}); }
}
function check(result,id) { return result.checks.find(row => row.id === id); }
const inspect = (root,env={},nodeVersion='22.23.3') =>
  inspectLocalReadiness({root,env,nodeVersion});

test('synthetic source ready means DB-FREE ONLY and no PG authorization',()=>fixture(({root})=>{
  const r=inspect(root);
  assert.equal(r.status,'SOURCE_PREFLIGHT_OK_DB_FREE_ONLY');
  assert.equal(r.pg16IntegrationAuthorized,false);
  assert.equal(check(r,'frontend_bind').status,'WARN');
  assert.match(r.lockSha256,/^[0-9a-f]{64}$/);
}));
test('no lock file is blocked',()=>fixture(({root})=>{
  rmSync(join(root,'pnpm-lock.yaml'));
  const r=inspect(root);
  assert.equal(r.status,'BLOCKED');
  assert.equal(check(r,'source.lock').status,'FAIL');
}));
test('lockfile version drift is blocked',()=>fixture(({root})=>{
  writeFileSync(join(root,'pnpm-lock.yaml'),"lockfileVersion: '6.0'\n");
  assert.equal(check(inspect(root),'lock').status,'FAIL');
}));
test('production DB URL is denied without secret value disclosure',()=>fixture(({root})=>{
  const secret='POSTGRES_SECRET_NEVER_PRINT';
  const r=inspect(root,{DATABASE_URL:'postgres://prod:'+secret+'@remote.invalid/db'});
  assert.equal(r.status,'BLOCKED');
  assert.equal(check(r,'environment').status,'FAIL');
  assert.doesNotMatch(JSON.stringify(r),/POSTGRES_SECRET_NEVER_PRINT/);
}));
test('libpq and child compare overrides fail closed',()=>fixture(({root})=>{
  const r=inspect(root,{PGSERVICEFILE:'a',SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL:'b',NODE_OPTIONS:'--import=bad.mjs'});
  assert.equal(r.status,'BLOCKED');
  assert.match(check(r,'environment').detail,/PGSERVICEFILE/);
}));
test('local .env path blocks without reading file content',()=>fixture(({root})=>{
  writeFileSync(join(root,'artifacts/api-server/.env'),'SECRET_NO_LOG=NO_LOG_THIS_VALUE');
  const r=inspect(root);
  assert.equal(r.status,'BLOCKED');
  assert.equal(check(r,'secret_files').status,'FAIL');
  assert.doesNotMatch(JSON.stringify(r),/NO_LOG_THIS_VALUE/);
}));
test('broken JSON is blocked',()=>fixture(({root})=>{
  writeFileSync(join(root,'artifacts/api-server/package.json'),'{bad');
  assert.equal(check(inspect(root),'source.api').status,'FAIL');
}));
test('package name drift is blocked',()=>fixture(({root})=>{
  const path=join(root,'artifacts/api-server/package.json');
  const pkg=JSON.parse(readFileSync(path,'utf8'));
  pkg.name='@wrong/api';
  writeFileSync(path,JSON.stringify(pkg));
  assert.equal(check(inspect(root),'package.api').status,'FAIL');
}));
test('API test script drift blocks',()=>fixture(({root})=>{
  const path=join(root,'artifacts/api-server/package.json');
  const pkg=JSON.parse(readFileSync(path,'utf8'));
  pkg.scripts.test='node unit';
  writeFileSync(path,JSON.stringify(pkg));
  assert.equal(check(inspect(root),'scripts').status,'FAIL');
}));
test('Node20 mismatch remains explicit warning',()=>fixture(({root})=>{
  const r=inspect(root,{},'20.11.0');
  assert.equal(check(r,'node').status,'WARN');
  assert.equal(r.pg16IntegrationAuthorized,false);
}));
test('Vite bound to loopback does not trigger exposure warning',()=>fixture(({root,vite})=>{
  writeFileSync(vite,"server: { host: '127.0.0.1', allowedHosts: ['localhost'] }");
  assert.equal(check(inspect(root),'frontend_bind').status,'PASS');
}));

test('API DEPLOYMENT_TASK cannot be inherited by a DB-free preflight',()=>fixture(({root})=>{
  const value='series_v1_reset';
  const r=inspect(root,{DEPLOYMENT_TASK:value});
  assert.equal(r.status,'BLOCKED');
  assert.equal(check(r,'environment').status,'FAIL');
  assert.match(check(r,'environment').detail,/DEPLOYMENT_TASK/);
  assert.equal(r.pg16IntegrationAuthorized,false);
}));
test('API_PROXY_TARGET cannot redirect local frontend to external API',()=>fixture(({root})=>{
  const secret='https://external.example.invalid/private-secret';
  const r=inspect(root,{API_PROXY_TARGET:secret});
  assert.equal(r.status,'BLOCKED');
  assert.match(check(r,'environment').detail,/API_PROXY_TARGET/);
  assert.doesNotMatch(JSON.stringify(r),/private-secret/);
}));
