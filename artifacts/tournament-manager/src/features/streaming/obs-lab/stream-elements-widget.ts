import {
  type CameraChatConfig,
  CHAT_MOTION_PRESETS,
  CHAT_NAME_PALETTES,
  CHAT_TEXT_SHADOWS,
  chatOverlayPlacement,
  chatOverlaySize,
  isChatOverlayDock,
  chatPanelBackground,
  getChatFrameCss,
  chatAvatarPx,
  chatBadgePx,
  chatDensityGap,
  chatDensityPadding,
  chatEmotePx,
  chatExitMs,
  chatFontFamily,
  chatFontPx,
  chatLineHeightPx,
  chatRevealBaseMs,
  getCameraChatAnimationCss,
  getCameraChatExitCss,
  getCameraChatSize,
  getChatEffectCss,
  rgbaCss,
} from "./camera-chat-settings";
import {
  CHAT_ROLE_COLORS,
  CHAT_DATA_IMAGE_PATTERN,
  CHAT_IMAGE_HOSTS,
  CHAT_COMBO_MAX_LENGTH,
  CHAT_LINK_PATTERN,
  parseChatNameList,
  parseChatWordList,
} from "./chat-message-format";
import {
  FIRST_MESSAGE_COLOR,
  chatBubbleFilled,
  chatBurstPieces,
  chatDecorHtml,
  getChatDecorCss,
} from "./chat-decor";
import {
  type ChatEventLabels,
  CHAT_CONTROL_RANGES,
  CHAT_EVENT_ICONS,
  CHAT_EVENT_LABELS_EN,
  CHAT_EVENT_LISTENERS,
  CHAT_PACE_QUEUE_MAX,
  CHAT_PLACEHOLDER_PATTERN,
  CHAT_REPLY_MAX,
  CHEERMOTE_PATTERN,
  IRC_ESCAPE_PATTERN,
  POINTS_MESSAGE_COLOR,
  PREFIX_CURRENCIES,
  CHAT_GOAL_SESSION_KEYS,
  CHAT_HYPE_EVENT_WEIGHT,
  CHAT_HYPE_WINDOW_MS,
  chatConfettiPieces,
  chatGoalProgress,
  chatPaceIntervalMs,
  getChatEventCss,
} from "./chat-events";
import { CHAT_SOUND_RECIPES, CHAT_TICK_GAP_MS } from "./chat-sound";
import { chatOrnamentGlyph } from "./chat-ornaments";
import { chatSceneLevelThresholds } from "./chat-scenes";

/** The widget's markup; particles and the header box (texts escaped) sit in the panel before the message list. */
function widgetHtml(config: CameraChatConfig, labels: ChatEventLabels): string {
  const decor = chatDecorHtml(config, chatGoalProgress(config, config.goalStart, labels, labels.tipCurrency));
  return `<div id="se-camera-chat">
  <div class="se-camera"></div>
  <div class="se-chat-box">
    <div class="se-panel" data-chat-level="0">${decor.ambient}${decor.header}
      <div class="se-messages" id="se-chat-messages"></div>
    </div>
  </div>
</div>`;
}

/** JSON that stays inert even if the platform puts the script into an HTML <script> element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * The native StreamElements Custom Widget: standalone HTML/CSS/JS with the configuration written in. It listens to the
 * StreamElements chat events ("message", "delete-message", "delete-messages"), the stream events shown as chat rows
 * (follows, subs, cheers, raids, tips) and the channel currency from "onWidgetLoad"; it loads nothing from this site.
 * With emotes on it asks 7TV once for the channel's emote list (zero-width emotes stack on the previous one).
 */
