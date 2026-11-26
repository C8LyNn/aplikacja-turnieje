import { t } from "@/i18n";
import { type CameraChatConfig, DEFAULT_CAMERA_CHAT_CONFIG } from "./camera-chat-settings";

/** Ready-made chat looks for the configurator; each one is a complete, URL-safe configuration. */
export type ChatPresetId =
  | "glass" | "minimal" | "compact" | "neon" | "classic" | "bubbles" | "light" | "clear" | "terminal" | "esport" | "rainbow"
  | "winter" | "christmas" | "halloween" | "valentine"
  | "paper" | "noir" | "gold" | "cyberpunk" | "synthwave" | "retro" | "fps" | "kawaii" | "candy" | "mint" | "coffee"
  | "ocean" | "forest" | "space" | "sunset" | "sakura" | "autumn" | "newyear" | "easter" | "summer";

export const CHAT_PRESET_IDS: readonly ChatPresetId[] =
  ["glass", "minimal", "compact", "neon", "classic", "bubbles", "light", "clear", "terminal", "esport", "rainbow",
    "winter", "christmas", "halloween", "valentine",
    "paper", "noir", "gold", "cyberpunk", "synthwave", "retro", "fps", "kawaii", "candy", "mint", "coffee",
    "ocean", "forest", "space", "sunset", "sakura", "autumn", "newyear", "easter", "summer"];

export type ChatPresetCategory = "classic" | "neon" | "cute" | "nature" | "seasonal";

/** Looks grouped for the pickers; every look is in exactly one group. */
export const CHAT_PRESET_CATEGORIES: Record<ChatPresetCategory, readonly ChatPresetId[]> = {
  classic: ["glass", "minimal", "compact", "classic", "light", "clear", "paper", "noir", "gold"],
  neon: ["neon", "esport", "rainbow", "terminal", "cyberpunk", "synthwave", "retro", "fps"],
  cute: ["bubbles", "kawaii", "candy", "mint", "coffee"],
  nature: ["ocean", "forest", "space", "sunset", "sakura"],
  seasonal: ["winter", "christmas", "halloween", "valentine", "autumn", "newyear", "easter", "summer"],
};

export const CHAT_PRESET_CATEGORY_IDS = Object.keys(CHAT_PRESET_CATEGORIES) as ChatPresetCategory[];

export function chatPresetCategoryLabel(id: ChatPresetCategory | "all"): string {
  switch (id) {
    case "all": return t("obsLab.wszystkie_motywy");
    case "classic": return t("obsLab.kategoria_klasyczne");
    case "neon": return t("obsLab.kategoria_neon");
    case "cute": return t("obsLab.kategoria_slodkie");
    case "nature": return t("obsLab.kategoria_natura");
    case "seasonal": return t("obsLab.kategoria_sezonowe");
  }
}

