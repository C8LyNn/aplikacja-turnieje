import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import { AppLogoLink, RoleSelectionLink } from "./app-navigation";

afterEach(() => { cleanup(); sessionStorage.clear(); localStorage.clear(); });

test("L20: standard selection route has aria-current only on destination", () => {
  const loc = memoryLocation({ path: "/tournaments/stable" });
  const ui = render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><RoleSelectionLink /></Router></TestAuthProvider>);
  const link = screen.getByRole("link", { name: "Zmień rolę turniejową" });
  assert.equal(link.getAttribute("href"), "/tournaments/stable");
  assert.equal(link.getAttribute("aria-current"), "page");
  assert.ok(link.className.includes("min-h-11"));
  loc.navigate("/fan");
  ui.rerender(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><RoleSelectionLink /></Router></TestAuthProvider>);
  assert.equal(screen.getByRole("link", { name: "Zmień rolę turniejową" }).hasAttribute("aria-current"), false);
});

test("L20: logo marks home only on matching current location", () => {
  const loc = memoryLocation({ path: "/" });
  render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><AppLogoLink /></Router></TestAuthProvider>);
  const link = screen.getByRole("link", { name: "Strona główna aktualnej roli" });
  assert.equal(link.getAttribute("href"), "/");
  assert.equal(link.getAttribute("aria-current"), "page");
});
