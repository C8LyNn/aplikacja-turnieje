export interface StageBasketFlowStage {
  id: number;
}

export interface StageBasketFlowBasket {
  id: string;
  stageId: number;
  type: "input" | "output";
  participantIds: readonly number[];
  qualifierCount: number | null;
}

export interface StageBasketFlowRoute {
  sourceBasketId: string;
  targetBasketId: string;
}

export interface StageBasketFlowCounts {
  stageId: number;
  directParticipantCount: number;
  incomingRouteQuota: number;
  derivedParticipantCount: number;
  outputQualifierCount: number;
}

/**
 * Pure planning projection shared by the backend validator/persistence layer
 * and the frontend. Direct assignments are counted once per target stage;
 * every incoming route contributes its source output quota exactly once.
 */
export function deriveStageBasketFlowCounts(
  stages: readonly StageBasketFlowStage[],
  baskets: readonly StageBasketFlowBasket[],
  routes: readonly StageBasketFlowRoute[],
): Map<number, StageBasketFlowCounts> {
  const directPlayerIdsByStage = new Map<number, Set<number>>();
  const incomingRouteQuotaByStage = new Map<number, number>();
  const outputQualifierCountByStage = new Map<number, number>();
  const basketById = new Map(baskets.map((basket) => [basket.id, basket]));

  for (const stage of stages) {
    directPlayerIdsByStage.set(stage.id, new Set<number>());
    incomingRouteQuotaByStage.set(stage.id, 0);
    outputQualifierCountByStage.set(stage.id, 0);
  }
  for (const basket of baskets) {
    if (basket.type === "input") {
      const directPlayerIds = directPlayerIdsByStage.get(basket.stageId);
      if (directPlayerIds) {
        for (const participantId of basket.participantIds) {
          directPlayerIds.add(participantId);
        }
      }
      continue;
    }
    if (
      Number.isInteger(basket.qualifierCount) &&
      (basket.qualifierCount ?? 0) > 0 &&
      outputQualifierCountByStage.has(basket.stageId)
    ) {
      outputQualifierCountByStage.set(
        basket.stageId,
        outputQualifierCountByStage.get(basket.stageId)! +
          basket.qualifierCount!,
      );
    }
  }
  for (const route of routes) {
    const source = basketById.get(route.sourceBasketId);
    const target = basketById.get(route.targetBasketId);
    if (
      source?.type !== "output" ||
      target?.type !== "input" ||
      !Number.isInteger(source.qualifierCount) ||
      (source.qualifierCount ?? 0) < 1 ||
      !incomingRouteQuotaByStage.has(target.stageId)
    ) {
      continue;
    }
    incomingRouteQuotaByStage.set(
      target.stageId,
      incomingRouteQuotaByStage.get(target.stageId)! +
        source.qualifierCount!,
    );
  }

  return new Map(
    stages.map((stage) => {
      const directParticipantCount =
        directPlayerIdsByStage.get(stage.id)?.size ?? 0;
      const incomingRouteQuota =
        incomingRouteQuotaByStage.get(stage.id) ?? 0;
      return [
        stage.id,
        {
          stageId: stage.id,
          directParticipantCount,
          incomingRouteQuota,
          derivedParticipantCount:
            directParticipantCount + incomingRouteQuota,
          outputQualifierCount:
            outputQualifierCountByStage.get(stage.id) ?? 0,
        },
      ];
    }),
  );
}
