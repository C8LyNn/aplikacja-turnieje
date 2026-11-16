import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  DEFAULT_EXPERIMENTAL_APPEARANCE,
  EXPERIMENTAL_APPEARANCE_STORAGE_KEY,
  ExperimentalAppearanceControl,
  readExperimentalAppearance,
} from "./experimental-appearance";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-x-skin");
});
afterEach(() => cleanup());

test("defaults follow the tournament skin with its signature background and colours", () => {
  assert.deepEqual(readExperimentalAppearance(), DEFAULT_EXPERIMENTAL_APPEARANCE);
  render(<ExperimentalAppearanceControl />);
  assert.equal(document.documentElement.hasAttribute("data-x-skin"), false);
  assert.equal(document.documentElement.getAttribute("data-x-bg"), "theme");
  assert.equal(document.documentElement.getAttribute("data-x-palette"), "theme");
});

test("invalid stored values fall back to defaults", () => {
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, JSON.stringify({ skin: "neon", background: 7, palette: "triad" }));
  assert.deepEqual(readExperimentalAppearance(), { skin: "tournament", background: "theme", palette: "triad" });
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, "{broken");
  assert.deepEqual(readExperimentalAppearance(), DEFAULT_EXPERIMENTAL_APPEARANCE);
});

test("choosing skin, background and colour system applies and persists them", async () => {
  render(<ExperimentalAppearanceControl />);
  fireEvent.click(screen.getByRole("button", { name: "Wygląd: tło i kolory" }));
  fireEvent.click(await screen.findByRole("radio", { name: "Pustka" }));
  fireEvent.click(screen.getByRole("radio", { name: /Siatka areny/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Triada/ }));
  assert.equal(document.documentElement.getAttribute("data-x-skin"), "void");
  assert.equal(document.documentElement.getAttribute("data-x-bg"), "grid");
  assert.equal(document.documentElement.getAttribute("data-x-palette"), "triad");
  assert.deepEqual(JSON.parse(localStorage.getItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY) ?? "{}"), {
    skin: "void",
    background: "grid",
    palette: "triad",
  });

  fireEvent.click(screen.getByRole("button", { name: "Przywróć domyślne" }));
  assert.equal(document.documentElement.hasAttribute("data-x-skin"), false);
  assert.equal(document.documentElement.getAttribute("data-x-bg"), "theme");
});
