import { nextPowerOfTwo, standardBracketSeedOrder } from "../stage-placement";
import type {
  CompiledLogicalMatchV2,
  CompiledParticipantRouteV2,
  CompiledRoutingConditionV2,
  LogicalMatchKeyV2,
  RouteKeyV2,
} from "./compiled-routing-model";
import type {
  StageFormatCompilationContextV2,
  StageFormatEngineV2,
} from "./stage-format-engine";

export type DoubleEliminationBracketV2 =
  | "upper"
  | "lower"
  | "grand_final"
  | "grand_final_reset";

export interface DoubleEliminationLogicalMatchV2 {
  localKey: string;
  bracket: DoubleEliminationBracketV2;
  bracketRound: number;
  matchNumber: number;
  order: number;
}

export interface DoubleEliminationStructureV2 {
  participantCount: number;
  bracketSize: number;
  upperRoundCount: number;
  lowerRoundCount: number;
  matches: readonly DoubleEliminationLogicalMatchV2[];
}

function exactParticipantCount(
  context: Readonly<StageFormatCompilationContextV2>,
): number {
  if (context.stage.capacity.type !== "exact") {
    throw new RangeError("Double elimination requires exact stage capacity.");
  }
  const count = context.stage.capacity.count;
  if (!Number.isInteger(count) || count < 2) {
    throw new RangeError("Double elimination requires at least two participants.");
  }
  return count;
}

function upperKey(round: number, match: number): string {
  return `upper-r${round}-m${match}`;
}

function lowerKey(round: number, match: number): string {
  return `lower-r${round}-m${match}`;
}

export function buildDoubleEliminationStructureV2(
  participantCount: number,
): DoubleEliminationStructureV2 {
  if (!Number.isInteger(participantCount) || participantCount < 2) {
    throw new RangeError("participantCount must be an integer of at least 2.");
  }
  const bracketSize = nextPowerOfTwo(participantCount);
  const upperRoundCount = Math.log2(bracketSize);
  const lowerRoundCount = Math.max(0, 2 * upperRoundCount - 2);
  const matches: DoubleEliminationLogicalMatchV2[] = [];
  let order = 0;

  for (let round = 1; round <= upperRoundCount; round += 1) {
    const count = bracketSize / 2 ** round;
    for (let matchNumber = 1; matchNumber <= count; matchNumber += 1) {
      matches.push({
        localKey: upperKey(round, matchNumber),
        bracket: "upper",
        bracketRound: round,
        matchNumber,
        order: order++,
      });
    }
  }

  for (let round = 1; round <= lowerRoundCount; round += 1) {
    const pairedUpperRound = Math.floor((round + 2) / 2);
    const count = bracketSize / 2 ** pairedUpperRound;
    for (let matchNumber = 1; matchNumber <= count; matchNumber += 1) {
      matches.push({
        localKey: lowerKey(round, matchNumber),
        bracket: "lower",
        bracketRound: round,
        matchNumber,
        order: order++,
      });
    }
  }

  matches.push({
    localKey: "grand-final",
    bracket: "grand_final",
    bracketRound: 1,
    matchNumber: 1,
    order: order++,
  });
  matches.push({
    localKey: "grand-final-reset",
    bracket: "grand_final_reset",
    bracketRound: 1,
    matchNumber: 1,
    order,
  });

  return {
    participantCount,
    bracketSize,
    upperRoundCount,
    lowerRoundCount,
    matches,
  };
}

