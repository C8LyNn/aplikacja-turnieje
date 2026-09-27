import type { EffectSettings } from "../core/types";
import { getAllEffectDefinitions, getEffectDefinition, getEffectModule } from "../effects/registry";
import {
  applyEffectPreset, beginHistoryTransaction, canRedo, canUndo, clearHistory,
  duplicateEffect, endHistoryTransaction, getEditorState, getRedoLabel,
  getSelectedEffect, getUndoLabel, moveEffectBefore, redo, removeEffect,
  renameEffect, replaceEditorState, rerollAllEffects, rerollEffect, selectEffect,
  subscribe, toggleEffectLocked, undo, updateEffectSeed, updateEffectSettings,
} from "../editor/state";
import { downloadScene, hasRecoveryDraft, loadRecoveryDraft, parseScene, saveRecoveryDraft } from "../scenes/scenes";
import { pack06ScenePresets } from "../scenes/presets";
import { openMediaExport } from "../media/mediaExport";

const FAVORITES_KEY="animated-effects:pack06:favorites";
const USAGE_KEY="animated-effects:pack06:usage";
const RECENT_KEY="animated-effects:pack06:recent";
let installed=false, paused=false, dragged:string|null=null, saveTimer:number|null=null;
const soloIds=new Set<string>();
let copiedSettings:EffectSettings|null=null;

function readJson<T>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
function writeJson(key:string,value:unknown):void{try{localStorage.setItem(key,JSON.stringify(value))}catch{/* disabled */}}
let favorites=new Set(readJson<string[]>(FAVORITES_KEY,[]));
let usage=readJson<Record<string,number>>(USAGE_KEY,{});
let recent=readJson<Record<string,number>>(RECENT_KEY,{});
function track(id:string):void{usage={...usage,[id]:(usage[id]??0)+1};recent={...recent,[id]:Date.now()};writeJson(USAGE_KEY,usage);writeJson(RECENT_KEY,recent)}

function cardDefinition(card:HTMLElement){
  const name=card.querySelector(".ae-effect-card-main strong")?.textContent?.trim();
  return name?getAllEffectDefinitions().find((definition)=>definition.name===name):undefined;
}

function decorateLibrary():void{
  const library=document.querySelector<HTMLElement>("#effect-library"); if(!library)return;
  const state=getEditorState();
  const mode=document.querySelector<HTMLSelectElement>("#pack06-library-mode")?.value??"all";
  const sort=document.querySelector<HTMLSelectElement>("#pack06-library-sort")?.value??"name";
  const cards=Array.from(library.querySelectorAll<HTMLElement>(".ae-effect-card"));
  for(const card of cards){
    if(card.dataset.pack06==="1")continue;
    const definition=cardDefinition(card); if(!definition)continue;
    card.dataset.pack06="1"; card.dataset.effectId=definition.id;
    const instances=state.effects.filter((effect)=>effect.effectId===definition.id);
    const latest=instances.at(-1)??null;
    const latestUnlocked=[...instances].reverse().find((effect)=>!effect.locked)??null;
    card.classList.toggle("is-on-scene",instances.length>0);

    const star=document.createElement("button"); star.type="button"; star.className="ae-pack06-favorite";
    star.textContent=favorites.has(definition.id)?"★":"☆"; star.title="Ulubione";
    star.addEventListener("click",()=>{favorites.has(definition.id)?favorites.delete(definition.id):favorites.add(definition.id);writeJson(FAVORITES_KEY,[...favorites]);refresh()});
    card.prepend(star);

    if(instances.length>0){
      const sub=card.querySelector(".ae-effect-card-subline");
      if(sub){const badge=document.createElement("span");badge.className="ae-pack06-scene-badge";badge.textContent="NA SCENIE";sub.appendChild(badge)}
    }

    const add=card.querySelector<HTMLButtonElement>(".ae-add-icon");
    if(add){
      const actions=document.createElement("div");actions.className="ae-pack06-card-actions";
      if(instances.length>0){
        const minus=document.createElement("button");minus.type="button";minus.className="ae-pack06-minus";minus.textContent="−";
        minus.disabled=!latestUnlocked;minus.title=latestUnlocked?"Usuń ostatnią niezablokowaną instancję":"Wszystkie instancje są zablokowane";
        minus.addEventListener("click",()=>{if(latestUnlocked)removeEffect(latestUnlocked.instanceId)});
        const count=document.createElement("button");count.type="button";count.className="ae-pack06-count";count.textContent=`${instances.length}×`;count.title="Pokaż w Warstwach";
        count.addEventListener("click",()=>{if(!latest)return;selectEffect(latest.instanceId);document.querySelector<HTMLButtonElement>('[data-sidebar-tab="layers"]')?.click();setTimeout(()=>document.querySelector<HTMLElement>(`[data-pack06-instance-id="${latest.instanceId}"]`)?.scrollIntoView({block:"nearest"}),0)});
        actions.append(minus,count);
      }
      add.addEventListener("click",()=>track(definition.id),{capture:true}); actions.appendChild(add);card.appendChild(actions);
    }
  }

  const decorated=Array.from(library.querySelectorAll<HTMLElement>(".ae-effect-card[data-effect-id]"));
  for(const card of decorated){const id=card.dataset.effectId??"";const count=state.effects.filter((effect)=>effect.effectId===id).length;card.hidden=(mode==="favorites"&&!favorites.has(id))||(mode==="scene"&&count===0)}
  decorated.sort((a,b)=>{
    const aId=a.dataset.effectId??"",bId=b.dataset.effectId??"";const ad=getEffectDefinition(aId),bd=getEffectDefinition(bId);if(!ad||!bd)return 0;
    switch(sort){
      case"used":return(usage[bId]??0)-(usage[aId]??0);
      case"recent":return(recent[bId]??0)-(recent[aId]??0);
      case"light":return ad.performanceCost-bd.performanceCost;
      case"heavy":return bd.performanceCost-ad.performanceCost;
      case"category":return ad.category.localeCompare(bd.category)||ad.name.localeCompare(bd.name);
      default:return ad.name.localeCompare(bd.name);
    }
  });
  decorated.forEach((card)=>library.appendChild(card));
}

