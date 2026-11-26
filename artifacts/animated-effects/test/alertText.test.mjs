import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const load = (file, resolver = () => { throw new Error("Unexpected dependency"); }) => {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: resolver, URL });
  return exports;
};
const avatar = load("../src/animation/alertAvatar.ts");
const motionStyles = load("../src/animation/captionMotion.ts");
const editor = load("../src/animation/alertText.ts", (id) => { if (id === "./alertAvatar") return avatar;
  if (id === "./captionMotion") return motionStyles; throw new Error(id); });
const runtime = load("../src/animation/alertRuntime.ts");
const live = {};
runInNewContext(runtime.ALERT_WIDGET_RUNTIME + "\nthis.render = aeCaptionText; this.motion = aeCaptionAnimation;", live);

test("follower, tip and chat captions agree between editor and exported widget", () => {
  const examples = [
    ["follower-latest", { name: "New viewer" }, "Dzięki {name}! {amount}"],
    ["tip-latest", { name: "Alice", amount: 25.5, message: "Good game" }, "{name} · {amount} · {message}"],
    ["message", { data: { displayName: "Some chatter", text: "<svg/onload=alert(1)>" } }, "{name}: {message}"],
    ["message", { data: { nick: "oldnick", text: "ok" } }, "{name}: {message}"],
    ["message", { data: { snippet: { displayMessage: "YouTube hello" }, displayName: "YouTubeUser" } }, "{name}: {message}"],
    ["raid-latest", { sender: "RaidLeader", amount: 38 }, "{name} · {amount}"],
  ];
  for (const [listener, payload, template] of examples) {
    assert.equal(editor.formatAlertCaption(template, listener, payload), live.render(template, listener, payload));
  }
});

test("caption schema clamps untrusted color, template, placement and size", () => {
  const result = editor.normalizeAlertCaption({
    enabled: true, template: "x".repeat(2000), position: "javascript:foo",
    color: "red;display:none", fontSize: 999999,
  });
  assert.equal(result.enabled, true);
  assert.equal(result.template.length, 160);
  assert.equal(result.position, "bottom");
  assert.equal(result.color, "#ffffff");
  assert.equal(result.fontSize, 120);
});

test("control characters are stripped, message size is bounded and unknown placeholders remain literal", () => {
  const payload = { data: { displayName: "A\nB", text: "M".repeat(500) } };
  const result = editor.formatAlertCaption("{name}: {message} {missing}", "message", payload);
  assert.ok(!result.includes("\n"));
  assert.ok(result.includes("A B"));
  assert.ok(result.includes("{missing}"));
  assert.ok(result.length <= 280);
  assert.equal(result, live.render("{name}: {message} {missing}", "message", payload));
});

test("avatar URL validation restricts transport and host without query-based bypasses", () => {
  assert.equal(avatar.safeAvatarUrl("http://static-cdn.jtvnw.net/photo.png"), null);
  assert.equal(avatar.safeAvatarUrl("https://static-cdn.jtvnw.net.evil.test/photo"), null);
  assert.equal(avatar.safeAvatarUrl("https://example.com/photo"), null);
  assert.equal(avatar.safeAvatarUrl("javascript:alert(1)"), null);
  assert.equal(avatar.safeAvatarUrl("https://evil.test@static-cdn.jtvnw.net/photo"), null);
  assert.equal(
    avatar.safeAvatarUrl("https://static-cdn.jtvnw.net/test/photo.png"),
    "https://static-cdn.jtvnw.net/test/photo.png",
  );
  assert.equal(
    avatar.avatarFromEvent({ data: { avatar: "https://yt3.googleusercontent.com/avatar" } }),
    "https://yt3.googleusercontent.com/avatar",
  );
});

test("avatar settings default off and clamp imported sizes", () => {
  const defaults = editor.normalizeAlertCaption(undefined);
  assert.equal(defaults.avatarEnabled, false);
  assert.equal(defaults.avatarSize, 72);
  assert.equal(editor.normalizeAlertCaption({ enabled: true, avatarEnabled: true, avatarSize: 999 }).avatarSize, 144);
  assert.equal(editor.normalizeAlertCaption({ avatarSize: -200 }).avatarSize, 32);
});


test("custom caption coordinates clamp to the visible safe band", () => {
  const caption = editor.normalizeAlertCaption({
    enabled: true, position: "custom", xPercent: 200, yPercent: -10,
  });
  assert.equal(caption.position, "custom");
  assert.equal(caption.xPercent, 75);
  assert.equal(caption.yPercent, 10);
  const baseline = editor.normalizeAlertCaption(undefined);
  assert.equal(baseline.position, "bottom");
  assert.equal(baseline.xPercent, 50);
  assert.equal(baseline.yPercent, 75);
});

