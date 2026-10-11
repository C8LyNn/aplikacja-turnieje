/** Standalone ES2018 JavaScript embedded into the generated Custom Widget.
 * Keep aligned with alertText.ts; the test suite checks both paths.
 */
export const ALERT_WIDGET_RUNTIME = String.raw`
function aeAlertTextField(value, max) {
  return (typeof value === "string" || typeof value === "number" && Number.isFinite(value))
    ? String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max)
    : "";
}

function aeAlertData(listener, event) {
  const data = event && typeof event === "object" && !Array.isArray(event) ? event : {};
  const nested = data.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : {};
  const messageSnippet = nested.snippet && typeof nested.snippet === "object"
    ? nested.snippet.displayMessage : undefined;
  const name = listener === "message"
    ? aeAlertTextField(nested.displayName ?? nested.nick ?? data.name, 60)
    : aeAlertTextField(data.name ?? data.sender, 60);
  const message = listener === "message"
    ? aeAlertTextField(nested.text ?? messageSnippet ?? data.text, 180)
    : aeAlertTextField(data.message, 180);
  return { name: name || "Widz", amount: aeAlertTextField(data.amount, 32), message, event: listener };
}

function aeCaptionText(template, listener, data) {
  const fields = aeAlertData(listener, data);
  const source = typeof template === "string" ? template.slice(0, 160) : "";
  return source.replace(/\{(name|amount|message|event)\}/g, function (_, key) {
    return fields[key] ?? "";
  }).slice(0, 280);
}

function aeAttachCaption(parent, caption, listener, event) {
  if (!caption || !caption.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.textContent = aeCaptionText(caption.template, listener, event);
  label.style.position = "absolute";
  label.style.left = "5%";
  label.style.width = "90%";
  label.style.maxWidth = "90%";
  label.style.textAlign = "center";
  label.style.whiteSpace = "pre-wrap";
  label.style.overflowWrap = "anywhere";
  label.style.pointerEvents = "none";
  label.style.color = caption.color;
  label.style.fontSize = caption.fontSize + "px";
  label.style.fontWeight = "700";
  label.style.lineHeight = "1.2";
  label.style.textShadow = "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
  if (caption.position === "custom") {
    label.style.left = (caption.xPercent ?? 50) + "%";
    label.style.top = (caption.yPercent ?? 75) + "%";
    label.style.width = "48%";
    label.style.transform = "translate(-50%, -50%)";
  } else if (caption.position === "top") {
    label.style.top = "8%";
  } else if (caption.position === "center") {
    label.style.top = "50%";
    label.style.transform = "translateY(-50%)";
  } else {
    label.style.bottom = "8%";
  }
  if (caption.avatarEnabled) {
    const name = aeAlertData(listener, event).name;
    aeAttachAvatar(label, event, name, caption.avatarSize ?? 72);
  }
  parent.appendChild(label);
  return label;
}
`;
