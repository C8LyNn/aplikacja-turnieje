import type {
  EffectCapabilities,
  EffectCategory,
  EffectSettings,
} from "../../core/types";

import type {
  EffectModule,
} from "../effectModules";

type Kind =
  | "fireworks"
  | "radar"
  | "warp"
  | "hex"
  | "circuit"
  | "leaks"
  | "gravity"
  | "pixels";

interface Spec {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  tags: string[];
  kind: Kind;
  count: number;
  cost: 1 | 2 | 3 | 4 | 5;
}

const base: EffectSettings = {
  opacity: 76,
  scale: 100,
  x: 0,
  y: 0,
  rotation: 0,
  blur: 0,
  brightness: 120,
  hue: 0,
  color: "#78d8ff",
  colorize: false,
  density: 65,
  blendMode: "screen",
  area: "full",
  zIndex: 20,
  speed: 100,
  intensity: 85,
};

const capabilities: EffectCapabilities = {
  opacity: true,
  position: true,
  scale: true,
  rotation: true,
  blur: true,
  brightness: true,
  hue: true,
  density: true,
  blendMode: true,
  area: true,
  layer: true,
  speed: true,
  color: true,
  intensity: true,
};

const specs: Spec[] = [
  { id:"fireworks", name:"Fireworks", description:"Promieniste wybuchy fajerwerków do zwycięstw i celebracji.", category:"cinematic", tags:["fireworks","celebration","victory","sparks"], kind:"fireworks", count:10, cost:3 },
  { id:"radar-sweep", name:"Radar Sweep", description:"Obracające się skanery radarowe z technicznym glow.", category:"tech", tags:["radar","scanner","hud","tactical"], kind:"radar", count:4, cost:2 },
  { id:"warp-speed", name:"Warp Speed", description:"Gwiezdne smugi rozchodzące się od centrum jak skok w nadprzestrzeń.", category:"cosmic", tags:["warp","hyperspace","stars","speed"], kind:"warp", count:70, cost:3 },
  { id:"hex-pulse", name:"Hex Pulse", description:"Pulsująca siatka heksagonalnych pól energii.", category:"sci-fi", tags:["hex","grid","pulse","shield"], kind:"hex", count:42, cost:2 },
  { id:"circuit-traces", name:"Circuit Traces", description:"Świecące ścieżki obwodów z przesuwającymi się impulsami.", category:"tech", tags:["circuit","pcb","data","lines"], kind:"circuit", count:34, cost:2 },
  { id:"light-leaks", name:"Light Leaks", description:"Miękkie filmowe rozbłyski i przecieki światła.", category:"cinematic", tags:["light","leak","lens","film","glow"], kind:"leaks", count:8, cost:2 },
  { id:"gravity-well", name:"Gravity Well", description:"Cząstki zasysane po orbitach do jasnego centrum.", category:"cosmic", tags:["gravity","black hole","orbit","vortex"], kind:"gravity", count:56, cost:3 },
  { id:"pixel-storm", name:"Pixel Storm", description:"Cyfrowa burza pikseli przecinająca scenę po skosie.", category:"retro", tags:["pixel","storm","digital","glitch"], kind:"pixels", count:62, cost:3 },
];

const css = `
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
`.trim();

function count(
  spec: Spec,
  settings: EffectSettings,
): number {
  return Math.max(
    1,
    Math.round(
      spec.count *
      settings.density /
      100,
    ),
  );
}

function rendererName(
  id: string,
): string {
  return (
    "aeRenderPolish02" +
    id
      .split("-")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1),
      )
      .join("")
  );
}

function className(
  kind: Kind,
): string {
  return `ae-x2 ae-x2-${kind}`;
}

