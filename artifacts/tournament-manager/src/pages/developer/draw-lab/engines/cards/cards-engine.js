(function(global){
  "use strict";

  const VERSION = "TDS-1.0";
  const LIMITS = Object.freeze({
    participantsMin: 2,
    participantsMax: 128,
    groupsMin: 2,
    groupsMax: 16
  });

  const FORMATS = Object.freeze({
    elimination: "elimination",
    groups: "groups",
    swiss: "swiss"
  });

  const PACES = Object.freeze(["auto","show","fast","turbo"]);

  function clamp(value,min,max){
    return Math.max(min,Math.min(max,value));
  }

  function nextPowerOfTwo(n){
    let p=1;
    while(p<n)p*=2;
    return Math.max(2,Math.min(128,p));
  }

  function normalizeConfig(input){
    const participantCount=clamp(
      Number(input?.participantCount)||8,
      LIMITS.participantsMin,
      LIMITS.participantsMax
    );
    const format=Object.values(FORMATS).includes(input?.format)
      ? input.format
      : FORMATS.elimination;
    const groupCount=clamp(
      Number(input?.groupCount)||4,
      LIMITS.groupsMin,
      Math.min(LIMITS.groupsMax,participantCount)
    );
    const pace=PACES.includes(input?.pace)?input.pace:"auto";
    const seed=String(input?.seed||"").trim();

    return {participantCount,format,groupCount,pace,seed};
  }

  function groupName(index){
    return index<26?String.fromCharCode(65+index):`G${index+1}`;
  }

  function chooseByePositions(size,participants){
    const byes=size-participants;
    const matchCount=size/2;
    const result=new Set();
    if(byes<=0)return result;

    for(let i=0;i<byes;i++){
      let matchIndex=Math.floor((i+.5)*matchCount/byes);
      matchIndex=Math.max(0,Math.min(matchCount-1,matchIndex));
      let probe=0;

      while(probe<matchCount){
        const m=(matchIndex+probe)%matchCount;
        const top=m*2,bottom=top+1;
        if(!result.has(top)&&!result.has(bottom)){
          result.add(i%2===0?top:bottom);
          break;
        }
        probe++;
      }
    }
    return result;
  }

  function eliminationMeta(participantCount){
    const size=nextPowerOfTwo(participantCount);
    const byes=chooseByePositions(size,participantCount);
    const positions=[];
    for(let i=0;i<size;i++){
      if(!byes.has(i))positions.push(i+1);
    }
    return {
      bracketSize:size,
      byeCount:byes.size,
      byePositions:[...byes].map(v=>v+1),
      participantPositions:positions
    };
  }

  function buildAssignmentPlan(input){
    const config=normalizeConfig(input);
    const plan=[];

    if(config.format===FORMATS.groups){
      for(let i=0;i<config.participantCount;i++){
        const group=i%config.groupCount;
        const position=Math.floor(i/config.groupCount)+1;
        plan.push({
          drawIndex:i,
          drawOrder:i+1,
          format:FORMATS.groups,
          group,
          groupName:groupName(group),
          groupPosition:position,
          label:`Grupa ${groupName(group)} · miejsce ${position}`
        });
      }
      return plan;
    }

    if(config.format===FORMATS.swiss){
      for(let i=0;i<config.participantCount;i++){
        const pairing=Math.floor(i/2)+1;
        const side=i%2===0?"A":"B";
        plan.push({
          drawIndex:i,
          drawOrder:i+1,
          format:FORMATS.swiss,
          round:1,
          pairing,
          side,
          label:`Para ${pairing} · ${side}`
        });
      }
      return plan;
    }

    const meta=eliminationMeta(config.participantCount);
    for(let i=0;i<config.participantCount;i++){
      const bracketPosition=meta.participantPositions[i];
      plan.push({
        drawIndex:i,
        drawOrder:i+1,
        format:FORMATS.elimination,
        bracketSize:meta.bracketSize,
        bracketPosition,
        label:`Pozycja drabinki ${bracketPosition}`
      });
    }
    return plan;
  }

  function formatMeta(input){
    const config=normalizeConfig(input);

    if(config.format===FORMATS.groups){
      const minSize=Math.floor(config.participantCount/config.groupCount);
      const maxSize=Math.ceil(config.participantCount/config.groupCount);
      return {
        format:config.format,
        groupCount:config.groupCount,
        minGroupSize:minSize,
        maxGroupSize:maxSize
      };
    }

    if(config.format===FORMATS.swiss){
      return {
        format:config.format,
        round:1,
        pairCount:Math.ceil(config.participantCount/2),
        byeCount:config.participantCount%2
      };
    }

    return {format:config.format,...eliminationMeta(config.participantCount)};
  }

  function participantId(index){
    return `P${String(index+1).padStart(3,"0")}`;
  }

  function buildResultEnvelope({
    engineId,
    engineVersion,
    config,
    participants,
    order,
    engineData={}
  }){
    const normalized=normalizeConfig({
      ...config,
      participantCount:participants.length
    });
    const plan=buildAssignmentPlan(normalized);

    const participantRecords=participants.map((name,index)=>({
      id:participantId(index),
      index,
      name
    }));

    const nameToUnusedIndices=new Map();
    participantRecords.forEach((p)=>{
      if(!nameToUnusedIndices.has(p.name))nameToUnusedIndices.set(p.name,[]);
      nameToUnusedIndices.get(p.name).push(p.index);
    });

    const standardizedOrder=(order||[]).map((item,index)=>{
      const name=typeof item==="string"?item:item.name;
      let participantIndex=Number.isInteger(item?.participantIndex)
        ? item.participantIndex
        : null;

      if(participantIndex===null){
        const queue=nameToUnusedIndices.get(name)||[];
        participantIndex=queue.length?queue.shift():index;
      }

      return {
        drawOrder:index+1,
        participantId:participantId(participantIndex),
        participantIndex,
        name,
        assignment:plan[index]||null,
        engineDetail:typeof item==="object"&&item?.engineDetail
          ? item.engineDetail
          : null
      };
    });

    return {
      schemaVersion:VERSION,
      generatedAt:new Date().toISOString(),
      engine:{
        id:String(engineId||"unknown"),
        version:String(engineVersion||"1")
      },
      tournament:{
        ...normalized,
        meta:formatMeta(normalized)
      },
      participants:participantRecords,
      results:{
        complete:standardizedOrder.length===participants.length,
        completedCount:standardizedOrder.length,
        totalCount:participants.length,
        order:standardizedOrder
      },
      engineData
    };
  }

  function resultRows(snapshot){
    return snapshot.results.order.map(item=>[
      item.drawOrder,
      item.participantId,
      item.name,
      snapshot.tournament.format,
      item.assignment?.label||"",
      snapshot.engine.id,
      item.engineDetail||""
    ]);
  }

  function toCsv(snapshot){
    const rows=[
      ["Kolejność","ID","Uczestnik","Format","Przydział","Mechanizm","Dane mechaniki"],
      ...resultRows(snapshot)
    ];
    return "\ufeff"+rows.map(row=>
      row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")
    ).join("\n");
  }

  global.TournamentDrawStandard=Object.freeze({
    VERSION,
    LIMITS,
    FORMATS,
    PACES,
    normalizeConfig,
    nextPowerOfTwo,
    chooseByePositions,
    eliminationMeta,
    buildAssignmentPlan,
    formatMeta,
    participantId,
    buildResultEnvelope,
    toCsv
  });
})(typeof window!=="undefined"?window:globalThis);

/* ===== NEXT ORIGINAL SCRIPT BLOCK ===== */

