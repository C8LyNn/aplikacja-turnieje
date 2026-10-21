/**
 * WEB-005 W6I A50 — ISOLATED PostgreSQL source adapter for two-column CAS.
 * SOURCE ONLY, NOT imported by current routes/application. NO schema/migration
 * edits. Driver (pool) and transaction-local graph/authorization ports are
 * injected. DB SQL is never executed except by an explicitly supplied pool.
 *
 * BLOCKERS: canonical stage/roster writer coverage, D01-D04 migration, actual
 * schema provisioning, independently proven graphPort in-transaction writes,
 * PG16 runtime/rollback/serialization QA and route composition by SWARM006.
 */
import { createHash, randomUUID } from 'node:crypto';
import { basketCasEtag, nextBasketRevision } from './basket-cas-server-core.mjs';
import { parseBasketIfMatch, requireMatchingBasketEtag } from './basket-cas-precondition.ts';

const MAX_REV=(1n<<63n)-1n;
const STAGE_SQL='SELECT to_jsonb(s) AS row FROM tournament_stages s WHERE s.tournament_id=$1 ORDER BY s.id';
const ROSTER_SOURCES=Object.freeze([
  ['players','p','p.id'],
  ['stage_participants','m','m.stage_id, m.player_id'],
  ['stage_basket_participants','bp','bp.stage_id, bp.basket_id, bp.player_id'],
  ['stage_basket_route_entries','re','re.route_id, re.player_id'],
  ['stage_basket_route_executions','rx','rx.route_id'],
  ['tournament_routing_plans','rp','rp.revision'],
]);
const ROW_LOCK='SELECT id, status, basket_config_revision::text AS revision, basket_edit_epoch::text AS epoch FROM tournaments WHERE id=$1 FOR UPDATE';
const ROW_READ='SELECT id, status, basket_config_revision::text AS revision, basket_edit_epoch::text AS epoch FROM tournaments WHERE id=$1';
const ADVANCE='UPDATE tournaments SET basket_config_revision=$4 WHERE id=$1 AND basket_config_revision=$2 AND basket_edit_epoch=$3 AND basket_config_revision < 9223372036854775807 RETURNING basket_config_revision::text AS revision';

