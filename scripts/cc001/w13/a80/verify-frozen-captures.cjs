'use strict';
/** A80 W13. Private original bytes ↔ frozen W11 paired-view observation binding.
 * Runs the W12 A80 view contract on each pair. No screenshot interpretation,
 * clock-sync assumption, Unity runtime access or G3 certification.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {inspect, SCHEMA: VIEW_SCHEMA, PIN} = require('../../w12/a80/verify-freeze-view.cjs');
const SCHEMA = 'cc001-r17-w13-a80-frozen-capture-v1';
const SHA256 = /^[a-f0-9]{64}$/i;
const {chronology}=require('../../w14/a80/verify-snapshot-chronology.cjs');
const DEVICE = new Set(['PC1','PC2']);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const utc = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s) && Number.isFinite(Date.parse(s));
const image = b => b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) ||
  (b.length>=3 && b.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))) ||
  (b.length>=12 && b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP');
function inside(root, target) {
  const rel = path.relative(root,target);
  return rel!=='' && rel!=='..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel);
}
function fingerprint(root, name, kind) {
  if(typeof name!=='string'||!name||path.isAbsolute(name)||name.split(/[\\/]/).includes('..')||name.includes('\0'))
    return {error:'INVALID_RELATIVE_PATH'};
  let target;
  try{ target=fs.realpathSync(path.resolve(root,name)); }catch{ return {error:'EVIDENCE_FILE_MISSING'}; }
  if(!inside(root,target))return {error:'EVIDENCE_OUTSIDE_ROOT'};
  let stat;
  try{stat=fs.statSync(target);}catch{return {error:'EVIDENCE_STAT_FAILED'};}
  const limit=kind==='screenshot'?32*1024*1024:128*1024*1024;
  if(!stat.isFile()||stat.size<1||stat.size>limit)return {error:'EVIDENCE_EMPTY_OR_OVERSIZE'};
  let file, pos=0, prefix=Buffer.alloc(0),hash=crypto.createHash('sha256');
  try{
    file=fs.openSync(target,'r');
    const buf=Buffer.alloc(65536);
    while(true){const n=fs.readSync(file,buf,0,buf.length,null);if(n===0)break;
      pos+=n;if(pos>limit)return {error:'EVIDENCE_OVERSIZE_WHILE_READING'};
      if(prefix.length<16)prefix=Buffer.concat([prefix,buf.subarray(0,Math.min(n,16-prefix.length))]);
      hash.update(buf.subarray(0,n));
    }
  }catch{return {error:'EVIDENCE_READ_FAILED'};}
  finally{if(file!==undefined)fs.closeSync(file);}
  if(pos!==stat.size)return {error:'EVIDENCE_CHANGED_DURING_READ'};
  if(kind==='screenshot'&&!image(prefix))return {error:'SCREENSHOT_SIGNATURE_INVALID'};
  return {bytes:pos,sha256:hash.digest('hex')};
}
function assessCapture(input,{root, inspectView=inspect}={}) {
  const errors=[],gaps=[],pairs=[],attestations=[],cache=new Map(),firstSeen=new Map(),lastClock=new Map();
  const err=(code,ctx={})=>errors.push({code,...ctx});
  const gap=(code,ctx={})=>gaps.push({code,...ctx});
  if(input?.schema!==SCHEMA)gap('SCHEMA_UNVERIFIED');
  if(input?.qaSourceSha!==PIN)err('QA_FREEZE_SHA_MISMATCH');
  if(input?.lane!=='W11_QA_FREEZE')gap('QA_LANE_UNVERIFIED');
  const samples=Array.isArray(input?.pairs)?input.pairs:[];
  if(samples.length<1||samples.length>500)gap('PAIR_COUNT_OUT_OF_RANGE');
  let rootReal;
  try{if(typeof root==='string'&&root)rootReal=fs.realpathSync(root);}catch{/* gap below */}
  if(!rootReal||!fs.statSync(rootReal).isDirectory())gap('CAPTURE_ROOT_UNAVAILABLE');
  let previousIndex=-1;
  for(const [i,pair] of samples.slice(0,500).entries()){
    const idx=pair?.index;
    if(!Number.isSafeInteger(idx)||idx<=previousIndex)err('PAIR_INDEX_NONMONOTONIC',{pair:i});
    else previousIndex=idx;
    const obs=Array.isArray(pair?.observations)?pair.observations:[];
    const report=inspectView({schema:VIEW_SCHEMA,lane:input.lane,qaSourceSha:input.qaSourceSha,
      toleranceWorldUnits:input.toleranceWorldUnits,observations:obs});
    pairs.push({index:idx,verdict:report.verdict,problems:report.summary.problems,gaps:report.summary.gaps});
    if(report.verdict==='OBSERVATION_FAIL')err('PAIR_VIEW_CONTRACT_FAIL',{pair:idx});
    if(report.verdict==='INSUFFICIENT_EVIDENCE')gap('PAIR_VIEW_CONTRACT_INCOMPLETE',{pair:idx});
    if(obs.length!==2)continue;
    for(const o of obs){
      if(!DEVICE.has(o?.device))continue;
      const ctx={pair:idx,device:o.device};const ev=o.evidence||{};
      if(!utc(ev.captureUtc))gap('CAPTURE_TIMESTAMP_NOT_UTC',ctx);
      else {
        const t=Date.parse(ev.captureUtc),prev=lastClock.get(o.device);
        if(prev!==undefined&&t<prev)err('DEVICE_CAPTURE_CLOCK_REVERSED',ctx);
        lastClock.set(o.device,t);
      }
      // Never compare host and client local timestamps as synchronized clocks.
      for(const kind of ['screenshot','log']){
        const rel=ev[kind+'Path'],expected=ev[kind+'Sha256'];
        if(typeof expected!=='string'||!SHA256.test(expected)){gap('FILE_SHA256_MISSING',{...ctx,kind});continue;}
        if(typeof rel!=='string'||!rel.trim()){gap('FILE_RELATIVE_PATH_MISSING',{...ctx,kind});continue;}
        const key=JSON.stringify([kind,rel]);
        let val=cache.get(key);
        if(!val&&rootReal){val=fingerprint(rootReal,rel,kind);cache.set(key,val);}
        if(!rootReal)continue;
        if(val.error){err(val.error,{...ctx,kind});continue;}
        if(val.sha256!==expected.toLowerCase()){err('FILE_BYTES_SHA256_MISMATCH',{...ctx,kind});continue;}
        if(kind==='screenshot') {
          const prev=firstSeen.get(val.sha256);
          // Identical screenshot bytes across successive pairs or across devices
          // are not independent frame evidence.
          if(prev){
            if(prev.device!==o.device)err('CROSS_DEVICE_IDENTICAL_IMAGE',{...ctx,previousPair:prev.pair});
            else gap('REUSED_SCREENSHOT_NOT_NEW_EVIDENCE',{...ctx,previousPair:prev.pair});
          }else firstSeen.set(val.sha256,ctx);
        }
        attestations.push({...ctx,kind,bytes:val.bytes,sha256:val.sha256});
      }
    }
  }
  const temporal=chronology(samples.slice(0,500));
  // Check continuity of authoritative snapshot identity across capture pairs;
  // each W12 per-pair validator checked only that *one* pair was consistent.
  for(const e of temporal.errors)errors.push(e);
  for(const g of temporal.gaps)gaps.push(g);
  const verdict=errors.length?'CAPTURE_CONTRADICTION':gaps.length?'INSUFFICIENT_EVIDENCE':'CAPTURE_BYTES_AND_ANNOTATIONS_CONSISTENT';
  return {schema:SCHEMA,qaSourceSha:PIN,verdict,physicalG3Status:'NOT_ASSESSED',
    verifiedOriginalBuild:false,inspectedImageSemantics:false,verifiedDeviceOrigin:false,
    note:'Only byte-level capture matching and user-supplied view assertions; not original device, Windows build or gameplay proof',
    summary:{pairs:pairs.length,bytesChecked:attestations.length,errors:errors.length,gaps:gaps.length},pairs,errors,gaps,notes:temporal.notes,attestations};
}
module.exports={SCHEMA,PIN,fingerprint,assessCapture};
if(require.main===module){
  const args=process.argv.slice(2);const arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};
  const input=arg('--input'),root=arg('--root'),out=arg('--out');
  if(!input||!root){console.error('Usage: node verify-frozen-captures.cjs --input private/session.json --root private/captures [--out private/report.json]');process.exitCode=2;}
  else try{
    const raw=fs.readFileSync(input);const r=assessCapture(JSON.parse(raw.toString('utf8')),{root});r.inputSha256=sha(raw);
    const output=JSON.stringify(r,null,2)+'\n';
    if(out)fs.writeFileSync(out,output,{encoding:'utf8',flag:'wx'});else process.stdout.write(output);
    process.exitCode=r.verdict==='CAPTURE_CONTRADICTION'?1:r.verdict==='INSUFFICIENT_EVIDENCE'?3:0;
  }catch(e){console.error('A80_W13_CAPTURE_ERROR '+e.message);process.exitCode=4;}
}
