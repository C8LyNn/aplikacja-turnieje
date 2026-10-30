'use strict';

// CC-001 R17-W11 A84 — source contracts for the A30 W10 integration addon.
// These checks are intentionally static. They DO NOT certify C#, Unity, Windows,
// latency, visual smoothness, or physical PC1↔PC2 network behavior.
// Usage: node --test tests/cc001/r17-w11-a84-player-ui.contract.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash');
const read = filename => fs.readFileSync(path.join(dir, filename), 'utf8');
const match = read('Presentation/MatchView.cs');
const selection = read('Presentation/BallSelection.cs');
const deck = read('Presentation/LocalDeckContent.cs');
const layout = read('Presentation/MatchLayout.cs');
const app = read('Presentation/CoreClashApp.cs');
const board = read('Presentation/BoardView.cs');
const ball = read('Presentation/BallView.cs');
const smooth = read('Presentation/RemoteBallSmoother.cs');
const ngo = read('Networking/NgoGameSession.cs');

function method(source, name) {
  const regex = new RegExp('\\b(?:public\\s+)?(?:static\\s+)?(?:void|string|bool|int)\\s+' + name + '\\s*\\([^)]*\\)\\s*(=>|\\{)');
  const found = regex.exec(source);
  assert.ok(found, 'missing method ' + name);
  if (found[1] === '=>') {
    const end = source.indexOf(';', found.index + found[0].length);
    assert.notEqual(end, -1, 'unterminated expression ' + name);
    return source.slice(found.index, end + 1);
  }
  let depth = 0;
  const start = found.index + found[0].length - 1;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') ++depth;
    if (source[i] === '}' && --depth === 0) return source.slice(found.index, i + 1);
  }
  assert.fail('unterminated method ' + name);
}

test('01 | P1/P2 seat identity is distinct and commands are local-turn gated', () => {
  assert.match(ngo, /LocalOwner\s*=>\s*hostRole\s*\?\s*0\s*:\s*1/);
  assert.match(app, /State\.turn\s*==\s*NetworkLink\.LocalOwner/);
});

test('02 | active turn title uses local seat and handles disconnected waiting', () => {
  assert.match(method(match, 'TurnText'), /LocalTurnPresentation\.Status[\s\S]*NetworkLink\.LocalOwner/);
  const policy = method(selection, 'Status');
  assert.match(policy, /multiplayer\s*&&\s*!connected[\s\S]*WAITING FOR CONNECTION/);
  assert.match(policy, /multiplayer\s*&&\s*state\.turn\s*!=\s*localOwner[\s\S]*WAITING FOR PLAYER/);
  assert.match(policy, /YOUR SHOT/);
});

test('03 | action hint prevents opponent from seeing DRAG / RELEASE guidance', () => {
  const policy = method(selection, 'ActionHint');
  assert.match(policy, /multiplayer\s*&&\s*!connected[\s\S]*WAITING FOR CONNECTION/);
  assert.match(policy, /multiplayer\s*&&\s*state\.turn\s*!=\s*localOwner[\s\S]*WAITING FOR PLAYER/);
  assert.ok(policy.indexOf('state.turn!=localOwner') < policy.indexOf('return dragging?'),
    'opponent guard must precede the launch hint');
});

test('04 | desktop has local-relative action guidance', () => {
  const render = method(match, 'RenderMatch');
  assert.match(render, /LocalTurnPresentation\.ActionHint[\s\S]*NetworkLink\.LocalOwner/);
});

test('05 | compact status and both compact hints use local seat', () => {
  const compact = method(match, 'RenderCompactLandscape');
  assert.match(compact, /LocalTurnPresentation\.CompactStatus[\s\S]*NetworkLink\.LocalOwner/);
  const hints = compact.match(/LocalTurnPresentation\.(?:ActionHint|ActionMessage)\s*\(/g) || [];
  assert.equal(hints.length, 2, 'both choice hint and feedback hint need local gating');
  assert.match(method(selection, 'CompactStatus'), /state\.turn\s*!=\s*localOwner/);
});

test('06 | desktop deck shown as yours is selected by local seat', () => {
  const render = method(match, 'RenderMatch');
  assert.match(render, /LocalDeckContent\.DisplayOwner\(\s*state\.turn[\s\S]*NetworkLink\.LocalOwner/);
  assert.match(render, /LocalDeckContent\.StockIds\(\s*state\s*,\s*displayOwner\s*\)/);
  assert.match(render, /displayOwner\s*<\s*0\s*\?\s*"DECK UNAVAILABLE"/);
});

test('07 | compact and phone deck stocks are local-owner derived', () => {
  const compact = method(match, 'RenderCompactLandscape');
  const phone = method(match, 'RenderPhoneTray');
  assert.match(compact, /LocalDeckContent\.StockIds[\s\S]*LocalDeckContent\.DisplayOwner[\s\S]*NetworkLink\.LocalOwner/);
  assert.match(phone, /LocalDeckContent\.DisplayOwner[\s\S]*NetworkLink\.LocalOwner/);
  assert.match(phone, /LocalDeckContent\.StockIds/);
});

test('08 | deck helper fails closed on invalid seats and nonlocal actions', () => {
  assert.match(method(deck, 'DisplayOwner'), /networkOwner\.Value==0\s*\|\|\s*networkOwner\.Value==1[\s\S]*:\s*-1/);
  assert.match(method(deck, 'CanActivate'), /localInputEnabled[\s\S]*simulation\.State\.turn\s*==\s*owner/);
});

test('09 | replay/launch pointer gets inverse P2 world coordinates', () => {
  const pointer = method(app, 'HandlePointer');
  assert.match(pointer, /MatchPerspective\.SimulationX\(\s*viewX\s*,\s*ViewOwner\s*\)/);
  assert.match(pointer, /MatchPerspective\.SimulationY\(\s*viewY\s*,\s*ViewOwner\s*\)/);
  assert.match(layout, /ViewY\([^)]*\)\s*=>\s*localOwner==1\s*\?\s*WorldHeight-simulationY/);
  assert.match(layout, /SimulationY\([^)]*\)\s*=>\s*localOwner==1\s*\?\s*WorldHeight-viewY/);
});

