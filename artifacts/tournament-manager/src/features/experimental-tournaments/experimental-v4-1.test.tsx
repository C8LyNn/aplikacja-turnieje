import test from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Match, TournamentStage } from "@workspace/api-client-react";
import {
  parseBulkRoster,
  parseMatchQuery,
  pickResumeTournament,
  searchMatches,
  stageMap,
  tournamentAction,
} from "@/features/experimental-tournaments/experimental-v4-model";
import { ExperimentalBulkPaste } from "@/features/experimental-tournaments/experimental-v4-bulk-paste";
import { ExperimentalMatchFlow, ExperimentalStageMap } from "@/features/experimental-tournaments/experimental-v4-panels";
import { ExperimentalTournamentList, type ExperimentalTournamentListItem } from "@/features/experimental-tournaments/experimental-tournament-list";

test.afterEach(() => cleanup());

const m = (id: number, round: number, status: Match["status"], p1: string, p2: string, extra: Partial<Match> = {}) =>
  ({ id, round, matchNumber: id, sortOrder: null, stageId: 1, status, player1Id: 1, player2Id: 2, player1Name: p1, player2Name: p2, ...extra }) as Match;
const s = (id: number, position: number, status: TournamentStage["status"], extra: Partial<TournamentStage> = {}) =>
  ({ id, position, status, name: `Etap ${position}`, format: "swiss", currentRound: null, totalRounds: null, plannedRounds: null,
    participantCount: 0, qualificationMode: "none", advancingCount: null, groupCount: null, qualifiersPerGroup: null, ...extra }) as TournamentStage;
const activity = (playerCount: number, readyMatchCount = 0, liveMatchCount = 0) => ({ playerCount, readyMatchCount, liveMatchCount });

/* ── bulk paste: parsing and validation ─────────────────────────────────── */

test("bulk: plain list, numbered list and blank lines", () => {
  assert.deepEqual(parseBulkRoster("Ala\n\nOla\n  Ela  ").valid.map((r) => r.name), ["Ala", "Ola", "Ela"]);
  assert.deepEqual(parseBulkRoster("1. Ala\n2) Ola").valid.map((r) => r.name), ["Ala", "Ola"]);
  // Not every line numbered → numbers are part of nicks.
  assert.deepEqual(parseBulkRoster("1. Ala\nOla").valid.map((r) => r.name), ["1. Ala", "Ola"]);
});

test("bulk: spreadsheet columns, CSV header in any order, quotes", () => {
  const tsv = parseBulkRoster("Ala\tAlfa\t2\nOla\t\t1");
  assert.deepEqual(tsv.valid.map((r) => [r.name, r.team, r.seed]), [["Ala", "Alfa", 2], ["Ola", "", 1]]);
  const csv = parseBulkRoster('seed;nick;team\n3;"Ala";Beta');
  assert.equal(csv.headerDetected, true);
  assert.deepEqual(csv.valid.map((r) => [r.name, r.team, r.seed]), [["Ala", "Beta", 3]]);
  assert.equal(csv.csv, "name;team;seed\nAla;Beta;3");
});

test("bulk: every server rule is reported per row before sending", () => {
  const long = "x".repeat(101);
  const r = parseBulkRoster(`nick,team,seed\nAla,,1\nala,,2\nOla,,1\nEla,,0\n${long},,\n,,\nKasia,,\nZuza,,abc`, { existingNames: ["Kasia"] });
  const errors = Object.fromEntries(r.invalid.map((row) => [row.line, row.error]));
  assert.equal(errors[3], "Powtórzony w tej liście");
  assert.equal(errors[4], "Rozstawienie 1 powtórzone");
  assert.match(errors[5]!, /poza zakresem/);
  assert.match(errors[6]!, /za długi/);
  assert.equal(errors[7], "Brak nicku");
  assert.equal(errors[8], "Już jest na liście turnieju");
  assert.match(errors[9]!, /„abc”/);
  assert.deepEqual(r.valid.map((row) => row.name), ["Ala"]);
});

