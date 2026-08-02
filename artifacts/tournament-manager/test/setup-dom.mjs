import { JSDOM } from "jsdom";
import { after } from "node:test";

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
  DocumentFragment: { value: dom.window.DocumentFragment, configurable: true },
  Element: { value: dom.window.Element, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  SVGElement: { value: dom.window.SVGElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  HTMLButtonElement: { value: dom.window.HTMLButtonElement, configurable: true },
  Event: { value: dom.window.Event, configurable: true },
  MouseEvent: { value: dom.window.MouseEvent, configurable: true },
  KeyboardEvent: { value: dom.window.KeyboardEvent, configurable: true },
  MutationObserver: { value: dom.window.MutationObserver, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true },
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame ??= (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame ??= (handle) => clearTimeout(handle);
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.HTMLElement.prototype.scrollIntoView ??= function scrollIntoView() {};

after(() => {
  dom.window.close();
});
