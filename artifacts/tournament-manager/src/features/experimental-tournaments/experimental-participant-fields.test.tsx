import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ParticipantFieldsManager } from "./experimental-participant-fields";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => { cleanup(); for (const client of clients.splice(0)) client.clear(); globalThis.fetch = originalFetch; });
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

const field = (key: string, label: string, category: string, description = "") => ({ key, libraryId: key, label, type: "short_text", category, kind: "profile", required: false, visibility: "organizer", description });

test("V5.8: the field library is searchable; empty categories fold away and a miss points to a custom field", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/participant-field-library")) {
      return json({ version: 1, categories: [{ id: "gaming", label: "Granie" }, { id: "location", label: "Miejsce" }], fields: [field("rank", "Ranga", "gaming", "Poziom w rankingu gry"), field("nick", "Nick w grze", "gaming"), field("city", "Miasto", "location")] });
    }
    if (url.includes("/participant-fields")) return json({ fields: { version: 1, fields: [] }, canEdit: true });
    return json({});
  }) as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  render(<QueryClientProvider client={client}><ParticipantFieldsManager tournamentId={7} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Dane zbierane od uczestnika/ }));
  fireEvent.click(await screen.findByRole("button", { name: /Z biblioteki/ }));
  await screen.findByRole("button", { name: /Miasto/ });
  fireEvent.change(screen.getByRole("searchbox", { name: "Szukaj w bibliotece pól" }), { target: { value: "rank" } });
  await waitFor(() => assert.equal(screen.queryByRole("button", { name: /Miasto/ }), null));
  assert.ok(screen.getByRole("button", { name: /Ranga/ }), "matches the description too");
  assert.equal(screen.queryByText("Miejsce"), null, "a category without matches folds away");
  fireEvent.change(screen.getByRole("searchbox", { name: "Szukaj w bibliotece pól" }), { target: { value: "wzrost" } });
  assert.match(screen.getByRole("status").textContent ?? "", /Brak takiego pola w bibliotece/);
});
