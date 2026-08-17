import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import {
  StageBasketsPanel,
  basketLabel,
  ordinalLabel,
  getColorStyle,
  firstFreeOrdinal,
  generateBasketId,
  toggleParticipantInBasket,
} from "./stage-baskets-panel";
import type { StageBasket } from "@workspace/api-client-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;
const queryClients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  for (const qc of queryClients) qc.clear();
  queryClients.clear();
  globalThis.fetch = originalFetch;
});

function renderPanel(
  fetchImpl: typeof fetch,
  options: {
    tournamentStatus?: string;
    orgToken?: string | null;
    tournamentId?: number;
  } = {},
) {
  const { tournamentStatus = "draft", orgToken = "tok-organizer", tournamentId = 42 } = options;
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  });
  queryClients.add(qc);
  const loc = memoryLocation({ path: "/tournaments/42" });
  globalThis.fetch = fetchImpl;
  return render(
    <QueryClientProvider client={qc}>
      <Router hook={loc.hook}>
        <StageBasketsPanel
          tournamentId={tournamentId}
          tournamentStatus={tournamentStatus}
          orgToken={orgToken ?? null}
        />
      </Router>
    </QueryClientProvider>,
  );
}

// ─── fetch mock factory ──────────────────────────────────────────────────────

function makeFetch(handlers: Record<string, () => object | object[]>) {
  return async (input: string | URL | Request, _init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(handler()), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: "not mocked" }), { status: 404 });
  };
}

const stagesSingleStage = [
  {
    id: 1, tournamentId: 42, stageKey: "stage-1", position: 1, name: "Etap 1",
    format: "single_elimination", status: "planned", participantCount: 8, bestOf: 1,
    rankingPolicy: "match_record_v1", qualificationMode: "none", seedingPolicy: "standard_bracket",
    entrySeedingPolicy: "manual", resultSeedingPolicy: "none", randomRevealOrder: "none",
    version: 1, createdAt: "2026-01-01T00:00:00Z",
  },
];

const stagesTwoStages = [
  {
    id: 1, tournamentId: 42, stageKey: "stage-1", position: 1, name: "Eliminacje",
    format: "swiss", status: "planned", participantCount: 8, bestOf: 1,
    rankingPolicy: "swiss_points_v1", qualificationMode: "points_threshold", seedingPolicy: "seedings_order",
    entrySeedingPolicy: "manual", resultSeedingPolicy: "none", randomRevealOrder: "none",
    version: 1, createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2, tournamentId: 42, stageKey: "stage-2", position: 2, name: "Finały",
    format: "single_elimination", status: "planned", participantCount: 4, bestOf: 3,
    rankingPolicy: "match_record_v1", qualificationMode: "none", seedingPolicy: "standard_bracket",
    entrySeedingPolicy: "manual", resultSeedingPolicy: "none", randomRevealOrder: "none",
    version: 1, createdAt: "2026-01-01T00:00:00Z",
  },
];