function render(
  spec: Spec,
  layer: HTMLElement,
  settings: EffectSettings,
  random: () => number,
): void {
  const total =
    count(spec, settings);

  const speed =
    Math.max(
      .1,
      settings.speed / 100,
    );

  for (
    let index = 0;
    index < total;
    index++
  ) {
    const node =
      document.createElement("span");

    node.className =
      className(spec.kind);

    node.style.setProperty(
      "--x",
      `${random() * 100}%`,
    );
    node.style.setProperty(
      "--y",
      `${random() * 100}%`,
    );
    node.style.setProperty(
      "--s",
      `${14 + random() * 82}px`,
    );
    node.style.setProperty(
      "--a",
      `${random() * 360}deg`,
    );
    node.style.setProperty(
      "--p",
      String(
        settings.intensity / 100,
      ),
    );
    node.style.setProperty(
      "--delay",
      `${-random() * 8}s`,
    );
    node.style.setProperty(
      "--d",
      `${(2.5 + random() * 7) / speed}s`,
    );
    node.style.setProperty(
      "--r",
      `${55 + random() * 350}px`,
    );

    if (
      spec.kind === "hex"
    ) {
      const column =
        index % 8;
      const row =
        Math.floor(index / 8);

      node.style.setProperty(
        "--x",
        `${8 + column * 12.2 + (row % 2) * 6.1}%`,
      );
      node.style.setProperty(
        "--y",
        `${10 + row * 14.2}%`,
      );
      node.style.setProperty(
        "--s",
        `${32 + settings.intensity * .12}px`,
      );
    }

    if (
      spec.kind === "circuit"
    ) {
      node.style.setProperty(
        "--s",
        `${60 + random() * 175}px`,
      );
      node.style.setProperty(
        "--a",
        `${Math.round(random() * 3) * 90}deg`,
      );
    }

    if (
      spec.kind === "leaks"
    ) {
      node.style.setProperty(
        "--s",
        `${90 + random() * 160}px`,
      );
    }

    if (
      spec.kind === "pixels"
    ) {
      node.style.setProperty(
        "--s",
        `${3 + random() * 12}px`,
      );
      node.style.setProperty(
        "--x",
        `${-12 + random() * 45}%`,
      );
      node.style.setProperty(
        "--y",
        `${-18 + random() * 78}%`,
      );
    }

    if (
      spec.kind === "radar"
    ) {
      node.style.setProperty(
        "--s",
        `${180 + random() * 320}px`,
      );
    }

    layer.appendChild(node);
  }
}

function streamSource(
  spec: Spec,
): string {
  const name =
    rendererName(spec.id);

  return `
function ${name}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const speed = Math.max(.1, s.speed / 100);
  const total = Math.max(1, Math.round(${spec.count} * (s.density / 100)));

  for (let i = 0; i < total; i++) {
    const node = document.createElement("span");
    node.className = ${JSON.stringify(className(spec.kind))};
    node.style.setProperty("--x", (random() * 100) + "%");
    node.style.setProperty("--y", (random() * 100) + "%");
    node.style.setProperty("--s", (14 + random() * 82) + "px");
    node.style.setProperty("--a", (random() * 360) + "deg");
    node.style.setProperty("--p", String(s.intensity / 100));
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--d", ((2.5 + random() * 7) / speed) + "s");
    node.style.setProperty("--r", (55 + random() * 350) + "px");

    if (${JSON.stringify(spec.kind)} === "hex") {
      const column = i % 8;
      const row = Math.floor(i / 8);
      node.style.setProperty("--x", (8 + column * 12.2 + (row % 2) * 6.1) + "%");
      node.style.setProperty("--y", (10 + row * 14.2) + "%");
      node.style.setProperty("--s", (32 + s.intensity * .12) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "circuit") {
      node.style.setProperty("--s", (60 + random() * 175) + "px");
      node.style.setProperty("--a", (Math.round(random() * 3) * 90) + "deg");
    }

    if (${JSON.stringify(spec.kind)} === "leaks") {
      node.style.setProperty("--s", (90 + random() * 160) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "pixels") {
      node.style.setProperty("--s", (3 + random() * 12) + "px");
      node.style.setProperty("--x", (-12 + random() * 45) + "%");
      node.style.setProperty("--y", (-18 + random() * 78) + "%");
    }

    if (${JSON.stringify(spec.kind)} === "radar") {
      node.style.setProperty("--s", (180 + random() * 320) + "px");
    }

    layer.appendChild(node);
  }
}
`.trim();
}

function makeModule(
  spec: Spec,
): EffectModule {
  return {
    definition: {
      id: spec.id,
      name: spec.name,
      description: spec.description,
      category: spec.category,
      tags: spec.tags,
      defaultSettings: {
        ...base,
      },
      capabilities,
      performanceCost: spec.cost,
      requiresJavaScript: true,
    },

    css,

    streamElementsRendererName:
      rendererName(spec.id),

    renderPreview(
      layer,
      settings,
      random,
    ) {
      render(
        spec,
        layer,
        settings,
        random,
      );
    },

    streamElementsRendererSource:
      streamSource(spec),

    estimateDomNodes(
      settings,
    ) {
      return count(
        spec,
        settings,
      );
    },
  };
}

export const pack06ExtraEffectModules:
  EffectModule[] =
    specs.map(makeModule);
