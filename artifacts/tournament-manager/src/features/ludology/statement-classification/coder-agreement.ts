import type { Coder, CodingRecord } from "./model";

export type CoderAgreementPair = {
  coderAId: string;
  coderBId: string;
  coderALabel: string;
  coderBLabel: string;
  overlap: number;
  exactDirectionMatches: number;
  exactDirectionAgreement: number | null;
};

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

      const aByUnit = new Map(
        relevant
          .filter((coding) => coding.coderId === coderA.id)
          .map((coding) => [`${coding.excerptId}::${coding.propositionId}`, coding] as const),
      );
      const bByUnit = new Map(
        relevant
          .filter((coding) => coding.coderId === coderB.id)
          .map((coding) => [`${coding.excerptId}::${coding.propositionId}`, coding] as const),
      );

      let overlap = 0;
      let exactDirectionMatches = 0;
      for (const [key, aCoding] of aByUnit) {
        const bCoding = bByUnit.get(key);
        if (!bCoding) continue;
        overlap += 1;
        if (aCoding.direction === bCoding.direction) exactDirectionMatches += 1;
      }

      pairs.push({
        coderAId: coderA.id,
        coderBId: coderB.id,
        coderALabel: coderA.displayName,
        coderBLabel: coderB.displayName,
        overlap,
        exactDirectionMatches,
        exactDirectionAgreement: overlap > 0 ? exactDirectionMatches / overlap : null,
      });
    }
  }

  return pairs;
}