export function generateStreamElementsWidget(
  config: CameraChatConfig,
  firstLabel = "NEW",
  eventLabels: ChatEventLabels = CHAT_EVENT_LABELS_EN,
) {
  const size = getCameraChatSize(config);
  const inset = Math.min(
    config.overlayInset,
    Math.max(0, (size.cameraHeight - 1) / 2),
    Math.max(0, (config.cameraWidth - size.chatWidthPx) / 2),
  );
  const fontSize = chatFontPx(config);
  const lineHeight = chatLineHeightPx(config);
  const avatarSize = chatAvatarPx(config);
  const emoteSize = chatEmotePx(config);
  const exitMs = chatExitMs(config);
  const right = config.textAlign === "right";
  const block = config.messageLayout !== "inline";
  const chatOnly = config.layout === "chat";
  const beside = config.layout === "right" || config.layout === "left";
  const stacked = config.layout === "below" || config.layout === "above";
  const placement = Object.entries(chatOverlayPlacement(config.overlayPosition, inset))
    .map(([property, value]) => `${property}: ${value};`)
    .join("\n  ");
  const dock = config.layout === "overlay" && isChatOverlayDock(config.overlayPosition);
  const overlaySize = Object.entries(chatOverlaySize(config.overlayPosition, config.chatWidth, size.cameraHeight, inset))
    .map(([property, value]) => `${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`)
    .join("\n  ");
  const chatBox = chatOnly
    ? `width: 100%;
  height: 100%;`
    : beside
      ? `width: ${size.chatWidthPx}px;
  height: ${size.cameraHeight}px;
  display: flex;
  align-items: ${config.chatAnchor === "top" ? "flex-start" : "flex-end"};`
      : stacked
        ? `width: 100%;
  height: ${config.belowHeight}px;`
        : `position: absolute;
  ${overlaySize}
  border-radius: ${Math.max(6, config.radius * .7)}px;
  ${placement}`;
  const filled = chatBubbleFilled(config);
  const bubbleFill = filled ? rgbaCss(config.bubbleColor, config.bubbleOpacity) : "transparent";
  const shaped = config.bubbleShape === "tail" || config.bubbleShape === "skew";
  const direction = config.layout === "below" ? "column"
    : config.layout === "above" ? "column-reverse"
      : config.layout === "left" ? "row-reverse" : "row";

  const css = `html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}
*, *::before, *::after { box-sizing: border-box; }
#se-camera-chat {
  position: relative;
  display: flex;
  flex-direction: ${direction};
  gap: ${config.layout === "overlay" || chatOnly ? 0 : config.gap}px;
  width: ${size.width}px;
  height: ${size.height}px;
  overflow: hidden;
  border-radius: ${config.radius}px;
  ${config.showBorders ? "border: 1px solid rgba(255,255,255,.1);" : ""}
  font-family: ${chatFontFamily(config)};
}
.se-camera {
  flex: none;
  width: ${config.cameraWidth}px;
  height: ${size.cameraHeight}px;
  background: transparent;
  ${chatOnly ? "display: none;" : ""}
}
.se-chat-box {
  flex: none;
  overflow: hidden;
  ${chatBox}
}
.se-panel {
  display: flex;
  flex-direction: column;
  justify-content: ${config.chatAnchor === "top" ? "flex-start" : "flex-end"};
  width: 100%;
  ${chatOnly || stacked || dock || (beside && config.fitChatHeight) ? "height: 100%;" : ""}
  ${config.layout === "overlay" ? `max-height: ${size.cameraHeight - inset * 2}px;` : ""}
  min-height: 0;
  overflow: hidden;
  background: ${chatPanelBackground(config)};
}
.se-messages {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: ${chatDensityGap(config.density)}px;
  padding: ${config.innerPadding}px;
}
.se-message {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  flex-direction: ${right ? "row-reverse" : "row"};
  text-align: ${config.textAlign};
  gap: 8px;
  padding: ${chatDensityPadding(config.density)};
  ${filled || config.bubbleShape === "outline" ? `border-radius: ${config.bubbleRadius}px;` : ""}
  ${filled ? `background: ${bubbleFill};` : ""}
  ${shaped ? `--chat-bubble: ${bubbleFill};` : ""}
  ${config.showBorders ? "border: 1px solid rgba(255,255,255,.07);" : ""}
  ${config.messageLayout === "bubble" ? `align-self: ${right ? "flex-end" : "flex-start"}; max-width: 100%;` : ""}
  ${config.animateMessages ? `animation: ${config.animationStyle === "random" ? "se-chat-in-rise" : "se-chat-in"} ${config.animationDurationMs}ms cubic-bezier(.2,.7,.2,1) backwards;` : ""}
}
.se-message.se-highlight {
  border-radius: ${config.bubbleRadius}px;
  background: ${rgbaCss(config.highlightColor, 18)};
  box-shadow: inset ${right ? -3 : 3}px 0 0 ${config.highlightColor};
  ${shaped ? `--chat-bubble: ${rgbaCss(config.highlightColor, 18)};` : ""}
}
.se-leaving { animation: se-chat-out ${exitMs}ms ease-in forwards !important; }
.se-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: ${avatarSize}px;
  height: ${avatarSize}px;
  border-radius: 50%;
  font-size: ${Math.round(avatarSize * 0.36)}px;
  font-weight: 900;
}
.se-content {
  min-width: 0;
  font-size: ${fontSize}px;
  line-height: ${lineHeight}px;
  ${config.textShadow === "none" ? "" : `text-shadow: ${CHAT_TEXT_SHADOWS[config.textShadow]};`}
}
.se-head { display: block; }
.se-name { ${block ? "" : "margin-right: 8px; "}font-weight: 900;${config.nameUppercase ? " text-transform: uppercase;" : ""} }
.se-text { color: ${rgbaCss(config.textColor, config.textOpacity)}; overflow-wrap: anywhere;${block ? " display: block;" : ""}${config.textBold ? " font-weight: 600;" : ""} }
.se-action { font-style: italic; }
.se-badge { display: inline-block; height: ${chatBadgePx(config)}px; width: auto; margin-right: 4px; vertical-align: middle; }
.se-emote { display: inline-block; height: ${emoteSize}px; width: auto; margin: 0 1px; vertical-align: middle; }
.se-emote-only .se-emote { height: ${emoteSize * 2}px; }
.se-emote-stack { position: relative; display: inline-block; margin: 0 1px; vertical-align: middle; }
.se-emote-stack > .se-emote { display: block; margin: 0; }
.se-emote-stack > .se-emote-over { position: absolute; left: 50%; top: 50%; max-width: none; transform: translate(-50%, -50%); }
${getCameraChatAnimationCss(config.animationStyle, "se-chat-in")}
${getCameraChatExitCss(config.exitStyle, config.textAlign, "se-chat-out")}
${getChatEffectCss(config, ".se-fx")}
${getChatFrameCss(config, ".se-panel", ".se-messages")}
${getChatDecorCss(config, ".se-panel", ".se-message")}
${getChatEventCss(config, ".se-message")}
@media (prefers-reduced-motion: reduce) {
  .se-message, .se-leaving, .se-message::after, .se-reveal, .se-emote, .se-emote-stack,
  .se-panel, .se-panel::before, .se-panel::after, .se-messages { animation: none !important; }
  .chat-amb, .chat-live-dot, .chat-burst { animation: none !important; }
}`;

  // Only validated, bounded configuration values are embedded in the exported script.
  const js = `(function () {
const settings = ${scriptJson({
    maxMessages: config.maxMessages,
    sceneLevels: chatSceneLevelThresholds(config.maxMessages),
    showAvatars: config.showAvatars,
    fadeOldMessages: config.fadeOldMessages,
    animateMessages: config.animateMessages,
    animationStyle: config.animationStyle,
    newestFirst: config.newestFirst,
    alignRight: right,
    blockLayout: block,
    showColon: config.showColon,
    nameColorMode: config.nameColorMode,
    nameColor: config.nameColor,
    readableNames: config.readableNames,
    accentBar: config.accentBar,
    showBadges: config.showBadges,
    showEmotes: config.showEmotes,
    emoteOnlyLarge: config.emoteOnlyLarge,
    hideCommands: config.hideCommands,
    hideLinks: config.hideLinks,
    maxLength: config.maxMessageLength,
    ignoredUsers: parseChatNameList(config.ignoredUsers),
    highlightWords: parseChatWordList(config.highlightWords),
    lifetimeMs: config.messageLifetime * 1000,
    exitMs,
    effect: config.newMessageEffect,
    roleHighlight: config.roleHighlight,
    roleColors: CHAT_ROLE_COLORS,
    bubbleRadius: config.bubbleRadius,
    textReveal: config.textReveal,
    revealBaseMs: chatRevealBaseMs(config),
    firstTimeHighlight: config.firstTimeHighlight,
    firstColor: FIRST_MESSAGE_COLOR,
    firstLabel: firstLabel.slice(0, 20),
    bubbleShape: config.bubbleShape,
    shapedBubble: shaped,
    emoteBurst: config.emoteBurst && config.showEmotes,
    burstPieces: chatBurstPieces(config),
    streamEvents: config.streamEvents,
    eventKinds: config.eventKinds,
    eventMinBits: config.eventMinBits,
    eventStyle: config.eventStyle,
    eventIcons: CHAT_EVENT_ICONS,
    eventLabels: Object.fromEntries(Object.entries(eventLabels).map(([key, value]) => [key, String(value).slice(0, 200)])),
    pointsHighlight: config.pointsHighlight,
    pointsColor: POINTS_MESSAGE_COLOR,
    showReplies: config.showReplies,
    replyMax: CHAT_REPLY_MAX,
    paceMs: chatPaceIntervalMs(config.floodLimit),
    paceMax: CHAT_PACE_QUEUE_MAX,
    goalKind: config.goalKind,
    goalTarget: config.goalTarget,
    goalStart: config.goalStart,
    goalSessionKey: config.goalKind === "none" ? null : CHAT_GOAL_SESSION_KEYS[config.goalKind],
    hypeMeter: config.hypeMeter,
    hypeTarget: config.hypeTarget,
    hypeWindow: CHAT_HYPE_WINDOW_MS,
    hypeEventWeight: CHAT_HYPE_EVENT_WEIGHT,
    confetti: config.eventConfetti ? chatConfettiPieces() : [],
    sound: config.sound,
    soundVolume: config.soundVolume,
    soundRecipe: CHAT_SOUND_RECIPES[config.soundStyle],
    tickRecipe: CHAT_SOUND_RECIPES.tick,
    tickGap: CHAT_TICK_GAP_MS,
    nameStyle: config.nameStyle,
    nameTag: config.nameTag,
    ornamentGlyph: chatOrnamentGlyph(config.ornament),
    combo: config.comboMessages,
    comboMax: CHAT_COMBO_MAX_LENGTH,
  })};
const list = document.getElementById("se-chat-messages");
const panelBox = list ? list.parentNode : null;

// How full the chat is (0 = empty): the scene and the particles step back as messages arrive (same as the preview).
function sceneLevel(count) {
  if (count <= 0) return 0;
  return count <= settings.sceneLevels[0] ? 1 : count <= settings.sceneLevels[1] ? 2 : 3;
}
const nameColors = ${scriptJson(CHAT_NAME_PALETTES[config.namePalette])};
const motionPresets = ${scriptJson(CHAT_MOTION_PRESETS)};
const imageHosts = ${scriptJson(CHAT_IMAGE_HOSTS)};
const linkPattern = new RegExp(${scriptJson(CHAT_LINK_PATTERN.source)}, "gi");
const dataImagePattern = new RegExp(${scriptJson(CHAT_DATA_IMAGE_PATTERN.source)}, "i");
const eventListeners = ${scriptJson(CHAT_EVENT_LISTENERS)};
const cheerPattern = new RegExp(${scriptJson(CHEERMOTE_PATTERN.source)}, "gi");
const prefixCurrencies = ${scriptJson(PREFIX_CURRENCIES)};
const placeholderPattern = new RegExp(${scriptJson(CHAT_PLACEHOLDER_PATTERN.source)});
const ircEscapePattern = new RegExp(${scriptJson(IRC_ESCAPE_PATTERN.source)}, "g");
const controlPattern = new RegExp("[" + ${scriptJson(CHAT_CONTROL_RANGES)}.map(function (range) {
  return String.fromCharCode(range[0]) + "-" + String.fromCharCode(range[1]);
}).join("") + "]", "g");
let currency = settings.eventLabels.tipCurrency || "";
function hash(key) {
  let value = 0;
  for (let i = 0; i < key.length; i++) {
    value = (Math.imul(value, 31) + key.charCodeAt(i)) >>> 0;
  }
  return value;
}
function pickMotion(key) {
  return motionPresets[hash(key) % motionPresets.length];
}
let messages = [];
let nextLocalId = 0;
const renderedRows = new Map();

function asString(value) {
  return value == null ? "" : String(value);
}
function hexColor(value) {
  const raw = asString(value).trim();
  const hex = raw.charAt(0) === "#" ? raw : "#" + raw;
  return raw && /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : "";
}
function rgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return "rgba(" + ((value >> 16) & 255) + ", " + ((value >> 8) & 255) + ", " + (value & 255) + ", " + alpha + ")";
}
function readable(hex) {
  const value = parseInt(hex.slice(1), 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const luma = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (luma >= 0.5) return hex;
  const mix = (0.5 - luma) / (1 - luma);
  return "#" + rgb.map(function (channel) {
    return Math.round(channel + (255 - channel) * mix).toString(16).padStart(2, "0");
  }).join("");
}
function nameColor(message) {
  if (settings.nameColorMode === "single") return settings.nameColor;
  const own = settings.nameColorMode === "user" ? hexColor(message.color) : "";
  if (!own) return nameColors[hash(message.name.toLowerCase()) % nameColors.length];
  return settings.readableNames ? readable(own) : own;
}
// Images only from https addresses of the chat CDNs; nothing a viewer types is ever parsed as HTML.
function safeImage(value) {
  if (typeof value !== "string" || value.length > 2048) return "";
  if (dataImagePattern.test(value)) return value;
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return "";
  }
  if (url.protocol !== "https:" || url.username || url.password) return "";
  const host = url.hostname.toLowerCase();
  return imageHosts.some(function (allowed) {
    return host === allowed || host.endsWith("." + allowed);
  }) ? url.href : "";
}
function hiddenMessage(name, nick, text) {
  if (settings.hideCommands && text.trimStart().charAt(0) === "!") return true;
  if (!settings.ignoredUsers.length) return false;
  return [name, nick].some(function (value) {
    return value !== "" && settings.ignoredUsers.indexOf(value.toLowerCase()) !== -1;
  });
}
function shownText(text) {
  let value = settings.hideLinks ? text.replace(linkPattern, "[link]") : text;
  if (settings.maxLength > 0) {
    const chars = Array.from(value);
    if (chars.length > settings.maxLength) value = chars.slice(0, settings.maxLength).join("").trimEnd() + "\\u2026";
  }
  return value;
}
function highlighted(text) {
  if (!settings.highlightWords.length) return false;
  const lower = text.toLowerCase();
  return settings.highlightWords.some(function (word) {
    return lower.indexOf(word) !== -1;
  });
}
function badgeList(raw) {
  if (!settings.showBadges || !Array.isArray(raw)) return [];
  return raw.slice(0, 6).map(function (badge) {
    if (!badge || typeof badge !== "object") return null;
    const url = safeImage(badge.url);
    return url ? { type: asString(badge.type).slice(0, 40), url: url, description: asString(badge.description).slice(0, 60) } : null;
  }).filter(Boolean);
}
// 7TV (asked once per channel, again after 15 minutes): which emotes are zero-width, drawn on top of the emote before
// them, and unlisted 7TV emotes StreamElements leaves out. Copy of chat-emote-sources.ts.
const sevenTv = { room: "", askedAt: 0, loading: false, emotes: null };
function sevenTvList(raw) {
  const root = raw && typeof raw === "object" ? raw : {};
  const set = root.emote_set && typeof root.emote_set === "object" ? root.emote_set : root;
  const result = [];
  (Array.isArray(set.emotes) ? set.emotes.slice(0, 2000) : []).forEach(function (entry) {
    if (!entry || typeof entry !== "object") return;
    const data = entry.data && typeof entry.data === "object" ? entry.data : {};
    const host = data.host && typeof data.host === "object" ? data.host : {};
    const name = typeof entry.name === "string" ? entry.name.slice(0, 100) : "";
    const base = typeof host.url === "string" ? host.url.slice(0, 300) : "";
    if (!name || !base) return;
    const files = Array.isArray(host.files) ? host.files.map(function (file) {
      return file && typeof file.name === "string" ? file.name.slice(0, 40) : "";
    }) : [];
    const file = ["2x.webp", "1x.webp", "2x.gif", "1x.gif"].find(function (candidate) { return files.indexOf(candidate) !== -1; }) || "2x.webp";
    const url = safeImage((base.indexOf("//") === 0 ? "https:" : "") + base + "/" + file);
    if (url) result.push({ name: name, url: url, zeroWidth: (Number(entry.flags) & 1) !== 0 || (Number(data.flags) & 256) !== 0 });
  });
  return result;
}
function sevenTvJson(url) {
  if (typeof fetch !== "function") return Promise.resolve(null);
  return fetch(url).then(function (response) { return response.ok ? response.json() : null; }).catch(function () { return null; });
}
function sevenTvLoad(roomId) {
  sevenTv.room = roomId;
  sevenTv.askedAt = Date.now();
  sevenTv.loading = true;
  Promise.all([sevenTvJson("https://7tv.io/v3/users/twitch/" + roomId), sevenTvJson("https://7tv.io/v3/emote-sets/global")]).then(function (answers) {
    if (sevenTv.room !== roomId) return;
    const emotes = new Map();
    sevenTvList(answers[0]).concat(sevenTvList(answers[1])).forEach(function (emote) {
      if (!emotes.has(emote.name)) emotes.set(emote.name, emote);
    });
    sevenTv.emotes = emotes;
    sevenTv.loading = false;
  });
}
function sevenTvFor(roomId) {
  if (!settings.showEmotes || !/^\\d{1,20}$/.test(roomId)) return null;
  if (roomId !== sevenTv.room) {
    sevenTv.emotes = null;
    sevenTvLoad(roomId);
  } else if (!sevenTv.loading && Date.now() - sevenTv.askedAt > 900000) {
    sevenTvLoad(roomId);
  }
  return sevenTv.emotes;
}
function emoteMap(raw, text, seven) {
  const known = new Map();
  if (!settings.showEmotes) return known;
  (Array.isArray(raw) ? raw.slice(0, 100) : []).forEach(function (emote) {
    if (!emote || typeof emote !== "object") return;
    const urls = emote.urls && typeof emote.urls === "object" ? emote.urls : {};
    const url = safeImage(urls["2"] != null ? urls["2"] : urls["1"] != null ? urls["1"] : urls["4"]);
    const name = asString(emote.name).slice(0, 100);
    if (!name || !url || known.has(name)) return;
    const extra = seven ? seven.get(name) : null;
    known.set(name, { url: url, zeroWidth: Boolean(extra && extra.zeroWidth) });
  });
  if (seven && seven.size) {
    asString(text).split(/\\s+/).forEach(function (word) {
      if (!word || known.has(word) || known.size >= 100) return;
      const extra = seven.get(word);
      if (extra) known.set(word, { url: extra.url, zeroWidth: extra.zeroWidth });
    });
  }
  return known;
}
// A zero-width emote right after an emote (only spaces between) is drawn on top of it, at most 4 per emote.
function textParts(text, known) {
  if (!known.size) return [{ kind: "text", text: text }];
  const parts = [];
  let buffer = "";
  text.split(/(\\s+)/).forEach(function (piece) {
    const emote = known.get(piece);
    if (emote) {
      const base = parts[parts.length - 1];
      if (emote.zeroWidth && base && base.kind === "emote" && !buffer.trim() && (base.overlays ? base.overlays.length : 0) < 4) {
        base.overlays = (base.overlays || []).concat([{ name: piece, url: emote.url }]);
        buffer = "";
        return;
      }
      if (buffer) parts.push({ kind: "text", text: buffer });
      buffer = "";
      parts.push({ kind: "emote", name: piece, url: emote.url });
    } else {
      buffer += piece;
    }
  });
  if (buffer) parts.push({ kind: "text", text: buffer });
  return parts;
}
function cleanText(value, max) {
  return Array.from(asString(value).replace(controlPattern, " ").replace(/\\s+/g, " ").trim()).slice(0, max).join("");
}
function eventAmount(value) {
  const number = typeof value === "number" ? value : parseFloat(asString(value));
  return isFinite(number) && number > 0 ? Math.min(number, 10000000) : 0;
}
function formatTip(amount) {
  const rounded = Math.round(amount * 100) / 100;
  const value = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
  if (!currency) return value;
  return prefixCurrencies.indexOf(currency) !== -1 ? currency + value : value + " " + currency;
}
// Each sub of a gift bomb arrives on its own after the bomb ("isCommunityGift"); only the bomb gets a row.
function eventFrom(listener, data) {
  const kind = eventListeners[listener];
  if (!kind || !data || typeof data !== "object") return null;
  const name = cleanText(data.displayName != null ? data.displayName : data.name, 40);
  if (!name) return null;
  const id = cleanText(data._id != null ? data._id : data.activityId, 80);
  const text = cleanText(data.message, 300);
  const amount = eventAmount(data.amount);
  if (kind === "sub") {
    if (data.isCommunityGift === true && data.bulkGifted !== true) return null;
    const tier = cleanText(data.tier, 10).toLowerCase();
    const sender = cleanText(data.sender, 40);
    if (data.bulkGifted === true) {
      return { event: { kind: "gift", name: sender || name, sender: sender || name, amount: Math.max(1, amount), bulk: true, tier: tier }, text: "", id: id };
    }
    if (data.gifted === true) return { event: { kind: "gift", name: name, sender: sender || "?", amount: 1, tier: tier }, text: "", id: id };
    return { event: { kind: "sub", name: name, amount: Math.max(1, amount), tier: tier }, text: text, id: id };
  }
  const said = kind === "cheer" ? text.replace(cheerPattern, "$1").replace(/\\s+/g, " ").trim() : text;
  return { event: { kind: kind, name: name, amount: amount }, text: said, id: id };
}
function eventShown(event) {
  if (!settings.streamEvents || settings.eventKinds.indexOf(event.kind) === -1) return false;
  return event.kind !== "cheer" || event.amount >= settings.eventMinBits;
}
// The template is split on its placeholders; names are inserted as text.
function eventTitleParts(event) {
  const labels = settings.eventLabels;
  const template = event.kind === "sub" ? (event.amount > 1 ? labels.resub : labels.sub)
    : event.kind === "gift" ? (event.bulk ? labels.giftBulk : labels.gift)
      : labels[event.kind];
  const values = {
    "{name}": event.name,
    "{sender}": event.sender || "",
    "{amount}": event.kind === "tip" ? formatTip(event.amount) : String(Math.round(event.amount)),
  };
  return asString(template).split(placeholderPattern).filter(Boolean).map(function (piece) {
    return Object.prototype.hasOwnProperty.call(values, piece) ? { text: values[piece], strong: true } : { text: piece };
  });
}
function eventTag(event) {
  if (event.kind !== "sub" && event.kind !== "gift") return "";
  return event.tier === "prime" ? "Prime" : event.tier === "2000" ? "T2" : event.tier === "3000" ? "T3" : "";
}
function unescapeTag(value) {
  return value.replace(ircEscapePattern, function (match, code) {
    return code === "s" ? " " : code === ":" ? ";" : code === "r" || code === "n" ? " " : code;
  });
}
function replyFrom(tags) {
  if (!tags) return null;
  const parent = tags["reply-parent-display-name"] != null ? tags["reply-parent-display-name"] : tags["reply-parent-user-login"];
  const name = cleanText(unescapeTag(asString(parent)), 40);
  if (!name) return null;
  const chars = Array.from(cleanText(unescapeTag(asString(tags["reply-parent-msg-body"])), 400));
  return { name: name, text: chars.length > settings.replyMax ? chars.slice(0, settings.replyMax).join("").trimEnd() + "\\u2026" : chars.join("") };
}
function withoutMention(text, reply) {
  if (!reply) return text;
  const prefix = "@" + reply.name.toLowerCase() + " ";
  return text.toLowerCase().indexOf(prefix) === 0 ? text.slice(prefix.length) : text;
}
function roleOf(types) {
  if (types.indexOf("broadcaster") !== -1) return "broadcaster";
  if (types.indexOf("moderator") !== -1) return "moderator";
  if (types.indexOf("vip") !== -1) return "vip";
  return null;
}
function revealStep(count) {
  return count <= 1 ? 0 : Math.max(12, Math.min(45, Math.floor(1400 / count)));
}
// Letters (typewriter) or words appear one after another; emotes count as one step; long messages appear at once.
function revealPieces(parts) {
  if (settings.textReveal === "none") return null;
  let total = 0;
  parts.forEach(function (part) { total += part.kind === "text" ? Array.from(part.text).length : 1; });
  if (total > 200) return null;
  const pieces = [];
  const animated = [];
  parts.forEach(function (part) {
    if (part.kind === "emote") {
      const emote = { kind: "emote", name: part.name, url: part.url };
      if (part.overlays) emote.overlays = part.overlays;
      pieces.push(emote);
      animated.push(emote);
      return;
    }
    part.text.split(/(\\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      if (!chunk.trim()) {
        pieces.push({ kind: "text", text: chunk });
      } else if (settings.textReveal === "words") {
        const word = { kind: "text", text: chunk, word: true };
        pieces.push(word);
        animated.push(word);
      } else {
        Array.from(chunk).forEach(function (char) {
          const letter = { kind: "text", text: char };
          pieces.push(letter);
          animated.push(letter);
        });
      }
    });
  });
  const step = revealStep(animated.length);
  animated.forEach(function (piece, index) {
    const delay = settings.revealBaseMs + index * step;
    piece.animation = settings.textReveal === "words"
      ? "chat-reveal-word 280ms ease-out " + delay + "ms both"
      : "chat-reveal-type 1ms linear " + delay + "ms both";
  });
  return pieces;
}
function image(className, src, alt) {
  const element = document.createElement("img");
  element.className = className;
  element.src = src;
  element.alt = alt;
  return element;
}
function buildEventRow(message) {
  const event = message.event;
  const row = document.createElement("div");
  row.className = "se-message chat-event chat-event-" + event.kind + " chat-event-" + settings.eventStyle;
  row.dataset.event = event.kind;
  if (settings.animateMessages && settings.animationStyle === "random") {
    row.style.animationName = "se-chat-in-" + pickMotion(message.msgId || message.name + "|" + message.text);
  }
  const icon = document.createElement("span");
  icon.className = "chat-event-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = settings.eventIcons[event.kind];
  row.appendChild(icon);
  const body = document.createElement("div");
  body.className = "se-content chat-event-body";
  const title = document.createElement("span");
  title.className = "chat-event-title";
  eventTitleParts(event).forEach(function (part) {
    if (part.strong) {
      const strong = document.createElement("span");
      strong.className = "chat-event-name";
      strong.textContent = part.text;
      title.appendChild(strong);
    } else {
      title.appendChild(document.createTextNode(part.text));
    }
  });
  const tag = eventTag(event);
  if (tag) {
    const badge = document.createElement("span");
    badge.className = "chat-event-tag";
    badge.textContent = tag;
    title.appendChild(badge);
  }
  body.appendChild(title);
  const said = shownText(message.text).trim();
  if (said) {
    const line = document.createElement("span");
    line.className = "chat-event-text";
    line.textContent = said;
    body.appendChild(line);
  }
  row.appendChild(body);
  settings.confetti.forEach(function (piece) {
    const bit = document.createElement("span");
    bit.className = "chat-confetti";
    bit.setAttribute("aria-hidden", "true");
    bit.style.setProperty("--x", piece.x);
    bit.style.setProperty("--y", piece.y);
    bit.style.setProperty("--r", piece.r);
    bit.style.setProperty("--d", piece.d);
    bit.style.background = piece.color;
    row.appendChild(bit);
  });
  return row;
}
// Goal bar: start value, the StreamElements session counter (onWidgetLoad) and the events since then.
let goalSession = 0;
let goalLive = 0;
const seenEventIds = new Set();
function goalAmount(event) {
  if (settings.goalKind === "follow") return event.kind === "follow" ? 1 : 0;
  if (settings.goalKind === "sub") return event.kind === "sub" ? 1 : event.kind === "gift" ? (event.bulk ? event.amount : 1) : 0;
  if (settings.goalKind === "bits") return event.kind === "cheer" ? event.amount : 0;
  if (settings.goalKind === "tip") return event.kind === "tip" ? event.amount : 0;
  return 0;
}
function goalValue(value) {
  return settings.goalKind === "tip" ? formatTip(value) : String(Math.floor(value));
}
function renderGoal() {
  const box = document.querySelector(".chat-goal");
  if (settings.goalKind === "none" || !box) return;
  const count = settings.goalStart + goalSession + goalLive;
  const target = Math.max(1, settings.goalTarget);
  box.querySelector(".chat-goal-count").textContent = goalValue(count) + " / " + goalValue(target);
  box.querySelector(".chat-goal-fill").style.width = Math.min(100, Math.floor(count / target * 100)) + "%";
  if (count >= target) box.setAttribute("data-done", "1");
  else box.removeAttribute("data-done");
}
// Hype meter: shown messages (1) and events (5) of the last 20 seconds.
const hypeHits = [];
let hypeTimer = null;
function renderHype() {
  const box = document.querySelector(".chat-hype");
  if (!settings.hypeMeter || !box) return;
  const now = Date.now();
  while (hypeHits.length && now - hypeHits[0].at >= settings.hypeWindow) hypeHits.shift();
  let sum = 0;
  hypeHits.forEach(function (hit) { sum += hit.weight; });
  const percent = Math.min(100, Math.floor(sum / Math.max(1, settings.hypeTarget) * 100));
  box.querySelector(".chat-hype-fill").style.width = percent + "%";
  if (percent >= 100) box.setAttribute("data-hot", "1");
  else box.removeAttribute("data-hot");
  if (hypeTimer === null && hypeHits.length) {
    hypeTimer = window.setTimeout(function () {
      hypeTimer = null;
      renderHype();
    }, 1000);
  }
}
function addHype(weight) {
  if (!settings.hypeMeter) return;
  hypeHits.push({ at: Date.now(), weight: weight });
  renderHype();
}
// Sounds drawn with Web Audio (nothing is downloaded); OBS plays them without a click.
let audio = null;
let lastTick = 0;
function audioContext() {
  if (!audio) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      audio = new Context();
    } catch (error) {
      return null;
    }
  }
  if (audio.state === "suspended" && audio.resume) {
    const resumed = audio.resume();
    if (resumed && resumed.catch) resumed.catch(function () {});
  }
  return audio;
}
function playNotes(notes) {
  const share = Math.max(0, Math.min(100, settings.soundVolume)) / 100;
  const peak = share * share * 0.35;
  if (peak <= 0) return;
  const context = audioContext();
  if (!context) return;
  const start = context.currentTime + 0.01;
  notes.forEach(function (note) {
    const from = start + note.at;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.freq, from);
    if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to, from + note.dur);
    gain.gain.setValueAtTime(0.0001, from);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * note.gain), from + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, from + note.dur);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(from);
    oscillator.stop(from + note.dur + 0.05);
  });
}
function soundFor(message) {
  if (settings.sound === "none") return;
  if (message.event) {
    playNotes(settings.soundRecipe);
    return;
  }
  if (settings.sound !== "all") return;
  const now = Date.now();
  if (now - lastTick < settings.tickGap) return;
  lastTick = now;
  playNotes(settings.tickRecipe);
}
function buildRow(message) {
  if (message.event) return buildEventRow(message);
  const row = document.createElement("div");
  row.className = "se-message";
  const color = nameColor(message);
  const parts = textParts(shownText(withoutMention(message.text, message.reply)), message.emotes);
  const onlyEmotes = parts.some(function (part) { return part.kind === "emote"; })
    && parts.every(function (part) { return part.kind === "emote" || !part.text.trim(); });
  if (settings.emoteOnlyLarge && onlyEmotes) row.classList.add("se-emote-only");
  const role = settings.roleHighlight ? roleOf(message.roles) : null;
  const points = settings.pointsHighlight && message.pointsMessage === true;
  const first = settings.firstTimeHighlight && message.firstMessage === true;
  if (points) row.dataset.points = "1";
  if (first) row.dataset.first = "1";
  // Outline / underline shapes draw a line in the name colour.
  if (settings.bubbleShape === "outline") row.style.border = "1.5px solid " + rgba(color, 0.7);
  if (settings.bubbleShape === "underline") row.style.borderBottom = "2px solid " + color;
  // Precedence: highlighted word, channel-points highlight, first message, role, then the plain bubble.
  if (highlighted(message.text)) {
    row.classList.add("se-highlight");
    row.dataset.highlight = "1";
  } else if (points || first || role) {
    const tint = points ? settings.pointsColor : first ? settings.firstColor : settings.roleColors[role];
    if (!points && !first) row.dataset.role = role;
    row.style.borderRadius = settings.bubbleRadius + "px";
    row.style.background = rgba(tint, 0.14);
    row.style.boxShadow = "inset " + (settings.alignRight ? -3 : 3) + "px 0 0 " + tint;
    if (settings.shapedBubble) row.style.setProperty("--chat-bubble", rgba(tint, 0.14));
  } else if (settings.accentBar) {
    row.style.boxShadow = "inset " + (settings.alignRight ? -3 : 3) + "px 0 0 " + color;
  }
  if (settings.effect !== "none") {
    row.classList.add("se-fx", "se-fx-" + settings.effect);
    row.style.setProperty("--chat-fx", color);
  }
  if (settings.animateMessages && settings.animationStyle === "random") {
    row.style.animationName = "se-chat-in-" + pickMotion(message.msgId || message.name + "|" + message.text);
  }
  if (settings.showAvatars) {
    const avatar = document.createElement("div");
    avatar.className = "se-avatar";
    avatar.textContent = (Array.from(message.name)[0] || "").toUpperCase();
    avatar.style.color = color;
    avatar.style.background = rgba(color, 0.22);
    row.appendChild(avatar);
  }
  const content = document.createElement("div");
  content.className = "se-content";
  if (message.reply) {
    const reply = document.createElement("span");
    reply.className = "chat-reply";
    reply.appendChild(document.createTextNode("\\u21aa "));
    const who = document.createElement("span");
    who.className = "chat-reply-name";
    who.textContent = "@" + message.reply.name;
    reply.appendChild(who);
    if (message.reply.text) reply.appendChild(document.createTextNode(": " + message.reply.text));
    content.appendChild(reply);
  }
  let head = content;
  if (settings.blockLayout) {
    head = document.createElement("div");
    head.className = "se-head";
    content.appendChild(head);
  }
  if (first) {
    const tag = document.createElement("span");
    tag.className = "chat-first-tag";
    tag.textContent = settings.firstLabel;
    head.appendChild(tag);
  }
  message.badges.forEach(function (badge) {
    head.appendChild(image("se-badge", badge.url, badge.description || badge.type || ""));
  });
  const name = document.createElement("span");
  name.className = "se-name chat-name";
  name.textContent = message.name + (settings.showColon ? ":" : "");
  if (settings.nameStyle !== "plain" || settings.nameTag !== "plain") name.style.setProperty("--chat-name", color);
  if (settings.nameTag === "pill") name.style.setProperty("--chat-name-bg", readable(color));
  if (settings.ornamentGlyph) {
    const mark = document.createElement("span");
    mark.className = "chat-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = settings.ornamentGlyph;
    head.appendChild(mark);
  }
  name.style.color = color;
  head.appendChild(name);
  // A line may break after the name, so the first word of the message is not split in two.
  if (!settings.blockLayout) content.appendChild(document.createElement("wbr"));
  const text = document.createElement("span");
  text.className = message.isAction ? "se-text se-action chat-text" : "se-text chat-text";
  if (message.isAction) text.style.color = color;
  (revealPieces(parts) || parts).forEach(function (part) {
    if (part.kind === "emote") {
      let emote = image("se-emote", part.url, part.name);
      if (part.overlays && part.overlays.length) {
        const stack = document.createElement("span");
        stack.className = "se-emote-stack";
        stack.appendChild(emote);
        part.overlays.forEach(function (layer) { stack.appendChild(image("se-emote se-emote-over", layer.url, layer.name)); });
        emote = stack;
      }
      if (part.animation) emote.style.animation = part.animation;
      text.appendChild(emote);
    } else if (part.animation) {
      const piece = document.createElement("span");
      piece.className = "se-reveal";
      if (part.word) piece.style.display = "inline-block";
      piece.style.animation = part.animation;
      piece.textContent = part.text;
      text.appendChild(piece);
    } else {
      text.appendChild(document.createTextNode(part.text));
    }
  });
  content.appendChild(text);
  row.appendChild(content);
  const firstEmote = parts.find(function (part) { return part.kind === "emote"; });
  if (settings.emoteBurst && firstEmote) {
    settings.burstPieces.forEach(function (piece) {
      const copy = image("chat-burst", firstEmote.url, "");
      copy.style.left = piece.left;
      copy.style.animationDelay = piece.delay;
      row.appendChild(copy);
    });
  }
  return row;
}

function renderMessages() {
  if (!list) return;
  const visible = messages.slice(-settings.maxMessages);
  const visibleIds = new Set(visible.map(message => message.localId));
  // Moderation removes rows immediately, without replaying the animations of survivors.
  for (const [id, row] of renderedRows) {
    if (!visibleIds.has(id)) {
      row.remove();
      renderedRows.delete(id);
    }
  }
  // New rows are inserted where they belong; rows already on screen are never moved (moving replays animations).
  const ordered = settings.newestFirst ? visible.slice().reverse() : visible;
  let anchor = null;
  for (let i = ordered.length - 1; i >= 0; i--) {
    let row = renderedRows.get(ordered[i].localId);
    if (!row) {
      row = buildRow(ordered[i]);
      renderedRows.set(ordered[i].localId, row);
    }
    if (row.parentNode !== list || row.nextSibling !== anchor) list.insertBefore(row, anchor);
    anchor = row;
  }
  if (panelBox && panelBox.setAttribute) panelBox.setAttribute("data-chat-level", String(sceneLevel(visible.length)));
  visible.forEach((message, index) => {
    renderedRows.get(message.localId).style.opacity = settings.fadeOldMessages
      ? String(0.5 + (index + 1) / visible.length * 0.5)
      : "1";
  });
}

function removeMessage(localId) {
  const count = messages.length;
  messages = messages.filter(message => message.localId !== localId);
  if (messages.length !== count) renderMessages();
}

function scheduleExit(message) {
  if (!(settings.lifetimeMs > 0)) return;
  // A combo restarts the lifetime: only the timer of the latest version counts.
  const version = message.version || 0;
  window.setTimeout(function () {
    if ((message.version || 0) !== version) return;
    message.leaving = true;
    const row = renderedRows.get(message.localId);
    if (settings.exitMs > 0 && row) {
      row.classList.add("se-leaving");
      window.setTimeout(function () { removeMessage(message.localId); }, settings.exitMs);
    } else {
      removeMessage(message.localId);
    }
  }, settings.lifetimeMs);
}

// Calm chat: at most one message per interval; the rest wait in a short queue (the oldest is dropped when it is full).
const paceQueue = [];
let paceLast = -Infinity;
let paceTimer = null;
// Combo: a short message equal to the row just before joins it ("x2, x3..."), while that row is still shown.
function comboKey(message) {
  if (message.event) return "";
  const key = message.text.trim().replace(/\\s+/g, " ").toLowerCase();
  return key && Array.from(key).length <= settings.comboMax ? key : "";
}
function updateCombo(message) {
  const row = renderedRows.get(message.localId);
  const content = row ? row.querySelector(".se-content") : null;
  if (!content) return;
  const old = content.querySelector(".chat-combo");
  if (old) old.remove();
  if (!(message.combo > 1)) return;
  const badge = document.createElement("span");
  badge.className = "chat-combo";
  if (message.combo >= 5) badge.dataset.hot = "1";
  badge.textContent = "\\u00d7" + message.combo;
  content.appendChild(badge);
}
function membersOf(message) {
  return message.members || [message];
}
function show(message) {
  const last = messages[messages.length - 1];
  const key = settings.combo ? comboKey(message) : "";
  if (key && last && !last.leaving && comboKey(last) === key) {
    last.members = membersOf(last).concat([{ msgId: message.msgId, userId: message.userId }]);
    last.combo = last.members.length;
    last.version = (last.version || 0) + 1;
    updateCombo(last);
    scheduleExit(last);
    addHype(1);
    return;
  }
  messages.push(message);
  messages = messages.slice(-100);
  scheduleExit(message);
  renderMessages();
  soundFor(message);
  addHype(message.event ? settings.hypeEventWeight : 1);
}
function schedulePace() {
  if (paceTimer !== null) return;
  paceTimer = window.setTimeout(function () {
    paceTimer = null;
    const next = paceQueue.shift();
    if (!next) return;
    paceLast = Date.now();
    show(next);
    if (paceQueue.length) schedulePace();
  }, Math.max(0, paceLast + settings.paceMs - Date.now()));
}
function pace(message) {
  if (!(settings.paceMs > 0)) {
    show(message);
    return;
  }
  const now = Date.now();
  if (!paceQueue.length && now - paceLast >= settings.paceMs) {
    paceLast = now;
    show(message);
    return;
  }
  paceQueue.push(message);
  if (paceQueue.length > settings.paceMax) paceQueue.shift();
  schedulePace();
}
// Moderation: a removed message leaves its combo (the count drops); a row with nothing left disappears.
function dropMembers(test) {
  messages = messages.filter(function (message) {
    const members = membersOf(message);
    const left = members.filter(function (member) { return !test(member); });
    if (!left.length) return false;
    if (left.length !== members.length) {
      message.members = left;
      message.combo = left.length;
      updateCombo(message);
    }
    return true;
  });
}
function dropWaiting(test) {
  for (let i = paceQueue.length - 1; i >= 0; i--) {
    if (test(paceQueue[i])) paceQueue.splice(i, 1);
  }
}

// The channel currency for tips.
window.addEventListener("onWidgetLoad", function (event) {
  const detail = event.detail || {};
  const symbol = detail.currency && typeof detail.currency === "object" ? cleanText(detail.currency.symbol, 5) : "";
  if (symbol) currency = symbol;
  const session = detail.session && typeof detail.session === "object" && detail.session.data && typeof detail.session.data === "object"
    ? detail.session.data : null;
  if (session && settings.goalSessionKey) {
    const entry = session[settings.goalSessionKey[0]];
    const value = entry && typeof entry === "object" ? Number(entry[settings.goalSessionKey[1]]) : NaN;
    if (isFinite(value) && value >= 0) goalSession = Math.min(value, 10000000);
  }
  renderGoal();
});

window.addEventListener("onEventReceived", function (event) {
  const detail = event.detail || {};
  const payload = detail.event || {};
  const raw = payload.data || payload;
  const data = raw.data && typeof raw.data === "object" ? raw.data : raw;
  if (detail.listener === "message") {
    const text = asString(data.text);
    if (!text) return;
    const msgId = asString(data.msgId);
    if (msgId && (messages.some(message => membersOf(message).some(member => member.msgId === msgId))
      || paceQueue.some(message => message.msgId === msgId))) return;
    const name = asString(data.displayName) || asString(data.nick) || "user";
    const nick = asString(data.nick);
    if (hiddenMessage(name, nick, text)) return;
    const tags = data.tags && typeof data.tags === "object" ? data.tags : null;
    const message = {
      localId: ++nextLocalId,
      name,
      nick,
      text,
      msgId,
      pointsMessage: Boolean(tags && tags["msg-id"] === "highlighted-message"),
      reply: settings.showReplies ? replyFrom(tags) : null,
      userId: asString(data.userId),
      color: asString(data.displayColor),
      isAction: data.isAction === true,
      firstMessage: Boolean(data.tags && typeof data.tags === "object" && data.tags["first-msg"] === "1"),
      roles: Array.isArray(data.badges) ? data.badges.slice(0, 10).map(function (badge) {
        return badge && typeof badge === "object" ? asString(badge.type).toLowerCase().slice(0, 40) : "";
      }).filter(Boolean) : [],
      badges: badgeList(data.badges),
      emotes: emoteMap(data.emotes, text, sevenTvFor(tags ? asString(tags["room-id"]) : ""))
    };
    pace(message);
    return;
  } else if (eventListeners[detail.listener]) {
    // Events go straight to the screen, past the calm-chat queue.
    const intake = eventFrom(detail.listener, data);
    if (!intake) return;
    if (intake.id) {
      if (seenEventIds.has(intake.id)) return;
      seenEventIds.add(intake.id);
    }
    // Events that get no row still move the goal bar.
    const goal = goalAmount(intake.event);
    if (goal > 0) {
      goalLive += goal;
      renderGoal();
    }
    if (!eventShown(intake.event)) return;
    show({
      localId: ++nextLocalId,
      name: intake.event.name,
      nick: "",
      text: intake.text,
      msgId: "",
      eventId: intake.id,
      userId: "",
      event: intake.event,
      reply: null,
      roles: [],
      badges: [],
      emotes: new Map()
    });
    return;
  } else if (detail.listener === "delete-message") {
    const id = asString(data.msgId);
    if (!id) return;
    dropMembers(member => member.msgId === id);
    dropWaiting(message => message.msgId === id);
  } else if (detail.listener === "delete-messages") {
    const id = asString(data.userId);
    if (!id) return;
    dropMembers(member => member.userId === id);
    dropWaiting(message => message.userId === id);
  } else {
    return;
  }
  renderMessages();
});
})();`;

  return { html: widgetHtml(config, eventLabels), css, js };
}
