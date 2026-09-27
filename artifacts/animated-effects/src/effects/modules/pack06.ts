import type { EffectCapabilities, EffectCategory, EffectSettings } from "../../core/types";
import type { EffectModule } from "../effectModules";

const defaults: EffectSettings = {
  opacity: 100, scale: 100, x: 0, y: 0, rotation: 0, blur: 0,
  brightness: 100, hue: 0, color: "#78d8ff", colorize: false,
  density: 100, blendMode: "screen", area: "full", zIndex: 20,
  speed: 100, intensity: 100,
};

const capabilities: EffectCapabilities = {
  opacity: true, position: true, scale: true, rotation: true,
  blur: true, brightness: true, hue: true, density: true,
  blendMode: true, area: true, layer: true, speed: true,
  color: true, intensity: true,
};

type Kind = "box" | "ring" | "dot" | "blob" | "line" | "cell" | "helix";
type Spec = {
  id: string; name: string; description: string; category: EffectCategory;
  tags: string[]; kind: Kind; count: number; cost: 1 | 2 | 3 | 4 | 5;
  opacity: number; density: number; speed: number; intensity: number;
};

const specs: Spec[] = [
  { id:"wireframe-cube", name:"Wireframe Cube", description:"Pseudo-3D wireframe cubes rotating through the scene.", category:"tech", tags:["cube","3d","wireframe","geometry","cyber"], kind:"box", count:9, cost:2, opacity:72, density:55, speed:80, intensity:75 },
  { id:"polyhedron", name:"Polyhedron", description:"Luminous polygon forms with pseudo-depth.", category:"abstract", tags:["polyhedron","polygon","3d","geometry"], kind:"box", count:12, cost:2, opacity:72, density:58, speed:70, intensity:70 },
  { id:"orbiting-core", name:"Orbiting Core", description:"Energy cores with orbit-like rings.", category:"energy", tags:["orbit","core","energy","atom"], kind:"ring", count:8, cost:2, opacity:82, density:48, speed:90, intensity:80 },
  { id:"neon-tunnel", name:"Neon Tunnel", description:"Perspective neon frames flying toward the viewer.", category:"retro", tags:["tunnel","neon","synthwave","perspective"], kind:"box", count:18, cost:2, opacity:74, density:70, speed:110, intensity:85 },
  { id:"fractal-rings", name:"Fractal Rings", description:"Nested luminous rings create recursive motion.", category:"abstract", tags:["rings","fractal","recursive","geometry"], kind:"ring", count:16, cost:2, opacity:70, density:66, speed:75, intensity:75 },
  { id:"particle-vortex", name:"Particle Vortex", description:"Particles spiral around a dynamic center.", category:"energy", tags:["vortex","particles","spiral","energy"], kind:"dot", count:58, cost:3, opacity:78, density:62, speed:105, intensity:85 },
  { id:"liquid-blobs", name:"Liquid Blobs", description:"Organic glowing blobs with fluid deformation.", category:"abstract", tags:["liquid","blob","organic","fluid"], kind:"blob", count:15, cost:3, opacity:62, density:52, speed:55, intensity:80 },
  { id:"cell-division", name:"Cell Division", description:"Seeded cells pulse and visually split into colonies.", category:"other", tags:["cell","biology","division","evolution"], kind:"cell", count:32, cost:3, opacity:72, density:58, speed:75, intensity:85 },
  { id:"growing-vines", name:"Growing Vines", description:"Procedural-looking luminous branches grow across the frame.", category:"botanical", tags:["vine","plant","growth","branch"], kind:"line", count:28, cost:3, opacity:72, density:55, speed:65, intensity:85 },
  { id:"constellation-network", name:"Constellation Network", description:"Glowing nodes connected by constellation-like links.", category:"cosmic", tags:["constellation","network","stars","nodes"], kind:"dot", count:40, cost:3, opacity:64, density:58, speed:45, intensity:70 },
  { id:"shockwave-bursts", name:"Shockwave Bursts", description:"Seeded shockwave circles expand through the scene.", category:"energy", tags:["shockwave","burst","pulse","impact"], kind:"ring", count:14, cost:2, opacity:76, density:48, speed:95, intensity:90 },
  { id:"data-nodes", name:"Data Nodes", description:"Technical nodes pulse along short data links.", category:"sci-fi", tags:["data","nodes","hud","network"], kind:"line", count:34, cost:2, opacity:68, density:60, speed:80, intensity:72 },
  { id:"spiral-galaxy", name:"Spiral Galaxy", description:"Seeded stars rotate in a wide spiral galaxy.", category:"cosmic", tags:["galaxy","spiral","stars","space"], kind:"dot", count:80, cost:3, opacity:78, density:66, speed:55, intensity:88 },
  { id:"recursive-squares", name:"Recursive Squares", description:"Nested squares create an infinite-zoom illusion.", category:"abstract", tags:["recursive","squares","infinite","zoom"], kind:"box", count:22, cost:2, opacity:72, density:72, speed:75, intensity:88 },
  { id:"dna-helix", name:"DNA Helix", description:"A pseudo-3D double helix made from luminous nodes.", category:"sci-fi", tags:["dna","helix","science","biology"], kind:"helix", count:42, cost:2, opacity:76, density:68, speed:70, intensity:78 },
  { id:"floating-cubes", name:"Floating Cubes", description:"A field of luminous pseudo-3D cubes drifting in space.", category:"tech", tags:["cube","3d","floating","geometry"], kind:"box", count:24, cost:3, opacity:68, density:58, speed:60, intensity:74 },
];

