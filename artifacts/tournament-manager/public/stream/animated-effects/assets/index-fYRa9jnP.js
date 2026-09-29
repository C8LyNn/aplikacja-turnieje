(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();let da=!1;function It(e){document.querySelectorAll(".ae-polish02-menu[open]").forEach(a=>{a!==e&&(a.open=!1)})}function Oa(e){const a=Number(e.value);e.classList.toggle("is-boosted",a>100&&a<=200),e.classList.toggle("is-overdrive",a>200)}function pa(){document.querySelectorAll('#inspector input[type="range"]').forEach(Oa)}function Tr(){if(da)return;da=!0,document.addEventListener("toggle",a=>{const t=a.target;t instanceof HTMLDetailsElement&&t.matches(".ae-polish02-menu")&&t.open&&It(t)},!0),document.addEventListener("pointerdown",a=>{const t=a.target;t instanceof Element&&(t.closest(".ae-polish02-menu")||It())}),document.addEventListener("click",a=>{const t=a.target;if(t instanceof Element&&t.closest(".ae-polish02-menu-panel button")){const n=t.closest(".ae-polish02-menu");n&&(n.open=!1)}}),document.addEventListener("keydown",a=>{a.key==="Escape"&&It()}),document.addEventListener("input",a=>{const t=a.target;t instanceof HTMLInputElement&&t.type==="range"&&t.closest("#inspector")&&Oa(t)});const e=document.querySelector("#inspector");if(e){let a=!1;const t=new MutationObserver(()=>{a||(a=!0,requestAnimationFrame(()=>{t.disconnect();try{pa()}finally{a=!1,t.observe(e,{childList:!0,subtree:!0})}}))});t.observe(e,{childList:!0,subtree:!0})}for(const a of[".ae-effect-library",".ae-layer-list",".ae-inspector-content",".ae-media-export"])document.querySelectorAll(a).forEach(t=>{t.addEventListener("wheel",n=>{n.stopPropagation()},{passive:!0})});pa()}const ae={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#a88cff",colorize:!1,density:100,blendMode:"normal",area:"full",zIndex:20,speed:100,intensity:100},Fr={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0};function re(e){return{...e,capabilities:e.capabilities??Fr}}function G(e,a,t=0){return Math.max(t,Math.round(e*(a.density/100)))}const qr=`
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
`.trim(),Wr=`
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
`.trim(),Xr=`
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
`.trim(),Ur=`
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
`.trim(),Gr=`
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
`.trim(),Yr=`
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
`.trim(),Hr=`
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
`.trim(),Zr=`
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
`.trim(),Jr=`
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
`.trim(),Vr={definition:re({id:"rainfall",name:"Rainfall",description:"SpadajÄ…ce krople deszczu.",category:"weather",tags:["rain","weather","water"],defaultSettings:{...ae,opacity:75,density:70,speed:120},performanceCost:3,requiresJavaScript:!0}),css:qr,streamElementsRendererName:"aeRenderRainfall",renderPreview(e,a,t){const n=G(80,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-rain-drop",r.style.left=`${t()*100}%`,r.style.animationDelay=`${-t()*2}s`,r.style.animationDuration=`${(.7+t()*.8)/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(80,e)}},Kr={definition:re({id:"snow",name:"Snow",description:"SpadajÄ…ce pĹ‚atki Ĺ›niegu.",category:"weather",tags:["snow","winter","weather","flakes"],defaultSettings:{...ae,opacity:85,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Wr,streamElementsRendererName:"aeRenderSnow",renderPreview(e,a,t){const n=G(55,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-snowflake";const o=4+t()*10;r.style.left=`${t()*100}%`,r.style.top=`${-10-t()*25}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.opacity=String(.45+t()*.55),r.style.animationDelay=`${-t()*12}s`,r.style.animationDuration=`${(6+t()*8)/i}s`,r.style.setProperty("--ae-snow-drift",`${-50+t()*100}px`),r.style.setProperty("--ae-snow-rotation",`${120+t()*360}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(55,e)}},Qr={definition:re({id:"lightning",name:"Lightning Storm",description:"Losowe bĹ‚yski i pioruny.",category:"weather",tags:["lightning","storm","electric"],defaultSettings:{...ae,opacity:100,density:45,speed:100,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Xr,streamElementsRendererName:"aeRenderLightning",renderPreview(e,a,t){const n=G(8,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-lightning",r.style.left=`${10+t()*80}%`,r.style.top=`${t()*35}%`,r.style.animationDelay=`${-t()*4}s`,r.style.animationDuration=`${2.2/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(8,e,1)}},en={definition:re({id:"hearts",name:"Hearts",description:"UnoszÄ…ce siÄ™ animowane serduszka.",category:"other",tags:["heart","love","particles","fun"],defaultSettings:{...ae,opacity:80,density:50,speed:80},performanceCost:2,requiresJavaScript:!0}),css:Ur,streamElementsRendererName:"aeRenderHearts",renderPreview(e,a,t){const n=G(30,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-heart",r.innerHTML="&#10084;",r.style.left=`${t()*100}%`,r.style.animationDelay=`${-t()*8}s`,r.style.animationDuration=`${8/i}s`,r.style.fontSize=`${14+t()*22}px`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(30,e)}},tn={definition:re({id:"leaves",name:"Leaves",description:"WirujÄ…ce, opadajÄ…ce liĹ›cie.",category:"botanical",tags:["leaves","autumn","nature","particles"],defaultSettings:{...ae,opacity:90,density:60,speed:70},performanceCost:2,requiresJavaScript:!0}),css:Gr,streamElementsRendererName:"aeRenderLeaves",renderPreview(e,a,t){const n=G(36,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-leaf";const o=12+t()*16;r.style.left=`${t()*100}%`,r.style.top=`${-10-t()*25}%`,r.style.width=`${o}px`,r.style.height=`${o*.62}px`,r.style.animationDelay=`${-t()*12}s`,r.style.animationDuration=`${(7+t()*8)/i}s`,r.style.setProperty("--ae-leaf-drift",`${-90+t()*180}px`),r.style.setProperty("--ae-leaf-rotation",`${360+t()*720}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(36,e)}},an={definition:re({id:"matrix",name:"Matrix Code",description:"Kolumny opadajÄ…cego cyfrowego kodu.",category:"tech",tags:["matrix","code","digital","tech","cyber"],defaultSettings:{...ae,opacity:80,density:55,speed:85,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Yr,streamElementsRendererName:"aeRenderMatrix",renderPreview(e,a,t){const n=G(24,a,1),i=Math.max(.1,a.speed/100),s="01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-matrix-column";const l=8+Math.floor(t()*11);let m="";for(let y=0;y<l;y++)m+=s[Math.floor(t()*s.length)],y<l-1&&(m+=`
`);o.textContent=m,o.style.left=`${t()*100}%`,o.style.fontSize=`${11+t()*9}px`,o.style.animationDelay=`${-t()*8}s`,o.style.animationDuration=`${(4+t()*5)/i}s`,o.style.opacity=String(.45+t()*.55),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(24,e,1)}},rn={definition:re({id:"comets",name:"Comets",description:"Szybkie Ĺ›wietliste komety przecinajÄ…ce ekran.",category:"cosmic",tags:["comet","space","cosmic","streak"],defaultSettings:{...ae,opacity:90,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Hr,streamElementsRendererName:"aeRenderComets",renderPreview(e,a,t){const n=G(10,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-comet",r.style.top=`${-10+t()*75}%`,r.style.width=`${90+t()*140}px`,r.style.animationDelay=`${-t()*10}s`,r.style.animationDuration=`${(4+t()*5)/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(10,e,1)}},nn={definition:re({id:"starfield",name:"Starfield",description:"MigoczÄ…ce gwiazdy w tle.",category:"cosmic",tags:["stars","space","cosmic","twinkle"],defaultSettings:{...ae,opacity:85,density:65,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Zr,streamElementsRendererName:"aeRenderStarfield",renderPreview(e,a,t){const n=G(100,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-star";const o=1+t()*3.5;r.style.left=`${t()*100}%`,r.style.top=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*4}s`,r.style.animationDuration=`${(1.5+t()*3)/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(100,e)}},sn={definition:re({id:"fog",name:"Fog",description:"Powolne warstwy mgĹ‚y przesuwajÄ…ce siÄ™ przez ekran.",category:"weather",tags:["fog","mist","cloud","weather","cinematic"],defaultSettings:{...ae,opacity:65,density:70,speed:45,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Jr,streamElementsRendererName:"aeRenderFog",renderPreview(e,a,t){const n=G(6,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-fog-blob",r.style.left=`${-25+t()*95}%`,r.style.top=`${-10+t()*75}%`,r.style.width=`${45+t()*35}%`,r.style.height=`${30+t()*35}%`,r.style.opacity=String(.16+t()*.22),r.style.animationDelay=`${-t()*24}s`,r.style.animationDuration=`${(18+t()*18)/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(6,e,1)}},on=`
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
`.trim(),cn=`
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
`.trim(),ln=`
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
`.trim(),dn=`
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
`.trim(),pn=`
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
`.trim(),un=`
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
`.trim(),fn=`
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
`.trim(),yn=`
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
`.trim(),mn={definition:re({id:"embers",name:"Embers",description:"Ĺ»arzÄ…ce siÄ™ drobiny unoszÄ…ce siÄ™ ku gĂłrze.",category:"cinematic",tags:["embers","fire","ash","cinematic"],defaultSettings:{...ae,opacity:90,density:55,speed:70,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:on,streamElementsRendererName:"aeRenderEmbers",renderPreview(e,a,t){const n=G(46,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-ember";const o=2+t()*6;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*10}s`,r.style.animationDuration=`${(5+t()*7)/i}s`,r.style.setProperty("--ae-ember-drift",`${-55+t()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(46,e)}},hn={definition:re({id:"clouds",name:"Clouds",description:"MiÄ™kkie, pĂłĹ‚przezroczyste chmury przesuwajÄ…ce siÄ™ po ekranie.",category:"weather",tags:["clouds","weather","mist","sky"],defaultSettings:{...ae,opacity:70,density:45,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:cn,streamElementsRendererName:"aeRenderClouds",renderPreview(e,a,t){const n=G(10,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-cloud";const o=220+t()*340,l=90+t()*130;r.style.left=`${-35-t()*35}%`,r.style.top=`${t()*85}%`,r.style.width=`${o}px`,r.style.height=`${l}px`,r.style.opacity=String(.35+t()*.5),r.style.animationDelay=`${-t()*24}s`,r.style.animationDuration=`${(22+t()*28)/i}s`,r.style.setProperty("--ae-cloud-lift",`${-6+t()*12}vh`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(10,e,1)}},gn={definition:re({id:"rain-glass",name:"Rain on Glass",description:"Krople deszczu spĹ‚ywajÄ…ce po wirtualnej szybie.",category:"weather",tags:["rain","glass","drops","weather"],defaultSettings:{...ae,opacity:72,density:55,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:ln,streamElementsRendererName:"aeRenderRainGlass",renderPreview(e,a,t){const n=G(44,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-glass-drop";const o=3+t()*8,l=18+t()*72;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${l}px`,r.style.animationDelay=`${-t()*11}s`,r.style.animationDuration=`${(4+t()*9)/i}s`,r.style.setProperty("--ae-glass-drift",`${-12+t()*24}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(44,e)}},bn={definition:re({id:"bouncing-balls",name:"Bouncing Balls",description:"Kolorowe kule odbijajÄ…ce siÄ™ i dryfujÄ…ce po ekranie.",category:"retro",tags:["balls","bounce","retro","screensaver"],defaultSettings:{...ae,opacity:85,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:dn,streamElementsRendererName:"aeRenderBouncingBalls",renderPreview(e,a,t){const n=G(18,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-bounce-ball";const o=14+t()*42;r.style.left=`${8+t()*78}%`,r.style.top=`${8+t()*78}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*8}s`,r.style.animationDuration=`${(4+t()*7)/i}s`,r.style.setProperty("--ae-ball-dx",`${-18+t()*36}vw`),r.style.setProperty("--ae-ball-dy",`${-14+t()*28}vh`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(18,e,1)}},wn={definition:re({id:"neon-lines",name:"Neon Lines",description:"ĹšwiecÄ…ce neonowe smugi przesuwajÄ…ce siÄ™ przez ekran.",category:"tech",tags:["neon","lines","cyber","tech"],defaultSettings:{...ae,opacity:88,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:pn,streamElementsRendererName:"aeRenderNeonLines",renderPreview(e,a,t){const n=G(16,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-neon-line",r.style.left=`${-35-t()*25}%`,r.style.top=`${5+t()*90}%`,r.style.width=`${120+t()*320}px`,r.style.opacity=String(.45+t()*.55),r.style.animationDelay=`${-t()*8}s`,r.style.animationDuration=`${(3+t()*6)/i}s`,r.style.setProperty("--ae-line-angle",`${-20+t()*40}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(16,e,1)}},kn={definition:re({id:"energy-orbs",name:"Energy Orbs",description:"PulsujÄ…ce, Ĺ›wiecÄ…ce kule energii.",category:"energy",tags:["energy","orbs","glow","plasma"],defaultSettings:{...ae,opacity:82,density:48,speed:70,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:un,streamElementsRendererName:"aeRenderEnergyOrbs",renderPreview(e,a,t){const n=G(20,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-energy-orb";const o=14+t()*56;r.style.left=`${5+t()*88}%`,r.style.top=`${5+t()*88}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*9}s`,r.style.animationDuration=`${(4+t()*8)/i}s`,r.style.setProperty("--ae-orb-dx",`${-70+t()*140}px`),r.style.setProperty("--ae-orb-dy",`${-60+t()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(20,e,1)}},xn={definition:re({id:"petals",name:"Petals",description:"Delikatne pĹ‚atki opadajÄ…ce i wirujÄ…ce na wietrze.",category:"botanical",tags:["petals","flowers","spring","nature"],defaultSettings:{...ae,opacity:88,density:55,speed:62},performanceCost:2,requiresJavaScript:!0}),css:fn,streamElementsRendererName:"aeRenderPetals",renderPreview(e,a,t){const n=G(34,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-petal";const o=8+t()*13,l=12+t()*18;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${l}px`,r.style.animationDelay=`${-t()*12}s`,r.style.animationDuration=`${(7+t()*9)/i}s`,r.style.setProperty("--ae-petal-drift",`${-70+t()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(34,e)}},vn={definition:re({id:"sparks",name:"Sparks",description:"Jasne iskry wystrzeliwujÄ…ce ku gĂłrze.",category:"energy",tags:["sparks","fire","energy","particles"],defaultSettings:{...ae,opacity:92,density:58,speed:115,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:yn,streamElementsRendererName:"aeRenderSparks",renderPreview(e,a,t){const n=G(52,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-spark",r.style.left=`${t()*100}%`,r.style.height=`${8+t()*24}px`,r.style.animationDelay=`${-t()*7}s`,r.style.animationDuration=`${(2.2+t()*4.2)/i}s`,r.style.setProperty("--ae-spark-drift",`${-75+t()*150}px`),r.style.setProperty("--ae-spark-angle",`${-22+t()*44}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(52,e)}},zn=`
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
`.trim(),Sn=`
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
`.trim(),Pn=`
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
`.trim(),Cn=`
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
`.trim(),Mn=`
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
`.trim(),En=`
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
`.trim(),_n=`
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
`.trim(),$n=`
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
`.trim(),Rn=`
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
`.trim(),jn=`
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
`.trim(),Dn=`
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
`.trim(),In=`
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
`.trim(),Nn={definition:re({id:"plasma",name:"Plasma",description:"PulsujÄ…ce obĹ‚oki plazmy i neonowej energii.",category:"energy",tags:["plasma","energy","glow","abstract"],defaultSettings:{...ae,opacity:80,density:45,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:zn,streamElementsRendererName:"aeRenderPlasma",renderPreview(e,a,t){const n=G(9,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-plasma-blob";const o=70+t()*150;r.style.left=`${t()*90}%`,r.style.top=`${t()*85}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*8}s`,r.style.animationDuration=`${(6+t()*8)/i}s`,r.style.setProperty("--ae-plasma-x",`${-90+t()*180}px`),r.style.setProperty("--ae-plasma-y",`${-70+t()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(9,e,1)}},An={definition:re({id:"energy-waves",name:"Energy Waves",description:"RozchodzÄ…ce siÄ™ neonowe fale energii.",category:"energy",tags:["energy","waves","rings","pulse"],defaultSettings:{...ae,opacity:82,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Sn,streamElementsRendererName:"aeRenderEnergyWaves",renderPreview(e,a,t){const n=G(7,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-energy-wave",r.style.left=`${35+t()*30}%`,r.style.top=`${35+t()*30}%`,r.style.animationDelay=`${-(s/n)*5}s`,r.style.animationDuration=`${5/i}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(7,e,1)}},Ln={definition:re({id:"runes",name:"Runes",description:"Świecące runy Elder Futhark unoszące się w tle.",category:"fantasy",tags:["runes","elder-futhark","magic","fantasy","symbols"],defaultSettings:{...ae,opacity:78,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Pn,streamElementsRendererName:"aeRenderRunes",renderPreview(e,a,t){const n=["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"],i=G(24,a,1),s=Math.max(.1,a.speed/100);for(let r=0;r<i;r++){const o=document.createElement("span");o.className="ae-rune",o.textContent=n[Math.floor(t()*n.length)]??"ᚠ",o.style.left=`${t()*95}%`,o.style.top=`${t()*92}%`,o.style.fontSize=`${18+t()*36}px`,o.style.animationDelay=`${-t()*9}s`,o.style.animationDuration=`${(6+t()*7)/s}s`,o.style.setProperty("--ae-rune-x",`${-45+t()*90}px`),o.style.setProperty("--ae-rune-y",`${-55+t()*110}px`),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(24,e,1)}},Bn={definition:re({id:"magic-dust",name:"Magic Dust",description:"MigoczÄ…cy magiczny pyĹ‚ i drobne iskierki.",category:"fantasy",tags:["magic","dust","sparkle","fantasy"],defaultSettings:{...ae,opacity:86,density:65,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Cn,streamElementsRendererName:"aeRenderMagicDust",renderPreview(e,a,t){const n=G(70,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-magic-dust";const o=1.5+t()*4.5;r.style.left=`${t()*100}%`,r.style.top=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*7}s`,r.style.animationDuration=`${(4+t()*7)/i}s`,r.style.setProperty("--ae-dust-x",`${-40+t()*80}px`),r.style.setProperty("--ae-dust-y",`${-60+t()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(70,e)}},On={definition:re({id:"laser-grid",name:"Laser Grid",description:"Perspektywiczna neonowa siatka w stylu synthwave.",category:"sci-fi",tags:["laser","grid","synthwave","cyber"],defaultSettings:{...ae,opacity:72,density:55,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Mn,streamElementsRendererName:"aeRenderLaserGrid",renderPreview(e,a){const t=document.createElement("span");t.className="ae-laser-grid";const n=Math.max(20,92-a.density*.65);t.style.setProperty("--ae-grid-size",`${n}px`),t.style.animationDuration=`${5/Math.max(.1,a.speed/100)}s`,e.appendChild(t)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},Tn={definition:re({id:"scanlines",name:"Retro Scanlines",description:"Animowane linie kineskopowe CRT.",category:"retro",tags:["retro","crt","scanlines","arcade"],defaultSettings:{...ae,opacity:55,density:60,speed:100,blendMode:"overlay"},performanceCost:1,requiresJavaScript:!0}),css:En,streamElementsRendererName:"aeRenderScanlines",renderPreview(e,a){const t=document.createElement("span");t.className="ae-scanlines";const n=Math.max(3,12-a.density*.08);t.style.setProperty("--ae-scan-gap",`${n}px`),t.style.animationDuration=`${1.8/Math.max(.1,a.speed/100)}s`,e.appendChild(t)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}};function Fn(e,a,t){const n=document.createElement("div");n.className="ae-pong-arena";const i=document.createElement("span");i.className="ae-pong-center-line";const s=document.createElement("span");s.className="ae-pong-paddle left";const r=document.createElement("span");r.className="ae-pong-paddle right";const o=document.createElement("span");o.className="ae-pong-ball";const l=document.createElement("span");l.className="ae-pong-score left";const m=document.createElement("span");m.className="ae-pong-score right",n.append(i,l,m,s,r,o),e.appendChild(n);let y=0,d=0,w=10,u=100,b=14,f=28,h=0,g=0,v=0,S=0,P=0,M=0,I=0,$=0,B=0,E=0,q=0,K=0,z=performance.now(),N=!1,p=260;const O=Math.max(.2,a.speed/100),ee=Math.max(.1,Math.min(1,a.density/100)),F=Math.max(0,Math.min(1,a.intensity/100)),se=.0125*F,U=1+.8*F,ne=52*Math.PI/180,D=()=>{l.textContent=String(q),m.textContent=String(K)},j=()=>{const oe=n.clientWidth,ie=n.clientHeight;if(oe<=0||ie<=0)return!1;const ye=oe!==y||ie!==d;return y=oe,d=ie,w=Math.max(8,y*.009),u=Math.max(58,d*.22),b=Math.max(12,Math.min(20,Math.min(y,d)*.026)),f=Math.max(22,y*.045),p=Math.max(210,Math.min(y,d)*.58)*O,s.style.width=`${w}px`,s.style.height=`${u}px`,r.style.width=`${w}px`,r.style.height=`${u}px`,o.style.width=`${b}px`,o.style.height=`${b}px`,ye&&N&&(h=Math.max(0,Math.min(d-u,h)),g=Math.max(0,Math.min(d-u,g)),P=Math.max(0,Math.min(d-u,P)),M=Math.max(0,Math.min(d-u,M)),I=Math.max(-b,Math.min(y,I)),$=Math.max(0,Math.min(d-b,$))),!0},te=oe=>{I=y/2-b/2,$=d/2-b/2;const ie=(12+t()*20)*Math.PI/180*(t()<.5?-1:1);B=oe*p*Math.cos(ie),E=p*Math.sin(ie)},J=()=>{j()&&(h=d/2-u/2,g=h,v=0,S=0,P=h,M=g,te(t()<.5?-1:1),D(),N=!0,z=performance.now())},H=(oe,ie,ye,pe,c,L,R)=>{const x=ye-oe,C=Math.max(-pe,Math.min(pe,x*L))-ie,A=c*R,T=ie+Math.max(-A,Math.min(A,C));let _=oe+T*R;const W=Math.max(0,d-u);return _<0?(_=0,{position:_,velocity:Math.max(0,T)}):_>W?(_=W,{position:_,velocity:Math.min(0,T)}):{position:_,velocity:T}},fe=(oe,ie)=>{const ye=Math.max(p,Math.hypot(B,E)),pe=p*U,c=Math.min(pe,ye*(1+se)),L=$+b/2,R=Math.max(-1,Math.min(1,(L-(ie+u/2))/(u/2))),x=Math.sin(ne),k=Math.max(-x,Math.min(x,E/ye)),C=R*x,A=k*.78+C*.22,T=.72,_=Math.sqrt(Math.max(0,1-T*T)),W=Math.max(-_,Math.min(_,A));E=c*W;const Z=Math.sqrt(Math.max(0,c*c-E*E));B=oe*Z},he=oe=>{oe==="left"?q+=1:K+=1,(q>=10||K>=10)&&(q=0,K=0),D(),te(oe==="left"?-1:1)},ce=oe=>{const ie=f,ye=y-f-w,pe=1e-6;let c=oe,L=0;for(;c>pe&&L<12;){L+=1;let R=c+1,x=null;const k=(C,A)=>{C>=-pe&&C<=c+pe&&C<R&&(R=Math.max(0,C),x=A)};if(E<-pe&&k((0-$)/E,"top"),E>pe&&k((d-b-$)/E,"bottom"),B<-pe){const A=(ie+w-I)/B;if(A>=-pe&&A<=c+pe){const T=$+E*Math.max(0,A);T+b>=h&&T<=h+u&&k(A,"left-paddle")}k((-b-I)/B,"right-score")}if(B>pe){const A=(ye-b-I)/B;if(A>=-pe&&A<=c+pe){const T=$+E*Math.max(0,A);T+b>=g&&T<=g+u&&k(A,"right-paddle")}k((y-I)/B,"left-score")}if(x===null){I+=B*c,$+=E*c,c=0;break}switch(I+=B*R,$+=E*R,c-=R,x){case"top":$=0,E=Math.abs(E);break;case"bottom":$=d-b,E=-Math.abs(E);break;case"left-paddle":I=ie+w,fe(1,h);break;case"right-paddle":I=ye-b,fe(-1,g);break;case"left-score":he("left");return;case"right-score":he("right");return}if(R<=pe&&c>pe){const C=Math.min(c,1e-5);I+=B*C,$+=E*C,c-=C}}},de=oe=>{if(!e.isConnected)return;if(!N&&(J(),!N)){requestAnimationFrame(de);return}j();const ie=Math.min(Math.max((oe-z)/1e3,0),1/30);z=oe;const ye=d*(.72+ee*.58)*O,pe=d*(2.2+ee*2.8)*O,c=4.2+ee*3.2,L=2.8+ee*2.4,R=(1-ee)*u*.72,x=$+b/2,k=Math.sin(oe*.0013+.8)*R,C=Math.sin(oe*.00117+2.2)*R,A=B<0?x+k-u/2:d/2-u/2,T=B>0?x+C-u/2:d/2-u/2,_=Math.max(0,d-u),W=Math.max(0,Math.min(_,A)),Z=Math.max(0,Math.min(_,T)),Y=1-Math.exp(-L*ie);P+=(W-P)*Y,M+=(Z-M)*Y;const Q=H(h,v,P,ye,pe,c,ie);h=Q.position,v=Q.velocity;const ue=H(g,S,M,ye,pe,c,ie);g=ue.position,S=ue.velocity,ce(ie);const le=f,ke=y-f-w;s.style.transform=`translate3d(${le}px, ${h}px, 0)`,r.style.transform=`translate3d(${ke}px, ${g}px, 0)`,o.style.transform=`translate3d(${I}px, ${$}px, 0)`,requestAnimationFrame(de)};requestAnimationFrame(de)}const qn={definition:re({id:"pong",name:"Retro Pong",description:"PĹ‚ynna rozgrywka Pong z AI, wynikiem i regulowanym przyspieszeniem.",category:"retro",tags:["pong","retro","arcade","game","physics"],defaultSettings:{...ae,opacity:82,density:62,speed:90,intensity:0,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:_n,streamElementsRendererName:"aeRenderPong",renderPreview(e,a,t){Fn(e,a,t)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 7}},Wn={definition:re({id:"bubbles",name:"Bubbles",description:"Przezroczyste bÄ…belki unoszÄ…ce siÄ™ ku gĂłrze.",category:"calm",tags:["bubbles","water","calm","float"],defaultSettings:{...ae,opacity:72,density:52,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:$n,streamElementsRendererName:"aeRenderBubbles",renderPreview(e,a,t){const n=G(32,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-bubble";const o=12+t()*48;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*10}s`,r.style.animationDuration=`${(7+t()*8)/i}s`,r.style.setProperty("--ae-bubble-drift",`${-65+t()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(32,e,1)}},Xn={definition:re({id:"fireflies",name:"Fireflies",description:"MigoczÄ…ce Ĺ›wietliki poruszajÄ…ce siÄ™ w ciemnoĹ›ci.",category:"botanical",tags:["fireflies","nature","glow","night"],defaultSettings:{...ae,opacity:84,density:48,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Rn,streamElementsRendererName:"aeRenderFireflies",renderPreview(e,a,t){const n=G(38,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-firefly";const o=2+t()*5;r.style.left=`${t()*100}%`,r.style.top=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*8}s`,r.style.animationDuration=`${(4+t()*7)/i}s`,r.style.setProperty("--ae-firefly-x",`${-75+t()*150}px`),r.style.setProperty("--ae-firefly-y",`${-65+t()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(38,e,1)}},Un={definition:re({id:"confetti",name:"Confetti",description:"Kolorowe konfetti opadajÄ…ce przez ekran.",category:"other",tags:["confetti","party","celebration","color"],defaultSettings:{...ae,opacity:90,density:58,speed:80},performanceCost:2,requiresJavaScript:!0}),css:jn,streamElementsRendererName:"aeRenderConfetti",renderPreview(e,a,t){const n=["#ff4f9a","#ffe45c","#65e6ff","#7dff86","#b780ff","#ff8a42"],i=G(55,a),s=Math.max(.1,a.speed/100);for(let r=0;r<i;r++){const o=document.createElement("span");o.className="ae-confetti",o.style.left=`${t()*100}%`,o.style.width=`${5+t()*8}px`,o.style.height=`${9+t()*13}px`,o.style.background=n[Math.floor(t()*n.length)]??"#ff4f9a",o.style.animationDelay=`${-t()*8}s`,o.style.animationDuration=`${(5+t()*7)/s}s`,o.style.setProperty("--ae-confetti-drift",`${-85+t()*170}px`),o.style.setProperty("--ae-confetti-rot",`${420+t()*720}deg`),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(55,e)}},Gn={definition:re({id:"dust-motes",name:"Dust Motes",description:"Subtelny kurz unoszÄ…cy siÄ™ w Ĺ›wietle.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],defaultSettings:{...ae,opacity:55,density:48,speed:38,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:Dn,streamElementsRendererName:"aeRenderDustMotes",renderPreview(e,a,t){const n=G(48,a),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-dust-mote";const o=1+t()*4;r.style.left=`${t()*100}%`,r.style.top=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-t()*13}s`,r.style.animationDuration=`${(9+t()*10)/i}s`,r.style.setProperty("--ae-mote-x",`${-55+t()*110}px`),r.style.setProperty("--ae-mote-y",`${-55+t()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(48,e)}},Yn={definition:re({id:"aurora",name:"Aurora",description:"MiÄ™kkie, kolorowe pasma zorzy polarnej.",category:"cosmic",tags:["aurora","cosmic","sky","glow"],defaultSettings:{...ae,opacity:72,density:55,speed:42,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:In,streamElementsRendererName:"aeRenderAurora",renderPreview(e,a,t){const n=G(5,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-aurora-band",r.style.top=`${5+t()*70}%`,r.style.height=`${18+t()*28}%`,r.style.animationDelay=`${-t()*11}s`,r.style.animationDuration=`${(8+t()*8)/i}s`,r.style.setProperty("--ae-aurora-angle",`${-16+t()*24}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(5,e,1)}},Hn=`
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
`.trim(),Zn=`
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
`.trim(),Jn=`
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
`.trim(),Vn=`
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
`.trim(),Kn=`
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
`.trim(),Qn=`
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
`.trim(),es=`
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
`.trim(),ts=`
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
`.trim(),as=`
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
`.trim(),rs=`
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
`.trim(),ns=`
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
`.trim(),ss=`
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
`.trim(),is={definition:re({id:"hologram-scan",name:"Hologram Scan",description:"Cyanowe pasma skanujace przesuwajace sie po ekranie.",category:"sci-fi",tags:["hologram","scan","sci-fi","cyan"],defaultSettings:{...ae,opacity:68,density:45,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Hn,streamElementsRendererName:"aeRenderHologramScan",renderPreview(e,a,t){const n=G(7,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-hologram-scan",r.style.top=`${-20+t()*30}%`,r.style.setProperty("--ae-holo-height",`${1+t()*5}%`),r.style.setProperty("--ae-holo-duration",`${(4+t()*4)/i}s`),r.style.animationDelay=`${-t()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(7,e,1)}},os={definition:re({id:"glitch-blocks",name:"Glitch Blocks",description:"Cyfrowe prostokaty pojawiajace sie w losowych miejscach.",category:"tech",tags:["glitch","blocks","digital","tech"],defaultSettings:{...ae,opacity:62,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Zn,streamElementsRendererName:"aeRenderGlitchBlocks",renderPreview(e,a,t){const n=G(26,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-glitch-block",r.style.left=`${t()*94}%`,r.style.top=`${t()*94}%`,r.style.width=`${18+t()*150}px`,r.style.height=`${3+t()*28}px`;const o=-45+t()*90;r.style.setProperty("--ae-glitch-x",`${o}px`),r.style.setProperty("--ae-glitch-x2",`${-o*.5}px`),r.style.animationDuration=`${(.8+t()*3.2)/i}s`,r.style.animationDelay=`${-t()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(26,e,1)}},cs={definition:re({id:"hex-grid",name:"Hex Grid",description:"Techniczna siatka szesciokatow przesuwajaca sie w tle.",category:"sci-fi",tags:["hex","grid","sci-fi","hud"],defaultSettings:{...ae,opacity:48,density:50,speed:45,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:Jn,streamElementsRendererName:"aeRenderHexGrid",renderPreview(e,a){const t=document.createElement("span");t.className="ae-hex-grid";const n=Math.max(34,96-a.density*.55);t.style.setProperty("--ae-hex-w",`${n}px`),t.style.setProperty("--ae-hex-h",`${n*1.73}px`),t.style.setProperty("--ae-hex-half",`${n*.5}px`),t.style.setProperty("--ae-hex-half-y",`${n*.865}px`),t.style.setProperty("--ae-hex-x2",`${n*1.5}px`),t.style.setProperty("--ae-hex-y2",`${n*2.595}px`),t.style.setProperty("--ae-hex-duration",`${14/Math.max(.1,a.speed/100)}s`),e.appendChild(t)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},ls={definition:re({id:"portal-rings",name:"Portal Rings",description:"Koncentryczne neonowe pierscienie magicznego portalu.",category:"fantasy",tags:["portal","rings","magic","fantasy"],defaultSettings:{...ae,opacity:78,density:60,speed:65,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Vn,streamElementsRendererName:"aeRenderPortalRings",renderPreview(e,a,t){const n=G(7,a,2),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-portal-ring";const o=110+s*42+t()*18;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-portal-duration",`${(7+t()*8)/i}s`),r.style.animationDirection=s%2===0?"normal":"reverse",r.style.animationDelay=`${-t()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(7,e,2)}},ds={definition:re({id:"magic-circle",name:"Magic Circle",description:"Obracajace sie okregi i segmenty magicznego sigilu.",category:"fantasy",tags:["magic","circle","sigil","fantasy"],defaultSettings:{...ae,opacity:72,density:55,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Kn,streamElementsRendererName:"aeRenderMagicCircle",renderPreview(e,a,t){const n=G(5,a,2),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-magic-circle";const o=150+s*48+t()*22;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-circle-duration",`${(11+t()*10)/i}s`),r.style.animationDirection=s%2===0?"normal":"reverse",e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(5,e,2)}},ps={definition:re({id:"crystal-shards",name:"Crystal Shards",description:"Lekkie, swiecace odlamki krysztalow unoszace sie w przestrzeni.",category:"fantasy",tags:["crystal","shards","fantasy","glow"],defaultSettings:{...ae,opacity:70,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Qn,streamElementsRendererName:"aeRenderCrystalShards",renderPreview(e,a,t){const n=G(24,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-crystal-shard";const o=6+t()*18,l=o*(1.8+t());r.style.left=`${t()*96}%`,r.style.top=`${t()*94}%`,r.style.width=`${o}px`,r.style.height=`${l}px`,r.style.setProperty("--ae-crystal-x",`${-48+t()*96}px`),r.style.setProperty("--ae-crystal-duration",`${(8+t()*10)/i}s`),r.style.animationDelay=`${-t()*12}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(24,e,1)}},us={definition:re({id:"steam-vents",name:"Steam Vents",description:"Kleby pary unoszace sie od dolnej krawedzi.",category:"steampunk",tags:["steam","vents","steampunk","smoke"],defaultSettings:{...ae,opacity:55,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:es,streamElementsRendererName:"aeRenderSteamVents",renderPreview(e,a,t){const n=G(16,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-steam-puff";const o=55+t()*120;r.style.left=`${t()*94}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-steam-x",`${-65+t()*130}px`),r.style.setProperty("--ae-steam-duration",`${(7+t()*8)/i}s`),r.style.animationDelay=`${-t()*10}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(16,e,1)}},fs={definition:re({id:"gears",name:"Gears",description:"Obracajace sie mosiezne kola zebate w stylu steampunk.",category:"steampunk",tags:["gears","cogs","steampunk","mechanical"],defaultSettings:{...ae,opacity:62,density:45,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ts,streamElementsRendererName:"aeRenderGears",renderPreview(e,a,t){const n=G(9,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-gear";const o=45+t()*130;r.style.left=`${t()*88}%`,r.style.top=`${t()*84}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-gear-duration",`${(8+t()*16)/i}s`),r.style.setProperty("--ae-gear-rot",s%2===0?"360deg":"-360deg"),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(9,e,1)}},ys={definition:re({id:"city-lights",name:"City Lights",description:"Migoczace swiatla nocnego miasta.",category:"urban",tags:["city","lights","urban","night"],defaultSettings:{...ae,opacity:72,density:65,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:as,streamElementsRendererName:"aeRenderCityLights",renderPreview(e,a,t){const n=G(48,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-city-light",r.style.left=`${t()*98}%`,r.style.top=`${45+t()*52}%`,r.style.width=`${2+t()*7}px`,r.style.height=`${2+t()*10}px`,r.style.setProperty("--ae-city-duration",`${(2+t()*6)/i}s`),r.style.animationDelay=`${-t()*7}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(48,e,1)}},ms={definition:re({id:"traffic-trails",name:"Traffic Trails",description:"Smugi swiatel samochodow przecinajace dol ekranu.",category:"urban",tags:["traffic","trails","urban","lights"],defaultSettings:{...ae,opacity:72,density:50,speed:90,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:rs,streamElementsRendererName:"aeRenderTrafficTrails",renderPreview(e,a,t){const n=G(14,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-traffic-trail",r.style.top=`${55+t()*40}%`,r.style.setProperty("--ae-trail-width",`${12+t()*28}%`),r.style.setProperty("--ae-traffic-duration",`${(3+t()*5)/i}s`),r.style.animationDelay=`${-t()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(14,e,1)}},hs={definition:re({id:"vhs-static",name:"VHS Static",description:"Pasiaste zaklocenia i analogowe przeskoki obrazu.",category:"retro",tags:["vhs","static","retro","glitch"],defaultSettings:{...ae,opacity:48,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ns,streamElementsRendererName:"aeRenderVhsStatic",renderPreview(e,a,t){const n=G(12,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-vhs-band",r.style.top=`${t()*96}%`,r.style.height=`${2+t()*18}px`,r.style.setProperty("--ae-vhs-duration",`${(.8+t()*3)/i}s`),r.style.animationDelay=`${-t()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(12,e,1)}},gs={definition:re({id:"solar-flare",name:"Solar Flare",description:"Pomarańczowe luki i rozblyski przypominajace protuberancje sloneczne.",category:"solar",tags:["solar","flare","sun","energy"],defaultSettings:{...ae,opacity:70,density:50,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ss,streamElementsRendererName:"aeRenderSolarFlare",renderPreview(e,a,t){const n=G(11,a,1),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-solar-flare";const o=55+t()*150;r.style.left=`${t()*92}%`,r.style.top=`${t()*88}%`,r.style.width=`${o}px`,r.style.height=`${o*(.45+t()*.45)}px`,r.style.setProperty("--ae-solar-duration",`${(6+t()*8)/i}s`),r.style.animationDelay=`${-t()*9}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(11,e,1)}},bs=`
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
`.trim(),ws=`
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
`.trim(),ks=`
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
`.trim(),xs=`
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
`.trim(),vs=`
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
`.trim(),zs=`
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
`.trim(),Ss=`
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
`.trim(),Ps=`
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
`.trim(),Cs={definition:re({id:"scanlines-plus",name:"Scanlines Plus",description:"Ruchome, swietlne linie przypominajace skanowanie obrazu.",category:"tech",tags:["scanlines","screen","tech","scanner"],defaultSettings:{...ae,opacity:58,density:52,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:bs,streamElementsRendererName:"aeRenderScanlinesPlus",renderPreview(e,a,t){const n=G(12,a,3),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-scanline-plus",r.style.top=`${t()*100}%`,r.style.setProperty("--ae-scanline-h",`${1+t()*3}px`),r.style.setProperty("--ae-scanline-duration",`${(2.4+t()*3.8)/i}s`),r.style.animationDelay=`${-t()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(12,e,3)}},Ms={definition:re({id:"equalizer-bars",name:"Equalizer Bars",description:"Pulsujace slupki jak w wizualizerze audio.",category:"tech",tags:["audio","equalizer","bars","music"],defaultSettings:{...ae,opacity:76,density:62,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ws,streamElementsRendererName:"aeRenderEqualizerBars",renderPreview(e,a,t){const n=G(22,a,6),i=Math.max(.1,a.speed/100),s=100/n;for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-eq-bar",o.style.left=`${r*s+s*.18}%`,o.style.width=`${Math.max(1.2,s*.64)}%`,o.style.height=`${18+t()*70}%`,o.style.setProperty("--ae-eq-duration",`${(.5+t()*1.4)/i}s`),o.style.animationDelay=`${-t()*2}s`,e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(22,e,6)}},Es={definition:re({id:"hud-grid",name:"HUD Grid",description:"Taktyczna siatka i delikatna warstwa interfejsu.",category:"tech",tags:["hud","grid","ui","tech"],defaultSettings:{...ae,opacity:48,density:60,speed:70,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:ks,streamElementsRendererName:"aeRenderHudGrid",renderPreview(e,a){const t=document.createElement("span");t.className="ae-hud-grid";const n=26+(140-Math.max(20,a.density))/2.2,i=Math.max(.1,a.speed/100);t.style.setProperty("--ae-grid-step",`${n}px`),t.style.setProperty("--ae-grid-duration",`${12/i}s`),e.appendChild(t)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},_s={definition:re({id:"floating-symbols",name:"Floating Symbols",description:"Magiczne symbole unoszace sie ku gorze.",category:"fantasy",tags:["symbols","magic","fantasy","arcane"],defaultSettings:{...ae,opacity:72,density:54,speed:78,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:xs,streamElementsRendererName:"aeRenderFloatingSymbols",renderPreview(e,a,t){const n=["✦","✧","✶","✺","❖","☽","☼"],i=G(18,a,4),s=Math.max(.1,a.speed/100);for(let r=0;r<i;r++){const o=document.createElement("span");o.className="ae-floating-symbol",o.textContent=n[Math.floor(t()*n.length)]??"✦",o.style.left=`${t()*100}%`,o.style.fontSize=`${18+t()*34}px`,o.style.setProperty("--ae-symbol-duration",`${(6+t()*8)/s}s`),o.style.animationDelay=`${-t()*8}s`,e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(18,e,4)}},$s={definition:re({id:"smoke-wisps",name:"Smoke Wisps",description:"Miekkie smugi dymu unoszace sie na ekranie.",category:"cinematic",tags:["smoke","fog","mist","cinematic"],defaultSettings:{...ae,opacity:50,density:48,speed:68,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:vs,streamElementsRendererName:"aeRenderSmokeWisps",renderPreview(e,a,t){const n=G(14,a,3),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-smoke-wisp";const o=70+t()*120;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o*(.65+t()*.3)}px`,r.style.setProperty("--ae-smoke-duration",`${(6+t()*7)/i}s`),r.style.animationDelay=`${-t()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(14,e,3)}},Rs={definition:re({id:"electric-arcs",name:"Electric Arcs",description:"Migajace luki energii i wyadowania elektryczne.",category:"energy",tags:["electric","arcs","energy","lightning"],defaultSettings:{...ae,opacity:82,density:55,speed:110,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:zs,streamElementsRendererName:"aeRenderElectricArcs",renderPreview(e,a,t){const n=G(12,a,3),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-electric-arc",r.style.left=`${t()*86}%`,r.style.top=`${t()*86}%`,r.style.width=`${70+t()*180}px`,r.style.setProperty("--ae-arc-angle",`${(-40+t()*80).toFixed(2)}deg`),r.style.setProperty("--ae-arc-duration",`${(.8+t()*1.8)/i}s`),r.style.animationDelay=`${-t()*3}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(12,e,3)}},js={definition:re({id:"snow-burst",name:"Snow Burst",description:"Gestszy, bardziej dekoracyjny opad sniegu.",category:"weather",tags:["snow","winter","cold","flakes"],defaultSettings:{...ae,opacity:72,density:68,speed:72,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ss,streamElementsRendererName:"aeRenderSnowBurst",renderPreview(e,a,t){const n=G(36,a,8),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-snow-burst";const o=4+t()*10;r.style.left=`${t()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-snow-duration",`${(4.8+t()*6.2)/i}s`),r.style.animationDelay=`${-t()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(36,e,8)}},Ds={definition:re({id:"meteor-shower",name:"Meteor Shower",description:"Ukozne smugi meteorow przecinajace ekran.",category:"cosmic",tags:["meteor","space","streak","comet"],defaultSettings:{...ae,opacity:78,density:42,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ps,streamElementsRendererName:"aeRenderMeteorShower",renderPreview(e,a,t){const n=G(14,a,3),i=Math.max(.1,a.speed/100);for(let s=0;s<n;s++){const r=document.createElement("span");r.className="ae-meteor",r.style.left=`${-12+t()*78}%`,r.style.top=`${-18+t()*24}%`,r.style.setProperty("--ae-meteor-size",`${70+t()*180}px`),r.style.setProperty("--ae-meteor-duration",`${(1.8+t()*3)/i}s`),r.style.animationDelay=`${-t()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return G(14,e,3)}},Is=[Vr,Kr,Qr,en,tn,an,rn,nn,sn,mn,hn,gn,bn,wn,kn,xn,vn,Nn,An,Ln,Bn,On,Tn,qn,Wn,Xn,Un,Gn,Yn,is,os,cs,ls,ds,ps,us,fs,ys,ms,hs,gs,Cs,Ms,Es,_s,$s,Rs,js,Ds],Ns={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},As={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Ls=[{id:"wireframe-cube",name:"Wireframe Cube",description:"Pseudo-3D wireframe cubes rotating through the scene.",category:"tech",tags:["cube","3d","wireframe","geometry","cyber"],kind:"box",count:9,cost:2,opacity:72,density:55,speed:80,intensity:75},{id:"polyhedron",name:"Polyhedron",description:"Luminous polygon forms with pseudo-depth.",category:"abstract",tags:["polyhedron","polygon","3d","geometry"],kind:"box",count:12,cost:2,opacity:72,density:58,speed:70,intensity:70},{id:"orbiting-core",name:"Orbiting Core",description:"Energy cores with orbit-like rings.",category:"energy",tags:["orbit","core","energy","atom"],kind:"ring",count:8,cost:2,opacity:82,density:48,speed:90,intensity:80},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspective neon frames flying toward the viewer.",category:"retro",tags:["tunnel","neon","synthwave","perspective"],kind:"box",count:18,cost:2,opacity:74,density:70,speed:110,intensity:85},{id:"fractal-rings",name:"Fractal Rings",description:"Nested luminous rings create recursive motion.",category:"abstract",tags:["rings","fractal","recursive","geometry"],kind:"ring",count:16,cost:2,opacity:70,density:66,speed:75,intensity:75},{id:"particle-vortex",name:"Particle Vortex",description:"Particles spiral around a dynamic center.",category:"energy",tags:["vortex","particles","spiral","energy"],kind:"dot",count:58,cost:3,opacity:78,density:62,speed:105,intensity:85},{id:"liquid-blobs",name:"Liquid Blobs",description:"Organic glowing blobs with fluid deformation.",category:"abstract",tags:["liquid","blob","organic","fluid"],kind:"blob",count:15,cost:3,opacity:62,density:52,speed:55,intensity:80},{id:"cell-division",name:"Cell Division",description:"Seeded cells pulse and visually split into colonies.",category:"other",tags:["cell","biology","division","evolution"],kind:"cell",count:32,cost:3,opacity:72,density:58,speed:75,intensity:85},{id:"growing-vines",name:"Growing Vines",description:"Procedural-looking luminous branches grow across the frame.",category:"botanical",tags:["vine","plant","growth","branch"],kind:"line",count:28,cost:3,opacity:72,density:55,speed:65,intensity:85},{id:"constellation-network",name:"Constellation Network",description:"Glowing nodes connected by constellation-like links.",category:"cosmic",tags:["constellation","network","stars","nodes"],kind:"dot",count:40,cost:3,opacity:64,density:58,speed:45,intensity:70},{id:"shockwave-bursts",name:"Shockwave Bursts",description:"Seeded shockwave circles expand through the scene.",category:"energy",tags:["shockwave","burst","pulse","impact"],kind:"ring",count:14,cost:2,opacity:76,density:48,speed:95,intensity:90},{id:"data-nodes",name:"Data Nodes",description:"Technical nodes pulse along short data links.",category:"sci-fi",tags:["data","nodes","hud","network"],kind:"line",count:34,cost:2,opacity:68,density:60,speed:80,intensity:72},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Seeded stars rotate in a wide spiral galaxy.",category:"cosmic",tags:["galaxy","spiral","stars","space"],kind:"dot",count:80,cost:3,opacity:78,density:66,speed:55,intensity:88},{id:"recursive-squares",name:"Recursive Squares",description:"Nested squares create an infinite-zoom illusion.",category:"abstract",tags:["recursive","squares","infinite","zoom"],kind:"box",count:22,cost:2,opacity:72,density:72,speed:75,intensity:88},{id:"dna-helix",name:"DNA Helix",description:"A pseudo-3D double helix made from luminous nodes.",category:"sci-fi",tags:["dna","helix","science","biology"],kind:"helix",count:42,cost:2,opacity:76,density:68,speed:70,intensity:78},{id:"floating-cubes",name:"Floating Cubes",description:"A field of luminous pseudo-3D cubes drifting in space.",category:"tech",tags:["cube","3d","floating","geometry"],kind:"box",count:24,cost:3,opacity:68,density:58,speed:60,intensity:74}],Bs=`
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
`.trim();function ua(e,a){return Math.max(1,Math.round(e.count*a.density/100))}function Os(e){return"aeRenderPack06"+e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("")}function Ts(e,a,t,n,i){const s=Math.max(.1,t.speed/100);e.className=`ae-p06-node ae-p06-${i}`,e.style.setProperty("--i",String(a)),e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",i==="helix"?`${5+a%42*2.15}%`:`${n()*100}%`),e.style.setProperty("--size",`${12+n()*70}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--duration",`${(2.8+n()*7)/s}s`),e.style.setProperty("--power",String(t.intensity/100))}function Fs(e,a){return`
function ${a}(effect, root) {
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
`.trim()}function qs(e){const a=Os(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Ns,opacity:e.opacity,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:As,performanceCost:e.cost,requiresJavaScript:!0},css:Bs,streamElementsRendererName:a,renderPreview(t,n,i){const s=ua(e,n);for(let r=0;r<s;r++){const o=document.createElement("span");Ts(o,r,n,i,e.kind),t.appendChild(o)}},streamElementsRendererSource:Fs(e,a),estimateDomNodes(t){return ua(e,t)}}}const Ws=Ls.map(qs),Xs={opacity:76,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:65,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:85},Us={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Gs=[{id:"fireworks",name:"Fireworks",description:"Promieniste wybuchy fajerwerków do zwycięstw i celebracji.",category:"cinematic",tags:["fireworks","celebration","victory","sparks"],kind:"fireworks",count:10,cost:3},{id:"radar-sweep",name:"Radar Sweep",description:"Obracające się skanery radarowe z technicznym glow.",category:"tech",tags:["radar","scanner","hud","tactical"],kind:"radar",count:4,cost:2},{id:"warp-speed",name:"Warp Speed",description:"Gwiezdne smugi rozchodzące się od centrum jak skok w nadprzestrzeń.",category:"cosmic",tags:["warp","hyperspace","stars","speed"],kind:"warp",count:70,cost:3},{id:"hex-pulse",name:"Hex Pulse",description:"Pulsująca siatka heksagonalnych pól energii.",category:"sci-fi",tags:["hex","grid","pulse","shield"],kind:"hex",count:42,cost:2},{id:"circuit-traces",name:"Circuit Traces",description:"Świecące ścieżki obwodów z przesuwającymi się impulsami.",category:"tech",tags:["circuit","pcb","data","lines"],kind:"circuit",count:34,cost:2},{id:"light-leaks",name:"Light Leaks",description:"Miękkie filmowe rozbłyski i przecieki światła.",category:"cinematic",tags:["light","leak","lens","film","glow"],kind:"leaks",count:8,cost:2},{id:"gravity-well",name:"Gravity Well",description:"Cząstki zasysane po orbitach do jasnego centrum.",category:"cosmic",tags:["gravity","black hole","orbit","vortex"],kind:"gravity",count:56,cost:3},{id:"pixel-storm",name:"Pixel Storm",description:"Cyfrowa burza pikseli przecinająca scenę po skosie.",category:"retro",tags:["pixel","storm","digital","glitch"],kind:"pixels",count:62,cost:3}],Ys=`
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
`.trim();function Ta(e,a){return Math.max(1,Math.round(e.count*a.density/100))}function Fa(e){return"aeRenderPolish02"+e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("")}function qa(e){return`ae-x2 ae-x2-${e}`}function Hs(e,a,t,n){const i=Ta(e,t),s=Math.max(.1,t.speed/100);for(let r=0;r<i;r++){const o=document.createElement("span");if(o.className=qa(e.kind),o.style.setProperty("--x",`${n()*100}%`),o.style.setProperty("--y",`${n()*100}%`),o.style.setProperty("--s",`${14+n()*82}px`),o.style.setProperty("--a",`${n()*360}deg`),o.style.setProperty("--p",String(t.intensity/100)),o.style.setProperty("--delay",`${-n()*8}s`),o.style.setProperty("--d",`${(2.5+n()*7)/s}s`),o.style.setProperty("--r",`${55+n()*350}px`),e.kind==="hex"){const l=r%8,m=Math.floor(r/8);o.style.setProperty("--x",`${8+l*12.2+m%2*6.1}%`),o.style.setProperty("--y",`${10+m*14.2}%`),o.style.setProperty("--s",`${32+t.intensity*.12}px`)}e.kind==="circuit"&&(o.style.setProperty("--s",`${60+n()*175}px`),o.style.setProperty("--a",`${Math.round(n()*3)*90}deg`)),e.kind==="leaks"&&o.style.setProperty("--s",`${90+n()*160}px`),e.kind==="pixels"&&(o.style.setProperty("--s",`${3+n()*12}px`),o.style.setProperty("--x",`${-12+n()*45}%`),o.style.setProperty("--y",`${-18+n()*78}%`)),e.kind==="radar"&&o.style.setProperty("--s",`${180+n()*320}px`),a.appendChild(o)}}function Zs(e){return`
function ${Fa(e.id)}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const speed = Math.max(.1, s.speed / 100);
  const total = Math.max(1, Math.round(${e.count} * (s.density / 100)));

  for (let i = 0; i < total; i++) {
    const node = document.createElement("span");
    node.className = ${JSON.stringify(qa(e.kind))};
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
`.trim()}function Js(e){return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Xs},capabilities:Us,performanceCost:e.cost,requiresJavaScript:!0},css:Ys,streamElementsRendererName:Fa(e.id),renderPreview(a,t,n){Hs(e,a,t,n)},streamElementsRendererSource:Zs(e),estimateDomNodes(a){return Ta(e,a)}}}const Vs=Gs.map(Js),Te={opacity:84,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},Ks={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Qs=[{id:"gears",name:"Gears",description:"Steampunkowe koła zębate z czytelniejszymi zębami i kontr-rotacją.",category:"steampunk",tags:["gear","cogs","steampunk","mechanical"],kind:"gear",count:10,cost:2,opacity:80,density:70,speed:90,intensity:90,brightness:118},{id:"comets",name:"Comets",description:"Jasne komety z długim ogonem lecące po przekątnej.",category:"cosmic",tags:["comet","tail","space","shooting star"],kind:"comet",count:22,cost:2,opacity:88,density:72,speed:110,intensity:105,brightness:132},{id:"fireworks",name:"Fireworks",description:"Pełniejsze wybuchy fajerwerków z wieloma promieniami.",category:"cinematic",tags:["fireworks","spark","celebration","burst"],kind:"firework",count:12,cost:3,opacity:88,density:66,speed:95,intensity:110,brightness:135},{id:"lightning-storm",name:"Lightning Storm",description:"Błyskawice z mocniejszym rozgałęzieniem i flashami.",category:"weather",tags:["lightning","storm","electric","thunder"],kind:"lightning",count:14,cost:3,opacity:88,density:62,speed:108,intensity:118,brightness:138},{id:"liquid-blobs",name:"Liquid Blobs",description:"Bardziej organiczne, płynne metaballe o miękkim ruchu.",category:"abstract",tags:["liquid","blob","metaball","organic"],kind:"blob",count:16,cost:3,opacity:76,density:70,speed:70,intensity:115,brightness:120},{id:"particle-vortex",name:"Particle Vortex",description:"Głębszy wir cząstek z mocniejszą spiralą i środkiem zasysania.",category:"energy",tags:["vortex","spiral","particles","swirl"],kind:"vortex",count:96,cost:3,opacity:82,density:80,speed:110,intensity:120,brightness:130},{id:"portal-rings",name:"Portal Rings",description:"Pulsujące portalowe pierścienie z falowaniem i poświatą.",category:"sci-fi",tags:["portal","rings","gateway","pulse"],kind:"portal",count:8,cost:2,opacity:82,density:72,speed:92,intensity:112,brightness:128},{id:"radar-sweep",name:"Radar Sweep",description:"Czytelny radar ze stożkiem skanu i pingami kontaktów.",category:"tech",tags:["radar","scan","hud","sweep"],kind:"radar",count:4,cost:2,opacity:82,density:60,speed:86,intensity:96,brightness:125},{id:"glitch-blocks",name:"Glitch Blocks",description:"Mocniej zróżnicowane bloki glitch z przesunięciami RGB.",category:"tech",tags:["glitch","blocks","digital","noise"],kind:"glitch",count:34,cost:2,opacity:72,density:78,speed:112,intensity:112,brightness:122},{id:"gravity-well",name:"Gravity Well",description:"Lejek grawitacyjny z orbitującym pyłem i jasnym rdzeniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:80,cost:3,opacity:82,density:76,speed:96,intensity:118,brightness:130},{id:"hex-grid",name:"Hex Grid",description:"Gęstsza siatka sześciokątów z pulsem i zanikaniem.",category:"sci-fi",tags:["hex","grid","honeycomb","hud"],kind:"hex",count:84,cost:2,opacity:68,density:76,speed:72,intensity:100,brightness:118},{id:"floating-cubes",name:"Floating Cubes",description:"Bardziej przestrzenne sześciany z lekką pseudo-głębią.",category:"tech",tags:["cube","floating","3d","geometry"],kind:"cube",count:32,cost:3,opacity:76,density:76,speed:68,intensity:98,brightness:118},{id:"prism-drift",name:"Prism Drift",description:"Lśniące pryzmaty dryfujące przez scenę.",category:"abstract",tags:["prism","crystal","glass","drift"],kind:"prism",count:26,cost:2,opacity:78,density:72,speed:70,intensity:102,brightness:126},{id:"neon-shards",name:"Neon Shards",description:"Neonowe odłamki z szybkim dryfem i smugą.",category:"retro",tags:["shards","neon","fragments","synthwave"],kind:"shards",count:42,cost:2,opacity:78,density:80,speed:118,intensity:110,brightness:132},{id:"plasma-storm",name:"Plasma Storm",description:"Burza plazmowych smug z turbulentnym ruchem.",category:"energy",tags:["plasma","storm","energy","embers"],kind:"storm",count:54,cost:3,opacity:80,density:82,speed:104,intensity:118,brightness:132},{id:"cube-swarm",name:"Cube Swarm",description:"Rój małych kostek przecinających scenę w warstwach.",category:"tech",tags:["cube","swarm","voxels","digital"],kind:"cube",count:64,cost:3,opacity:72,density:86,speed:98,intensity:108,brightness:115}],ei=String.raw`
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
`.trim();function Jt(e){return Math.max(0,Math.min(400,e))}function fa(e,a){return Math.max(1,Math.round(e.count*Jt(a.density)/100))}function ti(e){return"aeRenderPack07"+e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("")}function ai(e,a,t,n,i){const s=Math.max(.1,t.speed/100),r=Math.max(.2,Jt(t.intensity)/100);e.classList.add("ae-p07",`ae-p07-${i.kind}`),e.style.setProperty("--i",String(a)),e.style.setProperty("--power",String(r)),e.style.setProperty("--duration",`${(2.5+n()*6.5)/s}s`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--size",`${16+n()*92}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--easing",i.kind==="glitch"?"steps(2,end)":"linear")}function ri(e,a,t,n,i){ai(e,a,t,n,i);const s=Math.max(.2,Jt(t.intensity)/100),r=`${30+n()*180*s}px`;switch(i.kind){case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*80}%`),e.style.setProperty("--size",`${48+n()*96}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(180+n()*360)}deg`);break;case"comet":e.style.setProperty("--x",`${-8+n()*88}%`),e.style.setProperty("--y",`${-8+n()*42}%`),e.style.setProperty("--angle",`${18+n()*28}deg`),e.style.setProperty("--tx",`${80+n()*45}vw`),e.style.setProperty("--ty",`${50+n()*35}vh`);break;case"firework":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${10+n()*74}%`);break;case"lightning":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*20}%`),e.style.setProperty("--duration",`${(1.1+n()*2.8)/Math.max(.3,t.speed/100)}s`);break;case"blob":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${64+n()*130}px`);break;case"vortex":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"portal":e.style.setProperty("--x",`${35+n()*30}%`),e.style.setProperty("--y",`${30+n()*40}%`),e.style.setProperty("--size",`${60+n()*120}px`);break;case"radar":e.style.setProperty("--x",`${18+n()*64}%`),e.style.setProperty("--y",`${18+n()*64}%`),e.style.setProperty("--size",`${120+n()*140}px`);break;case"glitch":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"gravity":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"hex":e.style.setProperty("--x",`${4+a%12*8.2}%`),e.style.setProperty("--y",`${8+Math.floor(a/12)*10.2}%`),e.style.setProperty("--size",`${22+n()*28}px`);break;case"cube":e.style.setProperty("--x",`${4+n()*90}%`),e.style.setProperty("--y",`${6+n()*86}%`),e.style.setProperty("--size",`${18+n()*58}px`);break;case"prism":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${30+n()*52}px`);break;case"shards":e.style.setProperty("--x",`${n()*72}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"storm":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`);break}}function ni(e,a){return`
function ${a}(effect, root) {
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
`.trim()}function si(e){const a=ti(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Te,opacity:e.opacity??Te.opacity,density:e.density??Te.density,speed:e.speed??Te.speed,intensity:e.intensity??Te.intensity,brightness:e.brightness??Te.brightness},capabilities:Ks,performanceCost:e.cost,requiresJavaScript:!0},css:ei,streamElementsRendererName:a,renderPreview(t,n,i){const s=fa(e,n);for(let r=0;r<s;r++){const o=document.createElement("span");ri(o,r,n,i,e),t.appendChild(o)}},streamElementsRendererSource:ni(e,a),estimateDomNodes(t){return fa(e,t)}}}const ii=Qs.map(si),oi={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},ci={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},li=[{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Dysk akrecyjny z cząstkami spiralnie wpadającymi do jasnego rdzenia.",category:"cosmic",tags:["black hole","accretion","gravity","singularity","orbit"],kind:"black-hole",count:92,cost:3,density:78,speed:92,intensity:115},{id:"orbital-debris",name:"Orbital Debris",description:"Odłamki krążące po kilku płaszczyznach orbit i głębokościach.",category:"cosmic",tags:["orbit","debris","space","asteroid","satellite"],kind:"debris",count:46,cost:3,density:74,speed:82,intensity:105},{id:"star-tunnel",name:"Star Tunnel",description:"Tunel gwiezdnych smug z mocną perspektywą i ruchem ku kamerze.",category:"cosmic",tags:["stars","tunnel","hyperspace","perspective","warp"],kind:"tunnel",count:86,cost:3,density:76,speed:118,intensity:118},{id:"energy-lattice",name:"Energy Lattice",description:"Pulsująca sieć energetycznych połączeń i węzłów.",category:"sci-fi",tags:["lattice","network","energy","nodes","grid"],kind:"lattice",count:40,cost:3,density:70,speed:78,intensity:102},{id:"target-lock",name:"Target Lock",description:"HUD-owy celownik z pierścieniami, markerami i pulsami namierzania.",category:"tech",tags:["target","lock","hud","reticle","scanner"],kind:"target",count:6,cost:2,density:55,speed:82,intensity:100},{id:"scanner-beams",name:"Scanner Beams",description:"Wielokierunkowe wiązki skanujące scenę z miękką poświatą.",category:"tech",tags:["scanner","beam","laser","scan","hud"],kind:"scanner",count:12,cost:2,density:62,speed:92,intensity:108},{id:"digital-fragments",name:"Digital Fragments",description:"Cyfrowe fragmenty rozpadające się i przeskakujące warstwami.",category:"retro",tags:["digital","fragments","glitch","blocks","data"],kind:"fragments",count:54,cost:3,density:76,speed:110,intensity:108},{id:"pixel-melt",name:"Pixel Melt",description:"Pionowe smugi pikseli spływające jak topiący się cyfrowy obraz.",category:"retro",tags:["pixel","melt","glitch","drip","digital"],kind:"melt",count:62,cost:3,density:78,speed:88,intensity:112},{id:"wireframe-cubes",name:"Wireframe Cubes",description:"Pole czystych drucianych kostek pseudo-3D obracających się w przestrzeni.",category:"tech",tags:["wireframe","cubes","3d","geometry","grid"],kind:"wirecube",count:30,cost:3,density:70,speed:72,intensity:98},{id:"floating-polyhedra",name:"Floating Polyhedra",description:"Dryfujące wielościany o różnych rozmiarach i osi obrotu.",category:"abstract",tags:["polyhedra","geometry","3d","floating","facets"],kind:"poly",count:28,cost:3,density:68,speed:68,intensity:100},{id:"shockwave-rings",name:"Shockwave Rings",description:"Szybkie, warstwowe fale uderzeniowe rozchodzące się z różnych punktów.",category:"energy",tags:["shockwave","rings","impact","pulse","wave"],kind:"shockwave",count:16,cost:2,density:64,speed:112,intensity:115},{id:"electric-web",name:"Electric Web",description:"Sieć krótkich łuków elektrycznych przeskakujących po scenie.",category:"energy",tags:["electric","web","arcs","lightning","network"],kind:"electric",count:34,cost:3,density:72,speed:118,intensity:120},{id:"ribbon-streamers",name:"Ribbon Streamers",description:"Długie kolorowe wstążki płynące falami zamiast drobnych cząstek.",category:"cinematic",tags:["ribbon","streamers","flow","celebration","wave"],kind:"ribbon",count:18,cost:2,density:62,speed:82,intensity:105},{id:"ink-clouds",name:"Ink Clouds",description:"Powolne organiczne chmury przypominające atrament rozlewający się w wodzie.",category:"abstract",tags:["ink","clouds","fluid","organic","smoke"],kind:"ink",count:13,cost:3,density:58,speed:48,intensity:105}],di=String.raw`
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
`.trim();function Wa(e){return Math.max(0,Math.min(400,e))}function pi(e){return"aeRenderPack08"+e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("")}function ya(e,a){return Math.max(1,Math.round(e.count*Wa(a.density)/100))}function ui(e,a,t,n,i){const s=Math.max(.1,t.speed/100),r=Math.max(.2,Wa(t.intensity)/100);e.className=`ae-p08 ae-p08-${i.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${14+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.4+n()*7)/s}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--orbit",`${40+n()*220*r}px`),(i.kind==="black-hole"||i.kind==="debris"||i.kind==="tunnel")&&(e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%")),i.kind==="target"&&(e.style.setProperty("--x",`${24+n()*52}%`),e.style.setProperty("--y",`${20+n()*58}%`),e.style.setProperty("--size",`${24+n()*60}px`)),i.kind==="scanner"&&(e.style.setProperty("--x",`${-12+n()*24}%`),e.style.setProperty("--y",`${n()*94}%`),e.style.setProperty("--angle",`${-8+n()*16}deg`)),i.kind==="melt"&&(e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${-18+n()*8}%`)),(i.kind==="wirecube"||i.kind==="poly")&&(e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${7+n()*86}%`),e.style.setProperty("--size",`${22+n()*64}px`)),i.kind==="shockwave"&&(e.style.setProperty("--x",`${14+n()*72}%`),e.style.setProperty("--y",`${14+n()*72}%`),e.style.setProperty("--size",`${28+n()*62}px`)),i.kind==="electric"&&(e.style.setProperty("--x",`${4+n()*84}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--duration",`${(.8+n()*2.7)/s}s`)),i.kind==="ribbon"&&(e.style.setProperty("--x",`${-18+n()*18}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--angle",`${-7+n()*14}deg`)),i.kind==="ink"&&(e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${55+n()*120}px`)),i.kind==="lattice"&&e.style.setProperty("--angle",`${Math.round(n()*5)*30}deg`),i.kind==="fragments"&&e.style.setProperty("--duration",`${(.7+n()*2.4)/s}s`),e.style.setProperty("--i",String(a))}function fi(e,a){return`
function ${a}(effect, root) {
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
`.trim()}function yi(e){const a=pi(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...oi,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:ci,performanceCost:e.cost,requiresJavaScript:!0},css:di,streamElementsRendererName:a,renderPreview(t,n,i){const s=ya(e,n);for(let r=0;r<s;r++){const o=document.createElement("span");ui(o,r,n,i,e),t.appendChild(o)}},streamElementsRendererSource:fi(e,a),estimateDomNodes(t){return ya(e,t)}}}const mi=li.map(yi),X=(e,a,t,n=100,i=0,s=200,r=1)=>({key:e,label:a,description:t,defaultValue:n,min:i,max:s,step:r,suffix:"%"}),hi=[{id:"fireworks",name:"Fireworks",description:"Wielofazowe fajerwerki: lot, eksplozja, radialne iskry i opadanie.",category:"cinematic",tags:["fireworks","burst","sparks","celebration"],kind:"burst",count:12,cost:4,controls:[X("burstSize","Rozmiar eksplozji","Jak szeroko rozchodzą się iskry."),X("trailLength","Długość iskier","Długość radialnych smug po wybuchu."),X("cadence","Częstotliwość","Jak często pojawiają się kolejne wybuchy.")]},{id:"lightning",name:"Lightning",description:"Duże łamane pioruny z odnogami, błyskiem i krótkim afterglow.",category:"weather",tags:["lightning","bolt","storm","electric"],kind:"bolt",count:8,cost:4,controls:[X("branching","Rozgałęzienie","Ilość i długość bocznych odnóg."),X("boltLength","Długość pioruna","Jak dużą część kadru przecina wyładowanie."),X("flash","Siła błysku","Moc poświaty i impulsu świetlnego.")]},{id:"lightning-storm",name:"Lightning Storm",description:"Burza wielu dużych wyładowań o różnej długości i częstotliwości.",category:"weather",tags:["lightning","storm","thunder","electric"],kind:"storm-bolt",count:14,cost:5,controls:[X("branching","Rozgałęzienie","Gęstość bocznych odnóg wyładowań."),X("stormSpread","Zasięg burzy","Jak szeroko po ekranie pojawiają się wyładowania."),X("flash","Siła błysku","Moc krótkich impulsów świetlnych.")]},{id:"gears",name:"Gears",description:"Czytelne koła zębate z piastą, zębami i kontr-rotacją.",category:"steampunk",tags:["gears","cogs","mechanical","steampunk"],kind:"gear",count:11,cost:3,controls:[X("teeth","Liczba zębów","Wrażenie drobniejszych lub masywniejszych zębów."),X("spacing","Rozstaw","Odległość między kołami."),X("mechanicalChaos","Chaos mechanizmu","Różnica rozmiarów i prędkości obrotu.")]},{id:"liquid-blobs",name:"Liquid Blobs",description:"Płynne organiczne metaballe, które rozciągają się i wizualnie łączą.",category:"abstract",tags:["liquid","metaball","goo","organic"],kind:"liquid",count:18,cost:4,controls:[X("viscosity","Lepkość","Jak wolno i ciężko poruszają się kształty."),X("blobSize","Rozmiar blobów","Średni rozmiar płynnych form."),X("merge","Łączenie","Jak mocno formy wizualnie stapiają się ze sobą.")]},{id:"gravity-well",name:"Gravity Well",description:"Czytelna studnia grawitacyjna z ciemnym rdzeniem i spiralnym zasysaniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:90,cost:4,controls:[X("pull","Siła zasysania","Jak gwałtownie cząstki skręcają do środka."),X("orbitSpread","Promień orbit","Rozpiętość spiral wokół centrum."),X("coreSize","Wielkość rdzenia","Rozmiar ciemnego centrum studni.")]},{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Czarna dziura z jasnym spłaszczonym dyskiem akrecyjnym i pyłem.",category:"cosmic",tags:["black hole","accretion","singularity","disk"],kind:"black-hole",count:104,cost:5,controls:[X("discWidth","Szerokość dysku","Rozpiętość dysku akrecyjnego."),X("pull","Siła zasysania","Tempo opadania cząstek do centrum."),X("glow","Blask dysku","Jasność i poświata gorącego materiału.")]},{id:"electric-web",name:"Electric Web",description:"Sieć punktów połączonych przeskakującymi łukami elektrycznymi.",category:"energy",tags:["electric","web","nodes","arcs"],kind:"web",count:34,cost:4,controls:[X("connections","Połączenia","Gęstość elektrycznej sieci."),X("reach","Zasięg łuków","Długość przeskoków między punktami."),X("jitter","Niestabilność","Jak agresywnie łuki migoczą i przeskakują.")]},{id:"electric-arcs",name:"Electric Arcs",description:"Długie łamane łuki elektryczne z nieregularnym migotaniem.",category:"energy",tags:["electric","arcs","plasma","voltage"],kind:"arc",count:24,cost:4,controls:[X("arcLength","Długość łuków","Długość pojedynczych wyładowań."),X("jitter","Poszarpanie","Stopień nieregularności kształtu."),X("pulse","Pulsowanie","Częstotliwość zaników i ponownych zapłonów.")]},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Wyraźna galaktyka spiralna z ramionami i jasnym centrum.",category:"cosmic",tags:["galaxy","spiral","stars","cosmic"],kind:"galaxy",count:150,cost:4,controls:[X("armTightness","Skręt ramion","Jak ciasno ramiona owijają się wokół centrum."),X("coreGlow","Jasność jądra","Siła centralnej poświaty."),X("armSpread","Rozpiętość","Jak szeroko rozchodzą się ramiona galaktyki.")]},{id:"growing-vines",name:"Growing Vines",description:"Pnącza wyrastające z punktów, skręcające i tworzące odnogi.",category:"botanical",tags:["vines","plants","growth","branches"],kind:"vine",count:22,cost:3,controls:[X("curl","Skręt pnączy","Jak mocno łodygi wiją się podczas wzrostu."),X("branches","Rozgałęzienia","Ilość bocznych odnóg."),X("growth","Tempo wzrostu","Długość i szybkość rozwijania się pnączy.")]},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspektywiczny tunel neonowych ramek z wyraźnym punktem zbiegu.",category:"retro",tags:["neon","tunnel","perspective","synthwave"],kind:"tunnel",count:24,cost:3,controls:[X("depth","Głębia tunelu","Jak mocna jest perspektywa i skala kolejnych ramek."),X("spacing","Rozstaw ramek","Odległość między kolejnymi segmentami."),X("pulse","Puls neonu","Siła pulsowania i poświaty.")]},{id:"scanlines",name:"Scanlines",description:"Czytelne linie skanowania z delikatnym dryfem i migotaniem.",category:"retro",tags:["scanlines","crt","retro","screen"],kind:"scanline",count:90,cost:2,opacity:62,density:78,speed:68,intensity:92,brightness:125,controls:[X("lineGap","Odstęp linii","Gęstość poziomych linii."),X("flicker","Migotanie","Siła nieregularnego CRT flickeru."),X("drift","Dryf","Prędkość przesuwania całej siatki.")]},{id:"laser-grid",name:"Laser Grid",description:"Jasna perspektywiczna siatka laserowa z pulsującymi liniami.",category:"sci-fi",tags:["laser","grid","perspective","sci-fi"],kind:"laser-grid",count:42,cost:3,opacity:76,density:72,speed:82,intensity:110,brightness:145,controls:[X("perspective","Perspektywa","Jak mocno siatka zbiega się ku horyzontowi."),X("spacing","Rozstaw","Odległość pomiędzy liniami."),X("pulse","Puls lasera","Jasność i rytm pulsowania.")]},{id:"vhs-static",name:"VHS Static",description:"Widoczne analogowe zakłócenia z trackingiem, pasami i szumem.",category:"retro",tags:["vhs","static","noise","tracking"],kind:"vhs",count:72,cost:3,opacity:68,density:76,speed:120,intensity:110,brightness:130,controls:[X("noise","Szum","Ilość drobnych analogowych zakłóceń."),X("tracking","Tracking","Siła poziomych pasów i przesunięć."),X("jitter","Drżenie obrazu","Nieregularne przeskoki i jitter.")]},{id:"hud-grid",name:"HUD Grid",description:"Czytelna techniczna siatka HUD z osiami, skanem i pulsującymi punktami.",category:"tech",tags:["hud","grid","scanner","interface"],kind:"hud",count:50,cost:3,opacity:72,density:70,speed:74,intensity:105,brightness:138,controls:[X("gridSpacing","Rozstaw siatki","Wielkość pól technologicznej siatki."),X("scan","Skanowanie","Siła przesuwającej się wiązki skanu."),X("markers","Znaczniki","Widoczność punktów i markerów HUD.")]},{id:"city-lights",name:"City Lights",description:"Warstwowy nocny skyline z oknami, parallaxem i migotaniem.",category:"urban",tags:["city","lights","skyline","windows"],kind:"city",count:46,cost:3,opacity:82,density:74,speed:46,intensity:100,brightness:135,controls:[X("skyline","Wysokość zabudowy","Średnia wysokość budynków."),X("parallax","Parallax","Różnica prędkości między planami."),X("windows","Światła okien","Gęstość i migotanie okien.")]},{id:"embers",name:"Embers",description:"Czytelniejsze żarzące iskry z unoszeniem, smugą i wygaszaniem.",category:"cinematic",tags:["embers","fire","sparks","ash"],kind:"ember",count:58,cost:3,opacity:82,density:72,speed:82,intensity:110,brightness:145,controls:[X("lift","Siła unoszenia","Jak szybko iskry unoszą się ku górze."),X("trail","Długość smugi","Jak długo widoczny jest ślad żaru."),X("flicker","Migotanie","Nieregularność jasności iskier.")]},{id:"dust-motes",name:"Dust Motes",description:"Wyraźniejszy pył w świetle z różną głębią, rozmiarem i dryfem.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],kind:"dust",count:78,cost:2,opacity:66,density:72,speed:48,intensity:92,brightness:125,controls:[X("depth","Głębia","Różnica skali i rozmycia między planami."),X("drift","Dryf","Siła spokojnego ruchu cząstek."),X("sparkle","Połysk","Jak często drobiny łapią światło.")]},{id:"magnetic-field",name:"Magnetic Field",description:"Łuki pola magnetycznego oplatające dwa bieguny.",category:"sci-fi",tags:["magnetic","field","lines","physics"],kind:"magnetic",count:36,cost:3,controls:[X("curvature","Krzywizna pola","Jak mocno linie wyginają się między biegunami."),X("poleDistance","Rozstaw biegunów","Odległość między źródłami pola."),X("flow","Przepływ","Szybkość świetlnych impulsów po liniach.")]},{id:"volumetric-rays",name:"Volumetric Rays",description:"Miękkie wolumetryczne promienie światła przecinające scenę.",category:"cinematic",tags:["rays","god rays","light","volumetric"],kind:"rays",count:18,cost:3,opacity:58,density:56,speed:42,intensity:105,brightness:135,controls:[X("spread","Rozwarcie","Szerokość wachlarza promieni."),X("softness","Miękkość","Stopień rozmycia krawędzi światła."),X("sweep","Ruch źródła","Jak mocno promienie przesuwają się po scenie.")]},{id:"plasma-filaments",name:"Plasma Filaments",description:"Falujące włókna plazmy przypominające aktywne pole energetyczne.",category:"energy",tags:["plasma","filaments","energy","electric"],kind:"filament",count:34,cost:4,controls:[X("curl","Skręt włókien","Jak mocno linie plazmy się wiją."),X("length","Długość","Średnia długość energetycznych włókien."),X("heat","Temperatura","Jasność i intensywność świecenia.")]},{id:"ripple-field",name:"Ripple Field",description:"Wiele nakładających się fal powierzchniowych o różnych centrach.",category:"abstract",tags:["ripple","waves","rings","water"],kind:"ripple",count:18,cost:3,controls:[X("radius","Promień fal","Maksymalny zasięg pojedynczej fali."),X("frequency","Częstotliwość","Jak często powstają nowe fale."),X("distortion","Nieregularność","Jak mocno fale odbiegają od idealnych okręgów.")]},{id:"bioluminescent-plankton",name:"Bioluminescent Plankton",description:"Organiczne świecące drobiny reagujące falami i lokalnymi rozbłyskami.",category:"botanical",tags:["plankton","bioluminescent","ocean","organic"],kind:"plankton",count:82,cost:3,controls:[X("current","Prąd wody","Siła wspólnego dryfu cząstek."),X("flash","Bioluminescencja","Siła krótkich organicznych rozbłysków."),X("swarm","Skupiska","Jak mocno plankton tworzy lokalne grupy.")]},{id:"glass-shards",name:"Glass Shards",description:"Odłamki szkła z obrotem, refleksami i różnymi planami głębi.",category:"cinematic",tags:["glass","shards","fragments","reflection"],kind:"shards",count:38,cost:3,controls:[X("shardSize","Rozmiar odłamków","Średni rozmiar kawałków szkła."),X("spin","Obrót","Prędkość rotacji odłamków."),X("reflection","Refleksy","Siła błysków na krawędziach szkła.")]},{id:"aurora-curtains",name:"Aurora Curtains",description:"Warstwowe pionowe kurtyny zorzy z płynną falą i głębią.",category:"cosmic",tags:["aurora","curtains","sky","waves"],kind:"aurora",count:16,cost:4,controls:[X("curtainWidth","Szerokość kurtyn","Jak szerokie są pasma zorzy."),X("wave","Falowanie","Amplituda płynnego ruchu kurtyn."),X("depth","Głębia","Różnica jasności i skali pomiędzy warstwami.")]},{id:"data-streams",name:"Data Streams",description:"Warstwowe kanały danych poruszające się niezależnie z pakietami i przerwami.",category:"tech",tags:["data","streams","packets","network"],kind:"data",count:48,cost:3,controls:[X("packetLength","Długość pakietów","Długość poruszających się segmentów."),X("lanes","Liczba kanałów","Wrażenie gęstości równoległych strumieni."),X("dropout","Przerwy sygnału","Jak często dane znikają i wracają.")]},{id:"orbital-rings",name:"Orbital Rings",description:"Kilka przecinających się orbit z punktami poruszającymi się po różnych płaszczyznach.",category:"cosmic",tags:["orbit","rings","planet","atomic"],kind:"orbit-rings",count:24,cost:3,controls:[X("tilt","Nachylenie orbit","Różnica płaszczyzn kolejnych pierścieni."),X("radius","Promień orbit","Rozmiar całego układu."),X("satellites","Satelity","Widoczność i liczba punktów na orbitach.")]},{id:"prism-caustics",name:"Prism Caustics",description:"Miękkie załamania światła i tęczowe kaustyki przesuwające się po scenie.",category:"abstract",tags:["prism","caustics","light","refraction"],kind:"caustics",count:20,cost:4,controls:[X("spread","Rozszczepienie","Szerokość kolorystycznego rozdzielenia światła."),X("softness","Miękkość","Rozmycie i płynność kaustyk."),X("motion","Ruch","Tempo przesuwania świetlnych plam.")]},{id:"ember-ribbons",name:"Ember Ribbons",description:"Długie ogniste wstęgi z iskrami i zanikającym ogonem.",category:"energy",tags:["embers","ribbons","fire","trails"],kind:"ember-ribbon",count:24,cost:4,controls:[X("trail","Długość ogona","Długość płonącej wstęgi."),X("curl","Skręt","Jak mocno wstęga faluje i zakręca."),X("sparks","Iskry","Widoczność drobnych iskier wokół wstęgi.")]},{id:"fractal-branches",name:"Fractal Branches",description:"Rosnące geometryczne rozgałęzienia przypominające fraktalne drzewo.",category:"abstract",tags:["fractal","branches","recursive","geometry"],kind:"fractal",count:32,cost:4,controls:[X("branching","Rozgałęzienie","Ilość kolejnych odnóg."),X("angle","Kąt gałęzi","Rozwarcie struktury fraktalnej."),X("growth","Wzrost","Tempo rozwijania kolejnych poziomów.")]}],Fe={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100,custom:{}},gi={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},bi=String.raw`.ae-p09{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);pointer-events:none;will-change:transform,opacity,filter;animation-duration:var(--duration);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear}.ae-p09::before,.ae-p09::after{pointer-events:none}
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
@keyframes ae09-burst{0%,14%{transform:translate(-50%,180px) scale(.05);opacity:0}18%{opacity:1}62%{transform:translate(-50%,-50%) scale(calc(.8 + .9*var(--c1)));opacity:1}100%{transform:translate(-50%,-50%) scale(calc(1.2 + 1.5*var(--c1)));opacity:0}}@keyframes ae09-bolt{0%,100%{transform:translate(-50%,-10%) scaleY(.35);opacity:0}8%{opacity:1}12%{opacity:.18}16%{opacity:1}68%{opacity:.75}100%{transform:translate(-50%,-10%) scaleY(calc(.85 + .45*var(--c2)));opacity:0}}@keyframes ae09-storm{0%,100%{transform:translate(-50%,-5%) scaleY(.28);opacity:0}8%{opacity:1}14%{opacity:.12}20%{opacity:1}74%{opacity:.7}100%{transform:translate(-50%,-5%) scaleY(calc(.95 + .5*var(--c2)));opacity:0}}@keyframes ae09-gear{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(var(--spin))}}@keyframes ae09-liquid{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.82)}50%{transform:translate(calc(-50% + 36px*var(--c1)),calc(-50% - 20px*var(--c1))) rotate(calc(var(--angle) + 160deg)) scale(calc(1 + .25*var(--c2)))}}@keyframes ae09-gravity{0%{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.8);opacity:.2}55%{opacity:1}100%{transform:rotate(calc(var(--angle) + 900deg*var(--c1))) translateX(calc(7px + var(--orbit)*.1)) scale(.05);opacity:0}}@keyframes ae09-electric{0%,100%{transform:rotate(var(--angle)) scaleX(.2);opacity:0}10%{opacity:1}18%{opacity:.15}26%{opacity:.9}58%{transform:rotate(calc(var(--angle) + 9deg*var(--c3))) scaleX(calc(.8 + .3*var(--c2)));opacity:.7}}@keyframes ae09-galaxy{from{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.6);opacity:.25}50%{opacity:1}to{transform:rotate(calc(var(--angle) + 360deg*var(--c1))) translateX(var(--orbit)) scale(1);opacity:.35}}@keyframes ae09-vine{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.1}20%{opacity:1}to{transform:rotate(calc(var(--angle) + 20deg*var(--c1))) scaleX(calc(.85 + .2*var(--c3)));opacity:.78}}@keyframes ae09-tunnel{from{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.05);opacity:0}18%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 4deg*var(--c3))) scale(calc(2.2 + 2.8*var(--c1)));opacity:0}}@keyframes ae09-scanline{from{transform:translateY(-10vh);opacity:.18}50%{opacity:.7}to{transform:translateY(110vh);opacity:.18}}@keyframes ae09-grid{0%,100%{transform:rotate(var(--angle)) scaleX(.5);opacity:.18}50%{transform:rotate(calc(var(--angle) + 4deg*var(--c1))) scaleX(calc(1 + .3*var(--c3)));opacity:.9}}@keyframes ae09-vhs{0%,100%{transform:translateX(0) skewX(0);opacity:.1}17%{transform:translateX(calc(-16px*var(--c3))) skewX(18deg);opacity:.92}35%{transform:translateX(calc(22px*var(--c3))) skewX(-11deg);opacity:.3}64%{transform:translateX(calc(-20px*var(--c3))) skewX(7deg);opacity:.78}}@keyframes ae09-hud{0%,100%{transform:translate(-50%,-50%) scale(.85);opacity:.18}50%{transform:translate(-50%,-50%) scale(calc(.92 + .12*var(--c2)));opacity:.86}}@keyframes ae09-city{0%,100%{transform:translateX(0);opacity:.88}50%{transform:translateX(calc(-10px*var(--c2)));opacity:1}}@keyframes ae09-ember{from{transform:translate3d(0,25vh,0) scale(.5);opacity:0}12%{opacity:1}to{transform:translate3d(calc(42px*var(--c1)),calc(-115vh*var(--c1)),0) rotate(320deg) scale(.12);opacity:0}}@keyframes ae09-dust{0%,100%{transform:translate(-50%,-50%) scale(.6);opacity:.12}50%{transform:translate(calc(-50% + 28px*var(--c2)),calc(-50% - 16px*var(--c2))) scale(calc(.9 + .35*var(--c1)));opacity:.72}}@keyframes ae09-magnetic{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(.8);opacity:.14}50%{opacity:.82}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg)) scaleX(calc(.9 + .2*var(--c1)));opacity:.14}}@keyframes ae09-rays{0%,100%{transform:rotate(calc(var(--angle) - 6deg*var(--c3)));opacity:.08}50%{transform:rotate(calc(var(--angle) + 6deg*var(--c3)));opacity:.6}}@keyframes ae09-filament{0%,100%{transform:rotate(var(--angle)) translateX(0) scaleX(.55);opacity:.18}50%{transform:rotate(calc(var(--angle) + 22deg*var(--c1))) translateX(calc(28px*var(--c1))) scaleX(calc(.9 + .2*var(--c2)));opacity:.92}}@keyframes ae09-ripple{from{transform:translate(-50%,-50%) scale(.05);opacity:.8}to{transform:translate(-50%,-50%) scale(calc(2 + 3.6*var(--c1)));opacity:0}}@keyframes ae09-plankton{0%,100%{transform:translate(-50%,-50%) scale(.55);opacity:.15}38%{opacity:1}50%{transform:translate(calc(-50% + 20px*var(--c1)),calc(-50% - 15px*var(--c1))) scale(calc(.85 + .4*var(--c2)));opacity:.92}}@keyframes ae09-shards{from{transform:translate(-50%,-50%) rotate(0) scale(.55);opacity:.15}50%{opacity:.92}to{transform:translate(calc(-50% + 40px*var(--c2)),calc(-50% - 32px*var(--c2))) rotate(calc(300deg*var(--c2))) scale(calc(.8 + .22*var(--c1)));opacity:.16}}@keyframes ae09-aurora{0%,100%{transform:translateX(calc(-30px*var(--c2))) skewX(-8deg);opacity:.12}50%{transform:translateX(calc(30px*var(--c2))) skewX(8deg);opacity:.72}}@keyframes ae09-data{from{transform:translateX(-25vw) scaleX(.6);opacity:0}12%{opacity:.9}to{transform:translateX(125vw) scaleX(calc(.8 + .25*var(--c1)));opacity:0}}@keyframes ae09-orbit{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}50%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg*var(--c1))) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}}@keyframes ae09-caustics{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.65);opacity:.12}50%{transform:translate(calc(-50% + 34px*var(--c3)),calc(-50% - 24px*var(--c3))) rotate(calc(var(--angle) + 80deg)) scale(calc(.92 + .22*var(--c1)));opacity:.68}}@keyframes ae09-ribbon{from{transform:translateX(-35vw) rotate(var(--angle)) scaleX(.55);opacity:0}15%{opacity:.9}50%{transform:translateX(45vw) rotate(calc(var(--angle) + 12deg*var(--c2))) scaleX(1);opacity:1}to{transform:translateX(135vw) rotate(calc(var(--angle) - 12deg*var(--c2))) scaleX(calc(1 + .25*var(--c1)));opacity:0}}@keyframes ae09-fractal{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.08}20%{opacity:.85}to{transform:rotate(calc(var(--angle) + 8deg*var(--c3))) scaleX(calc(.9 + .2*var(--c1)));opacity:.68}}`.trim(),Xa=e=>Math.max(0,Math.min(400,e)),bt=(e,a,t=100)=>{const n=e.custom?.[a];return Number.isFinite(n)?Number(n):t},wi=e=>"aeRenderPack09"+e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("");function ma(e,a){const t=bt(a,e.controls[0]?.key??"",e.controls[0]?.defaultValue??100)/100;return Math.max(1,Math.round(e.count*Xa(a.density)/100*(.8+t*.2)))}function ki(e,a,t,n,i){const s=Math.max(.1,t.speed/100),r=Math.max(.15,Xa(t.intensity)/100),o=bt(t,i.controls[0]?.key??"",i.controls[0]?.defaultValue??100)/100,l=bt(t,i.controls[1]?.key??"",i.controls[1]?.defaultValue??100)/100,m=bt(t,i.controls[2]?.key??"",i.controls[2]?.defaultValue??100)/100;switch(e.className=`ae-p09 ae-p09-${i.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${12+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.6+n()*6.8)/s}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--c1",String(o)),e.style.setProperty("--c2",String(l)),e.style.setProperty("--c3",String(m)),e.style.setProperty("--orbit",`${32+n()*220*l}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(220+n()*620*m)}deg`),i.kind){case"burst":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${12+n()*64}%`);break;case"bolt":case"storm-bolt":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${-6+n()*20}%`),e.style.setProperty("--duration",`${(.9+n()*2.5)/Math.max(.35,s)}s`);break;case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${44+n()*110*l}px`);break;case"liquid":e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${70+n()*150*l}px`),e.style.setProperty("--duration",`${(5+n()*8)*Math.max(.45,o)/Math.max(.35,s)}s`);break;case"gravity":case"black-hole":case"galaxy":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%");break;case"web":case"arc":e.style.setProperty("--x",`${4+n()*82}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--duration",`${(.8+n()*2.6)/Math.max(.4,s*m)}s`);break;case"vine":e.style.setProperty("--x",`${n()*75}%`),e.style.setProperty("--y",`${25+n()*70}%`),e.style.setProperty("--angle",`${-70+n()*140}deg`);break;case"tunnel":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${55+a*8*l}px`),e.style.setProperty("--angle",`${a%4*2.5}deg`);break;case"scanline":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${a/Math.max(1,i.count)*100}%`);break;case"laser-grid":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${8+a%14*6.5}%`),e.style.setProperty("--angle",`${a%2===0?0:90}deg`);break;case"vhs":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--duration",`${(.45+n()*1.7)/Math.max(.3,s)}s`);break;case"hud":e.style.setProperty("--x",`${5+a%10*10}%`),e.style.setProperty("--y",`${7+Math.floor(a/10)*16}%`);break;case"city":e.style.setProperty("--x",`${a/Math.max(1,i.count)*105-2}%`),e.style.setProperty("--y","100%"),e.style.setProperty("--size",`${28+n()*44}px`);break;case"ember":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${80+n()*25}%`),e.style.setProperty("--size",`${5+n()*11}px`);break;case"dust":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${2+n()*(6+9*o)}px`);break;case"magnetic":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--angle",`${-90+n()*180}deg`);break;case"rays":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y","-20%"),e.style.setProperty("--angle",`${-22+n()*44}deg`);break;case"filament":e.style.setProperty("--x",`${n()*70}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--angle",`${-45+n()*90}deg`);break;case"ripple":e.style.setProperty("--x",`${12+n()*76}%`),e.style.setProperty("--y",`${12+n()*76}%`),e.style.setProperty("--size",`${28+n()*44}px`);break;case"plankton":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${3+n()*8}px`);break;case"shards":e.style.setProperty("--x",`${4+n()*92}%`),e.style.setProperty("--y",`${4+n()*92}%`),e.style.setProperty("--size",`${24+n()*58*o}px`);break;case"aurora":e.style.setProperty("--x",`${-10+n()*100}%`),e.style.setProperty("--y","0%");break;case"data":e.style.setProperty("--x",`${-20+n()*10}%`),e.style.setProperty("--y",`${5+n()*90}%`);break;case"orbit-rings":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${80+n()*180*l}px`),e.style.setProperty("--angle",`${n()*180*o}deg`);break;case"caustics":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--size",`${90+n()*170}px`);break;case"ember-ribbon":e.style.setProperty("--x",`${-25+n()*15}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--angle",`${-12+n()*24}deg`);break;case"fractal":e.style.setProperty("--x",`${6+n()*82}%`),e.style.setProperty("--y",`${20+n()*70}%`),e.style.setProperty("--angle",`${-160+n()*320}deg`);break}}function xi(e,a){const t=JSON.stringify(e.controls[0]?.key??""),n=JSON.stringify(e.controls[1]?.key??""),i=JSON.stringify(e.controls[2]?.key??""),s=e.controls[0]?.defaultValue??100,r=e.controls[1]?.defaultValue??100,o=e.controls[2]?.defaultValue??100;return`function ${a}(effect,root){const layer=aeCreateLayer(effect,root),random=aeCreateSeededRandom(effect.seed),s=effect.settings,custom=s.custom||{},cv=(k,d)=>Number.isFinite(Number(custom[k]))?Number(custom[k]):d,density=Math.max(0,Math.min(400,s.density)),speed=Math.max(.1,s.speed/100),power=Math.max(.15,Math.max(0,Math.min(400,s.intensity))/100),c1=cv(${t},${s})/100,c2=cv(${n},${r})/100,c3=cv(${i},${o})/100,count=Math.max(1,Math.round(${e.count}*density/100*(.8+c1*.2)));for(let i=0;i<count;i++){const node=document.createElement("span");node.className="ae-p09 ae-p09-${e.kind}";node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(random()*100)+"%");node.style.setProperty("--size",(12+random()*86)+"px");node.style.setProperty("--angle",(random()*360)+"deg");node.style.setProperty("--duration",((2.6+random()*6.8)/speed)+"s");node.style.setProperty("--delay",(-random()*9)+"s");node.style.setProperty("--power",String(power));node.style.setProperty("--c1",String(c1));node.style.setProperty("--c2",String(c2));node.style.setProperty("--c3",String(c3));node.style.setProperty("--orbit",(32+random()*220*c2)+"px");node.style.setProperty("--spin",(((random()>.5?1:-1)*(220+random()*620*c3)))+"deg");const kind=${JSON.stringify(e.kind)};if(kind==="burst"){node.style.setProperty("--x",(10+random()*80)+"%");node.style.setProperty("--y",(12+random()*64)+"%");}else if(kind==="bolt"||kind==="storm-bolt"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(-6+random()*20)+"%");}else if(kind==="gear"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(44+random()*110*c2)+"px");}else if(kind==="liquid"){node.style.setProperty("--x",(6+random()*88)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(70+random()*150*c2)+"px");}else if(kind==="gravity"||kind==="black-hole"||kind==="galaxy"||kind==="magnetic"||kind==="tunnel"||kind==="orbit-rings"){node.style.setProperty("--x","50%");node.style.setProperty("--y","50%");if(kind==="tunnel")node.style.setProperty("--size",(55+i*8*c2)+"px");if(kind==="orbit-rings")node.style.setProperty("--size",(80+random()*180*c2)+"px");}else if(kind==="scanline"){node.style.setProperty("--x","0%");node.style.setProperty("--y",((i/Math.max(1,count))*100)+"%");}else if(kind==="laser-grid"){node.style.setProperty("--x","0%");node.style.setProperty("--y",(8+(i%14)*6.5)+"%");node.style.setProperty("--angle",(i%2===0?0:90)+"deg");}else if(kind==="hud"){node.style.setProperty("--x",(5+(i%10)*10)+"%");node.style.setProperty("--y",(7+Math.floor(i/10)*16)+"%");}else if(kind==="city"){node.style.setProperty("--x",((i/Math.max(1,count))*105-2)+"%");node.style.setProperty("--y","100%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="ember"){node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(80+random()*25)+"%");node.style.setProperty("--size",(5+random()*11)+"px");}else if(kind==="dust"||kind==="plankton"){node.style.setProperty("--size",(3+random()*10*c1)+"px");}else if(kind==="rays"){node.style.setProperty("--x",(5+random()*90)+"%");node.style.setProperty("--y","-20%");}else if(kind==="ripple"){node.style.setProperty("--x",(12+random()*76)+"%");node.style.setProperty("--y",(12+random()*76)+"%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="shards"){node.style.setProperty("--size",(24+random()*58*c1)+"px");}else if(kind==="aurora"){node.style.setProperty("--x",(-10+random()*100)+"%");node.style.setProperty("--y","0%");}else if(kind==="data"){node.style.setProperty("--x",(-20+random()*10)+"%");node.style.setProperty("--y",(5+random()*90)+"%");}else if(kind==="caustics"){node.style.setProperty("--size",(90+random()*170)+"px");}else if(kind==="ember-ribbon"){node.style.setProperty("--x",(-25+random()*15)+"%");node.style.setProperty("--y",(6+random()*88)+"%");}layer.appendChild(node);}}`}function vi(e){const a=wi(e.id),t=Object.fromEntries(e.controls.map(n=>[n.key,n.defaultValue]));return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Fe,opacity:e.opacity??Fe.opacity,density:e.density??Fe.density,speed:e.speed??Fe.speed,intensity:e.intensity??Fe.intensity,brightness:e.brightness??Fe.brightness,custom:t},capabilities:gi,customControls:e.controls,performanceCost:e.cost,requiresJavaScript:!0},css:bi,streamElementsRendererName:a,renderPreview(n,i,s){for(let r=0,o=ma(e,i);r<o;r++){const l=document.createElement("span");ki(l,r,i,s,e),n.appendChild(l)}},streamElementsRendererSource:xi(e,a),estimateDomNodes(n){return ma(e,n)}}}const zi=hi.map(vi),Si=[...Is,...Ws,...Vs,...ii,...mi,...zi],Rt=Array.from(new Map(Si.map(e=>[e.definition.id,e])).values()),Ua=new Map(Rt.map(e=>[e.definition.id,e]));Object.fromEntries(Rt.map(e=>[e.definition.id,e.definition]));function Je(e){return Ua.get(e)}function Se(e){return Ua.get(e)?.definition}function ot(){return Rt.map(e=>e.definition)}function Pi(){return[...Rt]}const V={resolution:{width:1920,height:1080},backgroundOnly:!0,palette:{accent1:"#7c5cff",accent2:"#00d9ff",accent3:"#ff4fb0",background1:"#080b12",background2:"#101827"},background:{mode:"gradient",angle:145,lightX:50,lightY:40,hue:0,saturation:1,brightness:1,contrast:1,noise:0,vignette:.2},focusZone:"none",safeZone:"off",effects:[],selectedEffectInstanceId:null,activePresetId:null},Ut=new Set,De=[],Ve=[],Ci=100;let Le=null;const Oe=e=>structuredClone(e),Ga=(e,a)=>JSON.stringify(e)===JSON.stringify(a),ct=()=>Ut.forEach(e=>e(V));function Ya(e,a){De.push({label:e,snapshot:a}),De.length>Ci&&De.shift(),Ve.length=0}function we(e,a){const t=Le?null:Oe(V);a(),t&&!Ga(t,V)&&Ya(e,t),ct()}function be(){return V}function Ha(e){return Ut.add(e),()=>Ut.delete(e)}function Mi(e){Le||(Le={label:e,before:Oe(V)})}function Ei(){if(!Le)return;const e=Le;Le=null,Ga(e.before,V)||(Ya(e.label,e.before),ct())}function _i(){De.length=0,Ve.length=0,Le=null}function $i(){return De.length>0}function Ri(){return Ve.length>0}function ha(){return De.at(-1)?.label??null}function ga(){return Ve.at(-1)?.label??null}function Za(){const e=De.pop();e&&(Ve.push({label:e.label,snapshot:Oe(V)}),Object.assign(V,Oe(e.snapshot)),ct())}function Ja(){const e=Ve.pop();e&&(De.push({label:e.label,snapshot:Oe(V)}),Object.assign(V,Oe(e.snapshot)),ct())}function Va(e){const a=Se(e);if(!a)return console.warn(`Unknown effect: ${e}`),null;let t=null;return we(`Dodaj ${a.name}`,()=>{const n={instanceId:crypto.randomUUID(),effectId:e,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...a.defaultSettings},locked:!1,groupId:null};V.effects.push(n),V.selectedEffectInstanceId=n.instanceId,V.activePresetId=null,t=n}),t}function ji(e,a=!1){const t=V.effects.find(i=>i.instanceId===e);if(!t)return null;let n=null;return we(`Duplikuj ${t.label??t.effectId}`,()=>{const i=V.effects.indexOf(t),s={...structuredClone(t),instanceId:crypto.randomUUID(),seed:a?t.seed:Math.floor(Math.random()*4294967295),locked:!1};V.effects.splice(i+1,0,s),V.selectedEffectInstanceId=s.instanceId,n=s}),n}function Ka(e,a=!1){const t=V.effects.findIndex(i=>i.instanceId===e);if(t<0)return!1;const n=V.effects[t];return n?.locked&&!a?!1:(we(`Usuń ${n?.label??n?.effectId??"warstwę"}`,()=>{V.effects.splice(t,1),V.selectedEffectInstanceId===e&&(V.selectedEffectInstanceId=V.effects.at(-1)?.instanceId??null)}),!0)}function Di(e=!1){we("Wyczyść scenę",()=>{V.effects=e?[]:V.effects.filter(t=>t.locked);const a=new Set(V.effects.map(t=>t.instanceId));V.selectedEffectInstanceId&&!a.has(V.selectedEffectInstanceId)&&(V.selectedEffectInstanceId=V.effects.at(-1)?.instanceId??null),V.activePresetId=null})}function Qa(e){V.effects.some(a=>a.instanceId===e)&&(V.selectedEffectInstanceId=e,ct())}function Ii(e){const a=V.effects.find(t=>t.instanceId===e);a&&we(`${a.enabled?"Wyłącz":"Włącz"} ${a.label??a.effectId}`,()=>{a.enabled=!a.enabled})}function Ni(e){const a=V.effects.find(t=>t.instanceId===e);a&&we(`${a.locked?"Odblokuj":"Zablokuj"} ${a.label??a.effectId}`,()=>{a.locked=!a.locked})}function Ai(e,a){const t=V.effects.find(i=>i.instanceId===e);if(!t)return;const n=a.trim().slice(0,80);we("Zmień nazwę warstwy",()=>{t.label=n||void 0})}function Li(e){const a=V.effects.findIndex(i=>i.instanceId===e),t=V.effects[a];if(a<0||a===V.effects.length-1||t?.locked)return;const n=V.effects[a+1];!n||n.locked||we("Przenieś warstwę wyżej",()=>{V.effects[a+1]=V.effects[a],V.effects[a]=n})}function Bi(e){const a=V.effects.findIndex(i=>i.instanceId===e),t=V.effects[a];if(a<=0||t?.locked)return;const n=V.effects[a-1];!n||n.locked||we("Przenieś warstwę niżej",()=>{V.effects[a-1]=V.effects[a],V.effects[a]=n})}function Oi(e,a){if(e===a)return;const t=V.effects.find(i=>i.instanceId===e),n=V.effects.find(i=>i.instanceId===a);!t||!n||t.locked||n.locked||we("Zmień kolejność warstw",()=>{V.effects.splice(V.effects.indexOf(t),1);const i=V.effects.indexOf(n);V.effects.splice(i+1,0,t)})}function nt(){const e=V.selectedEffectInstanceId;return e?V.effects.find(a=>a.instanceId===e)??null:null}function xe(e,a){const t=V.effects.find(n=>n.instanceId===e);t&&we(`Zmień ${t.label??t.effectId}`,()=>{t.settings={...t.settings,...a},V.activePresetId=null})}function er(e,a){const t=V.effects.find(i=>i.instanceId===e);if(!t)return;const n=Math.max(0,Math.min(4294967295,Math.floor(a)));we("Zmień seed",()=>{t.seed=n})}function Ti(e){er(e,Math.floor(Math.random()*4294967295))}function Fi(){we("Losuj wszystkie seedy",()=>V.effects.forEach(e=>{e.seed=Math.floor(Math.random()*4294967295)}))}function tr(e,a="Wczytaj scenę"){const t=Oe(e);we(a,()=>Object.assign(V,t))}function qi(e,a="Zastosuj preset sceny"){we(a,()=>{const t=[];for(const n of e){const i=Se(n.effectId);i&&t.push({instanceId:crypto.randomUUID(),effectId:i.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...i.defaultSettings,...n.settings},locked:!1,groupId:null})}V.effects=t,V.selectedEffectInstanceId=t.at(-1)?.instanceId??null,V.activePresetId=null})}let ba=!1,He=null,wt=!1,Nt=!1;function qe(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function ar(){const e=document.querySelector("#inspector");!He||!e||He.observe(e,{childList:!0,subtree:!1})}function Wi(){Nt||(Nt=!0,He?.disconnect(),queueMicrotask(()=>{try{rr()}finally{Nt=!1,ar()}}))}function rr(){if(wt)return;const e=document.querySelector("#inspector");if(e){wt=!0,He?.disconnect();try{e.querySelector("[data-pack09-character]")?.remove();const a=nt();if(!a)return;const t=Se(a.effectId),n=t?.customControls??[];if(n.length===0)return;const i=document.createElement("section");i.className="ae-pack09-character-panel",i.dataset.pack09Character="1",i.innerHTML=`
      <div class="ae-pack09-character-heading">
        <div>
          <strong>Charakter efektu</strong>
          <span>
            Parametry specyficzne dla
            ${qe(t?.name??a.effectId)}
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
        ${n.map(o=>{const l=a.settings.custom?.[o.key],m=Number.isFinite(l)?Number(l):o.defaultValue;return`
                <label class="ae-pack09-character-field">
                  <span class="ae-pack09-character-label">
                    <span>
                      <strong>${qe(o.label)}</strong>
                      <small>${qe(o.description??"")}</small>
                    </span>

                    <output data-pack09-output="${qe(o.key)}">
                      ${m}${o.suffix??""}
                    </output>
                  </span>

                  <input
                    type="range"
                    min="${o.min}"
                    max="${o.max}"
                    step="${o.step??1}"
                    value="${m}"
                    data-pack09-custom="${qe(o.key)}"
                    data-pack09-suffix="${qe(o.suffix??"")}"
                  >
                </label>
              `}).join("")}
      </div>

      <p class="ae-pack09-character-help">
        Te suwaki zmieniają konstrukcję efektu,
        a nie tylko kolor lub liczbę elementów.
        Wartości są zapisywane w scenie i eksporcie.
      </p>
    `;const s=e.querySelector(".inspector-color-panel"),r=e.querySelector(".inspector-group");s?.nextSibling?e.insertBefore(i,s.nextSibling):r?e.insertBefore(i,r):e.appendChild(i),i.querySelectorAll("[data-pack09-custom]").forEach(o=>{o.addEventListener("input",()=>{const l=o.dataset.pack09Custom;if(!l)return;const m=nt();if(!m)return;const y=i.querySelector(`[data-pack09-output="${CSS.escape(l)}"]`);y&&(y.value=`${o.value}${o.dataset.pack09Suffix??""}`),xe(m.instanceId,{custom:{...m.settings.custom??{},[l]:Number(o.value)}})})}),i.querySelectorAll("[data-pack09-preset]").forEach(o=>{o.addEventListener("click",()=>{const l=o.dataset.pack09Preset,m=nt();if(!m||!t)return;const y={...m.settings.custom??{}};for(const d of n){let w=d.defaultValue;l==="soft"?w*=.72:l==="strong"?w*=1.45:l==="random"&&(w+=(Math.random()*2-1)*(d.max-d.min)*.28);const u=d.step??1;y[d.key]=Math.max(d.min,Math.min(d.max,Math.round(w/u)*u))}xe(m.instanceId,{custom:y})})})}finally{He?.observe(e,{childList:!0,subtree:!1}),wt=!1}}}function Xi(){ba||(ba=!0,!document.querySelector("#inspector"))||(He=new MutationObserver(a=>{if(wt)return;a.some(n=>Array.from(n.addedNodes).concat(Array.from(n.removedNodes)).some(s=>!(s instanceof HTMLElement&&s.matches("[data-pack09-character]"))))&&Wi()}),rr(),ar())}let wa=!1;function ka(e){return(e??"").trim().toLocaleLowerCase("pl")}function pt(e,a){const t=ka(a);return Array.from(e.querySelectorAll(":scope > .inspector-group")).find(n=>{if(n.matches(".ae-pack06-inspector"))return!1;const i=n.querySelector(".inspector-group-heading strong")??n.querySelector("strong");return ka(i?.textContent??null)===t})??null}function Ui(){const e=document.querySelector("#inspector");if(!e)return;const a=e.querySelector(":scope > .inspector-title"),t=e.querySelector(":scope > .inspector-variant-panel"),n=e.querySelector(":scope > [data-pack09-character]"),i=e.querySelector(":scope > .ae-pack06-inspector"),s=e.querySelector(":scope > .inspector-color-panel"),r=pt(e,"Podstawowe"),o=pt(e,"Transformacja"),l=pt(e,"Wygląd"),m=pt(e,"Kompozycja"),y=[a,t,n,r,s,i,o,l,m].filter(d=>!!d);for(const d of y)e.appendChild(d);e.classList.add("ae-ui10-inspector-ordered")}function xa(){document.documentElement.style.setProperty("--ae-ui10-vh",`${window.innerHeight}px`)}function Gi(){wa||(wa=!0,xa(),window.addEventListener("resize",xa,{passive:!0}))}const nr="animated-effects-scene",sr=1,Vt="animated-effects:pack06:recovery";function ge(e,a,t,n){const i=typeof e=="number"?e:Number(e);return Number.isFinite(i)?Math.min(n,Math.max(t,i)):a}function Yi(e,a){const t=e&&typeof e=="object"?e:{},n=["normal","screen","lighten","multiply","overlay"],i=["full","left","center","right","top","bottom"],s=n.includes(t.blendMode)?t.blendMode:a.blendMode,r=i.includes(t.area)?t.area:a.area,o=typeof t.color=="string"&&/^#[0-9a-f]{6}$/i.test(t.color)?t.color:a.color;return{opacity:ge(t.opacity,a.opacity,0,100),scale:ge(t.scale,a.scale,10,400),x:ge(t.x,a.x,-300,300),y:ge(t.y,a.y,-300,300),rotation:ge(t.rotation,a.rotation,-1080,1080),blur:ge(t.blur,a.blur,0,100),brightness:ge(t.brightness,a.brightness,0,500),hue:ge(t.hue,a.hue,-1080,1080),color:o,colorize:typeof t.colorize=="boolean"?t.colorize:a.colorize,density:ge(t.density,a.density,0,200),blendMode:s,area:r,zIndex:ge(t.zIndex,a.zIndex,-1e3,1e3),speed:ge(t.speed,a.speed,1,500),intensity:ge(t.intensity,a.intensity,0,200)}}function Hi(e,a="Animated Effects Scene"){return{format:nr,version:sr,name:a,createdAt:new Date().toISOString(),resolution:structuredClone(e.resolution),backgroundOnly:e.backgroundOnly,palette:structuredClone(e.palette),background:structuredClone(e.background),focusZone:e.focusZone,safeZone:e.safeZone,effects:structuredClone(e.effects)}}function ir(e,a){return JSON.stringify(Hi(e,a),null,2)}function or(e,a){const t=JSON.parse(e);if(t.format!==nr)throw new Error("To nie jest plik Animated Effects Scene.");if(t.version!==sr)throw new Error(`Nieobsługiwana wersja sceny: ${String(t.version)}.`);const n=[],i=new Set,s=[],r=Array.isArray(t.effects)?t.effects:[];for(const m of r){if(!m||typeof m!="object"){n.push("Pominięto nieprawidłową warstwę.");continue}const y=m,d=typeof y.effectId=="string"?y.effectId:"",w=Se(d);if(!w){n.push(`Pominięto nieznany efekt: ${d||"(brak id)"}.`);continue}let u=typeof y.instanceId=="string"&&y.instanceId?y.instanceId:crypto.randomUUID();i.has(u)&&(n.push(`Naprawiono powtórzone instanceId: ${d}.`),u=crypto.randomUUID()),i.add(u),s.push({instanceId:u,effectId:d,seed:ge(y.seed,Math.floor(Math.random()*4294967295),0,4294967295),enabled:typeof y.enabled=="boolean"?y.enabled:!0,settings:Yi(y.settings,w.defaultSettings),label:typeof y.label=="string"&&y.label.trim().slice(0,80)||void 0,locked:y.locked===!0,groupId:typeof y.groupId=="string"?y.groupId:null})}const o=t.resolution&&typeof t.resolution=="object"?t.resolution:{},l={...structuredClone(a),resolution:{width:ge(o.width,a.resolution.width,240,7680),height:ge(o.height,a.resolution.height,240,4320)},effects:s,selectedEffectInstanceId:s.at(-1)?.instanceId??null,activePresetId:null};return t.palette&&typeof t.palette=="object"&&(l.palette={...l.palette,...t.palette}),t.background&&typeof t.background=="object"&&(l.background={...l.background,...t.background}),typeof t.backgroundOnly=="boolean"&&(l.backgroundOnly=t.backgroundOnly),{state:l,warnings:n,name:typeof t.name=="string"?t.name:"Imported Scene"}}function Zi(e,a){const t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=a,n.click(),setTimeout(()=>URL.revokeObjectURL(t),1500)}function Ji(e){Zi(new Blob([ir(e)],{type:"application/json;charset=utf-8"}),`animated-effects-${Date.now()}.aescene.json`)}function Vi(e){try{localStorage.setItem(Vt,ir(e,"Recovery Draft"))}catch{}}function Ki(){try{return!!localStorage.getItem(Vt)}catch{return!1}}function Qi(e){try{const a=localStorage.getItem(Vt);return a?or(a,e).state:null}catch{return null}}const va=[{id:"cyber-rain",name:"Cyber Rain",effects:[{effectId:"rainfall",settings:{hue:80,density:70,speed:125,blendMode:"screen"}},{effectId:"data-nodes",settings:{opacity:48,density:42}},{effectId:"hologram-scan",settings:{opacity:32}}]},{id:"winter-night",name:"Winter Night",effects:[{effectId:"snow",settings:{density:65,speed:62}},{effectId:"starfield",settings:{opacity:46,density:48}},{effectId:"fog",settings:{opacity:28,y:25}}]},{id:"arcane-ritual",name:"Arcane Ritual",effects:[{effectId:"magic-circle"},{effectId:"floating-symbols"},{effectId:"fractal-rings",settings:{opacity:42}}]},{id:"retro-crt",name:"Retro CRT",effects:[{effectId:"scanlines-plus"},{effectId:"vhs-static",settings:{opacity:34}},{effectId:"recursive-squares",settings:{opacity:30,hue:95}}]},{id:"cosmic-drift",name:"Cosmic Drift",effects:[{effectId:"spiral-galaxy"},{effectId:"meteor-shower",settings:{opacity:55}},{effectId:"orbiting-core",settings:{opacity:45}}]},{id:"ember-forge",name:"Ember Forge",effects:[{effectId:"embers"},{effectId:"sparks",settings:{opacity:58}},{effectId:"gears",settings:{opacity:35}}]},{id:"neon-city",name:"Neon City",effects:[{effectId:"city-lights"},{effectId:"traffic-trails"},{effectId:"neon-tunnel",settings:{opacity:28}}]},{id:"calm-ambient",name:"Calm Ambient",effects:[{effectId:"dust-motes",settings:{opacity:32}},{effectId:"liquid-blobs",settings:{opacity:28,speed:35}},{effectId:"starfield",settings:{opacity:24}}]}];function eo(e,a){if(e.match(/^[a-z]+:\/\//i))return e;if(e.match(/^\/\//))return window.location.protocol+e;if(e.match(/^[a-z]+:/i))return e;const t=document.implementation.createHTMLDocument(),n=t.createElement("base"),i=t.createElement("a");return t.head.appendChild(n),t.body.appendChild(i),a&&(n.href=a),i.href=e,i.href}const to=(()=>{let e=0;const a=()=>`0000${(Math.random()*36**4<<0).toString(36)}`.slice(-4);return()=>(e+=1,`u${a()}${e}`)})();function Ie(e){const a=[];for(let t=0,n=e.length;t<n;t++)a.push(e[t]);return a}let We=null;function cr(e={}){return We||(e.includeStyleProperties?(We=e.includeStyleProperties,We):(We=Ie(window.getComputedStyle(document.documentElement)),We))}function vt(e,a){const n=(e.ownerDocument.defaultView||window).getComputedStyle(e).getPropertyValue(a);return n?parseFloat(n.replace("px","")):0}function ao(e){const a=vt(e,"border-left-width"),t=vt(e,"border-right-width");return e.clientWidth+a+t}function ro(e){const a=vt(e,"border-top-width"),t=vt(e,"border-bottom-width");return e.clientHeight+a+t}function lr(e,a={}){const t=a.width||ao(e),n=a.height||ro(e);return{width:t,height:n}}function no(){let e,a;try{a=process}catch{}const t=a&&a.env?a.env.devicePixelRatio:null;return t&&(e=parseInt(t,10),Number.isNaN(e)&&(e=1)),e||window.devicePixelRatio||1}const ze=16384;function so(e){(e.width>ze||e.height>ze)&&(e.width>ze&&e.height>ze?e.width>e.height?(e.height*=ze/e.width,e.width=ze):(e.width*=ze/e.height,e.height=ze):e.width>ze?(e.height*=ze/e.width,e.width=ze):(e.width*=ze/e.height,e.height=ze))}function zt(e){return new Promise((a,t)=>{const n=new Image;n.onload=()=>{n.decode().then(()=>{requestAnimationFrame(()=>a(n))})},n.onerror=t,n.crossOrigin="anonymous",n.decoding="async",n.src=e})}async function io(e){return Promise.resolve().then(()=>new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then(a=>`data:image/svg+xml;charset=utf-8,${a}`)}async function oo(e,a,t){const n="http://www.w3.org/2000/svg",i=document.createElementNS(n,"svg"),s=document.createElementNS(n,"foreignObject");return i.setAttribute("width",`${a}`),i.setAttribute("height",`${t}`),i.setAttribute("viewBox",`0 0 ${a} ${t}`),s.setAttribute("width","100%"),s.setAttribute("height","100%"),s.setAttribute("x","0"),s.setAttribute("y","0"),s.setAttribute("externalResourcesRequired","true"),i.appendChild(s),s.appendChild(e),io(i)}const ve=(e,a)=>{if(e instanceof a)return!0;const t=Object.getPrototypeOf(e);return t===null?!1:t.constructor.name===a.name||ve(t,a)};function co(e){const a=e.getPropertyValue("content");return`${e.cssText} content: '${a.replace(/'|"/g,"")}';`}function lo(e,a){return cr(a).map(t=>{const n=e.getPropertyValue(t),i=e.getPropertyPriority(t);return`${t}: ${n}${i?" !important":""};`}).join(" ")}function po(e,a,t,n){const i=`.${e}:${a}`,s=t.cssText?co(t):lo(t,n);return document.createTextNode(`${i}{${s}}`)}function za(e,a,t,n){const i=window.getComputedStyle(e,t),s=i.getPropertyValue("content");if(s===""||s==="none")return;const r=to();try{a.className=`${a.className} ${r}`}catch{return}const o=document.createElement("style");o.appendChild(po(r,t,i,n)),a.appendChild(o)}function uo(e,a,t){za(e,a,":before",t),za(e,a,":after",t)}const Sa="application/font-woff",Pa="image/jpeg",fo={woff:Sa,woff2:Sa,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:Pa,jpeg:Pa,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml",webp:"image/webp"};function yo(e){const a=/\.([^./]*?)$/g.exec(e);return a?a[1]:""}function Kt(e){const a=yo(e).toLowerCase();return fo[a]||""}function mo(e){return e.split(/,/)[1]}function Gt(e){return e.search(/^(data:)/)!==-1}function ho(e,a){return`data:${a};base64,${e}`}async function dr(e,a,t){const n=await fetch(e,a);if(n.status===404)throw new Error(`Resource "${n.url}" not found`);const i=await n.blob();return new Promise((s,r)=>{const o=new FileReader;o.onerror=r,o.onloadend=()=>{try{s(t({res:n,result:o.result}))}catch(l){r(l)}},o.readAsDataURL(i)})}const At={};function go(e,a,t){let n=e.replace(/\?.*/,"");return t&&(n=e),/ttf|otf|eot|woff2?/i.test(n)&&(n=n.replace(/.*\//,"")),a?`[${a}]${n}`:n}async function Qt(e,a,t){const n=go(e,a,t.includeQueryParams);if(At[n]!=null)return At[n];t.cacheBust&&(e+=(/\?/.test(e)?"&":"?")+new Date().getTime());let i;try{const s=await dr(e,t.fetchRequestInit,({res:r,result:o})=>(a||(a=r.headers.get("Content-Type")||""),mo(o)));i=ho(s,a)}catch(s){i=t.imagePlaceholder||"";let r=`Failed to fetch resource: ${e}`;s&&(r=typeof s=="string"?s:s.message),r&&console.warn(r)}return At[n]=i,i}async function bo(e){const a=e.toDataURL();return a==="data:,"?e.cloneNode(!1):zt(a)}async function wo(e,a){if(e.currentSrc){const s=document.createElement("canvas"),r=s.getContext("2d");s.width=e.clientWidth,s.height=e.clientHeight,r?.drawImage(e,0,0,s.width,s.height);const o=s.toDataURL();return zt(o)}const t=e.poster,n=Kt(t),i=await Qt(t,n,a);return zt(i)}async function ko(e,a){var t;try{if(!((t=e?.contentDocument)===null||t===void 0)&&t.body)return await jt(e.contentDocument.body,a,!0)}catch{}return e.cloneNode(!1)}async function xo(e,a){return ve(e,HTMLCanvasElement)?bo(e):ve(e,HTMLVideoElement)?wo(e,a):ve(e,HTMLIFrameElement)?ko(e,a):e.cloneNode(pr(e))}const vo=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SLOT",pr=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SVG";async function zo(e,a,t){var n,i;if(pr(a))return a;let s=[];return vo(e)&&e.assignedNodes?s=Ie(e.assignedNodes()):ve(e,HTMLIFrameElement)&&(!((n=e.contentDocument)===null||n===void 0)&&n.body)?s=Ie(e.contentDocument.body.childNodes):s=Ie(((i=e.shadowRoot)!==null&&i!==void 0?i:e).childNodes),s.length===0||ve(e,HTMLVideoElement)||await s.reduce((r,o)=>r.then(()=>jt(o,t)).then(l=>{l&&a.appendChild(l)}),Promise.resolve()),a}function So(e,a,t){const n=a.style;if(!n)return;const i=window.getComputedStyle(e);i.cssText?(n.cssText=i.cssText,n.transformOrigin=i.transformOrigin):cr(t).forEach(s=>{let r=i.getPropertyValue(s);s==="font-size"&&r.endsWith("px")&&(r=`${Math.floor(parseFloat(r.substring(0,r.length-2)))-.1}px`),ve(e,HTMLIFrameElement)&&s==="display"&&r==="inline"&&(r="block"),s==="d"&&a.getAttribute("d")&&(r=`path(${a.getAttribute("d")})`),n.setProperty(s,r,i.getPropertyPriority(s))})}function Po(e,a){ve(e,HTMLTextAreaElement)&&(a.innerHTML=e.value),ve(e,HTMLInputElement)&&a.setAttribute("value",e.value)}function Co(e,a){if(ve(e,HTMLSelectElement)){const n=Array.from(a.children).find(i=>e.value===i.getAttribute("value"));n&&n.setAttribute("selected","")}}function Mo(e,a,t){return ve(a,Element)&&(So(e,a,t),uo(e,a,t),Po(e,a),Co(e,a)),a}async function Eo(e,a){const t=e.querySelectorAll?e.querySelectorAll("use"):[];if(t.length===0)return e;const n={};for(let s=0;s<t.length;s++){const o=t[s].getAttribute("xlink:href");if(o){const l=e.querySelector(o),m=document.querySelector(o);!l&&m&&!n[o]&&(n[o]=await jt(m,a,!0))}}const i=Object.values(n);if(i.length){const s="http://www.w3.org/1999/xhtml",r=document.createElementNS(s,"svg");r.setAttribute("xmlns",s),r.style.position="absolute",r.style.width="0",r.style.height="0",r.style.overflow="hidden",r.style.display="none";const o=document.createElementNS(s,"defs");r.appendChild(o);for(let l=0;l<i.length;l++)o.appendChild(i[l]);e.appendChild(r)}return e}async function jt(e,a,t){return!t&&a.filter&&!a.filter(e)?null:Promise.resolve(e).then(n=>xo(n,a)).then(n=>zo(e,n,a)).then(n=>Mo(e,n,a)).then(n=>Eo(n,a))}const ur=/url\((['"]?)([^'"]+?)\1\)/g,_o=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,$o=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function Ro(e){const a=e.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1");return new RegExp(`(url\\(['"]?)(${a})(['"]?\\))`,"g")}function jo(e){const a=[];return e.replace(ur,(t,n,i)=>(a.push(i),t)),a.filter(t=>!Gt(t))}async function Do(e,a,t,n,i){try{const s=t?eo(a,t):a,r=Kt(a);let o;return i||(o=await Qt(s,r,n)),e.replace(Ro(a),`$1${o}$3`)}catch{}return e}function Io(e,{preferredFontFormat:a}){return a?e.replace($o,t=>{for(;;){const[n,,i]=_o.exec(t)||[];if(!i)return"";if(i===a)return`src: ${n};`}}):e}function fr(e){return e.search(ur)!==-1}async function yr(e,a,t){if(!fr(e))return e;const n=Io(e,t);return jo(n).reduce((s,r)=>s.then(o=>Do(o,r,a,t)),Promise.resolve(n))}async function Xe(e,a,t){var n;const i=(n=a.style)===null||n===void 0?void 0:n.getPropertyValue(e);if(i){const s=await yr(i,null,t);return a.style.setProperty(e,s,a.style.getPropertyPriority(e)),!0}return!1}async function No(e,a){await Xe("background",e,a)||await Xe("background-image",e,a),await Xe("mask",e,a)||await Xe("-webkit-mask",e,a)||await Xe("mask-image",e,a)||await Xe("-webkit-mask-image",e,a)}async function Ao(e,a){const t=ve(e,HTMLImageElement);if(!(t&&!Gt(e.src))&&!(ve(e,SVGImageElement)&&!Gt(e.href.baseVal)))return;const n=t?e.src:e.href.baseVal,i=await Qt(n,Kt(n),a);await new Promise((s,r)=>{e.onload=s,e.onerror=a.onImageErrorHandler?(...l)=>{try{s(a.onImageErrorHandler(...l))}catch(m){r(m)}}:r;const o=e;o.decode&&(o.decode=s),o.loading==="lazy"&&(o.loading="eager"),t?(e.srcset="",e.src=i):e.href.baseVal=i})}async function Lo(e,a){const n=Ie(e.childNodes).map(i=>mr(i,a));await Promise.all(n).then(()=>e)}async function mr(e,a){ve(e,Element)&&(await No(e,a),await Ao(e,a),await Lo(e,a))}function Bo(e,a){const{style:t}=e;a.backgroundColor&&(t.backgroundColor=a.backgroundColor),a.width&&(t.width=`${a.width}px`),a.height&&(t.height=`${a.height}px`);const n=a.style;return n!=null&&Object.keys(n).forEach(i=>{t[i]=n[i]}),e}const Ca={};async function Ma(e){let a=Ca[e];if(a!=null)return a;const n=await(await fetch(e)).text();return a={url:e,cssText:n},Ca[e]=a,a}async function Ea(e,a){let t=e.cssText;const n=/url\(["']?([^"')]+)["']?\)/g,s=(t.match(/url\([^)]+\)/g)||[]).map(async r=>{let o=r.replace(n,"$1");return o.startsWith("https://")||(o=new URL(o,e.url).href),dr(o,a.fetchRequestInit,({result:l})=>(t=t.replace(r,`url(${l})`),[r,l]))});return Promise.all(s).then(()=>t)}function _a(e){if(e==null)return[];const a=[],t=/(\/\*[\s\S]*?\*\/)/gi;let n=e.replace(t,"");const i=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");for(;;){const l=i.exec(n);if(l===null)break;a.push(l[0])}n=n.replace(i,"");const s=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,r="((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",o=new RegExp(r,"gi");for(;;){let l=s.exec(n);if(l===null){if(l=o.exec(n),l===null)break;s.lastIndex=o.lastIndex}else o.lastIndex=s.lastIndex;a.push(l[0])}return a}async function Oo(e,a){const t=[],n=[];return e.forEach(i=>{if("cssRules"in i)try{Ie(i.cssRules||[]).forEach((s,r)=>{if(s.type===CSSRule.IMPORT_RULE){let o=r+1;const l=s.href,m=Ma(l).then(y=>Ea(y,a)).then(y=>_a(y).forEach(d=>{try{i.insertRule(d,d.startsWith("@import")?o+=1:i.cssRules.length)}catch(w){console.error("Error inserting rule from remote css",{rule:d,error:w})}})).catch(y=>{console.error("Error loading remote css",y.toString())});n.push(m)}})}catch(s){const r=e.find(o=>o.href==null)||document.styleSheets[0];i.href!=null&&n.push(Ma(i.href).then(o=>Ea(o,a)).then(o=>_a(o).forEach(l=>{r.insertRule(l,r.cssRules.length)})).catch(o=>{console.error("Error loading remote stylesheet",o)})),console.error("Error inlining remote css file",s)}}),Promise.all(n).then(()=>(e.forEach(i=>{if("cssRules"in i)try{Ie(i.cssRules||[]).forEach(s=>{t.push(s)})}catch(s){console.error(`Error while reading CSS rules from ${i.href}`,s)}}),t))}function To(e){return e.filter(a=>a.type===CSSRule.FONT_FACE_RULE).filter(a=>fr(a.style.getPropertyValue("src")))}async function Fo(e,a){if(e.ownerDocument==null)throw new Error("Provided element is not within a Document");const t=Ie(e.ownerDocument.styleSheets),n=await Oo(t,a);return To(n)}function hr(e){return e.trim().replace(/["']/g,"")}function qo(e){const a=new Set;function t(n){(n.style.fontFamily||getComputedStyle(n).fontFamily).split(",").forEach(s=>{a.add(hr(s))}),Array.from(n.children).forEach(s=>{s instanceof HTMLElement&&t(s)})}return t(e),a}async function Wo(e,a){const t=await Fo(e,a),n=qo(e);return(await Promise.all(t.filter(s=>n.has(hr(s.style.fontFamily))).map(s=>{const r=s.parentStyleSheet?s.parentStyleSheet.href:null;return yr(s.cssText,r,a)}))).join(`
`)}async function Xo(e,a){const t=a.fontEmbedCSS!=null?a.fontEmbedCSS:a.skipFonts?null:await Wo(e,a);if(t){const n=document.createElement("style"),i=document.createTextNode(t);n.appendChild(i),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n)}}async function Uo(e,a={}){const{width:t,height:n}=lr(e,a),i=await jt(e,a,!0);return await Xo(i,a),await mr(i,a),Bo(i,a),await oo(i,t,n)}async function Go(e,a={}){const{width:t,height:n}=lr(e,a),i=await Uo(e,a),s=await zt(i),r=document.createElement("canvas"),o=r.getContext("2d"),l=a.pixelRatio||no(),m=a.canvasWidth||t,y=a.canvasHeight||n;return r.width=m*l,r.height=y*l,a.skipAutoScale||so(r),r.style.width=`${m}`,r.style.height=`${y}`,a.backgroundColor&&(o.fillStyle=a.backgroundColor,o.fillRect(0,0,r.width,r.height)),o.drawImage(s,0,0,r.width,r.height),r}var Yo={trailer:59};function gr(e=256){let a=0,t=new Uint8Array(e);return{get buffer(){return t.buffer},reset(){a=0},bytesView(){return t.subarray(0,a)},bytes(){return t.slice(0,a)},writeByte(i){n(a+1),t[a]=i,a++},writeBytes(i,s=0,r=i.length){n(a+r);for(let o=0;o<r;o++)t[a++]=i[o+s]},writeBytesView(i,s=0,r=i.byteLength){n(a+r),t.set(i.subarray(s,s+r),a),a+=r}};function n(i){var s=t.length;if(s>=i)return;var r=1024*1024;i=Math.max(i,s*(s<r?2:1.125)>>>0),s!=0&&(i=Math.max(i,256));let o=t;t=new Uint8Array(i),a>0&&t.set(o.subarray(0,a),0)}}var Lt=12,$a=5003,Ho=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function Zo(e,a,t,n,i=gr(512),s=new Uint8Array(256),r=new Int32Array($a),o=new Int32Array($a)){let l=r.length,m=Math.max(2,n);s.fill(0),o.fill(0),r.fill(-1);let y=0,d=0,w=m+1,u=w,b=!1,f=u,h=(1<<f)-1,g=1<<w-1,v=g+1,S=g+2,P=0,M=t[0],I=0;for(let E=l;E<65536;E*=2)++I;I=8-I,i.writeByte(m),B(g);let $=t.length;for(let E=1;E<$;E++)e:{let q=t[E],K=(q<<Lt)+M,z=q<<I^M;if(r[z]===K){M=o[z];break e}let N=z===0?1:l-z;for(;r[z]>=0;)if(z-=N,z<0&&(z+=l),r[z]===K){M=o[z];break e}B(M),M=q,S<1<<Lt?(o[z]=S++,r[z]=K):(r.fill(-1),S=g+2,b=!0,B(g))}return B(M),B(v),i.writeByte(0),i.bytesView();function B(E){for(y&=Ho[d],d>0?y|=E<<d:y=E,d+=f;d>=8;)s[P++]=y&255,P>=254&&(i.writeByte(P),i.writeBytesView(s,0,P),P=0),y>>=8,d-=8;if((S>h||b)&&(b?(f=u,h=(1<<f)-1,b=!1):(++f,h=f===Lt?1<<f:(1<<f)-1)),E==v){for(;d>0;)s[P++]=y&255,P>=254&&(i.writeByte(P),i.writeBytesView(s,0,P),P=0),y>>=8,d-=8;P>0&&(i.writeByte(P),i.writeBytesView(s,0,P),P=0)}}}var Jo=Zo;function br(e,a,t){return e<<8&63488|a<<2&992|t>>3}function wr(e,a,t,n){return e>>4|a&240|(t&240)<<4|(n&240)<<8}function kr(e,a,t){return e>>4<<8|a&240|t>>4}function ut(e,a,t){return e<a?a:e>t?t:e}function kt(e){return e*e}function Ra(e,a,t){var n=0,i=1e100;let s=e[a],r=s.cnt;s.ac;let o=s.rc,l=s.gc,m=s.bc;for(var y=s.fw;y!=0;y=e[y].fw){let w=e[y],u=w.cnt,b=r*u/(r+u);if(!(b>=i)){var d=0;d+=b*kt(w.rc-o),!(d>=i)&&(d+=b*kt(w.gc-l),!(d>=i)&&(d+=b*kt(w.bc-m),!(d>=i)&&(i=d,n=y)))}}s.err=i,s.nn=n}function Bt(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function Vo(e,a){let t=a==="rgb444"?4096:65536,n=new Array(t),i=e.length;if(a==="rgba4444")for(let s=0;s<i;++s){let r=e[s],o=r>>24&255,l=r>>16&255,m=r>>8&255,y=r&255,d=wr(y,m,l,o),w=d in n?n[d]:n[d]=Bt();w.rc+=y,w.gc+=m,w.bc+=l,w.ac+=o,w.cnt++}else if(a==="rgb444")for(let s=0;s<i;++s){let r=e[s],o=r>>16&255,l=r>>8&255,m=r&255,y=kr(m,l,o),d=y in n?n[y]:n[y]=Bt();d.rc+=m,d.gc+=l,d.bc+=o,d.cnt++}else for(let s=0;s<i;++s){let r=e[s],o=r>>16&255,l=r>>8&255,m=r&255,y=br(m,l,o),d=y in n?n[y]:n[y]=Bt();d.rc+=m,d.gc+=l,d.bc+=o,d.cnt++}return n}function Ko(e,a,t={}){let{format:n="rgb565",clearAlpha:i=!0,clearAlphaColor:s=0,clearAlphaThreshold:r=0,oneBitAlpha:o=!1}=t;if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");let l=new Uint32Array(e.buffer),m=t.useSqrt!==!1,y=n==="rgba4444",d=Vo(l,n),w=d.length,u=w-1,b=new Uint32Array(w+1);for(var f=0,h=0;h<w;++h){let p=d[h];if(p!=null){var g=1/p.cnt;y&&(p.ac*=g),p.rc*=g,p.gc*=g,p.bc*=g,d[f++]=p}}kt(a)/f<.022&&(m=!1);for(var h=0;h<f-1;++h)d[h].fw=h+1,d[h+1].bk=h,m&&(d[h].cnt=Math.sqrt(d[h].cnt));m&&(d[h].cnt=Math.sqrt(d[h].cnt));var v,S,P;for(h=0;h<f;++h){Ra(d,h);var M=d[h].err;for(S=++b[0];S>1&&(P=S>>1,!(d[v=b[P]].err<=M));S=P)b[S]=v;b[S]=h}var I=f-a;for(h=0;h<I;){for(var $;;){var B=b[1];if($=d[B],$.tm>=$.mtm&&d[$.nn].mtm<=$.tm)break;$.mtm==u?B=b[1]=b[b[0]--]:(Ra(d,B),$.tm=h);var M=d[B].err;for(S=1;(P=S+S)<=b[0]&&(P<b[0]&&d[b[P]].err>d[b[P+1]].err&&P++,!(M<=d[v=b[P]].err));S=P)b[S]=v;b[S]=B}var E=d[$.nn],q=$.cnt,K=E.cnt,g=1/(q+K);y&&($.ac=g*(q*$.ac+K*E.ac)),$.rc=g*(q*$.rc+K*E.rc),$.gc=g*(q*$.gc+K*E.gc),$.bc=g*(q*$.bc+K*E.bc),$.cnt+=E.cnt,$.mtm=++h,d[E.bk].fw=E.fw,d[E.fw].bk=E.bk,E.mtm=u}let z=[];var N=0;for(h=0;;++N){let p=ut(Math.round(d[h].rc),0,255),O=ut(Math.round(d[h].gc),0,255),ee=ut(Math.round(d[h].bc),0,255),F=255;y&&(F=ut(Math.round(d[h].ac),0,255),o&&(F=F<=(typeof o=="number"?o:127)?0:255),i&&F<=r&&(p=O=ee=s,F=0));let se=y?[p,O,ee,F]:[p,O,ee];if(Qo(z,se)||z.push(se),(h=d[h].fw)==0)break}return z}function Qo(e,a){for(let t=0;t<e.length;t++){let n=e[t],i=n[0]===a[0]&&n[1]===a[1]&&n[2]===a[2],s=n.length>=4&&a.length>=4?n[3]===a[3]:!0;if(i&&s)return!0}return!1}function ec(e,a,t="rgb565"){if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");if(a.length>256)throw new Error("applyPalette() only works with 256 colors or less");let n=new Uint32Array(e.buffer),i=n.length,s=t==="rgb444"?4096:65536,r=new Uint8Array(i),o=new Array(s);if(t==="rgba4444")for(let l=0;l<i;l++){let m=n[l],y=m>>24&255,d=m>>16&255,w=m>>8&255,u=m&255,b=wr(u,w,d,y),f=b in o?o[b]:o[b]=tc(u,w,d,y,a);r[l]=f}else{let l=t==="rgb444"?kr:br;for(let m=0;m<i;m++){let y=n[m],d=y>>16&255,w=y>>8&255,u=y&255,b=l(u,w,d),f=b in o?o[b]:o[b]=ac(u,w,d,a);r[m]=f}}return r}function tc(e,a,t,n,i){let s=0,r=1e100;for(let o=0;o<i.length;o++){let l=i[o],m=l[3],y=Ae(m-n);if(y>r)continue;let d=l[0];if(y+=Ae(d-e),y>r)continue;let w=l[1];if(y+=Ae(w-a),y>r)continue;let u=l[2];y+=Ae(u-t),!(y>r)&&(r=y,s=o)}return s}function ac(e,a,t,n){let i=0,s=1e100;for(let r=0;r<n.length;r++){let o=n[r],l=o[0],m=Ae(l-e);if(m>s)continue;let y=o[1];if(m+=Ae(y-a),m>s)continue;let d=o[2];m+=Ae(d-t),!(m>s)&&(s=m,i=r)}return i}function Ae(e){return e*e}function rc(e={}){let{initialCapacity:a=4096,auto:t=!0}=e,n=gr(a),i=5003,s=new Uint8Array(256),r=new Int32Array(i),o=new Int32Array(i),l=!1;return{reset(){n.reset(),l=!1},finish(){n.writeByte(Yo.trailer)},bytes(){return n.bytes()},bytesView(){return n.bytesView()},get buffer(){return n.buffer},get stream(){return n},writeHeader:m,writeFrame(y,d,w,u={}){let{transparent:b=!1,transparentIndex:f=0,delay:h=0,palette:g=null,repeat:v=0,colorDepth:S=8,dispose:P=-1}=u,M=!1;if(t?l||(M=!0,m(),l=!0):M=!!u.first,d=Math.max(0,Math.floor(d)),w=Math.max(0,Math.floor(w)),M){if(!g)throw new Error("First frame must include a { palette } option");sc(n,d,w,g,S),ja(n,g),v>=0&&ic(n,v)}let I=Math.round(h/10);nc(n,P,I,b,f);let $=!!g&&!M;oc(n,d,w,$?g:null),$&&ja(n,g),cc(n,y,d,w,S,s,r,o)}};function m(){xr(n,"GIF89a")}}function nc(e,a,t,n,i){e.writeByte(33),e.writeByte(249),e.writeByte(4),i<0&&(i=0,n=!1);var s,r;n?(s=1,r=2):(s=0,r=0),a>=0&&(r=a&7),r<<=2,e.writeByte(0|r|0|s),je(e,t),e.writeByte(i||0),e.writeByte(0)}function sc(e,a,t,n,i=8){let s=1,r=0,o=ea(n.length)-1,l=s<<7|i-1<<4|r<<3|o;je(e,a),je(e,t),e.writeBytes([l,0,0])}function ic(e,a){e.writeByte(33),e.writeByte(255),e.writeByte(11),xr(e,"NETSCAPE2.0"),e.writeByte(3),e.writeByte(1),je(e,a),e.writeByte(0)}function ja(e,a){let t=1<<ea(a.length);for(let n=0;n<t;n++){let i=[0,0,0];n<a.length&&(i=a[n]),e.writeByte(i[0]),e.writeByte(i[1]),e.writeByte(i[2])}}function oc(e,a,t,n){if(e.writeByte(44),je(e,0),je(e,0),je(e,a),je(e,t),n){let i=0,s=0,r=ea(n.length)-1;e.writeByte(128|i|s|0|r)}else e.writeByte(0)}function cc(e,a,t,n,i=8,s,r,o){Jo(t,n,a,i,e,s,r,o)}function je(e,a){e.writeByte(a&255),e.writeByte(a>>8&255)}function xr(e,a){for(var t=0;t<a.length;t++)e.writeByte(a.charCodeAt(t))}function ea(e){return Math.max(Math.ceil(Math.log2(e)),1)}var ft=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function lc(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function yt(e){throw new Error('Could not dynamically require "'+e+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var Ot={exports:{}};var Da;function dc(){return Da||(Da=1,(function(e,a){(function(t){e.exports=t()})(function(){return(function t(n,i,s){function r(m,y){if(!i[m]){if(!n[m]){var d=typeof yt=="function"&&yt;if(!y&&d)return d(m,!0);if(o)return o(m,!0);var w=new Error("Cannot find module '"+m+"'");throw w.code="MODULE_NOT_FOUND",w}var u=i[m]={exports:{}};n[m][0].call(u.exports,function(b){var f=n[m][1][b];return r(f||b)},u,u.exports,t,n,i,s)}return i[m].exports}for(var o=typeof yt=="function"&&yt,l=0;l<s.length;l++)r(s[l]);return r})({1:[function(t,n,i){var s=t("./utils"),r=t("./support"),o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";i.encode=function(l){for(var m,y,d,w,u,b,f,h=[],g=0,v=l.length,S=v,P=s.getTypeOf(l)!=="string";g<l.length;)S=v-g,d=P?(m=l[g++],y=g<v?l[g++]:0,g<v?l[g++]:0):(m=l.charCodeAt(g++),y=g<v?l.charCodeAt(g++):0,g<v?l.charCodeAt(g++):0),w=m>>2,u=(3&m)<<4|y>>4,b=1<S?(15&y)<<2|d>>6:64,f=2<S?63&d:64,h.push(o.charAt(w)+o.charAt(u)+o.charAt(b)+o.charAt(f));return h.join("")},i.decode=function(l){var m,y,d,w,u,b,f=0,h=0,g="data:";if(l.substr(0,g.length)===g)throw new Error("Invalid base64 input, it looks like a data url.");var v,S=3*(l=l.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(l.charAt(l.length-1)===o.charAt(64)&&S--,l.charAt(l.length-2)===o.charAt(64)&&S--,S%1!=0)throw new Error("Invalid base64 input, bad content length.");for(v=r.uint8array?new Uint8Array(0|S):new Array(0|S);f<l.length;)m=o.indexOf(l.charAt(f++))<<2|(w=o.indexOf(l.charAt(f++)))>>4,y=(15&w)<<4|(u=o.indexOf(l.charAt(f++)))>>2,d=(3&u)<<6|(b=o.indexOf(l.charAt(f++))),v[h++]=m,u!==64&&(v[h++]=y),b!==64&&(v[h++]=d);return v}},{"./support":30,"./utils":32}],2:[function(t,n,i){var s=t("./external"),r=t("./stream/DataWorker"),o=t("./stream/Crc32Probe"),l=t("./stream/DataLengthProbe");function m(y,d,w,u,b){this.compressedSize=y,this.uncompressedSize=d,this.crc32=w,this.compression=u,this.compressedContent=b}m.prototype={getContentWorker:function(){var y=new r(s.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new l("data_length")),d=this;return y.on("end",function(){if(this.streamInfo.data_length!==d.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),y},getCompressedWorker:function(){return new r(s.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},m.createWorkerFrom=function(y,d,w){return y.pipe(new o).pipe(new l("uncompressedSize")).pipe(d.compressWorker(w)).pipe(new l("compressedSize")).withStreamInfo("compression",d)},n.exports=m},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(t,n,i){var s=t("./stream/GenericWorker");i.STORE={magic:"\0\0",compressWorker:function(){return new s("STORE compression")},uncompressWorker:function(){return new s("STORE decompression")}},i.DEFLATE=t("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(t,n,i){var s=t("./utils"),r=(function(){for(var o,l=[],m=0;m<256;m++){o=m;for(var y=0;y<8;y++)o=1&o?3988292384^o>>>1:o>>>1;l[m]=o}return l})();n.exports=function(o,l){return o!==void 0&&o.length?s.getTypeOf(o)!=="string"?(function(m,y,d,w){var u=r,b=w+d;m^=-1;for(var f=w;f<b;f++)m=m>>>8^u[255&(m^y[f])];return-1^m})(0|l,o,o.length,0):(function(m,y,d,w){var u=r,b=w+d;m^=-1;for(var f=w;f<b;f++)m=m>>>8^u[255&(m^y.charCodeAt(f))];return-1^m})(0|l,o,o.length,0):0}},{"./utils":32}],5:[function(t,n,i){i.base64=!1,i.binary=!1,i.dir=!1,i.createFolders=!0,i.date=null,i.compression=null,i.compressionOptions=null,i.comment=null,i.unixPermissions=null,i.dosPermissions=null},{}],6:[function(t,n,i){var s=null;s=typeof Promise<"u"?Promise:t("lie"),n.exports={Promise:s}},{lie:37}],7:[function(t,n,i){var s=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Uint32Array<"u",r=t("pako"),o=t("./utils"),l=t("./stream/GenericWorker"),m=s?"uint8array":"array";function y(d,w){l.call(this,"FlateWorker/"+d),this._pako=null,this._pakoAction=d,this._pakoOptions=w,this.meta={}}i.magic="\b\0",o.inherits(y,l),y.prototype.processChunk=function(d){this.meta=d.meta,this._pako===null&&this._createPako(),this._pako.push(o.transformTo(m,d.data),!1)},y.prototype.flush=function(){l.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},y.prototype.cleanUp=function(){l.prototype.cleanUp.call(this),this._pako=null},y.prototype._createPako=function(){this._pako=new r[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var d=this;this._pako.onData=function(w){d.push({data:w,meta:d.meta})}},i.compressWorker=function(d){return new y("Deflate",d)},i.uncompressWorker=function(){return new y("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(t,n,i){function s(u,b){var f,h="";for(f=0;f<b;f++)h+=String.fromCharCode(255&u),u>>>=8;return h}function r(u,b,f,h,g,v){var S,P,M=u.file,I=u.compression,$=v!==m.utf8encode,B=o.transformTo("string",v(M.name)),E=o.transformTo("string",m.utf8encode(M.name)),q=M.comment,K=o.transformTo("string",v(q)),z=o.transformTo("string",m.utf8encode(q)),N=E.length!==M.name.length,p=z.length!==q.length,O="",ee="",F="",se=M.dir,U=M.date,ne={crc32:0,compressedSize:0,uncompressedSize:0};b&&!f||(ne.crc32=u.crc32,ne.compressedSize=u.compressedSize,ne.uncompressedSize=u.uncompressedSize);var D=0;b&&(D|=8),$||!N&&!p||(D|=2048);var j=0,te=0;se&&(j|=16),g==="UNIX"?(te=798,j|=(function(H,fe){var he=H;return H||(he=fe?16893:33204),(65535&he)<<16})(M.unixPermissions,se)):(te=20,j|=(function(H){return 63&(H||0)})(M.dosPermissions)),S=U.getUTCHours(),S<<=6,S|=U.getUTCMinutes(),S<<=5,S|=U.getUTCSeconds()/2,P=U.getUTCFullYear()-1980,P<<=4,P|=U.getUTCMonth()+1,P<<=5,P|=U.getUTCDate(),N&&(ee=s(1,1)+s(y(B),4)+E,O+="up"+s(ee.length,2)+ee),p&&(F=s(1,1)+s(y(K),4)+z,O+="uc"+s(F.length,2)+F);var J="";return J+=`
\0`,J+=s(D,2),J+=I.magic,J+=s(S,2),J+=s(P,2),J+=s(ne.crc32,4),J+=s(ne.compressedSize,4),J+=s(ne.uncompressedSize,4),J+=s(B.length,2),J+=s(O.length,2),{fileRecord:d.LOCAL_FILE_HEADER+J+B+O,dirRecord:d.CENTRAL_FILE_HEADER+s(te,2)+J+s(K.length,2)+"\0\0\0\0"+s(j,4)+s(h,4)+B+O+K}}var o=t("../utils"),l=t("../stream/GenericWorker"),m=t("../utf8"),y=t("../crc32"),d=t("../signature");function w(u,b,f,h){l.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=b,this.zipPlatform=f,this.encodeFileName=h,this.streamFiles=u,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}o.inherits(w,l),w.prototype.push=function(u){var b=u.meta.percent||0,f=this.entriesCount,h=this._sources.length;this.accumulate?this.contentBuffer.push(u):(this.bytesWritten+=u.data.length,l.prototype.push.call(this,{data:u.data,meta:{currentFile:this.currentFile,percent:f?(b+100*(f-h-1))/f:100}}))},w.prototype.openedSource=function(u){this.currentSourceOffset=this.bytesWritten,this.currentFile=u.file.name;var b=this.streamFiles&&!u.file.dir;if(b){var f=r(u,b,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:f.fileRecord,meta:{percent:0}})}else this.accumulate=!0},w.prototype.closedSource=function(u){this.accumulate=!1;var b=this.streamFiles&&!u.file.dir,f=r(u,b,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(f.dirRecord),b)this.push({data:(function(h){return d.DATA_DESCRIPTOR+s(h.crc32,4)+s(h.compressedSize,4)+s(h.uncompressedSize,4)})(u),meta:{percent:100}});else for(this.push({data:f.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},w.prototype.flush=function(){for(var u=this.bytesWritten,b=0;b<this.dirRecords.length;b++)this.push({data:this.dirRecords[b],meta:{percent:100}});var f=this.bytesWritten-u,h=(function(g,v,S,P,M){var I=o.transformTo("string",M(P));return d.CENTRAL_DIRECTORY_END+"\0\0\0\0"+s(g,2)+s(g,2)+s(v,4)+s(S,4)+s(I.length,2)+I})(this.dirRecords.length,f,u,this.zipComment,this.encodeFileName);this.push({data:h,meta:{percent:100}})},w.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},w.prototype.registerPrevious=function(u){this._sources.push(u);var b=this;return u.on("data",function(f){b.processChunk(f)}),u.on("end",function(){b.closedSource(b.previous.streamInfo),b._sources.length?b.prepareNextSource():b.end()}),u.on("error",function(f){b.error(f)}),this},w.prototype.resume=function(){return!!l.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},w.prototype.error=function(u){var b=this._sources;if(!l.prototype.error.call(this,u))return!1;for(var f=0;f<b.length;f++)try{b[f].error(u)}catch{}return!0},w.prototype.lock=function(){l.prototype.lock.call(this);for(var u=this._sources,b=0;b<u.length;b++)u[b].lock()},n.exports=w},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(t,n,i){var s=t("../compressions"),r=t("./ZipFileWorker");i.generateWorker=function(o,l,m){var y=new r(l.streamFiles,m,l.platform,l.encodeFileName),d=0;try{o.forEach(function(w,u){d++;var b=(function(v,S){var P=v||S,M=s[P];if(!M)throw new Error(P+" is not a valid compression method !");return M})(u.options.compression,l.compression),f=u.options.compressionOptions||l.compressionOptions||{},h=u.dir,g=u.date;u._compressWorker(b,f).withStreamInfo("file",{name:w,dir:h,date:g,comment:u.comment||"",unixPermissions:u.unixPermissions,dosPermissions:u.dosPermissions}).pipe(y)}),y.entriesCount=d}catch(w){y.error(w)}return y}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(t,n,i){function s(){if(!(this instanceof s))return new s;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var r=new s;for(var o in this)typeof this[o]!="function"&&(r[o]=this[o]);return r}}(s.prototype=t("./object")).loadAsync=t("./load"),s.support=t("./support"),s.defaults=t("./defaults"),s.version="3.10.2",s.loadAsync=function(r,o){return new s().loadAsync(r,o)},s.external=t("./external"),n.exports=s},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(t,n,i){var s=t("./utils"),r=t("./external"),o=t("./utf8"),l=t("./zipEntries"),m=t("./stream/Crc32Probe"),y=t("./nodejsUtils");function d(w){return new r.Promise(function(u,b){var f=w.decompressed.getContentWorker().pipe(new m);f.on("error",function(h){b(h)}).on("end",function(){f.streamInfo.crc32!==w.decompressed.crc32?b(new Error("Corrupted zip : CRC32 mismatch")):u()}).resume()})}n.exports=function(w,u){var b=this;return u=s.extend(u||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),y.isNode&&y.isStream(w)?r.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):s.prepareContent("the loaded zip file",w,!0,u.optimizedBinaryString,u.base64).then(function(f){var h=new l(u);return h.load(f),h}).then(function(f){var h=[r.Promise.resolve(f)],g=f.files;if(u.checkCRC32)for(var v=0;v<g.length;v++)h.push(d(g[v]));return r.Promise.all(h)}).then(function(f){for(var h=f.shift(),g=h.files,v=0;v<g.length;v++){var S=g[v],P=S.fileNameStr,M=s.resolve(S.fileNameStr);b.file(M,S.decompressed,{binary:!0,optimizedBinaryString:!0,date:S.date,dir:S.dir,comment:S.fileCommentStr.length?S.fileCommentStr:null,unixPermissions:S.unixPermissions,dosPermissions:S.dosPermissions,createFolders:u.createFolders}),S.dir||(b.file(M).unsafeOriginalName=P)}return h.zipComment.length&&(b.comment=h.zipComment),b})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(t,n,i){var s=t("../utils"),r=t("../stream/GenericWorker");function o(l,m){r.call(this,"Nodejs stream input adapter for "+l),this._upstreamEnded=!1,this._bindStream(m)}s.inherits(o,r),o.prototype._bindStream=function(l){var m=this;(this._stream=l).pause(),l.on("data",function(y){m.push({data:y,meta:{percent:0}})}).on("error",function(y){m.isPaused?this.generatedError=y:m.error(y)}).on("end",function(){m.isPaused?m._upstreamEnded=!0:m.end()})},o.prototype.pause=function(){return!!r.prototype.pause.call(this)&&(this._stream.pause(),!0)},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},n.exports=o},{"../stream/GenericWorker":28,"../utils":32}],13:[function(t,n,i){var s=t("readable-stream").Readable;function r(o,l,m){s.call(this,l),this._helper=o;var y=this;o.on("data",function(d,w){y.push(d)||y._helper.pause(),m&&m(w)}).on("error",function(d){y.emit("error",d)}).on("end",function(){y.push(null)})}t("../utils").inherits(r,s),r.prototype._read=function(){this._helper.resume()},n.exports=r},{"../utils":32,"readable-stream":16}],14:[function(t,n,i){n.exports={isNode:typeof Buffer<"u",newBufferFrom:function(s,r){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(s,r);if(typeof s=="number")throw new Error('The "data" argument must not be a number');return new Buffer(s,r)},allocBuffer:function(s){if(Buffer.alloc)return Buffer.alloc(s);var r=new Buffer(s);return r.fill(0),r},isBuffer:function(s){return Buffer.isBuffer(s)},isStream:function(s){return s&&typeof s.on=="function"&&typeof s.pause=="function"&&typeof s.resume=="function"}}},{}],15:[function(t,n,i){function s(M,I,$){var B,E=o.getTypeOf(I),q=o.extend($||{},y);q.date=q.date||new Date,q.compression!==null&&(q.compression=q.compression.toUpperCase()),typeof q.unixPermissions=="string"&&(q.unixPermissions=parseInt(q.unixPermissions,8)),q.unixPermissions&&16384&q.unixPermissions&&(q.dir=!0),q.dosPermissions&&16&q.dosPermissions&&(q.dir=!0),q.dir&&(M=g(M)),q.createFolders&&(B=h(M))&&v.call(this,B,!0);var K=E==="string"&&q.binary===!1&&q.base64===!1;$&&$.binary!==void 0||(q.binary=!K),(I instanceof d&&I.uncompressedSize===0||q.dir||!I||I.length===0)&&(q.base64=!1,q.binary=!0,I="",q.compression="STORE",E="string");var z=null;z=I instanceof d||I instanceof l?I:b.isNode&&b.isStream(I)?new f(M,I):o.prepareContent(M,I,q.binary,q.optimizedBinaryString,q.base64);var N=new w(M,z,q);this.files[M]=N}var r=t("./utf8"),o=t("./utils"),l=t("./stream/GenericWorker"),m=t("./stream/StreamHelper"),y=t("./defaults"),d=t("./compressedObject"),w=t("./zipObject"),u=t("./generate"),b=t("./nodejsUtils"),f=t("./nodejs/NodejsStreamInputAdapter"),h=function(M){M.slice(-1)==="/"&&(M=M.substring(0,M.length-1));var I=M.lastIndexOf("/");return 0<I?M.substring(0,I):""},g=function(M){return M.slice(-1)!=="/"&&(M+="/"),M},v=function(M,I){return I=I!==void 0?I:y.createFolders,M=g(M),this.files[M]||s.call(this,M,null,{dir:!0,createFolders:I}),this.files[M]};function S(M){return Object.prototype.toString.call(M)==="[object RegExp]"}var P={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(M){var I,$,B;for(I in this.files)B=this.files[I],($=I.slice(this.root.length,I.length))&&I.slice(0,this.root.length)===this.root&&M($,B)},filter:function(M){var I=[];return this.forEach(function($,B){M($,B)&&I.push(B)}),I},file:function(M,I,$){if(arguments.length!==1)return M=this.root+M,s.call(this,M,I,$),this;if(S(M)){var B=M;return this.filter(function(q,K){return!K.dir&&B.test(q)})}var E=this.files[this.root+M];return E&&!E.dir?E:null},folder:function(M){if(!M)return this;if(S(M))return this.filter(function(E,q){return q.dir&&M.test(E)});var I=this.root+M,$=v.call(this,I),B=this.clone();return B.root=$.name,B},remove:function(M){M=this.root+M;var I=this.files[M];if(I||(M.slice(-1)!=="/"&&(M+="/"),I=this.files[M]),I&&!I.dir)delete this.files[M];else for(var $=this.filter(function(E,q){return q.name.slice(0,M.length)===M}),B=0;B<$.length;B++)delete this.files[$[B].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(M){var I,$={};try{if(($=o.extend(M||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:r.utf8encode})).type=$.type.toLowerCase(),$.compression=$.compression.toUpperCase(),$.type==="binarystring"&&($.type="string"),!$.type)throw new Error("No output type specified.");o.checkSupport($.type),$.platform!=="darwin"&&$.platform!=="freebsd"&&$.platform!=="linux"&&$.platform!=="sunos"||($.platform="UNIX"),$.platform==="win32"&&($.platform="DOS");var B=$.comment||this.comment||"";I=u.generateWorker(this,$,B)}catch(E){(I=new l("error")).error(E)}return new m(I,$.type||"string",$.mimeType)},generateAsync:function(M,I){return this.generateInternalStream(M).accumulate(I)},generateNodeStream:function(M,I){return(M=M||{}).type||(M.type="nodebuffer"),this.generateInternalStream(M).toNodejsStream(I)}};n.exports=P},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(t,n,i){n.exports=t("stream")},{stream:void 0}],17:[function(t,n,i){var s=t("./DataReader");function r(o){s.call(this,o);for(var l=0;l<this.data.length;l++)o[l]=255&o[l]}t("../utils").inherits(r,s),r.prototype.byteAt=function(o){return this.data[this.zero+o]},r.prototype.lastIndexOfSignature=function(o){for(var l=o.charCodeAt(0),m=o.charCodeAt(1),y=o.charCodeAt(2),d=o.charCodeAt(3),w=this.length-4;0<=w;--w)if(this.data[w]===l&&this.data[w+1]===m&&this.data[w+2]===y&&this.data[w+3]===d)return w-this.zero;return-1},r.prototype.readAndCheckSignature=function(o){var l=o.charCodeAt(0),m=o.charCodeAt(1),y=o.charCodeAt(2),d=o.charCodeAt(3),w=this.readData(4);return l===w[0]&&m===w[1]&&y===w[2]&&d===w[3]},r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return[];var l=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,l},n.exports=r},{"../utils":32,"./DataReader":18}],18:[function(t,n,i){var s=t("../utils");function r(o){this.data=o,this.length=o.length,this.index=0,this.zero=0}r.prototype={checkOffset:function(o){this.checkIndex(this.index+o)},checkIndex:function(o){if(this.length<this.zero+o||o<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+o+"). Corrupted zip ?")},setIndex:function(o){this.checkIndex(o),this.index=o},skip:function(o){this.setIndex(this.index+o)},byteAt:function(){},readInt:function(o){var l,m=0;for(this.checkOffset(o),l=this.index+o-1;l>=this.index;l--)m=(m<<8)+this.byteAt(l);return this.index+=o,m},readString:function(o){return s.transformTo("string",this.readData(o))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var o=this.readInt(4);return new Date(Date.UTC(1980+(o>>25&127),(o>>21&15)-1,o>>16&31,o>>11&31,o>>5&63,(31&o)<<1))}},n.exports=r},{"../utils":32}],19:[function(t,n,i){var s=t("./Uint8ArrayReader");function r(o){s.call(this,o)}t("../utils").inherits(r,s),r.prototype.readData=function(o){this.checkOffset(o);var l=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,l},n.exports=r},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(t,n,i){var s=t("./DataReader");function r(o){s.call(this,o)}t("../utils").inherits(r,s),r.prototype.byteAt=function(o){return this.data.charCodeAt(this.zero+o)},r.prototype.lastIndexOfSignature=function(o){return this.data.lastIndexOf(o)-this.zero},r.prototype.readAndCheckSignature=function(o){return o===this.readData(4)},r.prototype.readData=function(o){this.checkOffset(o);var l=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,l},n.exports=r},{"../utils":32,"./DataReader":18}],21:[function(t,n,i){var s=t("./ArrayReader");function r(o){s.call(this,o)}t("../utils").inherits(r,s),r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return new Uint8Array(0);var l=this.data.subarray(this.zero+this.index,this.zero+this.index+o);return this.index+=o,l},n.exports=r},{"../utils":32,"./ArrayReader":17}],22:[function(t,n,i){var s=t("../utils"),r=t("../support"),o=t("./ArrayReader"),l=t("./StringReader"),m=t("./NodeBufferReader"),y=t("./Uint8ArrayReader");n.exports=function(d){var w=s.getTypeOf(d);return s.checkSupport(w),w!=="string"||r.uint8array?w==="nodebuffer"?new m(d):r.uint8array?new y(s.transformTo("uint8array",d)):new o(s.transformTo("array",d)):new l(d)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(t,n,i){i.LOCAL_FILE_HEADER="PK",i.CENTRAL_FILE_HEADER="PK",i.CENTRAL_DIRECTORY_END="PK",i.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x07",i.ZIP64_CENTRAL_DIRECTORY_END="PK",i.DATA_DESCRIPTOR="PK\x07\b"},{}],24:[function(t,n,i){var s=t("./GenericWorker"),r=t("../utils");function o(l){s.call(this,"ConvertWorker to "+l),this.destType=l}r.inherits(o,s),o.prototype.processChunk=function(l){this.push({data:r.transformTo(this.destType,l.data),meta:l.meta})},n.exports=o},{"../utils":32,"./GenericWorker":28}],25:[function(t,n,i){var s=t("./GenericWorker"),r=t("../crc32");function o(){s.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}t("../utils").inherits(o,s),o.prototype.processChunk=function(l){this.streamInfo.crc32=r(l.data,this.streamInfo.crc32||0),this.push(l)},n.exports=o},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(t,n,i){var s=t("../utils"),r=t("./GenericWorker");function o(l){r.call(this,"DataLengthProbe for "+l),this.propName=l,this.withStreamInfo(l,0)}s.inherits(o,r),o.prototype.processChunk=function(l){if(l){var m=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=m+l.data.length}r.prototype.processChunk.call(this,l)},n.exports=o},{"../utils":32,"./GenericWorker":28}],27:[function(t,n,i){var s=t("../utils"),r=t("./GenericWorker");function o(l){r.call(this,"DataWorker");var m=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,l.then(function(y){m.dataIsReady=!0,m.data=y,m.max=y&&y.length||0,m.type=s.getTypeOf(y),m.isPaused||m._tickAndRepeat()},function(y){m.error(y)})}s.inherits(o,r),o.prototype.cleanUp=function(){r.prototype.cleanUp.call(this),this.data=null},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,s.delay(this._tickAndRepeat,[],this)),!0)},o.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(s.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},o.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var l=null,m=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":l=this.data.substring(this.index,m);break;case"uint8array":l=this.data.subarray(this.index,m);break;case"array":case"nodebuffer":l=this.data.slice(this.index,m)}return this.index=m,this.push({data:l,meta:{percent:this.max?this.index/this.max*100:0}})},n.exports=o},{"../utils":32,"./GenericWorker":28}],28:[function(t,n,i){function s(r){this.name=r||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}s.prototype={push:function(r){this.emit("data",r)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(r){this.emit("error",r)}return!0},error:function(r){return!this.isFinished&&(this.isPaused?this.generatedError=r:(this.isFinished=!0,this.emit("error",r),this.previous&&this.previous.error(r),this.cleanUp()),!0)},on:function(r,o){return this._listeners[r].push(o),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(r,o){if(this._listeners[r])for(var l=0;l<this._listeners[r].length;l++)this._listeners[r][l].call(this,o)},pipe:function(r){return r.registerPrevious(this)},registerPrevious:function(r){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=r.streamInfo,this.mergeStreamInfo(),this.previous=r;var o=this;return r.on("data",function(l){o.processChunk(l)}),r.on("end",function(){o.end()}),r.on("error",function(l){o.error(l)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var r=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),r=!0),this.previous&&this.previous.resume(),!r},flush:function(){},processChunk:function(r){this.push(r)},withStreamInfo:function(r,o){return this.extraStreamInfo[r]=o,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var r in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,r)&&(this.streamInfo[r]=this.extraStreamInfo[r])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var r="Worker "+this.name;return this.previous?this.previous+" -> "+r:r}},n.exports=s},{}],29:[function(t,n,i){var s=t("../utils"),r=t("./ConvertWorker"),o=t("./GenericWorker"),l=t("../base64"),m=t("../support"),y=t("../external"),d=null;if(m.nodestream)try{d=t("../nodejs/NodejsStreamOutputAdapter")}catch{}function w(b,f){return new y.Promise(function(h,g){var v=[],S=b._internalType,P=b._outputType,M=b._mimeType;b.on("data",function(I,$){v.push(I),f&&f($)}).on("error",function(I){v=[],g(I)}).on("end",function(){try{var I=(function($,B,E){switch($){case"blob":return s.newBlob(s.transformTo("arraybuffer",B),E);case"base64":return l.encode(B);default:return s.transformTo($,B)}})(P,(function($,B){var E,q=0,K=null,z=0;for(E=0;E<B.length;E++)z+=B[E].length;switch($){case"string":return B.join("");case"array":return Array.prototype.concat.apply([],B);case"uint8array":for(K=new Uint8Array(z),E=0;E<B.length;E++)K.set(B[E],q),q+=B[E].length;return K;case"nodebuffer":return Buffer.concat(B);default:throw new Error("concat : unsupported type '"+$+"'")}})(S,v),M);h(I)}catch($){g($)}v=[]}).resume()})}function u(b,f,h){var g=f;switch(f){case"blob":case"arraybuffer":g="uint8array";break;case"base64":g="string"}try{this._internalType=g,this._outputType=f,this._mimeType=h,s.checkSupport(g),this._worker=b.pipe(new r(g)),b.lock()}catch(v){this._worker=new o("error"),this._worker.error(v)}}u.prototype={accumulate:function(b){return w(this,b)},on:function(b,f){var h=this;return b==="data"?this._worker.on(b,function(g){f.call(h,g.data,g.meta)}):this._worker.on(b,function(){s.delay(f,arguments,h)}),this},resume:function(){return s.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(b){if(s.checkSupport("nodestream"),this._outputType!=="nodebuffer")throw new Error(this._outputType+" is not supported by this method");return new d(this,{objectMode:this._outputType!=="nodebuffer"},b)}},n.exports=u},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(t,n,i){if(i.base64=!0,i.array=!0,i.string=!0,i.arraybuffer=typeof ArrayBuffer<"u"&&typeof Uint8Array<"u",i.nodebuffer=typeof Buffer<"u",i.uint8array=typeof Uint8Array<"u",typeof ArrayBuffer>"u")i.blob=!1;else{var s=new ArrayBuffer(0);try{i.blob=new Blob([s],{type:"application/zip"}).size===0}catch{try{var r=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);r.append(s),i.blob=r.getBlob("application/zip").size===0}catch{i.blob=!1}}}try{i.nodestream=!!t("readable-stream").Readable}catch{i.nodestream=!1}},{"readable-stream":16}],31:[function(t,n,i){for(var s=t("./utils"),r=t("./support"),o=t("./nodejsUtils"),l=t("./stream/GenericWorker"),m=new Array(256),y=0;y<256;y++)m[y]=252<=y?6:248<=y?5:240<=y?4:224<=y?3:192<=y?2:1;m[254]=m[254]=1;function d(){l.call(this,"utf-8 decode"),this.leftOver=null}function w(){l.call(this,"utf-8 encode")}i.utf8encode=function(u){return r.nodebuffer?o.newBufferFrom(u,"utf-8"):(function(b){var f,h,g,v,S,P=b.length,M=0;for(v=0;v<P;v++)(64512&(h=b.charCodeAt(v)))==55296&&v+1<P&&(64512&(g=b.charCodeAt(v+1)))==56320&&(h=65536+(h-55296<<10)+(g-56320),v++),M+=h<128?1:h<2048?2:h<65536?3:4;for(f=r.uint8array?new Uint8Array(M):new Array(M),v=S=0;S<M;v++)(64512&(h=b.charCodeAt(v)))==55296&&v+1<P&&(64512&(g=b.charCodeAt(v+1)))==56320&&(h=65536+(h-55296<<10)+(g-56320),v++),h<128?f[S++]=h:(h<2048?f[S++]=192|h>>>6:(h<65536?f[S++]=224|h>>>12:(f[S++]=240|h>>>18,f[S++]=128|h>>>12&63),f[S++]=128|h>>>6&63),f[S++]=128|63&h);return f})(u)},i.utf8decode=function(u){return r.nodebuffer?s.transformTo("nodebuffer",u).toString("utf-8"):(function(b){var f,h,g,v,S=b.length,P=new Array(2*S);for(f=h=0;f<S;)if((g=b[f++])<128)P[h++]=g;else if(4<(v=m[g]))P[h++]=65533,f+=v-1;else{for(g&=v===2?31:v===3?15:7;1<v&&f<S;)g=g<<6|63&b[f++],v--;1<v?P[h++]=65533:g<65536?P[h++]=g:(g-=65536,P[h++]=55296|g>>10&1023,P[h++]=56320|1023&g)}return P.length!==h&&(P.subarray?P=P.subarray(0,h):P.length=h),s.applyFromCharCode(P)})(u=s.transformTo(r.uint8array?"uint8array":"array",u))},s.inherits(d,l),d.prototype.processChunk=function(u){var b=s.transformTo(r.uint8array?"uint8array":"array",u.data);if(this.leftOver&&this.leftOver.length){if(r.uint8array){var f=b;(b=new Uint8Array(f.length+this.leftOver.length)).set(this.leftOver,0),b.set(f,this.leftOver.length)}else b=this.leftOver.concat(b);this.leftOver=null}var h=(function(v,S){var P;for((S=S||v.length)>v.length&&(S=v.length),P=S-1;0<=P&&(192&v[P])==128;)P--;return P<0||P===0?S:P+m[v[P]]>S?P:S})(b),g=b;h!==b.length&&(r.uint8array?(g=b.subarray(0,h),this.leftOver=b.subarray(h,b.length)):(g=b.slice(0,h),this.leftOver=b.slice(h,b.length))),this.push({data:i.utf8decode(g),meta:u.meta})},d.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:i.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},i.Utf8DecodeWorker=d,s.inherits(w,l),w.prototype.processChunk=function(u){this.push({data:i.utf8encode(u.data),meta:u.meta})},i.Utf8EncodeWorker=w},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(t,n,i){var s=t("./support"),r=t("./base64"),o=t("./nodejsUtils"),l=t("./external");function m(f){return f}function y(f,h){for(var g=0;g<f.length;++g)h[g]=255&f.charCodeAt(g);return h}t("setimmediate"),i.newBlob=function(f,h){i.checkSupport("blob");try{return new Blob([f],{type:h})}catch{try{var g=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return g.append(f),g.getBlob(h)}catch{throw new Error("Bug : can't construct the Blob.")}}};var d={stringifyByChunk:function(f,h,g){var v=[],S=0,P=f.length;if(P<=g)return String.fromCharCode.apply(null,f);for(;S<P;)h==="array"||h==="nodebuffer"?v.push(String.fromCharCode.apply(null,f.slice(S,Math.min(S+g,P)))):v.push(String.fromCharCode.apply(null,f.subarray(S,Math.min(S+g,P)))),S+=g;return v.join("")},stringifyByChar:function(f){for(var h="",g=0;g<f.length;g++)h+=String.fromCharCode(f[g]);return h},applyCanBeUsed:{uint8array:(function(){try{return s.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return s.nodebuffer&&String.fromCharCode.apply(null,o.allocBuffer(1)).length===1}catch{return!1}})()}};function w(f){var h=65536,g=i.getTypeOf(f),v=!0;if(g==="uint8array"?v=d.applyCanBeUsed.uint8array:g==="nodebuffer"&&(v=d.applyCanBeUsed.nodebuffer),v)for(;1<h;)try{return d.stringifyByChunk(f,g,h)}catch{h=Math.floor(h/2)}return d.stringifyByChar(f)}function u(f,h){for(var g=0;g<f.length;g++)h[g]=f[g];return h}i.applyFromCharCode=w;var b={};b.string={string:m,array:function(f){return y(f,new Array(f.length))},arraybuffer:function(f){return b.string.uint8array(f).buffer},uint8array:function(f){return y(f,new Uint8Array(f.length))},nodebuffer:function(f){return y(f,o.allocBuffer(f.length))}},b.array={string:w,array:m,arraybuffer:function(f){return new Uint8Array(f).buffer},uint8array:function(f){return new Uint8Array(f)},nodebuffer:function(f){return o.newBufferFrom(f)}},b.arraybuffer={string:function(f){return w(new Uint8Array(f))},array:function(f){return u(new Uint8Array(f),new Array(f.byteLength))},arraybuffer:m,uint8array:function(f){return new Uint8Array(f)},nodebuffer:function(f){return o.newBufferFrom(new Uint8Array(f))}},b.uint8array={string:w,array:function(f){return u(f,new Array(f.length))},arraybuffer:function(f){return f.buffer},uint8array:m,nodebuffer:function(f){return o.newBufferFrom(f)}},b.nodebuffer={string:w,array:function(f){return u(f,new Array(f.length))},arraybuffer:function(f){return b.nodebuffer.uint8array(f).buffer},uint8array:function(f){return u(f,new Uint8Array(f.length))},nodebuffer:m},i.transformTo=function(f,h){if(h=h||"",!f)return h;i.checkSupport(f);var g=i.getTypeOf(h);return b[g][f](h)},i.resolve=function(f){for(var h=f.split("/"),g=[],v=0;v<h.length;v++){var S=h[v];S==="."||S===""&&v!==0&&v!==h.length-1||(S===".."?g.pop():g.push(S))}return g.join("/")},i.getTypeOf=function(f){if(typeof f=="string")return"string";var h=Object.prototype.toString.call(f);return h==="[object Array]"?"array":s.nodebuffer&&o.isBuffer(f)?"nodebuffer":s.uint8array&&h==="[object Uint8Array]"?"uint8array":s.arraybuffer&&h==="[object ArrayBuffer]"?"arraybuffer":void 0},i.checkSupport=function(f){if(!s[f.toLowerCase()])throw new Error(f+" is not supported by this platform")},i.MAX_VALUE_16BITS=65535,i.MAX_VALUE_32BITS=-1,i.pretty=function(f){var h,g,v="";for(g=0;g<(f||"").length;g++)v+="\\x"+((h=f.charCodeAt(g))<16?"0":"")+h.toString(16).toUpperCase();return v},i.delay=function(f,h,g){setImmediate(function(){f.apply(g||null,h||[])})},i.inherits=function(f,h){function g(){}g.prototype=h.prototype,f.prototype=new g},i.extend=function(){var f,h,g={};for(f=0;f<arguments.length;f++)for(h in arguments[f])Object.prototype.hasOwnProperty.call(arguments[f],h)&&g[h]===void 0&&(g[h]=arguments[f][h]);return g},i.prepareContent=function(f,h,g,v,S){return l.Promise.resolve(h).then(function(P){return s.blob&&(P instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(P))!==-1)?Blob.prototype.arrayBuffer!==void 0?P.arrayBuffer():typeof FileReader<"u"?new l.Promise(function(M,I){var $=new FileReader;$.onload=function(B){M(B.target.result)},$.onerror=function(B){I(B.target.error)},$.readAsArrayBuffer(P)}):l.Promise.reject(new Error(f+" is a Blob, but we have no way of reading it.")):P}).then(function(P){var M=i.getTypeOf(P);return M?(M==="arraybuffer"?P=i.transformTo("uint8array",P):M==="string"&&(S?P=r.decode(P):g&&v!==!0&&(P=(function(I){return y(I,s.uint8array?new Uint8Array(I.length):new Array(I.length))})(P))),P):l.Promise.reject(new Error("Can't read the data of '"+f+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(t,n,i){var s=t("./reader/readerFor"),r=t("./utils"),o=t("./signature"),l=t("./zipEntry"),m=t("./support");function y(d){this.files=[],this.loadOptions=d}y.prototype={checkSignature:function(d){if(!this.reader.readAndCheckSignature(d)){this.reader.index-=4;var w=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+r.pretty(w)+", expected "+r.pretty(d)+")")}},isSignature:function(d,w){var u=this.reader.index;this.reader.setIndex(d);var b=this.reader.readString(4)===w;return this.reader.setIndex(u),b},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var d=this.reader.readData(this.zipCommentLength),w=m.uint8array?"uint8array":"array",u=r.transformTo(w,d);this.zipComment=this.loadOptions.decodeFileName(u)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var d,w,u,b=this.zip64EndOfCentralSize-44;0<b;)d=this.reader.readInt(2),w=this.reader.readInt(4),u=this.reader.readData(w),this.zip64ExtensibleData[d]={id:d,length:w,value:u}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var d,w;for(d=0;d<this.files.length;d++)w=this.files[d],this.reader.setIndex(w.localHeaderOffset),this.checkSignature(o.LOCAL_FILE_HEADER),w.readLocalPart(this.reader),w.handleUTF8(),w.processAttributes()},readCentralDir:function(){var d;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(o.CENTRAL_FILE_HEADER);)(d=new l({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(d);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var d=this.reader.lastIndexOfSignature(o.CENTRAL_DIRECTORY_END);if(d<0)throw this.isSignature(0,o.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(d);var w=d;if(this.checkSignature(o.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===r.MAX_VALUE_16BITS||this.diskWithCentralDirStart===r.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===r.MAX_VALUE_16BITS||this.centralDirRecords===r.MAX_VALUE_16BITS||this.centralDirSize===r.MAX_VALUE_32BITS||this.centralDirOffset===r.MAX_VALUE_32BITS){if(this.zip64=!0,(d=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(d),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,o.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var u=this.centralDirOffset+this.centralDirSize;this.zip64&&(u+=20,u+=12+this.zip64EndOfCentralSize);var b=w-u;if(0<b)this.isSignature(w,o.CENTRAL_FILE_HEADER)||(this.reader.zero=b);else if(b<0)throw new Error("Corrupted zip: missing "+Math.abs(b)+" bytes.")},prepareReader:function(d){this.reader=s(d)},load:function(d){this.prepareReader(d),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},n.exports=y},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(t,n,i){var s=t("./reader/readerFor"),r=t("./utils"),o=t("./compressedObject"),l=t("./crc32"),m=t("./utf8"),y=t("./compressions"),d=t("./support");function w(u,b){this.options=u,this.loadOptions=b}w.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(u){var b,f;if(u.skip(22),this.fileNameLength=u.readInt(2),f=u.readInt(2),this.fileName=u.readData(this.fileNameLength),u.skip(f),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if((b=(function(h){for(var g in y)if(Object.prototype.hasOwnProperty.call(y,g)&&y[g].magic===h)return y[g];return null})(this.compressionMethod))===null)throw new Error("Corrupted zip : compression "+r.pretty(this.compressionMethod)+" unknown (inner file : "+r.transformTo("string",this.fileName)+")");this.decompressed=new o(this.compressedSize,this.uncompressedSize,this.crc32,b,u.readData(this.compressedSize))},readCentralPart:function(u){this.versionMadeBy=u.readInt(2),u.skip(2),this.bitFlag=u.readInt(2),this.compressionMethod=u.readString(2),this.date=u.readDate(),this.crc32=u.readInt(4),this.compressedSize=u.readInt(4),this.uncompressedSize=u.readInt(4);var b=u.readInt(2);if(this.extraFieldsLength=u.readInt(2),this.fileCommentLength=u.readInt(2),this.diskNumberStart=u.readInt(2),this.internalFileAttributes=u.readInt(2),this.externalFileAttributes=u.readInt(4),this.localHeaderOffset=u.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");u.skip(b),this.readExtraFields(u),this.parseZIP64ExtraField(u),this.fileComment=u.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var u=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),u==0&&(this.dosPermissions=63&this.externalFileAttributes),u==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!=="/"||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var u=s(this.extraFields[1].value);this.uncompressedSize===r.MAX_VALUE_32BITS&&(this.uncompressedSize=u.readInt(8)),this.compressedSize===r.MAX_VALUE_32BITS&&(this.compressedSize=u.readInt(8)),this.localHeaderOffset===r.MAX_VALUE_32BITS&&(this.localHeaderOffset=u.readInt(8)),this.diskNumberStart===r.MAX_VALUE_32BITS&&(this.diskNumberStart=u.readInt(4))}},readExtraFields:function(u){var b,f,h,g=u.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});u.index+4<g;)b=u.readInt(2),f=u.readInt(2),h=u.readData(f),this.extraFields[b]={id:b,length:f,value:h};u.setIndex(g)},handleUTF8:function(){var u=d.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=m.utf8decode(this.fileName),this.fileCommentStr=m.utf8decode(this.fileComment);else{var b=this.findExtraFieldUnicodePath();if(b!==null)this.fileNameStr=b;else{var f=r.transformTo(u,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(f)}var h=this.findExtraFieldUnicodeComment();if(h!==null)this.fileCommentStr=h;else{var g=r.transformTo(u,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(g)}}},findExtraFieldUnicodePath:function(){var u=this.extraFields[28789];if(u){var b=s(u.value);return b.readInt(1)!==1||l(this.fileName)!==b.readInt(4)?null:m.utf8decode(b.readData(u.length-5))}return null},findExtraFieldUnicodeComment:function(){var u=this.extraFields[25461];if(u){var b=s(u.value);return b.readInt(1)!==1||l(this.fileComment)!==b.readInt(4)?null:m.utf8decode(b.readData(u.length-5))}return null}},n.exports=w},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(t,n,i){function s(b,f,h){this.name=b,this.dir=h.dir,this.date=h.date,this.comment=h.comment,this.unixPermissions=h.unixPermissions,this.dosPermissions=h.dosPermissions,this._data=f,this._dataBinary=h.binary,this.options={compression:h.compression,compressionOptions:h.compressionOptions}}var r=t("./stream/StreamHelper"),o=t("./stream/DataWorker"),l=t("./utf8"),m=t("./compressedObject"),y=t("./stream/GenericWorker");s.prototype={internalStream:function(b){var f=null,h="string";try{if(!b)throw new Error("No output type specified.");var g=(h=b.toLowerCase())==="string"||h==="text";h!=="binarystring"&&h!=="text"||(h="string"),f=this._decompressWorker();var v=!this._dataBinary;v&&!g&&(f=f.pipe(new l.Utf8EncodeWorker)),!v&&g&&(f=f.pipe(new l.Utf8DecodeWorker))}catch(S){(f=new y("error")).error(S)}return new r(f,h,"")},async:function(b,f){return this.internalStream(b).accumulate(f)},nodeStream:function(b,f){return this.internalStream(b||"nodebuffer").toNodejsStream(f)},_compressWorker:function(b,f){if(this._data instanceof m&&this._data.compression.magic===b.magic)return this._data.getCompressedWorker();var h=this._decompressWorker();return this._dataBinary||(h=h.pipe(new l.Utf8EncodeWorker)),m.createWorkerFrom(h,b,f)},_decompressWorker:function(){return this._data instanceof m?this._data.getContentWorker():this._data instanceof y?this._data:new o(this._data)}};for(var d=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],w=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},u=0;u<d.length;u++)s.prototype[d[u]]=w;n.exports=s},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(t,n,i){(function(s){var r,o,l=s.MutationObserver||s.WebKitMutationObserver;if(l){var m=0,y=new l(b),d=s.document.createTextNode("");y.observe(d,{characterData:!0}),r=function(){d.data=m=++m%2}}else if(s.setImmediate||s.MessageChannel===void 0)r="document"in s&&"onreadystatechange"in s.document.createElement("script")?function(){var f=s.document.createElement("script");f.onreadystatechange=function(){b(),f.onreadystatechange=null,f.parentNode.removeChild(f),f=null},s.document.documentElement.appendChild(f)}:function(){setTimeout(b,0)};else{var w=new s.MessageChannel;w.port1.onmessage=b,r=function(){w.port2.postMessage(0)}}var u=[];function b(){var f,h;o=!0;for(var g=u.length;g;){for(h=u,u=[],f=-1;++f<g;)h[f]();g=u.length}o=!1}n.exports=function(f){u.push(f)!==1||o||r()}}).call(this,typeof ft<"u"?ft:typeof self<"u"?self:typeof window<"u"?window:{})},{}],37:[function(t,n,i){var s=t("immediate");function r(){}var o={},l=["REJECTED"],m=["FULFILLED"],y=["PENDING"];function d(g){if(typeof g!="function")throw new TypeError("resolver must be a function");this.state=y,this.queue=[],this.outcome=void 0,g!==r&&f(this,g)}function w(g,v,S){this.promise=g,typeof v=="function"&&(this.onFulfilled=v,this.callFulfilled=this.otherCallFulfilled),typeof S=="function"&&(this.onRejected=S,this.callRejected=this.otherCallRejected)}function u(g,v,S){s(function(){var P;try{P=v(S)}catch(M){return o.reject(g,M)}P===g?o.reject(g,new TypeError("Cannot resolve promise with itself")):o.resolve(g,P)})}function b(g){var v=g&&g.then;if(g&&(typeof g=="object"||typeof g=="function")&&typeof v=="function")return function(){v.apply(g,arguments)}}function f(g,v){var S=!1;function P($){S||(S=!0,o.reject(g,$))}function M($){S||(S=!0,o.resolve(g,$))}var I=h(function(){v(M,P)});I.status==="error"&&P(I.value)}function h(g,v){var S={};try{S.value=g(v),S.status="success"}catch(P){S.status="error",S.value=P}return S}(n.exports=d).prototype.finally=function(g){if(typeof g!="function")return this;var v=this.constructor;return this.then(function(S){return v.resolve(g()).then(function(){return S})},function(S){return v.resolve(g()).then(function(){throw S})})},d.prototype.catch=function(g){return this.then(null,g)},d.prototype.then=function(g,v){if(typeof g!="function"&&this.state===m||typeof v!="function"&&this.state===l)return this;var S=new this.constructor(r);return this.state!==y?u(S,this.state===m?g:v,this.outcome):this.queue.push(new w(S,g,v)),S},w.prototype.callFulfilled=function(g){o.resolve(this.promise,g)},w.prototype.otherCallFulfilled=function(g){u(this.promise,this.onFulfilled,g)},w.prototype.callRejected=function(g){o.reject(this.promise,g)},w.prototype.otherCallRejected=function(g){u(this.promise,this.onRejected,g)},o.resolve=function(g,v){var S=h(b,v);if(S.status==="error")return o.reject(g,S.value);var P=S.value;if(P)f(g,P);else{g.state=m,g.outcome=v;for(var M=-1,I=g.queue.length;++M<I;)g.queue[M].callFulfilled(v)}return g},o.reject=function(g,v){g.state=l,g.outcome=v;for(var S=-1,P=g.queue.length;++S<P;)g.queue[S].callRejected(v);return g},d.resolve=function(g){return g instanceof this?g:o.resolve(new this(r),g)},d.reject=function(g){var v=new this(r);return o.reject(v,g)},d.all=function(g){var v=this;if(Object.prototype.toString.call(g)!=="[object Array]")return this.reject(new TypeError("must be an array"));var S=g.length,P=!1;if(!S)return this.resolve([]);for(var M=new Array(S),I=0,$=-1,B=new this(r);++$<S;)E(g[$],$);return B;function E(q,K){v.resolve(q).then(function(z){M[K]=z,++I!==S||P||(P=!0,o.resolve(B,M))},function(z){P||(P=!0,o.reject(B,z))})}},d.race=function(g){var v=this;if(Object.prototype.toString.call(g)!=="[object Array]")return this.reject(new TypeError("must be an array"));var S=g.length,P=!1;if(!S)return this.resolve([]);for(var M=-1,I=new this(r);++M<S;)$=g[M],v.resolve($).then(function(B){P||(P=!0,o.resolve(I,B))},function(B){P||(P=!0,o.reject(I,B))});var $;return I}},{immediate:36}],38:[function(t,n,i){var s={};(0,t("./lib/utils/common").assign)(s,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),n.exports=s},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(t,n,i){var s=t("./zlib/deflate"),r=t("./utils/common"),o=t("./utils/strings"),l=t("./zlib/messages"),m=t("./zlib/zstream"),y=Object.prototype.toString,d=0,w=-1,u=0,b=8;function f(g){if(!(this instanceof f))return new f(g);this.options=r.assign({level:w,method:b,chunkSize:16384,windowBits:15,memLevel:8,strategy:u,to:""},g||{});var v=this.options;v.raw&&0<v.windowBits?v.windowBits=-v.windowBits:v.gzip&&0<v.windowBits&&v.windowBits<16&&(v.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new m,this.strm.avail_out=0;var S=s.deflateInit2(this.strm,v.level,v.method,v.windowBits,v.memLevel,v.strategy);if(S!==d)throw new Error(l[S]);if(v.header&&s.deflateSetHeader(this.strm,v.header),v.dictionary){var P;if(P=typeof v.dictionary=="string"?o.string2buf(v.dictionary):y.call(v.dictionary)==="[object ArrayBuffer]"?new Uint8Array(v.dictionary):v.dictionary,(S=s.deflateSetDictionary(this.strm,P))!==d)throw new Error(l[S]);this._dict_set=!0}}function h(g,v){var S=new f(v);if(S.push(g,!0),S.err)throw S.msg||l[S.err];return S.result}f.prototype.push=function(g,v){var S,P,M=this.strm,I=this.options.chunkSize;if(this.ended)return!1;P=v===~~v?v:v===!0?4:0,typeof g=="string"?M.input=o.string2buf(g):y.call(g)==="[object ArrayBuffer]"?M.input=new Uint8Array(g):M.input=g,M.next_in=0,M.avail_in=M.input.length;do{if(M.avail_out===0&&(M.output=new r.Buf8(I),M.next_out=0,M.avail_out=I),(S=s.deflate(M,P))!==1&&S!==d)return this.onEnd(S),!(this.ended=!0);M.avail_out!==0&&(M.avail_in!==0||P!==4&&P!==2)||(this.options.to==="string"?this.onData(o.buf2binstring(r.shrinkBuf(M.output,M.next_out))):this.onData(r.shrinkBuf(M.output,M.next_out)))}while((0<M.avail_in||M.avail_out===0)&&S!==1);return P===4?(S=s.deflateEnd(this.strm),this.onEnd(S),this.ended=!0,S===d):P!==2||(this.onEnd(d),!(M.avail_out=0))},f.prototype.onData=function(g){this.chunks.push(g)},f.prototype.onEnd=function(g){g===d&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=g,this.msg=this.strm.msg},i.Deflate=f,i.deflate=h,i.deflateRaw=function(g,v){return(v=v||{}).raw=!0,h(g,v)},i.gzip=function(g,v){return(v=v||{}).gzip=!0,h(g,v)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(t,n,i){var s=t("./zlib/inflate"),r=t("./utils/common"),o=t("./utils/strings"),l=t("./zlib/constants"),m=t("./zlib/messages"),y=t("./zlib/zstream"),d=t("./zlib/gzheader"),w=Object.prototype.toString;function u(f){if(!(this instanceof u))return new u(f);this.options=r.assign({chunkSize:16384,windowBits:0,to:""},f||{});var h=this.options;h.raw&&0<=h.windowBits&&h.windowBits<16&&(h.windowBits=-h.windowBits,h.windowBits===0&&(h.windowBits=-15)),!(0<=h.windowBits&&h.windowBits<16)||f&&f.windowBits||(h.windowBits+=32),15<h.windowBits&&h.windowBits<48&&(15&h.windowBits)==0&&(h.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new y,this.strm.avail_out=0;var g=s.inflateInit2(this.strm,h.windowBits);if(g!==l.Z_OK)throw new Error(m[g]);this.header=new d,s.inflateGetHeader(this.strm,this.header)}function b(f,h){var g=new u(h);if(g.push(f,!0),g.err)throw g.msg||m[g.err];return g.result}u.prototype.push=function(f,h){var g,v,S,P,M,I,$=this.strm,B=this.options.chunkSize,E=this.options.dictionary,q=!1;if(this.ended)return!1;v=h===~~h?h:h===!0?l.Z_FINISH:l.Z_NO_FLUSH,typeof f=="string"?$.input=o.binstring2buf(f):w.call(f)==="[object ArrayBuffer]"?$.input=new Uint8Array(f):$.input=f,$.next_in=0,$.avail_in=$.input.length;do{if($.avail_out===0&&($.output=new r.Buf8(B),$.next_out=0,$.avail_out=B),(g=s.inflate($,l.Z_NO_FLUSH))===l.Z_NEED_DICT&&E&&(I=typeof E=="string"?o.string2buf(E):w.call(E)==="[object ArrayBuffer]"?new Uint8Array(E):E,g=s.inflateSetDictionary(this.strm,I)),g===l.Z_BUF_ERROR&&q===!0&&(g=l.Z_OK,q=!1),g!==l.Z_STREAM_END&&g!==l.Z_OK)return this.onEnd(g),!(this.ended=!0);$.next_out&&($.avail_out!==0&&g!==l.Z_STREAM_END&&($.avail_in!==0||v!==l.Z_FINISH&&v!==l.Z_SYNC_FLUSH)||(this.options.to==="string"?(S=o.utf8border($.output,$.next_out),P=$.next_out-S,M=o.buf2string($.output,S),$.next_out=P,$.avail_out=B-P,P&&r.arraySet($.output,$.output,S,P,0),this.onData(M)):this.onData(r.shrinkBuf($.output,$.next_out)))),$.avail_in===0&&$.avail_out===0&&(q=!0)}while((0<$.avail_in||$.avail_out===0)&&g!==l.Z_STREAM_END);return g===l.Z_STREAM_END&&(v=l.Z_FINISH),v===l.Z_FINISH?(g=s.inflateEnd(this.strm),this.onEnd(g),this.ended=!0,g===l.Z_OK):v!==l.Z_SYNC_FLUSH||(this.onEnd(l.Z_OK),!($.avail_out=0))},u.prototype.onData=function(f){this.chunks.push(f)},u.prototype.onEnd=function(f){f===l.Z_OK&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=f,this.msg=this.strm.msg},i.Inflate=u,i.inflate=b,i.inflateRaw=function(f,h){return(h=h||{}).raw=!0,b(f,h)},i.ungzip=b},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(t,n,i){var s=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Int32Array<"u";i.assign=function(l){for(var m=Array.prototype.slice.call(arguments,1);m.length;){var y=m.shift();if(y){if(typeof y!="object")throw new TypeError(y+"must be non-object");for(var d in y)y.hasOwnProperty(d)&&(l[d]=y[d])}}return l},i.shrinkBuf=function(l,m){return l.length===m?l:l.subarray?l.subarray(0,m):(l.length=m,l)};var r={arraySet:function(l,m,y,d,w){if(m.subarray&&l.subarray)l.set(m.subarray(y,y+d),w);else for(var u=0;u<d;u++)l[w+u]=m[y+u]},flattenChunks:function(l){var m,y,d,w,u,b;for(m=d=0,y=l.length;m<y;m++)d+=l[m].length;for(b=new Uint8Array(d),m=w=0,y=l.length;m<y;m++)u=l[m],b.set(u,w),w+=u.length;return b}},o={arraySet:function(l,m,y,d,w){for(var u=0;u<d;u++)l[w+u]=m[y+u]},flattenChunks:function(l){return[].concat.apply([],l)}};i.setTyped=function(l){l?(i.Buf8=Uint8Array,i.Buf16=Uint16Array,i.Buf32=Int32Array,i.assign(i,r)):(i.Buf8=Array,i.Buf16=Array,i.Buf32=Array,i.assign(i,o))},i.setTyped(s)},{}],42:[function(t,n,i){var s=t("./common"),r=!0,o=!0;try{String.fromCharCode.apply(null,[0])}catch{r=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{o=!1}for(var l=new s.Buf8(256),m=0;m<256;m++)l[m]=252<=m?6:248<=m?5:240<=m?4:224<=m?3:192<=m?2:1;function y(d,w){if(w<65537&&(d.subarray&&o||!d.subarray&&r))return String.fromCharCode.apply(null,s.shrinkBuf(d,w));for(var u="",b=0;b<w;b++)u+=String.fromCharCode(d[b]);return u}l[254]=l[254]=1,i.string2buf=function(d){var w,u,b,f,h,g=d.length,v=0;for(f=0;f<g;f++)(64512&(u=d.charCodeAt(f)))==55296&&f+1<g&&(64512&(b=d.charCodeAt(f+1)))==56320&&(u=65536+(u-55296<<10)+(b-56320),f++),v+=u<128?1:u<2048?2:u<65536?3:4;for(w=new s.Buf8(v),f=h=0;h<v;f++)(64512&(u=d.charCodeAt(f)))==55296&&f+1<g&&(64512&(b=d.charCodeAt(f+1)))==56320&&(u=65536+(u-55296<<10)+(b-56320),f++),u<128?w[h++]=u:(u<2048?w[h++]=192|u>>>6:(u<65536?w[h++]=224|u>>>12:(w[h++]=240|u>>>18,w[h++]=128|u>>>12&63),w[h++]=128|u>>>6&63),w[h++]=128|63&u);return w},i.buf2binstring=function(d){return y(d,d.length)},i.binstring2buf=function(d){for(var w=new s.Buf8(d.length),u=0,b=w.length;u<b;u++)w[u]=d.charCodeAt(u);return w},i.buf2string=function(d,w){var u,b,f,h,g=w||d.length,v=new Array(2*g);for(u=b=0;u<g;)if((f=d[u++])<128)v[b++]=f;else if(4<(h=l[f]))v[b++]=65533,u+=h-1;else{for(f&=h===2?31:h===3?15:7;1<h&&u<g;)f=f<<6|63&d[u++],h--;1<h?v[b++]=65533:f<65536?v[b++]=f:(f-=65536,v[b++]=55296|f>>10&1023,v[b++]=56320|1023&f)}return y(v,b)},i.utf8border=function(d,w){var u;for((w=w||d.length)>d.length&&(w=d.length),u=w-1;0<=u&&(192&d[u])==128;)u--;return u<0||u===0?w:u+l[d[u]]>w?u:w}},{"./common":41}],43:[function(t,n,i){n.exports=function(s,r,o,l){for(var m=65535&s|0,y=s>>>16&65535|0,d=0;o!==0;){for(o-=d=2e3<o?2e3:o;y=y+(m=m+r[l++]|0)|0,--d;);m%=65521,y%=65521}return m|y<<16|0}},{}],44:[function(t,n,i){n.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(t,n,i){var s=(function(){for(var r,o=[],l=0;l<256;l++){r=l;for(var m=0;m<8;m++)r=1&r?3988292384^r>>>1:r>>>1;o[l]=r}return o})();n.exports=function(r,o,l,m){var y=s,d=m+l;r^=-1;for(var w=m;w<d;w++)r=r>>>8^y[255&(r^o[w])];return-1^r}},{}],46:[function(t,n,i){var s,r=t("../utils/common"),o=t("./trees"),l=t("./adler32"),m=t("./crc32"),y=t("./messages"),d=0,w=4,u=0,b=-2,f=-1,h=4,g=2,v=8,S=9,P=286,M=30,I=19,$=2*P+1,B=15,E=3,q=258,K=q+E+1,z=42,N=113,p=1,O=2,ee=3,F=4;function se(c,L){return c.msg=y[L],L}function U(c){return(c<<1)-(4<c?9:0)}function ne(c){for(var L=c.length;0<=--L;)c[L]=0}function D(c){var L=c.state,R=L.pending;R>c.avail_out&&(R=c.avail_out),R!==0&&(r.arraySet(c.output,L.pending_buf,L.pending_out,R,c.next_out),c.next_out+=R,L.pending_out+=R,c.total_out+=R,c.avail_out-=R,L.pending-=R,L.pending===0&&(L.pending_out=0))}function j(c,L){o._tr_flush_block(c,0<=c.block_start?c.block_start:-1,c.strstart-c.block_start,L),c.block_start=c.strstart,D(c.strm)}function te(c,L){c.pending_buf[c.pending++]=L}function J(c,L){c.pending_buf[c.pending++]=L>>>8&255,c.pending_buf[c.pending++]=255&L}function H(c,L){var R,x,k=c.max_chain_length,C=c.strstart,A=c.prev_length,T=c.nice_match,_=c.strstart>c.w_size-K?c.strstart-(c.w_size-K):0,W=c.window,Z=c.w_mask,Y=c.prev,Q=c.strstart+q,ue=W[C+A-1],le=W[C+A];c.prev_length>=c.good_match&&(k>>=2),T>c.lookahead&&(T=c.lookahead);do if(W[(R=L)+A]===le&&W[R+A-1]===ue&&W[R]===W[C]&&W[++R]===W[C+1]){C+=2,R++;do;while(W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&W[++C]===W[++R]&&C<Q);if(x=q-(Q-C),C=Q-q,A<x){if(c.match_start=L,T<=(A=x))break;ue=W[C+A-1],le=W[C+A]}}while((L=Y[L&Z])>_&&--k!=0);return A<=c.lookahead?A:c.lookahead}function fe(c){var L,R,x,k,C,A,T,_,W,Z,Y=c.w_size;do{if(k=c.window_size-c.lookahead-c.strstart,c.strstart>=Y+(Y-K)){for(r.arraySet(c.window,c.window,Y,Y,0),c.match_start-=Y,c.strstart-=Y,c.block_start-=Y,L=R=c.hash_size;x=c.head[--L],c.head[L]=Y<=x?x-Y:0,--R;);for(L=R=Y;x=c.prev[--L],c.prev[L]=Y<=x?x-Y:0,--R;);k+=Y}if(c.strm.avail_in===0)break;if(A=c.strm,T=c.window,_=c.strstart+c.lookahead,W=k,Z=void 0,Z=A.avail_in,W<Z&&(Z=W),R=Z===0?0:(A.avail_in-=Z,r.arraySet(T,A.input,A.next_in,Z,_),A.state.wrap===1?A.adler=l(A.adler,T,Z,_):A.state.wrap===2&&(A.adler=m(A.adler,T,Z,_)),A.next_in+=Z,A.total_in+=Z,Z),c.lookahead+=R,c.lookahead+c.insert>=E)for(C=c.strstart-c.insert,c.ins_h=c.window[C],c.ins_h=(c.ins_h<<c.hash_shift^c.window[C+1])&c.hash_mask;c.insert&&(c.ins_h=(c.ins_h<<c.hash_shift^c.window[C+E-1])&c.hash_mask,c.prev[C&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=C,C++,c.insert--,!(c.lookahead+c.insert<E)););}while(c.lookahead<K&&c.strm.avail_in!==0)}function he(c,L){for(var R,x;;){if(c.lookahead<K){if(fe(c),c.lookahead<K&&L===d)return p;if(c.lookahead===0)break}if(R=0,c.lookahead>=E&&(c.ins_h=(c.ins_h<<c.hash_shift^c.window[c.strstart+E-1])&c.hash_mask,R=c.prev[c.strstart&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=c.strstart),R!==0&&c.strstart-R<=c.w_size-K&&(c.match_length=H(c,R)),c.match_length>=E)if(x=o._tr_tally(c,c.strstart-c.match_start,c.match_length-E),c.lookahead-=c.match_length,c.match_length<=c.max_lazy_match&&c.lookahead>=E){for(c.match_length--;c.strstart++,c.ins_h=(c.ins_h<<c.hash_shift^c.window[c.strstart+E-1])&c.hash_mask,R=c.prev[c.strstart&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=c.strstart,--c.match_length!=0;);c.strstart++}else c.strstart+=c.match_length,c.match_length=0,c.ins_h=c.window[c.strstart],c.ins_h=(c.ins_h<<c.hash_shift^c.window[c.strstart+1])&c.hash_mask;else x=o._tr_tally(c,0,c.window[c.strstart]),c.lookahead--,c.strstart++;if(x&&(j(c,!1),c.strm.avail_out===0))return p}return c.insert=c.strstart<E-1?c.strstart:E-1,L===w?(j(c,!0),c.strm.avail_out===0?ee:F):c.last_lit&&(j(c,!1),c.strm.avail_out===0)?p:O}function ce(c,L){for(var R,x,k;;){if(c.lookahead<K){if(fe(c),c.lookahead<K&&L===d)return p;if(c.lookahead===0)break}if(R=0,c.lookahead>=E&&(c.ins_h=(c.ins_h<<c.hash_shift^c.window[c.strstart+E-1])&c.hash_mask,R=c.prev[c.strstart&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=c.strstart),c.prev_length=c.match_length,c.prev_match=c.match_start,c.match_length=E-1,R!==0&&c.prev_length<c.max_lazy_match&&c.strstart-R<=c.w_size-K&&(c.match_length=H(c,R),c.match_length<=5&&(c.strategy===1||c.match_length===E&&4096<c.strstart-c.match_start)&&(c.match_length=E-1)),c.prev_length>=E&&c.match_length<=c.prev_length){for(k=c.strstart+c.lookahead-E,x=o._tr_tally(c,c.strstart-1-c.prev_match,c.prev_length-E),c.lookahead-=c.prev_length-1,c.prev_length-=2;++c.strstart<=k&&(c.ins_h=(c.ins_h<<c.hash_shift^c.window[c.strstart+E-1])&c.hash_mask,R=c.prev[c.strstart&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=c.strstart),--c.prev_length!=0;);if(c.match_available=0,c.match_length=E-1,c.strstart++,x&&(j(c,!1),c.strm.avail_out===0))return p}else if(c.match_available){if((x=o._tr_tally(c,0,c.window[c.strstart-1]))&&j(c,!1),c.strstart++,c.lookahead--,c.strm.avail_out===0)return p}else c.match_available=1,c.strstart++,c.lookahead--}return c.match_available&&(x=o._tr_tally(c,0,c.window[c.strstart-1]),c.match_available=0),c.insert=c.strstart<E-1?c.strstart:E-1,L===w?(j(c,!0),c.strm.avail_out===0?ee:F):c.last_lit&&(j(c,!1),c.strm.avail_out===0)?p:O}function de(c,L,R,x,k){this.good_length=c,this.max_lazy=L,this.nice_length=R,this.max_chain=x,this.func=k}function oe(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new r.Buf16(2*$),this.dyn_dtree=new r.Buf16(2*(2*M+1)),this.bl_tree=new r.Buf16(2*(2*I+1)),ne(this.dyn_ltree),ne(this.dyn_dtree),ne(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new r.Buf16(B+1),this.heap=new r.Buf16(2*P+1),ne(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new r.Buf16(2*P+1),ne(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function ie(c){var L;return c&&c.state?(c.total_in=c.total_out=0,c.data_type=g,(L=c.state).pending=0,L.pending_out=0,L.wrap<0&&(L.wrap=-L.wrap),L.status=L.wrap?z:N,c.adler=L.wrap===2?0:1,L.last_flush=d,o._tr_init(L),u):se(c,b)}function ye(c){var L=ie(c);return L===u&&(function(R){R.window_size=2*R.w_size,ne(R.head),R.max_lazy_match=s[R.level].max_lazy,R.good_match=s[R.level].good_length,R.nice_match=s[R.level].nice_length,R.max_chain_length=s[R.level].max_chain,R.strstart=0,R.block_start=0,R.lookahead=0,R.insert=0,R.match_length=R.prev_length=E-1,R.match_available=0,R.ins_h=0})(c.state),L}function pe(c,L,R,x,k,C){if(!c)return b;var A=1;if(L===f&&(L=6),x<0?(A=0,x=-x):15<x&&(A=2,x-=16),k<1||S<k||R!==v||x<8||15<x||L<0||9<L||C<0||h<C)return se(c,b);x===8&&(x=9);var T=new oe;return(c.state=T).strm=c,T.wrap=A,T.gzhead=null,T.w_bits=x,T.w_size=1<<T.w_bits,T.w_mask=T.w_size-1,T.hash_bits=k+7,T.hash_size=1<<T.hash_bits,T.hash_mask=T.hash_size-1,T.hash_shift=~~((T.hash_bits+E-1)/E),T.window=new r.Buf8(2*T.w_size),T.head=new r.Buf16(T.hash_size),T.prev=new r.Buf16(T.w_size),T.lit_bufsize=1<<k+6,T.pending_buf_size=4*T.lit_bufsize,T.pending_buf=new r.Buf8(T.pending_buf_size),T.d_buf=1*T.lit_bufsize,T.l_buf=3*T.lit_bufsize,T.level=L,T.strategy=C,T.method=R,ye(c)}s=[new de(0,0,0,0,function(c,L){var R=65535;for(R>c.pending_buf_size-5&&(R=c.pending_buf_size-5);;){if(c.lookahead<=1){if(fe(c),c.lookahead===0&&L===d)return p;if(c.lookahead===0)break}c.strstart+=c.lookahead,c.lookahead=0;var x=c.block_start+R;if((c.strstart===0||c.strstart>=x)&&(c.lookahead=c.strstart-x,c.strstart=x,j(c,!1),c.strm.avail_out===0)||c.strstart-c.block_start>=c.w_size-K&&(j(c,!1),c.strm.avail_out===0))return p}return c.insert=0,L===w?(j(c,!0),c.strm.avail_out===0?ee:F):(c.strstart>c.block_start&&(j(c,!1),c.strm.avail_out),p)}),new de(4,4,8,4,he),new de(4,5,16,8,he),new de(4,6,32,32,he),new de(4,4,16,16,ce),new de(8,16,32,32,ce),new de(8,16,128,128,ce),new de(8,32,128,256,ce),new de(32,128,258,1024,ce),new de(32,258,258,4096,ce)],i.deflateInit=function(c,L){return pe(c,L,v,15,8,0)},i.deflateInit2=pe,i.deflateReset=ye,i.deflateResetKeep=ie,i.deflateSetHeader=function(c,L){return c&&c.state?c.state.wrap!==2?b:(c.state.gzhead=L,u):b},i.deflate=function(c,L){var R,x,k,C;if(!c||!c.state||5<L||L<0)return c?se(c,b):b;if(x=c.state,!c.output||!c.input&&c.avail_in!==0||x.status===666&&L!==w)return se(c,c.avail_out===0?-5:b);if(x.strm=c,R=x.last_flush,x.last_flush=L,x.status===z)if(x.wrap===2)c.adler=0,te(x,31),te(x,139),te(x,8),x.gzhead?(te(x,(x.gzhead.text?1:0)+(x.gzhead.hcrc?2:0)+(x.gzhead.extra?4:0)+(x.gzhead.name?8:0)+(x.gzhead.comment?16:0)),te(x,255&x.gzhead.time),te(x,x.gzhead.time>>8&255),te(x,x.gzhead.time>>16&255),te(x,x.gzhead.time>>24&255),te(x,x.level===9?2:2<=x.strategy||x.level<2?4:0),te(x,255&x.gzhead.os),x.gzhead.extra&&x.gzhead.extra.length&&(te(x,255&x.gzhead.extra.length),te(x,x.gzhead.extra.length>>8&255)),x.gzhead.hcrc&&(c.adler=m(c.adler,x.pending_buf,x.pending,0)),x.gzindex=0,x.status=69):(te(x,0),te(x,0),te(x,0),te(x,0),te(x,0),te(x,x.level===9?2:2<=x.strategy||x.level<2?4:0),te(x,3),x.status=N);else{var A=v+(x.w_bits-8<<4)<<8;A|=(2<=x.strategy||x.level<2?0:x.level<6?1:x.level===6?2:3)<<6,x.strstart!==0&&(A|=32),A+=31-A%31,x.status=N,J(x,A),x.strstart!==0&&(J(x,c.adler>>>16),J(x,65535&c.adler)),c.adler=1}if(x.status===69)if(x.gzhead.extra){for(k=x.pending;x.gzindex<(65535&x.gzhead.extra.length)&&(x.pending!==x.pending_buf_size||(x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),D(c),k=x.pending,x.pending!==x.pending_buf_size));)te(x,255&x.gzhead.extra[x.gzindex]),x.gzindex++;x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),x.gzindex===x.gzhead.extra.length&&(x.gzindex=0,x.status=73)}else x.status=73;if(x.status===73)if(x.gzhead.name){k=x.pending;do{if(x.pending===x.pending_buf_size&&(x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),D(c),k=x.pending,x.pending===x.pending_buf_size)){C=1;break}C=x.gzindex<x.gzhead.name.length?255&x.gzhead.name.charCodeAt(x.gzindex++):0,te(x,C)}while(C!==0);x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),C===0&&(x.gzindex=0,x.status=91)}else x.status=91;if(x.status===91)if(x.gzhead.comment){k=x.pending;do{if(x.pending===x.pending_buf_size&&(x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),D(c),k=x.pending,x.pending===x.pending_buf_size)){C=1;break}C=x.gzindex<x.gzhead.comment.length?255&x.gzhead.comment.charCodeAt(x.gzindex++):0,te(x,C)}while(C!==0);x.gzhead.hcrc&&x.pending>k&&(c.adler=m(c.adler,x.pending_buf,x.pending-k,k)),C===0&&(x.status=103)}else x.status=103;if(x.status===103&&(x.gzhead.hcrc?(x.pending+2>x.pending_buf_size&&D(c),x.pending+2<=x.pending_buf_size&&(te(x,255&c.adler),te(x,c.adler>>8&255),c.adler=0,x.status=N)):x.status=N),x.pending!==0){if(D(c),c.avail_out===0)return x.last_flush=-1,u}else if(c.avail_in===0&&U(L)<=U(R)&&L!==w)return se(c,-5);if(x.status===666&&c.avail_in!==0)return se(c,-5);if(c.avail_in!==0||x.lookahead!==0||L!==d&&x.status!==666){var T=x.strategy===2?(function(_,W){for(var Z;;){if(_.lookahead===0&&(fe(_),_.lookahead===0)){if(W===d)return p;break}if(_.match_length=0,Z=o._tr_tally(_,0,_.window[_.strstart]),_.lookahead--,_.strstart++,Z&&(j(_,!1),_.strm.avail_out===0))return p}return _.insert=0,W===w?(j(_,!0),_.strm.avail_out===0?ee:F):_.last_lit&&(j(_,!1),_.strm.avail_out===0)?p:O})(x,L):x.strategy===3?(function(_,W){for(var Z,Y,Q,ue,le=_.window;;){if(_.lookahead<=q){if(fe(_),_.lookahead<=q&&W===d)return p;if(_.lookahead===0)break}if(_.match_length=0,_.lookahead>=E&&0<_.strstart&&(Y=le[Q=_.strstart-1])===le[++Q]&&Y===le[++Q]&&Y===le[++Q]){ue=_.strstart+q;do;while(Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Y===le[++Q]&&Q<ue);_.match_length=q-(ue-Q),_.match_length>_.lookahead&&(_.match_length=_.lookahead)}if(_.match_length>=E?(Z=o._tr_tally(_,1,_.match_length-E),_.lookahead-=_.match_length,_.strstart+=_.match_length,_.match_length=0):(Z=o._tr_tally(_,0,_.window[_.strstart]),_.lookahead--,_.strstart++),Z&&(j(_,!1),_.strm.avail_out===0))return p}return _.insert=0,W===w?(j(_,!0),_.strm.avail_out===0?ee:F):_.last_lit&&(j(_,!1),_.strm.avail_out===0)?p:O})(x,L):s[x.level].func(x,L);if(T!==ee&&T!==F||(x.status=666),T===p||T===ee)return c.avail_out===0&&(x.last_flush=-1),u;if(T===O&&(L===1?o._tr_align(x):L!==5&&(o._tr_stored_block(x,0,0,!1),L===3&&(ne(x.head),x.lookahead===0&&(x.strstart=0,x.block_start=0,x.insert=0))),D(c),c.avail_out===0))return x.last_flush=-1,u}return L!==w?u:x.wrap<=0?1:(x.wrap===2?(te(x,255&c.adler),te(x,c.adler>>8&255),te(x,c.adler>>16&255),te(x,c.adler>>24&255),te(x,255&c.total_in),te(x,c.total_in>>8&255),te(x,c.total_in>>16&255),te(x,c.total_in>>24&255)):(J(x,c.adler>>>16),J(x,65535&c.adler)),D(c),0<x.wrap&&(x.wrap=-x.wrap),x.pending!==0?u:1)},i.deflateEnd=function(c){var L;return c&&c.state?(L=c.state.status)!==z&&L!==69&&L!==73&&L!==91&&L!==103&&L!==N&&L!==666?se(c,b):(c.state=null,L===N?se(c,-3):u):b},i.deflateSetDictionary=function(c,L){var R,x,k,C,A,T,_,W,Z=L.length;if(!c||!c.state||(C=(R=c.state).wrap)===2||C===1&&R.status!==z||R.lookahead)return b;for(C===1&&(c.adler=l(c.adler,L,Z,0)),R.wrap=0,Z>=R.w_size&&(C===0&&(ne(R.head),R.strstart=0,R.block_start=0,R.insert=0),W=new r.Buf8(R.w_size),r.arraySet(W,L,Z-R.w_size,R.w_size,0),L=W,Z=R.w_size),A=c.avail_in,T=c.next_in,_=c.input,c.avail_in=Z,c.next_in=0,c.input=L,fe(R);R.lookahead>=E;){for(x=R.strstart,k=R.lookahead-(E-1);R.ins_h=(R.ins_h<<R.hash_shift^R.window[x+E-1])&R.hash_mask,R.prev[x&R.w_mask]=R.head[R.ins_h],R.head[R.ins_h]=x,x++,--k;);R.strstart=x,R.lookahead=E-1,fe(R)}return R.strstart+=R.lookahead,R.block_start=R.strstart,R.insert=R.lookahead,R.lookahead=0,R.match_length=R.prev_length=E-1,R.match_available=0,c.next_in=T,c.input=_,c.avail_in=A,R.wrap=C,u},i.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(t,n,i){n.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(t,n,i){n.exports=function(s,r){var o,l,m,y,d,w,u,b,f,h,g,v,S,P,M,I,$,B,E,q,K,z,N,p,O;o=s.state,l=s.next_in,p=s.input,m=l+(s.avail_in-5),y=s.next_out,O=s.output,d=y-(r-s.avail_out),w=y+(s.avail_out-257),u=o.dmax,b=o.wsize,f=o.whave,h=o.wnext,g=o.window,v=o.hold,S=o.bits,P=o.lencode,M=o.distcode,I=(1<<o.lenbits)-1,$=(1<<o.distbits)-1;e:do{S<15&&(v+=p[l++]<<S,S+=8,v+=p[l++]<<S,S+=8),B=P[v&I];t:for(;;){if(v>>>=E=B>>>24,S-=E,(E=B>>>16&255)===0)O[y++]=65535&B;else{if(!(16&E)){if((64&E)==0){B=P[(65535&B)+(v&(1<<E)-1)];continue t}if(32&E){o.mode=12;break e}s.msg="invalid literal/length code",o.mode=30;break e}q=65535&B,(E&=15)&&(S<E&&(v+=p[l++]<<S,S+=8),q+=v&(1<<E)-1,v>>>=E,S-=E),S<15&&(v+=p[l++]<<S,S+=8,v+=p[l++]<<S,S+=8),B=M[v&$];a:for(;;){if(v>>>=E=B>>>24,S-=E,!(16&(E=B>>>16&255))){if((64&E)==0){B=M[(65535&B)+(v&(1<<E)-1)];continue a}s.msg="invalid distance code",o.mode=30;break e}if(K=65535&B,S<(E&=15)&&(v+=p[l++]<<S,(S+=8)<E&&(v+=p[l++]<<S,S+=8)),u<(K+=v&(1<<E)-1)){s.msg="invalid distance too far back",o.mode=30;break e}if(v>>>=E,S-=E,(E=y-d)<K){if(f<(E=K-E)&&o.sane){s.msg="invalid distance too far back",o.mode=30;break e}if(N=g,(z=0)===h){if(z+=b-E,E<q){for(q-=E;O[y++]=g[z++],--E;);z=y-K,N=O}}else if(h<E){if(z+=b+h-E,(E-=h)<q){for(q-=E;O[y++]=g[z++],--E;);if(z=0,h<q){for(q-=E=h;O[y++]=g[z++],--E;);z=y-K,N=O}}}else if(z+=h-E,E<q){for(q-=E;O[y++]=g[z++],--E;);z=y-K,N=O}for(;2<q;)O[y++]=N[z++],O[y++]=N[z++],O[y++]=N[z++],q-=3;q&&(O[y++]=N[z++],1<q&&(O[y++]=N[z++]))}else{for(z=y-K;O[y++]=O[z++],O[y++]=O[z++],O[y++]=O[z++],2<(q-=3););q&&(O[y++]=O[z++],1<q&&(O[y++]=O[z++]))}break}}break}}while(l<m&&y<w);l-=q=S>>3,v&=(1<<(S-=q<<3))-1,s.next_in=l,s.next_out=y,s.avail_in=l<m?m-l+5:5-(l-m),s.avail_out=y<w?w-y+257:257-(y-w),o.hold=v,o.bits=S}},{}],49:[function(t,n,i){var s=t("../utils/common"),r=t("./adler32"),o=t("./crc32"),l=t("./inffast"),m=t("./inftrees"),y=1,d=2,w=0,u=-2,b=1,f=852,h=592;function g(z){return(z>>>24&255)+(z>>>8&65280)+((65280&z)<<8)+((255&z)<<24)}function v(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new s.Buf16(320),this.work=new s.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function S(z){var N;return z&&z.state?(N=z.state,z.total_in=z.total_out=N.total=0,z.msg="",N.wrap&&(z.adler=1&N.wrap),N.mode=b,N.last=0,N.havedict=0,N.dmax=32768,N.head=null,N.hold=0,N.bits=0,N.lencode=N.lendyn=new s.Buf32(f),N.distcode=N.distdyn=new s.Buf32(h),N.sane=1,N.back=-1,w):u}function P(z){var N;return z&&z.state?((N=z.state).wsize=0,N.whave=0,N.wnext=0,S(z)):u}function M(z,N){var p,O;return z&&z.state?(O=z.state,N<0?(p=0,N=-N):(p=1+(N>>4),N<48&&(N&=15)),N&&(N<8||15<N)?u:(O.window!==null&&O.wbits!==N&&(O.window=null),O.wrap=p,O.wbits=N,P(z))):u}function I(z,N){var p,O;return z?(O=new v,(z.state=O).window=null,(p=M(z,N))!==w&&(z.state=null),p):u}var $,B,E=!0;function q(z){if(E){var N;for($=new s.Buf32(512),B=new s.Buf32(32),N=0;N<144;)z.lens[N++]=8;for(;N<256;)z.lens[N++]=9;for(;N<280;)z.lens[N++]=7;for(;N<288;)z.lens[N++]=8;for(m(y,z.lens,0,288,$,0,z.work,{bits:9}),N=0;N<32;)z.lens[N++]=5;m(d,z.lens,0,32,B,0,z.work,{bits:5}),E=!1}z.lencode=$,z.lenbits=9,z.distcode=B,z.distbits=5}function K(z,N,p,O){var ee,F=z.state;return F.window===null&&(F.wsize=1<<F.wbits,F.wnext=0,F.whave=0,F.window=new s.Buf8(F.wsize)),O>=F.wsize?(s.arraySet(F.window,N,p-F.wsize,F.wsize,0),F.wnext=0,F.whave=F.wsize):(O<(ee=F.wsize-F.wnext)&&(ee=O),s.arraySet(F.window,N,p-O,ee,F.wnext),(O-=ee)?(s.arraySet(F.window,N,p-O,O,0),F.wnext=O,F.whave=F.wsize):(F.wnext+=ee,F.wnext===F.wsize&&(F.wnext=0),F.whave<F.wsize&&(F.whave+=ee))),0}i.inflateReset=P,i.inflateReset2=M,i.inflateResetKeep=S,i.inflateInit=function(z){return I(z,15)},i.inflateInit2=I,i.inflate=function(z,N){var p,O,ee,F,se,U,ne,D,j,te,J,H,fe,he,ce,de,oe,ie,ye,pe,c,L,R,x,k=0,C=new s.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!z||!z.state||!z.output||!z.input&&z.avail_in!==0)return u;(p=z.state).mode===12&&(p.mode=13),se=z.next_out,ee=z.output,ne=z.avail_out,F=z.next_in,O=z.input,U=z.avail_in,D=p.hold,j=p.bits,te=U,J=ne,L=w;e:for(;;)switch(p.mode){case b:if(p.wrap===0){p.mode=13;break}for(;j<16;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(2&p.wrap&&D===35615){C[p.check=0]=255&D,C[1]=D>>>8&255,p.check=o(p.check,C,2,0),j=D=0,p.mode=2;break}if(p.flags=0,p.head&&(p.head.done=!1),!(1&p.wrap)||(((255&D)<<8)+(D>>8))%31){z.msg="incorrect header check",p.mode=30;break}if((15&D)!=8){z.msg="unknown compression method",p.mode=30;break}if(j-=4,c=8+(15&(D>>>=4)),p.wbits===0)p.wbits=c;else if(c>p.wbits){z.msg="invalid window size",p.mode=30;break}p.dmax=1<<c,z.adler=p.check=1,p.mode=512&D?10:12,j=D=0;break;case 2:for(;j<16;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(p.flags=D,(255&p.flags)!=8){z.msg="unknown compression method",p.mode=30;break}if(57344&p.flags){z.msg="unknown header flags set",p.mode=30;break}p.head&&(p.head.text=D>>8&1),512&p.flags&&(C[0]=255&D,C[1]=D>>>8&255,p.check=o(p.check,C,2,0)),j=D=0,p.mode=3;case 3:for(;j<32;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.head&&(p.head.time=D),512&p.flags&&(C[0]=255&D,C[1]=D>>>8&255,C[2]=D>>>16&255,C[3]=D>>>24&255,p.check=o(p.check,C,4,0)),j=D=0,p.mode=4;case 4:for(;j<16;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.head&&(p.head.xflags=255&D,p.head.os=D>>8),512&p.flags&&(C[0]=255&D,C[1]=D>>>8&255,p.check=o(p.check,C,2,0)),j=D=0,p.mode=5;case 5:if(1024&p.flags){for(;j<16;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.length=D,p.head&&(p.head.extra_len=D),512&p.flags&&(C[0]=255&D,C[1]=D>>>8&255,p.check=o(p.check,C,2,0)),j=D=0}else p.head&&(p.head.extra=null);p.mode=6;case 6:if(1024&p.flags&&(U<(H=p.length)&&(H=U),H&&(p.head&&(c=p.head.extra_len-p.length,p.head.extra||(p.head.extra=new Array(p.head.extra_len)),s.arraySet(p.head.extra,O,F,H,c)),512&p.flags&&(p.check=o(p.check,O,H,F)),U-=H,F+=H,p.length-=H),p.length))break e;p.length=0,p.mode=7;case 7:if(2048&p.flags){if(U===0)break e;for(H=0;c=O[F+H++],p.head&&c&&p.length<65536&&(p.head.name+=String.fromCharCode(c)),c&&H<U;);if(512&p.flags&&(p.check=o(p.check,O,H,F)),U-=H,F+=H,c)break e}else p.head&&(p.head.name=null);p.length=0,p.mode=8;case 8:if(4096&p.flags){if(U===0)break e;for(H=0;c=O[F+H++],p.head&&c&&p.length<65536&&(p.head.comment+=String.fromCharCode(c)),c&&H<U;);if(512&p.flags&&(p.check=o(p.check,O,H,F)),U-=H,F+=H,c)break e}else p.head&&(p.head.comment=null);p.mode=9;case 9:if(512&p.flags){for(;j<16;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(D!==(65535&p.check)){z.msg="header crc mismatch",p.mode=30;break}j=D=0}p.head&&(p.head.hcrc=p.flags>>9&1,p.head.done=!0),z.adler=p.check=0,p.mode=12;break;case 10:for(;j<32;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}z.adler=p.check=g(D),j=D=0,p.mode=11;case 11:if(p.havedict===0)return z.next_out=se,z.avail_out=ne,z.next_in=F,z.avail_in=U,p.hold=D,p.bits=j,2;z.adler=p.check=1,p.mode=12;case 12:if(N===5||N===6)break e;case 13:if(p.last){D>>>=7&j,j-=7&j,p.mode=27;break}for(;j<3;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}switch(p.last=1&D,j-=1,3&(D>>>=1)){case 0:p.mode=14;break;case 1:if(q(p),p.mode=20,N!==6)break;D>>>=2,j-=2;break e;case 2:p.mode=17;break;case 3:z.msg="invalid block type",p.mode=30}D>>>=2,j-=2;break;case 14:for(D>>>=7&j,j-=7&j;j<32;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if((65535&D)!=(D>>>16^65535)){z.msg="invalid stored block lengths",p.mode=30;break}if(p.length=65535&D,j=D=0,p.mode=15,N===6)break e;case 15:p.mode=16;case 16:if(H=p.length){if(U<H&&(H=U),ne<H&&(H=ne),H===0)break e;s.arraySet(ee,O,F,H,se),U-=H,F+=H,ne-=H,se+=H,p.length-=H;break}p.mode=12;break;case 17:for(;j<14;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(p.nlen=257+(31&D),D>>>=5,j-=5,p.ndist=1+(31&D),D>>>=5,j-=5,p.ncode=4+(15&D),D>>>=4,j-=4,286<p.nlen||30<p.ndist){z.msg="too many length or distance symbols",p.mode=30;break}p.have=0,p.mode=18;case 18:for(;p.have<p.ncode;){for(;j<3;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.lens[A[p.have++]]=7&D,D>>>=3,j-=3}for(;p.have<19;)p.lens[A[p.have++]]=0;if(p.lencode=p.lendyn,p.lenbits=7,R={bits:p.lenbits},L=m(0,p.lens,0,19,p.lencode,0,p.work,R),p.lenbits=R.bits,L){z.msg="invalid code lengths set",p.mode=30;break}p.have=0,p.mode=19;case 19:for(;p.have<p.nlen+p.ndist;){for(;de=(k=p.lencode[D&(1<<p.lenbits)-1])>>>16&255,oe=65535&k,!((ce=k>>>24)<=j);){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(oe<16)D>>>=ce,j-=ce,p.lens[p.have++]=oe;else{if(oe===16){for(x=ce+2;j<x;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(D>>>=ce,j-=ce,p.have===0){z.msg="invalid bit length repeat",p.mode=30;break}c=p.lens[p.have-1],H=3+(3&D),D>>>=2,j-=2}else if(oe===17){for(x=ce+3;j<x;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}j-=ce,c=0,H=3+(7&(D>>>=ce)),D>>>=3,j-=3}else{for(x=ce+7;j<x;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}j-=ce,c=0,H=11+(127&(D>>>=ce)),D>>>=7,j-=7}if(p.have+H>p.nlen+p.ndist){z.msg="invalid bit length repeat",p.mode=30;break}for(;H--;)p.lens[p.have++]=c}}if(p.mode===30)break;if(p.lens[256]===0){z.msg="invalid code -- missing end-of-block",p.mode=30;break}if(p.lenbits=9,R={bits:p.lenbits},L=m(y,p.lens,0,p.nlen,p.lencode,0,p.work,R),p.lenbits=R.bits,L){z.msg="invalid literal/lengths set",p.mode=30;break}if(p.distbits=6,p.distcode=p.distdyn,R={bits:p.distbits},L=m(d,p.lens,p.nlen,p.ndist,p.distcode,0,p.work,R),p.distbits=R.bits,L){z.msg="invalid distances set",p.mode=30;break}if(p.mode=20,N===6)break e;case 20:p.mode=21;case 21:if(6<=U&&258<=ne){z.next_out=se,z.avail_out=ne,z.next_in=F,z.avail_in=U,p.hold=D,p.bits=j,l(z,J),se=z.next_out,ee=z.output,ne=z.avail_out,F=z.next_in,O=z.input,U=z.avail_in,D=p.hold,j=p.bits,p.mode===12&&(p.back=-1);break}for(p.back=0;de=(k=p.lencode[D&(1<<p.lenbits)-1])>>>16&255,oe=65535&k,!((ce=k>>>24)<=j);){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(de&&(240&de)==0){for(ie=ce,ye=de,pe=oe;de=(k=p.lencode[pe+((D&(1<<ie+ye)-1)>>ie)])>>>16&255,oe=65535&k,!(ie+(ce=k>>>24)<=j);){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}D>>>=ie,j-=ie,p.back+=ie}if(D>>>=ce,j-=ce,p.back+=ce,p.length=oe,de===0){p.mode=26;break}if(32&de){p.back=-1,p.mode=12;break}if(64&de){z.msg="invalid literal/length code",p.mode=30;break}p.extra=15&de,p.mode=22;case 22:if(p.extra){for(x=p.extra;j<x;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.length+=D&(1<<p.extra)-1,D>>>=p.extra,j-=p.extra,p.back+=p.extra}p.was=p.length,p.mode=23;case 23:for(;de=(k=p.distcode[D&(1<<p.distbits)-1])>>>16&255,oe=65535&k,!((ce=k>>>24)<=j);){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if((240&de)==0){for(ie=ce,ye=de,pe=oe;de=(k=p.distcode[pe+((D&(1<<ie+ye)-1)>>ie)])>>>16&255,oe=65535&k,!(ie+(ce=k>>>24)<=j);){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}D>>>=ie,j-=ie,p.back+=ie}if(D>>>=ce,j-=ce,p.back+=ce,64&de){z.msg="invalid distance code",p.mode=30;break}p.offset=oe,p.extra=15&de,p.mode=24;case 24:if(p.extra){for(x=p.extra;j<x;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}p.offset+=D&(1<<p.extra)-1,D>>>=p.extra,j-=p.extra,p.back+=p.extra}if(p.offset>p.dmax){z.msg="invalid distance too far back",p.mode=30;break}p.mode=25;case 25:if(ne===0)break e;if(H=J-ne,p.offset>H){if((H=p.offset-H)>p.whave&&p.sane){z.msg="invalid distance too far back",p.mode=30;break}fe=H>p.wnext?(H-=p.wnext,p.wsize-H):p.wnext-H,H>p.length&&(H=p.length),he=p.window}else he=ee,fe=se-p.offset,H=p.length;for(ne<H&&(H=ne),ne-=H,p.length-=H;ee[se++]=he[fe++],--H;);p.length===0&&(p.mode=21);break;case 26:if(ne===0)break e;ee[se++]=p.length,ne--,p.mode=21;break;case 27:if(p.wrap){for(;j<32;){if(U===0)break e;U--,D|=O[F++]<<j,j+=8}if(J-=ne,z.total_out+=J,p.total+=J,J&&(z.adler=p.check=p.flags?o(p.check,ee,J,se-J):r(p.check,ee,J,se-J)),J=ne,(p.flags?D:g(D))!==p.check){z.msg="incorrect data check",p.mode=30;break}j=D=0}p.mode=28;case 28:if(p.wrap&&p.flags){for(;j<32;){if(U===0)break e;U--,D+=O[F++]<<j,j+=8}if(D!==(4294967295&p.total)){z.msg="incorrect length check",p.mode=30;break}j=D=0}p.mode=29;case 29:L=1;break e;case 30:L=-3;break e;case 31:return-4;default:return u}return z.next_out=se,z.avail_out=ne,z.next_in=F,z.avail_in=U,p.hold=D,p.bits=j,(p.wsize||J!==z.avail_out&&p.mode<30&&(p.mode<27||N!==4))&&K(z,z.output,z.next_out,J-z.avail_out)?(p.mode=31,-4):(te-=z.avail_in,J-=z.avail_out,z.total_in+=te,z.total_out+=J,p.total+=J,p.wrap&&J&&(z.adler=p.check=p.flags?o(p.check,ee,J,z.next_out-J):r(p.check,ee,J,z.next_out-J)),z.data_type=p.bits+(p.last?64:0)+(p.mode===12?128:0)+(p.mode===20||p.mode===15?256:0),(te==0&&J===0||N===4)&&L===w&&(L=-5),L)},i.inflateEnd=function(z){if(!z||!z.state)return u;var N=z.state;return N.window&&(N.window=null),z.state=null,w},i.inflateGetHeader=function(z,N){var p;return z&&z.state?(2&(p=z.state).wrap)==0?u:((p.head=N).done=!1,w):u},i.inflateSetDictionary=function(z,N){var p,O=N.length;return z&&z.state?(p=z.state).wrap!==0&&p.mode!==11?u:p.mode===11&&r(1,N,O,0)!==p.check?-3:K(z,N,O,O)?(p.mode=31,-4):(p.havedict=1,w):u},i.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(t,n,i){var s=t("../utils/common"),r=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],o=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],l=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],m=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];n.exports=function(y,d,w,u,b,f,h,g){var v,S,P,M,I,$,B,E,q,K=g.bits,z=0,N=0,p=0,O=0,ee=0,F=0,se=0,U=0,ne=0,D=0,j=null,te=0,J=new s.Buf16(16),H=new s.Buf16(16),fe=null,he=0;for(z=0;z<=15;z++)J[z]=0;for(N=0;N<u;N++)J[d[w+N]]++;for(ee=K,O=15;1<=O&&J[O]===0;O--);if(O<ee&&(ee=O),O===0)return b[f++]=20971520,b[f++]=20971520,g.bits=1,0;for(p=1;p<O&&J[p]===0;p++);for(ee<p&&(ee=p),z=U=1;z<=15;z++)if(U<<=1,(U-=J[z])<0)return-1;if(0<U&&(y===0||O!==1))return-1;for(H[1]=0,z=1;z<15;z++)H[z+1]=H[z]+J[z];for(N=0;N<u;N++)d[w+N]!==0&&(h[H[d[w+N]]++]=N);if($=y===0?(j=fe=h,19):y===1?(j=r,te-=257,fe=o,he-=257,256):(j=l,fe=m,-1),z=p,I=f,se=N=D=0,P=-1,M=(ne=1<<(F=ee))-1,y===1&&852<ne||y===2&&592<ne)return 1;for(;;){for(B=z-se,q=h[N]<$?(E=0,h[N]):h[N]>$?(E=fe[he+h[N]],j[te+h[N]]):(E=96,0),v=1<<z-se,p=S=1<<F;b[I+(D>>se)+(S-=v)]=B<<24|E<<16|q|0,S!==0;);for(v=1<<z-1;D&v;)v>>=1;if(v!==0?(D&=v-1,D+=v):D=0,N++,--J[z]==0){if(z===O)break;z=d[w+h[N]]}if(ee<z&&(D&M)!==P){for(se===0&&(se=ee),I+=p,U=1<<(F=z-se);F+se<O&&!((U-=J[F+se])<=0);)F++,U<<=1;if(ne+=1<<F,y===1&&852<ne||y===2&&592<ne)return 1;b[P=D&M]=ee<<24|F<<16|I-f|0}}return D!==0&&(b[I+D]=z-se<<24|64<<16|0),g.bits=ee,0}},{"../utils/common":41}],51:[function(t,n,i){n.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(t,n,i){var s=t("../utils/common"),r=0,o=1;function l(k){for(var C=k.length;0<=--C;)k[C]=0}var m=0,y=29,d=256,w=d+1+y,u=30,b=19,f=2*w+1,h=15,g=16,v=7,S=256,P=16,M=17,I=18,$=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],B=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],E=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],q=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],K=new Array(2*(w+2));l(K);var z=new Array(2*u);l(z);var N=new Array(512);l(N);var p=new Array(256);l(p);var O=new Array(y);l(O);var ee,F,se,U=new Array(u);function ne(k,C,A,T,_){this.static_tree=k,this.extra_bits=C,this.extra_base=A,this.elems=T,this.max_length=_,this.has_stree=k&&k.length}function D(k,C){this.dyn_tree=k,this.max_code=0,this.stat_desc=C}function j(k){return k<256?N[k]:N[256+(k>>>7)]}function te(k,C){k.pending_buf[k.pending++]=255&C,k.pending_buf[k.pending++]=C>>>8&255}function J(k,C,A){k.bi_valid>g-A?(k.bi_buf|=C<<k.bi_valid&65535,te(k,k.bi_buf),k.bi_buf=C>>g-k.bi_valid,k.bi_valid+=A-g):(k.bi_buf|=C<<k.bi_valid&65535,k.bi_valid+=A)}function H(k,C,A){J(k,A[2*C],A[2*C+1])}function fe(k,C){for(var A=0;A|=1&k,k>>>=1,A<<=1,0<--C;);return A>>>1}function he(k,C,A){var T,_,W=new Array(h+1),Z=0;for(T=1;T<=h;T++)W[T]=Z=Z+A[T-1]<<1;for(_=0;_<=C;_++){var Y=k[2*_+1];Y!==0&&(k[2*_]=fe(W[Y]++,Y))}}function ce(k){var C;for(C=0;C<w;C++)k.dyn_ltree[2*C]=0;for(C=0;C<u;C++)k.dyn_dtree[2*C]=0;for(C=0;C<b;C++)k.bl_tree[2*C]=0;k.dyn_ltree[2*S]=1,k.opt_len=k.static_len=0,k.last_lit=k.matches=0}function de(k){8<k.bi_valid?te(k,k.bi_buf):0<k.bi_valid&&(k.pending_buf[k.pending++]=k.bi_buf),k.bi_buf=0,k.bi_valid=0}function oe(k,C,A,T){var _=2*C,W=2*A;return k[_]<k[W]||k[_]===k[W]&&T[C]<=T[A]}function ie(k,C,A){for(var T=k.heap[A],_=A<<1;_<=k.heap_len&&(_<k.heap_len&&oe(C,k.heap[_+1],k.heap[_],k.depth)&&_++,!oe(C,T,k.heap[_],k.depth));)k.heap[A]=k.heap[_],A=_,_<<=1;k.heap[A]=T}function ye(k,C,A){var T,_,W,Z,Y=0;if(k.last_lit!==0)for(;T=k.pending_buf[k.d_buf+2*Y]<<8|k.pending_buf[k.d_buf+2*Y+1],_=k.pending_buf[k.l_buf+Y],Y++,T===0?H(k,_,C):(H(k,(W=p[_])+d+1,C),(Z=$[W])!==0&&J(k,_-=O[W],Z),H(k,W=j(--T),A),(Z=B[W])!==0&&J(k,T-=U[W],Z)),Y<k.last_lit;);H(k,S,C)}function pe(k,C){var A,T,_,W=C.dyn_tree,Z=C.stat_desc.static_tree,Y=C.stat_desc.has_stree,Q=C.stat_desc.elems,ue=-1;for(k.heap_len=0,k.heap_max=f,A=0;A<Q;A++)W[2*A]!==0?(k.heap[++k.heap_len]=ue=A,k.depth[A]=0):W[2*A+1]=0;for(;k.heap_len<2;)W[2*(_=k.heap[++k.heap_len]=ue<2?++ue:0)]=1,k.depth[_]=0,k.opt_len--,Y&&(k.static_len-=Z[2*_+1]);for(C.max_code=ue,A=k.heap_len>>1;1<=A;A--)ie(k,W,A);for(_=Q;A=k.heap[1],k.heap[1]=k.heap[k.heap_len--],ie(k,W,1),T=k.heap[1],k.heap[--k.heap_max]=A,k.heap[--k.heap_max]=T,W[2*_]=W[2*A]+W[2*T],k.depth[_]=(k.depth[A]>=k.depth[T]?k.depth[A]:k.depth[T])+1,W[2*A+1]=W[2*T+1]=_,k.heap[1]=_++,ie(k,W,1),2<=k.heap_len;);k.heap[--k.heap_max]=k.heap[1],(function(le,ke){var Ke,_e,Qe,me,lt,Dt,$e=ke.dyn_tree,ca=ke.max_code,Lr=ke.stat_desc.static_tree,Br=ke.stat_desc.has_stree,Or=ke.stat_desc.extra_bits,la=ke.stat_desc.extra_base,et=ke.stat_desc.max_length,dt=0;for(me=0;me<=h;me++)le.bl_count[me]=0;for($e[2*le.heap[le.heap_max]+1]=0,Ke=le.heap_max+1;Ke<f;Ke++)et<(me=$e[2*$e[2*(_e=le.heap[Ke])+1]+1]+1)&&(me=et,dt++),$e[2*_e+1]=me,ca<_e||(le.bl_count[me]++,lt=0,la<=_e&&(lt=Or[_e-la]),Dt=$e[2*_e],le.opt_len+=Dt*(me+lt),Br&&(le.static_len+=Dt*(Lr[2*_e+1]+lt)));if(dt!==0){do{for(me=et-1;le.bl_count[me]===0;)me--;le.bl_count[me]--,le.bl_count[me+1]+=2,le.bl_count[et]--,dt-=2}while(0<dt);for(me=et;me!==0;me--)for(_e=le.bl_count[me];_e!==0;)ca<(Qe=le.heap[--Ke])||($e[2*Qe+1]!==me&&(le.opt_len+=(me-$e[2*Qe+1])*$e[2*Qe],$e[2*Qe+1]=me),_e--)}})(k,C),he(W,ue,k.bl_count)}function c(k,C,A){var T,_,W=-1,Z=C[1],Y=0,Q=7,ue=4;for(Z===0&&(Q=138,ue=3),C[2*(A+1)+1]=65535,T=0;T<=A;T++)_=Z,Z=C[2*(T+1)+1],++Y<Q&&_===Z||(Y<ue?k.bl_tree[2*_]+=Y:_!==0?(_!==W&&k.bl_tree[2*_]++,k.bl_tree[2*P]++):Y<=10?k.bl_tree[2*M]++:k.bl_tree[2*I]++,W=_,ue=(Y=0)===Z?(Q=138,3):_===Z?(Q=6,3):(Q=7,4))}function L(k,C,A){var T,_,W=-1,Z=C[1],Y=0,Q=7,ue=4;for(Z===0&&(Q=138,ue=3),T=0;T<=A;T++)if(_=Z,Z=C[2*(T+1)+1],!(++Y<Q&&_===Z)){if(Y<ue)for(;H(k,_,k.bl_tree),--Y!=0;);else _!==0?(_!==W&&(H(k,_,k.bl_tree),Y--),H(k,P,k.bl_tree),J(k,Y-3,2)):Y<=10?(H(k,M,k.bl_tree),J(k,Y-3,3)):(H(k,I,k.bl_tree),J(k,Y-11,7));W=_,ue=(Y=0)===Z?(Q=138,3):_===Z?(Q=6,3):(Q=7,4)}}l(U);var R=!1;function x(k,C,A,T){J(k,(m<<1)+(T?1:0),3),(function(_,W,Z,Y){de(_),te(_,Z),te(_,~Z),s.arraySet(_.pending_buf,_.window,W,Z,_.pending),_.pending+=Z})(k,C,A)}i._tr_init=function(k){R||((function(){var C,A,T,_,W,Z=new Array(h+1);for(_=T=0;_<y-1;_++)for(O[_]=T,C=0;C<1<<$[_];C++)p[T++]=_;for(p[T-1]=_,_=W=0;_<16;_++)for(U[_]=W,C=0;C<1<<B[_];C++)N[W++]=_;for(W>>=7;_<u;_++)for(U[_]=W<<7,C=0;C<1<<B[_]-7;C++)N[256+W++]=_;for(A=0;A<=h;A++)Z[A]=0;for(C=0;C<=143;)K[2*C+1]=8,C++,Z[8]++;for(;C<=255;)K[2*C+1]=9,C++,Z[9]++;for(;C<=279;)K[2*C+1]=7,C++,Z[7]++;for(;C<=287;)K[2*C+1]=8,C++,Z[8]++;for(he(K,w+1,Z),C=0;C<u;C++)z[2*C+1]=5,z[2*C]=fe(C,5);ee=new ne(K,$,d+1,w,h),F=new ne(z,B,0,u,h),se=new ne(new Array(0),E,0,b,v)})(),R=!0),k.l_desc=new D(k.dyn_ltree,ee),k.d_desc=new D(k.dyn_dtree,F),k.bl_desc=new D(k.bl_tree,se),k.bi_buf=0,k.bi_valid=0,ce(k)},i._tr_stored_block=x,i._tr_flush_block=function(k,C,A,T){var _,W,Z=0;0<k.level?(k.strm.data_type===2&&(k.strm.data_type=(function(Y){var Q,ue=4093624447;for(Q=0;Q<=31;Q++,ue>>>=1)if(1&ue&&Y.dyn_ltree[2*Q]!==0)return r;if(Y.dyn_ltree[18]!==0||Y.dyn_ltree[20]!==0||Y.dyn_ltree[26]!==0)return o;for(Q=32;Q<d;Q++)if(Y.dyn_ltree[2*Q]!==0)return o;return r})(k)),pe(k,k.l_desc),pe(k,k.d_desc),Z=(function(Y){var Q;for(c(Y,Y.dyn_ltree,Y.l_desc.max_code),c(Y,Y.dyn_dtree,Y.d_desc.max_code),pe(Y,Y.bl_desc),Q=b-1;3<=Q&&Y.bl_tree[2*q[Q]+1]===0;Q--);return Y.opt_len+=3*(Q+1)+5+5+4,Q})(k),_=k.opt_len+3+7>>>3,(W=k.static_len+3+7>>>3)<=_&&(_=W)):_=W=A+5,A+4<=_&&C!==-1?x(k,C,A,T):k.strategy===4||W===_?(J(k,2+(T?1:0),3),ye(k,K,z)):(J(k,4+(T?1:0),3),(function(Y,Q,ue,le){var ke;for(J(Y,Q-257,5),J(Y,ue-1,5),J(Y,le-4,4),ke=0;ke<le;ke++)J(Y,Y.bl_tree[2*q[ke]+1],3);L(Y,Y.dyn_ltree,Q-1),L(Y,Y.dyn_dtree,ue-1)})(k,k.l_desc.max_code+1,k.d_desc.max_code+1,Z+1),ye(k,k.dyn_ltree,k.dyn_dtree)),ce(k),T&&de(k)},i._tr_tally=function(k,C,A){return k.pending_buf[k.d_buf+2*k.last_lit]=C>>>8&255,k.pending_buf[k.d_buf+2*k.last_lit+1]=255&C,k.pending_buf[k.l_buf+k.last_lit]=255&A,k.last_lit++,C===0?k.dyn_ltree[2*A]++:(k.matches++,C--,k.dyn_ltree[2*(p[A]+d+1)]++,k.dyn_dtree[2*j(C)]++),k.last_lit===k.lit_bufsize-1},i._tr_align=function(k){J(k,2,3),H(k,S,K),(function(C){C.bi_valid===16?(te(C,C.bi_buf),C.bi_buf=0,C.bi_valid=0):8<=C.bi_valid&&(C.pending_buf[C.pending++]=255&C.bi_buf,C.bi_buf>>=8,C.bi_valid-=8)})(k)}},{"../utils/common":41}],53:[function(t,n,i){n.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(t,n,i){(function(s){(function(r,o){if(!r.setImmediate){var l,m,y,d,w=1,u={},b=!1,f=r.document,h=Object.getPrototypeOf&&Object.getPrototypeOf(r);h=h&&h.setTimeout?h:r,l={}.toString.call(r.process)==="[object process]"?function(P){process.nextTick(function(){v(P)})}:(function(){if(r.postMessage&&!r.importScripts){var P=!0,M=r.onmessage;return r.onmessage=function(){P=!1},r.postMessage("","*"),r.onmessage=M,P}})()?(d="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",S,!1):r.attachEvent("onmessage",S),function(P){r.postMessage(d+P,"*")}):r.MessageChannel?((y=new MessageChannel).port1.onmessage=function(P){v(P.data)},function(P){y.port2.postMessage(P)}):f&&"onreadystatechange"in f.createElement("script")?(m=f.documentElement,function(P){var M=f.createElement("script");M.onreadystatechange=function(){v(P),M.onreadystatechange=null,m.removeChild(M),M=null},m.appendChild(M)}):function(P){setTimeout(v,0,P)},h.setImmediate=function(P){typeof P!="function"&&(P=new Function(""+P));for(var M=new Array(arguments.length-1),I=0;I<M.length;I++)M[I]=arguments[I+1];var $={callback:P,args:M};return u[w]=$,l(w),w++},h.clearImmediate=g}function g(P){delete u[P]}function v(P){if(b)setTimeout(v,0,P);else{var M=u[P];if(M){b=!0;try{(function(I){var $=I.callback,B=I.args;switch(B.length){case 0:$();break;case 1:$(B[0]);break;case 2:$(B[0],B[1]);break;case 3:$(B[0],B[1],B[2]);break;default:$.apply(o,B)}})(M)}finally{g(P),b=!1}}}}function S(P){P.source===r&&typeof P.data=="string"&&P.data.indexOf(d)===0&&v(+P.data.slice(d.length))}})(typeof self>"u"?s===void 0?this:s:self)}).call(this,typeof ft<"u"?ft:typeof self<"u"?self:typeof window<"u"?window:{})},{}]},{},[10])(10)})})(Ot)),Ot.exports}var pc=dc();const uc=lc(pc);function vr(e){const a=e.effects.filter(n=>n.enabled),t=a.map(n=>({instanceId:n.instanceId,effectId:n.effectId,seed:n.seed,settings:n.settings}));return{html:fc(),css:yc(a),javascript:mc(t),estimatedDomNodes:gc(a),estimatedPerformanceCost:bc(a)}}function fc(){return`
<div id="animated-effects-root"></div>
`.trim()}function yc(e){return`
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

${hc(e).map(t=>Je(t)?.css).filter(t=>!!t).join(`

`)}
`.trim()}function mc(e){const t=[...new Set(e.map(s=>s.effectId))].map(s=>{const r=Je(s);return r?{effectId:s,rendererName:r.streamElementsRendererName,source:r.streamElementsRendererSource}:null}).filter(s=>s!==null),n=t.map(s=>s.source).join(`

`),i=t.map(s=>`${JSON.stringify(s.effectId)}: ${s.rendererName}`).join(`,
  `);return`
const effects = ${JSON.stringify(e,null,2)};

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

const aeRenderers = {
  ${i}
};

function startAnimatedEffects() {
  const root =
    document.getElementById(
      "animated-effects-root"
    );

  if (!root) {
    console.error(
      "Animated Effects: " +
      "#animated-effects-root " +
      "not found."
    );

    return;
  }

  root.replaceChildren();

  effects.forEach(
    function (effect) {
      const renderer =
        aeRenderers[
          effect.effectId
        ];

      if (!renderer) {
        console.warn(
          "Animated Effects: " +
          "unknown effect",
          effect.effectId
        );

        return;
      }

      renderer(
        effect,
        root
      );
    }
  );

  console.log(
    "Animated Effects started:",
    effects.length,
    "effect(s)"
  );
}

window.addEventListener(
  "onWidgetLoad",
  startAnimatedEffects
);
`.trim()}function hc(e){return[...new Set(e.map(a=>a.effectId))]}function gc(e){let a=1;for(const t of e){a+=1;const n=Je(t.effectId);n&&(a+=n.estimateDomNodes(t.settings))}return a}function bc(e){return e.reduce((a,t)=>{const n=Je(t.effectId);return a+(n?.definition.performanceCost??1)},0)}let mt=null,Yt=!1,xt=!1,tt=null;function wc(e){return e.replace(/<\/script/gi,"<\\/script")}function zr(e){let a=2166136261;for(let t=0;t<e.length;t++)a^=e.charCodeAt(t),a=Math.imul(a,16777619);return a>>>0}function kc(e){return e.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"effect"}async function Sr(e,a,t,n){const i=vr(e),s=document.createElement("iframe");Object.assign(s.style,{position:"fixed",left:"-100000px",top:"0",width:`${a}px`,height:`${t}px`,border:"0",pointerEvents:"none"}),s.width=String(a),s.height=String(t),s.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>${i.css}
html,body{width:${a}px!important;height:${t}px!important;${n?`background:${n}!important;`:"background:transparent!important;"}}</style></head><body>${i.html}<script>${wc(i.javascript)}<\/script></body></html>`,document.body.appendChild(s),await new Promise((m,y)=>{const d=window.setTimeout(()=>y(new Error("Timeout renderera eksportu.")),1e4);s.addEventListener("load",()=>{clearTimeout(d),m()},{once:!0})});const r=s.contentWindow,o=s.contentDocument;if(!r||!o)throw s.remove(),new Error("Nie udało się utworzyÄ‡ renderera eksportu.");r.dispatchEvent(new Event("onWidgetLoad")),await new Promise(m=>requestAnimationFrame(()=>requestAnimationFrame(()=>m())));const l=o.getElementById("animated-effects-root");if(!l)throw s.remove(),new Error("Renderer eksportu nie utworzyĹ‚ sceny.");return{iframe:s,root:l,document:o}}function xc(e,a){e.document.getAnimations().forEach(t=>{t.pause();try{t.currentTime=a}catch{}})}async function Pr(e,a,t,n,i){return xc(e,n),await new Promise(s=>requestAnimationFrame(()=>s())),Go(e.root,{width:a,height:t,canvasWidth:a,canvasHeight:t,pixelRatio:1,backgroundColor:i??void 0})}function Me(e,a,t){const n=Number(e.querySelector(a)?.value);return Number.isFinite(n)?n:t}function ta(e){const a=e.querySelector("[data-media-background]")?.value??"black";return a==="transparent"?null:a==="black"?"#000000":e.querySelector("[data-media-color]")?.value??"#080b12"}function Be(e,a,t=0){const n=e.querySelector("[data-media-status]");n&&(n.textContent=a);const i=e.querySelector("[data-media-progress]");i&&(i.value=Math.max(0,Math.min(100,t)))}function Re(e,a,t=0){const n=e.querySelector("[data-batch-status]");n&&(n.textContent=a);const i=e.querySelector("[data-batch-progress]");i&&(i.value=Math.max(0,Math.min(100,t)))}function Cr(e,a){const t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=a,n.click(),setTimeout(()=>URL.revokeObjectURL(t),1500)}async function Mr(e,a,t,n,i,s,r,o,l){const m=Math.max(1,Math.round(n*i)),y=Math.round(1e3/i),d=await Sr(e,a,t,r),w=rc();try{for(let u=0;u<m;u++){if(o())return null;const f=(await Pr(d,a,t,u*(1e3/i),r)).getContext("2d",{willReadFrequently:!0});if(!f)throw new Error("Brak Canvas 2D.");const h=f.getImageData(0,0,a,t).data,g=Ko(h,s,{format:"rgb565"}),v=ec(h,g,"rgb565");w.writeFrame(v,a,t,{palette:g,delay:y,repeat:0}),l(u+1,m),await new Promise(S=>setTimeout(S,0))}return w.finish(),new Blob([w.bytes()],{type:"image/gif"})}finally{d.iframe.remove()}}async function vc(e){const a=Math.round(Me(e,"[data-media-width]",1920)),t=Math.round(Me(e,"[data-media-height]",1080)),n=Me(e,"[data-png-time]",0)*1e3,i=ta(e);Be(e,"Renderowanie PNG...",20);const s=await Sr(be(),a,t,i);try{const r=await Pr(s,a,t,n,i),o=await new Promise((l,m)=>r.toBlob(y=>y?l(y):m(new Error("Nie udało się zakodowaÄ‡ PNG.")),"image/png"));Cr(o,`animated-effects-${a}x${t}.png`),Be(e,`PNG gotowy · ${(o.size/1024/1024).toFixed(1)} MB`,100)}finally{s.iframe.remove()}}async function zc(e){Yt=!1;const a=Math.max(240,Math.min(1920,Math.round(Me(e,"[data-media-width]",1280)))),t=Math.max(240,Math.min(1080,Math.round(Me(e,"[data-media-height]",720)))),n=Math.max(.5,Math.min(30,Me(e,"[data-gif-seconds]",5))),i=Math.max(5,Math.min(30,Math.round(Me(e,"[data-gif-fps]",15)))),s=e.querySelector("[data-gif-quality]")?.value??"medium",r=s==="low"?96:s==="high"?256:160,o=ta(e),l=await Mr(be(),a,t,n,i,r,o,()=>Yt,(d,w)=>{Be(e,`GIF · klatka ${d} / ${w}`,d/w*100)});if(!l){Be(e,"Generowanie anulowane.",0);return}tt&&URL.revokeObjectURL(tt),tt=URL.createObjectURL(l);const m=e.querySelector("[data-gif-preview]");m&&(m.src=tt,m.hidden=!1);const y=e.querySelector("[data-gif-save]");y&&(y.href=tt,y.download=`animated-effects-${a}x${t}-${i}fps.gif`,y.hidden=!1),Be(e,`GIF gotowy · ${(l.size/1024/1024).toFixed(1)} MB`,100)}function Sc(e,a){const t=ot().find(s=>s.id===a);if(!t)throw new Error(`Nie znaleziono efektu: ${a}`);const n=structuredClone(e),i=`batch-${a}`;return n.effects=[{instanceId:i,effectId:t.id,seed:zr(t.id),enabled:!0,settings:{...t.defaultSettings},label:t.name,locked:!1,groupId:null}],n.selectedEffectInstanceId=i,n.activePresetId=null,n}async function Pc(e){xt=!1;const a=Math.max(320,Math.min(1280,Math.round(Me(e,"[data-batch-width]",640)))),t=Math.max(180,Math.min(720,Math.round(Me(e,"[data-batch-height]",360)))),n=Math.max(1,Math.min(30,Me(e,"[data-batch-seconds]",10))),i=Math.max(5,Math.min(20,Math.round(Me(e,"[data-batch-fps]",12)))),s=e.querySelector("[data-batch-quality]")?.value??"medium",r=s==="low"?80:s==="high"?192:128,o=e.querySelector("[data-batch-category]")?.value??"all",l=ot().filter(f=>o==="all"||f.category===o);if(l.length===0){Re(e,"Brak efektów dla wybranego filtra.",0);return}const m=e.querySelector("[data-batch-gif]"),y=e.querySelector("[data-cancel-batch]");m&&(m.disabled=!0),y&&(y.hidden=!1);const d=new uc,w=be(),u=ta(e),b=[];try{for(let h=0;h<l.length;h++){if(xt){Re(e,"Batch anulowany.",0);return}const g=l[h],v=Sc(w,g.id),S=h/l.length,P=1/l.length;Re(e,`GIF ${h+1} / ${l.length} · ${g.name}`,S*94);const M=await Mr(v,a,t,n,i,r,u,()=>xt,($,B)=>{const E=$/B;Re(e,`${g.name} · klatka ${$} / ${B}`,(S+P*E)*94)});if(!M){Re(e,"Batch anulowany.",0);return}const I=kc(g.id);d.file(`${I}.gif`,M),b.push({id:g.id,name:g.name,seed:zr(g.id)}),await new Promise($=>setTimeout($,0))}d.file("manifest.json",JSON.stringify({generatedAt:new Date().toISOString(),width:a,height:t,seconds:n,fps:i,category:o,effects:b},null,2)),Re(e,"Pakowanie ZIP...",95);const f=await d.generateAsync({type:"blob",compression:"STORE"},h=>{Re(e,`Pakowanie ZIP · ${Math.round(h.percent)}%`,95+h.percent*.05)});Cr(f,`animated-effects-batch-${a}x${t}-${n}s.zip`),Re(e,`Gotowe · ${l.length} GIF · ${(f.size/1024/1024).toFixed(1)} MB ZIP`,100)}finally{m&&(m.disabled=!1),y&&(y.hidden=!0)}}function Cc(){const e=ot(),a=[...new Set(e.map(n=>n.category))].sort(),t=document.createElement("dialog");return t.className="export-dialog ae-media-dialog",t.innerHTML=`<div class="export-header"><div><strong>PNG / GIF</strong><span>Render sceny bez interfejsu edytora</span></div><button type="button" data-media-close>×</button></div>
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
        <label>Zakres<select data-batch-category><option value="all">Wszystkie efekty</option>${a.map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
      </div>

      <div class="ae-media-actions">
        <button class="ae-button ae-button-primary" type="button" data-batch-gif>Generuj wszystkie do ZIP</button>
        <button class="ae-button ae-button-secondary" type="button" data-cancel-batch hidden>Anuluj batch</button>
      </div>

      <progress max="100" value="0" data-batch-progress></progress>
      <div data-batch-status>Gotowe · ${e.length} efektów dostÄ™pnych.</div>
    </section>
  </div>`,t.querySelector("[data-media-close]")?.addEventListener("click",()=>t.close()),t.querySelector("[data-cancel-gif]")?.addEventListener("click",()=>{Yt=!0}),t.querySelector("[data-cancel-batch]")?.addEventListener("click",()=>{xt=!0}),t.querySelector("[data-generate-png]")?.addEventListener("click",()=>{vc(t).catch(n=>Be(t,n instanceof Error?n.message:String(n),0))}),t.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{zc(t).catch(n=>Be(t,n instanceof Error?n.message:String(n),0))}),t.querySelector("[data-batch-gif]")?.addEventListener("click",()=>{Pc(t).catch(n=>Re(t,n instanceof Error?n.message:String(n),0))}),document.body.appendChild(t),t}function Mc(){mt||(mt=Cc()),mt.open||mt.showModal()}const Er="animated-effects:pack06:favorites",_r="animated-effects:pack06:usage",$r="animated-effects:pack06:recent";let Ia=!1,St=!1,at=null,Tt=null;const Ge=new Set;let ht=null;function aa(e,a){try{const t=localStorage.getItem(e);return t?JSON.parse(t):a}catch{return a}}function Ht(e,a){try{localStorage.setItem(e,JSON.stringify(a))}catch{}}let Ue=new Set(aa(Er,[])),Ye=aa(_r,{}),st=aa($r,{});function Ec(e){Ye={...Ye,[e]:(Ye[e]??0)+1},st={...st,[e]:Date.now()},Ht(_r,Ye),Ht($r,st)}function _c(e){const a=e.querySelector(".ae-effect-card-main strong")?.textContent?.trim();return a?ot().find(t=>t.name===a):void 0}function $c(e,a){if(e.style.setProperty("display","grid","important"),e.style.setProperty("height","auto","important"),e.style.setProperty("overflow","hidden","important"),e.style.setProperty("align-items","center","important"),e.style.setProperty("box-sizing","border-box","important"),a){e.style.setProperty("grid-template-columns","26px minmax(0, 1fr)","important"),e.style.setProperty("grid-template-areas",'"favorite preview" "actions actions"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto) 36px","important"),e.style.setProperty("min-height","98px","important"),e.style.setProperty("padding","7px 8px 10px","important"),e.style.setProperty("column-gap","7px","important"),e.style.setProperty("row-gap","8px","important");return}e.style.setProperty("grid-template-columns","26px minmax(0, 1fr) 36px","important"),e.style.setProperty("grid-template-areas",'"favorite preview add"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto)","important"),e.style.setProperty("min-height","58px","important"),e.style.setProperty("padding","6px 8px","important"),e.style.setProperty("gap","6px","important")}function Rc(e){e.style.setProperty("display","grid","important"),e.style.setProperty("grid-template-columns","repeat(3, minmax(0, 1fr))","important"),e.style.setProperty("grid-area","actions","important"),e.style.setProperty("height","36px","important"),e.style.setProperty("min-height","36px","important"),e.style.setProperty("margin","0 0 0 28px","important"),e.style.setProperty("padding","0","important"),e.style.setProperty("gap","6px","important"),e.style.setProperty("align-self","end","important"),e.querySelectorAll("button").forEach(a=>{a.style.setProperty("height","34px","important"),a.style.setProperty("min-height","34px","important"),a.style.setProperty("width","100%","important"),a.style.setProperty("min-width","0","important"),a.style.setProperty("margin","0","important"),a.style.setProperty("padding","0 6px","important")})}function jc(){const e=document.querySelector("#effect-library");if(!e)return;const a=be(),t=document.querySelector("#pack06-library-mode")?.value??"all",n=document.querySelector("#pack06-library-sort")?.value??"name",i=Array.from(e.querySelectorAll(".ae-effect-card"));for(const r of i){const o=_c(r);if(!o)continue;r.dataset.pack06="1",r.dataset.effectId=o.id;const l=a.effects.filter(b=>b.effectId===o.id),m=l.at(-1)??null,y=[...l].reverse().find(b=>!b.locked)??null,d=l.length>0;r.classList.toggle("is-on-scene",d),r.dataset.pack13Card="1",r.dataset.pack13Active=d?"1":"0",r.dataset.pack14Card="1",r.dataset.pack14Active=d?"1":"0",$c(r,d);const w=r.querySelector(".ae-add-icon");w&&w.parentElement!==r&&r.appendChild(w),r.querySelector(":scope > .ae-pack06-favorite")?.remove(),r.querySelector(":scope > .ae-pack06-card-actions")?.remove(),r.querySelector(".ae-pack06-scene-badge")?.remove();const u=document.createElement("button");if(u.type="button",u.className="ae-pack06-favorite",u.textContent=Ue.has(o.id)?"★":"☆",u.title="Ulubione",u.addEventListener("click",()=>{Ue.has(o.id)?Ue.delete(o.id):Ue.add(o.id),Ht(Er,[...Ue]),Ze()}),r.prepend(u),d){const b=r.querySelector(".ae-effect-card-subline");if(b){const f=document.createElement("span");f.className="ae-pack06-scene-badge",f.textContent="NA SCENIE",b.appendChild(f)}}if(w)if(w.dataset.pack14Track!=="1"&&(w.dataset.pack14Track="1",w.addEventListener("click",()=>{Ec(o.id)},{capture:!0})),d){const b=document.createElement("div");b.className="ae-pack06-card-actions ae-pack14-card-actions";const f=document.createElement("button");f.type="button",f.className="ae-pack06-minus",f.textContent="−",f.disabled=!y,f.title=y?"Usuń ostatnią niezablokowaną instancję":"Wszystkie instancje są zablokowane",f.addEventListener("click",()=>{y&&Ka(y.instanceId)});const h=document.createElement("button");h.type="button",h.className="ae-pack06-count",h.textContent=`${l.length}×`,h.title="Pokaż w Warstwach",h.addEventListener("click",()=>{m&&(Qa(m.instanceId),document.querySelector('[data-sidebar-tab="layers"]')?.click(),setTimeout(()=>{document.querySelector(`[data-pack06-instance-id="${m.instanceId}"]`)?.scrollIntoView({block:"nearest"})},0))}),b.append(f,h,w),Rc(b),r.appendChild(b)}else w.parentElement!==r&&r.appendChild(w)}const s=Array.from(e.querySelectorAll(".ae-effect-card[data-effect-id]"));for(const r of s){const o=r.dataset.effectId??"",l=a.effects.filter(m=>m.effectId===o).length;r.hidden=t==="favorites"&&!Ue.has(o)||t==="scene"&&l===0}s.sort((r,o)=>{const l=r.dataset.effectId??"",m=o.dataset.effectId??"",y=Se(l),d=Se(m);if(!y||!d)return 0;switch(n){case"used":return(Ye[m]??0)-(Ye[l]??0);case"recent":return(st[m]??0)-(st[l]??0);case"light":return y.performanceCost-d.performanceCost;case"heavy":return d.performanceCost-y.performanceCost;case"category":return y.category.localeCompare(d.category)||y.name.localeCompare(d.name);default:return y.name.localeCompare(d.name)}}),s.forEach(r=>{e.appendChild(r)})}function Dc(){const e=Array.from(document.querySelectorAll(".ae-layer-row")),a=[...be().effects].reverse();e.forEach((t,n)=>{const i=a[n];if(!i)return;t.dataset.pack06InstanceId=i.instanceId,t.classList.toggle("is-locked",!!i.locked),t.classList.toggle("is-solo",Ge.has(i.instanceId));const s=t.querySelector(".ae-layer-copy strong");s&&i.label&&(s.textContent=i.label);const r=t.querySelector(".ae-layer-actions");if(!r||r.dataset.pack06==="1")return;r.dataset.pack06="1";const o=document.createElement("button");o.type="button",o.className="ae-icon-button ae-pack06-solo",o.textContent="S",o.title="Solo",o.addEventListener("click",()=>{Ge.has(i.instanceId)?Ge.delete(i.instanceId):Ge.add(i.instanceId),ra(),Ze()});const l=document.createElement("button");l.type="button",l.className="ae-icon-button ae-pack06-lock",l.textContent=i.locked?"L":"U",l.title=i.locked?"Odblokuj":"Zablokuj",l.addEventListener("click",()=>Ni(i.instanceId));const m=document.createElement("button");m.type="button",m.className="ae-icon-button ae-pack06-duplicate",m.textContent="⧉",m.title="Duplikuj · Shift = zachowaj seed",m.addEventListener("click",y=>ji(i.instanceId,y.shiftKey)),r.append(o,l,m);for(const y of[".layer-remove",".layer-up",".layer-down"]){const d=t.querySelector(y);d&&i.locked&&(d.disabled=!0)}t.querySelector(".ae-layer-select")?.addEventListener("dblclick",()=>{const y=Se(i.effectId),d=window.prompt("Nazwa warstwy:",i.label??y?.name??i.effectId);d!==null&&Ai(i.instanceId,d)}),t.draggable=!i.locked,t.addEventListener("dragstart",()=>{i.locked||(at=i.instanceId,t.classList.add("is-dragging"))}),t.addEventListener("dragend",()=>{at=null,t.classList.remove("is-dragging")}),t.addEventListener("dragover",y=>{at&&!i.locked&&y.preventDefault()}),t.addEventListener("drop",y=>{y.preventDefault(),at&&Oi(at,i.instanceId)})})}function ra(){const e=document.querySelector("#effect-preview");e&&(e.classList.toggle("is-pack06-paused",St),e.querySelectorAll(".effect-layer").forEach(a=>{const t=a.dataset.instanceId;a.style.display=Ge.size===0||t&&Ge.has(t)?"":"none"}))}function Ic(){const e=document.querySelector("#inspector"),a=nt();if(!e||!a||e.querySelector("[data-pack06-inspector]"))return;const t=Se(a.effectId);if(!t)return;const n=document.createElement("section");n.className="inspector-group ae-pack06-inspector",n.dataset.pack06Inspector="1",n.innerHTML=`<div class="ae-pack06-inspector-title"><strong>Losowość i narzędzia</strong><span>Seed, intensywność i kopiowanie ustawień</span></div>
  <label class="inspector-field"><span class="inspector-label"><span>Seed</span></span><div class="ae-pack06-seed-row"><input type="number" min="0" max="4294967295" value="${a.seed}" data-pack06-seed><button type="button" class="inspector-field-reset" data-pack06-reroll>Losuj</button></div></label>
  ${t.capabilities.intensity?`<label class="inspector-field"><span class="inspector-label"><span>Intensywność</span><output data-pack06-intensity-out>${a.settings.intensity}%</output></span><input type="range" min="0" max="400" value="${a.settings.intensity}" data-pack06-intensity></label>`:""}
  <div class="ae-pack06-copy-row"><button type="button" class="ae-button ae-button-secondary" data-pack06-copy>Kopiuj ustawienia</button><button type="button" class="ae-button ae-button-secondary" data-pack06-paste ${ht?"":"disabled"}>Wklej</button></div>`,e.querySelector(".inspector-title")?.insertAdjacentElement("afterend",n);const i=n.querySelector("[data-pack06-seed]");i?.addEventListener("change",()=>er(a.instanceId,Number(i.value))),n.querySelector("[data-pack06-reroll]")?.addEventListener("click",()=>Ti(a.instanceId));const s=n.querySelector("[data-pack06-intensity]");s?.addEventListener("input",()=>{const r=Number(s.value),o=n.querySelector("[data-pack06-intensity-out]");o&&(o.value=`${r}%`),xe(a.instanceId,{intensity:r})}),n.querySelector("[data-pack06-copy]")?.addEventListener("click",()=>{ht=structuredClone(a.settings);const r=n.querySelector("[data-pack06-paste]");r&&(r.disabled=!1)}),n.querySelector("[data-pack06-paste]")?.addEventListener("click",()=>{ht&&xe(a.instanceId,structuredClone(ht))})}function Rr(){const a=be().effects.filter(m=>m.enabled),t=a.reduce((m,y)=>m+1+(Je(y.effectId)?.estimateDomNodes(y.settings)??0),1),n=a.reduce((m,y)=>m+(Se(y.effectId)?.performanceCost??1),0),i=document.querySelector("#pack06-performance");i&&(i.textContent=`DOM ~${t} · koszt ${n}`,i.classList.toggle("is-warning",t>600||n>24));const s=document.querySelector("#pack06-undo");s&&(s.disabled=!$i(),s.title=ha()?`Cofnij: ${ha()}`:"Brak zmian do cofnięcia");const r=document.querySelector("#pack06-redo");r&&(r.disabled=!Ri(),r.title=ga()?`Ponów: ${ga()}`:"Brak zmian do ponowienia");const o=document.querySelector("#pack06-recover");o&&(o.disabled=!Ki());const l=document.querySelector("#pack06-pause");l&&(l.textContent=St?"▶ Wznów":"⏸ Pauza")}function Ze(){jc(),Dc(),Ic(),ra(),Rr()}function Nc(){Tt!==null&&clearTimeout(Tt),Tt=window.setTimeout(()=>Vi(be()),700)}function Ac(){const e=document.querySelector(".ae-header-status");if(e&&!document.querySelector("#pack06-performance")){const i=document.createElement("span");i.id="pack06-performance",i.className="ae-status-pill",e.appendChild(i)}const a=document.querySelector(".ae-header-actions");if(!a||document.querySelector("#pack06-undo"))return;a.classList.add("ae-pack06-header-actions");const t=document.createElement("div");t.className="ae-pack06-header-group",t.innerHTML=`<button id="pack06-undo" class="ae-button ae-button-secondary" type="button">↶</button><button id="pack06-redo" class="ae-button ae-button-secondary" type="button">↷</button><button id="pack06-pause" class="ae-button ae-button-secondary" type="button">⏸ Pauza</button>
  <select id="pack06-preset" class="ae-category-select"><option value="">Preset sceny…</option>${va.map(i=>`<option value="${i.id}">${i.name}</option>`).join("")}</select>
  <button id="pack06-save" class="ae-button ae-button-secondary" type="button">Zapisz scenę</button><button id="pack06-load" class="ae-button ae-button-secondary" type="button">Wczytaj</button><button id="pack06-recover" class="ae-button ae-button-secondary" type="button">Autozapis</button><button id="pack06-reroll-all" class="ae-button ae-button-secondary" type="button">🎲 Seedy</button><button id="pack06-media" class="ae-button ae-button-secondary" type="button">PNG / GIF</button>`,a.prepend(t),document.querySelector("#pack06-undo")?.addEventListener("click",()=>Za()),document.querySelector("#pack06-redo")?.addEventListener("click",()=>Ja()),document.querySelector("#pack06-pause")?.addEventListener("click",()=>{St=!St,ra(),Rr()}),document.querySelector("#pack06-reroll-all")?.addEventListener("click",()=>Fi()),document.querySelector("#pack06-media")?.addEventListener("click",()=>Mc());const n=document.querySelector("#pack06-preset");n?.addEventListener("change",()=>{const i=va.find(s=>s.id===n.value);i&&(qi(i.effects,`Preset: ${i.name}`),n.value="")}),document.querySelector("#pack06-save")?.addEventListener("click",()=>Ji(be())),document.querySelector("#pack06-load")?.addEventListener("click",()=>document.querySelector("#pack06-file-input")?.click()),document.querySelector("#pack06-recover")?.addEventListener("click",()=>{const i=Qi(be());i&&tr(i,"Przywróć autozapis")})}function Lc(){const e=document.querySelector(".ae-effect-filters");if(!e)return;let a=e.querySelector(":scope > .ae-pack14-library-tools");a||(a=document.createElement("div"),a.className="ae-pack06-library-tools ae-pack14-library-tools",e.appendChild(a));let t=document.querySelector("#pack06-library-mode");t||(t=document.createElement("select"),t.id="pack06-library-mode",t.className="ae-category-select",t.innerHTML='<option value="all">Widok: Wszystkie</option><option value="favorites">Widok: ★ Ulubione</option><option value="scene">Widok: ● Na scenie</option>',t.addEventListener("change",Ze));let n=document.querySelector("#pack06-library-sort");n||(n=document.createElement("select"),n.id="pack06-library-sort",n.className="ae-category-select",n.innerHTML='<option value="name">Sortuj: Nazwa</option><option value="category">Sortuj: Kategoria</option><option value="used">Sortuj: Najczęściej używane</option><option value="recent">Sortuj: Ostatnio używane</option><option value="light">Sortuj: Najlżejsze</option><option value="heavy">Sortuj: Najcięższe</option>',n.addEventListener("change",Ze)),t.parentElement!==a&&a.appendChild(t),n.parentElement!==a&&a.appendChild(n)}function Bc(){if(document.querySelector("#pack06-file-input"))return;const e=document.createElement("input");e.id="pack06-file-input",e.type="file",e.accept=".json,.aescene.json,application/json",e.hidden=!0,e.addEventListener("change",async()=>{const a=e.files?.[0];if(a)try{const t=or(await a.text(),be());tr(t.state,`Wczytaj: ${t.name}`),t.warnings.length&&window.alert(["Scena wczytana z ostrzeżeniami:","",...t.warnings.slice(0,12)].join(`
`))}catch(t){window.alert(t instanceof Error?t.message:String(t))}finally{e.value=""}}),document.body.appendChild(e)}function Oc(){document.addEventListener("keydown",e=>{const a=e.target;if(!(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement||a instanceof HTMLSelectElement)){if(e.ctrlKey&&!e.shiftKey&&e.key.toLowerCase()==="z"){e.preventDefault(),Za();return}(e.ctrlKey&&e.key.toLowerCase()==="y"||e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="z")&&(e.preventDefault(),Ja())}})}function Tc(){const e=document.querySelector("#inspector");if(!e)return;let a=!1;e.addEventListener("pointerdown",n=>{const i=n.target;i instanceof HTMLInputElement&&i.type==="range"&&(a=!0,Mi("Zmień parametr"))});const t=()=>{a&&(a=!1,Ei())};window.addEventListener("pointerup",t),window.addEventListener("pointercancel",t)}function Fc(){Ia||(Ia=!0,Ac(),Lc(),Bc(),Oc(),Tc(),_i(),Ha(()=>{queueMicrotask(Ze),Nc()}),Ze())}let Ft=!1,Zt=null;function qc(){const e=document.querySelector(".ae-pack06-header-group");if(!e||document.querySelector(".ae-polish02-header"))return;const a=b=>e.querySelector(b),t=a("#pack06-undo"),n=a("#pack06-redo"),i=a("#pack06-pause"),s=a("#pack06-preset"),r=a("#pack06-save"),o=a("#pack06-load"),l=a("#pack06-recover"),m=a("#pack06-reroll-all"),y=a("#pack06-media");if(!t||!n||!i||!s||!r||!o||!l||!m||!y)return;l.textContent="Przywróć autozapis";const d=document.createElement("div");d.className="ae-polish02-header";const w=document.createElement("div");w.className="ae-polish02-direct",w.append(t,n,i);const u=(b,f)=>{const h=document.createElement("details");h.className="ae-polish02-menu";const g=document.createElement("summary");g.innerHTML=`${b} <span>▾</span>`;const v=document.createElement("div");return v.className="ae-polish02-menu-panel",v.append(...f),h.append(g,v),h};d.append(w,u("Scena",[s,r,o,l]),u("Narzędzia",[m,y])),e.replaceWith(d)}function Wc(){const e=document.querySelector("#pack06-library-mode"),a=document.querySelector("#pack06-library-sort"),t=["Widok: Wszystkie","Widok: ★ Ulubione","Widok: ● Na scenie"],n=["Sortuj: Nazwa","Sortuj: Kategoria","Sortuj: Najczęściej używane","Sortuj: Ostatnio używane","Sortuj: Najlżejsze","Sortuj: Najcięższe"];e&&Array.from(e.options).forEach((i,s)=>{i.textContent=t[s]??i.textContent}),a&&Array.from(a.options).forEach((i,s)=>{i.textContent=n[s]??i.textContent})}function Xc(){const e=document.querySelector("#effect-library");e&&(e.querySelectorAll(".ae-pack06-scene-badge").forEach(a=>a.remove()),Array.from(e.querySelectorAll(".ae-effect-card")).forEach(a=>{a.classList.add("ae-polish02-card");const t=a.querySelector(".ae-pack06-count");if(t){const i=t.textContent?.replace(/[^0-9]/g,"")||"1";t.textContent=i,t.title=`${i} warstw(y) · przejdź do Warstw`}const n=a.querySelector(".ae-pack06-favorite");n&&(n.title=n.textContent==="★"?"Usuń z ulubionych":"Dodaj do ulubionych")}),Zt!==null&&(Zt=null,requestAnimationFrame(()=>{document.querySelector("#effect-library")})))}function Uc(){const e=document.querySelector(".ae-inspector-panel");if(!e)return;e.classList.add("ae-polish02-inspector");const a=e.querySelector(".ae-pack06-inspector-title strong");a&&(a.textContent="Losowość")}function gt(e){const a=(w,u)=>{const b=Number(e.querySelector(w)?.value??u);return Number.isFinite(b)?b:u},t=a("[data-media-width]",1280),n=a("[data-media-height]",720),i=a("[data-gif-seconds]",5),s=a("[data-gif-fps]",15),r=Math.max(1,Math.round(i*s)),o=t*n*r,l=o>3e8?"WYSOKIE":o>12e7?"ŚREDNIE":"NISKIE",m=e.querySelector("[data-polish02-summary]");m&&(m.innerHTML=`
      <strong>${r} klatek</strong>
      <span>${t} × ${n} · ${s} FPS · obciążenie: ${l}</span>
    `);const y=e.querySelector("[data-media-background]"),d=e.querySelector("[data-media-color]");y&&d&&(d.disabled=y.value!=="custom")}function Gc(){const e=document.querySelector(".ae-media-dialog");if(!e||e.dataset.polish02==="1")return;e.dataset.polish02="1";const a=e.querySelector(".ae-media-export");if(!a)return;const t=a.querySelector(":scope > .ae-media-grid");if(t){const r=document.createElement("section");r.className="ae-polish02-output";const o=document.createElement("div");o.className="ae-polish02-card-heading",o.innerHTML=`
      <strong>Ustawienia wyjścia</strong>
      <span>Rozdzielczość i tło eksportowanej sceny</span>
    `;const l=document.createElement("div");l.className="ae-polish02-presets",[["720p",1280,720],["1080p",1920,1080],["1:1",1080,1080],["9:16",1080,1920]].forEach(([y,d,w])=>{const u=document.createElement("button");u.type="button",u.textContent=y,u.addEventListener("click",()=>{const b=e.querySelector("[data-media-width]"),f=e.querySelector("[data-media-height]");b&&(b.value=String(d)),f&&(f.value=String(w)),gt(e)}),l.appendChild(u)}),r.append(o,l,t),a.prepend(r)}const n=Array.from(a.querySelectorAll(".ae-media-section"));n.forEach(r=>{r.classList.add("ae-polish02-media-card");const o=r.querySelector("h3");if(o&&!r.querySelector(".ae-polish02-description")){const l=document.createElement("p");l.className="ae-polish02-description",l.textContent=o.textContent==="PNG"?"Pojedyncza klatka sceny w wybranym momencie animacji.":"Animowana pętla. Więcej klatek oznacza dłuższe generowanie i większy plik.",o.insertAdjacentElement("afterend",l)}});const i=n.find(r=>r.querySelector("h3")?.textContent==="GIF");if(i&&!i.querySelector("[data-polish02-summary]")){const r=document.createElement("div");r.className="ae-polish02-summary",r.dataset.polish02Summary="1",i.querySelector(".ae-media-actions")?.insertAdjacentElement("beforebegin",r)}const s=e.querySelector("[data-cancel-gif]");s&&(s.hidden=!0),e.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{s&&(s.hidden=!1);const r=e.querySelector("[data-gif-preview]");r&&(r.hidden=!0)}),e.addEventListener("input",()=>{gt(e)}),e.addEventListener("change",()=>{gt(e)}),gt(e)}function Na(){qc(),Wc(),Xc(),Uc(),Gc()}function Yc(){document.querySelector("#effect-library")?.addEventListener("click",a=>{const t=a.target;t instanceof Element&&t.closest(".ae-add-icon, .ae-pack06-minus")&&(Zt=document.querySelector("#effect-library")?.scrollTop??0)},!0),Na();const e=new MutationObserver(()=>{Ft||(Ft=!0,requestAnimationFrame(()=>{e.disconnect();try{Na()}finally{Ft=!1,e.observe(document.body,{childList:!0,subtree:!0})}}))});e.observe(document.body,{childList:!0,subtree:!0})}const Aa="animated-effects-module-styles";function Hc(e){Zc();const a=document.createElement("div");return a.id="effect-preview",a.className="effect-preview",e.appendChild(a),a}function La(e,a){const t=Je(a.effectId);if(!t){console.warn(`Unknown effect: ${a.effectId}`);return}const n=document.createElement("div");n.className="effect-layer ae-layer",n.dataset.effectId=a.effectId,n.dataset.instanceId=a.instanceId,Kc(n,a.settings);const i=el(a.seed);t.renderPreview(n,a.settings,i),e.appendChild(n)}function Zc(){if(document.getElementById(Aa))return;const e=document.createElement("style");e.id=Aa,e.textContent=Pi().map(a=>a.css).join(`

`),document.head.appendChild(e)}function Jc(e){const a=/^#[0-9a-f]{6}$/i.test(e)?e.slice(1):"a88cff",t=parseInt(a.slice(0,2),16)/255,n=parseInt(a.slice(2,4),16)/255,i=parseInt(a.slice(4,6),16)/255,s=Math.max(t,n,i),r=Math.min(t,n,i),o=s-r;let l=0;o!==0&&(s===t?l=60*((n-i)/o%6):s===n?l=60*((i-t)/o+2):l=60*((t-n)/o+4)),l<0&&(l+=360);const m=(s+r)/2,y=o===0?0:o/(1-Math.abs(2*m-1));return{h:l,s:y*100,l:m*100}}function Vc(e){if(!e.colorize)return"";const{h:a,s:t,l:n}=Jc(e.color??"#a88cff");if(t<4)return`
      grayscale(1)
      saturate(0)
      brightness(
        ${Math.max(.55,Math.min(1.8,.45+n/70))}
      )
    `;const i=Math.round(380+t*10),s=a-40,r=Math.max(.62,Math.min(1.55,.58+n/105));return`
    grayscale(1)
    sepia(1)
    saturate(
      ${i}%
    )
    hue-rotate(
      ${s}deg
    )
    brightness(
      ${r}
    )
  `}function Kc(e,a){e.style.opacity=String(a.opacity/100),e.style.transform=`
    translate(
      ${a.x}%,
      ${a.y}%
    )
    scale(
      ${a.scale/100}
    )
    rotate(
      ${a.rotation}deg
    )
  `,e.style.filter=`
    ${Vc(a)}
    blur(
      ${a.blur}px
    )
    brightness(
      ${a.brightness/100}
    )
    hue-rotate(
      ${a.hue}deg
    )
  `,e.style.mixBlendMode=a.blendMode,e.style.zIndex=String(a.zIndex),e.style.clipPath=Qc(a.area)}function Qc(e){switch(e){case"left":return"inset(0 50% 0 0)";case"center":return"inset(0 25% 0 25%)";case"right":return"inset(0 0 0 50%)";case"top":return"inset(0 0 50% 0)";case"bottom":return"inset(50% 0 0 0)";default:return"none"}}function el(e){let a=e>>>0;return()=>{a+=1831565813;let t=a;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}const tl={"wireframe-cube":["Minimal","Neon","Heavy Grid","Glitch Cube"],polyhedron:["Quiet Facets","Prism","Crystal Storm","Void Poly"],"orbiting-core":["Ambient","Reactor","Overdrive","Alien Core"],"neon-tunnel":["Slow Drive","Synthwave","Hyperspace","Dense Grid"],"fractal-rings":["Soft Rings","Recursive","Pulse Stack","Violet Fractal"],"particle-vortex":["Gentle Spiral","Maelstrom","Energy Core","Wide Orbit"],"liquid-blobs":["Calm Fluid","Lava Lamp","Reactive","Alien Goo"],"cell-division":["Calm Colony","Rapid Growth","Microscope","Alien Cells"],"growing-vines":["Sprout","Garden","Wild Growth","Arcane Vine"],"constellation-network":["Sparse Sky","Constellation","Dense Network","Cyber Stars"],"shockwave-bursts":["Soft Pulse","Impact","Bombardment","Violet Wave"],"data-nodes":["Sparse","Tactical","Dense Mesh","Corrupted"],"spiral-galaxy":["Distant","Milky","Starburst","Alien Galaxy"],"recursive-squares":["Minimal","Infinite","Fast Zoom","Synth Grid"],"dna-helix":["Scientific","Neon DNA","Dense Helix","Mutant"],"floating-cubes":["Sparse","Matrix","Cube Storm","Violet Space"]};function al(e){return[{id:"soft",name:e[0],description:"Subtelniejszy i spokojniejszy wariant.",settings:{opacity:48,density:28,speed:55,intensity:55,scale:90,brightness:105}},{id:"classic",name:e[1],description:"Zbalansowana wersja efektu.",settings:{opacity:74,density:58,speed:90,intensity:78,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:e[2],description:"Gęstszy, szybszy i mocniejszy wariant.",settings:{opacity:92,density:100,speed:155,intensity:100,scale:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:68,speed:105,intensity:86,scale:105,hue:95,brightness:150,blendMode:"screen"}}]}const rl=Object.fromEntries(Object.entries(tl).map(([e,a])=>[e,al(a)])),nl={fireworks:["Celebration","Night Sky","Finale","Violet Burst"],"radar-sweep":["Tactical","Slow Scan","Alert","Deep Space"],"warp-speed":["Cruise","Hyperspace","Overdrive","Violet Warp"],"hex-pulse":["Soft Shield","Tech Grid","Overcharge","Arcane Hex"],"circuit-traces":["Sparse PCB","Data Flow","Dense Board","Corrupted"],"light-leaks":["Warm Film","Dreamy","Bright Lens","Violet Leak"],"gravity-well":["Calm Orbit","Accretion","Singularity","Violet Well"],"pixel-storm":["Sparse Pixels","Digital Rain","Pixel Storm","Glitch Surge"]};function sl(e){return[{id:"soft",name:e[0],description:"Spokojniejszy wariant.",settings:{opacity:48,density:34,speed:62,intensity:55,brightness:110}},{id:"balanced",name:e[1],description:"Zbalansowany wariant.",settings:{opacity:72,density:62,speed:95,intensity:78,brightness:125,blendMode:"screen"}},{id:"strong",name:e[2],description:"Mocny i gęsty wariant.",settings:{opacity:92,density:100,speed:145,intensity:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:72,speed:105,intensity:90,hue:95,brightness:145,blendMode:"screen"}}]}const il=Object.fromEntries(Object.entries(nl).map(([e,a])=>[e,sl(a)]));function ol(e){return[{id:"soft",name:e[0],description:"Subtelniejsza, czytelna wersja efektu.",settings:{opacity:52,density:48,speed:72,intensity:72,scale:90,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant do codziennego użycia.",settings:{opacity:74,density:84,speed:100,intensity:100,scale:100,brightness:122}},{id:"intense",name:e[2],description:"Dużo mocniejszy, gęstszy i szybszy wariant.",settings:{opacity:88,density:165,speed:165,intensity:180,scale:112,brightness:140}},{id:"overdrive",name:e[3],description:"Wariant overdrive z gotowymi presetami bardzo wysokiej intensywności.",settings:{opacity:96,density:320,speed:320,intensity:320,scale:126,brightness:155}}]}const cl={gears:["Workshop","Machinery","Forge Rush","Titan Drive"],comets:["Sparse Sky","Night Flight","Meteor Rain","Hyper Trail"],fireworks:["Celebration","Festival","Grand Finale","Sky Overdrive"],"lightning-storm":["Far Storm","Tempest","Voltage","Cataclysm"],"liquid-blobs":["Calm Fluid","Reactive","Mutagen","Meta Flood"],"particle-vortex":["Gentle Spiral","Cyclone","Maelstrom","Singularity"],"portal-rings":["Gateway","Transit","Quantum Gate","Dimensional Breach"],"radar-sweep":["Recon","Tracking","Combat Scan","Full Spectrum"],"glitch-blocks":["Signal Noise","Decode","Corruption","Hard Desync"],"gravity-well":["Orbit","Collapse","Accretion","Event Horizon"],"hex-grid":["Mesh","Shield","Pulse","Lattice Storm"],"floating-cubes":["Low Orbit","Voxel Drift","Cube Field","Cube Storm"],"prism-drift":["Glass","Iridescent","Crystal Bloom","Prism Swarm"],"neon-shards":["Trail","Fragments","Rift","Shatter Burst"],"plasma-storm":["Spark","Flow","Flux","Overcharge"],"cube-swarm":["Scout","Formation","Cloud","Voxel Torrent"]},ll=Object.fromEntries(Object.entries(cl).map(([e,a])=>[e,ol(a)])),dl={"black-hole-accretion":["Quiet Orbit","Accretion","Collapse","Event Horizon"],"orbital-debris":["Sparse Orbit","Debris Belt","Collision Zone","Orbital Storm"],"star-tunnel":["Cruise","Star Drive","Hyperspace","Tunnel Overdrive"],"energy-lattice":["Soft Mesh","Energy Grid","Dense Lattice","Grid Overdrive"],"target-lock":["Recon","Tracking","Combat Lock","Full Lock"],"scanner-beams":["Slow Scan","Sweep","Multi Scan","Scanner Overdrive"],"digital-fragments":["Sparse Data","Fragmented","Corruption","Hard Break"],"pixel-melt":["Light Melt","Digital Drip","Collapse","Pixel Flood"],"wireframe-cubes":["Sparse","Wire Space","Cube Field","Wire Storm"],"floating-polyhedra":["Facets","Poly Drift","Crystal Field","Poly Storm"],"shockwave-rings":["Soft Pulse","Impact","Bombardment","Shock Overdrive"],"electric-web":["Static","Electric Net","Arc Web","Voltage Storm"],"ribbon-streamers":["Soft Ribbons","Festival","Ribbon Flow","Streamer Storm"],"ink-clouds":["Soft Ink","Deep Water","Ink Bloom","Ink Flood"]};function pl(e){return[{id:"soft",name:e[0],description:"Subtelna wersja do spokojnych scen.",settings:{opacity:52,density:42,speed:62,intensity:62,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:76,density:88,speed:100,intensity:100,brightness:124}},{id:"strong",name:e[2],description:"Mocny wariant z większą gęstością.",settings:{opacity:90,density:180,speed:165,intensity:185,brightness:142}},{id:"overdrive",name:e[3],description:"Bardzo intensywny preset wykorzystujący rozszerzony zakres.",settings:{opacity:96,density:340,speed:320,intensity:340,brightness:160}}]}const ul=Object.fromEntries(Object.entries(dl).map(([e,a])=>[e,pl(a)])),fl={fireworks:{keys:["burstSize","trailLength","cadence"],names:["Soft","Balanced","Strong","Overdrive"]},lightning:{keys:["branching","boltLength","flash"],names:["Soft","Balanced","Strong","Overdrive"]},"lightning-storm":{keys:["branching","stormSpread","flash"],names:["Soft","Balanced","Strong","Overdrive"]},gears:{keys:["teeth","spacing","mechanicalChaos"],names:["Soft","Balanced","Strong","Overdrive"]},"liquid-blobs":{keys:["viscosity","blobSize","merge"],names:["Soft","Balanced","Strong","Overdrive"]},"gravity-well":{keys:["pull","orbitSpread","coreSize"],names:["Soft","Balanced","Strong","Overdrive"]},"black-hole-accretion":{keys:["discWidth","pull","glow"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-web":{keys:["connections","reach","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-arcs":{keys:["arcLength","jitter","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"spiral-galaxy":{keys:["armTightness","coreGlow","armSpread"],names:["Soft","Balanced","Strong","Overdrive"]},"growing-vines":{keys:["curl","branches","growth"],names:["Soft","Balanced","Strong","Overdrive"]},"neon-tunnel":{keys:["depth","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},scanlines:{keys:["lineGap","flicker","drift"],names:["Soft","Balanced","Strong","Overdrive"]},"laser-grid":{keys:["perspective","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"vhs-static":{keys:["noise","tracking","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"hud-grid":{keys:["gridSpacing","scan","markers"],names:["Soft","Balanced","Strong","Overdrive"]},"city-lights":{keys:["skyline","parallax","windows"],names:["Soft","Balanced","Strong","Overdrive"]},embers:{keys:["lift","trail","flicker"],names:["Soft","Balanced","Strong","Overdrive"]},"dust-motes":{keys:["depth","drift","sparkle"],names:["Soft","Balanced","Strong","Overdrive"]},"magnetic-field":{keys:["curvature","poleDistance","flow"],names:["Soft","Balanced","Strong","Overdrive"]},"volumetric-rays":{keys:["spread","softness","sweep"],names:["Soft","Balanced","Strong","Overdrive"]},"plasma-filaments":{keys:["curl","length","heat"],names:["Soft","Balanced","Strong","Overdrive"]},"ripple-field":{keys:["radius","frequency","distortion"],names:["Soft","Balanced","Strong","Overdrive"]},"bioluminescent-plankton":{keys:["current","flash","swarm"],names:["Soft","Balanced","Strong","Overdrive"]},"glass-shards":{keys:["shardSize","spin","reflection"],names:["Soft","Balanced","Strong","Overdrive"]},"aurora-curtains":{keys:["curtainWidth","wave","depth"],names:["Soft","Balanced","Strong","Overdrive"]},"data-streams":{keys:["packetLength","lanes","dropout"],names:["Soft","Balanced","Strong","Overdrive"]},"orbital-rings":{keys:["tilt","radius","satellites"],names:["Soft","Balanced","Strong","Overdrive"]},"prism-caustics":{keys:["spread","softness","motion"],names:["Soft","Balanced","Strong","Overdrive"]},"ember-ribbons":{keys:["trail","curl","sparks"],names:["Soft","Balanced","Strong","Overdrive"]},"fractal-branches":{keys:["branching","angle","growth"],names:["Soft","Balanced","Strong","Overdrive"]}};function yl(e,a){return[{id:"soft",name:a[0],description:"Subtelny wariant.",settings:{opacity:56,density:48,speed:68,intensity:72,brightness:112,custom:{[e[0]]:72,[e[1]]:78,[e[2]]:70}}},{id:"balanced",name:a[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:80,density:92,speed:100,intensity:105,brightness:128,custom:{[e[0]]:100,[e[1]]:100,[e[2]]:100}}},{id:"strong",name:a[2],description:"Mocniejszy wariant.",settings:{opacity:92,density:175,speed:155,intensity:185,brightness:148,custom:{[e[0]]:145,[e[1]]:140,[e[2]]:150}}},{id:"overdrive",name:a[3],description:"Ekstremalny wariant.",settings:{opacity:98,density:330,speed:300,intensity:340,brightness:170,custom:{[e[0]]:185,[e[1]]:180,[e[2]]:190}}}]}const ml=Object.fromEntries(Object.entries(fl).map(([e,a])=>[e,yl(a.keys,a.names)])),hl={rainfall:[{id:"drizzle",name:"Mżawka",description:"Rzadki, spokojny deszcz w tle.",settings:{opacity:55,density:30,speed:65,scale:80,blur:0,brightness:95}},{id:"steady",name:"Równy deszcz",description:"Klasyczny, równomierny opad.",settings:{opacity:72,density:65,speed:105,scale:100,blur:0,brightness:100}},{id:"storm",name:"Ulewa",description:"Gęsty i szybki deszcz.",settings:{opacity:90,density:100,speed:175,scale:110,blur:1,brightness:115,blendMode:"screen"}},{id:"windy",name:"Deszcz z wiatrem",description:"Szybszy opad z wyraźnym pochyleniem warstwy.",settings:{opacity:78,density:72,speed:145,scale:105,rotation:-10,brightness:105}}],snow:[{id:"gentle",name:"Lekki śnieg",description:"Powolne, delikatne płatki.",settings:{opacity:62,density:35,speed:45,scale:90,blur:0,brightness:110}},{id:"classic",name:"Klasyczny",description:"Zbalansowany śnieg.",settings:{opacity:78,density:60,speed:75,scale:100,blur:0,brightness:115}},{id:"blizzard",name:"Zamieć",description:"Bardzo gęsty i szybki opad.",settings:{opacity:92,density:100,speed:165,scale:90,blur:1,brightness:125}},{id:"large",name:"Duże płatki",description:"Większe, bardziej widoczne płatki.",settings:{opacity:84,density:45,speed:60,scale:150,blur:1,brightness:120}}],lightning:[{id:"distant",name:"Odległa burza",description:"Rzadsze i subtelniejsze błyski.",settings:{opacity:52,density:30,speed:60,scale:100,blur:2,brightness:115}},{id:"classic",name:"Burza",description:"Zbalansowane wyładowania.",settings:{opacity:78,density:58,speed:105,scale:100,blur:1,brightness:130}},{id:"violent",name:"Gwałtowna",description:"Częste i bardzo jasne błyski.",settings:{opacity:100,density:95,speed:175,scale:110,blur:0,brightness:190}},{id:"purple",name:"Fioletowa burza",description:"Magiczny, fioletowy wariant wyładowań.",settings:{opacity:88,density:70,speed:125,scale:105,hue:115,brightness:150,blendMode:"screen"}}],hearts:[{id:"soft",name:"Delikatne",description:"Rzadkie, spokojnie unoszące się serca.",settings:{opacity:58,density:28,speed:55,scale:90,blur:0,brightness:105}},{id:"classic",name:"Klasyczne",description:"Zbalansowany romantyczny efekt.",settings:{opacity:78,density:55,speed:85,scale:110,brightness:110}},{id:"shower",name:"Deszcz serc",description:"Dużo szybko poruszających się serc.",settings:{opacity:90,density:95,speed:145,scale:100,brightness:120}},{id:"giant",name:"Duże serca",description:"Mniej elementów, ale znacznie większych.",settings:{opacity:82,density:35,speed:70,scale:175,blur:1,brightness:120}}],leaves:[{id:"breeze",name:"Lekki wiatr",description:"Spokojnie opadające liście.",settings:{opacity:68,density:35,speed:60,scale:95,rotation:0,brightness:100}},{id:"autumn",name:"Jesień",description:"Gęstszy, ciepły opad liści.",settings:{opacity:82,density:65,speed:90,scale:105,hue:-18,brightness:110}},{id:"gust",name:"Podmuch",description:"Szybki i dynamiczny ruch.",settings:{opacity:85,density:75,speed:160,scale:100,rotation:8,brightness:105}},{id:"close",name:"Liście z bliska",description:"Duże liście przechodzące blisko kamery.",settings:{opacity:86,density:38,speed:80,scale:180,blur:1,brightness:115}}],matrix:[{id:"sparse",name:"Rzadki kod",description:"Niewiele kolumn i spokojniejszy ruch.",settings:{opacity:58,density:28,speed:70,scale:90,brightness:95}},{id:"classic",name:"Klasyczny Matrix",description:"Zbalansowana zielona ściana kodu.",settings:{opacity:78,density:58,speed:105,scale:100,hue:0,brightness:110}},{id:"dense",name:"Gęsty kod",description:"Więcej kolumn i szybszy przepływ.",settings:{opacity:88,density:95,speed:150,scale:95,brightness:125}},{id:"blue",name:"Niebieski kod",description:"Chłodniejsza, cybernetyczna wersja.",settings:{opacity:82,density:68,speed:110,scale:100,hue:95,brightness:120,blendMode:"screen"}}],comets:[{id:"rare",name:"Pojedyncze",description:"Rzadkie komety przecinające tło.",settings:{opacity:65,density:25,speed:75,scale:90,brightness:110}},{id:"classic",name:"Klasyczne",description:"Zbalansowane komety.",settings:{opacity:80,density:52,speed:100,scale:100,brightness:125}},{id:"shower",name:"Deszcz meteorów",description:"Dużo szybkich smug.",settings:{opacity:92,density:95,speed:155,scale:95,brightness:145}},{id:"giant",name:"Wielkie komety",description:"Mniej, ale większych i jaśniejszych smug.",settings:{opacity:88,density:32,speed:90,scale:175,blur:1,brightness:155}}],starfield:[{id:"distant",name:"Odległe gwiazdy",description:"Subtelne, drobne punkty.",settings:{opacity:50,density:35,speed:45,scale:75,brightness:95}},{id:"classic",name:"Pole gwiazd",description:"Zbalansowane kosmiczne tło.",settings:{opacity:72,density:62,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste niebo",description:"Znacznie więcej gwiazd.",settings:{opacity:82,density:100,speed:70,scale:90,brightness:120}},{id:"bright",name:"Jasne gwiazdy",description:"Mniej punktów, ale mocniej świecących.",settings:{opacity:90,density:48,speed:65,scale:125,blur:1,brightness:160,blendMode:"screen"}}],fog:[{id:"wisps",name:"Smugi mgły",description:"Lekkie, przejrzyste pasma.",settings:{opacity:38,density:35,speed:50,scale:100,blur:8,brightness:95}},{id:"low",name:"Niska mgła",description:"Mgła skupiona przy dolnej krawędzi.",settings:{opacity:58,density:58,speed:55,scale:120,y:35,blur:10,area:"bottom",brightness:100}},{id:"heavy",name:"Gęsta mgła",description:"Ciężka mgła pokrywająca kadr.",settings:{opacity:78,density:95,speed:40,scale:135,blur:13,brightness:92}},{id:"ghost",name:"Widmowa",description:"Chłodniejsza i bardziej świetlista mgła.",settings:{opacity:62,density:68,speed:65,scale:125,blur:12,hue:105,brightness:125,blendMode:"screen"}}],embers:[{id:"smolder",name:"Żar",description:"Niewiele powolnych iskier.",settings:{opacity:58,density:30,speed:55,scale:90,brightness:105}},{id:"firepit",name:"Ognisko",description:"Zbalansowane unoszące się żarzące drobiny.",settings:{opacity:78,density:58,speed:90,scale:100,brightness:120}},{id:"inferno",name:"Inferno",description:"Gęsty i szybki strumień żaru.",settings:{opacity:92,density:100,speed:160,scale:105,brightness:150,blendMode:"screen"}},{id:"large",name:"Duży żar",description:"Większe, wolniejsze drobiny.",settings:{opacity:84,density:40,speed:65,scale:165,blur:1,brightness:135}}],clouds:[{id:"wispy",name:"Pierze",description:"Lekkie, rzadkie obłoki.",settings:{opacity:35,density:30,speed:45,scale:105,blur:8,brightness:105}},{id:"classic",name:"Chmury",description:"Zbalansowana warstwa chmur.",settings:{opacity:55,density:58,speed:65,scale:120,blur:9,brightness:100}},{id:"overcast",name:"Zachmurzenie",description:"Gęste i ciemniejsze chmury.",settings:{opacity:78,density:95,speed:55,scale:135,blur:11,brightness:75}},{id:"dreamy",name:"Senna mgiełka",description:"Jasne, miękkie i wolne obłoki.",settings:{opacity:52,density:48,speed:35,scale:150,blur:14,brightness:135,blendMode:"screen"}}],"rain-glass":[{id:"mist",name:"Drobne krople",description:"Subtelne krople na szybie.",settings:{opacity:48,density:35,speed:55,scale:80,blur:0,brightness:95}},{id:"classic",name:"Mokra szyba",description:"Zbalansowane smugi deszczu.",settings:{opacity:72,density:62,speed:85,scale:100,brightness:105}},{id:"downpour",name:"Ulewa na szybie",description:"Dużo szybkich smug.",settings:{opacity:88,density:100,speed:145,scale:105,blur:1,brightness:115}},{id:"slow",name:"Powolne smugi",description:"Duże krople wolno zsuwające się po szybie.",settings:{opacity:80,density:45,speed:35,scale:155,blur:1,brightness:110}}],"bouncing-balls":[{id:"calm",name:"Spokojne",description:"Kilka wolnych kulek.",settings:{opacity:65,density:30,speed:55,scale:90,brightness:105}},{id:"arcade",name:"Arcade",description:"Zbalansowana liczba i tempo.",settings:{opacity:82,density:58,speed:105,scale:100,brightness:125}},{id:"chaos",name:"Chaos",description:"Dużo szybkich odbijających się kulek.",settings:{opacity:90,density:100,speed:175,scale:90,brightness:140}},{id:"giant",name:"Wielkie kule",description:"Mniej obiektów o dużej skali.",settings:{opacity:86,density:32,speed:75,scale:190,blur:1,brightness:130}}],"neon-lines":[{id:"minimal",name:"Minimal",description:"Kilka subtelnych neonowych linii.",settings:{opacity:52,density:28,speed:60,scale:90,brightness:110}},{id:"classic",name:"Neon",description:"Zbalansowane linie cyberpunkowe.",settings:{opacity:78,density:58,speed:100,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Sieć neonów",description:"Gęsty układ świecących linii.",settings:{opacity:86,density:95,speed:125,scale:100,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowy neon",description:"Fioletowo-różowy wariant kolorystyczny.",settings:{opacity:82,density:65,speed:95,scale:105,hue:95,brightness:145,blendMode:"screen"}}],"energy-orbs":[{id:"ambient",name:"Ambient",description:"Rzadkie, spokojne kule energii.",settings:{opacity:55,density:28,speed:50,scale:90,blur:2,brightness:110}},{id:"classic",name:"Energia",description:"Zbalansowane świetliste kule.",settings:{opacity:75,density:58,speed:85,scale:105,blur:1,brightness:130,blendMode:"screen"}},{id:"storm",name:"Burza energii",description:"Dużo szybkich i jasnych kul.",settings:{opacity:90,density:100,speed:155,scale:100,blur:1,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie orbsy",description:"Mniej, ale znacznie większych kul.",settings:{opacity:84,density:32,speed:60,scale:190,blur:3,brightness:145,blendMode:"screen"}}],petals:[{id:"gentle",name:"Delikatne",description:"Spokojnie spadające płatki.",settings:{opacity:62,density:30,speed:55,scale:90,brightness:105}},{id:"classic",name:"Kwiatowy opad",description:"Zbalansowany efekt płatków.",settings:{opacity:78,density:58,speed:85,scale:100,brightness:115}},{id:"storm",name:"Burza płatków",description:"Gęsty i szybki opad.",settings:{opacity:88,density:100,speed:150,scale:95,brightness:125}},{id:"large",name:"Duże płatki",description:"Mniej elementów, ale większych.",settings:{opacity:84,density:38,speed:65,scale:170,blur:1,brightness:120}}],sparks:[{id:"welding",name:"Spawanie",description:"Szybkie, jasne i rzadkie iskry.",settings:{opacity:88,density:42,speed:170,scale:80,brightness:165,blendMode:"screen"}},{id:"fire",name:"Ogień",description:"Zbalansowane ciepłe iskry.",settings:{opacity:78,density:60,speed:105,scale:100,brightness:130}},{id:"burst",name:"Rozbłysk",description:"Gęsty strumień dynamicznych iskier.",settings:{opacity:94,density:100,speed:195,scale:95,brightness:180,blendMode:"screen"}},{id:"slow",name:"Powolny żar",description:"Duże i spokojniejsze iskry.",settings:{opacity:72,density:35,speed:45,scale:155,blur:1,brightness:120}}],plasma:[{id:"calm",name:"Spokojna plazma",description:"Wolniejszy i miękki ruch.",settings:{opacity:58,density:38,speed:45,scale:110,blur:4,brightness:110}},{id:"classic",name:"Plazma",description:"Zbalansowany efekt energetyczny.",settings:{opacity:78,density:62,speed:90,scale:115,blur:2,brightness:135,blendMode:"screen"}},{id:"hot",name:"Gorąca",description:"Jaśniejsza i bardziej intensywna plazma.",settings:{opacity:90,density:82,speed:120,scale:125,blur:2,brightness:175,hue:-35,blendMode:"screen"}},{id:"electric",name:"Elektryczna",description:"Szybka, chłodniejsza plazma.",settings:{opacity:86,density:72,speed:165,scale:105,blur:1,brightness:160,hue:95,blendMode:"screen"}}],"energy-waves":[{id:"soft",name:"Miękkie fale",description:"Powolne i subtelne fale energii.",settings:{opacity:48,density:35,speed:45,scale:110,blur:3,brightness:105}},{id:"pulse",name:"Puls",description:"Zbalansowane pulsujące fale.",settings:{opacity:72,density:60,speed:90,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"fast",name:"Szybkie fale",description:"Dynamiczny, energetyczny ruch.",settings:{opacity:84,density:78,speed:160,scale:110,blur:1,brightness:150,blendMode:"screen"}},{id:"wide",name:"Szerokie fale",description:"Duże, wolniejsze pasma energii.",settings:{opacity:75,density:42,speed:60,scale:175,blur:4,brightness:140,blendMode:"screen"}}],runes:[{id:"drifting",name:"Wędrujące",description:"Runy Elder Futhark swobodnie unoszące się po ekranie.",settings:{opacity:72,density:45,speed:55,scale:100,blur:0,brightness:120}},{id:"ancient",name:"Starożytne",description:"Wolne, większe i cięższe wizualnie symbole.",settings:{opacity:82,density:30,speed:35,scale:150,blur:1,brightness:105}},{id:"ritual",name:"Rytuał",description:"Gęstsza, bardziej świetlista warstwa run.",settings:{opacity:90,density:75,speed:65,scale:115,blur:1,brightness:155,blendMode:"screen"}},{id:"ghost",name:"Widmowe",description:"Subtelne, chłodne i rozmyte znaki.",settings:{opacity:52,density:58,speed:45,scale:125,blur:3,hue:90,brightness:135,blendMode:"screen"}}],"magic-dust":[{id:"wisps",name:"Smugi pyłu",description:"Rzadki, spokojny magiczny pył.",settings:{opacity:50,density:28,speed:45,scale:90,blur:1,brightness:115}},{id:"fairy",name:"Baśniowy pył",description:"Zbalansowane migoczące drobiny.",settings:{opacity:76,density:58,speed:80,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Magiczna chmura",description:"Gęsty i jaśniejszy pył.",settings:{opacity:88,density:100,speed:105,scale:105,blur:1,brightness:160,blendMode:"screen"}},{id:"gold",name:"Złoty pył",description:"Ciepły, złocisty wariant kolorystyczny.",settings:{opacity:82,density:65,speed:75,scale:105,hue:-55,brightness:150,blendMode:"screen"}}],"laser-grid":[{id:"minimal",name:"Minimal",description:"Rzadkie, spokojne linie siatki.",settings:{opacity:50,density:30,speed:55,scale:100,brightness:110}},{id:"classic",name:"Laser Grid",description:"Zbalansowana futurystyczna siatka.",settings:{opacity:75,density:60,speed:90,scale:105,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsta siatka",description:"Więcej linii i mocniejsze światło.",settings:{opacity:86,density:95,speed:105,scale:100,brightness:155,blendMode:"screen"}},{id:"fast",name:"Szybka siatka",description:"Dynamiczny, klubowy wariant.",settings:{opacity:82,density:72,speed:170,scale:110,brightness:150,hue:75,blendMode:"screen"}}],scanlines:[{id:"subtle",name:"Subtelne",description:"Lekka faktura monitora CRT.",settings:{opacity:32,density:35,speed:30,scale:100,brightness:100}},{id:"crt",name:"CRT",description:"Klasyczne linie starego ekranu.",settings:{opacity:58,density:62,speed:55,scale:100,brightness:105}},{id:"vhs",name:"VHS",description:"Mocniejszy i szybszy analogowy szum.",settings:{opacity:72,density:82,speed:115,scale:105,blur:1,brightness:110}},{id:"harsh",name:"Mocne linie",description:"Bardzo widoczna faktura skanowania.",settings:{opacity:88,density:100,speed:70,scale:100,brightness:120,blendMode:"overlay"}}],pong:[{id:"classic",name:"Klasyczny Pong",description:"Spokojny mecz w klasycznym tempie.",settings:{opacity:82,density:72,speed:100,scale:100,brightness:115,hue:0,intensity:0}},{id:"chill",name:"Chill",description:"Wolniejszy, ambientowy Pong.",settings:{opacity:62,density:55,speed:65,scale:100,brightness:105,hue:40,intensity:0}},{id:"arcade",name:"Arcade",description:"Szybszy mecz z lekkim przyspieszaniem.",settings:{opacity:90,density:82,speed:145,scale:105,brightness:140,hue:0,intensity:18,blendMode:"screen"}},{id:"neon",name:"Neon Pong",description:"Fioletowo-neonowa wersja arcade.",settings:{opacity:92,density:78,speed:125,scale:105,brightness:155,hue:105,intensity:10,blendMode:"screen"}}],bubbles:[{id:"gentle",name:"Delikatne",description:"Rzadkie i spokojne bąbelki.",settings:{opacity:48,density:28,speed:45,scale:85,blur:0,brightness:105}},{id:"aquarium",name:"Akwarium",description:"Zbalansowany strumień bąbelków.",settings:{opacity:68,density:60,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste",description:"Dużo szybko unoszących się bąbelków.",settings:{opacity:78,density:100,speed:125,scale:95,brightness:125}},{id:"giant",name:"Wielkie bąble",description:"Mniej, ale bardzo dużych elementów.",settings:{opacity:70,density:30,speed:55,scale:195,blur:1,brightness:120}}],fireflies:[{id:"sparse",name:"Kilka świetlików",description:"Rzadkie i spokojne punkty światła.",settings:{opacity:55,density:25,speed:45,scale:90,blur:1,brightness:120}},{id:"meadow",name:"Łąka",description:"Zbalansowany, naturalny rój.",settings:{opacity:75,density:58,speed:70,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"swarm",name:"Rój",description:"Dużo aktywnych świetlików.",settings:{opacity:86,density:100,speed:120,scale:95,brightness:155,blendMode:"screen"}},{id:"dreamy",name:"Senny",description:"Duże, powolne i miękkie światła.",settings:{opacity:68,density:38,speed:35,scale:160,blur:3,brightness:145,blendMode:"screen"}}],confetti:[{id:"light",name:"Lekki opad",description:"Niewiele konfetti i spokojne tempo.",settings:{opacity:62,density:30,speed:60,scale:90,brightness:105}},{id:"party",name:"Impreza",description:"Zbalansowane kolorowe konfetti.",settings:{opacity:82,density:65,speed:105,scale:100,brightness:115}},{id:"celebration",name:"Celebracja",description:"Gęsty i szybki wybuch konfetti.",settings:{opacity:92,density:100,speed:165,scale:105,brightness:130}},{id:"slow",name:"Slow motion",description:"Większe elementy opadające powoli.",settings:{opacity:80,density:45,speed:35,scale:150,blur:1,brightness:115}}],"dust-motes":[{id:"subtle",name:"Subtelny kurz",description:"Prawie niewidoczne drobiny w tle.",settings:{opacity:30,density:30,speed:35,scale:85,blur:1,brightness:95}},{id:"sunbeam",name:"Promień słońca",description:"Jaśniejsze drobiny zawieszone w powietrzu.",settings:{opacity:55,density:55,speed:45,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsty kurz",description:"Więcej widocznych drobin.",settings:{opacity:65,density:100,speed:55,scale:95,brightness:120}},{id:"cinematic",name:"Filmowy",description:"Duże, wolne i miękkie drobiny.",settings:{opacity:48,density:42,speed:30,scale:155,blur:2,brightness:145,blendMode:"screen"}}],aurora:[{id:"soft",name:"Delikatna zorza",description:"Subtelne, powolne pasma.",settings:{opacity:48,density:35,speed:35,scale:110,blur:4,brightness:110}},{id:"nordic",name:"Nordycka",description:"Zbalansowana klasyczna zorza.",settings:{opacity:72,density:58,speed:55,scale:120,blur:3,brightness:130,blendMode:"screen"}},{id:"intense",name:"Intensywna",description:"Jasne i gęste pasma światła.",settings:{opacity:90,density:95,speed:70,scale:130,blur:2,brightness:170,blendMode:"screen"}},{id:"fast",name:"Szybka zorza",description:"Dynamiczne, wyraźnie przemieszczające się pasma.",settings:{opacity:82,density:72,speed:125,scale:120,blur:2,brightness:150,hue:45,blendMode:"screen"}}],"hologram-scan":[{id:"subtle",name:"Subtelny skan",description:"Rzadkie i spokojne pasma hologramu.",settings:{opacity:42,density:28,speed:55,scale:100,brightness:105,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelny skan HUD o umiarkowanym tempie.",settings:{opacity:68,density:48,speed:85,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:"Intensywny",description:"Gesty i szybki skan calego ekranu.",settings:{opacity:88,density:92,speed:155,scale:105,brightness:155,blendMode:"screen"}},{id:"violet",name:"Fioletowy",description:"Holograficzny skan przesuniety w fiolet.",settings:{opacity:78,density:58,speed:95,hue:92,brightness:140,blendMode:"screen"}}],"glitch-blocks":[{id:"sparse",name:"Rzadkie zaklocenia",description:"Pojedyncze cyfrowe przeskoki.",settings:{opacity:42,density:24,speed:65,scale:85,brightness:110}},{id:"digital",name:"Digital",description:"Zbalansowane cyfrowe prostokaty.",settings:{opacity:62,density:55,speed:95,scale:100,brightness:125,blendMode:"screen"}},{id:"corrupted",name:"Corrupted",description:"Gesty, agresywny glitch.",settings:{opacity:86,density:100,speed:180,scale:115,brightness:155,blendMode:"screen"}},{id:"chromatic",name:"Chromatyczny",description:"Kolorowy glitch z mocnym przesunieciem barwy.",settings:{opacity:76,density:72,speed:125,scale:100,hue:120,brightness:145,blendMode:"screen"}}],"hex-grid":[{id:"fine",name:"Drobna siatka",description:"Delikatna, drobna struktura hex.",settings:{opacity:32,density:78,speed:30,scale:90,brightness:100}},{id:"tactical",name:"Taktyczna",description:"Czytelna siatka interfejsu sci-fi.",settings:{opacity:50,density:52,speed:50,scale:100,brightness:120,blendMode:"screen"}},{id:"large",name:"Duza siatka",description:"Wieksze i spokojniejsze komorki.",settings:{opacity:44,density:25,speed:35,scale:125,brightness:115}},{id:"neon",name:"Neon",description:"Jasna cyberpunkowa siatka.",settings:{opacity:72,density:62,speed:75,hue:75,brightness:165,blendMode:"screen"}}],"portal-rings":[{id:"calm",name:"Spokojny portal",description:"Powolne i subtelne pierscienie.",settings:{opacity:52,density:35,speed:35,scale:90,brightness:110}},{id:"arcane",name:"Arkaniczny",description:"Klasyczny magiczny portal.",settings:{opacity:78,density:62,speed:65,scale:100,brightness:140,blendMode:"screen"}},{id:"unstable",name:"Niestabilny",description:"Gesty i szybko wirujacy portal.",settings:{opacity:92,density:100,speed:145,scale:112,brightness:175,blendMode:"screen"}},{id:"void",name:"Void",description:"Ciemniejszy portal o zmienionej barwie.",settings:{opacity:84,density:70,speed:78,scale:105,hue:145,brightness:125,blendMode:"screen"}}],"magic-circle":[{id:"subtle",name:"Subtelny sigil",description:"Lekki i powolny magiczny okrag.",settings:{opacity:44,density:32,speed:28,scale:90,brightness:105}},{id:"ritual",name:"Rytual",description:"Zbalansowany okrag rytualny.",settings:{opacity:72,density:58,speed:48,scale:100,brightness:135,blendMode:"screen"}},{id:"grand",name:"Wielki sigil",description:"Duzy, jasny i gesty wzor.",settings:{opacity:90,density:96,speed:62,scale:135,brightness:175,blendMode:"screen"}},{id:"forbidden",name:"Zakazany",description:"Ciemniejszy i bardziej zlowrogi wariant.",settings:{opacity:82,density:72,speed:75,scale:108,hue:120,brightness:135,blendMode:"screen"}}],"crystal-shards":[{id:"sparse",name:"Rzadkie odlamki",description:"Kilka spokojnie unoszacych sie krysztalow.",settings:{opacity:48,density:28,speed:42,scale:85,brightness:115}},{id:"prism",name:"Pryzmat",description:"Jasne odlamki o mocnym polysku.",settings:{opacity:72,density:55,speed:62,scale:100,brightness:155,blendMode:"screen"}},{id:"storm",name:"Krysztalowa burza",description:"Duza liczba szybko poruszajacych sie odlamkow.",settings:{opacity:88,density:100,speed:145,scale:92,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie odlamki",description:"Mniej elementow, ale znacznie wiekszych.",settings:{opacity:78,density:38,speed:48,scale:170,brightness:145,blur:1,blendMode:"screen"}}],"steam-vents":[{id:"gentle",name:"Lekka para",description:"Subtelne kleby pary.",settings:{opacity:38,density:30,speed:42,scale:95,blur:2,brightness:105}},{id:"factory",name:"Fabryka",description:"Regularne, gestsze wyrzuty pary.",settings:{opacity:58,density:62,speed:62,scale:110,blur:3,brightness:115}},{id:"burst",name:"Wyrzut",description:"Szybka i intensywna para.",settings:{opacity:76,density:92,speed:145,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"ghost",name:"Widmowa para",description:"Chlodny, lekko kolorowy wariant.",settings:{opacity:52,density:52,speed:48,scale:125,hue:155,blur:4,brightness:135,blendMode:"screen"}}],gears:[{id:"clockwork",name:"Mechanizm",description:"Spokojnie obracajace sie kola zebate.",settings:{opacity:52,density:38,speed:42,scale:90,brightness:105}},{id:"brass",name:"Mosiadz",description:"Klasyczny steampunkowy zestaw kol.",settings:{opacity:66,density:55,speed:58,scale:100,brightness:125,blendMode:"screen"}},{id:"heavy",name:"Ciezka maszyna",description:"Duze i wolniejsze kola zebate.",settings:{opacity:76,density:35,speed:28,scale:165,brightness:115}},{id:"overdrive",name:"Overdrive",description:"Gesty i szybko pracujacy mechanizm.",settings:{opacity:82,density:100,speed:160,scale:88,brightness:145,blendMode:"screen"}}],"city-lights":[{id:"distant",name:"Odlegle miasto",description:"Rzadkie, subtelne punkty swiatla.",settings:{opacity:42,density:28,speed:35,scale:85,brightness:105}},{id:"night",name:"Nocne miasto",description:"Zbalansowane miejskie swiatla.",settings:{opacity:72,density:65,speed:48,scale:100,brightness:125,blendMode:"screen"}},{id:"dense",name:"Centrum",description:"Gesty, jasny krajobraz miejski.",settings:{opacity:88,density:100,speed:65,scale:105,brightness:155,blendMode:"screen"}},{id:"neon",name:"Neon City",description:"Kolorowy wariant inspirowany cyberpunkiem.",settings:{opacity:82,density:78,speed:58,hue:95,brightness:165,blendMode:"screen"}}],"traffic-trails":[{id:"slow",name:"Nocna ulica",description:"Rzadkie i wolne smugi swiatel.",settings:{opacity:48,density:28,speed:48,scale:90,brightness:110}},{id:"highway",name:"Autostrada",description:"Zbalansowany ruch swietlny.",settings:{opacity:72,density:55,speed:95,scale:100,brightness:135,blendMode:"screen"}},{id:"rush",name:"Rush Hour",description:"Gesty i bardzo szybki ruch.",settings:{opacity:88,density:100,speed:175,scale:105,brightness:160,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant smug.",settings:{opacity:80,density:70,speed:120,hue:110,brightness:160,blendMode:"screen"}}],"vhs-static":[{id:"soft",name:"Lekka tasma",description:"Subtelne analogowe zaklocenia.",settings:{opacity:28,density:28,speed:55,scale:100,brightness:100}},{id:"tape",name:"VHS",description:"Klasyczne pasy starej kasety.",settings:{opacity:50,density:58,speed:95,scale:100,brightness:120,blendMode:"screen"}},{id:"damaged",name:"Uszkodzona tasma",description:"Mocne, szybkie zaklocenia obrazu.",settings:{opacity:82,density:100,speed:180,scale:105,brightness:150,blendMode:"screen"}},{id:"chromatic",name:"RGB Shift",description:"Kolorowe analogowe zaklocenia.",settings:{opacity:68,density:75,speed:125,hue:105,brightness:145,blendMode:"screen"}}],"solar-flare":[{id:"corona",name:"Korona",description:"Delikatne luki slonecznej plazmy.",settings:{opacity:48,density:30,speed:38,scale:95,brightness:120}},{id:"active",name:"Aktywne slonce",description:"Zbalansowane protuberancje.",settings:{opacity:72,density:55,speed:62,scale:105,brightness:145,blendMode:"screen"}},{id:"eruption",name:"Erupcja",description:"Gesty i bardzo jasny rozblysk.",settings:{opacity:94,density:100,speed:135,scale:120,brightness:190,blendMode:"screen"}},{id:"alien",name:"Obce slonce",description:"Przesunieta barwa daje nietypowa gwiazde.",settings:{opacity:84,density:72,speed:78,scale:112,hue:125,brightness:165,blendMode:"screen"}}],"scanlines-plus":[{id:"soft",name:"Subtelne",description:"Delikatny skan ekranu.",settings:{opacity:34,density:28,speed:72,brightness:105,blendMode:"screen"}},{id:"monitor",name:"Monitor",description:"Klasyczny efekt skanowania obrazu.",settings:{opacity:58,density:52,speed:100,brightness:120,blendMode:"screen"}},{id:"aggressive",name:"Agresywne",description:"Wiecej linii i mocniejszy ruch.",settings:{opacity:82,density:92,speed:165,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowe",description:"Neonowo-fioletowy skan.",settings:{opacity:74,density:60,speed:110,hue:85,brightness:145,blendMode:"screen"}}],"equalizer-bars":[{id:"ambient",name:"Ambient",description:"Spokojne slupki audio.",settings:{opacity:52,density:35,speed:65,scale:90,brightness:105,blendMode:"screen"}},{id:"stage",name:"Scena",description:"Zbalansowany wizualizer muzyczny.",settings:{opacity:76,density:62,speed:100,scale:100,brightness:125,blendMode:"screen"}},{id:"festival",name:"Festival",description:"Mocne i wysokie slupki.",settings:{opacity:90,density:100,speed:155,scale:110,brightness:155,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant.",settings:{opacity:82,density:72,speed:120,hue:95,brightness:145,blendMode:"screen"}}],"hud-grid":[{id:"subtle",name:"Subtelny",description:"Lekka siatka tla.",settings:{opacity:28,density:30,speed:50,brightness:100,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelna warstwa HUD.",settings:{opacity:48,density:60,speed:70,brightness:120,blendMode:"screen"}},{id:"scanner",name:"Scanner",description:"Gestsza i bardziej techniczna siatka.",settings:{opacity:68,density:95,speed:110,brightness:145,blendMode:"screen"}},{id:"violet",name:"Violet HUD",description:"HUD z przesunieciem w strone fioletu.",settings:{opacity:58,density:72,speed:84,hue:88,brightness:140,blendMode:"screen"}}],"floating-symbols":[{id:"soft",name:"Lekkie",description:"Malo symboli i lagodny ruch.",settings:{opacity:46,density:28,speed:62,scale:95,brightness:110,blendMode:"screen"}},{id:"arcane",name:"Arcane",description:"Klasyczny magiczny wariant.",settings:{opacity:72,density:54,speed:78,scale:100,brightness:125,blendMode:"screen"}},{id:"ritual",name:"Ritual",description:"Wiecej symboli i silniejsza poswiata.",settings:{opacity:88,density:100,speed:120,scale:110,brightness:160,blendMode:"screen"}},{id:"dream",name:"Dream",description:"Jasniejszy, bardziej eteryczny wariant.",settings:{opacity:82,density:68,speed:72,hue:60,brightness:155,blendMode:"screen"}}],"smoke-wisps":[{id:"light",name:"Lekki dym",description:"Subtelne smugi dymu.",settings:{opacity:30,density:24,speed:50,scale:90,blur:4,brightness:100,blendMode:"screen"}},{id:"mist",name:"Mist",description:"Zbalansowane wispy dymu.",settings:{opacity:50,density:48,speed:68,scale:100,blur:8,brightness:110,blendMode:"screen"}},{id:"dense",name:"Gesty dym",description:"Bardziej widoczny i ciezszy dym.",settings:{opacity:72,density:88,speed:84,scale:110,blur:12,brightness:130,blendMode:"screen"}},{id:"toxic",name:"Toksyczny",description:"Zielonkawo-przesuniety dym.",settings:{opacity:66,density:64,speed:72,scale:105,hue:120,blur:10,brightness:140,blendMode:"screen"}}],"electric-arcs":[{id:"calm",name:"Spokojne",description:"Rzadkie przeskoki energii.",settings:{opacity:46,density:26,speed:68,brightness:120,blendMode:"screen"}},{id:"active",name:"Aktywne",description:"Widoczne luki energii.",settings:{opacity:82,density:55,speed:110,brightness:145,blendMode:"screen"}},{id:"storm",name:"Storm",description:"Bardzo szybkie i liczne wyadowania.",settings:{opacity:96,density:100,speed:175,brightness:180,blendMode:"screen"}},{id:"alien",name:"Alien",description:"Wyadowania z obca barwa.",settings:{opacity:88,density:72,speed:120,hue:95,brightness:165,blendMode:"screen"}}],"snow-burst":[{id:"light",name:"Lekki opad",description:"Spokojny i delikatny snieg.",settings:{opacity:42,density:28,speed:52,scale:90,brightness:110,blendMode:"screen"}},{id:"winter",name:"Winter",description:"Zbalansowany efekt zimowy.",settings:{opacity:72,density:68,speed:72,scale:100,brightness:125,blendMode:"screen"}},{id:"blizzard",name:"Blizzard",description:"Gestszy i szybszy snieg.",settings:{opacity:92,density:100,speed:145,scale:110,brightness:150,blendMode:"screen"}},{id:"moonlit",name:"Moonlit",description:"Chlodniejszy nocny wariant sniegu.",settings:{opacity:82,density:75,speed:86,scale:105,hue:15,brightness:145,blendMode:"screen"}}],"meteor-shower":[{id:"sparse",name:"Rzadkie meteory",description:"Niewiele smug na niebie.",settings:{opacity:46,density:22,speed:72,scale:90,brightness:115,blendMode:"screen"}},{id:"night",name:"Nocne niebo",description:"Klasyczny deszcz meteorow.",settings:{opacity:78,density:42,speed:100,scale:100,brightness:140,blendMode:"screen"}},{id:"peak",name:"Peak",description:"Maksimum roju meteorow.",settings:{opacity:92,density:100,speed:155,scale:112,brightness:175,blendMode:"screen"}},{id:"cosmic",name:"Cosmic",description:"Bardziej kolorowy kosmiczny wariant.",settings:{opacity:86,density:62,speed:118,scale:105,hue:72,brightness:165,blendMode:"screen"}}]};function Pt(e){return ml[e]??ul[e]??ll[e]??il[e]??rl[e]??hl[e]??[]}function gl(e,a){return Pt(e).find(t=>Object.entries(t.settings).every(([n,i])=>a[n]===i))}const Ne=new Set,bl={key:"opacity",label:"Krycie",min:0,max:100,suffix:"%"},wl={key:"density",label:"Gęstość",min:10,max:400,suffix:"%"},kl={key:"speed",label:"Prędkość",min:20,max:400,suffix:"%"},xl={key:"intensity",label:"Przyspieszenie",min:0,max:100,suffix:"%"},vl={key:"scale",label:"Skala",min:25,max:250,suffix:"%"},zl={key:"x",label:"Pozycja X",min:-100,max:100,suffix:"%"},Sl={key:"y",label:"Pozycja Y",min:-100,max:100,suffix:"%"},Pl={key:"rotation",label:"Obrót",min:-180,max:180,suffix:"°"},Cl={key:"blur",label:"Rozmycie",min:0,max:30,suffix:"px"},Ml={key:"brightness",label:"Jasność",min:25,max:250,suffix:"%"},El={key:"hue",label:"Odcień",min:-180,max:180,suffix:"°"},_l=["#57c7ff","#6d91ff","#a88cff","#d67cff","#f07a7a","#f39a62","#f0b85a","#72d98b","#55d6c2","#ffffff"];function rt(e){return e&&/^#[0-9a-f]{6}$/i.test(e)?e:"#a88cff"}function $l(e,a,t){const n=a[e.key],i=t[e.key],s=n===i;return`
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
            ${s?"disabled":""}
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
  `}function Rl(e,a,t){const n=Ne.has(e.id);return`
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
        ${e.fields.map(i=>$l(i,a,t)).join("")}
      </div>
    </section>
  `}function na(e){const a=nt();if(!a){e.innerHTML=`
      <div class="inspector-empty">
        <strong>Brak zaznaczonej warstwy</strong>
        <span>
          Wybierz warstwę po lewej stronie albo dodaj nowy efekt.
        </span>
      </div>
    `;return}const t=Se(a.effectId);if(!t){e.innerHTML=`
      <div class="inspector-empty">
        Nie znaleziono definicji efektu.
      </div>
    `;return}const n=Pt(a.effectId),i=gl(a.effectId,a.settings),s=[bl,wl,kl];a.effectId==="pong"&&s.push(xl);const r=[{id:"primary",title:"Podstawowe",description:"Widoczność, liczba elementów i tempo animacji",fields:s},{id:"transform",title:"Transformacja",description:"Rozmiar, pozycja i obrót całej warstwy",fields:[vl,zl,Sl,Pl]},{id:"appearance",title:"Wygląd",description:"Rozmycie, jasność i przesunięcie barwy",fields:[Cl,Ml,El]}];e.innerHTML=`
    <div class="inspector-title">
      <div class="inspector-title-copy">
        <strong>
          ${t.name}
        </strong>

        <span>
          ${a.effectId}
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

              ${n.map(d=>`
                    <option
                      value="${d.id}"
                      ${i?.id===d.id?"selected":""}
                    >
                      ${d.name}
                    </option>
                  `).join("")}
            </select>

            <p class="inspector-variant-description">
              ${i?.description??"Wybierz wariant, aby zastosować gotowy zestaw parametrów. Potem możesz dalej zmieniać suwaki."}
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
          ${a.settings.colorize?"":"disabled"}
        >
          Naturalny
        </button>
      </div>

      <div class="inspector-color-main">
        <label class="inspector-color-picker">
          <input
            type="color"
            value="${rt(a.settings.color)}"
            data-effect-color
            aria-label="Kolor efektu"
          >

          <span
            class="inspector-color-value"
            data-color-value
          >
            ${rt(a.settings.color).toUpperCase()}
          </span>
        </label>

        <span
          class="inspector-color-state ${a.settings.colorize?"is-active":""}"
        >
          ${a.settings.colorize?"Własny kolor":"Kolor naturalny"}
        </span>
      </div>

      <div
        class="inspector-color-swatches"
        aria-label="Szybkie kolory"
      >
        ${_l.map(d=>`
              <button
                class="inspector-color-swatch ${a.settings.colorize&&rt(a.settings.color).toLowerCase()===d.toLowerCase()?"is-selected":""}"
                type="button"
                data-color-preset="${d}"
                title="${d}"
                aria-label="Ustaw kolor ${d}"
                style="--swatch:${d}"
              ></button>
            `).join("")}
      </div>

      <p class="inspector-color-help">
        Kolorowanie obejmuje cały efekt i działa także dla jasnych / białych elementów.
        Suwak Odcień nadal może dodatkowo przesuwać barwę.
      </p>
    </section>

    ${r.map(d=>Rl(d,a.settings,t.defaultSettings)).join("")}

    <section
      class="inspector-group ${Ne.has("composition")?"is-collapsed":""}"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="composition"
        aria-expanded="${String(!Ne.has("composition"))}"
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
        ${Ne.has("composition")?"hidden":""}
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
              ${a.settings.blendMode===t.defaultSettings.blendMode?"disabled":""}
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
              ${a.settings.area===t.defaultSettings.area?"disabled":""}
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
  `;const o=e.querySelector('[data-setting="blendMode"]');o&&(o.value=a.settings.blendMode);const l=e.querySelector('[data-setting="area"]');l&&(l.value=a.settings.area),e.querySelectorAll("[data-inspector-group-toggle]").forEach(d=>{d.addEventListener("click",()=>{const w=d.dataset.inspectorGroupToggle;w&&(Ne.has(w)?Ne.delete(w):Ne.add(w),na(e))})});const m=e.querySelector("[data-effect-variant]");m?.addEventListener("change",()=>{const d=n.find(w=>w.id===m.value);d&&xe(a.instanceId,{...d.settings})});const y=e.querySelector("[data-effect-color]");y?.addEventListener("change",()=>{xe(a.instanceId,{color:rt(y.value),colorize:!0})}),e.querySelectorAll("[data-color-preset]").forEach(d=>{d.addEventListener("click",()=>{const w=rt(d.dataset.colorPreset);xe(a.instanceId,{color:w,colorize:!0})})}),e.querySelector("[data-color-natural]")?.addEventListener("click",()=>{xe(a.instanceId,{color:t.defaultSettings.color,colorize:!1})}),e.querySelectorAll("[data-reset-setting]").forEach(d=>{d.addEventListener("click",w=>{w.preventDefault(),w.stopPropagation();const u=d.dataset.resetSetting;u&&xe(a.instanceId,{[u]:t.defaultSettings[u]})})}),e.querySelector("[data-reset-variant]")?.addEventListener("click",()=>{xe(a.instanceId,{...t.defaultSettings})}),e.querySelectorAll('input[type="range"][data-setting]').forEach(d=>{d.addEventListener("input",()=>{const w=d.dataset.setting,u=Number(d.value),b=e.querySelector(`[data-output="${w}"]`);b&&(b.value=`${u}${d.dataset.suffix??""}`),xe(a.instanceId,{[w]:u})})}),o?.addEventListener("change",()=>{xe(a.instanceId,{blendMode:o.value})}),l?.addEventListener("change",()=>{xe(a.instanceId,{area:l.value})}),e.querySelector("[data-inspector-reset]")?.addEventListener("click",()=>{xe(a.instanceId,{...t.defaultSettings})})}function jl(e){e.querySelector("[data-export-close]")?.addEventListener("click",()=>e.close()),e.querySelectorAll("[data-copy]").forEach(t=>{t.addEventListener("click",async()=>{const n=t.dataset.copy;if(!n)return;const i=e.querySelector(`[data-export="${n}"]`);if(!i)return;await navigator.clipboard.writeText(i.value);const s=t.textContent;t.textContent="Skopiowano",setTimeout(()=>{t.textContent=s},1e3)})})}function Dl(e){const a=vr(be());qt(e,"html",a.html),qt(e,"css",a.css),qt(e,"javascript",a.javascript);const t=e.querySelector("[data-export-metrics]");t&&(t.textContent=`${a.estimatedDomNodes} DOM · koszt ${a.estimatedPerformanceCost}`),e.open||e.showModal()}function qt(e,a,t){const n=e.querySelector(`[data-export="${a}"]`);n&&(n.value=t)}const jr=document.querySelector("#app");if(!jr)throw new Error("Nie znaleziono elementu #app.");jr.innerHTML=`
  <main class="ae-app-shell">
    <header class="ae-app-header">
      <div class="ae-brand">
        <div class="ae-brand-mark">OBS</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">OBS / STREAM</span>
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
        data-export-close
      >
        ×
      </button>
    </div>

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
`;function Ce(e){const a=document.querySelector(e);if(!a)throw new Error(`Nie znaleziono elementu: ${e}`);return a}const Il=Ce("#preview-host"),Wt=Ce("#layers-list"),Nl=Ce("#layer-count"),sa=Ce("#inspector"),Ee=Ce("#effect-library"),Ba=Ce("#effect-search"),Ct=Ce("#effect-category"),Al=Ce("#effect-result-count"),Ll=Ce("#library-summary"),Bl=Ce("#active-summary"),Ol=Ce("#preview-meta"),Dr=Ce("#stream-elements-export");jl(Dr);const Xt=Hc(Il),Mt=ot();let Ir="",Et="all",Pe=null;function Tl(e){const a=Se(e);return a?{instanceId:`preview-${crypto.randomUUID()}`,effectId:a.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...a.defaultSettings}}:null}function Nr(){Pe&&(Pe=null,$t(),oa())}let _t=!1;const Fl={calm:"Spokojne",energy:"Energia","sci-fi":"Sci-Fi",fantasy:"Fantasy",steampunk:"Steampunk",botanical:"Natura",urban:"Urban",cosmic:"Kosmos",tech:"Tech",solar:"Solar",retro:"Retro",weather:"Pogoda",cinematic:"Filmowe",abstract:"Abstrakcyjne",other:"Inne"};function it(e){return Fl[e]??e}function ql(e){return be().effects.filter(t=>t.effectId===e.effectId).findIndex(t=>t.instanceId===e.instanceId)+1}function Wl(){const e=[...new Set(Mt.map(a=>a.category))].sort((a,t)=>it(a).localeCompare(it(t),"pl"));Ct.innerHTML=`
    <option value="all">
      Wszystkie kategorie
    </option>

    ${e.map(a=>`
          <option value="${a}">
            ${it(a)}
          </option>
        `).join("")}
  `,Ct.value=Et}function Xl(){const e=Ee.getBoundingClientRect(),t=Array.from(Ee.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).filter(i=>!i.hidden&&getComputedStyle(i).display!=="none").find(i=>i.getBoundingClientRect().bottom>e.top+1);if(!t)return null;const n=t.dataset.effectId;return n?{effectId:n,topOffset:t.getBoundingClientRect().top-e.top,scrollTop:Ee.scrollTop}:null}function Ul(e){if(!e)return;const a=Ee.getBoundingClientRect(),t=Array.from(Ee.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).find(s=>s.dataset.effectId===e.effectId);if(!t){Ee.scrollTop=e.scrollTop;return}const i=t.getBoundingClientRect().top-a.top-e.topOffset;Number.isFinite(i)&&Math.abs(i)>.25&&(Ee.scrollTop+=i)}function Gl(e){e&&requestAnimationFrame(()=>{requestAnimationFrame(()=>{Ul(e)})})}function $t(){Array.from(Ee.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).forEach(e=>{const a=e.dataset.effectId;if(!a)return;const t=Pe?.effectId===a;e.classList.toggle("is-previewing",t);const n=e.querySelector(".ae-effect-card-preview");if(!n)return;n.setAttribute("aria-pressed",String(t));const i=Se(a);i&&n.setAttribute("aria-label",t?`Wyłącz tymczasowy podgląd ${i.name}`:`Podejrzyj tymczasowo ${i.name}`)})}function ia(){const e=Xl(),a=Ir.trim().toLocaleLowerCase("pl"),t=Mt.filter(n=>Et==="all"||n.category===Et?a?[n.name,n.id,n.category,...n.tags,...Pt(n.id).map(r=>r.name)].join(" ").toLocaleLowerCase("pl").includes(a):!0:!1);if(Al.textContent=`${t.length} z ${Mt.length}`,Ee.replaceChildren(),t.length===0){Ee.innerHTML=`
      <div class="ae-empty-state">
        Nie znaleziono efektów dla tych filtrów.
      </div>
    `;return}t.forEach(n=>{const i=document.createElement("div");i.className="ae-effect-card",i.dataset.category=n.category,i.dataset.effectId=n.id;const s=Pe?.effectId===n.id;i.classList.toggle("is-previewing",s),i.title=n.description;const r=`Koszt wydajności: ${n.performanceCost}/5`,o=Pt(n.id).length,l=Array.from({length:5},(m,y)=>`
            <i class="${y<n.performanceCost?"is-filled":""}"></i>
          `).join("");i.innerHTML=`
        <button
          class="ae-effect-card-preview"
          type="button"
          aria-pressed="${String(s)}"
          aria-label="${s?`Wyłącz tymczasowy podgląd ${n.name}`:`Podejrzyj tymczasowo ${n.name}`}"
        >
          <span class="ae-effect-card-main">
            <strong>${n.name}</strong>

            <span class="ae-effect-card-subline">
              <small>
                ${it(n.category)}
              </small>

              <span
                class="ae-performance-dots"
                title="${r}"
                aria-label="${r}"
              >
                ${l}
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
      `,i.querySelector(".ae-effect-card-preview")?.addEventListener("click",()=>{Pe=Pe?.effectId===n.id?null:Tl(n.id),$t(),oa()}),i.querySelector(".ae-add-icon")?.addEventListener("click",()=>{Pe=null,$t(),Va(n.id)}),Ee.appendChild(i)}),Gl(e)}function oa(){Xt.replaceChildren(),be().effects.forEach(a=>{a.enabled&&La(Xt,a)}),Pe&&La(Xt,Pe)}function Yl(){const e=be();if(Wt.replaceChildren(),Nl.textContent=String(e.effects.length),e.effects.length===0){Wt.innerHTML=`
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejdź do zakładki Efekty i dodaj pierwszy efekt.
      </div>
    `;return}[...e.effects].reverse().forEach(a=>{const t=Se(a.effectId);if(!t)return;const n=document.createElement("div");n.className="ae-layer-row",a.enabled||n.classList.add("is-disabled"),e.selectedEffectInstanceId===a.instanceId&&n.classList.add("is-selected");const i=ql(a);n.innerHTML=`
          <button
            class="ae-layer-select"
            type="button"
          >
            <span class="ae-layer-color-dot"></span>

            <span class="ae-layer-copy">
              <strong>
                ${t.name} #${i}
              </strong>

              <small>
                ${it(t.category)}
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
              ${a.enabled?"ON":"OFF"}
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
        `,n.querySelector(".ae-layer-select")?.addEventListener("click",()=>{Qa(a.instanceId)}),n.querySelector(".layer-toggle")?.addEventListener("click",()=>{Ii(a.instanceId)}),n.querySelector(".layer-up")?.addEventListener("click",()=>{Li(a.instanceId)}),n.querySelector(".layer-down")?.addEventListener("click",()=>{Bi(a.instanceId)}),n.querySelector(".layer-remove")?.addEventListener("click",()=>{Ka(a.instanceId)}),Wt.appendChild(n)})}function Hl(){const e=be(),a=e.effects.filter(t=>t.enabled).length;Ll.textContent=`${Mt.length} efektów`,Bl.textContent=`Aktywne: ${a} · Warstwy: ${e.effects.length}`,Ol.textContent=`${e.resolution.width} × ${e.resolution.height} · aktywne: ${a}`}function Zl(){$t(),oa(),Yl(),Hl(),_t||(na(sa),Ui())}function Jl(e){document.querySelectorAll("[data-sidebar-tab]").forEach(a=>{const t=a.dataset.sidebarTab===e;a.classList.toggle("is-active",t),a.setAttribute("aria-selected",String(t))}),document.querySelectorAll("[data-sidebar-view]").forEach(a=>{const t=a.dataset.sidebarView===e;a.hidden=!t,a.classList.toggle("is-active",t)})}Wl();ia();Ha(Zl);sa.addEventListener("pointerdown",e=>{const a=e.target;a instanceof HTMLInputElement&&a.type==="range"&&(_t=!0)});const Ar=()=>{_t&&(_t=!1,na(sa))};window.addEventListener("pointerup",Ar);window.addEventListener("pointercancel",Ar);Ba.addEventListener("input",()=>{Ir=Ba.value,ia()});Ct.addEventListener("change",()=>{Et=Ct.value,ia()});document.addEventListener("pointerdown",e=>{if(!Pe)return;const a=e.target;a instanceof Element&&(a.closest(".ae-effect-card")||Nr())});document.addEventListener("keydown",e=>{e.key==="Escape"&&Pe&&Nr()});document.querySelectorAll("[data-sidebar-tab]").forEach(e=>{e.addEventListener("click",()=>{const a=e.dataset.sidebarTab;(a==="effects"||a==="layers")&&Jl(a)})});document.querySelector("#clear-preview")?.addEventListener("click",()=>{Pe=null,Di()});document.querySelector("#export-stream-elements")?.addEventListener("click",()=>{Dl(Dr)});Va("rainfall");Fc();Gi();Yc();Tr();Xi();console.warn("[AE diagnostic] Pack 18 isolation active: Pack06Polish02, Pack08UiQa, Pack09Customization and Pack09UiPolish are disabled.");
