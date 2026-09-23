import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentHost from "./tournament-host";
import { useToast } from "@/hooks/use-toast";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();

const staleMessage = "Mecz zmienił się od czasu rozpoczęcia edycji. Sprawdź aktualnych zawodników i wynik przed ponownym zapisem.";

for (const resultCount of [0, 1, 2, 3, 8]) {
  test(`Host adapts a 24-match queue to ${resultCount} recent results without changing selection or order`, async () => {
    const matches = [
      ...Array.from({ length: 24 }, (_, i) => hostMatch(i + 1)),
      ...Array.from({ length: resultCount }, (_, i) => ({
        ...hostMatch(i + 25, 2, "completed"), resultType: "played" as const, score1: 2,
      })),
    ];
    const user = await renderOperationalHost({ matches });
    const queue = await screen.findByRole("region", { name: "Mecze bieżącego etapu" });
    const list = within(queue).getByRole("list");
    const rows = within(list).getAllByRole("listitem");
    assert.equal(rows.length, 24);
    rows.forEach((row, i) => assert.ok(within(row).getByRole("button", { name: new RegExp(`Gracz A${i + 1} vs Gracz B${i + 1}(?: |$)`) })));
    assert.equal(queue.parentElement?.classList.contains("xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"), resultCount >= 3);
    assert.equal(list.classList.contains("xl:grid-cols-2"), resultCount < 3);
    const results = screen.getByRole("region", { name: "Ostatnie wyniki" });
    if (resultCount === 0) assert.ok(within(results).getByText("Brak zakończonych meczów"));
    assert.equal(within(results).queryAllByRole("button", { name: /^Popraw wynik:/ }).length, Math.min(resultCount, 6));
    await user.click(within(rows[5]).getByRole("button", { name: /Gracz A6 vs Gracz B6/ }));
    assert.ok(within(rows[5]).getByText("Wybrany"));
    assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A6" }));
  });
}

test("Host preserves the selected match when refreshed results enable the sidebar", async () => {
  const matches = Array.from({ length: 24 }, (_, i) => hostMatch(i + 1));
  const user = await renderOperationalHost({ matches });
  const queue = await screen.findByRole("region", { name: "Mecze bieżącego etapu" });
  await user.click(within(queue).getByRole("button", { name: /Gracz A6 vs Gracz B6/ }));
  for (let i = 0; i < 3; i++) matches[i] = { ...matches[i], status: "completed", resultType: "played", score1: 2 };
  await refreshHost();
  await waitFor(() => assert.equal(within(queue).getAllByRole("listitem").length, 21));
  assert.ok(queue.parentElement?.classList.contains("xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"));
  assert.ok(within(queue).getByRole("button", { name: /Gracz A6 vs Gracz B6.*Wybrany/ }));
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A6" }));
});

for (const winnerId of [2, null]) {
  test(`Host completed tournament has one summary and secondary correction (winner=${winnerId})`, async () => {
    const user = await renderOperationalHost({
      matches: [{ ...hostMatch(1), status: "completed", resultType: "played", score1: 2 }],
      stages: [hostStage(2, "completed")],
      intercept: async path => path === "/api/tournaments/1" ? jsonResponse({
        id: 1, name: "Turniej szkoleniowy", status: "completed", format: "swiss", activeStageId: null,
        winnerId, hasOrganizerPassword: true, resultModelVersion: "series_v1", visibility: "public_online",
      }) : undefined,
    });
    const summary = await screen.findByRole("region", { name: "Podsumowanie turnieju" });
    await within(summary).findByText("Wszystkie etapy są zakończone.");
    assert.equal(screen.getAllByText("Turniej zakończony").length, 1);
    assert.equal(screen.queryByText("🏆 Turniej zakończony!"), null);
    assert.equal(screen.queryByRole("region", { name: "Stan prowadzenia" }), null);
    assert.equal(screen.queryByText("Następny krok"), null);
    assert.equal(screen.queryByRole("button", { name: /Rozpocznij etap|Zakończ etap|Generuj.*rund/ }), null);
    assert.equal(!!within(summary).queryByText("Mistrz: Gracz A1"), winnerId !== null);
    assert.ok(within(summary).getByRole("link", { name: "Widok widzów" }));
    await user.click(within(summary).getByRole("link", { name: "Wszystkie mecze i wyniki" }));
    const correction = await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" });
    assert.ok(!correction.classList.contains("bg-primary"));
    await user.click(correction);
    assert.ok(await screen.findByRole("dialog"));
  });
}

