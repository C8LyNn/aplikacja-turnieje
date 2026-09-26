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

if ($currentEffects.Contains("/* === EFFECTS_PACK_04_START === */")) {
  Write-Host "Effects Pack 04 jest juz zainstalowany." -ForegroundColor Yellow
  exit 0
}

if (!$currentEffects.Contains("/* === EFFECTS_PACK_03_END === */")) {
  throw "Nie wykryto Effects Pack 03. Nie nadpisuje plikow."
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
Write-Host "Animated Effects - Effects Pack 04" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$pack04 = @'
/* === EFFECTS_PACK_04_START === */

const hologramScanCss = `
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
`.trim();

const glitchBlocksCss = `
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
`.trim();

const hexGridCss = `
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
`.trim();

const portalRingsCss = `
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
`.trim();

const magicCircleCss = `
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
`.trim();

const crystalShardsCss = `
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
`.trim();

const steamVentsCss = `
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
`.trim();

const gearsCss = `
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
`.trim();

const cityLightsCss = `
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
`.trim();

const trafficTrailsCss = `
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
`.trim();

const vhsStaticCss = `
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
`.trim();

const solarFlareCss = `
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
`.trim();

const hologramScan: EffectModule = {
  definition: makeDefinition({
    id: "hologram-scan",
    name: "Hologram Scan",
    description: "Cyanowe pasma skanujace przesuwajace sie po ekranie.",
    category: "sci-fi",
    tags: ["hologram", "scan", "sci-fi", "cyan"],
    defaultSettings: { ...defaultSettings, opacity: 68, density: 45, speed: 80, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: hologramScanCss,
  streamElementsRendererName: "aeRenderHologramScan",
  renderPreview(layer, settings, random) {
    const count = particleCount(7, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("span");
      bar.className = "ae-hologram-scan";
      bar.style.top = `${-20 + random() * 30}%`;
      bar.style.setProperty("--ae-holo-height", `${1 + random() * 5}%`);
      bar.style.setProperty("--ae-holo-duration", `${(4 + random() * 4) / speed}s`);
      bar.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(bar);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(7, settings, 1); },
};

const glitchBlocks: EffectModule = {
  definition: makeDefinition({
    id: "glitch-blocks",
    name: "Glitch Blocks",
    description: "Cyfrowe prostokaty pojawiajace sie w losowych miejscach.",
    category: "tech",
    tags: ["glitch", "blocks", "digital", "tech"],
    defaultSettings: { ...defaultSettings, opacity: 62, density: 55, speed: 95, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: glitchBlocksCss,
  streamElementsRendererName: "aeRenderGlitchBlocks",
  renderPreview(layer, settings, random) {
    const count = particleCount(26, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const block = document.createElement("span");
      block.className = "ae-glitch-block";
      block.style.left = `${random() * 94}%`;
      block.style.top = `${random() * 94}%`;
      block.style.width = `${18 + random() * 150}px`;
      block.style.height = `${3 + random() * 28}px`;
      const glitchX = -45 + random() * 90;
      block.style.setProperty("--ae-glitch-x", `${glitchX}px`);
      block.style.setProperty("--ae-glitch-x2", `${-glitchX * .5}px`);
      block.style.animationDuration = `${(.8 + random() * 3.2) / speed}s`;
      block.style.animationDelay = `${-random() * 4}s`;
      layer.appendChild(block);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(26, settings, 1); },
};

const hexGrid: EffectModule = {
  definition: makeDefinition({
    id: "hex-grid",
    name: "Hex Grid",
    description: "Techniczna siatka szesciokatow przesuwajaca sie w tle.",
    category: "sci-fi",
    tags: ["hex", "grid", "sci-fi", "hud"],
    defaultSettings: { ...defaultSettings, opacity: 48, density: 50, speed: 45, blendMode: "screen" },
    performanceCost: 1,
    requiresJavaScript: true,
  }),
  css: hexGridCss,
  streamElementsRendererName: "aeRenderHexGrid",
  renderPreview(layer, settings) {
    const grid = document.createElement("span");
    grid.className = "ae-hex-grid";
    const size = Math.max(34, 96 - settings.density * .55);
    grid.style.setProperty("--ae-hex-w", `${size}px`);
    grid.style.setProperty("--ae-hex-h", `${size * 1.73}px`);
    grid.style.setProperty("--ae-hex-half", `${size * .5}px`);
    grid.style.setProperty("--ae-hex-half-y", `${size * .865}px`);
    grid.style.setProperty("--ae-hex-x2", `${size * 1.5}px`);
    grid.style.setProperty("--ae-hex-y2", `${size * 2.595}px`);
    grid.style.setProperty("--ae-hex-duration", `${14 / Math.max(.1, settings.speed / 100)}s`);
    layer.appendChild(grid);
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes() { return 1; },
};

const portalRings: EffectModule = {
  definition: makeDefinition({
    id: "portal-rings",
    name: "Portal Rings",
    description: "Koncentryczne neonowe pierscienie magicznego portalu.",
    category: "fantasy",
    tags: ["portal", "rings", "magic", "fantasy"],
    defaultSettings: { ...defaultSettings, opacity: 78, density: 60, speed: 65, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: portalRingsCss,
  streamElementsRendererName: "aeRenderPortalRings",
  renderPreview(layer, settings, random) {
    const count = particleCount(7, settings, 2);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const ring = document.createElement("span");
      ring.className = "ae-portal-ring";
      const size = 110 + i * 42 + random() * 18;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.setProperty("--ae-portal-duration", `${(7 + random() * 8) / speed}s`);
      ring.style.animationDirection = i % 2 === 0 ? "normal" : "reverse";
      ring.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(ring);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(7, settings, 2); },
};

const magicCircle: EffectModule = {
  definition: makeDefinition({
    id: "magic-circle",
    name: "Magic Circle",
    description: "Obracajace sie okregi i segmenty magicznego sigilu.",
    category: "fantasy",
    tags: ["magic", "circle", "sigil", "fantasy"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 55, speed: 45, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: magicCircleCss,
  streamElementsRendererName: "aeRenderMagicCircle",
  renderPreview(layer, settings, random) {
    const count = particleCount(5, settings, 2);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const circle = document.createElement("span");
      circle.className = "ae-magic-circle";
      const size = 150 + i * 48 + random() * 22;
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.setProperty("--ae-circle-duration", `${(11 + random() * 10) / speed}s`);
      circle.style.animationDirection = i % 2 === 0 ? "normal" : "reverse";
      layer.appendChild(circle);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(5, settings, 2); },
};

const crystalShards: EffectModule = {
  definition: makeDefinition({
    id: "crystal-shards",
    name: "Crystal Shards",
    description: "Lekkie, swiecace odlamki krysztalow unoszace sie w przestrzeni.",
    category: "fantasy",
    tags: ["crystal", "shards", "fantasy", "glow"],
    defaultSettings: { ...defaultSettings, opacity: 70, density: 55, speed: 60, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: crystalShardsCss,
  streamElementsRendererName: "aeRenderCrystalShards",
  renderPreview(layer, settings, random) {
    const count = particleCount(24, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const shard = document.createElement("span");
      shard.className = "ae-crystal-shard";
      const width = 6 + random() * 18;
      const height = width * (1.8 + random());
      shard.style.left = `${random() * 96}%`;
      shard.style.top = `${random() * 94}%`;
      shard.style.width = `${width}px`;
      shard.style.height = `${height}px`;
      shard.style.setProperty("--ae-crystal-x", `${-48 + random() * 96}px`);
      shard.style.setProperty("--ae-crystal-duration", `${(8 + random() * 10) / speed}s`);
      shard.style.animationDelay = `${-random() * 12}s`;
      layer.appendChild(shard);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(24, settings, 1); },
};

const steamVents: EffectModule = {
  definition: makeDefinition({
    id: "steam-vents",
    name: "Steam Vents",
    description: "Kleby pary unoszace sie od dolnej krawedzi.",
    category: "steampunk",
    tags: ["steam", "vents", "steampunk", "smoke"],
    defaultSettings: { ...defaultSettings, opacity: 55, density: 50, speed: 55, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: steamVentsCss,
  streamElementsRendererName: "aeRenderSteamVents",
  renderPreview(layer, settings, random) {
    const count = particleCount(16, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const puff = document.createElement("span");
      puff.className = "ae-steam-puff";
      const size = 55 + random() * 120;
      puff.style.left = `${random() * 94}%`;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;
      puff.style.setProperty("--ae-steam-x", `${-65 + random() * 130}px`);
      puff.style.setProperty("--ae-steam-duration", `${(7 + random() * 8) / speed}s`);
      puff.style.animationDelay = `${-random() * 10}s`;
      layer.appendChild(puff);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(16, settings, 1); },
};

const gears: EffectModule = {
  definition: makeDefinition({
    id: "gears",
    name: "Gears",
    description: "Obracajace sie mosiezne kola zebate w stylu steampunk.",
    category: "steampunk",
    tags: ["gears", "cogs", "steampunk", "mechanical"],
    defaultSettings: { ...defaultSettings, opacity: 62, density: 45, speed: 55, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: gearsCss,
  streamElementsRendererName: "aeRenderGears",
  renderPreview(layer, settings, random) {
    const count = particleCount(9, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const gear = document.createElement("span");
      gear.className = "ae-gear";
      const size = 45 + random() * 130;
      gear.style.left = `${random() * 88}%`;
      gear.style.top = `${random() * 84}%`;
      gear.style.width = `${size}px`;
      gear.style.height = `${size}px`;
      gear.style.setProperty("--ae-gear-duration", `${(8 + random() * 16) / speed}s`);
      gear.style.setProperty("--ae-gear-rot", i % 2 === 0 ? "360deg" : "-360deg");
      layer.appendChild(gear);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(9, settings, 1); },
};

const cityLights: EffectModule = {
  definition: makeDefinition({
    id: "city-lights",
    name: "City Lights",
    description: "Migoczace swiatla nocnego miasta.",
    category: "urban",
    tags: ["city", "lights", "urban", "night"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 65, speed: 45, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: cityLightsCss,
  streamElementsRendererName: "aeRenderCityLights",
  renderPreview(layer, settings, random) {
    const count = particleCount(48, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const light = document.createElement("span");
      light.className = "ae-city-light";
      light.style.left = `${random() * 98}%`;
      light.style.top = `${45 + random() * 52}%`;
      light.style.width = `${2 + random() * 7}px`;
      light.style.height = `${2 + random() * 10}px`;
      light.style.setProperty("--ae-city-duration", `${(2 + random() * 6) / speed}s`);
      light.style.animationDelay = `${-random() * 7}s`;
      layer.appendChild(light);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(48, settings, 1); },
};

const trafficTrails: EffectModule = {
  definition: makeDefinition({
    id: "traffic-trails",
    name: "Traffic Trails",
    description: "Smugi swiatel samochodow przecinajace dol ekranu.",
    category: "urban",
    tags: ["traffic", "trails", "urban", "lights"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 50, speed: 90, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: trafficTrailsCss,
  streamElementsRendererName: "aeRenderTrafficTrails",
  renderPreview(layer, settings, random) {
    const count = particleCount(14, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const trail = document.createElement("span");
      trail.className = "ae-traffic-trail";
      trail.style.top = `${55 + random() * 40}%`;
      trail.style.setProperty("--ae-trail-width", `${12 + random() * 28}%`);
      trail.style.setProperty("--ae-traffic-duration", `${(3 + random() * 5) / speed}s`);
      trail.style.animationDelay = `${-random() * 8}s`;
      layer.appendChild(trail);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(14, settings, 1); },
};

const vhsStatic: EffectModule = {
  definition: makeDefinition({
    id: "vhs-static",
    name: "VHS Static",
    description: "Pasiaste zaklocenia i analogowe przeskoki obrazu.",
    category: "retro",
    tags: ["vhs", "static", "retro", "glitch"],
    defaultSettings: { ...defaultSettings, opacity: 48, density: 55, speed: 95, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: vhsStaticCss,
  streamElementsRendererName: "aeRenderVhsStatic",
  renderPreview(layer, settings, random) {
    const count = particleCount(12, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const band = document.createElement("span");
      band.className = "ae-vhs-band";
      band.style.top = `${random() * 96}%`;
      band.style.height = `${2 + random() * 18}px`;
      band.style.setProperty("--ae-vhs-duration", `${(.8 + random() * 3) / speed}s`);
      band.style.animationDelay = `${-random() * 4}s`;
      layer.appendChild(band);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(12, settings, 1); },
};

const solarFlare: EffectModule = {
  definition: makeDefinition({
    id: "solar-flare",
    name: "Solar Flare",
    description: "Pomara\u0144czowe luki i rozblyski przypominajace protuberancje sloneczne.",
    category: "solar",
    tags: ["solar", "flare", "sun", "energy"],
    defaultSettings: { ...defaultSettings, opacity: 70, density: 50, speed: 60, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: solarFlareCss,
  streamElementsRendererName: "aeRenderSolarFlare",
  renderPreview(layer, settings, random) {
    const count = particleCount(11, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const flare = document.createElement("span");
      flare.className = "ae-solar-flare";
      const size = 55 + random() * 150;
      flare.style.left = `${random() * 92}%`;
      flare.style.top = `${random() * 88}%`;
      flare.style.width = `${size}px`;
      flare.style.height = `${size * (.45 + random() * .45)}px`;
      flare.style.setProperty("--ae-solar-duration", `${(6 + random() * 8) / speed}s`);
      flare.style.animationDelay = `${-random() * 9}s`;
      layer.appendChild(flare);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(11, settings, 1); },
};

/* === EFFECTS_PACK_04_END === */
'@

$moduleEntries = @'
    hologramScan,
    glitchBlocks,
    hexGrid,
    portalRings,
    magicCircle,
    crystalShards,
    steamVents,
    gears,
    cityLights,
    trafficTrails,
    vhsStatic,
    solarFlare,
'@

$variantEntries = @'
"hologram-scan": [
    {
      id: "subtle",
      name: "Subtelny skan",
      description: "Rzadkie i spokojne pasma hologramu.",
      settings: {
        opacity: 42,
        density: 28,
        speed: 55,
        scale: 100,
        brightness: 105,
        blendMode: "screen",
      },
    },
    {
      id: "tactical",
      name: "Taktyczny",
      description: "Czytelny skan HUD o umiarkowanym tempie.",
      settings: {
        opacity: 68,
        density: 48,
        speed: 85,
        scale: 100,
        brightness: 125,
        blendMode: "screen",
      },
    },
    {
      id: "intense",
      name: "Intensywny",
      description: "Gesty i szybki skan calego ekranu.",
      settings: {
        opacity: 88,
        density: 92,
        speed: 155,
        scale: 105,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "violet",
      name: "Fioletowy",
      description: "Holograficzny skan przesuniety w fiolet.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 95,
        hue: 92,
        brightness: 140,
        blendMode: "screen",
      },
    },
  ],
  "glitch-blocks": [
    {
      id: "sparse",
      name: "Rzadkie zaklocenia",
      description: "Pojedyncze cyfrowe przeskoki.",
      settings: {
        opacity: 42,
        density: 24,
        speed: 65,
        scale: 85,
        brightness: 110,
      },
    },
    {
      id: "digital",
      name: "Digital",
      description: "Zbalansowane cyfrowe prostokaty.",
      settings: {
        opacity: 62,
        density: 55,
        speed: 95,
        scale: 100,
        brightness: 125,
        blendMode: "screen",
      },
    },
    {
      id: "corrupted",
      name: "Corrupted",
      description: "Gesty, agresywny glitch.",
      settings: {
        opacity: 86,
        density: 100,
        speed: 180,
        scale: 115,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "chromatic",
      name: "Chromatyczny",
      description: "Kolorowy glitch z mocnym przesunieciem barwy.",
      settings: {
        opacity: 76,
        density: 72,
        speed: 125,
        scale: 100,
        hue: 120,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "hex-grid": [
    {
      id: "fine",
      name: "Drobna siatka",
      description: "Delikatna, drobna struktura hex.",
      settings: {
        opacity: 32,
        density: 78,
        speed: 30,
        scale: 90,
        brightness: 100,
      },
    },
    {
      id: "tactical",
      name: "Taktyczna",
      description: "Czytelna siatka interfejsu sci-fi.",
      settings: {
        opacity: 50,
        density: 52,
        speed: 50,
        scale: 100,
        brightness: 120,
        blendMode: "screen",
      },
    },
    {
      id: "large",
      name: "Duza siatka",
      description: "Wieksze i spokojniejsze komorki.",
      settings: {
        opacity: 44,
        density: 25,
        speed: 35,
        scale: 125,
        brightness: 115,
      },
    },
    {
      id: "neon",
      name: "Neon",
      description: "Jasna cyberpunkowa siatka.",
      settings: {
        opacity: 72,
        density: 62,
        speed: 75,
        hue: 75,
        brightness: 165,
        blendMode: "screen",
      },
    },
  ],
  "portal-rings": [
    {
      id: "calm",
      name: "Spokojny portal",
      description: "Powolne i subtelne pierscienie.",
      settings: {
        opacity: 52,
        density: 35,
        speed: 35,
        scale: 90,
        brightness: 110,
      },
    },
    {
      id: "arcane",
      name: "Arkaniczny",
      description: "Klasyczny magiczny portal.",
      settings: {
        opacity: 78,
        density: 62,
        speed: 65,
        scale: 100,
        brightness: 140,
        blendMode: "screen",
      },
    },
    {
      id: "unstable",
      name: "Niestabilny",
      description: "Gesty i szybko wirujacy portal.",
      settings: {
        opacity: 92,
        density: 100,
        speed: 145,
        scale: 112,
        brightness: 175,
        blendMode: "screen",
      },
    },
    {
      id: "void",
      name: "Void",
      description: "Ciemniejszy portal o zmienionej barwie.",
      settings: {
        opacity: 84,
        density: 70,
        speed: 78,
        scale: 105,
        hue: 145,
        brightness: 125,
        blendMode: "screen",
      },
    },
  ],
  "magic-circle": [
    {
      id: "subtle",
      name: "Subtelny sigil",
      description: "Lekki i powolny magiczny okrag.",
      settings: {
        opacity: 44,
        density: 32,
        speed: 28,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "ritual",
      name: "Rytual",
      description: "Zbalansowany okrag rytualny.",
      settings: {
        opacity: 72,
        density: 58,
        speed: 48,
        scale: 100,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "grand",
      name: "Wielki sigil",
      description: "Duzy, jasny i gesty wzor.",
      settings: {
        opacity: 90,
        density: 96,
        speed: 62,
        scale: 135,
        brightness: 175,
        blendMode: "screen",
      },
    },
    {
      id: "forbidden",
      name: "Zakazany",
      description: "Ciemniejszy i bardziej zlowrogi wariant.",
      settings: {
        opacity: 82,
        density: 72,
        speed: 75,
        scale: 108,
        hue: 120,
        brightness: 135,
        blendMode: "screen",
      },
    },
  ],
  "crystal-shards": [
    {
      id: "sparse",
      name: "Rzadkie odlamki",
      description: "Kilka spokojnie unoszacych sie krysztalow.",
      settings: {
        opacity: 48,
        density: 28,
        speed: 42,
        scale: 85,
        brightness: 115,
      },
    },
    {
      id: "prism",
      name: "Pryzmat",
      description: "Jasne odlamki o mocnym polysku.",
      settings: {
        opacity: 72,
        density: 55,
        speed: 62,
        scale: 100,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "storm",
      name: "Krysztalowa burza",
      description: "Duza liczba szybko poruszajacych sie odlamkow.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 145,
        scale: 92,
        brightness: 165,
        blendMode: "screen",
      },
    },
    {
      id: "giant",
      name: "Wielkie odlamki",
      description: "Mniej elementow, ale znacznie wiekszych.",
      settings: {
        opacity: 78,
        density: 38,
        speed: 48,
        scale: 170,
        brightness: 145,
        blur: 1,
        blendMode: "screen",
      },
    },
  ],
  "steam-vents": [
    {
      id: "gentle",
      name: "Lekka para",
      description: "Subtelne kleby pary.",
      settings: {
        opacity: 38,
        density: 30,
        speed: 42,
        scale: 95,
        blur: 2,
        brightness: 105,
      },
    },
    {
      id: "factory",
      name: "Fabryka",
      description: "Regularne, gestsze wyrzuty pary.",
      settings: {
        opacity: 58,
        density: 62,
        speed: 62,
        scale: 110,
        blur: 3,
        brightness: 115,
      },
    },
    {
      id: "burst",
      name: "Wyrzut",
      description: "Szybka i intensywna para.",
      settings: {
        opacity: 76,
        density: 92,
        speed: 145,
        scale: 120,
        blur: 2,
        brightness: 130,
        blendMode: "screen",
      },
    },
    {
      id: "ghost",
      name: "Widmowa para",
      description: "Chlodny, lekko kolorowy wariant.",
      settings: {
        opacity: 52,
        density: 52,
        speed: 48,
        scale: 125,
        hue: 155,
        blur: 4,
        brightness: 135,
        blendMode: "screen",
      },
    },
  ],
  "gears": [
    {
      id: "clockwork",
      name: "Mechanizm",
      description: "Spokojnie obracajace sie kola zebate.",
      settings: {
        opacity: 52,
        density: 38,
        speed: 42,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "brass",
      name: "Mosiadz",
      description: "Klasyczny steampunkowy zestaw kol.",
      settings: {
        opacity: 66,
        density: 55,
        speed: 58,
        scale: 100,
        brightness: 125,
        blendMode: "screen",
      },
    },
    {
      id: "heavy",
      name: "Ciezka maszyna",
      description: "Duze i wolniejsze kola zebate.",
      settings: {
        opacity: 76,
        density: 35,
        speed: 28,
        scale: 165,
        brightness: 115,
      },
    },
    {
      id: "overdrive",
      name: "Overdrive",
      description: "Gesty i szybko pracujacy mechanizm.",
      settings: {
        opacity: 82,
        density: 100,
        speed: 160,
        scale: 88,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "city-lights": [
    {
      id: "distant",
      name: "Odlegle miasto",
      description: "Rzadkie, subtelne punkty swiatla.",
      settings: {
        opacity: 42,
        density: 28,
        speed: 35,
        scale: 85,
        brightness: 105,
      },
    },
    {
      id: "night",
      name: "Nocne miasto",
      description: "Zbalansowane miejskie swiatla.",
      settings: {
        opacity: 72,
        density: 65,
        speed: 48,
        scale: 100,
        brightness: 125,
        blendMode: "screen",
      },
    },
    {
      id: "dense",
      name: "Centrum",
      description: "Gesty, jasny krajobraz miejski.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 65,
        scale: 105,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "neon",
      name: "Neon City",
      description: "Kolorowy wariant inspirowany cyberpunkiem.",
      settings: {
        opacity: 82,
        density: 78,
        speed: 58,
        hue: 95,
        brightness: 165,
        blendMode: "screen",
      },
    },
  ],
  "traffic-trails": [
    {
      id: "slow",
      name: "Nocna ulica",
      description: "Rzadkie i wolne smugi swiatel.",
      settings: {
        opacity: 48,
        density: 28,
        speed: 48,
        scale: 90,
        brightness: 110,
      },
    },
    {
      id: "highway",
      name: "Autostrada",
      description: "Zbalansowany ruch swietlny.",
      settings: {
        opacity: 72,
        density: 55,
        speed: 95,
        scale: 100,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "rush",
      name: "Rush Hour",
      description: "Gesty i bardzo szybki ruch.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 175,
        scale: 105,
        brightness: 160,
        blendMode: "screen",
      },
    },
    {
      id: "synthwave",
      name: "Synthwave",
      description: "Fioletowo-neonowy wariant smug.",
      settings: {
        opacity: 80,
        density: 70,
        speed: 120,
        hue: 110,
        brightness: 160,
        blendMode: "screen",
      },
    },
  ],
  "vhs-static": [
    {
      id: "soft",
      name: "Lekka tasma",
      description: "Subtelne analogowe zaklocenia.",
      settings: {
        opacity: 28,
        density: 28,
        speed: 55,
        scale: 100,
        brightness: 100,
      },
    },
    {
      id: "tape",
      name: "VHS",
      description: "Klasyczne pasy starej kasety.",
      settings: {
        opacity: 50,
        density: 58,
        speed: 95,
        scale: 100,
        brightness: 120,
        blendMode: "screen",
      },
    },
    {
      id: "damaged",
      name: "Uszkodzona tasma",
      description: "Mocne, szybkie zaklocenia obrazu.",
      settings: {
        opacity: 82,
        density: 100,
        speed: 180,
        scale: 105,
        brightness: 150,
        blendMode: "screen",
      },
    },
    {
      id: "chromatic",
      name: "RGB Shift",
      description: "Kolorowe analogowe zaklocenia.",
      settings: {
        opacity: 68,
        density: 75,
        speed: 125,
        hue: 105,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "solar-flare": [
    {
      id: "corona",
      name: "Korona",
      description: "Delikatne luki slonecznej plazmy.",
      settings: {
        opacity: 48,
        density: 30,
        speed: 38,
        scale: 95,
        brightness: 120,
      },
    },
    {
      id: "active",
      name: "Aktywne slonce",
      description: "Zbalansowane protuberancje.",
      settings: {
        opacity: 72,
        density: 55,
        speed: 62,
        scale: 105,
        brightness: 145,
        blendMode: "screen",
      },
    },
    {
      id: "eruption",
      name: "Erupcja",
      description: "Gesty i bardzo jasny rozblysk.",
      settings: {
        opacity: 94,
        density: 100,
        speed: 135,
        scale: 120,
        brightness: 190,
        blendMode: "screen",
      },
    },
    {
      id: "alien",
      name: "Obce slonce",
      description: "Przesunieta barwa daje nietypowa gwiazde.",
      settings: {
        opacity: 84,
        density: 72,
        speed: 78,
        scale: 112,
        hue: 125,
        brightness: 165,
        blendMode: "screen",
      },
    },
  ],
'@

# 1. Add CSS + module definitions before the Pack 03 end marker.
$marker = "/* === EFFECTS_PACK_03_END === */"
$markerIndex = $currentEffects.IndexOf($marker)

if ($markerIndex -lt 0) {
  throw "Nie znaleziono miejsca na Effects Pack 04."
}

$withBlock = $currentEffects.Insert(
  $markerIndex,
  $pack04.Trim() + "`r`n`r`n"
)

# 2. Add the new modules to the exported module list after Aurora.
$listNeedle = "    aurora,"
$listIndex = $withBlock.LastIndexOf($listNeedle)

if ($listIndex -lt 0) {
  throw "Nie znaleziono pozycji Aurora w liscie effectModules."
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
  Write-Host "Effects Pack 04 zainstalowany." -ForegroundColor Green
  Write-Host "Nowe efekty:"
  Write-Host "  Hologram Scan"
  Write-Host "  Glitch Blocks"
  Write-Host "  Hex Grid"
  Write-Host "  Portal Rings"
  Write-Host "  Magic Circle"
  Write-Host "  Crystal Shards"
  Write-Host "  Steam Vents"
  Write-Host "  Gears"
  Write-Host "  City Lights"
  Write-Host "  Traffic Trails"
  Write-Host "  VHS Static"
  Write-Host "  Solar Flare"
  Write-Host ""
  Write-Host "Razem: 41 efektow." -ForegroundColor Cyan
  Write-Host "Kazdy nowy efekt ma 4 warianty."
  Write-Host "Lacznie: 164 warianty."
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
