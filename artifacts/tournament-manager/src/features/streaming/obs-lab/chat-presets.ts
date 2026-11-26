import { t } from "@/i18n";
import { type CameraChatConfig, DEFAULT_CAMERA_CHAT_CONFIG } from "./camera-chat-settings";

/** Ready-made chat looks for the configurator; each one is a complete, URL-safe configuration. */
export type ChatPresetId =
  | "glass" | "minimal" | "compact" | "neon" | "classic" | "bubbles" | "light" | "clear" | "terminal" | "esport" | "rainbow"
  | "winter" | "christmas" | "halloween" | "valentine";

export const CHAT_PRESET_IDS: readonly ChatPresetId[] =
  ["glass", "minimal", "compact", "neon", "classic", "bubbles", "light", "clear", "terminal", "esport", "rainbow",
    "winter", "christmas", "halloween", "valentine"];

export function chatPresetLabel(id: ChatPresetId): string {
  switch (id) {
    case "glass": return t("obsLab.glass");
    case "minimal": return t("obsLab.minimal");
    case "compact": return t("obsLab.compact");
    case "neon": return t("obsLab.neon");
    case "classic": return t("obsLab.klasyczny_ciemny");
    case "bubbles": return t("obsLab.babelki");
    case "light": return t("obsLab.jasny");
    case "clear": return t("obsLab.bez_tla_obrys");
    case "terminal": return t("obsLab.terminal");
    case "esport": return t("obsLab.e_sport");
    case "rainbow": return t("obsLab.teczowa_ramka");
    case "winter": return t("obsLab.zima");
    case "christmas": return t("obsLab.swieta");
    case "halloween": return t("obsLab.halloween");
    case "valentine": return t("obsLab.walentynki");
  }
}

