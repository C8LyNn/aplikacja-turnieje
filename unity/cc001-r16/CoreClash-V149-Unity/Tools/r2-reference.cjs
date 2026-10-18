// Read-only certified V148 presentation reference. Instrumentation is response-memory only.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const sourcePath = 'C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html';
const sourceSha256 = 'bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e';
const sha = v => crypto.createHash('sha256').update(v).digest('hex');
const sourceBytes = fs.readFileSync(sourcePath);
assert.equal(sha(sourceBytes), sourceSha256, 'Certified V148 source changed');
const html = sourceBytes.toString('utf8');
const insertAt = html.lastIndexOf('})();');
assert.ok(insertAt > 0);
const inspect = `
window.__R2_REFERENCE_QA__ = Object.freeze({
  geometry:()=>({W,H,mapKey:state.mapKey,mapName:state.mapName,field:{...field},pad:{...launchPad(localHumanOwner())},selectedType,gameMode,turn:state.turn,phase:state.phase,dragging:state.draggingShot,aim:state.aim&&{...state.aim},origin:state.shotOrigin&&{...state.shotOrigin},maxAimDistance:MAX_AIM_DISTANCE,balls:state.balls.length}),
  decks:()=>DEFAULT_DECKS.map(d=>({id:d.id,name:d.name,balls:[...d.balls]})),
  details:type=>({name:TYPES[type].name,color:TYPES[type].color,mark:TYPE_MARKS[type],presentation:v148PresentationState(type),quickScan:v148QuickScan(type),playerDescription:v148PlayerDescription(type)})
});
`;
const body = html.slice(0, insertAt) + inspect + html.slice(insertAt);
const evidence = path.join(root, 'Evidence');
fs.mkdirSync(evidence, { recursive: true });

async function metrics(page) {
  return page.evaluate(() => {
    const selectors = ['.app','.topbar','.baseHud','.centerCol','.stageWrap','canvas','.controls','.tray','.ballBtn','.orb','.selectedStrip','.matchQuickBar','.hint','.interfaceModePanel','.draftPanel','.presetDecks','.draftGrid','.ballInfoModal','.ballInfoHero','.ballInfoDescription'];
    const out = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel); if (!el) continue;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      out[sel] = {x:r.x,y:r.y,width:r.width,height:r.height,display:s.display,background:s.backgroundColor,backgroundImage:s.backgroundImage,color:s.color,border:s.border,borderRadius:s.borderRadius,fontSize:s.fontSize,gap:s.gap,gridTemplateColumns:s.gridTemplateColumns,overflowY:s.overflowY};
    }
    return {bodyClass:document.body.className,quality:document.body.dataset.quality,elements:out,source:__R2_REFERENCE_QA__.geometry(),tray:Array.from(document.querySelectorAll('.ballBtn')).map(el=>({type:el.dataset.type,text:el.innerText,selected:el.getAttribute('aria-pressed'),classes:el.className})),palette:Object.fromEntries(['--bg','--panel','--panel2','--line','--text','--muted','--p1','--p2','--accent','--good','--warn','--v132-surface','--v132-surface-2','--v132-text','--v132-muted'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue(k).trim()]))};
  });
}

