#!/usr/bin/env node
// WEB-005 R23D #70: read-only HTTP smoke probe. No writes, game code or deployment.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const tests = [
  { id: 'missing-ttf', path: '/__r23d_probe_absent__/missing-font.ttf', kind: 'missing' },
  { id: 'missing-wasm', path: '/__r23d_probe_absent__/missing-engine.wasm', kind: 'missing' },
  { id: 'missing-js', path: '/__r23d_probe_absent__/missing-module.js', kind: 'missing' },
  { id: 'portfolio-root', path: '/portfolio/', kind: 'html', marker: 'portfolio' },
  { id: 'portfolio-projects', path: '/portfolio/projects/', kind: 'html', marker: 'portfolio' },
  { id: 'animated-effects-stream', path: '/stream/animated-effects/', kind: 'html', marker: 'animated-effects' },
  { id: 'tournament-deep-link', path: '/tournaments/101/bracket', kind: 'spa' },
  { id: 'minigames-route', path: '/minigames', kind: 'spa' },
  { id: 'stream-route', path: '/stream', kind: 'spa' },
  { id: 'obs-overlay-route', path: '/stream/overlay/camera-chat', kind: 'spa' },
  { id: 'unity-index', path: '/prototypes/minigames/core-clash-unity/index.html', kind: 'html', marker: 'html' },
  { id: 'unity-wasm-asset', path: '/prototypes/minigames/core-clash-unity/Build/WebGL.wasm', kind: 'wasm' },
  { id: 'unity-loader-js', path: '/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js', kind: 'js' },
];

async function sample(response) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const first = await reader.read();
  await reader.cancel();
  return first.value ?? new Uint8Array();
}

function evaluate(spec, status, contentType, data) {
  const text = new TextDecoder().decode(data.subarray(0, 4096)).toLowerCase();
  const html = contentType.includes('text/html');
  if (spec.kind === 'missing') {
    assert.equal(status, 404, 'missing static resource must not return SPA 200');
    assert.ok(!text.includes('<div id="root"'), 'missing asset must not return the SPA shell');
  } else if (spec.kind === 'wasm') {
    assert.ok([200, 206].includes(status), 'existing wasm must load');
    assert.ok(!html, 'wasm response cannot be HTML');
    assert.equal(Buffer.from(data.subarray(0, 4)).toString('hex'), '0061736d', 'wasm magic bytes');
  } else if (spec.kind === 'js') {
    assert.ok([200, 206].includes(status), 'existing JS must load');
    assert.ok(!html && !text.includes('<!doctype html'), 'JS must not return HTML');
  } else {
    assert.equal(status, 200, 'expected routable HTML document');
    assert.ok(html, 'expected text/html');
    if (spec.kind === 'spa') {
      assert.ok(text.includes('id="root"'), 'SPA route must render root document');
    } else {
      assert.ok(text.includes(spec.marker), `missing ${spec.marker} in returned document`);
    }
  }
}

export async function run(baseUrl, options = {}) {
  const report = [];
  for (const spec of tests) {
    let entry = { id: spec.id, path: spec.path, verdict: 'FAIL' };
    try {
      const url = new URL(spec.path, baseUrl);
      const response = await fetch(url, { redirect: 'manual', headers: { Accept: '*/*' }, signal: AbortSignal.timeout(10000) });
      const data = await sample(response);
      const ct = (response.headers.get('content-type') ?? '').toLowerCase();
      entry = { ...entry, status: response.status, contentType: ct };
      evaluate(spec, response.status, ct, data);
      entry.verdict = 'PASS';
    } catch (error) {
      entry.reason = error instanceof Error ? error.message : String(error);
    }
    report.push(entry);
    if (!options.quiet) console.log(JSON.stringify(entry));
  }
  return report;
}

async function selfTest() {
  const srv = createServer((req, res) => {
    const p = new URL(req.url ?? '/', 'http://localhost').pathname;
    const send = (status, type, body) => { res.writeHead(status, { 'Content-Type': type }); res.end(body); };
    if (p.includes('__r23d_probe_absent__')) return send(404, 'text/plain', 'not found');
    if (p.endsWith('.wasm')) return send(200, 'application/wasm', Buffer.from([0,97,115,109,1,0,0,0]));
    if (p.endsWith('WebGL.loader.js')) return send(200, 'application/javascript', 'console.log("loader");');
    if (p.startsWith('/portfolio/')) return send(200, 'text/html', '<!doctype html><title>Portfolio</title>');
    if (p.startsWith('/stream/animated-effects/')) return send(200, 'text/html', '<!doctype html><title>animated-effects</title>');
    if (p.endsWith('/index.html')) return send(200, 'text/html', '<!doctype html><html><body>html</body></html>');
    return send(200, 'text/html', '<!doctype html><html><div id="root"></div></html>');
  });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  try {
    const report = await run(`http://127.0.0.1:${srv.address().port}`, { quiet: true });
    const passed = report.filter(r => r.verdict === 'PASS').length;
    assert.equal(passed, tests.length, JSON.stringify(report.filter(r => r.verdict !== 'PASS')));
    console.log(`SELF_TEST_PASS ${passed}/${tests.length} (synthetic local fixture, NOT live QA)`);
  } finally {
    await new Promise(resolve => srv.close(resolve));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes('--self-test')) {
    await selfTest();
  } else {
    const url = process.env.R23D_BASE_URL;
    if (!url || !/^https?:\/\//i.test(url)) {
      console.error('R23D_BASE_URL must be an explicit http(s) URL; no default live target is assumed.');
      process.exitCode = 2;
    } else {
      const report = await run(url);
      const failures = report.filter(x => x.verdict !== 'PASS');
      console.log(JSON.stringify({ summary: { total: report.length, pass: report.length - failures.length, fail: failures.length }, note: 'HTTP read-only probe; not a game-byte comparison or a deployment check' }));
      if (failures.length) process.exitCode = 1;
    }
  }
}
