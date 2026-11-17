import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  canAddMember,
  normaliseMemberName,
  rosterIssues,
  rosterReady,
  starterCount,
  validateRosterSettings,
  type RosterSettings,
} from "../src/domain/tournament/team-rosters";

const teams = (rosterMin: number | null, rosterMax: number | null): RosterSettings => ({ participantType: "teams", rosterMin, rosterMax });

describe("V5-D: roster rules", () => {
  test("reserves never count towards the starting minimum", () => {
    const members = [{ name: "A", role: "captain" as const }, { name: "B", role: "reserve" as const }, { name: "C", role: "reserve" as const }];
    assert.equal(starterCount(members), 1);
    assert.equal(rosterReady(members, teams(2, null)), false);
    assert.equal(rosterIssues(members, teams(2, null))[0].code, "ROSTER_TOO_SMALL");
    assert.equal(rosterReady([...members, { name: "D", role: "player" as const }], teams(2, null)), true);
  });
  test("maximum counts everybody including reserves", () => {
    const members = [{ name: "A", role: "player" as const }, { name: "B", role: "reserve" as const }];
    assert.equal(rosterIssues(members, teams(null, 1)).some((issue) => issue.code === "ROSTER_TOO_LARGE"), true);
    assert.equal(canAddMember(2, teams(null, 2)), false);
    assert.equal(canAddMember(2, teams(null, null)), true);
  });
  test("missing captain is informational only", () => {
    const issues = rosterIssues([{ name: "A", role: "player" }], teams(1, null));
    assert.deepEqual(issues.map((issue) => [issue.code, issue.tone]), [["NO_CAPTAIN", "info"]]);
    assert.equal(rosterReady([{ name: "A", role: "player" }], teams(1, null)), true);
  });
  test("player tournaments have no roster issues", () => {
    assert.deepEqual(rosterIssues([], { participantType: "players", rosterMin: null, rosterMax: null }), []);
  });
  test("names are trimmed, collapsed and length-limited", () => {
    assert.deepEqual(normaliseMemberName("  Jan   Kowalski "), { ok: true, name: "Jan Kowalski" });
    assert.equal(normaliseMemberName("   ").ok, false);
    assert.equal(normaliseMemberName(42).ok, false);
    assert.equal(normaliseMemberName("x".repeat(101)).ok, false);
  });
  test("settings validation", () => {
    assert.deepEqual(validateRosterSettings(undefined, undefined, undefined), { ok: true, value: { participantType: "players", rosterMin: null, rosterMax: null } });
    assert.equal(validateRosterSettings("teams", 3, 5).ok, true);
    assert.equal(validateRosterSettings("teams", 6, 5).ok, false);
    assert.equal(validateRosterSettings("teams", 0, null).ok, false);
    assert.equal(validateRosterSettings("teams", 51, null).ok, false);
    assert.equal(validateRosterSettings("players", 2, null).ok, false, "limits only for teams");
    assert.equal(validateRosterSettings("clans", null, null).ok, false);
  });
});
