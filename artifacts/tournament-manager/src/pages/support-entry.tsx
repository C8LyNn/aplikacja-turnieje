import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListTournaments } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { apiSupportLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Lock, User, Trophy } from "lucide-react";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  double_elimination: "Podwójna eliminacja",
};

export default function SupportEntry() {
  const { data: tournaments } = useListTournaments();
  const { storeSupSession } = useAuth();
  const [, navigate] = useLocation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = tournaments?.filter((t) => t.status === "active") ?? [];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const { sessionToken, nick: confirmedNick } = await apiSupportLogin(selectedId, password, nick);
      storeSupSession(selectedId, sessionToken, confirmedNick);
      navigate(`/tournaments/${selectedId}/host`);
    } catch (err: any) {
      setError(err.message ?? "Błąd logowania");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Trophy className="w-6 h-6" />
            <span>TM_SYS</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zmień rolę
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-green-400" />
            <h1 className="text-2xl font-bold">Wsparcie organizatora</h1>
          </div>
          <p className="text-muted-foreground text-sm">Wybierz turniej i zaloguj się hasłem wsparcia.</p>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50">
            <Trophy className="w-10 h-10 text-muted-foreground mb-3 opacity-20" />
            <h3 className="text-lg font-semibold mb-1">Brak aktywnych turniejów</h3>
            <p className="text-muted-foreground text-sm">Poczekaj na uruchomienie turnieju przez organizatora.</p>
          </div>
        ) : !selectedId ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground mb-4">Wybierz turniej:</p>
            {active.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all"
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{FORMAT_LABELS[t.format] ?? t.format}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-6 bg-card space-y-5">
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
                <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Twój nick</Label>
                <Input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="np. Sędzia1"
                  required
                  maxLength={40}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Hasło wsparcia</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Podane przez organizatora"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
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
