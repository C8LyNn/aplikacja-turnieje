import type {
  EffectInstance,
  EffectSettings,
} from "../core/types";

import {
  getAllEffectModules,
  getEffectModule,
} from "../effects/registry";
import { getLayerTimelineAnimation } from "../animation/timeline";
import { getLayerMotionAnimation } from "../animation/motion";

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

  const timing = getLayerTimelineAnimation(instance);
  const motion = getLayerMotionAnimation(instance);
  // Keep the visibility envelope, animated pose and effect-internal
  // particle transforms on separate elements to prevent CSS conflicts.
  let parent: HTMLElement = preview;
  for (const [animation, className] of [
    [timing, "ae-timed-layer"],
    [motion, "ae-motion-layer"],
  ] as const) {
    if (!animation) continue;
    const style = document.createElement("style");
    style.textContent = animation.css;
    preview.appendChild(style);
    const wrapper = document.createElement("div");
    wrapper.className = className;
    Object.assign(wrapper.style, {
      position: "absolute",
      inset: "0",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: String(instance.settings.zIndex),
      animation: animation.animation,
    });
    parent.appendChild(wrapper);
    parent = wrapper;
  }
  if (motion) {
    // The motion wrapper now carries the complete pose.
    layer.style.transform = "none";
  }
  parent.appendChild(layer);
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

function hexToHsl(
  hex: string,
): {
  h: number;
  s: number;
  l: number;
} {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16,
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16,
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16,
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
            1,
          )
        );

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

function getColorizeFilter(
  settings: EffectSettings,
): string {
  if (!settings.colorize) {
    return "";
  }

  const { h, s, l } =
    hexToHsl(
      settings.color ?? "#a88cff",
    );

  if (s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          l / 70,
        ),
      );

    return `
      grayscale(1)
      saturate(0)
      brightness(
        ${whiteBrightness}
      )
    `;
  }

  const saturation =
    Math.round(
      380 +
      s * 10,
    );

  const rotate =
    h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        l / 105,
      ),
    );

  return `
    grayscale(1)
    sepia(1)
    saturate(
      ${saturation}%
    )
    hue-rotate(
      ${rotate}deg
    )
    brightness(
      ${colorBrightness}
    )
  `;
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
    ${getColorizeFilter(
      settings,
    )}
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