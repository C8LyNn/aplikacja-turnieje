import { useState, useEffect, useCallback } from "react";
import { setActiveOrganizerToken } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import {
  apiGetSupportSessions,
  apiChangeSupportPassword,
  apiGetAuditLog,
  apiSetInitialOrganizerPassword,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, History, RefreshCw, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface Session {
  id: number;
  nick: string;
  lastActiveAt: string;
  createdAt: string;
}

interface AuditEntry {
  id: number;
  actorType: string;
  actorNick: string;
  action: string;
  createdAt: string;
}

interface Props {
  tournamentId: number;
  hasOrganizerPassword: boolean;
  onOrganizerPasswordSet?: () => void | Promise<unknown>;
}

export function SecurityPanel({
  tournamentId,
  hasOrganizerPassword,
  onOrganizerPasswordSet,
}: Props) {
  const { getOrgToken, storeOrgToken } = useAuth();
  const token = getOrgToken(tournamentId) ?? "";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [tab, setTab] = useState<"sessions" | "log">("sessions");
  const [organizerPasswordSet, setOrganizerPasswordSet] = useState(hasOrganizerPassword);
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [showOrganizerPassword, setShowOrganizerPassword] = useState(false);
  const [settingOrganizerPassword, setSettingOrganizerPassword] = useState(false);
  const [organizerPasswordError, setOrganizerPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setOrganizerPasswordSet(hasOrganizerPassword);
  }, [hasOrganizerPassword]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        apiGetSupportSessions(tournamentId, token),
        apiGetAuditLog(tournamentId, token),
      ]);
      setSessions(s);
      setAuditLog(l);
    } catch {}
    finally { setLoading(false); }
  }, [tournamentId, token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPw(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      await apiChangeSupportPassword(tournamentId, token, newPassword);
      setPwSuccess(true);
      setNewPassword("");
      await refresh();
    } catch (err: any) {
      setPwError(err.message ?? "Błąd zmiany hasła");
    } finally {
      setChangingPw(false);
    }
  }

  async function handleSetOrganizerPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token || organizerPassword.length < 8) return;
    setSettingOrganizerPassword(true);
    setOrganizerPasswordError(null);
    try {
      const replacementToken = await apiSetInitialOrganizerPassword(
        tournamentId,
        token,
        organizerPassword,
      );
      storeOrgToken(tournamentId, replacementToken);
      setActiveOrganizerToken(replacementToken);
      setOrganizerPassword("");
      setOrganizerPasswordSet(true);
      if (onOrganizerPasswordSet) {
        void Promise.resolve(onOrganizerPasswordSet()).catch(() => undefined);
      }
    } catch (error) {
      setOrganizerPasswordError(
        error instanceof Error ? error.message : "Błąd ustawiania hasła organizatora",
      );
    } finally {
      setSettingOrganizerPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Panel bezpieczeństwa</h3>
        <button onClick={refresh} className="ml-auto text-muted-foreground hover:text-foreground" title="Odśwież" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!organizerPasswordSet && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Ustaw hasło organizatora</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hasło jest opcjonalne i nie blokuje zarządzania turniejem. Jeśli je ustawisz,
            pozwoli Ci ponownie zalogować się po utracie bieżącej sesji.
          </p>
          <form onSubmit={handleSetOrganizerPassword} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="initial-organizer-password" className="text-xs">
                Pierwsze hasło organizatora
              </Label>
              <div className="relative">
                <Input
                  id="initial-organizer-password"
                  type={showOrganizerPassword ? "text" : "password"}
                  value={organizerPassword}
                  onChange={(event) => setOrganizerPassword(event.target.value)}
                  placeholder="min. 8 znaków"
                  required
                  minLength={8}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowOrganizerPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showOrganizerPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showOrganizerPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {organizerPasswordError && (
              <p className="text-xs text-destructive">{organizerPasswordError}</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={settingOrganizerPassword || organizerPassword.length < 8}
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              {settingOrganizerPassword ? "Ustawianie…" : "Ustaw hasło organizatora"}
            </Button>
          </form>
        </div>
      )}

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("sessions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "sessions" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Aktywne sesje wsparcia ({sessions.length})</span>
        </button>
        <button
          onClick={() => setTab("log")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "log" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" />Logi działań ({auditLog.length})</span>
        </button>
      </div>

      {tab === "sessions" && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Brak aktywnych sesji wsparcia.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                  <div>
                    <span className="font-medium text-sm">{s.nick}</span>
                    <div className="text-xs text-muted-foreground">
                      Dołączył: {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: pl })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-green-400 font-medium">aktywny</span>
                    <div className="text-xs text-muted-foreground">
                      ostatnio: {formatDistanceToNow(new Date(s.lastActiveAt), { addSuffix: true, locale: pl })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-border rounded-lg p-4 space-y-3 bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold">Zmień hasło wsparcia</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Po zmianie hasła <strong>wszystkie aktywne sesje wsparcia zostaną unieważnione</strong>. Osoby ze wsparcia muszą zalogować się ponownie z nowym hasłem.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Nowe hasło wsparcia</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="min. 8 znaków"
                    required
                    minLength={8}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {pwError && <p className="text-xs text-destructive">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-green-400">Hasło zmienione. Poprzednie sesje zostały unieważnione.</p>}
              <Button type="submit" variant="destructive" size="sm" disabled={changingPw || newPassword.length < 8}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                {changingPw ? "Zmienianie…" : "Zmień hasło i unieważnij sesje"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {tab === "log" && (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Brak logów działań.</p>
          ) : (
            auditLog.map((l) => (
              <div key={l.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 text-sm">
                <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                  l.actorType === "organizer" ? "bg-primary/20 text-primary" : "bg-green-500/20 text-green-400"
                }`}>
                  {l.actorType === "organizer" ? "ORG" : "WS"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{l.actorNick}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-muted-foreground">{l.action}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true, locale: pl })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
