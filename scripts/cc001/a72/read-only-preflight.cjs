'use strict';
// CC-001 R17 A72: read-only structural and data preflight. NO SDK, NO filesystem writes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '../../..');
const arg = process.argv.find(x => x.startsWith('--project='));
const project = path.resolve(arg ? arg.slice('--project='.length) : path.join(repo, 'unity/cc001-r16/CoreClash-V149-Unity'));
const checks = [];
function check(id, ok, detail = '') { checks.push({ id, status: ok ? 'PASS' : 'FAIL', ...(detail ? {detail} : {}) }); }
function read(relative) { return fs.readFileSync(path.join(project, relative)); }
function json(relative) { return JSON.parse(read(relative).toString('utf8')); }
function exists(relative) { return fs.existsSync(path.join(project, relative)); }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function safely(id, fn) { try { fn(); } catch (e) { check(id, false, String(e.message || e)); } }
const required = [
  'Assets/CoreClash/Editor/BuildTools.cs', 'Assets/Resources/Data/catalog.json',
  'Assets/Resources/Data/featured-decks.json', 'Tests/CoreClash.Tests.csproj',
  'Tests/Program.cs', 'Tools/r16-qa.cjs', 'Tools/verify-data.cjs',
  'Tools/network-codec-test.cjs', 'Tools/r16-build-smoke.ps1',
  'Packages/manifest.json', 'Packages/packages-lock.json',
  'ProjectSettings/ProjectVersion.txt', 'NuGet.Config',
  'Evidence/R16/qa-summary.json'
];
for (const filename of required) check('present:' + filename, exists(filename));
for (const folder of ['Library', 'Temp', 'obj', 'Logs', 'Builds', 'Tests/obj'])
  check('no_generated:' + folder, !exists(folder));
safely('version', () => check('unity_6000.4.0f1', /^m_EditorVersion:\s*6000\.4\.0f1\s*$/m.test(read('ProjectSettings/ProjectVersion.txt').toString('utf8'))));
safely('package_lock', () => {
  const pkg = json('Packages/manifest.json').dependencies;
  const lock = json('Packages/packages-lock.json').dependencies;
  check('direct_dependencies_locked', Object.entries(pkg).every(([k,v]) => lock[k]?.version === v));
  check('network_dependencies', pkg['com.unity.netcode.gameobjects'] === '2.13.3' && pkg['com.unity.services.multiplayer'] === '2.2.4' && pkg['com.unity.transport'] === '2.6.0');
});
safely('data_contracts', () => {
  const c = json('Assets/Resources/Data/catalog.json');
  const f = json('Assets/Resources/Data/featured-decks.json');
  const ids = new Set(c.balls.map(b => b.id));
  const by = Object.fromEntries(c.balls.map(b => [b.id,b]));
  const abilities = Object.fromEntries(c.abilities.map(a => [a.id,a]));
  check('ball_count_unique', c.balls.length === 227 && ids.size === 227);
  check('specials_count', c.balls.filter(b => !b.hidden && b.id !== 'normal').length === 224);
  check('archetype_and_deck_counts', c.archetypes.length === 12 && c.decks.length === 36 && f.decks.length === 4 && f.decks.every(d => d.provisional === true));
  check('deck_references_unique_9', [...c.decks,...f.decks].every(d => d.balls.length === 9 && new Set(d.balls).size === 9 && d.balls.every(id => ids.has(id))));
  check('stock_sentinel_integer', c.balls.every(b => Number.isInteger(b.stockCopies)));
  check('hp_radius_contracts', by.fire?.hp === 35 && by.normal?.hp === 30 && by.anchor?.hp === 35 && by.dart?.radius === 17.5 && by.fire?.radius === 21.25 && by.anchor?.radius === 25);
  check('ability_event_contracts', JSON.stringify(abilities['fire:primary']?.events) === '["TOUCH"]' && abilities['splitter:primary']?.events?.includes('STOP'));
  const ref = path.resolve(project, '../Reference/V148_reference_original.html');
  check('canonical_reference_exists', fs.existsSync(ref));
  if(fs.existsSync(ref)) check('v148_reference_sha256', sha256(fs.readFileSync(ref)) === c.sourceSha256, 'reference under imported source prefix (not developer-specific absolute path)');
});
safely('syntax', () => {
  const js = ['Tools/verify-data.cjs','Tools/r16-qa.cjs','Tools/network-codec-test.cjs','Tools/r16-report.cjs','Tools/web-release.cjs','Tests/web-release-test.cjs'];
  for(const name of js) safely('syntax:'+name, () => { new vm.Script(read(name).toString('utf8'), {filename:name}); check('syntax:'+name, true); });
});
const report = {
  project, node: process.version, scope: 'read-only Node preflight; no .NET, browser, Unity compilation, or runtime checks',
  passed: checks.filter(x => x.status === 'PASS').length,
  failed: checks.filter(x => x.status === 'FAIL').length, checks
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
process.exitCode = report.failed ? 1 : 0;