test("bulk: blanks are numbered after explicit seeds; taken roster seeds are flagged", () => {
  const r = parseBulkRoster("Kowalski\t\t1\nNowak\t\t2\nZieliński\t\t\nKamińska\t\t4", {});
  assert.deepEqual(r.valid.map((row) => [row.name, row.seed, !!row.autoSeed]), [["Kowalski", 1, false], ["Nowak", 2, false], ["Zieliński", 5, true], ["Kamińska", 4, false]]);
  const append = parseBulkRoster("A\t\t3\nB\t\t6\nC", { existingNames: ["X", "Y", "Z"], existingSeeds: [1, 2, 3] });
  assert.equal(append.invalid[0]?.error, "Rozstawienie 3 jest już zajęte na liście turnieju");
  assert.deepEqual(append.valid.map((row) => [row.name, row.seed]), [["B", 6], ["C", 7]]);
  // Without any explicit seed nothing is numbered: the server appends in paste order.
  assert.deepEqual(parseBulkRoster("A\nB").valid.map((row) => row.seed), [null, null]);
  // Replace mode does not consider the old roster's seeds.
  assert.equal(parseBulkRoster("A\t\t1", { existingSeeds: [1], mode: "replace" }).valid.length, 1);
});

test("bulk: replace mode ignores the current roster; capacity is counted", () => {
  assert.equal(parseBulkRoster("Kasia", { existingNames: ["Kasia"], mode: "replace" }).valid.length, 1);
  assert.equal(parseBulkRoster("A\nB\nC", { existingNames: ["X", "Y"], maxPlayers: 4 }).overCapacity, 1);
  assert.equal(parseBulkRoster("A\nB\nC", { existingNames: ["X", "Y"], maxPlayers: 4, mode: "replace" }).overCapacity, 0);
});

