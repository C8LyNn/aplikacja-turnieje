export type GroupKey = "A" | "B" | "C" | "D";
export type GroupRank = 1 | 2;
export type GroupPlayoffSlotSide = "player1" | "player2";

export interface GroupPlayoffSource {
  groupKey: GroupKey;
  groupRank: GroupRank;
}

export interface GroupPlayoffSlot {
  matchPosition: number;
  side: GroupPlayoffSlotSide;
  source: GroupPlayoffSource;
}

export interface BuildGroupPlayoffSlotsInput {
  groupCount: number;
  qualifiersPerGroup: number;
}

export interface UnsupportedGroupPlayoffVariantError {
  code: "UNSUPPORTED_GROUP_PLAYOFF_VARIANT";
  message: string;
}

export type BuildGroupPlayoffSlotsResult =
  | { ok: true; slots: GroupPlayoffSlot[] }
  | { ok: false; error: UnsupportedGroupPlayoffVariantError };

type MatchSources = readonly [GroupPlayoffSource, GroupPlayoffSource];

const source = (groupKey: GroupKey, groupRank: GroupRank): GroupPlayoffSource => ({
  groupKey,
  groupRank,
});

const GROUP_PLAYOFF_VARIANTS: Readonly<Record<string, readonly MatchSources[]>> = {
  "2:1": [[source("A", 1), source("B", 1)]],
  "2:2": [
    [source("A", 1), source("B", 2)],
    [source("B", 1), source("A", 2)],
  ],
  "4:1": [
    [source("A", 1), source("B", 1)],
    [source("C", 1), source("D", 1)],
  ],
  "4:2": [
    [source("A", 1), source("B", 2)],
    [source("C", 1), source("D", 2)],
    [source("B", 1), source("A", 2)],
    [source("D", 1), source("C", 2)],
  ],
};

export function isSupportedGroupPlayoffVariant(
  groupCount: number,
  qualifiersPerGroup: number,
): boolean {
  return GROUP_PLAYOFF_VARIANTS[`${groupCount}:${qualifiersPerGroup}`] != null;
}

export function buildGroupPlayoffSlots(
  input: BuildGroupPlayoffSlotsInput,
): BuildGroupPlayoffSlotsResult {
  const matches = GROUP_PLAYOFF_VARIANTS[`${input.groupCount}:${input.qualifiersPerGroup}`];
  if (!matches) {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_GROUP_PLAYOFF_VARIANT",
        message: "Only 2 or 4 equal groups with 1 or 2 qualifiers per group are supported.",
      },
    };
  }

  const slots = matches.flatMap<GroupPlayoffSlot>((match, index) => [
    {
      matchPosition: index + 1,
      side: "player1",
      source: { ...match[0] },
    },
    {
      matchPosition: index + 1,
      side: "player2",
      source: { ...match[1] },
    },
  ]);

  return { ok: true, slots };
}
