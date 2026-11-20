/**
 * QW-02 — Classic gets the same "paste a participant list" panel as Modern.
 * Both views are driven with the same pasted text and must show the same preview and send the same
 * payload; the Classic CSV import stays as it was.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { setOrganizerToken } from "@/lib/auth";
import TournamentDetail from "./tournament-detail";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.clear();
  globalThis.fetch = originalFetch;
  localStorage.clear();
  sessionStorage.clear();
});

type Player = { id: number; tournamentId: number; name: string; seed: number | null; status: string };
const roster = (...names: string[]): Player[] => names.map((name, i) => ({ id: i + 1, tournamentId: 1, name, seed: i + 1, status: "active" }));

function mount(view: "classic" | "modern", options: { players?: Player[]; maxPlayers?: number; status?: string } = {}) {
  const server = { players: options.players ?? roster("Kasia"), imports: [] as Array<{ csv: string; mode: string }> };
  const tournament = { id: 1, name: "QW-02", status: options.status ?? "draft", format: "single_elimination", visibility: "public_online", defaultBestOf: 1, maxPlayers: options.maxPlayers ?? 8, hasOrganizerPassword: true, participantType: "players" };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  localStorage.setItem("tm_role", "organizer");
  setOrganizerToken(1, "qw02-token");
  globalThis.fetch = async (input, init) => {
    const endpoint = String(input).replace(/^.*\/api\/tournaments\/1/, "").replace(/\?.*$/, "") || "/tournament";
    const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    if (endpoint === "/players/import" && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { csv: string; mode: string };
      server.imports.push(body);
      const names = body.csv.split("\n").slice(1).map((line) => line.split(/[;,]/)[0]!).filter(Boolean);
      const base = body.mode === "replace" ? [] : server.players;
      server.players = [...base, ...names.map((name, i) => ({ id: 100 + server.imports.length * 20 + i, tournamentId: 1, name, seed: null, status: "active" }))];
      return json({ imported: names.length, skipped: 0, errors: [], replacedCount: body.mode === "replace" ? 1 : null, limitExceeded: false });
    }
    if (endpoint === "/tournament") return json(tournament);
    if (endpoint === "/players") return json(server.players);
    return json([]);
  };
  const location = memoryLocation({ path: `${view === "modern" ? "/experimental" : ""}/tournaments/1?tab=players` });
  render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}><AuthProvider><TournamentDetail /></AuthProvider></Router></QueryClientProvider>);
  return server;
}

const LONG = "X".repeat(101);
/** Duplicate in the list, blank lines, a nick already on the roster (other letter case), too long, bad seed, separator in a nick. */
const MESSY = ["Ala", "", "Bartek", "ala", "   ", "KASIA", LONG, "Celina"].join("\n");

async function openPaste() {
  const open = await screen.findByRole("button", { name: /^Wklej listę/ }, { timeout: 3000 });
  fireEvent.click(open);
  const panel = (await screen.findByRole("heading", { name: "Wklej listę uczestników" })).closest("section")!;
  return within(panel);
}

function previewSnapshot(panel: ReturnType<typeof within>) {
  const rows: Array<Array<string | null>> = panel.getAllByRole("row").slice(1).map((row: HTMLElement) => within(row).getAllByRole("cell").map((cell: HTMLElement) => cell.textContent));
  const summary = panel.getByRole("status").textContent;
  const submit = panel.getByRole("button", { name: /^Dodaj / }) as HTMLButtonElement;
  return { rows, summary, submit: submit.textContent, disabled: submit.disabled };
}

async function pasteAndAdd(view: "classic" | "modern", text: string, options?: Parameters<typeof mount>[1]) {
  const server = mount(view, options);
  const panel = await openPaste();
  fireEvent.change(panel.getByRole("textbox"), { target: { value: text } });
  const preview = previewSnapshot(panel);
  if (!preview.disabled) {
    fireEvent.click(panel.getByRole("button", { name: /^Dodaj / }));
    await waitFor(() => assert.equal(server.imports.length, 1));
  }
  const done = preview.disabled ? null : (await screen.findByText(/^Dodano /)).textContent;
  cleanup();
  return { preview, imports: server.imports, done };
}

test("QW-02: Classic and Modern show the same preview and send the same rows for the same messy list", async () => {
  const classic = await pasteAndAdd("classic", MESSY);
  const modern = await pasteAndAdd("modern", MESSY);
  assert.deepEqual(classic.preview, modern.preview);
  assert.deepEqual(classic.imports, modern.imports);
  assert.equal(classic.done, modern.done);

  assert.match(classic.preview.summary ?? "", /3 do dodania/);
  assert.match(classic.preview.summary ?? "", /3 wiersze z błędem/);
  // Blank lines are skipped, every other line keeps its number from the pasted text.
  assert.deepEqual(classic.preview.rows.map((row) => [row[0], row[4]]), [
    ["1", "OK"], ["3", "OK"], ["4", "Powtórzony w tej liście"], ["6", "Już jest na liście turnieju"],
    ["7", "Nick za długi (101/100 znaków)"], ["8", "OK"],
  ]);
  assert.deepEqual(classic.imports, [{ csv: "name;team;seed\nAla;;\nBartek;;\nCelina;;", mode: "append" }]);
});

