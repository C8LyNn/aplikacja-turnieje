export type SeedValue = number | string | null | undefined;

export interface SeedableEntry {
  participantKey: string;
  displayName?: string | null;
  registrationOrder?: number | null;
  previousSeed?: number | null;
  manualSeed?: number | null;
  rankBand?: number | null;
  metrics?: Readonly<Record<string, SeedValue>>;
}

export type SeedingCriterionField =
  | "registration_order"
  | "alphabetical"
  | "previous_seed"
  | "manual_seed"
  | `metric:${string}`;

export interface SeedingCriterion {
  field: SeedingCriterionField;
  direction: "ascending" | "descending";
  /** Missing values are always placed last unless explicitly requested otherwise. */
  nulls?: "first" | "last";
}

export type SeedingPolicy =
  | { type: "registration_order" }
  | { type: "alphabetical"; locale?: string }
  | { type: "preserve" }
  | { type: "manual" }
  | {
      type: "random";
      randomSeed: string;
      /** participant_order matches a live wheel: each listed participant draws one remaining seed. */
      revealOrder?: "participant_order" | "seed_order";
    }
  | {
      type: "ordered_criteria";
      criteria: readonly SeedingCriterion[];
      randomSeed?: string;
    }
  | {
      type: "rank_bands";
      withinBand: readonly SeedingCriterion[];
      randomSeed?: string;
    };

export interface SeededEntry<T extends SeedableEntry> {
  entry: T;
  seed: number;
}

export type SeedingProblemCode =
  | "EMPTY_PARTICIPANTS"
  | "DUPLICATE_PARTICIPANT_KEY"
  | "INVALID_REGISTRATION_ORDER"
  | "INVALID_PREVIOUS_SEED"
  | "INVALID_MANUAL_SEED"
  | "INVALID_RANK_BAND"
  | "INVALID_RANDOM_SEED"
  | "EMPTY_CRITERIA"
  | "UNKNOWN_METRIC"
  | "INCOMPARABLE_METRIC";

export interface SeedingProblem {
  code: SeedingProblemCode;
  participantKey?: string;
  field?: string;
  message: string;
}

export type SeedingResult<T extends SeedableEntry> =
  | {
      ok: true;
      seeded: Array<SeededEntry<T>>;
      audit: {
        policyType: SeedingPolicy["type"];
        randomSeed: string | null;
        participantOrder: string[];
        draws: Array<{ drawNumber: number; participantKey: string; seed: number }>;
      };
    }
  | { ok: false; problems: SeedingProblem[] };

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateUniqueKeys(entries: readonly SeedableEntry[]): SeedingProblem[] {
  if (entries.length === 0) {
    return [{ code: "EMPTY_PARTICIPANTS", message: "At least one participant is required." }];
  }
  const seen = new Set<string>();
  const problems: SeedingProblem[] = [];
  for (const entry of entries) {
    if (!nonEmptyString(entry.participantKey) || seen.has(entry.participantKey)) {
      problems.push({
        code: "DUPLICATE_PARTICIPANT_KEY",
        participantKey: entry.participantKey,
        field: "participantKey",
        message: "participantKey must be non-empty and unique.",
      });
    }
    seen.add(entry.participantKey);
  }
  return problems;
}

function validatePermutation(
  entries: readonly SeedableEntry[],
  value: (entry: SeedableEntry) => number | null | undefined,
  code: "INVALID_PREVIOUS_SEED" | "INVALID_MANUAL_SEED",
  field: "previousSeed" | "manualSeed",
): SeedingProblem[] {
  const values = entries.map(value);
  const expected = new Set(Array.from({ length: entries.length }, (_, index) => index + 1));
  if (values.every((candidate) => positiveInteger(candidate)) && new Set(values).size === entries.length) {
    for (const candidate of values) expected.delete(candidate as number);
    if (expected.size === 0) return [];
  }
  return [{
    code,
    field,
    message: `${field} values must form a unique, contiguous permutation from 1 to ${entries.length}.`,
  }];
}

