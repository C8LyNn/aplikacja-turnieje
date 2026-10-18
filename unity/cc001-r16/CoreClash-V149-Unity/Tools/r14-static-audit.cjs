#!/usr/bin/env node
// R14 independent, read-only structural audit. It cannot establish C# compilation or gameplay.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const out = process.argv.find(v => v.startsWith('--output='))?.slice('--output='.length);
const results = [];
const check = (name, fn) => {
  try { const details = fn(); results.push({name,status:'PASS',details:details || ''}); console.log('PASS',name); }
  catch(e) { results.push({name,status:'FAIL',details:e.message}); console.error('FAIL',name,':',e.message); }
};
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const assert = (ok, text) => { if (!ok) throw Error(text); };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const required = [
 ['R10 Construction', 'Assets/CoreClash/Core/ConstructionEffects.cs', ['ConstructionStop','ConstructionTurn','BuildWallmakerRow','BuildBarricade','RepairPulse','EngineerTurn','BastionTurn']],
 ['R11 Reinforcements', 'Assets/CoreClash/Core/ReinforcementEffects.cs', ['ReinforcementTurn','ReinforcementStop','GenerateAt','SplitOnStop','SpawnEggSacBroodlings']],
 ['R12 Evolution', 'Assets/CoreClash/Core/EvolutionEffects.cs', ['EvolutionTurn','EvolutionPairContact','SplitMitosis','SpawnSwarmShards','ConscriptorDeath']],
 ['R13 Elemental', 'Assets/CoreClash/Core/ElementalEffects.cs', ['ElementalStop','ElementalTurn','ElementalContact','ChainFrost']],
];
check('Canonical roster, immutable V148 reference and featured presets',()=>{
  const data=JSON.parse(read('Assets/Resources/Data/catalog.json'));
  const featured=JSON.parse(read('Assets/Resources/Data/featured-decks.json'));
  assert(data.balls.length===227,'Expected exactly 227 ball definitions');
  assert(new Set(data.balls.map(b=>b.id)).size===227,'Duplicate ball IDs');
  assert(data.balls.filter(b=>!b.hidden&&b.id!=='normal').length===224,'Expected 224 specials');
  assert(data.archetypes.length===12,'Expected 12 archetypes');
  assert(data.decks.length===36,'Expected 36 canonical decks');
  assert(featured.decks.length===4,'Expected exactly 4 optional featured decks');
  for (const d of [...data.decks,...featured.decks]) assert(d.balls.length===9&&new Set(d.balls).size===9,`Invalid 9-ball deck: ${d.id}`);
  const ref = path.resolve(root,'../Reference/V148_reference_original.html');
  assert(fs.existsSync(ref),'Missing immutable V148 reference');
  assert(sha(fs.readFileSync(ref))===data.sourceSha256,'Original V148 HTML checksum mismatch');
  return {records:227,specials:224,archetypes:12,canonicalDecks:36,featured:4,referenceSha256:data.sourceSha256};
});
for (const [name,file,methods] of required) check(name+' present and wired',()=>{
  const text=read(file);
  for (const method of methods) assert(new RegExp('\\b'+method+'\\s*\\(').test(text),`Missing method ${method}`);
  const resolver=read('Assets/CoreClash/Core/AbilityResolver.cs');
  const routing=name.includes('Construction')?['ConstructionStop','ConstructionTurn']:
    name.includes('Reinforce')?['ReinforcementTurn','ReinforcementStop']:
    name.includes('Evolution')?['EvolutionPairContact','EvolutionTurn']:
    ['ElementalStop','ElementalTurn','ElementalContact'];
  for(const m of routing) {
    const fileText=m==='EvolutionPairContact'?read('Assets/CoreClash/Core/ExplosiveEffects.cs'):resolver;
    assert(fileText.includes(m+'('),`Missing resolver dispatch for ${m}`);
  }
  return {file,methods:methods.length};
});
check('Authoritative fields and network snapshot coverage',()=>{
  const state=read('Assets/CoreClash/Core/GameState.cs');
  for(const field of ['structures','zones','generated','veteranUpgrades','mitosisSplit','quartermasterTurnCounter','frostguardAnchored','lastElementalTurn'])
    assert(new RegExp('\\b'+field+'\\b').test(state),`Missing serialized state: ${field}`);
  const test=read('Tests/IntegrationR14Tests.cs');
  const main=read('Tests/Program.cs');
  assert(main.includes('IntegrationR14Tests();'),'R14 suite not wired into test executable');
  assert((test.match(/Test\("R14 /g)||[]).length>=4,'Expected four cross-wave regression test cases');
  return {crossWaveTestCases:(test.match(/Test\("R14 /g)||[]).length};
});
check('Official ability-support history not silently promoted',()=>{
  const data=JSON.parse(read('Evidence/ability-support.json'));
  const counts=data.counts;
  assert(counts.UNITY_READY===37&&counts.PARTIAL===32&&counts.DATA_ONLY===158,
    `Historical certification changed unexpectedly: ${JSON.stringify(counts)}`);
  return counts;
});
const report={kind:'R14_STATIC_SOURCE_AUDIT',baseline:'R13',status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',
  warning:'STATIC ONLY — no C# compilation, runtime, multiplayer or Unity build verified',
  auditedAt:new Date().toISOString(),checks:results};
if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(path.resolve(out),JSON.stringify(report,null,2)+'\n');}
console.log(`R14 static audit: ${results.filter(x=>x.status==='PASS').length}/${results.length} checks pass; ${report.status}`);
process.exitCode=report.status==='PASS'?0:1;
