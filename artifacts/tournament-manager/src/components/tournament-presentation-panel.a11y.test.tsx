import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentPresentationPanel } from "./tournament-presentation-panel";

afterEach(() => { cleanup(); localStorage.clear(); });

test("L16-RTL-01: switch has visible name and its own accessible description", () => {
  const { container } = render(<TournamentPresentationPanel tournamentId={81} isDeadlock />);
  const control = screen.getByRole("switch", { name: "Motyw Deadlock" }) as HTMLButtonElement;
  const descriptionId = control.getAttribute("aria-describedby")!;
  assert.ok(descriptionId);
  assert.match(container.ownerDocument.getElementById(descriptionId)?.textContent ?? "", /w tej przeglądarce/);
});

test("L16-RTL-02: repeated panels have distinct label and description IDs", () => {
  render(<><TournamentPresentationPanel tournamentId={81} isDeadlock /><TournamentPresentationPanel tournamentId={82} isDeadlock /></>);
  const controls = screen.getAllByRole("switch", { name: "Motyw Deadlock" });
  assert.equal(controls.length, 2);
  assert.notEqual(controls[0].id, controls[1].id);
  assert.notEqual(controls[0].getAttribute("aria-describedby"), controls[1].getAttribute("aria-describedby"));
});

test("L16-RTL-03: toggling theme stores browser-specific preference without changing API", async () => {
  const user = userEvent.setup();
  render(<TournamentPresentationPanel tournamentId={81} isDeadlock />);
  const control = screen.getByRole("switch", { name: "Motyw Deadlock" });
  await user.click(control);
  assert.equal(localStorage.getItem("tm:deadlock-theme:81"), "true");
});

test("L16-RTL-04: non-Deadlock tournament keeps its explanatory fallback", () => {
  render(<TournamentPresentationPanel tournamentId={81} isDeadlock={false} />);
  assert.equal(screen.queryByRole("switch"), null);
  assert.match(screen.getByText(/Ustawienia motywu wizualnego są dostępne/).textContent ?? "", /Deadlock/);
});
