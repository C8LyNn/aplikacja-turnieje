#!/usr/bin/env node
'use strict';
// CC-001 A60 / R17-W9: independent two-endpoint evidence gate.
// Offline only. Does not connect to a network, Unity, or production.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const SHA = /^[0-9a-f]{40}$/i;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const result = (status, detail) => ({ status, detail });

function evaluate(pc1, pc2) {
  const gates = {};
  const fail = (key, detail) => { gates[key] = result('FAIL', detail); };
  const pass = (key, detail) => { gates[key] = result('PASS', detail); };
  const hold = (key, detail) => { gates[key] = result('HOLD', detail); };
  if (!pc1 || !pc2 || pc1.schema !== 'CC001-W9-PC-EVIDENCE-v1' || pc2.schema !== 'CC001-W9-PC-EVIDENCE-v1') {
    fail('EVIDENCE_SCHEMA', 'Two v1 JSON evidence files required');
    return { decision: 'FAIL', gates };
  }
  const validIdentity = pc1.peer === 'PC1' && pc2.peer === 'PC2' && pc1.localOwner === 0 && pc2.localOwner === 1 &&
    SHA.test(pc1.sourceSha || '') && pc1.sourceSha === pc2.sourceSha &&
    typeof pc1.session === 'string' && pc1.session.length > 0 && pc1.session === pc2.session;
  if (validIdentity) pass('PEER_IDENTITY', 'PC1=owner0, PC2=owner1; exact SHA and session match');
  else fail('PEER_IDENTITY', 'Device/owner, exact source SHA or session mismatch');

  const a = Array.isArray(pc1.frames) ? pc1.frames : [];
  const b = Array.isArray(pc2.frames) ? pc2.frames : [];
  const frames = a.concat(b);
  if (!a.length || !b.length) hold('SNAPSHOT_ORDER', 'No captured frames from both PCs');
  else if (frames.some(f => !Number.isSafeInteger(f.revision) || f.revision < 0 || !finite(f.atMs)) ||
           [a,b].some(rows => rows.some((f,i) => i > 0 && (f.atMs < rows[i-1].atMs || f.revision < rows[i-1].revision))))
    fail('SNAPSHOT_ORDER', 'Revision rollback, invalid revision or non-monotonic capture time');
  else pass('SNAPSHOT_ORDER', 'Nondecreasing revisions and sample times');

  const badTurn = frames.find((f) => f.turn !== 0 && f.turn !== 1 ||
    !['Aiming','Moving','Over'].includes(f.phase) || typeof f.yourTurn !== 'boolean' ||
    f.yourTurn !== (f.phase === 'Aiming' && f.turn === (a.includes(f) ? 0 : 1)));
  if (!frames.length) hold('LOCAL_TURN_HEADER', 'No local turn UI samples');
  else if (badTurn) fail('LOCAL_TURN_HEADER', 'YOUR SHOT contradicts owner/turn/phase at revision '+badTurn.revision);
  else pass('LOCAL_TURN_HEADER', 'YOUR SHOT is local-owner-relative for every sampled frame');

  const hostByRev = new Map();
  for (const f of a) if (!hostByRev.has(f.revision)) hostByRev.set(f.revision, f);
  const paired = b.filter(f => hostByRev.has(f.revision));
  // Two absent ball arrays must never count as equal authoritative states.
  const incomplete = paired.find(f => {
    const host=hostByRev.get(f.revision);
    return [host,f].some(frame => !Array.isArray(frame.balls) ||
      frame.balls.some(ball => ball==null || !Number.isSafeInteger(ball.id) ||
        !Number.isSafeInteger(ball.owner) || ball.owner<0 || ball.owner>1 ||
        ![ball.x,ball.y,ball.hp].every(finite) || ball.hp<0) ||
      new Set(frame.balls.map(ball=>ball.id)).size!==frame.balls.length);
  });
  const mismatched = paired.find(f => {
    const x = hostByRev.get(f.revision);
    return f.turn !== x.turn || f.phase !== x.phase || f.actionSerial !== x.actionSerial || !same(normalizeBalls(f.balls), normalizeBalls(x.balls));
  });
  if (incomplete) hold('AUTHORITATIVE_PARITY', 'Missing or invalid ball telemetry at revision '+incomplete.revision);
  else if (mismatched) fail('AUTHORITATIVE_PARITY', 'Same revision diverges at '+mismatched.revision);
  else if (!paired.length) hold('AUTHORITATIVE_PARITY', 'No common revision to compare');
  else pass('AUTHORITATIVE_PARITY', paired.length+' client frames match same-revision host state');

  if (!a.length || !b.length) hold('FINAL_CONVERGENCE', 'Missing final samples');
  else if (a[a.length-1].revision !== b[b.length-1].revision)
    hold('FINAL_CONVERGENCE', 'Client has not caught up to last host revision; retry after settle');
  else if (gates.AUTHORITATIVE_PARITY?.status !== 'PASS')
    hold('FINAL_CONVERGENCE', 'Final revision exists but same-revision parity unproven');
  else pass('FINAL_CONVERGENCE', 'Final snapshot revision agrees');

  const sent = Array.isArray(pc2.sentIntents) ? pc2.sentIntents : [];
  const accepted = Array.isArray(pc1.acceptedIntents) ? pc1.acceptedIntents.filter(i => i.accepted === true) : [];
  const p2 = accepted.filter(i => i.owner === 1);
  const keys = p2.map(i => i.sequence);
  if (!sent.length || !p2.length) hold('P2_ACCEPTED_ONCE', 'No confirmed P2 intent and host acceptance');
  else if (p2.some(i => !Number.isSafeInteger(i.sequence) || !Number.isSafeInteger(i.actionSerial)) ||
           new Set(keys).size !== keys.length ||
           p2.some((i,index) => index>0 && i.actionSerial<=p2[index-1].actionSerial) ||
           p2.some(i => !sent.some(s => s.owner === 1 && s.sequence === i.sequence)))
    fail('P2_ACCEPTED_ONCE', 'Duplicate sequence, non-monotonic host actionSerial or missing client intent');
  else pass('P2_ACCEPTED_ONCE', p2.length+' unique P2 accepted commands with matching client intents');

  const aimSamples = b.flatMap(f => f.aim ? [{...f.aim, revision:f.revision}] : []);
  if (!aimSamples.length) hold('P2_AIM_BOUNDS', 'No real P2 aim geometry captured');
  else {
    const bad = aimSamples.find(g => !g.board || !g.from || !g.to ||
      ![g.board.x,g.board.y,g.board.width,g.board.height,g.from.x,g.from.y,g.to.x,g.to.y].every(finite) ||
      g.board.width <= 0 || g.board.height <= 0 ||
      [g.from,g.to].some(p => p.x < g.board.x-2 || p.x > g.board.x+g.board.width+2 ||
                             p.y < g.board.y-2 || p.y > g.board.y+g.board.height+2));
    if (bad) fail('P2_AIM_BOUNDS','Arrow endpoints outside board / nonfinite at revision '+bad.revision);
    else pass('P2_AIM_BOUNDS', aimSamples.length+' measured P2 arrow samples remain inside board');
  }

  const samples = Array.isArray(pc2.renderSamples) ? pc2.renderSamples : [];
  if (samples.length < 3) hold('P2_MOTION_SMOOTHNESS', 'Need client render frames to distinguish interpolation from teleport');
  else {
    let spikes = 0, comparable = 0;
    for(let i=1;i<samples.length;i++) {
      const p=samples[i-1],q=samples[i];
      if (p.id !== q.id || p.respawn || q.respawn) continue;
      const dt=(q.atMs-p.atMs)/1000;
      if (!finite(dt) || dt<=0 || dt>0.125 || ![p.x,p.y,q.x,q.y,p.speed,q.speed].every(finite)) continue;
      comparable++;
      const displacement=Math.hypot(q.x-p.x,q.y-p.y);
      if(displacement > Math.max(24, Math.max(p.speed,q.speed)*dt*2+14))spikes++;
    }
    if (!comparable) hold('P2_MOTION_SMOOTHNESS', 'No comparable same-ball consecutive render frames');
    else if (spikes) hold('P2_MOTION_SMOOTHNESS', spikes+' unexplained large jumps / '+comparable+' pairs; requires collision/event video corroboration');
    else pass('P2_MOTION_SMOOTHNESS', comparable+' consecutive measured frame pairs within diagnostic velocity envelope');
  }
  hold('P2_PERSPECTIVE', 'A10 orientation acceptance required; device-relative local-bottom contract not yet approved');
  hold('POWER_BAR_SIMPLIFICATION', 'P2 scope: wait for explicit A10 design acceptance');
  const values = Object.values(gates).map(x => x.status);
  return { decision: values.includes('FAIL') ? 'FAIL' : values.includes('HOLD') ? 'HOLD' : 'PASS', gates };
}
function normalizeBalls(x) {
  if (!Array.isArray(x)) return null;
  return x.map(b => [b.id,b.owner,b.x,b.y,b.hp]).sort((a,b)=>a[0]-b[0]);
}
function selfTest(){
  const sourceSha='10f64e4d213f17a352ed8fa83bc75884a39549f0';
  const f=(rev,turn,owner)=>({atMs:rev*250,revision:rev,turn,phase:'Aiming',actionSerial:rev, yourTurn:turn===owner,
    balls:[{id:7,owner:1,x:100+rev,y:200,hp:20}]});
  const host={schema:'CC001-W9-PC-EVIDENCE-v1',peer:'PC1',localOwner:0,sourceSha,session:'demo',frames:[f(1,0,0),f(2,1,0)],acceptedIntents:[{owner:1,sequence:1,actionSerial:2,accepted:true}]};
  const client={schema:'CC001-W9-PC-EVIDENCE-v1',peer:'PC2',localOwner:1,sourceSha,session:'demo',frames:[f(1,0,1),f(2,1,1)],sentIntents:[{owner:1,sequence:1}]};
  assert.equal(evaluate(host,client).gates.PEER_IDENTITY.status,'PASS');
  assert.equal(evaluate(host,client).gates.LOCAL_TURN_HEADER.status,'PASS');
  assert.equal(evaluate(host,client).gates.AUTHORITATIVE_PARITY.status,'PASS');
  assert.equal(evaluate(host,client).gates.P2_ACCEPTED_ONCE.status,'PASS');
  assert.equal(evaluate(host,client).decision,'HOLD'); // missing P2 original aim/render, A10 gates
  const cloned=(o)=>JSON.parse(JSON.stringify(o));
  {const c=cloned(client);c.frames[0].yourTurn=true;assert.equal(evaluate(host,c).gates.LOCAL_TURN_HEADER.status,'FAIL');}
  {const c=cloned(client);c.frames[1].revision=0;assert.equal(evaluate(host,c).gates.SNAPSHOT_ORDER.status,'FAIL');}
  {const c=cloned(client);c.frames[1].balls[0].x+=7;assert.equal(evaluate(host,c).gates.AUTHORITATIVE_PARITY.status,'FAIL');}
  {const h=cloned(host);h.acceptedIntents.push(cloned(h.acceptedIntents[0]));assert.equal(evaluate(h,client).gates.P2_ACCEPTED_ONCE.status,'FAIL');}
  {const c=cloned(client);c.frames[1].aim={board:{x:0,y:0,width:540,height:900},from:{x:270,y:850},to:{x:600,y:930}};assert.equal(evaluate(host,c).gates.P2_AIM_BOUNDS.status,'FAIL');}
  {const c=cloned(client);c.frames.pop();assert.equal(evaluate(host,c).gates.FINAL_CONVERGENCE.status,'HOLD');}
  {const c=cloned(client);c.renderSamples=[{id:7,atMs:0,x:30,y:300,speed:3},{id:7,atMs:16,x:180,y:310,speed:3},{id:7,atMs:32,x:181,y:310,speed:3}];assert.equal(evaluate(host,c).gates.P2_MOTION_SMOOTHNESS.status,'HOLD');}
  {const h=cloned(host),c=cloned(client);delete h.frames[1].balls;delete c.frames[1].balls;
   assert.equal(evaluate(h,c).gates.AUTHORITATIVE_PARITY.status,'HOLD');}
  {const c=cloned(client);c.frames[1].balls[0].x=Number.NaN;
   assert.equal(evaluate(host,c).gates.AUTHORITATIVE_PARITY.status,'HOLD');}
  {const h=cloned(host),c=cloned(client);h.acceptedIntents.push({owner:1,sequence:2,actionSerial:2,accepted:true});
   c.sentIntents.push({owner:1,sequence:2});
   assert.equal(evaluate(h,c).gates.P2_ACCEPTED_ONCE.status,'FAIL');}
  console.log('A60 W10 self-test PASS: 15 assertions; no Unity/net execution');
}
if (require.main === module) {
  if (process.argv[2] === '--self-test') selfTest();
  else if (process.argv.length !== 4) { console.error('Usage: node cc001-w9-two-pc-gate.cjs PC1.json PC2.json | --self-test'); process.exitCode=64; }
  else {
    try {
      const out=evaluate(JSON.parse(fs.readFileSync(process.argv[2],'utf8')),JSON.parse(fs.readFileSync(process.argv[3],'utf8')));
      console.log(JSON.stringify(out,null,2));process.exitCode=out.decision==='PASS'?0:out.decision==='FAIL'?1:2;
    } catch(e){console.error('Invalid input: '+e.message);process.exitCode=64;}
  }
}
module.exports={evaluate};