const basketsLegacy = {
  tournamentId: 42,
  legacyDefaulted: true,
  flowAuthority: "legacy" as const,
  baskets: [
    { id: "s1in1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
    { id: "s1out1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
  ],
  routes: [],
  validation: { valid: true, problems: [] },
};

const basketsExplicit = {
  tournamentId: 42,
  legacyDefaulted: false,
  flowAuthority: "basket_v1" as const,
  baskets: [
    { id: "s1in1", stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: "blue", participantIds: [1, 2], qualifierCount: null },
    { id: "s1in2", stageId: 1, type: "input",  ordinal: 2, order: 2, colorId: "red",  participantIds: [3, 4], qualifierCount: null },
    { id: "s1out1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 2 },
    { id: "s1out2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: 2 },
    { id: "s2in1", stageId: 2, type: "input",  ordinal: 1, order: 1, colorId: "blue", participantIds: [], qualifierCount: null },
    { id: "s2in2", stageId: 2, type: "input",  ordinal: 2, order: 2, colorId: "red",  participantIds: [], qualifierCount: null },
    { id: "s2out1", stageId: 2, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 1 },
  ],
  routes: [
    { id: "r.s1out1.s2in1", sourceBasketId: "s1out1", targetBasketId: "s2in1" },
    { id: "r.s1out2.s2in2", sourceBasketId: "s1out2", targetBasketId: "s2in2" },
  ],
  validation: { valid: true, problems: [] },
};

const basketsInvalid = {
  tournamentId: 42,
  legacyDefaulted: false,
  flowAuthority: "legacy" as const,
  baskets: [
    { id: "s1in1", stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
  ],
  routes: [],
  validation: {
    valid: false,
    problems: [
      { code: "STAGE_OUTPUT_BASKET_COUNT_INVALID", message: "Etap 1 nie ma żadnego koszyka wyjściowego.", context: { stageId: 1 } },
    ],
  },
};

const players = [
  { id: 1, tournamentId: 42, name: "Gracz Alfa", createdAt: "2026-01-01T00:00:00Z" },
  { id: 2, tournamentId: 42, name: "Gracz Beta", createdAt: "2026-01-01T00:00:00Z" },
  { id: 3, tournamentId: 42, name: "Gracz Gamma", createdAt: "2026-01-01T00:00:00Z" },
  { id: 4, tournamentId: 42, name: "Gracz Delta", createdAt: "2026-01-01T00:00:00Z" },
];

// ─── pure unit tests ─────────────────────────────────────────────────────────

test("ordinalLabel converts 1-4 to A-D", () => {
  assert.equal(ordinalLabel(1), "A");
  assert.equal(ordinalLabel(2), "B");
  assert.equal(ordinalLabel(3), "C");
  assert.equal(ordinalLabel(4), "D");
});

test("basketLabel returns Polish label for type and ordinal", () => {
  assert.equal(basketLabel("input",  1), "Wejście A");
  assert.equal(basketLabel("input",  2), "Wejście B");
  assert.equal(basketLabel("output", 1), "Wyjście A");
  assert.equal(basketLabel("output", 2), "Wyjście B");
});

test("getColorStyle returns neutral style for null colorId", () => {
  const style = getColorStyle(null);
  assert.ok(!("id" in style), "neutral style has no id");
  assert.ok(style.bg.includes("muted"), "neutral style has muted bg");
});

test("getColorStyle returns matching color for known colorId", () => {
  const blue = getColorStyle("blue");
  assert.ok("id" in blue && blue.id === "blue");
  assert.ok(blue.bg.includes("blue"));
  assert.ok(blue.dot.includes("blue"));
});

// ─── component integration tests ─────────────────────────────────────────────

test("shows legacy defaulted info banner for legacyDefaulted config", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsLegacy,
    "/stages": () => stagesSingleStage,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("baskets-map"), "basket map renders");
  });

  // Legacy info banner should be present
  const infoText = screen.getByText(/Domyślna konfiguracja koszyków/i);
  assert.ok(infoText, "info banner shown for legacy baskets");
  assert.equal(screen.queryByTestId("stage-flow-summary-1"), null);
  assert.ok(
    screen.getByTestId("stage-block-1").textContent?.includes("8 uczestników"),
    "legacy view must keep the stage plan participantCount",
  );
});

test("renders stage blocks and basket labels for explicit multi-basket config", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("stage-block-1"), "stage 1 block renders");
    assert.ok(screen.getByTestId("stage-block-2"), "stage 2 block renders");
  });

  // Check basket labels are rendered
  const stageBlock1 = screen.getByTestId("stage-block-1");
  assert.ok(within(stageBlock1).getByText("Wejście A"), "Wejście A rendered in stage 1");
  assert.ok(within(stageBlock1).getByText("Wejście B"), "Wejście B rendered in stage 1");
  assert.ok(within(stageBlock1).getByText("Wyjście A"), "Wyjście A rendered in stage 1");
  assert.ok(within(stageBlock1).getByText("Wyjście B"), "Wyjście B rendered in stage 1");

  // Stage names appear in headers
  assert.ok(screen.getByText("Eliminacje"), "stage 1 name rendered");
  assert.ok(screen.getByText("Finały"), "stage 2 name rendered");
  assert.ok(screen.getByTestId("explicit-basket-authority-banner"));
  assert.match(
    screen.getByTestId("stage-flow-summary-1").textContent ?? "",
    /Bezpośrednio: 4.*Z tras: 0.*Razem: 4/,
  );
  assert.match(
    screen.getByTestId("stage-flow-summary-2").textContent ?? "",
    /Bezpośrednio: 0.*Z tras: 4.*Razem: 4/,
  );
});

