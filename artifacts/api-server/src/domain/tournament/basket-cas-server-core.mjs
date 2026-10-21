/**
 * WEB-005 W6H A50 — source-only CAS transaction protocol, not database wiring.
 * Requires a trusted DB adapter whose withTournamentTransaction acquires the
 * tournaments parent FOR UPDATE first, guarantees rollback on ANY exception,
 * and reads all stage/roster digests from the same lock-protected snapshot.
 * Those operational guarantees and digest field inventory remain A00/A20 gates.
 * The current C03 app/routes/schema remain untouched; client flag stays OFF.
 */
import { createHash } from 'node:crypto';
import { parseBasketIfMatch, requireMatchingBasketEtag } from './basket-cas-precondition.ts';

const MAX_PG_INT8=(1n<<63n)-1n;
const HEX256=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DOMAIN=Buffer.from('WEB005/BASKET-CAS/ETAG/V1','utf8');
function revisionValue(revision){
  if(typeof revision!=='bigint'||revision<0n||revision>MAX_PG_INT8)throw Error('WEB005_BASKET_CAS_REVISION_INVALID');
  return revision;
}
export function nextBasketRevision(revision){
  const r=revisionValue(revision);
  if(r===MAX_PG_INT8)throw Error('WEB005_BASKET_CAS_REVISION_OVERFLOW');
  return r+1n;
}
function opaqueState(snapshot){
  const {tournamentId,epoch,revision,stageDigest,rosterDigest}=snapshot??{};
  if(!Number.isSafeInteger(tournamentId)||tournamentId<1)throw Error('WEB005_BASKET_CAS_TOURNAMENT_INVALID');
  if(typeof epoch!=='string'||!UUID.test(epoch))throw Error('WEB005_BASKET_CAS_EPOCH_INVALID');
  revisionValue(revision);
  if(typeof stageDigest!=='string'||!HEX256.test(stageDigest)||
     typeof rosterDigest!=='string'||!HEX256.test(rosterDigest))throw Error('WEB005_BASKET_CAS_DEPENDENCIES_UNVERIFIED');
  // Binary canonical framing: version domain length + fixed-width unsigned
  // tournament/revision and 16 raw UUID + 2 exact 32-byte dependency hashes.
  const raw=Buffer.allocUnsafe(8+8+16+32+32);
  raw.writeBigUInt64BE(BigInt(tournamentId),0);
  raw.writeBigUInt64BE(revision,8);
  Buffer.from(epoch.replaceAll('-',''),'hex').copy(raw,16);
  Buffer.from(stageDigest,'hex').copy(raw,32);
  Buffer.from(rosterDigest,'hex').copy(raw,64);
  const prefix=Buffer.alloc(2);prefix.writeUInt16BE(DOMAIN.length);
  return Buffer.concat([prefix,DOMAIN,raw]);
}
export function basketCasEtag(snapshot){
  return '"'+createHash('sha256').update(opaqueState(snapshot)).digest('base64url')+'"';
}

/**
 * Adapter contract (must be implemented AFTER CAS-DEC-01..04 schema GO):
 * withTournamentTransaction(id, fn): obtains parent row FOR UPDATE, retries
 * no stale writes, commits exactly once when fn succeeds, rollback otherwise.
 * tx.assertOrganizer(actor): validates current server identity UNDER the lock.
 * tx.readBasketState(): coherent persisted epoch/revision, complete stageDigest
 * and rosterDigest, committed basket/routes graph from the SAME transaction.
 * tx.validateReplacementGraph(graph), tx.replaceGraph(graph): existing validated
 * stage-basket operations in that same transaction (no nested independent TX).
 * tx.advanceRevision(old,new): conditional update returning affected row count.
 * This is a source protocol, NOT proof a real adapter honors those contracts.
 */
export async function executeBasketCas(adapter,{tournamentId,actor,ifMatch,graph}={}){
  if(!Number.isSafeInteger(tournamentId)||tournamentId<1)throw Error('WEB005_BASKET_CAS_TOURNAMENT_INVALID');
  if(!adapter||typeof adapter.withTournamentTransaction!=='function')throw Error('WEB005_BASKET_CAS_ADAPTER_REQUIRED');
  return adapter.withTournamentTransaction(tournamentId,async tx=>{
    await tx.assertOrganizer(actor);
    const token=parseBasketIfMatch(ifMatch); // never reveal CAS precondition before auth
    const before=await tx.readBasketState();
    if(before.tournamentId!==tournamentId)throw Error('WEB005_BASKET_CAS_SNAPSHOT_SCOPE_MISMATCH');
    requireMatchingBasketEtag(token,basketCasEtag(before));
    const next=nextBasketRevision(before.revision); // reject overflow before any graph writes
    await tx.validateReplacementGraph(graph);
    await tx.replaceGraph(graph);
    const affected=await tx.advanceRevision(before.revision,next);
    if(affected!==1)throw Error('WEB005_BASKET_CAS_CONDITIONAL_REVISION_WRITE_FAILED');
    const committed=await tx.readBasketState();
    if(committed.tournamentId!==tournamentId||committed.epoch!==before.epoch||committed.revision!==next){
      throw Error('WEB005_BASKET_CAS_COMMIT_SNAPSHOT_INCOHERENT');
    }
    return {status:200,graph:committed.graph,etag:basketCasEtag(committed)};
  });
}
