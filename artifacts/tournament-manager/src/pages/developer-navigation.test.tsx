import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";

// Node's test runner does not transform Vite's ?raw imports or CSS dependencies
// used by the other Developer Lab views. Keep those imports available without
// changing the production components being tested.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith("?raw") || specifier.endsWith(".css")) {
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith("?raw")) {
      return {
        format: "module",
        source: `export default ${JSON.stringify(readFileSync(new URL(url), "utf8"))};`,
        shortCircuit: true,
      };
    }
    if (url.endsWith(".css")) {
      return { format: "module", source: "", shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { default: DeveloperPage } = await import("./developer");

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", window.location.pathname);
});

test("Developer Hub keeps OBS Lab without a duplicate Animated Effects card", () => {
  render(<Router><DeveloperPage /></Router>);
  assert.ok(screen.getByText("DEV / NARZĘDZIA"));
  assert.equal(
    screen.getByRole("link", { name: /OBS \/ Stream Add-ons/i }).getAttribute("href"),
    "#obs-lab",
  );
  assert.equal(screen.queryByRole("link", { name: /Animated Effects/i }), null);
});

test("OBS Lab opens Animated Effects at its stable path", () => {
  window.location.hash = "#obs-lab";
  render(<Router><DeveloperPage /></Router>);
  const link = screen.getByRole("link", { name: /Animated Effects/i });
  assert.equal(link.getAttribute("href"), "/dev/animated-effects/");
  assert.ok(screen.getByText("Otwórz edytor →"));
});