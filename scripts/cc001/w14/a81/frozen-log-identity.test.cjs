'use strict';
/** W14 A81: real Node CLI regression for phase grammar and independent file identity.
 * Synthetic log fixtures only; not physical PC1-PC2 QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'../../w11/a81/verify-candidate207-telemetry.cjs');
const {parse,analyze}=require(script);
const host=(phase='Moving',periodMs=50)=>`CC_NET_HOST_READY port=7777\nCC_W10_NET_HOST revision=7 action=2 turn=1 phase=${phase} balls=20 packedBytes=1024 chunks=2 periodMs=${periodMs}\n`;
const client=(phase='Moving')=>`CC_NET_STATE_APPLIED revision=7 owner=1\nCC_W10_NET_CLIENT revision=7 action=2 turn=1 phase=${phase} balls=20 received=7 skippedRevisions=0\n`;
function tempPair(t,h=host(),c=client()){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a81-w14-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const hp=path.join(dir,'PC1_Player.log'), cp=path.join(dir,'PC2_Player.log');
  fs.writeFileSync(hp,h);fs.writeFileSync(cp,c);
  const run=(hostPath=hp,clientPath=cp,...extra)=>spawnSync(process.execPath,[script,'--host',hostPath,'--client',clientPath,...extra],{encoding:'utf8',timeout:10000});
  return {dir,hp,cp,run};
}
test('only GameState.MatchPhase Aiming/Moving/Over are recognized',()=>{
  for(const phase of ['Aiming','Moving','Over']){
    assert.equal(parse(host(phase),'HOST').errors.length,0,phase);
    assert.equal(parse(client(phase),'CLIENT').errors.length,0,phase);
  }
});
test('unknown but syntactically valid match phase rejected by HOST',()=>{
  assert.equal(parse(host('Banana',250),'HOST').errors[0].code,'MALFORMED_HOST');
});
test('unknown but syntactically valid match phase rejected by CLIENT',()=>{
  assert.equal(parse(client('Banana'),'CLIENT').errors[0].code,'MALFORMED_CLIENT');
});
test('unknown same phase on both sides cannot produce fake metadata consistency',()=>{
  const r=analyze(host('Banana',250),client('Banana'));
  assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_LOGS');
  assert.equal(r.validHost,0);assert.equal(r.validClient,0);
});
test('phase typo with alphanumerics is also rejected',()=>{
  for(const phase of ['moving','Aiming2','Over_2','AimingExtra'])
    assert.equal(parse(host(phase,250),'HOST').errors.length,1,phase);
});
test('three valid frozen phases still have valid scoped outcomes',()=>{
  for(const phase of ['Aiming','Over']){
    const r=analyze(host(phase,250),client(phase));
    assert.equal(r.verdict,'SAMPLED_DIAGNOSTIC_ONLY');
    assert.equal(r.gameplayGate,'NOT_ATTESTED');
  }
  assert.equal(analyze(host(),client()).verdict,'SAMPLED_DIAGNOSTIC_ONLY');
});
test('different file paths resolving to SAME inode are rejected (hardlink)',t=>{
  const f=tempPair(t);const alias=path.join(f.dir,'hardlink-PC2.log');
  fs.linkSync(f.hp,alias);const r=f.run(f.hp,alias);
  assert.equal(r.status,3,r.stderr);
  assert.match(r.stderr,/Two independent log files are required/);
});
test('symbolic alias to a file is rejected, even if path differs',t=>{
  const f=tempPair(t);const alias=path.join(f.dir,'symlink-PC2.log');
  fs.symlinkSync(f.hp,alias);const r=f.run(f.hp,alias);
  assert.equal(r.status,3,r.stderr);
  assert.match(r.stderr,/regular non-link log/);
});
test('same path string remains rejected',t=>{
  const f=tempPair(t);const r=f.run(f.hp,f.hp);
  assert.equal(r.status,3,r.stderr);
});
test('independent log files still run and report only metadata',t=>{
  const f=tempPair(t);const r=f.run();assert.equal(r.status,0,r.stderr);
  const obj=JSON.parse(r.stdout);assert.equal(obj.qaFreezeSourceSha,'3f972cdbaea6289a7e33ce608f5d3256cfdab0a3');
  assert.equal(obj.gameplayGate,'NOT_ATTESTED');
  assert.equal(obj.physicalPc1Pc2Qa,'NOT_ATTESTED');
});
test('nonexistent source file error does not disclose private absolute path',t=>{
  const f=tempPair(t);const secret=path.join(f.dir,'VERY_PRIVATE_DIRECTORY_HOST.log');
  const r=f.run(secret,f.cp);assert.equal(r.status,3);
  assert.match(r.stderr,/A81_INPUT_ERROR FILE_IO_ENOENT/);
  assert.ok(!r.stderr.includes(secret));
  assert.ok(!r.stdout.includes(secret));
});
test('improper output file path error does not disclose private absolute path',t=>{
  const f=tempPair(t);const secret=path.join(f.dir,'SECRET_PARENT','report.json');
  const r=f.run(f.hp,f.cp,'--out',secret);assert.equal(r.status,3);
  assert.match(r.stderr,/A81_INPUT_ERROR FILE_IO_ENOENT/);
  assert.ok(!r.stderr.includes(secret));
});
test('unknown phase in valid PC1 and PC2 logs produces real CLI anomaly exit1',t=>{
  const f=tempPair(t,host('Banana',250),client('Banana'));
  const r=f.run();assert.equal(r.status,1,r.stderr);
  const obj=JSON.parse(r.stdout);
  assert.equal(obj.verdict,'ANOMALY_IN_SUPPLIED_LOGS');
});