function decorateLayers():void{
  const rows=Array.from(document.querySelectorAll<HTMLElement>(".ae-layer-row"));
  const instances=[...getEditorState().effects].reverse();
  rows.forEach((row,index)=>{
    const instance=instances[index];if(!instance)return;
    row.dataset.pack06InstanceId=instance.instanceId;
    row.classList.toggle("is-locked",Boolean(instance.locked));row.classList.toggle("is-solo",soloIds.has(instance.instanceId));
    const title=row.querySelector(".ae-layer-copy strong");if(title&&instance.label)title.textContent=instance.label;
    const actions=row.querySelector<HTMLElement>(".ae-layer-actions");if(!actions||actions.dataset.pack06==="1")return;actions.dataset.pack06="1";
    const solo=document.createElement("button");solo.type="button";solo.className="ae-icon-button ae-pack06-solo";solo.textContent="S";solo.title="Solo";
    solo.addEventListener("click",()=>{soloIds.has(instance.instanceId)?soloIds.delete(instance.instanceId):soloIds.add(instance.instanceId);applySolo();refresh()});
    const lock=document.createElement("button");lock.type="button";lock.className="ae-icon-button ae-pack06-lock";lock.textContent=instance.locked?"L":"U";lock.title=instance.locked?"Odblokuj":"Zablokuj";lock.addEventListener("click",()=>toggleEffectLocked(instance.instanceId));
    const dup=document.createElement("button");dup.type="button";dup.className="ae-icon-button ae-pack06-duplicate";dup.textContent="⧉";dup.title="Duplikuj · Shift = zachowaj seed";dup.addEventListener("click",(event)=>duplicateEffect(instance.instanceId,event.shiftKey));
    actions.append(solo,lock,dup);
    for(const selector of [".layer-remove",".layer-up",".layer-down"]){const button=row.querySelector<HTMLButtonElement>(selector);if(button&&instance.locked)button.disabled=true}
    row.querySelector(".ae-layer-select")?.addEventListener("dblclick",()=>{const definition=getEffectDefinition(instance.effectId);const next=window.prompt("Nazwa warstwy:",instance.label??definition?.name??instance.effectId);if(next!==null)renameEffect(instance.instanceId,next)});
    row.draggable=!instance.locked;
    row.addEventListener("dragstart",()=>{if(instance.locked)return;dragged=instance.instanceId;row.classList.add("is-dragging")});
    row.addEventListener("dragend",()=>{dragged=null;row.classList.remove("is-dragging")});
    row.addEventListener("dragover",(event)=>{if(dragged&&!instance.locked)event.preventDefault()});
    row.addEventListener("drop",(event)=>{event.preventDefault();if(dragged)moveEffectBefore(dragged,instance.instanceId)});
  });
}

function applySolo():void{
  const preview=document.querySelector<HTMLElement>("#effect-preview");if(!preview)return;
  preview.classList.toggle("is-pack06-paused",paused);
  preview.querySelectorAll<HTMLElement>(".effect-layer").forEach((layer)=>{const id=layer.dataset.instanceId;layer.style.display=soloIds.size===0||(id&&soloIds.has(id))?"":"none"});
}

