import { t } from "@/i18n";
import type { Player, StageBasket, TournamentStage } from "@workspace/api-client-react";

/**
 * V5.9 · bulk assignment of participants to a stage's start (input) baskets.
 *
 * Only the existing basket model is used: an input basket lists the participants who start the stage, and the
 * basket order is the seeding order (the engine reads Start A first). Groups are not assigned here — the engine
 * forms them from the seeding when the stage starts — and advancement (output baskets and routes) is untouched.
 * Nothing is saved by these helpers; the panel keeps the result in its draft until "Zapisz konfigurację".
 */

export interface BasketMove {
  playerId: number;
  from: string | null;
  to: string | null;
}

export interface BasketCheck {
  /** "blocker" — the stage cannot start like this; "warning" — allowed, but probably not intended. */
  level: "blocker" | "warning";
  message: string;
}

const groupWord = (count: number) =>
  count === 1 ? t("basketBulkAssignment.grupa") : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? t("basketBulkAssignment.grupy") : t("basketBulkAssignment.grup");

const inputsOf = (baskets: readonly StageBasket[], stageId: number) =>
  baskets.filter((basket) => basket.stageId === stageId && basket.type === "input");

/** The start basket a participant is in for this stage, or null. */
export function inputBasketOf(baskets: readonly StageBasket[], stageId: number, playerId: number): string | null {
  return inputsOf(baskets, stageId).find((basket) => basket.participantIds.includes(playerId))?.id ?? null;
}

/**
 * Moves the given participants to one start basket of the stage (or out of every start basket when the target is
 * null). A participant is in at most one start basket per stage, as the API requires. Participants already in the
 * target are left alone and are not reported as moves. Baskets of other stages and output baskets never change.
 */
export function planBasketMove(
  baskets: readonly StageBasket[],
  stageId: number,
  playerIds: readonly number[],
  targetBasketId: string | null,
): { baskets: StageBasket[]; moves: BasketMove[] } {
  const inputs = inputsOf(baskets, stageId);
  if (targetBasketId != null && !inputs.some((basket) => basket.id === targetBasketId)) {
    return { baskets: [...baskets], moves: [] };
  }
  const moves: BasketMove[] = [];
  for (const playerId of new Set(playerIds)) {
    const from = inputBasketOf(baskets, stageId, playerId);
    if (from !== targetBasketId) moves.push({ playerId, from, to: targetBasketId });
  }
  if (!moves.length) return { baskets: [...baskets], moves };
  const moving = new Set(moves.map((move) => move.playerId));
  const next = baskets.map((basket) => {
    if (basket.stageId !== stageId || basket.type !== "input") return basket;
    const kept = basket.participantIds.filter((id) => !moving.has(id));
    const participantIds = basket.id === targetBasketId ? [...kept, ...moves.map((move) => move.playerId)] : kept;
    return participantIds.length === basket.participantIds.length && participantIds.every((id, i) => id === basket.participantIds[i])
      ? basket
      : { ...basket, participantIds };
  });
  return { baskets: next, moves };
}

/**
 * What the organizer should know about the start baskets of one stage. The same counts the API checks before the
 * start (planned participant count, group layout); the API stays the authority and reports its own problems on save.
 */
export function checkStageBaskets({
  stage,
  baskets,
  players,
  incomingQuota,
  firstStage,
  labelOf,
}: {
  stage: Pick<TournamentStage, "id" | "format" | "participantCount" | "groupCount" | "participantsPerGroup">;
  baskets: readonly StageBasket[];
  players: readonly Pick<Player, "id" | "name">[];
  /** Participants arriving from earlier stages through routes (already counted by the flow). */
  incomingQuota: number;
  /** In the first stage everyone registered is expected to start somewhere. */
  firstStage: boolean;
  labelOf: (basket: StageBasket) => string;
}): BasketCheck[] {
  const inputs = inputsOf(baskets, stage.id);
  const direct = inputs.reduce((sum, basket) => sum + basket.participantIds.length, 0);
  const total = direct + incomingQuota;
  const checks: BasketCheck[] = [];

  if (stage.format === "group_stage" && stage.groupCount && stage.participantsPerGroup) {
    const max = stage.groupCount * stage.participantsPerGroup;
    const min = Math.max(stage.groupCount * 2, stage.groupCount * (stage.participantsPerGroup - 1) + 1);
    if (total < min || total > max) {
      checks.push({
        level: "blocker",
        message: t("basketBulkAssignment.groupcount_v1_po_participantspergroup_od", { groupCount: stage.groupCount, v1: groupWord(stage.groupCount), participantsPerGroup: stage.participantsPerGroup, min: min, max: max, total: total }),
      });
    }
  }
  if (total !== stage.participantCount) {
    checks.push({
      level: "blocker",
      message: total < stage.participantCount
        ? t("basketBulkAssignment.etap_jest_zaplanowany_na_participantcoun", { participantCount: stage.participantCount, total: total, v2: stage.participantCount - total })
        : t("basketBulkAssignment.etap_jest_zaplanowany_na_participantcoun_2", { participantCount: stage.participantCount, total: total, v2: total - stage.participantCount }),
    });
  }
  if (firstStage) {
    const assigned = new Set(inputs.flatMap((basket) => basket.participantIds));
    const outside = players.filter((player) => !assigned.has(player.id));
    if (outside.length) {
      const names = outside.slice(0, 3).map((player) => player.name).join(", ");
      checks.push({
        level: "warning",
        message: t("basketBulkAssignment.bez_koszyka_nie_zagraja_w", { length: outside.length, names: names, v2: outside.length > 3 ? t("basketBulkAssignment.i_inni") : "" }),
      });
    }
  }
  if (inputs.length > 1) {
    for (const basket of inputs) {
      if (!basket.participantIds.length) checks.push({ level: "warning", message: t("basketBulkAssignment.v0_bedzie_pusty", { v0: labelOf(basket) }) });
    }
  }
  return checks;
}