test("Host prioritizes start before editing and save once the operator edits the result", async () => {
  const user = await renderOperationalHost({ matches: [hostMatch(1)] });
  const start = await screen.findByRole("button", { name: "Rozpocznij mecz" });
  assert.ok(screen.getByRole("region", { name: "Stan prowadzenia" }));
  assert.equal(screen.queryByRole("region", { name: "Podsumowanie turnieju" }), null);
  assert.ok(start.classList.contains("bg-primary"));
  assert.ok(!screen.getByRole("button", { name: "Zapisz wynik" }).classList.contains("bg-primary"));
  await user.click(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).classList.contains("bg-primary"));
  assert.ok(!screen.getByRole("button", { name: "Rozpocznij mecz" }).classList.contains("bg-primary"));
});

test("Host LIVE match prioritizes saving; completed match shows its result and secondary correction", async () => {
  const matches = [hostMatch(1, 2, "in_progress")];
  await renderOperationalHost({ matches });
  assert.ok((await screen.findByRole("button", { name: "Zapisz wynik" })).classList.contains("bg-primary"));
  assert.equal(screen.queryByRole("button", { name: "Rozpocznij mecz" }), null);
  act(() => screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }).focus());
  matches[0] = { ...matches[0], status: "completed", resultType: "played", score1: 2 };
  await refreshHost();
  await screen.findByText(/Wynik zapisany: 2:0/);
  assert.equal(screen.queryByRole("button", { name: "Zapisz wynik" }), null);
  assert.ok(!screen.getByRole("button", { name: "Popraw wynik" }).classList.contains("bg-primary"));
});

test("Host groups rare actions in a menu and preserves destructive cancellation confirmation", async () => {
  let cancellations = 0;
  const user = await renderOperationalHost({ matches: [hostMatch(1)], stages: [hostStage(2, "active", "round_robin")], intercept: async path => {
    if (path.endsWith("/cancel")) { cancellations++; return jsonResponse({}); }
    return undefined;
  } });
  const more = await screen.findByRole("button", { name: "Więcej akcji" });
  assert.ok(!more.classList.contains("bg-primary"));
  assert.equal(screen.queryByRole("menuitem", { name: "Walkower (W.O.)" }), null);
  await user.click(more);
  for (const name of ["Walkower (W.O.)", "Brak rozstrzygnięcia (no contest)", "Zamień strony", "Przełóż"]) assert.ok(screen.getByRole("menuitem", { name }));
  const cancel = screen.getByRole("menuitem", { name: "Anuluj mecz" });
  assert.ok(cancel.classList.contains("text-destructive"));
  await user.click(cancel);
  assert.ok(screen.getByText("Anulować mecz?"));
  assert.equal(cancellations, 0, "opening the existing confirmation must not cancel the match");
  assert.ok(screen.getByRole("button", { name: "Anuluj mecz" }).classList.contains("bg-destructive"));
  await user.click(screen.getByRole("button", { name: "Nie anuluj" }));
  assert.equal(cancellations, 0);
});

for (const [format, allowed] of [["round_robin", true], ["swiss", true], ["group_stage", true], ["single_elimination", false], ["double_elimination", false]] as const) {
  test(`Host no-contest visibility follows the focused ${format} stage, not the tournament format`, async () => {
    const user = await renderOperationalHost({ matches: [hostMatch(1)], stages: [hostStage(1, "completed", "round_robin"), hostStage(2, "active", format)] });
    await user.click(await screen.findByRole("button", { name: "Więcej akcji" }));
    assert.equal(!!screen.queryByRole("menuitem", { name: "Brak rozstrzygnięcia (no contest)" }), allowed);
    assert.ok(screen.getByRole("menuitem", { name: "Walkower (W.O.)" }));
  });
}

