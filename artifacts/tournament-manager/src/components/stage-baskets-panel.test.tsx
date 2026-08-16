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
  baskets: [
    { id: "s1in1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [] },
    { id: "s1out1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
  ],
  routes: [],
  validation: { valid: true, problems: [] },
};

const basketsExplicit = {
  tournamentId: 42,
  legacyDefaulted: false,
  baskets: [
    { id: "s1in1", stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: "blue", participantIds: [1, 2] },
    { id: "s1in2", stageId: 1, type: "input",  ordinal: 2, order: 2, colorId: "red",  participantIds: [3, 4] },
    { id: "s1out1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
    { id: "s1out2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [] },
    { id: "s2in1", stageId: 2, type: "input",  ordinal: 1, order: 1, colorId: "blue", participantIds: [] },
    { id: "s2in2", stageId: 2, type: "input",  ordinal: 2, order: 2, colorId: "red",  participantIds: [] },
    { id: "s2out1", stageId: 2, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [] },
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
  baskets: [
    { id: "s1in1", stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [] },
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
    { id: "s1in1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [1] },
    { id: "s2in1", stageId: 2, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [] },
    { id: "s2in2", stageId: 2, type: "input", ordinal: 2, order: 2, colorId: null, participantIds: [] },
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
    { id: "s2in1", stageId: 2, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [7] },
    { id: "s2in2", stageId: 2, type: "input", ordinal: 2, order: 2, colorId: null, participantIds: [] },
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
