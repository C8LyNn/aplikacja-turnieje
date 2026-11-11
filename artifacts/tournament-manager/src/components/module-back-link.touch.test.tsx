import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ModuleBackLink } from "./module-back-link";

afterEach(cleanup);

test("L19: back link retains href, label, and touch target", () => {
  const loc = memoryLocation({ path: "/example" });
  render(<Router hook={loc.hook} searchHook={loc.searchHook}><ModuleBackLink href="/projects" label="Powrót do projektów" /></Router>);
  const link = screen.getByRole("link", { name: "Powrót do projektów" });
  assert.equal(link.getAttribute("href"), "/projects");
  assert.ok(link.className.includes("min-h-11"));
  assert.ok(link.className.includes("focus-visible:ring-offset-2"));
  assert.equal(link.querySelector("svg")?.getAttribute("aria-hidden"), "true");
});
