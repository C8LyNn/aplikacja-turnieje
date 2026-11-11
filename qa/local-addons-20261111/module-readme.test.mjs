import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const path = new URL('../../artifacts/tournament-manager/README.md', import.meta.url);
const readme = existsSync(path) ? readFileSync(path, 'utf8') : '';
test('L08: module has its own readme, without replacing root docs', () => {
  assert.ok(existsSync(path), 'Missing module README'); assert.match(readme, /^# Tournament Manager/m);
  assert.match(readme, /Core Clash/);
});
test('L08: setup refers to reviewed local environment and lockfile', () => {
  assert.match(readme, /L00/); assert.match(readme, /Node\.js 22/); assert.match(readme, /pnpm 10/);
  assert.match(readme, /frozen-lockfile/);
});
test('L08: known local commands are explicit and do not deploy', () => {
  for (const script of ['dev', 'typecheck', 'test', 'test:http-routing', 'build'])
    assert.ok(readme.includes(`pnpm --filter @workspace/tournament-manager run ${script}`), script);
  assert.doesNotMatch(readme, /git push|reset --hard|git clean|DROP SCHEMA|DATABASE_URL\s*=|postgres(?:ql)?:\/\//);
});
test('L08: documents actual PORT, BASE_PATH and API proxy configuration', () => {
  assert.match(readme, /PORT/); assert.match(readme, /BASE_PATH/); assert.match(readme, /API_PROXY_TARGET/);
  assert.match(readme, /0\.0\.0\.0/);
});
test('L08: disabled V3 and deployment gates are not described as implemented', () => {
  assert.match(readme, /Backup V3/); assert.match(readme, /wyłączony/);
  assert.match(readme, /LOCAL.*DEV.*PROD/); assert.match(readme, /osobn.*zgod/);
  assert.match(readme, /nie jest/);
});
