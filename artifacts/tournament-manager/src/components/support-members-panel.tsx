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
      setLoadError(error instanceof Error ? error.message : "Nie udało się pobrać osób wspierających.");
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
            <KeyRound aria-hidden="true" className="h-4 w-4 text-primary" /> Osoby wspierające
          </h3>
          <p className="mt-1 max-w-prose text-xs text-muted-foreground">
            Każda osoba dostaje własny kod i tylko te uprawnienia, które zaznaczysz. Zmiany działają od razu, także w otwartych
            sesjach. Zamykanie etapów, bezpieczeństwo, udostępnianie, backup i ustawienia turnieju zostają przy Tobie.
            Wspólne hasło wsparcia działa dalej jak dotąd.
          </p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => { setAdding(true); setIssued(null); setMessage(null); }} disabled={!data}>
            <UserPlus aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Dodaj osobę
          </Button>
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
          submitLabel="Dodaj i pokaż kod"
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
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Nie dodano jeszcze żadnej osoby z własnym kodem.
        </p>
      )}

      <ul className="space-y-2">
        {active.map((member) => (
          <li key={member.id} className="rounded-lg border border-border bg-card/50 p-3" data-testid="support-member">
            {editingId === member.id && data ? (
              <MemberForm
                presets={data.presets}
                initialName={member.name}
                initialPermissions={member.permissions}
                submitLabel="Zapisz uprawnienia"
                onCancel={() => setEditingId(null)}
                onSubmit={async (name, permissions) => {
                  await apiUpdateSupportMember(tournamentId, orgToken, member.id, { name, permissions });
                  setEditingId(null);
                  setMessage(`Zapisano uprawnienia: ${name}. Działają od następnej akcji tej osoby.`);
                  await refresh();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium break-words">{member.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {member.permissions.length ? describeSupportPermissions(member.permissions).join(" · ") : "Tylko podgląd"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {member.activeSessions ? `Zalogowana · ${member.activeSessions} ${member.activeSessions === 1 ? "sesja" : "sesje"}` : "Nie zalogowana"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(member.id); setMessage(null); }}>
                    <Pencil aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Uprawnienia
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setRevoking(member)}>
                    <UserMinus aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Odbierz dostęp
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {revoked.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Dostęp odebrany: {revoked.map((member) => member.name).join(", ")}.
        </p>
      )}

      <AlertDialog open={!!revoking} onOpenChange={(open) => { if (!open) setRevoking(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrać dostęp: {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Kod tej osoby przestaje działać, a jej otwarte sesje kończą się od razu. Wpisane wyniki i historia zostają.
              Aby przywrócić dostęp, dodaj osobę ponownie — dostanie nowy kod.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const member = revoking;
                setRevoking(null);
                if (!member) return;
                void apiRevokeSupportMember(tournamentId, orgToken, member.id)
                  .then(() => { setMessage(`Odebrano dostęp: ${member.name}.`); return refresh(); })
                  .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Nie udało się odebrać dostępu."));
              }}
            >
              Odbierz dostęp
            </AlertDialogAction>
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
      <p className="text-sm font-semibold">Kod dla: {name}</p>
      <p className="font-mono text-lg tracking-widest break-all select-all">{code}</p>
      <p className="text-xs text-muted-foreground">
        Przekaż go tej osobie. Pokazujemy go tylko teraz — nie da się go później odczytać. Osoba loguje się nim w polu
        „Hasło wsparcia lub osobisty kod”.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => setCopied(false));
          }}
        >
          {copied ? <Check aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Skopiowano" : "Kopiuj kod"}
        </Button>
        <Button size="sm" onClick={onDone}>Gotowe</Button>
      </div>
    </div>
  );
}

const PERMISSION_GROUPS: { title: string; keys: SupportPermissionKey[] }[] = [
  { title: "Mecze i wyniki", keys: ["matches.run", "results.write", "results.correct"] },
  { title: "Turniej", keys: ["participants.manage", "stages.rounds", "visibility.publish"] },
  { title: "Transmisja", keys: ["presentation.featured", "presentation.settings"] },
];

const PERMISSION_FORM_LABELS: Record<SupportPermissionKey, string> = {
  "matches.run": "Prowadzenie meczów — rozpoczęcie, przełożenie, kolejka, termin, długość",
  "results.write": "Wpisywanie wyników",
  "results.correct": "Poprawa i cofanie wyników, anulowanie meczu, zamiana stron",
  "participants.manage": "Uczestnicy i składy — dodawanie, edycja, usuwanie, import",
  "stages.rounds": "Start turnieju i kolejne rundy (bez zamykania etapów)",
  "visibility.publish": "Publikowanie i ukrywanie turnieju (przed startem)",
  "presentation.featured": "Mecz na ekranie widzów",
  "presentation.settings": "Wygląd transmisji i scoreboardu",
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
        if (!trimmed) { setError("Podaj imię lub nick osoby."); return; }
        setPending(true); setError(null);
        onSubmit(trimmed, [...permissions])
          .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Nie udało się zapisać."))
          .finally(() => setPending(false));
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`${idBase}-name`} className="text-xs">Imię lub nick</Label>
        <Input id={`${idBase}-name`} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="np. Ola — wyniki" />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium">Gotowy zestaw</legend>
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
      {permissions.size === 0 && <p className="text-xs text-muted-foreground">Bez zaznaczeń osoba ma tylko podgląd panelu.</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>Anuluj</Button>
      </div>
    </form>
  );
}
