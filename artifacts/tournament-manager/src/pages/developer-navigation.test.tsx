import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import DeveloperPage from "./developer";

afterEach(cleanup);

test("DEV tools link opens the bundled Animated Effects editor at its stable path", () => {
  render(<Router><DeveloperPage /></Router>);
  const link = screen.getByRole("link", { name: /Animated Effects.*Efekty streamowe/i });
  assert.equal(link.getAttribute("href"), "/dev/animated-effects/");
  assert.ok(screen.getByText("DEV / NARZĘDZIA"));
});