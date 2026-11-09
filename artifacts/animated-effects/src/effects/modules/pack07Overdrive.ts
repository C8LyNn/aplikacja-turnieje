import type { EffectCapabilities, EffectCategory, EffectSettings } from "../../core/types";
import type { EffectModule } from "../effectModules";

type Kind =
  | "gear"
  | "comet"
  | "firework"
  | "lightning"
  | "blob"
  | "vortex"
  | "portal"
  | "radar"
  | "glitch"
  | "gravity"
  | "hex"
  | "cube"
  | "prism"
  | "shards"
  | "storm";

type Spec = {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  tags: string[];
  kind: Kind;
  count: number;
  cost: 1 | 2 | 3 | 4 | 5;
  opacity?: number;
  density?: number;
  speed?: number;
  intensity?: number;
  brightness?: number;
};

const defaults: EffectSettings = {
  opacity: 84,
  scale: 100,
  x: 0,
  y: 0,
  rotation: 0,
  blur: 0,
  brightness: 120,
  hue: 0,
  color: "#78d8ff",
  colorize: false,
  density: 100,
  blendMode: "screen",
  area: "full",
  zIndex: 20,
  speed: 100,
  intensity: 100,
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
  { id: "gears", name: "Gears", description: "Steampunkowe koła zębate z czytelniejszymi zębami i kontr-rotacją.", category: "steampunk", tags: ["gear", "cogs", "steampunk", "mechanical"], kind: "gear", count: 10, cost: 2, opacity: 80, density: 70, speed: 90, intensity: 90, brightness: 118 },
  { id: "comets", name: "Comets", description: "Jasne komety z długim ogonem lecące po przekątnej.", category: "cosmic", tags: ["comet", "tail", "space", "shooting star"], kind: "comet", count: 22, cost: 2, opacity: 88, density: 72, speed: 110, intensity: 105, brightness: 132 },
  { id: "fireworks", name: "Fireworks", description: "Pełniejsze wybuchy fajerwerków z wieloma promieniami.", category: "cinematic", tags: ["fireworks", "spark", "celebration", "burst"], kind: "firework", count: 12, cost: 3, opacity: 88, density: 66, speed: 95, intensity: 110, brightness: 135 },
  { id: "lightning-storm", name: "Lightning Storm", description: "Błyskawice z mocniejszym rozgałęzieniem i flashami.", category: "weather", tags: ["lightning", "storm", "electric", "thunder"], kind: "lightning", count: 14, cost: 3, opacity: 88, density: 62, speed: 108, intensity: 118, brightness: 138 },
  { id: "liquid-blobs", name: "Liquid Blobs", description: "Bardziej organiczne, płynne metaballe o miękkim ruchu.", category: "abstract", tags: ["liquid", "blob", "metaball", "organic"], kind: "blob", count: 16, cost: 3, opacity: 76, density: 70, speed: 70, intensity: 115, brightness: 120 },
  { id: "particle-vortex", name: "Particle Vortex", description: "Głębszy wir cząstek z mocniejszą spiralą i środkiem zasysania.", category: "energy", tags: ["vortex", "spiral", "particles", "swirl"], kind: "vortex", count: 96, cost: 3, opacity: 82, density: 80, speed: 110, intensity: 120, brightness: 130 },
  { id: "portal-rings", name: "Portal Rings", description: "Pulsujące portalowe pierścienie z falowaniem i poświatą.", category: "sci-fi", tags: ["portal", "rings", "gateway", "pulse"], kind: "portal", count: 8, cost: 2, opacity: 82, density: 72, speed: 92, intensity: 112, brightness: 128 },
  { id: "radar-sweep", name: "Radar Sweep", description: "Czytelny radar ze stożkiem skanu i pingami kontaktów.", category: "tech", tags: ["radar", "scan", "hud", "sweep"], kind: "radar", count: 4, cost: 2, opacity: 82, density: 60, speed: 86, intensity: 96, brightness: 125 },
  { id: "glitch-blocks", name: "Glitch Blocks", description: "Mocniej zróżnicowane bloki glitch z przesunięciami RGB.", category: "tech", tags: ["glitch", "blocks", "digital", "noise"], kind: "glitch", count: 34, cost: 2, opacity: 72, density: 78, speed: 112, intensity: 112, brightness: 122 },
  { id: "gravity-well", name: "Gravity Well", description: "Lejek grawitacyjny z orbitującym pyłem i jasnym rdzeniem.", category: "cosmic", tags: ["gravity", "well", "singularity", "orbit"], kind: "gravity", count: 80, cost: 3, opacity: 82, density: 76, speed: 96, intensity: 118, brightness: 130 },
  { id: "hex-grid", name: "Hex Grid", description: "Gęstsza siatka sześciokątów z pulsem i zanikaniem.", category: "sci-fi", tags: ["hex", "grid", "honeycomb", "hud"], kind: "hex", count: 84, cost: 2, opacity: 68, density: 76, speed: 72, intensity: 100, brightness: 118 },
  { id: "floating-cubes", name: "Floating Cubes", description: "Bardziej przestrzenne sześciany z lekką pseudo-głębią.", category: "tech", tags: ["cube", "floating", "3d", "geometry"], kind: "cube", count: 32, cost: 3, opacity: 76, density: 76, speed: 68, intensity: 98, brightness: 118 },
  { id: "prism-drift", name: "Prism Drift", description: "Lśniące pryzmaty dryfujące przez scenę.", category: "abstract", tags: ["prism", "crystal", "glass", "drift"], kind: "prism", count: 26, cost: 2, opacity: 78, density: 72, speed: 70, intensity: 102, brightness: 126 },
  { id: "neon-shards", name: "Neon Shards", description: "Neonowe odłamki z szybkim dryfem i smugą.", category: "retro", tags: ["shards", "neon", "fragments", "synthwave"], kind: "shards", count: 42, cost: 2, opacity: 78, density: 80, speed: 118, intensity: 110, brightness: 132 },
  { id: "plasma-storm", name: "Plasma Storm", description: "Burza plazmowych smug z turbulentnym ruchem.", category: "energy", tags: ["plasma", "storm", "energy", "embers"], kind: "storm", count: 54, cost: 3, opacity: 80, density: 82, speed: 104, intensity: 118, brightness: 132 },
  { id: "cube-swarm", name: "Cube Swarm", description: "Rój małych kostek przecinających scenę w warstwach.", category: "tech", tags: ["cube", "swarm", "voxels", "digital"], kind: "cube", count: 64, cost: 3, opacity: 72, density: 86, speed: 98, intensity: 108, brightness: 115 },
];

