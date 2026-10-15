import type {
  EffectCapabilities,
  EffectCategory,
  EffectSettings,
} from "../../core/types";

import type {
  EffectModule,
} from "../effectModules";

type Kind =
  | "black-hole"
  | "debris"
  | "tunnel"
  | "lattice"
  | "target"
  | "scanner"
  | "fragments"
  | "melt"
  | "wirecube"
  | "poly"
  | "shockwave"
  | "electric"
  | "ribbon"
  | "ink";

interface Spec {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  tags: string[];
  kind: Kind;
  count: number;
  cost: 1 | 2 | 3 | 4 | 5;
  density: number;
  speed: number;
  intensity: number;
}

const defaults: EffectSettings = {
  opacity: 82,
  scale: 100,
  x: 0,
  y: 0,
  rotation: 0,
  blur: 0,
  brightness: 125,
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
  {
    id: "black-hole-accretion",
    name: "Black Hole Accretion",
    description: "Dysk akrecyjny z cząstkami spiralnie wpadającymi do jasnego rdzenia.",
    category: "cosmic",
    tags: ["black hole", "accretion", "gravity", "singularity", "orbit"],
    kind: "black-hole",
    count: 92,
    cost: 3,
    density: 78,
    speed: 92,
    intensity: 115,
  },
  {
    id: "orbital-debris",
    name: "Orbital Debris",
    description: "Odłamki krążące po kilku płaszczyznach orbit i głębokościach.",
    category: "cosmic",
    tags: ["orbit", "debris", "space", "asteroid", "satellite"],
    kind: "debris",
    count: 46,
    cost: 3,
    density: 74,
    speed: 82,
    intensity: 105,
  },
  {
    id: "star-tunnel",
    name: "Star Tunnel",
    description: "Tunel gwiezdnych smug z mocną perspektywą i ruchem ku kamerze.",
    category: "cosmic",
    tags: ["stars", "tunnel", "hyperspace", "perspective", "warp"],
    kind: "tunnel",
    count: 86,
    cost: 3,
    density: 76,
    speed: 118,
    intensity: 118,
  },
  {
    id: "energy-lattice",
    name: "Energy Lattice",
    description: "Pulsująca sieć energetycznych połączeń i węzłów.",
    category: "sci-fi",
    tags: ["lattice", "network", "energy", "nodes", "grid"],
    kind: "lattice",
    count: 40,
    cost: 3,
    density: 70,
    speed: 78,
    intensity: 102,
  },
  {
    id: "target-lock",
    name: "Target Lock",
    description: "HUD-owy celownik z pierścieniami, markerami i pulsami namierzania.",
    category: "tech",
    tags: ["target", "lock", "hud", "reticle", "scanner"],
    kind: "target",
    count: 6,
    cost: 2,
    density: 55,
    speed: 82,
    intensity: 100,
  },
  {
    id: "scanner-beams",
    name: "Scanner Beams",
    description: "Wielokierunkowe wiązki skanujące scenę z miękką poświatą.",
    category: "tech",
    tags: ["scanner", "beam", "laser", "scan", "hud"],
    kind: "scanner",
    count: 12,
    cost: 2,
    density: 62,
    speed: 92,
    intensity: 108,
  },
  {
    id: "digital-fragments",
    name: "Digital Fragments",
    description: "Cyfrowe fragmenty rozpadające się i przeskakujące warstwami.",
    category: "retro",
    tags: ["digital", "fragments", "glitch", "blocks", "data"],
    kind: "fragments",
    count: 54,
    cost: 3,
    density: 76,
    speed: 110,
    intensity: 108,
  },
  {
    id: "pixel-melt",
    name: "Pixel Melt",
    description: "Pionowe smugi pikseli spływające jak topiący się cyfrowy obraz.",
    category: "retro",
    tags: ["pixel", "melt", "glitch", "drip", "digital"],
    kind: "melt",
    count: 62,
    cost: 3,
    density: 78,
    speed: 88,
    intensity: 112,
  },
  {
    id: "wireframe-cubes",
    name: "Wireframe Cubes",
    description: "Pole czystych drucianych kostek pseudo-3D obracających się w przestrzeni.",
    category: "tech",
    tags: ["wireframe", "cubes", "3d", "geometry", "grid"],
    kind: "wirecube",
    count: 30,
    cost: 3,
    density: 70,
    speed: 72,
    intensity: 98,
  },
  {
    id: "floating-polyhedra",
    name: "Floating Polyhedra",
    description: "Dryfujące wielościany o różnych rozmiarach i osi obrotu.",
    category: "abstract",
    tags: ["polyhedra", "geometry", "3d", "floating", "facets"],
    kind: "poly",
    count: 28,
    cost: 3,
    density: 68,
    speed: 68,
    intensity: 100,
  },
  {
    id: "shockwave-rings",
    name: "Shockwave Rings",
    description: "Szybkie, warstwowe fale uderzeniowe rozchodzące się z różnych punktów.",
    category: "energy",
    tags: ["shockwave", "rings", "impact", "pulse", "wave"],
    kind: "shockwave",
    count: 16,
    cost: 2,
    density: 64,
    speed: 112,
    intensity: 115,
  },
  {
    id: "electric-web",
    name: "Electric Web",
    description: "Sieć krótkich łuków elektrycznych przeskakujących po scenie.",
    category: "energy",
    tags: ["electric", "web", "arcs", "lightning", "network"],
    kind: "electric",
    count: 34,
    cost: 3,
    density: 72,
    speed: 118,
    intensity: 120,
  },
  {
    id: "ribbon-streamers",
    name: "Ribbon Streamers",
    description: "Długie kolorowe wstążki płynące falami zamiast drobnych cząstek.",
    category: "cinematic",
    tags: ["ribbon", "streamers", "flow", "celebration", "wave"],
    kind: "ribbon",
    count: 18,
    cost: 2,
    density: 62,
    speed: 82,
    intensity: 105,
  },
  {
    id: "ink-clouds",
    name: "Ink Clouds",
    description: "Powolne organiczne chmury przypominające atrament rozlewający się w wodzie.",
    category: "abstract",
    tags: ["ink", "clouds", "fluid", "organic", "smoke"],
    kind: "ink",
    count: 13,
    cost: 3,
    density: 58,
    speed: 48,
    intensity: 105,
  },
];

