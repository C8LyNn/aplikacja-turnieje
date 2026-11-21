// #326-C · the Laboratory compares draw presenters on one fixed demo draw, keeps its choices in the address,
// labels every experiment with its status and never sends a request.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import LaboratoryPage, { DEMO_DRAWS, LAB_EXPERIMENTS } from "@/pages/laboratory";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

test("#326-C Laboratory: catalog with statuses, same demo result in both panes, replay identical, no requests", async () => {
  let requests = 0;
  globalThis.fetch = (async () => { requests += 1; return new Response("{}"); }) as typeof fetch;
  const location = memoryLocation({ path: "/laboratorium?eksperyment=losowania&a=automat&b=skan", record: true });
  render(<Router hook={location.hook}><LaboratoryPage /></Router>);
  const catalog = screen.getByTestId("lab-catalog");
  assert.equal(within(catalog).getAllByRole("button").length, LAB_EXPERIMENTS.length);
  for (const status of ["PROTOTYPE", "TESTED", "STABLE_CANDIDATE", "STABLE"]) assert.ok(screen.getAllByText(status).length > 0, status);
  assert.equal((screen.getByRole("combobox", { name: "Wariant A" }) as HTMLSelectElement).value, "automat", "the choice lives in the address");
  fireEvent.click(screen.getByRole("button", { name: /Ujawnij kolejny/ }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż wynik od razu/ }));
  const results = () => screen.getAllByTestId("draw-presenter-result").map((el) => el.textContent);
  await waitFor(() => assert.deepEqual(results(), [`${DEMO_DRAWS[0].subject}: ${DEMO_DRAWS[0].result}`, `${DEMO_DRAWS[0].subject}: ${DEMO_DRAWS[0].result}`]));
  fireEvent.click(screen.getByRole("button", { name: /Od początku/ }));
  fireEvent.click(screen.getByRole("button", { name: /Ujawnij kolejny/ }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż wynik od razu/ }));
  await waitFor(() => assert.deepEqual(results()[0], `${DEMO_DRAWS[0].subject}: ${DEMO_DRAWS[0].result}`, "a replay shows the identical result"));
  fireEvent.change(screen.getByRole("combobox", { name: "Wariant B" }), { target: { value: "kule" } });
  assert.match(location.history!.at(-1)!, /b=kule/);
  fireEvent.click(within(catalog).getByText("Marble / Pinball v24 (HTML)"));
  assert.match(screen.getByTestId("lab-detail").textContent ?? "", /zostaje prototypem/);
  assert.ok(screen.getByRole("link", { name: /Wyjdź z Laboratorium/ }));
  assert.equal(requests, 0, "the Laboratory never talks to the API");
});
