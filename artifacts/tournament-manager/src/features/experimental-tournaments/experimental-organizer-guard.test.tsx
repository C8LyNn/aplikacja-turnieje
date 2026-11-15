import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../../test/auth-provider";
import { ExperimentalOrganizerGuard } from "./experimental-organizer-guard";

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

for (const [role, destination] of [
  ["fan", "/experimental/tournaments/fan"],
  ["support", "/experimental/tournaments/support"],
  [null, "/experimental/tournaments"],
] as const) {
  test(`${role ?? "no role"}: guard hides organizer content and stays inside Experimental`, async () => {
    if (role) localStorage.setItem("tm_role", role);
    const location = memoryLocation({ path: "/experimental/tournaments/new", record: true });
    render(<TestAuthProvider><Router hook={location.hook}><ExperimentalOrganizerGuard><p>organizer only</p></ExperimentalOrganizerGuard></Router></TestAuthProvider>);
    assert.equal(screen.queryByText("organizer only"), null);
    await waitFor(() => assert.equal(location.history.at(-1), destination));
    assert.equal(location.history.some((path) => !path.startsWith("/experimental/")), false);
  });
}

test("organizer sees the guarded content", () => {
  localStorage.setItem("tm_role", "organizer");
  const location = memoryLocation({ path: "/experimental/tournaments/new" });
  render(<TestAuthProvider><Router hook={location.hook}><ExperimentalOrganizerGuard><p>organizer only</p></ExperimentalOrganizerGuard></Router></TestAuthProvider>);
  assert.ok(screen.getByText("organizer only"));
});

test("outside Experimental (shared version chooser) the previous destinations are kept", async () => {
  localStorage.setItem("tm_role", "fan");
  const location = memoryLocation({ path: "/tournaments/create", record: true });
  render(<TestAuthProvider><Router hook={location.hook}><ExperimentalOrganizerGuard><p>organizer only</p></ExperimentalOrganizerGuard></Router></TestAuthProvider>);
  await waitFor(() => assert.equal(location.history.at(-1), "/fan"));
});
