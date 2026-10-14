import type { TournamentBackupV3 } from "@workspace/api-zod";

/**
 * WEB-005-T060-B1 — semantic cross-record checks for Phase 2/3 Backup V3.
 *
 * Pure and deterministic: runs before importBackupV3 opens its clone transaction.
 * The persisted schema and older V3 documents without Phase 2/3 runtime data
 * remain unchanged. Qualification capacity of an unexecuted route is purposely
 * not inferred (historical underfill policy is outside B1).
 */
export function validateBackupV3FlowIntegrity(backup: TournamentBackupV3): string[] {
  const errors: string[] = [];
  const baskets = new Map((backup.stageBaskets ?? []).map(basket => [basket.id, basket]));
  const routes = new Map((backup.stageBasketRoutes ?? []).map(route => [route.id, route]));
  const stageMembers = new Set(
    backup.stageParticipants.map(member => member.stageBackupId + ":" + member.playerBackupId),
  );
  const proposalByStage = new Map<
    number, NonNullable<TournamentBackupV3["qualificationProposals"]>[number]
  >();

  // QP -> QPE -> OP must be a bijection for approved proposals.
  for (const proposal of backup.qualificationProposals ?? []) {
    if (proposalByStage.has(proposal.stageBackupId)) {
      errors.push("B1: duplicate qualification proposal for stage " + proposal.stageBackupId);
    }
    proposalByStage.set(proposal.stageBackupId, proposal);

    const expected = new Map<string, number>();
    const actual = new Map<string, number>();
    const proposalPlayers = new Set<number>();
    const proposalRanks = new Set<number>();
    const basketPositions = new Set<string>();

    for (const entry of proposal.entries) {
      const basket = baskets.get(entry.basketId);
      if (!basket || basket.type !== "output" || basket.stageBackupId !== proposal.stageBackupId) {
        errors.push("B1: qualification entry references foreign/non-output basket " + entry.basketId);
      }
      if (!stageMembers.has(proposal.stageBackupId + ":" + entry.playerBackupId)) {
        errors.push("B1: qualification entry player is not a source stage member " + entry.playerBackupId);
      }
      if (proposalPlayers.has(entry.playerBackupId)) {
        errors.push("B1: duplicate qualification player in stage " + proposal.stageBackupId);
      }
      proposalPlayers.add(entry.playerBackupId);
      if (proposalRanks.has(entry.placementRank)) {
        errors.push("B1: duplicate qualification placement rank in stage " + proposal.stageBackupId);
      }
      proposalRanks.add(entry.placementRank);
      const positionKey = entry.basketId + ":" + entry.basketPosition;
      if (basketPositions.has(positionKey)) {
        errors.push("B1: duplicate qualification basket position " + positionKey);
      }
      basketPositions.add(positionKey);
      const key = entry.basketId + ":" + entry.playerBackupId + ":" + entry.placementRank;
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }

    if (proposal.status !== "approved" && (proposal.output?.length ?? 0) > 0) {
      errors.push("B1: pending qualification proposal contains materialised output for stage " + proposal.stageBackupId);
    }

    for (const output of proposal.output ?? []) {
      const basket = baskets.get(output.basketId);
      if (!basket || basket.type !== "output" || basket.stageBackupId !== proposal.stageBackupId) {
        errors.push("B1: materialised output references foreign/non-output basket " + output.basketId);
      }
      if (!stageMembers.has(proposal.stageBackupId + ":" + output.playerBackupId)) {
        errors.push("B1: output player is not a source stage member " + output.playerBackupId);
      }
      const key = output.basketId + ":" + output.playerBackupId + ":" + output.finalRank;
      actual.set(key, (actual.get(key) ?? 0) + 1);
    }

    if (proposal.status === "approved") {
      if (proposal.entries.length !== (proposal.output?.length ?? 0)) {
        errors.push("B1: approved proposal output count differs from entry count for stage " + proposal.stageBackupId);
      }
      for (const [key, count] of expected) {
        if (actual.get(key) !== count) {
          errors.push("B1: approved proposal missing/mismatched output " + key);
        }
      }
      for (const [key, count] of actual) {
        if (expected.get(key) !== count) {
          errors.push("B1: approved proposal contains orphaned output " + key);
        }
      }
    }
  }

  // A configured-but-unexecuted route is valid; an execution is an immutable
  // receipt and must be backed by all, and only, the source basket outputs.
  const seenExecutions = new Set<string>();
  const seenArrivals = new Set<string>();
  for (const execution of backup.routeExecutions ?? []) {
    const route = routes.get(execution.routeId);
    if (seenExecutions.has(execution.routeId)) {
      errors.push("B1: duplicate route execution " + execution.routeId);
    }
    seenExecutions.add(execution.routeId);
    if (!route) {
      errors.push("B1: orphaned route execution " + execution.routeId);
      continue;
    }
    if (route.sourceBasketId !== execution.sourceBasketId ||
        route.targetBasketId !== execution.targetBasketId) {
      errors.push("B1: execution route topology differs from configured route " + execution.routeId);
    }
    const source = baskets.get(execution.sourceBasketId);
    const target = baskets.get(execution.targetBasketId);
    if (!source || source.type !== "output" || !target || target.type !== "input") {
      errors.push("B1: execution has invalid source/target basket types " + execution.routeId);
      continue;
    }
    const proposal = proposalByStage.get(source.stageBackupId);
    if (!proposal || proposal.status !== "approved") {
      errors.push("B1: route source lacks an approved proposal " + execution.routeId);
      continue;
    }
    if (proposal.revision !== execution.sourceProposalRevision) {
      errors.push("B1: execution proposal revision mismatch " + execution.routeId);
    }
    const sourceOutputs = (proposal.output ?? []).filter(output => output.basketId === source.id);
    const expected = new Map<string, number>();
    const actual = new Map<string, number>();
    for (const output of sourceOutputs) {
      const key = output.playerBackupId + ":" + output.finalRank;
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }
    if (sourceOutputs.length === 0 || sourceOutputs.length !== execution.entries.length) {
      errors.push("B1: route arrival count differs from materialised output " + execution.routeId);
    }
    // A route execution path currently checks qualifierCount; do not retroactively
    // impose a new underfill policy on approved but never-executed proposals.
    if (source.qualifierCount != null && sourceOutputs.length !== source.qualifierCount) {
      errors.push("B1: executed source basket qualifierCount mismatch " + execution.routeId);
    }
    for (const entry of execution.entries) {
      if (entry.sourceBasketId !== execution.sourceBasketId) {
        errors.push("B1: arrival source basket differs from receipt " + execution.routeId);
      }
      const key = entry.playerBackupId + ":" + entry.sourceFinalRank;
      actual.set(key, (actual.get(key) ?? 0) + 1);
      const arrivalKey = target.stageBackupId + ":" + entry.playerBackupId;
      if (seenArrivals.has(arrivalKey)) {
        errors.push("B1: duplicate target-stage routed arrival " + arrivalKey);
      }
      seenArrivals.add(arrivalKey);
      if (!stageMembers.has(source.stageBackupId + ":" + entry.playerBackupId)) {
        errors.push("B1: arrival player not a source stage member " + entry.playerBackupId);
      }
    }
    for (const [key, count] of expected) {
      if (actual.get(key) !== count) {
        errors.push("B1: missing/mismatched route arrival " + execution.routeId + "/" + key);
      }
    }
    for (const [key, count] of actual) {
      if (expected.get(key) !== count) {
        errors.push("B1: orphaned route arrival " + execution.routeId + "/" + key);
      }
    }
  }

  return [...new Set(errors)];
}
