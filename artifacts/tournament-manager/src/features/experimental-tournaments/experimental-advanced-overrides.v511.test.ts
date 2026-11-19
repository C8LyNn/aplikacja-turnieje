import { test } from "node:test";
import assert from "node:assert/strict";
import { sectionOverrides } from "./experimental-advanced-editor";
import { PRESET_PARAM_KEYS_BY_PRESET } from "./experimental-create-wizard-model";

const groups = PRESET_PARAM_KEYS_BY_PRESET.groups_playoff;

test("a section with no own settings follows the preset's defaults", () => {
  assert.deepEqual(sectionOverrides("structure", {}, groups), []);
  assert.deepEqual(sectionOverrides("matches", { participantCount: 16 }, groups), [], "the count comes from the answers, not an override");
});

test("own settings are counted per section and only for parameters the preset can tune", () => {
  const params = { groupCount: 4, qualifiersPerGroup: 2, pointsWin: 2, entrySeeding: 1, swissRounds: 5 };
  assert.deepEqual(sectionOverrides("structure", params, groups), ["groupCount", "qualifiersPerGroup"], "swissRounds is not tunable for groups");
  assert.deepEqual(sectionOverrides("scoring", params, groups), ["pointsWin"]);
  assert.deepEqual(sectionOverrides("seeding", params, groups), ["entrySeeding"]);
});

test("every tunable parameter of every preset belongs to exactly one editor section (nothing lost from the editor)", () => {
  const sections = ["structure", "matches", "scoring", "seeding"] as const;
  for (const [preset, keys] of Object.entries(PRESET_PARAM_KEYS_BY_PRESET)) {
    for (const key of keys) {
      const owners = sections.filter((id) => sectionOverrides(id, { [key]: 1 }, keys).includes(key));
      assert.equal(owners.length, 1, `${preset}.${key} is shown in ${owners.length} sections`);
    }
  }
});
