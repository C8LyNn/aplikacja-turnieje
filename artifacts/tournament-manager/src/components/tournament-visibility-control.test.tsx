// #330 · hidden → public, hide again only before the start (with confirmation), organizer only.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentVisibilityControl, visibilityActions } from "./tournament-visibility-control";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

function mount(props: Partial<React.ComponentProps<typeof TournamentVisibilityControl>>, respond?: (body: unknown) => Response) {
  const calls: Array<{ url: string; body: { visibility: string }; token: string | null }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body, token: new Headers(init?.headers).get("X-Organizer-Token") });
    return respond ? respond(body) : new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><TournamentVisibilityControl tournamentId={7} status="draft" visibility="private_offline" orgToken="org-7" {...props} /></QueryClientProvider>);
  return calls;
}

test("#330: the state names visibility, not the play status; actions follow the lifecycle", () => {
  assert.deepEqual(
    [visibilityActions("private_offline", "draft").canPublish, visibilityActions("private_offline", "active").canPublish],
    [true, true], "a hidden tournament can always be published",
  );
  assert.equal(visibilityActions("public_online", "draft").canHide, true);
  assert.equal(visibilityActions("public_online", "active").canHide, false, "no hiding after the start");
  assert.match(visibilityActions("public_online", "active").note!, /Po rozpoczęciu/);
  assert.equal(visibilityActions("private_offline", "draft").label, "UKRYTY — niewidoczny dla widzów");
  assert.equal(visibilityActions(undefined, "draft").visibility, "public_online");
});

test("#330: one click publishes a hidden tournament (same id, organizer token)", async () => {
  const user = userEvent.setup();
  const calls = mount({});
  assert.ok(screen.getByLabelText("Widoczność: UKRYTY — niewidoczny dla widzów"));
  await user.click(screen.getByRole("button", { name: /Opublikuj turniej/ }));
  await waitFor(() => assert.equal(calls.length, 1));
  assert.match(calls[0].url, /\/api\/tournaments\/7\/auth\/change-visibility$/);
  assert.equal(calls[0].body.visibility, "public_online");
  assert.equal(calls[0].token, "org-7");
  assert.ok(await screen.findByText(/pod tym samym linkiem/));
});

test("#330: hiding asks first and is offered only before the start", async () => {
  const user = userEvent.setup();
  const calls = mount({ visibility: "public_online" });
  await user.click(screen.getByRole("button", { name: /Ukryj turniej/ }));
  assert.ok(screen.getByRole("alertdialog", { name: "Ukryć turniej?" }));
  assert.equal(calls.length, 0, "nothing changes before the confirmation");
  await user.click(screen.getByRole("button", { name: "Anuluj" }));
  assert.equal(calls.length, 0);
  await user.click(screen.getByRole("button", { name: /Ukryj turniej/ }));
  await user.click(screen.getAllByRole("button", { name: "Ukryj turniej" }).at(-1)!);
  await waitFor(() => assert.equal(calls.length, 1));
  assert.equal(calls[0].body.visibility, "private_offline");
  cleanup();
  mount({ visibility: "public_online", status: "active" });
  assert.equal(screen.queryByRole("button", { name: /Ukryj turniej/ }), null);
  assert.ok(screen.getByText("Po rozpoczęciu turnieju nie można go ukryć."));
});

test("#330: support sees the state only; a server refusal is shown, not hidden", async () => {
  mount({ orgToken: null });
  assert.ok(screen.getByLabelText(/Widoczność: UKRYTY/));
  assert.equal(screen.queryByRole("button", { name: /Opublikuj|Ukryj/ }), null);
  cleanup();
  const user = userEvent.setup();
  mount({ visibility: "public_online" }, () => new Response(JSON.stringify({ error: "Turniej został już rozpoczęty, więc nie można go ukryć. Ukrycie jest możliwe tylko przed startem.", code: "HIDE_AFTER_START_NOT_ALLOWED" }), { status: 409, headers: { "content-type": "application/json" } }));
  await user.click(screen.getByRole("button", { name: /Ukryj turniej/ }));
  await user.click(screen.getAllByRole("button", { name: "Ukryj turniej" }).at(-1)!);
  assert.match((await screen.findByRole("alert")).textContent ?? "", /tylko przed startem/);
});
