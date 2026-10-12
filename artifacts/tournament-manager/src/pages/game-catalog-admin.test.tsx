import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import GameCatalogAdminPage from "./game-catalog-admin";

const BASE = "/ludology/game-classification";
const originalFetch = globalThis.fetch;

type MockGame = {
  id: number;
  steamAppId: number;
  name: string;
  steamUrl: string;
  headerImageUrl: null;
  developer: string;
  publisher: null;
  releaseDate: null;
  shortDescription: null;
  status: "unclassified" | "review" | "ready";
  classificationRevision: number;
  updatedAt: string;
  assignments: { termId: number; facet: string; slug: string; label: string; role: string; position: number }[];
};

const game = (id: number, name: string, status: MockGame["status"] = "unclassified"): MockGame => ({
  id,
  steamAppId: id + 1000,
  name,
  steamUrl: `https://store.steampowered.com/app/${id + 1000}`,
  headerImageUrl: null,
  developer: "Studio",
  publisher: null,
  releaseDate: null,
  shortDescription: null,
  status,
  classificationRevision: 1,
  updatedAt: "2026-10-11T00:00:00.000Z",
  assignments: [],
});

function mockCatalog(games: MockGame[], imported?: MockGame) {
  const requests: { path: string; method: string; adminKey: string | null }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const method = init?.method ?? "GET";
    requests.push({ path, method, adminKey: new Headers(init?.headers).get("x-steam-catalog-admin-token") });
    const parsed = new URL(path, "http://localhost");
    if (parsed.pathname === "/api/steam-catalog/games" && method === "GET") {
      const page = Number(parsed.searchParams.get("page") ?? "1");
      const pageSize = Number(parsed.searchParams.get("pageSize") ?? "25");
      const query = (parsed.searchParams.get("query") ?? "").trim().toLowerCase();
      const status = parsed.searchParams.get("status") ?? "all";
      const rawCursor = parsed.searchParams.get("cursor");
      if (rawCursor) {
        const decoded = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8")) as {
          page: number; query: string; status: string;
        };
        assert.deepEqual({ page: decoded.page, query: decoded.query, status: decoded.status }, { page, query, status });
      }
      const matches = games.filter((item) =>
        (status === "all" || item.status === status) &&
        (!query || [item.name, item.developer, item.publisher, String(item.steamAppId)]
          .filter(Boolean).some((part) => String(part).toLowerCase().includes(query))),
      ).sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id - b.id);
      return Response.json({
        games: matches.slice((page - 1) * pageSize, page * pageSize).map(({ assignments: _assignments, ...summary }) => summary),
        pagination: {
          page, pageSize, total: matches.length,
          totalPages: Math.max(1, Math.ceil(matches.length / pageSize)),
          nextCursor: page * pageSize < matches.length
            ? Buffer.from(JSON.stringify({ page: page + 1, query, status })).toString("base64url")
            : null,
        },
        counts: {
          all: games.length,
          unclassified: games.filter((item) => item.status === "unclassified").length,
          review: games.filter((item) => item.status === "review").length,
          ready: games.filter((item) => item.status === "ready").length,
        },
      });
    }
    if (parsed.pathname.startsWith("/api/steam-catalog/games/") && method === "GET") {
      const id = Number(parsed.pathname.split("/")[4]);
      const record = games.find((item) => item.id === id);
      return record ? Response.json({ game: record }) : Response.json({ error: "GAME_NOT_FOUND" }, { status: 404 });
    }
    if (parsed.pathname === "/api/steam-catalog/queue" && method === "GET") {
      const currentId = Number(parsed.searchParams.get("currentId") ?? "0");
      const current = games.find((item) => item.id === currentId);
      const pending = games.filter((item) => item.status !== "ready").sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id - b.id);
      const after = current ? pending.filter((item) => item.name.localeCompare(current.name, "pl") > 0 ||
        (item.name === current.name && item.id > current.id)) : pending;
      const next = [...after, ...pending].find((item) => item.id !== currentId);
      return Response.json({ pendingCount: pending.length, nextId: next?.id ?? null });
    }
    if (path === "/api/steam-catalog/taxonomy" && method === "GET") {
      return Response.json({ terms: [
        { id: 7, facet: "genre", slug: "akcja", label: "Akcja", active: true },
      ] });
    }
    if (path.startsWith("/api/steam-catalog/games/") && path.endsWith("/classification") && method === "PUT") {
      const id = Number(path.split("/")[4]);
      const changed = games.find((item) => item.id === id);
      assert.ok(changed, "classification request must target an existing game");
      const body = JSON.parse(String(init?.body));
      if (body.expectedRevision !== changed.classificationRevision) {
        return Response.json({
          error: "Inny redaktor zapisał nowszą klasyfikację tej gry.",
          code: "CLASSIFICATION_CONFLICT",
        }, { status: 409 });
      }
      changed.classificationRevision += 1;
      changed.status = body.status;
      changed.assignments = body.assignments.map((assignment: { termId: number; role: string; position: number }) => ({
        ...assignment, facet: "genre", slug: "akcja", label: "Akcja",
      }));
      changed.updatedAt = "2026-10-11T01:00:00.000Z";
      return Response.json({ ok: true });
    }
    if (path === "/api/steam-catalog/import" && method === "POST" && imported) {
      // API returns the raw Steam record without the classifications array.
      const { assignments: _assignments, ...steamRecord } = imported;
      const index = games.findIndex((item) => item.id === imported.id);
      if (index < 0) games.push(imported);
      else games[index] = imported;
      return Response.json({ game: steamRecord }, { status: 201 });
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  }) as typeof fetch;
  return requests;
}

