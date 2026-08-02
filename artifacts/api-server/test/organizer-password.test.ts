import assert from "node:assert/strict";
import test from "node:test";
import { CreateTournamentBody } from "@workspace/api-zod";
import {
  normalizeOrganizerPassword,
  organizerPasswordInputError,
  ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE,
} from "../src/validation/organizer-password";

const base = { name: "Test", format: "single_elimination" as const };

test("CreateTournamentBody accepts missing, empty and organizer passwords >=8", () => {
  assert.equal(CreateTournamentBody.safeParse(base).success, true);
  assert.equal(CreateTournamentBody.safeParse({ ...base, organizerPassword: "" }).success, true);
  assert.equal(CreateTournamentBody.safeParse({ ...base, organizerPassword: "12345678" }).success, true);
  assert.equal(CreateTournamentBody.safeParse({ ...base, organizerPassword: "hasło-dłuższe" }).success, true);
});

test("CreateTournamentBody rejects organizer password lengths 1-7", () => {
  for (let length = 1; length <= 7; length += 1) {
    assert.equal(
      CreateTournamentBody.safeParse({ ...base, organizerPassword: "x".repeat(length) }).success,
      false,
      `length ${length}`,
    );
    assert.equal(organizerPasswordInputError("x".repeat(length)), ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE);
  }
});

test("empty organizer password normalizes to the existing passwordless semantics", () => {
  assert.equal(normalizeOrganizerPassword(""), undefined);
  assert.equal(normalizeOrganizerPassword(undefined), undefined);
  assert.equal(normalizeOrganizerPassword("12345678"), "12345678");
});
