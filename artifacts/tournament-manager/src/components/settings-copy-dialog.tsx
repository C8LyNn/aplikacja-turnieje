// QW-09 · "Nowy turniej z tymi ustawieniami": one dialog for both views. The summary comes from the server, so the
// dialog never guesses what will be copied; the new tournament opens in the same view the organizer is using.
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CopyPlus } from "lucide-react";
import { setActiveOrganizerToken } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-field";
import { useAuth } from "@/context/auth-context";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { registrationErrorMessage } from "@/lib/registrations";
import { ORGANIZER_PASSWORD_MIN_LENGTH } from "@/lib/create-tournament-validation";
import {
  COPY_PARTICIPANTS,
  COPY_VISIBILITY_OPTIONS,
  copiedLines,
  copyFormError,
  copyRequestBody,
  createSettingsCopy,
  fetchSettingsCopy,
  initialCopyForm,
  type SettingsCopyForm,
  type SettingsCopySummary,
} from "@/lib/settings-copy";

export function SettingsCopyDialog({ tournamentId, experimental, open, onOpenChange }: {
  tournamentId: number;
  experimental: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const [summary, setSummary] = useState<SettingsCopySummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsCopyForm | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState({ organizer: false, viewer: false, support: false });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSummary(null); setForm(null); setLoadError(null); setProblem(null);
    fetchSettingsCopy(tournamentId).then(
      (value) => { if (alive) { setSummary(value); setForm(initialCopyForm(value)); } },
      (error) => { if (alive) setLoadError(registrationErrorMessage(error, "Nie udało się wczytać ustawień turnieju.")); },
    );
    return () => { alive = false; };
  }, [open, tournamentId]);

  // Focus moves to the name once the summary has loaded (the field does not exist before that).
  useEffect(() => { if (summary) nameRef.current?.focus(); }, [summary]);

  const update = (patch: Partial<SettingsCopyForm>) => { setForm((value) => (value ? { ...value, ...patch } : value)); setProblem(null); };
  const resizableCount = summary?.resizable && summary.mode === "plan";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!summary || !form || busy) return;
    const invalid = copyFormError(form, summary);
    if (invalid) {
      setProblem(invalid.message);
      document.getElementById(`settings-copy-${invalid.field}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const created = await createSettingsCopy(tournamentId, copyRequestBody(form, summary));
      storeOrgToken(created.id, created.organizerToken);
      setActiveOrganizerToken(created.organizerToken);
      onOpenChange(false);
      navigate(tournamentHref(created.id, experimental));
    } catch (error) {
      setProblem(registrationErrorMessage(error, "Nie udało się utworzyć turnieju. Sprawdź połączenie i spróbuj ponownie."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowy turniej z tymi ustawieniami</DialogTitle>
          <DialogDescription>
            Kolejny event z tym samym formatem i zasadami. Bez uczestników, wyników i historii.
          </DialogDescription>
        </DialogHeader>
        {loadError && <p role="alert" className="text-sm text-destructive" data-testid="settings-copy-error">{loadError}</p>}
        {!loadError && (!summary || !form) && <p className="text-sm text-muted-foreground" role="status">Wczytywanie ustawień…</p>}
        {summary && form && (
          <form onSubmit={submit} className="space-y-4" noValidate data-testid="settings-copy-form">
            <div className="grid gap-3 sm:grid-cols-2 text-sm" data-testid="settings-copy-summary">
              <div>
                <p className="font-semibold mb-1">Skopiujemy</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {copiedLines(summary).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Nie kopiujemy</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {summary.notCopied.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-copy-name">Nazwa nowego turnieju *</Label>
              <Input id="settings-copy-name" ref={nameRef} value={form.name} maxLength={200} placeholder={`np. ${summary.sourceName} — kolejna edycja`}
                onChange={(event) => update({ name: event.target.value })} />
            </div>
            {summary.mode === "plan" && (
              <div className="space-y-1.5">
                <Label htmlFor="settings-copy-participantCount">Liczba uczestników</Label>
                {resizableCount ? (
                  <Input id="settings-copy-participantCount" inputMode="numeric" value={form.participantCount}
                    min={COPY_PARTICIPANTS.min} max={COPY_PARTICIPANTS.max} onChange={(event) => update({ participantCount: event.target.value })} />
                ) : (
                  <p id="settings-copy-participantCount" className="text-sm text-muted-foreground">
                    {summary.participantCount} — jak poprzednio. Plan kilku etapów kopiujemy bez zmian; inną liczbę ustawisz w kreatorze.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="settings-copy-visibility">Widoczność</Label>
              <select id="settings-copy-visibility" value={form.visibility}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(event) => update({ visibility: event.target.value as SettingsCopyForm["visibility"] })}>
                {COPY_VISIBILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <PasswordField id="settings-copy-organizerPassword" label="Hasło organizatora nowego turnieju *" value={form.organizerPassword}
              onChange={(value) => update({ organizerPassword: value })} visible={show.organizer}
              onToggle={() => setShow((value) => ({ ...value, organizer: !value.organizer }))} minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
              description="Nowy turniej ma własne hasła — możesz wpisać to samo co poprzednio." />
            {form.visibility === "private_online" && (
              <PasswordField id="settings-copy-viewerPassword" label="Hasło widza *" value={form.viewerPassword}
                onChange={(value) => update({ viewerPassword: value })} visible={show.viewer}
                onToggle={() => setShow((value) => ({ ...value, viewer: !value.viewer }))} />
            )}
            <PasswordField id="settings-copy-supportPassword" label="Hasło wsparcia (opcjonalne)" value={form.supportPassword}
              onChange={(value) => update({ supportPassword: value })} visible={show.support}
              onToggle={() => setShow((value) => ({ ...value, support: !value.support }))} />
            {problem && <p role="alert" className="text-sm text-destructive" data-testid="settings-copy-error">{problem}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Anuluj</Button>
              <Button type="submit" disabled={busy}>{busy ? "Tworzenie…" : "Utwórz turniej"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The entry point shown to the organizer: a short card with one button. */
export function SettingsCopyCard({ tournamentId, experimental, autoOpen = false }: { tournamentId: number; experimental: boolean; autoOpen?: boolean }) {
  const [open, setOpen] = useState(autoOpen);
  return (
    <section className="rounded-lg border border-border bg-card p-4" aria-labelledby="settings-copy-heading" data-testid="settings-copy-card">
      <h2 id="settings-copy-heading" className="text-base font-semibold flex items-center gap-2">
        <CopyPlus className="h-4 w-4 text-primary" aria-hidden="true" /> Następny turniej
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Utwórz kolejny event z tym samym formatem, zasadami i polami uczestników — bez uczestników, wyników i historii.
      </p>
      <Button className="mt-3" variant="outline" onClick={() => setOpen(true)}>Nowy turniej z tymi ustawieniami</Button>
      <SettingsCopyDialog tournamentId={tournamentId} experimental={experimental} open={open} onOpenChange={setOpen} />
    </section>
  );
}