export function chatPresetConfig(id: ChatPresetId): CameraChatConfig {
  const base = DEFAULT_CAMERA_CHAT_CONFIG;
  switch (id) {
    case "glass":
      return { ...base, panelOpacity: 66, radius: 24 };
    case "minimal":
      return {
        ...base,
        layout: "below",
        fontSize: "small",
        density: "compact",
        maxMessages: 4,
        panelOpacity: 28,
        radius: 14,
        innerPadding: 8,
        showBorders: false,
        messageBackground: false,
      };
    case "compact":
      return {
        ...base,
        layout: "overlay",
        chatWidth: 38,
        maxMessages: 4,
        fontSize: "small",
        density: "compact",
        panelOpacity: 62,
        radius: 18,
        innerPadding: 8,
        showBorders: false,
        overlayInset: 12,
        overlayPosition: "bottom-right",
      };
    case "neon":
      return {
        ...base,
        fontFamily: "trebuchet",
        panelColor: "#0b0420",
        panelOpacity: 80,
        bubbleColor: "#d946ef",
        bubbleOpacity: 12,
        bubbleRadius: 14,
        accentBar: true,
        showBorders: false,
        readableNames: true,
        textShadow: "soft",
        highlightColor: "#22d3ee",
        animationStyle: "pop",
        newMessageEffect: "glow",
        frameStyle: "rotate",
        frameColor: "#d946ef",
        frameColor2: "#22d3ee",
        frameWidth: 2,
      };
    case "classic":
      return {
        ...base,
        fontFamily: "system",
        panelColor: "#18181b",
        panelOpacity: 88,
        radius: 10,
        density: "compact",
        maxMessages: 8,
        messageBackground: false,
        showBorders: false,
        readableNames: true,
        showColon: true,
        fadeOldMessages: false,
        animationStyle: "fade",
        roleHighlight: true,
      };
    case "bubbles":
      return {
        ...base,
        messageLayout: "bubble",
        panelOpacity: 0,
        showBorders: false,
        bubbleColor: "#1e293b",
        bubbleOpacity: 88,
        bubbleRadius: 18,
        showAvatars: true,
        readableNames: true,
        fadeOldMessages: false,
        maxMessages: 6,
        animationStyle: "bounce",
        newMessageEffect: "pulse",
      };
    case "light":
      return {
        ...base,
        panelColor: "#f8fafc",
        panelOpacity: 92,
        radius: 18,
        textColor: "#0f172a",
        textOpacity: 100,
        bubbleColor: "#0f172a",
        bubbleOpacity: 5,
        showBorders: false,
        nameColorMode: "single",
        nameColor: "#4338ca",
        animationStyle: "slide",
      };
    case "clear":
      return {
        ...base,
        layout: "chat",
        panelOpacity: 0,
        messageBackground: false,
        showBorders: false,
        fontSize: "custom",
        fontSizePx: 20,
        textOpacity: 100,
        textShadow: "outline",
        readableNames: true,
        fadeOldMessages: false,
        maxMessages: 8,
        messageLifetime: 30,
      };
    case "terminal":
      return {
        ...base,
        fontFamily: "mono",
        panelColor: "#000000",
        panelOpacity: 82,
        radius: 6,
        density: "compact",
        messageBackground: false,
        showBorders: false,
        textColor: "#4ade80",
        textOpacity: 100,
        nameColorMode: "single",
        nameColor: "#22c55e",
        showColon: true,
        showBadges: false,
        fadeOldMessages: false,
        animationStyle: "wipe",
        textReveal: "typewriter",
      };
    case "esport":
      return {
        ...base,
        fontFamily: "segoe",
        messageLayout: "stacked",
        panelColor: "#0f172a",
        panelOpacity: 84,
        radius: 8,
        bubbleColor: "#38bdf8",
        bubbleOpacity: 8,
        bubbleRadius: 6,
        accentBar: true,
        readableNames: true,
        showBorders: false,
        animationStyle: "slide",
        newMessageEffect: "shine",
        roleHighlight: true,
        frameStyle: "corners",
        frameColor: "#38bdf8",
        frameWidth: 3,
        frameSpeed: 3,
      };
    case "rainbow":
      return {
        ...base,
        panelColor: "#0f0f1a",
        panelOpacity: 82,
        radius: 18,
        showBorders: false,
        bubbleOpacity: 7,
        readableNames: true,
        animationStyle: "pop",
        frameStyle: "rainbow",
        frameWidth: 3,
        frameSpeed: 5,
        panelAnimation: "shimmer",
      };
    // Seasonal looks: colours, frame and background particles of the season.
    case "winter":
      return {
        ...base,
        panelColor: "#0b1a2e",
        panelGradient: true,
        panelColor2: "#12304f",
        panelOpacity: 80,
        radius: 20,
        showBorders: false,
        bubbleColor: "#bae6fd",
        bubbleOpacity: 8,
        readableNames: true,
        namePalette: "cool",
        animationStyle: "fade",
        frameStyle: "glow",
        frameColor: "#7dd3fc",
        frameWidth: 2,
        ambient: "snow",
        ambientDensity: 18,
        ambientColor: "#e0f2fe",
      };
    case "christmas":
      return {
        ...base,
        panelColor: "#2a0a0a",
        panelGradient: true,
        panelColor2: "#0f2a14",
        panelOpacity: 84,
        radius: 18,
        showBorders: false,
        bubbleColor: "#fde68a",
        bubbleOpacity: 7,
        readableNames: true,
        namePalette: "warm",
        animationStyle: "bounce",
        newMessageEffect: "glow",
        frameStyle: "flow",
        frameColor: "#ef4444",
        frameColor2: "#22c55e",
        frameWidth: 3,
        ambient: "snow",
        ambientDensity: 14,
        ambientColor: "#ffffff",
      };
    case "halloween":
      return {
        ...base,
        panelColor: "#140a1f",
        panelGradient: true,
        panelColor2: "#2b1405",
        panelOpacity: 86,
        radius: 14,
        showBorders: false,
        bubbleColor: "#f97316",
        bubbleOpacity: 8,
        readableNames: true,
        namePalette: "warm",
        textShadow: "strong",
        animationStyle: "flip",
        frameStyle: "pulse",
        frameColor: "#f97316",
        frameColor2: "#a855f7",
        frameWidth: 2,
        ambient: "sparkles",
        ambientDensity: 12,
        ambientColor: "#f97316",
      };
    case "valentine":
      return {
        ...base,
        panelColor: "#2a0b1a",
        panelOpacity: 78,
        radius: 22,
        showBorders: false,
        bubbleColor: "#f9a8d4",
        bubbleOpacity: 10,
        bubbleRadius: 16,
        readableNames: true,
        namePalette: "pastel",
        animationStyle: "pop",
        newMessageEffect: "pulse",
        frameStyle: "glow",
        frameColor: "#f472b6",
        frameWidth: 2,
        ambient: "hearts",
        ambientDensity: 12,
        ambientColor: "#fb7185",
      };
  }
}

