'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { archiveAndRemoveStaleResult, validateNewResult } = require('./fresh-test-evidence.cjs');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-managed-fresh-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  return { result: path.join(dir, 'unity-tests.json'), dir };
}
const now = Date.now();
const valid = () => ({spec:'V149 UNITY', testedAt: new Date(now).toISOString(), passed:2, failed:0,
  results:[{name:'case1',pass:true},{name:'case2',pass:true}]});
function write(result, data) {fs.writeFileSync(result, JSON.stringify(data));}
test('missing old result leaves clean path', t => {
  const f = fixture(t);
  assert.equal(archiveAndRemoveStaleResult(f.result, f.dir).oldResultPresent, false);
});
test('real historical R16 result is archived and removed', t => {
  const f=fixture(t);fs.writeFileSync(f.result,'{"passed":180,"failed":0}');
  const r=archiveAndRemoveStaleResult(f.result,f.dir);
  assert.equal(r.oldResultPresent,true);assert.equal(fs.existsSync(f.result),false);
  assert.equal(fs.readFileSync(path.join(f.dir,r.archivedPath),'utf8'),'{"passed":180,"failed":0}');
});
test('preexisting archive collision must HOLD before deleting original', t => {
  const f=fixture(t);fs.writeFileSync(f.result,'old');fs.writeFileSync(path.join(f.dir,'preexisting-unity-tests.json'),'existing');
  assert.throws(()=>archiveAndRemoveStaleResult(f.result,f.dir),/ARCHIVE_COLLISION/);assert.equal(fs.existsSync(f.result),true);
});
test('non-file prior evidence must HOLD', t => {
  const f=fixture(t);fs.mkdirSync(f.result);assert.throws(()=>archiveAndRemoveStaleResult(f.result,f.dir),/UNSAFE/);
});
test('fresh legitimate managed report accepts and hashes original bytes', t => {
  const f=fixture(t);write(f.result,valid());const x=validateNewResult(f.result,now-500,now+500);
  assert.equal(x.parsed.passed,2);assert.match(x.sha256,/^[a-f0-9]{64}$/);
});
test('no freshly written report is HOLD even after process exit0', t => {
  const f=fixture(t);assert.throws(()=>validateNewResult(f.result,now-500,now+500),/MISSING/);
});
const cases = [
  ['malformed JSON', '{broken', /INVALID_JSON/],
  ['wrong spec', {...valid(),spec:'other'}, /BAD_COUNTS/],
  ['zero passes', {...valid(),passed:0,results:[]}, /BAD_COUNTS/],
  ['failed case count', {...valid(),failed:1}, /BAD_COUNTS/],
  ['noninteger passed', {...valid(),passed:2.5}, /BAD_COUNTS/],
  ['missing cases', {...valid(),results:undefined}, /BAD_CASES/],
  ['wrong case count', {...valid(),results:[{name:'case1',pass:true}]}, /BAD_CASES/],
  ['false-green case', {...valid(),results:[{name:'case1',pass:true},{name:'case2',pass:false}]}, /BAD_CASES/],
  ['empty case name', {...valid(),results:[{name:'case1',pass:true},{name:'',pass:true}]}, /BAD_CASES/],
  ['stale timestamp', {...valid(),testedAt:'2026-10-16T23:53:45.560Z'}, /BAD_TIMESTAMP/],
  ['future timestamp', {...valid(),testedAt:'2099-01-01T00:00:00Z'}, /BAD_TIMESTAMP/],
  ['missing timestamp', {...valid(),testedAt:null}, /BAD_TIMESTAMP/]
];
for (const [name, data, expected] of cases) {
  test('reject '+name, t => {
    const f=fixture(t);
    fs.writeFileSync(f.result, typeof data==='string'?data:JSON.stringify(data));
    assert.throws(()=>validateNewResult(f.result,now-500,now+500),expected);
  });
}
