import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Entry-HTML contract only. This suite does not boot React or a production host.
const html = readFileSync(new URL('../../artifacts/tournament-manager/index.html', import.meta.url), 'utf8');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1], m[2]]));
const tags = name => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attrs(m[0]));
const meta = key => tags('meta').filter(m => m.name === key || m.property === key);
const one = key => { const m = meta(key); assert.equal(m.length, 1, key); return m[0].content; };

test('L07: default document language matches Polish UI', () => assert.equal(tags('html')[0].lang, 'pl'));
test('L07: viewport preserves responsive width and does not prohibit zoom', () => {
  const viewport = one('viewport');
  assert.match(viewport, /width=device-width/); assert.match(viewport, /initial-scale=1(?:\.0)?/);
  assert.doesNotMatch(viewport, /maximum-scale|minimum-scale|user-scalable/);
});
test('L07: useful consistent description for search and shared links', () => {
  const description = one('description');
  assert.match(description, /Tournament Manager/); assert.match(description, /turnieje/);
  assert.doesNotMatch(description, /built on Replit|Update this description/i);
  assert.equal(one('og:description'), description); assert.equal(one('twitter:description'), description);
});
test('L07: a readable no-JavaScript explanation exists', () => {
  const section = html.match(/<noscript>([\s\S]*?)<\/noscript>/i)?.[1] ?? '';
  assert.match(section, /Włącz JavaScript/); assert.match(section, /odśwież/);
  assert.doesNotMatch(section, /<script|location\.|window\.|https?:\/\//i);
});
test('L07: React mount and module entry remain unchanged', () => {
  assert.equal((html.match(/<div id="root"><\/div>/g) ?? []).length, 1);
  assert.deepEqual(tags('script'), [{type: 'module', src: '/src/main.tsx'}]);
});
test('L07: title and existing indexing intent are preserved', () => {
  assert.match(html, /<title>Tournament Manager<\/title>/);
  assert.equal(one('robots'), 'index, follow');
  assert.equal(one('og:title'), 'Tournament Manager');
  assert.equal(one('twitter:title'), 'Tournament Manager');
});
test('L07: stylesheet and icon references remain unchanged', () => {
  assert.deepEqual(tags('link'), [
    {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {rel: 'preconnect', href: 'https://fonts.gstatic.com'},
    {href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', rel: 'stylesheet'},
  ]);
});
test('L07: no hard-coded environment URL or automatic redirect introduced', () => {
  assert.equal(meta('og:url').length, 0); assert.equal(tags('base').length, 0);
  assert.equal(tags('link').filter(l => l.rel === 'canonical').length, 0);
  assert.equal(tags('meta').filter(m => /refresh/i.test(m['http-equiv'] ?? '')).length, 0);
});
