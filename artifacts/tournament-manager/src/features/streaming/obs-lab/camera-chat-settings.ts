export type CameraChatLayout = "right" | "below" | "overlay";
export type CameraChatAspectRatio = "16:9" | "4:3" | "1:1";
export type CameraChatFontSize = "small" | "medium" | "large";
export type CameraChatDensity = "compact" | "normal" | "relaxed";
export type CameraChatAnchor = "top" | "bottom";
export type CameraChatMotionPreset = "rise" | "slide" | "pop" | "fade" | "bounce" | "flip" | "wipe";
export type CameraChatAnimationStyle = CameraChatMotionPreset | "random";

export const CHAT_MOTION_PRESETS: readonly CameraChatMotionPreset[] =
  ["rise", "slide", "pop", "fade", "bounce", "flip", "wipe"];

/** Pick a stable visual motion for each message, not a new one on every render. */
export function pickChatMotion(key: string): CameraChatMotionPreset {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0;
  }
  return CHAT_MOTION_PRESETS[hash % CHAT_MOTION_PRESETS.length];
}

export function resolveChatMotion(style: CameraChatAnimationStyle, key: string): CameraChatMotionPreset {
  return style === "random" ? pickChatMotion(key) : style;
}
export type CameraChatOverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CameraChatConfig = {
  layout: CameraChatLayout;
  aspectRatio: CameraChatAspectRatio;

  cameraWidth: number;
  chatWidth: number;
  belowHeight: number;

  maxMessages: number;

  fontSize: CameraChatFontSize;
  density: CameraChatDensity;

  panelOpacity: number;
  radius: number;
  gap: number;
  innerPadding: number;

  chatAnchor: CameraChatAnchor;

  overlayPosition: CameraChatOverlayPosition;
  overlayInset: number;

  fitChatHeight: boolean;

  showAvatars: boolean;
  showBorders: boolean;
  messageBackground: boolean;
  fadeOldMessages: boolean;
  animateMessages: boolean;
  animationStyle: CameraChatAnimationStyle;
  animationDurationMs: number;
};

export const DEFAULT_CAMERA_CHAT_CONFIG: CameraChatConfig = {
  layout: "right",
  aspectRatio: "16:9",

  cameraWidth: 640,
  chatWidth: 32,
  belowHeight: 150,

  maxMessages: 5,

  fontSize: "medium",
  density: "normal",

  panelOpacity: 72,
  radius: 22,
  gap: 0,
  innerPadding: 12,

  chatAnchor: "bottom",

  overlayPosition: "bottom-right",
  overlayInset: 14,

  fitChatHeight: true,

  showAvatars: false,
  showBorders: true,
  messageBackground: true,
  fadeOldMessages: true,
  animateMessages: true,
  animationStyle: "rise",
  animationDurationMs: 220,
};

// The same keyframes power the React chat preview and the standalone SE widget.
export function getCameraChatAnimationCss(
  style: CameraChatAnimationStyle,
  name: string,
): string {
  if (style === "random") {
    return CHAT_MOTION_PRESETS.map((preset) =>
      getCameraChatAnimationCss(preset, `${name}-${preset}`),
    ).join("\n");
  }
  const from: Record<CameraChatMotionPreset, string> = {
    rise: "opacity: 0; transform: translateY(14px) scale(.98);",
    slide: "opacity: 0; transform: translateX(-22px);",
    pop: "opacity: 0; transform: scale(.78);",
    fade: "opacity: 0; transform: none;",
    bounce: "opacity: 0; transform: translateY(24px) scale(.92);",
    flip: "opacity: 0; transform: perspective(360px) rotateX(-78deg); transform-origin: top center;",
    wipe: "opacity: 0; clip-path: inset(0 100% 0 0);",
  };
  if (style === "bounce") {
    return `@keyframes ${name} { 0% { ${from[style]} } 65% { opacity: 1; transform: translateY(-5px) scale(1.03); } 100% { opacity: 1; transform: none; } }`;
  }
  return `@keyframes ${name} { from { ${from[style]} } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); } }`;
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function numberParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = params.get(key);

  if (raw === null) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return clamp(value, min, max);
}

function booleanParam(
  params: URLSearchParams,
  key: string,
  fallback: boolean,
) {
  const raw = params.get(key);

  if (raw === null) {
    return fallback;
  }

  return raw === "1" || raw === "true";
}

export function getCameraHeight(
  width: number,
  ratio: CameraChatAspectRatio,
) {
  if (ratio === "4:3") {
    return Math.round(width * 0.75);
  }

  if (ratio === "1:1") {
    return width;
  }

  return Math.round(width * 9 / 16);
}

export function getCameraChatSize(
  config: CameraChatConfig,
) {
  const cameraHeight =
    getCameraHeight(
      config.cameraWidth,
      config.aspectRatio,
    );

  const chatWidthPx =
    Math.round(
      config.cameraWidth *
        config.chatWidth /
        100,
    );

  if (config.layout === "right") {
    return {
      width:
        config.cameraWidth +
        config.gap +
        chatWidthPx,
      height: cameraHeight,
      cameraHeight,
      chatWidthPx,
    };
  }

  if (config.layout === "below") {
    return {
      width: config.cameraWidth,
      height:
        cameraHeight +
        config.gap +
        config.belowHeight,
      cameraHeight,
      chatWidthPx,
    };
  }

  return {
    width: config.cameraWidth,
    height: cameraHeight,
    cameraHeight,
    chatWidthPx,
  };
}

