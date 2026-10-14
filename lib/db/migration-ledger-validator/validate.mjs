/** WEB-005 T021: pure, fail-closed, source-only migration ledger validation.
 * Does NOT connect to databases, execute SQL, apply migrations or adopt legacy rows.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const ID = /^[a-z][a-z0-9_]*$/;
const NUMBER = /^\d{4}$/;
const LINEAGES = new Set(['shared', 'release', 'editor']);
const LEGACY_COLLISIONS = new Set(['0030','0031']);
const SQL_CONTROL = /^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|END\s+TRANSACTION)\s*;\s*(?:--.*)?$/gim;
const own = (object, property) => Object.hasOwn(object, property);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function fail(code, message) { return { code, message }; }
function sortedUnique(items) { return [...new Set(items)].sort(); }
function validateGraph(entries, field, ids, externals, errors) {
  const edges = new Map(entries.map(e => [e.logical_id, e[field] ?? []]));
  for (const e of entries) {
    if (!Array.isArray(e[field])) {
      errors.push(fail('BAD_DEPENDENCIES', `${e.logical_id}.${field} must be an array`));
      continue;
    }
    for (const dep of e[field]) {
      if (!ids.has(dep) && !externals.has(dep)) errors.push(fail('UNKNOWN_DEPENDENCY', `${e.logical_id} -> ${dep}`));
      if (dep === e.logical_id) errors.push(fail('SELF_DEPENDENCY', e.logical_id));
    }
    if (sortedUnique(e[field]).length !== e[field].length) errors.push(fail('DUPLICATE_DEPENDENCY', e.logical_id));
  }
  const state = new Map();
  function visit(id, stack) {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { errors.push(fail('DEPENDENCY_CYCLE', [...stack,id].join(' -> '))); return; }
    state.set(id, 1);
    for (const dep of edges.get(id) ?? []) if (edges.has(dep)) visit(dep, [...stack,id]);
    state.set(id, 2);
  }
  for (const e of entries) visit(e.logical_id, []);
}

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { ok:false, errors:[fail('BAD_MANIFEST','Expected object')], source_verified:false };
  if (manifest.schema_version !== 1) errors.push(fail('MANIFEST_VERSION','Only schema_version=1 is supported'));
  if (manifest.status !== 'PROPOSAL_ONLY_NOT_APPROVED') errors.push(fail('UNSUPPORTED_APPROVAL_STATE','Proposal validator cannot accept self-asserted approval'));
  if (manifest.repo !== 'C8LyNn/aplikacja-turnieje') errors.push(fail('WRONG_REPO','Unexpected repo'));
  if (!manifest.source_baseline || !SHA1.test(manifest.source_baseline.release ?? '') || !SHA1.test(manifest.source_baseline.editor ?? '')) errors.push(fail('BAD_BASELINE','Both source SHAs required'));
  const entries = manifest.migrations;
  if (!Array.isArray(entries) || entries.length !== 14) return {ok:false, errors:[...errors, fail('MIGRATION_COUNT','Expected exactly 14 records (0027–0040)')],source_verified:false};
  const ids = new Set(), numbers = new Set(), external = new Set(manifest.external_dependencies ?? []);
  const originals = new Map();
  entries.forEach((e, i) => {
    if (!e || typeof e !== 'object') { errors.push(fail('BAD_ENTRY',`entry ${i}`)); return; }
    if (!ID.test(e.logical_id ?? '')) errors.push(fail('BAD_LOGICAL_ID',`${i}`));
    if (ids.has(e.logical_id)) errors.push(fail('DUPLICATE_LOGICAL_ID',e.logical_id));
    ids.add(e.logical_id);
    if (!NUMBER.test(e.canonical_number ?? '') || +e.canonical_number !== i + 27) errors.push(fail('CANONICAL_ORDER',`${i} → ${e.canonical_number}`));
    if (numbers.has(e.canonical_number)) errors.push(fail('DUPLICATE_NUMBER',e.canonical_number));
    numbers.add(e.canonical_number);
    if (!LINEAGES.has(e.source_lineage)) errors.push(fail('UNKNOWN_LINEAGE',e.logical_id));
    if (!SHA256.test(e.original_utf8_sha256 ?? '') || !SHA1.test(e.git_blob_sha1 ?? '')) errors.push(fail('BAD_HASH',e.logical_id));
    if (e.source_commit !== manifest.source_baseline[e.source_lineage === 'editor' ? 'editor' : 'release']) errors.push(fail('SOURCE_COMMIT',e.logical_id));
    if (!NUMBER.test(e.original_number ?? '') || e.original_filename !== `${e.original_number}_${e.logical_id}.sql` || e.canonical_filename !== `${e.canonical_number}_${e.logical_id}.sql`) errors.push(fail('FILENAME_IDENTITY',e.logical_id));
    const expectedLineage = i < 3 ? 'shared' : i < 5 ? 'release' : 'editor';
    if (e.source_lineage !== expectedLineage) errors.push(fail('LINEAGE_ORDER',e.logical_id));
    if (expectedLineage === 'editor' && +e.original_number !== i + 25) errors.push(fail('EDITOR_ALIAS_MAPPING',e.logical_id));
    if (expectedLineage !== 'editor' && e.original_number !== e.canonical_number) errors.push(fail('RELEASE_ALIAS_MAPPING',e.logical_id));
    if (e.sql_has_embedded_begin_commit !== (e.logical_id === 'atomic_correction_receipts')) errors.push(fail('TRANSACTION_FLAG',e.logical_id));
    const previous = originals.get(e.original_number) ?? [];
    previous.push(e.source_lineage); originals.set(e.original_number,previous);
    if (!Array.isArray(e.postcondition_contract) || e.postcondition_contract.length === 0) errors.push(fail('NO_POSTCONDITIONS',e.logical_id));
  });
  for (const [num, src] of originals) {
    if (src.length > 1 && !(LEGACY_COLLISIONS.has(num) && src.length===2 && src.includes('release') && src.includes('editor')))
      errors.push(fail('UNEXPECTED_ALIAS_COLLISION',num));
  }
  for (const num of LEGACY_COLLISIONS) if ((originals.get(num) ?? []).length !== 2) errors.push(fail('MISSING_HISTORICAL_COLLISION',num));
  validateGraph(entries.filter(e=>e && typeof e === 'object'), 'hard_sql_dependencies',ids,external,errors);
  validateGraph(entries.filter(e=>e && typeof e === 'object'), 'canonical_order_dependencies',ids,external,errors);
  const positions = new Map(entries.filter(e=>e).map((e,i)=>[e.logical_id,i]));
  for (const e of entries.filter(e=>e)) for (const dep of e.canonical_order_dependencies ?? [])
    if (positions.has(dep) && positions.get(dep)>=positions.get(e.logical_id)) errors.push(fail('BAD_CANONICAL_TOPOLOGY',`${dep} -> ${e.logical_id}`));
  return {ok:errors.length===0, errors, migration_count:entries.length, source_verified:false, ready_for_sql:false};
}

/** Verifies exact raw UTF-8 file bytes. Editor sources are stored in a non-executable snapshot bundle. */
export function verifySources(manifest, {repoRoot, editorSnapshots}={}) {
  const errors=[];
  if (!repoRoot || !editorSnapshots || typeof editorSnapshots!=='object' || Array.isArray(editorSnapshots))
    return {ok:false, errors:[fail('SOURCES_MISSING','Explicit repoRoot and editorSnapshots object are both required')],ready_for_sql:false};
  const expectedEditorNames=new Set(manifest.migrations.filter(e=>e.source_lineage==='editor').map(e=>e.original_filename));
  for(const k of Object.keys(editorSnapshots)) if(!expectedEditorNames.has(k)) errors.push(fail('UNEXPECTED_SNAPSHOT',k));
  for(const entry of manifest.migrations) {
    let raw;
    try {
      if(entry.source_lineage === 'editor') {
        if(typeof editorSnapshots[entry.original_filename]!=='string') throw new Error('Editor snapshot absent');
        raw=Buffer.from(editorSnapshots[entry.original_filename],'utf8');
      } else {
        // Identity validated before reaching here; do not resolve untrusted paths.
        if(!/^00\d\d_[a-z0-9_]+\.sql$/.test(entry.original_filename)) throw new Error('Invalid SQL source name');
        raw=readFileSync(join(resolve(repoRoot),'lib','db','migrations',entry.original_filename));
      }
    } catch(e) {errors.push(fail('SOURCE_NOT_FOUND',`${entry.logical_id}: ${e.message}`)); continue; }
    if(sha256(raw)!==entry.original_utf8_sha256) errors.push(fail('SOURCE_CHECKSUM_MISMATCH',entry.logical_id));
    if (entry.logical_id === 'atomic_correction_receipts') {
      const content=raw.toString('utf8');
      const matches=[...content.matchAll(SQL_CONTROL)].map(m=>m[1].toUpperCase());
      if (matches.join(',')!=='BEGIN,COMMIT' || !/^\s*(?:--[^\n]*\n)*BEGIN;/m.test(content) || !/COMMIT;\s*$/.test(content)) errors.push(fail('R31_WRAPPER_CHANGED',entry.logical_id));
    }
  }
  return {ok:errors.length===0, errors, source_verified:errors.length===0,ready_for_sql:false};
}

