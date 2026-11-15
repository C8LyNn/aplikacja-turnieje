import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BanIcon, GamePicksRow, PickIcon } from "./deadlock-bans-display";

afterEach(() => cleanup());

test("L48: a failed portrait does not prevent loading the next selected hero", () => {
  const view = render(<PickIcon heroId="abrams" />);
  fireEvent.error(screen.getByRole("img", { name: "Abrams" }));
  assert.equal(view.container.querySelector("img"), null);
  assert.ok(screen.getByText("AB"));

  view.rerender(<PickIcon heroId="bebop" />);
  assert.match(screen.getByRole("img", { name: "Bebop" }).getAttribute("src") ?? "", /\/bebop\.png$/);
  fireEvent.error(screen.getByRole("img", { name: "Bebop" }));
  assert.ok(screen.getByText("BE"));

  view.rerender(<PickIcon heroId="abrams" />);
  assert.ok(screen.getByRole("img", { name: "Abrams" }));
});

test("L48: rerendering the same failed portrait keeps its fallback without a retry loop", () => {
  const view = render(<PickIcon heroId="abrams" />);
  fireEvent.error(screen.getByRole("img", { name: "Abrams" }));
  view.rerender(<PickIcon heroId="abrams" size={32} />);
  assert.equal(view.container.querySelector("img"), null);
  assert.ok(screen.getByText("AB"));
});

test("L48: bans also load a new portrait after the previous hero failed", () => {
  const view = render(<BanIcon heroId="abrams" />);
  fireEvent.error(screen.getByRole("img", { name: "Abrams" }));
  view.rerender(<BanIcon heroId="bebop" />);
  assert.ok(screen.getByRole("img", { name: "Bebop" }));
});

test("L48: an event from a replaced image cannot hide the current portrait", () => {
  const view = render(<PickIcon heroId="abrams" />);
  const previousImage = screen.getByRole("img", { name: "Abrams" });
  view.rerender(<PickIcon heroId="bebop" />);
  fireEvent.error(previousImage);
  assert.ok(screen.getByRole("img", { name: "Bebop" }));
});

test("L48: a saved unknown pick remains visible even when empty rows are hidden", () => {
  render(<GamePicksRow gameNumber={3} player1HeroId="unknown-from-old-catalog" player2HeroId={null} />);
  assert.ok(screen.getByText("G3"));
  assert.equal(screen.getAllByLabelText("Nieznana postać").length, 1);
  assert.equal(screen.queryByText("brak picka"), null);
});

test("L48: two unknown picks are not reported as an empty game", () => {
  render(<GamePicksRow gameNumber={4} player1HeroId="unknown-a" player2HeroId="unknown-b" showEmpty />);
  assert.equal(screen.getAllByLabelText("Nieznana postać").length, 2);
  assert.equal(screen.queryByText("brak picka"), null);
});

test("L48: a genuinely empty game remains hidden by default", () => {
  const view = render(<GamePicksRow gameNumber={2} player1HeroId={null} player2HeroId={undefined} />);
  assert.equal(view.container.innerHTML, "");
});

test("L48: an explicitly displayed empty game keeps its existing message", () => {
  render(<GamePicksRow gameNumber={2} player1HeroId="" player2HeroId={null} showEmpty />);
  assert.ok(screen.getByText("G2"));
  assert.ok(screen.getByText("brak picka"));
});

test("L48: known and unknown picks remain visible together with the existing ban warning", () => {
  render(<GamePicksRow gameNumber={1} player1HeroId="abrams" player2HeroId="unknown"
    player1Name="Gracz A" player1BannedByOpponent={["abrams"]} />);
  assert.ok(screen.getByRole("img", { name: "Abrams" }));
  assert.equal(screen.getAllByLabelText("Nieznana postać").length, 1);
  assert.ok(screen.getByTitle(/Gracz A: Abrams.*ZBANOWANA/));
});
