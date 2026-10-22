import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateManifest, evaluateHistory, verifySources, sha256 } from './validate.mjs';
const original=JSON.parse(readFileSync(new URL('./manifest.proposal.json',import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
const digest='c'.repeat(64);
function receipt(entry){return {logical_id:entry.logical_id,canonical_number:entry.canonical_number,original_number:entry.original_number,source_lineage:entry.source_lineage,source_sql_sha256:entry.original_utf8_sha256,source_git_blob_sha1:entry.git_blob_sha1,source_commit:entry.source_commit,action:'applied',catalog_fingerprint_sha256:digest,evidence_ref:'SYNTHETIC_ONLY_NOT_DEPLOY_EVIDENCE'};}
function history(ids=[],extras={}){return {schema_version:1,database_attestation:'SYNTHETIC_OR_READ_ONLY_UNVERIFIED',records:original.migrations.filter(e=>ids.includes(e.logical_id)).map(receipt),legacy_entries:[],unverified_catalog_observations:[],...extras};}
const common=original.migrations.filter(e=>e.source_lineage==='shared').map(e=>e.logical_id);
const r=original.migrations.filter(e=>e.source_lineage==='release').map(e=>e.logical_id);
const e=original.migrations.filter(e=>e.source_lineage==='editor').map(e=>e.logical_id);
const codes=result=>result.errors?.map(x=>x.code)??result.reasons?.map(x=>x.code)??[];

describe('source-only canonical manifest',()=>{
 it('validates R4-derived 0027–0040 manifest',()=>assert.equal(validateManifest(original).ok,true));
 it('rejects duplicate logical_id',()=>{let m=clone(original);m.migrations[5].logical_id=m.migrations[4].logical_id;assert.ok(codes(validateManifest(m)).includes('DUPLICATE_LOGICAL_ID'));});
 it('rejects duplicate canonical number',()=>{let m=clone(original);m.migrations[6].canonical_number='0032';assert.ok(codes(validateManifest(m)).includes('DUPLICATE_NUMBER'));});
 it('rejects unknown hard dependency',()=>{let m=clone(original);m.migrations[6].hard_sql_dependencies=['missing'];assert.ok(codes(validateManifest(m)).includes('UNKNOWN_DEPENDENCY'));});
 it('rejects canonical ordering cycles',()=>{let m=clone(original);m.migrations[0].canonical_order_dependencies=['steam_catalog_global_source_throttle'];assert.ok(codes(validateManifest(m)).includes('DEPENDENCY_CYCLE'));});
 it('rejects mismatched source lineage and commit',()=>{let m=clone(original);m.migrations[5].source_commit=original.source_baseline.release;assert.ok(codes(validateManifest(m)).includes('SOURCE_COMMIT'));});
 it('rejects changed blob checksum shape',()=>{let m=clone(original);m.migrations[1].original_utf8_sha256='a';assert.ok(codes(validateManifest(m)).includes('BAD_HASH'));});
 it('rejects false approval status',()=>{let m=clone(original);m.status='APPROVED';assert.ok(codes(validateManifest(m)).includes('UNSUPPORTED_APPROVAL_STATE'));});
 it('requires only the historic 0030 and 0031 collisions',()=>{let m=clone(original);m.migrations[5].original_number='0032';assert.ok(codes(validateManifest(m)).includes('MISSING_HISTORICAL_COLLISION'));});
});

describe('fail-closed synthetic historical ledger',()=>{
 it('empty clean-install candidate still requires approval and PG16 verification',()=>{const x=evaluateHistory(original,history());assert.equal(x.decision,'REVIEW_ONLY');assert.equal(x.ready_for_sql,false);assert.equal(x.missing_candidates.length,14);});
 it('release 0031 history is a review candidate',()=>{const x=evaluateHistory(original,history([...common,...r]));assert.equal(x.decision,'REVIEW_ONLY');assert.equal(x.missing_candidates.length,9);});
 it('editor 0038 history is a review candidate, not a hard-dependency error',()=>{const x=evaluateHistory(original,history([...common,...e]));assert.equal(x.decision,'REVIEW_ONLY');assert.deepEqual(x.missing_candidates,r);});
 it('fully mixed history is review only, never GO',()=>{const x=evaluateHistory(original,history([...common,...r,...e]));assert.equal(x.decision,'REVIEW_ONLY');assert.equal(x.ready_for_sql,false);});
 it('release R30-only is a valid partial candidate',()=>assert.equal(evaluateHistory(original,history([...common,r[0]])).decision,'REVIEW_ONLY'));
 it('editor E30-only is a partial candidate',()=>assert.equal(evaluateHistory(original,history([...common,e[0]])).decision,'REVIEW_ONLY'));
 it('R31 without R30 stops',()=>{const x=evaluateHistory(original,history([...common,r[1]]));assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('INCOMPLETE_HARD_DEPENDENCY'));});
 it('E36 without E35 stops',()=>{const x=evaluateHistory(original,history([...common,e[6]]));assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('INCOMPLETE_HARD_DEPENDENCY'));});
 it('editor gap mid-chain stops even without hard dependency',()=>{const x=evaluateHistory(original,history([...common,e[0],e[3]]));assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('NON_PREFIX_LINEAGE'));});
 it('legacy 0030 without identity stops',()=>{const x=evaluateHistory(original,history(common,{legacy_entries:[{number:'0030'}]}));assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('AMBIGUOUS_LEGACY'));});
 it('legacy 0030 with identity still requires independent adoption',()=>{const x=evaluateHistory(original,history(common,{legacy_entries:[{number:'0030',logical_id:r[0],source_lineage:'release',source_sql_sha256:digest}]}));assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('LEGACY_ADOPTION_REQUIRES_00'));});
 it('unknown ledger id stops',()=>{const h=history(common);h.records.push({...h.records[0],logical_id:'unrecognized_extension'});const x=evaluateHistory(original,h);assert.equal(x.decision,'STOP');assert.ok(codes(x).includes('UNKNOWN_LEDGER_ID'));});
 it('duplicate ledger receipt stops',()=>{const h=history(common);h.records.push({...h.records[0]});assert.ok(codes(evaluateHistory(original,h)).includes('DUPLICATE_LEDGER_RECORD'));});
 it('source checksum mismatch stops',()=>{const h=history(common);h.records[0].source_sql_sha256='f'.repeat(64);assert.ok(codes(evaluateHistory(original,h)).includes('LEDGER_IDENTITY_MISMATCH'));});
 it('unverified catalog-only observation stops',()=>{const x=evaluateHistory(original,history(common,{unverified_catalog_observations:[{table:'steam_catalog_games'}]}));assert.ok(codes(x).includes('UNVERIFIED_CATALOG_OBSERVATION'));});
 it('adopted receipt stops without 00 attestation',()=>{const h=history(common);h.records[0].action='adopted';assert.ok(codes(evaluateHistory(original,h)).includes('ADOPTION_REQUIRES_00'));});
 it('missing catalog fingerprint stops',()=>{const h=history(common);delete h.records[0].catalog_fingerprint_sha256;assert.ok(codes(evaluateHistory(original,h)).includes('INSUFFICIENT_EVIDENCE'));});
 it('claims of real database attestation stop',()=>{const x=evaluateHistory(original,history(common,{database_attestation:'REAL_DATABASE_APPLIED'}));assert.ok(codes(x).includes('UNSUPPORTED_ATTESTATION'));});
});