test('10 | board inspection uses the same P2 inverse transform', () => {
  const inspect = method(app, 'InspectAt');
  assert.match(inspect, /MatchPerspective\.SimulationX\(\s*viewX\s*,\s*ViewOwner\s*\)/);
  assert.match(inspect, /MatchPerspective\.SimulationY\(\s*viewY\s*,\s*ViewOwner\s*\)/);
});

test('11 | aim path is clipped and has the canonical 18-unit readiness threshold', () => {
  const aim = method(board, 'RenderAim');
  assert.match(aim, /Mathf\.Clamp\(\s*aim\.AimX/);
  assert.match(aim, /Mathf\.Clamp\(\s*aim\.AimY/);
  assert.match(aim, /distance\s*>=\s*18\b/);
  assert.match(aim, /AimGuide\.Trace\(/);
  assert.match(aim, /AimStroke\(/);
});

test('12 | no separate on-board power bar or percentage in RenderAim', () => {
  const aim = method(board, 'RenderAim');
  assert.doesNotMatch(aim, /Draw\.Round\(|Draw\.Text\(|\b\d+\s*%/);
});

test('13 | no residual after-shot strength strip or dead power fields', () => {
  assert.doesNotMatch(match, /lastPower|releasedAt|w\s*\*\s*lastPower/);
  assert.doesNotMatch(app, /\blastPower\b|\breleasedAt\b/);
});

test('14 | smoothing selected only for connected nonauthoritative P2 display', () => {
  const render = method(match, 'RenderMatch');
  assert.match(render, /NetworkLink!=null\s*&&\s*!NetworkLink\.IsAuthority\s*&&\s*NetworkLink\.IsConnected\s*\?\s*remoteBallSmoother/);
  assert.match(render, /BoardView\.Render\([^;]*remoteVisual/);
  assert.match(board, /RemoteBallSmoother\s+remoteVisual/);
  assert.match(board, /TryGetPosition/);
  assert.match(app, /remoteBallSmoother\.Observe\(\s*state\s*,\s*Time\.unscaledTime/);
});

test('15 | visual-only smoother protects entity identity and true portal teleports', () => {
  assert.match(smooth, /e\.kind\s*==\s*"PORTAL"[\s\S]*ids\.Add\(\s*e\.ballId\s*\)/);
  assert.match(smooth, /instantBallIds\.Contains\(\s*ball\.id\s*\)/);
  assert.match(smooth, /pose\.owner\s*!=\s*ball\.owner[\s\S]*pose\.type/);
  assert.match(smooth, /MaxGap\s*=\s*0\.6f[\s\S]*MaxDuration\s*=\s*0\.(?:2|25)f/);
});

test('16 | smoothing never overwrites host-authoritative player state through drawing', () => {
  const render = method(match, 'RenderMatch');
  assert.match(render, /remoteVisual/);
  assert.match(app, /Simulation\.State\s*=\s*state/);
  assert.doesNotMatch(smooth, /Simulation\.State\s*=/);
});

test('17 | disconnected Moving state must prioritize connection over RESOLVING', () => {
  for (const name of ['Status', 'ActionHint', 'CompactStatus']) {
    const body = method(selection, name);
    const disconnected = body.indexOf('multiplayer&&!connected');
    const moving = body.indexOf('state.phase==MatchPhase.Moving');
    assert.ok(disconnected >= 0 && moving >= 0 && disconnected < moving,
      name + ': disconnected seat should not show normal movement status');
  }
});

test('18 | stale notice cannot obscure opponent/disconnected state on compact UI', () => {
  const compact = method(match, 'RenderCompactLandscape');
  const uses = compact.match(/LocalTurnPresentation\.ActionMessage\s*\(/g) || [];
  assert.equal(uses.length, 2, 'both compact notice positions must use guarded ActionMessage');
  const policy = method(selection, 'ActionMessage');
  assert.match(policy, /state\.turn\s*==\s*localOwner/);
  assert.match(policy, /connected\s*&&/);
  assert.match(policy, /!System\.String\.IsNullOrEmpty\(notice\)/);
  assert.match(policy, /return ActionHint\(/);
});

test('19 | desktop stale notice requires ability of local seat to act', () => {
  const desktop = method(match, 'RenderMatch');
  assert.match(desktop, /notice\.Length\s*>\s*0\s*&&\s*CanChoose/,
    'historic failed-shot notice must not override remote/disconnected desktop copy');
});

test('20 | visual revision is propagated from NGO to read-only client smoother', () => {
  assert.match(ngo, /app\.ReceiveNetworkState\(\s*adapter\.State\s*,\s*revision\s*\)/);
  assert.match(app, /ReceiveNetworkState\(\s*GameState\s+state\s*,\s*int\s+snapshotRevision(?:\s*=\s*-1)?\s*\)/);
  assert.match(app, /remoteBallSmoother\.Observe\(\s*state\s*,\s*Time\.unscaledTime\s*,\s*instantBallIds\s*,\s*snapshotRevision\s*\)/);
  assert.match(smooth, /snapshotRevision\s*<=\s*lastSnapshotRevision\s*\)\s*return\s*;/);
  assert.match(smooth, /lastSnapshotRevision\s*=\s*snapshotRevision\s*;/);
});