/** Pure history classifier. Never attests a real DB or approves historical adoption. */
export function evaluateHistory(manifest, history) {
  const errors=[];
  const status=validateManifest(manifest);
  if(!status.ok) return {decision:'STOP',reasons:status.errors,ready_for_sql:false};
  if(!history || history.schema_version!==1 || !Array.isArray(history.records)) return {decision:'STOP',reasons:[fail('BAD_LEDGER','Expected schema_version=1 with records[]')],ready_for_sql:false};
  if(history.database_attestation !== 'SYNTHETIC_OR_READ_ONLY_UNVERIFIED') errors.push(fail('UNSUPPORTED_ATTESTATION','Code-only validator cannot attest a real database'));
  if(!Array.isArray(history.legacy_entries)) errors.push(fail('LEGACY_ENTRIES_REQUIRED','Must explicitly supply legacy_entries[]'));
  for(const e of history.legacy_entries ?? []) {
    if(!e.logical_id || !e.source_sql_sha256 || !e.source_lineage) errors.push(fail('AMBIGUOUS_LEGACY',`Unattributed legacy ${e.number ?? '?'}`));
    else errors.push(fail('LEGACY_ADOPTION_REQUIRES_00',`${e.number ?? '?'} ${e.logical_id}`));
  }
  if ((history.unverified_catalog_observations ?? []).length) errors.push(fail('UNVERIFIED_CATALOG_OBSERVATION','Observed objects are not execution receipts'));
  const entries=new Map(manifest.migrations.map(e=>[e.logical_id,e]));
  const seen=new Set();
  for(const record of history.records){
    if(!record || typeof record!=='object'){errors.push(fail('BAD_RECORD','non-object receipt'));continue;}
    if(seen.has(record.logical_id)) errors.push(fail('DUPLICATE_LEDGER_RECORD',record.logical_id));
    seen.add(record.logical_id);
    const e=entries.get(record.logical_id);
    if(!e){errors.push(fail('UNKNOWN_LEDGER_ID',String(record.logical_id)));continue;}
    if(record.action!=='applied' && record.action!=='adopted')errors.push(fail('BAD_ACTION',record.logical_id));
    if(record.action==='adopted')errors.push(fail('ADOPTION_REQUIRES_00',record.logical_id));
    if(record.canonical_number!==e.canonical_number || record.original_number!==e.original_number || record.source_lineage!==e.source_lineage || record.source_sql_sha256!==e.original_utf8_sha256 || record.source_git_blob_sha1!==e.git_blob_sha1 || record.source_commit!==e.source_commit)errors.push(fail('LEDGER_IDENTITY_MISMATCH',record.logical_id));
    if(!record.evidence_ref || typeof record.evidence_ref!=='string' || !SHA256.test(record.catalog_fingerprint_sha256 ?? ''))errors.push(fail('INSUFFICIENT_EVIDENCE',record.logical_id));
  }
  for(const id of seen){const e=entries.get(id);if(!e)continue;for(const dep of e.hard_sql_dependencies){if(entries.has(dep) && !seen.has(dep))errors.push(fail('INCOMPLETE_HARD_DEPENDENCY',`${id} missing ${dep}`));}}
  // Gaps in a lineage are suspicious even when SQL hard-deps permit independent execution.
  for(const lineage of ['shared','release','editor']){
    const subset=manifest.migrations.filter(e=>e.source_lineage===lineage);
    let gap=false;
    for(const e of subset){if(!seen.has(e.logical_id))gap=true;else if(gap)errors.push(fail('NON_PREFIX_LINEAGE',`${lineage} missing earlier migration before ${e.logical_id}`));}
  }
  return {decision:errors.length?'STOP':'REVIEW_ONLY',reasons:errors,applied_candidates:[...seen].sort(),missing_candidates:manifest.migrations.filter(e=>!seen.has(e.logical_id)).map(e=>e.logical_id),requires_00_approval:true,requires_pg16_catalog_verification:true,ready_for_sql:false};
}

