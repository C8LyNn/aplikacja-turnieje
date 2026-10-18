// Reproducible presentation-only derivative. The certified V148 input is read-only.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');

const root = path.resolve(__dirname, '..');
const sourcePath = process.env.CORE_CLASH_V148_SOURCE || 'C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html';
const sourceSha256 = 'bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e';
const outputPath = path.join(root, 'Legacy/core_clash_v149_legacy_presentation.html');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const bytes = fs.readFileSync(sourcePath);
assert.equal(sha256(bytes), sourceSha256, 'Certified V148 source hash mismatch; refusing to generate');
const source = bytes.toString('utf8');
const dataBytes = fs.readFileSync(path.join(root, 'Assets/Resources/Data/featured-decks.json'));
const data = JSON.parse(dataBytes);
assert.equal(data.version, 'V149');
assert.equal(data.decks.length, 4);
assert.equal(new Set(data.decks.map(d => d.id)).size, 4);
for (const deck of data.decks) {
  assert.match(deck.id, /^featured_[a-z_]+$/);
  assert.equal(deck.provisional, true, 'Featured decks must remain provisional');
  assert.equal(typeof deck.name, 'string');
  assert.equal(deck.balls.length, 9);
  assert.equal(new Set(deck.balls).size, 9);
  for (const id of deck.balls) assert.match(id, /^[a-z0-9]+$/);
}
assert.equal(new Set(data.decks.flatMap(d => d.balls)).size, 36);

