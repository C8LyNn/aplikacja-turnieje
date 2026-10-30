'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspect,SCHEMA,PIN}=require('./verify-freeze-view.cjs');
const digest='d'.repeat(64),dll='a'.repeat(64);
function fixture(phase='Aiming',turn=0){
 const mk=(device,owner)=>({device,localOwner:owner,sourceSha:PIN,binaryAssemblySha256:dll,networkConnected:true,
  authoritative:{revision:31,phase,turn,stateDigest:digest},
  ui:{yourTurnShown:owner===turn&&phase==='Aiming',inputEnabled:owner===turn&&phase==='Aiming',deckOwner:owner,
   powerBarVisible:false,powerPercentVisible:false},
  balls:[{id:7,canonical:{x:110,y:250},view:{x:110,y:owner===1?650:250},sampleKind:phase==='Moving'?'MOVING_INTERPOLATED':'SETTLED'},
         {id:8,canonical:{x:170,y:780},view:{x:170,y:owner===1?120:780},sampleKind:phase==='Moving'?'MOVING_INTERPOLATED':'SETTLED'}]});
 return {schema:SCHEMA,qaSourceSha:PIN,lane:'W11_QA_FREEZE',toleranceWorldUnits:0.5,observations:[mk('PC1',0),mk('PC2',1)]};
}
const failures=(r,code)=>r.problems.some(x=>x.code===code),missing=(r,code)=>r.gaps.some(x=>x.code===code);
test('frozen P1/P2 exact world logical coords have correct Y inversion',()=>{let r=inspect(fixture());assert.equal(r.verdict,'OBSERVATIONS_LOGICALLY_CONSISTENT');assert.equal(r.physicalG3Status,'NOT_ASSESSED');});
test('old 173273 historical W11 source rejected',()=>{let f=fixture();f.qaSourceSha='173273122c11cbf738e8b954e32506a6196fe8ec';assert.ok(failures(inspect(f),'QA_FREEZE_SHA_MISMATCH'));});
test('moving PR207 head cannot masquerade as official freeze',()=>{let f=fixture();f.observations[1].sourceSha='87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c';assert.ok(failures(inspect(f),'DEVICE_SOURCE_SHA_MISMATCH'));});
test('two PCs cannot display same local owner',()=>{let f=fixture();f.observations[1].localOwner=0;assert.ok(failures(inspect(f),'PC1_PC2_OWNER_MAPPING_MISMATCH'));});
test('P2 orientation must be Y inverted, not X mirrored',()=>{let f=fixture();f.observations[1].balls[0].view.y=250;assert.ok(failures(inspect(f),'VIEW_Y_NOT_LOCAL_PERSPECTIVE'));});
test('P2 orientation must not invert X',()=>{let f=fixture();f.observations[1].balls[0].view.x=430;assert.ok(failures(inspect(f),'VIEW_X_NOT_CANONICAL'));});
test('same revision divergent canonical ball pose is a contradiction',()=>{let f=fixture();f.observations[1].balls[0].canonical.x=111;assert.ok(failures(inspect(f),'SAME_REVISION_CANONICAL_POSE_MISMATCH'));});
test('two devices at different revisions are unaligned, not false PASS',()=>{let f=fixture();f.observations[1].authoritative.revision=32;assert.ok(missing(inspect(f),'NO_SAME_REVISION_PAIR'));});
test('missing true source-bound state digest is a HOLD',()=>{let f=fixture();delete f.observations[0].authoritative.stateDigest;assert.ok(missing(inspect(f),'SOURCE_BOUND_STATE_DIGEST_MISSING'));});
test('moving smoothing is intentionally NOT compared with authoritative render positions',()=>{let f=fixture('Moving',0);f.observations[1].balls[0].view.y=999;const r=inspect(f);assert.equal(r.verdict,'OBSERVATIONS_LOGICALLY_CONSISTENT');assert.ok(r.notes.some(x=>x.code==='MOVING_FRAME_GEOMETRY_NOT_ASSESSED'));});
test('PORTAL snap is geometrically checked when certified in operator observation',()=>{let f=fixture('Moving',0);for(let o of f.observations){o.balls[0].sampleKind='EVENT_SNAP';o.balls[0].eventKind='PORTAL';}f.observations[1].balls[0].view.y=649;assert.ok(failures(inspect(f),'VIEW_Y_NOT_LOCAL_PERSPECTIVE'));});
test('TELEPORT is not marked passed on older frozen source without inclusion',()=>{let f=fixture('Moving',0);f.observations[1].balls[0].sampleKind='EVENT_SNAP';f.observations[1].balls[0].eventKind='TELEPORT';assert.ok(missing(inspect(f),'EVENT_SNAP_NOT_IN_FROZEN_SOURCE_SCOPE'));});
test('SWAP is not marked passed on older frozen source without inclusion',()=>{let f=fixture('Moving',0);f.observations[1].balls[0].sampleKind='EVENT_SNAP';f.observations[1].balls[0].eventKind='SWAP';assert.ok(missing(inspect(f),'EVENT_SNAP_NOT_IN_FROZEN_SOURCE_SCOPE'));});
test('missing visual sample is incomplete instead of PASS',()=>{let f=fixture();f.observations[1].balls=[];assert.ok(missing(inspect(f),'BALL_SAMPLES_MISSING'));});
test('duplicate ball IDs are rejected',()=>{let f=fixture();f.observations[0].balls[1].id=7;assert.ok(failures(inspect(f),'INVALID_OR_DUPLICATE_BALL_ID'));});
test('stale other player Your Turn is rejected even if phase is valid',()=>{let f=fixture();f.observations[1].ui.yourTurnShown=true;assert.ok(failures(inspect(f),'YOUR_TURN_NOT_LOCAL'));});
test('disconnected local seat cannot aim or show Your Turn',()=>{let f=fixture();f.observations[0].networkConnected=false;assert.ok(failures(inspect(f),'LOCAL_INPUT_AUTHORITY_MISMATCH'));});
test('obsolete power bar rejected as A10 decision contradiction',()=>{let f=fixture();f.observations[0].ui.powerBarVisible=true;assert.ok(failures(inspect(f),'REDUNDANT_POWER_UI_VISIBLE'));});
test('cross-PC assembly digests must match',()=>{let f=fixture();f.observations[1].binaryAssemblySha256='b'.repeat(64);assert.ok(failures(inspect(f),'PC_ASSEMBLY_SHA_MISMATCH'));});
test('metadata does not pretend to rehash native EXE',()=>{let r=inspect(fixture());assert.equal(r.verifiedBuildBinary,false);assert.equal(r.inspectedOriginalImages,false);assert.equal(r.measuredFPS,false);});
test('CLI exit0 only for synthetic consistent annotations and physical NOT_ASSESSED',t=>{let d=fs.mkdtempSync(path.join(os.tmpdir(),'a80-w12-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));let f=path.join(d,'sample.json');fs.writeFileSync(f,JSON.stringify(fixture()));let o=spawnSync(process.execPath,[path.join(__dirname,'verify-freeze-view.cjs'),'--input',f],{encoding:'utf8'});assert.equal(o.status,0,o.stderr);assert.equal(JSON.parse(o.stdout).physicalG3Status,'NOT_ASSESSED');});
test('CLI mismatched SHA exit1 and incomplete sampling exit3',t=>{let d=fs.mkdtempSync(path.join(os.tmpdir(),'a80-w12-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));let f=path.join(d,'sample.json'),obj=fixture();obj.qaSourceSha='87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c';fs.writeFileSync(f,JSON.stringify(obj));assert.equal(spawnSync(process.execPath,[path.join(__dirname,'verify-freeze-view.cjs'),'--input',f],{encoding:'utf8'}).status,1);obj=fixture();delete obj.observations[1].authoritative.stateDigest;fs.writeFileSync(f,JSON.stringify(obj));assert.equal(spawnSync(process.execPath,[path.join(__dirname,'verify-freeze-view.cjs'),'--input',f],{encoding:'utf8'}).status,3);});
test('CLI refuses overwrite of previous QA report',t=>{let d=fs.mkdtempSync(path.join(os.tmpdir(),'a80-w12-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));let input=path.join(d,'sample.json'),out=path.join(d,'report.json');fs.writeFileSync(input,JSON.stringify(fixture()));fs.writeFileSync(out,'old');let r=spawnSync(process.execPath,[path.join(__dirname,'verify-freeze-view.cjs'),'--input',input,'--out',out],{encoding:'utf8'});assert.equal(r.status,4);assert.equal(fs.readFileSync(out,'utf8'),'old');});