for (const resultType of ["played", "walkover", "no_contest"] as const) {
  test(`Host ${resultType}: stale draft sends its revision, refreshes without retry, then explicitly starts a fresh draft`, async () => {
    const matches = [{ ...hostMatch(1), revision: 12 }];
    let toastTitle: React.ReactNode;
    function FeedbackProbe() {
      toastTitle = useToast().toasts[0]?.title;
      return null;
    }
    const requests: Record<string, unknown>[] = [];
    let reads = 0;
    const user = await renderOperationalHost({ matches, stages: [hostStage(2, "active", "round_robin")], intercept: async (path, init) => {
      if (path.endsWith("/matches")) reads++;
      if (!path.endsWith("/complete")) return undefined;
      requests.push(JSON.parse(String(init?.body)));
      if (requests.length === 1) {
        // Operator B's swap happens on the server before A's write; A has not polled it yet.
        matches[0] = { ...matches[0], revision: 13, player1Id: 3, player2Id: 2, player1Name: "Gracz B1", player2Name: "Gracz A1" };
        return new Response(JSON.stringify({ code: "CONCURRENT_MODIFICATION" }), { status: 409, headers: { "content-type": "application/json" } });
      }
      matches[0] = { ...matches[0], revision: 14, status: "completed", resultType: "played", score1: 2 };
      return jsonResponse(matches[0]);
    } });
    render(<FeedbackProbe />);
    // A global retry policy must not retry this mutation.
    for (const client of clients) client.setDefaultOptions({ ...client.getDefaultOptions(), mutations: { retry: 2, gcTime: 0 } });
    const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
    if (resultType === "played") {
      await user.click(plus); await user.click(plus);
      await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
    } else if (resultType === "walkover") {
      await user.click(screen.getByRole("button", { name: "Więcej akcji" }));
      await user.click(screen.getByRole("menuitem", { name: "Walkower (W.O.)" }));
      await user.click(screen.getByRole("button", { name: /Gracz A1 wygrał/ }));
    } else {
      await user.click(screen.getByRole("button", { name: "Więcej akcji" }));
      await user.click(screen.getByRole("menuitem", { name: "Brak rozstrzygnięcia (no contest)" }));
      await user.click(screen.getByRole("button", { name: "Zapisz brak rozstrzygnięcia" }));
    }
    await waitFor(() => assert.match(screen.getByRole("alert").textContent ?? "", /Mecz zmienił się od czasu rozpoczęcia edycji/));
    await waitFor(() => assert.ok(reads >= 2));
    await waitFor(() => assert.equal(screen.queryByText("Zapisywanie i odświeżanie danych…"), null));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].expectedRevision, 12);
    assert.equal(requests[0].resultType, resultType);
    if (resultType === "walkover") assert.equal(requests[0].winnerId, 2);
    assert.ok(screen.getByRole("alert").textContent?.includes(staleMessage));
    assert.equal(screen.queryByText("Wynik zapisany!"), null);
    assert.equal(toastTitle, "Operacja nie powiodła się");
    assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz B1" }).matches(":disabled"));
    assert.equal(screen.queryByRole("button", { name: "Więcej akcji" }), null);
    assert.equal(screen.queryByRole("button", { name: "Rozpocznij mecz" }), null);
    assert.equal(screen.queryByRole("button", { name: /wygrał/ }), null);
    assert.equal(screen.queryByRole("button", { name: "Zapisz brak rozstrzygnięcia" }), null);
    assert.ok(screen.getByRole("button", { name: "BO3" }).matches(":disabled"));
    const conflict = screen.getByRole("region", { name: "Konflikt zapisu wyniku" });
    assert.match(conflict.textContent ?? "", /nie został zapisany/);
    assert.match(conflict.textContent ?? "", /Aktualny mecz został odświeżony/);
    assert.match(conflict.textContent ?? "", /Gracz B1 – Gracz A1 · BO3 · Oczekuje/);
    assert.match(conflict.textContent ?? "", /Nieaktualny draft.*Gracz A1 – Gracz B1/);
    if (resultType === "played") {
      assert.match(conflict.textContent ?? "", /2:0/);
      const save = screen.getByRole("button", { name: "Zapisz wynik" });
      assert.ok(save.matches(":disabled"));
      await user.click(save);
      assert.equal(requests.length, 1);
    }
    await user.click(within(conflict).getByRole("button", { name: "Odrzuć stary draft i rozpocznij nową edycję" }));
    assert.equal(screen.queryByRole("region", { name: "Konflikt zapisu wyniku" }), null);
    assert.equal(screen.queryByRole("alert"), null);
    assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"), "old score must not enter the fresh form");
    const freshPlus = screen.getByRole("button", { name: "Zwiększ wynik: Gracz B1" });
    await user.click(freshPlus); await user.click(freshPlus);
    await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
    await waitFor(() => assert.equal(requests.length, 2));
    assert.deepEqual(requests[1], { resultType: "played", expectedRevision: 13, score1: 2, score2: 0 });
    await waitFor(() => assert.equal(screen.queryByRole("button", { name: "Odrzuć wynik roboczy" }), null));
    assert.equal(toastTitle, "Wynik zapisany!");
  });
}

