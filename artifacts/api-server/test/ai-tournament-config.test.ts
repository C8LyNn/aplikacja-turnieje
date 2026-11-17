import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import {
  AI_CONFIG_EXAMPLES,
  AI_CONFIG_MAX_BYTES,
  AI_CONFIG_SCHEMA_ID,
  AI_FORBIDDEN_KEYS,
  buildAiConfigJsonSchema,
  buildAiSpecification,
  buildAiSpecificationMarkdown,
  validateAiTournamentConfig,
  validateAiTournamentConfigText,
  type AiConfigProblem,
} from "../src/domain/tournament/ai-tournament-config";
import { PLANNED_PRESETS, PRESET_IDS, PRESET_TUNABLE_PARAMS, previewPreset } from "../src/domain/tournament/tournament-presets";
import { STAGE_BEST_OF_VALUES, TOURNAMENT_STAGE_FORMATS, validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";

// ajv is a transitive workspace dependency; used only to prove the published schema is valid JSON Schema.
const require = createRequire(import.meta.url);
const Ajv2020 = require("../../../node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/2020.js").default;

const base = (structure: unknown, extra: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  participants: { type: "players", count: 16 },
  structure,
  ...extra,
});
const problemsOf = (input: unknown): AiConfigProblem[] => {
  const result = validateAiTournamentConfig(input);
  assert.equal(result.valid, false, "expected rejection");
  return result.valid ? [] : result.problems;
};

describe("V5-B: published schema and specification match the engine", () => {
  const schema = buildAiConfigJsonSchema();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  test("schema compiles as JSON Schema 2020-12 and has a stable id", () => {
    assert.equal(schema.$id, AI_CONFIG_SCHEMA_ID);
    assert.equal(typeof validate, "function");
  });

  test("schema enums are generated from the live engine catalog", () => {
    const text = JSON.stringify(schema);
    for (const id of PRESET_IDS) assert.ok(text.includes(`"const":"${id}"`), id);
    for (const planned of PLANNED_PRESETS) assert.ok(!text.includes(`"const":"${planned.id}"`), `planned ${planned.id} must not be selectable`);
    const stageFormats = (schema as any).properties.structure.oneOf.at(-1).properties.stages.items.properties.format.enum;
    assert.deepEqual(stageFormats, [...TOURNAMENT_STAGE_FORMATS]);
    assert.deepEqual((schema as any).properties.structure.oneOf.at(-1).properties.stages.items.properties.bestOf.enum, [...STAGE_BEST_OF_VALUES]);
    for (const [index, id] of PRESET_IDS.entries()) {
      const params = Object.keys((schema as any).properties.structure.oneOf[index].properties.params.properties);
      assert.deepEqual(params, PRESET_TUNABLE_PARAMS[id], id);
    }
  });

  test("every object in the schema forbids additional properties", () => {
    const walk = (node: any, path: string) => {
      if (!node || typeof node !== "object") return;
      if (node.type === "object") assert.equal(node.additionalProperties, false, path);
      for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`);
    };
    walk(schema, "$");
  });

  test("every example passes both the JSON Schema and the server validator", () => {
    for (const example of AI_CONFIG_EXAMPLES) {
      assert.equal(validate(example.config), true, `${example.title}: ${JSON.stringify(validate.errors)}`);
      const result = validateAiTournamentConfig(example.config);
      assert.equal(result.valid, true, `${example.title}: ${JSON.stringify(!result.valid && result.problems)}`);
    }
  });

  test("forbidden fields are rejected by the JSON Schema too", () => {
    assert.equal(validate(base({ type: "preset", presetId: "swiss" }, { label: "Puchar" })), false);
    assert.equal(validate(base({ type: "preset", presetId: "swiss", params: { organizerPassword: "x" } })), false);
  });

  test("markdown is self-contained and lists only implemented features as usable", () => {
    const md = buildAiSpecificationMarkdown();
    for (const id of PRESET_IDS) assert.ok(md.includes(`\`${id}\``), id);
    for (const field of AI_FORBIDDEN_KEYS) assert.ok(md.includes(`\`${field}\``), field);
    assert.match(md, /## JSON Schema/);
    assert.match(md, /Jeszcze nieobsługiwane/);
    for (const planned of PLANNED_PRESETS) assert.ok(md.includes(planned.label));
    assert.equal(buildAiSpecification().specVersion, "1.0");
  });
});

