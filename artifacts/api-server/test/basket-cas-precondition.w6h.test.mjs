import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BasketCasPreconditionError, parseBasketIfMatch, requireMatchingBasketEtag } from '../src/domain/tournament/basket-cas-precondition.ts';

const A = '"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"';
const B = '"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"';
function rejectsWith(code,status,fn) {
  assert.throws(fn, err => err instanceof BasketCasPreconditionError && err.code === code && err.status === status);
}
test('CAS-P01 absent validator fails with 428',()=>{
  rejectsWith('STAGE_BASKET_IF_MATCH_REQUIRED',428,()=>parseBasketIfMatch(undefined));
  rejectsWith('STAGE_BASKET_IF_MATCH_REQUIRED',428,()=>parseBasketIfMatch(null));
});
test('CAS-P02 exact well-formed strong token accepted',()=>assert.equal(parseBasketIfMatch(A),A));
test('CAS-P03 weak and wildcard validators fail closed',()=>{
  for(const v of ['W/'+A,'*']) rejectsWith('INVALID_STAGE_BASKET_IF_MATCH',400,()=>parseBasketIfMatch(v));
});
test('CAS-P04 malformed and duplicate If-Match values fail closed',()=>{
  for(const v of ['', 'unquoted', A+','+B, A+'\n'+B, '"short"', ['foo'], {}]) {
    rejectsWith('INVALID_STAGE_BASKET_IF_MATCH',400,()=>parseBasketIfMatch(v));
  }
});
test('CAS-P05 matching opaque server token accepted',()=>assert.doesNotThrow(()=>requireMatchingBasketEtag(A,A)));
test('CAS-P06 stale server token gives 412 domain error',()=>rejectsWith('STAGE_BASKET_CONFIGURATION_STALE',412,()=>requireMatchingBasketEtag(A,B)));
test('CAS-P07 foreign token cannot authorize different current token',()=>rejectsWith('STAGE_BASKET_CONFIGURATION_STALE',412,()=>requireMatchingBasketEtag(B,A)));
test('CAS-P08 invalid server-issued token is a fail-closed invariant error',()=>assert.throws(()=>requireMatchingBasketEtag(A,'W/'+A),/SERVER_ETAG_INVALID/));
test('CAS-P09 validator type confusion never silently coerces',()=>{
  rejectsWith('INVALID_STAGE_BASKET_IF_MATCH',400,()=>requireMatchingBasketEtag(0,A));
  rejectsWith('INVALID_STAGE_BASKET_IF_MATCH',400,()=>requireMatchingBasketEtag({toString:()=>A},A));
});