function mount(path: string) {
  const location = memoryLocation({ path, record: true });
  render(<Router hook={location.hook}><GameCatalogAdminPage /></Router>);
  return location;
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
  globalThis.fetch = originalFetch;
});

test("importing a Steam game opens its editor immediately, without requiring a reload", async () => {
  const imported = game(42, "Nowa gra");
  const requests = mockCatalog([], imported);
  const location = mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });

  fireEvent.change(screen.getByPlaceholderText("Steam URL lub AppID"), {
    target: { value: String(imported.steamAppId) },
  });
  fireEvent.click(screen.getByRole("button", { name: /Importuj/i }));

  await waitFor(() => {
    assert.ok(location.history.includes(`${BASE}/games/42`));
    assert.ok(screen.getByRole("heading", { name: "Nowa gra", level: 1 }));
  });
  assert.equal(screen.queryByText("Nie znaleziono gry"), null);
  assert.equal(requests.filter((request) => request.path.endsWith("/import")).length, 1);
});

test("search-only screen skips blank catalog scans, then searches after typing", async () => {
  const requests = mockCatalog([game(1, "Alpha"), game(2, "Beta")]);
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  // Wait past the 200ms list-request debounce; a blank search is not a browse.
  await new Promise((resolve) => setTimeout(resolve, 275));
  assert.equal(requests.filter((request) => request.path.startsWith("/api/steam-catalog/games?")).length, 0);
  assert.ok(screen.getByText("Wpisz nazwę gry lub AppID."));
  fireEvent.change(screen.getByPlaceholderText("Nazwa, studio, AppID..."), {
    target: { value: "Alpha" },
  });
  await screen.findByRole("link", { name: /Alpha/i });
  assert.equal(requests.filter((request) => request.path.startsWith("/api/steam-catalog/games?")).length, 1);
  fireEvent.change(screen.getByPlaceholderText("Nazwa, studio, AppID..."), {
    target: { value: "   " },
  });
  await screen.findByText("Wpisz nazwę gry lub AppID.");
  await new Promise((resolve) => setTimeout(resolve, 275));
  assert.equal(requests.filter((request) => request.path.startsWith("/api/steam-catalog/games?")).length, 1);
});

