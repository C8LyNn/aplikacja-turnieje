import { t } from "@/i18n";
import { type CameraChatConfig, DEFAULT_CAMERA_CHAT_CONFIG } from "./camera-chat-settings";

/** Ready-made chat looks for the configurator; each one is a complete, URL-safe configuration. */
export type ChatPresetId = "glass" | "minimal" | "compact" | "neon" | "classic" | "bubbles" | "light" | "clear" | "terminal" | "esport";

export const CHAT_PRESET_IDS: readonly ChatPresetId[] =
  ["glass", "minimal", "compact", "neon", "classic", "bubbles", "light", "clear", "terminal", "esport"];

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
      };
  }
}