(async () => {
  const browser = await chromium.launch({ channel:'msedge',headless:true });
  const report = {sourcePath,sourceSha256,sourceBytes:sourceBytes.length,generatedAt:new Date().toISOString(),viewport:{width:1280,height:900},seed:'r2-presentation-reference',method:'Original certified V148 served in an isolated fresh Edge context; response-only read hooks; real UI selection and real pointer aim; no source file edits.',pageErrors:[],screens:[],limitations:['Reference is the original V148 player-vs-AI PC presentation; V149 featured decks are not injected.','Arena layout can vary with map; selected canonical deck and generated map are recorded.','Only browser presentation is measured here; this is not Unity mechanics parity or a balance audit.']};
  try {
    const context = await browser.newContext({viewport:report.viewport,deviceScaleFactor:1});
    const page = await context.newPage();
    page.on('pageerror', e=>report.pageErrors.push(e.message));
    await page.route('https://core-clash-r2-reference.invalid/**',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));
    await page.goto('https://core-clash-r2-reference.invalid/');
    await page.waitForFunction(()=>!!window.__R2_REFERENCE_QA__);
    await page.evaluate(()=>CoreClashTest.setSeed('r2-presentation-reference'));
    async function capture(id) {
      await page.waitForTimeout(160);
      const file = 'r2-reference-'+id+'.png';
      await page.screenshot({path:path.join(evidence,file)});
      const snapshot = await metrics(page);
      report.screens.push({id,file,captureSequence:report.screens.length+1,...snapshot});
      console.log(JSON.stringify({capture:id,source:snapshot.source,app:snapshot.elements['.app'],canvas:snapshot.elements.canvas,controls:snapshot.elements['.controls']}));
    }
    await capture('01-menu');
    await page.locator('[data-mode="pc"]').click();
    await page.locator('#draftOverlay.show').waitFor();
    await capture('02-deck-choice');
    const decks = await page.evaluate(()=>__R2_REFERENCE_QA__.decks());
    const deck = decks.find(d=>d.balls.includes('singularity')&&d.balls.includes('gatekeeper')) || decks.find(d=>d.balls.includes('singularity')) || decks[0];
    report.deck = deck;
    await page.locator('[data-deck-id="'+deck.id+'"]').click();
    await capture('03-deck-selected');
    await page.locator('#draftStart').click();
    await page.waitForFunction(()=>!document.getElementById('draftOverlay').classList.contains('show'));
    await capture('04-gameplay');
    const selectedType = deck.balls.includes('singularity')?'singularity':deck.balls[0];
    await page.locator('.ballBtn[data-type="'+selectedType+'"]').click();
    await capture('05-selected-orb');
    // Original PC affordance is a card long press; the visible "i" is touch-only.
    const cardRect = await page.locator('.ballBtn[data-type="'+selectedType+'"]').boundingBox();
    await page.mouse.move(cardRect.x+cardRect.width/2,cardRect.y+cardRect.height/2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await page.locator('#ballInfoOverlay.show').waitFor();
    await capture('08-ball-details');
    report.detail = await page.evaluate(type=>({source:__R2_REFERENCE_QA__.details(type),rendered:document.querySelector('.ballInfoModal').innerText}),selectedType);
    await page.locator('#ballInfoClose').click();
    const geometry = await page.evaluate(()=>__R2_REFERENCE_QA__.geometry());
    const rect = await page.locator('canvas').boundingBox();
    const origin = {x:rect.x+geometry.pad.x/geometry.W*rect.width,y:rect.y+geometry.pad.y/geometry.H*rect.height};
    const target = {x:origin.x+90/geometry.W*rect.width,y:origin.y-145/geometry.H*rect.height};
    await page.mouse.move(origin.x,origin.y);
    await page.mouse.down();
    await page.mouse.move(target.x,target.y,{steps:8});
    await page.waitForFunction(()=>__R2_REFERENCE_QA__.geometry().dragging);
    await capture('06-aim');
    // Release through the original event path, then capture the input-locked resolution state.
    await page.mouse.up();
    await capture('07-resolving');
    report.screens.sort((a,b)=>a.id.localeCompare(b.id));
    assert.equal(report.screens.find(s=>s.id==='06-aim').source.dragging,true);
    assert.equal(report.screens.find(s=>s.id==='07-resolving').source.phase,'moving');
    report.sourceUnchanged = sha(fs.readFileSync(sourcePath))===sourceSha256;
    report.pass = report.sourceUnchanged && !report.pageErrors.length && report.screens.length===8;
    fs.writeFileSync(path.join(evidence,'r2-reference.json'),JSON.stringify(report,null,2)+'\n');
    assert.equal(report.pass,true,'Reference capture checks failed');
    console.log(JSON.stringify({pass:report.pass,deck:report.deck,pageErrors:report.pageErrors,sourceUnchanged:report.sourceUnchanged}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