export function runCli(args=process.argv.slice(2)) {
  const options={};
  for(let i=0;i<args.length;i+=2){if(!['--manifest','--history','--repo-root','--editor-snapshots','--expected-manifest-sha256'].includes(args[i])||!args[i+1])throw new Error('Usage: node validate.mjs --manifest PATH --history PATH --repo-root REPO --editor-snapshots PATH');options[args[i]]=args[i+1];}
  if(!options['--manifest'])throw new Error('Explicit manifest path required');
  const rawManifest=readFileSync(options['--manifest']);
  const manifest=JSON.parse(rawManifest.toString('utf8'));
  const expectedManifestHash=options['--expected-manifest-sha256'];
  const manifestPin=SHA256.test(expectedManifestHash??'') && sha256(rawManifest)===expectedManifestHash
    ? {ok:true, digest:sha256(rawManifest)}
    : {ok:false, errors:[fail('MANIFEST_PIN_MISMATCH','Externally supplied approved SHA-256 pin is missing or differs')]};
  const structure=validateManifest(manifest);
  const sourceResult=options['--repo-root']&&options['--editor-snapshots']?verifySources(manifest,{repoRoot:options['--repo-root'],editorSnapshots:JSON.parse(readFileSync(options['--editor-snapshots'],'utf8'))}):{ok:false,errors:[fail('SOURCES_MISSING','Both source inputs required')]};
  const history=options['--history']?JSON.parse(readFileSync(options['--history'],'utf8')):null;
  const histories=history?evaluateHistory(manifest,history):{decision:'STOP',reasons:[fail('HISTORY_MISSING','Explicit history required')],ready_for_sql:false};
  const report={contract:'WEB-005-T021-R1',manifestPin,structure,sourceResult,history:histories,decision:manifestPin.ok&&structure.ok&&sourceResult.ok&&histories.decision==='REVIEW_ONLY'?'REVIEW_ONLY':'STOP',ready_for_sql:false};
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.decision==='STOP')process.exitCode=2;
  return report;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{runCli();}catch(e){process.stderr.write(`T021 VALIDATION STOP: ${e.message}\n`);process.exitCode=2;}}
