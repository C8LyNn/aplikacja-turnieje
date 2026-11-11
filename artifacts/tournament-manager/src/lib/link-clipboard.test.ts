import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
afterEach(() => {
  if (original) Object.defineProperty(globalThis, "navigator", original);
  else Reflect.deleteProperty(globalThis, "navigator");
});
function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value });
}
const moduleUrl = new URL("./link-clipboard.ts", import.meta.url).href;
const { copyLinkText } = await import(moduleUrl);

test("writes the complete link unchanged, including Polish text and query params", async () => {
  const text = "https://example.invalid/tournaments/7/projector?name=Łódź&zoom=0.8#finał";
  let received: string | undefined;
  setNavigator({ clipboard: { async writeText(value: string) { received = value; } } });
  assert.equal(await copyLinkText(text), "copied");
  assert.equal(received, text);
});
test("does not claim success while the clipboard write is unresolved", async () => {
  let finish!: () => void;
  let settled = false;
  setNavigator({ clipboard: { writeText: () => new Promise<void>(r => { finish = r; }) } });
  const result = copyLinkText("https://example.invalid").then((v: string) => { settled = true; return v; });
  await Promise.resolve();
  assert.equal(settled, false);
  finish();
  assert.equal(await result, "copied");
});
test("clipboard permission denial returns failed rather than rejecting", async () => {
  setNavigator({ clipboard: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) } });
  assert.equal(await copyLinkText("https://example.invalid"), "failed");
});
test("synchronous writer failure also returns failed", async () => {
  setNavigator({ clipboard: { writeText() { throw new Error("unavailable OS service"); } } });
  assert.equal(await copyLinkText("https://example.invalid"), "failed");
});
test("missing clipboard is unavailable, not copied", async () => {
  setNavigator({});
  assert.equal(await copyLinkText("https://example.invalid"), "unavailable");
});
test("missing writeText is unavailable", async () => {
  setNavigator({ clipboard: {} });
  assert.equal(await copyLinkText("https://example.invalid"), "unavailable");
});
test("no navigator is safe for server-side use", async () => {
  Reflect.deleteProperty(globalThis, "navigator");
  assert.equal(await copyLinkText("https://example.invalid"), "unavailable");
});
test("throwing clipboard getter cannot escape the adapter", async () => {
  setNavigator({ get clipboard() { throw new Error("browser policy"); } });
  assert.equal(await copyLinkText("https://example.invalid"), "failed");
});
test("throwing navigator getter cannot escape the adapter", async () => {
  Object.defineProperty(globalThis, "navigator", { configurable: true, get() { throw new Error("policy"); } });
  assert.equal(await copyLinkText("https://example.invalid"), "failed");
});
test("writeText is called with its original clipboard receiver", async () => {
  const clipboard = { async writeText(_text: string) { assert.equal(this, clipboard); } };
  setNavigator({ clipboard });
  assert.equal(await copyLinkText("https://example.invalid"), "copied");
});
test("a failed copy can be retried without stale result", async () => {
  let attempts = 0;
  setNavigator({ clipboard: { async writeText() { if (++attempts === 1) throw new Error("denied"); } } });
  assert.equal(await copyLinkText("https://example.invalid"), "failed");
  assert.equal(await copyLinkText("https://example.invalid"), "copied");
  assert.equal(attempts, 2);
});
test("does not inspect clipboard contents or request extra permissions", async () => {
  setNavigator({
    get permissions() { throw new Error("must not query permissions"); },
    clipboard: { get readText() { throw new Error("must not read"); }, async writeText() {} },
  });
  assert.equal(await copyLinkText("https://example.invalid"), "copied");
});