/** FNV-1a followed by Mulberry32: deterministic and portable, not cryptographic. */
function randomGenerator(seed: string): () => number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(values: readonly T[], randomSeed: string): T[] {
  if (!nonEmptyString(randomSeed)) {
    throw new RangeError("randomSeed must be a non-empty string.");
  }
  const shuffled = [...values];
  const random = randomGenerator(randomSeed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function criterionValue(entry: SeedableEntry, field: SeedingCriterionField): SeedValue {
  switch (field) {
    case "registration_order":
      return entry.registrationOrder;
    case "alphabetical":
      return entry.displayName ?? entry.participantKey;
    case "previous_seed":
      return entry.previousSeed;
    case "manual_seed":
      return entry.manualSeed;
    default:
      return entry.metrics?.[field.slice("metric:".length)];
  }
}

function compareValues(
  left: SeedValue,
  right: SeedValue,
  criterion: SeedingCriterion,
  locale: string,
): number {
  const leftMissing = left == null;
  const rightMissing = right == null;
  if (leftMissing || rightMissing) {
    if (leftMissing && rightMissing) return 0;
    const missingFirst = criterion.nulls === "first";
    return leftMissing === missingFirst ? -1 : 1;
  }

  let comparison: number;
  if (typeof left === "number" && typeof right === "number") {
    comparison = left - right;
  } else if (typeof left === "string" && typeof right === "string") {
    comparison = left.localeCompare(right, locale, { sensitivity: "base", numeric: true });
  } else {
    return 0;
  }
  return criterion.direction === "ascending" ? comparison : -comparison;
}

function validateCriteria(
  entries: readonly SeedableEntry[],
  criteria: readonly SeedingCriterion[],
): SeedingProblem[] {
  if (criteria.length === 0) {
    return [{ code: "EMPTY_CRITERIA", field: "criteria", message: "At least one criterion is required." }];
  }
  const problems: SeedingProblem[] = [];
  for (const criterion of criteria) {
    if (criterion.field.startsWith("metric:")) {
      const metric = criterion.field.slice("metric:".length);
      if (!metric || !entries.some((entry) => entry.metrics && metric in entry.metrics)) {
        problems.push({
          code: "UNKNOWN_METRIC",
          field: criterion.field,
          message: `Metric ${metric || "<empty>"} is not present in the participant data.`,
        });
      }
    }
    const kinds = new Set(
      entries
        .map((entry) => criterionValue(entry, criterion.field))
        .filter((value): value is number | string => value != null)
        .map((value) => typeof value),
    );
    if (kinds.size > 1) {
      problems.push({
        code: "INCOMPARABLE_METRIC",
        field: criterion.field,
        message: `Criterion ${criterion.field} mixes numeric and text values.`,
      });
    }
  }
  return problems;
}

function sortByCriteria<T extends SeedableEntry>(
  entries: readonly T[],
  criteria: readonly SeedingCriterion[],
  randomSeed?: string,
): T[] {
  const randomRank = new Map<string, number>();
  if (randomSeed != null) {
    deterministicShuffle(entries.map((entry) => entry.participantKey), randomSeed)
      .forEach((key, index) => randomRank.set(key, index));
  }
  return [...entries].sort((left, right) => {
    for (const criterion of criteria) {
      const comparison = compareValues(
        criterionValue(left, criterion.field),
        criterionValue(right, criterion.field),
        criterion,
        "pl",
      );
      if (comparison !== 0) return comparison;
    }
    if (randomSeed != null) {
      const randomComparison = (randomRank.get(left.participantKey) ?? 0) - (randomRank.get(right.participantKey) ?? 0);
      if (randomComparison !== 0) return randomComparison;
    }
    return left.participantKey.localeCompare(right.participantKey, "pl", { numeric: true });
  });
}

export function assignSeeds<T extends SeedableEntry>(
  entries: readonly T[],
  policy: SeedingPolicy,
): SeedingResult<T> {
  const problems = validateUniqueKeys(entries);
  if (policy.type === "preserve") {
    problems.push(...validatePermutation(entries, (entry) => entry.previousSeed, "INVALID_PREVIOUS_SEED", "previousSeed"));
  } else if (policy.type === "manual") {
    problems.push(...validatePermutation(entries, (entry) => entry.manualSeed, "INVALID_MANUAL_SEED", "manualSeed"));
  } else if (policy.type === "registration_order") {
    for (const entry of entries) {
      if (!positiveInteger(entry.registrationOrder)) {
        problems.push({
          code: "INVALID_REGISTRATION_ORDER",
          participantKey: entry.participantKey,
          field: "registrationOrder",
          message: "registrationOrder must be a positive integer.",
        });
      }
    }
  } else if (policy.type === "random") {
    if (!nonEmptyString(policy.randomSeed)) {
      problems.push({ code: "INVALID_RANDOM_SEED", field: "randomSeed", message: "randomSeed must be non-empty." });
    }
  } else if (policy.type === "ordered_criteria") {
    problems.push(...validateCriteria(entries, policy.criteria));
    if (policy.randomSeed != null && !nonEmptyString(policy.randomSeed)) {
      problems.push({ code: "INVALID_RANDOM_SEED", field: "randomSeed", message: "randomSeed must be non-empty." });
    }
  } else if (policy.type === "rank_bands") {
    for (const entry of entries) {
      if (!positiveInteger(entry.rankBand)) {
        problems.push({
          code: "INVALID_RANK_BAND",
          participantKey: entry.participantKey,
          field: "rankBand",
          message: "rankBand must be a positive integer.",
        });
      }
    }
    problems.push(...validateCriteria(entries, policy.withinBand));
    if (policy.randomSeed != null && !nonEmptyString(policy.randomSeed)) {
      problems.push({ code: "INVALID_RANDOM_SEED", field: "randomSeed", message: "randomSeed must be non-empty." });
    }
  }
  if (problems.length > 0) return { ok: false, problems };

  let ordered: T[];
  switch (policy.type) {
    case "preserve":
      ordered = [...entries].sort((left, right) => left.previousSeed! - right.previousSeed!);
      break;
    case "manual":
      ordered = [...entries].sort((left, right) => left.manualSeed! - right.manualSeed!);
      break;
    case "registration_order":
      ordered = [...entries].sort((left, right) =>
        left.registrationOrder! - right.registrationOrder! ||
        left.participantKey.localeCompare(right.participantKey, "pl", { numeric: true }),
      );
      break;
    case "alphabetical":
      ordered = [...entries].sort((left, right) =>
        (left.displayName ?? left.participantKey).localeCompare(
          right.displayName ?? right.participantKey,
          policy.locale ?? "pl",
          { sensitivity: "base", numeric: true },
        ) || left.participantKey.localeCompare(right.participantKey, "pl", { numeric: true }),
      );
      break;
    case "random": {
      if ((policy.revealOrder ?? "participant_order") === "seed_order") {
        ordered = deterministicShuffle(entries, policy.randomSeed);
      } else {
        const availableSeeds = deterministicShuffle(
          Array.from({ length: entries.length }, (_, index) => index + 1),
          policy.randomSeed,
        );
        ordered = entries
          .map((entry, index) => ({ entry, drawnSeed: availableSeeds[index] }))
          .sort((left, right) => left.drawnSeed - right.drawnSeed)
          .map(({ entry }) => entry);
      }
      break;
    }
    case "ordered_criteria":
      ordered = sortByCriteria(entries, policy.criteria, policy.randomSeed);
      break;
    case "rank_bands":
      ordered = [...entries].sort((left, right) => left.rankBand! - right.rankBand!);
      ordered = ordered.flatMap((_, index, all) => {
        if (index > 0 && all[index - 1].rankBand === all[index].rankBand) return [];
        return sortByCriteria(
          all.filter((entry) => entry.rankBand === all[index].rankBand),
          policy.withinBand,
          policy.randomSeed == null ? undefined : `${policy.randomSeed}:band:${all[index].rankBand}`,
        );
      });
      break;
  }

  const seeded = ordered.map((entry, index) => ({ entry, seed: index + 1 }));
  const seedByParticipantKey = new Map(
    seeded.map(({ entry, seed }) => [entry.participantKey, seed]),
  );
  const draws = policy.type === "random"
    ? ((policy.revealOrder ?? "participant_order") === "participant_order"
        ? entries
        : ordered
      ).map((entry, index) => ({
        drawNumber: index + 1,
        participantKey: entry.participantKey,
        seed: seedByParticipantKey.get(entry.participantKey)!,
      }))
    : [];

  return {
    ok: true,
    seeded,
    audit: {
      policyType: policy.type,
      randomSeed:
        policy.type === "random" || policy.type === "ordered_criteria" || policy.type === "rank_bands"
          ? policy.randomSeed ?? null
          : null,
      participantOrder: ordered.map((entry) => entry.participantKey),
      draws,
    },
  };
}
