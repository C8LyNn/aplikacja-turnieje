#!/usr/bin/env node
'use strict';
// CC-001 / A74. Log metadata only: never copy raw Player.log text into the output.
// Usage: node cc001-w9-pc-log-evidence.cjs --pc1 <Player.log> --pc2 <Player.log> --out <report.json>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_INPUT_BYTES = 64 * 1024 * 1024;
const MAX_EVENTS_PER_PEER = 2000;
const SCHEMA = 'CC001-W9-PC1-PC2-LOG-EVIDENCE-V1';

function argsOf(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return {help:true};
  const names = new Set(['--pc1', '--pc2', '--out']);
  const result = {};
  for (let i=0;i<argv.length;i+=2) {
    if (!names.has(argv[i]) || i+1 >= argv.length || argv[i+1].startsWith('--') || result[argv[i]])
      throw new Error('Expected exactly --pc1, --pc2 and --out, each followed by one path');
    result[argv[i]] = argv[i+1];
  }
  if (Object.keys(result).length !== 3) throw new Error('Missing --pc1, --pc2 or --out');
  return {pc1:result['--pc1'],pc2:result['--pc2'],out:result['--out']};
}
function readInput(p) {
  let real,stat,bytes;
  try {
    real=fs.realpathSync(p);
    stat=fs.statSync(real);
    if (!stat.isFile()) throw new Error('not a regular file');
    if (stat.size > MAX_INPUT_BYTES) throw new Error('too large');
    bytes=fs.readFileSync(real);
  } catch { throw new Error('Input log unavailable, not a regular file, or over the 64 MiB safety limit'); }
  return {real,bytes};
}
function numericField(line, names) {
  const name=names.join('|');
  const found=line.match(new RegExp('(?:^|[^A-Za-z0-9_])(?:'+name+')\\s*(?:=|:|\\s)\\s*(\\d{1,10})(?!\\d)','i'));
  if (!found) return null;
  const n=Number(found[1]);
  return Number.isSafeInteger(n) ? n : null;
}
function safeTimestamp(line) {
  const m=line.match(/^\s*(\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)?)/);
  return m ? m[1] : null;
}
function eventType(line) {
  if (/\b(?:exception|fatal|error)\b/i.test(line)) return 'error';
  if (/\b(?:actionSerial|accepted\s+(?:command|intent)|CORE_CLASH_LAUNCH|\bintent\b)/i.test(line)) return 'intent';
  if (/\b(?:snapshot|revision|state\s*(?:sync|update))\b/i.test(line)) return 'snapshot';
  if (/\b(?:turn|YOUR SHOT|YOUR TURN|PLAYER\s*[12])\b/i.test(line)) return 'turn-ui';
  if (/\b(?:interpolat|teleport|jitter|lag|ball\s*(?:position|move|transform))\w*/i.test(line)) return 'ball-visual';
  if (/\b(?:connect|disconnect|relay|websocket|transport|NGO|network)\w*/i.test(line)) return 'network';
  if (/\b(?:warning|warn)\b/i.test(line)) return 'warning';
  return null;
}
function summarize(role, bytes) {
  const source= bytes.length>=2 && bytes[0]===0xff && bytes[1]===0xfe
    ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8').replace(/^\ufeff/,'');
  const lines=source.split(/\r?\n/);
  const count={error:0,intent:0,snapshot:0,'turn-ui':0,'ball-visual':0,network:0,warning:0};
  const events=[];
  let hasActionSerial=false, hasRevision=false, hasTimestamp=false, maxActionSerial=null, maxRevision=null;
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];
    const category=eventType(line);
    if (!category) continue;
    count[category]++;
    const serial=numericField(line,['actionSerial','action_serial']);
    const revision=numericField(line,['revision','snapshotRevision','snapshot_revision']);
    const turn=numericField(line,['turn','turnNumber']);
    const owner=numericField(line,['owner','player','localPlayer','seat']);
    const ts=safeTimestamp(line);
    if(serial!==null){hasActionSerial=true;maxActionSerial=Math.max(maxActionSerial??serial,serial);}
    if(revision!==null){hasRevision=true;maxRevision=Math.max(maxRevision??revision,revision);}
    if(ts!==null)hasTimestamp=true;
    if(events.length<MAX_EVENTS_PER_PEER) {
      // Intentionally allowlisted scalars only. No raw text, IP, username, file path, join code or tokens.
      const event={line:i+1,type:category};
      if(ts!==null)event.timestamp=ts;
      if(serial!==null)event.actionSerial=serial;
      if(revision!==null)event.revision=revision;
      if(turn!==null)event.turn=turn;
      if(owner!==null)event.owner=owner;
      if(category==='turn-ui')event.yourShot=/(?:YOUR\s+(?:SHOT|TURN))/i.test(line);
      events.push(event);
    }
  }
  return {
    role,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sourceBytes:bytes.length,lineCount:lines.length,categories:count,
    telemetryPresent:{actionSerial:hasActionSerial,snapshotRevision:hasRevision,utcOrLocalLogTimestamp:hasTimestamp},
    maxActionSerial,maxSnapshotRevision:maxRevision,
    selectedEventCount:events.length,eventsTruncated:Object.values(count).reduce((a,b)=>a+b,0)>events.length,
    events
  };
}
function buildEvidence(pc1,pc2) {
  const warnings=[];
  for(const peer of [pc1,pc2]){
    if(!peer.telemetryPresent.actionSerial)warnings.push(peer.role+': actionSerial absent from log text; no intent convergence proof');
    if(!peer.telemetryPresent.snapshotRevision)warnings.push(peer.role+': revision absent from log text; no snapshot convergence proof');
    if(!peer.telemetryPresent.utcOrLocalLogTimestamp)warnings.push(peer.role+': no parseable line timestamps; cross-machine latency NOT measurable');
    if(peer.eventsTruncated)warnings.push(peer.role+': event sampling capped; retained aggregate category counts');
  }
  return {schema:SCHEMA,generatedAtUtc:new Date().toISOString(),scope:'metadata-only; not G3 PASS',
    candidateSha:'UNVERIFIED — operator must separately pin installed Player/DLL SHA',
    privacy:'No raw log content or input path is exported; inspect JSON before sharing.',
    pc1,pc2,warnings,
    conclusions:{authoritativeConvergence:'NOT_EVALUATED',renderInterpolation:'NOT_EVALUATED',networkLatency:'NOT_EVALUATED'}};
}
function main(argv) {
  const opts=argsOf(argv);
  if(opts.help){process.stdout.write('Usage: node cc001-w9-pc-log-evidence.cjs --pc1 <Player.log> --pc2 <Player.log> --out <new-report.json>\n');return 0;}
  const input1=readInput(opts.pc1),input2=readInput(opts.pc2);
  if(input1.real===input2.real)throw new Error('PC1 and PC2 must be different raw log files');
  const out=path.resolve(opts.out);
  if (out===input1.real || out===input2.real)throw new Error('Output path must not overwrite a raw log');
  const result=buildEvidence(summarize('PC1',input1.bytes),summarize('PC2',input2.bytes));
  const payload=JSON.stringify(result,null,2)+'\n';
  try {fs.writeFileSync(out,payload,{flag:'wx',mode:0o600});}
  catch {throw new Error('Cannot create output: choose a new filename in an existing writable directory');}
  const digest=crypto.createHash('sha256').update(payload,'utf8').digest('hex');
  process.stdout.write('CC001 W9 evidence metadata CREATED; SHA256='+digest+'; events PC1='+result.pc1.selectedEventCount+', PC2='+result.pc2.selectedEventCount+'; warnings='+result.warnings.length+'\n');
  return 0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2));}catch(e){process.stderr.write('CC001 W9 evidence: '+e.message+'\n');process.exitCode=2;}}
module.exports={argsOf,numericField,safeTimestamp,eventType,summarize,buildEvidence,main};
