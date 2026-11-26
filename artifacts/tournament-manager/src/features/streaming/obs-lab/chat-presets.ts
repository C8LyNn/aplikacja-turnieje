import { t } from "@/i18n";
import { type CameraChatConfig, DEFAULT_CAMERA_CHAT_CONFIG } from "./camera-chat-settings";

/** Ready-made chat looks for the configurator; each one is a complete, URL-safe configuration. */
export type ChatPresetId =
  | "glass" | "minimal" | "compact" | "neon" | "classic" | "bubbles" | "light" | "clear" | "terminal" | "esport" | "rainbow"
  | "winter" | "christmas" | "halloween" | "valentine"
  | "paper" | "noir" | "gold" | "cyberpunk" | "synthwave" | "retro" | "fps" | "kawaii" | "candy" | "mint" | "coffee"
  | "ocean" | "forest" | "space" | "sunset" | "sakura" | "autumn" | "newyear" | "easter" | "summer"
  | "matrix" | "fantasy" | "steampunk" | "gothic" | "dragon" | "princess" | "cottoncandy" | "lilac" | "unicorn"
  | "aurora" | "hologram" | "memphis" | "lavalamp" | "vaporwave"
  | "comic" | "corkboard"
  | "chalkboard" | "blueprint" | "newspaper" | "amberterm" | "neontokyo" | "arcade" | "racing" | "pirate" | "samurai" | "horror" | "western" | "bubblegum" | "pastelgoth" | "y2k" | "peach" | "chrome" | "neonwaves" | "music" | "desert" | "volcano" | "jungle" | "spring" | "carnival";

export const CHAT_PRESET_IDS: readonly ChatPresetId[] =
  ["glass", "minimal", "compact", "neon", "classic", "bubbles", "light", "clear", "terminal", "esport", "rainbow",
    "winter", "christmas", "halloween", "valentine",
    "paper", "noir", "gold", "cyberpunk", "synthwave", "retro", "fps", "kawaii", "candy", "mint", "coffee",
    "ocean", "forest", "space", "sunset", "sakura", "autumn", "newyear", "easter", "summer",
    "matrix", "fantasy", "steampunk", "gothic", "dragon", "princess", "cottoncandy", "lilac", "unicorn",
    "aurora", "hologram", "memphis", "lavalamp", "vaporwave",
    "comic", "corkboard",
    "chalkboard", "blueprint", "newspaper", "amberterm", "neontokyo", "arcade", "racing", "pirate", "samurai", "horror", "western", "bubblegum", "pastelgoth", "y2k", "peach", "chrome", "neonwaves", "music", "desert", "volcano", "jungle", "spring", "carnival"];

export type ChatPresetCategory = "classic" | "neon" | "fantasy" | "cute" | "abstract" | "nature" | "seasonal";

/** Looks grouped for the pickers; every look is in exactly one group. */
export const CHAT_PRESET_CATEGORIES: Record<ChatPresetCategory, readonly ChatPresetId[]> = {
  classic: ["glass", "minimal", "compact", "classic", "light", "clear", "paper", "noir", "gold", "chalkboard", "blueprint", "newspaper", "corkboard"],
  neon: ["neon", "esport", "rainbow", "terminal", "cyberpunk", "synthwave", "retro", "fps", "matrix", "amberterm", "neontokyo", "arcade", "racing"],
  fantasy: ["fantasy", "steampunk", "gothic", "dragon", "pirate", "samurai", "horror", "western"],
  cute: ["bubbles", "kawaii", "candy", "mint", "coffee", "princess", "cottoncandy", "lilac", "unicorn", "bubblegum", "pastelgoth", "y2k", "peach"],
  abstract: ["aurora", "hologram", "memphis", "lavalamp", "vaporwave", "chrome", "neonwaves", "music", "comic"],
  nature: ["ocean", "forest", "space", "sunset", "sakura", "desert", "volcano", "jungle"],
  seasonal: ["winter", "christmas", "halloween", "valentine", "autumn", "newyear", "easter", "summer", "spring", "carnival"],
};

export const CHAT_PRESET_CATEGORY_IDS = Object.keys(CHAT_PRESET_CATEGORIES) as ChatPresetCategory[];

