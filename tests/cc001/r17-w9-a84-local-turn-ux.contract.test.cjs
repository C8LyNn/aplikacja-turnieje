'use strict';

// CC-001 R17-W10 A84: fail-first local-seat UX regression contract.
// Source-level checks, NOT C# execution or physical two-PC QA.
// Run on a full candidate checkout: node --test tests/cc001/r17-w9-a84-local-turn-ux.contract.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const unity = path.join(root, 'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash');
const read = relative => fs.readFileSync(path.join(unity, relative), 'utf8');
const view = read('Presentation/MatchView.cs');
const app = read('Presentation/CoreClashApp.cs');
const ngo = read('Networking/NgoGameSession.cs');
const presentationDir = path.join(unity, 'Presentation');
const presentationFiles = fs.readdirSync(presentationDir).filter(name => name.endsWith('.cs'));

// Both block-bodied and expression-bodied C# helper methods are valid. W9 contains both.
function method(source, name) {
  const expression = new RegExp('\\b(?:public\\s+static\\s+)?(?:void|string|bool)\\s+' + name + '\\s*\\([^)]*\\)\\s*(=>|\\{)');
  const found = expression.exec(source);
  assert.ok(found, 'Missing ' + name + ' declaration');
  if (found[1] === '=>') {
    const end = source.indexOf(';', found.index + found[0].length);
    assert.ok(end !== -1, 'Unterminated ' + name + ' expression body');
    return source.slice(found.index, end + 1);
  }
  const start = found.index + found[0].length - 1;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(found.index, i + 1);
  }
  assert.fail('Unterminated ' + name + ' block');
}

function classBody(name) {
  for (const filename of presentationFiles) {
    const content = read('Presentation/' + filename);
    if (new RegExp('\\bclass\\s+' + name + '\\b').test(content)) return content;
  }
  assert.fail('Missing referenced ' + name + ' source');
}

function localTurnPath() {
  const wrapper = method(view, 'TurnText');
  const referenced = /\b(LocalTurnPresentation|TurnPerspective|MatchPerspective|MatchTurnCopy)\.(\w+)\s*\(/.exec(wrapper);
  assert.ok(referenced, 'TurnText must delegate through an inspectable local-seat-aware helper');
  assert.match(wrapper, /(?:NetworkLink\??\.LocalOwner|ViewOwner)/,
    'TurnText must pass the actual local seat, not only globally active state.turn');
  return {wrapper, body: method(classBody(referenced[1]), referenced[2])};
}

function actionPath() {
  const render = method(view, 'RenderMatch');
  const compact = method(view, 'RenderCompactLandscape');
  const wrapper = method(view, 'ActionText');
  const referenced = /\b(TurnPerspective|LocalTurnPresentation|MatchPerspective|MatchTurnCopy)\.(\w+)\s*\(/.exec(wrapper);
  assert.ok(referenced, 'ActionText must delegate to the local-seat-aware action policy');
  assert.match(wrapper, /(?:NetworkLink\??\.LocalOwner|ViewOwner)/,
    'ActionText must receive local seat identity');
  return {render, compact, body:method(classBody(referenced[1]),referenced[2])};
}

test('BASELINE: remote client and host have distinct seat ownership', () => {
  assert.match(ngo, /LocalOwner\s*=>\s*hostRole\s*\?\s*0\s*:\s*1\s*;/);
});

test('BASELINE: ability to act checks authority AND local seat', () => {
  assert.match(app, /State\.turn\s*==\s*NetworkLink\.LocalOwner/);
});

test('P0: banner is connected to the local seat through a real presentation helper', () => {
  const {body} = localTurnPath();
  assert.match(body, /(?:state\.turn\s*(?:==|!=)\s*localOwner|localOwner\s*(?:==|!=)\s*state\.turn)/,
    'Label helper must compare authoritative turn to local owner');
});

test('P0: opponent action is not described as YOUR SHOT', () => {
  const {body} = localTurnPath();
  assert.match(body, /(?:OPPONENT|WAITING|OTHER PLAYER|THEIR SHOT)/i,
    'Source must contain an explicit non-local-turn branch');
  assert.match(body, /YOUR SHOT|YOUR TURN/i,
    'Source must also represent a local player action');
});

test('P0: disconnected/unknown local seat does not claim an actionable turn', () => {
  const {wrapper,body} = localTurnPath();
  assert.ok(/(?:IsConnected|connected)/.test(wrapper) || /connected/.test(body),
    'Disconnected client must have a separate non-actionable state');
  assert.match(body, /(?:WAITING FOR CONNECTION|OFFLINE|DISCONNECTED)/i);
});

test('P1: compact landscape turn status uses the local seat', () => {
  const compact = method(view, 'RenderCompactLandscape');
  const helper = /\b(?:TurnPerspective\.CompactPhase|LocalTurnPresentation\.CompactStatus|MatchTurnCopy\.Compact\w*)\s*\(/.test(compact);
  const inline = /(?:NetworkLink\??\.LocalOwner|ViewOwner|CanChoose)/.test(compact) &&
    /(?:YOUR SHOT|WAIT P|OPPONENT|WAITING)/i.test(compact);
  assert.ok(helper || inline, 'Compact turn tile must distinguish YOUR TURN from opponent turn');
});

test('P0: desktop action hint is not an unconditional DRAG/RELEASE instruction', () => {
  const render = method(view, 'RenderMatch');
  assert.match(render, /(?:ActionText\s*\(|CanChoose\s*\?)/,
    'Desktop drag/release hint requires local-seat action permission');
});

test('P0: compact landscape action hint is local-action-aware', () => {
  const compact = method(view, 'RenderCompactLandscape');
  assert.match(compact, /(?:ActionText\s*\(|CanChoose\s*\?)/,
    'Compact drag/release hint requires local-seat action permission');
});

test('P0: action helper returns an opponent/waiting hint instead of drag/release', () => {
  const {body} = actionPath();
  assert.match(body, /(?:state\.turn\s*(?:!=|==)\s*localOwner|localOwner\s*(?:!=|==)\s*state\.turn)/,
    'Action hints must explicitly compare the local seat to authoritative turn');
  assert.match(body, /(?:OPPONENT|WAITING|OTHER PLAYER)/i,
    'Opponent turn must have an explicit non-actionable action hint');
});