export function cameraChatConfigToSearch(
  config: CameraChatConfig,
) {
  const params = new URLSearchParams();

  params.set("layout", config.layout);
  params.set("ratio", config.aspectRatio);

  params.set(
    "cw",
    String(config.cameraWidth),
  );

  params.set(
    "chatw",
    String(config.chatWidth),
  );

  params.set(
    "belowh",
    String(config.belowHeight),
  );

  params.set(
    "messages",
    String(config.maxMessages),
  );

  params.set("font", config.fontSize);
  params.set("density", config.density);

  params.set(
    "opacity",
    String(config.panelOpacity),
  );

  params.set(
    "radius",
    String(config.radius),
  );

  params.set(
    "gap",
    String(config.gap),
  );

  params.set(
    "padding",
    String(config.innerPadding),
  );

  params.set(
    "anchor",
    config.chatAnchor,
  );

  params.set(
    "position",
    config.overlayPosition,
  );

  params.set(
    "inset",
    String(config.overlayInset),
  );

  params.set(
    "fit",
    config.fitChatHeight ? "1" : "0",
  );

  params.set(
    "avatars",
    config.showAvatars ? "1" : "0",
  );

  params.set(
    "borders",
    config.showBorders ? "1" : "0",
  );

  params.set(
    "msgbg",
    config.messageBackground ? "1" : "0",
  );

  params.set(
    "fade",
    config.fadeOldMessages ? "1" : "0",
  );

  params.set(
    "anim",
    config.animateMessages ? "1" : "0",
  );
  params.set("animstyle", config.animationStyle);
  params.set("animdur", String(config.animationDurationMs));

  return params.toString();
}

export function cameraChatConfigFromSearch(
  search: string,
): CameraChatConfig {
  const params = new URLSearchParams(
    search.startsWith("?")
      ? search.slice(1)
      : search,
  );

  const defaults =
    DEFAULT_CAMERA_CHAT_CONFIG;

  const layoutRaw =
    params.get("layout");

  const layout: CameraChatLayout =
    layoutRaw === "below" ||
    layoutRaw === "overlay"
      ? layoutRaw
      : "right";

  const ratioRaw =
    params.get("ratio");

  const aspectRatio: CameraChatAspectRatio =
    ratioRaw === "4:3" ||
    ratioRaw === "1:1"
      ? ratioRaw
      : "16:9";

  const fontRaw =
    params.get("font");

  const fontSize: CameraChatFontSize =
    fontRaw === "small" ||
    fontRaw === "large"
      ? fontRaw
      : "medium";

  const densityRaw =
    params.get("density");

  const density: CameraChatDensity =
    densityRaw === "compact" ||
    densityRaw === "relaxed"
      ? densityRaw
      : "normal";

  const anchorRaw =
    params.get("anchor");

  const chatAnchor: CameraChatAnchor =
    anchorRaw === "top"
      ? "top"
      : "bottom";

  const positionRaw =
    params.get("position");

  const overlayPosition:
    CameraChatOverlayPosition =
      positionRaw === "top-left" ||
      positionRaw === "top-right" ||
      positionRaw === "bottom-left"
        ? positionRaw
        : "bottom-right";

  const animationRaw = params.get("animstyle");
  const animationStyle: CameraChatAnimationStyle =
    animationRaw !== null && (CHAT_MOTION_PRESETS as readonly string[]).includes(animationRaw)
      ? animationRaw as CameraChatMotionPreset
      : animationRaw === "random" ? "random" : "rise";

  return {
    layout,
    aspectRatio,

    cameraWidth: numberParam(
      params,
      "cw",
      defaults.cameraWidth,
      240,
      1920,
    ),

    chatWidth: numberParam(
      params,
      "chatw",
      defaults.chatWidth,
      15,
      70,
    ),

    belowHeight: numberParam(
      params,
      "belowh",
      defaults.belowHeight,
      60,
      500,
    ),

    maxMessages: numberParam(
      params,
      "messages",
      defaults.maxMessages,
      1,
      20,
    ),

    fontSize,
    density,

    panelOpacity: numberParam(
      params,
      "opacity",
      defaults.panelOpacity,
      0,
      100,
    ),

    radius: numberParam(
      params,
      "radius",
      defaults.radius,
      0,
      80,
    ),

    gap: numberParam(
      params,
      "gap",
      defaults.gap,
      0,
      100,
    ),

    innerPadding: numberParam(
      params,
      "padding",
      defaults.innerPadding,
      0,
      50,
    ),

    chatAnchor,

    overlayPosition,

    overlayInset: numberParam(
      params,
      "inset",
      defaults.overlayInset,
      0,
      100,
    ),

    fitChatHeight: booleanParam(
      params,
      "fit",
      defaults.fitChatHeight,
    ),

    showAvatars: booleanParam(
      params,
      "avatars",
      defaults.showAvatars,
    ),

    showBorders: booleanParam(
      params,
      "borders",
      defaults.showBorders,
    ),

    messageBackground: booleanParam(
      params,
      "msgbg",
      defaults.messageBackground,
    ),

    fadeOldMessages: booleanParam(
      params,
      "fade",
      defaults.fadeOldMessages,
    ),

    animateMessages: booleanParam(
      params,
      "anim",
      defaults.animateMessages,
    ),

    animationStyle,
    animationDurationMs: Math.round(numberParam(
      params,
      "animdur",
      defaults.animationDurationMs,
      100,
      1200,
    )),
  };
}
