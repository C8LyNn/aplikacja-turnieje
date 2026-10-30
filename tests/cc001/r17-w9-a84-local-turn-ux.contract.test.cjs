'use strict';

// CC-001 R17-W9 A84: source-level, fail-first UX regression contract.
// Not an executable Unity/two-PC A60 QA verdict. Baseline RED is expected.
// Run: node --test tests/cc001/r17-w9-a84-local-turn-ux.contract.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const unity = path.join(root, 'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash');
const read = relative => fs.readFileSync(path.join(unity, relative), 'utf8');

function method(source, name) {
  const match = new RegExp('\\b(?:void|string|bool)\\s+' + name + '\\s*\\(').exec(source);
  assert.ok(match, 'Expected ' + name + ' in frozen source');
  const start = source.indexOf('{', match.index + match[0].length);
  assert.ok(start >= 0, 'Missing opening brace for ' + name);
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail('Missing closing brace for ' + name);
}

const matchView = read('Presentation/MatchView.cs');
const app = read('Presentation/CoreClashApp.cs');
const ngo = read('Networking/NgoGameSession.cs');

test('BASELINE: host/client roles bind distinct LocalOwner values', () => {
  assert.match(ngo, /LocalOwner\s*=>\s*hostRole\s*\?\s*0\s*:\s*1\s*;/);
});

test('BASELINE: action permission checks local ownership', () => {
  assert.match(app, /State\.turn\s*==\s*NetworkLink\.LocalOwner/);
});

test('REGRESSION: active banner is local-relative, not solely state.turn-relative', () => {
  const text = method(matchView, 'TurnText');
  assert.match(text, /(?:NetworkLink\.LocalOwner|CanChoose|IsLocalTurn|IsMyTurn|LocalTurnLabel|IsOwnTurn)/,
    'TurnText must distinguish the local seat from the globally active player');
});

test('REGRESSION: opponent turn has a non-YOUR-SHOT state', () => {
  const text = method(matchView, 'TurnText');
  assert.match(text, /(?:OPPONENT|WAITING|THEIR SHOT|NOT YOUR TURN|OTHER PLAYER)/i,
    'P2 must not see YOUR SHOT while P1 is acting (and vice versa)');
});

test('REGRESSION: compact landscape exposes local-relative active-turn state', () => {
  const compact = method(matchView, 'RenderCompactLandscape');
  const local = /(?:NetworkLink\.LocalOwner|IsLocalTurn|IsMyTurn|LocalTurnLabel|IsOwnTurn)/;
  assert.ok(local.test(compact) || /TurnText\s*\(\s*\)/.test(compact),
    'TURN/50 + AIM does not show whether this client may act');
  assert.ok(!/state\.phase\s*==\s*MatchPhase\.Over\s*\?\s*TurnText\(\)\s*:/.test(compact) ||
      local.test(compact),
    'TurnText shown only in game-over branch does not cover active turns');
});