test("Steam growth UI discovers candidate games, imports ten or fewer and stores progress", async () => {
  mockCatalog([]);
  const underlying = globalThis.fetch;
  const operations: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === "/api/steam-catalog/discover") {
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body, { cursor: 0, pageSize: 50 });
      operations.push("discovery");
      return Response.json({
        candidates: [{ appId: 570, name: "Dota 2" }, { appId: 730, name: "Counter-Strike 2" }],
        scanned: 3, alreadyInCatalog: 1, nextCursor: 730, hasMore: true,
      });
    }
    if (path === "/api/steam-catalog/import-batch") {
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.appIds, [570, 730]);
      operations.push("batch");
      return Response.json({
        requested: 2, processed: 2, inserted: 1, existing: 0, ignored: 1, failed: 0,
        aborted: false, rateLimited: false,
        results: [{ appId: 570, status: "inserted" }, { appId: 730, status: "not_game" }],
      });
    }
    return underlying(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.click(screen.getByRole("button", { name: /Pobierz propozycje ze Steam/ }));
  await screen.findByText("Dota 2");
  assert.ok(screen.getByText("Counter-Strike 2"));
  assert.equal(screen.getByTestId("steam-candidate-count").textContent, "2");
  fireEvent.click(screen.getByRole("button", { name: /Dodaj 10 gier z kolejki/ }));
  await screen.findByRole("status");
  await waitFor(() => {
    assert.equal(screen.getByTestId("steam-candidate-count").textContent, "0");
    const stored = JSON.parse(window.localStorage.getItem("steam-catalog-discovery-progress-v1") ?? "null");
    assert.equal(stored.cursor, 730);
    assert.deepEqual(stored.candidates, []);
  });
  assert.deepEqual(operations, ["discovery", "batch"]);
});

test("featured discovery imports the whole pending queue without calling keyed discovery", async () => {
  mockCatalog([]);
  const previousFetch = globalThis.fetch;
  const operations: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === "/api/steam-catalog/discover-featured") {
      operations.push("featured");
      return Response.json({
        candidates: [{ appId: 570, name: "Dota 2" }, { appId: 730, name: "Counter-Strike 2" }],
        scanned: 3, alreadyInCatalog: 1,
      });
    }
    if (path === "/api/steam-catalog/discover") {
      throw new Error("Keyed Steam discovery must not be called by queue-only mode");
    }
    if (path === "/api/steam-catalog/import-batch") {
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.appIds, [570, 730]);
      operations.push("batch");
      return Response.json({
        requested: 2, processed: 2, inserted: 2, existing: 0,
        ignored: 0, failed: 0, aborted: false, rateLimited: false,
        results: [
          { appId: 570, status: "inserted" },
          { appId: 730, status: "inserted" },
        ],
      });
    }
    return previousFetch(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.click(screen.getByRole("button", { name: /Pobierz nowości i popularne/i }));
  await screen.findByText("Dota 2");
  assert.equal(screen.getByTestId("steam-candidate-count").textContent, "2");
  fireEvent.click(screen.getByRole("button", { name: /Przetwórz kolejkę/i }));
  await waitFor(() => {
    assert.equal(screen.getByTestId("steam-candidate-count").textContent, "0");
    assert.equal(screen.getByTestId("steam-imported-total").textContent, "2");
  });
  const stored = JSON.parse(window.localStorage.getItem("steam-catalog-discovery-progress-v1") ?? "null");
  assert.equal(stored.stats.inserted, 2);
  assert.equal(stored.stats.scanned, 3);
  assert.equal(stored.cursor, 0);
  assert.deepEqual(operations, ["featured", "batch"]);
});

