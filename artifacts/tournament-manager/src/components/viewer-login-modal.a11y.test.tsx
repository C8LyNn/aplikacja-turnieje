import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewerLoginModal } from "./viewer-login-modal";

const originalFetch = globalThis.fetch;
const view = (onSuccess: (token: string) => void = () => {}) => (
  <ViewerLoginModal
    open
    tournamentId={12}
    tournamentName="Testowy turniej"
    onSuccess={onSuccess}
    onClose={() => {}}
  />
);

afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

test("L12-RTL-01: password label and accessible visibility button have matching control IDs", async () => {
  const user = userEvent.setup();
  render(view());
  const input = screen.getByLabelText("Hasło widza", { selector: "input" }) as HTMLInputElement;
  assert.ok(input.id);
  assert.equal(input.type, "password");
  const reveal = screen.getByRole("button", { name: "Pokaż hasło widza" });
  assert.equal(reveal.getAttribute("aria-controls"), input.id);
  assert.equal(reveal.getAttribute("aria-pressed"), "false");
  await user.click(reveal);
  assert.equal(input.type, "text");
  const conceal = screen.getByRole("button", { name: "Ukryj hasło widza" });
  assert.equal(conceal.getAttribute("aria-controls"), input.id);
  assert.equal(conceal.getAttribute("aria-pressed"), "true");
  await user.click(conceal);
  assert.equal(input.type, "password");
});

test("L12-RTL-02: failed login announces error and associates it to password input", async () => {
  const user = userEvent.setup();
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Błędne hasło widza" }), {
    status: 403, headers: { "content-type": "application/json" },
  });
  render(view());
  const input = screen.getByLabelText("Hasło widza", { selector: "input" }) as HTMLInputElement;
  await user.type(input, "niepoprawne");
  await user.click(screen.getByRole("button", { name: "Wejdź" }));
  const alert = await screen.findByRole("alert");
  assert.match(alert.textContent ?? "", /Błędne hasło widza/);
  assert.ok(alert.id);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(input.getAttribute("aria-describedby"), alert.id);
});

test("L12-RTL-03: valid login continues using existing API and onSuccess", async () => {
  const user = userEvent.setup();
  let submitted = 0;
  const tokens: string[] = [];
  globalThis.fetch = async (input, init) => {
    submitted += 1;
    assert.match(String(input), /\/api\/tournaments\/12\/auth\/viewer-login$/);
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { password: "poprawne" });
    return new Response(JSON.stringify({ token: "viewer-demo-token" }), {
      headers: { "content-type": "application/json" },
    });
  };
  render(view(token => tokens.push(token)));
  await user.type(screen.getByLabelText("Hasło widza", { selector: "input" }), "poprawne");
  await user.click(screen.getByRole("button", { name: "Wejdź" }));
  await waitFor(() => assert.deepEqual(tokens, ["viewer-demo-token"]));
  assert.equal(submitted, 1);
});
