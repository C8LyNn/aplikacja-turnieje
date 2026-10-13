import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPERIMENTAL_TOURNAMENT_ROOT,
  isExperimentalTournamentPath,
  tournamentHref,
  tournamentModeHref,
  tournamentRoleHomeHref,
} from "./experimental-tournament-routing";

test("detects every experimental tournament surface", () => {
  assert.equal(isExperimentalTournamentPath("/experimental/tournaments"), true);
  assert.equal(isExperimentalTournamentPath("/experimental/tournaments/dashboard"), true);
  assert.equal(isExperimentalTournamentPath("/experimental/tournaments/12"), true);
  assert.equal(isExperimentalTournamentPath("/experimental/tournaments/12/host?tab=wyniki"), true);
  assert.equal(isExperimentalTournamentPath("/tournaments/12"), false);
  assert.equal(isExperimentalTournamentPath("/dashboard"), false);
});

test("builds stable and experimental tournament links", () => {
  assert.equal(tournamentHref(12, false), "/tournaments/12");
  assert.equal(
    tournamentHref(12, true, "/host?tab=wyniki"),
    "/experimental/tournaments/12/host?tab=wyniki",
  );
});

test("upgrades stable tournament hrefs only in experimental mode", () => {
  assert.equal(
    tournamentModeHref("/tournaments/8?tab=players", true),
    "/experimental/tournaments/8?tab=players",
  );
  assert.equal(
    tournamentModeHref("/tournaments/8?tab=players", false),
    "/tournaments/8?tab=players",
  );
  assert.equal(
    tournamentModeHref("/help", true),
    "/help",
  );
});

test("provides role homes for the parallel experimental module", () => {
  assert.equal(tournamentRoleHomeHref("organizer", false), "/dashboard");
  assert.equal(
    tournamentRoleHomeHref("organizer", true),
    `${EXPERIMENTAL_TOURNAMENT_ROOT}/dashboard`,
  );
  assert.equal(
    tournamentRoleHomeHref("support", true),
    `${EXPERIMENTAL_TOURNAMENT_ROOT}/support`,
  );
  assert.equal(
    tournamentRoleHomeHref("fan", true),
    `${EXPERIMENTAL_TOURNAMENT_ROOT}/fan`,
  );
});