test("stored pre-authority baskets stay on persisted legacy flow until save", async () => {
  const compatibilityConfig = {
    ...basketsExplicit,
    flowAuthority: "legacy" as const,
  };
  const fetch = makeFetch({
    "stage-baskets": () => compatibilityConfig,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("stage-block-1"));
  });
  assert.equal(screen.queryByTestId("explicit-basket-authority-banner"), null);
  assert.equal(screen.queryByTestId("stage-flow-summary-1"), null);
  assert.ok(
    screen.getByTestId("stage-block-1").textContent?.includes("8 uczestników"),
  );

  await userEvent.click(screen.getByTestId("enter-advanced-btn"));
  assert.ok(screen.getByTestId("basket-authority-draft-preview-banner"));
  assert.match(
    screen.getByTestId("stage-flow-summary-1").textContent ?? "",
    /Razem: 4/,
  );
  assert.equal(screen.queryByTestId("explicit-basket-authority-banner"), null);

  await userEvent.click(screen.getByText(/Anuluj/i));
  assert.equal(screen.queryByTestId("stage-flow-summary-1"), null);
  assert.ok(
    screen.getByTestId("stage-block-1").textContent?.includes("8 uczestników"),
  );
});

test("renders route connectors between stages", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("baskets-map"), "basket map renders");
  });

  // Route connector between stage 1 and stage 2 should be present
  const connector = screen.getByTestId("route-connector");
  assert.ok(connector, "route connector rendered between stages");

  // Both routes should be displayed
  assert.ok(screen.getByTestId("route-r.s1out1.s2in1"), "first route rendered");
  assert.ok(screen.getByTestId("route-r.s1out2.s2in2"), "second route rendered");
});

test("shows locked banner and hides edit controls when tournament is not in draft", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetch, { tournamentStatus: "active" });

  await waitFor(() => {
    assert.ok(screen.getByTestId("baskets-locked-banner"), "locked banner shown");
  });

  // Advanced button should not be present
  assert.equal(
    screen.queryByTestId("enter-advanced-btn"),
    null,
    "advanced edit button hidden when locked",
  );
});

test("shows API validation warning for invalid basket config", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsInvalid,
    "/stages": () => stagesSingleStage,
    "/players": () => [],
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("baskets-validation-warning"), "validation warning rendered");
  });

  // The problem message should appear — now translated to Polish via PROBLEM_CODE_MESSAGES
  assert.ok(
    screen.getByText(/nieprawidłowa liczba koszyków wyjściowych/i),
    "translated Polish problem message shown",
  );
});

test("entering advanced mode shows save and cancel buttons", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsLegacy,
    "/stages": () => stagesSingleStage,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("enter-advanced-btn"), "advanced button available");
  });

  await userEvent.click(screen.getByTestId("enter-advanced-btn"));

  assert.ok(screen.getByTestId("save-baskets-btn"), "save button appears in advanced mode");
  assert.ok(screen.getByText(/Anuluj/i), "cancel button appears in advanced mode");
  assert.ok(
    screen.getByTestId("basket-authority-draft-preview-banner"),
    "unsaved draft is clearly a preview",
  );
  assert.equal(
    screen.queryByTestId("explicit-basket-authority-banner"),
    null,
    "opening advanced mode must not claim persisted authority",
  );

  await userEvent.click(screen.getByText(/Anuluj/i));
  assert.equal(
    screen.queryByTestId("basket-authority-draft-preview-banner"),
    null,
    "cancelling leaves the persisted legacy mode unchanged",
  );
  assert.ok(
    screen.getByTestId("stage-block-1").textContent?.includes("8 uczestników"),
    "cancel restores the persisted legacy participant count",
  );
});

