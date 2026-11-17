import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { FileUp, X } from "lucide-react";
import {
  setActiveOrganizerToken,
  useImportTournament,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import {
  parseTournamentBackupFile,
  type TournamentBackupFile,
} from "@/lib/backup-file";
import { inspectBackupV3, type BackupV3Preview } from "@/lib/backup-v3-preview";

export function BackupRestoreDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { open, onClose } = props;
  const [location, navigate] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const { storeOrgToken } = useAuth();
  const { toast } = useToast();
  const importTournament = useImportTournament();
  const fileInput = useRef<HTMLInputElement>(null);
  const restoreInFlight = useRef(false);
  const [backup, setBackup] = useState<TournamentBackupFile | null>(null);
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [v3Preview, setV3Preview] = useState<BackupV3Preview | null>(null);

  if (!open) return null;

  const visibility = backup?.tournament.visibility;
  const privateOnline = visibility === "private_online";

  const resetAndClose = () => {
    restoreInFlight.current = false;
    setBackup(null);
    setOrganizerPassword("");
    setViewerPassword("");
    setSupportPassword("");
    setError(null);
    setV3Preview(null);
    if (fileInput.current) fileInput.current.value = "";
    onClose();
  };

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setBackup(null);
    setV3Preview(null);
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseTournamentBackupFile(text);
      if (!parsed.ok) {
        // V3 restore stays disabled: show what the file holds and whether it is complete.
        const preview = inspectBackupV3(text);
        if (preview) { setV3Preview(preview); return; }
        setError(parsed.error);
        return;
      }
      setBackup(parsed.backup);
    };
    reader.readAsText(file);
  };

  const restore = () => {
    if (!backup || restoreInFlight.current || importTournament.isPending) return;
    if (organizerPassword.length < 8) {
      setError("Nowe hasło organizatora musi mieć co najmniej 8 znaków.");
      return;
    }
    if (privateOnline && viewerPassword.length < 8) {
      setError("Dla private_online nowe hasło widza musi mieć co najmniej 8 znaków.");
      return;
    }
    if (supportPassword.length > 0 && supportPassword.length < 8) {
      setError("Nowe hasło wsparcia musi mieć co najmniej 8 znaków.");
      return;
    }
    setError(null);
    restoreInFlight.current = true;
    importTournament.mutate(
      {
        data: {
          backup,
          organizerPassword,
          viewerPassword: privateOnline ? viewerPassword : undefined,
          supportPassword: supportPassword || undefined,
        },
      },
      {
        onSuccess: (result) => {
          restoreInFlight.current = false;
          storeOrgToken(result.tournament.id, result.organizerToken);
          setActiveOrganizerToken(result.organizerToken);
          toast({
            title: "Backup przywrócony",
            description: `Utworzono „${result.tournament.name}” z nowymi poświadczeniami.`,
          });
          resetAndClose();
          navigate(tournamentHref(result.tournament.id, experimental));
        },
        onError: (requestError: any) => {
          restoreInFlight.current = false;
          setError(
            requestError?.data?.error ??
              requestError?.message ??
              "Nie udało się przywrócić backupu.",
          );
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4 rounded-xl border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Przywróć backup V2</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Backup nie przechowuje haseł ani tokenów. Dla nowej kopii ustawiasz nowe poświadczenia.
              Import backupu V3 jest wyłączony do czasu odrębnej weryfikacji; eksport V3 pozostaje dostępny.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Zamknij okno przywracania" onClick={resetAndClose} disabled={importTournament.isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="restore-backup-file">Plik backupu</Label>
          <Input
            id="restore-backup-file"
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            onChange={selectFile}
          />
          {backup && (
            <p className="text-xs text-green-400">
              Wczytano backup V{backup.schemaVersion}: {String(backup.tournament.name ?? "turniej")}.
            </p>
          )}
        </div>

        {v3Preview && (
          <section aria-label="Podgląd kopii V3" data-testid="backup-v3-preview" className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-semibold">Kopia V3: „{v3Preview.name}”{v3Preview.exportedAt ? ` · zapisana ${new Date(v3Preview.exportedAt).toLocaleString("pl-PL")}` : ""}</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li>{v3Preview.participantType === "teams" ? "Drużyny" : "Uczestnicy"}: <strong className="text-foreground">{v3Preview.participants}</strong></li>
              <li>Etapy: <strong className="text-foreground">{v3Preview.stages}</strong></li>
              <li>Mecze rozegrane: <strong className="text-foreground">{v3Preview.matches.completed}/{v3Preview.matches.total}</strong></li>
              <li>Historia wyników: <strong className="text-foreground">{v3Preview.resultHistory}</strong></li>
              {v3Preview.teams && <li className="col-span-2">Składy — zawodnicy: <strong className="text-foreground">{v3Preview.teams.activeMembers}</strong>, drużyny ze składem: {v3Preview.teams.count}, wpisy historii: {v3Preview.teams.historyEntries}</li>}
            </ul>
            {v3Preview.problems.length ? (
              <div role="alert" className="text-destructive">
                <p className="font-semibold">Plik jest niekompletny lub niespójny:</p>
                <ul className="list-disc pl-5">{v3Preview.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
              </div>
            ) : (
              <p className="text-green-400">Plik jest kompletny i spójny.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Przywracanie kopii V3 w aplikacji czeka na zatwierdzenie zabezpieczeń, więc nic nie zostanie zapisane.
              Zachowaj ten plik — to pełna kopia turnieju. W razie awarii administrator odtworzy go według procedury odzyskiwania.
            </p>
          </section>
        )}

        {!v3Preview && <>
        <div className="space-y-2">
          <Label htmlFor="restore-organizer-password">Nowe hasło organizatora *</Label>
          <Input
            id="restore-organizer-password"
            type="password"
            minLength={8}
            value={organizerPassword}
            onChange={(event) => setOrganizerPassword(event.target.value)}
          />
        </div>

        {privateOnline && (
          <div className="space-y-2">
            <Label htmlFor="restore-viewer-password">Nowe hasło widza *</Label>
            <Input
              id="restore-viewer-password"
              type="password"
              minLength={8}
              value={viewerPassword}
              onChange={(event) => setViewerPassword(event.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="restore-support-password">Nowe hasło wsparcia (opcjonalne)</Label>
          <Input
            id="restore-support-password"
            type="password"
            minLength={8}
            value={supportPassword}
            onChange={(event) => setSupportPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pozostaw puste, aby dostęp supportu był wyłączony.
          </p>
        </div>
        </>}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose} disabled={importTournament.isPending}>Anuluj</Button>
          {!v3Preview && <Button
            onClick={restore}
            disabled={
              !backup ||
              organizerPassword.length < 8 ||
              (privateOnline && viewerPassword.length < 8) ||
              (supportPassword.length > 0 && supportPassword.length < 8) ||
              importTournament.isPending
            }
          >
            <FileUp className="mr-2 h-4 w-4" />
            {importTournament.isPending ? "Przywracanie…" : "Przywróć jako nowy turniej"}
          </Button>}
        </div>
      </div>
    </div>
  );
}
