import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  DEFAULT_EXPERIMENTAL_APPEARANCE,
  EXPERIMENTAL_APPEARANCE_CUSTOM_KEY,
  EXPERIMENTAL_APPEARANCE_PRESETS,
  EXPERIMENTAL_APPEARANCE_STORAGE_KEY,
  ExperimentalAppearanceControl,
  normalizeExperimentalAppearance,
  readCustomAppearances,
  readExperimentalAppearance,
} from "./experimental-appearance";

const attr = (name: string) => document.documentElement.getAttribute(name);
const stored = () => JSON.parse(localStorage.getItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY) ?? "null");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-x-skin");
});
afterEach(() => cleanup());

function openPanel() {
  render(<ExperimentalAppearanceControl />);
  fireEvent.click(screen.getByRole("button", { name: "Wygląd: tło i kolory" }));
}

test("defaults follow the tournament skin with its signature background and colours", () => {
  assert.deepEqual(readExperimentalAppearance(), DEFAULT_EXPERIMENTAL_APPEARANCE);
  render(<ExperimentalAppearanceControl />);
  assert.equal(document.documentElement.hasAttribute("data-x-skin"), false);
  assert.equal(attr("data-x-bg"), "theme");
  assert.equal(attr("data-x-palette"), "theme");
  assert.equal(attr("data-x-type"), "arena");
  assert.equal(attr("data-x-shape"), "arena");
  assert.equal(attr("data-x-cards"), "glass");
  assert.equal(attr("data-x-fx"), "full");
  assert.equal(attr("data-x-motion"), "system");
  assert.equal(attr("data-x-contrast"), "standard");
});

test("invalid stored values fall back to defaults; V1 settings keep working", () => {
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, JSON.stringify({ skin: "neon", background: 7, palette: "triad", shape: "blob" }));
  assert.deepEqual(readExperimentalAppearance(), { ...DEFAULT_EXPERIMENTAL_APPEARANCE, palette: "triad" });
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, "{broken");
  assert.deepEqual(readExperimentalAppearance(), DEFAULT_EXPERIMENTAL_APPEARANCE);
});

test("details preview immediately and persist only after Zastosuj", async () => {
  openPanel();
  fireEvent.click(await screen.findByRole("tab", { name: "Szczegóły" }));
  fireEvent.click(screen.getByRole("radio", { name: "Pustka" }));
  fireEvent.click(screen.getByRole("radio", { name: /Siatka areny/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Triada/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Ostre/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Techniczny/ }));
  assert.equal(attr("data-x-skin"), "void");
  assert.equal(attr("data-x-bg"), "grid");
  assert.equal(attr("data-x-shape"), "sharp");
  assert.equal(stored(), null, "nothing is saved during preview");
  assert.ok(screen.getByText(/Podgląd — kliknij „Zastosuj”/));
  fireEvent.click(screen.getByRole("button", { name: "Zastosuj" }));
  assert.deepEqual(stored(), { ...DEFAULT_EXPERIMENTAL_APPEARANCE, skin: "void", background: "grid", palette: "triad", shape: "sharp", typography: "technical" });

  fireEvent.click(screen.getByRole("button", { name: "Przywróć domyślne" }));
  assert.equal(document.documentElement.hasAttribute("data-x-skin"), false);
  assert.equal(attr("data-x-bg"), "theme");
  fireEvent.click(screen.getByRole("button", { name: "Zastosuj" }));
  assert.deepEqual(stored(), DEFAULT_EXPERIMENTAL_APPEARANCE);
});

test("Anuluj reverts the preview to the saved appearance", async () => {
  openPanel();
  fireEvent.click(await screen.findByRole("tab", { name: "Szczegóły" }));
  fireEvent.click(screen.getByRole("radio", { name: /Okrągłe/ }));
  assert.equal(attr("data-x-shape"), "round");
  fireEvent.click(screen.getByRole("button", { name: "Anuluj" }));
  assert.equal(attr("data-x-shape"), "arena");
  assert.equal(stored(), null);
});

