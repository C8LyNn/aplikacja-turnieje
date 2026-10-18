import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStaticRoute, STATIC_ROUTE_POLICY_VERSION } from './static-route-policy.mjs';

const realFiles = new Set([
  '/index.html',
  '/portfolio/index.html',
  '/portfolio/projects/index.html',
  '/portfolio/src/styles.css',
  '/stream/animated-effects/index.html',
  '/stream/animated-effects/assets/index-CQVbN-Tt.js',
  '/prototypes/minigames/core-clash-unity/index.html',
  '/prototypes/minigames/core-clash-unity/Build/WebGL.wasm',
  '/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js',
]);
const exists = path => realFiles.has(path);
const check = (path, expected) => assert.deepEqual(resolveStaticRoute(path, exists), expected);

test('version and existing static assets win ahead of any SPA fallback', () => {
  assert.equal(STATIC_ROUTE_POLICY_VERSION, 'WEB005-ISSUE70-V1');
  for (const path of realFiles) check(path, { kind: 'static', path });
});

test('all missing static extensions return 404 decisions, never HTML200 fallback', () => {
  for (const path of ['/fonts/valvepulp-bold.ttf', '/bad-build/WebGL.wasm', '/assets/old.js',
    '/assets/old.css', '/assets/old.json', '/portfolio/assets/missing.png',
    '/stream/animated-effects/assets/missing.js', '/unseen/old.html',
    '/__r23d_probe_absent__/missing-font.ttf']) {
    check(path, { kind: 'not_found', path });
  }
});

test('real static directory roots and aliases work only when index exists', () => {
  for (const [alias, file] of [
    ['/portfolio', '/portfolio/index.html'], ['/portfolio/', '/portfolio/index.html'],
    ['/portfolio/projects', '/portfolio/projects/index.html'],
    ['/portfolio/projects/', '/portfolio/projects/index.html'],
    ['/stream/animated-effects', '/stream/animated-effects/index.html'],
    ['/stream/animated-effects/', '/stream/animated-effects/index.html'],
  ]) check(alias, { kind: 'static', path: file });
  assert.deepEqual(resolveStaticRoute('/portfolio/', () => false), {
    kind: 'not_found', path: '/portfolio/',
  });
});

test('legacy dev Animated Effects is not redirected to an artifact that may be absent', () => {
  for (const p of ['/dev/animated-effects', '/dev/animated-effects/']) {
    check(p, { kind: 'not_found', path: p });
  }
});

test('Wouter SPA deep routes continue to work on hard reload', () => {
  for (const p of ['/tournaments/101/bracket', '/tournaments/101/host',
    '/minigames', '/minigames/evolution', '/stream', '/stream/overlay/camera-chat',
    '/experimental/tournaments/123/audience', '/ludology/game-classification/search',
    '/anything-that-wouter-will-404']) {
    check(p, { kind: 'spa', path: '/index.html' });
  }
});

test('do not send API, unknown portfolio or game-static requests to the SPA', () => {
  for (const p of ['/api/healthz', '/api/tournaments', '/portfolio/does-not-exist',
    '/prototypes/minigames/missing', '/assets/missing', '/stream/animated-effects/missing']) {
    check(p, { kind: 'not_found', path: p });
  }
});

test('query strings do not influence asset routing', () => {
  check('/assets/missing.js?v=2', { kind: 'not_found', path: '/assets/missing.js' });
  check('/tournaments/1/bracket?tab=groups', { kind: 'spa', path: '/index.html' });
  check('/portfolio/?tag=all', { kind: 'static', path: '/portfolio/index.html' });
});

test('encoded extension cannot bypass classification', () => {
  check('/fonts/missing%2Ettf', { kind: 'not_found', path: '/fonts/missing.ttf' });
  check('/assets/old%2Ejs', { kind: 'not_found', path: '/assets/old.js' });
});

test('invalid or traversal paths cannot reach SPA shell', () => {
  for (const p of ['//etc/passwd', 'relative.js', '/assets/%2e%2e/private.js',
    '/%2e%2e/secrets', '/foo%2fbar', '/a%5cb', '/bad%GG', '/a/./b']) {
    const result = resolveStaticRoute(p, exists);
    assert.equal(result.kind, 'invalid_path', p);
  }
});

test('the module makes no filesystem changes and reports caller-visible outcomes', () => {
  let inspected = 0;
  const one = resolveStaticRoute('/missing-font.ttf', () => { inspected++; return false; });
  assert.deepEqual(one, { kind: 'not_found', path: '/missing-font.ttf' });
  assert.equal(inspected, 1);
  assert.throws(() => resolveStaticRoute('/asset', undefined), /exists\(path\)/);
});
