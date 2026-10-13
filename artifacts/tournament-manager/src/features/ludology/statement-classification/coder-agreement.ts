import type { Coder, CodingRecord, DirectionScore } from "./model";

export type CoderDisagreement = {
  excerptId: string;
  propositionId: string;
  coderADirection: DirectionScore | null;
  coderBDirection: DirectionScore | null;
  coderARationale?: string;
  coderBRationale?: string;
  kind: "direction" | "missing_vs_scored";
};

export type CoderAgreementPair = {
  coderAId: string;
  coderBId: string;
  coderALabel: string;
  coderBLabel: string;
  coderAUnits: number;
  coderBUnits: number;
  overlap: number;
  exactDirectionMatches: number;
  exactDirectionAgreement: number | null;
  ratedOverlap: number;
  ratedExactMatches: number;
  ratedExactAgreement: number | null;
  bothNotApplicable: number;
  missingVsScored: number;
  duplicateUnitsExcluded: number;
  linearWeightedKappa: number | null;
  disagreements: CoderDisagreement[];
};

const DIRECTIONS = [-2, -1, 0, 1, 2] as const;

function codingUnits(codings: readonly CodingRecord[], coderId: string) {
  const units = new Map<string, CodingRecord[]>();
  for (const coding of codings) {
    if (coding.coderId !== coderId) continue;
    // Array serialization prevents collisions between user-defined identifiers.
    const key = JSON.stringify([coding.excerptId, coding.propositionId]);
    const records = units.get(key) ?? [];
    records.push(coding);
    units.set(key, records);
  }
  return units;
}

/**
 * Linear-weighted Cohen's kappa for the ordinal scale -2..+2.
 * N/A is not an ordinal category and must not enter this calculation.
 * Null means undefined (too few jointly rated units or no expected variance).
 */
function weightedKappa(ratedPairs: ReadonlyArray<readonly [DirectionScore, DirectionScore]>): number | null {
  const n = ratedPairs.length;
  if (n < 2) return null;
  const countsA = new Array<number>(5).fill(0);
  const countsB = new Array<number>(5).fill(0);
  let observedWeightedSum = 0;

  for (const [a, b] of ratedPairs) {
    countsA[a + 2] += 1;
    countsB[b + 2] += 1;
    observedWeightedSum += 1 - Math.abs(a - b) / 4;
  }

  const observed = observedWeightedSum / n;
  let expected = 0;
  for (let a = 0; a < DIRECTIONS.length; a += 1) {
    for (let b = 0; b < DIRECTIONS.length; b += 1) {
      expected += (countsA[a] / n) * (countsB[b] / n) * (1 - Math.abs(a - b) / 4);
    }
  }
  if (1 - expected < 1e-12) return null;
  return Math.max(-1, Math.min(1, (observed - expected) / (1 - expected)));
}

export function computeCoderAgreementPairs(
  codings: readonly CodingRecord[],
  coders: readonly Coder[],
  codebookId: string,
): CoderAgreementPair[] {
  const relevant = codings.filter((coding) => coding.codebookId === codebookId);
  const pairs: CoderAgreementPair[] = [];

  for (let aIndex = 0; aIndex < coders.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < coders.length; bIndex += 1) {
      const coderA = coders[aIndex];
      const coderB = coders[bIndex];
      if (!coderA || !coderB) continue;

      const aByUnit = codingUnits(relevant, coderA.id);
      const bByUnit = codingUnits(relevant, coderB.id);
      const ratedPairs: Array<readonly [DirectionScore, DirectionScore]> = [];
      const disagreements: CoderDisagreement[] = [];
      let overlap = 0;
      let exactDirectionMatches = 0;
      let ratedExactMatches = 0;
      let bothNotApplicable = 0;
      let missingVsScored = 0;
      let duplicateUnitsExcluded = 0;

      for (const [key, aRecords] of aByUnit) {
        const bRecords = bByUnit.get(key);
        if (!bRecords) continue;
        // Do not silently choose one of multiple contradictory records.
        if (aRecords.length !== 1 || bRecords.length !== 1) {
          duplicateUnitsExcluded += 1;
          continue;
        }
        const aCoding = aRecords[0];
        const bCoding = bRecords[0];
        if (!aCoding || !bCoding) continue;
        overlap += 1;
        if (aCoding.direction === bCoding.direction) exactDirectionMatches += 1;
        if (aCoding.direction === null && bCoding.direction === null) {
          bothNotApplicable += 1;
        } else if (aCoding.direction === null || bCoding.direction === null) {
          missingVsScored += 1;
        } else {
          ratedPairs.push([aCoding.direction, bCoding.direction]);
          if (aCoding.direction === bCoding.direction) ratedExactMatches += 1;
        }
        if (aCoding.direction !== bCoding.direction) {
          disagreements.push({
            excerptId: aCoding.excerptId,
            propositionId: aCoding.propositionId,
            coderADirection: aCoding.direction,
            coderBDirection: bCoding.direction,
            coderARationale: aCoding.rationale,
            coderBRationale: bCoding.rationale,
            kind: aCoding.direction === null || bCoding.direction === null ? "missing_vs_scored" : "direction",
          });
        }
      }

      pairs.push({
        coderAId: coderA.id,
        coderBId: coderB.id,
        coderALabel: coderA.displayName,
        coderBLabel: coderB.displayName,
        coderAUnits: aByUnit.size,
        coderBUnits: bByUnit.size,
        overlap,
        exactDirectionMatches,
        exactDirectionAgreement: overlap ? exactDirectionMatches / overlap : null,
        ratedOverlap: ratedPairs.length,
        ratedExactMatches,
        ratedExactAgreement: ratedPairs.length ? ratedExactMatches / ratedPairs.length : null,
        bothNotApplicable,
        missingVsScored,
        duplicateUnitsExcluded,
        linearWeightedKappa: weightedKappa(ratedPairs),
        disagreements,
      });
    }
  }
  return pairs;
}