export function chatPresetsIn(category: ChatPresetCategory | "all"): readonly ChatPresetId[] {
  return category === "all" ? CHAT_PRESET_IDS : CHAT_PRESET_CATEGORIES[category];
}

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
    case "paper": return t("obsLab.motyw_papier");
    case "noir": return t("obsLab.motyw_noir");
    case "gold": return t("obsLab.motyw_zloto");
    case "cyberpunk": return t("obsLab.motyw_cyberpunk");
    case "synthwave": return t("obsLab.motyw_synthwave");
    case "retro": return t("obsLab.motyw_retro");
    case "fps": return t("obsLab.motyw_fps");
    case "kawaii": return t("obsLab.motyw_kawaii");
    case "candy": return t("obsLab.motyw_cukierki");
    case "mint": return t("obsLab.motyw_mieta");
    case "coffee": return t("obsLab.motyw_kawa");
    case "ocean": return t("obsLab.motyw_ocean");
    case "forest": return t("obsLab.motyw_las");
    case "space": return t("obsLab.motyw_kosmos");
    case "sunset": return t("obsLab.motyw_zachod");
    case "sakura": return t("obsLab.motyw_sakura");
    case "autumn": return t("obsLab.motyw_jesien");
    case "newyear": return t("obsLab.motyw_sylwester");
    case "easter": return t("obsLab.motyw_wielkanoc");
    case "summer": return t("obsLab.motyw_lato");
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
        // A light panel shows the game through, so the text needs a shadow to stay readable.
        textShadow: "soft",
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
    // Classic
    case "paper":
      return {
        ...base,
        panelColor: "#fdf6e3", panelOpacity: 95, radius: 10, showBorders: false,
        textColor: "#1f2937", textOpacity: 100, textShadow: "none", messageBackground: false,
        nameColorMode: "single", nameColor: "#1d4ed8", fontFamily: "segoeprint",
        frameStyle: "solid", frameColor: "#cbd5e1", frameWidth: 1,
        panelPattern: "grid", patternColor: "#93c5fd", patternOpacity: 35, animationStyle: "fade",
      };
    case "noir":
      return {
        ...base,
        panelColor: "#000000", panelOpacity: 88, radius: 6, showBorders: false, messageBackground: false,
        textColor: "#d4d4d4", nameColorMode: "single", nameColor: "#ffffff", fontFamily: "georgia",
        frameStyle: "solid", frameColor: "#ffffff", frameWidth: 1,
        panelPattern: "scanlines", patternOpacity: 6, animationStyle: "fade",
      };
    case "gold":
      return {
        ...base,
        panelColor: "#0c0a09", panelGradient: true, panelColor2: "#292524", panelOpacity: 88, radius: 16,
        showBorders: false, bubbleColor: "#fbbf24", bubbleOpacity: 6, textColor: "#fef3c7",
        nameColorMode: "single", nameColor: "#fbbf24", nameStyle: "shimmer", fontFamily: "palatino",
        frameStyle: "gradient", frameColor: "#fde68a", frameColor2: "#b45309", frameWidth: 2, animationStyle: "zoom",
      };
    // Neon and games
    case "cyberpunk":
      return {
        ...base,
        panelColor: "#0a0014", panelOpacity: 86, radius: 4, showBorders: false, bubbleColor: "#facc15", bubbleOpacity: 6,
        bubbleRadius: 2, accentBar: true, readableNames: true, nameStyle: "glow", nameUppercase: true,
        fontFamily: "bahnschrift", highlightColor: "#f0abfc", newMessageEffect: "flash",
        frameStyle: "dashes", frameColor: "#facc15", frameWidth: 2,
        panelPattern: "grid", patternColor: "#22d3ee", patternOpacity: 10, animationStyle: "glitch",
      };
    case "synthwave":
      return {
        ...base,
        panelColor: "#1a0b2e", panelGradient: true, panelColor2: "#3b0764", panelGradientAngle: 180, panelOpacity: 86,
        radius: 18, showBorders: false, bubbleColor: "#f472b6", bubbleOpacity: 8, readableNames: true,
        namePalette: "neon", nameStyle: "gradient", frameStyle: "flow", frameColor: "#f472b6", frameColor2: "#22d3ee",
        frameWidth: 2, panelPattern: "waves", patternColor: "#f472b6", patternOpacity: 10,
        ambient: "stars", ambientDensity: 16, ambientColor: "#f9a8d4", animationStyle: "swing",
      };
    case "retro":
      return {
        ...base,
        panelColor: "#111827", panelOpacity: 92, radius: 0, bubbleRadius: 0, showBorders: false, bubbleOpacity: 0,
        fontFamily: "courier", textBold: true, nameUppercase: true, namePalette: "neon", readableNames: true,
        frameStyle: "solid", frameColor: "#22c55e", frameWidth: 4,
        panelPattern: "scanlines", patternOpacity: 7, ambient: "pixels", ambientDensity: 10, ambientColor: "#4ade80",
        animationStyle: "drop", textReveal: "typewriter",
      };
    case "fps":
      return {
        ...base,
        panelColor: "#0f0f0f", panelOpacity: 80, radius: 4, bubbleRadius: 2, showBorders: false,
        bubbleColor: "#ef4444", bubbleOpacity: 6, accentBar: true, readableNames: true, nameUppercase: true,
        fontFamily: "bahnschrift", messageLayout: "stacked", roleHighlight: true,
        frameStyle: "corners", frameColor: "#ef4444", frameWidth: 3, frameSpeed: 3,
        panelPattern: "carbon", patternOpacity: 5, animationStyle: "slide",
      };
    // Cute
    case "kawaii":
      return {
        ...base,
        panelColor: "#fff1f7", panelOpacity: 93, radius: 24, showBorders: false, textColor: "#4a044e", textOpacity: 100,
        textShadow: "none", bubbleColor: "#f9a8d4", bubbleOpacity: 28, bubbleRadius: 18, bubbleShape: "tail",
        fontFamily: "comic", nameColorMode: "single", nameColor: "#be185d",
        frameStyle: "glow", frameColor: "#f472b6", frameWidth: 2,
        ambient: "hearts", ambientDensity: 10, ambientColor: "#f9a8d4", animationStyle: "pop",
      };
    case "candy":
      return {
        ...base,
        panelColor: "#2e1065", panelGradient: true, panelColor2: "#831843", panelOpacity: 84, radius: 22,
        showBorders: false, bubbleColor: "#f0abfc", bubbleOpacity: 12, bubbleRadius: 16, readableNames: true,
        nameStyle: "rainbow", frameStyle: "pulse", frameColor: "#f0abfc", frameColor2: "#67e8f9", frameWidth: 2,
        panelPattern: "dots", patternColor: "#f9a8d4", patternOpacity: 14,
        ambient: "confetti", ambientDensity: 10, animationStyle: "bounce",
      };
    case "mint":
      return {
        ...base,
        panelColor: "#022c22", panelOpacity: 82, radius: 18, showBorders: false, bubbleColor: "#6ee7b7", bubbleOpacity: 10,
        readableNames: true, namePalette: "cool", fontFamily: "trebuchet",
        frameStyle: "glow", frameColor: "#34d399", frameWidth: 2,
        panelPattern: "dots", patternColor: "#6ee7b7", patternOpacity: 8, animationStyle: "rise",
      };
    case "coffee":
      return {
        ...base,
        panelColor: "#1c1210", panelGradient: true, panelColor2: "#3f2a20", panelOpacity: 88, radius: 16,
        showBorders: false, textColor: "#f5e6d3", bubbleColor: "#d6a77a", bubbleOpacity: 8, readableNames: true,
        namePalette: "warm", fontFamily: "georgia", frameStyle: "solid", frameColor: "#a16207", frameWidth: 2,
        animationStyle: "fade", textReveal: "words",
      };
    // Nature
    case "ocean":
      return {
        ...base,
        panelColor: "#082f49", panelGradient: true, panelColor2: "#155e75", panelOpacity: 84, radius: 20,
        showBorders: false, bubbleColor: "#67e8f9", bubbleOpacity: 8, readableNames: true, namePalette: "cool",
        frameStyle: "flow", frameColor: "#22d3ee", frameColor2: "#3b82f6", frameWidth: 2, panelAnimation: "float",
        panelPattern: "waves", patternColor: "#67e8f9", patternOpacity: 8,
        ambient: "bubbles", ambientDensity: 12, ambientColor: "#a5f3fc", animationStyle: "rise",
      };
    case "forest":
      return {
        ...base,
        panelColor: "#052e16", panelGradient: true, panelColor2: "#1a2e05", panelOpacity: 86, radius: 16,
        showBorders: false, textColor: "#ecfccb", bubbleColor: "#bef264", bubbleOpacity: 6, readableNames: true,
        frameStyle: "glow", frameColor: "#84cc16", frameWidth: 2,
        ambient: "fireflies", ambientDensity: 12, ambientColor: "#fde047", animationStyle: "fade",
      };
    case "space":
      return {
        ...base,
        panelColor: "#030014", panelGradient: true, panelColor2: "#1e1b4b", panelOpacity: 88, radius: 18,
        showBorders: false, bubbleColor: "#a5b4fc", bubbleOpacity: 6, readableNames: true, nameStyle: "glow",
        frameStyle: "rotate", frameColor: "#818cf8", frameColor2: "#c084fc", frameWidth: 2, panelAnimation: "breathe",
        ambient: "stars", ambientDensity: 30, ambientColor: "#e0e7ff", animationStyle: "zoom",
      };
    case "sunset":
      return {
        ...base,
        panelColor: "#431407", panelGradient: true, panelColor2: "#831843", panelOpacity: 84, radius: 18,
        showBorders: false, bubbleColor: "#fdba74", bubbleOpacity: 8, readableNames: true, namePalette: "warm",
        nameStyle: "gradient", frameStyle: "gradient", frameColor: "#fb923c", frameColor2: "#ec4899", frameWidth: 2,
        ambient: "sparkles", ambientDensity: 8, ambientColor: "#fed7aa", animationStyle: "slide",
      };
    case "sakura":
      return {
        ...base,
        panelColor: "#1f0a14", panelOpacity: 82, radius: 20, showBorders: false, bubbleColor: "#fbcfe8", bubbleOpacity: 8,
        readableNames: true, namePalette: "pastel", frameStyle: "glow", frameColor: "#f9a8d4", frameWidth: 2,
        ambient: "petals", ambientDensity: 14, ambientColor: "#f9a8d4", animationStyle: "swing",
      };
    // Seasons
    case "autumn":
      return {
        ...base,
        panelColor: "#1c0f05", panelGradient: true, panelColor2: "#431407", panelOpacity: 86, radius: 16,
        showBorders: false, bubbleColor: "#fdba74", bubbleOpacity: 7, readableNames: true, namePalette: "warm",
        frameStyle: "pulse", frameColor: "#ea580c", frameColor2: "#facc15", frameWidth: 2,
        ambient: "leaves", ambientDensity: 14, animationStyle: "drop",
      };
    case "newyear":
      return {
        ...base,
        panelColor: "#0a0a0a", panelGradient: true, panelColor2: "#1c1917", panelOpacity: 88, radius: 18,
        showBorders: false, bubbleColor: "#fde68a", bubbleOpacity: 6, readableNames: true, nameStyle: "shimmer",
        newMessageEffect: "shine", frameStyle: "gradient", frameColor: "#fde68a", frameColor2: "#ffffff", frameWidth: 2,
        ambient: "confetti", ambientDensity: 14, animationStyle: "pop",
      };
    case "easter":
      return {
        ...base,
        panelColor: "#f0fdf4", panelOpacity: 93, radius: 20, showBorders: false, textColor: "#14532d", textOpacity: 100,
        textShadow: "none", bubbleColor: "#fde68a", bubbleOpacity: 32, bubbleRadius: 16,
        nameColorMode: "single", nameColor: "#7c3aed", frameStyle: "dashes", frameColor: "#f9a8d4", frameWidth: 2,
        ambient: "petals", ambientDensity: 10, ambientColor: "#f9a8d4", animationStyle: "bounce",
      };
    case "summer":
      return {
        ...base,
        panelColor: "#0c4a6e", panelGradient: true, panelColor2: "#0e7490", panelOpacity: 84, radius: 20,
        showBorders: false, bubbleColor: "#fde047", bubbleOpacity: 8, readableNames: true, namePalette: "warm",
        frameStyle: "glow", frameColor: "#fde047", frameWidth: 2,
        ambient: "sparkles", ambientDensity: 10, ambientColor: "#fde047", animationStyle: "bounce",
      };
  }
}

