import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReadQueryState } from "./read-query-state";

afterEach(cleanup);

const messages = { loadingMessage: "Ładowanie tabeli…", errorMessage: "Błąd pobierania tabeli." };

test("L11-UI-01: error offers a working retry button without form submission", () => {
  let retries = 0;
  let formSubmits = 0;
  render(<form onSubmit={e => { e.preventDefault(); formSubmits++; }}><ReadQueryState {...messages}
    query={{ data: undefined, error: new Error("offline"), isFetching: false, refetch: () => { retries++; } }} />
  </form>);
  const button = screen.getByRole("button", { name: "Spróbuj ponownie" });
  assert.equal(button.getAttribute("type"), "button");
  assert.equal((button as HTMLButtonElement).disabled, false);
  fireEvent.click(button);
  assert.equal(retries, 1);
  assert.equal(formSubmits, 0);
});

test("L11-UI-02: retry in progress shows feedback and blocks repeated submission", () => {
  let retries = 0;
  render(<ReadQueryState {...messages} query={{ data: undefined, error: new Error("offline"), isFetching: true,
    refetch: () => { retries++; } }} />);
  const button = screen.getByRole("button", { name: "Ponawianie…" }) as HTMLButtonElement;
  assert.equal(button.disabled, true);
  assert.ok(button.querySelector("svg[aria-hidden='true']"));
  fireEvent.click(button);
  assert.equal(retries, 0);
});

test("L11-UI-03: cached data remains on screen with stale-data warning", () => {
  render(<ReadQueryState {...messages} query={{ data: { count: 8 }, error: new Error("offline"), isFetching: false,
    refetch: () => {} }}><span>8 uczestników</span></ReadQueryState>);
  assert.match(screen.getByRole("alert").textContent ?? "", /ostatnio pobrane dane/i);
  assert.ok(screen.getByText("8 uczestników"));
});

test("L11-UI-04: initial loading uses status and does not show stale data", () => {
  render(<ReadQueryState {...messages} query={{ data: undefined, error: null, isFetching: true,
    refetch: () => {} }}><span>Nie pokazuj</span></ReadQueryState>);
  assert.match(screen.getByRole("status").textContent ?? "", /Ładowanie tabeli/);
  assert.equal(screen.queryByText("Nie pokazuj"), null);
});