export function chatPresetCategoryLabel(id: ChatPresetCategory | "all"): string {
  switch (id) {
    case "all": return t("obsLab.wszystkie_motywy");
    case "classic": return t("obsLab.kategoria_klasyczne");
    case "neon": return t("obsLab.kategoria_neon");
    case "fantasy": return t("obsLab.kategoria_fantasy");
    case "cute": return t("obsLab.kategoria_slodkie_dziewczece");
    case "abstract": return t("obsLab.kategoria_abstrakcyjne");
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
    case "matrix": return t("obsLab.motyw_matrix");
    case "fantasy": return t("obsLab.motyw_fantasy");
    case "steampunk": return t("obsLab.motyw_steampunk");
    case "gothic": return t("obsLab.motyw_gotycki");
    case "dragon": return t("obsLab.motyw_smok");
    case "princess": return t("obsLab.motyw_ksiezniczka");
    case "cottoncandy": return t("obsLab.motyw_wata_cukrowa");
    case "lilac": return t("obsLab.motyw_liliowy_sen");
    case "unicorn": return t("obsLab.motyw_jednorozec");
    case "aurora": return t("obsLab.motyw_zorza");
    case "hologram": return t("obsLab.motyw_hologram");
    case "memphis": return t("obsLab.motyw_memphis");
    case "lavalamp": return t("obsLab.motyw_lampa_lava");
    case "vaporwave": return t("obsLab.motyw_vaporwave");
    case "comic": return t("obsLab.motyw_komiks");
    case "corkboard": return t("obsLab.motyw_tablica_korkowa");
    case "chalkboard": return t("obsLab.motyw_tablica");
    case "blueprint": return t("obsLab.motyw_plan");
    case "newspaper": return t("obsLab.motyw_gazeta");
    case "amberterm": return t("obsLab.motyw_bursztyn");
    case "neontokyo": return t("obsLab.motyw_neonowe_miasto");
    case "arcade": return t("obsLab.motyw_salon_gier");
    case "racing": return t("obsLab.motyw_wyscigi");
    case "pirate": return t("obsLab.motyw_piracki");
    case "samurai": return t("obsLab.motyw_samuraj");
    case "horror": return t("obsLab.motyw_horror");
    case "western": return t("obsLab.motyw_dziki_zachod");
    case "bubblegum": return t("obsLab.motyw_guma_balonowa");
    case "pastelgoth": return t("obsLab.motyw_pastel_goth");
    case "y2k": return t("obsLab.motyw_y2k");
    case "peach": return t("obsLab.motyw_brzoskwinia");
    case "chrome": return t("obsLab.motyw_chrom");
    case "neonwaves": return t("obsLab.motyw_neonowe_fale");
    case "music": return t("obsLab.motyw_muzyka");
    case "desert": return t("obsLab.motyw_pustynia");
    case "volcano": return t("obsLab.motyw_wulkan");
    case "jungle": return t("obsLab.motyw_dzungla");
    case "spring": return t("obsLab.motyw_wiosna");
    case "carnival": return t("obsLab.motyw_karnawal");
  }
}

/**
 * What sets each look apart beyond its colours (font, message layout, bubble shape, motion, nick style). Applied on
 * top of the base looks, so no two looks are mere recolours of each other (see chat-look-distance.ts).
 */
const LOOK_TRAITS: Partial<Record<ChatPresetId, Partial<CameraChatConfig>>> = {
  glass: { fontFamily: "calibri", messageLayout: "stacked", frameStyle: "solid", frameColor: "#ffffff", frameWidth: 1, animationStyle: "fade" },
  minimal: { fontFamily: "arial", bubbleShape: "underline", animationStyle: "fade" },
  compact: { fontFamily: "tahoma", accentBar: true, animationStyle: "slide", nameUppercase: true },
  classic: { messageLayout: "stacked", accentBar: true },
  light: { fontFamily: "verdana", messageLayout: "stacked", showAvatars: true },
  clear: { fontFamily: "arialblack", animationStyle: "pop", nameUppercase: true, radius: 4, messageLayout: "stacked", nameStyle: "glow" },
  rainbow: { messageLayout: "bubble", bubbleShape: "skew", fontFamily: "trebuchet" },
  winter: { messageLayout: "stacked", fontFamily: "georgia", nameStyle: "glow", textReveal: "words" },
  summer: { messageLayout: "stacked", bubbleShape: "skew", fontFamily: "verdana", nameStyle: "gradient", animationStyle: "drop" },
  easter: { messageLayout: "stacked", bubbleShape: "outline", fontFamily: "segoeprint", animationStyle: "swing" },
  sakura: { messageLayout: "stacked", bubbleShape: "underline", messageBackground: false, fontFamily: "cambria", nameStyle: "shimmer" },
  lilac: { messageLayout: "bubble", bubbleShape: "tail", fontFamily: "lucida", nameStyle: "shimmer", animationStyle: "fade" },
  lavalamp: { messageLayout: "bubble", bubbleShape: "skew", fontFamily: "tahoma", nameStyle: "gradient" },
  unicorn: { messageLayout: "bubble", bubbleShape: "tail", fontFamily: "segoeprint", showAvatars: true },
  candy: { messageLayout: "stacked", fontFamily: "comic", bubbleShape: "skew" },
  ocean: { fontFamily: "verdana", messageLayout: "bubble", nameStyle: "glow" },
  forest: { fontFamily: "palatino", messageLayout: "stacked", messageBackground: false, bubbleShape: "underline", textReveal: "words" },
  halloween: { fontFamily: "impact", messageLayout: "stacked", bubbleShape: "skew" },
  autumn: { fontFamily: "georgia", messageLayout: "bubble", bubbleShape: "tail" },
  valentine: { fontFamily: "trebuchet", messageLayout: "stacked", nameStyle: "glow" },
  synthwave: { fontFamily: "trebuchet", messageLayout: "bubble" },
  aurora: { fontFamily: "verdana", messageLayout: "stacked" },
  chrome: { messageLayout: "stacked", animationStyle: "wipe", bubbleShape: "outline" },
  y2k: { messageLayout: "bubble", bubbleShape: "outline", animationStyle: "pop" },
  fantasy: { messageLayout: "stacked", animationStyle: "flip" },
  cottoncandy: { messageLayout: "stacked", bubbleShape: "tail", fontFamily: "segoe", animationStyle: "zoom", nameUppercase: true },
  noir: { messageLayout: "stacked", bubbleShape: "underline", animationStyle: "wipe" },
  paper: { animationStyle: "pop", accentBar: true },
  mint: { messageLayout: "bubble", bubbleShape: "tail", fontFamily: "tahoma" },
  coffee: { messageLayout: "bubble", bubbleShape: "tail", fontFamily: "palatino" },
  racing: { messageLayout: "inline", fontFamily: "impact", frameStyle: "solid", panelPattern: "stripes", animationStyle: "zoom" },
};