const oldTitle = '<title>Core Clash — V148 Presentation Candidate (A33)</title>';
const newTitle = '<title>Core Clash — V149 HTML LEGACY / PRESENTATION</title>';
const css = `
<!-- V149_LEGACY_PRESENTATION_STYLE_BEGIN -->
<style>
.v149-legacy-note{margin:8px 0 12px;padding:9px 11px;border:1px solid #47617a;border-radius:10px;background:#102233;color:#c7d6e7;font:11px/1.45 system-ui,sans-serif}
.v149-legacy-note strong{display:block;color:#b8e9ff;font-size:11px;letter-spacing:.04em}
.v149-featured{margin:8px 0 10px;padding:8px;border:1px solid #44647c;border-radius:10px;background:#102333;color:#c9dce9}
.v149-featured summary{cursor:pointer;font:700 10px/1.4 system-ui,sans-serif;letter-spacing:.04em;color:#aeeaff}
.v149-featured p{margin:5px 0;font:10px/1.4 system-ui,sans-serif}
.v149-featured-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:7px 0}
.v149-featured-btn{min-width:0;min-height:44px;padding:7px;border:1px solid #36526b;border-radius:7px;background:#162d40;color:#e2edf4;text-align:left;font:700 10px/1.3 system-ui,sans-serif;cursor:pointer}
.v149-featured-btn small{display:block;color:#a9c3d8;font-size:9px;font-weight:400;margin-top:3px}
.v149-featured-btn[aria-pressed="true"]{border-color:#8aeac1;background:#1c443f}
.v149-featured-btn:focus-visible,.v149-featured summary:focus-visible{outline:2px solid #b5f6ff;outline-offset:2px}
.v149-hero{margin:12px 0;padding:14px;border:1px solid #746239;border-radius:16px;background:linear-gradient(160deg,#292819,#0b202e);color:#dcecf4}
.v149-hero h2{margin:0 0 6px;font:800 21px/1.15 system-ui,sans-serif;color:#fff1bf}
.v149-hero>p{margin:0 0 12px;color:#b4c6ce;font:11px/1.5 system-ui,sans-serif}
.v149-hero-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.v149-hero-card{min-width:0;min-height:132px;padding:11px;border:1px solid #74643d;border-radius:11px;background:#122a35;color:#e6f2f7;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:6px}
.v149-hero-card strong{font:800 12px/1.2 system-ui,sans-serif;color:#ffe29b}
.v149-hero-card small{font:10px/1.4 system-ui,sans-serif;color:#adc4d0}
.v149-hero-card em{margin-top:auto;font:700 9px/1.4 system-ui,sans-serif;color:#ffe29b;font-style:normal}
.v149-hero-icons{display:flex;gap:2px;flex-wrap:wrap}
.v149-hero-icons span{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1px solid #a0b7c6;color:#081722;font:700 7px/1 system-ui,sans-serif}
.v149-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.v149-quick-btn{min-height:78px;padding:12px;border:1px solid #46758c;border-radius:12px;background:#123347;color:#e7f8ff;text-align:left;cursor:pointer}
.v149-quick-btn strong{display:block;font:800 16px/1.2 system-ui,sans-serif}
.v149-quick-btn small{display:block;margin-top:5px;font:11px/1.4 system-ui,sans-serif;color:#a6c6d8}
.v149-hero-card:hover,.v149-quick-btn:hover{border-color:#ffdc85;background:#1a3c4a}
.v149-hero-card:focus-visible,.v149-quick-btn:focus-visible,#v149LegacyAdvanced>summary:focus-visible{outline:2px solid #b5f6ff;outline-offset:3px}
#v149LegacyAdvanced{margin:14px 0 0;border-top:1px solid #365367}
#v149LegacyAdvanced>summary{padding:14px 2px;color:#a9c6d8;font:700 11px/1.4 system-ui,sans-serif;cursor:pointer}
@media(max-width:760px){.v149-hero-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v149-hero-card{min-height:140px}}
@media(max-width:440px){.v149-hero{padding:10px}.v149-hero-grid{grid-template-columns:1fr}.v149-hero-card{min-height:100px}.v149-quick-grid{grid-template-columns:1fr}}
@media(min-width:1000px){body.ui-pc .presetBlock:has(> #v149FeaturedDecks){grid-template-rows:auto auto minmax(0,1fr)!important}}
</style>
<!-- V149_LEGACY_PRESENTATION_STYLE_END -->
`;
const note = `
<!-- V149_LEGACY_PRESENTATION_NOTICE_BEGIN -->
<div class="v149-legacy-note" id="v149LegacyNotice"><strong>V149 HTML LEGACY / PRESENTATION</strong>Lokalnie / offline · niezależny hosting HTML. Bez zgodności sieciowej z V149 UNITY. Rozgrywka V148; talie CLASS DEMO / FEATURED są pokazowe, bez certyfikacji balansu.</div>
<!-- V149_LEGACY_PRESENTATION_NOTICE_END -->
`;
const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const quickMenu = `
<!-- V149_LEGACY_QUICKPLAY_MENU_BEGIN -->
<section class="v149-hero" id="v149LegacyHero" aria-labelledby="v149LegacyHeroTitle">
  <h2 id="v149LegacyHeroTitle">Wybierz talię i zagraj z AI</h2>
  <p>CLASS DEMO / FEATURED · 4 talie pokazowe po 9 istniejących kulek. Kliknięcie otwiera gotowy wybór przed startem meczu. Bez certyfikacji balansu.</p>
  <div class="v149-hero-grid">${data.decks.map(deck=>`<button type="button" class="v149-hero-card" data-legacy-featured="${escapeHtml(deck.id)}" aria-label="Wybierz ${escapeHtml(deck.name)} do meczu z AI"><strong>${escapeHtml(deck.name)}</strong><small>${escapeHtml(deck.description.replace(/^.*?not balance-certified\.\s*/,''))}</small><span class="v149-hero-icons" data-legacy-icons="${escapeHtml(deck.id)}" aria-hidden="true"></span><em>Wybierz 9/9 →</em></button>`).join('')}</div>
</section>
<div class="v149-quick-grid" aria-label="Szybki wybór trybu">
  <button type="button" class="v149-quick-btn" data-legacy-play="ai"><strong>Gracz vs AI</strong><small>Wybierz talię pokazową, jedną z 36 kanonicznych lub własny skład.</small></button>
  <button type="button" class="v149-quick-btn" data-legacy-play="local"><strong>PvP lokalne</strong><small>2 osoby · 1 urządzenie · osobne talie · przekazanie tury.</small></button>
</div>
<details id="v149LegacyAdvanced"><summary>Zaawansowane opcje V148 · układ ekranu · laboratorium</summary>
<!-- V149_LEGACY_QUICKPLAY_MENU_END -->
`;
const advancedClose='<!-- V149_LEGACY_ADVANCED_END -->\n</details>\n';
// This additive block lives in the original closure so its buttons use the exact
// draftSelection -> renderDraft -> beginMatchFromDraft flow used by custom decks.
// No canonical array, resolver, physics, rule, or original function is replaced.
const featureScript = `
  // V149_LEGACY_PRESENTATION_SCRIPT_BEGIN
  const V149_FEATURED_DECKS=Object.freeze(${JSON.stringify(data.decks).replace(/</g, '\\u003c')}.map(d=>Object.freeze({...d,balls:Object.freeze(d.balls)})));
  for(const d of V149_FEATURED_DECKS){
    if(d.balls.some(id=>!SPECIAL_TYPE_KEYS.includes(id)))throw new Error('Unknown CLASS DEMO / FEATURED ball: '+d.id);
  }
  const v149FeaturedSection=document.createElement('details');
  v149FeaturedSection.id='v149FeaturedDecks';
  v149FeaturedSection.className='v149-featured';
  v149FeaturedSection.open=true;
  v149FeaturedSection.innerHTML='<summary>V149 HTML LEGACY / PRESENTATION · CLASS DEMO / FEATURED</summary><p>4 talie pokazowe · po 9 istniejących kulek · bez certyfikacji balansu.</p><div class="v149-featured-grid"></div><p id="v149FeaturedSelection" role="status" aria-live="polite"></p>';
  presetDecksEl.before(v149FeaturedSection);
  const v149FeaturedButtons=[];
  function v149SelectedFeatured(){
    return V149_FEATURED_DECKS.find(d=>draftSelection.length===9&&d.balls.every(id=>draftSelection.includes(id)))||null;
  }
  function v149RefreshFeaturedSelection(){
    const selected=v149SelectedFeatured();
    for(const [id,button] of v149FeaturedButtons)button.setAttribute('aria-pressed',String(id===selected?.id));
    document.getElementById('v149FeaturedSelection').textContent=selected?'CLASS DEMO / FEATURED: '+selected.name+' · 9/9 · bez certyfikacji balansu.':'Dodatkowy wybór pokazowy. 36 talii kanonicznych i kreator pozostają dostępne.';
  }
  for(const deck of V149_FEATURED_DECKS){
    const button=document.createElement('button');
    button.type='button';
    button.className='v149-featured-btn';
    button.dataset.featuredDeckId=deck.id;
    button.title=deck.description+' '+deck.balls.map(id=>TYPES[id].name).join(', ');
    button.textContent=deck.name;
    const caption=document.createElement('small');
    caption.textContent='CLASS DEMO / FEATURED · 9 kulek';
    button.append(caption);
    button.onclick=()=>{
      draftSelection=[...deck.balls];
      draftFamilyFilter='all';
      draftArchetypeFilter='all';
      touchDraftView='presets';
      mobileTick(8);
      renderDraft();
      v149RefreshFeaturedSelection();
    };
    v149FeaturedSection.querySelector('.v149-featured-grid').append(button);
    v149FeaturedButtons.push([deck.id,button]);
  }
  // Observe the existing UI render; do not wrap or modify its functions.
  new MutationObserver(v149RefreshFeaturedSelection).observe(draftSelectedEl,{childList:true});
  v149RefreshFeaturedSelection();
  function v149OpenOriginalMode(local=false){
    const mode=window.innerWidth>=900?'pc':(window.innerWidth>=620?'tablet':'phone');
    const attr=local?'data-localpvp-mode':'data-mode';
    interfaceModeOverlay.querySelector('['+attr+'="'+mode+'"]').click();
  }
  for(const button of interfaceModeOverlay.querySelectorAll('[data-legacy-play]')){
    button.addEventListener('click',()=>v149OpenOriginalMode(button.dataset.legacyPlay==='local'));
  }
  for(const button of interfaceModeOverlay.querySelectorAll('[data-legacy-featured]')){
    const deck=V149_FEATURED_DECKS.find(d=>d.id===button.dataset.legacyFeatured);
    button.addEventListener('click',()=>{
      v149OpenOriginalMode();
      draftSelection=[...deck.balls];
      draftFamilyFilter='all';
      draftArchetypeFilter='all';
      touchDraftView='presets';
      renderDraft();
      v149RefreshFeaturedSelection();
      mobileTick(10);
    });
    const icons=button.querySelector('[data-legacy-icons]');
    for(const id of deck.balls){
      const icon=document.createElement('span');
      icon.style.background=TYPES[id].color;
      icon.textContent=TYPE_MARKS[id]||'•';
      icons.append(icon);
    }
  }
  window.__CC_V149_LEGACY_PRESENTATION__=Object.freeze({
    version:'V149 HTML LEGACY / PRESENTATION',
    sourceVersion:'V148',sourceSha256:'${sourceSha256}',
    unityNetworkCompatible:false,balanceCertified:false,
    listFeaturedDecks:()=>V149_FEATURED_DECKS.map(d=>({...d,balls:[...d.balls]})),
    selectedFeaturedDeck:()=>v149SelectedFeatured()?.id||null
  });
  // V149_LEGACY_PRESENTATION_SCRIPT_END

`;

