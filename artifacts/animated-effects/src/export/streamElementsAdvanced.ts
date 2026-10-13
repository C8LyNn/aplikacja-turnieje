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
import { eventPlaybackInstance, normalizeEffectTrigger, triggerPlaybackDurationMs } from "../animation/triggers";
import { ALERT_WIDGET_RUNTIME } from "../animation/alertRuntime";
import { AVATAR_WIDGET_RUNTIME } from "../animation/avatarRuntime";
import { CAPTION_ANIMATIONS_CSS } from "../animation/captionMotion";

export function generateAdvancedStreamElementsExport(
  state: EditorState,
): StreamElementsExport {
  const enabledEffects =
    state.effects.filter(
      (effect) => effect.enabled,
    );

  const playbackEffects = enabledEffects.map(eventPlaybackInstance);

  const config =
    playbackEffects.map(
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
        trigger: normalizeEffectTrigger(effect.trigger) ?? null,
        playbackMs: triggerPlaybackDurationMs(effect),
      }),
    );

  return {
    html:
      generateHtml(),

    css:
      generateCss(
        playbackEffects,
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

.ae-alert-caption {
  z-index: 9999;
  animation: ae-caption-intro 500ms cubic-bezier(.2,.7,.25,1) both;
}
@keyframes ae-caption-intro {
  from { opacity: 0; translate: 0 12px; }
  to { opacity: 1; translate: 0 0; }
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

${CAPTION_ANIMATIONS_CSS}

${effects.flatMap((effect) => [getLayerTimelineAnimation(effect)?.css, getLayerMotionAnimation(effect)?.css]).filter(Boolean).join("\n")}
`.trim();
}

/** Escape inline-script delimiters without changing the decoded widget config. */
function inlineSafeJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
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
    trigger: EffectInstance["trigger"] | null;
    playbackMs: number;
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
const effects = ${inlineSafeJson(config)};

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

${AVATAR_WIDGET_RUNTIME}

${ALERT_WIDGET_RUNTIME}

const aeRenderers = {
  ${rendererMap}
};

// Per-layer host containers are intentionally separate from particle layers.
function aeRenderOne(effect, root) {
  const renderer = aeRenderers[effect.effectId];
  if (!renderer) {
    console.warn("Animated Effects: unknown effect", effect.effectId);
    return null;
  }
  const host = document.createElement("div");
  host.className = "ae-instance-host";
  host.style.position = "absolute";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = String(effect.settings.zIndex);
  root.appendChild(host);

  let parent = host;
  if (effect.timingAnimation) {
    const wrapper = document.createElement("div");
    wrapper.className = "ae-timed-layer";
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.overflow = "hidden";
    wrapper.style.pointerEvents = "none";
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
    wrapper.style.animation = effect.motionAnimation;
    parent.appendChild(wrapper);
    parent = wrapper;
  }
  renderer(effect, parent);
  if (effect.motionAnimation) {
    Array.from(parent.children).forEach(function (child) {
      if (child.classList && child.classList.contains("ae-layer")) {
        child.style.transform = "none";
      }
    });
  }
  return host;
}

let aeRoot = null;
const aePending = new Map();
const aeActive = new Map();
const aeLastFired = Object.create(null);
const aeQueue = [];
let aeQueuedPlaying = null;
let aeQueuedTimer = null;
const AE_MAX_QUEUED_ALERTS = 16;
const aeCounters = { accepted: 0, started: 0, completed: 0, dropped: 0, evicted: 0 };
let aeReportSequence = 0;

/** Diagnostics are metadata-only: never include viewer names, chat text, amounts,
 * or avatar URLs. Developers can subscribe from browser DevTools. No on-screen UI.
 */
function aeReport(action, effect, reason) {
  if (typeof CustomEvent !== "function" || typeof window.dispatchEvent !== "function") return;
  const snapshot = {
    version: 1,
    sequence: ++aeReportSequence,
    action,
    reason: reason || null,
    instanceId: effect ? effect.instanceId : null,
    event: effect && effect.trigger ? effect.trigger.event : null,
    priority: effect && effect.trigger ? (effect.trigger.priority ?? 5) : null,
    queueLength: aeQueue.length,
    active: aeQueuedPlaying ? "queued" : null,
    waiting: aeQueue.map(function (entry) {
      return {
        instanceId: entry.effect.instanceId,
        event: entry.listener,
        priority: entry.effect.trigger.priority ?? 5,
      };
    }),
    activeReplacements: aeActive.size,
    counters: { ...aeCounters },
  };
  window.dispatchEvent(new CustomEvent("animated-effects:diagnostics", { detail: snapshot }));
}

function aeCompactEvent(listener, eventData) {
  // Do not retain arbitrary-size chat payloads while waiting in the queue.
  const values = aeAlertData(listener, eventData);
  const result = {
    name: values.name,
    amount: values.amount,
    message: values.message,
    text: values.message,
    data: { displayName: values.name, text: values.message },
  };
  if (eventData && typeof eventData === "object") {
    const source = eventData.data && typeof eventData.data === "object" ? eventData.data : eventData;
    if (typeof source.avatar === "string") result.avatar = source.avatar.slice(0, 500);
    if (typeof source.avatarUrl === "string") result.avatarUrl = source.avatarUrl.slice(0, 500);
    if (typeof source.profileImage === "string") result.profileImage = source.profileImage.slice(0, 500);
  }
  return result;
}

function aeNextQueued() {
  if (!aeRoot || aeQueuedPlaying || aeQueue.length === 0) return;
  const next = aeQueue.shift();
  const element = aeRenderOne(next.effect, aeRoot);
  if (!element) {
    aeCounters.dropped++;
    aeReport("dropped", next.effect, "unknown-effect");
    aeNextQueued();
    return;
  }
  aeAttachCaption(element, next.effect.trigger.caption, next.listener, next.eventData, next.effect.playbackMs);
  aeQueuedPlaying = element;
  aeCounters.started++;
  aeReport("started", next.effect, "queue");
  aeQueuedTimer = setTimeout(function () {
    if (aeQueuedPlaying === element) {
      element.remove();
      aeQueuedPlaying = null;
      aeCounters.completed++;
      aeReport("completed", next.effect, "queue");
    }
    aeQueuedTimer = null;
    aeNextQueued();
  }, next.effect.playbackMs);
}

function startAnimatedEffects() {
  const root = document.getElementById("animated-effects-root");
  if (!root) {
    console.error("Animated Effects: #animated-effects-root not found.");
    return;
  }
  for (const timer of aePending.values()) clearTimeout(timer);
  aePending.clear();
  aeActive.clear();
  aeQueue.length = 0;
  if (aeQueuedTimer !== null) clearTimeout(aeQueuedTimer);
  aeQueuedTimer = null;
  aeQueuedPlaying = null;
  for (const key of Object.keys(aeCounters)) aeCounters[key] = 0;
  aeReportSequence = 0;
  for (const id of Object.keys(aeLastFired)) delete aeLastFired[id];
  aeRoot = root;
  root.replaceChildren();
  effects.forEach(function (effect) {
    if (effect.trigger && effect.trigger.source === "event") return;
    aeRenderOne(effect, root);
  });
  aeReport("ready", null, "widget-load");
  console.log("Animated Effects ready:", effects.length, "effect(s)");
}

function aeHandleEvent(obj) {
  const detail = obj && obj.detail;
  if (!aeRoot || !detail || typeof detail.listener !== "string") return;
  const eventData = detail.event;
  const now = Date.now();
  effects.forEach(function (effect) {
    const rule = effect.trigger;
    if (!rule || rule.source !== "event" || rule.event !== detail.listener) return;
    const last = aeLastFired[effect.instanceId];
    if (typeof last === "number" && now - last < rule.cooldownMs) {
      aeCounters.dropped++;
      aeReport("dropped", effect, "cooldown");
      return;
    }
    if (
      rule.minAmount > 0 &&
      (rule.event === "tip-latest" || rule.event === "cheer-latest" || rule.event === "raid-latest")
    ) {
      const amount = eventData && typeof eventData === "object"
        ? Number(eventData.amount) : NaN;
      if (!Number.isFinite(amount) || amount < rule.minAmount) {
        aeCounters.dropped++;
        aeReport("dropped", effect, "below-threshold");
        return;
      }
    }

    if (rule.queueMode === "queue") {
      // Stable priority queue: higher priority is played sooner while equal
      // priorities keep arrival order. The current alert is never preempted.
      const priority = typeof rule.priority === "number" ? rule.priority : 5;
      const firstLower = aeQueue.findIndex(function (entry) {
        const other = entry.effect.trigger.priority;
        return (typeof other === "number" ? other : 5) < priority;
      });
      if (aeQueue.length >= AE_MAX_QUEUED_ALERTS) {
        if (firstLower < 0) {
          aeCounters.dropped++;
          aeReport("dropped", effect, "queue-full");
          return; // Do not evict an equal or higher-priority alert.
        }
        const removed = aeQueue.pop(); // Lowest priority, newest first.
        aeCounters.evicted++;
        aeReport("evicted", removed.effect, "lower-priority");
      }
      const candidate = {
        effect,
        listener: detail.listener,
        eventData: aeCompactEvent(detail.listener, eventData),
      };
      if (firstLower < 0) aeQueue.push(candidate);
      else aeQueue.splice(firstLower, 0, candidate);
      // Admission control is performed on arrival, not on playback.
      aeLastFired[effect.instanceId] = now;
      aeCounters.accepted++;
      aeReport("accepted", effect, "queue");
      aeNextQueued();
      return;
    }

    const old = aeActive.get(effect.instanceId);
    if (old) {
      old.remove();
      aeReport("replaced", effect, "restart");
    }
    const timer = aePending.get(effect.instanceId);
    if (timer !== undefined) clearTimeout(timer);

    const element = aeRenderOne(effect, aeRoot);
    if (!element) {
      aeCounters.dropped++;
      aeReport("dropped", effect, "unknown-effect");
      return;
    }
    aeCounters.accepted++;
    aeCounters.started++;
    aeReport("started", effect, "replace");
    aeAttachCaption(element, rule.caption, detail.listener, eventData, effect.playbackMs);
    aeLastFired[effect.instanceId] = now;
    aeActive.set(effect.instanceId, element);
    aePending.set(effect.instanceId, setTimeout(function () {
      if (aeActive.get(effect.instanceId) === element) {
        element.remove();
        aeActive.delete(effect.instanceId);
        aeCounters.completed++;
        aeReport("completed", effect, "replace");
      }
      aePending.delete(effect.instanceId);
    }, effect.playbackMs));
  });
}

window.addEventListener("onWidgetLoad", startAnimatedEffects);
window.addEventListener("onEventReceived", aeHandleEvent);
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
/** Compatibility alias for the original per-layer event exporter test suite. */
export const generateStreamElementsExport = generateAdvancedStreamElementsExport;
