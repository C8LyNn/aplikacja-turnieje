// QW-01 · Stable header on a phone: the back link shows only its arrow (the label stays its accessible name) and
// navigation items keep their width inside the scrolling nav instead of squashing to 44 px and overlapping.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import { Layout } from "./layout";
import { RoleHomeLink } from "./app-navigation";

afterEach(() => { cleanup(); window.localStorage.clear(); });

function renderAt(path: string, role: string) {
  window.localStorage.setItem("tm_role", role);
  const location = memoryLocation({ path });
  render(
    <TestAuthProvider>
      <Router hook={location.hook} searchHook={location.searchHook}>
        <Layout><p>Treść</p></Layout>
      </Router>
    </TestAuthProvider>,
  );
}

test("QW-01: Stable header keeps the back arrow and lets the nav scroll with full-width items", () => {
  renderAt("/tournaments/7/host", "organizer");
  const back = screen.getByRole("link", { name: "Wróć do dashboardu" });
  const label = back.querySelector("span")!;
  assert.match(label.className, /\bsr-only\b/);
  assert.match(label.className, /\bsm:not-sr-only\b/);
  assert.ok(back.className.includes("min-w-0"));
  assert.ok(!back.parentElement!.className.split(/\s+/).includes("min-w-0"), "the logo + arrow group no longer shrinks under its content");
  const nav = back.closest("header")!.querySelector("nav")!;
  assert.ok(nav.className.includes("overflow-x-auto"));
  assert.ok(nav.className.includes("[&>*]:shrink-0"));
});

test("QW-01: the back link label is unchanged elsewhere (default, no extra class)", () => {
  window.localStorage.setItem("tm_role", "fan");
  const location = memoryLocation({ path: "/somewhere" });
  render(
    <TestAuthProvider>
      <Router hook={location.hook}><RoleHomeLink /></Router>
    </TestAuthProvider>,
  );
  const link = screen.getByRole("link");
  assert.equal(link.querySelector("span")!.getAttribute("class"), null);
});
