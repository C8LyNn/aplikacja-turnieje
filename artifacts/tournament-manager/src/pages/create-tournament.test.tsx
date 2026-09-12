import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import CreateTournament from "./create-tournament";

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

function renderForm(fetchImplementation: typeof fetch) {
  // Route guard requires organizer role; set it before rendering.
  window.localStorage.setItem("tm_role", "organizer");
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  queryClients.add(queryClient);
  const location = memoryLocation({ path: "/tournaments/new" });
  globalThis.fetch = fetchImplementation;
  const result = render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <CreateTournament />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

function successfulResponse() {
  return new Response(JSON.stringify({
    id: 77,
    name: "Turniej",
    format: "single_elimination",
    status: "draft",
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    defaultBestOf: 1,
    hasHostCode: false,
    organizerToken: "creator-organizer-token",
    createdAt: "2026-01-01T00:00:00.000Z",
  }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}

test("clicking submit focuses the empty name and does not send a request", async () => {
  let requests = 0;
  renderForm(async () => { requests += 1; return successfulResponse(); });
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  const name = screen.getByLabelText("Nazwa turnieju *");
  assert.equal(document.activeElement, name);
  assert.ok(screen.getAllByRole("alert").some((alert) => alert.textContent?.includes("Podaj nazwę turnieju")));
  assert.equal(requests, 0);
});

for (const length of [0, 1, 7]) {
  test(`password length ${length} is rejected by the actual form`, async () => {
    let requests = 0;
    renderForm(async () => { requests += 1; return successfulResponse(); });
    await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
    const password = screen.getByLabelText("Hasło organizatora *");
    if (length) await userEvent.type(password, "x".repeat(length));
    await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
    assert.equal(document.activeElement, password);
    assert.equal(screen.getByRole("alert").textContent?.includes("co najmniej 8"), true);
    assert.equal(requests, 0);
  });
}

test("an eight-character password submits with Enter", async () => {
  const bodies: Array<Record<string, unknown>> = [];
  renderForm(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return successfulResponse();
  });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
  const password = screen.getByLabelText("Hasło organizatora *");
  await userEvent.type(password, "12345678{Enter}");
  await waitFor(() => assert.equal(bodies.length, 1));
  assert.equal(bodies[0].organizerPassword, "12345678");
});

test("two submit events in the same frame call the mutation once", async () => {
  let requests = 0;
  let release!: () => void;
  const response = new Promise<Response>((resolve) => { release = () => resolve(successfulResponse()); });
  const { container } = renderForm(async () => {
    requests += 1;
    return response;
  });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
  const form = container.querySelector("form");
  assert.ok(form);
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => assert.equal(requests, 1));
  release();
});

test("the synchronous submit lock is released after an error", async () => {
  let requests = 0;
  renderForm(async () => {
    requests += 1;
    return new Response(JSON.stringify({ error: "Błąd testowy" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  await screen.findByText("Błąd testowy");
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  await waitFor(() => assert.equal(requests, 2));
});

test("Deadlock and its forced hero are included in the create payload", async () => {
  const bodies: Array<Record<string, unknown>> = [];
  renderForm(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return successfulResponse();
  });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Deadlock Cup");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));
  await userEvent.click(screen.getByRole("button", { name: "Rem" }));
  await userEvent.click(screen.getByRole("button", { name: /Utwórz turniej/i }));
  await waitFor(() => assert.equal(bodies.length, 1));
  assert.deepEqual(bodies[0].gameConfig, {
    gameId: "deadlock",
    configVersion: 1,
    config: { forcedHeroId: "rem" },
  });
});

// --- Regression: the single-stage selector exposes its four supported formats ---

const SINGLE_STAGE_FORMAT_LABELS = [
  "Drabinka eliminacyjna",
  "System szwajcarski",
  "Każdy z każdym",
  "Podwójna eliminacja",
];

function getFormatTrigger() {
  // The format section contains a <Label>Format *</Label> followed by the Select.
  // Scope with within() to distinguish it from other comboboxes (GameConfigPicker, Best-of).
  const label = screen.getByText("Format *");
  const section = label.closest("div")!;
  return within(section).getByRole("combobox");
}

test("single-stage selector includes double elimination and excludes group stage", async () => {
  renderForm(async () => successfulResponse());
  await userEvent.click(getFormatTrigger());
  for (const label of SINGLE_STAGE_FORMAT_LABELS) {
    assert.ok(
      screen.queryByRole("option", { name: label }) !== null,
      `Format option "${label}" missing from single-stage selector`,
    );
  }
  assert.equal(screen.queryByRole("option", { name: "Faza grupowa" }), null);
});

test("Marvel creates one internal group stage with the documented 32-player defaults", async () => {
  const bodies: Array<Record<string, any>> = [];
  renderForm(async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, any>);
    return successfulResponse();
  });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Marvel Cup");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(
    screen.getByRole("option", { name: "Marvel — Eliminacyjne grupy" }),
  );
  assert.ok(
    screen.getByText(
      "Jedna faza grupowa zawierająca kolejne rundy FFA aż do finału.",
    ),
  );
  assert.equal(screen.queryByText("Best of"), null);
  assert.equal(screen.queryByText("Tryb banowania"), null);
  await userEvent.click(
    screen.getByRole("button", { name: /Utwórz turniej/i }),
  );
  await waitFor(() => assert.equal(bodies.length, 1));

  assert.deepEqual(bodies[0].gameConfig, {
    gameId: "marvel",
    configVersion: 1,
    config: {
      groupSize: 8,
      advancingCount: 4,
      killLimit: 20,
      regroupingStrategy: "paired_merge",
    },
  });
  assert.equal(bodies[0].stagePlan.initialParticipantCount, 32);
  assert.equal(bodies[0].stagePlan.stages.length, 1);
  assert.deepEqual(
    {
      format: bodies[0].stagePlan.stages[0].format,
      participantCount: bodies[0].stagePlan.stages[0].participantCount,
      groupCount: bodies[0].stagePlan.stages[0].groupCount,
      participantsPerGroup: bodies[0].stagePlan.stages[0].participantsPerGroup,
      qualifiersPerGroup: bodies[0].stagePlan.stages[0].qualifiersPerGroup,
    },
    {
      format: "group_stage",
      participantCount: 32,
      groupCount: 4,
      participantsPerGroup: 8,
      qualifiersPerGroup: 4,
    },
  );
});

for (const [formatValue, formatLabel] of [
  ["double_elimination", "Podwójna eliminacja"],
] as const) {
  test(`single-stage submit sends format=${formatValue}`, async () => {
    const bodies: Array<Record<string, unknown>> = [];
    renderForm(async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return successfulResponse();
    });
    await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
    await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
    await userEvent.click(getFormatTrigger());
    await userEvent.click(screen.getByRole("option", { name: formatLabel }));
    await userEvent.click(screen.getByRole("button", { name: /Utwórz turniej/i }));
    await waitFor(() => assert.equal(bodies.length, 1));
    assert.equal(
      (bodies[0] as Record<string, unknown>).format,
      formatValue,
      `Expected format=${formatValue} in request body`,
    );
  });
}