export const doubleEliminationFormatEngineV2: StageFormatEngineV2 = {
  formatId: "double_elimination",
  rulesVersion: 1,
  compile(context) {
    const participantCount = exactParticipantCount(context);
    const structure = buildDoubleEliminationStructureV2(participantCount);
    const matchKeys = new Map(
      structure.matches.map((match) => [
        match.localKey,
        context.keys.logicalMatch(match.localKey),
      ] as const),
    );
    const logicalMatches: CompiledLogicalMatchV2[] = structure.matches.map(
      (match) => ({
        matchKey: matchKeys.get(match.localKey)!,
        stageKey: context.stageKey,
        name:
          match.bracket === "upper"
            ? `Upper R${match.bracketRound} M${match.matchNumber}`
            : match.bracket === "lower"
              ? `Lower R${match.bracketRound} M${match.matchNumber}`
              : match.bracket === "grand_final"
                ? "Grand Final"
                : "Grand Final Reset",
        order: match.order,
        slots: [1, 2],
      }),
    );
    const routes: CompiledParticipantRouteV2[] = [];
    const always = { type: "always" as const };
    const add = (
      route: Omit<CompiledParticipantRouteV2, "priority" | "order">,
    ): RouteKeyV2 => {
      routes.push({ ...route, priority: 0, order: routes.length });
      return route.routeKey;
    };
    const matchKey = (localKey: string): LogicalMatchKeyV2 => {
      const key = matchKeys.get(localKey);
      if (key == null) throw new Error(`Missing generated match ${localKey}.`);
      return key;
    };
    const outcomeToMatch = (
      localRouteKey: string,
      source: string,
      outcome: "winner" | "loser",
      target: string,
      slot: 1 | 2,
      condition: CompiledRoutingConditionV2 = always,
    ): RouteKeyV2 => add({
      routeKey: context.keys.route(localRouteKey),
      source: {
        type: "match_outcome",
        stageKey: context.stageKey,
        matchKey: matchKey(source),
        outcome,
      },
      target: {
        type: "match_slot",
        stageKey: context.stageKey,
        matchKey: matchKey(target),
        slot,
      },
      reservedSlots: 1,
      condition,
    });

    const firstRoundSeedOrder = standardBracketSeedOrder(structure.bracketSize);
    for (let slotIndex = 0; slotIndex < firstRoundSeedOrder.length; slotIndex += 1) {
      const seed = firstRoundSeedOrder[slotIndex];
      if (seed > participantCount) continue;
      const matchNumber = Math.floor(slotIndex / 2) + 1;
      add({
        routeKey: context.keys.route(`entry-seed-${seed}`),
        source: {
          type: "stage_entry",
          stageKey: context.stageKey,
          entryKey: context.keys.entryPoint("default"),
          position: seed,
        },
        target: {
          type: "match_slot",
          stageKey: context.stageKey,
          matchKey: matchKey(upperKey(1, matchNumber)),
          slot: slotIndex % 2 === 0 ? 1 : 2,
        },
        reservedSlots: 1,
        condition: always,
      });
    }

    for (let round = 2; round <= structure.upperRoundCount; round += 1) {
      const count = structure.bracketSize / 2 ** round;
      for (let targetMatch = 1; targetMatch <= count; targetMatch += 1) {
        outcomeToMatch(
          `upper-r${round - 1}-m${2 * targetMatch - 1}-winner`,
          upperKey(round - 1, 2 * targetMatch - 1),
          "winner",
          upperKey(round, targetMatch),
          1,
        );
        outcomeToMatch(
          `upper-r${round - 1}-m${2 * targetMatch}-winner`,
          upperKey(round - 1, 2 * targetMatch),
          "winner",
          upperKey(round, targetMatch),
          2,
        );
      }
    }

    if (structure.upperRoundCount > 1) {
      const firstLowerCount = structure.bracketSize / 4;
      for (let match = 1; match <= firstLowerCount; match += 1) {
        outcomeToMatch(
          `upper-r1-m${2 * match - 1}-loser`,
          upperKey(1, 2 * match - 1),
          "loser",
          lowerKey(1, match),
          1,
        );
        outcomeToMatch(
          `upper-r1-m${2 * match}-loser`,
          upperKey(1, 2 * match),
          "loser",
          lowerKey(1, match),
          2,
        );
      }

      for (let upperRound = 2; upperRound <= structure.upperRoundCount; upperRound += 1) {
        const injectionRound = 2 * upperRound - 2;
        const injectionCount = structure.bracketSize / 2 ** upperRound;
        if (upperRound > 2) {
          const consolidationRound = injectionRound - 1;
          for (let match = 1; match <= injectionCount; match += 1) {
            outcomeToMatch(
              `lower-r${consolidationRound - 1}-m${2 * match - 1}-winner`,
              lowerKey(consolidationRound - 1, 2 * match - 1),
              "winner",
              lowerKey(consolidationRound, match),
              1,
            );
            outcomeToMatch(
              `lower-r${consolidationRound - 1}-m${2 * match}-winner`,
              lowerKey(consolidationRound - 1, 2 * match),
              "winner",
              lowerKey(consolidationRound, match),
              2,
            );
          }
        }

        const sourceLowerRound = injectionRound - 1;
        for (let match = 1; match <= injectionCount; match += 1) {
          outcomeToMatch(
            `lower-r${sourceLowerRound}-m${match}-winner`,
            lowerKey(sourceLowerRound, match),
            "winner",
            lowerKey(injectionRound, match),
            1,
          );
          const upperLoserMatch = injectionCount - match + 1;
          outcomeToMatch(
            `upper-r${upperRound}-m${upperLoserMatch}-loser`,
            upperKey(upperRound, upperLoserMatch),
            "loser",
            lowerKey(injectionRound, match),
            2,
          );
        }
      }
    }

    const upperFinal = upperKey(structure.upperRoundCount, 1);
    outcomeToMatch(
      "upper-winner-to-grand-final",
      upperFinal,
      "winner",
      "grand-final",
      1,
    );
    const lowerToGrand = structure.lowerRoundCount === 0
      ? outcomeToMatch(
          "upper-loser-to-grand-final",
          upperFinal,
          "loser",
          "grand-final",
          2,
        )
      : outcomeToMatch(
          "lower-winner-to-grand-final",
          lowerKey(structure.lowerRoundCount, 1),
          "winner",
          "grand-final",
          2,
        );

    outcomeToMatch(
      "grand-final-winner-to-reset",
      "grand-final",
      "winner",
      "grand-final-reset",
      1,
    );
    outcomeToMatch(
      "grand-final-loser-to-reset-if-needed",
      "grand-final",
      "loser",
      "grand-final-reset",
      2,
      {
        type: "match_winner_lineage",
        matchKey: matchKey("grand-final"),
        lineage: { type: "route", routeKey: lowerToGrand },
      },
    );

    const champion = context.keys.output("champion");
    add({
      routeKey: context.keys.route("grand-final-reset-winner-to-champion"),
      source: {
        type: "match_outcome",
        stageKey: context.stageKey,
        matchKey: matchKey("grand-final-reset"),
        outcome: "winner",
      },
      target: {
        type: "stage_output",
        stageKey: context.stageKey,
        outputKey: champion,
      },
      reservedSlots: 1,
      condition: always,
    });

    return {
      logicalMatches,
      outputs: [
        {
          stageKey: context.stageKey,
          outputKey: champion,
          name: "Champion",
          exactCapacity: 1,
          priority: 0,
        },
      ],
      routes,
    };
  },
};
