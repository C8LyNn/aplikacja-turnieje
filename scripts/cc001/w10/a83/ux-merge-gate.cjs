#!/usr/bin/env node
'use strict';
// CC-001 R17-W10 / A83. Read-only source admission gate, NOT runtime QA.
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const requireNoPower = process.argv.includes('--require-no-power');
if (!root || root.startsWith('--')) {
  console.error('Usage: node ux-merge-gate.cjs <UnityProjectRoot> [--require-no-power]');
  process.exit(2);
}
const base = path.resolve(root);
function get(p) {
  try { return fs.readFileSync(path.join(base, p), 'utf8'); }
  catch { return ''; }
}
const match = get('Assets/CoreClash/Presentation/MatchView.cs');
const cues = get('Assets/CoreClash/Presentation/TurnPerspective.cs');
const deck = get('Assets/CoreClash/Presentation/BallSelection.cs');
const board = get('Assets/CoreClash/Presentation/BoardView.cs');
const app = get('Assets/CoreClash/Presentation/CoreClashApp.cs');
const tests = get('Tests/Program.cs');
const csproj = get('Tests/CoreClash.Tests.csproj');
const checks = [];
function check(code, ok, reason) { checks.push({ code, result: ok ? 'PASS' : 'HOLD', reason: ok ? undefined : reason }); }
check('UX01_FILES', Boolean(match && cues && deck && board && app), 'Candidate lacks essential Unity presentation files');
check('UX02_SINGLE_TURN', /TurnPerspective\.TurnLabel\(/.test(match) && !/MatchTurnCopy\.TurnText\(|MatchPerspective\.TurnText\(|LocalTurnPresentation\.Status\(/.test(match), 'Select one seat-relative turn renderer; duplicate helpers or active-turn-only copy not accepted');
check('UX03_DISCONNECT', /networked\s*&&\s*\(!connected\s*\|\|\s*!ValidSeat\(localOwner\)\)/.test(cues) && /WAITING FOR CONNECTION/.test(cues), 'Disconnected/unknown local seat must never claim YOUR TURN');
check('UX04_OPPONENT_TURN', /state\.turn\s*!=\s*localOwner/.test(cues) && /OPPONENT/.test(cues), 'Opponent aim must not show local launch invitation');
check('UX05_VIEWPORT_ACTION', /ActionText\(boardInspection,gesture\.Active\)/.test(match) && /TurnPerspective\.ActionHint\(/.test(match) && /TurnPerspective\.CompactPhase\(/.test(match), 'Desktop/phone action hints and compact status must use local-seat presenter');
check('UX06_LOCAL_DECK', (match.match(/LocalDeckContent\.StockIds\(/g)||[]).length >= 3 && /NetworkLink\.LocalOwner/.test(match) && /LocalDeckContent\.DisplayOwner\(/.test(match), 'Desktop, compact and phone deck views must use local owner, not state.turn');
check('UX07_DECK_LOCK', /LocalDeckContent\.CanActivate\(/.test(match) && /owner\s*!=\s*simulation\.State\.turn/.test(deck), 'Local deck may be visible during opponent turn but cannot activate cards');
check('UX08_AIM', /AimGuide\.Trace\(/.test(board) && !/RotateAroundPivot\(/.test(board) && !/GUI\.matrix\s*=/.test(board), 'Aim guidance must use stable field-local geometry (no rotating GUI matrix)');
check('UX09_TEST_WIRING', /A21TurnPerspectiveTests\(\)/.test(tests) && /TurnPerspective\.cs/.test(csproj), 'Selected seat-relative C# tests must be included in managed runner');
if (requireNoPower) {
  const meter = /lastPower\b/.test(match) || /\bpower\s*\*\s*100|Draw\.Rect\(new Rect\(label\.x\+10,label\.yMax-12/.test(board);
  check('UX10_POWER', !meter, 'A10-approved no-power-meter candidate still contains a dedicated power bar or percent');
}
const fail = checks.filter(x=>x.result!=='PASS');
const report = {tool:'CC001-W10-A83-UX-MERGE-GATE',status:fail.length?'HOLD':'PASS_SOURCE_ONLY',root:base,checks,failures:fail.map(x=>x.code),runtimeQa:'NOT_RUN',physicalPc1Pc2:'NOT_RUN'};
console.log(JSON.stringify(report,null,2));
process.exitCode=fail.length?1:0;
