// #324-L05 · the Discord panel: off by default, checks the address before sending it, never shows it back, event choice,
// test, invite, disconnect with confirmation, examples, and a clear notice for a tournament that is not public.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DiscordPanel } from "@/components/discord-panel";
import { looksLikeDiscordWebhook } from "@/lib/discord-integration";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

const WEBHOOK = `https://discord.com/api/webhooks/123456789012345678/${"x".repeat(68)}`;
const kinds = ["invite", "start", "pairings", "results", "advance", "finish"].map((kind) => ({ kind, label: `Etykieta ${kind}` }));

function mount(initial: Record<string, unknown>) {
  let state: Record<string, unknown> = { configured: false, enabled: false, events: kinds.map((k) => k.kind), public: true, kinds, ...initial };
  const calls: { method: string; url: string; body: any }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url, body });
    if (method === "PUT") state = { ...state, configured: true, hint: "discord.com/api/webhooks/1234…5678/••••", status: "ok", ...("enabled" in body ? { enabled: body.enabled } : {}), ...(body.events ? { events: body.events } : {}) };
    if (method === "DELETE") { state = { configured: false, enabled: false, events: kinds.map((k) => k.kind), public: true, kinds }; return new Response(null, { status: 204 }); }
    if (url.endsWith("/discord/test")) return Response.json({ ok: true, message: "Wiadomość testowa wysłana — sprawdź kanał." });
    if (url.endsWith("/discord/invite")) return Response.json({ queued: true });
    if (url.endsWith("/discord/preview")) return Response.json({ examples: [{ kind: "results", message: { username: "SWARM-006", embeds: [{ title: "Wygrywa Ada", description: "Ada **2:1** Bartek", color: 0xf59e0b, footer: { text: "Puchar · Finał" } }] } }] });
    return Response.json(state);
  }) as typeof fetch;
  render(<DiscordPanel tournamentId={7} />);
  return calls;
}

test("L05 panel: connect checks the address first, never shows it back; events, test, invite, disconnect with confirmation", async () => {
  assert.equal(looksLikeDiscordWebhook(WEBHOOK), true);
  assert.equal(looksLikeDiscordWebhook("https://evil.example/api/webhooks/1/x"), false);
  const calls = mount({});
  const input = await screen.findByLabelText("Adres webhooka Discord") as HTMLInputElement;
  assert.equal(input.type, "password", "the address is treated like a password");
  fireEvent.change(input, { target: { value: "https://example.com/hook" } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz webhook" }));
  assert.match((await screen.findByRole("alert")).textContent ?? "", /nie wygląda na adres webhooka/);
  assert.equal(calls.filter((c) => c.method === "PUT").length, 0, "nothing sent for a wrong address");

  fireEvent.change(input, { target: { value: WEBHOOK } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz webhook" }));
  await screen.findByTestId("discord-status");
  assert.deepEqual(calls.find((c) => c.method === "PUT")!.body, { webhookUrl: WEBHOOK });
  assert.equal(input.value, "", "the field is cleared after saving");
  assert.doesNotMatch(document.body.textContent ?? "", /xxxxxxxx/, "the token is never shown back");
  assert.equal(screen.getByTestId("discord-state").textContent, "wyłączone", "off until switched on");

  fireEvent.click(screen.getByRole("button", { name: "Włącz powiadomienia" }));
  await waitFor(() => assert.equal(screen.getByTestId("discord-state").textContent, "włączone"));
  fireEvent.click(within(screen.getByTestId("discord-events")).getByLabelText("Etykieta pairings"));
  await waitFor(() => assert.deepEqual(calls.filter((c) => c.method === "PUT").at(-1)!.body, { events: ["invite", "start", "results", "advance", "finish"] }));

  fireEvent.click(screen.getByRole("button", { name: /Test połączenia/ }));
  assert.match((await screen.findByTestId("discord-message")).textContent ?? "", /Wiadomość testowa wysłana/);
  fireEvent.click(screen.getByRole("button", { name: "Wyślij zaproszenie" }));
  await waitFor(() => assert.match(calls.find((c) => c.url.endsWith("/invite"))!.body.requestId, /^[0-9a-f]{24}$/));

  fireEvent.click(screen.getByRole("button", { name: /Odłącz/ }));
  assert.equal(calls.filter((c) => c.method === "DELETE").length, 0, "a first click only asks");
  fireEvent.click(screen.getByRole("button", { name: "Tak, odłącz" }));
  await waitFor(() => assert.equal(screen.queryByTestId("discord-status"), null));
  assert.equal(calls.filter((c) => c.method === "DELETE").length, 1);
});

test("L05 panel: examples look like Discord messages; a non-public tournament says nothing is sent", async () => {
  mount({ configured: true, enabled: true, status: "ok", hint: "discord.com/api/webhooks/1234…5678/••••", public: false, recent: [{ kind: "results", status: "sent", attempts: 1, lastError: null, createdAt: "2026-11-21T10:00:00Z", sentAt: "2026-11-21T10:00:01Z", title: "Wygrywa Ada" }] });
  assert.match((await screen.findByTestId("discord-not-public")).textContent ?? "", /nic nie jest wysyłane/);
  assert.equal((screen.getByRole("button", { name: "Wyślij zaproszenie" }) as HTMLButtonElement).disabled, true);
  const details = screen.getByText("Przykładowe wiadomości").closest("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  const card = await screen.findByTestId("discord-example");
  assert.match(card.textContent ?? "", /Wygrywa Ada.*Ada 2:1 Bartek.*Puchar · Finał/);
  assert.match(screen.getByTestId("discord-history").textContent ?? "", /Wygrywa Ada.*wysłana/);
});
