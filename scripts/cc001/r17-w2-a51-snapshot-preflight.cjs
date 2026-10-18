#!/usr/bin/env node
'use strict';
/* R17-W2 A51 SOURCE-ONLY corpus preflight. NEVER executes NGO, Unity, or a C# codec. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const arg=(name)=>{const a=process.argv.find(x=>x.startsWith('--'+name+'='));return a?a.slice(name.length+3):null};
const corpusPath=arg('corpus')||path.resolve(__dirname,'../../docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json');
const source=arg('source');const archive=arg('archive');const allowMissingSource=process.argv.includes('--schema-only');
const hashBuf=(buf)=>crypto.createHash('sha256').update(buf).digest('hex');
const fail=(msg)=>{console.error('FAIL:',msg);process.exitCode=1};
let d;
try{d=JSON.parse(fs.readFileSync(corpusPath,'utf8'))}catch(e){fail(`Invalid/missing corpus: ${e.message}`);process.exit()}
const errors=[];const ck=(ok,msg)=>{if(!ok)errors.push(msg)};
ck(d.schema==='CC001_R17_W2_A51_SNAPSHOT_CORPUS_V1','schema version mismatch');
ck(d.source_zip_sha256==='b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4','R16 source ZIP sha mismatch');
ck(d.branch==='feat/cc001-r17-w2-a51-snapshot-fixtures','unexpected target branch');
ck(d.protocol===149,'protocol version mismatch');
ck(d.immutable_v148_untouched===true,'reference immutable flag missing');
ck(Array.isArray(d.cases)&&d.cases.length>=16,'fewer than 16 cases');
ck(d.runtime_executions_performed===0,'unproven runtime execution count');
const counts={ADAPTER:0,CODEC:0,ASSEMBLER:0}, ids=new Set(),mutKinds=new Set();
for(const [i,c] of (d.cases||[]).entries()){
 const id=`CC001-R17-W2-A51-SNAP-${String(i+1).padStart(3,'0')}`;
 ck(c.case_id===id,'unordered/gap task ID '+c.case_id);ck(!ids.has(c.case_id),'duplicate '+c.case_id);ids.add(c.case_id);
 ck(Object.hasOwn(counts,c.layer),'invalid layer '+c.case_id);if(Object.hasOwn(counts,c.layer))counts[c.layer]++;
 ck(c.runtime_test_status==='NOT_RUN'&&c.runtime_observed===null,'runtime PASS/result claimed '+c.case_id);
 ck(c.fixture_seed===`cc001-r17-w2-a51-snapshot:fixed:${String(i+1).padStart(3,'0')}`,'seed mismatch '+c.case_id);
 ck(Array.isArray(c.packet_sequence)&&c.packet_sequence.length>=1,'missing packet sequence '+c.case_id);
 ck(c.expected!==null&&typeof c.expected==='object','expected outcome missing '+c.case_id);
 ck(typeof c.expected_last_good==='string'&&c.expected_last_good.length>20,'missing last-good invariant '+c.case_id);
 ck(typeof c.expected_revision==='string'&&c.expected_revision.length>20,'missing revision invariant '+c.case_id);
 ck(['SOURCE_GROUNDED','SOURCE_EXPECTATION_NEEDS_HARNESS'].includes(c.evidence_class),'missing evidence classification '+c.case_id);
 ck(['IN_MEMORY_GAMESTATE','VALID_JSON','PACKET_METADATA','COMPRESSED_BYTES','CHUNK_METADATA','INVALID_UTF8_OR_GZIP_BYTES'].includes(c.representation),'unsupported representation '+c.case_id);
 ck(Array.isArray(c.source_anchors)&&c.source_anchors.length>0,'no source anchors '+c.case_id);
 for(const a of c.source_anchors||[]){ck(Object.hasOwn(d.source_files_sha256,a.path),'unknown source anchor '+c.case_id+': '+a.path);ck(/^\d+-\d+(,\d+-\d+)*$/.test(a.lines),'bad source line range '+c.case_id+': '+a.lines)}
 if(JSON.stringify(c).includes('NaN')||JSON.stringify(c).includes('Infinity'))ck(c.representation!=='VALID_JSON','illegal bare NaN/Infinity JSON fixture '+c.case_id);
 for(const t of c.test_kind||[])mutKinds.add(t);
}
ck(counts.ADAPTER>=16,'insufficient adapter cases');ck(counts.CODEC>=3&&counts.ASSEMBLER>=3,'insufficient codec/assembly cases');
ck(mutKinds.has('RECOVERY')&&mutKinds.has('STALE')&&mutKinds.has('CHUNK_DUPLICATE'),'critical coverage missing');
ck(d.telemetry_schema?.fields?.includes('last_good_before_sha256')&&d.telemetry_schema?.fields?.includes('observed_decision'),'required telemetry fields missing');
if(source){
 for(const [name,want] of Object.entries(d.source_files_sha256)){
  const f=path.join(source,name); if(!fs.existsSync(f)){ck(false,'source file missing: '+name);continue}
  const content=fs.readFileSync(f);ck(hashBuf(content)===want,'source SHA mismatch: '+name);
  const lines=content.toString('utf8').split(/\r?\n/);
  for(const c of d.cases){for(const a of c.source_anchors){if(a.path!==name)continue;for(const sub of a.lines.split(',')){const [lo,hi]=sub.split('-').map(Number);ck(lo>0&&hi>=lo&&hi<=lines.length,'anchor beyond source: '+c.case_id+' '+name+':'+sub)}}}
 }
}else if(!allowMissingSource)ck(false,'pass --source=<R16 project root> or explicit --schema-only');
if(archive){if(!fs.existsSync(archive))ck(false,'source archive not found');else ck(hashBuf(fs.readFileSync(archive))===d.source_zip_sha256,'source archive SHA mismatch')}
for(const m of errors)fail(m);
const summary={status:errors.length?'FAIL':'STATIC_SCRIPT_PASS',schema:d.schema,cases:d.cases?.length||0,by_layer:counts,unique_ids:ids.size,runtime_executions:0,source_files_verified:!!source,source_zip_verified:!!archive,source_validation_note:'STATIC ONLY; not NGO/C#/.NET/Unity/network runtime testing',errors};
console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