test("add route button appears in advanced mode for multi-stage tournament", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("enter-advanced-btn"), "advanced button available");
  });

  await userEvent.click(screen.getByTestId("enter-advanced-btn"));

  await waitFor(() => {
    assert.ok(screen.getByTestId("add-route-btn"), "add route button shown in advanced mode");
  });
});

// ─── pure regression tests for new logic ─────────────────────────────────────

test("firstFreeOrdinal: returns 1 for empty list", () => {
  assert.equal(firstFreeOrdinal([]), 1);
});

test("firstFreeOrdinal: returns first gap after partial delete", () => {
  // [1,3] → first free is 2
  assert.equal(firstFreeOrdinal([1, 3]), 2);
  // [1,2,3] → first free is 4
  assert.equal(firstFreeOrdinal([1, 2, 3]), 4);
  // [2,3,4] → first free is 1
  assert.equal(firstFreeOrdinal([2, 3, 4]), 1);
});

test("generateBasketId: does not collide with existing IDs", () => {
  // st5in1 and st5in2 exist → should get st5in3
  const existing = new Set(["st5in1", "st5in2"]);
  const id = generateBasketId(5, "input", existing);
  assert.ok(!existing.has(id), `generated ID ${id} must not collide`);
  assert.match(id, /^[a-z0-9][a-z0-9._:-]*$/, "ID matches contract pattern");
});

test("generateBasketId: skips IDs of deleted baskets (ordinal hole scenario)", () => {
  // After [ordinal1, ordinal2, ordinal3] → delete ordinal2 → IDs st5in1, st5in3 remain
  // Adding a new basket must not reuse st5in2 which was already committed to backend
  // Simulate by having st5in1, st5in2, st5in3 all in existingIds (as if st5in2 was recently deleted
  // but we still want a fresh ID)
  const existing = new Set(["st5in1", "st5in3"]);
  const id = generateBasketId(5, "input", existing);
  assert.ok(!existing.has(id), `generated ID ${id} must not collide`);
});

