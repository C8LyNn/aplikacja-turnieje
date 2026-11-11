import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestAuthProvider } from "../../test/auth-provider";
import { setActiveSupportToken, setActiveOrganizerToken } from "@workspace/api-client-react";
import { SupportLoginModal } from "./support-login-modal";

const originalFetch = globalThis.fetch;
const renderModal = (onSuccess: (token: string, nick: string) => void = () => {}, onClose = () => {}) =>
  render(<TestAuthProvider><SupportLoginModal open tournamentId={77} tournamentName="Turniej próbny" onSuccess={onSuccess} onClose={onClose} /></TestAuthProvider>);
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});
afterEach(() => {
  cleanup(); globalThis.fetch = originalFetch;
  sessionStorage.clear(); localStorage.clear();
  setActiveSupportToken(null); setActiveOrganizerToken(null);
});

test("L13-RTL-01: both support fields have names, stable IDs, and accessible close action", async () => {
  renderModal();
  const nick = screen.getByRole("textbox", { name: "Twój nick" }) as HTMLInputElement;
  const password = screen.getByLabelText("Hasło wsparcia") as HTMLInputElement;
  assert.equal(nick.id, "support-login-nick");
  assert.equal(password.id, "support-login-password");
  assert.equal(password.type, "password");
  assert.equal(password.getAttribute("autocomplete"), "current-password");
  const close = screen.getByRole("button", { name: "Zamknij" });
  assert.equal(close.getAttribute("type"), "button");
  assert.match(close.className, /focus-visible:ring-2/);
});

test("L13-RTL-02: failed support login announces a readable alert", async () => {
  const user = userEvent.setup();
  globalThis.fetch = async () => response({ error: "Nieprawidłowe hasło wsparcia" }, 403);
  renderModal();
  await user.type(screen.getByRole("textbox", { name: "Twój nick" }), "Sędzia1");
  const password = screen.getByLabelText("Hasło wsparcia") as HTMLInputElement;
  await user.type(password, "zle-haslo");
  await user.click(screen.getByRole("button", { name: "Zaloguj" }));
  const alert = await screen.findByRole("alert");
  assert.match(alert.textContent ?? "", /Nieprawidłowe hasło wsparcia/);
  assert.equal(password.getAttribute("aria-describedby"), alert.id);
});

test("L13-RTL-03: valid login preserves API payload and existing success callback", async () => {
  const user = userEvent.setup();
  const calls: Array<[string, string]> = [];
  let sent = 0;
  globalThis.fetch = async (input, init) => {
    if (!String(input).endsWith("/auth/support-login")) return response({});
    sent++;
    assert.match(String(input), /\/api\/tournaments\/77\/auth\/support-login$/);
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { password: "haslo-sedziego", nick: "Sędzia1" });
    return response({ sessionToken: "token-sedziego", nick: "Sędzia1" });
  };
  renderModal((token, nick) => calls.push([token, nick]));
  await user.type(screen.getByRole("textbox", { name: "Twój nick" }), "Sędzia1");
  await user.type(screen.getByLabelText("Hasło wsparcia"), "haslo-sedziego");
  await user.click(screen.getByRole("button", { name: "Zaloguj" }));
  await waitFor(() => assert.deepEqual(calls, [["token-sedziego", "Sędzia1"]]));
  assert.equal(sent, 1);
});
