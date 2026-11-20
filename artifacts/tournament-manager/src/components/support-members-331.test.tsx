// #331 · granular support permissions in the UI: capabilities follow the session's permissions, the owner manages
// support people with personal codes, a support person sees what they may do, and may publish only with the permission.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deriveOrganizerCapabilities, describeSupportPermissions } from "@/lib/organizer-capabilities";
import { SupportMembersPanel } from "./support-members-panel";
import { SupportPermissionsNote } from "./support-permissions-note";
import { TournamentVisibilityControl } from "./tournament-visibility-control";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

const protectedTournament = { hasHostCode: false, hasOrganizerPassword: true };
const supportCaps = (supportPermissions: string[] | null | undefined) => deriveOrganizerCapabilities({
  role: "support", tournament: protectedTournament, hasOrganizerToken: false, hasSupportSession: true, supportPermissions,
});

test("#331: a results-only support person can run matches and enter results — nothing else", () => {
  const caps = supportCaps(["matches.run", "results.write"]);
  assert.equal(caps.canUseLegacyMatchTools, true);
  assert.equal(caps.canWriteTournamentResults, true);
  assert.equal(caps.canAccessConducting, true);
  for (const key of ["canCorrectResults", "canRevertResults", "canUndo", "canManageParticipants", "canGenerateRound",
    "canStartTournament", "canFeatureMatch", "canEditPresentation", "canPublishVisibility", "canManageLifecycle",
    "canManageOrganizerSettings", "canManageSharing", "canManageBackup"] as const) {
    assert.equal(caps[key], false, key);
  }
});

test("#331: each permission opens exactly its own actions; owner-only areas never open for support", () => {
  const full = supportCaps(["matches.run", "results.write", "results.correct", "participants.manage", "stages.rounds",
    "presentation.featured", "presentation.settings", "visibility.publish"]);
  assert.deepEqual(
    [full.canCorrectResults, full.canRevertResults, full.canUndo, full.canManageParticipants, full.canGenerateRound,
      full.canFeatureMatch, full.canEditPresentation, full.canPublishVisibility],
    [true, true, true, true, true, true, true, true],
  );
  assert.deepEqual([full.canManageLifecycle, full.canManageOrganizerSettings, full.canManageSharing, full.canManageBackup],
    [false, false, false, false], "full support is still not the owner");
  const stream = supportCaps(["presentation.featured", "presentation.settings"]);
  assert.deepEqual([stream.canFeatureMatch, stream.canEditPresentation, stream.canWriteTournamentResults, stream.canUseLegacyMatchTools],
    [true, true, false, false]);
  const view = supportCaps([]);
  assert.equal(view.canViewOrganizerNavigation, true, "view-only support still sees the panel");
  assert.equal(view.canWriteTournamentResults || view.canUseLegacyMatchTools || view.canFeatureMatch, false);
});

test("#331: the shared support password keeps its former rights; the organizer is unchanged", () => {
  const legacy = supportCaps(undefined);
  assert.deepEqual(
    [legacy.canUseLegacyMatchTools, legacy.canWriteTournamentResults, legacy.canCorrectResults, legacy.canManageParticipants,
      legacy.canGenerateRound, legacy.canFeatureMatch, legacy.canEditPresentation, legacy.canPublishVisibility],
    [true, true, true, true, true, true, false, false],
  );
  const organizer = deriveOrganizerCapabilities({ role: "organizer", tournament: protectedTournament, hasOrganizerToken: true, hasSupportSession: false });
  assert.equal(Object.values(organizer).every(Boolean), true, "the organizer can do everything");
  assert.deepEqual(describeSupportPermissions(["results.write", "matches.run"]), ["prowadzenie meczów", "wpisywanie wyników"]);
});

test("#331: a support person is told what they may do", () => {
  render(<SupportPermissionsNote nick="Ola" permissions={["results.write"]} />);
  assert.match(screen.getByTestId("support-permissions-note").textContent ?? "", /Jesteś wsparciem jako Ola\. Możesz: wpisywanie wyników\. Pozostałe działania wykonuje organizator\./);
  cleanup();
  render(<SupportPermissionsNote nick="Kuba" permissions={[]} />);
  assert.match(screen.getByTestId("support-permissions-note").textContent ?? "", /tylko podgląd/);
});

test("#331: support with visibility.publish publishes with its own session token", async () => {
  const calls: Array<{ org: string | null; support: string | null; body: unknown }> = [];
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ org: headers.get("X-Organizer-Token"), support: headers.get("X-Support-Token"), body: JSON.parse(String(init?.body)) });
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const user = userEvent.setup();
  render(<QueryClientProvider client={new QueryClient()}>
    <TournamentVisibilityControl tournamentId={7} status="draft" visibility="private_offline" supportToken="sup-7" />
  </QueryClientProvider>);
  await user.click(screen.getByRole("button", { name: /Opublikuj turniej/ }));
  await waitFor(() => assert.equal(calls.length, 1));
  assert.deepEqual(calls[0], { org: null, support: "sup-7", body: { visibility: "public_online" } });
  cleanup();
  render(<QueryClientProvider client={new QueryClient()}>
    <TournamentVisibilityControl tournamentId={7} status="draft" visibility="private_offline" />
  </QueryClientProvider>);
  assert.equal(screen.queryByRole("button", { name: /Opublikuj turniej/ }), null, "without the permission the state is read-only");
});

