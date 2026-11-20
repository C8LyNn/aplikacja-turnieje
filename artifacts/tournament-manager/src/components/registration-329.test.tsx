// #329 · optional sign-ups in the UI: the public page (states, form, resend safety), the organizer's "Zapisy" panel
// (switch on, open/close, review: accept, complete missing answers, reject with confirmation) and support's narrower view.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import TournamentSignup from "@/pages/tournament-signup";
import { RegistrationPanel } from "./registration-panel";

const testClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchInterval: false }, mutations: { retry: false, gcTime: 0 } } });
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

type Call = { method: string; url: string; body: any };
function mockApi(handler: (call: Call) => { status?: number; body: unknown } | undefined) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { method: init?.method ?? "GET", url: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    const result = handler(call) ?? { body: { fields: [], categories: [], types: [] } };
    if (result.status === 0) throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

const FIELDS = [
  { key: "postac", label: "Postać", type: "select", category: "gaming", kind: "profile", required: true, visibility: "public", options: ["Mag", "Wojownik"] },
  { key: "wiek", label: "Przedział wieku", type: "select", category: "other", kind: "profile", required: false, visibility: "organizer", options: ["<16", "18+"] },
];
const page = (state: string, extra: Record<string, unknown> = {}) => ({
  tournament: { id: 7, name: "Puchar Zapisów", format: "single_elimination", status: "draft" },
  registration: { state, approval: "manual", note: "Start w sobotę.", limit: 8, remaining: 5, ...extra },
  fields: state === "disabled" ? [] : FIELDS,
});

function mountSignup(path = "/tournaments/7/zapisy") {
  const loc = memoryLocation({ path });
  return render(
    <QueryClientProvider client={testClient()}>
      <TestAuthProvider>
        <Router hook={loc.hook} searchHook={loc.searchHook}>
          <Route path="/tournaments/:id/zapisy" component={TournamentSignup} />
          <Route path="/experimental/tournaments/:id/zapisy" component={TournamentSignup} />
        </Router>
      </TestAuthProvider>
    </QueryClientProvider>,
  );
}

test("#329: the public page shows the real state, asks the organizer's questions and sends one sign-up", async () => {
  let submits = 0;
  const calls = mockApi((call) => {
    if (call.url.endsWith("/registration")) return { body: page("open") };
    if (call.method === "POST" && call.url.endsWith("/registrations")) {
      submits++;
      if (submits === 1) return { status: 0, body: null }; // network error on the first try
      return { status: 201, body: { registration: { id: 3, name: call.body.name, status: "pending" }, repeated: false, message: "Zgłoszenie wysłane — czeka na akceptację organizatora." } };
    }
    return undefined;
  });
  const user = userEvent.setup();
  mountSignup();
  assert.equal((await screen.findByTestId("signup-state")).textContent, "Zapisy są otwarte.");
  assert.ok(screen.getByText(/Wolne miejsca:/));
  assert.ok(screen.getByText(/na liście znajdziesz się po akceptacji/), "manual acceptance is announced, not implied automatic");
  assert.ok(screen.getByText("Start w sobotę."));
  await user.click(screen.getByRole("button", { name: /Zapisz się/ }));
  assert.match(screen.getByRole("alert").textContent ?? "", /Podaj nick/);
  await user.type(screen.getByLabelText(/Nick \/ nazwa uczestnika/), "  Ola  ");
  await user.click(screen.getByRole("button", { name: /Zapisz się/ }));
  assert.match(screen.getByRole("alert").textContent ?? "", /Uzupełnij: Postać/, "required question checked before sending");
  await user.selectOptions(screen.getByLabelText(/Postać/), "Mag");
  await user.click(screen.getByRole("button", { name: /Zapisz się/ }));
  await waitFor(() => assert.match(screen.getByRole("alert").textContent ?? "", /Sprawdź połączenie/));
  await user.click(screen.getByRole("button", { name: /Zapisz się/ }));
  const done = await screen.findByTestId("signup-done");
  assert.match(done.textContent ?? "", /Zgłoszenie wysłane/);
  assert.match(done.textContent ?? "", /czeka na akceptację organizatora/);
  const posts = calls.filter((call) => call.method === "POST");
  assert.equal(posts.length, 2);
  assert.equal(posts[0].body.clientToken, posts[1].body.clientToken, "the retry reuses the same form token");
  assert.deepEqual(posts[1].body.customFields, { postac: "Mag" });
  assert.equal(posts[1].body.name, "Ola");
});

test("#329: full, closed, started and private tournaments show no form — only the reason", async () => {
  for (const [state, text] of [["full", /Lista jest pełna/], ["closed", /Zapisy są zamknięte/], ["started", /już wystartował/], ["disabled", /wyłączone/]] as const) {
    mockApi((call) => (call.url.endsWith("/registration") ? { body: page(state) } : undefined));
    mountSignup("/experimental/tournaments/7/zapisy");
    assert.match((await screen.findByTestId("signup-state")).textContent ?? "", text);
    assert.equal(screen.queryByRole("button", { name: /Zapisz się/ }), null, state);
    cleanup();
  }
  mockApi((call) => (call.url.endsWith("/registration") ? { status: 403, body: { error: "prywatny", code: "PRIVATE_OFFLINE" } } : undefined));
  mountSignup();
  assert.match((await screen.findByRole("alert")).textContent ?? "", /Turniej jest prywatny/);
});

function list(overrides: Record<string, unknown> = {}) {
  return {
    settings: { version: 1, enabled: true, open: true, approval: "manual", capacity: null, note: null },
    state: "open",
    places: { limit: 8, used: 3, remaining: 5 },
    counts: { pending: 2, approved: 1, rejected: 0, players: 2 },
    questions: [{ key: "postac", label: "Postać", required: true }],
    registrations: [
      { id: 1, name: "Ola", status: "pending", answers: { postac: "Mag", wiek: "18+" }, missing: [], playerId: null, onList: false, decidedAt: null, decidedBy: null, createdAt: "2026-11-20T10:00:00Z" },
      { id: 2, name: "Bartek", status: "pending", answers: {}, missing: [{ key: "postac", label: "Postać" }], playerId: null, onList: false, decidedAt: null, decidedBy: null, createdAt: "2026-11-20T10:05:00Z" },
      { id: 3, name: "Celina", status: "approved", answers: {}, missing: [], playerId: 9, onList: true, decidedAt: "2026-11-20T10:06:00Z", decidedBy: "Organizator", createdAt: "2026-11-20T09:00:00Z" },
    ],
    ...overrides,
  };
}

function mountPanel(props: Partial<React.ComponentProps<typeof RegistrationPanel>> = {}) {
  return render(
    <QueryClientProvider client={testClient()}>
      <RegistrationPanel tournamentId={7} experimental={false} canConfigure canReview {...props} />
    </QueryClientProvider>,
  );
}

test("#329: sign-ups start off; the organizer switches them on and opens the form", async () => {
  let current = list({ settings: { version: 1, enabled: false, open: false, approval: "manual", capacity: null, note: null }, state: "disabled", registrations: [], counts: { pending: 0, approved: 0, rejected: 0, players: 0 } });
  const calls = mockApi((call) => {
    if (call.url.endsWith("/participant-fields")) return { body: { fields: { version: 1, fields: FIELDS } } };
    if (call.method === "PUT" && call.url.endsWith("/registration-settings")) {
      current = { ...current, settings: { version: 1, ...call.body }, state: call.body.enabled ? (call.body.open ? "open" : "closed") : "disabled" };
      return { body: { settings: current.settings } };
    }
    if (call.url.endsWith("/registrations")) return { body: current };
    return undefined;
  });
  const user = userEvent.setup();
  mountPanel();
  assert.ok(await screen.findByText(/Zapisy są opcjonalne/));
  await user.click(screen.getByRole("button", { name: "Włącz zapisy" }));
  await waitFor(() => assert.equal(screen.getByTestId("registration-state").textContent, "Zamknięte"));
  assert.match(screen.getByTestId("registration-link").textContent ?? "", /\/tournaments\/7\/zapisy$/);
  await user.click(screen.getByRole("radio", { name: /Automatyczna/ }));
  await user.type(screen.getByLabelText(/Limit miejsc/), "6");
  await user.click(screen.getByRole("button", { name: "Otwarte" }));
  await waitFor(() => assert.equal(screen.getByTestId("registration-state").textContent, "Otwarte"));
  const puts = calls.filter((call) => call.method === "PUT");
  assert.deepEqual(puts[0].body, { enabled: true, open: false, approval: "manual", capacity: null, note: null });
  assert.deepEqual(puts.at(-1)!.body, { enabled: true, open: true, approval: "auto", capacity: 6, note: null });
});

test("#329: the organizer accepts, completes a missing answer and rejects only after confirming", async () => {
  let current = list();
  const calls = mockApi((call) => {
    if (call.url.endsWith("/participant-fields")) return { body: { fields: { version: 1, fields: FIELDS } } };
    const accept = call.url.match(/registrations\/(\d+)\/approve$/);
    if (accept) {
      current = { ...current, registrations: current.registrations.map((row) => row.id === Number(accept[1]) ? { ...row, status: "approved", onList: true } : row) };
      return { body: { registration: { id: Number(accept[1]), status: "approved", playerId: 20 }, player: { id: 20, name: "x" } } };
    }
    const reject = call.url.match(/registrations\/(\d+)\/reject$/);
    if (reject) {
      current = { ...current, registrations: current.registrations.map((row) => row.id === Number(reject[1]) ? { ...row, status: "rejected" } : row) };
      return { body: { registration: { id: Number(reject[1]), status: "rejected" } } };
    }
    if (call.url.endsWith("/registrations")) return { body: current };
    return undefined;
  });
  const user = userEvent.setup();
  mountPanel({ experimental: true });
  const rows = await screen.findAllByTestId("registration-row");
  assert.equal(rows.length, 2);
  assert.match(rows[0].textContent ?? "", /Postać: Mag · Przedział wieku: 18\+/);
  assert.match(rows[1].textContent ?? "", /Brakuje: Postać/);
  await user.click(within(rows[0]).getByRole("button", { name: /Zatwierdź/ }));
  assert.ok(await screen.findByText(/„Ola” jest na liście uczestników/));
  assert.ok(calls.some((call) => call.url.endsWith("/registrations/1/approve")));

  const bartek = (await screen.findAllByTestId("registration-row"))[0];
  await user.click(within(bartek).getByRole("button", { name: /^Zatwierdź$/ }));
  await user.selectOptions(within(bartek).getByLabelText(/Postać/), "Wojownik");
  await user.click(within(bartek).getByRole("button", { name: "Zatwierdź z uzupełnieniem" }));
  await waitFor(() => assert.ok(calls.some((call) => call.url.endsWith("/registrations/2/approve"))));
  assert.deepEqual(calls.find((call) => call.url.endsWith("/registrations/2/approve"))!.body, { customFields: { postac: "Wojownik" } });
});

test("#329: rejecting asks first; support without settings rights sees only the review", async () => {
  let current = list();
  const calls = mockApi((call) => {
    if (call.url.endsWith("/participant-fields")) return { body: { fields: { version: 1, fields: FIELDS.filter((field) => field.visibility !== "organizer") } } };
    const reject = call.url.match(/registrations\/(\d+)\/reject$/);
    if (reject) {
      current = { ...current, registrations: current.registrations.map((row) => row.id === Number(reject[1]) ? { ...row, status: "rejected" } : row) };
      return { body: { registration: { id: Number(reject[1]), status: "rejected" } } };
    }
    if (call.url.endsWith("/registrations")) return { body: current };
    return undefined;
  });
  const user = userEvent.setup();
  mountPanel({ canConfigure: false });
  const rows = await screen.findAllByTestId("registration-row");
  assert.equal(screen.queryByRole("button", { name: "Wyłącz zapisy" }), null, "support cannot change the settings");
  assert.equal(screen.queryByRole("button", { name: "Otwarte" }), null);
  await user.click(within(rows[0]).getByRole("button", { name: /Odrzuć/ }));
  assert.ok(screen.getByRole("alertdialog", { name: "Odrzucić zgłoszenie „Ola”?" }));
  assert.equal(calls.some((call) => call.url.includes("/reject")), false, "nothing before the confirmation");
  await user.click(screen.getAllByRole("button", { name: "Odrzuć" }).at(-1)!);
  await waitFor(() => assert.ok(calls.some((call) => call.url.endsWith("/registrations/1/reject"))));
  await user.click(await screen.findByRole("button", { name: /Rozpatrzone/ }));
  assert.ok(screen.getByText(/odrzucone/));
});
