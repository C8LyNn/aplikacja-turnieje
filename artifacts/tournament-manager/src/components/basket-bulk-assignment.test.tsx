import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Player, StageBasket, TournamentStage } from "@workspace/api-client-react";
import { BasketBulkAssignment } from "./basket-bulk-assignment";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { StageBasketsPanel } from "./stage-baskets-panel";
import { checkStageBaskets, planBasketMove } from "@/lib/basket-bulk-assignment";

afterEach(() => cleanup());

const label = (basket: StageBasket) => `Start ${"ABCD"[basket.ordinal - 1]}`;
const basket = (id: string, ordinal: number, participantIds: number[], stageId = 1, type: "input" | "output" = "input"): StageBasket =>
  ({ id, stageId, type, ordinal, order: ordinal, colorId: null, participantIds, qualifierCount: type === "output" ? 2 : null });
const players: Player[] = ["Ada", "Bartek", "Celina", "Darek", "Ewa", "Łucja", "Gosia", "Hubert"].map((name, i) =>
  ({ id: i + 1, tournamentId: 5, name, createdAt: "2026-11-18T10:00:00Z" }));
const groups = { id: 1, position: 1, name: "Faza grupowa", format: "group_stage", participantCount: 8, groupCount: 2, participantsPerGroup: 4, status: "planned" } as TournamentStage;
const playoff = { id: 2, position: 2, name: "Play-off", format: "single_elimination", participantCount: 4, status: "planned" } as TournamentStage;

test("planBasketMove moves several participants at once, keeps one start basket per stage and leaves other stages alone", () => {
  const baskets = [basket("a", 1, [1, 2]), basket("b", 2, [3]), basket("out", 1, [], 1, "output"), basket("p", 1, [1], 2)];
  const { baskets: next, moves } = planBasketMove(baskets, 1, [1, 3, 4], "b");
  assert.deepEqual(moves, [{ playerId: 1, from: "a", to: "b" }, { playerId: 4, from: null, to: "b" }]);
  assert.deepEqual(next.find((b) => b.id === "a")!.participantIds, [2]);
  assert.deepEqual(next.find((b) => b.id === "b")!.participantIds, [3, 1, 4]);
  assert.equal(next.find((b) => b.id === "out"), baskets[2], "output baskets are untouched");
  assert.equal(next.find((b) => b.id === "p"), baskets[3], "another stage keeps its own assignment");
  const removed = planBasketMove(next, 1, [2], null);
  assert.deepEqual(removed.moves, [{ playerId: 2, from: "a", to: null }]);
  assert.deepEqual(removed.baskets.find((b) => b.id === "a")!.participantIds, []);
  assert.deepEqual(planBasketMove(baskets, 1, [1], "unknown").moves, [], "a basket of another stage is not a target");
});

test("checkStageBaskets reports the counts the start checks and who would not play", () => {
  const base = { stage: groups, players, incomingQuota: 0, firstStage: true, labelOf: label };
  assert.deepEqual(checkStageBaskets({ ...base, baskets: [basket("a", 1, [1, 2, 3, 4]), basket("b", 2, [5, 6, 7, 8])] }), []);
  const short = checkStageBaskets({ ...base, baskets: [basket("a", 1, [1, 2, 3, 4]), basket("b", 2, [5])] });
  assert.ok(short.some((check) => check.level === "blocker" && /2 grupy po 4: od 7 do 8 uczestników — w koszykach będzie 5/.test(check.message)));
  assert.ok(short.some((check) => check.level === "blocker" && /zaplanowany na 8.*będzie 5 — brakuje 3/.test(check.message)));
  assert.ok(short.some((check) => check.level === "warning" && /Bez koszyka \(nie zagrają w tym etapie\): 3 — Celina|Bez koszyka.*: 3 — Łucja, Gosia, Hubert/.test(check.message)));
  const empty = checkStageBaskets({ ...base, baskets: [basket("a", 1, [1, 2, 3, 4, 5, 6, 7, 8]), basket("b", 2, [])] });
  assert.deepEqual(empty.map((check) => check.message), ["Start B będzie pusty."]);
  const routed = checkStageBaskets({ ...base, stage: playoff, firstStage: false, incomingQuota: 4, baskets: [basket("p", 1, [], 2)] });
  assert.deepEqual(routed, [], "arrivals from the previous stage count towards the plan");
});

