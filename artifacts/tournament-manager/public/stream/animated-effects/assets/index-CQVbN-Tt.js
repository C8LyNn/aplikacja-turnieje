(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const oe={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#a88cff",colorize:!1,density:100,blendMode:"normal",area:"full",zIndex:20,speed:100,intensity:100},es={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0};function ce(e){return{...e,capabilities:e.capabilities??es}}function Y(e,t,a=0){return Math.max(a,Math.round(e*(t.density/100)))}const ts=`
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
`.trim(),as=`
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
`.trim(),ns=`
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
`.trim(),rs=`
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
`.trim(),ss=`
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
`.trim(),is=`
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
`.trim(),os=`
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
`.trim(),cs=`
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
`.trim(),ls=`
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
`.trim(),ds={definition:ce({id:"rainfall",name:"Rainfall",description:"SpadajÄ…ce krople deszczu.",category:"weather",tags:["rain","weather","water"],defaultSettings:{...oe,opacity:75,density:70,speed:120},performanceCost:3,requiresJavaScript:!0}),css:ts,streamElementsRendererName:"aeRenderRainfall",renderPreview(e,t,a){const n=Y(80,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-rain-drop",r.style.left=`${a()*100}%`,r.style.animationDelay=`${-a()*2}s`,r.style.animationDuration=`${(.7+a()*.8)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(80,e)}},ps={definition:ce({id:"snow",name:"Snow",description:"SpadajÄ…ce pĹ‚atki Ĺ›niegu.",category:"weather",tags:["snow","winter","weather","flakes"],defaultSettings:{...oe,opacity:85,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:as,streamElementsRendererName:"aeRenderSnow",renderPreview(e,t,a){const n=Y(55,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-snowflake";const o=4+a()*10;r.style.left=`${a()*100}%`,r.style.top=`${-10-a()*25}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.opacity=String(.45+a()*.55),r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(6+a()*8)/s}s`,r.style.setProperty("--ae-snow-drift",`${-50+a()*100}px`),r.style.setProperty("--ae-snow-rotation",`${120+a()*360}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(55,e)}},us={definition:ce({id:"lightning",name:"Lightning Storm",description:"Losowe bĹ‚yski i pioruny.",category:"weather",tags:["lightning","storm","electric"],defaultSettings:{...oe,opacity:100,density:45,speed:100,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:ns,streamElementsRendererName:"aeRenderLightning",renderPreview(e,t,a){const n=Y(8,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-lightning",r.style.left=`${10+a()*80}%`,r.style.top=`${a()*35}%`,r.style.animationDelay=`${-a()*4}s`,r.style.animationDuration=`${2.2/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(8,e,1)}},fs={definition:ce({id:"hearts",name:"Hearts",description:"UnoszÄ…ce siÄ™ animowane serduszka.",category:"other",tags:["heart","love","particles","fun"],defaultSettings:{...oe,opacity:80,density:50,speed:80},performanceCost:2,requiresJavaScript:!0}),css:rs,streamElementsRendererName:"aeRenderHearts",renderPreview(e,t,a){const n=Y(30,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-heart",r.innerHTML="&#10084;",r.style.left=`${a()*100}%`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${8/s}s`,r.style.fontSize=`${14+a()*22}px`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(30,e)}},ms={definition:ce({id:"leaves",name:"Leaves",description:"WirujÄ…ce, opadajÄ…ce liĹ›cie.",category:"botanical",tags:["leaves","autumn","nature","particles"],defaultSettings:{...oe,opacity:90,density:60,speed:70},performanceCost:2,requiresJavaScript:!0}),css:ss,streamElementsRendererName:"aeRenderLeaves",renderPreview(e,t,a){const n=Y(36,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-leaf";const o=12+a()*16;r.style.left=`${a()*100}%`,r.style.top=`${-10-a()*25}%`,r.style.width=`${o}px`,r.style.height=`${o*.62}px`,r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(7+a()*8)/s}s`,r.style.setProperty("--ae-leaf-drift",`${-90+a()*180}px`),r.style.setProperty("--ae-leaf-rotation",`${360+a()*720}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(36,e)}},ys={definition:ce({id:"matrix",name:"Matrix Code",description:"Kolumny opadajÄ…cego cyfrowego kodu.",category:"tech",tags:["matrix","code","digital","tech","cyber"],defaultSettings:{...oe,opacity:80,density:55,speed:85,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:is,streamElementsRendererName:"aeRenderMatrix",renderPreview(e,t,a){const n=Y(24,t,1),s=Math.max(.1,t.speed/100),i="01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-matrix-column";const c=8+Math.floor(a()*11);let d="";for(let f=0;f<c;f++)d+=i[Math.floor(a()*i.length)],f<c-1&&(d+=`
`);o.textContent=d,o.style.left=`${a()*100}%`,o.style.fontSize=`${11+a()*9}px`,o.style.animationDelay=`${-a()*8}s`,o.style.animationDuration=`${(4+a()*5)/s}s`,o.style.opacity=String(.45+a()*.55),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(24,e,1)}},hs={definition:ce({id:"comets",name:"Comets",description:"Szybkie Ĺ›wietliste komety przecinajÄ…ce ekran.",category:"cosmic",tags:["comet","space","cosmic","streak"],defaultSettings:{...oe,opacity:90,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:os,streamElementsRendererName:"aeRenderComets",renderPreview(e,t,a){const n=Y(10,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-comet",r.style.top=`${-10+a()*75}%`,r.style.width=`${90+a()*140}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(4+a()*5)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(10,e,1)}},gs={definition:ce({id:"starfield",name:"Starfield",description:"MigoczÄ…ce gwiazdy w tle.",category:"cosmic",tags:["stars","space","cosmic","twinkle"],defaultSettings:{...oe,opacity:85,density:65,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:cs,streamElementsRendererName:"aeRenderStarfield",renderPreview(e,t,a){const n=Y(100,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-star";const o=1+a()*3.5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*4}s`,r.style.animationDuration=`${(1.5+a()*3)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(100,e)}},bs={definition:ce({id:"fog",name:"Fog",description:"Powolne warstwy mgĹ‚y przesuwajÄ…ce siÄ™ przez ekran.",category:"weather",tags:["fog","mist","cloud","weather","cinematic"],defaultSettings:{...oe,opacity:65,density:70,speed:45,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:ls,streamElementsRendererName:"aeRenderFog",renderPreview(e,t,a){const n=Y(6,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-fog-blob",r.style.left=`${-25+a()*95}%`,r.style.top=`${-10+a()*75}%`,r.style.width=`${45+a()*35}%`,r.style.height=`${30+a()*35}%`,r.style.opacity=String(.16+a()*.22),r.style.animationDelay=`${-a()*24}s`,r.style.animationDuration=`${(18+a()*18)/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(6,e,1)}},ws=`
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
`.trim(),ks=`
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
`.trim(),vs=`
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
`.trim(),xs=`
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
`.trim(),zs=`
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
`.trim(),Ss=`
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
`.trim(),Ms=`
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
`.trim(),Es=`
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
`.trim(),Ps={definition:ce({id:"embers",name:"Embers",description:"Ĺ»arzÄ…ce siÄ™ drobiny unoszÄ…ce siÄ™ ku gĂłrze.",category:"cinematic",tags:["embers","fire","ash","cinematic"],defaultSettings:{...oe,opacity:90,density:55,speed:70,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ws,streamElementsRendererName:"aeRenderEmbers",renderPreview(e,t,a){const n=Y(46,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-ember";const o=2+a()*6;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(5+a()*7)/s}s`,r.style.setProperty("--ae-ember-drift",`${-55+a()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(46,e)}},Cs={definition:ce({id:"clouds",name:"Clouds",description:"MiÄ™kkie, pĂłĹ‚przezroczyste chmury przesuwajÄ…ce siÄ™ po ekranie.",category:"weather",tags:["clouds","weather","mist","sky"],defaultSettings:{...oe,opacity:70,density:45,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ks,streamElementsRendererName:"aeRenderClouds",renderPreview(e,t,a){const n=Y(10,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-cloud";const o=220+a()*340,c=90+a()*130;r.style.left=`${-35-a()*35}%`,r.style.top=`${a()*85}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.opacity=String(.35+a()*.5),r.style.animationDelay=`${-a()*24}s`,r.style.animationDuration=`${(22+a()*28)/s}s`,r.style.setProperty("--ae-cloud-lift",`${-6+a()*12}vh`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(10,e,1)}},js={definition:ce({id:"rain-glass",name:"Rain on Glass",description:"Krople deszczu spĹ‚ywajÄ…ce po wirtualnej szybie.",category:"weather",tags:["rain","glass","drops","weather"],defaultSettings:{...oe,opacity:72,density:55,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:vs,streamElementsRendererName:"aeRenderRainGlass",renderPreview(e,t,a){const n=Y(44,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-glass-drop";const o=3+a()*8,c=18+a()*72;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.animationDelay=`${-a()*11}s`,r.style.animationDuration=`${(4+a()*9)/s}s`,r.style.setProperty("--ae-glass-drift",`${-12+a()*24}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(44,e)}},_s={definition:ce({id:"bouncing-balls",name:"Bouncing Balls",description:"Kolorowe kule odbijajÄ…ce siÄ™ i dryfujÄ…ce po ekranie.",category:"retro",tags:["balls","bounce","retro","screensaver"],defaultSettings:{...oe,opacity:85,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:xs,streamElementsRendererName:"aeRenderBouncingBalls",renderPreview(e,t,a){const n=Y(18,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-bounce-ball";const o=14+a()*42;r.style.left=`${8+a()*78}%`,r.style.top=`${8+a()*78}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-ball-dx",`${-18+a()*36}vw`),r.style.setProperty("--ae-ball-dy",`${-14+a()*28}vh`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(18,e,1)}},$s={definition:ce({id:"neon-lines",name:"Neon Lines",description:"ĹšwiecÄ…ce neonowe smugi przesuwajÄ…ce siÄ™ przez ekran.",category:"tech",tags:["neon","lines","cyber","tech"],defaultSettings:{...oe,opacity:88,density:45,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:zs,streamElementsRendererName:"aeRenderNeonLines",renderPreview(e,t,a){const n=Y(16,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-neon-line",r.style.left=`${-35-a()*25}%`,r.style.top=`${5+a()*90}%`,r.style.width=`${120+a()*320}px`,r.style.opacity=String(.45+a()*.55),r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(3+a()*6)/s}s`,r.style.setProperty("--ae-line-angle",`${-20+a()*40}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(16,e,1)}},Rs={definition:ce({id:"energy-orbs",name:"Energy Orbs",description:"PulsujÄ…ce, Ĺ›wiecÄ…ce kule energii.",category:"energy",tags:["energy","orbs","glow","plasma"],defaultSettings:{...oe,opacity:82,density:48,speed:70,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Ss,streamElementsRendererName:"aeRenderEnergyOrbs",renderPreview(e,t,a){const n=Y(20,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-energy-orb";const o=14+a()*56;r.style.left=`${5+a()*88}%`,r.style.top=`${5+a()*88}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*9}s`,r.style.animationDuration=`${(4+a()*8)/s}s`,r.style.setProperty("--ae-orb-dx",`${-70+a()*140}px`),r.style.setProperty("--ae-orb-dy",`${-60+a()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(20,e,1)}},Is={definition:ce({id:"petals",name:"Petals",description:"Delikatne pĹ‚atki opadajÄ…ce i wirujÄ…ce na wietrze.",category:"botanical",tags:["petals","flowers","spring","nature"],defaultSettings:{...oe,opacity:88,density:55,speed:62},performanceCost:2,requiresJavaScript:!0}),css:Ms,streamElementsRendererName:"aeRenderPetals",renderPreview(e,t,a){const n=Y(34,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-petal";const o=8+a()*13,c=12+a()*18;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.animationDelay=`${-a()*12}s`,r.style.animationDuration=`${(7+a()*9)/s}s`,r.style.setProperty("--ae-petal-drift",`${-70+a()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(34,e)}},As={definition:ce({id:"sparks",name:"Sparks",description:"Jasne iskry wystrzeliwujÄ…ce ku gĂłrze.",category:"energy",tags:["sparks","fire","energy","particles"],defaultSettings:{...oe,opacity:92,density:58,speed:115,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Es,streamElementsRendererName:"aeRenderSparks",renderPreview(e,t,a){const n=Y(52,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-spark",r.style.left=`${a()*100}%`,r.style.height=`${8+a()*24}px`,r.style.animationDelay=`${-a()*7}s`,r.style.animationDuration=`${(2.2+a()*4.2)/s}s`,r.style.setProperty("--ae-spark-drift",`${-75+a()*150}px`),r.style.setProperty("--ae-spark-angle",`${-22+a()*44}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(52,e)}},Ns=`
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
`.trim(),Ls=`
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
`.trim(),Ds=`
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
`.trim(),Ts=`
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
`.trim(),Os=`
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
`.trim(),qs=`
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
`.trim(),Fs=`
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
`.trim(),Bs=`
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
`.trim(),Ws=`
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
`.trim(),Us=`
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
`.trim(),Xs=`
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
`.trim(),Zs=`
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
`.trim(),Hs={definition:ce({id:"plasma",name:"Plasma",description:"PulsujÄ…ce obĹ‚oki plazmy i neonowej energii.",category:"energy",tags:["plasma","energy","glow","abstract"],defaultSettings:{...oe,opacity:80,density:45,speed:65,blendMode:"screen"},performanceCost:3,requiresJavaScript:!0}),css:Ns,streamElementsRendererName:"aeRenderPlasma",renderPreview(e,t,a){const n=Y(9,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-plasma-blob";const o=70+a()*150;r.style.left=`${a()*90}%`,r.style.top=`${a()*85}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(6+a()*8)/s}s`,r.style.setProperty("--ae-plasma-x",`${-90+a()*180}px`),r.style.setProperty("--ae-plasma-y",`${-70+a()*140}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(9,e,1)}},Ys={definition:ce({id:"energy-waves",name:"Energy Waves",description:"RozchodzÄ…ce siÄ™ neonowe fale energii.",category:"energy",tags:["energy","waves","rings","pulse"],defaultSettings:{...oe,opacity:82,density:45,speed:85,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ls,streamElementsRendererName:"aeRenderEnergyWaves",renderPreview(e,t,a){const n=Y(7,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-energy-wave",r.style.left=`${35+a()*30}%`,r.style.top=`${35+a()*30}%`,r.style.animationDelay=`${-(i/n)*5}s`,r.style.animationDuration=`${5/s}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(7,e,1)}},Gs={definition:ce({id:"runes",name:"Runes",description:"Świecące runy Elder Futhark unoszące się w tle.",category:"fantasy",tags:["runes","elder-futhark","magic","fantasy","symbols"],defaultSettings:{...oe,opacity:78,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ds,streamElementsRendererName:"aeRenderRunes",renderPreview(e,t,a){const n=["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"],s=Y(24,t,1),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-rune",o.textContent=n[Math.floor(a()*n.length)]??"ᚠ",o.style.left=`${a()*95}%`,o.style.top=`${a()*92}%`,o.style.fontSize=`${18+a()*36}px`,o.style.animationDelay=`${-a()*9}s`,o.style.animationDuration=`${(6+a()*7)/i}s`,o.style.setProperty("--ae-rune-x",`${-45+a()*90}px`),o.style.setProperty("--ae-rune-y",`${-55+a()*110}px`),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(24,e,1)}},Js={definition:ce({id:"magic-dust",name:"Magic Dust",description:"MigoczÄ…cy magiczny pyĹ‚ i drobne iskierki.",category:"fantasy",tags:["magic","dust","sparkle","fantasy"],defaultSettings:{...oe,opacity:86,density:65,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ts,streamElementsRendererName:"aeRenderMagicDust",renderPreview(e,t,a){const n=Y(70,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-magic-dust";const o=1.5+a()*4.5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*7}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-dust-x",`${-40+a()*80}px`),r.style.setProperty("--ae-dust-y",`${-60+a()*120}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(70,e)}},Vs={definition:ce({id:"laser-grid",name:"Laser Grid",description:"Perspektywiczna neonowa siatka w stylu synthwave.",category:"sci-fi",tags:["laser","grid","synthwave","cyber"],defaultSettings:{...oe,opacity:72,density:55,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Os,streamElementsRendererName:"aeRenderLaserGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-laser-grid";const n=Math.max(20,92-t.density*.65);a.style.setProperty("--ae-grid-size",`${n}px`),a.style.animationDuration=`${5/Math.max(.1,t.speed/100)}s`,e.appendChild(a)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},Ks={definition:ce({id:"scanlines",name:"Retro Scanlines",description:"Animowane linie kineskopowe CRT.",category:"retro",tags:["retro","crt","scanlines","arcade"],defaultSettings:{...oe,opacity:55,density:60,speed:100,blendMode:"overlay"},performanceCost:1,requiresJavaScript:!0}),css:qs,streamElementsRendererName:"aeRenderScanlines",renderPreview(e,t){const a=document.createElement("span");a.className="ae-scanlines";const n=Math.max(3,12-t.density*.08);a.style.setProperty("--ae-scan-gap",`${n}px`),a.style.animationDuration=`${1.8/Math.max(.1,t.speed/100)}s`,e.appendChild(a)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}};function Qs(e,t,a){const n=document.createElement("div");n.className="ae-pong-arena";const s=document.createElement("span");s.className="ae-pong-center-line";const i=document.createElement("span");i.className="ae-pong-paddle left";const r=document.createElement("span");r.className="ae-pong-paddle right";const o=document.createElement("span");o.className="ae-pong-ball";const c=document.createElement("span");c.className="ae-pong-score left";const d=document.createElement("span");d.className="ae-pong-score right",n.append(s,c,d,i,r,o),e.appendChild(n);let f=0,p=0,b=10,u=100,h=14,m=28,g=0,w=0,k=0,x=0,M=0,P=0,A=0,_=0,D=0,j=0,W=0,K=0,E=performance.now(),O=!1,y=260;const q=Math.max(.2,t.speed/100),te=Math.max(.1,Math.min(1,t.density/100)),B=Math.max(0,Math.min(1,t.intensity/100)),ie=.0125*B,X=1+.8*B,ne=52*Math.PI/180,N=()=>{c.textContent=String(W),d.textContent=String(K)},I=()=>{const le=n.clientWidth,se=n.clientHeight;if(le<=0||se<=0)return!1;const ye=le!==f||se!==p;return f=le,p=se,b=Math.max(8,f*.009),u=Math.max(58,p*.22),h=Math.max(12,Math.min(20,Math.min(f,p)*.026)),m=Math.max(22,f*.045),y=Math.max(210,Math.min(f,p)*.58)*q,i.style.width=`${b}px`,i.style.height=`${u}px`,r.style.width=`${b}px`,r.style.height=`${u}px`,o.style.width=`${h}px`,o.style.height=`${h}px`,ye&&O&&(g=Math.max(0,Math.min(p-u,g)),w=Math.max(0,Math.min(p-u,w)),M=Math.max(0,Math.min(p-u,M)),P=Math.max(0,Math.min(p-u,P)),A=Math.max(-h,Math.min(f,A)),_=Math.max(0,Math.min(p-h,_))),!0},re=le=>{A=f/2-h/2,_=p/2-h/2;const se=(12+a()*20)*Math.PI/180*(a()<.5?-1:1);D=le*y*Math.cos(se),j=y*Math.sin(se)},V=()=>{I()&&(g=p/2-u/2,w=g,k=0,x=0,M=g,P=w,re(a()<.5?-1:1),N(),O=!0,E=performance.now())},G=(le,se,ye,pe,l,T,R)=>{const z=ye-le,S=Math.max(-pe,Math.min(pe,z*T))-se,$=l*R,L=se+Math.max(-$,Math.min($,S));let C=le+L*R;const F=Math.max(0,p-u);return C<0?(C=0,{position:C,velocity:Math.max(0,L)}):C>F?(C=F,{position:C,velocity:Math.min(0,L)}):{position:C,velocity:L}},me=(le,se)=>{const ye=Math.max(y,Math.hypot(D,j)),pe=y*X,l=Math.min(pe,ye*(1+ie)),T=_+h/2,R=Math.max(-1,Math.min(1,(T-(se+u/2))/(u/2))),z=Math.sin(ne),v=Math.max(-z,Math.min(z,j/ye)),S=R*z,$=v*.78+S*.22,L=.72,C=Math.sqrt(Math.max(0,1-L*L)),F=Math.max(-C,Math.min(C,$));j=l*F;const U=Math.sqrt(Math.max(0,l*l-j*j));D=le*U},ge=le=>{le==="left"?W+=1:K+=1,(W>=10||K>=10)&&(W=0,K=0),N(),re(le==="left"?-1:1)},de=le=>{const se=m,ye=f-m-b,pe=1e-6;let l=le,T=0;for(;l>pe&&T<12;){T+=1;let R=l+1,z=null;const v=(S,$)=>{S>=-pe&&S<=l+pe&&S<R&&(R=Math.max(0,S),z=$)};if(j<-pe&&v((0-_)/j,"top"),j>pe&&v((p-h-_)/j,"bottom"),D<-pe){const $=(se+b-A)/D;if($>=-pe&&$<=l+pe){const L=_+j*Math.max(0,$);L+h>=g&&L<=g+u&&v($,"left-paddle")}v((-h-A)/D,"right-score")}if(D>pe){const $=(ye-h-A)/D;if($>=-pe&&$<=l+pe){const L=_+j*Math.max(0,$);L+h>=w&&L<=w+u&&v($,"right-paddle")}v((f-A)/D,"left-score")}if(z===null){A+=D*l,_+=j*l,l=0;break}switch(A+=D*R,_+=j*R,l-=R,z){case"top":_=0,j=Math.abs(j);break;case"bottom":_=p-h,j=-Math.abs(j);break;case"left-paddle":A=se+b,me(1,g);break;case"right-paddle":A=ye-h,me(-1,w);break;case"left-score":ge("left");return;case"right-score":ge("right");return}if(R<=pe&&l>pe){const S=Math.min(l,1e-5);A+=D*S,_+=j*S,l-=S}}},fe=le=>{if(!e.isConnected)return;if(!O&&(V(),!O)){requestAnimationFrame(fe);return}I();const se=Math.min(Math.max((le-E)/1e3,0),1/30);E=le;const ye=p*(.72+te*.58)*q,pe=p*(2.2+te*2.8)*q,l=4.2+te*3.2,T=2.8+te*2.4,R=(1-te)*u*.72,z=_+h/2,v=Math.sin(le*.0013+.8)*R,S=Math.sin(le*.00117+2.2)*R,$=D<0?z+v-u/2:p/2-u/2,L=D>0?z+S-u/2:p/2-u/2,C=Math.max(0,p-u),F=Math.max(0,Math.min(C,$)),U=Math.max(0,Math.min(C,L)),Z=1-Math.exp(-T*se);M+=(F-M)*Z,P+=(U-P)*Z;const Q=G(g,k,M,ye,pe,l,se);g=Q.position,k=Q.velocity;const ue=G(w,x,P,ye,pe,l,se);w=ue.position,x=ue.velocity,de(se);const ae=m,be=f-m-b;i.style.transform=`translate3d(${ae}px, ${g}px, 0)`,r.style.transform=`translate3d(${be}px, ${w}px, 0)`,o.style.transform=`translate3d(${A}px, ${_}px, 0)`,requestAnimationFrame(fe)};requestAnimationFrame(fe)}const ei={definition:ce({id:"pong",name:"Retro Pong",description:"PĹ‚ynna rozgrywka Pong z AI, wynikiem i regulowanym przyspieszeniem.",category:"retro",tags:["pong","retro","arcade","game","physics"],defaultSettings:{...oe,opacity:82,density:62,speed:90,intensity:0,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Fs,streamElementsRendererName:"aeRenderPong",renderPreview(e,t,a){Qs(e,t,a)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 7}},ti={definition:ce({id:"bubbles",name:"Bubbles",description:"Przezroczyste bÄ…belki unoszÄ…ce siÄ™ ku gĂłrze.",category:"calm",tags:["bubbles","water","calm","float"],defaultSettings:{...oe,opacity:72,density:52,speed:58,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Bs,streamElementsRendererName:"aeRenderBubbles",renderPreview(e,t,a){const n=Y(32,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-bubble";const o=12+a()*48;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*10}s`,r.style.animationDuration=`${(7+a()*8)/s}s`,r.style.setProperty("--ae-bubble-drift",`${-65+a()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(32,e,1)}},ai={definition:ce({id:"fireflies",name:"Fireflies",description:"MigoczÄ…ce Ĺ›wietliki poruszajÄ…ce siÄ™ w ciemnoĹ›ci.",category:"botanical",tags:["fireflies","nature","glow","night"],defaultSettings:{...oe,opacity:84,density:48,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ws,streamElementsRendererName:"aeRenderFireflies",renderPreview(e,t,a){const n=Y(38,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-firefly";const o=2+a()*5;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*8}s`,r.style.animationDuration=`${(4+a()*7)/s}s`,r.style.setProperty("--ae-firefly-x",`${-75+a()*150}px`),r.style.setProperty("--ae-firefly-y",`${-65+a()*130}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(38,e,1)}},ni={definition:ce({id:"confetti",name:"Confetti",description:"Kolorowe konfetti opadajÄ…ce przez ekran.",category:"other",tags:["confetti","party","celebration","color"],defaultSettings:{...oe,opacity:90,density:58,speed:80},performanceCost:2,requiresJavaScript:!0}),css:Us,streamElementsRendererName:"aeRenderConfetti",renderPreview(e,t,a){const n=["#ff4f9a","#ffe45c","#65e6ff","#7dff86","#b780ff","#ff8a42"],s=Y(55,t),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-confetti",o.style.left=`${a()*100}%`,o.style.width=`${5+a()*8}px`,o.style.height=`${9+a()*13}px`,o.style.background=n[Math.floor(a()*n.length)]??"#ff4f9a",o.style.animationDelay=`${-a()*8}s`,o.style.animationDuration=`${(5+a()*7)/i}s`,o.style.setProperty("--ae-confetti-drift",`${-85+a()*170}px`),o.style.setProperty("--ae-confetti-rot",`${420+a()*720}deg`),e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(55,e)}},ri={definition:ce({id:"dust-motes",name:"Dust Motes",description:"Subtelny kurz unoszÄ…cy siÄ™ w Ĺ›wietle.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],defaultSettings:{...oe,opacity:55,density:48,speed:38,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:Xs,streamElementsRendererName:"aeRenderDustMotes",renderPreview(e,t,a){const n=Y(48,t),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-dust-mote";const o=1+a()*4;r.style.left=`${a()*100}%`,r.style.top=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.animationDelay=`${-a()*13}s`,r.style.animationDuration=`${(9+a()*10)/s}s`,r.style.setProperty("--ae-mote-x",`${-55+a()*110}px`),r.style.setProperty("--ae-mote-y",`${-55+a()*110}px`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(48,e)}},si={definition:ce({id:"aurora",name:"Aurora",description:"MiÄ™kkie, kolorowe pasma zorzy polarnej.",category:"cosmic",tags:["aurora","cosmic","sky","glow"],defaultSettings:{...oe,opacity:72,density:55,speed:42,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Zs,streamElementsRendererName:"aeRenderAurora",renderPreview(e,t,a){const n=Y(5,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-aurora-band",r.style.top=`${5+a()*70}%`,r.style.height=`${18+a()*28}%`,r.style.animationDelay=`${-a()*11}s`,r.style.animationDuration=`${(8+a()*8)/s}s`,r.style.setProperty("--ae-aurora-angle",`${-16+a()*24}deg`),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(5,e,1)}},ii=`
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
`.trim(),oi=`
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
`.trim(),ci=`
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
`.trim(),li=`
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
`.trim(),di=`
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
`.trim(),pi=`
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
`.trim(),ui=`
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
`.trim(),fi=`
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
`.trim(),mi=`
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
`.trim(),yi=`
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
`.trim(),hi=`
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
`.trim(),gi=`
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
`.trim(),bi={definition:ce({id:"hologram-scan",name:"Hologram Scan",description:"Cyanowe pasma skanujace przesuwajace sie po ekranie.",category:"sci-fi",tags:["hologram","scan","sci-fi","cyan"],defaultSettings:{...oe,opacity:68,density:45,speed:80,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ii,streamElementsRendererName:"aeRenderHologramScan",renderPreview(e,t,a){const n=Y(7,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-hologram-scan",r.style.top=`${-20+a()*30}%`,r.style.setProperty("--ae-holo-height",`${1+a()*5}%`),r.style.setProperty("--ae-holo-duration",`${(4+a()*4)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(7,e,1)}},wi={definition:ce({id:"glitch-blocks",name:"Glitch Blocks",description:"Cyfrowe prostokaty pojawiajace sie w losowych miejscach.",category:"tech",tags:["glitch","blocks","digital","tech"],defaultSettings:{...oe,opacity:62,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:oi,streamElementsRendererName:"aeRenderGlitchBlocks",renderPreview(e,t,a){const n=Y(26,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-glitch-block",r.style.left=`${a()*94}%`,r.style.top=`${a()*94}%`,r.style.width=`${18+a()*150}px`,r.style.height=`${3+a()*28}px`;const o=-45+a()*90;r.style.setProperty("--ae-glitch-x",`${o}px`),r.style.setProperty("--ae-glitch-x2",`${-o*.5}px`),r.style.animationDuration=`${(.8+a()*3.2)/s}s`,r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(26,e,1)}},ki={definition:ce({id:"hex-grid",name:"Hex Grid",description:"Techniczna siatka szesciokatow przesuwajaca sie w tle.",category:"sci-fi",tags:["hex","grid","sci-fi","hud"],defaultSettings:{...oe,opacity:48,density:50,speed:45,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:ci,streamElementsRendererName:"aeRenderHexGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-hex-grid";const n=Math.max(34,96-t.density*.55);a.style.setProperty("--ae-hex-w",`${n}px`),a.style.setProperty("--ae-hex-h",`${n*1.73}px`),a.style.setProperty("--ae-hex-half",`${n*.5}px`),a.style.setProperty("--ae-hex-half-y",`${n*.865}px`),a.style.setProperty("--ae-hex-x2",`${n*1.5}px`),a.style.setProperty("--ae-hex-y2",`${n*2.595}px`),a.style.setProperty("--ae-hex-duration",`${14/Math.max(.1,t.speed/100)}s`),e.appendChild(a)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},vi={definition:ce({id:"portal-rings",name:"Portal Rings",description:"Koncentryczne neonowe pierscienie magicznego portalu.",category:"fantasy",tags:["portal","rings","magic","fantasy"],defaultSettings:{...oe,opacity:78,density:60,speed:65,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:li,streamElementsRendererName:"aeRenderPortalRings",renderPreview(e,t,a){const n=Y(7,t,2),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-portal-ring";const o=110+i*42+a()*18;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-portal-duration",`${(7+a()*8)/s}s`),r.style.animationDirection=i%2===0?"normal":"reverse",r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(7,e,2)}},xi={definition:ce({id:"magic-circle",name:"Magic Circle",description:"Obracajace sie okregi i segmenty magicznego sigilu.",category:"fantasy",tags:["magic","circle","sigil","fantasy"],defaultSettings:{...oe,opacity:72,density:55,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:di,streamElementsRendererName:"aeRenderMagicCircle",renderPreview(e,t,a){const n=Y(5,t,2),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-magic-circle";const o=150+i*48+a()*22;r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-circle-duration",`${(11+a()*10)/s}s`),r.style.animationDirection=i%2===0?"normal":"reverse",e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(5,e,2)}},zi={definition:ce({id:"crystal-shards",name:"Crystal Shards",description:"Lekkie, swiecace odlamki krysztalow unoszace sie w przestrzeni.",category:"fantasy",tags:["crystal","shards","fantasy","glow"],defaultSettings:{...oe,opacity:70,density:55,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:pi,streamElementsRendererName:"aeRenderCrystalShards",renderPreview(e,t,a){const n=Y(24,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-crystal-shard";const o=6+a()*18,c=o*(1.8+a());r.style.left=`${a()*96}%`,r.style.top=`${a()*94}%`,r.style.width=`${o}px`,r.style.height=`${c}px`,r.style.setProperty("--ae-crystal-x",`${-48+a()*96}px`),r.style.setProperty("--ae-crystal-duration",`${(8+a()*10)/s}s`),r.style.animationDelay=`${-a()*12}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(24,e,1)}},Si={definition:ce({id:"steam-vents",name:"Steam Vents",description:"Kleby pary unoszace sie od dolnej krawedzi.",category:"steampunk",tags:["steam","vents","steampunk","smoke"],defaultSettings:{...oe,opacity:55,density:50,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:ui,streamElementsRendererName:"aeRenderSteamVents",renderPreview(e,t,a){const n=Y(16,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-steam-puff";const o=55+a()*120;r.style.left=`${a()*94}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-steam-x",`${-65+a()*130}px`),r.style.setProperty("--ae-steam-duration",`${(7+a()*8)/s}s`),r.style.animationDelay=`${-a()*10}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(16,e,1)}},Mi={definition:ce({id:"gears",name:"Gears",description:"Obracajace sie mosiezne kola zebate w stylu steampunk.",category:"steampunk",tags:["gears","cogs","steampunk","mechanical"],defaultSettings:{...oe,opacity:62,density:45,speed:55,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:fi,streamElementsRendererName:"aeRenderGears",renderPreview(e,t,a){const n=Y(9,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-gear";const o=45+a()*130;r.style.left=`${a()*88}%`,r.style.top=`${a()*84}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-gear-duration",`${(8+a()*16)/s}s`),r.style.setProperty("--ae-gear-rot",i%2===0?"360deg":"-360deg"),e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(9,e,1)}},Ei={definition:ce({id:"city-lights",name:"City Lights",description:"Migoczace swiatla nocnego miasta.",category:"urban",tags:["city","lights","urban","night"],defaultSettings:{...oe,opacity:72,density:65,speed:45,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:mi,streamElementsRendererName:"aeRenderCityLights",renderPreview(e,t,a){const n=Y(48,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-city-light",r.style.left=`${a()*98}%`,r.style.top=`${45+a()*52}%`,r.style.width=`${2+a()*7}px`,r.style.height=`${2+a()*10}px`,r.style.setProperty("--ae-city-duration",`${(2+a()*6)/s}s`),r.style.animationDelay=`${-a()*7}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(48,e,1)}},Pi={definition:ce({id:"traffic-trails",name:"Traffic Trails",description:"Smugi swiatel samochodow przecinajace dol ekranu.",category:"urban",tags:["traffic","trails","urban","lights"],defaultSettings:{...oe,opacity:72,density:50,speed:90,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:yi,streamElementsRendererName:"aeRenderTrafficTrails",renderPreview(e,t,a){const n=Y(14,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-traffic-trail",r.style.top=`${55+a()*40}%`,r.style.setProperty("--ae-trail-width",`${12+a()*28}%`),r.style.setProperty("--ae-traffic-duration",`${(3+a()*5)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(14,e,1)}},Ci={definition:ce({id:"vhs-static",name:"VHS Static",description:"Pasiaste zaklocenia i analogowe przeskoki obrazu.",category:"retro",tags:["vhs","static","retro","glitch"],defaultSettings:{...oe,opacity:48,density:55,speed:95,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:hi,streamElementsRendererName:"aeRenderVhsStatic",renderPreview(e,t,a){const n=Y(12,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-vhs-band",r.style.top=`${a()*96}%`,r.style.height=`${2+a()*18}px`,r.style.setProperty("--ae-vhs-duration",`${(.8+a()*3)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(12,e,1)}},ji={definition:ce({id:"solar-flare",name:"Solar Flare",description:"Pomarańczowe luki i rozblyski przypominajace protuberancje sloneczne.",category:"solar",tags:["solar","flare","sun","energy"],defaultSettings:{...oe,opacity:70,density:50,speed:60,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:gi,streamElementsRendererName:"aeRenderSolarFlare",renderPreview(e,t,a){const n=Y(11,t,1),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-solar-flare";const o=55+a()*150;r.style.left=`${a()*92}%`,r.style.top=`${a()*88}%`,r.style.width=`${o}px`,r.style.height=`${o*(.45+a()*.45)}px`,r.style.setProperty("--ae-solar-duration",`${(6+a()*8)/s}s`),r.style.animationDelay=`${-a()*9}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(11,e,1)}},_i=`
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
`.trim(),$i=`
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
`.trim(),Ri=`
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
`.trim(),Ii=`
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
`.trim(),Ai=`
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
`.trim(),Ni=`
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
`.trim(),Li=`
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
`.trim(),Di=`
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
`.trim(),Ti={definition:ce({id:"scanlines-plus",name:"Scanlines Plus",description:"Ruchome, swietlne linie przypominajace skanowanie obrazu.",category:"tech",tags:["scanlines","screen","tech","scanner"],defaultSettings:{...oe,opacity:58,density:52,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:_i,streamElementsRendererName:"aeRenderScanlinesPlus",renderPreview(e,t,a){const n=Y(12,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-scanline-plus",r.style.top=`${a()*100}%`,r.style.setProperty("--ae-scanline-h",`${1+a()*3}px`),r.style.setProperty("--ae-scanline-duration",`${(2.4+a()*3.8)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(12,e,3)}},Oi={definition:ce({id:"equalizer-bars",name:"Equalizer Bars",description:"Pulsujace slupki jak w wizualizerze audio.",category:"tech",tags:["audio","equalizer","bars","music"],defaultSettings:{...oe,opacity:76,density:62,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:$i,streamElementsRendererName:"aeRenderEqualizerBars",renderPreview(e,t,a){const n=Y(22,t,6),s=Math.max(.1,t.speed/100),i=100/n;for(let r=0;r<n;r++){const o=document.createElement("span");o.className="ae-eq-bar",o.style.left=`${r*i+i*.18}%`,o.style.width=`${Math.max(1.2,i*.64)}%`,o.style.height=`${18+a()*70}%`,o.style.setProperty("--ae-eq-duration",`${(.5+a()*1.4)/s}s`),o.style.animationDelay=`${-a()*2}s`,e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(22,e,6)}},qi={definition:ce({id:"hud-grid",name:"HUD Grid",description:"Taktyczna siatka i delikatna warstwa interfejsu.",category:"tech",tags:["hud","grid","ui","tech"],defaultSettings:{...oe,opacity:48,density:60,speed:70,blendMode:"screen"},performanceCost:1,requiresJavaScript:!0}),css:Ri,streamElementsRendererName:"aeRenderHudGrid",renderPreview(e,t){const a=document.createElement("span");a.className="ae-hud-grid";const n=26+(140-Math.max(20,t.density))/2.2,s=Math.max(.1,t.speed/100);a.style.setProperty("--ae-grid-step",`${n}px`),a.style.setProperty("--ae-grid-duration",`${12/s}s`),e.appendChild(a)},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(){return 1}},Fi={definition:ce({id:"floating-symbols",name:"Floating Symbols",description:"Magiczne symbole unoszace sie ku gorze.",category:"fantasy",tags:["symbols","magic","fantasy","arcane"],defaultSettings:{...oe,opacity:72,density:54,speed:78,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ii,streamElementsRendererName:"aeRenderFloatingSymbols",renderPreview(e,t,a){const n=["✦","✧","✶","✺","❖","☽","☼"],s=Y(18,t,4),i=Math.max(.1,t.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");o.className="ae-floating-symbol",o.textContent=n[Math.floor(a()*n.length)]??"✦",o.style.left=`${a()*100}%`,o.style.fontSize=`${18+a()*34}px`,o.style.setProperty("--ae-symbol-duration",`${(6+a()*8)/i}s`),o.style.animationDelay=`${-a()*8}s`,e.appendChild(o)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(18,e,4)}},Bi={definition:ce({id:"smoke-wisps",name:"Smoke Wisps",description:"Miekkie smugi dymu unoszace sie na ekranie.",category:"cinematic",tags:["smoke","fog","mist","cinematic"],defaultSettings:{...oe,opacity:50,density:48,speed:68,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ai,streamElementsRendererName:"aeRenderSmokeWisps",renderPreview(e,t,a){const n=Y(14,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-smoke-wisp";const o=70+a()*120;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o*(.65+a()*.3)}px`,r.style.setProperty("--ae-smoke-duration",`${(6+a()*7)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(14,e,3)}},Wi={definition:ce({id:"electric-arcs",name:"Electric Arcs",description:"Migajace luki energii i wyadowania elektryczne.",category:"energy",tags:["electric","arcs","energy","lightning"],defaultSettings:{...oe,opacity:82,density:55,speed:110,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Ni,streamElementsRendererName:"aeRenderElectricArcs",renderPreview(e,t,a){const n=Y(12,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-electric-arc",r.style.left=`${a()*86}%`,r.style.top=`${a()*86}%`,r.style.width=`${70+a()*180}px`,r.style.setProperty("--ae-arc-angle",`${(-40+a()*80).toFixed(2)}deg`),r.style.setProperty("--ae-arc-duration",`${(.8+a()*1.8)/s}s`),r.style.animationDelay=`${-a()*3}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(12,e,3)}},Ui={definition:ce({id:"snow-burst",name:"Snow Burst",description:"Gestszy, bardziej dekoracyjny opad sniegu.",category:"weather",tags:["snow","winter","cold","flakes"],defaultSettings:{...oe,opacity:72,density:68,speed:72,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Li,streamElementsRendererName:"aeRenderSnowBurst",renderPreview(e,t,a){const n=Y(36,t,8),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-snow-burst";const o=4+a()*10;r.style.left=`${a()*100}%`,r.style.width=`${o}px`,r.style.height=`${o}px`,r.style.setProperty("--ae-snow-duration",`${(4.8+a()*6.2)/s}s`),r.style.animationDelay=`${-a()*8}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(36,e,8)}},Xi={definition:ce({id:"meteor-shower",name:"Meteor Shower",description:"Ukozne smugi meteorow przecinajace ekran.",category:"cosmic",tags:["meteor","space","streak","comet"],defaultSettings:{...oe,opacity:78,density:42,speed:100,blendMode:"screen"},performanceCost:2,requiresJavaScript:!0}),css:Di,streamElementsRendererName:"aeRenderMeteorShower",renderPreview(e,t,a){const n=Y(14,t,3),s=Math.max(.1,t.speed/100);for(let i=0;i<n;i++){const r=document.createElement("span");r.className="ae-meteor",r.style.left=`${-12+a()*78}%`,r.style.top=`${-18+a()*24}%`,r.style.setProperty("--ae-meteor-size",`${70+a()*180}px`),r.style.setProperty("--ae-meteor-duration",`${(1.8+a()*3)/s}s`),r.style.animationDelay=`${-a()*4}s`,e.appendChild(r)}},streamElementsRendererSource:`
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
`.trim(),estimateDomNodes(e){return Y(14,e,3)}},Zi=[ds,ps,us,fs,ms,ys,hs,gs,bs,Ps,Cs,js,_s,$s,Rs,Is,As,Hs,Ys,Gs,Js,Vs,Ks,ei,ti,ai,ni,ri,si,bi,wi,ki,vi,xi,zi,Si,Mi,Ei,Pi,Ci,ji,Ti,Oi,qi,Fi,Bi,Wi,Ui,Xi],Hi={opacity:100,scale:100,x:0,y:0,rotation:0,blur:0,brightness:100,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},Yi={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},Gi=[{id:"wireframe-cube",name:"Wireframe Cube",description:"Pseudo-3D wireframe cubes rotating through the scene.",category:"tech",tags:["cube","3d","wireframe","geometry","cyber"],kind:"box",count:9,cost:2,opacity:72,density:55,speed:80,intensity:75},{id:"polyhedron",name:"Polyhedron",description:"Luminous polygon forms with pseudo-depth.",category:"abstract",tags:["polyhedron","polygon","3d","geometry"],kind:"box",count:12,cost:2,opacity:72,density:58,speed:70,intensity:70},{id:"orbiting-core",name:"Orbiting Core",description:"Energy cores with orbit-like rings.",category:"energy",tags:["orbit","core","energy","atom"],kind:"ring",count:8,cost:2,opacity:82,density:48,speed:90,intensity:80},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspective neon frames flying toward the viewer.",category:"retro",tags:["tunnel","neon","synthwave","perspective"],kind:"box",count:18,cost:2,opacity:74,density:70,speed:110,intensity:85},{id:"fractal-rings",name:"Fractal Rings",description:"Nested luminous rings create recursive motion.",category:"abstract",tags:["rings","fractal","recursive","geometry"],kind:"ring",count:16,cost:2,opacity:70,density:66,speed:75,intensity:75},{id:"particle-vortex",name:"Particle Vortex",description:"Particles spiral around a dynamic center.",category:"energy",tags:["vortex","particles","spiral","energy"],kind:"dot",count:58,cost:3,opacity:78,density:62,speed:105,intensity:85},{id:"liquid-blobs",name:"Liquid Blobs",description:"Organic glowing blobs with fluid deformation.",category:"abstract",tags:["liquid","blob","organic","fluid"],kind:"blob",count:15,cost:3,opacity:62,density:52,speed:55,intensity:80},{id:"cell-division",name:"Cell Division",description:"Seeded cells pulse and visually split into colonies.",category:"other",tags:["cell","biology","division","evolution"],kind:"cell",count:32,cost:3,opacity:72,density:58,speed:75,intensity:85},{id:"growing-vines",name:"Growing Vines",description:"Procedural-looking luminous branches grow across the frame.",category:"botanical",tags:["vine","plant","growth","branch"],kind:"line",count:28,cost:3,opacity:72,density:55,speed:65,intensity:85},{id:"constellation-network",name:"Constellation Network",description:"Glowing nodes connected by constellation-like links.",category:"cosmic",tags:["constellation","network","stars","nodes"],kind:"dot",count:40,cost:3,opacity:64,density:58,speed:45,intensity:70},{id:"shockwave-bursts",name:"Shockwave Bursts",description:"Seeded shockwave circles expand through the scene.",category:"energy",tags:["shockwave","burst","pulse","impact"],kind:"ring",count:14,cost:2,opacity:76,density:48,speed:95,intensity:90},{id:"data-nodes",name:"Data Nodes",description:"Technical nodes pulse along short data links.",category:"sci-fi",tags:["data","nodes","hud","network"],kind:"line",count:34,cost:2,opacity:68,density:60,speed:80,intensity:72},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Seeded stars rotate in a wide spiral galaxy.",category:"cosmic",tags:["galaxy","spiral","stars","space"],kind:"dot",count:80,cost:3,opacity:78,density:66,speed:55,intensity:88},{id:"recursive-squares",name:"Recursive Squares",description:"Nested squares create an infinite-zoom illusion.",category:"abstract",tags:["recursive","squares","infinite","zoom"],kind:"box",count:22,cost:2,opacity:72,density:72,speed:75,intensity:88},{id:"dna-helix",name:"DNA Helix",description:"A pseudo-3D double helix made from luminous nodes.",category:"sci-fi",tags:["dna","helix","science","biology"],kind:"helix",count:42,cost:2,opacity:76,density:68,speed:70,intensity:78},{id:"floating-cubes",name:"Floating Cubes",description:"A field of luminous pseudo-3D cubes drifting in space.",category:"tech",tags:["cube","3d","floating","geometry"],kind:"box",count:24,cost:3,opacity:68,density:58,speed:60,intensity:74}],Ji=`
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
`.trim();function cn(e,t){return Math.max(1,Math.round(e.count*t.density/100))}function Vi(e){return"aeRenderPack06"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function Ki(e,t,a,n,s){const i=Math.max(.1,a.speed/100);e.className=`ae-p06-node ae-p06-${s}`,e.style.setProperty("--i",String(t)),e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",s==="helix"?`${5+t%42*2.15}%`:`${n()*100}%`),e.style.setProperty("--size",`${12+n()*70}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--duration",`${(2.8+n()*7)/i}s`),e.style.setProperty("--power",String(a.intensity/100))}function Qi(e,t){return`
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
`.trim()}function eo(e){const t=Vi(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...Hi,opacity:e.opacity,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:Yi,performanceCost:e.cost,requiresJavaScript:!0},css:Ji,streamElementsRendererName:t,renderPreview(a,n,s){const i=cn(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");Ki(o,r,n,s,e.kind),a.appendChild(o)}},streamElementsRendererSource:Qi(e,t),estimateDomNodes(a){return cn(e,a)}}}const to=Gi.map(eo),ao={opacity:76,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:65,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:85},no={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},ro=[{id:"fireworks",name:"Fireworks",description:"Promieniste wybuchy fajerwerków do zwycięstw i celebracji.",category:"cinematic",tags:["fireworks","celebration","victory","sparks"],kind:"fireworks",count:10,cost:3},{id:"radar-sweep",name:"Radar Sweep",description:"Obracające się skanery radarowe z technicznym glow.",category:"tech",tags:["radar","scanner","hud","tactical"],kind:"radar",count:4,cost:2},{id:"warp-speed",name:"Warp Speed",description:"Gwiezdne smugi rozchodzące się od centrum jak skok w nadprzestrzeń.",category:"cosmic",tags:["warp","hyperspace","stars","speed"],kind:"warp",count:70,cost:3},{id:"hex-pulse",name:"Hex Pulse",description:"Pulsująca siatka heksagonalnych pól energii.",category:"sci-fi",tags:["hex","grid","pulse","shield"],kind:"hex",count:42,cost:2},{id:"circuit-traces",name:"Circuit Traces",description:"Świecące ścieżki obwodów z przesuwającymi się impulsami.",category:"tech",tags:["circuit","pcb","data","lines"],kind:"circuit",count:34,cost:2},{id:"light-leaks",name:"Light Leaks",description:"Miękkie filmowe rozbłyski i przecieki światła.",category:"cinematic",tags:["light","leak","lens","film","glow"],kind:"leaks",count:8,cost:2},{id:"gravity-well",name:"Gravity Well",description:"Cząstki zasysane po orbitach do jasnego centrum.",category:"cosmic",tags:["gravity","black hole","orbit","vortex"],kind:"gravity",count:56,cost:3},{id:"pixel-storm",name:"Pixel Storm",description:"Cyfrowa burza pikseli przecinająca scenę po skosie.",category:"retro",tags:["pixel","storm","digital","glitch"],kind:"pixels",count:62,cost:3}],so=`
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
`.trim();function Wn(e,t){return Math.max(1,Math.round(e.count*t.density/100))}function Un(e){return"aeRenderPolish02"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function Xn(e){return`ae-x2 ae-x2-${e}`}function io(e,t,a,n){const s=Wn(e,a),i=Math.max(.1,a.speed/100);for(let r=0;r<s;r++){const o=document.createElement("span");if(o.className=Xn(e.kind),o.style.setProperty("--x",`${n()*100}%`),o.style.setProperty("--y",`${n()*100}%`),o.style.setProperty("--s",`${14+n()*82}px`),o.style.setProperty("--a",`${n()*360}deg`),o.style.setProperty("--p",String(a.intensity/100)),o.style.setProperty("--delay",`${-n()*8}s`),o.style.setProperty("--d",`${(2.5+n()*7)/i}s`),o.style.setProperty("--r",`${55+n()*350}px`),e.kind==="hex"){const c=r%8,d=Math.floor(r/8);o.style.setProperty("--x",`${8+c*12.2+d%2*6.1}%`),o.style.setProperty("--y",`${10+d*14.2}%`),o.style.setProperty("--s",`${32+a.intensity*.12}px`)}e.kind==="circuit"&&(o.style.setProperty("--s",`${60+n()*175}px`),o.style.setProperty("--a",`${Math.round(n()*3)*90}deg`)),e.kind==="leaks"&&o.style.setProperty("--s",`${90+n()*160}px`),e.kind==="pixels"&&(o.style.setProperty("--s",`${3+n()*12}px`),o.style.setProperty("--x",`${-12+n()*45}%`),o.style.setProperty("--y",`${-18+n()*78}%`)),e.kind==="radar"&&o.style.setProperty("--s",`${180+n()*320}px`),t.appendChild(o)}}function oo(e){return`
function ${Un(e.id)}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const speed = Math.max(.1, s.speed / 100);
  const total = Math.max(1, Math.round(${e.count} * (s.density / 100)));

  for (let i = 0; i < total; i++) {
    const node = document.createElement("span");
    node.className = ${JSON.stringify(Xn(e.kind))};
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
`.trim()}function co(e){return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...ao},capabilities:no,performanceCost:e.cost,requiresJavaScript:!0},css:so,streamElementsRendererName:Un(e.id),renderPreview(t,a,n){io(e,t,a,n)},streamElementsRendererSource:oo(e),estimateDomNodes(t){return Wn(e,t)}}}const lo=ro.map(co),tt={opacity:84,scale:100,x:0,y:0,rotation:0,blur:0,brightness:120,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},po={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},uo=[{id:"gears",name:"Gears",description:"Steampunkowe koła zębate z czytelniejszymi zębami i kontr-rotacją.",category:"steampunk",tags:["gear","cogs","steampunk","mechanical"],kind:"gear",count:10,cost:2,opacity:80,density:70,speed:90,intensity:90,brightness:118},{id:"comets",name:"Comets",description:"Jasne komety z długim ogonem lecące po przekątnej.",category:"cosmic",tags:["comet","tail","space","shooting star"],kind:"comet",count:22,cost:2,opacity:88,density:72,speed:110,intensity:105,brightness:132},{id:"fireworks",name:"Fireworks",description:"Pełniejsze wybuchy fajerwerków z wieloma promieniami.",category:"cinematic",tags:["fireworks","spark","celebration","burst"],kind:"firework",count:12,cost:3,opacity:88,density:66,speed:95,intensity:110,brightness:135},{id:"lightning-storm",name:"Lightning Storm",description:"Błyskawice z mocniejszym rozgałęzieniem i flashami.",category:"weather",tags:["lightning","storm","electric","thunder"],kind:"lightning",count:14,cost:3,opacity:88,density:62,speed:108,intensity:118,brightness:138},{id:"liquid-blobs",name:"Liquid Blobs",description:"Bardziej organiczne, płynne metaballe o miękkim ruchu.",category:"abstract",tags:["liquid","blob","metaball","organic"],kind:"blob",count:16,cost:3,opacity:76,density:70,speed:70,intensity:115,brightness:120},{id:"particle-vortex",name:"Particle Vortex",description:"Głębszy wir cząstek z mocniejszą spiralą i środkiem zasysania.",category:"energy",tags:["vortex","spiral","particles","swirl"],kind:"vortex",count:96,cost:3,opacity:82,density:80,speed:110,intensity:120,brightness:130},{id:"portal-rings",name:"Portal Rings",description:"Pulsujące portalowe pierścienie z falowaniem i poświatą.",category:"sci-fi",tags:["portal","rings","gateway","pulse"],kind:"portal",count:8,cost:2,opacity:82,density:72,speed:92,intensity:112,brightness:128},{id:"radar-sweep",name:"Radar Sweep",description:"Czytelny radar ze stożkiem skanu i pingami kontaktów.",category:"tech",tags:["radar","scan","hud","sweep"],kind:"radar",count:4,cost:2,opacity:82,density:60,speed:86,intensity:96,brightness:125},{id:"glitch-blocks",name:"Glitch Blocks",description:"Mocniej zróżnicowane bloki glitch z przesunięciami RGB.",category:"tech",tags:["glitch","blocks","digital","noise"],kind:"glitch",count:34,cost:2,opacity:72,density:78,speed:112,intensity:112,brightness:122},{id:"gravity-well",name:"Gravity Well",description:"Lejek grawitacyjny z orbitującym pyłem i jasnym rdzeniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:80,cost:3,opacity:82,density:76,speed:96,intensity:118,brightness:130},{id:"hex-grid",name:"Hex Grid",description:"Gęstsza siatka sześciokątów z pulsem i zanikaniem.",category:"sci-fi",tags:["hex","grid","honeycomb","hud"],kind:"hex",count:84,cost:2,opacity:68,density:76,speed:72,intensity:100,brightness:118},{id:"floating-cubes",name:"Floating Cubes",description:"Bardziej przestrzenne sześciany z lekką pseudo-głębią.",category:"tech",tags:["cube","floating","3d","geometry"],kind:"cube",count:32,cost:3,opacity:76,density:76,speed:68,intensity:98,brightness:118},{id:"prism-drift",name:"Prism Drift",description:"Lśniące pryzmaty dryfujące przez scenę.",category:"abstract",tags:["prism","crystal","glass","drift"],kind:"prism",count:26,cost:2,opacity:78,density:72,speed:70,intensity:102,brightness:126},{id:"neon-shards",name:"Neon Shards",description:"Neonowe odłamki z szybkim dryfem i smugą.",category:"retro",tags:["shards","neon","fragments","synthwave"],kind:"shards",count:42,cost:2,opacity:78,density:80,speed:118,intensity:110,brightness:132},{id:"plasma-storm",name:"Plasma Storm",description:"Burza plazmowych smug z turbulentnym ruchem.",category:"energy",tags:["plasma","storm","energy","embers"],kind:"storm",count:54,cost:3,opacity:80,density:82,speed:104,intensity:118,brightness:132},{id:"cube-swarm",name:"Cube Swarm",description:"Rój małych kostek przecinających scenę w warstwach.",category:"tech",tags:["cube","swarm","voxels","digital"],kind:"cube",count:64,cost:3,opacity:72,density:86,speed:98,intensity:108,brightness:115}],fo=String.raw`
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
`.trim();function Ta(e){return Math.max(0,Math.min(400,e))}function ln(e,t){return Math.max(1,Math.round(e.count*Ta(t.density)/100))}function mo(e){return"aeRenderPack07"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function yo(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.2,Ta(a.intensity)/100);e.classList.add("ae-p07",`ae-p07-${s.kind}`),e.style.setProperty("--i",String(t)),e.style.setProperty("--power",String(r)),e.style.setProperty("--duration",`${(2.5+n()*6.5)/i}s`),e.style.setProperty("--delay",`${-n()*8}s`),e.style.setProperty("--size",`${16+n()*92}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--easing",s.kind==="glitch"?"steps(2,end)":"linear")}function ho(e,t,a,n,s){yo(e,t,a,n,s);const i=Math.max(.2,Ta(a.intensity)/100),r=`${30+n()*180*i}px`;switch(s.kind){case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*80}%`),e.style.setProperty("--size",`${48+n()*96}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(180+n()*360)}deg`);break;case"comet":e.style.setProperty("--x",`${-8+n()*88}%`),e.style.setProperty("--y",`${-8+n()*42}%`),e.style.setProperty("--angle",`${18+n()*28}deg`),e.style.setProperty("--tx",`${80+n()*45}vw`),e.style.setProperty("--ty",`${50+n()*35}vh`);break;case"firework":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${10+n()*74}%`);break;case"lightning":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${10+n()*20}%`),e.style.setProperty("--duration",`${(1.1+n()*2.8)/Math.max(.3,a.speed/100)}s`);break;case"blob":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${64+n()*130}px`);break;case"vortex":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"portal":e.style.setProperty("--x",`${35+n()*30}%`),e.style.setProperty("--y",`${30+n()*40}%`),e.style.setProperty("--size",`${60+n()*120}px`);break;case"radar":e.style.setProperty("--x",`${18+n()*64}%`),e.style.setProperty("--y",`${18+n()*64}%`),e.style.setProperty("--size",`${120+n()*140}px`);break;case"glitch":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"gravity":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--orbit",r);break;case"hex":e.style.setProperty("--x",`${4+t%12*8.2}%`),e.style.setProperty("--y",`${8+Math.floor(t/12)*10.2}%`),e.style.setProperty("--size",`${22+n()*28}px`);break;case"cube":e.style.setProperty("--x",`${4+n()*90}%`),e.style.setProperty("--y",`${6+n()*86}%`),e.style.setProperty("--size",`${18+n()*58}px`);break;case"prism":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${30+n()*52}px`);break;case"shards":e.style.setProperty("--x",`${n()*72}%`),e.style.setProperty("--y",`${n()*92}%`);break;case"storm":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`);break}}function go(e,t){return`
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
`.trim()}function bo(e){const t=mo(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...tt,opacity:e.opacity??tt.opacity,density:e.density??tt.density,speed:e.speed??tt.speed,intensity:e.intensity??tt.intensity,brightness:e.brightness??tt.brightness},capabilities:po,performanceCost:e.cost,requiresJavaScript:!0},css:fo,streamElementsRendererName:t,renderPreview(a,n,s){const i=ln(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");ho(o,r,n,s,e),a.appendChild(o)}},streamElementsRendererSource:go(e,t),estimateDomNodes(a){return ln(e,a)}}}const wo=uo.map(bo),ko={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100},vo={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},xo=[{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Dysk akrecyjny z cząstkami spiralnie wpadającymi do jasnego rdzenia.",category:"cosmic",tags:["black hole","accretion","gravity","singularity","orbit"],kind:"black-hole",count:92,cost:3,density:78,speed:92,intensity:115},{id:"orbital-debris",name:"Orbital Debris",description:"Odłamki krążące po kilku płaszczyznach orbit i głębokościach.",category:"cosmic",tags:["orbit","debris","space","asteroid","satellite"],kind:"debris",count:46,cost:3,density:74,speed:82,intensity:105},{id:"star-tunnel",name:"Star Tunnel",description:"Tunel gwiezdnych smug z mocną perspektywą i ruchem ku kamerze.",category:"cosmic",tags:["stars","tunnel","hyperspace","perspective","warp"],kind:"tunnel",count:86,cost:3,density:76,speed:118,intensity:118},{id:"energy-lattice",name:"Energy Lattice",description:"Pulsująca sieć energetycznych połączeń i węzłów.",category:"sci-fi",tags:["lattice","network","energy","nodes","grid"],kind:"lattice",count:40,cost:3,density:70,speed:78,intensity:102},{id:"target-lock",name:"Target Lock",description:"HUD-owy celownik z pierścieniami, markerami i pulsami namierzania.",category:"tech",tags:["target","lock","hud","reticle","scanner"],kind:"target",count:6,cost:2,density:55,speed:82,intensity:100},{id:"scanner-beams",name:"Scanner Beams",description:"Wielokierunkowe wiązki skanujące scenę z miękką poświatą.",category:"tech",tags:["scanner","beam","laser","scan","hud"],kind:"scanner",count:12,cost:2,density:62,speed:92,intensity:108},{id:"digital-fragments",name:"Digital Fragments",description:"Cyfrowe fragmenty rozpadające się i przeskakujące warstwami.",category:"retro",tags:["digital","fragments","glitch","blocks","data"],kind:"fragments",count:54,cost:3,density:76,speed:110,intensity:108},{id:"pixel-melt",name:"Pixel Melt",description:"Pionowe smugi pikseli spływające jak topiący się cyfrowy obraz.",category:"retro",tags:["pixel","melt","glitch","drip","digital"],kind:"melt",count:62,cost:3,density:78,speed:88,intensity:112},{id:"wireframe-cubes",name:"Wireframe Cubes",description:"Pole czystych drucianych kostek pseudo-3D obracających się w przestrzeni.",category:"tech",tags:["wireframe","cubes","3d","geometry","grid"],kind:"wirecube",count:30,cost:3,density:70,speed:72,intensity:98},{id:"floating-polyhedra",name:"Floating Polyhedra",description:"Dryfujące wielościany o różnych rozmiarach i osi obrotu.",category:"abstract",tags:["polyhedra","geometry","3d","floating","facets"],kind:"poly",count:28,cost:3,density:68,speed:68,intensity:100},{id:"shockwave-rings",name:"Shockwave Rings",description:"Szybkie, warstwowe fale uderzeniowe rozchodzące się z różnych punktów.",category:"energy",tags:["shockwave","rings","impact","pulse","wave"],kind:"shockwave",count:16,cost:2,density:64,speed:112,intensity:115},{id:"electric-web",name:"Electric Web",description:"Sieć krótkich łuków elektrycznych przeskakujących po scenie.",category:"energy",tags:["electric","web","arcs","lightning","network"],kind:"electric",count:34,cost:3,density:72,speed:118,intensity:120},{id:"ribbon-streamers",name:"Ribbon Streamers",description:"Długie kolorowe wstążki płynące falami zamiast drobnych cząstek.",category:"cinematic",tags:["ribbon","streamers","flow","celebration","wave"],kind:"ribbon",count:18,cost:2,density:62,speed:82,intensity:105},{id:"ink-clouds",name:"Ink Clouds",description:"Powolne organiczne chmury przypominające atrament rozlewający się w wodzie.",category:"abstract",tags:["ink","clouds","fluid","organic","smoke"],kind:"ink",count:13,cost:3,density:58,speed:48,intensity:105}],zo=String.raw`
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
`.trim();function Zn(e){return Math.max(0,Math.min(400,e))}function So(e){return"aeRenderPack08"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("")}function dn(e,t){return Math.max(1,Math.round(e.count*Zn(t.density)/100))}function Mo(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.2,Zn(a.intensity)/100);e.className=`ae-p08 ae-p08-${s.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${14+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.4+n()*7)/i}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--orbit",`${40+n()*220*r}px`),(s.kind==="black-hole"||s.kind==="debris"||s.kind==="tunnel")&&(e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%")),s.kind==="target"&&(e.style.setProperty("--x",`${24+n()*52}%`),e.style.setProperty("--y",`${20+n()*58}%`),e.style.setProperty("--size",`${24+n()*60}px`)),s.kind==="scanner"&&(e.style.setProperty("--x",`${-12+n()*24}%`),e.style.setProperty("--y",`${n()*94}%`),e.style.setProperty("--angle",`${-8+n()*16}deg`)),s.kind==="melt"&&(e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${-18+n()*8}%`)),(s.kind==="wirecube"||s.kind==="poly")&&(e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${7+n()*86}%`),e.style.setProperty("--size",`${22+n()*64}px`)),s.kind==="shockwave"&&(e.style.setProperty("--x",`${14+n()*72}%`),e.style.setProperty("--y",`${14+n()*72}%`),e.style.setProperty("--size",`${28+n()*62}px`)),s.kind==="electric"&&(e.style.setProperty("--x",`${4+n()*84}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--duration",`${(.8+n()*2.7)/i}s`)),s.kind==="ribbon"&&(e.style.setProperty("--x",`${-18+n()*18}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--angle",`${-7+n()*14}deg`)),s.kind==="ink"&&(e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${55+n()*120}px`)),s.kind==="lattice"&&e.style.setProperty("--angle",`${Math.round(n()*5)*30}deg`),s.kind==="fragments"&&e.style.setProperty("--duration",`${(.7+n()*2.4)/i}s`),e.style.setProperty("--i",String(t))}function Eo(e,t){return`
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
`.trim()}function Po(e){const t=So(e.id);return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...ko,density:e.density,speed:e.speed,intensity:e.intensity},capabilities:vo,performanceCost:e.cost,requiresJavaScript:!0},css:zo,streamElementsRendererName:t,renderPreview(a,n,s){const i=dn(e,n);for(let r=0;r<i;r++){const o=document.createElement("span");Mo(o,r,n,s,e),a.appendChild(o)}},streamElementsRendererSource:Eo(e,t),estimateDomNodes(a){return dn(e,a)}}}const Co=xo.map(Po),H=(e,t,a,n=100,s=0,i=200,r=1)=>({key:e,label:t,description:a,defaultValue:n,min:s,max:i,step:r,suffix:"%"}),jo=[{id:"fireworks",name:"Fireworks",description:"Wielofazowe fajerwerki: lot, eksplozja, radialne iskry i opadanie.",category:"cinematic",tags:["fireworks","burst","sparks","celebration"],kind:"burst",count:12,cost:4,controls:[H("burstSize","Rozmiar eksplozji","Jak szeroko rozchodzą się iskry."),H("trailLength","Długość iskier","Długość radialnych smug po wybuchu."),H("cadence","Częstotliwość","Jak często pojawiają się kolejne wybuchy.")]},{id:"lightning",name:"Lightning",description:"Duże łamane pioruny z odnogami, błyskiem i krótkim afterglow.",category:"weather",tags:["lightning","bolt","storm","electric"],kind:"bolt",count:8,cost:4,controls:[H("branching","Rozgałęzienie","Ilość i długość bocznych odnóg."),H("boltLength","Długość pioruna","Jak dużą część kadru przecina wyładowanie."),H("flash","Siła błysku","Moc poświaty i impulsu świetlnego.")]},{id:"lightning-storm",name:"Lightning Storm",description:"Burza wielu dużych wyładowań o różnej długości i częstotliwości.",category:"weather",tags:["lightning","storm","thunder","electric"],kind:"storm-bolt",count:14,cost:5,controls:[H("branching","Rozgałęzienie","Gęstość bocznych odnóg wyładowań."),H("stormSpread","Zasięg burzy","Jak szeroko po ekranie pojawiają się wyładowania."),H("flash","Siła błysku","Moc krótkich impulsów świetlnych.")]},{id:"gears",name:"Gears",description:"Czytelne koła zębate z piastą, zębami i kontr-rotacją.",category:"steampunk",tags:["gears","cogs","mechanical","steampunk"],kind:"gear",count:11,cost:3,controls:[H("teeth","Liczba zębów","Wrażenie drobniejszych lub masywniejszych zębów."),H("spacing","Rozstaw","Odległość między kołami."),H("mechanicalChaos","Chaos mechanizmu","Różnica rozmiarów i prędkości obrotu.")]},{id:"liquid-blobs",name:"Liquid Blobs",description:"Płynne organiczne metaballe, które rozciągają się i wizualnie łączą.",category:"abstract",tags:["liquid","metaball","goo","organic"],kind:"liquid",count:18,cost:4,controls:[H("viscosity","Lepkość","Jak wolno i ciężko poruszają się kształty."),H("blobSize","Rozmiar blobów","Średni rozmiar płynnych form."),H("merge","Łączenie","Jak mocno formy wizualnie stapiają się ze sobą.")]},{id:"gravity-well",name:"Gravity Well",description:"Czytelna studnia grawitacyjna z ciemnym rdzeniem i spiralnym zasysaniem.",category:"cosmic",tags:["gravity","well","singularity","orbit"],kind:"gravity",count:90,cost:4,controls:[H("pull","Siła zasysania","Jak gwałtownie cząstki skręcają do środka."),H("orbitSpread","Promień orbit","Rozpiętość spiral wokół centrum."),H("coreSize","Wielkość rdzenia","Rozmiar ciemnego centrum studni.")]},{id:"black-hole-accretion",name:"Black Hole Accretion",description:"Czarna dziura z jasnym spłaszczonym dyskiem akrecyjnym i pyłem.",category:"cosmic",tags:["black hole","accretion","singularity","disk"],kind:"black-hole",count:104,cost:5,controls:[H("discWidth","Szerokość dysku","Rozpiętość dysku akrecyjnego."),H("pull","Siła zasysania","Tempo opadania cząstek do centrum."),H("glow","Blask dysku","Jasność i poświata gorącego materiału.")]},{id:"electric-web",name:"Electric Web",description:"Sieć punktów połączonych przeskakującymi łukami elektrycznymi.",category:"energy",tags:["electric","web","nodes","arcs"],kind:"web",count:34,cost:4,controls:[H("connections","Połączenia","Gęstość elektrycznej sieci."),H("reach","Zasięg łuków","Długość przeskoków między punktami."),H("jitter","Niestabilność","Jak agresywnie łuki migoczą i przeskakują.")]},{id:"electric-arcs",name:"Electric Arcs",description:"Długie łamane łuki elektryczne z nieregularnym migotaniem.",category:"energy",tags:["electric","arcs","plasma","voltage"],kind:"arc",count:24,cost:4,controls:[H("arcLength","Długość łuków","Długość pojedynczych wyładowań."),H("jitter","Poszarpanie","Stopień nieregularności kształtu."),H("pulse","Pulsowanie","Częstotliwość zaników i ponownych zapłonów.")]},{id:"spiral-galaxy",name:"Spiral Galaxy",description:"Wyraźna galaktyka spiralna z ramionami i jasnym centrum.",category:"cosmic",tags:["galaxy","spiral","stars","cosmic"],kind:"galaxy",count:150,cost:4,controls:[H("armTightness","Skręt ramion","Jak ciasno ramiona owijają się wokół centrum."),H("coreGlow","Jasność jądra","Siła centralnej poświaty."),H("armSpread","Rozpiętość","Jak szeroko rozchodzą się ramiona galaktyki.")]},{id:"growing-vines",name:"Growing Vines",description:"Pnącza wyrastające z punktów, skręcające i tworzące odnogi.",category:"botanical",tags:["vines","plants","growth","branches"],kind:"vine",count:22,cost:3,controls:[H("curl","Skręt pnączy","Jak mocno łodygi wiją się podczas wzrostu."),H("branches","Rozgałęzienia","Ilość bocznych odnóg."),H("growth","Tempo wzrostu","Długość i szybkość rozwijania się pnączy.")]},{id:"neon-tunnel",name:"Neon Tunnel",description:"Perspektywiczny tunel neonowych ramek z wyraźnym punktem zbiegu.",category:"retro",tags:["neon","tunnel","perspective","synthwave"],kind:"tunnel",count:24,cost:3,controls:[H("depth","Głębia tunelu","Jak mocna jest perspektywa i skala kolejnych ramek."),H("spacing","Rozstaw ramek","Odległość między kolejnymi segmentami."),H("pulse","Puls neonu","Siła pulsowania i poświaty.")]},{id:"scanlines",name:"Scanlines",description:"Czytelne linie skanowania z delikatnym dryfem i migotaniem.",category:"retro",tags:["scanlines","crt","retro","screen"],kind:"scanline",count:90,cost:2,opacity:62,density:78,speed:68,intensity:92,brightness:125,controls:[H("lineGap","Odstęp linii","Gęstość poziomych linii."),H("flicker","Migotanie","Siła nieregularnego CRT flickeru."),H("drift","Dryf","Prędkość przesuwania całej siatki.")]},{id:"laser-grid",name:"Laser Grid",description:"Jasna perspektywiczna siatka laserowa z pulsującymi liniami.",category:"sci-fi",tags:["laser","grid","perspective","sci-fi"],kind:"laser-grid",count:42,cost:3,opacity:76,density:72,speed:82,intensity:110,brightness:145,controls:[H("perspective","Perspektywa","Jak mocno siatka zbiega się ku horyzontowi."),H("spacing","Rozstaw","Odległość pomiędzy liniami."),H("pulse","Puls lasera","Jasność i rytm pulsowania.")]},{id:"vhs-static",name:"VHS Static",description:"Widoczne analogowe zakłócenia z trackingiem, pasami i szumem.",category:"retro",tags:["vhs","static","noise","tracking"],kind:"vhs",count:72,cost:3,opacity:68,density:76,speed:120,intensity:110,brightness:130,controls:[H("noise","Szum","Ilość drobnych analogowych zakłóceń."),H("tracking","Tracking","Siła poziomych pasów i przesunięć."),H("jitter","Drżenie obrazu","Nieregularne przeskoki i jitter.")]},{id:"hud-grid",name:"HUD Grid",description:"Czytelna techniczna siatka HUD z osiami, skanem i pulsującymi punktami.",category:"tech",tags:["hud","grid","scanner","interface"],kind:"hud",count:50,cost:3,opacity:72,density:70,speed:74,intensity:105,brightness:138,controls:[H("gridSpacing","Rozstaw siatki","Wielkość pól technologicznej siatki."),H("scan","Skanowanie","Siła przesuwającej się wiązki skanu."),H("markers","Znaczniki","Widoczność punktów i markerów HUD.")]},{id:"city-lights",name:"City Lights",description:"Warstwowy nocny skyline z oknami, parallaxem i migotaniem.",category:"urban",tags:["city","lights","skyline","windows"],kind:"city",count:46,cost:3,opacity:82,density:74,speed:46,intensity:100,brightness:135,controls:[H("skyline","Wysokość zabudowy","Średnia wysokość budynków."),H("parallax","Parallax","Różnica prędkości między planami."),H("windows","Światła okien","Gęstość i migotanie okien.")]},{id:"embers",name:"Embers",description:"Czytelniejsze żarzące iskry z unoszeniem, smugą i wygaszaniem.",category:"cinematic",tags:["embers","fire","sparks","ash"],kind:"ember",count:58,cost:3,opacity:82,density:72,speed:82,intensity:110,brightness:145,controls:[H("lift","Siła unoszenia","Jak szybko iskry unoszą się ku górze."),H("trail","Długość smugi","Jak długo widoczny jest ślad żaru."),H("flicker","Migotanie","Nieregularność jasności iskier.")]},{id:"dust-motes",name:"Dust Motes",description:"Wyraźniejszy pył w świetle z różną głębią, rozmiarem i dryfem.",category:"cinematic",tags:["dust","motes","cinematic","ambient"],kind:"dust",count:78,cost:2,opacity:66,density:72,speed:48,intensity:92,brightness:125,controls:[H("depth","Głębia","Różnica skali i rozmycia między planami."),H("drift","Dryf","Siła spokojnego ruchu cząstek."),H("sparkle","Połysk","Jak często drobiny łapią światło.")]},{id:"magnetic-field",name:"Magnetic Field",description:"Łuki pola magnetycznego oplatające dwa bieguny.",category:"sci-fi",tags:["magnetic","field","lines","physics"],kind:"magnetic",count:36,cost:3,controls:[H("curvature","Krzywizna pola","Jak mocno linie wyginają się między biegunami."),H("poleDistance","Rozstaw biegunów","Odległość między źródłami pola."),H("flow","Przepływ","Szybkość świetlnych impulsów po liniach.")]},{id:"volumetric-rays",name:"Volumetric Rays",description:"Miękkie wolumetryczne promienie światła przecinające scenę.",category:"cinematic",tags:["rays","god rays","light","volumetric"],kind:"rays",count:18,cost:3,opacity:58,density:56,speed:42,intensity:105,brightness:135,controls:[H("spread","Rozwarcie","Szerokość wachlarza promieni."),H("softness","Miękkość","Stopień rozmycia krawędzi światła."),H("sweep","Ruch źródła","Jak mocno promienie przesuwają się po scenie.")]},{id:"plasma-filaments",name:"Plasma Filaments",description:"Falujące włókna plazmy przypominające aktywne pole energetyczne.",category:"energy",tags:["plasma","filaments","energy","electric"],kind:"filament",count:34,cost:4,controls:[H("curl","Skręt włókien","Jak mocno linie plazmy się wiją."),H("length","Długość","Średnia długość energetycznych włókien."),H("heat","Temperatura","Jasność i intensywność świecenia.")]},{id:"ripple-field",name:"Ripple Field",description:"Wiele nakładających się fal powierzchniowych o różnych centrach.",category:"abstract",tags:["ripple","waves","rings","water"],kind:"ripple",count:18,cost:3,controls:[H("radius","Promień fal","Maksymalny zasięg pojedynczej fali."),H("frequency","Częstotliwość","Jak często powstają nowe fale."),H("distortion","Nieregularność","Jak mocno fale odbiegają od idealnych okręgów.")]},{id:"bioluminescent-plankton",name:"Bioluminescent Plankton",description:"Organiczne świecące drobiny reagujące falami i lokalnymi rozbłyskami.",category:"botanical",tags:["plankton","bioluminescent","ocean","organic"],kind:"plankton",count:82,cost:3,controls:[H("current","Prąd wody","Siła wspólnego dryfu cząstek."),H("flash","Bioluminescencja","Siła krótkich organicznych rozbłysków."),H("swarm","Skupiska","Jak mocno plankton tworzy lokalne grupy.")]},{id:"glass-shards",name:"Glass Shards",description:"Odłamki szkła z obrotem, refleksami i różnymi planami głębi.",category:"cinematic",tags:["glass","shards","fragments","reflection"],kind:"shards",count:38,cost:3,controls:[H("shardSize","Rozmiar odłamków","Średni rozmiar kawałków szkła."),H("spin","Obrót","Prędkość rotacji odłamków."),H("reflection","Refleksy","Siła błysków na krawędziach szkła.")]},{id:"aurora-curtains",name:"Aurora Curtains",description:"Warstwowe pionowe kurtyny zorzy z płynną falą i głębią.",category:"cosmic",tags:["aurora","curtains","sky","waves"],kind:"aurora",count:16,cost:4,controls:[H("curtainWidth","Szerokość kurtyn","Jak szerokie są pasma zorzy."),H("wave","Falowanie","Amplituda płynnego ruchu kurtyn."),H("depth","Głębia","Różnica jasności i skali pomiędzy warstwami.")]},{id:"data-streams",name:"Data Streams",description:"Warstwowe kanały danych poruszające się niezależnie z pakietami i przerwami.",category:"tech",tags:["data","streams","packets","network"],kind:"data",count:48,cost:3,controls:[H("packetLength","Długość pakietów","Długość poruszających się segmentów."),H("lanes","Liczba kanałów","Wrażenie gęstości równoległych strumieni."),H("dropout","Przerwy sygnału","Jak często dane znikają i wracają.")]},{id:"orbital-rings",name:"Orbital Rings",description:"Kilka przecinających się orbit z punktami poruszającymi się po różnych płaszczyznach.",category:"cosmic",tags:["orbit","rings","planet","atomic"],kind:"orbit-rings",count:24,cost:3,controls:[H("tilt","Nachylenie orbit","Różnica płaszczyzn kolejnych pierścieni."),H("radius","Promień orbit","Rozmiar całego układu."),H("satellites","Satelity","Widoczność i liczba punktów na orbitach.")]},{id:"prism-caustics",name:"Prism Caustics",description:"Miękkie załamania światła i tęczowe kaustyki przesuwające się po scenie.",category:"abstract",tags:["prism","caustics","light","refraction"],kind:"caustics",count:20,cost:4,controls:[H("spread","Rozszczepienie","Szerokość kolorystycznego rozdzielenia światła."),H("softness","Miękkość","Rozmycie i płynność kaustyk."),H("motion","Ruch","Tempo przesuwania świetlnych plam.")]},{id:"ember-ribbons",name:"Ember Ribbons",description:"Długie ogniste wstęgi z iskrami i zanikającym ogonem.",category:"energy",tags:["embers","ribbons","fire","trails"],kind:"ember-ribbon",count:24,cost:4,controls:[H("trail","Długość ogona","Długość płonącej wstęgi."),H("curl","Skręt","Jak mocno wstęga faluje i zakręca."),H("sparks","Iskry","Widoczność drobnych iskier wokół wstęgi.")]},{id:"fractal-branches",name:"Fractal Branches",description:"Rosnące geometryczne rozgałęzienia przypominające fraktalne drzewo.",category:"abstract",tags:["fractal","branches","recursive","geometry"],kind:"fractal",count:32,cost:4,controls:[H("branching","Rozgałęzienie","Ilość kolejnych odnóg."),H("angle","Kąt gałęzi","Rozwarcie struktury fraktalnej."),H("growth","Wzrost","Tempo rozwijania kolejnych poziomów.")]}],at={opacity:82,scale:100,x:0,y:0,rotation:0,blur:0,brightness:125,hue:0,color:"#78d8ff",colorize:!1,density:100,blendMode:"screen",area:"full",zIndex:20,speed:100,intensity:100,custom:{}},_o={opacity:!0,position:!0,scale:!0,rotation:!0,blur:!0,brightness:!0,hue:!0,density:!0,blendMode:!0,area:!0,layer:!0,speed:!0,color:!0,intensity:!0},$o=String.raw`.ae-p09{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);pointer-events:none;will-change:transform,opacity,filter;animation-duration:var(--duration);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear}.ae-p09::before,.ae-p09::after{pointer-events:none}
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
@keyframes ae09-burst{0%,14%{transform:translate(-50%,180px) scale(.05);opacity:0}18%{opacity:1}62%{transform:translate(-50%,-50%) scale(calc(.8 + .9*var(--c1)));opacity:1}100%{transform:translate(-50%,-50%) scale(calc(1.2 + 1.5*var(--c1)));opacity:0}}@keyframes ae09-bolt{0%,100%{transform:translate(-50%,-10%) scaleY(.35);opacity:0}8%{opacity:1}12%{opacity:.18}16%{opacity:1}68%{opacity:.75}100%{transform:translate(-50%,-10%) scaleY(calc(.85 + .45*var(--c2)));opacity:0}}@keyframes ae09-storm{0%,100%{transform:translate(-50%,-5%) scaleY(.28);opacity:0}8%{opacity:1}14%{opacity:.12}20%{opacity:1}74%{opacity:.7}100%{transform:translate(-50%,-5%) scaleY(calc(.95 + .5*var(--c2)));opacity:0}}@keyframes ae09-gear{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(var(--spin))}}@keyframes ae09-liquid{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.82)}50%{transform:translate(calc(-50% + 36px*var(--c1)),calc(-50% - 20px*var(--c1))) rotate(calc(var(--angle) + 160deg)) scale(calc(1 + .25*var(--c2)))}}@keyframes ae09-gravity{0%{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.8);opacity:.2}55%{opacity:1}100%{transform:rotate(calc(var(--angle) + 900deg*var(--c1))) translateX(calc(7px + var(--orbit)*.1)) scale(.05);opacity:0}}@keyframes ae09-electric{0%,100%{transform:rotate(var(--angle)) scaleX(.2);opacity:0}10%{opacity:1}18%{opacity:.15}26%{opacity:.9}58%{transform:rotate(calc(var(--angle) + 9deg*var(--c3))) scaleX(calc(.8 + .3*var(--c2)));opacity:.7}}@keyframes ae09-galaxy{from{transform:rotate(var(--angle)) translateX(var(--orbit)) scale(.6);opacity:.25}50%{opacity:1}to{transform:rotate(calc(var(--angle) + 360deg*var(--c1))) translateX(var(--orbit)) scale(1);opacity:.35}}@keyframes ae09-vine{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.1}20%{opacity:1}to{transform:rotate(calc(var(--angle) + 20deg*var(--c1))) scaleX(calc(.85 + .2*var(--c3)));opacity:.78}}@keyframes ae09-tunnel{from{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.05);opacity:0}18%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 4deg*var(--c3))) scale(calc(2.2 + 2.8*var(--c1)));opacity:0}}@keyframes ae09-scanline{from{transform:translateY(-10vh);opacity:.18}50%{opacity:.7}to{transform:translateY(110vh);opacity:.18}}@keyframes ae09-grid{0%,100%{transform:rotate(var(--angle)) scaleX(.5);opacity:.18}50%{transform:rotate(calc(var(--angle) + 4deg*var(--c1))) scaleX(calc(1 + .3*var(--c3)));opacity:.9}}@keyframes ae09-vhs{0%,100%{transform:translateX(0) skewX(0);opacity:.1}17%{transform:translateX(calc(-16px*var(--c3))) skewX(18deg);opacity:.92}35%{transform:translateX(calc(22px*var(--c3))) skewX(-11deg);opacity:.3}64%{transform:translateX(calc(-20px*var(--c3))) skewX(7deg);opacity:.78}}@keyframes ae09-hud{0%,100%{transform:translate(-50%,-50%) scale(.85);opacity:.18}50%{transform:translate(-50%,-50%) scale(calc(.92 + .12*var(--c2)));opacity:.86}}@keyframes ae09-city{0%,100%{transform:translateX(0);opacity:.88}50%{transform:translateX(calc(-10px*var(--c2)));opacity:1}}@keyframes ae09-ember{from{transform:translate3d(0,25vh,0) scale(.5);opacity:0}12%{opacity:1}to{transform:translate3d(calc(42px*var(--c1)),calc(-115vh*var(--c1)),0) rotate(320deg) scale(.12);opacity:0}}@keyframes ae09-dust{0%,100%{transform:translate(-50%,-50%) scale(.6);opacity:.12}50%{transform:translate(calc(-50% + 28px*var(--c2)),calc(-50% - 16px*var(--c2))) scale(calc(.9 + .35*var(--c1)));opacity:.72}}@keyframes ae09-magnetic{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(.8);opacity:.14}50%{opacity:.82}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg)) scaleX(calc(.9 + .2*var(--c1)));opacity:.14}}@keyframes ae09-rays{0%,100%{transform:rotate(calc(var(--angle) - 6deg*var(--c3)));opacity:.08}50%{transform:rotate(calc(var(--angle) + 6deg*var(--c3)));opacity:.6}}@keyframes ae09-filament{0%,100%{transform:rotate(var(--angle)) translateX(0) scaleX(.55);opacity:.18}50%{transform:rotate(calc(var(--angle) + 22deg*var(--c1))) translateX(calc(28px*var(--c1))) scaleX(calc(.9 + .2*var(--c2)));opacity:.92}}@keyframes ae09-ripple{from{transform:translate(-50%,-50%) scale(.05);opacity:.8}to{transform:translate(-50%,-50%) scale(calc(2 + 3.6*var(--c1)));opacity:0}}@keyframes ae09-plankton{0%,100%{transform:translate(-50%,-50%) scale(.55);opacity:.15}38%{opacity:1}50%{transform:translate(calc(-50% + 20px*var(--c1)),calc(-50% - 15px*var(--c1))) scale(calc(.85 + .4*var(--c2)));opacity:.92}}@keyframes ae09-shards{from{transform:translate(-50%,-50%) rotate(0) scale(.55);opacity:.15}50%{opacity:.92}to{transform:translate(calc(-50% + 40px*var(--c2)),calc(-50% - 32px*var(--c2))) rotate(calc(300deg*var(--c2))) scale(calc(.8 + .22*var(--c1)));opacity:.16}}@keyframes ae09-aurora{0%,100%{transform:translateX(calc(-30px*var(--c2))) skewX(-8deg);opacity:.12}50%{transform:translateX(calc(30px*var(--c2))) skewX(8deg);opacity:.72}}@keyframes ae09-data{from{transform:translateX(-25vw) scaleX(.6);opacity:0}12%{opacity:.9}to{transform:translateX(125vw) scaleX(calc(.8 + .25*var(--c1)));opacity:0}}@keyframes ae09-orbit{from{transform:translate(-50%,-50%) rotate(var(--angle)) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}50%{opacity:.9}to{transform:translate(-50%,-50%) rotate(calc(var(--angle) + 360deg*var(--c1))) scaleX(calc(.65 + .35*var(--c1)));opacity:.25}}@keyframes ae09-caustics{0%,100%{transform:translate(-50%,-50%) rotate(var(--angle)) scale(.65);opacity:.12}50%{transform:translate(calc(-50% + 34px*var(--c3)),calc(-50% - 24px*var(--c3))) rotate(calc(var(--angle) + 80deg)) scale(calc(.92 + .22*var(--c1)));opacity:.68}}@keyframes ae09-ribbon{from{transform:translateX(-35vw) rotate(var(--angle)) scaleX(.55);opacity:0}15%{opacity:.9}50%{transform:translateX(45vw) rotate(calc(var(--angle) + 12deg*var(--c2))) scaleX(1);opacity:1}to{transform:translateX(135vw) rotate(calc(var(--angle) - 12deg*var(--c2))) scaleX(calc(1 + .25*var(--c1)));opacity:0}}@keyframes ae09-fractal{from{transform:rotate(var(--angle)) scaleX(.05);opacity:.08}20%{opacity:.85}to{transform:rotate(calc(var(--angle) + 8deg*var(--c3))) scaleX(calc(.9 + .2*var(--c1)));opacity:.68}}`.trim(),Hn=e=>Math.max(0,Math.min(400,e)),Wt=(e,t,a=100)=>{const n=e.custom?.[t];return Number.isFinite(n)?Number(n):a},Ro=e=>"aeRenderPack09"+e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join("");function pn(e,t){const a=Wt(t,e.controls[0]?.key??"",e.controls[0]?.defaultValue??100)/100;return Math.max(1,Math.round(e.count*Hn(t.density)/100*(.8+a*.2)))}function Io(e,t,a,n,s){const i=Math.max(.1,a.speed/100),r=Math.max(.15,Hn(a.intensity)/100),o=Wt(a,s.controls[0]?.key??"",s.controls[0]?.defaultValue??100)/100,c=Wt(a,s.controls[1]?.key??"",s.controls[1]?.defaultValue??100)/100,d=Wt(a,s.controls[2]?.key??"",s.controls[2]?.defaultValue??100)/100;switch(e.className=`ae-p09 ae-p09-${s.kind}`,e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${12+n()*86}px`),e.style.setProperty("--angle",`${n()*360}deg`),e.style.setProperty("--duration",`${(2.6+n()*6.8)/i}s`),e.style.setProperty("--delay",`${-n()*9}s`),e.style.setProperty("--power",String(r)),e.style.setProperty("--c1",String(o)),e.style.setProperty("--c2",String(c)),e.style.setProperty("--c3",String(d)),e.style.setProperty("--orbit",`${32+n()*220*c}px`),e.style.setProperty("--spin",`${(n()>.5?1:-1)*(220+n()*620*d)}deg`),s.kind){case"burst":e.style.setProperty("--x",`${10+n()*80}%`),e.style.setProperty("--y",`${12+n()*64}%`);break;case"bolt":case"storm-bolt":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${-6+n()*20}%`),e.style.setProperty("--duration",`${(.9+n()*2.5)/Math.max(.35,i)}s`);break;case"gear":e.style.setProperty("--x",`${8+n()*84}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${44+n()*110*c}px`);break;case"liquid":e.style.setProperty("--x",`${6+n()*88}%`),e.style.setProperty("--y",`${8+n()*84}%`),e.style.setProperty("--size",`${70+n()*150*c}px`),e.style.setProperty("--duration",`${(5+n()*8)*Math.max(.45,o)/Math.max(.35,i)}s`);break;case"gravity":case"black-hole":case"galaxy":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%");break;case"web":case"arc":e.style.setProperty("--x",`${4+n()*82}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--duration",`${(.8+n()*2.6)/Math.max(.4,i*d)}s`);break;case"vine":e.style.setProperty("--x",`${n()*75}%`),e.style.setProperty("--y",`${25+n()*70}%`),e.style.setProperty("--angle",`${-70+n()*140}deg`);break;case"tunnel":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${55+t*8*c}px`),e.style.setProperty("--angle",`${t%4*2.5}deg`);break;case"scanline":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${t/Math.max(1,s.count)*100}%`);break;case"laser-grid":e.style.setProperty("--x","0%"),e.style.setProperty("--y",`${8+t%14*6.5}%`),e.style.setProperty("--angle",`${t%2===0?0:90}deg`);break;case"vhs":e.style.setProperty("--x",`${n()*80}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--duration",`${(.45+n()*1.7)/Math.max(.3,i)}s`);break;case"hud":e.style.setProperty("--x",`${5+t%10*10}%`),e.style.setProperty("--y",`${7+Math.floor(t/10)*16}%`);break;case"city":e.style.setProperty("--x",`${t/Math.max(1,s.count)*105-2}%`),e.style.setProperty("--y","100%"),e.style.setProperty("--size",`${28+n()*44}px`);break;case"ember":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${80+n()*25}%`),e.style.setProperty("--size",`${5+n()*11}px`);break;case"dust":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${2+n()*(6+9*o)}px`);break;case"magnetic":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--angle",`${-90+n()*180}deg`);break;case"rays":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y","-20%"),e.style.setProperty("--angle",`${-22+n()*44}deg`);break;case"filament":e.style.setProperty("--x",`${n()*70}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--angle",`${-45+n()*90}deg`);break;case"ripple":e.style.setProperty("--x",`${12+n()*76}%`),e.style.setProperty("--y",`${12+n()*76}%`),e.style.setProperty("--size",`${28+n()*44}px`);break;case"plankton":e.style.setProperty("--x",`${n()*100}%`),e.style.setProperty("--y",`${n()*100}%`),e.style.setProperty("--size",`${3+n()*8}px`);break;case"shards":e.style.setProperty("--x",`${4+n()*92}%`),e.style.setProperty("--y",`${4+n()*92}%`),e.style.setProperty("--size",`${24+n()*58*o}px`);break;case"aurora":e.style.setProperty("--x",`${-10+n()*100}%`),e.style.setProperty("--y","0%");break;case"data":e.style.setProperty("--x",`${-20+n()*10}%`),e.style.setProperty("--y",`${5+n()*90}%`);break;case"orbit-rings":e.style.setProperty("--x","50%"),e.style.setProperty("--y","50%"),e.style.setProperty("--size",`${80+n()*180*c}px`),e.style.setProperty("--angle",`${n()*180*o}deg`);break;case"caustics":e.style.setProperty("--x",`${5+n()*90}%`),e.style.setProperty("--y",`${5+n()*90}%`),e.style.setProperty("--size",`${90+n()*170}px`);break;case"ember-ribbon":e.style.setProperty("--x",`${-25+n()*15}%`),e.style.setProperty("--y",`${6+n()*88}%`),e.style.setProperty("--angle",`${-12+n()*24}deg`);break;case"fractal":e.style.setProperty("--x",`${6+n()*82}%`),e.style.setProperty("--y",`${20+n()*70}%`),e.style.setProperty("--angle",`${-160+n()*320}deg`);break}}function Ao(e,t){const a=JSON.stringify(e.controls[0]?.key??""),n=JSON.stringify(e.controls[1]?.key??""),s=JSON.stringify(e.controls[2]?.key??""),i=e.controls[0]?.defaultValue??100,r=e.controls[1]?.defaultValue??100,o=e.controls[2]?.defaultValue??100;return`function ${t}(effect,root){const layer=aeCreateLayer(effect,root),random=aeCreateSeededRandom(effect.seed),s=effect.settings,custom=s.custom||{},cv=(k,d)=>Number.isFinite(Number(custom[k]))?Number(custom[k]):d,density=Math.max(0,Math.min(400,s.density)),speed=Math.max(.1,s.speed/100),power=Math.max(.15,Math.max(0,Math.min(400,s.intensity))/100),c1=cv(${a},${i})/100,c2=cv(${n},${r})/100,c3=cv(${s},${o})/100,count=Math.max(1,Math.round(${e.count}*density/100*(.8+c1*.2)));for(let i=0;i<count;i++){const node=document.createElement("span");node.className="ae-p09 ae-p09-${e.kind}";node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(random()*100)+"%");node.style.setProperty("--size",(12+random()*86)+"px");node.style.setProperty("--angle",(random()*360)+"deg");node.style.setProperty("--duration",((2.6+random()*6.8)/speed)+"s");node.style.setProperty("--delay",(-random()*9)+"s");node.style.setProperty("--power",String(power));node.style.setProperty("--c1",String(c1));node.style.setProperty("--c2",String(c2));node.style.setProperty("--c3",String(c3));node.style.setProperty("--orbit",(32+random()*220*c2)+"px");node.style.setProperty("--spin",(((random()>.5?1:-1)*(220+random()*620*c3)))+"deg");const kind=${JSON.stringify(e.kind)};if(kind==="burst"){node.style.setProperty("--x",(10+random()*80)+"%");node.style.setProperty("--y",(12+random()*64)+"%");}else if(kind==="bolt"||kind==="storm-bolt"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(-6+random()*20)+"%");}else if(kind==="gear"){node.style.setProperty("--x",(8+random()*84)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(44+random()*110*c2)+"px");}else if(kind==="liquid"){node.style.setProperty("--x",(6+random()*88)+"%");node.style.setProperty("--y",(8+random()*84)+"%");node.style.setProperty("--size",(70+random()*150*c2)+"px");}else if(kind==="gravity"||kind==="black-hole"||kind==="galaxy"||kind==="magnetic"||kind==="tunnel"||kind==="orbit-rings"){node.style.setProperty("--x","50%");node.style.setProperty("--y","50%");if(kind==="tunnel")node.style.setProperty("--size",(55+i*8*c2)+"px");if(kind==="orbit-rings")node.style.setProperty("--size",(80+random()*180*c2)+"px");}else if(kind==="scanline"){node.style.setProperty("--x","0%");node.style.setProperty("--y",((i/Math.max(1,count))*100)+"%");}else if(kind==="laser-grid"){node.style.setProperty("--x","0%");node.style.setProperty("--y",(8+(i%14)*6.5)+"%");node.style.setProperty("--angle",(i%2===0?0:90)+"deg");}else if(kind==="hud"){node.style.setProperty("--x",(5+(i%10)*10)+"%");node.style.setProperty("--y",(7+Math.floor(i/10)*16)+"%");}else if(kind==="city"){node.style.setProperty("--x",((i/Math.max(1,count))*105-2)+"%");node.style.setProperty("--y","100%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="ember"){node.style.setProperty("--x",(random()*100)+"%");node.style.setProperty("--y",(80+random()*25)+"%");node.style.setProperty("--size",(5+random()*11)+"px");}else if(kind==="dust"||kind==="plankton"){node.style.setProperty("--size",(3+random()*10*c1)+"px");}else if(kind==="rays"){node.style.setProperty("--x",(5+random()*90)+"%");node.style.setProperty("--y","-20%");}else if(kind==="ripple"){node.style.setProperty("--x",(12+random()*76)+"%");node.style.setProperty("--y",(12+random()*76)+"%");node.style.setProperty("--size",(28+random()*44)+"px");}else if(kind==="shards"){node.style.setProperty("--size",(24+random()*58*c1)+"px");}else if(kind==="aurora"){node.style.setProperty("--x",(-10+random()*100)+"%");node.style.setProperty("--y","0%");}else if(kind==="data"){node.style.setProperty("--x",(-20+random()*10)+"%");node.style.setProperty("--y",(5+random()*90)+"%");}else if(kind==="caustics"){node.style.setProperty("--size",(90+random()*170)+"px");}else if(kind==="ember-ribbon"){node.style.setProperty("--x",(-25+random()*15)+"%");node.style.setProperty("--y",(6+random()*88)+"%");}layer.appendChild(node);}}`}function No(e){const t=Ro(e.id),a=Object.fromEntries(e.controls.map(n=>[n.key,n.defaultValue]));return{definition:{id:e.id,name:e.name,description:e.description,category:e.category,tags:e.tags,defaultSettings:{...at,opacity:e.opacity??at.opacity,density:e.density??at.density,speed:e.speed??at.speed,intensity:e.intensity??at.intensity,brightness:e.brightness??at.brightness,custom:a},capabilities:_o,customControls:e.controls,performanceCost:e.cost,requiresJavaScript:!0},css:$o,streamElementsRendererName:t,renderPreview(n,s,i){for(let r=0,o=pn(e,s);r<o;r++){const c=document.createElement("span");Io(c,r,s,i,e),n.appendChild(c)}},streamElementsRendererSource:Ao(e,t),estimateDomNodes(n){return pn(e,n)}}}const Lo=jo.map(No),Do=[...Zi,...to,...lo,...wo,...Co,...Lo],ca=Array.from(new Map(Do.map(e=>[e.definition.id,e])).values()),Yn=new Map(ca.map(e=>[e.definition.id,e]));Object.fromEntries(ca.map(e=>[e.definition.id,e.definition]));function Ne(e){return Yn.get(e)}function ze(e){return Yn.get(e)?.definition}function jt(){return ca.map(e=>e.definition)}function To(){return[...ca]}const It={delayMs:0,durationMs:8e3,fadeInMs:500,fadeOutMs:500},At=(e,t,a,n)=>{const s=typeof e=="number"?e:Number(e);return Math.round(Math.max(a,Math.min(n,Number.isFinite(s)?s:t)))};function la(e){const t=e&&typeof e=="object"&&!Array.isArray(e)?e:{},a=At(t.durationMs,It.durationMs,250,12e4),n=At(t.fadeInMs,It.fadeInMs,0,a);return{mode:t.mode==="once"||t.mode==="loop"?t.mode:"off",delayMs:At(t.delayMs,It.delayMs,0,6e4),durationMs:a,fadeInMs:n,fadeOutMs:At(t.fadeOutMs,It.fadeOutMs,0,a-n)}}function Oo(e){return"ae-timeline-"+(e.instanceId.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80)||"layer")}function Oa(e){const t=la(e.timeline);if(!e.timeline||t.mode==="off")return null;const a=t.delayMs+t.durationMs,n=t.delayMs,s=a,i=n+t.fadeInMs,r=s-t.fadeOutMs,o=[],c=(b,u)=>{o.push({ms:b,opacity:u})};n>0&&c(0,0),t.fadeInMs>0?(c(n,0),c(i,1)):(n>0&&c(n-Math.min(n,1),0),c(n,1)),t.fadeOutMs>0?(c(r,1),c(s,0)):(c(s-Math.min(t.durationMs,1),1),c(s,0));const d=new Map;for(const b of o)d.set(b.ms,b.opacity);const f=[...d].sort(([b],[u])=>b-u).map(([b,u])=>`${Number((b/a*100).toFixed(6))}% { opacity: ${u}; }`).join(`
  `),p=Oo(e);return{css:`@keyframes ${p} {
  ${f}
}`,animation:`${p} ${a}ms linear 0ms ${t.mode==="loop"?"infinite":"1"} normal both`}}const Gt=16,gt={x:[-300,300],y:[-300,300],scale:[10,400],rotation:[-1080,1080],opacity:[0,100]};function He(e,t,a,n){const s=typeof e=="number"?e:Number(e);return Number.isFinite(s)?Math.max(a,Math.min(n,s)):t}function qa(e,t){return{x:He(e.x,t.x,...gt.x),y:He(e.y,t.y,...gt.y),scale:He(e.scale,t.scale,...gt.scale),rotation:He(e.rotation,t.rotation,...gt.rotation),opacity:He(e.opacity,100,...gt.opacity)}}function Fa(e,t,a){if(!Array.isArray(e))return[];const n=new Map;for(const s of e.slice(0,256)){if(!s||typeof s!="object"||Array.isArray(s))continue;const i=s;if(typeof i.timeMs!="number"||!Number.isFinite(i.timeMs))continue;const r=Math.round(He(i.timeMs,0,0,t));n.set(r,{timeMs:r,...qa(i,a)})}return[...n.values()].sort((s,i)=>s.timeMs-i.timeMs).slice(0,Gt)}function ve(e,t){const a=la(e),n=e&&typeof e=="object"&&!Array.isArray(e)?e:{};return{...a,easing:n.easing==="ease-in-out"?"ease-in-out":"linear",keyframes:Fa(n.keyframes,a.durationMs,t)}}function qo(e,t,a,n){const s=Fa(e.keyframes,e.durationMs,n),i={timeMs:Math.round(He(t,0,0,e.durationMs)),...qa(a,n)},r=s.findIndex(o=>o.timeMs===i.timeMs);return r>=0?s[r]=i:s.length<Gt&&s.push(i),s.sort((o,c)=>o.timeMs-c.timeMs)}function Fo(e){return`translate(${e.x}%, ${e.y}%) scale(${e.scale/100}) rotate(${e.rotation}deg)`}function Ba(e){const t=ve(e.timeline,e.settings),a=t.keyframes??[];if(t.mode==="off"||a.length===0)return null;const n=t.delayMs+t.durationMs,s=qa({},e.settings),i=[...a];if(i[0]?.timeMs!==0&&i.unshift({timeMs:0,...s}),i.at(-1)?.timeMs!==t.durationMs){const f=i.at(-1)??{timeMs:0,...s};i.push({...f,timeMs:t.durationMs})}const r=new Map;t.delayMs>0&&r.set(0,i[0]);for(const f of i)r.set(t.delayMs+f.timeMs,f);const o=[...r.entries()].sort(([f],[p])=>f-p).map(([f,p])=>`${Number((f/n*100).toFixed(6))}% { transform: ${Fo(p)}; opacity: ${p.opacity/100}; }`).join(`
  `);let c=2166136261;for(const f of e.instanceId)c=Math.imul(c^f.charCodeAt(0),16777619);const d=`ae-motion-${(c>>>0).toString(36)}`;return{css:`@keyframes ${d} {
  ${o}
}`,animation:`${d} ${n}ms ${t.easing} 0ms ${t.mode==="loop"?"infinite":"1"} normal both`}}const Bo=new Set(["static-cdn.jtvnw.net","yt3.googleusercontent.com","lh3.googleusercontent.com","cdn.streamelements.com","static-cdn.streamelements.com"]);function Wo(e){if(typeof e!="string"||e.length>500)return null;try{const t=new URL(e);return t.protocol!=="https:"||!Bo.has(t.hostname.toLowerCase())||t.username||t.password||t.port?null:t.href}catch{return null}}function Uo(e){if(!e||typeof e!="object"||Array.isArray(e))return null;const t=e,a=t.data&&typeof t.data=="object"&&!Array.isArray(t.data)?t.data:{},n=[a.avatar,a.avatarUrl,a.profileImage,t.avatar,t.avatarUrl,t.profileImage];for(const s of n){const i=Wo(s);if(i)return i}return null}function Xo(e,t,a,n){const s=document.createElement("span");s.className="ae-alert-avatar",s.style.position="absolute",s.style.left="0",s.style.top="50%",s.style.transform="translateY(-50%)",s.style.width=n+"px",s.style.height=n+"px",s.style.borderRadius="50%",s.style.overflow="hidden",s.style.display="grid",s.style.placeItems="center",s.style.fontSize=Math.round(n*.48)+"px",s.style.background="rgba(25,45,78,.85)",s.style.border="2px solid rgba(255,255,255,.7)",s.style.color="#ffffff",s.style.boxSizing="border-box",s.textContent=Array.from(a.trim())[0]?.toLocaleUpperCase()??"?";const i=Uo(t);if(i){const r=document.createElement("img");r.src=i,r.alt="",r.referrerPolicy="no-referrer",r.loading="eager",r.decoding="async",r.style.position="absolute",r.style.inset="0",r.style.width="100%",r.style.height="100%",r.style.objectFit="cover",s.appendChild(r)}e.style.paddingLeft=n+14+"px",e.style.boxSizing="border-box",e.style.minHeight=n+"px",e.appendChild(s)}const Zo=`
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
`.trim();function Ho(e,t,a){const n=Number.isFinite(a)?Math.max(300,Math.min(18e4,Math.round(a))):4e3,s=Math.min(420,Math.max(120,Math.round(n*.22))),i=Math.min(420,Math.max(120,Math.round(n*.22)));return`ae-caption-in-${e} ${s}ms ease-out 0ms both, ae-caption-out-${t} ${i}ms ease-in ${Math.max(0,n-i)}ms forwards`}const vt={enabled:!1,template:"{name} · {amount}",position:"bottom",xPercent:50,yPercent:75,fontSize:48,color:"#ffffff",intro:"slide",outro:"fade",avatarEnabled:!1,avatarSize:72};function Wa(e){const t=e&&typeof e=="object"&&!Array.isArray(e)?e:{},a=typeof t.template=="string"?t.template.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,160):vt.template,n=typeof t.fontSize=="number"?t.fontSize:Number(t.fontSize);return{enabled:t.enabled===!0,template:a,position:t.position==="top"||t.position==="center"||t.position==="custom"?t.position:"bottom",xPercent:Number.isFinite(Number(t.xPercent))?Math.max(25,Math.min(75,Math.round(Number(t.xPercent)))):50,yPercent:Number.isFinite(Number(t.yPercent))?Math.max(10,Math.min(90,Math.round(Number(t.yPercent)))):75,fontSize:Number.isFinite(n)?Math.round(Math.max(14,Math.min(120,n))):vt.fontSize,color:typeof t.color=="string"&&/^#[\da-fA-F]{6}$/.test(t.color)?t.color:vt.color,intro:t.intro==="fade"||t.intro==="pop"?t.intro:"slide",outro:t.outro==="slide"||t.outro==="pop"?t.outro:"fade",avatarEnabled:t.avatarEnabled===!0,avatarSize:Number.isFinite(Number(t.avatarSize))?Math.max(32,Math.min(144,Math.round(Number(t.avatarSize)))):72}}function Gn(e,t){const a=t&&typeof t=="object"&&!Array.isArray(t)?t:{},n=a.data&&typeof a.data=="object"&&!Array.isArray(a.data)?a.data:{},s=(o,c)=>typeof o=="string"||typeof o=="number"&&Number.isFinite(o)?String(o).replace(/[\u0000-\u001f\u007f]/g," ").slice(0,c):"",i=s(e==="message"?n.displayName??n.nick??a.name:a.name??a.sender,60),r=s(e==="message"?n.text??(n.snippet&&typeof n.snippet=="object"?n.snippet.displayMessage:void 0)??a.text:a.message,180);return{name:i||"Widz",amount:s(a.amount,32),message:r,event:e}}function Yo(e,t,a){const n=Gn(t,a);return(typeof e=="string"?e.slice(0,160):"").replace(/\{(name|amount|message|event)\}/g,(i,r)=>n[r]??"").slice(0,280)}function Go(e,t,a,n,s=4e3){if(!t||!t.enabled)return null;const i=document.createElement("div");return i.className="ae-alert-caption",i.style.animation=Ho(t.intro??"slide",t.outro??"fade",s),i.textContent=Yo(t.template,a,n),i.style.position="absolute",i.style.left="5%",i.style.width="90%",i.style.maxWidth="90%",i.style.textAlign="center",i.style.whiteSpace="pre-wrap",i.style.overflowWrap="anywhere",i.style.pointerEvents="none",i.style.color=t.color,i.style.fontSize=t.fontSize+"px",i.style.fontWeight="700",i.style.lineHeight="1.2",i.style.textShadow="0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)",t.position==="custom"?(i.style.left=(t.xPercent??50)+"%",i.style.top=(t.yPercent??75)+"%",i.style.width="48%",i.style.transform="translate(-50%, -50%)"):t.position==="top"?i.style.top="8%":t.position==="center"?(i.style.top="50%",i.style.transform="translateY(-50%)"):i.style.bottom="8%",t.avatarEnabled&&Xo(i,n,Gn(a,n).name,t.avatarSize??72),e.appendChild(i),i}const ut=[{value:"follower-latest",label:"Nowy obserwujący"},{value:"subscriber-latest",label:"Nowa subskrypcja"},{value:"tip-latest",label:"Donacja (tip)"},{value:"cheer-latest",label:"Cheer / bits"},{value:"raid-latest",label:"Raid"},{value:"message",label:"Wiadomość na czacie"}],Jo=new Set(ut.map(e=>e.value)),fa=(e,t,a)=>{const n=typeof e=="number"?e:Number(e);return Number.isFinite(n)?Math.max(0,Math.min(a,Math.round(n))):t};function Ae(e){if(!e||typeof e!="object"||Array.isArray(e))return;const t=e;if(t.source==="event")return{source:"event",event:Jo.has(String(t.event))?t.event:"follower-latest",cooldownMs:fa(t.cooldownMs,3e3,6e4),minAmount:fa(t.minAmount,0,1e6),caption:t.caption===void 0?void 0:Wa(t.caption),queueMode:t.queueMode==="queue"?"queue":"replace",priority:fa(t.priority,5,10)}}function Ua(e){return Ae(e.trigger)?.source==="event"}function Jn(e){return Ua(e)?{...e,timeline:{...ve(e.timeline,e.settings),mode:"once"}}:e}function Pt(e){const t=ve(e.timeline,e.settings);return Math.min(18e4,t.delayMs+t.durationMs+100)}function Vo(e,t,a,n){const s=Ae(e);if(!s||t!==s.event||n<s.cooldownMs)return!1;if(s.minAmount>0&&(t==="tip-latest"||t==="cheer-latest"||t==="raid-latest")){if(!a||typeof a!="object")return!1;const i=Number(a.amount);if(!Number.isFinite(i)||i<s.minAmount)return!1}return!0}const J={resolution:{width:1920,height:1080},backgroundOnly:!0,palette:{accent1:"#7c5cff",accent2:"#00d9ff",accent3:"#ff4fb0",background1:"#080b12",background2:"#101827"},background:{mode:"gradient",angle:145,lightX:50,lightY:40,hue:0,saturation:1,brightness:1,contrast:1,noise:0,vignette:.2},focusZone:"none",safeZone:"off",effects:[],selectedEffectInstanceId:null,activePresetId:null},Ma=new Set,We=[],ft=[],Ko=100;let Ve=null;const Qe=e=>structuredClone(e),Vn=(e,t)=>JSON.stringify(e)===JSON.stringify(t),_t=()=>Ma.forEach(e=>e(J));function Kn(e,t){We.push({label:e,snapshot:t}),We.length>Ko&&We.shift(),ft.length=0}function ke(e,t){const a=Ve?null:Qe(J);t(),a&&!Vn(a,J)&&Kn(e,a),_t()}function he(){return J}function Qn(e){return Ma.add(e),()=>Ma.delete(e)}function Qo(e){Ve||(Ve={label:e,before:Qe(J)})}function ec(){if(!Ve)return;const e=Ve;Ve=null,Vn(e.before,J)||(Kn(e.label,e.before),_t())}function tc(){We.length=0,ft.length=0,Ve=null}function ac(){return We.length>0}function nc(){return ft.length>0}function un(){return We.at(-1)?.label??null}function fn(){return ft.at(-1)?.label??null}function er(){const e=We.pop();e&&(ft.push({label:e.label,snapshot:Qe(J)}),Object.assign(J,Qe(e.snapshot)),_t())}function tr(){const e=ft.pop();e&&(We.push({label:e.label,snapshot:Qe(J)}),Object.assign(J,Qe(e.snapshot)),_t())}function ar(e){const t=ze(e);if(!t)return console.warn(`Unknown effect: ${e}`),null;let a=null;return ke(`Dodaj ${t.name}`,()=>{const n={instanceId:crypto.randomUUID(),effectId:e,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...t.defaultSettings},locked:!1,groupId:null};J.effects.push(n),J.selectedEffectInstanceId=n.instanceId,J.activePresetId=null,a=n}),a}function rc(e,t=!1){const a=J.effects.find(s=>s.instanceId===e);if(!a)return null;let n=null;return ke(`Duplikuj ${a.label??a.effectId}`,()=>{const s=J.effects.indexOf(a),i={...structuredClone(a),instanceId:crypto.randomUUID(),seed:t?a.seed:Math.floor(Math.random()*4294967295),locked:!1};J.effects.splice(s+1,0,i),J.selectedEffectInstanceId=i.instanceId,n=i}),n}function nr(e,t=!1){const a=J.effects.findIndex(s=>s.instanceId===e);if(a<0)return!1;const n=J.effects[a];return n?.locked&&!t?!1:(ke(`Usuń ${n?.label??n?.effectId??"warstwę"}`,()=>{J.effects.splice(a,1),J.selectedEffectInstanceId===e&&(J.selectedEffectInstanceId=J.effects.at(-1)?.instanceId??null)}),!0)}function sc(e=!1){ke("Wyczyść scenę",()=>{J.effects=e?[]:J.effects.filter(a=>a.locked);const t=new Set(J.effects.map(a=>a.instanceId));J.selectedEffectInstanceId&&!t.has(J.selectedEffectInstanceId)&&(J.selectedEffectInstanceId=J.effects.at(-1)?.instanceId??null),J.activePresetId=null})}function rr(e){J.effects.some(t=>t.instanceId===e)&&(J.selectedEffectInstanceId=e,_t())}function ic(e){const t=J.effects.find(a=>a.instanceId===e);t&&ke(`${t.enabled?"Wyłącz":"Włącz"} ${t.label??t.effectId}`,()=>{t.enabled=!t.enabled})}function oc(e){const t=J.effects.find(a=>a.instanceId===e);t&&ke(`${t.locked?"Odblokuj":"Zablokuj"} ${t.label??t.effectId}`,()=>{t.locked=!t.locked})}function cc(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=t.trim().slice(0,80);ke("Zmień nazwę warstwy",()=>{a.label=n||void 0})}function lc(e){const t=J.effects.findIndex(s=>s.instanceId===e),a=J.effects[t];if(t<0||t===J.effects.length-1||a?.locked)return;const n=J.effects[t+1];!n||n.locked||ke("Przenieś warstwę wyżej",()=>{J.effects[t+1]=J.effects[t],J.effects[t]=n})}function dc(e){const t=J.effects.findIndex(s=>s.instanceId===e),a=J.effects[t];if(t<=0||a?.locked)return;const n=J.effects[t-1];!n||n.locked||ke("Przenieś warstwę niżej",()=>{J.effects[t-1]=J.effects[t],J.effects[t]=n})}function pc(e,t){if(e===t)return;const a=J.effects.find(s=>s.instanceId===e),n=J.effects.find(s=>s.instanceId===t);!a||!n||a.locked||n.locked||ke("Zmień kolejność warstw",()=>{J.effects.splice(J.effects.indexOf(a),1);const s=J.effects.indexOf(n);J.effects.splice(s+1,0,a)})}function xt(){const e=J.selectedEffectInstanceId;return e?J.effects.find(t=>t.instanceId===e)??null:null}function Se(e,t){const a=J.effects.find(n=>n.instanceId===e);a&&ke(`Zmień ${a.label??a.effectId}`,()=>{a.settings={...a.settings,...t},J.activePresetId=null})}function Jt(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=ve({...a.timeline,...t},a.settings);ke("Zmień czas animacji",()=>{a.timeline=n,J.activePresetId=null})}function Ea(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=Ae(t);ke("Zmień wyzwalacz warstwy",()=>{a.trigger=n,n&&(a.timeline=ve({...a.timeline,mode:"once"},a.settings)),J.activePresetId=null})}function uc(e,t){const a=J.effects.find(c=>c.instanceId===e);if(!a)return;const n=ve(a.timeline,a.settings),r=[...n.keyframes??[]].reverse().find(c=>c.timeMs<=t)??{...a.settings,opacity:100},o=qo(n,t,r,a.settings);ke("Dodaj klatkę kluczową",()=>{a.timeline={...n,mode:n.mode==="off"?"once":n.mode,keyframes:o},J.activePresetId=null})}function Nt(e,t,a){const n=J.effects.find(c=>c.instanceId===e);if(!n)return;const s=ve(n.timeline,n.settings),i=(s.keyframes??[]).find(c=>c.timeMs===t);if(!i)return;const r=Math.max(0,Math.min(s.durationMs,Math.round(a.timeMs??t)));if((s.keyframes??[]).some(c=>c.timeMs===r&&c.timeMs!==t))return;const o=Fa([...(s.keyframes??[]).filter(c=>c.timeMs!==t),{...i,...a}],s.durationMs,n.settings);ke("Edytuj klatkę kluczową",()=>{n.timeline={...s,keyframes:o},J.activePresetId=null})}function fc(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=ve(a.timeline,a.settings);(n.keyframes??[]).some(s=>s.timeMs===t)&&ke("Usuń klatkę kluczową",()=>{a.timeline={...n,keyframes:(n.keyframes??[]).filter(s=>s.timeMs!==t)},J.activePresetId=null})}function sr(e,t){const a=J.effects.find(s=>s.instanceId===e);if(!a)return;const n=Math.max(0,Math.min(4294967295,Math.floor(t)));ke("Zmień seed",()=>{a.seed=n})}function mc(e){sr(e,Math.floor(Math.random()*4294967295))}function yc(){ke("Losuj wszystkie seedy",()=>J.effects.forEach(e=>{e.seed=Math.floor(Math.random()*4294967295)}))}function Xa(e,t="Wczytaj scenę"){const a=Qe(e);ke(t,()=>Object.assign(J,a))}function hc(e,t="Zastosuj preset sceny"){ke(t,()=>{const a=[];for(const n of e){const s=ze(n.effectId);s&&a.push({instanceId:crypto.randomUUID(),effectId:s.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...s.defaultSettings,...n.settings},locked:!1,groupId:null})}J.effects=a,J.selectedEffectInstanceId=a.at(-1)?.instanceId??null,J.activePresetId=null})}function gc(e){const t=e.filter(a=>a.enabled).reduce((a,n)=>{const s=la(n.timeline);return s.mode==="off"?a:Math.max(a,s.delayMs+s.durationMs)},0);return Math.max(1e4,Math.min(18e4,t))}function Ut(e,t){return!Number.isFinite(e)||!Number.isFinite(t)||t<=0?0:Math.max(0,Math.min(Math.round(t),Math.round(e)))}function bc(e,t,a,n,s=100){if(![e,t,a,n].every(Number.isFinite)||a<=0||n<=0)return 0;const i=Math.max(0,Math.min(1,(e-t)/a))*n,r=Math.max(1,Math.round(s));return Ut(Math.round(i/r)*r,n)}function wc(e,t){const a=document.createElement("section");a.className="ae-preview-transport",a.setAttribute("aria-label","Sterowanie odtwarzaniem podglądu"),a.innerHTML=`
    <div class="ae-transport-buttons">
      <button type="button" class="ae-button ae-button-secondary" data-transport-play aria-label="Wstrzymaj podgląd">⏸ Pauza</button>
      <button type="button" class="ae-button ae-button-secondary" data-transport-restart title="Odtwórz od zera">↺ Od początku</button>
      <output data-transport-position aria-live="off">0.0 / 10.0 s</output>
    </div>
    <input data-transport-seek type="range" min="0" max="10000" step="50" value="0"
      aria-label="Przewiń podgląd do wybranego momentu" />
    <div class="ae-transport-description">Przeciągnij suwak, aby zobaczyć klatkę. Odtwarzanie nie zmienia sceny ani eksportu.</div>
  `,t.appendChild(a);const n=a.querySelector("[data-transport-play]"),s=a.querySelector("[data-transport-seek]"),i=a.querySelector("[data-transport-position]");let r=!0,o=0,c=1e4,d=null,f=!1;const p=()=>e.getAnimations({subtree:!0}),b=()=>{document.dispatchEvent(new CustomEvent("animated-effects:transport-state",{detail:{playing:r,cursorMs:o,durationMs:c}}))},u=()=>{s.max=String(c),s.value=String(Ut(o,c)),i.value=`${(o/1e3).toFixed(1)} / ${(c/1e3).toFixed(1)} s`,n.textContent=r?"⏸ Pauza":"▶ Odtwórz",n.setAttribute("aria-label",r?"Wstrzymaj podgląd":"Odtwórz podgląd")},h=()=>{for(const P of p())try{P.pause(),P.currentTime=o,r&&P.play()}catch(A){console.debug("Animated Effects: animation not seekable",A)}},m=P=>{r!==P&&(r=P,r&&o>=c&&(o=0),d=null,h(),u(),b())},g=P=>{o=Ut(P,c),d=null,h(),u(),b()},w=()=>{g(0),m(!0)},k=P=>{r&&!f?(d!==null&&(o=Math.min(c,o+Math.max(0,P-d))),d=P,o>=c&&(r=!1,h(),b()),u()):d=null,requestAnimationFrame(k)};s.addEventListener("pointerdown",()=>{f=!0,m(!1)});const x=()=>{f=!1};s.addEventListener("pointerup",x),s.addEventListener("pointercancel",x),s.addEventListener("blur",x),s.addEventListener("input",()=>{m(!1),g(Number(s.value))}),n.addEventListener("click",()=>m(!r)),a.querySelector("[data-transport-restart]")?.addEventListener("click",()=>w()),document.addEventListener("animated-effects:replay-preview",()=>w()),document.addEventListener("animated-effects:transport-toggle",()=>m(!r)),document.addEventListener("animated-effects:preview-seek",P=>{const A=P.detail?.ms;typeof A!="number"||!Number.isFinite(A)||(m(!1),g(A))});const M=()=>{c=gc(he().effects),o=Ut(o,c),h(),u()};return u(),requestAnimationFrame(k),{afterRender:M,replay:w,seek:g}}const kc=16,mn=60;class vc{queue=[];current=null;lastById=new Map;lines=[];sequence=0;counters={accepted:0,started:0,completed:0,dropped:0,evicted:0};reset(){this.queue=[],this.current=null,this.lastById.clear(),this.lines=[],this.sequence=0,this.counters={accepted:0,started:0,completed:0,dropped:0,evicted:0}}getSnapshot(){return{current:this.current,waiting:[...this.queue],counters:{...this.counters},lines:[...this.lines]}}dispatch(t,a,n,s){const i=[],r={amount:n};for(const o of t){if(!o.enabled)continue;const c=Ae(o.trigger);if(!c||c.event!==a)continue;const d=c.priority??5,f=this.lastById.get(o.instanceId),p=f===void 0?1/0:s-f,b={instanceId:o.instanceId,event:a,priority:d,effect:o};if(!Vo(c,a,r,p)){const h=p<c.cooldownMs?"cooldown":"below-threshold";this.counters.dropped++,this.log("dropped",h,b);continue}if(c.queueMode!=="queue"){this.lastById.set(o.instanceId,s),this.counters.accepted++,this.counters.started++,this.log("started","started",b),i.push(b);continue}const u=this.queue.findIndex(h=>h.priority<d);if(this.queue.length>=kc){if(u<0){this.counters.dropped++,this.log("dropped","queue-full",b);continue}const h=this.queue.pop();h&&(this.counters.evicted++,this.log("evicted","lower-priority",h))}if(u<0?this.queue.push(b):this.queue.splice(u,0,b),this.counters.accepted++,this.lastById.set(o.instanceId,s),this.log("accepted","accepted",b),!this.current){const h=this.startNext();h&&i.push(h)}}return i}finishCurrent(){return this.current&&(this.counters.completed++,this.log("completed","completed",this.current),this.current=null),this.startNext()}startNext(){const t=this.queue.shift();return t?(this.current=t,this.counters.started++,this.log("started","started",t),t):null}log(t,a,n){this.lines.unshift({sequence:++this.sequence,action:t,reason:a,instanceId:n.instanceId,event:n.event,priority:n.priority,waiting:this.queue.length}),this.lines.length>mn&&(this.lines.length=mn)}}const yn={steady:[{event:"message",everyMs:1100,amount:0,startMs:600},{event:"follower-latest",everyMs:3500,amount:0,startMs:1700},{event:"tip-latest",everyMs:9e3,amount:50,startMs:4500}],burst:[{event:"message",everyMs:330,amount:0,startMs:1700},{event:"follower-latest",everyMs:1100,amount:0,startMs:2100},{event:"tip-latest",everyMs:2600,amount:100,startMs:3700},{event:"raid-latest",everyMs:11e3,amount:75,startMs:5500}],"chat-flood":[{event:"message",everyMs:80,amount:0,startMs:500},{event:"follower-latest",everyMs:700,amount:0,startMs:1400},{event:"tip-latest",everyMs:3e3,amount:250,startMs:2800},{event:"cheer-latest",everyMs:6500,amount:300,startMs:3900}]};function xc(e,t=12e3){const a=Number.isFinite(t)?Math.max(1e3,Math.min(6e4,t)):12e3,n=yn[e]??yn.steady,s=[];for(const r of n)for(let o=r.startMs;o<a&&s.length<900;o+=r.everyMs)s.push({atMs:o,listener:r.event,amount:r.amount});const i=["tip-latest","cheer-latest","raid-latest","subscriber-latest","follower-latest","message"];return s.sort((r,o)=>r.atMs-o.atMs||i.indexOf(r.listener)-i.indexOf(o.listener)),s.slice(0,900)}function zc(e){const t=e.filter(r=>Number.isFinite(r)&&r>0&&r<=1e3);if(t.length<20)return{samples:t.length,approximateFps:null,p95FrameMs:null,slowFramesPercent:null,status:"insufficient"};const a=[...t].sort((r,o)=>r-o),n=a[Math.floor((a.length-1)/2)],s=a[Math.ceil(a.length*.95)-1],i=a.filter(r=>r>33.34).length;return{samples:t.length,approximateFps:Math.round(1e3/n),p95FrameMs:Math.round(s*10)/10,slowFramesPercent:Math.round(i/t.length*100),status:s>50||i/t.length>.15?"warning":"ok"}}function Sc(e){const t=[];return e.dispatched<e.total&&t.push("Test nie przetworzył wszystkich zaplanowanych zdarzeń."),e.waitingPeak>=14&&t.push("Kolejka zbliżała się do limitu 16 oczekujących alertów."),e.dropped>0&&t.push("Odrzucono "+e.dropped+" wyzwolenia (np. cooldown, próg lub przepełnienie)."),e.evicted>0&&t.push("Wyparcie niższego priorytetu: "+e.evicted+"."),e.frame.status==="warning"&&t.push("Zaobserwowano nieregularny rytm requestAnimationFrame (nie jest to pomiar GPU)."),e.frame.status==="insufficient"&&t.push("Zbyt mało próbek requestAnimationFrame do oceny płynności."),t.length||t.push("Brak przekroczeń ustawionych progów w tej próbie."),{...e,warnings:t}}const Mc=new Set(ut.map(e=>e.value)),Ec=new Set(["steady","burst","chat-flood","custom"]),Pc=900,ir=1e5,Cc=6e4;function Ct(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Niepoprawny format pliku.");const t=e;if(t.version!==1)throw new Error("Nieobsługiwana wersja śladu.");if(!Ec.has(String(t.source)))throw new Error("Nieznany typ scenariusza.");const a=t.durationMs;if(typeof a!="number"||!Number.isInteger(a)||a<1e3||a>Cc)throw new Error("Czas śladu musi wynosić od 1 do 60 sekund.");if(!Array.isArray(t.events)||t.events.length>Pc)throw new Error("Nieprawidłowa liczba zdarzeń (maks. 900).");const n=[];let s=-1;for(const i of t.events){if(!i||typeof i!="object"||Array.isArray(i))throw new Error("Nieprawidłowe zdarzenie w śladzie.");const r=i;if(!Mc.has(String(r.listener)))throw new Error("Ślad zawiera nieobsługiwany typ zdarzenia.");if(typeof r.atMs!="number"||!Number.isInteger(r.atMs)||r.atMs<0||r.atMs>=a||r.atMs<s)throw new Error("Czasy zdarzeń muszą być posortowane i mieścić się w czasie testu.");if(typeof r.amount!="number"||!Number.isFinite(r.amount)||r.amount<0||r.amount>1e6)throw new Error("Kwota testowa poza dozwolonym zakresem.");s=r.atMs,n.push({atMs:r.atMs,listener:r.listener,amount:r.amount})}return{version:1,source:t.source,durationMs:a,events:n}}function jc(e){return JSON.stringify(Ct(e),null,2)}function _c(e){if(typeof e!="string"||e.length>ir)throw new Error("Plik śladu przekracza limit 100 KB.");let t;try{t=JSON.parse(e)}catch{throw new Error("Plik nie jest poprawnym JSON.")}return Ct(t)}function $c(e){const t=Ct(e);return JSON.stringify([t.durationMs,t.events.map(a=>[a.atMs,a.listener,a.amount])])}function Rc(e,t){const a=e.traceKey===t.traceKey,n=a?["Ten sam harmonogram i dane syntetyczne. Różnice w rAF mogą wynikać też z obciążenia przeglądarki."]:["Nie można bezpośrednio porównać różnych harmonogramów. Odtwórz identyczny ślad w obu próbach."],s=(i,r,o,c="")=>({label:i,first:r,second:o,delta:a&&r!==null&&o!==null?Math.round((o-r)*100)/100:null,unit:c});return{comparable:a,reasons:n,measures:[s("Przetworzone zdarzenia",e.result.dispatched,t.result.dispatched),s("Odrzucone",e.result.dropped,t.result.dropped),s("Wyparte",e.result.evicted,t.result.evicted),s("Maks. kolejka",e.result.waitingPeak,t.result.waitingPeak),s("Szacowane FPS (rAF)",e.result.frame.approximateFps,t.result.frame.approximateFps,"FPS"),s("p95 odstępu rAF",e.result.frame.p95FrameMs,t.result.frame.p95FrameMs,"ms"),s("Odstępy >33 ms",e.result.frame.slowFramesPercent,t.result.frame.slowFramesPercent,"%")]}}class Ic{timer=null;frameId=null;active=!1;scheduled=[];trace=null;eventIndex=0;startTime=0;lastProgress=0;lastFrame=null;frames=[];waitingPeak=0;endOfPlayback=0;durationMs=12e3;callbacks=null;effects=[];engine;constructor(t){this.engine=t}isRunning(){return this.active}getTrace(){return this.trace?Ct(this.trace):null}start(t,a,n,s){const i=Number.isFinite(a)?Math.round(Math.max(3e3,Math.min(6e4,a))):12e3;this.startTrace({version:1,source:t,durationMs:i,events:xc(t,i)},n,s)}startTrace(t,a,n){const s=Ct(t);this.stop("stopped",!1),this.engine.reset(),this.trace=s,this.durationMs=s.durationMs,this.scheduled=s.events.map(i=>({...i})),this.eventIndex=0,this.frames=[],this.waitingPeak=0,this.endOfPlayback=0,this.lastProgress=0,this.lastFrame=null,this.effects=a.map(i=>({...i,trigger:i.trigger?{...i.trigger}:void 0})),this.callbacks=n,this.startTime=performance.now(),this.active=!0,this.frameId=requestAnimationFrame(i=>this.sampleFrame(i)),this.timer=window.setInterval(()=>this.tick(),60),this.tick()}stop(t="stopped",a=!0){if(!this.active)return;const n=Math.min(this.durationMs,Math.max(0,performance.now()-this.startTime));this.active=!1,this.timer!==null&&window.clearInterval(this.timer),this.frameId!==null&&cancelAnimationFrame(this.frameId),this.timer=null,this.frameId=null;const s=this.engine.getSnapshot();if(!a||!this.callbacks)return;const i=Sc({total:this.scheduled.length,dispatched:this.eventIndex,durationMs:Math.round(n),waitingPeak:this.waitingPeak,dropped:s.counters.dropped,evicted:s.counters.evicted,accepted:s.counters.accepted,frame:zc(this.frames)});this.callbacks.onFinish(i,t)}sampleFrame(t){this.active&&(this.lastFrame!==null&&this.frames.length<3e3&&this.frames.push(t-this.lastFrame),this.lastFrame=t,this.frameId=requestAnimationFrame(a=>this.sampleFrame(a)))}tick(){if(!this.active||!this.callbacks)return;if(document.visibilityState==="hidden"){this.stop("hidden");return}const t=performance.now()-this.startTime,a=Math.min(t,this.durationMs);for(;this.eventIndex<this.scheduled.length&&this.scheduled[this.eventIndex].atMs<=a;){const s=this.scheduled[this.eventIndex++],i=this.engine.dispatch(this.effects,s.listener,s.amount,this.startTime+s.atMs);for(const r of i)this.callbacks.onPlay(r),this.engine.getSnapshot().current?.instanceId===r.instanceId&&(this.endOfPlayback=t+Pt(r.effect));this.waitingPeak=Math.max(this.waitingPeak,this.engine.getSnapshot().waiting.length)}let n=0;for(;this.engine.getSnapshot().current&&t>=this.endOfPlayback&&n<8;){const s=this.engine.finishCurrent();n++,s&&(this.callbacks.onPlay(s),this.endOfPlayback=t+Pt(s.effect))}t-this.lastProgress>=480&&(this.lastProgress=t,this.callbacks.onProgress({elapsedMs:Math.round(a),durationMs:this.durationMs,dispatched:this.eventIndex,planned:this.scheduled.length,waitingPeak:this.waitingPeak,currentQueueSize:this.engine.getSnapshot().waiting.length,status:"running"})),t>=this.durationMs&&this.stop("completed")}}const Ac={accepted:"Dodano do kolejki","queue-full":"Odrzucono — kolejka pełna",cooldown:"Odrzucono — cooldown","below-threshold":"Odrzucono — próg kwoty","lower-priority":"Usunięto — niższy priorytet",started:"Rozpoczęto",completed:"Zakończono",replaced:"Zastąpiono"},Nc=new Map(ut.map(e=>[e.value,e.label]));function ee(e,t,a){const n=document.createElement(e);return t&&(n.className=t),a!==void 0&&(n.textContent=a),n}function Lc(e,t){const a=new vc,n=new Ic(a);let s=null,i=null,r=null,o=null;const c=()=>JSON.stringify(t().map(S=>[S.instanceId,S.enabled,S.trigger??null]));let d=c();const f=ee("details","ae-diagnostics"),p=ee("summary","","Diagnostyka alertów — symulator kolejki");f.appendChild(p);const b=ee("div","ae-diagnostics-content"),u=ee("p","ae-diagnostics-hint","Test lokalny bez połączenia ze StreamElements. Po uruchomieniu zdarzenia możesz przejść do następnego alertu i zobaczyć kolejność oraz powody odrzucenia.");b.appendChild(u);const h=ee("div","ae-diagnostics-controls"),m=ee("select");m.setAttribute("aria-label","Rodzaj zdarzenia testowego");for(const S of ut){const $=document.createElement("option");$.value=S.value,$.textContent=S.label,m.appendChild($)}const g=ee("input");g.type="number",g.value="50",g.min="0",g.max="1000000",g.setAttribute("aria-label","Testowa kwota donacji lub liczba widzów");const w=ee("select");w.setAttribute("aria-label","Liczba symulowanych zdarzeń");for(const S of[1,5,20]){const $=document.createElement("option");$.value=String(S),$.textContent=S===1?"1 zdarzenie":S+" zdarzeń",w.appendChild($)}const k=ee("button","ae-button ae-button-primary","Symuluj");k.type="button";const x=ee("button","ae-button ae-button-secondary","Następny alert");x.type="button";const M=ee("button","ae-button ae-button-secondary","Wyczyść");M.type="button",h.append(m,g,w,k,x,M),b.appendChild(h);const P=ee("p","ae-diagnostics-status");P.setAttribute("role","status"),b.appendChild(P);const A=ee("div","ae-diagnostics-metrics");b.appendChild(A);const _=ee("h4","","Aktywny alert w trybie kolejki"),D=ee("div","ae-diagnostics-current");b.append(_,D);const j=ee("h4","","Oczekujące alerty"),W=ee("ol","ae-diagnostics-queue");b.append(j,W);const K=ee("h4","","Historia decyzji (ostatnie 60)"),E=ee("ol","ae-diagnostics-log");b.append(K,E);const O=ee("h4","","Test obciążeniowy transmisji (czas rzeczywisty)"),y=ee("p","ae-diagnostics-hint","Scenariusze wysyłają syntetyczne zdarzenia do lokalnej kolejki. Mierzone są odstępy requestAnimationFrame, nie obciążenie GPU ani serwerów StreamElements. Wynik zależy od komputera i przeglądarki."),q=ee("div","ae-diagnostics-stress-controls"),te=ee("select");te.setAttribute("aria-label","Scenariusz obciążenia");for(const[S,$]of[["steady","Zwykła transmisja"],["burst","Nagły wzrost ruchu"],["chat-flood","Intensywny czat"]]){const L=document.createElement("option");L.value=S,L.textContent=$,te.appendChild(L)}const B=ee("select");B.setAttribute("aria-label","Czas trwania testu");for(const[S,$]of[[12e3,"12 sekund"],[3e4,"30 sekund"]]){const L=document.createElement("option");L.value=String(S),L.textContent=$,B.appendChild(L)}const ie=ee("button","ae-button ae-button-primary","Uruchom test");ie.type="button";const X=ee("button","ae-button ae-button-secondary","Zatrzymaj test");X.type="button",X.disabled=!0,q.append(te,B,ie,X);const ne=ee("progress","ae-diagnostics-progress");ne.value=0,ne.max=100,ne.setAttribute("aria-label","Postęp testu obciążeniowego");const N=ee("p","ae-diagnostics-stress-status","Test nie został uruchomiony. Wybierz scenariusz i kliknij Uruchom test.");N.setAttribute("role","status");const I=ee("div","ae-diagnostics-report");b.append(O,y,q,ne,N,I);const re=ee("h4","","Nagranie syntetycznych zdarzeń i porównanie A/B"),V=ee("p","ae-diagnostics-hint","Zapisz wygenerowany przebieg do JSON, wczytaj go ponownie i wykonaj tę samą próbę przed i po zmianach sceny. Tylko udane, pełne próby można ustawić jako A albo B."),G=ee("div","ae-diagnostics-trace-controls"),me=ee("button","ae-button ae-button-secondary","Eksportuj ślad JSON"),ge=ee("button","ae-button ae-button-secondary","Importuj ślad"),de=ee("button","ae-button ae-button-primary","Odtwórz identyczny ślad"),fe=ee("button","ae-button ae-button-secondary","Zapisz wynik jako A"),le=ee("button","ae-button ae-button-secondary","Zapisz wynik jako B");for(const S of[me,ge,de,fe,le])S.type="button";const se=ee("input");se.type="file",se.accept=".json,application/json",se.hidden=!0,G.append(me,ge,de,fe,le,se);const ye=ee("p","ae-diagnostics-stress-status");ye.setAttribute("role","status");const pe=ee("div","ae-diagnostics-compare");b.append(re,V,G,ye,pe),f.appendChild(b),e.appendChild(f);const l=S=>{const $=t().find(L=>L.instanceId===S.instanceId)?.label?.slice(0,80)??S.instanceId.slice(0,24);return(Nc.get(S.event)??S.event)+" · P"+S.priority+" · "+$};function T(S=""){ye.textContent=S||(s?"Ślad: "+s.source+", "+s.events.length+" zdarzeń, "+(s.durationMs/1e3).toFixed(1)+" s. Tylko syntetyczne dane.":"Brak nagranego śladu. Uruchom pełny scenariusz albo zaimportuj JSON.");const $=n.isRunning();if(me.disabled=$||!s,de.disabled=$||!s,ge.disabled=$,fe.disabled=$||!i,le.disabled=$||!i,pe.replaceChildren(),!r&&!o){pe.appendChild(ee("p","ae-diagnostics-hint","Przeprowadź próbę, zapisz wynik jako A, zmień scenę i odtwórz ten sam ślad jako B."));return}const L=ee("p","","A: "+(r?"zapisano":"brak")+" · B: "+(o?"zapisano":"brak"));if(pe.appendChild(L),!r||!o)return;const C=Rc(r,o),F=ee("p",C.comparable?"ae-diagnostics-comparison-ok":"ae-diagnostics-comparison-warning",C.comparable?"Porównanie tego samego harmonogramu A → B":"Porównanie zablokowane — różne harmonogramy");pe.appendChild(F);for(const ae of C.reasons)pe.appendChild(ee("p","ae-diagnostics-hint",ae));if(!C.comparable)return;const U=ee("table","ae-diagnostics-compare-table"),Z=ee("tr");for(const ae of["Metryka","A","B","Zmiana B−A"])Z.appendChild(ee("th","",ae));const Q=ee("thead");Q.appendChild(Z),U.appendChild(Q);const ue=ee("tbody");for(const ae of C.measures){const be=ee("tr"),Ie=Pe=>Pe===null?"brak danych":String(Pe);be.appendChild(ee("th","",ae.label)),be.appendChild(ee("td","",Ie(ae.first))),be.appendChild(ee("td","",Ie(ae.second))),be.appendChild(ee("td","",ae.delta===null?"—":(ae.delta>0?"+":"")+ae.delta+(ae.unit?" "+ae.unit:""))),ue.appendChild(be)}U.appendChild(ue),pe.appendChild(U)}function R(S=""){const $=a.getSnapshot(),L=m.value,C=t().some(F=>F.enabled&&F.trigger?.event===L);P.textContent=S||(C?"Gotowy do symulacji wybranego zdarzenia.":"Brak włączonej warstwy reagującej na to zdarzenie."),A.replaceChildren();for(const[F,U]of[["Przyjęte",$.counters.accepted],["Uruchomione",$.counters.started],["Zakończone",$.counters.completed],["Odrzucone",$.counters.dropped],["Wyparte",$.counters.evicted]]){const Z=ee("span","",F+": "+U);A.appendChild(Z)}D.textContent=$.current?l($.current):"Brak aktywnej symulowanej animacji.",x.disabled=n.isRunning()||!$.current&&$.waiting.length===0,k.disabled=n.isRunning(),W.replaceChildren(),$.waiting.length||W.appendChild(ee("li","","Kolejka jest pusta."));for(const F of $.waiting)W.appendChild(ee("li","",l(F)));E.replaceChildren(),$.lines.length||E.appendChild(ee("li","","Brak zdarzeń diagnostycznych."));for(const F of $.lines){const U=Ac[F.reason]??F.reason;E.appendChild(ee("li","","#"+F.sequence+" · "+U+" · "+l(F)))}}const z=S=>{document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:S.instanceId,diagnostic:!0}}))};function v(S){if(n.isRunning())return;const $=te.value,L=S?.durationMs??Number(B.value),C=t();if(!C.some(U=>U.enabled&&U.trigger?.source==="event")){N.textContent="Dodaj co najmniej jedną włączoną warstwę z wyzwalaczem StreamElements.";return}document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),ie.disabled=!0,X.disabled=!1,te.disabled=!0,B.disabled=!0,T("Trwa próba. Zapis i porównanie będą dostępne po zakończeniu."),I.replaceChildren(),ne.value=0,N.textContent="Test wystartował; symulowane zdarzenia pojawiają się w czasie rzeczywistym.";const F={onPlay:z,onProgress:U=>{ne.value=Math.round(U.elapsedMs/U.durationMs*100);const Z=a.getSnapshot();N.textContent="Odtworzono "+U.dispatched+"/"+U.planned+" zdarzeń; kolejka: "+U.currentQueueSize+"; odrzucenia: "+Z.counters.dropped+"; maksimum oczekujących: "+U.waitingPeak+".",R()},onFinish:(U,Z)=>{ie.disabled=!1,X.disabled=!0,te.disabled=!1,B.disabled=!1;const Q=n.getTrace();Z==="completed"&&Q?(s=Q,i={traceKey:$c(Q),result:U},T("Zapisano syntetyczny harmonogram i wynik pełnej próby. Można eksportować, powtórzyć oraz ustawić A/B.")):(i=null,T("Niepełny pomiar nie jest dopuszczony do porównania A/B.")),ne.value=Math.round(U.durationMs/L*100);const ue=Z==="completed"?"Zakończono scenariusz.":Z==="hidden"?"Test przerwany: karta przeszła w tło (pomiar niemiarodajny).":"Zatrzymano test przed końcem.";N.textContent=ue+" Przetworzono "+U.dispatched+"/"+U.total+" zdarzeń.",I.replaceChildren();const ae=U.frame;I.appendChild(ee("p","","Oczekujące maksimum: "+U.waitingPeak+"/16 · odrzucenia: "+U.dropped+" · wyparcia: "+U.evicted+" · przyjęte: "+U.accepted)),I.appendChild(ee("p","","Rytm klatek rAF: "+(ae.approximateFps===null?"brak danych":"~"+ae.approximateFps+" FPS")+" · p95 odstępu: "+(ae.p95FrameMs??"brak")+" ms · klatki >33 ms: "+(ae.slowFramesPercent??"brak")+"% · próbek: "+ae.samples));const be=ee("ul","ae-diagnostics-findings");for(const Ie of U.warnings)be.appendChild(ee("li","",Ie));I.appendChild(be),R()}};S?n.startTrace(S,C,F):n.start($,L,C,F),T("Trwa odtwarzanie syntetycznego harmonogramu; eksport i porównanie są chwilowo zablokowane."),R()}return ie.addEventListener("click",()=>v()),X.addEventListener("click",()=>n.stop("stopped")),me.addEventListener("click",()=>{if(!s||n.isRunning())return;const S=new Blob([jc(s)],{type:"application/json"}),$=URL.createObjectURL(S),L=document.createElement("a");L.href=$,L.download="animated-effects-alert-trace-v1.json",document.body.appendChild(L),L.click(),L.remove(),window.setTimeout(()=>URL.revokeObjectURL($),1e3),T("Zapisano anonimowy ślad JSON. Plik zawiera jedynie syntetyczne typy, czasy i kwoty.")}),ge.addEventListener("click",()=>{n.isRunning()||se.click()}),se.addEventListener("change",async()=>{const S=se.files?.[0];if(se.value="",!(!S||n.isRunning())){if(S.size>ir){T("Nie można wczytać: rozmiar pliku przekracza 100 KB.");return}try{const $=_c(await S.text());s=$,i=null,T("Wczytano ślad: "+$.events.length+" zdarzeń. Odtwórz identyczny harmonogram, aby uzyskać wynik.")}catch($){T("Błąd importu: "+($ instanceof Error?$.message:"Nieznany format."))}}}),de.addEventListener("click",()=>{s&&!n.isRunning()&&v(s)}),fe.addEventListener("click",()=>{!i||n.isRunning()||(r={...i},T("Zapisano wynik A dla tej sekwencji testowej."))}),le.addEventListener("click",()=>{!i||n.isRunning()||(o={...i},T("Zapisano wynik B. Sprawdź porównanie poniżej."))}),T(),k.addEventListener("click",()=>{if(n.isRunning())return;const S=m.value,$=Number(w.value),L=Number(g.value),C=Number.isFinite($)?Math.max(1,Math.min(20,$)):1,F=Number.isFinite(L)?Math.max(0,Math.min(1e6,L)):0,U=t();if(!U.some(ue=>ue.enabled&&ue.trigger?.event===S)){R("Brak aktywnych warstw dla wybranego zdarzenia — ustaw wyzwalacz w Inspektorze.");return}const Q=Date.now();for(let ue=0;ue<C;ue++)for(const ae of a.dispatch(U,S,F,Q))z(ae);R("Symulowano "+C+" zdarzeń. Przycisk Następny alert przesuwa kolejkę ręcznie.")}),x.addEventListener("click",()=>{if(n.isRunning())return;const S=a.finishCurrent();S?z(S):document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),R(S?"Odtwarzanie następnego alertu z symulowanej kolejki.":"Symulowana kolejka zakończona.")}),M.addEventListener("click",()=>{n.stop("stopped"),i=null,a.reset(),T(),document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview")),R("Wyczyszczono stan lokalnego symulatora.")}),m.addEventListener("change",()=>R()),R(),{refresh:()=>{const S=c();d!==S?(d=S,n.stop("stopped"),i=null,a.reset(),T(),R("Zmieniono konfigurację sceny — symulacja została wyzerowana.")):R()}}}let hn=!1;function ma(e){document.querySelectorAll(".ae-polish02-menu[open]").forEach(t=>{t!==e&&(t.open=!1)})}function or(e){const t=Number(e.value);e.classList.toggle("is-boosted",t>100&&t<=200),e.classList.toggle("is-overdrive",t>200)}function gn(){document.querySelectorAll('#inspector input[type="range"]').forEach(or)}function Dc(){if(hn)return;hn=!0,document.addEventListener("toggle",t=>{const a=t.target;a instanceof HTMLDetailsElement&&a.matches(".ae-polish02-menu")&&a.open&&ma(a)},!0),document.addEventListener("pointerdown",t=>{const a=t.target;a instanceof Element&&(a.closest(".ae-polish02-menu")||ma())}),document.addEventListener("click",t=>{const a=t.target;if(a instanceof Element&&a.closest(".ae-polish02-menu-panel button")){const n=a.closest(".ae-polish02-menu");n&&(n.open=!1)}}),document.addEventListener("keydown",t=>{t.key==="Escape"&&ma()}),document.addEventListener("input",t=>{const a=t.target;a instanceof HTMLInputElement&&a.type==="range"&&a.closest("#inspector")&&or(a)});const e=document.querySelector("#inspector");if(e){let t=!1;const a=new MutationObserver(()=>{t||(t=!0,requestAnimationFrame(()=>{a.disconnect();try{gn()}finally{t=!1,a.observe(e,{childList:!0,subtree:!0})}}))});a.observe(e,{childList:!0,subtree:!0})}for(const t of[".ae-effect-library",".ae-layer-list",".ae-inspector-content",".ae-media-export"])document.querySelectorAll(t).forEach(a=>{a.addEventListener("wheel",n=>{n.stopPropagation()},{passive:!0})});gn()}let bn=!1,dt=null,Xt=!1,ya=!1;function nt(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function cr(){const e=document.querySelector("#inspector");!dt||!e||dt.observe(e,{childList:!0,subtree:!1})}function Tc(){ya||(ya=!0,dt?.disconnect(),queueMicrotask(()=>{try{lr()}finally{ya=!1,cr()}}))}function lr(){if(Xt)return;const e=document.querySelector("#inspector");if(e){Xt=!0,dt?.disconnect();try{e.querySelector("[data-pack09-character]")?.remove();const t=xt();if(!t)return;const a=ze(t.effectId),n=a?.customControls??[];if(n.length===0)return;const s=document.createElement("section");s.className="ae-pack09-character-panel",s.dataset.pack09Character="1",s.innerHTML=`
      <div class="ae-pack09-character-heading">
        <div>
          <strong>Charakter efektu</strong>
          <span>
            Parametry specyficzne dla
            ${nt(a?.name??t.effectId)}
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
        ${n.map(o=>{const c=t.settings.custom?.[o.key],d=Number.isFinite(c)?Number(c):o.defaultValue;return`
                <label class="ae-pack09-character-field">
                  <span class="ae-pack09-character-label">
                    <span>
                      <strong>${nt(o.label)}</strong>
                      <small>${nt(o.description??"")}</small>
                    </span>

                    <output data-pack09-output="${nt(o.key)}">
                      ${d}${o.suffix??""}
                    </output>
                  </span>

                  <input
                    type="range"
                    min="${o.min}"
                    max="${o.max}"
                    step="${o.step??1}"
                    value="${d}"
                    data-pack09-custom="${nt(o.key)}"
                    data-pack09-suffix="${nt(o.suffix??"")}"
                  >
                </label>
              `}).join("")}
      </div>

      <p class="ae-pack09-character-help">
        Te suwaki zmieniają konstrukcję efektu,
        a nie tylko kolor lub liczbę elementów.
        Wartości są zapisywane w scenie i eksporcie.
      </p>
    `;const i=e.querySelector(".inspector-color-panel"),r=e.querySelector(".inspector-group");i?.nextSibling?e.insertBefore(s,i.nextSibling):r?e.insertBefore(s,r):e.appendChild(s),s.querySelectorAll("[data-pack09-custom]").forEach(o=>{o.addEventListener("input",()=>{const c=o.dataset.pack09Custom;if(!c)return;const d=xt();if(!d)return;const f=s.querySelector(`[data-pack09-output="${CSS.escape(c)}"]`);f&&(f.value=`${o.value}${o.dataset.pack09Suffix??""}`),Se(d.instanceId,{custom:{...d.settings.custom??{},[c]:Number(o.value)}})})}),s.querySelectorAll("[data-pack09-preset]").forEach(o=>{o.addEventListener("click",()=>{const c=o.dataset.pack09Preset,d=xt();if(!d||!a)return;const f={...d.settings.custom??{}};for(const p of n){let b=p.defaultValue;c==="soft"?b*=.72:c==="strong"?b*=1.45:c==="random"&&(b+=(Math.random()*2-1)*(p.max-p.min)*.28);const u=p.step??1;f[p.key]=Math.max(p.min,Math.min(p.max,Math.round(b/u)*u))}Se(d.instanceId,{custom:f})})})}finally{dt?.observe(e,{childList:!0,subtree:!1}),Xt=!1}}}function Oc(){bn||(bn=!0,!document.querySelector("#inspector"))||(dt=new MutationObserver(t=>{if(Xt)return;t.some(n=>Array.from(n.addedNodes).concat(Array.from(n.removedNodes)).some(i=>!(i instanceof HTMLElement&&i.matches("[data-pack09-character]"))))&&Tc()}),lr(),cr())}let wn=!1;function kn(e){return(e??"").trim().toLocaleLowerCase("pl")}function Lt(e,t){const a=kn(t);return Array.from(e.querySelectorAll(":scope > .inspector-group")).find(n=>{if(n.matches(".ae-pack06-inspector"))return!1;const s=n.querySelector(".inspector-group-heading strong")??n.querySelector("strong");return kn(s?.textContent??null)===a})??null}function qc(){const e=document.querySelector("#inspector");if(!e)return;const t=e.querySelector(":scope > .inspector-title"),a=e.querySelector(":scope > .inspector-variant-panel"),n=e.querySelector(":scope > [data-pack09-character]"),s=e.querySelector(":scope > .ae-pack06-inspector"),i=e.querySelector(":scope > .inspector-color-panel"),r=Lt(e,"Podstawowe"),o=Lt(e,"Transformacja"),c=Lt(e,"Wygląd"),d=Lt(e,"Kompozycja"),f=[t,a,n,r,i,s,o,c,d].filter(p=>!!p);for(const p of f)e.appendChild(p);e.classList.add("ae-ui10-inspector-ordered")}function vn(){document.documentElement.style.setProperty("--ae-ui10-vh",`${window.innerHeight}px`)}function Fc(){wn||(wn=!0,vn(),window.addEventListener("resize",vn,{passive:!0}))}const dr="animated-effects-scene",pr=1,Za="animated-effects:pack06:recovery";function xe(e,t,a,n){const s=typeof e=="number"?e:Number(e);return Number.isFinite(s)?Math.min(n,Math.max(a,s)):t}function xn(e,t,a=[]){const n=e&&typeof e=="object"?e:{},s=["normal","screen","lighten","multiply","overlay"],i=["full","left","center","right","top","bottom"],r=s.includes(n.blendMode)?n.blendMode:t.blendMode,o=i.includes(n.area)?n.area:t.area,c=typeof n.color=="string"&&/^#[0-9a-f]{6}$/i.test(n.color)?n.color:t.color,d=n.custom&&typeof n.custom=="object"&&!Array.isArray(n.custom)?n.custom:{},f=new Map(a.map(u=>[u.key,u])),p=new Set([...Object.keys(t.custom??{}),...a.map(u=>u.key)]),b={};for(const u of p){const h=f.get(u),m=t.custom?.[u]??h?.defaultValue??0;b[u]=xe(d[u],m,h?.min??-1e6,h?.max??1e6)}return{opacity:xe(n.opacity,t.opacity,0,100),scale:xe(n.scale,t.scale,10,400),x:xe(n.x,t.x,-300,300),y:xe(n.y,t.y,-300,300),rotation:xe(n.rotation,t.rotation,-1080,1080),blur:xe(n.blur,t.blur,0,100),brightness:xe(n.brightness,t.brightness,0,500),hue:xe(n.hue,t.hue,-1080,1080),color:c,colorize:typeof n.colorize=="boolean"?n.colorize:t.colorize,density:xe(n.density,t.density,0,400),blendMode:r,area:o,zIndex:xe(n.zIndex,t.zIndex,-1e3,1e3),speed:xe(n.speed,t.speed,1,500),intensity:xe(n.intensity,t.intensity,0,200),custom:p.size?b:void 0}}function Bc(e,t="Animated Effects Scene"){return{format:dr,version:pr,name:t,createdAt:new Date().toISOString(),resolution:structuredClone(e.resolution),backgroundOnly:e.backgroundOnly,palette:structuredClone(e.palette),background:structuredClone(e.background),focusZone:e.focusZone,safeZone:e.safeZone,effects:structuredClone(e.effects)}}function Ha(e,t){return JSON.stringify(Bc(e,t),null,2)}function ur(e,t){const a=JSON.parse(e);if(!a||typeof a!="object"||Array.isArray(a))throw new Error("Nieprawidłowy format sceny.");const n=a;if(n.format!==dr)throw new Error("To nie jest plik Animated Effects Scene.");if(n.version!==pr)throw new Error(`Nieobsługiwana wersja sceny: ${String(n.version)}.`);const s=[],i=new Set,r=[],o=Array.isArray(n.effects)?n.effects:[];for(const b of o){if(!b||typeof b!="object"){s.push("Pominięto nieprawidłową warstwę.");continue}const u=b,h=typeof u.effectId=="string"?u.effectId:"",m=ze(h);if(!m){s.push(`Pominięto nieznany efekt: ${h||"(brak id)"}.`);continue}let g=typeof u.instanceId=="string"&&u.instanceId?u.instanceId:crypto.randomUUID();i.has(g)&&(s.push(`Naprawiono powtórzone instanceId: ${h}.`),g=crypto.randomUUID()),i.add(g),r.push({instanceId:g,effectId:h,seed:xe(u.seed,Math.floor(Math.random()*4294967295),0,4294967295),enabled:typeof u.enabled=="boolean"?u.enabled:!0,settings:xn(u.settings,m.defaultSettings,m.customControls),label:typeof u.label=="string"&&u.label.trim().slice(0,80)||void 0,locked:u.locked===!0,groupId:typeof u.groupId=="string"?u.groupId:null,timeline:u.timeline==null?void 0:ve(u.timeline,xn(u.settings,m.defaultSettings,m.customControls)),trigger:Ae(u.trigger)})}const c=n.resolution&&typeof n.resolution=="object"?n.resolution:{},d={...structuredClone(t),resolution:{width:xe(c.width,t.resolution.width,240,7680),height:xe(c.height,t.resolution.height,240,4320)},effects:r,selectedEffectInstanceId:r.at(-1)?.instanceId??null,activePresetId:null};n.palette&&typeof n.palette=="object"&&(d.palette={...d.palette,...n.palette}),n.background&&typeof n.background=="object"&&(d.background={...d.background,...n.background}),typeof n.backgroundOnly=="boolean"&&(d.backgroundOnly=n.backgroundOnly);const f=["none","left","center","right","top","bottom"],p=["off","left","center","right","top","bottom","full"];return f.includes(n.focusZone)&&(d.focusZone=n.focusZone),p.includes(n.safeZone)&&(d.safeZone=n.safeZone),{state:d,warnings:s,name:typeof n.name=="string"?n.name.slice(0,120):"Imported Scene"}}function Wc(e,t){const a=URL.createObjectURL(e),n=document.createElement("a");n.href=a,n.download=t,n.click(),setTimeout(()=>URL.revokeObjectURL(a),1500)}function Uc(e){Wc(new Blob([Ha(e)],{type:"application/json;charset=utf-8"}),`animated-effects-${Date.now()}.aescene.json`)}function Xc(e){try{localStorage.setItem(Za,Ha(e,"Recovery Draft"))}catch{}}function Zc(){try{return!!localStorage.getItem(Za)}catch{return!1}}function Hc(e){try{const t=localStorage.getItem(Za);return t?ur(t,e).state:null}catch{return null}}const zn=[{id:"cyber-rain",name:"Cyber Rain",effects:[{effectId:"rainfall",settings:{hue:80,density:70,speed:125,blendMode:"screen"}},{effectId:"data-nodes",settings:{opacity:48,density:42}},{effectId:"hologram-scan",settings:{opacity:32}}]},{id:"winter-night",name:"Winter Night",effects:[{effectId:"snow",settings:{density:65,speed:62}},{effectId:"starfield",settings:{opacity:46,density:48}},{effectId:"fog",settings:{opacity:28,y:25}}]},{id:"arcane-ritual",name:"Arcane Ritual",effects:[{effectId:"magic-circle"},{effectId:"floating-symbols"},{effectId:"fractal-rings",settings:{opacity:42}}]},{id:"retro-crt",name:"Retro CRT",effects:[{effectId:"scanlines-plus"},{effectId:"vhs-static",settings:{opacity:34}},{effectId:"recursive-squares",settings:{opacity:30,hue:95}}]},{id:"cosmic-drift",name:"Cosmic Drift",effects:[{effectId:"spiral-galaxy"},{effectId:"meteor-shower",settings:{opacity:55}},{effectId:"orbiting-core",settings:{opacity:45}}]},{id:"ember-forge",name:"Ember Forge",effects:[{effectId:"embers"},{effectId:"sparks",settings:{opacity:58}},{effectId:"gears",settings:{opacity:35}}]},{id:"neon-city",name:"Neon City",effects:[{effectId:"city-lights"},{effectId:"traffic-trails"},{effectId:"neon-tunnel",settings:{opacity:28}}]},{id:"calm-ambient",name:"Calm Ambient",effects:[{effectId:"dust-motes",settings:{opacity:32}},{effectId:"liquid-blobs",settings:{opacity:28,speed:35}},{effectId:"starfield",settings:{opacity:24}}]}];function Yc(e,t){if(e.match(/^[a-z]+:\/\//i))return e;if(e.match(/^\/\//))return window.location.protocol+e;if(e.match(/^[a-z]+:/i))return e;const a=document.implementation.createHTMLDocument(),n=a.createElement("base"),s=a.createElement("a");return a.head.appendChild(n),a.body.appendChild(s),t&&(n.href=t),s.href=e,s.href}const Gc=(()=>{let e=0;const t=()=>`0000${(Math.random()*36**4<<0).toString(36)}`.slice(-4);return()=>(e+=1,`u${t()}${e}`)})();function Ue(e){const t=[];for(let a=0,n=e.length;a<n;a++)t.push(e[a]);return t}let rt=null;function fr(e={}){return rt||(e.includeStyleProperties?(rt=e.includeStyleProperties,rt):(rt=Ue(window.getComputedStyle(document.documentElement)),rt))}function Vt(e,t){const n=(e.ownerDocument.defaultView||window).getComputedStyle(e).getPropertyValue(t);return n?parseFloat(n.replace("px","")):0}function Jc(e){const t=Vt(e,"border-left-width"),a=Vt(e,"border-right-width");return e.clientWidth+t+a}function Vc(e){const t=Vt(e,"border-top-width"),a=Vt(e,"border-bottom-width");return e.clientHeight+t+a}function mr(e,t={}){const a=t.width||Jc(e),n=t.height||Vc(e);return{width:a,height:n}}function Kc(){let e,t;try{t=process}catch{}const a=t&&t.env?t.env.devicePixelRatio:null;return a&&(e=parseInt(a,10),Number.isNaN(e)&&(e=1)),e||window.devicePixelRatio||1}const Ce=16384;function Qc(e){(e.width>Ce||e.height>Ce)&&(e.width>Ce&&e.height>Ce?e.width>e.height?(e.height*=Ce/e.width,e.width=Ce):(e.width*=Ce/e.height,e.height=Ce):e.width>Ce?(e.height*=Ce/e.width,e.width=Ce):(e.width*=Ce/e.height,e.height=Ce))}function Kt(e){return new Promise((t,a)=>{const n=new Image;n.onload=()=>{n.decode().then(()=>{requestAnimationFrame(()=>t(n))})},n.onerror=a,n.crossOrigin="anonymous",n.decoding="async",n.src=e})}async function el(e){return Promise.resolve().then(()=>new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then(t=>`data:image/svg+xml;charset=utf-8,${t}`)}async function tl(e,t,a){const n="http://www.w3.org/2000/svg",s=document.createElementNS(n,"svg"),i=document.createElementNS(n,"foreignObject");return s.setAttribute("width",`${t}`),s.setAttribute("height",`${a}`),s.setAttribute("viewBox",`0 0 ${t} ${a}`),i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("x","0"),i.setAttribute("y","0"),i.setAttribute("externalResourcesRequired","true"),s.appendChild(i),i.appendChild(e),el(s)}const Me=(e,t)=>{if(e instanceof t)return!0;const a=Object.getPrototypeOf(e);return a===null?!1:a.constructor.name===t.name||Me(a,t)};function al(e){const t=e.getPropertyValue("content");return`${e.cssText} content: '${t.replace(/'|"/g,"")}';`}function nl(e,t){return fr(t).map(a=>{const n=e.getPropertyValue(a),s=e.getPropertyPriority(a);return`${a}: ${n}${s?" !important":""};`}).join(" ")}function rl(e,t,a,n){const s=`.${e}:${t}`,i=a.cssText?al(a):nl(a,n);return document.createTextNode(`${s}{${i}}`)}function Sn(e,t,a,n){const s=window.getComputedStyle(e,a),i=s.getPropertyValue("content");if(i===""||i==="none")return;const r=Gc();try{t.className=`${t.className} ${r}`}catch{return}const o=document.createElement("style");o.appendChild(rl(r,a,s,n)),t.appendChild(o)}function sl(e,t,a){Sn(e,t,":before",a),Sn(e,t,":after",a)}const Mn="application/font-woff",En="image/jpeg",il={woff:Mn,woff2:Mn,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:En,jpeg:En,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml",webp:"image/webp"};function ol(e){const t=/\.([^./]*?)$/g.exec(e);return t?t[1]:""}function Ya(e){const t=ol(e).toLowerCase();return il[t]||""}function cl(e){return e.split(/,/)[1]}function Pa(e){return e.search(/^(data:)/)!==-1}function ll(e,t){return`data:${t};base64,${e}`}async function yr(e,t,a){const n=await fetch(e,t);if(n.status===404)throw new Error(`Resource "${n.url}" not found`);const s=await n.blob();return new Promise((i,r)=>{const o=new FileReader;o.onerror=r,o.onloadend=()=>{try{i(a({res:n,result:o.result}))}catch(c){r(c)}},o.readAsDataURL(s)})}const ha={};function dl(e,t,a){let n=e.replace(/\?.*/,"");return a&&(n=e),/ttf|otf|eot|woff2?/i.test(n)&&(n=n.replace(/.*\//,"")),t?`[${t}]${n}`:n}async function Ga(e,t,a){const n=dl(e,t,a.includeQueryParams);if(ha[n]!=null)return ha[n];a.cacheBust&&(e+=(/\?/.test(e)?"&":"?")+new Date().getTime());let s;try{const i=await yr(e,a.fetchRequestInit,({res:r,result:o})=>(t||(t=r.headers.get("Content-Type")||""),cl(o)));s=ll(i,t)}catch(i){s=a.imagePlaceholder||"";let r=`Failed to fetch resource: ${e}`;i&&(r=typeof i=="string"?i:i.message),r&&console.warn(r)}return ha[n]=s,s}async function pl(e){const t=e.toDataURL();return t==="data:,"?e.cloneNode(!1):Kt(t)}async function ul(e,t){if(e.currentSrc){const i=document.createElement("canvas"),r=i.getContext("2d");i.width=e.clientWidth,i.height=e.clientHeight,r?.drawImage(e,0,0,i.width,i.height);const o=i.toDataURL();return Kt(o)}const a=e.poster,n=Ya(a),s=await Ga(a,n,t);return Kt(s)}async function fl(e,t){var a;try{if(!((a=e?.contentDocument)===null||a===void 0)&&a.body)return await da(e.contentDocument.body,t,!0)}catch{}return e.cloneNode(!1)}async function ml(e,t){return Me(e,HTMLCanvasElement)?pl(e):Me(e,HTMLVideoElement)?ul(e,t):Me(e,HTMLIFrameElement)?fl(e,t):e.cloneNode(hr(e))}const yl=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SLOT",hr=e=>e.tagName!=null&&e.tagName.toUpperCase()==="SVG";async function hl(e,t,a){var n,s;if(hr(t))return t;let i=[];return yl(e)&&e.assignedNodes?i=Ue(e.assignedNodes()):Me(e,HTMLIFrameElement)&&(!((n=e.contentDocument)===null||n===void 0)&&n.body)?i=Ue(e.contentDocument.body.childNodes):i=Ue(((s=e.shadowRoot)!==null&&s!==void 0?s:e).childNodes),i.length===0||Me(e,HTMLVideoElement)||await i.reduce((r,o)=>r.then(()=>da(o,a)).then(c=>{c&&t.appendChild(c)}),Promise.resolve()),t}function gl(e,t,a){const n=t.style;if(!n)return;const s=window.getComputedStyle(e);s.cssText?(n.cssText=s.cssText,n.transformOrigin=s.transformOrigin):fr(a).forEach(i=>{let r=s.getPropertyValue(i);i==="font-size"&&r.endsWith("px")&&(r=`${Math.floor(parseFloat(r.substring(0,r.length-2)))-.1}px`),Me(e,HTMLIFrameElement)&&i==="display"&&r==="inline"&&(r="block"),i==="d"&&t.getAttribute("d")&&(r=`path(${t.getAttribute("d")})`),n.setProperty(i,r,s.getPropertyPriority(i))})}function bl(e,t){Me(e,HTMLTextAreaElement)&&(t.innerHTML=e.value),Me(e,HTMLInputElement)&&t.setAttribute("value",e.value)}function wl(e,t){if(Me(e,HTMLSelectElement)){const n=Array.from(t.children).find(s=>e.value===s.getAttribute("value"));n&&n.setAttribute("selected","")}}function kl(e,t,a){return Me(t,Element)&&(gl(e,t,a),sl(e,t,a),bl(e,t),wl(e,t)),t}async function vl(e,t){const a=e.querySelectorAll?e.querySelectorAll("use"):[];if(a.length===0)return e;const n={};for(let i=0;i<a.length;i++){const o=a[i].getAttribute("xlink:href");if(o){const c=e.querySelector(o),d=document.querySelector(o);!c&&d&&!n[o]&&(n[o]=await da(d,t,!0))}}const s=Object.values(n);if(s.length){const i="http://www.w3.org/1999/xhtml",r=document.createElementNS(i,"svg");r.setAttribute("xmlns",i),r.style.position="absolute",r.style.width="0",r.style.height="0",r.style.overflow="hidden",r.style.display="none";const o=document.createElementNS(i,"defs");r.appendChild(o);for(let c=0;c<s.length;c++)o.appendChild(s[c]);e.appendChild(r)}return e}async function da(e,t,a){return!a&&t.filter&&!t.filter(e)?null:Promise.resolve(e).then(n=>ml(n,t)).then(n=>hl(e,n,t)).then(n=>kl(e,n,t)).then(n=>vl(n,t))}const gr=/url\((['"]?)([^'"]+?)\1\)/g,xl=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,zl=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function Sl(e){const t=e.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1");return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`,"g")}function Ml(e){const t=[];return e.replace(gr,(a,n,s)=>(t.push(s),a)),t.filter(a=>!Pa(a))}async function El(e,t,a,n,s){try{const i=a?Yc(t,a):t,r=Ya(t);let o;return s||(o=await Ga(i,r,n)),e.replace(Sl(t),`$1${o}$3`)}catch{}return e}function Pl(e,{preferredFontFormat:t}){return t?e.replace(zl,a=>{for(;;){const[n,,s]=xl.exec(a)||[];if(!s)return"";if(s===t)return`src: ${n};`}}):e}function br(e){return e.search(gr)!==-1}async function wr(e,t,a){if(!br(e))return e;const n=Pl(e,a);return Ml(n).reduce((i,r)=>i.then(o=>El(o,r,t,a)),Promise.resolve(n))}async function st(e,t,a){var n;const s=(n=t.style)===null||n===void 0?void 0:n.getPropertyValue(e);if(s){const i=await wr(s,null,a);return t.style.setProperty(e,i,t.style.getPropertyPriority(e)),!0}return!1}async function Cl(e,t){await st("background",e,t)||await st("background-image",e,t),await st("mask",e,t)||await st("-webkit-mask",e,t)||await st("mask-image",e,t)||await st("-webkit-mask-image",e,t)}async function jl(e,t){const a=Me(e,HTMLImageElement);if(!(a&&!Pa(e.src))&&!(Me(e,SVGImageElement)&&!Pa(e.href.baseVal)))return;const n=a?e.src:e.href.baseVal,s=await Ga(n,Ya(n),t);await new Promise((i,r)=>{e.onload=i,e.onerror=t.onImageErrorHandler?(...c)=>{try{i(t.onImageErrorHandler(...c))}catch(d){r(d)}}:r;const o=e;o.decode&&(o.decode=i),o.loading==="lazy"&&(o.loading="eager"),a?(e.srcset="",e.src=s):e.href.baseVal=s})}async function _l(e,t){const n=Ue(e.childNodes).map(s=>kr(s,t));await Promise.all(n).then(()=>e)}async function kr(e,t){Me(e,Element)&&(await Cl(e,t),await jl(e,t),await _l(e,t))}function $l(e,t){const{style:a}=e;t.backgroundColor&&(a.backgroundColor=t.backgroundColor),t.width&&(a.width=`${t.width}px`),t.height&&(a.height=`${t.height}px`);const n=t.style;return n!=null&&Object.keys(n).forEach(s=>{a[s]=n[s]}),e}const Pn={};async function Cn(e){let t=Pn[e];if(t!=null)return t;const n=await(await fetch(e)).text();return t={url:e,cssText:n},Pn[e]=t,t}async function jn(e,t){let a=e.cssText;const n=/url\(["']?([^"')]+)["']?\)/g,i=(a.match(/url\([^)]+\)/g)||[]).map(async r=>{let o=r.replace(n,"$1");return o.startsWith("https://")||(o=new URL(o,e.url).href),yr(o,t.fetchRequestInit,({result:c})=>(a=a.replace(r,`url(${c})`),[r,c]))});return Promise.all(i).then(()=>a)}function _n(e){if(e==null)return[];const t=[],a=/(\/\*[\s\S]*?\*\/)/gi;let n=e.replace(a,"");const s=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");for(;;){const c=s.exec(n);if(c===null)break;t.push(c[0])}n=n.replace(s,"");const i=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,r="((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",o=new RegExp(r,"gi");for(;;){let c=i.exec(n);if(c===null){if(c=o.exec(n),c===null)break;i.lastIndex=o.lastIndex}else o.lastIndex=i.lastIndex;t.push(c[0])}return t}async function Rl(e,t){const a=[],n=[];return e.forEach(s=>{if("cssRules"in s)try{Ue(s.cssRules||[]).forEach((i,r)=>{if(i.type===CSSRule.IMPORT_RULE){let o=r+1;const c=i.href,d=Cn(c).then(f=>jn(f,t)).then(f=>_n(f).forEach(p=>{try{s.insertRule(p,p.startsWith("@import")?o+=1:s.cssRules.length)}catch(b){console.error("Error inserting rule from remote css",{rule:p,error:b})}})).catch(f=>{console.error("Error loading remote css",f.toString())});n.push(d)}})}catch(i){const r=e.find(o=>o.href==null)||document.styleSheets[0];s.href!=null&&n.push(Cn(s.href).then(o=>jn(o,t)).then(o=>_n(o).forEach(c=>{r.insertRule(c,r.cssRules.length)})).catch(o=>{console.error("Error loading remote stylesheet",o)})),console.error("Error inlining remote css file",i)}}),Promise.all(n).then(()=>(e.forEach(s=>{if("cssRules"in s)try{Ue(s.cssRules||[]).forEach(i=>{a.push(i)})}catch(i){console.error(`Error while reading CSS rules from ${s.href}`,i)}}),a))}function Il(e){return e.filter(t=>t.type===CSSRule.FONT_FACE_RULE).filter(t=>br(t.style.getPropertyValue("src")))}async function Al(e,t){if(e.ownerDocument==null)throw new Error("Provided element is not within a Document");const a=Ue(e.ownerDocument.styleSheets),n=await Rl(a,t);return Il(n)}function vr(e){return e.trim().replace(/["']/g,"")}function Nl(e){const t=new Set;function a(n){(n.style.fontFamily||getComputedStyle(n).fontFamily).split(",").forEach(i=>{t.add(vr(i))}),Array.from(n.children).forEach(i=>{i instanceof HTMLElement&&a(i)})}return a(e),t}async function Ll(e,t){const a=await Al(e,t),n=Nl(e);return(await Promise.all(a.filter(i=>n.has(vr(i.style.fontFamily))).map(i=>{const r=i.parentStyleSheet?i.parentStyleSheet.href:null;return wr(i.cssText,r,t)}))).join(`
`)}async function Dl(e,t){const a=t.fontEmbedCSS!=null?t.fontEmbedCSS:t.skipFonts?null:await Ll(e,t);if(a){const n=document.createElement("style"),s=document.createTextNode(a);n.appendChild(s),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n)}}async function Tl(e,t={}){const{width:a,height:n}=mr(e,t),s=await da(e,t,!0);return await Dl(s,t),await kr(s,t),$l(s,t),await tl(s,a,n)}async function Ol(e,t={}){const{width:a,height:n}=mr(e,t),s=await Tl(e,t),i=await Kt(s),r=document.createElement("canvas"),o=r.getContext("2d"),c=t.pixelRatio||Kc(),d=t.canvasWidth||a,f=t.canvasHeight||n;return r.width=d*c,r.height=f*c,t.skipAutoScale||Qc(r),r.style.width=`${d}`,r.style.height=`${f}`,t.backgroundColor&&(o.fillStyle=t.backgroundColor,o.fillRect(0,0,r.width,r.height)),o.drawImage(i,0,0,r.width,r.height),r}var ql={trailer:59};function xr(e=256){let t=0,a=new Uint8Array(e);return{get buffer(){return a.buffer},reset(){t=0},bytesView(){return a.subarray(0,t)},bytes(){return a.slice(0,t)},writeByte(s){n(t+1),a[t]=s,t++},writeBytes(s,i=0,r=s.length){n(t+r);for(let o=0;o<r;o++)a[t++]=s[o+i]},writeBytesView(s,i=0,r=s.byteLength){n(t+r),a.set(s.subarray(i,i+r),t),t+=r}};function n(s){var i=a.length;if(i>=s)return;var r=1024*1024;s=Math.max(s,i*(i<r?2:1.125)>>>0),i!=0&&(s=Math.max(s,256));let o=a;a=new Uint8Array(s),t>0&&a.set(o.subarray(0,t),0)}}var ga=12,$n=5003,Fl=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function Bl(e,t,a,n,s=xr(512),i=new Uint8Array(256),r=new Int32Array($n),o=new Int32Array($n)){let c=r.length,d=Math.max(2,n);i.fill(0),o.fill(0),r.fill(-1);let f=0,p=0,b=d+1,u=b,h=!1,m=u,g=(1<<m)-1,w=1<<b-1,k=w+1,x=w+2,M=0,P=a[0],A=0;for(let j=c;j<65536;j*=2)++A;A=8-A,s.writeByte(d),D(w);let _=a.length;for(let j=1;j<_;j++)e:{let W=a[j],K=(W<<ga)+P,E=W<<A^P;if(r[E]===K){P=o[E];break e}let O=E===0?1:c-E;for(;r[E]>=0;)if(E-=O,E<0&&(E+=c),r[E]===K){P=o[E];break e}D(P),P=W,x<1<<ga?(o[E]=x++,r[E]=K):(r.fill(-1),x=w+2,h=!0,D(w))}return D(P),D(k),s.writeByte(0),s.bytesView();function D(j){for(f&=Fl[p],p>0?f|=j<<p:f=j,p+=m;p>=8;)i[M++]=f&255,M>=254&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0),f>>=8,p-=8;if((x>g||h)&&(h?(m=u,g=(1<<m)-1,h=!1):(++m,g=m===ga?1<<m:(1<<m)-1)),j==k){for(;p>0;)i[M++]=f&255,M>=254&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0),f>>=8,p-=8;M>0&&(s.writeByte(M),s.writeBytesView(i,0,M),M=0)}}}var Wl=Bl;function zr(e,t,a){return e<<8&63488|t<<2&992|a>>3}function Sr(e,t,a,n){return e>>4|t&240|(a&240)<<4|(n&240)<<8}function Mr(e,t,a){return e>>4<<8|t&240|a>>4}function Dt(e,t,a){return e<t?t:e>a?a:e}function Zt(e){return e*e}function Rn(e,t,a){var n=0,s=1e100;let i=e[t],r=i.cnt;i.ac;let o=i.rc,c=i.gc,d=i.bc;for(var f=i.fw;f!=0;f=e[f].fw){let b=e[f],u=b.cnt,h=r*u/(r+u);if(!(h>=s)){var p=0;p+=h*Zt(b.rc-o),!(p>=s)&&(p+=h*Zt(b.gc-c),!(p>=s)&&(p+=h*Zt(b.bc-d),!(p>=s)&&(s=p,n=f)))}}i.err=s,i.nn=n}function ba(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function Ul(e,t){let a=t==="rgb444"?4096:65536,n=new Array(a),s=e.length;if(t==="rgba4444")for(let i=0;i<s;++i){let r=e[i],o=r>>24&255,c=r>>16&255,d=r>>8&255,f=r&255,p=Sr(f,d,c,o),b=p in n?n[p]:n[p]=ba();b.rc+=f,b.gc+=d,b.bc+=c,b.ac+=o,b.cnt++}else if(t==="rgb444")for(let i=0;i<s;++i){let r=e[i],o=r>>16&255,c=r>>8&255,d=r&255,f=Mr(d,c,o),p=f in n?n[f]:n[f]=ba();p.rc+=d,p.gc+=c,p.bc+=o,p.cnt++}else for(let i=0;i<s;++i){let r=e[i],o=r>>16&255,c=r>>8&255,d=r&255,f=zr(d,c,o),p=f in n?n[f]:n[f]=ba();p.rc+=d,p.gc+=c,p.bc+=o,p.cnt++}return n}function Xl(e,t,a={}){let{format:n="rgb565",clearAlpha:s=!0,clearAlphaColor:i=0,clearAlphaThreshold:r=0,oneBitAlpha:o=!1}=a;if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");let c=new Uint32Array(e.buffer),d=a.useSqrt!==!1,f=n==="rgba4444",p=Ul(c,n),b=p.length,u=b-1,h=new Uint32Array(b+1);for(var m=0,g=0;g<b;++g){let y=p[g];if(y!=null){var w=1/y.cnt;f&&(y.ac*=w),y.rc*=w,y.gc*=w,y.bc*=w,p[m++]=y}}Zt(t)/m<.022&&(d=!1);for(var g=0;g<m-1;++g)p[g].fw=g+1,p[g+1].bk=g,d&&(p[g].cnt=Math.sqrt(p[g].cnt));d&&(p[g].cnt=Math.sqrt(p[g].cnt));var k,x,M;for(g=0;g<m;++g){Rn(p,g);var P=p[g].err;for(x=++h[0];x>1&&(M=x>>1,!(p[k=h[M]].err<=P));x=M)h[x]=k;h[x]=g}var A=m-t;for(g=0;g<A;){for(var _;;){var D=h[1];if(_=p[D],_.tm>=_.mtm&&p[_.nn].mtm<=_.tm)break;_.mtm==u?D=h[1]=h[h[0]--]:(Rn(p,D),_.tm=g);var P=p[D].err;for(x=1;(M=x+x)<=h[0]&&(M<h[0]&&p[h[M]].err>p[h[M+1]].err&&M++,!(P<=p[k=h[M]].err));x=M)h[x]=k;h[x]=D}var j=p[_.nn],W=_.cnt,K=j.cnt,w=1/(W+K);f&&(_.ac=w*(W*_.ac+K*j.ac)),_.rc=w*(W*_.rc+K*j.rc),_.gc=w*(W*_.gc+K*j.gc),_.bc=w*(W*_.bc+K*j.bc),_.cnt+=j.cnt,_.mtm=++g,p[j.bk].fw=j.fw,p[j.fw].bk=j.bk,j.mtm=u}let E=[];var O=0;for(g=0;;++O){let y=Dt(Math.round(p[g].rc),0,255),q=Dt(Math.round(p[g].gc),0,255),te=Dt(Math.round(p[g].bc),0,255),B=255;f&&(B=Dt(Math.round(p[g].ac),0,255),o&&(B=B<=(typeof o=="number"?o:127)?0:255),s&&B<=r&&(y=q=te=i,B=0));let ie=f?[y,q,te,B]:[y,q,te];if(Zl(E,ie)||E.push(ie),(g=p[g].fw)==0)break}return E}function Zl(e,t){for(let a=0;a<e.length;a++){let n=e[a],s=n[0]===t[0]&&n[1]===t[1]&&n[2]===t[2],i=n.length>=4&&t.length>=4?n[3]===t[3]:!0;if(s&&i)return!0}return!1}function Hl(e,t,a="rgb565"){if(!e||!e.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");if(t.length>256)throw new Error("applyPalette() only works with 256 colors or less");let n=new Uint32Array(e.buffer),s=n.length,i=a==="rgb444"?4096:65536,r=new Uint8Array(s),o=new Array(i);if(a==="rgba4444")for(let c=0;c<s;c++){let d=n[c],f=d>>24&255,p=d>>16&255,b=d>>8&255,u=d&255,h=Sr(u,b,p,f),m=h in o?o[h]:o[h]=Yl(u,b,p,f,t);r[c]=m}else{let c=a==="rgb444"?Mr:zr;for(let d=0;d<s;d++){let f=n[d],p=f>>16&255,b=f>>8&255,u=f&255,h=c(u,b,p),m=h in o?o[h]:o[h]=Gl(u,b,p,t);r[d]=m}}return r}function Yl(e,t,a,n,s){let i=0,r=1e100;for(let o=0;o<s.length;o++){let c=s[o],d=c[3],f=Ge(d-n);if(f>r)continue;let p=c[0];if(f+=Ge(p-e),f>r)continue;let b=c[1];if(f+=Ge(b-t),f>r)continue;let u=c[2];f+=Ge(u-a),!(f>r)&&(r=f,i=o)}return i}function Gl(e,t,a,n){let s=0,i=1e100;for(let r=0;r<n.length;r++){let o=n[r],c=o[0],d=Ge(c-e);if(d>i)continue;let f=o[1];if(d+=Ge(f-t),d>i)continue;let p=o[2];d+=Ge(p-a),!(d>i)&&(i=d,s=r)}return s}function Ge(e){return e*e}function Jl(e={}){let{initialCapacity:t=4096,auto:a=!0}=e,n=xr(t),s=5003,i=new Uint8Array(256),r=new Int32Array(s),o=new Int32Array(s),c=!1;return{reset(){n.reset(),c=!1},finish(){n.writeByte(ql.trailer)},bytes(){return n.bytes()},bytesView(){return n.bytesView()},get buffer(){return n.buffer},get stream(){return n},writeHeader:d,writeFrame(f,p,b,u={}){let{transparent:h=!1,transparentIndex:m=0,delay:g=0,palette:w=null,repeat:k=0,colorDepth:x=8,dispose:M=-1}=u,P=!1;if(a?c||(P=!0,d(),c=!0):P=!!u.first,p=Math.max(0,Math.floor(p)),b=Math.max(0,Math.floor(b)),P){if(!w)throw new Error("First frame must include a { palette } option");Kl(n,p,b,w,x),In(n,w),k>=0&&Ql(n,k)}let A=Math.round(g/10);Vl(n,M,A,h,m);let _=!!w&&!P;ed(n,p,b,_?w:null),_&&In(n,w),td(n,f,p,b,x,i,r,o)}};function d(){Er(n,"GIF89a")}}function Vl(e,t,a,n,s){e.writeByte(33),e.writeByte(249),e.writeByte(4),s<0&&(s=0,n=!1);var i,r;n?(i=1,r=2):(i=0,r=0),t>=0&&(r=t&7),r<<=2,e.writeByte(0|r|0|i),Be(e,a),e.writeByte(s||0),e.writeByte(0)}function Kl(e,t,a,n,s=8){let i=1,r=0,o=Ja(n.length)-1,c=i<<7|s-1<<4|r<<3|o;Be(e,t),Be(e,a),e.writeBytes([c,0,0])}function Ql(e,t){e.writeByte(33),e.writeByte(255),e.writeByte(11),Er(e,"NETSCAPE2.0"),e.writeByte(3),e.writeByte(1),Be(e,t),e.writeByte(0)}function In(e,t){let a=1<<Ja(t.length);for(let n=0;n<a;n++){let s=[0,0,0];n<t.length&&(s=t[n]),e.writeByte(s[0]),e.writeByte(s[1]),e.writeByte(s[2])}}function ed(e,t,a,n){if(e.writeByte(44),Be(e,0),Be(e,0),Be(e,t),Be(e,a),n){let s=0,i=0,r=Ja(n.length)-1;e.writeByte(128|s|i|0|r)}else e.writeByte(0)}function td(e,t,a,n,s=8,i,r,o){Wl(a,n,t,s,e,i,r,o)}function Be(e,t){e.writeByte(t&255),e.writeByte(t>>8&255)}function Er(e,t){for(var a=0;a<t.length;a++)e.writeByte(t.charCodeAt(a))}function Ja(e){return Math.max(Math.ceil(Math.log2(e)),1)}var Tt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function ad(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function Ot(e){throw new Error('Could not dynamically require "'+e+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var wa={exports:{}};var An;function nd(){return An||(An=1,(function(e,t){(function(a){e.exports=a()})(function(){return(function a(n,s,i){function r(d,f){if(!s[d]){if(!n[d]){var p=typeof Ot=="function"&&Ot;if(!f&&p)return p(d,!0);if(o)return o(d,!0);var b=new Error("Cannot find module '"+d+"'");throw b.code="MODULE_NOT_FOUND",b}var u=s[d]={exports:{}};n[d][0].call(u.exports,function(h){var m=n[d][1][h];return r(m||h)},u,u.exports,a,n,s,i)}return s[d].exports}for(var o=typeof Ot=="function"&&Ot,c=0;c<i.length;c++)r(i[c]);return r})({1:[function(a,n,s){var i=a("./utils"),r=a("./support"),o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";s.encode=function(c){for(var d,f,p,b,u,h,m,g=[],w=0,k=c.length,x=k,M=i.getTypeOf(c)!=="string";w<c.length;)x=k-w,p=M?(d=c[w++],f=w<k?c[w++]:0,w<k?c[w++]:0):(d=c.charCodeAt(w++),f=w<k?c.charCodeAt(w++):0,w<k?c.charCodeAt(w++):0),b=d>>2,u=(3&d)<<4|f>>4,h=1<x?(15&f)<<2|p>>6:64,m=2<x?63&p:64,g.push(o.charAt(b)+o.charAt(u)+o.charAt(h)+o.charAt(m));return g.join("")},s.decode=function(c){var d,f,p,b,u,h,m=0,g=0,w="data:";if(c.substr(0,w.length)===w)throw new Error("Invalid base64 input, it looks like a data url.");var k,x=3*(c=c.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(c.charAt(c.length-1)===o.charAt(64)&&x--,c.charAt(c.length-2)===o.charAt(64)&&x--,x%1!=0)throw new Error("Invalid base64 input, bad content length.");for(k=r.uint8array?new Uint8Array(0|x):new Array(0|x);m<c.length;)d=o.indexOf(c.charAt(m++))<<2|(b=o.indexOf(c.charAt(m++)))>>4,f=(15&b)<<4|(u=o.indexOf(c.charAt(m++)))>>2,p=(3&u)<<6|(h=o.indexOf(c.charAt(m++))),k[g++]=d,u!==64&&(k[g++]=f),h!==64&&(k[g++]=p);return k}},{"./support":30,"./utils":32}],2:[function(a,n,s){var i=a("./external"),r=a("./stream/DataWorker"),o=a("./stream/Crc32Probe"),c=a("./stream/DataLengthProbe");function d(f,p,b,u,h){this.compressedSize=f,this.uncompressedSize=p,this.crc32=b,this.compression=u,this.compressedContent=h}d.prototype={getContentWorker:function(){var f=new r(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new c("data_length")),p=this;return f.on("end",function(){if(this.streamInfo.data_length!==p.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),f},getCompressedWorker:function(){return new r(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},d.createWorkerFrom=function(f,p,b){return f.pipe(new o).pipe(new c("uncompressedSize")).pipe(p.compressWorker(b)).pipe(new c("compressedSize")).withStreamInfo("compression",p)},n.exports=d},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(a,n,s){var i=a("./stream/GenericWorker");s.STORE={magic:"\0\0",compressWorker:function(){return new i("STORE compression")},uncompressWorker:function(){return new i("STORE decompression")}},s.DEFLATE=a("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(a,n,s){var i=a("./utils"),r=(function(){for(var o,c=[],d=0;d<256;d++){o=d;for(var f=0;f<8;f++)o=1&o?3988292384^o>>>1:o>>>1;c[d]=o}return c})();n.exports=function(o,c){return o!==void 0&&o.length?i.getTypeOf(o)!=="string"?(function(d,f,p,b){var u=r,h=b+p;d^=-1;for(var m=b;m<h;m++)d=d>>>8^u[255&(d^f[m])];return-1^d})(0|c,o,o.length,0):(function(d,f,p,b){var u=r,h=b+p;d^=-1;for(var m=b;m<h;m++)d=d>>>8^u[255&(d^f.charCodeAt(m))];return-1^d})(0|c,o,o.length,0):0}},{"./utils":32}],5:[function(a,n,s){s.base64=!1,s.binary=!1,s.dir=!1,s.createFolders=!0,s.date=null,s.compression=null,s.compressionOptions=null,s.comment=null,s.unixPermissions=null,s.dosPermissions=null},{}],6:[function(a,n,s){var i=null;i=typeof Promise<"u"?Promise:a("lie"),n.exports={Promise:i}},{lie:37}],7:[function(a,n,s){var i=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Uint32Array<"u",r=a("pako"),o=a("./utils"),c=a("./stream/GenericWorker"),d=i?"uint8array":"array";function f(p,b){c.call(this,"FlateWorker/"+p),this._pako=null,this._pakoAction=p,this._pakoOptions=b,this.meta={}}s.magic="\b\0",o.inherits(f,c),f.prototype.processChunk=function(p){this.meta=p.meta,this._pako===null&&this._createPako(),this._pako.push(o.transformTo(d,p.data),!1)},f.prototype.flush=function(){c.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},f.prototype.cleanUp=function(){c.prototype.cleanUp.call(this),this._pako=null},f.prototype._createPako=function(){this._pako=new r[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var p=this;this._pako.onData=function(b){p.push({data:b,meta:p.meta})}},s.compressWorker=function(p){return new f("Deflate",p)},s.uncompressWorker=function(){return new f("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(a,n,s){function i(u,h){var m,g="";for(m=0;m<h;m++)g+=String.fromCharCode(255&u),u>>>=8;return g}function r(u,h,m,g,w,k){var x,M,P=u.file,A=u.compression,_=k!==d.utf8encode,D=o.transformTo("string",k(P.name)),j=o.transformTo("string",d.utf8encode(P.name)),W=P.comment,K=o.transformTo("string",k(W)),E=o.transformTo("string",d.utf8encode(W)),O=j.length!==P.name.length,y=E.length!==W.length,q="",te="",B="",ie=P.dir,X=P.date,ne={crc32:0,compressedSize:0,uncompressedSize:0};h&&!m||(ne.crc32=u.crc32,ne.compressedSize=u.compressedSize,ne.uncompressedSize=u.uncompressedSize);var N=0;h&&(N|=8),_||!O&&!y||(N|=2048);var I=0,re=0;ie&&(I|=16),w==="UNIX"?(re=798,I|=(function(G,me){var ge=G;return G||(ge=me?16893:33204),(65535&ge)<<16})(P.unixPermissions,ie)):(re=20,I|=(function(G){return 63&(G||0)})(P.dosPermissions)),x=X.getUTCHours(),x<<=6,x|=X.getUTCMinutes(),x<<=5,x|=X.getUTCSeconds()/2,M=X.getUTCFullYear()-1980,M<<=4,M|=X.getUTCMonth()+1,M<<=5,M|=X.getUTCDate(),O&&(te=i(1,1)+i(f(D),4)+j,q+="up"+i(te.length,2)+te),y&&(B=i(1,1)+i(f(K),4)+E,q+="uc"+i(B.length,2)+B);var V="";return V+=`
\0`,V+=i(N,2),V+=A.magic,V+=i(x,2),V+=i(M,2),V+=i(ne.crc32,4),V+=i(ne.compressedSize,4),V+=i(ne.uncompressedSize,4),V+=i(D.length,2),V+=i(q.length,2),{fileRecord:p.LOCAL_FILE_HEADER+V+D+q,dirRecord:p.CENTRAL_FILE_HEADER+i(re,2)+V+i(K.length,2)+"\0\0\0\0"+i(I,4)+i(g,4)+D+q+K}}var o=a("../utils"),c=a("../stream/GenericWorker"),d=a("../utf8"),f=a("../crc32"),p=a("../signature");function b(u,h,m,g){c.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=h,this.zipPlatform=m,this.encodeFileName=g,this.streamFiles=u,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}o.inherits(b,c),b.prototype.push=function(u){var h=u.meta.percent||0,m=this.entriesCount,g=this._sources.length;this.accumulate?this.contentBuffer.push(u):(this.bytesWritten+=u.data.length,c.prototype.push.call(this,{data:u.data,meta:{currentFile:this.currentFile,percent:m?(h+100*(m-g-1))/m:100}}))},b.prototype.openedSource=function(u){this.currentSourceOffset=this.bytesWritten,this.currentFile=u.file.name;var h=this.streamFiles&&!u.file.dir;if(h){var m=r(u,h,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:m.fileRecord,meta:{percent:0}})}else this.accumulate=!0},b.prototype.closedSource=function(u){this.accumulate=!1;var h=this.streamFiles&&!u.file.dir,m=r(u,h,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(m.dirRecord),h)this.push({data:(function(g){return p.DATA_DESCRIPTOR+i(g.crc32,4)+i(g.compressedSize,4)+i(g.uncompressedSize,4)})(u),meta:{percent:100}});else for(this.push({data:m.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},b.prototype.flush=function(){for(var u=this.bytesWritten,h=0;h<this.dirRecords.length;h++)this.push({data:this.dirRecords[h],meta:{percent:100}});var m=this.bytesWritten-u,g=(function(w,k,x,M,P){var A=o.transformTo("string",P(M));return p.CENTRAL_DIRECTORY_END+"\0\0\0\0"+i(w,2)+i(w,2)+i(k,4)+i(x,4)+i(A.length,2)+A})(this.dirRecords.length,m,u,this.zipComment,this.encodeFileName);this.push({data:g,meta:{percent:100}})},b.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},b.prototype.registerPrevious=function(u){this._sources.push(u);var h=this;return u.on("data",function(m){h.processChunk(m)}),u.on("end",function(){h.closedSource(h.previous.streamInfo),h._sources.length?h.prepareNextSource():h.end()}),u.on("error",function(m){h.error(m)}),this},b.prototype.resume=function(){return!!c.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},b.prototype.error=function(u){var h=this._sources;if(!c.prototype.error.call(this,u))return!1;for(var m=0;m<h.length;m++)try{h[m].error(u)}catch{}return!0},b.prototype.lock=function(){c.prototype.lock.call(this);for(var u=this._sources,h=0;h<u.length;h++)u[h].lock()},n.exports=b},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(a,n,s){var i=a("../compressions"),r=a("./ZipFileWorker");s.generateWorker=function(o,c,d){var f=new r(c.streamFiles,d,c.platform,c.encodeFileName),p=0;try{o.forEach(function(b,u){p++;var h=(function(k,x){var M=k||x,P=i[M];if(!P)throw new Error(M+" is not a valid compression method !");return P})(u.options.compression,c.compression),m=u.options.compressionOptions||c.compressionOptions||{},g=u.dir,w=u.date;u._compressWorker(h,m).withStreamInfo("file",{name:b,dir:g,date:w,comment:u.comment||"",unixPermissions:u.unixPermissions,dosPermissions:u.dosPermissions}).pipe(f)}),f.entriesCount=p}catch(b){f.error(b)}return f}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(a,n,s){function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var r=new i;for(var o in this)typeof this[o]!="function"&&(r[o]=this[o]);return r}}(i.prototype=a("./object")).loadAsync=a("./load"),i.support=a("./support"),i.defaults=a("./defaults"),i.version="3.10.2",i.loadAsync=function(r,o){return new i().loadAsync(r,o)},i.external=a("./external"),n.exports=i},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(a,n,s){var i=a("./utils"),r=a("./external"),o=a("./utf8"),c=a("./zipEntries"),d=a("./stream/Crc32Probe"),f=a("./nodejsUtils");function p(b){return new r.Promise(function(u,h){var m=b.decompressed.getContentWorker().pipe(new d);m.on("error",function(g){h(g)}).on("end",function(){m.streamInfo.crc32!==b.decompressed.crc32?h(new Error("Corrupted zip : CRC32 mismatch")):u()}).resume()})}n.exports=function(b,u){var h=this;return u=i.extend(u||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),f.isNode&&f.isStream(b)?r.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):i.prepareContent("the loaded zip file",b,!0,u.optimizedBinaryString,u.base64).then(function(m){var g=new c(u);return g.load(m),g}).then(function(m){var g=[r.Promise.resolve(m)],w=m.files;if(u.checkCRC32)for(var k=0;k<w.length;k++)g.push(p(w[k]));return r.Promise.all(g)}).then(function(m){for(var g=m.shift(),w=g.files,k=0;k<w.length;k++){var x=w[k],M=x.fileNameStr,P=i.resolve(x.fileNameStr);h.file(P,x.decompressed,{binary:!0,optimizedBinaryString:!0,date:x.date,dir:x.dir,comment:x.fileCommentStr.length?x.fileCommentStr:null,unixPermissions:x.unixPermissions,dosPermissions:x.dosPermissions,createFolders:u.createFolders}),x.dir||(h.file(P).unsafeOriginalName=M)}return g.zipComment.length&&(h.comment=g.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(a,n,s){var i=a("../utils"),r=a("../stream/GenericWorker");function o(c,d){r.call(this,"Nodejs stream input adapter for "+c),this._upstreamEnded=!1,this._bindStream(d)}i.inherits(o,r),o.prototype._bindStream=function(c){var d=this;(this._stream=c).pause(),c.on("data",function(f){d.push({data:f,meta:{percent:0}})}).on("error",function(f){d.isPaused?this.generatedError=f:d.error(f)}).on("end",function(){d.isPaused?d._upstreamEnded=!0:d.end()})},o.prototype.pause=function(){return!!r.prototype.pause.call(this)&&(this._stream.pause(),!0)},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},n.exports=o},{"../stream/GenericWorker":28,"../utils":32}],13:[function(a,n,s){var i=a("readable-stream").Readable;function r(o,c,d){i.call(this,c),this._helper=o;var f=this;o.on("data",function(p,b){f.push(p)||f._helper.pause(),d&&d(b)}).on("error",function(p){f.emit("error",p)}).on("end",function(){f.push(null)})}a("../utils").inherits(r,i),r.prototype._read=function(){this._helper.resume()},n.exports=r},{"../utils":32,"readable-stream":16}],14:[function(a,n,s){n.exports={isNode:typeof Buffer<"u",newBufferFrom:function(i,r){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(i,r);if(typeof i=="number")throw new Error('The "data" argument must not be a number');return new Buffer(i,r)},allocBuffer:function(i){if(Buffer.alloc)return Buffer.alloc(i);var r=new Buffer(i);return r.fill(0),r},isBuffer:function(i){return Buffer.isBuffer(i)},isStream:function(i){return i&&typeof i.on=="function"&&typeof i.pause=="function"&&typeof i.resume=="function"}}},{}],15:[function(a,n,s){function i(P,A,_){var D,j=o.getTypeOf(A),W=o.extend(_||{},f);W.date=W.date||new Date,W.compression!==null&&(W.compression=W.compression.toUpperCase()),typeof W.unixPermissions=="string"&&(W.unixPermissions=parseInt(W.unixPermissions,8)),W.unixPermissions&&16384&W.unixPermissions&&(W.dir=!0),W.dosPermissions&&16&W.dosPermissions&&(W.dir=!0),W.dir&&(P=w(P)),W.createFolders&&(D=g(P))&&k.call(this,D,!0);var K=j==="string"&&W.binary===!1&&W.base64===!1;_&&_.binary!==void 0||(W.binary=!K),(A instanceof p&&A.uncompressedSize===0||W.dir||!A||A.length===0)&&(W.base64=!1,W.binary=!0,A="",W.compression="STORE",j="string");var E=null;E=A instanceof p||A instanceof c?A:h.isNode&&h.isStream(A)?new m(P,A):o.prepareContent(P,A,W.binary,W.optimizedBinaryString,W.base64);var O=new b(P,E,W);this.files[P]=O}var r=a("./utf8"),o=a("./utils"),c=a("./stream/GenericWorker"),d=a("./stream/StreamHelper"),f=a("./defaults"),p=a("./compressedObject"),b=a("./zipObject"),u=a("./generate"),h=a("./nodejsUtils"),m=a("./nodejs/NodejsStreamInputAdapter"),g=function(P){P.slice(-1)==="/"&&(P=P.substring(0,P.length-1));var A=P.lastIndexOf("/");return 0<A?P.substring(0,A):""},w=function(P){return P.slice(-1)!=="/"&&(P+="/"),P},k=function(P,A){return A=A!==void 0?A:f.createFolders,P=w(P),this.files[P]||i.call(this,P,null,{dir:!0,createFolders:A}),this.files[P]};function x(P){return Object.prototype.toString.call(P)==="[object RegExp]"}var M={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(P){var A,_,D;for(A in this.files)D=this.files[A],(_=A.slice(this.root.length,A.length))&&A.slice(0,this.root.length)===this.root&&P(_,D)},filter:function(P){var A=[];return this.forEach(function(_,D){P(_,D)&&A.push(D)}),A},file:function(P,A,_){if(arguments.length!==1)return P=this.root+P,i.call(this,P,A,_),this;if(x(P)){var D=P;return this.filter(function(W,K){return!K.dir&&D.test(W)})}var j=this.files[this.root+P];return j&&!j.dir?j:null},folder:function(P){if(!P)return this;if(x(P))return this.filter(function(j,W){return W.dir&&P.test(j)});var A=this.root+P,_=k.call(this,A),D=this.clone();return D.root=_.name,D},remove:function(P){P=this.root+P;var A=this.files[P];if(A||(P.slice(-1)!=="/"&&(P+="/"),A=this.files[P]),A&&!A.dir)delete this.files[P];else for(var _=this.filter(function(j,W){return W.name.slice(0,P.length)===P}),D=0;D<_.length;D++)delete this.files[_[D].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(P){var A,_={};try{if((_=o.extend(P||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:r.utf8encode})).type=_.type.toLowerCase(),_.compression=_.compression.toUpperCase(),_.type==="binarystring"&&(_.type="string"),!_.type)throw new Error("No output type specified.");o.checkSupport(_.type),_.platform!=="darwin"&&_.platform!=="freebsd"&&_.platform!=="linux"&&_.platform!=="sunos"||(_.platform="UNIX"),_.platform==="win32"&&(_.platform="DOS");var D=_.comment||this.comment||"";A=u.generateWorker(this,_,D)}catch(j){(A=new c("error")).error(j)}return new d(A,_.type||"string",_.mimeType)},generateAsync:function(P,A){return this.generateInternalStream(P).accumulate(A)},generateNodeStream:function(P,A){return(P=P||{}).type||(P.type="nodebuffer"),this.generateInternalStream(P).toNodejsStream(A)}};n.exports=M},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(a,n,s){n.exports=a("stream")},{stream:void 0}],17:[function(a,n,s){var i=a("./DataReader");function r(o){i.call(this,o);for(var c=0;c<this.data.length;c++)o[c]=255&o[c]}a("../utils").inherits(r,i),r.prototype.byteAt=function(o){return this.data[this.zero+o]},r.prototype.lastIndexOfSignature=function(o){for(var c=o.charCodeAt(0),d=o.charCodeAt(1),f=o.charCodeAt(2),p=o.charCodeAt(3),b=this.length-4;0<=b;--b)if(this.data[b]===c&&this.data[b+1]===d&&this.data[b+2]===f&&this.data[b+3]===p)return b-this.zero;return-1},r.prototype.readAndCheckSignature=function(o){var c=o.charCodeAt(0),d=o.charCodeAt(1),f=o.charCodeAt(2),p=o.charCodeAt(3),b=this.readData(4);return c===b[0]&&d===b[1]&&f===b[2]&&p===b[3]},r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return[];var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./DataReader":18}],18:[function(a,n,s){var i=a("../utils");function r(o){this.data=o,this.length=o.length,this.index=0,this.zero=0}r.prototype={checkOffset:function(o){this.checkIndex(this.index+o)},checkIndex:function(o){if(this.length<this.zero+o||o<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+o+"). Corrupted zip ?")},setIndex:function(o){this.checkIndex(o),this.index=o},skip:function(o){this.setIndex(this.index+o)},byteAt:function(){},readInt:function(o){var c,d=0;for(this.checkOffset(o),c=this.index+o-1;c>=this.index;c--)d=(d<<8)+this.byteAt(c);return this.index+=o,d},readString:function(o){return i.transformTo("string",this.readData(o))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var o=this.readInt(4);return new Date(Date.UTC(1980+(o>>25&127),(o>>21&15)-1,o>>16&31,o>>11&31,o>>5&63,(31&o)<<1))}},n.exports=r},{"../utils":32}],19:[function(a,n,s){var i=a("./Uint8ArrayReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.readData=function(o){this.checkOffset(o);var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(a,n,s){var i=a("./DataReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.byteAt=function(o){return this.data.charCodeAt(this.zero+o)},r.prototype.lastIndexOfSignature=function(o){return this.data.lastIndexOf(o)-this.zero},r.prototype.readAndCheckSignature=function(o){return o===this.readData(4)},r.prototype.readData=function(o){this.checkOffset(o);var c=this.data.slice(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./DataReader":18}],21:[function(a,n,s){var i=a("./ArrayReader");function r(o){i.call(this,o)}a("../utils").inherits(r,i),r.prototype.readData=function(o){if(this.checkOffset(o),o===0)return new Uint8Array(0);var c=this.data.subarray(this.zero+this.index,this.zero+this.index+o);return this.index+=o,c},n.exports=r},{"../utils":32,"./ArrayReader":17}],22:[function(a,n,s){var i=a("../utils"),r=a("../support"),o=a("./ArrayReader"),c=a("./StringReader"),d=a("./NodeBufferReader"),f=a("./Uint8ArrayReader");n.exports=function(p){var b=i.getTypeOf(p);return i.checkSupport(b),b!=="string"||r.uint8array?b==="nodebuffer"?new d(p):r.uint8array?new f(i.transformTo("uint8array",p)):new o(i.transformTo("array",p)):new c(p)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(a,n,s){s.LOCAL_FILE_HEADER="PK",s.CENTRAL_FILE_HEADER="PK",s.CENTRAL_DIRECTORY_END="PK",s.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x07",s.ZIP64_CENTRAL_DIRECTORY_END="PK",s.DATA_DESCRIPTOR="PK\x07\b"},{}],24:[function(a,n,s){var i=a("./GenericWorker"),r=a("../utils");function o(c){i.call(this,"ConvertWorker to "+c),this.destType=c}r.inherits(o,i),o.prototype.processChunk=function(c){this.push({data:r.transformTo(this.destType,c.data),meta:c.meta})},n.exports=o},{"../utils":32,"./GenericWorker":28}],25:[function(a,n,s){var i=a("./GenericWorker"),r=a("../crc32");function o(){i.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}a("../utils").inherits(o,i),o.prototype.processChunk=function(c){this.streamInfo.crc32=r(c.data,this.streamInfo.crc32||0),this.push(c)},n.exports=o},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(a,n,s){var i=a("../utils"),r=a("./GenericWorker");function o(c){r.call(this,"DataLengthProbe for "+c),this.propName=c,this.withStreamInfo(c,0)}i.inherits(o,r),o.prototype.processChunk=function(c){if(c){var d=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=d+c.data.length}r.prototype.processChunk.call(this,c)},n.exports=o},{"../utils":32,"./GenericWorker":28}],27:[function(a,n,s){var i=a("../utils"),r=a("./GenericWorker");function o(c){r.call(this,"DataWorker");var d=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,c.then(function(f){d.dataIsReady=!0,d.data=f,d.max=f&&f.length||0,d.type=i.getTypeOf(f),d.isPaused||d._tickAndRepeat()},function(f){d.error(f)})}i.inherits(o,r),o.prototype.cleanUp=function(){r.prototype.cleanUp.call(this),this.data=null},o.prototype.resume=function(){return!!r.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,i.delay(this._tickAndRepeat,[],this)),!0)},o.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(i.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},o.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var c=null,d=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":c=this.data.substring(this.index,d);break;case"uint8array":c=this.data.subarray(this.index,d);break;case"array":case"nodebuffer":c=this.data.slice(this.index,d)}return this.index=d,this.push({data:c,meta:{percent:this.max?this.index/this.max*100:0}})},n.exports=o},{"../utils":32,"./GenericWorker":28}],28:[function(a,n,s){function i(r){this.name=r||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}i.prototype={push:function(r){this.emit("data",r)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(r){this.emit("error",r)}return!0},error:function(r){return!this.isFinished&&(this.isPaused?this.generatedError=r:(this.isFinished=!0,this.emit("error",r),this.previous&&this.previous.error(r),this.cleanUp()),!0)},on:function(r,o){return this._listeners[r].push(o),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(r,o){if(this._listeners[r])for(var c=0;c<this._listeners[r].length;c++)this._listeners[r][c].call(this,o)},pipe:function(r){return r.registerPrevious(this)},registerPrevious:function(r){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=r.streamInfo,this.mergeStreamInfo(),this.previous=r;var o=this;return r.on("data",function(c){o.processChunk(c)}),r.on("end",function(){o.end()}),r.on("error",function(c){o.error(c)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var r=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),r=!0),this.previous&&this.previous.resume(),!r},flush:function(){},processChunk:function(r){this.push(r)},withStreamInfo:function(r,o){return this.extraStreamInfo[r]=o,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var r in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,r)&&(this.streamInfo[r]=this.extraStreamInfo[r])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var r="Worker "+this.name;return this.previous?this.previous+" -> "+r:r}},n.exports=i},{}],29:[function(a,n,s){var i=a("../utils"),r=a("./ConvertWorker"),o=a("./GenericWorker"),c=a("../base64"),d=a("../support"),f=a("../external"),p=null;if(d.nodestream)try{p=a("../nodejs/NodejsStreamOutputAdapter")}catch{}function b(h,m){return new f.Promise(function(g,w){var k=[],x=h._internalType,M=h._outputType,P=h._mimeType;h.on("data",function(A,_){k.push(A),m&&m(_)}).on("error",function(A){k=[],w(A)}).on("end",function(){try{var A=(function(_,D,j){switch(_){case"blob":return i.newBlob(i.transformTo("arraybuffer",D),j);case"base64":return c.encode(D);default:return i.transformTo(_,D)}})(M,(function(_,D){var j,W=0,K=null,E=0;for(j=0;j<D.length;j++)E+=D[j].length;switch(_){case"string":return D.join("");case"array":return Array.prototype.concat.apply([],D);case"uint8array":for(K=new Uint8Array(E),j=0;j<D.length;j++)K.set(D[j],W),W+=D[j].length;return K;case"nodebuffer":return Buffer.concat(D);default:throw new Error("concat : unsupported type '"+_+"'")}})(x,k),P);g(A)}catch(_){w(_)}k=[]}).resume()})}function u(h,m,g){var w=m;switch(m){case"blob":case"arraybuffer":w="uint8array";break;case"base64":w="string"}try{this._internalType=w,this._outputType=m,this._mimeType=g,i.checkSupport(w),this._worker=h.pipe(new r(w)),h.lock()}catch(k){this._worker=new o("error"),this._worker.error(k)}}u.prototype={accumulate:function(h){return b(this,h)},on:function(h,m){var g=this;return h==="data"?this._worker.on(h,function(w){m.call(g,w.data,w.meta)}):this._worker.on(h,function(){i.delay(m,arguments,g)}),this},resume:function(){return i.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(h){if(i.checkSupport("nodestream"),this._outputType!=="nodebuffer")throw new Error(this._outputType+" is not supported by this method");return new p(this,{objectMode:this._outputType!=="nodebuffer"},h)}},n.exports=u},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(a,n,s){if(s.base64=!0,s.array=!0,s.string=!0,s.arraybuffer=typeof ArrayBuffer<"u"&&typeof Uint8Array<"u",s.nodebuffer=typeof Buffer<"u",s.uint8array=typeof Uint8Array<"u",typeof ArrayBuffer>"u")s.blob=!1;else{var i=new ArrayBuffer(0);try{s.blob=new Blob([i],{type:"application/zip"}).size===0}catch{try{var r=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);r.append(i),s.blob=r.getBlob("application/zip").size===0}catch{s.blob=!1}}}try{s.nodestream=!!a("readable-stream").Readable}catch{s.nodestream=!1}},{"readable-stream":16}],31:[function(a,n,s){for(var i=a("./utils"),r=a("./support"),o=a("./nodejsUtils"),c=a("./stream/GenericWorker"),d=new Array(256),f=0;f<256;f++)d[f]=252<=f?6:248<=f?5:240<=f?4:224<=f?3:192<=f?2:1;d[254]=d[254]=1;function p(){c.call(this,"utf-8 decode"),this.leftOver=null}function b(){c.call(this,"utf-8 encode")}s.utf8encode=function(u){return r.nodebuffer?o.newBufferFrom(u,"utf-8"):(function(h){var m,g,w,k,x,M=h.length,P=0;for(k=0;k<M;k++)(64512&(g=h.charCodeAt(k)))==55296&&k+1<M&&(64512&(w=h.charCodeAt(k+1)))==56320&&(g=65536+(g-55296<<10)+(w-56320),k++),P+=g<128?1:g<2048?2:g<65536?3:4;for(m=r.uint8array?new Uint8Array(P):new Array(P),k=x=0;x<P;k++)(64512&(g=h.charCodeAt(k)))==55296&&k+1<M&&(64512&(w=h.charCodeAt(k+1)))==56320&&(g=65536+(g-55296<<10)+(w-56320),k++),g<128?m[x++]=g:(g<2048?m[x++]=192|g>>>6:(g<65536?m[x++]=224|g>>>12:(m[x++]=240|g>>>18,m[x++]=128|g>>>12&63),m[x++]=128|g>>>6&63),m[x++]=128|63&g);return m})(u)},s.utf8decode=function(u){return r.nodebuffer?i.transformTo("nodebuffer",u).toString("utf-8"):(function(h){var m,g,w,k,x=h.length,M=new Array(2*x);for(m=g=0;m<x;)if((w=h[m++])<128)M[g++]=w;else if(4<(k=d[w]))M[g++]=65533,m+=k-1;else{for(w&=k===2?31:k===3?15:7;1<k&&m<x;)w=w<<6|63&h[m++],k--;1<k?M[g++]=65533:w<65536?M[g++]=w:(w-=65536,M[g++]=55296|w>>10&1023,M[g++]=56320|1023&w)}return M.length!==g&&(M.subarray?M=M.subarray(0,g):M.length=g),i.applyFromCharCode(M)})(u=i.transformTo(r.uint8array?"uint8array":"array",u))},i.inherits(p,c),p.prototype.processChunk=function(u){var h=i.transformTo(r.uint8array?"uint8array":"array",u.data);if(this.leftOver&&this.leftOver.length){if(r.uint8array){var m=h;(h=new Uint8Array(m.length+this.leftOver.length)).set(this.leftOver,0),h.set(m,this.leftOver.length)}else h=this.leftOver.concat(h);this.leftOver=null}var g=(function(k,x){var M;for((x=x||k.length)>k.length&&(x=k.length),M=x-1;0<=M&&(192&k[M])==128;)M--;return M<0||M===0?x:M+d[k[M]]>x?M:x})(h),w=h;g!==h.length&&(r.uint8array?(w=h.subarray(0,g),this.leftOver=h.subarray(g,h.length)):(w=h.slice(0,g),this.leftOver=h.slice(g,h.length))),this.push({data:s.utf8decode(w),meta:u.meta})},p.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=p,i.inherits(b,c),b.prototype.processChunk=function(u){this.push({data:s.utf8encode(u.data),meta:u.meta})},s.Utf8EncodeWorker=b},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(a,n,s){var i=a("./support"),r=a("./base64"),o=a("./nodejsUtils"),c=a("./external");function d(m){return m}function f(m,g){for(var w=0;w<m.length;++w)g[w]=255&m.charCodeAt(w);return g}a("setimmediate"),s.newBlob=function(m,g){s.checkSupport("blob");try{return new Blob([m],{type:g})}catch{try{var w=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return w.append(m),w.getBlob(g)}catch{throw new Error("Bug : can't construct the Blob.")}}};var p={stringifyByChunk:function(m,g,w){var k=[],x=0,M=m.length;if(M<=w)return String.fromCharCode.apply(null,m);for(;x<M;)g==="array"||g==="nodebuffer"?k.push(String.fromCharCode.apply(null,m.slice(x,Math.min(x+w,M)))):k.push(String.fromCharCode.apply(null,m.subarray(x,Math.min(x+w,M)))),x+=w;return k.join("")},stringifyByChar:function(m){for(var g="",w=0;w<m.length;w++)g+=String.fromCharCode(m[w]);return g},applyCanBeUsed:{uint8array:(function(){try{return i.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return i.nodebuffer&&String.fromCharCode.apply(null,o.allocBuffer(1)).length===1}catch{return!1}})()}};function b(m){var g=65536,w=s.getTypeOf(m),k=!0;if(w==="uint8array"?k=p.applyCanBeUsed.uint8array:w==="nodebuffer"&&(k=p.applyCanBeUsed.nodebuffer),k)for(;1<g;)try{return p.stringifyByChunk(m,w,g)}catch{g=Math.floor(g/2)}return p.stringifyByChar(m)}function u(m,g){for(var w=0;w<m.length;w++)g[w]=m[w];return g}s.applyFromCharCode=b;var h={};h.string={string:d,array:function(m){return f(m,new Array(m.length))},arraybuffer:function(m){return h.string.uint8array(m).buffer},uint8array:function(m){return f(m,new Uint8Array(m.length))},nodebuffer:function(m){return f(m,o.allocBuffer(m.length))}},h.array={string:b,array:d,arraybuffer:function(m){return new Uint8Array(m).buffer},uint8array:function(m){return new Uint8Array(m)},nodebuffer:function(m){return o.newBufferFrom(m)}},h.arraybuffer={string:function(m){return b(new Uint8Array(m))},array:function(m){return u(new Uint8Array(m),new Array(m.byteLength))},arraybuffer:d,uint8array:function(m){return new Uint8Array(m)},nodebuffer:function(m){return o.newBufferFrom(new Uint8Array(m))}},h.uint8array={string:b,array:function(m){return u(m,new Array(m.length))},arraybuffer:function(m){return m.buffer},uint8array:d,nodebuffer:function(m){return o.newBufferFrom(m)}},h.nodebuffer={string:b,array:function(m){return u(m,new Array(m.length))},arraybuffer:function(m){return h.nodebuffer.uint8array(m).buffer},uint8array:function(m){return u(m,new Uint8Array(m.length))},nodebuffer:d},s.transformTo=function(m,g){if(g=g||"",!m)return g;s.checkSupport(m);var w=s.getTypeOf(g);return h[w][m](g)},s.resolve=function(m){for(var g=m.split("/"),w=[],k=0;k<g.length;k++){var x=g[k];x==="."||x===""&&k!==0&&k!==g.length-1||(x===".."?w.pop():w.push(x))}return w.join("/")},s.getTypeOf=function(m){if(typeof m=="string")return"string";var g=Object.prototype.toString.call(m);return g==="[object Array]"?"array":i.nodebuffer&&o.isBuffer(m)?"nodebuffer":i.uint8array&&g==="[object Uint8Array]"?"uint8array":i.arraybuffer&&g==="[object ArrayBuffer]"?"arraybuffer":void 0},s.checkSupport=function(m){if(!i[m.toLowerCase()])throw new Error(m+" is not supported by this platform")},s.MAX_VALUE_16BITS=65535,s.MAX_VALUE_32BITS=-1,s.pretty=function(m){var g,w,k="";for(w=0;w<(m||"").length;w++)k+="\\x"+((g=m.charCodeAt(w))<16?"0":"")+g.toString(16).toUpperCase();return k},s.delay=function(m,g,w){setImmediate(function(){m.apply(w||null,g||[])})},s.inherits=function(m,g){function w(){}w.prototype=g.prototype,m.prototype=new w},s.extend=function(){var m,g,w={};for(m=0;m<arguments.length;m++)for(g in arguments[m])Object.prototype.hasOwnProperty.call(arguments[m],g)&&w[g]===void 0&&(w[g]=arguments[m][g]);return w},s.prepareContent=function(m,g,w,k,x){return c.Promise.resolve(g).then(function(M){return i.blob&&(M instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(M))!==-1)?Blob.prototype.arrayBuffer!==void 0?M.arrayBuffer():typeof FileReader<"u"?new c.Promise(function(P,A){var _=new FileReader;_.onload=function(D){P(D.target.result)},_.onerror=function(D){A(D.target.error)},_.readAsArrayBuffer(M)}):c.Promise.reject(new Error(m+" is a Blob, but we have no way of reading it.")):M}).then(function(M){var P=s.getTypeOf(M);return P?(P==="arraybuffer"?M=s.transformTo("uint8array",M):P==="string"&&(x?M=r.decode(M):w&&k!==!0&&(M=(function(A){return f(A,i.uint8array?new Uint8Array(A.length):new Array(A.length))})(M))),M):c.Promise.reject(new Error("Can't read the data of '"+m+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(a,n,s){var i=a("./reader/readerFor"),r=a("./utils"),o=a("./signature"),c=a("./zipEntry"),d=a("./support");function f(p){this.files=[],this.loadOptions=p}f.prototype={checkSignature:function(p){if(!this.reader.readAndCheckSignature(p)){this.reader.index-=4;var b=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+r.pretty(b)+", expected "+r.pretty(p)+")")}},isSignature:function(p,b){var u=this.reader.index;this.reader.setIndex(p);var h=this.reader.readString(4)===b;return this.reader.setIndex(u),h},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var p=this.reader.readData(this.zipCommentLength),b=d.uint8array?"uint8array":"array",u=r.transformTo(b,p);this.zipComment=this.loadOptions.decodeFileName(u)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var p,b,u,h=this.zip64EndOfCentralSize-44;0<h;)p=this.reader.readInt(2),b=this.reader.readInt(4),u=this.reader.readData(b),this.zip64ExtensibleData[p]={id:p,length:b,value:u}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var p,b;for(p=0;p<this.files.length;p++)b=this.files[p],this.reader.setIndex(b.localHeaderOffset),this.checkSignature(o.LOCAL_FILE_HEADER),b.readLocalPart(this.reader),b.handleUTF8(),b.processAttributes()},readCentralDir:function(){var p;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(o.CENTRAL_FILE_HEADER);)(p=new c({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(p);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var p=this.reader.lastIndexOfSignature(o.CENTRAL_DIRECTORY_END);if(p<0)throw this.isSignature(0,o.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(p);var b=p;if(this.checkSignature(o.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===r.MAX_VALUE_16BITS||this.diskWithCentralDirStart===r.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===r.MAX_VALUE_16BITS||this.centralDirRecords===r.MAX_VALUE_16BITS||this.centralDirSize===r.MAX_VALUE_32BITS||this.centralDirOffset===r.MAX_VALUE_32BITS){if(this.zip64=!0,(p=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(p),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,o.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(o.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var u=this.centralDirOffset+this.centralDirSize;this.zip64&&(u+=20,u+=12+this.zip64EndOfCentralSize);var h=b-u;if(0<h)this.isSignature(b,o.CENTRAL_FILE_HEADER)||(this.reader.zero=h);else if(h<0)throw new Error("Corrupted zip: missing "+Math.abs(h)+" bytes.")},prepareReader:function(p){this.reader=i(p)},load:function(p){this.prepareReader(p),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},n.exports=f},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(a,n,s){var i=a("./reader/readerFor"),r=a("./utils"),o=a("./compressedObject"),c=a("./crc32"),d=a("./utf8"),f=a("./compressions"),p=a("./support");function b(u,h){this.options=u,this.loadOptions=h}b.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(u){var h,m;if(u.skip(22),this.fileNameLength=u.readInt(2),m=u.readInt(2),this.fileName=u.readData(this.fileNameLength),u.skip(m),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if((h=(function(g){for(var w in f)if(Object.prototype.hasOwnProperty.call(f,w)&&f[w].magic===g)return f[w];return null})(this.compressionMethod))===null)throw new Error("Corrupted zip : compression "+r.pretty(this.compressionMethod)+" unknown (inner file : "+r.transformTo("string",this.fileName)+")");this.decompressed=new o(this.compressedSize,this.uncompressedSize,this.crc32,h,u.readData(this.compressedSize))},readCentralPart:function(u){this.versionMadeBy=u.readInt(2),u.skip(2),this.bitFlag=u.readInt(2),this.compressionMethod=u.readString(2),this.date=u.readDate(),this.crc32=u.readInt(4),this.compressedSize=u.readInt(4),this.uncompressedSize=u.readInt(4);var h=u.readInt(2);if(this.extraFieldsLength=u.readInt(2),this.fileCommentLength=u.readInt(2),this.diskNumberStart=u.readInt(2),this.internalFileAttributes=u.readInt(2),this.externalFileAttributes=u.readInt(4),this.localHeaderOffset=u.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");u.skip(h),this.readExtraFields(u),this.parseZIP64ExtraField(u),this.fileComment=u.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var u=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),u==0&&(this.dosPermissions=63&this.externalFileAttributes),u==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!=="/"||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var u=i(this.extraFields[1].value);this.uncompressedSize===r.MAX_VALUE_32BITS&&(this.uncompressedSize=u.readInt(8)),this.compressedSize===r.MAX_VALUE_32BITS&&(this.compressedSize=u.readInt(8)),this.localHeaderOffset===r.MAX_VALUE_32BITS&&(this.localHeaderOffset=u.readInt(8)),this.diskNumberStart===r.MAX_VALUE_32BITS&&(this.diskNumberStart=u.readInt(4))}},readExtraFields:function(u){var h,m,g,w=u.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});u.index+4<w;)h=u.readInt(2),m=u.readInt(2),g=u.readData(m),this.extraFields[h]={id:h,length:m,value:g};u.setIndex(w)},handleUTF8:function(){var u=p.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=d.utf8decode(this.fileName),this.fileCommentStr=d.utf8decode(this.fileComment);else{var h=this.findExtraFieldUnicodePath();if(h!==null)this.fileNameStr=h;else{var m=r.transformTo(u,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(m)}var g=this.findExtraFieldUnicodeComment();if(g!==null)this.fileCommentStr=g;else{var w=r.transformTo(u,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(w)}}},findExtraFieldUnicodePath:function(){var u=this.extraFields[28789];if(u){var h=i(u.value);return h.readInt(1)!==1||c(this.fileName)!==h.readInt(4)?null:d.utf8decode(h.readData(u.length-5))}return null},findExtraFieldUnicodeComment:function(){var u=this.extraFields[25461];if(u){var h=i(u.value);return h.readInt(1)!==1||c(this.fileComment)!==h.readInt(4)?null:d.utf8decode(h.readData(u.length-5))}return null}},n.exports=b},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(a,n,s){function i(h,m,g){this.name=h,this.dir=g.dir,this.date=g.date,this.comment=g.comment,this.unixPermissions=g.unixPermissions,this.dosPermissions=g.dosPermissions,this._data=m,this._dataBinary=g.binary,this.options={compression:g.compression,compressionOptions:g.compressionOptions}}var r=a("./stream/StreamHelper"),o=a("./stream/DataWorker"),c=a("./utf8"),d=a("./compressedObject"),f=a("./stream/GenericWorker");i.prototype={internalStream:function(h){var m=null,g="string";try{if(!h)throw new Error("No output type specified.");var w=(g=h.toLowerCase())==="string"||g==="text";g!=="binarystring"&&g!=="text"||(g="string"),m=this._decompressWorker();var k=!this._dataBinary;k&&!w&&(m=m.pipe(new c.Utf8EncodeWorker)),!k&&w&&(m=m.pipe(new c.Utf8DecodeWorker))}catch(x){(m=new f("error")).error(x)}return new r(m,g,"")},async:function(h,m){return this.internalStream(h).accumulate(m)},nodeStream:function(h,m){return this.internalStream(h||"nodebuffer").toNodejsStream(m)},_compressWorker:function(h,m){if(this._data instanceof d&&this._data.compression.magic===h.magic)return this._data.getCompressedWorker();var g=this._decompressWorker();return this._dataBinary||(g=g.pipe(new c.Utf8EncodeWorker)),d.createWorkerFrom(g,h,m)},_decompressWorker:function(){return this._data instanceof d?this._data.getContentWorker():this._data instanceof f?this._data:new o(this._data)}};for(var p=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],b=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},u=0;u<p.length;u++)i.prototype[p[u]]=b;n.exports=i},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(a,n,s){(function(i){var r,o,c=i.MutationObserver||i.WebKitMutationObserver;if(c){var d=0,f=new c(h),p=i.document.createTextNode("");f.observe(p,{characterData:!0}),r=function(){p.data=d=++d%2}}else if(i.setImmediate||i.MessageChannel===void 0)r="document"in i&&"onreadystatechange"in i.document.createElement("script")?function(){var m=i.document.createElement("script");m.onreadystatechange=function(){h(),m.onreadystatechange=null,m.parentNode.removeChild(m),m=null},i.document.documentElement.appendChild(m)}:function(){setTimeout(h,0)};else{var b=new i.MessageChannel;b.port1.onmessage=h,r=function(){b.port2.postMessage(0)}}var u=[];function h(){var m,g;o=!0;for(var w=u.length;w;){for(g=u,u=[],m=-1;++m<w;)g[m]();w=u.length}o=!1}n.exports=function(m){u.push(m)!==1||o||r()}}).call(this,typeof Tt<"u"?Tt:typeof self<"u"?self:typeof window<"u"?window:{})},{}],37:[function(a,n,s){var i=a("immediate");function r(){}var o={},c=["REJECTED"],d=["FULFILLED"],f=["PENDING"];function p(w){if(typeof w!="function")throw new TypeError("resolver must be a function");this.state=f,this.queue=[],this.outcome=void 0,w!==r&&m(this,w)}function b(w,k,x){this.promise=w,typeof k=="function"&&(this.onFulfilled=k,this.callFulfilled=this.otherCallFulfilled),typeof x=="function"&&(this.onRejected=x,this.callRejected=this.otherCallRejected)}function u(w,k,x){i(function(){var M;try{M=k(x)}catch(P){return o.reject(w,P)}M===w?o.reject(w,new TypeError("Cannot resolve promise with itself")):o.resolve(w,M)})}function h(w){var k=w&&w.then;if(w&&(typeof w=="object"||typeof w=="function")&&typeof k=="function")return function(){k.apply(w,arguments)}}function m(w,k){var x=!1;function M(_){x||(x=!0,o.reject(w,_))}function P(_){x||(x=!0,o.resolve(w,_))}var A=g(function(){k(P,M)});A.status==="error"&&M(A.value)}function g(w,k){var x={};try{x.value=w(k),x.status="success"}catch(M){x.status="error",x.value=M}return x}(n.exports=p).prototype.finally=function(w){if(typeof w!="function")return this;var k=this.constructor;return this.then(function(x){return k.resolve(w()).then(function(){return x})},function(x){return k.resolve(w()).then(function(){throw x})})},p.prototype.catch=function(w){return this.then(null,w)},p.prototype.then=function(w,k){if(typeof w!="function"&&this.state===d||typeof k!="function"&&this.state===c)return this;var x=new this.constructor(r);return this.state!==f?u(x,this.state===d?w:k,this.outcome):this.queue.push(new b(x,w,k)),x},b.prototype.callFulfilled=function(w){o.resolve(this.promise,w)},b.prototype.otherCallFulfilled=function(w){u(this.promise,this.onFulfilled,w)},b.prototype.callRejected=function(w){o.reject(this.promise,w)},b.prototype.otherCallRejected=function(w){u(this.promise,this.onRejected,w)},o.resolve=function(w,k){var x=g(h,k);if(x.status==="error")return o.reject(w,x.value);var M=x.value;if(M)m(w,M);else{w.state=d,w.outcome=k;for(var P=-1,A=w.queue.length;++P<A;)w.queue[P].callFulfilled(k)}return w},o.reject=function(w,k){w.state=c,w.outcome=k;for(var x=-1,M=w.queue.length;++x<M;)w.queue[x].callRejected(k);return w},p.resolve=function(w){return w instanceof this?w:o.resolve(new this(r),w)},p.reject=function(w){var k=new this(r);return o.reject(k,w)},p.all=function(w){var k=this;if(Object.prototype.toString.call(w)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=w.length,M=!1;if(!x)return this.resolve([]);for(var P=new Array(x),A=0,_=-1,D=new this(r);++_<x;)j(w[_],_);return D;function j(W,K){k.resolve(W).then(function(E){P[K]=E,++A!==x||M||(M=!0,o.resolve(D,P))},function(E){M||(M=!0,o.reject(D,E))})}},p.race=function(w){var k=this;if(Object.prototype.toString.call(w)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=w.length,M=!1;if(!x)return this.resolve([]);for(var P=-1,A=new this(r);++P<x;)_=w[P],k.resolve(_).then(function(D){M||(M=!0,o.resolve(A,D))},function(D){M||(M=!0,o.reject(A,D))});var _;return A}},{immediate:36}],38:[function(a,n,s){var i={};(0,a("./lib/utils/common").assign)(i,a("./lib/deflate"),a("./lib/inflate"),a("./lib/zlib/constants")),n.exports=i},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(a,n,s){var i=a("./zlib/deflate"),r=a("./utils/common"),o=a("./utils/strings"),c=a("./zlib/messages"),d=a("./zlib/zstream"),f=Object.prototype.toString,p=0,b=-1,u=0,h=8;function m(w){if(!(this instanceof m))return new m(w);this.options=r.assign({level:b,method:h,chunkSize:16384,windowBits:15,memLevel:8,strategy:u,to:""},w||{});var k=this.options;k.raw&&0<k.windowBits?k.windowBits=-k.windowBits:k.gzip&&0<k.windowBits&&k.windowBits<16&&(k.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new d,this.strm.avail_out=0;var x=i.deflateInit2(this.strm,k.level,k.method,k.windowBits,k.memLevel,k.strategy);if(x!==p)throw new Error(c[x]);if(k.header&&i.deflateSetHeader(this.strm,k.header),k.dictionary){var M;if(M=typeof k.dictionary=="string"?o.string2buf(k.dictionary):f.call(k.dictionary)==="[object ArrayBuffer]"?new Uint8Array(k.dictionary):k.dictionary,(x=i.deflateSetDictionary(this.strm,M))!==p)throw new Error(c[x]);this._dict_set=!0}}function g(w,k){var x=new m(k);if(x.push(w,!0),x.err)throw x.msg||c[x.err];return x.result}m.prototype.push=function(w,k){var x,M,P=this.strm,A=this.options.chunkSize;if(this.ended)return!1;M=k===~~k?k:k===!0?4:0,typeof w=="string"?P.input=o.string2buf(w):f.call(w)==="[object ArrayBuffer]"?P.input=new Uint8Array(w):P.input=w,P.next_in=0,P.avail_in=P.input.length;do{if(P.avail_out===0&&(P.output=new r.Buf8(A),P.next_out=0,P.avail_out=A),(x=i.deflate(P,M))!==1&&x!==p)return this.onEnd(x),!(this.ended=!0);P.avail_out!==0&&(P.avail_in!==0||M!==4&&M!==2)||(this.options.to==="string"?this.onData(o.buf2binstring(r.shrinkBuf(P.output,P.next_out))):this.onData(r.shrinkBuf(P.output,P.next_out)))}while((0<P.avail_in||P.avail_out===0)&&x!==1);return M===4?(x=i.deflateEnd(this.strm),this.onEnd(x),this.ended=!0,x===p):M!==2||(this.onEnd(p),!(P.avail_out=0))},m.prototype.onData=function(w){this.chunks.push(w)},m.prototype.onEnd=function(w){w===p&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=w,this.msg=this.strm.msg},s.Deflate=m,s.deflate=g,s.deflateRaw=function(w,k){return(k=k||{}).raw=!0,g(w,k)},s.gzip=function(w,k){return(k=k||{}).gzip=!0,g(w,k)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(a,n,s){var i=a("./zlib/inflate"),r=a("./utils/common"),o=a("./utils/strings"),c=a("./zlib/constants"),d=a("./zlib/messages"),f=a("./zlib/zstream"),p=a("./zlib/gzheader"),b=Object.prototype.toString;function u(m){if(!(this instanceof u))return new u(m);this.options=r.assign({chunkSize:16384,windowBits:0,to:""},m||{});var g=this.options;g.raw&&0<=g.windowBits&&g.windowBits<16&&(g.windowBits=-g.windowBits,g.windowBits===0&&(g.windowBits=-15)),!(0<=g.windowBits&&g.windowBits<16)||m&&m.windowBits||(g.windowBits+=32),15<g.windowBits&&g.windowBits<48&&(15&g.windowBits)==0&&(g.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new f,this.strm.avail_out=0;var w=i.inflateInit2(this.strm,g.windowBits);if(w!==c.Z_OK)throw new Error(d[w]);this.header=new p,i.inflateGetHeader(this.strm,this.header)}function h(m,g){var w=new u(g);if(w.push(m,!0),w.err)throw w.msg||d[w.err];return w.result}u.prototype.push=function(m,g){var w,k,x,M,P,A,_=this.strm,D=this.options.chunkSize,j=this.options.dictionary,W=!1;if(this.ended)return!1;k=g===~~g?g:g===!0?c.Z_FINISH:c.Z_NO_FLUSH,typeof m=="string"?_.input=o.binstring2buf(m):b.call(m)==="[object ArrayBuffer]"?_.input=new Uint8Array(m):_.input=m,_.next_in=0,_.avail_in=_.input.length;do{if(_.avail_out===0&&(_.output=new r.Buf8(D),_.next_out=0,_.avail_out=D),(w=i.inflate(_,c.Z_NO_FLUSH))===c.Z_NEED_DICT&&j&&(A=typeof j=="string"?o.string2buf(j):b.call(j)==="[object ArrayBuffer]"?new Uint8Array(j):j,w=i.inflateSetDictionary(this.strm,A)),w===c.Z_BUF_ERROR&&W===!0&&(w=c.Z_OK,W=!1),w!==c.Z_STREAM_END&&w!==c.Z_OK)return this.onEnd(w),!(this.ended=!0);_.next_out&&(_.avail_out!==0&&w!==c.Z_STREAM_END&&(_.avail_in!==0||k!==c.Z_FINISH&&k!==c.Z_SYNC_FLUSH)||(this.options.to==="string"?(x=o.utf8border(_.output,_.next_out),M=_.next_out-x,P=o.buf2string(_.output,x),_.next_out=M,_.avail_out=D-M,M&&r.arraySet(_.output,_.output,x,M,0),this.onData(P)):this.onData(r.shrinkBuf(_.output,_.next_out)))),_.avail_in===0&&_.avail_out===0&&(W=!0)}while((0<_.avail_in||_.avail_out===0)&&w!==c.Z_STREAM_END);return w===c.Z_STREAM_END&&(k=c.Z_FINISH),k===c.Z_FINISH?(w=i.inflateEnd(this.strm),this.onEnd(w),this.ended=!0,w===c.Z_OK):k!==c.Z_SYNC_FLUSH||(this.onEnd(c.Z_OK),!(_.avail_out=0))},u.prototype.onData=function(m){this.chunks.push(m)},u.prototype.onEnd=function(m){m===c.Z_OK&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=r.flattenChunks(this.chunks)),this.chunks=[],this.err=m,this.msg=this.strm.msg},s.Inflate=u,s.inflate=h,s.inflateRaw=function(m,g){return(g=g||{}).raw=!0,h(m,g)},s.ungzip=h},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(a,n,s){var i=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Int32Array<"u";s.assign=function(c){for(var d=Array.prototype.slice.call(arguments,1);d.length;){var f=d.shift();if(f){if(typeof f!="object")throw new TypeError(f+"must be non-object");for(var p in f)f.hasOwnProperty(p)&&(c[p]=f[p])}}return c},s.shrinkBuf=function(c,d){return c.length===d?c:c.subarray?c.subarray(0,d):(c.length=d,c)};var r={arraySet:function(c,d,f,p,b){if(d.subarray&&c.subarray)c.set(d.subarray(f,f+p),b);else for(var u=0;u<p;u++)c[b+u]=d[f+u]},flattenChunks:function(c){var d,f,p,b,u,h;for(d=p=0,f=c.length;d<f;d++)p+=c[d].length;for(h=new Uint8Array(p),d=b=0,f=c.length;d<f;d++)u=c[d],h.set(u,b),b+=u.length;return h}},o={arraySet:function(c,d,f,p,b){for(var u=0;u<p;u++)c[b+u]=d[f+u]},flattenChunks:function(c){return[].concat.apply([],c)}};s.setTyped=function(c){c?(s.Buf8=Uint8Array,s.Buf16=Uint16Array,s.Buf32=Int32Array,s.assign(s,r)):(s.Buf8=Array,s.Buf16=Array,s.Buf32=Array,s.assign(s,o))},s.setTyped(i)},{}],42:[function(a,n,s){var i=a("./common"),r=!0,o=!0;try{String.fromCharCode.apply(null,[0])}catch{r=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{o=!1}for(var c=new i.Buf8(256),d=0;d<256;d++)c[d]=252<=d?6:248<=d?5:240<=d?4:224<=d?3:192<=d?2:1;function f(p,b){if(b<65537&&(p.subarray&&o||!p.subarray&&r))return String.fromCharCode.apply(null,i.shrinkBuf(p,b));for(var u="",h=0;h<b;h++)u+=String.fromCharCode(p[h]);return u}c[254]=c[254]=1,s.string2buf=function(p){var b,u,h,m,g,w=p.length,k=0;for(m=0;m<w;m++)(64512&(u=p.charCodeAt(m)))==55296&&m+1<w&&(64512&(h=p.charCodeAt(m+1)))==56320&&(u=65536+(u-55296<<10)+(h-56320),m++),k+=u<128?1:u<2048?2:u<65536?3:4;for(b=new i.Buf8(k),m=g=0;g<k;m++)(64512&(u=p.charCodeAt(m)))==55296&&m+1<w&&(64512&(h=p.charCodeAt(m+1)))==56320&&(u=65536+(u-55296<<10)+(h-56320),m++),u<128?b[g++]=u:(u<2048?b[g++]=192|u>>>6:(u<65536?b[g++]=224|u>>>12:(b[g++]=240|u>>>18,b[g++]=128|u>>>12&63),b[g++]=128|u>>>6&63),b[g++]=128|63&u);return b},s.buf2binstring=function(p){return f(p,p.length)},s.binstring2buf=function(p){for(var b=new i.Buf8(p.length),u=0,h=b.length;u<h;u++)b[u]=p.charCodeAt(u);return b},s.buf2string=function(p,b){var u,h,m,g,w=b||p.length,k=new Array(2*w);for(u=h=0;u<w;)if((m=p[u++])<128)k[h++]=m;else if(4<(g=c[m]))k[h++]=65533,u+=g-1;else{for(m&=g===2?31:g===3?15:7;1<g&&u<w;)m=m<<6|63&p[u++],g--;1<g?k[h++]=65533:m<65536?k[h++]=m:(m-=65536,k[h++]=55296|m>>10&1023,k[h++]=56320|1023&m)}return f(k,h)},s.utf8border=function(p,b){var u;for((b=b||p.length)>p.length&&(b=p.length),u=b-1;0<=u&&(192&p[u])==128;)u--;return u<0||u===0?b:u+c[p[u]]>b?u:b}},{"./common":41}],43:[function(a,n,s){n.exports=function(i,r,o,c){for(var d=65535&i|0,f=i>>>16&65535|0,p=0;o!==0;){for(o-=p=2e3<o?2e3:o;f=f+(d=d+r[c++]|0)|0,--p;);d%=65521,f%=65521}return d|f<<16|0}},{}],44:[function(a,n,s){n.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(a,n,s){var i=(function(){for(var r,o=[],c=0;c<256;c++){r=c;for(var d=0;d<8;d++)r=1&r?3988292384^r>>>1:r>>>1;o[c]=r}return o})();n.exports=function(r,o,c,d){var f=i,p=d+c;r^=-1;for(var b=d;b<p;b++)r=r>>>8^f[255&(r^o[b])];return-1^r}},{}],46:[function(a,n,s){var i,r=a("../utils/common"),o=a("./trees"),c=a("./adler32"),d=a("./crc32"),f=a("./messages"),p=0,b=4,u=0,h=-2,m=-1,g=4,w=2,k=8,x=9,M=286,P=30,A=19,_=2*M+1,D=15,j=3,W=258,K=W+j+1,E=42,O=113,y=1,q=2,te=3,B=4;function ie(l,T){return l.msg=f[T],T}function X(l){return(l<<1)-(4<l?9:0)}function ne(l){for(var T=l.length;0<=--T;)l[T]=0}function N(l){var T=l.state,R=T.pending;R>l.avail_out&&(R=l.avail_out),R!==0&&(r.arraySet(l.output,T.pending_buf,T.pending_out,R,l.next_out),l.next_out+=R,T.pending_out+=R,l.total_out+=R,l.avail_out-=R,T.pending-=R,T.pending===0&&(T.pending_out=0))}function I(l,T){o._tr_flush_block(l,0<=l.block_start?l.block_start:-1,l.strstart-l.block_start,T),l.block_start=l.strstart,N(l.strm)}function re(l,T){l.pending_buf[l.pending++]=T}function V(l,T){l.pending_buf[l.pending++]=T>>>8&255,l.pending_buf[l.pending++]=255&T}function G(l,T){var R,z,v=l.max_chain_length,S=l.strstart,$=l.prev_length,L=l.nice_match,C=l.strstart>l.w_size-K?l.strstart-(l.w_size-K):0,F=l.window,U=l.w_mask,Z=l.prev,Q=l.strstart+W,ue=F[S+$-1],ae=F[S+$];l.prev_length>=l.good_match&&(v>>=2),L>l.lookahead&&(L=l.lookahead);do if(F[(R=T)+$]===ae&&F[R+$-1]===ue&&F[R]===F[S]&&F[++R]===F[S+1]){S+=2,R++;do;while(F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&F[++S]===F[++R]&&S<Q);if(z=W-(Q-S),S=Q-W,$<z){if(l.match_start=T,L<=($=z))break;ue=F[S+$-1],ae=F[S+$]}}while((T=Z[T&U])>C&&--v!=0);return $<=l.lookahead?$:l.lookahead}function me(l){var T,R,z,v,S,$,L,C,F,U,Z=l.w_size;do{if(v=l.window_size-l.lookahead-l.strstart,l.strstart>=Z+(Z-K)){for(r.arraySet(l.window,l.window,Z,Z,0),l.match_start-=Z,l.strstart-=Z,l.block_start-=Z,T=R=l.hash_size;z=l.head[--T],l.head[T]=Z<=z?z-Z:0,--R;);for(T=R=Z;z=l.prev[--T],l.prev[T]=Z<=z?z-Z:0,--R;);v+=Z}if(l.strm.avail_in===0)break;if($=l.strm,L=l.window,C=l.strstart+l.lookahead,F=v,U=void 0,U=$.avail_in,F<U&&(U=F),R=U===0?0:($.avail_in-=U,r.arraySet(L,$.input,$.next_in,U,C),$.state.wrap===1?$.adler=c($.adler,L,U,C):$.state.wrap===2&&($.adler=d($.adler,L,U,C)),$.next_in+=U,$.total_in+=U,U),l.lookahead+=R,l.lookahead+l.insert>=j)for(S=l.strstart-l.insert,l.ins_h=l.window[S],l.ins_h=(l.ins_h<<l.hash_shift^l.window[S+1])&l.hash_mask;l.insert&&(l.ins_h=(l.ins_h<<l.hash_shift^l.window[S+j-1])&l.hash_mask,l.prev[S&l.w_mask]=l.head[l.ins_h],l.head[l.ins_h]=S,S++,l.insert--,!(l.lookahead+l.insert<j)););}while(l.lookahead<K&&l.strm.avail_in!==0)}function ge(l,T){for(var R,z;;){if(l.lookahead<K){if(me(l),l.lookahead<K&&T===p)return y;if(l.lookahead===0)break}if(R=0,l.lookahead>=j&&(l.ins_h=(l.ins_h<<l.hash_shift^l.window[l.strstart+j-1])&l.hash_mask,R=l.prev[l.strstart&l.w_mask]=l.head[l.ins_h],l.head[l.ins_h]=l.strstart),R!==0&&l.strstart-R<=l.w_size-K&&(l.match_length=G(l,R)),l.match_length>=j)if(z=o._tr_tally(l,l.strstart-l.match_start,l.match_length-j),l.lookahead-=l.match_length,l.match_length<=l.max_lazy_match&&l.lookahead>=j){for(l.match_length--;l.strstart++,l.ins_h=(l.ins_h<<l.hash_shift^l.window[l.strstart+j-1])&l.hash_mask,R=l.prev[l.strstart&l.w_mask]=l.head[l.ins_h],l.head[l.ins_h]=l.strstart,--l.match_length!=0;);l.strstart++}else l.strstart+=l.match_length,l.match_length=0,l.ins_h=l.window[l.strstart],l.ins_h=(l.ins_h<<l.hash_shift^l.window[l.strstart+1])&l.hash_mask;else z=o._tr_tally(l,0,l.window[l.strstart]),l.lookahead--,l.strstart++;if(z&&(I(l,!1),l.strm.avail_out===0))return y}return l.insert=l.strstart<j-1?l.strstart:j-1,T===b?(I(l,!0),l.strm.avail_out===0?te:B):l.last_lit&&(I(l,!1),l.strm.avail_out===0)?y:q}function de(l,T){for(var R,z,v;;){if(l.lookahead<K){if(me(l),l.lookahead<K&&T===p)return y;if(l.lookahead===0)break}if(R=0,l.lookahead>=j&&(l.ins_h=(l.ins_h<<l.hash_shift^l.window[l.strstart+j-1])&l.hash_mask,R=l.prev[l.strstart&l.w_mask]=l.head[l.ins_h],l.head[l.ins_h]=l.strstart),l.prev_length=l.match_length,l.prev_match=l.match_start,l.match_length=j-1,R!==0&&l.prev_length<l.max_lazy_match&&l.strstart-R<=l.w_size-K&&(l.match_length=G(l,R),l.match_length<=5&&(l.strategy===1||l.match_length===j&&4096<l.strstart-l.match_start)&&(l.match_length=j-1)),l.prev_length>=j&&l.match_length<=l.prev_length){for(v=l.strstart+l.lookahead-j,z=o._tr_tally(l,l.strstart-1-l.prev_match,l.prev_length-j),l.lookahead-=l.prev_length-1,l.prev_length-=2;++l.strstart<=v&&(l.ins_h=(l.ins_h<<l.hash_shift^l.window[l.strstart+j-1])&l.hash_mask,R=l.prev[l.strstart&l.w_mask]=l.head[l.ins_h],l.head[l.ins_h]=l.strstart),--l.prev_length!=0;);if(l.match_available=0,l.match_length=j-1,l.strstart++,z&&(I(l,!1),l.strm.avail_out===0))return y}else if(l.match_available){if((z=o._tr_tally(l,0,l.window[l.strstart-1]))&&I(l,!1),l.strstart++,l.lookahead--,l.strm.avail_out===0)return y}else l.match_available=1,l.strstart++,l.lookahead--}return l.match_available&&(z=o._tr_tally(l,0,l.window[l.strstart-1]),l.match_available=0),l.insert=l.strstart<j-1?l.strstart:j-1,T===b?(I(l,!0),l.strm.avail_out===0?te:B):l.last_lit&&(I(l,!1),l.strm.avail_out===0)?y:q}function fe(l,T,R,z,v){this.good_length=l,this.max_lazy=T,this.nice_length=R,this.max_chain=z,this.func=v}function le(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=k,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new r.Buf16(2*_),this.dyn_dtree=new r.Buf16(2*(2*P+1)),this.bl_tree=new r.Buf16(2*(2*A+1)),ne(this.dyn_ltree),ne(this.dyn_dtree),ne(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new r.Buf16(D+1),this.heap=new r.Buf16(2*M+1),ne(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new r.Buf16(2*M+1),ne(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function se(l){var T;return l&&l.state?(l.total_in=l.total_out=0,l.data_type=w,(T=l.state).pending=0,T.pending_out=0,T.wrap<0&&(T.wrap=-T.wrap),T.status=T.wrap?E:O,l.adler=T.wrap===2?0:1,T.last_flush=p,o._tr_init(T),u):ie(l,h)}function ye(l){var T=se(l);return T===u&&(function(R){R.window_size=2*R.w_size,ne(R.head),R.max_lazy_match=i[R.level].max_lazy,R.good_match=i[R.level].good_length,R.nice_match=i[R.level].nice_length,R.max_chain_length=i[R.level].max_chain,R.strstart=0,R.block_start=0,R.lookahead=0,R.insert=0,R.match_length=R.prev_length=j-1,R.match_available=0,R.ins_h=0})(l.state),T}function pe(l,T,R,z,v,S){if(!l)return h;var $=1;if(T===m&&(T=6),z<0?($=0,z=-z):15<z&&($=2,z-=16),v<1||x<v||R!==k||z<8||15<z||T<0||9<T||S<0||g<S)return ie(l,h);z===8&&(z=9);var L=new le;return(l.state=L).strm=l,L.wrap=$,L.gzhead=null,L.w_bits=z,L.w_size=1<<L.w_bits,L.w_mask=L.w_size-1,L.hash_bits=v+7,L.hash_size=1<<L.hash_bits,L.hash_mask=L.hash_size-1,L.hash_shift=~~((L.hash_bits+j-1)/j),L.window=new r.Buf8(2*L.w_size),L.head=new r.Buf16(L.hash_size),L.prev=new r.Buf16(L.w_size),L.lit_bufsize=1<<v+6,L.pending_buf_size=4*L.lit_bufsize,L.pending_buf=new r.Buf8(L.pending_buf_size),L.d_buf=1*L.lit_bufsize,L.l_buf=3*L.lit_bufsize,L.level=T,L.strategy=S,L.method=R,ye(l)}i=[new fe(0,0,0,0,function(l,T){var R=65535;for(R>l.pending_buf_size-5&&(R=l.pending_buf_size-5);;){if(l.lookahead<=1){if(me(l),l.lookahead===0&&T===p)return y;if(l.lookahead===0)break}l.strstart+=l.lookahead,l.lookahead=0;var z=l.block_start+R;if((l.strstart===0||l.strstart>=z)&&(l.lookahead=l.strstart-z,l.strstart=z,I(l,!1),l.strm.avail_out===0)||l.strstart-l.block_start>=l.w_size-K&&(I(l,!1),l.strm.avail_out===0))return y}return l.insert=0,T===b?(I(l,!0),l.strm.avail_out===0?te:B):(l.strstart>l.block_start&&(I(l,!1),l.strm.avail_out),y)}),new fe(4,4,8,4,ge),new fe(4,5,16,8,ge),new fe(4,6,32,32,ge),new fe(4,4,16,16,de),new fe(8,16,32,32,de),new fe(8,16,128,128,de),new fe(8,32,128,256,de),new fe(32,128,258,1024,de),new fe(32,258,258,4096,de)],s.deflateInit=function(l,T){return pe(l,T,k,15,8,0)},s.deflateInit2=pe,s.deflateReset=ye,s.deflateResetKeep=se,s.deflateSetHeader=function(l,T){return l&&l.state?l.state.wrap!==2?h:(l.state.gzhead=T,u):h},s.deflate=function(l,T){var R,z,v,S;if(!l||!l.state||5<T||T<0)return l?ie(l,h):h;if(z=l.state,!l.output||!l.input&&l.avail_in!==0||z.status===666&&T!==b)return ie(l,l.avail_out===0?-5:h);if(z.strm=l,R=z.last_flush,z.last_flush=T,z.status===E)if(z.wrap===2)l.adler=0,re(z,31),re(z,139),re(z,8),z.gzhead?(re(z,(z.gzhead.text?1:0)+(z.gzhead.hcrc?2:0)+(z.gzhead.extra?4:0)+(z.gzhead.name?8:0)+(z.gzhead.comment?16:0)),re(z,255&z.gzhead.time),re(z,z.gzhead.time>>8&255),re(z,z.gzhead.time>>16&255),re(z,z.gzhead.time>>24&255),re(z,z.level===9?2:2<=z.strategy||z.level<2?4:0),re(z,255&z.gzhead.os),z.gzhead.extra&&z.gzhead.extra.length&&(re(z,255&z.gzhead.extra.length),re(z,z.gzhead.extra.length>>8&255)),z.gzhead.hcrc&&(l.adler=d(l.adler,z.pending_buf,z.pending,0)),z.gzindex=0,z.status=69):(re(z,0),re(z,0),re(z,0),re(z,0),re(z,0),re(z,z.level===9?2:2<=z.strategy||z.level<2?4:0),re(z,3),z.status=O);else{var $=k+(z.w_bits-8<<4)<<8;$|=(2<=z.strategy||z.level<2?0:z.level<6?1:z.level===6?2:3)<<6,z.strstart!==0&&($|=32),$+=31-$%31,z.status=O,V(z,$),z.strstart!==0&&(V(z,l.adler>>>16),V(z,65535&l.adler)),l.adler=1}if(z.status===69)if(z.gzhead.extra){for(v=z.pending;z.gzindex<(65535&z.gzhead.extra.length)&&(z.pending!==z.pending_buf_size||(z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),N(l),v=z.pending,z.pending!==z.pending_buf_size));)re(z,255&z.gzhead.extra[z.gzindex]),z.gzindex++;z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),z.gzindex===z.gzhead.extra.length&&(z.gzindex=0,z.status=73)}else z.status=73;if(z.status===73)if(z.gzhead.name){v=z.pending;do{if(z.pending===z.pending_buf_size&&(z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),N(l),v=z.pending,z.pending===z.pending_buf_size)){S=1;break}S=z.gzindex<z.gzhead.name.length?255&z.gzhead.name.charCodeAt(z.gzindex++):0,re(z,S)}while(S!==0);z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),S===0&&(z.gzindex=0,z.status=91)}else z.status=91;if(z.status===91)if(z.gzhead.comment){v=z.pending;do{if(z.pending===z.pending_buf_size&&(z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),N(l),v=z.pending,z.pending===z.pending_buf_size)){S=1;break}S=z.gzindex<z.gzhead.comment.length?255&z.gzhead.comment.charCodeAt(z.gzindex++):0,re(z,S)}while(S!==0);z.gzhead.hcrc&&z.pending>v&&(l.adler=d(l.adler,z.pending_buf,z.pending-v,v)),S===0&&(z.status=103)}else z.status=103;if(z.status===103&&(z.gzhead.hcrc?(z.pending+2>z.pending_buf_size&&N(l),z.pending+2<=z.pending_buf_size&&(re(z,255&l.adler),re(z,l.adler>>8&255),l.adler=0,z.status=O)):z.status=O),z.pending!==0){if(N(l),l.avail_out===0)return z.last_flush=-1,u}else if(l.avail_in===0&&X(T)<=X(R)&&T!==b)return ie(l,-5);if(z.status===666&&l.avail_in!==0)return ie(l,-5);if(l.avail_in!==0||z.lookahead!==0||T!==p&&z.status!==666){var L=z.strategy===2?(function(C,F){for(var U;;){if(C.lookahead===0&&(me(C),C.lookahead===0)){if(F===p)return y;break}if(C.match_length=0,U=o._tr_tally(C,0,C.window[C.strstart]),C.lookahead--,C.strstart++,U&&(I(C,!1),C.strm.avail_out===0))return y}return C.insert=0,F===b?(I(C,!0),C.strm.avail_out===0?te:B):C.last_lit&&(I(C,!1),C.strm.avail_out===0)?y:q})(z,T):z.strategy===3?(function(C,F){for(var U,Z,Q,ue,ae=C.window;;){if(C.lookahead<=W){if(me(C),C.lookahead<=W&&F===p)return y;if(C.lookahead===0)break}if(C.match_length=0,C.lookahead>=j&&0<C.strstart&&(Z=ae[Q=C.strstart-1])===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]){ue=C.strstart+W;do;while(Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Z===ae[++Q]&&Q<ue);C.match_length=W-(ue-Q),C.match_length>C.lookahead&&(C.match_length=C.lookahead)}if(C.match_length>=j?(U=o._tr_tally(C,1,C.match_length-j),C.lookahead-=C.match_length,C.strstart+=C.match_length,C.match_length=0):(U=o._tr_tally(C,0,C.window[C.strstart]),C.lookahead--,C.strstart++),U&&(I(C,!1),C.strm.avail_out===0))return y}return C.insert=0,F===b?(I(C,!0),C.strm.avail_out===0?te:B):C.last_lit&&(I(C,!1),C.strm.avail_out===0)?y:q})(z,T):i[z.level].func(z,T);if(L!==te&&L!==B||(z.status=666),L===y||L===te)return l.avail_out===0&&(z.last_flush=-1),u;if(L===q&&(T===1?o._tr_align(z):T!==5&&(o._tr_stored_block(z,0,0,!1),T===3&&(ne(z.head),z.lookahead===0&&(z.strstart=0,z.block_start=0,z.insert=0))),N(l),l.avail_out===0))return z.last_flush=-1,u}return T!==b?u:z.wrap<=0?1:(z.wrap===2?(re(z,255&l.adler),re(z,l.adler>>8&255),re(z,l.adler>>16&255),re(z,l.adler>>24&255),re(z,255&l.total_in),re(z,l.total_in>>8&255),re(z,l.total_in>>16&255),re(z,l.total_in>>24&255)):(V(z,l.adler>>>16),V(z,65535&l.adler)),N(l),0<z.wrap&&(z.wrap=-z.wrap),z.pending!==0?u:1)},s.deflateEnd=function(l){var T;return l&&l.state?(T=l.state.status)!==E&&T!==69&&T!==73&&T!==91&&T!==103&&T!==O&&T!==666?ie(l,h):(l.state=null,T===O?ie(l,-3):u):h},s.deflateSetDictionary=function(l,T){var R,z,v,S,$,L,C,F,U=T.length;if(!l||!l.state||(S=(R=l.state).wrap)===2||S===1&&R.status!==E||R.lookahead)return h;for(S===1&&(l.adler=c(l.adler,T,U,0)),R.wrap=0,U>=R.w_size&&(S===0&&(ne(R.head),R.strstart=0,R.block_start=0,R.insert=0),F=new r.Buf8(R.w_size),r.arraySet(F,T,U-R.w_size,R.w_size,0),T=F,U=R.w_size),$=l.avail_in,L=l.next_in,C=l.input,l.avail_in=U,l.next_in=0,l.input=T,me(R);R.lookahead>=j;){for(z=R.strstart,v=R.lookahead-(j-1);R.ins_h=(R.ins_h<<R.hash_shift^R.window[z+j-1])&R.hash_mask,R.prev[z&R.w_mask]=R.head[R.ins_h],R.head[R.ins_h]=z,z++,--v;);R.strstart=z,R.lookahead=j-1,me(R)}return R.strstart+=R.lookahead,R.block_start=R.strstart,R.insert=R.lookahead,R.lookahead=0,R.match_length=R.prev_length=j-1,R.match_available=0,l.next_in=L,l.input=C,l.avail_in=$,R.wrap=S,u},s.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(a,n,s){n.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(a,n,s){n.exports=function(i,r){var o,c,d,f,p,b,u,h,m,g,w,k,x,M,P,A,_,D,j,W,K,E,O,y,q;o=i.state,c=i.next_in,y=i.input,d=c+(i.avail_in-5),f=i.next_out,q=i.output,p=f-(r-i.avail_out),b=f+(i.avail_out-257),u=o.dmax,h=o.wsize,m=o.whave,g=o.wnext,w=o.window,k=o.hold,x=o.bits,M=o.lencode,P=o.distcode,A=(1<<o.lenbits)-1,_=(1<<o.distbits)-1;e:do{x<15&&(k+=y[c++]<<x,x+=8,k+=y[c++]<<x,x+=8),D=M[k&A];t:for(;;){if(k>>>=j=D>>>24,x-=j,(j=D>>>16&255)===0)q[f++]=65535&D;else{if(!(16&j)){if((64&j)==0){D=M[(65535&D)+(k&(1<<j)-1)];continue t}if(32&j){o.mode=12;break e}i.msg="invalid literal/length code",o.mode=30;break e}W=65535&D,(j&=15)&&(x<j&&(k+=y[c++]<<x,x+=8),W+=k&(1<<j)-1,k>>>=j,x-=j),x<15&&(k+=y[c++]<<x,x+=8,k+=y[c++]<<x,x+=8),D=P[k&_];a:for(;;){if(k>>>=j=D>>>24,x-=j,!(16&(j=D>>>16&255))){if((64&j)==0){D=P[(65535&D)+(k&(1<<j)-1)];continue a}i.msg="invalid distance code",o.mode=30;break e}if(K=65535&D,x<(j&=15)&&(k+=y[c++]<<x,(x+=8)<j&&(k+=y[c++]<<x,x+=8)),u<(K+=k&(1<<j)-1)){i.msg="invalid distance too far back",o.mode=30;break e}if(k>>>=j,x-=j,(j=f-p)<K){if(m<(j=K-j)&&o.sane){i.msg="invalid distance too far back",o.mode=30;break e}if(O=w,(E=0)===g){if(E+=h-j,j<W){for(W-=j;q[f++]=w[E++],--j;);E=f-K,O=q}}else if(g<j){if(E+=h+g-j,(j-=g)<W){for(W-=j;q[f++]=w[E++],--j;);if(E=0,g<W){for(W-=j=g;q[f++]=w[E++],--j;);E=f-K,O=q}}}else if(E+=g-j,j<W){for(W-=j;q[f++]=w[E++],--j;);E=f-K,O=q}for(;2<W;)q[f++]=O[E++],q[f++]=O[E++],q[f++]=O[E++],W-=3;W&&(q[f++]=O[E++],1<W&&(q[f++]=O[E++]))}else{for(E=f-K;q[f++]=q[E++],q[f++]=q[E++],q[f++]=q[E++],2<(W-=3););W&&(q[f++]=q[E++],1<W&&(q[f++]=q[E++]))}break}}break}}while(c<d&&f<b);c-=W=x>>3,k&=(1<<(x-=W<<3))-1,i.next_in=c,i.next_out=f,i.avail_in=c<d?d-c+5:5-(c-d),i.avail_out=f<b?b-f+257:257-(f-b),o.hold=k,o.bits=x}},{}],49:[function(a,n,s){var i=a("../utils/common"),r=a("./adler32"),o=a("./crc32"),c=a("./inffast"),d=a("./inftrees"),f=1,p=2,b=0,u=-2,h=1,m=852,g=592;function w(E){return(E>>>24&255)+(E>>>8&65280)+((65280&E)<<8)+((255&E)<<24)}function k(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new i.Buf16(320),this.work=new i.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function x(E){var O;return E&&E.state?(O=E.state,E.total_in=E.total_out=O.total=0,E.msg="",O.wrap&&(E.adler=1&O.wrap),O.mode=h,O.last=0,O.havedict=0,O.dmax=32768,O.head=null,O.hold=0,O.bits=0,O.lencode=O.lendyn=new i.Buf32(m),O.distcode=O.distdyn=new i.Buf32(g),O.sane=1,O.back=-1,b):u}function M(E){var O;return E&&E.state?((O=E.state).wsize=0,O.whave=0,O.wnext=0,x(E)):u}function P(E,O){var y,q;return E&&E.state?(q=E.state,O<0?(y=0,O=-O):(y=1+(O>>4),O<48&&(O&=15)),O&&(O<8||15<O)?u:(q.window!==null&&q.wbits!==O&&(q.window=null),q.wrap=y,q.wbits=O,M(E))):u}function A(E,O){var y,q;return E?(q=new k,(E.state=q).window=null,(y=P(E,O))!==b&&(E.state=null),y):u}var _,D,j=!0;function W(E){if(j){var O;for(_=new i.Buf32(512),D=new i.Buf32(32),O=0;O<144;)E.lens[O++]=8;for(;O<256;)E.lens[O++]=9;for(;O<280;)E.lens[O++]=7;for(;O<288;)E.lens[O++]=8;for(d(f,E.lens,0,288,_,0,E.work,{bits:9}),O=0;O<32;)E.lens[O++]=5;d(p,E.lens,0,32,D,0,E.work,{bits:5}),j=!1}E.lencode=_,E.lenbits=9,E.distcode=D,E.distbits=5}function K(E,O,y,q){var te,B=E.state;return B.window===null&&(B.wsize=1<<B.wbits,B.wnext=0,B.whave=0,B.window=new i.Buf8(B.wsize)),q>=B.wsize?(i.arraySet(B.window,O,y-B.wsize,B.wsize,0),B.wnext=0,B.whave=B.wsize):(q<(te=B.wsize-B.wnext)&&(te=q),i.arraySet(B.window,O,y-q,te,B.wnext),(q-=te)?(i.arraySet(B.window,O,y-q,q,0),B.wnext=q,B.whave=B.wsize):(B.wnext+=te,B.wnext===B.wsize&&(B.wnext=0),B.whave<B.wsize&&(B.whave+=te))),0}s.inflateReset=M,s.inflateReset2=P,s.inflateResetKeep=x,s.inflateInit=function(E){return A(E,15)},s.inflateInit2=A,s.inflate=function(E,O){var y,q,te,B,ie,X,ne,N,I,re,V,G,me,ge,de,fe,le,se,ye,pe,l,T,R,z,v=0,S=new i.Buf8(4),$=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!E||!E.state||!E.output||!E.input&&E.avail_in!==0)return u;(y=E.state).mode===12&&(y.mode=13),ie=E.next_out,te=E.output,ne=E.avail_out,B=E.next_in,q=E.input,X=E.avail_in,N=y.hold,I=y.bits,re=X,V=ne,T=b;e:for(;;)switch(y.mode){case h:if(y.wrap===0){y.mode=13;break}for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(2&y.wrap&&N===35615){S[y.check=0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0),I=N=0,y.mode=2;break}if(y.flags=0,y.head&&(y.head.done=!1),!(1&y.wrap)||(((255&N)<<8)+(N>>8))%31){E.msg="incorrect header check",y.mode=30;break}if((15&N)!=8){E.msg="unknown compression method",y.mode=30;break}if(I-=4,l=8+(15&(N>>>=4)),y.wbits===0)y.wbits=l;else if(l>y.wbits){E.msg="invalid window size",y.mode=30;break}y.dmax=1<<l,E.adler=y.check=1,y.mode=512&N?10:12,I=N=0;break;case 2:for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(y.flags=N,(255&y.flags)!=8){E.msg="unknown compression method",y.mode=30;break}if(57344&y.flags){E.msg="unknown header flags set",y.mode=30;break}y.head&&(y.head.text=N>>8&1),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0,y.mode=3;case 3:for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.head&&(y.head.time=N),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,S[2]=N>>>16&255,S[3]=N>>>24&255,y.check=o(y.check,S,4,0)),I=N=0,y.mode=4;case 4:for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.head&&(y.head.xflags=255&N,y.head.os=N>>8),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0,y.mode=5;case 5:if(1024&y.flags){for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.length=N,y.head&&(y.head.extra_len=N),512&y.flags&&(S[0]=255&N,S[1]=N>>>8&255,y.check=o(y.check,S,2,0)),I=N=0}else y.head&&(y.head.extra=null);y.mode=6;case 6:if(1024&y.flags&&(X<(G=y.length)&&(G=X),G&&(y.head&&(l=y.head.extra_len-y.length,y.head.extra||(y.head.extra=new Array(y.head.extra_len)),i.arraySet(y.head.extra,q,B,G,l)),512&y.flags&&(y.check=o(y.check,q,G,B)),X-=G,B+=G,y.length-=G),y.length))break e;y.length=0,y.mode=7;case 7:if(2048&y.flags){if(X===0)break e;for(G=0;l=q[B+G++],y.head&&l&&y.length<65536&&(y.head.name+=String.fromCharCode(l)),l&&G<X;);if(512&y.flags&&(y.check=o(y.check,q,G,B)),X-=G,B+=G,l)break e}else y.head&&(y.head.name=null);y.length=0,y.mode=8;case 8:if(4096&y.flags){if(X===0)break e;for(G=0;l=q[B+G++],y.head&&l&&y.length<65536&&(y.head.comment+=String.fromCharCode(l)),l&&G<X;);if(512&y.flags&&(y.check=o(y.check,q,G,B)),X-=G,B+=G,l)break e}else y.head&&(y.head.comment=null);y.mode=9;case 9:if(512&y.flags){for(;I<16;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N!==(65535&y.check)){E.msg="header crc mismatch",y.mode=30;break}I=N=0}y.head&&(y.head.hcrc=y.flags>>9&1,y.head.done=!0),E.adler=y.check=0,y.mode=12;break;case 10:for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}E.adler=y.check=w(N),I=N=0,y.mode=11;case 11:if(y.havedict===0)return E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,2;E.adler=y.check=1,y.mode=12;case 12:if(O===5||O===6)break e;case 13:if(y.last){N>>>=7&I,I-=7&I,y.mode=27;break}for(;I<3;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}switch(y.last=1&N,I-=1,3&(N>>>=1)){case 0:y.mode=14;break;case 1:if(W(y),y.mode=20,O!==6)break;N>>>=2,I-=2;break e;case 2:y.mode=17;break;case 3:E.msg="invalid block type",y.mode=30}N>>>=2,I-=2;break;case 14:for(N>>>=7&I,I-=7&I;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if((65535&N)!=(N>>>16^65535)){E.msg="invalid stored block lengths",y.mode=30;break}if(y.length=65535&N,I=N=0,y.mode=15,O===6)break e;case 15:y.mode=16;case 16:if(G=y.length){if(X<G&&(G=X),ne<G&&(G=ne),G===0)break e;i.arraySet(te,q,B,G,ie),X-=G,B+=G,ne-=G,ie+=G,y.length-=G;break}y.mode=12;break;case 17:for(;I<14;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(y.nlen=257+(31&N),N>>>=5,I-=5,y.ndist=1+(31&N),N>>>=5,I-=5,y.ncode=4+(15&N),N>>>=4,I-=4,286<y.nlen||30<y.ndist){E.msg="too many length or distance symbols",y.mode=30;break}y.have=0,y.mode=18;case 18:for(;y.have<y.ncode;){for(;I<3;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.lens[$[y.have++]]=7&N,N>>>=3,I-=3}for(;y.have<19;)y.lens[$[y.have++]]=0;if(y.lencode=y.lendyn,y.lenbits=7,R={bits:y.lenbits},T=d(0,y.lens,0,19,y.lencode,0,y.work,R),y.lenbits=R.bits,T){E.msg="invalid code lengths set",y.mode=30;break}y.have=0,y.mode=19;case 19:for(;y.have<y.nlen+y.ndist;){for(;fe=(v=y.lencode[N&(1<<y.lenbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(le<16)N>>>=de,I-=de,y.lens[y.have++]=le;else{if(le===16){for(z=de+2;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N>>>=de,I-=de,y.have===0){E.msg="invalid bit length repeat",y.mode=30;break}l=y.lens[y.have-1],G=3+(3&N),N>>>=2,I-=2}else if(le===17){for(z=de+3;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}I-=de,l=0,G=3+(7&(N>>>=de)),N>>>=3,I-=3}else{for(z=de+7;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}I-=de,l=0,G=11+(127&(N>>>=de)),N>>>=7,I-=7}if(y.have+G>y.nlen+y.ndist){E.msg="invalid bit length repeat",y.mode=30;break}for(;G--;)y.lens[y.have++]=l}}if(y.mode===30)break;if(y.lens[256]===0){E.msg="invalid code -- missing end-of-block",y.mode=30;break}if(y.lenbits=9,R={bits:y.lenbits},T=d(f,y.lens,0,y.nlen,y.lencode,0,y.work,R),y.lenbits=R.bits,T){E.msg="invalid literal/lengths set",y.mode=30;break}if(y.distbits=6,y.distcode=y.distdyn,R={bits:y.distbits},T=d(p,y.lens,y.nlen,y.ndist,y.distcode,0,y.work,R),y.distbits=R.bits,T){E.msg="invalid distances set",y.mode=30;break}if(y.mode=20,O===6)break e;case 20:y.mode=21;case 21:if(6<=X&&258<=ne){E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,c(E,V),ie=E.next_out,te=E.output,ne=E.avail_out,B=E.next_in,q=E.input,X=E.avail_in,N=y.hold,I=y.bits,y.mode===12&&(y.back=-1);break}for(y.back=0;fe=(v=y.lencode[N&(1<<y.lenbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(fe&&(240&fe)==0){for(se=de,ye=fe,pe=le;fe=(v=y.lencode[pe+((N&(1<<se+ye)-1)>>se)])>>>16&255,le=65535&v,!(se+(de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}N>>>=se,I-=se,y.back+=se}if(N>>>=de,I-=de,y.back+=de,y.length=le,fe===0){y.mode=26;break}if(32&fe){y.back=-1,y.mode=12;break}if(64&fe){E.msg="invalid literal/length code",y.mode=30;break}y.extra=15&fe,y.mode=22;case 22:if(y.extra){for(z=y.extra;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.length+=N&(1<<y.extra)-1,N>>>=y.extra,I-=y.extra,y.back+=y.extra}y.was=y.length,y.mode=23;case 23:for(;fe=(v=y.distcode[N&(1<<y.distbits)-1])>>>16&255,le=65535&v,!((de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if((240&fe)==0){for(se=de,ye=fe,pe=le;fe=(v=y.distcode[pe+((N&(1<<se+ye)-1)>>se)])>>>16&255,le=65535&v,!(se+(de=v>>>24)<=I);){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}N>>>=se,I-=se,y.back+=se}if(N>>>=de,I-=de,y.back+=de,64&fe){E.msg="invalid distance code",y.mode=30;break}y.offset=le,y.extra=15&fe,y.mode=24;case 24:if(y.extra){for(z=y.extra;I<z;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}y.offset+=N&(1<<y.extra)-1,N>>>=y.extra,I-=y.extra,y.back+=y.extra}if(y.offset>y.dmax){E.msg="invalid distance too far back",y.mode=30;break}y.mode=25;case 25:if(ne===0)break e;if(G=V-ne,y.offset>G){if((G=y.offset-G)>y.whave&&y.sane){E.msg="invalid distance too far back",y.mode=30;break}me=G>y.wnext?(G-=y.wnext,y.wsize-G):y.wnext-G,G>y.length&&(G=y.length),ge=y.window}else ge=te,me=ie-y.offset,G=y.length;for(ne<G&&(G=ne),ne-=G,y.length-=G;te[ie++]=ge[me++],--G;);y.length===0&&(y.mode=21);break;case 26:if(ne===0)break e;te[ie++]=y.length,ne--,y.mode=21;break;case 27:if(y.wrap){for(;I<32;){if(X===0)break e;X--,N|=q[B++]<<I,I+=8}if(V-=ne,E.total_out+=V,y.total+=V,V&&(E.adler=y.check=y.flags?o(y.check,te,V,ie-V):r(y.check,te,V,ie-V)),V=ne,(y.flags?N:w(N))!==y.check){E.msg="incorrect data check",y.mode=30;break}I=N=0}y.mode=28;case 28:if(y.wrap&&y.flags){for(;I<32;){if(X===0)break e;X--,N+=q[B++]<<I,I+=8}if(N!==(4294967295&y.total)){E.msg="incorrect length check",y.mode=30;break}I=N=0}y.mode=29;case 29:T=1;break e;case 30:T=-3;break e;case 31:return-4;default:return u}return E.next_out=ie,E.avail_out=ne,E.next_in=B,E.avail_in=X,y.hold=N,y.bits=I,(y.wsize||V!==E.avail_out&&y.mode<30&&(y.mode<27||O!==4))&&K(E,E.output,E.next_out,V-E.avail_out)?(y.mode=31,-4):(re-=E.avail_in,V-=E.avail_out,E.total_in+=re,E.total_out+=V,y.total+=V,y.wrap&&V&&(E.adler=y.check=y.flags?o(y.check,te,V,E.next_out-V):r(y.check,te,V,E.next_out-V)),E.data_type=y.bits+(y.last?64:0)+(y.mode===12?128:0)+(y.mode===20||y.mode===15?256:0),(re==0&&V===0||O===4)&&T===b&&(T=-5),T)},s.inflateEnd=function(E){if(!E||!E.state)return u;var O=E.state;return O.window&&(O.window=null),E.state=null,b},s.inflateGetHeader=function(E,O){var y;return E&&E.state?(2&(y=E.state).wrap)==0?u:((y.head=O).done=!1,b):u},s.inflateSetDictionary=function(E,O){var y,q=O.length;return E&&E.state?(y=E.state).wrap!==0&&y.mode!==11?u:y.mode===11&&r(1,O,q,0)!==y.check?-3:K(E,O,q,q)?(y.mode=31,-4):(y.havedict=1,b):u},s.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(a,n,s){var i=a("../utils/common"),r=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],o=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],c=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],d=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];n.exports=function(f,p,b,u,h,m,g,w){var k,x,M,P,A,_,D,j,W,K=w.bits,E=0,O=0,y=0,q=0,te=0,B=0,ie=0,X=0,ne=0,N=0,I=null,re=0,V=new i.Buf16(16),G=new i.Buf16(16),me=null,ge=0;for(E=0;E<=15;E++)V[E]=0;for(O=0;O<u;O++)V[p[b+O]]++;for(te=K,q=15;1<=q&&V[q]===0;q--);if(q<te&&(te=q),q===0)return h[m++]=20971520,h[m++]=20971520,w.bits=1,0;for(y=1;y<q&&V[y]===0;y++);for(te<y&&(te=y),E=X=1;E<=15;E++)if(X<<=1,(X-=V[E])<0)return-1;if(0<X&&(f===0||q!==1))return-1;for(G[1]=0,E=1;E<15;E++)G[E+1]=G[E]+V[E];for(O=0;O<u;O++)p[b+O]!==0&&(g[G[p[b+O]]++]=O);if(_=f===0?(I=me=g,19):f===1?(I=r,re-=257,me=o,ge-=257,256):(I=c,me=d,-1),E=y,A=m,ie=O=N=0,M=-1,P=(ne=1<<(B=te))-1,f===1&&852<ne||f===2&&592<ne)return 1;for(;;){for(D=E-ie,W=g[O]<_?(j=0,g[O]):g[O]>_?(j=me[ge+g[O]],I[re+g[O]]):(j=96,0),k=1<<E-ie,y=x=1<<B;h[A+(N>>ie)+(x-=k)]=D<<24|j<<16|W|0,x!==0;);for(k=1<<E-1;N&k;)k>>=1;if(k!==0?(N&=k-1,N+=k):N=0,O++,--V[E]==0){if(E===q)break;E=p[b+g[O]]}if(te<E&&(N&P)!==M){for(ie===0&&(ie=te),A+=y,X=1<<(B=E-ie);B+ie<q&&!((X-=V[B+ie])<=0);)B++,X<<=1;if(ne+=1<<B,f===1&&852<ne||f===2&&592<ne)return 1;h[M=N&P]=te<<24|B<<16|A-m|0}}return N!==0&&(h[A+N]=E-ie<<24|64<<16|0),w.bits=te,0}},{"../utils/common":41}],51:[function(a,n,s){n.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(a,n,s){var i=a("../utils/common"),r=0,o=1;function c(v){for(var S=v.length;0<=--S;)v[S]=0}var d=0,f=29,p=256,b=p+1+f,u=30,h=19,m=2*b+1,g=15,w=16,k=7,x=256,M=16,P=17,A=18,_=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],D=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],j=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],W=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],K=new Array(2*(b+2));c(K);var E=new Array(2*u);c(E);var O=new Array(512);c(O);var y=new Array(256);c(y);var q=new Array(f);c(q);var te,B,ie,X=new Array(u);function ne(v,S,$,L,C){this.static_tree=v,this.extra_bits=S,this.extra_base=$,this.elems=L,this.max_length=C,this.has_stree=v&&v.length}function N(v,S){this.dyn_tree=v,this.max_code=0,this.stat_desc=S}function I(v){return v<256?O[v]:O[256+(v>>>7)]}function re(v,S){v.pending_buf[v.pending++]=255&S,v.pending_buf[v.pending++]=S>>>8&255}function V(v,S,$){v.bi_valid>w-$?(v.bi_buf|=S<<v.bi_valid&65535,re(v,v.bi_buf),v.bi_buf=S>>w-v.bi_valid,v.bi_valid+=$-w):(v.bi_buf|=S<<v.bi_valid&65535,v.bi_valid+=$)}function G(v,S,$){V(v,$[2*S],$[2*S+1])}function me(v,S){for(var $=0;$|=1&v,v>>>=1,$<<=1,0<--S;);return $>>>1}function ge(v,S,$){var L,C,F=new Array(g+1),U=0;for(L=1;L<=g;L++)F[L]=U=U+$[L-1]<<1;for(C=0;C<=S;C++){var Z=v[2*C+1];Z!==0&&(v[2*C]=me(F[Z]++,Z))}}function de(v){var S;for(S=0;S<b;S++)v.dyn_ltree[2*S]=0;for(S=0;S<u;S++)v.dyn_dtree[2*S]=0;for(S=0;S<h;S++)v.bl_tree[2*S]=0;v.dyn_ltree[2*x]=1,v.opt_len=v.static_len=0,v.last_lit=v.matches=0}function fe(v){8<v.bi_valid?re(v,v.bi_buf):0<v.bi_valid&&(v.pending_buf[v.pending++]=v.bi_buf),v.bi_buf=0,v.bi_valid=0}function le(v,S,$,L){var C=2*S,F=2*$;return v[C]<v[F]||v[C]===v[F]&&L[S]<=L[$]}function se(v,S,$){for(var L=v.heap[$],C=$<<1;C<=v.heap_len&&(C<v.heap_len&&le(S,v.heap[C+1],v.heap[C],v.depth)&&C++,!le(S,L,v.heap[C],v.depth));)v.heap[$]=v.heap[C],$=C,C<<=1;v.heap[$]=L}function ye(v,S,$){var L,C,F,U,Z=0;if(v.last_lit!==0)for(;L=v.pending_buf[v.d_buf+2*Z]<<8|v.pending_buf[v.d_buf+2*Z+1],C=v.pending_buf[v.l_buf+Z],Z++,L===0?G(v,C,S):(G(v,(F=y[C])+p+1,S),(U=_[F])!==0&&V(v,C-=q[F],U),G(v,F=I(--L),$),(U=D[F])!==0&&V(v,L-=X[F],U)),Z<v.last_lit;);G(v,x,S)}function pe(v,S){var $,L,C,F=S.dyn_tree,U=S.stat_desc.static_tree,Z=S.stat_desc.has_stree,Q=S.stat_desc.elems,ue=-1;for(v.heap_len=0,v.heap_max=m,$=0;$<Q;$++)F[2*$]!==0?(v.heap[++v.heap_len]=ue=$,v.depth[$]=0):F[2*$+1]=0;for(;v.heap_len<2;)F[2*(C=v.heap[++v.heap_len]=ue<2?++ue:0)]=1,v.depth[C]=0,v.opt_len--,Z&&(v.static_len-=U[2*C+1]);for(S.max_code=ue,$=v.heap_len>>1;1<=$;$--)se(v,F,$);for(C=Q;$=v.heap[1],v.heap[1]=v.heap[v.heap_len--],se(v,F,1),L=v.heap[1],v.heap[--v.heap_max]=$,v.heap[--v.heap_max]=L,F[2*C]=F[2*$]+F[2*L],v.depth[C]=(v.depth[$]>=v.depth[L]?v.depth[$]:v.depth[L])+1,F[2*$+1]=F[2*L+1]=C,v.heap[1]=C++,se(v,F,1),2<=v.heap_len;);v.heap[--v.heap_max]=v.heap[1],(function(ae,be){var Ie,Pe,yt,we,$t,ua,Le=be.dyn_tree,sn=be.max_code,Vr=be.stat_desc.static_tree,Kr=be.stat_desc.has_stree,Qr=be.stat_desc.extra_bits,on=be.stat_desc.extra_base,ht=be.stat_desc.max_length,Rt=0;for(we=0;we<=g;we++)ae.bl_count[we]=0;for(Le[2*ae.heap[ae.heap_max]+1]=0,Ie=ae.heap_max+1;Ie<m;Ie++)ht<(we=Le[2*Le[2*(Pe=ae.heap[Ie])+1]+1]+1)&&(we=ht,Rt++),Le[2*Pe+1]=we,sn<Pe||(ae.bl_count[we]++,$t=0,on<=Pe&&($t=Qr[Pe-on]),ua=Le[2*Pe],ae.opt_len+=ua*(we+$t),Kr&&(ae.static_len+=ua*(Vr[2*Pe+1]+$t)));if(Rt!==0){do{for(we=ht-1;ae.bl_count[we]===0;)we--;ae.bl_count[we]--,ae.bl_count[we+1]+=2,ae.bl_count[ht]--,Rt-=2}while(0<Rt);for(we=ht;we!==0;we--)for(Pe=ae.bl_count[we];Pe!==0;)sn<(yt=ae.heap[--Ie])||(Le[2*yt+1]!==we&&(ae.opt_len+=(we-Le[2*yt+1])*Le[2*yt],Le[2*yt+1]=we),Pe--)}})(v,S),ge(F,ue,v.bl_count)}function l(v,S,$){var L,C,F=-1,U=S[1],Z=0,Q=7,ue=4;for(U===0&&(Q=138,ue=3),S[2*($+1)+1]=65535,L=0;L<=$;L++)C=U,U=S[2*(L+1)+1],++Z<Q&&C===U||(Z<ue?v.bl_tree[2*C]+=Z:C!==0?(C!==F&&v.bl_tree[2*C]++,v.bl_tree[2*M]++):Z<=10?v.bl_tree[2*P]++:v.bl_tree[2*A]++,F=C,ue=(Z=0)===U?(Q=138,3):C===U?(Q=6,3):(Q=7,4))}function T(v,S,$){var L,C,F=-1,U=S[1],Z=0,Q=7,ue=4;for(U===0&&(Q=138,ue=3),L=0;L<=$;L++)if(C=U,U=S[2*(L+1)+1],!(++Z<Q&&C===U)){if(Z<ue)for(;G(v,C,v.bl_tree),--Z!=0;);else C!==0?(C!==F&&(G(v,C,v.bl_tree),Z--),G(v,M,v.bl_tree),V(v,Z-3,2)):Z<=10?(G(v,P,v.bl_tree),V(v,Z-3,3)):(G(v,A,v.bl_tree),V(v,Z-11,7));F=C,ue=(Z=0)===U?(Q=138,3):C===U?(Q=6,3):(Q=7,4)}}c(X);var R=!1;function z(v,S,$,L){V(v,(d<<1)+(L?1:0),3),(function(C,F,U,Z){fe(C),re(C,U),re(C,~U),i.arraySet(C.pending_buf,C.window,F,U,C.pending),C.pending+=U})(v,S,$)}s._tr_init=function(v){R||((function(){var S,$,L,C,F,U=new Array(g+1);for(C=L=0;C<f-1;C++)for(q[C]=L,S=0;S<1<<_[C];S++)y[L++]=C;for(y[L-1]=C,C=F=0;C<16;C++)for(X[C]=F,S=0;S<1<<D[C];S++)O[F++]=C;for(F>>=7;C<u;C++)for(X[C]=F<<7,S=0;S<1<<D[C]-7;S++)O[256+F++]=C;for($=0;$<=g;$++)U[$]=0;for(S=0;S<=143;)K[2*S+1]=8,S++,U[8]++;for(;S<=255;)K[2*S+1]=9,S++,U[9]++;for(;S<=279;)K[2*S+1]=7,S++,U[7]++;for(;S<=287;)K[2*S+1]=8,S++,U[8]++;for(ge(K,b+1,U),S=0;S<u;S++)E[2*S+1]=5,E[2*S]=me(S,5);te=new ne(K,_,p+1,b,g),B=new ne(E,D,0,u,g),ie=new ne(new Array(0),j,0,h,k)})(),R=!0),v.l_desc=new N(v.dyn_ltree,te),v.d_desc=new N(v.dyn_dtree,B),v.bl_desc=new N(v.bl_tree,ie),v.bi_buf=0,v.bi_valid=0,de(v)},s._tr_stored_block=z,s._tr_flush_block=function(v,S,$,L){var C,F,U=0;0<v.level?(v.strm.data_type===2&&(v.strm.data_type=(function(Z){var Q,ue=4093624447;for(Q=0;Q<=31;Q++,ue>>>=1)if(1&ue&&Z.dyn_ltree[2*Q]!==0)return r;if(Z.dyn_ltree[18]!==0||Z.dyn_ltree[20]!==0||Z.dyn_ltree[26]!==0)return o;for(Q=32;Q<p;Q++)if(Z.dyn_ltree[2*Q]!==0)return o;return r})(v)),pe(v,v.l_desc),pe(v,v.d_desc),U=(function(Z){var Q;for(l(Z,Z.dyn_ltree,Z.l_desc.max_code),l(Z,Z.dyn_dtree,Z.d_desc.max_code),pe(Z,Z.bl_desc),Q=h-1;3<=Q&&Z.bl_tree[2*W[Q]+1]===0;Q--);return Z.opt_len+=3*(Q+1)+5+5+4,Q})(v),C=v.opt_len+3+7>>>3,(F=v.static_len+3+7>>>3)<=C&&(C=F)):C=F=$+5,$+4<=C&&S!==-1?z(v,S,$,L):v.strategy===4||F===C?(V(v,2+(L?1:0),3),ye(v,K,E)):(V(v,4+(L?1:0),3),(function(Z,Q,ue,ae){var be;for(V(Z,Q-257,5),V(Z,ue-1,5),V(Z,ae-4,4),be=0;be<ae;be++)V(Z,Z.bl_tree[2*W[be]+1],3);T(Z,Z.dyn_ltree,Q-1),T(Z,Z.dyn_dtree,ue-1)})(v,v.l_desc.max_code+1,v.d_desc.max_code+1,U+1),ye(v,v.dyn_ltree,v.dyn_dtree)),de(v),L&&fe(v)},s._tr_tally=function(v,S,$){return v.pending_buf[v.d_buf+2*v.last_lit]=S>>>8&255,v.pending_buf[v.d_buf+2*v.last_lit+1]=255&S,v.pending_buf[v.l_buf+v.last_lit]=255&$,v.last_lit++,S===0?v.dyn_ltree[2*$]++:(v.matches++,S--,v.dyn_ltree[2*(y[$]+p+1)]++,v.dyn_dtree[2*I(S)]++),v.last_lit===v.lit_bufsize-1},s._tr_align=function(v){V(v,2,3),G(v,x,K),(function(S){S.bi_valid===16?(re(S,S.bi_buf),S.bi_buf=0,S.bi_valid=0):8<=S.bi_valid&&(S.pending_buf[S.pending++]=255&S.bi_buf,S.bi_buf>>=8,S.bi_valid-=8)})(v)}},{"../utils/common":41}],53:[function(a,n,s){n.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(a,n,s){(function(i){(function(r,o){if(!r.setImmediate){var c,d,f,p,b=1,u={},h=!1,m=r.document,g=Object.getPrototypeOf&&Object.getPrototypeOf(r);g=g&&g.setTimeout?g:r,c={}.toString.call(r.process)==="[object process]"?function(M){process.nextTick(function(){k(M)})}:(function(){if(r.postMessage&&!r.importScripts){var M=!0,P=r.onmessage;return r.onmessage=function(){M=!1},r.postMessage("","*"),r.onmessage=P,M}})()?(p="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",x,!1):r.attachEvent("onmessage",x),function(M){r.postMessage(p+M,"*")}):r.MessageChannel?((f=new MessageChannel).port1.onmessage=function(M){k(M.data)},function(M){f.port2.postMessage(M)}):m&&"onreadystatechange"in m.createElement("script")?(d=m.documentElement,function(M){var P=m.createElement("script");P.onreadystatechange=function(){k(M),P.onreadystatechange=null,d.removeChild(P),P=null},d.appendChild(P)}):function(M){setTimeout(k,0,M)},g.setImmediate=function(M){typeof M!="function"&&(M=new Function(""+M));for(var P=new Array(arguments.length-1),A=0;A<P.length;A++)P[A]=arguments[A+1];var _={callback:M,args:P};return u[b]=_,c(b),b++},g.clearImmediate=w}function w(M){delete u[M]}function k(M){if(h)setTimeout(k,0,M);else{var P=u[M];if(P){h=!0;try{(function(A){var _=A.callback,D=A.args;switch(D.length){case 0:_();break;case 1:_(D[0]);break;case 2:_(D[0],D[1]);break;case 3:_(D[0],D[1],D[2]);break;default:_.apply(o,D)}})(P)}finally{w(M),h=!1}}}}function x(M){M.source===r&&typeof M.data=="string"&&M.data.indexOf(p)===0&&k(+M.data.slice(p.length))}})(typeof self>"u"?i===void 0?this:i:self)}).call(this,typeof Tt<"u"?Tt:typeof self<"u"?self:typeof window<"u"?window:{})},{}]},{},[10])(10)})})(wa)),wa.exports}var rd=nd();const Pr=ad(rd),sd=String.raw`
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

function aeAttachCaption(parent, caption, listener, event, playbackMs) {
  if (!caption || !caption.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.style.animation = aeCaptionAnimation(caption.intro ?? "slide", caption.outro ?? "fade", playbackMs);
  label.textContent = aeCaptionText(caption.template, listener, event);
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
  label.style.textShadow = "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
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
`,id=String.raw`
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
`;function od(e){const t=e.effects.filter(s=>s.enabled),a=t.map(Jn),n=a.map(s=>({instanceId:s.instanceId,effectId:s.effectId,seed:s.seed,settings:s.settings,timingAnimation:Oa(s)?.animation??null,motionAnimation:Ba(s)?.animation??null,trigger:Ae(s.trigger)??null,playbackMs:Pt(s)}));return{html:cd(),css:ld(a),javascript:pd(n),estimatedDomNodes:fd(t),estimatedPerformanceCost:md(t)}}function cd(){return`
<div id="animated-effects-root"></div>
`.trim()}function ld(e){return`
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

${ud(e).map(a=>Ne(a)?.css).filter(a=>!!a).join(`

`)}

${Zo}

${e.flatMap(a=>[Oa(a)?.css,Ba(a)?.css]).filter(Boolean).join(`
`)}
`.trim()}function dd(e){return JSON.stringify(e,null,2).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")}function pd(e){const a=[...new Set(e.map(i=>i.effectId))].map(i=>{const r=Ne(i);return r?{effectId:i,rendererName:r.streamElementsRendererName,source:r.streamElementsRendererSource}:null}).filter(i=>i!==null),n=a.map(i=>i.source).join(`

`),s=a.map(i=>`${JSON.stringify(i.effectId)}: ${i.rendererName}`).join(`,
  `);return`
const effects = ${dd(e)};

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

${id}

${sd}

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
`.trim()}function ud(e){return[...new Set(e.map(t=>t.effectId))]}function fd(e){let t=1;for(const a of e){t+=1;const n=Ne(a.effectId);n&&(t+=n.estimateDomNodes(a.settings))}return t}function md(e){return e.reduce((t,a)=>{const n=Ne(a.effectId);return t+(n?.definition.performanceCost??1)},0)}const Cr={mode:"always",chatCommand:"!hype",activeDurationMs:5e3,cooldownMs:1e4},yd=new Set(["always","chat-command","follower","subscriber","tip","cheer","raid"]);function Nn(e,t,a,n){const s=typeof e=="string"&&e.trim()===""?NaN:Number(e);return Number.isFinite(s)?Math.round(Math.max(a,Math.min(n,s))):t}function et(e={}){const t=Cr,a=typeof e.mode=="string"&&yd.has(e.mode)?e.mode:t.mode,n=typeof e.chatCommand=="string"?e.chatCommand.trim().toLowerCase():t.chatCommand;return{mode:a,chatCommand:/^![a-z0-9_]{1,24}$/.test(n)?n:t.chatCommand,activeDurationMs:Nn(e.activeDurationMs,t.activeDurationMs,500,6e4),cooldownMs:Nn(e.cooldownMs,t.cooldownMs,0,3e5)}}const pa=8;function mt(e,t){const a=new Set(t),n=new Set,s=[];for(const i of e.slice(0,pa)){const r=typeof i?.id=="string"?i.id.trim():"";if(!/^[a-zA-Z0-9_-]{1,48}$/.test(r)||n.has(r))continue;const o=et(i);if(o.mode==="always")continue;const c=[...new Set((Array.isArray(i.effectInstanceIds)?i.effectInstanceIds:[]).filter(d=>typeof d=="string"&&a.has(d)))];c.length!==0&&(n.add(r),s.push({...o,id:r,effectInstanceIds:c}))}return s}function Qt(e,t={},a){const n=et(t),s=e.effects.some(o=>o.enabled&&o.trigger?.source==="event");if(a===void 0&&n.mode==="always"&&s)return od(e);const i=e.effects.filter(o=>o.enabled),r=i.map(o=>({instanceId:o.instanceId,effectId:o.effectId,seed:o.seed,settings:o.settings}));return{html:hd(),css:gd(i),javascript:bd(r,et(t),a===void 0?void 0:mt(a,i.map(o=>o.instanceId))),estimatedDomNodes:kd(i),estimatedPerformanceCost:vd(i)}}function hd(){return`
<div id="animated-effects-root"></div>
`.trim()}function gd(e){return`
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

${wd(e).map(a=>Ne(a)?.css).filter(a=>!!a).join(`

`)}
`.trim()}function bd(e,t,a){const s=[...new Set(e.map(o=>o.effectId))].map(o=>{const c=Ne(o);return c?{effectId:o,rendererName:c.streamElementsRendererName,source:c.streamElementsRendererSource}:null}).filter(o=>o!==null),i=s.map(o=>o.source).join(`

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
`.trim()}function wd(e){return[...new Set(e.map(t=>t.effectId))]}function kd(e){let t=1;for(const a of e){t+=1;const n=Ne(a.effectId);n&&(t+=n.estimateDomNodes(a.settings))}return t}function vd(e){return e.reduce((t,a)=>{const n=Ne(a.effectId);return t+(n?.definition.performanceCost??1)},0)}let qt=null,Ca=!1,Ht=!1,bt=null;function xd(e){return e.replace(/<\/script/gi,"<\\/script")}function jr(e){let t=2166136261;for(let a=0;a<e.length;a++)t^=e.charCodeAt(a),t=Math.imul(t,16777619);return t>>>0}function zd(e){return e.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"effect"}async function _r(e,t,a,n){const s=Qt(e),i=document.createElement("iframe");Object.assign(i.style,{position:"fixed",left:"-100000px",top:"0",width:`${t}px`,height:`${a}px`,border:"0",pointerEvents:"none"}),i.width=String(t),i.height=String(a),i.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>${s.css}
html,body{width:${t}px!important;height:${a}px!important;${n?`background:${n}!important;`:"background:transparent!important;"}}</style></head><body>${s.html}<script>${xd(s.javascript)}<\/script></body></html>`,document.body.appendChild(i),await new Promise((d,f)=>{const p=window.setTimeout(()=>f(new Error("Timeout renderera eksportu.")),1e4);i.addEventListener("load",()=>{clearTimeout(p),d()},{once:!0})});const r=i.contentWindow,o=i.contentDocument;if(!r||!o)throw i.remove(),new Error("Nie udało się utworzyÄ‡ renderera eksportu.");r.dispatchEvent(new Event("onWidgetLoad")),await new Promise(d=>requestAnimationFrame(()=>requestAnimationFrame(()=>d())));const c=o.getElementById("animated-effects-root");if(!c)throw i.remove(),new Error("Renderer eksportu nie utworzyĹ‚ sceny.");return{iframe:i,root:c,document:o}}function Sd(e,t){e.document.getAnimations().forEach(a=>{a.pause();try{a.currentTime=t}catch{}})}async function $r(e,t,a,n,s){return Sd(e,n),await new Promise(i=>requestAnimationFrame(()=>i())),Ol(e.root,{width:t,height:a,canvasWidth:t,canvasHeight:a,pixelRatio:1,backgroundColor:s??void 0})}function $e(e,t,a){const n=Number(e.querySelector(t)?.value);return Number.isFinite(n)?n:a}function Va(e){const t=e.querySelector("[data-media-background]")?.value??"black";return t==="transparent"?null:t==="black"?"#000000":e.querySelector("[data-media-color]")?.value??"#080b12"}function Ke(e,t,a=0){const n=e.querySelector("[data-media-status]");n&&(n.textContent=t);const s=e.querySelector("[data-media-progress]");s&&(s.value=Math.max(0,Math.min(100,a)))}function Te(e,t,a=0){const n=e.querySelector("[data-batch-status]");n&&(n.textContent=t);const s=e.querySelector("[data-batch-progress]");s&&(s.value=Math.max(0,Math.min(100,a)))}function Rr(e,t){const a=URL.createObjectURL(e),n=document.createElement("a");n.href=a,n.download=t,n.click(),setTimeout(()=>URL.revokeObjectURL(a),1500)}async function Ir(e,t,a,n,s,i,r,o,c){const d=Math.max(1,Math.round(n*s)),f=Math.round(1e3/s),p=await _r(e,t,a,r),b=Jl();try{for(let u=0;u<d;u++){if(o())return null;const m=(await $r(p,t,a,u*(1e3/s),r)).getContext("2d",{willReadFrequently:!0});if(!m)throw new Error("Brak Canvas 2D.");const g=m.getImageData(0,0,t,a).data,w=Xl(g,i,{format:"rgb565"}),k=Hl(g,w,"rgb565");b.writeFrame(k,t,a,{palette:w,delay:f,repeat:0}),c(u+1,d),await new Promise(x=>setTimeout(x,0))}return b.finish(),new Blob([b.bytes()],{type:"image/gif"})}finally{p.iframe.remove()}}async function Md(e){const t=Math.round($e(e,"[data-media-width]",1920)),a=Math.round($e(e,"[data-media-height]",1080)),n=$e(e,"[data-png-time]",0)*1e3,s=Va(e);Ke(e,"Renderowanie PNG...",20);const i=await _r(he(),t,a,s);try{const r=await $r(i,t,a,n,s),o=await new Promise((c,d)=>r.toBlob(f=>f?c(f):d(new Error("Nie udało się zakodowaÄ‡ PNG.")),"image/png"));Rr(o,`animated-effects-${t}x${a}.png`),Ke(e,`PNG gotowy · ${(o.size/1024/1024).toFixed(1)} MB`,100)}finally{i.iframe.remove()}}async function Ed(e){Ca=!1;const t=Math.max(240,Math.min(1920,Math.round($e(e,"[data-media-width]",1280)))),a=Math.max(240,Math.min(1080,Math.round($e(e,"[data-media-height]",720)))),n=Math.max(.5,Math.min(30,$e(e,"[data-gif-seconds]",5))),s=Math.max(5,Math.min(30,Math.round($e(e,"[data-gif-fps]",15)))),i=e.querySelector("[data-gif-quality]")?.value??"medium",r=i==="low"?96:i==="high"?256:160,o=Va(e),c=await Ir(he(),t,a,n,s,r,o,()=>Ca,(p,b)=>{Ke(e,`GIF · klatka ${p} / ${b}`,p/b*100)});if(!c){Ke(e,"Generowanie anulowane.",0);return}bt&&URL.revokeObjectURL(bt),bt=URL.createObjectURL(c);const d=e.querySelector("[data-gif-preview]");d&&(d.src=bt,d.hidden=!1);const f=e.querySelector("[data-gif-save]");f&&(f.href=bt,f.download=`animated-effects-${t}x${a}-${s}fps.gif`,f.hidden=!1),Ke(e,`GIF gotowy · ${(c.size/1024/1024).toFixed(1)} MB`,100)}function Pd(e,t){const a=jt().find(i=>i.id===t);if(!a)throw new Error(`Nie znaleziono efektu: ${t}`);const n=structuredClone(e),s=`batch-${t}`;return n.effects=[{instanceId:s,effectId:a.id,seed:jr(a.id),enabled:!0,settings:{...a.defaultSettings},label:a.name,locked:!1,groupId:null}],n.selectedEffectInstanceId=s,n.activePresetId=null,n}async function Cd(e){Ht=!1;const t=Math.max(320,Math.min(1280,Math.round($e(e,"[data-batch-width]",640)))),a=Math.max(180,Math.min(720,Math.round($e(e,"[data-batch-height]",360)))),n=Math.max(1,Math.min(30,$e(e,"[data-batch-seconds]",10))),s=Math.max(5,Math.min(20,Math.round($e(e,"[data-batch-fps]",12)))),i=e.querySelector("[data-batch-quality]")?.value??"medium",r=i==="low"?80:i==="high"?192:128,o=e.querySelector("[data-batch-category]")?.value??"all",c=jt().filter(m=>o==="all"||m.category===o);if(c.length===0){Te(e,"Brak efektów dla wybranego filtra.",0);return}const d=e.querySelector("[data-batch-gif]"),f=e.querySelector("[data-cancel-batch]");d&&(d.disabled=!0),f&&(f.hidden=!1);const p=new Pr,b=he(),u=Va(e),h=[];try{for(let g=0;g<c.length;g++){if(Ht){Te(e,"Batch anulowany.",0);return}const w=c[g],k=Pd(b,w.id),x=g/c.length,M=1/c.length;Te(e,`GIF ${g+1} / ${c.length} · ${w.name}`,x*94);const P=await Ir(k,t,a,n,s,r,u,()=>Ht,(_,D)=>{const j=_/D;Te(e,`${w.name} · klatka ${_} / ${D}`,(x+M*j)*94)});if(!P){Te(e,"Batch anulowany.",0);return}const A=zd(w.id);p.file(`${A}.gif`,P),h.push({id:w.id,name:w.name,seed:jr(w.id)}),await new Promise(_=>setTimeout(_,0))}p.file("manifest.json",JSON.stringify({generatedAt:new Date().toISOString(),width:t,height:a,seconds:n,fps:s,category:o,effects:h},null,2)),Te(e,"Pakowanie ZIP...",95);const m=await p.generateAsync({type:"blob",compression:"STORE"},g=>{Te(e,`Pakowanie ZIP · ${Math.round(g.percent)}%`,95+g.percent*.05)});Rr(m,`animated-effects-batch-${t}x${a}-${n}s.zip`),Te(e,`Gotowe · ${c.length} GIF · ${(m.size/1024/1024).toFixed(1)} MB ZIP`,100)}finally{d&&(d.disabled=!1),f&&(f.hidden=!0)}}function jd(){const e=jt(),t=[...new Set(e.map(n=>n.category))].sort(),a=document.createElement("dialog");return a.className="export-dialog ae-media-dialog",a.innerHTML=`<div class="export-header"><div><strong>PNG / GIF</strong><span>Render sceny bez interfejsu edytora</span></div><button type="button" data-media-close>×</button></div>
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
  </div>`,a.querySelector("[data-media-close]")?.addEventListener("click",()=>a.close()),a.querySelector("[data-cancel-gif]")?.addEventListener("click",()=>{Ca=!0}),a.querySelector("[data-cancel-batch]")?.addEventListener("click",()=>{Ht=!0}),a.querySelector("[data-generate-png]")?.addEventListener("click",()=>{Md(a).catch(n=>Ke(a,n instanceof Error?n.message:String(n),0))}),a.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{Ed(a).catch(n=>Ke(a,n instanceof Error?n.message:String(n),0))}),a.querySelector("[data-batch-gif]")?.addEventListener("click",()=>{Cd(a).catch(n=>Te(a,n instanceof Error?n.message:String(n),0))}),document.body.appendChild(a),a}function _d(){qt||(qt=jd()),qt.open||qt.showModal()}const Ar="animated-effects:pack06:favorites",Nr="animated-effects:pack06:usage",Lr="animated-effects:pack06:recent";let Ln=!1,Dr=!1,wt=null,ka=null;const ct=new Set;let Ft=null;function Ka(e,t){try{const a=localStorage.getItem(e);return a?JSON.parse(a):t}catch{return t}}function ja(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}let it=new Set(Ka(Ar,[])),lt=Ka(Nr,{}),zt=Ka(Lr,{});function $d(e){lt={...lt,[e]:(lt[e]??0)+1},zt={...zt,[e]:Date.now()},ja(Nr,lt),ja(Lr,zt)}function Rd(e){const t=e.querySelector(".ae-effect-card-main strong")?.textContent?.trim();return t?jt().find(a=>a.name===t):void 0}function Id(e,t){if(e.style.setProperty("display","grid","important"),e.style.setProperty("height","auto","important"),e.style.setProperty("overflow","hidden","important"),e.style.setProperty("align-items","center","important"),e.style.setProperty("box-sizing","border-box","important"),t){e.style.setProperty("grid-template-columns","26px minmax(0, 1fr)","important"),e.style.setProperty("grid-template-areas",'"favorite preview" "actions actions"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto) 36px","important"),e.style.setProperty("min-height","98px","important"),e.style.setProperty("padding","7px 8px 10px","important"),e.style.setProperty("column-gap","7px","important"),e.style.setProperty("row-gap","8px","important");return}e.style.setProperty("grid-template-columns","26px minmax(0, 1fr) 36px","important"),e.style.setProperty("grid-template-areas",'"favorite preview add"',"important"),e.style.setProperty("grid-template-rows","minmax(42px, auto)","important"),e.style.setProperty("min-height","58px","important"),e.style.setProperty("padding","6px 8px","important"),e.style.setProperty("gap","6px","important")}function Ad(e){e.style.setProperty("display","grid","important"),e.style.setProperty("grid-template-columns","repeat(3, minmax(0, 1fr))","important"),e.style.setProperty("grid-area","actions","important"),e.style.setProperty("height","36px","important"),e.style.setProperty("min-height","36px","important"),e.style.setProperty("margin","0 0 0 28px","important"),e.style.setProperty("padding","0","important"),e.style.setProperty("gap","6px","important"),e.style.setProperty("align-self","end","important"),e.querySelectorAll("button").forEach(t=>{t.style.setProperty("height","34px","important"),t.style.setProperty("min-height","34px","important"),t.style.setProperty("width","100%","important"),t.style.setProperty("min-width","0","important"),t.style.setProperty("margin","0","important"),t.style.setProperty("padding","0 6px","important")})}function Nd(){const e=document.querySelector("#effect-library");if(!e)return;const t=he(),a=document.querySelector("#pack06-library-mode")?.value??"all",n=document.querySelector("#pack06-library-sort")?.value??"name",s=Array.from(e.querySelectorAll(".ae-effect-card"));for(const r of s){const o=Rd(r);if(!o)continue;r.dataset.pack06="1",r.dataset.effectId=o.id;const c=t.effects.filter(h=>h.effectId===o.id),d=c.at(-1)??null,f=[...c].reverse().find(h=>!h.locked)??null,p=c.length>0;r.classList.toggle("is-on-scene",p),r.dataset.pack13Card="1",r.dataset.pack13Active=p?"1":"0",r.dataset.pack14Card="1",r.dataset.pack14Active=p?"1":"0",Id(r,p);const b=r.querySelector(".ae-add-icon");b&&b.parentElement!==r&&r.appendChild(b),r.querySelector(":scope > .ae-pack06-favorite")?.remove(),r.querySelector(":scope > .ae-pack06-card-actions")?.remove(),r.querySelector(".ae-pack06-scene-badge")?.remove();const u=document.createElement("button");if(u.type="button",u.className="ae-pack06-favorite",u.textContent=it.has(o.id)?"★":"☆",u.title="Ulubione",u.addEventListener("click",()=>{it.has(o.id)?it.delete(o.id):it.add(o.id),ja(Ar,[...it]),pt()}),r.prepend(u),p){const h=r.querySelector(".ae-effect-card-subline");if(h){const m=document.createElement("span");m.className="ae-pack06-scene-badge",m.textContent="NA SCENIE",h.appendChild(m)}}if(b)if(b.dataset.pack14Track!=="1"&&(b.dataset.pack14Track="1",b.addEventListener("click",()=>{$d(o.id)},{capture:!0})),p){const h=document.createElement("div");h.className="ae-pack06-card-actions ae-pack14-card-actions";const m=document.createElement("button");m.type="button",m.className="ae-pack06-minus",m.textContent="−",m.disabled=!f,m.title=f?"Usuń ostatnią niezablokowaną instancję":"Wszystkie instancje są zablokowane",m.addEventListener("click",()=>{f&&nr(f.instanceId)});const g=document.createElement("button");g.type="button",g.className="ae-pack06-count",g.textContent=`${c.length}×`,g.title="Pokaż w Warstwach",g.addEventListener("click",()=>{d&&(rr(d.instanceId),document.querySelector('[data-sidebar-tab="layers"]')?.click(),setTimeout(()=>{document.querySelector(`[data-pack06-instance-id="${d.instanceId}"]`)?.scrollIntoView({block:"nearest"})},0))}),h.append(m,g,b),Ad(h),r.appendChild(h)}else b.parentElement!==r&&r.appendChild(b)}const i=Array.from(e.querySelectorAll(".ae-effect-card[data-effect-id]"));for(const r of i){const o=r.dataset.effectId??"",c=t.effects.filter(d=>d.effectId===o).length;r.hidden=a==="favorites"&&!it.has(o)||a==="scene"&&c===0}i.sort((r,o)=>{const c=r.dataset.effectId??"",d=o.dataset.effectId??"",f=ze(c),p=ze(d);if(!f||!p)return 0;switch(n){case"used":return(lt[d]??0)-(lt[c]??0);case"recent":return(zt[d]??0)-(zt[c]??0);case"light":return f.performanceCost-p.performanceCost;case"heavy":return p.performanceCost-f.performanceCost;case"category":return f.category.localeCompare(p.category)||f.name.localeCompare(p.name);default:return f.name.localeCompare(p.name)}}),i.forEach(r=>{e.appendChild(r)})}function Ld(){const e=Array.from(document.querySelectorAll(".ae-layer-row")),t=[...he().effects].reverse();e.forEach((a,n)=>{const s=t[n];if(!s)return;a.dataset.pack06InstanceId=s.instanceId,a.classList.toggle("is-locked",!!s.locked),a.classList.toggle("is-solo",ct.has(s.instanceId));const i=a.querySelector(".ae-layer-copy strong");i&&s.label&&(i.textContent=s.label);const r=a.querySelector(".ae-layer-actions");if(!r||r.dataset.pack06==="1")return;r.dataset.pack06="1";const o=document.createElement("button");o.type="button",o.className="ae-icon-button ae-pack06-solo",o.textContent="S",o.title="Solo",o.addEventListener("click",()=>{ct.has(s.instanceId)?ct.delete(s.instanceId):ct.add(s.instanceId),Tr(),pt()});const c=document.createElement("button");c.type="button",c.className="ae-icon-button ae-pack06-lock",c.textContent=s.locked?"L":"U",c.title=s.locked?"Odblokuj":"Zablokuj",c.addEventListener("click",()=>oc(s.instanceId));const d=document.createElement("button");d.type="button",d.className="ae-icon-button ae-pack06-duplicate",d.textContent="⧉",d.title="Duplikuj · Shift = zachowaj seed",d.addEventListener("click",f=>rc(s.instanceId,f.shiftKey)),r.append(o,c,d);for(const f of[".layer-remove",".layer-up",".layer-down"]){const p=a.querySelector(f);p&&s.locked&&(p.disabled=!0)}a.querySelector(".ae-layer-select")?.addEventListener("dblclick",()=>{const f=ze(s.effectId),p=window.prompt("Nazwa warstwy:",s.label??f?.name??s.effectId);p!==null&&cc(s.instanceId,p)}),a.draggable=!s.locked,a.addEventListener("dragstart",()=>{s.locked||(wt=s.instanceId,a.classList.add("is-dragging"))}),a.addEventListener("dragend",()=>{wt=null,a.classList.remove("is-dragging")}),a.addEventListener("dragover",f=>{wt&&!s.locked&&f.preventDefault()}),a.addEventListener("drop",f=>{f.preventDefault(),wt&&pc(wt,s.instanceId)})})}function Tr(){const e=document.querySelector("#effect-preview");e&&e.querySelectorAll(".effect-layer").forEach(t=>{const a=t.dataset.instanceId;t.style.display=ct.size===0||a&&ct.has(a)?"":"none"})}function Dd(){const e=document.querySelector("#inspector"),t=xt();if(!e||!t||e.querySelector("[data-pack06-inspector]"))return;const a=ze(t.effectId);if(!a)return;const n=document.createElement("section");n.className="inspector-group ae-pack06-inspector",n.dataset.pack06Inspector="1",n.innerHTML=`<div class="ae-pack06-inspector-title"><strong>Losowość i narzędzia</strong><span>Seed, intensywność i kopiowanie ustawień</span></div>
  <label class="inspector-field"><span class="inspector-label"><span>Seed</span></span><div class="ae-pack06-seed-row"><input type="number" min="0" max="4294967295" value="${t.seed}" data-pack06-seed><button type="button" class="inspector-field-reset" data-pack06-reroll>Losuj</button></div></label>
  ${a.capabilities.intensity?`<label class="inspector-field"><span class="inspector-label"><span>Intensywność</span><output data-pack06-intensity-out>${t.settings.intensity}%</output></span><input type="range" min="0" max="400" value="${t.settings.intensity}" data-pack06-intensity></label>`:""}
  <div class="ae-pack06-copy-row"><button type="button" class="ae-button ae-button-secondary" data-pack06-copy>Kopiuj ustawienia</button><button type="button" class="ae-button ae-button-secondary" data-pack06-paste ${Ft?"":"disabled"}>Wklej</button></div>`,e.querySelector(".inspector-title")?.insertAdjacentElement("afterend",n);const s=n.querySelector("[data-pack06-seed]");s?.addEventListener("change",()=>sr(t.instanceId,Number(s.value))),n.querySelector("[data-pack06-reroll]")?.addEventListener("click",()=>mc(t.instanceId));const i=n.querySelector("[data-pack06-intensity]");i?.addEventListener("input",()=>{const r=Number(i.value),o=n.querySelector("[data-pack06-intensity-out]");o&&(o.value=`${r}%`),Se(t.instanceId,{intensity:r})}),n.querySelector("[data-pack06-copy]")?.addEventListener("click",()=>{Ft=structuredClone(t.settings);const r=n.querySelector("[data-pack06-paste]");r&&(r.disabled=!1)}),n.querySelector("[data-pack06-paste]")?.addEventListener("click",()=>{Ft&&Se(t.instanceId,structuredClone(Ft))})}function Or(){const t=he().effects.filter(d=>d.enabled),a=t.reduce((d,f)=>d+1+(Ne(f.effectId)?.estimateDomNodes(f.settings)??0),1),n=t.reduce((d,f)=>d+(ze(f.effectId)?.performanceCost??1),0),s=document.querySelector("#pack06-performance");s&&(s.textContent=`DOM ~${a} · koszt ${n}`,s.classList.toggle("is-warning",a>600||n>24));const i=document.querySelector("#pack06-undo");i&&(i.disabled=!ac(),i.title=un()?`Cofnij: ${un()}`:"Brak zmian do cofnięcia");const r=document.querySelector("#pack06-redo");r&&(r.disabled=!nc(),r.title=fn()?`Ponów: ${fn()}`:"Brak zmian do ponowienia");const o=document.querySelector("#pack06-recover");o&&(o.disabled=!Zc());const c=document.querySelector("#pack06-pause");c&&(c.textContent=Dr?"▶ Wznów":"⏸ Pauza")}function pt(){Nd(),Ld(),Dd(),Tr(),Or()}function Td(){ka!==null&&clearTimeout(ka),ka=window.setTimeout(()=>Xc(he()),700)}function Od(){const e=document.querySelector(".ae-header-status");if(e&&!document.querySelector("#pack06-performance")){const s=document.createElement("span");s.id="pack06-performance",s.className="ae-status-pill",e.appendChild(s)}const t=document.querySelector(".ae-header-actions");if(!t||document.querySelector("#pack06-undo"))return;t.classList.add("ae-pack06-header-actions");const a=document.createElement("div");a.className="ae-pack06-header-group",a.innerHTML=`<button id="pack06-undo" class="ae-button ae-button-secondary" type="button">↶</button><button id="pack06-redo" class="ae-button ae-button-secondary" type="button">↷</button><button id="pack06-pause" class="ae-button ae-button-secondary" type="button">⏸ Pauza</button>
  <select id="pack06-preset" class="ae-category-select"><option value="">Preset sceny…</option>${zn.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select>
  <button id="pack06-save" class="ae-button ae-button-secondary" type="button">Zapisz scenę</button><button id="pack06-load" class="ae-button ae-button-secondary" type="button">Wczytaj</button><button id="pack06-recover" class="ae-button ae-button-secondary" type="button">Autozapis</button><button id="pack06-reroll-all" class="ae-button ae-button-secondary" type="button">🎲 Seedy</button><button id="pack06-media" class="ae-button ae-button-secondary" type="button">PNG / GIF</button>`,t.prepend(a),document.querySelector("#pack06-undo")?.addEventListener("click",()=>er()),document.querySelector("#pack06-redo")?.addEventListener("click",()=>tr()),document.querySelector("#pack06-pause")?.addEventListener("click",()=>document.dispatchEvent(new Event("animated-effects:transport-toggle"))),document.addEventListener("animated-effects:transport-state",s=>{Dr=!s.detail.playing,Or()}),document.querySelector("#pack06-reroll-all")?.addEventListener("click",()=>yc()),document.querySelector("#pack06-media")?.addEventListener("click",()=>_d());const n=document.querySelector("#pack06-preset");n?.addEventListener("change",()=>{const s=zn.find(i=>i.id===n.value);s&&(hc(s.effects,`Preset: ${s.name}`),n.value="")}),document.querySelector("#pack06-save")?.addEventListener("click",()=>Uc(he())),document.querySelector("#pack06-load")?.addEventListener("click",()=>document.querySelector("#pack06-file-input")?.click()),document.querySelector("#pack06-recover")?.addEventListener("click",()=>{const s=Hc(he());s&&Xa(s,"Przywróć autozapis")})}function qd(){const e=document.querySelector(".ae-effect-filters");if(!e)return;let t=e.querySelector(":scope > .ae-pack14-library-tools");t||(t=document.createElement("div"),t.className="ae-pack06-library-tools ae-pack14-library-tools",e.appendChild(t));let a=document.querySelector("#pack06-library-mode");a||(a=document.createElement("select"),a.id="pack06-library-mode",a.className="ae-category-select",a.innerHTML='<option value="all">Widok: Wszystkie</option><option value="favorites">Widok: ★ Ulubione</option><option value="scene">Widok: ● Na scenie</option>',a.addEventListener("change",pt));let n=document.querySelector("#pack06-library-sort");n||(n=document.createElement("select"),n.id="pack06-library-sort",n.className="ae-category-select",n.innerHTML='<option value="name">Sortuj: Nazwa</option><option value="category">Sortuj: Kategoria</option><option value="used">Sortuj: Najczęściej używane</option><option value="recent">Sortuj: Ostatnio używane</option><option value="light">Sortuj: Najlżejsze</option><option value="heavy">Sortuj: Najcięższe</option>',n.addEventListener("change",pt)),a.parentElement!==t&&t.appendChild(a),n.parentElement!==t&&t.appendChild(n)}function Fd(){if(document.querySelector("#pack06-file-input"))return;const e=document.createElement("input");e.id="pack06-file-input",e.type="file",e.accept=".json,.aescene.json,application/json",e.hidden=!0,e.addEventListener("change",async()=>{const t=e.files?.[0];if(t)try{const a=ur(await t.text(),he());Xa(a.state,`Wczytaj: ${a.name}`),a.warnings.length&&window.alert(["Scena wczytana z ostrzeżeniami:","",...a.warnings.slice(0,12)].join(`
`))}catch(a){window.alert(a instanceof Error?a.message:String(a))}finally{e.value=""}}),document.body.appendChild(e)}function Bd(){document.addEventListener("keydown",e=>{const t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(e.ctrlKey&&!e.shiftKey&&e.key.toLowerCase()==="z"){e.preventDefault(),er();return}(e.ctrlKey&&e.key.toLowerCase()==="y"||e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="z")&&(e.preventDefault(),tr())}})}function Wd(){const e=document.querySelector("#inspector");if(!e)return;let t=!1;e.addEventListener("pointerdown",n=>{const s=n.target;s instanceof HTMLInputElement&&s.type==="range"&&(t=!0,Qo("Zmień parametr"))});const a=()=>{t&&(t=!1,ec())};window.addEventListener("pointerup",a),window.addEventListener("pointercancel",a)}function Ud(){Ln||(Ln=!0,Od(),qd(),Fd(),Bd(),Wd(),tc(),Qn(()=>{queueMicrotask(pt),Td()}),pt())}let va=!1,_a=null;function Xd(){const e=document.querySelector(".ae-pack06-header-group");if(!e||document.querySelector(".ae-polish02-header"))return;const t=h=>e.querySelector(h),a=t("#pack06-undo"),n=t("#pack06-redo"),s=t("#pack06-pause"),i=t("#pack06-preset"),r=t("#pack06-save"),o=t("#pack06-load"),c=t("#pack06-recover"),d=t("#pack06-reroll-all"),f=t("#pack06-media");if(!a||!n||!s||!i||!r||!o||!c||!d||!f)return;c.textContent="Przywróć autozapis";const p=document.createElement("div");p.className="ae-polish02-header";const b=document.createElement("div");b.className="ae-polish02-direct",b.append(a,n,s);const u=(h,m)=>{const g=document.createElement("details");g.className="ae-polish02-menu";const w=document.createElement("summary");w.innerHTML=`${h} <span>▾</span>`;const k=document.createElement("div");return k.className="ae-polish02-menu-panel",k.append(...m),g.append(w,k),g};p.append(b,u("Scena",[i,r,o,c]),u("Narzędzia",[d,f])),e.replaceWith(p)}function Zd(){const e=document.querySelector("#pack06-library-mode"),t=document.querySelector("#pack06-library-sort"),a=["Widok: Wszystkie","Widok: ★ Ulubione","Widok: ● Na scenie"],n=["Sortuj: Nazwa","Sortuj: Kategoria","Sortuj: Najczęściej używane","Sortuj: Ostatnio używane","Sortuj: Najlżejsze","Sortuj: Najcięższe"];e&&Array.from(e.options).forEach((s,i)=>{s.textContent=a[i]??s.textContent}),t&&Array.from(t.options).forEach((s,i)=>{s.textContent=n[i]??s.textContent})}function Hd(){const e=document.querySelector("#effect-library");e&&(e.querySelectorAll(".ae-pack06-scene-badge").forEach(t=>t.remove()),Array.from(e.querySelectorAll(".ae-effect-card")).forEach(t=>{t.classList.add("ae-polish02-card");const a=t.querySelector(".ae-pack06-count");if(a){const s=a.textContent?.replace(/[^0-9]/g,"")||"1";a.textContent=s,a.title=`${s} warstw(y) · przejdź do Warstw`}const n=t.querySelector(".ae-pack06-favorite");n&&(n.title=n.textContent==="★"?"Usuń z ulubionych":"Dodaj do ulubionych")}),_a!==null&&(_a=null,requestAnimationFrame(()=>{document.querySelector("#effect-library")})))}function Yd(){const e=document.querySelector(".ae-inspector-panel");if(!e)return;e.classList.add("ae-polish02-inspector");const t=e.querySelector(".ae-pack06-inspector-title strong");t&&(t.textContent="Losowość")}function Bt(e){const t=(b,u)=>{const h=Number(e.querySelector(b)?.value??u);return Number.isFinite(h)?h:u},a=t("[data-media-width]",1280),n=t("[data-media-height]",720),s=t("[data-gif-seconds]",5),i=t("[data-gif-fps]",15),r=Math.max(1,Math.round(s*i)),o=a*n*r,c=o>3e8?"WYSOKIE":o>12e7?"ŚREDNIE":"NISKIE",d=e.querySelector("[data-polish02-summary]");d&&(d.innerHTML=`
      <strong>${r} klatek</strong>
      <span>${a} × ${n} · ${i} FPS · obciążenie: ${c}</span>
    `);const f=e.querySelector("[data-media-background]"),p=e.querySelector("[data-media-color]");f&&p&&(p.disabled=f.value!=="custom")}function Gd(){const e=document.querySelector(".ae-media-dialog");if(!e||e.dataset.polish02==="1")return;e.dataset.polish02="1";const t=e.querySelector(".ae-media-export");if(!t)return;const a=t.querySelector(":scope > .ae-media-grid");if(a){const r=document.createElement("section");r.className="ae-polish02-output";const o=document.createElement("div");o.className="ae-polish02-card-heading",o.innerHTML=`
      <strong>Ustawienia wyjścia</strong>
      <span>Rozdzielczość i tło eksportowanej sceny</span>
    `;const c=document.createElement("div");c.className="ae-polish02-presets",[["720p",1280,720],["1080p",1920,1080],["1:1",1080,1080],["9:16",1080,1920]].forEach(([f,p,b])=>{const u=document.createElement("button");u.type="button",u.textContent=f,u.addEventListener("click",()=>{const h=e.querySelector("[data-media-width]"),m=e.querySelector("[data-media-height]");h&&(h.value=String(p)),m&&(m.value=String(b)),Bt(e)}),c.appendChild(u)}),r.append(o,c,a),t.prepend(r)}const n=Array.from(t.querySelectorAll(".ae-media-section"));n.forEach(r=>{r.classList.add("ae-polish02-media-card");const o=r.querySelector("h3");if(o&&!r.querySelector(".ae-polish02-description")){const c=document.createElement("p");c.className="ae-polish02-description",c.textContent=o.textContent==="PNG"?"Pojedyncza klatka sceny w wybranym momencie animacji.":"Animowana pętla. Więcej klatek oznacza dłuższe generowanie i większy plik.",o.insertAdjacentElement("afterend",c)}});const s=n.find(r=>r.querySelector("h3")?.textContent==="GIF");if(s&&!s.querySelector("[data-polish02-summary]")){const r=document.createElement("div");r.className="ae-polish02-summary",r.dataset.polish02Summary="1",s.querySelector(".ae-media-actions")?.insertAdjacentElement("beforebegin",r)}const i=e.querySelector("[data-cancel-gif]");i&&(i.hidden=!0),e.querySelector("[data-generate-gif]")?.addEventListener("click",()=>{i&&(i.hidden=!1);const r=e.querySelector("[data-gif-preview]");r&&(r.hidden=!0)}),e.addEventListener("input",()=>{Bt(e)}),e.addEventListener("change",()=>{Bt(e)}),Bt(e)}function Dn(){Xd(),Zd(),Hd(),Yd(),Gd()}function Jd(){document.querySelector("#effect-library")?.addEventListener("click",t=>{const a=t.target;a instanceof Element&&a.closest(".ae-add-icon, .ae-pack06-minus")&&(_a=document.querySelector("#effect-library")?.scrollTop??0)},!0),Dn();const e=new MutationObserver(()=>{va||(va=!0,requestAnimationFrame(()=>{e.disconnect();try{Dn()}finally{va=!1,e.observe(document.body,{childList:!0,subtree:!0})}}))});e.observe(document.body,{childList:!0,subtree:!0})}const Tn="animated-effects-module-styles";function Vd(e){Kd();const t=document.createElement("div");return t.id="effect-preview",t.className="effect-preview",e.appendChild(t),t}function $a(e,t){const a=Ne(t.effectId);if(!a){console.warn(`Unknown effect: ${t.effectId}`);return}const n=document.createElement("div");n.className="effect-layer ae-layer",n.dataset.effectId=t.effectId,n.dataset.instanceId=t.instanceId,tp(n,t.settings);const s=np(t.seed);a.renderPreview(n,t.settings,s);const i=Oa(t),r=Ba(t);let o=e;for(const[c,d]of[[i,"ae-timed-layer"],[r,"ae-motion-layer"]]){if(!c)continue;const f=document.createElement("style");f.textContent=c.css,e.appendChild(f);const p=document.createElement("div");p.className=d,Object.assign(p.style,{position:"absolute",inset:"0",overflow:"hidden",pointerEvents:"none",zIndex:String(t.settings.zIndex),animation:c.animation}),o.appendChild(p),o=p}r&&(n.style.transform="none"),o.appendChild(n)}function Kd(){if(document.getElementById(Tn))return;const e=document.createElement("style");e.id=Tn,e.textContent=To().map(t=>t.css).join(`

`),document.head.appendChild(e)}function Qd(e){const t=/^#[0-9a-f]{6}$/i.test(e)?e.slice(1):"a88cff",a=parseInt(t.slice(0,2),16)/255,n=parseInt(t.slice(2,4),16)/255,s=parseInt(t.slice(4,6),16)/255,i=Math.max(a,n,s),r=Math.min(a,n,s),o=i-r;let c=0;o!==0&&(i===a?c=60*((n-s)/o%6):i===n?c=60*((s-a)/o+2):c=60*((a-n)/o+4)),c<0&&(c+=360);const d=(i+r)/2,f=o===0?0:o/(1-Math.abs(2*d-1));return{h:c,s:f*100,l:d*100}}function ep(e){if(!e.colorize)return"";const{h:t,s:a,l:n}=Qd(e.color??"#a88cff");if(a<4)return`
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
  `}function tp(e,t){e.style.opacity=String(t.opacity/100),e.style.transform=`
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
    ${ep(t)}
    blur(
      ${t.blur}px
    )
    brightness(
      ${t.brightness/100}
    )
    hue-rotate(
      ${t.hue}deg
    )
  `,e.style.mixBlendMode=t.blendMode,e.style.zIndex=String(t.zIndex),e.style.clipPath=ap(t.area)}function ap(e){switch(e){case"left":return"inset(0 50% 0 0)";case"center":return"inset(0 25% 0 25%)";case"right":return"inset(0 0 0 50%)";case"top":return"inset(0 0 50% 0)";case"bottom":return"inset(50% 0 0 0)";default:return"none"}}function np(e){let t=e>>>0;return()=>{t+=1831565813;let a=t;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}const Oe=new Map,qe=e=>String(Number((e/1e3).toFixed(3)));function Ra(e){const t=ve(e.timeline,e.settings).keyframes??[],a=Oe.get(e.instanceId);return t.find(n=>n.timeMs===a)??t.at(-1)??null}function rp(e){const t=ve(e.timeline,e.settings),a=t.keyframes??[],n=Ra(e),s=a.length===0?0:a.length===1?t.durationMs:Math.round(t.durationMs/2),i=[{key:"timeMs",label:"Moment (s)",value:n?qe(n.timeMs):"0",min:0,max:qe(t.durationMs),step:"0.1"},{key:"x",label:"Pozycja X (%)",value:n?.x??e.settings.x,min:-300,max:300,step:"1"},{key:"y",label:"Pozycja Y (%)",value:n?.y??e.settings.y,min:-300,max:300,step:"1"},{key:"scale",label:"Skala (%)",value:n?.scale??e.settings.scale,min:10,max:400,step:"1"},{key:"rotation",label:"Obrót (°)",value:n?.rotation??e.settings.rotation,min:-1080,max:1080,step:"1"},{key:"opacity",label:"Widoczność (%)",value:n?.opacity??100,min:0,max:100,step:"1"}];return`
    <section class="ae-keyframe-editor" aria-label="Klatki kluczowe warstwy">
      <div class="ae-keyframe-head">
        <strong>Klatki kluczowe</strong>
        <small>${a.length} / ${Gt} · ruch całej warstwy</small>
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
          title="Klatka ${o+1}: ${qe(r.timeMs)} s"
          aria-label="Klatka ${o+1}, ${qe(r.timeMs)} sekundy. Przeciągnij albo użyj strzałek."></button>`).join("")}
      </div>
      <output class="ae-keyframe-drag-time" data-kf-drag-time aria-live="off">Przesuń punkt, aby zmienić moment klatki · krok 0,1 s</output>
      <label class="inspector-field">
        <span class="inspector-label"><span>Edytowana klatka</span></span>
        <select data-kf-select aria-label="Wybierz klatkę kluczową" ${a.length?"":"disabled"}>
          ${a.map((r,o)=>`<option value="${r.timeMs}" ${n?.timeMs===r.timeMs?"selected":""}>${o+1}. ${qe(r.timeMs)} s</option>`).join("")}
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
          <input data-kf-new-time type="number" inputmode="decimal" value="${qe(s)}" min="0" max="${qe(t.durationMs)}" step="0.1">
        </label>
        <button type="button" class="ae-button ae-button-secondary" data-kf-add ${a.length>=Gt?"disabled":""}>+ Dodaj</button>
        <button type="button" class="ae-button ae-button-secondary" data-kf-delete ${n?"":"disabled"}>Usuń klatkę</button>
      </div>
    </section>
  `}function sp(e,t){const a=()=>he().effects.find(o=>o.instanceId===t),n=e.querySelector("[data-kf-select]"),s=e.querySelectorAll("[data-kf-field]");n?.addEventListener("change",()=>{const o=a();if(!o)return;const c=Number(n.value);Oe.set(t,c);const d=ve(o.timeline,o.settings),f=d.keyframes?.find(p=>p.timeMs===c);f&&(document.dispatchEvent(new CustomEvent("animated-effects:preview-seek",{detail:{ms:d.delayMs+f.timeMs}})),s.forEach(p=>{const b=p.dataset.kfField;b==="timeMs"?p.value=qe(f.timeMs):(b==="x"||b==="y"||b==="scale"||b==="rotation"||b==="opacity")&&(p.value=String(f[b]))}))}),s.forEach(o=>{o.addEventListener("change",()=>{const c=a(),d=c?Ra(c):null,f=o.dataset.kfField,p=Number(o.value);if(!(!d||!Number.isFinite(p)||!f))if(f==="timeMs"){const b=Math.round(p*1e3);Oe.set(t,Math.max(0,Math.min(ve(c.timeline,c.settings).durationMs,b))),Nt(t,d.timeMs,{timeMs:b})}else(f==="x"||f==="y"||f==="scale"||f==="rotation"||f==="opacity")&&Nt(t,d.timeMs,{[f]:p})})});const i=e.querySelector("[data-kf-ruler]"),r=e.querySelector("[data-kf-drag-time]");i?.querySelectorAll("[data-kf-marker]").forEach(o=>{const c=Number(o.dataset.kfMarker),d=a();if(!d||!Number.isFinite(c))return;const f=ve(d.timeline,d.settings).durationMs,p=()=>{Oe.set(t,c),n&&(n.value=String(c),n.dispatchEvent(new Event("change",{bubbles:!0}))),i.querySelectorAll(".ae-keyframe-dot").forEach(k=>k.classList.toggle("is-selected",k===o))};let b=!1,u=null,h=c;const m=k=>{const x=i.getBoundingClientRect();return bc(k,x.left,x.width,f)},g=k=>{o.style.left=`${(k/f*100).toFixed(3)}%`,r&&(r.value=`Moment klatki: ${qe(k)} s`)},w=k=>{if(!b)return;b=!1,u!==null&&o.hasPointerCapture(u)&&o.releasePointerCapture(u),u=null;const x=a(),M=x&&ve(x.timeline,x.settings).keyframes?.some(P=>P.timeMs===h&&P.timeMs!==c);k&&h!==c&&!M?(Oe.set(t,h),Nt(t,c,{timeMs:h})):(g(c),M&&r&&(r.value="W tym miejscu jest już inna klatka."))};o.addEventListener("pointerdown",k=>{k.button===0&&(p(),b=!0,h=c,u=k.pointerId,o.setPointerCapture(k.pointerId),k.preventDefault())}),o.addEventListener("pointermove",k=>{!b||k.pointerId!==u||(h=m(k.clientX),g(h))}),o.addEventListener("pointerup",k=>{k.pointerId===u&&(h=m(k.clientX),w(!0))}),o.addEventListener("pointercancel",()=>w(!1)),o.addEventListener("keydown",k=>{const x=k.key==="ArrowRight"?1:k.key==="ArrowLeft"?-1:0;if(!x)return;k.preventDefault();const M=Math.max(0,Math.min(f,c+x*(k.shiftKey?1e3:100)));if(M===c)return;const P=a();P&&ve(P.timeline,P.settings).keyframes?.some(A=>A.timeMs===M&&A.timeMs!==c)||(Oe.set(t,M),Nt(t,c,{timeMs:M}))}),o.addEventListener("click",k=>{k.detail===0&&p()})}),e.querySelector("[data-kf-easing]")?.addEventListener("change",o=>{const c=o.currentTarget.value;Jt(t,{easing:c==="ease-in-out"?"ease-in-out":"linear"})}),e.querySelector("[data-kf-add]")?.addEventListener("click",()=>{const o=e.querySelector("[data-kf-new-time]"),c=Math.round(Number(o?.value??0)*1e3);if(!Number.isFinite(c))return;const d=a();if(!d)return;const f=ve(d.timeline,d.settings).durationMs;Oe.set(t,Math.max(0,Math.min(f,c))),uc(t,c)}),e.querySelector("[data-kf-delete]")?.addEventListener("click",()=>{const o=a(),c=o?Ra(o):null;c&&(Oe.delete(t),fc(t,c.timeMs))}),e.querySelectorAll("[data-kf-preset]").forEach(o=>{o.addEventListener("click",()=>{const c=a();if(!c)return;const d=ve(c.timeline,c.settings),f={x:c.settings.x,y:c.settings.y,scale:c.settings.scale,rotation:c.settings.rotation,opacity:100},p=o.dataset.kfPreset==="pulse"?[{timeMs:0,...f},{timeMs:Math.round(d.durationMs/2),...f,scale:Math.min(400,f.scale*1.3)},{timeMs:d.durationMs,...f}]:[{timeMs:0,...f},{timeMs:d.durationMs,...f,x:Math.min(300,f.x+35)}];Oe.set(t,d.durationMs),Jt(t,{mode:d.mode==="off"?"once":d.mode,keyframes:p})})})}const qr={"follower-latest":5,"subscriber-latest":7,"tip-latest":9,"cheer-latest":8,"raid-latest":8,message:2},Fr={"follower-latest":"Dzięki za follow, {name}!","subscriber-latest":"{name} — dzięki za subskrypcję!","tip-latest":"{name} przekazał {amount}!","cheer-latest":"{name} wysłał {amount} bits!","raid-latest":"{name} robi raid ({amount})!",message:"{name}: {message}"};function ip(e){const t=Ae(e.trigger),a=t?.event??"follower-latest",n=a==="tip-latest"||a==="cheer-latest"||a==="raid-latest",s=Wa({...t?.caption,template:t?.caption?.template??Fr[a]}),i=r=>r.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return`
    <section class="ae-trigger-panel" aria-label="Wyzwalacze StreamElements">
      <div class="ae-trigger-heading">
        <strong>Wyzwalacz StreamElements</strong>
        <span>Uruchamiaj tę warstwę po zdarzeniu ze streamu</span>
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Uruchamianie warstwy</span></span>
        <select data-ae-trigger-event aria-label="Zdarzenie uruchamiające animację">
          <option value="always" ${t?"":"selected"}>Od razu (zawsze)</option>
          ${ut.map(r=>`
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
            value="${t?.priority??qr[a]}">
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
            <p class="ae-timeline-hint">Dostępne zmienne: <code>{name}</code>, <code>{amount}</code>, <code>{message}</code>, <code>{event}</code>. Nazwy widzów i wiadomości są wyświetlane jako zwykły tekst.</p>
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
            <div class="ae-caption-row">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wejścia</span></span>
                <select data-ae-caption-intro>
                  <option value="slide" ${s.intro==="slide"?"selected":""}>Wjazd</option>
                  <option value="fade" ${s.intro==="fade"?"selected":""}>Pojawienie</option>
                  <option value="pop" ${s.intro==="pop"?"selected":""}>Powiększenie</option>
                </select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wyjścia</span></span>
                <select data-ae-caption-outro>
                  <option value="fade" ${s.outro==="fade"?"selected":""}>Zanikanie</option>
                  <option value="slide" ${s.outro==="slide"?"selected":""}>Wyjazd</option>
                  <option value="pop" ${s.outro==="pop"?"selected":""}>Zmniejszenie</option>
                </select>
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
          </div>
        </div>
        <p class="ae-timeline-hint">Każde zdarzenie odtwarza jeden cykl animacji (również jeśli oś czasu ustawiono na pętlę). Przy kolejnych zdarzeniach warstwa jest uruchamiana od początku.</p>
        <button type="button" class="ae-button ae-button-secondary" data-ae-trigger-test>
          <span aria-hidden="true">▶</span> Testuj w podglądzie
        </button>
      </div>
      ${t?"":'<p class="ae-timeline-hint">Warstwa jest widoczna od razu. Efekt nie czeka na wydarzenie.</p>'}
    </section>
  `}function op(e,t){const a=e.querySelector("[data-ae-trigger-event]"),n=i=>{const r=Ae(t.trigger),o=a?.value;if(!o||o==="always"){Ea(t.instanceId,void 0);return}ut.some(c=>c.value===o)&&Ea(t.instanceId,{source:"event",event:i.event??o,cooldownMs:i.cooldownMs??r?.cooldownMs??3e3,minAmount:i.minAmount??r?.minAmount??0,caption:i.caption??r?.caption,queueMode:i.queueMode??r?.queueMode??"queue",priority:i.priority??r?.priority??qr[o]})};a?.addEventListener("change",()=>n({})),e.querySelector("[data-ae-trigger-cooldown]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&n({cooldownMs:Math.round(r*1e3)})}),e.querySelector("[data-ae-trigger-amount]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&n({minAmount:Math.round(r)})}),e.querySelector("[data-ae-trigger-queue-mode]")?.addEventListener("change",i=>{const r=i.currentTarget.value;(r==="replace"||r==="queue")&&n({queueMode:r})}),e.querySelector("[data-ae-trigger-priority]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&n({priority:r})});const s=i=>{const r=Ae(t.trigger),o=a?.value,c=r?.caption??{...vt,template:o&&Fr[o]||vt.template},d=Wa({...c,...i});n({caption:d})};e.querySelector("[data-ae-caption-enabled]")?.addEventListener("change",i=>{s({enabled:i.currentTarget.checked})}),e.querySelector("[data-ae-caption-template]")?.addEventListener("change",i=>{s({template:i.currentTarget.value})}),e.querySelector("[data-ae-caption-position]")?.addEventListener("change",i=>{const r=i.currentTarget.value;(r==="top"||r==="center"||r==="bottom"||r==="custom")&&s({position:r})}),e.querySelector("[data-ae-caption-size]")?.addEventListener("change",i=>{s({fontSize:Number(i.currentTarget.value)})}),e.querySelector("[data-ae-caption-x]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&s({xPercent:r})}),e.querySelector("[data-ae-caption-y]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&s({yPercent:r})}),e.querySelector("[data-ae-caption-intro]")?.addEventListener("change",i=>{const r=i.currentTarget.value;(r==="slide"||r==="fade"||r==="pop")&&s({intro:r})}),e.querySelector("[data-ae-caption-outro]")?.addEventListener("change",i=>{const r=i.currentTarget.value;(r==="slide"||r==="fade"||r==="pop")&&s({outro:r})}),e.querySelector("[data-ae-caption-avatar]")?.addEventListener("change",i=>{s({avatarEnabled:i.currentTarget.checked})}),e.querySelector("[data-ae-caption-avatar-size]")?.addEventListener("change",i=>{const r=Number(i.currentTarget.value);Number.isFinite(r)&&s({avatarSize:r})}),e.querySelector("[data-ae-caption-color]")?.addEventListener("change",i=>{s({color:i.currentTarget.value})}),e.querySelector("[data-ae-trigger-test]")?.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:t.instanceId}}))})}function cp(e){const t=la(e.timeline),a=i=>String(Number((i/1e3).toFixed(3))),n=t.delayMs+t.durationMs,s=[{cls:"wait",amount:t.delayMs,title:"Oczekiwanie"},{cls:"fade-in",amount:t.fadeInMs,title:"Wejście"},{cls:"hold",amount:t.durationMs-t.fadeInMs-t.fadeOutMs,title:"Widoczność"},{cls:"fade-out",amount:t.fadeOutMs,title:"Wyjście"}];return`
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
      ${ip(e)}
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
        ${rp(e)}
        <div class="ae-timeline-actions">
          <small>Cykl: ${a(n)} s ${t.mode==="loop"?"· powtarzany":"· jeden raz"}</small>
          <button type="button" class="ae-button ae-button-secondary" data-timeline-replay>
            <span aria-hidden="true">↺</span> Odtwórz od początku
          </button>
        </div>
      </div>
      ${t.mode==="off"?'<p class="ae-timeline-hint">Efekt działa bez przerwy, jak w starszych scenach.</p>':""}
    </section>
  `}function lp(e,t){const a=e.querySelector("[data-timeline-mode]");a?.addEventListener("change",()=>{const s=a.value;(s==="off"||s==="once"||s==="loop")&&Jt(t,{mode:s})}),e.querySelectorAll("[data-timeline-field]").forEach(s=>{s.addEventListener("change",()=>{const i=s.dataset.timelineField;if(i!=="delayMs"&&i!=="durationMs"&&i!=="fadeInMs"&&i!=="fadeOutMs")return;const r=Number(s.value);Number.isFinite(r)&&Jt(t,{[i]:Math.round(r*1e3)})})}),e.querySelector("[data-timeline-replay]")?.addEventListener("click",()=>{document.dispatchEvent(new Event("animated-effects:replay-preview"))}),sp(e,t);const n=he().effects.find(s=>s.instanceId===t);n&&op(e,n)}const dp={"wireframe-cube":["Minimal","Neon","Heavy Grid","Glitch Cube"],polyhedron:["Quiet Facets","Prism","Crystal Storm","Void Poly"],"orbiting-core":["Ambient","Reactor","Overdrive","Alien Core"],"neon-tunnel":["Slow Drive","Synthwave","Hyperspace","Dense Grid"],"fractal-rings":["Soft Rings","Recursive","Pulse Stack","Violet Fractal"],"particle-vortex":["Gentle Spiral","Maelstrom","Energy Core","Wide Orbit"],"liquid-blobs":["Calm Fluid","Lava Lamp","Reactive","Alien Goo"],"cell-division":["Calm Colony","Rapid Growth","Microscope","Alien Cells"],"growing-vines":["Sprout","Garden","Wild Growth","Arcane Vine"],"constellation-network":["Sparse Sky","Constellation","Dense Network","Cyber Stars"],"shockwave-bursts":["Soft Pulse","Impact","Bombardment","Violet Wave"],"data-nodes":["Sparse","Tactical","Dense Mesh","Corrupted"],"spiral-galaxy":["Distant","Milky","Starburst","Alien Galaxy"],"recursive-squares":["Minimal","Infinite","Fast Zoom","Synth Grid"],"dna-helix":["Scientific","Neon DNA","Dense Helix","Mutant"],"floating-cubes":["Sparse","Matrix","Cube Storm","Violet Space"]};function pp(e){return[{id:"soft",name:e[0],description:"Subtelniejszy i spokojniejszy wariant.",settings:{opacity:48,density:28,speed:55,intensity:55,scale:90,brightness:105}},{id:"classic",name:e[1],description:"Zbalansowana wersja efektu.",settings:{opacity:74,density:58,speed:90,intensity:78,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:e[2],description:"Gęstszy, szybszy i mocniejszy wariant.",settings:{opacity:92,density:100,speed:155,intensity:100,scale:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:68,speed:105,intensity:86,scale:105,hue:95,brightness:150,blendMode:"screen"}}]}const up=Object.fromEntries(Object.entries(dp).map(([e,t])=>[e,pp(t)])),fp={fireworks:["Celebration","Night Sky","Finale","Violet Burst"],"radar-sweep":["Tactical","Slow Scan","Alert","Deep Space"],"warp-speed":["Cruise","Hyperspace","Overdrive","Violet Warp"],"hex-pulse":["Soft Shield","Tech Grid","Overcharge","Arcane Hex"],"circuit-traces":["Sparse PCB","Data Flow","Dense Board","Corrupted"],"light-leaks":["Warm Film","Dreamy","Bright Lens","Violet Leak"],"gravity-well":["Calm Orbit","Accretion","Singularity","Violet Well"],"pixel-storm":["Sparse Pixels","Digital Rain","Pixel Storm","Glitch Surge"]};function mp(e){return[{id:"soft",name:e[0],description:"Spokojniejszy wariant.",settings:{opacity:48,density:34,speed:62,intensity:55,brightness:110}},{id:"balanced",name:e[1],description:"Zbalansowany wariant.",settings:{opacity:72,density:62,speed:95,intensity:78,brightness:125,blendMode:"screen"}},{id:"strong",name:e[2],description:"Mocny i gęsty wariant.",settings:{opacity:92,density:100,speed:145,intensity:110,brightness:160,blendMode:"screen"}},{id:"alt",name:e[3],description:"Alternatywna wersja kolorystyczna.",settings:{opacity:82,density:72,speed:105,intensity:90,hue:95,brightness:145,blendMode:"screen"}}]}const yp=Object.fromEntries(Object.entries(fp).map(([e,t])=>[e,mp(t)]));function hp(e){return[{id:"soft",name:e[0],description:"Subtelniejsza, czytelna wersja efektu.",settings:{opacity:52,density:48,speed:72,intensity:72,scale:90,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant do codziennego użycia.",settings:{opacity:74,density:84,speed:100,intensity:100,scale:100,brightness:122}},{id:"intense",name:e[2],description:"Dużo mocniejszy, gęstszy i szybszy wariant.",settings:{opacity:88,density:165,speed:165,intensity:180,scale:112,brightness:140}},{id:"overdrive",name:e[3],description:"Wariant overdrive z gotowymi presetami bardzo wysokiej intensywności.",settings:{opacity:96,density:320,speed:320,intensity:320,scale:126,brightness:155}}]}const gp={gears:["Workshop","Machinery","Forge Rush","Titan Drive"],comets:["Sparse Sky","Night Flight","Meteor Rain","Hyper Trail"],fireworks:["Celebration","Festival","Grand Finale","Sky Overdrive"],"lightning-storm":["Far Storm","Tempest","Voltage","Cataclysm"],"liquid-blobs":["Calm Fluid","Reactive","Mutagen","Meta Flood"],"particle-vortex":["Gentle Spiral","Cyclone","Maelstrom","Singularity"],"portal-rings":["Gateway","Transit","Quantum Gate","Dimensional Breach"],"radar-sweep":["Recon","Tracking","Combat Scan","Full Spectrum"],"glitch-blocks":["Signal Noise","Decode","Corruption","Hard Desync"],"gravity-well":["Orbit","Collapse","Accretion","Event Horizon"],"hex-grid":["Mesh","Shield","Pulse","Lattice Storm"],"floating-cubes":["Low Orbit","Voxel Drift","Cube Field","Cube Storm"],"prism-drift":["Glass","Iridescent","Crystal Bloom","Prism Swarm"],"neon-shards":["Trail","Fragments","Rift","Shatter Burst"],"plasma-storm":["Spark","Flow","Flux","Overcharge"],"cube-swarm":["Scout","Formation","Cloud","Voxel Torrent"]},bp=Object.fromEntries(Object.entries(gp).map(([e,t])=>[e,hp(t)])),wp={"black-hole-accretion":["Quiet Orbit","Accretion","Collapse","Event Horizon"],"orbital-debris":["Sparse Orbit","Debris Belt","Collision Zone","Orbital Storm"],"star-tunnel":["Cruise","Star Drive","Hyperspace","Tunnel Overdrive"],"energy-lattice":["Soft Mesh","Energy Grid","Dense Lattice","Grid Overdrive"],"target-lock":["Recon","Tracking","Combat Lock","Full Lock"],"scanner-beams":["Slow Scan","Sweep","Multi Scan","Scanner Overdrive"],"digital-fragments":["Sparse Data","Fragmented","Corruption","Hard Break"],"pixel-melt":["Light Melt","Digital Drip","Collapse","Pixel Flood"],"wireframe-cubes":["Sparse","Wire Space","Cube Field","Wire Storm"],"floating-polyhedra":["Facets","Poly Drift","Crystal Field","Poly Storm"],"shockwave-rings":["Soft Pulse","Impact","Bombardment","Shock Overdrive"],"electric-web":["Static","Electric Net","Arc Web","Voltage Storm"],"ribbon-streamers":["Soft Ribbons","Festival","Ribbon Flow","Streamer Storm"],"ink-clouds":["Soft Ink","Deep Water","Ink Bloom","Ink Flood"]};function kp(e){return[{id:"soft",name:e[0],description:"Subtelna wersja do spokojnych scen.",settings:{opacity:52,density:42,speed:62,intensity:62,brightness:108}},{id:"balanced",name:e[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:76,density:88,speed:100,intensity:100,brightness:124}},{id:"strong",name:e[2],description:"Mocny wariant z większą gęstością.",settings:{opacity:90,density:180,speed:165,intensity:185,brightness:142}},{id:"overdrive",name:e[3],description:"Bardzo intensywny preset wykorzystujący rozszerzony zakres.",settings:{opacity:96,density:340,speed:320,intensity:340,brightness:160}}]}const vp=Object.fromEntries(Object.entries(wp).map(([e,t])=>[e,kp(t)])),xp={fireworks:{keys:["burstSize","trailLength","cadence"],names:["Soft","Balanced","Strong","Overdrive"]},lightning:{keys:["branching","boltLength","flash"],names:["Soft","Balanced","Strong","Overdrive"]},"lightning-storm":{keys:["branching","stormSpread","flash"],names:["Soft","Balanced","Strong","Overdrive"]},gears:{keys:["teeth","spacing","mechanicalChaos"],names:["Soft","Balanced","Strong","Overdrive"]},"liquid-blobs":{keys:["viscosity","blobSize","merge"],names:["Soft","Balanced","Strong","Overdrive"]},"gravity-well":{keys:["pull","orbitSpread","coreSize"],names:["Soft","Balanced","Strong","Overdrive"]},"black-hole-accretion":{keys:["discWidth","pull","glow"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-web":{keys:["connections","reach","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"electric-arcs":{keys:["arcLength","jitter","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"spiral-galaxy":{keys:["armTightness","coreGlow","armSpread"],names:["Soft","Balanced","Strong","Overdrive"]},"growing-vines":{keys:["curl","branches","growth"],names:["Soft","Balanced","Strong","Overdrive"]},"neon-tunnel":{keys:["depth","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},scanlines:{keys:["lineGap","flicker","drift"],names:["Soft","Balanced","Strong","Overdrive"]},"laser-grid":{keys:["perspective","spacing","pulse"],names:["Soft","Balanced","Strong","Overdrive"]},"vhs-static":{keys:["noise","tracking","jitter"],names:["Soft","Balanced","Strong","Overdrive"]},"hud-grid":{keys:["gridSpacing","scan","markers"],names:["Soft","Balanced","Strong","Overdrive"]},"city-lights":{keys:["skyline","parallax","windows"],names:["Soft","Balanced","Strong","Overdrive"]},embers:{keys:["lift","trail","flicker"],names:["Soft","Balanced","Strong","Overdrive"]},"dust-motes":{keys:["depth","drift","sparkle"],names:["Soft","Balanced","Strong","Overdrive"]},"magnetic-field":{keys:["curvature","poleDistance","flow"],names:["Soft","Balanced","Strong","Overdrive"]},"volumetric-rays":{keys:["spread","softness","sweep"],names:["Soft","Balanced","Strong","Overdrive"]},"plasma-filaments":{keys:["curl","length","heat"],names:["Soft","Balanced","Strong","Overdrive"]},"ripple-field":{keys:["radius","frequency","distortion"],names:["Soft","Balanced","Strong","Overdrive"]},"bioluminescent-plankton":{keys:["current","flash","swarm"],names:["Soft","Balanced","Strong","Overdrive"]},"glass-shards":{keys:["shardSize","spin","reflection"],names:["Soft","Balanced","Strong","Overdrive"]},"aurora-curtains":{keys:["curtainWidth","wave","depth"],names:["Soft","Balanced","Strong","Overdrive"]},"data-streams":{keys:["packetLength","lanes","dropout"],names:["Soft","Balanced","Strong","Overdrive"]},"orbital-rings":{keys:["tilt","radius","satellites"],names:["Soft","Balanced","Strong","Overdrive"]},"prism-caustics":{keys:["spread","softness","motion"],names:["Soft","Balanced","Strong","Overdrive"]},"ember-ribbons":{keys:["trail","curl","sparks"],names:["Soft","Balanced","Strong","Overdrive"]},"fractal-branches":{keys:["branching","angle","growth"],names:["Soft","Balanced","Strong","Overdrive"]}};function zp(e,t){return[{id:"soft",name:t[0],description:"Subtelny wariant.",settings:{opacity:56,density:48,speed:68,intensity:72,brightness:112,custom:{[e[0]]:72,[e[1]]:78,[e[2]]:70}}},{id:"balanced",name:t[1],description:"Zbalansowany wariant bazowy.",settings:{opacity:80,density:92,speed:100,intensity:105,brightness:128,custom:{[e[0]]:100,[e[1]]:100,[e[2]]:100}}},{id:"strong",name:t[2],description:"Mocniejszy wariant.",settings:{opacity:92,density:175,speed:155,intensity:185,brightness:148,custom:{[e[0]]:145,[e[1]]:140,[e[2]]:150}}},{id:"overdrive",name:t[3],description:"Ekstremalny wariant.",settings:{opacity:98,density:330,speed:300,intensity:340,brightness:170,custom:{[e[0]]:185,[e[1]]:180,[e[2]]:190}}}]}const Sp=Object.fromEntries(Object.entries(xp).map(([e,t])=>[e,zp(t.keys,t.names)])),Mp={rainfall:[{id:"drizzle",name:"Mżawka",description:"Rzadki, spokojny deszcz w tle.",settings:{opacity:55,density:30,speed:65,scale:80,blur:0,brightness:95}},{id:"steady",name:"Równy deszcz",description:"Klasyczny, równomierny opad.",settings:{opacity:72,density:65,speed:105,scale:100,blur:0,brightness:100}},{id:"storm",name:"Ulewa",description:"Gęsty i szybki deszcz.",settings:{opacity:90,density:100,speed:175,scale:110,blur:1,brightness:115,blendMode:"screen"}},{id:"windy",name:"Deszcz z wiatrem",description:"Szybszy opad z wyraźnym pochyleniem warstwy.",settings:{opacity:78,density:72,speed:145,scale:105,rotation:-10,brightness:105}}],snow:[{id:"gentle",name:"Lekki śnieg",description:"Powolne, delikatne płatki.",settings:{opacity:62,density:35,speed:45,scale:90,blur:0,brightness:110}},{id:"classic",name:"Klasyczny",description:"Zbalansowany śnieg.",settings:{opacity:78,density:60,speed:75,scale:100,blur:0,brightness:115}},{id:"blizzard",name:"Zamieć",description:"Bardzo gęsty i szybki opad.",settings:{opacity:92,density:100,speed:165,scale:90,blur:1,brightness:125}},{id:"large",name:"Duże płatki",description:"Większe, bardziej widoczne płatki.",settings:{opacity:84,density:45,speed:60,scale:150,blur:1,brightness:120}}],lightning:[{id:"distant",name:"Odległa burza",description:"Rzadsze i subtelniejsze błyski.",settings:{opacity:52,density:30,speed:60,scale:100,blur:2,brightness:115}},{id:"classic",name:"Burza",description:"Zbalansowane wyładowania.",settings:{opacity:78,density:58,speed:105,scale:100,blur:1,brightness:130}},{id:"violent",name:"Gwałtowna",description:"Częste i bardzo jasne błyski.",settings:{opacity:100,density:95,speed:175,scale:110,blur:0,brightness:190}},{id:"purple",name:"Fioletowa burza",description:"Magiczny, fioletowy wariant wyładowań.",settings:{opacity:88,density:70,speed:125,scale:105,hue:115,brightness:150,blendMode:"screen"}}],hearts:[{id:"soft",name:"Delikatne",description:"Rzadkie, spokojnie unoszące się serca.",settings:{opacity:58,density:28,speed:55,scale:90,blur:0,brightness:105}},{id:"classic",name:"Klasyczne",description:"Zbalansowany romantyczny efekt.",settings:{opacity:78,density:55,speed:85,scale:110,brightness:110}},{id:"shower",name:"Deszcz serc",description:"Dużo szybko poruszających się serc.",settings:{opacity:90,density:95,speed:145,scale:100,brightness:120}},{id:"giant",name:"Duże serca",description:"Mniej elementów, ale znacznie większych.",settings:{opacity:82,density:35,speed:70,scale:175,blur:1,brightness:120}}],leaves:[{id:"breeze",name:"Lekki wiatr",description:"Spokojnie opadające liście.",settings:{opacity:68,density:35,speed:60,scale:95,rotation:0,brightness:100}},{id:"autumn",name:"Jesień",description:"Gęstszy, ciepły opad liści.",settings:{opacity:82,density:65,speed:90,scale:105,hue:-18,brightness:110}},{id:"gust",name:"Podmuch",description:"Szybki i dynamiczny ruch.",settings:{opacity:85,density:75,speed:160,scale:100,rotation:8,brightness:105}},{id:"close",name:"Liście z bliska",description:"Duże liście przechodzące blisko kamery.",settings:{opacity:86,density:38,speed:80,scale:180,blur:1,brightness:115}}],matrix:[{id:"sparse",name:"Rzadki kod",description:"Niewiele kolumn i spokojniejszy ruch.",settings:{opacity:58,density:28,speed:70,scale:90,brightness:95}},{id:"classic",name:"Klasyczny Matrix",description:"Zbalansowana zielona ściana kodu.",settings:{opacity:78,density:58,speed:105,scale:100,hue:0,brightness:110}},{id:"dense",name:"Gęsty kod",description:"Więcej kolumn i szybszy przepływ.",settings:{opacity:88,density:95,speed:150,scale:95,brightness:125}},{id:"blue",name:"Niebieski kod",description:"Chłodniejsza, cybernetyczna wersja.",settings:{opacity:82,density:68,speed:110,scale:100,hue:95,brightness:120,blendMode:"screen"}}],comets:[{id:"rare",name:"Pojedyncze",description:"Rzadkie komety przecinające tło.",settings:{opacity:65,density:25,speed:75,scale:90,brightness:110}},{id:"classic",name:"Klasyczne",description:"Zbalansowane komety.",settings:{opacity:80,density:52,speed:100,scale:100,brightness:125}},{id:"shower",name:"Deszcz meteorów",description:"Dużo szybkich smug.",settings:{opacity:92,density:95,speed:155,scale:95,brightness:145}},{id:"giant",name:"Wielkie komety",description:"Mniej, ale większych i jaśniejszych smug.",settings:{opacity:88,density:32,speed:90,scale:175,blur:1,brightness:155}}],starfield:[{id:"distant",name:"Odległe gwiazdy",description:"Subtelne, drobne punkty.",settings:{opacity:50,density:35,speed:45,scale:75,brightness:95}},{id:"classic",name:"Pole gwiazd",description:"Zbalansowane kosmiczne tło.",settings:{opacity:72,density:62,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste niebo",description:"Znacznie więcej gwiazd.",settings:{opacity:82,density:100,speed:70,scale:90,brightness:120}},{id:"bright",name:"Jasne gwiazdy",description:"Mniej punktów, ale mocniej świecących.",settings:{opacity:90,density:48,speed:65,scale:125,blur:1,brightness:160,blendMode:"screen"}}],fog:[{id:"wisps",name:"Smugi mgły",description:"Lekkie, przejrzyste pasma.",settings:{opacity:38,density:35,speed:50,scale:100,blur:8,brightness:95}},{id:"low",name:"Niska mgła",description:"Mgła skupiona przy dolnej krawędzi.",settings:{opacity:58,density:58,speed:55,scale:120,y:35,blur:10,area:"bottom",brightness:100}},{id:"heavy",name:"Gęsta mgła",description:"Ciężka mgła pokrywająca kadr.",settings:{opacity:78,density:95,speed:40,scale:135,blur:13,brightness:92}},{id:"ghost",name:"Widmowa",description:"Chłodniejsza i bardziej świetlista mgła.",settings:{opacity:62,density:68,speed:65,scale:125,blur:12,hue:105,brightness:125,blendMode:"screen"}}],embers:[{id:"smolder",name:"Żar",description:"Niewiele powolnych iskier.",settings:{opacity:58,density:30,speed:55,scale:90,brightness:105}},{id:"firepit",name:"Ognisko",description:"Zbalansowane unoszące się żarzące drobiny.",settings:{opacity:78,density:58,speed:90,scale:100,brightness:120}},{id:"inferno",name:"Inferno",description:"Gęsty i szybki strumień żaru.",settings:{opacity:92,density:100,speed:160,scale:105,brightness:150,blendMode:"screen"}},{id:"large",name:"Duży żar",description:"Większe, wolniejsze drobiny.",settings:{opacity:84,density:40,speed:65,scale:165,blur:1,brightness:135}}],clouds:[{id:"wispy",name:"Pierze",description:"Lekkie, rzadkie obłoki.",settings:{opacity:35,density:30,speed:45,scale:105,blur:8,brightness:105}},{id:"classic",name:"Chmury",description:"Zbalansowana warstwa chmur.",settings:{opacity:55,density:58,speed:65,scale:120,blur:9,brightness:100}},{id:"overcast",name:"Zachmurzenie",description:"Gęste i ciemniejsze chmury.",settings:{opacity:78,density:95,speed:55,scale:135,blur:11,brightness:75}},{id:"dreamy",name:"Senna mgiełka",description:"Jasne, miękkie i wolne obłoki.",settings:{opacity:52,density:48,speed:35,scale:150,blur:14,brightness:135,blendMode:"screen"}}],"rain-glass":[{id:"mist",name:"Drobne krople",description:"Subtelne krople na szybie.",settings:{opacity:48,density:35,speed:55,scale:80,blur:0,brightness:95}},{id:"classic",name:"Mokra szyba",description:"Zbalansowane smugi deszczu.",settings:{opacity:72,density:62,speed:85,scale:100,brightness:105}},{id:"downpour",name:"Ulewa na szybie",description:"Dużo szybkich smug.",settings:{opacity:88,density:100,speed:145,scale:105,blur:1,brightness:115}},{id:"slow",name:"Powolne smugi",description:"Duże krople wolno zsuwające się po szybie.",settings:{opacity:80,density:45,speed:35,scale:155,blur:1,brightness:110}}],"bouncing-balls":[{id:"calm",name:"Spokojne",description:"Kilka wolnych kulek.",settings:{opacity:65,density:30,speed:55,scale:90,brightness:105}},{id:"arcade",name:"Arcade",description:"Zbalansowana liczba i tempo.",settings:{opacity:82,density:58,speed:105,scale:100,brightness:125}},{id:"chaos",name:"Chaos",description:"Dużo szybkich odbijających się kulek.",settings:{opacity:90,density:100,speed:175,scale:90,brightness:140}},{id:"giant",name:"Wielkie kule",description:"Mniej obiektów o dużej skali.",settings:{opacity:86,density:32,speed:75,scale:190,blur:1,brightness:130}}],"neon-lines":[{id:"minimal",name:"Minimal",description:"Kilka subtelnych neonowych linii.",settings:{opacity:52,density:28,speed:60,scale:90,brightness:110}},{id:"classic",name:"Neon",description:"Zbalansowane linie cyberpunkowe.",settings:{opacity:78,density:58,speed:100,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Sieć neonów",description:"Gęsty układ świecących linii.",settings:{opacity:86,density:95,speed:125,scale:100,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowy neon",description:"Fioletowo-różowy wariant kolorystyczny.",settings:{opacity:82,density:65,speed:95,scale:105,hue:95,brightness:145,blendMode:"screen"}}],"energy-orbs":[{id:"ambient",name:"Ambient",description:"Rzadkie, spokojne kule energii.",settings:{opacity:55,density:28,speed:50,scale:90,blur:2,brightness:110}},{id:"classic",name:"Energia",description:"Zbalansowane świetliste kule.",settings:{opacity:75,density:58,speed:85,scale:105,blur:1,brightness:130,blendMode:"screen"}},{id:"storm",name:"Burza energii",description:"Dużo szybkich i jasnych kul.",settings:{opacity:90,density:100,speed:155,scale:100,blur:1,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie orbsy",description:"Mniej, ale znacznie większych kul.",settings:{opacity:84,density:32,speed:60,scale:190,blur:3,brightness:145,blendMode:"screen"}}],petals:[{id:"gentle",name:"Delikatne",description:"Spokojnie spadające płatki.",settings:{opacity:62,density:30,speed:55,scale:90,brightness:105}},{id:"classic",name:"Kwiatowy opad",description:"Zbalansowany efekt płatków.",settings:{opacity:78,density:58,speed:85,scale:100,brightness:115}},{id:"storm",name:"Burza płatków",description:"Gęsty i szybki opad.",settings:{opacity:88,density:100,speed:150,scale:95,brightness:125}},{id:"large",name:"Duże płatki",description:"Mniej elementów, ale większych.",settings:{opacity:84,density:38,speed:65,scale:170,blur:1,brightness:120}}],sparks:[{id:"welding",name:"Spawanie",description:"Szybkie, jasne i rzadkie iskry.",settings:{opacity:88,density:42,speed:170,scale:80,brightness:165,blendMode:"screen"}},{id:"fire",name:"Ogień",description:"Zbalansowane ciepłe iskry.",settings:{opacity:78,density:60,speed:105,scale:100,brightness:130}},{id:"burst",name:"Rozbłysk",description:"Gęsty strumień dynamicznych iskier.",settings:{opacity:94,density:100,speed:195,scale:95,brightness:180,blendMode:"screen"}},{id:"slow",name:"Powolny żar",description:"Duże i spokojniejsze iskry.",settings:{opacity:72,density:35,speed:45,scale:155,blur:1,brightness:120}}],plasma:[{id:"calm",name:"Spokojna plazma",description:"Wolniejszy i miękki ruch.",settings:{opacity:58,density:38,speed:45,scale:110,blur:4,brightness:110}},{id:"classic",name:"Plazma",description:"Zbalansowany efekt energetyczny.",settings:{opacity:78,density:62,speed:90,scale:115,blur:2,brightness:135,blendMode:"screen"}},{id:"hot",name:"Gorąca",description:"Jaśniejsza i bardziej intensywna plazma.",settings:{opacity:90,density:82,speed:120,scale:125,blur:2,brightness:175,hue:-35,blendMode:"screen"}},{id:"electric",name:"Elektryczna",description:"Szybka, chłodniejsza plazma.",settings:{opacity:86,density:72,speed:165,scale:105,blur:1,brightness:160,hue:95,blendMode:"screen"}}],"energy-waves":[{id:"soft",name:"Miękkie fale",description:"Powolne i subtelne fale energii.",settings:{opacity:48,density:35,speed:45,scale:110,blur:3,brightness:105}},{id:"pulse",name:"Puls",description:"Zbalansowane pulsujące fale.",settings:{opacity:72,density:60,speed:90,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"fast",name:"Szybkie fale",description:"Dynamiczny, energetyczny ruch.",settings:{opacity:84,density:78,speed:160,scale:110,blur:1,brightness:150,blendMode:"screen"}},{id:"wide",name:"Szerokie fale",description:"Duże, wolniejsze pasma energii.",settings:{opacity:75,density:42,speed:60,scale:175,blur:4,brightness:140,blendMode:"screen"}}],runes:[{id:"drifting",name:"Wędrujące",description:"Runy Elder Futhark swobodnie unoszące się po ekranie.",settings:{opacity:72,density:45,speed:55,scale:100,blur:0,brightness:120}},{id:"ancient",name:"Starożytne",description:"Wolne, większe i cięższe wizualnie symbole.",settings:{opacity:82,density:30,speed:35,scale:150,blur:1,brightness:105}},{id:"ritual",name:"Rytuał",description:"Gęstsza, bardziej świetlista warstwa run.",settings:{opacity:90,density:75,speed:65,scale:115,blur:1,brightness:155,blendMode:"screen"}},{id:"ghost",name:"Widmowe",description:"Subtelne, chłodne i rozmyte znaki.",settings:{opacity:52,density:58,speed:45,scale:125,blur:3,hue:90,brightness:135,blendMode:"screen"}}],"magic-dust":[{id:"wisps",name:"Smugi pyłu",description:"Rzadki, spokojny magiczny pył.",settings:{opacity:50,density:28,speed:45,scale:90,blur:1,brightness:115}},{id:"fairy",name:"Baśniowy pył",description:"Zbalansowane migoczące drobiny.",settings:{opacity:76,density:58,speed:80,scale:100,brightness:135,blendMode:"screen"}},{id:"dense",name:"Magiczna chmura",description:"Gęsty i jaśniejszy pył.",settings:{opacity:88,density:100,speed:105,scale:105,blur:1,brightness:160,blendMode:"screen"}},{id:"gold",name:"Złoty pył",description:"Ciepły, złocisty wariant kolorystyczny.",settings:{opacity:82,density:65,speed:75,scale:105,hue:-55,brightness:150,blendMode:"screen"}}],"laser-grid":[{id:"minimal",name:"Minimal",description:"Rzadkie, spokojne linie siatki.",settings:{opacity:50,density:30,speed:55,scale:100,brightness:110}},{id:"classic",name:"Laser Grid",description:"Zbalansowana futurystyczna siatka.",settings:{opacity:75,density:60,speed:90,scale:105,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsta siatka",description:"Więcej linii i mocniejsze światło.",settings:{opacity:86,density:95,speed:105,scale:100,brightness:155,blendMode:"screen"}},{id:"fast",name:"Szybka siatka",description:"Dynamiczny, klubowy wariant.",settings:{opacity:82,density:72,speed:170,scale:110,brightness:150,hue:75,blendMode:"screen"}}],scanlines:[{id:"subtle",name:"Subtelne",description:"Lekka faktura monitora CRT.",settings:{opacity:32,density:35,speed:30,scale:100,brightness:100}},{id:"crt",name:"CRT",description:"Klasyczne linie starego ekranu.",settings:{opacity:58,density:62,speed:55,scale:100,brightness:105}},{id:"vhs",name:"VHS",description:"Mocniejszy i szybszy analogowy szum.",settings:{opacity:72,density:82,speed:115,scale:105,blur:1,brightness:110}},{id:"harsh",name:"Mocne linie",description:"Bardzo widoczna faktura skanowania.",settings:{opacity:88,density:100,speed:70,scale:100,brightness:120,blendMode:"overlay"}}],pong:[{id:"classic",name:"Klasyczny Pong",description:"Spokojny mecz w klasycznym tempie.",settings:{opacity:82,density:72,speed:100,scale:100,brightness:115,hue:0,intensity:0}},{id:"chill",name:"Chill",description:"Wolniejszy, ambientowy Pong.",settings:{opacity:62,density:55,speed:65,scale:100,brightness:105,hue:40,intensity:0}},{id:"arcade",name:"Arcade",description:"Szybszy mecz z lekkim przyspieszaniem.",settings:{opacity:90,density:82,speed:145,scale:105,brightness:140,hue:0,intensity:18,blendMode:"screen"}},{id:"neon",name:"Neon Pong",description:"Fioletowo-neonowa wersja arcade.",settings:{opacity:92,density:78,speed:125,scale:105,brightness:155,hue:105,intensity:10,blendMode:"screen"}}],bubbles:[{id:"gentle",name:"Delikatne",description:"Rzadkie i spokojne bąbelki.",settings:{opacity:48,density:28,speed:45,scale:85,blur:0,brightness:105}},{id:"aquarium",name:"Akwarium",description:"Zbalansowany strumień bąbelków.",settings:{opacity:68,density:60,speed:75,scale:100,brightness:115}},{id:"dense",name:"Gęste",description:"Dużo szybko unoszących się bąbelków.",settings:{opacity:78,density:100,speed:125,scale:95,brightness:125}},{id:"giant",name:"Wielkie bąble",description:"Mniej, ale bardzo dużych elementów.",settings:{opacity:70,density:30,speed:55,scale:195,blur:1,brightness:120}}],fireflies:[{id:"sparse",name:"Kilka świetlików",description:"Rzadkie i spokojne punkty światła.",settings:{opacity:55,density:25,speed:45,scale:90,blur:1,brightness:120}},{id:"meadow",name:"Łąka",description:"Zbalansowany, naturalny rój.",settings:{opacity:75,density:58,speed:70,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"swarm",name:"Rój",description:"Dużo aktywnych świetlików.",settings:{opacity:86,density:100,speed:120,scale:95,brightness:155,blendMode:"screen"}},{id:"dreamy",name:"Senny",description:"Duże, powolne i miękkie światła.",settings:{opacity:68,density:38,speed:35,scale:160,blur:3,brightness:145,blendMode:"screen"}}],confetti:[{id:"light",name:"Lekki opad",description:"Niewiele konfetti i spokojne tempo.",settings:{opacity:62,density:30,speed:60,scale:90,brightness:105}},{id:"party",name:"Impreza",description:"Zbalansowane kolorowe konfetti.",settings:{opacity:82,density:65,speed:105,scale:100,brightness:115}},{id:"celebration",name:"Celebracja",description:"Gęsty i szybki wybuch konfetti.",settings:{opacity:92,density:100,speed:165,scale:105,brightness:130}},{id:"slow",name:"Slow motion",description:"Większe elementy opadające powoli.",settings:{opacity:80,density:45,speed:35,scale:150,blur:1,brightness:115}}],"dust-motes":[{id:"subtle",name:"Subtelny kurz",description:"Prawie niewidoczne drobiny w tle.",settings:{opacity:30,density:30,speed:35,scale:85,blur:1,brightness:95}},{id:"sunbeam",name:"Promień słońca",description:"Jaśniejsze drobiny zawieszone w powietrzu.",settings:{opacity:55,density:55,speed:45,scale:100,blur:1,brightness:135,blendMode:"screen"}},{id:"dense",name:"Gęsty kurz",description:"Więcej widocznych drobin.",settings:{opacity:65,density:100,speed:55,scale:95,brightness:120}},{id:"cinematic",name:"Filmowy",description:"Duże, wolne i miękkie drobiny.",settings:{opacity:48,density:42,speed:30,scale:155,blur:2,brightness:145,blendMode:"screen"}}],aurora:[{id:"soft",name:"Delikatna zorza",description:"Subtelne, powolne pasma.",settings:{opacity:48,density:35,speed:35,scale:110,blur:4,brightness:110}},{id:"nordic",name:"Nordycka",description:"Zbalansowana klasyczna zorza.",settings:{opacity:72,density:58,speed:55,scale:120,blur:3,brightness:130,blendMode:"screen"}},{id:"intense",name:"Intensywna",description:"Jasne i gęste pasma światła.",settings:{opacity:90,density:95,speed:70,scale:130,blur:2,brightness:170,blendMode:"screen"}},{id:"fast",name:"Szybka zorza",description:"Dynamiczne, wyraźnie przemieszczające się pasma.",settings:{opacity:82,density:72,speed:125,scale:120,blur:2,brightness:150,hue:45,blendMode:"screen"}}],"hologram-scan":[{id:"subtle",name:"Subtelny skan",description:"Rzadkie i spokojne pasma hologramu.",settings:{opacity:42,density:28,speed:55,scale:100,brightness:105,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelny skan HUD o umiarkowanym tempie.",settings:{opacity:68,density:48,speed:85,scale:100,brightness:125,blendMode:"screen"}},{id:"intense",name:"Intensywny",description:"Gesty i szybki skan calego ekranu.",settings:{opacity:88,density:92,speed:155,scale:105,brightness:155,blendMode:"screen"}},{id:"violet",name:"Fioletowy",description:"Holograficzny skan przesuniety w fiolet.",settings:{opacity:78,density:58,speed:95,hue:92,brightness:140,blendMode:"screen"}}],"glitch-blocks":[{id:"sparse",name:"Rzadkie zaklocenia",description:"Pojedyncze cyfrowe przeskoki.",settings:{opacity:42,density:24,speed:65,scale:85,brightness:110}},{id:"digital",name:"Digital",description:"Zbalansowane cyfrowe prostokaty.",settings:{opacity:62,density:55,speed:95,scale:100,brightness:125,blendMode:"screen"}},{id:"corrupted",name:"Corrupted",description:"Gesty, agresywny glitch.",settings:{opacity:86,density:100,speed:180,scale:115,brightness:155,blendMode:"screen"}},{id:"chromatic",name:"Chromatyczny",description:"Kolorowy glitch z mocnym przesunieciem barwy.",settings:{opacity:76,density:72,speed:125,scale:100,hue:120,brightness:145,blendMode:"screen"}}],"hex-grid":[{id:"fine",name:"Drobna siatka",description:"Delikatna, drobna struktura hex.",settings:{opacity:32,density:78,speed:30,scale:90,brightness:100}},{id:"tactical",name:"Taktyczna",description:"Czytelna siatka interfejsu sci-fi.",settings:{opacity:50,density:52,speed:50,scale:100,brightness:120,blendMode:"screen"}},{id:"large",name:"Duza siatka",description:"Wieksze i spokojniejsze komorki.",settings:{opacity:44,density:25,speed:35,scale:125,brightness:115}},{id:"neon",name:"Neon",description:"Jasna cyberpunkowa siatka.",settings:{opacity:72,density:62,speed:75,hue:75,brightness:165,blendMode:"screen"}}],"portal-rings":[{id:"calm",name:"Spokojny portal",description:"Powolne i subtelne pierscienie.",settings:{opacity:52,density:35,speed:35,scale:90,brightness:110}},{id:"arcane",name:"Arkaniczny",description:"Klasyczny magiczny portal.",settings:{opacity:78,density:62,speed:65,scale:100,brightness:140,blendMode:"screen"}},{id:"unstable",name:"Niestabilny",description:"Gesty i szybko wirujacy portal.",settings:{opacity:92,density:100,speed:145,scale:112,brightness:175,blendMode:"screen"}},{id:"void",name:"Void",description:"Ciemniejszy portal o zmienionej barwie.",settings:{opacity:84,density:70,speed:78,scale:105,hue:145,brightness:125,blendMode:"screen"}}],"magic-circle":[{id:"subtle",name:"Subtelny sigil",description:"Lekki i powolny magiczny okrag.",settings:{opacity:44,density:32,speed:28,scale:90,brightness:105}},{id:"ritual",name:"Rytual",description:"Zbalansowany okrag rytualny.",settings:{opacity:72,density:58,speed:48,scale:100,brightness:135,blendMode:"screen"}},{id:"grand",name:"Wielki sigil",description:"Duzy, jasny i gesty wzor.",settings:{opacity:90,density:96,speed:62,scale:135,brightness:175,blendMode:"screen"}},{id:"forbidden",name:"Zakazany",description:"Ciemniejszy i bardziej zlowrogi wariant.",settings:{opacity:82,density:72,speed:75,scale:108,hue:120,brightness:135,blendMode:"screen"}}],"crystal-shards":[{id:"sparse",name:"Rzadkie odlamki",description:"Kilka spokojnie unoszacych sie krysztalow.",settings:{opacity:48,density:28,speed:42,scale:85,brightness:115}},{id:"prism",name:"Pryzmat",description:"Jasne odlamki o mocnym polysku.",settings:{opacity:72,density:55,speed:62,scale:100,brightness:155,blendMode:"screen"}},{id:"storm",name:"Krysztalowa burza",description:"Duza liczba szybko poruszajacych sie odlamkow.",settings:{opacity:88,density:100,speed:145,scale:92,brightness:165,blendMode:"screen"}},{id:"giant",name:"Wielkie odlamki",description:"Mniej elementow, ale znacznie wiekszych.",settings:{opacity:78,density:38,speed:48,scale:170,brightness:145,blur:1,blendMode:"screen"}}],"steam-vents":[{id:"gentle",name:"Lekka para",description:"Subtelne kleby pary.",settings:{opacity:38,density:30,speed:42,scale:95,blur:2,brightness:105}},{id:"factory",name:"Fabryka",description:"Regularne, gestsze wyrzuty pary.",settings:{opacity:58,density:62,speed:62,scale:110,blur:3,brightness:115}},{id:"burst",name:"Wyrzut",description:"Szybka i intensywna para.",settings:{opacity:76,density:92,speed:145,scale:120,blur:2,brightness:130,blendMode:"screen"}},{id:"ghost",name:"Widmowa para",description:"Chlodny, lekko kolorowy wariant.",settings:{opacity:52,density:52,speed:48,scale:125,hue:155,blur:4,brightness:135,blendMode:"screen"}}],gears:[{id:"clockwork",name:"Mechanizm",description:"Spokojnie obracajace sie kola zebate.",settings:{opacity:52,density:38,speed:42,scale:90,brightness:105}},{id:"brass",name:"Mosiadz",description:"Klasyczny steampunkowy zestaw kol.",settings:{opacity:66,density:55,speed:58,scale:100,brightness:125,blendMode:"screen"}},{id:"heavy",name:"Ciezka maszyna",description:"Duze i wolniejsze kola zebate.",settings:{opacity:76,density:35,speed:28,scale:165,brightness:115}},{id:"overdrive",name:"Overdrive",description:"Gesty i szybko pracujacy mechanizm.",settings:{opacity:82,density:100,speed:160,scale:88,brightness:145,blendMode:"screen"}}],"city-lights":[{id:"distant",name:"Odlegle miasto",description:"Rzadkie, subtelne punkty swiatla.",settings:{opacity:42,density:28,speed:35,scale:85,brightness:105}},{id:"night",name:"Nocne miasto",description:"Zbalansowane miejskie swiatla.",settings:{opacity:72,density:65,speed:48,scale:100,brightness:125,blendMode:"screen"}},{id:"dense",name:"Centrum",description:"Gesty, jasny krajobraz miejski.",settings:{opacity:88,density:100,speed:65,scale:105,brightness:155,blendMode:"screen"}},{id:"neon",name:"Neon City",description:"Kolorowy wariant inspirowany cyberpunkiem.",settings:{opacity:82,density:78,speed:58,hue:95,brightness:165,blendMode:"screen"}}],"traffic-trails":[{id:"slow",name:"Nocna ulica",description:"Rzadkie i wolne smugi swiatel.",settings:{opacity:48,density:28,speed:48,scale:90,brightness:110}},{id:"highway",name:"Autostrada",description:"Zbalansowany ruch swietlny.",settings:{opacity:72,density:55,speed:95,scale:100,brightness:135,blendMode:"screen"}},{id:"rush",name:"Rush Hour",description:"Gesty i bardzo szybki ruch.",settings:{opacity:88,density:100,speed:175,scale:105,brightness:160,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant smug.",settings:{opacity:80,density:70,speed:120,hue:110,brightness:160,blendMode:"screen"}}],"vhs-static":[{id:"soft",name:"Lekka tasma",description:"Subtelne analogowe zaklocenia.",settings:{opacity:28,density:28,speed:55,scale:100,brightness:100}},{id:"tape",name:"VHS",description:"Klasyczne pasy starej kasety.",settings:{opacity:50,density:58,speed:95,scale:100,brightness:120,blendMode:"screen"}},{id:"damaged",name:"Uszkodzona tasma",description:"Mocne, szybkie zaklocenia obrazu.",settings:{opacity:82,density:100,speed:180,scale:105,brightness:150,blendMode:"screen"}},{id:"chromatic",name:"RGB Shift",description:"Kolorowe analogowe zaklocenia.",settings:{opacity:68,density:75,speed:125,hue:105,brightness:145,blendMode:"screen"}}],"solar-flare":[{id:"corona",name:"Korona",description:"Delikatne luki slonecznej plazmy.",settings:{opacity:48,density:30,speed:38,scale:95,brightness:120}},{id:"active",name:"Aktywne slonce",description:"Zbalansowane protuberancje.",settings:{opacity:72,density:55,speed:62,scale:105,brightness:145,blendMode:"screen"}},{id:"eruption",name:"Erupcja",description:"Gesty i bardzo jasny rozblysk.",settings:{opacity:94,density:100,speed:135,scale:120,brightness:190,blendMode:"screen"}},{id:"alien",name:"Obce slonce",description:"Przesunieta barwa daje nietypowa gwiazde.",settings:{opacity:84,density:72,speed:78,scale:112,hue:125,brightness:165,blendMode:"screen"}}],"scanlines-plus":[{id:"soft",name:"Subtelne",description:"Delikatny skan ekranu.",settings:{opacity:34,density:28,speed:72,brightness:105,blendMode:"screen"}},{id:"monitor",name:"Monitor",description:"Klasyczny efekt skanowania obrazu.",settings:{opacity:58,density:52,speed:100,brightness:120,blendMode:"screen"}},{id:"aggressive",name:"Agresywne",description:"Wiecej linii i mocniejszy ruch.",settings:{opacity:82,density:92,speed:165,brightness:150,blendMode:"screen"}},{id:"violet",name:"Fioletowe",description:"Neonowo-fioletowy skan.",settings:{opacity:74,density:60,speed:110,hue:85,brightness:145,blendMode:"screen"}}],"equalizer-bars":[{id:"ambient",name:"Ambient",description:"Spokojne slupki audio.",settings:{opacity:52,density:35,speed:65,scale:90,brightness:105,blendMode:"screen"}},{id:"stage",name:"Scena",description:"Zbalansowany wizualizer muzyczny.",settings:{opacity:76,density:62,speed:100,scale:100,brightness:125,blendMode:"screen"}},{id:"festival",name:"Festival",description:"Mocne i wysokie slupki.",settings:{opacity:90,density:100,speed:155,scale:110,brightness:155,blendMode:"screen"}},{id:"synthwave",name:"Synthwave",description:"Fioletowo-neonowy wariant.",settings:{opacity:82,density:72,speed:120,hue:95,brightness:145,blendMode:"screen"}}],"hud-grid":[{id:"subtle",name:"Subtelny",description:"Lekka siatka tla.",settings:{opacity:28,density:30,speed:50,brightness:100,blendMode:"screen"}},{id:"tactical",name:"Taktyczny",description:"Czytelna warstwa HUD.",settings:{opacity:48,density:60,speed:70,brightness:120,blendMode:"screen"}},{id:"scanner",name:"Scanner",description:"Gestsza i bardziej techniczna siatka.",settings:{opacity:68,density:95,speed:110,brightness:145,blendMode:"screen"}},{id:"violet",name:"Violet HUD",description:"HUD z przesunieciem w strone fioletu.",settings:{opacity:58,density:72,speed:84,hue:88,brightness:140,blendMode:"screen"}}],"floating-symbols":[{id:"soft",name:"Lekkie",description:"Malo symboli i lagodny ruch.",settings:{opacity:46,density:28,speed:62,scale:95,brightness:110,blendMode:"screen"}},{id:"arcane",name:"Arcane",description:"Klasyczny magiczny wariant.",settings:{opacity:72,density:54,speed:78,scale:100,brightness:125,blendMode:"screen"}},{id:"ritual",name:"Ritual",description:"Wiecej symboli i silniejsza poswiata.",settings:{opacity:88,density:100,speed:120,scale:110,brightness:160,blendMode:"screen"}},{id:"dream",name:"Dream",description:"Jasniejszy, bardziej eteryczny wariant.",settings:{opacity:82,density:68,speed:72,hue:60,brightness:155,blendMode:"screen"}}],"smoke-wisps":[{id:"light",name:"Lekki dym",description:"Subtelne smugi dymu.",settings:{opacity:30,density:24,speed:50,scale:90,blur:4,brightness:100,blendMode:"screen"}},{id:"mist",name:"Mist",description:"Zbalansowane wispy dymu.",settings:{opacity:50,density:48,speed:68,scale:100,blur:8,brightness:110,blendMode:"screen"}},{id:"dense",name:"Gesty dym",description:"Bardziej widoczny i ciezszy dym.",settings:{opacity:72,density:88,speed:84,scale:110,blur:12,brightness:130,blendMode:"screen"}},{id:"toxic",name:"Toksyczny",description:"Zielonkawo-przesuniety dym.",settings:{opacity:66,density:64,speed:72,scale:105,hue:120,blur:10,brightness:140,blendMode:"screen"}}],"electric-arcs":[{id:"calm",name:"Spokojne",description:"Rzadkie przeskoki energii.",settings:{opacity:46,density:26,speed:68,brightness:120,blendMode:"screen"}},{id:"active",name:"Aktywne",description:"Widoczne luki energii.",settings:{opacity:82,density:55,speed:110,brightness:145,blendMode:"screen"}},{id:"storm",name:"Storm",description:"Bardzo szybkie i liczne wyadowania.",settings:{opacity:96,density:100,speed:175,brightness:180,blendMode:"screen"}},{id:"alien",name:"Alien",description:"Wyadowania z obca barwa.",settings:{opacity:88,density:72,speed:120,hue:95,brightness:165,blendMode:"screen"}}],"snow-burst":[{id:"light",name:"Lekki opad",description:"Spokojny i delikatny snieg.",settings:{opacity:42,density:28,speed:52,scale:90,brightness:110,blendMode:"screen"}},{id:"winter",name:"Winter",description:"Zbalansowany efekt zimowy.",settings:{opacity:72,density:68,speed:72,scale:100,brightness:125,blendMode:"screen"}},{id:"blizzard",name:"Blizzard",description:"Gestszy i szybszy snieg.",settings:{opacity:92,density:100,speed:145,scale:110,brightness:150,blendMode:"screen"}},{id:"moonlit",name:"Moonlit",description:"Chlodniejszy nocny wariant sniegu.",settings:{opacity:82,density:75,speed:86,scale:105,hue:15,brightness:145,blendMode:"screen"}}],"meteor-shower":[{id:"sparse",name:"Rzadkie meteory",description:"Niewiele smug na niebie.",settings:{opacity:46,density:22,speed:72,scale:90,brightness:115,blendMode:"screen"}},{id:"night",name:"Nocne niebo",description:"Klasyczny deszcz meteorow.",settings:{opacity:78,density:42,speed:100,scale:100,brightness:140,blendMode:"screen"}},{id:"peak",name:"Peak",description:"Maksimum roju meteorow.",settings:{opacity:92,density:100,speed:155,scale:112,brightness:175,blendMode:"screen"}},{id:"cosmic",name:"Cosmic",description:"Bardziej kolorowy kosmiczny wariant.",settings:{opacity:86,density:62,speed:118,scale:105,hue:72,brightness:165,blendMode:"screen"}}]};function ea(e){return Sp[e]??vp[e]??bp[e]??yp[e]??up[e]??Mp[e]??[]}function Ep(e,t){return ea(e).find(a=>Object.entries(a.settings).every(([n,s])=>t[n]===s))}const Ze=new Set,Pp={key:"opacity",label:"Krycie",min:0,max:100,suffix:"%"},Cp={key:"density",label:"Gęstość",min:10,max:400,suffix:"%"},jp={key:"speed",label:"Prędkość",min:20,max:400,suffix:"%"},_p={key:"intensity",label:"Przyspieszenie",min:0,max:100,suffix:"%"},$p={key:"scale",label:"Skala",min:25,max:250,suffix:"%"},Rp={key:"x",label:"Pozycja X",min:-100,max:100,suffix:"%"},Ip={key:"y",label:"Pozycja Y",min:-100,max:100,suffix:"%"},Ap={key:"rotation",label:"Obrót",min:-180,max:180,suffix:"°"},Np={key:"blur",label:"Rozmycie",min:0,max:30,suffix:"px"},Lp={key:"brightness",label:"Jasność",min:25,max:250,suffix:"%"},Dp={key:"hue",label:"Odcień",min:-180,max:180,suffix:"°"},Tp=["#57c7ff","#6d91ff","#a88cff","#d67cff","#f07a7a","#f39a62","#f0b85a","#72d98b","#55d6c2","#ffffff"];function kt(e){return e&&/^#[0-9a-f]{6}$/i.test(e)?e:"#a88cff"}function Op(e,t,a){const n=t[e.key],s=a[e.key],i=n===s;return`
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
  `}function qp(e,t,a){const n=Ze.has(e.id);return`
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
        ${e.fields.map(s=>Op(s,t,a)).join("")}
      </div>
    </section>
  `}function Qa(e){const t=xt();if(!t){e.innerHTML=`
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
    `;return}const n=ea(t.effectId),s=Ep(t.effectId,t.settings),i=[Pp,Cp,jp];t.effectId==="pong"&&i.push(_p);const r=[{id:"primary",title:"Podstawowe",description:"Widoczność, liczba elementów i tempo animacji",fields:i},{id:"transform",title:"Transformacja",description:"Rozmiar, pozycja i obrót całej warstwy",fields:[$p,Rp,Ip,Ap]},{id:"appearance",title:"Wygląd",description:"Rozmycie, jasność i przesunięcie barwy",fields:[Np,Lp,Dp]}];e.innerHTML=`
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
            value="${kt(t.settings.color)}"
            data-effect-color
            aria-label="Kolor efektu"
          >

          <span
            class="inspector-color-value"
            data-color-value
          >
            ${kt(t.settings.color).toUpperCase()}
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
        ${Tp.map(p=>`
              <button
                class="inspector-color-swatch ${t.settings.colorize&&kt(t.settings.color).toLowerCase()===p.toLowerCase()?"is-selected":""}"
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

    ${r.map(p=>qp(p,t.settings,a.defaultSettings)).join("")}

    ${cp(t)}

    <section
      class="inspector-group ${Ze.has("composition")?"is-collapsed":""}"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="composition"
        aria-expanded="${String(!Ze.has("composition"))}"
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
        ${Ze.has("composition")?"hidden":""}
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
  `,lp(e,t.instanceId);const o=e.querySelector('[data-setting="blendMode"]');o&&(o.value=t.settings.blendMode);const c=e.querySelector('[data-setting="area"]');c&&(c.value=t.settings.area),e.querySelectorAll("[data-inspector-group-toggle]").forEach(p=>{p.addEventListener("click",()=>{const b=p.dataset.inspectorGroupToggle;b&&(Ze.has(b)?Ze.delete(b):Ze.add(b),Qa(e))})});const d=e.querySelector("[data-effect-variant]");d?.addEventListener("change",()=>{const p=n.find(b=>b.id===d.value);p&&Se(t.instanceId,{...p.settings})});const f=e.querySelector("[data-effect-color]");f?.addEventListener("change",()=>{Se(t.instanceId,{color:kt(f.value),colorize:!0})}),e.querySelectorAll("[data-color-preset]").forEach(p=>{p.addEventListener("click",()=>{const b=kt(p.dataset.colorPreset);Se(t.instanceId,{color:b,colorize:!0})})}),e.querySelector("[data-color-natural]")?.addEventListener("click",()=>{Se(t.instanceId,{color:a.defaultSettings.color,colorize:!1})}),e.querySelectorAll("[data-reset-setting]").forEach(p=>{p.addEventListener("click",b=>{b.preventDefault(),b.stopPropagation();const u=p.dataset.resetSetting;u&&Se(t.instanceId,{[u]:a.defaultSettings[u]})})}),e.querySelector("[data-reset-variant]")?.addEventListener("click",()=>{Se(t.instanceId,{...a.defaultSettings})}),e.querySelectorAll('input[type="range"][data-setting]').forEach(p=>{p.addEventListener("input",()=>{const b=p.dataset.setting,u=Number(p.value),h=e.querySelector(`[data-output="${b}"]`);h&&(h.value=`${u}${p.dataset.suffix??""}`),Se(t.instanceId,{[b]:u})})}),o?.addEventListener("change",()=>{Se(t.instanceId,{blendMode:o.value})}),c?.addEventListener("change",()=>{Se(t.instanceId,{area:c.value})}),e.querySelector("[data-inspector-reset]")?.addEventListener("click",()=>{Se(t.instanceId,{...a.defaultSettings})})}const Fp=[["chat-command","Komenda czatu"],["follower","Nowy obserwujący"],["subscriber","Subskrypcja"],["tip","Donacja"],["cheer","Cheer / Bits"],["raid","Raid"]];let Ia=0;function ta(){return he().effects.filter(e=>e.enabled)}function en(){const e=++Ia,t=document.createElement("fieldset");t.className="export-route-card",t.dataset.routeId="route-"+e,t.innerHTML=`
    <legend>Reguła</legend>
    <button type="button" data-remove-route aria-label="Usuń regułę">Usuń</button>
    <div class="export-route-fields">
      <label>Zdarzenie<select data-route-mode></select></label>
      <label data-route-command-field>Komenda<input data-route-command value="!hype" maxlength="25" autocomplete="off" spellcheck="false"></label>
      <label>Czas (s)<input type="number" data-route-duration value="5" min=".5" max="60" step=".5"></label>
      <label>Cooldown (s)<input type="number" data-route-cooldown value="10" min="0" max="300" step="1"></label>
    </div>
    <div class="export-route-effect-list" data-route-effects role="group" aria-label="Efekty przypisane do reguły"></div>
  `;const a=t.querySelector("[data-route-mode]");for(const[n,s]of Fp){const i=document.createElement("option");i.value=n,i.textContent=s,a.appendChild(i)}return t.querySelector("[data-route-command]").value=e===1?"!hype":"!hype"+e,Br(t,!0),t}function Br(e,t=!1){const a=e.querySelector("[data-route-effects]");if(!a)return;const n=ta(),s=JSON.stringify(n.map(r=>[r.instanceId,r.label,r.effectId]));if(!t&&e.dataset.effectsSignature===s)return;const i=new Set(Array.from(a.querySelectorAll("input[type=checkbox]:checked"),r=>r.value));a.replaceChildren(),n.forEach((r,o)=>{const c=document.createElement("label"),d=document.createElement("input");d.type="checkbox",d.value=r.instanceId,d.checked=t?o===0:i.has(r.instanceId);const f=document.createElement("span"),p=ze(r.effectId);f.textContent=r.label||p?.name||r.effectId,c.append(d,f),a.append(c)}),e.dataset.effectsSignature=s}function Bp(e){const t=e.querySelector("[data-route-mode]")?.value,a=e.querySelector("[data-route-command-field]");a&&(a.hidden=t!=="chat-command"),Br(e)}function St(e){if(!e.querySelector("[data-multi-routes]")?.checked)return;const t=e.querySelector("[data-route-list]");return t?Array.from(t.querySelectorAll("[data-route-id]"),a=>{const n=s=>a.querySelector(s)?.value??"";return{id:a.dataset.routeId??"",mode:a.querySelector("[data-route-mode]")?.value,chatCommand:n("[data-route-command]"),activeDurationMs:Number(n("[data-route-duration]"))*1e3,cooldownMs:Number(n("[data-route-cooldown]"))*1e3,effectInstanceIds:Array.from(a.querySelectorAll("[data-route-effects] input:checked"),s=>s.value)}}):[]}function Wp(e,t){const a=e.querySelector("[data-multi-routes]"),n=e.querySelector("[data-route-list]");if(!(!a||!n)){if(a.checked=t!==null,n.replaceChildren(),n.dataset.preserveEmpty=String(t!==null&&t.length===0),t!==null){const s=ta().map(r=>r.instanceId),i=mt(t,s);for(const r of i){const o=en();o.dataset.routeId=r.id;const c=/^route-(\d+)$/.exec(r.id);c&&(Ia=Math.max(Ia,Number(c[1]))),o.querySelector("[data-route-mode]").value=r.mode,o.querySelector("[data-route-command]").value=r.chatCommand,o.querySelector("[data-route-duration]").value=String(r.activeDurationMs/1e3),o.querySelector("[data-route-cooldown]").value=String(r.cooldownMs/1e3);const d=new Set(r.effectInstanceIds);o.querySelectorAll("[data-route-effects] input").forEach(f=>{f.checked=d.has(f.value)}),n.appendChild(o)}}Ye(e)}}function Ye(e){const t=e.querySelector("[data-multi-routes]")?.checked??!1,a=e.querySelector("[data-single-trigger]"),n=e.querySelector("[data-route-workspace]");if(a&&(a.hidden=t),n&&(n.hidden=!t),!t)return;const s=e.querySelector("[data-route-list]");if(!s)return;s.children.length===0&&s.dataset.preserveEmpty!=="true"&&s.appendChild(en()),s.querySelectorAll("[data-route-id]").forEach(Bp);const i=e.querySelector("[data-add-route]");i&&(i.disabled=s.children.length>=pa);const r=St(e)??[],o=mt(r,ta().map(d=>d.instanceId)),c=e.querySelector("[data-route-warning]");c&&(c.textContent=ta().length===0?"Dodaj i włącz przynajmniej jeden efekt w edytorze.":o.length<r.length?"Reguły bez zaznaczonych efektów są pomijane w eksporcie.":`Gotowe: ${o.length} reguł w jednym widżecie.`)}function Up(e,t){const a=e.querySelector("[data-multi-routes]"),n=e.querySelector("[data-route-list]"),s=e.querySelector("[data-add-route]");!a||!n||!s||(a.addEventListener("change",()=>{n.dataset.preserveEmpty="false",Ye(e),t()}),s.addEventListener("click",()=>{n.children.length>=pa||(n.dataset.preserveEmpty="false",n.appendChild(en()),Ye(e),t())}),n.addEventListener("click",i=>{if(!(i.target instanceof Element))return;const r=i.target.closest("[data-remove-route]");r&&(r.closest("[data-route-id]")?.remove(),Ye(e),t())}),n.addEventListener("change",()=>{Ye(e),t()}),Ye(e))}const Aa="animated-effects-stream-elements-profile",Na=1,Wr="animated-effects:se-profiles:v1",Je=16,La=1024*1024,je=e=>e!==null&&typeof e=="object"&&!Array.isArray(e),ot=(e,t=1e6)=>typeof e=="number"&&Number.isFinite(e)&&Math.abs(e)<=t,On=e=>typeof e=="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(e),xa=e=>typeof e=="string"&&/^#[0-9a-fA-F]{6}$/.test(e);function Ur(e){if(!je(e)||!je(e.resolution)||!je(e.palette)||!je(e.background)||!Array.isArray(e.effects))throw new Error("Plik nie zawiera poprawnej sceny Animated Effects.");const t=e.resolution;if(!ot(t.width)||!ot(t.height)||t.width<64||t.width>8192||t.height<64||t.height>8192)throw new Error("Nieprawidłowa rozdzielczość sceny.");const a=e.palette;for(const o of["accent1","accent2","accent3","background1","background2"])if(!xa(a[o]))throw new Error("Nieprawidłowa paleta sceny.");const n=e.background;if(!["solid","gradient","mesh","aurora","radial","horizon","spotlight","split","darkcenter"].includes(String(n.mode)))throw new Error("Nieobsługiwane tło sceny.");for(const o of["angle","lightX","lightY","hue","saturation","brightness","contrast","noise","vignette"])if(!ot(n[o]))throw new Error("Nieprawidłowe parametry tła.");if(n.color!==void 0&&!xa(n.color))throw new Error("Nieprawidłowy kolor tła.");if(n.colorize!==void 0&&typeof n.colorize!="boolean")throw new Error("Nieprawidłowa konfiguracja tła.");if(typeof e.backgroundOnly!="boolean"||!["none","left","center","right","top","bottom"].includes(String(e.focusZone))||!["off","left","center","right","top","bottom","full"].includes(String(e.safeZone)))throw new Error("Nieprawidłowe ustawienia sceny.");if(e.effects.length>64)throw new Error("Zbyt wiele warstw w profilu.");const i=new Set,r=e.effects.map(o=>{if(!je(o)||!On(o.instanceId)||i.has(o.instanceId)||typeof o.effectId!="string"||typeof o.enabled!="boolean"||!ot(o.seed,4294967295)||o.seed<0||!Number.isInteger(o.seed)||!je(o.settings))throw new Error("Profil zawiera nieprawidłową warstwę efektu.");const c=ze(o.effectId);if(!c)throw new Error("Nieznany efekt: "+o.effectId.slice(0,80));i.add(o.instanceId);const d=o.settings,f={opacity:[0,100],scale:[0,2e3],x:[-2e3,2e3],y:[-2e3,2e3],rotation:[-3600,3600],blur:[0,500],brightness:[0,1e3],hue:[-3600,3600],density:[0,1e3],zIndex:[-1e4,1e4],speed:[-1e3,1e3],intensity:[0,1e3]},p=Object.keys(f);for(const m of p){const[g,w]=f[m];if(!ot(d[m],Math.max(Math.abs(g),Math.abs(w)))||d[m]<g||d[m]>w)throw new Error("Nieprawidłowe ustawienie efektu: "+m)}if(!["normal","screen","lighten","multiply","overlay"].includes(String(d.blendMode))||!["full","left","center","right","top","bottom"].includes(String(d.area))||d.color!==void 0&&!xa(d.color)||d.colorize!==void 0&&typeof d.colorize!="boolean"||d.custom!==void 0&&!je(d.custom))throw new Error("Nieprawidłowe opcje warstwy efektu.");if(je(d.custom)){const m=Object.entries(d.custom);if(m.length>80||m.some(([g,w])=>!/^[\w-]{1,64}$/.test(g)||["__proto__","constructor","prototype"].includes(g)||!ot(w,1e4)))throw new Error("Nieprawidłowe parametry własne efektu.")}if(o.label!==void 0&&(typeof o.label!="string"||o.label.length>100))throw new Error("Nieprawidłowa etykieta warstwy.");if(o.locked!==void 0&&typeof o.locked!="boolean")throw new Error("Nieprawidłowa blokada warstwy.");if(o.groupId!==void 0&&o.groupId!==null&&!On(o.groupId))throw new Error("Nieprawidłowa grupa warstwy.");const b=je(d.custom)?Object.fromEntries(Object.entries(d.custom).map(([m,g])=>[m,g])):void 0;if(o.timeline!==void 0&&!je(o.timeline))throw new Error("Nieprawidłowa oś czasu warstwy.");const u=o.trigger===void 0?void 0:Ae(o.trigger);if(o.trigger!==void 0&&!u)throw new Error("Nieprawidłowy wyzwalacz warstwy.");const h={...c.defaultSettings,...Object.fromEntries(p.map(m=>[m,d[m]])),blendMode:d.blendMode,area:d.area,...d.color===void 0?{}:{color:d.color},...d.colorize===void 0?{}:{colorize:d.colorize},...b===void 0?{}:{custom:b}};return{instanceId:o.instanceId,effectId:c.id,enabled:o.enabled,seed:o.seed,settings:h,...o.timeline===void 0?{}:{timeline:ve(o.timeline,h)},...u===void 0?{}:{trigger:u},...typeof o.label=="string"?{label:o.label}:{},locked:o.locked===!0,groupId:typeof o.groupId=="string"?o.groupId:null}});return{resolution:{width:t.width,height:t.height},backgroundOnly:e.backgroundOnly,palette:{accent1:a.accent1,accent2:a.accent2,accent3:a.accent3,background1:a.background1,background2:a.background2},background:{mode:n.mode,angle:n.angle,lightX:n.lightX,lightY:n.lightY,hue:n.hue,saturation:n.saturation,brightness:n.brightness,contrast:n.contrast,noise:n.noise,vignette:n.vignette,...n.color===void 0?{}:{color:n.color},...n.colorize===void 0?{}:{colorize:n.colorize}},focusZone:e.focusZone,safeZone:e.safeZone,effects:r,selectedEffectInstanceId:typeof e.selectedEffectInstanceId=="string"&&i.has(e.selectedEffectInstanceId)?e.selectedEffectInstanceId:null,activePresetId:typeof e.activePresetId=="string"&&e.activePresetId.length<=100?e.activePresetId:null}}function Xp(e,t,a,n){const s=e.trim().slice(0,64);if(!s)throw new Error("Podaj nazwę zestawu animacji.");const i=Ur(t),r=i.effects.filter(o=>o.enabled).map(o=>o.instanceId);return{format:Aa,version:Na,name:s,createdAt:new Date().toISOString(),scene:i,trigger:et(a),routes:n===void 0?null:mt(n,r)}}function tn(e){const t=typeof e=="string"?JSON.parse(e):e;if(!je(t)||t.format!==Aa||t.version!==Na||typeof t.name!="string"||!t.name.trim()||t.name.length>64||typeof t.createdAt!="string"||Number.isNaN(Date.parse(t.createdAt))||!je(t.trigger)||t.routes!==null&&!Array.isArray(t.routes))throw new Error("Nieobsługiwany lub uszkodzony profil StreamElements.");if(Array.isArray(t.routes)&&t.routes.length>pa)throw new Error("Profil zawiera zbyt wiele reguł StreamElements.");const a=Ur(t.scene),n=et(t.trigger),s=a.effects.filter(r=>r.enabled).map(r=>r.instanceId),i=t.routes===null?null:mt(t.routes,s);return{format:Aa,version:Na,name:t.name.trim(),createdAt:t.createdAt,scene:a,trigger:n,routes:i}}function Zp(e){let t;try{t=e.getItem(Wr)}catch{throw new Error("Przeglądarka zablokowała dostęp do zapisanych zestawów.")}if(!t)return[];if(t.length>La*Je)throw new Error("Biblioteka zestawów jest za duża.");let a;try{a=JSON.parse(t)}catch{throw new Error("Biblioteka zestawów jest uszkodzona.")}if(!Array.isArray(a))throw new Error("Biblioteka zestawów jest uszkodzona.");return a.slice(0,Je).map(tn)}function Hp(e,t){if(t.length>Je)throw new Error("Limit: 16 zapisanych zestawów.");const a=t.map(tn);try{e.setItem(Wr,JSON.stringify(a))}catch{throw new Error("Nie udało się zapisać zestawu w pamięci przeglądarki.")}}function De(e,t){return e.querySelector(t)}function Yp(e){return e.trim()||"Nowy zestaw animacji"}function qn(e,t){const a=new Set(t.map(s=>s.name.toLocaleLowerCase("pl"))),n=e.slice(0,64);if(!a.has(n.toLocaleLowerCase("pl")))return n;for(let s=2;s<1e3;s++){const i=" ("+s+")",r=n.slice(0,64-i.length)+i;if(!a.has(r.toLocaleLowerCase("pl")))return r}throw new Error("Nie można utworzyć kolejnej unikalnej nazwy.")}function Gp(e){const t=e.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"animated-effects",a=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(a),s=document.createElement("a");s.href=n,s.download=t+".ae-profile.json",document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(n),0)}function Jp(e,t){const a=De(e,"[data-profile-name]"),n=De(e,"[data-profile-select]"),s=De(e,"[data-profile-save]"),i=De(e,"[data-profile-load]"),r=De(e,"[data-profile-delete]"),o=De(e,"[data-profile-export]"),c=De(e,"[data-profile-import]"),d=De(e,"[data-profile-file]"),f=De(e,"[data-profile-status]");if(!a||!n||!s||!i||!r||!o||!c||!d||!f)return;const p=(k,x=!1)=>{f.textContent=k,f.dataset.error=String(x)},b=k=>p(k instanceof Error?k.message:"Nie udało się wykonać operacji.",!0),u=()=>Zp(window.localStorage),h=k=>Hp(window.localStorage,k),m=k=>{const x=Number(n.value);return Number.isInteger(x)&&n.value!==""&&x>=0?k[x]??null:null},g=k=>{const x=u(),M=k??m(x)?.name??"";n.replaceChildren();const P=document.createElement("option");P.value="",P.textContent="Wybierz zapisany zestaw",n.appendChild(P),x.forEach((D,j)=>{const W=document.createElement("option");W.value=String(j),W.textContent=D.name+" · "+D.scene.effects.length+" warstw",n.appendChild(W)});const A=x.findIndex(D=>D.name===M);n.value=A<0?"":String(A);const _=A>=0;return i.disabled=!_,r.disabled=!_,o.disabled=!_,s.disabled=x.length>=Je,x},w=()=>m(u());n.addEventListener("change",()=>{try{const k=w();i.disabled=r.disabled=o.disabled=k===null,k&&(a.value=k.name)}catch(k){b(k)}}),s.addEventListener("click",()=>{try{const k=u();if(k.length>=Je)throw new Error("Limit: 16 zapisanych zestawów.");const x=qn(Yp(a.value),k),M=t.capture(x);if(JSON.stringify(M).length>La)throw new Error("Ten zestaw jest za duży do zapisania.");h([...k,M]),g(x),a.value=x,p("Zapisano zestaw „"+x+"” lokalnie w tej przeglądarce.")}catch(k){b(k)}}),i.addEventListener("click",()=>{try{const k=w();if(!k)throw new Error("Wybierz zestaw do wczytania.");if(!window.confirm("Wczytać zestaw „"+k.name+"”? Bieżąca scena i reguły zostaną zastąpione. Zmianę sceny można cofnąć przez Undo."))return;t.apply(k),p("Wczytano zestaw „"+k.name+"”.")}catch(k){b(k)}}),r.addEventListener("click",()=>{try{const k=u(),x=m(k);if(!x)throw new Error("Wybierz zestaw do usunięcia.");if(!window.confirm("Usunąć zapisany zestaw „"+x.name+"”?"))return;h(k.filter(M=>M!==x)),g(),p("Usunięto zestaw z pamięci tej przeglądarki.")}catch(k){b(k)}}),o.addEventListener("click",()=>{try{const k=w();if(!k)throw new Error("Wybierz zestaw do pobrania.");Gp(k),p("Przygotowano plik JSON: "+k.name+".")}catch(k){b(k)}}),c.addEventListener("click",()=>{d.click()}),d.addEventListener("change",async()=>{const k=d.files?.[0];if(d.value="",!!k)try{if(k.size>La)throw new Error("Plik przekracza limit 1 MB.");const x=tn(await k.text()),M=u();if(M.length>=Je)throw new Error("Limit: 16 zapisanych zestawów.");const P=qn(x.name,M);h([...M,{...x,name:P}]),g(P),p("Zaimportowano „"+P+"” do biblioteki. Kliknij Wczytaj, aby zmienić scenę.")}catch(x){b(x)}});try{const k=g();p("Zapis lokalny: "+k.length+"/"+Je+" zestawów. Import JSON nie podmienia bieżącej sceny.")}catch(k){b(k),s.disabled=i.disabled=r.disabled=o.disabled=!0}}const Vp={follower:"follower-latest",subscriber:"subscriber-latest",tip:"tip-latest",cheer:"cheer-latest",raid:"raid-latest"},Kp={follower:"Nowy obserwujący",subscriber:"Subskrypcja",tip:"Donacja",cheer:"Cheer / Bits",raid:"Raid"};function Qp(e,t,a=[]){const n=et(e);return(t===void 0?[{id:"single",...n,effectInstanceIds:a}]:mt(t,a)).map((i,r)=>i.mode==="always"?{id:i.id,label:"Zawsze aktywna — start przy ładowaniu",listener:"onWidgetLoad",event:{}}:i.mode==="chat-command"?{id:i.id,label:(t?String(r+1)+". ":"")+"Czat: "+i.chatCommand,listener:"message",event:{data:{text:i.chatCommand,msgId:"simulation-pending"}}}:{id:i.id,label:(t?String(r+1)+". ":"")+(Kp[i.mode]??i.mode),listener:Vp[i.mode]??"",event:{name:"Testowy widz"}})}function eu(e,t){return e.listener==="message"?{listener:"message",event:{data:{...e.event.data&&typeof e.event.data=="object"?e.event.data:{},msgId:t}}}:{listener:e.listener,event:e.event}}function Fn(e){return e.replace(/<\/script/gi,"<\\/script")}function tu(e){return'<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>'+e.css.replace(/<\/style/gi,"<\\/style")+"</style></head><body>"+e.html+"<script>"+Fn(e.javascript)+"<\/script><script>"+Fn(`(function () {
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
})();`)+"<\/script></body></html>"}function au(e,t){const a=e.querySelector("[data-simulator-frame]"),n=e.querySelector("[data-simulator-event]"),s=e.querySelector("[data-simulator-fire]"),i=e.querySelector("[data-simulator-reset]"),r=e.querySelector("[data-simulator-status]");if(!a||!n||!s||!i||!r)return{refresh:()=>{},destroy:()=>{}};let o=null,c="",d=!1,f=0,p=[],b=!0;const u=x=>{r.textContent=x},h=(x,M)=>{!d||!o?.contentWindow||o.contentWindow.postMessage({channel:"ae-se-simulator",action:x,detail:M},"*")},m=x=>{if(!b||!o||x.source!==o.contentWindow)return;const M=x.data;if(!(!M||typeof M!="object")&&(M.type==="ae-se-simulator-ready"&&(d=!0,s.disabled=p.length===0||p[n.selectedIndex]?.listener==="onWidgetLoad",i.disabled=!1,u("Gotowe. Podgląd korzysta z kodu wygenerowanego dla StreamElements.")),M.type==="ae-se-simulator-state"&&d)){const P=typeof M.count=="number"&&Number.isFinite(M.count)?M.count:0;u(P>0?"Aktywna animacja · "+P+" warstw. Kolejne zdarzenia respektują cooldown.":"Scena ukryta. Można przetestować kolejne zdarzenie.")}};window.addEventListener("message",m);const g=()=>{if(!b)return;const{exported:x,trigger:M,routes:P}=t(),A=n.value;p=Qp(M,P,he().effects.filter(D=>D.enabled).map(D=>D.instanceId)),n.replaceChildren();for(const D of p){const j=document.createElement("option");j.value=D.id,j.textContent=D.label,n.appendChild(j)}p.some(D=>D.id===A)&&(n.value=A),s.disabled=!d||p.length===0||p[n.selectedIndex]?.listener==="onWidgetLoad";const _=JSON.stringify([x.html,x.css,x.javascript]);_===c&&o||(c=_,d=!1,s.disabled=i.disabled=!0,u("Ładowanie odizolowanego podglądu StreamElements…"),o?.remove(),o=document.createElement("iframe"),o.className="export-simulator-iframe",o.title="Symulacja animacji StreamElements",o.setAttribute("sandbox","allow-scripts"),o.setAttribute("referrerpolicy","no-referrer"),a.replaceChildren(o),o.srcdoc=tu(x))},w=()=>{const x=p.find(M=>M.id===n.value);!x||!d||x.listener==="onWidgetLoad"||(f+=1,h("event",eu(x,"ae-sim-"+f)),u("Wysłano: "+x.label+". Oczekiwanie na reakcję widżetu…"))};s.addEventListener("click",w),n.addEventListener("change",()=>{s.disabled=!d||p[n.selectedIndex]?.listener==="onWidgetLoad"}),i.addEventListener("click",()=>{h("reset"),u("Zresetowano widżet i jego cooldowny.")});const k=()=>{b=!1,window.removeEventListener("message",m),o?.remove(),o=null};return e.addEventListener("close",()=>{o?.remove(),o=null,c="",d=!1,s.disabled=i.disabled=!0}),{refresh:g,destroy:k}}const Xr=new WeakMap;function nu(e){e.querySelector("[data-export-close]")?.addEventListener("click",()=>e.close());const a=e.querySelector("[data-export-download]");a?.addEventListener("click",async()=>{if(a.disabled)return;a.disabled=!0;const n=a.textContent;a.textContent="Tworzenie ZIP…";try{const s=structuredClone(he()),i=Qt(s,Mt(e),St(e)),r=new Pr;r.file("widget.html",i.html),r.file("widget.css",i.css),r.file("widget.js",i.javascript),r.file("scene.aescene.json",Ha(s,"StreamElements Export")),r.file("README.txt",["Animated Effects — eksport do StreamElements","","1. Otwórz StreamElements > My Overlays i edytuj własny overlay.","2. Dodaj Custom Widget i przejdź do zakładek HTML, CSS i JS.","3. Wklej odpowiednio pliki widget.html, widget.css i widget.js.","4. Zapisz widget i sprawdź jego działanie w podglądzie.","","Plik scene.aescene.json jest kopią projektu do ponownej edycji","w Animated Effects (Wczytaj), a nie plikiem do StreamElements.","Rozdzielczość ustaw w overlayu / źródle OBS, nie w tym ZIP.","Dostępne są dwa warianty: globalny routing wielu reguł oraz","wyzwalacze przypisane do warstw z kolejką, priorytetami i podpisami.","Zestawy reguł globalnych mają pierwszeństwo, gdy są włączone.","Po onWidgetLoad startują warstwy ciągłe (Od razu / zawsze).","Warstwy z wyzwalaczem startują dopiero po pasującym onEventReceived.","Obsługa zdarzeń: follow, sub, tip, cheer, raid, wiadomość.","Wyzwalacze zależą od zdarzeń dostępnych na Twojej platformie.","Przycisk 'Testuj w podglądzie' działa tylko w edytorze Animated Effects.","Nie wymaga to tokenu SE_API ani zatrzymywania kolejki alertów.","","Dynamiczne podpisy alertów można włączyć w Inspektorze warstwy.","Wzory: {name} - widz, {amount} - kwota/liczba,","{message} - treść wiadomości, {event} - typ zdarzenia.","Tekst jest kodowany bez HTML, aby wiadomości nie uruchamiały kodu.","Kolejka alertów: ważniejsze oczekujące zdarzenia mogą zostać","wyświetlone wcześniej, ale nie przerywają aktualnej animacji.","Tryb, priorytet i wygląd podpisu ustawia się w Inspektorze warstwy.","Pozycja Własna (X/Y) pozwala też przeciągnąć podpis w podglądzie.","Podpis ma niezależne efekty wejścia i wyjścia: wjazd, fade, pop.","Wszystkie konfiguracje pozostają w scene.aescene.json.","Diagnostyka: w edytorze rozwiń panel pod podglądem sceny.","Symulator kolejki nie łączy się z kontem ani z StreamElements.","W wygenerowanym widgetcie można nasłuchiwać zdarzenia","animated-effects:diagnostics w DevTools (CustomEvent.detail).","Raport zawiera stan kolejki, typy zdarzeń i powody odrzuceń,","ale nie zawiera nazw widzów, kwot, czatu ani adresów awatarów.","W edytorze można wyeksportować i wczytać anonimowy ślad","syntetycznych zdarzeń (JSON) i odtworzyć go po zmianie sceny.","Porównanie A/B działa wyłącznie dla tego samego śladu","i pełnych przebiegów testowych; nie mierzy wydajności GPU/OBS.","Jeśli masz włączony alertbox StreamElements, osobno ustal","jego położenie, żeby nie nakładał się na te animacje.","","Wskazówka: plików ZIP nie przesyła się bezpośrednio do Custom Widget."].join(`
`));const o=await r.generateAsync({type:"blob",compression:"DEFLATE"}),c=URL.createObjectURL(o),d=document.createElement("a");d.href=c,d.download="animated-effects-streamelements.zip",document.body.appendChild(d),d.click(),d.remove(),setTimeout(()=>URL.revokeObjectURL(c),1500),a.textContent="Pobrano ZIP"}catch(s){console.error("Animated Effects: export ZIP failed",s),a.textContent="Błąd eksportu",window.alert("Nie udało się przygotować paczki. Spróbuj ponownie.")}finally{a.disabled=!1,setTimeout(()=>{a.textContent=n},1500)}}),e.querySelectorAll("[data-trigger-mode], [data-trigger-command], [data-trigger-duration], [data-trigger-cooldown]").forEach(n=>{n.addEventListener("change",()=>{aa(e),e.open&&Yt(e)})}),aa(e),Up(e,()=>Yt(e)),Jp(e,{capture:n=>Xp(n,he(),Mt(e),St(e)),apply:n=>{Xa(n.scene,"Wczytaj zestaw StreamElements: "+n.name),ru(e,n.trigger),Wp(e,n.routes),Yt(e)}}),Xr.set(e,au(e,()=>{const n=Mt(e),s=St(e);return{trigger:n,routes:s,exported:Qt(he(),n,s)}})),e.querySelectorAll("[data-copy]").forEach(n=>{n.addEventListener("click",async()=>{const s=n.dataset.copy;if(!s)return;const i=e.querySelector(`[data-export="${s}"]`);if(!i)return;await navigator.clipboard.writeText(i.value);const r=n.textContent;n.textContent="Skopiowano",setTimeout(()=>{n.textContent=r},1e3)})})}function Yt(e){const t=Mt(e);aa(e,t),Ye(e);const a=St(e),n=Qt(he(),t,a);za(e,"html",n.html),za(e,"css",n.css),za(e,"javascript",n.javascript);const s=e.querySelector("[data-export-metrics]");s&&(s.textContent=`${n.estimatedDomNodes} DOM · koszt ${n.estimatedPerformanceCost}`+(a===void 0?"":` · ${a.length} reguł`)),e.open||e.showModal(),Xr.get(e)?.refresh()}function Mt(e){const t=e.querySelector("[data-trigger-mode]")?.value,a=e.querySelector("[data-trigger-command]")?.value,n=e.querySelector("[data-trigger-duration]")?.value,s=e.querySelector("[data-trigger-cooldown]")?.value;return t?et({mode:t,chatCommand:a,activeDurationMs:n===void 0?void 0:Number(n)*1e3,cooldownMs:s===void 0?void 0:Number(s)*1e3}):Cr}function ru(e,t){const a=e.querySelector("[data-trigger-mode]"),n=e.querySelector("[data-trigger-command]"),s=e.querySelector("[data-trigger-duration]"),i=e.querySelector("[data-trigger-cooldown]");a&&(a.value=t.mode),n&&(n.value=t.chatCommand),s&&(s.value=String(t.activeDurationMs/1e3)),i&&(i.value=String(t.cooldownMs/1e3)),aa(e,t)}function aa(e,t=Mt(e)){const a=t.mode==="always",n=t.mode==="chat-command",s=e.querySelector("[data-trigger-command-field]");s&&(s.hidden=!n),e.querySelectorAll("[data-trigger-timing]").forEach(d=>{d.hidden=a});const i=e.querySelector("[data-trigger-info]");i&&(i.textContent=a?"Efekty startują po załadowaniu widgetu i pozostają aktywne.":n?`Widz wpisuje ${t.chatCommand}; widget uruchamia scenę na ${t.activeDurationMs/1e3} s. Cooldown: ${t.cooldownMs/1e3} s.`:`Po zdarzeniu StreamElements scena działa ${t.activeDurationMs/1e3} s. Cooldown: ${t.cooldownMs/1e3} s.`);const r=e.querySelector("[data-trigger-command]"),o=e.querySelector("[data-trigger-duration]"),c=e.querySelector("[data-trigger-cooldown]");r&&r.value!==t.chatCommand&&(r.value=t.chatCommand),o&&(o.value=String(t.activeDurationMs/1e3)),c&&(c.value=String(t.cooldownMs/1e3))}function za(e,t,a){const n=e.querySelector(`[data-export="${t}"]`);n&&(n.value=a)}const Zr=document.querySelector("#app");if(!Zr)throw new Error("Nie znaleziono elementu #app.");Zr.innerHTML=`
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
`;function Ee(e){const t=document.querySelector(e);if(!t)throw new Error(`Nie znaleziono elementu: ${e}`);return t}const su=Ee("#preview-host"),Sa=Ee("#layers-list"),iu=Ee("#layer-count"),an=Ee("#inspector"),Re=Ee("#effect-library"),Bn=Ee("#effect-search"),na=Ee("#effect-category"),ou=Ee("#effect-result-count"),cu=Ee("#library-summary"),lu=Ee("#active-summary"),du=Ee("#preview-meta"),Hr=Ee("#stream-elements-export");nu(Hr);const Xe=Vd(su),Da=wc(Xe,Ee(".ae-stage-panel")),pu=Lc(Ee(".ae-stage-panel"),()=>he().effects),ra=jt();let Yr="",sa="all",_e=null;function uu(e){const t=ze(e);return t?{instanceId:`preview-${crypto.randomUUID()}`,effectId:t.id,seed:Math.floor(Math.random()*4294967295),enabled:!0,settings:{...t.defaultSettings}}:null}function Gr(){_e&&(_e=null,oa(),rn())}let ia=!1;const fu={calm:"Spokojne",energy:"Energia","sci-fi":"Sci-Fi",fantasy:"Fantasy",steampunk:"Steampunk",botanical:"Natura",urban:"Urban",cosmic:"Kosmos",tech:"Tech",solar:"Solar",retro:"Retro",weather:"Pogoda",cinematic:"Filmowe",abstract:"Abstrakcyjne",other:"Inne"};function Et(e){return fu[e]??e}function mu(e){return he().effects.filter(a=>a.effectId===e.effectId).findIndex(a=>a.instanceId===e.instanceId)+1}function yu(){const e=[...new Set(ra.map(t=>t.category))].sort((t,a)=>Et(t).localeCompare(Et(a),"pl"));na.innerHTML=`
    <option value="all">
      Wszystkie kategorie
    </option>

    ${e.map(t=>`
          <option value="${t}">
            ${Et(t)}
          </option>
        `).join("")}
  `,na.value=sa}function hu(){const e=Re.getBoundingClientRect(),a=Array.from(Re.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).filter(s=>!s.hidden&&getComputedStyle(s).display!=="none").find(s=>s.getBoundingClientRect().bottom>e.top+1);if(!a)return null;const n=a.dataset.effectId;return n?{effectId:n,topOffset:a.getBoundingClientRect().top-e.top,scrollTop:Re.scrollTop}:null}function gu(e){if(!e)return;const t=Re.getBoundingClientRect(),a=Array.from(Re.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).find(i=>i.dataset.effectId===e.effectId);if(!a){Re.scrollTop=e.scrollTop;return}const s=a.getBoundingClientRect().top-t.top-e.topOffset;Number.isFinite(s)&&Math.abs(s)>.25&&(Re.scrollTop+=s)}function bu(e){e&&requestAnimationFrame(()=>{requestAnimationFrame(()=>{gu(e)})})}function oa(){Array.from(Re.querySelectorAll(":scope > .ae-effect-card[data-effect-id]")).forEach(e=>{const t=e.dataset.effectId;if(!t)return;const a=_e?.effectId===t;e.classList.toggle("is-previewing",a);const n=e.querySelector(".ae-effect-card-preview");if(!n)return;n.setAttribute("aria-pressed",String(a));const s=ze(t);s&&n.setAttribute("aria-label",a?`Wyłącz tymczasowy podgląd ${s.name}`:`Podejrzyj tymczasowo ${s.name}`)})}function nn(){const e=hu(),t=Yr.trim().toLocaleLowerCase("pl"),a=ra.filter(n=>sa==="all"||n.category===sa?t?[n.name,n.id,n.category,...n.tags,...ea(n.id).map(r=>r.name)].join(" ").toLocaleLowerCase("pl").includes(t):!0:!1);if(ou.textContent=`${a.length} z ${ra.length}`,Re.replaceChildren(),a.length===0){Re.innerHTML=`
      <div class="ae-empty-state">
        Nie znaleziono efektów dla tych filtrów.
      </div>
    `;return}a.forEach(n=>{const s=document.createElement("div");s.className="ae-effect-card",s.dataset.category=n.category,s.dataset.effectId=n.id;const i=_e?.effectId===n.id;s.classList.toggle("is-previewing",i),s.title=n.description;const r=`Koszt wydajności: ${n.performanceCost}/5`,o=ea(n.id).length,c=Array.from({length:5},(d,f)=>`
            <i class="${f<n.performanceCost?"is-filled":""}"></i>
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
                ${Et(n.category)}
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
      `,s.querySelector(".ae-effect-card-preview")?.addEventListener("click",()=>{_e=_e?.effectId===n.id?null:uu(n.id),oa(),rn()}),s.querySelector(".ae-add-icon")?.addEventListener("click",()=>{_e=null,oa(),ar(n.id)}),Re.appendChild(s)}),bu(e)}const Fe=new Map;function rn(){for(const t of Fe.values())clearTimeout(t);Fe.clear(),Xe.replaceChildren(),he().effects.forEach(t=>{!t.enabled||Ua(t)||$a(Xe,t)}),_e&&$a(Xe,_e),Da.afterRender()}document.addEventListener("animated-effects:diagnostics-clear-preview",()=>{for(const e of Fe.values())clearTimeout(e);Fe.clear();for(const e of Array.from(Xe.children))e.dataset.testTriggerId&&e.remove()});document.addEventListener("animated-effects:test-trigger",e=>{const t=e.detail,a=t?.instanceId;if(!a)return;const n=he().effects.find(f=>f.instanceId===a);if(!n||!n.enabled||!Ua(n))return;if(t.diagnostic){for(const f of Fe.values())clearTimeout(f);Fe.clear();for(const f of Array.from(Xe.children))f.dataset.testTriggerId&&f.remove()}Array.from(Xe.children).find(f=>f.dataset?.testTriggerId===a)?.remove();const i=Fe.get(a);i!==void 0&&clearTimeout(i);const r=document.createElement("div");r.dataset.testTriggerId=a,Object.assign(r.style,{position:"absolute",inset:"0",pointerEvents:"none"}),Xe.appendChild(r),$a(r,Jn(n));const o=n.trigger?.event??"follower-latest",c=o==="message"?{data:{displayName:"Przykładowy widz",text:"Świetny turniej!"}}:{name:"Przykładowy widz",amount:42,message:"Dobra robota!"},d=Go(r,n.trigger?.caption,o,c,Pt(n));if(d&&n.trigger?.caption?.position==="custom"){d.style.pointerEvents="auto",d.style.cursor="grab",d.style.touchAction="none",d.title="Przeciągnij podpis, aby ustawić go na scenie";let f=null,p=n.trigger.caption.xPercent??50,b=n.trigger.caption.yPercent??75;const u=(h,m)=>{const g=r.getBoundingClientRect();!g.width||!g.height||(p=Math.max(25,Math.min(75,Math.round((h-g.left)/g.width*100))),b=Math.max(10,Math.min(90,Math.round((m-g.top)/g.height*100))),d.style.left=p+"%",d.style.top=b+"%")};d.addEventListener("pointerdown",h=>{h.button!==0||f!==null||(f=h.pointerId,d.setPointerCapture(f),d.style.cursor="grabbing",h.preventDefault(),h.stopPropagation())}),d.addEventListener("pointermove",h=>{f===h.pointerId&&(u(h.clientX,h.clientY),h.preventDefault())}),d.addEventListener("pointerup",h=>{if(f!==h.pointerId)return;u(h.clientX,h.clientY),d.hasPointerCapture(f)&&d.releasePointerCapture(f),f=null,d.style.cursor="grab";const m=he().effects.find(g=>g.instanceId===a)?.trigger;m?.caption&&(m.caption.xPercent===p&&m.caption.yPercent===b||(Ea(a,{...m,caption:{...m.caption,position:"custom",xPercent:p,yPercent:b}}),document.dispatchEvent(new CustomEvent("animated-effects:test-trigger",{detail:{instanceId:a}}))))}),d.addEventListener("pointercancel",()=>{f=null,d.style.cursor="grab"})}Da.replay(),Da.afterRender(),Fe.set(a,window.setTimeout(()=>{r.remove(),Fe.delete(a)},Pt(n)))});function wu(){const e=he();if(Sa.replaceChildren(),iu.textContent=String(e.effects.length),e.effects.length===0){Sa.innerHTML=`
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejdź do zakładki Efekty i dodaj pierwszy efekt.
      </div>
    `;return}[...e.effects].reverse().forEach(t=>{const a=ze(t.effectId);if(!a)return;const n=document.createElement("div");n.className="ae-layer-row",t.enabled||n.classList.add("is-disabled"),e.selectedEffectInstanceId===t.instanceId&&n.classList.add("is-selected");const s=mu(t);n.innerHTML=`
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
                ${Et(a.category)}
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
        `,n.querySelector(".ae-layer-select")?.addEventListener("click",()=>{rr(t.instanceId)}),n.querySelector(".layer-toggle")?.addEventListener("click",()=>{ic(t.instanceId)}),n.querySelector(".layer-up")?.addEventListener("click",()=>{lc(t.instanceId)}),n.querySelector(".layer-down")?.addEventListener("click",()=>{dc(t.instanceId)}),n.querySelector(".layer-remove")?.addEventListener("click",()=>{nr(t.instanceId)}),Sa.appendChild(n)})}function ku(){const e=he(),t=e.effects.filter(a=>a.enabled).length;cu.textContent=`${ra.length} efektów`,lu.textContent=`Aktywne: ${t} · Warstwy: ${e.effects.length}`,du.textContent=`${e.resolution.width} × ${e.resolution.height} · aktywne: ${t}`}function vu(){oa(),rn(),wu(),ku(),pu.refresh(),ia||(Qa(an),qc())}function xu(e){document.querySelectorAll("[data-sidebar-tab]").forEach(t=>{const a=t.dataset.sidebarTab===e;t.classList.toggle("is-active",a),t.setAttribute("aria-selected",String(a))}),document.querySelectorAll("[data-sidebar-view]").forEach(t=>{const a=t.dataset.sidebarView===e;t.hidden=!a,t.classList.toggle("is-active",a)})}yu();nn();Qn(vu);an.addEventListener("pointerdown",e=>{const t=e.target;t instanceof HTMLInputElement&&t.type==="range"&&(ia=!0)});const Jr=()=>{ia&&(ia=!1,Qa(an))};window.addEventListener("pointerup",Jr);window.addEventListener("pointercancel",Jr);Bn.addEventListener("input",()=>{Yr=Bn.value,nn()});na.addEventListener("change",()=>{sa=na.value,nn()});document.addEventListener("pointerdown",e=>{if(!_e)return;const t=e.target;t instanceof Element&&(t.closest(".ae-effect-card")||Gr())});document.addEventListener("keydown",e=>{e.key==="Escape"&&_e&&Gr()});document.querySelectorAll("[data-sidebar-tab]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.sidebarTab;(t==="effects"||t==="layers")&&xu(t)})});document.querySelector("#clear-preview")?.addEventListener("click",()=>{_e=null,sc()});document.querySelector("#export-stream-elements")?.addEventListener("click",()=>{Yt(Hr)});ar("rainfall");Ud();Fc();Jd();Dc();Oc();console.warn("[AE diagnostic] Pack 18 isolation active: Pack06Polish02, Pack08UiQa, Pack09Customization and Pack09UiPolish are disabled.");
