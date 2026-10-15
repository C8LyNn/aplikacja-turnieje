/**
 * Pack 10 — PURE, read-only structural projection of a proposed SE score correction.
 * Mirrors the immediate parent-slot lookup used by revertMatch(), without
 * simulating future winners or authorizing any mutation.
 */
import type {
  CorrectionMatch, CorrectionPreview, CorrectionStage,
} from "./tournament-result-correction-preflight";

export type EliminationBracketImpact =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available";
      stageId: number;
      stageName: string;
      format: "single_elimination";
      provisional: true;
      forecastScope: "structure_only";
      winnerChanges: boolean;
      sourceMatch: { matchId: number; round: number; matchNumber: number };
      directSlot: {
        matchId: number;
        round: number;
        slot: "player1" | "player2";
        currentPlayerId: number | null;
        hypotheticalPlayerId: number;
        matchingCurrentWinner: boolean;
        pristine: boolean;
      } | null;
      possibleDownstream: Array<{
        matchId: number;
        round: number;
        matchNumber: number;
        status: string;
        relation: "direct_slot" | "possible_later_match";
        blocking: boolean;
      }>;
      issues: Array<{ code: string; message: string }>;
      chainComplete: boolean;
      finalRoundWinnerMayChange: boolean;
      note: string;
    };

export interface EliminationBracketImpactInput {
  stage: CorrectionStage | undefined;
  match: CorrectionMatch;
  stageMatches: readonly CorrectionMatch[];
  preflight: CorrectionPreview;
}

const unavailable = (reasonCode: string, message: string): EliminationBracketImpact =>
  ({ status: "unavailable", reasonCode, message });

const ALWAYS_BLOCKING_PREVIEW_ISSUES = new Set([
  "INVALID_PROPOSED_RESULT", "STAGE_NOT_FOUND", "STALE_MATCH_REVISION",
  "MATCH_NOT_COMPLETED", "RESULT_INCONSISTENT", "PARTICIPANTS_INVALID",
  "SYSTEM_BYE_REVERT_BLOCKED", "RESULT_TYPE_REQUIRES_MANUAL_REVIEW",
]);

/**
 * Scores can change without changing the winner: a structural bracket projection
 * must never suggest that the next match's participant is replaced in that case.
 */
