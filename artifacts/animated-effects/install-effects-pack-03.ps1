param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$effectPath = Join-Path $ProjectRoot "src\effects\effectModules.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $effectPath) -or
  !(Test-Path $stylePath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$effectContent =
  [System.IO.File]::ReadAllText($effectPath)

$styleContent =
  [System.IO.File]::ReadAllText($stylePath)

if (
  $effectContent.Contains(
    "/* === EFFECTS_PACK_03_START === */"
  )
) {
  Write-Host "Effects Pack 03 jest juz zainstalowany." -ForegroundColor Yellow
  exit 0
}

if (
  !$effectContent.Contains(
    "/* === EFFECTS_PACK_02_START === */"
  )
) {
  throw "Najpierw zainstaluj Effects Pack 02."
}

if (
  !$effectContent.Contains(
    'const sparks: EffectModule'
  )
) {
  throw "Nie rozpoznaje aktualnej wersji effectModules.ts."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot =
  Join-Path $ProjectRoot ".animated-effects-backup\$stamp"

$effectBackup =
  Join-Path $backupRoot "src\effects\effectModules.ts"

$styleBackup =
  Join-Path $backupRoot "src\style.css"

New-Item -ItemType Directory -Force -Path (
  Split-Path $effectBackup -Parent
) | Out-Null

New-Item -ItemType Directory -Force -Path (
  Split-Path $styleBackup -Parent
) | Out-Null

Copy-Item $effectPath $effectBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Effects Pack 03" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$newBlock = @'
/* === EFFECTS_PACK_03_START === */

const plasmaCss = `
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
`.trim();

const energyWavesCss = `
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
`.trim();

const runesCss = `
.ae-rune {
  position: absolute;
  color: rgba(170,120,255,.95);
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 700;
  text-shadow:
    0 0 8px rgba(180,120,255,.95),
    0 0 22px rgba(90,210,255,.55);
  animation: ae-rune-float 9s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ae-rune-float {
  0%,100% { transform: translate(0,0) rotate(-8deg) scale(.85); opacity:.25; }
  50% { transform: translate(var(--ae-rune-x,24px),var(--ae-rune-y,-34px)) rotate(12deg) scale(1.12); opacity:1; }
}
`.trim();

const magicDustCss = `
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
`.trim();

const laserGridCss = `
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
`.trim();

const scanlinesCss = `
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
`.trim();

const pongCss = `
.ae-pong-paddle,
.ae-pong-ball {
  position: absolute;
  background: rgba(235,250,255,.95);
  box-shadow:
    0 0 8px rgba(120,235,255,.95),
    0 0 20px rgba(120,120,255,.6);
}
.ae-pong-paddle {
  width: 8px;
  height: 24%;
  top: 38%;
  border-radius: 5px;
  animation: ae-pong-paddle 3.2s ease-in-out infinite alternate;
}
.ae-pong-paddle.left { left: 7%; }
.ae-pong-paddle.right { right: 7%; animation-delay: -1.1s; }
.ae-pong-ball {
  width: 14px;
  height: 14px;
  left: 50%;
  top: 50%;
  border-radius: 3px;
  animation: ae-pong-ball 4.2s linear infinite;
}
@keyframes ae-pong-paddle {
  from { transform: translateY(-18vh); }
  to { transform: translateY(18vh); }
}
@keyframes ae-pong-ball {
  0% { transform: translate(-42vw,-28vh); }
  24% { transform: translate(40vw,22vh); }
  48% { transform: translate(-38vw,30vh); }
  72% { transform: translate(36vw,-25vh); }
  100% { transform: translate(-42vw,-28vh); }
}
`.trim();

const bubblesCss = `
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
`.trim();

const firefliesCss = `
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
`.trim();

const confettiCss = `
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
`.trim();

const dustMotesCss = `
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
`.trim();

const auroraCss = `
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
`.trim();

const plasma: EffectModule = {
  definition: makeDefinition({
    id: "plasma",
    name: "Plasma",
    description: "Pulsujące obłoki plazmy i neonowej energii.",
    category: "energy",
    tags: ["plasma", "energy", "glow", "abstract"],
    defaultSettings: { ...defaultSettings, opacity: 80, density: 45, speed: 65, blendMode: "screen" },
    performanceCost: 3,
    requiresJavaScript: true,
  }),
  css: plasmaCss,
  streamElementsRendererName: "aeRenderPlasma",
  renderPreview(layer, settings, random) {
    const count = particleCount(9, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const blob = document.createElement("span");
      blob.className = "ae-plasma-blob";
      const size = 70 + random() * 150;
      blob.style.left = `${random() * 90}%`;
      blob.style.top = `${random() * 85}%`;
      blob.style.width = `${size}px`;
      blob.style.height = `${size}px`;
      blob.style.animationDelay = `${-random() * 8}s`;
      blob.style.animationDuration = `${(6 + random() * 8) / speed}s`;
      blob.style.setProperty("--ae-plasma-x", `${-90 + random() * 180}px`);
      blob.style.setProperty("--ae-plasma-y", `${-70 + random() * 140}px`);
      layer.appendChild(blob);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(9, settings, 1); },
};

const energyWaves: EffectModule = {
  definition: makeDefinition({
    id: "energy-waves",
    name: "Energy Waves",
    description: "Rozchodzące się neonowe fale energii.",
    category: "energy",
    tags: ["energy", "waves", "rings", "pulse"],
    defaultSettings: { ...defaultSettings, opacity: 82, density: 45, speed: 85, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: energyWavesCss,
  streamElementsRendererName: "aeRenderEnergyWaves",
  renderPreview(layer, settings, random) {
    const count = particleCount(7, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const wave = document.createElement("span");
      wave.className = "ae-energy-wave";
      wave.style.left = `${35 + random() * 30}%`;
      wave.style.top = `${35 + random() * 30}%`;
      wave.style.animationDelay = `${-(i / count) * 5}s`;
      wave.style.animationDuration = `${5 / speed}s`;
      layer.appendChild(wave);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(7, settings, 1); },
};

const runes: EffectModule = {
  definition: makeDefinition({
    id: "runes",
    name: "Runes",
    description: "Świecące symbole i runy unoszące się w tle.",
    category: "fantasy",
    tags: ["runes", "magic", "fantasy", "symbols"],
    defaultSettings: { ...defaultSettings, opacity: 78, density: 50, speed: 55, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: runesCss,
  streamElementsRendererName: "aeRenderRunes",
  renderPreview(layer, settings, random) {
    const chars = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᛉ","ᛟ"];
    const count = particleCount(24, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const rune = document.createElement("span");
      rune.className = "ae-rune";
      rune.textContent = chars[Math.floor(random() * chars.length)] ?? "ᚠ";
      rune.style.left = `${random() * 95}%`;
      rune.style.top = `${random() * 92}%`;
      rune.style.fontSize = `${18 + random() * 36}px`;
      rune.style.animationDelay = `${-random() * 9}s`;
      rune.style.animationDuration = `${(6 + random() * 7) / speed}s`;
      rune.style.setProperty("--ae-rune-x", `${-45 + random() * 90}px`);
      rune.style.setProperty("--ae-rune-y", `${-55 + random() * 110}px`);
      layer.appendChild(rune);
    }
  },
  streamElementsRendererSource: `
function aeRenderRunes(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const chars = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᛉ","ᛟ"];
  const count = Math.max(1, Math.round(24 * (s.density / 100)));
  const speed = Math.max(.1, s.speed / 100);
  for (let i = 0; i < count; i++) {
    const rune = document.createElement("span");
    rune.className = "ae-rune";
    rune.textContent = chars[Math.floor(random() * chars.length)] || "ᚠ";
    rune.style.left = random() * 95 + "%";
    rune.style.top = random() * 92 + "%";
    rune.style.fontSize = (18 + random() * 36) + "px";
    rune.style.animationDelay = -random() * 9 + "s";
    rune.style.animationDuration = ((6 + random() * 7) / speed) + "s";
    rune.style.setProperty("--ae-rune-x", (-45 + random() * 90) + "px");
    rune.style.setProperty("--ae-rune-y", (-55 + random() * 110) + "px");
    layer.appendChild(rune);
  }
}
`.trim(),
  estimateDomNodes(settings) { return particleCount(24, settings, 1); },
};

const magicDust: EffectModule = {
  definition: makeDefinition({
    id: "magic-dust",
    name: "Magic Dust",
    description: "Migoczący magiczny pył i drobne iskierki.",
    category: "fantasy",
    tags: ["magic", "dust", "sparkle", "fantasy"],
    defaultSettings: { ...defaultSettings, opacity: 86, density: 65, speed: 58, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: magicDustCss,
  streamElementsRendererName: "aeRenderMagicDust",
  renderPreview(layer, settings, random) {
    const count = particleCount(70, settings);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const dust = document.createElement("span");
      dust.className = "ae-magic-dust";
      const size = 1.5 + random() * 4.5;
      dust.style.left = `${random() * 100}%`;
      dust.style.top = `${random() * 100}%`;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      dust.style.animationDelay = `${-random() * 7}s`;
      dust.style.animationDuration = `${(4 + random() * 7) / speed}s`;
      dust.style.setProperty("--ae-dust-x", `${-40 + random() * 80}px`);
      dust.style.setProperty("--ae-dust-y", `${-60 + random() * 120}px`);
      layer.appendChild(dust);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(70, settings); },
};

const laserGrid: EffectModule = {
  definition: makeDefinition({
    id: "laser-grid",
    name: "Laser Grid",
    description: "Perspektywiczna neonowa siatka w stylu synthwave.",
    category: "sci-fi",
    tags: ["laser", "grid", "synthwave", "cyber"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 55, speed: 80, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: laserGridCss,
  streamElementsRendererName: "aeRenderLaserGrid",
  renderPreview(layer, settings) {
    const grid = document.createElement("span");
    grid.className = "ae-laser-grid";
    const gridSize = Math.max(20, 92 - settings.density * .65);
    grid.style.setProperty("--ae-grid-size", `${gridSize}px`);
    grid.style.animationDuration = `${5 / Math.max(.1, settings.speed / 100)}s`;
    layer.appendChild(grid);
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes() { return 1; },
};

const scanlines: EffectModule = {
  definition: makeDefinition({
    id: "scanlines",
    name: "Retro Scanlines",
    description: "Animowane linie kineskopowe CRT.",
    category: "retro",
    tags: ["retro", "crt", "scanlines", "arcade"],
    defaultSettings: { ...defaultSettings, opacity: 55, density: 60, speed: 100, blendMode: "overlay" },
    performanceCost: 1,
    requiresJavaScript: true,
  }),
  css: scanlinesCss,
  streamElementsRendererName: "aeRenderScanlines",
  renderPreview(layer, settings) {
    const scan = document.createElement("span");
    scan.className = "ae-scanlines";
    const gap = Math.max(3, 12 - settings.density * .08);
    scan.style.setProperty("--ae-scan-gap", `${gap}px`);
    scan.style.animationDuration = `${1.8 / Math.max(.1, settings.speed / 100)}s`;
    layer.appendChild(scan);
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes() { return 1; },
};

const pong: EffectModule = {
  definition: makeDefinition({
    id: "pong",
    name: "Retro Pong",
    description: "Minimalistyczny Pong jako animowane tło retro.",
    category: "retro",
    tags: ["pong", "retro", "arcade", "game"],
    defaultSettings: { ...defaultSettings, opacity: 82, density: 50, speed: 90, blendMode: "screen" },
    performanceCost: 1,
    requiresJavaScript: true,
  }),
  css: pongCss,
  streamElementsRendererName: "aeRenderPong",
  renderPreview(layer, settings) {
    const speed = Math.max(.1, settings.speed / 100);
    const left = document.createElement("span");
    const right = document.createElement("span");
    const ball = document.createElement("span");
    left.className = "ae-pong-paddle left";
    right.className = "ae-pong-paddle right";
    ball.className = "ae-pong-ball";
    left.style.animationDuration = `${3.2 / speed}s`;
    right.style.animationDuration = `${3.2 / speed}s`;
    ball.style.animationDuration = `${4.2 / speed}s`;
    layer.append(left, right, ball);
  },
  streamElementsRendererSource: `
function aeRenderPong(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const speed = Math.max(.1, effect.settings.speed / 100);
  const left = document.createElement("span");
  const right = document.createElement("span");
  const ball = document.createElement("span");
  left.className = "ae-pong-paddle left";
  right.className = "ae-pong-paddle right";
  ball.className = "ae-pong-ball";
  left.style.animationDuration = (3.2 / speed) + "s";
  right.style.animationDuration = (3.2 / speed) + "s";
  ball.style.animationDuration = (4.2 / speed) + "s";
  layer.append(left, right, ball);
}
`.trim(),
  estimateDomNodes() { return 3; },
};

const bubbles: EffectModule = {
  definition: makeDefinition({
    id: "bubbles",
    name: "Bubbles",
    description: "Przezroczyste bąbelki unoszące się ku górze.",
    category: "calm",
    tags: ["bubbles", "water", "calm", "float"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 52, speed: 58, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: bubblesCss,
  streamElementsRendererName: "aeRenderBubbles",
  renderPreview(layer, settings, random) {
    const count = particleCount(32, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement("span");
      bubble.className = "ae-bubble";
      const size = 12 + random() * 48;
      bubble.style.left = `${random() * 100}%`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.animationDelay = `${-random() * 10}s`;
      bubble.style.animationDuration = `${(7 + random() * 8) / speed}s`;
      bubble.style.setProperty("--ae-bubble-drift", `${-65 + random() * 130}px`);
      layer.appendChild(bubble);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(32, settings, 1); },
};

const fireflies: EffectModule = {
  definition: makeDefinition({
    id: "fireflies",
    name: "Fireflies",
    description: "Migoczące świetliki poruszające się w ciemności.",
    category: "botanical",
    tags: ["fireflies", "nature", "glow", "night"],
    defaultSettings: { ...defaultSettings, opacity: 84, density: 48, speed: 55, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: firefliesCss,
  streamElementsRendererName: "aeRenderFireflies",
  renderPreview(layer, settings, random) {
    const count = particleCount(38, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const fly = document.createElement("span");
      fly.className = "ae-firefly";
      const size = 2 + random() * 5;
      fly.style.left = `${random() * 100}%`;
      fly.style.top = `${random() * 100}%`;
      fly.style.width = `${size}px`;
      fly.style.height = `${size}px`;
      fly.style.animationDelay = `${-random() * 8}s`;
      fly.style.animationDuration = `${(4 + random() * 7) / speed}s`;
      fly.style.setProperty("--ae-firefly-x", `${-75 + random() * 150}px`);
      fly.style.setProperty("--ae-firefly-y", `${-65 + random() * 130}px`);
      layer.appendChild(fly);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(38, settings, 1); },
};

const confetti: EffectModule = {
  definition: makeDefinition({
    id: "confetti",
    name: "Confetti",
    description: "Kolorowe konfetti opadające przez ekran.",
    category: "other",
    tags: ["confetti", "party", "celebration", "color"],
    defaultSettings: { ...defaultSettings, opacity: 90, density: 58, speed: 80 },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: confettiCss,
  streamElementsRendererName: "aeRenderConfetti",
  renderPreview(layer, settings, random) {
    const colors = ["#ff4f9a","#ffe45c","#65e6ff","#7dff86","#b780ff","#ff8a42"];
    const count = particleCount(55, settings);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "ae-confetti";
      piece.style.left = `${random() * 100}%`;
      piece.style.width = `${5 + random() * 8}px`;
      piece.style.height = `${9 + random() * 13}px`;
      piece.style.background = colors[Math.floor(random() * colors.length)] ?? "#ff4f9a";
      piece.style.animationDelay = `${-random() * 8}s`;
      piece.style.animationDuration = `${(5 + random() * 7) / speed}s`;
      piece.style.setProperty("--ae-confetti-drift", `${-85 + random() * 170}px`);
      piece.style.setProperty("--ae-confetti-rot", `${420 + random() * 720}deg`);
      layer.appendChild(piece);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(55, settings); },
};

const dustMotes: EffectModule = {
  definition: makeDefinition({
    id: "dust-motes",
    name: "Dust Motes",
    description: "Subtelny kurz unoszący się w świetle.",
    category: "cinematic",
    tags: ["dust", "motes", "cinematic", "ambient"],
    defaultSettings: { ...defaultSettings, opacity: 55, density: 48, speed: 38, blendMode: "screen" },
    performanceCost: 1,
    requiresJavaScript: true,
  }),
  css: dustMotesCss,
  streamElementsRendererName: "aeRenderDustMotes",
  renderPreview(layer, settings, random) {
    const count = particleCount(48, settings);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const mote = document.createElement("span");
      mote.className = "ae-dust-mote";
      const size = 1 + random() * 4;
      mote.style.left = `${random() * 100}%`;
      mote.style.top = `${random() * 100}%`;
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.animationDelay = `${-random() * 13}s`;
      mote.style.animationDuration = `${(9 + random() * 10) / speed}s`;
      mote.style.setProperty("--ae-mote-x", `${-55 + random() * 110}px`);
      mote.style.setProperty("--ae-mote-y", `${-55 + random() * 110}px`);
      layer.appendChild(mote);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(48, settings); },
};

const aurora: EffectModule = {
  definition: makeDefinition({
    id: "aurora",
    name: "Aurora",
    description: "Miękkie, kolorowe pasma zorzy polarnej.",
    category: "cosmic",
    tags: ["aurora", "cosmic", "sky", "glow"],
    defaultSettings: { ...defaultSettings, opacity: 72, density: 55, speed: 42, blendMode: "screen" },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: auroraCss,
  streamElementsRendererName: "aeRenderAurora",
  renderPreview(layer, settings, random) {
    const count = particleCount(5, settings, 1);
    const speed = Math.max(.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const band = document.createElement("span");
      band.className = "ae-aurora-band";
      band.style.top = `${5 + random() * 70}%`;
      band.style.height = `${18 + random() * 28}%`;
      band.style.animationDelay = `${-random() * 11}s`;
      band.style.animationDuration = `${(8 + random() * 8) / speed}s`;
      band.style.setProperty("--ae-aurora-angle", `${-16 + random() * 24}deg`);
      layer.appendChild(band);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) { return particleCount(5, settings, 1); },
};

/* === EFFECTS_PACK_03_END === */

'@

$exportMarker =
  "export const effectModules:"

$exportIndex =
  $effectContent.IndexOf(
    $exportMarker
  )

if ($exportIndex -lt 0) {
  throw "Nie znaleziono listy effectModules."
}

$effectContent =
  $effectContent.Insert(
    $exportIndex,
    $newBlock.TrimEnd() +
    "`r`n`r`n"
  )

$arrayMarker =
  "    sparks,"

$arrayIndex =
  $effectContent.LastIndexOf(
    $arrayMarker
  )

if ($arrayIndex -lt 0) {
  throw "Nie znaleziono wpisu sparks w effectModules."
}

$lineEnd =
  $effectContent.IndexOf(
    "`n",
    $arrayIndex
  )

if ($lineEnd -lt 0) {
  throw "Nie udalo sie znalezc konca listy effectModules."
}

$newEntries = @'
    plasma,
    energyWaves,
    runes,
    magicDust,
    laserGrid,
    scanlines,
    pong,
    bubbles,
    fireflies,
    confetti,
    dustMotes,
    aurora,
'@

$effectContent =
  $effectContent.Insert(
    $lineEnd + 1,
    $newEntries
  )

$toolbarStart =
  "/* === AE_EFFECT_TOOLBAR_V1_START === */"

if (
  !$styleContent.Contains(
    $toolbarStart
  )
) {
  $toolbarFix = @'
/* === AE_EFFECT_TOOLBAR_V1_START === */

/*
  Przy duzej bibliotece efektow przyciski nie powiekszaja topbara.
  Lista efektow przewija sie poziomo, a akcje Wyczyść/Eksport zostaja widoczne.
*/
.topbar {
  min-width: 0;
}

.topbar > div:first-child {
  flex: 0 0 auto;
}

.controls {
  min-width: 0;
  flex: 1 1 auto;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 8px;

  flex-wrap: nowrap;
  overflow: hidden;
}

.effect-buttons {
  min-width: 0;
  max-width: min(68vw, 1200px);

  display: flex;
  align-items: center;

  gap: 8px;

  overflow-x: auto;
  overflow-y: hidden;

  padding: 2px 2px 7px;

  scrollbar-width: thin;
  scrollbar-color:
    rgba(124, 92, 255, 0.55)
    rgba(255, 255, 255, 0.05);
}

.effect-buttons::-webkit-scrollbar {
  height: 6px;
}

.effect-buttons::-webkit-scrollbar-track {
  background:
    rgba(255, 255, 255, 0.04);

  border-radius: 999px;
}

.effect-buttons::-webkit-scrollbar-thumb {
  background:
    rgba(124, 92, 255, 0.55);

  border-radius: 999px;
}

.effect-buttons button {
  flex: 0 0 auto;
  white-space: nowrap;
}

#clear-preview,
#export-stream-elements {
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .topbar {
    gap: 12px;
  }

  .effect-buttons {
    max-width: 48vw;
  }
}

/* === AE_EFFECT_TOOLBAR_V1_END === */
'@

  $styleContent =
    $styleContent.TrimEnd() +
    "`r`n`r`n" +
    $toolbarFix.Trim() +
    "`r`n"
}

$utf8NoBom =
  New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $effectPath,
  $effectContent,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $stylePath,
  $styleContent,
  $utf8NoBom
)

Write-Host "  zaktualizowano: src/effects/effectModules.ts" -ForegroundColor DarkGray
Write-Host "  zaktualizowano: src/style.css" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan

$failed = $false

Push-Location $ProjectRoot

try {
  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    $failed = $true
    throw "TypeScript check failed"
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    $failed = $true
    throw "Build failed"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Effects Pack 03 zainstalowany." -ForegroundColor Green
  Write-Host "Nowe efekty:"
  Write-Host "  Plasma"
  Write-Host "  Energy Waves"
  Write-Host "  Runes"
  Write-Host "  Magic Dust"
  Write-Host "  Laser Grid"
  Write-Host "  Retro Scanlines"
  Write-Host "  Retro Pong"
  Write-Host "  Bubbles"
  Write-Host "  Fireflies"
  Write-Host "  Confetti"
  Write-Host "  Dust Motes"
  Write-Host "  Aurora"
  Write-Host ""
  Write-Host "Razem: 29 efektow." -ForegroundColor Cyan
  Write-Host "Toolbar efektow przewija sie teraz poziomo."
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  $failed = $true
  Write-Host ""
  Write-Host "Instalacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $effectBackup $effectPath -Force
  Copy-Item $styleBackup $stylePath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
