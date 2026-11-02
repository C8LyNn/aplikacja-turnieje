'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {analyze,FREEZE}=require('./qa-f1-pose.cjs');
const head=`CC001_W12_F1_QA_CAPTURE
UTC=2026-10-30T21:22:10.1234567Z
CAPTURE_SEQ=1
SOURCE_SHA=UNVERIFIED
CLOCK_SYNC=UNVERIFIED
TURN=1 REVISION=42 FRAME=125 ACTION_SERIAL=3
ROLE: CLIENT / CONNECTION: READY
LOCAL SEAT: P2 / RED / ACTIVE SEAT: P2 / RED
INPUT OWNERSHIP: YOUR TURN / AIMING
RECEIVED SNAPSHOTS 66 / APPLIED REVISION 42 / CURRENT STATE REVISION 42
LOCAL COMMANDS: 1 ACCEPTED / 0 REJECTED
REMOTE COMMANDS: 3 ACCEPTED / 0 REJECTED
COUNTERS ARE NOT PROOF OF TWO-PC STATE PARITY
G3_STATUS=NOT_ATTESTED / RAW WIN11 BUILD AND TWO-PC EVIDENCE REQUIRED
POSE_SAMPLE=CANONICAL_STATE_PLUS_LOCAL_RENDER / ADVISORY_ONLY
PHASE=Moving / UNITY_UNSCALED_TIME=55.25
ACTIVE_BALL_COUNT=2 / SAMPLED=2 / TRUNCATED=0 / FOCUS_ID=22 / FOCUS_STATUS=INCLUDED
BALL ID=7 OWNER=0 HP=30 STATE_X=12.5 STATE_Y=-4 RENDER_X=12.5 RENDER_Y=-4 RENDER_MODE=CANONICAL
BALL ID=22 OWNER=1 HP=20 STATE_X=100 STATE_Y=50 RENDER_X=98 RENDER_Y=48 RENDER_MODE=SMOOTHED
RENDER_POSE_PARITY_PROOF=NO / COMPARE ONLY SAME ACCEPTED REVISION\n`;
const mutate=(a,b)=>head.replace(a,b);
const cli=(content,args=[])=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a43-w15-'));try{const file=path.join(dir,'input.txt'),out=path.join(dir,'report.json');fs.writeFileSync(file,content);const r=spawnSync(process.execPath,[path.join(__dirname,'qa-f1-pose.cjs'),file,out,...args],{encoding:'utf8'});return {code:r.status,stderr:r.stderr,report:fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):null};}finally{fs.rmSync(dir,{recursive:true,force:true})}};
test('actual A33 W15 F1 format imports local canonical vs visual delta only',()=>{const r=analyze(head);assert.equal(r.status,'LOCAL_POSE_SAMPLES_ONLY');assert.equal(r.samples[0].balls[1].canonicalRenderDistance,2.82843);assert.equal(r.samples[0].focusId,22);assert.equal(r.sourceSha,'UNVERIFIED');assert.equal(r.availableInFrozenW11,false)});
test('does not fabricate continuous FPS / build / physical G3',()=>{const r=analyze(head);assert.equal(r.frameTiming,null);assert.equal(r.continuousFrameSampling,false);assert.equal(r.physicalG3Attested,false);assert.equal(r.windowsBuildAttested,false);assert.equal(r.frozenW11QaSha,FREEZE)});
test('source disclaimer cannot be overwritten with operator claimed freeze SHA',()=>assert.throws(()=>analyze(mutate('SOURCE_SHA=UNVERIFIED','SOURCE_SHA='+FREEZE)),/unverified source/));
test('G3 disclaimer mandatory',()=>assert.throws(()=>analyze(mutate('G3_STATUS=NOT_ATTESTED','G3_STATUS=PASS')),/G3 disclaimer/));
test('requires independent P2 connected capture, not host or P1',()=>{assert.throws(()=>analyze(mutate('ROLE: CLIENT','ROLE: HOST')),/P2 client/);assert.throws(()=>analyze(mutate('LOCAL SEAT: P2','LOCAL SEAT: P1')),/P2 client/);assert.throws(()=>analyze(mutate('CONNECTION: READY','CONNECTION: NOT READY')),/P2 client/)});
test('A33 cap24 and truncated row counts are checked',()=>assert.throws(()=>analyze(mutate('SAMPLED=2','SAMPLED=25')),/count|rows/));
test('A33 focus outside first 24 accepted when included',()=>assert.equal(analyze(head).samples[0].focusStatus,'INCLUDED'));
test('focused ball omission rejected',()=>assert.throws(()=>analyze(mutate('FOCUS_ID=22','FOCUS_ID=99')),/focused/));
test('duplicate or out-of-order ball IDs rejected',()=>assert.throws(()=>analyze(mutate('BALL ID=22','BALL ID=7')),/identity\/order/));
test('invalid Unity coordinates cannot enter report',()=>assert.throws(()=>analyze(mutate('RENDER_X=98','RENDER_X=NaN')),/RENDER_X/));
test('CANONICAL mode must report canonical coordinates',()=>{const r=analyze(mutate('RENDER_X=12.5','RENDER_X=12.0'));assert.equal(r.status,'CAPTURE_CONTRADICTION');assert.equal(r.totals.invalidRenderModes,1)});
test('nonmoving phase must not claim smoothed remote ball',()=>{const r=analyze(mutate('PHASE=Moving','PHASE=Aiming'));assert.equal(r.status,'CAPTURE_CONTRADICTION');assert.equal(r.totals.invalidRenderModes,1)});
test('truncated board signals missing full coverage',()=>{const r=analyze(mutate('ACTIVE_BALL_COUNT=2 / SAMPLED=2 / TRUNCATED=0','ACTIVE_BALL_COUNT=3 / SAMPLED=2 / TRUNCATED=1'));assert.ok(r.missing.includes('SOME_BALLS_UNSAMPLED'))});
test('multiple independently clicked samples are not treated as frame interval series',()=>{const second=head.replace('CAPTURE_SEQ=1','CAPTURE_SEQ=2').replace('FRAME=125','FRAME=160');const r=analyze(head+second);assert.equal(r.totals.captures,2);assert.equal(r.frameTiming,null);assert.equal(r.continuousFrameSampling,false)});
test('bad/missing capture marker rejects unframed text',()=>assert.throws(()=>analyze('hostIPAddress=192.0.2.12\n'+head),/unframed/));
test('empty pose unavailable produces insufficient evidence',()=>{const x=head.replace('POSE_SAMPLE=CANONICAL_STATE_PLUS_LOCAL_RENDER / ADVISORY_ONLY','POSE_SAMPLE=UNAVAILABLE / NULL_STATE');assert.equal(analyze(x).status,'INSUFFICIENT')});
test('CLI exits 0 only for scoped local samples and hashes input byte-for-byte',()=>{const x=cli(head);assert.equal(x.code,0,x.stderr);assert.equal(x.report.status,'LOCAL_POSE_SAMPLES_ONLY');assert.match(x.report.input.sha256,/^[0-9a-f]{64}$/);assert.equal(x.report.input.bytes,Buffer.byteLength(head));assert.equal(x.report.frameTiming,null)});
test('CLI contradictory mode exits 1, no G3 PASS',()=>{const x=cli(mutate('PHASE=Moving','PHASE=Over'));assert.equal(x.code,1);assert.equal(x.report.physicalG3Attested,false)});
test('CLI insufficient pose exits 2',()=>{const x=cli(mutate('POSE_SAMPLE=CANONICAL_STATE_PLUS_LOCAL_RENDER / ADVISORY_ONLY','POSE_SAMPLE=UNAVAILABLE / NULL_STATE'));assert.equal(x.code,2)});
test('CLI malformed source claim exits 3',()=>{const x=cli(mutate('SOURCE_SHA=UNVERIFIED','SOURCE_SHA='+FREEZE));assert.equal(x.code,3);assert.equal(x.report,null)});
test('CLI never serializes hostnames or raw clipboard diagnostic lines',()=>{const x=cli(head.replace('COUNTERS ARE NOT PROOF OF TWO-PC STATE PARITY','COUNTERS ARE NOT PROOF OF TWO-PC STATE PARITY\nSECRET_DO_NOT_EXPORT=192.0.2.123 TOKEN=abc'));assert.equal(x.code,0);assert.doesNotMatch(JSON.stringify(x.report),/SECRET_DO_NOT_EXPORT|192\.0\.2|TOKEN=abc/) });
test('CLI original input may not be overwritten',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a43-w15-'));try{const f=path.join(dir,'original');fs.writeFileSync(f,head);const r=spawnSync(process.execPath,[path.join(__dirname,'qa-f1-pose.cjs'),f,f],{encoding:'utf8'});assert.equal(r.status,3);assert.equal(fs.readFileSync(f,'utf8'),head)}finally{fs.rmSync(dir,{recursive:true,force:true})}});
test('CLI refuses symlinked input',t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a43-w15-'));try{const f=path.join(dir,'original'),alias=path.join(dir,'alias');fs.writeFileSync(f,head);try{fs.symlinkSync(f,alias)}catch(e){if(['EPERM','EACCES'].includes(e.code)){t.skip('symlink unavailable');return;}throw e}const r=spawnSync(process.execPath,[path.join(__dirname,'qa-f1-pose.cjs'),alias],{encoding:'utf8'});assert.equal(r.status,3)}finally{fs.rmSync(dir,{recursive:true,force:true})}});
test('CLI rejects duplicate output even if report contents appear usable',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a43-w15-'));try{const input=path.join(dir,'input'),out=path.join(dir,'report');fs.writeFileSync(input,head);fs.writeFileSync(out,'previous');const r=spawnSync(process.execPath,[path.join(__dirname,'qa-f1-pose.cjs'),input,out],{encoding:'utf8'});assert.equal(r.status,3);assert.equal(fs.readFileSync(out,'utf8'),'previous')}finally{fs.rmSync(dir,{recursive:true,force:true})}});
test('invalid UTF8 fails before parsing',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a43-w15-'));try{const input=path.join(dir,'bad');fs.writeFileSync(input,Buffer.concat([Buffer.from(head),Buffer.from([0xff])]));const r=spawnSync(process.execPath,[path.join(__dirname,'qa-f1-pose.cjs'),input],{encoding:'utf8'});assert.equal(r.status,3)}finally{fs.rmSync(dir,{recursive:true,force:true})}});