const css = String.raw`
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
`.trim();

function clamp(value: number): number {
  return Math.max(
    0,
    Math.min(
      400,
      value,
    ),
  );
}

function rendererName(
  id: string,
): string {
  return (
    "aeRenderPack08" +
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

function countFor(
  spec: Spec,
  settings: EffectSettings,
): number {
  return Math.max(
    1,
    Math.round(
      spec.count *
      clamp(settings.density) /
      100,
    ),
  );
}

function decorate(
  node: HTMLElement,
  index: number,
  settings: EffectSettings,
  random: () => number,
  spec: Spec,
): void {
  const speed =
    Math.max(
      .1,
      settings.speed / 100,
    );

  const power =
    Math.max(
      .2,
      clamp(
        settings.intensity,
      ) / 100,
    );

  node.className =
    `ae-p08 ae-p08-${spec.kind}`;

  node.style.setProperty(
    "--x",
    `${random() * 100}%`,
  );

  node.style.setProperty(
    "--y",
    `${random() * 100}%`,
  );

  node.style.setProperty(
    "--size",
    `${14 + random() * 86}px`,
  );

  node.style.setProperty(
    "--angle",
    `${random() * 360}deg`,
  );

  node.style.setProperty(
    "--duration",
    `${(2.4 + random() * 7) / speed}s`,
  );

  node.style.setProperty(
    "--delay",
    `${-random() * 9}s`,
  );

  node.style.setProperty(
    "--power",
    String(power),
  );

  node.style.setProperty(
    "--orbit",
    `${40 + random() * 220 * power}px`,
  );

  if (
    spec.kind === "black-hole" ||
    spec.kind === "debris" ||
    spec.kind === "tunnel"
  ) {
    node.style.setProperty(
      "--x",
      "50%",
    );

    node.style.setProperty(
      "--y",
      "50%",
    );
  }

  if (
    spec.kind === "target"
  ) {
    node.style.setProperty(
      "--x",
      `${24 + random() * 52}%`,
    );

    node.style.setProperty(
      "--y",
      `${20 + random() * 58}%`,
    );

    node.style.setProperty(
      "--size",
      `${24 + random() * 60}px`,
    );
  }

  if (
    spec.kind === "scanner"
  ) {
    node.style.setProperty(
      "--x",
      `${-12 + random() * 24}%`,
    );

    node.style.setProperty(
      "--y",
      `${random() * 94}%`,
    );

    node.style.setProperty(
      "--angle",
      `${-8 + random() * 16}deg`,
    );
  }

  if (
    spec.kind === "melt"
  ) {
    node.style.setProperty(
      "--x",
      `${random() * 100}%`,
    );

    node.style.setProperty(
      "--y",
      `${-18 + random() * 8}%`,
    );
  }

  if (
    spec.kind === "wirecube" ||
    spec.kind === "poly"
  ) {
    node.style.setProperty(
      "--x",
      `${6 + random() * 88}%`,
    );

    node.style.setProperty(
      "--y",
      `${7 + random() * 86}%`,
    );

    node.style.setProperty(
      "--size",
      `${22 + random() * 64}px`,
    );
  }

  if (
    spec.kind === "shockwave"
  ) {
    node.style.setProperty(
      "--x",
      `${14 + random() * 72}%`,
    );

    node.style.setProperty(
      "--y",
      `${14 + random() * 72}%`,
    );

    node.style.setProperty(
      "--size",
      `${28 + random() * 62}px`,
    );
  }

  if (
    spec.kind === "electric"
  ) {
    node.style.setProperty(
      "--x",
      `${4 + random() * 84}%`,
    );

    node.style.setProperty(
      "--y",
      `${5 + random() * 90}%`,
    );

    node.style.setProperty(
      "--duration",
      `${(.8 + random() * 2.7) / speed}s`,
    );
  }

  if (
    spec.kind === "ribbon"
  ) {
    node.style.setProperty(
      "--x",
      `${-18 + random() * 18}%`,
    );

    node.style.setProperty(
      "--y",
      `${8 + random() * 84}%`,
    );

    node.style.setProperty(
      "--angle",
      `${-7 + random() * 14}deg`,
    );
  }

  if (
    spec.kind === "ink"
  ) {
    node.style.setProperty(
      "--x",
      `${8 + random() * 84}%`,
    );

    node.style.setProperty(
      "--y",
      `${8 + random() * 84}%`,
    );

    node.style.setProperty(
      "--size",
      `${55 + random() * 120}px`,
    );
  }

  if (
    spec.kind === "lattice"
  ) {
    node.style.setProperty(
      "--angle",
      `${Math.round(random() * 5) * 30}deg`,
    );
  }

  if (
    spec.kind === "fragments"
  ) {
    node.style.setProperty(
      "--duration",
      `${(.7 + random() * 2.4) / speed}s`,
    );
  }

  node.style.setProperty(
    "--i",
    String(index),
  );
}

function sourceFor(
  spec: Spec,
  name: string,
): string {
  return `
function ${name}(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const density = Math.max(0, Math.min(400, s.density));
  const intensity = Math.max(0, Math.min(400, s.intensity));
  const power = Math.max(.2, intensity / 100);
  const speed = Math.max(.1, s.speed / 100);
  const count = Math.max(1, Math.round(${spec.count} * density / 100));

  for (let i = 0; i < count; i++) {
    const node = document.createElement("span");
    node.className = "ae-p08 ae-p08-${spec.kind}";
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
      ${JSON.stringify(spec.kind)} === "black-hole" ||
      ${JSON.stringify(spec.kind)} === "debris" ||
      ${JSON.stringify(spec.kind)} === "tunnel"
    ) {
      node.style.setProperty("--x", "50%");
      node.style.setProperty("--y", "50%");
    }

    if (${JSON.stringify(spec.kind)} === "target") {
      node.style.setProperty("--x", (24 + random() * 52) + "%");
      node.style.setProperty("--y", (20 + random() * 58) + "%");
      node.style.setProperty("--size", (24 + random() * 60) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "scanner") {
      node.style.setProperty("--x", (-12 + random() * 24) + "%");
      node.style.setProperty("--y", (random() * 94) + "%");
      node.style.setProperty("--angle", (-8 + random() * 16) + "deg");
    }

    if (${JSON.stringify(spec.kind)} === "melt") {
      node.style.setProperty("--x", (random() * 100) + "%");
      node.style.setProperty("--y", (-18 + random() * 8) + "%");
    }

    if (
      ${JSON.stringify(spec.kind)} === "wirecube" ||
      ${JSON.stringify(spec.kind)} === "poly"
    ) {
      node.style.setProperty("--x", (6 + random() * 88) + "%");
      node.style.setProperty("--y", (7 + random() * 86) + "%");
      node.style.setProperty("--size", (22 + random() * 64) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "shockwave") {
      node.style.setProperty("--x", (14 + random() * 72) + "%");
      node.style.setProperty("--y", (14 + random() * 72) + "%");
      node.style.setProperty("--size", (28 + random() * 62) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "electric") {
      node.style.setProperty("--x", (4 + random() * 84) + "%");
      node.style.setProperty("--y", (5 + random() * 90) + "%");
      node.style.setProperty("--duration", ((.8 + random() * 2.7) / speed) + "s");
    }

    if (${JSON.stringify(spec.kind)} === "ribbon") {
      node.style.setProperty("--x", (-18 + random() * 18) + "%");
      node.style.setProperty("--y", (8 + random() * 84) + "%");
      node.style.setProperty("--angle", (-7 + random() * 14) + "deg");
    }

    if (${JSON.stringify(spec.kind)} === "ink") {
      node.style.setProperty("--x", (8 + random() * 84) + "%");
      node.style.setProperty("--y", (8 + random() * 84) + "%");
      node.style.setProperty("--size", (55 + random() * 120) + "px");
    }

    if (${JSON.stringify(spec.kind)} === "lattice") {
      node.style.setProperty("--angle", (Math.round(random() * 5) * 30) + "deg");
    }

    if (${JSON.stringify(spec.kind)} === "fragments") {
      node.style.setProperty("--duration", ((.7 + random() * 2.4) / speed) + "s");
    }

    layer.appendChild(node);
  }
}
`.trim();
}

function makeModule(
  spec: Spec,
): EffectModule {
  const renderer =
    rendererName(
      spec.id,
    );

  return {
    definition: {
      id: spec.id,
      name: spec.name,
      description:
        spec.description,
      category:
        spec.category,
      tags:
        spec.tags,
      defaultSettings: {
        ...defaults,
        density:
          spec.density,
        speed:
          spec.speed,
        intensity:
          spec.intensity,
      },
      capabilities,
      performanceCost:
        spec.cost,
      requiresJavaScript:
        true,
    },

    css,

    streamElementsRendererName:
      renderer,

    renderPreview(
      layer,
      settings,
      random,
    ) {
      const total =
        countFor(
          spec,
          settings,
        );

      for (
        let index = 0;
        index < total;
        index++
      ) {
        const node =
          document.createElement(
            "span",
          );

        decorate(
          node,
          index,
          settings,
          random,
          spec,
        );

        layer.appendChild(
          node,
        );
      }
    },

    streamElementsRendererSource:
      sourceFor(
        spec,
        renderer,
      ),

    estimateDomNodes(
      settings,
    ) {
      return countFor(
        spec,
        settings,
      );
    },
  };
}

export const pack08EffectModules:
  EffectModule[] =
    specs.map(
      makeModule,
    );