export function deriveEliminationBracketImpact(input: EliminationBracketImpactInput): EliminationBracketImpact {
  const { stage, match, stageMatches, preflight } = input;
  if (!stage || stage.id !== match.stageId) {
    return unavailable("STAGE_NOT_FOUND", "Nie można wskazać etapu tego meczu.");
  }
  if (stage.format === "double_elimination") {
    return unavailable("DE_RUNTIME_REQUIRED", "Double Elimination ma zależności winner/loser bracket i reset finału. Sam układ rund nie wystarcza do wiarygodnej symulacji; wymagana jest analiza silnika DE.");
  }
  if (stage.format !== "single_elimination") {
    return unavailable("NOT_ELIMINATION", "Podgląd zależności drabinki dotyczy tylko Single Elimination.");
  }
  if (preflight.matchId !== match.id || preflight.expectedRevision !== match.revision ||
      preflight.proposedResult.winnerId == null || match.winnerId == null ||
      preflight.issues.some(item => ALWAYS_BLOCKING_PREVIEW_ISSUES.has(item.code))) {
    return unavailable("INVALID_PREVIEW_STATE", "Nie można wiarygodnie wyznaczyć zależności dla niespójnego lub nieaktualnego wyniku.");
  }
  if (match.status !== "completed" || match.resultType !== "played" ||
      !Number.isSafeInteger(match.round) || match.round < 1 ||
      !Number.isSafeInteger(match.matchNumber) || match.matchNumber < 1 ||
      match.player1Id == null || match.player2Id == null || match.player1Id === match.player2Id ||
      ![match.player1Id, match.player2Id].includes(preflight.proposedResult.winnerId)) {
    return unavailable("INVALID_MATCH_STATE", "Mecz lub proponowany zwycięzca nie pasują do struktury rozgrywek.");
  }
  // The endpoint reads its source match and stage matches separately. Refuse
  // a structural chain when those snapshots disagree, rather than mixing
  // concurrently modified revisions in an apparently precise projection.
  const matchingSource = stageMatches.filter(m => m.id === match.id);
  if (matchingSource.length !== 1 || matchingSource[0].stageId !== match.stageId ||
      matchingSource[0].revision !== match.revision || matchingSource[0].round !== match.round ||
      matchingSource[0].matchNumber !== match.matchNumber ||
      matchingSource[0].status !== match.status || matchingSource[0].winnerId !== match.winnerId) {
    return unavailable("MATCH_SNAPSHOT_MISMATCH", "Odczyty meczu nie są spójne. Odśwież podgląd po zakończeniu zmian.");
  }
  const sourceRound = stageMatches.filter(m => m.stageId === stage.id && m.round === match.round)
    .sort((a, b) => a.matchNumber - b.matchNumber || a.id - b.id);
  if (sourceRound.some((candidate, index) => candidate.matchNumber !== index + 1)) {
    return unavailable("AMBIGUOUS_SOURCE_ROUND", "Runda źródłowa ma niepełną lub zdublowaną numerację; zależności nie są jednoznaczne.");
  }
  const winnerChanges = preflight.proposedResult.winnerId !== match.winnerId;
  const issues: Array<{ code: string; message: string }> = [];
  const possibleDownstream: Array<{
    matchId: number; round: number; matchNumber: number;
    status: string; relation: "direct_slot" | "possible_later_match"; blocking: boolean;
  }> = [];
  const addIssue = (code: string, message: string) => {
    if (!issues.some(item => item.code === code)) issues.push({ code, message });
  };
  let directSlot: Extract<EliminationBracketImpact, { status: "available" }>["directSlot"] = null;
  let chainComplete = true;
  const maxRoundInData = Math.max(match.round, ...stageMatches.filter(m => m.stageId === stage.id).map(m => m.round));
  const configuredLastRound = stage.totalRounds != null && Number.isSafeInteger(stage.totalRounds)
    ? stage.totalRounds : null;
  const terminalRound = configuredLastRound ?? maxRoundInData;
  if (configuredLastRound != null && configuredLastRound < match.round)
    return unavailable("ROUND_EXCEEDS_STAGE", "Runda meczu jest późniejsza niż deklarowana ostatnia runda etapu.");
  if (configuredLastRound == null && winnerChanges) {
    chainComplete = false;
    addIssue("TOTAL_ROUNDS_UNKNOWN", "Nie potwierdzono liczby rund: zależności są rozpoznane tylko do ostatniej widocznej rundy.");
  }
  const finalRoundWinnerMayChange = winnerChanges && configuredLastRound != null && match.round === configuredLastRound;

  // No structural participant change when only the series score changes.
  if (winnerChanges) {
    let current = match;
    // Do not invent parent matches beyond the configured length, including
    // strange or corrupt stage configurations.
    for (let depth = 0; depth < 16 && current.round < terminalRound; depth++) {
      const nextRound = stageMatches.filter(m => m.stageId === stage.id && m.round === current.round + 1)
        .sort((a, b) => a.matchNumber - b.matchNumber || a.id - b.id);
      const parentIndex = Math.floor((current.matchNumber - 1) / 2);
      if (nextRound.length === 0) {
        chainComplete = false;
        addIssue("PARENT_ROUND_MISSING", `Brak meczów rundy ${current.round + 1}; nie wyznaczono dalszych zależności.`);
        break;
      }
      // revertMatch indexes the next round by position; if match numbers are
      // not contiguous, indexing the array would *pretend* to prove a link.
      if (nextRound.some((candidate, index) => candidate.matchNumber !== index + 1)) {
        chainComplete = false;
        addIssue("AMBIGUOUS_NEXT_ROUND", `Runda ${current.round + 1} ma niepełną lub powieloną numerację meczów.`);
        break;
      }
      const parent = nextRound[parentIndex];
      if (!parent || parent.id === current.id) {
        chainComplete = false;
        addIssue("PARENT_MATCH_MISSING", `Nie można jednoznacznie znaleźć meczu nadrzędnego rundy ${current.round + 1}.`);
        break;
      }
      const isDirect = depth === 0;
      const selectedSlot = current.matchNumber % 2 === 1 ? "player1" : "player2";
      let blocking = parent.status !== "pending" || parent.resultType != null ||
        parent.score1 != null || parent.score2 != null || parent.winnerId != null ||
        parent.resultReason != null || parent.completedAt != null;
      if (isDirect) {
        const currentPlayerId = selectedSlot === "player1" ? parent.player1Id : parent.player2Id;
        const otherPlayerId = selectedSlot === "player1" ? parent.player2Id : parent.player1Id;
        const matchingCurrentWinner = currentPlayerId === match.winnerId && otherPlayerId !== match.winnerId;
        if (!matchingCurrentWinner) {
          blocking = true;
          addIssue("DIRECT_SLOT_MISMATCH", `Obsada miejsca w meczu #${parent.id} nie odpowiada aktualnemu zwycięzcy.`);
        }
        if (otherPlayerId === preflight.proposedResult.winnerId) {
          blocking = true;
          addIssue("DUPLICATE_PARTICIPANT", `Proponowany zwycięzca jest już po drugiej stronie meczu #${parent.id}.`);
        }
        directSlot = {
          matchId: parent.id, round: parent.round, slot: selectedSlot,
          currentPlayerId, hypotheticalPlayerId: preflight.proposedResult.winnerId,
          matchingCurrentWinner, pristine: !blocking,
        };
      }
      if (blocking) {
        addIssue("DOWNSTREAM_MATCH_USED", `Mecz #${parent.id} nie jest w stanie gwarantującym pustą historię rozgrywki.`);
      }
      possibleDownstream.push({
        matchId: parent.id, round: parent.round, matchNumber: parent.matchNumber,
        status: parent.status, relation: isDirect ? "direct_slot" : "possible_later_match", blocking,
      });
      current = parent;
    }
    if (current.round < terminalRound && possibleDownstream.length >= 16) {
      chainComplete = false;
      addIssue("CHAIN_TOO_LONG", "Przekroczono limit analizy 16 rund; pozostałych zależności nie ustalono.");
    }
  }

  return {
    status: "available", stageId: stage.id, stageName: stage.name,
    format: "single_elimination", provisional: true, forecastScope: "structure_only",
    winnerChanges,
    sourceMatch: { matchId: match.id, round: match.round, matchNumber: match.matchNumber },
    directSlot, possibleDownstream, issues, chainComplete, finalRoundWinnerMayChange,
    note: "Wyłącznie strukturalny, hipotetyczny wpływ zmiany zwycięzcy. Można wskazać miejsce w najbliższym meczu, ale NIE można przewidzieć wyników dalszych spotkań ani automatycznie przestawić drabinki. Podgląd nie upoważnia do korekty; ostateczne blokady sprawdza transakcja.",
  };
}
