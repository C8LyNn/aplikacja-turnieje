import type {
  EditorState,
  EffectInstance,
  StreamElementsExport,
} from "../core/types";

import {
  getEffectModule,
} from "../effects/registry";
import { getLayerTimelineAnimation } from "../animation/timeline";
import { getLayerMotionAnimation } from "../animation/motion";

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
        timingAnimation: getLayerTimelineAnimation(effect)?.animation ?? null,
        motionAnimation: getLayerMotionAnimation(effect)?.animation ?? null,
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

${effects.flatMap((effect) => [getLayerTimelineAnimation(effect)?.css, getLayerMotionAnimation(effect)?.css]).filter(Boolean).join("\n")}
`.trim();
}

function generateJavaScript(
  config: Array<{
    instanceId: string;
    effectId: string;
    seed: number;
    settings:
      EffectInstance["settings"];
    timingAnimation: string | null;
    motionAnimation: string | null;
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

function aeHexToHsl(hex) {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16
    ) / 255;

  const max =
    Math.max(r, g, b);

  const min =
    Math.min(r, g, b);

  const delta =
    max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h =
        60 *
        (
          (
            (g - b) /
            delta
          ) %
          6
        );
    } else if (max === g) {
      h =
        60 *
        (
          (b - r) /
          delta +
          2
        );
    } else {
      h =
        60 *
        (
          (r - g) /
          delta +
          4
        );
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l =
    (max + min) / 2;

  const s =
    delta === 0
      ? 0
      : delta /
        (
          1 -
          Math.abs(
            2 * l -
            1
          )
        );

  return {
    h: h,
    s: s * 100,
    l: l * 100
  };
}

function aeColorizeFilter(s) {
  if (!s.colorize) {
    return "";
  }

  const hsl =
    aeHexToHsl(
      s.color || "#a88cff"
    );

  if (hsl.s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          hsl.l / 70
        )
      );

    return (
      "grayscale(1) " +
      "saturate(0) " +
      "brightness(" +
      whiteBrightness +
      ") "
    );
  }

  const saturation =
    Math.round(
      380 +
      hsl.s * 10
    );

  const rotate =
    hsl.h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        hsl.l / 105
      )
    );

  return (
    "grayscale(1) " +
    "sepia(1) " +
    "saturate(" +
    saturation +
    "%) " +
    "hue-rotate(" +
    rotate +
    "deg) " +
    "brightness(" +
    colorBrightness +
    ") "
  );
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
    aeColorizeFilter(s) +
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

      let parent = root;
      if (effect.timingAnimation) {
        const wrapper = document.createElement("div");
        wrapper.className = "ae-timed-layer";
        wrapper.style.position = "absolute";
        wrapper.style.inset = "0";
        wrapper.style.overflow = "hidden";
        wrapper.style.pointerEvents = "none";
        wrapper.style.zIndex = String(effect.settings.zIndex);
        wrapper.style.animation = effect.timingAnimation;
        parent.appendChild(wrapper);
        parent = wrapper;
      }
      if (effect.motionAnimation) {
        const wrapper = document.createElement("div");
        wrapper.className = "ae-motion-layer";
        wrapper.style.position = "absolute";
        wrapper.style.inset = "0";
        wrapper.style.overflow = "hidden";
        wrapper.style.pointerEvents = "none";
        wrapper.style.zIndex = String(effect.settings.zIndex);
        wrapper.style.animation = effect.motionAnimation;
        parent.appendChild(wrapper);
        parent = wrapper;
      }
      renderer(effect, parent);
      if (effect.motionAnimation) {
        // Source renderers use aeCreateLayer(), which sets a base transform.
        // Move that transform entirely to the motion wrapper.
        Array.from(parent.children).forEach(function (child) {
          if (child.classList && child.classList.contains("ae-layer")) {
            child.style.transform = "none";
          }
        });
      }
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