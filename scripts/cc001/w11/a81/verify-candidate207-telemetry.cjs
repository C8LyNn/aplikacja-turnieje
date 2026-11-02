#!/usr/bin/env node
'use strict';
/** RC1-protected CC-001 W11/#207 sampled diagnostic, NOT real PC1/PC2 QA. */
const fs=require('node:fs'), crypto=require('node:crypto');
const {BoundedTrace}=require('../../w15/a81/bounded-trace.cjs');
const PIN='173273122c11cbf738e8b954e32506a6196fe8ec';
const QA_FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const SCHEMA='CC001_A81_W11_CANDIDATE207_SAMPLED_V1';
const specs={HOST:['revision','action','turn','phase','balls','packedBytes','chunks','periodMs'],CLIENT:['revision','action','turn','phase','balls','received','skippedRevisions']};
const numeric=new Set(['revision','action','turn','balls','packedBytes','chunks','periodMs','received','skippedRevisions']);
const FROZEN_MATCH_PHASES=new Set(['Aiming','Moving','Over']); // GameState.cs MatchPhase at W11 QA SHA
const validNumber=x=>/^(?:0|[1-9][0-9]*)$/.test(x)&&Number.isSafeInteger(Number(x))?Number(x):null;
function parse(text,side){
  if(!specs[side])throw Error('Invalid role');
  const capped=new BoundedTrace();
  const records=capped.records,errors=capped.errors;let found=0;
  for(const [index,line] of String(text).split(/\r?\n/).entries()){
    const m=/(?:^|\s)CC_W10_NET_(HOST|CLIENT)(?=\s|$)/.exec(line);
    if(!m)continue;
    found++;
    if(!capped.admit(index+1))continue;
    if(m[1]!==side){capped.error({code:'WRONG_ENDPOINT',line:index+1});continue;}
    const rest=line.slice(m.index+m[0].length).trim().split(/\s+/);
    const fields=Object.create(null);let bad=false;
    for(const part of rest){const kv=/^([A-Za-z]+)=(\S+)$/.exec(part);
      if(!kv||Object.hasOwn(fields,kv[1])||!specs[side].includes(kv[1])){bad=true;break;}
      fields[kv[1]]=kv[2];
    }
    if(specs[side].some(k=>!Object.hasOwn(fields,k)))bad=true;
    const record={line:index+1};
    if(!bad){for(const k of specs[side]){
      record[k]=numeric.has(k)?validNumber(fields[k]):fields[k];
      if(record[k]===null)bad=true;
    }}
    if(!bad&&(record.turn>1||!FROZEN_MATCH_PHASES.has(record.phase)||
      record.balls<1||(side==='HOST'&&(record.packedBytes<1||record.chunks<1))||
      (side==='CLIENT'&&record.received<1)))bad=true;
    if(bad)capped.error({code:'MALFORMED_'+side,line:index+1});else capped.record(record);
  }
  return {found,records,errors,...capped.summary()};
}
function expectedMs(phase,bytes){if(phase!=='Moving')return 250;
  if(bytes>=65536)return 250;if(bytes>=16384)return 125;if(bytes>=8192)return 83;return 50;}
