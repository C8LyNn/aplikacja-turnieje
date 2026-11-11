import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { OrganizerNextStep } from "./organizer-next-step";
import type { OrganizerNextStepModel } from "@/lib/organizer-next-step";

const step: OrganizerNextStepModel = {
  kind: "complete_stage",
  title: "Zatwierdź etap",
  description: "Sprawdź wyniki przed zakończeniem etapu.",
  actionLabel: "Zakończ etap",
};
const navigationStep: OrganizerNextStepModel = { ...step, actionHref: "/tournaments/77?tab=stages" };
function view(model: OrganizerNextStepModel, pending = false, onAction?: () => void) {
  const location = memoryLocation({ path: "/tournaments/77" });
  return <Router hook={location.hook} searchHook={location.searchHook}>
    <OrganizerNextStep step={model} pending={pending} onAction={onAction} />
  </Router>;
}
afterEach(cleanup);

test("L14-RTL-01: callback button is active before pending and clicks only once", async () => {
  const user = userEvent.setup();
  let calls = 0;
  const ui = render(view(step, false, () => { calls++; }));
  await user.click(screen.getByRole("button", { name: "Zakończ etap" }));
  assert.equal(calls, 1);
  ui.rerender(view(step, true, () => { calls++; }));
  const busy = screen.getByRole("button", { name: "Wykonywanie…" }) as HTMLButtonElement;
  assert.equal(busy.disabled, true);
  assert.equal(busy.getAttribute("aria-busy"), "true");
  assert.match(screen.getByRole("status").textContent ?? "", /Trwa wykonywanie następnego kroku/);
});

test("L14-RTL-02: returning from pending restores action label and removes status", () => {
  const callback = () => {};
  const ui = render(view(step, true, callback));
  assert.ok(screen.getByRole("status"));
  ui.rerender(view(step, false, callback));
  const button = screen.getByRole("button", { name: "Zakończ etap" }) as HTMLButtonElement;
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute("aria-busy"), "false");
  assert.equal(screen.queryByRole("status"), null);
});

test("L14-RTL-03: navigation-only action does not show pending status or replace its href", () => {
  render(view(navigationStep, true));
  const link = screen.getByRole("link", { name: "Zakończ etap" }) as HTMLAnchorElement;
  assert.match(link.getAttribute("href") ?? "", /\/tournaments\/77\?tab=stages$/);
  assert.equal(screen.queryByRole("status"), null);
});
