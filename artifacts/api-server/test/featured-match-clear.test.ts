import assert from "node:assert/strict";
import { test } from "node:test";
import { UpdateTournamentBody } from "@workspace/api-zod";

// QW-07 · the organizer could put a match "Na ekranie" but not take it off: the star in the host panel and
// "Usuń z ekranu" send featuredMatchId: null, and request validation rejected null with 400 before the route
// (which already handles null) was reached.
test("QW-07: a tournament update may clear the match on screen (featuredMatchId: null)", () => {
  assert.deepEqual(UpdateTournamentBody.parse({ featuredMatchId: null }), { featuredMatchId: null });
  assert.deepEqual(UpdateTournamentBody.parse({ featuredMatchId: 42 }), { featuredMatchId: 42 });
  assert.deepEqual(UpdateTournamentBody.parse({}), {});
  for (const bad of ["42", true, {}, [1]]) assert.equal(UpdateTournamentBody.safeParse({ featuredMatchId: bad }).success, false, JSON.stringify(bad));
});
