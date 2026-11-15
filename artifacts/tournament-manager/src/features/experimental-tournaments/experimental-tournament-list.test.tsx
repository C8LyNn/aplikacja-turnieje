import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ExperimentalTournamentList, type ExperimentalTournamentListItem } from "./experimental-tournament-list";

afterEach(() => cleanup());
const items: ExperimentalTournamentListItem[] = [
  { id: 1, name: "Archiwum", status: "completed", format: "swiss", createdAt: "2026-11-01T10:00:00Z" },
  { id: 2, name: "Szkic ligi", status: "draft", format: "round_robin", createdAt: "2026-11-02T10:00:00Z", description: "" },
  { id: 3, name: "Finały", status: "active", format: "single_elimination", createdAt: "2026-11-03T10:00:00Z", currentRound: 2, totalRounds: 3, maxPlayers: 8 },
];
const labels = { swiss: "System szwajcarski", round_robin: "Każdy z każdym", single_elimination: "Drabinka eliminacyjna" };
function mount(statusFilter: "all" | "draft" | "active" | "completed" = "all", onDelete = (_id: number) => {}, exportable: number[] = []) {
  const location = memoryLocation({ path: "/experimental/tournaments/dashboard" });
  return render(
    <Router hook={location.hook}>
      <ExperimentalTournamentList
        tournaments={items}
        statusFilter={statusFilter}
        formatLabels={labels}
        canExport={(id) => exportable.includes(id)}
        exportingId={null}
        onExport={() => {}}
        onDelete={onDelete}
      />
    </Router>,
  );
}

test("live tournaments come first, then drafts, then completed", () => {
  mount();
  const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent?.replace(/\d+$/, ""));
  assert.deepEqual(headings, ["Trwające", "W przygotowaniu", "Zakończone"]);
  const live = screen.getByRole("region", { name: /Trwające/ });
  assert.ok(within(live).getByRole("link", { name: "Finały" }).getAttribute("href")?.endsWith("/experimental/tournaments/3"));
  assert.ok(within(live).getByText("Runda 2 z 3"));
});

test("no placeholder text and only real metadata is shown", () => {
  mount();
  assert.equal(screen.queryByText("Brak opisu."), null);
  assert.equal(screen.queryByText(/Maks/), null);
  assert.ok(screen.getByText("8 miejsc"));
});

test("actions are always present and named after their tournament", () => {
  const deleted: number[] = [];
  mount("all", (id) => deleted.push(id), [3]);
  assert.ok(screen.getByRole("button", { name: "Pobierz backup turnieju Finały" }));
  assert.equal(screen.queryByRole("button", { name: "Pobierz backup turnieju Archiwum" }), null);
  fireEvent.click(screen.getByRole("button", { name: "Usuń turniej Szkic ligi" }));
  assert.deepEqual(deleted, [2]);
});

test("a status filter shows only that group, with an explicit empty message", () => {
  mount("active");
  assert.deepEqual(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent?.replace(/\d+$/, "")), ["Trwające"]);
  assert.equal(screen.queryByRole("link", { name: "Archiwum" }), null);
});
