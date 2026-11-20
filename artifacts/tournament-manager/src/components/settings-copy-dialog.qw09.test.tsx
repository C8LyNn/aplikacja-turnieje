// QW-09 · "Nowy turniej z tymi ustawieniami": the dialog shows what the server will copy, sends only the organizer's
// choices, and opens the new tournament in the same view.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { SettingsCopyCard } from "@/components/settings-copy-dialog";
import { copiedLines, copyFormError, copyRequestBody, initialCopyForm, type SettingsCopySummary } from "@/lib/settings-copy";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; window.localStorage.clear(); window.sessionStorage.clear(); });

const cup: SettingsCopySummary = {
  sourceId: 7, sourceName: "Puchar klubu", mode: "plan", participantCount: 8, resizable: true,
  stages: [{ name: "Puchar", format: "single_elimination" }], participantType: "players", visibility: "public_online",
  participantFieldCount: 2, signups: "closed", gameId: null,
  notCopied: ["uczestnicy i drużyny", "mecze, wyniki i tabele", "historia zmian", "hasła", "osoby wspierające", "terminy meczów"],
};
const league: SettingsCopySummary = {
  ...cup, mode: "plan", participantCount: 16, resizable: false, participantFieldCount: 0, signups: "off", participantType: "teams",
  stages: [{ name: "Grupy", format: "group_stage" }, { name: "Play-off", format: "single_elimination" }],
};

test("QW-09: the form is checked in field order and sends only the organizer's choices", () => {
  const form = initialCopyForm(cup);
  assert.equal(copyFormError(form, cup)?.field, "name");
  assert.equal(copyFormError({ ...form, name: "Puchar 2", participantCount: "1" }, cup)?.field, "participantCount");
  assert.equal(copyFormError({ ...form, name: "Puchar 2" }, cup)?.field, "organizerPassword");
  const filled = { ...form, name: "  Puchar 2 ", organizerPassword: "hasło-123" };
  assert.equal(copyFormError({ ...filled, visibility: "private_online" }, cup)?.field, "viewerPassword");
  assert.equal(copyFormError(filled, cup), null);

  assert.deepEqual(copyRequestBody(filled, cup), { name: "Puchar 2", organizerPassword: "hasło-123" }, "same size and visibility → nothing extra");
  assert.deepEqual(copyRequestBody({ ...filled, participantCount: "12", visibility: "private_online", viewerPassword: "widz-123", supportPassword: "pomoc-123" }, cup), {
    name: "Puchar 2", organizerPassword: "hasło-123", visibility: "private_online", viewerPassword: "widz-123", supportPassword: "pomoc-123", participantCount: 12,
  });
  assert.equal("viewerPassword" in copyRequestBody({ ...filled, viewerPassword: "widz-123" }, cup), false, "no viewer password for a public tournament");
  assert.equal("participantCount" in copyRequestBody({ ...initialCopyForm(league), name: "L", organizerPassword: "hasło-123" }, league), false, "multi-stage plans keep their size");
  assert.equal(copyFormError({ ...initialCopyForm(league), name: "L", organizerPassword: "hasło-123", participantCount: "x" }, league), null);

  assert.deepEqual(copiedLines(league).slice(0, 3), ["Plan 2 etapów: Faza grupowa → Drabinka eliminacyjna", "Zasady meczów, punktacja i rozstrzyganie remisów", "Drużyny i limity składu"]);
  assert.ok(copiedLines(cup).includes("Pola uczestników (2)"));
  assert.ok(copiedLines(cup).some((line) => line.startsWith("Formularz zapisów — zamknięty")));
  assert.ok(!copiedLines(league).some((line) => line.startsWith("Formularz zapisów")));
});

