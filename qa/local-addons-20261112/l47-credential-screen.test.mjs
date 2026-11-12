import { test } from 'node:test';
import assert from 'node:assert/strict';
import { organizerCredentialScreen } from '../../artifacts/tournament-manager/src/lib/organizer-credential-screen.ts';
const state = (accessMode, exists=true) => ({accessMode,exists,private:false});
test('valid known modes remain unchanged',()=>{
  for(const mode of ['organizer_login','legacy_upgrade','admin_recovery'])
    assert.equal(organizerCredentialScreen(state(mode),false),mode);
});
test('loading overrides even a valid login mode',()=>{
  assert.equal(organizerCredentialScreen(state('organizer_login'),true),'loading');
});
test('absent state and unavailable tournament fail closed',()=>{
  assert.equal(organizerCredentialScreen(null,false),'not_found');
  assert.equal(organizerCredentialScreen(state('organizer_login',false),false),'not_found');
});
test('unknown and deliberately malformed access modes cannot select a login flow',()=>{
  for(const mode of ['future_mode','__proto__',false,0,{},undefined,null])
    assert.equal(organizerCredentialScreen(state(mode),false),'not_found',String(mode));
});
test('nonboolean exists does not act as a truthy authorization hint',()=>{
  for(const exists of ['true','yes',1,[],{}])
    assert.equal(organizerCredentialScreen(state('organizer_login',exists),false),'not_found');
});
test('does not mutate server response',()=>{
  const s=state('legacy_upgrade');const before=structuredClone(s);
  organizerCredentialScreen(s,false);assert.deepEqual(s,before);
});
