import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getGetTournamentQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiChangeVisibility } from "@/lib/auth";

export type TournamentVisibility = "public_online" | "private_online" | "private_offline";

/**
 * #330 · what the organizer can do with the tournament's visibility right now. "Ukryty" is the existing private
 * offline mode (the API refuses every public read, the list skips it). Hiding is offered only before the start;
 * the server enforces the same rule (HIDE_AFTER_START_NOT_ALLOWED).
 */
export function visibilityActions(visibility: string | null | undefined, status: string | null | undefined) {
  const v = (visibility ?? "public_online") as TournamentVisibility;
  return {
    visibility: v,
    label: v === "private_offline" ? "UKRYTY — niewidoczny dla widzów" : v === "private_online" ? "Z HASŁEM WIDZA" : "PUBLICZNY",
    canPublish: v === "private_offline",
    canHide: v === "public_online" && status === "draft",
    note: v === "public_online" && status !== "draft"
      ? "Po rozpoczęciu turnieju nie można go ukryć."
      : v === "private_online" ? "Dostęp z hasłem widza zmienisz w Udostępnianiu." : null,
  };
}

export function TournamentVisibilityControl({
  tournamentId,
  status,
  visibility,
  orgToken,
  compact = false,
}: {
  tournamentId: number;
  status: string;
  visibility: string | null | undefined;
  /** Only the organizer publishes or hides; without a token the state is shown read-only. */
  orgToken?: string | null;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState(false);
  const state = visibilityActions(visibility, status);

  const change = async (next: TournamentVisibility) => {
    if (!orgToken) return;
    setPending(true); setError(null); setMessage(null);
    try {
      await apiChangeVisibility(tournamentId, orgToken, next);
      await queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournamentId) });
      setMessage(next === "public_online" ? "Turniej jest publiczny — widzowie zobaczą go pod tym samym linkiem." : "Turniej jest ukryty — widzowie nie mają do niego dostępu.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zmienić widoczności.");
    } finally {
      setPending(false);
    }
  };

  const Icon = state.visibility === "private_offline" ? EyeOff : state.visibility === "private_online" ? Lock : Eye;
  return (
    <div className={`tournament-visibility flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`} data-visibility={state.visibility}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${state.visibility === "private_offline" ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : state.visibility === "private_online" ? "border-yellow-500/40 text-yellow-300" : "border-emerald-500/40 text-emerald-300"}`}
        aria-label={`Widoczność: ${state.label}`}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" /> {state.label}
      </span>
      {orgToken && state.canPublish && (
        <Button size="sm" onClick={() => void change("public_online")} disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />}
          Opublikuj turniej
        </Button>
      )}
      {orgToken && state.canHide && (
        <Button size="sm" variant="outline" onClick={() => setConfirmHide(true)} disabled={pending}>
          <EyeOff aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> Ukryj turniej
        </Button>
      )}
      {orgToken && state.note && <span className="text-xs text-muted-foreground">{state.note}</span>}
      {message && <span role="status" className="basis-full text-xs text-muted-foreground">{message}</span>}
      {error && <span role="alert" className="basis-full text-xs text-destructive">{error}</span>}
      <AlertDialog open={confirmHide} onOpenChange={setConfirmHide}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ukryć turniej?</AlertDialogTitle>
            <AlertDialogDescription>
              Widzowie stracą dostęp do turnieju — także pod znanym linkiem i w nakładkach — dopóki go nie opublikujesz.
              Uczestnicy, ustawienia i link zostają bez zmian. Organizator i wsparcie pracują dalej normalnie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => void change("private_offline")}>Ukryj turniej</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
