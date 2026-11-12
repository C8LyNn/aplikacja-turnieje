import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CopyLinkButton } from "./copy-link-button";

const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
afterEach(() => {
  cleanup();
  if (original) Object.defineProperty(navigator, "clipboard", original);
  else Reflect.deleteProperty(navigator, "clipboard");
});
function writer(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}
const link = "https://example.invalid/tournaments/7?login=support&name=Łódź";
const view = (text = link) => <div className="flex flex-wrap"><CopyLinkButton text={text} /></div>;
const mount = (text = link) => render(view(text));

test("L09-UI-01: announces success only after write resolves", async () => {
  let finish!: () => void;
  let written = "";
  writer({ writeText(text: string) { written = text; return new Promise<void>(r => { finish = r; }); } });
  mount();
  const button = screen.getByRole("button", { name: "Kopiuj link" });
  fireEvent.click(button);
  assert.equal(written, link);
  assert.equal(button.getAttribute("type"), "button");
  assert.ok((button as HTMLButtonElement).disabled);
  assert.match(screen.getByRole("status").textContent ?? "", /Kopiowanie/);
  assert.equal(screen.queryByText("Link skopiowany."), null);
  await act(async () => finish());
  await screen.findByText("Link skopiowany.");
  assert.equal((button as HTMLButtonElement).disabled, false);
});
test("L09-UI-02: denied permission exposes exact readonly value for manual selection", async () => {
  writer({ writeText: async () => { throw new DOMException("denied", "NotAllowedError"); } });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  const input = await screen.findByRole("textbox", { name: "Link do ręcznego skopiowania" }) as HTMLInputElement;
  assert.equal(input.value, link);
  assert.equal(input.readOnly, true);
  fireEvent.click(screen.getByRole("button", { name: "Zaznacz link" }));
  assert.equal(document.activeElement, input);
  assert.equal(input.selectionStart, 0);
  assert.equal(input.selectionEnd, link.length);
  assert.equal(screen.queryByText("Link skopiowany."), null);
});
test("L09-UI-03: unsupported clipboard offers manual copy instead of throwing", async () => {
  writer(undefined);
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByRole("textbox", { name: "Link do ręcznego skopiowania" });
  assert.match(screen.getByRole("status").textContent ?? "", /nie udostępnia schowka/);
});
test("L09-UI-04: double click dispatches only one pending write", async () => {
  let finish!: () => void;
  let writes = 0;
  writer({ writeText() { writes++; return new Promise<void>(r => { finish = r; }); } });
  mount();
  const button = screen.getByRole("button", { name: "Kopiuj link" });
  fireEvent.click(button); fireEvent.click(button);
  assert.equal(writes, 1);
  await act(async () => finish());
});
test("L09-UI-05: changing URL while pending cannot claim the new link was copied", async () => {
  let finish!: () => void;
  writer({ writeText: () => new Promise<void>(r => { finish = r; }) });
  const ui = mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  ui.rerender(view("https://example.invalid/new"));
  assert.ok((screen.getByRole("button", { name: "Kopiuj link" }) as HTMLButtonElement).disabled);
  await act(async () => finish());
  await waitFor(() => assert.equal((screen.getByRole("button", { name: "Kopiuj link" }) as HTMLButtonElement).disabled, false));
  assert.equal(screen.queryByText("Link skopiowany."), null);
});
test("L09-UI-06: changing URL hides stale success and a stale manual field", async () => {
  writer({ writeText: async () => {} });
  const ui = mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByText("Link skopiowany.");
  ui.rerender(view("https://example.invalid/changed"));
  assert.equal(screen.queryByText("Link skopiowany."), null);
  writer(undefined);
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByRole("textbox");
  ui.rerender(<CopyLinkButton text="https://example.invalid/third" />);
  assert.equal(screen.queryByRole("textbox"), null);
});
test("L09-UI-07: success after retry removes the manual fallback", async () => {
  let calls = 0;
  writer({ async writeText() { if (++calls === 1) throw new Error("denied"); } });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByRole("textbox");
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByText("Link skopiowany.");
  assert.equal(screen.queryByRole("textbox"), null);
});
test("L09-UI-08: neither copy nor manual selection submits an enclosing form", async () => {
  let submissions = 0;
  writer(undefined);
  render(<form onSubmit={e => { e.preventDefault(); submissions++; }}><CopyLinkButton text={link} /></form>);
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  await screen.findByRole("textbox");
  fireEvent.click(screen.getByRole("button", { name: "Zaznacz link" }));
  assert.equal(submissions, 0);
});
test("L09-UI-09: unmount during pending write does not render a stale result", async () => {
  let finish!: () => void;
  writer({ writeText: () => new Promise<void>(r => { finish = r; }) });
  const ui = mount();
  fireEvent.click(screen.getByRole("button", { name: "Kopiuj link" }));
  ui.unmount();
  await act(async () => finish());
  assert.equal(screen.queryByRole("status"), null);
});
test("L09-UI-10: caller can distinguish the destination by accessible button name", () => {
  render(<CopyLinkButton text={link} label="Kopiuj: link widza" />);
  assert.ok(screen.getByRole("button", { name: "Kopiuj: link widza" }));
});