function replaceOnce(text, target, replacement) {
  assert.equal(text.split(target).length, 2, 'Expected exactly one injection anchor: '+target.slice(0, 80));
  return text.replace(target, () => replacement);
}
const menuAnchor = '    <h1 id="interfaceModeTitle">Menu główne</h1>';
const scriptAnchor = '  loadCustomDecks();';
const quickMenuAnchor='    <div class="qualityModeBox" aria-label="Jakość grafiki">';
const advancedCloseAnchor='  </section>\n</div>\n\n\n<div class="localPassOverlay"';
let html = replaceOnce(source, oldTitle, newTitle);
html = replaceOnce(html, '</head>', css+'</head>');
html = replaceOnce(html, menuAnchor, menuAnchor+note);
html = replaceOnce(html, quickMenuAnchor, quickMenu+quickMenuAnchor);
html = replaceOnce(html, advancedCloseAnchor, advancedClose+advancedCloseAnchor);
html = replaceOnce(html, scriptAnchor, featureScript+scriptAnchor);

// Removing ONLY our additive presentation edits must recreate every certified byte.
let restored = replaceOnce(html, featureScript, '');
restored = replaceOnce(restored, quickMenu, '');
restored = replaceOnce(restored, advancedClose, '');
restored = replaceOnce(restored, note, '');
restored = replaceOnce(restored, css, '');
restored = replaceOnce(restored, newTitle, oldTitle);
assert.equal(sha256(Buffer.from(restored)), sourceSha256, 'Original gameplay/source preservation failed');
fs.mkdirSync(path.dirname(outputPath), {recursive:true});
fs.mkdirSync(path.join(root, 'Evidence'), {recursive:true});
fs.writeFileSync(outputPath, html);
const manifest = {
  version:'V149 HTML LEGACY / PRESENTATION',
  sourceSha256,sourceBytes:bytes.length,featuredDataSha256:sha256(dataBytes),
  outputSha256:sha256(html),outputBytes:Buffer.byteLength(html),
  sourceRestorationSha256:sha256(restored),originalSourcePreserved:true,
  canonicalGameplayChanges:0,canonicalDeckChanges:0,featuredDeckCount:4,featuredBallCount:36,
  balanceCertified:false,unityNetworkCompatible:false,
  modifications:['document title','additive menu notice','additive scoped CSS','additive featured selection block','additive QuickPlay hero and AI/local shortcuts','additive advanced options disclosure'],
};
fs.writeFileSync(path.join(root, 'Evidence/legacy-manifest.json'), JSON.stringify(manifest,null,2)+'\n');
console.log('Generated '+outputPath+' ('+manifest.outputBytes+' bytes); certified source preserved.');

