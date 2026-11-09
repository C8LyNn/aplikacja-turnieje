import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setActiveOrganizerToken } from "@workspace/api-client-react";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import { getOrganizerToken, setOrganizerToken } from "@/lib/auth";
import { SecurityPanel } from "./security-panel";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  sessionStorage.clear();
  setActiveOrganizerToken(null);
});

test("a passwordless organizer can establish a password and immediately replaces its token", async () => {
  const tournamentId = 71;
  setOrganizerToken(tournamentId, "passwordless-token");
  const passwordRequest: {
    current: { body?: string; organizerToken?: string } | null;
  } = { current: null };
  let passwordSetCallbacks = 0;

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (url.endsWith(`/api/tournaments/${tournamentId}/auth/set-organizer-password`)) {
      passwordRequest.current = {
        body: String(init?.body),
        organizerToken: new Headers(init?.headers).get("X-Organizer-Token") ?? undefined,
      };
      return new Response(JSON.stringify({ token: "password-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  render(
    <AuthProvider>
      <SecurityPanel
        tournamentId={tournamentId}
        hasOrganizerPassword={false}
        onOrganizerPasswordSet={() => { passwordSetCallbacks += 1; }}
      />
    </AuthProvider>,
  );

  assert.match(
    screen.getByText(/po utracie bieżącej sesji/i).textContent ?? "",
    /ponownie zalogować/i,
  );
  await userEvent.type(
    screen.getByLabelText("Pierwsze hasło organizatora"),
    "new-organizer-password",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ustaw hasło organizatora" }));

  await waitFor(() => assert.equal(getOrganizerToken(tournamentId), "password-token"));
  assert.deepEqual(JSON.parse(passwordRequest.current?.body ?? "{}"), {
    newPassword: "new-organizer-password",
  });
  assert.equal(passwordRequest.current?.organizerToken, "passwordless-token");
  assert.equal(passwordSetCallbacks, 1);
  assert.equal(
    screen.queryByRole("button", { name: "Ustaw hasło organizatora" }),
    null,
  );
});
