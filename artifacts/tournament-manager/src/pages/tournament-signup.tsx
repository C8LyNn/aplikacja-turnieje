/**
 * #329 · the public sign-up page of one tournament (/tournaments/:id/zapisy, same in Experimental).
 * No account; the nick becomes the participant name only after the organizer accepts it (or straight away when the
 * organizer chose automatic acceptance). Messages follow what the server actually did.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { CheckCircle2, ClipboardList, Clock, Loader2, Lock, UserPlus } from "lucide-react";
import { Layout } from "@/components/layout";
import { useTournamentReadAuth } from "@/hooks/use-tournament-read-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParticipantFieldInputs } from "@/features/experimental-tournaments/experimental-participant-fields";
import { formValuesToPayload, missingRequired } from "@/features/experimental-tournaments/participant-fields-model";
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";
import {
  fetchPublicRegistration,
  newClientToken,
  REGISTRATION_STATE_TEXT,
  registrationErrorCode,
  registrationErrorMessage,
  submitRegistration,
  type PublicRegistration,
  type SubmitResult,
} from "@/lib/registrations";

export default function TournamentSignup() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  // The organizer, a verified support person or a viewer with the viewer password reads (and previews) with what this
  // browser already holds — same as the audience page; anonymous visitors send nothing.
  const { ready: authReady } = useTournamentReadAuth(id);
  const [page, setPage] = useState<PublicRegistration | null>(null);
  const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<SubmitResult | null>(null);
  // One token per filled-in form; kept across retries so a resend never creates a second sign-up.
  const token = useRef(newClientToken());

  const load = useCallback(async () => {
    try {
      setPage(await fetchPublicRegistration(id));
      setLoadError(null);
    } catch (failure) {
      const status = (failure as { status?: number }).status;
      setLoadError({ status, message: registrationErrorMessage(failure, "Nie udało się wczytać zapisów.") });
    }
  }, [id]);
  useEffect(() => { if (id > 0 && authReady) void load(); }, [id, authReady, load]);

  const state = page?.registration.state;
  const canSignUp = state === "open";
  const tournamentLink = tournamentHref(id, experimental);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!page || sending) return;
    const nick = name.replace(/\s+/g, " ").trim();
    if (!nick) { setError("Podaj nick."); return; }
    const missing = missingRequired(page.fields, answers);
    if (missing.length) { setError(`Uzupełnij: ${missing.map((field) => field.label).join(", ")}.`); return; }
    setSending(true); setError(null);
    try {
      const result = await submitRegistration(id, { name: nick, customFields: formValuesToPayload(page.fields, answers), clientToken: token.current });
      setDone(result);
      void load();
    } catch (failure) {
      setError(registrationErrorMessage(failure));
      const code = registrationErrorCode(failure);
      if (code && ["REGISTRATION_FULL", "REGISTRATION_CLOSED", "REGISTRATION_STARTED", "REGISTRATION_DISABLED", "REGISTRATION_HIDDEN"].includes(code)) void load();
    } finally {
      setSending(false);
    }
  };

  const another = () => {
    token.current = newClientToken();
    setDone(null); setName(""); setAnswers({}); setError(null);
  };

  return (
    <Layout>
      <div className="tournament-signup mx-auto w-full max-w-xl">
        {!page && !loadError && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Wczytywanie zapisów…</p>
        )}
        {loadError && (
          <div role="alert" className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="flex items-center gap-2 font-semibold"><Lock aria-hidden="true" className="h-4 w-4" />
              {loadError.status === 403 ? "Turniej jest prywatny — zapisy nie są dostępne pod tym linkiem." : loadError.status === 404 ? "Nie ma takiego turnieju." : loadError.message}
            </p>
            {loadError.status === 403 && (
              <p className="text-sm text-muted-foreground">
                Jeśli masz hasło widza, podaj je w <Link href={tournamentHref(id, experimental, "/audience")} className="text-primary underline">widoku widza</Link> i wróć tutaj.
              </p>
            )}
            {loadError.status !== 404 && <Button variant="outline" size="sm" onClick={() => void load()}>Spróbuj ponownie</Button>}
          </div>
        )}
        {page && (
          <div className="space-y-5">
            <header className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><ClipboardList aria-hidden="true" className="h-3.5 w-3.5" /> Zapisy</p>
              <h1 className="text-2xl font-bold break-words">{page.tournament.name}</h1>
              <p className="text-sm text-muted-foreground">{(STAGE_FORMAT_LABELS as Record<string, string>)[page.tournament.format] ?? page.tournament.format}</p>
            </header>

            <section aria-label="Stan zapisów" className="rounded-xl border border-border bg-card p-4 space-y-2" data-state={state}>
              <p className="font-semibold" data-testid="signup-state">{REGISTRATION_STATE_TEXT[state!]}</p>
              {canSignUp && page.registration.remaining != null && (
                <p className="text-sm text-muted-foreground">Wolne miejsca: <strong className="text-foreground">{page.registration.remaining}</strong> z {page.registration.limit}</p>
              )}
              {canSignUp && (
                <p className="text-sm text-muted-foreground">
                  {page.registration.approval === "auto"
                    ? "Po wysłaniu formularza od razu trafisz na listę uczestników."
                    : "Zgłoszenie sprawdzi organizator — na liście znajdziesz się po akceptacji."}
                </p>
              )}
              {page.registration.note && <p className="whitespace-pre-line break-words text-sm">{page.registration.note}</p>}
            </section>

            {done ? (
              <section role="status" className="rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-3" data-testid="signup-done">
                <p className="flex items-center gap-2 text-lg font-semibold">
                  {done.registration.status === "approved" ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-primary" /> : <Clock aria-hidden="true" className="h-5 w-5 text-primary" />}
                  {done.registration.status === "approved" ? "Zapis przyjęty" : "Zgłoszenie wysłane"}
                </p>
                <p className="text-sm">{done.message}</p>
                <p className="text-sm text-muted-foreground">Zgłoszony nick: <strong className="text-foreground break-words">{done.registration.name}</strong></p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm"><Link href={tournamentLink}>Przejdź do turnieju</Link></Button>
                  {canSignUp && <Button variant="ghost" size="sm" onClick={another}>Zgłoś kolejną osobę</Button>}
                </div>
              </section>
            ) : canSignUp ? (
              <form onSubmit={submit} className={`space-y-4 rounded-xl border border-border bg-card p-4 ${experimental ? "" : "stable-participant-fields"}`} noValidate>
                <div className="grid gap-1.5">
                  <Label htmlFor="signup-name">Nick / nazwa uczestnika <span className="text-destructive" aria-hidden="true">*</span></Label>
                  <Input id="signup-name" value={name} maxLength={60} autoComplete="nickname" required onChange={(event) => setName(event.target.value)} placeholder="Tak będziesz widoczny w turnieju" />
                </div>
                <ParticipantFieldInputs fields={page.fields} values={answers} idPrefix="signup" onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))} disabled={sending} />
                <p className="text-xs text-muted-foreground">
                  Konto nie jest potrzebne. Publicznie widoczny jest tylko nick (i odpowiedzi, które organizator oznaczył jako publiczne);
                  pola „prywatne” i „obsługa” widzi tylko organizator i jego pomocnicy. Bez e-maila nie da się potwierdzić, kto wysłał zgłoszenie.
                </p>
                {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full sm:w-auto" disabled={sending} aria-busy={sending}>
                  {sending ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus aria-hidden="true" className="mr-2 h-4 w-4" />}
                  {sending ? "Wysyłanie…" : "Zapisz się"}
                </Button>
              </form>
            ) : (
              <p><Link href={tournamentLink} className="text-sm text-primary underline">Przejdź do turnieju</Link></p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