function enhanceInspector():void{
  const inspector=document.querySelector<HTMLElement>("#inspector");const selected=getSelectedEffect();if(!inspector||!selected||inspector.querySelector("[data-pack06-inspector]"))return;
  const definition=getEffectDefinition(selected.effectId);if(!definition)return;
  const panel=document.createElement("section");panel.className="inspector-group ae-pack06-inspector";panel.dataset.pack06Inspector="1";
  panel.innerHTML=`<div class="ae-pack06-inspector-title"><strong>Losowość i narzędzia</strong><span>Seed, intensywność i kopiowanie ustawień</span></div>
  <label class="inspector-field"><span class="inspector-label"><span>Seed</span></span><div class="ae-pack06-seed-row"><input type="number" min="0" max="4294967295" value="${selected.seed}" data-pack06-seed><button type="button" class="inspector-field-reset" data-pack06-reroll>Losuj</button></div></label>
  ${definition.capabilities.intensity?`<label class="inspector-field"><span class="inspector-label"><span>Intensywność</span><output data-pack06-intensity-out>${selected.settings.intensity}%</output></span><input type="range" min="0" max="400" value="${selected.settings.intensity}" data-pack06-intensity></label>`:""}
  <div class="ae-pack06-copy-row"><button type="button" class="ae-button ae-button-secondary" data-pack06-copy>Kopiuj ustawienia</button><button type="button" class="ae-button ae-button-secondary" data-pack06-paste ${copiedSettings?"":"disabled"}>Wklej</button></div>`;
  inspector.querySelector(".inspector-title")?.insertAdjacentElement("afterend",panel);
  const seed=panel.querySelector<HTMLInputElement>("[data-pack06-seed]");seed?.addEventListener("change",()=>updateEffectSeed(selected.instanceId,Number(seed.value)));
  panel.querySelector("[data-pack06-reroll]")?.addEventListener("click",()=>rerollEffect(selected.instanceId));
  const intensity=panel.querySelector<HTMLInputElement>("[data-pack06-intensity]");intensity?.addEventListener("input",()=>{const v=Number(intensity.value);const out=panel.querySelector<HTMLOutputElement>("[data-pack06-intensity-out]");if(out)out.value=`${v}%`;updateEffectSettings(selected.instanceId,{intensity:v})});
  panel.querySelector("[data-pack06-copy]")?.addEventListener("click",()=>{copiedSettings=structuredClone(selected.settings);const paste=panel.querySelector<HTMLButtonElement>("[data-pack06-paste]");if(paste)paste.disabled=false});
  panel.querySelector("[data-pack06-paste]")?.addEventListener("click",()=>{if(copiedSettings)updateEffectSettings(selected.instanceId,structuredClone(copiedSettings))});
}

function updateStatus():void{
  const state=getEditorState();const active=state.effects.filter((effect)=>effect.enabled);
  const dom=active.reduce((sum,effect)=>sum+1+(getEffectModule(effect.effectId)?.estimateDomNodes(effect.settings)??0),1);
  const cost=active.reduce((sum,effect)=>sum+(getEffectDefinition(effect.effectId)?.performanceCost??1),0);
  const summary=document.querySelector<HTMLElement>("#pack06-performance");if(summary){summary.textContent=`DOM ~${dom} · koszt ${cost}`;summary.classList.toggle("is-warning",dom>600||cost>24)}
  const ub=document.querySelector<HTMLButtonElement>("#pack06-undo");if(ub){ub.disabled=!canUndo();ub.title=getUndoLabel()?`Cofnij: ${getUndoLabel()}`:"Brak zmian do cofnięcia"}
  const rb=document.querySelector<HTMLButtonElement>("#pack06-redo");if(rb){rb.disabled=!canRedo();rb.title=getRedoLabel()?`Ponów: ${getRedoLabel()}`:"Brak zmian do ponowienia"}
  const rec=document.querySelector<HTMLButtonElement>("#pack06-recover");if(rec)rec.disabled=!hasRecoveryDraft();
  const pb=document.querySelector<HTMLButtonElement>("#pack06-pause");if(pb)pb.textContent=paused?"▶ Wznów":"⏸ Pauza";
}

function refresh():void{decorateLibrary();decorateLayers();enhanceInspector();applySolo();updateStatus()}
function scheduleRecovery():void{if(saveTimer!==null)clearTimeout(saveTimer);saveTimer=window.setTimeout(()=>saveRecoveryDraft(getEditorState()),700)}

