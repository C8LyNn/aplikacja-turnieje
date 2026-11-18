import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import ExperimentalUiCatalog from "./ui-catalog";

afterEach(() => { cleanup(); window.localStorage.clear(); document.documentElement.removeAttribute("data-x-skin"); });

function renderCatalog() {
  const location = memoryLocation({ path: "/experimental/tournaments/katalog" });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Router hook={location.hook}><AuthProvider><ExperimentalUiCatalog /></AuthProvider></Router>
    </QueryClientProvider>,
  );
}

test("V5.8 catalog: every shared state is on one page; a set is previewed, never saved, and undone on leaving", () => {
  const view = renderCatalog();
  for (const name of ["Przyciski", "Stany i komunikaty", "Liczniki", "Formularz", "Edytor setów", "Tabela wyników", "Dialog i powiadomienia"]) {
    assert.ok(screen.getByRole("region", { name }), name);
  }
  assert.ok(screen.getByRole("region", { name: "Konflikt zapisu wyniku" }));
  fireEvent.click(screen.getByRole("button", { name: "Transmisja TV" }));
  assert.equal(document.documentElement.getAttribute("data-x-skin"), "crimson-vault");
  assert.equal(window.localStorage.getItem("tm_exp_appearance_v1"), null, "a preview is not saved");
  view.unmount();
  assert.equal(document.documentElement.getAttribute("data-x-skin"), null, "leaving restores the user's own appearance");
});
