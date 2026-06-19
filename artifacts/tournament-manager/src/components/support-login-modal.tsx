import { useState } from "react";
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
      setError(err.message ?? "Nieprawidłowe hasło");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/15 rounded-full p-2 shrink-0">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-base">Logowanie wsparcia</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tournamentName}</p>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Twój nick
            </Label>
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
            <Label className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Hasło wsparcia
            </Label>
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

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading || !nick.trim() || !password}>
            <Users className="w-4 h-4 mr-2" />
            {loading ? "Logowanie…" : "Zaloguj jako wsparcie"}
          </Button>
        </form>
      </div>
    </div>
  );
}
