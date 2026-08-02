import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateRoundRobinSchedule } from "../src/domain/tournament/round-robin";

describe("round-robin circle schedule", () => {
  for (const playerCount of [3, 4, 5, 6]) {
    test(`creates one conflict-free meeting per pair for ${playerCount} players`, () => {
      const players = Array.from({ length: playerCount }, (_, index) => ({ id: index + 1 }));
      const schedule = generateRoundRobinSchedule(players);
      assert.equal(schedule.length, playerCount * (playerCount - 1) / 2);
      assert.equal(Math.max(...schedule.map((match) => match.round)), playerCount % 2 === 0 ? playerCount - 1 : playerCount);

      const pairs = new Set<string>();
      for (const round of new Set(schedule.map((match) => match.round))) {
        const used = new Set<number>();
        for (const match of schedule.filter((candidate) => candidate.round === round)) {
          assert.equal(used.has(match.player1Id), false);
          assert.equal(used.has(match.player2Id), false);
          used.add(match.player1Id);
          used.add(match.player2Id);
          const key = [match.player1Id, match.player2Id].sort((a, b) => a - b).join(":");
          assert.equal(pairs.has(key), false);
          pairs.add(key);
        }
      }
      assert.equal(pairs.size, schedule.length);
    });
  }
});
