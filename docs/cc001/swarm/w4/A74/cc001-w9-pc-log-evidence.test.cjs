'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const script=path.join(__dirname,'cc001-w9-pc-log-evidence.cjs');
const {summarize,buildEvidence,numericField,eventType}=require(script);

test('metadata extractor parses intent/revision/turn without copying secrets',()=>{
 const raw='2026-10-25T18:30:00Z CORE_CLASH_LAUNCH owner=1 actionSerial=42 revision=17 token=github_pat_SUPERSECRET123456789012345678901234567890 ip=192.168.1.3\n'+
           'TURN 1 PLAYER 1 YOUR SHOT email=foo@example.com\n'+
           'snapshot revision=18 position=(11,22) C:\\Users\\test\\Player.log\n'+
           'teleport ball position: 22,44\n';
 const summary=summarize('PC2',Buffer.from(raw));
 assert.equal(summary.maxActionSerial,42);
 assert.equal(summary.maxSnapshotRevision,18);
 assert.equal(summary.categories.intent,1);
 assert.equal(summary.categories['turn-ui'],1);
 assert.equal(summary.categories.snapshot,1);
 assert.equal(summary.categories['ball-visual'],1);
 assert.equal(summary.events.find(e=>e.type==='turn-ui').yourShot,true);
 const safe=JSON.stringify(summary);
 for(const secret of ['192.168.1.3','github_pat_SUPERSECRET','foo@example.com','C:\\Users\\test','token=','position=(11,22)'])
   assert.equal(safe.includes(secret),false,'leaked '+secret);
 assert.equal(summary.sourceSha256,crypto.createHash('sha256').update(raw).digest('hex'));
});

test('warnings mark telemetry gaps as unverified, not G3 PASS',()=>{
 const a=summarize('PC1',Buffer.from('Joined LAN game\n'));
 const b=summarize('PC2',Buffer.from('YOUR SHOT\n'));
 const out=buildEvidence(a,b);
 assert.equal(out.conclusions.authoritativeConvergence,'NOT_EVALUATED');
 assert.equal(out.conclusions.renderInterpolation,'NOT_EVALUATED');
 assert.equal(out.warnings.length,6);
});

test('numeric and category validators are fail-closed',()=>{
 assert.equal(numericField('owner=2 player=1',['owner']),2);
 assert.equal(numericField('somethingactionSerial=9',['actionSerial']),null);
 assert.equal(numericField('actionSerial=4294967296',['actionSerial']),4294967296);
 assert.equal(numericField('actionSerial=-1',['actionSerial']),null);
 assert.equal(eventType('unrelated private IP 192.168.1.3'),null);
});

test('CLI writes safe metadata and refuses overwrite or same input',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w9-a74-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const pc1=path.join(dir,'PC1.log'),pc2=path.join(dir,'PC2.log'),out=path.join(dir,'summary.json');
 fs.writeFileSync(pc1,'2026-10-25T18:30:00Z SNAPSHOT revision=9 player=1 email=user1@example.com\n');
 fs.writeFileSync(pc2,'2026-10-25T18:30:01Z intent actionSerial=10 owner=1 ip=10.2.3.4\n');
 const cli=()=>cp.spawnSync(process.execPath,[script,'--pc1',pc1,'--pc2',pc2,'--out',out],{encoding:'utf8'});
 let run=cli();assert.equal(run.status,0,run.stderr);
 const body=fs.readFileSync(out,'utf8'),j=JSON.parse(body);
 assert.equal(j.schema,'CC001-W9-PC1-PC2-LOG-EVIDENCE-V1');
 assert.equal(j.pc1.maxSnapshotRevision,9);
 assert.equal(j.pc2.maxActionSerial,10);
 assert.ok(!body.includes('user1@example.com'));
 assert.ok(!body.includes('10.2.3.4'));
 assert.ok(!body.includes(dir));
 assert.match(run.stdout,/SHA256=[0-9a-f]{64}/);
 assert.equal(cli().status,2,'must not overwrite previous output');
 assert.equal(fs.readFileSync(out,'utf8'),body,'existing output preserved');
 let same=cp.spawnSync(process.execPath,[script,'--pc1',pc1,'--pc2',pc1,'--out',path.join(dir,'other.json')],{encoding:'utf8'});
 assert.equal(same.status,2);
 assert.equal(fs.existsSync(path.join(dir,'other.json')),false);
});

test('handles UTF-16LE log BOM and truncation without copying raw content',()=>{
 const text='snapshot revision=7 secret=superpassword\n';
 const s=summarize('PC1',Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(text,'utf16le')]));
 assert.equal(s.maxSnapshotRevision,7);
 assert.ok(!JSON.stringify(s).includes('superpassword'));
});
