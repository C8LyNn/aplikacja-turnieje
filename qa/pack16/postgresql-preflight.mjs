/**
 * Pack 16 — READ-ONLY audit of the actual PostgreSQL schema & correction journal.
 * Usage (after Pack 14/15 migrations on a TEST database):
 *   DATABASE_URL=postgres://... node qa/pack16/postgresql-preflight.mjs
 * Fails closed on missing credentials/migrations or broken journal invariants.
 * Never creates, updates, or deletes any row.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const dbPackage=resolve(root,'lib/db/package.json');
const requireFromDb=createRequire(dbPackage);

function fatal(message){console.error('FAIL:',message);process.exitCode=1;}
if(!process.env.DATABASE_URL){fatal('DATABASE_URL is required; no database connection attempted.');}
else{
  let client;
  try{
    const { Client }=requireFromDb('pg');
    client=new Client({connectionString:process.env.DATABASE_URL,statement_timeout:5000,query_timeout:8000});
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
    const cols=await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='tournament_correction_operations'`);
    const names=new Set(cols.rows.map(r=>r.column_name));
    const needed=['id','status','tournament_id','match_id','expected_revision',
      'expected_completion_action_id','expected_stage_version_vector',
      'approved_at','expires_at','completed_at','revert_action_id',
      'reverted_match_revision','completion_action_id','corrected_match_revision'];
    const absent=needed.filter(c=>!names.has(c));
    if(absent.length)throw Error('Pack 14/15 migration missing columns: '+absent.join(', '));
    const constraints=await client.query(`
      SELECT conname,pg_get_constraintdef(oid) AS definition
      FROM pg_constraint WHERE conrelid='public.tournament_correction_operations'::regclass
      AND conname IN ('tournament_correction_operations_status_check','tournament_correction_operations_receipt_consistency_check')`);
    if(constraints.rows.length!==2 || constraints.rows.some(r=>!r.definition.includes('corrected')))
      throw Error('Pack 15 constraints missing or do not cover corrected status');
    const summary=await client.query(`SELECT status,count(*)::integer AS count
      FROM public.tournament_correction_operations GROUP BY status ORDER BY status`);
    const orphans=await client.query(`
      SELECT o.id FROM public.tournament_correction_operations o
      LEFT JOIN public.action_log undo ON undo.id=o.revert_action_id
      LEFT JOIN public.action_log redo ON redo.id=o.completion_action_id
      WHERE o.status='corrected' AND (
        o.revert_action_id IS NULL OR o.completion_action_id IS NULL
        OR o.reverted_match_revision IS NULL OR o.corrected_match_revision IS NULL
        OR undo.id IS NULL OR redo.id IS NULL
        OR undo.tournament_id <> o.tournament_id OR undo.match_id <> o.match_id
        OR undo.action_type <> 'match_result_reverted'
        OR redo.tournament_id <> o.tournament_id OR redo.match_id <> o.match_id
        OR redo.action_type <> 'match_result_submitted'
      ) LIMIT 10`);
    if(orphans.rows.length)throw Error('Corrected operations with invalid action provenance: '+orphans.rows.map(r=>r.id).join(','));
    const stale=await client.query(`SELECT id FROM public.tournament_correction_operations
      WHERE (status='approved' AND (completed_at IS NOT NULL OR revert_action_id IS NOT NULL OR completion_action_id IS NOT NULL))
      OR (status='corrected' AND (completed_at IS NULL OR revert_action_id IS NULL OR completion_action_id IS NULL))
      LIMIT 10`);
    if(stale.rows.length)throw Error('Journal lifecycle mismatch: '+stale.rows.map(r=>r.id).join(','));
    console.log('PASS: PostgreSQL migration 0030/0031 schema, constraints and journal provenance');
    console.log('Journal statuses:',JSON.stringify(summary.rows));
  }catch(error){fatal(error.message||String(error));}
  finally{
    if(client){try{await client.query('ROLLBACK');}catch{};await client.end();}
  }
}