const css = String.raw`
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
`.trim();

function clampPercent(value: number): number {
  return Math.max(0, Math.min(400, value));
}

function countFor(spec: Spec, settings: EffectSettings): number {
  return Math.max(1, Math.round(spec.count * clampPercent(settings.density) / 100));
}

function rendererName(id: string): string {
  return "aeRenderPack07" + id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}

function setShared(node: HTMLElement, index: number, settings: EffectSettings, random: () => number, spec: Spec): void {
  const speed = Math.max(0.1, settings.speed / 100);
  const power = Math.max(0.2, clampPercent(settings.intensity) / 100);
  node.classList.add("ae-p07", `ae-p07-${spec.kind}`);
  node.style.setProperty("--i", String(index));
  node.style.setProperty("--power", String(power));
  node.style.setProperty("--duration", `${(2.5 + random() * 6.5) / speed}s`);
  node.style.setProperty("--delay", `${-random() * 8}s`);
  node.style.setProperty("--size", `${16 + random() * 92}px`);
  node.style.setProperty("--angle", `${random() * 360}deg`);
  node.style.setProperty("--easing", spec.kind === "glitch" ? "steps(2,end)" : "linear");
}

function decorateNode(node: HTMLElement, index: number, settings: EffectSettings, random: () => number, spec: Spec): void {
  setShared(node, index, settings, random, spec);
  const power = Math.max(0.2, clampPercent(settings.intensity) / 100);
  const orbit = `${30 + random() * 180 * power}px`;

  switch (spec.kind) {
    case "gear":
      node.style.setProperty("--x", `${8 + random() * 84}%`);
      node.style.setProperty("--y", `${10 + random() * 80}%`);
      node.style.setProperty("--size", `${48 + random() * 96}px`);
      node.style.setProperty("--spin", `${(random() > 0.5 ? 1 : -1) * (180 + random() * 360)}deg`);
      break;
    case "comet":
      node.style.setProperty("--x", `${-8 + random() * 88}%`);
      node.style.setProperty("--y", `${-8 + random() * 42}%`);
      node.style.setProperty("--angle", `${18 + random() * 28}deg`);
      node.style.setProperty("--tx", `${80 + random() * 45}vw`);
      node.style.setProperty("--ty", `${50 + random() * 35}vh`);
      break;
    case "firework":
      node.style.setProperty("--x", `${10 + random() * 80}%`);
      node.style.setProperty("--y", `${10 + random() * 74}%`);
      break;
    case "lightning":
      node.style.setProperty("--x", `${8 + random() * 84}%`);
      node.style.setProperty("--y", `${10 + random() * 20}%`);
      node.style.setProperty("--duration", `${(1.1 + random() * 2.8) / Math.max(0.3, settings.speed / 100)}s`);
      break;
    case "blob":
      node.style.setProperty("--x", `${8 + random() * 84}%`);
      node.style.setProperty("--y", `${8 + random() * 84}%`);
      node.style.setProperty("--size", `${64 + random() * 130}px`);
      break;
    case "vortex":
      node.style.setProperty("--x", "50%");
      node.style.setProperty("--y", "50%");
      node.style.setProperty("--orbit", orbit);
      break;
    case "portal":
      node.style.setProperty("--x", `${35 + random() * 30}%`);
      node.style.setProperty("--y", `${30 + random() * 40}%`);
      node.style.setProperty("--size", `${60 + random() * 120}px`);
      break;
    case "radar":
      node.style.setProperty("--x", `${18 + random() * 64}%`);
      node.style.setProperty("--y", `${18 + random() * 64}%`);
      node.style.setProperty("--size", `${120 + random() * 140}px`);
      break;
    case "glitch":
      node.style.setProperty("--x", `${random() * 80}%`);
      node.style.setProperty("--y", `${random() * 92}%`);
      break;
    case "gravity":
      node.style.setProperty("--x", "50%");
      node.style.setProperty("--y", "50%");
      node.style.setProperty("--orbit", orbit);
      break;
    case "hex":
      node.style.setProperty("--x", `${4 + (index % 12) * 8.2}%`);
      node.style.setProperty("--y", `${8 + Math.floor(index / 12) * 10.2}%`);
      node.style.setProperty("--size", `${22 + random() * 28}px`);
      break;
    case "cube":
      node.style.setProperty("--x", `${4 + random() * 90}%`);
      node.style.setProperty("--y", `${6 + random() * 86}%`);
      node.style.setProperty("--size", `${18 + random() * 58}px`);
      break;
    case "prism":
      node.style.setProperty("--x", `${8 + random() * 84}%`);
      node.style.setProperty("--y", `${8 + random() * 84}%`);
      node.style.setProperty("--size", `${30 + random() * 52}px`);
      break;
    case "shards":
      node.style.setProperty("--x", `${random() * 72}%`);
      node.style.setProperty("--y", `${random() * 92}%`);
      break;
    case "storm":
      node.style.setProperty("--x", `${8 + random() * 84}%`);
      node.style.setProperty("--y", `${8 + random() * 84}%`);
      break;
  }
}

