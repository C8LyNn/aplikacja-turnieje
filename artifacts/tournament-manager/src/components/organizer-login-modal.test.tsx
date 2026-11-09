import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setActiveOrganizerToken, setActiveSupportToken, setActiveViewerToken } from "@workspace/api-client-react";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import { getOrganizerToken, setOrganizerToken, getStoredRole } from "@/lib/auth";
import { OrganizerLoginModal } from "./organizer-login-modal";

const originalFetch = globalThis.fetch;
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  sessionStorage.clear(); localStorage.clear();
  setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null);
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});

for (const initialRole of [null, "fan"] as const) {
  test(`lost session can log in with saved password from role ${initialRole}`, async () => {
    setOrganizerToken(71, "old-creation-session");
    sessionStorage.clear(); localStorage.clear();
    if (initialRole) localStorage.setItem("tm_role", initialRole);
    let successes = 0;
    const submitted: Array<{ url: string; body: unknown }> = [];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/credential-state")) return json({ exists: true, accessMode: "organizer_login", private: false });
      submitted.push({ url, body: JSON.parse(String(init?.body)) });
      return json({ token: "restored-organizer-session" });
    };
    render(<AuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Recovery Cup" onSuccess={() => { successes++; }} /></AuthProvider>);
    const input = await screen.findByLabelText("Hasło organizatora");
    assert.equal(getOrganizerToken(71), null);
    await userEvent.type(input, "saved-password");
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj" }));
    await waitFor(() => assert.equal(successes, 1));
    assert.equal(getOrganizerToken(71), "restored-organizer-session");
    assert.equal(getStoredRole(), "organizer");
    assert.deepEqual(submitted, [{ url: "/api/tournaments/71/auth/organizer-login", body: { password: "saved-password" } }]);
    assert.equal((input as HTMLInputElement).value, "");
    assert.equal(JSON.stringify({ ...localStorage }).includes("saved-password"), false);
    assert.equal(JSON.stringify({ ...sessionStorage }).includes("saved-password"), false);
  });
}

test("wrong password keeps viewer access and lets the user retry; two submits send once", async () => {
  localStorage.setItem("tm_role", "fan");
  let attempts = 0;
  let successes = 0;
  let release!: () => void;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith("/credential-state")) return json({ exists: true, accessMode: "organizer_login", private: false });
    attempts++;
    if (attempts === 1) {
      return await new Promise<Response>((resolve) => { release = () => resolve(json({ error: "Nie udało się zweryfikować poświadczeń." }, 403)); });
    }
    return json({ token: "valid-session" });
  };
  const { container } = render(<AuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Recovery Cup" onSuccess={() => { successes++; }} /></AuthProvider>);
  const input = await screen.findByLabelText("Hasło organizatora");
  await userEvent.type(input, "wrong-password");
  fireEvent.submit(container.querySelector("form")!);
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => assert.equal(attempts, 1));
  assert.equal((screen.getByRole("button", { name: "Sprawdzanie…" }) as HTMLButtonElement).disabled, true);
  release();
  await screen.findByText("Nie udało się zweryfikować poświadczeń.");
  assert.equal(getOrganizerToken(71), null);
  assert.equal(getStoredRole(), "fan");
  assert.equal(successes, 0);
  await userEvent.clear(input);
  await userEvent.type(input, "correct-password");
  await userEvent.click(screen.getByRole("button", { name: "Zaloguj" }));
  await waitFor(() => assert.equal(successes, 1));
});

test("an existing credentialless tournament offers no public takeover", async () => {
  let loginAttempts = 0;
  globalThis.fetch = async (input) => {
    if (!String(input).endsWith("/credential-state")) loginAttempts++;
    return json({ exists: true, accessMode: "admin_recovery", private: false });
  };
  render(<AuthProvider><OrganizerLoginModal tournamentId={71} tournamentName="Legacy" onSuccess={() => assert.fail("must not authenticate")} /></AuthProvider>);
  await screen.findByText(/nie ma poświadczeń do samodzielnego odzyskania/);
  assert.equal(screen.queryByRole("button", { name: "Zaloguj" }), null);
  assert.equal(loginAttempts, 0);
  assert.equal(getOrganizerToken(71), null);
});