describe('actual source bytes, synthetic SQL files only',()=>{
 it('verifies exact file bytes and rejects a changed byte',()=>{
  const root=mkdtempSync(join(tmpdir(),'web005-t021-'));
  try{
   mkdirSync(join(root,'lib/db/migrations'),{recursive:true});
   const m=clone(original); const sources={};
   for(const [i,item] of m.migrations.entries()){
    const sql=item.logical_id==='atomic_correction_receipts'?'-- mock\nBEGIN;\nSELECT 1;\nCOMMIT;':'-- synthetic fixture\nSELECT 1;\n';
    item.original_utf8_sha256=sha256(Buffer.from(sql));
    if(item.source_lineage==='editor')sources[item.original_filename]=sql;
    else writeFileSync(join(root,'lib/db/migrations',item.original_filename),sql);
   }
   assert.equal(verifySources(m,{repoRoot:root,editorSnapshots:sources}).ok,true);
   sources[m.migrations[5].original_filename]+=' ';
   assert.ok(codes(verifySources(m,{repoRoot:root,editorSnapshots:sources})).includes('SOURCE_CHECKSUM_MISMATCH'));
  }finally{rmSync(root,{recursive:true,force:true});}
 });
 it('rejects changed R31 transaction wrapper',()=>{
  const root=mkdtempSync(join(tmpdir(),'web005-t021-'));
  try{
   mkdirSync(join(root,'lib/db/migrations'),{recursive:true});
   const m=clone(original), sources={};
   for(const item of m.migrations){
    const sql=item.logical_id==='atomic_correction_receipts'?'BEGIN;\nSELECT 1;\nCOMMIT;\nCOMMIT;':'SELECT 1;';
    item.original_utf8_sha256=sha256(sql);
    if(item.source_lineage==='editor')sources[item.original_filename]=sql;else writeFileSync(join(root,'lib/db/migrations',item.original_filename),sql);
   }
   assert.ok(codes(verifySources(m,{repoRoot:root,editorSnapshots:sources})).includes('R31_WRAPPER_CHANGED'));
  }finally{rmSync(root,{recursive:true,force:true});}
 });
});

describe('versioned synthetic fixture matrix',()=>{
 const fixtures=JSON.parse(readFileSync(new URL('./synthetic-fixtures.json',import.meta.url),'utf8'));
 for(const f of fixtures.fixtures){
  it(`${f.name} → ${f.expected}`,()=>{
   assert.equal(evaluateHistory(original,history(f.applied_logical_ids)).decision,f.expected);
  });
 }
});
