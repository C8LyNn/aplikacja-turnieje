param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$effectPath = Join-Path $ProjectRoot "src\effects\effectModules.ts"

if (!(Test-Path $packageJson) -or !(Test-Path $effectPath)) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$content = [System.IO.File]::ReadAllText($effectPath)

if ($content.Contains("/* === EFFECTS_PACK_02_START === */")) {
  Write-Host "Effects Pack 02 jest juz zainstalowany." -ForegroundColor Yellow
  exit 0
}

if (!$content.Contains('const fog: EffectModule')) {
  throw "Nie rozpoznaje wersji effectModules.ts. Najpierw powinien byc zainstalowany Effects Pack 01."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$backupPath = Join-Path $backupRoot "src\effects\effectModules.ts"
$backupDir = Split-Path $backupPath -Parent
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $effectPath $backupPath -Force

Write-Host ""
Write-Host "Animated Effects - Effects Pack 02" -ForegroundColor Cyan
Write-Host "Backup: $backupPath"

$newBlock = @'
/* === EFFECTS_PACK_02_START === */

const embersCss = `
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
`.trim();

const cloudsCss = `
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
`.trim();

const rainGlassCss = `
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
`.trim();

const bouncingBallsCss = `
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
`.trim();

const neonLinesCss = `
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
`.trim();

const energyOrbsCss = `
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
`.trim();

const petalsCss = `
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
`.trim();

const sparksCss = `
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
`.trim();

const embers: EffectModule = {
  definition: makeDefinition({
    id: "embers",
    name: "Embers",
    description: "Żarzące się drobiny unoszące się ku górze.",
    category: "cinematic",
    tags: ["embers", "fire", "ash", "cinematic"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 90,
      density: 55,
      speed: 70,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: embersCss,
  streamElementsRendererName: "aeRenderEmbers",
  renderPreview(layer, settings, random) {
    const count = particleCount(46, settings);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const ember = document.createElement("span");
      ember.className = "ae-ember";
      const size = 2 + random() * 6;
      ember.style.left = `${random() * 100}%`;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      ember.style.animationDelay = `${-random() * 10}s`;
      ember.style.animationDuration = `${(5 + random() * 7) / speed}s`;
      ember.style.setProperty("--ae-ember-drift", `${-55 + random() * 110}px`);
      layer.appendChild(ember);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(46, settings);
  },
};

const clouds: EffectModule = {
  definition: makeDefinition({
    id: "clouds",
    name: "Clouds",
    description: "Miękkie, półprzezroczyste chmury przesuwające się po ekranie.",
    category: "weather",
    tags: ["clouds", "weather", "mist", "sky"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 70,
      density: 45,
      speed: 45,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: cloudsCss,
  streamElementsRendererName: "aeRenderClouds",
  renderPreview(layer, settings, random) {
    const count = particleCount(10, settings, 1);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement("span");
      cloud.className = "ae-cloud";
      const width = 220 + random() * 340;
      const height = 90 + random() * 130;
      cloud.style.left = `${-35 - random() * 35}%`;
      cloud.style.top = `${random() * 85}%`;
      cloud.style.width = `${width}px`;
      cloud.style.height = `${height}px`;
      cloud.style.opacity = String(0.35 + random() * 0.5);
      cloud.style.animationDelay = `${-random() * 24}s`;
      cloud.style.animationDuration = `${(22 + random() * 28) / speed}s`;
      cloud.style.setProperty("--ae-cloud-lift", `${-6 + random() * 12}vh`);
      layer.appendChild(cloud);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(10, settings, 1);
  },
};

const rainGlass: EffectModule = {
  definition: makeDefinition({
    id: "rain-glass",
    name: "Rain on Glass",
    description: "Krople deszczu spływające po wirtualnej szybie.",
    category: "weather",
    tags: ["rain", "glass", "drops", "weather"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 72,
      density: 55,
      speed: 65,
      blendMode: "screen",
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),
  css: rainGlassCss,
  streamElementsRendererName: "aeRenderRainGlass",
  renderPreview(layer, settings, random) {
    const count = particleCount(44, settings);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("span");
      drop.className = "ae-glass-drop";
      const width = 3 + random() * 8;
      const height = 18 + random() * 72;
      drop.style.left = `${random() * 100}%`;
      drop.style.width = `${width}px`;
      drop.style.height = `${height}px`;
      drop.style.animationDelay = `${-random() * 11}s`;
      drop.style.animationDuration = `${(4 + random() * 9) / speed}s`;
      drop.style.setProperty("--ae-glass-drift", `${-12 + random() * 24}px`);
      layer.appendChild(drop);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(44, settings);
  },
};

const bouncingBalls: EffectModule = {
  definition: makeDefinition({
    id: "bouncing-balls",
    name: "Bouncing Balls",
    description: "Kolorowe kule odbijające się i dryfujące po ekranie.",
    category: "retro",
    tags: ["balls", "bounce", "retro", "screensaver"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 85,
      density: 45,
      speed: 85,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: bouncingBallsCss,
  streamElementsRendererName: "aeRenderBouncingBalls",
  renderPreview(layer, settings, random) {
    const count = particleCount(18, settings, 1);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const ball = document.createElement("span");
      ball.className = "ae-bounce-ball";
      const size = 14 + random() * 42;
      ball.style.left = `${8 + random() * 78}%`;
      ball.style.top = `${8 + random() * 78}%`;
      ball.style.width = `${size}px`;
      ball.style.height = `${size}px`;
      ball.style.animationDelay = `${-random() * 8}s`;
      ball.style.animationDuration = `${(4 + random() * 7) / speed}s`;
      ball.style.setProperty("--ae-ball-dx", `${-18 + random() * 36}vw`);
      ball.style.setProperty("--ae-ball-dy", `${-14 + random() * 28}vh`);
      layer.appendChild(ball);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(18, settings, 1);
  },
};

const neonLines: EffectModule = {
  definition: makeDefinition({
    id: "neon-lines",
    name: "Neon Lines",
    description: "Świecące neonowe smugi przesuwające się przez ekran.",
    category: "tech",
    tags: ["neon", "lines", "cyber", "tech"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 88,
      density: 45,
      speed: 100,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: neonLinesCss,
  streamElementsRendererName: "aeRenderNeonLines",
  renderPreview(layer, settings, random) {
    const count = particleCount(16, settings, 1);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const line = document.createElement("span");
      line.className = "ae-neon-line";
      line.style.left = `${-35 - random() * 25}%`;
      line.style.top = `${5 + random() * 90}%`;
      line.style.width = `${120 + random() * 320}px`;
      line.style.opacity = String(0.45 + random() * 0.55);
      line.style.animationDelay = `${-random() * 8}s`;
      line.style.animationDuration = `${(3 + random() * 6) / speed}s`;
      line.style.setProperty("--ae-line-angle", `${-20 + random() * 40}deg`);
      layer.appendChild(line);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(16, settings, 1);
  },
};

const energyOrbs: EffectModule = {
  definition: makeDefinition({
    id: "energy-orbs",
    name: "Energy Orbs",
    description: "Pulsujące, świecące kule energii.",
    category: "energy",
    tags: ["energy", "orbs", "glow", "plasma"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 82,
      density: 48,
      speed: 70,
      blendMode: "screen",
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),
  css: energyOrbsCss,
  streamElementsRendererName: "aeRenderEnergyOrbs",
  renderPreview(layer, settings, random) {
    const count = particleCount(20, settings, 1);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const orb = document.createElement("span");
      orb.className = "ae-energy-orb";
      const size = 14 + random() * 56;
      orb.style.left = `${5 + random() * 88}%`;
      orb.style.top = `${5 + random() * 88}%`;
      orb.style.width = `${size}px`;
      orb.style.height = `${size}px`;
      orb.style.animationDelay = `${-random() * 9}s`;
      orb.style.animationDuration = `${(4 + random() * 8) / speed}s`;
      orb.style.setProperty("--ae-orb-dx", `${-70 + random() * 140}px`);
      orb.style.setProperty("--ae-orb-dy", `${-60 + random() * 120}px`);
      layer.appendChild(orb);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(20, settings, 1);
  },
};

const petals: EffectModule = {
  definition: makeDefinition({
    id: "petals",
    name: "Petals",
    description: "Delikatne płatki opadające i wirujące na wietrze.",
    category: "botanical",
    tags: ["petals", "flowers", "spring", "nature"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 88,
      density: 55,
      speed: 62,
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: petalsCss,
  streamElementsRendererName: "aeRenderPetals",
  renderPreview(layer, settings, random) {
    const count = particleCount(34, settings);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const petal = document.createElement("span");
      petal.className = "ae-petal";
      const width = 8 + random() * 13;
      const height = 12 + random() * 18;
      petal.style.left = `${random() * 100}%`;
      petal.style.width = `${width}px`;
      petal.style.height = `${height}px`;
      petal.style.animationDelay = `${-random() * 12}s`;
      petal.style.animationDuration = `${(7 + random() * 9) / speed}s`;
      petal.style.setProperty("--ae-petal-drift", `${-70 + random() * 140}px`);
      layer.appendChild(petal);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(34, settings);
  },
};

const sparks: EffectModule = {
  definition: makeDefinition({
    id: "sparks",
    name: "Sparks",
    description: "Jasne iskry wystrzeliwujące ku górze.",
    category: "energy",
    tags: ["sparks", "fire", "energy", "particles"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 92,
      density: 58,
      speed: 115,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),
  css: sparksCss,
  streamElementsRendererName: "aeRenderSparks",
  renderPreview(layer, settings, random) {
    const count = particleCount(52, settings);
    const speed = Math.max(0.1, settings.speed / 100);
    for (let i = 0; i < count; i++) {
      const spark = document.createElement("span");
      spark.className = "ae-spark";
      spark.style.left = `${random() * 100}%`;
      spark.style.height = `${8 + random() * 24}px`;
      spark.style.animationDelay = `${-random() * 7}s`;
      spark.style.animationDuration = `${(2.2 + random() * 4.2) / speed}s`;
      spark.style.setProperty("--ae-spark-drift", `${-75 + random() * 150}px`);
      spark.style.setProperty("--ae-spark-angle", `${-22 + random() * 44}deg`);
      layer.appendChild(spark);
    }
  },
  streamElementsRendererSource: `
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
`.trim(),
  estimateDomNodes(settings) {
    return particleCount(52, settings);
  },
};

/* === EFFECTS_PACK_02_END === */
'@

$exportMarker = "export const effectModules:"
$exportIndex = $content.IndexOf($exportMarker)

if ($exportIndex -lt 0) {
  throw "Nie znaleziono listy effectModules."
}

$content = $content.Insert(
  $exportIndex,
  $newBlock.TrimEnd() + "`r`n`r`n"
)

$arrayMarker = "    fog,"
$arrayIndex = $content.LastIndexOf($arrayMarker)

if ($arrayIndex -lt 0) {
  throw "Nie znaleziono wpisu fog w tablicy effectModules."
}

$lineEnd = $content.IndexOf("`n", $arrayIndex)
if ($lineEnd -lt 0) {
  throw "Nie udalo sie znalezc konca listy effectModules."
}

$newEntries = @'
    embers,
    clouds,
    rainGlass,
    bouncingBalls,
    neonLines,
    energyOrbs,
    petals,
    sparks,
'@

$content = $content.Insert(
  $lineEnd + 1,
  $newEntries
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($effectPath, $content, $utf8NoBom)

Write-Host "  zaktualizowano: src/effects/effectModules.ts" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan

Push-Location $ProjectRoot

try {
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

  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Effects Pack 02 zainstalowany." -ForegroundColor Green
  Write-Host "Nowe efekty:"
  Write-Host "  Embers"
  Write-Host "  Clouds"
  Write-Host "  Rain on Glass"
  Write-Host "  Bouncing Balls"
  Write-Host "  Neon Lines"
  Write-Host "  Energy Orbs"
  Write-Host "  Petals"
  Write-Host "  Sparks"
  Write-Host ""
  Write-Host "Razem powinno byc teraz 17 efektow."
  Write-Host "Odswiez aktywny localhost z Vite i przetestuj nowe przyciski."
}
catch {
  Write-Host ""
  Write-Host "Test nie przeszedl. Przywracam poprzedni effectModules.ts..." -ForegroundColor Red
  Copy-Item $backupPath $effectPath -Force
  Write-Host "Przywrocono backup: $backupPath" -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
