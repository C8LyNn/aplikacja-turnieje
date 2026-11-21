import { t } from "@/i18n";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { apiSupportLogin } from "@/lib/auth";
import { setActiveSupportToken, setActiveOrganizerToken } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Users, User, X } from "lucide-react";

interface Props {
  open?: boolean;
  onClose?: () => void;
  tournamentId: number;
  tournamentName: string;
  onSuccess: (token: string, nick: string) => void;
  onCancel?: () => void;
}

export function SupportLoginModal({ open, onClose, tournamentId, tournamentName, onSuccess, onCancel }: Props) {
  const { storeSupSession } = useAuth();
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleClose = onCancel ?? onClose;

  useEffect(() => {
    if (open === false || !handleClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (open === false) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { sessionToken, nick: confirmedNick } = await apiSupportLogin(tournamentId, password, nick);
      storeSupSession(tournamentId, sessionToken, confirmedNick);
      setActiveSupportToken(sessionToken);
      setActiveOrganizerToken(null);
      onSuccess(sessionToken, confirmedNick);
    } catch (err: any) {
      setError(err.message ?? t("supportLoginModal.nieprawidlowe_haslo"));
    } finally {
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
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/15 rounded-full p-2 shrink-0">
              <Users aria-hidden="true" className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-base">{t("supportLoginModal.logowanie_wsparcia")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tournamentName}</p>
            </div>
          </div>
          {handleClose && (
            <button type="button" onClick={handleClose} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t("supportLoginModal.zamknij")}>
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="support-login-nick" className="flex items-center gap-1.5">
              <User aria-hidden="true" className="w-3.5 h-3.5" />{t("supportLoginModal.twoj_nick")}</Label>
            <Input
              id="support-login-nick"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder={t("supportLoginModal.np_sedzia1")}
              autoComplete="nickname"
              required
              maxLength={40}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-login-password" className="flex items-center gap-1.5">
              <Lock aria-hidden="true" className="w-3.5 h-3.5" />{t("supportLoginModal.haslo_wsparcia_lub_osobisty_kod")}</Label>
            <Input
              id="support-login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("supportLoginModal.podane_przez_organizatora")}
              title={t("supportLoginModal.z_osobistym_kodem_zobaczysz_sie")}
              autoComplete="current-password"
              aria-describedby={error ? "support-login-error" : undefined}
              required
            />
          </div>

          {error && (
            <p id="support-login-error" role="alert" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            {handleClose && (
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>{t("supportLoginModal.anuluj")}</Button>
            )}
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={loading || !nick.trim() || !password}>
              <Users aria-hidden="true" className="w-4 h-4 mr-2" />
              {loading ? t("supportLoginModal.logowanie") : t("supportLoginModal.zaloguj")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
