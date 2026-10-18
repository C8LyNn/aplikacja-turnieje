import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStaticRoute } from './static-route-policy.mjs';

// Contract decision: the route classifier is synchronous. Promise/thenable
// existence probes are unsupported and MUST fail closed; async true cannot
// authorize assets, and async false cannot bypass the missing-asset 404.
const absentAssets = [
  '/fonts/missing.ttf',
  '/assets/missing.js',
  '/prototypes/missing.wasm',
];

test('W5R-ASYNC-01: Promise(false) cannot turn missing TTF/JS/WASM into a static 200', () => {
  for (const path of absentAssets) {
    assert.deepEqual(resolveStaticRoute(path, async () => false), { kind: 'not_found', path });
  }
});

test('W5R-ASYNC-02: Promise(true) cannot authorize any file or extensionless SPA route', () => {
  for (const path of ['/portfolio/src/main.js', '/tournaments/42/bracket']) {
    assert.deepEqual(resolveStaticRoute(path, async () => true), { kind: 'not_found', path });
  }
});

test('W5R-ASYNC-03: async directory existence probes must deny, not route portfolio or stream', () => {
  const files = new Set(['/portfolio/index.html', '/stream/animated-effects/index.html']);
  for (const path of ['/portfolio/', '/stream/animated-effects/']) {
    assert.deepEqual(resolveStaticRoute(path, file => Promise.resolve(files.has(file))), {
      kind: 'not_found', path,
    });
  }
});

test('W5R-ASYNC-04: foreign thenable cannot masquerade as truthy file existence', () => {
  const path = '/assets/missing.js';
  const thenable = { then(resolve) { resolve(false); } };
  assert.deepEqual(resolveStaticRoute(path, () => thenable), { kind: 'not_found', path });
});

test('W5R-ASYNC-05: synchronous true/false checks retain original policy', () => {
  const files = new Set(['/portfolio/index.html', '/assets/real.js']);
  const exists = p => files.has(p);
  assert.deepEqual(resolveStaticRoute('/portfolio/', exists), {
    kind: 'static', path: '/portfolio/index.html',
  });
  assert.deepEqual(resolveStaticRoute('/assets/real.js', exists), {
    kind: 'static', path: '/assets/real.js',
  });
  assert.deepEqual(resolveStaticRoute('/fonts/missing.ttf', exists), {
    kind: 'not_found', path: '/fonts/missing.ttf',
  });
  assert.deepEqual(resolveStaticRoute('/tournaments/42/bracket', exists), {
    kind: 'spa', path: '/index.html',
  });
});

test('W5R-ASYNC-06: synchronous predicate failures never serve an unverified asset', () => {
  for (const path of ['/assets/missing.js', '/portfolio/', '/tournaments/42/bracket']) {
    assert.deepEqual(resolveStaticRoute(path, () => { throw new Error('storage probe failed'); }), {
      kind: 'not_found', path,
    });
  }
});

test('W5R-ASYNC-07: async existence rejection fails closed without unhandledRejection', async () => {
  const path = '/assets/missing.js';
  const result = resolveStaticRoute(path, async () => { throw new Error('synthetic IO denial'); });
  assert.deepEqual(result, { kind: 'not_found', path });
  await new Promise(resolve => setImmediate(resolve));
});