test("pasted Steam AppIDs queue without Steam discovery API credentials", async () => {
  mockCatalog([]);
  const underlying = globalThis.fetch;
  const batches: number[][] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === "/api/steam-catalog/import-batch") {
      const parsed = JSON.parse(String(init?.body));
      batches.push(parsed.appIds);
      return Response.json({
        requested: parsed.appIds.length, processed: parsed.appIds.length,
        inserted: parsed.appIds.length, existing: 0, ignored: 0, failed: 0,
        rateLimited: false, aborted: false,
        results: parsed.appIds.map((appId: number) => ({ appId, status: "inserted" })),
      });
    }
    return underlying(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.change(screen.getByLabelText(/Masz listę AppID/), {
    target: { value: "570, 730\nhttps://store.steampowered.com/app/620/" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Dodaj AppID do kolejki/ }));
  await screen.findByText("Steam AppID 570");
  assert.ok(screen.getByText("Steam AppID 730"));
  assert.ok(screen.getByText("Steam AppID 620"));
  fireEvent.click(screen.getByRole("button", { name: /Dodaj 10 gier z kolejki/ }));
  await waitFor(() => assert.deepEqual(batches, [[570, 730, 620]]));
  await waitFor(() => assert.equal(screen.getByTestId("steam-candidate-count").textContent, "0"));
});

test("automatic Steam import processes queued AppIDs in consecutive batches and saves statistics", async () => {
  const queued = Array.from({ length: 13 }, (_, i) => ({ appId: 2000 + i, name: `Game ${i}` }));
  window.localStorage.setItem("steam-catalog-discovery-progress-v1", JSON.stringify({
    cursor: 2012, hasMore: false, candidates: queued,
  }));
  mockCatalog([]);
  const underlying = globalThis.fetch;
  const requests: number[][] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === "/api/steam-catalog/import-batch") {
      const ids = JSON.parse(String(init?.body)).appIds as number[];
      requests.push(ids);
      return Response.json({
        requested: ids.length, processed: ids.length, inserted: ids.length,
        existing: 0, ignored: 0, failed: 0, rateLimited: false, aborted: false,
        results: ids.map((appId) => ({ appId, status: "inserted" })),
      });
    }
    return underlying(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.click(screen.getByRole("button", { name: /Uruchom serię \(do 100 AppID\)/ }));
  await waitFor(() => assert.equal(screen.getByTestId("steam-imported-total").textContent, "13"));
  assert.deepEqual(requests.map((ids) => ids.length), [10, 3]);
  assert.equal(screen.getByTestId("steam-candidate-count").textContent, "0");
  const stored = JSON.parse(window.localStorage.getItem("steam-catalog-discovery-progress-v1") ?? "null");
  assert.equal(stored.stats.inserted, 13);
  assert.equal(stored.stats.batches, 2);
  assert.equal(stored.cursor, 2012);
});

test("automatic Steam import can pause after a currently executing batch", async () => {
  const queued = Array.from({ length: 15 }, (_, i) => ({ appId: 3000 + i, name: `Queued ${i}` }));
  window.localStorage.setItem("steam-catalog-discovery-progress-v1", JSON.stringify({
    cursor: 3014, hasMore: false, candidates: queued,
  }));
  mockCatalog([]);
  const underlying = globalThis.fetch;
  let resolveBatch!: (value: Response) => void;
  let calls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === "/api/steam-catalog/import-batch") {
      calls++;
      const ids = JSON.parse(String(init?.body)).appIds as number[];
      return new Promise<Response>((resolve) => {
        resolveBatch = resolve;
        // Called once; control when the in-flight request finishes.
        assert.equal(ids.length, 10);
      });
    }
    return underlying(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.click(screen.getByRole("button", { name: /Uruchom serię \(do 100 AppID\)/ }));
  const stop = await screen.findByRole("button", { name: /Zatrzymaj po bieżącej partii/ });
  await waitFor(() => assert.equal(calls, 1));
  fireEvent.click(stop);
  resolveBatch(Response.json({
    requested: 10, processed: 10, inserted: 10, existing: 0, ignored: 0,
    failed: 0, rateLimited: false, aborted: false,
    results: queued.slice(0, 10).map(({ appId }) => ({ appId, status: "inserted" })),
  }));
  await waitFor(() => assert.equal(screen.getByTestId("steam-candidate-count").textContent, "5"));
  assert.equal(screen.getByTestId("steam-imported-total").textContent, "10");
  assert.equal(calls, 1);
});