test("QW-02: seeds, separators and the player limit are judged the same way in both views", async () => {
  const text = "nick;drużyna;rozstawienie\nAla;Alfa;2\nOla;Alfa;2\nEwa;;1000\nIga;;\nJan;;3\nUla;;4";
  const classic = await pasteAndAdd("classic", text, { maxPlayers: 4 });
  const modern = await pasteAndAdd("modern", text, { maxPlayers: 4 });
  assert.deepEqual(classic.preview, modern.preview);
  assert.deepEqual(classic.imports, modern.imports);
  assert.deepEqual(classic.preview.rows.map((row) => row[4]), ["OK", "Rozstawienie 2 powtórzone", "Rozstawienie „1000” poza zakresem 1–999", "OK", "OK", "OK"]);
  // One player is already on the list, the limit is 4: four valid rows, one does not fit.
  assert.match(classic.preview.summary ?? "", /3 do dodania/);
  assert.match(classic.preview.summary ?? "", /1 nie zmieści się \(limit 4\)/);
  assert.match(classic.preview.summary ?? "", /Nagłówek rozpoznany/);
});

test("QW-02 Classic: a list with nothing valid cannot be submitted", async () => {
  const result = await pasteAndAdd("classic", ["Kasia", "kasia", LONG].join("\n"));
  assert.equal(result.preview.disabled, true);
  assert.match(result.preview.summary ?? "", /0 do dodania/);
  assert.deepEqual(result.imports, []);
});

test("QW-02 Classic: pasting the same list again adds nobody twice", async () => {
  const server = mount("classic");
  let panel = await openPaste();
  fireEvent.change(panel.getByRole("textbox"), { target: { value: "Ala\nOla" } });
  fireEvent.click(panel.getByRole("button", { name: "Dodaj 2 zawodników" }));
  await screen.findByText(/^Dodano 2 zawodników/);
  await waitFor(() => assert.ok(screen.getByText("Zawodnicy (3)")));
  fireEvent.click(screen.getByRole("button", { name: "Wklej kolejną listę" }));
  panel = within((await screen.findByRole("heading", { name: "Wklej listę uczestników" })).closest("section")!);
  fireEvent.change(panel.getByRole("textbox"), { target: { value: "Ala\nOla\nEwa" } });
  const preview = previewSnapshot(panel);
  assert.deepEqual(preview.rows.map((row) => row[4]), ["Już jest na liście turnieju", "Już jest na liście turnieju", "OK"]);
  fireEvent.click(panel.getByRole("button", { name: "Dodaj 1 zawodnika" }));
  await waitFor(() => assert.equal(server.imports.length, 2));
  assert.equal(server.imports[1]!.csv, "name;team;seed\nEwa;;");
  assert.deepEqual(server.players.map((player) => player.name), ["Kasia", "Ala", "Ola", "Ewa"]);
});

test("QW-02 Classic: replacing the roster needs a second, explicit click", async () => {
  const server = mount("classic");
  const panel = await openPaste();
  fireEvent.change(panel.getByRole("textbox"), { target: { value: "Kasia\nOla" } });
  fireEvent.click(panel.getByRole("radio", { name: /Zastąp całą listę/ }));
  fireEvent.click(panel.getByRole("button", { name: "Dodaj 2 zawodników" }));
  assert.match(panel.getByRole("alert").textContent ?? "", /zostaną usunięci/);
  assert.deepEqual(server.imports, []);
  fireEvent.click(panel.getByRole("button", { name: "Zastąp listę (2)" }));
  await waitFor(() => assert.deepEqual(server.imports.map((call) => call.mode), ["replace"]));
});

test("QW-02 Classic: the CSV import is still there and still sends the text as typed", async () => {
  const server = mount("classic");
  fireEvent.click(await screen.findByRole("button", { name: "Import CSV" }, { timeout: 3000 }));
  assert.ok(screen.getByText("Format pliku CSV"));
  const csv = "name,team,seed\nProPlayer,TeamAlpha,1\nNoobSlayer,TeamBeta,2";
  fireEvent.change(screen.getByPlaceholderText(/^name,team,seed/), { target: { value: csv } });
  assert.ok(screen.getByText("Wiersze danych:").textContent?.includes("2"));
  fireEvent.click(screen.getByRole("button", { name: "Importuj z CSV" }));
  await screen.findByText("Import zakończony");
  assert.deepEqual(server.imports, [{ csv, mode: "append" }]);
});

test("QW-02 Classic: paste and CSV panels never show together; neither is offered after the start", async () => {
  mount("classic");
  await openPaste();
  fireEvent.click(screen.getByRole("button", { name: "Import CSV" }));
  assert.ok(screen.getByText("Format pliku CSV"));
  assert.equal(screen.queryByRole("heading", { name: "Wklej listę uczestników" }), null);
  fireEvent.click(screen.getByRole("button", { name: "Wklej listę" }));
  assert.ok(screen.getByRole("heading", { name: "Wklej listę uczestników" }));
  assert.equal(screen.queryByText("Format pliku CSV"), null);
  cleanup();

  mount("classic", { status: "active" });
  await screen.findByText("Zawodnicy (1)", {}, { timeout: 3000 });
  assert.equal(screen.queryByRole("button", { name: "Wklej listę" }), null);
  assert.equal(screen.queryByRole("button", { name: "Import CSV" }), null);
});

test("QW-02: Classic styles every class the shared panel uses, without touching the Modern scope", () => {
  const css = readFileSync(new URL("../organizer.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../features/experimental-tournaments/experimental-v4-bulk-paste.tsx", import.meta.url), "utf8");
  const used = new Set([...source.matchAll(/experimental-v4-[a-z-]+/g)].map((match) => match[0]).filter((name) => name !== "experimental-v4-bulk-paste" && name !== "experimental-v4-model"));
  for (const name of used) assert.ok(css.includes(`.stable-bulk-paste .${name}`), `Classic has no style for .${name}`);
  const block = css.slice(css.indexOf("/* QW-02"));
  for (const line of block.split("\n").filter((l) => l.includes("experimental-v4-"))) assert.ok(line.includes(".stable-bulk-paste"), `unscoped rule: ${line}`);
});
