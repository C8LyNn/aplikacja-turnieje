import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import request from "supertest";
import router from "../src/routes/tournament-plan-preview";

const app = express();
app.use(express.json());
app.use("/api", router);

test("public plan preview returns a validated plan without writing to DB", async () => {
  const response = await request(app)
    .post("/api/tournaments/plan-preview")
    .send({templateId: "groups_to_playoffs", participantCount: 16, bestOf: 3})
    .expect(200);
  assert.equal(response.body.stagePlan.initialParticipantCount, 16);
  assert.equal(response.body.stagePlan.stages[1].participantCount, 8);
  assert.equal(response.body.advisory, true);
  assert.equal(response.body.requiresConfirmation, true);
});

test("bad template returns structured 422, no side effects", async () => {
  const response = await request(app)
    .post("/api/tournaments/plan-preview")
    .send({templateId: "groups_to_playoffs", participantCount: 15, bestOf: 3})
    .expect(422);
  assert.equal(response.body.code, "GROUP_TEMPLATE_REQUIRES_FOURS");
});

test("rejects undeclared properties", async () => {
  const response = await request(app)
    .post("/api/tournaments/plan-preview")
    .send({templateId: "quick_elimination", participantCount: 8, bestOf: 3, owner: "override"})
    .expect(422);
  assert.equal(response.body.code, "INVALID_TEMPLATE_REQUEST");
});
