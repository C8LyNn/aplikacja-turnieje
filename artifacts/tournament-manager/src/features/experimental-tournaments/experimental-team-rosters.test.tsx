import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExperimentalTeamRosters } from "./experimental-team-rosters";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface Member { id: number; name: string; role: "captain" | "player" | "reserve" }
function teamSummary(entryId: number, name: string, members: Member[], rosterMin = 2) {
  const starters = members.filter((member) => member.role !== "reserve").length;
  const ready = starters >= rosterMin;
  return {
    entryId, teamId: entryId + 100, name, seed: null, entryStatus: "active", shortCode: null,
    members: members.map((member) => ({ ...member, roleLabel: member.role, joinedAt: "2026-11-17T05:00:00.000Z" })),
    starters, formerMemberCount: 0, ready,
    issues: ready ? [] : [{ code: "ROSTER_TOO_SMALL", tone: "danger", message: `Skład podstawowy: ${starters}/${rosterMin} (rezerwowi się nie liczą).` }],
  };
}

function setup(initial: Record<number, Member[]>, participantType: "teams" | "players" = "teams") {
  const rosters = structuredClone(initial);
  let nextId = 1000;
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  const names: Record<number, string> = { 1: "Wilki", 2: "Sowy" };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url, body });
    const memberMatch = url.match(/teams\/(\d+)\/members(?:\/(\d+))?$/);
    if (url.endsWith("/teams") && method === "GET") {
      const teams = participantType === "teams" ? Object.entries(rosters).map(([id, members]) => teamSummary(Number(id), names[Number(id)], members)) : [];
      return json({ tournamentId: 9, participantType, rosterMin: participantType === "teams" ? 2 : null, rosterMax: null, teams, readyCount: teams.filter((team) => team.ready).length });
    }
    if (url.includes("/history")) return json({ entryId: 1, name: "Wilki", history: [{ id: 1, name: "Ala", role: "captain", roleLabel: "Kapitan", joinedAt: "2026-11-17T05:00:00.000Z", leftAt: "2026-11-17T05:10:00.000Z", leftReason: "role_change" }] });
    if (memberMatch) {
      const entryId = Number(memberMatch[1]);
      const memberId = memberMatch[2] ? Number(memberMatch[2]) : null;
      if (method === "POST") rosters[entryId].push({ id: nextId++, name: body.name, role: body.role ?? "player" });
      if (method === "PATCH") rosters[entryId] = rosters[entryId].map((member) => member.id === memberId ? { ...member, role: body.role } : member);
      if (method === "DELETE") rosters[entryId] = rosters[entryId].filter((member) => member.id !== memberId);
      return json(teamSummary(entryId, names[entryId], rosters[entryId]), method === "POST" ? 201 : 200);
    }
    return json({ error: "unexpected" }, 404);
  }) as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const view = render(<QueryClientProvider client={client}><ExperimentalTeamRosters tournamentId={9} canEdit /></QueryClientProvider>);
  return { calls, client, view };
}

afterEach(() => cleanup());

test("team rosters: readiness, add, role change and removal go through the API", async () => {
  const { calls, client, view } = setup({ 1: [{ id: 1, name: "Ala", role: "captain" }], 2: [{ id: 2, name: "Ola", role: "captain" }, { id: 3, name: "Ewa", role: "player" }] });
  await screen.findByRole("heading", { name: "Składy drużyn" });
  assert.ok(screen.getByText(/1\/2 drużyn gotowych · minimum 2 w podstawie/));
  const wolves = screen.getByRole("heading", { name: "Wilki" }).closest("li")!;
  assert.ok(within(wolves).getByText(/Skład podstawowy: 1\/2/));
  fireEvent.change(within(wolves).getByLabelText("Nowy zawodnik: Wilki"), { target: { value: "Bartek" } });
  fireEvent.click(within(wolves).getByRole("button", { name: /Dodaj/ }));
  await waitFor(() => assert.ok(screen.getByText(/2\/2 drużyn gotowych/)));
  assert.deepEqual(calls.find((call) => call.method === "POST")!.body, { name: "Bartek", role: "player" });

  const wolvesAfter = screen.getByRole("heading", { name: "Wilki" }).closest("li")!;
  fireEvent.change(within(wolvesAfter).getByLabelText("Rola: Bartek"), { target: { value: "reserve" } });
  await waitFor(() => assert.ok(calls.some((call) => call.method === "PATCH" && (call.body as { role: string }).role === "reserve")));
  await waitFor(() => assert.ok(screen.getByText(/1\/2 drużyn gotowych/)));
  fireEvent.click(within(screen.getByRole("heading", { name: "Sowy" }).closest("li")!).getByRole("button", { name: "Usuń ze składu: Ewa" }));
  await waitFor(() => assert.ok(calls.some((call) => call.method === "DELETE" && call.url.endsWith("/teams/2/members/3"))));
  fireEvent.click(within(screen.getByRole("heading", { name: "Wilki" }).closest("li")!).getByRole("button", { name: "Historia składu" }));
  await screen.findByText(/zmiana roli/);
  view.unmount();
  client.clear();
});

test("team rosters refresh when entries change elsewhere on the page", async () => {
  const { calls, client, view } = setup({ 1: [] });
  await screen.findByRole("heading", { name: "Wilki" });
  const gets = () => calls.filter((call) => call.method === "GET" && call.url.endsWith("/teams")).length;
  const before = gets();
  view.rerender(<QueryClientProvider client={client}><ExperimentalTeamRosters tournamentId={9} canEdit entriesSignature="1:Wilki|2:Sowy" /></QueryClientProvider>);
  await waitFor(() => assert.equal(gets(), before + 1));
  view.unmount();
  client.clear();
});

test("team rosters render nothing for player tournaments and hide editing without permission", async () => {
  const { view, client } = setup({}, "players");
  await waitFor(() => assert.equal(screen.queryByRole("heading", { name: "Składy drużyn" }), null));
  view.unmount();
  client.clear();
});

test("roster health is not 'ready' while team rosters block the start", async () => {
  const { rosterHealth } = await import("./experimental-v4-model");
  const entries = Array.from({ length: 4 }, (_, index) => ({ name: `T${index}`, seed: null }));
  assert.equal(rosterHealth(entries, 4, null, 0).ready, true);
  const blocked = rosterHealth(entries, 4, null, 3);
  assert.equal(blocked.ready, false);
  assert.ok(blocked.issues.some((issue) => issue.label === "3 drużyn bez pełnego składu"));
});