test("ready-made sets apply in one click and keep the chosen skin", async () => {
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, JSON.stringify({ skin: "toxic" }));
  openPanel();
  // V5.8: the sets are grouped in families.
  assert.ok(await screen.findByRole("group", { name: "Arena: Futurystycznie i kolorowo" }));
  assert.ok(screen.getByRole("group", { name: "Wygoda: Czytelność i spokój" }));
  // A set without its own skin keeps the chosen one (V5.8: "Czytelny"; "Minimal pro" now has its own steel skin).
  fireEvent.click(await screen.findByRole("button", { name: /Czytelny/ }));
  assert.equal(attr("data-x-skin"), "toxic");
  assert.equal(attr("data-x-bg"), "carbon");
  assert.equal(attr("data-x-fx"), "subtle");
  assert.equal(attr("data-x-cards"), "solid");
  assert.equal(screen.getByRole("button", { name: /Czytelny/ }).getAttribute("aria-pressed"), "true");
  fireEvent.click(screen.getByRole("button", { name: /Minimal pro/ }));
  assert.equal(attr("data-x-skin"), "iron-citadel", "a set with its own skin brings it");
  assert.equal(attr("data-x-cards"), "solid");
  fireEvent.click(screen.getByRole("button", { name: "Zastosuj" }));
  assert.equal(stored().palette, "mono");
  assert.equal(EXPERIMENTAL_APPEARANCE_PRESETS.length >= 6, true);
  // V5.8: every set belongs to a family shown as a group in the studio.
  assert.ok(EXPERIMENTAL_APPEARANCE_PRESETS.every((preset) => typeof preset.family === "string" && preset.family.length > 0));
});

test("high contrast never combines with translucent glass or full effects", async () => {
  assert.deepEqual(
    normalizeExperimentalAppearance({ contrast: "high", cards: "glass", effects: "full" }),
    { ...DEFAULT_EXPERIMENTAL_APPEARANCE, contrast: "high", cards: "solid", effects: "subtle" },
  );
  assert.equal(normalizeExperimentalAppearance({ contrast: "high", cards: "outline", effects: "off" }).cards, "outline");
  openPanel();
  fireEvent.click(await screen.findByRole("tab", { name: "Szczegóły" }));
  fireEvent.click(screen.getByRole("radio", { name: /Wysoki/ }));
  assert.equal(attr("data-x-contrast"), "high");
  assert.equal(attr("data-x-cards"), "solid");
  assert.ok(screen.getByText(/Wysoki kontrast zamienia szkło na pełne karty/));
});

test("custom sets can be saved, reapplied and removed (max five)", async () => {
  openPanel();
  fireEvent.click(await screen.findByRole("button", { name: /Neon/ }));
  fireEvent.change(screen.getByLabelText("Nazwa własnego zestawu"), { target: { value: "Na stream" } });
  fireEvent.click(screen.getByRole("button", { name: /Zapisz obecny/ }));
  assert.equal(readCustomAppearances()[0].label, "Na stream");
  assert.equal(readCustomAppearances()[0].values.background, "grid");
  fireEvent.click(screen.getByRole("button", { name: /^Arena/ }));
  assert.equal(attr("data-x-bg"), "theme");
  fireEvent.click(screen.getByRole("button", { name: "Na stream" }));
  assert.equal(attr("data-x-bg"), "grid");
  for (let index = 0; index < 6; index += 1) fireEvent.click(screen.getByRole("button", { name: /Zapisz obecny/ }));
  assert.equal(readCustomAppearances().length, 5);
  fireEvent.click(screen.getAllByRole("button", { name: /Usuń zestaw/ })[0]);
  assert.equal(readCustomAppearances().length, 4);
  localStorage.setItem(EXPERIMENTAL_APPEARANCE_CUSTOM_KEY, "{oops");
  assert.deepEqual(readCustomAppearances(), []);
});
