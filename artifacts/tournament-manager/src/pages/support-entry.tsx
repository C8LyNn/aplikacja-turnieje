import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useListTournaments } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { apiSupportLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Users, Lock, User, Trophy } from "lucide-react";
import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

const EXPERIMENTAL_SUPPORT_NICK_KEY = "tm_exp_support_nick_v1";

export default function SupportEntry() {
  const { data: tournaments, isError, isFetching, refetch } = useListTournaments();
  const { storeSupSession } = useAuth();
  const [location, navigate] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState(() => {
    if (!isExperimentalTournamentPath(window.location.pathname)) return "";
    try { return window.localStorage.getItem(EXPERIMENTAL_SUPPORT_NICK_KEY) ?? ""; } catch { return ""; }
  });
  const [supportQuery, setSupportQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const submitLock = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedList = tournaments !== undefined;
  const active = tournaments?.filter((t) => t.status === "active") ?? [];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || submitLock.current || !nick.trim() || !password) return;
    submitLock.current = true;
    setLoading(true);
    setError(null);
    try {
      const { sessionToken, nick: confirmedNick } = await apiSupportLogin(selectedId, password, nick);
      storeSupSession(selectedId, sessionToken, confirmedNick);
      if (isExperimental) {
        try { window.localStorage.setItem(EXPERIMENTAL_SUPPORT_NICK_KEY, confirmedNick); } catch { /* preference only */ }
      }
      navigate(tournamentHref(selectedId, isExperimental, "/host"));
    } catch (err: any) {
      setError(err.message ?? "Błąd logowania");
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry experimental-support-entry" : ""}`}>
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogoLink fallbackHref={isExperimental ? "/experimental/tournaments/support" : "/support"} className="text-xl" />
            {isExperimental && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
          </div>
          <RoleSelectionLink />
        </div>
      </header>

      <main id={isExperimental ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-green-400" />
            <h1 className="text-2xl font-bold">Wsparcie organizatora</h1>
          </div>
          <p className="text-muted-foreground text-sm">Wybierz turniej i zaloguj się hasłem wsparcia.</p>
        </div>

        {isError && hasLoadedList && (
          <div role="alert" className="mb-5 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">Nie udało się odświeżyć listy turniejów. Pokazujemy ostatnio pobrane dane.</p>
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => { void refetch(); }}>
              {isFetching ? "Ponawianie…" : "Spróbuj ponownie"}
            </Button>
          </div>
        )}

        {!hasLoadedList && isError ? (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-center space-y-3">
            <p className="font-semibold">Nie udało się pobrać listy turniejów.</p>
            <p className="text-sm text-muted-foreground">Sprawdź połączenie i spróbuj ponownie.</p>
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => { void refetch(); }}>
              {isFetching ? "Ponawianie…" : "Spróbuj ponownie"}
            </Button>
          </div>
        ) : !hasLoadedList ? (
          <div role="status" className="rounded-xl border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Pobieranie listy turniejów…
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50">
            <Trophy className="w-10 h-10 text-muted-foreground mb-3 opacity-20" />
            <h3 className="text-lg font-semibold mb-1">Brak aktywnych turniejów</h3>
            <p className="text-muted-foreground text-sm">Poczekaj na uruchomienie turnieju przez organizatora.</p>
          </div>
        ) : !selectedId ? (
          <div className="space-y-3">
            {isExperimental ? (() => {
              const query = supportQuery.trim().toLocaleLowerCase("pl");
              const visible = [...active]
                .filter((t) => !query || t.name.toLocaleLowerCase("pl").includes(query))
                .sort((a, b) => Number(Boolean(b.hasSupportPassword)) - Number(Boolean(a.hasSupportPassword)));
              return (
                <>
                  {active.length > 5 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="experimental-support-search">Znajdź turniej</Label>
                      <Input
                        id="experimental-support-search"
                        value={supportQuery}
                        onChange={(event) => setSupportQuery(event.target.value)}
                        placeholder="Nazwa turnieju"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">Wybierz turniej, w którym pomagasz:</p>
                  {visible.length === 0 && <p className="organizer-empty-state rounded-xl border border-dashed p-6 text-center text-sm">Brak turniejów pasujących do wyszukiwania.</p>}
                  {visible.map((t) => {
                    const available = Boolean(t.hasSupportPassword);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!available}
                        aria-describedby={available ? undefined : `support-unavailable-${t.id}`}
                        onClick={() => setSelectedId(t.id)}
                        data-support-available={available ? "true" : "false"}
                        className="experimental-support-tournament-card w-full text-left border border-border rounded-xl p-4 bg-card transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{t.name}</div>
                          <span className="experimental-support-access">{available ? "Dostęp dla wsparcia" : "Bez dostępu"}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{(STAGE_FORMAT_LABELS as Record<string, string>)[t.format] ?? FORMAT_LABELS[t.format] ?? t.format}</div>
                        {!available && (
                          <div id={`support-unavailable-${t.id}`} className="mt-1 text-xs text-muted-foreground">
                            Organizator nie ustawił hasła wsparcia. Poproś go o włączenie dostępu.
                          </div>
                        )}
                      </button>
                    );
                  })}
                </>
              );
            })() : (
              <>
            <p className="text-sm font-medium text-muted-foreground mb-4">Wybierz turniej:</p>
              {active.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all ${isExperimental ? "experimental-support-tournament-card" : ""}`}
                >
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{(isExperimental ? (STAGE_FORMAT_LABELS as Record<string, string>)[t.format] : undefined) ?? FORMAT_LABELS[t.format] ?? t.format}</div>
                </button>
              ))}
              </>
            )}
          </div>
        ) : (
          <div className={`border border-border rounded-xl p-6 bg-card space-y-5 ${isExperimental ? "experimental-support-login-panel" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{tournaments?.find((t) => t.id === selectedId)?.name}</div>
                <div className="text-sm text-muted-foreground">Logowanie jako wsparcie</div>
              </div>
              <button onClick={() => { setSelectedId(null); setError(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">
                zmień
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="support-entry-nick" className="flex items-center gap-1.5"><User aria-hidden="true" className="w-3.5 h-3.5" />Twój nick</Label>
                <Input
                  id="support-entry-nick"
                  value={nick}
                  aria-describedby={error ? "support-entry-login-error" : undefined}
                  autoComplete="nickname"
                  onChange={(e) => { setNick(e.target.value); setError(null); }}
                  placeholder="np. Sędzia1"
                  required
                  maxLength={40}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-entry-password" className="flex items-center gap-1.5"><Lock aria-hidden="true" className="w-3.5 h-3.5" />Hasło wsparcia</Label>
                <Input
                  id="support-entry-password"
                  type="password"
                  value={password}
                  aria-describedby={error ? "support-entry-login-error" : undefined}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Podane przez organizatora"
                  required
                />
              </div>

              {error && (
                <p id="support-entry-login-error" role="alert" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !nick.trim() || !password}>
                <Users className="w-4 h-4 mr-2" />
                {loading ? "Logowanie…" : "Zaloguj się jako wsparcie"}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
