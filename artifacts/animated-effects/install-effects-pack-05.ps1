param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$effectPath = Join-Path $ProjectRoot "src\effects\effectModules.ts"
$variantsPath = Join-Path $ProjectRoot "src\effects\variants.ts"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $effectPath) -or
  !(Test-Path $variantsPath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentEffects = [System.IO.File]::ReadAllText($effectPath)
$currentVariants = [System.IO.File]::ReadAllText($variantsPath)

if ($currentEffects.Contains("/* === EFFECTS_PACK_05_START === */")) {
  Write-Host "Effects Pack 05 jest juz zainstalowany." -ForegroundColor Yellow
  exit 0
}

if (!$currentEffects.Contains("/* === EFFECTS_PACK_04_END === */")) {
  throw "Nie wykryto Effects Pack 04. Nie nadpisuje plikow."
}

if (!$currentEffects.Contains("    solarFlare,")) {
  throw "Nie znaleziono aktualnej listy efektow Pack 04."
}

if (!$currentVariants.Contains("export const effectVariantCatalog")) {
  throw "Nie wykryto systemu wariantow. Nie nadpisuje plikow."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$effectBackup = Join-Path $backupRoot "src\effects\effectModules.ts"
$variantsBackup = Join-Path $backupRoot "src\effects\variants.ts"

$effectBackupDir = Split-Path $effectBackup -Parent
$variantsBackupDir = Split-Path $variantsBackup -Parent

New-Item -ItemType Directory -Force -Path $effectBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $variantsBackupDir | Out-Null

Copy-Item $effectPath $effectBackup -Force
Copy-Item $variantsPath $variantsBackup -Force

Write-Host ""
Write-Host "Animated Effects - Effects Pack 05" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$pack05 = @'
/* === EFFECTS_PACK_05_START === */

const scanlinesPlusCss = `
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
`.trim();

const equalizerBarsCss = `
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
`.trim();

const hudGridCss = `
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
`.trim();

const floatingSymbolsCss = `
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
`.trim();

const smokeWispsCss = `
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
`.trim();

const electricArcsCss = `
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
`.trim();

const snowBurstCss = `
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
`.trim();

const meteorShowerCss = `
.ae-meteor {
  position: absolute;
  width: var(--ae-meteor-size, 140px);
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0),
    rgba(255,255,255,.95) 20%,
    rgba(125, 215, 255, .9) 45%,
    rgba(95, 120, 255, .15) 100%
  );
  box-shadow:
    0 0 10px rgba(155, 225, 255, .4),
    0 0 24px rgba(110, 150, 255, .2);
  transform-origin: left center;
  animation: ae-meteor var(--ae-meteor-duration, 3.2s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ae-meteor {
  from { transform: translate(-18vw, -18vh) rotate(-28deg); opacity: 0; }
  10% { opacity: 1; }
  to { transform: translate(118vw, 118vh) rotate(-28deg); opacity: 0; }
}
`.trim();

const scanlinesPlus: EffectModule = {
  definition: makeDefinition({
    id: "scanlines-plus",
    name: "Scanlines Plus",
    description: "Ruchome, swietlne linie przypominajace skanowanie obrazu.",
    category: "tech",
    tags: ["scanlines", "screen", "tech", "scanner"],
    defaultSettings: { ...defaultSettings, opacity: 58, density: 52, speed: 100, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: scanlinesPlusCss,
  streamElementsRendererName: "aeRenderScanlinesPlus",
  renderPreview(layer, settings, random) {
    const count = particleCount(12, settings, 3);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const line = document.createElement("span");
      line.className = "ae-scanline-plus";
      line.style.top = `${random() * 100}%`;
      line.style.setProperty("--ae-scanline-h", `${1 + random() * 3}px`);
      line.style.setProperty("--ae-scanline-duration", `${(2.4 + random() * 3.8) / speed}s`);
      line.style.animationDelay = `${-random() * 4}s`;
      layer.appendChild(line);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(12, settings, 3); },
};

const equalizerBars: EffectModule = {
  definition: makeDefinition({
    id: "equalizer-bars",
    name: "Equalizer Bars",
    description: "Pulsujace slupki jak w wizualizerze audio.",
    category: "tech",
    tags: ["audio", "equalizer", "bars", "music"],
    defaultSettings: { ...defaultSettings, opacity: 76, density: 62, speed: 100, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: equalizerBarsCss,
  streamElementsRendererName: "aeRenderEqualizerBars",
  renderPreview(layer, settings, random) {
    const count = particleCount(22, settings, 6);
    const speed = Math.max(.1, settings.speed / 100);
    const slot = 100 / count;
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("span");
      bar.className = "ae-eq-bar";
      bar.style.left = `${i * slot + slot * .18}%`;
      bar.style.width = `${Math.max(1.2, slot * .64)}%`;
      bar.style.height = `${18 + random() * 70}%`;
      bar.style.setProperty("--ae-eq-duration", `${(.5 + random() * 1.4) / speed}s`);
      bar.style.animationDelay = `${-random() * 2}s`;
      layer.appendChild(bar);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(22, settings, 6); },
};

const hudGrid: EffectModule = {
  definition: makeDefinition({
    id: "hud-grid",
    name: "HUD Grid",
    description: "Taktyczna siatka i delikatna warstwa interfejsu.",
    category: "tech",
    tags: ["hud", "grid", "ui", "tech"],
    defaultSettings: { ...defaultSettings, opacity: 48, density: 60, speed: 70, blendMode: "screen" },
    performanceCost: 1,
    requiresJavaScript: true,
  }),
  css: hudGridCss,
  streamElementsRendererName: "aeRenderHudGrid",
  renderPreview(layer, settings) {
    const grid = document.createElement("span");
    grid.className = "ae-hud-grid";
    const step = 26 + ((140 - Math.max(20, settings.density)) / 2.2);
    const speed = Math.max(.1, settings.speed / 100);
    grid.style.setProperty("--ae-grid-step", `${step}px`);
    grid.style.setProperty("--ae-grid-duration", `${12 / speed}s`);
    layer.appendChild(grid);
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes() { return 1; },
};

const floatingSymbols: EffectModule = {
  definition: makeDefinition({
    id: "floating-symbols",
    name: "Floating Symbols",
    description: "Magiczne symbole unoszace sie ku gorze.",
    category: "fantasy",
    tags: ["symbols", "magic", "fantasy", "arcane"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 54, speed: 78, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: floatingSymbolsCss,
  streamElementsRendererName: "aeRenderFloatingSymbols",
  renderPreview(layer, settings, random) {
    const glyphs = ["\u2726", "\u2727", "\u2736", "\u273A", "\u2756", "\u263D", "\u263C"];
    const count = particleCount(18, settings, 4);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "ae-floating-symbol";
      el.textContent = glyphs[Math.floor(random() * glyphs.length)] ?? "\u2726";
      el.style.left = `${random() * 100}%`;
      el.style.fontSize = `${18 + random() * 34}px`;
      el.style.setProperty("--ae-symbol-duration", `${(6 + random() * 8) / speed}s`);
      el.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(el);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(18, settings, 4); },
};

const smokeWisps: EffectModule = {
  definition: makeDefinition({
    id: "smoke-wisps",
    name: "Smoke Wisps",
    description: "Miekkie smugi dymu unoszace sie na ekranie.",
    category: "cinematic",
    tags: ["smoke", "fog", "mist", "cinematic"],
    defaultSettings: { ...defaultSettings, opacity: 50, density: 48, speed: 68, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: smokeWispsCss,
  streamElementsRendererName: "aeRenderSmokeWisps",
  renderPreview(layer, settings, random) {
    const count = particleCount(14, settings, 3);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const wisp = document.createElement("span");
      wisp.className = "ae-smoke-wisp";
      const size = 70 + random() * 120;
      wisp.style.left = `${random() * 100}%`;
      wisp.style.width = `${size}px`;
      wisp.style.height = `${size * (.65 + random() * .3)}px`;
      wisp.style.setProperty("--ae-smoke-duration", `${(6 + random() * 7) / speed}s`);
      wisp.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(wisp);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(14, settings, 3); },
};

const electricArcs: EffectModule = {
  definition: makeDefinition({
    id: "electric-arcs",
    name: "Electric Arcs",
    description: "Migajace luki energii i wyadowania elektryczne.",
    category: "energy",
    tags: ["electric", "arcs", "energy", "lightning"],
    defaultSettings: { ...defaultSettings, opacity: 82, density: 55, speed: 110, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: electricArcsCss,
  streamElementsRendererName: "aeRenderElectricArcs",
  renderPreview(layer, settings, random) {
    const count = particleCount(12, settings, 3);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const arc = document.createElement("span");
      arc.className = "ae-electric-arc";
      arc.style.left = `${random() * 86}%`;
      arc.style.top = `${random() * 86}%`;
      arc.style.width = `${70 + random() * 180}px`;
      arc.style.setProperty("--ae-arc-angle", `${(-40 + random() * 80).toFixed(2)}deg`);
      arc.style.setProperty("--ae-arc-duration", `${(.8 + random() * 1.8) / speed}s`);
      arc.style.animationDelay = `${-random() * 3}s`;
      layer.appendChild(arc);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(12, settings, 3); },
};

const snowBurst: EffectModule = {
  definition: makeDefinition({
    id: "snow-burst",
    name: "Snow Burst",
    description: "Gestszy, bardziej dekoracyjny opad sniegu.",
    category: "weather",
    tags: ["snow", "winter", "cold", "flakes"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 68, speed: 72, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: snowBurstCss,
  streamElementsRendererName: "aeRenderSnowBurst",
  renderPreview(layer, settings, random) {
    const count = particleCount(36, settings, 8);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const flake = document.createElement("span");
      flake.className = "ae-snow-burst";
      const size = 4 + random() * 10;
      flake.style.left = `${random() * 100}%`;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.setProperty("--ae-snow-duration", `${(4.8 + random() * 6.2) / speed}s`);
      flake.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(flake);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(36, settings, 8); },
};

const meteorShower: EffectModule = {
  definition: makeDefinition({
    id: "meteor-shower",
    name: "Meteor Shower",
    description: "Ukozne smugi meteorow przecinajace ekran.",
    category: "cosmic",
    tags: ["meteor", "space", "streak", "comet"],
    defaultSettings: { ...defaultSettings, opacity: 78, density: 42, speed: 100, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: meteorShowerCss,
  streamElementsRendererName: "aeRenderMeteorShower",
  renderPreview(layer, settings, random) {
    const count = particleCount(14, settings, 3);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const meteor = document.createElement("span");
      meteor.className = "ae-meteor";
      meteor.style.left = `${random() * 36}%`;
      meteor.style.top = `${random() * 36}%`;
      meteor.style.setProperty("--ae-meteor-size", `${70 + random() * 180}px`);
      meteor.style.setProperty("--ae-meteor-duration", `${(1.8 + random() * 3) / speed}s`);
      meteor.style.animationDelay = `${-random() * 4}s`;
      layer.appendChild(meteor);
    }
  },
  streamElementsRendererSource: `
function aeRenderMeteorShower(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.max(3, Math.round(14 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const meteor = document.createElement("span");
    meteor.className = "ae-meteor";
    meteor.style.left = random() * 36 + "%";
    meteor.style.top = random() * 36 + "%";
    meteor.style.setProperty("--ae-meteor-size", (70 + random() * 180) + "px");
    meteor.style.setProperty("--ae-meteor-duration", ((1.8 + random() * 3) / speed) + "s");
    meteor.style.animationDelay = (-random() * 4) + "s";
    layer.appendChild(meteor);
  }
}
`.trim(),
  estimateDomNodes(settings) { return particleCount(14, settings, 3); },
};

/* === EFFECTS_PACK_05_END === */
'@

$moduleEntries = @'
    scanlinesPlus,
    equalizerBars,
    hudGrid,
    floatingSymbols,
    smokeWisps,
    electricArcs,
    snowBurst,
    meteorShower,
'@

$variantEntries = @'
  "scanlines-plus": [
    { id: "soft", name: "Subtelne", description: "Delikatny skan ekranu.", settings: { opacity: 34, density: 28, speed: 72, brightness: 105, blendMode: "screen" } },
    { id: "monitor", name: "Monitor", description: "Klasyczny efekt skanowania obrazu.", settings: { opacity: 58, density: 52, speed: 100, brightness: 120, blendMode: "screen" } },
    { id: "aggressive", name: "Agresywne", description: "Wiecej linii i mocniejszy ruch.", settings: { opacity: 82, density: 92, speed: 165, brightness: 150, blendMode: "screen" } },
    { id: "violet", name: "Fioletowe", description: "Neonowo-fioletowy skan.", settings: { opacity: 74, density: 60, speed: 110, hue: 85, brightness: 145, blendMode: "screen" } },
  ],
  "equalizer-bars": [
    { id: "ambient", name: "Ambient", description: "Spokojne slupki audio.", settings: { opacity: 52, density: 35, speed: 65, scale: 90, brightness: 105, blendMode: "screen" } },
    { id: "stage", name: "Scena", description: "Zbalansowany wizualizer muzyczny.", settings: { opacity: 76, density: 62, speed: 100, scale: 100, brightness: 125, blendMode: "screen" } },
    { id: "festival", name: "Festival", description: "Mocne i wysokie slupki.", settings: { opacity: 90, density: 100, speed: 155, scale: 110, brightness: 155, blendMode: "screen" } },
    { id: "synthwave", name: "Synthwave", description: "Fioletowo-neonowy wariant.", settings: { opacity: 82, density: 72, speed: 120, hue: 95, brightness: 145, blendMode: "screen" } },
  ],
  "hud-grid": [
    { id: "subtle", name: "Subtelny", description: "Lekka siatka tla.", settings: { opacity: 28, density: 30, speed: 50, brightness: 100, blendMode: "screen" } },
    { id: "tactical", name: "Taktyczny", description: "Czytelna warstwa HUD.", settings: { opacity: 48, density: 60, speed: 70, brightness: 120, blendMode: "screen" } },
    { id: "scanner", name: "Scanner", description: "Gestsza i bardziej techniczna siatka.", settings: { opacity: 68, density: 95, speed: 110, brightness: 145, blendMode: "screen" } },
    { id: "violet", name: "Violet HUD", description: "HUD z przesunieciem w strone fioletu.", settings: { opacity: 58, density: 72, speed: 84, hue: 88, brightness: 140, blendMode: "screen" } },
  ],
  "floating-symbols": [
    { id: "soft", name: "Lekkie", description: "Malo symboli i lagodny ruch.", settings: { opacity: 46, density: 28, speed: 62, scale: 95, brightness: 110, blendMode: "screen" } },
    { id: "arcane", name: "Arcane", description: "Klasyczny magiczny wariant.", settings: { opacity: 72, density: 54, speed: 78, scale: 100, brightness: 125, blendMode: "screen" } },
    { id: "ritual", name: "Ritual", description: "Wiecej symboli i silniejsza poswiata.", settings: { opacity: 88, density: 100, speed: 120, scale: 110, brightness: 160, blendMode: "screen" } },
    { id: "dream", name: "Dream", description: "Jasniejszy, bardziej eteryczny wariant.", settings: { opacity: 82, density: 68, speed: 72, hue: 60, brightness: 155, blendMode: "screen" } },
  ],
  "smoke-wisps": [
    { id: "light", name: "Lekki dym", description: "Subtelne smugi dymu.", settings: { opacity: 30, density: 24, speed: 50, scale: 90, blur: 4, brightness: 100, blendMode: "screen" } },
    { id: "mist", name: "Mist", description: "Zbalansowane wispy dymu.", settings: { opacity: 50, density: 48, speed: 68, scale: 100, blur: 8, brightness: 110, blendMode: "screen" } },
    { id: "dense", name: "Gesty dym", description: "Bardziej widoczny i ciezszy dym.", settings: { opacity: 72, density: 88, speed: 84, scale: 110, blur: 12, brightness: 130, blendMode: "screen" } },
    { id: "toxic", name: "Toksyczny", description: "Zielonkawo-przesuniety dym.", settings: { opacity: 66, density: 64, speed: 72, scale: 105, hue: 120, blur: 10, brightness: 140, blendMode: "screen" } },
  ],
  "electric-arcs": [
    { id: "calm", name: "Spokojne", description: "Rzadkie przeskoki energii.", settings: { opacity: 46, density: 26, speed: 68, brightness: 120, blendMode: "screen" } },
    { id: "active", name: "Aktywne", description: "Widoczne luki energii.", settings: { opacity: 82, density: 55, speed: 110, brightness: 145, blendMode: "screen" } },
    { id: "storm", name: "Storm", description: "Bardzo szybkie i liczne wyadowania.", settings: { opacity: 96, density: 100, speed: 175, brightness: 180, blendMode: "screen" } },
    { id: "alien", name: "Alien", description: "Wyadowania z obca barwa.", settings: { opacity: 88, density: 72, speed: 120, hue: 95, brightness: 165, blendMode: "screen" } },
  ],
  "snow-burst": [
    { id: "light", name: "Lekki opad", description: "Spokojny i delikatny snieg.", settings: { opacity: 42, density: 28, speed: 52, scale: 90, brightness: 110, blendMode: "screen" } },
    { id: "winter", name: "Winter", description: "Zbalansowany efekt zimowy.", settings: { opacity: 72, density: 68, speed: 72, scale: 100, brightness: 125, blendMode: "screen" } },
    { id: "blizzard", name: "Blizzard", description: "Gestszy i szybszy snieg.", settings: { opacity: 92, density: 100, speed: 145, scale: 110, brightness: 150, blendMode: "screen" } },
    { id: "moonlit", name: "Moonlit", description: "Chlodniejszy nocny wariant sniegu.", settings: { opacity: 82, density: 75, speed: 86, scale: 105, hue: 15, brightness: 145, blendMode: "screen" } },
  ],
  "meteor-shower": [
    { id: "sparse", name: "Rzadkie meteory", description: "Niewiele smug na niebie.", settings: { opacity: 46, density: 22, speed: 72, scale: 90, brightness: 115, blendMode: "screen" } },
    { id: "night", name: "Nocne niebo", description: "Klasyczny deszcz meteorow.", settings: { opacity: 78, density: 42, speed: 100, scale: 100, brightness: 140, blendMode: "screen" } },
    { id: "peak", name: "Peak", description: "Maksimum roju meteorow.", settings: { opacity: 92, density: 100, speed: 155, scale: 112, brightness: 175, blendMode: "screen" } },
    { id: "cosmic", name: "Cosmic", description: "Bardziej kolorowy kosmiczny wariant.", settings: { opacity: 86, density: 62, speed: 118, scale: 105, hue: 72, brightness: 165, blendMode: "screen" } },
  ],
'@

# 1. Add new module definitions before the shared Pack 03 end marker.
$marker = "/* === EFFECTS_PACK_03_END === */"
$markerIndex = $currentEffects.IndexOf($marker)

if ($markerIndex -lt 0) {
  throw "Nie znaleziono miejsca na Effects Pack 05."
}

$withBlock = $currentEffects.Insert(
  $markerIndex,
  $pack05.Trim() + "`r`n`r`n"
)

# 2. Register the new modules after the last Pack 04 module.
$listNeedle = "    solarFlare,"
$listIndex = $withBlock.LastIndexOf($listNeedle)

if ($listIndex -lt 0) {
  throw "Nie znaleziono pozycji solarFlare w liscie effectModules."
}

$lineEnd = $withBlock.IndexOf("`n", $listIndex)

if ($lineEnd -lt 0) {
  throw "Nie znaleziono konca wiersza listy effectModules."
}

$withList = $withBlock.Insert(
  $lineEnd + 1,
  $moduleEntries.TrimEnd() + "`r`n"
)

# 3. Add four variants for every new effect.
$functionIndex = $currentVariants.IndexOf(
  "export function getEffectVariants"
)

if ($functionIndex -lt 0) {
  throw "Nie znaleziono konca katalogu wariantow."
}

$catalogClose = $currentVariants.LastIndexOf(
  "};",
  $functionIndex
)

if ($catalogClose -lt 0) {
  throw "Nie znaleziono zamkniecia effectVariantCatalog."
}

$withVariants = $currentVariants.Insert(
  $catalogClose,
  $variantEntries.Trim() + "`r`n"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $effectPath,
  $withList,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $variantsPath,
  $withVariants,
  $utf8NoBom
)

Push-Location $ProjectRoot

try {
  Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan
  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    throw "TypeScript check failed"
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Effects Pack 05 zainstalowany." -ForegroundColor Green
  Write-Host "Nowe efekty:"
  Write-Host "  Scanlines Plus"
  Write-Host "  Equalizer Bars"
  Write-Host "  HUD Grid"
  Write-Host "  Floating Symbols"
  Write-Host "  Smoke Wisps"
  Write-Host "  Electric Arcs"
  Write-Host "  Snow Burst"
  Write-Host "  Meteor Shower"
  Write-Host ""
  Write-Host "Razem: 49 efektow." -ForegroundColor Cyan
  Write-Host "Kazdy nowy efekt ma 4 warianty."
  Write-Host "Lacznie: 196 wariantow."
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $effectBackup $effectPath -Force
  Copy-Item $variantsBackup $variantsPath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
