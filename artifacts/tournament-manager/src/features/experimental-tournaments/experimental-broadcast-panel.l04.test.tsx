// #324-L04 · the overlay gallery, alerts as the overlay's own opt-in setting, the StreamElements export of the same
// page, the panel in Classic, and experiments kept apart from working tools.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { Match, TournamentStage } from "@workspace/api-client-react";
import { ExperimentalBroadcastPanel } from "./experimental-broadcast-panel";
import { streamElementsOverlayWidget, streamElementsProblems } from "@/lib/stream-elements-overlay";

const originalFetch = globalThis.fetch;
beforeEach(() => { try { window.localStorage.clear(); } catch { /* storage unavailable */ } });
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

const stage = { id: 1, tournamentId: 5, stageKey: "s1", position: 1, name: "Puchar", format: "single_elimination", status: "active", participantCount: 4, bestOf: 1 } as unknown as TournamentStage;
const matches = [
  { id: 11, revision: 1, tournamentId: 5, stageId: 1, round: 1, matchNumber: 1, bestOf: 1, status: "in_progress", player1Id: 1, player2Id: 2, player1Name: "Ada", player2Name: "Bartek" },
] as unknown as Match[];

function renderPanel(experimental: boolean) {
  globalThis.fetch = async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <Router hook={memoryLocation({ path: `${experimental ? "/experimental" : ""}/tournaments/5?tab=broadcast` }).hook}>
        <ExperimentalBroadcastPanel tournament={{ id: 5, name: "Puchar", visibility: "public_online", featuredMatchId: 11, activeStageId: 1 }}
          matches={matches} stages={[stage]} canFeature experimental={experimental} />
      </Router>
    </QueryClientProvider>,
  );
}
const address = () => (screen.getByLabelText("Adres nakładki") as HTMLInputElement).value;

test("L04 gallery: six ready presentations, each writes its overlay address; the preview follows", async () => {
  const user = userEvent.setup();
  renderPanel(true);
  const gallery = screen.getByTestId("broadcast-gallery");
  assert.deepEqual(within(gallery).getAllByRole("radio").map((r) => r.closest("label")?.getAttribute("data-gallery")),
    ["wynik", "teraz", "nastepny", "ostatni", "zwyciezca", "struktura"]);
  const expected: Record<string, RegExp> = {
    teraz: /\?t=5&mecz=auto$/, nastepny: /\?t=5&widok=zapowiedz&mecz=nastepny$/, ostatni: /\?t=5&mecz=ostatni$/,
    zwyciezca: /\?t=5&widok=zwyciezca$/, struktura: /\?t=5&widok=struktura$/, wynik: /\/overlay\.html\?t=5$/,
  };
  for (const [id, pattern] of Object.entries(expected)) {
    await user.click(gallery.querySelector(`[data-gallery="${id}"] input`)!);
    assert.match(address(), pattern, id);
    assert.equal(screen.getByTitle("Podgląd nakładki").getAttribute("src"), address());
  }
});

test("L04 alerts: off by default, one checkbox turns them on for this overlay only; none on the board view", async () => {
  const user = userEvent.setup();
  renderPanel(true);
  const box = screen.getByRole("checkbox", { name: /Alerty na wizji/ }) as HTMLInputElement;
  assert.equal(box.checked, false);
  assert.doesNotMatch(address(), /alerty/);
  await user.click(box);
  assert.match(address(), /alerty=1/);
  await user.selectOptions(screen.getByRole("combobox", { name: "Animacje" }), "0");
  assert.match(address(), /ruch=0&alerty=1$/, "animation level and alerts are separate settings");
  await user.click(screen.getByTestId("broadcast-gallery").querySelector('[data-gallery="struktura"] input')!);
  assert.equal((screen.getByRole("checkbox", { name: /Alerty na wizji/ }) as HTMLInputElement).disabled, true);
  assert.doesNotMatch(address(), /alerty/);
});

test("L04 Classic: the same panel, links stay in Classic; experiments are labelled and kept apart", () => {
  renderPanel(false);
  assert.equal(screen.getByRole("link", { name: /Wróć do prowadzenia/ }).getAttribute("href"), "/tournaments/5/host");
  const experiments = screen.getByTestId("broadcast-experiments");
  assert.match(experiments.textContent ?? "", /Eksperymenty.*przykładowe wiadomości.*alertów follow\/sub\/raid nie ma/);
  assert.match(address(), /\/overlay\.html\?t=5$/);
});

test("L04 StreamElements: the widget frames the same overlay address, escaped, with honest warnings", async () => {
  const widget = streamElementsOverlayWidget("https://turnieje.example/overlay.html?t=5&mecz=auto&x=\"><script>", { width: 1920, height: 1080 });
  assert.match(widget.html, /<iframe id="swarm-overlay" src="https:\/\/turnieje\.example\/overlay\.html\?t=5&amp;mecz=auto&amp;x=&quot;&gt;&lt;script&gt;"/);
  assert.doesNotMatch(widget.html, /<script>/);
  assert.match(widget.css, /background: transparent/);
  assert.equal(widget.fields, "{}");
  assert.deepEqual(widget.problems, []);
  assert.equal(streamElementsProblems("http://127.0.0.1:18312/overlay.html?t=5").length, 2, "http and a local address");
  assert.match(streamElementsProblems("https://x.example/overlay.html?t=5&token=abc").join(" "), /dane dostępu/);

  const user = userEvent.setup();
  renderPanel(true);
  const se = screen.getByTestId("broadcast-streamelements") as HTMLDetailsElement;
  assert.equal(se.open, false, "folded: OBS stays the main path");
  await user.click(within(se).getByText("StreamElements (Custom Widget)"));
  assert.match(within(se).getByTestId("broadcast-se-problems").textContent ?? "", /https/, "the local test address is flagged");
  assert.ok(within(se).getByRole("button", { name: "Kopiuj HTML" }));
  assert.match(se.textContent ?? "", /nie łączy się z czatem ani alertami follow\/sub\/raid/);
  assert.ok(se.textContent?.includes(address().replace(/&/g, "&amp;")), "the widget uses exactly the OBS address");
});
