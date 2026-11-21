import { t } from "@/i18n";
import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import { setActiveViewerToken } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { RoleHomeLink } from "@/components/app-navigation";
import { ViewerLoginModal } from "@/components/viewer-login-modal";
import { useAuth } from "@/context/auth-context";

type HttpError = { status?: number; data?: { code?: string } | null } | null | undefined;

/** The server's access refusal for a tournament read (401/403), or undefined for any other outcome. */
export function accessDeniedCode(error: unknown): string | undefined {
  const e = error as HttpError;
  if (e?.status !== 401 && e?.status !== 403) return undefined;
  return e.data?.code ?? "ACCESS_DENIED";
}

/**
 * QW-05: retry only what can succeed on its own. A 4xx answer (no access, not found, invalid) is final until the
 * user acts, so retrying it only delays the message by ~7 s and loads the server; timeouts and rate limits retry.
 */
export function shouldRetryRead(failureCount: number, error: unknown): boolean {
  const status = (error as HttpError)?.status;
  if (typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return failureCount < 3;
}

/** Polling interval that stops while the server refuses access (a refusal does not change by itself). */
export function pollUnlessDenied(ms: number) {
  return (query: { state: { error: unknown } }) => (accessDeniedCode(query.state.error) ? false : ms);
}

/**
 * Keeps the refusal while a background refetch is in flight (react-query clears `error` during it), so the gate
 * does not flicker; cleared as soon as the tournament loads.
 */
export function useLatchedAccessDenied(error: unknown, loaded: boolean): string | undefined {
  const latch = useRef<string | undefined>(undefined);
  const code = accessDeniedCode(error);
  if (code) latch.current = code;
  else if (loaded) latch.current = undefined;
  return latch.current;
}

/**
 * The page a viewer sees instead of a private tournament: why it is closed and, when the tournament accepts a
 * viewer password and the page may use one, how to open it. Nothing about the tournament is shown before access.
 */
export function PrivateTournamentGate({
  tournamentId,
  code,
  onAuthorized,
  allowViewerLogin = true,
  fullScreen = true,
}: {
  tournamentId: number;
  code: string;
  onAuthorized?: () => void;
  /** The projector/OBS views never send credentials, so they only explain. */
  allowViewerLogin?: boolean;
  fullScreen?: boolean;
}) {
  const { storeViewerToken } = useAuth();
  const [open, setOpen] = useState(false);
  const viewerMayLogin = allowViewerLogin && code === "VIEWER_PASSWORD_REQUIRED";
  const message = code === "VIEWER_PASSWORD_REQUIRED"
    ? allowViewerLogin
      ? t("privateTournamentGate.podaj_haslo_widza_aby_otworzyc")
      : t("privateTournamentGate.ten_turniej_wymaga_hasla_widza")
    : code === "PRIVATE_OFFLINE"
      ? t("privateTournamentGate.ten_turniej_nie_jest_dostepny")
      : t("privateTournamentGate.nie_masz_dostepu_do_tego");
  return (
    <div
      role="region"
      aria-label={t("privateTournamentGate.turniej_prywatny")}
      data-access-denied={code}
      className={`${fullScreen ? "min-h-screen" : "py-16"} relative bg-background text-foreground flex flex-col items-center justify-center gap-4 px-4 text-center`}
    >
      {fullScreen && (
        <RoleHomeLink fallbackHref="/fan" fallbackLabel={t("privateTournamentGate.wroc_do_turniejow")} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground" />
      )}
      <Lock className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t("privateTournamentGate.turniej_prywatny")}</h1>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {viewerMayLogin && <Button onClick={() => setOpen(true)}>{t("privateTournamentGate.podaj_haslo_widza")}</Button>}
      {viewerMayLogin && (
        <ViewerLoginModal
          open={open}
          onClose={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          tournamentId={tournamentId}
          tournamentName={t("privateTournamentGate.turniej_tournamentid", { tournamentId: tournamentId })}
          onSuccess={(token) => {
            storeViewerToken(tournamentId, token);
            setActiveViewerToken(token);
            setOpen(false);
            onAuthorized?.();
          }}
        />
      )}
    </div>
  );
}
