import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeadlockTournamentGameConfig } from "@workspace/api-client-react";
import { DEADLOCK_HEROES } from "@workspace/game-catalog";
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

test("picker exposes the complete Deadlock catalog and optional forced hero", async () => {
  render(<PickerHarness />);
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));

  assert.equal(screen.getAllByRole("button", { pressed: false }).length >= 38, true);
  await userEvent.click(screen.getByRole("button", { name: "Rem" }));
  assert.deepEqual(JSON.parse(screen.getByTestId("value").textContent ?? "null"), {
    gameId: "deadlock",
    configVersion: 1,
    config: { forcedHeroId: "rem" },
  });

  await userEvent.click(screen.getByRole("button", { name: "Rem" }));
  assert.deepEqual(JSON.parse(screen.getByTestId("value").textContent ?? "null"), {
    gameId: "deadlock",
    configVersion: 1,
    config: {},
  });
});

test("each of the 38 heroes can be selected", async () => {
  render(<PickerHarness />);
  await userEvent.click(screen.getByLabelText("Gra (opcjonalnie)"));
  await userEvent.click(screen.getByRole("option", { name: "Deadlock" }));
  for (const hero of DEADLOCK_HEROES) {
    await userEvent.click(screen.getByRole("button", { name: hero.displayName }));
    const value = JSON.parse(screen.getByTestId("value").textContent ?? "null") as {
      config: { forcedHeroId?: string };
    };
    assert.equal(value.config.forcedHeroId, hero.id);
  }
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
  assert.equal((screen.getByRole("button", { name: "Rem" }) as HTMLButtonElement).disabled, true);
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