test("persistent Steam import task can start, pause, resume and show server counts", async () => {
  window.sessionStorage.setItem("tm_steam_catalog_admin_token", "integration-test-admin");
  mockCatalog([]);
  const underlying = globalThis.fetch;
  let status = "running";
  const paths: string[] = [];
  const job = () => ({
    id: "7", status, cursor: 123, pending: 4, hasMore: true,
    maxGames: 1500, processed: 20, inserted: 11, existing: 5,
    ignored: 4, failed: 0, scanned: 80, pauseRequested: false, lastError: null,
  });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("/api/steam-catalog/import-job")) {
      assert.equal(new Headers(init?.headers).get("x-steam-catalog-admin-token"), "integration-test-admin");
      paths.push(url);
      if (url.endsWith("/pause")) status = "paused";
      if (url.endsWith("/resume")) status = "running";
      if (init?.method === "POST" && url === "/api/steam-catalog/import-job") {
        assert.deepEqual(JSON.parse(String(init.body)), { maxGames: 1500 });
        return Response.json({ job: job() }, { status: 201 });
      }
      return Response.json({ job: job() });
    }
    return underlying(input, init);
  }) as typeof fetch;
  mount(`${BASE}/search`);
  await screen.findByRole("heading", { name: "Szukaj gry" });
  fireEvent.change(screen.getByLabelText("Maks. sprawdzonych AppID"), { target: { value: "1500" } });
  fireEvent.click(screen.getByRole("button", { name: "Uruchom zadanie serwerowe" }));
  await waitFor(() => assert.equal(screen.getByTestId("steam-server-inserted").textContent, "11"));
  fireEvent.click(screen.getByRole("button", { name: "Wstrzymaj zadanie serwerowe" }));
  await waitFor(() => assert.equal(screen.getByTestId("steam-server-job-status").textContent, "paused"));
  fireEvent.click(screen.getByRole("button", { name: "Wznów zadanie serwerowe" }));
  await waitFor(() => assert.equal(screen.getByTestId("steam-server-job-status").textContent, "running"));
  fireEvent.click(screen.getByRole("button", { name: /Odśwież stan zadania/ }));
  await waitFor(() => assert.equal(paths.length, 4));
});

test("catalog filters games by classification status and title", async () => {
  mockCatalog([game(1, "Alpha", "ready"), game(2, "Beta", "review"), game(3, "Gamma")]);
  mount(`${BASE}/games`);
  await screen.findByRole("link", { name: /Alpha/i });

  assert.equal(screen.getAllByRole("link", { name: /Alpha|Beta|Gamma/i }).length, 3);
  fireEvent.click(screen.getByRole("button", { name: "Do sprawdzenia (1)" }));
  await screen.findByRole("link", { name: /Beta/i });
  assert.equal(screen.queryByRole("link", { name: /Alpha/i }), null);

  fireEvent.click(screen.getByRole("button", { name: "Wszystkie (3)" }));
  fireEvent.change(screen.getByPlaceholderText("Szukaj w katalogu..."), {
    target: { value: "gamma" },
  });
  await screen.findByRole("link", { name: /Gamma/i });
  assert.equal(screen.queryByRole("link", { name: /Beta/i }), null);
});

test("the classification editor marks unsaved changes and can restore persisted choices", async () => {
  mockCatalog([game(12, "Test gry")]);
  mount(`${BASE}/games/12`);
  const save = await screen.findByRole("button", { name: "Zapisz" });
  await waitFor(() => assert.equal(save.hasAttribute("disabled"), true));

  fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
  await waitFor(() => assert.ok(screen.getByRole("status", { name: "" })));
  assert.equal(save.hasAttribute("disabled"), false);

  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);

  fireEvent.click(screen.getByRole("button", { name: "Przywróć" }));
  await waitFor(() => assert.equal(save.hasAttribute("disabled"), true));
  assert.equal(screen.queryByText("Niezapisane zmiany"), null);
});

