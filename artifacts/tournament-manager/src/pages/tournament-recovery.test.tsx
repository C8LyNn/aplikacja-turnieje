import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentDetail from "./tournament-detail";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => {
  cleanup(); clients.splice(0).forEach((client) => client.clear());
  globalThis.fetch = originalFetch; sessionStorage.clear(); localStorage.clear();
});

for (const privateTournament of [false, true]) {
  test(`direct tournament link offers organizer login after all storage is lost (private=${privateTournament})`, async () => {
    sessionStorage.clear(); localStorage.clear();
    globalThis.fetch = async (input) => {
      const url = String(input);
      let data: unknown = [];
      let status = 200;
      if (url.endsWith("/api/tournaments/71")) {
        if (privateTournament) { data = { code: "VIEWER_PASSWORD_REQUIRED", error: "Dostęp wymaga hasła." }; status = 403; }
        else data = { id: 71, name: "Recovery Cup", format: "single_elimination", status: "draft", visibility: "public_online", hasOrganizerPassword: true, hasHostCode: false, defaultBestOf: 1 };
      } else if (url.endsWith("/credential-state")) data = { exists: true, accessMode: "organizer_login", private: privateTournament };
      else if (url.endsWith("/bracket")) data = { rounds: [], winner: null };
      else if (url.endsWith("/assistant")) data = { stepTitle: "Przygotowanie", nextAction: "Dodaj graczy" };
      else if (url.endsWith("/stats")) data = { totalPlayers: 0, totalMatches: 0, completedMatches: 0 };
      return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
    clients.push(client);
    const location = memoryLocation({ path: "/tournaments/71" });
    render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><TournamentDetail /></AuthProvider></Router></QueryClientProvider>);
    const enter = await screen.findByRole("button", { name: "Wejdź jako organizator" });
    await userEvent.click(enter);
    assert.ok(await screen.findByLabelText("Hasło organizatora"));
    assert.equal(sessionStorage.getItem("tm_org_71"), null);
  });
}