// --- Quick colours ------------------------------------------------------------------------------------------------

export type ChatColorThemeId =
  | "violet" | "ocean" | "sunset" | "forest" | "fire" | "ice" | "candy" | "graphite"
  | "mint" | "gold" | "cherry" | "midnight" | "lavender" | "coffee" | "lime" | "mono";

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
  mint: { panelColor: "#022c22", panelColor2: "#065f46", bubbleColor: "#6ee7b7", frameColor: "#34d399", frameColor2: "#a7f3d0", highlightColor: "#fde047", nameColor: "#a7f3d0" },
  gold: { panelColor: "#1c1917", panelColor2: "#422006", bubbleColor: "#fcd34d", frameColor: "#fbbf24", frameColor2: "#fef3c7", highlightColor: "#f472b6", nameColor: "#fde68a" },
  cherry: { panelColor: "#4c0519", panelColor2: "#881337", bubbleColor: "#fda4af", frameColor: "#f43f5e", frameColor2: "#fb7185", highlightColor: "#fde047", nameColor: "#fecdd3" },
  midnight: { panelColor: "#020617", panelColor2: "#172554", bubbleColor: "#93c5fd", frameColor: "#60a5fa", frameColor2: "#a78bfa", highlightColor: "#fde047", nameColor: "#bfdbfe" },
  lavender: { panelColor: "#2e1065", panelColor2: "#4c1d95", bubbleColor: "#ddd6fe", frameColor: "#c4b5fd", frameColor2: "#f5d0fe", highlightColor: "#86efac", nameColor: "#ede9fe" },
  coffee: { panelColor: "#1c1210", panelColor2: "#3f2a20", bubbleColor: "#d6a77a", frameColor: "#a16207", frameColor2: "#fcd9b6", highlightColor: "#fde68a", nameColor: "#fcd9b6" },
  lime: { panelColor: "#0a0a0a", panelColor2: "#1a2e05", bubbleColor: "#bef264", frameColor: "#a3e635", frameColor2: "#22d3ee", highlightColor: "#f0abfc", nameColor: "#d9f99d" },
  mono: { panelColor: "#111111", panelColor2: "#333333", bubbleColor: "#ffffff", frameColor: "#ffffff", frameColor2: "#9ca3af", highlightColor: "#facc15", nameColor: "#ffffff" },
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
    case "mint": return t("obsLab.kolor_mieta");
    case "gold": return t("obsLab.kolor_zloto");
    case "cherry": return t("obsLab.kolor_wisnia");
    case "midnight": return t("obsLab.kolor_polnoc");
    case "lavender": return t("obsLab.kolor_lawenda");
    case "coffee": return t("obsLab.kolor_kawa");
    case "lime": return t("obsLab.kolor_limonka");
    case "mono": return t("obsLab.kolor_czern_biel");
  }
}

/** Only colours change; layout, text, motion and filters stay as they are. */
export function applyChatColorTheme(config: CameraChatConfig, id: ChatColorThemeId): CameraChatConfig {
  return { ...config, ...CHAT_COLOR_THEMES[id] };
}
