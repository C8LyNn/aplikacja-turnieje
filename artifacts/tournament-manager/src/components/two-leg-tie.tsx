/**
 * V5.10 · two-legged ties (dwumecz): the summary every view shows (both legs, the aggregate, who advances) and the
 * host's editor (score of each leg, its date, correcting a leg, the organizer's decision on a level aggregate).
 * One component for Stable and Experimental; the API decides everything (aggregate, advancement, blocks).
 */
import { useEffect, useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Match } from "@workspace/api-client-react";
import { useDecideMatchTie, useRecordMatchLegResult, useRevertMatchLegResult, useScheduleMatchLeg } from "@workspace/api-client-react";
import { legScoreFromHomeFirst } from "@workspace/match-rules";
import { Button } from "@/components/ui/button";
import { formatLegDate, isTwoLegTie, tieLegRows, tieSentence, TIE_STATE_LABELS } from "@/lib/two-leg-tie-view";

function errorText(error: unknown): string {
  const data = (error as { data?: { error?: unknown } } | null)?.data;
  if (data && typeof data.error === "string") return data.error;
  return error instanceof Error ? error.message : "Nie udało się zapisać. Spróbuj ponownie.";
}

/** Both legs and the aggregate, readable without knowing the data model (bracket details, lists, viewers, Stable). */
export function TwoLegTieSummary({ match, compact = false }: { match: Match; compact?: boolean }) {
  if (!isTwoLegTie(match)) return null;
  const rows = tieLegRows(match);
  return (
    <div className="two-leg-tie space-y-1.5 text-sm" data-testid="two-leg-tie-summary" data-state={match.tie.state}>
      {!compact && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dwumecz · {TIE_STATE_LABELS[match.tie.state] ?? match.tie.state}</p>}
      <ol className="space-y-1" aria-label="Spotkania dwumeczu">
        {rows.map((row) => (
          <li key={row.leg} className="grid grid-cols-[auto_1fr] gap-x-2 sm:grid-cols-[7.5rem_1fr]">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="min-w-0">
              <span className="break-words">{row.homeName}</span>{" "}
              <strong className="tabular-nums">{row.played ? `${row.homeScore}:${row.awayScore}` : "–:–"}</strong>{" "}
              <span className="break-words">{row.awayName}</span>
              {!row.played && <span className="block text-xs text-muted-foreground sm:inline sm:ml-2">{formatLegDate(row.scheduledAt)}</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="font-medium" data-testid="two-leg-tie-total">{tieSentence(match)}</p>
    </div>
  );
}

function ScoreStepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label={`Odejmij: ${label}`} disabled={disabled || value <= 0} onClick={() => onChange(Math.max(0, value - 1))}><Minus className="h-4 w-4" /></Button>
      <input
        type="number" inputMode="numeric" min={0} max={999} aria-label={label} value={value} disabled={disabled}
        className="h-9 w-14 rounded-md border bg-background text-center text-lg font-bold tabular-nums"
        onChange={(event) => { const next = Number(event.target.value); onChange(Number.isFinite(next) ? Math.max(0, Math.min(999, Math.trunc(next))) : 0); }}
      />
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label={`Dodaj: ${label}`} disabled={disabled || value >= 999} onClick={() => onChange(Math.min(999, value + 1))}><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** The host's editor of one tie (replaces the single-score editor of "Wybrany mecz" for two-legged ties). */
export function TwoLegTieEditor({ match, canWrite, onChanged }: { match: Match; canWrite: boolean; onChanged: () => Promise<void> | void }) {
  const id = useId();
  const record = useRecordMatchLegResult();
  const revert = useRevertMatchLegResult();
  const schedule = useScheduleMatchLeg();
  const decide = useDecideMatchTie();
  const [drafts, setDrafts] = useState<Record<number, { home: number; away: number }>>({});
  const [dates, setDates] = useState<Record<number, string>>({});
  const [confirmRevert, setConfirmRevert] = useState<1 | 2 | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  useEffect(() => { setDrafts({}); setDates({}); setConfirmRevert(null); setWinner(null); setReason(""); setMessage(null); }, [match.id]);
  if (!isTwoLegTie(match)) return null;
  const rows = tieLegRows(match);
  const pending = record.isPending || revert.isPending || schedule.isPending || decide.isPending;
  const participantsKnown = match.player1Id != null && match.player2Id != null;
  const decided = match.status === "completed";
  const run = async (work: () => Promise<unknown>, success: string) => {
    setMessage(null);
    try {
      await work();
      setMessage({ kind: "ok", text: success });
    } catch (error) {
      setMessage({ kind: "error", text: errorText(error) });
    } finally {
      await onChanged();
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`${id}-title`} data-testid="two-leg-tie-editor">
      <div>
        <h3 id={`${id}-title`} className="text-sm font-semibold">Dwumecz — dwa spotkania, awansuje zwycięzca sumy</h3>
        <p className="text-xs text-muted-foreground">Wpisz wynik każdego spotkania osobno (bramki lub punkty, remis w jednym spotkaniu jest możliwy). Gospodarz jest podany pierwszy.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const legData = match.legs!.find((leg) => leg.leg === row.leg)!;
          const draft = drafts[row.leg] ?? { home: 0, away: 0 };
          return (
            <article key={row.leg} className="rounded-lg border p-3 space-y-3" data-testid={`two-leg-${row.leg}`} data-played={row.played ? "true" : "false"} aria-label={`${row.label}: ${row.homeName} – ${row.awayName}`}>
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold">{row.label}</h4>
                <span className="text-xs text-muted-foreground">gospodarz: {row.homeName}</span>
              </header>
              {row.played ? (
                <>
                  <p className="text-center text-lg"><span className="break-words">{row.homeName}</span> <strong className="tabular-nums text-2xl">{row.homeScore}:{row.awayScore}</strong> <span className="break-words">{row.awayName}</span></p>
                  {canWrite && confirmRevert !== row.leg && (
                    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirmRevert(row.leg)}>Popraw wynik spotkania</Button>
                  )}
                  {canWrite && confirmRevert === row.leg && (
                    <div role="alertdialog" aria-label="Potwierdź cofnięcie wyniku spotkania" className="space-y-2 rounded-md border border-orange-500/40 bg-orange-500/10 p-2 text-sm">
                      <p>Cofnąć wynik tego spotkania? {decided ? "Dwumecz jest rozstrzygnięty — awans zostanie cofnięty, jeśli następny mecz jeszcze się nie zaczął (inaczej system zablokuje zmianę)." : "Suma zostanie przeliczona po ponownym wpisaniu wyniku."}</p>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => { setConfirmRevert(null); void run(() => revert.mutateAsync({ id: match.id, leg: row.leg, data: { expectedRevision: legData.revision } }), `Cofnięto wynik: ${row.label}. Wpisz poprawny wynik.`); }}>Cofnij wynik spotkania</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRevert(null)}>Anuluj</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : canWrite && participantsKnown && !decided ? (
                <>
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                    <div className="flex flex-col items-center gap-1"><span className="text-sm break-words text-center">{row.homeName}</span><ScoreStepper label={`${row.label}, ${row.homeName}`} value={draft.home} disabled={pending} onChange={(home) => setDrafts((previous) => ({ ...previous, [row.leg]: { ...draft, home } }))} /></div>
                    <span className="text-muted-foreground" aria-hidden="true">:</span>
                    <div className="flex flex-col items-center gap-1"><span className="text-sm break-words text-center">{row.awayName}</span><ScoreStepper label={`${row.label}, ${row.awayName}`} value={draft.away} disabled={pending} onChange={(away) => setDrafts((previous) => ({ ...previous, [row.leg]: { ...draft, away } }))} /></div>
                  </div>
                  <Button type="button" className="w-full" disabled={pending} onClick={() => {
                    const stored = legScoreFromHomeFirst(row.leg, draft.home, draft.away);
                    void run(() => record.mutateAsync({ id: match.id, leg: row.leg, data: { ...stored, expectedRevision: legData.revision } }), `Zapisano: ${row.label} ${row.homeName} ${draft.home}:${draft.away} ${row.awayName}.`);
                  }}>Zapisz wynik: {row.label.toLowerCase()}</Button>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-muted-foreground">Termin spotkania
                      <input type="datetime-local" className="mt-1 block rounded-md border bg-background px-2 py-1 text-sm" value={dates[row.leg] ?? toLocalInput(row.scheduledAt)} onChange={(event) => setDates((previous) => ({ ...previous, [row.leg]: event.target.value }))} />
                    </label>
                    <Button type="button" variant="outline" size="sm" disabled={pending || dates[row.leg] === undefined} onClick={() => {
                      const value = dates[row.leg];
                      void run(() => schedule.mutateAsync({ id: match.id, leg: row.leg, data: { scheduledAt: value ? new Date(value).toISOString() : null, expectedScheduledAt: row.scheduledAt } }), `Zapisano termin: ${row.label.toLowerCase()}.`);
                    }}>Zapisz termin</Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{!participantsKnown ? "Para jeszcze nieznana — czeka na zwycięzców poprzedniej rundy." : `Jeszcze nie rozegrane · ${formatLegDate(row.scheduledAt)}`}</p>
              )}
            </article>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="rounded-md border bg-muted/30 p-3 font-medium" data-testid="two-leg-tie-total">
        {tieSentence(match)}
      </p>

      {match.tie.state === "awaiting_decision" && canWrite && match.tie.total1 !== match.tie.total2 && (
        <div className="space-y-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3" data-testid="two-leg-tie-confirm">
          <p className="text-sm">Oba spotkania są rozegrane, a suma wskazuje zwycięzcę. Zatwierdź awans, aby przejść dalej.</p>
          <Button type="button" disabled={pending} onClick={() => { void run(() => decide.mutateAsync({ id: match.id, data: { expectedRevision: match.revision } }), "Awans zatwierdzony według sumy."); }}>Zatwierdź awans według sumy</Button>
        </div>
      )}
      {match.tie.state === "awaiting_decision" && canWrite && match.tie.total1 === match.tie.total2 && (
        <fieldset className="space-y-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3" data-testid="two-leg-tie-decision">
          <legend className="px-1 text-sm font-semibold">Remis w sumie — kto awansuje?</legend>
          <p className="text-sm">System nie wybiera zwycięzcy przy równej sumie i nie wymyśla wyniku dogrywki ani rzutów karnych. Wskaż, kto awansuje (np. po dogrywce lub karnych rozegranych na boisku), i podaj powód — widzowie go zobaczą.</p>
          <div className="flex flex-col gap-2 sm:flex-row" role="radiogroup" aria-label="Kto awansuje">
            {[{ id: match.player1Id!, name: match.player1Name }, { id: match.player2Id!, name: match.player2Name }].map((option) => (
              <label key={option.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                <input type="radio" name={`${id}-winner`} checked={winner === option.id} onChange={() => setWinner(option.id)} /> {option.name}
              </label>
            ))}
          </div>
          <label className="block text-sm">Powód rozstrzygnięcia (widoczny dla widzów)
            <input type="text" maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="np. rzuty karne 4:3 albo dogrywka 1:0" className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5" />
          </label>
          <Button type="button" disabled={pending || winner == null || reason.trim().length === 0} onClick={() => {
            void run(() => decide.mutateAsync({ id: match.id, data: { winnerId: winner!, reason: reason.trim(), expectedRevision: match.revision } }), "Zapisano rozstrzygnięcie — awans wykonany.");
          }}>Zatwierdź awans</Button>
        </fieldset>
      )}
      {match.tie.state === "awaiting_decision" && !canWrite && <p className="text-sm text-yellow-300">Awans wstrzymany do decyzji organizatora.</p>}
      {message && <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-destructive" : "text-green-400"}`}>{message.text}</p>}
    </section>
  );
}
