import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiViewerLogin } from "@/lib/auth";

interface Props {
  open: boolean;
  tournamentId: number;
  tournamentName: string;
  onSuccess: (token: string) => void;
  onClose: () => void;
  onCancel?: () => void;
}

export function ViewerLoginModal({ open, tournamentId, tournamentName, onSuccess, onClose, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setPassword(""); setError(null); setLoading(false); return; }
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await apiViewerLogin(tournamentId, password);
      onSuccess(token);
    } catch (err: any) {
      setError(err.message || "Błąd logowania");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zamknij"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Hasło widza</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tournamentName}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Ten turniej jest chroniony hasłem widza. Podaj hasło, aby zobaczyć jego zawartość.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Hasło widza</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło widza..."
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !password.trim()}>
              {loading ? "Sprawdzanie…" : "Wejdź"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
