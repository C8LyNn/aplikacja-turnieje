'use strict';
/**
 * CC-001 A51 R17-W15 — deterministic metamorphic tests of the original
 * W12 shared-field comparator, restored in W15. Not Unity or G3 QA.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sharedFieldMismatches: compare}=require('../../w12/a51/native-metadata-shared-fields.cjs');
const row=(x={})=>({revision:39,actionSerial:7,turn:1,phase:'Moving',chunks:3,balls:14,...x});
const opt=['chunks','balls'];
const common=['actionSerial','turn','phase'];
const fields=[...common,...opt];

test('A41 HOST chunks unobservable in CLIENT: no false mismatch',()=>{
  assert.deepEqual(compare(row(),row({chunks:undefined})),[]);
});
test('A41 alternative absent optional CLIENT ball count: no false mismatch',()=>{
  assert.deepEqual(compare(row(),row({balls:undefined})),[]);
});
test('A31 both observed chunks mismatching: one real finding',()=>{
  assert.deepEqual(compare(row(),row({chunks:5})),[{field:'chunks',host:3,client:5}]);
});
test('optional missing host instead of client is symmetric',()=>{
  for(const field of opt){
    const a=row({[field]:undefined}),b=row();
    assert.deepEqual(compare(a,b),[]);
    assert.deepEqual(compare(b,a),[]);
  }
});
test('null optional field means unavailable, not unequal',()=>{
  for(const field of opt){
    assert.deepEqual(compare(row({[field]:null}),row()),[]);
    assert.deepEqual(compare(row(),row({[field]:null})),[]);
  }
});
test('every observable common field diverges even if chunks missing',()=>{
  const changed={actionSerial:8,turn:0,phase:'Aiming'};
  for(const field of common){
    const a=row(),b=row({[field]:changed[field],chunks:undefined});
    assert.deepEqual(compare(a,b).map(x=>x.field),[field]);
  }
});
test('each optional field is compared if emitted by both sides',()=>{
  assert.deepEqual(compare(row(),row({balls:15,chunks:4})).map(x=>x.field),['chunks','balls']);
});
test('zero is an observed optional value, not an absent field',()=>{
  assert.deepEqual(compare(row({chunks:0}),row({chunks:1})),[{field:'chunks',host:0,client:1}]);
});
test('all five diverging known fields produce exactly five findings',()=>{
  const x=compare(row(),row({actionSerial:9,turn:0,phase:'Over',chunks:4,balls:11}));
  assert.deepEqual(x.map(y=>y.field),fields);
});
test('matching parsed revision remains prerequisite',()=>{
  for(const rev of [0.5,NaN,Infinity,'39',40]){
    assert.throws(()=>compare(row(),row({revision:rev})),/matching integer revisions/);
  }
});
test('null rows are rejected without dereference',()=>{
  assert.throws(()=>compare(null,row()),/matching integer revisions/);
  assert.throws(()=>compare(row(),null),/matching integer revisions/);
});
test('frozen tuple input cannot be mutated',()=>{
  const a=Object.freeze(row()),b=Object.freeze(row({chunks:undefined,balls:15}));
  assert.deepEqual(compare(a,b).map(x=>x.field),['balls']);
  assert.equal(a.chunks,3);assert.equal(b.chunks,undefined);
});
test('comparison is metadata-only and cannot grant G3',()=>{
  const x=compare(row(),row());
  assert.deepEqual(x,[]);
  assert.equal(Object.hasOwn(require('../../w12/a51/native-metadata-shared-fields.cjs'),'certifyG3'),false);
});
test('deterministic results independent of optional-list insertion order',()=>{
  const x=row({balls:15,chunks:4,actionSerial:8}),y=row();
  assert.deepEqual(compare(x,y).map(z=>z.field),['actionSerial','chunks','balls']);
});
