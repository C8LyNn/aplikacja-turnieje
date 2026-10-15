import assert from "node:assert/strict";
import test from "node:test";
import { CreateTournamentBody } from "@workspace/api-zod";
import {
  organizerPasswordInputError,
  ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE,
} from "../src/validation/organizer-password";

const base = { name: "Test", format: "single_elimination" as const };

test("CreateTournamentBody requires a durable organizer password", () => {
  assert.equal(CreateTournamentBody.safeParse(base).success, false);
  assert.equal(CreateTournamentBody.safeParse({ ...base, organizerPassword: "" }).success, false);
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

test("HTTP validation rejects absent, empty and non-string credentials", () => {
  for (const value of [undefined, null, "", 12345678, {}, []]) {
    assert.equal(organizerPasswordInputError(value), ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE);
  }
  assert.equal(organizerPasswordInputError("12345678"), null);
});
