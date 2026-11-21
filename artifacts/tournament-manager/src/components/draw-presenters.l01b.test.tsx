// #324-L01-B · every presenter shows exactly the stored result; choosing a presenter never touches the draw;
// "Pokaż wynik od razu" ends the animation without losing the result.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DRAW_PRESENTERS, DrawPresenter, TOURNAMENT_PRESENTERS, presenterPool, scanSchedule, type PresenterFrame } from "@/components/draw-presenters";
import { SeedingCeremony } from "@/components/seeding-ceremony";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; try { localStorage.clear(); } catch { /* */ } });

const frame = (over: Partial<PresenterFrame> = {}): PresenterFrame =>
  ({ pool: ["Seed 1", "Seed 2", "Seed 3", "Seed 4"], target: "Seed 3", subject: "Ala", running: false, durationMs: 0, drawKey: 1, ...over });

test("L01-B: every presenter ends on the same stored result (one source of truth, many renderers)", () => {
  for (const presenter of DRAW_PRESENTERS) {
    const { container } = render(<DrawPresenter id={presenter.id} frame={frame()} />);
    assert.equal(screen.getByTestId("draw-presenter-result").textContent, "Ala: Seed 3", presenter.id);
    assert.ok((container.textContent ?? "").includes("Seed 3"), `${presenter.id} shows the result`);
    cleanup();
  }
  assert.deepEqual(presenterPool(Array.from({ length: 40 }, (_, i) => `R${i}`), "R39", 16).slice(-1), ["R39"], "the target is always in the shown pool");
  const times = scanSchedule(6, 4, 3000);
  assert.equal(times.length, 6 * 2 + 4 + 1);
  assert.equal((times.length - 1) % 6, 4, "the scan's last step is the stored result");
  assert.ok(Math.abs(times.at(-1)! - 3000) < 1e-6);
  assert.deepEqual(TOURNAMENT_PRESENTERS.map((p) => p.id), ["kolo", "szybko", "karty", "automat", "skan"], "TESTED ones stay in the Laboratory");
});

test("L01-B: while running the result is not announced; reduced-motion-free fast presenter shows it at once", () => {
  render(<DrawPresenter id="karty" frame={frame({ running: true, durationMs: 4000 })} />);
  assert.equal(screen.getByTestId("draw-presenter-result").textContent, "");
  cleanup();
  render(<DrawPresenter id="szybko" frame={frame({ running: true, durationMs: 4000 })} />);
  assert.equal(screen.getByTestId("draw-presenter-result").textContent, "Ala: Seed 3", "fast reveal never waits");
});

const draw = (n: number, name: string, seed: number) => ({ drawNumber: n, participantKey: `p${n}`, playerId: n, playerName: name, seed, placement: { kind: "standings", label: `Pozycja ${seed}`, position: seed } });
const ceremony = (revealed: number) => ({
  kind: "seeding_ceremony_v1", version: 1, stageId: 3, status: revealed === 0 ? "prepared" : revealed === 3 ? "completed" : "in_progress", drawMode: "seed",
  entrySeedingPolicy: "random", placementPolicy: "standings_order", resultSeedingPolicy: "standings_order", revealOrder: "sequential", randomSeed: "k",
  placementRandomSeed: null, participantSignature: "a", configurationSignature: "b", participantOrder: ["p1", "p2", "p3"],
  draws: [draw(1, "Ala", 2), draw(2, "Bartek", 3), draw(3, "Celina", 1)], revealedCount: revealed,
  preparedAt: "2026-11-21T10:00:00Z", updatedAt: "2026-11-21T10:00:00Z", completedAt: null, appliedAt: null,
});

test("L01-B ceremony: the presenter is a local choice; a reveal sends the count seen; 'Pokaż wynik od razu' keeps the stored result", async () => {
  let revealed = 0;
  const posts: { url: string; body: unknown }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      posts.push({ url, body: init.body ? JSON.parse(String(init.body)) : null });
      if (url.endsWith("/reveal-next")) revealed += 1;
    }
    return new Response(JSON.stringify({ ceremony: ceremony(revealed) }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const stage = { id: 3, tournamentId: 7, name: "Etap 1", status: "planned", entrySeedingPolicy: "random", seedingPolicy: "standings_order", randomRevealOrder: "sequential" } as never;
  render(<SeedingCeremony tournamentId={7} stage={stage} canManage />);
  const select = await screen.findByRole("combobox", { name: "Prezentacja losowania" }) as HTMLSelectElement;
  fireEvent.change(select, { target: { value: "karty" } });
  assert.equal(posts.length, 0, "changing the presentation sends nothing");
  assert.equal(localStorage.getItem("seeding-ceremony-presenter-v1"), "karty");
  fireEvent.click(screen.getByRole("button", { name: /Losuj następnego/ }));
  const now = await screen.findByTestId("ceremony-show-now");
  assert.deepEqual(posts[0].body, { expectedRevealedCount: 0 });
  fireEvent.click(now);
  await waitFor(() => assert.equal(screen.getByTestId("draw-presenter-result").textContent, "Ala: Seed 2"));
  assert.equal(screen.queryByTestId("ceremony-show-now"), null);
  assert.equal(posts.length, 1, "skipping the animation does not ask the server again");
});