test("saving a classification advances to the next pending game", async () => {
  const requests = mockCatalog([game(1, "Alpha"), game(2, "Beta")]);
  const location = mount(`${BASE}/games/1`);
  await screen.findByRole("button", { name: "Akcja" });
  fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
  fireEvent.click(screen.getByRole("button", { name: /Zapisz i dalej/i }));

  await waitFor(() => {
    assert.ok(location.history.includes(`${BASE}/games/2`));
    assert.ok(screen.getByRole("heading", { name: "Beta", level: 1 }));
  });
  assert.equal(requests.filter((request) => request.method === "PUT").length, 1);
});

test("internal links respect an unsaved classification guard", async () => {
  const originalConfirm = window.confirm;
  const calls: string[] = [];
  window.confirm = (message?: string) => {
    calls.push(String(message));
    return false;
  };
  try {
    mockCatalog([game(1, "Alpha")]);
    const location = mount(`${BASE}/games/1`);
    await screen.findByRole("button", { name: "Akcja" });
    fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
    fireEvent.click(screen.getByRole("link", { name: /Wszystkie gry/i }));
    assert.equal(location.history.at(-1), `${BASE}/games/1`);
    assert.equal(calls.length, 1);

    window.confirm = () => true;
    fireEvent.click(screen.getByRole("link", { name: /Wszystkie gry/i }));
    await waitFor(() => assert.equal(location.history.at(-1), `${BASE}/games`));
  } finally {
    window.confirm = originalConfirm;
  }
});

test("a rejected save preserves the current draft and does not advance the queue", async () => {
  mockCatalog([game(1, "Alpha"), game(2, "Beta")]);
  const baseFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PUT") return Response.json({ error: "Zapis odrzucony" }, { status: 503 });
    return baseFetch(input, init);
  }) as typeof fetch;

  const location = mount(`${BASE}/games/1`);
  await screen.findByRole("button", { name: "Akcja" });
  fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
  fireEvent.click(screen.getByRole("button", { name: /Zapisz i dalej/i }));

  await screen.findByText("Zapis odrzucony");
  assert.equal(location.history.at(-1), `${BASE}/games/1`);
  assert.ok(screen.getByText("Niezapisane zmiany"));
  assert.equal(screen.getByRole("button", { name: /Zapisz i dalej/i }).hasAttribute("disabled"), false);
});

