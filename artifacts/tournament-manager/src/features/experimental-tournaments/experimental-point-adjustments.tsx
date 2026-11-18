/**
 * V5.5 · bonuses and penalties for a points-table stage (organiser, Experimental host panel).
 * Every entry needs a reason and stays in the list after it is revoked; a completed stage is read-only.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetStagePointAdjustmentsQueryKey,
  useAddStagePointAdjustment,
  useGetStagePointAdjustments,
  useRevokeStagePointAdjustment,
  type TournamentStage,
} from "@workspace/api-client-react";
import { ChevronDown, Minus, Plus, Scale, Undo2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";
import { useStageLiveStandings } from "@/components/stage-live-tables";

const signed = (points: number) => `${points > 0 ? "+" : ""}${points}`;

export function ExperimentalPointAdjustments({ tournamentId, stage }: { tournamentId: number; stage: TournamentStage }) {
  const client = useQueryClient();
  const query = useGetStagePointAdjustments(tournamentId, stage.id, {
    query: { queryKey: getGetStagePointAdjustmentsQueryKey(tournamentId, stage.id), staleTime: 5000, retry: false },
  });
  const live = useStageLiveStandings(tournamentId, stage.id, { refetchInterval: 8000 });
  const add = useAddStagePointAdjustment();
  const revoke = useRevokeStagePointAdjustment();
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [points, setPoints] = useState(-1);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const data = query.data;
  if (!data?.supported) return null;
  const participants = (live.data?.tables ?? []).flatMap((table) => table.rows.map((row) => ({ id: row.playerId, name: row.playerName, group: live.data!.tables.length > 1 ? table.label : null })));
  const nameOf = new Map(participants.map((participant) => [participant.id, participant.name]));
  const active = data.entries.filter((entry) => !entry.revokedAt);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: getGetStagePointAdjustmentsQueryKey(tournamentId, stage.id) });
    void client.invalidateQueries();
  };
  const failure = (error: unknown) => {
    const problems = (error as { data?: { problems?: Array<{ message: string }> } }).data?.problems;
    setMessage({ tone: "error", text: problems?.length ? problems.map((problem) => problem.message).join(" ") : getApiErrorMessage(error) });
  };

  return (
    <section className="experimental-point-adjustments" aria-label="Korekty punktów">
      <button type="button" className="experimental-point-adjustments-head" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Scale className="h-4 w-4" aria-hidden="true" />
        <span className="font-semibold">Korekty punktów</span>
        <span className="experimental-point-adjustments-summary">{active.length ? `${active.length} aktywne` : "brak"}{data.locked ? " · etap zakończony" : ""}</span>
        <ChevronDown className="experimental-point-adjustments-chevron h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="experimental-point-adjustments-body">
          <p className="text-xs text-muted-foreground">Bonus albo kara zmienia tylko punkty w tabeli; wyniki meczów i mecz bezpośredni zostają bez zmian. Każda korekta wymaga powodu i zostaje w historii także po cofnięciu.</p>
          {data.entries.length > 0 && (
            <ul className="experimental-point-adjustments-list">
              {data.entries.map((entry) => (
                <li key={entry.id} data-revoked={entry.revokedAt ? "true" : undefined}>
                  <span className="experimental-point-adjustments-points" data-sign={entry.points > 0 ? "plus" : "minus"}>{signed(entry.points)}</span>
                  <span className="min-w-0 flex-1">
                    <strong>{nameOf.get(entry.playerId) ?? `#${entry.playerId}`}</strong> — {entry.reason}
                    <span className="block text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString("pl-PL")}{entry.revokedAt ? ` · cofnięta ${new Date(entry.revokedAt).toLocaleString("pl-PL")}` : ""}
                    </span>
                  </span>
                  {!entry.revokedAt && !data.locked && (
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={revoke.isPending}
                      aria-label={`Cofnij korektę ${signed(entry.points)} dla ${nameOf.get(entry.playerId) ?? entry.playerId}`}
                      onClick={() => revoke.mutate({ id: tournamentId, stageId: stage.id, adjustmentId: entry.id }, { onSuccess: () => { setMessage({ tone: "ok", text: "Korekta cofnięta." }); refresh(); }, onError: failure })}>
                      <Undo2 className="h-4 w-4" aria-hidden="true" /> Cofnij
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!data.locked && (
            <form className="experimental-point-adjustments-form" onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              add.mutate({ id: tournamentId, stageId: stage.id, data: { playerId: Number(playerId), points, reason } }, {
                onSuccess: () => { setReason(""); setMessage({ tone: "ok", text: `Dodano korektę ${signed(points)} pkt.` }); refresh(); },
                onError: failure,
              });
            }}>
              <label className="grid gap-1 text-sm">Uczestnik
                <select className="participant-field-control" value={playerId} onChange={(event) => setPlayerId(event.target.value)} required>
                  <option value="">— wybierz —</option>
                  {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}{participant.group ? ` (${participant.group})` : ""}</option>)}
                </select>
              </label>
              <div className="grid gap-1 text-sm">
                <span>Punkty</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="experimental-wizard-step-btn" aria-label="Mniej punktów" onClick={() => setPoints((value) => Math.max(-100, value - 1 === 0 ? -1 : value - 1))}><Minus className="h-4 w-4" /></button>
                  <output className="min-w-12 text-center font-mono text-lg font-bold" aria-live="polite">{signed(points)}</output>
                  <button type="button" className="experimental-wizard-step-btn" aria-label="Więcej punktów" onClick={() => setPoints((value) => Math.min(100, value + 1 === 0 ? 1 : value + 1))}><Plus className="h-4 w-4" /></button>
                  <span className="text-xs text-muted-foreground">{points < 0 ? "kara" : "bonus"}</span>
                </div>
              </div>
              <label className="grid gap-1 text-sm">Powód (widoczny w historii)
                <input className="participant-field-control" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Np. walkower bez zgłoszenia" required />
              </label>
              <button type="submit" className="experimental-v4-btn" data-variant="primary" disabled={add.isPending || !playerId || !reason.trim()}>
                {add.isPending ? "Zapisywanie…" : "Dodaj korektę"}
              </button>
            </form>
          )}
          {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message.text}</p>}
        </div>
      )}
    </section>
  );
}
