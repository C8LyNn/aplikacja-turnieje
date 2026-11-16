import test from "node:test";
import assert from "node:assert/strict";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { ExperimentalDashboardStats } from "@/features/experimental-tournaments/experimental-dashboard-stats";
import { monogram } from "@/features/experimental-tournaments/experimental-tournament-list";

const counts = { all: 11, active: 6, draft: 3, completed: 2 };

test.afterEach(() => cleanup());

test("summary tiles show lifecycle counts and act as filter toggles", () => {
  const calls: string[] = [];
  render(<ExperimentalDashboardStats counts={counts} status="all" onStatusChange={(s) => calls.push(s)} />);
  const active = screen.getByRole("button", { name: /6\s*Trwające/ });
  assert.equal(active.getAttribute("aria-pressed"), "false");
  fireEvent.click(active);
  fireEvent.click(screen.getByRole("button", { name: /2\s*Zakończone/ }));
  assert.deepEqual(calls, ["active", "completed"]);
});

test("pressing the active tile again clears the filter", () => {
  const calls: string[] = [];
  render(<ExperimentalDashboardStats counts={counts} status="draft" onStatusChange={(s) => calls.push(s)} />);
  const draft = screen.getByRole("button", { name: /3\s*W przygotowaniu/ });
  assert.equal(draft.getAttribute("aria-pressed"), "true");
  fireEvent.click(draft);
  assert.deepEqual(calls, ["all"]);
});

test("monogram takes initials from words that start with a letter", () => {
  assert.equal(monogram("Winter Clash 2026 · CS2"), "WC");
  assert.equal(monogram("Nocny Cup · Tekken 8"), "NC");
  assert.equal(monogram("2026"), "20");
  assert.equal(monogram("łódź"), "ŁÓ");
});
