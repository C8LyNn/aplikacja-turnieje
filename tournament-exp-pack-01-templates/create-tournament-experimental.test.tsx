import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import CreateTournamentExperimental from "./create-tournament-experimental";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function renderExperimental(role: "organizer" | "fan" | "support" | null) {
  if (role) window.localStorage.setItem("tm_role", role);
  const location = memoryLocation({
    path: "/experimental/tournaments/new",
    record: true,
  });

  render(
    <Router hook={location.hook}>
      <AuthProvider>
        <CreateTournamentExperimental />
      </AuthProvider>
    </Router>,
  );

  return location;
}

test("organizer sees the isolated non-destructive Experimental creation shell", async () => {
  renderExperimental("organizer");

  await screen.findByRole("heading", { name: "Nowy turniej" });

  assert.ok(screen.getByLabelText("Nazwa turnieju"));
  assert.ok(screen.getByLabelText("Opis"));
  assert.ok(screen.getAllByText("experimental").length >= 1);
  assert.ok(screen.getByRole("button", { name: /Utwórz — w przygotowaniu/i }).hasAttribute("disabled"));
  assert.match(document.body.textContent ?? "", /nie wysyła jeszcze tego formularza do API/i);
});

for (const [role, destination] of [
  ["fan", "/fan"],
  ["support", "/support"],
  [null, "/"],
] as const) {
  test(`${role ?? "anonymous"} cannot open Experimental creation directly`, async () => {
    const location = renderExperimental(role);
    assert.equal(screen.queryByRole("heading", { name: "Nowy turniej" }), null);

    await waitFor(() => {
      assert.ok(
        location.history.includes(destination),
        `expected ${destination} in history, got ${JSON.stringify(location.history)}`,
      );
    });
  });
}
