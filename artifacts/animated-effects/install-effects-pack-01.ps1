param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$srcDir = Join-Path $ProjectRoot "src"

if (!(Test-Path $packageJson) -or !(Test-Path $srcDir)) {
  throw "Uruchom ten skrypt w katalogu glowym projektu animated-effects (tam gdzie package.json i src)."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"

$targets = @(
  "src/effects/effectModules.ts",
  "src/effects/registry.ts",
  "src/editor/preview.ts",
  "src/export/streamElements.ts",
  "src/main.ts",
  "src/style.css"
)

Write-Host ""
Write-Host "Animated Effects - Effects Pack 01" -ForegroundColor Cyan
Write-Host "Tworze backup: $backupRoot"

foreach ($relativePath in $targets) {
  $source = Join-Path $ProjectRoot $relativePath

  if (Test-Path $source) {
    $destination = Join-Path $backupRoot $relativePath
    $destinationDir = Split-Path $destination -Parent

    New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    Copy-Item $source $destination -Force
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-ProjectFile {
  param(
    [string]$RelativePath,
    [string]$Content
  )

  $path = Join-Path $ProjectRoot $RelativePath
  $directory = Split-Path $path -Parent

  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  [System.IO.File]::WriteAllText($path, $Content, $utf8NoBom)

  Write-Host "  zapisano: $RelativePath" -ForegroundColor DarkGray
}

Write-ProjectFile -RelativePath 'src/effects/effectModules.ts' -Content @'
import type {
  EffectCapabilities,
  EffectDefinition,
  EffectSettings,
} from "../core/types";

export interface EffectModule {
  definition: EffectDefinition;
  css: string;
  streamElementsRendererName: string;
  renderPreview: (
    layer: HTMLElement,
    settings: EffectSettings,
    random: () => number,
  ) => void;
  streamElementsRendererSource: string;
  estimateDomNodes: (
    settings: EffectSettings,
  ) => number;
}

const defaultSettings: EffectSettings = {
  opacity: 100,
  scale: 100,
  x: 0,
  y: 0,
  rotation: 0,
  blur: 0,
  brightness: 100,
  hue: 0,
  density: 100,
  blendMode: "normal",
  area: "full",
  zIndex: 20,
  speed: 100,
  intensity: 100,
};

const fullCapabilities: EffectCapabilities = {
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
};

function makeDefinition(
  data: Omit<
    EffectDefinition,
    "capabilities"
  > & {
    capabilities?: EffectCapabilities;
  },
): EffectDefinition {
  return {
    ...data,
    capabilities:
      data.capabilities ??
      fullCapabilities,
  };
}

function particleCount(
  base: number,
  settings: EffectSettings,
  minimum = 0,
): number {
  return Math.max(
    minimum,
    Math.round(
      base *
      (settings.density / 100),
    ),
  );
}

const rainfallCss = `
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
`.trim();

const snowCss = `
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
`.trim();

const lightningCss = `
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
`.trim();

const heartsCss = `
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
`.trim();

const leavesCss = `
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
`.trim();

const matrixCss = `
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
`.trim();

const cometsCss = `
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
`.trim();

const starfieldCss = `
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
`.trim();

const fogCss = `
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
`.trim();

const rainfall: EffectModule = {
  definition: makeDefinition({
    id: "rainfall",
    name: "Rainfall",
    description: "Spadające krople deszczu.",
    category: "weather",
    tags: ["rain", "weather", "water"],
    defaultSettings: {
      ...defaultSettings,
      opacity: 75,
      density: 70,
      speed: 120,
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),

  css: rainfallCss,
  streamElementsRendererName: "aeRenderRainfall",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        80,
        settings,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const drop =
        document.createElement(
          "span",
        );

      drop.className =
        "ae-rain-drop";

      drop.style.left =
        `${random() * 100}%`;

      drop.style.animationDelay =
        `${-random() * 2}s`;

      drop.style.animationDuration =
        `${
          (
            0.7 +
            random() * 0.8
          ) / speed
        }s`;

      layer.appendChild(
        drop,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      80,
      settings,
    );
  },
};

const snow: EffectModule = {
  definition: makeDefinition({
    id: "snow",
    name: "Snow",
    description: "Spadające płatki śniegu.",
    category: "weather",
    tags: [
      "snow",
      "winter",
      "weather",
      "flakes",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 85,
      density: 55,
      speed: 60,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: snowCss,
  streamElementsRendererName: "aeRenderSnow",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        55,
        settings,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const flake =
        document.createElement(
          "span",
        );

      flake.className =
        "ae-snowflake";

      const size =
        4 +
        random() * 10;

      flake.style.left =
        `${random() * 100}%`;

      flake.style.top =
        `${
          -10 -
          random() * 25
        }%`;

      flake.style.width =
        `${size}px`;

      flake.style.height =
        `${size}px`;

      flake.style.opacity =
        String(
          0.45 +
          random() * 0.55,
        );

      flake.style.animationDelay =
        `${-random() * 12}s`;

      flake.style.animationDuration =
        `${
          (
            6 +
            random() * 8
          ) / speed
        }s`;

      flake.style.setProperty(
        "--ae-snow-drift",
        `${
          -50 +
          random() * 100
        }px`,
      );

      flake.style.setProperty(
        "--ae-snow-rotation",
        `${
          120 +
          random() * 360
        }deg`,
      );

      layer.appendChild(
        flake,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      55,
      settings,
    );
  },
};

const lightning: EffectModule = {
  definition: makeDefinition({
    id: "lightning",
    name: "Lightning Storm",
    description: "Losowe błyski i pioruny.",
    category: "weather",
    tags: [
      "lightning",
      "storm",
      "electric",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 100,
      density: 45,
      speed: 100,
      blendMode: "screen",
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),

  css: lightningCss,
  streamElementsRendererName: "aeRenderLightning",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        8,
        settings,
        1,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const bolt =
        document.createElement(
          "span",
        );

      bolt.className =
        "ae-lightning";

      bolt.style.left =
        `${
          10 +
          random() * 80
        }%`;

      bolt.style.top =
        `${random() * 35}%`;

      bolt.style.animationDelay =
        `${-random() * 4}s`;

      bolt.style.animationDuration =
        `${2.2 / speed}s`;

      layer.appendChild(
        bolt,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      8,
      settings,
      1,
    );
  },
};

const hearts: EffectModule = {
  definition: makeDefinition({
    id: "hearts",
    name: "Hearts",
    description:
      "Unoszące się animowane serduszka.",
    category: "other",
    tags: [
      "heart",
      "love",
      "particles",
      "fun",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 80,
      density: 50,
      speed: 80,
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: heartsCss,
  streamElementsRendererName: "aeRenderHearts",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        30,
        settings,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const heart =
        document.createElement(
          "span",
        );

      heart.className =
        "ae-heart";

      heart.textContent =
        "❤";

      heart.style.left =
        `${random() * 100}%`;

      heart.style.animationDelay =
        `${-random() * 8}s`;

      heart.style.animationDuration =
        `${8 / speed}s`;

      heart.style.fontSize =
        `${
          14 +
          random() * 22
        }px`;

      layer.appendChild(
        heart,
      );
    }
  },

  streamElementsRendererSource: `
function aeRenderHearts(effect, root) {
  const layer = aeCreateLayer(effect, root);
  const random = aeCreateSeededRandom(effect.seed);
  const s = effect.settings;
  const count = Math.round(30 * (s.density / 100));
  const speed = Math.max(0.1, s.speed / 100);

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "ae-heart";
    heart.textContent = "❤";
    heart.style.left = random() * 100 + "%";
    heart.style.animationDelay = -random() * 8 + "s";
    heart.style.animationDuration = (8 / speed) + "s";
    heart.style.fontSize = (14 + random() * 22) + "px";
    layer.appendChild(heart);
  }
}
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      30,
      settings,
    );
  },
};

const leaves: EffectModule = {
  definition: makeDefinition({
    id: "leaves",
    name: "Leaves",
    description:
      "Wirujące, opadające liście.",
    category: "botanical",
    tags: [
      "leaves",
      "autumn",
      "nature",
      "particles",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 90,
      density: 60,
      speed: 70,
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: leavesCss,
  streamElementsRendererName: "aeRenderLeaves",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        36,
        settings,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const leaf =
        document.createElement(
          "span",
        );

      leaf.className =
        "ae-leaf";

      const size =
        12 +
        random() * 16;

      leaf.style.left =
        `${random() * 100}%`;

      leaf.style.top =
        `${
          -10 -
          random() * 25
        }%`;

      leaf.style.width =
        `${size}px`;

      leaf.style.height =
        `${size * 0.62}px`;

      leaf.style.animationDelay =
        `${-random() * 12}s`;

      leaf.style.animationDuration =
        `${
          (
            7 +
            random() * 8
          ) / speed
        }s`;

      leaf.style.setProperty(
        "--ae-leaf-drift",
        `${
          -90 +
          random() * 180
        }px`,
      );

      leaf.style.setProperty(
        "--ae-leaf-rotation",
        `${
          360 +
          random() * 720
        }deg`,
      );

      layer.appendChild(
        leaf,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      36,
      settings,
    );
  },
};

const matrix: EffectModule = {
  definition: makeDefinition({
    id: "matrix",
    name: "Matrix Code",
    description:
      "Kolumny opadającego cyfrowego kodu.",
    category: "tech",
    tags: [
      "matrix",
      "code",
      "digital",
      "tech",
      "cyber",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 80,
      density: 55,
      speed: 85,
      blendMode: "screen",
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),

  css: matrixCss,
  streamElementsRendererName: "aeRenderMatrix",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        24,
        settings,
        1,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    const charset =
      "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const column =
        document.createElement(
          "span",
        );

      column.className =
        "ae-matrix-column";

      const length =
        8 +
        Math.floor(
          random() * 11,
        );

      let text = "";

      for (
        let j = 0;
        j < length;
        j++
      ) {
        text +=
          charset[
            Math.floor(
              random() *
              charset.length,
            )
          ];

        if (
          j <
          length - 1
        ) {
          text += "\n";
        }
      }

      column.textContent =
        text;

      column.style.left =
        `${random() * 100}%`;

      column.style.fontSize =
        `${
          11 +
          random() * 9
        }px`;

      column.style.animationDelay =
        `${-random() * 8}s`;

      column.style.animationDuration =
        `${
          (
            4 +
            random() * 5
          ) / speed
        }s`;

      column.style.opacity =
        String(
          0.45 +
          random() * 0.55,
        );

      layer.appendChild(
        column,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      24,
      settings,
      1,
    );
  },
};

const comets: EffectModule = {
  definition: makeDefinition({
    id: "comets",
    name: "Comets",
    description:
      "Szybkie świetliste komety przecinające ekran.",
    category: "cosmic",
    tags: [
      "comet",
      "space",
      "cosmic",
      "streak",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 90,
      density: 45,
      speed: 100,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: cometsCss,
  streamElementsRendererName: "aeRenderComets",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        10,
        settings,
        1,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const comet =
        document.createElement(
          "span",
        );

      comet.className =
        "ae-comet";

      comet.style.top =
        `${
          -10 +
          random() * 75
        }%`;

      comet.style.width =
        `${
          90 +
          random() * 140
        }px`;

      comet.style.animationDelay =
        `${-random() * 10}s`;

      comet.style.animationDuration =
        `${
          (
            4 +
            random() * 5
          ) / speed
        }s`;

      layer.appendChild(
        comet,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      10,
      settings,
      1,
    );
  },
};

const starfield: EffectModule = {
  definition: makeDefinition({
    id: "starfield",
    name: "Starfield",
    description:
      "Migoczące gwiazdy w tle.",
    category: "cosmic",
    tags: [
      "stars",
      "space",
      "cosmic",
      "twinkle",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 85,
      density: 65,
      speed: 80,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: starfieldCss,
  streamElementsRendererName: "aeRenderStarfield",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        100,
        settings,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const star =
        document.createElement(
          "span",
        );

      star.className =
        "ae-star";

      const size =
        1 +
        random() * 3.5;

      star.style.left =
        `${random() * 100}%`;

      star.style.top =
        `${random() * 100}%`;

      star.style.width =
        `${size}px`;

      star.style.height =
        `${size}px`;

      star.style.animationDelay =
        `${-random() * 4}s`;

      star.style.animationDuration =
        `${
          (
            1.5 +
            random() * 3
          ) / speed
        }s`;

      layer.appendChild(
        star,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      100,
      settings,
    );
  },
};

const fog: EffectModule = {
  definition: makeDefinition({
    id: "fog",
    name: "Fog",
    description:
      "Powolne warstwy mgły przesuwające się przez ekran.",
    category: "weather",
    tags: [
      "fog",
      "mist",
      "cloud",
      "weather",
      "cinematic",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 65,
      density: 70,
      speed: 45,
      blendMode: "screen",
    },
    performanceCost: 3,
    requiresJavaScript: true,
  }),

  css: fogCss,
  streamElementsRendererName: "aeRenderFog",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const count =
      particleCount(
        6,
        settings,
        1,
      );

    const speed =
      Math.max(
        0.1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const blob =
        document.createElement(
          "span",
        );

      blob.className =
        "ae-fog-blob";

      blob.style.left =
        `${
          -25 +
          random() * 95
        }%`;

      blob.style.top =
        `${
          -10 +
          random() * 75
        }%`;

      blob.style.width =
        `${
          45 +
          random() * 35
        }%`;

      blob.style.height =
        `${
          30 +
          random() * 35
        }%`;

      blob.style.opacity =
        String(
          0.16 +
          random() * 0.22,
        );

      blob.style.animationDelay =
        `${-random() * 24}s`;

      blob.style.animationDuration =
        `${
          (
            18 +
            random() * 18
          ) / speed
        }s`;

      layer.appendChild(
        blob,
      );
    }
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      6,
      settings,
      1,
    );
  },
};

export const effectModules:
  EffectModule[] = [
    rainfall,
    snow,
    lightning,
    hearts,
    leaves,
    matrix,
    comets,
    starfield,
    fog,
  ];
'@

Write-ProjectFile -RelativePath 'src/effects/registry.ts' -Content @'
import type {
  EffectDefinition,
  EffectId,
} from "../core/types";

import {
  effectModules,
  type EffectModule,
} from "./effectModules";

const effectModuleMap =
  new Map<EffectId, EffectModule>(
    effectModules.map(
      (module) => [
        module.definition.id,
        module,
      ],
    ),
  );

export const effectRegistry: Record<
  EffectId,
  EffectDefinition
> = Object.fromEntries(
  effectModules.map(
    (module) => [
      module.definition.id,
      module.definition,
    ],
  ),
);

export function getEffectModule(
  id: EffectId,
): EffectModule | undefined {
  return effectModuleMap.get(id);
}

export function getEffectDefinition(
  id: EffectId,
): EffectDefinition | undefined {
  return effectModuleMap.get(id)?.definition;
}

export function getAllEffectDefinitions():
  EffectDefinition[] {
  return effectModules.map(
    (module) => module.definition,
  );
}

export function getAllEffectModules():
  EffectModule[] {
  return [...effectModules];
}
'@

Write-ProjectFile -RelativePath 'src/editor/preview.ts' -Content @'
import type {
  EffectInstance,
  EffectSettings,
} from "../core/types";

import {
  getAllEffectModules,
  getEffectModule,
} from "../effects/registry";

const MODULE_STYLE_ID =
  "animated-effects-module-styles";

export function createPreview(
  container: HTMLElement,
): HTMLElement {
  ensureModuleStyles();

  const preview =
    document.createElement("div");

  preview.id = "effect-preview";
  preview.className = "effect-preview";

  container.appendChild(preview);

  return preview;
}

export function renderEffect(
  preview: HTMLElement,
  instance: EffectInstance,
): void {
  const module =
    getEffectModule(
      instance.effectId,
    );

  if (!module) {
    console.warn(
      `Unknown effect: ${instance.effectId}`,
    );

    return;
  }

  const layer =
    document.createElement("div");

  layer.className =
    "effect-layer ae-layer";

  layer.dataset.effectId =
    instance.effectId;

  layer.dataset.instanceId =
    instance.instanceId;

  applyLayerSettings(
    layer,
    instance.settings,
  );

  const random =
    createSeededRandom(
      instance.seed,
    );

  module.renderPreview(
    layer,
    instance.settings,
    random,
  );

  preview.appendChild(
    layer,
  );
}

function ensureModuleStyles(): void {
  if (
    document.getElementById(
      MODULE_STYLE_ID,
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style",
    );

  style.id =
    MODULE_STYLE_ID;

  style.textContent =
    getAllEffectModules()
      .map(
        (module) =>
          module.css,
      )
      .join("\n\n");

  document.head.appendChild(
    style,
  );
}

function applyLayerSettings(
  layer: HTMLElement,
  settings: EffectSettings,
): void {
  layer.style.opacity =
    String(
      settings.opacity / 100,
    );

  layer.style.transform = `
    translate(
      ${settings.x}%,
      ${settings.y}%
    )
    scale(
      ${settings.scale / 100}
    )
    rotate(
      ${settings.rotation}deg
    )
  `;

  layer.style.filter = `
    blur(
      ${settings.blur}px
    )
    brightness(
      ${settings.brightness / 100}
    )
    hue-rotate(
      ${settings.hue}deg
    )
  `;

  layer.style.mixBlendMode =
    settings.blendMode;

  layer.style.zIndex =
    String(
      settings.zIndex,
    );

  layer.style.clipPath =
    getAreaClip(
      settings.area,
    );
}

function getAreaClip(
  area:
    EffectSettings["area"],
): string {
  switch (area) {
    case "left":
      return (
        "inset(0 50% 0 0)"
      );

    case "center":
      return (
        "inset(0 25% 0 25%)"
      );

    case "right":
      return (
        "inset(0 0 0 50%)"
      );

    case "top":
      return (
        "inset(0 0 50% 0)"
      );

    case "bottom":
      return (
        "inset(50% 0 0 0)"
      );

    case "full":
    default:
      return "none";
  }
}

function createSeededRandom(
  seed: number,
): () => number {
  let value =
    seed >>> 0;

  return () => {
    value +=
      0x6d2b79f5;

    let result =
      value;

    result =
      Math.imul(
        result ^
          (
            result >>>
            15
          ),
        result | 1,
      );

    result ^=
      result +
      Math.imul(
        result ^
          (
            result >>>
            7
          ),
        result | 61,
      );

    return (
      (
        result ^
        (
          result >>>
          14
        )
      ) >>> 0
    ) / 4294967296;
  };
}
'@

Write-ProjectFile -RelativePath 'src/export/streamElements.ts' -Content @'
import type {
  EditorState,
  EffectInstance,
  StreamElementsExport,
} from "../core/types";

import {
  getEffectModule,
} from "../effects/registry";

export function generateStreamElementsExport(
  state: EditorState,
): StreamElementsExport {
  const enabledEffects =
    state.effects.filter(
      (effect) => effect.enabled,
    );

  const config =
    enabledEffects.map(
      (effect) => ({
        instanceId:
          effect.instanceId,

        effectId:
          effect.effectId,

        seed:
          effect.seed,

        settings:
          effect.settings,
      }),
    );

  return {
    html:
      generateHtml(),

    css:
      generateCss(
        enabledEffects,
      ),

    javascript:
      generateJavaScript(
        config,
      ),

    estimatedDomNodes:
      estimateDomNodes(
        enabledEffects,
      ),

    estimatedPerformanceCost:
      estimatePerformanceCost(
        enabledEffects,
      ),
  };
}

function generateHtml(): string {
  return `
<div id="animated-effects-root"></div>
`.trim();
}

function generateCss(
  effects:
    EffectInstance[],
): string {
  const usedCss =
    uniqueEffectIds(
      effects,
    )
      .map(
        (effectId) =>
          getEffectModule(
            effectId,
          )?.css,
      )
      .filter(
        (
          css,
        ): css is string =>
          Boolean(css),
      )
      .join("\n\n");

  return `
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

${usedCss}
`.trim();
}

function generateJavaScript(
  config: Array<{
    instanceId: string;
    effectId: string;
    seed: number;
    settings:
      EffectInstance["settings"];
  }>,
): string {
  const effectIds =
    [
      ...new Set(
        config.map(
          (effect) =>
            effect.effectId,
        ),
      ),
    ];

  const renderers =
    effectIds
      .map(
        (effectId) => {
          const module =
            getEffectModule(
              effectId,
            );

          if (!module) {
            return null;
          }

          return {
            effectId,
            rendererName:
              module
                .streamElementsRendererName,
            source:
              module
                .streamElementsRendererSource,
          };
        },
      )
      .filter(
        (
          renderer,
        ): renderer is {
          effectId: string;
          rendererName: string;
          source: string;
        } =>
          renderer !== null,
      );

  const rendererSources =
    renderers
      .map(
        (renderer) =>
          renderer.source,
      )
      .join("\n\n");

  const rendererMap =
    renderers
      .map(
        (renderer) =>
          `${JSON.stringify(
            renderer.effectId,
          )}: ${renderer.rendererName}`,
      )
      .join(",\n  ");

  return `
const effects = ${JSON.stringify(
    config,
    null,
    2,
  )};

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

${rendererSources}

const aeRenderers = {
  ${rendererMap}
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
`.trim();
}


function uniqueEffectIds(
  effects:
    EffectInstance[],
): string[] {
  return [
    ...new Set(
      effects.map(
        (effect) =>
          effect.effectId,
      ),
    ),
  ];
}

function estimateDomNodes(
  effects:
    EffectInstance[],
): number {
  let total = 1;

  for (
    const effect of effects
  ) {
    total += 1;

    const module =
      getEffectModule(
        effect.effectId,
      );

    if (!module) {
      continue;
    }

    total +=
      module
        .estimateDomNodes(
          effect.settings,
        );
  }

  return total;
}

function estimatePerformanceCost(
  effects:
    EffectInstance[],
): number {
  return effects.reduce(
    (
      total,
      effect,
    ) => {
      const module =
        getEffectModule(
          effect.effectId,
        );

      return (
        total +
        (
          module
            ?.definition
            .performanceCost ??
          1
        )
      );
    },
    0,
  );
}
'@

Write-ProjectFile -RelativePath 'src/main.ts' -Content @'
import "./style.css";

import type {
  EffectId,
  EffectInstance,
} from "./core/types";

import {
  createPreview,
  renderEffect,
} from "./editor/preview";

import {
  renderInspector,
} from "./editor/inspector";

import {
  openExportPanel,
  setupExportPanel,
} from "./editor/exportPanel";

import {
  addEffect,
  clearEffects,
  getEditorState,
  moveEffectDown,
  moveEffectUp,
  removeEffect,
  selectEffect,
  subscribe,
  toggleEffect,
} from "./editor/state";

import {
  getAllEffectDefinitions,
  getEffectDefinition,
} from "./effects/registry";

const app =
  document.querySelector<HTMLDivElement>(
    "#app",
  );

if (!app) {
  throw new Error(
    "Nie znaleziono elementu #app.",
  );
}

app.innerHTML = `
  <main class="editor">
    <header class="topbar">
      <div>
        <h1>
          Animated Effects
        </h1>

        <p>
          TypeScript editor
        </p>
      </div>

      <div class="controls">
        <div
          id="effect-buttons"
          class="effect-buttons"
        ></div>

        <button
          id="clear-preview"
        >
          Wyczyść
        </button>

        <button
          id="export-stream-elements"
        >
          Eksport StreamElements
        </button>
      </div>
    </header>

    <div class="workspace">
      <aside
        class="layers-panel"
      >
        <div
          class="panel-header"
        >
          <strong>
            Warstwy
          </strong>

          <span
            id="layer-count"
          >
            0
          </span>
        </div>

        <div
          id="layers-list"
          class="layers-list"
        ></div>
      </aside>

      <section
        class="preview-shell"
      >
        <div
          id="preview-host"
        ></div>
      </section>

      <aside
        class="inspector-panel"
      >
        <div
          class="panel-header"
        >
          <strong>
            Inspector
          </strong>
        </div>

        <div
          id="inspector"
        ></div>
      </aside>
    </div>
  </main>

  <dialog
    id="stream-elements-export"
    class="export-dialog"
  >
    <div
      class="export-header"
    >
      <div>
        <strong>
          StreamElements
        </strong>

        <span
          data-export-metrics
        ></span>
      </div>

      <button
        type="button"
        data-export-close
      >
        ×
      </button>
    </div>

    <div
      class="export-section"
    >
      <div
        class="export-section-header"
      >
        <strong>
          HTML
        </strong>

        <button
          type="button"
          data-copy="html"
        >
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="html"
        readonly
      ></textarea>
    </div>

    <div
      class="export-section"
    >
      <div
        class="export-section-header"
      >
        <strong>
          CSS
        </strong>

        <button
          type="button"
          data-copy="css"
        >
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="css"
        readonly
      ></textarea>
    </div>

    <div
      class="export-section"
    >
      <div
        class="export-section-header"
      >
        <strong>
          JavaScript
        </strong>

        <button
          type="button"
          data-copy="javascript"
        >
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="javascript"
        readonly
      ></textarea>
    </div>
  </dialog>
`;

function getRequiredElement<
  T extends HTMLElement
>(
  selector: string,
): T {
  const element =
    document.querySelector<T>(
      selector,
    );

  if (!element) {
    throw new Error(
      `Nie znaleziono elementu: ${selector}`,
    );
  }

  return element;
}

const previewHost =
  getRequiredElement<HTMLElement>(
    "#preview-host",
  );

const layersList =
  getRequiredElement<HTMLElement>(
    "#layers-list",
  );

const layerCount =
  getRequiredElement<HTMLElement>(
    "#layer-count",
  );

const inspector =
  getRequiredElement<HTMLElement>(
    "#inspector",
  );

const effectButtons =
  getRequiredElement<HTMLElement>(
    "#effect-buttons",
  );

const exportDialog =
  getRequiredElement<HTMLDialogElement>(
    "#stream-elements-export",
  );

setupExportPanel(
  exportDialog,
);

const preview =
  createPreview(
    previewHost,
  );

function effectNumber(
  current: EffectInstance,
): number {
  const sameType =
    getEditorState().effects.filter(
      (effect) =>
        effect.effectId ===
        current.effectId,
    );

  return (
    sameType.findIndex(
      (effect) =>
        effect.instanceId ===
        current.instanceId,
    ) + 1
  );
}

function renderEffectButtons(): void {
  effectButtons.replaceChildren();

  getAllEffectDefinitions()
    .forEach(
      (definition) => {
        const button =
          document.createElement(
            "button",
          );

        button.type =
          "button";

        button.textContent =
          `+ ${definition.name}`;

        button.dataset.addEffect =
          definition.id;

        button.addEventListener(
          "click",
          () => {
            addEffect(
              definition.id as EffectId,
            );
          },
        );

        effectButtons.appendChild(
          button,
        );
      },
    );
}

function renderPreview(): void {
  preview.replaceChildren();

  const state =
    getEditorState();

  state.effects.forEach(
    (effect) => {
      if (!effect.enabled) {
        return;
      }

      renderEffect(
        preview,
        effect,
      );
    },
  );
}

function renderLayers(): void {
  const state =
    getEditorState();

  layersList.replaceChildren();

  layerCount.textContent =
    String(
      state.effects.length,
    );

  if (
    state.effects.length === 0
  ) {
    layersList.innerHTML = `
      <div
        class="empty-layers"
      >
        Brak efektów.
        <br>
        Dodaj dowolny efekt
        z górnego paska.
      </div>
    `;

    return;
  }

  [...state.effects]
    .reverse()
    .forEach(
      (instance) => {
        const definition =
          getEffectDefinition(
            instance.effectId,
          );

        if (!definition) {
          return;
        }

        const row =
          document.createElement(
            "div",
          );

        row.className =
          "layer-row";

        if (
          state
            .selectedEffectInstanceId ===
          instance.instanceId
        ) {
          row.classList.add(
            "selected",
          );
        }

        const number =
          effectNumber(
            instance,
          );

        row.innerHTML = `
          <button
            class="layer-main"
            type="button"
          >
            <span
              class="layer-name"
            >
              ${definition.name}
              #${number}
            </span>

            <span
              class="layer-tech"
            >
              ${instance.effectId}
            </span>
          </button>

          <div
            class="layer-actions"
          >
            <button
              class="layer-toggle"
              type="button"
              title="Włącz / wyłącz"
            >
              ${
                instance.enabled
                  ? "◉"
                  : "○"
              }
            </button>

            <button
              class="layer-up"
              type="button"
              title="Wyżej"
            >
              ↑
            </button>

            <button
              class="layer-down"
              type="button"
              title="Niżej"
            >
              ↓
            </button>

            <button
              class="layer-remove"
              type="button"
              title="Usuń"
            >
              ×
            </button>
          </div>
        `;

        row
          .querySelector(
            ".layer-main",
          )
          ?.addEventListener(
            "click",
            () => {
              selectEffect(
                instance
                  .instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-toggle",
          )
          ?.addEventListener(
            "click",
            () => {
              toggleEffect(
                instance
                  .instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-up",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectUp(
                instance
                  .instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-down",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectDown(
                instance
                  .instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-remove",
          )
          ?.addEventListener(
            "click",
            () => {
              removeEffect(
                instance
                  .instanceId,
              );
            },
          );

        layersList.appendChild(
          row,
        );
      },
    );
}

function renderEditor(): void {
  renderPreview();
  renderLayers();

  renderInspector(
    inspector,
  );
}

renderEffectButtons();

subscribe(
  renderEditor,
);

document
  .querySelector<HTMLButtonElement>(
    "#clear-preview",
  )
  ?.addEventListener(
    "click",
    clearEffects,
  );

document
  .querySelector<HTMLButtonElement>(
    "#export-stream-elements",
  )
  ?.addEventListener(
    "click",
    () => {
      openExportPanel(
        exportDialog,
      );
    },
  );

addEffect(
  "rainfall",
);
'@

Write-ProjectFile -RelativePath 'src/style.css' -Content @'
* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  width: 100%;
  min-height: 100%;
}

body {
  min-height: 100vh;
  overflow: hidden;
  background: #070a11;
  color: #f3f6ff;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
select,
textarea,
input {
  font: inherit;
}

button {
  border:
    1px solid
    rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 16px;
  background: #171c28;
  color: #ffffff;
  cursor: pointer;
}

button:hover {
  background: #222a3b;
}

.editor {
  min-height: 100vh;
  display: grid;
  grid-template-rows:
    auto
    1fr;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 22px;
  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.08);
  background: #0d111a;
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
}

.topbar p {
  margin: 4px 0 0;
  color: #8290a8;
  font-size: 12px;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.effect-buttons {
  display: contents;
}

.workspace {
  display: grid;
  grid-template-columns:
    280px
    minmax(0, 1fr)
    320px;
  min-height: 0;
}

.preview-shell {
  display: grid;
  place-items: center;
  min-height: 0;
  padding: 24px;
}

#preview-host {
  width: min(
    1280px,
    100%
  );
  aspect-ratio: 16 / 9;
}

.effect-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border:
    1px solid
    rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background:
    radial-gradient(
      circle at 50% 40%,
      rgba(66, 91, 160, 0.22),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #0b101b,
      #090b12
    );
  box-shadow:
    0 24px 80px
    rgba(0, 0, 0, 0.45);
}

.effect-layer,
.ae-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  transform-origin: center;
}

.layers-panel {
  border-right:
    1px solid
    rgba(255, 255, 255, 0.08);
  background: #0c1018;
  padding: 16px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  color: #dce5f5;
  font-size: 12px;
}

#layer-count {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: #20273a;
  color: #9cb0ce;
  font-size: 10px;
}

.layers-list {
  display: grid;
  gap: 8px;
}

.empty-layers {
  padding: 20px 12px;
  border:
    1px dashed
    rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #66758c;
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
}

.layer-row {
  display: grid;
  gap: 7px;
  padding: 9px;
  border:
    1px solid
    rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: #121722;
}

.layer-row.selected {
  border-color:
    rgba(124, 92, 255, 0.75);
  background:
    linear-gradient(
      135deg,
      rgba(124, 92, 255, 0.18),
      rgba(0, 217, 255, 0.04)
    );
}

.layer-main {
  width: 100%;
  display: block;
  padding: 6px 7px;
  text-align: left;
  border: 0;
  background: transparent;
}

.layer-main:hover {
  background:
    rgba(
      255,
      255,
      255,
      0.035
    );
}

.layer-name {
  display: block;
  color: #eff4ff;
  font-size: 11px;
  font-weight: 700;
}

.layer-tech {
  display: block;
  margin-top: 3px;
  color: #677790;
  font-family:
    ui-monospace,
    Consolas,
    monospace;
  font-size: 9px;
}

.layer-actions {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 5px;
}

.layer-actions button {
  padding: 5px;
  font-size: 10px;
}

.inspector-panel {
  border-left:
    1px solid
    rgba(255, 255, 255, 0.08);
  background: #0c1018;
  padding: 16px;
  overflow-y: auto;
}

.inspector-empty {
  padding: 24px 12px;
  border:
    1px dashed
    rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #66758c;
  text-align: center;
  font-size: 11px;
}

.inspector-title {
  margin-bottom: 20px;
  padding: 12px;
  border:
    1px solid
    rgba(124, 92, 255, 0.3);
  border-radius: 12px;
  background:
    rgba(124, 92, 255, 0.08);
}

.inspector-title strong {
  display: block;
  font-size: 13px;
}

.inspector-title span {
  display: block;
  margin-top: 4px;
  color: #70809a;
  font-family:
    ui-monospace,
    Consolas,
    monospace;
  font-size: 9px;
}

.inspector-field {
  display: grid;
  gap: 7px;
  margin-bottom: 15px;
  font-size: 10px;
}

.inspector-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #b9c5d8;
}

.inspector-label output {
  color: #ffffff;
}

.inspector-field
input[type="range"] {
  width: 100%;
}

.inspector-field select {
  width: 100%;
  padding: 9px;
  border:
    1px solid
    rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  background: #151b27;
  color: white;
}

/* Export dialog */

.export-dialog {
  width: min(
    1000px,
    92vw
  );
  max-height: 90vh;
  padding: 0;
  border:
    1px solid
    rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: #0d111a;
  color: #f3f6ff;
  overflow: hidden;
}

.export-dialog::backdrop {
  background:
    rgba(0, 0, 0, 0.7);
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.08);
}

.export-header > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-header
[data-export-metrics] {
  color: #8290a8;
  font-size: 11px;
}

.export-section {
  padding: 14px 16px;
  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.07);
}

.export-section:last-child {
  border-bottom: 0;
}

.export-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.export-section textarea {
  width: 100%;
  min-height: 145px;
  resize: vertical;
  border:
    1px solid
    rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  background: #080b12;
  color: #dce5f5;
  font-family:
    ui-monospace,
    Consolas,
    monospace;
  font-size: 11px;
  line-height: 1.45;
}

@media (
  max-width: 1100px
) {
  .workspace {
    grid-template-columns:
      230px
      minmax(0, 1fr)
      280px;
  }

  .topbar {
    align-items:
      flex-start;
  }
}
'@


Write-Host ""
Write-Host "Pliki zapisane. Uruchamiam TypeScript check..." -ForegroundColor Cyan

Push-Location $ProjectRoot

try {
  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    throw "npx tsc --noEmit zakonczyl sie bledem. Backup jest w: $backupRoot"
  }

  Write-Host ""
  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam npm run build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    throw "npm run build zakonczyl sie bledem. Backup jest w: $backupRoot"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Effects Pack 01 zainstalowany." -ForegroundColor Green
  Write-Host "Efekty:"
  Write-Host "  Rainfall"
  Write-Host "  Snow"
  Write-Host "  Lightning"
  Write-Host "  Hearts"
  Write-Host "  Leaves"
  Write-Host "  Matrix Code"
  Write-Host "  Comets"
  Write-Host "  Starfield"
  Write-Host "  Fog"
  Write-Host ""
  Write-Host "Backup poprzednich plikow:"
  Write-Host "  $backupRoot"
  Write-Host ""
  Write-Host "Nastepnie uruchom npm run dev i sprawdz nowe efekty w przegladarce."
}
finally {
  Pop-Location
}
