import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASKET_CAS_SOURCE_HOLDS, assertBasketCasSourceActivationAllowed } from './basket-cas-source-activation-gate.mjs';
test('GATE-01: no caller argument can activate unverified live CAS',()=>{
  for(const claim of [undefined, true, {}, {D03:true,T055:true,verified:true}])
    assert.throws(()=>assertBasketCasSourceActivationAllowed(claim),/WEB005_BASKET_CAS_SOURCE_HOLD/);
});
test('GATE-02: explicit A20 writer, routing, trigger and migration HOLD coverage',()=>{
  const all=BASKET_CAS_SOURCE_HOLDS.join(' ');
  for(const term of ['D03','T055','QUALIFICATION','ROUTING_EXECUTION','ROUTING_PLAN_CHILDREN','TRIGGER','PG16'])
    assert.ok(all.includes(term),term);
  assert.ok(Object.isFrozen(BASKET_CAS_SOURCE_HOLDS));
});
