import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import CreateTournamentExperimental from "./create-tournament-experimental";

const originalFetch = globalThis.fetch;
const queryClients = new Set<QueryClient>();
const DRAFT_KEY = "tm_exp_create_draft_v1";

afterEach(() => {
  cleanup();
  for (const queryClient of queryClients) queryClient.clear();
  queryClients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function successfulResponse(id = 77, organizerToken = "experimental-organizer-token") {
  return jsonResponse(
    {
      id,
      name: "Experimental Cup",
      format: "single_elimination",
      status: "draft",
      resultModelVersion: "series_v1",
      rankingPolicy: "match_record_v1",
      defaultBestOf: 1,
      hasHostCode: false,
      hasOrganizerPassword: true,
      hasSupportPassword: false,
      activeStageId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      organizerToken,
    },
    201,
  );
}

function renderExperimental(
  role: "organizer" | "fan" | "support" | null,
  fetchImplementation: typeof fetch = async () => successfulResponse(),
) {
  if (role) window.localStorage.setItem("tm_role", role);
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/healthz")) {
      return jsonResponse({ status: "ok", database: "ok" }, 200);
    }
    return fetchImplementation(input, init);
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  queryClients.add(queryClient);

  const location = memoryLocation({
    path: "/experimental/tournaments/new",
    record: true,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <CreateTournamentExperimental />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );

  return { ...result, location };
}

test("organizer sees a functional Experimental create form", async () => {
  renderExperimental("organizer");

  await screen.findByRole("heading", { name: "Nowy turniej" });

  assert.ok(screen.getByLabelText("Nazwa turnieju *"));
  assert.ok(screen.getByLabelText("Maks. graczy"));
  assert.ok(screen.getByLabelText("Hasło organizatora *"));
  assert.ok(screen.getByLabelText("Metoda seedowania"));
  assert.ok(screen.getByRole("button", { name: /Drabinka eliminacyjna/ }));

  const submit = await screen.findByRole("button", { name: "Utwórz turniej" });
  await waitFor(() => assert.equal(submit.hasAttribute("disabled"), false));
});

test("validation blocks empty name and short organizer password", async () => {
  let requests = 0;
  renderExperimental("organizer", async () => {
    requests += 1;
    return successfulResponse();
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  assert.equal(document.activeElement, screen.getByLabelText("Nazwa turnieju *"));
  assert.equal(requests, 0);

  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "1234567");
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  assert.equal(document.activeElement, screen.getByLabelText("Hasło organizatora *"));
  assert.ok(screen.getByRole("alert").textContent?.includes("co najmniej 8"));
  assert.equal(requests, 0);
});

test("default registration-order create reuses the existing endpoint without a stage plan", async () => {
  const bodies: Array<Record<string, unknown>> = [];
  const TOURNAMENT_ID = 91;
  const ORG_TOKEN = "tok-exp-organizer";

  const { location } = renderExperimental("organizer", async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return successfulResponse(TOURNAMENT_ID, ORG_TOKEN);
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Experimental Cup");
  await userEvent.type(screen.getByLabelText("Maks. graczy"), "16");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  await waitFor(() => assert.equal(bodies.length, 1));

  assert.equal(bodies[0].name, "Experimental Cup");
  assert.equal(bodies[0].format, "single_elimination");
  assert.equal(bodies[0].maxPlayers, 16);
  assert.equal(bodies[0].organizerPassword, "12345678");
  assert.equal(bodies[0].visibility, "public_online");
  assert.equal("stagePlan" in bodies[0], false);

  await waitFor(() => {
    assert.equal(window.sessionStorage.getItem(`tm_org_${TOURNAMENT_ID}`), ORG_TOKEN);
    assert.ok(
      location.history.some((item) => item.includes(`/experimental/tournaments/${TOURNAMENT_ID}`)),
      `expected navigation to /experimental/tournaments/${TOURNAMENT_ID}; history=${JSON.stringify(location.history)}`,
    );
  });
});

test("non-default seeding creates a stage plan through the existing helper contract", async () => {
  const bodies: Array<Record<string, any>> = [];
  renderExperimental("organizer", async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, any>);
    return successfulResponse();
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Losowany");
  await userEvent.type(screen.getByLabelText("Maks. graczy"), "8");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");

  await userEvent.click(screen.getByLabelText("Metoda seedowania"));
  await userEvent.click(screen.getByRole("option", { name: "Losowanie (ceremonia losowania)" }));
  await userEvent.click(screen.getByText("Natychmiast", { selector: "span" }));

  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
  await waitFor(() => assert.equal(bodies.length, 1));

  assert.ok(bodies[0].stagePlan, "non-default seeding should send a stagePlan");
  assert.equal(bodies[0].stagePlan.stages[0].entrySeedingMethod, "random");
  assert.equal(bodies[0].stagePlan.stages[0].randomRevealOrder, "instant");
});

test("private online mode requires viewer password", async () => {
  let requests = 0;
  renderExperimental("organizer", async () => {
    requests += 1;
    return successfulResponse();
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Prywatny");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");
  await userEvent.click(screen.getByText("Prywatny online", { selector: "span" }));
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  assert.equal(document.activeElement, screen.getByLabelText("Hasło widza *"));
  assert.equal(requests, 0);
});

test("draft persistence stores non-sensitive fields but not passwords", async () => {
  renderExperimental("organizer");
  await screen.findByRole("heading", { name: "Nowy turniej" });

  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Zachowany szkic");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "super-secret");

  await waitFor(() => {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    assert.ok(raw);
    assert.match(raw, /Zachowany szkic/);
    assert.equal(raw.includes("super-secret"), false);
  });
});

test("clear resets the non-sensitive draft", async () => {
  renderExperimental("organizer");
  await screen.findByRole("heading", { name: "Nowy turniej" });

  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Do usunięcia");
  await userEvent.click(screen.getByRole("button", { name: "Wyczyść" }));

  assert.equal((screen.getByLabelText("Nazwa turnieju *") as HTMLInputElement).value, "");
});

test("API health failure disables create and offers retry", async () => {
  window.localStorage.setItem("tm_role", "organizer");
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  queryClients.add(queryClient);
  const location = memoryLocation({ path: "/experimental/tournaments/new", record: true });

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/healthz")) return new Response(null, { status: 503 });
    return successfulResponse();
  };

  render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <CreateTournamentExperimental />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Nowy turniej" });
  const disabled = await screen.findByRole("button", { name: "Serwer niedostępny" });
  assert.equal(disabled.hasAttribute("disabled"), true);
  assert.ok(screen.getByRole("button", { name: "Sprawdź ponownie" }));
});

test("optional support password shorter than eight characters is rejected locally", async () => {
  let requests = 0;
  renderExperimental("organizer", async () => {
    requests += 1;
    return successfulResponse();
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Wsparcie");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");
  await userEvent.type(screen.getByLabelText("Hasło wsparcia"), "1234");
  await waitFor(() =>
    assert.equal(screen.getByRole("button", { name: "Utwórz turniej" }).hasAttribute("disabled"), false),
  );
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  assert.equal(document.activeElement, screen.getByLabelText("Hasło wsparcia"));
  assert.equal(requests, 0);
});

test("fractional maxPlayers is rejected instead of being truncated", async () => {
  let requests = 0;
  renderExperimental("organizer", async () => {
    requests += 1;
    return successfulResponse();
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Liczby");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");
  fireEvent.change(screen.getByLabelText("Maks. graczy"), { target: { value: "2.5" } });
  await waitFor(() =>
    assert.equal(screen.getByRole("button", { name: "Utwórz turniej" }).hasAttribute("disabled"), false),
  );
  await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

  assert.equal(document.activeElement, screen.getByLabelText("Maks. graczy"));
  assert.equal(requests, 0);
});

test("double submit in the same frame sends only one request", async () => {
  let requests = 0;
  let release!: () => void;
  const response = new Promise<Response>((resolve) => {
    release = () => resolve(successfulResponse());
  });

  const { container } = renderExperimental("organizer", async () => {
    requests += 1;
    return response;
  });

  await screen.findByRole("heading", { name: "Nowy turniej" });
  await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej");
  await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "12345678");

  const submit = await screen.findByRole("button", { name: "Utwórz turniej" });
  await waitFor(() => assert.equal(submit.hasAttribute("disabled"), false));

  const form = container.querySelector("form");
  assert.ok(form);

  try {
    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => assert.equal(requests, 1));
  } finally {
    // Always resolve the deliberately pending request. Otherwise a failed
    // assertion can leave React Query / the test runner waiting indefinitely.
    release();
  }

  await waitFor(() => {
    assert.ok(
      !screen.queryByRole("button", { name: "Tworzenie…" }),
      "pending mutation should settle after releasing the response",
    );
  });
});

for (const [role, destination] of [
  ["fan", "/fan"],
  ["support", "/support"],
  [null, "/"],
] as const) {
  test(`${role ?? "anonymous"} cannot open Experimental creation directly`, async () => {
    const { location } = renderExperimental(role);
    assert.equal(screen.queryByRole("heading", { name: "Nowy turniej" }), null);

    await waitFor(() => {
      assert.ok(
        location.history.includes(destination),
        `expected ${destination} in history, got ${JSON.stringify(location.history)}`,
      );
    });
  });
}
