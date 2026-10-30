'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {parse,compare}=require('./state-parity.cjs');
const HASH='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const OTHER='0'.repeat(64);
const line=(side,rev,hash=HASH,action=2,turn=1)=>'[Unity] CC_W11_STATE_'+side+' revision='+rev+' sha256='+hash+' action='+action+' turn='+turn;
test('one exact matched revision yields only scoped parity',()=>{
 const r=compare(line('TX',16),line('RX',16));
 assert.equal(r.status,'PASS_SCOPED');assert.equal(r.matchedRevisions,1);assert.equal(r.mismatches,0);
});
test('different authoritative JSON digest fails',()=>{
 const r=compare(line('TX',16),line('RX',16,OTHER));assert.equal(r.status,'FAIL');assert.equal(r.mismatches,1);
});
test('same hash but different action serial fails',()=>{
 assert.equal(compare(line('TX',16),line('RX',16,HASH,3)).status,'FAIL');
});
test('same hash but different turn fails',()=>{
 assert.equal(compare(line('TX',16),line('RX',16,HASH,2,0)).status,'FAIL');
});
test('no common revision holds, not pass',()=>{
 const r=compare(line('TX',16),line('RX',32));assert.equal(r.status,'HOLD');assert.equal(r.matchedRevisions,0);
});
test('one matched and missing samples reports bounded coverage',()=>{
 const r=compare(line('TX',16)+'\n'+line('TX',32),line('RX',16));
 assert.equal(r.status,'PASS_SCOPED');assert.equal(r.hostOnly,1);
});
test('a matching duplicate is allowed',()=>{
 assert.equal(parse(line('TX',16)+'\n'+line('TX',16),'TX').size,1);
});
test('conflicting duplicate is rejected',()=>{
 assert.throws(()=>parse(line('TX',16)+'\n'+line('TX',16,OTHER),'TX'),/CONFLICTING/);
});
test('malformed digest is rejected',()=>{
 assert.throws(()=>parse(line('TX',16,'abc'),'TX'),/MALFORMED/);
});
test('wrong log role is rejected',()=>{
 assert.throws(()=>parse(line('RX',16),'TX'),/WRONG_TRACE_ROLE/);
});
test('unsafe large revision is rejected',()=>{
 assert.throws(()=>parse(line('TX',Number.MAX_SAFE_INTEGER+1),'TX'),/INVALID_TRACE_COUNTER/);
});
test('raw no markers yields HOLD',()=>{
 assert.equal(compare('normal startup\n', 'normal startup\n').status,'HOLD');
});
test('real Node CLI returns expected scoped exit 0 and no state payload',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-'));
 try{
  const a=path.join(dir,'host.log'),b=path.join(dir,'client.log');
  fs.writeFileSync(a,line('TX',16));fs.writeFileSync(b,line('RX',16));
  const r=spawnSync(process.execPath,[require.resolve('./state-parity.cjs'),'--host',a,'--client',b],{encoding:'utf8'});
  assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).status,'PASS_SCOPED');assert.ok(!r.stdout.includes(HASH));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('real CLI exits 1 when a matched digest disagrees',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-'));
 try{
  const a=path.join(dir,'host.log'),b=path.join(dir,'client.log');
  fs.writeFileSync(a,line('TX',16));fs.writeFileSync(b,line('RX',16,OTHER));
  const r=spawnSync(process.execPath,[require.resolve('./state-parity.cjs'),'--host',a,'--client',b],{encoding:'utf8'});
  assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).status,'FAIL');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