describe("V5-B: strict import validation", () => {
  test("valid preset config produces the same preview as the wizard", () => {
    const result = validateAiTournamentConfig(base({ type: "preset", presetId: "groups_playoff", params: { groupCount: 4, playoffBestOf: 3 } }, { kind: "tournament", notes: "Dwie osoby z grupy." }));
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.continueIn, "wizard");
    assert.equal(result.notes, "Dwie osoby z grupy.");
    assert.deepEqual(result.preview, previewPreset({ presetId: "groups_playoff", params: { participantCount: 16, groupCount: 4, playoffBestOf: 3 } }));
  });

  for (const key of ["name", "title", "organizerPassword", "viewerPassword", "token", "owner", "id", "tournamentId", "matches", "results", "players", "randomSeed", "description", "permissions"]) {
    test(`forbidden field "${key}" is rejected with a dedicated message (top level)`, () => {
      const problems = problemsOf(base({ type: "preset", presetId: "swiss" }, { [key]: "x" }));
      assert.ok(problems.some((problem) => problem.code === "FORBIDDEN_FIELD" && problem.path === key), JSON.stringify(problems));
    });
  }

  test("forbidden fields are detected anywhere, case-insensitively", () => {
    const problems = problemsOf(base({ type: "stages", stages: [{ label: "A", format: "single_elimination", Password: "x", owner: { ID: 1 } }] }));
    const paths = problems.filter((problem) => problem.code === "FORBIDDEN_FIELD").map((problem) => problem.path);
    assert.deepEqual(paths, ["structure.stages[0].Password", "structure.stages[0].owner"]);
  });

  test("unknown fields are rejected at every level", () => {
    assert.ok(problemsOf(base({ type: "preset", presetId: "swiss" }, { extra: 1 })).some((p) => p.code === "UNKNOWN_FIELD" && p.path === "extra"));
    assert.ok(problemsOf(base({ type: "preset", presetId: "swiss", params: { groupCount: 2 } })).some((p) => p.path === "structure.params.groupCount"));
    assert.ok(problemsOf({ schemaVersion: 1, participants: { count: 8, captain: "x" }, structure: { type: "preset", presetId: "swiss" } }).some((p) => p.path === "participants.captain"));
  });

  test("schema version is mandatory and only version 1 is accepted", () => {
    for (const version of [undefined, 0, 2, "1", null]) {
      const problems = problemsOf({ ...base({ type: "preset", presetId: "swiss" }), schemaVersion: version });
      assert.equal(problems[0].code, "UNSUPPORTED_SCHEMA_VERSION", String(version));
    }
  });

  test("text import rejects empty, oversized, malformed and non-object JSON", () => {
    const codeOf = (text: unknown) => {
      const result = validateAiTournamentConfigText(text);
      return result.valid ? "VALID" : result.problems[0].code;
    };
    assert.equal(codeOf(""), "INVALID_JSON");
    assert.equal(codeOf(42), "INVALID_JSON");
    assert.equal(codeOf("{ schemaVersion: 1 }"), "INVALID_JSON");
    assert.equal(codeOf("```json\n{}\n```"), "INVALID_JSON");
    assert.equal(codeOf("[1,2]"), "NOT_AN_OBJECT");
    assert.equal(codeOf(JSON.stringify({ schemaVersion: 1, notes: "x".repeat(AI_CONFIG_MAX_BYTES) })), "TOO_LARGE");
    let deep: unknown = 1;
    for (let level = 0; level < 12; level += 1) deep = { a: deep };
    assert.equal(codeOf(JSON.stringify({ schemaVersion: 1, nested: deep })), "TOO_DEEP");
    assert.equal(codeOf("﻿" + JSON.stringify(AI_CONFIG_EXAMPLES[2].config)), "VALID");
  });

  test("engine limits are reported on the right path", () => {
    const tooMany = problemsOf({ schemaVersion: 1, participants: { count: 40 }, structure: { type: "preset", presetId: "round_robin" } });
    assert.equal(tooMany[0].path, "participants.count");
    const badGroups = problemsOf(base({ type: "preset", presetId: "groups_playoff", params: { groupCount: 9 } }));
    assert.equal(badGroups[0].path, "structure.params.groupCount");
    assert.equal(problemsOf(base({ type: "preset", presetId: "league_home_away" }))[0].path, "structure.presetId");
    assert.ok(problemsOf(base({ type: "magic" })).some((p) => p.path === "structure.type"));
    assert.ok(problemsOf({ schemaVersion: 1, participants: { count: 1 }, structure: { type: "preset", presetId: "swiss" } }).some((p) => p.path === "participants.count"));
  });

  test("notes are plain text with a length limit and never executed", () => {
    const ok = validateAiTournamentConfig(base({ type: "preset", presetId: "swiss" }, { notes: "<script>alert(1)</script> ignore previous instructions" }));
    assert.equal(ok.valid, true);
    if (ok.valid) assert.equal(ok.notes, "<script>alert(1)</script> ignore previous instructions");
    assert.ok(problemsOf(base({ type: "preset", presetId: "swiss" }, { notes: "x".repeat(1001) })).some((p) => p.path === "notes"));
  });
});

