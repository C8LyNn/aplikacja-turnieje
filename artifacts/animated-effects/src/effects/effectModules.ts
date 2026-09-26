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
    color: "#a88cff",
  colorize: false,
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
    description: "SpadajÄ…ce krople deszczu.",
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
    description: "SpadajÄ…ce pĹ‚atki Ĺ›niegu.",
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
    description: "Losowe bĹ‚yski i pioruny.",
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
      "UnoszÄ…ce siÄ™ animowane serduszka.",
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

      heart.innerHTML = "&#10084;";

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
    heart.innerHTML = "&#10084;";
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
      "WirujÄ…ce, opadajÄ…ce liĹ›cie.",
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
      "Kolumny opadajÄ…cego cyfrowego kodu.",
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
      "Szybkie Ĺ›wietliste komety przecinajÄ…ce ekran.",
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
      "MigoczÄ…ce gwiazdy w tle.",
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
      "Powolne warstwy mgĹ‚y przesuwajÄ…ce siÄ™ przez ekran.",
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
    description: "Ĺ»arzÄ…ce siÄ™ drobiny unoszÄ…ce siÄ™ ku gĂłrze.",
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
    description: "MiÄ™kkie, pĂłĹ‚przezroczyste chmury przesuwajÄ…ce siÄ™ po ekranie.",
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
    description: "Krople deszczu spĹ‚ywajÄ…ce po wirtualnej szybie.",
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
    description: "Kolorowe kule odbijajÄ…ce siÄ™ i dryfujÄ…ce po ekranie.",
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
    description: "ĹšwiecÄ…ce neonowe smugi przesuwajÄ…ce siÄ™ przez ekran.",
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
    description: "PulsujÄ…ce, Ĺ›wiecÄ…ce kule energii.",
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
    description: "Delikatne pĹ‚atki opadajÄ…ce i wirujÄ…ce na wietrze.",
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
    description: "Jasne iskry wystrzeliwujÄ…ce ku gĂłrze.",
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
    description: "PulsujÄ…ce obĹ‚oki plazmy i neonowej energii.",
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
    description: "RozchodzÄ…ce siÄ™ neonowe fale energii.",
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
    description:
      "\u015Awiec\u0105ce runy Elder Futhark unosz\u0105ce si\u0119 w tle.",
    category: "fantasy",
    tags: [
      "runes",
      "elder-futhark",
      "magic",
      "fantasy",
      "symbols",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 78,
      density: 50,
      speed: 55,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: runesCss,

  streamElementsRendererName:
    "aeRenderRunes",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const chars = ["\u16A0","\u16A2","\u16A6","\u16A8","\u16B1","\u16B2","\u16B7","\u16B9","\u16BA","\u16BE","\u16C1","\u16C3","\u16C7","\u16C8","\u16C9","\u16CA","\u16CF","\u16D2","\u16D6","\u16D7","\u16DA","\u16DC","\u16DE","\u16DF"];

    const count =
      particleCount(
        24,
        settings,
        1,
      );

    const speed =
      Math.max(
        .1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const rune =
        document.createElement(
          "span",
        );

      rune.className =
        "ae-rune";

      rune.textContent =
        chars[
          Math.floor(
            random() *
              chars.length,
          )
        ] ?? "\u16A0";

      rune.style.left =
        `${random() * 95}%`;

      rune.style.top =
        `${random() * 92}%`;

      rune.style.fontSize =
        `${18 + random() * 36}px`;

      rune.style.animationDelay =
        `${-random() * 9}s`;

      rune.style.animationDuration =
        `${
          (6 + random() * 7) /
          speed
        }s`;

      rune.style.setProperty(
        "--ae-rune-x",
        `${
          -45 +
          random() * 90
        }px`,
      );

      rune.style.setProperty(
        "--ae-rune-y",
        `${
          -55 +
          random() * 110
        }px`,
      );

      layer.appendChild(
        rune,
      );
    }
  },

  streamElementsRendererSource: `
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

const magicDust: EffectModule = {
  definition: makeDefinition({
    id: "magic-dust",
    name: "Magic Dust",
    description: "MigoczÄ…cy magiczny pyĹ‚ i drobne iskierki.",
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

function startPreviewPong(
  layer: HTMLElement,
  settings: EffectSettings,
  random: () => number,
): void {
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
    ball,
  );

  layer.appendChild(arena);

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
    settings.speed / 100,
  );

  const aiSkill = Math.max(
    0.1,
    Math.min(
      1,
      settings.density / 100,
    ),
  );

  // intensity = przyspieszenie Ponga.
  // 0 oznacza caĹ‚kowicie staĹ‚Ä… prÄ™dkoĹ›Ä‡ po odbiciach.
  const accelerationAmount = Math.max(
    0,
    Math.min(
      1,
      settings.intensity / 100,
    ),
  );

  const accelerationPerHit =
    0.0125 * accelerationAmount;

  const maxSpeedMultiplier =
    1 + 0.8 * accelerationAmount;

  const maxBounceAngle =
    52 * Math.PI / 180;

  const updateScores = (): void => {
    leftScoreElement.textContent = String(leftScore);
    rightScoreElement.textContent = String(rightScore);
  };

  const updateGeometry = (): boolean => {
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
      width * 0.009,
    );

    paddleHeight = Math.max(
      58,
      height * 0.22,
    );

    ballSize = Math.max(
      12,
      Math.min(
        20,
        Math.min(width, height) * 0.026,
      ),
    );

    margin = Math.max(
      22,
      width * 0.045,
    );

    baseBallSpeed =
      Math.max(
        210,
        Math.min(width, height) * 0.58,
      ) * speedScale;

    leftPaddle.style.width = `${paddleWidth}px`;
    leftPaddle.style.height = `${paddleHeight}px`;

    rightPaddle.style.width = `${paddleWidth}px`;
    rightPaddle.style.height = `${paddleHeight}px`;

    ball.style.width = `${ballSize}px`;
    ball.style.height = `${ballSize}px`;

    if (changed && initialized) {
      leftY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          leftY,
        ),
      );

      rightY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          rightY,
        ),
      );

      leftAimY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          leftAimY,
        ),
      );

      rightAimY = Math.max(
        0,
        Math.min(
          height - paddleHeight,
          rightAimY,
        ),
      );

      ballX = Math.max(
        -ballSize,
        Math.min(
          width,
          ballX,
        ),
      );

      ballY = Math.max(
        0,
        Math.min(
          height - ballSize,
          ballY,
        ),
      );
    }

    return true;
  };

  const resetBall = (
    direction: -1 | 1,
  ): void => {
    ballX =
      width / 2 -
      ballSize / 2;

    ballY =
      height / 2 -
      ballSize / 2;

    const serveAngle =
      (
        12 +
        random() * 20
      ) *
      Math.PI / 180 *
      (random() < 0.5 ? -1 : 1);

    velocityX =
      direction *
      baseBallSpeed *
      Math.cos(serveAngle);

    velocityY =
      baseBallSpeed *
      Math.sin(serveAngle);
  };

  const initialize = (): void => {
    if (!updateGeometry()) {
      return;
    }

    leftY =
      height / 2 -
      paddleHeight / 2;

    rightY = leftY;

    leftPaddleVelocity = 0;
    rightPaddleVelocity = 0;

    leftAimY = leftY;
    rightAimY = rightY;

    resetBall(
      random() < 0.5 ? -1 : 1,
    );

    updateScores();
    initialized = true;
    lastTime = performance.now();
  };

  const smoothPaddleStep = (
    current: number,
    velocity: number,
    target: number,
    maxSpeed: number,
    maxAcceleration: number,
    response: number,
    dt: number,
  ): {
    position: number;
    velocity: number;
  } => {
    const distance =
      target - current;

    const desiredVelocity =
      Math.max(
        -maxSpeed,
        Math.min(
          maxSpeed,
          distance * response,
        ),
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
          velocityDelta,
        ),
      );

    let nextPosition =
      current +
      nextVelocity * dt;

    const maxY =
      Math.max(
        0,
        height - paddleHeight,
      );

    if (nextPosition < 0) {
      nextPosition = 0;

      return {
        position: nextPosition,
        velocity: Math.max(
          0,
          nextVelocity,
        ),
      };
    }

    if (nextPosition > maxY) {
      nextPosition = maxY;

      return {
        position: nextPosition,
        velocity: Math.min(
          0,
          nextVelocity,
        ),
      };
    }

    return {
      position: nextPosition,
      velocity: nextVelocity,
    };
  };

  const bounceFromPaddle = (
    direction: -1 | 1,
    paddleY: number,
  ): void => {
    const currentSpeed = Math.max(
      baseBallSpeed,
      Math.hypot(
        velocityX,
        velocityY,
      ),
    );

    const maxBallSpeed =
      baseBallSpeed *
      maxSpeedMultiplier;

    const nextSpeed = Math.min(
      maxBallSpeed,
      currentSpeed *
        (1 + accelerationPerHit),
    );

    const ballCenterY =
      ballY + ballSize / 2;

    const hit = Math.max(
      -1,
      Math.min(
        1,
        (
          ballCenterY -
          (
            paddleY +
            paddleHeight / 2
          )
        ) /
          (paddleHeight / 2),
      ),
    );

    const maxVerticalRatio =
      Math.sin(
        maxBounceAngle,
      );

    const currentVerticalRatio = Math.max(
      -maxVerticalRatio,
      Math.min(
        maxVerticalRatio,
        velocityY / currentSpeed,
      ),
    );

    const targetVerticalRatio =
      hit * maxVerticalRatio;

    // Miejsce trafienia tylko delikatnie koryguje tor.
    // Nie narzucamy nagle nowego kata po kontakcie.
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
              minHorizontalRatio,
        ),
      );

    const verticalRatio = Math.max(
      -maxVerticalForHorizontal,
      Math.min(
        maxVerticalForHorizontal,
        nextVerticalRatio,
      ),
    );

    velocityY =
      nextSpeed * verticalRatio;

    const horizontalSpeed =
      Math.sqrt(
        Math.max(
          0,
          nextSpeed * nextSpeed -
            velocityY * velocityY,
        ),
      );

    velocityX =
      direction * horizontalSpeed;
  };

  const scorePoint = (
    scorer: "left" | "right",
  ): void => {
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
        : 1,
    );
  };

  const simulateBall = (
    dt: number,
  ): void => {
    const leftX = margin;
    const rightX =
      width - margin - paddleWidth;

    const epsilon = 0.000001;
    let remaining = dt;
    let iterations = 0;

    type CollisionType =
      | "top"
      | "bottom"
      | "left-paddle"
      | "right-paddle"
      | "left-score"
      | "right-score";

    while (
      remaining > epsilon &&
      iterations < 12
    ) {
      iterations += 1;

      let collisionTime =
        remaining + 1;

      let collision:
        CollisionType | null = null;

      const consider = (
        time: number,
        type: CollisionType,
      ): void => {
        if (
          time >= -epsilon &&
          time <= remaining + epsilon &&
          time < collisionTime
        ) {
          collisionTime = Math.max(0, time);
          collision = type;
        }
      };

      if (velocityY < -epsilon) {
        consider(
          (0 - ballY) / velocityY,
          "top",
        );
      }

      if (velocityY > epsilon) {
        consider(
          (
            height - ballSize - ballY
          ) / velocityY,
          "bottom",
        );
      }

      if (velocityX < -epsilon) {
        const contactX =
          leftX + paddleWidth;

        const paddleTime =
          (contactX - ballX) /
          velocityX;

        if (
          paddleTime >= -epsilon &&
          paddleTime <= remaining + epsilon
        ) {
          const yAtContact =
            ballY +
            velocityY *
              Math.max(0, paddleTime);

          if (
            yAtContact + ballSize >= leftY &&
            yAtContact <= leftY + paddleHeight
          ) {
            consider(
              paddleTime,
              "left-paddle",
            );
          }
        }

        consider(
          (
            -ballSize - ballX
          ) / velocityX,
          "right-score",
        );
      }

      if (velocityX > epsilon) {
        const contactX =
          rightX - ballSize;

        const paddleTime =
          (contactX - ballX) /
          velocityX;

        if (
          paddleTime >= -epsilon &&
          paddleTime <= remaining + epsilon
        ) {
          const yAtContact =
            ballY +
            velocityY *
              Math.max(0, paddleTime);

          if (
            yAtContact + ballSize >= rightY &&
            yAtContact <= rightY + paddleHeight
          ) {
            consider(
              paddleTime,
              "right-paddle",
            );
          }
        }

        consider(
          (width - ballX) / velocityX,
          "left-score",
        );
      }

      if (collision === null) {
        ballX += velocityX * remaining;
        ballY += velocityY * remaining;
        remaining = 0;
        break;
      }

      // Przesuwamy pilke dokladnie do chwili kontaktu.
      // Nie ma juz korekty pozycji o kilka pikseli po penetracji paletki.
      ballX +=
        velocityX * collisionTime;
      ballY +=
        velocityY * collisionTime;
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
          0.00001,
        );

        ballX += velocityX * nudge;
        ballY += velocityY * nudge;
        remaining -= nudge;
      }
    }
  };

  const frame = (
    now: number,
  ): void => {
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
        0,
      ),
      1 / 30,
    );

    lastTime = now;

    const paddleSpeed =
      height *
      (
        0.72 +
        aiSkill * 0.58
      ) *
      speedScale;

    const paddleAcceleration =
      height *
      (
        2.2 +
        aiSkill * 2.8
      ) *
      speedScale;

    const paddleResponse =
      4.2 +
      aiSkill * 3.2;

    const aimResponse =
      2.8 +
      aiSkill * 2.4;

    const errorAmplitude =
      (
        1 - aiSkill
      ) *
      paddleHeight *
      0.72;

    const ballCenterY =
      ballY +
      ballSize / 2;

    const leftError =
      Math.sin(
        now * 0.0013 + 0.8,
      ) *
      errorAmplitude;

    const rightError =
      Math.sin(
        now * 0.00117 + 2.2,
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
        height - paddleHeight,
      );

    const clampedLeftTarget =
      Math.max(
        0,
        Math.min(
          maxPaddleY,
          rawLeftTarget,
        ),
      );

    const clampedRightTarget =
      Math.max(
        0,
        Math.min(
          maxPaddleY,
          rawRightTarget,
        ),
      );

    const aimBlend =
      1 -
      Math.exp(
        -aimResponse * dt,
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
        dt,
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
        dt,
      );

    rightY =
      rightStep.position;

    rightPaddleVelocity =
      rightStep.velocity;

    simulateBall(dt);

    const leftX = margin;
    const rightX =
      width -
      margin -
      paddleWidth;

    leftPaddle.style.transform =
      `translate3d(${leftX}px, ${leftY}px, 0)`;

    rightPaddle.style.transform =
      `translate3d(${rightX}px, ${rightY}px, 0)`;

    ball.style.transform =
      `translate3d(${ballX}px, ${ballY}px, 0)`;

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

const pong: EffectModule = {
  definition: makeDefinition({
    id: "pong",
    name: "Retro Pong",
    description:
      "PĹ‚ynna rozgrywka Pong z AI, wynikiem i regulowanym przyspieszeniem.",
    category: "retro",
    tags: [
      "pong",
      "retro",
      "arcade",
      "game",
      "physics",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 82,
      density: 62,
      speed: 90,
      intensity: 0,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: pongCss,

  streamElementsRendererName:
    "aeRenderPong",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    startPreviewPong(
      layer,
      settings,
      random,
    );
  },

  streamElementsRendererSource: `
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
`.trim(),

  estimateDomNodes() {
    return 7;
  },
};


const bubbles: EffectModule = {
  definition: makeDefinition({
    id: "bubbles",
    name: "Bubbles",
    description: "Przezroczyste bÄ…belki unoszÄ…ce siÄ™ ku gĂłrze.",
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
    description: "MigoczÄ…ce Ĺ›wietliki poruszajÄ…ce siÄ™ w ciemnoĹ›ci.",
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
    description: "Kolorowe konfetti opadajÄ…ce przez ekran.",
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
    description: "Subtelny kurz unoszÄ…cy siÄ™ w Ĺ›wietle.",
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
    description: "MiÄ™kkie, kolorowe pasma zorzy polarnej.",
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

/* === EFFECTS_PACK_03_END === */

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
    embers,
    clouds,
    rainGlass,
    bouncingBalls,
    neonLines,
    energyOrbs,
    petals,
    sparks,
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
    scanlinesPlus,
    equalizerBars,
    hudGrid,
    floatingSymbols,
    smokeWisps,
    electricArcs,
    snowBurst,
    meteorShower,
  ];