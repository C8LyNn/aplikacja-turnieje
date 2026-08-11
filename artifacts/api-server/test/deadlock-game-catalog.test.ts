import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEADLOCK_HEROES,
  parseTournamentGameConfig,
  TournamentGameConfigError,
} from "@workspace/game-catalog";

test("Deadlock catalog exposes 38 stable, unique heroes and assets", () => {
  assert.equal(DEADLOCK_HEROES.length, 38);
  assert.equal(new Set(DEADLOCK_HEROES.map((hero) => hero.id)).size, 38);
  assert.equal(new Set(DEADLOCK_HEROES.map((hero) => hero.iconKey)).size, 38);
  assert.deepEqual(
    DEADLOCK_HEROES.map((hero) => hero.displayName),
    [
      "Abrams", "Wraith", "Shiv", "Silver", "Drifter", "The Doorman",
      "Sinclair", "Grey Talon", "Mo & Krill", "Yamato", "Holliday", "Warden",
      "Mina", "Paradox", "McGinnis", "Dynamo", "Infernus", "Haze", "Mirage",
      "Rem", "Paige", "Ivy", "Venator", "Vindicta", "Viscous", "Lash", "Vyper",
      "Kelvin", "Calico", "Victor", "Graves", "Bebop", "Pocket", "Seven", "Billy",
      "Lady Geist", "Apollo", "Celeste",
    ],
  );
  assert.deepEqual(
    DEADLOCK_HEROES.find((hero) => hero.id === "rem"),
    {
      id: "rem",
      displayName: "Rem",
      iconKey: "game-assets/deadlock/heroes/rem.png",
    },
  );
});

test("every exact-cased catalog asset is a 128x128 PNG", async () => {
  for (const hero of DEADLOCK_HEROES) {
    const assetUrl = new URL(
      `../../tournament-manager/public/${hero.iconKey}`,
      import.meta.url,
    );
    const png = await readFile(assetUrl);
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), 128, `${hero.id} width`);
    assert.equal(png.readUInt32BE(20), 128, `${hero.id} height`);
  }
});

test("Deadlock config accepts no forced hero or a catalog hero", () => {
  assert.deepEqual(
    parseTournamentGameConfig({
      gameId: "deadlock",
      configVersion: 1,
      config: {},
    }),
    { gameId: "deadlock", configVersion: 1, config: {} },
  );
  assert.deepEqual(
    parseTournamentGameConfig({
      gameId: "deadlock",
      configVersion: 1,
      config: { forcedHeroId: "rem" },
    }),
    {
      gameId: "deadlock",
      configVersion: 1,
      config: { forcedHeroId: "rem" },
    },
  );
});

test("game catalog rejects unknown games, versions, heroes and fields", () => {
  const invalidValues = [
    { gameId: "other", configVersion: 1, config: {} },
    { gameId: "deadlock", configVersion: 2, config: {} },
    { gameId: "deadlock", configVersion: 1, config: { forcedHeroId: "unknown" } },
    { gameId: "deadlock", configVersion: 1, config: { picks: [] } },
    {
      gameId: "deadlock",
      configVersion: 1,
      config: { stageBans: [{ stageKey: "stage-1", bannedHeroIds: ["rem"], extra: true }] },
    },
    { gameId: "deadlock", configVersion: 1, config: {}, extra: true },
  ];
  for (const value of invalidValues) {
    assert.throws(
      () => parseTournamentGameConfig(value),
      TournamentGameConfigError,
    );
  }
});