const css = `
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
`.trim();

function countFor(spec: Spec, settings: EffectSettings): number {
  return Math.max(1, Math.round(spec.count * settings.density / 100));
}
function rendererName(id: string): string {
  return "aeRenderPack06" + id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function decorate(node: HTMLElement, index: number, settings: EffectSettings, random: () => number, kind: Kind): void {
  const speed = Math.max(.1, settings.speed / 100);
  node.className = `ae-p06-node ae-p06-${kind}`;
  node.style.setProperty("--i", String(index));
  node.style.setProperty("--x", `${random() * 100}%`);
  node.style.setProperty("--y", kind === "helix" ? `${5 + (index % 42) * 2.15}%` : `${random() * 100}%`);
  node.style.setProperty("--size", `${12 + random() * 70}px`);
  node.style.setProperty("--angle", `${random() * 360}deg`);
  node.style.setProperty("--delay", `${-random() * 8}s`);
  node.style.setProperty("--duration", `${(2.8 + random() * 7) / speed}s`);
  node.style.setProperty("--power", String(settings.intensity / 100));
}
function makeRendererSource(spec: Spec, name: string): string {
  return `
function ${name}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(1, Math.round(${spec.count} * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p06-node ae-p06-${spec.kind}";
    node.style.setProperty("--i", String(i));
    node.style.setProperty("--x", (random() * 100) + "%");
    node.style.setProperty("--y", ${JSON.stringify(spec.kind)} === "helix" ? (5 + (i % 42) * 2.15) + "%" : (random() * 100) + "%");
    node.style.setProperty("--size", (12 + random() * 70) + "px");
    node.style.setProperty("--angle", (random() * 360) + "deg");
    node.style.setProperty("--delay", (-random() * 8) + "s");
    node.style.setProperty("--duration", ((2.8 + random() * 7) / speed) + "s");
    node.style.setProperty("--power", String(s.intensity / 100));
    layer.appendChild(node);
  }
}
`.trim();
}
function makeModule(spec: Spec): EffectModule {
  const name = rendererName(spec.id);
  return {
    definition: {
      id: spec.id, name: spec.name, description: spec.description,
      category: spec.category, tags: spec.tags,
      defaultSettings: { ...defaults, opacity: spec.opacity, density: spec.density, speed: spec.speed, intensity: spec.intensity },
      capabilities, performanceCost: spec.cost, requiresJavaScript: true,
    },
    css,
    streamElementsRendererName: name,
    renderPreview(layer, settings, random) {
      const total = countFor(spec, settings);
      for (let index = 0; index < total; index++) {
        const node = document.createElement("span");
        decorate(node, index, settings, random, spec.kind);
        layer.appendChild(node);
      }
    },
    streamElementsRendererSource: makeRendererSource(spec, name),
    estimateDomNodes(settings) { return countFor(spec, settings); },
  };
}

export const pack06EffectModules: EffectModule[] = specs.map(makeModule);