function tournamentId(value){
  if(!Number.isSafeInteger(value)||value<1)throw Error('WEB005_BASKET_CAS_TOURNAMENT_INVALID');
  return value;
}
function dbRevision(value){
  if(typeof value!=='string'||!/^(0|[1-9]\d*)$/.test(value))throw Error('WEB005_BASKET_CAS_DB_REVISION_INVALID');
  const out=BigInt(value);
  if(out>MAX_REV)throw Error('WEB005_BASKET_CAS_DB_REVISION_INVALID');
  return out;
}
function stable(v){
  if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number'&&Number.isFinite(v))return v;
  if(Array.isArray(v))return v.map(stable);
  if(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype){
    return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));
  }
  throw Error('WEB005_BASKET_CAS_NONCANONICAL_SOURCE');
}
function digest(tag,parts){
  return createHash('sha256').update(JSON.stringify([tag,stable(parts)])).digest('hex');
}
async function queryRows(client,sql,id){
  const result=await client.query(sql,[id]);
  if(!result||!Array.isArray(result.rows))throw Error('WEB005_BASKET_CAS_DB_READ_INVALID');
  return result.rows.map(record=>{
    if(!record||typeof record!=='object'||!Object.hasOwn(record,'row')||!record.row||typeof record.row!=='object'||Array.isArray(record.row))throw Error('WEB005_BASKET_CAS_DB_ROW_INVALID');
    return stable(record.row);
  });
}
function requireRow(result,id){
  if(!result||!Array.isArray(result.rows)||result.rows.length!==1)throw Error('WEB005_BASKET_CAS_TOURNAMENT_NOT_FOUND_OR_AMBIGUOUS');
  const row=result.rows[0];
  if(Number(row.id)!==id)throw Error('WEB005_BASKET_CAS_ROW_ID_MISMATCH');
  dbRevision(row.revision);
  return row;
}
function isTerminalConnectionError(error){
  let e=error;
  for(let depth=0;depth<3&&e&&typeof e==='object';depth++,e=e.cause){
    const code=e.code;
    if(typeof code==='string'&&(/^(08[A-Z0-9]{3}|57P0[123]|ECONNRESET|EPIPE|ECONNREFUSED|ETIMEDOUT)$/.test(code)))return true;
  }
  return false;
}
async function inTx(pool,mode,fn){
  const client=await pool.connect();let begun=false, quarantine=false, primaryError;
  try{
    if(!client||typeof client.query!=='function'||typeof client.release!=='function'){
      quarantine=true;
      throw Error('WEB005_BASKET_CAS_CLIENT_CONTRACT_INVALID');
    }
    try{
      await client.query(mode==='read'?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN ISOLATION LEVEL SERIALIZABLE');
      begun=true;
    }catch(error){
      // BEGIN may have reached server even without a client-side acknowledgement.
      quarantine=true;throw error;
    }
    const result=await fn(client);
    try{await client.query('COMMIT');}
    catch(error){
      // COMMIT may already be durable. A later ROLLBACK proves nothing.
      quarantine=true;
      throw new Error('WEB005_BASKET_CAS_COMMIT_UNCERTAIN',{cause:error});
    }
    begun=false;
    return result;
  }catch(error){
    primaryError=error;
    if(isTerminalConnectionError(error))quarantine=true;
    if(begun){try{await client.query('ROLLBACK');}catch(rollback){
      quarantine=true;
      primaryError=new Error('WEB005_BASKET_CAS_ROLLBACK_UNCERTAIN',{
        cause:new AggregateError([error,rollback],'CAS transaction and rollback both failed')
      });
    }}
    throw primaryError;
  }finally{
    // node-postgres PoolClient.release(error) removes the client from the pool.
    // Never use normal release when BEGIN/COMMIT/ROLLBACK or transport is uncertain.
    if(client&&typeof client.release==='function'){
      try{
        if(quarantine)client.release(new Error('WEB005_BASKET_CAS_CLIENT_QUARANTINED'));
        else client.release();
      }catch(releaseFailure){
        const errors=primaryError?[primaryError,releaseFailure]:[releaseFailure];
        throw new Error('WEB005_BASKET_CAS_CLIENT_RELEASE_FAILED',{
          cause:new AggregateError(errors,'CAS transaction release failed')
        });
      }
    }
  }
}
function verifyPorts(pool,ports){
  if(!pool||typeof pool.connect!=='function'||!ports||
     !['assertOrganizer','assertReader','readGraph','validateGraph','replaceGraph'].every(n=>typeof ports[n]==='function')){
    throw Error('WEB005_BASKET_CAS_ADAPTER_CONTRACT_INVALID');
  }
}

/**
 * Source-only adapter; its caller MUST authorize separately before connection
 * where appropriate. Within the TX, authorization is repeated under parent lock.
 * There is no independent nested transaction and no direct graph mutation here;
 * the audited graph port must operate on the *same* client and preserve stage,
 * route and basket business constraints, or fail closed before app activation.
 */
export function createBasketCasPgSourceAdapter({pool,ports}={}){
  verifyPorts(pool,ports);
  const readState=async(client,id)=>{
    const row=requireRow(await client.query(ROW_READ,[id]),id);
    const stages=await queryRows(client,STAGE_SQL,id);
    if(stages.length===0)throw Error('WEB005_BASKET_CAS_STAGES_MISSING');
    const roster=[];
    for(const [table,alias,order] of ROSTER_SOURCES){
      const sql=`SELECT to_jsonb(${alias}) AS row FROM ${table} ${alias} WHERE ${alias}.tournament_id=$1 ORDER BY ${order}`;
      roster.push([table,await queryRows(client,sql,id)]);
    }
    const graph=await ports.readGraph(client,id);
    if(!graph||!Array.isArray(graph.baskets)||!Array.isArray(graph.routes))throw Error('WEB005_BASKET_CAS_GRAPH_SNAPSHOT_INVALID');
    return {
      tournamentId:id,epoch:row.epoch,revision:dbRevision(row.revision),
      stageDigest:digest('WEB005/CAS/STAGES/V1',stages),
      // Include canonical graph as an additional out-of-band drift detector.
      rosterDigest:digest('WEB005/CAS/ROSTER/GRAPH/V1',[roster,graph]),
      graph:structuredClone(graph),
      _stageStates:stages.map(stage=>stage.status),_tournamentStatus:row.status,
    };
  };
  return Object.freeze({
    // CAS mutation is a single sealed public operation. Arbitrary callers
    // cannot obtain raw tx.replaceGraph/tx.advanceRevision phase methods.
    async executeBasketCasWrite({tournamentId:id,actor,ifMatch,graph}={}){
      tournamentId(id);
      return inTx(pool,'write',async client=>{
        const parent=requireRow(await client.query(ROW_LOCK,[id]),id);
        if(await ports.assertOrganizer(client,parent,actor)!==true){
          throw Error('WEB005_BASKET_CAS_AUTHORIZATION_DENIED');
        }
        // Auth first; then require client-supplied current strong validator.
        const supplied=parseBasketIfMatch(ifMatch);
        const before=await readState(client,id);
        requireMatchingBasketEtag(supplied,basketCasEtag(before));
        const next=nextBasketRevision(before.revision);
        if(before._tournamentStatus!=='draft'||before._stageStates.some(status=>status!=='planned')){
          throw Error('WEB005_BASKET_CAS_CONFIGURATION_IMMUTABLE');
        }
        if(await ports.validateGraph(client,id,graph)!==true){
          throw Error('WEB005_BASKET_CAS_GRAPH_VALIDATION_DENIED');
        }
        if(await ports.replaceGraph(client,id,graph)!==true){
          throw Error('WEB005_BASKET_CAS_GRAPH_REPLACEMENT_DENIED');
        }
        // Compare-and-swap, exactly one revision update, same parent epoch.
        const result=await client.query(ADVANCE,[id,before.revision.toString(),before.epoch,next.toString()]);
        if(result?.rowCount!==1||result.rows?.length!==1){
          throw Error('WEB005_BASKET_CAS_CONDITIONAL_REVISION_WRITE_FAILED');
        }
        if(dbRevision(result.rows[0].revision)!==next){
          throw Error('WEB005_BASKET_CAS_REVISION_ACK_MISMATCH');
        }
        const after=await readState(client,id);
        if(after.tournamentId!==id||after.epoch!==before.epoch||after.revision!==next){
          throw Error('WEB005_BASKET_CAS_COMMIT_SNAPSHOT_INCOHERENT');
        }
        return {status:200,graph:after.graph,etag:basketCasEtag(after)};
      });
    },
    async withSnapshotTransaction(id,actor){
      tournamentId(id);
      return inTx(pool,'read',async client=>{
        const parent=requireRow(await client.query(ROW_READ,[id]),id);
        if(await ports.assertReader(client,parent,actor)!==true){
          throw Error('WEB005_BASKET_CAS_AUTHORIZATION_DENIED');
        }
        return readState(client,id);
      });
    }
  });
}

/** Coherent read and validator; route cache headers must remain private/no-store. */
export async function readBasketCasSnapshot(adapter,{tournamentId:id,actor}={}){
  tournamentId(id);
  if(!adapter||typeof adapter.withSnapshotTransaction!=='function')throw Error('WEB005_BASKET_CAS_ADAPTER_REQUIRED');
  const state=await adapter.withSnapshotTransaction(id,actor);
  if(state.tournamentId!==id)throw Error('WEB005_BASKET_CAS_SNAPSHOT_SCOPE_MISMATCH');
  return {status:200,body:state.graph,etag:basketCasEtag(state),cacheControl:'private, no-store'};
}
/** Clone must NOT import source revision or source epoch (ABA prevention). */
export function freshCloneCasIdentity(){return {revision:0n,epoch:randomUUID()};}
/** No in-place restore without a separate owner-approved identity rotation. */
export function refuseInPlaceBasketRestore(){throw Error('WEB005_BASKET_CAS_IN_PLACE_RESTORE_DENIED');}
