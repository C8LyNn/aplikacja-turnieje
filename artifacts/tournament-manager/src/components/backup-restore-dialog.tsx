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
import {
  parseTournamentBackupFile,
  type TournamentBackupFile,
} from "@/lib/backup-file";

export function BackupRestoreDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { open, onClose } = props;
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const { toast } = useToast();
  const importTournament = useImportTournament();
  const fileInput = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<TournamentBackupFile | null>(null);
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const visibility = backup?.tournament.visibility;
  const privateOnline = visibility === "private_online";

  const resetAndClose = () => {
    setBackup(null);
    setOrganizerPassword("");
    setViewerPassword("");
    setSupportPassword("");
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
    onClose();
  };

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setBackup(null);
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseTournamentBackupFile(String(reader.result ?? ""));
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setBackup(parsed.backup);
    };
    reader.readAsText(file);
  };

  const restore = () => {
    if (!backup) return;
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
          storeOrgToken(result.tournament.id, result.organizerToken);
          setActiveOrganizerToken(result.organizerToken);
          toast({
            title: "Backup przywrócony",
            description: `Utworzono „${result.tournament.name}” z nowymi poświadczeniami.`,
          });
          resetAndClose();
          navigate(`/tournaments/${result.tournament.id}`);
        },
        onError: (requestError: any) => {
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
            <h2 className="text-lg font-bold">Przywróć backup V2/V3</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Backup nie przechowuje haseł ani tokenów. Dla nowej kopii ustawiasz nowe poświadczenia.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={resetAndClose}>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose}>Anuluj</Button>
          <Button
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
          </Button>
        </div>
      </div>
    </div>
  );
}
