import { t } from "@/i18n";
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

/** One key per intended adjustment: a retry after a network error or a double click is recognised by the API. */
function newRequestKey(): string {
  try {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
  }
}

const authorLabel = (label?: string | null) => (!label ? "" : label.startsWith("organizer") ? t("experimentalPointAdjustments.organizator") : t("experimentalPointAdjustments.pomoc"));

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
  // Kept until the API confirms; changing the form starts a new key.
  const [requestKey, setRequestKey] = useState(newRequestKey);

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
    <section className="experimental-point-adjustments" aria-label={t("experimentalPointAdjustments.korekty_punktow")}>
      <button type="button" className="experimental-point-adjustments-head" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Scale className="h-4 w-4" aria-hidden="true" />
        <span className="font-semibold">{t("experimentalPointAdjustments.korekty_punktow")}</span>
        <span className="experimental-point-adjustments-summary">{active.length ? t("experimentalPointAdjustments.length_aktywne", { length: active.length }) : t("experimentalPointAdjustments.brak")}{data.locked ? t("experimentalPointAdjustments.etap_zakonczony") : ""}</span>
        <ChevronDown className="experimental-point-adjustments-chevron h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="experimental-point-adjustments-body">
          <p className="text-xs text-muted-foreground">{t("experimentalPointAdjustments.bonus_albo_kara_zmienia_tylko")}</p>
          {data.entries.length > 0 && (
            <ul className="experimental-point-adjustments-list">
              {data.entries.map((entry) => (
                <li key={entry.id} data-revoked={entry.revokedAt ? "true" : undefined}>
                  <span className="experimental-point-adjustments-points" data-sign={entry.points > 0 ? "plus" : "minus"}>{signed(entry.points)}</span>
                  <span className="min-w-0 flex-1">
                    <strong>{nameOf.get(entry.playerId) ?? `#${entry.playerId}`}</strong> — {entry.reason}
                    <span className="block text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString("pl-PL")}{entry.createdBy ? t("experimentalPointAdjustments.dodal_v0", { v0: authorLabel(entry.createdBy) }) : ""}
                      {entry.revokedAt ? t("experimentalPointAdjustments.cofnieta_v0_v1", { v0: new Date(entry.revokedAt).toLocaleString("pl-PL"), v1: entry.revokedBy ? ` (${authorLabel(entry.revokedBy)})` : "" }) : ""}
                    </span>
                  </span>
                  {!entry.revokedAt && !data.locked && (
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={revoke.isPending}
                      aria-label={t("experimentalPointAdjustments.cofnij_korekte_v0_dla_v1", { v0: signed(entry.points), v1: nameOf.get(entry.playerId) ?? entry.playerId })}
                      onClick={() => revoke.mutate({ id: tournamentId, stageId: stage.id, adjustmentId: entry.id }, { onSuccess: () => { setMessage({ tone: "ok", text: t("experimentalPointAdjustments.korekta_cofnieta") }); refresh(); }, onError: failure })}>
                      <Undo2 className="h-4 w-4" aria-hidden="true" /> {t("experimentalPointAdjustments.cofnij")}</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!data.locked && (
            <form className="experimental-point-adjustments-form" onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              if (add.isPending) return;
              add.mutate({ id: tournamentId, stageId: stage.id, data: { playerId: Number(playerId), points, reason, requestId: requestKey } }, {
                onSuccess: (result) => {
                  setReason("");
                  setRequestKey(newRequestKey());
                  setMessage({ tone: "ok", text: result.replayed ? t("experimentalPointAdjustments.ta_korekta_byla_juz_zapisana") : t("experimentalPointAdjustments.dodano_korekte_v0_pkt", { v0: signed(points) }) });
                  refresh();
                },
                // On error the form and the key stay, so "Dodaj korektę" again is a safe retry.
                onError: failure,
              });
            }}>
              <label className="grid gap-1 text-sm">{t("experimentalPointAdjustments.uczestnik")}<select className="participant-field-control" value={playerId} onChange={(event) => { setPlayerId(event.target.value); setRequestKey(newRequestKey()); }} required>
                  <option value="">{t("experimentalPointAdjustments.wybierz")}</option>
                  {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}{participant.group ? ` (${participant.group})` : ""}</option>)}
                </select>
              </label>
              <div className="grid gap-1 text-sm">
                <span>{t("experimentalPointAdjustments.punkty")}</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalPointAdjustments.mniej_punktow")} onClick={() => { setPoints((value) => Math.max(-100, value - 1 === 0 ? -1 : value - 1)); setRequestKey(newRequestKey()); }}><Minus className="h-4 w-4" /></button>
                  <output className="min-w-12 text-center font-mono text-lg font-bold" aria-live="polite">{signed(points)}</output>
                  <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalPointAdjustments.wiecej_punktow")} onClick={() => { setPoints((value) => Math.min(100, value + 1 === 0 ? 1 : value + 1)); setRequestKey(newRequestKey()); }}><Plus className="h-4 w-4" /></button>
                  <span className="text-xs text-muted-foreground">{points < 0 ? t("experimentalPointAdjustments.kara") : "bonus"}</span>
                </div>
              </div>
              <label className="grid gap-1 text-sm">{t("experimentalPointAdjustments.powod_widoczny_w_historii")}<input className="participant-field-control" maxLength={200} value={reason} onChange={(event) => { setReason(event.target.value); setRequestKey(newRequestKey()); }} placeholder={t("experimentalPointAdjustments.np_walkower_bez_zgloszenia")} required />
              </label>
              <button type="submit" className="experimental-v4-btn" data-variant="primary" disabled={add.isPending || !playerId || !reason.trim()}>
                {add.isPending ? t("experimentalPointAdjustments.zapisywanie") : t("experimentalPointAdjustments.dodaj_korekte")}
              </button>
            </form>
          )}
          {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message.text}</p>}
        </div>
      )}
    </section>
  );
}
