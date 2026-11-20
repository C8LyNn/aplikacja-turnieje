import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ObsScoreOverlayLink, obsScoreOverlayUrl } from "./obs-score-overlay-link";
import { SharingPanel } from "./sharing-panel";
import { parseOverlayParams } from "@/lib/broadcast-overlay";

afterEach(() => cleanup());

// QW-07 · Classic reaches the existing score overlay with one ready address.

test("QW-07: the Classic address is the existing overlay page in 'current match' mode, with nothing secret in it", () => {
  const url = obsScoreOverlayUrl("https://turnieje.example", "/", 42);
  assert.equal(url, "https://turnieje.example/overlay.html?t=42&mecz=auto");
  const config = parseOverlayParams(new URL(url).search);
  assert.equal(config.kind, "wynik");
  assert.equal(config.match, "auto");
  assert.equal(config.background, "przezroczyste");
  assert.equal(obsScoreOverlayUrl("https://x.test", "/app", 3), "https://x.test/app/overlay.html?t=3&mecz=auto");
  assert.doesNotMatch(url, /token|haslo|password|login/i);
});

test("QW-07: the row shows the address, copy, preview and the OBS step; a non-public tournament is said plainly", () => {
  render(<ObsScoreOverlayLink tournamentId={42} visibility="public_online" />);
  const shown = screen.getByTestId("obs-score-overlay-url").textContent ?? "";
  assert.match(shown, /\/overlay\.html\?t=42&mecz=auto$/);
  assert.ok(screen.getByRole("button", { name: "Kopiuj adres nakładki wyniku" }));
  const preview = screen.getByRole("link", { name: /Podgląd/ });
  assert.equal(preview.getAttribute("href"), shown);
  assert.equal(preview.getAttribute("target"), "_blank");
  assert.match(preview.getAttribute("rel") ?? "", /noopener/);
  assert.ok(screen.getByText(/Źródła → \+ → Przeglądarka/));
  assert.ok(screen.getByText(/szerokość 1920, wysokość 1080/));
  assert.equal(screen.queryByText(/tylko dla turniejów publicznych/), null);
  cleanup();
  for (const visibility of ["private_online", "private_offline"]) {
    render(<ObsScoreOverlayLink tournamentId={42} visibility={visibility} />);
    assert.ok(screen.getByText(/Nakładka działa tylko dla turniejów publicznych/), visibility);
    cleanup();
  }
});

function renderSharing(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <Router hook={memoryLocation({ path }).hook}>
        <SharingPanel tournament={{ id: 42, name: "Puchar", visibility: "public_online" }} orgToken="org-token-not-for-links" />
      </Router>
    </QueryClientProvider>,
  );
}

test("QW-07: Classic sharing lists the score overlay next to the unchanged projector link; Modern keeps its own Transmisja", () => {
  renderSharing("/tournaments/42?tab=sharing");
  const row = screen.getByTestId("obs-score-overlay");
  assert.match(row.textContent ?? "", /Nakładka wyniku OBS \(Browser Source\)/);
  assert.doesNotMatch(screen.getByTestId("obs-score-overlay-url").textContent ?? "", /org-token/);
  assert.ok(screen.getByText("Projektor OBS (Browser Source)"), "the projector link is still there");
  assert.ok(screen.getByRole("button", { name: "Kopiuj link projektora OBS" }));
  cleanup();
  renderSharing("/experimental/tournaments/42?tab=sharing");
  assert.equal(screen.queryByTestId("obs-score-overlay"), null, "Modern is not given a second entry point");
  assert.ok(screen.getByText("Projektor OBS (Browser Source)"));
});
