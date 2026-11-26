(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const oe={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#a88cff",colorize:!1,density:100,blendMode:"normal",area:"full",zIndex:20,speed:100,intensity:100},js={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0};function ce(e){return{...e,capabilities:e.capabilities??js}}function H(e,t,a=0){return Math.max(a,Math.round(e*(t.density/100)))}const _s=`
.ae-rain-drop {
  position: absolute;
  top: -20%;
  width: 2px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(190, 225, 255, 0.9)
  );
  animation-name: ae-rainfall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes ae-rainfall {
  from {
    transform:
      translateY(-20vh)
      translateX(0);
  }

  to {
    transform:
      translateY(130vh)
      translateX(-40px);
  }
}
`.trim(),$s=`
.ae-snowflake {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    rgba(255, 255, 255, 1),
    rgba(225, 240, 255, 0.95) 45%,
    rgba(190, 215, 255, 0.7) 100%
  );
  box-shadow:
    0 0 5px rgba(255, 255, 255, 0.8),
    0 0 10px rgba(180, 220, 255, 0.35);
  animation-name: ae-snowfall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes ae-snowfall {
  from {
    transform:
      translateY(-15vh)
      translateX(0)
      rotate(0deg);
  }

  to {
    transform:
      translateY(135vh)
      translateX(var(--ae-snow-drift, 40px))
      rotate(var(--ae-snow-rotation, 360deg));
  }
}
`.trim(),Rs=`
.ae-lightning {
  position: absolute;
  width: 5px;
  height: 45%;
  background: linear-gradient(
    to bottom,
    transparent,
    white 15%,
    #8ceaff 50%,
    transparent
  );
  box-shadow:
    0 0 8px white,
    0 0 18px #79e3ff,
    0 0 36px #6f65ff;
  clip-path: polygon(
    45% 0,
    100% 0,
    62% 42%,
    100% 42%,
    25% 100%,
    45% 57%,
    0 57%
  );
  animation-name: ae-lightning-flash;
  animation-timing-function: steps(1, end);
  animation-iteration-count: infinite;
}

@keyframes ae-lightning-flash {
  0%,
  78%,
  100% {
    opacity: 0;
  }

  80% {
    opacity: 1;
  }

  84% {
    opacity: 0.15;
  }

  87% {
    opacity: 1;
  }

  92% {
    opacity: 0;
  }
}
`.trim(),Is=`
.ae-heart {
  position: absolute;
  bottom: -10%;
  color: #ff65af;
  text-shadow:
    0 0 8px rgba(255, 95, 175, 0.75),
    0 0 20px rgba(255, 95, 175, 0.35);
  animation-name: ae-heart-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes ae-heart-float {
  0% {
    transform:
      translateY(20vh)
      rotate(-10deg)
      scale(0.6);
    opacity: 0;
  }

  15% {
    opacity: 0.9;
  }

  100% {
    transform:
      translateY(-125vh)
      translateX(80px)
      rotate(20deg)
      scale(1.25);
    opacity: 0;
  }
}
`.trim(),As=`
.ae-leaf {
  position: absolute;
  border-radius: 100% 0 100% 0;
  background: linear-gradient(
    135deg,
    #ffd36c,
    #d87536 55%,
    #8d3c24
  );
  box-shadow:
    0 0 8px rgba(255, 180, 70, 0.2);
  animation-name: ae-leaf-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  transform-origin: 50% 50%;
}

@keyframes ae-leaf-fall {
  from {
    transform:
      translateY(-20vh)
      translateX(0)
      rotate(0deg);
  }

  to {
    transform:
      translateY(135vh)
      translateX(var(--ae-leaf-drift, 80px))
      rotate(var(--ae-leaf-rotation, 540deg));
  }
}
`.trim(),Ns=`
.ae-matrix-column {
  position: absolute;
  top: -75%;
  white-space: pre;
  color: #62ff91;
  font-family:
    "Cascadia Mono",
    Consolas,
    monospace;
  font-weight: 700;
  line-height: 1.02;
  text-shadow:
    0 0 5px rgba(98, 255, 145, 0.95),
    0 0 14px rgba(98, 255, 145, 0.45);
  animation-name: ae-matrix-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes ae-matrix-fall {
  from {
    transform: translateY(-25vh);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  85% {
    opacity: 0.95;
  }

  to {
    transform: translateY(190vh);
    opacity: 0;
  }
}
`.trim(),Ls=`
.ae-comet {
  position: absolute;
  left: -30%;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(120, 205, 255, 0.35),
    rgba(255, 255, 255, 1)
  );
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.9),
    0 0 18px rgba(80, 180, 255, 0.8),
    0 0 34px rgba(80, 120, 255, 0.5);
  animation-name: ae-comet-flight;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  transform-origin: 100% 50%;
}

@keyframes ae-comet-flight {
  from {
    transform:
      translate(-20vw, -25vh)
      rotate(25deg);
    opacity: 0;
  }

  8% {
    opacity: 1;
  }

  88% {
    opacity: 1;
  }

  to {
    transform:
      translate(155vw, 105vh)
      rotate(25deg);
    opacity: 0;
  }
}
`.trim(),Ds=`
.ae-star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 0 6px rgba(255, 255, 255, 0.85),
    0 0 14px rgba(130, 190, 255, 0.45);
  animation-name: ae-star-twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes ae-star-twinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.7);
  }

  50% {
    opacity: 1;
    transform: scale(1.35);
  }
}
`.trim(),Ts=`
.ae-fog-blob {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(220, 235, 255, 0.23),
    rgba(180, 210, 240, 0.12) 45%,
    transparent 75%
  );
  filter: blur(32px);
  animation-name: ae-fog-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes ae-fog-drift {
  0% {
    transform:
      translateX(-18vw)
      translateY(0)
      scale(0.9);
  }

  50% {
    transform:
      translateX(18vw)
      translateY(-4vh)
      scale(1.08);
  }

  100% {
    transform:
      translateX(-18vw)
      translateY(0)
      scale(0.9);
  }
}
`.trim(),Os={definition:ce({id:"rainfall",name:"Rainfall",description:"SpadajÄ…ce krople deszczu.",category:"weather",tags:["rain","weather","water"],defaultSettings:{...oe,opacity:75,density:70,speed:120},performanceCost:3,requiresJavaScript:!0}),css:_s,streamElementsRendererName:"aeRenderRainfall",renderPreview(e,t,a){const n=H(80,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-rain-drop",r.style.left=`${a()*100}%`,r.style.animationDelay=`${-a()*2}s`,r.style.animationDuration=`${(.7+a()*.8)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderRainfall(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(80 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("span");
    drop.className = "ae-rain-drop";
    drop.style.left = random() * 100 + "%";
    drop.style.animationDelay = -random() * 2 + "s";
    drop.style.animationDuration =
      ((0.7 + random() * 0.8) / speed) + "s";
    layer.appendChild(drop);
  }
}
`.trim(),estimateDomNodes(e){return H(80,e)}},qs={definition:ce({id:"snow",name:"Snow",description:"SpadajÄ…ce pĹ‚atki Ĺ›niegu.",category:"weather",tags:["snow","winter","weather","flakes"],defaultSettings:{...oe,opacity:85,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:$s,streamElementsRendererName:"aeRenderSnow",renderPreview(e,t,a){const n=H(55,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-snowflake";const o=4+a()*10;r.style.left=`${a()*100}%`,r.style.top=`${-10-a()*25}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.opacity=String(.45+a()*.55),r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(6+a()*8)/s}s`,r.style.setProperty("--ae-snow-drift",`${-50+a()*100}px`),r.style.setProperty("--ae-snow-rotation",`${120+a()*360}deg`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSnow(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(55 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const flake = document.createElement("span");
    flake.className = "ae-snowflake";

    const size = 4 + random() * 10;
    flake.style.left = random() * 100 + "%";
    flake.style.top = (-10 - random() * 25) + "%";
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.opacity = String(0.45 + random() * 0.55);
    flake.style.animationDelay = -random() * 12 + "s";
    flake.style.animationDuration =
      ((6 + random() * 8) / speed) + "s";
    flake.style.setProperty(
      "--ae-snow-drift",
      (-50 + random() * 100) + "px"
    );
    flake.style.setProperty(
      "--ae-snow-rotation",
      (120 + random() * 360) + "deg"
    );

    layer.appendChild(flake);
  }
}
`.trim(),estimateDomNodes(e){return H(55,e)}},Fs={definition:ce({id:"lightning",name:"Lightning Storm",description:"Losowe bĹ‚yski i pioruny.",category:"weather",tags:["lightning","storm","electric"],defaultSettings:{...oe,opacity:100,density:45,speed:100,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Rs,streamElementsRendererName:"aeRenderLightning",renderPreview(e,t,a){const n=H(8,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-lightning",r.style.left=`${10+a()*80}%`,r.style.top=`${a()*35}%`,r.style.animationDelay=`${-a()*4}s`,r.style.animationDuration=`${2.2/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderLightning(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(
    1,
    Math.round(8 * (s.density / 100))
  );
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const bolt = document.createElement("span");
    bolt.className = "ae-lightning";
    bolt.style.left = (10 + random() * 80) + "%";
    bolt.style.top = random() * 35 + "%";
    bolt.style.animationDelay = -random() * 4 + "s";
    bolt.style.animationDuration = (2.2 / speed) + "s";
    layer.appendChild(bolt);
  }
}
`.trim(),estimateDomNodes(e){return H(8,e,1)}},Bs={definition:ce({id:"hearts",name:"Hearts",description:"UnoszÄ…ce siÄ™ animowane serduszka.",category:"other",tags:["heart","love","particles","fun"],defaultSettings:{...oe,opacity:80,density:50,speed:80},performanceCost:2,requiresJavaScript:!0}),css:Is,streamElementsRendererName:"aeRenderHearts",renderPreview(e,t,a){const n=H(30,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-heart",r.innerHTML="&#10084;",r.style.left=`${a()*100}%`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${8/s}s`,r.style.fontSize=`${14+a()*22}px`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderHearts(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(30 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "ae-heart";
    heart.innerHTML = "&#10084;";
    heart.style.left = random() * 100 + "%";
    heart.style.animationDelay = -random() * 8 + "s";
    heart.style.animationDuration = (8 / speed) + "s";
    heart.style.fontSize = (14 + random() * 22) + "px";
    layer.appendChild(heart);
  }
}
`.trim(),estimateDomNodes(e){return H(30,e)}},Ws={definition:ce({id:"leaves",name:"Leaves",description:"WirujÄ…ce, opadajÄ…ce liĹ›cie.",category:"botanical",tags:["leaves","autumn","nature","particles"],defaultSettings:{...oe,opacity:90,density:60,speed:70},performanceCost:2,requiresJavaScript:!0}),css:As,streamElementsRendererName:"aeRenderLeaves",renderPreview(e,t,a){const n=H(36,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-leaf";const o=12+a()*16;r.style.left=`${a()*100}%`,r.style.top=`${-10-a()*25}%`,r.style.width=`${o}px`,r.style.height=`${o*.62}px`,r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(7+a()*8)/s}s`,r.style.setProperty("--ae-leaf-drift",`${-90+a()*180}px`),r.style.setProperty("--ae-leaf-rotation",`${360+a()*720}deg`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderLeaves(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(36 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const leaf = document.createElement("span");
    leaf.className = "ae-leaf";

    const size = 12 + random() * 16;
    leaf.style.left = random() * 100 + "%";
    leaf.style.top = (-10 - random() * 25) + "%";
    leaf.style.width = size + "px";
    leaf.style.height = (size * 0.62) + "px";
    leaf.style.animationDelay = -random() * 12 + "s";
    leaf.style.animationDuration =
      ((7 + random() * 8) / speed) + "s";
    leaf.style.setProperty(
      "--ae-leaf-drift",
      (-90 + random() * 180) + "px"
    );
    leaf.style.setProperty(
      "--ae-leaf-rotation",
      (360 + random() * 720) + "deg"
    );

    layer.appendChild(leaf);
  }
}
`.trim(),estimateDomNodes(e){return H(36,e)}},Us={definition:ce({id:"matrix",name:"Matrix Code",description:"Kolumny opadajÄ…cego cyfrowego kodu.",category:"tech",tags:["matrix","code","digital","tech","cyber"],defaultSettings:{...oe,opacity:80,density:55,speed:85,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Ns,streamElementsRendererName:"aeRenderMatrix",renderPreview(e,t,a){const n=H(24,t,1),s=Math.max(.1,t.speed/100),i="01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-matrix-column";const c=8+Math.floor(a()*11);let l="";for(let d=0;d<c;d++)l+=i[Math.floor(a()*i.length)],d<c-1&&(l+=`
`);o.textContent=l,o.style.left=`${a()*100}%`,o.style.fontSize=`${11+a()*9}px`,o.style.animationDelay=`${-a()*8}s`,o.style.animationDuration=`${(4+a()*5)/s}s`,o.style.opacity=String(.45+a()*.55),e.appendChild(o)}},streamElementsRendererSource:`
function aeRenderMatrix(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(
    1,
    Math.round(24 * (s.density / 100))
  );
  const speed = Math.max(0.1, s.speed / 100);
  const charset = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";

  for (let i = 0; i < count; i++) {
    const column = document.createElement("span");
    column.className = "ae-matrix-column";

    const length = 8 + Math.floor(random() * 11);
    let text = "";

    for (let j = 0; j < length; j++) {
      text += charset[
        Math.floor(random() * charset.length)
      ];

      if (j < length - 1) {
        text += "\\n";
      }
    }

    column.textContent = text;
    column.style.left = random() * 100 + "%";
    column.style.fontSize = (11 + random() * 9) + "px";
    column.style.animationDelay = -random() * 8 + "s";
    column.style.animationDuration =
      ((4 + random() * 5) / speed) + "s";
    column.style.opacity = String(0.45 + random() * 0.55);

    layer.appendChild(column);
  }
}
`.trim(),estimateDomNodes(e){return H(24,e,1)}},Xs={definition:ce({id:"comets",name:"Comets",description:"Szybkie Ĺ›wietliste komety przecinajÄ…ce ekran.",category:"cosmic",tags:["comet","space","cosmic","streak"],defaultSettings:{...oe,opacity:90,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ls,streamElementsRendererName:"aeRenderComets",renderPreview(e,t,a){const n=H(10,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-comet",r.style.top=`${-10+a()*75}%`,r.style.width=`${90+a()*140}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(4+a()*5)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderComets(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(
    1,
    Math.round(10 * (s.density / 100))
  );
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const comet = document.createElement("span");
    comet.className = "ae-comet";
    comet.style.top = (-10 + random() * 75) + "%";
    comet.style.width = (90 + random() * 140) + "px";
    comet.style.animationDelay = -random() * 10 + "s";
    comet.style.animationDuration =
      ((4 + random() * 5) / speed) + "s";
    layer.appendChild(comet);
  }
}
`.trim(),estimateDomNodes(e){return H(10,e,1)}},Zs={definition:ce({id:"starfield",name:"Starfield",description:"MigoczÄ…ce gwiazdy w tle.",category:"cosmic",tags:["stars","space","cosmic","twinkle"],defaultSettings:{...oe,opacity:85,density:65,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ds,streamElementsRendererName:"aeRenderStarfield",renderPreview(e,t,a){const n=H(100,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-star";const o=1+a()*3.5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*4}s`,r.style.animationDuration=`${(1.5+a()*3)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderStarfield(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(100 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = "ae-star";

    const size = 1 + random() * 3.5;
    star.style.left = random() * 100 + "%";
    star.style.top = random() * 100 + "%";
    star.style.width = size + "px";
    star.style.height = size + "px";
    star.style.animationDelay = -random() * 4 + "s";
    star.style.animationDuration =
      ((1.5 + random() * 3) / speed) + "s";

    layer.appendChild(star);
  }
}
`.trim(),estimateDomNodes(e){return H(100,e)}},Gs={definition:ce({id:"fog",name:"Fog",description:"Powolne warstwy mgĹ‚y przesuwajÄ…ce siÄ™ przez ekran.",category:"weather",tags:["fog","mist","cloud","weather","cinematic"],defaultSettings:{...oe,opacity:65,density:70,speed:45,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Ts,streamElementsRendererName:"aeRenderFog",renderPreview(e,t,a){const n=H(6,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-fog-blob",r.style.left=`${-25+a()*95}%`,r.style.top=`${-10+a()*75}%`,r.style.width=`${45+a()*35}%`,r.style.height=`${30+a()*35}%`,r.style.opacity=String(.16+a()*.22),r.style.animationDelay=`${-a()*24}s`,r.style.animationDuration=`${(18+a()*18)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderFog(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(
    1,
    Math.round(6 * (s.density / 100))
  );
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const blob = document.createElement("span");
    blob.className = "ae-fog-blob";
    blob.style.left = (-25 + random() * 95) + "%";
    blob.style.top = (-10 + random() * 75) + "%";
    blob.style.width = (45 + random() * 35) + "%";
    blob.style.height = (30 + random() * 35) + "%";
    blob.style.opacity = String(0.16 + random() * 0.22);
    blob.style.animationDelay = -random() * 24 + "s";
    blob.style.animationDuration =
      ((18 + random() * 18) / speed) + "s";
    layer.appendChild(blob);
  }
}
`.trim(),estimateDomNodes(e){return H(6,e,1)}},Hs=`
.ae-ember {
  position: absolute;
  bottom: -8%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 180, 1) 0%,
    rgba(255, 145, 35, 0.95) 38%,
    rgba(255, 75, 15, 0.5) 68%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 185, 70, 0.9),
    0 0 18px rgba(255, 80, 20, 0.55);
  animation-name: ae-ember-rise;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes ae-ember-rise {
  0% {
    transform:
      translateY(12vh)
      translateX(0)
      scale(0.55);
    opacity: 0;
  }

  15% {
    opacity: 1;
  }

  75% {
    opacity: 0.8;
  }

  100% {
    transform:
      translateY(-115vh)
      translateX(var(--ae-ember-drift, 40px))
      scale(0.15);
    opacity: 0;
  }
}
`.trim(),Ys=`
.ae-cloud {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(240, 247, 255, 0.34),
    rgba(198, 220, 240, 0.19) 48%,
    transparent 74%
  );
  filter: blur(20px);
  animation-name: ae-cloud-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes ae-cloud-drift {
  from {
    transform:
      translateX(-35vw)
      translateY(0)
      scale(0.9);
  }

  50% {
    transform:
      translateX(35vw)
      translateY(var(--ae-cloud-lift, -3vh))
      scale(1.08);
  }

  to {
    transform:
      translateX(105vw)
      translateY(0)
      scale(0.96);
  }
}
`.trim(),Js=`
.ae-glass-drop {
  position: absolute;
  top: -15%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(190, 225, 255, 0.38) 45%,
    rgba(255, 255, 255, 0.12)
  );
  border: 1px solid rgba(205, 235, 255, 0.22);
  box-shadow:
    inset 1px 0 2px rgba(255, 255, 255, 0.34),
    0 0 8px rgba(135, 205, 255, 0.15);
  backdrop-filter: blur(1px);
  animation-name: ae-glass-drop-slide;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes ae-glass-drop-slide {
  0% {
    transform:
      translateY(-15vh)
      translateX(0);
    opacity: 0;
  }

  12% {
    opacity: 0.95;
  }

  85% {
    opacity: 0.75;
  }

  100% {
    transform:
      translateY(125vh)
      translateX(var(--ae-glass-drift, 10px));
    opacity: 0;
  }
}
`.trim(),Vs=`
.ae-bounce-ball {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 28%,
    rgba(255, 255, 255, 0.95),
    rgba(110, 210, 255, 0.95) 28%,
    rgba(110, 90, 255, 0.9) 68%,
    rgba(55, 30, 130, 0.8) 100%
  );
  box-shadow:
    0 0 8px rgba(120, 220, 255, 0.8),
    0 0 20px rgba(120, 80, 255, 0.45);
  animation-name: ae-ball-bounce;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes ae-ball-bounce {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(1);
  }

  25% {
    transform:
      translate(
        var(--ae-ball-dx, 12vw),
        var(--ae-ball-dy, 10vh)
      )
      scale(0.92, 1.08);
  }

  50% {
    transform:
      translate(
        calc(var(--ae-ball-dx, 12vw) * 0.25),
        calc(var(--ae-ball-dy, 10vh) * -0.8)
      )
      scale(1.04, 0.96);
  }

  75% {
    transform:
      translate(
        calc(var(--ae-ball-dx, 12vw) * -0.65),
        calc(var(--ae-ball-dy, 10vh) * 0.45)
      )
      scale(0.95, 1.05);
  }
}
`.trim(),Ks=`
.ae-neon-line {
  position: absolute;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(80, 235, 255, 0.95) 22%,
    rgba(210, 110, 255, 1) 62%,
    transparent
  );
  box-shadow:
    0 0 6px rgba(80, 235, 255, 0.95),
    0 0 18px rgba(190, 90, 255, 0.65);
  animation-name: ae-neon-line-sweep;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes ae-neon-line-sweep {
  0% {
    transform:
      translateX(-130vw)
      rotate(var(--ae-line-angle, -8deg));
    opacity: 0;
  }

  12% {
    opacity: 1;
  }

  88% {
    opacity: 1;
  }

  100% {
    transform:
      translateX(130vw)
      rotate(var(--ae-line-angle, -8deg));
    opacity: 0;
  }
}
`.trim(),Qs=`
.ae-energy-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 35%,
    rgba(255, 255, 255, 1) 0%,
    rgba(120, 245, 255, 0.95) 18%,
    rgba(85, 110, 255, 0.82) 48%,
    rgba(180, 70, 255, 0.32) 68%,
    transparent 100%
  );
  box-shadow:
    0 0 12px rgba(90, 235, 255, 0.85),
    0 0 28px rgba(90, 110, 255, 0.6),
    0 0 50px rgba(180, 70, 255, 0.35);
  animation-name: ae-orb-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes ae-orb-drift {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(0.78);
    opacity: 0.45;
  }

  50% {
    transform:
      translate(
        var(--ae-orb-dx, 45px),
        var(--ae-orb-dy, -35px)
      )
      scale(1.2);
    opacity: 1;
  }
}
`.trim(),ei=`
.ae-petal {
  position: absolute;
  top: -15%;
  border-radius: 80% 15% 80% 25%;
  background: linear-gradient(
    135deg,
    rgba(255, 230, 242, 1),
    rgba(255, 120, 175, 0.95) 55%,
    rgba(205, 70, 145, 0.9)
  );
  box-shadow:
    0 0 8px rgba(255, 130, 185, 0.32);
  animation-name: ae-petal-fall;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes ae-petal-fall {
  0% {
    transform:
      translateY(-15vh)
      translateX(0)
      rotate(0deg);
  }

  45% {
    transform:
      translateY(55vh)
      translateX(var(--ae-petal-drift, 40px))
      rotate(250deg);
  }

  100% {
    transform:
      translateY(125vh)
      translateX(calc(var(--ae-petal-drift, 40px) * -0.35))
      rotate(620deg);
  }
}
`.trim(),ti=`
.ae-spark {
  position: absolute;
  bottom: -8%;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(
    to top,
    transparent,
    rgba(255, 125, 20, 0.8),
    rgba(255, 245, 190, 1)
  );
  box-shadow:
    0 0 7px rgba(255, 185, 65, 0.95),
    0 0 15px rgba(255, 75, 20, 0.5);
  animation-name: ae-spark-flight;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes ae-spark-flight {
  0% {
    transform:
      translateY(10vh)
      translateX(0)
      rotate(var(--ae-spark-angle, 0deg));
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    transform:
      translateY(-105vh)
      translateX(var(--ae-spark-drift, 30px))
      rotate(var(--ae-spark-angle, 0deg));
    opacity: 0;
  }
}
`.trim(),ai={definition:ce({id:"embers",name:"Embers",description:"Ĺ»arzÄ…ce siÄ™ drobiny unoszÄ…ce siÄ™ ku gĂłrze.",category:"cinematic",tags:["embers","fire","ash","cinematic"],defaultSettings:{...oe,opacity:90,density:55,speed:70,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Hs,streamElementsRendererName:"aeRenderEmbers",renderPreview(e,t,a){const n=H(46,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-ember";const o=2+a()*6;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(5+a()*7)/s}s`,r.style.setProperty("--ae-ember-drift",`${-55+a()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderEmbers(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(46 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const ember = document.createElement("span");
    ember.className = "ae-ember";
    const size = 2 + random() * 6;
    ember.style.left = random() * 100 + "%";
    ember.style.width = size + "px";
    ember.style.height = size + "px";
    ember.style.animationDelay = -random() * 10 + "s";
    ember.style.animationDuration = ((5 + random() * 7) / speed) + "s";
    ember.style.setProperty("--ae-ember-drift", (-55 + random() * 110) + "px");
    layer.appendChild(ember);
  }
}
`.trim(),estimateDomNodes(e){return H(46,e)}},ni={definition:ce({id:"clouds",name:"Clouds",description:"MiÄ™kkie, pĂłĹ‚przezroczyste chmury przesuwajÄ…ce siÄ™ po ekranie.",category:"weather",tags:["clouds","weather","mist","sky"],defaultSettings:{...oe,opacity:70,density:45,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ys,streamElementsRendererName:"aeRenderClouds",renderPreview(e,t,a){const n=H(10,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-cloud";const o=220+a()*340,c=90+a()*130;r.style.left=`${-35-a()*35}%`,r.style.top=`${a()*85}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.opacity=String(.35+a()*.5),r.style.animationDelay=`${-a()*24}s`,r.style.animationDuration=`${(22+a()*28)/s}s`,r.style.setProperty("--ae-cloud-lift",`${-6+a()*12}vh`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderClouds(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(10 * (s.density / 100)));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const cloud = document.createElement("span");
    cloud.className = "ae-cloud";
    const width = 220 + random() * 340;
    const height = 90 + random() * 130;
    cloud.style.left = (-35 - random() * 35) + "%";
    cloud.style.top = random() * 85 + "%";
    cloud.style.width = width + "px";
    cloud.style.height = height + "px";
    cloud.style.opacity = String(0.35 + random() * 0.5);
    cloud.style.animationDelay = -random() * 24 + "s";
    cloud.style.animationDuration = ((22 + random() * 28) / speed) + "s";
    cloud.style.setProperty("--ae-cloud-lift", (-6 + random() * 12) + "vh");
    layer.appendChild(cloud);
  }
}
`.trim(),estimateDomNodes(e){return H(10,e,1)}},ri={definition:ce({id:"rain-glass",name:"Rain on Glass",description:"Krople deszczu spĹ‚ywajÄ…ce po wirtualnej szybie.",category:"weather",tags:["rain","glass","drops","weather"],defaultSettings:{...oe,opacity:72,density:55,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Js,streamElementsRendererName:"aeRenderRainGlass",renderPreview(e,t,a){const n=H(44,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-glass-drop";const o=3+a()*8,c=18+a()*72;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.animationDelay=`${-a()*11}s`,r.style.animationDuration=`${(4+a()*9)/s}s`,r.style.setProperty("--ae-glass-drift",`${-12+a()*24}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderRainGlass(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(44 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("span");
    drop.className = "ae-glass-drop";
    const width = 3 + random() * 8;
    const height = 18 + random() * 72;
    drop.style.left = random() * 100 + "%";
    drop.style.width = width + "px";
    drop.style.height = height + "px";
    drop.style.animationDelay = -random() * 11 + "s";
    drop.style.animationDuration = ((4 + random() * 9) / speed) + "s";
    drop.style.setProperty("--ae-glass-drift", (-12 + random() * 24) + "px");
    layer.appendChild(drop);
  }
}
`.trim(),estimateDomNodes(e){return H(44,e)}},si={definition:ce({id:"bouncing-balls",name:"Bouncing Balls",description:"Kolorowe kule odbijajÄ…ce siÄ™ i dryfujÄ…ce po ekranie.",category:"retro",tags:["balls","bounce","retro","screensaver"],defaultSettings:{...oe,opacity:85,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Vs,streamElementsRendererName:"aeRenderBouncingBalls",renderPreview(e,t,a){const n=H(18,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-bounce-ball";const o=14+a()*42;r.style.left=`${8+a()*78}%`,r.style.top=`${8+a()*78}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-ball-dx",`${-18+a()*36}vw`),r.style.setProperty("--ae-ball-dy",`${-14+a()*28}vh`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderBouncingBalls(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(18 * (s.density / 100)));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const ball = document.createElement("span");
    ball.className = "ae-bounce-ball";
    const size = 14 + random() * 42;
    ball.style.left = (8 + random() * 78) + "%";
    ball.style.top = (8 + random() * 78) + "%";
    ball.style.width = size + "px";
    ball.style.height = size + "px";
    ball.style.animationDelay = -random() * 8 + "s";
    ball.style.animationDuration = ((4 + random() * 7) / speed) + "s";
    ball.style.setProperty("--ae-ball-dx", (-18 + random() * 36) + "vw");
    ball.style.setProperty("--ae-ball-dy", (-14 + random() * 28) + "vh");
    layer.appendChild(ball);
  }
}
`.trim(),estimateDomNodes(e){return H(18,e,1)}},ii={definition:ce({id:"neon-lines",name:"Neon Lines",description:"ĹšwiecÄ…ce neonowe smugi przesuwajÄ…ce siÄ™ przez ekran.",category:"tech",tags:["neon","lines","cyber","tech"],defaultSettings:{...oe,opacity:88,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ks,streamElementsRendererName:"aeRenderNeonLines",renderPreview(e,t,a){const n=H(16,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-neon-line",r.style.left=`${-35-a()*25}%`,r.style.top=`${5+a()*90}%`,r.style.width=`${120+a()*320}px`,r.style.opacity=String(.45+a()*.55),r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(3+a()*6)/s}s`,r.style.setProperty("--ae-line-angle",`${-20+a()*40}deg`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderNeonLines(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(16 * (s.density / 100)));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const line = document.createElement("span");
    line.className = "ae-neon-line";
    line.style.left = (-35 - random() * 25) + "%";
    line.style.top = (5 + random() * 90) + "%";
    line.style.width = (120 + random() * 320) + "px";
    line.style.opacity = String(0.45 + random() * 0.55);
    line.style.animationDelay = -random() * 8 + "s";
    line.style.animationDuration = ((3 + random() * 6) / speed) + "s";
    line.style.setProperty("--ae-line-angle", (-20 + random() * 40) + "deg");
    layer.appendChild(line);
  }
}
`.trim(),estimateDomNodes(e){return H(16,e,1)}},oi={definition:ce({id:"energy-orbs",name:"Energy Orbs",description:"PulsujÄ…ce, Ĺ›wiecÄ…ce kule energii.",category:"energy",tags:["energy","orbs","glow","plasma"],defaultSettings:{...oe,opacity:82,density:48,speed:70,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Qs,streamElementsRendererName:"aeRenderEnergyOrbs",renderPreview(e,t,a){const n=H(20,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-energy-orb";const o=14+a()*56;r.style.left=`${5+a()*88}%`,r.style.top=`${5+a()*88}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*9}s`,r.style.animationDuration=`${(4+a()*8)/s}s`,r.style.setProperty("--ae-orb-dx",`${-70+a()*140}px`),r.style.setProperty("--ae-orb-dy",`${-60+a()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderEnergyOrbs(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(20 * (s.density / 100)));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const orb = document.createElement("span");
    orb.className = "ae-energy-orb";
    const size = 14 + random() * 56;
    orb.style.left = (5 + random() * 88) + "%";
    orb.style.top = (5 + random() * 88) + "%";
    orb.style.width = size + "px";
    orb.style.height = size + "px";
    orb.style.animationDelay = -random() * 9 + "s";
    orb.style.animationDuration = ((4 + random() * 8) / speed) + "s";
    orb.style.setProperty("--ae-orb-dx", (-70 + random() * 140) + "px");
    orb.style.setProperty("--ae-orb-dy", (-60 + random() * 120) + "px");
    layer.appendChild(orb);
  }
}
`.trim(),estimateDomNodes(e){return H(20,e,1)}},ci={definition:ce({id:"petals",name:"Petals",description:"Delikatne pĹ‚atki opadajÄ…ce i wirujÄ…ce na wietrze.",category:"botanical",tags:["petals","flowers","spring","nature"],defaultSettings:{...oe,opacity:88,density:55,speed:62},performanceCost:2,requiresJavaScript:!0}),css:ei,streamElementsRendererName:"aeRenderPetals",renderPreview(e,t,a){const n=H(34,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-petal";const o=8+a()*13,c=12+a()*18;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(7+a()*9)/s}s`,r.style.setProperty("--ae-petal-drift",`${-70+a()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderPetals(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(34 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    petal.className = "ae-petal";
    const width = 8 + random() * 13;
    const height = 12 + random() * 18;
    petal.style.left = random() * 100 + "%";
    petal.style.width = width + "px";
    petal.style.height = height + "px";
    petal.style.animationDelay = -random() * 12 + "s";
    petal.style.animationDuration = ((7 + random() * 9) / speed) + "s";
    petal.style.setProperty("--ae-petal-drift", (-70 + random() * 140) + "px");
    layer.appendChild(petal);
  }
}
`.trim(),estimateDomNodes(e){return H(34,e)}},li={definition:ce({id:"sparks",name:"Sparks",description:"Jasne iskry wystrzeliwujÄ…ce ku gĂłrze.",category:"energy",tags:["sparks","fire","energy","particles"],defaultSettings:{...oe,opacity:92,density:58,speed:115,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ti,streamElementsRendererName:"aeRenderSparks",renderPreview(e,t,a){const n=H(52,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-spark",r.style.left=`${a()*100}%`,r.style.height=`${8+a()*24}px`,r.style.animationDelay=`${-a()*7}s`,r.style.animationDuration=`${(2.2+a()*4.2)/s}s`,r.style.setProperty("--ae-spark-drift",`${-75+a()*150}px`),r.style.setProperty("--ae-spark-angle",`${-22+a()*44}deg`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSparks(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(52 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const spark = document.createElement("span");
    spark.className = "ae-spark";
    spark.style.left = random() * 100 + "%";
    spark.style.height = (8 + random() * 24) + "px";
    spark.style.animationDelay = -random() * 7 + "s";
    spark.style.animationDuration = ((2.2 + random() * 4.2) / speed) + "s";
    spark.style.setProperty("--ae-spark-drift", (-75 + random() * 150) + "px");
    spark.style.setProperty("--ae-spark-angle", (-22 + random() * 44) + "deg");
    layer.appendChild(spark);
  }
}
`.trim(),estimateDomNodes(e){return H(52,e)}},di=`
.ae-plasma-blob {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255,255,255,.95) 0%,
    rgba(80,235,255,.88) 18%,
    rgba(130,70,255,.72) 48%,
    rgba(255,60,195,.35) 68%,
    transparent 100%
  );
  box-shadow:
    0 0 18px rgba(80,235,255,.75),
    0 0 42px rgba(125,70,255,.55),
    0 0 80px rgba(255,60,195,.28);
  animation: ae-plasma-drift 8s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-plasma-drift {
  0%,100% { transform: translate(0,0) scale(.72); opacity:.45; }
  50% { transform: translate(var(--ae-plasma-x,45px),var(--ae-plasma-y,-35px)) scale(1.25); opacity:1; }
}
`.trim(),pi=`
.ae-energy-wave {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12vmin;
  height: 12vmin;
  border: 2px solid rgba(80,235,255,.9);
  border-radius: 50%;
  box-shadow:
    0 0 12px rgba(80,235,255,.75),
    inset 0 0 12px rgba(150,80,255,.35);
  transform: translate(-50%,-50%) scale(.25);
  animation: ae-energy-wave-expand 5s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-energy-wave-expand {
  0% { transform: translate(-50%,-50%) scale(.18); opacity:0; }
  12% { opacity:1; }
  100% { transform: translate(-50%,-50%) scale(8); opacity:0; }
}
`.trim(),ui=`
.ae-rune {
  position: absolute;

  color: rgba(176, 124, 255, .96);

  font-family:
    "Segoe UI Historic",
    "Noto Sans Runic",
    "Segoe UI Symbol",
    sans-serif;

  font-weight: 600;
  font-style: normal;
  font-variant-ligatures: none;

  line-height: 1;

  text-shadow:
    0 0 7px rgba(190, 135, 255, .95),
    0 0 18px rgba(135, 90, 255, .72),
    0 0 30px rgba(80, 210, 255, .28);

  animation:
    ae-rune-float
    9s
    ease-in-out
    infinite;

  user-select: none;
  pointer-events: none;

  will-change:
    transform,
    opacity;
}

@keyframes ae-rune-float {
  0%,
  100% {
    transform:
      translate(0, 0)
      rotate(-8deg)
      scale(.86);

    opacity: .24;
  }

  50% {
    transform:
      translate(
        var(--ae-rune-x, 24px),
        var(--ae-rune-y, -34px)
      )
      rotate(10deg)
      scale(1.10);

    opacity: 1;
  }
}
`.trim(),fi=`
.ae-magic-dust {
  position: absolute;
  border-radius: 50%;
  background: white;
  box-shadow:
    0 0 6px rgba(255,255,255,.95),
    0 0 14px rgba(150,90,255,.9),
    0 0 28px rgba(80,220,255,.55);
  animation: ae-magic-dust-float 7s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-magic-dust-float {
  0%,100% { transform: translate(0,0) scale(.55); opacity:.2; }
  50% { transform: translate(var(--ae-dust-x,25px),var(--ae-dust-y,-45px)) scale(1.35); opacity:1; }
}
`.trim(),mi=`
.ae-laser-grid {
  position: absolute;
  inset: -25%;
  background-image:
    linear-gradient(rgba(0,240,255,.28) 1px, transparent 1px),
    linear-gradient(90deg, rgba(195,70,255,.28) 1px, transparent 1px);
  background-size:
    var(--ae-grid-size,56px)
    var(--ae-grid-size,56px);
  box-shadow: inset 0 0 80px rgba(80,0,160,.28);
  transform: perspective(700px) rotateX(58deg) translateY(16%);
  transform-origin: 50% 100%;
  animation: ae-laser-grid-move 5s linear infinite;
  opacity:.9;
  will-change: background-position;
}
@keyframes ae-laser-grid-move {
  from { background-position: 0 0, 0 0; }
  to { background-position: 0 var(--ae-grid-size,56px), var(--ae-grid-size,56px) 0; }
}
`.trim(),yi=`
.ae-scanlines {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(255,255,255,.06) 0,
      rgba(255,255,255,.06) 1px,
      rgba(0,0,0,.14) 2px,
      rgba(0,0,0,.14) var(--ae-scan-gap,7px)
    );
  animation: ae-scanlines-move 1.8s linear infinite;
  will-change: background-position;
}
@keyframes ae-scanlines-move {
  from { background-position: 0 0; }
  to { background-position: 0 24px; }
}
`.trim(),hi=`
.ae-pong-arena {
  position: absolute;
  inset: 3%;
  overflow: hidden;
  border: 1px solid rgba(150, 225, 255, 0.2);
  border-radius: 10px;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(70, 120, 180, 0.06),
      transparent 55%
    );
}

.ae-pong-center-line {
  position: absolute;
  top: 4%;
  bottom: 4%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  opacity: 0.38;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(220, 245, 255, 0.9) 0 14px,
      transparent 14px 28px
    );
}

.ae-pong-paddle,
.ae-pong-ball {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(235, 250, 255, 0.98);
  box-shadow:
    0 0 8px rgba(120, 235, 255, 0.95),
    0 0 20px rgba(120, 120, 255, 0.55);
  will-change: transform;
}

.ae-pong-paddle {
  border-radius: 999px;
}

.ae-pong-ball {
  border-radius: 50%;
}

.ae-pong-score {
  position: absolute;
  top: 5%;
  min-width: 50px;
  color: rgba(225, 245, 255, 0.82);
  font-family:
    ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  font-size: clamp(22px, 4vw, 54px);
  font-weight: 800;
  line-height: 1;
  text-align: center;
  text-shadow:
    0 0 10px rgba(100, 220, 255, 0.42);
  user-select: none;
}

.ae-pong-score.left {
  right: 53%;
}

.ae-pong-score.right {
  left: 53%;
}
`.trim(),gi=`
.ae-bubble {
  position: absolute;
  bottom: -15%;
  border-radius: 50%;
  border: 1px solid rgba(210,245,255,.65);
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,.35), rgba(100,210,255,.12) 42%, transparent 72%);
  box-shadow:
    inset -4px -6px 12px rgba(70,160,255,.12),
    0 0 10px rgba(100,220,255,.24);
  animation: ae-bubble-rise 10s ease-in infinite;
  will-change: transform, opacity;
}
@keyframes ae-bubble-rise {
  0% { transform: translateY(12vh) translateX(0) scale(.7); opacity:0; }
  12% { opacity:.8; }
  100% { transform: translateY(-125vh) translateX(var(--ae-bubble-drift,35px)) scale(1.18); opacity:0; }
}
`.trim(),bi=`
.ae-firefly {
  position: absolute;
  border-radius: 50%;
  background: rgba(245,255,135,1);
  box-shadow:
    0 0 8px rgba(235,255,100,.95),
    0 0 22px rgba(150,255,90,.55);
  animation: ae-firefly-drift 6s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-firefly-drift {
  0%,100% { transform: translate(0,0) scale(.55); opacity:.18; }
  35% { opacity:1; }
  50% { transform: translate(var(--ae-firefly-x,30px),var(--ae-firefly-y,-24px)) scale(1.3); opacity:.95; }
  75% { opacity:.3; }
}
`.trim(),wi=`
.ae-confetti {
  position: absolute;
  top: -12%;
  border-radius: 2px;
  animation: ae-confetti-fall 8s linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-confetti-fall {
  0% { transform: translateY(-15vh) translateX(0) rotate(0deg); opacity:0; }
  8% { opacity:1; }
  100% { transform: translateY(125vh) translateX(var(--ae-confetti-drift,40px)) rotate(var(--ae-confetti-rot,720deg)); opacity:.75; }
}
`.trim(),ki=`
.ae-dust-mote {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,245,220,.78);
  box-shadow: 0 0 6px rgba(255,235,190,.35);
  animation: ae-dust-mote 13s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-dust-mote {
  0%,100% { transform: translate(0,0); opacity:.12; }
  50% { transform: translate(var(--ae-mote-x,30px),var(--ae-mote-y,-35px)); opacity:.75; }
}
`.trim(),vi=`
.ae-aurora-band {
  position: absolute;
  left: -15%;
  width: 130%;
  height: 30%;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(40,255,190,.05) 10%,
    rgba(40,255,190,.48) 32%,
    rgba(85,110,255,.55) 58%,
    rgba(215,65,255,.38) 78%,
    transparent
  );
  filter: blur(26px);
  transform: rotate(var(--ae-aurora-angle,-8deg));
  animation: ae-aurora-flow 11s ease-in-out infinite alternate;
  will-change: transform, opacity;
}
@keyframes ae-aurora-flow {
  from { transform: translateX(-8vw) translateY(-2vh) rotate(var(--ae-aurora-angle,-8deg)) scaleY(.75); opacity:.35; }
  to { transform: translateX(8vw) translateY(5vh) rotate(var(--ae-aurora-angle,-8deg)) scaleY(1.3); opacity:.95; }
}
`.trim(),xi={definition:ce({id:"plasma",name:"Plasma",description:"PulsujÄ…ce obĹ‚oki plazmy i neonowej energii.",category:"energy",tags:["plasma","energy","glow","abstract"],defaultSettings:{...oe,opacity:80,density:45,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:di,streamElementsRendererName:"aeRenderPlasma",renderPreview(e,t,a){const n=H(9,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-plasma-blob";const o=70+a()*150;r.style.left=`${a()*90}%`,r.style.top=`${a()*85}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(6+a()*8)/s}s`,r.style.setProperty("--ae-plasma-x",`${-90+a()*180}px`),r.style.setProperty("--ae-plasma-y",`${-70+a()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderPlasma(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(9 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const blob = document.createElement("span");
    blob.className = "ae-plasma-blob";
    const size = 70 + random() * 150;
    blob.style.left = random() * 90 + "%";
    blob.style.top = random() * 85 + "%";
    blob.style.width = size + "px";
    blob.style.height = size + "px";
    blob.style.animationDelay = -random() * 8 + "s";
    blob.style.animationDuration = ((6 + random() * 8) / speed) + "s";
    blob.style.setProperty("--ae-plasma-x", (-90 + random() * 180) + "px");
    blob.style.setProperty("--ae-plasma-y", (-70 + random() * 140) + "px");
    layer.appendChild(blob);
  }
}
`.trim(),estimateDomNodes(e){return H(9,e,1)}},zi={definition:ce({id:"energy-waves",name:"Energy Waves",description:"RozchodzÄ…ce siÄ™ neonowe fale energii.",category:"energy",tags:["energy","waves","rings","pulse"],defaultSettings:{...oe,opacity:82,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:pi,streamElementsRendererName:"aeRenderEnergyWaves",renderPreview(e,t,a){const n=H(7,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-energy-wave",r.style.left=`${35+a()*30}%`,r.style.top=`${35+a()*30}%`,r.style.animationDelay=`${-(i/n)*5}s`,r.style.animationDuration=`${5/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderEnergyWaves(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(7 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const wave = document.createElement("span");
    wave.className = "ae-energy-wave";
    wave.style.left = (35 + random() * 30) + "%";
    wave.style.top = (35 + random() * 30) + "%";
    wave.style.animationDelay = -((i / count) * 5) + "s";
    wave.style.animationDuration = (5 / speed) + "s";
    layer.appendChild(wave);
  }
}
`.trim(),estimateDomNodes(e){return H(7,e,1)}},Si={definition:ce({id:"runes",name:"Runes",description:"Świecące runy Elder Futhark unoszące się w tle.",category:"fantasy",tags:["runes","elder-futhark","magic","fantasy","symbols"],defaultSettings:{...oe,opacity:78,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ui,streamElementsRendererName:"aeRenderRunes",renderPreview(e,t,a){const n=["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"],s=H(24,t,1),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-rune",o.textContent=n[Math.floor(a()*n.length)]??"ᚠ",o.style.left=`${a()*95}%`,o.style.top=`${a()*92}%`,o.style.fontSize=`${18+a()*36}px`,o.style.animationDelay=`${-a()*9}s`,o.style.animationDuration=`${(6+a()*7)/i}s`,o.style.setProperty("--ae-rune-x",`${-45+a()*90}px`),o.style.setProperty("--ae-rune-y",`${-55+a()*110}px`),e.appendChild(o)}},streamElementsRendererSource:`
function aeRenderRunes(effect, root) {
  const layer =
    aeCreateLayer(
      effect,
      root
    );

  const random =
    aeCreateSeededRandom(
      effect.seed
    );

  const s =
    effect.settings;

  const chars = ["\\u16A0","\\u16A2","\\u16A6","\\u16A8","\\u16B1","\\u16B2","\\u16B7","\\u16B9","\\u16BA","\\u16BE","\\u16C1","\\u16C3","\\u16C7","\\u16C8","\\u16C9","\\u16CA","\\u16CF","\\u16D2","\\u16D6","\\u16D7","\\u16DA","\\u16DC","\\u16DE","\\u16DF"];

  const count =
    Math.max(
      1,
      Math.round(
        24 *
        (s.density / 100)
      )
    );

  const speed =
    Math.max(
      .1,
      s.speed / 100
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const rune =
      document.createElement(
        "span"
      );

    rune.className =
      "ae-rune";

    rune.textContent =
      chars[
        Math.floor(
          random() *
          chars.length
        )
      ] || "\\u16A0";

    rune.style.left =
      random() * 95 +
      "%";

    rune.style.top =
      random() * 92 +
      "%";

    rune.style.fontSize =
      (
        18 +
        random() * 36
      ) +
      "px";

    rune.style.animationDelay =
      -random() * 9 +
      "s";

    rune.style.animationDuration =
      (
        (
          6 +
          random() * 7
        ) /
        speed
      ) +
      "s";

    rune.style.setProperty(
      "--ae-rune-x",
      (
        -45 +
        random() * 90
      ) +
      "px"
    );

    rune.style.setProperty(
      "--ae-rune-y",
      (
        -55 +
        random() * 110
      ) +
      "px"
    );

    rune.style.fontFamily =
      '"Segoe UI Historic", "Noto Sans Runic", "Segoe UI Symbol", sans-serif';

    layer.appendChild(
      rune
    );
  }
}
`.trim(),estimateDomNodes(e){return H(24,e,1)}},Mi={definition:ce({id:"magic-dust",name:"Magic Dust",description:"MigoczÄ…cy magiczny pyĹ‚ i drobne iskierki.",category:"fantasy",tags:["magic","dust","sparkle","fantasy"],defaultSettings:{...oe,opacity:86,density:65,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:fi,streamElementsRendererName:"aeRenderMagicDust",renderPreview(e,t,a){const n=H(70,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-magic-dust";const o=1.5+a()*4.5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*7}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-dust-x",`${-40+a()*80}px`),r.style.setProperty("--ae-dust-y",`${-60+a()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderMagicDust(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(70 * (s.density / 100));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const dust = document.createElement("span");
    dust.className = "ae-magic-dust";
    const size = 1.5 + random() * 4.5;
    dust.style.left = random() * 100 + "%";
    dust.style.top = random() * 100 + "%";
    dust.style.width = size + "px";
    dust.style.height = size + "px";
    dust.style.animationDelay = -random() * 7 + "s";
    dust.style.animationDuration = ((4 + random() * 7) / speed) + "s";
    dust.style.setProperty("--ae-dust-x", (-40 + random() * 80) + "px");
    dust.style.setProperty("--ae-dust-y", (-60 + random() * 120) + "px");
    layer.appendChild(dust);
  }
}
`.trim(),estimateDomNodes(e){return H(70,e)}},Ei={definition:ce({id:"laser-grid",name:"Laser Grid",description:"Perspektywiczna neonowa siatka w stylu synthwave.",category:"sci-fi",tags:["laser","grid","synthwave","cyber"],defaultSettings:{...oe,opacity:72,density:55,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:mi,streamElementsRendererName:"aeRenderLaserGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-laser-grid";const n=Math.max(20,92-t.density*.65);a.style.setProperty("--ae-grid-size",`${n}px`),a.style.animationDuration=`${5/Math.max(.1,t.speed/100)}s`,e.appendChild(a)},streamElementsRendererSource:`
function aeRenderLaserGrid(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const s = effect.settings;
  const grid = document.createElement("span");
  grid.className = "ae-laser-grid";
  const gridSize = Math.max(20, 92 - s.density * .65);
  grid.style.setProperty("--ae-grid-size", gridSize + "px");
  grid.style.animationDuration = (5 / Math.max(.1, s.speed / 100)) + "s";
  layer.appendChild(grid);
}
`.trim(),estimateDomNodes(){return 1}},Ci={definition:ce({id:"scanlines",name:"Retro Scanlines",description:"Animowane linie kineskopowe CRT.",category:"retro",tags:["retro","crt","scanlines","arcade"],defaultSettings:{...oe,opacity:55,density:60,speed:100,blendMode:"overlay"},performanceCost:1,requiresJavaScript:!0}),css:yi,streamElementsRendererName:"aeRenderScanlines",renderPreview(e,t){const a=document.createElement("span");a.className="ae-scanlines";const n=Math.max(3,12-t.density*.08);a.style.setProperty("--ae-scan-gap",`${n}px`),a.style.animationDuration=`${1.8/Math.max(.1,t.speed/100)}s`,e.appendChild(a)},streamElementsRendererSource:`
function aeRenderScanlines(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const s = effect.settings;
  const scan = document.createElement("span");
  scan.className = "ae-scanlines";
  const gap = Math.max(3, 12 - s.density * .08);
  scan.style.setProperty("--ae-scan-gap", gap + "px");
  scan.style.animationDuration = (1.8 / Math.max(.1, s.speed / 100)) + "s";
  layer.appendChild(scan);
}
`.trim(),estimateDomNodes(){return 1}};function Pi(e,t,a){const n=document.createElement("div");n.className="ae-pong-arena";const s=document.createElement("span");s.className="ae-pong-center-line";const i=document.createElement("span");i.className="ae-pong-paddle left";const r=document.createElement("span");r.className="ae-pong-paddle right";const o=document.createElement("span");o.className="ae-pong-ball";const c=document.createElement("span");c.className="ae-pong-score left";const l=document.createElement("span");l.className="ae-pong-score right",n.append(s,c,l,i,r,o),e.appendChild(n);let d=0,p=0,h=10,f=100,g=14,m=28,b=0,w=0,k=0,x=0,M=0,C=0,A=0,_=0,D=0,j=0,W=0,K=0,E=performance.now(),O=!1,y=260;const q=Math.max(.2,t.speed/100),te=Math.max(.1,Math.min(1,t.density/100)),B=Math.max(0,Math.min(1,t.intensity/100)),ie=.0125*B,X=1+.8*B,ne=52*Math.PI/180,N=()=>{c.textContent=String(W),l.textContent=String(K)},I=()=>{const le=n.clientWidth,se=n.clientHeight;if(le<=0||se<=0)return!1;const ye=le!==d||se!==p;return d=le,p=se,h=Math.max(8,d*.009),f=Math.max(58,p*.22),g=Math.max(12,Math.min(20,Math.min(d,p)*.026)),m=Math.max(22,d*.045),y=Math.max(210,Math.min(d,p)*.58)*q,i.style.width=`${h}px`,i.style.height=`${f}px`,r.style.width=`${h}px`,r.style.height=`${f}px`,o.style.width=`${g}px`,o.style.height=`${g}px`,ye&&O&&(b=Math.max(0,Math.min(p-f,b)),w=Math.max(0,Math.min(p-f,w)),M=Math.max(0,Math.min(p-f,M)),C=Math.max(0,Math.min(p-f,C)),A=Math.max(-g,Math.min(d,A)),_=Math.max(0,Math.min(p-g,_))),!0},re=le=>{A=d/2-g/2,_=p/2-g/2;const se=(12+a()*20)*Math.PI/180*(a()<.5?-1:1);D=le*y*Math.cos(se),j=y*Math.sin(se)},V=()=>{I()&&(b=p/2-f/2,w=b,k=0,x=0,M=b,C=w,re(a()<.5?-1:1),N(),O=!0,E=performance.now())},Y=(le,se,ye,pe,u,T,R)=>{const z=ye-le,S=Math.max(-pe,Math.min(pe,z*T))-se,$=u*R,L=se+Math.max(-$,Math.min($,S));let P=le+L*R;const F=Math.max(0,p-f);return P<0?(P=0,{position:P,velocity:Math.max(0,L)}):P>F?(P=F,{position:P,velocity:Math.min(0,L)}):{position:P,velocity:L}},me=(le,se)=>{const ye=Math.max(y,Math.hypot(D,j)),pe=y*X,u=Math.min(pe,ye*(1+ie)),T=_+g/2,R=Math.max(-1,Math.min(1,(T-(se+f/2))/(f/2))),z=Math.sin(ne),v=Math.max(-z,Math.min(z,j/ye)),S=R*z,$=v*.78+S*.22,L=.72,P=Math.sqrt(Math.max(0,1-L*L)),F=Math.max(-P,Math.min(P,$));j=u*F;const U=Math.sqrt(Math.max(0,u*u-j*j));D=le*U},ge=le=>{le==="left"?W+=1:K+=1,(W>=10||K>=10)&&(W=0,K=0),N(),re(le==="left"?-1:1)},de=le=>{const se=m,ye=d-m-h,pe=1e-6;let u=le,T=0;for(;u>pe&&T<12;){T+=1;let R=u+1,z=null;const v=(S,$)=>{S>=-pe&&S<=u+pe&&S<R&&(R=Math.max(0,S),z=$)};if(j<-pe&&v((0-_)/j,"top"),j>pe&&v((p-g-_)/j,"bottom"),D<-pe){const $=(se+h-A)/D;if($>=-pe&&$<=u+pe){const L=_+j*Math.max(0,$);L+g>=b&&L<=b+f&&v($,"left-paddle")}v((-g-A)/D,"right-score")}if(D>pe){const $=(ye-g-A)/D;if($>=-pe&&$<=u+pe){const L=_+j*Math.max(0,$);L+g>=w&&L<=w+f&&v($,"right-paddle")}v((d-A)/D,"left-score")}if(z===null){A+=D*u,_+=j*u,u=0;break}switch(A+=D*R,_+=j*R,u-=R,z){case"top":_=0,j=Math.abs(j);break;case"bottom":_=p-g,j=-Math.abs(j);break;case"left-paddle":A=se+h,me(1,b);break;case"right-paddle":A=ye-g,me(-1,w);break;case"left-score":ge("left");return;case"right-score":ge("right");return}if(R<=pe&&u>pe){const S=Math.min(u,1e-5);A+=D*S,_+=j*S,u-=S}}},fe=le=>{if(!e.isConnected)return;if(!O&&(V(),!O)){requestAnimationFrame(fe);return}I();const se=Math.min(Math.max((le-E)/1e3,0),1/30);E=le;const ye=p*(.72+te*.58)*q,pe=p*(2.2+te*2.8)*q,u=4.2+te*3.2,T=2.8+te*2.4,R=(1-te)*f*.72,z=_+g/2,v=Math.sin(le*.0013+.8)*R,S=Math.sin(le*.00117+2.2)*R,$=D<0?z+v-f/2:p/2-f/2,L=D>0?z+S-f/2:p/2-f/2,P=Math.max(0,p-f),F=Math.max(0,Math.min(P,$)),U=Math.max(0,Math.min(P,L)),Z=1-Math.exp(-T*se);M+=(F-M)*Z,C+=(U-C)*Z;const Q=Y(b,k,M,ye,pe,u,se);b=Q.position,k=Q.velocity;const ue=Y(w,x,C,ye,pe,u,se);w=ue.position,x=ue.velocity,de(se);const ae=m,be=d-m-h;i.style.transform=`translate3d(${ae}px, ${b}px, 0)`,r.style.transform=`translate3d(${be}px, ${w}px, 0)`,o.style.transform=`translate3d(${A}px, ${_}px, 0)`,requestAnimationFrame(fe)};requestAnimationFrame(fe)}const ji={definition:ce({id:"pong",name:"Retro Pong",description:"PĹ‚ynna rozgrywka Pong z AI, wynikiem i regulowanym przyspieszeniem.",category:"retro",tags:["pong","retro","arcade","game","physics"],defaultSettings:{...oe,opacity:82,density:62,speed:90,intensity:0,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:hi,streamElementsRendererName:"aeRenderPong",renderPreview(e,t,a){Pi(e,t,a)},streamElementsRendererSource:`
function aeRenderPong(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const arena = document.createElement("div");
  arena.className = "ae-pong-arena";

  const centerLine = document.createElement("span");
  centerLine.className = "ae-pong-center-line";

  const leftPaddle = document.createElement("span");
  leftPaddle.className = "ae-pong-paddle left";

  const rightPaddle = document.createElement("span");
  rightPaddle.className = "ae-pong-paddle right";

  const ball = document.createElement("span");
  ball.className = "ae-pong-ball";

  const leftScoreElement = document.createElement("span");
  leftScoreElement.className = "ae-pong-score left";

  const rightScoreElement = document.createElement("span");
  rightScoreElement.className = "ae-pong-score right";

  arena.append(
    centerLine,
    leftScoreElement,
    rightScoreElement,
    leftPaddle,
    rightPaddle,
    ball
  );

  layer.appendChild(arena);

  const s = effect.settings;
  const random = aeCreateSeededRandom(effect.seed);

  let width = 0;
  let height = 0;
  let paddleWidth = 10;
  let paddleHeight = 100;
  let ballSize = 14;
  let margin = 28;

  let leftY = 0;
  let rightY = 0;

  let leftPaddleVelocity = 0;
  let rightPaddleVelocity = 0;

  let leftAimY = 0;
  let rightAimY = 0;

  let ballX = 0;
  let ballY = 0;
  let velocityX = 0;
  let velocityY = 0;

  let leftScore = 0;
  let rightScore = 0;

  let lastTime = performance.now();
  let initialized = false;
  let baseBallSpeed = 260;

  const speedScale = Math.max(
    0.2,
    s.speed / 100
  );

  const aiSkill = Math.max(
    0.1,
    Math.min(
      1,
      s.density / 100
    )
  );

  const accelerationAmount = Math.max(
    0,
    Math.min(
      1,
      s.intensity / 100
    )
  );

  const accelerationPerHit =
    0.0125 * accelerationAmount;

  const maxSpeedMultiplier =
    1 + 0.8 * accelerationAmount;

  const maxBounceAngle =
    52 * Math.PI / 180;

  function updateScores() {
    leftScoreElement.textContent = String(leftScore);
    rightScoreElement.textContent = String(rightScore);
  }

  function updateGeometry() {
    const nextWidth = arena.clientWidth;
    const nextHeight = arena.clientHeight;

    if (
      nextWidth <= 0 ||
      nextHeight <= 0
    ) {
      return false;
    }

    const changed =
      nextWidth !== width ||
      nextHeight !== height;

    width = nextWidth;
    height = nextHeight;

    paddleWidth = Math.max(
      8,
      width * 0.009
    );

    paddleHeight = Math.max(
      58,
      height * 0.22
    );

    ballSize = Math.max(
      12,
      Math.min(
        20,
        Math.min(width, height) * 0.026
      )
    );

    margin = Math.max(
      22,
      width * 0.045
    );

    baseBallSpeed =
      Math.max(
        210,
        Math.min(width, height) * 0.58
      ) * speedScale;

    leftPaddle.style.width = paddleWidth + "px";
    leftPaddle.style.height = paddleHeight + "px";

    rightPaddle.style.width = paddleWidth + "px";
    rightPaddle.style.height = paddleHeight + "px";

    ball.style.width = ballSize + "px";
    ball.style.height = ballSize + "px";

    if (changed && initialized) {
      leftY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          leftY
        )
      );

      rightY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          rightY
        )
      );

      leftAimY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          leftAimY
        )
      );

      rightAimY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          rightAimY
        )
      );

      ballX = Math.max(
        -ballSize,
        Math.min(
          width,
          ballX
        )
      );

      ballY = Math.max(
        0,
        Math.min(
          height - ballSize,
          ballY
        )
      );
    }

    return true;
  }

  function resetBall(direction) {
    ballX = width / 2 - ballSize / 2;
    ballY = height / 2 - ballSize / 2;

    const serveAngle =
      (12 + random() * 20) *
      Math.PI / 180 *
      (random() < 0.5 ? -1 : 1);

    velocityX =
      direction *
      baseBallSpeed *
      Math.cos(serveAngle);

    velocityY =
      baseBallSpeed *
      Math.sin(serveAngle);
  }

  function initialize() {
    if (!updateGeometry()) {
      return;
    }

    leftY = height / 2 - paddleHeight / 2;
    rightY = leftY;

    leftPaddleVelocity = 0;
    rightPaddleVelocity = 0;

    leftAimY = leftY;
    rightAimY = rightY;

    resetBall(
      random() < 0.5 ? -1 : 1
    );

    updateScores();
    initialized = true;
    lastTime = performance.now();
  }

  function smoothPaddleStep(
    current,
    velocity,
    target,
    maxSpeed,
    maxAcceleration,
    response,
    dt
  ) {
    const distance =
      target - current;

    const desiredVelocity =
      Math.max(
        -maxSpeed,
        Math.min(
          maxSpeed,
          distance * response
        )
      );

    const velocityDelta =
      desiredVelocity - velocity;

    const maxVelocityDelta =
      maxAcceleration * dt;

    const nextVelocity =
      velocity +
      Math.max(
        -maxVelocityDelta,
        Math.min(
          maxVelocityDelta,
          velocityDelta
        )
      );

    let nextPosition =
      current +
      nextVelocity * dt;

    const maxY =
      Math.max(
        0,
        height - paddleHeight
      );

    if (nextPosition < 0) {
      nextPosition = 0;

      return {
        position: nextPosition,
        velocity: Math.max(
          0,
          nextVelocity
        )
      };
    }

    if (nextPosition > maxY) {
      nextPosition = maxY;

      return {
        position: nextPosition,
        velocity: Math.min(
          0,
          nextVelocity
        )
      };
    }

    return {
      position: nextPosition,
      velocity: nextVelocity
    };
  }

  function bounceFromPaddle(
    direction,
    paddleY
  ) {
    const currentSpeed = Math.max(
      baseBallSpeed,
      Math.hypot(velocityX, velocityY)
    );

    const maxBallSpeed =
      baseBallSpeed * maxSpeedMultiplier;

    const nextSpeed = Math.min(
      maxBallSpeed,
      currentSpeed *
        (1 + accelerationPerHit)
    );

    const ballCenterY =
      ballY + ballSize / 2;

    const hit = Math.max(
      -1,
      Math.min(
        1,
        (
          ballCenterY -
          (paddleY + paddleHeight / 2)
        ) /
        (paddleHeight / 2)
      )
    );

    const maxVerticalRatio =
      Math.sin(maxBounceAngle);

    const currentVerticalRatio = Math.max(
      -maxVerticalRatio,
      Math.min(
        maxVerticalRatio,
        velocityY / currentSpeed
      )
    );

    const targetVerticalRatio =
      hit * maxVerticalRatio;

    const nextVerticalRatio =
      currentVerticalRatio * 0.78 +
      targetVerticalRatio * 0.22;

    const minHorizontalRatio = 0.72;

    const maxVerticalForHorizontal =
      Math.sqrt(
        Math.max(
          0,
          1 -
            minHorizontalRatio *
            minHorizontalRatio
        )
      );

    const verticalRatio = Math.max(
      -maxVerticalForHorizontal,
      Math.min(
        maxVerticalForHorizontal,
        nextVerticalRatio
      )
    );

    velocityY =
      nextSpeed * verticalRatio;

    const horizontalSpeed = Math.sqrt(
      Math.max(
        0,
        nextSpeed * nextSpeed -
          velocityY * velocityY
      )
    );

    velocityX =
      direction * horizontalSpeed;
  }

  function scorePoint(scorer) {
    if (scorer === "left") {
      leftScore += 1;
    }
    else {
      rightScore += 1;
    }

    if (
      leftScore >= 10 ||
      rightScore >= 10
    ) {
      leftScore = 0;
      rightScore = 0;
    }

    updateScores();

    resetBall(
      scorer === "left"
        ? -1
        : 1
    );
  }

  function simulateBall(dt) {
    const leftX = margin;
    const rightX =
      width - margin - paddleWidth;

    const epsilon = 0.000001;
    let remaining = dt;
    let iterations = 0;

    while (
      remaining > epsilon &&
      iterations < 12
    ) {
      iterations += 1;

      let collisionTime =
        remaining + 1;
      let collision = null;

      function consider(time, type) {
        if (
          time >= -epsilon &&
          time <= remaining + epsilon &&
          time < collisionTime
        ) {
          collisionTime = Math.max(0, time);
          collision = type;
        }
      }

      if (velocityY < -epsilon) {
        consider(
          (0 - ballY) / velocityY,
          "top"
        );
      }

      if (velocityY > epsilon) {
        consider(
          (height - ballSize - ballY) / velocityY,
          "bottom"
        );
      }

      if (velocityX < -epsilon) {
        const contactX =
          leftX + paddleWidth;
        const paddleTime =
          (contactX - ballX) / velocityX;

        if (
          paddleTime >= -epsilon &&
          paddleTime <= remaining + epsilon
        ) {
          const yAtContact =
            ballY +
            velocityY * Math.max(0, paddleTime);

          if (
            yAtContact + ballSize >= leftY &&
            yAtContact <= leftY + paddleHeight
          ) {
            consider(paddleTime, "left-paddle");
          }
        }

        consider(
          (-ballSize - ballX) / velocityX,
          "right-score"
        );
      }

      if (velocityX > epsilon) {
        const contactX =
          rightX - ballSize;
        const paddleTime =
          (contactX - ballX) / velocityX;

        if (
          paddleTime >= -epsilon &&
          paddleTime <= remaining + epsilon
        ) {
          const yAtContact =
            ballY +
            velocityY * Math.max(0, paddleTime);

          if (
            yAtContact + ballSize >= rightY &&
            yAtContact <= rightY + paddleHeight
          ) {
            consider(paddleTime, "right-paddle");
          }
        }

        consider(
          (width - ballX) / velocityX,
          "left-score"
        );
      }

      if (collision === null) {
        ballX += velocityX * remaining;
        ballY += velocityY * remaining;
        remaining = 0;
        break;
      }

      ballX += velocityX * collisionTime;
      ballY += velocityY * collisionTime;
      remaining -= collisionTime;

      switch (collision) {
        case "top":
          ballY = 0;
          velocityY = Math.abs(velocityY);
          break;

        case "bottom":
          ballY = height - ballSize;
          velocityY = -Math.abs(velocityY);
          break;

        case "left-paddle":
          ballX = leftX + paddleWidth;
          bounceFromPaddle(1, leftY);
          break;

        case "right-paddle":
          ballX = rightX - ballSize;
          bounceFromPaddle(-1, rightY);
          break;

        case "left-score":
          scorePoint("left");
          return;

        case "right-score":
          scorePoint("right");
          return;
      }

      if (
        collisionTime <= epsilon &&
        remaining > epsilon
      ) {
        const nudge = Math.min(
          remaining,
          0.00001
        );

        ballX += velocityX * nudge;
        ballY += velocityY * nudge;
        remaining -= nudge;
      }
    }
  }

  function frame(now) {
    if (!layer.isConnected) {
      return;
    }

    if (!initialized) {
      initialize();

      if (!initialized) {
        requestAnimationFrame(frame);
        return;
      }
    }

    updateGeometry();

    const dt = Math.min(
      Math.max(
        (now - lastTime) / 1000,
        0
      ),
      1 / 30
    );

    lastTime = now;

    const paddleSpeed =
      height *
      (0.72 + aiSkill * 0.58) *
      speedScale;

    const paddleAcceleration =
      height *
      (2.2 + aiSkill * 2.8) *
      speedScale;

    const paddleResponse =
      4.2 + aiSkill * 3.2;

    const aimResponse =
      2.8 + aiSkill * 2.4;

    const errorAmplitude =
      (1 - aiSkill) *
      paddleHeight *
      0.72;

    const ballCenterY =
      ballY + ballSize / 2;

    const leftError =
      Math.sin(
        now * 0.0013 + 0.8
      ) *
      errorAmplitude;

    const rightError =
      Math.sin(
        now * 0.00117 + 2.2
      ) *
      errorAmplitude;

    const rawLeftTarget =
      velocityX < 0
        ? ballCenterY +
          leftError -
          paddleHeight / 2
        : height / 2 -
          paddleHeight / 2;

    const rawRightTarget =
      velocityX > 0
        ? ballCenterY +
          rightError -
          paddleHeight / 2
        : height / 2 -
          paddleHeight / 2;

    const maxPaddleY =
      Math.max(
        0,
        height - paddleHeight
      );

    const clampedLeftTarget =
      Math.max(
        0,
        Math.min(
          maxPaddleY,
          rawLeftTarget
        )
      );

    const clampedRightTarget =
      Math.max(
        0,
        Math.min(
          maxPaddleY,
          rawRightTarget
        )
      );

    const aimBlend =
      1 -
      Math.exp(
        -aimResponse * dt
      );

    leftAimY +=
      (
        clampedLeftTarget -
        leftAimY
      ) *
      aimBlend;

    rightAimY +=
      (
        clampedRightTarget -
        rightAimY
      ) *
      aimBlend;

    const leftStep =
      smoothPaddleStep(
        leftY,
        leftPaddleVelocity,
        leftAimY,
        paddleSpeed,
        paddleAcceleration,
        paddleResponse,
        dt
      );

    leftY =
      leftStep.position;

    leftPaddleVelocity =
      leftStep.velocity;

    const rightStep =
      smoothPaddleStep(
        rightY,
        rightPaddleVelocity,
        rightAimY,
        paddleSpeed,
        paddleAcceleration,
        paddleResponse,
        dt
      );

    rightY =
      rightStep.position;

    rightPaddleVelocity =
      rightStep.velocity;

    simulateBall(dt);

    const leftX = margin;
    const rightX =
      width - margin - paddleWidth;

    leftPaddle.style.transform =
      "translate3d(" +
      leftX +
      "px, " +
      leftY +
      "px, 0)";

    rightPaddle.style.transform =
      "translate3d(" +
      rightX +
      "px, " +
      rightY +
      "px, 0)";

    ball.style.transform =
      "translate3d(" +
      ballX +
      "px, " +
      ballY +
      "px, 0)";

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
`.trim(),estimateDomNodes(){return 7}},_i={definition:ce({id:"bubbles",name:"Bubbles",description:"Przezroczyste bÄ…belki unoszÄ…ce siÄ™ ku gĂłrze.",category:"calm",tags:["bubbles","water","calm","float"],defaultSettings:{...oe,opacity:72,density:52,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:gi,streamElementsRendererName:"aeRenderBubbles",renderPreview(e,t,a){const n=H(32,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-bubble";const o=12+a()*48;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(7+a()*8)/s}s`,r.style.setProperty("--ae-bubble-drift",`${-65+a()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderBubbles(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(32 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const bubble = document.createElement("span");
    bubble.className = "ae-bubble";
    const size = 12 + random() * 48;
    bubble.style.left = random() * 100 + "%";
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.animationDelay = -random() * 10 + "s";
    bubble.style.animationDuration = ((7 + random() * 8) / speed) + "s";
    bubble.style.setProperty("--ae-bubble-drift", (-65 + random() * 130) + "px");
    layer.appendChild(bubble);
  }
}
`.trim(),estimateDomNodes(e){return H(32,e,1)}},$i={definition:ce({id:"fireflies",name:"Fireflies",description:"MigoczÄ…ce Ĺ›wietliki poruszajÄ…ce siÄ™ w ciemnoĹ›ci.",category:"botanical",tags:["fireflies","nature","glow","night"],defaultSettings:{...oe,opacity:84,density:48,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:bi,streamElementsRendererName:"aeRenderFireflies",renderPreview(e,t,a){const n=H(38,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-firefly";const o=2+a()*5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-firefly-x",`${-75+a()*150}px`),r.style.setProperty("--ae-firefly-y",`${-65+a()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderFireflies(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(38 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const fly = document.createElement("span");
    fly.className = "ae-firefly";
    const size = 2 + random() * 5;
    fly.style.left = random() * 100 + "%";
    fly.style.top = random() * 100 + "%";
    fly.style.width = size + "px";
    fly.style.height = size + "px";
    fly.style.animationDelay = -random() * 8 + "s";
    fly.style.animationDuration = ((4 + random() * 7) / speed) + "s";
    fly.style.setProperty("--ae-firefly-x", (-75 + random() * 150) + "px");
    fly.style.setProperty("--ae-firefly-y", (-65 + random() * 130) + "px");
    layer.appendChild(fly);
  }
}
`.trim(),estimateDomNodes(e){return H(38,e,1)}},Ri={definition:ce({id:"confetti",name:"Confetti",description:"Kolorowe konfetti opadajÄ…ce przez ekran.",category:"other",tags:["confetti","party","celebration","color"],defaultSettings:{...oe,opacity:90,density:58,speed:80},performanceCost:2,requiresJavaScript:!0}),css:wi,streamElementsRendererName:"aeRenderConfetti",renderPreview(e,t,a){const n=["#ff4f9a","#ffe45c","#65e6ff","#7dff86","#b780ff","#ff8a42"],s=H(55,t),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-confetti",o.style.left=`${a()*100}%`,o.style.width=`${5+a()*8}px`,o.style.height=`${9+a()*13}px`,o.style.background=n[Math.floor(a()*n.length)]??"#ff4f9a",o.style.animationDelay=`${-a()*8}s`,o.style.animationDuration=`${(5+a()*7)/i}s`,o.style.setProperty("--ae-confetti-drift",`${-85+a()*170}px`),o.style.setProperty("--ae-confetti-rot",`${420+a()*720}deg`),e.appendChild(o)}},streamElementsRendererSource:`
function aeRenderConfetti(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const colors = ["#ff4f9a","#ffe45c","#65e6ff","#7dff86","#b780ff","#ff8a42"];
  const count = Math.round(55 * (s.density / 100));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "ae-confetti";
    piece.style.left = random() * 100 + "%";
    piece.style.width = (5 + random() * 8) + "px";
    piece.style.height = (9 + random() * 13) + "px";
    piece.style.background = colors[Math.floor(random() * colors.length)] || "#ff4f9a";
    piece.style.animationDelay = -random() * 8 + "s";
    piece.style.animationDuration = ((5 + random() * 7) / speed) + "s";
    piece.style.setProperty("--ae-confetti-drift", (-85 + random() * 170) + "px");
    piece.style.setProperty("--ae-confetti-rot", (420 + random() * 720) + "deg");
    layer.appendChild(piece);
  }
}
`.trim(),estimateDomNodes(e){return H(55,e)}},Ii={definition:ce({id:"dust-motes",name:"Dust Motes",description:"Subtelny kurz unoszÄ…cy siÄ™ w Ĺ›wietle.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],defaultSettings:{...oe,opacity:55,density:48,speed:38,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:ki,streamElementsRendererName:"aeRenderDustMotes",renderPreview(e,t,a){const n=H(48,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-dust-mote";const o=1+a()*4;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*13}s`,r.style.animationDuration=`${(9+a()*10)/s}s`,r.style.setProperty("--ae-mote-x",`${-55+a()*110}px`),r.style.setProperty("--ae-mote-y",`${-55+a()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderDustMotes(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(48 * (s.density / 100));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const mote = document.createElement("span");
    mote.className = "ae-dust-mote";
    const size = 1 + random() * 4;
    mote.style.left = random() * 100 + "%";
    mote.style.top = random() * 100 + "%";
    mote.style.width = size + "px";
    mote.style.height = size + "px";
    mote.style.animationDelay = -random() * 13 + "s";
    mote.style.animationDuration = ((9 + random() * 10) / speed) + "s";
    mote.style.setProperty("--ae-mote-x", (-55 + random() * 110) + "px");
    mote.style.setProperty("--ae-mote-y", (-55 + random() * 110) + "px");
    layer.appendChild(mote);
  }
}
`.trim(),estimateDomNodes(e){return H(48,e)}},Ai={definition:ce({id:"aurora",name:"Aurora",description:"MiÄ™kkie, kolorowe pasma zorzy polarnej.",category:"cosmic",tags:["aurora","cosmic","sky","glow"],defaultSettings:{...oe,opacity:72,density:55,speed:42,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:vi,streamElementsRendererName:"aeRenderAurora",renderPreview(e,t,a){const n=H(5,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-aurora-band",r.style.top=`${5+a()*70}%`,r.style.height=`${18+a()*28}%`,r.style.animationDelay=`${-a()*11}s`,r.style.animationDuration=`${(8+a()*8)/s}s`,r.style.setProperty("--ae-aurora-angle",`${-16+a()*24}deg`),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderAurora(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(5 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const band = document.createElement("span");
    band.className = "ae-aurora-band";
    band.style.top = (5 + random() * 70) + "%";
    band.style.height = (18 + random() * 28) + "%";
    band.style.animationDelay = -random() * 11 + "s";
    band.style.animationDuration = ((8 + random() * 8) / speed) + "s";
    band.style.setProperty("--ae-aurora-angle", (-16 + random() * 24) + "deg");
    layer.appendChild(band);
  }
}
`.trim(),estimateDomNodes(e){return H(5,e,1)}},Ni=`
.ae-hologram-scan {
  position: absolute;
  left: -5%;
  width: 110%;
  height: var(--ae-holo-height, 4%);
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(80, 245, 255, .18) 14%,
    rgba(120, 255, 255, .9) 50%,
    rgba(120, 150, 255, .28) 86%,
    transparent
  );
  box-shadow:
    0 0 8px rgba(90, 245, 255, .75),
    0 0 28px rgba(90, 180, 255, .35);
  animation: ae-hologram-scan var(--ae-holo-duration, 5s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-hologram-scan {
  0% { transform: translateY(-12vh); opacity: 0; }
  12% { opacity: .9; }
  88% { opacity: .9; }
  100% { transform: translateY(124vh); opacity: 0; }
}
`.trim(),Li=`
.ae-glitch-block {
  position: absolute;
  border: 1px solid rgba(110, 245, 255, .35);
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, .25),
    rgba(170, 60, 255, .38)
  );
  box-shadow: 0 0 14px rgba(80, 210, 255, .24);
  animation: ae-glitch-block steps(2, end) infinite;
  will-change: transform, opacity;
}
@keyframes ae-glitch-block {
  0%, 74%, 100% { transform: translateX(0); opacity: .08; }
  76% { transform: translateX(var(--ae-glitch-x, 22px)); opacity: .92; }
  82% { transform: translateX(var(--ae-glitch-x2, -11px)); opacity: .35; }
  88% { transform: translateX(var(--ae-glitch-x, 22px)); opacity: .75; }
}
`.trim(),Di=`
.ae-hex-grid {
  position: absolute;
  inset: -10%;
  background-color: transparent;
  background-image:
    linear-gradient(30deg, rgba(60, 220, 255, .16) 12%, transparent 12.5%, transparent 87%, rgba(60, 220, 255, .16) 87.5%, rgba(60, 220, 255, .16)),
    linear-gradient(150deg, rgba(60, 220, 255, .16) 12%, transparent 12.5%, transparent 87%, rgba(60, 220, 255, .16) 87.5%, rgba(60, 220, 255, .16)),
    linear-gradient(30deg, rgba(170, 90, 255, .12) 12%, transparent 12.5%, transparent 87%, rgba(170, 90, 255, .12) 87.5%, rgba(170, 90, 255, .12)),
    linear-gradient(150deg, rgba(170, 90, 255, .12) 12%, transparent 12.5%, transparent 87%, rgba(170, 90, 255, .12) 87.5%, rgba(170, 90, 255, .12)),
    linear-gradient(60deg, rgba(80, 170, 255, .11) 25%, transparent 25.5%, transparent 75%, rgba(80, 170, 255, .11) 75%, rgba(80, 170, 255, .11)),
    linear-gradient(60deg, rgba(80, 170, 255, .11) 25%, transparent 25.5%, transparent 75%, rgba(80, 170, 255, .11) 75%, rgba(80, 170, 255, .11));
  background-size:
    var(--ae-hex-w, 72px)
    var(--ae-hex-h, 124px);
  background-position:
    0 0,
    0 0,
    var(--ae-hex-half, 36px)
    var(--ae-hex-half-y, 62px),
    var(--ae-hex-half, 36px)
    var(--ae-hex-half-y, 62px),
    0 0,
    var(--ae-hex-half, 36px)
    var(--ae-hex-half-y, 62px);
  animation: ae-hex-grid-drift var(--ae-hex-duration, 12s) linear infinite;
  will-change: background-position;
}
@keyframes ae-hex-grid-drift {
  to {
    background-position:
      var(--ae-hex-w, 72px)
      var(--ae-hex-h, 124px),
      var(--ae-hex-w, 72px)
      var(--ae-hex-h, 124px),
      var(--ae-hex-x2, 108px)
      var(--ae-hex-y2, 186px),
      var(--ae-hex-x2, 108px)
      var(--ae-hex-y2, 186px),
      var(--ae-hex-w, 72px)
      var(--ae-hex-h, 124px),
      var(--ae-hex-x2, 108px)
      var(--ae-hex-y2, 186px);
  }
}
`.trim(),Ti=`
.ae-portal-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 2px solid rgba(125, 100, 255, .72);
  border-left-color: rgba(70, 240, 255, .95);
  border-right-color: rgba(220, 85, 255, .82);
  border-radius: 50%;
  box-shadow:
    0 0 10px rgba(80, 230, 255, .4),
    inset 0 0 12px rgba(155, 80, 255, .25);
  animation: ae-portal-ring var(--ae-portal-duration, 10s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-portal-ring {
  from { transform: translate(-50%, -50%) rotate(0deg) scale(.95); opacity: .48; }
  50% { opacity: 1; }
  to { transform: translate(-50%, -50%) rotate(360deg) scale(1.05); opacity: .48; }
}
`.trim(),Oi=`
.ae-magic-circle {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  background:
    repeating-conic-gradient(
      from 0deg,
      rgba(190, 110, 255, .85) 0 3deg,
      transparent 3deg 13deg
    );
  -webkit-mask:
    radial-gradient(
      circle,
      transparent 0 54%,
      #000 55% 61%,
      transparent 62% 72%,
      #000 73% 77%,
      transparent 78%
    );
  mask:
    radial-gradient(
      circle,
      transparent 0 54%,
      #000 55% 61%,
      transparent 62% 72%,
      #000 73% 77%,
      transparent 78%
    );
  filter: drop-shadow(0 0 7px rgba(180, 95, 255, .65));
  animation: ae-magic-circle var(--ae-circle-duration, 16s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-magic-circle {
  from { transform: translate(-50%, -50%) rotate(0deg); opacity: .42; }
  50% { opacity: 1; }
  to { transform: translate(-50%, -50%) rotate(360deg); opacity: .42; }
}
`.trim(),qi=`
.ae-crystal-shard {
  position: absolute;
  clip-path: polygon(50% 0, 100% 42%, 66% 100%, 20% 82%, 0 34%);
  background: linear-gradient(
    135deg,
    rgba(255,255,255,.86),
    rgba(80,225,255,.42) 34%,
    rgba(140,80,255,.58) 72%,
    rgba(255,100,235,.3)
  );
  box-shadow: 0 0 14px rgba(100,210,255,.3);
  animation: ae-crystal-drift var(--ae-crystal-duration, 12s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-crystal-drift {
  0%, 100% { transform: translate(0, 18px) rotate(-12deg); opacity: .18; }
  50% { transform: translate(var(--ae-crystal-x, 28px), -48px) rotate(22deg); opacity: .92; }
}
`.trim(),Fi=`
.ae-steam-puff {
  position: absolute;
  bottom: -12%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(235,245,255,.55),
    rgba(170,190,205,.24) 45%,
    transparent 72%
  );
  filter: blur(8px);
  animation: ae-steam-rise var(--ae-steam-duration, 10s) ease-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-steam-rise {
  0% { transform: translateY(14vh) scale(.5); opacity: 0; }
  15% { opacity: .62; }
  100% { transform: translateY(-118vh) translateX(var(--ae-steam-x, 35px)) scale(2.1); opacity: 0; }
}
`.trim(),Bi=`
.ae-gear {
  position: absolute;
  border-radius: 50%;
  background:
    repeating-conic-gradient(
      rgba(220,180,105,.92) 0 8deg,
      rgba(95,70,38,.28) 8deg 16deg
    );
  box-shadow:
    0 0 8px rgba(255,180,70,.2),
    inset 0 0 0 8px rgba(20,18,16,.68);
  animation: ae-gear-spin var(--ae-gear-duration, 14s) linear infinite;
  will-change: transform;
}
.ae-gear::after {
  content: "";
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: rgba(8,10,14,.92);
  box-shadow: inset 0 0 0 2px rgba(255,190,90,.2);
}
@keyframes ae-gear-spin {
  to { transform: rotate(var(--ae-gear-rot, 360deg)); }
}
`.trim(),Wi=`
.ae-city-light {
  position: absolute;
  border-radius: 1px;
  background: rgba(255, 215, 120, .92);
  box-shadow:
    0 0 5px rgba(255, 190, 90, .62),
    0 0 12px rgba(90, 160, 255, .18);
  animation: ae-city-light var(--ae-city-duration, 4s) steps(2, end) infinite;
}
@keyframes ae-city-light {
  0%, 100% { opacity: .18; }
  45% { opacity: 1; }
  62% { opacity: .38; }
}
`.trim(),Ui=`
.ae-traffic-trail {
  position: absolute;
  left: -30%;
  height: 3px;
  width: var(--ae-trail-width, 24%);
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 75, 95, .75),
    rgba(255, 230, 150, .95)
  );
  box-shadow: 0 0 10px rgba(255, 90, 75, .34);
  animation: ae-traffic-trail var(--ae-traffic-duration, 5s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-traffic-trail {
  0% { transform: translateX(-15vw); opacity: 0; }
  12% { opacity: .9; }
  88% { opacity: .9; }
  100% { transform: translateX(155vw); opacity: 0; }
}
`.trim(),Xi=`
.ae-vhs-band {
  position: absolute;
  left: 0;
  width: 100%;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,.08) 0 3px,
      rgba(0,255,255,.08) 3px 6px,
      rgba(255,0,190,.06) 6px 9px,
      transparent 9px 13px
    );
  mix-blend-mode: screen;
  animation: ae-vhs-band var(--ae-vhs-duration, 2.8s) steps(3, end) infinite;
  will-change: transform, opacity;
}
@keyframes ae-vhs-band {
  0%, 100% { transform: translateX(0); opacity: .08; }
  22% { transform: translateX(18px); opacity: .56; }
  48% { transform: translateX(-12px); opacity: .22; }
  72% { transform: translateX(7px); opacity: .74; }
}
`.trim(),Zi=`
.ae-solar-flare {
  position: absolute;
  border: 3px solid rgba(255, 155, 60, .72);
  border-left-color: transparent;
  border-bottom-color: rgba(255, 225, 120, .18);
  border-radius: 50%;
  box-shadow:
    0 0 10px rgba(255,145,55,.55),
    0 0 28px rgba(255,80,25,.28);
  animation: ae-solar-flare var(--ae-solar-duration, 9s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-solar-flare {
  0%, 100% { transform: rotate(-20deg) scale(.72); opacity: .16; }
  50% { transform: rotate(18deg) scale(1.22); opacity: .92; }
}
`.trim(),Gi={definition:ce({id:"hologram-scan",name:"Hologram Scan",description:"Cyanowe pasma skanujace przesuwajace sie po ekranie.",category:"sci-fi",tags:["hologram","scan","sci-fi","cyan"],defaultSettings:{...oe,opacity:68,density:45,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ni,streamElementsRendererName:"aeRenderHologramScan",renderPreview(e,t,a){const n=H(7,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-hologram-scan",r.style.top=`${-20+a()*30}%`,r.style.setProperty("--ae-holo-height",`${1+a()*5}%`),r.style.setProperty("--ae-holo-duration",`${(4+a()*4)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderHologramScan(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(7 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("span");
    bar.className = "ae-hologram-scan";
    bar.style.top = (-20 + random() * 30) + "%";
    bar.style.setProperty("--ae-holo-height", (1 + random() * 5) + "%");
    bar.style.setProperty("--ae-holo-duration", ((4 + random() * 4) / speed) + "s");
    bar.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(bar);
  }
}
`.trim(),estimateDomNodes(e){return H(7,e,1)}},Hi={definition:ce({id:"glitch-blocks",name:"Glitch Blocks",description:"Cyfrowe prostokaty pojawiajace sie w losowych miejscach.",category:"tech",tags:["glitch","blocks","digital","tech"],defaultSettings:{...oe,opacity:62,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Li,streamElementsRendererName:"aeRenderGlitchBlocks",renderPreview(e,t,a){const n=H(26,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-glitch-block",r.style.left=`${a()*94}%`,r.style.top=`${a()*94}%`,r.style.width=`${18+a()*150}px`,r.style.height=`${3+a()*28}px`;const o=-45+a()*90;r.style.setProperty("--ae-glitch-x",`${o}px`),r.style.setProperty("--ae-glitch-x2",`${-o*.5}px`),r.style.animationDuration=`${(.8+a()*3.2)/s}s`,r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderGlitchBlocks(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(26 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const block = document.createElement("span");
    block.className = "ae-glitch-block";
    block.style.left = random() * 94 + "%";
    block.style.top = random() * 94 + "%";
    block.style.width = (18 + random() * 150) + "px";
    block.style.height = (3 + random() * 28) + "px";
    const glitchX = -45 + random() * 90;
    block.style.setProperty("--ae-glitch-x", glitchX + "px");
    block.style.setProperty("--ae-glitch-x2", (-glitchX * .5) + "px");
    block.style.animationDuration = ((.8 + random() * 3.2) / speed) + "s";
    block.style.animationDelay = (-random() * 4) + "s";
    layer.appendChild(block);
  }
}
`.trim(),estimateDomNodes(e){return H(26,e,1)}},Yi={definition:ce({id:"hex-grid",name:"Hex Grid",description:"Techniczna siatka szesciokatow przesuwajaca sie w tle.",category:"sci-fi",tags:["hex","grid","sci-fi","hud"],defaultSettings:{...oe,opacity:48,density:50,speed:45,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:Di,streamElementsRendererName:"aeRenderHexGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-hex-grid";const n=Math.max(34,96-t.density*.55);a.style.setProperty("--ae-hex-w",`${n}px`),a.style.setProperty("--ae-hex-h",`${n*1.73}px`),a.style.setProperty("--ae-hex-half",`${n*.5}px`),a.style.setProperty("--ae-hex-half-y",`${n*.865}px`),a.style.setProperty("--ae-hex-x2",`${n*1.5}px`),a.style.setProperty("--ae-hex-y2",`${n*2.595}px`),a.style.setProperty("--ae-hex-duration",`${14/Math.max(.1,t.speed/100)}s`),e.appendChild(a)},streamElementsRendererSource:`
function aeRenderHexGrid(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const s = effect.settings;
  const grid = document.createElement("span");
  grid.className = "ae-hex-grid";
  const size = Math.max(34, 96 - s.density * .55);
  grid.style.setProperty("--ae-hex-w", size + "px");
  grid.style.setProperty("--ae-hex-h", (size * 1.73) + "px");
  grid.style.setProperty("--ae-hex-half", (size * .5) + "px");
  grid.style.setProperty("--ae-hex-half-y", (size * .865) + "px");
  grid.style.setProperty("--ae-hex-x2", (size * 1.5) + "px");
  grid.style.setProperty("--ae-hex-y2", (size * 2.595) + "px");
  grid.style.setProperty("--ae-hex-duration", (14 / Math.max(.1, s.speed / 100)) + "s");
  layer.appendChild(grid);
}
`.trim(),estimateDomNodes(){return 1}},Ji={definition:ce({id:"portal-rings",name:"Portal Rings",description:"Koncentryczne neonowe pierscienie magicznego portalu.",category:"fantasy",tags:["portal","rings","magic","fantasy"],defaultSettings:{...oe,opacity:78,density:60,speed:65,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ti,streamElementsRendererName:"aeRenderPortalRings",renderPreview(e,t,a){const n=H(7,t,2),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-portal-ring";const o=110+i*42+a()*18;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-portal-duration",`${(7+a()*8)/s}s`),r.style.animationDirection=i%2===0?"normal":"reverse",r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderPortalRings(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(2, Math.round(7 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const ring = document.createElement("span");
    ring.className = "ae-portal-ring";
    const size = 110 + i * 42 + random() * 18;
    ring.style.width = size + "px";
    ring.style.height = size + "px";
    ring.style.setProperty("--ae-portal-duration", ((7 + random() * 8) / speed) + "s");
    ring.style.animationDirection = i % 2 === 0 ? "normal" : "reverse";
    ring.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(ring);
  }
}
`.trim(),estimateDomNodes(e){return H(7,e,2)}},Vi={definition:ce({id:"magic-circle",name:"Magic Circle",description:"Obracajace sie okregi i segmenty magicznego sigilu.",category:"fantasy",tags:["magic","circle","sigil","fantasy"],defaultSettings:{...oe,opacity:72,density:55,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Oi,streamElementsRendererName:"aeRenderMagicCircle",renderPreview(e,t,a){const n=H(5,t,2),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-magic-circle";const o=150+i*48+a()*22;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-circle-duration",`${(11+a()*10)/s}s`),r.style.animationDirection=i%2===0?"normal":"reverse",e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderMagicCircle(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(2, Math.round(5 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const circle = document.createElement("span");
    circle.className = "ae-magic-circle";
    const size = 150 + i * 48 + random() * 22;
    circle.style.width = size + "px";
    circle.style.height = size + "px";
    circle.style.setProperty("--ae-circle-duration", ((11 + random() * 10) / speed) + "s");
    circle.style.animationDirection = i % 2 === 0 ? "normal" : "reverse";
    layer.appendChild(circle);
  }
}
`.trim(),estimateDomNodes(e){return H(5,e,2)}},Ki={definition:ce({id:"crystal-shards",name:"Crystal Shards",description:"Lekkie, swiecace odlamki krysztalow unoszace sie w przestrzeni.",category:"fantasy",tags:["crystal","shards","fantasy","glow"],defaultSettings:{...oe,opacity:70,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:qi,streamElementsRendererName:"aeRenderCrystalShards",renderPreview(e,t,a){const n=H(24,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-crystal-shard";const o=6+a()*18,c=o*(1.8+a());r.style.left=`${a()*96}%`,r.style.top=`${a()*94}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.setProperty("--ae-crystal-x",`${-48+a()*96}px`),r.style.setProperty("--ae-crystal-duration",`${(8+a()*10)/s}s`),r.style.animationDelay=`${-a()*12}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderCrystalShards(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(24 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const shard = document.createElement("span");
    shard.className = "ae-crystal-shard";
    const width = 6 + random() * 18;
    const height = width * (1.8 + random());
    shard.style.left = random() * 96 + "%";
    shard.style.top = random() * 94 + "%";
    shard.style.width = width + "px";
    shard.style.height = height + "px";
    shard.style.setProperty("--ae-crystal-x", (-48 + random() * 96) + "px");
    shard.style.setProperty("--ae-crystal-duration", ((8 + random() * 10) / speed) + "s");
    shard.style.animationDelay = (-random() * 12) + "s";
    layer.appendChild(shard);
  }
}
`.trim(),estimateDomNodes(e){return H(24,e,1)}},Qi={definition:ce({id:"steam-vents",name:"Steam Vents",description:"Kleby pary unoszace sie od dolnej krawedzi.",category:"steampunk",tags:["steam","vents","steampunk","smoke"],defaultSettings:{...oe,opacity:55,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Fi,streamElementsRendererName:"aeRenderSteamVents",renderPreview(e,t,a){const n=H(16,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-steam-puff";const o=55+a()*120;r.style.left=`${a()*94}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-steam-x",`${-65+a()*130}px`),r.style.setProperty("--ae-steam-duration",`${(7+a()*8)/s}s`),r.style.animationDelay=`${-a()*10}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSteamVents(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(16 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const puff = document.createElement("span");
    puff.className = "ae-steam-puff";
    const size = 55 + random() * 120;
    puff.style.left = random() * 94 + "%";
    puff.style.width = size + "px";
    puff.style.height = size + "px";
    puff.style.setProperty("--ae-steam-x", (-65 + random() * 130) + "px");
    puff.style.setProperty("--ae-steam-duration", ((7 + random() * 8) / speed) + "s");
    puff.style.animationDelay = (-random() * 10) + "s";
    layer.appendChild(puff);
  }
}
`.trim(),estimateDomNodes(e){return H(16,e,1)}},eo={definition:ce({id:"gears",name:"Gears",description:"Obracajace sie mosiezne kola zebate w stylu steampunk.",category:"steampunk",tags:["gears","cogs","steampunk","mechanical"],defaultSettings:{...oe,opacity:62,density:45,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Bi,streamElementsRendererName:"aeRenderGears",renderPreview(e,t,a){const n=H(9,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-gear";const o=45+a()*130;r.style.left=`${a()*88}%`,r.style.top=`${a()*84}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-gear-duration",`${(8+a()*16)/s}s`),r.style.setProperty("--ae-gear-rot",i%2===0?"360deg":"-360deg"),e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderGears(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(9 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const gear = document.createElement("span");
    gear.className = "ae-gear";
    const size = 45 + random() * 130;
    gear.style.left = random() * 88 + "%";
    gear.style.top = random() * 84 + "%";
    gear.style.width = size + "px";
    gear.style.height = size + "px";
    gear.style.setProperty("--ae-gear-duration", ((8 + random() * 16) / speed) + "s");
    gear.style.setProperty("--ae-gear-rot", i % 2 === 0 ? "360deg" : "-360deg");
    layer.appendChild(gear);
  }
}
`.trim(),estimateDomNodes(e){return H(9,e,1)}},to={definition:ce({id:"city-lights",name:"City Lights",description:"Migoczace swiatla nocnego miasta.",category:"urban",tags:["city","lights","urban","night"],defaultSettings:{...oe,opacity:72,density:65,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Wi,streamElementsRendererName:"aeRenderCityLights",renderPreview(e,t,a){const n=H(48,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-city-light",r.style.left=`${a()*98}%`,r.style.top=`${45+a()*52}%`,r.style.width=`${2+a()*7}px`,r.style.height=`${2+a()*10}px`,r.style.setProperty("--ae-city-duration",`${(2+a()*6)/s}s`),r.style.animationDelay=`${-a()*7}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderCityLights(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(48 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const light = document.createElement("span");
    light.className = "ae-city-light";
    light.style.left = random() * 98 + "%";
    light.style.top = (45 + random() * 52) + "%";
    light.style.width = (2 + random() * 7) + "px";
    light.style.height = (2 + random() * 10) + "px";
    light.style.setProperty("--ae-city-duration", ((2 + random() * 6) / speed) + "s");
    light.style.animationDelay = (-random() * 7) + "s";
    layer.appendChild(light);
  }
}
`.trim(),estimateDomNodes(e){return H(48,e,1)}},ao={definition:ce({id:"traffic-trails",name:"Traffic Trails",description:"Smugi swiatel samochodow przecinajace dol ekranu.",category:"urban",tags:["traffic","trails","urban","lights"],defaultSettings:{...oe,opacity:72,density:50,speed:90,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ui,streamElementsRendererName:"aeRenderTrafficTrails",renderPreview(e,t,a){const n=H(14,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-traffic-trail",r.style.top=`${55+a()*40}%`,r.style.setProperty("--ae-trail-width",`${12+a()*28}%`),r.style.setProperty("--ae-traffic-duration",`${(3+a()*5)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderTrafficTrails(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(14 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const trail = document.createElement("span");
    trail.className = "ae-traffic-trail";
    trail.style.top = (55 + random() * 40) + "%";
    trail.style.setProperty("--ae-trail-width", (12 + random() * 28) + "%");
    trail.style.setProperty("--ae-traffic-duration", ((3 + random() * 5) / speed) + "s");
    trail.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(trail);
  }
}
`.trim(),estimateDomNodes(e){return H(14,e,1)}},no={definition:ce({id:"vhs-static",name:"VHS Static",description:"Pasiaste zaklocenia i analogowe przeskoki obrazu.",category:"retro",tags:["vhs","static","retro","glitch"],defaultSettings:{...oe,opacity:48,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Xi,streamElementsRendererName:"aeRenderVhsStatic",renderPreview(e,t,a){const n=H(12,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-vhs-band",r.style.top=`${a()*96}%`,r.style.height=`${2+a()*18}px`,r.style.setProperty("--ae-vhs-duration",`${(.8+a()*3)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderVhsStatic(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(12 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const band = document.createElement("span");
    band.className = "ae-vhs-band";
    band.style.top = random() * 96 + "%";
    band.style.height = (2 + random() * 18) + "px";
    band.style.setProperty("--ae-vhs-duration", ((.8 + random() * 3) / speed) + "s");
    band.style.animationDelay = (-random() * 4) + "s";
    layer.appendChild(band);
  }
}
`.trim(),estimateDomNodes(e){return H(12,e,1)}},ro={definition:ce({id:"solar-flare",name:"Solar Flare",description:"Pomarańczowe luki i rozblyski przypominajace protuberancje sloneczne.",category:"solar",tags:["solar","flare","sun","energy"],defaultSettings:{...oe,opacity:70,density:50,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Zi,streamElementsRendererName:"aeRenderSolarFlare",renderPreview(e,t,a){const n=H(11,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-solar-flare";const o=55+a()*150;r.style.left=`${a()*92}%`,r.style.top=`${a()*88}%`,r.style.width=`${o}px`,r.style.height=`${o*(.45+a()*.45)}px`,r.style.setProperty("--ae-solar-duration",`${(6+a()*8)/s}s`),r.style.animationDelay=`${-a()*9}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSolarFlare(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(11 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const flare = document.createElement("span");
    flare.className = "ae-solar-flare";
    const size = 55 + random() * 150;
    flare.style.left = random() * 92 + "%";
    flare.style.top = random() * 88 + "%";
    flare.style.width = size + "px";
    flare.style.height = (size * (.45 + random() * .45)) + "px";
    flare.style.setProperty("--ae-solar-duration", ((6 + random() * 8) / speed) + "s");
    flare.style.animationDelay = (-random() * 9) + "s";
    layer.appendChild(flare);
  }
}
`.trim(),estimateDomNodes(e){return H(11,e,1)}},so=`
.ae-scanline-plus {
  position: absolute;
  left: -5%;
  width: 110%;
  height: var(--ae-scanline-h, 2px);
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(145, 220, 255, .15) 18%,
    rgba(150, 235, 255, .95) 50%,
    rgba(145, 220, 255, .15) 82%,
    transparent
  );
  box-shadow:
    0 0 8px rgba(120, 210, 255, .35),
    0 0 18px rgba(120, 210, 255, .18);
  animation: ae-scanline-plus var(--ae-scanline-duration, 4s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-scanline-plus {
  from { transform: translateY(-12vh); opacity: 0; }
  10% { opacity: .85; }
  90% { opacity: .85; }
  to { transform: translateY(118vh); opacity: 0; }
}
`.trim(),io=`
.ae-eq-bar {
  position: absolute;
  bottom: 0;
  width: var(--ae-eq-width, 2.5%);
  height: var(--ae-eq-height, 40%);
  border-radius: 8px 8px 2px 2px;
  background: linear-gradient(
    to top,
    rgba(120, 90, 255, .85),
    rgba(90, 235, 255, .92)
  );
  box-shadow:
    0 0 10px rgba(100, 200, 255, .25),
    inset 0 0 8px rgba(255, 255, 255, .15);
  transform-origin: bottom center;
  animation: ae-eq-bar var(--ae-eq-duration, 1.2s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-eq-bar {
  0%, 100% { transform: scaleY(.24); opacity: .45; }
  50% { transform: scaleY(1); opacity: 1; }
}
`.trim(),oo=`
.ae-hud-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(80, 190, 255, .14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(80, 190, 255, .14) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(85, 120, 255, .09), transparent 48%);
  background-size:
    var(--ae-grid-step, 44px) var(--ae-grid-step, 44px),
    var(--ae-grid-step, 44px) var(--ae-grid-step, 44px),
    100% 100%;
  background-position:
    0 0,
    0 0,
    50% 50%;
  animation: ae-hud-grid var(--ae-grid-duration, 12s) linear infinite;
  will-change: background-position, opacity;
}
@keyframes ae-hud-grid {
  to {
    background-position:
      var(--ae-grid-step, 44px) var(--ae-grid-step, 44px),
      var(--ae-grid-step, 44px) var(--ae-grid-step, 44px),
      50% 50%;
  }
}
`.trim(),co=`
.ae-floating-symbol {
  position: absolute;
  bottom: -12%;
  color: rgba(190, 160, 255, .95);
  text-shadow:
    0 0 8px rgba(180, 110, 255, .55),
    0 0 18px rgba(120, 210, 255, .24);
  animation: ae-floating-symbol var(--ae-symbol-duration, 10s) ease-in-out infinite;
  will-change: transform, opacity;
  user-select: none;
}
@keyframes ae-floating-symbol {
  0% {
    transform: translateY(18vh) rotate(-12deg) scale(.7);
    opacity: 0;
  }
  12% { opacity: .9; }
  100% {
    transform: translateY(-122vh) translateX(60px) rotate(14deg) scale(1.12);
    opacity: 0;
  }
}
`.trim(),lo=`
.ae-smoke-wisp {
  position: absolute;
  bottom: -14%;
  border-radius: 50%;
  background:
    radial-gradient(
      circle,
      rgba(175, 195, 255, .42) 0%,
      rgba(130, 150, 235, .18) 40%,
      rgba(120, 130, 200, 0) 72%
    );
  filter: blur(10px);
  animation: ae-smoke-wisp var(--ae-smoke-duration, 9s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-smoke-wisp {
  0% {
    transform: translateY(14vh) translateX(0) scale(.62);
    opacity: 0;
  }
  18% { opacity: .72; }
  100% {
    transform: translateY(-115vh) translateX(42px) scale(1.28);
    opacity: 0;
  }
}
`.trim(),po=`
.ae-electric-arc {
  position: absolute;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(140, 240, 255, .95) 15%,
    rgba(175, 120, 255, .95) 55%,
    rgba(140, 240, 255, .95) 85%,
    transparent
  );
  clip-path: polygon(0 50%, 10% 0, 22% 100%, 36% 20%, 48% 88%, 62% 10%, 76% 100%, 88% 22%, 100% 50%, 88% 70%, 76% 28%, 62% 92%, 48% 16%, 36% 80%, 22% 0, 10% 100%);
  box-shadow:
    0 0 10px rgba(110, 230, 255, .7),
    0 0 22px rgba(120, 140, 255, .4);
  animation: ae-electric-arc var(--ae-arc-duration, 1.5s) steps(2, end) infinite;
  will-change: transform, opacity;
}
@keyframes ae-electric-arc {
  0%, 70%, 100% {
    opacity: .06;
    transform: rotate(var(--ae-arc-angle, 0deg)) scaleX(.94);
  }
  74% {
    opacity: 1;
    transform: rotate(var(--ae-arc-angle, 0deg)) scaleX(1);
  }
  84% {
    opacity: .3;
    transform: rotate(var(--ae-arc-angle, 0deg)) scaleX(.98);
  }
  90% {
    opacity: .9;
    transform: rotate(var(--ae-arc-angle, 0deg)) scaleX(1.02);
  }
}
`.trim(),uo=`
.ae-snow-burst {
  position: absolute;
  top: -10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.95), rgba(190,220,255,.65) 60%, transparent 72%);
  box-shadow: 0 0 8px rgba(220, 235, 255, .38);
  animation: ae-snow-burst var(--ae-snow-duration, 8s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-snow-burst {
  0% { transform: translateY(-10vh) translateX(0) scale(.7); opacity: 0; }
  12% { opacity: .95; }
  100% { transform: translateY(118vh) translateX(36px) scale(1.08); opacity: 0; }
}
`.trim(),fo=`
.ae-meteor {
  position: absolute;
  width: var(--ae-meteor-size, 140px);
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(95,120,255,.08) 24%,
    rgba(125,215,255,.46) 64%,
    rgba(235,250,255,.92) 88%,
    #fff 100%
  );
  box-shadow:
    0 0 10px rgba(155,225,255,.42),
    0 0 24px rgba(110,150,255,.22);
  transform-origin: center;
  animation: ae-meteor var(--ae-meteor-duration, 3.2s) linear infinite;
  will-change: transform, opacity;
}
.ae-meteor::after {
  content: "";
  position: absolute;
  right: -2px;
  top: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: #fff;
  box-shadow:
    0 0 8px rgba(255,255,255,.95),
    0 0 18px rgba(120,220,255,.72);
}
@keyframes ae-meteor {
  0% {
    transform:
      translate3d(-28vw,-34vh,0)
      rotate(38deg);
    opacity: 0;
  }
  8% { opacity: 1; }
  88% { opacity: .95; }
  100% {
    transform:
      translate3d(118vw,108vh,0)
      rotate(38deg);
    opacity: 0;
  }
}
`.trim(),mo={definition:ce({id:"scanlines-plus",name:"Scanlines Plus",description:"Ruchome, swietlne linie przypominajace skanowanie obrazu.",category:"tech",tags:["scanlines","screen","tech","scanner"],defaultSettings:{...oe,opacity:58,density:52,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:so,streamElementsRendererName:"aeRenderScanlinesPlus",renderPreview(e,t,a){const n=H(12,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-scanline-plus",r.style.top=`${a()*100}%`,r.style.setProperty("--ae-scanline-h",`${1+a()*3}px`),r.style.setProperty("--ae-scanline-duration",`${(2.4+a()*3.8)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderScanlinesPlus(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(3, Math.round(12 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const line = document.createElement("span");
    line.className = "ae-scanline-plus";
    line.style.top = random() * 100 + "%";
    line.style.setProperty("--ae-scanline-h", (1 + random() * 3) + "px");
    line.style.setProperty("--ae-scanline-duration", ((2.4 + random() * 3.8) / speed) + "s");
    line.style.animationDelay = (-random() * 4) + "s";
    layer.appendChild(line);
  }
}
`.trim(),estimateDomNodes(e){return H(12,e,3)}},yo={definition:ce({id:"equalizer-bars",name:"Equalizer Bars",description:"Pulsujace slupki jak w wizualizerze audio.",category:"tech",tags:["audio","equalizer","bars","music"],defaultSettings:{...oe,opacity:76,density:62,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:io,streamElementsRendererName:"aeRenderEqualizerBars",renderPreview(e,t,a){const n=H(22,t,6),s=Math.max(.1,t.speed/100),i=100/n;for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-eq-bar",o.style.left=`${r*i+i*.18}%`,o.style.width=`${Math.max(1.2,i*.64)}%`,o.style.height=`${18+a()*70}%`,o.style.setProperty("--ae-eq-duration",`${(.5+a()*1.4)/s}s`),o.style.animationDelay=`${-a()*2}s`,e.appendChild(o)}},streamElementsRendererSource:`
function aeRenderEqualizerBars(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(6, Math.round(22 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  const slot = 100 / count;
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("span");
    bar.className = "ae-eq-bar";
    bar.style.left = (i * slot + slot * .18) + "%";
    bar.style.width = Math.max(1.2, slot * .64) + "%";
    bar.style.height = (18 + random() * 70) + "%";
    bar.style.setProperty("--ae-eq-duration", ((.5 + random() * 1.4) / speed) + "s");
    bar.style.animationDelay = (-random() * 2) + "s";
    layer.appendChild(bar);
  }
}
`.trim(),estimateDomNodes(e){return H(22,e,6)}},ho={definition:ce({id:"hud-grid",name:"HUD Grid",description:"Taktyczna siatka i delikatna warstwa interfejsu.",category:"tech",tags:["hud","grid","ui","tech"],defaultSettings:{...oe,opacity:48,density:60,speed:70,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:oo,streamElementsRendererName:"aeRenderHudGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-hud-grid";const n=26+(140-Math.max(20,t.density))/2.2,s=Math.max(.1,t.speed/100);a.style.setProperty("--ae-grid-step",`${n}px`),a.style.setProperty("--ae-grid-duration",`${12/s}s`),e.appendChild(a)},streamElementsRendererSource:`
function aeRenderHudGrid(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const s = effect.settings;
  const grid = document.createElement("span");
  grid.className = "ae-hud-grid";
  const step = 26 + ((140 - Math.max(20, s.density)) / 2.2);
  const speed = Math.max(.1, s.speed / 100);
  grid.style.setProperty("--ae-grid-step", step + "px");
  grid.style.setProperty("--ae-grid-duration", (12 / speed) + "s");
  layer.appendChild(grid);
}
`.trim(),estimateDomNodes(){return 1}},go={definition:ce({id:"floating-symbols",name:"Floating Symbols",description:"Magiczne symbole unoszace sie ku gorze.",category:"fantasy",tags:["symbols","magic","fantasy","arcane"],defaultSettings:{...oe,opacity:72,density:54,speed:78,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:co,streamElementsRendererName:"aeRenderFloatingSymbols",renderPreview(e,t,a){const n=["✦","✧","✶","✺","❖","☽","☼"],s=H(18,t,4),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-floating-symbol",o.textContent=n[Math.floor(a()*n.length)]??"✦",o.style.left=`${a()*100}%`,o.style.fontSize=`${18+a()*34}px`,o.style.setProperty("--ae-symbol-duration",`${(6+a()*8)/i}s`),o.style.animationDelay=`${-a()*8}s`,e.appendChild(o)}},streamElementsRendererSource:`
function aeRenderFloatingSymbols(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const glyphs = ["\\u2726", "\\u2727", "\\u2736", "\\u273A", "\\u2756", "\\u263D", "\\u263C"];
  const s = effect.settings;
  const count = Math.max(4, Math.round(18 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "ae-floating-symbol";
    el.textContent = glyphs[Math.floor(random() * glyphs.length)] || "\\u2726";
    el.style.left = random() * 100 + "%";
    el.style.fontSize = (18 + random() * 34) + "px";
    el.style.setProperty("--ae-symbol-duration", ((6 + random() * 8) / speed) + "s");
    el.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(el);
  }
}
`.trim(),estimateDomNodes(e){return H(18,e,4)}},bo={definition:ce({id:"smoke-wisps",name:"Smoke Wisps",description:"Miekkie smugi dymu unoszace sie na ekranie.",category:"cinematic",tags:["smoke","fog","mist","cinematic"],defaultSettings:{...oe,opacity:50,density:48,speed:68,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:lo,streamElementsRendererName:"aeRenderSmokeWisps",renderPreview(e,t,a){const n=H(14,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-smoke-wisp";const o=70+a()*120;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o*(.65+a()*.3)}px`,r.style.setProperty("--ae-smoke-duration",`${(6+a()*7)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSmokeWisps(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(3, Math.round(14 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const wisp = document.createElement("span");
    wisp.className = "ae-smoke-wisp";
    const size = 70 + random() * 120;
    wisp.style.left = random() * 100 + "%";
    wisp.style.width = size + "px";
    wisp.style.height = (size * (.65 + random() * .3)) + "px";
    wisp.style.setProperty("--ae-smoke-duration", ((6 + random() * 7) / speed) + "s");
    wisp.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(wisp);
  }
}
`.trim(),estimateDomNodes(e){return H(14,e,3)}},wo={definition:ce({id:"electric-arcs",name:"Electric Arcs",description:"Migajace luki energii i wyadowania elektryczne.",category:"energy",tags:["electric","arcs","energy","lightning"],defaultSettings:{...oe,opacity:82,density:55,speed:110,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:po,streamElementsRendererName:"aeRenderElectricArcs",renderPreview(e,t,a){const n=H(12,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-electric-arc",r.style.left=`${a()*86}%`,r.style.top=`${a()*86}%`,r.style.width=`${70+a()*180}px`,r.style.setProperty("--ae-arc-angle",`${(-40+a()*80).toFixed(2)}deg`),r.style.setProperty("--ae-arc-duration",`${(.8+a()*1.8)/s}s`),r.style.animationDelay=`${-a()*3}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderElectricArcs(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(3, Math.round(12 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const arc = document.createElement("span");
    arc.className = "ae-electric-arc";
    arc.style.left = random() * 86 + "%";
    arc.style.top = random() * 86 + "%";
    arc.style.width = (70 + random() * 180) + "px";
    arc.style.setProperty("--ae-arc-angle", ((-40 + random() * 80).toFixed(2)) + "deg");
    arc.style.setProperty("--ae-arc-duration", ((.8 + random() * 1.8) / speed) + "s");
    arc.style.animationDelay = (-random() * 3) + "s";
    layer.appendChild(arc);
  }
}
`.trim(),estimateDomNodes(e){return H(12,e,3)}},ko={definition:ce({id:"snow-burst",name:"Snow Burst",description:"Gestszy, bardziej dekoracyjny opad sniegu.",category:"weather",tags:["snow","winter","cold","flakes"],defaultSettings:{...oe,opacity:72,density:68,speed:72,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:uo,streamElementsRendererName:"aeRenderSnowBurst",renderPreview(e,t,a){const n=H(36,t,8),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-snow-burst";const o=4+a()*10;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-snow-duration",`${(4.8+a()*6.2)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderSnowBurst(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(8, Math.round(36 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("span");
    flake.className = "ae-snow-burst";
    const size = 4 + random() * 10;
    flake.style.left = random() * 100 + "%";
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.setProperty("--ae-snow-duration", ((4.8 + random() * 6.2) / speed) + "s");
    flake.style.animationDelay = (-random() * 8) + "s";
    layer.appendChild(flake);
  }
}
`.trim(),estimateDomNodes(e){return H(36,e,8)}},vo={definition:ce({id:"meteor-shower",name:"Meteor Shower",description:"Ukozne smugi meteorow przecinajace ekran.",category:"cosmic",tags:["meteor","space","streak","comet"],defaultSettings:{...oe,opacity:78,density:42,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:fo,streamElementsRendererName:"aeRenderMeteorShower",renderPreview(e,t,a){const n=H(14,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-meteor",r.style.left=`${-12+a()*78}%`,r.style.top=`${-18+a()*24}%`,r.style.setProperty("--ae-meteor-size",`${70+a()*180}px`),r.style.setProperty("--ae-meteor-duration",`${(1.8+a()*3)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
function aeRenderMeteorShower(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(3, Math.round(14 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const meteor = document.createElement("span");
    meteor.className = "ae-meteor";
    meteor.style.left = (-12 + random() * 78) + "%";
    meteor.style.top = (-18 + random() * 24) + "%";
    meteor.style.setProperty("--ae-meteor-size", (70 + random() * 180) + "px");
    meteor.style.setProperty("--ae-meteor-duration", ((1.8 + random() * 3) / speed) + "s");
    meteor.style.animationDelay = (-random() * 4) + "s";
    layer.appendChild(meteor);
  }
}
`.trim(),estimateDomNodes(e){return H(14,e,3)}},xo=[Os,qs,Fs,Bs,Ws,Us,Xs,Zs,Gs,ai,ni,ri,si,ii,oi,ci,li,xi,zi,Si,Mi,Ei,Ci,ji,_i,$i,Ri,Ii,Ai,Gi,Hi,Yi,Ji,Vi,Ki,Qi,eo,to,ao,no,ro,mo,yo,ho,go,bo,wo,ko,vo],zo={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},So={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Mo=[{id:"wireframe-cube",name:"Wireframe Cube",description:"Pseudo-3D wireframe cubes rotating through the scene.",category:"tech",tags:["cube","3d","wireframe","geometry","cyber"],kind:"box",count:9,cost:2,opacity:72,density:55,speed:80,intensity:75},{id:"polyhedron",name:"Polyhedron",description:"Luminous polygon forms with pseudo-depth.",category:"abstract",tags:["polyhedron","polygon","3d","geometry"],kind:"box",count:12,cost:2,opacity:72,density:58,speed:70,intensity:70},{id:"orbiting-core",name:"Orbiting Core",description:"Energy cores with orbit-like rings.",category:"energy",tags:["orbit","core","energy","atom"],kind:"ring",count:8,cost:2,opacity:82,density:48,speed:90,intensity:80},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspective neon frames flying toward the viewer.",category:"retro",tags:["tunnel","neon","synthwave","perspective"],kind:"box",count:18,cost:2,opacity:74,density:70,speed:110,intensity:85},{id:"fractal-rings",name:"Fractal Rings",description:"Nested luminous rings create recursive motion.",category:"abstract",tags:["rings","fractal","recursive","geometry"],kind:"ring",count:16,cost:2,opacity:70,density:66,speed:75,intensity:75},{id:"particle-vortex",name:"Particle Vortex",description:"Particles spiral around a dynamic center.",category:"energy",tags:["vortex","particles","spiral","energy"],kind:"dot",count:58,cost:3,opacity:78,density:62,speed:105,intensity:85},{id:"liquid-blobs",name:"Liquid Blobs",description:"Organic glowing blobs with fluid deformation.",category:"abstract",tags:["liquid","blob","organic","fluid"],kind:"blob",count:15,cost:3,opacity:62,density:52,speed:55,intensity:80},{id:"cell-division",name:"Cell Division",description:"Seeded cells pulse and visually split into colonies.",category:"other",tags:["cell","biology","division","evolution"],kind:"cell",count:32,cost:3,opacity:72,density:58,speed:75,intensity:85},{id:"growing-vines",name:"Growing Vines",description:"Procedural-looking luminous branches grow across the frame.",category:"botanical",tags:["vine","plant","growth","branch"],kind:"line",count:28,cost:3,opacity:72,density:55,speed:65,intensity:85},{id:"constellation-network",name:"Constellation Network",description:"Glowing nodes connected by constellation-like links.",category:"cosmic",tags:["constellation","network","stars","nodes"],kind:"dot",count:40,cost:3,opacity:64,density:58,speed:45,intensity:70},{id:"shockwave-bursts",name:"Shockwave Bursts",description:"Seeded shockwave circles expand through the scene.",category:"energy",tags:["shockwave","burst","pulse","impact"],kind:"ring",count:14,cost:2,opacity:76,density:48,speed:95,intensity:90},{id:"data-nodes",name:"Data Nodes",description:"Technical nodes pulse along short data links.",category:"sci-fi",tags:["data","nodes","hud","network"],kind:"line",count:34,cost:2,opacity:68,density:60,speed:80,intensity:72},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Seeded stars rotate in a wide spiral galaxy.",category:"cosmic",tags:["galaxy","spiral","stars","space"],kind:"dot",count:80,cost:3,opacity:78,density:66,speed:55,intensity:88},{id:"recursive-squares",name:"Recursive Squares",description:"Nested squares create an infinite-zoom illusion.",category:"abstract",tags:["recursive","squares","infinite","zoom"],kind:"box",count:22,cost:2,opacity:72,density:72,speed:75,intensity:88},{id:"dna-helix",name:"DNA Helix",description:"A pseudo-3D double helix made from luminous nodes.",category:"sci-fi",tags:["dna","helix","science","biology"],kind:"helix",count:42,cost:2,opacity:76,density:68,speed:70,intensity:78},{id:"floating-cubes",name:"Floating Cubes",description:"A field of luminous pseudo-3D cubes drifting in space.",category:"tech",tags:["cube","3d","floating","geometry"],kind:"box",count:24,cost:3,opacity:68,density:58,speed:60,intensity:74}],Eo=`
.ae-p06-node{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);animation-delay:var(--delay);animation-duration:var(--duration);animation-iteration-count:infinite;will-change:transform,opacity}
.ae-p06-box{border:1px solid rgba(105,221,255,.82);background:linear-gradient(135deg,rgba(105,221,255,.08),rgba(168,140,255,.14));box-shadow:inset 0 0 14px rgba(105,221,255,.18),0 0 18px rgba(105,221,255,.22);animation-name:ae-p06-box}
.ae-p06-ring{border:2px solid rgba(105,221,255,.78);border-radius:50%;box-shadow:0 0 18px rgba(105,221,255,.38),inset 0 0 12px rgba(168,140,255,.18);animation-name:ae-p06-ring}
.ae-p06-dot{width:calc(var(--size)*.12);height:calc(var(--size)*.12);border-radius:50%;background:#fff;box-shadow:0 0 8px #67ddff,0 0 16px #a88cff;animation-name:ae-p06-dot}
.ae-p06-blob{border-radius:44% 56% 62% 38%/45% 42% 58% 55%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.8),rgba(111,215,255,.34) 30%,rgba(166,120,255,.14) 65%,transparent 72%);animation-name:ae-p06-blob}
.ae-p06-line{width:calc(24px + var(--size));height:2px;background:linear-gradient(90deg,rgba(105,221,255,.95),transparent);box-shadow:0 0 8px rgba(105,221,255,.45);transform-origin:0 50%;animation-name:ae-p06-line}
.ae-p06-cell{width:calc(var(--size)*.48);height:calc(var(--size)*.48);border:1px solid rgba(133,255,207,.75);border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.7),rgba(88,224,171,.2) 35%,transparent 68%);box-shadow:0 0 12px rgba(88,224,171,.28);animation-name:ae-p06-cell}
.ae-p06-cell::after{content:"";position:absolute;width:100%;height:100%;left:68%;top:30%;border:inherit;border-radius:50%;animation:ae-p06-cell-child var(--duration) var(--delay) infinite}
.ae-p06-helix{left:50%;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 9px #6de2ff;animation-name:ae-p06-helix}
.ae-p06-helix::after{content:"";position:absolute;width:calc(40px + var(--power)*90px);height:1px;left:4px;top:4px;background:linear-gradient(90deg,#6de2ff,#a88cff);transform-origin:0 50%}
@keyframes ae-p06-box{0%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.18);opacity:0}20%{opacity:.9}100%{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg)) scale(calc(1.4 + var(--power)*2.8));opacity:0}}
@keyframes ae-p06-ring{0%{transform:translate(-50%,-50%) scale(.15);opacity:0}25%{opacity:.95}100%{transform:translate(-50%,-50%) rotate(360deg) scale(calc(2 + var(--power)*5));opacity:0}}
@keyframes ae-p06-dot{from{transform:translate(-50%,-50%) rotate(var(--angle)) translateX(calc(20px + var(--i)*2px*var(--power))) scale(.55);opacity:.2}50%{opacity:1}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 720deg)) translateX(calc(32px + var(--i)*3px*var(--power))) scale(1.1);opacity:.15}}
@keyframes ae-p06-blob{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.75);border-radius:44% 56% 62% 38%/45% 42% 58% 55%}50%{transform:translate(calc(-50% + 35px*var(--power)),calc(-50% - 22px)) rotate(calc(var(--angle) + 180deg)) scale(1.2);border-radius:70% 30% 42% 58%/30% 65% 35% 70%}}
@keyframes ae-p06-line{0%{transform:rotate(var(--angle)) scaleX(0);opacity:0}18%{opacity:1}80%{transform:rotate(calc(var(--angle) + 28deg*var(--power))) scaleX(1);opacity:1}100%{transform:rotate(calc(var(--angle) + 35deg*var(--power))) scaleX(1);opacity:0}}
@keyframes ae-p06-cell{0%,18%{transform:translate(-50%,-50%) scale(.4);opacity:.15}48%{transform:translate(-50%,-50%) scale(calc(.75 + var(--power)*.35));opacity:1}100%{transform:translate(-70%,-50%) scale(.5);opacity:.12}}
@keyframes ae-p06-cell-child{0%,48%{opacity:0;transform:scale(.35)}70%{opacity:.8;transform:scale(.75)}100%{opacity:0;transform:translateX(24px) scale(.45)}}
@keyframes ae-p06-helix{0%{transform:translateX(calc(-80px*var(--power))) scale(.65);opacity:.3}50%{transform:translateX(calc(80px*var(--power))) scale(1.1);opacity:1}100%{transform:translateX(calc(-80px*var(--power))) scale(.65);opacity:.3}}
`.trim();function zn(e,t){return Math.max(1,Math.round(e.count*t.density/100))}function Co(e){return"aeRenderPack06"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function Po(e,t,a,n,s){const i=Math.max(.1,a.speed/100);e.className=`ae-p06-node ae-p06-${s}`,e.style.setProperty("--i",String(t)),e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",s==="helix"?`${5+t%42*2.15}%`:`${n()*100}%`),e.style.setProperty("--size",`${12+n()*70}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--duration",`${(2.8+n()*7)/i}s`),e.style.setProperty("--power",String(a.intensity/100))}function jo(e,t){return`
function ${t}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(${e.count} * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p06-node ae-p06-${e.kind}";
    node.style.setProperty("--i", String(i));
    node.style.setProperty("--x", (random() * 100) + "%");
    node.style.setProperty("--y", ${JSON.stringify(e.kind)} === "helix" ? (5 + (i % 42) * 2.15) + "%" : (random() * 100) + "%");
    node.style.setProperty("--size", (12 + random() * 70) + "px");
    node.style.setProperty("--angle", (random() * 360) + "deg");
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--duration", ((2.8 + random() * 7) / speed) + "s");
    node.style.setProperty("--power", String(s.intensity / 100));
    layer.appendChild(node);
  }
}
`.trim()}function _o(e){const t=Co(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...zo,opacity:e.opacity,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:So,performanceCost:e.cost,requiresJavaScript:!0},css:Eo,streamElementsRendererName:t,renderPreview(a,n,s){const i=zn(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");Po(o,r,n,s,e.kind),a.appendChild(o)}},streamElementsRendererSource:jo(e,t),estimateDomNodes(a){return zn(e,a)}}}const $o=Mo.map(_o),Ro={opacity:76,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:65,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:85},Io={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Ao=[{id:"fireworks",name:"Fireworks",description:"Promieniste wybuchy fajerwerków do zwycięstw i celebracji.",category:"cinematic",tags:["fireworks","celebration","victory","sparks"],kind:"fireworks",count:10,cost:3},{id:"radar-sweep",name:"Radar Sweep",description:"Obracające się skanery radarowe z technicznym glow.",category:"tech",tags:["radar","scanner","hud","tactical"],kind:"radar",count:4,cost:2},{id:"warp-speed",name:"Warp Speed",description:"Gwiezdne smugi rozchodzące się od centrum jak skok w nadprzestrzeń.",category:"cosmic",tags:["warp","hyperspace","stars","speed"],kind:"warp",count:70,cost:3},{id:"hex-pulse",name:"Hex Pulse",description:"Pulsująca siatka heksagonalnych pól energii.",category:"sci-fi",tags:["hex","grid","pulse","shield"],kind:"hex",count:42,cost:2},{id:"circuit-traces",name:"Circuit Traces",description:"Świecące ścieżki obwodów z przesuwającymi się impulsami.",category:"tech",tags:["circuit","pcb","data","lines"],kind:"circuit",count:34,cost:2},{id:"light-leaks",name:"Light Leaks",description:"Miękkie filmowe rozbłyski i przecieki światła.",category:"cinematic",tags:["light","leak","lens","film","glow"],kind:"leaks",count:8,cost:2},{id:"gravity-well",name:"Gravity Well",description:"Cząstki zasysane po orbitach do jasnego centrum.",category:"cosmic",tags:["gravity","black hole","orbit","vortex"],kind:"gravity",count:56,cost:3},{id:"pixel-storm",name:"Pixel Storm",description:"Cyfrowa burza pikseli przecinająca scenę po skosie.",category:"retro",tags:["pixel","storm","digital","glitch"],kind:"pixels",count:62,cost:3}],No=`
.ae-x2 { position:absolute; left:var(--x); top:var(--y); animation-duration:var(--d); animation-delay:var(--delay); animation-iteration-count:infinite; will-change:transform,opacity; }

.ae-x2-fireworks {
  width:10px;height:10px;border-radius:50%;
  background:#fff;
  box-shadow:
    0 -56px 0 -3px #fff,
    40px -40px 0 -3px #70dcff,
    56px 0 0 -3px #b18cff,
    40px 40px 0 -3px #fff,
    0 56px 0 -3px #75e4ff,
    -40px 40px 0 -3px #b18cff,
    -56px 0 0 -3px #fff,
    -40px -40px 0 -3px #70dcff;
  animation-name:ae-x2-fireworks;
}
@keyframes ae-x2-fireworks {
  0%,15%{opacity:0;transform:translate(-50%,-50%) scale(.05)}
  24%{opacity:1}
  76%{opacity:.95;transform:translate(-50%,-50%) scale(calc(.8 + var(--p)*.85))}
  100%{opacity:0;transform:translate(-50%,-50%) scale(calc(1.3 + var(--p)*1.2))}
}

.ae-x2-radar {
  width:var(--s);height:var(--s);border-radius:50%;
  border:1px solid rgba(90,255,190,.45);
  background:
    conic-gradient(rgba(90,255,190,.42),rgba(90,255,190,.05) 18deg,transparent 58deg),
    radial-gradient(circle,transparent 0 30%,rgba(90,255,190,.12) 30.5% 31%,transparent 31.5% 60%,rgba(90,255,190,.12) 60.5% 61%,transparent 61.5%);
  box-shadow:0 0 24px rgba(90,255,190,.15),inset 0 0 35px rgba(90,255,190,.08);
  animation-name:ae-x2-radar;
}
@keyframes ae-x2-radar { to{transform:translate(-50%,-50%) rotate(360deg)} }

.ae-x2-warp {
  left:50%;top:50%;width:calc(26px + var(--s));height:2px;border-radius:999px;
  transform-origin:0 50%;
  background:linear-gradient(90deg,transparent,rgba(130,215,255,.42),#fff);
  box-shadow:0 0 8px rgba(110,205,255,.55);
  animation-name:ae-x2-warp;
}
@keyframes ae-x2-warp {
  from{opacity:0;transform:rotate(var(--a)) translateX(2vmin) scaleX(.05)}
  12%{opacity:.9}
  to{opacity:0;transform:rotate(var(--a)) translateX(80vmax) scaleX(calc(1.5 + var(--p)*1.5))}
}

.ae-x2-hex {
  width:var(--s);height:var(--s);
  clip-path:polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0 50%);
  background:linear-gradient(135deg,rgba(85,220,255,.34),rgba(150,105,255,.08));
  box-shadow:inset 0 0 0 1px rgba(105,225,255,.48),0 0 12px rgba(105,225,255,.16);
  animation-name:ae-x2-hex;
}
@keyframes ae-x2-hex {
  0%,100%{opacity:.12;transform:translate(-50%,-50%) scale(.82)}
  50%{opacity:.9;transform:translate(-50%,-50%) scale(calc(.96 + var(--p)*.16))}
}

.ae-x2-circuit {
  width:var(--s);height:2px;transform-origin:0 50%;
  background:linear-gradient(90deg,transparent 0 6%,rgba(80,225,255,.9) 6% 76%,transparent 76%);
  box-shadow:0 0 8px rgba(80,225,255,.3);
  animation-name:ae-x2-circuit;
}
.ae-x2-circuit::after {
  content:"";position:absolute;right:23%;top:-3px;width:7px;height:7px;border-radius:2px;background:#d2f9ff;box-shadow:0 0 10px #52e2ff;
}
@keyframes ae-x2-circuit {
  0%,100%{opacity:.1;filter:brightness(.7)}
  40%,65%{opacity:1;filter:brightness(calc(1 + var(--p)*.7))}
}

.ae-x2-leaks {
  width:calc(var(--s)*3.2);height:calc(var(--s)*1.7);border-radius:50%;
  background:radial-gradient(ellipse,rgba(255,205,135,.45),rgba(218,105,255,.18) 42%,transparent 72%);
  filter:blur(18px);mix-blend-mode:screen;
  animation-name:ae-x2-leaks;animation-direction:alternate;
}
@keyframes ae-x2-leaks {
  from{opacity:.12;transform:translate(-50%,-50%) rotate(var(--a)) scale(.7)}
  to{opacity:.8;transform:translate(calc(-50% + 9vw),calc(-50% - 5vh)) rotate(calc(var(--a) + 24deg)) scale(calc(1 + var(--p)*.45))}
}

.ae-x2-gravity {
  left:50%;top:50%;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px #8ddfff;
  animation-name:ae-x2-gravity;
}
@keyframes ae-x2-gravity {
  from{opacity:.22;transform:rotate(var(--a)) translateX(var(--r)) scale(.75)}
  60%{opacity:1}
  to{opacity:.04;transform:rotate(calc(var(--a) + 720deg)) translateX(20px) scale(.2)}
}

.ae-x2-pixels {
  width:var(--s);height:var(--s);background:linear-gradient(135deg,#61dbff,#9b78ff);
  box-shadow:0 0 8px rgba(95,215,255,.32);
  animation-name:ae-x2-pixels;
}
@keyframes ae-x2-pixels {
  from{opacity:0;transform:translate3d(-18vw,-12vh,0) rotate(0deg) scale(.55)}
  12%{opacity:.9}
  to{opacity:0;transform:translate3d(118vw,74vh,0) rotate(270deg) scale(calc(.7 + var(--p)*.8))}
}
`.trim();function ir(e,t){return Math.max(1,Math.round(e.count*t.density/100))}function or(e){return"aeRenderPolish02"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function cr(e){return`ae-x2 ae-x2-${e}`}function Lo(e,t,a,n){const s=ir(e,a),i=Math.max(.1,a.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");if(o.className=cr(e.kind),o.style.setProperty("--x",`${n()*100}%`),o.style.setProperty("--y",`${n()*100}%`),o.style.setProperty("--s",`${14+n()*82}px`),o.style.setProperty("--a",`${n()*360}deg`),o.style.setProperty("--p",String(a.intensity/100)),o.style.setProperty("--delay",`${-n()*8}s`),o.style.setProperty("--d",`${(2.5+n()*7)/i}s`),o.style.setProperty("--r",`${55+n()*350}px`),e.kind==="hex"){const c=r%8,l=Math.floor(r/8);o.style.setProperty("--x",`${8+c*12.2+l%2*6.1}%`),o.style.setProperty("--y",`${10+l*14.2}%`),o.style.setProperty("--s",`${32+a.intensity*.12}px`)}e.kind==="circuit"&&(o.style.setProperty("--s",`${60+n()*175}px`),o.style.setProperty("--a",`${Math.round(n()*3)*90}deg`)),e.kind==="leaks"&&o.style.setProperty("--s",`${90+n()*160}px`),e.kind==="pixels"&&(o.style.setProperty("--s",`${3+n()*12}px`),o.style.setProperty("--x",`${-12+n()*45}%`),o.style.setProperty("--y",`${-18+n()*78}%`)),e.kind==="radar"&&o.style.setProperty("--s",`${180+n()*320}px`),t.appendChild(o)}}function Do(e){return`
function ${or(e.id)}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const speed = Math.max(.1, s.speed / 100);
  const total = Math.max(1, Math.round(${e.count} * (s.density / 100)));

  for (let i = 0; i < total; i++) {
    const node = document.createElement("span");
    node.className = ${JSON.stringify(cr(e.kind))};
    node.style.setProperty("--x", (random() * 100) + "%");
    node.style.setProperty("--y", (random() * 100) + "%");
    node.style.setProperty("--s", (14 + random() * 82) + "px");
    node.style.setProperty("--a", (random() * 360) + "deg");
    node.style.setProperty("--p", String(s.intensity / 100));
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--d", ((2.5 + random() * 7) / speed) + "s");
    node.style.setProperty("--r", (55 + random() * 350) + "px");

    if (${JSON.stringify(e.kind)} === "hex") {
      const column = i % 8;
      const row = Math.floor(i / 8);
      node.style.setProperty("--x", (8 + column * 12.2 + (row % 2) * 6.1) + "%");
      node.style.setProperty("--y", (10 + row * 14.2) + "%");
      node.style.setProperty("--s", (32 + s.intensity * .12) + "px");
    }

    if (${JSON.stringify(e.kind)} === "circuit") {
      node.style.setProperty("--s", (60 + random() * 175) + "px");
      node.style.setProperty("--a", (Math.round(random() * 3) * 90) + "deg");
    }

    if (${JSON.stringify(e.kind)} === "leaks") {
      node.style.setProperty("--s", (90 + random() * 160) + "px");
    }

    if (${JSON.stringify(e.kind)} === "pixels") {
      node.style.setProperty("--s", (3 + random() * 12) + "px");
      node.style.setProperty("--x", (-12 + random() * 45) + "%");
      node.style.setProperty("--y", (-18 + random() * 78) + "%");
    }

    if (${JSON.stringify(e.kind)} === "radar") {
      node.style.setProperty("--s", (180 + random() * 320) + "px");
    }

    layer.appendChild(node);
  }
}
`.trim()}function To(e){return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Ro},capabilities:Io,performanceCost:e.cost,requiresJavaScript:!0},css:No,streamElementsRendererName:or(e.id),renderPreview(t,a,n){Lo(e,t,a,n)},streamElementsRendererSource:Do(e),estimateDomNodes(t){return ir(e,t)}}}const Oo=Ao.map(To),nt={opacity:84,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},qo={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Fo=[{id:"gears",name:"Gears",description:"Steampunkowe koła zębate z czytelniejszymi zębami i kontr-rotacją.",category:"steampunk",tags:["gear","cogs","steampunk","mechanical"],kind:"gear",count:10,cost:2,opacity:80,density:70,speed:90,intensity:90,brightness:118},{id:"comets",name:"Comets",description:"Jasne komety z długim ogonem lecące po przekątnej.",category:"cosmic",tags:["comet","tail","space","shooting star"],kind:"comet",count:22,cost:2,opacity:88,density:72,speed:110,intensity:105,brightness:132},{id:"fireworks",name:"Fireworks",description:"Pełniejsze wybuchy fajerwerków z wieloma promieniami.",category:"cinematic",tags:["fireworks","spark","celebration","burst"],kind:"firework",count:12,cost:3,opacity:88,density:66,speed:95,intensity:110,brightness:135},{id:"lightning-storm",name:"Lightning Storm",description:"Błyskawice z mocniejszym rozgałęzieniem i flashami.",category:"weather",tags:["lightning","storm","electric","thunder"],kind:"lightning",count:14,cost:3,opacity:88,density:62,speed:108,intensity:118,brightness:138},{id:"liquid-blobs",name:"Liquid Blobs",description:"Bardziej organiczne, płynne metaballe o miękkim ruchu.",category:"abstract",tags:["liquid","blob","metaball","organic"],kind:"blob",count:16,cost:3,opacity:76,density:70,speed:70,intensity:115,brightness:120},{id:"particle-vortex",name:"Particle Vortex",description:"Głębszy wir cząstek z mocniejszą spiralą i środkiem zasysania.",category:"energy",tags:["vortex","spiral","particles","swirl"],kind:"vortex",count:96,cost:3,opacity:82,density:80,speed:110,intensity:120,brightness:130},{id:"portal-rings",name:"Portal Rings",description:"Pulsujące portalowe pierścienie z falowaniem i poświatą.",category:"sci-fi",tags:["portal","rings","gateway","pulse"],kind:"portal",count:8,cost:2,opacity:82,density:72,speed:92,intensity:112,brightness:128},{id:"radar-sweep",name:"Radar Sweep",description:"Czytelny radar ze stożkiem skanu i pingami kontaktów.",category:"tech",tags:["radar","scan","hud","sweep"],kind:"radar",count:4,cost:2,opacity:82,density:60,speed:86,intensity:96,brightness:125},{id:"glitch-blocks",name:"Glitch Blocks",description:"Mocniej zróżnicowane bloki glitch z przesunięciami RGB.",category:"tech",tags:["glitch","blocks","digital","noise"],kind:"glitch",count:34,cost:2,opacity:72,density:78,speed:112,intensity:112,brightness:122},{id:"gravity-well",name:"Gravity Well",description:"Lejek grawitacyjny z orbitującym pyłem i jasnym rdzeniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:80,cost:3,opacity:82,density:76,speed:96,intensity:118,brightness:130},{id:"hex-grid",name:"Hex Grid",description:"Gęstsza siatka sześciokątów z pulsem i zanikaniem.",category:"sci-fi",tags:["hex","grid","honeycomb","hud"],kind:"hex",count:84,cost:2,opacity:68,density:76,speed:72,intensity:100,brightness:118},{id:"floating-cubes",name:"Floating Cubes",description:"Bardziej przestrzenne sześciany z lekką pseudo-głębią.",category:"tech",tags:["cube","floating","3d","geometry"],kind:"cube",count:32,cost:3,opacity:76,density:76,speed:68,intensity:98,brightness:118},{id:"prism-drift",name:"Prism Drift",description:"Lśniące pryzmaty dryfujące przez scenę.",category:"abstract",tags:["prism","crystal","glass","drift"],kind:"prism",count:26,cost:2,opacity:78,density:72,speed:70,intensity:102,brightness:126},{id:"neon-shards",name:"Neon Shards",description:"Neonowe odłamki z szybkim dryfem i smugą.",category:"retro",tags:["shards","neon","fragments","synthwave"],kind:"shards",count:42,cost:2,opacity:78,density:80,speed:118,intensity:110,brightness:132},{id:"plasma-storm",name:"Plasma Storm",description:"Burza plazmowych smug z turbulentnym ruchem.",category:"energy",tags:["plasma","storm","energy","embers"],kind:"storm",count:54,cost:3,opacity:80,density:82,speed:104,intensity:118,brightness:132},{id:"cube-swarm",name:"Cube Swarm",description:"Rój małych kostek przecinających scenę w warstwach.",category:"tech",tags:["cube","swarm","voxels","digital"],kind:"cube",count:64,cost:3,opacity:72,density:86,speed:98,intensity:108,brightness:115}],Bo=String.raw`
.ae-p07{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);animation-delay:var(--delay);animation-duration:var(--duration);animation-iteration-count:infinite;animation-timing-function:var(--easing,linear);will-change:transform,opacity,filter;pointer-events:none}
.ae-p07-gear{border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,226,170,.96) 0 8deg,rgba(88,68,38,.18) 8deg 15deg);box-shadow:0 0 18px rgba(255,196,116,.18),inset 0 0 0 6px rgba(18,20,26,.85),inset 0 0 0 15px rgba(255,228,170,.2);animation-name:ae-p07-gear}
.ae-p07-gear::before,.ae-p07-gear::after{content:"";position:absolute;inset:18%;border-radius:50%}.ae-p07-gear::before{box-shadow:inset 0 0 0 5px rgba(255,229,170,.22)}.ae-p07-gear::after{inset:34%;background:radial-gradient(circle,rgba(19,22,29,.92),rgba(10,12,17,.98));box-shadow:0 0 0 2px rgba(255,226,180,.08)}
.ae-p07-comet{width:calc(var(--size)*1.9);height:2px;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(124,215,255,.65) 35%,#fff 80%);box-shadow:0 0 12px rgba(121,218,255,.42),0 0 18px rgba(170,147,255,.24);transform-origin:100% 50%;animation-name:ae-p07-comet}
.ae-p07-firework{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 -68px 0 -5px #fff,48px -48px 0 -5px #7be8ff,68px 0 0 -5px #b48cff,48px 48px 0 -5px #ff8ec6,0 68px 0 -5px #ffe19e,-48px 48px 0 -5px #95ffbf,-68px 0 0 -5px #9fd0ff,-48px -48px 0 -5px #ffd59d;animation-name:ae-p07-firework}
.ae-p07-lightning{width:calc(10px + var(--size)*.18);height:calc(120px + var(--size)*1.4);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(144,222,255,.72));clip-path:polygon(48% 0,66% 18%,54% 18%,78% 44%,60% 44%,70% 65%,42% 65%,52% 100%,30% 72%,42% 72%,20% 42%,38% 42%,28% 18%,46% 18%);filter:drop-shadow(0 0 14px rgba(126,216,255,.72)) drop-shadow(0 0 32px rgba(171,153,255,.36));animation-name:ae-p07-lightning}
.ae-p07-blob{background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.72),rgba(108,222,255,.46) 30%,rgba(173,114,255,.24) 65%,transparent 74%);border-radius:46% 54% 64% 36%/38% 44% 56% 62%;filter:blur(1px);animation-name:ae-p07-blob}
.ae-p07-vortex{left:50%;top:50%;width:calc(3px + var(--size)*.06);height:calc(3px + var(--size)*.06);border-radius:50%;background:#fff;box-shadow:0 0 10px #72e3ff,0 0 18px rgba(168,140,255,.55);animation-name:ae-p07-vortex}
.ae-p07-portal{left:50%;top:50%;border-radius:50%;border:2px solid rgba(124,220,255,.82);background:radial-gradient(circle,rgba(124,220,255,.08),transparent 55%);box-shadow:0 0 16px rgba(124,220,255,.36),inset 0 0 18px rgba(174,134,255,.22);animation-name:ae-p07-portal}
.ae-p07-radar{border-radius:50%;border:1px solid rgba(119,255,205,.44);background:radial-gradient(circle,rgba(119,255,205,.12) 0 2%,transparent 2.4% 34%,rgba(119,255,205,.09) 34.5% 35.2%,transparent 36% 68%,rgba(119,255,205,.09) 68.5% 69.2%,transparent 70%),conic-gradient(from 0deg,rgba(119,255,205,.48),rgba(119,255,205,.06) 20deg,transparent 82deg);box-shadow:0 0 20px rgba(119,255,205,.18),inset 0 0 24px rgba(119,255,205,.1);animation-name:ae-p07-radar}
.ae-p07-radar::after{content:"";position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:50%;background:rgba(165,255,225,.95);transform:translate(-50%,-50%);box-shadow:0 0 14px rgba(165,255,225,.5)}
.ae-p07-glitch{width:calc(36px + var(--size)*1.4);height:calc(6px + var(--size)*.2);background:linear-gradient(90deg,rgba(88,238,255,.1),rgba(88,238,255,.55) 22%,rgba(255,92,170,.52) 62%,rgba(179,137,255,.46));box-shadow:-5px 0 0 rgba(255,92,170,.34),5px 0 0 rgba(89,229,255,.25);animation-name:ae-p07-glitch}
.ae-p07-gravity{left:50%;top:50%;width:calc(4px + var(--size)*.07);height:calc(4px + var(--size)*.07);border-radius:50%;background:#fff;box-shadow:0 0 12px #75e3ff,0 0 20px rgba(168,140,255,.42);animation-name:ae-p07-gravity}
.ae-p07-hex{width:var(--size);height:calc(var(--size)*.86);clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);background:linear-gradient(135deg,rgba(94,230,255,.26),rgba(168,140,255,.08));box-shadow:inset 0 0 0 1px rgba(120,220,255,.48),0 0 10px rgba(120,220,255,.1);animation-name:ae-p07-hex}
.ae-p07-cube{background:linear-gradient(135deg,rgba(135,238,255,.18),rgba(107,123,255,.08));box-shadow:inset 0 0 0 1px rgba(126,220,255,.55),0 0 12px rgba(126,220,255,.14);transform-style:preserve-3d;animation-name:ae-p07-cube}
.ae-p07-cube::before,.ae-p07-cube::after{content:"";position:absolute;inset:0;border:1px solid rgba(170,144,255,.42)}.ae-p07-cube::before{transform:translate(18%, -18%)}.ae-p07-cube::after{transform:translate(9%, -9%)}
.ae-p07-prism{width:calc(var(--size)*1.4);height:calc(var(--size)*1.1);clip-path:polygon(50% 0,100% 30%,86% 100%,14% 100%,0 30%);background:linear-gradient(145deg,rgba(255,255,255,.4),rgba(108,227,255,.18) 42%,rgba(177,132,255,.26) 80%);box-shadow:inset 0 0 0 1px rgba(168,229,255,.48),0 0 12px rgba(135,215,255,.18);animation-name:ae-p07-prism}
.ae-p07-shards{width:calc(18px + var(--size)*.8);height:2px;transform-origin:0 50%;background:linear-gradient(90deg,#79dfff,rgba(255,255,255,.95),rgba(169,139,255,.12));box-shadow:0 0 10px rgba(121,223,255,.32);animation-name:ae-p07-shards}
.ae-p07-storm{width:calc(14px + var(--size)*.7);height:calc(14px + var(--size)*.7);border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.72),rgba(110,224,255,.26) 40%,rgba(180,110,255,.08) 70%,transparent 80%);filter:blur(.5px);animation-name:ae-p07-storm}
@keyframes ae-p07-gear{0%{transform:translate(-50%,-50%) rotate(0deg) scale(.92);opacity:.35}20%{opacity:.9}100%{transform:translate(-50%,-50%) rotate(var(--spin)) scale(calc(.96 + var(--power)*.24));opacity:.7}}
@keyframes ae-p07-comet{0%{transform:translate(0,0) rotate(var(--angle)) scaleX(.3);opacity:0}12%{opacity:.9}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle)) scaleX(calc(1 + var(--power)*.55));opacity:0}}
@keyframes ae-p07-firework{0%,12%{transform:translate(-50%,-50%) scale(.05);opacity:0}22%{opacity:1}78%{transform:translate(-50%,-50%) scale(calc(.8 + var(--power)*.82));opacity:.98}100%{transform:translate(-50%,-50%) scale(calc(1.2 + var(--power)*1.15));opacity:0}}
@keyframes ae-p07-lightning{0%,100%{transform:translate(-50%,-50%) scaleY(.35) rotate(-5deg);opacity:0}10%{opacity:1}16%{opacity:.18}20%{opacity:1}72%{opacity:.88}100%{transform:translate(-50%,-50%) scaleY(calc(.8 + var(--power)*.5)) rotate(5deg);opacity:0}}
@keyframes ae-p07-blob{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.82)}50%{transform:translate(calc(-50% + 24px*var(--power)),calc(-50% - 18px)) rotate(calc(var(--angle) + 180deg)) scale(calc(1.06 + var(--power)*.28))}}
@keyframes ae-p07-vortex{0%{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.45);opacity:.2}50%{opacity:1}100%{transform:rotate(calc(var(--angle) + 720deg*var(--power))) translateX(calc(12px + var(--orbit)*.22)) scale(1.1);opacity:.08}}
@keyframes ae-p07-portal{0%{transform:translate(-50%,-50%) scale(.25);opacity:0}18%{opacity:.86}100%{transform:translate(-50%,-50%) scale(calc(1.35 + var(--power)*1.15));opacity:0}}
@keyframes ae-p07-radar{from{transform:translate(-50%,-50%) rotate(0deg);opacity:.95}to{transform:translate(-50%,-50%) rotate(360deg);opacity:.95}}
@keyframes ae-p07-glitch{0%,100%{transform:translate(0,0) skewX(0deg);opacity:.12}20%{transform:translate(-12px,0) skewX(22deg);opacity:.92}40%{transform:translate(10px,0) skewX(-12deg);opacity:.32}55%{transform:translate(-18px,0) skewX(8deg);opacity:.86}76%{transform:translate(14px,0) skewX(-18deg);opacity:.24}}
@keyframes ae-p07-gravity{0%{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.52);opacity:.22}60%{opacity:1}100%{transform:rotate(calc(var(--angle) + 640deg)) translateX(calc(10px + var(--orbit)*.18)) scale(.1);opacity:0}}
@keyframes ae-p07-hex{0%,100%{transform:translate(-50%,-50%) scale(.8);opacity:.1}50%{transform:translate(-50%,-50%) scale(calc(.9 + var(--power)*.12));opacity:.9}}
@keyframes ae-p07-cube{0%{transform:translate(-50%,-50%) rotateX(0deg) rotateY(0deg) rotateZ(var(--angle)) scale(.72);opacity:.18}50%{opacity:.86}100%{transform:translate(-50%,-50%) rotateX(180deg) rotateY(240deg) rotateZ(calc(var(--angle) + 120deg)) scale(calc(.96 + var(--power)*.2));opacity:.24}}
@keyframes ae-p07-prism{0%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.58);opacity:.15}50%{opacity:.95}100%{transform:translate(calc(-50% + 18px),calc(-50% - 22px)) rotate(calc(var(--angle) + 180deg)) scale(calc(.9 + var(--power)*.2));opacity:.15}}
@keyframes ae-p07-shards{0%{transform:rotate(var(--angle)) translateX(0) scaleX(.2);opacity:0}16%{opacity:1}100%{transform:rotate(var(--angle)) translateX(calc(90px + var(--power)*120px)) scaleX(1);opacity:0}}
@keyframes ae-p07-storm{0%{transform:translate(-50%,-50%) scale(.22);opacity:0}20%{opacity:.85}60%{transform:translate(calc(-50% + 24px),calc(-50% - 12px)) scale(calc(.8 + var(--power)*.32));opacity:1}100%{transform:translate(calc(-50% - 16px),calc(-50% + 20px)) scale(.25);opacity:0}}
`.trim();function Za(e){return Math.max(0,Math.min(400,e))}function Sn(e,t){return Math.max(1,Math.round(e.count*Za(t.density)/100))}function Wo(e){return"aeRenderPack07"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function Uo(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.2,Za(a.intensity)/100);e.classList.add("ae-p07",`ae-p07-${s.kind}`),e.style.setProperty("--i",String(t)),e.style.setProperty("--power",String(r)),e.style.setProperty("--duration",`${(2.5+n()*6.5)/i}s`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--size",`${16+n()*92}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--easing",s.kind==="glitch"?"steps(2,end)":"linear")}function Xo(e,t,a,n,s){Uo(e,t,a,n,s);const i=Math.max(.2,Za(a.intensity)/100),r=`${30+n()*180*i}px`;switch(s.kind){case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*80}%`),e.style.setProperty("--size",`${48+n()*96}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(180+n()*360)}deg`);break;case"comet":e.style.setProperty("--x",`${-8+n()*88}%`),e.style.setProperty("--y",`${-8+n()*42}%`),e.style.setProperty("--angle",`${18+n()*28}deg`),e.style.setProperty("--tx",`${80+n()*45}vw`),e.style.setProperty("--ty",`${50+n()*35}vh`);break;case"firework":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${10+n()*74}%`);break;case"lightning":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*20}%`),e.style.setProperty("--duration",`${(1.1+n()*2.8)/Math.max(.3,a.speed/100)}s`);break;case"blob":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${64+n()*130}px`);break;case"vortex":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"portal":e.style.setProperty("--x",`${35+n()*30}%`),e.style.setProperty("--y",`${30+n()*40}%`),e.style.setProperty("--size",`${60+n()*120}px`);break;case"radar":e.style.setProperty("--x",`${18+n()*64}%`),e.style.setProperty("--y",`${18+n()*64}%`),e.style.setProperty("--size",`${120+n()*140}px`);break;case"glitch":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"gravity":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"hex":e.style.setProperty("--x",`${4+t%12*8.2}%`),e.style.setProperty("--y",`${8+Math.floor(t/12)*10.2}%`),e.style.setProperty("--size",`${22+n()*28}px`);break;case"cube":e.style.setProperty("--x",`${4+n()*90}%`),e.style.setProperty("--y",`${6+n()*86}%`),e.style.setProperty("--size",`${18+n()*58}px`);break;case"prism":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${30+n()*52}px`);break;case"shards":e.style.setProperty("--x",`${n()*72}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"storm":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`);break}}function Zo(e,t){return`
function ${t}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const density = Math.max(0, Math.min(400, s.density));
  const intensity = Math.max(0, Math.min(400, s.intensity));
  const count = Math.max(1, Math.round(${e.count} * density / 100));
  const speed = Math.max(.1, s.speed / 100);
  const power = Math.max(.2, intensity / 100);
  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p07 ae-p07-${e.kind}";
    node.style.setProperty("--i", String(i));
    node.style.setProperty("--power", String(power));
    node.style.setProperty("--duration", ((2.5 + random() * 6.5) / speed) + "s");
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--size", (16 + random() * 92) + "px");
    node.style.setProperty("--angle", (random() * 360) + "deg");
    node.style.setProperty("--easing", ${JSON.stringify(e.kind)} === "glitch" ? "steps(2,end)" : "linear");
    const orbit = (30 + random() * 180 * power) + "px";
    switch (${JSON.stringify(e.kind)}) {
      case "gear":
        node.style.setProperty("--x", (8 + random() * 84) + "%");
        node.style.setProperty("--y", (10 + random() * 80) + "%");
        node.style.setProperty("--size", (48 + random() * 96) + "px");
        node.style.setProperty("--spin", (((random() > .5 ? 1 : -1) * (180 + random() * 360))) + "deg");
        break;
      case "comet":
        node.style.setProperty("--x", (-8 + random() * 88) + "%");
        node.style.setProperty("--y", (-8 + random() * 42) + "%");
        node.style.setProperty("--angle", (18 + random() * 28) + "deg");
        node.style.setProperty("--tx", (80 + random() * 45) + "vw");
        node.style.setProperty("--ty", (50 + random() * 35) + "vh");
        break;
      case "firework":
        node.style.setProperty("--x", (10 + random() * 80) + "%");
        node.style.setProperty("--y", (10 + random() * 74) + "%");
        break;
      case "lightning":
        node.style.setProperty("--x", (8 + random() * 84) + "%");
        node.style.setProperty("--y", (10 + random() * 20) + "%");
        node.style.setProperty("--duration", ((1.1 + random() * 2.8) / Math.max(.3, s.speed / 100)) + "s");
        break;
      case "blob":
        node.style.setProperty("--x", (8 + random() * 84) + "%");
        node.style.setProperty("--y", (8 + random() * 84) + "%");
        node.style.setProperty("--size", (64 + random() * 130) + "px");
        break;
      case "vortex":
        node.style.setProperty("--x", "50%");
        node.style.setProperty("--y", "50%");
        node.style.setProperty("--orbit", orbit);
        break;
      case "portal":
        node.style.setProperty("--x", (35 + random() * 30) + "%");
        node.style.setProperty("--y", (30 + random() * 40) + "%");
        node.style.setProperty("--size", (60 + random() * 120) + "px");
        break;
      case "radar":
        node.style.setProperty("--x", (18 + random() * 64) + "%");
        node.style.setProperty("--y", (18 + random() * 64) + "%");
        node.style.setProperty("--size", (120 + random() * 140) + "px");
        break;
      case "glitch":
        node.style.setProperty("--x", (random() * 80) + "%");
        node.style.setProperty("--y", (random() * 92) + "%");
        break;
      case "gravity":
        node.style.setProperty("--x", "50%");
        node.style.setProperty("--y", "50%");
        node.style.setProperty("--orbit", orbit);
        break;
      case "hex":
        node.style.setProperty("--x", (4 + (i % 12) * 8.2) + "%");
        node.style.setProperty("--y", (8 + Math.floor(i / 12) * 10.2) + "%");
        node.style.setProperty("--size", (22 + random() * 28) + "px");
        break;
      case "cube":
        node.style.setProperty("--x", (4 + random() * 90) + "%");
        node.style.setProperty("--y", (6 + random() * 86) + "%");
        node.style.setProperty("--size", (18 + random() * 58) + "px");
        break;
      case "prism":
        node.style.setProperty("--x", (8 + random() * 84) + "%");
        node.style.setProperty("--y", (8 + random() * 84) + "%");
        node.style.setProperty("--size", (30 + random() * 52) + "px");
        break;
      case "shards":
        node.style.setProperty("--x", (random() * 72) + "%");
        node.style.setProperty("--y", (random() * 92) + "%");
        break;
      case "storm":
        node.style.setProperty("--x", (8 + random() * 84) + "%");
        node.style.setProperty("--y", (8 + random() * 84) + "%");
        break;
    }
    layer.appendChild(node);
  }
}
`.trim()}function Go(e){const t=Wo(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...nt,opacity:e.opacity??nt.opacity,density:e.density??nt.density,speed:e.speed??nt.speed,intensity:e.intensity??nt.intensity,brightness:e.brightness??nt.brightness},capabilities:qo,performanceCost:e.cost,requiresJavaScript:!0},css:Bo,streamElementsRendererName:t,renderPreview(a,n,s){const i=Sn(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");Xo(o,r,n,s,e),a.appendChild(o)}},streamElementsRendererSource:Zo(e,t),estimateDomNodes(a){return Sn(e,a)}}}const Ho=Fo.map(Go),Yo={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},Jo={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Vo=[{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Dysk akrecyjny z cząstkami spiralnie wpadającymi do jasnego rdzenia.",category:"cosmic",tags:["black hole","accretion","gravity","singularity","orbit"],kind:"black-hole",count:92,cost:3,density:78,speed:92,intensity:115},{id:"orbital-debris",name:"Orbital Debris",description:"Odłamki krążące po kilku płaszczyznach orbit i głębokościach.",category:"cosmic",tags:["orbit","debris","space","asteroid","satellite"],kind:"debris",count:46,cost:3,density:74,speed:82,intensity:105},{id:"star-tunnel",name:"Star Tunnel",description:"Tunel gwiezdnych smug z mocną perspektywą i ruchem ku kamerze.",category:"cosmic",tags:["stars","tunnel","hyperspace","perspective","warp"],kind:"tunnel",count:86,cost:3,density:76,speed:118,intensity:118},{id:"energy-lattice",name:"Energy Lattice",description:"Pulsująca sieć energetycznych połączeń i węzłów.",category:"sci-fi",tags:["lattice","network","energy","nodes","grid"],kind:"lattice",count:40,cost:3,density:70,speed:78,intensity:102},{id:"target-lock",name:"Target Lock",description:"HUD-owy celownik z pierścieniami, markerami i pulsami namierzania.",category:"tech",tags:["target","lock","hud","reticle","scanner"],kind:"target",count:6,cost:2,density:55,speed:82,intensity:100},{id:"scanner-beams",name:"Scanner Beams",description:"Wielokierunkowe wiązki skanujące scenę z miękką poświatą.",category:"tech",tags:["scanner","beam","laser","scan","hud"],kind:"scanner",count:12,cost:2,density:62,speed:92,intensity:108},{id:"digital-fragments",name:"Digital Fragments",description:"Cyfrowe fragmenty rozpadające się i przeskakujące warstwami.",category:"retro",tags:["digital","fragments","glitch","blocks","data"],kind:"fragments",count:54,cost:3,density:76,speed:110,intensity:108},{id:"pixel-melt",name:"Pixel Melt",description:"Pionowe smugi pikseli spływające jak topiący się cyfrowy obraz.",category:"retro",tags:["pixel","melt","glitch","drip","digital"],kind:"melt",count:62,cost:3,density:78,speed:88,intensity:112},{id:"wireframe-cubes",name:"Wireframe Cubes",description:"Pole czystych drucianych kostek pseudo-3D obracających się w przestrzeni.",category:"tech",tags:["wireframe","cubes","3d","geometry","grid"],kind:"wirecube",count:30,cost:3,density:70,speed:72,intensity:98},{id:"floating-polyhedra",name:"Floating Polyhedra",description:"Dryfujące wielościany o różnych rozmiarach i osi obrotu.",category:"abstract",tags:["polyhedra","geometry","3d","floating","facets"],kind:"poly",count:28,cost:3,density:68,speed:68,intensity:100},{id:"shockwave-rings",name:"Shockwave Rings",description:"Szybkie, warstwowe fale uderzeniowe rozchodzące się z różnych punktów.",category:"energy",tags:["shockwave","rings","impact","pulse","wave"],kind:"shockwave",count:16,cost:2,density:64,speed:112,intensity:115},{id:"electric-web",name:"Electric Web",description:"Sieć krótkich łuków elektrycznych przeskakujących po scenie.",category:"energy",tags:["electric","web","arcs","lightning","network"],kind:"electric",count:34,cost:3,density:72,speed:118,intensity:120},{id:"ribbon-streamers",name:"Ribbon Streamers",description:"Długie kolorowe wstążki płynące falami zamiast drobnych cząstek.",category:"cinematic",tags:["ribbon","streamers","flow","celebration","wave"],kind:"ribbon",count:18,cost:2,density:62,speed:82,intensity:105},{id:"ink-clouds",name:"Ink Clouds",description:"Powolne organiczne chmury przypominające atrament rozlewający się w wodzie.",category:"abstract",tags:["ink","clouds","fluid","organic","smoke"],kind:"ink",count:13,cost:3,density:58,speed:48,intensity:105}],Ko=String.raw`
.ae-p08 {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--size);
  height: var(--size);
  animation-duration: var(--duration);
  animation-delay: var(--delay);
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  pointer-events: none;
  will-change: transform, opacity, filter;
}

.ae-p08-black-hole {
  left: 50%;
  top: 50%;
  width: calc(3px + var(--size) * .06);
  height: calc(3px + var(--size) * .06);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 10px #8ce6ff, 0 0 24px rgba(155,110,255,.55);
  animation-name: ae-p08-black-hole;
}
.ae-p08-black-hole::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(40px + var(--power) * 46px);
  height: calc(8px + var(--power) * 4px);
  border-radius: 50%;
  transform: translate(-50%,-50%);
  border: 1px solid rgba(128,220,255,.34);
  box-shadow: 0 0 16px rgba(157,115,255,.22);
}

.ae-p08-debris {
  left: 50%;
  top: 50%;
  width: calc(5px + var(--size) * .08);
  height: calc(4px + var(--size) * .05);
  background: linear-gradient(135deg,#d9e5ff,#596881);
  clip-path: polygon(12% 18%,85% 0,100% 72%,35% 100%,0 62%);
  box-shadow: 0 0 8px rgba(120,190,255,.24);
  animation-name: ae-p08-debris;
}

.ae-p08-tunnel {
  left: 50%;
  top: 50%;
  width: calc(20px + var(--size) * 1.1);
  height: 2px;
  transform-origin: 0 50%;
  border-radius: 999px;
  background: linear-gradient(90deg,transparent,rgba(120,210,255,.32),#fff);
  box-shadow: 0 0 8px rgba(110,210,255,.45);
  animation-name: ae-p08-tunnel;
}

.ae-p08-lattice {
  width: calc(34px + var(--size) * 1.2);
  height: 1px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg,rgba(95,235,255,.2),rgba(95,235,255,.88),rgba(178,127,255,.18));
  box-shadow: 0 0 8px rgba(95,235,255,.28);
  animation-name: ae-p08-lattice;
}
.ae-p08-lattice::after {
  content: "";
  position: absolute;
  right: 8%;
  top: -4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d8fbff;
  box-shadow: 0 0 11px #66e8ff;
}

.ae-p08-target {
  width: calc(100px + var(--size) * 1.4);
  height: calc(100px + var(--size) * 1.4);
  border-radius: 50%;
  border: 1px solid rgba(91,238,255,.52);
  background:
    linear-gradient(90deg,transparent 49.6%,rgba(91,238,255,.24) 50%,transparent 50.4%),
    linear-gradient(0deg,transparent 49.6%,rgba(91,238,255,.24) 50%,transparent 50.4%),
    radial-gradient(circle,transparent 0 28%,rgba(91,238,255,.13) 28.5% 29.3%,transparent 30% 62%,rgba(91,238,255,.14) 62.5% 63.3%,transparent 64%);
  box-shadow: 0 0 20px rgba(91,238,255,.14);
  animation-name: ae-p08-target;
}

.ae-p08-scanner {
  width: calc(90px + var(--size) * 2);
  height: calc(20px + var(--size) * .3);
  transform-origin: 0 50%;
  background: linear-gradient(90deg,rgba(98,233,255,0),rgba(98,233,255,.36),rgba(255,255,255,.5),rgba(98,233,255,0));
  clip-path: polygon(0 46%,100% 0,100% 100%,0 54%);
  filter: blur(.35px);
  animation-name: ae-p08-scanner;
}

.ae-p08-fragments {
  width: calc(12px + var(--size) * .65);
  height: calc(5px + var(--size) * .22);
  background: linear-gradient(90deg,#65e7ff,#a578ff 58%,#ff6bb0);
  box-shadow: -4px 0 0 rgba(255,88,170,.25),4px 0 0 rgba(78,225,255,.25);
  animation-name: ae-p08-fragments;
}

.ae-p08-melt {
  width: calc(4px + var(--size) * .13);
  height: calc(32px + var(--size) * 1.6);
  border-radius: 0 0 999px 999px;
  background: linear-gradient(180deg,rgba(103,227,255,.86),rgba(168,116,255,.54) 54%,rgba(255,97,177,.08));
  box-shadow: 0 0 8px rgba(101,221,255,.25);
  animation-name: ae-p08-melt;
}

.ae-p08-wirecube {
  background: transparent;
  border: 1px solid rgba(117,231,255,.72);
  box-shadow: inset 0 0 12px rgba(117,231,255,.08),0 0 12px rgba(117,231,255,.12);
  transform-style: preserve-3d;
  animation-name: ae-p08-wirecube;
}
.ae-p08-wirecube::before,
.ae-p08-wirecube::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(178,142,255,.48);
}
.ae-p08-wirecube::before { transform: translate(20%,-20%); }
.ae-p08-wirecube::after { transform: translate(10%,-10%); }

.ae-p08-poly {
  width: calc(var(--size) * 1.15);
  height: calc(var(--size) * 1.15);
  clip-path: polygon(50% 0,94% 25%,84% 83%,50% 100%,12% 77%,3% 25%);
  background: linear-gradient(145deg,rgba(255,255,255,.32),rgba(99,225,255,.14) 40%,rgba(170,116,255,.22));
  box-shadow: inset 0 0 0 1px rgba(174,227,255,.4),0 0 13px rgba(105,211,255,.14);
  animation-name: ae-p08-poly;
}

.ae-p08-shockwave {
  border-radius: 50%;
  border: 2px solid rgba(118,224,255,.82);
  box-shadow: 0 0 18px rgba(118,224,255,.34),inset 0 0 12px rgba(164,121,255,.16);
  animation-name: ae-p08-shockwave;
}

.ae-p08-electric {
  width: calc(30px + var(--size) * 1.8);
  height: 3px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg,#fff,#7be7ff 45%,rgba(157,119,255,.1));
  clip-path: polygon(0 40%,18% 0,28% 68%,42% 15%,53% 78%,68% 20%,80% 70%,100% 40%,82% 100%,67% 55%,54% 100%,42% 52%,28% 100%,18% 45%);
  filter: drop-shadow(0 0 6px rgba(111,226,255,.7));
  animation-name: ae-p08-electric;
}

.ae-p08-ribbon {
  width: calc(100px + var(--size) * 2.2);
  height: calc(8px + var(--size) * .14);
  border-radius: 50%;
  transform-origin: 0 50%;
  background: linear-gradient(90deg,rgba(95,225,255,0),rgba(95,225,255,.74),rgba(169,116,255,.68),rgba(255,96,175,.16));
  animation-name: ae-p08-ribbon;
}

.ae-p08-ink {
  width: calc(80px + var(--size) * 2.4);
  height: calc(70px + var(--size) * 2.1);
  border-radius: 58% 42% 65% 35% / 40% 62% 38% 60%;
  background: radial-gradient(circle at 36% 30%,rgba(109,222,255,.28),rgba(143,98,255,.22) 40%,rgba(20,12,40,.16) 68%,transparent 76%);
  filter: blur(calc(5px + var(--power) * 2px));
  animation-name: ae-p08-ink;
}

@keyframes ae-p08-black-hole {
  from { transform: rotate(var(--angle)) translateX(var(--orbit)) scale(.72); opacity:.18; }
  55% { opacity:1; }
  to { transform: rotate(calc(var(--angle) + 850deg)) translateX(calc(8px + var(--orbit) * .13)) scale(.08); opacity:0; }
}
@keyframes ae-p08-debris {
  from { transform: rotate(var(--angle)) translateX(var(--orbit)) rotate(0deg) scale(.65); opacity:.28; }
  50% { opacity:1; }
  to { transform: rotate(calc(var(--angle) + 360deg)) translateX(var(--orbit)) rotate(540deg) scale(1); opacity:.28; }
}
@keyframes ae-p08-tunnel {
  from { transform: rotate(var(--angle)) translateX(4vmin) scaleX(.04); opacity:0; }
  12% { opacity:.92; }
  to { transform: rotate(var(--angle)) translateX(76vmax) scaleX(calc(1.4 + var(--power) * 1.8)); opacity:0; }
}
@keyframes ae-p08-lattice {
  0%,100% { opacity:.12; transform: rotate(var(--angle)) scaleX(.55); }
  48% { opacity:1; transform: rotate(calc(var(--angle) + 8deg)) scaleX(calc(.9 + var(--power) * .22)); }
}
@keyframes ae-p08-target {
  from { transform: translate(-50%,-50%) rotate(0deg) scale(.86); opacity:.45; }
  50% { opacity:1; }
  to { transform: translate(-50%,-50%) rotate(360deg) scale(calc(.92 + var(--power) * .08)); opacity:.55; }
}
@keyframes ae-p08-scanner {
  from { transform: rotate(var(--angle)) translateX(-12vw) scaleX(.6); opacity:0; }
  14% { opacity:.86; }
  to { transform: rotate(var(--angle)) translateX(112vw) scaleX(1.15); opacity:0; }
}
@keyframes ae-p08-fragments {
  0%,100% { transform: translate3d(0,0,0) skewX(0deg); opacity:.1; }
  18% { transform: translate3d(-12px,5px,0) skewX(18deg); opacity:.92; }
  36% { transform: translate3d(18px,-8px,0) skewX(-12deg); opacity:.35; }
  60% { transform: translate3d(-22px,2px,0) skewX(8deg); opacity:.86; }
}
@keyframes ae-p08-melt {
  from { transform: translateY(-24vh) scaleY(.25); opacity:0; }
  14% { opacity:.9; }
  to { transform: translateY(124vh) scaleY(calc(.8 + var(--power) * .55)); opacity:0; }
}
@keyframes ae-p08-wirecube {
  from { transform: translate(-50%,-50%) rotateX(0deg) rotateY(0deg) rotateZ(var(--angle)) scale(.68); opacity:.2; }
  50% { opacity:.9; }
  to { transform: translate(-50%,-50%) rotateX(180deg) rotateY(260deg) rotateZ(calc(var(--angle) + 160deg)) scale(calc(.88 + var(--power) * .15)); opacity:.22; }
}
@keyframes ae-p08-poly {
  from { transform: translate(-50%,-50%) rotate(var(--angle)) scale(.58); opacity:.18; }
  50% { opacity:.92; }
  to { transform: translate(calc(-50% + 28px),calc(-50% - 20px)) rotate(calc(var(--angle) + 260deg)) scale(calc(.9 + var(--power) * .18)); opacity:.18; }
}
@keyframes ae-p08-shockwave {
  from { transform: translate(-50%,-50%) scale(.12); opacity:0; }
  20% { opacity:.95; }
  to { transform: translate(-50%,-50%) scale(calc(2 + var(--power) * 3.5)); opacity:0; }
}
@keyframes ae-p08-electric {
  0%,100% { transform: rotate(var(--angle)) scaleX(.18); opacity:0; }
  12% { opacity:1; }
  24% { opacity:.2; }
  32% { opacity:.95; }
  65% { transform: rotate(calc(var(--angle) + 10deg)) scaleX(calc(.8 + var(--power) * .28)); opacity:.72; }
}
@keyframes ae-p08-ribbon {
  from { transform: translate3d(-35vw,0,0) rotate(var(--angle)) skewY(-6deg) scaleX(.7); opacity:0; }
  16% { opacity:.82; }
  50% { transform: translate3d(45vw,calc(20px * var(--power)),0) rotate(calc(var(--angle) + 12deg)) skewY(8deg) scaleX(1); opacity:1; }
  to { transform: translate3d(135vw,calc(-28px * var(--power)),0) rotate(calc(var(--angle) - 10deg)) skewY(-8deg) scaleX(1.15); opacity:0; }
}
@keyframes ae-p08-ink {
  0%,100% { transform: translate(-50%,-50%) rotate(var(--angle)) scale(.65); opacity:.12; }
  50% { transform: translate(calc(-50% + 38px * var(--power)),calc(-50% - 24px)) rotate(calc(var(--angle) + 120deg)) scale(calc(1 + var(--power) * .24)); opacity:.76; }
}
`.trim();function lr(e){return Math.max(0,Math.min(400,e))}function Qo(e){return"aeRenderPack08"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function Mn(e,t){return Math.max(1,Math.round(e.count*lr(t.density)/100))}function ec(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.2,lr(a.intensity)/100);e.className=`ae-p08 ae-p08-${s.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${14+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.4+n()*7)/i}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--orbit",`${40+n()*220*r}px`),(s.kind==="black-hole"||s.kind==="debris"||s.kind==="tunnel")&&(e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%")),s.kind==="target"&&(e.style.setProperty("--x",`${24+n()*52}%`),e.style.setProperty("--y",`${20+n()*58}%`),e.style.setProperty("--size",`${24+n()*60}px`)),s.kind==="scanner"&&(e.style.setProperty("--x",`${-12+n()*24}%`),e.style.setProperty("--y",`${n()*94}%`),e.style.setProperty("--angle",`${-8+n()*16}deg`)),s.kind==="melt"&&(e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${-18+n()*8}%`)),(s.kind==="wirecube"||s.kind==="poly")&&(e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${7+n()*86}%`),e.style.setProperty("--size",`${22+n()*64}px`)),s.kind==="shockwave"&&(e.style.setProperty("--x",`${14+n()*72}%`),e.style.setProperty("--y",`${14+n()*72}%`),e.style.setProperty("--size",`${28+n()*62}px`)),s.kind==="electric"&&(e.style.setProperty("--x",`${4+n()*84}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--duration",`${(.8+n()*2.7)/i}s`)),s.kind==="ribbon"&&(e.style.setProperty("--x",`${-18+n()*18}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--angle",`${-7+n()*14}deg`)),s.kind==="ink"&&(e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${55+n()*120}px`)),s.kind==="lattice"&&e.style.setProperty("--angle",`${Math.round(n()*5)*30}deg`),s.kind==="fragments"&&e.style.setProperty("--duration",`${(.7+n()*2.4)/i}s`),e.style.setProperty("--i",String(t))}function tc(e,t){return`
function ${t}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const density = Math.max(0, Math.min(400, s.density));
  const intensity = Math.max(0, Math.min(400, s.intensity));
  const power = Math.max(.2, intensity / 100);
  const speed = Math.max(.1, s.speed / 100);
  const count = Math.max(1, Math.round(${e.count} * density / 100));

  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p08 ae-p08-${e.kind}";
    node.style.setProperty("--x", (random() * 100) + "%");
    node.style.setProperty("--y", (random() * 100) + "%");
    node.style.setProperty("--size", (14 + random() * 86) + "px");
    node.style.setProperty("--angle", (random() * 360) + "deg");
    node.style.setProperty("--duration", ((2.4 + random() * 7) / speed) + "s");
    node.style.setProperty("--delay", (-random() * 9) + "s");
    node.style.setProperty("--power", String(power));
    node.style.setProperty("--orbit", (40 + random() * 220 * power) + "px");
    node.style.setProperty("--i", String(i));

    if (
      ${JSON.stringify(e.kind)} === "black-hole" ||
      ${JSON.stringify(e.kind)} === "debris" ||
      ${JSON.stringify(e.kind)} === "tunnel"
    ) {
      node.style.setProperty("--x", "50%");
      node.style.setProperty("--y", "50%");
    }

    if (${JSON.stringify(e.kind)} === "target") {
      node.style.setProperty("--x", (24 + random() * 52) + "%");
      node.style.setProperty("--y", (20 + random() * 58) + "%");
      node.style.setProperty("--size", (24 + random() * 60) + "px");
    }

    if (${JSON.stringify(e.kind)} === "scanner") {
      node.style.setProperty("--x", (-12 + random() * 24) + "%");
      node.style.setProperty("--y", (random() * 94) + "%");
      node.style.setProperty("--angle", (-8 + random() * 16) + "deg");
    }

    if (${JSON.stringify(e.kind)} === "melt") {
      node.style.setProperty("--x", (random() * 100) + "%");
      node.style.setProperty("--y", (-18 + random() * 8) + "%");
    }

    if (
      ${JSON.stringify(e.kind)} === "wirecube" ||
      ${JSON.stringify(e.kind)} === "poly"
    ) {
      node.style.setProperty("--x", (6 + random() * 88) + "%");
      node.style.setProperty("--y", (7 + random() * 86) + "%");
      node.style.setProperty("--size", (22 + random() * 64) + "px");
    }

    if (${JSON.stringify(e.kind)} === "shockwave") {
      node.style.setProperty("--x", (14 + random() * 72) + "%");
      node.style.setProperty("--y", (14 + random() * 72) + "%");
      node.style.setProperty("--size", (28 + random() * 62) + "px");
    }

    if (${JSON.stringify(e.kind)} === "electric") {
      node.style.setProperty("--x", (4 + random() * 84) + "%");
      node.style.setProperty("--y", (5 + random() * 90) + "%");
      node.style.setProperty("--duration", ((.8 + random() * 2.7) / speed) + "s");
    }

    if (${JSON.stringify(e.kind)} === "ribbon") {
      node.style.setProperty("--x", (-18 + random() * 18) + "%");
      node.style.setProperty("--y", (8 + random() * 84) + "%");
      node.style.setProperty("--angle", (-7 + random() * 14) + "deg");
    }

    if (${JSON.stringify(e.kind)} === "ink") {
      node.style.setProperty("--x", (8 + random() * 84) + "%");
      node.style.setProperty("--y", (8 + random() * 84) + "%");
      node.style.setProperty("--size", (55 + random() * 120) + "px");
    }

    if (${JSON.stringify(e.kind)} === "lattice") {
      node.style.setProperty("--angle", (Math.round(random() * 5) * 30) + "deg");
    }

    if (${JSON.stringify(e.kind)} === "fragments") {
      node.style.setProperty("--duration", ((.7 + random() * 2.4) / speed) + "s");
    }

    layer.appendChild(node);
  }
}
`.trim()}function ac(e){const t=Qo(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Yo,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:Jo,performanceCost:e.cost,requiresJavaScript:!0},css:Ko,streamElementsRendererName:t,renderPreview(a,n,s){const i=Mn(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");ec(o,r,n,s,e),a.appendChild(o)}},streamElementsRendererSource:tc(e,t),estimateDomNodes(a){return Mn(e,a)}}}const nc=Vo.map(ac),G=(e,t,a,n=100,s=0,i=200,r=1)=>({key:e,label:t,description:a,defaultValue:n,min:s,max:i,step:r,suffix:"%"}),rc=[{id:"fireworks",name:"Fireworks",description:"Wielofazowe fajerwerki: lot, eksplozja, radialne iskry i opadanie.",category:"cinematic",tags:["fireworks","burst","sparks","celebration"],kind:"burst",count:12,cost:4,controls:[G("burstSize","Rozmiar eksplozji","Jak szeroko rozchodzą się iskry."),G("trailLength","Długość iskier","Długość radialnych smug po wybuchu."),G("cadence","Częstotliwość","Jak często pojawiają się kolejne wybuchy.")]},{id:"lightning",name:"Lightning",description:"Duże łamane pioruny z odnogami, błyskiem i krótkim afterglow.",category:"weather",tags:["lightning","bolt","storm","electric"],kind:"bolt",count:8,cost:4,controls:[G("branching","Rozgałęzienie","Ilość i długość bocznych odnóg."),G("boltLength","Długość pioruna","Jak dużą część kadru przecina wyładowanie."),G("flash","Siła błysku","Moc poświaty i impulsu świetlnego.")]},{id:"lightning-storm",name:"Lightning Storm",description:"Burza wielu dużych wyładowań o różnej długości i częstotliwości.",category:"weather",tags:["lightning","storm","thunder","electric"],kind:"storm-bolt",count:14,cost:5,controls:[G("branching","Rozgałęzienie","Gęstość bocznych odnóg wyładowań."),G("stormSpread","Zasięg burzy","Jak szeroko po ekranie pojawiają się wyładowania."),G("flash","Siła błysku","Moc krótkich impulsów świetlnych.")]},{id:"gears",name:"Gears",description:"Czytelne koła zębate z piastą, zębami i kontr-rotacją.",category:"steampunk",tags:["gears","cogs","mechanical","steampunk"],kind:"gear",count:11,cost:3,controls:[G("teeth","Liczba zębów","Wrażenie drobniejszych lub masywniejszych zębów."),G("spacing","Rozstaw","Odległość między kołami."),G("mechanicalChaos","Chaos mechanizmu","Różnica rozmiarów i prędkości obrotu.")]},{id:"liquid-blobs",name:"Liquid Blobs",description:"Płynne organiczne metaballe, które rozciągają się i wizualnie łączą.",category:"abstract",tags:["liquid","metaball","goo","organic"],kind:"liquid",count:18,cost:4,controls:[G("viscosity","Lepkość","Jak wolno i ciężko poruszają się kształty."),G("blobSize","Rozmiar blobów","Średni rozmiar płynnych form."),G("merge","Łączenie","Jak mocno formy wizualnie stapiają się ze sobą.")]},{id:"gravity-well",name:"Gravity Well",description:"Czytelna studnia grawitacyjna z ciemnym rdzeniem i spiralnym zasysaniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:90,cost:4,controls:[G("pull","Siła zasysania","Jak gwałtownie cząstki skręcają do środka."),G("orbitSpread","Promień orbit","Rozpiętość spiral wokół centrum."),G("coreSize","Wielkość rdzenia","Rozmiar ciemnego centrum studni.")]},{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Czarna dziura z jasnym spłaszczonym dyskiem akrecyjnym i pyłem.",category:"cosmic",tags:["black hole","accretion","singularity","disk"],kind:"black-hole",count:104,cost:5,controls:[G("discWidth","Szerokość dysku","Rozpiętość dysku akrecyjnego."),G("pull","Siła zasysania","Tempo opadania cząstek do centrum."),G("glow","Blask dysku","Jasność i poświata gorącego materiału.")]},{id:"electric-web",name:"Electric Web",description:"Sieć punktów połączonych przeskakującymi łukami elektrycznymi.",category:"energy",tags:["electric","web","nodes","arcs"],kind:"web",count:34,cost:4,controls:[G("connections","Połączenia","Gęstość elektrycznej sieci."),G("reach","Zasięg łuków","Długość przeskoków między punktami."),G("jitter","Niestabilność","Jak agresywnie łuki migoczą i przeskakują.")]},{id:"electric-arcs",name:"Electric Arcs",description:"Długie łamane łuki elektryczne z nieregularnym migotaniem.",category:"energy",tags:["electric","arcs","plasma","voltage"],kind:"arc",count:24,cost:4,controls:[G("arcLength","Długość łuków","Długość pojedynczych wyładowań."),G("jitter","Poszarpanie","Stopień nieregularności kształtu."),G("pulse","Pulsowanie","Częstotliwość zaników i ponownych zapłonów.")]},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Wyraźna galaktyka spiralna z ramionami i jasnym centrum.",category:"cosmic",tags:["galaxy","spiral","stars","cosmic"],kind:"galaxy",count:150,cost:4,controls:[G("armTightness","Skręt ramion","Jak ciasno ramiona owijają się wokół centrum."),G("coreGlow","Jasność jądra","Siła centralnej poświaty."),G("armSpread","Rozpiętość","Jak szeroko rozchodzą się ramiona galaktyki.")]},{id:"growing-vines",name:"Growing Vines",description:"Pnącza wyrastające z punktów, skręcające i tworzące odnogi.",category:"botanical",tags:["vines","plants","growth","branches"],kind:"vine",count:22,cost:3,controls:[G("curl","Skręt pnączy","Jak mocno łodygi wiją się podczas wzrostu."),G("branches","Rozgałęzienia","Ilość bocznych odnóg."),G("growth","Tempo wzrostu","Długość i szybkość rozwijania się pnączy.")]},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspektywiczny tunel neonowych ramek z wyraźnym punktem zbiegu.",category:"retro",tags:["neon","tunnel","perspective","synthwave"],kind:"tunnel",count:24,cost:3,controls:[G("depth","Głębia tunelu","Jak mocna jest perspektywa i skala kolejnych ramek."),G("spacing","Rozstaw ramek","Odległość między kolejnymi segmentami."),G("pulse","Puls neonu","Siła pulsowania i poświaty.")]},{id:"scanlines",name:"Scanlines",description:"Czytelne linie skanowania z delikatnym dryfem i migotaniem.",category:"retro",tags:["scanlines","crt","retro","screen"],kind:"scanline",count:90,cost:2,opacity:62,density:78,speed:68,intensity:92,brightness:125,controls:[G("lineGap","Odstęp linii","Gęstość poziomych linii."),G("flicker","Migotanie","Siła nieregularnego CRT flickeru."),G("drift","Dryf","Prędkość przesuwania całej siatki.")]},{id:"laser-grid",name:"Laser Grid",description:"Jasna perspektywiczna siatka laserowa z pulsującymi liniami.",category:"sci-fi",tags:["laser","grid","perspective","sci-fi"],kind:"laser-grid",count:42,cost:3,opacity:76,density:72,speed:82,intensity:110,brightness:145,controls:[G("perspective","Perspektywa","Jak mocno siatka zbiega się ku horyzontowi."),G("spacing","Rozstaw","Odległość pomiędzy liniami."),G("pulse","Puls lasera","Jasność i rytm pulsowania.")]},{id:"vhs-static",name:"VHS Static",description:"Widoczne analogowe zakłócenia z trackingiem, pasami i szumem.",category:"retro",tags:["vhs","static","noise","tracking"],kind:"vhs",count:72,cost:3,opacity:68,density:76,speed:120,intensity:110,brightness:130,controls:[G("noise","Szum","Ilość drobnych analogowych zakłóceń."),G("tracking","Tracking","Siła poziomych pasów i przesunięć."),G("jitter","Drżenie obrazu","Nieregularne przeskoki i jitter.")]},{id:"hud-grid",name:"HUD Grid",description:"Czytelna techniczna siatka HUD z osiami, skanem i pulsującymi punktami.",category:"tech",tags:["hud","grid","scanner","interface"],kind:"hud",count:50,cost:3,opacity:72,density:70,speed:74,intensity:105,brightness:138,controls:[G("gridSpacing","Rozstaw siatki","Wielkość pól technologicznej siatki."),G("scan","Skanowanie","Siła przesuwającej się wiązki skanu."),G("markers","Znaczniki","Widoczność punktów i markerów HUD.")]},{id:"city-lights",name:"City Lights",description:"Warstwowy nocny skyline z oknami, parallaxem i migotaniem.",category:"urban",tags:["city","lights","skyline","windows"],kind:"city",count:46,cost:3,opacity:82,density:74,speed:46,intensity:100,brightness:135,controls:[G("skyline","Wysokość zabudowy","Średnia wysokość budynków."),G("parallax","Parallax","Różnica prędkości między planami."),G("windows","Światła okien","Gęstość i migotanie okien.")]},{id:"embers",name:"Embers",description:"Czytelniejsze żarzące iskry z unoszeniem, smugą i wygaszaniem.",category:"cinematic",tags:["embers","fire","sparks","ash"],kind:"ember",count:58,cost:3,opacity:82,density:72,speed:82,intensity:110,brightness:145,controls:[G("lift","Siła unoszenia","Jak szybko iskry unoszą się ku górze."),G("trail","Długość smugi","Jak długo widoczny jest ślad żaru."),G("flicker","Migotanie","Nieregularność jasności iskier.")]},{id:"dust-motes",name:"Dust Motes",description:"Wyraźniejszy pył w świetle z różną głębią, rozmiarem i dryfem.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],kind:"dust",count:78,cost:2,opacity:66,density:72,speed:48,intensity:92,brightness:125,controls:[G("depth","Głębia","Różnica skali i rozmycia między planami."),G("drift","Dryf","Siła spokojnego ruchu cząstek."),G("sparkle","Połysk","Jak często drobiny łapią światło.")]},{id:"magnetic-field",name:"Magnetic Field",description:"Łuki pola magnetycznego oplatające dwa bieguny.",category:"sci-fi",tags:["magnetic","field","lines","physics"],kind:"magnetic",count:36,cost:3,controls:[G("curvature","Krzywizna pola","Jak mocno linie wyginają się między biegunami."),G("poleDistance","Rozstaw biegunów","Odległość między źródłami pola."),G("flow","Przepływ","Szybkość świetlnych impulsów po liniach.")]},{id:"volumetric-rays",name:"Volumetric Rays",description:"Miękkie wolumetryczne promienie światła przecinające scenę.",category:"cinematic",tags:["rays","god rays","light","volumetric"],kind:"rays",count:18,cost:3,opacity:58,density:56,speed:42,intensity:105,brightness:135,controls:[G("spread","Rozwarcie","Szerokość wachlarza promieni."),G("softness","Miękkość","Stopień rozmycia krawędzi światła."),G("sweep","Ruch źródła","Jak mocno promienie przesuwają się po scenie.")]},{id:"plasma-filaments",name:"Plasma Filaments",description:"Falujące włókna plazmy przypominające aktywne pole energetyczne.",category:"energy",tags:["plasma","filaments","energy","electric"],kind:"filament",count:34,cost:4,controls:[G("curl","Skręt włókien","Jak mocno linie plazmy się wiją."),G("length","Długość","Średnia długość energetycznych włókien."),G("heat","Temperatura","Jasność i intensywność świecenia.")]},{id:"ripple-field",name:"Ripple Field",description:"Wiele nakładających się fal powierzchniowych o różnych centrach.",category:"abstract",tags:["ripple","waves","rings","water"],kind:"ripple",count:18,cost:3,controls:[G("radius","Promień fal","Maksymalny zasięg pojedynczej fali."),G("frequency","Częstotliwość","Jak często powstają nowe fale."),G("distortion","Nieregularność","Jak mocno fale odbiegają od idealnych okręgów.")]},{id:"bioluminescent-plankton",name:"Bioluminescent Plankton",description:"Organiczne świecące drobiny reagujące falami i lokalnymi rozbłyskami.",category:"botanical",tags:["plankton","bioluminescent","ocean","organic"],kind:"plankton",count:82,cost:3,controls:[G("current","Prąd wody","Siła wspólnego dryfu cząstek."),G("flash","Bioluminescencja","Siła krótkich organicznych rozbłysków."),G("swarm","Skupiska","Jak mocno plankton tworzy lokalne grupy.")]},{id:"glass-shards",name:"Glass Shards",description:"Odłamki szkła z obrotem, refleksami i różnymi planami głębi.",category:"cinematic",tags:["glass","shards","fragments","reflection"],kind:"shards",count:38,cost:3,controls:[G("shardSize","Rozmiar odłamków","Średni rozmiar kawałków szkła."),G("spin","Obrót","Prędkość rotacji odłamków."),G("reflection","Refleksy","Siła błysków na krawędziach szkła.")]},{id:"aurora-curtains",name:"Aurora Curtains",description:"Warstwowe pionowe kurtyny zorzy z płynną falą i głębią.",category:"cosmic",tags:["aurora","curtains","sky","waves"],kind:"aurora",count:16,cost:4,controls:[G("curtainWidth","Szerokość kurtyn","Jak szerokie są pasma zorzy."),G("wave","Falowanie","Amplituda płynnego ruchu kurtyn."),G("depth","Głębia","Różnica jasności i skali pomiędzy warstwami.")]},{id:"data-streams",name:"Data Streams",description:"Warstwowe kanały danych poruszające się niezależnie z pakietami i przerwami.",category:"tech",tags:["data","streams","packets","network"],kind:"data",count:48,cost:3,controls:[G("packetLength","Długość pakietów","Długość poruszających się segmentów."),G("lanes","Liczba kanałów","Wrażenie gęstości równoległych strumieni."),G("dropout","Przerwy sygnału","Jak często dane znikają i wracają.")]},{id:"orbital-rings",name:"Orbital Rings",description:"Kilka przecinających się orbit z punktami poruszającymi się po różnych płaszczyznach.",category:"cosmic",tags:["orbit","rings","planet","atomic"],kind:"orbit-rings",count:24,cost:3,controls:[G("tilt","Nachylenie orbit","Różnica płaszczyzn kolejnych pierścieni."),G("radius","Promień orbit","Rozmiar całego układu."),G("satellites","Satelity","Widoczność i liczba punktów na orbitach.")]},{id:"prism-caustics",name:"Prism Caustics",description:"Miękkie załamania światła i tęczowe kaustyki przesuwające się po scenie.",category:"abstract",tags:["prism","caustics","light","refraction"],kind:"caustics",count:20,cost:4,controls:[G("spread","Rozszczepienie","Szerokość kolorystycznego rozdzielenia światła."),G("softness","Miękkość","Rozmycie i płynność kaustyk."),G("motion","Ruch","Tempo przesuwania świetlnych plam.")]},{id:"ember-ribbons",name:"Ember Ribbons",description:"Długie ogniste wstęgi z iskrami i zanikającym ogonem.",category:"energy",tags:["embers","ribbons","fire","trails"],kind:"ember-ribbon",count:24,cost:4,controls:[G("trail","Długość ogona","Długość płonącej wstęgi."),G("curl","Skręt","Jak mocno wstęga faluje i zakręca."),G("sparks","Iskry","Widoczność drobnych iskier wokół wstęgi.")]},{id:"fractal-branches",name:"Fractal Branches",description:"Rosnące geometryczne rozgałęzienia przypominające fraktalne drzewo.",category:"abstract",tags:["fractal","branches","recursive","geometry"],kind:"fractal",count:32,cost:4,controls:[G("branching","Rozgałęzienie","Ilość kolejnych odnóg."),G("angle","Kąt gałęzi","Rozwarcie struktury fraktalnej."),G("growth","Wzrost","Tempo rozwijania kolejnych poziomów.")]}],rt={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100,custom:{}},sc={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},ic=String.raw`.ae-p09{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);pointer-events:none;will-change:transform,opacity,filter;animation-duration:var(--duration);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear}.ae-p09::before,.ae-p09::after{pointer-events:none}
.ae-p09-burst{width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff;animation-name:ae09-burst}.ae-p09-burst::before{content:"";position:absolute;inset:-2px;border-radius:50%;box-shadow:0 -55px 0 -1px #fff,38px -38px 0 -1px #7de6ff,55px 0 0 -1px #b98cff,38px 38px 0 -1px #ff89c8,0 55px 0 -1px #ffd87d,-38px 38px 0 -1px #8bffb6,-55px 0 0 -1px #7bbcff,-38px -38px 0 -1px #ffa76e;transform:scale(calc(.65 + var(--c1)*.65))}
.ae-p09-bolt,.ae-p09-storm-bolt{width:calc(14px + 12px*var(--c1));height:calc(180px + 190px*var(--c2));background:linear-gradient(180deg,#fff 0 8%,#9feaff 30%,#b692ff 68%,rgba(150,210,255,.1));clip-path:polygon(47% 0,63% 15%,52% 15%,72% 33%,57% 33%,76% 51%,59% 51%,70% 68%,47% 68%,56% 100%,31% 73%,43% 73%,22% 54%,39% 54%,21% 34%,38% 34%,29% 15%,45% 15%);filter:drop-shadow(0 0 calc(9px + 11px*var(--c3)) rgba(130,220,255,.92));animation-name:ae09-bolt}.ae-p09-storm-bolt{height:calc(240px + 260px*var(--c2));animation-name:ae09-storm}
.ae-p09-gear{border-radius:50%;background:repeating-conic-gradient(from 0deg,#d5b878 0 6deg,#4f4229 6deg calc(10deg + 4deg*var(--c1)));box-shadow:inset 0 0 0 8px #151a22,inset 0 0 0 16px rgba(222,192,126,.36),0 0 15px rgba(239,185,92,.14);animation-name:ae09-gear}.ae-p09-gear::after{content:"";position:absolute;inset:34%;border-radius:50%;background:#0c1118;box-shadow:0 0 0 5px rgba(225,193,127,.55)}
.ae-p09-liquid{background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.72),rgba(87,225,255,.38) 30%,rgba(164,104,255,.25) 64%,transparent 74%);border-radius:43% 57% 61% 39%/37% 46% 54% 63%;filter:blur(calc(1px + 5px*var(--c3)));mix-blend-mode:screen;animation-name:ae09-liquid}
.ae-p09-gravity,.ae-p09-black-hole{left:50%;top:50%;width:calc(3px + 4px*var(--c3));height:calc(3px + 4px*var(--c3));border-radius:50%;background:#fff;box-shadow:0 0 9px #8ceaff,0 0 calc(16px + 14px*var(--c3)) rgba(159,110,255,.62);animation-name:ae09-gravity}.ae-p09-gravity::after,.ae-p09-black-hole::after{content:"";position:absolute;left:50%;top:50%;width:calc(60px + 90px*var(--c3));height:calc(60px + 90px*var(--c3));transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#02040a 0 26%,rgba(5,8,18,.95) 27% 38%,rgba(90,182,255,.12) 42%,transparent 68%)}.ae-p09-black-hole::before{content:"";position:absolute;left:50%;top:50%;width:calc(120px + 200px*var(--c1));height:calc(20px + 18px*var(--c1));transform:translate(-50%,-50%) rotate(-8deg);border-radius:50%;border:2px solid rgba(255,206,116,.76);box-shadow:0 0 calc(20px + 24px*var(--c3)) rgba(255,139,75,.38)}
.ae-p09-web,.ae-p09-arc{width:calc(80px + 150px*var(--c2));height:3px;transform-origin:0 50%;background:linear-gradient(90deg,#fff,#75e7ff 54%,rgba(171,124,255,.06));clip-path:polygon(0 40%,16% 0,27% 62%,43% 16%,55% 77%,68% 22%,80% 70%,100% 40%,82% 100%,68% 55%,54% 100%,42% 52%,27% 100%,16% 45%);filter:drop-shadow(0 0 7px rgba(105,226,255,.75));animation-name:ae09-electric}.ae-p09-web::after{content:"";position:absolute;right:0;top:-4px;width:9px;height:9px;border-radius:50%;background:#dfffff;box-shadow:0 0 12px #67eaff}
.ae-p09-galaxy{left:50%;top:50%;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(150,220,255,.85);animation-name:ae09-galaxy}
.ae-p09-vine{width:calc(80px + 130px*var(--c3));height:3px;border-radius:999px;transform-origin:0 50%;background:linear-gradient(90deg,#4ddd8b,#a5f7bd 70%,rgba(80,220,130,0));box-shadow:0 0 8px rgba(82,231,140,.25);animation-name:ae09-vine}.ae-p09-vine::after{content:"";position:absolute;left:48%;top:-8px;width:16px;height:10px;border-radius:80% 0 80% 0;background:rgba(97,232,144,.68);transform:rotate(calc(20deg + 35deg*var(--c2)))}
.ae-p09-tunnel{left:50%;top:50%;background:transparent;border:2px solid rgba(94,225,255,.75);box-shadow:0 0 calc(8px + 10px*var(--c3)) rgba(93,224,255,.36),inset 0 0 10px rgba(167,112,255,.14);animation-name:ae09-tunnel}
.ae-p09-scanline{left:0;width:100%;height:1px;background:rgba(120,220,255,calc(.16 + .35*var(--c2)));animation-name:ae09-scanline}
.ae-p09-laser-grid{width:100%;height:1px;background:linear-gradient(90deg,transparent,#62e7ff,transparent);box-shadow:0 0 8px rgba(96,225,255,.5);transform-origin:50% 50%;animation-name:ae09-grid}
.ae-p09-vhs{width:calc(40px + 180px*var(--c1));height:calc(1px + 5px*var(--c2));background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(102,225,255,.7),rgba(255,96,174,.5),rgba(255,255,255,.04));box-shadow:-5px 0 0 rgba(255,80,160,.25),5px 0 0 rgba(80,220,255,.23);animation-name:ae09-vhs}
.ae-p09-hud{width:calc(35px + 30px*var(--c1));height:calc(35px + 30px*var(--c1));border:1px solid rgba(92,229,255,.36);background:linear-gradient(90deg,transparent 48%,rgba(92,229,255,.18) 49% 51%,transparent 52%),linear-gradient(0deg,transparent 48%,rgba(92,229,255,.18) 49% 51%,transparent 52%);animation-name:ae09-hud}
.ae-p09-city{bottom:0;top:auto;width:var(--size);height:calc(80px + 180px*var(--c1));background:linear-gradient(180deg,#16243a,#080d15);box-shadow:inset 0 0 0 1px rgba(90,170,255,.08);animation-name:ae09-city}.ae-p09-city::after{content:"";position:absolute;inset:10px 8px;background:repeating-linear-gradient(0deg,transparent 0 12px,rgba(255,203,103,calc(.18 + .4*var(--c3))) 13px 16px),repeating-linear-gradient(90deg,transparent 0 14px,rgba(255,222,132,.55) 15px 18px);opacity:.75}
.ae-p09-ember{width:calc(3px + 5px*var(--c3));height:calc(8px + 18px*var(--c2));border-radius:50% 50% 80% 80%;background:linear-gradient(180deg,#fff4b0,#ff9c4a 42%,#ff4f2d 72%,transparent);box-shadow:0 0 10px rgba(255,111,48,.65);animation-name:ae09-ember}
.ae-p09-dust{border-radius:50%;background:rgba(240,230,190,.7);box-shadow:0 0 calc(3px + 5px*var(--c3)) rgba(255,239,184,.3);animation-name:ae09-dust}
.ae-p09-magnetic{left:50%;top:50%;width:calc(150px + 180px*var(--c2));height:calc(55px + 90px*var(--c1));border:1px solid rgba(94,227,255,.52);border-radius:50%;box-shadow:0 0 12px rgba(94,227,255,.12);animation-name:ae09-magnetic}
.ae-p09-rays{top:-20%;width:calc(90px + 180px*var(--c1));height:140%;transform-origin:50% 0;background:linear-gradient(180deg,rgba(255,255,255,.38),rgba(103,220,255,.08) 45%,transparent);clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);filter:blur(calc(3px + 8px*var(--c2)));animation-name:ae09-rays}
.ae-p09-filament{width:calc(100px + 180px*var(--c2));height:3px;transform-origin:0 50%;background:linear-gradient(90deg,rgba(255,255,255,.05),#7ce9ff 35%,#c18cff 70%,transparent);box-shadow:0 0 calc(8px + 10px*var(--c3)) rgba(122,225,255,.5);animation-name:ae09-filament}
.ae-p09-ripple{border-radius:50%;border:2px solid rgba(115,224,255,.58);box-shadow:0 0 12px rgba(115,224,255,.16);animation-name:ae09-ripple}
.ae-p09-plankton{border-radius:50%;background:#b7fff0;box-shadow:0 0 calc(8px + 12px*var(--c2)) rgba(77,255,220,.72);animation-name:ae09-plankton}
.ae-p09-shards{clip-path:polygon(48% 0,100% 23%,72% 100%,14% 78%,0 19%);background:linear-gradient(145deg,rgba(255,255,255,.65),rgba(108,225,255,.16) 35%,rgba(171,114,255,.25));box-shadow:inset 0 0 0 1px rgba(190,235,255,.44),0 0 12px rgba(100,214,255,.15);animation-name:ae09-shards}
.ae-p09-aurora{top:0;height:100%;width:calc(60px + 130px*var(--c1));background:linear-gradient(90deg,transparent,rgba(75,255,183,.18),rgba(87,177,255,.28),rgba(177,112,255,.2),transparent);filter:blur(calc(4px + 8px*var(--c3)));animation-name:ae09-aurora}
.ae-p09-data{height:2px;width:calc(55px + 150px*var(--c1));background:linear-gradient(90deg,transparent,#76e7ff 25%,#fff 60%,rgba(172,120,255,.12));box-shadow:0 0 8px rgba(110,225,255,.28);animation-name:ae09-data}
.ae-p09-orbit-rings{left:50%;top:50%;border:1px solid rgba(113,226,255,.52);border-radius:50%;box-shadow:0 0 10px rgba(113,226,255,.12);animation-name:ae09-orbit}.ae-p09-orbit-rings::after{content:"";position:absolute;left:50%;top:-4px;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 9px #73e6ff}
.ae-p09-caustics{border-radius:48% 52% 62% 38%;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.26),rgba(110,231,255,.13) 32%,rgba(185,102,255,.15) 52%,rgba(255,109,177,.09) 66%,transparent 74%);filter:blur(calc(4px + 8px*var(--c2)));mix-blend-mode:screen;animation-name:ae09-caustics}
.ae-p09-ember-ribbon{height:calc(4px + 8px*var(--c3));width:calc(100px + 220px*var(--c1));border-radius:50%;background:linear-gradient(90deg,transparent,#ff5d38 20%,#ffb657 54%,#fff0a5 72%,transparent);box-shadow:0 0 13px rgba(255,116,45,.4);animation-name:ae09-ribbon}
.ae-p09-fractal{width:calc(65px + 130px*var(--c1));height:2px;transform-origin:0 50%;background:linear-gradient(90deg,#7de7ff,#b892ff 62%,transparent);box-shadow:0 0 7px rgba(117,225,255,.3);animation-name:ae09-fractal}.ae-p09-fractal::before,.ae-p09-fractal::after{content:"";position:absolute;right:30%;top:0;width:55%;height:2px;transform-origin:0 50%;background:inherit;box-shadow:inherit}.ae-p09-fractal::before{transform:rotate(calc(18deg + 28deg*var(--c2)))}.ae-p09-fractal::after{transform:rotate(calc(-18deg - 28deg*var(--c2)))}
@keyframes ae09-burst{0%,14%{transform:translate(-50%,180px) scale(.05);opacity:0}18%{opacity:1}62%{transform:translate(-50%,-50%) scale(calc(.8 + .9*var(--c1)));opacity:1}100%{transform:translate(-50%,-50%) scale(calc(1.2 + 1.5*var(--c1)));opacity:0}}@keyframes ae09-bolt{0%,100%{transform:translate(-50%,-10%) scaleY(.35);opacity:0}8%{opacity:1}12%{opacity:.18}16%{opacity:1}68%{opacity:.75}100%{transform:translate(-50%,-10%) scaleY(calc(.85 + .45*var(--c2)));opacity:0}}@keyframes ae09-storm{0%,100%{transform:translate(-50%,-5%) scaleY(.28);opacity:0}8%{opacity:1}14%{opacity:.12}20%{opacity:1}74%{opacity:.7}100%{transform:translate(-50%,-5%) scaleY(calc(.95 + .5*var(--c2)));opacity:0}}@keyframes ae09-gear{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(var(--spin))}}@keyframes ae09-liquid{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.82)}50%{transform:translate(calc(-50% + 36px*var(--c1)),calc(-50% - 20px*var(--c1))) rotate(calc(var(--angle) + 160deg)) scale(calc(1 + .25*var(--c2)))}}@keyframes ae09-gravity{0%{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.8);opacity:.2}55%{opacity:1}100%{transform:rotate(calc(var(--angle) + 900deg*var(--c1))) translateX(calc(7px + var(--orbit)*.1)) scale(.05);opacity:0}}@keyframes ae09-electric{0%,100%{transform:rotate(var(--angle)) scaleX(.2);opacity:0}10%{opacity:1}18%{opacity:.15}26%{opacity:.9}58%{transform:rotate(calc(var(--angle) + 9deg*var(--c3))) scaleX(calc(.8 + .3*var(--c2)));opacity:.7}}@keyframes ae09-galaxy{from{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.6);opacity:.25}50%{opacity:1}to{transform:rotate(calc(var(--angle) + 360deg*var(--c1))) translateX(var(--orbit)) scale(1);opacity:.35}}@keyframes ae09-vine{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.1}20%{opacity:1}to{transform:rotate(calc(var(--angle) + 20deg*var(--c1))) scaleX(calc(.85 + .2*var(--c3)));opacity:.78}}@keyframes ae09-tunnel{from{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.05);opacity:0}18%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 4deg*var(--c3))) scale(calc(2.2 + 2.8*var(--c1)));opacity:0}}@keyframes ae09-scanline{from{transform:translateY(-10vh);opacity:.18}50%{opacity:.7}to{transform:translateY(110vh);opacity:.18}}@keyframes ae09-grid{0%,100%{transform:rotate(var(--angle)) scaleX(.5);opacity:.18}50%{transform:rotate(calc(var(--angle) + 4deg*var(--c1))) scaleX(calc(1 + .3*var(--c3)));opacity:.9}}@keyframes ae09-vhs{0%,100%{transform:translateX(0) skewX(0);opacity:.1}17%{transform:translateX(calc(-16px*var(--c3))) skewX(18deg);opacity:.92}35%{transform:translateX(calc(22px*var(--c3))) skewX(-11deg);opacity:.3}64%{transform:translateX(calc(-20px*var(--c3))) skewX(7deg);opacity:.78}}@keyframes ae09-hud{0%,100%{transform:translate(-50%,-50%) scale(.85);opacity:.18}50%{transform:translate(-50%,-50%) scale(calc(.92 + .12*var(--c2)));opacity:.86}}@keyframes ae09-city{0%,100%{transform:translateX(0);opacity:.88}50%{transform:translateX(calc(-10px*var(--c2)));opacity:1}}@keyframes ae09-ember{from{transform:translate3d(0,25vh,0) scale(.5);opacity:0}12%{opacity:1}to{transform:translate3d(calc(42px*var(--c1)),calc(-115vh*var(--c1)),0) rotate(320deg) scale(.12);opacity:0}}@keyframes ae09-dust{0%,100%{transform:translate(-50%,-50%) scale(.6);opacity:.12}50%{transform:translate(calc(-50% + 28px*var(--c2)),calc(-50% - 16px*var(--c2))) scale(calc(.9 + .35*var(--c1)));opacity:.72}}@keyframes ae09-magnetic{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(.8);opacity:.14}50%{opacity:.82}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg)) scaleX(calc(.9 + .2*var(--c1)));opacity:.14}}@keyframes ae09-rays{0%,100%{transform:rotate(calc(var(--angle) - 6deg*var(--c3)));opacity:.08}50%{transform:rotate(calc(var(--angle) + 6deg*var(--c3)));opacity:.6}}@keyframes ae09-filament{0%,100%{transform:rotate(var(--angle)) translateX(0) scaleX(.55);opacity:.18}50%{transform:rotate(calc(var(--angle) + 22deg*var(--c1))) translateX(calc(28px*var(--c1))) scaleX(calc(.9 + .2*var(--c2)));opacity:.92}}@keyframes ae09-ripple{from{transform:translate(-50%,-50%) scale(.05);opacity:.8}to{transform:translate(-50%,-50%) scale(calc(2 + 3.6*var(--c1)));opacity:0}}@keyframes ae09-plankton{0%,100%{transform:translate(-50%,-50%) scale(.55);opacity:.15}38%{opacity:1}50%{transform:translate(calc(-50% + 20px*var(--c1)),calc(-50% - 15px*var(--c1))) scale(calc(.85 + .4*var(--c2)));opacity:.92}}@keyframes ae09-shards{from{transform:translate(-50%,-50%) rotate(0) scale(.55);opacity:.15}50%{opacity:.92}to{transform:translate(calc(-50% + 40px*var(--c2)),calc(-50% - 32px*var(--c2))) rotate(calc(300deg*var(--c2))) scale(calc(.8 + .22*var(--c1)));opacity:.16}}@keyframes ae09-aurora{0%,100%{transform:translateX(calc(-30px*var(--c2))) skewX(-8deg);opacity:.12}50%{transform:translateX(calc(30px*var(--c2))) skewX(8deg);opacity:.72}}@keyframes ae09-data{from{transform:translateX(-25vw) scaleX(.6);opacity:0}12%{opacity:.9}to{transform:translateX(125vw) scaleX(calc(.8 + .25*var(--c1)));opacity:0}}@keyframes ae09-orbit{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}50%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg*var(--c1))) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}}@keyframes ae09-caustics{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.65);opacity:.12}50%{transform:translate(calc(-50% + 34px*var(--c3)),calc(-50% - 24px*var(--c3))) rotate(calc(var(--angle) + 80deg)) scale(calc(.92 + .22*var(--c1)));opacity:.68}}@keyframes ae09-ribbon{from{transform:translateX(-35vw) rotate(var(--angle)) scaleX(.55);opacity:0}15%{opacity:.9}50%{transform:translateX(45vw) rotate(calc(var(--angle) + 12deg*var(--c2))) scaleX(1);opacity:1}to{transform:translateX(135vw) rotate(calc(var(--angle) - 12deg*var(--c2))) scaleX(calc(1 + .25*var(--c1)));opacity:0}}@keyframes ae09-fractal{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.08}20%{opacity:.85}to{transform:rotate(calc(var(--angle) + 8deg*var(--c3))) scaleX(calc(.9 + .2*var(--c1)));opacity:.68}}`.trim(),dr=e=>Math.max(0,Math.min(400,e)),Gt=(e,t,a=100)=>{const n=e.custom?.[t];return Number.isFinite(n)?Number(n):a},oc=e=>"aeRenderPack09"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("");function En(e,t){const a=Gt(t,e.controls[0]?.key??"",e.controls[0]?.defaultValue??100)/100;return Math.max(1,Math.round(e.count*dr(t.density)/100*(.8+a*.2)))}function cc(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.15,dr(a.intensity)/100),o=Gt(a,s.controls[0]?.key??"",s.controls[0]?.defaultValue??100)/100,c=Gt(a,s.controls[1]?.key??"",s.controls[1]?.defaultValue??100)/100,l=Gt(a,s.controls[2]?.key??"",s.controls[2]?.defaultValue??100)/100;switch(e.className=`ae-p09 ae-p09-${s.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${12+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.6+n()*6.8)/i}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--c1",String(o)),e.style.setProperty("--c2",String(c)),e.style.setProperty("--c3",String(l)),e.style.setProperty("--orbit",`${32+n()*220*c}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(220+n()*620*l)}deg`),s.kind){case"burst":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${12+n()*64}%`);break;case"bolt":case"storm-bolt":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${-6+n()*20}%`),e.style.setProperty("--duration",`${(.9+n()*2.5)/Math.max(.35,i)}s`);break;case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${44+n()*110*c}px`);break;case"liquid":e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${70+n()*150*c}px`),e.style.setProperty("--duration",`${(5+n()*8)*Math.max(.45,o)/Math.max(.35,i)}s`);break;case"gravity":case"black-hole":case"galaxy":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%");break;case"web":case"arc":e.style.setProperty("--x",`${4+n()*82}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--duration",`${(.8+n()*2.6)/Math.max(.4,i*l)}s`);break;case"vine":e.style.setProperty("--x",`${n()*75}%`),e.style.setProperty("--y",`${25+n()*70}%`),e.style.setProperty("--angle",`${-70+n()*140}deg`);break;case"tunnel":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${55+t*8*c}px`),e.style.setProperty("--angle",`${t%4*2.5}deg`);break;case"scanline":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${t/Math.max(1,s.count)*100}%`);break;case"laser-grid":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${8+t%14*6.5}%`),e.style.setProperty("--angle",`${t%2===0?0:90}deg`);break;case"vhs":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--duration",`${(.45+n()*1.7)/Math.max(.3,i)}s`);break;case"hud":e.style.setProperty("--x",`${5+t%10*10}%`),e.style.setProperty("--y",`${7+Math.floor(t/10)*16}%`);break;case"city":e.style.setProperty("--x",`${t/Math.max(1,s.count)*105-2}%`),e.style.setProperty("--y","100%"),e.style.setProperty("--size",`${28+n()*44}px`);break;case"ember":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${80+n()*25}%`),e.style.setProperty("--size",`${5+n()*11}px`);break;case"dust":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${2+n()*(6+9*o)}px`);break;case"magnetic":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--angle",`${-90+n()*180}deg`);break;case"rays":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y","-20%"),e.style.setProperty("--angle",`${-22+n()*44}deg`);break;case"filament":e.style.setProperty("--x",`${n()*70}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--angle",`${-45+n()*90}deg`);break;case"ripple":e.style.setProperty("--x",`${12+n()*76}%`),e.style.setProperty("--y",`${12+n()*76}%`),e.style.setProperty("--size",`${28+n()*44}px`);break;case"plankton":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${3+n()*8}px`);break;case"shards":e.style.setProperty("--x",`${4+n()*92}%`),e.style.setProperty("--y",`${4+n()*92}%`),e.style.setProperty("--size",`${24+n()*58*o}px`);break;case"aurora":e.style.setProperty("--x",`${-10+n()*100}%`),e.style.setProperty("--y","0%");break;case"data":e.style.setProperty("--x",`${-20+n()*10}%`),e.style.setProperty("--y",`${5+n()*90}%`);break;case"orbit-rings":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${80+n()*180*c}px`),e.style.setProperty("--angle",`${n()*180*o}deg`);break;case"caustics":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--size",`${90+n()*170}px`);break;case"ember-ribbon":e.style.setProperty("--x",`${-25+n()*15}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--angle",`${-12+n()*24}deg`);break;case"fractal":e.style.setProperty("--x",`${6+n()*82}%`),e.style.setProperty("--y",`${20+n()*70}%`),e.style.setProperty("--angle",`${-160+n()*320}deg`);break}}function lc(e,t){const a=JSON.stringify(e.controls[0]?.key??""),n=JSON.stringify(e.controls[1]?.key??""),s=JSON.stringify(e.controls[2]?.key??""),i=e.controls[0]?.defaultValue??100,r=e.controls[1]?.defaultValue??100,o=e.controls[2]?.defaultValue??100;return`function ${t}(effect,root){const layer=aeCreateLayer(effect,root),random=aeCreateSeededRandom(effect.seed),s=effect.settings,custom=s.custom||{},cv=(k,d)=>Number.isFinite(Number(custom[k]))?Number(custom[k]):d,density=Math.max(0,Math.min(400,s.density)),speed=Math.max(.1,s.speed/100),power=Math.max(.15,Math.max(0,Math.min(400,s.intensity))/100),c1=cv(${a},${i})/100,c2=cv(${n},${r})/100,c3=cv(${s},${o})/100,count=Math.max(1,Math.round(${e.count}*density/100*(.8+c1*.2)));for(let i=0;i<count;i++){const node=document.createElement("span");node.className="ae-p09 ae-p09-${e.kind}";node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(random()*100)+"%");node.style.setProperty("--size",(12+random()*86)+"px");node.style.setProperty("--angle",(random()*360)+"deg");node.style.setProperty("--duration",((2.6+random()*6.8)/speed)+"s");node.style.setProperty("--delay",(-random()*9)+"s");node.style.setProperty("--power",String(power));node.style.setProperty("--c1",String(c1));node.style.setProperty("--c2",String(c2));node.style.setProperty("--c3",String(c3));node.style.setProperty("--orbit",(32+random()*220*c2)+"px");node.style.setProperty("--spin",(((random()>.5?1:-1)*(220+random()*620*c3)))+"deg");const kind=${JSON.stringify(e.kind)};if(kind==="burst"){node.style.setProperty("--x",(10+random()*80)+"%");node.style.setProperty("--y",(12+random()*64)+"%");}else if(kind==="bolt"||kind==="storm-bolt"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(-6+random()*20)+"%");}else if(kind==="gear"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(44+random()*110*c2)+"px");}else if(kind==="liquid"){node.style.setProperty("--x",(6+random()*88)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(70+random()*150*c2)+"px");}else if(kind==="gravity"||kind==="black-hole"||kind==="galaxy"||kind==="magnetic"||kind==="tunnel"||kind==="orbit-rings"){node.style.setProperty("--x","50%");node.style.setProperty("--y","50%");if(kind==="tunnel")node.style.setProperty("--size",(55+i*8*c2)+"px");if(kind==="orbit-rings")node.style.setProperty("--size",(80+random()*180*c2)+"px");}else if(kind==="scanline"){node.style.setProperty("--x","0%");node.style.setProperty("--y",((i/Math.max(1,count))*100)+"%");}else if(kind==="laser-grid"){node.style.setProperty("--x","0%");node.style.setProperty("--y",(8+(i%14)*6.5)+"%");node.style.setProperty("--angle",(i%2===0?0:90)+"deg");}else if(kind==="hud"){node.style.setProperty("--x",(5+(i%10)*10)+"%");node.style.setProperty("--y",(7+Math.floor(i/10)*16)+"%");}else if(kind==="city"){node.style.setProperty("--x",((i/Math.max(1,count))*105-2)+"%");node.style.setProperty("--y","100%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="ember"){node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(80+random()*25)+"%");node.style.setProperty("--size",(5+random()*11)+"px");}else if(kind==="dust"||kind==="plankton"){node.style.setProperty("--size",(3+random()*10*c1)+"px");}else if(kind==="rays"){node.style.setProperty("--x",(5+random()*90)+"%");node.style.setProperty("--y","-20%");}else if(kind==="ripple"){node.style.setProperty("--x",(12+random()*76)+"%");node.style.setProperty("--y",(12+random()*76)+"%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="shards"){node.style.setProperty("--size",(24+random()*58*c1)+"px");}else if(kind==="aurora"){node.style.setProperty("--x",(-10+random()*100)+"%");node.style.setProperty("--y","0%");}else if(kind==="data"){node.style.setProperty("--x",(-20+random()*10)+"%");node.style.setProperty("--y",(5+random()*90)+"%");}else if(kind==="caustics"){node.style.setProperty("--size",(90+random()*170)+"px");}else if(kind==="ember-ribbon"){node.style.setProperty("--x",(-25+random()*15)+"%");node.style.setProperty("--y",(6+random()*88)+"%");}layer.appendChild(node);}}`}function dc(e){const t=oc(e.id),a=Object.fromEntries(e.controls.map(n=>[n.key,n.defaultValue]));return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...rt,opacity:e.opacity??rt.opacity,density:e.density??rt.density,speed:e.speed??rt.speed,intensity:e.intensity??rt.intensity,brightness:e.brightness??rt.brightness,custom:a},capabilities:sc,customControls:e.controls,performanceCost:e.cost,requiresJavaScript:!0},css:ic,streamElementsRendererName:t,renderPreview(n,s,i){for(let r=0,o=En(e,s);r<o;r++){const c=document.createElement("span");cc(c,r,s,i,e),n.appendChild(c)}},streamElementsRendererSource:lc(e,t),estimateDomNodes(n){return En(e,n)}}}const pc=rc.map(dc),uc=[...xo,...$o,...Oo,...Ho,...nc,...pc],ha=Array.from(new Map(uc.map(e=>[e.definition.id,e])).values()),pr=new Map(ha.map(e=>[e.definition.id,e]));Object.fromEntries(ha.map(e=>[e.definition.id,e.definition]));function Le(e){return pr.get(e)}function ze(e){return pr.get(e)?.definition}function It(){return ha.map(e=>e.definition)}function fc(){return[...ha]}const Dt={delayMs:0,durationMs:8e3,fadeInMs:500,fadeOutMs:500},Tt=(e,t,a,n)=>{const s=typeof e=="number"?e:Number(e);return Math.round(Math.max(a,Math.min(n,Number.isFinite(s)?s:t)))};function ga(e){const t=e&&typeof e=="object"&&!Array.isArray(e)?e:{},a=Tt(t.durationMs,Dt.durationMs,250,12e4),n=Tt(t.fadeInMs,Dt.fadeInMs,0,a);return{mode:t.mode==="once"||t.mode==="loop"?t.mode:"off",delayMs:Tt(t.delayMs,Dt.delayMs,0,6e4),durationMs:a,fadeInMs:n,fadeOutMs:Tt(t.fadeOutMs,Dt.fadeOutMs,0,a-n)}}function mc(e){return"ae-timeline-"+(e.instanceId.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80)||"layer")}function Ga(e){const t=ga(e.timeline);if(!e.timeline||t.mode==="off")return null;const a=t.delayMs+t.durationMs,n=t.delayMs,s=a,i=n+t.fadeInMs,r=s-t.fadeOutMs,o=[],c=(h,f)=>{o.push({ms:h,opacity:f})};n>0&&c(0,0),t.fadeInMs>0?(c(n,0),c(i,1)):(n>0&&c(n-Math.min(n,1),0),c(n,1)),t.fadeOutMs>0?(c(r,1),c(s,0)):(c(s-Math.min(t.durationMs,1),1),c(s,0));const l=new Map;for(const h of o)l.set(h.ms,h.opacity);const d=[...l].sort(([h],[f])=>h-f).map(([h,f])=>`${Number((h/a*100).toFixed(6))}% { opacity: ${f}; }`).join(`
  `),p=mc(e);return{css:`@keyframes ${p} {
  ${d}
}`,animation:`${p} ${a}ms linear 0ms ${t.mode==="loop"?"infinite":"1"} normal both`}}const ea=16,vt={x:[-300,300],y:[-300,300],scale:[10,400],rotation:[-1080,1080],opacity:[0,100]};function Ye(e,t,a,n){const s=typeof e=="number"?e:Number(e);return Number.isFinite(s)?Math.max(a,Math.min(n,s)):t}function Ha(e,t){return{x:Ye(e.x,t.x,...vt.x),y:Ye(e.y,t.y,...vt.y),scale:Ye(e.scale,t.scale,...vt.scale),rotation:Ye(e.rotation,t.rotation,...vt.rotation),opacity:Ye(e.opacity,100,...vt.opacity)}}function Ya(e,t,a){if(!Array.isArray(e))return[];const n=new Map;for(const s of e.slice(0,256)){if(!s||typeof s!="object"||Array.isArray(s))continue;const i=s;if(typeof i.timeMs!="number"||!Number.isFinite(i.timeMs))continue;const r=Math.round(Ye(i.timeMs,0,0,t));n.set(r,{timeMs:r,...Ha(i,a)})}return[...n.values()].sort((s,i)=>s.timeMs-i.timeMs).slice(0,ea)}function ve(e,t){const a=ga(e),n=e&&typeof e=="object"&&!Array.isArray(e)?e:{};return{...a,easing:n.easing==="ease-in-out"?"ease-in-out":"linear",keyframes:Ya(n.keyframes,a.durationMs,t)}}function yc(e,t,a,n){const s=Ya(e.keyframes,e.durationMs,n),i={timeMs:Math.round(Ye(t,0,0,e.durationMs)),...Ha(a,n)},r=s.findIndex(o=>o.timeMs===i.timeMs);return r>=0?s[r]=i:s.length<ea&&s.push(i),s.sort((o,c)=>o.timeMs-c.timeMs)}function hc(e){return`translate(${e.x}%, ${e.y}%) scale(${e.scale/100}) rotate(${e.rotation}deg)`}function Ja(e){const t=ve(e.timeline,e.settings),a=t.keyframes??[];if(t.mode==="off"||a.length===0)return null;const n=t.delayMs+t.durationMs,s=Ha({},e.settings),i=[...a];if(i[0]?.timeMs!==0&&i.unshift({timeMs:0,...s}),i.at(-1)?.timeMs!==t.durationMs){const d=i.at(-1)??{timeMs:0,...s};i.push({...d,timeMs:t.durationMs})}const r=new Map;t.delayMs>0&&r.set(0,i[0]);for(const d of i)r.set(t.delayMs+d.timeMs,d);const o=[...r.entries()].sort(([d],[p])=>d-p).map(([d,p])=>`${Number((d/n*100).toFixed(6))}% { transform: ${hc(p)}; opacity: ${p.opacity/100}; }`).join(`
  `);let c=2166136261;for(const d of e.instanceId)c=Math.imul(c^d.charCodeAt(0),16777619);const l=`ae-motion-${(c>>>0).toString(36)}`;return{css:`@keyframes ${l} {
  ${o}
}`,animation:`${l} ${n}ms ${t.easing} 0ms ${t.mode==="loop"?"infinite":"1"} normal both`}}const gc=new Set(["static-cdn.jtvnw.net","yt3.googleusercontent.com","lh3.googleusercontent.com","cdn.streamelements.com","static-cdn.streamelements.com"]);function bc(e){if(typeof e!="string"||e.length>500)return null;try{const t=new URL(e);return t.protocol!=="https:"||!gc.has(t.hostname.toLowerCase())||t.username||t.password||t.port?null:t.href}catch{return null}}function wc(e){if(!e||typeof e!="object"||Array.isArray(e))return null;const t=e,a=t.data&&typeof t.data=="object"&&!Array.isArray(t.data)?t.data:{},n=[a.avatar,a.avatarUrl,a.profileImage,t.avatar,t.avatarUrl,t.profileImage];for(const s of n){const i=bc(s);if(i)return i}return null}function kc(e,t,a,n){const s=document.createElement("span");s.className="ae-alert-avatar",s.style.position="absolute",s.style.left="0",s.style.top="50%",s.style.transform="translateY(-50%)",s.style.width=n+"px",s.style.height=n+"px",s.style.borderRadius="50%",s.style.overflow="hidden",s.style.display="grid",s.style.placeItems="center",s.style.fontSize=Math.round(n*.48)+"px",s.style.background="rgba(25,45,78,.85)",s.style.border="2px solid rgba(255,255,255,.7)",s.style.color="#ffffff",s.style.boxSizing="border-box",s.textContent=Array.from(a.trim())[0]?.toLocaleUpperCase()??"?";const i=wc(t);if(i){const r=document.createElement("img");r.src=i,r.alt="",r.referrerPolicy="no-referrer",r.loading="eager",r.decoding="async",r.style.position="absolute",r.style.inset="0",r.style.width="100%",r.style.height="100%",r.style.objectFit="cover",s.appendChild(r)}e.style.paddingLeft=n+14+"px",e.style.boxSizing="border-box",e.style.minHeight=n+"px",e.appendChild(s)}const Va=["slide","fade","pop","zoom","bounce","drop","blur"],Ka=["fade","slide","pop","zoom","drop","blur"],ur=`
@keyframes ae-caption-in-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ae-caption-in-slide {
  from { opacity: 0; translate: 0 18px; }
  to { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-pop {
  from { opacity: 0; scale: .78; }
  to { opacity: 1; scale: 1; }
}
@keyframes ae-caption-in-zoom {
  from { opacity: 0; scale: 1.8; }
  to { opacity: 1; scale: 1; }
}
@keyframes ae-caption-in-bounce {
  0% { opacity: 0; translate: 0 48px; }
  60% { opacity: 1; translate: 0 -10px; }
  82% { translate: 0 4px; }
  100% { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-drop {
  from { opacity: 0; translate: 0 -64px; }
  to { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-blur {
  from { opacity: 0; filter: blur(14px); }
  to { opacity: 1; filter: blur(0); }
}
@keyframes ae-caption-out-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes ae-caption-out-slide {
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 -18px; }
}
@keyframes ae-caption-out-pop {
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: .78; }
}
@keyframes ae-caption-out-zoom {
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: 1.5; }
}
@keyframes ae-caption-out-drop {
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 64px; }
}
@keyframes ae-caption-out-blur {
  from { opacity: 1; filter: blur(0); }
  to { opacity: 0; filter: blur(14px); }
}
@keyframes ae-letter-wave {
  0%, 100% { translate: 0 0; }
  45% { translate: 0 -0.35em; }
}
@keyframes ae-letter-type {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ae-letter-pop {
  0% { opacity: 0; scale: .2; }
  70% { opacity: 1; scale: 1.25; }
  100% { opacity: 1; scale: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ae-alert-caption, .ae-alert-letter { animation: none !important; }
}
`.trim(),vc=120;function fr(e){return Number.isFinite(e)?Math.max(300,Math.min(18e4,Math.round(e))):4e3}function xc(e,t,a){const n=fr(a),s=Math.min(420,Math.max(120,Math.round(n*.22))),i=Math.min(420,Math.max(120,Math.round(n*.22)));return`ae-caption-in-${e} ${s}ms ease-out 0ms both, ae-caption-out-${t} ${i}ms ease-in ${Math.max(0,n-i)}ms forwards`}function zc(e,t){return e<=1?0:Math.max(12,Math.min(60,Math.floor(fr(t)*.45/e)))}function Sc(e,t,a){const n=t*a;return e==="typewriter"?`ae-letter-type 1ms linear ${n}ms both`:e==="pop"?`ae-letter-pop 360ms cubic-bezier(.2,.7,.3,1.4) ${n}ms both`:`ae-letter-wave 640ms ease-in-out ${n+200}ms both`}const mr=["default","system","impact","trebuchet","verdana","georgia","mono","comic"],yr=["shadow","outline","glow","none"],hr=["none","box","pill"],gr=["none","wave","typewriter","pop"],Mc={system:'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',impact:'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',trebuchet:'"Trebuchet MS", Tahoma, sans-serif',verdana:"Verdana, Geneva, sans-serif",georgia:'Georgia, "Times New Roman", serif',mono:'"Cascadia Mono", Consolas, "Courier New", monospace',comic:'"Comic Sans MS", "Comic Neue", cursive'},We={enabled:!1,template:"{name} · {amount}",position:"bottom",xPercent:50,yPercent:75,fontSize:48,color:"#ffffff",intro:"slide",outro:"fade",avatarEnabled:!1,avatarSize:72,subtitle:"",font:"default",effect:"shadow",background:"none",backgroundColor:"#0f172a",backgroundOpacity:70,letters:"none",imageUrl:"",imageSize:160};function br(e){if(typeof e!="string"||e.length>500)return"";let t;try{t=new URL(e.trim())}catch{return""}return t.protocol!=="https:"||t.username||t.password?"":t.href}const st=(e,t,a)=>typeof e=="string"&&t.includes(e)?e:a,Cn=(e,t)=>typeof e=="string"?e.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,160):t,Pn=/^#[\da-fA-F]{6}$/;function ba(e){const t=e&&typeof e=="object"&&!Array.isArray(e)?e:{},a=typeof t.fontSize=="number"?t.fontSize:Number(t.fontSize),n=Number(t.backgroundOpacity);return{enabled:t.enabled===!0,template:Cn(t.template,We.template),position:t.position==="top"||t.position==="center"||t.position==="custom"?t.position:"bottom",xPercent:Number.isFinite(Number(t.xPercent))?Math.max(25,Math.min(75,Math.round(Number(t.xPercent)))):50,yPercent:Number.isFinite(Number(t.yPercent))?Math.max(10,Math.min(90,Math.round(Number(t.yPercent)))):75,fontSize:Number.isFinite(a)?Math.round(Math.max(14,Math.min(120,a))):We.fontSize,color:typeof t.color=="string"&&Pn.test(t.color)?t.color:We.color,intro:st(t.intro,Va,"slide"),outro:st(t.outro,Ka,"fade"),avatarEnabled:t.avatarEnabled===!0,avatarSize:Number.isFinite(Number(t.avatarSize))?Math.max(32,Math.min(144,Math.round(Number(t.avatarSize)))):72,subtitle:Cn(t.subtitle,""),font:st(t.font,mr,"default"),effect:st(t.effect,yr,"shadow"),background:st(t.background,hr,"none"),backgroundColor:typeof t.backgroundColor=="string"&&Pn.test(t.backgroundColor)?t.backgroundColor:We.backgroundColor,backgroundOpacity:t.backgroundOpacity!==void 0&&Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):We.backgroundOpacity,letters:st(t.letters,gr,"none"),imageUrl:br(t.imageUrl),imageSize:Number.isFinite(Number(t.imageSize))&&t.imageSize!==null&&t.imageSize!==""?Math.max(40,Math.min(400,Math.round(Number(t.imageSize)))):160}}function wr(e,t){const a=t&&typeof t=="object"&&!Array.isArray(t)?t:{},n=a.data&&typeof a.data=="object"&&!Array.isArray(a.data)?a.data:{},s=(o,c)=>typeof o=="string"||typeof o=="number"&&Number.isFinite(o)?String(o).replace(/[\u0000-\u001f\u007f]/g," ").slice(0,c):"",i=s(e==="message"?n.displayName??n.nick??a.name:a.name??a.sender,60),r=s(e==="message"?n.text??(n.snippet&&typeof n.snippet=="object"?n.snippet.displayMessage:void 0)??a.text:a.message,180);return{name:i||"Widz",amount:s(a.amount,32),message:r,event:e}}function ta(e,t,a){const n=wr(t,a);return(typeof e=="string"?e.slice(0,160):"").replace(/\{(name|amount|message|event)\}/g,(i,r)=>n[r]??"").slice(0,280)}function Ec(e,t){return e==="none"?"none":e==="outline"?"-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 8px rgba(0,0,0,.85)":e==="glow"?"0 0 2px rgba(0,0,0,.9), 0 0 10px "+t+", 0 0 28px "+t:"0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)"}function Cc(e,t){const a=parseInt(e.slice(1),16);return"rgba("+(a>>16&255)+", "+(a>>8&255)+", "+(a&255)+", "+Math.round(t)/100+")"}function Pc(e,t,a,n){const s=Array.from(t);if(a==="none"||s.length>vc){e.textContent=t;return}const i=zc(s.filter(o=>o.trim()!=="").length,n);let r=0;for(const o of t.split(/(\s+)/)){if(!o)continue;if(!o.trim()){e.appendChild(document.createTextNode(o));continue}const c=document.createElement("span");c.className="ae-alert-word",c.style.display="inline-block",c.style.whiteSpace="nowrap";for(const l of Array.from(o)){const d=document.createElement("span");d.className="ae-alert-letter",d.style.display="inline-block",d.style.animation=Sc(a,r++,i),d.textContent=l,c.appendChild(d)}e.appendChild(c)}}function jc(e,t,a,n,s=4e3){if(!t||!t.enabled)return null;const i=document.createElement("div");i.className="ae-alert-caption",i.style.animation=xc(t.intro??"slide",t.outro??"fade",s);const r=ta(t.template,a,n),o=t.subtitle?ta(t.subtitle,a,n).trim():"",c=t.letters??"none",l=t.background??"none",d=typeof t.imageUrl=="string"&&t.imageUrl.slice(0,8).toLowerCase()==="https://"?t.imageUrl:"";if(!o&&c==="none"&&l==="none"&&!d)i.textContent=r;else{const p=document.createElement("span");if(p.className="ae-alert-caption-box",p.style.display="inline-block",p.style.maxWidth="100%",l!=="none"&&(p.style.background=Cc(t.backgroundColor??"#0f172a",t.backgroundOpacity??70),p.style.padding=".3em .75em",p.style.borderRadius=l==="pill"?"999px":".3em"),d){const f=document.createElement("img");f.className="ae-alert-image",f.src=d,f.alt="",f.style.display="block",f.style.height=(t.imageSize??160)+"px",f.style.width="auto",f.style.maxWidth="100%",f.style.margin="0 auto .2em",f.style.objectFit="contain",p.appendChild(f)}const h=document.createElement("span");if(h.className="ae-alert-caption-title",h.style.display="block",Pc(h,r,c,s),p.appendChild(h),o){const f=document.createElement("span");f.className="ae-alert-caption-subtitle",f.style.display="block",f.style.fontSize=".55em",f.style.fontWeight="600",f.style.marginTop=".25em",f.textContent=o,p.appendChild(f)}i.appendChild(p)}return i.style.position="absolute",i.style.left="5%",i.style.width="90%",i.style.maxWidth="90%",i.style.textAlign="center",i.style.whiteSpace="pre-wrap",i.style.overflowWrap="anywhere",i.style.pointerEvents="none",i.style.color=t.color,i.style.fontSize=t.fontSize+"px",i.style.fontWeight="700",i.style.lineHeight="1.2",i.style.textShadow=Ec(t.effect??"shadow",t.color),t.font&&t.font!=="default"&&(i.style.fontFamily=Mc[t.font]),t.position==="custom"?(i.style.left=(t.xPercent??50)+"%",i.style.top=(t.yPercent??75)+"%",i.style.width="48%",i.style.transform="translate(-50%, -50%)"):t.position==="top"?i.style.top="8%":t.position==="center"?(i.style.top="50%",i.style.transform="translateY(-50%)"):i.style.bottom="8%",t.avatarEnabled&&kc(i,n,wr(a,n).name,t.avatarSize??72),e.appendChild(i),i}const ht=[{value:"follower-latest",label:"Nowy obserwujący"},{value:"subscriber-latest",label:"Nowa subskrypcja"},{value:"tip-latest",label:"Donacja (tip)"},{value:"cheer-latest",label:"Cheer / bits"},{value:"raid-latest",label:"Raid"},{value:"message",label:"Wiadomość na czacie"}],_c=new Set(ht.map(e=>e.value)),Ht=(e,t,a)=>{const n=typeof e=="number"?e:Number(e);return Number.isFinite(n)?Math.max(0,Math.min(a,Math.round(n))):t};function kr(e){if(typeof e!="string"||e.length>500)return null;let t;try{t=new URL(e.trim())}catch{return null}return t.protocol!=="https:"||t.username||t.password?null:t.href}function vr(e){if(e)try{const t=new Audio(e.url);t.volume=Math.max(0,Math.min(1,e.volume/100)),t.play().catch(()=>{})}catch{}}function $c(e){if(!e||typeof e!="object"||Array.isArray(e))return;const t=e,a=kr(t.url);return a?{url:a,volume:Ht(t.volume,70,100)}:void 0}function $e(e){if(!e||typeof e!="object"||Array.isArray(e))return;const t=e;if(t.source!=="event")return;const a=$c(t.sound);return{source:"event",event:_c.has(String(t.event))?t.event:"follower-latest",cooldownMs:Ht(t.cooldownMs,3e3,6e4),minAmount:Ht(t.minAmount,0,1e6),caption:t.caption===void 0?void 0:ba(t.caption),queueMode:t.queueMode==="queue"?"queue":"replace",priority:Ht(t.priority,5,10),...a?{sound:a}:{}}}function Qa(e){return $e(e.trigger)?.source==="event"}function xr(e){return Qa(e)?{...e,timeline:{...ve(e.timeline,e.settings),mode:"once"}}:e}function _t(e){const t=ve(e.timeline,e.settings);return Math.min(18e4,t.delayMs+t.durationMs+100)}function Rc(e,t,a,n){const s=$e(e);if(!s||t!==s.event||n<s.cooldownMs)return!1;if(s.minAmount>0&&(t==="tip-latest"||t==="cheer-latest"||t==="raid-latest")){if(!a||typeof a!="object")return!1;const i=Number(a.amount);if(!Number.isFinite(i)||i<s.minAmount)return!1}return!0}const J={resolution:{width:1920,height:1080},backgroundOnly:!0,palette:{accent1:"#7c5cff",accent2:"#00d9ff",accent3:"#ff4fb0",background1:"#080b12",background2:"#101827"},background:{mode:"gradient",angle:145,lightX:50,lightY:40,hue:0,saturation:1,brightness:1,contrast:1,noise:0,vignette:.2},focusZone:"none",safeZone:"off",effects:[],selectedEffectInstanceId:null,activePresetId:null},Aa=new Set,Xe=[],gt=[],Ic=100;let Qe=null;const tt=e=>structuredClone(e),zr=(e,t)=>JSON.stringify(e)===JSON.stringify(t),At=()=>Aa.forEach(e=>e(J));function Sr(e,t){Xe.push({label:e,snapshot:t}),Xe.length>Ic&&Xe.shift(),gt.length=0}function ke(e,t){const a=Qe?null:tt(J);t(),a&&!zr(a,J)&&Sr(e,a),At()}function he(){return J}function Mr(e){return Aa.add(e),()=>Aa.delete(e)}function en(e){Qe||(Qe={label:e,before:tt(J)})}function tn(){if(!Qe)return;const e=Qe;Qe=null,zr(e.before,J)||(Sr(e.label,e.before),At())}function Ac(){Xe.length=0,gt.length=0,Qe=null}function Nc(){return Xe.length>0}function Lc(){return gt.length>0}function jn(){return Xe.at(-1)?.label??null}function _n(){return gt.at(-1)?.label??null}function Er(){const e=Xe.pop();e&&(gt.push({label:e.label,snapshot:tt(J)}),Object.assign(J,tt(e.snapshot)),At())}function Cr(){const e=gt.pop();e&&(Xe.push({label:e.label,snapshot:tt(J)}),Object.assign(J,tt(e.snapshot)),At())}function an(e){const t=ze(e);if(!t)return console.warn(`Unknown effect: ${e}`),null;let a=null;return ke(`Dodaj ${t.name}`,()=>{const n={instanceId:crypto.randomUUID(),effectId:e,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...t.defaultSettings},locked:!1,groupId:null};J.effects.push(n),J.selectedEffectInstanceId=n.instanceId,J.activePresetId=null,a=n}),a}function Dc(e,t=!1){const a=J.effects.find(s=>s.instanceId===e);if(!a)return null;let n=null;return ke(`Duplikuj ${a.label??a.effectId}`,()=>{const s=J.effects.indexOf(a),i={...structuredClone(a),instanceId:crypto.randomUUID(),seed:t?a.seed:Math.floor(Math.random()*4294967295),locked:!1};J.effects.splice(s+1,0,i),J.selectedEffectInstanceId=i.instanceId,n=i}),n}function Pr(e,t=!1){const a=J.effects.findIndex(s=>s.instanceId===e);if(a<0)return!1;const n=J.effects[a];return n?.locked&&!t?!1:(ke(`Usuń ${n?.label??n?.effectId??"warstwę"}`,()=>{J.effects.splice(a,1),J.selectedEffectInstanceId===e&&(J.selectedEffectInstanceId=J.effects.at(-1)?.instanceId??null)}),!0)}function Tc(e=!1){ke("Wyczyść scenę",()=>{J.effects=e?[]:J.effects.filter(a=>a.locked);const t=new Set(J.effects.map(a=>a.instanceId));J.selectedEffectInstanceId&&!t.has(J.selectedEffectInstanceId)&&(J.selectedEffectInstanceId=J.effects.at(-1)?.instanceId??null),J.activePresetId=null})}function jr(e){J.effects.some(t=>t.instanceId===e)&&(J.selectedEffectInstanceId=e,At())}function Oc(e){const t=J.effects.find(a=>a.instanceId===e);t&&ke(`${t.enabled?"Wyłącz":"Włącz"} ${t.label??t.effectId}`,()=>{t.enabled=!t.enabled})}function qc(e){const t=J.effects.find(a=>a.instanceId===e);t&&ke(`${t.locked?"Odblokuj":"Zablokuj"} ${t.label??t.effectId}`,()=>{t.locked=!t.locked})}function _r(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=t.trim().slice(0,80);ke("Zmień nazwę warstwy",()=>{a.label=n||void 0})}function Fc(e){const t=J.effects.findIndex(s=>s.instanceId===e),a=J.effects[t];if(t<0||t===J.effects.length-1||a?.locked)return;const n=J.effects[t+1];!n||n.locked||ke("Przenieś warstwę wyżej",()=>{J.effects[t+1]=J.effects[t],J.effects[t]=n})}function Bc(e){const t=J.effects.findIndex(s=>s.instanceId===e),a=J.effects[t];if(t<=0||a?.locked)return;const n=J.effects[t-1];!n||n.locked||ke("Przenieś warstwę niżej",()=>{J.effects[t-1]=J.effects[t],J.effects[t]=n})}function Wc(e,t){if(e===t)return;const a=J.effects.find(s=>s.instanceId===e),n=J.effects.find(s=>s.instanceId===t);!a||!n||a.locked||n.locked||ke("Zmień kolejność warstw",()=>{J.effects.splice(J.effects.indexOf(a),1);const s=J.effects.indexOf(n);J.effects.splice(s+1,0,a)})}function Mt(){const e=J.selectedEffectInstanceId;return e?J.effects.find(t=>t.instanceId===e)??null:null}function Se(e,t){const a=J.effects.find(n=>n.instanceId===e);a&&ke(`Zmień ${a.label??a.effectId}`,()=>{a.settings={...a.settings,...t},J.activePresetId=null})}function $t(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=ve({...a.timeline,...t},a.settings);ke("Zmień czas animacji",()=>{a.timeline=n,J.activePresetId=null})}function aa(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=$e(t);ke("Zmień wyzwalacz warstwy",()=>{a.trigger=n,n&&(a.timeline=ve({...a.timeline,mode:"once"},a.settings)),J.activePresetId=null})}function Uc(e,t){const a=J.effects.find(c=>c.instanceId===e);if(!a)return;const n=ve(a.timeline,a.settings),r=[...n.keyframes??[]].reverse().find(c=>c.timeMs<=t)??{...a.settings,opacity:100},o=yc(n,t,r,a.settings);ke("Dodaj klatkę kluczową",()=>{a.timeline={...n,mode:n.mode==="off"?"once":n.mode,keyframes:o},J.activePresetId=null})}function Ot(e,t,a){const n=J.effects.find(c=>c.instanceId===e);if(!n)return;const s=ve(n.timeline,n.settings),i=(s.keyframes??[]).find(c=>c.timeMs===t);if(!i)return;const r=Math.max(0,Math.min(s.durationMs,Math.round(a.timeMs??t)));if((s.keyframes??[]).some(c=>c.timeMs===r&&c.timeMs!==t))return;const o=Ya([...(s.keyframes??[]).filter(c=>c.timeMs!==t),{...i,...a}],s.durationMs,n.settings);ke("Edytuj klatkę kluczową",()=>{n.timeline={...s,keyframes:o},J.activePresetId=null})}function Xc(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=ve(a.timeline,a.settings);(n.keyframes??[]).some(s=>s.timeMs===t)&&ke("Usuń klatkę kluczową",()=>{a.timeline={...n,keyframes:(n.keyframes??[]).filter(s=>s.timeMs!==t)},J.activePresetId=null})}function $r(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=Math.max(0,Math.min(4294967295,Math.floor(t)));ke("Zmień seed",()=>{a.seed=n})}function Zc(e){$r(e,Math.floor(Math.random()*4294967295))}function Gc(){ke("Losuj wszystkie seedy",()=>J.effects.forEach(e=>{e.seed=Math.floor(Math.random()*4294967295)}))}function nn(e,t="Wczytaj scenę"){const a=tt(e);ke(t,()=>Object.assign(J,a))}function Hc(e,t="Zastosuj preset sceny"){ke(t,()=>{const a=[];for(const n of e){const s=ze(n.effectId);s&&a.push({instanceId:crypto.randomUUID(),effectId:s.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...s.defaultSettings,...n.settings},locked:!1,groupId:null})}J.effects=a,J.selectedEffectInstanceId=a.at(-1)?.instanceId??null,J.activePresetId=null})}function Yc(e){const t=e.filter(a=>a.enabled).reduce((a,n)=>{const s=ga(n.timeline);return s.mode==="off"?a:Math.max(a,s.delayMs+s.durationMs)},0);return Math.max(1e4,Math.min(18e4,t))}function Yt(e,t){return!Number.isFinite(e)||!Number.isFinite(t)||t<=0?0:Math.max(0,Math.min(Math.round(t),Math.round(e)))}function Jc(e,t,a,n,s=100){if(![e,t,a,n].every(Number.isFinite)||a<=0||n<=0)return 0;const i=Math.max(0,Math.min(1,(e-t)/a))*n,r=Math.max(1,Math.round(s));return Yt(Math.round(i/r)*r,n)}function Vc(e,t){const a=document.createElement("section");a.className="ae-preview-transport",a.setAttribute("aria-label","Sterowanie odtwarzaniem podglądu"),a.innerHTML=`
    <div class="ae-transport-buttons">
      <button type="button" class="ae-button ae-button-secondary" data-transport-play aria-label="Wstrzymaj podgląd">⏸ Pauza</button>
      <button type="button" class="ae-button ae-button-secondary" data-transport-restart title="Odtwórz od zera">↺ Od początku</button>
      <output data-transport-position aria-live="off">0.0 / 10.0 s</output>
    </div>
    <input data-transport-seek type="range" min="0" max="10000" step="50" value="0"
      aria-label="Przewiń podgląd do wybranego momentu" />
    <div class="ae-transport-description">Przeciągnij suwak, aby zobaczyć klatkę. Odtwarzanie nie zmienia sceny ani eksportu.</div>
  `,t.appendChild(a);const n=a.querySelector("[data-transport-play]"),s=a.querySelector("[data-transport-seek]"),i=a.querySelector("[data-transport-position]");let r=!0,o=0,c=1e4,l=null,d=!1;const p=()=>e.getAnimations({subtree:!0}),h=()=>{document.dispatchEvent(new CustomEvent("animated-effects:transport-state",{detail:{playing:r,cursorMs:o,durationMs:c}}))},f=()=>{s.max=String(c),s.value=String(Yt(o,c)),i.value=`${(o/1e3).toFixed(1)} / ${(c/1e3).toFixed(1)} s`,n.textContent=r?"⏸ Pauza":"▶ Odtwórz",n.setAttribute("aria-label",r?"Wstrzymaj podgląd":"Odtwórz podgląd")},g=()=>{for(const C of p())try{C.pause(),C.currentTime=o,r&&C.play()}catch(A){console.debug("Animated Effects: animation not seekable",A)}},m=C=>{r!==C&&(r=C,r&&o>=c&&(o=0),l=null,g(),f(),h())},b=C=>{o=Yt(C,c),l=null,g(),f(),h()},w=()=>{b(0),m(!0)},k=C=>{r&&!d?(l!==null&&(o=Math.min(c,o+Math.max(0,C-l))),l=C,o>=c&&(r=!1,g(),h()),f()):l=null,requestAnimationFrame(k)};s.addEventListener("pointerdown",()=>{d=!0,m(!1)});const x=()=>{d=!1};s.addEventListener("pointerup",x),s.addEventListener("pointercancel",x),s.addEventListener("blur",x),s.addEventListener("input",()=>{m(!1),b(Number(s.value))}),n.addEventListener("click",()=>m(!r)),a.querySelector("[data-transport-restart]")?.addEventListener("click",()=>w()),document.addEventListener("animated-effects:replay-preview",()=>w()),document.addEventListener("animated-effects:transport-toggle",()=>m(!r)),document.addEventListener("animated-effects:preview-seek",C=>{const A=C.detail?.ms;typeof A!="number"||!Number.isFinite(A)||(m(!1),b(A))});const M=()=>{c=Yc(he().effects),o=Yt(o,c),g(),f()};return f(),requestAnimationFrame(k),{afterRender:M,replay:w,seek:b}}const Kc=16,$n=60;class Qc{queue=[];current=null;lastById=new Map;lines=[];sequence=0;counters={accepted:0,started:0,completed:0,dropped:0,evicted:0};reset(){this.queue=[],this.current=null,this.lastById.clear(),this.lines=[],this.sequence=0,this.counters={accepted:0,started:0,completed:0,dropped:0,evicted:0}}getSnapshot(){return{current:this.current,waiting:[...this.queue],counters:{...this.counters},lines:[...this.lines]}}dispatch(t,a,n,s){const i=[],r={amount:n};for(const o of t){if(!o.enabled)continue;const c=$e(o.trigger);if(!c||c.event!==a)continue;const l=c.priority??5,d=this.lastById.get(o.instanceId),p=d===void 0?1/0:s-d,h={instanceId:o.instanceId,event:a,priority:l,effect:o};if(!Rc(c,a,r,p)){const g=p<c.cooldownMs?"cooldown":"below-threshold";this.counters.dropped++,this.log("dropped",g,h);continue}if(c.queueMode!=="queue"){this.lastById.set(o.instanceId,s),this.counters.accepted++,this.counters.started++,this.log("started","started",h),i.push(h);continue}const f=this.queue.findIndex(g=>g.priority<l);if(this.queue.length>=Kc){if(f<0){this.counters.dropped++,this.log("dropped","queue-full",h);continue}const g=this.queue.pop();g&&(this.counters.evicted++,this.log("evicted","lower-priority",g))}if(f<0?this.queue.push(h):this.queue.splice(f,0,h),this.counters.accepted++,this.lastById.set(o.instanceId,s),this.log("accepted","accepted",h),!this.current){const g=this.startNext();g&&i.push(g)}}return i}finishCurrent(){return this.current&&(this.counters.completed++,this.log("completed","completed",this.current),this.current=null),this.startNext()}startNext(){const t=this.queue.shift();return t?(this.current=t,this.counters.started++,this.log("started","started",t),t):null}log(t,a,n){this.lines.unshift({sequence:++this.sequence,action:t,reason:a,instanceId:n.instanceId,event:n.event,priority:n.priority,waiting:this.queue.length}),this.lines.length>$n&&(this.lines.length=$n)}}const Rn={steady:[{event:"message",everyMs:1100,amount:0,startMs:600},{event:"follower-latest",everyMs:3500,amount:0,startMs:1700},{event:"tip-latest",everyMs:9e3,amount:50,startMs:4500}],burst:[{event:"message",everyMs:330,amount:0,startMs:1700},{event:"follower-latest",everyMs:1100,amount:0,startMs:2100},{event:"tip-latest",everyMs:2600,amount:100,startMs:3700},{event:"raid-latest",everyMs:11e3,amount:75,startMs:5500}],"chat-flood":[{event:"message",everyMs:80,amount:0,startMs:500},{event:"follower-latest",everyMs:700,amount:0,startMs:1400},{event:"tip-latest",everyMs:3e3,amount:250,startMs:2800},{event:"cheer-latest",everyMs:6500,amount:300,startMs:3900}]};function el(e,t=12e3){const a=Number.isFinite(t)?Math.max(1e3,Math.min(6e4,t)):12e3,n=Rn[e]??Rn.steady,s=[];for(const r of n)for(let o=r.startMs;o<a&&s.length<900;o+=r.everyMs)s.push({atMs:o,listener:r.event,amount:r.amount});const i=["tip-latest","cheer-latest","raid-latest","subscriber-latest","follower-latest","message"];return s.sort((r,o)=>r.atMs-o.atMs||i.indexOf(r.listener)-i.indexOf(o.listener)),s.slice(0,900)}function tl(e){const t=e.filter(r=>Number.isFinite(r)&&r>0&&r<=1e3);if(t.length<20)return{samples:t.length,approximateFps:null,p95FrameMs:null,slowFramesPercent:null,status:"insufficient"};const a=[...t].sort((r,o)=>r-o),n=a[Math.floor((a.length-1)/2)],s=a[Math.ceil(a.length*.95)-1],i=a.filter(r=>r>33.34).length;return{samples:t.length,approximateFps:Math.round(1e3/n),p95FrameMs:Math.round(s*10)/10,slowFramesPercent:Math.round(i/t.length*100),status:s>50||i/t.length>.15?"warning":"ok"}}function al(e){const t=[];return e.dispatched<e.total&&t.push("Test nie przetworzył wszystkich zaplanowanych zdarzeń."),e.waitingPeak>=14&&t.push("Kolejka zbliżała się do limitu 16 oczekujących alertów."),e.dropped>0&&t.push("Odrzucono "+e.dropped+" wyzwolenia (np. cooldown, próg lub przepełnienie)."),e.evicted>0&&t.push("Wyparcie niższego priorytetu: "+e.evicted+"."),e.frame.status==="warning"&&t.push("Zaobserwowano nieregularny rytm requestAnimationFrame (nie jest to pomiar GPU)."),e.frame.status==="insufficient"&&t.push("Zbyt mało próbek requestAnimationFrame do oceny płynności."),t.length||t.push("Brak przekroczeń ustawionych progów w tej próbie."),{...e,warnings:t}}const nl=new Set(ht.map(e=>e.value)),rl=new Set(["steady","burst","chat-flood","custom"]),sl=900,Rr=1e5,il=6e4;function Rt(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Niepoprawny format pliku.");const t=e;if(t.version!==1)throw new Error("Nieobsługiwana wersja śladu.");if(!rl.has(String(t.source)))throw new Error("Nieznany typ scenariusza.");const a=t.durationMs;if(typeof a!="number"||!Number.isInteger(a)||a<1e3||a>il)throw new Error("Czas śladu musi wynosić od 1 do 60 sekund.");if(!Array.isArray(t.events)||t.events.length>sl)throw new Error("Nieprawidłowa liczba zdarzeń (maks. 900).");const n=[];let s=-1;for(const i of t.events){if(!i||typeof i!="object"||Array.isArray(i))throw new Error("Nieprawidłowe zdarzenie w śladzie.");const r=i;if(!nl.has(String(r.listener)))throw new Error("Ślad zawiera nieobsługiwany typ zdarzenia.");if(typeof r.atMs!="number"||!Number.isInteger(r.atMs)||r.atMs<0||r.atMs>=a||r.atMs<s)throw new Error("Czasy zdarzeń muszą być posortowane i mieścić się w czasie testu.");if(typeof r.amount!="number"||!Number.isFinite(r.amount)||r.amount<0||r.amount>1e6)throw new Error("Kwota testowa poza dozwolonym zakresem.");s=r.atMs,n.push({atMs:r.atMs,listener:r.listener,amount:r.amount})}return{version:1,source:t.source,durationMs:a,events:n}}function ol(e){return JSON.stringify(Rt(e),null,2)}function cl(e){if(typeof e!="string"||e.length>Rr)throw new Error("Plik śladu przekracza limit 100 KB.");let t;try{t=JSON.parse(e)}catch{throw new Error("Plik nie jest poprawnym JSON.")}return Rt(t)}function ll(e){const t=Rt(e);return JSON.stringify([t.durationMs,t.events.map(a=>[a.atMs,a.listener,a.amount])])}function dl(e,t){const a=e.traceKey===t.traceKey,n=a?["Ten sam harmonogram i dane syntetyczne. Różnice w rAF mogą wynikać też z obciążenia przeglądarki."]:["Nie można bezpośrednio porównać różnych harmonogramów. Odtwórz identyczny ślad w obu próbach."],s=(i,r,o,c="")=>({label:i,first:r,second:o,delta:a&&r!==null&&o!==null?Math.round((o-r)*100)/100:null,unit:c});return{comparable:a,reasons:n,measures:[s("Przetworzone zdarzenia",e.result.dispatched,t.result.dispatched),s("Odrzucone",e.result.dropped,t.result.dropped),s("Wyparte",e.result.evicted,t.result.evicted),s("Maks. kolejka",e.result.waitingPeak,t.result.waitingPeak),s("Szacowane FPS (rAF)",e.result.frame.approximateFps,t.result.frame.approximateFps,"FPS"),s("p95 odstępu rAF",e.result.frame.p95FrameMs,t.result.frame.p95FrameMs,"ms"),s("Odstępy >33 ms",e.result.frame.slowFramesPercent,t.result.frame.slowFramesPercent,"%")]}}class pl{timer=null;frameId=null;active=!1;scheduled=[];trace=null;eventIndex=0;startTime=0;lastProgress=0;lastFrame=null;frames=[];waitingPeak=0;endOfPlayback=0;durationMs=12e3;callbacks=null;effects=[];engine;constructor(t){this.engine=t}isRunning(){return this.active}getTrace(){return this.trace?Rt(this.trace):null}start(t,a,n,s){const i=Number.isFinite(a)?Math.round(Math.max(3e3,Math.min(6e4,a))):12e3;this.startTrace({version:1,source:t,durationMs:i,events:el(t,i)},n,s)}startTrace(t,a,n){const s=Rt(t);this.stop("stopped",!1),this.engine.reset(),this.trace=s,this.durationMs=s.durationMs,this.scheduled=s.events.map(i=>({...i})),this.eventIndex=0,this.frames=[],this.waitingPeak=0,this.endOfPlayback=0,this.lastProgress=0,this.lastFrame=null,this.effects=a.map(i=>({...i,trigger:i.trigger?{...i.trigger}:void 0})),this.callbacks=n,this.startTime=performance.now(),this.active=!0,this.frameId=requestAnimationFrame(i=>this.sampleFrame(i)),this.timer=window.setInterval(()=>this.tick(),60),this.tick()}stop(t="stopped",a=!0){if(!this.active)return;const n=Math.min(this.durationMs,Math.max(0,performance.now()-this.startTime));this.active=!1,this.timer!==null&&window.clearInterval(this.timer),this.frameId!==null&&cancelAnimationFrame(this.frameId),this.timer=null,this.frameId=null;const s=this.engine.getSnapshot();if(!a||!this.callbacks)return;const i=al({total:this.scheduled.length,dispatched:this.eventIndex,durationMs:Math.round(n),waitingPeak:this.waitingPeak,dropped:s.counters.dropped,evicted:s.counters.evicted,accepted:s.counters.accepted,frame:tl(this.frames)});this.callbacks.onFinish(i,t)}sampleFrame(t){this.active&&(this.lastFrame!==null&&this.frames.length<3e3&&this.frames.push(t-this.lastFrame),this.lastFrame=t,this.frameId=requestAnimationFrame(a=>this.sampleFrame(a)))}tick(){if(!this.active||!this.callbacks)return;if(document.visibilityState==="hidden"){this.stop("hidden");return}const t=performance.now()-this.startTime,a=Math.min(t,this.durationMs);for(;this.eventIndex<this.scheduled.length&&this.scheduled[this.eventIndex].atMs<=a;){const s=this.scheduled[this.eventIndex++],i=this.engine.dispatch(this.effects,s.listener,s.amount,this.startTime+s.atMs);for(const r of i)this.callbacks.onPlay(r),this.engine.getSnapshot().current?.instanceId===r.instanceId&&(this.endOfPlayback=t+_t(r.effect));this.waitingPeak=Math.max(this.waitingPeak,this.engine.getSnapshot().waiting.length)}let n=0;for(;this.engine.getSnapshot().current&&t>=this.endOfPlayback&&n<8;){const s=this.engine.finishCurrent();n++,s&&(this.callbacks.onPlay(s),this.endOfPlayback=t+_t(s.effect))}t-this.lastProgress>=480&&(this.lastProgress=t,this.callbacks.onProgress({elapsedMs:Math.round(a),durationMs:this.durationMs,dispatched:this.eventIndex,planned:this.scheduled.length,waitingPeak:this.waitingPeak,currentQueueSize:this.engine.getSnapshot().waiting.length,status:"running"})),t>=this.durationMs&&this.stop("completed")}}const ul={accepted:"Dodano do kolejki","queue-full":"Odrzucono — kolejka pełna",cooldown:"Odrzucono — cooldown","below-threshold":"Odrzucono — próg kwoty","lower-priority":"Usunięto — niższy priorytet",started:"Rozpoczęto",completed:"Zakończono",replaced:"Zastąpiono"},fl=new Map(ht.map(e=>[e.value,e.label]));function ee(e,t,a){const n=document.createElement(e);return t&&(n.className=t),a!==void 0&&(n.textContent=a),n}function ml(e,t){const a=new Qc,n=new pl(a);let s=null,i=null,r=null,o=null;const c=()=>JSON.stringify(t().map(S=>[S.instanceId,S.enabled,S.trigger??null]));let l=c();const d=ee("details","ae-diagnostics"),p=ee("summary","","Diagnostyka alertów — symulator kolejki");d.appendChild(p);const h=ee("div","ae-diagnostics-content"),f=ee("p","ae-diagnostics-hint","Test lokalny bez połączenia ze StreamElements. Po uruchomieniu zdarzenia możesz przejść do następnego alertu i zobaczyć kolejność oraz powody odrzucenia.");h.appendChild(f);const g=ee("div","ae-diagnostics-controls"),m=ee("select");m.setAttribute("aria-label","Rodzaj zdarzenia testowego");for(const S of ht){const $=document.createElement("option");$.value=S.value,$.textContent=S.label,m.appendChild($)}const b=ee("input");b.type="number",b.value="50",b.min="0",b.max="1000000",b.setAttribute("aria-label","Testowa kwota donacji lub liczba widzów");const w=ee("select");w.setAttribute("aria-label","Liczba symulowanych zdarzeń");for(const S of[1,5,20]){const $=document.createElement("option");$.value=String(S),$.textContent=S===1?"1 zdarzenie":S+" zdarzeń",w.appendChild($)}const k=ee("button","ae-button ae-button-primary","Symuluj");k.type="button";const x=ee("button","ae-button ae-button-secondary","Następny alert");x.type="button";const M=ee("button","ae-button ae-button-secondary","Wyczyść");M.type="button",g.append(m,b,w,k,x,M),h.appendChild(g);const C=ee("p","ae-diagnostics-status");C.setAttribute("role","status"),h.appendChild(C);const A=ee("div","ae-diagnostics-metrics");h.appendChild(A);const _=ee("h4","","Aktywny alert w trybie kolejki"),D=ee("div","ae-diagnostics-current");h.append(_,D);const j=ee("h4","","Oczekujące alerty"),W=ee("ol","ae-diagnostics-queue");h.append(j,W);const K=ee("h4","","Historia decyzji (ostatnie 60)"),E=ee("ol","ae-diagnostics-log");h.append(K,E);const O=ee("h4","","Test obciążeniowy transmisji (czas rzeczywisty)"),y=ee("p","ae-diagnostics-hint","Scenariusze wysyłają syntetyczne zdarzenia do lokalnej kolejki. Mierzone są odstępy requestAnimationFrame, nie obciążenie GPU ani serwerów StreamElements. Wynik zależy od komputera i przeglądarki."),q=ee("div","ae-diagnostics-stress-controls"),te=ee("select");te.setAttribute("aria-label","Scenariusz obciążenia");for(const[S,$]of[["steady","Zwykła transmisja"],["burst","Nagły wzrost ruchu"],["chat-flood","Intensywny czat"]]){const L=document.createElement("option");L.value=S,L.textContent=$,te.appendChild(L)}const B=ee("select");B.setAttribute("aria-label","Czas trwania testu");for(const[S,$]of[[12e3,"12 sekund"],[3e4,"30 sekund"]]){const L=document.createElement("option");L.value=String(S),L.textContent=$,B.appendChild(L)}const ie=ee("button","ae-button ae-button-primary","Uruchom test");ie.type="button";const X=ee("button","ae-button ae-button-secondary","Zatrzymaj test");X.type="button",X.disabled=!0,q.append(te,B,ie,X);const ne=ee("progress","ae-diagnostics-progress");ne.value=0,ne.max=100,ne.setAttribute("aria-label","Postęp testu obciążeniowego");const N=ee("p","ae-diagnostics-stress-status","Test nie został uruchomiony. Wybierz scenariusz i kliknij Uruchom test.");N.setAttribute("role","status");const I=ee("div","ae-diagnostics-report");h.append(O,y,q,ne,N,I);const re=ee("h4","","Nagranie syntetycznych zdarzeń i porównanie A/B"),V=ee("p","ae-diagnostics-hint","Zapisz wygenerowany przebieg do JSON, wczytaj go ponownie i wykonaj tę samą próbę przed i po zmianach sceny. Tylko udane, pełne próby można ustawić jako A albo B."),Y=ee("div","ae-diagnostics-trace-controls"),me=ee("button","ae-button ae-button-secondary","Eksportuj ślad JSON"),ge=ee("button","ae-button ae-button-secondary","Importuj ślad"),de=ee("button","ae-button ae-button-primary","Odtwórz identyczny ślad"),fe=ee("button","ae-button ae-button-secondary","Zapisz wynik jako A"),le=ee("button","ae-button ae-button-secondary","Zapisz wynik jako B");for(const S of[me,ge,de,fe,le])S.type="button";const se=ee("input");se.type="file",se.accept=".json,application/json",se.hidden=!0,Y.append(me,ge,de,fe,le,se);const ye=ee("p","ae-diagnostics-stress-status");ye.setAttribute("role","status");const pe=ee("div","ae-diagnostics-compare");h.append(re,V,Y,ye,pe),d.appendChild(h),e.appendChild(d);const u=S=>{const $=t().find(L=>L.instanceId===S.instanceId)?.label?.slice(0,80)??S.instanceId.slice(0,24);return(fl.get(S.event)??S.event)+" · P"+S.priority+" · "+$};function T(S=""){ye.textContent=S||(s?"Ślad: "+s.source+", "+s.events.length+" zdarzeń, "+(s.durationMs/1e3).toFixed(1)+" s. Tylko syntetyczne dane.":"Brak nagranego śladu. Uruchom pełny scenariusz albo zaimportuj JSON.");const $=n.isRunning();if(me.disabled=$||!s,de.disabled=$||!s,ge.disabled=$,fe.disabled=$||!i,le.disabled=$||!i,pe.replaceChildren(),!r&&!o){pe.appendChild(ee("p","ae-diagnostics-hint","Przeprowadź próbę, zapisz wynik jako A, zmień scenę i odtwórz ten sam ślad jako B."));return}const L=ee("p","","A: "+(r?"zapisano":"brak")+" · B: "+(o?"zapisano":"brak"));if(pe.appendChild(L),!r||!o)return;const P=dl(r,o),F=ee("p",P.comparable?"ae-diagnostics-comparison-ok":"ae-diagnostics-comparison-warning",P.comparable?"Porównanie tego samego harmonogramu A → B":"Porównanie zablokowane — różne harmonogramy");pe.appendChild(F);for(const ae of P.reasons)pe.appendChild(ee("p","ae-diagnostics-hint",ae));if(!P.comparable)return;const U=ee("table","ae-diagnostics-compare-table"),Z=ee("tr");for(const ae of["Metryka","A","B","Zmiana B−A"])Z.appendChild(ee("th","",ae));const Q=ee("thead");Q.appendChild(Z),U.appendChild(Q);const ue=ee("tbody");for(const ae of P.measures){const be=ee("tr"),Ne=Ce=>Ce===null?"brak danych":String(Ce);be.appendChild(ee("th","",ae.label)),be.appendChild(ee("td","",Ne(ae.first))),be.appendChild(ee("td","",Ne(ae.second))),be.appendChild(ee("td","",ae.delta===null?"—":(ae.delta>0?"+":"")+ae.delta+(ae.unit?" "+ae.unit:""))),ue.appendChild(be)}U.appendChild(ue),pe.appendChild(U)}function R(S=""){const $=a.getSnapshot(),L=m.value,P=t().some(F=>F.enabled&&F.trigger?.event===L);C.textContent=S||(P?"Gotowy do symulacji wybranego zdarzenia.":"Brak włączonej warstwy reagującej na to zdarzenie."),A.replaceChildren();for(const[F,U]of[["Przyjęte",$.counters.accepted],["Uruchomione",$.counters.started],["Zakończone",$.counters.completed],["Odrzucone",$.counters.dropped],["Wyparte",$.counters.evicted]]){const Z=ee("span","",F+": "+U);A.appendChild(Z)}D.textContent=$.current?u($.current):"Brak aktywnej symulowanej animacji.",x.disabled=n.isRunning()||!$.current&&$.waiting.length===0,k.disabled=n.isRunning(),W.replaceChildren(),$.waiting.length||W.appendChild(ee("li","","Kolejka jest pusta."));for(const F of $.waiting)W.appendChild(ee("li","",u(F)));E.replaceChildren(),$.lines.length||E.appendChild(ee("li","","Brak zdarzeń diagnostycznych."));for(const F of $.lines){const U=ul[F.reason]??F.reason;E.appendChild(ee("li","","#"+F.sequence+" · "+U+" · "+u(F)))}}const z=S=>{document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:S.instanceId,diagnostic:!0}}))};function v(S){if(n.isRunning())return;const $=te.value,L=S?.durationMs??Number(B.value),P=t();if(!P.some(U=>U.enabled&&U.trigger?.source==="event")){N.textContent="Dodaj co najmniej jedną włączoną warstwę z wyzwalaczem StreamElements.";return}document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),ie.disabled=!0,X.disabled=!1,te.disabled=!0,B.disabled=!0,T("Trwa próba. Zapis i porównanie będą dostępne po zakończeniu."),I.replaceChildren(),ne.value=0,N.textContent="Test wystartował; symulowane zdarzenia pojawiają się w czasie rzeczywistym.";const F={onPlay:z,onProgress:U=>{ne.value=Math.round(U.elapsedMs/U.durationMs*100);const Z=a.getSnapshot();N.textContent="Odtworzono "+U.dispatched+"/"+U.planned+" zdarzeń; kolejka: "+U.currentQueueSize+"; odrzucenia: "+Z.counters.dropped+"; maksimum oczekujących: "+U.waitingPeak+".",R()},onFinish:(U,Z)=>{ie.disabled=!1,X.disabled=!0,te.disabled=!1,B.disabled=!1;const Q=n.getTrace();Z==="completed"&&Q?(s=Q,i={traceKey:ll(Q),result:U},T("Zapisano syntetyczny harmonogram i wynik pełnej próby. Można eksportować, powtórzyć oraz ustawić A/B.")):(i=null,T("Niepełny pomiar nie jest dopuszczony do porównania A/B.")),ne.value=Math.round(U.durationMs/L*100);const ue=Z==="completed"?"Zakończono scenariusz.":Z==="hidden"?"Test przerwany: karta przeszła w tło (pomiar niemiarodajny).":"Zatrzymano test przed końcem.";N.textContent=ue+" Przetworzono "+U.dispatched+"/"+U.total+" zdarzeń.",I.replaceChildren();const ae=U.frame;I.appendChild(ee("p","","Oczekujące maksimum: "+U.waitingPeak+"/16 · odrzucenia: "+U.dropped+" · wyparcia: "+U.evicted+" · przyjęte: "+U.accepted)),I.appendChild(ee("p","","Rytm klatek rAF: "+(ae.approximateFps===null?"brak danych":"~"+ae.approximateFps+" FPS")+" · p95 odstępu: "+(ae.p95FrameMs??"brak")+" ms · klatki >33 ms: "+(ae.slowFramesPercent??"brak")+"% · próbek: "+ae.samples));const be=ee("ul","ae-diagnostics-findings");for(const Ne of U.warnings)be.appendChild(ee("li","",Ne));I.appendChild(be),R()}};S?n.startTrace(S,P,F):n.start($,L,P,F),T("Trwa odtwarzanie syntetycznego harmonogramu; eksport i porównanie są chwilowo zablokowane."),R()}return ie.addEventListener("click",()=>v()),X.addEventListener("click",()=>n.stop("stopped")),me.addEventListener("click",()=>{if(!s||n.isRunning())return;const S=new Blob([ol(s)],{type:"application/json"}),$=URL.createObjectURL(S),L=document.createElement("a");L.href=$,L.download="animated-effects-alert-trace-v1.json",document.body.appendChild(L),L.click(),L.remove(),window.setTimeout(()=>URL.revokeObjectURL($),1e3),T("Zapisano anonimowy ślad JSON. Plik zawiera jedynie syntetyczne typy, czasy i kwoty.")}),ge.addEventListener("click",()=>{n.isRunning()||se.click()}),se.addEventListener("change",async()=>{const S=se.files?.[0];if(se.value="",!(!S||n.isRunning())){if(S.size>Rr){T("Nie można wczytać: rozmiar pliku przekracza 100 KB.");return}try{const $=cl(await S.text());s=$,i=null,T("Wczytano ślad: "+$.events.length+" zdarzeń. Odtwórz identyczny harmonogram, aby uzyskać wynik.")}catch($){T("Błąd importu: "+($ instanceof Error?$.message:"Nieznany format."))}}}),de.addEventListener("click",()=>{s&&!n.isRunning()&&v(s)}),fe.addEventListener("click",()=>{!i||n.isRunning()||(r={...i},T("Zapisano wynik A dla tej sekwencji testowej."))}),le.addEventListener("click",()=>{!i||n.isRunning()||(o={...i},T("Zapisano wynik B. Sprawdź porównanie poniżej."))}),T(),k.addEventListener("click",()=>{if(n.isRunning())return;const S=m.value,$=Number(w.value),L=Number(b.value),P=Number.isFinite($)?Math.max(1,Math.min(20,$)):1,F=Number.isFinite(L)?Math.max(0,Math.min(1e6,L)):0,U=t();if(!U.some(ue=>ue.enabled&&ue.trigger?.event===S)){R("Brak aktywnych warstw dla wybranego zdarzenia — ustaw wyzwalacz w Inspektorze.");return}const Q=Date.now();for(let ue=0;ue<P;ue++)for(const ae of a.dispatch(U,S,F,Q))z(ae);R("Symulowano "+P+" zdarzeń. Przycisk Następny alert przesuwa kolejkę ręcznie.")}),x.addEventListener("click",()=>{if(n.isRunning())return;const S=a.finishCurrent();S?z(S):document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),R(S?"Odtwarzanie następnego alertu z symulowanej kolejki.":"Symulowana kolejka zakończona.")}),M.addEventListener("click",()=>{n.stop("stopped"),i=null,a.reset(),T(),document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),R("Wyczyszczono stan lokalnego symulatora.")}),m.addEventListener("change",()=>R()),R(),{refresh:()=>{const S=c();l!==S?(l=S,n.stop("stopped"),i=null,a.reset(),T(),R("Zmieniono konfigurację sceny — symulacja została wyzerowana.")):R()}}}const na=[{event:"follower-latest",label:"Nowy obserwujący",title:"{name} obserwuje kanał!",subtitle:"Dzięki za follow!",priority:5,cooldownMs:0,durationMs:6e3},{event:"subscriber-latest",label:"Subskrypcja",title:"{name} subskrybuje kanał!",subtitle:"{message}",priority:7,cooldownMs:0,durationMs:6500},{event:"tip-latest",label:"Donacja",title:"{name} wspiera kwotą {amount}!",subtitle:"{message}",priority:9,cooldownMs:0,durationMs:7e3},{event:"cheer-latest",label:"Cheer / bits",title:"{name}: {amount} bitsów!",subtitle:"{message}",priority:8,cooldownMs:0,durationMs:6500},{event:"raid-latest",label:"Raid",title:"Raid od {name}!",subtitle:"{amount} osób wpada na stream",priority:8,cooldownMs:0,durationMs:7e3},{event:"message",label:"Wiadomość na czacie",title:"{name}",subtitle:"{message}",priority:2,cooldownMs:5e3,durationMs:4500}],yl=["follower-latest","subscriber-latest","tip-latest","cheer-latest","raid-latest"],ra=[{id:"confetti",label:"Konfetti",hint:"Radosny wybuch kolorów, napis na plakietce",effectId:"confetti",colors:["#f472b6","#facc15"],caption:{intro:"pop",outro:"zoom",font:"system",effect:"none",background:"pill",backgroundColor:"#1e1b4b",backgroundOpacity:82}},{id:"fireworks",label:"Fajerwerki",hint:"Świąteczne race i świecący napis",effectId:"fireworks",colors:["#fb923c","#fde68a"],caption:{intro:"zoom",outro:"fade",font:"impact",effect:"glow",color:"#fde68a",letters:"pop"}},{id:"hearts",label:"Serduszka",hint:"Ciepłe podziękowanie, falujące litery",effectId:"hearts",colors:["#f43f5e","#fda4af"],caption:{intro:"bounce",outro:"fade",font:"trebuchet",effect:"none",background:"pill",backgroundColor:"#9d174d",backgroundOpacity:78,letters:"wave"}},{id:"sparks",label:"Iskry",hint:"Energiczne iskry, mocny obrys",effectId:"sparks",colors:["#f97316","#fef08a"],caption:{intro:"slide",outro:"blur",font:"impact",effect:"outline"}},{id:"shockwave",label:"Fala uderzeniowa",hint:"Pierścienie energii z poświatą",effectId:"shockwave-rings",colors:["#22d3ee","#a5f3fc"],caption:{intro:"zoom",outro:"zoom",font:"system",effect:"glow",color:"#cffafe"}},{id:"portal",label:"Portal",hint:"Wirujący portal, tekst jak z maszyny do pisania",effectId:"portal-rings",colors:["#8b5cf6","#c4b5fd"],caption:{intro:"blur",outro:"blur",font:"system",effect:"glow",color:"#ede9fe",background:"box",backgroundColor:"#020617",backgroundOpacity:62,letters:"typewriter"}},{id:"neon",label:"Neon",hint:"Neonowe linie i świecący monospace",effectId:"neon-lines",colors:["#d946ef","#22d3ee"],caption:{intro:"drop",outro:"fade",font:"mono",effect:"glow",color:"#f5d0fe",letters:"typewriter"}},{id:"meteors",label:"Deszcz meteorów",hint:"Spadające gwiazdy, klasyczny cień",effectId:"meteor-shower",colors:["#60a5fa","#e0f2fe"],caption:{intro:"slide",outro:"drop",font:"verdana",effect:"shadow"}},{id:"lightning",label:"Błyskawica",hint:"Uderzenie pioruna, wyskakujące litery",effectId:"lightning",colors:["#facc15","#e0e7ff"],caption:{intro:"pop",outro:"blur",font:"impact",effect:"outline",color:"#fef08a",letters:"pop"}},{id:"snow",label:"Śnieżna zamieć",hint:"Spokojny śnieg, elegancki napis",effectId:"snow-burst",colors:["#bae6fd","#ffffff"],caption:{intro:"fade",outro:"fade",font:"georgia",effect:"shadow",background:"box",backgroundColor:"#0c4a6e",backgroundOpacity:66,letters:"wave"}}];function wa(e){return na.find(t=>t.event===e)??na[0]}function rn(e){return ra.find(t=>t.id===e)??ra[0]}function hl(e,t){const a=wa(e),n=rn(t),s=ba({...We,enabled:!0,template:a.title,subtitle:a.subtitle,position:"center",fontSize:a.event==="message"?46:64,...n.caption});return $e({source:"event",event:a.event,cooldownMs:a.cooldownMs,minAmount:0,caption:s,queueMode:"queue",priority:a.priority})}function gl(e){return{mode:"once",delayMs:0,durationMs:wa(e).durationMs,fadeInMs:300,fadeOutMs:900}}function bl(e,t){return`Alert: ${wa(e).label} · ${rn(t).label}`}function Ir(e,t){const a=an(rn(t).effectId);return a?($t(a.instanceId,gl(e)),aa(a.instanceId,hl(e,t)),_r(a.instanceId,bl(e,t)),a):null}function wl(e,t){en("Dodaj gotowy alert");try{return Ir(e,t)}finally{tn()}}function kl(e){en("Dodaj komplet alertów");try{return yl.map(t=>Ir(t,e)).filter(t=>t!==null)}finally{tn()}}let In=!1;function za(e){document.querySelectorAll(".ae-polish02-menu[open]").forEach(t=>{t!==e&&(t.open=!1)})}function Ar(e){const t=Number(e.value);e.classList.toggle("is-boosted",t>100&&t<=200),e.classList.toggle("is-overdrive",t>200)}function An(){document.querySelectorAll('#inspector input[type="range"]').forEach(Ar)}function vl(){if(In)return;In=!0,document.addEventListener("toggle",t=>{const a=t.target;a instanceof HTMLDetailsElement&&a.matches(".ae-polish02-menu")&&a.open&&za(a)},!0),document.addEventListener("pointerdown",t=>{const a=t.target;a instanceof Element&&(a.closest(".ae-polish02-menu")||za())}),document.addEventListener("click",t=>{const a=t.target;if(a instanceof Element&&a.closest(".ae-polish02-menu-panel button")){const n=a.closest(".ae-polish02-menu");n&&(n.open=!1)}}),document.addEventListener("keydown",t=>{t.key==="Escape"&&za()}),document.addEventListener("input",t=>{const a=t.target;a instanceof HTMLInputElement&&a.type==="range"&&a.closest("#inspector")&&Ar(a)});const e=document.querySelector("#inspector");if(e){let t=!1;const a=new MutationObserver(()=>{t||(t=!0,requestAnimationFrame(()=>{a.disconnect();try{An()}finally{t=!1,a.observe(e,{childList:!0,subtree:!0})}}))});a.observe(e,{childList:!0,subtree:!0})}for(const t of[".ae-effect-library",".ae-layer-list",".ae-inspector-content",".ae-media-export"])document.querySelectorAll(t).forEach(a=>{a.addEventListener("wheel",n=>{n.stopPropagation()},{passive:!0})});An()}let Nn=!1,mt=null,Jt=!1,Sa=!1;function it(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function Nr(){const e=document.querySelector("#inspector");!mt||!e||mt.observe(e,{childList:!0,subtree:!1})}function xl(){Sa||(Sa=!0,mt?.disconnect(),queueMicrotask(()=>{try{Lr()}finally{Sa=!1,Nr()}}))}function Lr(){if(Jt)return;const e=document.querySelector("#inspector");if(e){Jt=!0,mt?.disconnect();try{e.querySelector("[data-pack09-character]")?.remove();const t=Mt();if(!t)return;const a=ze(t.effectId),n=a?.customControls??[];if(n.length===0)return;const s=document.createElement("section");s.className="ae-pack09-character-panel",s.dataset.pack09Character="1",s.innerHTML=`
      <div class="ae-pack09-character-heading">
        <div>
          <strong>Charakter efektu</strong>
          <span>
            Parametry specyficzne dla
            ${it(a?.name??t.effectId)}
          </span>
        </div>

        <span class="ae-pack09-custom-badge">
          ${n.length}×
        </span>
      </div>

      <div class="ae-pack09-character-presets">
        <button type="button" data-pack09-preset="soft">
          Subtelnie
        </button>
        <button type="button" data-pack09-preset="natural">
          Naturalnie
        </button>
        <button type="button" data-pack09-preset="strong">
          Mocno
        </button>
        <button type="button" data-pack09-preset="random">
          Losuj charakter
        </button>
      </div>

      <div class="ae-pack09-character-fields">
        ${n.map(o=>{const c=t.settings.custom?.[o.key],l=Number.isFinite(c)?Number(c):o.defaultValue;return`
                <label class="ae-pack09-character-field">
                  <span class="ae-pack09-character-label">
                    <span>
                      <strong>${it(o.label)}</strong>
                      <small>${it(o.description??"")}</small>
                    </span>

                    <output data-pack09-output="${it(o.key)}">
                      ${l}${o.suffix??""}
                    </output>
                  </span>

                  <input
                    type="range"
                    min="${o.min}"
                    max="${o.max}"
                    step="${o.step??1}"
                    value="${l}"
                    data-pack09-custom="${it(o.key)}"
                    data-pack09-suffix="${it(o.suffix??"")}"
                  >
                </label>
              `}).join("")}
      </div>

      <p class="ae-pack09-character-help">
        Te suwaki zmieniają konstrukcję efektu,
        a nie tylko kolor lub liczbę elementów.
        Wartości są zapisywane w scenie i eksporcie.
      </p>
    `;const i=e.querySelector(".inspector-color-panel"),r=e.querySelector(".inspector-group");i?.nextSibling?e.insertBefore(s,i.nextSibling):r?e.insertBefore(s,r):e.appendChild(s),s.querySelectorAll("[data-pack09-custom]").forEach(o=>{o.addEventListener("input",()=>{const c=o.dataset.pack09Custom;if(!c)return;const l=Mt();if(!l)return;const d=s.querySelector(`[data-pack09-output="${CSS.escape(c)}"]`);d&&(d.value=`${o.value}${o.dataset.pack09Suffix??""}`),Se(l.instanceId,{custom:{...l.settings.custom??{},[c]:Number(o.value)}})})}),s.querySelectorAll("[data-pack09-preset]").forEach(o=>{o.addEventListener("click",()=>{const c=o.dataset.pack09Preset,l=Mt();if(!l||!a)return;const d={...l.settings.custom??{}};for(const p of n){let h=p.defaultValue;c==="soft"?h*=.72:c==="strong"?h*=1.45:c==="random"&&(h+=(Math.random()*2-1)*(p.max-p.min)*.28);const f=p.step??1;d[p.key]=Math.max(p.min,Math.min(p.max,Math.round(h/f)*f))}Se(l.instanceId,{custom:d})})})}finally{mt?.observe(e,{childList:!0,subtree:!1}),Jt=!1}}}function zl(){Nn||(Nn=!0,!document.querySelector("#inspector"))||(mt=new MutationObserver(t=>{if(Jt)return;t.some(n=>Array.from(n.addedNodes).concat(Array.from(n.removedNodes)).some(i=>!(i instanceof HTMLElement&&i.matches("[data-pack09-character]"))))&&xl()}),Lr(),Nr())}let Ln=!1;function Dn(e){return(e??"").trim().toLocaleLowerCase("pl")}function qt(e,t){const a=Dn(t);return Array.from(e.querySelectorAll(":scope > .inspector-group")).find(n=>{if(n.matches(".ae-pack06-inspector"))return!1;const s=n.querySelector(".inspector-group-heading strong")??n.querySelector("strong");return Dn(s?.textContent??null)===a})??null}function Sl(){const e=document.querySelector("#inspector");if(!e)return;const t=e.querySelector(":scope > .inspector-title"),a=e.querySelector(":scope > .inspector-variant-panel"),n=e.querySelector(":scope > [data-pack09-character]"),s=e.querySelector(":scope > .ae-pack06-inspector"),i=e.querySelector(":scope > .inspector-color-panel"),r=qt(e,"Podstawowe"),o=qt(e,"Transformacja"),c=qt(e,"Wygląd"),l=qt(e,"Kompozycja"),d=[t,a,n,r,i,s,o,c,l].filter(p=>!!p);for(const p of d)e.appendChild(p);e.classList.add("ae-ui10-inspector-ordered")}function Tn(){document.documentElement.style.setProperty("--ae-ui10-vh",`${window.innerHeight}px`)}function Ml(){Ln||(Ln=!0,Tn(),window.addEventListener("resize",Tn,{passive:!0}))}const Dr="animated-effects-scene",Tr=1,sn="animated-effects:pack06:recovery";function xe(e,t,a,n){const s=typeof e=="number"?e:Number(e);return Number.isFinite(s)?Math.min(n,Math.max(a,s)):t}function On(e,t,a=[]){const n=e&&typeof e=="object"?e:{},s=["normal","screen","lighten","multiply","overlay"],i=["full","left","center","right","top","bottom"],r=s.includes(n.blendMode)?n.blendMode:t.blendMode,o=i.includes(n.area)?n.area:t.area,c=typeof n.color=="string"&&/^#[0-9a-f]{6}$/i.test(n.color)?n.color:t.color,l=n.custom&&typeof n.custom=="object"&&!Array.isArray(n.custom)?n.custom:{},d=new Map(a.map(f=>[f.key,f])),p=new Set([...Object.keys(t.custom??{}),...a.map(f=>f.key)]),h={};for(const f of p){const g=d.get(f),m=t.custom?.[f]??g?.defaultValue??0;h[f]=xe(l[f],m,g?.min??-1e6,g?.max??1e6)}return{opacity:xe(n.opacity,t.opacity,0,100),scale:xe(n.scale,t.scale,10,400),x:xe(n.x,t.x,-300,300),y:xe(n.y,t.y,-300,300),rotation:xe(n.rotation,t.rotation,-1080,1080),blur:xe(n.blur,t.blur,0,100),brightness:xe(n.brightness,t.brightness,0,500),hue:xe(n.hue,t.hue,-1080,1080),color:c,colorize:typeof n.colorize=="boolean"?n.colorize:t.colorize,density:xe(n.density,t.density,0,400),blendMode:r,area:o,zIndex:xe(n.zIndex,t.zIndex,-1e3,1e3),speed:xe(n.speed,t.speed,1,500),intensity:xe(n.intensity,t.intensity,0,200),custom:p.size?h:void 0}}function El(e,t="Animated Effects Scene"){return{format:Dr,version:Tr,name:t,createdAt:new Date().toISOString(),resolution:structuredClone(e.resolution),backgroundOnly:e.backgroundOnly,palette:structuredClone(e.palette),background:structuredClone(e.background),focusZone:e.focusZone,safeZone:e.safeZone,effects:structuredClone(e.effects)}}function on(e,t){return JSON.stringify(El(e,t),null,2)}function Or(e,t){const a=JSON.parse(e);if(!a||typeof a!="object"||Array.isArray(a))throw new Error("Nieprawidłowy format sceny.");const n=a;if(n.format!==Dr)throw new Error("To nie jest plik Animated Effects Scene.");if(n.version!==Tr)throw new Error(`Nieobsługiwana wersja sceny: ${String(n.version)}.`);const s=[],i=new Set,r=[],o=Array.isArray(n.effects)?n.effects:[];for(const h of o){if(!h||typeof h!="object"){s.push("Pominięto nieprawidłową warstwę.");continue}const f=h,g=typeof f.effectId=="string"?f.effectId:"",m=ze(g);if(!m){s.push(`Pominięto nieznany efekt: ${g||"(brak id)"}.`);continue}let b=typeof f.instanceId=="string"&&f.instanceId?f.instanceId:crypto.randomUUID();i.has(b)&&(s.push(`Naprawiono powtórzone instanceId: ${g}.`),b=crypto.randomUUID()),i.add(b),r.push({instanceId:b,effectId:g,seed:xe(f.seed,Math.floor(Math.random()*4294967295),0,4294967295),enabled:typeof f.enabled=="boolean"?f.enabled:!0,settings:On(f.settings,m.defaultSettings,m.customControls),label:typeof f.label=="string"&&f.label.trim().slice(0,80)||void 0,locked:f.locked===!0,groupId:typeof f.groupId=="string"?f.groupId:null,timeline:f.timeline==null?void 0:ve(f.timeline,On(f.settings,m.defaultSettings,m.customControls)),trigger:$e(f.trigger)})}const c=n.resolution&&typeof n.resolution=="object"?n.resolution:{},l={...structuredClone(t),resolution:{width:xe(c.width,t.resolution.width,240,7680),height:xe(c.height,t.resolution.height,240,4320)},effects:r,selectedEffectInstanceId:r.at(-1)?.instanceId??null,activePresetId:null};n.palette&&typeof n.palette=="object"&&(l.palette={...l.palette,...n.palette}),n.background&&typeof n.background=="object"&&(l.background={...l.background,...n.background}),typeof n.backgroundOnly=="boolean"&&(l.backgroundOnly=n.backgroundOnly);const d=["none","left","center","right","top","bottom"],p=["off","left","center","right","top","bottom","full"];return d.includes(n.focusZone)&&(l.focusZone=n.focusZone),p.includes(n.safeZone)&&(l.safeZone=n.safeZone),{state:l,warnings:s,name:typeof n.name=="string"?n.name.slice(0,120):"Imported Scene"}}function Cl(e,t){const a=URL.createObjectURL(e),n=document.createElement("a");n.href=a,n.download=t,n.click(),setTimeout(()=>URL.revokeObjectURL(a),1500)}function Pl(e){Cl(new Blob([on(e)],{type:"application/json;charset=utf-8"}),`animated-effects-${Date.now()}.aescene.json`)}function jl(e){try{localStorage.setItem(sn,on(e,"Recovery Draft"))}catch{}}function _l(){try{return!!localStorage.getItem(sn)}catch{return!1}}function $l(e){try{const t=localStorage.getItem(sn);return t?Or(t,e).state:null}catch{return null}}const qn=[{id:"cyber-rain",name:"Cyber Rain",effects:[{effectId:"rainfall",settings:{hue:80,density:70,speed:125,blendMode:"screen"}},{effectId:"data-nodes",settings:{opacity:48,density:42}},{effectId:"hologram-scan",settings:{opacity:32}}]},{id:"winter-night",name:"Winter Night",effects:[{effectId:"snow",settings:{density:65,speed:62}},{effectId:"starfield",settings:{opacity:46,density:48}},{effectId:"fog",settings:{opacity:28,y:25}}]},{id:"arcane-ritual",name:"Arcane Ritual",effects:[{effectId:"magic-circle"},{effectId:"floating-symbols"},{effectId:"fractal-rings",settings:{opacity:42}}]},{id:"retro-crt",name:"Retro CRT",effects:[{effectId:"scanlines-plus"},{effectId:"vhs-static",settings:{opacity:34}},{effectId:"recursive-squares",settings:{opacity:30,hue:95}}]},{id:"cosmic-drift",name:"Cosmic Drift",effects:[{effectId:"spiral-galaxy"},{effectId:"meteor-shower",settings:{opacity:55}},{effectId:"orbiting-core",settings:{opacity:45}}]},{id:"ember-forge",name:"Ember Forge",effects:[{effectId:"embers"},{effectId:"sparks",settings:{opacity:58}},{effectId:"gears",settings:{opacity:35}}]},{id:"neon-city",name:"Neon City",effects:[{effectId:"city-lights"},{effectId:"traffic-trails"},{effectId:"neon-tunnel",settings:{opacity:28}}]},{id:"calm-ambient",name:"Calm Ambient",effects:[{effectId:"dust-motes",settings:{opacity:32}},{effectId:"liquid-blobs",settings:{opacity:28,speed:35}},{effectId:"starfield",settings:{opacity:24}}]}];function Rl(e,t){if(e.match(/^[a-z]+:\/\//i))return e;if(e.match(/^\/\//))return window.location.protocol+e;if(e.match(/^[a-z]+:/i))return e;const a=document.implementation.createHTMLDocument(),n=a.createElement("base"),s=a.createElement("a");return a.head.appendChild(n),a.body.appendChild(s),t&&(n.href=t),s.href=e,s.href}const Il=(()=>{let e=0;const t=()=>`0000${(Math.random()*36**4<<0).toString(36)}`.slice(-4);return()=>(e+=1,`u${t()}${e}`)})();function Ze(e){const t=[];for(let a=0,n=e.length;a<n;a++)t.push(e[a]);return t}let ot=null;function qr(e={}){return ot||(e.includeStyleProperties?(ot=e.includeStyleProperties,ot):(ot=Ze(window.getComputedStyle(document.documentElement)),ot))}function sa(e,t){const n=(e.ownerDocument.defaultView||window).getComputedStyle(e).getPropertyValue(t);return n?parseFloat(n.replace("px","")):0}function Al(e){const t=sa(e,"border-left-width"),a=sa(e,"border-right-width");return e.clientWidth+t+a}function Nl(e){const t=sa(e,"border-top-width"),a=sa(e,"border-bottom-width");return e.clientHeight+t+a}function Fr(e,t={}){const a=t.width||Al(e),n=t.height||Nl(e);return{width:a,height:n}}function Ll(){let e,t;try{t=process}catch{}const a=t&&t.env?t.env.devicePixelRatio:null;return a&&(e=parseInt(a,10),Number.isNaN(e)&&(e=1)),e||window.devicePixelRatio||1}const Pe=16384;function Dl(e){(e.width>Pe||e.height>Pe)&&(e.width>Pe&&e.height>Pe?e.width>e.height?(e.height*=Pe/e.width,e.width=Pe):(e.width*=Pe/e.height,e.height=Pe):e.width>Pe?(e.height*=Pe/e.width,e.width=Pe):(e.width*=Pe/e.height,e.height=Pe))}function ia(e){return new Promise((t,a)=>{const n=new Image;n.onload=()=>{n.decode().then(()=>{requestAnimationFrame(()=>t(n))})},n.onerror=a,n.crossOrigin="anonymous",n.decoding="async",n.src=e})}async function Tl(e){return Promise.resolve().then(()=>new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then(t=>`data:image/svg+xml;charset=utf-8,${t}`)}async function Ol(e,t,a){const n="http://www.w3.org/2000/svg",s=document.createElementNS(n,"svg"),i=document.createElementNS(n,"foreignObject");return s.setAttribute("width",`${t}`),s.setAttribute("height",`${a}`),s.setAttribute("viewBox",`0 0 ${t} ${a}`),i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("x","0"),i.setAttribute("y","0"),i.setAttribute("externalResourcesRequired","true"),s.appendChild(i),i.appendChild(e),Tl(s)}const Me=(e,t)=>{if(e instanceof t)return!0;const a=Object.getPrototypeOf(e);return a===null?!1:a.constructor.name===t.name||Me(a,t)};function ql(e){const t=e.getPropertyValue("content");return`${e.cssText} content: '${t.replace(/'|"/g,"")}';`}function Fl(e,t){return qr(t).map(a=>{const n=e.getPropertyValue(a),s=e.getPropertyPriority(a);return`${a}: ${n}${s?" !important":""};`}).join(" ")}function Bl(e,t,a,n){const s=`.${e}:${t}`,i=a.cssText?ql(a):Fl(a,n);return document.createTextNode(`${s}{${i}}`)}function Fn(e,t,a,n){const s=window.getComputedStyle(e,a),i=s.getPropertyValue("content");if(i===""||i==="none")return;const r=Il();try{t.className=`${t.className} ${r}`}catch{return}const o=document.createElement("style");o.appendChild(Bl(r,a,s,n)),t.appendChild(o)}function Wl(e,t,a){Fn(e,t,":before",a),Fn(e,t,":after",a)}const Bn="application/font-woff",Wn="image/jpeg",Ul={woff:Bn,woff2:Bn,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:Wn,jpeg:Wn,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml",webp:"image/webp"};function Xl(e){const t=/\.([^./]*?)$/g.exec(e);return t?t[1]:""}function cn(e){const t=Xl(e).toLowerCase();return Ul[t]||""}function Zl(e){return e.split(/,/)[1]}function Na(e){return e.search(/^(data:)/)!==-1}function Gl(e,t){return`data:${t};base64,${e}`}async function Br(e,t,a){const n=await fetch(e,t);if(n.status===404)throw new Error(`Resource "${n.url}" not found`);const s=await n.blob();return new Promise((i,r)=>{const o=new FileReader;o.onerror=r,o.onloadend=()=>{try{i(a({res:n,result:o.result}))}catch(c){r(c)}},o.readAsDataURL(s)})}const Ma={};function Hl(e,t,a){let n=e.replace(/\?.*/,"");return a&&(n=e),/ttf|otf|eot|woff2?/i.test(n)&&(n=n.replace(/.*\//,"")),t?`[${t}]${n}`:n}async function ln(e,t,a){const n=Hl(e,t,a.includeQueryParams);if(Ma[n]!=null)return Ma[n];a.cacheBust&&(e+=(/\?/.test(e)?"&":"?")+new Date().getTime());let s;try{const i=await Br(e,a.fetchRequestInit,({res:r,result:o})=>(t||(t=r.headers.get("Content-Type")||""),Zl(o)));s=Gl(i,t)}catch(i){s=a.imagePlaceholder||"";let r=`Failed to fetch resource: ${e}`;i&&(r=typeof i=="string"?i:i.message),r&&console.warn(r)}return Ma[n]=s,s}async function Yl(e){const t=e.toDataURL();return t==="data:,"?e.cloneNode(!1):ia(t)}async function Jl(e,t){if(e.currentSrc){const i=document.createElement("canvas"),r=i.getContext("2d");i.width=e.clientWidth,i.height=e.clientHeight,r?.drawImage(e,0,0,i.width,i.height);const o=i.toDataURL();return ia(o)}const a=e.poster,n=cn(a),s=await ln(a,n,t);return ia(s)}async function Vl(e,t){var a;try{if(!((a=e?.contentDocument)===null||a===void 0)&&a.body)return await ka(e.contentDocument.body,t,!0)}catch{}return e.cloneNode(!1)}async function Kl(e,t){return Me(e,HTMLCanvasElement)?Yl(e):Me(e,HTMLVideoElement)?Jl(e,t):Me(e,HTMLIFrameElement)?Vl(e,t):e.cloneNode(Wr(e))}const Ql=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SLOT",Wr=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SVG";async function ed(e,t,a){var n,s;if(Wr(t))return t;let i=[];return Ql(e)&&e.assignedNodes?i=Ze(e.assignedNodes()):Me(e,HTMLIFrameElement)&&(!((n=e.contentDocument)===null||n===void 0)&&n.body)?i=Ze(e.contentDocument.body.childNodes):i=Ze(((s=e.shadowRoot)!==null&&s!==void 0?s:e).childNodes),i.length===0||Me(e,HTMLVideoElement)||await i.reduce((r,o)=>r.then(()=>ka(o,a)).then(c=>{c&&t.appendChild(c)}),Promise.resolve()),t}function td(e,t,a){const n=t.style;if(!n)return;const s=window.getComputedStyle(e);s.cssText?(n.cssText=s.cssText,n.transformOrigin=s.transformOrigin):qr(a).forEach(i=>{let r=s.getPropertyValue(i);i==="font-size"&&r.endsWith("px")&&(r=`${Math.floor(parseFloat(r.substring(0,r.length-2)))-.1}px`),Me(e,HTMLIFrameElement)&&i==="display"&&r==="inline"&&(r="block"),i==="d"&&t.getAttribute("d")&&(r=`path(${t.getAttribute("d")})`),n.setProperty(i,r,s.getPropertyPriority(i))})}function ad(e,t){Me(e,HTMLTextAreaElement)&&(t.innerHTML=e.value),Me(e,HTMLInputElement)&&t.setAttribute("value",e.value)}function nd(e,t){if(Me(e,HTMLSelectElement)){const n=Array.from(t.children).find(s=>e.value===s.getAttribute("value"));n&&n.setAttribute("selected","")}}function rd(e,t,a){return Me(t,Element)&&(td(e,t,a),Wl(e,t,a),ad(e,t),nd(e,t)),t}async function sd(e,t){const a=e.querySelectorAll?e.querySelectorAll("use"):[];if(a.length===0)return e;const n={};for(let i=0;i<a.length;i++){const o=a[i].getAttribute("xlink:href");if(o){const c=e.querySelector(o),l=document.querySelector(o);!c&&l&&!n[o]&&(n[o]=await ka(l,t,!0))}}const s=Object.values(n);if(s.length){const i="http://www.w3.org/1999/xhtml",r=document.createElementNS(i,"svg");r.setAttribute("xmlns",i),r.style.position="absolute",r.style.width="0",r.style.height="0",r.style.overflow="hidden",r.style.display="none";const o=document.createElementNS(i,"defs");r.appendChild(o);for(let c=0;c<s.length;c++)o.appendChild(s[c]);e.appendChild(r)}return e}async function ka(e,t,a){return!a&&t.filter&&!t.filter(e)?null:Promise.resolve(e).then(n=>Kl(n,t)).then(n=>ed(e,n,t)).then(n=>rd(e,n,t)).then(n=>sd(n,t))}const Ur=/url\((['"]?)([^'"]+?)\1\)/g,id=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,od=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function cd(e){const t=e.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1");return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`,"g")}function ld(e){const t=[];return e.replace(Ur,(a,n,s)=>(t.push(s),a)),t.filter(a=>!Na(a))}async function dd(e,t,a,n,s){try{const i=a?Rl(t,a):t,r=cn(t);let o;return s||(o=await ln(i,r,n)),e.replace(cd(t),`$1${o}$3`)}catch{}return e}function pd(e,{preferredFontFormat:t}){return t?e.replace(od,a=>{for(;;){const[n,,s]=id.exec(a)||[];if(!s)return"";if(s===t)return`src: ${n};`}}):e}function Xr(e){return e.search(Ur)!==-1}async function Zr(e,t,a){if(!Xr(e))return e;const n=pd(e,a);return ld(n).reduce((i,r)=>i.then(o=>dd(o,r,t,a)),Promise.resolve(n))}async function ct(e,t,a){var n;const s=(n=t.style)===null||n===void 0?void 0:n.getPropertyValue(e);if(s){const i=await Zr(s,null,a);return t.style.setProperty(e,i,t.style.getPropertyPriority(e)),!0}return!1}async function ud(e,t){await ct("background",e,t)||await ct("background-image",e,t),await ct("mask",e,t)||await ct("-webkit-mask",e,t)||await ct("mask-image",e,t)||await ct("-webkit-mask-image",e,t)}async function fd(e,t){const a=Me(e,HTMLImageElement);if(!(a&&!Na(e.src))&&!(Me(e,SVGImageElement)&&!Na(e.href.baseVal)))return;const n=a?e.src:e.href.baseVal,s=await ln(n,cn(n),t);await new Promise((i,r)=>{e.onload=i,e.onerror=t.onImageErrorHandler?(...c)=>{try{i(t.onImageErrorHandler(...c))}catch(l){r(l)}}:r;const o=e;o.decode&&(o.decode=i),o.loading==="lazy"&&(o.loading="eager"),a?(e.srcset="",e.src=s):e.href.baseVal=s})}async function md(e,t){const n=Ze(e.childNodes).map(s=>Gr(s,t));await Promise.all(n).then(()=>e)}async function Gr(e,t){Me(e,Element)&&(await ud(e,t),await fd(e,t),await md(e,t))}function yd(e,t){const{style:a}=e;t.backgroundColor&&(a.backgroundColor=t.backgroundColor),t.width&&(a.width=`${t.width}px`),t.height&&(a.height=`${t.height}px`);const n=t.style;return n!=null&&Object.keys(n).forEach(s=>{a[s]=n[s]}),e}const Un={};async function Xn(e){let t=Un[e];if(t!=null)return t;const n=await(await fetch(e)).text();return t={url:e,cssText:n},Un[e]=t,t}async function Zn(e,t){let a=e.cssText;const n=/url\(["']?([^"')]+)["']?\)/g,i=(a.match(/url\([^)]+\)/g)||[]).map(async r=>{let o=r.replace(n,"$1");return o.startsWith("https://")||(o=new URL(o,e.url).href),Br(o,t.fetchRequestInit,({result:c})=>(a=a.replace(r,`url(${c})`),[r,c]))});return Promise.all(i).then(()=>a)}function Gn(e){if(e==null)return[];const t=[],a=/(\/\*[\s\S]*?\*\/)/gi;let n=e.replace(a,"");const s=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");for(;;){const c=s.exec(n);if(c===null)break;t.push(c[0])}n=n.replace(s,"");const i=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,r="((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",o=new RegExp(r,"gi");for(;;){let c=i.exec(n);if(c===null){if(c=o.exec(n),c===null)break;i.lastIndex=o.lastIndex}else o.lastIndex=i.lastIndex;t.push(c[0])}return t}async function hd(e,t){const a=[],n=[];return e.forEach(s=>{if("cssRules"in s)try{Ze(s.cssRules||[]).forEach((i,r)=>{if(i.type===CSSRule.IMPORT_RULE){let o=r+1;const c=i.href,l=Xn(c).then(d=>Zn(d,t)).then(d=>Gn(d).forEach(p=>{try{s.insertRule(p,p.startsWith("@import")?o+=1:s.cssRules.length)}catch(h){console.error("Error inserting rule from remote css",{rule:p,error:h})}})).catch(d=>{console.error("Error loading remote css",d.toString())});n.push(l)}})}catch(i){const r=e.find(o=>o.href==null)||document.styleSheets[0];s.href!=null&&n.push(Xn(s.href).then(o=>Zn(o,t)).then(o=>Gn(o).forEach(c=>{r.insertRule(c,r.cssRules.length)})).catch(o=>{console.error("Error loading remote stylesheet",o)})),console.error("Error inlining remote css file",i)}}),Promise.all(n).then(()=>(e.forEach(s=>{if("cssRules"in s)try{Ze(s.cssRules||[]).forEach(i=>{a.push(i)})}catch(i){console.error(`Error while reading CSS rules from ${s.href}`,i)}}),a))}function gd(e){return e.filter(t=>t.type===CSSRule.FONT_FACE_RULE).filter(t=>Xr(t.style.getPropertyValue("src")))}async function bd(e,t){if(e.ownerDocument==null)throw new Error("Provided element is not within a Document");const a=Ze(e.ownerDocument.styleSheets),n=await hd(a,t);return gd(n)}function Hr(e){return e.trim().replace(/["']/g,"")}function wd(e){const t=new Set;function a(n){(n.style.fontFamily||getComputedStyle(n).fontFamily).split(",").forEach(i=>{t.add(Hr(i))}),Array.from(n.children).forEach(i=>{i instanceof HTMLElement&&a(i)})}return a(e),t}async function kd(e,t){const a=await bd(e,t),n=wd(e);return(await Promise.all(a.filter(i=>n.has(Hr(i.style.fontFamily))).map(i=>{const r=i.parentStyleSheet?i.parentStyleSheet.href:null;return Zr(i.cssText,r,t)}))).join(`
`)}async function vd(e,t){const a=t.fontEmbedCSS!=null?t.fontEmbedCSS:t.skipFonts?null:await kd(e,t);if(a){const n=document.createElement("style"),s=document.createTextNode(a);n.appendChild(s),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n)}}async function xd(e,t={}){const{width:a,height:n}=Fr(e,t),s=await ka(e,t,!0);return await vd(s,t),await Gr(s,t),yd(s,t),await Ol(s,a,n)}async function zd(e,t={}){const{width:a,height:n}=Fr(e,t),s=await xd(e,t),i=await ia(s),r=document.createElement("canvas"),o=r.getContext("2d"),c=t.pixelRatio||Ll(),l=t.canvasWidth||a,d=t.canvasHeight||n;return r.width=l*c,r.height=d*c,t.skipAutoScale||Dl(r),r.style.width=`${l}`,r.style.height=`${d}`,t.backgroundColor&&(o.fillStyle=t.backgroundColor,o.fillRect(0,0,r.width,r.height)),o.drawImage(i,0,0,r.width,r.height),r}var Sd={trailer:59};function Yr(e=256){let t=0,a=new Uint8Array(e);return{get buffer(){return a.buffer},reset(){t=0},bytesView(){return a.subarray(0,t)},bytes(){return a.slice(0,t)},writeByte(s){n(t+1),a[t]=s,t++},writeBytes(s,i=0,r=s.length){n(t+r);for(let o=0;o<r;o++)a[t++]=s[o+i]},writeBytesView(s,i=0,r=s.byteLength){n(t+r),a.set(s.subarray(i,i+r),t),t+=r}};function n(s){var i=a.length;if(i>=s)return;var r=1024*1024;s=Math.max(s,i*(i<r?2:1.125)>>>0),i!=0&&(s=Math.max(s,256));let o=a;a=new Uint8Array(s),t>0&&a.set(o.subarray(0,t),0)}}var Ea=12,Hn=5003,Md=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function Ed(e,t,a,n,s=Yr(512),i=new Uint8Array(256),r=new Int32Array(Hn),o=new Int32Array(Hn)){let c=r.length,l=Math.max(2,n);i.fill(0),o.fill(0),r.fill(-1);let d=0,p=0,h=l+1,f=h,g=!1,m=f,b=(1<<m)-1,w=1<<h-1,k=w+1,x=w+2,M=0,C=a[0],A=0;for(let j=c;j<65536;j*=2)++A;A=8-A,s.writeByte(l),D(w);let _=a.length;for(let j=1;j<_;j++)e:{let W=a[j],K=(W<<Ea)+C,E=W<<A^C;if(r[E]===K){C=o[E];break e}let O=E===0?1:c-E;for(;r[E]>=0;)if(E-=O,E<0&&(E+=c),r[E]===K){C=o[E];break e}D(C),C=W,x<1<<Ea?(o[E]=x++,r[E]=K):(r.fill(-1),x=w+2,g=!0,D(w))}return D(C),D(k),s.writeByte(0),s.bytesView();function D(j){for(d&=Md[p],p>0?d|=j<<p:d=j,p+=m;p>=8;)i[M++]=d&255,M>=254&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0),d>>=8,p-=8;if((x>b||g)&&(g?(m=f,b=(1<<m)-1,g=!1):(++m,b=m===Ea?1<<m:(1<<m)-1)),j==k){for(;p>0;)i[M++]=d&255,M>=254&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0),d>>=8,p-=8;M>0&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0)}}}var Cd=Ed;function Jr(e,t,a){return e<<8&63488|t<<2&992|a>>3}function Vr(e,t,a,n){return e>>4|t&240|(a&240)<<4|(n&240)<<8}function Kr(e,t,a){return e>>4<<8|t&240|a>>4}function Ft(e,t,a){return e<t?t:e>a?a:e}function Vt(e){return e*e}function Yn(e,t,a){var n=0,s=1e100;let i=e[t],r=i.cnt;i.ac;let o=i.rc,c=i.gc,l=i.bc;for(var d=i.fw;d!=0;d=e[d].fw){let h=e[d],f=h.cnt,g=r*f/(r+f);if(!(g>=s)){var p=0;p+=g*Vt(h.rc-o),!(p>=s)&&(p+=g*Vt(h.gc-c),!(p>=s)&&(p+=g*Vt(h.bc-l),!(p>=s)&&(s=p,n=d)))}}i.err=s,i.nn=n}function Ca(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function Pd(e,t){let a=t==="rgb444"?4096:65536,n=new Array(a),s=e.length;if(t==="rgba4444")for(let i=0;i<s;++i){let r=e[i],o=r>>24&255,c=r>>16&255,l=r>>8&255,d=r&255,p=Vr(d,l,c,o),h=p in n?n[p]:n[p]=Ca();h.rc+=d,h.gc+=l,h.bc+=c,h.ac+=o,h.cnt++}else if(t==="rgb444")for(let i=0;i<s;++i){let r=e[i],o=r>>16&255,c=r>>8&255,l=r&255,d=Kr(l,c,o),p=d in n?n[d]:n[d]=Ca();p.rc+=l,p.gc+=c,p.bc+=o,p.cnt++}else for(let i=0;i<s;++i){let r=e[i],o=r>>16&255,c=r>>8&255,l=r&255,d=Jr(l,c,o),p=d in n?n[d]:n[d]=Ca();p.rc+=l,p.gc+=c,p.bc+=o,p.cnt++}return n}function jd(e,t,a={}){let{format:n="rgb565",clearAlpha:s=!0,clearAlphaColor:i=0,clearAlphaThreshold:r=0,oneBitAlpha:o=!1}=a;if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");let c=new Uint32Array(e.buffer),l=a.useSqrt!==!1,d=n==="rgba4444",p=Pd(c,n),h=p.length,f=h-1,g=new Uint32Array(h+1);for(var m=0,b=0;b<h;++b){let y=p[b];if(y!=null){var w=1/y.cnt;d&&(y.ac*=w),y.rc*=w,y.gc*=w,y.bc*=w,p[m++]=y}}Vt(t)/m<.022&&(l=!1);for(var b=0;b<m-1;++b)p[b].fw=b+1,p[b+1].bk=b,l&&(p[b].cnt=Math.sqrt(p[b].cnt));l&&(p[b].cnt=Math.sqrt(p[b].cnt));var k,x,M;for(b=0;b<m;++b){Yn(p,b);var C=p[b].err;for(x=++g[0];x>1&&(M=x>>1,!(p[k=g[M]].err<=C));x=M)g[x]=k;g[x]=b}var A=m-t;for(b=0;b<A;){for(var _;;){var D=g[1];if(_=p[D],_.tm>=_.mtm&&p[_.nn].mtm<=_.tm)break;_.mtm==f?D=g[1]=g[g[0]--]:(Yn(p,D),_.tm=b);var C=p[D].err;for(x=1;(M=x+x)<=g[0]&&(M<g[0]&&p[g[M]].err>p[g[M+1]].err&&M++,!(C<=p[k=g[M]].err));x=M)g[x]=k;g[x]=D}var j=p[_.nn],W=_.cnt,K=j.cnt,w=1/(W+K);d&&(_.ac=w*(W*_.ac+K*j.ac)),_.rc=w*(W*_.rc+K*j.rc),_.gc=w*(W*_.gc+K*j.gc),_.bc=w*(W*_.bc+K*j.bc),_.cnt+=j.cnt,_.mtm=++b,p[j.bk].fw=j.fw,p[j.fw].bk=j.bk,j.mtm=f}let E=[];var O=0;for(b=0;;++O){let y=Ft(Math.round(p[b].rc),0,255),q=Ft(Math.round(p[b].gc),0,255),te=Ft(Math.round(p[b].bc),0,255),B=255;d&&(B=Ft(Math.round(p[b].ac),0,255),o&&(B=B<=(typeof o=="number"?o:127)?0:255),s&&B<=r&&(y=q=te=i,B=0));let ie=d?[y,q,te,B]:[y,q,te];if(_d(E,ie)||E.push(ie),(b=p[b].fw)==0)break}return E}function _d(e,t){for(let a=0;a<e.length;a++){let n=e[a],s=n[0]===t[0]&&n[1]===t[1]&&n[2]===t[2],i=n.length>=4&&t.length>=4?n[3]===t[3]:!0;if(s&&i)return!0}return!1}function $d(e,t,a="rgb565"){if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");if(t.length>256)throw new Error("applyPalette() only works with 256 colors or less");let n=new Uint32Array(e.buffer),s=n.length,i=a==="rgb444"?4096:65536,r=new Uint8Array(s),o=new Array(i);if(a==="rgba4444")for(let c=0;c<s;c++){let l=n[c],d=l>>24&255,p=l>>16&255,h=l>>8&255,f=l&255,g=Vr(f,h,p,d),m=g in o?o[g]:o[g]=Rd(f,h,p,d,t);r[c]=m}else{let c=a==="rgb444"?Kr:Jr;for(let l=0;l<s;l++){let d=n[l],p=d>>16&255,h=d>>8&255,f=d&255,g=c(f,h,p),m=g in o?o[g]:o[g]=Id(f,h,p,t);r[l]=m}}return r}function Rd(e,t,a,n,s){let i=0,r=1e100;for(let o=0;o<s.length;o++){let c=s[o],l=c[3],d=Ve(l-n);if(d>r)continue;let p=c[0];if(d+=Ve(p-e),d>r)continue;let h=c[1];if(d+=Ve(h-t),d>r)continue;let f=c[2];d+=Ve(f-a),!(d>r)&&(r=d,i=o)}return i}function Id(e,t,a,n){let s=0,i=1e100;for(let r=0;r<n.length;r++){let o=n[r],c=o[0],l=Ve(c-e);if(l>i)continue;let d=o[1];if(l+=Ve(d-t),l>i)continue;let p=o[2];l+=Ve(p-a),!(l>i)&&(i=l,s=r)}return s}function Ve(e){return e*e}function Ad(e={}){let{initialCapacity:t=4096,auto:a=!0}=e,n=Yr(t),s=5003,i=new Uint8Array(256),r=new Int32Array(s),o=new Int32Array(s),c=!1;return{reset(){n.reset(),c=!1},finish(){n.writeByte(Sd.trailer)},bytes(){return n.bytes()},bytesView(){return n.bytesView()},get buffer(){return n.buffer},get stream(){return n},writeHeader:l,writeFrame(d,p,h,f={}){let{transparent:g=!1,transparentIndex:m=0,delay:b=0,palette:w=null,repeat:k=0,colorDepth:x=8,dispose:M=-1}=f,C=!1;if(a?c||(C=!0,l(),c=!0):C=!!f.first,p=Math.max(0,Math.floor(p)),h=Math.max(0,Math.floor(h)),C){if(!w)throw new Error("First frame must include a { palette } option");Ld(n,p,h,w,x),Jn(n,w),k>=0&&Dd(n,k)}let A=Math.round(b/10);Nd(n,M,A,g,m);let _=!!w&&!C;Td(n,p,h,_?w:null),_&&Jn(n,w),Od(n,d,p,h,x,i,r,o)}};function l(){Qr(n,"GIF89a")}}function Nd(e,t,a,n,s){e.writeByte(33),e.writeByte(249),e.writeByte(4),s<0&&(s=0,n=!1);var i,r;n?(i=1,r=2):(i=0,r=0),t>=0&&(r=t&7),r<<=2,e.writeByte(0|r|0|i),Ue(e,a),e.writeByte(s||0),e.writeByte(0)}function Ld(e,t,a,n,s=8){let i=1,r=0,o=dn(n.length)-1,c=i<<7|s-1<<4|r<<3|o;Ue(e,t),Ue(e,a),e.writeBytes([c,0,0])}function Dd(e,t){e.writeByte(33),e.writeByte(255),e.writeByte(11),Qr(e,"NETSCAPE2.0"),e.writeByte(3),e.writeByte(1),Ue(e,t),e.writeByte(0)}function Jn(e,t){let a=1<<dn(t.length);for(let n=0;n<a;n++){let s=[0,0,0];n<t.length&&(s=t[n]),e.writeByte(s[0]),e.writeByte(s[1]),e.writeByte(s[2])}}function Td(e,t,a,n){if(e.writeByte(44),Ue(e,0),Ue(e,0),Ue(e,t),Ue(e,a),n){let s=0,i=0,r=dn(n.length)-1;e.writeByte(128|s|i|0|r)}else e.writeByte(0)}function Od(e,t,a,n,s=8,i,r,o){Cd(a,n,t,s,e,i,r,o)}function Ue(e,t){e.writeByte(t&255),e.writeByte(t>>8&255)}function Qr(e,t){for(var a=0;a<t.length;a++)e.writeByte(t.charCodeAt(a))}function dn(e){return Math.max(Math.ceil(Math.log2(e)),1)}var Bt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function qd(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function Wt(e){throw new Error('Could not dynamically require "'+e+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var Pa={exports:{}};var Vn;function Fd(){return Vn||(Vn=1,(function(e,t){(function(a){e.exports=a()})(function(){return(function a(n,s,i){function r(l,d){if(!s[l]){if(!n[l]){var p=typeof Wt=="function"&&Wt;if(!d&&p)return p(l,!0);if(o)return o(l,!0);var h=new Error("Cannot find module '"+l+"'");throw h.code="MODULE_NOT_FOUND",h}var f=s[l]={exports:{}};n[l][0].call(f.exports,function(g){var m=n[l][1][g];return r(m||g)},f,f.exports,a,n,s,i)}return s[l].exports}for(var o=typeof Wt=="function"&&Wt,c=0;c<i.length;c++)r(i[c]);return r})({1:[function(a,n,s){var i=a("./utils"),r=a("./support"),o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";s.encode=function(c){for(var l,d,p,h,f,g,m,b=[],w=0,k=c.length,x=k,M=i.getTypeOf(c)!=="string";w<c.length;)x=k-w,p=M?(l=c[w++],d=w<k?c[w++]:0,w<k?c[w++]:0):(l=c.charCodeAt(w++),d=w<k?c.charCodeAt(w++):0,w<k?c.charCodeAt(w++):0),h=l>>2,f=(3&l)<<4|d>>4,g=1<x?(15&d)<<2|p>>6:64,m=2<x?63&p:64,b.push(o.charAt(h)+o.charAt(f)+o.charAt(g)+o.charAt(m));return b.join("")},s.decode=function(c){var l,d,p,h,f,g,m=0,b=0,w="data:";if(c.substr(0,w.length)===w)throw new Error("Invalid base64 input, it looks like a data url.");var k,x=3*(c=c.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(c.charAt(c.length-1)===o.charAt(64)&&x--,c.charAt(c.length-2)===o.charAt(64)&&x--,x%1!=0)throw new Error("Invalid base64 input, bad content length.");for(k=r.uint8array?new Uint8Array(0|x):new Array(0|x);m<c.length;)l=o.indexOf(c.charAt(m++))<<2|(h=o.indexOf(c.charAt(m++)))>>4,d=(15&h)<<4|(f=o.indexOf(c.charAt(m++)))>>2,p=(3&f)<<6|(g=o.indexOf(c.charAt(m++))),k[b++]=l,f!==64&&(k[b++]=d),g!==64&&(k[b++]=p);return k}},{"./support":30,"./utils":32}],2:[function(a,n,s){var i=a("./external"),r=a("./stream/DataWorker"),o=a("./stream/Crc32Probe"),c=a("./stream/DataLengthProbe");function l(d,p,h,f,g){this.compressedSize=d,this.uncompressedSize=p,this.crc32=h,this.compression=f,this.compressedContent=g}l.prototype={getContentWorker:function(){var d=new r(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new c("data_length")),p=this;return d.on("end",function(){if(this.streamInfo.data_length!==p.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),d},getCompressedWorker:function(){return new r(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},l.createWorkerFrom=function(d,p,h){return d.pipe(new o).pipe(new c("uncompressedSize")).pipe(p.compressWorker(h)).pipe(new c("compressedSize")).withStreamInfo("compression",p)},n.exports=l},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(a,n,s){var i=a("./stream/GenericWorker");s.STORE={magic:"\0\0",compressWorker:function(){return new i("STORE compression")},uncompressWorker:function(){return new i("STORE decompression")}},s.DEFLATE=a("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(a,n,s){var i=a("./utils"),r=(function(){for(var o,c=[],l=0;l<256;l++){o=l;for(var d=0;d<8;d++)o=1&o?3988292384^o>>>1:o>>>1;c[l]=o}return c})();n.exports=function(o,c){return o!==void 0&&o.length?i.getTypeOf(o)!=="string"?(function(l,d,p,h){var f=r,g=h+p;l^=-1;for(var m=h;m<g;m++)l=l>>>8^f[255&(l^d[m])];return-1^l})(0|c,o,o.length,0):(function(l,d,p,h){var f=r,g=h+p;l^=-1;for(var m=h;m<g;m++)l=l>>>8^f[255&(l^d.charCodeAt(m))];return-1^l})(0|c,o,o.length,0):0}},{"./utils":32}],5:[function(a,n,s){s.base64=!1,s.binary=!1,s.dir=!1,s.createFolders=!0,s.date=null,s.compression=null,s.compressionOptions=null,s.comment=null,s.unixPermissions=null,s.dosPermissions=null},{}],6:[function(a,n,s){var i=null;i=typeof Promise<"u"?Promise:a("lie"),n.exports={Promise:i}},{lie:37}],7:[function(a,n,s){var i=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Uint32Array<"u",r=a("pako"),o=a("./utils"),c=a("./stream/GenericWorker"),l=i?"uint8array":"array";function d(p,h){c.call(this,"FlateWorker/"+p),this._pako=null,this._pakoAction=p,this._pakoOptions=h,this.meta={}}s.magic="\b\0",o.inherits(d,c),d.prototype.processChunk=function(p){this.meta=p.meta,this._pako===null&&this._createPako(),this._pako.push(o.transformTo(l,p.data),!1)},d.prototype.flush=function(){c.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},d.prototype.cleanUp=function(){c.prototype.cleanUp.call(this),this._pako=null},d.prototype._createPako=function(){this._pako=new r[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var p=this;this._pako.onData=function(h){p.push({data:h,meta:p.meta})}},s.compressWorker=function(p){return new d("Deflate",p)},s.uncompressWorker=function(){return new d("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(a,n,s){function i(f,g){var m,b="";for(m=0;m<g;m++)b+=String.fromCharCode(255&f),f>>>=8;return b}function r(f,g,m,b,w,k){var x,M,C=f.file,A=f.compression,_=k!==l.utf8encode,D=o.transformTo("string",k(C.name)),j=o.transformTo("string",l.utf8encode(C.name)),W=C.comment,K=o.transformTo("string",k(W)),E=o.transformTo("string",l.utf8encode(W)),O=j.length!==C.name.length,y=E.length!==W.length,q="",te="",B="",ie=C.dir,X=C.date,ne={crc32:0,compressedSize:0,uncompressedSize:0};g&&!m||(ne.crc32=f.crc32,ne.compressedSize=f.compressedSize,ne.uncompressedSize=f.uncompressedSize);var N=0;g&&(N|=8),_||!O&&!y||(N|=2048);var I=0,re=0;ie&&(I|=16),w==="UNIX"?(re=798,I|=(function(Y,me){var ge=Y;return Y||(ge=me?16893:33204),(65535&ge)<<16})(C.unixPermissions,ie)):(re=20,I|=(function(Y){return 63&(Y||0)})(C.dosPermissions)),x=X.getUTCHours(),x<<=6,x|=X.getUTCMinutes(),x<<=5,x|=X.getUTCSeconds()/2,M=X.getUTCFullYear()-1980,M<<=4,M|=X.getUTCMonth()+1,M<<=5,M|=X.getUTCDate(),O&&(te=i(1,1)+i(d(D),4)+j,q+="up"+i(te.length,2)+te),y&&(B=i(1,1)+i(d(K),4)+E,q+="uc"+i(B.length,2)+B);var V="";return V+=`
\0`,V+=i(N,2),V+=A.magic,V+=i(x,2),V+=i(M,2),V+=i(ne.crc32,4),V+=i(ne.compressedSize,4),V+=i(ne.uncompressedSize,4),V+=i(D.length,2),V+=i(q.length,2),{fileRecord:p.LOCAL_FILE_HEADER+V+D+q,dirRecord:p.CENTRAL_FILE_HEADER+i(re,2)+V+i(K.length,2)+"\0\0\0\0"+i(I,4)+i(b,4)+D+q+K}}var o=a("../utils"),c=a("../stream/GenericWorker"),l=a("../utf8"),d=a("../crc32"),p=a("../signature");function h(f,g,m,b){c.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=g,this.zipPlatform=m,this.encodeFileName=b,this.streamFiles=f,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}o.inherits(h,c),h.prototype.push=function(f){var g=f.meta.percent||0,m=this.entriesCount,b=this._sources.length;this.accumulate?this.contentBuffer.push(f):(this.bytesWritten+=f.data.length,c.prototype.push.call(this,{data:f.data,meta:{currentFile:this.currentFile,percent:m?(g+100*(m-b-1))/m:100}}))},h.prototype.openedSource=function(f){this.currentSourceOffset=this.bytesWritten,this.currentFile=f.file.name;var g=this.streamFiles&&!f.file.dir;if(g){var m=r(f,g,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:m.fileRecord,meta:{percent:0}})}else this.accumulate=!0},h.prototype.closedSource=function(f){this.accumulate=!1;var g=this.streamFiles&&!f.file.dir,m=r(f,g,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(m.dirRecord),g)this.push({data:(function(b){return p.DATA_DESCRIPTOR+i(b.crc32,4)+i(b.compressedSize,4)+i(b.uncompressedSize,4)})(f),meta:{percent:100}});else for(this.push({data:m.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},h.prototype.flush=function(){for(var f=this.bytesWritten,g=0;g<this.dirRecords.length;g++)this.push({data:this.dirRecords[g],meta:{percent:100}});var m=this.bytesWritten-f,b=(function(w,k,x,M,C){var A=o.transformTo("string",C(M));return p.CENTRAL_DIRECTORY_END+"\0\0\0\0"+i(w,2)+i(w,2)+i(k,4)+i(x,4)+i(A.length,2)+A})(this.dirRecords.length,m,f,this.zipComment,this.encodeFileName);this.push({data:b,meta:{percent:100}})},h.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},h.prototype.registerPrevious=function(f){this._sources.push(f);var g=this;return f.on("data",function(m){g.processChunk(m)}),f.on("end",function(){g.closedSource(g.previous.streamInfo),g._sources.length?g.prepareNextSource():g.end()}),f.on("error",function(m){g.error(m)}),this},h.prototype.resume=function(){return!!c.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},h.prototype.error=function(f){var g=this._sources;if(!c.prototype.error.call(this,f))return!1;for(var m=0;m<g.length;m++)try{g[m].error(f)}catch{}return!0},h.prototype.lock=function(){c.prototype.lock.call(this);for(var f=this._sources,g=0;g<f.length;g++)f[g].lock()},n.exports=h},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(a,n,s){var i=a("../compressions"),r=a("./ZipFileWorker");s.generateWorker=function(o,c,l){var d=new r(c.streamFiles,l,c.platform,c.encodeFileName),p=0;try{o.forEach(function(h,f){p++;var g=(function(k,x){var M=k||x,C=i[M];if(!C)throw new Error(M+" is not a valid compression method !");return C})(f.options.compression,c.compression),m=f.options.compressionOptions||c.compressionOptions||{},b=f.dir,w=f.date;f._compressWorker(g,m).withStreamInfo("file",{name:h,dir:b,date:w,comment:f.comment||"",unixPermissions:f.unixPermissions,dosPermissions:f.dosPermissions}).pipe(d)}),d.entriesCount=p}catch(h){d.error(h)}return d}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(a,n,s){function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var r=new i;for(var o in this)typeof this[o]!="function"&&(r[o]=this[o]);return r}}(i.prototype=a("./object")).loadAsync=a("./load"),i.support=a("./support"),i.defaults=a("./defaults"),i.version="3.10.2",i.loadAsync=function(r,o){return new i().loadAsync(r,o)},i.external=a("./external"),n.exports=i},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(a,n,s){var i=a("./utils"),r=a("./external"),o=a("./utf8"),c=a("./zipEntries"),l=a("./stream/Crc32Probe"),d=a("./nodejsUtils");function p(h){return new r.Promise(function(f,g){var m=h.decompressed.getContentWorker().pipe(new l);m.on("error",function(b){g(b)}).on("end",function(){m.streamInfo.crc32!==h.decompressed.crc32?g(new Error("Corrupted zip : CRC32 mismatch")):f()}).resume()})}n.exports=function(h,f){var g=this;return f=i.extend(f||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),d.isNode&&d.isStream(h)?r.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):i.prepareContent("the loaded zip file",h,!0,f.optimizedBinaryString,f.base64).then(function(m){var b=new c(f);return b.load(m),b}).then(function(m){var b=[r.Promise.resolve(m)],w=m.files;if(f.checkCRC32)for(var k=0;k<w.length;k++)b.push(p(w[k]));return r.Promise.all(b)}).then(function(m){for(var b=m.shift(),w=b.files,k=0;k<w.length;k++){var x=w[k],M=x.fileNameStr,C=i.resolve(x.fileNameStr);g.file(C,x.decompressed,{binary:!0,optimizedBinaryString:!0,date:x.date,dir:x.dir,comment:x.fileCommentStr.length?x.fileCommentStr:null,unixPermissions:x.unixPermissions,dosPermissions:x.dosPermissions,createFolders:f.createFolders}),x.dir||(g.file(C).unsafeOriginalName=M)}return b.zipComment.length&&(g.comment=b.zipComment),g})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(a,n,s){var i=a("../utils"),r=a("../stream/GenericWorker");function o(c,l){r.call(this,"Nodejs stream input adapter for "+c),this._upstreamEnded=!1,this._bindStream(l)}i.inherits(o,r),o.prototype._bindStream=function(c){var l=this;(this._stream=c).pause(),c.on("data",function(d){l.push({data:d,meta:{percent:0}})}).on("error",function(d){l.isPaused?this.generatedError=d:l.error(d)}).on("end",function(){l.isPaused?l._upstreamEnded=!0:l.end()})},o.prototype.pause=function(){return!!r.prototype.pause.call(this)&&(this._stream.pause(),!0)},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},n.exports=o},{"../stream/GenericWorker":28,"../utils":32}],13:[function(a,n,s){var i=a("readable-stream").Readable;function r(o,c,l){i.call(this,c),this._helper=o;var d=this;o.on("data",function(p,h){d.push(p)||d._helper.pause(),l&&l(h)}).on("error",function(p){d.emit("error",p)}).on("end",function(){d.push(null)})}a("../utils").inherits(r,i),r.prototype._read=function(){this._helper.resume()},n.exports=r},{"../utils":32,"readable-stream":16}],14:[function(a,n,s){n.exports={isNode:typeof Buffer<"u",newBufferFrom:function(i,r){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(i,r);if(typeof i=="number")throw new Error('The "data" argument must not be a number');return new Buffer(i,r)},allocBuffer:function(i){if(Buffer.alloc)return Buffer.alloc(i);var r=new Buffer(i);return r.fill(0),r},isBuffer:function(i){return Buffer.isBuffer(i)},isStream:function(i){return i&&typeof i.on=="function"&&typeof i.pause=="function"&&typeof i.resume=="function"}}},{}],15:[function(a,n,s){function i(C,A,_){var D,j=o.getTypeOf(A),W=o.extend(_||{},d);W.date=W.date||new Date,W.compression!==null&&(W.compression=W.compression.toUpperCase()),typeof W.unixPermissions=="string"&&(W.unixPermissions=parseInt(W.unixPermissions,8)),W.unixPermissions&&16384&W.unixPermissions&&(W.dir=!0),W.dosPermissions&&16&W.dosPermissions&&(W.dir=!0),W.dir&&(C=w(C)),W.createFolders&&(D=b(C))&&k.call(this,D,!0);var K=j==="string"&&W.binary===!1&&W.base64===!1;_&&_.binary!==void 0||(W.binary=!K),(A instanceof p&&A.uncompressedSize===0||W.dir||!A||A.length===0)&&(W.base64=!1,W.binary=!0,A="",W.compression="STORE",j="string");var E=null;E=A instanceof p||A instanceof c?A:g.isNode&&g.isStream(A)?new m(C,A):o.prepareContent(C,A,W.binary,W.optimizedBinaryString,W.base64);var O=new h(C,E,W);this.files[C]=O}var r=a("./utf8"),o=a("./utils"),c=a("./stream/GenericWorker"),l=a("./stream/StreamHelper"),d=a("./defaults"),p=a("./compressedObject"),h=a("./zipObject"),f=a("./generate"),g=a("./nodejsUtils"),m=a("./nodejs/NodejsStreamInputAdapter"),b=function(C){C.slice(-1)==="/"&&(C=C.substring(0,C.length-1));var A=C.lastIndexOf("/");return 0<A?C.substring(0,A):""},w=function(C){return C.slice(-1)!=="/"&&(C+="/"),C},k=function(C,A){return A=A!==void 0?A:d.createFolders,C=w(C),this.files[C]||i.call(this,C,null,{dir:!0,createFolders:A}),this.files[C]};function x(C){return Object.prototype.toString.call(C)==="[object RegExp]"}var M={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(C){var A,_,D;for(A in this.files)D=this.files[A],(_=A.slice(this.root.length,A.length))&&A.slice(0,this.root.length)===this.root&&C(_,D)},filter:function(C){var A=[];return this.forEach(function(_,D){C(_,D)&&A.push(D)}),A},file:function(C,A,_){if(arguments.length!==1)return C=this.root+C,i.call(this,C,A,_),this;if(x(C)){var D=C;return this.filter(function(W,K){return!K.dir&&D.test(W)})}var j=this.files[this.root+C];return j&&!j.dir?j:null},folder:function(C){if(!C)return this;if(x(C))return this.filter(function(j,W){return W.dir&&C.test(j)});var A=this.root+C,_=k.call(this,A),D=this.clone();return D.root=_.name,D},remove:function(C){C=this.root+C;var A=this.files[C];if(A||(C.slice(-1)!=="/"&&(C+="/"),A=this.files[C]),A&&!A.dir)delete this.files[C];else for(var _=this.filter(function(j,W){return W.name.slice(0,C.length)===C}),D=0;D<_.length;D++)delete this.files[_[D].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(C){var A,_={};try{if((_=o.extend(C||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:r.utf8encode})).type=_.type.toLowerCase(),_.compression=_.compression.toUpperCase(),_.type==="binarystring"&&(_.type="string"),!_.type)throw new Error("No output type specified.");o.checkSupport(_.type),_.platform!=="darwin"&&_.platform!=="freebsd"&&_.platform!=="linux"&&_.platform!=="sunos"||(_.platform="UNIX"),_.platform==="win32"&&(_.platform="DOS");var D=_.comment||this.comment||"";A=f.generateWorker(this,_,D)}catch(j){(A=new c("error")).error(j)}return new l(A,_.type||"string",_.mimeType)},generateAsync:function(C,A){return this.generateInternalStream(C).accumulate(A)},generateNodeStream:function(C,A){return(C=C||{}).type||(C.type="nodebuffer"),this.generateInternalStream(C).toNodejsStream(A)}};n.exports=M},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(a,n,s){n.exports=a("stream")},{stream:void 0}],17:[function(a,n,s){var i=a("./DataReader");function r(o){i.call(this,o);for(var c=0;c<this.data.length;c++)o[c]=255&o[c]}a("../utils").inherits(r,i),r.prototype.byteAt=function(o){return this.data[this.zero+o]},r.prototype.lastIndexOfSignature=function(o){for(var c=o.charCodeAt(0),l=o.charCodeAt(1),d=o.charCodeAt(2),p=o.charCodeAt(3),h=this.length-4;0<=h;--h)if(this.data[h]===c&&this.data[h+1]===l&&this.data[h+2]===d&&this.data[h+3]===p)return h-this.zero;return-1},r.prototype.readAndCheckSignature=function(o){var c=o.charCodeAt(0),l=o.charCodeAt(1),d=o.charCodeAt(2),p=o.charCodeAt(3),h=this.readData(4);return c===h[0]&&l===h[1]&&d===h[2]&&p===h[3]},r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return[];var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./DataReader":18}],18:[function(a,n,s){var i=a("../utils");function r(o){this.data=o,this.length=o.length,this.index=0,this.zero=0}r.prototype={checkOffset:function(o){this.checkIndex(this.index+o)},checkIndex:function(o){if(this.length<this.zero+o||o<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+o+"). Corrupted zip ?")},setIndex:function(o){this.checkIndex(o),this.index=o},skip:function(o){this.setIndex(this.index+o)},byteAt:function(){},readInt:function(o){var c,l=0;for(this.checkOffset(o),c=this.index+o-1;c>=this.index;c--)l=(l<<8)+this.byteAt(c);return this.index+=o,l},readString:function(o){return i.transformTo("string",this.readData(o))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var o=this.readInt(4);return new Date(Date.UTC(1980+(o>>25&127),(o>>21&15)-1,o>>16&31,o>>11&31,o>>5&63,(31&o)<<1))}},n.exports=r},{"../utils":32}],19:[function(a,n,s){var i=a("./Uint8ArrayReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.readData=function(o){this.checkOffset(o);var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(a,n,s){var i=a("./DataReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.byteAt=function(o){return this.data.charCodeAt(this.zero+o)},r.prototype.lastIndexOfSignature=function(o){return this.data.lastIndexOf(o)-this.zero},r.prototype.readAndCheckSignature=function(o){return o===this.readData(4)},r.prototype.readData=function(o){this.checkOffset(o);var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./DataReader":18}],21:[function(a,n,s){var i=a("./ArrayReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return new Uint8Array(0);var c=this.data.subarray(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./ArrayReader":17}],22:[function(a,n,s){var i=a("../utils"),r=a("../support"),o=a("./ArrayReader"),c=a("./StringReader"),l=a("./NodeBufferReader"),d=a("./Uint8ArrayReader");n.exports=function(p){var h=i.getTypeOf(p);return i.checkSupport(h),h!=="string"||r.uint8array?h==="nodebuffer"?new l(p):r.uint8array?new d(i.transformTo("uint8array",p)):new o(i.transformTo("array",p)):new c(p)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(a,n,s){s.LOCAL_FILE_HEADER="PK",s.CENTRAL_FILE_HEADER="PK",s.CENTRAL_DIRECTORY_END="PK",s.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x07",s.ZIP64_CENTRAL_DIRECTORY_END="PK",s.DATA_DESCRIPTOR="PK\x07\b"},{}],24:[function(a,n,s){var i=a("./GenericWorker"),r=a("../utils");function o(c){i.call(this,"ConvertWorker to "+c),this.destType=c}r.inherits(o,i),o.prototype.processChunk=function(c){this.push({data:r.transformTo(this.destType,c.data),meta:c.meta})},n.exports=o},{"../utils":32,"./GenericWorker":28}],25:[function(a,n,s){var i=a("./GenericWorker"),r=a("../crc32");function o(){i.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}a("../utils").inherits(o,i),o.prototype.processChunk=function(c){this.streamInfo.crc32=r(c.data,this.streamInfo.crc32||0),this.push(c)},n.exports=o},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(a,n,s){var i=a("../utils"),r=a("./GenericWorker");function o(c){r.call(this,"DataLengthProbe for "+c),this.propName=c,this.withStreamInfo(c,0)}i.inherits(o,r),o.prototype.processChunk=function(c){if(c){var l=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=l+c.data.length}r.prototype.processChunk.call(this,c)},n.exports=o},{"../utils":32,"./GenericWorker":28}],27:[function(a,n,s){var i=a("../utils"),r=a("./GenericWorker");function o(c){r.call(this,"DataWorker");var l=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,c.then(function(d){l.dataIsReady=!0,l.data=d,l.max=d&&d.length||0,l.type=i.getTypeOf(d),l.isPaused||l._tickAndRepeat()},function(d){l.error(d)})}i.inherits(o,r),o.prototype.cleanUp=function(){r.prototype.cleanUp.call(this),this.data=null},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,i.delay(this._tickAndRepeat,[],this)),!0)},o.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(i.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},o.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var c=null,l=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":c=this.data.substring(this.index,l);break;case"uint8array":c=this.data.subarray(this.index,l);break;case"array":case"nodebuffer":c=this.data.slice(this.index,l)}return this.index=l,this.push({data:c,meta:{percent:this.max?this.index/this.max*100:0}})},n.exports=o},{"../utils":32,"./GenericWorker":28}],28:[function(a,n,s){function i(r){this.name=r||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}i.prototype={push:function(r){this.emit("data",r)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(r){this.emit("error",r)}return!0},error:function(r){return!this.isFinished&&(this.isPaused?this.generatedError=r:(this.isFinished=!0,this.emit("error",r),this.previous&&this.previous.error(r),this.cleanUp()),!0)},on:function(r,o){return this._listeners[r].push(o),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(r,o){if(this._listeners[r])for(var c=0;c<this._listeners[r].length;c++)this._listeners[r][c].call(this,o)},pipe:function(r){return r.registerPrevious(this)},registerPrevious:function(r){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=r.streamInfo,this.mergeStreamInfo(),this.previous=r;var o=this;return r.on("data",function(c){o.processChunk(c)}),r.on("end",function(){o.end()}),r.on("error",function(c){o.error(c)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var r=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),r=!0),this.previous&&this.previous.resume(),!r},flush:function(){},processChunk:function(r){this.push(r)},withStreamInfo:function(r,o){return this.extraStreamInfo[r]=o,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var r in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,r)&&(this.streamInfo[r]=this.extraStreamInfo[r])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var r="Worker "+this.name;return this.previous?this.previous+" -> "+r:r}},n.exports=i},{}],29:[function(a,n,s){var i=a("../utils"),r=a("./ConvertWorker"),o=a("./GenericWorker"),c=a("../base64"),l=a("../support"),d=a("../external"),p=null;if(l.nodestream)try{p=a("../nodejs/NodejsStreamOutputAdapter")}catch{}function h(g,m){return new d.Promise(function(b,w){var k=[],x=g._internalType,M=g._outputType,C=g._mimeType;g.on("data",function(A,_){k.push(A),m&&m(_)}).on("error",function(A){k=[],w(A)}).on("end",function(){try{var A=(function(_,D,j){switch(_){case"blob":return i.newBlob(i.transformTo("arraybuffer",D),j);case"base64":return c.encode(D);default:return i.transformTo(_,D)}})(M,(function(_,D){var j,W=0,K=null,E=0;for(j=0;j<D.length;j++)E+=D[j].length;switch(_){case"string":return D.join("");case"array":return Array.prototype.concat.apply([],D);case"uint8array":for(K=new Uint8Array(E),j=0;j<D.length;j++)K.set(D[j],W),W+=D[j].length;return K;case"nodebuffer":return Buffer.concat(D);default:throw new Error("concat : unsupported type '"+_+"'")}})(x,k),C);b(A)}catch(_){w(_)}k=[]}).resume()})}function f(g,m,b){var w=m;switch(m){case"blob":case"arraybuffer":w="uint8array";break;case"base64":w="string"}try{this._internalType=w,this._outputType=m,this._mimeType=b,i.checkSupport(w),this._worker=g.pipe(new r(w)),g.lock()}catch(k){this._worker=new o("error"),this._worker.error(k)}}f.prototype={accumulate:function(g){return h(this,g)},on:function(g,m){var b=this;return g==="data"?this._worker.on(g,function(w){m.call(b,w.data,w.meta)}):this._worker.on(g,function(){i.delay(m,arguments,b)}),this},resume:function(){return i.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(g){if(i.checkSupport("nodestream"),this._outputType!=="nodebuffer")throw new Error(this._outputType+" is not supported by this method");return new p(this,{objectMode:this._outputType!=="nodebuffer"},g)}},n.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(a,n,s){if(s.base64=!0,s.array=!0,s.string=!0,s.arraybuffer=typeof ArrayBuffer<"u"&&typeof Uint8Array<"u",s.nodebuffer=typeof Buffer<"u",s.uint8array=typeof Uint8Array<"u",typeof ArrayBuffer>"u")s.blob=!1;else{var i=new ArrayBuffer(0);try{s.blob=new Blob([i],{type:"application/zip"}).size===0}catch{try{var r=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);r.append(i),s.blob=r.getBlob("application/zip").size===0}catch{s.blob=!1}}}try{s.nodestream=!!a("readable-stream").Readable}catch{s.nodestream=!1}},{"readable-stream":16}],31:[function(a,n,s){for(var i=a("./utils"),r=a("./support"),o=a("./nodejsUtils"),c=a("./stream/GenericWorker"),l=new Array(256),d=0;d<256;d++)l[d]=252<=d?6:248<=d?5:240<=d?4:224<=d?3:192<=d?2:1;l[254]=l[254]=1;function p(){c.call(this,"utf-8 decode"),this.leftOver=null}function h(){c.call(this,"utf-8 encode")}s.utf8encode=function(f){return r.nodebuffer?o.newBufferFrom(f,"utf-8"):(function(g){var m,b,w,k,x,M=g.length,C=0;for(k=0;k<M;k++)(64512&(b=g.charCodeAt(k)))==55296&&k+1<M&&(64512&(w=g.charCodeAt(k+1)))==56320&&(b=65536+(b-55296<<10)+(w-56320),k++),C+=b<128?1:b<2048?2:b<65536?3:4;for(m=r.uint8array?new Uint8Array(C):new Array(C),k=x=0;x<C;k++)(64512&(b=g.charCodeAt(k)))==55296&&k+1<M&&(64512&(w=g.charCodeAt(k+1)))==56320&&(b=65536+(b-55296<<10)+(w-56320),k++),b<128?m[x++]=b:(b<2048?m[x++]=192|b>>>6:(b<65536?m[x++]=224|b>>>12:(m[x++]=240|b>>>18,m[x++]=128|b>>>12&63),m[x++]=128|b>>>6&63),m[x++]=128|63&b);return m})(f)},s.utf8decode=function(f){return r.nodebuffer?i.transformTo("nodebuffer",f).toString("utf-8"):(function(g){var m,b,w,k,x=g.length,M=new Array(2*x);for(m=b=0;m<x;)if((w=g[m++])<128)M[b++]=w;else if(4<(k=l[w]))M[b++]=65533,m+=k-1;else{for(w&=k===2?31:k===3?15:7;1<k&&m<x;)w=w<<6|63&g[m++],k--;1<k?M[b++]=65533:w<65536?M[b++]=w:(w-=65536,M[b++]=55296|w>>10&1023,M[b++]=56320|1023&w)}return M.length!==b&&(M.subarray?M=M.subarray(0,b):M.length=b),i.applyFromCharCode(M)})(f=i.transformTo(r.uint8array?"uint8array":"array",f))},i.inherits(p,c),p.prototype.processChunk=function(f){var g=i.transformTo(r.uint8array?"uint8array":"array",f.data);if(this.leftOver&&this.leftOver.length){if(r.uint8array){var m=g;(g=new Uint8Array(m.length+this.leftOver.length)).set(this.leftOver,0),g.set(m,this.leftOver.length)}else g=this.leftOver.concat(g);this.leftOver=null}var b=(function(k,x){var M;for((x=x||k.length)>k.length&&(x=k.length),M=x-1;0<=M&&(192&k[M])==128;)M--;return M<0||M===0?x:M+l[k[M]]>x?M:x})(g),w=g;b!==g.length&&(r.uint8array?(w=g.subarray(0,b),this.leftOver=g.subarray(b,g.length)):(w=g.slice(0,b),this.leftOver=g.slice(b,g.length))),this.push({data:s.utf8decode(w),meta:f.meta})},p.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=p,i.inherits(h,c),h.prototype.processChunk=function(f){this.push({data:s.utf8encode(f.data),meta:f.meta})},s.Utf8EncodeWorker=h},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(a,n,s){var i=a("./support"),r=a("./base64"),o=a("./nodejsUtils"),c=a("./external");function l(m){return m}function d(m,b){for(var w=0;w<m.length;++w)b[w]=255&m.charCodeAt(w);return b}a("setimmediate"),s.newBlob=function(m,b){s.checkSupport("blob");try{return new Blob([m],{type:b})}catch{try{var w=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return w.append(m),w.getBlob(b)}catch{throw new Error("Bug : can't construct the Blob.")}}};var p={stringifyByChunk:function(m,b,w){var k=[],x=0,M=m.length;if(M<=w)return String.fromCharCode.apply(null,m);for(;x<M;)b==="array"||b==="nodebuffer"?k.push(String.fromCharCode.apply(null,m.slice(x,Math.min(x+w,M)))):k.push(String.fromCharCode.apply(null,m.subarray(x,Math.min(x+w,M)))),x+=w;return k.join("")},stringifyByChar:function(m){for(var b="",w=0;w<m.length;w++)b+=String.fromCharCode(m[w]);return b},applyCanBeUsed:{uint8array:(function(){try{return i.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return i.nodebuffer&&String.fromCharCode.apply(null,o.allocBuffer(1)).length===1}catch{return!1}})()}};function h(m){var b=65536,w=s.getTypeOf(m),k=!0;if(w==="uint8array"?k=p.applyCanBeUsed.uint8array:w==="nodebuffer"&&(k=p.applyCanBeUsed.nodebuffer),k)for(;1<b;)try{return p.stringifyByChunk(m,w,b)}catch{b=Math.floor(b/2)}return p.stringifyByChar(m)}function f(m,b){for(var w=0;w<m.length;w++)b[w]=m[w];return b}s.applyFromCharCode=h;var g={};g.string={string:l,array:function(m){return d(m,new Array(m.length))},arraybuffer:function(m){return g.string.uint8array(m).buffer},uint8array:function(m){return d(m,new Uint8Array(m.length))},nodebuffer:function(m){return d(m,o.allocBuffer(m.length))}},g.array={string:h,array:l,arraybuffer:function(m){return new Uint8Array(m).buffer},uint8array:function(m){return new Uint8Array(m)},nodebuffer:function(m){return o.newBufferFrom(m)}},g.arraybuffer={string:function(m){return h(new Uint8Array(m))},array:function(m){return f(new Uint8Array(m),new Array(m.byteLength))},arraybuffer:l,uint8array:function(m){return new Uint8Array(m)},nodebuffer:function(m){return o.newBufferFrom(new Uint8Array(m))}},g.uint8array={string:h,array:function(m){return f(m,new Array(m.length))},arraybuffer:function(m){return m.buffer},uint8array:l,nodebuffer:function(m){return o.newBufferFrom(m)}},g.nodebuffer={string:h,array:function(m){return f(m,new Array(m.length))},arraybuffer:function(m){return g.nodebuffer.uint8array(m).buffer},uint8array:function(m){return f(m,new Uint8Array(m.length))},nodebuffer:l},s.transformTo=function(m,b){if(b=b||"",!m)return b;s.checkSupport(m);var w=s.getTypeOf(b);return g[w][m](b)},s.resolve=function(m){for(var b=m.split("/"),w=[],k=0;k<b.length;k++){var x=b[k];x==="."||x===""&&k!==0&&k!==b.length-1||(x===".."?w.pop():w.push(x))}return w.join("/")},s.getTypeOf=function(m){if(typeof m=="string")return"string";var b=Object.prototype.toString.call(m);return b==="[object Array]"?"array":i.nodebuffer&&o.isBuffer(m)?"nodebuffer":i.uint8array&&b==="[object Uint8Array]"?"uint8array":i.arraybuffer&&b==="[object ArrayBuffer]"?"arraybuffer":void 0},s.checkSupport=function(m){if(!i[m.toLowerCase()])throw new Error(m+" is not supported by this platform")},s.MAX_VALUE_16BITS=65535,s.MAX_VALUE_32BITS=-1,s.pretty=function(m){var b,w,k="";for(w=0;w<(m||"").length;w++)k+="\\x"+((b=m.charCodeAt(w))<16?"0":"")+b.toString(16).toUpperCase();return k},s.delay=function(m,b,w){setImmediate(function(){m.apply(w||null,b||[])})},s.inherits=function(m,b){function w(){}w.prototype=b.prototype,m.prototype=new w},s.extend=function(){var m,b,w={};for(m=0;m<arguments.length;m++)for(b in arguments[m])Object.prototype.hasOwnProperty.call(arguments[m],b)&&w[b]===void 0&&(w[b]=arguments[m][b]);return w},s.prepareContent=function(m,b,w,k,x){return c.Promise.resolve(b).then(function(M){return i.blob&&(M instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(M))!==-1)?Blob.prototype.arrayBuffer!==void 0?M.arrayBuffer():typeof FileReader<"u"?new c.Promise(function(C,A){var _=new FileReader;_.onload=function(D){C(D.target.result)},_.onerror=function(D){A(D.target.error)},_.readAsArrayBuffer(M)}):c.Promise.reject(new Error(m+" is a Blob, but we have no way of reading it.")):M}).then(function(M){var C=s.getTypeOf(M);return C?(C==="arraybuffer"?M=s.transformTo("uint8array",M):C==="string"&&(x?M=r.decode(M):w&&k!==!0&&(M=(function(A){return d(A,i.uint8array?new Uint8Array(A.length):new Array(A.length))})(M))),M):c.Promise.reject(new Error("Can't read the data of '"+m+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(a,n,s){var i=a("./reader/readerFor"),r=a("./utils"),o=a("./signature"),c=a("./zipEntry"),l=a("./support");function d(p){this.files=[],this.loadOptions=p}d.prototype={checkSignature:function(p){if(!this.reader.readAndCheckSignature(p)){this.reader.index-=4;var h=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+r.pretty(h)+", expected "+r.pretty(p)+")")}},isSignature:function(p,h){var f=this.reader.index;this.reader.setIndex(p);var g=this.reader.readString(4)===h;return this.reader.setIndex(f),g},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var p=this.reader.readData(this.zipCommentLength),h=l.uint8array?"uint8array":"array",f=r.transformTo(h,p);this.zipComment=this.loadOptions.decodeFileName(f)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var p,h,f,g=this.zip64EndOfCentralSize-44;0<g;)p=this.reader.readInt(2),h=this.reader.readInt(4),f=this.reader.readData(h),this.zip64ExtensibleData[p]={id:p,length:h,value:f}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var p,h;for(p=0;p<this.files.length;p++)h=this.files[p],this.reader.setIndex(h.localHeaderOffset),this.checkSignature(o.LOCAL_FILE_HEADER),h.readLocalPart(this.reader),h.handleUTF8(),h.processAttributes()},readCentralDir:function(){var p;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(o.CENTRAL_FILE_HEADER);)(p=new c({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(p);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var p=this.reader.lastIndexOfSignature(o.CENTRAL_DIRECTORY_END);if(p<0)throw this.isSignature(0,o.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(p);var h=p;if(this.checkSignature(o.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===r.MAX_VALUE_16BITS||this.diskWithCentralDirStart===r.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===r.MAX_VALUE_16BITS||this.centralDirRecords===r.MAX_VALUE_16BITS||this.centralDirSize===r.MAX_VALUE_32BITS||this.centralDirOffset===r.MAX_VALUE_32BITS){if(this.zip64=!0,(p=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(p),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,o.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var f=this.centralDirOffset+this.centralDirSize;this.zip64&&(f+=20,f+=12+this.zip64EndOfCentralSize);var g=h-f;if(0<g)this.isSignature(h,o.CENTRAL_FILE_HEADER)||(this.reader.zero=g);else if(g<0)throw new Error("Corrupted zip: missing "+Math.abs(g)+" bytes.")},prepareReader:function(p){this.reader=i(p)},load:function(p){this.prepareReader(p),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},n.exports=d},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(a,n,s){var i=a("./reader/readerFor"),r=a("./utils"),o=a("./compressedObject"),c=a("./crc32"),l=a("./utf8"),d=a("./compressions"),p=a("./support");function h(f,g){this.options=f,this.loadOptions=g}h.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(f){var g,m;if(f.skip(22),this.fileNameLength=f.readInt(2),m=f.readInt(2),this.fileName=f.readData(this.fileNameLength),f.skip(m),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if((g=(function(b){for(var w in d)if(Object.prototype.hasOwnProperty.call(d,w)&&d[w].magic===b)return d[w];return null})(this.compressionMethod))===null)throw new Error("Corrupted zip : compression "+r.pretty(this.compressionMethod)+" unknown (inner file : "+r.transformTo("string",this.fileName)+")");this.decompressed=new o(this.compressedSize,this.uncompressedSize,this.crc32,g,f.readData(this.compressedSize))},readCentralPart:function(f){this.versionMadeBy=f.readInt(2),f.skip(2),this.bitFlag=f.readInt(2),this.compressionMethod=f.readString(2),this.date=f.readDate(),this.crc32=f.readInt(4),this.compressedSize=f.readInt(4),this.uncompressedSize=f.readInt(4);var g=f.readInt(2);if(this.extraFieldsLength=f.readInt(2),this.fileCommentLength=f.readInt(2),this.diskNumberStart=f.readInt(2),this.internalFileAttributes=f.readInt(2),this.externalFileAttributes=f.readInt(4),this.localHeaderOffset=f.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");f.skip(g),this.readExtraFields(f),this.parseZIP64ExtraField(f),this.fileComment=f.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var f=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),f==0&&(this.dosPermissions=63&this.externalFileAttributes),f==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!=="/"||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var f=i(this.extraFields[1].value);this.uncompressedSize===r.MAX_VALUE_32BITS&&(this.uncompressedSize=f.readInt(8)),this.compressedSize===r.MAX_VALUE_32BITS&&(this.compressedSize=f.readInt(8)),this.localHeaderOffset===r.MAX_VALUE_32BITS&&(this.localHeaderOffset=f.readInt(8)),this.diskNumberStart===r.MAX_VALUE_32BITS&&(this.diskNumberStart=f.readInt(4))}},readExtraFields:function(f){var g,m,b,w=f.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});f.index+4<w;)g=f.readInt(2),m=f.readInt(2),b=f.readData(m),this.extraFields[g]={id:g,length:m,value:b};f.setIndex(w)},handleUTF8:function(){var f=p.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=l.utf8decode(this.fileName),this.fileCommentStr=l.utf8decode(this.fileComment);else{var g=this.findExtraFieldUnicodePath();if(g!==null)this.fileNameStr=g;else{var m=r.transformTo(f,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(m)}var b=this.findExtraFieldUnicodeComment();if(b!==null)this.fileCommentStr=b;else{var w=r.transformTo(f,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(w)}}},findExtraFieldUnicodePath:function(){var f=this.extraFields[28789];if(f){var g=i(f.value);return g.readInt(1)!==1||c(this.fileName)!==g.readInt(4)?null:l.utf8decode(g.readData(f.length-5))}return null},findExtraFieldUnicodeComment:function(){var f=this.extraFields[25461];if(f){var g=i(f.value);return g.readInt(1)!==1||c(this.fileComment)!==g.readInt(4)?null:l.utf8decode(g.readData(f.length-5))}return null}},n.exports=h},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(a,n,s){function i(g,m,b){this.name=g,this.dir=b.dir,this.date=b.date,this.comment=b.comment,this.unixPermissions=b.unixPermissions,this.dosPermissions=b.dosPermissions,this._data=m,this._dataBinary=b.binary,this.options={compression:b.compression,compressionOptions:b.compressionOptions}}var r=a("./stream/StreamHelper"),o=a("./stream/DataWorker"),c=a("./utf8"),l=a("./compressedObject"),d=a("./stream/GenericWorker");i.prototype={internalStream:function(g){var m=null,b="string";try{if(!g)throw new Error("No output type specified.");var w=(b=g.toLowerCase())==="string"||b==="text";b!=="binarystring"&&b!=="text"||(b="string"),m=this._decompressWorker();var k=!this._dataBinary;k&&!w&&(m=m.pipe(new c.Utf8EncodeWorker)),!k&&w&&(m=m.pipe(new c.Utf8DecodeWorker))}catch(x){(m=new d("error")).error(x)}return new r(m,b,"")},async:function(g,m){return this.internalStream(g).accumulate(m)},nodeStream:function(g,m){return this.internalStream(g||"nodebuffer").toNodejsStream(m)},_compressWorker:function(g,m){if(this._data instanceof l&&this._data.compression.magic===g.magic)return this._data.getCompressedWorker();var b=this._decompressWorker();return this._dataBinary||(b=b.pipe(new c.Utf8EncodeWorker)),l.createWorkerFrom(b,g,m)},_decompressWorker:function(){return this._data instanceof l?this._data.getContentWorker():this._data instanceof d?this._data:new o(this._data)}};for(var p=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],h=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<p.length;f++)i.prototype[p[f]]=h;n.exports=i},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(a,n,s){(function(i){var r,o,c=i.MutationObserver||i.WebKitMutationObserver;if(c){var l=0,d=new c(g),p=i.document.createTextNode("");d.observe(p,{characterData:!0}),r=function(){p.data=l=++l%2}}else if(i.setImmediate||i.MessageChannel===void 0)r="document"in i&&"onreadystatechange"in i.document.createElement("script")?function(){var m=i.document.createElement("script");m.onreadystatechange=function(){g(),m.onreadystatechange=null,m.parentNode.removeChild(m),m=null},i.document.documentElement.appendChild(m)}:function(){setTimeout(g,0)};else{var h=new i.MessageChannel;h.port1.onmessage=g,r=function(){h.port2.postMessage(0)}}var f=[];function g(){var m,b;o=!0;for(var w=f.length;w;){for(b=f,f=[],m=-1;++m<w;)b[m]();w=f.length}o=!1}n.exports=function(m){f.push(m)!==1||o||r()}}).call(this,typeof Bt<"u"?Bt:typeof self<"u"?self:typeof window<"u"?window:{})},{}],37:[function(a,n,s){var i=a("immediate");function r(){}var o={},c=["REJECTED"],l=["FULFILLED"],d=["PENDING"];function p(w){if(typeof w!="function")throw new TypeError("resolver must be a function");this.state=d,this.queue=[],this.outcome=void 0,w!==r&&m(this,w)}function h(w,k,x){this.promise=w,typeof k=="function"&&(this.onFulfilled=k,this.callFulfilled=this.otherCallFulfilled),typeof x=="function"&&(this.onRejected=x,this.callRejected=this.otherCallRejected)}function f(w,k,x){i(function(){var M;try{M=k(x)}catch(C){return o.reject(w,C)}M===w?o.reject(w,new TypeError("Cannot resolve promise with itself")):o.resolve(w,M)})}function g(w){var k=w&&w.then;if(w&&(typeof w=="object"||typeof w=="function")&&typeof k=="function")return function(){k.apply(w,arguments)}}function m(w,k){var x=!1;function M(_){x||(x=!0,o.reject(w,_))}function C(_){x||(x=!0,o.resolve(w,_))}var A=b(function(){k(C,M)});A.status==="error"&&M(A.value)}function b(w,k){var x={};try{x.value=w(k),x.status="success"}catch(M){x.status="error",x.value=M}return x}(n.exports=p).prototype.finally=function(w){if(typeof w!="function")return this;var k=this.constructor;return this.then(function(x){return k.resolve(w()).then(function(){return x})},function(x){return k.resolve(w()).then(function(){throw x})})},p.prototype.catch=function(w){return this.then(null,w)},p.prototype.then=function(w,k){if(typeof w!="function"&&this.state===l||typeof k!="function"&&this.state===c)return this;var x=new this.constructor(r);return this.state!==d?f(x,this.state===l?w:k,this.outcome):this.queue.push(new h(x,w,k)),x},h.prototype.callFulfilled=function(w){o.resolve(this.promise,w)},h.prototype.otherCallFulfilled=function(w){f(this.promise,this.onFulfilled,w)},h.prototype.callRejected=function(w){o.reject(this.promise,w)},h.prototype.otherCallRejected=function(w){f(this.promise,this.onRejected,w)},o.resolve=function(w,k){var x=b(g,k);if(x.status==="error")return o.reject(w,x.value);var M=x.value;if(M)m(w,M);else{w.state=l,w.outcome=k;for(var C=-1,A=w.queue.length;++C<A;)w.queue[C].callFulfilled(k)}return w},o.reject=function(w,k){w.state=c,w.outcome=k;for(var x=-1,M=w.queue.length;++x<M;)w.queue[x].callRejected(k);return w},p.resolve=function(w){return w instanceof this?w:o.resolve(new this(r),w)},p.reject=function(w){var k=new this(r);return o.reject(k,w)},p.all=function(w){var k=this;if(Object.prototype.toString.call(w)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=w.length,M=!1;if(!x)return this.resolve([]);for(var C=new Array(x),A=0,_=-1,D=new this(r);++_<x;)j(w[_],_);return D;function j(W,K){k.resolve(W).then(function(E){C[K]=E,++A!==x||M||(M=!0,o.resolve(D,C))},function(E){M||(M=!0,o.reject(D,E))})}},p.race=function(w){var k=this;if(Object.prototype.toString.call(w)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=w.length,M=!1;if(!x)return this.resolve([]);for(var C=-1,A=new this(r);++C<x;)_=w[C],k.resolve(_).then(function(D){M||(M=!0,o.resolve(A,D))},function(D){M||(M=!0,o.reject(A,D))});var _;return A}},{immediate:36}],38:[function(a,n,s){var i={};(0,a("./lib/utils/common").assign)(i,a("./lib/deflate"),a("./lib/inflate"),a("./lib/zlib/constants")),n.exports=i},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(a,n,s){var i=a("./zlib/deflate"),r=a("./utils/common"),o=a("./utils/strings"),c=a("./zlib/messages"),l=a("./zlib/zstream"),d=Object.prototype.toString,p=0,h=-1,f=0,g=8;function m(w){if(!(this instanceof m))return new m(w);this.options=r.assign({level:h,method:g,chunkSize:16384,windowBits:15,memLevel:8,strategy:f,to:""},w||{});var k=this.options;k.raw&&0<k.windowBits?k.windowBits=-k.windowBits:k.gzip&&0<k.windowBits&&k.windowBits<16&&(k.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new l,this.strm.avail_out=0;var x=i.deflateInit2(this.strm,k.level,k.method,k.windowBits,k.memLevel,k.strategy);if(x!==p)throw new Error(c[x]);if(k.header&&i.deflateSetHeader(this.strm,k.header),k.dictionary){var M;if(M=typeof k.dictionary=="string"?o.string2buf(k.dictionary):d.call(k.dictionary)==="[object ArrayBuffer]"?new Uint8Array(k.dictionary):k.dictionary,(x=i.deflateSetDictionary(this.strm,M))!==p)throw new Error(c[x]);this._dict_set=!0}}function b(w,k){var x=new m(k);if(x.push(w,!0),x.err)throw x.msg||c[x.err];return x.result}m.prototype.push=function(w,k){var x,M,C=this.strm,A=this.options.chunkSize;if(this.ended)return!1;M=k===~~k?k:k===!0?4:0,typeof w=="string"?C.input=o.string2buf(w):d.call(w)==="[object ArrayBuffer]"?C.input=new Uint8Array(w):C.input=w,C.next_in=0,C.avail_in=C.input.length;do{if(C.avail_out===0&&(C.output=new r.Buf8(A),C.next_out=0,C.avail_out=A),(x=i.deflate(C,M))!==1&&x!==p)return this.onEnd(x),!(this.ended=!0);C.avail_out!==0&&(C.avail_in!==0||M!==4&&M!==2)||(this.options.to==="string"?this.onData(o.buf2binstring(r.shrinkBuf(C.output,C.next_out))):this.onData(r.shrinkBuf(C.output,C.next_out)))}while((0<C.avail_in||C.avail_out===0)&&x!==1);return M===4?(x=i.deflateEnd(this.strm),this.onEnd(x),this.ended=!0,x===p):M!==2||(this.onEnd(p),!(C.avail_out=0))},m.prototype.onData=function(w){this.chunks.push(w)},m.prototype.onEnd=function(w){w===p&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=w,this.msg=this.strm.msg},s.Deflate=m,s.deflate=b,s.deflateRaw=function(w,k){return(k=k||{}).raw=!0,b(w,k)},s.gzip=function(w,k){return(k=k||{}).gzip=!0,b(w,k)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(a,n,s){var i=a("./zlib/inflate"),r=a("./utils/common"),o=a("./utils/strings"),c=a("./zlib/constants"),l=a("./zlib/messages"),d=a("./zlib/zstream"),p=a("./zlib/gzheader"),h=Object.prototype.toString;function f(m){if(!(this instanceof f))return new f(m);this.options=r.assign({chunkSize:16384,windowBits:0,to:""},m||{});var b=this.options;b.raw&&0<=b.windowBits&&b.windowBits<16&&(b.windowBits=-b.windowBits,b.windowBits===0&&(b.windowBits=-15)),!(0<=b.windowBits&&b.windowBits<16)||m&&m.windowBits||(b.windowBits+=32),15<b.windowBits&&b.windowBits<48&&(15&b.windowBits)==0&&(b.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new d,this.strm.avail_out=0;var w=i.inflateInit2(this.strm,b.windowBits);if(w!==c.Z_OK)throw new Error(l[w]);this.header=new p,i.inflateGetHeader(this.strm,this.header)}function g(m,b){var w=new f(b);if(w.push(m,!0),w.err)throw w.msg||l[w.err];return w.result}f.prototype.push=function(m,b){var w,k,x,M,C,A,_=this.strm,D=this.options.chunkSize,j=this.options.dictionary,W=!1;if(this.ended)return!1;k=b===~~b?b:b===!0?c.Z_FINISH:c.Z_NO_FLUSH,typeof m=="string"?_.input=o.binstring2buf(m):h.call(m)==="[object ArrayBuffer]"?_.input=new Uint8Array(m):_.input=m,_.next_in=0,_.avail_in=_.input.length;do{if(_.avail_out===0&&(_.output=new r.Buf8(D),_.next_out=0,_.avail_out=D),(w=i.inflate(_,c.Z_NO_FLUSH))===c.Z_NEED_DICT&&j&&(A=typeof j=="string"?o.string2buf(j):h.call(j)==="[object ArrayBuffer]"?new Uint8Array(j):j,w=i.inflateSetDictionary(this.strm,A)),w===c.Z_BUF_ERROR&&W===!0&&(w=c.Z_OK,W=!1),w!==c.Z_STREAM_END&&w!==c.Z_OK)return this.onEnd(w),!(this.ended=!0);_.next_out&&(_.avail_out!==0&&w!==c.Z_STREAM_END&&(_.avail_in!==0||k!==c.Z_FINISH&&k!==c.Z_SYNC_FLUSH)||(this.options.to==="string"?(x=o.utf8border(_.output,_.next_out),M=_.next_out-x,C=o.buf2string(_.output,x),_.next_out=M,_.avail_out=D-M,M&&r.arraySet(_.output,_.output,x,M,0),this.onData(C)):this.onData(r.shrinkBuf(_.output,_.next_out)))),_.avail_in===0&&_.avail_out===0&&(W=!0)}while((0<_.avail_in||_.avail_out===0)&&w!==c.Z_STREAM_END);return w===c.Z_STREAM_END&&(k=c.Z_FINISH),k===c.Z_FINISH?(w=i.inflateEnd(this.strm),this.onEnd(w),this.ended=!0,w===c.Z_OK):k!==c.Z_SYNC_FLUSH||(this.onEnd(c.Z_OK),!(_.avail_out=0))},f.prototype.onData=function(m){this.chunks.push(m)},f.prototype.onEnd=function(m){m===c.Z_OK&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=m,this.msg=this.strm.msg},s.Inflate=f,s.inflate=g,s.inflateRaw=function(m,b){return(b=b||{}).raw=!0,g(m,b)},s.ungzip=g},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(a,n,s){var i=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Int32Array<"u";s.assign=function(c){for(var l=Array.prototype.slice.call(arguments,1);l.length;){var d=l.shift();if(d){if(typeof d!="object")throw new TypeError(d+"must be non-object");for(var p in d)d.hasOwnProperty(p)&&(c[p]=d[p])}}return c},s.shrinkBuf=function(c,l){return c.length===l?c:c.subarray?c.subarray(0,l):(c.length=l,c)};var r={arraySet:function(c,l,d,p,h){if(l.subarray&&c.subarray)c.set(l.subarray(d,d+p),h);else for(var f=0;f<p;f++)c[h+f]=l[d+f]},flattenChunks:function(c){var l,d,p,h,f,g;for(l=p=0,d=c.length;l<d;l++)p+=c[l].length;for(g=new Uint8Array(p),l=h=0,d=c.length;l<d;l++)f=c[l],g.set(f,h),h+=f.length;return g}},o={arraySet:function(c,l,d,p,h){for(var f=0;f<p;f++)c[h+f]=l[d+f]},flattenChunks:function(c){return[].concat.apply([],c)}};s.setTyped=function(c){c?(s.Buf8=Uint8Array,s.Buf16=Uint16Array,s.Buf32=Int32Array,s.assign(s,r)):(s.Buf8=Array,s.Buf16=Array,s.Buf32=Array,s.assign(s,o))},s.setTyped(i)},{}],42:[function(a,n,s){var i=a("./common"),r=!0,o=!0;try{String.fromCharCode.apply(null,[0])}catch{r=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{o=!1}for(var c=new i.Buf8(256),l=0;l<256;l++)c[l]=252<=l?6:248<=l?5:240<=l?4:224<=l?3:192<=l?2:1;function d(p,h){if(h<65537&&(p.subarray&&o||!p.subarray&&r))return String.fromCharCode.apply(null,i.shrinkBuf(p,h));for(var f="",g=0;g<h;g++)f+=String.fromCharCode(p[g]);return f}c[254]=c[254]=1,s.string2buf=function(p){var h,f,g,m,b,w=p.length,k=0;for(m=0;m<w;m++)(64512&(f=p.charCodeAt(m)))==55296&&m+1<w&&(64512&(g=p.charCodeAt(m+1)))==56320&&(f=65536+(f-55296<<10)+(g-56320),m++),k+=f<128?1:f<2048?2:f<65536?3:4;for(h=new i.Buf8(k),m=b=0;b<k;m++)(64512&(f=p.charCodeAt(m)))==55296&&m+1<w&&(64512&(g=p.charCodeAt(m+1)))==56320&&(f=65536+(f-55296<<10)+(g-56320),m++),f<128?h[b++]=f:(f<2048?h[b++]=192|f>>>6:(f<65536?h[b++]=224|f>>>12:(h[b++]=240|f>>>18,h[b++]=128|f>>>12&63),h[b++]=128|f>>>6&63),h[b++]=128|63&f);return h},s.buf2binstring=function(p){return d(p,p.length)},s.binstring2buf=function(p){for(var h=new i.Buf8(p.length),f=0,g=h.length;f<g;f++)h[f]=p.charCodeAt(f);return h},s.buf2string=function(p,h){var f,g,m,b,w=h||p.length,k=new Array(2*w);for(f=g=0;f<w;)if((m=p[f++])<128)k[g++]=m;else if(4<(b=c[m]))k[g++]=65533,f+=b-1;else{for(m&=b===2?31:b===3?15:7;1<b&&f<w;)m=m<<6|63&p[f++],b--;1<b?k[g++]=65533:m<65536?k[g++]=m:(m-=65536,k[g++]=55296|m>>10&1023,k[g++]=56320|1023&m)}return d(k,g)},s.utf8border=function(p,h){var f;for((h=h||p.length)>p.length&&(h=p.length),f=h-1;0<=f&&(192&p[f])==128;)f--;return f<0||f===0?h:f+c[p[f]]>h?f:h}},{"./common":41}],43:[function(a,n,s){n.exports=function(i,r,o,c){for(var l=65535&i|0,d=i>>>16&65535|0,p=0;o!==0;){for(o-=p=2e3<o?2e3:o;d=d+(l=l+r[c++]|0)|0,--p;);l%=65521,d%=65521}return l|d<<16|0}},{}],44:[function(a,n,s){n.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(a,n,s){var i=(function(){for(var r,o=[],c=0;c<256;c++){r=c;for(var l=0;l<8;l++)r=1&r?3988292384^r>>>1:r>>>1;o[c]=r}return o})();n.exports=function(r,o,c,l){var d=i,p=l+c;r^=-1;for(var h=l;h<p;h++)r=r>>>8^d[255&(r^o[h])];return-1^r}},{}],46:[function(a,n,s){var i,r=a("../utils/common"),o=a("./trees"),c=a("./adler32"),l=a("./crc32"),d=a("./messages"),p=0,h=4,f=0,g=-2,m=-1,b=4,w=2,k=8,x=9,M=286,C=30,A=19,_=2*M+1,D=15,j=3,W=258,K=W+j+1,E=42,O=113,y=1,q=2,te=3,B=4;function ie(u,T){return u.msg=d[T],T}function X(u){return(u<<1)-(4<u?9:0)}function ne(u){for(var T=u.length;0<=--T;)u[T]=0}function N(u){var T=u.state,R=T.pending;R>u.avail_out&&(R=u.avail_out),R!==0&&(r.arraySet(u.output,T.pending_buf,T.pending_out,R,u.next_out),u.next_out+=R,T.pending_out+=R,u.total_out+=R,u.avail_out-=R,T.pending-=R,T.pending===0&&(T.pending_out=0))}function I(u,T){o._tr_flush_block(u,0<=u.block_start?u.block_start:-1,u.strstart-u.block_start,T),u.block_start=u.strstart,N(u.strm)}function re(u,T){u.pending_buf[u.pending++]=T}function V(u,T){u.pending_buf[u.pending++]=T>>>8&255,u.pending_buf[u.pending++]=255&T}function Y(u,T){var R,z,v=u.max_chain_length,S=u.strstart,$=u.prev_length,L=u.nice_match,P=u.strstart>u.w_size-K?u.strstart-(u.w_size-K):0,F=u.window,U=u.w_mask,Z=u.prev,Q=u.strstart+W,ue=F[S+$-1],ae=F[S+$];u.prev_length>=u.good_match&&(v>>=2),L>u.lookahead&&(L=u.lookahead);do if(F[(R=T)+$]===ae&&F[R+$-1]===ue&&F[R]===F[S]&&F[++R]===F[S+1]){S+=2,R++;do;while(F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&S<Q);if(z=W-(Q-S),S=Q-W,$<z){if(u.match_start=T,L<=($=z))break;ue=F[S+$-1],ae=F[S+$]}}while((T=Z[T&U])>P&&--v!=0);return $<=u.lookahead?$:u.lookahead}function me(u){var T,R,z,v,S,$,L,P,F,U,Z=u.w_size;do{if(v=u.window_size-u.lookahead-u.strstart,u.strstart>=Z+(Z-K)){for(r.arraySet(u.window,u.window,Z,Z,0),u.match_start-=Z,u.strstart-=Z,u.block_start-=Z,T=R=u.hash_size;z=u.head[--T],u.head[T]=Z<=z?z-Z:0,--R;);for(T=R=Z;z=u.prev[--T],u.prev[T]=Z<=z?z-Z:0,--R;);v+=Z}if(u.strm.avail_in===0)break;if($=u.strm,L=u.window,P=u.strstart+u.lookahead,F=v,U=void 0,U=$.avail_in,F<U&&(U=F),R=U===0?0:($.avail_in-=U,r.arraySet(L,$.input,$.next_in,U,P),$.state.wrap===1?$.adler=c($.adler,L,U,P):$.state.wrap===2&&($.adler=l($.adler,L,U,P)),$.next_in+=U,$.total_in+=U,U),u.lookahead+=R,u.lookahead+u.insert>=j)for(S=u.strstart-u.insert,u.ins_h=u.window[S],u.ins_h=(u.ins_h<<u.hash_shift^u.window[S+1])&u.hash_mask;u.insert&&(u.ins_h=(u.ins_h<<u.hash_shift^u.window[S+j-1])&u.hash_mask,u.prev[S&u.w_mask]=u.head[u.ins_h],u.head[u.ins_h]=S,S++,u.insert--,!(u.lookahead+u.insert<j)););}while(u.lookahead<K&&u.strm.avail_in!==0)}function ge(u,T){for(var R,z;;){if(u.lookahead<K){if(me(u),u.lookahead<K&&T===p)return y;if(u.lookahead===0)break}if(R=0,u.lookahead>=j&&(u.ins_h=(u.ins_h<<u.hash_shift^u.window[u.strstart+j-1])&u.hash_mask,R=u.prev[u.strstart&u.w_mask]=u.head[u.ins_h],u.head[u.ins_h]=u.strstart),R!==0&&u.strstart-R<=u.w_size-K&&(u.match_length=Y(u,R)),u.match_length>=j)if(z=o._tr_tally(u,u.strstart-u.match_start,u.match_length-j),u.lookahead-=u.match_length,u.match_length<=u.max_lazy_match&&u.lookahead>=j){for(u.match_length--;u.strstart++,u.ins_h=(u.ins_h<<u.hash_shift^u.window[u.strstart+j-1])&u.hash_mask,R=u.prev[u.strstart&u.w_mask]=u.head[u.ins_h],u.head[u.ins_h]=u.strstart,--u.match_length!=0;);u.strstart++}else u.strstart+=u.match_length,u.match_length=0,u.ins_h=u.window[u.strstart],u.ins_h=(u.ins_h<<u.hash_shift^u.window[u.strstart+1])&u.hash_mask;else z=o._tr_tally(u,0,u.window[u.strstart]),u.lookahead--,u.strstart++;if(z&&(I(u,!1),u.strm.avail_out===0))return y}return u.insert=u.strstart<j-1?u.strstart:j-1,T===h?(I(u,!0),u.strm.avail_out===0?te:B):u.last_lit&&(I(u,!1),u.strm.avail_out===0)?y:q}function de(u,T){for(var R,z,v;;){if(u.lookahead<K){if(me(u),u.lookahead<K&&T===p)return y;if(u.lookahead===0)break}if(R=0,u.lookahead>=j&&(u.ins_h=(u.ins_h<<u.hash_shift^u.window[u.strstart+j-1])&u.hash_mask,R=u.prev[u.strstart&u.w_mask]=u.head[u.ins_h],u.head[u.ins_h]=u.strstart),u.prev_length=u.match_length,u.prev_match=u.match_start,u.match_length=j-1,R!==0&&u.prev_length<u.max_lazy_match&&u.strstart-R<=u.w_size-K&&(u.match_length=Y(u,R),u.match_length<=5&&(u.strategy===1||u.match_length===j&&4096<u.strstart-u.match_start)&&(u.match_length=j-1)),u.prev_length>=j&&u.match_length<=u.prev_length){for(v=u.strstart+u.lookahead-j,z=o._tr_tally(u,u.strstart-1-u.prev_match,u.prev_length-j),u.lookahead-=u.prev_length-1,u.prev_length-=2;++u.strstart<=v&&(u.ins_h=(u.ins_h<<u.hash_shift^u.window[u.strstart+j-1])&u.hash_mask,R=u.prev[u.strstart&u.w_mask]=u.head[u.ins_h],u.head[u.ins_h]=u.strstart),--u.prev_length!=0;);if(u.match_available=0,u.match_length=j-1,u.strstart++,z&&(I(u,!1),u.strm.avail_out===0))return y}else if(u.match_available){if((z=o._tr_tally(u,0,u.window[u.strstart-1]))&&I(u,!1),u.strstart++,u.lookahead--,u.strm.avail_out===0)return y}else u.match_available=1,u.strstart++,u.lookahead--}return u.match_available&&(z=o._tr_tally(u,0,u.window[u.strstart-1]),u.match_available=0),u.insert=u.strstart<j-1?u.strstart:j-1,T===h?(I(u,!0),u.strm.avail_out===0?te:B):u.last_lit&&(I(u,!1),u.strm.avail_out===0)?y:q}function fe(u,T,R,z,v){this.good_length=u,this.max_lazy=T,this.nice_length=R,this.max_chain=z,this.func=v}function le(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=k,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new r.Buf16(2*_),this.dyn_dtree=new r.Buf16(2*(2*C+1)),this.bl_tree=new r.Buf16(2*(2*A+1)),ne(this.dyn_ltree),ne(this.dyn_dtree),ne(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new r.Buf16(D+1),this.heap=new r.Buf16(2*M+1),ne(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new r.Buf16(2*M+1),ne(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function se(u){var T;return u&&u.state?(u.total_in=u.total_out=0,u.data_type=w,(T=u.state).pending=0,T.pending_out=0,T.wrap<0&&(T.wrap=-T.wrap),T.status=T.wrap?E:O,u.adler=T.wrap===2?0:1,T.last_flush=p,o._tr_init(T),f):ie(u,g)}function ye(u){var T=se(u);return T===f&&(function(R){R.window_size=2*R.w_size,ne(R.head),R.max_lazy_match=i[R.level].max_lazy,R.good_match=i[R.level].good_length,R.nice_match=i[R.level].nice_length,R.max_chain_length=i[R.level].max_chain,R.strstart=0,R.block_start=0,R.lookahead=0,R.insert=0,R.match_length=R.prev_length=j-1,R.match_available=0,R.ins_h=0})(u.state),T}function pe(u,T,R,z,v,S){if(!u)return g;var $=1;if(T===m&&(T=6),z<0?($=0,z=-z):15<z&&($=2,z-=16),v<1||x<v||R!==k||z<8||15<z||T<0||9<T||S<0||b<S)return ie(u,g);z===8&&(z=9);var L=new le;return(u.state=L).strm=u,L.wrap=$,L.gzhead=null,L.w_bits=z,L.w_size=1<<L.w_bits,L.w_mask=L.w_size-1,L.hash_bits=v+7,L.hash_size=1<<L.hash_bits,L.hash_mask=L.hash_size-1,L.hash_shift=~~((L.hash_bits+j-1)/j),L.window=new r.Buf8(2*L.w_size),L.head=new r.Buf16(L.hash_size),L.prev=new r.Buf16(L.w_size),L.lit_bufsize=1<<v+6,L.pending_buf_size=4*L.lit_bufsize,L.pending_buf=new r.Buf8(L.pending_buf_size),L.d_buf=1*L.lit_bufsize,L.l_buf=3*L.lit_bufsize,L.level=T,L.strategy=S,L.method=R,ye(u)}i=[new fe(0,0,0,0,function(u,T){var R=65535;for(R>u.pending_buf_size-5&&(R=u.pending_buf_size-5);;){if(u.lookahead<=1){if(me(u),u.lookahead===0&&T===p)return y;if(u.lookahead===0)break}u.strstart+=u.lookahead,u.lookahead=0;var z=u.block_start+R;if((u.strstart===0||u.strstart>=z)&&(u.lookahead=u.strstart-z,u.strstart=z,I(u,!1),u.strm.avail_out===0)||u.strstart-u.block_start>=u.w_size-K&&(I(u,!1),u.strm.avail_out===0))return y}return u.insert=0,T===h?(I(u,!0),u.strm.avail_out===0?te:B):(u.strstart>u.block_start&&(I(u,!1),u.strm.avail_out),y)}),new fe(4,4,8,4,ge),new fe(4,5,16,8,ge),new fe(4,6,32,32,ge),new fe(4,4,16,16,de),new fe(8,16,32,32,de),new fe(8,16,128,128,de),new fe(8,32,128,256,de),new fe(32,128,258,1024,de),new fe(32,258,258,4096,de)],s.deflateInit=function(u,T){return pe(u,T,k,15,8,0)},s.deflateInit2=pe,s.deflateReset=ye,s.deflateResetKeep=se,s.deflateSetHeader=function(u,T){return u&&u.state?u.state.wrap!==2?g:(u.state.gzhead=T,f):g},s.deflate=function(u,T){var R,z,v,S;if(!u||!u.state||5<T||T<0)return u?ie(u,g):g;if(z=u.state,!u.output||!u.input&&u.avail_in!==0||z.status===666&&T!==h)return ie(u,u.avail_out===0?-5:g);if(z.strm=u,R=z.last_flush,z.last_flush=T,z.status===E)if(z.wrap===2)u.adler=0,re(z,31),re(z,139),re(z,8),z.gzhead?(re(z,(z.gzhead.text?1:0)+(z.gzhead.hcrc?2:0)+(z.gzhead.extra?4:0)+(z.gzhead.name?8:0)+(z.gzhead.comment?16:0)),re(z,255&z.gzhead.time),re(z,z.gzhead.time>>8&255),re(z,z.gzhead.time>>16&255),re(z,z.gzhead.time>>24&255),re(z,z.level===9?2:2<=z.strategy||z.level<2?4:0),re(z,255&z.gzhead.os),z.gzhead.extra&&z.gzhead.extra.length&&(re(z,255&z.gzhead.extra.length),re(z,z.gzhead.extra.length>>8&255)),z.gzhead.hcrc&&(u.adler=l(u.adler,z.pending_buf,z.pending,0)),z.gzindex=0,z.status=69):(re(z,0),re(z,0),re(z,0),re(z,0),re(z,0),re(z,z.level===9?2:2<=z.strategy||z.level<2?4:0),re(z,3),z.status=O);else{var $=k+(z.w_bits-8<<4)<<8;$|=(2<=z.strategy||z.level<2?0:z.level<6?1:z.level===6?2:3)<<6,z.strstart!==0&&($|=32),$+=31-$%31,z.status=O,V(z,$),z.strstart!==0&&(V(z,u.adler>>>16),V(z,65535&u.adler)),u.adler=1}if(z.status===69)if(z.gzhead.extra){for(v=z.pending;z.gzindex<(65535&z.gzhead.extra.length)&&(z.pending!==z.pending_buf_size||(z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),N(u),v=z.pending,z.pending!==z.pending_buf_size));)re(z,255&z.gzhead.extra[z.gzindex]),z.gzindex++;z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),z.gzindex===z.gzhead.extra.length&&(z.gzindex=0,z.status=73)}else z.status=73;if(z.status===73)if(z.gzhead.name){v=z.pending;do{if(z.pending===z.pending_buf_size&&(z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),N(u),v=z.pending,z.pending===z.pending_buf_size)){S=1;break}S=z.gzindex<z.gzhead.name.length?255&z.gzhead.name.charCodeAt(z.gzindex++):0,re(z,S)}while(S!==0);z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),S===0&&(z.gzindex=0,z.status=91)}else z.status=91;if(z.status===91)if(z.gzhead.comment){v=z.pending;do{if(z.pending===z.pending_buf_size&&(z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),N(u),v=z.pending,z.pending===z.pending_buf_size)){S=1;break}S=z.gzindex<z.gzhead.comment.length?255&z.gzhead.comment.charCodeAt(z.gzindex++):0,re(z,S)}while(S!==0);z.gzhead.hcrc&&z.pending>v&&(u.adler=l(u.adler,z.pending_buf,z.pending-v,v)),S===0&&(z.status=103)}else z.status=103;if(z.status===103&&(z.gzhead.hcrc?(z.pending+2>z.pending_buf_size&&N(u),z.pending+2<=z.pending_buf_size&&(re(z,255&u.adler),re(z,u.adler>>8&255),u.adler=0,z.status=O)):z.status=O),z.pending!==0){if(N(u),u.avail_out===0)return z.last_flush=-1,f}else if(u.avail_in===0&&X(T)<=X(R)&&T!==h)return ie(u,-5);if(z.status===666&&u.avail_in!==0)return ie(u,-5);if(u.avail_in!==0||z.lookahead!==0||T!==p&&z.status!==666){var L=z.strategy===2?(function(P,F){for(var U;;){if(P.lookahead===0&&(me(P),P.lookahead===0)){if(F===p)return y;break}if(P.match_length=0,U=o._tr_tally(P,0,P.window[P.strstart]),P.lookahead--,P.strstart++,U&&(I(P,!1),P.strm.avail_out===0))return y}return P.insert=0,F===h?(I(P,!0),P.strm.avail_out===0?te:B):P.last_lit&&(I(P,!1),P.strm.avail_out===0)?y:q})(z,T):z.strategy===3?(function(P,F){for(var U,Z,Q,ue,ae=P.window;;){if(P.lookahead<=W){if(me(P),P.lookahead<=W&&F===p)return y;if(P.lookahead===0)break}if(P.match_length=0,P.lookahead>=j&&0<P.strstart&&(Z=ae[Q=P.strstart-1])===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]){ue=P.strstart+W;do;while(Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Q<ue);P.match_length=W-(ue-Q),P.match_length>P.lookahead&&(P.match_length=P.lookahead)}if(P.match_length>=j?(U=o._tr_tally(P,1,P.match_length-j),P.lookahead-=P.match_length,P.strstart+=P.match_length,P.match_length=0):(U=o._tr_tally(P,0,P.window[P.strstart]),P.lookahead--,P.strstart++),U&&(I(P,!1),P.strm.avail_out===0))return y}return P.insert=0,F===h?(I(P,!0),P.strm.avail_out===0?te:B):P.last_lit&&(I(P,!1),P.strm.avail_out===0)?y:q})(z,T):i[z.level].func(z,T);if(L!==te&&L!==B||(z.status=666),L===y||L===te)return u.avail_out===0&&(z.last_flush=-1),f;if(L===q&&(T===1?o._tr_align(z):T!==5&&(o._tr_stored_block(z,0,0,!1),T===3&&(ne(z.head),z.lookahead===0&&(z.strstart=0,z.block_start=0,z.insert=0))),N(u),u.avail_out===0))return z.last_flush=-1,f}return T!==h?f:z.wrap<=0?1:(z.wrap===2?(re(z,255&u.adler),re(z,u.adler>>8&255),re(z,u.adler>>16&255),re(z,u.adler>>24&255),re(z,255&u.total_in),re(z,u.total_in>>8&255),re(z,u.total_in>>16&255),re(z,u.total_in>>24&255)):(V(z,u.adler>>>16),V(z,65535&u.adler)),N(u),0<z.wrap&&(z.wrap=-z.wrap),z.pending!==0?f:1)},s.deflateEnd=function(u){var T;return u&&u.state?(T=u.state.status)!==E&&T!==69&&T!==73&&T!==91&&T!==103&&T!==O&&T!==666?ie(u,g):(u.state=null,T===O?ie(u,-3):f):g},s.deflateSetDictionary=function(u,T){var R,z,v,S,$,L,P,F,U=T.length;if(!u||!u.state||(S=(R=u.state).wrap)===2||S===1&&R.status!==E||R.lookahead)return g;for(S===1&&(u.adler=c(u.adler,T,U,0)),R.wrap=0,U>=R.w_size&&(S===0&&(ne(R.head),R.strstart=0,R.block_start=0,R.insert=0),F=new r.Buf8(R.w_size),r.arraySet(F,T,U-R.w_size,R.w_size,0),T=F,U=R.w_size),$=u.avail_in,L=u.next_in,P=u.input,u.avail_in=U,u.next_in=0,u.input=T,me(R);R.lookahead>=j;){for(z=R.strstart,v=R.lookahead-(j-1);R.ins_h=(R.ins_h<<R.hash_shift^R.window[z+j-1])&R.hash_mask,R.prev[z&R.w_mask]=R.head[R.ins_h],R.head[R.ins_h]=z,z++,--v;);R.strstart=z,R.lookahead=j-1,me(R)}return R.strstart+=R.lookahead,R.block_start=R.strstart,R.insert=R.lookahead,R.lookahead=0,R.match_length=R.prev_length=j-1,R.match_available=0,u.next_in=L,u.input=P,u.avail_in=$,R.wrap=S,f},s.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(a,n,s){n.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(a,n,s){n.exports=function(i,r){var o,c,l,d,p,h,f,g,m,b,w,k,x,M,C,A,_,D,j,W,K,E,O,y,q;o=i.state,c=i.next_in,y=i.input,l=c+(i.avail_in-5),d=i.next_out,q=i.output,p=d-(r-i.avail_out),h=d+(i.avail_out-257),f=o.dmax,g=o.wsize,m=o.whave,b=o.wnext,w=o.window,k=o.hold,x=o.bits,M=o.lencode,C=o.distcode,A=(1<<o.lenbits)-1,_=(1<<o.distbits)-1;e:do{x<15&&(k+=y[c++]<<x,x+=8,k+=y[c++]<<x,x+=8),D=M[k&A];t:for(;;){if(k>>>=j=D>>>24,x-=j,(j=D>>>16&255)===0)q[d++]=65535&D;else{if(!(16&j)){if((64&j)==0){D=M[(65535&D)+(k&(1<<j)-1)];continue t}if(32&j){o.mode=12;break e}i.msg="invalid literal/length code",o.mode=30;break e}W=65535&D,(j&=15)&&(x<j&&(k+=y[c++]<<x,x+=8),W+=k&(1<<j)-1,k>>>=j,x-=j),x<15&&(k+=y[c++]<<x,x+=8,k+=y[c++]<<x,x+=8),D=C[k&_];a:for(;;){if(k>>>=j=D>>>24,x-=j,!(16&(j=D>>>16&255))){if((64&j)==0){D=C[(65535&D)+(k&(1<<j)-1)];continue a}i.msg="invalid distance code",o.mode=30;break e}if(K=65535&D,x<(j&=15)&&(k+=y[c++]<<x,(x+=8)<j&&(k+=y[c++]<<x,x+=8)),f<(K+=k&(1<<j)-1)){i.msg="invalid distance too far back",o.mode=30;break e}if(k>>>=j,x-=j,(j=d-p)<K){if(m<(j=K-j)&&o.sane){i.msg="invalid distance too far back",o.mode=30;break e}if(O=w,(E=0)===b){if(E+=g-j,j<W){for(W-=j;q[d++]=w[E++],--j;);E=d-K,O=q}}else if(b<j){if(E+=g+b-j,(j-=b)<W){for(W-=j;q[d++]=w[E++],--j;);if(E=0,b<W){for(W-=j=b;q[d++]=w[E++],--j;);E=d-K,O=q}}}else if(E+=b-j,j<W){for(W-=j;q[d++]=w[E++],--j;);E=d-K,O=q}for(;2<W;)q[d++]=O[E++],q[d++]=O[E++],q[d++]=O[E++],W-=3;W&&(q[d++]=O[E++],1<W&&(q[d++]=O[E++]))}else{for(E=d-K;q[d++]=q[E++],q[d++]=q[E++],q[d++]=q[E++],2<(W-=3););W&&(q[d++]=q[E++],1<W&&(q[d++]=q[E++]))}break}}break}}while(c<l&&d<h);c-=W=x>>3,k&=(1<<(x-=W<<3))-1,i.next_in=c,i.next_out=d,i.avail_in=c<l?l-c+5:5-(c-l),i.avail_out=d<h?h-d+257:257-(d-h),o.hold=k,o.bits=x}},{}],49:[function(a,n,s){var i=a("../utils/common"),r=a("./adler32"),o=a("./crc32"),c=a("./inffast"),l=a("./inftrees"),d=1,p=2,h=0,f=-2,g=1,m=852,b=592;function w(E){return(E>>>24&255)+(E>>>8&65280)+((65280&E)<<8)+((255&E)<<24)}function k(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new i.Buf16(320),this.work=new i.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function x(E){var O;return E&&E.state?(O=E.state,E.total_in=E.total_out=O.total=0,E.msg="",O.wrap&&(E.adler=1&O.wrap),O.mode=g,O.last=0,O.havedict=0,O.dmax=32768,O.head=null,O.hold=0,O.bits=0,O.lencode=O.lendyn=new i.Buf32(m),O.distcode=O.distdyn=new i.Buf32(b),O.sane=1,O.back=-1,h):f}function M(E){var O;return E&&E.state?((O=E.state).wsize=0,O.whave=0,O.wnext=0,x(E)):f}function C(E,O){var y,q;return E&&E.state?(q=E.state,O<0?(y=0,O=-O):(y=1+(O>>4),O<48&&(O&=15)),O&&(O<8||15<O)?f:(q.window!==null&&q.wbits!==O&&(q.window=null),q.wrap=y,q.wbits=O,M(E))):f}function A(E,O){var y,q;return E?(q=new k,(E.state=q).window=null,(y=C(E,O))!==h&&(E.state=null),y):f}var _,D,j=!0;function W(E){if(j){var O;for(_=new i.Buf32(512),D=new i.Buf32(32),O=0;O<144;)E.lens[O++]=8;for(;O<256;)E.lens[O++]=9;for(;O<280;)E.lens[O++]=7;for(;O<288;)E.lens[O++]=8;for(l(d,E.lens,0,288,_,0,E.work,{bits:9}),O=0;O<32;)E.lens[O++]=5;l(p,E.lens,0,32,D,0,E.work,{bits:5}),j=!1}E.lencode=_,E.lenbits=9,E.distcode=D,E.distbits=5}function K(E,O,y,q){var te,B=E.state;return B.window===null&&(B.wsize=1<<B.wbits,B.wnext=0,B.whave=0,B.window=new i.Buf8(B.wsize)),q>=B.wsize?(i.arraySet(B.window,O,y-B.wsize,B.wsize,0),B.wnext=0,B.whave=B.wsize):(q<(te=B.wsize-B.wnext)&&(te=q),i.arraySet(B.window,O,y-q,te,B.wnext),(q-=te)?(i.arraySet(B.window,O,y-q,q,0),B.wnext=q,B.whave=B.wsize):(B.wnext+=te,B.wnext===B.wsize&&(B.wnext=0),B.whave<B.wsize&&(B.whave+=te))),0}s.inflateReset=M,s.inflateReset2=C,s.inflateResetKeep=x,s.inflateInit=function(E){return A(E,15)},s.inflateInit2=A,s.inflate=function(E,O){var y,q,te,B,ie,X,ne,N,I,re,V,Y,me,ge,de,fe,le,se,ye,pe,u,T,R,z,v=0,S=new i.Buf8(4),$=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!E||!E.state||!E.output||!E.input&&E.avail_in!==0)return f;(y=E.state).mode===12&&(y.mode=13),ie=E.next_out,te=E.output,ne=E.avail_out,B=E.next_in,q=E.input,X=E.avail_in,N=y.hold,I=y.bits,re=X,V=ne,T=h;e:for(;;)switch(y.mode){case g:if(y.wrap===0){y.mode=13;break}for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(2&y.wrap&&N===35615){S[y.check=0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0),I=N=0,y.mode=2;break}if(y.flags=0,y.head&&(y.head.done=!1),!(1&y.wrap)||(((255&N)<<8)+(N>>8))%31){E.msg="incorrect header check",y.mode=30;break}if((15&N)!=8){E.msg="unknown compression method",y.mode=30;break}if(I-=4,u=8+(15&(N>>>=4)),y.wbits===0)y.wbits=u;else if(u>y.wbits){E.msg="invalid window size",y.mode=30;break}y.dmax=1<<u,E.adler=y.check=1,y.mode=512&N?10:12,I=N=0;break;case 2:for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(y.flags=N,(255&y.flags)!=8){E.msg="unknown compression method",y.mode=30;break}if(57344&y.flags){E.msg="unknown header flags set",y.mode=30;break}y.head&&(y.head.text=N>>8&1),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0,y.mode=3;case 3:for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.head&&(y.head.time=N),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,S[2]=N>>>16&255,S[3]=N>>>24&255,y.check=o(y.check,S,4,0)),I=N=0,y.mode=4;case 4:for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.head&&(y.head.xflags=255&N,y.head.os=N>>8),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0,y.mode=5;case 5:if(1024&y.flags){for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.length=N,y.head&&(y.head.extra_len=N),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0}else y.head&&(y.head.extra=null);y.mode=6;case 6:if(1024&y.flags&&(X<(Y=y.length)&&(Y=X),Y&&(y.head&&(u=y.head.extra_len-y.length,y.head.extra||(y.head.extra=new Array(y.head.extra_len)),i.arraySet(y.head.extra,q,B,Y,u)),512&y.flags&&(y.check=o(y.check,q,Y,B)),X-=Y,B+=Y,y.length-=Y),y.length))break e;y.length=0,y.mode=7;case 7:if(2048&y.flags){if(X===0)break e;for(Y=0;u=q[B+Y++],y.head&&u&&y.length<65536&&(y.head.name+=String.fromCharCode(u)),u&&Y<X;);if(512&y.flags&&(y.check=o(y.check,q,Y,B)),X-=Y,B+=Y,u)break e}else y.head&&(y.head.name=null);y.length=0,y.mode=8;case 8:if(4096&y.flags){if(X===0)break e;for(Y=0;u=q[B+Y++],y.head&&u&&y.length<65536&&(y.head.comment+=String.fromCharCode(u)),u&&Y<X;);if(512&y.flags&&(y.check=o(y.check,q,Y,B)),X-=Y,B+=Y,u)break e}else y.head&&(y.head.comment=null);y.mode=9;case 9:if(512&y.flags){for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N!==(65535&y.check)){E.msg="header crc mismatch",y.mode=30;break}I=N=0}y.head&&(y.head.hcrc=y.flags>>9&1,y.head.done=!0),E.adler=y.check=0,y.mode=12;break;case 10:for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}E.adler=y.check=w(N),I=N=0,y.mode=11;case 11:if(y.havedict===0)return E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,2;E.adler=y.check=1,y.mode=12;case 12:if(O===5||O===6)break e;case 13:if(y.last){N>>>=7&I,I-=7&I,y.mode=27;break}for(;I<3;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}switch(y.last=1&N,I-=1,3&(N>>>=1)){case 0:y.mode=14;break;case 1:if(W(y),y.mode=20,O!==6)break;N>>>=2,I-=2;break e;case 2:y.mode=17;break;case 3:E.msg="invalid block type",y.mode=30}N>>>=2,I-=2;break;case 14:for(N>>>=7&I,I-=7&I;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if((65535&N)!=(N>>>16^65535)){E.msg="invalid stored block lengths",y.mode=30;break}if(y.length=65535&N,I=N=0,y.mode=15,O===6)break e;case 15:y.mode=16;case 16:if(Y=y.length){if(X<Y&&(Y=X),ne<Y&&(Y=ne),Y===0)break e;i.arraySet(te,q,B,Y,ie),X-=Y,B+=Y,ne-=Y,ie+=Y,y.length-=Y;break}y.mode=12;break;case 17:for(;I<14;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(y.nlen=257+(31&N),N>>>=5,I-=5,y.ndist=1+(31&N),N>>>=5,I-=5,y.ncode=4+(15&N),N>>>=4,I-=4,286<y.nlen||30<y.ndist){E.msg="too many length or distance symbols",y.mode=30;break}y.have=0,y.mode=18;case 18:for(;y.have<y.ncode;){for(;I<3;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.lens[$[y.have++]]=7&N,N>>>=3,I-=3}for(;y.have<19;)y.lens[$[y.have++]]=0;if(y.lencode=y.lendyn,y.lenbits=7,R={bits:y.lenbits},T=l(0,y.lens,0,19,y.lencode,0,y.work,R),y.lenbits=R.bits,T){E.msg="invalid code lengths set",y.mode=30;break}y.have=0,y.mode=19;case 19:for(;y.have<y.nlen+y.ndist;){for(;fe=(v=y.lencode[N&(1<<y.lenbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(le<16)N>>>=de,I-=de,y.lens[y.have++]=le;else{if(le===16){for(z=de+2;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N>>>=de,I-=de,y.have===0){E.msg="invalid bit length repeat",y.mode=30;break}u=y.lens[y.have-1],Y=3+(3&N),N>>>=2,I-=2}else if(le===17){for(z=de+3;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}I-=de,u=0,Y=3+(7&(N>>>=de)),N>>>=3,I-=3}else{for(z=de+7;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}I-=de,u=0,Y=11+(127&(N>>>=de)),N>>>=7,I-=7}if(y.have+Y>y.nlen+y.ndist){E.msg="invalid bit length repeat",y.mode=30;break}for(;Y--;)y.lens[y.have++]=u}}if(y.mode===30)break;if(y.lens[256]===0){E.msg="invalid code -- missing end-of-block",y.mode=30;break}if(y.lenbits=9,R={bits:y.lenbits},T=l(d,y.lens,0,y.nlen,y.lencode,0,y.work,R),y.lenbits=R.bits,T){E.msg="invalid literal/lengths set",y.mode=30;break}if(y.distbits=6,y.distcode=y.distdyn,R={bits:y.distbits},T=l(p,y.lens,y.nlen,y.ndist,y.distcode,0,y.work,R),y.distbits=R.bits,T){E.msg="invalid distances set",y.mode=30;break}if(y.mode=20,O===6)break e;case 20:y.mode=21;case 21:if(6<=X&&258<=ne){E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,c(E,V),ie=E.next_out,te=E.output,ne=E.avail_out,B=E.next_in,q=E.input,X=E.avail_in,N=y.hold,I=y.bits,y.mode===12&&(y.back=-1);break}for(y.back=0;fe=(v=y.lencode[N&(1<<y.lenbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(fe&&(240&fe)==0){for(se=de,ye=fe,pe=le;fe=(v=y.lencode[pe+((N&(1<<se+ye)-1)>>se)])>>>16&255,le=65535&v,!(se+(de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}N>>>=se,I-=se,y.back+=se}if(N>>>=de,I-=de,y.back+=de,y.length=le,fe===0){y.mode=26;break}if(32&fe){y.back=-1,y.mode=12;break}if(64&fe){E.msg="invalid literal/length code",y.mode=30;break}y.extra=15&fe,y.mode=22;case 22:if(y.extra){for(z=y.extra;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.length+=N&(1<<y.extra)-1,N>>>=y.extra,I-=y.extra,y.back+=y.extra}y.was=y.length,y.mode=23;case 23:for(;fe=(v=y.distcode[N&(1<<y.distbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if((240&fe)==0){for(se=de,ye=fe,pe=le;fe=(v=y.distcode[pe+((N&(1<<se+ye)-1)>>se)])>>>16&255,le=65535&v,!(se+(de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}N>>>=se,I-=se,y.back+=se}if(N>>>=de,I-=de,y.back+=de,64&fe){E.msg="invalid distance code",y.mode=30;break}y.offset=le,y.extra=15&fe,y.mode=24;case 24:if(y.extra){for(z=y.extra;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.offset+=N&(1<<y.extra)-1,N>>>=y.extra,I-=y.extra,y.back+=y.extra}if(y.offset>y.dmax){E.msg="invalid distance too far back",y.mode=30;break}y.mode=25;case 25:if(ne===0)break e;if(Y=V-ne,y.offset>Y){if((Y=y.offset-Y)>y.whave&&y.sane){E.msg="invalid distance too far back",y.mode=30;break}me=Y>y.wnext?(Y-=y.wnext,y.wsize-Y):y.wnext-Y,Y>y.length&&(Y=y.length),ge=y.window}else ge=te,me=ie-y.offset,Y=y.length;for(ne<Y&&(Y=ne),ne-=Y,y.length-=Y;te[ie++]=ge[me++],--Y;);y.length===0&&(y.mode=21);break;case 26:if(ne===0)break e;te[ie++]=y.length,ne--,y.mode=21;break;case 27:if(y.wrap){for(;I<32;){if(X===0)break e;X--,N|=q[B++]<<I,I+=8}if(V-=ne,E.total_out+=V,y.total+=V,V&&(E.adler=y.check=y.flags?o(y.check,te,V,ie-V):r(y.check,te,V,ie-V)),V=ne,(y.flags?N:w(N))!==y.check){E.msg="incorrect data check",y.mode=30;break}I=N=0}y.mode=28;case 28:if(y.wrap&&y.flags){for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N!==(4294967295&y.total)){E.msg="incorrect length check",y.mode=30;break}I=N=0}y.mode=29;case 29:T=1;break e;case 30:T=-3;break e;case 31:return-4;default:return f}return E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,(y.wsize||V!==E.avail_out&&y.mode<30&&(y.mode<27||O!==4))&&K(E,E.output,E.next_out,V-E.avail_out)?(y.mode=31,-4):(re-=E.avail_in,V-=E.avail_out,E.total_in+=re,E.total_out+=V,y.total+=V,y.wrap&&V&&(E.adler=y.check=y.flags?o(y.check,te,V,E.next_out-V):r(y.check,te,V,E.next_out-V)),E.data_type=y.bits+(y.last?64:0)+(y.mode===12?128:0)+(y.mode===20||y.mode===15?256:0),(re==0&&V===0||O===4)&&T===h&&(T=-5),T)},s.inflateEnd=function(E){if(!E||!E.state)return f;var O=E.state;return O.window&&(O.window=null),E.state=null,h},s.inflateGetHeader=function(E,O){var y;return E&&E.state?(2&(y=E.state).wrap)==0?f:((y.head=O).done=!1,h):f},s.inflateSetDictionary=function(E,O){var y,q=O.length;return E&&E.state?(y=E.state).wrap!==0&&y.mode!==11?f:y.mode===11&&r(1,O,q,0)!==y.check?-3:K(E,O,q,q)?(y.mode=31,-4):(y.havedict=1,h):f},s.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(a,n,s){var i=a("../utils/common"),r=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],o=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],c=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],l=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];n.exports=function(d,p,h,f,g,m,b,w){var k,x,M,C,A,_,D,j,W,K=w.bits,E=0,O=0,y=0,q=0,te=0,B=0,ie=0,X=0,ne=0,N=0,I=null,re=0,V=new i.Buf16(16),Y=new i.Buf16(16),me=null,ge=0;for(E=0;E<=15;E++)V[E]=0;for(O=0;O<f;O++)V[p[h+O]]++;for(te=K,q=15;1<=q&&V[q]===0;q--);if(q<te&&(te=q),q===0)return g[m++]=20971520,g[m++]=20971520,w.bits=1,0;for(y=1;y<q&&V[y]===0;y++);for(te<y&&(te=y),E=X=1;E<=15;E++)if(X<<=1,(X-=V[E])<0)return-1;if(0<X&&(d===0||q!==1))return-1;for(Y[1]=0,E=1;E<15;E++)Y[E+1]=Y[E]+V[E];for(O=0;O<f;O++)p[h+O]!==0&&(b[Y[p[h+O]]++]=O);if(_=d===0?(I=me=b,19):d===1?(I=r,re-=257,me=o,ge-=257,256):(I=c,me=l,-1),E=y,A=m,ie=O=N=0,M=-1,C=(ne=1<<(B=te))-1,d===1&&852<ne||d===2&&592<ne)return 1;for(;;){for(D=E-ie,W=b[O]<_?(j=0,b[O]):b[O]>_?(j=me[ge+b[O]],I[re+b[O]]):(j=96,0),k=1<<E-ie,y=x=1<<B;g[A+(N>>ie)+(x-=k)]=D<<24|j<<16|W|0,x!==0;);for(k=1<<E-1;N&k;)k>>=1;if(k!==0?(N&=k-1,N+=k):N=0,O++,--V[E]==0){if(E===q)break;E=p[h+b[O]]}if(te<E&&(N&C)!==M){for(ie===0&&(ie=te),A+=y,X=1<<(B=E-ie);B+ie<q&&!((X-=V[B+ie])<=0);)B++,X<<=1;if(ne+=1<<B,d===1&&852<ne||d===2&&592<ne)return 1;g[M=N&C]=te<<24|B<<16|A-m|0}}return N!==0&&(g[A+N]=E-ie<<24|64<<16|0),w.bits=te,0}},{"../utils/common":41}],51:[function(a,n,s){n.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(a,n,s){var i=a("../utils/common"),r=0,o=1;function c(v){for(var S=v.length;0<=--S;)v[S]=0}var l=0,d=29,p=256,h=p+1+d,f=30,g=19,m=2*h+1,b=15,w=16,k=7,x=256,M=16,C=17,A=18,_=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],D=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],j=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],W=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],K=new Array(2*(h+2));c(K);var E=new Array(2*f);c(E);var O=new Array(512);c(O);var y=new Array(256);c(y);var q=new Array(d);c(q);var te,B,ie,X=new Array(f);function ne(v,S,$,L,P){this.static_tree=v,this.extra_bits=S,this.extra_base=$,this.elems=L,this.max_length=P,this.has_stree=v&&v.length}function N(v,S){this.dyn_tree=v,this.max_code=0,this.stat_desc=S}function I(v){return v<256?O[v]:O[256+(v>>>7)]}function re(v,S){v.pending_buf[v.pending++]=255&S,v.pending_buf[v.pending++]=S>>>8&255}function V(v,S,$){v.bi_valid>w-$?(v.bi_buf|=S<<v.bi_valid&65535,re(v,v.bi_buf),v.bi_buf=S>>w-v.bi_valid,v.bi_valid+=$-w):(v.bi_buf|=S<<v.bi_valid&65535,v.bi_valid+=$)}function Y(v,S,$){V(v,$[2*S],$[2*S+1])}function me(v,S){for(var $=0;$|=1&v,v>>>=1,$<<=1,0<--S;);return $>>>1}function ge(v,S,$){var L,P,F=new Array(b+1),U=0;for(L=1;L<=b;L++)F[L]=U=U+$[L-1]<<1;for(P=0;P<=S;P++){var Z=v[2*P+1];Z!==0&&(v[2*P]=me(F[Z]++,Z))}}function de(v){var S;for(S=0;S<h;S++)v.dyn_ltree[2*S]=0;for(S=0;S<f;S++)v.dyn_dtree[2*S]=0;for(S=0;S<g;S++)v.bl_tree[2*S]=0;v.dyn_ltree[2*x]=1,v.opt_len=v.static_len=0,v.last_lit=v.matches=0}function fe(v){8<v.bi_valid?re(v,v.bi_buf):0<v.bi_valid&&(v.pending_buf[v.pending++]=v.bi_buf),v.bi_buf=0,v.bi_valid=0}function le(v,S,$,L){var P=2*S,F=2*$;return v[P]<v[F]||v[P]===v[F]&&L[S]<=L[$]}function se(v,S,$){for(var L=v.heap[$],P=$<<1;P<=v.heap_len&&(P<v.heap_len&&le(S,v.heap[P+1],v.heap[P],v.depth)&&P++,!le(S,L,v.heap[P],v.depth));)v.heap[$]=v.heap[P],$=P,P<<=1;v.heap[$]=L}function ye(v,S,$){var L,P,F,U,Z=0;if(v.last_lit!==0)for(;L=v.pending_buf[v.d_buf+2*Z]<<8|v.pending_buf[v.d_buf+2*Z+1],P=v.pending_buf[v.l_buf+Z],Z++,L===0?Y(v,P,S):(Y(v,(F=y[P])+p+1,S),(U=_[F])!==0&&V(v,P-=q[F],U),Y(v,F=I(--L),$),(U=D[F])!==0&&V(v,L-=X[F],U)),Z<v.last_lit;);Y(v,x,S)}function pe(v,S){var $,L,P,F=S.dyn_tree,U=S.stat_desc.static_tree,Z=S.stat_desc.has_stree,Q=S.stat_desc.elems,ue=-1;for(v.heap_len=0,v.heap_max=m,$=0;$<Q;$++)F[2*$]!==0?(v.heap[++v.heap_len]=ue=$,v.depth[$]=0):F[2*$+1]=0;for(;v.heap_len<2;)F[2*(P=v.heap[++v.heap_len]=ue<2?++ue:0)]=1,v.depth[P]=0,v.opt_len--,Z&&(v.static_len-=U[2*P+1]);for(S.max_code=ue,$=v.heap_len>>1;1<=$;$--)se(v,F,$);for(P=Q;$=v.heap[1],v.heap[1]=v.heap[v.heap_len--],se(v,F,1),L=v.heap[1],v.heap[--v.heap_max]=$,v.heap[--v.heap_max]=L,F[2*P]=F[2*$]+F[2*L],v.depth[P]=(v.depth[$]>=v.depth[L]?v.depth[$]:v.depth[L])+1,F[2*$+1]=F[2*L+1]=P,v.heap[1]=P++,se(v,F,1),2<=v.heap_len;);v.heap[--v.heap_max]=v.heap[1],(function(ae,be){var Ne,Ce,wt,we,Nt,xa,De=be.dyn_tree,vn=be.max_code,Es=be.stat_desc.static_tree,Cs=be.stat_desc.has_stree,Ps=be.stat_desc.extra_bits,xn=be.stat_desc.extra_base,kt=be.stat_desc.max_length,Lt=0;for(we=0;we<=b;we++)ae.bl_count[we]=0;for(De[2*ae.heap[ae.heap_max]+1]=0,Ne=ae.heap_max+1;Ne<m;Ne++)kt<(we=De[2*De[2*(Ce=ae.heap[Ne])+1]+1]+1)&&(we=kt,Lt++),De[2*Ce+1]=we,vn<Ce||(ae.bl_count[we]++,Nt=0,xn<=Ce&&(Nt=Ps[Ce-xn]),xa=De[2*Ce],ae.opt_len+=xa*(we+Nt),Cs&&(ae.static_len+=xa*(Es[2*Ce+1]+Nt)));if(Lt!==0){do{for(we=kt-1;ae.bl_count[we]===0;)we--;ae.bl_count[we]--,ae.bl_count[we+1]+=2,ae.bl_count[kt]--,Lt-=2}while(0<Lt);for(we=kt;we!==0;we--)for(Ce=ae.bl_count[we];Ce!==0;)vn<(wt=ae.heap[--Ne])||(De[2*wt+1]!==we&&(ae.opt_len+=(we-De[2*wt+1])*De[2*wt],De[2*wt+1]=we),Ce--)}})(v,S),ge(F,ue,v.bl_count)}function u(v,S,$){var L,P,F=-1,U=S[1],Z=0,Q=7,ue=4;for(U===0&&(Q=138,ue=3),S[2*($+1)+1]=65535,L=0;L<=$;L++)P=U,U=S[2*(L+1)+1],++Z<Q&&P===U||(Z<ue?v.bl_tree[2*P]+=Z:P!==0?(P!==F&&v.bl_tree[2*P]++,v.bl_tree[2*M]++):Z<=10?v.bl_tree[2*C]++:v.bl_tree[2*A]++,F=P,ue=(Z=0)===U?(Q=138,3):P===U?(Q=6,3):(Q=7,4))}function T(v,S,$){var L,P,F=-1,U=S[1],Z=0,Q=7,ue=4;for(U===0&&(Q=138,ue=3),L=0;L<=$;L++)if(P=U,U=S[2*(L+1)+1],!(++Z<Q&&P===U)){if(Z<ue)for(;Y(v,P,v.bl_tree),--Z!=0;);else P!==0?(P!==F&&(Y(v,P,v.bl_tree),Z--),Y(v,M,v.bl_tree),V(v,Z-3,2)):Z<=10?(Y(v,C,v.bl_tree),V(v,Z-3,3)):(Y(v,A,v.bl_tree),V(v,Z-11,7));F=P,ue=(Z=0)===U?(Q=138,3):P===U?(Q=6,3):(Q=7,4)}}c(X);var R=!1;function z(v,S,$,L){V(v,(l<<1)+(L?1:0),3),(function(P,F,U,Z){fe(P),re(P,U),re(P,~U),i.arraySet(P.pending_buf,P.window,F,U,P.pending),P.pending+=U})(v,S,$)}s._tr_init=function(v){R||((function(){var S,$,L,P,F,U=new Array(b+1);for(P=L=0;P<d-1;P++)for(q[P]=L,S=0;S<1<<_[P];S++)y[L++]=P;for(y[L-1]=P,P=F=0;P<16;P++)for(X[P]=F,S=0;S<1<<D[P];S++)O[F++]=P;for(F>>=7;P<f;P++)for(X[P]=F<<7,S=0;S<1<<D[P]-7;S++)O[256+F++]=P;for($=0;$<=b;$++)U[$]=0;for(S=0;S<=143;)K[2*S+1]=8,S++,U[8]++;for(;S<=255;)K[2*S+1]=9,S++,U[9]++;for(;S<=279;)K[2*S+1]=7,S++,U[7]++;for(;S<=287;)K[2*S+1]=8,S++,U[8]++;for(ge(K,h+1,U),S=0;S<f;S++)E[2*S+1]=5,E[2*S]=me(S,5);te=new ne(K,_,p+1,h,b),B=new ne(E,D,0,f,b),ie=new ne(new Array(0),j,0,g,k)})(),R=!0),v.l_desc=new N(v.dyn_ltree,te),v.d_desc=new N(v.dyn_dtree,B),v.bl_desc=new N(v.bl_tree,ie),v.bi_buf=0,v.bi_valid=0,de(v)},s._tr_stored_block=z,s._tr_flush_block=function(v,S,$,L){var P,F,U=0;0<v.level?(v.strm.data_type===2&&(v.strm.data_type=(function(Z){var Q,ue=4093624447;for(Q=0;Q<=31;Q++,ue>>>=1)if(1&ue&&Z.dyn_ltree[2*Q]!==0)return r;if(Z.dyn_ltree[18]!==0||Z.dyn_ltree[20]!==0||Z.dyn_ltree[26]!==0)return o;for(Q=32;Q<p;Q++)if(Z.dyn_ltree[2*Q]!==0)return o;return r})(v)),pe(v,v.l_desc),pe(v,v.d_desc),U=(function(Z){var Q;for(u(Z,Z.dyn_ltree,Z.l_desc.max_code),u(Z,Z.dyn_dtree,Z.d_desc.max_code),pe(Z,Z.bl_desc),Q=g-1;3<=Q&&Z.bl_tree[2*W[Q]+1]===0;Q--);return Z.opt_len+=3*(Q+1)+5+5+4,Q})(v),P=v.opt_len+3+7>>>3,(F=v.static_len+3+7>>>3)<=P&&(P=F)):P=F=$+5,$+4<=P&&S!==-1?z(v,S,$,L):v.strategy===4||F===P?(V(v,2+(L?1:0),3),ye(v,K,E)):(V(v,4+(L?1:0),3),(function(Z,Q,ue,ae){var be;for(V(Z,Q-257,5),V(Z,ue-1,5),V(Z,ae-4,4),be=0;be<ae;be++)V(Z,Z.bl_tree[2*W[be]+1],3);T(Z,Z.dyn_ltree,Q-1),T(Z,Z.dyn_dtree,ue-1)})(v,v.l_desc.max_code+1,v.d_desc.max_code+1,U+1),ye(v,v.dyn_ltree,v.dyn_dtree)),de(v),L&&fe(v)},s._tr_tally=function(v,S,$){return v.pending_buf[v.d_buf+2*v.last_lit]=S>>>8&255,v.pending_buf[v.d_buf+2*v.last_lit+1]=255&S,v.pending_buf[v.l_buf+v.last_lit]=255&$,v.last_lit++,S===0?v.dyn_ltree[2*$]++:(v.matches++,S--,v.dyn_ltree[2*(y[$]+p+1)]++,v.dyn_dtree[2*I(S)]++),v.last_lit===v.lit_bufsize-1},s._tr_align=function(v){V(v,2,3),Y(v,x,K),(function(S){S.bi_valid===16?(re(S,S.bi_buf),S.bi_buf=0,S.bi_valid=0):8<=S.bi_valid&&(S.pending_buf[S.pending++]=255&S.bi_buf,S.bi_buf>>=8,S.bi_valid-=8)})(v)}},{"../utils/common":41}],53:[function(a,n,s){n.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(a,n,s){(function(i){(function(r,o){if(!r.setImmediate){var c,l,d,p,h=1,f={},g=!1,m=r.document,b=Object.getPrototypeOf&&Object.getPrototypeOf(r);b=b&&b.setTimeout?b:r,c={}.toString.call(r.process)==="[object process]"?function(M){process.nextTick(function(){k(M)})}:(function(){if(r.postMessage&&!r.importScripts){var M=!0,C=r.onmessage;return r.onmessage=function(){M=!1},r.postMessage("","*"),r.onmessage=C,M}})()?(p="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",x,!1):r.attachEvent("onmessage",x),function(M){r.postMessage(p+M,"*")}):r.MessageChannel?((d=new MessageChannel).port1.onmessage=function(M){k(M.data)},function(M){d.port2.postMessage(M)}):m&&"onreadystatechange"in m.createElement("script")?(l=m.documentElement,function(M){var C=m.createElement("script");C.onreadystatechange=function(){k(M),C.onreadystatechange=null,l.removeChild(C),C=null},l.appendChild(C)}):function(M){setTimeout(k,0,M)},b.setImmediate=function(M){typeof M!="function"&&(M=new Function(""+M));for(var C=new Array(arguments.length-1),A=0;A<C.length;A++)C[A]=arguments[A+1];var _={callback:M,args:C};return f[h]=_,c(h),h++},b.clearImmediate=w}function w(M){delete f[M]}function k(M){if(g)setTimeout(k,0,M);else{var C=f[M];if(C){g=!0;try{(function(A){var _=A.callback,D=A.args;switch(D.length){case 0:_();break;case 1:_(D[0]);break;case 2:_(D[0],D[1]);break;case 3:_(D[0],D[1],D[2]);break;default:_.apply(o,D)}})(C)}finally{w(M),g=!1}}}}function x(M){M.source===r&&typeof M.data=="string"&&M.data.indexOf(p)===0&&k(+M.data.slice(p.length))}})(typeof self>"u"?i===void 0?this:i:self)}).call(this,typeof Bt<"u"?Bt:typeof self<"u"?self:typeof window<"u"?window:{})},{}]},{},[10])(10)})})(Pa)),Pa.exports}var Bd=Fd();const es=qd(Bd),Wd=String.raw`
function aeAlertTextField(value, max) {
  return (typeof value === "string" || typeof value === "number" && Number.isFinite(value))
    ? String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max)
    : "";
}

function aeAlertData(listener, event) {
  const data = event && typeof event === "object" && !Array.isArray(event) ? event : {};
  const nested = data.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : {};
  const messageSnippet = nested.snippet && typeof nested.snippet === "object"
    ? nested.snippet.displayMessage : undefined;
  const name = listener === "message"
    ? aeAlertTextField(nested.displayName ?? nested.nick ?? data.name, 60)
    : aeAlertTextField(data.name ?? data.sender, 60);
  const message = listener === "message"
    ? aeAlertTextField(nested.text ?? messageSnippet ?? data.text, 180)
    : aeAlertTextField(data.message, 180);
  return { name: name || "Widz", amount: aeAlertTextField(data.amount, 32), message, event: listener };
}

function aeCaptionText(template, listener, data) {
  const fields = aeAlertData(listener, data);
  const source = typeof template === "string" ? template.slice(0, 160) : "";
  return source.replace(/\{(name|amount|message|event)\}/g, function (_, key) {
    return fields[key] ?? "";
  }).slice(0, 280);
}

function aeCaptionAnimation(intro, outro, playbackMs) {
  const lifetime = Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
  const enterMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  const exitMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  return "ae-caption-in-" + intro + " " + enterMs + "ms ease-out 0ms both, ae-caption-out-" + outro + " " + exitMs + "ms ease-in " + Math.max(0, lifetime - exitMs) + "ms forwards";
}

const aeCaptionFonts = {
  system: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
  impact: "Impact, Haettenschweiler, \"Arial Narrow Bold\", sans-serif",
  trebuchet: "\"Trebuchet MS\", Tahoma, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  georgia: "Georgia, \"Times New Roman\", serif",
  mono: "\"Cascadia Mono\", Consolas, \"Courier New\", monospace",
  comic: "\"Comic Sans MS\", \"Comic Neue\", cursive"
};

function aeCaptionShadow(effect, color) {
  if (effect === "none") return "none";
  if (effect === "outline") return "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 8px rgba(0,0,0,.85)";
  if (effect === "glow") return "0 0 2px rgba(0,0,0,.9), 0 0 10px " + color + ", 0 0 28px " + color;
  return "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
}

function aeCaptionBackground(hex, opacity) {
  const value = parseInt(hex.slice(1), 16);
  return "rgba(" + ((value >> 16) & 255) + ", " + ((value >> 8) & 255) + ", " + (value & 255) + ", " + Math.round(opacity) / 100 + ")";
}

function aeLetterStep(count, playbackMs) {
  if (count <= 1) return 0;
  const lifetime = Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
  return Math.max(12, Math.min(60, Math.floor(lifetime * 0.45 / count)));
}

function aeLetterAnimation(style, index, step) {
  const delay = index * step;
  if (style === "typewriter") return "ae-letter-type 1ms linear " + delay + "ms both";
  if (style === "pop") return "ae-letter-pop 360ms cubic-bezier(.2,.7,.3,1.4) " + delay + "ms both";
  return "ae-letter-wave 640ms ease-in-out " + (delay + 200) + "ms both";
}

// Words stay unbroken; each letter of the title gets its own staggered animation.
function aeCaptionTitle(target, text, letters, playbackMs) {
  const chars = Array.from(text);
  if (letters === "none" || chars.length > 120) {
    target.textContent = text;
    return;
  }
  const step = aeLetterStep(chars.filter(function (char) { return char.trim() !== ""; }).length, playbackMs);
  let index = 0;
  text.split(/(\s+)/).forEach(function (piece) {
    if (!piece) return;
    if (!piece.trim()) {
      target.appendChild(document.createTextNode(piece));
      return;
    }
    const word = document.createElement("span");
    word.className = "ae-alert-word";
    word.style.display = "inline-block";
    word.style.whiteSpace = "nowrap";
    Array.from(piece).forEach(function (char) {
      const letter = document.createElement("span");
      letter.className = "ae-alert-letter";
      letter.style.display = "inline-block";
      letter.style.animation = aeLetterAnimation(letters, index++, step);
      letter.textContent = char;
      word.appendChild(letter);
    });
    target.appendChild(word);
  });
}

// The alert sound is optional; a blocked or missing file never stops the visual alert.
function aePlaySound(sound) {
  if (!sound || typeof sound.url !== "string" || !sound.url) return;
  try {
    const audio = new Audio(sound.url);
    audio.volume = Math.max(0, Math.min(1, (Number(sound.volume) || 0) / 100));
    const played = audio.play();
    if (played && typeof played.catch === "function") played.catch(function () {});
  } catch (error) {
    // No audio support in this browser source.
  }
}

function aeAttachCaption(parent, caption, listener, event, playbackMs) {
  if (!caption || !caption.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.style.animation = aeCaptionAnimation(caption.intro ?? "slide", caption.outro ?? "fade", playbackMs);
  const title = aeCaptionText(caption.template, listener, event);
  const subtitle = caption.subtitle ? aeCaptionText(caption.subtitle, listener, event).trim() : "";
  const letters = caption.letters ?? "none";
  const background = caption.background ?? "none";
  const imageUrl = typeof caption.imageUrl === "string" && caption.imageUrl.slice(0, 8).toLowerCase() === "https://" ? caption.imageUrl : "";
  if (!subtitle && letters === "none" && background === "none" && !imageUrl) {
    label.textContent = title;
  } else {
    const box = document.createElement("span");
    box.className = "ae-alert-caption-box";
    box.style.display = "inline-block";
    box.style.maxWidth = "100%";
    if (background !== "none") {
      box.style.background = aeCaptionBackground(caption.backgroundColor ?? "#0f172a", caption.backgroundOpacity ?? 70);
      box.style.padding = ".3em .75em";
      box.style.borderRadius = background === "pill" ? "999px" : ".3em";
    }
    if (imageUrl) {
      const picture = document.createElement("img");
      picture.className = "ae-alert-image";
      picture.src = imageUrl;
      picture.alt = "";
      picture.style.display = "block";
      picture.style.height = (caption.imageSize ?? 160) + "px";
      picture.style.width = "auto";
      picture.style.maxWidth = "100%";
      picture.style.margin = "0 auto .2em";
      picture.style.objectFit = "contain";
      box.appendChild(picture);
    }
    const main = document.createElement("span");
    main.className = "ae-alert-caption-title";
    main.style.display = "block";
    aeCaptionTitle(main, title, letters, playbackMs);
    box.appendChild(main);
    if (subtitle) {
      const second = document.createElement("span");
      second.className = "ae-alert-caption-subtitle";
      second.style.display = "block";
      second.style.fontSize = ".55em";
      second.style.fontWeight = "600";
      second.style.marginTop = ".25em";
      second.textContent = subtitle;
      box.appendChild(second);
    }
    label.appendChild(box);
  }
  label.style.position = "absolute";
  label.style.left = "5%";
  label.style.width = "90%";
  label.style.maxWidth = "90%";
  label.style.textAlign = "center";
  label.style.whiteSpace = "pre-wrap";
  label.style.overflowWrap = "anywhere";
  label.style.pointerEvents = "none";
  label.style.color = caption.color;
  label.style.fontSize = caption.fontSize + "px";
  label.style.fontWeight = "700";
  label.style.lineHeight = "1.2";
  label.style.textShadow = aeCaptionShadow(caption.effect ?? "shadow", caption.color);
  if (caption.font && caption.font !== "default" && Object.prototype.hasOwnProperty.call(aeCaptionFonts, caption.font)) {
    label.style.fontFamily = aeCaptionFonts[caption.font];
  }
  if (caption.position === "custom") {
    label.style.left = (caption.xPercent ?? 50) + "%";
    label.style.top = (caption.yPercent ?? 75) + "%";
    label.style.width = "48%";
    label.style.transform = "translate(-50%, -50%)";
  } else if (caption.position === "top") {
    label.style.top = "8%";
  } else if (caption.position === "center") {
    label.style.top = "50%";
    label.style.transform = "translateY(-50%)";
  } else {
    label.style.bottom = "8%";
  }
  if (caption.avatarEnabled) {
    const name = aeAlertData(listener, event).name;
    aeAttachAvatar(label, event, name, caption.avatarSize ?? 72);
  }
  parent.appendChild(label);
  return label;
}
`,Ud=String.raw`
const aeAvatarAllowedHosts = new Set([
  "static-cdn.jtvnw.net", "yt3.googleusercontent.com",
  "lh3.googleusercontent.com", "cdn.streamelements.com",
  "static-cdn.streamelements.com"
]);
function aeAvatarUrl(raw) {
  if (typeof raw !== "string" || raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !aeAvatarAllowedHosts.has(url.hostname.toLowerCase())) return null;
    if (url.username || url.password || url.port) return null;
    return url.href;
  } catch {
    return null;
  }
}
function aeAvatarEventUrl(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const nested = event.data && typeof event.data === "object" && !Array.isArray(event.data) ? event.data : {};
  const fields = [nested.avatar, nested.avatarUrl, nested.profileImage, event.avatar, event.avatarUrl, event.profileImage];
  for (const field of fields) {
    const url = aeAvatarUrl(field);
    if (url) return url;
  }
  return null;
}
function aeAttachAvatar(caption, event, name, size) {
  const avatar = document.createElement("span");
  avatar.className = "ae-alert-avatar";
  avatar.style.position = "absolute";
  avatar.style.left = "0";
  avatar.style.top = "50%";
  avatar.style.transform = "translateY(-50%)";
  avatar.style.width = size + "px";
  avatar.style.height = size + "px";
  avatar.style.borderRadius = "50%";
  avatar.style.overflow = "hidden";
  avatar.style.display = "grid";
  avatar.style.placeItems = "center";
  avatar.style.fontSize = Math.round(size * 0.48) + "px";
  avatar.style.background = "rgba(25,45,78,.85)";
  avatar.style.border = "2px solid rgba(255,255,255,.7)";
  avatar.style.color = "#ffffff";
  avatar.style.boxSizing = "border-box";
  avatar.textContent = Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "?";
  const source = aeAvatarEventUrl(event);
  if (source) {
    const photo = document.createElement("img");
    photo.src = source;
    photo.alt = "";
    photo.referrerPolicy = "no-referrer";
    photo.loading = "eager";
    photo.decoding = "async";
    photo.style.position = "absolute";
    photo.style.inset = "0";
    photo.style.width = "100%";
    photo.style.height = "100%";
    photo.style.objectFit = "cover";
    avatar.appendChild(photo);
  }
  caption.style.paddingLeft = (size + 14) + "px";
  caption.style.boxSizing = "border-box";
  caption.style.minHeight = size + "px";
  caption.appendChild(avatar);
}
`;function Xd(e){const t=e.effects.filter(s=>s.enabled),a=t.map(xr),n=a.map(s=>({instanceId:s.instanceId,effectId:s.effectId,seed:s.seed,settings:s.settings,timingAnimation:Ga(s)?.animation??null,motionAnimation:Ja(s)?.animation??null,trigger:$e(s.trigger)??null,playbackMs:_t(s)}));return{html:Zd(),css:Gd(a),javascript:Yd(n),estimatedDomNodes:Vd(t),estimatedPerformanceCost:Kd(t)}}function Zd(){return`
<div id="animated-effects-root"></div>
`.trim()}function Gd(e){return`
html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

#animated-effects-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.ae-alert-caption {
  z-index: 9999;
  animation: ae-caption-intro 500ms cubic-bezier(.2,.7,.25,1) both;
}
@keyframes ae-caption-intro {
  from { opacity: 0; translate: 0 12px; }
  to { opacity: 1; translate: 0 0; }
}

.ae-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transform-origin: center;
  pointer-events: none;
}

${Jd(e).map(a=>Le(a)?.css).filter(a=>!!a).join(`

`)}

${ur}

${e.flatMap(a=>[Ga(a)?.css,Ja(a)?.css]).filter(Boolean).join(`
`)}
`.trim()}function Hd(e){return JSON.stringify(e,null,2).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")}function Yd(e){const a=[...new Set(e.map(i=>i.effectId))].map(i=>{const r=Le(i);return r?{effectId:i,rendererName:r.streamElementsRendererName,source:r.streamElementsRendererSource}:null}).filter(i=>i!==null),n=a.map(i=>i.source).join(`

`),s=a.map(i=>`${JSON.stringify(i.effectId)}: ${i.rendererName}`).join(`,
  `);return`
const effects = ${Hd(e)};

function aeCreateSeededRandom(seed) {
  let value = seed >>> 0;

  return function () {
    value += 0x6d2b79f5;

    let result = value;

    result = Math.imul(
      result ^ (result >>> 15),
      result | 1
    );

    result ^=
      result +
      Math.imul(
        result ^ (result >>> 7),
        result | 61
      );

    return (
      (
        result ^
        (result >>> 14)
      ) >>> 0
    ) / 4294967296;
  };
}

function aeAreaClip(area) {
  switch (area) {
    case "left":
      return "inset(0 50% 0 0)";

    case "center":
      return "inset(0 25% 0 25%)";

    case "right":
      return "inset(0 0 0 50%)";

    case "top":
      return "inset(0 0 50% 0)";

    case "bottom":
      return "inset(50% 0 0 0)";

    case "full":
    default:
      return "none";
  }
}

function aeHexToHsl(hex) {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16
    ) / 255;

  const max =
    Math.max(r, g, b);

  const min =
    Math.min(r, g, b);

  const delta =
    max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h =
        60 *
        (
          (
            (g - b) /
            delta
          ) %
          6
        );
    } else if (max === g) {
      h =
        60 *
        (
          (b - r) /
          delta +
          2
        );
    } else {
      h =
        60 *
        (
          (r - g) /
          delta +
          4
        );
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l =
    (max + min) / 2;

  const s =
    delta === 0
      ? 0
      : delta /
        (
          1 -
          Math.abs(
            2 * l -
            1
          )
        );

  return {
    h: h,
    s: s * 100,
    l: l * 100
  };
}

function aeColorizeFilter(s) {
  if (!s.colorize) {
    return "";
  }

  const hsl =
    aeHexToHsl(
      s.color || "#a88cff"
    );

  if (hsl.s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          hsl.l / 70
        )
      );

    return (
      "grayscale(1) " +
      "saturate(0) " +
      "brightness(" +
      whiteBrightness +
      ") "
    );
  }

  const saturation =
    Math.round(
      380 +
      hsl.s * 10
    );

  const rotate =
    hsl.h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        hsl.l / 105
      )
    );

  return (
    "grayscale(1) " +
    "sepia(1) " +
    "saturate(" +
    saturation +
    "%) " +
    "hue-rotate(" +
    rotate +
    "deg) " +
    "brightness(" +
    colorBrightness +
    ") "
  );
}

function aeCreateLayer(
  effect,
  root
) {
  const layer =
    document.createElement("div");

  layer.className =
    "ae-layer";

  layer.dataset.effectId =
    effect.effectId;

  layer.dataset.instanceId =
    effect.instanceId;

  const s =
    effect.settings;

  layer.style.opacity =
    String(
      s.opacity / 100
    );

  layer.style.transform =
    "translate(" +
    s.x +
    "%, " +
    s.y +
    "%) " +
    "scale(" +
    s.scale / 100 +
    ") " +
    "rotate(" +
    s.rotation +
    "deg)";

  layer.style.filter =
    aeColorizeFilter(s) +
    "blur(" +
    s.blur +
    "px) " +
    "brightness(" +
    s.brightness / 100 +
    ") " +
    "hue-rotate(" +
    s.hue +
    "deg)";

  layer.style.mixBlendMode =
    s.blendMode;

  layer.style.zIndex =
    String(
      s.zIndex
    );

  layer.style.clipPath =
    aeAreaClip(
      s.area
    );

  root.appendChild(
    layer
  );

  return layer;
}

${n}

${Ud}

${Wd}

const aeRenderers = {
  ${s}
};

// Per-layer host containers are intentionally separate from particle layers.
function aeRenderOne(effect, root) {
  const renderer = aeRenderers[effect.effectId];
  if (!renderer) {
    console.warn("Animated Effects: unknown effect", effect.effectId);
    return null;
  }
  const host = document.createElement("div");
  host.className = "ae-instance-host";
  host.style.position = "absolute";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = String(effect.settings.zIndex);
  root.appendChild(host);

  let parent = host;
  if (effect.timingAnimation) {
    const wrapper = document.createElement("div");
    wrapper.className = "ae-timed-layer";
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.overflow = "hidden";
    wrapper.style.pointerEvents = "none";
    wrapper.style.animation = effect.timingAnimation;
    parent.appendChild(wrapper);
    parent = wrapper;
  }
  if (effect.motionAnimation) {
    const wrapper = document.createElement("div");
    wrapper.className = "ae-motion-layer";
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.overflow = "hidden";
    wrapper.style.pointerEvents = "none";
    wrapper.style.animation = effect.motionAnimation;
    parent.appendChild(wrapper);
    parent = wrapper;
  }
  renderer(effect, parent);
  if (effect.motionAnimation) {
    Array.from(parent.children).forEach(function (child) {
      if (child.classList && child.classList.contains("ae-layer")) {
        child.style.transform = "none";
      }
    });
  }
  return host;
}

let aeRoot = null;
const aePending = new Map();
const aeActive = new Map();
const aeLastFired = Object.create(null);
const aeQueue = [];
let aeQueuedPlaying = null;
let aeQueuedTimer = null;
const AE_MAX_QUEUED_ALERTS = 16;
const aeCounters = { accepted: 0, started: 0, completed: 0, dropped: 0, evicted: 0 };
let aeReportSequence = 0;

/** Diagnostics are metadata-only: never include viewer names, chat text, amounts,
 * or avatar URLs. Developers can subscribe from browser DevTools. No on-screen UI.
 */
function aeReport(action, effect, reason) {
  if (typeof CustomEvent !== "function" || typeof window.dispatchEvent !== "function") return;
  const snapshot = {
    version: 1,
    sequence: ++aeReportSequence,
    action,
    reason: reason || null,
    instanceId: effect ? effect.instanceId : null,
    event: effect && effect.trigger ? effect.trigger.event : null,
    priority: effect && effect.trigger ? (effect.trigger.priority ?? 5) : null,
    queueLength: aeQueue.length,
    active: aeQueuedPlaying ? "queued" : null,
    waiting: aeQueue.map(function (entry) {
      return {
        instanceId: entry.effect.instanceId,
        event: entry.listener,
        priority: entry.effect.trigger.priority ?? 5,
      };
    }),
    activeReplacements: aeActive.size,
    counters: { ...aeCounters },
  };
  window.dispatchEvent(new CustomEvent("animated-effects:diagnostics", { detail: snapshot }));
}

function aeCompactEvent(listener, eventData) {
  // Do not retain arbitrary-size chat payloads while waiting in the queue.
  const values = aeAlertData(listener, eventData);
  const result = {
    name: values.name,
    amount: values.amount,
    message: values.message,
    text: values.message,
    data: { displayName: values.name, text: values.message },
  };
  if (eventData && typeof eventData === "object") {
    const source = eventData.data && typeof eventData.data === "object" ? eventData.data : eventData;
    if (typeof source.avatar === "string") result.avatar = source.avatar.slice(0, 500);
    if (typeof source.avatarUrl === "string") result.avatarUrl = source.avatarUrl.slice(0, 500);
    if (typeof source.profileImage === "string") result.profileImage = source.profileImage.slice(0, 500);
  }
  return result;
}

function aeNextQueued() {
  if (!aeRoot || aeQueuedPlaying || aeQueue.length === 0) return;
  const next = aeQueue.shift();
  const element = aeRenderOne(next.effect, aeRoot);
  if (!element) {
    aeCounters.dropped++;
    aeReport("dropped", next.effect, "unknown-effect");
    aeNextQueued();
    return;
  }
  aeAttachCaption(element, next.effect.trigger.caption, next.listener, next.eventData, next.effect.playbackMs);
  aePlaySound(next.effect.trigger.sound);
  aeQueuedPlaying = element;
  aeCounters.started++;
  aeReport("started", next.effect, "queue");
  aeQueuedTimer = setTimeout(function () {
    if (aeQueuedPlaying === element) {
      element.remove();
      aeQueuedPlaying = null;
      aeCounters.completed++;
      aeReport("completed", next.effect, "queue");
    }
    aeQueuedTimer = null;
    aeNextQueued();
  }, next.effect.playbackMs);
}

function startAnimatedEffects() {
  const root = document.getElementById("animated-effects-root");
  if (!root) {
    console.error("Animated Effects: #animated-effects-root not found.");
    return;
  }
  for (const timer of aePending.values()) clearTimeout(timer);
  aePending.clear();
  aeActive.clear();
  aeQueue.length = 0;
  if (aeQueuedTimer !== null) clearTimeout(aeQueuedTimer);
  aeQueuedTimer = null;
  aeQueuedPlaying = null;
  for (const key of Object.keys(aeCounters)) aeCounters[key] = 0;
  aeReportSequence = 0;
  for (const id of Object.keys(aeLastFired)) delete aeLastFired[id];
  aeRoot = root;
  root.replaceChildren();
  effects.forEach(function (effect) {
    if (effect.trigger && effect.trigger.source === "event") return;
    aeRenderOne(effect, root);
  });
  aeReport("ready", null, "widget-load");
  console.log("Animated Effects ready:", effects.length, "effect(s)");
}

function aeHandleEvent(obj) {
  const detail = obj && obj.detail;
  if (!aeRoot || !detail || typeof detail.listener !== "string") return;
  const eventData = detail.event;
  const now = Date.now();
  effects.forEach(function (effect) {
    const rule = effect.trigger;
    if (!rule || rule.source !== "event" || rule.event !== detail.listener) return;
    const last = aeLastFired[effect.instanceId];
    if (typeof last === "number" && now - last < rule.cooldownMs) {
      aeCounters.dropped++;
      aeReport("dropped", effect, "cooldown");
      return;
    }
    if (
      rule.minAmount > 0 &&
      (rule.event === "tip-latest" || rule.event === "cheer-latest" || rule.event === "raid-latest")
    ) {
      const amount = eventData && typeof eventData === "object"
        ? Number(eventData.amount) : NaN;
      if (!Number.isFinite(amount) || amount < rule.minAmount) {
        aeCounters.dropped++;
        aeReport("dropped", effect, "below-threshold");
        return;
      }
    }

    if (rule.queueMode === "queue") {
      // Stable priority queue: higher priority is played sooner while equal
      // priorities keep arrival order. The current alert is never preempted.
      const priority = typeof rule.priority === "number" ? rule.priority : 5;
      const firstLower = aeQueue.findIndex(function (entry) {
        const other = entry.effect.trigger.priority;
        return (typeof other === "number" ? other : 5) < priority;
      });
      if (aeQueue.length >= AE_MAX_QUEUED_ALERTS) {
        if (firstLower < 0) {
          aeCounters.dropped++;
          aeReport("dropped", effect, "queue-full");
          return; // Do not evict an equal or higher-priority alert.
        }
        const removed = aeQueue.pop(); // Lowest priority, newest first.
        aeCounters.evicted++;
        aeReport("evicted", removed.effect, "lower-priority");
      }
      const candidate = {
        effect,
        listener: detail.listener,
        eventData: aeCompactEvent(detail.listener, eventData),
      };
      if (firstLower < 0) aeQueue.push(candidate);
      else aeQueue.splice(firstLower, 0, candidate);
      // Admission control is performed on arrival, not on playback.
      aeLastFired[effect.instanceId] = now;
      aeCounters.accepted++;
      aeReport("accepted", effect, "queue");
      aeNextQueued();
      return;
    }

    const old = aeActive.get(effect.instanceId);
    if (old) {
      old.remove();
      aeReport("replaced", effect, "restart");
    }
    const timer = aePending.get(effect.instanceId);
    if (timer !== undefined) clearTimeout(timer);

    const element = aeRenderOne(effect, aeRoot);
    if (!element) {
      aeCounters.dropped++;
      aeReport("dropped", effect, "unknown-effect");
      return;
    }
    aeCounters.accepted++;
    aeCounters.started++;
    aeReport("started", effect, "replace");
    aeAttachCaption(element, rule.caption, detail.listener, eventData, effect.playbackMs);
    aePlaySound(rule.sound);
    aeLastFired[effect.instanceId] = now;
    aeActive.set(effect.instanceId, element);
    aePending.set(effect.instanceId, setTimeout(function () {
      if (aeActive.get(effect.instanceId) === element) {
        element.remove();
        aeActive.delete(effect.instanceId);
        aeCounters.completed++;
        aeReport("completed", effect, "replace");
      }
      aePending.delete(effect.instanceId);
    }, effect.playbackMs));
  });
}

window.addEventListener("onWidgetLoad", startAnimatedEffects);
window.addEventListener("onEventReceived", aeHandleEvent);
`.trim()}function Jd(e){return[...new Set(e.map(t=>t.effectId))]}function Vd(e){let t=1;for(const a of e){t+=1;const n=Le(a.effectId);n&&(t+=n.estimateDomNodes(a.settings))}return t}function Kd(e){return e.reduce((t,a)=>{const n=Le(a.effectId);return t+(n?.definition.performanceCost??1)},0)}const ts={mode:"always",chatCommand:"!hype",activeDurationMs:5e3,cooldownMs:1e4},Qd=new Set(["always","chat-command","follower","subscriber","tip","cheer","raid"]);function Kn(e,t,a,n){const s=typeof e=="string"&&e.trim()===""?NaN:Number(e);return Number.isFinite(s)?Math.round(Math.max(a,Math.min(n,s))):t}function at(e={}){const t=ts,a=typeof e.mode=="string"&&Qd.has(e.mode)?e.mode:t.mode,n=typeof e.chatCommand=="string"?e.chatCommand.trim().toLowerCase():t.chatCommand;return{mode:a,chatCommand:/^![a-z0-9_]{1,24}$/.test(n)?n:t.chatCommand,activeDurationMs:Kn(e.activeDurationMs,t.activeDurationMs,500,6e4),cooldownMs:Kn(e.cooldownMs,t.cooldownMs,0,3e5)}}const va=8;function bt(e,t){const a=new Set(t),n=new Set,s=[];for(const i of e.slice(0,va)){const r=typeof i?.id=="string"?i.id.trim():"";if(!/^[a-zA-Z0-9_-]{1,48}$/.test(r)||n.has(r))continue;const o=at(i);if(o.mode==="always")continue;const c=[...new Set((Array.isArray(i.effectInstanceIds)?i.effectInstanceIds:[]).filter(l=>typeof l=="string"&&a.has(l)))];c.length!==0&&(n.add(r),s.push({...o,id:r,effectInstanceIds:c}))}return s}function oa(e,t={},a){const n=at(t),s=e.effects.some(o=>o.enabled&&o.trigger?.source==="event");if(a===void 0&&n.mode==="always"&&s)return Xd(e);const i=e.effects.filter(o=>o.enabled),r=i.map(o=>({instanceId:o.instanceId,effectId:o.effectId,seed:o.seed,settings:o.settings}));return{html:ep(),css:tp(i),javascript:ap(r,at(t),a===void 0?void 0:bt(a,i.map(o=>o.instanceId))),estimatedDomNodes:rp(i),estimatedPerformanceCost:sp(i)}}function ep(){return`
<div id="animated-effects-root"></div>
`.trim()}function tp(e){return`
html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

#animated-effects-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.ae-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transform-origin: center;
  pointer-events: none;
}

${np(e).map(a=>Le(a)?.css).filter(a=>!!a).join(`

`)}
`.trim()}function ap(e,t,a){const s=[...new Set(e.map(o=>o.effectId))].map(o=>{const c=Le(o);return c?{effectId:o,rendererName:c.streamElementsRendererName,source:c.streamElementsRendererSource}:null}).filter(o=>o!==null),i=s.map(o=>o.source).join(`

`),r=s.map(o=>`${JSON.stringify(o.effectId)}: ${o.rendererName}`).join(`,
  `);return`
const effects = ${JSON.stringify(e,null,2)};

const aeTrigger = ${JSON.stringify(t)};
const aeMultiMode = ${a!==void 0};
const aeRoutes = ${JSON.stringify(a??[])};

function aeCreateSeededRandom(seed) {
  let value = seed >>> 0;

  return function () {
    value += 0x6d2b79f5;

    let result = value;

    result = Math.imul(
      result ^ (result >>> 15),
      result | 1
    );

    result ^=
      result +
      Math.imul(
        result ^ (result >>> 7),
        result | 61
      );

    return (
      (
        result ^
        (result >>> 14)
      ) >>> 0
    ) / 4294967296;
  };
}

function aeAreaClip(area) {
  switch (area) {
    case "left":
      return "inset(0 50% 0 0)";

    case "center":
      return "inset(0 25% 0 25%)";

    case "right":
      return "inset(0 0 0 50%)";

    case "top":
      return "inset(0 0 50% 0)";

    case "bottom":
      return "inset(50% 0 0 0)";

    case "full":
    default:
      return "none";
  }
}

function aeHexToHsl(hex) {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16
    ) / 255;

  const max =
    Math.max(r, g, b);

  const min =
    Math.min(r, g, b);

  const delta =
    max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h =
        60 *
        (
          (
            (g - b) /
            delta
          ) %
          6
        );
    } else if (max === g) {
      h =
        60 *
        (
          (b - r) /
          delta +
          2
        );
    } else {
      h =
        60 *
        (
          (r - g) /
          delta +
          4
        );
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l =
    (max + min) / 2;

  const s =
    delta === 0
      ? 0
      : delta /
        (
          1 -
          Math.abs(
            2 * l -
            1
          )
        );

  return {
    h: h,
    s: s * 100,
    l: l * 100
  };
}

function aeColorizeFilter(s) {
  if (!s.colorize) {
    return "";
  }

  const hsl =
    aeHexToHsl(
      s.color || "#a88cff"
    );

  if (hsl.s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          hsl.l / 70
        )
      );

    return (
      "grayscale(1) " +
      "saturate(0) " +
      "brightness(" +
      whiteBrightness +
      ") "
    );
  }

  const saturation =
    Math.round(
      380 +
      hsl.s * 10
    );

  const rotate =
    hsl.h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        hsl.l / 105
      )
    );

  return (
    "grayscale(1) " +
    "sepia(1) " +
    "saturate(" +
    saturation +
    "%) " +
    "hue-rotate(" +
    rotate +
    "deg) " +
    "brightness(" +
    colorBrightness +
    ") "
  );
}

function aeCreateLayer(
  effect,
  root
) {
  const layer =
    document.createElement("div");

  layer.className =
    "ae-layer";

  layer.dataset.effectId =
    effect.effectId;

  layer.dataset.instanceId =
    effect.instanceId;

  const s =
    effect.settings;

  layer.style.opacity =
    String(
      s.opacity / 100
    );

  layer.style.transform =
    "translate(" +
    s.x +
    "%, " +
    s.y +
    "%) " +
    "scale(" +
    s.scale / 100 +
    ") " +
    "rotate(" +
    s.rotation +
    "deg)";

  layer.style.filter =
    aeColorizeFilter(s) +
    "blur(" +
    s.blur +
    "px) " +
    "brightness(" +
    s.brightness / 100 +
    ") " +
    "hue-rotate(" +
    s.hue +
    "deg)";

  layer.style.mixBlendMode =
    s.blendMode;

  layer.style.zIndex =
    String(
      s.zIndex
    );

  layer.style.clipPath =
    aeAreaClip(
      s.area
    );

  root.appendChild(
    layer
  );

  return layer;
}

${i}

const aeRenderers = {
  ${r}
};

function startAnimatedEffects(allowedInstanceIds) {
  const root = document.getElementById("animated-effects-root");
  if (!root) {
    console.error("Animated Effects: #animated-effects-root not found.");
    return;
  }

  const allowed = allowedInstanceIds ? new Set(allowedInstanceIds) : null;
  root.replaceChildren();
  effects.forEach(function (effect) {
    if (allowed && !allowed.has(effect.instanceId)) return;
    const renderer = aeRenderers[effect.effectId];
    if (!renderer) {
      console.warn("Animated Effects: unknown effect", effect.effectId);
      return;
    }
    renderer(effect, root);
  });
}

const aeRules = aeMultiMode ? aeRoutes : [{
  id: "legacy",
  mode: aeTrigger.mode,
  chatCommand: aeTrigger.chatCommand,
  activeDurationMs: aeTrigger.activeDurationMs,
  cooldownMs: aeTrigger.cooldownMs,
  effectInstanceIds: effects.map(function (effect) { return effect.instanceId; })
}];
let aeReady = false;
let aeStopTimer = null;
const aeLastRunAt = new Map();
const aeRecentMessageIds = new Set();
const aeRecentMessageOrder = [];

function aeMatchesRule(detail, rule) {
  if (!detail || typeof detail !== "object" || rule.mode === "always") return false;
  const listeners = {
    follower: "follower-latest",
    subscriber: "subscriber-latest",
    tip: "tip-latest",
    cheer: "cheer-latest",
    raid: "raid-latest"
  };
  if (rule.mode !== "chat-command") {
    return detail.listener === listeners[rule.mode];
  }
  if (detail.listener !== "message") return false;
  const event = detail.event || {};
  const data = event.data && typeof event.data === "object" ? event.data : event;
  if (!data || typeof data !== "object") return false;
  const message = typeof data.text === "string" ? data.text.trim().toLowerCase() : "";
  return message === rule.chatCommand || message.startsWith(rule.chatCommand + " ");
}

function aeMessageId(detail) {
  if (!detail || detail.listener !== "message") return "";
  const event = detail.event || {};
  const data = event.data && typeof event.data === "object" ? event.data : event;
  return data && data.msgId != null ? String(data.msgId) : "";
}

function aeRememberMessageId(id) {
  if (!id) return;
  aeRecentMessageIds.add(id);
  aeRecentMessageOrder.push(id);
  if (aeRecentMessageOrder.length > 128) {
    aeRecentMessageIds.delete(aeRecentMessageOrder.shift());
  }
}

function aeStartRoute(rule, now) {
  aeLastRunAt.set(rule.id, now);
  if (aeStopTimer !== null) clearTimeout(aeStopTimer);
  // One scene at a time: the most recent eligible rule replaces the active scene.
  startAnimatedEffects(rule.effectInstanceIds);
  aeStopTimer = setTimeout(function () {
    const root = document.getElementById("animated-effects-root");
    if (root) root.replaceChildren();
    aeStopTimer = null;
  }, rule.activeDurationMs);
}

window.addEventListener("onWidgetLoad", function () {
  aeReady = true;
  if (aeStopTimer !== null) clearTimeout(aeStopTimer);
  aeStopTimer = null;
  aeLastRunAt.clear();
  aeRecentMessageIds.clear();
  aeRecentMessageOrder.length = 0;
  if (!aeMultiMode && aeTrigger.mode === "always") {
    startAnimatedEffects();
  } else {
    const root = document.getElementById("animated-effects-root");
    if (root) root.replaceChildren();
  }
});

window.addEventListener("onEventReceived", function (event) {
  if (!aeReady || (!aeMultiMode && aeTrigger.mode === "always")) return;
  const detail = event && event.detail;
  const id = aeMessageId(detail);
  if (id && aeRecentMessageIds.has(id)) return;

  let matches = false;
  const now = Date.now();
  for (const rule of aeRules) {
    if (!aeMatchesRule(detail, rule)) continue;
    matches = true;
    const previous = aeLastRunAt.has(rule.id) ? aeLastRunAt.get(rule.id) : -Infinity;
    if (now - previous < rule.cooldownMs) continue;
    aeRememberMessageId(id);
    aeStartRoute(rule, now);
    return;
  }
  // Deduplicate matching messages even when cooldown prevents activation.
  if (matches) aeRememberMessageId(id);
});
`.trim()}function np(e){return[...new Set(e.map(t=>t.effectId))]}function rp(e){let t=1;for(const a of e){t+=1;const n=Le(a.effectId);n&&(t+=n.estimateDomNodes(a.settings))}return t}function sp(e){return e.reduce((t,a)=>{const n=Le(a.effectId);return t+(n?.definition.performanceCost??1)},0)}let Ut=null,La=!1,Kt=!1,xt=null;function ip(e){return e.replace(/<\/script/gi,"<\\/script")}function as(e){let t=2166136261;for(let a=0;a<e.length;a++)t^=e.charCodeAt(a),t=Math.imul(t,16777619);return t>>>0}function op(e){return e.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"effect"}async function ns(e,t,a,n){const s=oa(e),i=document.createElement("iframe");Object.assign(i.style,{position:"fixed",left:"-100000px",top:"0",width:`${t}px`,height:`${a}px`,border:"0",pointerEvents:"none"}),i.width=String(t),i.height=String(a),i.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>${s.css}
html,body{width:${t}px!important;height:${a}px!important;${n?`background:${n}!important;`:"background:transparent!important;"}}</style></head><body>${s.html}<script>${ip(s.javascript)}<\/script></body></html>`,document.body.appendChild(i),await new Promise((l,d)=>{const p=window.setTimeout(()=>d(new Error("Timeout renderera eksportu.")),1e4);i.addEventListener("load",()=>{clearTimeout(p),l()},{once:!0})});const r=i.contentWindow,o=i.contentDocument;if(!r||!o)throw i.remove(),new Error("Nie udało się utworzyÄ‡ renderera eksportu.");r.dispatchEvent(new Event("onWidgetLoad")),await new Promise(l=>requestAnimationFrame(()=>requestAnimationFrame(()=>l())));const c=o.getElementById("animated-effects-root");if(!c)throw i.remove(),new Error("Renderer eksportu nie utworzyĹ‚ sceny.");return{iframe:i,root:c,document:o}}function cp(e,t){e.document.getAnimations().forEach(a=>{a.pause();try{a.currentTime=t}catch{}})}async function rs(e,t,a,n,s){return cp(e,n),await new Promise(i=>requestAnimationFrame(()=>i())),zd(e.root,{width:t,height:a,canvasWidth:t,canvasHeight:a,pixelRatio:1,backgroundColor:s??void 0})}function Ie(e,t,a){const n=Number(e.querySelector(t)?.value);return Number.isFinite(n)?n:a}function pn(e){const t=e.querySelector("[data-media-background]")?.value??"black";return t==="transparent"?null:t==="black"?"#000000":e.querySelector("[data-media-color]")?.value??"#080b12"}function et(e,t,a=0){const n=e.querySelector("[data-media-status]");n&&(n.textContent=t);const s=e.querySelector("[data-media-progress]");s&&(s.value=Math.max(0,Math.min(100,a)))}function Oe(e,t,a=0){const n=e.querySelector("[data-batch-status]");n&&(n.textContent=t);const s=e.querySelector("[data-batch-progress]");s&&(s.value=Math.max(0,Math.min(100,a)))}function ss(e,t){const a=URL.createObjectURL(e),n=document.createElement("a");n.href=a,n.download=t,n.click(),setTimeout(()=>URL.revokeObjectURL(a),1500)}async function is(e,t,a,n,s,i,r,o,c){const l=Math.max(1,Math.round(n*s)),d=Math.round(1e3/s),p=await ns(e,t,a,r),h=Ad();try{for(let f=0;f<l;f++){if(o())return null;const m=(await rs(p,t,a,f*(1e3/s),r)).getContext("2d",{willReadFrequently:!0});if(!m)throw new Error("Brak Canvas 2D.");const b=m.getImageData(0,0,t,a).data,w=jd(b,i,{format:"rgb565"}),k=$d(b,w,"rgb565");h.writeFrame(k,t,a,{palette:w,delay:d,repeat:0}),c(f+1,l),await new Promise(x=>setTimeout(x,0))}return h.finish(),new Blob([h.bytes()],{type:"image/gif"})}finally{p.iframe.remove()}}async function lp(e){const t=Math.round(Ie(e,"[data-media-width]",1920)),a=Math.round(Ie(e,"[data-media-height]",1080)),n=Ie(e,"[data-png-time]",0)*1e3,s=pn(e);et(e,"Renderowanie PNG...",20);const i=await ns(he(),t,a,s);try{const r=await rs(i,t,a,n,s),o=await new Promise((c,l)=>r.toBlob(d=>d?c(d):l(new Error("Nie udało się zakodowaÄ‡ PNG.")),"image/png"));ss(o,`animated-effects-${t}x${a}.png`),et(e,`PNG gotowy · ${(o.size/1024/1024).toFixed(1)} MB`,100)}finally{i.iframe.remove()}}async function dp(e){La=!1;const t=Math.max(240,Math.min(1920,Math.round(Ie(e,"[data-media-width]",1280)))),a=Math.max(240,Math.min(1080,Math.round(Ie(e,"[data-media-height]",720)))),n=Math.max(.5,Math.min(30,Ie(e,"[data-gif-seconds]",5))),s=Math.max(5,Math.min(30,Math.round(Ie(e,"[data-gif-fps]",15)))),i=e.querySelector("[data-gif-quality]")?.value??"medium",r=i==="low"?96:i==="high"?256:160,o=pn(e),c=await is(he(),t,a,n,s,r,o,()=>La,(p,h)=>{et(e,`GIF · klatka ${p} / ${h}`,p/h*100)});if(!c){et(e,"Generowanie anulowane.",0);return}xt&&URL.revokeObjectURL(xt),xt=URL.createObjectURL(c);const l=e.querySelector("[data-gif-preview]");l&&(l.src=xt,l.hidden=!1);const d=e.querySelector("[data-gif-save]");d&&(d.href=xt,d.download=`animated-effects-${t}x${a}-${s}fps.gif`,d.hidden=!1),et(e,`GIF gotowy · ${(c.size/1024/1024).toFixed(1)} MB`,100)}function pp(e,t){const a=It().find(i=>i.id===t);if(!a)throw new Error(`Nie znaleziono efektu: ${t}`);const n=structuredClone(e),s=`batch-${t}`;return n.effects=[{instanceId:s,effectId:a.id,seed:as(a.id),enabled:!0,settings:{...a.defaultSettings},label:a.name,locked:!1,groupId:null}],n.selectedEffectInstanceId=s,n.activePresetId=null,n}async function up(e){Kt=!1;const t=Math.max(320,Math.min(1280,Math.round(Ie(e,"[data-batch-width]",640)))),a=Math.max(180,Math.min(720,Math.round(Ie(e,"[data-batch-height]",360)))),n=Math.max(1,Math.min(30,Ie(e,"[data-batch-seconds]",10))),s=Math.max(5,Math.min(20,Math.round(Ie(e,"[data-batch-fps]",12)))),i=e.querySelector("[data-batch-quality]")?.value??"medium",r=i==="low"?80:i==="high"?192:128,o=e.querySelector("[data-batch-category]")?.value??"all",c=It().filter(m=>o==="all"||m.category===o);if(c.length===0){Oe(e,"Brak efektów dla wybranego filtra.",0);return}const l=e.querySelector("[data-batch-gif]"),d=e.querySelector("[data-cancel-batch]");l&&(l.disabled=!0),d&&(d.hidden=!1);const p=new es,h=he(),f=pn(e),g=[];try{for(let b=0;b<c.length;b++){if(Kt){Oe(e,"Batch anulowany.",0);return}const w=c[b],k=pp(h,w.id),x=b/c.length,M=1/c.length;Oe(e,`GIF ${b+1} / ${c.length} · ${w.name}`,x*94);const C=await is(k,t,a,n,s,r,f,()=>Kt,(_,D)=>{const j=_/D;Oe(e,`${w.name} · klatka ${_} / ${D}`,(x+M*j)*94)});if(!C){Oe(e,"Batch anulowany.",0);return}const A=op(w.id);p.file(`${A}.gif`,C),g.push({id:w.id,name:w.name,seed:as(w.id)}),await new Promise(_=>setTimeout(_,0))}p.file("manifest.json",JSON.stringify({generatedAt:new Date().toISOString(),width:t,height:a,seconds:n,fps:s,category:o,effects:g},null,2)),Oe(e,"Pakowanie ZIP...",95);const m=await p.generateAsync({type:"blob",compression:"STORE"},b=>{Oe(e,`Pakowanie ZIP · ${Math.round(b.percent)}%`,95+b.percent*.05)});ss(m,`animated-effects-batch-${t}x${a}-${n}s.zip`),Oe(e,`Gotowe · ${c.length} GIF · ${(m.size/1024/1024).toFixed(1)} MB ZIP`,100)}finally{l&&(l.disabled=!1),d&&(d.hidden=!0)}}function fp(){const e=It(),t=[...new Set(e.map(n=>n.category))].sort(),a=document.createElement("dialog");return a.className="export-dialog ae-media-dialog",a.innerHTML=`<div class="export-header"><div><strong>PNG / GIF</strong><span>Render sceny bez interfejsu edytora</span></div><button type="button" data-media-close>×</button></div>
  <div class="ae-media-export">
    <div class="ae-media-grid">
      <label>Szerokość<input type="number" min="240" max="1920" value="1280" data-media-width></label>
      <label>Wysokość<input type="number" min="240" max="1080" value="720" data-media-height></label>
      <label>Tło<select data-media-background><option value="black">Czarne</option><option value="custom">WĹ‚asny kolor</option><option value="transparent">Przezroczyste</option></select></label>
      <label>Kolor<input type="color" value="#080b12" data-media-color></label>
    </div>

    <section class="ae-media-section">
      <h3>PNG</h3>
      <label>Czas animacji (s)<input type="number" min="0" max="30" step=".1" value="0" data-png-time></label>
      <button class="ae-button ae-button-primary" type="button" data-generate-png>Generuj PNG</button>
    </section>

    <section class="ae-media-section">
      <h3>GIF</h3>
      <div class="ae-media-grid">
        <label>DĹ‚ugoĹ›Ä‡ (s)<input type="number" min=".5" max="30" step=".5" value="5" data-gif-seconds></label>
        <label>FPS<input type="number" min="5" max="30" value="15" data-gif-fps></label>
        <label>JakoĹ›Ä‡<select data-gif-quality><option value="low">Niska</option><option value="medium" selected>Ĺšrednia</option><option value="high">Wysoka</option></select></label>
      </div>
      <div class="ae-media-actions">
        <button class="ae-button ae-button-primary" type="button" data-generate-gif>Generuj GIF</button>
        <button class="ae-button ae-button-secondary" type="button" data-cancel-gif>Anuluj</button>
        <a class="ae-button ae-button-secondary" data-gif-save hidden>Zapisz GIF</a>
      </div>
      <progress max="100" value="0" data-media-progress></progress>
      <div data-media-status>Gotowe do generowania.</div>
      <img class="ae-gif-preview" data-gif-preview alt="PodglÄ…d GIF" hidden>
    </section>

    <section class="ae-media-section ae-batch-export">
      <h3>Batch GIF · wszystkie efekty</h3>
      <p class="ae-batch-note">
        KaĹĽdy efekt jest renderowany osobno na czystej scenie ze staĹ‚ym seedem i trafia do jednego ZIP-a.
        DomyĹ›lnie 10 s · 640×360 · 12 FPS. Przy caĹ‚ej bibliotece operacja moĹĽe potrwaÄ‡ dĹ‚ugo.
      </p>

      <div class="ae-media-grid">
        <label>Szerokość<input type="number" min="320" max="1920" value="640" data-batch-width></label>
        <label>Wysokość<input type="number" min="180" max="1080" value="360" data-batch-height></label>
        <label>DĹ‚ugoĹ›Ä‡ GIF (s)<input type="number" min="1" max="30" step="1" value="10" data-batch-seconds></label>
        <label>FPS<input type="number" min="5" max="30" value="12" data-batch-fps></label>
        <label>JakoĹ›Ä‡<select data-batch-quality><option value="low">Niska / szybciej</option><option value="medium" selected>Ĺšrednia</option><option value="high">Wysoka / wolniej</option></select></label>
        <label>Zakres<select data-batch-category><option value="all">Wszystkie efekty</option>${t.map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
      </div>

      <div class="ae-media-actions">
        <button class="ae-button ae-button-primary" type="button" data-batch-gif>Generuj wszystkie do ZIP</button>
        <button class="ae-button ae-button-secondary" type="button" data-cancel-batch hidden>Anuluj batch</button>
      </div>

      <progress max="100" value="0" data-batch-progress></progress>
      <div data-batch-status>Gotowe · ${e.length} efektów dostÄ™pnych.</div>
    </section>
  </div>`,a.querySelector("[data-media-close]")?.addEventListener("click",()=>a.close()),a.querySelector("[data-cancel-gif]")?.addEventListener("click",()=>{La=!0}),a.querySelector("[data-cancel-batch]")?.addEventListener("click",()=>{Kt=!0}),a.querySelector("[data-generate-png]")?.addEventListener("click",()=>{lp(a).catch(n=>et(a,n instanceof Error?n.message:String(n),0))}),a.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{dp(a).catch(n=>et(a,n instanceof Error?n.message:String(n),0))}),a.querySelector("[data-batch-gif]")?.addEventListener("click",()=>{up(a).catch(n=>Oe(a,n instanceof Error?n.message:String(n),0))}),document.body.appendChild(a),a}function mp(){Ut||(Ut=fp()),Ut.open||Ut.showModal()}const os="animated-effects:pack06:favorites",cs="animated-effects:pack06:usage",ls="animated-effects:pack06:recent";let Qn=!1,ds=!1,zt=null,ja=null;const ut=new Set;let Xt=null;function un(e,t){try{const a=localStorage.getItem(e);return a?JSON.parse(a):t}catch{return t}}function Da(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}let lt=new Set(un(os,[])),ft=un(cs,{}),Et=un(ls,{});function yp(e){ft={...ft,[e]:(ft[e]??0)+1},Et={...Et,[e]:Date.now()},Da(cs,ft),Da(ls,Et)}function hp(e){const t=e.querySelector(".ae-effect-card-main strong")?.textContent?.trim();return t?It().find(a=>a.name===t):void 0}function gp(e,t){if(e.style.setProperty("display","grid","important"),e.style.setProperty("height","auto","important"),e.style.setProperty("overflow","hidden","important"),e.style.setProperty("align-items","center","important"),e.style.setProperty("box-sizing","border-box","important"),t){e.style.setProperty("grid-template-columns","26px minmax(0, 1fr)","important"),e.style.setProperty("grid-template-areas",'"favorite preview" "actions actions"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto) 36px","important"),e.style.setProperty("min-height","98px","important"),e.style.setProperty("padding","7px 8px 10px","important"),e.style.setProperty("column-gap","7px","important"),e.style.setProperty("row-gap","8px","important");return}e.style.setProperty("grid-template-columns","26px minmax(0, 1fr) 36px","important"),e.style.setProperty("grid-template-areas",'"favorite preview add"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto)","important"),e.style.setProperty("min-height","58px","important"),e.style.setProperty("padding","6px 8px","important"),e.style.setProperty("gap","6px","important")}function bp(e){e.style.setProperty("display","grid","important"),e.style.setProperty("grid-template-columns","repeat(3, minmax(0, 1fr))","important"),e.style.setProperty("grid-area","actions","important"),e.style.setProperty("height","36px","important"),e.style.setProperty("min-height","36px","important"),e.style.setProperty("margin","0 0 0 28px","important"),e.style.setProperty("padding","0","important"),e.style.setProperty("gap","6px","important"),e.style.setProperty("align-self","end","important"),e.querySelectorAll("button").forEach(t=>{t.style.setProperty("height","34px","important"),t.style.setProperty("min-height","34px","important"),t.style.setProperty("width","100%","important"),t.style.setProperty("min-width","0","important"),t.style.setProperty("margin","0","important"),t.style.setProperty("padding","0 6px","important")})}function wp(){const e=document.querySelector("#effect-library");if(!e)return;const t=he(),a=document.querySelector("#pack06-library-mode")?.value??"all",n=document.querySelector("#pack06-library-sort")?.value??"name",s=Array.from(e.querySelectorAll(".ae-effect-card"));for(const r of s){const o=hp(r);if(!o)continue;r.dataset.pack06="1",r.dataset.effectId=o.id;const c=t.effects.filter(g=>g.effectId===o.id),l=c.at(-1)??null,d=[...c].reverse().find(g=>!g.locked)??null,p=c.length>0;r.classList.toggle("is-on-scene",p),r.dataset.pack13Card="1",r.dataset.pack13Active=p?"1":"0",r.dataset.pack14Card="1",r.dataset.pack14Active=p?"1":"0",gp(r,p);const h=r.querySelector(".ae-add-icon");h&&h.parentElement!==r&&r.appendChild(h),r.querySelector(":scope > .ae-pack06-favorite")?.remove(),r.querySelector(":scope > .ae-pack06-card-actions")?.remove(),r.querySelector(".ae-pack06-scene-badge")?.remove();const f=document.createElement("button");if(f.type="button",f.className="ae-pack06-favorite",f.textContent=lt.has(o.id)?"★":"☆",f.title="Ulubione",f.addEventListener("click",()=>{lt.has(o.id)?lt.delete(o.id):lt.add(o.id),Da(os,[...lt]),yt()}),r.prepend(f),p){const g=r.querySelector(".ae-effect-card-subline");if(g){const m=document.createElement("span");m.className="ae-pack06-scene-badge",m.textContent="NA SCENIE",g.appendChild(m)}}if(h)if(h.dataset.pack14Track!=="1"&&(h.dataset.pack14Track="1",h.addEventListener("click",()=>{yp(o.id)},{capture:!0})),p){const g=document.createElement("div");g.className="ae-pack06-card-actions ae-pack14-card-actions";const m=document.createElement("button");m.type="button",m.className="ae-pack06-minus",m.textContent="−",m.disabled=!d,m.title=d?"Usuń ostatnią niezablokowaną instancję":"Wszystkie instancje są zablokowane",m.addEventListener("click",()=>{d&&Pr(d.instanceId)});const b=document.createElement("button");b.type="button",b.className="ae-pack06-count",b.textContent=`${c.length}×`,b.title="Pokaż w Warstwach",b.addEventListener("click",()=>{l&&(jr(l.instanceId),document.querySelector('[data-sidebar-tab="layers"]')?.click(),setTimeout(()=>{document.querySelector(`[data-pack06-instance-id="${l.instanceId}"]`)?.scrollIntoView({block:"nearest"})},0))}),g.append(m,b,h),bp(g),r.appendChild(g)}else h.parentElement!==r&&r.appendChild(h)}const i=Array.from(e.querySelectorAll(".ae-effect-card[data-effect-id]"));for(const r of i){const o=r.dataset.effectId??"",c=t.effects.filter(l=>l.effectId===o).length;r.hidden=a==="favorites"&&!lt.has(o)||a==="scene"&&c===0}i.sort((r,o)=>{const c=r.dataset.effectId??"",l=o.dataset.effectId??"",d=ze(c),p=ze(l);if(!d||!p)return 0;switch(n){case"used":return(ft[l]??0)-(ft[c]??0);case"recent":return(Et[l]??0)-(Et[c]??0);case"light":return d.performanceCost-p.performanceCost;case"heavy":return p.performanceCost-d.performanceCost;case"category":return d.category.localeCompare(p.category)||d.name.localeCompare(p.name);default:return d.name.localeCompare(p.name)}}),i.forEach(r=>{e.appendChild(r)})}function kp(){const e=Array.from(document.querySelectorAll(".ae-layer-row")),t=[...he().effects].reverse();e.forEach((a,n)=>{const s=t[n];if(!s)return;a.dataset.pack06InstanceId=s.instanceId,a.classList.toggle("is-locked",!!s.locked),a.classList.toggle("is-solo",ut.has(s.instanceId));const i=a.querySelector(".ae-layer-copy strong");i&&s.label&&(i.textContent=s.label);const r=a.querySelector(".ae-layer-actions");if(!r||r.dataset.pack06==="1")return;r.dataset.pack06="1";const o=document.createElement("button");o.type="button",o.className="ae-icon-button ae-pack06-solo",o.textContent="S",o.title="Solo",o.addEventListener("click",()=>{ut.has(s.instanceId)?ut.delete(s.instanceId):ut.add(s.instanceId),ps(),yt()});const c=document.createElement("button");c.type="button",c.className="ae-icon-button ae-pack06-lock",c.textContent=s.locked?"L":"U",c.title=s.locked?"Odblokuj":"Zablokuj",c.addEventListener("click",()=>qc(s.instanceId));const l=document.createElement("button");l.type="button",l.className="ae-icon-button ae-pack06-duplicate",l.textContent="⧉",l.title="Duplikuj · Shift = zachowaj seed",l.addEventListener("click",d=>Dc(s.instanceId,d.shiftKey)),r.append(o,c,l);for(const d of[".layer-remove",".layer-up",".layer-down"]){const p=a.querySelector(d);p&&s.locked&&(p.disabled=!0)}a.querySelector(".ae-layer-select")?.addEventListener("dblclick",()=>{const d=ze(s.effectId),p=window.prompt("Nazwa warstwy:",s.label??d?.name??s.effectId);p!==null&&_r(s.instanceId,p)}),a.draggable=!s.locked,a.addEventListener("dragstart",()=>{s.locked||(zt=s.instanceId,a.classList.add("is-dragging"))}),a.addEventListener("dragend",()=>{zt=null,a.classList.remove("is-dragging")}),a.addEventListener("dragover",d=>{zt&&!s.locked&&d.preventDefault()}),a.addEventListener("drop",d=>{d.preventDefault(),zt&&Wc(zt,s.instanceId)})})}function ps(){const e=document.querySelector("#effect-preview");e&&e.querySelectorAll(".effect-layer").forEach(t=>{const a=t.dataset.instanceId;t.style.display=ut.size===0||a&&ut.has(a)?"":"none"})}function vp(){const e=document.querySelector("#inspector"),t=Mt();if(!e||!t||e.querySelector("[data-pack06-inspector]"))return;const a=ze(t.effectId);if(!a)return;const n=document.createElement("section");n.className="inspector-group ae-pack06-inspector",n.dataset.pack06Inspector="1",n.innerHTML=`<div class="ae-pack06-inspector-title"><strong>Losowość i narzędzia</strong><span>Seed, intensywność i kopiowanie ustawień</span></div>
  <label class="inspector-field"><span class="inspector-label"><span>Seed</span></span><div class="ae-pack06-seed-row"><input type="number" min="0" max="4294967295" value="${t.seed}" data-pack06-seed><button type="button" class="inspector-field-reset" data-pack06-reroll>Losuj</button></div></label>
  ${a.capabilities.intensity?`<label class="inspector-field"><span class="inspector-label"><span>Intensywność</span><output data-pack06-intensity-out>${t.settings.intensity}%</output></span><input type="range" min="0" max="400" value="${t.settings.intensity}" data-pack06-intensity></label>`:""}
  <div class="ae-pack06-copy-row"><button type="button" class="ae-button ae-button-secondary" data-pack06-copy>Kopiuj ustawienia</button><button type="button" class="ae-button ae-button-secondary" data-pack06-paste ${Xt?"":"disabled"}>Wklej</button></div>`,e.querySelector(".inspector-title")?.insertAdjacentElement("afterend",n);const s=n.querySelector("[data-pack06-seed]");s?.addEventListener("change",()=>$r(t.instanceId,Number(s.value))),n.querySelector("[data-pack06-reroll]")?.addEventListener("click",()=>Zc(t.instanceId));const i=n.querySelector("[data-pack06-intensity]");i?.addEventListener("input",()=>{const r=Number(i.value),o=n.querySelector("[data-pack06-intensity-out]");o&&(o.value=`${r}%`),Se(t.instanceId,{intensity:r})}),n.querySelector("[data-pack06-copy]")?.addEventListener("click",()=>{Xt=structuredClone(t.settings);const r=n.querySelector("[data-pack06-paste]");r&&(r.disabled=!1)}),n.querySelector("[data-pack06-paste]")?.addEventListener("click",()=>{Xt&&Se(t.instanceId,structuredClone(Xt))})}function us(){const t=he().effects.filter(l=>l.enabled),a=t.reduce((l,d)=>l+1+(Le(d.effectId)?.estimateDomNodes(d.settings)??0),1),n=t.reduce((l,d)=>l+(ze(d.effectId)?.performanceCost??1),0),s=document.querySelector("#pack06-performance");s&&(s.textContent=`DOM ~${a} · koszt ${n}`,s.classList.toggle("is-warning",a>600||n>24));const i=document.querySelector("#pack06-undo");i&&(i.disabled=!Nc(),i.title=jn()?`Cofnij: ${jn()}`:"Brak zmian do cofnięcia");const r=document.querySelector("#pack06-redo");r&&(r.disabled=!Lc(),r.title=_n()?`Ponów: ${_n()}`:"Brak zmian do ponowienia");const o=document.querySelector("#pack06-recover");o&&(o.disabled=!_l());const c=document.querySelector("#pack06-pause");c&&(c.textContent=ds?"▶ Wznów":"⏸ Pauza")}function yt(){wp(),kp(),vp(),ps(),us()}function xp(){ja!==null&&clearTimeout(ja),ja=window.setTimeout(()=>jl(he()),700)}function zp(){const e=document.querySelector(".ae-header-status");if(e&&!document.querySelector("#pack06-performance")){const s=document.createElement("span");s.id="pack06-performance",s.className="ae-status-pill",e.appendChild(s)}const t=document.querySelector(".ae-header-actions");if(!t||document.querySelector("#pack06-undo"))return;t.classList.add("ae-pack06-header-actions");const a=document.createElement("div");a.className="ae-pack06-header-group",a.innerHTML=`<button id="pack06-undo" class="ae-button ae-button-secondary" type="button">↶</button><button id="pack06-redo" class="ae-button ae-button-secondary" type="button">↷</button><button id="pack06-pause" class="ae-button ae-button-secondary" type="button">⏸ Pauza</button>
  <select id="pack06-preset" class="ae-category-select"><option value="">Preset sceny…</option>${qn.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select>
  <button id="pack06-save" class="ae-button ae-button-secondary" type="button">Zapisz scenę</button><button id="pack06-load" class="ae-button ae-button-secondary" type="button">Wczytaj</button><button id="pack06-recover" class="ae-button ae-button-secondary" type="button">Autozapis</button><button id="pack06-reroll-all" class="ae-button ae-button-secondary" type="button">🎲 Seedy</button><button id="pack06-media" class="ae-button ae-button-secondary" type="button">PNG / GIF</button>`,t.prepend(a),document.querySelector("#pack06-undo")?.addEventListener("click",()=>Er()),document.querySelector("#pack06-redo")?.addEventListener("click",()=>Cr()),document.querySelector("#pack06-pause")?.addEventListener("click",()=>document.dispatchEvent(new Event("animated-effects:transport-toggle"))),document.addEventListener("animated-effects:transport-state",s=>{ds=!s.detail.playing,us()}),document.querySelector("#pack06-reroll-all")?.addEventListener("click",()=>Gc()),document.querySelector("#pack06-media")?.addEventListener("click",()=>mp());const n=document.querySelector("#pack06-preset");n?.addEventListener("change",()=>{const s=qn.find(i=>i.id===n.value);s&&(Hc(s.effects,`Preset: ${s.name}`),n.value="")}),document.querySelector("#pack06-save")?.addEventListener("click",()=>Pl(he())),document.querySelector("#pack06-load")?.addEventListener("click",()=>document.querySelector("#pack06-file-input")?.click()),document.querySelector("#pack06-recover")?.addEventListener("click",()=>{const s=$l(he());s&&nn(s,"Przywróć autozapis")})}function Sp(){const e=document.querySelector(".ae-effect-filters");if(!e)return;let t=e.querySelector(":scope > .ae-pack14-library-tools");t||(t=document.createElement("div"),t.className="ae-pack06-library-tools ae-pack14-library-tools",e.appendChild(t));let a=document.querySelector("#pack06-library-mode");a||(a=document.createElement("select"),a.id="pack06-library-mode",a.className="ae-category-select",a.innerHTML='<option value="all">Widok: Wszystkie</option><option value="favorites">Widok: ★ Ulubione</option><option value="scene">Widok: ● Na scenie</option>',a.addEventListener("change",yt));let n=document.querySelector("#pack06-library-sort");n||(n=document.createElement("select"),n.id="pack06-library-sort",n.className="ae-category-select",n.innerHTML='<option value="name">Sortuj: Nazwa</option><option value="category">Sortuj: Kategoria</option><option value="used">Sortuj: Najczęściej używane</option><option value="recent">Sortuj: Ostatnio używane</option><option value="light">Sortuj: Najlżejsze</option><option value="heavy">Sortuj: Najcięższe</option>',n.addEventListener("change",yt)),a.parentElement!==t&&t.appendChild(a),n.parentElement!==t&&t.appendChild(n)}function Mp(){if(document.querySelector("#pack06-file-input"))return;const e=document.createElement("input");e.id="pack06-file-input",e.type="file",e.accept=".json,.aescene.json,application/json",e.hidden=!0,e.addEventListener("change",async()=>{const t=e.files?.[0];if(t)try{const a=Or(await t.text(),he());nn(a.state,`Wczytaj: ${a.name}`),a.warnings.length&&window.alert(["Scena wczytana z ostrzeżeniami:","",...a.warnings.slice(0,12)].join(`
`))}catch(a){window.alert(a instanceof Error?a.message:String(a))}finally{e.value=""}}),document.body.appendChild(e)}function Ep(){document.addEventListener("keydown",e=>{const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(e.ctrlKey&&!e.shiftKey&&e.key.toLowerCase()==="z"){e.preventDefault(),Er();return}(e.ctrlKey&&e.key.toLowerCase()==="y"||e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="z")&&(e.preventDefault(),Cr())}})}function Cp(){const e=document.querySelector("#inspector");if(!e)return;let t=!1;e.addEventListener("pointerdown",n=>{const s=n.target;s instanceof HTMLInputElement&&s.type==="range"&&(t=!0,en("Zmień parametr"))});const a=()=>{t&&(t=!1,tn())};window.addEventListener("pointerup",a),window.addEventListener("pointercancel",a)}function Pp(){Qn||(Qn=!0,zp(),Sp(),Mp(),Ep(),Cp(),Ac(),Mr(()=>{queueMicrotask(yt),xp()}),yt())}let _a=!1,Ta=null;function jp(){const e=document.querySelector(".ae-pack06-header-group");if(!e||document.querySelector(".ae-polish02-header"))return;const t=g=>e.querySelector(g),a=t("#pack06-undo"),n=t("#pack06-redo"),s=t("#pack06-pause"),i=t("#pack06-preset"),r=t("#pack06-save"),o=t("#pack06-load"),c=t("#pack06-recover"),l=t("#pack06-reroll-all"),d=t("#pack06-media");if(!a||!n||!s||!i||!r||!o||!c||!l||!d)return;c.textContent="Przywróć autozapis";const p=document.createElement("div");p.className="ae-polish02-header";const h=document.createElement("div");h.className="ae-polish02-direct",h.append(a,n,s);const f=(g,m)=>{const b=document.createElement("details");b.className="ae-polish02-menu";const w=document.createElement("summary");w.innerHTML=`${g} <span>▾</span>`;const k=document.createElement("div");return k.className="ae-polish02-menu-panel",k.append(...m),b.append(w,k),b};p.append(h,f("Scena",[i,r,o,c]),f("Narzędzia",[l,d])),e.replaceWith(p)}function _p(){const e=document.querySelector("#pack06-library-mode"),t=document.querySelector("#pack06-library-sort"),a=["Widok: Wszystkie","Widok: ★ Ulubione","Widok: ● Na scenie"],n=["Sortuj: Nazwa","Sortuj: Kategoria","Sortuj: Najczęściej używane","Sortuj: Ostatnio używane","Sortuj: Najlżejsze","Sortuj: Najcięższe"];e&&Array.from(e.options).forEach((s,i)=>{s.textContent=a[i]??s.textContent}),t&&Array.from(t.options).forEach((s,i)=>{s.textContent=n[i]??s.textContent})}function $p(){const e=document.querySelector("#effect-library");e&&(e.querySelectorAll(".ae-pack06-scene-badge").forEach(t=>t.remove()),Array.from(e.querySelectorAll(".ae-effect-card")).forEach(t=>{t.classList.add("ae-polish02-card");const a=t.querySelector(".ae-pack06-count");if(a){const s=a.textContent?.replace(/[^0-9]/g,"")||"1";a.textContent=s,a.title=`${s} warstw(y) · przejdź do Warstw`}const n=t.querySelector(".ae-pack06-favorite");n&&(n.title=n.textContent==="★"?"Usuń z ulubionych":"Dodaj do ulubionych")}),Ta!==null&&(Ta=null,requestAnimationFrame(()=>{document.querySelector("#effect-library")})))}function Rp(){const e=document.querySelector(".ae-inspector-panel");if(!e)return;e.classList.add("ae-polish02-inspector");const t=e.querySelector(".ae-pack06-inspector-title strong");t&&(t.textContent="Losowość")}function Zt(e){const t=(h,f)=>{const g=Number(e.querySelector(h)?.value??f);return Number.isFinite(g)?g:f},a=t("[data-media-width]",1280),n=t("[data-media-height]",720),s=t("[data-gif-seconds]",5),i=t("[data-gif-fps]",15),r=Math.max(1,Math.round(s*i)),o=a*n*r,c=o>3e8?"WYSOKIE":o>12e7?"ŚREDNIE":"NISKIE",l=e.querySelector("[data-polish02-summary]");l&&(l.innerHTML=`
      <strong>${r} klatek</strong>
      <span>${a} × ${n} · ${i} FPS · obciążenie: ${c}</span>
    `);const d=e.querySelector("[data-media-background]"),p=e.querySelector("[data-media-color]");d&&p&&(p.disabled=d.value!=="custom")}function Ip(){const e=document.querySelector(".ae-media-dialog");if(!e||e.dataset.polish02==="1")return;e.dataset.polish02="1";const t=e.querySelector(".ae-media-export");if(!t)return;const a=t.querySelector(":scope > .ae-media-grid");if(a){const r=document.createElement("section");r.className="ae-polish02-output";const o=document.createElement("div");o.className="ae-polish02-card-heading",o.innerHTML=`
      <strong>Ustawienia wyjścia</strong>
      <span>Rozdzielczość i tło eksportowanej sceny</span>
    `;const c=document.createElement("div");c.className="ae-polish02-presets",[["720p",1280,720],["1080p",1920,1080],["1:1",1080,1080],["9:16",1080,1920]].forEach(([d,p,h])=>{const f=document.createElement("button");f.type="button",f.textContent=d,f.addEventListener("click",()=>{const g=e.querySelector("[data-media-width]"),m=e.querySelector("[data-media-height]");g&&(g.value=String(p)),m&&(m.value=String(h)),Zt(e)}),c.appendChild(f)}),r.append(o,c,a),t.prepend(r)}const n=Array.from(t.querySelectorAll(".ae-media-section"));n.forEach(r=>{r.classList.add("ae-polish02-media-card");const o=r.querySelector("h3");if(o&&!r.querySelector(".ae-polish02-description")){const c=document.createElement("p");c.className="ae-polish02-description",c.textContent=o.textContent==="PNG"?"Pojedyncza klatka sceny w wybranym momencie animacji.":"Animowana pętla. Więcej klatek oznacza dłuższe generowanie i większy plik.",o.insertAdjacentElement("afterend",c)}});const s=n.find(r=>r.querySelector("h3")?.textContent==="GIF");if(s&&!s.querySelector("[data-polish02-summary]")){const r=document.createElement("div");r.className="ae-polish02-summary",r.dataset.polish02Summary="1",s.querySelector(".ae-media-actions")?.insertAdjacentElement("beforebegin",r)}const i=e.querySelector("[data-cancel-gif]");i&&(i.hidden=!0),e.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{i&&(i.hidden=!1);const r=e.querySelector("[data-gif-preview]");r&&(r.hidden=!0)}),e.addEventListener("input",()=>{Zt(e)}),e.addEventListener("change",()=>{Zt(e)}),Zt(e)}function er(){jp(),_p(),$p(),Rp(),Ip()}function Ap(){document.querySelector("#effect-library")?.addEventListener("click",t=>{const a=t.target;a instanceof Element&&a.closest(".ae-add-icon, .ae-pack06-minus")&&(Ta=document.querySelector("#effect-library")?.scrollTop??0)},!0),er();const e=new MutationObserver(()=>{_a||(_a=!0,requestAnimationFrame(()=>{e.disconnect();try{er()}finally{_a=!1,e.observe(document.body,{childList:!0,subtree:!0})}}))});e.observe(document.body,{childList:!0,subtree:!0})}const tr="animated-effects-module-styles";function Np(e){Lp();const t=document.createElement("div");return t.id="effect-preview",t.className="effect-preview",e.appendChild(t),t}function Oa(e,t){const a=Le(t.effectId);if(!a){console.warn(`Unknown effect: ${t.effectId}`);return}const n=document.createElement("div");n.className="effect-layer ae-layer",n.dataset.effectId=t.effectId,n.dataset.instanceId=t.instanceId,Op(n,t.settings);const s=Fp(t.seed);a.renderPreview(n,t.settings,s);const i=Ga(t),r=Ja(t);let o=e;for(const[c,l]of[[i,"ae-timed-layer"],[r,"ae-motion-layer"]]){if(!c)continue;const d=document.createElement("style");d.textContent=c.css,e.appendChild(d);const p=document.createElement("div");p.className=l,Object.assign(p.style,{position:"absolute",inset:"0",overflow:"hidden",pointerEvents:"none",zIndex:String(t.settings.zIndex),animation:c.animation}),o.appendChild(p),o=p}r&&(n.style.transform="none"),o.appendChild(n)}function Lp(){if(document.getElementById(tr))return;const e=document.createElement("style");e.id=tr,e.textContent=fc().map(t=>t.css).join(`

`),document.head.appendChild(e)}function Dp(e){const t=/^#[0-9a-f]{6}$/i.test(e)?e.slice(1):"a88cff",a=parseInt(t.slice(0,2),16)/255,n=parseInt(t.slice(2,4),16)/255,s=parseInt(t.slice(4,6),16)/255,i=Math.max(a,n,s),r=Math.min(a,n,s),o=i-r;let c=0;o!==0&&(i===a?c=60*((n-s)/o%6):i===n?c=60*((s-a)/o+2):c=60*((a-n)/o+4)),c<0&&(c+=360);const l=(i+r)/2,d=o===0?0:o/(1-Math.abs(2*l-1));return{h:c,s:d*100,l:l*100}}function Tp(e){if(!e.colorize)return"";const{h:t,s:a,l:n}=Dp(e.color??"#a88cff");if(a<4)return`
      grayscale(1)
      saturate(0)
      brightness(
        ${Math.max(.55,Math.min(1.8,.45+n/70))}
      )
    `;const s=Math.round(380+a*10),i=t-40,r=Math.max(.62,Math.min(1.55,.58+n/105));return`
    grayscale(1)
    sepia(1)
    saturate(
      ${s}%
    )
    hue-rotate(
      ${i}deg
    )
    brightness(
      ${r}
    )
  `}function Op(e,t){e.style.opacity=String(t.opacity/100),e.style.transform=`
    translate(
      ${t.x}%,
      ${t.y}%
    )
    scale(
      ${t.scale/100}
    )
    rotate(
      ${t.rotation}deg
    )
  `,e.style.filter=`
    ${Tp(t)}
    blur(
      ${t.blur}px
    )
    brightness(
      ${t.brightness/100}
    )
    hue-rotate(
      ${t.hue}deg
    )
  `,e.style.mixBlendMode=t.blendMode,e.style.zIndex=String(t.zIndex),e.style.clipPath=qp(t.area)}function qp(e){switch(e){case"left":return"inset(0 50% 0 0)";case"center":return"inset(0 25% 0 25%)";case"right":return"inset(0 0 0 50%)";case"top":return"inset(0 0 50% 0)";case"bottom":return"inset(50% 0 0 0)";default:return"none"}}function Fp(e){let t=e>>>0;return()=>{t+=1831565813;let a=t;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}const qe=new Map,Fe=e=>String(Number((e/1e3).toFixed(3)));function qa(e){const t=ve(e.timeline,e.settings).keyframes??[],a=qe.get(e.instanceId);return t.find(n=>n.timeMs===a)??t.at(-1)??null}function Bp(e){const t=ve(e.timeline,e.settings),a=t.keyframes??[],n=qa(e),s=a.length===0?0:a.length===1?t.durationMs:Math.round(t.durationMs/2),i=[{key:"timeMs",label:"Moment (s)",value:n?Fe(n.timeMs):"0",min:0,max:Fe(t.durationMs),step:"0.1"},{key:"x",label:"Pozycja X (%)",value:n?.x??e.settings.x,min:-300,max:300,step:"1"},{key:"y",label:"Pozycja Y (%)",value:n?.y??e.settings.y,min:-300,max:300,step:"1"},{key:"scale",label:"Skala (%)",value:n?.scale??e.settings.scale,min:10,max:400,step:"1"},{key:"rotation",label:"Obrót (°)",value:n?.rotation??e.settings.rotation,min:-1080,max:1080,step:"1"},{key:"opacity",label:"Widoczność (%)",value:n?.opacity??100,min:0,max:100,step:"1"}];return`
    <section class="ae-keyframe-editor" aria-label="Klatki kluczowe warstwy">
      <div class="ae-keyframe-head">
        <strong>Klatki kluczowe</strong>
        <small>${a.length} / ${ea} · ruch całej warstwy</small>
      </div>
      <p class="ae-timeline-hint">Klatki opisują pozycję, skalę, obrót i widoczność w danym momencie cyklu. Ruch nie wpływa na animacje cząsteczek wewnątrz efektu.</p>
      <label class="inspector-field">
        <span class="inspector-label"><span>Interpolacja</span></span>
        <select data-kf-easing aria-label="Interpolacja klatek kluczowych">
          <option value="linear" ${t.easing!=="ease-in-out"?"selected":""}>Liniowa</option>
          <option value="ease-in-out" ${t.easing==="ease-in-out"?"selected":""}>Płynna (ease-in-out)</option>
        </select>
      </label>
      <div class="ae-keyframe-presets">
        <button type="button" class="ae-button ae-button-secondary" data-kf-preset="slide">Przesunięcie →</button>
        <button type="button" class="ae-button ae-button-secondary" data-kf-preset="pulse">Pulsowanie</button>
      </div>
      <div class="ae-keyframe-ruler" data-kf-ruler aria-label="Przeciągnij klatkę na osi czasu">
        ${a.map((r,o)=>`<button type="button" class="ae-keyframe-dot${n?.timeMs===r.timeMs?" is-selected":""}"
          data-kf-marker="${r.timeMs}" style="left:${(r.timeMs/t.durationMs*100).toFixed(3)}%"
          title="Klatka ${o+1}: ${Fe(r.timeMs)} s"
          aria-label="Klatka ${o+1}, ${Fe(r.timeMs)} sekundy. Przeciągnij albo użyj strzałek."></button>`).join("")}
      </div>
      <output class="ae-keyframe-drag-time" data-kf-drag-time aria-live="off">Przesuń punkt, aby zmienić moment klatki · krok 0,1 s</output>
      <label class="inspector-field">
        <span class="inspector-label"><span>Edytowana klatka</span></span>
        <select data-kf-select aria-label="Wybierz klatkę kluczową" ${a.length?"":"disabled"}>
          ${a.map((r,o)=>`<option value="${r.timeMs}" ${n?.timeMs===r.timeMs?"selected":""}>${o+1}. ${Fe(r.timeMs)} s</option>`).join("")}
        </select>
      </label>
      <div class="ae-keyframe-fields" ${n?"":"hidden"}>
        ${i.map(r=>`
          <label class="ae-timeline-field">
            <span class="inspector-label"><span>${r.label}</span></span>
            <input type="number" data-kf-field="${r.key}" min="${r.min}" max="${r.max}" step="${r.step}" value="${r.value}">
          </label>
        `).join("")}
      </div>
      <div class="ae-keyframe-actions">
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Nowa klatka (s)</span></span>
          <input data-kf-new-time type="number" inputmode="decimal" value="${Fe(s)}" min="0" max="${Fe(t.durationMs)}" step="0.1">
        </label>
        <button type="button" class="ae-button ae-button-secondary" data-kf-add ${a.length>=ea?"disabled":""}>+ Dodaj</button>
        <button type="button" class="ae-button ae-button-secondary" data-kf-delete ${n?"":"disabled"}>Usuń klatkę</button>
      </div>
    </section>
  `}function Wp(e,t){const a=()=>he().effects.find(o=>o.instanceId===t),n=e.querySelector("[data-kf-select]"),s=e.querySelectorAll("[data-kf-field]");n?.addEventListener("change",()=>{const o=a();if(!o)return;const c=Number(n.value);qe.set(t,c);const l=ve(o.timeline,o.settings),d=l.keyframes?.find(p=>p.timeMs===c);d&&(document.dispatchEvent(new CustomEvent("animated-effects:preview-seek",{detail:{ms:l.delayMs+d.timeMs}})),s.forEach(p=>{const h=p.dataset.kfField;h==="timeMs"?p.value=Fe(d.timeMs):(h==="x"||h==="y"||h==="scale"||h==="rotation"||h==="opacity")&&(p.value=String(d[h]))}))}),s.forEach(o=>{o.addEventListener("change",()=>{const c=a(),l=c?qa(c):null,d=o.dataset.kfField,p=Number(o.value);if(!(!l||!Number.isFinite(p)||!d))if(d==="timeMs"){const h=Math.round(p*1e3);qe.set(t,Math.max(0,Math.min(ve(c.timeline,c.settings).durationMs,h))),Ot(t,l.timeMs,{timeMs:h})}else(d==="x"||d==="y"||d==="scale"||d==="rotation"||d==="opacity")&&Ot(t,l.timeMs,{[d]:p})})});const i=e.querySelector("[data-kf-ruler]"),r=e.querySelector("[data-kf-drag-time]");i?.querySelectorAll("[data-kf-marker]").forEach(o=>{const c=Number(o.dataset.kfMarker),l=a();if(!l||!Number.isFinite(c))return;const d=ve(l.timeline,l.settings).durationMs,p=()=>{qe.set(t,c),n&&(n.value=String(c),n.dispatchEvent(new Event("change",{bubbles:!0}))),i.querySelectorAll(".ae-keyframe-dot").forEach(k=>k.classList.toggle("is-selected",k===o))};let h=!1,f=null,g=c;const m=k=>{const x=i.getBoundingClientRect();return Jc(k,x.left,x.width,d)},b=k=>{o.style.left=`${(k/d*100).toFixed(3)}%`,r&&(r.value=`Moment klatki: ${Fe(k)} s`)},w=k=>{if(!h)return;h=!1,f!==null&&o.hasPointerCapture(f)&&o.releasePointerCapture(f),f=null;const x=a(),M=x&&ve(x.timeline,x.settings).keyframes?.some(C=>C.timeMs===g&&C.timeMs!==c);k&&g!==c&&!M?(qe.set(t,g),Ot(t,c,{timeMs:g})):(b(c),M&&r&&(r.value="W tym miejscu jest już inna klatka."))};o.addEventListener("pointerdown",k=>{k.button===0&&(p(),h=!0,g=c,f=k.pointerId,o.setPointerCapture(k.pointerId),k.preventDefault())}),o.addEventListener("pointermove",k=>{!h||k.pointerId!==f||(g=m(k.clientX),b(g))}),o.addEventListener("pointerup",k=>{k.pointerId===f&&(g=m(k.clientX),w(!0))}),o.addEventListener("pointercancel",()=>w(!1)),o.addEventListener("keydown",k=>{const x=k.key==="ArrowRight"?1:k.key==="ArrowLeft"?-1:0;if(!x)return;k.preventDefault();const M=Math.max(0,Math.min(d,c+x*(k.shiftKey?1e3:100)));if(M===c)return;const C=a();C&&ve(C.timeline,C.settings).keyframes?.some(A=>A.timeMs===M&&A.timeMs!==c)||(qe.set(t,M),Ot(t,c,{timeMs:M}))}),o.addEventListener("click",k=>{k.detail===0&&p()})}),e.querySelector("[data-kf-easing]")?.addEventListener("change",o=>{const c=o.currentTarget.value;$t(t,{easing:c==="ease-in-out"?"ease-in-out":"linear"})}),e.querySelector("[data-kf-add]")?.addEventListener("click",()=>{const o=e.querySelector("[data-kf-new-time]"),c=Math.round(Number(o?.value??0)*1e3);if(!Number.isFinite(c))return;const l=a();if(!l)return;const d=ve(l.timeline,l.settings).durationMs;qe.set(t,Math.max(0,Math.min(d,c))),Uc(t,c)}),e.querySelector("[data-kf-delete]")?.addEventListener("click",()=>{const o=a(),c=o?qa(o):null;c&&(qe.delete(t),Xc(t,c.timeMs))}),e.querySelectorAll("[data-kf-preset]").forEach(o=>{o.addEventListener("click",()=>{const c=a();if(!c)return;const l=ve(c.timeline,c.settings),d={x:c.settings.x,y:c.settings.y,scale:c.settings.scale,rotation:c.settings.rotation,opacity:100},p=o.dataset.kfPreset==="pulse"?[{timeMs:0,...d},{timeMs:Math.round(l.durationMs/2),...d,scale:Math.min(400,d.scale*1.3)},{timeMs:l.durationMs,...d}]:[{timeMs:0,...d},{timeMs:l.durationMs,...d,x:Math.min(300,d.x+35)}];qe.set(t,l.durationMs),$t(t,{mode:l.mode==="off"?"once":l.mode,keyframes:p})})})}const Up={slide:"Wjazd",fade:"Pojawienie",pop:"Powiększenie",zoom:"Zbliżenie z daleka",bounce:"Odbicie",drop:"Spadnięcie z góry",blur:"Wyostrzenie"},Xp={fade:"Zanikanie",slide:"Wyjazd",pop:"Zmniejszenie",zoom:"Oddalenie",drop:"Opadnięcie",blur:"Rozmycie"},Zp={default:"Domyślna strony",system:"Systemowa",impact:"Impact",trebuchet:"Trebuchet MS",verdana:"Verdana",georgia:"Georgia",mono:"Stała szerokość",comic:"Comic Sans"},Gp={shadow:"Cień",outline:"Obrys",glow:"Poświata",none:"Brak"},Hp={none:"Brak",box:"Prostokąt",pill:"Plakietka"},Yp={none:"Brak",wave:"Fala",typewriter:"Maszyna do pisania",pop:"Wyskakiwanie"},dt=(e,t,a)=>e.map(n=>`<option value="${n}" ${n===a?"selected":""}>${t[n]??n}</option>`).join(""),fs={"follower-latest":5,"subscriber-latest":7,"tip-latest":9,"cheer-latest":8,"raid-latest":8,message:2},ms={"follower-latest":"Dzięki za follow, {name}!","subscriber-latest":"{name} — dzięki za subskrypcję!","tip-latest":"{name} przekazał {amount}!","cheer-latest":"{name} wysłał {amount} bits!","raid-latest":"{name} robi raid ({amount})!",message:"{name}: {message}"};function Jp(e){const t=$e(e.trigger),a=t?.event??"follower-latest",n=a==="tip-latest"||a==="cheer-latest"||a==="raid-latest",s=ba({...t?.caption,template:t?.caption?.template??ms[a]}),i=r=>r.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return`
    <section class="ae-trigger-panel" aria-label="Wyzwalacze StreamElements">
      <div class="ae-trigger-heading">
        <strong>Wyzwalacz StreamElements</strong>
        <span>Uruchamiaj tę warstwę po zdarzeniu ze streamu</span>
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Uruchamianie warstwy</span></span>
        <select data-ae-trigger-event aria-label="Zdarzenie uruchamiające animację">
          <option value="always" ${t?"":"selected"}>Od razu (zawsze)</option>
          ${ht.map(r=>`
            <option value="${r.value}" ${t?.event===r.value?"selected":""}>${r.label}</option>
          `).join("")}
        </select>
      </label>
      <div class="ae-trigger-advanced" ${t?"":"hidden"}>
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Odstęp między uruchomieniami (s)</span></span>
          <input data-ae-trigger-cooldown type="number" min="0" max="60" step="0.5"
            value="${(t?.cooldownMs??3e3)/1e3}">
        </label>
        <label class="ae-timeline-field" data-ae-trigger-amount-row ${n?"":"hidden"}>
          <span class="inspector-label"><span>Minimalna kwota / liczba</span></span>
          <input data-ae-trigger-amount type="number" min="0" max="1000000" step="1"
            value="${t?.minAmount??0}">
        </label>
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Gdy kilka zdarzeń nastąpi szybko</span></span>
          <select data-ae-trigger-queue-mode aria-label="Tryb odtwarzania zdarzeń">
            <option value="replace" ${t?.queueMode!=="queue"?"selected":""}>Restartuj ten efekt (zgodność wsteczna)</option>
            <option value="queue" ${t?.queueMode==="queue"?"selected":""}>Kolejkuj z pozostałymi alertami</option>
          </select>
        </label>
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Priorytet w kolejce (0–10)</span></span>
          <input data-ae-trigger-priority type="number" min="0" max="10" step="1"
            value="${t?.priority??fs[a]}">
        </label>
        <p class="ae-timeline-hint">Wyższy priorytet wyprzedza oczekujące alerty, ale nie przerywa odtwarzanego. Przy remisie zachowywana jest kolejność nadejścia.</p>
        <p class="ae-timeline-hint">Kolejka jest wspólna dla warstw z wybraną opcją. Odtwarza jeden alert naraz (maks. 16 oczekujących), bez nakładania efektów zdarzeniowych w trybie kolejki.</p>
        <div class="ae-caption-fields">
          <label class="ae-caption-switch">
            <input type="checkbox" data-ae-caption-enabled ${s.enabled?"checked":""}>
            <span>Pokazuj napis na animacji</span>
          </label>
          <div class="ae-caption-settings" ${s.enabled?"":"hidden"}>
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Wzór napisu</span></span>
              <input type="text" data-ae-caption-template maxlength="160" value="${i(s.template)}"
                placeholder="Dziękujemy {name}!" aria-label="Wzór napisu na animacji">
            </label>
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Druga linia (mniejsza)</span></span>
              <input type="text" data-ae-caption-subtitle maxlength="160" value="${i(s.subtitle??"")}"
                placeholder="{message}" aria-label="Druga linia napisu">
            </label>
            <p class="ae-timeline-hint">Dostępne zmienne: <code>{name}</code>, <code>{amount}</code>, <code>{message}</code>, <code>{event}</code>. Nazwy widzów i wiadomości są wyświetlane jako zwykły tekst. Pusta druga linia nie jest pokazywana.</p>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Czcionka</span></span>
                <select data-ae-caption-font>${dt(mr,Zp,s.font)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Efekt tekstu</span></span>
                <select data-ae-caption-effect>${dt(yr,Gp,s.effect)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja liter</span></span>
                <select data-ae-caption-letters>${dt(gr,Yp,s.letters)}</select>
              </label>
            </div>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Tło napisu</span></span>
                <select data-ae-caption-background>${dt(hr,Hp,s.background)}</select>
              </label>
              <label class="ae-timeline-field" ${s.background==="none"?"hidden":""}>
                <span class="inspector-label"><span>Kolor tła</span></span>
                <input data-ae-caption-bg-color type="color" value="${s.backgroundColor??"#0f172a"}" aria-label="Kolor tła napisu">
              </label>
              <label class="ae-timeline-field" ${s.background==="none"?"hidden":""}>
                <span class="inspector-label"><span>Krycie tła (%)</span></span>
                <input data-ae-caption-bg-opacity type="number" min="0" max="100" step="5" value="${s.backgroundOpacity??70}">
              </label>
            </div>
            <div class="ae-caption-row">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Położenie</span></span>
                <select data-ae-caption-position>
                  <option value="top" ${s.position==="top"?"selected":""}>Góra</option>
                  <option value="center" ${s.position==="center"?"selected":""}>Środek</option>
                  <option value="bottom" ${s.position==="bottom"?"selected":""}>Dół</option>
                  <option value="custom" ${s.position==="custom"?"selected":""}>Własna pozycja (X/Y)</option>
                </select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Rozmiar (px)</span></span>
                <input data-ae-caption-size type="number" min="14" max="120" step="1" value="${s.fontSize}">
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Kolor</span></span>
                <input data-ae-caption-color type="color" value="${s.color}" aria-label="Kolor podpisu">
              </label>
            </div>
            <div class="ae-caption-row" data-ae-custom-position-row ${s.position==="custom"?"":"hidden"}>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>X — środek (%)</span></span>
                <input type="number" data-ae-caption-x min="25" max="75" step="1" value="${s.xPercent??50}">
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Y — środek (%)</span></span>
                <input type="number" data-ae-caption-y min="10" max="90" step="1" value="${s.yPercent??75}">
              </label>
            </div>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wejścia</span></span>
                <select data-ae-caption-intro>${dt(Va,Up,s.intro)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wyjścia</span></span>
                <select data-ae-caption-outro>${dt(Ka,Xp,s.outro)}</select>
              </label>
            </div>
            <p class="ae-timeline-hint">W trybie własnej pozycji można też przeciągnąć podpis na podglądzie przyciskiem „Testuj w podglądzie”.</p>
            <label class="ae-caption-switch">
              <input type="checkbox" data-ae-caption-avatar ${s.avatarEnabled?"checked":""}>
              <span>Pokaż awatar (lub inicjał widza)</span>
            </label>
            <label class="ae-timeline-field" data-ae-avatar-size-row ${s.avatarEnabled?"":"hidden"}>
              <span class="inspector-label"><span>Rozmiar awatara (px)</span></span>
              <input type="number" data-ae-caption-avatar-size min="32" max="144" step="4" value="${s.avatarSize??72}">
            </label>
            <p class="ae-timeline-hint">Zdjęcie pojawi się tylko, jeśli StreamElements przekaże adres z zaufanego serwera obrazów. W pozostałych przypadkach użyty zostanie inicjał nazwy widza.</p>
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Obrazek / GIF alertu (adres https)</span></span>
              <input type="url" data-ae-caption-image maxlength="500" value="${i(s.imageUrl??"")}"
                placeholder="https://…/alert.gif" aria-label="Adres obrazka alertu" spellcheck="false" autocomplete="off">
            </label>
            <label class="ae-timeline-field" data-ae-image-size-row ${s.imageUrl?"":"hidden"}>
              <span class="inspector-label"><span>Wysokość obrazka (px)</span></span>
              <input type="number" data-ae-caption-image-size min="40" max="400" step="10" value="${s.imageSize??160}">
            </label>
            <p class="ae-timeline-hint">Obrazek lub GIF stoi nad napisem. Najprościej wgrać plik do StreamElements (biblioteka mediów) i wkleić jego adres. Puste pole = bez obrazka.</p>
          </div>
        </div>
        <div class="ae-caption-fields ae-sound-fields">
          <label class="ae-timeline-field">
            <span class="inspector-label"><span>Dźwięk alertu (adres https pliku .mp3 / .ogg / .wav)</span></span>
            <input type="url" data-ae-trigger-sound-url maxlength="500" value="${i(t?.sound?.url??"")}"
              placeholder="https://…/alert.mp3" aria-label="Adres dźwięku alertu" spellcheck="false" autocomplete="off">
          </label>
          <div class="ae-caption-row">
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Głośność (%)</span></span>
              <input data-ae-trigger-sound-volume type="number" min="0" max="100" step="5" value="${t?.sound?.volume??70}">
            </label>
            <button type="button" class="ae-button ae-button-secondary" data-ae-trigger-sound-test ${t?.sound?"":"disabled"}>
              <span aria-hidden="true">♪</span> Odsłuchaj
            </button>
          </div>
          <p class="ae-timeline-hint">Opcjonalnie. Najprościej wgrać plik do StreamElements (biblioteka mediów) i wkleić jego adres. Puste pole = alert bez dźwięku.</p>
        </div>
        <p class="ae-timeline-hint">Każde zdarzenie odtwarza jeden cykl animacji (również jeśli oś czasu ustawiono na pętlę). Przy kolejnych zdarzeniach warstwa jest uruchamiana od początku.</p>
        <button type="button" class="ae-button ae-button-secondary" data-ae-trigger-test>
          <span aria-hidden="true">▶</span> Testuj w podglądzie
        </button>
      </div>
      ${t?"":'<p class="ae-timeline-hint">Warstwa jest widoczna od razu. Efekt nie czeka na wydarzenie.</p>'}
    </section>
  `}function Vp(e,t){const a=e.querySelector("[data-ae-trigger-event]"),n=l=>{const d=$e(t.trigger),p=a?.value;if(!p||p==="always"){aa(t.instanceId,void 0);return}ht.some(h=>h.value===p)&&aa(t.instanceId,{source:"event",event:l.event??p,cooldownMs:l.cooldownMs??d?.cooldownMs??3e3,minAmount:l.minAmount??d?.minAmount??0,caption:l.caption??d?.caption,queueMode:l.queueMode??d?.queueMode??"queue",priority:l.priority??d?.priority??fs[p],sound:l.sound===null?void 0:l.sound??d?.sound})};a?.addEventListener("change",()=>n({})),e.querySelector("[data-ae-trigger-cooldown]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&n({cooldownMs:Math.round(d*1e3)})}),e.querySelector("[data-ae-trigger-amount]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&n({minAmount:Math.round(d)})}),e.querySelector("[data-ae-trigger-queue-mode]")?.addEventListener("change",l=>{const d=l.currentTarget.value;(d==="replace"||d==="queue")&&n({queueMode:d})}),e.querySelector("[data-ae-trigger-priority]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&n({priority:d})});const s=l=>{const d=$e(t.trigger),p=a?.value,h=d?.caption??{...We,template:p&&ms[p]||We.template},f=ba({...h,...l});n({caption:f})};e.querySelector("[data-ae-caption-enabled]")?.addEventListener("change",l=>{s({enabled:l.currentTarget.checked})}),e.querySelector("[data-ae-caption-template]")?.addEventListener("change",l=>{s({template:l.currentTarget.value})}),e.querySelector("[data-ae-caption-position]")?.addEventListener("change",l=>{const d=l.currentTarget.value;(d==="top"||d==="center"||d==="bottom"||d==="custom")&&s({position:d})}),e.querySelector("[data-ae-caption-size]")?.addEventListener("change",l=>{s({fontSize:Number(l.currentTarget.value)})}),e.querySelector("[data-ae-caption-x]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&s({xPercent:d})}),e.querySelector("[data-ae-caption-y]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&s({yPercent:d})}),e.querySelector("[data-ae-caption-intro]")?.addEventListener("change",l=>{const d=l.currentTarget.value,p=Va.find(h=>h===d);p&&s({intro:p})}),e.querySelector("[data-ae-caption-outro]")?.addEventListener("change",l=>{const d=l.currentTarget.value,p=Ka.find(h=>h===d);p&&s({outro:p})}),e.querySelector("[data-ae-caption-avatar]")?.addEventListener("change",l=>{s({avatarEnabled:l.currentTarget.checked})}),e.querySelector("[data-ae-caption-avatar-size]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&s({avatarSize:d})}),e.querySelector("[data-ae-caption-image]")?.addEventListener("change",l=>{const d=l.currentTarget,p=br(d.value);d.value.trim()&&!p?d.setCustomValidity("Adres musi zaczynać się od https://"):d.setCustomValidity(""),s({imageUrl:p})}),e.querySelector("[data-ae-caption-image-size]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&s({imageSize:d})}),e.querySelector("[data-ae-caption-color]")?.addEventListener("change",l=>{s({color:l.currentTarget.value})}),e.querySelector("[data-ae-caption-subtitle]")?.addEventListener("change",l=>{s({subtitle:l.currentTarget.value})});const i=(l,d)=>{e.querySelector(l)?.addEventListener("change",p=>{s({[d]:p.currentTarget.value})})};i("[data-ae-caption-font]","font"),i("[data-ae-caption-effect]","effect"),i("[data-ae-caption-background]","background"),i("[data-ae-caption-letters]","letters"),e.querySelector("[data-ae-caption-bg-color]")?.addEventListener("change",l=>{s({backgroundColor:l.currentTarget.value})}),e.querySelector("[data-ae-caption-bg-opacity]")?.addEventListener("change",l=>{const d=Number(l.currentTarget.value);Number.isFinite(d)&&s({backgroundOpacity:d})});const r=e.querySelector("[data-ae-trigger-sound-url]"),o=e.querySelector("[data-ae-trigger-sound-volume]"),c=()=>{const l=kr(r?.value??""),d=Number(o?.value);n({sound:l?{url:l,volume:Number.isFinite(d)?d:70}:null})};r?.addEventListener("change",c),o?.addEventListener("change",c),e.querySelector("[data-ae-trigger-sound-test]")?.addEventListener("click",()=>{vr($e(t.trigger)?.sound)}),e.querySelector("[data-ae-trigger-test]")?.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:t.instanceId}}))})}function Kp(e){const t=ga(e.timeline),a=i=>String(Number((i/1e3).toFixed(3))),n=t.delayMs+t.durationMs,s=[{cls:"wait",amount:t.delayMs,title:"Oczekiwanie"},{cls:"fade-in",amount:t.fadeInMs,title:"Wejście"},{cls:"hold",amount:t.durationMs-t.fadeInMs-t.fadeOutMs,title:"Widoczność"},{cls:"fade-out",amount:t.fadeOutMs,title:"Wyjście"}];return`
    <section class="inspector-group ae-timeline-panel">
      <div class="ae-timeline-heading">
        <strong>Oś czasu warstwy</strong>
        <span>Planowanie wejścia, wyjścia i powtórzeń</span>
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Odtwarzanie</span></span>
        <select data-timeline-mode aria-label="Odtwarzanie warstwy">
          <option value="off" ${t.mode==="off"?"selected":""}>Ciągły (bez harmonogramu)</option>
          <option value="once" ${t.mode==="once"?"selected":""}>Jeden cykl</option>
          <option value="loop" ${t.mode==="loop"?"selected":""}>Pętla</option>
        </select>
      </label>
      ${Jp(e)}
      <div class="ae-timeline-controls" ${t.mode==="off"?"hidden":""}>
        ${[["delayMs","Start po",0,60],["durationMs","Czas aktywności",.25,120],["fadeInMs","Pojawianie",0,120],["fadeOutMs","Zanikanie",0,120]].map(([i,r,o,c])=>`
          <label class="inspector-field ae-timeline-field">
            <span class="inspector-label"><span>${r} (s)</span></span>
            <input type="number" inputmode="decimal" min="${o}" max="${c}" step="0.1"
              data-timeline-field="${i}" value="${a(t[i])}" aria-label="${r} w sekundach">
          </label>
        `).join("")}
        <div class="ae-timeline-ruler" role="img"
          aria-label="Cykl ${a(n)} sekund; początek ${a(t.delayMs)} sekund; aktywność ${a(t.durationMs)} sekund">
          ${s.filter(i=>i.amount>0).map(i=>`<span class="ae-timeline-segment is-${i.cls}" title="${i.title}" style="flex:${i.amount}"></span>`).join("")}
        </div>
        ${Bp(e)}
        <div class="ae-timeline-actions">
          <small>Cykl: ${a(n)} s ${t.mode==="loop"?"· powtarzany":"· jeden raz"}</small>
          <button type="button" class="ae-button ae-button-secondary" data-timeline-replay>
            <span aria-hidden="true">↺</span> Odtwórz od początku
          </button>
        </div>
      </div>
      ${t.mode==="off"?'<p class="ae-timeline-hint">Efekt działa bez przerwy, jak w starszych scenach.</p>':""}
    </section>
  `}function Qp(e,t){const a=e.querySelector("[data-timeline-mode]");a?.addEventListener("change",()=>{const s=a.value;(s==="off"||s==="once"||s==="loop")&&$t(t,{mode:s})}),e.querySelectorAll("[data-timeline-field]").forEach(s=>{s.addEventListener("change",()=>{const i=s.dataset.timelineField;if(i!=="delayMs"&&i!=="durationMs"&&i!=="fadeInMs"&&i!=="fadeOutMs")return;const r=Number(s.value);Number.isFinite(r)&&$t(t,{[i]:Math.round(r*1e3)})})}),e.querySelector("[data-timeline-replay]")?.addEventListener("click",()=>{document.dispatchEvent(new Event("animated-effects:replay-preview"))}),Wp(e,t);const n=he().effects.find(s=>s.instanceId===t);n&&Vp(e,n)}const eu={"wireframe-cube":["Minimal","Neon","Heavy Grid","Glitch Cube"],polyhedron:["Quiet Facets","Prism","Crystal Storm","Void Poly"],"orbiting-core":["Ambient","Reactor","Overdrive","Alien Core"],"neon-tunnel":["Slow Drive","Synthwave","Hyperspace","Dense Grid"],"fractal-rings":["Soft Rings","Recursive","Pulse Stack","Violet Fractal"],"particle-vortex":["Gentle Spiral","Maelstrom","Energy Core","Wide Orbit"],"liquid-blobs":["Calm Fluid","Lava Lamp","Reactive","Alien Goo"],"cell-division":["Calm Colony","Rapid Growth","Microscope","Alien Cells"],"growing-vines":["Sprout","Garden","Wild Growth","Arcane Vine"],"constellation-network":["Sparse Sky","Constellation","Dense Network","Cyber Stars"],"shockwave-bursts":["Soft Pulse","Impact","Bombardment","Violet Wave"],"data-nodes":["Sparse","Tactical","Dense Mesh","Corrupted"],"spiral-galaxy":["Distant","Milky","Starburst","Alien Galaxy"],"recursive-squares":["Minimal","Infinite","Fast Zoom","Synth Grid"],"dna-helix":["Scientific","Neon DNA","Dense Helix","Mutant"],"floating-cubes":["Sparse","Matrix","Cube Storm","Violet Space"]};function tu(e){return[{id:"soft",name:e[0],description:"Subtelniejszy i spokojniejszy wariant.",settings:{opacity:48,density:28,speed:55,intensity:55,scale:90,brightness:105}},{id:"classic",name:e[1],description:"Zbalansowana wersja efektu.",settings:{opacity:74,density:58,speed:90,intensity:78,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:e[2],description:"Gęstszy, szybszy i mocniejszy wariant.",settings:{opacity:92,density:100,speed:155,intensity:100,scale:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:68,speed:105,intensity:86,scale:105,hue:95,brightness:150,blendMode:"screen"}}]}const au=Object.fromEntries(Object.entries(eu).map(([e,t])=>[e,tu(t)])),nu={fireworks:["Celebration","Night Sky","Finale","Violet Burst"],"radar-sweep":["Tactical","Slow Scan","Alert","Deep Space"],"warp-speed":["Cruise","Hyperspace","Overdrive","Violet Warp"],"hex-pulse":["Soft Shield","Tech Grid","Overcharge","Arcane Hex"],"circuit-traces":["Sparse PCB","Data Flow","Dense Board","Corrupted"],"light-leaks":["Warm Film","Dreamy","Bright Lens","Violet Leak"],"gravity-well":["Calm Orbit","Accretion","Singularity","Violet Well"],"pixel-storm":["Sparse Pixels","Digital Rain","Pixel Storm","Glitch Surge"]};function ru(e){return[{id:"soft",name:e[0],description:"Spokojniejszy wariant.",settings:{opacity:48,density:34,speed:62,intensity:55,brightness:110}},{id:"balanced",name:e[1],description:"Zbalansowany wariant.",settings:{opacity:72,density:62,speed:95,intensity:78,brightness:125,blendMode:"screen"}},{id:"strong",name:e[2],description:"Mocny i gęsty wariant.",settings:{opacity:92,density:100,speed:145,intensity:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:72,speed:105,intensity:90,hue:95,brightness:145,blendMode:"screen"}}]}const su=Object.fromEntries(Object.entries(nu).map(([e,t])=>[e,ru(t)]));function iu(e){return[{id:"soft",name:e[0],description:"Subtelniejsza, czytelna wersja efektu.",settings:{opacity:52,density:48,speed:72,intensity:72,scale:90,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant do codziennego użycia.",settings:{opacity:74,density:84,speed:100,intensity:100,scale:100,brightness:122}},{id:"intense",name:e[2],description:"Dużo mocniejszy, gęstszy i szybszy wariant.",settings:{opacity:88,density:165,speed:165,intensity:180,scale:112,brightness:140}},{id:"overdrive",name:e[3],description:"Wariant overdrive z gotowymi presetami bardzo wysokiej intensywności.",settings:{opacity:96,density:320,speed:320,intensity:320,scale:126,brightness:155}}]}const ou={gears:["Workshop","Machinery","Forge Rush","Titan Drive"],comets:["Sparse Sky","Night Flight","Meteor Rain","Hyper Trail"],fireworks:["Celebration","Festival","Grand Finale","Sky Overdrive"],"lightning-storm":["Far Storm","Tempest","Voltage","Cataclysm"],"liquid-blobs":["Calm Fluid","Reactive","Mutagen","Meta Flood"],"particle-vortex":["Gentle Spiral","Cyclone","Maelstrom","Singularity"],"portal-rings":["Gateway","Transit","Quantum Gate","Dimensional Breach"],"radar-sweep":["Recon","Tracking","Combat Scan","Full Spectrum"],"glitch-blocks":["Signal Noise","Decode","Corruption","Hard Desync"],"gravity-well":["Orbit","Collapse","Accretion","Event Horizon"],"hex-grid":["Mesh","Shield","Pulse","Lattice Storm"],"floating-cubes":["Low Orbit","Voxel Drift","Cube Field","Cube Storm"],"prism-drift":["Glass","Iridescent","Crystal Bloom","Prism Swarm"],"neon-shards":["Trail","Fragments","Rift","Shatter Burst"],"plasma-storm":["Spark","Flow","Flux","Overcharge"],"cube-swarm":["Scout","Formation","Cloud","Voxel Torrent"]},cu=Object.fromEntries(Object.entries(ou).map(([e,t])=>[e,iu(t)])),lu={"black-hole-accretion":["Quiet Orbit","Accretion","Collapse","Event Horizon"],"orbital-debris":["Sparse Orbit","Debris Belt","Collision Zone","Orbital Storm"],"star-tunnel":["Cruise","Star Drive","Hyperspace","Tunnel Overdrive"],"energy-lattice":["Soft Mesh","Energy Grid","Dense Lattice","Grid Overdrive"],"target-lock":["Recon","Tracking","Combat Lock","Full Lock"],"scanner-beams":["Slow Scan","Sweep","Multi Scan","Scanner Overdrive"],"digital-fragments":["Sparse Data","Fragmented","Corruption","Hard Break"],"pixel-melt":["Light Melt","Digital Drip","Collapse","Pixel Flood"],"wireframe-cubes":["Sparse","Wire Space","Cube Field","Wire Storm"],"floating-polyhedra":["Facets","Poly Drift","Crystal Field","Poly Storm"],"shockwave-rings":["Soft Pulse","Impact","Bombardment","Shock Overdrive"],"electric-web":["Static","Electric Net","Arc Web","Voltage Storm"],"ribbon-streamers":["Soft Ribbons","Festival","Ribbon Flow","Streamer Storm"],"ink-clouds":["Soft Ink","Deep Water","Ink Bloom","Ink Flood"]};function du(e){return[{id:"soft",name:e[0],description:"Subtelna wersja do spokojnych scen.",settings:{opacity:52,density:42,speed:62,intensity:62,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:76,density:88,speed:100,intensity:100,brightness:124}},{id:"strong",name:e[2],description:"Mocny wariant z większą gęstością.",settings:{opacity:90,density:180,speed:165,intensity:185,brightness:142}},{id:"overdrive",name:e[3],description:"Bardzo intensywny preset wykorzystujący rozszerzony zakres.",settings:{opacity:96,density:340,speed:320,intensity:340,brightness:160}}]}const pu=Object.fromEntries(Object.entries(lu).map(([e,t])=>[e,du(t)])),uu={fireworks:{keys:["burstSize","trailLength","cadence"],names:["Soft","Balanced","Strong","Overdrive"]},lightning:{keys:["branching","boltLength","flash"],names:["Soft","Balanced","Strong","Overdrive"]},"lightning-storm":{keys:["branching","stormSpread","flash"],names:["Soft","Balanced","Strong","Overdrive"]},gears:{keys:["teeth","spacing","mechanicalChaos"],names:["Soft","Balanced","Strong","Overdrive"]},"liquid-blobs":{keys:["viscosity","blobSize","merge"],names:["Soft","Balanced","Strong","Overdrive"]},"gravity-well":{keys:["pull","orbitSpread","coreSize"],names:["Soft","Balanced","Strong","Overdrive"]},"black-hole-accretion":{keys:["discWidth","pull","glow"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-web":{keys:["connections","reach","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-arcs":{keys:["arcLength","jitter","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"spiral-galaxy":{keys:["armTightness","coreGlow","armSpread"],names:["Soft","Balanced","Strong","Overdrive"]},"growing-vines":{keys:["curl","branches","growth"],names:["Soft","Balanced","Strong","Overdrive"]},"neon-tunnel":{keys:["depth","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},scanlines:{keys:["lineGap","flicker","drift"],names:["Soft","Balanced","Strong","Overdrive"]},"laser-grid":{keys:["perspective","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"vhs-static":{keys:["noise","tracking","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"hud-grid":{keys:["gridSpacing","scan","markers"],names:["Soft","Balanced","Strong","Overdrive"]},"city-lights":{keys:["skyline","parallax","windows"],names:["Soft","Balanced","Strong","Overdrive"]},embers:{keys:["lift","trail","flicker"],names:["Soft","Balanced","Strong","Overdrive"]},"dust-motes":{keys:["depth","drift","sparkle"],names:["Soft","Balanced","Strong","Overdrive"]},"magnetic-field":{keys:["curvature","poleDistance","flow"],names:["Soft","Balanced","Strong","Overdrive"]},"volumetric-rays":{keys:["spread","softness","sweep"],names:["Soft","Balanced","Strong","Overdrive"]},"plasma-filaments":{keys:["curl","length","heat"],names:["Soft","Balanced","Strong","Overdrive"]},"ripple-field":{keys:["radius","frequency","distortion"],names:["Soft","Balanced","Strong","Overdrive"]},"bioluminescent-plankton":{keys:["current","flash","swarm"],names:["Soft","Balanced","Strong","Overdrive"]},"glass-shards":{keys:["shardSize","spin","reflection"],names:["Soft","Balanced","Strong","Overdrive"]},"aurora-curtains":{keys:["curtainWidth","wave","depth"],names:["Soft","Balanced","Strong","Overdrive"]},"data-streams":{keys:["packetLength","lanes","dropout"],names:["Soft","Balanced","Strong","Overdrive"]},"orbital-rings":{keys:["tilt","radius","satellites"],names:["Soft","Balanced","Strong","Overdrive"]},"prism-caustics":{keys:["spread","softness","motion"],names:["Soft","Balanced","Strong","Overdrive"]},"ember-ribbons":{keys:["trail","curl","sparks"],names:["Soft","Balanced","Strong","Overdrive"]},"fractal-branches":{keys:["branching","angle","growth"],names:["Soft","Balanced","Strong","Overdrive"]}};function fu(e,t){return[{id:"soft",name:t[0],description:"Subtelny wariant.",settings:{opacity:56,density:48,speed:68,intensity:72,brightness:112,custom:{[e[0]]:72,[e[1]]:78,[e[2]]:70}}},{id:"balanced",name:t[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:80,density:92,speed:100,intensity:105,brightness:128,custom:{[e[0]]:100,[e[1]]:100,[e[2]]:100}}},{id:"strong",name:t[2],description:"Mocniejszy wariant.",settings:{opacity:92,density:175,speed:155,intensity:185,brightness:148,custom:{[e[0]]:145,[e[1]]:140,[e[2]]:150}}},{id:"overdrive",name:t[3],description:"Ekstremalny wariant.",settings:{opacity:98,density:330,speed:300,intensity:340,brightness:170,custom:{[e[0]]:185,[e[1]]:180,[e[2]]:190}}}]}const mu=Object.fromEntries(Object.entries(uu).map(([e,t])=>[e,fu(t.keys,t.names)])),yu={rainfall:[{id:"drizzle",name:"Mżawka",description:"Rzadki, spokojny deszcz w tle.",settings:{opacity:55,density:30,speed:65,scale:80,blur:0,brightness:95}},{id:"steady",name:"Równy deszcz",description:"Klasyczny, równomierny opad.",settings:{opacity:72,density:65,speed:105,scale:100,blur:0,brightness:100}},{id:"storm",name:"Ulewa",description:"Gęsty i szybki deszcz.",settings:{opacity:90,density:100,speed:175,scale:110,blur:1,brightness:115,blendMode:"screen"}},{id:"windy",name:"Deszcz z wiatrem",description:"Szybszy opad z wyraźnym pochyleniem warstwy.",settings:{opacity:78,density:72,speed:145,scale:105,rotation:-10,brightness:105}}],snow:[{id:"gentle",name:"Lekki śnieg",description:"Powolne, delikatne płatki.",settings:{opacity:62,density:35,speed:45,scale:90,blur:0,brightness:110}},{id:"classic",name:"Klasyczny",description:"Zbalansowany śnieg.",settings:{opacity:78,density:60,speed:75,scale:100,blur:0,brightness:115}},{id:"blizzard",name:"Zamieć",description:"Bardzo gęsty i szybki opad.",settings:{opacity:92,density:100,speed:165,scale:90,blur:1,brightness:125}},{id:"large",name:"Duże płatki",description:"Większe, bardziej widoczne płatki.",settings:{opacity:84,density:45,speed:60,scale:150,blur:1,brightness:120}}],lightning:[{id:"distant",name:"Odległa burza",description:"Rzadsze i subtelniejsze błyski.",settings:{opacity:52,density:30,speed:60,scale:100,blur:2,brightness:115}},{id:"classic",name:"Burza",description:"Zbalansowane wyładowania.",settings:{opacity:78,density:58,speed:105,scale:100,blur:1,brightness:130}},{id:"violent",name:"Gwałtowna",description:"Częste i bardzo jasne błyski.",settings:{opacity:100,density:95,speed:175,scale:110,blur:0,brightness:190}},{id:"purple",name:"Fioletowa burza",description:"Magiczny, fioletowy wariant wyładowań.",settings:{opacity:88,density:70,speed:125,scale:105,hue:115,brightness:150,blendMode:"screen"}}],hearts:[{id:"soft",name:"Delikatne",description:"Rzadkie, spokojnie unoszące się serca.",settings:{opacity:58,density:28,speed:55,scale:90,blur:0,brightness:105}},{id:"classic",name:"Klasyczne",description:"Zbalansowany romantyczny efekt.",settings:{opacity:78,density:55,speed:85,scale:110,brightness:110}},{id:"shower",name:"Deszcz serc",description:"Dużo szybko poruszających się serc.",settings:{opacity:90,density:95,speed:145,scale:100,brightness:120}},{id:"giant",name:"Duże serca",description:"Mniej elementów, ale znacznie większych.",settings:{opacity:82,density:35,speed:70,scale:175,blur:1,brightness:120}}],leaves:[{id:"breeze",name:"Lekki wiatr",description:"Spokojnie opadające liście.",settings:{opacity:68,density:35,speed:60,scale:95,rotation:0,brightness:100}},{id:"autumn",name:"Jesień",description:"Gęstszy, ciepły opad liści.",settings:{opacity:82,density:65,speed:90,scale:105,hue:-18,brightness:110}},{id:"gust",name:"Podmuch",description:"Szybki i dynamiczny ruch.",settings:{opacity:85,density:75,speed:160,scale:100,rotation:8,brightness:105}},{id:"close",name:"Liście z bliska",description:"Duże liście przechodzące blisko kamery.",settings:{opacity:86,density:38,speed:80,scale:180,blur:1,brightness:115}}],matrix:[{id:"sparse",name:"Rzadki kod",description:"Niewiele kolumn i spokojniejszy ruch.",settings:{opacity:58,density:28,speed:70,scale:90,brightness:95}},{id:"classic",name:"Klasyczny Matrix",description:"Zbalansowana zielona ściana kodu.",settings:{opacity:78,density:58,speed:105,scale:100,hue:0,brightness:110}},{id:"dense",name:"Gęsty kod",description:"Więcej kolumn i szybszy przepływ.",settings:{opacity:88,density:95,speed:150,scale:95,brightness:125}},{id:"blue",name:"Niebieski kod",description:"Chłodniejsza, cybernetyczna wersja.",settings:{opacity:82,density:68,speed:110,scale:100,hue:95,brightness:120,blendMode:"screen"}}],comets:[{id:"rare",name:"Pojedyncze",description:"Rzadkie komety przecinające tło.",settings:{opacity:65,density:25,speed:75,scale:90,brightness:110}},{id:"classic",name:"Klasyczne",description:"Zbalansowane komety.",settings:{opacity:80,density:52,speed:100,scale:100,brightness:125}},{id:"shower",name:"Deszcz meteorów",description:"Dużo szybkich smug.",settings:{opacity:92,density:95,speed:155,scale:95,brightness:145}},{id:"giant",name:"Wielkie komety",description:"Mniej, ale większych i jaśniejszych smug.",settings:{opacity:88,density:32,speed:90,scale:175,blur:1,brightness:155}}],starfield:[{id:"distant",name:"Odległe gwiazdy",description:"Subtelne, drobne punkty.",settings:{opacity:50,density:35,speed:45,scale:75,brightness:95}},{id:"classic",name:"Pole gwiazd",description:"Zbalansowane kosmiczne tło.",settings:{opacity:72,density:62,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste niebo",description:"Znacznie więcej gwiazd.",settings:{opacity:82,density:100,speed:70,scale:90,brightness:120}},{id:"bright",name:"Jasne gwiazdy",description:"Mniej punktów, ale mocniej świecących.",settings:{opacity:90,density:48,speed:65,scale:125,blur:1,brightness:160,blendMode:"screen"}}],fog:[{id:"wisps",name:"Smugi mgły",description:"Lekkie, przejrzyste pasma.",settings:{opacity:38,density:35,speed:50,scale:100,blur:8,brightness:95}},{id:"low",name:"Niska mgła",description:"Mgła skupiona przy dolnej krawędzi.",settings:{opacity:58,density:58,speed:55,scale:120,y:35,blur:10,area:"bottom",brightness:100}},{id:"heavy",name:"Gęsta mgła",description:"Ciężka mgła pokrywająca kadr.",settings:{opacity:78,density:95,speed:40,scale:135,blur:13,brightness:92}},{id:"ghost",name:"Widmowa",description:"Chłodniejsza i bardziej świetlista mgła.",settings:{opacity:62,density:68,speed:65,scale:125,blur:12,hue:105,brightness:125,blendMode:"screen"}}],embers:[{id:"smolder",name:"Żar",description:"Niewiele powolnych iskier.",settings:{opacity:58,density:30,speed:55,scale:90,brightness:105}},{id:"firepit",name:"Ognisko",description:"Zbalansowane unoszące się żarzące drobiny.",settings:{opacity:78,density:58,speed:90,scale:100,brightness:120}},{id:"inferno",name:"Inferno",description:"Gęsty i szybki strumień żaru.",settings:{opacity:92,density:100,speed:160,scale:105,brightness:150,blendMode:"screen"}},{id:"large",name:"Duży żar",description:"Większe, wolniejsze drobiny.",settings:{opacity:84,density:40,speed:65,scale:165,blur:1,brightness:135}}],clouds:[{id:"wispy",name:"Pierze",description:"Lekkie, rzadkie obłoki.",settings:{opacity:35,density:30,speed:45,scale:105,blur:8,brightness:105}},{id:"classic",name:"Chmury",description:"Zbalansowana warstwa chmur.",settings:{opacity:55,density:58,speed:65,scale:120,blur:9,brightness:100}},{id:"overcast",name:"Zachmurzenie",description:"Gęste i ciemniejsze chmury.",settings:{opacity:78,density:95,speed:55,scale:135,blur:11,brightness:75}},{id:"dreamy",name:"Senna mgiełka",description:"Jasne, miękkie i wolne obłoki.",settings:{opacity:52,density:48,speed:35,scale:150,blur:14,brightness:135,blendMode:"screen"}}],"rain-glass":[{id:"mist",name:"Drobne krople",description:"Subtelne krople na szybie.",settings:{opacity:48,density:35,speed:55,scale:80,blur:0,brightness:95}},{id:"classic",name:"Mokra szyba",description:"Zbalansowane smugi deszczu.",settings:{opacity:72,density:62,speed:85,scale:100,brightness:105}},{id:"downpour",name:"Ulewa na szybie",description:"Dużo szybkich smug.",settings:{opacity:88,density:100,speed:145,scale:105,blur:1,brightness:115}},{id:"slow",name:"Powolne smugi",description:"Duże krople wolno zsuwające się po szybie.",settings:{opacity:80,density:45,speed:35,scale:155,blur:1,brightness:110}}],"bouncing-balls":[{id:"calm",name:"Spokojne",description:"Kilka wolnych kulek.",settings:{opacity:65,density:30,speed:55,scale:90,brightness:105}},{id:"arcade",name:"Arcade",description:"Zbalansowana liczba i tempo.",settings:{opacity:82,density:58,speed:105,scale:100,brightness:125}},{id:"chaos",name:"Chaos",description:"Dużo szybkich odbijających się kulek.",settings:{opacity:90,density:100,speed:175,scale:90,brightness:140}},{id:"giant",name:"Wielkie kule",description:"Mniej obiektów o dużej skali.",settings:{opacity:86,density:32,speed:75,scale:190,blur:1,brightness:130}}],"neon-lines":[{id:"minimal",name:"Minimal",description:"Kilka subtelnych neonowych linii.",settings:{opacity:52,density:28,speed:60,scale:90,brightness:110}},{id:"classic",name:"Neon",description:"Zbalansowane linie cyberpunkowe.",settings:{opacity:78,density:58,speed:100,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Sieć neonów",description:"Gęsty układ świecących linii.",settings:{opacity:86,density:95,speed:125,scale:100,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowy neon",description:"Fioletowo-różowy wariant kolorystyczny.",settings:{opacity:82,density:65,speed:95,scale:105,hue:95,brightness:145,blendMode:"screen"}}],"energy-orbs":[{id:"ambient",name:"Ambient",description:"Rzadkie, spokojne kule energii.",settings:{opacity:55,density:28,speed:50,scale:90,blur:2,brightness:110}},{id:"classic",name:"Energia",description:"Zbalansowane świetliste kule.",settings:{opacity:75,density:58,speed:85,scale:105,blur:1,brightness:130,blendMode:"screen"}},{id:"storm",name:"Burza energii",description:"Dużo szybkich i jasnych kul.",settings:{opacity:90,density:100,speed:155,scale:100,blur:1,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie orbsy",description:"Mniej, ale znacznie większych kul.",settings:{opacity:84,density:32,speed:60,scale:190,blur:3,brightness:145,blendMode:"screen"}}],petals:[{id:"gentle",name:"Delikatne",description:"Spokojnie spadające płatki.",settings:{opacity:62,density:30,speed:55,scale:90,brightness:105}},{id:"classic",name:"Kwiatowy opad",description:"Zbalansowany efekt płatków.",settings:{opacity:78,density:58,speed:85,scale:100,brightness:115}},{id:"storm",name:"Burza płatków",description:"Gęsty i szybki opad.",settings:{opacity:88,density:100,speed:150,scale:95,brightness:125}},{id:"large",name:"Duże płatki",description:"Mniej elementów, ale większych.",settings:{opacity:84,density:38,speed:65,scale:170,blur:1,brightness:120}}],sparks:[{id:"welding",name:"Spawanie",description:"Szybkie, jasne i rzadkie iskry.",settings:{opacity:88,density:42,speed:170,scale:80,brightness:165,blendMode:"screen"}},{id:"fire",name:"Ogień",description:"Zbalansowane ciepłe iskry.",settings:{opacity:78,density:60,speed:105,scale:100,brightness:130}},{id:"burst",name:"Rozbłysk",description:"Gęsty strumień dynamicznych iskier.",settings:{opacity:94,density:100,speed:195,scale:95,brightness:180,blendMode:"screen"}},{id:"slow",name:"Powolny żar",description:"Duże i spokojniejsze iskry.",settings:{opacity:72,density:35,speed:45,scale:155,blur:1,brightness:120}}],plasma:[{id:"calm",name:"Spokojna plazma",description:"Wolniejszy i miękki ruch.",settings:{opacity:58,density:38,speed:45,scale:110,blur:4,brightness:110}},{id:"classic",name:"Plazma",description:"Zbalansowany efekt energetyczny.",settings:{opacity:78,density:62,speed:90,scale:115,blur:2,brightness:135,blendMode:"screen"}},{id:"hot",name:"Gorąca",description:"Jaśniejsza i bardziej intensywna plazma.",settings:{opacity:90,density:82,speed:120,scale:125,blur:2,brightness:175,hue:-35,blendMode:"screen"}},{id:"electric",name:"Elektryczna",description:"Szybka, chłodniejsza plazma.",settings:{opacity:86,density:72,speed:165,scale:105,blur:1,brightness:160,hue:95,blendMode:"screen"}}],"energy-waves":[{id:"soft",name:"Miękkie fale",description:"Powolne i subtelne fale energii.",settings:{opacity:48,density:35,speed:45,scale:110,blur:3,brightness:105}},{id:"pulse",name:"Puls",description:"Zbalansowane pulsujące fale.",settings:{opacity:72,density:60,speed:90,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"fast",name:"Szybkie fale",description:"Dynamiczny, energetyczny ruch.",settings:{opacity:84,density:78,speed:160,scale:110,blur:1,brightness:150,blendMode:"screen"}},{id:"wide",name:"Szerokie fale",description:"Duże, wolniejsze pasma energii.",settings:{opacity:75,density:42,speed:60,scale:175,blur:4,brightness:140,blendMode:"screen"}}],runes:[{id:"drifting",name:"Wędrujące",description:"Runy Elder Futhark swobodnie unoszące się po ekranie.",settings:{opacity:72,density:45,speed:55,scale:100,blur:0,brightness:120}},{id:"ancient",name:"Starożytne",description:"Wolne, większe i cięższe wizualnie symbole.",settings:{opacity:82,density:30,speed:35,scale:150,blur:1,brightness:105}},{id:"ritual",name:"Rytuał",description:"Gęstsza, bardziej świetlista warstwa run.",settings:{opacity:90,density:75,speed:65,scale:115,blur:1,brightness:155,blendMode:"screen"}},{id:"ghost",name:"Widmowe",description:"Subtelne, chłodne i rozmyte znaki.",settings:{opacity:52,density:58,speed:45,scale:125,blur:3,hue:90,brightness:135,blendMode:"screen"}}],"magic-dust":[{id:"wisps",name:"Smugi pyłu",description:"Rzadki, spokojny magiczny pył.",settings:{opacity:50,density:28,speed:45,scale:90,blur:1,brightness:115}},{id:"fairy",name:"Baśniowy pył",description:"Zbalansowane migoczące drobiny.",settings:{opacity:76,density:58,speed:80,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Magiczna chmura",description:"Gęsty i jaśniejszy pył.",settings:{opacity:88,density:100,speed:105,scale:105,blur:1,brightness:160,blendMode:"screen"}},{id:"gold",name:"Złoty pył",description:"Ciepły, złocisty wariant kolorystyczny.",settings:{opacity:82,density:65,speed:75,scale:105,hue:-55,brightness:150,blendMode:"screen"}}],"laser-grid":[{id:"minimal",name:"Minimal",description:"Rzadkie, spokojne linie siatki.",settings:{opacity:50,density:30,speed:55,scale:100,brightness:110}},{id:"classic",name:"Laser Grid",description:"Zbalansowana futurystyczna siatka.",settings:{opacity:75,density:60,speed:90,scale:105,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsta siatka",description:"Więcej linii i mocniejsze światło.",settings:{opacity:86,density:95,speed:105,scale:100,brightness:155,blendMode:"screen"}},{id:"fast",name:"Szybka siatka",description:"Dynamiczny, klubowy wariant.",settings:{opacity:82,density:72,speed:170,scale:110,brightness:150,hue:75,blendMode:"screen"}}],scanlines:[{id:"subtle",name:"Subtelne",description:"Lekka faktura monitora CRT.",settings:{opacity:32,density:35,speed:30,scale:100,brightness:100}},{id:"crt",name:"CRT",description:"Klasyczne linie starego ekranu.",settings:{opacity:58,density:62,speed:55,scale:100,brightness:105}},{id:"vhs",name:"VHS",description:"Mocniejszy i szybszy analogowy szum.",settings:{opacity:72,density:82,speed:115,scale:105,blur:1,brightness:110}},{id:"harsh",name:"Mocne linie",description:"Bardzo widoczna faktura skanowania.",settings:{opacity:88,density:100,speed:70,scale:100,brightness:120,blendMode:"overlay"}}],pong:[{id:"classic",name:"Klasyczny Pong",description:"Spokojny mecz w klasycznym tempie.",settings:{opacity:82,density:72,speed:100,scale:100,brightness:115,hue:0,intensity:0}},{id:"chill",name:"Chill",description:"Wolniejszy, ambientowy Pong.",settings:{opacity:62,density:55,speed:65,scale:100,brightness:105,hue:40,intensity:0}},{id:"arcade",name:"Arcade",description:"Szybszy mecz z lekkim przyspieszaniem.",settings:{opacity:90,density:82,speed:145,scale:105,brightness:140,hue:0,intensity:18,blendMode:"screen"}},{id:"neon",name:"Neon Pong",description:"Fioletowo-neonowa wersja arcade.",settings:{opacity:92,density:78,speed:125,scale:105,brightness:155,hue:105,intensity:10,blendMode:"screen"}}],bubbles:[{id:"gentle",name:"Delikatne",description:"Rzadkie i spokojne bąbelki.",settings:{opacity:48,density:28,speed:45,scale:85,blur:0,brightness:105}},{id:"aquarium",name:"Akwarium",description:"Zbalansowany strumień bąbelków.",settings:{opacity:68,density:60,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste",description:"Dużo szybko unoszących się bąbelków.",settings:{opacity:78,density:100,speed:125,scale:95,brightness:125}},{id:"giant",name:"Wielkie bąble",description:"Mniej, ale bardzo dużych elementów.",settings:{opacity:70,density:30,speed:55,scale:195,blur:1,brightness:120}}],fireflies:[{id:"sparse",name:"Kilka świetlików",description:"Rzadkie i spokojne punkty światła.",settings:{opacity:55,density:25,speed:45,scale:90,blur:1,brightness:120}},{id:"meadow",name:"Łąka",description:"Zbalansowany, naturalny rój.",settings:{opacity:75,density:58,speed:70,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"swarm",name:"Rój",description:"Dużo aktywnych świetlików.",settings:{opacity:86,density:100,speed:120,scale:95,brightness:155,blendMode:"screen"}},{id:"dreamy",name:"Senny",description:"Duże, powolne i miękkie światła.",settings:{opacity:68,density:38,speed:35,scale:160,blur:3,brightness:145,blendMode:"screen"}}],confetti:[{id:"light",name:"Lekki opad",description:"Niewiele konfetti i spokojne tempo.",settings:{opacity:62,density:30,speed:60,scale:90,brightness:105}},{id:"party",name:"Impreza",description:"Zbalansowane kolorowe konfetti.",settings:{opacity:82,density:65,speed:105,scale:100,brightness:115}},{id:"celebration",name:"Celebracja",description:"Gęsty i szybki wybuch konfetti.",settings:{opacity:92,density:100,speed:165,scale:105,brightness:130}},{id:"slow",name:"Slow motion",description:"Większe elementy opadające powoli.",settings:{opacity:80,density:45,speed:35,scale:150,blur:1,brightness:115}}],"dust-motes":[{id:"subtle",name:"Subtelny kurz",description:"Prawie niewidoczne drobiny w tle.",settings:{opacity:30,density:30,speed:35,scale:85,blur:1,brightness:95}},{id:"sunbeam",name:"Promień słońca",description:"Jaśniejsze drobiny zawieszone w powietrzu.",settings:{opacity:55,density:55,speed:45,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsty kurz",description:"Więcej widocznych drobin.",settings:{opacity:65,density:100,speed:55,scale:95,brightness:120}},{id:"cinematic",name:"Filmowy",description:"Duże, wolne i miękkie drobiny.",settings:{opacity:48,density:42,speed:30,scale:155,blur:2,brightness:145,blendMode:"screen"}}],aurora:[{id:"soft",name:"Delikatna zorza",description:"Subtelne, powolne pasma.",settings:{opacity:48,density:35,speed:35,scale:110,blur:4,brightness:110}},{id:"nordic",name:"Nordycka",description:"Zbalansowana klasyczna zorza.",settings:{opacity:72,density:58,speed:55,scale:120,blur:3,brightness:130,blendMode:"screen"}},{id:"intense",name:"Intensywna",description:"Jasne i gęste pasma światła.",settings:{opacity:90,density:95,speed:70,scale:130,blur:2,brightness:170,blendMode:"screen"}},{id:"fast",name:"Szybka zorza",description:"Dynamiczne, wyraźnie przemieszczające się pasma.",settings:{opacity:82,density:72,speed:125,scale:120,blur:2,brightness:150,hue:45,blendMode:"screen"}}],"hologram-scan":[{id:"subtle",name:"Subtelny skan",description:"Rzadkie i spokojne pasma hologramu.",settings:{opacity:42,density:28,speed:55,scale:100,brightness:105,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelny skan HUD o umiarkowanym tempie.",settings:{opacity:68,density:48,speed:85,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:"Intensywny",description:"Gesty i szybki skan calego ekranu.",settings:{opacity:88,density:92,speed:155,scale:105,brightness:155,blendMode:"screen"}},{id:"violet",name:"Fioletowy",description:"Holograficzny skan przesuniety w fiolet.",settings:{opacity:78,density:58,speed:95,hue:92,brightness:140,blendMode:"screen"}}],"glitch-blocks":[{id:"sparse",name:"Rzadkie zaklocenia",description:"Pojedyncze cyfrowe przeskoki.",settings:{opacity:42,density:24,speed:65,scale:85,brightness:110}},{id:"digital",name:"Digital",description:"Zbalansowane cyfrowe prostokaty.",settings:{opacity:62,density:55,speed:95,scale:100,brightness:125,blendMode:"screen"}},{id:"corrupted",name:"Corrupted",description:"Gesty, agresywny glitch.",settings:{opacity:86,density:100,speed:180,scale:115,brightness:155,blendMode:"screen"}},{id:"chromatic",name:"Chromatyczny",description:"Kolorowy glitch z mocnym przesunieciem barwy.",settings:{opacity:76,density:72,speed:125,scale:100,hue:120,brightness:145,blendMode:"screen"}}],"hex-grid":[{id:"fine",name:"Drobna siatka",description:"Delikatna, drobna struktura hex.",settings:{opacity:32,density:78,speed:30,scale:90,brightness:100}},{id:"tactical",name:"Taktyczna",description:"Czytelna siatka interfejsu sci-fi.",settings:{opacity:50,density:52,speed:50,scale:100,brightness:120,blendMode:"screen"}},{id:"large",name:"Duza siatka",description:"Wieksze i spokojniejsze komorki.",settings:{opacity:44,density:25,speed:35,scale:125,brightness:115}},{id:"neon",name:"Neon",description:"Jasna cyberpunkowa siatka.",settings:{opacity:72,density:62,speed:75,hue:75,brightness:165,blendMode:"screen"}}],"portal-rings":[{id:"calm",name:"Spokojny portal",description:"Powolne i subtelne pierscienie.",settings:{opacity:52,density:35,speed:35,scale:90,brightness:110}},{id:"arcane",name:"Arkaniczny",description:"Klasyczny magiczny portal.",settings:{opacity:78,density:62,speed:65,scale:100,brightness:140,blendMode:"screen"}},{id:"unstable",name:"Niestabilny",description:"Gesty i szybko wirujacy portal.",settings:{opacity:92,density:100,speed:145,scale:112,brightness:175,blendMode:"screen"}},{id:"void",name:"Void",description:"Ciemniejszy portal o zmienionej barwie.",settings:{opacity:84,density:70,speed:78,scale:105,hue:145,brightness:125,blendMode:"screen"}}],"magic-circle":[{id:"subtle",name:"Subtelny sigil",description:"Lekki i powolny magiczny okrag.",settings:{opacity:44,density:32,speed:28,scale:90,brightness:105}},{id:"ritual",name:"Rytual",description:"Zbalansowany okrag rytualny.",settings:{opacity:72,density:58,speed:48,scale:100,brightness:135,blendMode:"screen"}},{id:"grand",name:"Wielki sigil",description:"Duzy, jasny i gesty wzor.",settings:{opacity:90,density:96,speed:62,scale:135,brightness:175,blendMode:"screen"}},{id:"forbidden",name:"Zakazany",description:"Ciemniejszy i bardziej zlowrogi wariant.",settings:{opacity:82,density:72,speed:75,scale:108,hue:120,brightness:135,blendMode:"screen"}}],"crystal-shards":[{id:"sparse",name:"Rzadkie odlamki",description:"Kilka spokojnie unoszacych sie krysztalow.",settings:{opacity:48,density:28,speed:42,scale:85,brightness:115}},{id:"prism",name:"Pryzmat",description:"Jasne odlamki o mocnym polysku.",settings:{opacity:72,density:55,speed:62,scale:100,brightness:155,blendMode:"screen"}},{id:"storm",name:"Krysztalowa burza",description:"Duza liczba szybko poruszajacych sie odlamkow.",settings:{opacity:88,density:100,speed:145,scale:92,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie odlamki",description:"Mniej elementow, ale znacznie wiekszych.",settings:{opacity:78,density:38,speed:48,scale:170,brightness:145,blur:1,blendMode:"screen"}}],"steam-vents":[{id:"gentle",name:"Lekka para",description:"Subtelne kleby pary.",settings:{opacity:38,density:30,speed:42,scale:95,blur:2,brightness:105}},{id:"factory",name:"Fabryka",description:"Regularne, gestsze wyrzuty pary.",settings:{opacity:58,density:62,speed:62,scale:110,blur:3,brightness:115}},{id:"burst",name:"Wyrzut",description:"Szybka i intensywna para.",settings:{opacity:76,density:92,speed:145,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"ghost",name:"Widmowa para",description:"Chlodny, lekko kolorowy wariant.",settings:{opacity:52,density:52,speed:48,scale:125,hue:155,blur:4,brightness:135,blendMode:"screen"}}],gears:[{id:"clockwork",name:"Mechanizm",description:"Spokojnie obracajace sie kola zebate.",settings:{opacity:52,density:38,speed:42,scale:90,brightness:105}},{id:"brass",name:"Mosiadz",description:"Klasyczny steampunkowy zestaw kol.",settings:{opacity:66,density:55,speed:58,scale:100,brightness:125,blendMode:"screen"}},{id:"heavy",name:"Ciezka maszyna",description:"Duze i wolniejsze kola zebate.",settings:{opacity:76,density:35,speed:28,scale:165,brightness:115}},{id:"overdrive",name:"Overdrive",description:"Gesty i szybko pracujacy mechanizm.",settings:{opacity:82,density:100,speed:160,scale:88,brightness:145,blendMode:"screen"}}],"city-lights":[{id:"distant",name:"Odlegle miasto",description:"Rzadkie, subtelne punkty swiatla.",settings:{opacity:42,density:28,speed:35,scale:85,brightness:105}},{id:"night",name:"Nocne miasto",description:"Zbalansowane miejskie swiatla.",settings:{opacity:72,density:65,speed:48,scale:100,brightness:125,blendMode:"screen"}},{id:"dense",name:"Centrum",description:"Gesty, jasny krajobraz miejski.",settings:{opacity:88,density:100,speed:65,scale:105,brightness:155,blendMode:"screen"}},{id:"neon",name:"Neon City",description:"Kolorowy wariant inspirowany cyberpunkiem.",settings:{opacity:82,density:78,speed:58,hue:95,brightness:165,blendMode:"screen"}}],"traffic-trails":[{id:"slow",name:"Nocna ulica",description:"Rzadkie i wolne smugi swiatel.",settings:{opacity:48,density:28,speed:48,scale:90,brightness:110}},{id:"highway",name:"Autostrada",description:"Zbalansowany ruch swietlny.",settings:{opacity:72,density:55,speed:95,scale:100,brightness:135,blendMode:"screen"}},{id:"rush",name:"Rush Hour",description:"Gesty i bardzo szybki ruch.",settings:{opacity:88,density:100,speed:175,scale:105,brightness:160,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant smug.",settings:{opacity:80,density:70,speed:120,hue:110,brightness:160,blendMode:"screen"}}],"vhs-static":[{id:"soft",name:"Lekka tasma",description:"Subtelne analogowe zaklocenia.",settings:{opacity:28,density:28,speed:55,scale:100,brightness:100}},{id:"tape",name:"VHS",description:"Klasyczne pasy starej kasety.",settings:{opacity:50,density:58,speed:95,scale:100,brightness:120,blendMode:"screen"}},{id:"damaged",name:"Uszkodzona tasma",description:"Mocne, szybkie zaklocenia obrazu.",settings:{opacity:82,density:100,speed:180,scale:105,brightness:150,blendMode:"screen"}},{id:"chromatic",name:"RGB Shift",description:"Kolorowe analogowe zaklocenia.",settings:{opacity:68,density:75,speed:125,hue:105,brightness:145,blendMode:"screen"}}],"solar-flare":[{id:"corona",name:"Korona",description:"Delikatne luki slonecznej plazmy.",settings:{opacity:48,density:30,speed:38,scale:95,brightness:120}},{id:"active",name:"Aktywne slonce",description:"Zbalansowane protuberancje.",settings:{opacity:72,density:55,speed:62,scale:105,brightness:145,blendMode:"screen"}},{id:"eruption",name:"Erupcja",description:"Gesty i bardzo jasny rozblysk.",settings:{opacity:94,density:100,speed:135,scale:120,brightness:190,blendMode:"screen"}},{id:"alien",name:"Obce slonce",description:"Przesunieta barwa daje nietypowa gwiazde.",settings:{opacity:84,density:72,speed:78,scale:112,hue:125,brightness:165,blendMode:"screen"}}],"scanlines-plus":[{id:"soft",name:"Subtelne",description:"Delikatny skan ekranu.",settings:{opacity:34,density:28,speed:72,brightness:105,blendMode:"screen"}},{id:"monitor",name:"Monitor",description:"Klasyczny efekt skanowania obrazu.",settings:{opacity:58,density:52,speed:100,brightness:120,blendMode:"screen"}},{id:"aggressive",name:"Agresywne",description:"Wiecej linii i mocniejszy ruch.",settings:{opacity:82,density:92,speed:165,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowe",description:"Neonowo-fioletowy skan.",settings:{opacity:74,density:60,speed:110,hue:85,brightness:145,blendMode:"screen"}}],"equalizer-bars":[{id:"ambient",name:"Ambient",description:"Spokojne slupki audio.",settings:{opacity:52,density:35,speed:65,scale:90,brightness:105,blendMode:"screen"}},{id:"stage",name:"Scena",description:"Zbalansowany wizualizer muzyczny.",settings:{opacity:76,density:62,speed:100,scale:100,brightness:125,blendMode:"screen"}},{id:"festival",name:"Festival",description:"Mocne i wysokie slupki.",settings:{opacity:90,density:100,speed:155,scale:110,brightness:155,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant.",settings:{opacity:82,density:72,speed:120,hue:95,brightness:145,blendMode:"screen"}}],"hud-grid":[{id:"subtle",name:"Subtelny",description:"Lekka siatka tla.",settings:{opacity:28,density:30,speed:50,brightness:100,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelna warstwa HUD.",settings:{opacity:48,density:60,speed:70,brightness:120,blendMode:"screen"}},{id:"scanner",name:"Scanner",description:"Gestsza i bardziej techniczna siatka.",settings:{opacity:68,density:95,speed:110,brightness:145,blendMode:"screen"}},{id:"violet",name:"Violet HUD",description:"HUD z przesunieciem w strone fioletu.",settings:{opacity:58,density:72,speed:84,hue:88,brightness:140,blendMode:"screen"}}],"floating-symbols":[{id:"soft",name:"Lekkie",description:"Malo symboli i lagodny ruch.",settings:{opacity:46,density:28,speed:62,scale:95,brightness:110,blendMode:"screen"}},{id:"arcane",name:"Arcane",description:"Klasyczny magiczny wariant.",settings:{opacity:72,density:54,speed:78,scale:100,brightness:125,blendMode:"screen"}},{id:"ritual",name:"Ritual",description:"Wiecej symboli i silniejsza poswiata.",settings:{opacity:88,density:100,speed:120,scale:110,brightness:160,blendMode:"screen"}},{id:"dream",name:"Dream",description:"Jasniejszy, bardziej eteryczny wariant.",settings:{opacity:82,density:68,speed:72,hue:60,brightness:155,blendMode:"screen"}}],"smoke-wisps":[{id:"light",name:"Lekki dym",description:"Subtelne smugi dymu.",settings:{opacity:30,density:24,speed:50,scale:90,blur:4,brightness:100,blendMode:"screen"}},{id:"mist",name:"Mist",description:"Zbalansowane wispy dymu.",settings:{opacity:50,density:48,speed:68,scale:100,blur:8,brightness:110,blendMode:"screen"}},{id:"dense",name:"Gesty dym",description:"Bardziej widoczny i ciezszy dym.",settings:{opacity:72,density:88,speed:84,scale:110,blur:12,brightness:130,blendMode:"screen"}},{id:"toxic",name:"Toksyczny",description:"Zielonkawo-przesuniety dym.",settings:{opacity:66,density:64,speed:72,scale:105,hue:120,blur:10,brightness:140,blendMode:"screen"}}],"electric-arcs":[{id:"calm",name:"Spokojne",description:"Rzadkie przeskoki energii.",settings:{opacity:46,density:26,speed:68,brightness:120,blendMode:"screen"}},{id:"active",name:"Aktywne",description:"Widoczne luki energii.",settings:{opacity:82,density:55,speed:110,brightness:145,blendMode:"screen"}},{id:"storm",name:"Storm",description:"Bardzo szybkie i liczne wyadowania.",settings:{opacity:96,density:100,speed:175,brightness:180,blendMode:"screen"}},{id:"alien",name:"Alien",description:"Wyadowania z obca barwa.",settings:{opacity:88,density:72,speed:120,hue:95,brightness:165,blendMode:"screen"}}],"snow-burst":[{id:"light",name:"Lekki opad",description:"Spokojny i delikatny snieg.",settings:{opacity:42,density:28,speed:52,scale:90,brightness:110,blendMode:"screen"}},{id:"winter",name:"Winter",description:"Zbalansowany efekt zimowy.",settings:{opacity:72,density:68,speed:72,scale:100,brightness:125,blendMode:"screen"}},{id:"blizzard",name:"Blizzard",description:"Gestszy i szybszy snieg.",settings:{opacity:92,density:100,speed:145,scale:110,brightness:150,blendMode:"screen"}},{id:"moonlit",name:"Moonlit",description:"Chlodniejszy nocny wariant sniegu.",settings:{opacity:82,density:75,speed:86,scale:105,hue:15,brightness:145,blendMode:"screen"}}],"meteor-shower":[{id:"sparse",name:"Rzadkie meteory",description:"Niewiele smug na niebie.",settings:{opacity:46,density:22,speed:72,scale:90,brightness:115,blendMode:"screen"}},{id:"night",name:"Nocne niebo",description:"Klasyczny deszcz meteorow.",settings:{opacity:78,density:42,speed:100,scale:100,brightness:140,blendMode:"screen"}},{id:"peak",name:"Peak",description:"Maksimum roju meteorow.",settings:{opacity:92,density:100,speed:155,scale:112,brightness:175,blendMode:"screen"}},{id:"cosmic",name:"Cosmic",description:"Bardziej kolorowy kosmiczny wariant.",settings:{opacity:86,density:62,speed:118,scale:105,hue:72,brightness:165,blendMode:"screen"}}]};function ca(e){return mu[e]??pu[e]??cu[e]??su[e]??au[e]??yu[e]??[]}function hu(e,t){return ca(e).find(a=>Object.entries(a.settings).every(([n,s])=>t[n]===s))}const He=new Set,gu={key:"opacity",label:"Krycie",min:0,max:100,suffix:"%"},bu={key:"density",label:"Gęstość",min:10,max:400,suffix:"%"},wu={key:"speed",label:"Prędkość",min:20,max:400,suffix:"%"},ku={key:"intensity",label:"Przyspieszenie",min:0,max:100,suffix:"%"},vu={key:"scale",label:"Skala",min:25,max:250,suffix:"%"},xu={key:"x",label:"Pozycja X",min:-100,max:100,suffix:"%"},zu={key:"y",label:"Pozycja Y",min:-100,max:100,suffix:"%"},Su={key:"rotation",label:"Obrót",min:-180,max:180,suffix:"°"},Mu={key:"blur",label:"Rozmycie",min:0,max:30,suffix:"px"},Eu={key:"brightness",label:"Jasność",min:25,max:250,suffix:"%"},Cu={key:"hue",label:"Odcień",min:-180,max:180,suffix:"°"},Pu=["#57c7ff","#6d91ff","#a88cff","#d67cff","#f07a7a","#f39a62","#f0b85a","#72d98b","#55d6c2","#ffffff"];function St(e){return e&&/^#[0-9a-f]{6}$/i.test(e)?e:"#a88cff"}function ju(e,t,a){const n=t[e.key],s=a[e.key],i=n===s;return`
    <label class="inspector-field">
      <span class="inspector-label">
        <span>${e.label}</span>

        <span class="inspector-field-tools">
          <output
            data-output="${e.key}"
            aria-live="off"
          >
            ${n}${e.suffix}
          </output>

          <button
            class="inspector-field-reset"
            type="button"
            data-reset-setting="${e.key}"
            title="Resetuj ${e.label}"
            aria-label="Resetuj ${e.label}"
            ${i?"disabled":""}
          >
            Reset
          </button>
        </span>
      </span>

      <input
        type="range"
        min="${e.min}"
        max="${e.max}"
        step="${e.step??1}"
        value="${n}"
        data-setting="${e.key}"
        data-suffix="${e.suffix}"
        aria-label="${e.label}"
      >
    </label>
  `}function _u(e,t,a){const n=He.has(e.id);return`
    <section
      class="inspector-group ${n?"is-collapsed":""}"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="${e.id}"
        aria-expanded="${String(!n)}"
      >
        <span class="inspector-group-heading">
          <strong>${e.title}</strong>
          <span>${e.description}</span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${n?"hidden":""}
      >
        ${e.fields.map(s=>ju(s,t,a)).join("")}
      </div>
    </section>
  `}function fn(e){const t=Mt();if(!t){e.innerHTML=`
      <div class="inspector-empty">
        <strong>Brak zaznaczonej warstwy</strong>
        <span>
          Wybierz warstwę po lewej stronie albo dodaj nowy efekt.
        </span>
      </div>
    `;return}const a=ze(t.effectId);if(!a){e.innerHTML=`
      <div class="inspector-empty">
        Nie znaleziono definicji efektu.
      </div>
    `;return}const n=ca(t.effectId),s=hu(t.effectId,t.settings),i=[gu,bu,wu];t.effectId==="pong"&&i.push(ku);const r=[{id:"primary",title:"Podstawowe",description:"Widoczność, liczba elementów i tempo animacji",fields:i},{id:"transform",title:"Transformacja",description:"Rozmiar, pozycja i obrót całej warstwy",fields:[vu,xu,zu,Su]},{id:"appearance",title:"Wygląd",description:"Rozmycie, jasność i przesunięcie barwy",fields:[Mu,Eu,Cu]}];e.innerHTML=`
    <div class="inspector-title">
      <div class="inspector-title-copy">
        <strong>
          ${a.name}
        </strong>

        <span>
          ${t.effectId}
        </span>
      </div>

      <button
        class="inspector-reset-button"
        type="button"
        data-inspector-reset
      >
        Resetuj
      </button>
    </div>

    ${n.length>0?`
          <section class="inspector-variant-panel">
            <div class="inspector-variant-heading">
              <div>
                <strong>Wariant</strong>
                <span>
                  Gotowy styl bazowy efektu
                </span>
              </div>

              <div class="inspector-variant-actions">
                <span class="inspector-variant-count">
                  ${n.length}
                </span>

                <button
                  class="inspector-field-reset"
                  type="button"
                  data-reset-variant
                  title="Resetuj wariant i ustawienia"
                  aria-label="Resetuj wariant i ustawienia"
                >
                  Reset
                </button>
              </div>
            </div>

            <select
              class="inspector-variant-select"
              data-effect-variant
              aria-label="Wariant efektu"
            >
              <option value="">
                Własny / ręczny
              </option>

              ${n.map(p=>`
                    <option
                      value="${p.id}"
                      ${s?.id===p.id?"selected":""}
                    >
                      ${p.name}
                    </option>
                  `).join("")}
            </select>

            <p class="inspector-variant-description">
              ${s?.description??"Wybierz wariant, aby zastosować gotowy zestaw parametrów. Potem możesz dalej zmieniać suwaki."}
            </p>
          </section>
        `:""}

    <section class="inspector-color-panel">
      <div class="inspector-color-heading">
        <div>
          <strong>Kolor efektu</strong>
          <span>
            Wybierz dowolny kolor całej warstwy
          </span>
        </div>

        <button
          class="inspector-field-reset"
          type="button"
          data-color-natural
          ${t.settings.colorize?"":"disabled"}
        >
          Naturalny
        </button>
      </div>

      <div class="inspector-color-main">
        <label class="inspector-color-picker">
          <input
            type="color"
            value="${St(t.settings.color)}"
            data-effect-color
            aria-label="Kolor efektu"
          >

          <span
            class="inspector-color-value"
            data-color-value
          >
            ${St(t.settings.color).toUpperCase()}
          </span>
        </label>

        <span
          class="inspector-color-state ${t.settings.colorize?"is-active":""}"
        >
          ${t.settings.colorize?"Własny kolor":"Kolor naturalny"}
        </span>
      </div>

      <div
        class="inspector-color-swatches"
        aria-label="Szybkie kolory"
      >
        ${Pu.map(p=>`
              <button
                class="inspector-color-swatch ${t.settings.colorize&&St(t.settings.color).toLowerCase()===p.toLowerCase()?"is-selected":""}"
                type="button"
                data-color-preset="${p}"
                title="${p}"
                aria-label="Ustaw kolor ${p}"
                style="--swatch:${p}"
              ></button>
            `).join("")}
      </div>

      <p class="inspector-color-help">
        Kolorowanie obejmuje cały efekt i działa także dla jasnych / białych elementów.
        Suwak Odcień nadal może dodatkowo przesuwać barwę.
      </p>
    </section>

    ${r.map(p=>_u(p,t.settings,a.defaultSettings)).join("")}

    ${Kp(t)}

    <section
      class="inspector-group ${He.has("composition")?"is-collapsed":""}"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="composition"
        aria-expanded="${String(!He.has("composition"))}"
      >
        <span class="inspector-group-heading">
          <strong>Kompozycja</strong>
          <span>
            Sposób łączenia warstwy z pozostałymi
          </span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${He.has("composition")?"hidden":""}
      >
        <label class="inspector-field">
          <span class="inspector-label">
            <span>Tryb mieszania</span>

            <button
              class="inspector-field-reset"
              type="button"
              data-reset-setting="blendMode"
              title="Resetuj tryb mieszania"
              aria-label="Resetuj tryb mieszania"
              ${t.settings.blendMode===a.defaultSettings.blendMode?"disabled":""}
            >
              Reset
            </button>
          </span>

          <select data-setting="blendMode">
            <option value="normal">Normalny</option>
            <option value="screen">Ekran</option>
            <option value="lighten">Rozjaśnianie</option>
            <option value="multiply">Mnożenie</option>
            <option value="overlay">Nakładka</option>
          </select>
        </label>

        <label class="inspector-field">
          <span class="inspector-label">
            <span>Obszar</span>

            <button
              class="inspector-field-reset"
              type="button"
              data-reset-setting="area"
              title="Resetuj obszar"
              aria-label="Resetuj obszar"
              ${t.settings.area===a.defaultSettings.area?"disabled":""}
            >
              Reset
            </button>
          </span>

          <select data-setting="area">
            <option value="full">Całość</option>
            <option value="left">Lewa strona</option>
            <option value="center">Środek</option>
            <option value="right">Prawa strona</option>
            <option value="top">Góra</option>
            <option value="bottom">Dół</option>
          </select>
        </label>
      </div>
    </section>
  `,Qp(e,t.instanceId);const o=e.querySelector('[data-setting="blendMode"]');o&&(o.value=t.settings.blendMode);const c=e.querySelector('[data-setting="area"]');c&&(c.value=t.settings.area),e.querySelectorAll("[data-inspector-group-toggle]").forEach(p=>{p.addEventListener("click",()=>{const h=p.dataset.inspectorGroupToggle;h&&(He.has(h)?He.delete(h):He.add(h),fn(e))})});const l=e.querySelector("[data-effect-variant]");l?.addEventListener("change",()=>{const p=n.find(h=>h.id===l.value);p&&Se(t.instanceId,{...p.settings})});const d=e.querySelector("[data-effect-color]");d?.addEventListener("change",()=>{Se(t.instanceId,{color:St(d.value),colorize:!0})}),e.querySelectorAll("[data-color-preset]").forEach(p=>{p.addEventListener("click",()=>{const h=St(p.dataset.colorPreset);Se(t.instanceId,{color:h,colorize:!0})})}),e.querySelector("[data-color-natural]")?.addEventListener("click",()=>{Se(t.instanceId,{color:a.defaultSettings.color,colorize:!1})}),e.querySelectorAll("[data-reset-setting]").forEach(p=>{p.addEventListener("click",h=>{h.preventDefault(),h.stopPropagation();const f=p.dataset.resetSetting;f&&Se(t.instanceId,{[f]:a.defaultSettings[f]})})}),e.querySelector("[data-reset-variant]")?.addEventListener("click",()=>{Se(t.instanceId,{...a.defaultSettings})}),e.querySelectorAll('input[type="range"][data-setting]').forEach(p=>{p.addEventListener("input",()=>{const h=p.dataset.setting,f=Number(p.value),g=e.querySelector(`[data-output="${h}"]`);g&&(g.value=`${f}${p.dataset.suffix??""}`),Se(t.instanceId,{[h]:f})})}),o?.addEventListener("change",()=>{Se(t.instanceId,{blendMode:o.value})}),c?.addEventListener("change",()=>{Se(t.instanceId,{area:c.value})}),e.querySelector("[data-inspector-reset]")?.addEventListener("click",()=>{Se(t.instanceId,{...a.defaultSettings})})}const $u=[["chat-command","Komenda czatu"],["follower","Nowy obserwujący"],["subscriber","Subskrypcja"],["tip","Donacja"],["cheer","Cheer / Bits"],["raid","Raid"]];let Fa=0;function la(){return he().effects.filter(e=>e.enabled)}function mn(){const e=++Fa,t=document.createElement("fieldset");t.className="export-route-card",t.dataset.routeId="route-"+e,t.innerHTML=`
    <legend>Reguła</legend>
    <button type="button" data-remove-route aria-label="Usuń regułę">Usuń</button>
    <div class="export-route-fields">
      <label>Zdarzenie<select data-route-mode></select></label>
      <label data-route-command-field>Komenda<input data-route-command value="!hype" maxlength="25" autocomplete="off" spellcheck="false"></label>
      <label>Czas (s)<input type="number" data-route-duration value="5" min=".5" max="60" step=".5"></label>
      <label>Cooldown (s)<input type="number" data-route-cooldown value="10" min="0" max="300" step="1"></label>
    </div>
    <div class="export-route-effect-list" data-route-effects role="group" aria-label="Efekty przypisane do reguły"></div>
  `;const a=t.querySelector("[data-route-mode]");for(const[n,s]of $u){const i=document.createElement("option");i.value=n,i.textContent=s,a.appendChild(i)}return t.querySelector("[data-route-command]").value=e===1?"!hype":"!hype"+e,ys(t,!0),t}function ys(e,t=!1){const a=e.querySelector("[data-route-effects]");if(!a)return;const n=la(),s=JSON.stringify(n.map(r=>[r.instanceId,r.label,r.effectId]));if(!t&&e.dataset.effectsSignature===s)return;const i=new Set(Array.from(a.querySelectorAll("input[type=checkbox]:checked"),r=>r.value));a.replaceChildren(),n.forEach((r,o)=>{const c=document.createElement("label"),l=document.createElement("input");l.type="checkbox",l.value=r.instanceId,l.checked=t?o===0:i.has(r.instanceId);const d=document.createElement("span"),p=ze(r.effectId);d.textContent=r.label||p?.name||r.effectId,c.append(l,d),a.append(c)}),e.dataset.effectsSignature=s}function Ru(e){const t=e.querySelector("[data-route-mode]")?.value,a=e.querySelector("[data-route-command-field]");a&&(a.hidden=t!=="chat-command"),ys(e)}function Ct(e){if(!e.querySelector("[data-multi-routes]")?.checked)return;const t=e.querySelector("[data-route-list]");return t?Array.from(t.querySelectorAll("[data-route-id]"),a=>{const n=s=>a.querySelector(s)?.value??"";return{id:a.dataset.routeId??"",mode:a.querySelector("[data-route-mode]")?.value,chatCommand:n("[data-route-command]"),activeDurationMs:Number(n("[data-route-duration]"))*1e3,cooldownMs:Number(n("[data-route-cooldown]"))*1e3,effectInstanceIds:Array.from(a.querySelectorAll("[data-route-effects] input:checked"),s=>s.value)}}):[]}function Iu(e,t){const a=e.querySelector("[data-multi-routes]"),n=e.querySelector("[data-route-list]");if(!(!a||!n)){if(a.checked=t!==null,n.replaceChildren(),n.dataset.preserveEmpty=String(t!==null&&t.length===0),t!==null){const s=la().map(r=>r.instanceId),i=bt(t,s);for(const r of i){const o=mn();o.dataset.routeId=r.id;const c=/^route-(\d+)$/.exec(r.id);c&&(Fa=Math.max(Fa,Number(c[1]))),o.querySelector("[data-route-mode]").value=r.mode,o.querySelector("[data-route-command]").value=r.chatCommand,o.querySelector("[data-route-duration]").value=String(r.activeDurationMs/1e3),o.querySelector("[data-route-cooldown]").value=String(r.cooldownMs/1e3);const l=new Set(r.effectInstanceIds);o.querySelectorAll("[data-route-effects] input").forEach(d=>{d.checked=l.has(d.value)}),n.appendChild(o)}}Je(e)}}function Je(e){const t=e.querySelector("[data-multi-routes]")?.checked??!1,a=e.querySelector("[data-single-trigger]"),n=e.querySelector("[data-route-workspace]");if(a&&(a.hidden=t),n&&(n.hidden=!t),!t)return;const s=e.querySelector("[data-route-list]");if(!s)return;s.children.length===0&&s.dataset.preserveEmpty!=="true"&&s.appendChild(mn()),s.querySelectorAll("[data-route-id]").forEach(Ru);const i=e.querySelector("[data-add-route]");i&&(i.disabled=s.children.length>=va);const r=Ct(e)??[],o=bt(r,la().map(l=>l.instanceId)),c=e.querySelector("[data-route-warning]");c&&(c.textContent=la().length===0?"Dodaj i włącz przynajmniej jeden efekt w edytorze.":o.length<r.length?"Reguły bez zaznaczonych efektów są pomijane w eksporcie.":`Gotowe: ${o.length} reguł w jednym widżecie.`)}function Au(e,t){const a=e.querySelector("[data-multi-routes]"),n=e.querySelector("[data-route-list]"),s=e.querySelector("[data-add-route]");!a||!n||!s||(a.addEventListener("change",()=>{n.dataset.preserveEmpty="false",Je(e),t()}),s.addEventListener("click",()=>{n.children.length>=va||(n.dataset.preserveEmpty="false",n.appendChild(mn()),Je(e),t())}),n.addEventListener("click",i=>{if(!(i.target instanceof Element))return;const r=i.target.closest("[data-remove-route]");r&&(r.closest("[data-route-id]")?.remove(),Je(e),t())}),n.addEventListener("change",()=>{Je(e),t()}),Je(e))}const Ba="animated-effects-stream-elements-profile",Wa=1,hs="animated-effects:se-profiles:v1",Ke=16,Ua=1024*1024,je=e=>e!==null&&typeof e=="object"&&!Array.isArray(e),pt=(e,t=1e6)=>typeof e=="number"&&Number.isFinite(e)&&Math.abs(e)<=t,ar=e=>typeof e=="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(e),$a=e=>typeof e=="string"&&/^#[0-9a-fA-F]{6}$/.test(e);function gs(e){if(!je(e)||!je(e.resolution)||!je(e.palette)||!je(e.background)||!Array.isArray(e.effects))throw new Error("Plik nie zawiera poprawnej sceny Animated Effects.");const t=e.resolution;if(!pt(t.width)||!pt(t.height)||t.width<64||t.width>8192||t.height<64||t.height>8192)throw new Error("Nieprawidłowa rozdzielczość sceny.");const a=e.palette;for(const o of["accent1","accent2","accent3","background1","background2"])if(!$a(a[o]))throw new Error("Nieprawidłowa paleta sceny.");const n=e.background;if(!["solid","gradient","mesh","aurora","radial","horizon","spotlight","split","darkcenter"].includes(String(n.mode)))throw new Error("Nieobsługiwane tło sceny.");for(const o of["angle","lightX","lightY","hue","saturation","brightness","contrast","noise","vignette"])if(!pt(n[o]))throw new Error("Nieprawidłowe parametry tła.");if(n.color!==void 0&&!$a(n.color))throw new Error("Nieprawidłowy kolor tła.");if(n.colorize!==void 0&&typeof n.colorize!="boolean")throw new Error("Nieprawidłowa konfiguracja tła.");if(typeof e.backgroundOnly!="boolean"||!["none","left","center","right","top","bottom"].includes(String(e.focusZone))||!["off","left","center","right","top","bottom","full"].includes(String(e.safeZone)))throw new Error("Nieprawidłowe ustawienia sceny.");if(e.effects.length>64)throw new Error("Zbyt wiele warstw w profilu.");const i=new Set,r=e.effects.map(o=>{if(!je(o)||!ar(o.instanceId)||i.has(o.instanceId)||typeof o.effectId!="string"||typeof o.enabled!="boolean"||!pt(o.seed,4294967295)||o.seed<0||!Number.isInteger(o.seed)||!je(o.settings))throw new Error("Profil zawiera nieprawidłową warstwę efektu.");const c=ze(o.effectId);if(!c)throw new Error("Nieznany efekt: "+o.effectId.slice(0,80));i.add(o.instanceId);const l=o.settings,d={opacity:[0,100],scale:[0,2e3],x:[-2e3,2e3],y:[-2e3,2e3],rotation:[-3600,3600],blur:[0,500],brightness:[0,1e3],hue:[-3600,3600],density:[0,1e3],zIndex:[-1e4,1e4],speed:[-1e3,1e3],intensity:[0,1e3]},p=Object.keys(d);for(const m of p){const[b,w]=d[m];if(!pt(l[m],Math.max(Math.abs(b),Math.abs(w)))||l[m]<b||l[m]>w)throw new Error("Nieprawidłowe ustawienie efektu: "+m)}if(!["normal","screen","lighten","multiply","overlay"].includes(String(l.blendMode))||!["full","left","center","right","top","bottom"].includes(String(l.area))||l.color!==void 0&&!$a(l.color)||l.colorize!==void 0&&typeof l.colorize!="boolean"||l.custom!==void 0&&!je(l.custom))throw new Error("Nieprawidłowe opcje warstwy efektu.");if(je(l.custom)){const m=Object.entries(l.custom);if(m.length>80||m.some(([b,w])=>!/^[\w-]{1,64}$/.test(b)||["__proto__","constructor","prototype"].includes(b)||!pt(w,1e4)))throw new Error("Nieprawidłowe parametry własne efektu.")}if(o.label!==void 0&&(typeof o.label!="string"||o.label.length>100))throw new Error("Nieprawidłowa etykieta warstwy.");if(o.locked!==void 0&&typeof o.locked!="boolean")throw new Error("Nieprawidłowa blokada warstwy.");if(o.groupId!==void 0&&o.groupId!==null&&!ar(o.groupId))throw new Error("Nieprawidłowa grupa warstwy.");const h=je(l.custom)?Object.fromEntries(Object.entries(l.custom).map(([m,b])=>[m,b])):void 0;if(o.timeline!==void 0&&!je(o.timeline))throw new Error("Nieprawidłowa oś czasu warstwy.");const f=o.trigger===void 0?void 0:$e(o.trigger);if(o.trigger!==void 0&&!f)throw new Error("Nieprawidłowy wyzwalacz warstwy.");const g={...c.defaultSettings,...Object.fromEntries(p.map(m=>[m,l[m]])),blendMode:l.blendMode,area:l.area,...l.color===void 0?{}:{color:l.color},...l.colorize===void 0?{}:{colorize:l.colorize},...h===void 0?{}:{custom:h}};return{instanceId:o.instanceId,effectId:c.id,enabled:o.enabled,seed:o.seed,settings:g,...o.timeline===void 0?{}:{timeline:ve(o.timeline,g)},...f===void 0?{}:{trigger:f},...typeof o.label=="string"?{label:o.label}:{},locked:o.locked===!0,groupId:typeof o.groupId=="string"?o.groupId:null}});return{resolution:{width:t.width,height:t.height},backgroundOnly:e.backgroundOnly,palette:{accent1:a.accent1,accent2:a.accent2,accent3:a.accent3,background1:a.background1,background2:a.background2},background:{mode:n.mode,angle:n.angle,lightX:n.lightX,lightY:n.lightY,hue:n.hue,saturation:n.saturation,brightness:n.brightness,contrast:n.contrast,noise:n.noise,vignette:n.vignette,...n.color===void 0?{}:{color:n.color},...n.colorize===void 0?{}:{colorize:n.colorize}},focusZone:e.focusZone,safeZone:e.safeZone,effects:r,selectedEffectInstanceId:typeof e.selectedEffectInstanceId=="string"&&i.has(e.selectedEffectInstanceId)?e.selectedEffectInstanceId:null,activePresetId:typeof e.activePresetId=="string"&&e.activePresetId.length<=100?e.activePresetId:null}}function Nu(e,t,a,n){const s=e.trim().slice(0,64);if(!s)throw new Error("Podaj nazwę zestawu animacji.");const i=gs(t),r=i.effects.filter(o=>o.enabled).map(o=>o.instanceId);return{format:Ba,version:Wa,name:s,createdAt:new Date().toISOString(),scene:i,trigger:at(a),routes:n===void 0?null:bt(n,r)}}function yn(e){const t=typeof e=="string"?JSON.parse(e):e;if(!je(t)||t.format!==Ba||t.version!==Wa||typeof t.name!="string"||!t.name.trim()||t.name.length>64||typeof t.createdAt!="string"||Number.isNaN(Date.parse(t.createdAt))||!je(t.trigger)||t.routes!==null&&!Array.isArray(t.routes))throw new Error("Nieobsługiwany lub uszkodzony profil StreamElements.");if(Array.isArray(t.routes)&&t.routes.length>va)throw new Error("Profil zawiera zbyt wiele reguł StreamElements.");const a=gs(t.scene),n=at(t.trigger),s=a.effects.filter(r=>r.enabled).map(r=>r.instanceId),i=t.routes===null?null:bt(t.routes,s);return{format:Ba,version:Wa,name:t.name.trim(),createdAt:t.createdAt,scene:a,trigger:n,routes:i}}function Lu(e){let t;try{t=e.getItem(hs)}catch{throw new Error("Przeglądarka zablokowała dostęp do zapisanych zestawów.")}if(!t)return[];if(t.length>Ua*Ke)throw new Error("Biblioteka zestawów jest za duża.");let a;try{a=JSON.parse(t)}catch{throw new Error("Biblioteka zestawów jest uszkodzona.")}if(!Array.isArray(a))throw new Error("Biblioteka zestawów jest uszkodzona.");return a.slice(0,Ke).map(yn)}function Du(e,t){if(t.length>Ke)throw new Error("Limit: 16 zapisanych zestawów.");const a=t.map(yn);try{e.setItem(hs,JSON.stringify(a))}catch{throw new Error("Nie udało się zapisać zestawu w pamięci przeglądarki.")}}function Te(e,t){return e.querySelector(t)}function Tu(e){return e.trim()||"Nowy zestaw animacji"}function nr(e,t){const a=new Set(t.map(s=>s.name.toLocaleLowerCase("pl"))),n=e.slice(0,64);if(!a.has(n.toLocaleLowerCase("pl")))return n;for(let s=2;s<1e3;s++){const i=" ("+s+")",r=n.slice(0,64-i.length)+i;if(!a.has(r.toLocaleLowerCase("pl")))return r}throw new Error("Nie można utworzyć kolejnej unikalnej nazwy.")}function Ou(e){const t=e.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"animated-effects",a=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(a),s=document.createElement("a");s.href=n,s.download=t+".ae-profile.json",document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(n),0)}function qu(e,t){const a=Te(e,"[data-profile-name]"),n=Te(e,"[data-profile-select]"),s=Te(e,"[data-profile-save]"),i=Te(e,"[data-profile-load]"),r=Te(e,"[data-profile-delete]"),o=Te(e,"[data-profile-export]"),c=Te(e,"[data-profile-import]"),l=Te(e,"[data-profile-file]"),d=Te(e,"[data-profile-status]");if(!a||!n||!s||!i||!r||!o||!c||!l||!d)return;const p=(k,x=!1)=>{d.textContent=k,d.dataset.error=String(x)},h=k=>p(k instanceof Error?k.message:"Nie udało się wykonać operacji.",!0),f=()=>Lu(window.localStorage),g=k=>Du(window.localStorage,k),m=k=>{const x=Number(n.value);return Number.isInteger(x)&&n.value!==""&&x>=0?k[x]??null:null},b=k=>{const x=f(),M=k??m(x)?.name??"";n.replaceChildren();const C=document.createElement("option");C.value="",C.textContent="Wybierz zapisany zestaw",n.appendChild(C),x.forEach((D,j)=>{const W=document.createElement("option");W.value=String(j),W.textContent=D.name+" · "+D.scene.effects.length+" warstw",n.appendChild(W)});const A=x.findIndex(D=>D.name===M);n.value=A<0?"":String(A);const _=A>=0;return i.disabled=!_,r.disabled=!_,o.disabled=!_,s.disabled=x.length>=Ke,x},w=()=>m(f());n.addEventListener("change",()=>{try{const k=w();i.disabled=r.disabled=o.disabled=k===null,k&&(a.value=k.name)}catch(k){h(k)}}),s.addEventListener("click",()=>{try{const k=f();if(k.length>=Ke)throw new Error("Limit: 16 zapisanych zestawów.");const x=nr(Tu(a.value),k),M=t.capture(x);if(JSON.stringify(M).length>Ua)throw new Error("Ten zestaw jest za duży do zapisania.");g([...k,M]),b(x),a.value=x,p("Zapisano zestaw „"+x+"” lokalnie w tej przeglądarce.")}catch(k){h(k)}}),i.addEventListener("click",()=>{try{const k=w();if(!k)throw new Error("Wybierz zestaw do wczytania.");if(!window.confirm("Wczytać zestaw „"+k.name+"”? Bieżąca scena i reguły zostaną zastąpione. Zmianę sceny można cofnąć przez Undo."))return;t.apply(k),p("Wczytano zestaw „"+k.name+"”.")}catch(k){h(k)}}),r.addEventListener("click",()=>{try{const k=f(),x=m(k);if(!x)throw new Error("Wybierz zestaw do usunięcia.");if(!window.confirm("Usunąć zapisany zestaw „"+x.name+"”?"))return;g(k.filter(M=>M!==x)),b(),p("Usunięto zestaw z pamięci tej przeglądarki.")}catch(k){h(k)}}),o.addEventListener("click",()=>{try{const k=w();if(!k)throw new Error("Wybierz zestaw do pobrania.");Ou(k),p("Przygotowano plik JSON: "+k.name+".")}catch(k){h(k)}}),c.addEventListener("click",()=>{l.click()}),l.addEventListener("change",async()=>{const k=l.files?.[0];if(l.value="",!!k)try{if(k.size>Ua)throw new Error("Plik przekracza limit 1 MB.");const x=yn(await k.text()),M=f();if(M.length>=Ke)throw new Error("Limit: 16 zapisanych zestawów.");const C=nr(x.name,M);g([...M,{...x,name:C}]),b(C),p("Zaimportowano „"+C+"” do biblioteki. Kliknij Wczytaj, aby zmienić scenę.")}catch(x){h(x)}});try{const k=b();p("Zapis lokalny: "+k.length+"/"+Ke+" zestawów. Import JSON nie podmienia bieżącej sceny.")}catch(k){h(k),s.disabled=i.disabled=r.disabled=o.disabled=!0}}const Fu={follower:"follower-latest",subscriber:"subscriber-latest",tip:"tip-latest",cheer:"cheer-latest",raid:"raid-latest"},Bu={follower:"Nowy obserwujący",subscriber:"Subskrypcja",tip:"Donacja",cheer:"Cheer / Bits",raid:"Raid"};function Wu(e,t,a=[]){const n=at(e);return(t===void 0?[{id:"single",...n,effectInstanceIds:a}]:bt(t,a)).map((i,r)=>i.mode==="always"?{id:i.id,label:"Zawsze aktywna — start przy ładowaniu",listener:"onWidgetLoad",event:{}}:i.mode==="chat-command"?{id:i.id,label:(t?String(r+1)+". ":"")+"Czat: "+i.chatCommand,listener:"message",event:{data:{text:i.chatCommand,msgId:"simulation-pending"}}}:{id:i.id,label:(t?String(r+1)+". ":"")+(Bu[i.mode]??i.mode),listener:Fu[i.mode]??"",event:{name:"Testowy widz"}})}function Uu(e,t){return e.listener==="message"?{listener:"message",event:{data:{...e.event.data&&typeof e.event.data=="object"?e.event.data:{},msgId:t}}}:{listener:e.listener,event:e.event}}function rr(e){return e.replace(/<\/script/gi,"<\\/script")}function Xu(e){return'<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>'+e.css.replace(/<\/style/gi,"<\\/style")+"</style></head><body>"+e.html+"<script>"+rr(e.javascript)+"<\/script><script>"+rr(`(function () {
  const root = document.getElementById("animated-effects-root");
  let previousLayerCount = -1;
  const sendState = function () {
    // Child particle mutations should not flood the parent with messages.
    const count = root ? root.children.length : 0;
    if (count === previousLayerCount) return;
    previousLayerCount = count;
    window.parent.postMessage({ type: "ae-se-simulator-state", count: count }, "*");
  };
  if (root) new MutationObserver(sendState).observe(root, { childList: true, subtree: true });
  window.addEventListener("message", function (message) {
    const data = message && message.data;
    if (!data || data.channel !== "ae-se-simulator") return;
    if (data.action === "event" && data.detail) {
      window.dispatchEvent(new CustomEvent("onEventReceived", { detail: data.detail }));
    } else if (data.action === "reset") {
      window.dispatchEvent(new CustomEvent("onWidgetLoad"));
      sendState();
    }
  });
  window.dispatchEvent(new CustomEvent("onWidgetLoad"));
  // Ready must reach the parent before the initial active-layer state.
  window.parent.postMessage({ type: "ae-se-simulator-ready" }, "*");
  sendState();
})();`)+"<\/script></body></html>"}function Zu(e,t){const a=e.querySelector("[data-simulator-frame]"),n=e.querySelector("[data-simulator-event]"),s=e.querySelector("[data-simulator-fire]"),i=e.querySelector("[data-simulator-reset]"),r=e.querySelector("[data-simulator-status]");if(!a||!n||!s||!i||!r)return{refresh:()=>{},destroy:()=>{}};let o=null,c="",l=!1,d=0,p=[],h=!0;const f=x=>{r.textContent=x},g=(x,M)=>{!l||!o?.contentWindow||o.contentWindow.postMessage({channel:"ae-se-simulator",action:x,detail:M},"*")},m=x=>{if(!h||!o||x.source!==o.contentWindow)return;const M=x.data;if(!(!M||typeof M!="object")&&(M.type==="ae-se-simulator-ready"&&(l=!0,s.disabled=p.length===0||p[n.selectedIndex]?.listener==="onWidgetLoad",i.disabled=!1,f("Gotowe. Podgląd korzysta z kodu wygenerowanego dla StreamElements.")),M.type==="ae-se-simulator-state"&&l)){const C=typeof M.count=="number"&&Number.isFinite(M.count)?M.count:0;f(C>0?"Aktywna animacja · "+C+" warstw. Kolejne zdarzenia respektują cooldown.":"Scena ukryta. Można przetestować kolejne zdarzenie.")}};window.addEventListener("message",m);const b=()=>{if(!h)return;const{exported:x,trigger:M,routes:C}=t(),A=n.value;p=Wu(M,C,he().effects.filter(D=>D.enabled).map(D=>D.instanceId)),n.replaceChildren();for(const D of p){const j=document.createElement("option");j.value=D.id,j.textContent=D.label,n.appendChild(j)}p.some(D=>D.id===A)&&(n.value=A),s.disabled=!l||p.length===0||p[n.selectedIndex]?.listener==="onWidgetLoad";const _=JSON.stringify([x.html,x.css,x.javascript]);_===c&&o||(c=_,l=!1,s.disabled=i.disabled=!0,f("Ładowanie odizolowanego podglądu StreamElements…"),o?.remove(),o=document.createElement("iframe"),o.className="export-simulator-iframe",o.title="Symulacja animacji StreamElements",o.setAttribute("sandbox","allow-scripts"),o.setAttribute("referrerpolicy","no-referrer"),a.replaceChildren(o),o.srcdoc=Xu(x))},w=()=>{const x=p.find(M=>M.id===n.value);!x||!l||x.listener==="onWidgetLoad"||(d+=1,g("event",Uu(x,"ae-sim-"+d)),f("Wysłano: "+x.label+". Oczekiwanie na reakcję widżetu…"))};s.addEventListener("click",w),n.addEventListener("change",()=>{s.disabled=!l||p[n.selectedIndex]?.listener==="onWidgetLoad"}),i.addEventListener("click",()=>{g("reset"),f("Zresetowano widżet i jego cooldowny.")});const k=()=>{h=!1,window.removeEventListener("message",m),o?.remove(),o=null};return e.addEventListener("close",()=>{o?.remove(),o=null,c="",l=!1,s.disabled=i.disabled=!0}),{refresh:b,destroy:k}}const bs=new WeakMap;function Gu(e){e.querySelector("[data-export-close]")?.addEventListener("click",()=>e.close());const a=e.querySelector("[data-export-download]");a?.addEventListener("click",async()=>{if(a.disabled)return;a.disabled=!0;const n=a.textContent;a.textContent="Tworzenie ZIP…";try{const s=structuredClone(he()),i=oa(s,Pt(e),Ct(e)),r=new es;r.file("widget.html",i.html),r.file("widget.css",i.css),r.file("widget.js",i.javascript),r.file("scene.aescene.json",on(s,"StreamElements Export")),r.file("README.txt",["Animated Effects — eksport do StreamElements","","1. Otwórz StreamElements > My Overlays i edytuj własny overlay.","2. Dodaj Custom Widget i przejdź do zakładek HTML, CSS i JS.","3. Wklej odpowiednio pliki widget.html, widget.css i widget.js.","4. Zapisz widget i sprawdź jego działanie w podglądzie.","","Plik scene.aescene.json jest kopią projektu do ponownej edycji","w Animated Effects (Wczytaj), a nie plikiem do StreamElements.","Rozdzielczość ustaw w overlayu / źródle OBS, nie w tym ZIP.","Dostępne są dwa warianty: globalny routing wielu reguł oraz","wyzwalacze przypisane do warstw z kolejką, priorytetami i podpisami.","Zestawy reguł globalnych mają pierwszeństwo, gdy są włączone.","Po onWidgetLoad startują warstwy ciągłe (Od razu / zawsze).","Warstwy z wyzwalaczem startują dopiero po pasującym onEventReceived.","Obsługa zdarzeń: follow, sub, tip, cheer, raid, wiadomość.","Wyzwalacze zależą od zdarzeń dostępnych na Twojej platformie.","Przycisk 'Testuj w podglądzie' działa tylko w edytorze Animated Effects.","Nie wymaga to tokenu SE_API ani zatrzymywania kolejki alertów.","","Dynamiczne podpisy alertów można włączyć w Inspektorze warstwy.","Wzory: {name} - widz, {amount} - kwota/liczba,","{message} - treść wiadomości, {event} - typ zdarzenia.","Tekst jest kodowany bez HTML, aby wiadomości nie uruchamiały kodu.","Kolejka alertów: ważniejsze oczekujące zdarzenia mogą zostać","wyświetlone wcześniej, ale nie przerywają aktualnej animacji.","Tryb, priorytet i wygląd podpisu ustawia się w Inspektorze warstwy.","Pozycja Własna (X/Y) pozwala też przeciągnąć podpis w podglądzie.","Podpis ma niezależne efekty wejścia i wyjścia: wjazd, fade, pop.","Wszystkie konfiguracje pozostają w scene.aescene.json.","Diagnostyka: w edytorze rozwiń panel pod podglądem sceny.","Symulator kolejki nie łączy się z kontem ani z StreamElements.","W wygenerowanym widgetcie można nasłuchiwać zdarzenia","animated-effects:diagnostics w DevTools (CustomEvent.detail).","Raport zawiera stan kolejki, typy zdarzeń i powody odrzuceń,","ale nie zawiera nazw widzów, kwot, czatu ani adresów awatarów.","W edytorze można wyeksportować i wczytać anonimowy ślad","syntetycznych zdarzeń (JSON) i odtworzyć go po zmianie sceny.","Porównanie A/B działa wyłącznie dla tego samego śladu","i pełnych przebiegów testowych; nie mierzy wydajności GPU/OBS.","Jeśli masz włączony alertbox StreamElements, osobno ustal","jego położenie, żeby nie nakładał się na te animacje.","","Wskazówka: plików ZIP nie przesyła się bezpośrednio do Custom Widget."].join(`
`));const o=await r.generateAsync({type:"blob",compression:"DEFLATE"}),c=URL.createObjectURL(o),l=document.createElement("a");l.href=c,l.download="animated-effects-streamelements.zip",document.body.appendChild(l),l.click(),l.remove(),setTimeout(()=>URL.revokeObjectURL(c),1500),a.textContent="Pobrano ZIP"}catch(s){console.error("Animated Effects: export ZIP failed",s),a.textContent="Błąd eksportu",window.alert("Nie udało się przygotować paczki. Spróbuj ponownie.")}finally{a.disabled=!1,setTimeout(()=>{a.textContent=n},1500)}}),e.querySelectorAll("[data-trigger-mode], [data-trigger-command], [data-trigger-duration], [data-trigger-cooldown]").forEach(n=>{n.addEventListener("change",()=>{da(e),e.open&&Qt(e)})}),da(e),Au(e,()=>Qt(e)),qu(e,{capture:n=>Nu(n,he(),Pt(e),Ct(e)),apply:n=>{nn(n.scene,"Wczytaj zestaw StreamElements: "+n.name),Hu(e,n.trigger),Iu(e,n.routes),Qt(e)}}),bs.set(e,Zu(e,()=>{const n=Pt(e),s=Ct(e);return{trigger:n,routes:s,exported:oa(he(),n,s)}})),e.querySelectorAll("[data-copy]").forEach(n=>{n.addEventListener("click",async()=>{const s=n.dataset.copy;if(!s)return;const i=e.querySelector(`[data-export="${s}"]`);if(!i)return;await navigator.clipboard.writeText(i.value);const r=n.textContent;n.textContent="Skopiowano",setTimeout(()=>{n.textContent=r},1e3)})})}function Qt(e){const t=Pt(e);da(e,t),Je(e);const a=Ct(e),n=oa(he(),t,a);Ra(e,"html",n.html),Ra(e,"css",n.css),Ra(e,"javascript",n.javascript);const s=e.querySelector("[data-export-metrics]");s&&(s.textContent=`${n.estimatedDomNodes} DOM · koszt ${n.estimatedPerformanceCost}`+(a===void 0?"":` · ${a.length} reguł`)),e.open||e.showModal(),bs.get(e)?.refresh()}function Pt(e){const t=e.querySelector("[data-trigger-mode]")?.value,a=e.querySelector("[data-trigger-command]")?.value,n=e.querySelector("[data-trigger-duration]")?.value,s=e.querySelector("[data-trigger-cooldown]")?.value;return t?at({mode:t,chatCommand:a,activeDurationMs:n===void 0?void 0:Number(n)*1e3,cooldownMs:s===void 0?void 0:Number(s)*1e3}):ts}function Hu(e,t){const a=e.querySelector("[data-trigger-mode]"),n=e.querySelector("[data-trigger-command]"),s=e.querySelector("[data-trigger-duration]"),i=e.querySelector("[data-trigger-cooldown]");a&&(a.value=t.mode),n&&(n.value=t.chatCommand),s&&(s.value=String(t.activeDurationMs/1e3)),i&&(i.value=String(t.cooldownMs/1e3)),da(e,t)}function da(e,t=Pt(e)){const a=t.mode==="always",n=t.mode==="chat-command",s=e.querySelector("[data-trigger-command-field]");s&&(s.hidden=!n),e.querySelectorAll("[data-trigger-timing]").forEach(l=>{l.hidden=a});const i=e.querySelector("[data-trigger-info]");i&&(i.textContent=a?"Efekty startują po załadowaniu widgetu i pozostają aktywne.":n?`Widz wpisuje ${t.chatCommand}; widget uruchamia scenę na ${t.activeDurationMs/1e3} s. Cooldown: ${t.cooldownMs/1e3} s.`:`Po zdarzeniu StreamElements scena działa ${t.activeDurationMs/1e3} s. Cooldown: ${t.cooldownMs/1e3} s.`);const r=e.querySelector("[data-trigger-command]"),o=e.querySelector("[data-trigger-duration]"),c=e.querySelector("[data-trigger-cooldown]");r&&r.value!==t.chatCommand&&(r.value=t.chatCommand),o&&(o.value=String(t.activeDurationMs/1e3)),c&&(c.value=String(t.cooldownMs/1e3))}function Ra(e,t,a){const n=e.querySelector(`[data-export="${t}"]`);n&&(n.value=a)}const ws=document.querySelector("#app");if(!ws)throw new Error("Nie znaleziono elementu #app.");ws.innerHTML=`
  <main class="ae-app-shell">
    <header class="ae-app-header">
      <div class="ae-brand">
        <div class="ae-brand-mark">OBS</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">DEV / NARZĘDZIA</span>
          <h1>Animated Effects</h1>
        </div>
      </div>

      <div class="ae-header-status">
        <span
          id="library-summary"
          class="ae-status-pill"
        ></span>

        <span
          id="active-summary"
          class="ae-status-pill"
        ></span>
      </div>

      <div class="ae-header-actions">
        <a href="../../stream" class="ae-button ae-button-secondary ae-back-link">← OBS / Stream</a>
        <button
          id="clear-preview"
          class="ae-button ae-button-secondary"
          type="button"
        >
          Wyczyść scenę
        </button>

        <button
          id="open-ready-alerts"
          class="ae-button ae-button-secondary ae-ready-open"
          type="button"
          title="Efekt, napis i wyzwalacz StreamElements w jednym kliknięciu"
        >
          ＋ Gotowy alert
        </button>

        <button
          id="export-stream-elements"
          class="ae-button ae-button-primary"
          type="button"
        >
          Eksportuj
        </button>
      </div>
    </header>

    <div class="ae-editor-grid">
      <aside class="ae-left-panel">
        <div class="ae-sidebar-tabs" role="tablist">
          <button
            class="ae-sidebar-tab is-active"
            type="button"
            data-sidebar-tab="effects"
            aria-selected="true"
          >
            Efekty
          </button>

          <button
            class="ae-sidebar-tab"
            type="button"
            data-sidebar-tab="layers"
            aria-selected="false"
          >
            Warstwy
            <span id="layer-count" class="ae-tab-count">0</span>
          </button>
        </div>

        <section
          id="effects-sidebar"
          class="ae-sidebar-view is-active"
          data-sidebar-view="effects"
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Biblioteka efektów</strong>
              <span id="effect-result-count"></span>
            </div>
          </div>

          <div class="ae-effect-filters">
            <label class="ae-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                id="effect-search"
                type="search"
                placeholder="Szukaj efektu..."
                autocomplete="off"
              >
            </label>

            <select
              id="effect-category"
              class="ae-category-select"
              aria-label="Kategoria efektu"
            ></select>
          </div>

          <div class="ae-library-usage-hint">
            <span>
              Kliknij kafelek = podgląd tymczasowy
            </span>

            <span>
              <strong>+</strong> = dodaj na stałe
            </span>
          </div>

          <div
            id="effect-library"
            class="ae-effect-library"
          ></div>
        </section>

        <section
          id="layers-sidebar"
          class="ae-sidebar-view"
          data-sidebar-view="layers"
          hidden
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Warstwy sceny</strong>
              <span>Najwyższa warstwa jest na górze listy</span>
            </div>
          </div>

          <div
            id="layers-list"
            class="ae-layer-list"
          ></div>
        </section>
      </aside>

      <section class="ae-stage-panel">
        <div class="ae-stage-toolbar">
          <div>
            <strong>Podgląd</strong>
            <span id="preview-meta"></span>
          </div>

          <div class="ae-stage-hint" title="Proporcje podglądu">
            16:9
          </div>
        </div>

        <div class="ae-preview-shell">
          <div id="preview-host"></div>
        </div>
      </section>

      <aside class="ae-inspector-panel">
        <div class="ae-panel-heading">
          <div>
            <strong>Ustawienia</strong>
            <span>Parametry zaznaczonej warstwy</span>
          </div>
        </div>

        <div
          id="inspector"
          class="ae-inspector-content"
        ></div>
      </aside>
    </div>
  </main>

  <dialog
    id="stream-elements-export"
    class="export-dialog"
  >
    <div class="export-header">
      <div>
        <strong>StreamElements</strong>
        <span data-export-metrics></span>
      </div>

      <button
        type="button"
        class="ae-button ae-button-secondary"
        data-export-download
        title="Pobierz kod widgetu i kopię edytowalnej sceny"
      >
        Pobierz ZIP
      </button>

      <button
        type="button"
        data-export-close
      >
        ×
      </button>
    </div>

    <section class="export-profile-config" aria-label="Zapisane konfiguracje StreamElements">
      <div class="export-profile-heading">
        <strong>Zestawy animacji i zdarzeń</strong>
        <span>Nowe · lokalne · przenośne</span>
      </div>
      <p>Zapisz całą scenę, przypisane warstwy i reguły StreamElements. Wczytanie wymaga potwierdzenia.</p>
      <div class="export-profile-actions">
        <label class="export-profile-name">Nazwa zestawu
          <input type="text" data-profile-name value="Mój zestaw" maxlength="64" autocomplete="off" />
        </label>
        <button type="button" data-profile-save>Zapisz aktualny</button>
      </div>
      <div class="export-profile-actions">
        <label class="export-profile-select-label">Zapisane zestawy
          <select data-profile-select><option value="">Wybierz zapisany zestaw</option></select>
        </label>
        <button type="button" data-profile-load disabled>Wczytaj</button>
        <button type="button" data-profile-export disabled>Pobierz JSON</button>
        <button type="button" data-profile-delete disabled>Usuń</button>
      </div>
      <div class="export-profile-actions">
        <button type="button" data-profile-import>Importuj JSON</button>
        <input type="file" data-profile-file accept=".json,application/json" hidden />
        <span class="export-profile-help">Pliki działają także w innej przeglądarce lub na drugim komputerze.</span>
      </div>
      <p class="export-profile-status" data-profile-status role="status" aria-live="polite"></p>
    </section>

    <section class="export-trigger-config" data-single-trigger aria-label="Aktywacja efektów">
      <strong>Uruchamianie animacji</strong>
      <p>Wybierz, kiedy StreamElements ma uruchomić tę scenę. Tryb ciągły zachowuje poprzednie działanie.</p>
      <div class="export-trigger-fields">
        <label>
          Zdarzenie
          <select data-trigger-mode>
            <option value="always">Zawsze aktywna</option>
            <option value="chat-command">Komenda na czacie</option>
            <option value="follower">Nowy obserwujący</option>
            <option value="subscriber">Subskrypcja</option>
            <option value="tip">Donacja</option>
            <option value="cheer">Cheer / Bits</option>
            <option value="raid">Raid</option>
          </select>
        </label>
        <label data-trigger-command-field hidden>
          Komenda (dostępna każdemu widzowi)
          <input type="text" data-trigger-command value="!hype" maxlength="25" spellcheck="false" autocomplete="off" />
        </label>
        <label data-trigger-timing hidden>
          Czas wyświetlania (s)
          <input type="number" data-trigger-duration value="5" min="0.5" max="60" step="0.5" />
        </label>
        <label data-trigger-timing hidden>
          Przerwa między aktywacjami (s)
          <input type="number" data-trigger-cooldown value="10" min="0" max="300" step="1" />
        </label>
      </div>
      <p class="export-trigger-note" data-trigger-info>Efekty startują po załadowaniu widgetu i pozostają aktywne.</p>
    </section>

    <section class="export-route-config" aria-label="Wiele reguł animacji">
      <label class="export-route-toggle">
        <input type="checkbox" data-multi-routes />
        <span><strong>Wiele zdarzeń w jednym widżecie</strong><small>Przypisz różne efekty do komend i alertów bez instalowania kolejnych widgetów.</small></span>
      </label>
      <div data-route-workspace hidden>
        <p class="export-route-description">Reguły są sprawdzane w kolejności od góry. Każda ma własny cooldown; najnowsza aktywowana scena zastępuje poprzednią.</p>
        <div data-route-list class="export-route-list"></div>
        <button type="button" data-add-route>+ Dodaj regułę</button>
        <p class="export-route-note" data-route-warning role="status"></p>
      </div>
    </section>

    <section class="export-simulator-config" aria-label="Symulator StreamElements">
      <div class="export-simulator-heading">
        <strong>Symulator StreamElements</strong>
        <span>Ten sam kod co w eksporcie</span>
      </div>
      <p>Sprawdź działanie wybranej reguły, cooldownu i warstw bez podłączania konta. Podgląd pracuje w odizolowanej ramce — nie zapisuje zmian w scenie.</p>
      <div class="export-simulator-toolbar">
        <label>Zdarzenie do zasymulowania
          <select data-simulator-event aria-label="Zdarzenie testowe"></select>
        </label>
        <button type="button" data-simulator-fire disabled>▶ Symuluj zdarzenie</button>
        <button type="button" data-simulator-reset disabled>↻ Resetuj podgląd</button>
      </div>
      <div class="export-simulator-stage" data-simulator-frame aria-label="Podgląd animacji 16:9"></div>
      <p class="export-simulator-status" data-simulator-status role="status" aria-live="polite">Podgląd uruchomi się po otwarciu eksportu.</p>
    </section>

    <div class="export-section">
      <div class="export-section-header">
        <strong>HTML</strong>
        <button type="button" data-copy="html">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="html"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>CSS</strong>
        <button type="button" data-copy="css">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="css"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>JavaScript</strong>
        <button type="button" data-copy="javascript">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="javascript"
        readonly
      ></textarea>
    </div>
  </dialog>

  <dialog id="ready-alerts" class="export-dialog ae-ready-dialog" aria-labelledby="ready-alerts-title">
    <div class="export-header">
      <div>
        <strong id="ready-alerts-title">Gotowe alerty</strong>
        <span class="ae-ready-lead">Efekt, napis i wyzwalacz StreamElements w jednym kliknięciu. Potem wszystko zmienisz w ustawieniach warstwy.</span>
      </div>
      <button type="button" data-ready-close aria-label="Zamknij">×</button>
    </div>
    <section class="ae-ready-section">
      <strong>1. Zdarzenie</strong>
      <div class="ae-ready-events" role="radiogroup" aria-label="Zdarzenie uruchamiające alert">
        ${na.map((e,t)=>`
          <label class="ae-ready-event">
            <input type="radio" name="ready-event" value="${e.event}" ${t===0?"checked":""}>
            <span>${e.label}</span>
          </label>
        `).join("")}
      </div>
    </section>
    <section class="ae-ready-section">
      <strong>2. Styl</strong>
      <div class="ae-ready-styles" role="radiogroup" aria-label="Styl alertu">
        ${ra.map((e,t)=>`
          <label class="ae-ready-style">
            <input type="radio" name="ready-style" value="${e.id}" ${t===0?"checked":""}>
            <span class="ae-ready-swatch" style="background: linear-gradient(135deg, ${e.colors[0]}, ${e.colors[1]})"></span>
            <span class="ae-ready-name">${e.label}</span>
            <span class="ae-ready-hint">${e.hint}</span>
          </label>
        `).join("")}
      </div>
    </section>
    <p class="ae-ready-preview" data-ready-preview aria-live="polite"></p>
    <div class="ae-ready-actions">
      <label class="ae-caption-switch">
        <input type="checkbox" data-ready-test checked>
        <span>Od razu pokaż test w podglądzie</span>
      </label>
      <button type="button" class="ae-button ae-button-secondary" data-ready-add-set>Dodaj komplet: follow, sub, donacja, bits, raid</button>
      <button type="button" class="ae-button ae-button-primary" data-ready-add>Dodaj alert</button>
    </div>
  </dialog>
`;const hn=document.createElement("style");hn.id="ae-caption-motion";hn.textContent=ur;document.head.appendChild(hn);function Ee(e){const t=document.querySelector(e);if(!t)throw new Error(`Nie znaleziono elementu: ${e}`);return t}const Yu=Ee("#preview-host"),Ia=Ee("#layers-list"),Ju=Ee("#layer-count"),gn=Ee("#inspector"),Ae=Ee("#effect-library"),sr=Ee("#effect-search"),pa=Ee("#effect-category"),Vu=Ee("#effect-result-count"),Ku=Ee("#library-summary"),Qu=Ee("#active-summary"),ef=Ee("#preview-meta"),ks=Ee("#stream-elements-export");Gu(ks);const Ge=Np(Yu),Xa=Vc(Ge,Ee(".ae-stage-panel")),tf=ml(Ee(".ae-stage-panel"),()=>he().effects),ua=It();let vs="",fa="all",_e=null;function af(e){const t=ze(e);return t?{instanceId:`preview-${crypto.randomUUID()}`,effectId:t.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...t.defaultSettings}}:null}function xs(){_e&&(_e=null,ya(),wn())}let ma=!1;const nf={calm:"Spokojne",energy:"Energia","sci-fi":"Sci-Fi",fantasy:"Fantasy",steampunk:"Steampunk",botanical:"Natura",urban:"Urban",cosmic:"Kosmos",tech:"Tech",solar:"Solar",retro:"Retro",weather:"Pogoda",cinematic:"Filmowe",abstract:"Abstrakcyjne",other:"Inne"};function jt(e){return nf[e]??e}function rf(e){return he().effects.filter(a=>a.effectId===e.effectId).findIndex(a=>a.instanceId===e.instanceId)+1}function sf(){const e=[...new Set(ua.map(t=>t.category))].sort((t,a)=>jt(t).localeCompare(jt(a),"pl"));pa.innerHTML=`
    <option value="all">
      Wszystkie kategorie
    </option>

    ${e.map(t=>`
          <option value="${t}">
            ${jt(t)}
          </option>
        `).join("")}
  `,pa.value=fa}function of(){const e=Ae.getBoundingClientRect(),a=Array.from(Ae.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).filter(s=>!s.hidden&&getComputedStyle(s).display!=="none").find(s=>s.getBoundingClientRect().bottom>e.top+1);if(!a)return null;const n=a.dataset.effectId;return n?{effectId:n,topOffset:a.getBoundingClientRect().top-e.top,scrollTop:Ae.scrollTop}:null}function cf(e){if(!e)return;const t=Ae.getBoundingClientRect(),a=Array.from(Ae.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).find(i=>i.dataset.effectId===e.effectId);if(!a){Ae.scrollTop=e.scrollTop;return}const s=a.getBoundingClientRect().top-t.top-e.topOffset;Number.isFinite(s)&&Math.abs(s)>.25&&(Ae.scrollTop+=s)}function lf(e){e&&requestAnimationFrame(()=>{requestAnimationFrame(()=>{cf(e)})})}function ya(){Array.from(Ae.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).forEach(e=>{const t=e.dataset.effectId;if(!t)return;const a=_e?.effectId===t;e.classList.toggle("is-previewing",a);const n=e.querySelector(".ae-effect-card-preview");if(!n)return;n.setAttribute("aria-pressed",String(a));const s=ze(t);s&&n.setAttribute("aria-label",a?`Wyłącz tymczasowy podgląd ${s.name}`:`Podejrzyj tymczasowo ${s.name}`)})}function bn(){const e=of(),t=vs.trim().toLocaleLowerCase("pl"),a=ua.filter(n=>fa==="all"||n.category===fa?t?[n.name,n.id,n.category,...n.tags,...ca(n.id).map(r=>r.name)].join(" ").toLocaleLowerCase("pl").includes(t):!0:!1);if(Vu.textContent=`${a.length} z ${ua.length}`,Ae.replaceChildren(),a.length===0){Ae.innerHTML=`
      <div class="ae-empty-state">
        Nie znaleziono efektów dla tych filtrów.
      </div>
    `;return}a.forEach(n=>{const s=document.createElement("div");s.className="ae-effect-card",s.dataset.category=n.category,s.dataset.effectId=n.id;const i=_e?.effectId===n.id;s.classList.toggle("is-previewing",i),s.title=n.description;const r=`Koszt wydajności: ${n.performanceCost}/5`,o=ca(n.id).length,c=Array.from({length:5},(l,d)=>`
            <i class="${d<n.performanceCost?"is-filled":""}"></i>
          `).join("");s.innerHTML=`
        <button
          class="ae-effect-card-preview"
          type="button"
          aria-pressed="${String(i)}"
          aria-label="${i?`Wyłącz tymczasowy podgląd ${n.name}`:`Podejrzyj tymczasowo ${n.name}`}"
        >
          <span class="ae-effect-card-main">
            <strong>${n.name}</strong>

            <span class="ae-effect-card-subline">
              <small>
                ${jt(n.category)}
              </small>

              <span
                class="ae-performance-dots"
                title="${r}"
                aria-label="${r}"
              >
                ${c}
              </span>

              ${o>0?`
                    <span
                      class="ae-variant-badge"
                      title="${o} warianty efektu"
                    >
                      ${o}V
                    </span>
                  `:""}
            </span>
          </span>
        </button>

        <button
          class="ae-add-icon"
          type="button"
          aria-label="Dodaj ${n.name} jako stałą warstwę"
          title="Dodaj jako stałą warstwę"
        >
          +
        </button>
      `,s.querySelector(".ae-effect-card-preview")?.addEventListener("click",()=>{_e=_e?.effectId===n.id?null:af(n.id),ya(),wn()}),s.querySelector(".ae-add-icon")?.addEventListener("click",()=>{_e=null,ya(),an(n.id)}),Ae.appendChild(s)}),lf(e)}const Be=new Map;function wn(){for(const t of Be.values())clearTimeout(t);Be.clear(),Ge.replaceChildren(),he().effects.forEach(t=>{!t.enabled||Qa(t)||Oa(Ge,t)}),_e&&Oa(Ge,_e),Xa.afterRender()}document.addEventListener("animated-effects:diagnostics-clear-preview",()=>{for(const e of Be.values())clearTimeout(e);Be.clear();for(const e of Array.from(Ge.children))e.dataset.testTriggerId&&e.remove()});document.addEventListener("animated-effects:test-trigger",e=>{const t=e.detail,a=t?.instanceId;if(!a)return;const n=he().effects.find(d=>d.instanceId===a);if(!n||!n.enabled||!Qa(n))return;if(t.diagnostic){for(const d of Be.values())clearTimeout(d);Be.clear();for(const d of Array.from(Ge.children))d.dataset.testTriggerId&&d.remove()}Array.from(Ge.children).find(d=>d.dataset?.testTriggerId===a)?.remove();const i=Be.get(a);i!==void 0&&clearTimeout(i);const r=document.createElement("div");r.dataset.testTriggerId=a,Object.assign(r.style,{position:"absolute",inset:"0",pointerEvents:"none"}),Ge.appendChild(r),Oa(r,xr(n));const o=n.trigger?.event??"follower-latest",c=o==="message"?{data:{displayName:"Przykładowy widz",text:"Świetny turniej!"}}:{name:"Przykładowy widz",amount:42,message:"Dobra robota!"},l=jc(r,n.trigger?.caption,o,c,_t(n));if(vr(n.trigger?.sound),l&&n.trigger?.caption?.position==="custom"){l.style.pointerEvents="auto",l.style.cursor="grab",l.style.touchAction="none",l.title="Przeciągnij podpis, aby ustawić go na scenie";let d=null,p=n.trigger.caption.xPercent??50,h=n.trigger.caption.yPercent??75;const f=(g,m)=>{const b=r.getBoundingClientRect();!b.width||!b.height||(p=Math.max(25,Math.min(75,Math.round((g-b.left)/b.width*100))),h=Math.max(10,Math.min(90,Math.round((m-b.top)/b.height*100))),l.style.left=p+"%",l.style.top=h+"%")};l.addEventListener("pointerdown",g=>{g.button!==0||d!==null||(d=g.pointerId,l.setPointerCapture(d),l.style.cursor="grabbing",g.preventDefault(),g.stopPropagation())}),l.addEventListener("pointermove",g=>{d===g.pointerId&&(f(g.clientX,g.clientY),g.preventDefault())}),l.addEventListener("pointerup",g=>{if(d!==g.pointerId)return;f(g.clientX,g.clientY),l.hasPointerCapture(d)&&l.releasePointerCapture(d),d=null,l.style.cursor="grab";const m=he().effects.find(b=>b.instanceId===a)?.trigger;m?.caption&&(m.caption.xPercent===p&&m.caption.yPercent===h||(aa(a,{...m,caption:{...m.caption,position:"custom",xPercent:p,yPercent:h}}),document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:a}}))))}),l.addEventListener("pointercancel",()=>{d=null,l.style.cursor="grab"})}Xa.replay(),Xa.afterRender(),Be.set(a,window.setTimeout(()=>{r.remove(),Be.delete(a)},_t(n)))});function df(){const e=he();if(Ia.replaceChildren(),Ju.textContent=String(e.effects.length),e.effects.length===0){Ia.innerHTML=`
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejdź do zakładki Efekty i dodaj pierwszy efekt.
      </div>
    `;return}[...e.effects].reverse().forEach(t=>{const a=ze(t.effectId);if(!a)return;const n=document.createElement("div");n.className="ae-layer-row",t.enabled||n.classList.add("is-disabled"),e.selectedEffectInstanceId===t.instanceId&&n.classList.add("is-selected");const s=rf(t);n.innerHTML=`
          <button
            class="ae-layer-select"
            type="button"
          >
            <span class="ae-layer-color-dot"></span>

            <span class="ae-layer-copy">
              <strong>
                ${a.name} #${s}
              </strong>

              <small>
                ${jt(a.category)}
              </small>
            </span>
          </button>

          <div class="ae-layer-actions">
            <button
              class="ae-icon-button ae-toggle-button layer-toggle"
              type="button"
              title="Włącz / wyłącz"
              aria-label="Włącz lub wyłącz warstwę"
            >
              ${t.enabled?"ON":"OFF"}
            </button>

            <button
              class="ae-icon-button layer-up"
              type="button"
              title="Przenieś wyżej"
              aria-label="Przenieś warstwę wyżej"
            >
              &#8593;
            </button>

            <button
              class="ae-icon-button layer-down"
              type="button"
              title="Przenieś niżej"
              aria-label="Przenieś warstwę niżej"
            >
              &#8595;
            </button>

            <button
              class="ae-icon-button ae-icon-danger layer-remove"
              type="button"
              title="Usuń"
              aria-label="Usuń warstwę"
            >
              &#215;
            </button>
          </div>
        `,n.querySelector(".ae-layer-select")?.addEventListener("click",()=>{jr(t.instanceId)}),n.querySelector(".layer-toggle")?.addEventListener("click",()=>{Oc(t.instanceId)}),n.querySelector(".layer-up")?.addEventListener("click",()=>{Fc(t.instanceId)}),n.querySelector(".layer-down")?.addEventListener("click",()=>{Bc(t.instanceId)}),n.querySelector(".layer-remove")?.addEventListener("click",()=>{Pr(t.instanceId)}),Ia.appendChild(n)})}function pf(){const e=he(),t=e.effects.filter(a=>a.enabled).length;Ku.textContent=`${ua.length} efektów`,Qu.textContent=`Aktywne: ${t} · Warstwy: ${e.effects.length}`,ef.textContent=`${e.resolution.width} × ${e.resolution.height} · aktywne: ${t}`}function uf(){ya(),wn(),df(),pf(),tf.refresh(),ma||(fn(gn),Sl())}function ff(e){document.querySelectorAll("[data-sidebar-tab]").forEach(t=>{const a=t.dataset.sidebarTab===e;t.classList.toggle("is-active",a),t.setAttribute("aria-selected",String(a))}),document.querySelectorAll("[data-sidebar-view]").forEach(t=>{const a=t.dataset.sidebarView===e;t.hidden=!a,t.classList.toggle("is-active",a)})}sf();bn();Mr(uf);gn.addEventListener("pointerdown",e=>{const t=e.target;t instanceof HTMLInputElement&&t.type==="range"&&(ma=!0)});const zs=()=>{ma&&(ma=!1,fn(gn))};window.addEventListener("pointerup",zs);window.addEventListener("pointercancel",zs);sr.addEventListener("input",()=>{vs=sr.value,bn()});pa.addEventListener("change",()=>{fa=pa.value,bn()});document.addEventListener("pointerdown",e=>{if(!_e)return;const t=e.target;t instanceof Element&&(t.closest(".ae-effect-card")||xs())});document.addEventListener("keydown",e=>{e.key==="Escape"&&_e&&xs()});document.querySelectorAll("[data-sidebar-tab]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.sidebarTab;(t==="effects"||t==="layers")&&ff(t)})});document.querySelector("#clear-preview")?.addEventListener("click",()=>{_e=null,Tc()});document.querySelector("#export-stream-elements")?.addEventListener("click",()=>{Qt(ks)});const Re=document.querySelector("#ready-alerts"),mf={name:"Przykładowy widz",amount:42,message:"Dobra robota!"},yf={data:{displayName:"Przykładowy widz",text:"Świetny turniej!"}};function kn(){const e=Re?.querySelector("input[name='ready-event']:checked")?.value,t=Re?.querySelector("input[name='ready-style']:checked")?.value;return{event:e??na[0].event,style:t??ra[0].id}}function Ss(){const e=Re?.querySelector("[data-ready-preview]");if(!e)return;const{event:t}=kn(),a=wa(t),n=t==="message"?yf:mf,s=ta(a.title,t,n),i=ta(a.subtitle,t,n);e.textContent=i?`Napis: „${s}” — ${i}`:`Napis: „${s}”`}function Ms(e){!e||!Re?.querySelector("[data-ready-test]")?.checked||window.setTimeout(()=>{document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:e}}))},60)}document.querySelector("#open-ready-alerts")?.addEventListener("click",()=>{Ss(),Re?.showModal()});Re?.addEventListener("change",Ss);Re?.querySelector("[data-ready-close]")?.addEventListener("click",()=>Re.close());Re?.querySelector("[data-ready-add]")?.addEventListener("click",()=>{const{event:e,style:t}=kn(),a=wl(e,t);Re.close(),Ms(a?.instanceId)});Re?.querySelector("[data-ready-add-set]")?.addEventListener("click",()=>{const e=kl(kn().style);Re.close(),Ms(e[0]?.instanceId)});an("rainfall");Pp();Ml();Ap();vl();zl();console.warn("[AE diagnostic] Pack 18 isolation active: Pack06Polish02, Pack08UiQa, Pack09Customization and Pack09UiPolish are disabled.");