function membersApi() {
  const state = {
    members: [] as Array<Record<string, unknown>>,
    calls: [] as Array<{ method: string; url: string; body?: any; token: string | null }>,
  };
  const presets = [
    { key: "view", label: "Tylko podgląd", permissions: [] },
    { key: "results", label: "Obsługa wyników", permissions: ["matches.run", "results.write"] },
    { key: "stream", label: "Realizacja streamu", permissions: ["presentation.featured", "presentation.settings"] },
  ];
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    state.calls.push({ method, url, body, token: new Headers(init?.headers).get("X-Organizer-Token") });
    if (method === "GET") return json({ members: state.members, catalog: [], presets });
    if (method === "POST" && url.endsWith("/support-members")) {
      const member = { id: state.members.length + 1, name: body.name, permissions: body.permissions, permissionsVersion: 1,
        revokedAt: null, createdAt: "2026-11-20T10:00:00Z", updatedAt: "2026-11-20T10:00:00Z", activeSessions: 0 };
      state.members.push(member);
      return json({ member, accessCode: "ABCD-EFGH-JKLM" }, 201);
    }
    const id = Number(url.match(/support-members\/(\d+)/)?.[1]);
    const member = state.members.find((row) => row.id === id)!;
    if (method === "PATCH") { Object.assign(member, body); return json({ member }); }
    if (url.endsWith("/revoke")) { member.revokedAt = "2026-11-20T11:00:00Z"; return json({ member }); }
    return json({ error: "?" }, 500);
  }) as typeof fetch;
  return state;
}

test("#331: the owner adds a person with a preset, sees the code exactly once, then edits and revokes", async () => {
  const api = membersApi();
  const user = userEvent.setup();
  render(<SupportMembersPanel tournamentId={7} orgToken="org-7" />);
  assert.ok(await screen.findByText(/Nie dodano jeszcze żadnej osoby/));
  await user.click(screen.getByRole("button", { name: /Dodaj osobę/ }));
  await user.type(screen.getByLabelText("Imię lub nick"), "Ola");
  await user.click(screen.getByRole("button", { name: "Realizacja streamu" }));
  assert.equal(screen.getByRole("button", { name: "Realizacja streamu" }).getAttribute("aria-pressed"), "true");
  assert.equal((screen.getByLabelText("Mecz na ekranie widzów") as HTMLInputElement).checked, true);
  assert.equal((screen.getByLabelText("Wpisywanie wyników") as HTMLInputElement).checked, false);
  await user.click(screen.getByLabelText("Wpisywanie wyników"));
  await user.click(screen.getByRole("button", { name: "Dodaj i pokaż kod" }));
  const code = await screen.findByTestId("support-member-code");
  assert.match(code.textContent ?? "", /ABCD-EFGH-JKLM/);
  assert.match(code.textContent ?? "", /tylko teraz/);
  const created = api.calls.find((call) => call.method === "POST")!;
  assert.equal(created.token, "org-7");
  assert.deepEqual(created.body, { name: "Ola", permissions: ["presentation.featured", "presentation.settings", "results.write"] });
  await user.click(within(code).getByRole("button", { name: "Gotowe" }));
  assert.equal(screen.queryByText(/ABCD-EFGH-JKLM/), null, "the code is not shown again");

  const row = await screen.findByTestId("support-member");
  assert.match(row.textContent ?? "", /Ola/);
  assert.match(row.textContent ?? "", /wpisywanie wyników · mecz na ekranie · wygląd transmisji/);
  await user.click(within(row).getByRole("button", { name: /Uprawnienia/ }));
  await user.click(screen.getByLabelText("Wygląd transmisji i scoreboardu"));
  await user.click(screen.getByRole("button", { name: "Zapisz uprawnienia" }));
  await waitFor(() => assert.ok(api.calls.some((call) => call.method === "PATCH")));
  assert.deepEqual(api.calls.find((call) => call.method === "PATCH")!.body.permissions, ["presentation.featured", "results.write"]);
  assert.ok(await screen.findByText(/Zapisano uprawnienia: Ola/));

  await user.click(within(await screen.findByTestId("support-member")).getByRole("button", { name: /Odbierz dostęp/ }));
  assert.ok(screen.getByRole("alertdialog", { name: "Odebrać dostęp: Ola?" }));
  assert.equal(api.calls.some((call) => call.url.endsWith("/revoke")), false, "nothing happens before the confirmation");
  await user.click(screen.getAllByRole("button", { name: "Odbierz dostęp" }).at(-1)!);
  await waitFor(() => assert.ok(api.calls.some((call) => call.url.endsWith("/revoke"))));
  assert.ok(await screen.findByText(/Dostęp odebrany: Ola/));
  assert.equal(screen.queryByTestId("support-member"), null);
});
