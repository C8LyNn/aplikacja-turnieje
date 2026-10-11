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
runInNewContext(runtime.ALERT_WIDGET_RUNTIME + "\nthis.render = aeCaptionText;", live);

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
