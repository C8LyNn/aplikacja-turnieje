// QW-06b · system share next to "Kopiuj link": offered only when the browser can share, never with secrets in the link
// or the text, and the copy fallback stays everywhere. QW-10 · empty lists say why and what comes next.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShareLinkButton } from "@/components/share-link-button";
import { SharingPanel } from "@/components/sharing-panel";
import { canShareLink, shareLink, shareText, shareableUrl } from "@/lib/link-share";
import { typedScore } from "@/components/score-input";
import { historyEmptyText, matchesEmptyState, queueEmptyText, standingsEmptyText } from "@/lib/organizer-empty-states";

const nav = globalThis.navigator as unknown as Record<string, unknown>;
afterEach(() => { cleanup(); delete nav.share; delete nav.canShare; });

function mockShare(impl: (data: ShareData) => Promise<void>) {
  const calls: ShareData[] = [];
  Object.defineProperty(nav, "share", { configurable: true, writable: true, value: async (data: ShareData) => { calls.push(data); return impl(data); } });
  return calls;
}

test("QW-06b: a shared link never carries tokens, passwords or codes, and the text never names a password", () => {
  assert.equal(shareableUrl("https://t.example/tournaments/7?token=abc&haslo=x&viewerPassword=y&accessCode=Z&kolejka=ready#org"),
    "https://t.example/tournaments/7?kolejka=ready");
  assert.equal(shareableUrl("https://t.example/tournaments/7/zapisy"), "https://t.example/tournaments/7/zapisy");
  assert.equal(shareText("password", "Liga"), "Turniej „Liga” — do obejrzenia potrzebne jest hasło widza od organizatora.");
  assert.equal(shareText("signup", "Liga"), "Zapisy do turnieju „Liga”");
  assert.match(shareText("public", ""), /„Turniej”/);
});

test("QW-06b: without navigator.share nothing extra is shown; cancelling the sheet is not an error", async () => {
  const target = { url: "https://t.example/tournaments/7?token=sekret", title: "Liga", text: shareText("public", "Liga") };
  assert.equal(canShareLink(target), false);
  assert.equal(await shareLink(target), "unavailable");
  const { container } = render(<ShareLinkButton target={target} />);
  assert.equal(container.innerHTML, "", "old browsers keep only the copy button");
  cleanup();

  const calls = mockShare(async () => { throw Object.assign(new Error("closed"), { name: "AbortError" }); });
  assert.equal(await shareLink(target), "cancelled");
  assert.deepEqual(calls[0], { title: "Liga", url: "https://t.example/tournaments/7", text: "Śledź turniej „Liga” na żywo." });
});

test("QW-06b: the share button opens the system sheet and reports a failure next to the copy fallback", async () => {
  let fail = false;
  const calls = mockShare(async () => { if (fail) throw new Error("blocked"); });
  render(<ShareLinkButton target={{ url: "https://t.example/tournaments/7", title: "Liga" }} label="Udostępnij link widza" />);
  const button = await screen.findByRole("button", { name: "Udostępnij link widza" });
  fireEvent.click(button);
  await waitFor(() => assert.equal(calls.length, 1));
  await waitFor(() => assert.equal(screen.getByRole("status").textContent, "Link udostępniony."));
  fail = true;
  fireEvent.click(button);
  await waitFor(() => assert.match(screen.getByRole("status").textContent ?? "", /Nie udało się otworzyć udostępniania/));
});

function renderSharing(visibility: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><SharingPanel tournament={{ id: 7, name: "Liga", visibility, status: "draft" }} orgToken="org-token-not-shared" /></QueryClientProvider>);
}

test("QW-06b: the sharing panel names what a viewer gets and offers the sheet only when viewers have access", async () => {
  const calls = mockShare(async () => {});
  renderSharing("private_online");
  const row = screen.getByTestId("sharing-viewer-link");
  assert.match(row.textContent ?? "", /Link widza — wymaga hasła widza.*Kibice otworzą link po podaniu hasła widza/);
  fireEvent.click(await screen.findByRole("button", { name: "Udostępnij link widza" }));
  await waitFor(() => assert.equal(calls.length, 1));
  assert.doesNotMatch(JSON.stringify(calls[0]), /org-token|login=|password=/i);
  assert.match(String(calls[0].url), /\/tournaments\/7$/);
  assert.equal(document.body.textContent?.includes("Chroniiony"), false);
  cleanup();

  renderSharing("private_offline");
  assert.match(screen.getByTestId("sharing-viewer-link").textContent ?? "", /widzowie nie mają dostępu/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(screen.queryByRole("button", { name: "Udostępnij link widza" }), null, "a hidden tournament is not offered for sharing");
  assert.ok(screen.getByRole("button", { name: "Kopiuj: link widza" }), "the organizer can still copy the address");
});

test("QW-10: typed scores accept only values within the cap", () => {
  assert.equal(typedScore("2", 2), 2);
  assert.equal(typedScore("02", 2), 2);
  assert.equal(typedScore("13", 2), null);
  assert.equal(typedScore("12", 2), 2, "the newly typed digit counts on its own");
  assert.equal(typedScore("", 2), 0);
  assert.equal(typedScore("x7", 99), 7);
  assert.equal(typedScore("53", 99), 53);
});

test("QW-10: empty lists say why they are empty and where the next step is", () => {
  assert.deepEqual(matchesEmptyState({ status: "draft", playerCount: 1, canManage: true }).tab, { value: "players", label: "Przejdź do uczestników" });
  assert.deepEqual(matchesEmptyState({ status: "draft", playerCount: 8, canManage: true }).tab?.value, "stages");
  assert.equal(matchesEmptyState({ status: "draft", playerCount: 8, canManage: false }).tab, undefined, "viewers get no organizer step");
  assert.match(matchesEmptyState({ status: "active", playerCount: 8, canManage: true }).text, /Co teraz\?/);
  assert.match(standingsEmptyText("active"), /po pierwszym zapisanym wyniku/);
  assert.match(historyEmptyText(true), /cofnąć albo poprawić/);
  assert.equal(historyEmptyText(false), "Nie ma jeszcze zapisanych wyników.");
  assert.equal(queueEmptyText({ status: "active", filtered: true }), "Brak meczów w tym stanie.");
  assert.match(queueEmptyText({ status: "completed", filtered: false }), /Wszystkie mecze rozegrane/);
});