function makeRendererSource(spec: Spec, name: string): string {
  return `
function ${name}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const density = Math.max(0, Math.min(400, s.density));
  const intensity = Math.max(0, Math.min(400, s.intensity));
  const count = Math.max(1, Math.round(${spec.count} * density / 100));
  const speed = Math.max(.1, s.speed / 100);
  const power = Math.max(.2, intensity / 100);
  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p07 ae-p07-${spec.kind}";
    node.style.setProperty("--i", String(i));
    node.style.setProperty("--power", String(power));
    node.style.setProperty("--duration", ((2.5 + random() * 6.5) / speed) + "s");
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--size", (16 + random() * 92) + "px");
    node.style.setProperty("--angle", (random() * 360) + "deg");
    node.style.setProperty("--easing", ${JSON.stringify(spec.kind)} === "glitch" ? "steps(2,end)" : "linear");
    const orbit = (30 + random() * 180 * power) + "px";
    switch (${JSON.stringify(spec.kind)}) {
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
`.trim();
}

function makeModule(spec: Spec): EffectModule {
  const name = rendererName(spec.id);
  return {
    definition: {
      id: spec.id,
      name: spec.name,
      description: spec.description,
      category: spec.category,
      tags: spec.tags,
      defaultSettings: {
        ...defaults,
        opacity: spec.opacity ?? defaults.opacity,
        density: spec.density ?? defaults.density,
        speed: spec.speed ?? defaults.speed,
        intensity: spec.intensity ?? defaults.intensity,
        brightness: spec.brightness ?? defaults.brightness,
      },
      capabilities,
      performanceCost: spec.cost,
      requiresJavaScript: true,
    },
    css,
    streamElementsRendererName: name,
    renderPreview(layer, settings, random) {
      const total = countFor(spec, settings);
      for (let index = 0; index < total; index++) {
        const node = document.createElement("span");
        decorateNode(node, index, settings, random, spec);
        layer.appendChild(node);
      }
    },
    streamElementsRendererSource: makeRendererSource(spec, name),
    estimateDomNodes(settings) {
      return countFor(spec, settings);
    },
  };
}

export const pack07OverdriveEffectModules: EffectModule[] = specs.map(makeModule);