function Harness({ initial }: { initial: StageBasket[] }) {
  const [baskets, setBaskets] = useState(initial);
  return (
    <>
      <BasketBulkAssignment stages={[groups, playoff]} baskets={baskets} players={players} incomingQuotaByStage={new Map([[2, 4]])} labelOf={label} onApply={setBaskets} />
      <div data-testid="state">{JSON.stringify(baskets.map((b) => [b.id, b.participantIds]))}</div>
    </>
  );
}

test("select several with the keyboard, preview the move with counts and checks, apply to the draft, undo", async () => {
  const user = userEvent.setup();
  render(<Harness initial={[basket("a", 1, [1, 2, 3, 4]), basket("b", 2, []), basket("p", 1, [], 2)]} />);
  const list = screen.getByRole("list", { name: "Uczestnicy etapu Faza grupowa" });
  assert.equal(within(list).getAllByRole("checkbox").length, 8);
  assert.ok(screen.getByRole("button", { name: "Bez koszyka: 4" }));
  assert.ok(screen.getByText(/Bez koszyka \(nie zagrają w tym etapie\): 4/));

  await user.click(screen.getByRole("button", { name: "Bez koszyka: 4" }));
  assert.equal(within(list).getAllByRole("checkbox").length, 4);
  within(list).getAllByRole("checkbox")[0].focus();
  await user.keyboard(" ");
  assert.ok(screen.getByText("Zaznaczono: 1"), "a checkbox is toggled with the keyboard");
  await user.click(screen.getByRole("button", { name: "Zaznacz widocznych (4)" }));
  assert.ok(screen.getByText("Zaznaczono: 4"));
  await user.selectOptions(screen.getByRole("combobox", { name: "Przenieś zaznaczonych do" }), "b");
  await user.click(screen.getByRole("button", { name: /Pokaż zmiany/ }));

  const preview = screen.getByRole("region", { name: "Podgląd zmian" });
  assert.match(preview.textContent ?? "", /Zmiana dla 4 uczestników/);
  assert.ok(within(preview).getByText("Łucja: bez koszyka → Start B"));
  assert.ok(within(preview).getByText("Start B: 0 → 4"));
  assert.ok(within(preview).getByText("Po zmianie liczby zgadzają się z planem etapu."));
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4]], ["b", []], ["p", []]]), "nothing changes before applying");

  await user.click(within(preview).getByRole("button", { name: "Zastosuj w szkicu" }));
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4]], ["b", [5, 6, 7, 8]], ["p", []]]));
  assert.match(screen.getByRole("status").textContent ?? "", /Przeniesiono do Start B: 4\. Zmiana jest w szkicu/);

  await user.click(screen.getByRole("button", { name: /Cofnij ostatnią zmianę/ }));
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4]], ["b", []], ["p", []]]));
  assert.match(screen.getByRole("status").textContent ?? "", /Cofnięto/);
});