test("Host recovery captures the current revision immediately, before the next score interaction", async () => {
  const matches = [{ ...hostMatch(1), revision: 12 }];
  let writes = 0;
  const user = await renderOperationalHost({ matches, intercept: async path => {
    if (!path.endsWith("/complete")) return undefined;
    writes++;
    matches[0] = { ...matches[0], revision: 13 };
    return new Response(JSON.stringify({ code: "CONCURRENT_MODIFICATION" }), { status: 409, headers: { "content-type": "application/json" } });
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  const recovery = await screen.findByRole("button", { name: "Odrzuć stary draft i rozpocznij nową edycję" });
  await waitFor(() => assert.ok(!recovery.matches(":disabled")));
  await user.click(recovery);
  assert.equal(screen.queryByRole("region", { name: "Konflikt zapisu wyniku" }), null);
  matches[0] = { ...matches[0], revision: 14 };
  await refreshHost();
  await waitFor(() => assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }).matches(":disabled"), "polling cannot silently rebase the draft created by recovery"));
  assert.equal(writes, 1);
});

test("Host polling of a revision-only change cannot rebase an open draft, including ABA", async () => {
  const matches = [{ ...hostMatch(1), revision: 4 }];
  let writes = 0;
  const user = await renderOperationalHost({ matches, intercept: async path => {
    if (path.endsWith("/complete")) { writes++; return jsonResponse({}); }
    return undefined;
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  act(() => plus.focus());
  // Two swaps restore identical participants; revision is the only observable difference.
  matches[0] = { ...matches[0], revision: 6 };
  await refreshHost();
  assert.ok(plus.matches(":disabled"));
  await user.click(plus);
  assert.equal(writes, 0);
  assert.ok(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
});

test("Host revert retires the previous revision and correction submits the refetched revision", async () => {
  const matches = [{ ...hostMatch(1), revision: 4, status: "completed", resultType: "played" as "played" | null, score1: 2 }];
  let request: unknown;
  const user = await renderOperationalHost({ matches, intercept: async (path, init) => {
    if (path.endsWith("/revert")) {
      matches[0] = { ...matches[0], revision: 5, status: "pending", resultType: null, score1: 0 };
      return jsonResponse(matches[0]);
    }
    if (path.endsWith("/complete")) { request = JSON.parse(String(init?.body)); return jsonResponse({}); }
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  await user.click(screen.getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" }));
  await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
  const plus = screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await waitFor(() => assert.deepEqual(request, { resultType: "played", expectedRevision: 5, score1: 2, score2: 0 }));
});

async function refreshHost() {
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
}

test("editing the suggested match pins its draft when another match becomes LIVE", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz B1" }).matches(":disabled"));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
});

test("explicit selection keeps its 1:0 draft when another match finishes and the recommendation changes", async () => {
  const matches = [hostMatch(1), hostMatch(2, 2, "in_progress"), hostMatch(3)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: /Gracz A1 vs Gracz B1/ }));
  await user.click(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[1] = { ...matches[1], status: "completed", resultType: "played", score1: 2 };
  matches[2] = { ...matches[2], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A3 vs Gracz B3.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
  await user.click(screen.getByRole("button", { name: /Gracz A3 vs Gracz B3/ }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A3" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Odrzuć wynik roboczy" }), null);
  await user.click(screen.getByRole("button", { name: /Gracz A1 vs Gracz B1/ }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
});

test("an untouched automatic suggestion follows the refreshed LIVE match", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  await renderOperationalHost({ matches });
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
});

test("remote completion keeps the edited match and its stale draft in context", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[0] = { ...matches[0], status: "completed", resultType: "played", score2: 2 };
  await refreshHost();
  await screen.findByText(/Twój wynik roboczy: 1:0. Aktualny wynik: 0:2/);
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A2" }), null);
  assert.equal(screen.queryByText("Wynik zapisany!"), null);
});

test("correction remains attached to A while another match changes", async () => {
  const matches = [{ ...hostMatch(1, 2, "completed"), resultType: "played" as const, score1: 2 }, hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/, hidden: true });
  assert.match(screen.getByRole("dialog").textContent ?? "", /Gracz A1 – Gracz B1/);
});

test("a removed selected match clears its draft with an explanation before suggesting another", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches.shift();
  await refreshHost();
  await screen.findByText(/Wybrany mecz nie jest już dostępny/);
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A2" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Odrzuć wynik roboczy" }), null);
  const unload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, false);
});

test("failed refetch keeps selection and draft instead of treating a match as removed", async () => {
  let failed = false;
  const user = await renderOperationalHost({ matches: [hostMatch(1), hostMatch(2)], intercept: async path =>
    failed && path.endsWith("/matches") ? new Response("unavailable", { status: 503 }) : undefined });
  for (const client of clients) client.setQueryDefaults(["/api/tournaments/1/matches"], { retry: false });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  failed = true;
  await refreshHost();
  await screen.findByText("Nie udało się odświeżyć stanu prowadzenia.");
  assert.equal(screen.queryByText(/Wybrany mecz nie jest już dostępny/), null);
  failed = false;
  await refreshHost();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  assert.ok(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  assert.equal(screen.queryByText(/Wybrany mecz nie jest już dostępny/), null);
});

test("keyboard focus pins the form before the first score change", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  await renderOperationalHost({ matches });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  act(() => plus.focus());
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
});

