// Reads the certified file. Instrumentation exists only in the browser response, never on disk.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source=process.argv[2]||'C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html';
const expected='bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e';
const bytes=fs.readFileSync(source),sha=crypto.createHash('sha256').update(bytes).digest('hex');if(sha!==expected)throw Error('Certified source hash mismatch');
const html=bytes.toString('utf8'),st=html.indexOf('const TYPES = ')+14,en=html.indexOf('\n};',st)+2;
const rawTypes=vm.runInNewContext('('+html.slice(st,en)+')',{}, {timeout:1000});
const instrument=`
window.__CC_MIGRATION_EXPORT__=()=>{
 const balls=[],abilities=[];
 for(const [id,t] of Object.entries(TYPES)){
  resetMatchState();const b=spawn('player',id,270,450,0,0,{suppressSpawnEvent:true});const spec=abilitySpecFor(id);
  balls.push({id,name:t.name,color:t.color,stockCopies:Number.isFinite(tierCopies(id))?tierCopies(id):-1,hp:b.maxHp,typeHp:t.hp,radius:b.r,mass:b.mass,restitution:b.restitution,wallRestitution:b.wallRestitution,maxSpeed:b.maxSpeed,size:t.size,archetype:archetypeKey(id),hidden:!!t.hidden,description:v147AbilityDescription(id),counter:t.counter||'',abilityId:id+':primary',tier:tierKey(id),rawMetadata:JSON.stringify(t)});
  abilities.push({id:id+':primary',ballId:id,events:[...(spec?.event||[])],role:spec?.role||'SELF_ANY',conditions:[...(spec?.conditions||[])],range:spec?.range||'self',countJson:JSON.stringify(spec?.count??null),limitJson:JSON.stringify(spec?.limit??null),effectJson:JSON.stringify(spec?.effect??null),rawMetadata:JSON.stringify({spec,rule:TYPE_RULES[id],content:V148_CONTENT_DEFINITIONS[id]||null}),portStatus:'DATA_ONLY'});
 }
 return {balls,abilities,decks:DEFAULT_DECKS.map(d=>({id:d.id,name:d.name,archetype:d.archetype,balls:[...d.balls],description:d.gameplan||d.desc,provisional:false,rawMetadata:JSON.stringify(d)})),archetypes:Object.entries(ARCHETYPE_DEFS).map(([id,a])=>({id,name:a.label,family:a.family,description:a.desc,coreText:ARCHETYPE_CORE_TEXT[id],balls:[...ARCHETYPE_BALLS[id]]})),rules:{...STANDARD_MATCH_RULES},pending:[...V148_REDESIGN_PENDING],regression:window.__CC_V148_RUNTIME__.existingRegression(),contentAudit:v148IntegratedContentAudit()};
};
`;
const ix=html.lastIndexOf('})();');if(ix<0)throw Error('Source closure not found');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://core-clash-reference.invalid/**',r=>r.fulfill({status:200,contentType:'text/html',body:html.slice(0,ix)+instrument+html.slice(ix)}));
  await page.goto('https://core-clash-reference.invalid/');await page.waitForFunction(()=>!!window.__CC_MIGRATION_EXPORT__);
  const out=await page.evaluate(()=>window.__CC_MIGRATION_EXPORT__());if(errors.length)throw Error(errors.join('\n'));
  for(const b of out.balls)b.originalMetadata=JSON.stringify(rawTypes[b.id]);
  const root=path.resolve(__dirname,'..'),dir=path.join(root,'Assets/Resources/Data');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(root,'Evidence'),{recursive:true});
  fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify({version:'V149',sourceVersion:'V148',sourcePath:source,sourceSha256:sha,balls:out.balls,abilities:out.abilities,decks:out.decks,archetypes:out.archetypes},null,2));
  fs.writeFileSync(path.join(root,'Evidence/source-runtime.json'),JSON.stringify({sha256:sha,size:bytes.length,extractedAt:new Date().toISOString(),rules:out.rules,pending:out.pending,regression:out.regression,contentAudit:out.contentAudit,pageErrors:errors},null,2));
  if(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')!==sha)throw Error('Source changed during extraction');
  console.log(`Extracted ${out.balls.length} balls, ${out.abilities.length} abilities, ${out.decks.length} decks, ${out.archetypes.length} archetypes; source unchanged.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
