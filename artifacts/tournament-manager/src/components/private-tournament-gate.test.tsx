// QW-05 · private tournaments: a refusal is final until the viewer acts — no retries, no polling, a clear message.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import { accessDeniedCode, pollUnlessDenied, PrivateTournamentGate, shouldRetryRead } from "./private-tournament-gate";

afterEach(() => cleanup());

const err = (status: number, code?: string) => ({ status, data: code ? { code } : null });

test("QW-05: only 401/403 are access refusals", () => {
  assert.equal(accessDeniedCode(err(403, "VIEWER_PASSWORD_REQUIRED")), "VIEWER_PASSWORD_REQUIRED");
  assert.equal(accessDeniedCode(err(403, "PRIVATE_OFFLINE")), "PRIVATE_OFFLINE");
  assert.equal(accessDeniedCode(err(401)), "ACCESS_DENIED");
  assert.equal(accessDeniedCode(err(404)), undefined);
  assert.equal(accessDeniedCode(err(500)), undefined);
  assert.equal(accessDeniedCode(null), undefined);
});

test("QW-05: reads are not retried on a final 4xx; timeouts, rate limits and server errors are", () => {
  for (const status of [400, 401, 403, 404, 409, 422]) assert.equal(shouldRetryRead(0, err(status)), false, `${status}`);
  for (const status of [408, 429, 500, 503]) assert.equal(shouldRetryRead(0, err(status)), true, `${status}`);
  assert.equal(shouldRetryRead(0, new Error("network")), true);
  assert.equal(shouldRetryRead(3, err(500)), false, "at most three retries");
});

test("QW-05: polling stops while access is refused", () => {
  const poll = pollUnlessDenied(10000);
  assert.equal(poll({ state: { error: err(403, "VIEWER_PASSWORD_REQUIRED") } }), false);
  assert.equal(poll({ state: { error: null } }), 10000);
  assert.equal(poll({ state: { error: err(500) } }), 10000, "a server error may recover by itself");
});

function renderGate(props: React.ComponentProps<typeof PrivateTournamentGate>) {
  const location = memoryLocation({ path: "/tournaments/7/bracket" });
  render(<TestAuthProvider><Router hook={location.hook}><PrivateTournamentGate {...props} /></Router></TestAuthProvider>);
}

test("QW-05: the gate offers the viewer password only where the tournament and the page accept it", () => {
  renderGate({ tournamentId: 7, code: "VIEWER_PASSWORD_REQUIRED" });
  assert.ok(screen.getByRole("heading", { name: "Turniej prywatny" }));
  assert.ok(screen.getByRole("button", { name: "Podaj hasło widza" }));
  cleanup();
  renderGate({ tournamentId: 7, code: "VIEWER_PASSWORD_REQUIRED", allowViewerLogin: false });
  assert.equal(screen.queryByRole("button", { name: "Podaj hasło widza" }), null, "the projector never logs in");
  assert.ok(screen.getByText(/tylko turnieje publiczne/));
  cleanup();
  renderGate({ tournamentId: 7, code: "PRIVATE_OFFLINE" });
  assert.equal(screen.queryByRole("button", { name: "Podaj hasło widza" }), null);
  assert.ok(screen.getByText(/nie jest dostępny dla widzów/));
});
