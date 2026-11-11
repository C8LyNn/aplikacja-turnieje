import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import { Layout } from "./layout";

afterEach(() => cleanup());

function renderAt(path: string) {
  const location = memoryLocation({ path });
  render(
    <TestAuthProvider>
      <Router hook={location.hook} searchHook={location.searchHook}>
        <Layout><p>Treść testowa</p></Layout>
      </Router>
    </TestAuthProvider>,
  );
}

test("L17 standard tournament pages provide an accessible skip link to a focusable main", () => {
  renderAt("/tournaments");
  const skip = screen.getByRole("link", { name: "Przejdź do głównej treści" });
  assert.equal(skip.getAttribute("href"), "#main-content");
  assert.match(skip.className, /sr-only/);
  assert.match(skip.className, /focus:not-sr-only/);
  const main = screen.getByRole("main");
  assert.equal(main.getAttribute("id"), "main-content");
  assert.equal(main.tabIndex, -1);
  main.focus();
  assert.equal(document.activeElement, main);
});

test("L17 experimental route preserves its original skip-link target and styling", () => {
  renderAt("/experimental/tournaments");
  const skip = screen.getByRole("link", { name: "Przejdź do głównej treści" });
  assert.equal(skip.getAttribute("href"), "#experimental-main");
  assert.match(skip.className, /experimental-skip-link/);
  const main = screen.getByRole("main");
  assert.equal(main.getAttribute("id"), "experimental-main");
  assert.equal(main.tabIndex, -1);
});