function addHeaderUi():void{
  const status=document.querySelector(".ae-header-status");if(status&&!document.querySelector("#pack06-performance")){const span=document.createElement("span");span.id="pack06-performance";span.className="ae-status-pill";status.appendChild(span)}
  const actions=document.querySelector(".ae-header-actions");if(!actions||document.querySelector("#pack06-undo"))return;actions.classList.add("ae-pack06-header-actions");
  const group=document.createElement("div");group.className="ae-pack06-header-group";
  group.innerHTML=`<button id="pack06-undo" class="ae-button ae-button-secondary" type="button">↶</button><button id="pack06-redo" class="ae-button ae-button-secondary" type="button">↷</button><button id="pack06-pause" class="ae-button ae-button-secondary" type="button">⏸ Pauza</button>
  <select id="pack06-preset" class="ae-category-select"><option value="">Preset sceny…</option>${pack06ScenePresets.map((preset)=>`<option value="${preset.id}">${preset.name}</option>`).join("")}</select>
  <button id="pack06-save" class="ae-button ae-button-secondary" type="button">Zapisz scenę</button><button id="pack06-load" class="ae-button ae-button-secondary" type="button">Wczytaj</button><button id="pack06-recover" class="ae-button ae-button-secondary" type="button">Autozapis</button><button id="pack06-reroll-all" class="ae-button ae-button-secondary" type="button">🎲 Seedy</button><button id="pack06-media" class="ae-button ae-button-secondary" type="button">PNG / GIF</button>`;
  actions.prepend(group);
  document.querySelector("#pack06-undo")?.addEventListener("click",()=>undo());document.querySelector("#pack06-redo")?.addEventListener("click",()=>redo());
  document.querySelector("#pack06-pause")?.addEventListener("click",()=>{paused=!paused;applySolo();updateStatus()});
  document.querySelector("#pack06-reroll-all")?.addEventListener("click",()=>rerollAllEffects());document.querySelector("#pack06-media")?.addEventListener("click",()=>openMediaExport());
  const preset=document.querySelector<HTMLSelectElement>("#pack06-preset");preset?.addEventListener("change",()=>{const p=pack06ScenePresets.find((item)=>item.id===preset.value);if(p){applyEffectPreset(p.effects,`Preset: ${p.name}`);preset.value=""}});
  document.querySelector("#pack06-save")?.addEventListener("click",()=>downloadScene(getEditorState()));
  document.querySelector("#pack06-load")?.addEventListener("click",()=>document.querySelector<HTMLInputElement>("#pack06-file-input")?.click());
  document.querySelector("#pack06-recover")?.addEventListener("click",()=>{const recovered=loadRecoveryDraft(getEditorState());if(recovered)replaceEditorState(recovered,"Przywróć autozapis")});
}

function addLibraryUi():void{
  const filters=document.querySelector(".ae-effect-filters");if(!filters||document.querySelector("#pack06-library-mode"))return;
  const mode=document.createElement("select");mode.id="pack06-library-mode";mode.className="ae-category-select";mode.innerHTML='<option value="all">Wszystkie</option><option value="favorites">★ Ulubione</option><option value="scene">● Na scenie</option>';
  const sort=document.createElement("select");sort.id="pack06-library-sort";sort.className="ae-category-select";sort.innerHTML='<option value="name">Nazwa</option><option value="category">Kategoria</option><option value="used">Najczęściej używane</option><option value="recent">Ostatnio używane</option><option value="light">Najlżejsze</option><option value="heavy">Najcięższe</option>';
  mode.addEventListener("change",refresh);sort.addEventListener("change",refresh);filters.append(mode,sort);
}

function addFileInput():void{
  if(document.querySelector("#pack06-file-input"))return;const input=document.createElement("input");input.id="pack06-file-input";input.type="file";input.accept=".json,.aescene.json,application/json";input.hidden=true;
  input.addEventListener("change",async()=>{const file=input.files?.[0];if(!file)return;try{const parsed=parseScene(await file.text(),getEditorState());replaceEditorState(parsed.state,`Wczytaj: ${parsed.name}`);if(parsed.warnings.length)window.alert(["Scena wczytana z ostrzeżeniami:","",...parsed.warnings.slice(0,12)].join("\n"))}catch(error){window.alert(error instanceof Error?error.message:String(error))}finally{input.value=""}});
  document.body.appendChild(input);
}

function installKeyboard():void{document.addEventListener("keydown",(event)=>{const t=event.target;if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)return;if(event.ctrlKey&&!event.shiftKey&&event.key.toLowerCase()==="z"){event.preventDefault();undo();return}if((event.ctrlKey&&event.key.toLowerCase()==="y")||(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==="z")){event.preventDefault();redo()}})}
function installSliderBatching():void{
  const inspector=document.querySelector("#inspector");if(!inspector)return;let active=false;
  inspector.addEventListener("pointerdown",(event)=>{const t=event.target;if(t instanceof HTMLInputElement&&t.type==="range"){active=true;beginHistoryTransaction("Zmień parametr")}});
  const finish=()=>{if(!active)return;active=false;endHistoryTransaction()};window.addEventListener("pointerup",finish);window.addEventListener("pointercancel",finish);
}

export function installPack06():void{
  if(installed)return;installed=true;addHeaderUi();addLibraryUi();addFileInput();installKeyboard();installSliderBatching();clearHistory();
  subscribe(()=>{queueMicrotask(refresh);scheduleRecovery()});refresh();
}
