import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeadlockTournamentGameConfig } from "@workspace/api-client-react";
import {
  ForcedHeroBadge,
  GameConfigPicker,
} from "./deadlock-game-config";
import { BracketView } from "./bracket-view";

afterEach(cleanup);

function PickerHarness() {
  const [value, setValue] = useState<DeadlockTournamentGameConfig | null>(null);
  return (
    <>
      <GameConfigPicker value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </>
  );
}

test("picker initialises with shared_pool ban mode and 5 bans per player", async () => {
  render(<PickerHarness />);
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));

  // default values — nothing persisted yet; config object is empty {}
  const parsed = JSON.parse(screen.getByTestId("value").textContent ?? "null");
  assert.equal(parsed.gameId, "deadlock");
  assert.equal(parsed.configVersion, 1);

  // shared_pool card should be highlighted
  const sharedPoolBtn = screen.getByText("Wspólna pula banów").closest("button")!;
  assert.ok(sharedPoolBtn.className.includes("border-primary"));

  // stepper shows 5
  assert.ok(screen.getByText("5"));
});

test("switching ban mode updates persisted config", async () => {
  render(<PickerHarness />);
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));

  await userEvent.click(screen.getByText("Bany przeciwnika").closest("button")!);
  const parsed = JSON.parse(screen.getByTestId("value").textContent ?? "null") as {
    config: { banMode?: string };
  };
  assert.equal(parsed.config.banMode, "opponent_only");
});

test("bans-per-player stepper increments and decrements", async () => {
  render(<PickerHarness />);
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));

  const plus = screen.getByRole("button", { name: "Zwiększ liczbę banów" });
  const minus = screen.getByRole("button", { name: "Zmniejsz liczbę banów" });

  await userEvent.click(plus);
  const after = JSON.parse(screen.getByTestId("value").textContent ?? "null") as {
    config: { bansPerPlayer?: number };
  };
  assert.equal(after.config.bansPerPlayer, 6);

  await userEvent.click(minus);
  const after2 = JSON.parse(screen.getByTestId("value").textContent ?? "null") as {
    config: { bansPerPlayer?: number };
  };
  assert.equal(after2.config.bansPerPlayer, 5);
});

test("read-only label renders hero name and has a graceful missing-icon fallback", () => {
  const { container } = render(
    <ForcedHeroBadge
      gameConfig={{
        gameId: "deadlock",
        configVersion: 1,
        config: { forcedHeroId: "rem" },
      }}
    />,
  );
  assert.match(screen.getByText(/Rem/).textContent ?? "", /Rem/);
  const image = container.querySelector("img");
  assert.ok(image);
  fireEvent.error(image);
  assert.ok(screen.getByLabelText("Rem — brak ikony"));
});

test("no game config preserves the empty legacy presentation", () => {
  const { container } = render(<ForcedHeroBadge />);
  assert.equal(container.textContent, "");
});

test("game picker is read-only after tournament start", () => {
  render(
    <GameConfigPicker
      value={{ gameId: "deadlock", configVersion: 1, config: { forcedHeroId: "rem" } }}
      onChange={() => assert.fail("read-only picker changed")}
      disabled
    />,
  );
  assert.equal((screen.getByLabelText("Gra (opcjonalnie)") as HTMLButtonElement).disabled, true);
  // Ban mode buttons must be disabled
  const banModeButtons = screen.getAllByRole("button").filter(
    (b) => b.className.includes("rounded-lg border p-3"),
  );
  for (const btn of banModeButtons) {
    assert.equal((btn as HTMLButtonElement).disabled, true);
  }
});

test("bracket match shows a compact forced-hero icon", () => {
  const { container } = render(
    <BracketView
      forcedHeroId="rem"
      bracket={{
        tournament: {
          id: 1,
          name: "Deadlock bracket",
          format: "single_elimination",
          status: "active",
          resultModelVersion: "series_v1",
          rankingPolicy: "match_record_v1",
          defaultBestOf: 1,
          hasHostCode: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        rounds: [{
          round: 1,
          matches: [{
            id: 1,
            tournamentId: 1,
            stageId: 1,
            round: 1,
            matchNumber: 1,
            bestOf: 1,
            status: "pending",
          }],
        }],
        winner: null,
      }}
    />,
  );
  const image = container.querySelector('img[src$="/game-assets/deadlock/heroes/rem.png"]');
  assert.ok(image);
});
