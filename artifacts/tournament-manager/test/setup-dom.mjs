import { JSDOM } from "jsdom";
import { after } from "node:test";
import { register } from "node:module";
import { inspect } from "node:util";
import assert from "node:assert";

// Vite resolves CSS imports at build time; component tests only need them to be no-ops.
register("./css-import-stub.mjs", import.meta.url);

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/tournaments/new",
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  localStorage: { value: dom.window.localStorage, configurable: true },
  sessionStorage: { value: dom.window.sessionStorage, configurable: true },
  location: { value: dom.window.location, configurable: true },
  history: { value: dom.window.history, configurable: true },
  addEventListener: { value: dom.window.addEventListener.bind(dom.window), configurable: true },
  removeEventListener: { value: dom.window.removeEventListener.bind(dom.window), configurable: true },
  dispatchEvent: { value: dom.window.dispatchEvent.bind(dom.window), configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  NodeFilter: { value: dom.window.NodeFilter, configurable: true },
  DocumentFragment: { value: dom.window.DocumentFragment, configurable: true },
  Element: { value: dom.window.Element, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  SVGElement: { value: dom.window.SVGElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  HTMLButtonElement: { value: dom.window.HTMLButtonElement, configurable: true },
  Event: { value: dom.window.Event, configurable: true },
  CustomEvent: { value: dom.window.CustomEvent, configurable: true },
  MouseEvent: { value: dom.window.MouseEvent, configurable: true },
  PointerEvent: { value: dom.window.PointerEvent ?? dom.window.MouseEvent, configurable: true },
  FocusEvent: { value: dom.window.FocusEvent, configurable: true },
  KeyboardEvent: { value: dom.window.KeyboardEvent, configurable: true },
  File: { value: dom.window.File, configurable: true },
  FileList: { value: dom.window.FileList, configurable: true },
  FileReader: { value: dom.window.FileReader, configurable: true },
  MutationObserver: { value: dom.window.MutationObserver, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true },
});

// node:assert builds failure diffs from a value's enumerable fields (it ignores util.inspect.custom). On a rendered
// jsdom node those include React's __reactFiber$ link, so the diff walks the whole fiber tree, QueryClient and window
// (measured: one failing assert.equal(element, null) = 86 s, +347 MB heap). waitFor() retries fail routinely before
// React commits, so this made tests slow and ran the full suite out of memory. Comparisons keep their exact
// semantics; only the failure message for DOM nodes becomes a short description.
const describeNode = (node) => {
  if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
    const shown = text.length > 80 ? `${text.slice(0, 77)}...` : text;
    return `<${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}>${shown ? ` "${shown}"` : ""}`;
  }
  if (node.nodeType === dom.window.Node.TEXT_NODE) return `#text "${(node.textContent ?? "").slice(0, 80)}"`;
  if (node.nodeType === dom.window.Node.DOCUMENT_NODE) return "#document";
  return `[${node.nodeName}]`;
};
Object.defineProperty(dom.window.Node.prototype, inspect.custom, {
  value() { return describeNode(this); },
  configurable: true,
});
const isDomNode = (value) => value instanceof dom.window.Node;
const describeValue = (value) => (isDomNode(value) ? describeNode(value) : inspect(value, { depth: 1 }));
const comparisons = {
  equal: { holds: (a, b) => a == b, operator: "==" },
  notEqual: { holds: (a, b) => a != b, operator: "!=" },
  strictEqual: { holds: (a, b) => Object.is(a, b), operator: "strictEqual" },
  notStrictEqual: { holds: (a, b) => !Object.is(a, b), operator: "notStrictEqual" },
};
const guardDomComparisons = (target, strict) => {
  for (const name of Object.keys(comparisons)) {
    const original = target[name];
    const strictName = strict && name === "equal" ? "strictEqual" : strict && name === "notEqual" ? "notStrictEqual" : name;
    const check = comparisons[strictName].holds;
    const guarded = function guardedComparison(actual, expected, message) {
      if (!isDomNode(actual) && !isDomNode(expected)) return original.apply(this, arguments);
      if (check(actual, expected)) return undefined;
      if (message instanceof Error) throw message;
      throw new assert.AssertionError({
        message: message ?? `Expected ${describeValue(actual)} ${comparisons[strictName].operator} ${describeValue(expected)}`,
        actual: describeValue(actual),
        expected: describeValue(expected),
        operator: strictName,
        stackStartFn: guarded,
      });
    };
    target[name] = guarded;
  }
};
guardDomComparisons(assert, false);
guardDomComparisons(assert.strict, true);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame ??= (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame ??= (handle) => clearTimeout(handle);
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.HTMLElement.prototype.scrollIntoView ??= function scrollIntoView() {};
globalThis.HTMLElement.prototype.hasPointerCapture ??= function hasPointerCapture() {
  return false;
};
globalThis.HTMLElement.prototype.setPointerCapture ??= function setPointerCapture() {};
globalThis.HTMLElement.prototype.releasePointerCapture ??= function releasePointerCapture() {};

after(() => {
  dom.window.close();
});
