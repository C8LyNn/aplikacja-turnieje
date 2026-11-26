import {
  type CameraChatConfig,
  CHAT_MOTION_PRESETS,
  CHAT_NAME_PALETTE,
  CHAT_TEXT_SHADOWS,
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
  CHAT_LINK_PATTERN,
  parseChatNameList,
  parseChatWordList,
} from "./chat-message-format";

const html = `<div id="se-camera-chat">
  <div class="se-camera"></div>
  <div class="se-chat-box">
    <div class="se-panel">
      <div class="se-messages" id="se-chat-messages"></div>
    </div>
  </div>
</div>`;

/** JSON that stays inert even if the platform puts the script into an HTML <script> element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * The native StreamElements Custom Widget: standalone HTML/CSS/JS with the configuration written in. It listens to the
 * StreamElements chat events ("message", "delete-message", "delete-messages") and loads nothing from this site.
 */
export function generateStreamElementsWidget(config: CameraChatConfig) {
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
  const chatBox = chatOnly
    ? `width: 100%;
  height: 100%;`
    : config.layout === "right"
      ? `width: ${size.chatWidthPx}px;
  height: ${size.cameraHeight}px;
  display: flex;
  align-items: ${config.chatAnchor === "top" ? "flex-start" : "flex-end"};`
      : config.layout === "below"
        ? `width: 100%;
  height: ${config.belowHeight}px;`
        : `position: absolute;
  width: ${config.chatWidth}%;
  max-height: ${size.cameraHeight - inset * 2}px;
  border-radius: ${Math.max(6, config.radius * .7)}px;
  ${config.overlayPosition.includes("top") ? "top" : "bottom"}: ${inset}px;
  ${config.overlayPosition.includes("left") ? "left" : "right"}: ${inset}px;`;

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
  flex-direction: ${config.layout === "below" ? "column" : "row"};
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
  ${chatOnly || config.layout === "below" || (config.layout === "right" && config.fitChatHeight) ? "height: 100%;" : ""}
  ${config.layout === "overlay" ? `max-height: ${size.cameraHeight - inset * 2}px;` : ""}
  min-height: 0;
  overflow: hidden;
  background: ${rgbaCss(config.panelColor, config.panelOpacity)};
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
  ${config.messageBackground ? `border-radius: ${config.bubbleRadius}px; background: ${rgbaCss(config.bubbleColor, config.bubbleOpacity)};` : ""}
  ${config.showBorders ? "border: 1px solid rgba(255,255,255,.07);" : ""}
  ${config.messageLayout === "bubble" ? `align-self: ${right ? "flex-end" : "flex-start"}; max-width: 100%;` : ""}
  ${config.animateMessages ? `animation: ${config.animationStyle === "random" ? "se-chat-in-rise" : "se-chat-in"} ${config.animationDurationMs}ms cubic-bezier(.2,.7,.2,1) backwards;` : ""}
}
.se-message.se-highlight {
  border-radius: ${config.bubbleRadius}px;
  background: ${rgbaCss(config.highlightColor, 18)};
  box-shadow: inset ${right ? -3 : 3}px 0 0 ${config.highlightColor};
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
.se-name { ${block ? "" : "margin-right: 8px; "}font-weight: 900; }
.se-text { color: ${rgbaCss(config.textColor, config.textOpacity)}; overflow-wrap: anywhere;${block ? " display: block;" : ""} }
.se-action { font-style: italic; }
.se-badge { display: inline-block; height: ${chatBadgePx(config)}px; width: auto; margin-right: 4px; vertical-align: middle; }
.se-emote { display: inline-block; height: ${emoteSize}px; width: auto; margin: 0 1px; vertical-align: middle; }
.se-emote-only .se-emote { height: ${emoteSize * 2}px; }
${getCameraChatAnimationCss(config.animationStyle, "se-chat-in")}
${getCameraChatExitCss(config.exitStyle, config.textAlign, "se-chat-out")}
${getChatEffectCss(config, ".se-fx")}
@media (prefers-reduced-motion: reduce) {
  .se-message, .se-leaving, .se-message::after, .se-reveal, .se-emote { animation: none !important; }
}`;

  // Only validated, bounded configuration values are embedded in the exported script.
  const js = `(function () {
const settings = ${scriptJson({
    maxMessages: config.maxMessages,
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
  })};
const list = document.getElementById("se-chat-messages");
const nameColors = ${scriptJson(CHAT_NAME_PALETTE)};
const motionPresets = ${scriptJson(CHAT_MOTION_PRESETS)};
const imageHosts = ${scriptJson(CHAT_IMAGE_HOSTS)};
const linkPattern = new RegExp(${scriptJson(CHAT_LINK_PATTERN.source)}, "gi");
const dataImagePattern = new RegExp(${scriptJson(CHAT_DATA_IMAGE_PATTERN.source)}, "i");
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
function emoteMap(raw) {
  const known = new Map();
  if (!settings.showEmotes || !Array.isArray(raw)) return known;
  raw.slice(0, 100).forEach(function (emote) {
    if (!emote || typeof emote !== "object") return;
    const urls = emote.urls && typeof emote.urls === "object" ? emote.urls : {};
    const url = safeImage(urls["2"] != null ? urls["2"] : urls["1"] != null ? urls["1"] : urls["4"]);
    const name = asString(emote.name).slice(0, 100);
    if (name && url && !known.has(name)) known.set(name, url);
  });
  return known;
}
function textParts(text, known) {
  if (!known.size) return [{ kind: "text", text: text }];
  const parts = [];
  let buffer = "";
  text.split(/(\\s+)/).forEach(function (piece) {
    const url = known.get(piece);
    if (url) {
      if (buffer) parts.push({ kind: "text", text: buffer });
      buffer = "";
      parts.push({ kind: "emote", name: piece, url: url });
    } else {
      buffer += piece;
    }
  });
  if (buffer) parts.push({ kind: "text", text: buffer });
  return parts;
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
function buildRow(message) {
  const row = document.createElement("div");
  row.className = "se-message";
  const color = nameColor(message);
  const parts = textParts(shownText(message.text), message.emotes);
  const onlyEmotes = parts.some(function (part) { return part.kind === "emote"; })
    && parts.every(function (part) { return part.kind === "emote" || !part.text.trim(); });
  if (settings.emoteOnlyLarge && onlyEmotes) row.classList.add("se-emote-only");
  const role = settings.roleHighlight ? roleOf(message.roles) : null;
  if (highlighted(message.text)) {
    row.classList.add("se-highlight");
  } else if (role) {
    const roleColor = settings.roleColors[role];
    row.dataset.role = role;
    row.style.borderRadius = settings.bubbleRadius + "px";
    row.style.background = rgba(roleColor, 0.14);
    row.style.boxShadow = "inset " + (settings.alignRight ? -3 : 3) + "px 0 0 " + roleColor;
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
  let head = content;
  if (settings.blockLayout) {
    head = document.createElement("div");
    head.className = "se-head";
    content.appendChild(head);
  }
  message.badges.forEach(function (badge) {
    head.appendChild(image("se-badge", badge.url, badge.description || badge.type || ""));
  });
  const name = document.createElement("span");
  name.className = "se-name";
  name.textContent = message.name + (settings.showColon ? ":" : "");
  name.style.color = color;
  head.appendChild(name);
  // A line may break after the name, so the first word of the message is not split in two.
  if (!settings.blockLayout) content.appendChild(document.createElement("wbr"));
  const text = document.createElement("span");
  text.className = message.isAction ? "se-text se-action" : "se-text";
  if (message.isAction) text.style.color = color;
  (revealPieces(parts) || parts).forEach(function (part) {
    if (part.kind === "emote") {
      const emote = image("se-emote", part.url, part.name);
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
  window.setTimeout(function () {
    const row = renderedRows.get(message.localId);
    if (settings.exitMs > 0 && row) {
      row.classList.add("se-leaving");
      window.setTimeout(function () { removeMessage(message.localId); }, settings.exitMs);
    } else {
      removeMessage(message.localId);
    }
  }, settings.lifetimeMs);
}

window.addEventListener("onEventReceived", function (event) {
  const detail = event.detail || {};
  const payload = detail.event || {};
  const raw = payload.data || payload;
  const data = raw.data && typeof raw.data === "object" ? raw.data : raw;
  if (detail.listener === "message") {
    const text = asString(data.text);
    if (!text) return;
    const msgId = asString(data.msgId);
    if (msgId && messages.some(message => message.msgId === msgId)) return;
    const name = asString(data.displayName) || asString(data.nick) || "user";
    const nick = asString(data.nick);
    if (hiddenMessage(name, nick, text)) return;
    const message = {
      localId: ++nextLocalId,
      name,
      nick,
      text,
      msgId,
      userId: asString(data.userId),
      color: asString(data.displayColor),
      isAction: data.isAction === true,
      roles: Array.isArray(data.badges) ? data.badges.slice(0, 10).map(function (badge) {
        return badge && typeof badge === "object" ? asString(badge.type).toLowerCase().slice(0, 40) : "";
      }).filter(Boolean) : [],
      badges: badgeList(data.badges),
      emotes: emoteMap(data.emotes)
    };
    messages.push(message);
    messages = messages.slice(-100);
    scheduleExit(message);
  } else if (detail.listener === "delete-message") {
    const id = asString(data.msgId);
    if (!id) return;
    messages = messages.filter(message => message.msgId !== id);
  } else if (detail.listener === "delete-messages") {
    const id = asString(data.userId);
    if (!id) return;
    messages = messages.filter(message => message.userId !== id);
  } else {
    return;
  }
  renderMessages();
});
})();`;

  return { html, css, js };
}