function mount(path: string, summary: SettingsCopySummary, reply: (body: Record<string, unknown>) => Response) {
  const sent: Array<{ method: string; url: string; body?: Record<string, unknown>; token: string | null }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    sent.push({ method, url, body, token: headers.get("x-organizer-token") });
    if (url.endsWith("/api/tournaments/7/copy") && method === "GET") return Response.json(summary);
    if (url.endsWith("/api/tournaments/7/copy") && method === "POST") return reply(body);
    return Response.json([]);
  }) as typeof fetch;
  const location = memoryLocation({ path, record: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider>
    <SettingsCopyCard tournamentId={7} experimental={path.startsWith("/experimental")} />
  </AuthProvider></Router></QueryClientProvider>);
  return { sent, location };
}

test("QW-09: Classic — the dialog lists what is and is not copied, checks the form and opens the new tournament", async () => {
  const { sent, location } = mount("/tournaments/7?tab=backup", cup, () => Response.json({ id: 42, name: "Puchar 2", organizerToken: "nowy-token" }, { status: 201 }));
  fireEvent.click(screen.getByRole("button", { name: "Nowy turniej z tymi ustawieniami" }));
  const dialog = await screen.findByRole("dialog", { name: "Nowy turniej z tymi ustawieniami" });
  const summary = await screen.findByTestId("settings-copy-summary");
  assert.match(summary.textContent!, /Format: Drabinka eliminacyjna/);
  assert.match(summary.textContent!, /Nie kopiujemy.*uczestnicy i drużyny.*hasła/);
  assert.equal(document.activeElement, screen.getByLabelText("Nazwa nowego turnieju *"), "focus starts on the name");
  assert.equal((screen.getByLabelText("Liczba uczestników") as HTMLInputElement).value, "8");

  fireEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  assert.equal((await screen.findByRole("alert")).textContent, "Podaj nazwę nowego turnieju.");
  assert.equal(sent.filter((r) => r.method === "POST").length, 0, "nothing is sent until the form is valid");

  fireEvent.change(screen.getByLabelText("Nazwa nowego turnieju *"), { target: { value: "Puchar 2" } });
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: "12" } });
  fireEvent.change(dialog.querySelector("#settings-copy-organizerPassword")!, { target: { value: "hasło-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  await waitFor(() => assert.equal(location.history!.at(-1), "/tournaments/42"));
  const post = sent.find((r) => r.method === "POST")!;
  assert.deepEqual(post.body, { name: "Puchar 2", organizerPassword: "hasło-123", participantCount: 12 });
  assert.match(JSON.stringify({ ...window.localStorage, ...window.sessionStorage }), /nowy-token/, "the new organizer session is kept");
});

test("QW-09: Modern — a refusal is shown in the dialog; success opens the new tournament in Modern", async () => {
  let refuse = true;
  const { location } = mount("/experimental/tournaments/7?tab=backup", league, () => refuse
    ? Response.json({ error: "Turniej prywatny online wymaga hasła widza.", code: "VIEWER_PASSWORD_REQUIRED" }, { status: 422 })
    : Response.json({ id: 43, name: "Liga 2", organizerToken: "t43" }, { status: 201 }));
  fireEvent.click(screen.getByRole("button", { name: "Nowy turniej z tymi ustawieniami" }));
  const dialog = await screen.findByRole("dialog");
  await screen.findByTestId("settings-copy-summary");
  assert.match(dialog.textContent!, /16 — jak poprzednio/);
  assert.equal(screen.queryByRole("textbox", { name: "Liczba uczestników" }), null, "multi-stage size is not editable here");
  fireEvent.change(screen.getByLabelText("Nazwa nowego turnieju *"), { target: { value: "Liga 2" } });
  fireEvent.change(dialog.querySelector("#settings-copy-organizerPassword")!, { target: { value: "hasło-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  assert.equal((await screen.findByRole("alert")).textContent, "Turniej prywatny online wymaga hasła widza.");
  refuse = false;
  fireEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  await waitFor(() => assert.equal(location.history!.at(-1), "/experimental/tournaments/43"));
});