function analyze(hostText,clientText){
  const host=parse(hostText,'HOST'),client=parse(clientText,'CLIENT'),errors=[...host.errors.map(e=>({...e,peer:'PC1'})),...client.errors.map(e=>({...e,peer:'PC2'}))],notices=[];
  function mark(code,extra){if(errors.length<100)errors.push({code,...extra});}
  // One Player.log may contain multiple sessions with reused revision IDs.
  const multiSession=(String(hostText).match(/(?:^|\s)CC_NET_HOST_READY\s+port=\d+(?=\s|$)/g)||[]).length>1||
    (String(clientText).match(/(?:^|\s)CC_NET_STATE_APPLIED\s+revision=\d+\s+owner=1(?=\s|$)/g)||[]).length>1;
  if(multiSession)notices.push('MULTIPLE_SESSIONS_CROP_ORIGINAL_LOGS_TO_ONE_MATCH');
  // Newer A41 wire-state digest markers are not in frozen W11 candidate.
  if(/(?:^|\s)CC_W11_STATE_(?:TX|RX)(?=\s|$)/.test(String(hostText)+'\n'+String(clientText)))
    mark('POST_FREEZE_TELEMETRY_PRESENT',{});
  if(!multiSession)for(const [side,data] of [['PC1',host.records],['PC2',client.records]]){
    let prev=null;
    for(const row of data){
      if(prev&&row.revision<=prev.revision)mark('NONINCREASING_REVISION',{peer:side,revision:row.revision});
      if(prev&&row.action<prev.action)mark('ACTION_ROLLBACK',{peer:side,revision:row.revision});
      if(side==='PC2'&&prev&&row.received<=prev.received)mark('RECEIVED_COUNTER_ROLLBACK',{peer:side,revision:row.revision});
      if(side==='PC2'&&prev&&row.skippedRevisions<prev.skippedRevisions)mark('SKIPPED_COUNTER_ROLLBACK',{peer:side,revision:row.revision});
      prev=row;
    }
  }
  for(const row of host.records){const expected=expectedMs(row.phase,row.packedBytes);
    if(row.periodMs!==expected)mark('ADAPTIVE_CADENCE_MISMATCH',{revision:row.revision,expectedMs:expected,reportedMs:row.periodMs});
  }
  const clientRevs=new Map(client.records.map(x=>[x.revision,x]));let overlapping=0;
  if(!multiSession)for(const h of host.records){const c=clientRevs.get(h.revision);if(!c)continue;overlapping++;
    for(const field of ['action','turn','phase','balls'])if(h[field]!==c[field])mark('MATCHED_REVISION_METADATA_MISMATCH',{revision:h.revision,field});
  }
  if(host.omittedErrors||client.omittedErrors)notices.push('TRACE_ERRORS_CAPPED_OMITTED_COUNTS_RETAINED');
  if(host.omittedMarkers||client.omittedMarkers)notices.push('TRACE_MARKER_LIMIT_EXCEEDED_CROP_TO_ONE_MATCH');
  if(!host.records.length||!client.records.length)notices.push('MISSING_SELECTED_CANDIDATE_TELEMETRY');
  if(!overlapping)notices.push('NO_COMMON_REVISION_IN_SPARSE_1HZ_SAMPLE');
  notices.push('UNPAIRED_1HZ_SAMPLES_DO_NOT_PROVE_PACKET_LOSS');
  notices.push('NO_FULL_GAMESTATE_DIGEST_OR_PER_FRAME_BALL_POSE');
  // No shared snapshot ID means no PC1-PC2 comparison occurred: HOLD.
  const verdict=errors.length?'ANOMALY_IN_SUPPLIED_LOGS':
    (!host.records.length||!client.records.length||!overlapping||multiSession?'INSUFFICIENT_SELECTED_LOGS':'SAMPLED_DIAGNOSTIC_ONLY');
  return {schema:SCHEMA,schemaAnchorSha:PIN,qaFreezeSourceSha:QA_FREEZE,runtimeBinarySourceSha:'NOT_VERIFIED',verdict,gameplayGate:'NOT_ATTESTED',physicalPc1Pc2Qa:'NOT_ATTESTED',
    telemetryMode:'W10_1HZ_SAMPLED',hostMarkers:host.found,clientMarkers:client.found,
    validHost:host.records.length,validClient:client.records.length,matchingRevisionSamples:overlapping,
    omittedHostMarkers:host.omittedMarkers,omittedClientMarkers:client.omittedMarkers,
    omittedHostErrorDetails:host.omittedErrors,omittedClientErrorDetails:client.omittedErrors,
    errors,notices};
}
function run(argv){
  const args={};if(argv.length%2)throw Error('Usage: --host PC1.log --client PC2.log [--out report.json]');
  for(let i=0;i<argv.length;i+=2){if(!['--host','--client','--out'].includes(argv[i])||Object.hasOwn(args,argv[i]))throw Error('Invalid argument');args[argv[i]]=argv[i+1];}
  if(!args['--host']||!args['--client']||args['--host']===args['--client'])throw Error('Two distinct logs required');
  // Distinct path strings are not proof of independent files: reject hardlink/symlink alias.
  const identities=[args['--host'],args['--client']].map(p=>{const stat=fs.lstatSync(p);
    if(!stat.isFile()||stat.size>32*1024*1024)throw Error('Input must be a regular non-link log <=32MiB');
    return {dev:stat.dev,ino:stat.ino};
  });
  if(identities[0].dev===identities[1].dev&&identities[0].ino===identities[1].ino)
    throw Error('Two independent log files are required');
  const buffers=[args['--host'],args['--client']].map(p=>fs.readFileSync(p));
  const report=analyze(...buffers.map(b=>b.toString('utf8')));
  report.inputReceipts={PC1:{sha256:crypto.createHash('sha256').update(buffers[0]).digest('hex'),bytes:buffers[0].length},PC2:{sha256:crypto.createHash('sha256').update(buffers[1]).digest('hex'),bytes:buffers[1].length}};
  const out=JSON.stringify(report,null,2)+'\n';if(args['--out'])fs.writeFileSync(args['--out'],out,{flag:'wx'});else process.stdout.write(out);
  return report.verdict==='ANOMALY_IN_SUPPLIED_LOGS'?1:report.verdict==='INSUFFICIENT_SELECTED_LOGS'?2:0;
}
module.exports={parse,expectedMs,analyze,run,PIN,QA_FREEZE};
if(require.main===module){try{process.exitCode=run(process.argv.slice(2));}catch(e){
  // OS filesystem errors include absolute paths; print only the stable error code.
  process.stderr.write('A81_INPUT_ERROR '+(e.code?'FILE_IO_'+e.code:e.message)+'\n');process.exitCode=3;}}