test("entry and exit timing is identical in editor and generated widget", () => {
  for (const duration of [300, 500, 1200, 6000, 180000]) {
    for (const intro of ["fade", "slide", "pop"]) {
      for (const outro of ["fade", "slide", "pop"]) {
        assert.equal(
          motionStyles.captionAnimationShorthand(intro, outro, duration),
          live.motion(intro, outro, duration),
        );
      }
    }
  }
  const normalized = editor.normalizeAlertCaption({
    enabled: true, intro: "javascript:alert(1)", outro: "hijack",
  });
  assert.equal(normalized.intro, "slide");
  assert.equal(normalized.outro, "fade");
});

// --- Caption styles (fonts, effects, background, second line, letters) -------------------------------------------
const liveStyles = {};
runInNewContext(
  runtime.ALERT_WIDGET_RUNTIME
    + "\nthis.shadow = aeCaptionShadow; this.background = aeCaptionBackground; this.step = aeLetterStep;"
    + " this.letter = aeLetterAnimation; this.fonts = aeCaptionFonts; this.motion = aeCaptionAnimation;",
  liveStyles,
);

test("new caption options default to the original look and reject unknown values", () => {
  const legacy = editor.normalizeAlertCaption({ enabled: true, template: "{name}", intro: "pop", outro: "slide" });
  assert.equal(legacy.font, "default");
  assert.equal(legacy.effect, "shadow");
  assert.equal(legacy.background, "none");
  assert.equal(legacy.letters, "none");
  assert.equal(legacy.subtitle, "");
  assert.equal(legacy.intro, "pop");
  assert.equal(legacy.outro, "slide");
  const hostile = editor.normalizeAlertCaption({
    enabled: true, font: "url(x)", effect: "expression(alert(1))", background: "image", letters: "rotate",
    backgroundColor: "red;display:none", backgroundOpacity: 999, subtitle: "a\nb".padEnd(400, "c"),
    intro: "teleport", outro: "explode",
  });
  assert.equal(hostile.font, "default");
  assert.equal(hostile.effect, "shadow");
  assert.equal(hostile.background, "none");
  assert.equal(hostile.letters, "none");
  assert.equal(hostile.backgroundColor, "#0f172a");
  assert.equal(hostile.backgroundOpacity, 100);
  assert.equal(hostile.subtitle.length, 160);
  assert.ok(!hostile.subtitle.includes("\n"));
  assert.equal(hostile.intro, "slide");
  assert.equal(hostile.outro, "fade");
  const chosen = editor.normalizeAlertCaption({
    enabled: true, font: "impact", effect: "glow", background: "pill", letters: "typewriter",
    backgroundColor: "#123456", backgroundOpacity: 40, subtitle: "{message}", intro: "bounce", outro: "blur",
  });
  assert.deepEqual(
    [chosen.font, chosen.effect, chosen.background, chosen.letters, chosen.backgroundColor, chosen.backgroundOpacity, chosen.subtitle, chosen.intro, chosen.outro],
    ["impact", "glow", "pill", "typewriter", "#123456", 40, "{message}", "bounce", "blur"],
  );
});

test("caption styles are identical in the editor and the generated widget", () => {
  assert.deepEqual({ ...liveStyles.fonts }, { ...editor.CAPTION_FONT_STACKS });
  for (const effect of ["shadow", "outline", "glow", "none"]) {
    assert.equal(editor.captionTextShadow(effect, "#fde68a"), liveStyles.shadow(effect, "#fde68a"));
  }
  assert.equal(editor.captionTextShadow("shadow", "#ffffff"), "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)", "original look");
  for (const opacity of [0, 35, 70, 100]) {
    assert.equal(editor.captionBackgroundColor("#0c4a6e", opacity), liveStyles.background("#0c4a6e", opacity));
  }
  for (const count of [0, 1, 5, 30, 119]) {
    for (const playback of [300, 4000, 7100, 180000, NaN]) {
      const step = motionStyles.captionLetterStepMs(count, playback);
      assert.equal(step, liveStyles.step(count, playback));
      for (const style of ["wave", "typewriter", "pop"]) {
        assert.equal(motionStyles.captionLetterAnimation(style, count, step), liveStyles.letter(style, count, step));
      }
    }
  }
});

test("every entry and exit animation has keyframes and the same timing in both renderers", () => {
  for (const intro of motionStyles.CAPTION_INTROS) {
    assert.ok(motionStyles.CAPTION_ANIMATIONS_CSS.includes(`@keyframes ae-caption-in-${intro} `), intro);
  }
  for (const outro of motionStyles.CAPTION_OUTROS) {
    assert.ok(motionStyles.CAPTION_ANIMATIONS_CSS.includes(`@keyframes ae-caption-out-${outro} `), outro);
  }
  for (const name of ["wave", "type", "pop"]) {
    assert.ok(motionStyles.CAPTION_ANIMATIONS_CSS.includes(`@keyframes ae-letter-${name} `), name);
  }
  for (const intro of motionStyles.CAPTION_INTROS) {
    for (const outro of motionStyles.CAPTION_OUTROS) {
      assert.equal(motionStyles.captionAnimationShorthand(intro, outro, 6000), liveStyles.motion(intro, outro, 6000));
    }
  }
});
