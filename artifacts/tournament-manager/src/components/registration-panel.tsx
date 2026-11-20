/**
 * #329 · "Zapisy" in the participants tab (Classic and Experimental). Optional: while off, the organizer adds
 * participants by hand as always. The owner switches the public page on/off, opens/closes it and picks manual or
 * automatic acceptance; the owner and support with "participants.manage" review sign-ups. Accepting adds the person to
 * this same participant list (the server uses the manual-add path), so seeding and brackets see one list.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPlayersQueryKey } from "@workspace/api-client-react";
import { Check, ClipboardList, ExternalLink, Loader2, X } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { ShareLinkButton } from "@/components/share-link-button";
import { shareText } from "@/lib/link-share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ParticipantFieldInputs, ParticipantFieldsManager, useParticipantFields } from "@/features/experimental-tournaments/experimental-participant-fields";
import { formValuesToPayload, formatFieldValue } from "@/features/experimental-tournaments/participant-fields-model";
import {
  approveRegistration,
  fetchRegistrations,
  registrationErrorMessage,
  registrationPath,
  rejectRegistration,
  saveRegistrationSettings,
  type RegistrationList,
  type RegistrationRow,
} from "@/lib/registrations";

const STATE_LABEL: Record<RegistrationList["state"], string> = {
  disabled: "Wyłączone",
  hidden: "Turniej ukryty — formularz niedostępny",
  started: "Zamknięte — turniej wystartował",
  closed: "Zamknięte",
  open: "Otwarte",
};

export function RegistrationPanel({
  tournamentId,
  experimental,
  canConfigure,
  canReview,
  participantNoun = "uczestników",
  tournamentName = "",
}: {
  tournamentId: number;
  experimental: boolean;
  /** Owner only: switch on/off, open/close, acceptance mode, limit, note. */
  canConfigure: boolean;
  /** Owner or support with "participants.manage": accept / reject sign-ups. */
  canReview: boolean;
  participantNoun?: string;
  /** QW-06b: names the tournament in the system share sheet. */
  tournamentName?: string;
}) {
  const client = useQueryClient();
  const fields = useParticipantFields(tournamentId);
  const [data, setData] = useState<RegistrationList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ approval: "manual" | "auto"; capacity: string; note: string } | null>(null);
  const [rejecting, setRejecting] = useState<RegistrationRow | null>(null);
  const [completing, setCompleting] = useState<{ id: number; values: Record<string, unknown> } | null>(null);
  const [showDecided, setShowDecided] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchRegistrations(tournamentId);
      // An older API (or an unexpected answer) has no sign-ups: show nothing rather than guess.
      if (!next || typeof next !== "object" || !next.settings || !Array.isArray(next.registrations)) { setData(null); setLoadError(null); return; }
      setData(next);
      setLoadError(null);
      setDraft((current) => current ?? { approval: next.settings.approval, capacity: next.settings.capacity == null ? "" : String(next.settings.capacity), note: next.settings.note ?? "" });
    } catch (failure) {
      setLoadError(registrationErrorMessage(failure, "Nie udało się wczytać zapisów."));
    }
  }, [tournamentId]);
  useEffect(() => { void refresh(); }, [refresh]);
  // New sign-ups arrive while the organizer looks at the list.
  useEffect(() => {
    if (!data?.settings.enabled) return;
    const timer = window.setInterval(() => { void refresh(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [data?.settings.enabled, refresh]);

  const link = typeof window === "undefined" ? registrationPath(tournamentId, experimental) : `${window.location.origin}${registrationPath(tournamentId, experimental)}`;
  const labels = useMemo(() => new Map(fields.map((field) => [field.key, field])), [fields]);
  const pending = data?.registrations.filter((row) => row.status === "pending") ?? [];
  const decided = data?.registrations.filter((row) => row.status !== "pending") ?? [];

  const save = async (patch: Partial<{ enabled: boolean; open: boolean }>, note?: string) => {
    if (!data || !draft) return;
    const capacity = draft.capacity.trim() === "" ? null : Number(draft.capacity);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) { setMessage({ tone: "error", text: "Limit miejsc: liczba całkowita od 1 albo puste pole (bez limitu)." }); return; }
    setBusy("settings"); setMessage(null);
    try {
      await saveRegistrationSettings(tournamentId, {
        enabled: patch.enabled ?? data.settings.enabled,
        open: patch.open ?? data.settings.open,
        approval: draft.approval,
        capacity,
        note: draft.note.trim() || null,
      });
      setMessage({ tone: "ok", text: note ?? "Zapisano ustawienia zapisów." });
      await refresh();
    } catch (failure) {
      setMessage({ tone: "error", text: registrationErrorMessage(failure, "Nie udało się zapisać ustawień.") });
    } finally {
      setBusy(null);
    }
  };

  const approve = async (row: RegistrationRow, values?: Record<string, unknown>) => {
    setBusy(`r${row.id}`); setMessage(null);
    try {
      const missingFields = row.missing.map((item) => labels.get(item.key)).filter((field): field is NonNullable<typeof field> => !!field);
      await approveRegistration(tournamentId, row.id, values ? formValuesToPayload(missingFields, values) : undefined);
      setCompleting(null);
      setMessage({ tone: "ok", text: `„${row.name}” jest na liście ${participantNoun}.` });
      void client.invalidateQueries({ queryKey: getListPlayersQueryKey(tournamentId) });
      await refresh();
    } catch (failure) {
      setMessage({ tone: "error", text: registrationErrorMessage(failure, "Nie udało się zatwierdzić zgłoszenia.") });
    } finally {
      setBusy(null);
    }
  };

  const reject = async (row: RegistrationRow) => {
    setBusy(`r${row.id}`); setMessage(null);
    try {
      await rejectRegistration(tournamentId, row.id);
      setMessage({ tone: "ok", text: `Odrzucono zgłoszenie „${row.name}”.` });
      await refresh();
    } catch (failure) {
      setMessage({ tone: "error", text: registrationErrorMessage(failure, "Nie udało się odrzucić zgłoszenia.") });
    } finally {
      setBusy(null);
    }
  };

  const answerText = (row: RegistrationRow) => Object.entries(row.answers ?? {})
    .map(([key, value]) => {
      const field = labels.get(key);
      return field ? `${field.label}: ${formatFieldValue(field, value as never)}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  if (!canConfigure && !canReview) return null;
  if (!data && !loadError) return null;
  return (
    <section className="registration-panel mb-4 rounded-xl border border-border bg-card p-4 space-y-3" aria-labelledby="registration-panel-title" data-testid="registration-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="registration-panel-title" className="flex items-center gap-2 font-semibold">
          <ClipboardList aria-hidden="true" className="h-4 w-4 text-primary" /> Zapisy
          {data && <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground" data-testid="registration-state">{STATE_LABEL[data.state]}</span>}
        </h3>
        {data && data.settings.enabled && (
          <p className="text-xs text-muted-foreground">
            Oczekuje: <strong className="text-foreground">{data.counts.pending}</strong> · przyjęte: {data.counts.approved}
            {data.places.remaining != null && <> · wolne miejsca: {data.places.remaining}</>}
          </p>
        )}
      </div>
      {loadError && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {loadError}
          <button type="button" className="underline" onClick={() => void refresh()}>Spróbuj ponownie</button>
        </p>
      )}

      {data && !data.settings.enabled && (
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Zapisy są opcjonalne. Możesz dodawać {participantNoun} ręcznie albo włączyć publiczny formularz — zgłoszenia trafią tutaj,
            a po akceptacji na tę samą listę. Konta graczy nie są potrzebne.
          </p>
          {canConfigure && (
            <Button size="sm" onClick={() => void save({ enabled: true, open: false }, "Zapisy włączone — sprawdź ustawienia i otwórz formularz.")} disabled={busy === "settings"}>
              Włącz zapisy
            </Button>
          )}
        </div>
      )}

      {data && data.settings.enabled && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2">
            <code className="basis-full min-w-0 break-all text-xs sm:basis-auto sm:flex-1" data-testid="registration-link">{link}</code>
            {/* QW-06b: the shared copy button (feedback + manual fallback) and, while sign-ups are open, the system share sheet */}
            <CopyLinkButton text={link} label="Kopiuj link do zapisów" showLabel />
            {data.state === "open" && (
              <ShareLinkButton target={{ url: link, title: tournamentName || "Zapisy", text: shareText("signup", tournamentName) }} label="Udostępnij zapisy" showLabel />
            )}
            <Button size="sm" variant="outline" asChild>
              <a href={registrationPath(tournamentId, experimental)} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Podgląd</a>
            </Button>
          </div>
          {data.state === "hidden" && <p className="text-xs text-muted-foreground">Turniej jest ukryty — formularz zadziała dopiero po opublikowaniu turnieju.</p>}
          {data.state === "started" && <p className="text-xs text-muted-foreground">Po starcie nowe zgłoszenia nie są przyjmowane, a oczekujących nie da się dopisać do wygenerowanej drabinki.</p>}

          {canConfigure && draft && (
            <div className="grid gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Formularz:</span>
                <Button size="sm" variant={data.settings.open ? "default" : "outline"} aria-pressed={data.settings.open} disabled={busy === "settings" || data.state === "started"}
                  onClick={() => void save({ open: true }, "Zapisy otwarte — link przyjmuje zgłoszenia.")}>Otwarte</Button>
                <Button size="sm" variant={!data.settings.open ? "default" : "outline"} aria-pressed={!data.settings.open} disabled={busy === "settings"}
                  onClick={() => void save({ open: false }, "Zapisy zamknięte — link pokazuje, że zapisy są zamknięte.")}>Zamknięte</Button>
              </div>
              <fieldset className="grid gap-1.5 text-sm">
                <legend className="mb-1 font-medium">Akceptacja zgłoszeń</legend>
                <label className="flex items-start gap-2"><input type="radio" name={`approval-${tournamentId}`} className="mt-1" checked={draft.approval === "manual"} onChange={() => setDraft({ ...draft, approval: "manual" })} />
                  <span>Ręczna — każde zgłoszenie czeka na Twoją decyzję (zalecane)</span></label>
                <label className="flex items-start gap-2"><input type="radio" name={`approval-${tournamentId}`} className="mt-1" checked={draft.approval === "auto"} onChange={() => setDraft({ ...draft, approval: "auto" })} />
                  <span>Automatyczna — zgłoszenie od razu trafia na listę, dopóki są wolne miejsca</span></label>
              </fieldset>
              <div className="grid gap-1 sm:max-w-xs">
                <Label htmlFor={`registration-capacity-${tournamentId}`} className="text-sm">Limit miejsc (puste = limit turnieju)</Label>
                <Input id={`registration-capacity-${tournamentId}`} type="number" inputMode="numeric" min={1} value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: event.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`registration-note-${tournamentId}`} className="text-sm">Informacja dla zapisujących (opcjonalnie)</Label>
                <textarea id={`registration-note-${tournamentId}`} rows={2} maxLength={500} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Np. termin, zasady, kontakt" />
              </div>
              <p className="text-xs text-muted-foreground">
                Pytania formularza to pola uczestników z zaznaczonym „Zapisy”: {data.questions.length
                  ? data.questions.map((question) => `${question.label}${question.required ? " *" : ""}`).join(", ")
                  : "brak — formularz pyta tylko o nick"}.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void save({})} disabled={busy === "settings"} aria-busy={busy === "settings"}>
                  {busy === "settings" && <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Zapisz ustawienia
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void save({ enabled: false, open: false }, "Zapisy wyłączone — link nie przyjmuje zgłoszeń. Lista uczestników bez zmian.")} disabled={busy === "settings"}>
                  Wyłącz zapisy
                </Button>
              </div>
            </div>
          )}
          {canConfigure && !experimental && (
            <div className="stable-participant-fields">
              <ParticipantFieldsManager tournamentId={tournamentId} participantNoun={participantNoun === "drużyn" ? "drużyn" : "graczy"} />
            </div>
          )}
        </>
      )}

      {message && <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message.text}</p>}

      {canReview && data && (pending.length > 0 || decided.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Zgłoszenia oczekujące ({pending.length})</h4>
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Brak nowych zgłoszeń.</p>}
          <ul className="space-y-2">
            {pending.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-3" data-testid="registration-row">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString("pl", { dateStyle: "short", timeStyle: "short" })}</p>
                    {answerText(row) && <p className="mt-0.5 text-xs text-muted-foreground break-words">{answerText(row)}</p>}
                    {row.missing.length > 0 && <p className="mt-0.5 text-xs text-amber-500">Brakuje: {row.missing.map((item) => item.label).join(", ")} — uzupełnisz przy akceptacji.</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" disabled={busy === `r${row.id}`}
                      onClick={() => (row.missing.length ? setCompleting({ id: row.id, values: {} }) : void approve(row))}>
                      <Check aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Zatwierdź
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === `r${row.id}`} onClick={() => setRejecting(row)}>
                      <X aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Odrzuć
                    </Button>
                  </div>
                </div>
                {completing?.id === row.id && (
                  <form className={`mt-3 grid gap-2 ${experimental ? "" : "stable-participant-fields"}`} onSubmit={(event) => { event.preventDefault(); void approve(row, completing.values); }}>
                    <ParticipantFieldInputs
                      fields={row.missing.map((item) => labels.get(item.key)).filter((field): field is NonNullable<typeof field> => !!field)}
                      values={completing.values} idPrefix={`registration-${row.id}`}
                      onChange={(key, value) => setCompleting({ id: row.id, values: { ...completing.values, [key]: value } })} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={busy === `r${row.id}`}>Zatwierdź z uzupełnieniem</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCompleting(null)}>Anuluj</Button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {decided.length > 0 && (
            <div>
              <button type="button" className="text-xs text-muted-foreground underline" aria-expanded={showDecided} onClick={() => setShowDecided((value) => !value)}>
                Rozpatrzone ({decided.length})
              </button>
              {showDecided && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {decided.map((row) => (
                    <li key={row.id}>
                      <span className="text-foreground">{row.name}</span> — {row.status === "approved" ? (row.onList ? "na liście" : "przyjęte, później usunięte z listy") : "odrzucone"}
                      {row.decidedBy ? ` · ${row.decidedBy}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!rejecting} onOpenChange={(open) => { if (!open) setRejecting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odrzucić zgłoszenie „{rejecting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Osoba nie trafi na listę. Decyzji nie można cofnąć — w razie pomyłki dodaj ją ręcznie albo poproś o ponowne zgłoszenie.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const row = rejecting; setRejecting(null); if (row) void reject(row); }}>Odrzuć</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
