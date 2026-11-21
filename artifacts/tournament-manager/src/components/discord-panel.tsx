// #324-L05 · "Discord": connect a channel webhook, choose what is posted, see examples, test, check status, disconnect.
// Off by default; only the organizer sees it (sharing tab). The address is never shown back — only a masked hint.
import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KIND_TITLE,
  disconnectDiscord,
  discordErrorMessage,
  fetchDiscordPreview,
  fetchDiscordStatus,
  inviteDiscord,
  looksLikeDiscordWebhook,
  saveDiscord,
  testDiscord,
  type DiscordExample,
  type DiscordKind,
  type DiscordStatus,
} from "@/lib/discord-integration";

const ALL: DiscordKind[] = ["invite", "start", "pairings", "results", "advance", "finish"];
const newRequestId = () => {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

function DiscordCard({ example }: { example: DiscordExample }) {
  const embed = example.message.embeds[0];
  return (
    <div className="rounded-md bg-[#313338] p-3 text-sm text-[#dbdee1]" data-testid="discord-example" data-kind={example.kind}>
      <p className="text-xs font-semibold text-white">{example.message.username} <span className="ml-1 rounded bg-[#5865f2] px-1 text-[0.65rem]">APLIKACJA</span></p>
      <div className="mt-1 rounded border-l-4 bg-[#2b2d31] p-2" style={{ borderColor: `#${embed.color.toString(16).padStart(6, "0")}` }}>
        <p className="font-semibold text-white">{embed.title}</p>
        {embed.description && <p className="mt-1 whitespace-pre-line">{embed.description.replace(/\\([\\*_`~|>#[\]()-])/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1")}</p>}
        {embed.fields?.map((field) => <p key={field.name} className="mt-1 text-xs"><strong>{field.name}:</strong> {field.value}</p>)}
        {embed.footer && <p className="mt-1 text-xs text-[#949ba4]">{embed.footer.text}</p>}
      </div>
    </div>
  );
}

export function DiscordPanel({ tournamentId }: { tournamentId: number }) {
  const [status, setStatus] = useState<DiscordStatus | null>(null);
  const [examples, setExamples] = useState<DiscordExample[]>([]);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await fetchDiscordStatus(tournamentId));
    } catch (error) {
      setMessage({ tone: "error", text: discordErrorMessage(error, "Nie udało się wczytać ustawień Discord.") });
    }
  }, [tournamentId]);
  useEffect(() => { void load(); }, [load]);

  const act = async (name: string, run: () => Promise<string | void>) => {
    setBusy(name);
    setMessage(null);
    try {
      const text = await run();
      if (text) setMessage({ tone: "ok", text });
      await load();
    } catch (error) {
      setMessage({ tone: "error", text: discordErrorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  if (!status) return null;
  const events = new Set(status.events);
  const toggleEvent = (kind: DiscordKind) => {
    const next = events.has(kind) ? status.events.filter((e) => e !== kind) : [...status.events, kind];
    void act("events", async () => { await saveDiscord(tournamentId, { events: next }); });
  };
  const connect = () => act("connect", async () => {
    if (!looksLikeDiscordWebhook(url)) throw { data: { error: "To nie wygląda na adres webhooka Discord (https://discord.com/api/webhooks/…)." } };
    await saveDiscord(tournamentId, { webhookUrl: url.trim() });
    setUrl("");
    return "Webhook zapisany. Włącz powiadomienia, gdy będziesz gotów.";
  });

  return (
    <Card data-testid="discord-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" aria-hidden /> Discord</CardTitle>
        <CardDescription>Opcjonalnie: najważniejsze wydarzenia turnieju trafiają na wybrany kanał Discord. Uczestnicy nie potrzebują kont.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!status.public && (
          <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2" data-testid="discord-not-public">
            Turniej nie jest publiczny — nic nie jest wysyłane. Po opublikowaniu wiadomości dotyczą tylko tego, co wydarzy się od tej chwili.
          </p>
        )}
        {status.configured ? (
          <div className="space-y-2" data-testid="discord-status">
            <p>Kanał: <code className="rounded bg-muted px-1 text-xs">{status.hint}</code></p>
            <p>
              Stan: <strong data-testid="discord-state">{status.status === "ok" ? (status.enabled ? "włączone" : "wyłączone") : status.status === "broken" ? "webhook nie działa" : "wymaga ponownego podłączenia"}</strong>
              {status.lastDeliveryAt && <> · ostatnia wiadomość {new Date(status.lastDeliveryAt).toLocaleString("pl-PL")}</>}
              {status.counts && <> · wysłane {status.counts.sent}, w kolejce {status.counts.pending}{status.counts.failed ? `, nieudane ${status.counts.failed}` : ""}</>}
            </p>
            {status.lastError && <p className="text-destructive" data-testid="discord-error">{status.lastError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={status.enabled ? "outline" : "default"} disabled={!!busy || status.status !== "ok"}
                onClick={() => act("toggle", async () => { await saveDiscord(tournamentId, { enabled: !status.enabled }); return status.enabled ? "Powiadomienia wyłączone." : "Powiadomienia włączone — od teraz."; })}>
                {status.enabled ? "Wyłącz powiadomienia" : "Włącz powiadomienia"}
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("test", async () => { const r = await testDiscord(tournamentId); if (!r.ok) throw { data: { error: r.message } }; return r.message; })}>
                <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />Test połączenia
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy || !status.enabled || !events.has("invite") || !status.public}
                onClick={() => act("invite", async () => { const r = await inviteDiscord(tournamentId, newRequestId()); return r.queued ? "Zaproszenie w kolejce — pojawi się za kilka sekund." : "To zaproszenie zostało już wysłane."; })}>
                Wyślij zaproszenie
              </Button>
              {confirmDisconnect ? (
                <>
                  <Button size="sm" variant="destructive" disabled={!!busy} onClick={() => act("disconnect", async () => { await disconnectDiscord(tournamentId); setConfirmDisconnect(false); return "Odłączono. Adres i historia wiadomości zostały usunięte."; })}>Tak, odłącz</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>Anuluj</Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => setConfirmDisconnect(true)}><Unplug className="mr-1.5 h-3.5 w-3.5" aria-hidden />Odłącz</Button>
              )}
            </div>
          </div>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="font-medium">{status.configured ? "Zmień kanał" : "Podłącz kanał"}</legend>
          <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
            <li>W Discordzie: <strong>Ustawienia kanału → Integracje → Webhooki → Nowy webhook</strong>.</li>
            <li>Nadaj nazwę (np. „Turniej”), kliknij <strong>Kopiuj URL webhooka</strong>.</li>
            <li>Wklej adres poniżej. Traktuj go jak hasło — każdy, kto go zna, może pisać na kanale.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="discord-webhook">Adres webhooka Discord</label>
            <input id="discord-webhook" type="password" autoComplete="off" spellCheck={false} value={url} onChange={(event) => setUrl(event.target.value)}
              placeholder="https://discord.com/api/webhooks/…" className="min-h-10 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-xs" />
            <Button size="sm" className="min-h-10" disabled={!!busy || !url.trim()} onClick={() => void connect()}>Zapisz webhook</Button>
          </div>
        </fieldset>

        {status.configured && (
          <fieldset className="space-y-1.5" data-testid="discord-events">
            <legend className="font-medium">Co publikować</legend>
            {(status.kinds ?? ALL.map((kind) => ({ kind, label: KIND_TITLE[kind] }))).map(({ kind, label }) => (
              <label key={kind} className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" checked={events.has(kind)} disabled={!!busy} onChange={() => toggleEvent(kind)} />
                <span>{label}</span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Wiadomości nie oznaczają nikogo (@everyone, role i nicki są zablokowane). Prywatne odpowiedzi z formularza zapisów nigdy nie są wysyłane.</p>
          </fieldset>
        )}

        <details className="rounded-md border p-2" onToggle={(event) => { if ((event.target as HTMLDetailsElement).open && !examples.length) void fetchDiscordPreview(tournamentId).then((r) => setExamples(r.examples)).catch(() => {}); }}>
          <summary className="cursor-pointer font-medium">Przykładowe wiadomości</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2" data-testid="discord-examples">
            {examples.map((example, index) => <DiscordCard key={`${example.kind}-${index}`} example={example} />)}
          </div>
        </details>

        {status.recent && status.recent.length > 0 && (
          <details className="rounded-md border p-2" data-testid="discord-history">
            <summary className="cursor-pointer font-medium">Ostatnie wiadomości</summary>
            <ul className="mt-2 space-y-1">
              {status.recent.map((row, index) => (
                <li key={index} className="flex flex-wrap justify-between gap-2 text-xs">
                  <span>{row.title}</span>
                  <span className="text-muted-foreground">{row.status === "sent" ? "wysłana" : row.status === "pending" ? `w kolejce${row.attempts ? ` (próba ${row.attempts})` : ""}` : `nieudana: ${row.lastError ?? ""}`}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-destructive" : "text-emerald-500"} data-testid="discord-message">{message.text}</p>}
      </CardContent>
    </Card>
  );
}