test("search ignores Polish letters; moving a whole basket out warns before it is applied", async () => {
  const user = userEvent.setup();
  render(<Harness initial={[basket("a", 1, [1, 2, 3, 4]), basket("b", 2, [5, 6, 7, 8]), basket("p", 1, [], 2)]} />);
  await user.type(screen.getByRole("searchbox", { name: "Szukaj uczestnika" }), "lucja");
  const list = screen.getByRole("list", { name: "Uczestnicy etapu Faza grupowa" });
  assert.deepEqual(within(list).getAllByRole("checkbox").map((box) => box.closest("label")?.textContent), ["ŁucjaStart B"]);
  await user.clear(screen.getByRole("searchbox", { name: "Szukaj uczestnika" }));
  await user.click(screen.getByRole("button", { name: "Start A: 4" }));
  await user.click(screen.getByRole("button", { name: "Zaznacz widocznych (4)" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Przenieś zaznaczonych do" }), "b");
  await user.click(screen.getByRole("button", { name: /Pokaż zmiany/ }));
  const preview = screen.getByRole("region", { name: "Podgląd zmian" });
  assert.ok(within(preview).getByText("Start A będzie pusty."));
  assert.ok(within(preview).getByText(/2 grupy po 4: od 7 do 8 uczestników — w koszykach będzie 8|Start A będzie pusty/));
  await user.click(within(preview).getByRole("button", { name: "Wróć do wyboru" }));
  assert.equal(screen.queryByRole("region", { name: "Podgląd zmian" }), null);
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4]], ["b", [5, 6, 7, 8]], ["p", []]]));
});

// ─── wiring in the baskets panel: the bulk move reaches the same save as every other basket edit ─────────────

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const panelStages = [
  { id: 1, tournamentId: 42, stageKey: "s1", position: 1, name: "Eliminacje", format: "swiss", status: "planned", participantCount: 4, bestOf: 1,
    rankingPolicy: "swiss_points_v1", qualificationMode: "none", seedingPolicy: "standings_order", entrySeedingPolicy: "preserve",
    resultSeedingPolicy: "standings_order", randomRevealOrder: "none", version: 1, createdAt: "2026-01-01T00:00:00Z" },
];
const panelBaskets = { tournamentId: 42, legacyDefaulted: false, flowAuthority: "basket_v1", routes: [], validation: { valid: true, problems: [] },
  baskets: [basket("s1in1", 1, [1, 2]), basket("s1in2", 2, [3, 4]), { ...basket("s1out1", 1, [], 1, "output") }] };
const panelPlayers = ["Gracz Alfa", "Gracz Beta", "Gracz Gamma", "Gracz Delta"].map((name, i) => ({ id: i + 1, tournamentId: 42, name, createdAt: "2026-01-01T00:00:00Z" }));

