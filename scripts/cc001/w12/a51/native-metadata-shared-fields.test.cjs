#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {sharedFieldMismatches} = require('./native-metadata-shared-fields.cjs');
const row = (changes={}) => ({revision:16, actionSerial:5,turn:1,phase:'Moving',chunks:2,balls:14,...changes});
test('A41 valid host/client with no client chunks is not a contradiction',()=>{
  const x=sharedFieldMismatches(row(),row({chunks:undefined}));assert.deepEqual(x,[]);
});
test('A41 valid client with null chunks is not a contradiction',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({chunks:null})),[]);
});
test('A31 TX/RX matching chunks remains comparable',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row()),[]);
});
test('A31 both known but divergent chunks reports mismatch',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({chunks:3})),[{field:'chunks',host:2,client:3}]);
});
test('A41 ball count remains comparable when both emitted',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({chunks:undefined,balls:15})),[{field:'balls',host:14,client:15}]);
});
test('A31 optional balls omitted by both never creates a false alarm',()=>{
  assert.deepEqual(sharedFieldMismatches(row({balls:null}),row({balls:undefined})),[]);
});
test('Action mismatch is always reported even when optional chunks omitted',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({actionSerial:6,chunks:undefined})),[{field:'actionSerial',host:5,client:6}]);
});
test('Turn mismatch is always reported',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({turn:0,chunks:undefined})),[{field:'turn',host:1,client:0}]);
});
test('Phase mismatch is always reported',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({phase:'Aiming',chunks:undefined})),[{field:'phase',host:'Moving',client:'Aiming'}]);
});
test('Multiple contradictions retain deterministic field order',()=>{
  assert.deepEqual(sharedFieldMismatches(row(),row({actionSerial:6,turn:0,phase:'Over',balls:15,chunks:undefined})).map(x=>x.field),['actionSerial','turn','phase','balls']);
});
test('A mismatched revision is rejected before any comparison',()=>{
  assert.throws(()=>sharedFieldMismatches(row(),row({revision:17})),/matching integer revisions/);
});
test('A noninteger revision is rejected',()=>{
  assert.throws(()=>sharedFieldMismatches(row({revision:NaN}),row()),/matching integer revisions/);
});
test('Inputs are not mutated',()=>{
  const a=Object.freeze(row()),b=Object.freeze(row({chunks:undefined}));sharedFieldMismatches(a,b);assert.equal(a.chunks,2);assert.equal(b.chunks,undefined);
});
test('Metadata equality cannot produce G3/pass certification',()=>{
  assert.equal(sharedFieldMismatches(row(),row({chunks:undefined})).length,0);
  assert.equal(Object.hasOwn(require('./native-metadata-shared-fields.cjs'),'certifyG3'),false);
});
