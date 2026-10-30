'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {verify,PINNED_SHA}=require('./verify-view-evidence.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const has=(items,c)=>items.some(x=>x.code===c);
function setup(t){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'a80-qa-'));
 t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(32,19)]);
 const logs=[Buffer.from('secret_token=abc-test-placeholder\n'),Buffer.from('private_host_ip=192.0.2.8\n')];
 const obs=(device,owner,revision,turn,frame)=>{
  const screen=`${device}-${frame}.png`,log=`${device}.log`,logBytes=logs[owner];
  fs.writeFileSync(path.join(base,screen),png);
  fs.writeFileSync(path.join(base,log),logBytes);
  return {device,localOwner:owner,networkConnected:true,
   evidence:{screenshotPath:screen,logPath:log,sourceSha:PINNED_SHA,playerAssemblySha256:'c'.repeat(64),
    screenshotSha256:digest(png),logSha256:digest(logBytes),captureUtc:`2026-10-30T18:00:${String(frame).padStart(2,'0')}Z`},
   authoritative:{revision,turn,phase:'Aiming',actionSerial:revision,stateDigest:`snapshot-${revision}`},
   ui:{turnBannerOwner:turn,yourTurnShown:owner===turn,deckOwner:owner,inputEnabled:owner===turn,
     localPlayerAtBottom:true,powerBarVisible:false,powerPercentVisible:false,
     aim:{dragActive:false,arrowVisible:false,arrowAlignedWithDrag:false}}};
 };
 return {base,session:{schema:'cc001-r17-w11-player-view-timeline-v1',policy:{targetSourceSha:PINNED_SHA,perspective:'local-player-bottom',powerIndicator:'arrow-only'},
   frames:[{index:1,observations:[obs('PC1',0,11,0,1),obs('PC2',1,11,0,1)]},
     {index:2,observations:[obs('PC1',0,12,1,2),obs('PC2',1,12,1,2)]}]}};
}
test('four original pairs of screenshot/log bytes match expected hashes; still NOT physical G3',t=>{
 const {base,session}=setup(t),r=verify(session,{root:base});
 assert.equal(r.verdict,'BYTES_AND_ANNOTATIONS_CONSISTENT');assert.equal(r.summary.filesVerified,8);assert.equal(r.physicalG3Status,'NOT_ASSESSED');
 assert.equal(r.imageContentSemanticallyReviewed,false);
});
test('missing screenshot from real root is explicit FAIL, not string-only PASS',t=>{
 const {base,session}=setup(t);fs.unlinkSync(path.join(base,'PC2-2.png'));
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_FILE_NOT_FOUND'));
});
test('changed screenshot bytes are detected',t=>{
 const {base,session}=setup(t);fs.appendFileSync(path.join(base,'PC1-1.png'),Buffer.from([1]));
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_SHA_MISMATCH'));
});
test('changed log content is detected without exposing its secret',t=>{
 const {base,session}=setup(t);fs.appendFileSync(path.join(base,'PC2.log'),'token=leaked-real-value');
 const r=verify(session,{root:base});assert.ok(has(r.contradictions,'LOG_SHA_MISMATCH'));
 assert.ok(!JSON.stringify(r).includes('leaked-real-value'));
});
test('explicit untrusted screenshot path traversal is forbidden',t=>{
 const {base,session}=setup(t);session.frames[0].observations[0].evidence.screenshotPath='../other.png';
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_INVALID_PATH'));
});
test('absolute screenshot path is forbidden, even if its bytes match',t=>{
 const {base,session}=setup(t);session.frames[0].observations[0].evidence.screenshotPath=path.join(base,'PC1-1.png');
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_INVALID_PATH'));
});
test('symlink that escapes evidence root is blocked',t=>{
 const {base,session}=setup(t),outside=fs.mkdtempSync(path.join(os.tmpdir(),'a80-outside-'));
 t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
 fs.writeFileSync(path.join(outside,'photo.png'),Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(32,19)]));
 const rel='linked.png';fs.symlinkSync(path.join(outside,'photo.png'),path.join(base,rel));
 session.frames[0].observations[0].evidence.screenshotPath=rel;
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_PATH_OUTSIDE_CAPTURE_ROOT'));
});
test('text file masquerading as image is rejected before marking provenance',t=>{
 const {base,session}=setup(t);fs.writeFileSync(path.join(base,'PC1-1.png'),Buffer.from('plain text despite extension'));
 session.frames[0].observations[0].evidence.screenshotSha256=digest(fs.readFileSync(path.join(base,'PC1-1.png')));
 assert.ok(has(verify(session,{root:base}).contradictions,'SCREENSHOT_UNRECOGNIZED_SCREENSHOT_HEADER'));
});
test('omitted expected screenshot hash holds evidence',t=>{
 const {base,session}=setup(t);delete session.frames[0].observations[0].evidence.screenshotSha256;
 const r=verify(session,{root:base});assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
 assert.ok(has(r.gaps,'UNVERIFIED_SCREENSHOT_SHA'));
});
test('source SHA W10 or other candidate is a hard mismatch, not accepted for W11 #207',t=>{
 const {base,session}=setup(t);session.policy.targetSourceSha='3d377767e72473cebd90e49293a0cd5dada70464';
 assert.ok(has(verify(session,{root:base}).contradictions,'WRONG_CANDIDATE_SESSION_SHA'));
});
test('mismatch in device source SHA fails',t=>{
 const {base,session}=setup(t);session.frames[1].observations[1].evidence.sourceSha='a'.repeat(40);
 const r=verify(session,{root:base});assert.ok(has(r.contradictions,'DEVICE_NOT_ON_PINNED_SOURCE'));
});
test('a misleading opponent Your Turn screenshot annotation remains contradiction',t=>{
 const {base,session}=setup(t);session.frames[0].observations[1].ui.yourTurnShown=true;
 const r=verify(session,{root:base});assert.equal(r.verdict,'EVIDENCE_OR_CONTRACT_FAIL');
 assert.equal(r.timelineVerdict,'OBSERVED_CONTRACT_FAIL');
});
test('CLI succeeds only on synthetic byte-verified observations, with NOT_ASSESSED G3',t=>{
 const {base,session}=setup(t),input=path.join(base,'session.json');fs.writeFileSync(input,JSON.stringify(session));
 const p=spawnSync(process.execPath,[__dirname+'/verify-view-evidence.cjs','--input',input,'--root',base],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);assert.equal(JSON.parse(p.stdout).physicalG3Status,'NOT_ASSESSED');
});
test('CLI refuses to overwrite earlier evidence output',t=>{
 const {base,session}=setup(t),input=path.join(base,'session.json'),out=path.join(base,'report.json');
 fs.writeFileSync(input,JSON.stringify(session));fs.writeFileSync(out,'existing report');
 const p=spawnSync(process.execPath,[__dirname+'/verify-view-evidence.cjs','--input',input,'--root',base,'--out',out],{encoding:'utf8'});
 assert.equal(p.status,4);assert.equal(fs.readFileSync(out,'utf8'),'existing report');
});
test('CLI returns 1 on tampered screenshot and 3 on missing hash',t=>{
 const {base,session}=setup(t),input=path.join(base,'session.json');fs.writeFileSync(input,JSON.stringify(session));
 fs.appendFileSync(path.join(base,'PC1-1.png'),'changed');
 const bad=spawnSync(process.execPath,[__dirname+'/verify-view-evidence.cjs','--input',input,'--root',base],{encoding:'utf8'});
 assert.equal(bad.status,1,bad.stderr);
 fs.writeFileSync(path.join(base,'PC1-1.png'),Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(32,19)]));
 delete session.frames[1].observations[0].evidence.logSha256;fs.writeFileSync(input,JSON.stringify(session));
 const missing=spawnSync(process.execPath,[__dirname+'/verify-view-evidence.cjs','--input',input,'--root',base],{encoding:'utf8'});
 assert.equal(missing.status,3,missing.stderr);
});
