import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import type { Bracket, Match } from "@workspace/api-client-react";
import { BracketView, bracketNaturalSize, layoutBracket } from "./bracket-view";

afterEach(cleanup);

function fixture(players: number): Bracket {
  let id = 1;
  const rounds: Bracket["rounds"] = [];
  for (let count = players / 2, round = 1; count >= 1; count /= 2, round++) {
    const matches: Match[] = Array.from({ length: count }, (_, index) => ({
      id: id++, revision: 1, tournamentId: 1, stageId: 1, round, matchNumber: index + 1,
      bestOf: 3, status: "pending", player1Name: `Player ${index} A`, player2Name: `Player ${index} B`,
    }));
    rounds.push({ round, matches });
  }
  for (let ri = 0; ri < rounds.length - 1; ri++) rounds[ri].matches.forEach((match, index) => {
    match.nextMatchId = rounds[ri + 1].matches[Math.floor(index / 2)].id;
  });
  return { tournament: { id: 1, name: "Bracket QA", format: "single_elimination", status: "active", resultModelVersion: "series_v1", rankingPolicy: "match_record_v1", defaultBestOf: 3, hasHostCode: false, createdAt: "2026-01-01" }, rounds };
}

test("a 16-player bracket fits a compact 640px canvas without reserving an absent winner column", () => {
  const size = bracketNaturalSize(4, 8);
  assert.ok(size.height <= 640, `16-player canvas is unnecessarily tall: ${size.height}px`);
  assert.ok(size.width <= 1000, `An absent winner must not reserve a column: ${size.width}px`);
});

for (const [players, expectedHeight] of [[2, 120], [4, 192], [8, 336], [16, 624], [32, 1200]]) {
  test(`${players} players: targets are centered on source matches, without extending the first-round height`, () => {
    const bracket = fixture(players);
    const before = JSON.stringify(bracket);
    const layout = layoutBracket(bracket);
    assert.equal(layout.height, expectedHeight);
    assert.equal(layout.connections.length, players - 2);
    for (const node of layout.columns.flat()) {
      assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
      assert.ok(node.x >= 0 && node.y >= 0);
      assert.ok(node.x + 200 <= layout.width && node.y + 64 <= layout.height);
    }
    assert.deepEqual(layout.columns.flat().map(node => node.match.id), bracket.rounds.flatMap(round => round.matches.map(match => match.id)));
    for (const column of layout.columns.slice(1)) for (const target of column) {
      const sources = layout.connections.filter(edge => edge.target === target).map(edge => edge.source);
      assert.equal(target.y + 32, sources.reduce((sum, node) => sum + node.y + 32, 0) / sources.length);
      for (const source of sources) assert.equal(source.match.nextMatchId, target.match.id);
    }
    for (const column of layout.columns) for (let i = 1; i < column.length; i++) assert.ok(column[i].y >= column[i - 1].y + 64 + 8);
    assert.equal(JSON.stringify(bracket), before, "layout must not mutate matches or their ordering");
    bracket.winner = { id: 1, name: "Champion" };
    const completed = layoutBracket(bracket);
    assert.equal(completed.height, layout.height, "winner must not add a fictitious next round's vertical padding");
    assert.equal(completed.winner?.y, completed.columns.at(-1)?.[0].y);
  });
}

