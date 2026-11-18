/**
 * V5.4 advanced editor (replaces the V4 form): one draft with the wizard, one preset engine, sections
 * that open one at a time, blocking problems listed next to the create button.
 */
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { parsePresetPreviewRequest, previewPreset } from "../../../../../api-server/src/domain/tournament/tournament-presets";
import { WIZARD_DRAFT_KEY } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import CreateTournamentExperimentalAdvanced from "./create-tournament-experimental-advanced";

const originalFetch = globalThis.fetch;
const queryClients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  for (const queryClient of queryClients) queryClient.clear();
  queryClients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

interface Options { health?: "ok" | "down"; create?: (body: unknown) => Promise<Response> | Response }

function renderEditor(role: "organizer" | "fan" | "support" | null, options: Options = {}) {
  if (role) window.localStorage.setItem("tm_role", role);
  const creates: unknown[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.includes("/api/healthz")) return options.health === "down" ? json({ status: "error" }, 503) : json({ status: "ok", database: "ok" });
    if (url.includes("/api/tournaments/presets/preview")) {
      try {
        return json(previewPreset(parsePresetPreviewRequest(body)));
      } catch (error) {
        const e = error as { code: string; message: string; param?: string };
        return json({ code: e.code, error: e.message, param: e.param }, 422);
      }
    }
    if (url.endsWith("/api/tournaments") && init?.method === "POST") {
      creates.push(body);
      return options.create ? options.create(body) : json({ id: 77, name: "X", status: "draft", organizerToken: "token-77" }, 201);
    }
    return json({ error: `unexpected ${url}` }, 404);
  }) as typeof fetch;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  queryClients.add(queryClient);
  const location = memoryLocation({ path: "/experimental/tournaments/new/advanced", record: true });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <CreateTournamentExperimentalAdvanced />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return { ...view, location, creates };
}

const createButton = () => screen.getByRole("button", { name: /Utwórz turniej|Sprawdzanie serwera|Tworzenie/ }) as HTMLButtonElement;

async function fillAccess(name: string, password: string) {
  fireEvent.click(screen.getByRole("button", { name: /Nazwa i dostęp/ }));
  fireEvent.change(screen.getByLabelText(/Nazwa turnieju/), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/Hasło organizatora/), { target: { value: password } });
}

test("opens with one section and a live preview; other sections show their values", async () => {
  renderEditor("organizer");
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("Drabinka pucharowa")));
  assert.equal(screen.getByRole("button", { name: /Format i etapy/ }).getAttribute("aria-expanded"), "true");
  for (const name of [/Mecze/, /Rozstawienie i awanse/, /Uczestnicy/, /Nazwa i dostęp/]) {
    assert.equal(screen.getByRole("button", { name }).getAttribute("aria-expanded"), "false");
  }
  assert.ok(screen.getByRole("button", { name: /Mecze/ }).textContent?.includes("Jedna gra"));
  fireEvent.click(screen.getByRole("button", { name: /Mecze/ }));
  assert.equal(screen.getByRole("button", { name: /Format i etapy/ }).getAttribute("aria-expanded"), "false", "one section at a time");
});

test("scoring section exists only for formats with a table", async () => {
  renderEditor("organizer");
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("Drabinka pucharowa")));
  assert.equal(screen.queryByRole("button", { name: /Punktacja i terminy/ }), null, "a bracket has no points table");
  fireEvent.click(screen.getByRole("radio", { name: "Każdy z każdym" }));
  await screen.findByRole("button", { name: /Punktacja i terminy/ });
});

test("validation lists blocking problems and opens the access section on submit", async () => {
  const { creates } = renderEditor("organizer");
  await waitFor(() => assert.equal(createButton().disabled, false));
  assert.ok(screen.getByRole("button", { name: "Wpisz nazwę turnieju." }));
  fireEvent.click(createButton());
  await waitFor(() => assert.equal(screen.getByRole("button", { name: /Nazwa i dostęp/ }).getAttribute("aria-expanded"), "true"));
  assert.ok(screen.getAllByRole("alert").some((node) => /nazw/i.test(node.textContent ?? "")));
  assert.equal(creates.length, 0);
});

test("private viewing requires a viewer password", async () => {
  const { creates } = renderEditor("organizer");
  await waitFor(() => assert.equal(createButton().disabled, false));
  await fillAccess("Prywatny", "organizer-pass-1");
  fireEvent.click(screen.getByRole("radio", { name: "Z hasłem" }));
  fireEvent.click(createButton());
  await waitFor(() => assert.ok(screen.getAllByRole("alert").some((node) => /widzów/.test(node.textContent ?? ""))));
  assert.equal(creates.length, 0);
});

test("API outage blocks creation and offers a re-check", async () => {
  renderEditor("organizer", { health: "down" });
  await screen.findByText(/Serwer turniejowy jest niedostępny/);
  assert.ok(screen.getByRole("button", { name: "Sprawdź ponownie" }));
});

test("a preview error is shown next to the parameter and blocks creation", async () => {
  window.sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ presetId: "round_robin", answers: { participantCount: 6 }, params: { allowDraws: 1, bestOf: 3 } }));
  const { creates } = renderEditor("organizer");
  const alerts = await screen.findAllByText(/Remisy są możliwe tylko przy meczu na jedną grę/);
  assert.ok(alerts.length >= 1);
  await fillAccess("Liga", "organizer-pass-1");
  fireEvent.click(createButton());
  await waitFor(() => assert.ok(screen.getByText(/Popraw ustawienia rozgrywek/)));
  assert.equal(creates.length, 0);
});

test("double submit sends one request; passwords never reach the draft", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const { creates } = renderEditor("organizer", { create: async () => { await gate; return json({ id: 77, name: "X", status: "draft", organizerToken: "t" }, 201); } });
  await waitFor(() => assert.equal(createButton().disabled, false));
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("Drabinka pucharowa")));
  await fillAccess("Szybki", "organizer-pass-1");
  assert.equal((window.sessionStorage.getItem(WIZARD_DRAFT_KEY) ?? "").includes("organizer-pass-1"), false);
  fireEvent.click(createButton());
  fireEvent.click(createButton());
  release();
  await waitFor(() => assert.equal(creates.length, 1));
});

for (const [role, destination] of [
  ["fan", "/experimental/tournaments/fan"],
  ["support", "/experimental/tournaments/support"],
  [null, "/experimental/tournaments"],
] as const) {
  test(`${role ?? "anonymous"} cannot open the advanced editor directly`, async () => {
    const { location } = renderEditor(role);
    assert.equal(screen.queryByRole("heading", { name: "Wszystkie ustawienia" }), null);
    await waitFor(() => assert.ok(location.history.includes(destination), JSON.stringify(location.history)));
  });
}
