import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canEditDimensionModelStructure,
  canTransitionDimensionModelStatus,
  dimensionModelStatusOptions,
} from "./dimension-model-lifecycle";

test("draft and pilot models remain structurally editable", () => {
  assert.equal(canEditDimensionModelStructure("draft"), true);
  assert.equal(canEditDimensionModelStructure("pilot"), true);
  assert.equal(canEditDimensionModelStructure("active"), false);
  assert.equal(canEditDimensionModelStructure("retired"), false);
});

test("published model cannot return to an editable state", () => {
  assert.equal(canTransitionDimensionModelStatus("active", "draft"), false);
  assert.equal(canTransitionDimensionModelStatus("active", "pilot"), false);
  assert.equal(canTransitionDimensionModelStatus("active", "retired"), true);
  assert.equal(canTransitionDimensionModelStatus("retired", "active"), false);
});

test("status options expose only legal transitions", () => {
  assert.deepEqual(dimensionModelStatusOptions("active"), ["active", "retired"]);
  assert.deepEqual(dimensionModelStatusOptions("retired"), ["retired"]);
});
