/** Pack 16: exercise the real Pack 15 orchestrator source with a deterministic
 * transactional test-double, including injected failures between the steps.
 * Not a substitute for PostgreSQL integration tests.
 *
 * Run: node --import tsx --test test/tournament-atomic-correction-orchestration.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// TypeScript is a workspace toolchain dependency. Read the actual implementation
// instead of duplicating its branches inside the test.
const localRequire = createRequire(import.meta.url);
const ts = localRequire('typescript') as typeof import('typescript');
const source = join(fileURLToPath(new URL('../', import.meta.url)), 'src/application/operations/tournament-atomic-correction.ts');
const code = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

type Value = Record<string, any>;
type Working = { matches: Value[]; stages: Value[]; actions: Value[]; operations: Value[] };
const col = (key: string) => ({ key });
const tables = Object.fromEntries([
  ['matchesTable', ['id', 'tournamentId', 'stageId']],
  ['tournamentStagesTable', ['id', 'tournamentId']],
  ['actionLogTable', ['id', 'tournamentId', 'matchId', 'actionType', 'isUndone', 'undoPayload']],
  ['tournamentCorrectionOperationsTable', ['id', 'tournamentId', 'matchId', 'status', 'revertActionId']],
].map(([name, fields]) => [name as string, Object.assign({tableName: ({matchesTable:'matches',tournamentStagesTable:'stages',actionLogTable:'actions',tournamentCorrectionOperationsTable:'operations'} as Value)[name as string]},
  Object.fromEntries((fields as string[]).map(key => [key, col(key)])))])) as Value;
const eq = (field: {key:string}, value: unknown) => (row: Value) => row[field.key] === value;
const and = (...conditions: Array<(r:Value)=>boolean>) => (row:Value) => conditions.every(condition => condition(row));
const desc = (field: {key:string}) => ({ field: field.key, direction: -1 });

function fixture(): Working {
  return {
    matches: [{id:11, tournamentId:9, stageId:5, status:'completed',resultType:'played',bestOf:3,
      player1Id:41,player2Id:42, score1:2,score2:1,winnerId:41,revision:3}],
    stages: [{id:5,tournamentId:9,format:'round_robin',status:'active'}],
    actions: [{id:70,tournamentId:9,matchId:11,actionType:'match_result_submitted',isUndone:false,
      undoPayload:JSON.stringify({type:'revert_match',matchId:11})}],
    operations: [{id:'071d46f5-809e-4b12-a783-72d49367556a',tournamentId:9,matchId:11,status:'approved',
      expectedRevision:3,expectedCompletionActionId:70,expectedStageVersionVector:'stage-vector',
      proposedScore1:1,proposedScore2:2,revertActionId:null,completedAt:null}],
  };
}

function mockEngine(initial:Working, options:{ completeThrows?:boolean; afterCompleteDuplicate?:boolean; malformedAudit?:boolean }={}) {
  let state=structuredClone(initial), txnCount=0, stepTxnIds:number[]=[];
  const db = { async transaction<T>(fn:(tx:any)=>Promise<T>):Promise<T> {
    const working=structuredClone(state), txnId=++txnCount;
    const select = (selection?:Value) => query('select',undefined,selection);
    const update = (table:Value) => query('update',table,undefined);
    const query = (mode:'select'|'update', table?:Value, selection?:Value) => {
      let tableName=table?.tableName as keyof Working | undefined;
      let predicate=(row:Value)=>true, sort:{field:string;direction:number}|null=null;
      let limit=Infinity, updates:Value|null=null;
      const builder:any={
        from(next:Value){tableName=next.tableName;return builder},
        set(next:Value){updates=next;return builder},
        where(next:(r:Value)=>boolean){predicate=next;return builder},
        orderBy(next:{field:string;direction:number}){sort=next;return builder},
        limit(next:number){limit=next;return builder},
        returning(next?:Value){return Promise.resolve(execute(next))},
        then(resolve:any,reject:any){return Promise.resolve(execute()).then(resolve,reject)},
      };
      function project(rows:Value[], columns?:Value):Value[]{
        if(!columns)return rows.map(r=>({...r}));
        return rows.map(row=>Object.fromEntries(Object.entries(columns).map(([name,column])=>[name,row[column.key]])));
      }
      function execute(returned?:Value) {
        if(!tableName)throw Error('Missing table');
        const rows=working[tableName];
        if(!rows)throw Error('Unknown table '+tableName);
        if(mode==='select'){
          let filtered=rows.filter(predicate);
          if(sort)filtered=[...filtered].sort((a,b)=>((a[sort!.field] as number)-(b[sort!.field] as number))*sort!.direction);
          return project(filtered.slice(0,limit),selection);
        }
        if(!updates)throw Error('Missing update');
        let filtered=rows.filter(predicate);
        filtered.forEach(row=>Object.assign(row,updates));
        return project(filtered,returned);
      }
      return builder;
    };
    const tx={select,update,__id:txnId,__working:working};
    try {const response=await fn(tx);state=working;return response}
    catch(error){throw error}
  }};
  async function revertMatch(input:Value,_hooks:Value,tx:Value){
    stepTxnIds.push(tx.__id);
    const working=tx.__working as Working;
    const m=working.matches[0],op=working.operations[0];
    if(input.expectedMatchRevision!==m.revision || op.status!=='approved')throw Error('GUARD_STALE');
    if(input.expectedCompletionActionId!==70 || input.expectedStageVersionVector!==op.expectedStageVersionVector)throw Error('GUARD_STALE');
    const prior=working.actions.find(x=>x.id===70)!; prior.isUndone=true;
    m.status='pending';m.resultType=null;m.score1=null;m.score2=null;m.winnerId=null;m.revision++;
    const revertAction={id:71,tournamentId:9,matchId:11,actionType:'match_result_reverted',isUndone:false};
    working.actions.push(revertAction);
    Object.assign(op,{status:'reverted_requires_resubmission',revertActionId:71,completedAt:new Date().toISOString()});
    return {match:{...m},revertAction};
  }
  async function completeMatch(input:Value,_hooks:Value,tx:Value){
    stepTxnIds.push(tx.__id);
    const working=tx.__working as Working,m=working.matches[0];
    if(m.status!=='pending'||m.revision!==input.expectedRevision)throw Error('INVALID_REVERT');
    m.status='completed';m.resultType='played';m.score1=input.score1;m.score2=input.score2;
    m.winnerId=input.score1>input.score2?m.player1Id:m.player2Id;m.revision++;
    working.actions.push({id:72,tournamentId:9,matchId:11,actionType:'match_result_submitted',isUndone:false,
      undoPayload:options.malformedAudit?'bad-json':JSON.stringify({type:'revert_match',matchId:11})});
    if(options.afterCompleteDuplicate)working.actions.push({id:73,tournamentId:9,matchId:11,
      actionType:'match_result_submitted',isUndone:false,undoPayload:JSON.stringify({type:'revert_match',matchId:11})});
    if(options.completeThrows)throw Error('INJECTED_COMPLETE_FAILURE');
    return {...m};
  }
  const deriveAtomicCorrectionDecision=({bestOf,oldScore1,oldScore2,score1,score2,player1Id,player2Id}:Value):Value=>{
    if(player1Id==null||player2Id==null||player1Id===player2Id)return{allowed:false};
    if(score1===oldScore1&&score2===oldScore2)return{allowed:false};
    if(!Number.isInteger(score1)||!Number.isInteger(score2)||!Number.isInteger(bestOf)||
      score1<0||score2<0||bestOf<1||bestOf%2!==1)return{allowed:false};
    const wins=Math.floor(bestOf/2)+1;
    if(!((score1===wins&&score2<wins)||(score2===wins&&score1<wins)))return{allowed:false};
    return{allowed:true,score1,score2,winnerId:score1>score2?player1Id:player2Id};
  };
  const modules:Value={
    'drizzle-orm':{eq,and,desc},'@workspace/db':{db,...tables},
    '../../domain/tournament/atomic-result-correction':{deriveAtomicCorrectionDecision},
    '../matches/revert-match':{revertMatch},'../matches/complete-match':{completeMatch},
  };
  const module={exports:{} as Value};
  vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{})(
    (name:string)=>{if(!modules[name])throw Error('Unexpected module '+name);return modules[name]},module,module.exports);
  return {execute:module.exports.executeAtomicRoundRobinCorrection as (input:Value,hooks?:Value)=>Promise<Value>,
    read:()=>structuredClone(state),transactions:()=>txnCount,transactionIds:()=>[...stepTxnIds]};
}

const request=(state:Working)=>({operation:{...state.operations[0]},tournamentId:9,actor:{type:'organizer'}});

test('commit: corrected match, receipt, and audit actions written by a single transaction',async()=>{
  const before=fixture(),engine=mockEngine(before);
  const out=await engine.execute(request(before));
  const after=engine.read();
  assert.equal(engine.transactions(),1);assert.deepEqual(engine.transactionIds(),[1,1]);
  assert.deepEqual([after.matches[0].score1,after.matches[0].score2,after.matches[0].status],[1,2,'completed']);
  assert.equal(after.operations[0].status,'corrected');
  assert.equal(after.operations[0].completionActionId,72);assert.equal(after.operations[0].correctedMatchRevision,5);
  assert.equal(after.actions.find(x=>x.id===70)?.isUndone,true);
  assert.equal(after.actions.filter(x=>x.actionType==='match_result_submitted'&&!x.isUndone).length,1);
  assert.equal(out.completedActionId,72);
});

test('rollback: an injected exception immediately after reverting does not publish partial changes',async()=>{
  const before=fixture(),engine=mockEngine(before);
  await assert.rejects(engine.execute(request(before),{afterRevert:()=>{throw Error('FAIL_AFTER_REVERT')}}),/FAIL_AFTER_REVERT/);
  assert.deepEqual(engine.read(),before);assert.equal(engine.transactions(),1);
});

test('rollback: an injected exception immediately after new result does not publish partial changes',async()=>{
  const before=fixture(),engine=mockEngine(before);
  await assert.rejects(engine.execute(request(before),{afterComplete:()=>{throw Error('FAIL_AFTER_COMPLETE')}}),/FAIL_AFTER_COMPLETE/);
  assert.deepEqual(engine.read(),before);
});

test('rollback: completeMatch failure after its own mutation leaves original approved result',async()=>{
  const before=fixture(),engine=mockEngine(before,{completeThrows:true});
  await assert.rejects(engine.execute(request(before)),/INJECTED_COMPLETE_FAILURE/);
  assert.deepEqual(engine.read(),before);
});

test('audit ambiguity: two active submissions force full transaction rollback',async()=>{
  const before=fixture(),engine=mockEngine(before,{afterCompleteDuplicate:true});
  await assert.rejects(engine.execute(request(before)),/CORRECTION_AUDIT_MISSING/);
  assert.deepEqual(engine.read(),before);
});

test('audit corruption: malformed undo payload forces full transaction rollback',async()=>{
  const before=fixture(),engine=mockEngine(before,{malformedAudit:true});
  await assert.rejects(engine.execute(request(before)),/CORRECTION_AUDIT_MISSING/);
  assert.deepEqual(engine.read(),before);
});

test('stale operation is rejected without persisting changes',async()=>{
  const before=fixture(),engine=mockEngine(before);
  const input=request(before);input.operation.expectedRevision=2;
  await assert.rejects(engine.execute(input),/GUARD_STALE/);
  assert.deepEqual(engine.read(),before);
});

test('unsupported format is refused before reverting',async()=>{
  const before=fixture();before.stages[0].format='double_elimination';const engine=mockEngine(before);
  await assert.rejects(engine.execute(request(before)),/CORRECTION_NOT_SUPPORTED/);
  assert.deepEqual(engine.read(),before);assert.deepEqual(engine.transactionIds(),[]);
});

test('unchanged score is refused before reverting',async()=>{
  const before=fixture();before.operations[0].proposedScore1=2;before.operations[0].proposedScore2=1;
  const engine=mockEngine(before);
  await assert.rejects(engine.execute(request(before)),/CORRECTION_RESULT_INVALID/);
  assert.deepEqual(engine.read(),before);
});

test('previously consumed approval is rejected, never executed twice',async()=>{
  const before=fixture();before.operations[0].status='corrected';const engine=mockEngine(before);
  await assert.rejects(engine.execute(request(before)),/GUARD_STALE/);
  assert.deepEqual(engine.read(),before);
});
