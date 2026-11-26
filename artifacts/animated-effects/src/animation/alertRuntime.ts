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

function aeCaptionAnimation(intro, outro, playbackMs) {
  const lifetime = Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
  const enterMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  const exitMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  return "ae-caption-in-" + intro + " " + enterMs + "ms ease-out 0ms both, ae-caption-out-" + outro + " " + exitMs + "ms ease-in " + Math.max(0, lifetime - exitMs) + "ms forwards";
}

const aeCaptionFonts = {
  system: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
  impact: "Impact, Haettenschweiler, \"Arial Narrow Bold\", sans-serif",
  trebuchet: "\"Trebuchet MS\", Tahoma, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  georgia: "Georgia, \"Times New Roman\", serif",
  mono: "\"Cascadia Mono\", Consolas, \"Courier New\", monospace",
  comic: "\"Comic Sans MS\", \"Comic Neue\", cursive"
};

function aeCaptionShadow(effect, color) {
  if (effect === "none") return "none";
  if (effect === "outline") return "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 8px rgba(0,0,0,.85)";
  if (effect === "glow") return "0 0 2px rgba(0,0,0,.9), 0 0 10px " + color + ", 0 0 28px " + color;
  return "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
}

function aeCaptionBackground(hex, opacity) {
  const value = parseInt(hex.slice(1), 16);
  return "rgba(" + ((value >> 16) & 255) + ", " + ((value >> 8) & 255) + ", " + (value & 255) + ", " + Math.round(opacity) / 100 + ")";
}

function aeLetterStep(count, playbackMs) {
  if (count <= 1) return 0;
  const lifetime = Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
  return Math.max(12, Math.min(60, Math.floor(lifetime * 0.45 / count)));
}

function aeLetterAnimation(style, index, step) {
  const delay = index * step;
  if (style === "typewriter") return "ae-letter-type 1ms linear " + delay + "ms both";
  if (style === "pop") return "ae-letter-pop 360ms cubic-bezier(.2,.7,.3,1.4) " + delay + "ms both";
  return "ae-letter-wave 640ms ease-in-out " + (delay + 200) + "ms both";
}

// Words stay unbroken; each letter of the title gets its own staggered animation.
function aeCaptionTitle(target, text, letters, playbackMs) {
  const chars = Array.from(text);
  if (letters === "none" || chars.length > 120) {
    target.textContent = text;
    return;
  }
  const step = aeLetterStep(chars.filter(function (char) { return char.trim() !== ""; }).length, playbackMs);
  let index = 0;
  text.split(/(\s+)/).forEach(function (piece) {
    if (!piece) return;
    if (!piece.trim()) {
      target.appendChild(document.createTextNode(piece));
      return;
    }
    const word = document.createElement("span");
    word.className = "ae-alert-word";
    word.style.display = "inline-block";
    word.style.whiteSpace = "nowrap";
    Array.from(piece).forEach(function (char) {
      const letter = document.createElement("span");
      letter.className = "ae-alert-letter";
      letter.style.display = "inline-block";
      letter.style.animation = aeLetterAnimation(letters, index++, step);
      letter.textContent = char;
      word.appendChild(letter);
    });
    target.appendChild(word);
  });
}

// The alert sound is optional; a blocked or missing file never stops the visual alert.
function aePlaySound(sound) {
  if (!sound || typeof sound.url !== "string" || !sound.url) return;
  try {
    const audio = new Audio(sound.url);
    audio.volume = Math.max(0, Math.min(1, (Number(sound.volume) || 0) / 100));
    const played = audio.play();
    if (played && typeof played.catch === "function") played.catch(function () {});
  } catch (error) {
    // No audio support in this browser source.
  }
}

function aeAttachCaption(parent, caption, listener, event, playbackMs) {
  if (!caption || !caption.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.style.animation = aeCaptionAnimation(caption.intro ?? "slide", caption.outro ?? "fade", playbackMs);
  const title = aeCaptionText(caption.template, listener, event);
  const subtitle = caption.subtitle ? aeCaptionText(caption.subtitle, listener, event).trim() : "";
  const letters = caption.letters ?? "none";
  const background = caption.background ?? "none";
  const imageUrl = typeof caption.imageUrl === "string" && caption.imageUrl.slice(0, 8).toLowerCase() === "https://" ? caption.imageUrl : "";
  if (!subtitle && letters === "none" && background === "none" && !imageUrl) {
    label.textContent = title;
  } else {
    const box = document.createElement("span");
    box.className = "ae-alert-caption-box";
    box.style.display = "inline-block";
    box.style.maxWidth = "100%";
    if (background !== "none") {
      box.style.background = aeCaptionBackground(caption.backgroundColor ?? "#0f172a", caption.backgroundOpacity ?? 70);
      box.style.padding = ".3em .75em";
      box.style.borderRadius = background === "pill" ? "999px" : ".3em";
    }
    if (imageUrl) {
      const picture = document.createElement("img");
      picture.className = "ae-alert-image";
      picture.src = imageUrl;
      picture.alt = "";
      picture.style.display = "block";
      picture.style.height = (caption.imageSize ?? 160) + "px";
      picture.style.width = "auto";
      picture.style.maxWidth = "100%";
      picture.style.margin = "0 auto .2em";
      picture.style.objectFit = "contain";
      box.appendChild(picture);
    }
    const main = document.createElement("span");
    main.className = "ae-alert-caption-title";
    main.style.display = "block";
    aeCaptionTitle(main, title, letters, playbackMs);
    box.appendChild(main);
    if (subtitle) {
      const second = document.createElement("span");
      second.className = "ae-alert-caption-subtitle";
      second.style.display = "block";
      second.style.fontSize = ".55em";
      second.style.fontWeight = "600";
      second.style.marginTop = ".25em";
      second.textContent = subtitle;
      box.appendChild(second);
    }
    label.appendChild(box);
  }
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
  label.style.textShadow = aeCaptionShadow(caption.effect ?? "shadow", caption.color);
  if (caption.font && caption.font !== "default" && Object.prototype.hasOwnProperty.call(aeCaptionFonts, caption.font)) {
    label.style.fontFamily = aeCaptionFonts[caption.font];
  }
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
