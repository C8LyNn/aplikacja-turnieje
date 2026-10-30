'use strict';
const fs=require('node:fs');
const required=['revision','action','turn','phase','balls','packedBytes','chunks',
  'periodMs','submitBytesTotal','submitChunksTotal','submitSnapshotsTotal','hostMs'];
const integers=required.filter(k=>k!=='phase');
const marker='CC_W10_NET_HOST';
const hostMarkerPattern=/(?:^|\s)CC_W10_NET_HOST(?=\s)/;
const maxBytes=256*1024,chunkBytes=900,budget=256*1024;
function lineFields(line){
  const match=hostMarkerPattern.exec(line);
  if(!match)throw Error('INVALID_HOST_MARKER');
  const words=line.slice(match.index+match[0].length).trim().split(/\s+/);
  const data=Object.create(null);
  for(const word of words){
    const i=word.indexOf('=');
    if(i<1)continue;
    const k=word.slice(0,i),v=word.slice(i+1);
    if(required.includes(k)){
      if(data[k]!==undefined)throw Error('DUPLICATE_KEY_'+k);
      data[k]=v;
    }
  }
  if(required.some(k=>data[k]===undefined))return null;
  for(const k of integers){
    if(!/^(0|[1-9][0-9]*)$/.test(data[k]))throw Error('INVALID_'+k);
    data[k]=Number(data[k]);
    if(!Number.isSafeInteger(data[k]))throw Error('UNSAFE_'+k);
  }
  if(!['Aiming','Moving','Over'].includes(data.phase))throw Error('INVALID_PHASE');
  if(data.turn>1||data.revision<1||data.periodMs<1||data.packedBytes<1||
     data.packedBytes>maxBytes||data.chunks<1||
     data.chunks!==Math.ceil(data.packedBytes/chunkBytes))throw Error('INVALID_SNAPSHOT_ROW');
  if(data.submitBytesTotal<data.packedBytes||
     data.submitChunksTotal<data.chunks||data.submitSnapshotsTotal<1||
     data.submitSnapshotsTotal>data.submitChunksTotal||
     data.submitChunksTotal>data.submitBytesTotal)throw Error('INVALID_LEDGER_ROW');
  return data;
}
function analyze(raw){
  const lines=String(raw||'').split(/\r?\n/);
  const startCount=lines.filter(x=>x.includes('CC_NET_HOST_READY ')||
    x.includes('CC_NET_RELAY_STARTED role=host')).length;
  if(startCount>1)return {status:'HOLD_MULTIPLE_SESSIONS',runtimeGate:'NOT_ASSESSED'};
  const hostLines=lines.filter(x=>hostMarkerPattern.test(x));
  if(hostLines.length===0)return {status:'HOLD_NO_HOST_MARKERS',runtimeGate:'NOT_ASSESSED'};
  const rows=hostLines.map(lineFields);
  if(rows.some(x=>x===null))return {status:'HOLD_W13_LEDGER_MISSING',runtimeGate:'NOT_ASSESSED'};
  if(rows.length<2)return {status:'HOLD_INSUFFICIENT_SAMPLES',runtimeGate:'NOT_ASSESSED',samples:rows.length};
  let totalBytes=0,totalMs=0,peak=0,overBudgetWindows=0;
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1],b=rows[i];
    const ms=b.hostMs-a.hostMs,bytes=b.submitBytesTotal-a.submitBytesTotal;
    const chunks=b.submitChunksTotal-a.submitChunksTotal;
    const sends=b.submitSnapshotsTotal-a.submitSnapshotsTotal;
    if(ms<=0||b.revision<=a.revision||bytes<=0||chunks<=0||sends<=0||
       bytes<chunks||bytes>chunks*chunkBytes||sends>chunks||
       sends>b.revision-a.revision)throw Error('NON_MONOTONIC_OR_INCONSISTENT_TRAFFIC');
    const rate=bytes*1000/ms;
    totalBytes+=bytes;totalMs+=ms;
    peak=Math.max(peak,rate);
    if(rate>budget+1)overBudgetWindows++;
  }
  return {status:'OBSERVED_ONLY',runtimeGate:'NOT_ASSESSED',
    samples:rows.length,windowCount:rows.length-1,
    compressedRpcBytesObserved:totalBytes,
    averageSubmittedBytesPerSec:Math.round(totalBytes*1000/totalMs),
    peakWindowSubmittedBytesPerSec:Math.round(peak),
    overNominalBudgetWindows:overBudgetWindows,
    budgetBytesPerSec:budget,
    note:'RPC submission accounting only; forced snapshots and per-chunk overhead excluded; not UTP delivery, loss or G3.'};
}
function main(args){
  if(args.length!==2||args[0]!=='--host'){
    process.stderr.write('Usage: node analyze-host-traffic.cjs --host PC1_Player.log\n');
    return 2;
  }
  try{
    const report=analyze(fs.readFileSync(args[1],'utf8'));
    process.stdout.write(JSON.stringify(report)+'\n');
    return report.status==='OBSERVED_ONLY'?0:2;
  }catch(e){process.stderr.write('HOST_TRAFFIC_ERROR '+e.message+'\n');return 1;}
}
module.exports={lineFields,analyze,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