/**
 * What makes each look read as its theme: the ornament (symbol before nicks, corner emblem, top divider) in a fitting
 * colour, and where it helps a message card, a nick tag or a texture. Reviewed look by look.
 */
const THEME_IDENTITY: Partial<Record<ChatPresetId, Partial<CameraChatConfig>>> = {
  // Classic looks stay clean; the themed ones get their symbol.
  glass: { bubbleShape: "glass" },
  compact: { nameTag: "pill" },
  paper: { bubbleShape: "sticky", bubbleColor: "#fef08a", messageBackground: true, ornament: "pen", ornamentColor: "#1d4ed8" },
  noir: { panelPattern: "vignette", patternColor: "#000000", patternOpacity: 50, nameTag: "underline" },
  gold: { ornament: "crown", ornamentColor: "#fbbf24", bubbleShape: "glass" },
  chalkboard: { ornament: "star", ornamentColor: "#fde047", nameTag: "underline" },
  blueprint: { ornament: "crosshair", ornamentColor: "#bfdbfe", nameTag: "box" },
  newspaper: { ornament: "pen", ornamentColor: "#111111" },
  corkboard: { ornament: "pen", ornamentColor: "#5b3a1a" },
  // Neon and games
  neon: { ornament: "sparkle", ornamentColor: "#d946ef" },
  esport: { ornament: "star", ornamentColor: "#38bdf8", nameTag: "pill" },
  terminal: { nameTag: "prompt" },
  cyberpunk: { ornament: "bolt", ornamentColor: "#facc15", nameTag: "box" },
  synthwave: { ornament: "sun", ornamentColor: "#f472b6", panelPattern: "grid", patternColor: "#f472b6", patternOpacity: 12 },
  retro: { bubbleShape: "pixel", messageBackground: true, bubbleColor: "#4ade80", bubbleOpacity: 8, ornament: "heart", ornamentColor: "#ef4444" },
  fps: { ornament: "crosshair", ornamentColor: "#ef4444", nameTag: "bracket" },
  matrix: { ornament: "prompt", ornamentColor: "#22c55e" },
  amberterm: { nameTag: "prompt" },
  neontokyo: { ornament: "moon", ornamentColor: "#05d9e8" },
  arcade: { ornament: "diamond", ornamentColor: "#facc15", nameTag: "pill" },
  racing: { ornament: "flag", ornamentColor: "#facc15", nameTag: "box", panelPattern: "checker", patternColor: "#ffffff", patternOpacity: 8 },
  // Fantasy
  fantasy: { ornament: "sparkle", ornamentColor: "#fbbf24", panelPattern: "vignette", patternColor: "#000000", patternOpacity: 40 },
  steampunk: { nameColorMode: "single", nameColor: "#e9b872", ornament: "gear", ornamentColor: "#d4a373", nameTag: "box", panelPattern: "planks", patternColor: "#000000", patternOpacity: 25 },
  gothic: { ornament: "fleur", ornamentColor: "#b91c1c", panelPattern: "vignette", patternColor: "#000000", patternOpacity: 50 },
  dragon: { ornament: "swords", ornamentColor: "#f97316" },
  samurai: { ornament: "swords", ornamentColor: "#dc2626" },
  horror: { ornament: "coffin", ornamentColor: "#7f1d1d", panelPattern: "vignette", patternColor: "#000000", patternOpacity: 50 },
  western: { nameColorMode: "single", nameColor: "#f4a261", ornament: "star", ornamentColor: "#e9c46a", panelPattern: "planks", patternColor: "#000000", patternOpacity: 25 },
  // Cute and girly
  bubbles: { ornament: "circle", ornamentColor: "#7dd3fc" },
  kawaii: { ornament: "heart", ornamentColor: "#f472b6", nameTag: "pill" },
  candy: { ornament: "star", ornamentColor: "#f0abfc" },
  mint: { ornament: "leaf", ornamentColor: "#34d399" },
  coffee: { ornament: "heart", ornamentColor: "#d6a77a" },
  princess: { ornament: "crown", ornamentColor: "#fde68a" },
  cottoncandy: { ornament: "cloud", ornamentColor: "#f9a8d4" },
  lilac: { ornament: "blossom", ornamentColor: "#d8b4fe" },
  unicorn: { ornament: "sparkle", ornamentColor: "#fef9c3" },
  bubblegum: {
    bubbleShape: "comic", bubbleColor: "#ffe4f1", textColor: "#4a044e", textShadow: "none", nameColorMode: "single",
    nameColor: "#db2777", ornament: "circle", ornamentColor: "#f472b6",
  },
  pastelgoth: { ornament: "moon", ornamentColor: "#f9a8d4" },
  y2k: { bubbleShape: "glass", ornament: "sparkle", ornamentColor: "#e0e7ff" },
  peach: { ornament: "flower", ornamentColor: "#fb923c" },
  // Abstract
  aurora: { ornament: "sparkle", ornamentColor: "#34d399" },
  hologram: { bubbleShape: "glass", nameTag: "box", ornament: "target", ornamentColor: "#67e8f9" },
  memphis: {
    bubbleShape: "comic", bubbleColor: "#ffffff", textColor: "#111827", textShadow: "none", nameColorMode: "single",
    nameColor: "#7c3aed", nameTag: "pill", ornament: "triangle", ornamentColor: "#f472b6",
  },
  lavalamp: { ornament: "circle", ornamentColor: "#fb923c" },
  vaporwave: { ornament: "diamond", ornamentColor: "#67e8f9", panelPattern: "checker", patternColor: "#f0abfc", patternOpacity: 10 },
  chrome: { nameTag: "box" },
  neonwaves: { ornament: "wave", ornamentColor: "#22d3ee" },
  music: { ornament: "note", ornamentColor: "#c4b5fd", nameTag: "pill" },
  comic: { ornament: "bolt", ornamentColor: "#111111" },
  // Nature
  ocean: { ornament: "anchor", ornamentColor: "#7dd3fc" },
  forest: { ornament: "clover", ornamentColor: "#84cc16" },
  space: { ornament: "comet", ornamentColor: "#c4b5fd" },
  sunset: { ornament: "sun", ornamentColor: "#fb923c" },
  sakura: { ornament: "flower", ornamentColor: "#fbcfe8" },
  desert: { ornament: "sun", ornamentColor: "#fcd34d" },
  volcano: { ornament: "triangle", ornamentColor: "#ef4444" },
  jungle: { ornament: "leaf", ornamentColor: "#bef264" },
  // Seasons
  winter: { ornament: "snow", ornamentColor: "#e0f2fe" },
  christmas: { ornament: "star", ornamentColor: "#facc15" },
  halloween: { ornament: "moon", ornamentColor: "#f97316" },
  valentine: { ornament: "heart", ornamentColor: "#fb7185" },
  autumn: { ornament: "leaf", ornamentColor: "#ea580c" },
  newyear: { ornament: "star", ornamentColor: "#fde68a" },
  easter: { ornament: "blossom", ornamentColor: "#f9a8d4" },
  summer: { ornament: "sun", ornamentColor: "#fde047" },
  spring: { ornament: "flower", ornamentColor: "#fbcfe8" },
  carnival: { ornament: "diamond", ornamentColor: "#fde047", nameTag: "pill" },
};