test("a conflict refreshes the same match without switching to the next available match", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches, intercept: async path => {
    if (!path.endsWith("/1/complete")) return undefined;
    matches[0] = { ...matches[0], status: "completed", resultType: "played", score2: 2 };
    return new Response(JSON.stringify({ code: "MATCH_ALREADY_FINALIZED" }), { status: 409, headers: { "content-type": "application/json" } });
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByText(/Twój wynik roboczy: 2:0. Aktualny wynik: 0:2/);
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten mecz ma już zapisany wynik/);
  assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A2" }), null);
  assert.equal(screen.queryByText("Wynik zapisany!"), null);
});

test("correction closes with an explanation if its match is actually removed", async () => {
  const matches = [{ ...hostMatch(1, 2, "completed"), resultType: "played" as const, score1: 2 }, hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  matches.shift();
  await refreshHost();
  await screen.findByText(/Wybrany mecz nie jest już dostępny/);
  assert.equal(screen.queryByRole("dialog"), null);
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/tournaments/1/host");
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("host header shows the forced Deadlock hero", async () => {
  const tournament = {
    id: 1,
    name: "Deadlock Host Test",
    format: "single_elimination",
    status: "active",
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    defaultBestOf: 3,
    hasHostCode: false,
    hasOrganizerPassword: true,
    hasSupportPassword: false,
    hasViewerPassword: false,
    visibility: "public_online",
    activeStageId: 1,
    currentRound: 1,
    totalRounds: 1,
    featuredMatchId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    gameConfig: {
      gameId: "deadlock",
      configVersion: 1,
      config: { forcedHeroId: "rem" },
    },
  };

  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  const requestedPaths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;
    const pathname = new URL(url, "http://localhost").pathname;
    requestedPaths.push(pathname);
    if (pathname === "/api/tournaments/1") return jsonResponse(tournament);
    if (pathname.endsWith("/bracket")) {
      return jsonResponse({ tournament, rounds: [], winner: null });
    }
    if (pathname.endsWith("/assistant")) {
      return jsonResponse({ stepTitle: "", nextAction: "" });
    }
    return jsonResponse([]);
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchInterval: false },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  const location = memoryLocation({ path: "/tournaments/1/host" });
  clients.add(queryClient);
  render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <TournamentHost />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );

  await waitFor(() =>
    assert.match(
      document.body.textContent ?? "",
      /Rem/,
      `requested paths: ${requestedPaths.join(", ")}`,
    ),
  );
  const image = screen.getByAltText("Rem") as HTMLImageElement;
  assert.match(image.src, /game-assets\/deadlock\/heroes\/rem\.png$/);
  queryClient.clear();
});

function hostStage(id = 2, status = "active", format = "single_elimination") {
  return { id, tournamentId: 1, position: id, name: id === 2 ? "Finały szkoleniowe" : "Eliminacje",
    format, status, participantCount: 4, bestOf: 3, currentRound: 1, totalRounds: 2 };
}

function hostMatch(id: number, stageId: number | null = 2, status = "pending") {
  return { id, revision: 1, tournamentId: 1, stageId, round: 1, matchNumber: id, status, bestOf: 3,
    player1Id: id * 2, player2Id: id * 2 + 1, player1Name: `Gracz A${id}`, player2Name: `Gracz B${id}`,
    score1: 0, score2: 0, resultType: null as "played" | "walkover" | "no_contest" | null, winnerId: null };
}

async function renderOperationalHost(options: {
  matches: ReturnType<typeof hostMatch>[];
  stages?: ReturnType<typeof hostStage>[];
  tab?: string;
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
}) {
  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  window.history.replaceState(null, "", `/tournaments/1/host${options.tab ? `?tab=${options.tab}` : ""}`);
  globalThis.fetch = async (input, init) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost").pathname;
    const intercepted = await options.intercept?.(path, init);
    if (intercepted) return intercepted;
    if (path === "/api/tournaments/1") return jsonResponse({
      id: 1, name: "Turniej szkoleniowy", status: "active", format: "swiss", activeStageId: 2,
      currentRound: 5, totalRounds: 5, defaultBestOf: 3, featuredMatchId: 100,
      hasOrganizerPassword: true, resultModelVersion: "series_v1", visibility: "public_online",
    });
    if (path.endsWith("/stages")) return jsonResponse(options.stages ?? [hostStage(1, "completed"), hostStage()]);
    if (path.endsWith("/matches")) return jsonResponse(options.matches);
    if (path.endsWith("/assistant")) return jsonResponse({ stepTitle: "Wpisuj wyniki", nextAction: "Wybierz mecz" });
    if (path.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  const location = memoryLocation({ path: `/tournaments/1/host${options.tab ? `?tab=${options.tab}` : ""}` });
  render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><TournamentHost /></AuthProvider></Router></QueryClientProvider>);
  return userEvent.setup();
}

test("Host does not mistake an initial network failure for missing organizer access", async () => {
  let failed = true;
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path) =>
    path === "/api/tournaments/1" && failed ? new Response("unavailable", { status: 503 }) : undefined });
  await screen.findByRole("heading", { name: "Nie udało się pobrać turnieju" });
  assert.equal(screen.queryByRole("button", { name: "Zaloguj jako organizator" }) === null, true);
  failed = false;
  await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByRole("button", { name: "Rozpocznij mecz" });
});

