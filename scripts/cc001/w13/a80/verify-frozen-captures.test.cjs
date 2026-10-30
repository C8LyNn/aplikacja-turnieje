'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {assessCapture,PIN,SCHEMA,fingerprint}=require('./verify-frozen-captures.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const codes=(a,c)=>a.some(x=>x.code===c);
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'a80-w13-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const logs=['CC_W10_NET_HOST revision=42 action=1','CC_W10_NET_CLIENT revision=42 action=1'];
 let pictures=0;
 function observation(device,owner,index){
  const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(64,index*3+owner+1)]);
  const screenshotPath=device+'/frame-'+index+'.png',logPath=device+'/Player.log';
  fs.mkdirSync(path.join(root,device),{recursive:true});fs.writeFileSync(path.join(root,screenshotPath),png);
  fs.writeFileSync(path.join(root,logPath),logs[owner]);pictures++;
  return {device,localOwner:owner,sourceSha:PIN,binaryAssemblySha256:'f'.repeat(64),networkConnected:true,
   authoritative:{revision:index+40,turn:index===1?0:1,phase:'Aiming',stateDigest:'a'.repeat(64)},
   ui:{yourTurnShown:owner===(index===1?0:1),inputEnabled:owner===(index===1?0:1),deckOwner:owner,powerBarVisible:false,powerPercentVisible:false},
   balls:[{id:1,canonical:{x:150,y:270},view:{x:150,y:owner===1?630:270},sampleKind:'SETTLED'}],
   evidence:{screenshotPath, screenshotSha256:hash(png),logPath,logSha256:hash(Buffer.from(logs[owner])),captureUtc:'2026-10-30T19:00:0'+index+'Z'}};
 }
 const input={schema:SCHEMA,lane:'W11_QA_FREEZE',qaSourceSha:PIN,toleranceWorldUnits:0.5,
   pairs:[{index:1,observations:[observation('PC1',0,1),observation('PC2',1,1)]},
          {index:2,observations:[observation('PC1',0,2),observation('PC2',1,2)]}]};
 return {root,input};
}
test('two pairs with eight SHA-verified original screenshot/log attachments are only scoped consistent',t=>{
 const {root,input}=fixture(t);const r=assessCapture(input,{root});assert.equal(r.verdict,'CAPTURE_BYTES_AND_ANNOTATIONS_CONSISTENT');
 assert.equal(r.summary.bytesChecked,8);assert.equal(r.physicalG3Status,'NOT_ASSESSED');assert.equal(r.verifiedDeviceOrigin,false);
});
test('the current W11 freeze is required, not new moving PR207',t=>{const a=fixture(t);a.input.qaSourceSha='87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c';assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'QA_FREEZE_SHA_MISMATCH'));});
test('historical W11 original source is not treated as the freeze',t=>{const a=fixture(t);a.input.pairs[0].observations[0].sourceSha='173273122c11cbf738e8b954e32506a6196fe8ec';assert.equal(assessCapture(a.input,{root:a.root}).verdict,'CAPTURE_CONTRADICTION');});
test('the real W12 view contract catches P2 incorrect Y inversion',t=>{const a=fixture(t);a.input.pairs[0].observations[1].balls[0].view.y=270;const r=assessCapture(a.input,{root:a.root});assert.ok(codes(r.errors,'PAIR_VIEW_CONTRACT_FAIL'));});
test('incorrect screenshot actual bytes detected',t=>{const a=fixture(t);fs.appendFileSync(path.join(a.root,'PC1/frame-1.png'),'change');assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'FILE_BYTES_SHA256_MISMATCH'));});
test('private log altered without reporting private contents',t=>{const a=fixture(t);fs.appendFileSync(path.join(a.root,'PC2/Player.log'),' token=CANARYSECRET');const r=assessCapture(a.input,{root:a.root});assert.ok(codes(r.errors,'FILE_BYTES_SHA256_MISMATCH'));assert.ok(!JSON.stringify(r).includes('CANARYSECRET'));});
test('screen hash absent => evidence incomplete, not PASS',t=>{const a=fixture(t);delete a.input.pairs[0].observations[0].evidence.screenshotSha256;assert.equal(assessCapture(a.input,{root:a.root}).verdict,'INSUFFICIENT_EVIDENCE');});
test('missing file is a deterministic contradiction',t=>{const a=fixture(t);fs.unlinkSync(path.join(a.root,'PC2/frame-1.png'));assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'EVIDENCE_FILE_MISSING'));});
test('traversal outside capture root rejected',t=>{const a=fixture(t);a.input.pairs[0].observations[0].evidence.logPath='../outside.log';assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'INVALID_RELATIVE_PATH'));});
test('absolute paths rejected even with correct content',t=>{const a=fixture(t);a.input.pairs[0].observations[0].evidence.logPath=path.join(a.root,'PC1/Player.log');assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'INVALID_RELATIVE_PATH'));});
test('symlink escape rejected',t=>{const a=fixture(t),outside=fs.mkdtempSync(path.join(os.tmpdir(),'out-a80-'));t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));fs.writeFileSync(path.join(outside,'other.log'),'private');fs.symlinkSync(path.join(outside,'other.log'),path.join(a.root,'escape.log'));a.input.pairs[0].observations[0].evidence.logPath='escape.log';assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'EVIDENCE_OUTSIDE_ROOT'));});
test('same exact screenshot reused by the same PC in later pair gives HOLD',t=>{const a=fixture(t),p=a.input.pairs;fs.copyFileSync(path.join(a.root,'PC1/frame-1.png'),path.join(a.root,'PC1/frame-2.png'));p[1].observations[0].evidence.screenshotSha256=p[0].observations[0].evidence.screenshotSha256;const r=assessCapture(a.input,{root:a.root});assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');assert.ok(codes(r.gaps,'REUSED_SCREENSHOT_NOT_NEW_EVIDENCE'));});
test('identical image for PC1 and PC2 is a contradictory independent-device pair',t=>{const a=fixture(t);fs.copyFileSync(path.join(a.root,'PC1/frame-1.png'),path.join(a.root,'PC2/frame-1.png'));a.input.pairs[0].observations[1].evidence.screenshotSha256=a.input.pairs[0].observations[0].evidence.screenshotSha256;const r=assessCapture(a.input,{root:a.root});assert.ok(codes(r.errors,'CROSS_DEVICE_IDENTICAL_IMAGE'));});
test('operator can report independent clocks; only own backward motion is checked',t=>{const a=fixture(t);a.input.pairs[1].observations[1].evidence.captureUtc='2026-10-30T18:00:01Z';assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'DEVICE_CAPTURE_CLOCK_REVERSED'));});
test('missing UTC timestamp holds rather than inventing clock parity',t=>{const a=fixture(t);delete a.input.pairs[0].observations[0].evidence.captureUtc;assert.ok(codes(assessCapture(a.input,{root:a.root}).gaps,'CAPTURE_TIMESTAMP_NOT_UTC'));});
test('out-of-order pair indexes are rejected',t=>{const a=fixture(t);a.input.pairs[1].index=1;assert.ok(codes(assessCapture(a.input,{root:a.root}).errors,'PAIR_INDEX_NONMONOTONIC'));});
test('unavailable W12 authoritative digest is not silently promoted to G3',t=>{const a=fixture(t);delete a.input.pairs[0].observations[1].authoritative.stateDigest;const r=assessCapture(a.input,{root:a.root});assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');assert.equal(r.physicalG3Status,'NOT_ASSESSED');});
test('moving interpolation does not falsely prove rendered pose parity',t=>{const a=fixture(t);for(const o of a.input.pairs[0].observations){o.authoritative.phase='Moving';o.ui.yourTurnShown=false;o.ui.inputEnabled=false;o.balls[0].sampleKind='MOVING_INTERPOLATED';o.balls[0].view.y=999;}const r=assessCapture(a.input,{root:a.root});assert.equal(r.verdict,'CAPTURE_BYTES_AND_ANNOTATIONS_CONSISTENT');assert.equal(r.physicalG3Status,'NOT_ASSESSED');});
test('frozen QA does not accept later TELEPORT visual snap as independently demonstrated',t=>{const a=fixture(t);a.input.pairs[0].observations[1].balls[0].sampleKind='EVENT_SNAP';a.input.pairs[0].observations[1].balls[0].eventKind='SWAP';const r=assessCapture(a.input,{root:a.root});assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');});
test('image header is checked without claiming image decode',t=>{const a=fixture(t);const p=path.join(a.root,'PC1/frame-1.png');fs.writeFileSync(p,'not an image');a.input.pairs[0].observations[0].evidence.screenshotSha256=hash(fs.readFileSync(p));const r=assessCapture(a.input,{root:a.root});assert.ok(codes(r.errors,'SCREENSHOT_SIGNATURE_INVALID'));});
test('CLI real Node exit0 and physicalG3Status NOT_ASSESSED',t=>{const a=fixture(t),p=path.join(a.root,'obs.json');fs.writeFileSync(p,JSON.stringify(a.input));const r=spawnSync(process.execPath,[path.join(__dirname,'verify-frozen-captures.cjs'),'--input',p,'--root',a.root],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).physicalG3Status,'NOT_ASSESSED');});
test('CLI wrong QA SHA exit1, incomplete evidence exit3',t=>{const a=fixture(t),p=path.join(a.root,'obs.json');a.input.qaSourceSha='b'.repeat(40);fs.writeFileSync(p,JSON.stringify(a.input));let r=spawnSync(process.execPath,[path.join(__dirname,'verify-frozen-captures.cjs'),'--input',p,'--root',a.root],{encoding:'utf8'});assert.equal(r.status,1,r.stderr);a.input.qaSourceSha=PIN;delete a.input.pairs[0].observations[0].evidence.logSha256;fs.writeFileSync(p,JSON.stringify(a.input));r=spawnSync(process.execPath,[path.join(__dirname,'verify-frozen-captures.cjs'),'--input',p,'--root',a.root],{encoding:'utf8'});assert.equal(r.status,3,r.stderr);});
test('CLI existing output is not overwritten',t=>{const a=fixture(t),p=path.join(a.root,'obs.json'),out=path.join(a.root,'report.json');fs.writeFileSync(p,JSON.stringify(a.input));fs.writeFileSync(out,'previous');const r=spawnSync(process.execPath,[path.join(__dirname,'verify-frozen-captures.cjs'),'--input',p,'--root',a.root,'--out',out],{encoding:'utf8'});assert.equal(r.status,4);assert.equal(fs.readFileSync(out,'utf8'),'previous');});
