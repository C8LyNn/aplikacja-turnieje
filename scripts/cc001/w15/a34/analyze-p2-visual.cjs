'use strict';
// CC-001 / A34 W15: inspect ORIGINAL P2 Player.log visual-pacing marker.
// Observational only. No cross-PC state, binary attestation, or G3 claim.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_BYTES = 64 * 1024 * 1024;
const REQUIRED = ['elapsed','frames','frameSamples','fps','frameP95ms','snapshots',
  'maxRxGapMs','rxGapP95ms','rxGapSamples','rxGaps','rxGapsOver300ms',
  'postBlendWaitMs','postBlendWaitFrames'];
const INTEGERS = new Set(['frames','frameSamples','snapshots','rxGapSamples',
  'rxGaps','rxGapsOver300ms','postBlendWaitFrames']);
const MARKER = /(?:^|\s)CC_W12_VISUAL_P2(?=\s)/;
function parseLine(line, lineNumber) {
  const m = MARKER.exec(line);
  if (!m) return null;
  const tail = line.slice(m.index + m[0].length).trim();
  const row = Object.create(null);
  const fields = tail.split(/\s+/).filter(Boolean);
  for (const token of fields) {
    const pair = /^([A-Za-z][A-Za-z0-9]*)=([^\s]+)$/.exec(token);
    if (!pair) throw Error('MALFORMED_FIELD at marker line ' + lineNumber);
    if (Object.hasOwn(row,pair[1])) throw Error('DUPLICATE_FIELD at marker line '+lineNumber);
    row[pair[1]] = pair[2];
  }
  for (const k of REQUIRED) {
    if (!Object.hasOwn(row,k)) throw Error('MISSING_FIELD '+k+' at marker line '+lineNumber);
    if (k === 'rxGapP95ms' && row[k] === 'NA') continue;
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(row[k])) throw Error('INVALID_NUMBER '+k+' at marker line '+lineNumber);
    row[k] = Number(row[k]);
    if (!Number.isFinite(row[k])) throw Error('NONFINITE_NUMBER at marker line '+lineNumber);
    if (INTEGERS.has(k) && !Number.isSafeInteger(row[k])) throw Error('NONINTEGER '+k+' at marker line '+lineNumber);
  }
  if (row.elapsed < 5 || row.frames < 1 || row.frameSamples !== Math.min(512,row.frames) ||
      row.rxGapSamples !== Math.min(256,row.rxGaps) ||
      row.rxGaps > row.snapshots || row.rxGapsOver300ms > row.rxGaps ||
      row.postBlendWaitFrames > row.frames ||
      (row.rxGapSamples === 0) !== (row.rxGapP95ms === 'NA') ||
      (row.rxGapP95ms !== 'NA' && row.rxGapP95ms > row.maxRxGapMs + 0.01) ||
      (row.rxGapsOver300ms > 0 && row.maxRxGapMs <= 300)) {
    throw Error('INCONSISTENT_METRICS at marker line '+lineNumber);
  }
  return row;
}
function summarize(text, fullBytes) {
  const matched=[];
  const lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const row=parseLine(lines[i],i+1);
    if(row)matched.push(row);
  }
  if(!matched.length)return {exit:2,result:{status:'HOLD_NO_P2_VISUAL_MARKERS',g3:'NOT_ATTESTED',logSha256:crypto.createHash('sha256').update(fullBytes).digest('hex'),rows:0}};
  // Bound stack use for large Player.log files: never spread arbitrary marker rows.
  const max=(key)=>matched.reduce((v,x)=>Math.max(v,x[key]),0);
  const gapMax=matched.reduce((v,x)=>typeof x.rxGapP95ms==='number' ? Math.max(v,x.rxGapP95ms) : v,-1);
  const res={status:'P2_VISUAL_METADATA_ONLY',g3:'NOT_ATTESTED',
    origin:'single_local_P2_log_only',binaryShaVerified:false,
    logSha256:crypto.createHash('sha256').update(fullBytes).digest('hex'),
    rows:matched.length,
    framesObserved:matched.reduce((n,x)=>n+x.frames,0),
    snapshotsObserved:matched.reduce((n,x)=>n+x.snapshots,0),
    frameP95MaxMs:max('frameP95ms'),maxRxGapMs:max('maxRxGapMs'),
    rxGapP95MaxMs:gapMax>=0?gapMax:null,
    windowsWithRxGapOver300ms:matched.filter(x=>x.rxGapsOver300ms>0).length,
    windowsWithFrameP95Over1000ms:matched.filter(x=>x.frameP95ms>1000).length,
    noPacketLossInference:true};
  return {exit:0,result:res};
}
function main(argv) {
  if(argv.length!==4||argv[0]!=='--log'||argv[2]!=='--out') throw Object.assign(Error('USAGE --log <original Player.log> --out <new report.json>'),{exit:3});
  const [input,output]=[argv[1],argv[3]].map(x=>path.resolve(x));
  if(input===output)throw Object.assign(Error('INPUT_EQUALS_OUTPUT'),{exit:3});
  let st;
  try{st=fs.lstatSync(input);}catch{throw Object.assign(Error('MISSING_INPUT'),{exit:2});}
  if(!st.isFile()||st.isSymbolicLink()||st.size>MAX_BYTES)throw Object.assign(Error('UNSAFE_OR_OVERSIZE_INPUT'),{exit:2});
  if(fs.existsSync(output))throw Object.assign(Error('OUTPUT_ALREADY_EXISTS'),{exit:3});
  const raw=fs.readFileSync(input);
  let analysis;
  try{analysis=summarize(raw.toString('utf8'),raw);}catch(e){throw Object.assign(e,{exit:1});}
  fs.writeFileSync(output,JSON.stringify(analysis.result,null,2)+'\n',{flag:'wx',mode:0o600});
  return analysis;
}
if(require.main===module){try{const a=main(process.argv.slice(2));process.stdout.write(JSON.stringify({status:a.result.status,rows:a.result.rows,g3:a.result.g3})+'\n');process.exitCode=a.exit;}catch(e){process.stderr.write(String(e.message).replace(/[^A-Za-z0-9_. -]/g,'_')+'\n');process.exitCode=e.exit??1;}}
module.exports={parseLine,summarize,main};
