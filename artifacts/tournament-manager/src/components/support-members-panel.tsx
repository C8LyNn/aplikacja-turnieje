import { t } from "@/i18n";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Pencil, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  apiCreateSupportMember, apiListSupportMembers, apiRevokeSupportMember, apiUpdateSupportMember,
  type SupportMember, type SupportMembersResponse,
} from "@/lib/auth";
import { describeSupportPermissions, type SupportPermissionKey } from "@/lib/organizer-capabilities";

/** #331 · the owner's list of support people: personal codes and exactly what each person may do. */
export function SupportMembersPanel({ tournamentId, orgToken }: { tournamentId: number; orgToken: string }) {
  const [data, setData] = useState<SupportMembersResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [revoking, setRevoking] = useState<SupportMember | null>(null);
  const [issued, setIssued] = useState<{ name: string; code: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await apiListSupportMembers(tournamentId, orgToken));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("supportMembersPanel.nie_udalo_sie_pobrac_osob"));
    }
  }, [orgToken, tournamentId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const active = data?.members.filter((member) => !member.revokedAt) ?? [];
  const revoked = data?.members.filter((member) => member.revokedAt) ?? [];

  return (
    <section className="support-members-panel mt-8 space-y-4" aria-labelledby="support-members-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="support-members-title" className="flex items-center gap-2 text-base font-semibold">
            <KeyRound aria-hidden="true" className="h-4 w-4 text-primary" />{" "}{t("supportMembersPanel.osoby_wspierajace")}</h3>
          <p className="mt-1 max-w-prose text-xs text-muted-foreground">{t("supportMembersPanel.kazda_osoba_dostaje_wlasny_kod")}</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => { setAdding(true); setIssued(null); setMessage(null); }} disabled={!data}>
            <UserPlus aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />{" "}{t("supportMembersPanel.dodaj_osobe")}</Button>
        )}
      </div>

      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}

      {issued && (
        <IssuedCode name={issued.name} code={issued.code} onDone={() => setIssued(null)} />
      )}

      {adding && data && (
        <MemberForm
          presets={data.presets}
          submitLabel={t("supportMembersPanel.dodaj_i_pokaz_kod")}
          onCancel={() => setAdding(false)}
          onSubmit={async (name, permissions) => {
            const created = await apiCreateSupportMember(tournamentId, orgToken, { name, permissions });
            setAdding(false);
            setIssued({ name: created.member.name, code: created.accessCode });
            await refresh();
          }}
        />
      )}

      {data && active.length === 0 && !adding && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">{t("supportMembersPanel.nie_dodano_jeszcze_zadnej_osoby")}</p>
      )}

      <ul className="space-y-2">
        {active.map((member) => (
          <li key={member.id} className="rounded-lg border border-border bg-card/50 p-3" data-testid="support-member">
            {editingId === member.id && data ? (
              <MemberForm
                presets={data.presets}
                initialName={member.name}
                initialPermissions={member.permissions}
                submitLabel={t("supportMembersPanel.zapisz_uprawnienia")}
                onCancel={() => setEditingId(null)}
                onSubmit={async (name, permissions) => {
                  await apiUpdateSupportMember(tournamentId, orgToken, member.id, { name, permissions });
                  setEditingId(null);
                  setMessage(t("supportMembersPanel.zapisano_uprawnienia_name_dzialaja_od", { name: name }));
                  await refresh();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium break-words">{member.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {member.permissions.length ? describeSupportPermissions(member.permissions).join(" · ") : t("supportMembersPanel.tylko_podglad")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {member.activeSessions ? t("supportMembersPanel.zalogowana_activesessions_v1", { activeSessions: member.activeSessions, v1: member.activeSessions === 1 ? t("supportMembersPanel.sesja") : t("supportMembersPanel.sesje") }) : t("supportMembersPanel.nie_zalogowana")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(member.id); setMessage(null); }}>
                    <Pencil aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />{" "}{t("supportMembersPanel.uprawnienia")}</Button>
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setRevoking(member)}>
                    <UserMinus aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />{" "}{t("supportMembersPanel.odbierz_dostep")}</Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {revoked.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("supportMembersPanel.dostep_odebrany")}{" "}{revoked.map((member) => member.name).join(", ")}.
        </p>
      )}

      <AlertDialog open={!!revoking} onOpenChange={(open) => { if (!open) setRevoking(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("supportMembersPanel.odebrac_dostep")}{" "}{revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{t("supportMembersPanel.kod_tej_osoby_przestaje_dzialac")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("supportMembersPanel.anuluj")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const member = revoking;
                setRevoking(null);
                if (!member) return;
                void apiRevokeSupportMember(tournamentId, orgToken, member.id)
                  .then(() => { setMessage(t("supportMembersPanel.odebrano_dostep_name", { name: member.name })); return refresh(); })
                  .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("supportMembersPanel.nie_udalo_sie_odebrac_dostepu")));
              }}
            >{t("supportMembersPanel.odbierz_dostep")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function IssuedCode({ name, code, onDone }: { name: string; code: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-2" role="status" data-testid="support-member-code">
      <p className="text-sm font-semibold">{t("supportMembersPanel.kod_dla")}{" "}{name}</p>
      <p className="font-mono text-lg tracking-widest break-all select-all">{code}</p>
      <p className="text-xs text-muted-foreground">{t("supportMembersPanel.przekaz_go_tej_osobie_pokazujemy")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => setCopied(false));
          }}
        >
          {copied ? <Check aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? t("supportMembersPanel.skopiowano") : t("supportMembersPanel.kopiuj_kod")}
        </Button>
        <Button size="sm" onClick={onDone}>{t("supportMembersPanel.gotowe")}</Button>
      </div>
    </div>
  );
}

const PERMISSION_GROUPS: { title: string; keys: SupportPermissionKey[] }[] = [
  { get title() { return t("supportMembersPanel.mecze_i_wyniki"); }, keys: ["matches.run", "results.write", "results.correct"] },
  { get title() { return t("supportMembersPanel.turniej"); }, keys: ["participants.manage", "stages.rounds", "visibility.publish"] },
  { get title() { return t("supportMembersPanel.transmisja"); }, keys: ["presentation.featured", "presentation.settings"] },
];

const PERMISSION_FORM_LABELS: Record<SupportPermissionKey, string> = {
  get "matches.run"() { return t("supportMembersPanel.prowadzenie_meczow_rozpoczecie_przelozen"); },
  get "results.write"() { return t("supportMembersPanel.wpisywanie_wynikow"); },
  get "results.correct"() { return t("supportMembersPanel.poprawa_i_cofanie_wynikow_anulowanie"); },
  get "participants.manage"() { return t("supportMembersPanel.uczestnicy_i_sklady_dodawanie_edycja"); },
  get "stages.rounds"() { return t("supportMembersPanel.start_turnieju_i_kolejne_rundy"); },
  get "visibility.publish"() { return t("supportMembersPanel.publikowanie_i_ukrywanie_turnieju_przed"); },
  get "presentation.featured"() { return t("supportMembersPanel.mecz_na_ekranie_widzow"); },
  get "presentation.settings"() { return t("supportMembersPanel.wyglad_transmisji_i_scoreboardu"); },
};

function MemberForm({
  presets,
  initialName = "",
  initialPermissions,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  presets: SupportMembersResponse["presets"];
  initialName?: string;
  initialPermissions?: string[];
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (name: string, permissions: string[]) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initialPermissions ?? presets.find((preset) => preset.key === "results")?.permissions ?? []),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activePreset = presets.find((preset) =>
    preset.permissions.length === permissions.size && preset.permissions.every((key) => permissions.has(key)))?.key;
  const idBase = initialName ? `member-edit-${initialName.replace(/\W+/g, "-")}` : "member-new";

  const toggle = (key: string) => setPermissions((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <form
      className="space-y-3 rounded-lg border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) { setError(t("supportMembersPanel.podaj_imie_lub_nick_osoby")); return; }
        setPending(true); setError(null);
        onSubmit(trimmed, [...permissions])
          .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : t("supportMembersPanel.nie_udalo_sie_zapisac")))
          .finally(() => setPending(false));
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`${idBase}-name`} className="text-xs">{t("supportMembersPanel.imie_lub_nick")}</Label>
        <Input id={`${idBase}-name`} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder={t("supportMembersPanel.np_ola_wyniki")} />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium">{t("supportMembersPanel.gotowy_zestaw")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              aria-pressed={activePreset === preset.key}
              onClick={() => setPermissions(new Set(preset.permissions))}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${activePreset === preset.key ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>
      {PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-1">
          <legend className="text-xs font-medium">{group.title}</legend>
          {group.keys.map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary" checked={permissions.has(key)} onChange={() => toggle(key)} />
              <span>{PERMISSION_FORM_LABELS[key]}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {permissions.size === 0 && <p className="text-xs text-muted-foreground">{t("supportMembersPanel.bez_zaznaczen_osoba_ma_tylko")}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>{t("supportMembersPanel.anuluj")}</Button>
      </div>
    </form>
  );
}
