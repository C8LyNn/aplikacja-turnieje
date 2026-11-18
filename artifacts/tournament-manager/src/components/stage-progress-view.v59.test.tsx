import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import { StageProgressView } from "./stage-progress-view";

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

const stage = { id: 2, tournamentId: 9, name: "Etap 1", position: 1, format: "double_elimination", status: "active", matchRules: null };
const detail = { ...stage, participants: [] };
const deState = {
  tournamentId: 9, stageId: 2, revision: 3, completed: false, championParticipantKey: null,
  participants: [
    { participantKey: "p1", playerId: 11, name: "Alfa", seed: 1, losses: 0, status: "active" },
    { participantKey: "p2", playerId: 12, name: "Beta", seed: 2, losses: 0, status: "active" },
  ],
  matches: [
    { matchKey: "u1", matchId: 101, name: "Upper R1 M1", bracket: "upper", round: 1, matchNumber: 1, order: 0, slots: ["p1", "p2"], status: "ready", bestOf: 3, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gf", matchId: null, name: "Grand Final", bracket: "grand_final", round: 1, matchNumber: 1, order: 1, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
  ],
};

function routes(deResponse: () => Response) {
  const seen: string[] = [];
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    seen.push(url);
    if (url.endsWith("/stages/2/double-elimination")) return deResponse();
    if (url.endsWith("/stages/2")) return json(detail);
    if (url.endsWith("/stages")) return json([stage]);
    return json({ error: "unexpected" }, 404);
  };
  return seen;
}

test("V5.9: the Drabinka tab shows a double-elimination stage (it used to render nothing)", async () => {
  const seen = routes(() => json(deState));
  render(<AuthProvider><StageProgressView tournamentId={9} activeStageId={2} matches={[]} /></AuthProvider>);
  assert.ok((await screen.findAllByLabelText("Drabinka podwójnej eliminacji")).length >= 1);
  assert.ok(screen.getByText("Upper Bracket"), "Stable keeps the engine's section labels");
  assert.ok(screen.getAllByText(/Alfa/).length >= 1);
  assert.ok(seen.some((url) => url.endsWith("/stages/2/double-elimination")));
  // read-only: no result entry and no reset in the progress view
  assert.equal(screen.queryByRole("button", { name: /Zapisz wynik|Resetuj etap/ }), null);
});

test("V5.9: a failed double-elimination read says so and can be retried", async () => {
  let attempts = 0;
  routes(() => (++attempts === 1 ? json({ error: "Serwer niedostępny" }, 503) : json(deState)));
  render(<AuthProvider><StageProgressView tournamentId={9} activeStageId={2} matches={[]} /></AuthProvider>);
  assert.ok((await screen.findByRole("alert")).textContent?.includes("Nie udało się pobrać drabinki"));
  await userEvent.click(screen.getByRole("button", { name: "Ponów odczyt drabinki" }));
  assert.ok((await screen.findAllByLabelText("Drabinka podwójnej eliminacji")).length >= 1);
});
