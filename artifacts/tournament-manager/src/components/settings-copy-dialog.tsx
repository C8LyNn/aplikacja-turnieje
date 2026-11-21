// QW-09 · "Nowy turniej z tymi ustawieniami": one dialog for both views. The summary comes from the server, so the
// dialog never guesses what will be copied; the new tournament opens in the same view the organizer is using.
import { t } from "@/i18n";
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
      (error) => { if (alive) setLoadError(registrationErrorMessage(error, t("settingsCopyDialog.nie_udalo_sie_wczytac_ustawien"))); },
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
      setProblem(registrationErrorMessage(error, t("settingsCopyDialog.nie_udalo_sie_utworzyc_turnieju")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("settingsCopyDialog.nowy_turniej_z_tymi_ustawieniami")}</DialogTitle>
          <DialogDescription>{t("settingsCopyDialog.kolejny_event_z_tym_samym")}</DialogDescription>
        </DialogHeader>
        {loadError && <p role="alert" className="text-sm text-destructive" data-testid="settings-copy-error">{loadError}</p>}
        {!loadError && (!summary || !form) && <p className="text-sm text-muted-foreground" role="status">{t("settingsCopyDialog.wczytywanie_ustawien")}</p>}
        {summary && form && (
          <form onSubmit={submit} className="space-y-4" noValidate data-testid="settings-copy-form">
            <div className="grid gap-3 sm:grid-cols-2 text-sm" data-testid="settings-copy-summary">
              <div>
                <p className="font-semibold mb-1">{t("settingsCopyDialog.skopiujemy")}</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {copiedLines(summary).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">{t("settingsCopyDialog.nie_kopiujemy")}</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {summary.notCopied.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-copy-name">{t("settingsCopyDialog.nazwa_nowego_turnieju")}</Label>
              <Input id="settings-copy-name" ref={nameRef} value={form.name} maxLength={200} placeholder={t("settingsCopyDialog.np_sourcename_kolejna_edycja", { sourceName: summary.sourceName })}
                onChange={(event) => update({ name: event.target.value })} />
            </div>
            {summary.mode === "plan" && (
              <div className="space-y-1.5">
                <Label htmlFor="settings-copy-participantCount">{t("settingsCopyDialog.liczba_uczestnikow")}</Label>
                {resizableCount ? (
                  <Input id="settings-copy-participantCount" inputMode="numeric" value={form.participantCount}
                    min={COPY_PARTICIPANTS.min} max={COPY_PARTICIPANTS.max} onChange={(event) => update({ participantCount: event.target.value })} />
                ) : (
                  <p id="settings-copy-participantCount" className="text-sm text-muted-foreground">
                    {summary.participantCount}{" "}{t("settingsCopyDialog.jak_poprzednio_plan_kilku_etapow")}</p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="settings-copy-visibility">{t("settingsCopyDialog.widocznosc")}</Label>
              <select id="settings-copy-visibility" value={form.visibility}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(event) => update({ visibility: event.target.value as SettingsCopyForm["visibility"] })}>
                {COPY_VISIBILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <PasswordField id="settings-copy-organizerPassword" label={t("settingsCopyDialog.haslo_organizatora_nowego_turnieju")} value={form.organizerPassword}
              onChange={(value) => update({ organizerPassword: value })} visible={show.organizer}
              onToggle={() => setShow((value) => ({ ...value, organizer: !value.organizer }))} minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
              description={t("settingsCopyDialog.nowy_turniej_ma_wlasne_hasla")} />
            {form.visibility === "private_online" && (
              <PasswordField id="settings-copy-viewerPassword" label={t("settingsCopyDialog.haslo_widza")} value={form.viewerPassword}
                onChange={(value) => update({ viewerPassword: value })} visible={show.viewer}
                onToggle={() => setShow((value) => ({ ...value, viewer: !value.viewer }))} />
            )}
            <PasswordField id="settings-copy-supportPassword" label={t("settingsCopyDialog.haslo_wsparcia_opcjonalne")} value={form.supportPassword}
              onChange={(value) => update({ supportPassword: value })} visible={show.support}
              onToggle={() => setShow((value) => ({ ...value, support: !value.support }))} />
            {problem && <p role="alert" className="text-sm text-destructive" data-testid="settings-copy-error">{problem}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{t("settingsCopyDialog.anuluj")}</Button>
              <Button type="submit" disabled={busy}>{busy ? t("settingsCopyDialog.tworzenie") : t("settingsCopyDialog.utworz_turniej")}</Button>
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
        <CopyPlus className="h-4 w-4 text-primary" aria-hidden="true" />{" "}{t("settingsCopyDialog.nastepny_turniej")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("settingsCopyDialog.utworz_kolejny_event_z_tym")}</p>
      <Button className="mt-3" variant="outline" onClick={() => setOpen(true)}>{t("settingsCopyDialog.nowy_turniej_z_tymi_ustawieniami")}</Button>
      <SettingsCopyDialog tournamentId={tournamentId} experimental={experimental} open={open} onOpenChange={setOpen} />
    </section>
  );
}
