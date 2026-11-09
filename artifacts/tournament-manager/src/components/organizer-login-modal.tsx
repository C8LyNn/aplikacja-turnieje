import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import {
  apiOrganizerCredentialState,
  apiOrganizerLogin,
  apiUpgradeLegacyOrganizer,
} from "@/lib/auth";
import {
  setActiveOrganizerToken,
  setActiveSupportToken,
  setActiveViewerToken,
  type OrganizerCredentialState,
} from "@workspace/api-client-react";
import { organizerCredentialScreen } from "@/lib/organizer-credential-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, UserCog, X } from "lucide-react";

interface Props {
  open?: boolean;
  onClose?: () => void;
  tournamentId: number;
  tournamentName: string;
  onSuccess: (token: string) => void;
  onCancel?: () => void;
}

export function OrganizerLoginModal({ open, onClose, tournamentId, tournamentName, onSuccess, onCancel }: Props) {
  const { storeOrgToken, setRole } = useAuth();
  const submitLock = useRef(false);
  const [password, setPassword] = useState("");
  const [hostCode, setHostCode] = useState("");
  const [credentialState, setCredentialState] =
    useState<OrganizerCredentialState | null>(null);
  const [stateLoading, setStateLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleClose = onCancel ?? onClose;
  const credentialScreen = organizerCredentialScreen(credentialState, stateLoading);

  useEffect(() => {
    if (open === false) return;
    let cancelled = false;
    setStateLoading(true);
    setCredentialState(null);
    setError(null);
    void apiOrganizerCredentialState(tournamentId)
      .then((state) => {
        if (!cancelled) setCredentialState(state);
      })
      .catch((stateError: unknown) => {
        if (!cancelled) {
          setError(
            stateError instanceof Error
              ? stateError.message
              : "Nie udało się sprawdzić sposobu logowania.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setStateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tournamentId]);

  useEffect(() => {
    if (open === false || !handleClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (open === false) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || stateLoading || !password ||
      (credentialScreen !== "organizer_login" && credentialScreen !== "legacy_upgrade")) return;
    submitLock.current = true;
    setLoading(true);
    setError(null);
    try {
      const token = credentialScreen === "legacy_upgrade"
        ? await apiUpgradeLegacyOrganizer(tournamentId, hostCode, password)
        : await apiOrganizerLogin(tournamentId, password);
      storeOrgToken(tournamentId, token);
      setActiveOrganizerToken(token);
      setActiveSupportToken(null);
      setActiveViewerToken(null);
      setRole("organizer");
      setPassword("");
      setHostCode("");
      onSuccess(token);
    } catch (err: any) {
      setError(err.message ?? "Nieprawidłowe hasło");
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose?.();
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 rounded-full p-2 shrink-0">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Logowanie organizatora</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tournamentName}</p>
            </div>
          </div>
          {handleClose && (
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5" aria-label="Zamknij">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {credentialScreen === "loading" ? (
          <p className="text-sm text-muted-foreground">Sprawdzanie sposobu logowania…</p>
        ) : credentialScreen === "admin_recovery" ? (
          <p className="text-sm text-muted-foreground rounded-lg border p-3">
            Ten historyczny turniej nie ma poświadczeń do samodzielnego
            odzyskania. Skontaktuj się z administratorem. Brak poświadczeń nie
            umożliwia publicznego przejęcia turnieju.
          </p>
        ) : credentialScreen === "not_found" ? (
          <p className="text-sm text-muted-foreground rounded-lg border p-3">
            Nie można rozpocząć logowania dla tego identyfikatora turnieju.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {credentialScreen !== "legacy_upgrade" && (
              <p className="text-sm text-muted-foreground">
                Podaj zachowane hasło organizatora tego turnieju. Możesz nim wrócić
                po wylogowaniu lub utracie danych przeglądarki i wejść na drugim
                urządzeniu. Logowanie nie wyloguje pozostałych sesji.
              </p>
            )}
            {credentialScreen === "legacy_upgrade" && (
              <>
                <p className="text-xs text-muted-foreground">
                  Ten historyczny turniej używa kodu prowadzącego. Podaj
                  dokładny dotychczasowy kod i ustaw nowe hasło organizatora.
                </p>
                <div className="space-y-1.5">
                  <Label>Kod prowadzącego</Label>
                  <Input
                    type="password"
                    value={hostCode}
                    onChange={(event) => setHostCode(event.target.value)}
                    autoComplete="off"
                    required
                    autoFocus
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="organizer-login-password" className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                {credentialScreen === "legacy_upgrade"
                  ? "Nowe hasło organizatora"
                  : "Hasło organizatora"}
              </Label>
              <Input
                id="organizer-login-password"
                type="password"
                autoComplete={credentialScreen === "legacy_upgrade" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  credentialScreen === "legacy_upgrade"
                    ? "Minimum 8 znaków"
                    : "Zachowane hasło organizatora"
                }
                minLength={
                  credentialScreen === "legacy_upgrade" ? 8 : undefined
                }
                required
                autoFocus={credentialScreen !== "legacy_upgrade"}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2">
              {handleClose && (
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                  Anuluj
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  loading ||
                  !password ||
                  (credentialScreen === "legacy_upgrade" &&
                    (!hostCode || password.length < 8))
                }
              >
                {loading
                  ? "Sprawdzanie…"
                  : credentialScreen === "legacy_upgrade"
                    ? "Ustaw hasło"
                    : "Zaloguj"}
              </Button>
            </div>
          </form>
        )}
        {error && credentialState == null && !stateLoading && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </div>
  );
}