test("Host retains a partial score on failure and retries the same complete result", async () => {
  const matches = [{ ...hostMatch(1), score1: 1, score2: 1 }];
  let writes = 0;
  const user = await renderOperationalHost({ matches, intercept: async (path, init) => {
    if (path !== "/api/matches/1/complete") return undefined;
    writes++;
    assert.deepEqual(JSON.parse(String(init?.body)), { resultType: "played", expectedRevision: 1, score1: 2, score2: 1 });
    if (writes === 1) return new Response("unavailable", { status: 503 });
    matches[0] = { ...matches[0], score1: 2, status: "completed", resultType: "played" };
    return jsonResponse(matches[0]);
  } });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Wpisany wynik pozostaje/);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"), false));
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" });
  assert.equal(writes, 2);
  assert.equal(screen.queryByRole("alert") === null, true);
});

test("Host refreshes a concurrent completion without reporting success or replacing it with the draft", async () => {
  const matches = [hostMatch(1)];
  let reads = 0;
  const user = await renderOperationalHost({ matches, intercept: async (path) => {
    if (path.endsWith("/matches")) reads++;
    if (path !== "/api/matches/1/complete") return undefined;
    matches[0] = { ...matches[0], status: "completed", resultType: "played", score1: 0, score2: 2 };
    return new Response(JSON.stringify({ code: "MATCH_ALREADY_FINALIZED" }), { status: 409, headers: { "content-type": "application/json" } });
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" });
  assert.ok(reads >= 2);
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten mecz ma już zapisany wynik/);
  assert.ok(screen.getByText("0:2"));
  assert.equal(screen.queryByText("Wynik zapisany!") === null, true);
});

test("Host correction identifies the saved result and returns to score entry after reverting", async () => {
  const matches = [{ ...hostMatch(1), status: "completed", resultType: "played" as const, score1: 2, score2: 1 }];
  let writes = 0;
  let finish: () => void = () => {};
  const user = await renderOperationalHost({ matches, intercept: async (path) => {
    if (path !== "/api/matches/1/revert") return undefined;
    writes++;
    await new Promise<void>((resolve) => { finish = resolve; });
    Object.assign(matches[0], { status: "pending", resultType: null, score1: 0, score2: 0 });
    return jsonResponse(matches[0]);
  } });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  const dialog = screen.getByRole("dialog");
  assert.match(dialog.textContent ?? "", /Cofnąć wynik meczu Gracz A1 – Gracz B1.*2:1.*Ranking i awans/);
  const confirm = within(dialog).getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" });
  await user.dblClick(confirm);
  assert.equal(writes, 1);
  assert.ok(confirm.matches(":disabled"));
  finish();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }));
});

test("Host match list separates identical round numbers across stages and puts LIVE first", async () => {
  await renderOperationalHost({ tab: "wyniki", matches: [hostMatch(100, 1, "completed"), hostMatch(1), hostMatch(2, 2, "in_progress")] });
  const finals = await screen.findByRole("region", { name: "Mecze: Finały szkoleniowe" });
  assert.equal(within(finals).queryByText(/Gracz A100/) === null, true);
  assert.match(finals.textContent ?? "", /Gracz A2.*LIVE.*Gracz A1.*Oczekuje/);
  assert.match(screen.getByRole("region", { name: "Mecze: Eliminacje" }).textContent ?? "", /Gracz A100.*Zakończony/);
});

test("Host protects draft scores against reload and releases the guard after discarding", async () => {
  const user = await renderOperationalHost({ matches: [hostMatch(1)] });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  const unload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, true);
  await user.click(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  const nextUnload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(nextUnload);
  assert.equal(nextUnload.defaultPrevented, false);
});

