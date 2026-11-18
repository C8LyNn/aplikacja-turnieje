import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SetMatchRules, SetScore } from "@workspace/match-rules";
import { SetScoreEditor, setsText } from "./set-score-editor";

afterEach(() => cleanup());
const rules: SetMatchRules = { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 };

function Harness({ initial = [] as SetScore[] }) {
  const [sets, setSets] = useState<SetScore[]>(initial);
  return <SetScoreEditor rules={rules} sets={sets} player1Name="Wilki" player2Name="Lwy" onChange={setSets} />;
}

test("keyboard entry: typing sets shows the tally, what is missing and the winner once decided", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const editor = screen.getByRole("region", { name: "Wyniki setów" });
  assert.match(editor.textContent ?? "", /Mecz do 2 wygranych setów; set do 11 pkt z przewagą 2/);
  await user.click(screen.getByRole("button", { name: "Wpisz pierwszy set" }));
  const a1 = screen.getByRole("spinbutton", { name: "Set 1 — Wilki" });
  await user.clear(a1); await user.type(a1, "11");
  await user.tab(); // to the plus button, then the opponent field
  const b1 = screen.getByRole("spinbutton", { name: "Set 1 — Lwy" });
  await user.clear(b1); await user.type(b1, "7");
  assert.match(editor.textContent ?? "", /Sety1:0/);
  assert.match(editor.textContent ?? "", /Do zwycięstwa brakuje: Wilki — 1 set, Lwy — 2 sety/);
  await user.click(screen.getByRole("button", { name: "Dodaj set 2" }));
  const a2 = screen.getByRole("spinbutton", { name: "Set 2 — Wilki" });
  await user.clear(a2); await user.type(a2, "12");
  const b2 = screen.getByRole("spinbutton", { name: "Set 2 — Lwy" });
  await user.clear(b2); await user.type(b2, "10");
  assert.match(screen.getByRole("status").textContent ?? "", /Mecz rozstrzygnięty: wygrywa Wilki \(2:0 w setach\)/);
  assert.ok(screen.getByRole("button", { name: /Dodaj set/ }).matches(":disabled"), "no set after the match is decided");
  assert.match(editor.textContent ?? "", /małe punkty 23:17/);
});

test("an impossible or unfinished set is explained in place; a running set blocks adding another", () => {
  render(<Harness initial={[{ score1: 13, score2: 10 }]} />);
  const row = screen.getAllByRole("listitem")[0]!;
  assert.match(row.textContent ?? "", /wynik 13:10 jest niemożliwy/);
  assert.match(screen.getByRole("status").textContent ?? "", /Set 1: wynik 13:10 jest niemożliwy/);
  cleanup();
  render(<Harness initial={[{ score1: 10, score2: 10 }]} />);
  assert.match(screen.getAllByRole("listitem")[0]!.textContent ?? "", /trwa/);
  assert.ok(screen.getByRole("button", { name: "Dodaj set 2" }).matches(":disabled"));
});

test("read-only after saving; the sets text is used in lists", () => {
  render(<SetScoreEditor rules={rules} sets={[{ score1: 11, score2: 7 }, { score1: 9, score2: 11 }, { score1: 11, score2: 5 }]} player1Name="Wilki" player2Name="Lwy" readOnly />);
  assert.equal(screen.queryAllByRole("spinbutton").length, 0);
  assert.equal(screen.queryByRole("button", { name: /Dodaj set/ }), null);
  assert.match(within(screen.getByRole("region")).getByRole("status").textContent ?? "", /wygrywa Wilki \(2:1 w setach\)/);
  assert.equal(setsText([{ score1: 11, score2: 7 }, { score1: 9, score2: 11 }]), "11:7, 9:11");
});
