#!/usr/bin/env node
'use strict';
/**
 * CC-001 R17-W11 A51, independent read-only analysis of actual Unity Player.log markers.
 * Recognizes A31 opt-in per-snapshot and A41 1Hz sampled markers. Does not perform network I/O.
 * Reports only source-local, privacy-minimized aggregate evidence; never certifies G3/G4.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const TAGS = [
  ['CC_NET_TRACE_TX', 'A31', 'TX', 'PC1', ['rev','serial','tms','turn','phase','bytes','chunks']],
  ['CC_NET_TRACE_RX', 'A31', 'RX', 'PC2', ['rev','serial','tms','turn','phase','chunks']],
  ['CC_W10_NET_HOST', 'A41', 'HOST_SAMPLE', 'PC1', ['revision','action','turn','phase','balls','packedBytes','chunks','periodMs']],
  ['CC_W10_NET_CLIENT', 'A41', 'CLIENT_SAMPLE', 'PC2', ['revision','action','turn','phase','balls','received','skippedRevisions']]
];
const FIELD_RE = /\b([a-zA-Z][a-zA-Z0-9]*)=([^\s]+)/g;
const WHOLE = /^(?:0|[1-9][0-9]*)$/;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
// Exact candidate #207 / NetworkSnapshotRate.Interval. Validated against the
// C# source at 173273122c11cbf738e8b954e32506a6196fe8ec.
// This is a *reported cadence policy* check, NOT a wall-clock/net-jitter test.
const CANDIDATE_SHA = '173273122c11cbf738e8b954e32506a6196fe8ec';
function expectedPeriodMs(phase, compressedBytes) {
  if (phase !== 'Moving') return 250;
  if (compressedBytes < 8192) return 50;
  if (compressedBytes < 16384) return 83; // int((1f/12f)*1000f)
  if (compressedBytes < 65536) return 125;
  return 250;
}
function parseLogBuffer(bytes, peer) {
  if (!['PC1','PC2'].includes(peer)) throw Error('peer must be PC1 or PC2');
  if (!Buffer.isBuffer(bytes)) throw Error('input must be a Buffer');
  const rows = [], errors = [], lines = bytes.toString('utf8').split(/\r?\n/);
  // A41 owns W11 digest validation/parity. Count only markers here, without
  // duplicating its comparator or exposing digest/IP/session data in summaries.
  const digestMarkers={TX:0,RX:0,unknown:0};
  for (const [index, line] of lines.entries()) {
    if(line.includes('CC_W11_STATE_')){
      const markers=[...line.matchAll(/\bCC_W11_STATE_(TX|RX)\b/g)];
      if(markers.length!==1){digestMarkers.unknown++;errors.push({code:'UNRECOGNIZED_OR_AMBIGUOUS_W11_DIGEST_MARKER',peer,line:index+1});}
      else{
        const side=markers[0][1];digestMarkers[side]++;
        if(side!==(peer==='PC1'?'TX':'RX'))
          errors.push({code:'WRONG_W11_DIGEST_TRACE_SIDE',peer,line:index+1});
      }
    }
    const matched = TAGS.filter(([tag]) => new RegExp('\\b'+tag+'\\b').test(line));
    if (!matched.length) continue;
    if (matched.length!==1) { errors.push({code:'AMBIGUOUS_TRACE_TAG',peer,line:index+1}); continue; }
    const [tag,producer,kind,expected,required] = matched[0];
    if (peer!==expected) { errors.push({code:'WRONG_TRACE_SIDE',peer,line:index+1,kind}); continue; }
    const body=line.slice(line.indexOf(tag)+tag.length), fields={}, seen=new Set();
    let invalid=null;
    for (const m of body.matchAll(FIELD_RE)) {
      if(seen.has(m[1])) { invalid='DUPLICATE_TRACE_FIELD'; break; }
      seen.add(m[1]); fields[m[1]]=m[2];
    }
    if (!invalid && required.some(k=>!(k in fields))) invalid='MISSING_TRACE_FIELD';
    if (!invalid && !['Aiming','Moving','Over'].includes(fields.phase)) invalid='INVALID_TRACE_PHASE';
    if (!invalid) for(const key of required.filter(k=>k!=='phase')) {
      if (!WHOLE.test(fields[key]) || !Number.isSafeInteger(Number(fields[key]))) { invalid='INVALID_TRACE_NUMBER'; break; }
      fields[key]=Number(fields[key]);
    }
    if (invalid) { errors.push({code:invalid,peer,line:index+1,kind}); continue; }
    // Reserved zero revision / empty chunk sets cannot describe an accepted snapshot.
    if (fields.rev === 0 || fields.revision === 0 || fields.chunks === 0 ||
        (kind === 'HOST_SAMPLE' && fields.packedBytes === 0) ||
        (kind === 'TX' && fields.bytes === 0) ||
        (kind === 'CLIENT_SAMPLE' && fields.received === 0)) {
      errors.push({code:'INVALID_TRACE_DOMAIN',peer,line:index+1,kind}); continue;
    }
    // No raw original text, local addresses, connection IDs or free-form messages in output.
    rows.push({peer,line:index+1,producer,kind,revision:fields.rev??fields.revision,
      actionSerial:fields.serial??fields.action,turn:fields.turn,phase:fields.phase,
      tms:fields.tms??null,chunks:fields.chunks,bytes:fields.bytes??fields.packedBytes??null,
      balls:fields.balls??null,periodMs:fields.periodMs??null,
      received:fields.received??null,skippedRevisions:fields.skippedRevisions??null});
  }
  return {source:{sha256:sha256(bytes),bytes:bytes.length},peer,rows,errors,auxiliary:{digestMarkers}};
}
function readLog(filename,peer){return parseLogBuffer(fs.readFileSync(filename),peer);}
function analyze(pc1,pc2){
  const sources=[pc1,pc2].filter(Boolean);
  if (!sources.length) throw Error('at least one input is required');
  for(const [i,source] of sources.entries()){
    if (!source.source?.sha256 || !Array.isArray(source.rows) || !Array.isArray(source.errors) || !['PC1','PC2'].includes(source.peer))throw Error('invalid parsed source '+i);
  }
  if(pc1?.peer!=='PC1' && pc1)throw Error('PC1 input is mislabeled');
  if(pc2?.peer!=='PC2' && pc2)throw Error('PC2 input is mislabeled');
  const all=sources.flatMap(s=>s.rows),errors=sources.flatMap(s=>s.errors),findings=[],warnings=[];
  const digestMarkers={pc1Tx:pc1?.auxiliary?.digestMarkers?.TX??0,
    pc2Rx:pc2?.auxiliary?.digestMarkers?.RX??0,
    wrongSideOrUnknown:(pc1?.auxiliary?.digestMarkers?.RX??0)+(pc2?.auxiliary?.digestMarkers?.TX??0)+
      (pc1?.auxiliary?.digestMarkers?.unknown??0)+(pc2?.auxiliary?.digestMarkers?.unknown??0)};
  const hasW11DigestMarkers=Object.values(digestMarkers).some(n=>n>0);
  const flag=(code,severity,fields={})=>findings.push({code,severity,...fields});
  for(const e of errors)flag(e.code,'ERROR',e);
  const producers=[...new Set(all.map(r=>r.producer))];
  const mixed=producers.length>1;
  if(mixed)flag('MIXED_TRACE_PRODUCERS','ERROR',{producers});
  const producer=mixed?'MIXED':producers[0]??'NONE';
  let hostCadencePolicyChecks=0, hostCadencePolicyViolations=0;

  for (const source of sources) {
    const grouped=new Map();
    for (const e of source.rows){
      if(!grouped.has(e.kind)) grouped.set(e.kind,[]);
      grouped.get(e.kind).push(e);
    }
    for(const [kind,stream] of grouped){
      let last=-1,lastAction=-1,lastTms=-1,lastReceived=-1,lastSkipped=-1;
      const seenRevisions=new Set();
      for(const e of stream){
        if(e.revision<=last)flag('NON_MONOTONIC_REVISION','ERROR',{peer:e.peer,kind,revision:e.revision,previous:last,line:e.line});
        if(seenRevisions.has(e.revision))flag('DUPLICATE_REVISION','ERROR',{peer:e.peer,kind,revision:e.revision,line:e.line});
        seenRevisions.add(e.revision); last=Math.max(last,e.revision);
        // An actionSerial rewind can be a splice of two different sessions;
        // do not classify it as a proven transport defect without runId.
        if(e.actionSerial<lastAction)flag('ACTION_SERIAL_REWIND_OR_MIXED_SESSIONS','ERROR',
          {peer:e.peer,kind,revision:e.revision,line:e.line});
        lastAction=Math.max(lastAction,e.actionSerial);
        if(kind==='HOST_SAMPLE'){
          hostCadencePolicyChecks++;
          const expected=expectedPeriodMs(e.phase,e.bytes);
          if(e.periodMs!==expected){hostCadencePolicyViolations++;
            flag('REPORTED_CADENCE_POLICY_MISMATCH','ERROR',
              {peer:e.peer,kind,revision:e.revision,line:e.line,reportedMs:e.periodMs,expectedMs:expected,compressedBytes:e.bytes});
          }
        }
        if(e.tms!==null){if(e.tms<lastTms)flag('LOCAL_MONOTONIC_CLOCK_REGRESSION','ERROR',{peer:e.peer,kind,line:e.line});lastTms=Math.max(lastTms,e.tms);}
        if(e.received!==null){if(e.received<lastReceived)flag('CLIENT_RECEIVED_COUNTER_REWIND','ERROR',{peer:e.peer,line:e.line});lastReceived=e.received;}
        if(e.skippedRevisions!==null){if(e.skippedRevisions<lastSkipped)flag('CLIENT_SKIPPED_COUNTER_REWIND','ERROR',{peer:e.peer,line:e.line});lastSkipped=e.skippedRevisions;}
      }
    }
  }
  const host=all.filter(e=>e.peer==='PC1' && (e.kind==='TX'||e.kind==='HOST_SAMPLE'));
  const client=all.filter(e=>e.peer==='PC2' && (e.kind==='RX'||e.kind==='CLIENT_SAMPLE'));
  // Preserve FIRST row; duplicates are independently flagged, not last-write-wins.
  const hostMap=new Map(),clientMap=new Map();
  for(const e of host)if(!hostMap.has(e.revision))hostMap.set(e.revision,e);
  for(const e of client)if(!clientMap.has(e.revision))clientMap.set(e.revision,e);
  let paired=0,unpairedHost=0,unpairedClient=0;
  if(!mixed){
    for(const [rev,s] of hostMap){
      const c=clientMap.get(rev);
      if(!c){unpairedHost++;continue;}
      paired++;
      for(const key of ['actionSerial','turn','phase','chunks']){
        if(s[key]!==c[key])flag('SAME_REVISION_FIELD_MISMATCH','ERROR',{revision:rev,field:key,host:s[key],client:c[key]});
      }
      if(s.balls!==null&&c.balls!==null&&s.balls!==c.balls)flag('SAME_REVISION_FIELD_MISMATCH','ERROR',{revision:rev,field:'balls',host:s.balls,client:c.balls});
    }
    for(const rev of clientMap.keys())if(!hostMap.has(rev))unpairedClient++;
  }
  if(unpairedHost||unpairedClient)warnings.push('Unpaired sampled/opt-in log rows do NOT prove packet loss, since capture can omit revisions.');
  if(hasW11DigestMarkers){
    warnings.push('W11 A41 digest markers detected but NOT parsed or compared by A51. Run scripts/cc001/w11/a41/state-parity.cjs on the SAME two original PC1/PC2 logs; A51 metadata cannot certify wire-state parity.');
    if(!digestMarkers.pc1Tx||!digestMarkers.pc2Rx)
      warnings.push('W11 digest capture is one-sided or incomplete; no paired-state conclusion can be drawn.');
  }else warnings.push('A31/W10 metadata lacks state-payload digests; A41 W11 digest samples, if present in the built Player, require separate same-revision verification and are NOT assumed here.');
  warnings.push('No native marker contains an authenticated runId; even a digest match must be associated with a verified same-binary two-PC run.');
  warnings.push('Local monotonic tms values are process-specific; do NOT subtract PC1 and PC2 tms to calculate one-way latency.');
  warnings.push('No frame coordinates/timestamps in these sources; neither smooth rendering nor genuine teleports can be certified.');
  warnings.push('Candidate source SHA is a parser policy pin, not a proof of the Unity Player binary SHA or session identity.');
  const hardErrors=findings.filter(f=>f.severity==='ERROR').length;
  const traceCoverage=producer==='NONE'?(hasW11DigestMarkers?'W11_DIGEST_ONLY_HOLD':'NO_TRACE_ROWS'):mixed?'MIXED_HOLD':!pc1||!pc2?'ONE_SIDED_HOLD':producer==='A31'?'OPT_IN_A31_PER_SNAPSHOT':'SPARSE_A41_SAMPLED';
  return {schema:'CC001_R17_W11_A51_NATIVE_TRACE_V2',candidateSourceSha:CANDIDATE_SHA,evidence:'NATIVE_LOG_FORMAT_PARSER',traceCoverage,
    sources:{pc1:pc1?.source??null,pc2:pc2?.source??null},producer,
    observations:{hostRows:host.length,clientRows:client.length,pairedRevisionRows:paired,unpairedHostRows:unpairedHost,unpairedClientRows:unpairedClient,
      hostIntervalSamples:host.map(e=>e.periodMs).filter(x=>x!==null),
      hostCadencePolicyChecks,hostCadencePolicyViolations,w11DigestMarkers:digestMarkers,
      maxReportedSkippedClientRevisions:client.map(e=>e.skippedRevisions).filter(x=>x!==null).reduce((a,b)=>Math.max(a,b),0),
      localOneWayLatencyMs:null,payloadHashPairs:0,frameCoordinates:0},
    findings,warnings,
    qualification:{parser:hardErrors?'TRACE_FIELDS_INVALID':!all.length?(hasW11DigestMarkers?'W11_DIGEST_ONLY_NOT_COMPARED':'NO_TRACE'):'TRACE_FIELDS_OBSERVED',sameRevisionMetadata:hardErrors?'HOLD_ERRORS':paired?'MATCHED_METADATA_ONLY':'NOT_PROVEN',authoritativeStateParity:hasW11DigestMarkers?'NOT_PROVEN_A41_COMPARATOR_REQUIRED':'NOT_PROVEN_NO_PAYLOAD_HASH',visualSmoothness:'NOT_PROVEN_NO_FRAMES',G3:'NOT_CERTIFIED_BY_ANALYZER',G4:'NOT_CERTIFIED_BY_ANALYZER'}};
}
function argsParse(argv){const a={};for(let i=0;i<argv.length;i++){const key=argv[i];if(!['--pc1','--pc2','--out'].includes(key))throw Error('Unknown argument '+key);if(key in a)throw Error('Duplicate argument '+key);const val=argv[++i];if(!val)throw Error('Missing '+key);a[key.slice(2)]=val;}if(!a.pc1&&!a.pc2)throw Error('Supply --pc1 and/or --pc2');return a;}
function cli(argv){const args=argsParse(argv);const result=analyze(args.pc1?readLog(args.pc1,'PC1'):null,args.pc2?readLog(args.pc2,'PC2'):null);const body=JSON.stringify(result,null,2)+'\n';if(args.out)fs.writeFileSync(args.out,body,{flag:'wx'});else process.stdout.write(body);}
if(require.main===module){try{cli(process.argv.slice(2));}catch(e){process.stderr.write('A51_W11_TRACE_INPUT_ERROR: '+e.message+'\n');process.exitCode=2;}}
module.exports={parseLogBuffer,readLog,analyze,argsParse,expectedPeriodMs,CANDIDATE_SHA};
