import { t } from "@/i18n";
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
      setError(t("backupRestoreDialog.nowe_haslo_organizatora_musi_miec"));
      return;
    }
    if (privateOnline && viewerPassword.length < 8) {
      setError(t("backupRestoreDialog.dla_private_online_nowe_haslo"));
      return;
    }
    if (supportPassword.length > 0 && supportPassword.length < 8) {
      setError(t("backupRestoreDialog.nowe_haslo_wsparcia_musi_miec"));
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
            title: t("backupRestoreDialog.backup_przywrocony"),
            description: t("backupRestoreDialog.utworzono_name_z_nowymi_poswiadczeniami", { name: result.tournament.name }),
          });
          resetAndClose();
          navigate(tournamentHref(result.tournament.id, experimental));
        },
        onError: (requestError: any) => {
          restoreInFlight.current = false;
          setError(
            requestError?.data?.error ??
              requestError?.message ??
              t("backupRestoreDialog.nie_udalo_sie_przywrocic_backupu"),
          );
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{t("backupRestoreDialog.przywroc_backup_v2")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("backupRestoreDialog.backup_nie_przechowuje_hasel_ani")}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={t("backupRestoreDialog.zamknij_okno_przywracania")} onClick={resetAndClose} disabled={importTournament.isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="restore-backup-file">{t("backupRestoreDialog.plik_backupu")}</Label>
          <Input
            id="restore-backup-file"
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            onChange={selectFile}
          />
          {backup && (
            <p className="text-xs text-green-400">
              {t("backupRestoreDialog.wczytano_backup_v")}{backup.schemaVersion}: {String(backup.tournament.name ?? t("backupRestoreDialog.turniej"))}.
            </p>
          )}
        </div>

        {v3Preview && (
          <section aria-label={t("backupRestoreDialog.podglad_kopii_v3")} data-testid="backup-v3-preview" className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-semibold">{t("backupRestoreDialog.kopia_v3")}{v3Preview.name}”{v3Preview.exportedAt ? t("backupRestoreDialog.zapisana_v0", { v0: new Date(v3Preview.exportedAt).toLocaleString("pl-PL") }) : ""}</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li>{v3Preview.participantType === "teams" ? t("backupRestoreDialog.druzyny") : t("backupRestoreDialog.uczestnicy")}: <strong className="text-foreground">{v3Preview.participants}</strong></li>
              <li>{t("backupRestoreDialog.etapy")}{" "}<strong className="text-foreground">{v3Preview.stages}</strong></li>
              <li>{t("backupRestoreDialog.mecze_rozegrane")}{" "}<strong className="text-foreground">{v3Preview.matches.completed}/{v3Preview.matches.total}</strong></li>
              <li>{t("backupRestoreDialog.historia_wynikow")}{" "}<strong className="text-foreground">{v3Preview.resultHistory}</strong></li>
              {v3Preview.teams && <li className="col-span-2">{t("backupRestoreDialog.sklady_zawodnicy")}{" "}<strong className="text-foreground">{v3Preview.teams.activeMembers}</strong>{t("backupRestoreDialog.druzyny_ze_skladem")}{" "}{v3Preview.teams.count}{t("backupRestoreDialog.wpisy_historii")}{" "}{v3Preview.teams.historyEntries}</li>}
            </ul>
            {v3Preview.problems.length ? (
              <div role="alert" className="text-destructive">
                <p className="font-semibold">{t("backupRestoreDialog.plik_jest_niekompletny_lub_niespojny")}</p>
                <ul className="list-disc pl-5">{v3Preview.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
              </div>
            ) : (
              <p className="text-green-400">{t("backupRestoreDialog.plik_jest_kompletny_i_spojny")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("backupRestoreDialog.przywracanie_kopii_v3_w_aplikacji")}</p>
          </section>
        )}

        {!v3Preview && <>
        <div className="space-y-2">
          <Label htmlFor="restore-organizer-password">{t("backupRestoreDialog.nowe_haslo_organizatora")}</Label>
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
            <Label htmlFor="restore-viewer-password">{t("backupRestoreDialog.nowe_haslo_widza")}</Label>
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
          <Label htmlFor="restore-support-password">{t("backupRestoreDialog.nowe_haslo_wsparcia_opcjonalne")}</Label>
          <Input
            id="restore-support-password"
            type="password"
            minLength={8}
            value={supportPassword}
            onChange={(event) => setSupportPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("backupRestoreDialog.pozostaw_puste_aby_dostep_supportu")}</p>
        </div>
        </>}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose} disabled={importTournament.isPending}>{t("backupRestoreDialog.anuluj")}</Button>
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
            {importTournament.isPending ? t("backupRestoreDialog.przywracanie") : t("backupRestoreDialog.przywroc_jako_nowy_turniej")}
          </Button>}
        </div>
      </div>
    </div>
  );
}