(() => {
  const TDS=window.TournamentDrawStandard;
  const ENGINE_ID="cards-multideck";
  const ENGINE_VERSION="8";
  const $=id=>document.getElementById(id);

  const participantCount=$("participantCount"), format=$("format"), groupCount=$("groupCount"),
        pace=$("pace"), seed=$("seed"), participantsInput=$("participants"),
        generateBtn=$("generateBtn"), randomSeedBtn=$("randomSeedBtn"),
        applyBtn=$("applyBtn"), resetBtn=$("resetBtn"),
        summaryFormat=$("summaryFormat"), summaryCount=$("summaryCount"),
        summaryLayout=$("summaryLayout"), summaryStatus=$("summaryStatus"), formatHint=$("formatHint");

  const deckCountInput=$("deckCount"), skinSelect=$("skin"), revealStyle=$("revealStyle"),
        cardArtStyle=$("cardArtStyle"), nameStyle=$("nameStyle"),
        manualDeckMove=$("manualDeckMove"), deckSnapGrid=$("deckSnapGrid"),
        deckPositionReadout=$("deckPositionReadout"),
        deckMoveUp=$("deckMoveUp"), deckMoveDown=$("deckMoveDown"),
        deckMoveLeft=$("deckMoveLeft"), deckMoveRight=$("deckMoveRight"),
        deckMoveReset=$("deckMoveReset"),
        deckPresetLeft=$("deckPresetLeft"), deckPresetCenter=$("deckPresetCenter"),
        deckPresetMiddle=$("deckPresetMiddle"), deckPresetRight=$("deckPresetRight"),
        deckRotation=$("deckRotation"), deckScale=$("deckScale"), deckAnchorHint=$("deckAnchorHint"),
        transferStyle=$("transferStyle"), manualRows=$("manualRows"),
        evenDistributeBtn=$("evenDistributeBtn"), randomDistributeBtn=$("randomDistributeBtn"),
        applyManualBtn=$("applyManualBtn"), manualPanel=$("manualPanel");

  const decksGrid=$("decksGrid"), activeDeckSelect=$("activeDeckSelect"),
        drawBtn=$("drawBtn"), autoBtn=$("autoBtn"), shuffleAllBtn=$("shuffleAllBtn"),
        showMixBtn=$("showMixBtn"), mixBar=$("mixBar"), mixDeckA=$("mixDeckA"),
        mixDeckB=$("mixDeckB"), mixBtn=$("mixBtn"), engineState=$("engineState"),
        nextTarget=$("nextTarget"), progressFill=$("progressFill"), statusBox=$("status"),
        centerStage=$("centerStage"), revealBurst=$("revealBurst"),
        deckMotionTrail=$("deckMotionTrail"),
        activeDeckStage=$("activeDeckStage"), activeDeckCount=$("activeDeckCount"),
        activeDeckCards=$("activeDeckCards"), activeDeckTitle=$("activeDeckTitle"),
        drawOriginCard=$("drawOriginCard"),
        stageDeckLabel=$("stageDeckLabel"), stageDestinationLabel=$("stageDestinationLabel"),
        revealCard=$("revealCard"), revealBack=$("revealBack"), revealFront=$("revealFront"),
        cardArt=$("cardArt"), cardOrder=$("cardOrder"), cardDeckBadge=$("cardDeckBadge"),
        cardName=$("cardName"), cardAssignment=$("cardAssignment"),
        assignmentGrid=$("assignmentGrid"), resultsPanel=$("resultsPanel"),
        resultCount=$("resultCount"), resultsBody=$("resultsBody"),
        presentationBtn=$("presentationBtn"), resultsBtn=$("resultsBtn"),
        copyBtn=$("copyBtn"), csvBtn=$("csvBtn"), jsonBtn=$("jsonBtn");

  let names=[];
  let decks=[];
  let assignments=[];
  let plan=[];
  let results=[];
  let running=false;
  let autoMode=false;
  let autoTimer=null;
  let shuffleCounter=0;
  let mixCounter=0;
  let resetArmedUntil=0;
  let deckOffsetX=0;
  let deckOffsetY=0;
  let deckRotationDeg=0;
  let deckScaleValue=1;
  let deckDragState=null;
  let gridDeckDrag=null;
  let gridDeckDropTarget=null;
  let gridDeckDropCenter=false;
  let mixingDecks=false;
  let deckSwapAnimating=false;
  const deckTransforms=new Map();

  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function currentConfig(){
    return TDS.normalizeConfig({
      participantCount:Number(participantCount.value),
      format:format.value,
      groupCount:Number(groupCount.value),
      pace:pace.value,
      seed:seed.value
    });
  }
  function getDeckCount(){
    return clamp(Number(deckCountInput.value)||1,1,16);
  }
  function groupLabel(){
    const cfg=currentConfig(), meta=TDS.formatMeta(cfg);
    if(cfg.format==="groups") return `${cfg.groupCount} grup · ${meta.minGroupSize}–${meta.maxGroupSize} osób`;
    if(cfg.format==="swiss") return meta.byeCount?`${meta.pairCount} par · 1 BYE`:`${meta.pairCount} par`;
    return meta.byeCount?`drabinka ${meta.bracketSize} · ${meta.byeCount} BYE`:`drabinka ${meta.bracketSize}`;
  }

  function hashString(str){
    let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function seededRandomFactory(text){
    let state=hashString(text);
    return ()=>{
      state=(state+0x6D2B79F5)>>>0;
      let t=state;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function cryptoRandom(){
    if(window.crypto?.getRandomValues){
      const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;
    }
    return Math.random();
  }
  function randomFor(label){
    const s=seed.value.trim();
    return s?seededRandomFactory(`${s}|${label}`):cryptoRandom;
  }
  function shuffleArray(arr,label){
    const out=[...arr], rnd=randomFor(label);
    for(let i=out.length-1;i>0;i--){
      const j=Math.floor(rnd()*(i+1));
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }

  function parseNames(){
    const n=clamp(Number(participantCount.value)||32,2,128);
    const raw=participantsInput.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
    const unique=[...new Set(raw)];
    let k=1;
    while(unique.length<n){
      let candidate=`Team ${k++}`;
      while(unique.includes(candidate))candidate=`Team ${k++}`;
      unique.push(candidate);
    }
    return unique.slice(0,n);
  }
  function generateNames(){
    const n=clamp(Number(participantCount.value)||32,2,128);
    participantCount.value=n;
    participantsInput.value=Array.from({length:n},(_,i)=>`Team ${i+1}`).join("\n");
    updateSummary();
  }
  function randomSeed(){
    const a=new Uint32Array(2);
    if(window.crypto?.getRandomValues)crypto.getRandomValues(a);
    else{a[0]=Math.floor(Math.random()*2**32);a[1]=Math.floor(Math.random()*2**32)}
    seed.value=`DECK-${a[0].toString(36)}-${a[1].toString(36)}`.toUpperCase();
  }

  function defaultAssignments(){
    const count=getDeckCount();
    assignments=names.map((_,i)=>i%count);
  }
  function randomAssignments(){
    const count=getDeckCount();
    const shuffled=shuffleArray(names.map((_,i)=>i),`distribution-${shuffleCounter++}`);
    const next=new Array(names.length);
    shuffled.forEach((participantIndex,pos)=>{next[participantIndex]=pos%count});
    assignments=next;
  }
  function buildDecksFromAssignments({shuffle=true}={}){
    const count=getDeckCount();
    decks=Array.from({length:count},()=>[]);
    names.forEach((name,index)=>{
      let d=clamp(Number(assignments[index])||0,0,count-1);
      decks[d].push({name,index});
    });
    if(shuffle){
      decks=decks.map((cards,d)=>shuffleArray(cards,`deck-${d}-shuffle-${shuffleCounter++}`));
    }
  }
  function buildManualEditor(){
    manualRows.innerHTML="";
    const count=getDeckCount();
    names.forEach((name,index)=>{
      const row=document.createElement("div");
      row.className="manual-row";
      const opts=Array.from({length:count},(_,d)=>
        `<option value="${d}" ${assignments[index]===d?"selected":""}>Talia ${d+1}</option>`
      ).join("");
      row.innerHTML=`<span>${index+1}</span><span title="${name}">${name}</span><select data-manual-index="${index}" ${results.length?"disabled":""}>${opts}</select>`;
      manualRows.appendChild(row);
    });
  }
  function readManualAssignments(){
    const sels=[...manualRows.querySelectorAll("select[data-manual-index]")];
    const next=[...assignments];
    sels.forEach(s=>{next[Number(s.dataset.manualIndex)]=Number(s.value)});
    assignments=next;
  }

  function skinData(name=skinSelect.value){
    const skins={
      tournament:{back:"linear-gradient(145deg,#243a7a,#52308b)",front:"linear-gradient(145deg,#fbfcff,#e7edf9)",text:"#172033",edge:"rgba(124,156,255,.65)"},
      classic:{back:"linear-gradient(145deg,#16191f,#353a43)",front:"linear-gradient(145deg,#fbfbfb,#dedfe3)",text:"#14171c",edge:"rgba(255,255,255,.38)"},
      casino:{back:"linear-gradient(145deg,#651b22,#b52d32)",front:"linear-gradient(145deg,#fff9ed,#f5e3bd)",text:"#3d241a",edge:"rgba(224,188,91,.72)"},
      emerald:{back:"linear-gradient(145deg,#104d3b,#17805c)",front:"linear-gradient(145deg,#f4fff9,#d9f4e7)",text:"#123a2c",edge:"rgba(89,214,139,.7)"},
      cyber:{back:"linear-gradient(145deg,#39145b,#8d24c8)",front:"linear-gradient(145deg,#fff4ff,#ead7ff)",text:"#42164f",edge:"rgba(228,105,255,.76)"},
      gold:{back:"linear-gradient(145deg,#6b4d12,#c29326)",front:"linear-gradient(145deg,#fff9df,#f2df95)",text:"#4f3910",edge:"rgba(244,211,94,.82)"},
      minimal:{back:"linear-gradient(145deg,#dfe5ee,#f9fbff)",front:"linear-gradient(145deg,#fff,#f4f6f9)",text:"#1c2636",edge:"rgba(255,255,255,.85)"},
      retro:{back:"linear-gradient(145deg,#094b75,#c52383)",front:"linear-gradient(145deg,#fff6df,#e9f7ff)",text:"#24344a",edge:"rgba(63,226,255,.72)"}
    };
    return skins[name]||skins.tournament;
  }



  function dragParentDocument(){
    try{
      if(window.parent && window.parent!==window){
        return window.parent.document;
      }
    }catch(_){}

    return document;
  }

  function dragFrameOffset(){
    try{
      if(window.frameElement){
        const rect=
          window.frameElement.getBoundingClientRect();

        return {
          x:rect.left,
          y:rect.top
        };
      }
    }catch(_){}

    return {x:0,y:0};
  }

  function rectToParent(rect){
    const offset=dragFrameOffset();

    return {
      left:rect.left+offset.x,
      right:rect.right+offset.x,
      top:rect.top+offset.y,
      bottom:rect.bottom+offset.y,
      width:rect.width,
      height:rect.height
    };
  }

  function pointerToParent(event){
    const offset=dragFrameOffset();

    return {
      x:event.clientX+offset.x,
      y:event.clientY+offset.y
    };
  }

  function copyComputedStylesDeep(source,target){
    const style=getComputedStyle(source);

    for(const prop of style){
      target.style.setProperty(
        prop,
        style.getPropertyValue(prop),
        style.getPropertyPriority(prop)
      );
    }

    const sourceChildren=[...source.children];
    const targetChildren=[...target.children];

    sourceChildren.forEach((child,index)=>{
      if(targetChildren[index]){
        copyComputedStylesDeep(
          child,
          targetChildren[index]
        );
      }
    });
  }

  function createFullScreenDeckGhost(stack){
    const overlayDoc=dragParentDocument();

    const rect=stack.getBoundingClientRect();

    const ghost=stack.cloneNode(true);

    copyComputedStylesDeep(stack,ghost);

    ghost.className="deck-stack-drag-ghost";

    ghost.style.position="fixed";
    ghost.style.zIndex="2147483000";
    ghost.style.pointerEvents="none";
    ghost.style.margin="0";

    ghost.style.width=`${rect.width}px`;
    ghost.style.height=`${rect.height}px`;

    ghost.style.transform=
      "translate(-50%,-50%) scale(1.05) rotate(-2deg)";

    ghost.style.filter=
      "drop-shadow(0 18px 26px rgba(0,0,0,.46))";

    const label=overlayDoc.createElement("div");

    label.textContent=
      "Puść na talii = wymieszaj · puść na środku = wybierz";

    Object.assign(label.style,{
      position:"absolute",
      left:"50%",
      top:"100%",
      transform:"translate(-50%, 10px)",
      whiteSpace:"nowrap",
      padding:"6px 10px",
      borderRadius:"999px",
      border:"1px solid rgba(124,156,255,.34)",
      background:"rgba(11,16,24,.96)",
      color:"#e1e8ff",
      fontSize:"11px",
      fontWeight:"850",
      boxShadow:"0 8px 20px rgba(0,0,0,.28)"
    });

    ghost.appendChild(label);

    overlayDoc.body.appendChild(ghost);

    return ghost;
  }

  function overlapRatio(a,b){
    const left=Math.max(a.left,b.left);
    const right=Math.min(a.right,b.right);
    const top=Math.max(a.top,b.top);
    const bottom=Math.min(a.bottom,b.bottom);

    const width=Math.max(0,right-left);
    const height=Math.max(0,bottom-top);

    const overlap=width*height;

    const base=Math.max(
      1,
      Math.min(
        a.width*a.height,
        b.width*b.height
      )
    );

    return overlap/base;
  }

  function clearGridDeckCenterTarget(){
    gridDeckDropCenter=false;

    centerStage.classList.remove(
      "deck-center-drop-target"
    );
  }

  function clearGridDeckDropTarget(){
    if(gridDeckDropTarget){
      gridDeckDropTarget.classList.remove("deck-drop-target");
      gridDeckDropTarget=null;
    }
  }

  function findOverlappingDeckTarget(ghostRect,sourceDeck){
    let best=null;
    let bestRatio=0;

    decksGrid.querySelectorAll(".deck-box").forEach(box=>{
      const d=Number(box.dataset.deck);
      if(d===sourceDeck)return;

      const stack=box.querySelector(".physical-stack");
      if(!stack)return;

      const r=rectToParent(
        stack.getBoundingClientRect()
      );

      const left=Math.max(ghostRect.left,r.left);
      const right=Math.min(ghostRect.right,r.right);
      const top=Math.max(ghostRect.top,r.top);
      const bottom=Math.min(ghostRect.bottom,r.bottom);

      const width=Math.max(0,right-left);
      const height=Math.max(0,bottom-top);
      const overlap=width*height;

      const base=Math.max(
        1,
        Math.min(
          ghostRect.width*ghostRect.height,
          r.width*r.height
        )
      );

      const ratio=overlap/base;

      if(ratio>bestRatio){
        bestRatio=ratio;
        best=box;
      }
    });

    return bestRatio>=0.28 ? best : null;
  }


  function positionGridDeckGhost(event){
    if(!gridDeckDrag)return;

    const ghost=gridDeckDrag.ghost;

    const point=pointerToParent(event);

    ghost.style.left=`${point.x}px`;
    ghost.style.top=`${point.y}px`;

    const ghostRect=
      ghost.getBoundingClientRect();

    const deckTarget=
      findOverlappingDeckTarget(
        ghostRect,
        gridDeckDrag.sourceDeck
      );

    if(deckTarget!==gridDeckDropTarget){
      clearGridDeckDropTarget();

      gridDeckDropTarget=deckTarget;

      gridDeckDropTarget?.classList.add(
        "deck-drop-target"
      );
    }

    clearGridDeckCenterTarget();

    if(!deckTarget){
      const centerRect=rectToParent(
        centerStage.getBoundingClientRect()
      );

      if(
        overlapRatio(
          ghostRect,
          centerRect
        )>=0.18
      ){
        gridDeckDropCenter=true;

        centerStage.classList.add(
          "deck-center-drop-target"
        );
      }
    }
  }

  function startGridDeckDrag(event,sourceDeck,stack){
    if(running || mixingDecks || deckSwapAnimating || autoMode || !decks[sourceDeck]?.length)return;
    if(event.button!==undefined && event.button!==0)return;

    const rect=stack.getBoundingClientRect();
    const sourceBox=stack.closest(".deck-box");

    const ghost=
      createFullScreenDeckGhost(stack);

    gridDeckDrag={
      sourceDeck,
      sourceBox,
      sourceStack:stack,
      ghost,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      moved:false
    };

    sourceBox?.classList.add("deck-drag-source");

    if(stack.setPointerCapture){
      try{
        stack.setPointerCapture(event.pointerId);
      }catch(_){}
    }


    positionGridDeckGhost(event);

    window.addEventListener(
      "pointermove",
      moveGridDeckDrag,
      {passive:false}
    );

    window.addEventListener(
      "pointerup",
      endGridDeckDrag,
      {capture:true,passive:false}
    );

    window.addEventListener(
      "pointercancel",
      endGridDeckDrag,
      {capture:true,passive:false}
    );

    window.addEventListener(
      "blur",
      cancelGridDeckDrag
    );

    event.preventDefault();
    event.stopPropagation();
  }

  function cancelGridDeckDrag(){
    if(!gridDeckDrag)return;

    const {
      sourceBox,
      sourceStack,
      ghost,
      pointerId
    }=gridDeckDrag;

    sourceBox?.classList.remove("deck-drag-source");

    clearGridDeckDropTarget();
    clearGridDeckCenterTarget();

    if(sourceStack?.releasePointerCapture){
      try{
        if(sourceStack.hasPointerCapture?.(pointerId)){
          sourceStack.releasePointerCapture(pointerId);
        }
      }catch(_){}
    }

    ghost?.remove();

    window.removeEventListener(
      "pointermove",
      moveGridDeckDrag
    );

    window.removeEventListener(
      "pointerup",
      endGridDeckDrag,
      true
    );

    window.removeEventListener(
      "pointercancel",
      endGridDeckDrag,
      true
    );

    window.removeEventListener(
      "blur",
      cancelGridDeckDrag
    );

    gridDeckDrag=null;

    renderDecks();
  }

  function moveGridDeckDrag(event){
    if(!gridDeckDrag)return;

    const dx=event.clientX-gridDeckDrag.startX;
    const dy=event.clientY-gridDeckDrag.startY;

    if(Math.hypot(dx,dy)>5){
      gridDeckDrag.moved=true;
    }

    positionGridDeckGhost(event);
    event.preventDefault();
  }



  function removeIdsDeep(element){
    element.removeAttribute?.("id");

    element.querySelectorAll?.("[id]")
      .forEach(node=>{
        node.removeAttribute("id");
      });
  }

  function createDeckSwapClone(
    source,
    rect,
    className
  ){
    const overlayDoc=dragParentDocument();

    const clone=source.cloneNode(true);

    removeIdsDeep(clone);
    copyComputedStylesDeep(source,clone);

    clone.className=className;

    Object.assign(clone.style,{
      position:"fixed",
      left:`${rect.left}px`,
      top:`${rect.top}px`,
      width:`${rect.width}px`,
      height:`${rect.height}px`,
      margin:"0",
      pointerEvents:"none",
      zIndex:"2147483100",
      transformOrigin:"center",
      willChange:"transform, opacity"
    });

    overlayDoc.body.appendChild(clone);

    return clone;
  }

  function swapAnimate(
    element,
    keyframes,
    options
  ){
    return new Promise(resolve=>{
      if(!element?.animate){
        setTimeout(
          resolve,
          options.duration || 0
        );
        return;
      }

      const animation=
        element.animate(
          keyframes,
          options
        );

      animation.onfinish=resolve;
      animation.oncancel=resolve;
    });
  }

  async function animateActiveDeckSwap(
    sourceDeck,
    previousDeck,
    sourceStack,
    dragRect
  ){
    const stageStack=
      centerStage.querySelector(
        ".active-deck-stage"
      );

    if(!stageStack){
      return;
    }

    const stageRect=rectToParent(
      stageStack.getBoundingClientRect()
    );

    const incoming=
      createDeckSwapClone(
        sourceStack,
        dragRect,
        "deck-swap-clone deck-swap-incoming"
      );

    let outgoing=null;
    let oldTargetBox=null;

    if(previousDeck!==sourceDeck){
      const oldBox=
        decksGrid.querySelector(
          `.deck-box[data-deck="${previousDeck}"]`
        );

      const oldStack=
        oldBox?.querySelector(
          ".physical-stack"
        );

      if(oldStack){
        const targetRect=rectToParent(
          oldStack.getBoundingClientRect()
        );

        outgoing=
          createDeckSwapClone(
            stageStack,
            stageRect,
            "deck-swap-clone deck-swap-outgoing"
          );

        oldTargetBox=oldBox;

        oldTargetBox.classList.add(
          "deck-swap-return-target"
        );

        const outDX=
          targetRect.left-stageRect.left;

        const outDY=
          targetRect.top-stageRect.top;

        outgoing.dataset.dx=
          String(outDX);

        outgoing.dataset.dy=
          String(outDY);
      }
    }

    centerStage.classList.add(
      "deck-swap-running"
    );

    const inDX=
      stageRect.left-dragRect.left;

    const inDY=
      stageRect.top-dragRect.top;

    const inLift=
      Math.min(
        -42,
        inDY*.18
      );

    const animations=[];

    animations.push(
      swapAnimate(
        incoming,
        [
          {
            transform:
              "translate(0,0) rotate(-2deg) scale(1.03)",
            opacity:1
          },
          {
            transform:
              `translate(
                ${inDX*.48}px,
                ${inDY*.42+inLift}px
              )
              rotate(3deg)
              scale(1.08)`,
            opacity:1,
            offset:.52
          },
          {
            transform:
              `translate(
                ${inDX}px,
                ${inDY}px
              )
              rotate(0deg)
              scale(1)`,
            opacity:1
          }
        ],
        {
          duration:520,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      )
    );

    if(outgoing){
      const outDX=
        Number(outgoing.dataset.dx);

      const outDY=
        Number(outgoing.dataset.dy);

      animations.push(
        swapAnimate(
          outgoing,
          [
            {
              transform:
                "translate(0,0) rotate(0deg) scale(1)",
              opacity:1
            },
            {
              transform:
                `translate(
                  ${outDX*.45}px,
                  ${outDY*.40-54}px
                )
                rotate(-4deg)
                scale(.96)`,
              opacity:.95,
              offset:.5
            },
            {
              transform:
                `translate(
                  ${outDX}px,
                  ${outDY}px
                )
                rotate(0deg)
                scale(.88)`,
              opacity:.25
            }
          ],
          {
            duration:500,
            easing:
              "cubic-bezier(.25,.7,.2,1)",
            fill:"forwards"
          }
        )
      );
    }

    const overlayDoc=
      dragParentDocument();

    const flash=
      overlayDoc.createElement("div");

    flash.className=
      "deck-swap-center-flash";

    flash.style.left=
      `${stageRect.left+
        stageRect.width/2}px`;

    flash.style.top=
      `${stageRect.top+
        stageRect.height/2}px`;

    overlayDoc.body.appendChild(flash);

    animations.push(
      swapAnimate(
        flash,
        [
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(.25)"
          },
          {
            opacity:.8,
            transform:
              "translate(-50%,-50%) scale(1)",
            offset:.65
          },
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(1.8)"
          }
        ],
        {
          duration:520,
          easing:"ease-out",
          fill:"forwards"
        }
      )
    );

    await Promise.all(animations);

    incoming.remove();
    outgoing?.remove();
    flash.remove();

    oldTargetBox?.classList.remove(
      "deck-swap-return-target"
    );
  }



  /* ACTIVE_SWAP_V153 */

  /* SLOT_SWAP_V155 */

  async function animateActiveDeckSwapPhysicalV152B(
    sourceDeck,
    previousDeck,
    sourceStack,
    dragRect
  ){
    const stageStack=
      centerStage.querySelector(
        ".active-deck-stage"
      );

    if(!stageStack)return;

    const stageRect=
      rectToParent(
        stageStack.getBoundingClientRect()
      );

    const sourceBox=
      decksGrid.querySelector(
        `.deck-box[data-deck="${sourceDeck}"]`
      );

    const previousBox=
      decksGrid.querySelector(
        `.deck-box[data-deck="${previousDeck}"]`
      );

    const previousHomeStack=
      previousBox?.querySelector(
        ".physical-stack"
      );

    const previousHomeRect=
      previousHomeStack
        ? rectToParent(
            previousHomeStack.getBoundingClientRect()
          )
        : null;

    /*
      Nowa talia znajduje się już przy centrum,
      bo użytkownik właśnie ją tam przeciągnął.
    */

    const incoming=
      createDeckSwapClone(
        sourceStack,
        dragRect,
        "deck-swap-clone slot-swap-in-v155"
      );

    let outgoing=null;

    if(
      previousDeck!==sourceDeck &&
      previousHomeRect
    ){
      outgoing=
        createDeckSwapClone(
          stageStack,
          stageRect,
          "deck-swap-clone slot-swap-out-v155"
        );
    }

    /*
      Prawdziwy stos ze źródłowego slotu
      pozostaje ukryty.
    */

    sourceBox?.classList.add(
      "slot-swap-source-v155"
    );

    previousBox?.classList.add(
      "slot-swap-target-v155"
    );

    centerStage.classList.add(
      "deck-swap-running",
      "slot-swap-stage-v155"
    );

    statusBox.innerHTML=
      `<strong>Odkładanie Talii ${previousDeck+1} i aktywowanie Talii ${sourceDeck+1}…</strong>`;

    /*
      FAZA 1
      Stara aktywna talia podnosi się ze świecznika.
      Nowa pozostaje dokładnie tam, gdzie użytkownik ją puścił.
    */

    if(outgoing){
      await swapAnimate(
        outgoing,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          },
          {
            transform:
              "translate(0,-62px) rotate(-3deg) scale(1.07)",
            filter:
              "drop-shadow(0 30px 32px rgba(0,0,0,.48))"
          }
        ],
        {
          duration:220,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      );
    }

    /*
      FAZA 2
      Stara talia wraca do swojego pustego slotu.
      Nowa jednocześnie tylko wyrównuje się do świecznika.
    */

    const movements=[];

    const inDX=
      stageRect.left-
      dragRect.left;

    const inDY=
      stageRect.top-
      dragRect.top;

    movements.push(
      swapAnimate(
        incoming,
        [
          {
            transform:
              "translate(0,0) rotate(-2deg) scale(1.035)"
          },
          {
            transform:
              `translate(
                ${inDX}px,
                ${inDY-12}px
              )
              rotate(0deg)
              scale(1.02)`,
            offset:.72
          },
          {
            transform:
              `translate(
                ${inDX}px,
                ${inDY}px
              )
              rotate(0deg)
              scale(1)`
          }
        ],
        {
          duration:380,
          delay:80,
          easing:
            "cubic-bezier(.2,.82,.18,1)",
          fill:"forwards"
        }
      )
    );

    if(
      outgoing &&
      previousHomeRect
    ){
      const outDX=
        previousHomeRect.left-
        stageRect.left;

      const outDY=
        previousHomeRect.top-
        stageRect.top;

      /*
        Łuk wybieramy w stronę docelowego slotu.
      */

      const arcX=
        outDX<0
          ? -55
          : 55;

      movements.push(
        swapAnimate(
          outgoing,
          [
            {
              transform:
                "translate(0,-62px) rotate(-3deg) scale(1.07)"
            },
            {
              transform:
                `translate(
                  ${outDX*.48+arcX}px,
                  ${outDY*.36-105}px
                )
                rotate(${outDX<0 ? -7 : 7}deg)
                scale(1.04)`,
              offset:.52
            },
            {
              transform:
                `translate(
                  ${outDX}px,
                  ${outDY-10}px
                )
                rotate(0deg)
                scale(.97)`,
              offset:.9
            },
            {
              transform:
                `translate(
                  ${outDX}px,
                  ${outDY}px
                )
                rotate(0deg)
                scale(1)`
            }
          ],
          {
            duration:520,
            easing:
              "cubic-bezier(.18,.76,.16,1)",
            fill:"forwards"
          }
        )
      );
    }

    await Promise.all(
      movements
    );

    incoming.remove();
    outgoing?.remove();

    /*
      Krótki efekt fizycznego odłożenia talii.
    */

    previousBox?.classList.add(
      "slot-swap-land-grid-v155"
    );

    centerStage.classList.add(
      "slot-swap-land-center-v155"
    );

    await new Promise(
      resolve=>
        setTimeout(resolve,180)
    );

    sourceBox?.classList.remove(
      "slot-swap-source-v155"
    );

    previousBox?.classList.remove(
      "slot-swap-target-v155"
    );

    centerStage.classList.remove(
      "deck-swap-running",
      "slot-swap-stage-v155"
    );

    setTimeout(()=>{
      previousBox?.classList.remove(
        "slot-swap-land-grid-v155"
      );

      centerStage.classList.remove(
        "slot-swap-land-center-v155"
      );
    },320);
  }

  function endGridDeckDrag(event){
    if(!gridDeckDrag)return;

    const {
      sourceDeck,
      sourceBox,
      sourceStack,
      ghost,
      pointerId,
      moved
    }=gridDeckDrag;

    positionGridDeckGhost(event);

    const targetBox=
      gridDeckDropTarget;

    const targetDeck=
      targetBox
        ? Number(targetBox.dataset.deck)
        : -1;

    const droppedOnCenter=
      gridDeckDropCenter;

    const previousDeck=
      Number(activeDeckSelect.value);

    const dragRect=
      ghost?.getBoundingClientRect()
      || rectToParent(
        sourceStack.getBoundingClientRect()
      );

    clearGridDeckDropTarget();
    clearGridDeckCenterTarget();

    if(sourceStack?.releasePointerCapture){
      try{
        if(
          sourceStack.hasPointerCapture?.(
            pointerId
          )
        ){
          sourceStack.releasePointerCapture(
            pointerId
          );
        }
      }catch(_){}
    }

    window.removeEventListener(
      "pointermove",
      moveGridDeckDrag
    );

    window.removeEventListener(
      "pointerup",
      endGridDeckDrag,
      true
    );

    window.removeEventListener(
      "pointercancel",
      endGridDeckDrag,
      true
    );

    window.removeEventListener(
      "blur",
      cancelGridDeckDrag
    );

    gridDeckDrag=null;

    /* ---------------------------
       Talia na talię = mieszanie
    --------------------------- */

    if(
      moved &&
      targetDeck>=0 &&
      targetDeck!==sourceDeck
    ){
      sourceBox?.classList.remove(
        "deck-drag-source"
      );

      ghost?.remove();

      mixDeckA.value=
        String(sourceDeck);

      mixDeckB.value=
        String(targetDeck);

      void mixTwoDecks();

      event.preventDefault();
      return;
    }

    /* ---------------------------
       Talia na środek = zamiana
    --------------------------- */

    if(
      moved &&
      droppedOnCenter
    ){
      ghost?.remove();

      deckSwapAnimating=true;

      statusBox.innerHTML=
        `<strong>Zamiana aktywnej talii: ${previousDeck+1} → ${sourceDeck+1}…</strong>`;

      void animateActiveDeckSwapPhysicalV152B(
        sourceDeck,
        previousDeck,
        sourceStack,
        dragRect
      )
      .then(()=>{
        sourceBox?.classList.remove(
          "deck-drag-source"
        );

        activeDeckSelect.value=
          String(sourceDeck);

        loadDeckTransform(
          sourceDeck
        );

        renderDecks();
        updateNextTarget();

        stageDeckLabel.textContent=
          `TALIA ${sourceDeck+1}`;

        updateActiveDeckStage(
          sourceDeck
        );

        centerStage.classList.remove(
          "deck-swap-running"
        );

        centerStage.classList.add(
          "deck-center-drop-accepted"
        );

        setTimeout(()=>{
          centerStage.classList.remove(
            "deck-center-drop-accepted"
          );
        },420);

        statusBox.innerHTML=
          `<strong>Talia ${sourceDeck+1} jest teraz aktywna.</strong>`;
      })
      .catch(error=>{
        console.error(
          "Animacja zamiany talii:",
          error
        );

        sourceBox?.classList.remove(
          "deck-drag-source"
        );

        centerStage.classList.remove(
          "deck-swap-running"
        );

        activeDeckSelect.value=
          String(sourceDeck);

        renderDecks();

        updateNextTarget();
        updateActiveDeckStage(
          sourceDeck
        );
      })
      .finally(()=>{
        deckSwapAnimating=false;
      });

      event.preventDefault();
      return;
    }

    /* ---------------------------
       zwykłe puszczenie
    --------------------------- */

    sourceBox?.classList.remove(
      "deck-drag-source"
    );

    ghost?.remove();

    renderDecks();

    event.preventDefault();
  }

  function renderDecks(){
    decksGrid.innerHTML="";
    const skin=skinData();
    const active=Number(activeDeckSelect.value)||0;

    decks.forEach((cards,d)=>{
      const box=document.createElement("div");
      box.className=`deck-box${d===active?" active":""}${cards.length?"":" empty"}`;
      box.dataset.deck=String(d);
      box.innerHTML=`<div class="deck-head"><b>Talia ${d+1}</b><span>${cards.length} kart</span></div>`;

      const stack=document.createElement("div");
      stack.className=`physical-stack${cards.length?" has-cards":""}`;
      stack.dataset.deck=String(d);

      if(cards.length){
        stack.addEventListener(
          "pointerdown",
          (event)=>startGridDeckDrag(event,d,stack)
        );
      }

      if(!cards.length){
        stack.innerHTML='<div class="empty-mark">pusta</div>';
      }else{
        const maxOffset=42;
        const offset=cards.length<=1?0:Math.min(4,maxOffset/(cards.length-1));
        cards.forEach((card,i)=>{
          const el=document.createElement("div");
          el.className="physical-card";
          el.title=card.name;
          el.style.background=skin.back;
          el.style.borderColor=skin.edge;
          el.style.transform=`translateY(${(i*offset).toFixed(2)}px) rotate(${((i%5)-2)*.18}deg)`;
          el.style.zIndex=String(i+1);
          stack.appendChild(el);
        });
      }
      box.appendChild(stack);

      const top=document.createElement("div");
      top.className="deck-top-name";
      top.textContent=cards.length?`góra: ${cards[cards.length-1].name}`:"brak kart";
      box.appendChild(top);

      box.addEventListener("click",(event)=>{
        if(running)return;

        if(event.target.closest(".physical-stack")){
          return;
        }

        activeDeckSelect.value=String(d);
        loadDeckTransform(d);
        stageDeckLabel.textContent=`TALIA ${d+1}`;
        renderDecks();
        updateNextTarget();
      });
      decksGrid.appendChild(box);
    });

    updateDeckSelectors();
    updateActiveDeckStage();
  }

  function updateDeckSelectors(){
    const values=decks.map((cards,d)=>({d,count:cards.length}));
    const oldActive=Number(activeDeckSelect.value)||0;
    const options=values.map(x=>`<option value="${x.d}" ${x.d===oldActive?"selected":""}>Talia ${x.d+1} · ${x.count}</option>`).join("");
    activeDeckSelect.innerHTML=options;
    mixDeckA.innerHTML=options;
    mixDeckB.innerHTML=options;
    if(values.length>1)mixDeckB.value=String(oldActive===0?1:0);
  }

  function buildAssignmentBoard(){
    assignmentGrid.innerHTML="";
    plan.forEach((a,index)=>{
      const el=document.createElement("div");
      el.className="assignment-item";
      el.dataset.assignmentIndex=String(index);
      el.innerHTML=`<b>${a.label}</b><span>oczekuje na kartę #${index+1}</span>`;
      assignmentGrid.appendChild(el);
    });
    updateAssignmentBoard();
  }
  function updateAssignmentBoard(){
    [...assignmentGrid.children].forEach((el,index)=>{
      el.classList.toggle("next",index===results.length && results.length<plan.length);
      const r=results[index];
      const span=el.querySelector("span");
      if(r){
        el.classList.add("filled");
        span.textContent=`${r.name} · Talia ${r.sourceDeck+1}`;
      }else{
        el.classList.remove("filled");
        span.textContent=`oczekuje na kartę #${index+1}`;
      }
    });
    updateNextTarget();
  }
  function updateNextTarget(){
    const a=plan[results.length];
    const d=Number(activeDeckSelect.value)||0;
    const count=decks[d]?.length||0;
    nextTarget.innerHTML=a
      ? `<strong>Następny przydział:</strong> ${a.label} · wybrana Talia ${d+1} (${count} kart)`
      : `<strong>Losowanie zakończone.</strong>`;
  }

  function updateSummary(){
    const cfg=currentConfig(), meta=TDS.formatMeta(cfg);
    summaryCount.textContent=String(cfg.participantCount);
    groupCount.disabled=cfg.format!=="groups" || results.length>0;

    if(cfg.format==="groups"){
      summaryFormat.textContent=`Grupy · ${cfg.groupCount}`;
      summaryLayout.textContent=`${cfg.groupCount} grup · ${meta.minGroupSize}–${meta.maxGroupSize} osób`;
      formatHint.textContent="TDS rozdziela kolejne wyniki rotacyjnie do grup.";
    }else if(cfg.format==="swiss"){
      summaryFormat.textContent="Swiss · runda 1";
      summaryLayout.textContent=meta.byeCount?`${meta.pairCount} par · 1 BYE`:`${meta.pairCount} par`;
      formatHint.textContent="Kolejne dwie karty tworzą kolejną parę rundy 1.";
    }else{
      summaryFormat.textContent="Single Elimination";
      summaryLayout.textContent=meta.byeCount?`drabinka ${meta.bracketSize} · ${meta.byeCount} BYE`:`drabinka ${meta.bracketSize}`;
      formatHint.textContent="Kolejne karty obsadzają kolejne pozycje przygotowane przez TDS.";
    }
    summaryStatus.textContent=results.length?`W toku · ${results.length}/${cfg.participantCount}`:"Gotowe";
  }

  function paceMs(){
    const cfg=currentConfig();
    if(cfg.pace==="show")return {reveal:1050,transfer:780,auto:1350};
    if(cfg.pace==="fast")return {reveal:520,transfer:420,auto:680};
    if(cfg.pace==="turbo")return {reveal:300,transfer:260,auto:370};
    if(cfg.participantCount>80)return {reveal:300,transfer:250,auto:360};
    if(cfg.participantCount>48)return {reveal:390,transfer:320,auto:470};
    if(cfg.participantCount>24)return {reveal:540,transfer:410,auto:650};
    return {reveal:850,transfer:620,auto:980};
  }

  function chosenRevealClass(){
    const selected=revealStyle.value;
    if(selected!=="random")return `anim-${selected}`;
    const options=["flip","slide","fan","deal","cinematic"];
    return `anim-${options[Math.floor(cryptoRandom()*options.length)]}`;
  }

  function burstParticles(){
    revealBurst.innerHTML="";
    const count=22;
    for(let i=0;i<count;i++){
      const p=document.createElement("i");
      p.className="reveal-particle";
      const angle=(Math.PI*2*i/count)+(Math.random()-.5)*.24;
      const distance=70+Math.random()*115;
      p.style.setProperty("--dx",`${Math.cos(angle)*distance}px`);
      p.style.setProperty("--dy",`${Math.sin(angle)*distance}px`);
      p.style.setProperty("--particle-ms",`${520+Math.random()*360}ms`);
      p.style.width=p.style.height=`${2+Math.random()*3}px`;
      revealBurst.appendChild(p);
    }
    setTimeout(()=>{revealBurst.innerHTML=""},1000);
  }

  function applyCardPresentation(){
    cardArt.className=`card-art art-${cardArtStyle.value}`;
    cardName.className=`name name-style-${nameStyle.value}`;
  }

  function activeDeckIndex(){
    return Number(activeDeckSelect.value)||0;
  }

  function saveCurrentDeckTransform(){
    deckTransforms.set(activeDeckIndex(),{
      x:deckOffsetX,y:deckOffsetY,rotation:deckRotationDeg,scale:deckScaleValue
    });
  }

  function loadDeckTransform(deckIndex){
    const saved=deckTransforms.get(deckIndex);
    if(saved){
      deckOffsetX=saved.x;deckOffsetY=saved.y;deckRotationDeg=saved.rotation;deckScaleValue=saved.scale;
    }else{
      deckOffsetX=0;deckOffsetY=0;deckRotationDeg=0;deckScaleValue=1;
    }
    deckRotation.value=String(Math.round(deckRotationDeg));
    deckScale.value=String(Math.round(deckScaleValue*100));
    applyDeckPosition({snap:false,save:false});
  }

  function getDeckOffsetBounds(){
    const stageRect=centerStage.getBoundingClientRect();
    const baseWidth=170*deckScaleValue;
    const baseHeight=140*deckScaleValue;
    const horizontal=Math.max(0,stageRect.width/2-baseWidth/2-24);
    const upward=Math.max(0,stageRect.height-baseHeight-76);
    const downward=16;
    return {minX:-horizontal,maxX:horizontal,minY:-upward,maxY:downward};
  }

  function snapDeckValue(value){
    if(!deckSnapGrid.checked)return value;
    return Math.round(value/10)*10;
  }

  function getDeckAnchors(){
    const bounds=getDeckOffsetBounds();
    return {
      left:{x:bounds.minX*.72,y:0,label:"Lewy dół"},
      center:{x:0,y:0,label:"Środek"},
      middle:{x:0,y:Math.max(bounds.minY*.52,-130),label:"Centrum sceny"},
      right:{x:bounds.maxX*.72,y:0,label:"Prawy dół"}
    };
  }

  function nearestAnchor(){
    const anchors=getDeckAnchors();
    let best=null;
    for(const [name,a] of Object.entries(anchors)){
      const d=Math.hypot(deckOffsetX-a.x,deckOffsetY-a.y);
      if(!best||d<best.distance)best={name,...a,distance:d};
    }
    return best;
  }

  function renderAnchorMarkers(){
    const anchors=getDeckAnchors();
    centerStage.querySelectorAll("[data-anchor-marker]").forEach(marker=>{
      const a=anchors[marker.dataset.anchorMarker];
      if(!a)return;
      marker.style.left=`calc(50% + ${a.x}px)`;
      marker.style.bottom=`${22-a.y}px`;
    });
    const nearest=nearestAnchor();
    if(nearest){
      deckAnchorHint.innerHTML=`<span class="deck-anchor-dot"></span><span>Najbliższy punkt: <strong>${nearest.label}</strong> · ${Math.round(nearest.distance)} px</span>`;
    }
  }

  function applyDeckPosition({snap=false,save=true}={}){
    const bounds=getDeckOffsetBounds();
    if(snap){deckOffsetX=snapDeckValue(deckOffsetX);deckOffsetY=snapDeckValue(deckOffsetY);}
    deckOffsetX=Math.max(bounds.minX,Math.min(bounds.maxX,deckOffsetX));
    deckOffsetY=Math.max(bounds.minY,Math.min(bounds.maxY,deckOffsetY));
    deckRotationDeg=Math.max(-18,Math.min(18,deckRotationDeg));
    deckScaleValue=Math.max(.8,Math.min(1.25,deckScaleValue));
    activeDeckStage.style.setProperty("--deck-x",`${deckOffsetX}px`);
    activeDeckStage.style.setProperty("--deck-y",`${deckOffsetY}px`);
    activeDeckStage.style.setProperty("--deck-rot",`${deckRotationDeg}deg`);
    activeDeckStage.style.setProperty("--deck-scale",String(deckScaleValue));
    deckPositionReadout.textContent=`X ${Math.round(deckOffsetX)} · Y ${Math.round(deckOffsetY)} · ${Math.round(deckRotationDeg)}° · ${Math.round(deckScaleValue*100)}%`;
    renderAnchorMarkers();
    if(save)saveCurrentDeckTransform();
  }

  function moveDeckBy(dx,dy){
    if(running)return;
    deckOffsetX+=dx;deckOffsetY+=dy;applyDeckPosition({snap:true});
  }

  function setDeckPreset(name){
    if(running)return;
    const a=getDeckAnchors()[name]||getDeckAnchors().center;
    deckOffsetX=a.x;deckOffsetY=a.y;applyDeckPosition({snap:true});
  }

  function resetDeckPosition(){
    deckRotationDeg=0;deckScaleValue=1;deckRotation.value="0";deckScale.value="100";setDeckPreset("center");
  }

  function setManualDeckMove(enabled){
    activeDeckStage.classList.toggle("manual-move",enabled);
    centerStage.classList.toggle("manual-layout",enabled);
    activeDeckStage.tabIndex=enabled?0:-1;
    activeDeckStage.setAttribute("aria-label",enabled?"Aktywna talia. Przeciągnij ją albo użyj klawiszy strzałek.":"Aktywna talia.");
    renderAnchorMarkers();
  }

  function startDeckDrag(event){
    if(!manualDeckMove.checked||running)return;
    if(event.button!==undefined&&event.button!==0)return;
    deckDragState={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX:deckOffsetX,offsetY:deckOffsetY,lastX:event.clientX,lastTime:performance.now()};
    activeDeckStage.classList.add("dragging");deckMotionTrail.classList.add("show");activeDeckStage.focus({preventScroll:true});
    if(activeDeckStage.setPointerCapture){try{activeDeckStage.setPointerCapture(event.pointerId)}catch(_){}}
    event.preventDefault();
  }

  function moveDeckDrag(event){
    if(!deckDragState||event.pointerId!==deckDragState.pointerId)return;
    deckOffsetX=deckDragState.offsetX+(event.clientX-deckDragState.startX);
    deckOffsetY=deckDragState.offsetY+(event.clientY-deckDragState.startY);
    const now=performance.now(),dt=Math.max(1,now-deckDragState.lastTime),vx=(event.clientX-deckDragState.lastX)/dt;
    deckRotationDeg=Math.max(-10,Math.min(10,vx*10));
    deckDragState.lastX=event.clientX;deckDragState.lastTime=now;
    deckRotation.value=String(Math.round(deckRotationDeg));
    applyDeckPosition({snap:false});
    event.preventDefault();
  }

  function endDeckDrag(event){
    if(!deckDragState||event.pointerId!==deckDragState.pointerId)return;
    deckDragState=null;activeDeckStage.classList.remove("dragging");deckMotionTrail.classList.remove("show");
    if(activeDeckStage.releasePointerCapture){try{activeDeckStage.releasePointerCapture(event.pointerId)}catch(_){}}
    const nearest=nearestAnchor();
    if(nearest&&nearest.distance<34){deckOffsetX=nearest.x;deckOffsetY=nearest.y;}
    applyDeckPosition({snap:true});
  }

  function handleDeckKeyboard(event){
    if(!manualDeckMove.checked||running)return;
    if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","[","]"].includes(event.key))return;
    const step=event.shiftKey?30:10;
    if(event.key==="ArrowUp")moveDeckBy(0,-step);
    if(event.key==="ArrowDown")moveDeckBy(0,step);
    if(event.key==="ArrowLeft")moveDeckBy(-step,0);
    if(event.key==="ArrowRight")moveDeckBy(step,0);
    if(event.key==="Home")resetDeckPosition();
    if(event.key==="["){deckRotationDeg-=2;deckRotation.value=String(Math.round(deckRotationDeg));applyDeckPosition();}
    if(event.key==="]"){deckRotationDeg+=2;deckRotation.value=String(Math.round(deckRotationDeg));applyDeckPosition();}
    event.preventDefault();
  }


  function updateActiveDeckStage(deckIndex=Number(activeDeckSelect.value)||0){
    const skin=skinData();
    const cards=decks[deckIndex]||[];

    activeDeckTitle.textContent=`TALIA ${deckIndex+1} · ${cards.length} KART`;
    activeDeckCount.textContent=String(cards.length);
    activeDeckCards.innerHTML="";

    if(cards.length){
      // Każda fizycznie istniejąca karta w wybranej talii ma osobny element DOM.
      // Przy małej talii krawędzie są mocno rozdzielone; przy dużej stos się kompresuje.
      const maxSpread=36;
      const step=cards.length<=1
        ? 0
        : Math.min(6,Math.max(.45,maxSpread/(cards.length-1)));

      cards.forEach((card,i)=>{
        const el=document.createElement("div");
        el.className=`mini-card${i===cards.length-1?" top-card":""}`;
        el.title=card.name;
        el.dataset.participantIndex=String(card.index);

        const centered=i-(cards.length-1)/2;
        const x=Math.max(-7,Math.min(7,centered*.34));
        const y=i*step;
        const rot=Math.max(-2.8,Math.min(2.8,centered*.11));

        el.style.background=skin.back;
        el.style.borderColor=skin.edge;
        el.style.zIndex=String(i+1);
        el.style.transform=`translate(${x}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
        activeDeckCards.appendChild(el);
      });
    }else{
      const empty=document.createElement("div");
      empty.className="empty-mark";
      empty.textContent="pusta";
      activeDeckCards.appendChild(empty);
    }

    drawOriginCard.style.background=skin.back;
    drawOriginCard.style.borderColor=skin.edge;
  }

  function animateFromDeckToReveal(deckIndex){
    return new Promise(resolve=>{
      updateActiveDeckStage(deckIndex);

      const stageRect=centerStage.getBoundingClientRect();
      const topCard=activeDeckCards.querySelector(".top-card");
      const topRect=topCard?.getBoundingClientRect() || activeDeckCards.getBoundingClientRect();
      const revealRect=revealCard.getBoundingClientRect();

      // Ghost starts exactly on the physical top card.
      const startCenterX=topRect.left+topRect.width/2-stageRect.left;
      const startCenterY=topRect.top+topRect.height/2-stageRect.top;

      const targetCenterX=stageRect.width/2;
      const targetCenterY=Math.max(145,revealRect.top+revealRect.height/2-stageRect.top);

      drawOriginCard.style.width=`${topRect.width || 92}px`;
      drawOriginCard.style.height=`${topRect.height || 132}px`;
      drawOriginCard.style.left=`${startCenterX}px`;
      drawOriginCard.style.top=`${startCenterY-(topRect.height || 132)/2}px`;
      drawOriginCard.style.bottom="auto";
      drawOriginCard.style.translate="-50% 0";
      drawOriginCard.style.opacity="1";

      if(topCard)topCard.style.opacity=".08";

      const dx=targetCenterX-startCenterX;
      const dy=targetCenterY-startCenterY;
      const ms=Math.max(220,Math.round(paceMs().reveal*.52));

      const keyframes=[
        {transform:"translate(0,0) rotate(0deg) scale(1)",opacity:1},
        {
          transform:`translate(${dx*.26}px,${dy*.23-24}px) rotate(-5deg) scale(1.035)`,
          opacity:1,
          offset:.30
        },
        {
          transform:`translate(${dx*.62}px,${dy*.58-42}px) rotate(4deg) scale(1.09)`,
          opacity:1,
          offset:.65
        },
        {
          transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(1.13)`,
          opacity:.98
        }
      ];

      if(drawOriginCard.animate){
        const anim=drawOriginCard.animate(
          keyframes,
          {duration:ms,easing:"cubic-bezier(.2,.78,.15,1)",fill:"forwards"}
        );
        anim.onfinish=()=>{
          drawOriginCard.style.opacity="0";
          resolve();
        };
      }else{
        setTimeout(()=>{
          drawOriginCard.style.opacity="0";
          resolve();
        },ms);
      }
    });
  }

  function setRevealSkin(){
    const skin=skinData();
    revealBack.style.background=skin.back;
    revealBack.style.borderColor=skin.edge;
    revealFront.style.background=skin.front;
    revealFront.style.color=skin.text;
    revealFront.style.borderColor=skin.edge;
    cardDeckBadge.style.color=skin.text;
    cardDeckBadge.style.borderColor=skin.edge;
    updateActiveDeckStage();
    applyCardPresentation();
  }

  function revealAnimation(card,assignment,sourceDeck){
    return new Promise(resolve=>{
      const ms=paceMs().reveal;
      setRevealSkin();

      stageDeckLabel.textContent=`TALIA ${sourceDeck+1}`;
      stageDestinationLabel.textContent=assignment.label.toUpperCase();
      cardDeckBadge.textContent=`Talia ${sourceDeck+1}`;

      revealCard.className="reveal-card visible";
      centerStage.classList.remove("is-revealing");
      cardOrder.textContent=`#${results.length+1}`;
      cardName.textContent=card.name;
      cardAssignment.textContent=assignment.label;
      revealCard.style.setProperty("--anim-ms",`${ms}ms`);

      void revealCard.offsetWidth;
      centerStage.classList.add("is-revealing");
      revealCard.classList.add(chosenRevealClass());

      setTimeout(burstParticles,Math.max(100,ms*.54));
      setTimeout(()=>{
        centerStage.classList.remove("is-revealing");
        resolve();
      },ms+90);
    });
  }

  function flyToAssignment(card,assignment,index){
    return new Promise(resolve=>{
      const target=assignmentGrid.querySelector(`[data-assignment-index="${index}"]`);
      if(!target){resolve();return}
      const from=revealCard.getBoundingClientRect(), to=target.getBoundingClientRect();
      const skin=skinData();
      const ghost=document.createElement("div");
      ghost.className="flying-transfer";
      ghost.style.left=`${from.left+from.width/2-75}px`;
      ghost.style.top=`${from.top+from.height/2-39}px`;
      ghost.style.background=skin.front;
      ghost.style.color=skin.text;
      ghost.style.border=`1px solid ${skin.edge}`;
      ghost.innerHTML=`<span style="font-size:.64rem;opacity:.65;margin-bottom:3px">TALIA ${Number(activeDeckSelect.value)+1}</span>${card.name}<small>${assignment.label}</small>`;
      document.body.appendChild(ghost);

      const dx=(to.left+to.width/2)-(from.left+from.width/2);
      const dy=(to.top+to.height/2)-(from.top+from.height/2);
      const ms=paceMs().transfer;
      let keyframes;
      if(transferStyle.value==="straight"){
        keyframes=[{transform:"translate(0,0) scale(1)",opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.52)`,opacity:.3}];
      }else if(transferStyle.value==="snap"){
        keyframes=[{transform:"translate(0,0) scale(1)",opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.45)`,opacity:.15}];
      }else{
        keyframes=[
          {transform:"translate(0,0) scale(1)",opacity:1},
          {transform:`translate(${dx*.45}px,${dy*.35-90}px) scale(.9)`,opacity:.95,offset:.48},
          {transform:`translate(${dx}px,${dy}px) scale(.5)`,opacity:.2}
        ];
      }
      const duration=transferStyle.value==="snap"?Math.max(150,ms*.55):ms;
      if(ghost.animate){
        const anim=ghost.animate(keyframes,{duration,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"});
        anim.onfinish=()=>{ghost.remove();resolve()};
      }else{
        setTimeout(()=>{ghost.remove();resolve()},duration);
      }
    });
  }

  function findNextNonEmptyDeck(start=0){
    for(let step=0;step<decks.length;step++){
      const d=(start+step)%decks.length;
      if(decks[d]?.length)return d;
    }
    return -1;
  }

  async function drawOne(){
    if(running || mixingDecks || deckSwapAnimating || results.length>=names.length)return;
    let d=Number(activeDeckSelect.value)||0;
    if(!decks[d]?.length){
      const next=findNextNonEmptyDeck(d+1);
      if(next<0)return;
      d=next;
      activeDeckSelect.value=String(d);
    }

    running=true;
    setLocked(true);

    const card=decks[d][decks[d].length-1];
    const assignment=plan[results.length];

    renderDecks();

    revealCard.className="reveal-card";
    centerStage.classList.remove("is-revealing");
    drawOriginCard.style.opacity="0";

    engineState.textContent=`Pobieranie karty z Talii ${d+1}…`;
    statusBox.innerHTML=`<strong>Talia ${d+1}.</strong> Górna karta opuszcza stos.`;

    await animateFromDeckToReveal(d);

    // Dopiero po fizycznym wyjściu karty usuwamy ją z talii.
    decks[d].pop();
    renderDecks();

    engineState.textContent=`Odkrywanie karty z Talii ${d+1}…`;
    await revealAnimation(card,assignment,d);
    await flyToAssignment(card,assignment,results.length);

    /* Reveal zakończony — karta nie może zostać
       wisząca na środku sceny. */
    revealCard.className="reveal-card";
    centerStage.classList.remove("is-revealing");
    drawOriginCard.style.opacity="0";

    results.push({
      name:card.name,
      participantIndex:card.index,
      sourceDeck:d,
      engineDetail:`Talia ${d+1}`
    });

    progressFill.style.width=`${results.length/names.length*100}%`;
    updateAssignmentBoard();
    renderResults();
    persist();
    renderDecks();

    statusBox.innerHTML=`<strong>${card.name}</strong> z Talii ${d+1} → ${assignment.label}.`;
    engineState.textContent=results.length===names.length?"Losowanie zakończone.":`Wylosowano ${results.length}/${names.length}.`;
    running=false;
    setLocked(false);
    updateSummary();

    if(results.length===names.length){
      autoMode=false;
      autoBtn.textContent="Losuj automatycznie";
      drawBtn.disabled=true;
      resultsPanel.open=true;
    }else if(autoMode){
      const next=findNextNonEmptyDeck(d);
      if(next>=0)activeDeckSelect.value=String(next);
      autoTimer=setTimeout(drawOne,paceMs().auto);
    }
  }

  function setLocked(temp){
    const structural=temp || results.length>0;
    [participantCount,format,groupCount,seed,participantsInput,generateBtn,randomSeedBtn,applyBtn,deckCountInput,manualPanel,evenDistributeBtn,randomDistributeBtn,applyManualBtn]
      .forEach(el=>{if("disabled" in el)el.disabled=structural});
    manualRows.querySelectorAll("select").forEach(el=>el.disabled=structural);
    pace.disabled=temp;
    activeDeckSelect.disabled=temp;
    manualDeckMove.disabled=temp;
    [deckMoveUp,deckMoveDown,deckMoveLeft,deckMoveRight,deckMoveReset,
      deckPresetLeft,deckPresetCenter,deckPresetMiddle,deckPresetRight].forEach(btn=>btn.disabled=temp);
    deckSnapGrid.disabled=temp;
    deckRotation.disabled=temp;
    deckScale.disabled=temp;
    if(temp)activeDeckStage.classList.remove("dragging");
    drawBtn.disabled=temp || results.length>=names.length;
    shuffleAllBtn.disabled=temp || results.length>0;
    mixBtn.disabled=temp || decks.length<2;
    summaryStatus.textContent=temp?"Losowanie…":results.length?`W toku · ${results.length}/${names.length}`:"Gotowe";
  }

  function applyConfiguration(){
    if(running)return;
    clearTimeout(autoTimer);autoMode=false;autoBtn.textContent="Losuj automatycznie";
    names=parseNames();
    participantCount.value=names.length;
    participantsInput.value=names.join("\n");
    deckCountInput.value=getDeckCount();
    plan=TDS.buildAssignmentPlan(currentConfig());
    results=[];
    shuffleCounter=0;mixCounter=0;
    deckTransforms.clear();
    deckOffsetX=0;deckOffsetY=0;deckRotationDeg=0;deckScaleValue=1;
    deckRotation.value="0";deckScale.value="100";
    defaultAssignments();
    buildDecksFromAssignments({shuffle:true});
    buildManualEditor();
    buildAssignmentBoard();
    revealCard.className="reveal-card";
    resetDeckPosition();
    setManualDeckMove(manualDeckMove.checked);
    stageDeckLabel.textContent="TALIA —";
    stageDestinationLabel.textContent=plan[0]?.label?.toUpperCase() || "OCZEKUJE";
    progressFill.style.width="0%";
    engineState.textContent="Talie przygotowane.";
    statusBox.innerHTML=`<strong>Gotowe.</strong> ${decks.length} talii, ${names.length} kart.`;
    renderDecks();
    renderResults();
    updateSummary();
    setRevealSkin();
    applyCardPresentation();
    setLocked(false);
  }

  function shuffleAll(){
    if(running || results.length)return;
    decks=decks.map((cards,d)=>shuffleArray(cards,`all-${d}-${shuffleCounter++}`));
    renderDecks();
    statusBox.innerHTML="<strong>Potasowano wszystkie talie.</strong>";
  }


  function mixSleep(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function mixAnimate(element,keyframes,options){
    return new Promise(resolve=>{
      if(!element?.animate){
        setTimeout(resolve,options.duration||0);
        return;
      }

      const animation=element.animate(keyframes,options);

      animation.onfinish=resolve;
      animation.oncancel=resolve;
    });
  }

  function getGridStackRect(deckIndex){
    const box=decksGrid.querySelector(
      `.deck-box[data-deck="${deckIndex}"]`
    );

    const stack=box?.querySelector(".physical-stack");

    return stack?.getBoundingClientRect()
      || box?.getBoundingClientRect()
      || null;
  }

  function createMixStackGhost({
    rect,
    count,
    label,
    skin,
    layer,
    className="mix-stack-ghost"
  }){
    const ghost=document.createElement("div");

    ghost.className=className;

    ghost.style.left=`${rect.left}px`;
    ghost.style.top=`${rect.top}px`;
    ghost.style.width=`${rect.width}px`;
    ghost.style.height=`${rect.height}px`;

    const visualCount=Math.max(
      1,
      Math.min(count || 1,14)
    );

    for(let i=0;i<visualCount;i++){
      const card=document.createElement("div");

      card.className="mix-stack-card";

      card.style.background=skin.back;
      card.style.borderColor=skin.edge;

      const spread=Math.min(24,visualCount*2);
      const step=visualCount<=1
        ? 0
        : spread/(visualCount-1);

      card.style.transform=
        `translateY(${(i*step).toFixed(2)}px)
         rotate(${((i%5)-2)*.25}deg)`;

      card.style.zIndex=String(i+1);

      ghost.appendChild(card);
    }

    const badge=document.createElement("div");

    badge.className="mix-stack-label";
    badge.textContent=label;

    ghost.appendChild(badge);
    layer.appendChild(ghost);

    return ghost;
  }

  function createMixDealCard({
    x,
    y,
    width,
    height,
    skin,
    layer
  }){
    const card=document.createElement("div");

    card.className="mix-deal-card";

    card.style.left=`${x-width/2}px`;
    card.style.top=`${y-height/2}px`;
    card.style.width=`${width}px`;
    card.style.height=`${height}px`;
    card.style.background=skin.back;
    card.style.borderColor=skin.edge;

    layer.appendChild(card);

    return card;
  }

  /* PHYSICAL_MOTION_V152B */

  async function animateDeckMergeAndDeal(
    a,
    b,
    nextA,
    nextB
  ){
    const rectA=getGridStackRect(a);
    const rectB=getGridStackRect(b);

    if(!rectA || !rectB)return;

    const boxA=
      decksGrid.querySelector(
        `.deck-box[data-deck="${a}"]`
      );

    const boxB=
      decksGrid.querySelector(
        `.deck-box[data-deck="${b}"]`
      );

    boxA?.classList.add(
      "physical-mix-source"
    );

    boxB?.classList.add(
      "physical-mix-source"
    );

    const layer=
      document.createElement("div");

    layer.className=
      "mix-animation-layer physical-mix-layer-v152b";

    document.body.appendChild(layer);

    const skin=skinData();

    const ax=
      rectA.left+rectA.width/2;

    const ay=
      rectA.top+rectA.height/2;

    const bx=
      rectB.left+rectB.width/2;

    const by=
      rectB.top+rectB.height/2;

    /*
      Najważniejsza zmiana:
      punkt mieszania znajduje się WYRAŹNIE NAD taliami.
    */

    const mixX=(ax+bx)/2;

    const mixY=
      Math.min(ay,by)-125;

    const ghostA=
      createMixStackGhost({
        rect:rectA,
        count:decks[a].length,
        label:`Talia ${a+1}`,
        skin,
        layer,
        className:
          "mix-stack-ghost physical-mix-ghost-v152b"
      });

    const ghostB=
      createMixStackGhost({
        rect:rectB,
        count:decks[b].length,
        label:`Talia ${b+1}`,
        skin,
        layer,
        className:
          "mix-stack-ghost physical-mix-ghost-v152b"
      });

    statusBox.innerHTML=
      "<strong>Podnoszenie talii…</strong>";

    /* FAZA 1 — obie talie odrywają się od stołu */

    await Promise.all([
      mixAnimate(
        ghostA,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          },
          {
            transform:
              "translate(0,-82px) rotate(-3deg) scale(1.06)"
          }
        ],
        {
          duration:320,
          easing:"cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      ),

      mixAnimate(
        ghostB,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          },
          {
            transform:
              "translate(0,-82px) rotate(3deg) scale(1.06)"
          }
        ],
        {
          duration:320,
          easing:"cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      )
    ]);

    statusBox.innerHTML=
      "<strong>Zbliżanie talii…</strong>";

    const dxA=mixX-ax;
    const dyA=mixY-ay;

    const dxB=mixX-bx;
    const dyB=mixY-by;

    /* FAZA 2 — talie zjeżdżają się wysoko nad stołem */

    await Promise.all([
      mixAnimate(
        ghostA,
        [
          {
            transform:
              "translate(0,-82px) rotate(-3deg) scale(1.06)"
          },
          {
            transform:
              `translate(
                ${dxA-24}px,
                ${dyA}px
              )
              rotate(-8deg)
              scale(1.08)`
          }
        ],
        {
          duration:360,
          easing:"cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      ),

      mixAnimate(
        ghostB,
        [
          {
            transform:
              "translate(0,-82px) rotate(3deg) scale(1.06)"
          },
          {
            transform:
              `translate(
                ${dxB+24}px,
                ${dyB}px
              )
              rotate(8deg)
              scale(1.08)`
          }
        ],
        {
          duration:360,
          easing:"cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      )
    ]);

    statusBox.innerHTML=
      "<strong>Tasowanie…</strong>";

    /*
      FAZA 3 — kilka ruchów przypominających
      wsuwanie dwóch połówek talii w siebie.
    */

    await Promise.all([
      mixAnimate(
        ghostA,
        [
          {
            transform:
              `translate(${dxA-24}px,${dyA}px)
               rotate(-8deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxA+10}px,${dyA-7}px)
               rotate(5deg) scale(1.1)`
          },
          {
            transform:
              `translate(${dxA-8}px,${dyA+5}px)
               rotate(-4deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxA+5}px,${dyA-3}px)
               rotate(3deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxA}px,${dyA}px)
               rotate(0deg) scale(1.06)`
          }
        ],
        {
          duration:620,
          easing:"ease-in-out",
          fill:"forwards"
        }
      ),

      mixAnimate(
        ghostB,
        [
          {
            transform:
              `translate(${dxB+24}px,${dyB}px)
               rotate(8deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxB-10}px,${dyB+7}px)
               rotate(-5deg) scale(1.1)`
          },
          {
            transform:
              `translate(${dxB+8}px,${dyB-5}px)
               rotate(4deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxB-5}px,${dyB+3}px)
               rotate(-3deg) scale(1.08)`
          },
          {
            transform:
              `translate(${dxB}px,${dyB}px)
               rotate(0deg) scale(1.06)`
          }
        ],
        {
          duration:620,
          easing:"ease-in-out",
          fill:"forwards"
        }
      )
    ]);

    ghostA.style.opacity="0";
    ghostB.style.opacity="0";

    /* Powstaje jeden wspólny stos nadal wysoko nad stołem */

    const mergedRect={
      left:mixX-rectA.width/2,
      top:mixY-rectA.height/2,
      width:rectA.width,
      height:rectA.height
    };

    const merged=
      createMixStackGhost({
        rect:mergedRect,
        count:
          nextA.length+
          nextB.length,
        label:"Mieszanie",
        skin,
        layer,
        className:
          "mix-stack-ghost physical-merged-v152b"
      });

    const flash=
      document.createElement("div");

    flash.className=
      "mix-merge-flash";

    flash.style.left=
      `${mixX}px`;

    flash.style.top=
      `${mixY}px`;

    layer.appendChild(flash);

    await Promise.all([
      mixAnimate(
        merged,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(.96)"
          },
          {
            transform:
              "translate(-11px,-3px) rotate(-5deg) scale(1.08)"
          },
          {
            transform:
              "translate(11px,3px) rotate(5deg) scale(1.08)"
          },
          {
            transform:
              "translate(-6px,0) rotate(-2deg) scale(1.04)"
          },
          {
            transform:
              "translate(6px,0) rotate(2deg) scale(1.04)"
          },
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          }
        ],
        {
          duration:560,
          easing:"ease-in-out",
          fill:"forwards"
        }
      ),

      mixAnimate(
        flash,
        [
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(.2)"
          },
          {
            opacity:.85,
            transform:
              "translate(-50%,-50%) scale(1)"
          },
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(2)"
          }
        ],
        {
          duration:500,
          easing:"ease-out",
          fill:"forwards"
        }
      )
    ]);

    statusBox.innerHTML=
      "<strong>Rozdawanie kart z powrotem…</strong>";

    /*
      Naprzemienne rozdawanie:
      A, B, A, B...
    */

    const queue=[];

    const maxLen=
      Math.max(
        nextA.length,
        nextB.length
      );

    for(let i=0;i<maxLen;i++){
      if(i<nextA.length){
        queue.push({
          target:rectA,
          side:-1
        });
      }

      if(i<nextB.length){
        queue.push({
          target:rectB,
          side:1
        });
      }
    }

    const total=queue.length;

    const stagger=
      Math.max(
        7,
        Math.min(
          26,
          780/Math.max(total,1)
        )
      );

    const dealPromises=[];

    queue.forEach(
      (entry,index)=>{
        const card=
          createMixDealCard({
            x:mixX,
            y:mixY,
            width:
              Math.max(
                32,
                rectA.width*.48
              ),
            height:
              Math.max(
                46,
                rectA.height*.52
              ),
            skin,
            layer
          });

        const tx=
          entry.target.left+
          entry.target.width/2;

        const ty=
          entry.target.top+
          entry.target.height/2;

        const dx=tx-mixX;
        const dy=ty-mixY;

        dealPromises.push(
          new Promise(resolve=>{
            setTimeout(()=>{
              mixAnimate(
                card,
                [
                  {
                    transform:
                      "translate(0,0) rotate(0deg) scale(.92)",
                    opacity:1
                  },
                  {
                    transform:
                      `translate(
                        ${dx*.48}px,
                        ${dy*.38-58}px
                      )
                      rotate(${entry.side*7}deg)
                      scale(1.02)`,
                    opacity:1,
                    offset:.5
                  },
                  {
                    transform:
                      `translate(
                        ${dx}px,
                        ${dy}px
                      )
                      rotate(0deg)
                      scale(.88)`,
                    opacity:.72
                  }
                ],
                {
                  duration:410,
                  easing:"cubic-bezier(.2,.76,.18,1)",
                  fill:"forwards"
                }
              ).then(resolve);
            },index*stagger);
          })
        );
      }
    );

    await mixAnimate(
      merged,
      [
        {
          opacity:1,
          transform:"scale(1)"
        },
        {
          opacity:.08,
          transform:"translateY(10px) scale(.78)"
        }
      ],
      {
        duration:
          Math.min(
            650,
            260+
            total*stagger*.3
          ),
        easing:"ease-in",
        fill:"forwards"
      }
    );

    await Promise.all(dealPromises);

    layer.remove();

    /*
      Nie odkrywamy starych stosów tutaj.
      mixTwoDecks() zaraz podmieni dane i wykona renderDecks(),
      więc unikamy mignięcia starego układu.
    */
  }

  async function mixTwoDecks(){
    if(
      running ||
      autoMode ||
      mixingDecks ||
      decks.length<2
    ){
      return;
    }

    const a=Number(mixDeckA.value);
    const b=Number(mixDeckB.value);

    if(a===b){
      statusBox.innerHTML=
        "<strong>Wybierz dwie różne talie.</strong>";
      return;
    }

    mixingDecks=true;

    setLocked(true);

    summaryStatus.textContent="Mieszanie…";

    const combined=shuffleArray(
      [...decks[a],...decks[b]],
      `mix-${a}-${b}-${mixCounter++}`
    );

    const firstSize=Math.ceil(
      combined.length/2
    );

    const nextA=combined.slice(
      0,
      firstSize
    );

    const nextB=combined.slice(
      firstSize
    );

    try{
      await animateDeckMergeAndDeal(
        a,
        b,
        nextA,
        nextB
      );
    }catch(error){
      console.error(
        "Animacja mieszania:",
        error
      );
    }

    decks[a]=nextA;
    decks[b]=nextB;

    decks[a].forEach(card=>{
      assignments[card.index]=a;
    });

    decks[b].forEach(card=>{
      assignments[card.index]=b;
    });

    buildManualEditor();
    renderDecks();

    statusBox.innerHTML=
      `<strong>Połączono, przetasowano i rozdano Talie ${a+1} i ${b+1}.</strong> Nowy podział: ${decks[a].length}/${decks[b].length}.`;

    mixingDecks=false;

    setLocked(false);
  }

  function applyManual(){
    if(running || results.length)return;
    readManualAssignments();
    buildDecksFromAssignments({shuffle:true});
    renderDecks();
    buildManualEditor();
    statusBox.innerHTML="<strong>Zastosowano ręczne rozmieszczenie graczy.</strong>";
  }

  function evenDistribute(){
    if(results.length || running)return;
    defaultAssignments();
    buildManualEditor();
    buildDecksFromAssignments({shuffle:false});
    renderDecks();
    statusBox.innerHTML="<strong>Rozłożono graczy równo między talie.</strong>";
  }
  function distributeRandomly(){
    if(results.length || running)return;
    randomAssignments();
    buildManualEditor();
    buildDecksFromAssignments({shuffle:false});
    renderDecks();
    statusBox.innerHTML="<strong>Losowo rozłożono graczy między talie.</strong>";
  }

  function snapshot(){
    return TDS.buildResultEnvelope({
      engineId:ENGINE_ID,
      engineVersion:ENGINE_VERSION,
      config:currentConfig(),
      participants:[...names],
      order:results.map(r=>({
        name:r.name,
        participantIndex:r.participantIndex,
        engineDetail:`Talia ${r.sourceDeck+1}`
      })),
      engineData:{
        cards:{
          deckCount:decks.length,
          skin:skinSelect.value,
          cardArtStyle:cardArtStyle.value,
          nameStyle:nameStyle.value,
          revealStyle:revealStyle.value,
          transferStyle:transferStyle.value,
          manualDeckMove:manualDeckMove.checked,
          snapDeckPosition:deckSnapGrid.checked,
          activeDeckPosition:{
            x:Math.round(deckOffsetX),y:Math.round(deckOffsetY),
            rotation:Math.round(deckRotationDeg),scale:Number(deckScaleValue.toFixed(2))
          },
          deckTransforms:[...deckTransforms.entries()].map(([deck,t])=>({
            deck:deck+1,x:Math.round(t.x),y:Math.round(t.y),rotation:Math.round(t.rotation),scale:Number(t.scale.toFixed(2))
          })),
          remainingDecks:decks.map((cards,d)=>({
            deck:d+1,
            count:cards.length,
            participants:cards.map(c=>({participantIndex:c.index,name:c.name}))
          })),
          draws:results.map((r,i)=>({
            drawOrder:i+1,
            participantIndex:r.participantIndex,
            name:r.name,
            sourceDeck:r.sourceDeck+1
          }))
        }
      }
    });
  }

  function persist(){
    try{localStorage.setItem("tds:v1:last:cards-multideck",JSON.stringify(snapshot()))}catch(_){}
  }

  function renderResults(){
    resultCount.textContent=String(results.length);
    resultsBody.innerHTML="";
    if(!results.length){
      resultsBody.innerHTML='<div class="hint">Jeszcze nic nie wylosowano.</div>';
    }else{
      const snap=snapshot();
      snap.results.order.forEach((item,i)=>{
        const row=document.createElement("div");
        row.className="result-row";
        row.innerHTML=`<span>#${item.drawOrder}</span><span>${item.name}</span><span>${item.assignment?.label||""}</span><span>Talia ${results[i].sourceDeck+1}</span>`;
        resultsBody.appendChild(row);
      });
    }
    [copyBtn,csvBtn,jsonBtn].forEach(btn=>btn.disabled=!results.length);
  }

  function downloadText(filename,content,type){
    const blob=new Blob([content],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),250);
  }
  async function copyResults(){
    if(!results.length)return;
    const snap=snapshot();
    const lines=snap.results.order.map((item,i)=>
      `${item.drawOrder}. ${item.name} → ${item.assignment?.label||""} · Talia ${results[i].sourceDeck+1}`
    );
    try{
      await navigator.clipboard.writeText(lines.join("\n"));
      statusBox.innerHTML="<strong>Skopiowano wyniki.</strong>";
    }catch(_){
      statusBox.innerHTML="<strong>Nie udało się skopiować.</strong> Użyj CSV lub JSON.";
    }
  }

  function resetAll(force=false){
    if(!force && results.length && performance.now()>resetArmedUntil){
      resetArmedUntil=performance.now()+3000;
      resetBtn.textContent="Kliknij ponownie — wyczyść wyniki";
      statusBox.innerHTML="<strong>Uwaga.</strong> Drugie kliknięcie wyczyści aktualne losowanie.";
      setTimeout(()=>{if(performance.now()>resetArmedUntil)resetBtn.textContent="Nowe losowanie"},3100);
      return;
    }
    resetArmedUntil=0;
    resetBtn.textContent="Nowe losowanie";
    applyConfiguration();
  }

  generateBtn.addEventListener("click",generateNames);
  participantCount.addEventListener("change",()=>{
    participantCount.value=clamp(Number(participantCount.value)||32,2,128);
  
  /* =====================================================
     ZARZĄDZANIE STRUKTURĄ TALII
  ===================================================== */

  let deckManagementPanel=null;
  let manageMergeA=null;
  let manageMergeB=null;
  let manageSplitDeck=null;
  let manageTargetCount=null;

  function structuralDeckOperationAllowed(){
    if(
      running ||
      autoMode ||
      mixingDecks ||
      deckSwapAnimating
    ){
      statusBox.innerHTML=
        "<strong>Poczekaj na zakończenie bieżącej animacji.</strong>";

      return false;
    }

    if(results.length){
      statusBox.innerHTML=
        "<strong>Zmiana struktury talii jest dostępna przed rozpoczęciem losowania.</strong>";

      return false;
    }

    return true;
  }

  function rebuildAssignmentsFromDecks(){
    decks.forEach((cards,deckIndex)=>{
      cards.forEach(card=>{
        assignments[card.index]=deckIndex;
      });
    });
  }

  function syncDeckCountControl(){
    try{
      if(
        typeof deckCountInput!=="undefined" &&
        deckCountInput
      ){
        deckCountInput.value=
          String(decks.length);
      }
    }catch(_){}

    const fallback=
      document.querySelector(
        '[data-tds-setting="deckCount"], #deckCount, #deckCountInput'
      );

    if(fallback){
      fallback.value=
        String(decks.length);
    }
  }

  function fillDeckSelect(
    select,
    preferredValue
  ){
    if(!select)return;

    const previous=
      preferredValue ??
      Number(select.value);

    select.innerHTML="";

    decks.forEach((cards,index)=>{
      const option=
        document.createElement("option");

      option.value=String(index);

      option.textContent=
        `Talia ${index+1} · ${cards.length} kart`;

      select.appendChild(option);
    });

    if(decks.length){
      select.value=
        String(
          Math.max(
            0,
            Math.min(
              Number.isFinite(previous)
                ? previous
                : 0,
              decks.length-1
            )
          )
        );
    }
  }

  function refreshDeckManagementPanel(){
    if(!deckManagementPanel)return;

    const oldA=
      Number(manageMergeA?.value);

    const oldB=
      Number(manageMergeB?.value);

    const oldSplit=
      Number(manageSplitDeck?.value);

    fillDeckSelect(
      manageMergeA,
      oldA
    );

    fillDeckSelect(
      manageMergeB,
      Number.isFinite(oldB)
        ? oldB
        : Math.min(1,decks.length-1)
    );

    fillDeckSelect(
      manageSplitDeck,
      oldSplit
    );

    if(
      manageMergeA &&
      manageMergeB &&
      decks.length>1 &&
      manageMergeA.value===
        manageMergeB.value
    ){
      manageMergeB.value=
        String(
          (Number(manageMergeA.value)+1)
          % decks.length
        );
    }

    if(manageTargetCount){
      manageTargetCount.value=
        String(decks.length);
    }

    const count=
      deckManagementPanel.querySelector(
        "[data-deck-management-count]"
      );

    if(count){
      count.textContent=
        `${decks.length} / 16 talii`;
    }
  }

  function finishStructuralDeckOperation(
    activeIndex
  ){
    deckTransforms.clear();

    rebuildAssignmentsFromDecks();

    syncDeckCountControl();

    updateDeckSelectors();

    const safeActive=
      Math.max(
        0,
        Math.min(
          activeIndex,
          decks.length-1
        )
      );

    activeDeckSelect.value=
      String(safeActive);

    buildManualEditor();

    renderDecks();

    updateNextTarget();

    stageDeckLabel.textContent=
      `TALIA ${safeActive+1}`;

    loadDeckTransform(
      safeActive
    );

    updateActiveDeckStage(
      safeActive
    );

    refreshDeckManagementPanel();
  }


  async function animatePermanentDeckMerge(
    a,
    b
  ){
    const rectA=getGridStackRect(a);
    const rectB=getGridStackRect(b);

    if(!rectA || !rectB){
      return;
    }

    const skin=skinData();

    const layer=
      document.createElement("div");

    layer.className=
      "mix-animation-layer permanent-merge-layer";

    document.body.appendChild(layer);

    const centerAX=
      rectA.left+rectA.width/2;

    const centerAY=
      rectA.top+rectA.height/2;

    const centerBX=
      rectB.left+rectB.width/2;

    const centerBY=
      rectB.top+rectB.height/2;

    const mergeX=
      (centerAX+centerBX)/2;

    const mergeY=
      (centerAY+centerBY)/2;

    const ghostA=createMixStackGhost({
      rect:rectA,
      count:decks[a].length,
      label:`Talia ${a+1}`,
      skin,
      layer
    });

    const ghostB=createMixStackGhost({
      rect:rectB,
      count:decks[b].length,
      label:`Talia ${b+1}`,
      skin,
      layer
    });

    const boxA=
      decksGrid.querySelector(
        `.deck-box[data-deck="${a}"]`
      );

    const boxB=
      decksGrid.querySelector(
        `.deck-box[data-deck="${b}"]`
      );

    boxA?.classList.add(
      "deck-structural-source"
    );

    boxB?.classList.add(
      "deck-structural-source"
    );

    statusBox.innerHTML=
      `<strong>Łączenie Talii ${a+1} i ${b+1}…</strong>`;

    await Promise.all([
      mixAnimate(
        ghostA,
        [
          {
            transform:
              "translate(0,0) scale(1)"
          },
          {
            transform:
              `translate(
                ${mergeX-centerAX}px,
                ${mergeY-centerAY}px
              )
              rotate(-6deg)
              scale(1.06)`
          }
        ],
        {
          duration:420,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      ),

      mixAnimate(
        ghostB,
        [
          {
            transform:
              "translate(0,0) scale(1)"
          },
          {
            transform:
              `translate(
                ${mergeX-centerBX}px,
                ${mergeY-centerBY}px
              )
              rotate(6deg)
              scale(1.06)`
          }
        ],
        {
          duration:420,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      )
    ]);

    ghostA.style.opacity="0";
    ghostB.style.opacity="0";

    const mergedRect={
      left:
        mergeX-rectA.width/2,

      top:
        mergeY-rectA.height/2,

      width:
        rectA.width,

      height:
        rectA.height
    };

    const merged=
      createMixStackGhost({
        rect:mergedRect,
        count:
          decks[a].length+
          decks[b].length,
        label:"Połączona talia",
        skin,
        layer,
        className:
          "mix-stack-ghost permanent-merged-stack"
      });

    const flash=
      document.createElement("div");

    flash.className=
      "mix-merge-flash";

    flash.style.left=
      `${mergeX}px`;

    flash.style.top=
      `${mergeY}px`;

    layer.appendChild(flash);

    await Promise.all([
      mixAnimate(
        merged,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(.95)"
          },
          {
            transform:
              "translate(-9px,-3px) rotate(-5deg) scale(1.06)"
          },
          {
            transform:
              "translate(9px,2px) rotate(5deg) scale(1.06)"
          },
          {
            transform:
              "translate(-5px,0) rotate(-2deg) scale(1.03)"
          },
          {
            transform:
              "translate(5px,0) rotate(2deg) scale(1.03)"
          },
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          }
        ],
        {
          duration:600,
          easing:"ease-in-out",
          fill:"forwards"
        }
      ),

      mixAnimate(
        flash,
        [
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(.25)"
          },
          {
            opacity:.9,
            transform:
              "translate(-50%,-50%) scale(1)"
          },
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(2)"
          }
        ],
        {
          duration:560,
          easing:"ease-out",
          fill:"forwards"
        }
      )
    ]);

    statusBox.innerHTML=
      `<strong>Tworzenie jednej wspólnej talii…</strong>`;

    const destinationX=
      centerAX-mergeX;

    const destinationY=
      centerAY-mergeY;

    await mixAnimate(
      merged,
      [
        {
          transform:
            "translate(0,0) scale(1)"
        },
        {
          transform:
            `translate(
              ${destinationX}px,
              ${destinationY}px
            )
            scale(.97)`,
          opacity:1
        }
      ],
      {
        duration:430,
        easing:
          "cubic-bezier(.2,.8,.18,1)",
        fill:"forwards"
      }
    );

    layer.remove();

    boxA?.classList.remove(
      "deck-structural-source"
    );

    boxB?.classList.remove(
      "deck-structural-source"
    );
  }


  async function permanentMergeDecks(){
    if(
      !structuralDeckOperationAllowed()
    ){
      return;
    }

    if(decks.length<2){
      statusBox.innerHTML=
        "<strong>Potrzebujesz co najmniej dwóch talii.</strong>";

      return;
    }

    const a=
      Number(manageMergeA.value);

    const b=
      Number(manageMergeB.value);

    if(a===b){
      statusBox.innerHTML=
        "<strong>Wybierz dwie różne talie.</strong>";

      return;
    }

    const activeBefore=
      Number(activeDeckSelect.value);

    mixingDecks=true;

    setLocked(true);

    try{
      await animatePermanentDeckMerge(
        a,
        b
      );
    }catch(error){
      console.error(
        "Animacja trwałego łączenia:",
        error
      );
    }

    const combined=
      shuffleArray(
        [
          ...decks[a],
          ...decks[b]
        ],
        `permanent-merge-${a}-${b}-${mixCounter++}`
      );

    decks[a]=combined;

    decks.splice(
      b,
      1
    );

    let finalMergedIndex=a;

    if(b<a){
      finalMergedIndex=a-1;
    }

    let nextActive=
      activeBefore;

    if(
      activeBefore===a ||
      activeBefore===b
    ){
      nextActive=
        finalMergedIndex;
    }else if(
      activeBefore>b
    ){
      nextActive=
        activeBefore-1;
    }

    finishStructuralDeckOperation(
      nextActive
    );

    mixingDecks=false;

    setLocked(false);

    statusBox.innerHTML=
      `<strong>Połączono Talie ${a+1} i ${b+1} na stałe.</strong> Nowa talia ma ${combined.length} kart. Łącznie: ${decks.length} talii.`;
  }


  async function animateDeckSplitIntoTwo(
    source,
    totalCount,
    firstCount,
    secondCount,
    oldRect
  ){
    const boxA=
      decksGrid.querySelector(
        `.deck-box[data-deck="${source}"]`
      );

    const boxB=
      decksGrid.querySelector(
        `.deck-box[data-deck="${source+1}"]`
      );

    const stackA=
      boxA?.querySelector(
        ".physical-stack"
      );

    const stackB=
      boxB?.querySelector(
        ".physical-stack"
      );

    if(
      !stackA ||
      !stackB
    ){
      return;
    }

    const rectA=
      stackA.getBoundingClientRect();

    const rectB=
      stackB.getBoundingClientRect();

    boxA.classList.add(
      "deck-split-target-hidden"
    );

    boxB.classList.add(
      "deck-split-target-hidden"
    );

    await new Promise(resolve=>
      requestAnimationFrame(resolve)
    );

    const skin=skinData();

    const layer=
      document.createElement("div");

    layer.className=
      "mix-animation-layer split-animation-layer";

    document.body.appendChild(layer);

    const oldCenterX=
      oldRect.left+
      oldRect.width/2;

    const oldCenterY=
      oldRect.top+
      oldRect.height/2;

    const sourceGhost=
      createMixStackGhost({
        rect:oldRect,
        count:totalCount,
        label:`Talia ${source+1}`,
        skin,
        layer,
        className:
          "mix-stack-ghost split-source-stack"
      });

    statusBox.innerHTML=
      `<strong>Tasowanie Talii ${source+1} przed podziałem…</strong>`;

    /* podniesienie + krótkie tasowanie */

    await mixAnimate(
      sourceGhost,
      [
        {
          transform:
            "translate(0,0) rotate(0deg) scale(1)"
        },
        {
          transform:
            "translate(0,-42px) rotate(-4deg) scale(1.05)"
        },
        {
          transform:
            "translate(-9px,-42px) rotate(4deg) scale(1.06)"
        },
        {
          transform:
            "translate(9px,-42px) rotate(-3deg) scale(1.06)"
        },
        {
          transform:
            "translate(0,-42px) rotate(0deg) scale(1.04)"
        }
      ],
      {
        duration:560,
        easing:"ease-in-out",
        fill:"forwards"
      }
    );

    statusBox.innerHTML=
      `<strong>Dzielenie Talii ${source+1}: ${firstCount} + ${secondCount}…</strong>`;

    const liftedRect={
      left:oldRect.left,
      top:oldRect.top-42,
      width:oldRect.width,
      height:oldRect.height
    };

    const ghostA=
      createMixStackGhost({
        rect:liftedRect,
        count:firstCount,
        label:`Talia ${source+1} · ${firstCount}`,
        skin,
        layer,
        className:
          "mix-stack-ghost split-half-stack"
      });

    const ghostB=
      createMixStackGhost({
        rect:liftedRect,
        count:secondCount,
        label:`Talia ${source+2} · ${secondCount}`,
        skin,
        layer,
        className:
          "mix-stack-ghost split-half-stack"
      });

    sourceGhost.style.opacity="0";

    ghostA.style.transform=
      "translateX(-7px) rotate(-3deg)";

    ghostB.style.transform=
      "translateX(7px) rotate(3deg)";

    const flash=
      document.createElement("div");

    flash.className=
      "deck-split-flash";

    flash.style.left=
      `${oldCenterX}px`;

    flash.style.top=
      `${oldCenterY-20}px`;

    layer.appendChild(flash);

    const centerA={
      x:rectA.left+rectA.width/2,
      y:rectA.top+rectA.height/2
    };

    const centerB={
      x:rectB.left+rectB.width/2,
      y:rectB.top+rectB.height/2
    };

    const liftedCenter={
      x:oldCenterX,
      y:oldCenterY-42
    };

    const dxA=
      centerA.x-liftedCenter.x;

    const dyA=
      centerA.y-liftedCenter.y;

    const dxB=
      centerB.x-liftedCenter.x;

    const dyB=
      centerB.y-liftedCenter.y;

    await Promise.all([
      mixAnimate(
        ghostA,
        [
          {
            transform:
              "translate(-7px,0) rotate(-3deg) scale(1.02)"
          },
          {
            transform:
              `translate(
                ${dxA*.48-18}px,
                ${dyA*.42-42}px
              )
              rotate(-7deg)
              scale(1.06)`,
            offset:.52
          },
          {
            transform:
              `translate(
                ${dxA}px,
                ${dyA}px
              )
              rotate(0deg)
              scale(.96)`
          }
        ],
        {
          duration:620,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      ),

      mixAnimate(
        ghostB,
        [
          {
            transform:
              "translate(7px,0) rotate(3deg) scale(1.02)"
          },
          {
            transform:
              `translate(
                ${dxB*.48+18}px,
                ${dyB*.42-42}px
              )
              rotate(7deg)
              scale(1.06)`,
            offset:.52
          },
          {
            transform:
              `translate(
                ${dxB}px,
                ${dyB}px
              )
              rotate(0deg)
              scale(.96)`
          }
        ],
        {
          duration:620,
          easing:
            "cubic-bezier(.2,.8,.18,1)",
          fill:"forwards"
        }
      ),

      mixAnimate(
        flash,
        [
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(.2)"
          },
          {
            opacity:.9,
            transform:
              "translate(-50%,-50%) scale(1)"
          },
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(2)"
          }
        ],
        {
          duration:520,
          easing:"ease-out",
          fill:"forwards"
        }
      )
    ]);

    layer.remove();

    boxA.classList.remove(
      "deck-split-target-hidden"
    );

    boxB.classList.remove(
      "deck-split-target-hidden"
    );

    boxA.classList.add(
      "deck-split-arrived"
    );

    boxB.classList.add(
      "deck-split-arrived"
    );

    setTimeout(()=>{
      boxA.classList.remove(
        "deck-split-arrived"
      );

      boxB.classList.remove(
        "deck-split-arrived"
      );
    },420);
  }


  async function splitDeckRandomly(){
    if(
      !structuralDeckOperationAllowed()
    ){
      return;
    }

    if(decks.length>=16){
      statusBox.innerHTML=
        "<strong>Osiągnięto limit 16 talii.</strong>";

      return;
    }

    const source=
      Number(manageSplitDeck.value);

    const cards=
      decks[source];

    if(
      !cards ||
      cards.length<2
    ){
      statusBox.innerHTML=
        "<strong>Ta talia ma za mało kart, aby podzielić ją na dwie.</strong>";

      return;
    }

    const oldStack=
      decksGrid.querySelector(
        `.deck-box[data-deck="${source}"] .physical-stack`
      );

    const oldRect=
      oldStack?.getBoundingClientRect();

    if(!oldRect){
      return;
    }

    const activeBefore=
      Number(activeDeckSelect.value);

    const shuffled=
      shuffleArray(
        [...cards],
        `split-${source}-${mixCounter++}`
      );

    const firstSize=
      Math.ceil(
        shuffled.length/2
      );

    const first=
      shuffled.slice(
        0,
        firstSize
      );

    const second=
      shuffled.slice(
        firstSize
      );

    mixingDecks=true;

    setLocked(true);

    decks[source]=first;

    decks.splice(
      source+1,
      0,
      second
    );

    let nextActive=
      activeBefore;

    if(activeBefore>source){
      nextActive=
        activeBefore+1;
    }

    finishStructuralDeckOperation(
      nextActive
    );

    try{
      await animateDeckSplitIntoTwo(
        source,
        shuffled.length,
        first.length,
        second.length,
        oldRect
      );
    }catch(error){
      console.error(
        "Animacja dzielenia talii:",
        error
      );
    }

    mixingDecks=false;

    setLocked(false);

    statusBox.innerHTML=
      `<strong>Podzielono Talię ${source+1} na dwie.</strong> Nowy podział: ${first.length} + ${second.length}. Łącznie: ${decks.length} talii.`;
  }


  async function animateRedistributeAllDecks(
    oldDecks,
    sourceRects,
    nextDecks,
    shuffled
  ){
    const skin=skinData();

    const layer=
      document.createElement("div");

    layer.className=
      "mix-animation-layer redistribute-animation-layer";

    document.body.appendChild(layer);

    const validRects=
      sourceRects.filter(Boolean);

    if(!validRects.length){
      layer.remove();
      return;
    }

    const centerX=
      validRects.reduce(
        (sum,r)=>
          sum+r.left+r.width/2,
        0
      )/validRects.length;

    const centerY=
      validRects.reduce(
        (sum,r)=>
          sum+r.top+r.height/2,
        0
      )/validRects.length;

    const sourceGhosts=[];

    oldDecks.forEach(
      (cards,index)=>{
        const rect=
          sourceRects[index];

        if(!rect || !cards.length){
          return;
        }

        const ghost=
          createMixStackGhost({
            rect,
            count:cards.length,
            label:
              `Talia ${index+1}`,
            skin,
            layer,
            className:
              "mix-stack-ghost redistribute-source-stack"
          });

        sourceGhosts.push({
          ghost,
          rect,
          index
        });
      }
    );

    statusBox.innerHTML=
      "<strong>Zbieranie wszystkich talii…</strong>";

    /* Faza 1: wszystkie stosy do środka */

    await Promise.all(
      sourceGhosts.map(
        ({ghost,rect,index})=>{
          const cx=
            rect.left+rect.width/2;

          const cy=
            rect.top+rect.height/2;

          const dx=
            centerX-cx;

          const dy=
            centerY-cy;

          const side=
            index%2===0
              ? -1
              : 1;

          return mixAnimate(
            ghost,
            [
              {
                transform:
                  "translate(0,0) rotate(0deg) scale(1)",
                opacity:1
              },
              {
                transform:
                  `translate(
                    ${dx*.5}px,
                    ${dy*.42-30}px
                  )
                  rotate(${side*5}deg)
                  scale(1.04)`,
                opacity:1,
                offset:.5
              },
              {
                transform:
                  `translate(
                    ${dx}px,
                    ${dy}px
                  )
                  rotate(0deg)
                  scale(.94)`,
                opacity:.25
              }
            ],
            {
              duration:
                420+
                Math.min(index*18,130),
              easing:
                "cubic-bezier(.2,.8,.18,1)",
              fill:"forwards"
            }
          );
        }
      )
    );

    sourceGhosts.forEach(
      ({ghost})=>{
        ghost.style.opacity="0";
      }
    );

    const sampleRect=
      validRects[0];

    const mergedRect={
      left:
        centerX-
        sampleRect.width/2,

      top:
        centerY-
        sampleRect.height/2,

      width:
        sampleRect.width,

      height:
        sampleRect.height
    };

    const merged=
      createMixStackGhost({
        rect:mergedRect,
        count:shuffled.length,
        label:
          `${shuffled.length} kart`,
        skin,
        layer,
        className:
          "mix-stack-ghost redistribute-merged-stack"
      });

    const flash=
      document.createElement("div");

    flash.className=
      "redistribute-merge-flash";

    flash.style.left=
      `${centerX}px`;

    flash.style.top=
      `${centerY}px`;

    layer.appendChild(flash);

    statusBox.innerHTML=
      "<strong>Tasowanie wspólnego stosu…</strong>";

    /* Faza 2: tasowanie */

    await Promise.all([
      mixAnimate(
        merged,
        [
          {
            transform:
              "translate(0,0) rotate(0deg) scale(.94)"
          },
          {
            transform:
              "translate(-12px,-4px) rotate(-6deg) scale(1.07)"
          },
          {
            transform:
              "translate(12px,3px) rotate(6deg) scale(1.07)"
          },
          {
            transform:
              "translate(-8px,0) rotate(-4deg) scale(1.04)"
          },
          {
            transform:
              "translate(8px,0) rotate(4deg) scale(1.04)"
          },
          {
            transform:
              "translate(0,0) rotate(0deg) scale(1)"
          }
        ],
        {
          duration:650,
          easing:"ease-in-out",
          fill:"forwards"
        }
      ),

      mixAnimate(
        flash,
        [
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(.2)"
          },
          {
            opacity:.95,
            transform:
              "translate(-50%,-50%) scale(1)"
          },
          {
            opacity:0,
            transform:
              "translate(-50%,-50%) scale(2.2)"
          }
        ],
        {
          duration:600,
          easing:"ease-out",
          fill:"forwards"
        }
      )
    ]);

    /* Docelowe talie już istnieją w DOM,
       ale pozostają ukryte podczas rozdawania */

    const targetRects=
      nextDecks.map(
        (_,index)=>
          getGridStackRect(index)
      );

    const targetBoxes=
      nextDecks.map(
        (_,index)=>
          decksGrid.querySelector(
            `.deck-box[data-deck="${index}"]`
          )
      );

    targetBoxes.forEach(
      box=>
        box?.classList.add(
          "deck-redistribute-target-hidden"
        )
    );

    statusBox.innerHTML=
      `<strong>Rozdawanie ${shuffled.length} kart na ${nextDecks.length} talii…</strong>`;

    const cardWidth=
      Math.max(
        28,
        Math.min(
          58,
          sampleRect.width*.48
        )
      );

    const cardHeight=
      Math.max(
        40,
        Math.min(
          84,
          sampleRect.height*.56
        )
      );

    const total=
      shuffled.length;

    const stagger=
      Math.max(
        7,
        Math.min(
          28,
          950/Math.max(1,total)
        )
      );

    const targetOffsets=
      Array(
        nextDecks.length
      ).fill(0);

    const animations=[];

    shuffled.forEach(
      (card,index)=>{
        const targetIndex=
          index%nextDecks.length;

        const targetRect=
          targetRects[targetIndex];

        if(!targetRect){
          return;
        }

        const localIndex=
          targetOffsets[
            targetIndex
          ]++;

        const visualCard=
          createMixDealCard({
            x:centerX,
            y:centerY,
            width:cardWidth,
            height:cardHeight,
            skin,
            layer
          });

        const targetX=
          targetRect.left+
          targetRect.width/2;

        const targetY=
          targetRect.top+
          targetRect.height/2+
          Math.min(
            localIndex*1.1,
            18
          );

        const dx=
          targetX-centerX;

        const dy=
          targetY-centerY;

        const arc=
          -45-
          Math.min(
            50,
            Math.abs(dx)*.08
          );

        const rotation=
          (
            targetIndex-
            (nextDecks.length-1)/2
          )*1.5;

        const delay=
          index*stagger;

        animations.push(
          new Promise(resolve=>{
            setTimeout(()=>{
              mixAnimate(
                visualCard,
                [
                  {
                    transform:
                      "translate(0,0) rotate(0deg) scale(.9)",
                    opacity:1
                  },
                  {
                    transform:
                      `translate(
                        ${dx*.46}px,
                        ${dy*.38+arc}px
                      )
                      rotate(${rotation*.6}deg)
                      scale(1.04)`,
                    opacity:1,
                    offset:.48
                  },
                  {
                    transform:
                      `translate(
                        ${dx}px,
                        ${dy}px
                      )
                      rotate(${rotation}deg)
                      scale(.88)`,
                    opacity:.88
                  }
                ],
                {
                  duration:430,
                  easing:
                    "cubic-bezier(.2,.76,.18,1)",
                  fill:"forwards"
                }
              ).then(resolve);
            },delay);
          })
        );
      }
    );

    await mixAnimate(
      merged,
      [
        {
          opacity:1,
          transform:
            "translate(0,0) scale(1)"
        },
        {
          opacity:.18,
          transform:
            "translate(0,8px) scale(.82)"
        }
      ],
      {
        duration:
          Math.min(
            700,
            300+
            total*stagger*.35
          ),
        easing:"ease-in",
        fill:"forwards"
      }
    );

    await Promise.all(
      animations
    );

    layer.remove();

    targetBoxes.forEach(
      (box,index)=>{
        box?.classList.remove(
          "deck-redistribute-target-hidden"
        );

        setTimeout(()=>{
          box?.classList.add(
            "deck-redistribute-arrived"
          );

          setTimeout(()=>{
            box?.classList.remove(
              "deck-redistribute-arrived"
            );
          },420);
        },index*35);
      }
    );
  }


  async function redistributeAllDecks(){
    if(
      !structuralDeckOperationAllowed()
    ){
      return;
    }

    const targetCount=
      Math.max(
        1,
        Math.min(
          16,
          Number(
            manageTargetCount.value
          ) || decks.length
        )
      );

    const allCards=
      decks.flat();

    if(!allCards.length){
      statusBox.innerHTML=
        "<strong>Brak kart do rozdzielenia.</strong>";

      return;
    }

    const actualCount=
      Math.min(
        targetCount,
        allCards.length
      );

    const oldDecks=
      decks.map(
        deck=>[...deck]
      );

    const sourceRects=
      oldDecks.map(
        (_,index)=>
          getGridStackRect(index)
      );

    const shuffled=
      shuffleArray(
        [...allCards],
        `redistribute-${actualCount}-${mixCounter++}`
      );

    const nextDecks=
      Array.from(
        {length:actualCount},
        ()=>[]
      );

    shuffled.forEach(
      (card,index)=>{
        nextDecks[
          index%actualCount
        ].push(card);
      }
    );

    mixingDecks=true;

    setLocked(true);

    const activeBefore=
      Number(activeDeckSelect.value);

    /* Najpierw podmieniamy dane,
       żeby powstały docelowe miejsca,
       ale ukrywamy je w animacji. */

    decks=nextDecks;

    finishStructuralDeckOperation(
      Math.min(
        activeBefore,
        decks.length-1
      )
    );

    try{
      await animateRedistributeAllDecks(
        oldDecks,
        sourceRects,
        nextDecks,
        shuffled
      );
    }catch(error){
      console.error(
        "Animacja rozdzielania wszystkich talii:",
        error
      );
    }

    mixingDecks=false;

    setLocked(false);

    const sizes=
      decks
        .map(
          deck=>deck.length
        )
        .join(" / ");

    statusBox.innerHTML=
      `<strong>Przetasowano wszystkie pozostałe karty i rozdzielono je na ${decks.length} talii.</strong> Rozmiary: ${sizes}.`;
  }




  /* SIMPLE_DRAW_SOURCE_V156 */


  /* DRAW_FOCUS_V158 */


  /* DRAW_PROGRESS_V159 */

  function initDrawProgressV159(){
    if(
      document.querySelector(
        ".draw-progress-v159"
      )
    ){
      return;
    }

    const focusBar=
      document.querySelector(
        ".draw-focus-v158"
      );

    if(!focusBar){
      return;
    }

    const progress=
      document.createElement("div");

    progress.className=
      "draw-progress-v159";

    progress.innerHTML=`
      <div class="draw-progress-info-v159">

        <div class="draw-progress-main-v159">
          <span class="draw-progress-label-v159">
            POSTĘP
          </span>

          <strong data-progress-count>
            0 / 0
          </strong>
        </div>

        <div class="draw-progress-stat-v159">
          <span>Pozostało</span>
          <strong data-progress-remaining>0</strong>
        </div>

        <div class="draw-progress-stat-v159">
          <span>W aktywnej talii</span>
          <strong data-progress-deck>0</strong>
        </div>

      </div>

      <div
        class="draw-progress-track-v159"
        aria-hidden="true"
      >
        <div
          class="draw-progress-fill-v159"
          data-progress-fill
        ></div>
      </div>
    `;

    focusBar.insertAdjacentElement(
      "afterend",
      progress
    );

    const count=
      progress.querySelector(
        "[data-progress-count]"
      );

    const remaining=
      progress.querySelector(
        "[data-progress-remaining]"
      );

    const deckRemaining=
      progress.querySelector(
        "[data-progress-deck]"
      );

    const fill=
      progress.querySelector(
        "[data-progress-fill]"
      );

    function refreshProgress(){
      const total=
        Array.isArray(names)
          ? names.length
          : 0;

      const done=
        Array.isArray(results)
          ? results.length
          : 0;

      const left=
        Math.max(
          0,
          total-done
        );

      const deckIndex=
        Number(
          activeDeckSelect.value
        );

      const deckCount=
        decks[deckIndex]?.length || 0;

      const percent=
        total>0
          ? Math.min(
              100,
              Math.max(
                0,
                done/total*100
              )
            )
          : 0;

      count.textContent=
        `${done} / ${total}`;

      remaining.textContent=
        String(left);

      deckRemaining.textContent=
        String(deckCount);

      fill.style.width=
        `${percent}%`;

      progress.classList.toggle(
        "is-complete",
        total>0 && done>=total
      );

      progress.classList.toggle(
        "is-empty-deck",
        deckCount===0 && left>0
      );

      progress.setAttribute(
        "aria-label",
        `Wylosowano ${done} z ${total}. Pozostało ${left}. W aktywnej talii ${deckCount} kart.`
      );
    }

    activeDeckSelect.addEventListener(
      "change",
      ()=>{
        requestAnimationFrame(
          refreshProgress
        );
      }
    );

    const observer=
      new MutationObserver(()=>{
        requestAnimationFrame(
          refreshProgress
        );
      });

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true,
        characterData:true,
        attributes:true
      }
    );

    refreshProgress();
  }

  function initDrawFocusV158(){
    if(
      document.querySelector(
        ".draw-focus-v158"
      )
    ){
      return;
    }

    const originalDrawButton=
      [...document.querySelectorAll("button")]
        .find(button=>
          button.textContent
            .trim()
            .includes("Losuj kartę")
        );

    if(!originalDrawButton){
      return;
    }

    originalDrawButton.classList.add(
      "original-draw-button-v158"
    );

    const bar=
      document.createElement("div");

    bar.className=
      "draw-focus-v158";

    bar.innerHTML=`
      <div class="draw-focus-source-v158">
        <span class="draw-focus-label-v158">
          AKTYWNA TALIA
        </span>

        <div class="draw-focus-value-v158">
          <span class="draw-focus-dot-v158"></span>

          <strong data-focus-deck>
            Talia
          </strong>

          <span data-focus-count></span>
        </div>
      </div>

      <div class="draw-focus-arrow-v158">
        →
      </div>

      <div class="draw-focus-target-v158">
        <span class="draw-focus-label-v158">
          NASTĘPNY PRZYDZIAŁ
        </span>

        <strong data-focus-target>
          Oczekuje
        </strong>
      </div>

      <button
        type="button"
        class="draw-focus-button-v158"
      >
        Losuj kartę
      </button>
    `;

    centerStage.parentElement.insertBefore(
      bar,
      centerStage
    );

    const deckText=
      bar.querySelector(
        "[data-focus-deck]"
      );

    const countText=
      bar.querySelector(
        "[data-focus-count]"
      );

    const targetText=
      bar.querySelector(
        "[data-focus-target]"
      );

    const focusButton=
      bar.querySelector(
        ".draw-focus-button-v158"
      );

    function cleanTargetLabel(text){
      return String(text || "Oczekuje")
        .replace(
          /^GRUPAs+/i,
          "Grupa "
        )
        .replace(
          /s*·s*/g,
          " · "
        );
    }

    function refreshFocusBar(){
      const deckIndex=
        Number(
          activeDeckSelect.value
        );

      const count=
        decks[deckIndex]?.length || 0;

      deckText.textContent=
        `Talia ${deckIndex+1}`;

      countText.textContent=
        `${count} kart`;

      let target="";

      try{
        target=
          plan?.[results.length]?.label || "";
      }catch(_){}

      if(!target){
        target=
          stageDestinationLabel?.textContent ||
          "Oczekuje";
      }

      targetText.textContent=
        cleanTargetLabel(target);

      const disabled=
        originalDrawButton.disabled ||
        count<=0;

      focusButton.disabled=
        disabled;

      bar.classList.toggle(
        "is-disabled",
        disabled
      );

      if(count<=0){
        countText.textContent=
          "brak kart";
      }
    }

    focusButton.addEventListener(
      "click",
      ()=>{
        if(
          !focusButton.disabled
        ){
          originalDrawButton.click();
        }
      }
    );

    activeDeckSelect.addEventListener(
      "change",
      ()=>{
        requestAnimationFrame(
          refreshFocusBar
        );
      }
    );

    const observer=
      new MutationObserver(()=>{
        requestAnimationFrame(
          refreshFocusBar
        );
      });

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true,
        characterData:true,
        attributes:true,
        attributeFilter:[
          "disabled",
          "value"
        ]
      }
    );

    refreshFocusBar();
  }

  function initUsabilityV156(){
    if(
      document.querySelector(
        ".ux-active-deck-readout-v156"
      )
    ){
      return;
    }

    const readout=
      document.createElement("span");

    readout.className=
      "ux-active-deck-readout-v156";

    activeDeckSelect.classList.add(
      "ux-hide-active-select-v156"
    );

    activeDeckSelect.insertAdjacentElement(
      "afterend",
      readout
    );

    function refreshReadout(){
      const index=
        Number(
          activeDeckSelect.value
        );

      const count=
        decks[index]?.length || 0;

      readout.innerHTML=
        `
          <span class="ux-readout-dot-v156"></span>
          <strong>Talia ${index+1}</strong>
          <span>· ${count} kart</span>
        `;

      readout.title=
        `Aktywna Talia ${index+1}: ${count} kart`;
    }

    activeDeckSelect.addEventListener(
      "change",
      ()=>{
        requestAnimationFrame(
          refreshReadout
        );
      }
    );

    const observer=
      new MutationObserver(()=>{
        requestAnimationFrame(
          refreshReadout
        );
      });

    observer.observe(
      decksGrid,
      {
        childList:true,
        subtree:true
      }
    );

    refreshReadout();
  }

  function initUsabilityV15(){
    if(
      document.querySelector(
        ".ux-modebar"
      )
    ){
      return;
    }

    /* =================================================
       GÓRNY PASEK UX
    ================================================= */

    const modebar=
      document.createElement("div");

    modebar.className=
      "ux-modebar";

    modebar.innerHTML=`
      <button
        type="button"
        class="ux-active-summary"
        title="Przejdź do aktywnej talii"
      >
        <span class="ux-active-dot"></span>

        <span class="ux-active-summary-main">
          <strong data-ux-active-title>
            Aktywna talia
          </strong>

          <span data-ux-active-count>
          </span>
        </span>
      </button>

      <div
        class="ux-mode-switch"
        aria-label="Poziom interfejsu"
      >
        <button
          type="button"
          data-ux-simple
        >
          Prosty
        </button>

        <button
          type="button"
          data-ux-full
        >
          Pełny
        </button>
      </div>
    `;

    const guide=
      document.querySelector(
        ".draw-quick-guide"
      );

    if(guide){
      guide.parentElement.insertBefore(
        modebar,
        guide
      );
    }else{
      decksGrid.parentElement.insertBefore(
        modebar,
        decksGrid
      );
    }

    const simpleHint=
      document.createElement("div");

    simpleHint.className=
      "ux-simple-hint";

    simpleHint.innerHTML=
      `
        <strong>Obsługa:</strong>
        kliknij talię, aby ją wybrać
        <span>•</span>
        przeciągnij na inną, aby wymieszać
        <span>•</span>
        przeciągnij na środek, aby aktywować
      `;

    modebar.insertAdjacentElement(
      "afterend",
      simpleHint
    );

    const activeTitle=
      modebar.querySelector(
        "[data-ux-active-title]"
      );

    const activeCount=
      modebar.querySelector(
        "[data-ux-active-count]"
      );

    const simpleButton=
      modebar.querySelector(
        "[data-ux-simple]"
      );

    const fullButton=
      modebar.querySelector(
        "[data-ux-full]"
      );

    const activeSummary=
      modebar.querySelector(
        ".ux-active-summary"
      );

    /* =================================================
       AKTYWNA TALIA
    ================================================= */

    function refreshActiveSummary(){
      const index=
        Number(
          activeDeckSelect.value
        );

      const cards=
        decks[index] || [];

      activeTitle.textContent=
        `Aktywna: Talia ${index+1}`;

      activeCount.textContent=
        `${cards.length} kart`;
    }

    activeSummary.addEventListener(
      "click",
      ()=>{
        centerStage.scrollIntoView({
          behavior:"smooth",
          block:"center"
        });
      }
    );

    activeDeckSelect.addEventListener(
      "change",
      ()=>{
        requestAnimationFrame(
          refreshActiveSummary
        );
      }
    );

    const activeObserver=
      new MutationObserver(()=>{
        requestAnimationFrame(
          refreshActiveSummary
        );
      });

    activeObserver.observe(
      decksGrid,
      {
        childList:true,
        subtree:true
      }
    );

    /* =================================================
       TRYB PROSTY / PEŁNY
    ================================================= */

    function saveMode(mode){
      try{
        localStorage.setItem(
          "cards-ui-mode",
          mode
        );
      }catch(_){}
    }

    function loadMode(){
      try{
        return (
          localStorage.getItem(
            "cards-ui-mode"
          ) || "simple"
        );
      }catch(_){
        return "simple";
      }
    }

    function setMode(mode){
      const simple=
        mode!=="full";

      document.body.classList.toggle(
        "ux-simple-mode",
        simple
      );

      document.body.classList.toggle(
        "ux-full-mode",
        !simple
      );

      simpleButton.classList.toggle(
        "is-active",
        simple
      );

      fullButton.classList.toggle(
        "is-active",
        !simple
      );

      simpleButton.setAttribute(
        "aria-pressed",
        simple
          ? "true"
          : "false"
      );

      fullButton.setAttribute(
        "aria-pressed",
        !simple
          ? "true"
          : "false"
      );

      saveMode(
        simple
          ? "simple"
          : "full"
      );
    }

    simpleButton.addEventListener(
      "click",
      ()=>setMode("simple")
    );

    fullButton.addEventListener(
      "click",
      ()=>setMode("full")
    );

    /* =================================================
       ESC = ANULUJ PRZECIĄGANIE
    ================================================= */

    document.addEventListener(
      "keydown",
      event=>{
        if(
          event.key==="Escape" &&
          gridDeckDrag
        ){
          cancelGridDeckDrag();

          statusBox.innerHTML=
            "<strong>Anulowano przeciąganie talii.</strong>";
        }
      }
    );

    /* =================================================
       CZYTELNIEJSZE KOMUNIKATY
    ================================================= */

    function refreshStatusTone(){
      if(!statusBox)return;

      const text=
        statusBox.textContent
          .trim()
          .toLowerCase();

      statusBox.classList.remove(
        "ux-status-success",
        "ux-status-warning",
        "ux-status-neutral"
      );

      const warningWords=[
        "błąd",
        "brak",
        "nie można",
        "za mało",
        "limit",
        "poczekaj",
        "wybierz dwie różne"
      ];

      const successWords=[
        "jest teraz aktywna",
        "połączono",
        "podzielono",
        "przetasowano",
        "rozdzielono"
      ];

      if(
        warningWords.some(
          word=>text.includes(word)
        )
      ){
        statusBox.classList.add(
          "ux-status-warning"
        );
      }else if(
        successWords.some(
          word=>text.includes(word)
        )
      ){
        statusBox.classList.add(
          "ux-status-success"
        );
      }else{
        statusBox.classList.add(
          "ux-status-neutral"
        );
      }
    }

    const statusObserver=
      new MutationObserver(
        refreshStatusTone
      );

    statusObserver.observe(
      statusBox,
      {
        childList:true,
        subtree:true,
        characterData:true
      }
    );

    /* =================================================
       START
    ================================================= */

    setMode(
      loadMode()
    );

    refreshActiveSummary();
    refreshStatusTone();
  }

  function initUsabilityV14(){
    if(
      document.querySelector(
        ".draw-quick-guide"
      )
    ){
      return;
    }

    /* -----------------------------------------------
       Krótka instrukcja obsługi
    ----------------------------------------------- */

    const guide=
      document.createElement("div");

    guide.className=
      "draw-quick-guide";

    guide.innerHTML=`
      <div class="draw-guide-item">
        <span class="draw-guide-number">1</span>

        <span>
          <strong>Wybierz talię</strong>
          klikając ją
        </span>
      </div>

      <div class="draw-guide-item">
        <span class="draw-guide-number">2</span>

        <span>
          <strong>Przeciągnij na talię</strong>
          aby wymieszać
        </span>
      </div>

      <div class="draw-guide-item">
        <span class="draw-guide-number">3</span>

        <span>
          <strong>Przeciągnij na środek</strong>
          aby ustawić aktywną
        </span>
      </div>
    `;

    decksGrid.parentElement.insertBefore(
      guide,
      decksGrid
    );

    /* -----------------------------------------------
       Aktualna / pusta talia
    ----------------------------------------------- */

    function refreshDeckUX(){
      const active=
        Number(
          activeDeckSelect.value
        );

      decksGrid
        .querySelectorAll(
          ".deck-box"
        )
        .forEach(box=>{
          const index=
            Number(
              box.dataset.deck
            );

          const isActive=
            index===active;

          const isEmpty=
            !decks[index] ||
            decks[index].length===0;

          box.classList.toggle(
            "ux-active-deck",
            isActive
          );

          box.classList.toggle(
            "ux-empty-deck",
            isEmpty
          );

          box.setAttribute(
            "aria-selected",
            isActive
              ? "true"
              : "false"
          );

          box.title=
            isActive
              ? "Aktywna talia. Przeciągnij ją na inną talię, aby wymieszać."
              : "Kliknij, aby wybrać. Przeciągnij na inną talię, aby wymieszać, albo na środek, aby ustawić jako aktywną.";

          const head=
            box.querySelector(
              ".deck-head"
            );

          if(!head){
            return;
          }

          let activeBadge=
            head.querySelector(
              ".ux-active-badge"
            );

          if(
            isActive &&
            !activeBadge
          ){
            activeBadge=
              document.createElement(
                "span"
              );

            activeBadge.className=
              "ux-active-badge";

            activeBadge.textContent=
              "AKTYWNA";

            head.appendChild(
              activeBadge
            );
          }

          if(
            !isActive &&
            activeBadge
          ){
            activeBadge.remove();
          }

          let emptyBadge=
            head.querySelector(
              ".ux-empty-badge"
            );

          if(
            isEmpty &&
            !emptyBadge
          ){
            emptyBadge=
              document.createElement(
                "span"
              );

            emptyBadge.className=
              "ux-empty-badge";

            emptyBadge.textContent=
              "PUSTA";

            head.appendChild(
              emptyBadge
            );
          }

          if(
            !isEmpty &&
            emptyBadge
          ){
            emptyBadge.remove();
          }
        });
    }

    activeDeckSelect.addEventListener(
      "change",
      ()=>{
        requestAnimationFrame(
          refreshDeckUX
        );
      }
    );

    const decksObserver=
      new MutationObserver(()=>{
        requestAnimationFrame(
          refreshDeckUX
        );
      });

    decksObserver.observe(
      decksGrid,
      {
        childList:true
      }
    );

    /* -----------------------------------------------
       Uproszczenie panelu zaawansowanego
    ----------------------------------------------- */

    if(deckManagementPanel){
      deckManagementPanel.open=false;

      const summary=
        deckManagementPanel.querySelector(
          "summary"
        );

      const summaryName=
        summary?.querySelector(
          "span:first-child"
        );

      if(summaryName){
        summaryName.textContent=
          "Zaawansowane zarządzanie taliami";
      }

      const mergeButton=
        deckManagementPanel.querySelector(
          "[data-manage-merge]"
        );

      if(mergeButton){
        mergeButton.textContent=
          "Połącz talie";

        mergeButton.title=
          "Połącz dwie wybrane talie w jedną.";
      }

      const splitButton=
        deckManagementPanel.querySelector(
          "[data-manage-split-btn]"
        );

      if(splitButton){
        splitButton.textContent=
          "Podziel na 2";

        splitButton.title=
          "Losowo podziel wybraną talię na dwie możliwie równe części.";
      }

      const redistributeButton=
        deckManagementPanel.querySelector(
          "[data-manage-redistribute]"
        );

      if(redistributeButton){
        redistributeButton.textContent=
          "Rozdziel na N talii";

        redistributeButton.title=
          "Zbierz wszystkie karty, przetasuj i rozdziel możliwie równo.";
      }
    }

    /* -----------------------------------------------
       Mniej używane akcje chowamy
    ----------------------------------------------- */

    function findButton(text){
      return [
        ...document.querySelectorAll(
          "button"
        )
      ].find(button=>
        button.textContent
          .trim()
          .includes(text)
      );
    }

    const shuffleAll=
      findButton(
        "Potasuj wszystkie"
      );

    const mixTwo=
      findButton(
        "Wymieszaj 2 talie"
      );

    const extraButtons=
      [
        shuffleAll,
        mixTwo
      ].filter(Boolean);

    if(
      extraButtons.length &&
      !document.querySelector(
        ".ux-extra-actions"
      )
    ){
      const originalParent=
        extraButtons[0]
          .parentElement;

      const extra=
        document.createElement(
          "details"
        );

      extra.className=
        "ux-extra-actions";

      extra.innerHTML=`
        <summary>
          Więcej akcji
        </summary>

        <div
          class="ux-extra-actions-content"
        ></div>
      `;

      originalParent.insertAdjacentElement(
        "afterend",
        extra
      );

      const content=
        extra.querySelector(
          ".ux-extra-actions-content"
        );

      extraButtons.forEach(
        button=>{
          button.classList.add(
            "ux-secondary-action"
          );

          content.appendChild(
            button
          );
        }
      );
    }

    /* -----------------------------------------------
       Najważniejsza akcja
    ----------------------------------------------- */

    const drawButton=
      findButton(
        "Losuj kartę"
      );

    if(drawButton){
      drawButton.classList.add(
        "ux-main-draw-button"
      );

      drawButton.title=
        "Wylosuj jedną kartę z aktywnej talii.";
    }

    refreshDeckUX();
  }

  function initDeckManagementPanel(){
    if(deckManagementPanel)return;

    const panel=
      document.createElement("details");

    panel.className=
      "deck-management-panel";

    panel.innerHTML=`
      <summary>
        <span>
          Zarządzanie taliami
        </span>

        <span
          class="deck-management-count"
          data-deck-management-count
        ></span>
      </summary>

      <div class="deck-management-content">

        <section class="deck-management-card">
          <div class="deck-management-heading">
            Połącz na stałe
          </div>

          <div class="deck-management-row">
            <select
              data-manage-merge-a
            ></select>

            <span class="deck-management-plus">
              +
            </span>

            <select
              data-manage-merge-b
            ></select>
          </div>

          <button
            type="button"
            class="secondary"
            data-manage-merge
          >
            Połącz i przetasuj
          </button>

          <p>
            Dwie talie stają się jedną.
            Liczba talii zmniejsza się o 1.
          </p>
        </section>

        <section class="deck-management-card">
          <div class="deck-management-heading">
            Podziel talię
          </div>

          <div class="deck-management-row">
            <select
              data-manage-split
            ></select>
          </div>

          <button
            type="button"
            class="secondary"
            data-manage-split-btn
          >
            Podziel losowo na 2
          </button>

          <p>
            Karty są tasowane i dzielone
            możliwie równo.
          </p>
        </section>

        <section class="deck-management-card">
          <div class="deck-management-heading">
            Rozdziel wszystkie
          </div>

          <label class="deck-management-number">
            Liczba talii

            <input
              type="number"
              min="1"
              max="16"
              step="1"
              data-manage-target-count
            >
          </label>

          <button
            type="button"
            class="secondary"
            data-manage-redistribute
          >
            Przetasuj i rozdziel
          </button>

          <p>
            Wszystkie pozostałe karty.
            Różnica wielkości talii:
            maksymalnie 1 karta.
          </p>
        </section>

      </div>
    `;

    const parent=
      centerStage.parentElement;

    parent.insertBefore(
      panel,
      centerStage
    );

    deckManagementPanel=panel;

    manageMergeA=
      panel.querySelector(
        "[data-manage-merge-a]"
      );

    manageMergeB=
      panel.querySelector(
        "[data-manage-merge-b]"
      );

    manageSplitDeck=
      panel.querySelector(
        "[data-manage-split]"
      );

    manageTargetCount=
      panel.querySelector(
        "[data-manage-target-count]"
      );

    panel
      .querySelector(
        "[data-manage-merge]"
      )
      .addEventListener(
        "click",
        permanentMergeDecks
      );

    panel
      .querySelector(
        "[data-manage-split-btn]"
      )
      .addEventListener(
        "click",
        splitDeckRandomly
      );

    panel
      .querySelector(
        "[data-manage-redistribute]"
      )
      .addEventListener(
        "click",
        redistributeAllDecks
      );

    refreshDeckManagementPanel();

    const observer=
      new MutationObserver(()=>{
        refreshDeckManagementPanel();
      });

    observer.observe(
      decksGrid,
      {
        childList:true
      }
    );
  }

  generateNames();
  });
  format.addEventListener("change",updateSummary);
  groupCount.addEventListener("change",()=>{
    groupCount.value=clamp(Number(groupCount.value)||4,2,16);
    updateSummary();
  });
  pace.addEventListener("change",updateSummary);
  randomSeedBtn.addEventListener("click",randomSeed);
  applyBtn.addEventListener("click",applyConfiguration);
  resetBtn.addEventListener("click",()=>resetAll(false));
  deckCountInput.addEventListener("change",()=>{
    if(results.length)return;
    deckCountInput.value=getDeckCount();
    defaultAssignments();
    buildDecksFromAssignments({shuffle:true});
    buildManualEditor();renderDecks();
  });
  skinSelect.addEventListener("change",()=>{
    renderDecks();
    setRevealSkin();
  });

  manualDeckMove.addEventListener("change",()=>{
    setManualDeckMove(manualDeckMove.checked);
    statusBox.innerHTML=manualDeckMove.checked
      ? "<strong>Tryb układu włączony.</strong> Złap talię, użyj strzałek albo klawiatury."
      : "<strong>Tryb układu wyłączony.</strong> Pozycja talii została zachowana.";
  });
  deckSnapGrid.addEventListener("change",()=>{
    applyDeckPosition({snap:true});
  });

  deckMoveUp.addEventListener("click",()=>moveDeckBy(0,-10));
  deckMoveDown.addEventListener("click",()=>moveDeckBy(0,10));
  deckMoveLeft.addEventListener("click",()=>moveDeckBy(-10,0));
  deckMoveRight.addEventListener("click",()=>moveDeckBy(10,0));
  deckMoveReset.addEventListener("click",resetDeckPosition);

  deckPresetLeft.addEventListener("click",()=>setDeckPreset("left"));
  deckPresetCenter.addEventListener("click",()=>setDeckPreset("center"));
  deckPresetMiddle.addEventListener("click",()=>setDeckPreset("middle"));
  deckPresetRight.addEventListener("click",()=>setDeckPreset("right"));

  deckRotation.addEventListener("input",()=>{
    if(running)return;
    deckRotationDeg=Number(deckRotation.value)||0;
    applyDeckPosition();
  });
  deckScale.addEventListener("input",()=>{
    if(running)return;
    deckScaleValue=(Number(deckScale.value)||100)/100;
    applyDeckPosition();
  });

  activeDeckStage.addEventListener("pointerdown",startDeckDrag);
  activeDeckStage.addEventListener("pointermove",moveDeckDrag);
  activeDeckStage.addEventListener("pointerup",endDeckDrag);
  activeDeckStage.addEventListener("pointercancel",endDeckDrag);
  activeDeckStage.addEventListener("keydown",handleDeckKeyboard);
  activeDeckStage.addEventListener("dblclick",()=>{
    if(manualDeckMove.checked && !running)resetDeckPosition();
  });
  cardArtStyle.addEventListener("change",applyCardPresentation);
  nameStyle.addEventListener("change",applyCardPresentation);
  activeDeckSelect.addEventListener("change",()=>{
    const d=Number(activeDeckSelect.value)||0;
    loadDeckTransform(d);
    renderDecks();
    updateNextTarget();
    stageDeckLabel.textContent=`TALIA ${d+1}`;
    updateActiveDeckStage(d);
  });
  drawBtn.addEventListener("click",drawOne);
  autoBtn.addEventListener("click",()=>{
    autoMode=!autoMode;
    autoBtn.textContent=autoMode?"Zatrzymaj automat":"Losuj automatycznie";
    if(autoMode && !running && results.length<names.length)drawOne();
    else if(!autoMode)clearTimeout(autoTimer);
  });
  shuffleAllBtn.addEventListener("click",shuffleAll);
  showMixBtn.addEventListener("click",()=>{
    mixBar.style.display=mixBar.style.display==="none"?"flex":"none";
  });
  mixBtn.addEventListener("click",mixTwoDecks);
  evenDistributeBtn.addEventListener("click",evenDistribute);
  randomDistributeBtn.addEventListener("click",distributeRandomly);
  applyManualBtn.addEventListener("click",applyManual);
  presentationBtn.addEventListener("click",()=>{
    const on=document.body.classList.toggle("presentation");
    presentationBtn.textContent=on?"Pokaż ustawienia":"Tryb prezentacji";
  });
  resultsBtn.addEventListener("click",()=>{
    resultsPanel.open=!resultsPanel.open;
    resultsPanel.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  copyBtn.addEventListener("click",copyResults);
  csvBtn.addEventListener("click",()=>{
    if(results.length)downloadText("wyniki-talii-tds.csv",TDS.toCsv(snapshot()),"text/csv;charset=utf-8");
  });
  jsonBtn.addEventListener("click",()=>{
    if(results.length)downloadText("wyniki-talii-tds.json",JSON.stringify(snapshot(),null,2),"application/json;charset=utf-8");
  });

  window.addEventListener("resize",()=>applyDeckPosition({snap:false,save:false}));

  generateNames();
  applyConfiguration();
  initDeckManagementPanel();
  initUsabilityV14();
  initUsabilityV15();
  initUsabilityV156();
  initDrawFocusV158();
  initDrawProgressV159();
})();