test("an incomplete classification cannot be marked ready on the client", async () => {
  const requests = mockCatalog([game(9, "Niekompletna")]);
  mount(`${BASE}/games/9`);
  const status = await screen.findByRole("combobox", { name: "Status klasyfikacji" });
  fireEvent.change(status, { target: { value: "ready" } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
  await screen.findByText(/Brakuje wymaganych elementów/i);
  assert.equal(requests.filter((request) => request.method === "PUT").length, 0);
  assert.ok(screen.getByRole("alert").textContent?.includes("Status Gotowe wymaga"));
});

test("taxonomy search finds diacritic-insensitive labels in the active perspective", async () => {
  mockCatalog([game(12, "Test gry")]);
  mount(`${BASE}/games/12`);
  await screen.findByRole("button", { name: "Akcja" });
  fireEvent.change(screen.getByPlaceholderText("Szukaj pojęć w słowniku..."), {
    target: { value: "akcja" },
  });
  assert.ok(screen.getByRole("button", { name: "Akcja" }));
  fireEvent.change(screen.getByPlaceholderText("Szukaj pojęć w słowniku..."), {
    target: { value: "nieistniejaca" },
  });
  assert.equal(screen.queryByRole("button", { name: "Akcja" }), null);
});

test("catalog loads only a page of 25 games, then requests page two", async () => {
  const records = Array.from({ length: 31 }, (_, index) => game(index + 1, `Gra ${String(index + 1).padStart(2, "0")}`));
  const requests = mockCatalog(records);
  mount(`${BASE}/games`);
  await screen.findByRole("link", { name: /Gra 01/i });
  assert.equal(screen.getAllByRole("link", { name: /Gra \d+/i }).length, 25);

  fireEvent.click(screen.getByRole("button", { name: "Następna" }));
  await screen.findByRole("link", { name: /Gra 26/i });
  assert.equal(screen.queryByRole("link", { name: /Gra 01/i }), null);
  assert.ok(requests.some((request) => request.path.includes("page=2") && request.path.includes("cursor=")));
});

test("a deep linked game is fetched by ID without first fetching every catalog row", async () => {
  const requests = mockCatalog([game(77, "Bezpośredni rekord")]);
  mount(`${BASE}/games/77`);
  await screen.findByRole("heading", { name: "Bezpośredni rekord", level: 1 });
  assert.ok(requests.some((request) => request.path === "/api/steam-catalog/games/77"));
  assert.equal(requests.filter((request) => request.path.includes("/steam-catalog/games?")).length, 0);
});

test("catalog reads never transmit editor credentials, but classification writes do", async () => {
  window.sessionStorage.setItem("tm_steam_catalog_admin_token", "test-only-catalog-editor-key");
  const requests = mockCatalog([game(11, "Zasoby")]);
  mount(`${BASE}/games/11`);
  await screen.findByRole("button", { name: "Akcja" });
  assert.ok(requests.filter((item) => item.method === "GET").every((item) => item.adminKey === null));

  fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
  fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
  await waitFor(() => assert.equal(requests.filter((item) => item.method === "PUT").length, 1));
  assert.equal(requests.find((item) => item.method === "PUT")?.adminKey, "test-only-catalog-editor-key");
});

test("stale editor changes are retained after 409 until confirmed reload", async () => {
  const record = game(60, "Kolizja edycji");
  const requests = mockCatalog([record]);
  const location = mount(`${BASE}/games/60`);
  await screen.findByRole("button", { name: "Akcja" });
  fireEvent.click(screen.getByRole("button", { name: "Akcja" }));
  await screen.findByText("Niezapisane zmiany");
  record.classificationRevision = 2; // Another editor saved since this page loaded.
  record.status = "review";

  fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
  await screen.findByText(/Konflikt edycji: zapisano nowszą wersję klasyfikacji/);
  assert.equal(requests.filter((item) => item.method === "PUT").length, 1);
  assert.equal(location.history.at(-1), `${BASE}/games/60`);
  assert.ok(screen.getByText("Niezapisane zmiany"));
  assert.equal(screen.getByRole("button", { name: "Zapisz" }).hasAttribute("disabled"), true);

  const priorConfirm = window.confirm;
  try {
    window.confirm = () => true;
    fireEvent.click(screen.getByRole("button", { name: /Wczytaj aktualną wersję/i }));
    // The mocked GET resolves immediately; avoid a MutationObserver-driven
    // waitFor loop across the guard teardown and editor rehydration.
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
    assert.equal(screen.queryByText("Niezapisane zmiany"), null);
    assert.equal(screen.queryByText(/Konflikt edycji: zapisano nowszą wersję klasyfikacji/), null);
    assert.equal((screen.getByRole("combobox", { name: "Status klasyfikacji" }) as HTMLSelectElement).value, "review");
  } finally {
    window.confirm = priorConfirm;
  }
});

test("changing filters discards a cursor from the previous listing", async () => {
  const records = Array.from({ length: 40 }, (_, i) => game(i + 1, "List " + String(i + 1).padStart(2, "0")));
  const requests = mockCatalog(records);
  mount(`${BASE}/games`);
  await screen.findByRole("link", { name: /List 01/i });
  fireEvent.click(screen.getByRole("button", { name: "Następna" }));
  await screen.findByRole("link", { name: /List 26/i });
  const before = requests.length;
  fireEvent.change(screen.getByPlaceholderText("Szukaj w katalogu..."), { target: { value: "List 01" } });
  await waitFor(() => assert.ok(requests.length > before));
  const latest = requests.at(-1)!;
  assert.ok(latest.path.includes("page=1"));
  assert.ok(!latest.path.includes("cursor="));
  assert.ok(screen.getByRole("link", { name: /List 01/i }));
});

