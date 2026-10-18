/**
 * WEB-005 / A120 / WAVE 2 — transport-level regression harness for PR #103.
 *
 * A synthetic HTTP server delegates every decision to the unchanged PR103
 * route classifier. This verifies HTTP status, content-type, first-load,
 * refresh, query-string retention and asset failures. It DOES NOT mount React,
 * prove authorization/standings data, or configure Replit production routing.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolveStaticRoute } from './static-route-policy.mjs';

const document = '<!doctype html><html><body><div id="root"></div></body></html>';
const portfolio = '<!doctype html><html><title>Portfolio</title><main>PORTFOLIO</main></html>';
const animated = '<!doctype html><html><title>Animated Effects</title><main>ANIMATED EFFECTS</main></html>';
const wasm = Buffer.from([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0]);
// Binary and JS below are TEST FIXTURES, never built/copy-pasted game assets.
const files = new Map([
  ['/index.html', { type: 'text/html; charset=utf-8', data: document }],
  ['/portfolio/index.html', { type: 'text/html; charset=utf-8', data: portfolio }],
  ['/portfolio/projects/index.html', { type: 'text/html; charset=utf-8', data: '<!doctype html><title>Projects</title><main>PORTFOLIO PROJECTS</main>' }],
  ['/stream/animated-effects/index.html', { type: 'text/html; charset=utf-8', data: animated }],
  ['/stream/animated-effects/assets/index-CQVbN-Tt.js', { type: 'application/javascript', data: 'console.log("fixture");' }],
  ['/prototypes/minigames/core-clash-unity/index.html', { type: 'text/html; charset=utf-8', data: '<!doctype html><title>Unity fixture</title>' }],
  ['/prototypes/minigames/core-clash-unity/Build/WebGL.wasm', { type: 'application/wasm', data: wasm }],
  ['/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js', { type: 'application/javascript', data: 'console.log("loader fixture");' }],
]);

let server;
let origin;
const requests = [];
before(async () => {
  server = createServer((request, response) => {
    const raw = request.url ?? '/';
    const outcome = resolveStaticRoute(raw, pathname => files.has(pathname));
    requests.push({ method: request.method, raw, ...outcome });
    response.setHeader('x-fixture-original-target', raw);
    response.setHeader('x-fixture-route-kind', outcome.kind);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { 'Content-Type': 'text/plain' });
      response.end();
      return;
    }
    if (outcome.kind === 'invalid_path' || outcome.kind === 'not_found') {
      response.writeHead(outcome.kind === 'not_found' ? 404 : 400, { 'Content-Type': 'text/plain' });
      response.end(request.method === 'HEAD' ? undefined : 'Not Found');
      return;
    }
    const entry = files.get(outcome.path);
    assert.ok(entry, `synthetic source file must exist: ${outcome.path}`);
    response.writeHead(200, { 'Content-Type': entry.type, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : entry.data);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

const get = (path, method = 'GET') => fetch(new URL(path, origin), { method, redirect: 'manual', signal: AbortSignal.timeout(4000) });

async function verifySpaReload(path) {
  // Two independent HTTP document loads emulate direct-open followed by F5.
  for (const step of ['direct-open', 'reload']) {
    const response = await get(path);
    assert.equal(response.status, 200, `${step} ${path}`);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/i);
    assert.equal(response.headers.get('x-fixture-route-kind'), 'spa');
    assert.equal(response.headers.get('x-fixture-original-target'), path, 'query must survive server routing');
    assert.match(await response.text(), /id="root"/, `${step} ${path}: React mount document`);
  }
}

const spaRoutes = [
  '/tournaments/42/bracket',
  '/tournaments/42?tab=standings',
  '/tournaments/42?tab=bracket',
  '/tournaments/42/host?tab=tabela',
  '/tournaments/42/audience?section=standings',
  '/tournaments/42/audience?section=bracket',
  '/tournaments/42/projector',
  '/experimental/tournaments/42/bracket',
  '/experimental/tournaments/42/audience?section=standings',
  '/stream',
  '/stream/overlay/camera-chat',
  '/developer/overlay/camera-chat',
];

test('WAVE2-01: organizer bracket + standings query survive direct-open and F5', async () => {
  for (const route of spaRoutes.slice(0, 4)) await verifySpaReload(route);
});

test('WAVE2-02: audience standings, bracket and projector survive direct-open and F5', async () => {
  for (const route of spaRoutes.slice(4, 7)) await verifySpaReload(route);
});

test('WAVE2-03: experimental bracket/audience mode retains path and query across F5', async () => {
  for (const route of spaRoutes.slice(7, 9)) await verifySpaReload(route);
});

test('WAVE2-04: stream and OBS-style overlay URLs survive direct-open and F5', async () => {
  for (const route of spaRoutes.slice(9)) await verifySpaReload(route);
});

test('WAVE2-05: standalone portfolio and Animated Effects static indexes stay actual documents', async () => {
  for (const [path, marker] of [['/portfolio/', /PORTFOLIO/], ['/portfolio/projects/', /PORTFOLIO PROJECTS/],
    ['/stream/animated-effects/', /ANIMATED EFFECTS/]]) {
    for (let refresh = 0; refresh < 2; refresh++) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('x-fixture-route-kind'), 'static');
      assert.match(await response.text(), marker);
    }
  }
});

test('WAVE2-06: valid JS and WASM assets are not served as HTML', async () => {
  for (const [path, mime] of [
    ['/prototypes/minigames/core-clash-unity/Build/WebGL.wasm', 'application/wasm'],
    ['/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js', 'application/javascript'],
    ['/stream/animated-effects/assets/index-CQVbN-Tt.js', 'application/javascript'],
  ]) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') ?? '', new RegExp(mime));
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 0);
    if (path.endsWith('.wasm')) assert.equal(bytes.subarray(0, 4).toString('hex'), '0061736d');
    else assert.doesNotMatch(bytes.toString('utf8'), /<!doctype html>/i);
  }
});

test('WAVE2-07: missing font/wasm/js never resolves to SPA 200', async () => {
  for (const path of ['/fonts/valvepulp-bold.ttf', '/prototypes/minigames/missing.wasm',
    '/stream/animated-effects/assets/missing.js', '/assets/missing.js?v=123', '/not-present.css']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('x-fixture-route-kind'), 'not_found');
    assert.doesNotMatch(response.headers.get('content-type') ?? '', /text\/html/i);
    assert.doesNotMatch(await response.text(), /id="root"/);
  }
});

test('WAVE2-08: absent static roots do not silently become SPA, legacy /dev stays absent', async () => {
  for (const path of ['/portfolio/absent', '/stream/animated-effects/absent',
    '/dev/animated-effects', '/dev/animated-effects/']) {
    assert.equal((await get(path)).status, 404, path);
  }
});

test('WAVE2-09: HEAD response retains GET status and MIME for routed pages/assets', async () => {
  for (const path of ['/tournaments/42/bracket', '/tournaments/42?tab=standings',
    '/tournaments/42/audience?section=standings', '/stream', '/portfolio/',
    '/prototypes/minigames/core-clash-unity/Build/WebGL.wasm', '/fonts/no.ttf']) {
    const [head, getResponse] = await Promise.all([get(path, 'HEAD'), get(path)]);
    assert.equal(head.status, getResponse.status, path);
    assert.equal(head.headers.get('content-type'), getResponse.headers.get('content-type'), path);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    await getResponse.arrayBuffer();
  }
});

test('WAVE2-10: missing /api and static namespaces do not receive a React HTML shell', async () => {
  // Actual /api dispatch must happen ahead of this policy in a future host adapter.
  for (const path of ['/api/tournaments/42/standings', '/api/tournaments/42/bracket',
    '/assets/app-older.js', '/prototypes/missing', '/fonts/absent']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(response.headers.get('content-type') ?? '', /text\/html/i);
  }
});

test('WAVE2-11: invalid path remains rejected, no SPA navigation after traversal', async () => {
  for (const path of ['/assets/%2e%2e/secret.js', '/assets/invalid%GG']) {
    const decision = resolveStaticRoute(path, filename => files.has(filename));
    assert.equal(decision.kind, 'invalid_path');
    // Node fetch canonicalizes dot segments in outgoing URLs. Validate decisions directly;
    // do not claim this fixture covers a raw-wire traversal payload sent by browsers.
  }
});

test('WAVE2-12: request-count smoke: no redirects or duplicate synthetic asset requests', async () => {
  const beforeCount = requests.length;
  const route = '/tournaments/42/audience?section=standings';
  await verifySpaReload(route);
  const records = requests.slice(beforeCount).filter(x => x.raw === route);
  assert.equal(records.length, 2, 'one document HTTP request per direct-load / reload');
  assert.ok(records.every(x => x.kind === 'spa' && x.path === '/index.html'));
});