test("Host keeps a draft but requires review if a refetch changes the players", async () => {
  const matches = [hostMatch(1)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[0] = { ...matches[0], player1Id: 99, player1Name: "Nowy gracz" };
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
  await screen.findByText(/Stan meczu zmienił się od rozpoczęcia edycji/);
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
  await user.click(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  assert.equal(screen.getByRole("button", { name: "Zwiększ wynik: Nowy gracz" }).matches(":disabled"), false);
});

test("Host keeps a blocked correction open with an operational explanation and allows cancellation", async () => {
  const matches = [{ ...hostMatch(1), status: "completed", resultType: "played" as const, score1: 2 }];
  const user = await renderOperationalHost({ matches, intercept: async (path) => path.endsWith("/revert")
    ? new Response(JSON.stringify({ code: "DOWNSTREAM_BLOCKED" }), { status: 409, headers: { "content-type": "application/json" } }) : undefined });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  await user.click(screen.getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByText(/zależne mecze lub kolejna runda już się rozpoczęły/);
  await waitFor(() => assert.equal(within(dialog).getByRole("button", { name: "Zachowaj wynik" }).matches(":disabled"), false));
  await user.click(within(dialog).getByRole("button", { name: "Zachowaj wynik" }));
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  assert.ok(screen.getByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
});

test("Host keeps all results reachable after stages finish", async () => {
  const user = await renderOperationalHost({ stages: [hostStage(2, "completed")], matches: [{ ...hostMatch(1), status: "completed", resultType: "played", score1: 2 }] });
  await user.click(await screen.findByRole("link", { name: "Wszystkie mecze i wyniki" }));
  await screen.findByRole("region", { name: "Mecze: Finały szkoleniowe" });
  assert.ok(screen.getByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
});

test("Host all-match list retains legacy matches without stage assignment", async () => {
  await renderOperationalHost({ tab: "wyniki", matches: [hostMatch(1), hostMatch(90, null, "completed")] });
  const legacy = await screen.findByRole("region", { name: "Mecze: Mecze bez przypisanego etapu" });
  assert.match(legacy.textContent ?? "", /Gracz A90.*Zakończony/);
});

test("Host correction shows the downstream count supplied for the selected DE stage", async () => {
  const user = await renderOperationalHost({ stages: [{ ...hostStage(), format: "double_elimination" }],
    matches: [{ ...hostMatch(1), status: "completed", resultType: "played", score1: 2 }],
    intercept: async path => path.endsWith("/double-elimination") ? jsonResponse({ matches: [{ matchId: 1, downstreamResultCount: 3 }] }) : undefined });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  await within(screen.getByRole("dialog")).findByText(/unieważni także 3 późniejszych wyników/);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" }).matches(":disabled"), false));
});

test("Host focuses the active stage and exposes the entire queue including live matches", async () => {
  const old = hostMatch(100, 1, "completed");
  const current = Array.from({ length: 10 }, (_, index) => hostMatch(index + 1, 2, index === 1 ? "in_progress" : "pending"));
  await renderOperationalHost({ matches: [old, ...current] });
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.match(screen.getByRole("region", { name: "Stan prowadzenia" }).textContent ?? "", /Finały szkoleniowe.*Runda 1\/2/);
  assert.equal(screen.queryByText("Gracz A100"), null);
  assert.ok(screen.getByRole("button", { name: /Gracz A10 vs Gracz B10/ }));
  assert.ok(screen.getByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ }));
  assert.equal(screen.queryByText("▶ aktywny"), null);
});

test("Host next-match action follows the displayed queue order", async () => {
  const matches = [
    { ...hostMatch(1), sortOrder: 30 },
    { ...hostMatch(3), sortOrder: 20 },
    { ...hostMatch(2), sortOrder: 10 },
  ];
  const user = await renderOperationalHost({ matches });
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(screen.getByRole("button", { name: "Następny" }));
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A3" }), null);
});

test("Host advances from a completed no-contest match after the refreshed state", async () => {
  const matches = [hostMatch(1)];
  let saved = false;
  let refreshedMatchReads = 0;
  const user = await renderOperationalHost({ matches, stages: [hostStage(2, "active", "round_robin")], intercept: async (path, init) => {
    if (path === "/api/tournaments/1/matches" && saved) refreshedMatchReads++;
    if (path === "/api/matches/1/complete" && init?.method === "POST") {
      assert.equal(JSON.parse(String(init.body)).resultType, "no_contest");
      saved = true;
      matches[0] = { ...matches[0], status: "completed", resultType: "no_contest" };
      return jsonResponse(matches[0]);
    }
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: "Więcej akcji" }));
  await user.click(screen.getByRole("menuitem", { name: "Brak rozstrzygnięcia (no contest)" }));
  await user.click(screen.getByRole("button", { name: "Zapisz brak rozstrzygnięcia" }));
  // RR allows no-contest; its last completed match leads to stage completion.
  const nextStep = await screen.findByRole("region", { name: "Sprawdź zakończenie etapu" });
  assert.equal(within(nextStep).getByRole("link", { name: "Zakończ etap" }).getAttribute("href"), "/tournaments/1?tab=stages&stage=2&action=complete");
  await waitFor(() => {
    assert.equal(screen.queryByText(/Zapisywanie i odświeżanie stanu/), null);
    assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A1" }), null);
    assert.equal(screen.queryByRole("button", { name: "Zapisz brak rozstrzygnięcia" }), null);
  });
  assert.ok(refreshedMatchReads > 0, "The operational state must come from the refreshed match list");
  const summary = screen.getByRole("region", { name: "Stan prowadzenia" });
  assert.match(summary.textContent ?? "", /Finały szkoleniowe.*Runda 1\/2/);
  for (const [label, count] of [["W trakcie", "0"], ["Gotowe do gry", "0"], ["Zakończone", "1"], ["Pozostałe", "0"]]) {
    assert.equal(within(summary).getByText(label).nextElementSibling?.textContent, count);
  }
  assert.equal(screen.queryByRole("button", { name: /Gracz A1 vs Gracz B1/ }), null);
  assert.equal(screen.queryByRole("button", { name: /Wygeneruj rundę/ }), null);
  assert.equal(screen.queryByText("Brak rozstrzygnięcia — bez zwycięzcy"), null);
});

test("Host distinguishes a failed match load from an empty queue and can retry", async () => {
  let failed = true;
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path) =>
    path.endsWith("/matches") && failed ? new Response("unavailable", { status: 503 }) : undefined });
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Dane mogą być nieaktualne/);
  assert.equal(screen.queryByText(/Brak meczów gotowych/), null);
  assert.equal(screen.queryByRole("button", { name: "Rozpocznij mecz" }), null);
  failed = false;
  await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByRole("button", { name: "Rozpocznij mecz" });
  assert.equal(screen.queryByRole("alert"), null);
});