async function verify() {
  const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const qa=`\nwindow.__LEGACY_QA__={roster:()=>Object.keys(TYPES),specials:()=>[...SPECIAL_TYPE_KEYS],canonical:()=>DEFAULT_DECKS.map(d=>JSON.parse(JSON.stringify(d))),draft:()=>[...draftSelection],custom:()=>JSON.parse(JSON.stringify(customDecks)),loadout:()=>[...playerLoadout],cpuLoadout:()=>[...cpuLoadout],mode:()=>gameMode,started:()=>matchStarted,phase:()=>state.phase};\n`;
  function instrument(text) {
    const ix=text.lastIndexOf('})();');
    assert.ok(ix>0);
    return text.slice(0,ix)+qa+text.slice(ix);
  }
  const errors=[];
  const results={...manifest,verificationDate:new Date().toISOString(),regression:{},featuredSelections:[],pageErrors:errors};
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://core-clash-legacy.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:instrument(route.request().url().endsWith('/original')?source:html)}));
    await page.goto('https://core-clash-legacy.invalid/original');
    await page.waitForFunction(()=>!!window.__LEGACY_QA__);
    const baseline=await page.evaluate(()=>({roster:__LEGACY_QA__.roster(),specials:__LEGACY_QA__.specials(),canonical:__LEGACY_QA__.canonical(),rules:CoreClashTest.getRules()}));
    await page.goto('https://core-clash-legacy.invalid/presentation');
    await page.waitForFunction(()=>!!window.__CC_V149_LEGACY_PRESENTATION__);
    assert.equal(await page.title(),'Core Clash — V149 HTML LEGACY / PRESENTATION');
    const derived=await page.evaluate(()=>({roster:__LEGACY_QA__.roster(),specials:__LEGACY_QA__.specials(),canonical:__LEGACY_QA__.canonical(),rules:CoreClashTest.getRules()}));
    assert.deepEqual(derived,baseline,'Roster, canonical decks or rules differ from certified input');
    assert.equal(derived.canonical.length,36);
    results.rosterCount=derived.roster.length;
    results.specialRosterCount=derived.specials.length;
    results.canonicalDeckCount=derived.canonical.length;
    results.rosterCanonicalRulesMatchOriginal=true;
    results.regression=await page.evaluate(()=>__CC_V148_RUNTIME__.existingRegression());
    for(const [name,total] of [['self',30],['r2',36],['r3',26]]) {
      assert.equal(results.regression[name].ok,true,name+' regression failed');
      assert.equal(results.regression[name].passed,total);
      assert.equal(results.regression[name].total,total);
    }
    // Fresh page keeps verification of the normal UI independent of runtime test mutations.
    await page.reload();
    assert.equal(await page.locator('[data-legacy-play="ai"]').count(),1,'AI QuickPlay shortcut is missing');
    assert.equal(await page.locator('[data-legacy-play="local"]').count(),1,'Local PvP QuickPlay shortcut is missing');
    assert.equal(await page.locator('#v149LegacyAdvanced').evaluate(el=>el.open),false,'Advanced tools should start collapsed');
    assert.equal(await page.locator('#v149LegacyAdvanced [data-mode]').count(),3,'Original AI layout choices must remain available');
    for(const deck of data.decks){
      await page.locator('[data-legacy-featured="'+deck.id+'"]').click();
      assert.deepEqual(await page.evaluate(()=>__LEGACY_QA__.draft()),deck.balls);
      assert.equal(await page.evaluate(()=>__LEGACY_QA__.mode()),'human');
      assert.equal(await page.locator('#draftStart').isEnabled(),true);
      await page.locator('#changeInterfaceBtn').click();
    }
    results.menuFeaturedSelections=4;
    await page.locator('#v149LegacyAdvanced>summary').click();
    assert.equal(await page.locator('[data-mode="pc"]').isVisible(),true);
    await page.locator('#v149LegacyAdvanced>summary').click();
    results.advancedOptionsAccessible=true;
    await page.locator('[data-legacy-play="ai"]').click();
    assert.equal(await page.evaluate(()=>__LEGACY_QA__.mode()),'human');
    assert.equal(await page.locator('#draftOverlay').getAttribute('aria-hidden'),'false');
    results.quickPlayAi=true;
    for(const deck of baseline.canonical){
      await page.locator('[data-deck-id="'+deck.id+'"]').click();
      assert.deepEqual(await page.evaluate(()=>__LEGACY_QA__.draft()),deck.balls);
      // Each original family filter remains usable after a previous preset narrowed the list.
      await page.locator('[data-family="all"]').click();
    }
    results.canonicalPresetSelections=36;
    results.canonicalPresetSelectionPreserved=true;
    for(const deck of data.decks) {
      await page.locator('[data-featured-deck-id="'+deck.id+'"]').click();
      const selection=await page.evaluate(()=>({balls:__LEGACY_QA__.draft(),selected:__CC_V149_LEGACY_PRESENTATION__.selectedFeaturedDeck(),ready:!document.getElementById('draftStart').disabled,canonical:CoreClashTest.listDecks().filter(d=>d.id!=='basic_only').length}));
      assert.deepEqual(selection.balls,deck.balls);
      assert.equal(selection.selected,deck.id);
      assert.equal(selection.ready,true);
      assert.equal(selection.canonical,36);
      assert.equal(await page.locator('[data-featured-deck-id="'+deck.id+'"]').getAttribute('aria-pressed'),'true');
      results.featuredSelections.push({id:deck.id,...selection});
    }
    await page.locator('#deckBuilderOpen').click();
    assert.equal(await page.locator('#deckBuilderCount').textContent(),'9/9');
    await page.locator('#deckBuilderName').fill('Legacy verification custom');
    await page.locator('#deckBuilderSave').click();
    const custom=await page.evaluate(()=>__LEGACY_QA__.custom());
    assert.equal(custom.length,1);
    assert.deepEqual(custom[0].balls,data.decks[3].balls);
    assert.equal(await page.locator('#deckBuilderOverlay').getAttribute('aria-hidden'),'true');
    results.builderSavePreserved=true;
    // Assert the existing Start button passes the selected IDs into the real player loadout.
    await page.locator('#draftStart').click();
    await page.waitForFunction(()=>!document.getElementById('draftOverlay').classList.contains('show'));
    assert.deepEqual(await page.evaluate(()=>__LEGACY_QA__.loadout()),['normal',...data.decks[3].balls]);
    results.existingStartFlowPreserved=true;
    await page.reload();
    await page.locator('[data-legacy-play="local"]').click();
    assert.equal(await page.evaluate(()=>__LEGACY_QA__.mode()),'localpvp');
    await page.locator('[data-featured-deck-id="'+data.decks[0].id+'"]').click();
    await page.locator('#draftStart').click();
    assert.equal(await page.locator('#localPassOverlay').getAttribute('aria-hidden'),'false');
    await page.locator('#localPassReady').click();
    await page.locator('[data-featured-deck-id="'+data.decks[1].id+'"]').click();
    await page.locator('#draftStart').click();
    await page.locator('#localPassReady').click();
    assert.equal(await page.evaluate(()=>__LEGACY_QA__.started()),true);
    assert.equal(await page.evaluate(()=>__LEGACY_QA__.phase()),'aim');
    assert.deepEqual(await page.evaluate(()=>__LEGACY_QA__.loadout()),['normal',...data.decks[0].balls]);
    assert.deepEqual(await page.evaluate(()=>__LEGACY_QA__.cpuLoadout()),['normal',...data.decks[1].balls]);
    results.quickPlayLocalPvpSeparateDecks=true;
    await page.reload();
    await page.screenshot({path:path.join(root,'Evidence/legacy-quickplay-menu.png')});
    await page.locator('[data-legacy-play="ai"]').click();
    await page.locator('[data-featured-deck-id="'+data.decks[0].id+'"]').click();
    await page.locator('#v149FeaturedDecks').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(root,'Evidence/legacy-presentation.png')});
    const mobileContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const mobile=await mobileContext.newPage();
    mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.route('https://core-clash-legacy.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:instrument(html)}));
    await mobile.goto('https://core-clash-legacy.invalid/presentation');
    assert.equal(await mobile.locator('#v149LegacyAdvanced').evaluate(el=>el.open),false);
    assert.equal(await mobile.locator('#v149LegacyHero').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,'QuickPlay hero overflows phone layout');
    await mobile.screenshot({path:path.join(root,'Evidence/legacy-quickplay-menu-phone.png')});
    await mobile.locator('[data-legacy-featured="'+data.decks[0].id+'"]').click();
    assert.deepEqual(await mobile.evaluate(()=>__LEGACY_QA__.draft()),data.decks[0].balls);
    assert.equal(await mobile.locator('body').evaluate(el=>el.classList.contains('ui-phone')),true);
    for(const deck of data.decks) {
      const button=mobile.locator('[data-featured-deck-id="'+deck.id+'"]').first();
      await button.click();
      assert.deepEqual(await mobile.evaluate(()=>__LEGACY_QA__.draft()),deck.balls);
    }
    results.phoneFeaturedSelections=4;
    const overflow=await mobile.locator('#v149FeaturedDecks').evaluate(el=>el.scrollWidth>el.clientWidth+1);
    assert.equal(overflow,false,'Featured section overflows the phone layout');
    results.phoneFeaturedNoHorizontalOverflow=true;
    await mobile.locator('#v149FeaturedDecks').scrollIntoViewIfNeeded();
    await mobile.screenshot({path:path.join(root,'Evidence/legacy-presentation-phone.png')});
    await mobile.locator('#changeInterfaceBtn').click();
    await mobile.locator('[data-legacy-play="local"]').click();
    assert.equal(await mobile.evaluate(()=>__LEGACY_QA__.mode()),'localpvp');
    assert.equal(await mobile.locator('body').evaluate(el=>el.classList.contains('ui-phone')),true);
    results.phoneQuickPlayLocalPvp=true;
    // Open the actual output file with HTTP(S) requests blocked, without QA instrumentation.
    const filePage=await context.newPage();
    const offlineRequests=[];
    filePage.on('pageerror',e=>errors.push(e.message));
    filePage.on('request',request=>{if(/^https?:/.test(request.url()))offlineRequests.push(request.url());});
    await filePage.route(/^https?:\/\//,route=>route.abort());
    await filePage.goto(pathToFileURL(outputPath).href);
    await filePage.locator('[data-legacy-featured="'+data.decks[0].id+'"]').click();
    assert.equal(await filePage.evaluate(()=>__CC_V149_LEGACY_PRESENTATION__.selectedFeaturedDeck()),data.decks[0].id);
    await filePage.locator('#draftStart').click();
    await filePage.waitForFunction(()=>!document.getElementById('draftOverlay').classList.contains('show'));
    results.actualFileOfflineSmokePassed=true;
    assert.deepEqual(offlineRequests,[],'Offline QuickPlay unexpectedly requested the network');
    results.actualFileOfflineNetworkRequests=offlineRequests.length;
    assert.deepEqual(errors,[]);
    assert.equal(sha256(fs.readFileSync(sourcePath)),sourceSha256);
    results.sourceUnchangedAfterVerification=true;
    results.ok=true;
    fs.writeFileSync(path.join(root,'Evidence/legacy-verification.json'),JSON.stringify(results,null,2)+'\n');
    console.log('Verified: regression 30/30 + 36/36 + 26/26; roster '+results.rosterCount+' ('+results.specialRosterCount+' selectable specials); all 36 canonical presets; QuickPlay AI/local PvP + 4 menu decks; featured selections 4 desktop + 4 phone; builder + Start flow; actual file offline smoke with 0 network requests; no page errors.');
  } finally { await browser.close(); }
}
if(process.argv.includes('--verify'))verify().catch(error=>{console.error(error);process.exitCode=1;});
