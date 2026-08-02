import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useEffect, useRef } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router, useSearch } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import {
  organizerAreaForDetailTab,
  organizerDetailTab,
  TournamentOrganizerNavigation,
  useLegacyMatchesRedirect,
} from "./tournament-organizer-navigation";
import { deriveOrganizerCapabilities, NO_ORGANIZER_CAPABILITIES } from "@/lib/organizer-capabilities";

const organizerCapabilities = deriveOrganizerCapabilities({
  role: "organizer",
  tournament: { hasHostCode: false, hasOrganizerPassword: false },
  hasOrganizerToken: true,
  hasSupportSession: false,
});
const supportCapabilities = deriveOrganizerCapabilities({
  role: "support",
  tournament: { hasHostCode: false, hasOrganizerPassword: true },
  hasOrganizerToken: false,
  hasSupportSession: true,
});

afterEach(() => cleanup());

function DetailHarness({ onMount }: { onMount?: () => void }) {
  const search = useSearch();
  const tab = organizerDetailTab(search, organizerCapabilities);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      onMount?.();
    }
  }, [onMount]);
  return (
    <>
      <TournamentOrganizerNavigation
        tournamentId={41}
        active={organizerAreaForDetailTab(tab)}
        capabilities={organizerCapabilities}
      />
      <div data-testid="active-content">{tab}</div>
    </>
  );
}

test("query stages -> players changes rendered content without remount", async () => {
  const location = memoryLocation({ path: "/tournaments/41?tab=stages", record: true });
  let mounts = 0;
  render(<Router hook={location.hook}><DetailHarness onMount={() => { mounts += 1; }} /></Router>);
  assert.equal(screen.getByTestId("active-content").textContent, "stages");
  await userEvent.click(screen.getByRole("link", { name: "Gracze" }));
  assert.equal(screen.getByTestId("active-content").textContent, "players");
  assert.equal(mounts, 1);
});

test("browser Back and Forward update a query-driven tab", async () => {
  window.history.replaceState(null, "", "/tournaments/41?tab=stages");
  render(<Router><DetailHarness /></Router>);
  await userEvent.click(screen.getByRole("link", { name: "Gracze" }));
  assert.equal(screen.getByTestId("active-content").textContent, "players");
  window.history.back();
  await waitFor(() => assert.equal(screen.getByTestId("active-content").textContent, "stages"));
  window.history.forward();
  await waitFor(() => assert.equal(screen.getByTestId("active-content").textContent, "players"));
});

test("Detail -> Prowadzenie and Host -> Etapy keep canonical query URLs", async () => {
  const location = memoryLocation({ path: "/tournaments/41?tab=stages", record: true });
  render(<Router hook={location.hook}><DetailHarness /></Router>);
  await userEvent.click(screen.getByRole("link", { name: "Prowadzenie" }));
  assert.equal(location.history.at(-1), "/tournaments/41/host?tab=prowadzenie");
  await userEvent.click(screen.getByRole("link", { name: "Etapy" }));
  assert.equal(location.history.at(-1), "/tournaments/41?tab=stages");
});

function LegacyMatchesHarness({ capabilities = organizerCapabilities }) {
  const search = useSearch();
  useLegacyMatchesRedirect(41, search, capabilities);
  return <div>{organizerDetailTab(search, capabilities)}</div>;
}

test("legacy ?tab=matches normalizes to conducting for an organizer without a loop", async () => {
  const location = memoryLocation({ path: "/tournaments/41?tab=matches", record: true });
  render(<Router hook={location.hook}><LegacyMatchesHarness /></Router>);
  await waitFor(() => assert.equal(location.history.at(-1), "/tournaments/41/host?tab=prowadzenie"));
  assert.equal(location.history.length, 1);
});

test("legacy ?tab=matches stays read-only for a viewer", () => {
  const location = memoryLocation({ path: "/tournaments/41?tab=matches", record: true });
  render(<Router hook={location.hook}><LegacyMatchesHarness capabilities={NO_ORGANIZER_CAPABILITIES} /></Router>);
  assert.equal(screen.getByText("matches").textContent, "matches");
  assert.equal(location.history.at(-1), "/tournaments/41?tab=matches");
});

test("direct support security query falls back before organizer content renders", () => {
  assert.equal(organizerDetailTab("?tab=security", supportCapabilities), "stages");
  assert.equal(organizerDetailTab("?tab=backup", supportCapabilities), "stages");
});

test("active More is current and no hidden menu item duplicates aria-current", () => {
  render(
    <Router hook={memoryLocation({ path: "/tournaments/41?tab=backup" }).hook}>
      <TournamentOrganizerNavigation tournamentId={41} active="backup" capabilities={organizerCapabilities} />
    </Router>,
  );
  const current = screen.getAllByRole("button").filter((element) => element.getAttribute("aria-current") === "page");
  assert.equal(current.length, 1);
  assert.equal(current[0].textContent?.includes("Więcej"), true);
  assert.equal(document.querySelectorAll('[aria-current="page"]').length, 1);
});