// --- Quick colours ------------------------------------------------------------------------------------------------

export type ChatColorThemeId = "violet" | "ocean" | "sunset" | "forest" | "fire" | "ice" | "candy" | "graphite";

type ChatColorTheme = Pick<CameraChatConfig,
  "panelColor" | "panelColor2" | "bubbleColor" | "frameColor" | "frameColor2" | "highlightColor" | "nameColor">;

export const CHAT_COLOR_THEMES: Record<ChatColorThemeId, ChatColorTheme> = {
  violet: { panelColor: "#1e1b4b", panelColor2: "#4c1d95", bubbleColor: "#a78bfa", frameColor: "#a78bfa", frameColor2: "#f0abfc", highlightColor: "#facc15", nameColor: "#c4b5fd" },
  ocean: { panelColor: "#082f49", panelColor2: "#0e7490", bubbleColor: "#38bdf8", frameColor: "#22d3ee", frameColor2: "#3b82f6", highlightColor: "#fde047", nameColor: "#7dd3fc" },
  sunset: { panelColor: "#431407", panelColor2: "#9d174d", bubbleColor: "#fb923c", frameColor: "#f97316", frameColor2: "#ec4899", highlightColor: "#fde68a", nameColor: "#fdba74" },
  forest: { panelColor: "#052e16", panelColor2: "#14532d", bubbleColor: "#4ade80", frameColor: "#22c55e", frameColor2: "#a3e635", highlightColor: "#fef08a", nameColor: "#86efac" },
  fire: { panelColor: "#450a0a", panelColor2: "#7c2d12", bubbleColor: "#f87171", frameColor: "#ef4444", frameColor2: "#f59e0b", highlightColor: "#fde047", nameColor: "#fca5a5" },
  ice: { panelColor: "#0c4a6e", panelColor2: "#1e3a8a", bubbleColor: "#bae6fd", frameColor: "#e0f2fe", frameColor2: "#7dd3fc", highlightColor: "#f0abfc", nameColor: "#e0f2fe" },
  candy: { panelColor: "#500724", panelColor2: "#581c87", bubbleColor: "#f9a8d4", frameColor: "#f472b6", frameColor2: "#c084fc", highlightColor: "#67e8f9", nameColor: "#fbcfe8" },
  graphite: { panelColor: "#0a0a0a", panelColor2: "#262626", bubbleColor: "#a3a3a3", frameColor: "#e5e5e5", frameColor2: "#737373", highlightColor: "#facc15", nameColor: "#e5e5e5" },
};

export const CHAT_COLOR_THEME_IDS = Object.keys(CHAT_COLOR_THEMES) as ChatColorThemeId[];

export function chatColorThemeLabel(id: ChatColorThemeId): string {
  switch (id) {
    case "violet": return t("obsLab.fiolet");
    case "ocean": return t("obsLab.ocean");
    case "sunset": return t("obsLab.zachod_slonca");
    case "forest": return t("obsLab.las");
    case "fire": return t("obsLab.ogien");
    case "ice": return t("obsLab.lod");
    case "candy": return t("obsLab.cukierek");
    case "graphite": return t("obsLab.grafit");
  }
}

/** Only colours change; layout, text, motion and filters stay as they are. */
export function applyChatColorTheme(config: CameraChatConfig, id: ChatColorThemeId): CameraChatConfig {
  return { ...config, ...CHAT_COLOR_THEMES[id] };
}
