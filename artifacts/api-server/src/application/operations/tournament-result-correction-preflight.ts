/**
 * Pack 08: conservative, PURE, read-only impact preview for a proposed score correction.
 * A preview is never permission to revert/complete a match. Real mutations must repeat
 * all transactional guards in revertMatch/completeMatch and their authorization checks.
 */
export type StageFormat = "single_elimination" | "double_elimination" | "swiss" | "round_robin" | "group_stage";
export type StageStatus = "planned" | "active" | "completed";
export interface CorrectionStage { id: number; position: number; name: string; format: StageFormat; status: StageStatus; currentRound: number | null; totalRounds: number | null; }
export interface CorrectionMatch {
  id: number; stageId: number; round: number; matchNumber: number; status: string;
  revision: number; resultType: string | null; resultReason: string | null;
  player1Id: number | null; player2Id: number | null; winnerId: number | null;
  score1: number | null; score2: number | null; bestOf: number;
  completedAt: Date | string | null;
}
export interface CorrectionIssue { code: string; severity: "block" | "review"; message: string; }
export interface CorrectionEffect { code: string; certainty: "confirmed" | "conditional"; message: string; }
export interface CorrectionPreviewInput {
  tournament: { status: string; winnerId: number | null };
  match: CorrectionMatch;
  stages: readonly CorrectionStage[];
  stageMatches: readonly CorrectionMatch[];
  nextStageMatches: readonly { id: number }[];
  approvedQualification: boolean;
  materializedRoute: boolean;
  latestHistoryMatches: boolean;
  activeCompletionActions: number;
  expectedRevision: number;
  proposedScore1: number;
  proposedScore2: number;
}
export interface CorrectionPreview {
  version: 1;
  advisory: true;
  mutationPerformed: false;
  previewIsAuthorization: false;
  requiresTransactionalRecheck: true;
  state: "blocked" | "requires_review";
  matchId: number;
  expectedRevision: number;
  stageName: string | null;
  existingResult: { score1: number | null; score2: number | null; winnerId: number | null };
  proposedResult: { score1: number; score2: number; winnerId: number | null; winnerChanges: boolean | null };
  issues: CorrectionIssue[];
  effects: CorrectionEffect[];
  downstreamMatchIds: number[];
  recommendedAction: string;
}

