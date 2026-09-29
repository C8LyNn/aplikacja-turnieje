import {
  getCameraChatSize,
  type CameraChatConfig,
} from "./camera-chat-settings";

const html = `<div id="se-camera-chat">
  <div class="se-camera"></div>
  <div class="se-chat-box">
    <div class="se-panel">
      <div class="se-messages" id="se-chat-messages"></div>
    </div>
  </div>
</div>`;

export function generateStreamElementsWidget(config: CameraChatConfig) {
  const size = getCameraChatSize(config);
  const inset = Math.min(
    config.overlayInset,
    Math.max(0, (size.cameraHeight - 1) / 2),
    Math.max(0, (config.cameraWidth - size.chatWidthPx) / 2),
  );
  const padding = config.density === "compact"
    ? "6px 10px"
    : config.density === "relaxed"
      ? "12px 16px"
      : "8px 12px";
  const messageGap = config.density === "compact"
    ? 4
    : config.density === "relaxed" ? 16 : 8;
  const fontSize = config.fontSize === "small"
    ? 12 : config.fontSize === "large" ? 16 : 14;
  const chatBox = config.layout === "right"
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
  gap: ${config.layout === "overlay" ? 0 : config.gap}px;
  width: ${size.width}px;
  height: ${size.height}px;
  overflow: hidden;
  border-radius: ${config.radius}px;
  ${config.showBorders ? "border: 1px solid rgba(255,255,255,.1);" : ""}
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.se-camera {
  flex: none;
  width: ${config.cameraWidth}px;
  height: ${size.cameraHeight}px;
  background: transparent;
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
  ${config.layout === "below" || (config.layout === "right" && config.fitChatHeight) ? "height: 100%;" : ""}
  ${config.layout === "overlay" ? `max-height: ${size.cameraHeight - inset * 2}px;` : ""}
  min-height: 0;
  overflow: hidden;
  background: rgba(2, 6, 23, ${config.panelOpacity / 100});
}
.se-messages {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: ${messageGap}px;
  padding: ${config.innerPadding}px;
}
.se-message {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 8px;
  padding: ${padding};
  ${config.messageBackground ? "border-radius: 12px; background: rgba(255,255,255,.055);" : ""}
  ${config.showBorders ? "border: 1px solid rgba(255,255,255,.07);" : ""}
  ${config.animateMessages ? "animation: se-chat-in 220ms ease-out both;" : ""}
}
.se-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  color: rgba(255,255,255,.7);
  font-size: 10px;
  font-weight: 900;
}
.se-content { min-width: 0; font-size: ${fontSize}px; line-height: 20px; }
.se-name { margin-right: 8px; font-weight: 900; }
.se-text { color: rgba(255,255,255,.85); overflow-wrap: anywhere; }
@keyframes se-chat-in {
  from { opacity: 0; transform: translateY(8px); }
  to { transform: translateY(0); }
}`;

  // Only validated, bounded configuration values are embedded in the exported script.
  const js = `(function () {
const settings = ${JSON.stringify({
    maxMessages: config.maxMessages,
    showAvatars: config.showAvatars,
    fadeOldMessages: config.fadeOldMessages,
  })};
const list = document.getElementById("se-chat-messages");
const nameColors = ["#fda4af", "#6ee7b7", "#c4b5fd", "#7dd3fc", "#fcd34d", "#67e8f9"];
let messages = [];

function asString(value) {
  return value == null ? "" : String(value);
}

function renderMessages() {
  if (!list) return;
  list.replaceChildren();
  const visible = messages.slice(-settings.maxMessages);
  visible.forEach((message, index) => {
    const row = document.createElement("div");
    row.className = "se-message";
    row.style.opacity = settings.fadeOldMessages
      ? String(0.5 + (index + 1) / visible.length * 0.5)
      : "1";
    if (settings.showAvatars) {
      const avatar = document.createElement("div");
      avatar.className = "se-avatar";
      avatar.textContent = message.name.charAt(0);
      row.appendChild(avatar);
    }
    const content = document.createElement("div");
    content.className = "se-content";
    const name = document.createElement("span");
    name.className = "se-name";
    name.textContent = message.name;
    name.style.color = message.color && typeof window.CSS?.supports === "function" && window.CSS.supports("color", message.color)
      ? message.color : nameColors[index % nameColors.length];
    const text = document.createElement("span");
    text.className = "se-text";
    text.textContent = message.text;
    content.append(name, text);
    row.appendChild(content);
    list.appendChild(row);
  });
}

window.addEventListener("onEventReceived", function (event) {
  const detail = event.detail || {};
  const payload = detail.event || {};
  const raw = payload.data || payload;
  const data = raw.data && typeof raw.data === "object" ? raw.data : raw;
  if (detail.listener === "message") {
    const text = asString(data.text);
    if (!text) return;
    messages.push({
      name: asString(data.displayName) || asString(data.nick) || "user",
      text,
      msgId: asString(data.msgId),
      userId: asString(data.userId),
      color: asString(data.displayColor)
    });
    messages = messages.slice(-100);
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