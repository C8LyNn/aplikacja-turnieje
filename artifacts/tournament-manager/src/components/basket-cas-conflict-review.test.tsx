import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BasketCasDraftView } from "@/lib/stage-basket-cas-draft";
import { BasketCasConflictReview } from "./basket-cas-conflict-review";

afterEach(cleanup);

const draft = (colorId: string | null) => ({
  baskets: [
    { id: "basket-7", stageId: 7, type: "input" as const,
      ordinal: 1, order: 1, colorId, participantIds: [1, 2], qualifierCount: null },
  ],
  routes: [{ id: "route-1", sourceBasketId: "basket-7", targetBasketId: "basket-8" }],
});

function view(phase: BasketCasDraftView["phase"]): BasketCasDraftView {
  return {
    scope: { tournamentId: 41, authContextId: "organizer-epoch-1" },
    phase, localDraft: draft("purple"),
    remoteCanonical: phase === "reviewing" ? draft("green") : null,
    changes: phase === "reviewing"
      ? [{ type: "basket", id: "basket-7", change: "modified" }]
      : [],
    dependencyMayHaveChanged: true,
    saving: false,
    refreshing: false,
  } as BasketCasDraftView;
}

test("CAS-UI-01 conflict retains local draft; only explicit remote refresh is available", async () => {
  let refreshed = 0;
  const reconciliations: string[] = [];
  render(<BasketCasConflictReview
    view={view("conflict")}
    onRefreshRemote={() => { refreshed++; }}
    onReconcile={(choice) => { reconciliations.push(choice); }}
  />);
  assert.ok(screen.getByText(/lokalny szkic pozostaje zachowany/));
  assert.ok(screen.getByRole("status").textContent?.includes("uczestnicy"));
  assert.equal(screen.queryByRole("button", { name: /Zachowaj mój szkic/ }), null);
  await userEvent.click(screen.getByRole("button", { name: /Odśwież wersję serwerową/ }));
  assert.equal(refreshed, 1);
  assert.deepEqual(reconciliations, []);
});

test("CAS-UI-02 reviewing shows side-by-side values and explicit keep-local action", async () => {
  const actions: string[] = [];
  let refreshed = 0;
  render(<BasketCasConflictReview
    view={view("reviewing")}
    onRefreshRemote={() => { refreshed++; }}
    onReconcile={(choice) => actions.push(choice)}
  />);
  assert.ok(screen.getByRole("region", { name: "Lokalny szkic" }).textContent?.includes("purple"));
  assert.ok(screen.getByRole("region", { name: "Aktualna wersja serwera" }).textContent?.includes("green"));
  assert.ok(screen.getByText(/basket-7: różne wartości/));
  assert.ok(screen.getByText(/Żadna opcja nie wykonuje HTTP PUT/));
  await userEvent.click(screen.getByRole("button", { name: /Zachowaj mój szkic/ }));
  assert.deepEqual(actions, ["keep-local"]);
  assert.equal(refreshed, 0);
});

test("CAS-UI-03 remote discard requires a distinct user click, never automatic", async () => {
  const actions: string[] = [];
  render(<BasketCasConflictReview view={view("reviewing")}
    onRefreshRemote={() => {}}
    onReconcile={(choice) => actions.push(choice)} />);
  assert.deepEqual(actions, []);
  await userEvent.click(screen.getByRole("button", { name: /Odrzuć mój szkic/ }));
  assert.deepEqual(actions, ["use-remote"]);
});

test("CAS-UI-04 saving phase disables reconciliation controls", () => {
  render(<BasketCasConflictReview
    view={{ ...view("reviewing"), saving: true }}
    onRefreshRemote={() => {}}
    onReconcile={() => assert.fail("saving must disable actions")}
  />);
  assert.equal(
    (screen.getByRole("button", { name: /Zachowaj mój szkic/ }) as HTMLButtonElement).disabled,
    true,
  );
  assert.equal(
    (screen.getByRole("button", { name: /Odrzuć mój szkic/ }) as HTMLButtonElement).disabled,
    true,
  );
});

test("CAS-UI-05 no conflict means no new production-facing CAS UI", () => {
  const { container } = render(<BasketCasConflictReview
    view={view("editing")}
    onRefreshRemote={() => {}}
    onReconcile={() => {}}
  />);
  assert.equal(container.innerHTML, "");
});


test("R23D-74-06 auth-blocked view shows safe retry without rendering local or remote basket data", async () => {
  let retried = 0;
  const blocked: BasketCasDraftView = {
    ...view("reviewing"),
    phase: "authorization-blocked",
    authorizationFailure: 403,
    localDraft: null,
    remoteCanonical: null,
    changes: [],
  };
  const { container } = render(<BasketCasConflictReview
    view={blocked}
    onRefreshRemote={() => { retried++; }}
    onReconcile={() => assert.fail("must not reconcile while access is denied")}
  />);
  assert.ok(screen.getByRole("alert").textContent?.includes("Brak dostępu"));
  assert.equal(container.textContent?.includes("purple"), false);
  assert.equal(container.textContent?.includes("green"), false);
  assert.equal(container.textContent?.includes("basket-7"), false);
  assert.equal(screen.queryByRole("button", { name: /Zachowaj mój szkic/ }), null);
  await userEvent.click(screen.getByRole("button", { name: /Ponów autoryzowane pobranie/ }));
  assert.equal(retried, 1);
});


test("WAVE2-04 pending canonical GET disables stale review decisions and duplicate refreshes", async () => {
  const invoked: string[] = [];
  render(<BasketCasConflictReview
    view={{ ...view("reviewing"), refreshing: true }}
    onRefreshRemote={() => invoked.push("refresh")}
    onReconcile={(action) => invoked.push(action)}
  />);
  assert.ok(screen.getByText(/Pobieranie aktualnej wersji/));
  for (const name of [/Zachowaj mój szkic/, /Odrzuć mój szkic/, /Odśwież porównanie/]) {
    const button = screen.getByRole("button", { name }) as HTMLButtonElement;
    assert.equal(button.disabled, true, String(name));
    await userEvent.click(button);
  }
  assert.deepEqual(invoked, []);
});

test("WAVE2-05 GET 401/403 quarantine prevents repeated reauthorization fetch while pending", async () => {
  let calls = 0;
  render(<BasketCasConflictReview
    view={{
      ...view("authorization-blocked"),
      authorizationFailure: 403,
      localDraft: null,
      remoteCanonical: null,
      refreshing: true,
    }}
    onRefreshRemote={() => { calls++; }}
    onReconcile={() => assert.fail("must not expose blocked reconciliation")}
  />);
  const button = screen.getByRole("button", { name: /Ponów autoryzowane pobranie/ }) as HTMLButtonElement;
  assert.equal(button.disabled, true);
  await userEvent.click(button);
  assert.equal(calls, 0);
});
