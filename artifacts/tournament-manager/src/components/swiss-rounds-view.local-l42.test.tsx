import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Bracket } from "@workspace/api-client-react";
import { SwissRoundsView } from "./swiss-rounds-view";

afterEach(cleanup);
const match = (round:number,id:number) => ({
  id, round, matchNumber:id, status:"pending", player1Id:id,
  player1Name:`Zawodnik ${id}`, player2Id:id+100, player2Name:`Zawodnik ${id+100}`,
  resultType:null, winnerId:null, score1:null, score2:null,
});
const bracket = (...nums:number[]) => ({
  rounds:nums.map(n => ({ round:n, matches:[match(n,n)] })),
}) as unknown as Bracket;

test("user can inspect an older existing round and picker announces selected state",()=>{
  render(<SwissRoundsView bracket={bracket(1,2,3)} currentRound={3} totalRounds={3}/>);
  const first=screen.getByRole("button",{name:"Runda 1"});
  fireEvent.click(first);
  assert.equal(first.getAttribute("aria-pressed"),"true");
  assert.equal(screen.getByRole("button",{name:"Runda 3, bieżąca"}).getAttribute("aria-pressed"),"false");
  assert.ok(screen.getByTestId("swiss-match-1"));
});

test("replacing bracket with disjoint rounds never leaves empty stale selection",()=>{
  const view=render(<SwissRoundsView bracket={bracket(1,2)} currentRound={null}/>);
  fireEvent.click(screen.getByRole("button",{name:"Runda 2"}));
  view.rerender(<SwissRoundsView bracket={bracket(4,5)} currentRound={null}/>);
  assert.equal(screen.getByRole("button",{name:"Runda 4"}).getAttribute("aria-pressed"),"true");
  assert.ok(screen.getByTestId("swiss-match-4"));
});

test("round selector can overflow horizontally but remains labelled",()=>{
  render(<SwissRoundsView bracket={bracket(1,2,3)} currentRound={2}/>);
  const group=screen.getByRole("group",{name:"Wybór rundy"});
  assert.match(group.className,/overflow-x-auto/);
  assert.equal(screen.getByRole("button",{name:"Runda 2, bieżąca"}).getAttribute("aria-pressed"),"true");
});