export function chatPresetConfig(id: ChatPresetId): CameraChatConfig {
  return { ...basePresetConfig(id), ...LOOK_TRAITS[id], ...THEME_IDENTITY[id], skin: id };
}

function basePresetConfig(id: ChatPresetId): CameraChatConfig {
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
    // Matrix: green code rain on black
    case "matrix":
      return {
        ...base,
        panelColor: "#000000", panelOpacity: 90, radius: 6, showBorders: false, messageBackground: false,
        fontFamily: "courier", textColor: "#86efac", nameColorMode: "single", nameColor: "#22c55e", nameStyle: "glow",
        frameStyle: "solid", frameColor: "#16a34a", frameWidth: 1,
        panelPattern: "scanlines", patternColor: "#22c55e", patternOpacity: 6,
        ambient: "code", ambientDensity: 18, ambientColor: "#22c55e", animationStyle: "glitch", textReveal: "typewriter",
      };
    // Fantasy
    case "fantasy":
      return {
        ...base,
        panelColor: "#1a1033", panelGradient: true, panelColor2: "#0f2a3d", panelOpacity: 86, radius: 16,
        showBorders: false, bubbleColor: "#fcd34d", bubbleOpacity: 6, textColor: "#f5f3ff", fontFamily: "palatino",
        namePalette: "pastel", readableNames: true, nameStyle: "shimmer", newMessageEffect: "glow",
        frameStyle: "glow", frameColor: "#fbbf24", frameWidth: 2,
        ambient: "sparkles", ambientDensity: 14, ambientColor: "#fde68a", animationStyle: "zoom",
      };
    case "steampunk":
      return {
        ...base,
        panelColor: "#2a1a0e", panelGradient: true, panelColor2: "#4a2c14", panelOpacity: 90, radius: 8,
        showBorders: false, textColor: "#fde8c8", bubbleColor: "#b87333", bubbleOpacity: 10, fontFamily: "georgia",
        namePalette: "warm", readableNames: true, messageLayout: "stacked",
        frameStyle: "solid", frameColor: "#b87333", frameWidth: 4,
        panelPattern: "grid", patternColor: "#d4a373", patternOpacity: 7,
        ambient: "embers", ambientDensity: 10, ambientColor: "#f59e0b", animationStyle: "swing",
      };
    case "gothic":
      return {
        ...base,
        panelColor: "#0a0204", panelGradient: true, panelColor2: "#2a0509", panelOpacity: 90, radius: 4,
        showBorders: false, textColor: "#e7e5e4", bubbleColor: "#7f1d1d", bubbleOpacity: 14, fontFamily: "cambria",
        nameColorMode: "single", nameColor: "#f87171", nameStyle: "glow",
        frameStyle: "pulse", frameColor: "#991b1b", frameColor2: "#1c1917", frameWidth: 2,
        ambient: "embers", ambientDensity: 8, ambientColor: "#ef4444", animationStyle: "fade", textReveal: "words",
      };
    case "dragon":
      return {
        ...base,
        panelColor: "#1c0a00", panelGradient: true, panelColor2: "#450a0a", panelOpacity: 88, radius: 14,
        showBorders: false, bubbleColor: "#f97316", bubbleOpacity: 8, readableNames: true, namePalette: "warm",
        nameStyle: "gradient", fontFamily: "bahnschrift", newMessageEffect: "flash",
        frameStyle: "flow", frameColor: "#ef4444", frameColor2: "#f59e0b", frameWidth: 3,
        ambient: "embers", ambientDensity: 16, ambientColor: "#fb923c", animationStyle: "drop",
      };
    // Cute and girly
    case "princess":
      return {
        ...base,
        panelColor: "#3b0a2a", panelGradient: true, panelColor2: "#581c47", panelOpacity: 86, radius: 22,
        showBorders: false, bubbleColor: "#f9a8d4", bubbleOpacity: 12, bubbleRadius: 18, bubbleShape: "tail",
        textColor: "#fff1f7", fontFamily: "segoeprint", namePalette: "pastel", readableNames: true, nameStyle: "shimmer",
        newMessageEffect: "pulse", frameStyle: "glow", frameColor: "#f9a8d4", frameWidth: 2,
        ambient: "sparkles", ambientDensity: 14, ambientColor: "#fbcfe8", animationStyle: "pop",
      };
    case "cottoncandy":
      return {
        ...base,
        panelColor: "#fdf2f8", panelGradient: true, panelColor2: "#e0f2fe", panelOpacity: 94, radius: 24,
        showBorders: false, textColor: "#581c87", textOpacity: 100, textShadow: "none",
        bubbleColor: "#ffffff", bubbleOpacity: 45, bubbleRadius: 18, fontFamily: "comic",
        nameColorMode: "single", nameColor: "#db2777",
        frameStyle: "gradient", frameColor: "#f9a8d4", frameColor2: "#7dd3fc", frameWidth: 3,
        ambient: "bubbles", ambientDensity: 10, ambientColor: "#f9a8d4", animationStyle: "bounce",
      };
    case "lilac":
      return {
        ...base,
        panelColor: "#2e1065", panelOpacity: 82, radius: 20, showBorders: false, bubbleColor: "#ddd6fe", bubbleOpacity: 10,
        textColor: "#faf5ff", namePalette: "pastel", readableNames: true, nameStyle: "gradient", fontFamily: "trebuchet",
        frameStyle: "glow", frameColor: "#c4b5fd", frameWidth: 2,
        ambient: "petals", ambientDensity: 12, ambientColor: "#d8b4fe", animationStyle: "swing",
      };
    case "unicorn":
      return {
        ...base,
        panelColor: "#2a1145", panelGradient: true, panelColor2: "#11284a", panelOpacity: 86, radius: 22,
        showBorders: false, bubbleColor: "#f5d0fe", bubbleOpacity: 10, readableNames: true, namePalette: "pastel",
        nameStyle: "rainbow", frameStyle: "rainbow", frameWidth: 3, frameSpeed: 6, panelAnimation: "shimmer",
        ambient: "sparkles", ambientDensity: 12, ambientColor: "#fef9c3", animationStyle: "bounce",
      };
    // Abstract
    case "aurora":
      return {
        ...base,
        panelColor: "#021b1a", panelGradient: true, panelColor2: "#2e1065", panelGradientAngle: 135, panelOpacity: 86,
        radius: 20, showBorders: false, bubbleColor: "#5eead4", bubbleOpacity: 6, readableNames: true, namePalette: "cool",
        nameStyle: "gradient", frameStyle: "flow", frameColor: "#34d399", frameColor2: "#a78bfa", frameWidth: 2, frameSpeed: 8,
        panelAnimation: "shimmer", ambient: "stars", ambientDensity: 10, ambientColor: "#ccfbf1", animationStyle: "fade",
      };
    case "hologram":
      return {
        ...base,
        panelColor: "#020617", panelOpacity: 82, radius: 12, showBorders: false, bubbleColor: "#67e8f9", bubbleOpacity: 6,
        textColor: "#e0f2fe", textShadow: "soft", readableNames: true, namePalette: "neon", nameStyle: "shimmer",
        fontFamily: "segoe", frameStyle: "rainbow", frameWidth: 1, frameSpeed: 4,
        panelPattern: "scanlines", patternColor: "#67e8f9", patternOpacity: 8, animationStyle: "glitch",
      };
    case "memphis":
      return {
        ...base,
        panelColor: "#111827", panelOpacity: 90, radius: 0, bubbleRadius: 0, showBorders: false,
        bubbleColor: "#facc15", bubbleOpacity: 8, bubbleShape: "skew", accentBar: true, readableNames: true,
        namePalette: "neon", nameUppercase: true, fontFamily: "franklin",
        frameStyle: "dashes", frameColor: "#f472b6", frameWidth: 3,
        panelPattern: "dots", patternColor: "#facc15", patternOpacity: 16, animationStyle: "pop",
      };
    case "lavalamp":
      return {
        ...base,
        panelColor: "#3b0764", panelGradient: true, panelColor2: "#7c2d12", panelGradientAngle: 200, panelOpacity: 86,
        radius: 26, showBorders: false, bubbleColor: "#fb923c", bubbleOpacity: 8, readableNames: true, namePalette: "warm",
        frameStyle: "pulse", frameColor: "#f97316", frameColor2: "#c026d3", frameWidth: 3, panelAnimation: "breathe",
        ambient: "bubbles", ambientDensity: 8, ambientColor: "#fdba74", animationStyle: "zoom",
      };
    case "vaporwave":
      return {
        ...base,
        panelColor: "#1e0b3b", panelGradient: true, panelColor2: "#0b2a4a", panelOpacity: 86, radius: 6,
        showBorders: false, bubbleColor: "#f0abfc", bubbleOpacity: 8, readableNames: true, namePalette: "neon",
        nameStyle: "gradient", fontFamily: "trebuchet", frameStyle: "gradient", frameColor: "#f0abfc", frameColor2: "#67e8f9",
        frameWidth: 2, panelPattern: "grid", patternColor: "#f0abfc", patternOpacity: 12, animationStyle: "slide",
      };
    case "comic":
      return {
        ...base,
        panelColor: "#fde047", panelOpacity: 96, radius: 4, showBorders: false, textColor: "#111111", textOpacity: 100,
        textShadow: "none", bubbleShape: "comic", bubbleColor: "#ffffff", fontFamily: "comic", textBold: true,
        nameColorMode: "single", nameColor: "#dc2626", nameUppercase: true, messageLayout: "stacked",
        frameStyle: "solid", frameColor: "#111111", frameWidth: 4, panelPattern: "halftone", patternColor: "#dc2626",
        patternOpacity: 22, animationStyle: "pop", newMessageEffect: "flash",
      };
    case "corkboard":
      return {
        ...base,
        panelColor: "#a8774a", panelGradient: true, panelColor2: "#8a5a32", panelOpacity: 97, radius: 6,
        showBorders: false, textColor: "#1f2937", textOpacity: 100, textShadow: "none", bubbleShape: "sticky",
        bubbleColor: "#fef08a", fontFamily: "segoeprint", nameColorMode: "single", nameColor: "#1d4ed8",
        frameStyle: "solid", frameColor: "#5b3a1a", frameWidth: 8, panelPattern: "halftone", patternColor: "#5b3a1a",
        patternOpacity: 18, animationStyle: "drop", density: "relaxed",
      };
    // Classic
    case "chalkboard":
      return {
        ...base,
        panelColor: "#1f3a2e", panelOpacity: 95, radius: 8, showBorders: false, messageBackground: false,
        textColor: "#f1f5f9", textShadow: "soft", fontFamily: "segoeprint", messageLayout: "stacked",
        namePalette: "pastel", readableNames: true, frameStyle: "solid", frameColor: "#8b5e3c", frameWidth: 6,
        animationStyle: "fade", textReveal: "typewriter",
      };
    case "blueprint":
      return {
        ...base,
        panelColor: "#0b3d91", panelOpacity: 93, radius: 2, showBorders: false, messageBackground: false,
        textColor: "#e0f2fe", fontFamily: "courier", nameColorMode: "single", nameColor: "#ffffff", nameUppercase: true,
        frameStyle: "dashes", frameColor: "#bfdbfe", frameWidth: 1, panelPattern: "grid", patternColor: "#bfdbfe",
        patternOpacity: 18, animationStyle: "wipe", density: "compact",
      };
    case "newspaper":
      return {
        ...base,
        panelColor: "#f5f1e6", panelOpacity: 96, radius: 0, showBorders: false, messageBackground: false,
        bubbleShape: "underline", textColor: "#111111", textOpacity: 100, textShadow: "none", fontFamily: "times",
        messageLayout: "stacked", nameColorMode: "single", nameColor: "#7f1d1d", nameUppercase: true,
        frameStyle: "solid", frameColor: "#111111", frameWidth: 2, animationStyle: "drop", density: "relaxed",
      };
    // Neon and games
    case "amberterm":
      return {
        ...base,
        panelColor: "#0a0700", panelOpacity: 93, radius: 3, showBorders: false, messageBackground: false,
        bubbleShape: "outline", fontFamily: "mono", textColor: "#fbbf24", messageLayout: "stacked",
        nameColorMode: "single", nameColor: "#f59e0b", nameUppercase: true,
        frameStyle: "corners", frameColor: "#f59e0b", frameWidth: 2, panelPattern: "scanlines", patternColor: "#f59e0b",
        patternOpacity: 7, animationStyle: "drop", textReveal: "words",
      };
    case "neontokyo":
      return {
        ...base,
        panelColor: "#0d0221", panelGradient: true, panelColor2: "#26014a", panelOpacity: 86, radius: 12,
        showBorders: false, bubbleColor: "#ff2a6d", bubbleOpacity: 10, bubbleShape: "skew", messageLayout: "bubble",
        fontFamily: "verdana", readableNames: true, namePalette: "neon", nameStyle: "glow", accentBar: true,
        frameStyle: "flow", frameColor: "#ff2a6d", frameColor2: "#05d9e8", frameWidth: 2,
        ambient: "rain", ambientDensity: 22, ambientColor: "#05d9e8", animationStyle: "slide",
      };
    case "arcade":
      return {
        ...base,
        panelColor: "#05050f", panelOpacity: 93, radius: 0, bubbleRadius: 0, showBorders: false, bubbleOpacity: 6,
        bubbleColor: "#facc15", bubbleShape: "outline", fontFamily: "arialblack", nameUppercase: true,
        namePalette: "neon", readableNames: true, nameStyle: "gradient", newMessageEffect: "flash",
        frameStyle: "rainbow", frameWidth: 3, frameSpeed: 3, panelPattern: "checker", patternOpacity: 4,
        ambient: "pixels", ambientDensity: 12, ambientColor: "#facc15", animationStyle: "bounce",
      };
    case "racing":
      return {
        ...base,
        panelColor: "#111111", panelOpacity: 88, radius: 4, showBorders: false, bubbleColor: "#ef4444", bubbleOpacity: 9,
        bubbleShape: "skew", accentBar: true, readableNames: true, nameUppercase: true, fontFamily: "franklin",
        messageLayout: "stacked", newMessageEffect: "shine", frameStyle: "corners", frameColor: "#facc15", frameWidth: 3,
        panelPattern: "carbon", patternOpacity: 6, animationStyle: "slide", density: "compact",
      };
    // Fantasy
    case "pirate":
      // An old treasure map: parchment with burnt edges, a rope frame, brown handwriting and a skull for every nick.
      return {
        ...base,
        panelColor: "#e8d5a3", panelGradient: true, panelColor2: "#c9a46a", panelGradientAngle: 160, panelOpacity: 97,
        radius: 6, showBorders: false, messageBackground: false, bubbleShape: "underline", textColor: "#3b2412",
        textOpacity: 100, textShadow: "none", fontFamily: "segoeprint", messageLayout: "stacked",
        nameColorMode: "single", nameColor: "#7f1d1d", frameStyle: "dashes", frameColor: "#5b3a1a", frameWidth: 4,
        panelPattern: "vignette", patternColor: "#5b3a1a", patternOpacity: 45, animationStyle: "swing",
        ornament: "skull", ornamentColor: "#3b2412",
      };
    case "samurai":
      return {
        ...base,
        panelColor: "#0c0a09", panelGradient: true, panelColor2: "#3f0d12", panelOpacity: 90, radius: 2,
        showBorders: false, messageBackground: false, bubbleShape: "underline", textColor: "#f5f5f4",
        fontFamily: "cambria", nameColorMode: "single", nameColor: "#ef4444", accentBar: true,
        frameStyle: "solid", frameColor: "#dc2626", frameWidth: 2, ambient: "petals", ambientDensity: 10,
        ambientColor: "#fecdd3", animationStyle: "wipe", textReveal: "words",
      };
    case "horror":
      return {
        ...base,
        panelColor: "#050805", panelGradient: true, panelColor2: "#14140a", panelOpacity: 92, radius: 4,
        showBorders: false, messageBackground: false, textColor: "#d6d3d1", textShadow: "strong", fontFamily: "lucida",
        messageLayout: "stacked", nameColorMode: "single", nameColor: "#dc2626", nameStyle: "glow",
        frameStyle: "pulse", frameColor: "#7f1d1d", frameColor2: "#14532d", frameWidth: 2,
        ambient: "fog", ambientDensity: 8, ambientColor: "#a3e635", animationStyle: "glitch", textReveal: "words",
      };
    case "western":
      return {
        ...base,
        panelColor: "#2b1b0e", panelGradient: true, panelColor2: "#5c3a1e", panelOpacity: 90, radius: 8,
        showBorders: false, textColor: "#fde9c9", bubbleColor: "#e9c46a", bubbleOpacity: 10, bubbleShape: "skew",
        fontFamily: "cambria", namePalette: "warm", readableNames: true, nameUppercase: true, showAvatars: true,
        frameStyle: "solid", frameColor: "#a0522d", frameWidth: 4, panelPattern: "stripes", patternColor: "#e9c46a",
        patternOpacity: 6, ambient: "fog", ambientDensity: 6, ambientColor: "#e9c46a", animationStyle: "drop",
      };
    // Cute and girly
    case "bubblegum":
      return {
        ...base,
        panelColor: "#4a0d3a", panelGradient: true, panelColor2: "#1e3a8a", panelOpacity: 86, radius: 26,
        showBorders: false, bubbleColor: "#f9a8d4", bubbleOpacity: 14, bubbleRadius: 20, bubbleShape: "tail",
        messageLayout: "bubble", fontFamily: "comic", readableNames: true, namePalette: "pastel", showAvatars: true,
        newMessageEffect: "pulse", frameStyle: "glow", frameColor: "#f472b6", frameWidth: 3,
        ambient: "bubbles", ambientDensity: 14, ambientColor: "#f9a8d4", animationStyle: "bounce",
      };
    case "pastelgoth":
      return {
        ...base,
        panelColor: "#0b0b10", panelOpacity: 90, radius: 16, showBorders: false, messageBackground: false,
        bubbleShape: "outline", textColor: "#f5f3ff", messageLayout: "stacked", namePalette: "pastel", readableNames: true,
        nameStyle: "glow", fontFamily: "trebuchet", frameStyle: "dashes", frameColor: "#f9a8d4", frameWidth: 2,
        panelPattern: "dots", patternColor: "#c4b5fd", patternOpacity: 10, ambient: "stars", ambientDensity: 10,
        ambientColor: "#f9a8d4", animationStyle: "fade",
      };
    case "y2k":
      return {
        ...base,
        panelColor: "#1e1b4b", panelGradient: true, panelColor2: "#0f766e", panelOpacity: 84, radius: 18,
        showBorders: false, bubbleColor: "#e0e7ff", bubbleOpacity: 10, readableNames: true, namePalette: "neon",
        nameStyle: "shimmer", fontFamily: "verdana", newMessageEffect: "shine", density: "relaxed",
        frameStyle: "gradient", frameColor: "#c0c0c0", frameColor2: "#f0abfc", frameWidth: 3,
        ambient: "sparkles", ambientDensity: 12, ambientColor: "#e0e7ff", animationStyle: "zoom",
      };
    case "peach":
      return {
        ...base,
        panelColor: "#fff1e6", panelOpacity: 95, radius: 20, showBorders: false, textColor: "#7c2d12", textOpacity: 100,
        textShadow: "none", bubbleColor: "#fdba74", bubbleOpacity: 24, bubbleRadius: 16, messageLayout: "bubble",
        fontFamily: "calibri", nameColorMode: "single", nameColor: "#c2410c", showAvatars: true,
        frameStyle: "glow", frameColor: "#fb923c", frameWidth: 2, ambient: "petals", ambientDensity: 8,
        ambientColor: "#fdba74", animationStyle: "pop",
      };
    // Abstract
    case "chrome":
      return {
        ...base,
        panelColor: "#18181b", panelGradient: true, panelColor2: "#3f3f46", panelOpacity: 88, radius: 14,
        showBorders: false, messageBackground: false, nameColorMode: "single", nameColor: "#e4e4e7",
        nameStyle: "shimmer", fontFamily: "segoe", accentBar: true, panelAnimation: "shimmer",
        frameStyle: "gradient", frameColor: "#f4f4f5", frameColor2: "#71717a", frameWidth: 2, animationStyle: "zoom",
      };
    case "neonwaves":
      return {
        ...base,
        panelColor: "#020617", panelOpacity: 88, radius: 18, showBorders: false, bubbleColor: "#22d3ee", bubbleOpacity: 6,
        messageLayout: "stacked", readableNames: true, namePalette: "neon", nameStyle: "gradient", fontFamily: "tahoma",
        newMessageEffect: "glow", frameStyle: "flow", frameColor: "#22d3ee", frameColor2: "#e879f9", frameWidth: 2,
        panelPattern: "waves", patternColor: "#e879f9", patternOpacity: 14, panelAnimation: "float", animationStyle: "swing",
      };
    case "music":
      return {
        ...base,
        panelColor: "#120a24", panelGradient: true, panelColor2: "#0a1a2e", panelOpacity: 88, radius: 18,
        showBorders: false, bubbleColor: "#a78bfa", bubbleOpacity: 10, messageLayout: "bubble", bubbleShape: "tail",
        readableNames: true, namePalette: "neon", fontFamily: "segoe", newMessageEffect: "pulse",
        frameStyle: "pulse", frameColor: "#a78bfa", frameColor2: "#22d3ee", frameWidth: 2,
        ambient: "music", ambientDensity: 12, ambientColor: "#c4b5fd", animationStyle: "bounce",
      };
    // Nature
    case "desert":
      return {
        ...base,
        panelColor: "#3b2412", panelGradient: true, panelColor2: "#7c4a1e", panelOpacity: 88, radius: 14,
        showBorders: false, messageBackground: false, bubbleShape: "underline", textColor: "#fff7ed",
        namePalette: "warm", readableNames: true, fontFamily: "palatino", frameStyle: "solid", frameColor: "#d97706",
        frameWidth: 2, panelPattern: "stripes", patternColor: "#fcd34d", patternOpacity: 5,
        ambient: "fog", ambientDensity: 6, ambientColor: "#fcd34d", animationStyle: "slide",
      };
    case "volcano":
      return {
        ...base,
        panelColor: "#1a0500", panelGradient: true, panelColor2: "#4a0d00", panelOpacity: 90, radius: 10,
        showBorders: false, bubbleColor: "#f97316", bubbleOpacity: 9, bubbleShape: "skew", messageLayout: "stacked",
        namePalette: "warm", readableNames: true, nameStyle: "glow", nameUppercase: true, accentBar: true,
        fontFamily: "bahnschrift", newMessageEffect: "flash", frameStyle: "pulse", frameColor: "#ef4444",
        frameColor2: "#f97316", frameWidth: 3, ambient: "embers", ambientDensity: 20, ambientColor: "#fb923c",
        animationStyle: "drop",
      };
    case "jungle":
      return {
        ...base,
        panelColor: "#052e16", panelGradient: true, panelColor2: "#14532d", panelOpacity: 88, radius: 22,
        showBorders: false, textColor: "#f0fdf4", bubbleColor: "#86efac", bubbleOpacity: 10, bubbleShape: "tail",
        messageLayout: "bubble", namePalette: "warm", readableNames: true, showAvatars: true, fontFamily: "trebuchet",
        frameStyle: "glow", frameColor: "#22c55e", frameWidth: 2, ambient: "fireflies", ambientDensity: 14,
        ambientColor: "#bef264", animationStyle: "swing",
      };
    // Seasons
    case "spring":
      return {
        ...base,
        panelColor: "#052e2b", panelGradient: true, panelColor2: "#14532d", panelOpacity: 84, radius: 20,
        showBorders: false, bubbleColor: "#bbf7d0", bubbleOpacity: 8, namePalette: "pastel", readableNames: true,
        nameStyle: "gradient", fontFamily: "calibri", textReveal: "words", frameStyle: "glow", frameColor: "#86efac",
        frameWidth: 2, panelPattern: "dots", patternColor: "#bbf7d0", patternOpacity: 8,
        ambient: "petals", ambientDensity: 12, ambientColor: "#fbcfe8", animationStyle: "rise",
      };
    case "carnival":
      return {
        ...base,
        panelColor: "#2e1065", panelGradient: true, panelColor2: "#831843", panelOpacity: 86, radius: 12,
        showBorders: false, bubbleColor: "#fde047", bubbleOpacity: 10, bubbleShape: "skew", messageLayout: "bubble",
        namePalette: "neon", readableNames: true, nameStyle: "rainbow", fontFamily: "arialblack", newMessageEffect: "flash",
        frameStyle: "rainbow", frameWidth: 3, ambient: "confetti", ambientDensity: 16, animationStyle: "flip",
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