export function deriveResultCorrectionPreflight(input: CorrectionPreviewInput): CorrectionPreview {
  const { match, stages, tournament, expectedRevision, proposedScore1, proposedScore2 } = input;
  const currentStage = stages.find(s => s.id === match.stageId);
  const nextStage = currentStage ? stages.find(s => s.position === currentStage.position + 1) : undefined;
  const issues: CorrectionIssue[] = [];
  const effects: CorrectionEffect[] = [];
  const downstreamMatchIds: number[] = [];
  const block = (code: string, message: string) => issues.push({ code, severity: "block", message });
  const review = (code: string, message: string) => issues.push({ code, severity: "review", message });
  const effect = (code: string, certainty: "confirmed" | "conditional", message: string) => effects.push({ code, certainty, message });

  let proposedWinnerId: number | null = null;
  const winTarget = Math.floor(match.bestOf / 2) + 1;
  const validProposedScore = Number.isSafeInteger(proposedScore1) && Number.isSafeInteger(proposedScore2)
    && proposedScore1 >= 0 && proposedScore2 >= 0
    && Number.isSafeInteger(match.bestOf) && match.bestOf > 0 && match.bestOf % 2 === 1
    && proposedScore1 <= winTarget && proposedScore2 <= winTarget
    && ((proposedScore1 === winTarget) !== (proposedScore2 === winTarget));
  if (!validProposedScore) block("INVALID_PROPOSED_RESULT", `Wynik musi rozstrzygać serię BO${match.bestOf} zgodnie z aktualnymi zasadami.`);
  else proposedWinnerId = proposedScore1 === winTarget ? match.player1Id : match.player2Id;

  if (!currentStage) block("STAGE_NOT_FOUND", "Nie znaleziono etapu meczu.");
  if (match.status !== "completed") block("MATCH_NOT_COMPLETED", "Tylko zakończony mecz można cofnąć w standardowej procedurze.");
  if (match.resultType === "bye") block("SYSTEM_BYE_REVERT_BLOCKED", "Systemowego BYE nie można cofnąć ręcznie.");
  else if (match.resultType !== "played") block("RESULT_TYPE_REQUIRES_MANUAL_REVIEW", "Ten podgląd obsługuje korektę punktowego wyniku zagranego meczu.");
  if (match.player1Id == null || match.player2Id == null || match.player1Id === match.player2Id)
    block("PARTICIPANTS_INVALID", "Nie można jednoznacznie ustalić uczestników meczu.");
  if (match.resultType === "played") {
    if (match.completedAt == null || match.score1 == null || match.score2 == null
      || (match.winnerId !== match.player1Id && match.winnerId !== match.player2Id))
      block("RESULT_INCONSISTENT", "Zapisany wynik jest niekompletny lub niespójny.");
    else if (match.score1 !== winTarget && match.score2 !== winTarget)
      block("RESULT_INCONSISTENT", "Zapisany wynik nie spełnia zasad serii.");
    else if (match.winnerId !== (match.score1 === winTarget ? match.player1Id : match.player2Id))
      block("RESULT_INCONSISTENT", "Zapisany zwycięzca nie odpowiada punktom.");
    if (match.resultReason != null) block("RESULT_INCONSISTENT", "Zapisany mecz punktowy ma niespodziewany powód rozstrzygnięcia.");
  }
  if (!Number.isSafeInteger(expectedRevision) || match.revision !== expectedRevision)
    block("STALE_MATCH_REVISION", "Wersja meczu zmieniła się. Pobierz aktualny wynik przed kolejnym podglądem.");
  if (!input.latestHistoryMatches) block("HISTORY_NOT_VERIFIED", "Nie potwierdzono zgodności ostatniego wpisu historii z aktualnym meczem.");
  if (input.activeCompletionActions !== 1) block("COMPLETION_ACTION_NOT_UNAMBIGUOUS", "Nie udało się wskazać dokładnie jednej aktywnej akcji zatwierdzenia wyniku.");

  if (currentStage) {
    if (stages.some(s => s.position > currentStage.position && s.status !== "planned"))
      block("STAGE_ALREADY_ADVANCED", "Późniejszy etap został rozpoczęty lub zakończony.");
    if (input.approvedQualification || input.materializedRoute)
      block("STAGE_QUALIFICATION_ALREADY_COMMITTED", "Kwalifikacja jest już zatwierdzona albo uczestnicy zostali przekazani do następnego etapu.");
    if (currentStage.status === "completed" && nextStage && input.nextStageMatches.length > 0)
      block("STAGE_ALREADY_ADVANCED", "Dla następnego etapu wygenerowano już mecze.");

    if (currentStage.format === "swiss") {
      const generatedLater = input.stageMatches.filter(m => m.round > match.round);
      if (generatedLater.length > 0 || (currentStage.currentRound ?? 0) > match.round) {
        downstreamMatchIds.push(...generatedLater.map(m => m.id));
        block("DOWNSTREAM_SWISS_PAIRINGS", "Utworzono późniejsze parowania Swiss; standardowe cofnięcie wyniku jest blokowane.");
      }
      effect("SWISS_STANDINGS", "conditional", "Zmiana punktów może zmienić ranking i przyszłe parowania Swiss.");
    } else if (currentStage.format === "single_elimination" && match.winnerId != null) {
      const nextMatches = input.stageMatches.filter(m => m.round === match.round + 1)
        .sort((a, b) => a.matchNumber - b.matchNumber);
      const expected = nextMatches[Math.floor((match.matchNumber - 1) / 2)];
      if (!expected && match.round < (currentStage.totalRounds ?? match.round))
        block("DOWNSTREAM_MATCH_MISSING", "Brakuje oczekiwanego meczu następnej rundy.");
      if (expected) {
        downstreamMatchIds.push(expected.id);
        const slot = (match.matchNumber - 1) % 2 === 0 ? "player1Id" : "player2Id";
        const otherSlot = slot === "player1Id" ? "player2Id" : "player1Id";
        const pristine = expected.status === "pending" && expected.resultType == null
          && expected.score1 == null && expected.score2 == null && expected.winnerId == null
          && expected.resultReason == null && expected.completedAt == null;
        if (!pristine || expected[slot] !== match.winnerId || expected[otherSlot] === match.winnerId)
          block("DOWNSTREAM_MATCH_ALREADY_USED", `Mecz #${expected.id} kolejnej rundy ma już zmieniony stan lub niezgodne obsadzenie.`);
        else effect("DOWNSTREAM_SLOT", "confirmed", `Standardowe cofnięcie wyniku usunie zwycięzcę z miejsca w meczu #${expected.id}.`);
      }
      if (proposedWinnerId != null && proposedWinnerId !== match.winnerId)
        effect("BRACKET_WINNER_CHANGE", "conditional", "Nowy zwycięzca może zmienić przebieg dalszej drabinki. Nie tworzymy nowych par w podglądzie.");
    } else if (currentStage.format === "double_elimination") {
      review("DE_RUNTIME_REQUIRES_REVALIDATION", "Drabinka DE ma dodatkowe zależności w stanie routingu; tylko transakcyjny silnik może je wiarygodnie ocenić.");
      effect("DE_ROUTING", "conditional", "Zmiana może wpływać na ścieżki winner/loser bracket i ewentualny reset finału.");
    } else {
      effect("RANKING_RECALCULATION", "conditional", "Po zapisaniu korekty trzeba ponownie obliczyć tabelę lub klasyfikację.");
    }
    if (currentStage.status === "completed")
      effect("STAGE_REOPEN", "conditional", "Cofnięcie wyniku może wymagać ponownego otwarcia zakończonego etapu.");
  }
  if (tournament.status === "completed")
    effect("TOURNAMENT_REOPEN", "conditional", "Wymagana może być zmiana statusu zakończonego turnieju i zwycięzcy.");
  const winnerChanges = validProposedScore && proposedWinnerId != null && match.winnerId != null
    ? proposedWinnerId !== match.winnerId : null;
  if (winnerChanges === true)
    effect("WINNER_CHANGE", "confirmed", "Zaproponowany wynik wskazuje innego zwycięzcę tego meczu.");
  else if (winnerChanges === false && validProposedScore)
    effect("SAME_WINNER", "confirmed", "Zaproponowany wynik nie zmienia zwycięzcy tego meczu (może jednak zmienić statystyki).");
  effect("TWO_STEP_CORRECTION", "confirmed", "Zmiana wymaga osobnego, autoryzowanego cofnięcia i ponownego zapisu wyniku. Ten podgląd niczego nie zapisuje.");
  const blocked = issues.some(i => i.severity === "block");
  return {
    version: 1, advisory: true, mutationPerformed: false, previewIsAuthorization: false,
    requiresTransactionalRecheck: true, state: blocked ? "blocked" : "requires_review",
    matchId: match.id, expectedRevision, stageName: currentStage?.name ?? null,
    existingResult: { score1: match.score1, score2: match.score2, winnerId: match.winnerId },
    proposedResult: { score1: proposedScore1, score2: proposedScore2, winnerId: proposedWinnerId, winnerChanges },
    issues, effects, downstreamMatchIds: [...new Set(downstreamMatchIds)].sort((a, b) => a - b),
    recommendedAction: blocked
      ? "Nie cofaj wyniku zwykłym mechanizmem. Rozwiąż wskazane blokady; istniejący backend ponownie sprawdzi warunki."
      : "Sprawdź konsekwencje z organizatorem. Jeśli są akceptowalne, użyj istniejącej korekty meczu; backend jeszcze raz zweryfikuje stan i uprawnienia.",
  };
}
