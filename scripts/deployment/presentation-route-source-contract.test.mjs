/**
 * WEB-005 / A120 / WAVE 2: contract assertions against the ACTUAL checked-out
 * React sources and static indexes. Safe source-only tests, no app rendering.
 * With no checked-out monorepo source, these tests SKIP rather than pass using
 * fabricated source files. CI/full checkout should run all without skips.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const relative = path => resolve(repo, path);
const app = 'artifacts/tournament-manager/src/App.tsx';
const nav = 'artifacts/tournament-manager/src/components/tournament-organizer-navigation.tsx';
const detail = 'artifacts/tournament-manager/src/pages/tournament-detail.tsx';
const audience = 'artifacts/tournament-manager/src/pages/tournament-audience.tsx';
const publicRoot = 'artifacts/tournament-manager/public/';
const allPresent = files => files.every(path => existsSync(relative(path)));
const source = path => readFileSync(relative(path), 'utf8');

const needs = files => ({ skip: !allPresent(files) && 'full checked-out monorepo sources unavailable; rerun on PR exact SHA' });

test('SOURCE-01: actual Wouter route registry exposes bracket, audience, projector and stream direct URLs',
  needs([app]), () => {
    const text = source(app);
    for (const route of [
      '/tournaments/:id/bracket', '/tournaments/:id/audience', '/tournaments/:id/projector',
      '/experimental/tournaments/:id/bracket', '/experimental/tournaments/:id/audience',
      '/stream', '/stream/overlay/camera-chat', '/developer/overlay/camera-chat',
    ]) assert.ok(text.includes(`<Route path="${route}"`), `missing actual Wouter route ${route}`);
    assert.ok(text.includes('<WouterRouter base='), 'direct source base path must be preserved');
  });

test('SOURCE-02: organizer standings deep-link is ?tab=standings on detail, NOT /standings',
  needs([nav, detail]), () => {
    const n = source(nav), d = source(detail);
    assert.match(n, /new URLSearchParams\(search\)\.get\("tab"\)/);
    assert.match(n, /"standings"/);
    assert.ok(n.includes('`/tournaments/${tournamentId}?tab=standings`'),
      'organizer navigation must persist standings tab in URL');
    assert.ok(d.includes('organizerDetailTab(search, capabilities)'));
    assert.ok(d.includes('<TabsContent value="standings"'), 'detail page must render standings pane');
  });

test('SOURCE-03: public audience deep-link uses ?section=standings and preserves section after reload',
  needs([app, audience]), () => {
    const a = source(audience);
    assert.ok(a.includes('searchParams.get("section")'));
    assert.ok(a.includes('activeSection: AudienceSection'));
    assert.ok(a.includes('`/audience?section=${section.id}`'));
    assert.ok(a.includes('{ id: "standings", label: "Tabela" }'));
    assert.ok(a.includes('{ id: "bracket", label: "Drabinka" }'));
    assert.ok(source(app).includes('path="/tournaments/:id/audience"'));
  });

test('SOURCE-04: referenced standalone portfolio and Animated Effects public indexes exist',
  needs([app]), () => {
    for (const path of [
      'portfolio/index.html', 'portfolio/projects/index.html',
      'stream/animated-effects/index.html',
      'prototypes/minigames/core-clash-unity/index.html',
      'prototypes/minigames/core-clash-unity/Build/WebGL.wasm',
      'prototypes/minigames/core-clash-unity/Build/WebGL.loader.js',
    ]) {
      assert.ok(existsSync(relative(publicRoot + path)), `missing actual public resource: ${path}`);
    }
    const html = source(publicRoot + 'stream/animated-effects/index.html');
    assert.match(html, /<!doctype html>/i);
    const referenced = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(match => match[1].split(/[?#]/, 1)[0]);
    assert.ok(referenced.some(href => href.endsWith('.js')),
      'Animated Effects HTML must include a JS build');
    assert.ok(referenced.some(href => href.endsWith('.css')),
      'Animated Effects HTML must include a CSS build');
    for (const href of referenced) {
      assert.ok(href.startsWith('/stream/animated-effects/'),
        `unexpected Animated Effects source URL: ${href}`);
      assert.ok(existsSync(relative(publicRoot + href.slice(1))),
        `Animated Effects references a missing built asset: ${href}`);
    }
  });