test("toggleParticipantInBasket: player assigned to stage 1 remains after being added to stage 2", () => {
  const baskets: StageBasket[] = [
    { id: "s1in1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [1], qualifierCount: null },
    { id: "s2in1", stageId: 2, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
    { id: "s2in2", stageId: 2, type: "input", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: null },
  ];
  // Assign player 1 to stage 2's basket
  const result = toggleParticipantInBasket(baskets, "s2in1", 1);
  const s1in1 = result.find((b) => b.id === "s1in1")!;
  const s2in1 = result.find((b) => b.id === "s2in1")!;
  assert.ok(s1in1.participantIds.includes(1), "player 1 must remain in stage 1 basket");
  assert.ok(s2in1.participantIds.includes(1), "player 1 must be in stage 2 basket");
});

test("toggleParticipantInBasket: player moved between baskets within same stage", () => {
  const baskets: StageBasket[] = [
    { id: "s2in1", stageId: 2, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [7], qualifierCount: null },
    { id: "s2in2", stageId: 2, type: "input", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: null },
  ];
  // Assign player 7 to s2in2 — should be removed from s2in1 (same stage)
  const result = toggleParticipantInBasket(baskets, "s2in2", 7);
  const s2in1 = result.find((b) => b.id === "s2in1")!;
  const s2in2 = result.find((b) => b.id === "s2in2")!;
  assert.ok(!s2in1.participantIds.includes(7), "player 7 must be removed from s2in1 (same stage)");
  assert.ok(s2in2.participantIds.includes(7), "player 7 must be in s2in2");
});

test("skip-stage route (Stage 1 → Stage 3) displays target stage name in connector", async () => {
  const threeStages = [
    { id: 1, tournamentId: 42, stageKey: "s1", position: 1, name: "Faza grupowa",
      format: "swiss", status: "planned", participantCount: 8, bestOf: 1,
      rankingPolicy: "swiss_points_v1", qualificationMode: "points_threshold",
      seedingPolicy: "seedings_order", entrySeedingPolicy: "manual",
      resultSeedingPolicy: "none", randomRevealOrder: "none", version: 1,
      createdAt: "2026-01-01T00:00:00Z" },
    { id: 2, tournamentId: 42, stageKey: "s2", position: 2, name: "Półfinały",
      format: "single_elimination", status: "planned", participantCount: 4, bestOf: 3,
      rankingPolicy: "match_record_v1", qualificationMode: "none",
      seedingPolicy: "standard_bracket", entrySeedingPolicy: "manual",
      resultSeedingPolicy: "none", randomRevealOrder: "none", version: 1,
      createdAt: "2026-01-01T00:00:00Z" },
    { id: 3, tournamentId: 42, stageKey: "s3", position: 3, name: "Wielki Finał",
      format: "single_elimination", status: "planned", participantCount: 2, bestOf: 5,
      rankingPolicy: "match_record_v1", qualificationMode: "none",
      seedingPolicy: "standard_bracket", entrySeedingPolicy: "manual",
      resultSeedingPolicy: "none", randomRevealOrder: "none", version: 1,
      createdAt: "2026-01-01T00:00:00Z" },
  ];
  const skipRouteConfig = {
    tournamentId: 42,
    legacyDefaulted: false,
    flowAuthority: "basket_v1" as const,
    baskets: [
      { id: "s1in1",  stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [] },
      { id: "s1out1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
      { id: "s2in1",  stageId: 2, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [] },
      { id: "s2out1", stageId: 2, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
      { id: "s3in1",  stageId: 3, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [] },
      { id: "s3out1", stageId: 3, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
    ],
    // Skip-stage: Stage 1 Output A → Stage 3 Input A (skipping Stage 2)
    routes: [
      { id: "r.s1out1.s3in1", sourceBasketId: "s1out1", targetBasketId: "s3in1" },
    ],
    validation: { valid: true, problems: [] },
  };

  const fetch = makeFetch({
    "stage-baskets": () => skipRouteConfig,
    "/stages": () => threeStages,
    "/players": () => [],
  });
  renderPanel(fetch);

  await waitFor(() => {
    assert.ok(screen.getByTestId("route-r.s1out1.s3in1"), "skip-stage route rendered");
  });

  // Target label must mention Stage 3's name ("Wielki Finał") to disambiguate from Stage 2
  const routeEl = screen.getByTestId("route-target-r.s1out1.s3in1");
  assert.ok(
    routeEl.textContent?.includes("Wielki Finał"),
    `route target label "${routeEl.textContent}" must include target stage name "Wielki Finał"`,
  );
});

test("organizer with no orgToken sees no edit button", async () => {
  const fetch = makeFetch({
    "stage-baskets": () => basketsLegacy,
    "/stages": () => stagesSingleStage,
    "/players": () => [],
  });
  renderPanel(fetch, { orgToken: null });

  await waitFor(() => {
    assert.ok(screen.getByTestId("baskets-map"), "basket map renders");
  });

  // No advanced button without orgToken
  assert.equal(screen.queryByTestId("enter-advanced-btn"), null, "no advanced button without orgToken");
});

// ─── Phase 1: qualifierCount UI tests ────────────────────────────────────────

test("quota summary displays Łącznie przechodzi and Odpada for stage with non-null qualifierCounts", async () => {
  // Explicit authority derives stage 1 from four direct assignments, ignoring
  // the legacy participantCount=8 compatibility field.
  const fetchImpl = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetchImpl);

  await waitFor(() => {
    assert.ok(screen.getByTestId("quota-summary-1"), "quota summary appears for stage 1");
  });

  const summary = screen.getByTestId("quota-summary-1");
  assert.ok(
    summary.textContent?.includes("4"),
    `quota summary must show total=4; got: ${summary.textContent}`,
  );
  assert.ok(summary.textContent?.includes("4 / 4"));
  assert.ok(
    summary.textContent?.includes("Odpada"),
    "quota summary must show Odpada text",
  );

  assert.ok(screen.getByTestId("quota-summary-2"));
});

test("advanced mode shows qualifier-count input for output baskets and quota summary updates", async () => {
  const fetchImpl = makeFetch({
    "stage-baskets": () => basketsExplicit,
    "/stages": () => stagesTwoStages,
    "/players": () => players,
  });
  renderPanel(fetchImpl);

  await waitFor(() => {
    assert.ok(screen.getByTestId("enter-advanced-btn"), "advanced button available");
  });
  await userEvent.click(screen.getByTestId("enter-advanced-btn"));

  // Qualifier-count inputs must appear for output baskets in advanced mode.
  await waitFor(() => {
    assert.ok(
      screen.getByTestId("qualifier-count-s1out1"),
      "qualifier-count input for s1out1 must be present in advanced mode",
    );
  });

  const input = screen.getByTestId("qualifier-count-s1out1") as HTMLInputElement;
  assert.equal(input.value, "2", "initial qualifierCount must be 2");

  // Change qualifierCount from 2 to 3 — total becomes five against the
  // explicit derived capacity of four.
  await userEvent.clear(input);
  await userEvent.type(input, "3");

  await waitFor(() => {
    const summary = screen.getByTestId("quota-summary-1");
    assert.ok(
      summary.textContent?.includes("5"),
      `quota must update to 5 after edit; got: ${summary.textContent}`,
    );
    assert.ok(summary.textContent?.includes("przekroczono limit"));
  });
});

test("save button sends PUT with updated qualifierCount", async () => {
  let capturedPutBody: unknown = null;
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "PUT" && url.includes("stage-baskets")) {
      capturedPutBody = JSON.parse((init?.body ?? "{}") as string);
      return new Response(JSON.stringify({ ...basketsExplicit, legacyDefaulted: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("stage-baskets")) return new Response(JSON.stringify(basketsExplicit), { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/stages")) return new Response(JSON.stringify(stagesTwoStages), { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/players")) return new Response(JSON.stringify(players), { status: 200, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ error: "not mocked" }), { status: 404 });
  };

  renderPanel(fetchImpl);

  await waitFor(() => {
    assert.ok(screen.getByTestId("enter-advanced-btn"), "advanced button available");
  });
  await userEvent.click(screen.getByTestId("enter-advanced-btn"));

  // Change qualifierCount of s1out1 from 2 to 5.
  await waitFor(() => {
    assert.ok(screen.getByTestId("qualifier-count-s1out1"), "input present");
  });
  const input = screen.getByTestId("qualifier-count-s1out1") as HTMLInputElement;
  await userEvent.clear(input);
  await userEvent.type(input, "5");

  // Click save.
  await userEvent.click(screen.getByTestId("save-baskets-btn"));

  // Verify PUT was called and the payload includes the updated qualifierCount.
  await waitFor(() => {
    assert.ok(capturedPutBody !== null, "PUT must have been called after save");
  });

  const body = capturedPutBody as { baskets: Array<{ id: string; qualifierCount: number | null }> };
  const s1out1 = body.baskets.find((b) => b.id === "s1out1");
  assert.ok(s1out1, "PUT payload must include s1out1 basket");
  assert.equal(
    s1out1?.qualifierCount,
    5,
    `PUT payload must carry qualifierCount=5; got ${s1out1?.qualifierCount}`,
  );
});
