import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import TournamentCreateChoice from "./tournament-create-choice";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function renderChoice(role: "organizer" | "fan" | "support" | null) {
  if (role) window.localStorage.setItem("tm_role", role);
  const location = memoryLocation({ path: "/tournaments/create", record: true });

  render(
    <Router hook={location.hook}>
      <AuthProvider>
        <TournamentCreateChoice />
      </AuthProvider>
    </Router>,
  );

  return location;
}

test("organizer sees Stable and Experimental creation choices", async () => {
  renderChoice("organizer");

  await screen.findByRole("heading", { name: "Utwórz turniej" });

  const stable = screen.getByRole("link", { name: /Stabilna wersja/i });
  const experimental = screen.getByRole("link", { name: /Experimental/i });

  assert.equal(stable.getAttribute("href"), "/tournaments/new");
  assert.equal(experimental.getAttribute("href"), "/experimental/tournaments/new");
});

for (const [role, destination] of [
  ["fan", "/fan"],
  ["support", "/support"],
  [null, "/"],
] as const) {
  test(`${role ?? "anonymous"} cannot open the version-choice page`, async () => {
    const location = renderChoice(role);
    assert.equal(screen.queryByRole("heading", { name: "Utwórz turniej" }), null);

    await waitFor(() => {
      assert.ok(
        location.history.includes(destination),
        `expected ${destination} in history, got ${JSON.stringify(location.history)}`,
      );
    });
  });
}
