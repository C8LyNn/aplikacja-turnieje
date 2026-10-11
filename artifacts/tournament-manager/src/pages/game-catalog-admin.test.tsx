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
  updatedAt: "2026-10-11T00:00:00.000Z",
  assignments: [],
});

function mockCatalog(games: MockGame[], imported?: MockGame) {
  const requests: { path: string; method: string }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const method = init?.method ?? "GET";
    requests.push({ path, method });
    const parsed = new URL(path, "http://localhost");
    if (parsed.pathname === "/api/steam-catalog/games" && method === "GET") {
      const page = Number(parsed.searchParams.get("page") ?? "1");
      const pageSize = Number(parsed.searchParams.get("pageSize") ?? "25");
      const query = (parsed.searchParams.get("query") ?? "").trim().toLowerCase();
      const status = parsed.searchParams.get("status") ?? "all";
      const matches = games.filter((item) =>
        (status === "all" || item.status === status) &&
        (!query || [item.name, item.developer, item.publisher, String(item.steamAppId)]
          .filter(Boolean).some((part) => String(part).toLowerCase().includes(query))),
      ).sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id - b.id);
      return Response.json({
        games: matches.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, total: matches.length, totalPages: Math.max(1, Math.ceil(matches.length / pageSize)) },
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
    assert.ok(screen.getByRole("heading", { name: "Nowa gra" }));
  });
  assert.equal(screen.queryByText("Nie znaleziono gry"), null);
  assert.equal(requests.filter((request) => request.path.endsWith("/import")).length, 1);
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
    assert.ok(screen.getByRole("heading", { name: "Beta" }));
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
  assert.ok(requests.some((request) => request.path.includes("page=2")));
});

test("a deep linked game is fetched by ID without first fetching every catalog row", async () => {
  const requests = mockCatalog([game(77, "Bezpośredni rekord")]);
  mount(`${BASE}/games/77`);
  await screen.findByRole("heading", { name: "Bezpośredni rekord" });
  assert.ok(requests.some((request) => request.path === "/api/steam-catalog/games/77"));
  assert.equal(requests.filter((request) => request.path.includes("/steam-catalog/games?")).length, 0);
});
