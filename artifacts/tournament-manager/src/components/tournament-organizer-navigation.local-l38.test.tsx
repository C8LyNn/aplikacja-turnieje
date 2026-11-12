import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";
import { TournamentOrganizerNavigation } from "./tournament-organizer-navigation";

const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeEach(() => { Element.prototype.scrollIntoView = () => {}; });
afterEach(() => { cleanup(); Element.prototype.scrollIntoView = originalScrollIntoView; });
const caps = {
  canManageOrganizerSettings: true,
  canManageSharing: true,
  canManageBackup: true,
  canUndo: true,
} as OrganizerCapabilities;
function mount(active: "stages" | "security") {
  const location = memoryLocation({ path: "/tournaments/71", record: true });
  render(<Router hook={location.hook}><TournamentOrganizerNavigation tournamentId={71} active={active} capabilities={caps} /></Router>);
}

test("L38: collapsed More describes active Security and is current; open menu marks the actual link", async () => {
  mount("security");
  const more = screen.getByRole("button", { name: /aktywny obszar: Bezpieczeństwo/ });
  // Established contract (tournament-organizer-navigation.test.tsx): collapsed More is the single current item.
  assert.equal(more.getAttribute("aria-current"), "page");
  assert.equal(document.querySelectorAll('[aria-current="page"]').length, 1);
  await userEvent.click(more);
  const selected = await screen.findByRole("menuitem", { name: "Bezpieczeństwo" });
  assert.equal(selected.getAttribute("aria-current"), "page");
});

test("L38: active main section retains aria-current and generic More name", () => {
  mount("stages");
  assert.equal(screen.getByRole("link", { name: "Etapy" }).getAttribute("aria-current"), "page");
  assert.ok(screen.getByRole("button", { name: "Więcej obszarów turnieju" }));
});