function renderPanel(status = "draft") {
  const puts: unknown[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (init?.method === "PUT") { puts.push(JSON.parse(String(init.body))); return new Response(JSON.stringify(panelBaskets), { status: 200, headers: { "content-type": "application/json" } }); }
    const body = url.includes("stage-baskets") ? panelBaskets : url.includes("/stages") ? panelStages : url.includes("/players") ? panelPlayers : null;
    return new Response(JSON.stringify(body ?? { error: "not mocked" }), { status: body ? 200 : 404, headers: { "content-type": "application/json" } });
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const view = render(<QueryClientProvider client={client}><Router hook={memoryLocation({ path: "/tournaments/42" }).hook}>
    <StageBasketsPanel tournamentId={42} tournamentStatus={status} orgToken="tok" />
  </Router></QueryClientProvider>);
  return { puts, client, view };
}

test("baskets panel: the bulk section appears only while editing and its move is saved with the configuration", async () => {
  const user = userEvent.setup();
  const { puts, client } = renderPanel();
  await user.click(await screen.findByTestId("enter-advanced-btn"));
  const section = screen.getByTestId("basket-bulk");
  await user.click(within(section).getByRole("button", { name: "Start B: 2" }));
  await user.click(within(section).getByRole("button", { name: "Zaznacz widocznych (2)" }));
  await user.selectOptions(within(section).getByRole("combobox", { name: "Przenieś zaznaczonych do" }), "s1in1");
  await user.click(within(section).getByRole("button", { name: /Pokaż zmiany/ }));
  await user.click(within(section).getByRole("button", { name: "Zastosuj w szkicu" }));
  assert.equal(puts.length, 0, "applying only changes the draft");
  await user.click(screen.getByTestId("save-baskets-btn"));
  await screen.findByTestId("enter-advanced-btn");
  const saved = puts[0] as { baskets: StageBasket[] };
  assert.deepEqual(saved.baskets.find((b) => b.id === "s1in1")!.participantIds, [1, 2, 3, 4]);
  assert.deepEqual(saved.baskets.find((b) => b.id === "s1in2")!.participantIds, []);
  client.clear();
});

test("baskets panel: no bulk section outside editing or after the start", async () => {
  const first = renderPanel();
  await screen.findByTestId("enter-advanced-btn");
  assert.equal(screen.queryByTestId("basket-bulk"), null);
  first.client.clear(); cleanup();
  const locked = renderPanel("in_progress");
  await screen.findByTestId("baskets-locked-banner");
  assert.equal(screen.queryByTestId("enter-advanced-btn"), null);
  assert.equal(screen.queryByTestId("basket-bulk"), null);
  locked.client.clear();
});

test("a new start basket can be the target: it appears in the preview and in the draft only after applying", async () => {
  const user = userEvent.setup();
  function WithFactory() {
    const [baskets, setBaskets] = useState([basket("a", 1, [1, 2, 3, 4, 5, 6, 7, 8]), basket("p", 1, [], 2)]);
    return (
      <>
        <BasketBulkAssignment stages={[groups, playoff]} baskets={baskets} players={players} incomingQuotaByStage={new Map([[2, 4]])} labelOf={label} onApply={setBaskets}
          createInputBasket={(stageId, current) => {
            const used = current.filter((b) => b.stageId === stageId && b.type === "input").map((b) => b.ordinal);
            const ordinal = [1, 2, 3, 4].find((n) => !used.includes(n));
            return ordinal ? basket(`new${ordinal}`, ordinal, [], stageId) : null;
          }} />
        <div data-testid="state">{JSON.stringify(baskets.map((b) => [b.id, b.participantIds]))}</div>
      </>
    );
  }
  render(<WithFactory />);
  for (const name of ["Ewa", "Łucja", "Gosia", "Hubert"]) await user.click(screen.getByRole("checkbox", { name: new RegExp(name) }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Przenieś zaznaczonych do" }), "Nowy koszyk startowy (Start B)");
  await user.click(screen.getByRole("button", { name: /Pokaż zmiany/ }));
  const preview = screen.getByRole("region", { name: "Podgląd zmian" });
  assert.match(preview.textContent ?? "", /powstanie nowy koszyk Start B/);
  assert.ok(within(preview).getByText("Ewa: Start A → Start B"));
  assert.ok(within(preview).getByText("Start A: 8 → 4"));
  assert.ok(within(preview).getByText("Start B: 0 → 4"));
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4, 5, 6, 7, 8]], ["p", []]]));
  await user.click(within(preview).getByRole("button", { name: "Zastosuj w szkicu" }));
  assert.equal(screen.getByTestId("state").textContent, JSON.stringify([["a", [1, 2, 3, 4]], ["p", []], ["new2", [5, 6, 7, 8]]]));
  assert.ok(screen.getByRole("button", { name: "Start B: 4" }), "the new basket is a filter at once");
});

test("baskets panel: after a rejected save the 'Przechodzi' field the API named is marked", async () => {
  const user = userEvent.setup();
  const { client } = renderPanel();
  const base = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => init?.method === "PUT"
    ? new Response(JSON.stringify({ code: "STAGE_BASKET_CONFIGURATION_INVALID", error: "Stage basket configuration is invalid.",
        problems: [{ code: "STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED", message: "Explicit output basket must have a positive qualifierCount.", context: { stageId: 1, basketId: "s1out1" } }] }),
        { status: 422, headers: { "content-type": "application/json" } })
    : base(input, init);
  await user.click(await screen.findByTestId("enter-advanced-btn"));
  assert.equal(screen.getByTestId("qualifier-count-s1out1").getAttribute("aria-invalid"), null);
  await user.click(screen.getByTestId("save-baskets-btn"));
  assert.match((await screen.findByTestId("baskets-api-error")).textContent ?? "", /liczbę przechodzących/);
  assert.equal(screen.getByTestId("qualifier-count-s1out1").getAttribute("aria-invalid"), "true");
  client.clear();
});