test("bulk paste UI: preview, fix-up and import of valid rows only", async () => {
  const calls: Array<[string, string]> = [];
  render(<ExperimentalBulkPaste existingNames={["Kasia"]} maxPlayers={8} onImport={async (csv, mode) => { calls.push([csv, mode]); return { imported: 2 }; }} onClose={() => {}} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ala\nKasia\nOla\nAla" } });
  assert.ok(screen.getByText("2 do dodania"));
  assert.ok(screen.getByText("2 wiersze z błędem"));
  fireEvent.click(screen.getByRole("button", { name: /Usuń błędne wiersze/ }));
  assert.equal((screen.getByRole("textbox") as HTMLTextAreaElement).value, "Ala\nOla");
  fireEvent.click(screen.getByRole("button", { name: "Dodaj 2 zawodników" }));
  await waitFor(() => assert.ok(screen.getByText(/Dodano 2 zawodników/)));
  assert.deepEqual(calls, [["name;team;seed\nAla;;\nOla;;", "append"]]);
});

test("bulk paste UI: replacing an existing roster needs a second click", async () => {
  const calls: string[] = [];
  render(<ExperimentalBulkPaste existingNames={["Kasia"]} onImport={async (_csv, mode) => { calls.push(mode); return {}; }} onClose={() => {}} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ala\nOla" } });
  fireEvent.click(screen.getByRole("radio", { name: /Zastąp całą listę/ }));
  fireEvent.click(screen.getByRole("button", { name: "Dodaj 2 zawodników" }));
  assert.ok(screen.getByRole("alert"));
  assert.deepEqual(calls, []);
  fireEvent.click(screen.getByRole("button", { name: "Zastąp listę (2)" }));
  await waitFor(() => assert.deepEqual(calls, ["replace"]));
});

/* ── match search ───────────────────────────────────────────────────────── */

test("match query: round, ids and text", () => {
  assert.deepEqual(parseMatchQuery("r2 Kowal"), { ids: [], round: 2, text: "kowal" });
  assert.deepEqual(parseMatchQuery("runda 3"), { ids: [], round: 3, text: "" });
  assert.deepEqual(parseMatchQuery("#41"), { ids: [41], round: null, text: "" });
  assert.deepEqual(parseMatchQuery("id 7 łucja"), { ids: [7], round: null, text: "lucja" });
});

test("match search: diacritics-insensitive, round filter, open matches first", () => {
  const list = [m(1, 1, "completed", "Łucja", "Ola"), m(2, 2, "pending", "Ala", "Łukasz"), m(3, 2, "pending", "Ewa", "Iza"), m(4, 1, "pending", "Lucjan", "Ela")];
  assert.deepEqual(searchMatches(list, "luc").map((x) => x.id), [4, 1]);
  assert.deepEqual(searchMatches(list, "r2").map((x) => x.id), [2, 3]);
  assert.deepEqual(searchMatches(list, "r2 lukasz").map((x) => x.id), [2]);
  assert.deepEqual(searchMatches(list, "#3").map((x) => x.id), [3]);
  assert.deepEqual(searchMatches(list, "   "), []);
});

test("match flow search: results replace 'up next', Enter selects, Escape clears, '/' focuses", () => {
  const picked: number[] = [];
  const list = [m(1, 1, "pending", "Ala", "Ola"), m(2, 1, "pending", "Ewa", "Iza"), m(9, 3, "completed", "Ala", "Iza", { stageId: 2, score1: 2, score2: 1 })];
  render(<ExperimentalMatchFlow matches={list.slice(0, 2)} allMatches={list} stageNames={new Map([[2, "Finały"]])} focusedMatchId={1} onSelect={(id) => picked.push(id)} />);
  const input = screen.getByRole("searchbox", { name: "Znajdź mecz" });
  fireEvent.keyDown(window, { key: "/" });
  assert.equal(document.activeElement, input);
  fireEvent.change(input, { target: { value: "ala" } });
  assert.ok(screen.getByText("Znaleziono: 2"));
  assert.equal(screen.queryByText("Następne do rozegrania"), null);
  const finished = screen.getByRole("button", { name: /#9: Ala kontra Iza, runda 3, Finały, Zakończony 2:1/ });
  assert.ok(within(finished).getByText("Finały"));
  fireEvent.keyDown(input, { key: "Enter" });
  assert.deepEqual(picked, [1]);
  fireEvent.change(input, { target: { value: "zzz" } });
  assert.ok(screen.getByText("Brak meczów dla tego wyszukiwania"));
  fireEvent.keyDown(input, { key: "Escape" });
  assert.ok(screen.getByText("Następne do rozegrania"));
});

/* ── dashboard: action groups ───────────────────────────────────────────── */

test("action: each lifecycle maps to the next thing to do", () => {
  assert.equal(tournamentAction({ id: 1, status: "active", activity: activity(8, 2, 1) })?.hint, "1 mecz trwa · 2 mecze gotowe");
  assert.equal(tournamentAction({ id: 1, status: "active", activity: activity(8, 2, 1) })?.href, "/experimental/tournaments/1/host");
  assert.equal(tournamentAction({ id: 1, status: "active", activity: activity(8) })?.group, "advance");
  assert.equal(tournamentAction({ id: 1, status: "draft", activity: activity(5) })?.group, "start");
  assert.equal(tournamentAction({ id: 1, status: "draft", activity: activity(1) })?.href, "/experimental/tournaments/1?tab=players");
  assert.equal(tournamentAction({ id: 1, status: "completed", activity: activity(4) })?.group, "done");
  assert.equal(tournamentAction({ id: 1, status: "active" }), null, "no activity → no guessing");
});

test("resume card prefers an active tournament with matches to play", () => {
  const r = pickResumeTournament([
    { id: 1, name: "Nowy", status: "active", createdAt: "2026-11-16T00:00:00Z", currentRound: 1, totalRounds: 2, activity: activity(4) },
    { id: 2, name: "Starszy", status: "active", createdAt: "2026-11-01T00:00:00Z", currentRound: 1, totalRounds: 2, activity: activity(4, 1) },
  ]);
  assert.equal(r?.tournament.id, 2);
});

function mountList(items: ExperimentalTournamentListItem[]) {
  const location = memoryLocation({ path: "/experimental/tournaments/dashboard" });
  return render(
    <Router hook={location.hook}>
      <ExperimentalTournamentList tournaments={items} statusFilter="all" formatLabels={{}} canExport={() => false} exportingId={null} onExport={() => {}} onDelete={() => {}} />
    </Router>,
  );
}

test("dashboard list groups by required action and names the action per tournament", () => {
  mountList([
    { id: 1, name: "Liga", status: "active", format: "swiss", createdAt: "2026-11-01T00:00:00Z", activity: activity(8, 0, 0) },
    { id: 2, name: "Puchar", status: "active", format: "swiss", createdAt: "2026-11-02T00:00:00Z", activity: activity(8, 3, 0) },
    { id: 3, name: "Szkic", status: "draft", format: "swiss", createdAt: "2026-11-03T00:00:00Z", activity: activity(0) },
    { id: 4, name: "Gotowy", status: "draft", format: "swiss", createdAt: "2026-11-04T00:00:00Z", activity: activity(6) },
    { id: 5, name: "Archiwum", status: "completed", format: "swiss", createdAt: "2026-11-05T00:00:00Z", activity: activity(6) },
  ]);
  const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent?.replace(/\d+$/, ""));
  assert.deepEqual(headings, ["Do prowadzenia teraz", "Czekają na kolejny krok", "Gotowe do startu", "Brakuje uczestników", "Zakończone"]);
  const play = screen.getByRole("region", { name: /Do prowadzenia teraz/ });
  assert.equal(within(play).getByRole("link", { name: "Prowadź mecze: Puchar" }).getAttribute("href"), "/experimental/tournaments/2/host");
  assert.ok(within(play).getByText("3 mecze gotowe"));
  assert.ok(screen.getByRole("link", { name: "Dodaj uczestników: Szkic" }));
  assert.ok(screen.getByRole("link", { name: "Uruchom turniej: Gotowy" }));
});

/* ── stage map ──────────────────────────────────────────────────────────── */

test("stage map: qualification rules and implicit advancement to the next stage", () => {
  const nodes = stageMap(
    [s(1, 1, "active", { participantCount: 16, qualificationMode: "top_n_per_group", groupCount: 4, qualifiersPerGroup: 2 }), s(2, 2, "planned", { participantCount: 8, format: "single_elimination" })],
    [], null, 1,
  );
  assert.match(nodes[0]!.qualification, /2 najlepszych z każdej grupy \(4 gr\.\)/);
  assert.deepEqual(nodes[0]!.outgoing, [{ label: "Awans", count: 8, targetStageId: 2, targetName: "Etap 2" }]);
  assert.equal(nodes[0]!.eliminated, 8);
  assert.equal(nodes[1]!.qualification, "Etap końcowy — wyłania zwycięzcę");
});

test("stage map: basket routes win over the implicit rule and feed input baskets", () => {
  const nodes = stageMap(
    [s(1, 1, "planned", { participantCount: 12, qualificationMode: "top_n", advancingCount: 4 }), s(2, 2, "planned", { participantCount: 8 })],
    [],
    {
      baskets: [
        { id: "s1-out-1", stageId: 1, type: "output", ordinal: 1, participantIds: [], qualifierCount: 4 },
        { id: "s2-in-1", stageId: 2, type: "input", ordinal: 1, participantIds: [], qualifierCount: null },
        { id: "s2-in-2", stageId: 2, type: "input", ordinal: 2, participantIds: [11, 12, 13, 14], qualifierCount: null },
      ],
      routes: [{ sourceBasketId: "s1-out-1", targetBasketId: "s2-in-1" }],
    },
  );
  assert.deepEqual(nodes[0]!.outgoing.map((l) => [l.label, l.count, l.targetName]), [["Koszyk wyjściowy 1", 4, "Etap 2"]]);
  assert.deepEqual(nodes[1]!.inputs, [{ label: "Koszyk 1", direct: 0, incoming: 4 }, { label: "Koszyk 2", direct: 4, incoming: 0 }]);
});

test("stage map component renders without basket data (query disabled for one stage)", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const { container, unmount } = render(
    <QueryClientProvider client={client}><ExperimentalStageMap tournamentId={1} stages={[s(1, 1, "active")]} matches={[]} /></QueryClientProvider>,
  );
  assert.equal(container.innerHTML, "");
  unmount();
  client.clear();
});
