#!/usr/bin/env node
/**
 * WEB-005 / A20 / R23F: source/environment OFFLINE preflight only.
 * NEVER contacts a database, creates a process, performs SQL/DDL, resets, or writes a file.
 * This script CANNOT issue an owner GO or prove physical isolation.
 * Proposed (NOT executed by A20): node PG16_OFFLINE_PREFLIGHT.mjs <EXACT_C01_CHECKOUT>
 * Exit 0 means ONLY local source bytes and nonsecret env shape passed; DB execution remains FORBIDDEN.
 */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const requiredSha = 'fa3261b2c9510e110ac9eba21726812d3401a525';
const expected = Object.freeze({
  'qa/pack17/gate-contract.mjs': 'eae350a60a684d7b14af3e481baf7bd6c4a2b2fc',
  'artifacts/api-server/test/test-database.ts': '31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6',
  'artifacts/api-server/test/run-tests.ts': 'da4188446aba4696f97eb7831fee0cc5824d212f',
  'artifacts/api-server/test/test-discovery.ts': 'dd427fdafa92c089e2edad704079d81945c4b1c1',
  'artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts':
    '6c6bd054e0f6affd5d07e63ee396f5a14b423fc4',
  'artifacts/api-server/package.json': 'bf931f87a7b0d5532b949f44c7e091878fe6db52',
  '.github/workflows/tournament-correction-ci.yml': 'e8b70393d311cd80c32ef78b2c16ac7b87d5ec63',
});
const expectedLockSha256 = '8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef';
const checks = [];
function record(id,ok,detail) { checks.push({id,status:ok?'SOURCE_CHECK_PASS':'STOP',detail}); }
function checkedFile(root,relative) {
  const full = path.resolve(root, ...relative.split('/'));
  if (!full.startsWith(root + path.sep)) throw new Error('PATH_OUTSIDE_ROOT');
  if (!statSync(full).isFile()) throw new Error('NOT_REGULAR_FILE');
  return readFileSync(full);
}
function digest(buf,algo) { return createHash(algo).update(buf).digest('hex'); }
const root = path.resolve(process.argv[2] ?? '.');
for (const [name,sha] of Object.entries(expected)) {
  try {
    const buf=checkedFile(root,name);
    const rawGitBlob=createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
    record('BLOB:'+name,rawGitBlob===sha,rawGitBlob===sha?'SOURCE_GIT_BLOB_MATCH':'SOURCE_GIT_BLOB_MISMATCH');
  } catch (e) {record('BLOB:'+name,false,'SOURCE_FILE_UNAVAILABLE_OR_UNSAFE');}
}
try {
  const lock=checkedFile(root,'pnpm-lock.yaml');
  record('LOCK_SHA256',digest(lock,'sha256')===expectedLockSha256,
    digest(lock,'sha256')===expectedLockSha256?'LOCK_MATCH':'LOCK_MISMATCH');
} catch (e) {record('LOCK_SHA256',false,'LOCK_UNAVAILABLE');}

const env=process.env;
record('NODE_ENV',env.NODE_ENV==='test','NODE_ENV_MUST_BE_test');
record('RESET_CONSENT_FORMAT',env.TEST_DATABASE_RESET==='DROP_TM_TEST_SCHEMA',
  'FORMAT_CHECK_ONLY__DOES_NOT_AUTHORIZE_RESET');
record('DB_PARENT_UNSET',!env.DATABASE_URL,'INHERITED_DATABASE_URL_FORBIDDEN');
record('CATALOG_SIDECHANNELS_UNSET',[
  'SCHEMA_COMPARE_TEST_DEVELOPMENT_DATABASE_URL','SCHEMA_COMPARE_TEST_PRODUCTION_DATABASE_URL',
  'SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL','SCHEMA_COMPARE_PRODUCTION_DATABASE_URL',
  'SCHEMA_COMPARE_TEST_CONFIRM','PGSERVICE','PGHOST','PGPORT','PGDATABASE','PGUSER',
  'PGPASSWORD','PGPASSFILE',
].every(k=>!env[k]),'NO_SECONDARY_DB_ENDPOINTS_OR_PG_ENV');
const schema=env.TEST_DATABASE_SCHEMA??'';
record('SCHEMA_SHAPE',/^tm_test_[a-z0-9_]+$/.test(schema),'MUST_MATCH_tm_test_STAR');

let urlOK=false;
try {
  const u=new URL(env.TEST_DATABASE_URL??'');
  const name=decodeURIComponent(u.pathname.replace(/^\//,''));
  urlOK=['postgres:','postgresql:'].includes(u.protocol)
    && ['127.0.0.1','localhost','::1'].includes(u.hostname)
    && /^[0-9]+$/.test(u.port)
    && Number(u.port)!==5432 && Number(u.port)>1024 && Number(u.port)<=65535
    && name.toLowerCase().includes('test')
    && !/prod/i.test(u.hostname+'/'+name)
    && !u.hash && !u.searchParams.has('service') && !u.searchParams.has('hostaddr');
} catch {}
record('TEST_DATABASE_URL_SHAPE',urlOK,'STRUCTURE_ONLY__NO_CONNECTION__NO_SECRET_EMITTED');

// No input value is used as a database contact. No claim that host, PID, PGDATA,
// volume, network namespace, role privileges, data emptiness, or 3 signed approvals are proven.
const failures=checks.filter(x=>x.status==='STOP');
console.log(JSON.stringify({
  task:'WEB-005-T020-A20-R23F-PG16-INTEGRATION-PREFLIGHT',
  source_required_sha:requiredSha,
  source_commit_verification:'MUST_BE_MANUALLY_VERIFIED_BY_GIT_REV_PARSE_HEAD',
  script_mode:'OFFLINE_READ_ONLY',
  checks,failures:failures.length,
  physical_isolation:'UNVERIFIED_BY_OFFLINE_SCRIPT',
  owner_approval:'NOT_VERIFIED_BY_OFFLINE_SCRIPT',
  schema_reset_approval:'NOT_VERIFIED_BY_OFFLINE_SCRIPT',
  three_database_create_drop_approval:'NOT_VERIFIED_BY_OFFLINE_SCRIPT',
  decision:'PG16_EXECUTION_NOT_AUTHORIZED',
  warning:'Exit 0 never authorizes SQL, PostgreSQL startup, database test, or reset.'
},null,2));
process.exitCode=failures.length?2:0;