test("Host blocks repeated actions while saving and keeps an operational error on failure", async () => {
  let writes = 0;
  let finish: (response: Response) => void = () => { throw new Error("No pending request"); };
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path, init) => {
    if (path === "/api/matches/1" && init?.method === "PATCH") {
      writes++;
      return new Promise<Response>((resolve) => { finish = resolve; });
    }
    return undefined;
  } });
  const start = await screen.findByRole("button", { name: "Rozpocznij mecz" });
  await user.dblClick(start);
  await waitFor(() => assert.equal(writes, 1));
  assert.ok(start.matches(":disabled"));
  assert.match(document.body.textContent ?? "", /Zapisywanie i odświeżanie stanu/);
  finish(new Response(JSON.stringify({ code: "STAGE_NOT_ACTIVE", error: "Ten etap nie jest obecnie aktywny." }), { status: 422, headers: { "content-type": "application/json" } }));
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten etap nie jest obecnie aktywny/);
  assert.match(screen.getByRole("alert").textContent ?? "", /Kod diagnostyczny: STAGE_NOT_ACTIVE/);
  await waitFor(() => assert.equal(start.matches(":disabled"), false));
});

test("Host waits for refreshed data after saving a score before enabling further actions", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  let saved = false;
  let writes = 0;
  let releaseRead: () => void = () => { throw new Error("No pending refresh"); };
  const readBarrier = new Promise<void>((resolve) => { releaseRead = resolve; });
  const user = await renderOperationalHost({ matches, intercept: async (path, init) => {
    if (path === "/api/matches/1/complete") {
      writes++;
      assert.deepEqual(JSON.parse(String(init?.body)), { resultType: "played", expectedRevision: 1, score1: 2, score2: 0 });
      matches[0] = { ...matches[0], status: "completed", score1: 2 };
      saved = true;
      return jsonResponse(matches[0]);
    }
    if (path.endsWith("/matches") && saved) {
      await readBarrier;
      return jsonResponse(matches);
    }
    return undefined;
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus);
  await user.click(plus);
  const save = screen.getByRole("button", { name: "Zapisz wynik" });
  await user.dblClick(save);
  await waitFor(() => assert.equal(writes, 1));
  assert.ok(save.matches(":disabled"));
  releaseRead();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A2" }).matches(":disabled"), false));
  assert.match(screen.getByRole("region", { name: "Stan prowadzenia" }).textContent ?? "", /Zakończone1/);
});