test("partial bracket uses actual source centers and draws no line from a missing match", () => {
  const bracket = fixture(8);
  bracket.rounds[0].matches.splice(1, 1);
  const layout = layoutBracket(bracket);
  const firstTarget = layout.columns[1][0];
  assert.equal(firstTarget.y, layout.columns[0][0].y);
  assert.equal(layout.connections.filter(edge => edge.target === firstTarget).length, 1);
  const { container } = render(<BracketView bracket={bracket} />);
  const paths = container.querySelectorAll("path[data-source-match]");
  assert.equal(paths.length, layout.connections.length);
  for (const path of paths) {
    const source = container.querySelector<HTMLElement>(`[data-match-id="${path.getAttribute("data-source-match")}"]`)!;
    const target = container.querySelector<HTMLElement>(`[data-match-id="${path.getAttribute("data-target-match")}"]`)!;
    const sourceX = Number.parseFloat(source.style.left) + Number.parseFloat(source.style.width);
    const sourceY = Number.parseFloat(source.style.top) + Number.parseFloat(source.style.height) / 2;
    const targetX = Number.parseFloat(target.style.left);
    const targetY = Number.parseFloat(target.style.top) + Number.parseFloat(target.style.height) / 2;
    assert.equal(path.getAttribute("d"), `M ${sourceX} ${sourceY} H ${(sourceX + targetX) / 2} V ${targetY} H ${targetX}`,
      "connector endpoints must use exactly the rendered card centers and the inter-column gutter");
  }
});

for (const actual of [3, 5, 7, 14, 24]) {
  test(`${actual} participants: BYEs retain their slots and finite geometry in the padded bracket`, () => {
    const capacity = 2 ** Math.ceil(Math.log2(actual));
    const bracket = fixture(capacity);
    const fullLayout = layoutBracket(bracket);
    const byeMatches = bracket.rounds[0].matches.slice(0, capacity - actual);
    byeMatches.forEach((match, index) => Object.assign(match, {
      resultType: "bye", status: "completed", player1Id: index + 1, player2Id: null,
      player1Name: `Bye player ${index}`, player2Name: null, winnerId: index + 1,
      score1: null, score2: null,
    }));
    const layout = layoutBracket(bracket);
    assert.deepEqual(layout.columns.map(column => column.map(({ x, y }) => ({ x, y }))),
      fullLayout.columns.map(column => column.map(({ x, y }) => ({ x, y }))));
    assert.equal(layout.connections.length, capacity - 2);
    const { container } = render(<BracketView bracket={bracket} />);
    byeMatches.forEach(match => {
      const card = container.querySelector(`[data-match-id="${match.id}"]`)!;
      assert.match(card.textContent ?? "", /BYE/);
      assert.match(card.textContent ?? "", /Bye player/);
    });
  });
}

test("long champion names stay within the fixed-height winner card and remain available in full", () => {
  const bracket = fixture(2);
  const name = "BardzoDługaNazwaMistrza".repeat(12);
  bracket.winner = { id: 1, name };
  render(<BracketView bracket={bracket} />);
  const winner = screen.getByLabelText("Zwycięzca drabinki");
  const label = screen.getByText(name);
  assert.equal(winner.style.height, "64px");
  assert.equal(label.getAttribute("title"), name);
  assert.ok(label.classList.contains("line-clamp-2"));
});

test("zoom footprint matches the rendered canvas and winner stays aligned with the final", () => {
  const bracket = fixture(16);
  bracket.winner = { id: 1, name: "Champion" };
  const layout = layoutBracket(bracket);
  const { container } = render(<BracketView bracket={bracket} scale={0.5} />);
  const viewport = screen.getByLabelText("Drabinka eliminacyjna");
  const footprint = viewport.firstElementChild as HTMLElement;
  assert.equal(footprint.style.height, `${layout.height * 0.5}px`);
  assert.equal(footprint.style.width, `${layout.width * 0.5}px`);
  const winner = screen.getByLabelText("Zwycięzca drabinki");
  const final = container.querySelector<HTMLElement>(`[data-match-id="${bracket.rounds.at(-1)!.matches[0].id}"]`)!;
  assert.equal(winner.style.top, final.style.top);
});

test("legacy read models without nextMatchId keep the adjacent pair geometry", () => {
  const bracket = fixture(16);
  const linked = layoutBracket(bracket);
  for (const round of bracket.rounds) for (const match of round.matches) delete match.nextMatchId;
  const legacy = layoutBracket(bracket);
  assert.deepEqual(legacy.columns.map(column => column.map(node => node.y)), linked.columns.map(column => column.map(node => node.y)));
  assert.equal(legacy.connections.length, linked.connections.length);
});
