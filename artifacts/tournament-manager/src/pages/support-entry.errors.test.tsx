import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import SupportEntry from "./support-entry";

const originalFetch = globalThis.fetch;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; sessionStorage.clear(); localStorage.clear(); });

test("L21: support form announces failure, unlocks retry, and avoids duplicate POST", async () => {
  let submissions = 0;
  let rejectFirst!: () => void;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input), "http://localhost").pathname;
    if (path === "/api/tournaments") return json([{ id: 11, name: "Turniej", format: "swiss", status: "active" }]);
    if (path.endsWith("/auth/support-login")) {
      submissions++;
      if (submissions === 1) return await new Promise<Response>(resolve => { rejectFirst = () => resolve(json({error: "Złe hasło"}, 403)); });
      return json({ sessionToken: "test-session", nick: "Sędzia" });
    }
    return json({}, 404);
  };
  const location = memoryLocation({ path: "/support" });
  const user = userEvent.setup();
  const ui = render(<TestAuthProvider><Router hook={location.hook} searchHook={location.searchHook}><SupportEntry /></Router></TestAuthProvider>);
  await user.click(await screen.findByRole("button", { name: /Turniej/ }));
  const nick = screen.getByRole("textbox", { name: /Twój nick/ });
  await user.type(nick, "Sędzia");
  await user.type(screen.getByLabelText("Hasło wsparcia"), "niepoprawne");
  const form = ui.container.querySelector("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => assert.equal(submissions, 1));
  rejectFirst();
  assert.match((await screen.findByRole("alert")).textContent ?? "", /Złe hasło/);
  await user.clear(screen.getByLabelText("Hasło wsparcia"));
  await user.type(screen.getByLabelText("Hasło wsparcia"), "poprawne");
  assert.equal(screen.queryByRole("alert"), null);
  fireEvent.submit(form);
  await waitFor(() => assert.equal(submissions, 2));
});
