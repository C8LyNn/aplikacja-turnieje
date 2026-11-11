import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PasswordField } from "./password-field";

afterEach(cleanup);

test("L10-UI-01: password remains masked and reveal toggle identifies its controlled input", () => {
  const ui = render(<PasswordField id="test-password" label="Hasło" value="sekret" onChange={() => {}} visible={false} onToggle={() => {}} />);
  const input = screen.getByLabelText("Hasło") as HTMLInputElement;
  const toggle = screen.getByRole("button", { name: "Pokaż hasło" });
  assert.equal(input.type, "password");
  assert.equal(input.value, "sekret");
  assert.equal(toggle.getAttribute("type"), "button");
  assert.equal(toggle.getAttribute("aria-controls"), input.id);
  assert.ok(toggle.className.includes("focus-visible:ring-2"));
  ui.unmount();
});

test("L10-UI-02: toggling preserves the value, changes action label and never submits a form", () => {
  let toggles = 0;
  let submissions = 0;
  const props = { id: "pwd", label: "Hasło", value: "stała-wartość", onChange: () => {}, onToggle: () => { toggles++; } };
  const ui = render(<form onSubmit={e => { e.preventDefault(); submissions++; }}><PasswordField {...props} visible={false} /></form>);
  fireEvent.click(screen.getByRole("button", { name: "Pokaż hasło" }));
  assert.equal(toggles, 1);
  ui.rerender(<form onSubmit={e => { e.preventDefault(); submissions++; }}><PasswordField {...props} visible /></form>);
  assert.equal((screen.getByLabelText("Hasło") as HTMLInputElement).type, "text");
  assert.equal((screen.getByLabelText("Hasło") as HTMLInputElement).value, "stała-wartość");
  assert.ok(screen.getByRole("button", { name: "Ukryj hasło" }));
  assert.equal(submissions, 0);
});

test("L10-UI-03: error, help and custom input ref retain their semantics", () => {
  const ref = React.createRef<HTMLInputElement>();
  render(<PasswordField id="pw-3" label="Hasło" value="x" onChange={() => {}} visible={false}
    onToggle={() => {}} inputRef={ref} description="Minimum 8 znaków" error="Za krótkie" />);
  const input = screen.getByLabelText("Hasło") as HTMLInputElement;
  assert.equal(ref.current, input);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(input.getAttribute("aria-describedby"), "pw-3-help pw-3-error");
  assert.ok(screen.getByRole("alert"));
});
