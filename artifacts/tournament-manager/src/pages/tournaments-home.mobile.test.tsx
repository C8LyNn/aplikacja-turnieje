import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import TournamentsHome from "./tournaments-home";

afterEach(() => { cleanup(); sessionStorage.clear(); localStorage.clear(); });

test("L22: mobile role cards are compact, desktop layout remains unchanged", () => {
  const location = memoryLocation({ path: "/tournaments" });
  render(<TestAuthProvider><Router hook={location.hook} searchHook={location.searchHook}><TournamentsHome /></Router></TestAuthProvider>);
  for (const name of ["Organizator", "Pomoc", "Widz"]) {
    const card = screen.getByRole("button", { name: new RegExp(name) });
    assert.ok(card.className.includes("min-h-[148px]"));
    assert.ok(card.className.includes("sm:min-h-56"));
    assert.ok(card.className.includes("p-4 sm:p-6"));
  }
  assert.ok(screen.getByRole("button", { name: /Wszystkie kategorie/ }).className.includes("min-h-11"));
});