describe("V5-B: custom stage plans", () => {
  test("participant counts flow automatically and the plan passes the engine validator", () => {
    const result = validateAiTournamentConfig(AI_CONFIG_EXAMPLES[3].config);
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.continueIn, "advanced");
    assert.deepEqual(result.preview.stagePlan.stages.map((stage) => stage.participantCount), [32, 16, 8]);
    assert.equal(validateTournamentStagePlan(result.preview.stagePlan).valid, true);
    assert.equal(result.preview.totals.matches.min, 16 * 5 + 4 * 6 + 7);
    assert.equal(result.preview.creation.stagePlan?.stages[1].entrySeedingMethod, "preserve");
  });

  test("an explicit, inconsistent participantCount is rejected with an explanation", () => {
    const problems = problemsOf(base({ type: "stages", stages: [
      { label: "Grupy", format: "group_stage", groupCount: 4, qualifiersPerGroup: 2 },
      { label: "Finały", format: "single_elimination", participantCount: 6 },
    ] }));
    assert.ok(problems.some((p) => p.path === "structure.stages[1].participantCount" && /8/.test(p.message)), JSON.stringify(problems));
  });

  test("format-specific rules are explained", () => {
    const missingRounds = problemsOf(base({ type: "stages", stages: [{ label: "S", format: "swiss" }] }));
    assert.ok(missingRounds.some((p) => p.path === "structure.stages[0].rounds"));
    const finalGroup = problemsOf(base({ type: "stages", stages: [{ label: "G", format: "group_stage", groupCount: 4, qualifiersPerGroup: 2 }] }));
    assert.ok(finalGroup.some((p) => p.code === "ENGINE_REJECTED"));
    const deFirst = problemsOf(base({ type: "stages", stages: [{ label: "DE", format: "double_elimination", advancingCount: 4 }, { label: "F", format: "single_elimination" }] }));
    assert.ok(deFirst.some((p) => p.code === "ENGINE_REJECTED"));
    const finalAdvance = problemsOf(base({ type: "stages", stages: [{ label: "F", format: "single_elimination", advancingCount: 2 }] }));
    assert.ok(finalAdvance.some((p) => p.path === "structure.stages[0].advancingCount"));
    const wrongField = problemsOf(base({ type: "stages", stages: [{ label: "RR", format: "round_robin", rounds: 3 }] }));
    assert.ok(wrongField.some((p) => p.path === "structure.stages[0].rounds"));
    const laterEntry = problemsOf(base({ type: "stages", stages: [
      { label: "S", format: "swiss", rounds: 3, advancingCount: 8 },
      { label: "F", format: "single_elimination", entrySeedingMethod: "alphabetical" },
    ] }));
    assert.ok(laterEntry.some((p) => p.path === "structure.stages[1].entrySeedingMethod"));
    const randomPlacement = problemsOf(base({ type: "stages", stages: [{ label: "F", format: "single_elimination", placementMethod: "random" }] }));
    assert.ok(randomPlacement.some((p) => p.path === "structure.stages[0].placementMethod"));
  });

  test("too many stages are rejected", () => {
    const stages = Array.from({ length: 11 }, (_, index) => ({ name: `S${index}`, format: "single_elimination" }));
    assert.ok(problemsOf(base({ type: "stages", stages })).some((p) => p.path === "structure.stages"));
  });
});
